<script lang="ts" setup>
import { h, nextTick, onMounted, reactive, ref, toRaw } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import useCommonStore from '@/stores/common'
import CreateLabToLabSetModal from './CreateLabToLabSetModal.vue'
import useCategoryStore from '@/stores/categories'
import useLabSetStore from '@/stores/lab-sets'
import aahMessages from '@/utils/aahMessages'
import _, { forEach, groupBy, mapValues, sortBy } from 'lodash'
import { Category, Common, GenericValueLabelType, LabSet } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import UpdateLabModal, { SaveCallbackProps } from './UpdateLabModal.vue'
import useLabDeviceStore from '@/stores/lab-devices'
import useRequestStore from '@/stores/requests'
import useLabStore from '@/stores/labs'
import { QSpinner } from 'quasar'
import { LabRangeItem } from './UpdateLabRange.vue'
import { dateFormat } from '@/utils/aahUtils'

const props = defineProps({
  id_category: Number,
  lab_set_type: String,
  id_device: Number,
})
const requestStore = useRequestStore()
const cliCommonStore = useCliCommonStore()
const commonStore = useCommonStore()
const categoryStore = useCategoryStore()
const labSetStore = useLabSetStore()
const labDeviceStore = useLabDeviceStore()
const labStore = useLabStore()
const emits = defineEmits(['close'])

const categoriesLB2DefaultList = reactive<GenericValueLabelType[]>([])
const categoriesLB2List = ref<GenericValueLabelType[]>([])

const commonDeviceDefaultList = reactive<GenericValueLabelType[]>([])
const commonDeviceList = ref<GenericValueLabelType[]>([])

const labSetForm = ref({
  id_lab_set: '',
  id_category2: '',
})
const labDeviceForm = ref({
  id_lab_device: '',
  code_device: '',
})
const labSetList = ref<Record<string, any>>({})
const labDeviceList = ref([])
const lastKnownSaveLabSetValue = ref<Record<string, any> | null>(null)
const isEdit = ref(false)
const categoryLabCounts = ref<{ [key: string]: number } | null>(null)
const forceRenderLabItem = ref<boolean>(true)

const getGroupedCategorizationLength = (id_category: number, id_device: number) => {
  return labSetList.value?.[props.id_category || labSetForm.value.id_category2]?.[id_category]
    ?.filter((v: any) => (v.id_cm_device || 0) == id_device)
    .length
}

const moveUp = async (index: number, id_category: number, id_device: number = 0, direction: 'up' | 'down' = 'up') => {
  if (props.lab_set_type == 'lab-set') {
    const labSetId = index
    const labSetGroupedList: any[] = labSetList.value?.[props.id_category || labSetForm.value.id_category2]?.[id_category]
      .filter((v: any) => (v.id_cm_device || 0) == id_device)
      .sort((a: any, b: any) => a.display_order - b.display_order)

    const indexToMove = labSetGroupedList.findIndex((v: any) => v.id_lab == labSetId)
    const indexToReplace = labSetList.value?.[props.id_category || labSetForm.value.id_category2]
      ?.[id_category]
      .findIndex((v: any) => v.id_lab == labSetId && (v.id_cm_device || 0) == id_device)

    // Swap the items in the array
    if (labSetGroupedList && (indexToMove !== -1 && indexToMove !== undefined) && (indexToReplace !== -1 && indexToReplace !== undefined)) {
      // Swap the items in the array
      if (direction == 'up') {
        const temp = labSetGroupedList[indexToMove - 1]
        labSetGroupedList[indexToMove - 1] = labSetGroupedList[indexToMove]
        labSetGroupedList[indexToMove] = temp
      } else {
        const temp = labSetGroupedList[indexToMove + 1]
        labSetGroupedList[indexToMove + 1] = labSetGroupedList[indexToMove]
        labSetGroupedList[indexToMove] = temp
      }

      const displayOrderArr = labSetGroupedList.map((v: any, k: number) => {
        const newOrder = k + 1
        _.set(labSetGroupedList, [ k, 'display_order'], newOrder)
        return {
          ...v,
          id_lab: v.id_lab,
          id_lab_set: parseInt(v.id_lab_set),
          display_order: newOrder
        }
      })
      await labSetStore.updateLabSetDisplayOrder({ lab_set: displayOrderArr.map((v: any) => ({
        id_lab: v.id_lab,
        id_lab_set: parseInt(v.id_lab_set),
        display_order: v.display_order
      }))
      })
      
      labSetGroupedList.forEach((v, k) => {
        v.showUpArrow = k !== 0
        v.showDownArrow = (labSetGroupedList.length - 1) !== k
        
        const reIndex = labSetList.value?.[props.id_category || labSetForm.value.id_category2]
          ?.[id_category].findIndex((v2: any) => v2.id_lab_set === v.id_lab_set && (v2.id_cm_device || 0) == id_device)
        if(reIndex !== -1) {
          labSetList.value[props.id_category || labSetForm.value.id_category2][id_category][reIndex] = v
        }
      })
    }
  } else if (props.lab_set_type == 'lab-device') {
    const labSetDevice: any[] = labDeviceList.value?.[id_category]

    // Swap the items in the array
    if (labSetDevice) {
      const temp = labSetDevice[index - 1]
      labSetDevice[index - 1] = labSetDevice[index]
      labSetDevice[index] = temp

      const displayOrderArr = labSetDevice.map((v, k) => ({
        id_lab: v.id_lab,
        id_lab_device: parseInt(v.id_lab_device),
        display_order: k + 1
      }))
      await labDeviceStore.updateLabDeviceDisplayOrder({ lab_device: displayOrderArr })
      requestStore.setRequestPageRefresh(true)
    }
  }
}

