<script lang="ts" setup>
import type { Ref } from 'vue'
import { onMounted, reactive, ref, nextTick, h, toRaw } from 'vue'
import { storeToRefs } from 'pinia'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import useCategoryStore from '@/stores/categories'
// import useLabsStore from '@/stores/labs'
import UpdateLabModal from '@/pages/master/lab/UpdateLabModal.vue'
import UpdateLabSetModal from '@/pages/master/lab/UpdateLabSetModal.vue'
import mtUtils from '@/utils/mtUtils'
// import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { useRoute, useRouter } from 'vue-router'
import { LAB, LABGROUPQPARAM } from './types_lab'
import useCommonStore from '@/stores/common'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { menuHelperContents } from '@/utils/menuHelperContents'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useLabSetStore from '@/stores/lab-sets'
import _, { debounce, forEach, groupBy, mapValues, sortBy } from 'lodash'
import useLabDeviceStore from '@/stores/lab-devices'
import useCliCommonStore from '@/stores/cli-common'
import { Common, GenericValueLabelType, Lab } from '@/types/types'
// import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useLabStore from '@/stores/labs'
import { QSpinner } from 'quasar'

const categoryStore = useCategoryStore()
const commonStore = useCommonStore()
const labSetStore = useLabSetStore()
const labDeviceStore = useLabDeviceStore()
const labStore = useLabStore()
const router = useRouter()
const route = useRoute()

const { getCategoriesLB1, getCategoriesLB2 } = storeToRefs(categoryStore)
const { getCommonDeviceOptionActiveList, getCommonDeviceOptionList, getCommonUnitOptionList } = storeToRefs(commonStore)
const { getCliCommonOuterLabRef } = storeToRefs(useCliCommonStore())

const columns = [
  {
    name: 'code_lab',
    label: '検査項目CD',
    field: 'code_lab',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'name_lab',
    label: '項目名',
    field: 'name_lab',
    align: 'left'
  },
  {
    name: 'name_lab_en',
    label: '英名',
    field: 'name_lab_en',
    align: 'left'
  },
  {
    name: 'flg_output_text',
    label: '数値/文字',
    field: 'flg_output_text',
    align: 'left'
  },
  {
    name: 'id_cm_unit',
    label: '単位',
    field: 'id_cm_unit',
    align: 'left'
  },
  {
    name: 'memo_lab',
    label: '印刷説明',
    field: 'memo_lab',
    align: 'left'
  },
  {
    name: 'update_display_order',
    label: '',
    field: 'update_display_order',
    align: 'left'
  }
]

const search: LABGROUPQPARAM = reactive({
  lab_set: '1',
  code_labcat2: '',
  device: '',
  id_cli_common: ''
})

const labList: Ref<LAB[]> = ref([])
const labDeviceList: Ref<LAB[]> = ref([])
const labRefList: any = ref([])

const categoriesLB2DefaultList = reactive<GenericValueLabelType[]>([])
const categoriesLB2List = ref<GenericValueLabelType[]>([])

const commonDeviceDefaultList = reactive<GenericValueLabelType[]>([])
const commonDeviceList = ref<GenericValueLabelType[]>([])

const commonOuterLabDefaultList = reactive<GenericValueLabelType[]>([])
const commonOuterLabList = ref<GenericValueLabelType[]>([])

const categoryLabCounts = ref<{ [key: string]: number } | null>(null)

const LAB_SET = 1, LAB_DEVICE = 2

const openAddModal = async () => {
  const labText =  search.lab_set == 1 ? 'lab-set' :  search.lab_set == 2 ? 'lab-device' : 'Unknown';
  await mtUtils.mediumPopup(UpdateLabSetModal,{lab_set_type: labText})

  init(true)
}
const onRowClickSet = async (row: Lab) => {
  await mtUtils.mediumPopup(UpdateLabSetModal, {
    id_category: row.id_category,
    lab_set_type: search.lab_set == '1' ? 'lab-set' : search.lab_set == '2' ? 'lab-device' : 'lab-ref',
    id_device: row.id_cm_device ? row.id_cm_device : row.id_category2_lb2
  })

  init(true)
}
const onRowClick = async (row) => {
  const category_lb1 = getCategoriesLB1.value.find((v) => v.id_category == row.id_category2_lb1)
  const device = search.device
  await mtUtils.mediumPopup(UpdateLabModal, { id_lab: row.id_lab, lab_set_type: search.lab_set, category_lb1, device, lab_set_device: row })

  init(true)
}

