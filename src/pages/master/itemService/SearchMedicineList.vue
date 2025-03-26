<script setup lang="ts">
import MtTable2 from '@/components/MtTable2.vue'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref, nextTick, defineAsyncComponent } from 'vue'
import useMedicineUnitStore from '@/stores/medicine-units'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { get, keys, pickBy, sortBy } from 'lodash'
import MtModalHeader from '@/components/MtModalHeader.vue'
import usePrescriptionStore from '@/stores/prescription'
import { event_bus } from '@/utils/eventBus'
import {
  typeMedicineCategory,
  typeMedicineFormat,
  typeMedicineRegulation,
  typePrevention
} from '@/utils/enum'
import { Category, Common } from '@/types/types'
import mtUtils from '@/utils/mtUtils'
import SelectOptions from '@/utils/selectOptions'
import useCommonStore from '@/stores/common'
const prescriptionUtils = defineAsyncComponent(() => import('@/pages/request/prescription/prescriptionUtils'))

const emits = defineEmits(['close'])
const categoryStore = useCategoryStore()
const prescriptionStore = usePrescriptionStore()
const medicineUnitStore = useMedicineUnitStore()
const commonStore = useCommonStore()
const { getCategories } = storeToRefs(categoryStore)
const { getMedicineUnits } = storeToRefs(medicineUnitStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const categoryList = ref(<any>[])
const categorySelected = ref(<any>[])
const subCategorySelected = ref(<any>[])
const searchCategoryMenu = ref(false)
const refreshTable = ref(false)
const filter = ref({
  flg_for_dog: false,
  flg_for_cat: false,
  flg_for_rabbit: false,
  flg_for_bird: false,
  flg_for_other_animal: false,
  flg_drip_carrier: false
})

const props = defineProps({
  importMode: {
    default: false,
    type: Boolean
  },
  normalMode: {
    default: true,
    type: Boolean
  },
  // selectedItems: Function,
  source: {
    type: String,
    default: 'prescription'
  }
})

const columns = [
  {
    name: 'checkbox',
    label: '',
    field: 'checkbox',
    align: 'center'
  },
  {
    name: 'code_item_service',
    label: '商品CD',
    field: 'code_item_service',
    align: 'left'
  },
  {
    name: 'name_item_service',
    label: '医薬品名',
    field: 'name_item_service',
    align: 'left'
  },
  {
    name: 'name_category1',
    label: '大分類',
    field: 'name_category1',
    align: 'left'
  },
  {
    name: 'name_category2',
    label: '中分類',
    field: 'name_category2',
    align: 'left'
  },
  {
    name: 'type_medicine_format',
    label: '形状',
    field: 'type_medicine_format',
    align: 'left'
  },
  {
    name: 'type_medicine_category',
    label: '製剤',
    field: 'type_medicine_category',
    align: 'left'
  },
  { name: 'flg_for_', label: '使用可', field: 'flg_for_', align: 'left' },
  {
    name: 'flg_prohibited_for_',
    label: '禁忌',
    field: 'flg_prohibited_for_',
    align: 'left'
  },
  {
    name: 'type_prevention',
    label: '予防区分',
    field: 'type_prevention',
    align: 'left'
  },
  {
    name: 'flg_insurance_anicom',
    label: '保険適用',
    field: 'flg_insurance_anicom',
    align: 'left'
  },
  {
    name: 'type_medicine_regulation',
    label: '規制',
    field: 'type_medicine_regulation',
    align: 'left'
  },
  { name: 'url_nval', label: 'NVALリンク', field: 'url_nval', align: 'left' },
  {
    name: 'sd_icon',
    label: '',
    field: 'sd_icon',
    align: 'left'
  }
]
interface MedicineCategory {
  col: number
  label: string
  codes: string[]
  checked: boolean
}

const ANIMAL_CODE_FUNCTIONS = {
  dog: ['11', '12', '13'],
  cat: ['2'],
  rabbit: ['4'],
  bird: ['5']
}

const tickAllCategory = ref(true)

const updateTickAllCategory = (value: boolean) => {
  tickAllCategory.value = value

  if (value) {
    for (const category of filteredCategory.value) {
      for (const sub of category.sub_categories) {
        subCategorySelected.value[sub.id_category] = true
      }
    }
  } else {
    filteredCategory.value.length = 0
    categorySelected.value = {}
    subCategorySelected.value = {}
    searchCategoryMenu.value = false
  }
  searchMedicineUnit()
}

const adjustMenuHeight = () => {
  nextTick(() => {
    searchCategoryMenuRef.value.style.height = 'auto'
    const height = searchCategoryMenuRef.value.scrollHeight + 'px'
    searchCategoryMenuRef.value.style.height = height
  })
}
const checkfilteredCategoryList = () => {
  const filteredCategory = []
  categoryList.value.forEach((cat) => {
    if (
      categorySelected.value.hasOwnProperty(cat.id_category) &&
      categorySelected.value[cat.id_category] === true
    ) {
      filteredCategory.push(cat)
    }
  })

  if (filteredCategory.length === 0) {
    tickAllCategory.value = false
    return
  } else {
    for (const category of filteredCategory) {
      for (const sub of category.sub_categories) {
        if (subCategorySelected.value[sub.id_category] === false) {
          tickAllCategory.value = false
          return
        }
      }
    }
  }

  tickAllCategory.value = true
}
const selectedCategory = ref([])
const toggleParentCategory = (category, value) => {
  // Only for inject Mode
  // if (!props.normalMode) {
  //   if (category && ['MD12', 'MD13', 'MD14'].includes(category.code_category)) {
  //     if (category.sub_categories && category.sub_categories.length > 0)
  //       subCategorySelected.value[category.sub_categories[0].id_category] =
  //         value
  //   }
  // } else {
  if (value) {
    const findCategoryId = selectedCategory.value.find(
      (cat) => cat === category.id_category
    )

    if (!findCategoryId) {
      selectedCategory.value.push(category.id_category)
      category.sub_categories.forEach((sub) => {
        subCategorySelected.value[sub.id_category] = false
      })
    } else {
      category.sub_categories.forEach((sub) => {
        subCategorySelected.value[sub.id_category] = true
      })
    }
    searchCategoryMenu.value = true
  }
  // category.sub_categories.forEach((sub) => {
  //   subCategorySelected.value[sub.id_category] = false
  // })
  // }
  setfilteredCategory()
  checkfilteredCategoryList()
  searchMedicineUnit()
}

const updateChildCategory = () => {
  checkfilteredCategoryList()
  searchMedicineUnit()
}

const filteredCategory = ref([])
const searchCategoryMenuRef = ref()

const setfilteredCategory = () => {
  filteredCategory.value.length = 0
  categoryList.value.forEach((cat) => {
    if (
      categorySelected.value.hasOwnProperty(cat.id_category) &&
      categorySelected.value[cat.id_category] === true
    ) {
      filteredCategory.value.push(cat)
    }
  })
  if (filteredCategory.value.length === 0) {
    searchCategoryMenu.value = false
  } else {
    adjustMenuHeight()
  }
}

const typeMedicineFormatName = (value) =>
  typeMedicineFormat.find((v) => v.value === value)
const typeMedicineCategoryName = (value) =>
  typeMedicineCategory.find((v) => v.value === value)
const typeMedicineRegulationName = (value) =>
  typeMedicineRegulation.find((v) => v.value === value)
const typePreventionName = (value) =>
  typePrevention.find((v) => v.value === value)
const flgForGenerate = (medicine) => {
  let listFlg = []
  if (medicine.flg_for_dog) listFlg.push('犬')
  if (medicine.flg_for_cat) listFlg.push('猫')
  if (medicine.flg_for_rabbit) listFlg.push('うさぎ')
  if (medicine.flg_for_bird) listFlg.push('鳥類')
  if (medicine.flg_for_other_animal) listFlg.push('その他')
  return listFlg.join(' / ')
}
const flgProhibitedForGenerate = (medicine) => {
  let listFlg = []
  if (medicine.flg_prohibited_for_dog) listFlg.push('犬')
  if (medicine.flg_prohibited_for_cat) listFlg.push('猫')
  return listFlg.join(' / ')
}
const toggleSearchCategoryMenu = (event: Event) => {
  event.stopPropagation()
  searchCategoryMenu.value = !searchCategoryMenu.value
}
const closeModal = () => {
  emits('close')
}

const checkedItemService = (value, row: any) => {
  if (value) {
    if (row.isParent) {
      getMedicineUnits.value.map((medicine) => {
        if (medicine.id_item_service == row.id_item_service) {
          medicine.checked = true
        }
      })
    }

    if (!row.isParent) {
      getMedicineUnits.value.map((medicine) => {
        if (
          medicine.id_item_service == row.id_item_service &&
          medicine.isParent
        ) {
          medicine.checked = true
        }
      })
    }
  }

  if (!value) {
    if (row.isParent) {
      getMedicineUnits.value.map((medicine) => {
        if (medicine.id_item_service == row.id_item_service) {
          medicine.checked = false
        }
      })
    }
  }
}

async function importMedicine() {
  const itemMap = new Map()

  getMedicineUnits.value
    .filter((medicine) => medicine?.checked)
    .map((medicine) => {
      if (!itemMap.has(medicine.id_item_service)) {
        if (medicine.isParent) {
          itemMap.set(medicine.id_item_service, {
            id_item_service: medicine.id_item_service,
            item_service_unit_list: [],
            code_item_service: medicine.code_item_service
          })
        }
      }

      if (itemMap.has(medicine.id_item_service)) {
        if (!medicine.isParent) {
          itemMap
            .get(medicine.id_item_service)
            .item_service_unit_list.push(medicine.id_item_service_unit)
        }
      }
    })

  const response = await mtUtils.callApi(
    SelectOptions.reqMethod.POST,
    '/mst/import-medicine',
    {
      item_service_list: [...itemMap.values()]
    }
  )
}

const searchMedicineUnit = async () => {
  let searchData = { no_pagination: true },
    idCmAnimals: Common[] | [] = []
  // searchData.is_operator_or = !isAnd.value
  // Filter by flg_for_
  if (filter.value.flg_for_dog) {
    idCmAnimals.push(
      ...getCommonTypeAnimalOptionList.value.filter((common: Common) =>
        ANIMAL_CODE_FUNCTIONS.dog.includes(common.code_func1)
      )
    )
    searchData = { ...searchData, flg_for_dog: true }
  }
  if (filter.value.flg_for_cat) {
    searchData = { ...searchData, flg_for_cat: true }
    idCmAnimals.push(
      ...getCommonTypeAnimalOptionList.value.filter((common: Common) =>
        ANIMAL_CODE_FUNCTIONS.cat.includes(common.code_func1)
      )
    )
  }
  if (filter.value.flg_for_rabbit) {
    searchData = { ...searchData, flg_for_rabbit: true }
    idCmAnimals.push(
      ...getCommonTypeAnimalOptionList.value.filter((common: Common) =>
        ANIMAL_CODE_FUNCTIONS.rabbit.includes(common.code_func1)
      )
    )
  }
  if (filter.value.flg_for_bird) {
    searchData = { ...searchData, flg_for_bird: true }
    idCmAnimals.push(
      ...getCommonTypeAnimalOptionList.value.filter((common: Common) =>
        ANIMAL_CODE_FUNCTIONS.bird.includes(common.code_func1)
      )
    )
  }
  if (filter.value.flg_for_other_animal) {
    searchData = { ...searchData, flg_for_other_animal: true }
    idCmAnimals.length = 0 // includes all animals
  }

  if (
    filter.value.flg_for_dog ||
    filter.value.flg_for_cat ||
    filter.value.flg_for_rabbit ||
    filter.value.flg_for_bird ||
    filter.value.flg_for_other_animal
  ) {
    searchData = {
      ...searchData,
      id_cm_animal: idCmAnimals
        .map((animal: Common) => animal.id_common)
        .join(',')
    }
  }

  // Filter category
  const catSelected = pickBy(categorySelected.value, (value) => value)
  const filterCategory = keys(catSelected).join(',') || ''
  searchData = { ...searchData, id_category1: filterCategory }

  // Filter sub category
  const sCat2 = pickBy(subCategorySelected.value, (value) => value)
  const filterSubCategory = keys(sCat2).join(',') || ''
  searchData = { ...searchData, id_category2: filterSubCategory }

  if (props.normalMode) {
    searchData = { ...searchData, flg_medicine: true }
  }

  if (!props.normalMode) {
    if (filter.value.flg_drip_carrier)
      searchData = { ...searchData, flg_drip_carrier: true }

    // if (!filter.value.flg_drip_carrier) {
    //   if (keys(catSelected).length === 0 && keys(sCat2).length === 0) return
    // }
    searchData = { ...searchData, flg_for_inject: true }
  }
  // Call fetch
  await medicineUnitStore.fetchMedicineUnits({ ...searchData })
}
async function transformToTree(arr: Category[]) {
  const nodes = {}
  const tree = []

  const filteredArr = arr.filter((cat: Category) => cat.flg_active)
  const sortedFilter = sortBy(filteredArr, ['display_order'])
  // Create a node in the nodes map for each item in the array
  sortedFilter.forEach((obj) => {
    const id = obj.id_category
    nodes[id] = {
      ...obj,
      label: obj.name_category,
      value: obj.id_category,
      checked: false,
      sub_categories: nodes[id]?.sub_categories || []
    }
  })

  // Assign children to their respective parent nodes
  sortedFilter.forEach((obj) => {
    const parentId = obj.id_category_parent
    if (parentId) {
      if (nodes[parentId])
        nodes[parentId].sub_categories.push(nodes[obj.id_category])
    } else {
      tree.push(nodes[obj.id_category]) // Root nodes
    }
  })

  return tree
}

const beforeEnter = (el: HTMLElement) => {
  el.style.height = '0'
}
const enter = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px'
}
const leave = (el: HTMLElement) => {
  el.style.height = el.scrollHeight + 'px'
  setTimeout(() => {
    el.style.height = '0'
  })
}