const moveDown = async (index: number, id_category: number, id_device: number = 0) => {
  if (props.lab_set_type == 'lab-set') {
    // @note: this is not working , use MoveUp instead for lab-set
    const labSetDevice: any[] = labSetList.value?.[props.id_category || labSetForm.value.id_category2]?.[id_category]
      .filter((v: any) => (v.id_cm_device || 0) === id_device)

    // Swap the items in the array
    if (labSetDevice) {
      const temp = labSetDevice[index + 1]
      labSetDevice[index + 1] = labSetDevice[index]
      labSetDevice[index] = temp

      const displayOrderArr = labSetDevice.map((v: any, k: number) => {
        const newOrder = k + 1
        _.set(labSetList.value, [id_device, id_category, k, 'display_order'], newOrder)
        return {
          id_lab: v.id_lab,
          id_lab_set: parseInt(v.id_lab_set),
          display_order: newOrder
        }
      })
      await labSetStore.updateLabSetDisplayOrder({ lab_set: displayOrderArr })
      requestStore.setRequestPageRefresh(true)
    }
  } else if (props.lab_set_type == 'lab-device') {
    const labSetDevice = labDeviceList.value?.[id_category]

    // Swap the items in the array
    if (labSetDevice) {
      const temp = labSetDevice[index + 1]
      labSetDevice[index + 1] = labSetDevice[index]
      labSetDevice[index] = temp

      const displayOrderArr = labSetDevice.map((v, k) => ({
        id_lab: v.id_lab,
        id_lab_device: parseInt(v.id_lab_device),
        display_order: k + 1
      }))
      await labDeviceStore.updateLabDeviceDisplayOrder({ lab_device: displayOrderArr })
      requestStore.setRequestPageRefresh(true)
    }
  }
}

const areAllMarkedAsDeleted = (id_category: number, id_device: number) => {
  return labSetList.value?.[props.id_category || labSetForm.value.id_category2]?.[id_category]?.filter((v: any) => (v.id_cm_device || 0) == id_device).every((v: any) => v.isDeleted)
}

const toggleRemoveLabFromList = (id_lab: number, id_category: number, id_device: number) => {
  const labDeviceData = labSetList.value?.[props.id_category || labSetForm.value.id_category2]?.[id_category]?.find(
    (v: any) => v.id_lab === id_lab && (v.id_cm_device || 0) == id_device
  )
  if (labDeviceData)
    labDeviceData.isDeleted = !labDeviceData.isDeleted
}