const changeLabSet = (value) => {
  search.id_cli_common = ''
  search.id_category2_lb2 = ''
  search.device = ''
  search.code_labcat2 = ''
  
  router.push({ query: {} })
  if (value == '1') {
    router.push({ query: {type: 'lab-set'} })
    fetchLabs()
  }

  if (value == '2') {
    router.push({ query: {type: 'lab-device'} })
  }

  if (value == '3') {
    router.push({ query: {type: 'outer-ref'} })
    useCliCommonStore().fetchPreparationCliCommonList({ code_cli_common: [19] }, true)
  }
  
}
const changeCategory = (value: number) => {
  const payload = { id_category: value }
  fetchLabs(payload)
};

const init = async (is_update_store: boolean = false) => {
  const type = route.query.type
  if (type == 'lab-set') {
    if (route.query.id) {
      const id_category = route.query.id
      search.code_labcat2 = getCategoriesLB2.value.find((v) => v.id_category == id_category)
      search.code_labcat2.label = getCategoriesLB2.value.find((v) => v.id_category == id_category)?.name_category
      fetchLabs({ id_category })
      if (is_update_store) {
        await labSetStore.fetchPreparationLabSets()
        initLabCounts(Number(id_category!))
      }
    }
  } else if (type == 'lab-device') {
    search.lab_set = '2'
    if (route.query.id) {
      search.device = getCommonDeviceOptionActiveList.value.find((v) => v.id_common == route.query.id)
      fetchLabDevice(route.query.id)
      if (is_update_store) {
        await labDeviceStore.fetchPreparationLabDevices()
      }
    }
  } else if (type == 'outer-ref') {
    search.lab_set = '3'
    if (route.query.id) {
      search.id_cli_common = getCliCommonOuterLabRef.value.map((v) => ({ ...v, label: v.name_cli_common.trim()})).find((v) => v.id_cli_common == route.query.id)
      changeOuterLabRef(route.query.id)
    }
  }
}

const fetchLabs = async (value: {id_category: any} | null = null) => {
  if (!value) {
    router.push({ query: { type: 'lab-set' } })
    labList.value = []
  } else {
    if (value.id_category != '') {
      router.push({ query: { type: 'lab-set', id: value.id_category } })
      await labSetStore.fetchLabSets({
        id_category2_lb2: value.id_category,
        no_pagination: true,
      })
    }

    const lab_sets = labSetStore.getLabSets.map(v => {
      const category = categoryStore.getAllCategories.find(c => c.id_category == v.lab?.id_category2_lab)
      return {...v, category}
    })
    labList.value = mappingLabList(mapValues(
      groupBy(sortBy(lab_sets, 'category.display_order'), 'id_category2_lb2'),
      (itemsByCategory2Lb2) => mapValues(
        groupBy(itemsByCategory2Lb2, 'id_cm_device'),
        (itemsByDevice) => groupBy(sortBy(itemsByDevice, 'display_order'), 'id_category2_lb1')
      )
    ))
  }
}

const changeDevice = (value) => {
  router.push({ query: { type: 'lab-device', id: value } })
  fetchLabDevice(value)
}

const changeOuterLabRef = async (value) => {
  if (!value) {
    router.push({ query: { type: 'outer-ref' } })
    labRefList.value = []
  } else {
    router.push({ query: { type: 'outer-ref', id: value } })
    await labDeviceStore.fetchLabRefList({
      code_device: value
    })
    labRefList.value = labDeviceStore.getLabRefList
  }
}

const fetchLabDevice = async (value: number | null = null) => {
  labDeviceList.value = []
  if (!value) {
    labDeviceList.value = []
  } else {
    await labDeviceStore.fetchLabDevices({
      code_device: value,
    })
    let newList = [] as Array<object>
    const lab_devices_mapping = labDeviceStore.getLabDevices.filter((v) => v.lab).map(v => {
      const category = categoryStore.getAllCategories.find(c => c.id_category == v.lab?.id_category2_lab)
      return {...v, category}
    })
    const lab_devices = groupBy(sortBy(lab_devices_mapping, 'category.display_order'), 'lab.id_category2_lab')
    
    forEach(lab_devices, (value1, key1) => {
      const category_lb1 = getCategoriesLB1.value.find((v) => v.id_category == key1)
      newList.push({
        isCategoryLB2: true,
        id_category: key1,
        name_category: category_lb1?.name_category,
      })
      forEach(sortBy(value1, 'display_order'), (value2, key2) => {
        newList.push({
          ...value2,
          memo_lab: value2.memo_lab,
          showUpArrow: key2 !== 0,
          showDownArrow: (value1.length - 1) !== key2
        })
      })
    })
    labDeviceList.value = newList
  }
}

