<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useCategoryStore from '@/stores/categories'
import useManufacturerStore from '@/stores/manufacturers'
import { storeToRefs } from 'pinia'
import { concatenate } from '@/utils/aahUtils'
import useItemServiceUnitStore from '@/stores/item-service-units'
import { event_bus } from '@/utils/eventBus'
import { typeItem, typePrevention } from '@/utils/enum'
import useCommonStore from '@/stores/common'
import { Common, Category, GenericValueLabelType } from '@/types/types'
import prescriptionUtils from '@/pages/request/prescription/prescriptionUtils'
import { sortBy } from 'lodash'

const emits = defineEmits(['close'])
const categoryStore = useCategoryStore()
const manufacturerStore = useManufacturerStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const commonStore = useCommonStore()
const { getCategories } = storeToRefs(categoryStore)
const { getManufacturers } = storeToRefs(manufacturerStore)
const categoryList = ref(<any>[])
const typeServiceList = ref()
const typeItemList = ref(<any>[
  ...typeItem
    .filter((item: any) => item.value != 1)
    .map((item: any) => ({
      ...item,
      checked: false
    }))
])
const categorySelected = ref(<any>[])
const subCategorySelected = ref(<any>[])
const searchCategoryMenu = ref(false)
const refresh = ref(false)
const typeServiceSelected = ref(<any>[])
const typeItemSelected = ref(<any>[])
const allTop30 = ref(<any>[])

const closeModal = () => {
  emits('close')
}

const filter = ref({
  flg_service: true,
  flg_prevention: false,
  type_prevention: [false, false, false, false]
})

const typeItemPrefixes = {
  '3': 'SP',
  '4': 'MI',
  '5': 'NI',
  '6': 'OI'
}
const typeItemFood: number = 2

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
    label: 'サービス・商品名',
    field: 'name_item_service',
    align: 'left'
  },
  {
    name: 'type_item_service',
    label: '区分',
    field: 'type_item_service',
    align: 'left'
  },
  {
    name: 'name_category1',
    label: 'Cat1',
    field: 'name_category1',
    align: 'left'
  },
  {
    name: 'name_category2',
    label: 'Cat2',
    field: 'name_category2',
    align: 'left'
  },
  {
    name: 'type_prevention',
    label: '予防区分',
    field: 'type_prevention',
    align: 'left'
  },
  {
    name: 'flg_pet_custody_control',
    label: '預かり',
    field: 'flg_pet_custody_control',
    align: 'left'
  },
  {
    name: 'flg_insurance_anicom',
    label: '保険適用',
    field: 'flg_insurance_anicom',
    align: 'left'
  },
  {
    name: 'id_manufacturer/memo_item_description',
    label: '備考',
    field: 'id_manufacturer/memo_item_description',
    align: 'left'
  },
  {
    name: 'sd_icon',
    label: '',
    field: 'sd_icon',
    align: 'left'
  }
]

const tickAllCategory = ref(true)

const updateTickAllCategory = (value: boolean) => {
  tickAllCategory.value = value
  filteredCategoryList.value.forEach((category) => {
    category.checked = value
    category.sub_categories.forEach((subCategory) => {
      subCategory.checked = value
    })
  })

  if (value) {
    categorySelected.value = filteredCategoryList.value.map(
      (category) => category.id_category
    )
    const subCategory = filteredCategoryList.value.map(
      (category) => category.sub_categories
    )

    subCategorySelected.value = subCategory
      .flat()
      .map((subCategory) => subCategory.id_category)
  } else {
    // typeServiceList.value.forEach((item) => {
    //   item.checked = false
    // })
    // typeServiceSelected.value.length = 0
    categorySelected.value.length = 0
    subCategorySelected.value.length = 0
  }
  searchItemUnits()
}

const getTypePreventions = () => {
  if (typePrevention && typePrevention.length && typePrevention.length > 0) {
    return typePrevention
  }
  return []
}

const toggleSearchCategoryMenu = () => {
  searchCategoryMenu.value = !searchCategoryMenu.value
}