const removeCategoryFromList = (id_device: number, id_category: number) => {
  // Find the correct device key and category
  const isAllMarkedAsDeleted = areAllMarkedAsDeleted(id_category, id_device)
  Object.keys(labSetList.value).forEach(deviceKey => {
    const categories = labSetList.value[deviceKey]
    if (categories[id_category]) {
      // Mark all labs in this category with matching device ID as deleted
      categories[id_category].forEach((lab: any) => {
        const labDeviceId = lab.id_cm_device || 0
        if (labDeviceId == id_device) {
          lab.isDeleted = !isAllMarkedAsDeleted
        }
      })
    }
  })
}

/**
 * @note not being used in lab sets
 */
const removeDeviceFromList = (id_device: number) => {
  // Iterate through all categories and mark labs with matching id_cm_device as deleted
  Object.keys(labSetList.value).forEach(deviceKey => {
    const categories = labSetList.value[deviceKey]
    Object.keys(categories).forEach(categoryKey => {
      // Mark matching labs as deleted instead of removing them
      categories[categoryKey].forEach((lab: any) => {
        const labDeviceId = lab.id_cm_device || 0
        if (labDeviceId === id_device) {
          lab.isDeleted = true
        }
      })
    })
  })
}

const openAddLabModal = async () => {
  if (!lastKnownSaveLabSetValue.value) { 
    lastKnownSaveLabSetValue.value = _.cloneDeep(labSetList.value)
  }
  let reset = false
  await mtUtils.mediumPopup(CreateLabToLabSetModal, {
    labSetList: labSetList.value,
    labSetListLastSaved: lastKnownSaveLabSetValue.value,
    doReset: (value: boolean) => {
      if (value) {
        reset = value
      }
    }
  })
  if (labSetStore.getSelectedLabSet) {
    if (reset) {
      await fetchLabSet(props.id_category || labSetForm.value.id_category2)
    }
    const labSetFromStore: Record<string, any> = (() => {
      const labItem: Record<string, any> = {}
      const selectedLabset: Record<string, any> = labSetStore.getSelectedLabSet
      Object.keys(selectedLabset).forEach((vKey) => {
        Object.keys(selectedLabset[vKey]).forEach((vCategoryKey) => {
          if (!labItem[vCategoryKey]) {
            labItem[vCategoryKey] = []
          }
          labItem[vCategoryKey].push(...selectedLabset[vKey][vCategoryKey])
        })
      })
      return labItem
    })()
    if (Object.keys(labSetList.value).length === 0) {
      labSetList.value = {
        [labSetForm.value.id_category2]: {}
      } as any
    }

    Object.keys(labSetList.value).forEach((vKey) => {
      const whitelist: any[] = []
      const labSetListItem = labSetList.value[vKey]
      Object.keys(labSetListItem).forEach((vCategoryKey) => {
        // Get existing items and mark as deleted
        const existingItems = labSetListItem[vCategoryKey].map((v: any) => ({
          ...v,
          isDeleted: true
        }))

        // Filter out items that exist in store
        const filteredExisting = existingItems.filter(
          (v: any) => !labSetFromStore[vCategoryKey]?.find(
            (vFromStore: any) => vFromStore.id_lab === v.id_lab
          ) 
        )
        // Get new items from store
        const newItems = (labSetFromStore[vCategoryKey] || []).map((vFromStore: any) => ({
          ...vFromStore,
          isDeleted: false
        }))
        // Combine filtered existing and new items
        labSetList.value[vKey][vCategoryKey] = _.uniqBy([
          ...filteredExisting,
          ...newItems
        ], 'id_lab').sort((a: any, b: any) => a.display_order - b.display_order)

        labSetList.value[vKey][vCategoryKey].forEach((v: any) => {
          whitelist.push(v.id_lab)
        })
      })
      Object.keys(labSetFromStore).forEach((vCategoryKey) => {
        if (!labSetList.value[vKey][vCategoryKey] && labSetFromStore[vCategoryKey].length > 0) {
          labSetList.value[vKey][vCategoryKey] = []
        }
        if (labSetList.value[vKey][vCategoryKey]) {
          labSetFromStore[vCategoryKey].forEach((v:any) => {
            if (!whitelist.includes(v.id_lab)) {
               labSetList.value[vKey][vCategoryKey].push(v)
            }
          })
          labSetList.value[vKey][vCategoryKey].sort((a: any, b: any) => a.display_order - b.display_order)
        }
      })
    })
    if (labSetList.value.length == 0) mtUtils.autoCloseAlert('データがありません。他のカテゴリを選択してください。')
    labSetStore.resetSelectedLabSet()
  }
}