const addSelecteditems = () => {
  const selectedMedicineUnits = getMedicineUnits.value.filter(
    (medicine) => medicine.checked
  )

  event_bus.emit('setInjectKeyword', selectedMedicineUnits)
  closeModal()
}

const medicineUnits = computed(() =>
  sortBy(getMedicineUnits.value, 'display_order')
)

onMounted(async () => {
  let params = { flg_for_medicine: 1, flg_for_inject: '0' }
  useMedicineUnitStore().resetMedicineUnitList()
  commonStore.fetchPreparationCommonList({ code_common: [1] })

  if (!props.normalMode) {
    params['flg_for_medicine'] = true
    params['flg_for_inject'] = true
  }

  if (!props.importMode) {
    await Promise.all([categoryStore.fetchCategories({ ...params })])
    categoryList.value = await transformToTree(getCategories.value)
    return
  }

  await Promise.all([categoryStore.fetchCategories({ ...params })])

  categoryList.value = await transformToTree(getCategories.value)
})
</script>
<template>
  <q-form>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        医薬品検索
      </q-toolbar-title>
      <div v-if="!normalMode">
        <MtFormCheckBox
          class="q-mr-sm"
          v-model:checked="filter.flg_drip_carrier"
          label="点滴ベース溶液"
          @update:checked="searchMedicineUnit"
        />
      </div>

      <!-- <MtFormCheckBox
        v-model:checked="isAnd"
        @update:checked="searchMedicineUnit"
        class="q-mr-sm"
        label="AND検索"
      /> -->
    </MtModalHeader>
    <q-card-section class="content q-px-xl q-pt-none">
      <div class="q-px-lg q-pt-lg">
        <div class="row items-center">
          <div class="col-1">大分類</div>
          <div class="col-11 row q-gutter-xs items-center">
            <MtFormCheckBox
              class="col-2"
              v-for="(item, idx) in categoryList"
              :key="idx"
              v-model:checked="categorySelected[item.id_category]"
              :label="item.label"
              @update:checked="(val) => toggleParentCategory(item, val)"
            />
          </div>
        </div>
        <!-- <div class="row">
          <div class="col-1">対象動物</div>
          <div class="col-1">
            <MtFormCheckBox
              v-model:checked="filter.flg_for_dog"
              @click="searchMedicineUnit"
              label="犬用"
            />
          </div>
          <div class="col-1">
            <MtFormCheckBox
              v-model:checked="filter.flg_for_cat"
              @click="searchMedicineUnit"
              label="猫用"
            />
          </div>
          <div class="col-1">
            <MtFormCheckBox
              v-model:checked="filter.flg_for_rabbit"
              @click="searchMedicineUnit"
              label="ウサギ用"
            />
          </div>
          <div class="col-1">
            <MtFormCheckBox
              v-model:checked="filter.flg_for_bird"
              @click="searchMedicineUnit"
              label="鳥類用"
            />
          </div>
          <div class="col-1">
            <MtFormCheckBox
              v-model:checked="filter.flg_for_other_animal"
              @click="searchMedicineUnit"
              label="その他動物用"
            />
          </div>
        </div> -->
        <!-- <div class="row">
          <div class="col-1">対象部位</div>
          <div class="col-1">
            <MtFormCheckBox label="消化器" />
          </div>
          <div class="col-1">
            <MtFormCheckBox label="循環器" />
          </div>
          <div class="col-1">
            <MtFormCheckBox label="泌尿器" />
          </div>
          <div class="col-1">
            <MtFormCheckBox label="皮膚" />
          </div>
          <div class="col-1">
            <MtFormCheckBox label="肝臓" />
          </div>
          <div class="col-1">
            <MtFormCheckBox label="アレルギー" />
          </div>
          <div class="col-1">
            <MtFormCheckBox label="耳" />
          </div>
        </div> -->
      </div>
      <!-- <div v-if="!normalMode" class="q-px-lg q-pt-lg">
        <div class="row">
          <div class="col-2">
            <MtFormCheckBox
              v-model:checked="filter.flg_drip_carrier"
              label="点滴ベース溶液"
              @update:checked="searchMedicineUnit"
            />
          </div>
        </div>
      </div> -->
      <div
        class="q-px-lg q-py-xs q-mt-md bg-grey-200 cursor-pointer"
        @click="toggleSearchCategoryMenu"
      >
        <div
          :class="searchCategoryMenu ? 'justify-between' : 'justify-end'"
          class="flex no-wrap align-top relative-position"
        >
          <div
            v-if="!searchCategoryMenu"
            style="top: 50%; transform: translateY(-50%)"
            class="absolute-left vertical-middle"
          >
            <div>中分類</div>
          </div>
          <transition
            name="slide-top-fade"
            @before-enter="beforeEnter"
            @enter="enter"
            @leave="leave"
            ref="searchCategoryMenuRef"
          >
            <div class="full-width" v-show="searchCategoryMenu">
              <MtFormCheckBox
                v-if="filteredCategory.length > 0 && searchCategoryMenu"
                label="全チェック"
                v-model:checked="tickAllCategory"
                @update:checked="($event) => updateTickAllCategory($event)"
              />
              <div
                v-for="category in filteredCategory"
                class="row"
                v-if="searchCategoryMenu"
              >
                <div class="col-2">
                  <MtFormCheckBox
                    v-model:checked="categorySelected[category.id_category]"
                    @click="
                      toggleParentCategory(
                        category,
                        categorySelected[category.id_category]
                      )
                    "
                    :label="category.name_category"
                  />
                </div>
                <div
                  v-if="
                    categorySelected[category.id_category] &&
                    category.sub_categories.length > 0
                  "
                  class="col"
                >
                  <div class="row q-gutter-x-sm">
                    <MtFormCheckBox
                      :label="categoryChild.name_category"
                      v-model:checked="
                        subCategorySelected[categoryChild.id_category]
                      "
                      @click="updateChildCategory()"
                      v-for="categoryChild in category.sub_categories"
                      class="col-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </transition>
          <div>
            <q-btn
              @click="toggleSearchCategoryMenu"
              icon="keyboard_arrow_down"
              size="24"
              flat
            />
          </div>
        </div>
      </div>
      <MtTable2
        class="q-mt-md"
        :columns="columns"
        :rows="medicineUnits"
        :rowsBg="true"
        flat
      >
        <template v-slot:row="{ row }">
          <td
            class="cursor-pointer"
            v-for="(col, index) in columns"
            :key="index"
            @click="
              () => {
                row.checked = !row.checked
                checkedItemService(row.checked, row)
              }
            "
          >
            <div v-if="col.field == 'checkbox'">
              <MtFormCheckBox
                v-model:checked="row.checked"
                class="text-grey-900"
                @update:checked="checkedItemService($event, row)"
              />
            </div>
            <div
              v-if="col.field == 'code_item_service'"
              auto-width
              key="code_item_service"
            >
              <div class="body1 regular text-grey-900">
                {{ row['code_item_service'] }}
              </div>
              <div class="body1 regular text-grey-900 q-ml-md">
                {{ row['code_item_service_unit'] }}
              </div>
            </div>
            <div
              v-if="col.field == 'name_item_service'"
              auto-width
              key="name_item_service"
            >
              <div
                v-if="!row['id_item_service_unit']"
                class="body1 regular text-grey-900"
              >
                {{ row['name_item_service'] }}
              </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row['name_service_item_unit'] }}
              </div>
            </div>
            <div
              v-if="col.field == 'name_category1'"
              auto-width
              key="name_category1"
            >
              <div class="body1 regular text-grey-900">
                {{ row['name_category1'] }}
              </div>
            </div>
            <div
              v-if="col.field == 'name_category2'"
              auto-width
              key="name_category2"
            >
              <div class="body1 regular text-grey-900">
                {{ row['name_category2'] }}
              </div>
            </div>
            <div
              v-if="col.field == 'type_medicine_format'"
              auto-width
              key="type_medicine_format"
            >
              <div class="body1 regular text-grey-900">
                {{
                  row['medicine']
                    ? typeMedicineFormatName(
                        row['medicine']['type_medicine_format']
                      )?.label
                    : '-'
                }}
              </div>
            </div>
            <div
              v-if="col.field == 'type_medicine_category'"
              auto-width
              key="type_medicine_category"
            >
              <div class="body1 regular text-grey-900">
                {{
                  row['medicine']
                    ? typeMedicineCategoryName(
                        row['medicine']['type_medicine_category']
                      )?.label
                    : '-'
                }}
              </div>
            </div>
            <div v-if="col.field == 'flg_for_'" auto-width key="flg_for_">
              <div class="body1 regular text-grey-900">
                {{ row['medicine'] ? flgForGenerate(row['medicine']) : '-' }}
              </div>
            </div>
            <div
              v-if="col.field == 'flg_prohibited_for_'"
              auto-width
              key="flg_prohibited_for_"
            >
              <div class="body1 regular text-darkred text-bold">
                {{
                  row['medicine']
                    ? flgProhibitedForGenerate(row['medicine'])
                    : '-'
                }}
              </div>
            </div>
            <div
              v-if="col.field == 'type_prevention'"
              auto-width
              key="type_prevention"
            >
              <div class="body1 regular text-grey-900">
                {{ typePreventionName(row['type_prevention'])?.label || '-' }}
              </div>
            </div>
            <div
              v-if="col.field == 'flg_insurance_anicom'"
              auto-width
              key="flg_insurance_anicom"
            >
              <div class="body1 regular text-grey-900">
                <div v-if="row['flg_insurance_anicom']">
                  <q-icon name="circle" size="13px" />
                </div>
                <div v-else>-</div>
              </div>
            </div>
            <div
              v-if="col.field == 'type_medicine_regulation'"
              auto-width
              key="type_medicine_regulation"
            >
              <div class="body1 regular text-grey-900">
                {{
                  row['medicine']
                    ? typeMedicineRegulationName(
                        row['medicine']['type_medicine_regulation']
                      )?.label
                    : '-'
                }}
              </div>
            </div>
            <div v-if="col.field == 'url_nval'" auto-width key="url_nval">
              <div class="body1 regular text-grey-900">
                {{ row['medicine'] ? row['medicine']['url_nval'] : '-' }}
              </div>
            </div>
            <div v-if="col.field == 'sd_icon'" auto-width key="sd_icon'">
              <div class="body1 regular text-grey-900 text-center">
                <q-btn
                  class="text-grey-700 quiz-btn"
                  flat
                  icon="quiz"
                  round
                  size="14px"
                  @click.stop="
                    prescriptionUtils.openItemServiceModal(row.id_item_service)
                  "
                />
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn
          outline
          class="bg-grey-100 text-grey-800"
          type="button"
          @click="closeModal()"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          color="primary"
          label="追加"
          class="q-ml-sm"
          @click="addSelecteditems"
        />
        <q-btn
          v-if="props.importMode"
          class="bg-grey-100 text-grey-800 q-ml-sm"
          outline
          type="button"
          @click="importMedicine()"
        >
          Import
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style scoped>
.slide-top-fade-enter-active,
.slide-top-fade-leave-active {
  transition: height 0.5s ease;
}
</style>