const mappingLabList = (list: Object) => {
  const newList = [] as Array<object>

  forEach(list, (value1, key1) => {
    const category_lb2 = getCategoriesLB2.value.find((v) => v.id_category == key1)
    newList.push({isCategoryLB2: true, ...category_lb2, id_category: key1, name_category: category_lb2?.name_category})
    forEach(value1, (value2, key2) => {
      const device = getCommonDeviceOptionList.value.find((v) => v.id_common == key2)
      newList.push({isDevice: true, id_category: key2, name_device: device?.name_common ? device?.name_common + ' ' + device?.code_func1 : '機器なし'})
      forEach(value2, (value3, key3) => {
        const category_lb1 = getCategoriesLB1.value.find((v) => v.id_category == key3)
        newList.push({isCategoryLB1: true, id_category: key3, name_category: category_lb1?.name_category})
        forEach(value3, (value4, key4) => {
          const tempValue4 = {
            ...value4,
            showUpArrow: key4 !== 0,
            showDownArrow: (value3.length - 1) !== key4
          }
          newList.push(tempValue4)
        })
      })
    })
  })
  return newList
}

const getCategoryName = (id_category: string) => categoryStore.getAllCategories.find((v) => v.id_category == id_category)?.name_category
const getUnitName = (id_common: number) => getCommonUnitOptionList.value.find((v) => v.id_common == id_common)?.name_common

const clearCategoryFilter = () => {
  fetchLabs()
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.labList.title,
    content: menuHelperContents.labList.content,
  })
}

const moveUp = (idLabEntity: number, direction: 'up' | 'down' = 'up') => {
  if(search.lab_set == LAB_SET) {
    const index = labList.value.findIndex((v) => v.id_lab_set === idLabEntity)
    if (index !== -1) {
      const groupedLabSets = labList.value.filter((v) => 
        v.id_cm_device == labList.value[index].id_cm_device &&
        v.id_category2_lb1 == labList.value[index].id_category2_lb1 &&
        v.id_category2_lb2 == labList.value[index].id_category2_lb2
      ).sort((a, b) => a.display_order - b.display_order)
      const refindIndex = groupedLabSets.findIndex((v) => v.id_lab_set === idLabEntity)
      if (refindIndex > -1 && refindIndex !== undefined) {
        // Swap the items
        if (direction == 'up') {
          const temp = groupedLabSets[refindIndex - 1]
          groupedLabSets[refindIndex - 1] = groupedLabSets[refindIndex]
          groupedLabSets[refindIndex] = temp
        } else {
          const temp = groupedLabSets[refindIndex + 1]
          groupedLabSets[refindIndex + 1] = groupedLabSets[refindIndex]
          groupedLabSets[refindIndex] = temp

        }

        nextTick().then(async () => {
          const reIndexList: number[] = [] // store the index of the items that are being moved
          const displayOrderArr = groupedLabSets.map((v: any, k: number) => {
            const newOrder = k + 1
            _.set(groupedLabSets, `[${k}].display_order`, newOrder)
            _.set(groupedLabSets, `[${k}].showUpArrow`, k !== 0)
            _.set(groupedLabSets, `[${k}].showDownArrow`, (groupedLabSets.length - 1) !== k)
            const reIndex = labList.value.findIndex((v2: any) => v2.id_lab_set === v.id_lab_set)
            if (reIndex !== -1) {
              reIndexList.push(reIndex)
              labList.value[reIndex] = v
            }
            return {
              id_lab: v.id_lab,
              id_lab_set: parseInt(v.id_lab_set),
              display_order: newOrder
            }
          })
          
          await labSetStore.updateLabSetDisplayOrder({ lab_set: displayOrderArr })
          const startIndexToReplace = Math.min(...reIndexList)
          const splicedLabList = _.cloneDeep(labList.value).splice(startIndexToReplace, reIndexList.length).sort((a, b) => a.display_order - b.display_order)
          labList.value.splice(startIndexToReplace, reIndexList.length, ...splicedLabList)
        })
      }
    }
  }
  else if(search.lab_set == LAB_DEVICE) {
    const index = labDeviceList.value.findIndex((v) => v.id_lab_device === idLabEntity)
    if(index !== -1 && index !== undefined) {
      const groupedLabItems = labDeviceList.value.filter((v: any) => v.lab?.id_category2_lab == labDeviceList.value[index]?.lab?.id_category2_lab)
      const refindIndex = groupedLabItems.findIndex((v) => v.id_lab_device === idLabEntity)
      if (direction == 'up') {
        const temp = groupedLabItems[refindIndex - 1]
        groupedLabItems[refindIndex - 1] = groupedLabItems[refindIndex]
        groupedLabItems[refindIndex] = temp
      } else {
        const temp = groupedLabItems[refindIndex + 1]
        groupedLabItems[refindIndex + 1] = groupedLabItems[refindIndex]
        groupedLabItems[refindIndex] = temp
      }
      nextTick().then(async () => {
        const reIndexList: number[] = [] // store the index of the items that are being moved
        const displayOrderArr = groupedLabItems.filter((v: any) => v && _.has(v, 'id_lab_device')).map((v, k) => {
          const newOrder = k + 1
          _.set(groupedLabItems, `[${k}].display_order`, newOrder)
          _.set(groupedLabItems, `[${k}].showUpArrow`, k !== 0)
          _.set(groupedLabItems, `[${k}].showDownArrow`, (groupedLabItems.length - 1) !== k)
          const reIndex = labDeviceList.value.findIndex((v2: any) => v2.id_lab_device === v.id_lab_device)
          if (reIndex !== -1) {
            reIndexList.push(reIndex)
            labDeviceList.value[reIndex] = v
          }
          return {
            id_lab: v.id_lab,
            id_lab_device: parseInt(v.id_lab_device),
            display_order: newOrder
          }
        })
        await labDeviceStore.updateLabDeviceDisplayOrder({ lab_device: displayOrderArr })
        const startIndexToReplace = Math.min(...reIndexList)
        const splicedLabList = _.cloneDeep(labDeviceList.value).splice(startIndexToReplace, reIndexList.length).sort((a, b) => a.display_order - b.display_order)
        labDeviceList.value.splice(startIndexToReplace, reIndexList.length, ...splicedLabList)
      })
    }
  }  
}