const fetchLabSet = async (value) => {
  lastKnownSaveLabSetValue.value = null
  labSetList.value = []
  if (value) {
    await labSetStore.fetchLabSets({
      id_category2_lb2: value,
      no_pagination: true,
    })

    const bringLabData = labSetStore.getLabSets.map((v) => {
      if (v.lab) return  {...v.lab, ...v }
      else return v
    })

    const groupedLabSet = mapValues(groupBy(sortBy(bringLabData, 'display_order'), 'id_category2_lb2'),
      (value) => groupBy(sortBy(value, 'display_order'), 'id_category2_lb1')
    )

    labSetList.value = groupedLabSet
  }
}

const closeModal = () => {
  emits('close')
}

const getDeviceName = (id: number, lab_set_type: string) => {
  if (lab_set_type == 'lab-device') {
    const findDevice = commonStore.getCommonDeviceOptionList.find((item: Common) => item.id_common == id)
    if (findDevice) return findDevice?.name_common
    else return '機器なし'
  } else if (lab_set_type == 'lab-set') {
    const findCategory = categoryStore.getCategoriesLB2.find((item: Category) => item.id_category == id)
    if (findCategory) return findCategory?.name_category
    else return 'No category'
  } else if (lab_set_type == 'lab-outer')
    return cliCommonStore.getCliCommonOuterLabRef?.[0]?.name_cli_common
}

const getCategoryName = (id_category: number) => categoryStore.getAllCategories?.find((item: Category) => item.id_category == id_category)?.name_category

const onRowClickLabSet = async (row, id_category, id_device) => {
  // temporary save data
  let isSaved: boolean = false
  const category_lb1 = categoryStore.getCategoriesLB1.find((v) => v.id_category == id_category)
  const device = commonStore.getCommonDeviceOptionList.find((item: Common) => item.id_common == id_device)
  const usePlaceholder = props.lab_set_type == 'lab-set' ? !row.id_lab_set : !row.id_lab_device
  await mtUtils.mediumPopup(UpdateLabModal,
    {
      id_lab: row.id_lab,
      lab_set_type: 1,
      category_lb1, device,
      lab_set_device: row,
      usePlaceholder,
      saveCallback: (value: SaveCallbackProps) => {
        isSaved = value.isSaved
        if (isSaved) {
          const selectedItem = labSetList.value[labSetForm.value.id_category2][id_category].findIndex(
              (v: any) => v.id_lab == row.id_lab && v.id_cm_device == row.id_cm_device
          )
          if (selectedItem !== -1) {
            const toUpdateData = labSetList.value[labSetForm.value.id_category2][id_category][selectedItem]
            Object.assign(toUpdateData, value.data)
            labSetList.value[labSetForm.value.id_category2][id_category][selectedItem] = {
              ...toUpdateData,
              ...value.data
            }
          }
          nextTick(() => {
            forceRenderLabItem.value = false
          }).then(() => {
            forceRenderLabItem.value = true
          })
        }
      }
    })
}

const onRowClickLabDevice = async (row, id_category) => {
  const category_lb1 = categoryStore.getCategoriesLB1.find((v) => v.id_category == id_category)
  const device = commonStore.getCommonDeviceOptionList.find((item: Common) => item.id_common == props.id_device)
  await mtUtils.mediumPopup(UpdateLabModal, { id_lab: row.id_lab, lab_set_type: 2, category_lb1, device, lab_set_device: row })
  initLabDevices()
}