async function transformToTree(arr: Category[]) {
  const nodes = {}
  const tree = []

  // Create a node in the nodes map for each item in the array

  const filteredArr = arr.filter((v: Category) => {
    if (filter.value.flg_service) {
      return v.flg_for_service && v.flg_active
    }
    return (v.flg_for_item || v.flg_for_food) && v.flg_active
  })

  filteredArr.forEach((obj) => {
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
  filteredArr.forEach((obj) => {
    const parentId = obj.id_category_parent
    if (parentId) {
      if (nodes[parentId])
        nodes[parentId]?.sub_categories.push(nodes[obj.id_category])
    } else {
      tree.push(nodes[obj.id_category]) // Root nodes
    }
  })

  return tree
}

const updateCategoriesList = (value, id_category) => {
  console.log('categorySelected.value', categorySelected.value)

  if (value) {
    const findCategory = categorySelected.value.find((v) => v === id_category)
    const findTest = filteredCategoryList.value.find(
      (category) => category.id_category === id_category
    )
    console.log('findCategory', findCategory)

    if (findCategory) {
      findTest.sub_categories.forEach((subCategory) => {
        if (!subCategorySelected.value.includes(subCategory.id_category)) {
          subCategorySelected.value.push(subCategory.id_category)
        }
        subCategory.checked = true
      })
    } else {
      categorySelected.value.push(id_category)
      findTest.sub_categories.forEach((subCategory) => {
        if (!subCategorySelected.value.includes(subCategory.id_category)) {
          subCategorySelected.value.push(subCategory.id_category)
        }
        subCategory.checked = false
      })
    }
  } else {
    const findTest = filteredCategoryList.value.find(
      (category) => category.id_category === id_category
    )
    findTest.sub_categories.forEach((subCategory) => {
      subCategorySelected.value.splice(
        subCategorySelected.value.indexOf(subCategory.id_category),
        1
      )
      subCategory.checked = false
    })
    // categorySelected.value.splice(
    //   categorySelected.value.indexOf(id_category),
    //   1
    // )
  }

  checkfilteredCategoryList()
  searchItemUnits()
}

const checkfilteredCategoryList = () => {
  for (const category of filteredCategoryList.value) {
    if (!category.checked) {
      tickAllCategory.value = false
      return
    }
    for (const subCategory of category.sub_categories) {
      if (!subCategory.checked) {
        tickAllCategory.value = false
        return
      }
    }
  }

  tickAllCategory.value = true
}

const updateSubCategoriesList = (value, id_subcategory) => {
  if (value) {
    subCategorySelected.value.push(id_subcategory)
  } else {
    subCategorySelected.value.splice(
      subCategorySelected.value.indexOf(id_subcategory),
      1
    )
  }
  checkfilteredCategoryList()
  searchItemUnits()
}

async function updateUI() {
  categorySelected.value = []
  subCategorySelected.value = []
  typeServiceList.value.forEach((item) => {
    item.checked = false
  })
  typeServiceSelected.value.length = 0
  typeItemList.value.forEach((item) => {
    item.checked = false
  })
  typeItemSelected.value.length = 0

  if (filter.value.flg_service)
    typeItemList.value.forEach(
      (item: GenericValueLabelType) => (item.checked = false)
    )
  else
    typeServiceList.value.forEach(
      (itemService: Common) => (itemService.checked = false)
    )

  refresh.value = false
  categoryList.value = await transformToTree(getCategories.value)
  refresh.value = true

  await searchItemUnits()
}
const updateTypeServiceItem = (value, type) => {
  console.log('updateTypeServiceItem', value, type)

  if (filter.value.flg_service === true) {
    if (value) {
      typeServiceSelected.value.push(type)
    } else {
      typeServiceSelected.value.splice(
        typeServiceSelected.value.indexOf(type),
        1
      )
    }
  } else {
    if (value) {
      typeItemSelected.value.push(type)
    } else {
      typeItemSelected.value.splice(typeItemSelected.value.indexOf(type), 1)
    }
  }

  if (value) {
    searchCategoryMenu.value = true
  }

  // categorySelected.value.length = 0
  // const filteredCategoryIds = filteredCategoryList.value.map(
  //   (category: Category) => category.id_category
  // )

  // filteredCategoryIds.forEach((idCategory: number) => {
  //   categorySelected.value.push(idCategory)
  // })

  // const subCategory = filteredCategoryList.value.map(
  //   (category) => category.sub_categories
  // )

  // subCategorySelected.value = subCategory
  //   .flat()
  //   .map((subCategory) => subCategory.id_category)
  checkfilteredCategoryList()
  searchItemUnits()
}

const typeServiceName = (value) =>
  commonStore.getCommonTypeServiceOptionList.find((v) => v.code_func1 == value)
    ?.name_common
const typeItemName = (value) => typeItem.find((v) => v.value == value)?.label
const typePreventionName = (value) =>
  typePrevention.find((v) => v.value === value)?.label

const getTypeServiceItemName = (typeService, typeItem) => {
  if (typeService && typeItem) {
    return `${typeService}・${typeItem}`
  } else {
    return concatenate(typeService, typeItem)
  }
}
const addSelecteditems = () => {
  const selectedItemServices = allTop30.value.filter(
    (itemService) => !!itemService.checked
  )
  event_bus.emit('setItemServiceGroup', selectedItemServices)
  closeModal()
}

const getManufacturerName = (id_manufacturer) => {
  if (
    getManufacturers.value &&
    getManufacturers.value.length &&
    getManufacturers.value.length > 0
  ) {
    return getManufacturers.value.find(
      (v) => v.id_manufacturer == id_manufacturer
    )?.name_manufacturer
  }
}

const searchItemUnits = async () => {
  let searchData = { ...filter.value, no_pagination: true }
  if (filter.value.flg_service === true)
    searchData = {
      ...searchData,
      type_service: typeServiceSelected.value.join(',')
    }
  else
    searchData = { ...searchData, type_item: typeItemSelected.value.join(',') }
  // if (
  //   categorySelected.value &&
  //   categorySelected.value.length &&
  //   categorySelected.value.length > 0
  // ) {
  //   searchData = {
  //     ...searchData,
  //     id_category1: categorySelected.value.join(',')
  //   }
  // }
  // if (
  //   subCategorySelected.value &&
  //   subCategorySelected.value.length &&
  //   subCategorySelected.value.length > 0
  // ) {
  //   searchData = {
  //     ...searchData,
  //     id_category2: subCategorySelected.value.join(',')
  //   }
  // }

  const filterCategorySelected = filteredCategoryList.value.filter(
    (category) => category.checked
  )
  const filterSubCategorySelected = filteredCategoryList.value
    .map((category) => category.sub_categories)
    .flat()
    .filter((subCategory) => subCategory.checked)

  const setCategory = filterCategorySelected.map(
    (category) => category.id_category
  )
  const setSubCategory = filterSubCategorySelected.map(
    (subCategory) => subCategory.id_category
  )

  console.log('categorySelected', setCategory)
  console.log('subCategorySelected', setSubCategory)

  searchData = {
    ...searchData,
    id_category1: setCategory?.length ? setCategory.join(',') : '',
    id_category2: setSubCategory?.length ? setSubCategory.join(',') : ''
  }

  const type_prevention_active = filter.value.type_prevention
    .map((v, i) => (v ? i + 1 : -1)) // Map values to their indices if true, else -1
    .filter((i) => i !== -1)

  if (type_prevention_active)
    searchData.type_prevention = JSON.stringify(type_prevention_active)

  if (!searchData.type_service) delete searchData.type_service
  if (!searchData.type_item) delete searchData.type_item
  if (!searchData.flg_prevention) delete searchData.flg_prevention
  if (type_prevention_active.length == 0) delete searchData.type_prevention

  await itemServiceUnitStore.SearchItemServiceWithOptions({ ...searchData })

  const unsortedData =
    itemServiceUnitStore.getItemServiceWithOptionList &&
    itemServiceUnitStore.getItemServiceWithOptionList.length > 0
      ? [
          ...itemServiceUnitStore.getItemServiceWithOptionList.map(
            (item: any) => {
              item.item_service_option_list = item.item_service_option_list.map(
                (ISO: any) => {
                  // Ensure ISO.id_item_service_child is an object and handle undefined case
                  const childProps = ISO.id_item_service_child
                    ? { ...ISO.id_item_service_child }
                    : {}
                  return { ...ISO, ...childProps, checked: false }
                }
              )

              item.item_service_unit_list = item.item_service_unit_list.map(
                (ISU: any) => {
                  return { ...ISU, checked: false }
                }
              )

              return { ...item, checked: false }
            }
          )
        ]
      : []
  allTop30.value = sortBy(unsortedData, 'display_order')
}

const filteredCategoryList = computed(() => {
  const filteredList: Array<any> = []
  if (filter.value.flg_service && typeServiceSelected.value.length > 0) {
    let selectedServicesCodes =
      commonStore.getCommonTypeServiceOptionList
        .filter((v: Common) => typeServiceSelected.value.includes(v.id_common))
        .map((v: Common) => v.code_func2) ?? []

    selectedServicesCodes.forEach((serviceCode: string) => {
      filteredList.push(
        ...categoryList.value
          .filter((category: Category) =>
            category.code_category.startsWith(serviceCode)
          )
          .map((category: Category) => ({
            ...category,
            checked: false,
            sub_categories: category.sub_categories.map(
              (category: Category) => ({
                ...category,
                checked: false
              })
            )
          }))
      )
    })

    tickAllCategory.value = false
  } else if (
    filter.value.flg_service === false &&
    typeItemSelected.value.length > 0
  ) {
    typeItemSelected.value.forEach((item) => {
      if (item === typeItemFood)
        filteredList.push(
          ...categoryList.value
            .filter((category: Category) => !!category.flg_for_food)
            .map((category: Category) => ({
              ...category,
              checked: false,
              sub_categories: category.sub_categories.map(
                (category: Category) => ({
                  ...category,
                  checked: false
                })
              )
            }))
        )
      else {
        const prefix = typeItemPrefixes[item]
        filteredList.push(
          ...categoryList.value
            .filter((category: Category) =>
              category.code_category.startsWith(prefix)
            )
            .map((category: Category) => ({
              ...category,
              checked: false,
              sub_categories: category.sub_categories.map(
                (category: Category) => ({
                  ...category,
                  checked: false
                })
              )
            }))
        )
      }
    })
  }

  return filteredList
})

const checkedItemService = (value, row) => {
  allTop30.value.find(
    (item) => item.id_item_service === row.id_item_service
  ).checked = value
}

const handleFlgPrevention = (value) => {
  if (!value) {
    const isAnyTypePreventionChecked: boolean = getTypePreventions().some(
      (item, idx) => filter.value.type_prevention[idx]
    )
    if (isAnyTypePreventionChecked) {
      getTypePreventions().forEach((item, idx) => {
        filter.value.type_prevention[idx] = false
      })
      searchItemUnits()
    }
  }
}

onMounted(async () => {
  await Promise.all([
    categoryStore.fetchCategories({
      flg_for_service: 1,
      flg_for_food: 1,
      flg_for_item: 1
    }),
    commonStore.fetchPreparationCommonList({ code_common: [1] })
  ])

  categoryList.value = await transformToTree(getCategories.value)

  refresh.value = true

  typeServiceList.value = [
    ...commonStore.getCommonTypeServiceOptionList.map((item: Common) => ({
      ...item,
      label: item.name_common,
      value: item.id_common
    }))
  ]

  typeServiceList.value = sortBy(typeServiceList.value, 'display_order')

  searchItemUnits()
})
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        サービス・商品検索
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-pt-none">
      <div class="q-pt-lg">
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormRadiobtn
              label="サービス区分"
              v-model:selected="filter.flg_service"
              :val="true"
              @update:selected="updateUI"
            />
          </div>
          <div class="col-10">
            <div class="row q-col-gutter-md q-mb-sm">
              <template v-for="(item, index) in typeServiceList" :key="index">
                <div class="col-2">
                  <MtFormCheckBox
                    :label="item.label"
                    v-model:checked="item.checked"
                    :disable="filter.flg_service === false"
                    @update:checked="
                      ($event) => updateTypeServiceItem($event, item.value)
                    "
                  />
                </div>
              </template>
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm items-center">
          <div class="col-2">
            <MtFormRadiobtn
              label="商品区分"
              v-model:selected="filter.flg_service"
              :val="false"
              @update:selected="updateUI()"
            />
          </div>
          <template v-for="(item, index) in typeItemList" :key="index">
            <div class="col-2">
              <MtFormCheckBox
                :label="item.label"
                v-model:checked="item.checked"
                :disable="filter.flg_service === true"
                @update:checked="
                  ($event) => updateTypeServiceItem($event, item.value)
                "
              />
            </div>
          </template>
        </div>
        <!-- prevention feature  -->
        <!-- <div class="row q-col-gutter-md">
          <div class="col-2">
            <MtFormCheckBox
              label="予防"
              v-model:checked="filter.flg_prevention"
              @update:checked="handleFlgPrevention"
            />
          </div>
          <div class="col-10">
            <div class="row q-col-gutter-md">
              <template
                v-for="(item, index) in getTypePreventions()"
                :key="index"
                v-if="filter.flg_prevention"
              >
                <div class="col" style="min-width: 20%">
                  <MtFormCheckBox
                    v-model:checked="filter.type_prevention[index]"
                    :label="item.label"
                    @update:checked="() => searchItemUnits()"
                  />
                </div>
              </template>
            </div>
          </div>
        </div> -->
        <!-- end prevention feature -->
        <div v-if="refresh" class="q-px-lg q-py-xs q-mt-md bg-grey-200">
          <div
            :class="searchCategoryMenu ? 'justify-between' : 'justify-end'"
            class="flex no-wrap align-top cursor-pointer relative-position"
            @click="toggleSearchCategoryMenu"
          >
            <div
              v-if="!searchCategoryMenu"
              style="top: 50%; transform: translateY(-50%)"
              class="absolute-left vertical-middle"
            >
              <div>分類：サービス区分または商品区分を選択</div>
            </div>
            <transition name="slide-top-fade">
              <div class="full-width" v-if="searchCategoryMenu">
                <MtFormCheckBox
                  v-if="filteredCategoryList.length > 0"
                  label="全チェック"
                  v-model:checked="tickAllCategory"
                  @update:checked="($event) => updateTickAllCategory($event)"
                />
                <div v-for="category in filteredCategoryList" class="row">
                  <div class="col-2">
                    <MtFormCheckBox
                      :label="category.name_category"
                      v-model:checked="category.checked"
                      @update:checked="
                        ($event) =>
                          updateCategoriesList($event, category.id_category)
                      "
                    />
                  </div>
                  <div
                    v-if="
                      category.checked && category.sub_categories.length > 0
                    "
                    class="col"
                  >
                    <div class="row">
                      <MtFormCheckBox
                        :label="categoryChild.name_category"
                        v-model:checked="categoryChild.checked"
                        @update:checked="
                          ($event) =>
                            updateSubCategoriesList(
                              $event,
                              categoryChild.id_category
                            )
                        "
                        v-for="categoryChild in category?.sub_categories"
                        class="col-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </transition>
            <div>
              <q-btn
                @click.stop="toggleSearchCategoryMenu"
                icon="keyboard_arrow_down"
                size="24"
                flat
              />
            </div>
          </div>
        </div>

        <MtTable2
          :columns="columns"
          :rows="allTop30"
          :rowsBg="true"
          class="q-pt-sm q-mt-md"
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
              </div>
              <div
                v-if="col.field == 'name_item_service'"
                auto-width
                key="name_item_service"
              >
                <div class="body1 regular text-grey-900">
                  {{ row['name_item_service'] }}
                </div>
              </div>
              <div
                v-if="col.field == 'type_item_service'"
                auto-width
                key="type_item_service'"
              >
                <div class="body1 regular text-grey-900">
                  {{
                    row['type_service']
                      ? typeServiceName(row['type_service'])
                      : typeItemName(row['type_item'])
                  }}
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
                v-if="col.field == 'type_prevention'"
                auto-width
                key="type_prevention'"
              >
                <div class="body1 regular text-grey-900 text-center">
                  {{
                    row['type_prevention']
                      ? typePreventionName(row['type_prevention'])
                      : '-'
                  }}
                </div>
              </div>
              <div
                v-if="col.field == 'flg_pet_custody_control'"
                auto-width
                key="flg_pet_custody_control'"
              >
                <div class="body1 regular text-grey-900">
                  <q-icon name="circle" v-if="row['flg_pet_custody_control']" />
                </div>
              </div>
              <div
                v-if="col.field == 'flg_insurance_anicom'"
                auto-width
                key="flg_insurance_anicom'"
              >
                <div class="body1 regular text-grey-900 text-center">
                  <q-icon name="circle" v-if="row['flg_insurance_anicom']" />
                </div>
              </div>
              <div
                v-if="col.field == 'id_manufacturer/memo_item_description'"
                auto-width
                key="id_manufacturer/memo_item_description'"
              >
                <div class="body1 regular text-grey-900 text-center">
                  {{ getManufacturerName(row['id_manufacturer']) }}
                  {{ row['memo_item_description'] }}
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
                      prescriptionUtils.openItemServiceModal(
                        row.id_item_service
                      )
                    "
                  />
                </div>
              </div>
            </td>
          </template>
        </MtTable2>
      </div>
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
      </div>
    </q-card-section>
  </div>
</template>

<style scoped>
.slide-top-fade-enter-active {
  transition: all 0.3s ease;
}
.slide-top-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-top-fade-enter, .slide-top-fade-leave-to
/* .slide-fade-leave-active below version 2.1.8 */ {
  transform: translateY(-30px);
  opacity: 0;
}
</style>