const initLabCounts = async (categoryId?: number) => {
  if (categoryId && categoryLabCounts.value) { 
    _.set(categoryLabCounts.value, categoryId, -1)
  }
  await labSetStore.fetchPreparationLabSets({ no_pagination: true })
  const labSets = labSetStore.getAllLabSets
  
  // Group by id_category2_lb2 and count
  const counts: Record<string, number> = {}
  labSets.forEach(labSet => {
    const categoryId = labSet.id_category2_lb2
    if (categoryId) {
      if (!counts[categoryId]) {
        counts[categoryId] = 0
      }
      counts[categoryId]++
    }
  })
  categoryLabCounts.value = _.cloneDeep(counts) as Record<string, number>
  if (categoryId && categoryLabCounts.value) { 
    _.set(categoryLabCounts.value, categoryId, counts[categoryId])
  }
}

const renderLabCount = (categoryId: number) => {
  const spinner = () => h(QSpinner, {
    class: 'text-grey-600',
    size: '16px'
  }, `(0)`)
  if (!categoryLabCounts.value) {
    return spinner()
  }
  const count = categoryLabCounts.value?.[categoryId] || 0
  if (count === -1) {
    return spinner()
  }
  return h('span', {
    class: 'text-grey-600'
  }, `${count}`)
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB1_' }, 'LB1'),
    commonStore.fetchPreparationCommonList({ code_common: [7] }, true),
    labStore.fetchLabByLabDevice()
  ])

  if (getCategoriesLB2?.value?.length) {
    const activeCategories = getCategoriesLB2.value.filter((c) => {
      return c.flg_active
    })
    activeCategories.forEach((item) => {
      categoriesLB2DefaultList.push({ value: item.id_category, label: item.name_category })
    })
    categoriesLB2List.value = [...categoriesLB2DefaultList]
    initLabCounts()
  }

  if (getCommonDeviceOptionActiveList?.value?.length) {
    getCommonDeviceOptionActiveList.value.forEach((item: Common) => {
      commonDeviceDefaultList.push({ value: item.id_common, label: item.name_common })
    })
    commonDeviceList.value = [...commonDeviceDefaultList]
  }

  if (getCliCommonOuterLabRef?.value?.length) {
    getCliCommonOuterLabRef.value.forEach((item) => {
      commonOuterLabDefaultList.push({ value: item.id_cli_common, label: item.name_cli_common.trim() })
    })
    commonOuterLabList.value = [...commonOuterLabDefaultList]
  }

  init()
  // setPageTitle('検査項目')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 mobile-margin">
          検査項目
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormRadiobtn @update:selected="changeLabSet" v-model:selected="search.lab_set" label="手入力検査" val="1" />
              <MtFormRadiobtn @update:selected="changeLabSet" v-model:selected="search.lab_set" label="院内検査機器" val="2" class="q-mr-md" />
              <MtFormRadiobtn v-model:selected="search.lab_set" class="q-mr-md" label="外注検査" val="3" @update:selected="changeLabSet" />
              <MtFilterSelect
                v-if="search.lab_set == '1'"
                v-model:selecting="search.code_labcat2"
                v-model:options="categoriesLB2List"
                :options-default="categoriesLB2DefaultList"
                type="text"
                label="検査セット"
                class="q-mr-sm selection-field"
                outlined
                @update:selecting="changeCategory"
                @clear="clearCategoryFilter"
                custom-option
              >
                <template #option="{slotProps}">
                  <q-item v-bind="slotProps?.itemProps" clickable>
                    <div class="row full-width justify-between items-center">
                      <span>{{ slotProps?.opt?.label }}</span>
                      <component :is="renderLabCount(slotProps?.opt?.value)" />
                    </div>
                  </q-item>
                </template>
              </MtFilterSelect>
              <MtFilterSelect
                v-if="search.lab_set == '2'"
                v-model:options="commonDeviceList"
                :options-default="commonDeviceDefaultList"
                label="院内検査機器"
                class="q-mr-sm selection-field"
                outlined
                @update:selecting="changeDevice"
                v-model:selecting="search.device"
              />
              <MtFilterSelect
                v-else-if="search.lab_set == '3'"
                v-model:selecting="search.id_cli_common"
                v-model:options="commonOuterLabList"
                :options-default="commonOuterLabDefaultList"
                class="q-mr-sm selection-field"
                label="外注検査"
                outlined
                @update:selecting="changeOuterLabRef"
              />
              <q-btn
                v-if="search.lab_set == '1'"
                class="q-ml-sm"
                color="grey-800"
                text-color="white"
                unelevated
                @click="openAddModal()"
              >
                <q-icon name="add" size="20px" />
                手入力検査
              </q-btn>
              <q-btn dense flat round @click="openHelpMenu">
                <q-icon size="24px" name="help_outline" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <template v-if="search.lab_set == LAB_SET">
      <div class="row items-center justify-between q-px-lg tableBox">
        <div class="body1 regular text-grey-700">
          検索結果：<span class="q-ml-sm"> {{ labList.length }} 件</span>
        </div>
      </div>
      <MtTable2
        :columns="columns"
        :rows="labList"
        :rowsBg="true"
        :style="{ height: labList.length > 0 ? 'calc(100vh - 90px)' : '' }"
        flat
        no-data-message="検査を選択してください。"
      >
        <template v-slot:body="{ row }">
          <tr @click="onRowClickSet(row)" class="bg-grey-300 cursor-pointer" v-if="row.isCategoryLB2">
            <td colspan="7">
              {{ row.name_category }}
            </td>
          </tr>
          <tr class="bg-grey-200" v-else-if="row.isDevice">
            <td colspan="7">
              {{ row.name_device }}
            </td>
          </tr>
          <tr class="bg-grey-100" v-else-if="row.isCategoryLB1">
            <td colspan="7">
              {{ row.name_category }}
            </td>
          </tr>
          <tr v-else>
            <td
              v-for="(col, index) in columns"
              :key="index"
              :style="col.style"
              @click="onRowClick(row)"
              class="cursor-pointer"
            >
              <div v-if="col.field == 'type_animal'">
                <q-icon
                  class="text-positive"
                  v-if="row.flg_main_address"
                  name="check_circle"
                />
              </div>
              <div v-else-if="col.field == 'id_cm_unit'">
                {{ getUnitName(row.id_cm_unit) }}
              </div>
              <div v-else-if="col.field == 'flg_output_text'">
                {{ row.lab?.flg_output_text ? '文字' : '数値' }}
              </div>
              <div v-else-if="col.field == 'memo_lab'">
                {{ row.memo_lab ?? row.lab?.memo_lab }}
              </div>
              <div v-else-if="col.field === 'update_display_order'">
                <div class="flex justify-end">
                  <q-btn v-if="row.showUpArrow" @click.stop="moveUp(row.id_lab_set)" flat dense rounded>
                    <q-icon name="arrow_upward" size="5" />
                  </q-btn>
                  <q-btn v-if="row.showDownArrow" @click.stop="moveUp(row.id_lab_set, 'down')" flat dense rounded>
                    <q-icon name="arrow_downward" size="5" />
                  </q-btn>
                </div>
              </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row.lab?.[col.field] }}
              </div>
            </td>
          </tr>
        </template>
      </MtTable2>
    </template>

    <template v-if="search.lab_set == LAB_DEVICE">
      <div class="row items-center justify-between q-px-lg tableBox">
        <div class="body1 regular text-grey-700">
          検索結果：<span class="q-ml-sm"> {{ labDeviceList.length }} 件</span>
        </div>
      </div>
      <MtTable2
        :columns="columns"
        :rows="labDeviceList"
        :rowsBg="true"
        :style="{ height: labDeviceList.length > 0 ? 'calc(100vh - 90px)' : '' }"
        flat
        no-data-message="検査を選択してください。"
      >
        <template v-slot:body="{ row }">
          <tr class="bg-grey-300" v-if="row.isCategoryLB2">
            <td colspan="7">
              {{ row.name_category }}
            </td>
          </tr>
          <tr v-else>
            <td
              v-for="(col, index) in columns"
              :key="index"
              :style="col.style"
              @click="onRowClick(row)"
              class="cursor-pointer"
            >
              <div v-if="col.field == 'type_animal'">
                <q-icon
                  class="text-positive"
                  v-if="row.flg_main_address"
                  name="check_circle"
                />
              </div>
              <div v-else-if="col.field == 'id_cm_unit'">
                {{ getUnitName(row.id_cm_unit) }}
              </div>
              <div v-else-if="col.field == 'flg_output_text'">
                {{ row.lab?.flg_output_text ? '文字' : '数値' }}
              </div>
              <div v-else-if="col.field == 'memo_lab'">
                {{ row.memo_lab ?? row.lab?.memo_lab }}
              </div>
              <div v-else-if="col.field == 'memo_lab'" class="body1 regular text-grey-900">
                {{ row?.[col.field] }}
              </div>
              <div v-else-if="col.field === 'update_display_order'">
                <div class="flex justify-end">
                  <q-btn v-if="row.showUpArrow" @click.stop="moveUp(row.id_lab_device)" flat dense rounded>
                    <q-icon name="arrow_upward" size="5" />
                  </q-btn>
                  <q-btn v-if="row.showDownArrow" @click.stop="moveUp(row.id_lab_device, 'down')" flat dense rounded>
                    <q-icon name="arrow_downward" size="5" />
                  </q-btn>
                </div>
              </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row.lab?.[col.field] }}
              </div>
            </td>
          </tr>
        </template>
      </MtTable2>
    </template>
    <template v-if="search.lab_set == '3'">
      <div class="row items-center justify-between q-px-lg tableBox">
        <div class="body1 regular text-grey-700">
          検索結果：<span class="q-ml-sm"> {{ labRefList.length }} 件</span>
        </div>
      </div>
      <MtTable2
        :columns="columns"
        :rows="labRefList"
        :rowsBg="true"
        :style="{ height: labRefList.length > 0 ? 'calc(100vh - 90px)' : '' }"
        flat
        no-data-message="検査を選択してください。"
      >
        <template v-slot:body="{ row }">
          <tr>
            <td
              v-for="(col, index) in columns"
              :key="index"
              :style="col.style"
              @click="onRowClick(row)"
            >
              <div v-if="col.field == 'name_category2'">
                {{ getCategoryName(row.id_category2_lab) }}
              </div>
              <div v-else-if="col.field == 'type_animal'">
                <q-icon
                  v-if="row.flg_main_address"
                  class="text-positive"
                  name="check_circle"
                />
              </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row.lab?.[col.field] }}
              </div>
            </td>
          </tr>
        </template>
      </MtTable2>
    </template>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
.mobile-margin {
  margin-left: 16px;
}

@media (min-width: 600px) {
  .mobile-margin {
    margin-left: 0;
  }
}
</style>