const save = async (noClose?: boolean) => {
  if (!labSetForm.value.id_category2) {
    mtUtils.autoCloseAlert('Category data is not selected')
    return false
  }
  if (labSetList.value.length == 0) {
    mtUtils.autoCloseAlert('Lab data is not selected')
    return false
  }

  const savePlaceholderLabRanges = async (labRanges: (LabRangeItem & { id_lab_set?: number })[]) => {
    await labSetStore.fetchLabSets({ id_category2_lb2: props.id_category || labSetForm.value.id_category2, no_pagination: true })
    const labRangePayload: LabRangeItem[] = []
    labRanges.forEach(async (formData) => {
      // Find matching lab set with more specific criteria
      // This is dangerous, since we don't match it by unique identifier
      const labSet = labSetStore.getLabSets.find((v:any) => 
        v.id_lab == Number(formData.id_lab) && 
        v.id_category2_lb1 == (formData.id_category2_lb1 ?? '').toString() &&
        v.id_cm_device == Number(formData.id_cm_device) &&
        v.id_clinic == localStorage.getItem('id_clinic') &&
        (!v.isDeleted || typeof v.isDeleted !== 'boolean')
      )
      if (labSet) {
        // logic copied from updateLabRange.vue' submit()
        if (formData.date_start) formData.date_start = dateFormat(formData.date_start) + ' 00:00:00'
        if (formData.date_end) formData.date_end = dateFormat(formData.date_end) + ' 00:00:00'
        if (labSet) formData.id_lab = (labSet.id_lab ?? '').toString()
        if (localStorage.getItem('id_clinic')) formData.id_clinic = localStorage.getItem('id_clinic')
        if (!formData.id_lab_range || formData.id_lab_range == '') delete formData.id_lab_range

        let payload: LabRangeItem = {}
        Object.keys(formData).forEach((v) => {
          const formDataProp: LabRangeItem[keyof LabRangeItem] = formData[v as keyof LabRangeItem]
          if (v == 'id_category2_lb1' && props.lab_set_type == (1).toString()) {
            if (typeof (formDataProp) == 'object' && formDataProp !== null) {
              const categoryObj = formDataProp as { id_category?: string | number }
              Object.assign(payload, { [v]: categoryObj?.id_category })
            } else {
              Object.assign(payload, { [v]: formDataProp })
            }
          } else if (!['date_end', 'date_start', 'id_cm_device'].includes(v)) {
            Object.assign(payload, { [v]: formDataProp })
          }
        })

        if (props.lab_set_type== 'lab-set')
          Object.assign(payload, { id_lab_set: labSet.id_lab_set })
        if (labSet.date_start)
          Object.assign(payload, { date_start: labSet.date_start ? labSet.date_start + ' 00:00:00' : '' })
        if (labSet.date_end)
          Object.assign(payload, { date_end: labSet.date_end ? labSet.date_end + ' 00:00:00' : '' })
        Object.assign(payload, { id_lab_device: labSet.id_lab_device })

        labRangePayload.push(payload)
        delete payload.id_lab_range // added beforehand a temporary id, should delete it
      }
    })
    if (labRangePayload.length > 0) { 
      await mtUtils.promiseAllWithLoader( labRangePayload.map((payload) => [
        mtUtils.callApi('POST', 'mst/lab_range', payload)
      ]) )
    }
  }


  
  const labRanges: LabRangeItem[] = []
  if (isEdit.value) {
    if (props.lab_set_type == 'lab-set') {
      const labSetArr: any[] = []
      forEach(labSetList.value, (category, id_device) => {
        forEach(category, (lab_set, id_category) => {
          forEach(lab_set, (l) => {
            if (!l.isDeleted) {
              labSetArr.push({
                id_lab_set: l?.id_lab_set,
                id_category2_lb2: labSetForm.value?.id_category2,
                id_category2_lb1: id_category,
                // id_cm_device: parseInt(id_device) != 0 ? parseInt(id_device) : null,
                id_cm_device: l?.id_cm_device || null,
                id_lab: l?.id_lab,
                id_clinic: localStorage.getItem('id_clinic'),
              })
              if (!l.id_lab_set && l.lab_range) {
                // only with unsave lab set
                labRanges.push( ...l.lab_range as any[])
              }
            }
          })
        })
      })

      const res = await labSetStore.updateLabSetByCategory(props.id_category!, { id_category: props.id_category, lab_sets: labSetArr })
      await savePlaceholderLabRanges(labRanges)
      if (res) {
        requestStore.setRequestPageRefresh(true)
        mtUtils.autoCloseAlert(aahMessages.success)
      } else {
        mtUtils.autoCloseAlert(aahMessages.failed)
      }
    }
  } else {
    const labSetArr: any[] = []
    forEach(labSetList.value, (category, id_device) => {
      forEach(category, (lab_set, id_category) => {
        let display_order = 1
        forEach(lab_set, (l) => {
          if (!l.isDeleted || typeof l.isDeleted !== 'boolean') {
            labSetArr.push({
              id_category2_lb2: labSetForm.value?.id_category2,
              id_category2_lb1: id_category,
              // id_cm_device: parseInt(id_device) != 0 ? parseInt(id_device) : null,
              id_cm_device: l?.id_cm_device || null,
              id_lab: l?.id_lab,
              id_clinic: localStorage.getItem('id_clinic'),
              display_order: display_order++,
            })
          }
          if (!l.id_lab_set && l.lab_range) {
            // only with unsave lab set
            labRanges.push( ...l.lab_range as any[])
          }
        })
      })
    })

    const res = await (
      labSetForm.value?.id_category2 ?
        labSetStore.updateLabSetByCategory(Number(labSetForm.value?.id_category2),
          { id_category: labSetForm.value?.id_category2, lab_sets: labSetArr }) :
        labSetStore.submitLabSet({ lab_sets: labSetArr })
    )
    await savePlaceholderLabRanges(labRanges)
    if (res) {
      requestStore.setRequestPageRefresh(true)
      mtUtils.autoCloseAlert('更新しました。')
    } else {
      mtUtils.autoCloseAlert(aahMessages.failed)
    }
  }
  if(noClose) return
  closeModal()
}

const initLabSets = async () => {
  lastKnownSaveLabSetValue.value = null
  await mtUtils.promiseAllWithLoader([
    labSetStore.fetchLabSets({ id_category2_lb2: props.id_category, no_pagination: true }),
  ])

  const category_lb2 = categoryStore.getCategoriesLB2.find((v) => v.id_category == props.id_category)
  labSetForm.value.id_category2 = category_lb2?.id_category
  const bringLabData = labSetStore.getLabSets.map((v) => {
    if (v.lab) return  {...v.lab, ...v, isDeleted: false }
    else return {...v, isDeleted: false}
  })
  const groupedLabSet = mapValues(groupBy(sortBy(bringLabData, 'display_order'), 'id_category2_lb2'),
    (value) => groupBy(sortBy(value, 'display_order'), 'id_category2_lb1')
  )
  labSetList.value = groupedLabSet
}

const initLabDevices = async () => {
  const currentDevice = commonStore.getCommonDeviceOptionList.find((v) => v.id_common == props.id_device)
  labDeviceForm.id_lab_device = currentDevice.id_lab_device

  await labDeviceStore.fetchLabDevices({
    code_device: props.id_device,
  })

  const lab_devices_mapping = labDeviceStore.getLabDevices.filter((v) => v.lab).map(v => {
    const category = categoryStore.getAllCategories.find(c => c.id_category == v.lab?.id_category2_lab)
    return {...v, category}
  })

  labDeviceList.value = groupBy(sortBy(sortBy(lab_devices_mapping, 'display_order'), 'category.display_order'), 'lab.id_category2_lab')
  
}

const initLabCounts = async () => {
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
  
  categoryLabCounts.value = counts as Record<string, number>
}

const renderLabCount = (categoryId: number) => {
  if (!categoryLabCounts.value) {
    return h(QSpinner, {
      class: 'text-grey-600',
      size: '16px'
    }, `(0)`)
  }
  const count = categoryLabCounts.value?.[categoryId] || 0
  return h('span', {
    class: 'text-grey-600'
  }, `${count}`)
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'),
    commonStore.fetchPreparationCommonList({ code_common: [4, 7] }, true)
  ])

  if (categoryStore.getCategoriesLB2.length > 0) {
    categoryStore.getCategoriesLB2.forEach((item) => {
      categoriesLB2DefaultList.push({ value: item.id_category, label: item.name_category })
    })
    categoriesLB2List.value = [...categoriesLB2DefaultList]
  }
  if (commonStore.getCommonDeviceOptionList?.length) {
    commonStore.getCommonDeviceOptionList.forEach((item: Common) => {
      commonDeviceDefaultList.push({ value: item.id_common, label: item.name_common })
    })
    commonDeviceList.value = [...commonDeviceDefaultList]
  }

  if(props.lab_set_type == 'lab-set') {
    initLabCounts()
  }

  if (props.lab_set_type == 'lab-set' && props.id_category) {
    isEdit.value = true
    initLabSets()
  } else if (props.lab_set_type == 'lab-device') {
    isEdit.value = true
    initLabDevices()
  }
})
</script>

<template>
  <q-form @submit="() => save()">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        {{ props.lab_set_type == 'lab-set' ? '手入力検査' : (props.lab_set_type == 'lab-device' ? '検査機器 表示項目管理' : '') }}
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtFilterSelect
            v-if="props.lab_set_type == 'lab-set'"
            v-model:selecting="labSetForm.id_category2"
            v-model:options="categoriesLB2List"
            :options-default="categoriesLB2DefaultList"
            label="手入力検査"
            class="q-mr-sm selection-field"
            outlined
            @update:selecting="fetchLabSet"
            @clear="fetchLabSet"
            :disable="!!props.id_category"
            custom-option
          >
            <template #option="{slotProps}">
              <q-item v-bind="slotProps?.itemProps" clickable>
                <div class="row q-pa-sm full-width justify-between items-center">
                  <span>{{ slotProps?.opt?.label }}</span>
                  <component :is="renderLabCount(slotProps?.opt?.value)" />
                </div>
              </q-item>
            </template>
          </MtFilterSelect>
          <MtFilterSelect
            v-if="props.lab_set_type == 'lab-device'"
            v-model:options="commonDeviceList"
            :options-default="commonDeviceDefaultList"
            label="院内検査機器"
            class="q-mr-sm selection-field"
            outlined
            v-model:selecting="props.id_device"
            disable
          />
        </div>
        <div v-if="props.lab_set_type == 'lab-set'" class="col-lg-6 col-md-6 col-sm-6">
          <div class="flex justify-end">
            <q-btn
              class="q-ml-sm"
              color="grey-800"
              text-color="white"
              unelevated
              @click="openAddLabModal()"
            >
              <q-icon name="add" size="20px" />
              検査項目
            </q-btn>
          </div>
        </div>

        <template v-if="props.lab_set_type == 'lab-set'">
          <div 
            class="col-lg-12 col-md-12 col-sm-12" 
            v-for="(deviceGroup, id_device) in Object.entries(labSetList).reduce((acc, [categoryId, categoryData]) => {
              // Flatten and group by id_cm_device (using '0' for null values)
              Object.entries(categoryData).forEach(([subCategoryId, items]) => {
                items.forEach(item => {
                  const deviceKey = item.id_cm_device || '0';
                  if (!acc[deviceKey]) acc[deviceKey] = {};
                  if (!acc[deviceKey][subCategoryId]) acc[deviceKey][subCategoryId] = [];
                  acc[deviceKey][subCategoryId].push(item);
                });
              });
              return acc;
            }, {})"
          >
            <div>
              <div class="bg-grey q-pa-sm flex justify-between items-center">
                {{ getDeviceName(id_device, 'lab-device') }}
                <q-btn @click="removeDeviceFromList(id_device)" flat dense rounded v-if="false">
                  <q-icon name="close" color="white" size="5" />
                </q-btn>
              </div>
              <div v-if="deviceGroup" v-for="(lab_set, id_category) in deviceGroup">
                <div class="bg-grey-200 q-pa-sm flex justify-between items-center">
                  {{ getCategoryName(id_category) }}
                  <q-btn @click="removeCategoryFromList(id_device, id_category)" flat dense rounded>
                    <q-icon :name="areAllMarkedAsDeleted(id_category, id_device) ? 'remove' : 'close'" color="white" size="5" />
                  </q-btn>
                </div>
                <template 
                  v-if="lab_set && forceRenderLabItem"
                  v-for="(lab, key) in (lab_set ?? []).sort((a:any, b:any) => a.display_order - b.display_order)"
                >
                  <template v-if="lab.flg_above_blank_row">
                    <div class="bg-grey q-py-md"></div>
                  </template>
                  <div
                    class="cursor-pointer on-hover-grey q-px-sm"
                    :class="lab?.isDeleted ? 'deleted' : ''"
                    @click="onRowClickLabSet(lab, id_category, id_device)"
                  >
                    <div class="row items-center">
                      <div class="col" :class="lab?.flg_indent ? 'q-ml-md' : ''">
                        {{ lab?.name_lab }}
                      </div>
                      <div class="col">
                        <div class="text-wrap">
                          {{ lab?.name_lab_en?.replace('%',' ') }}
                        </div>
                      </div>
                      <div class="col">
                        {{ lab?.memo_lab }}
                      </div>
                      <div class="col-2">
                        <div class="flex justify-end">
                          <q-btn v-if="key != 0" @click.stop="moveUp(lab?.id_lab, id_category, id_device)" flat dense rounded>
                            <q-icon name="arrow_upward" size="5" />
                          </q-btn>
                          <q-btn v-if="key != getGroupedCategorizationLength(id_category, id_device) - 1" @click.stop="moveUp(lab?.id_lab, id_category, id_device, 'down')" flat dense rounded>
                            <q-icon name="arrow_downward" size="5" />
                          </q-btn>
                          <q-btn @click.stop="toggleRemoveLabFromList(lab?.id_lab, id_category, id_device)" flat dense rounded>
                            <q-icon name="delete" size="5" />
                          </q-btn>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </template>
        <template v-if="props.lab_set_type == 'lab-device'">
          <div class="col-lg-12 col-md-12 col-sm-12" v-for="(lab_set, id_category) in labDeviceList">
          <div>
            <div class="bg-grey-200 q-pa-sm flex justify-between items-center">
              {{ getCategoryName(id_category) }}
            </div>
            <template 
              v-if="lab_set"
              v-for="(lab, key) in lab_set"
            >
              <template v-if="lab?.flg_above_blank_row">
                <div class="bg-grey-200 q-py-sm"></div>
              </template>
              <div @click="onRowClickLabDevice(lab, id_category)" class="cursor-pointer on-hover-grey q-pa-sm">
                <div class="row items-center">
                  <div class="col" :class="lab?.flg_indent ? 'q-ml-md' : ''">
                    {{ lab?.lab?.name_lab }}
                  </div>
                  <div class="col">
                    <div class="text-wrap">
                      {{ lab?.lab?.name_lab_en?.replace('%',' ') }}
                    </div>
                  </div>
                  <div class="col">
                    {{ lab?.memo_lab ? lab?.memo_lab : lab?.lab?.memo_lab }}
                  </div>
                  <div class="col-1">
                    <div class="flex justify-end">
                      <q-btn v-if="key != 0" @click.stop="moveUp(key, id_category)" flat dense rounded>
                        <q-icon name="arrow_upward" size="5" />
                      </q-btn>
                      <q-btn v-if="key != lab_set.length - 1" @click.stop="moveDown(key, id_category)" flat dense rounded>
                        <q-icon name="arrow_downward" size="5" />
                      </q-btn>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
        </template>

      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white q-pt-md">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn
            class="bg-grey-100 text-grey-800"
            outline
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn
            v-if="props.lab_set_type == 'lab-set'"
            class="q-ml-md"
            color="primary"
            tabindex="20"
            type="submit"
            unelevated
          >
            <span>保存</span>
          </q-btn>
        </div>
        <div></div>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.c-grid {
  display: grid;
  grid-template-columns: 120px auto 120px;
  flex-direction: column;
}

.first-item {
  max-width: 100px;
}

.q-item {
  min-height: auto !important;
  padding: 2px 0 !important;
}
.on-hover-grey {
  &:hover {
    background-color: $grey-300
  }
  &.deleted {
    background-color: rgb(252, 131, 131);
  }
}
</style>
