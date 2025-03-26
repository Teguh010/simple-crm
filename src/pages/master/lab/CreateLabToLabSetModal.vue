<script lang="ts" setup>
import { computed, onMounted, PropType, ref, h, onUnmounted, nextTick, render, getCurrentInstance } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import mtUtils from '@/utils/mtUtils'
import useCategoryStore from '@/stores/categories'
import useLabSetStore from '@/stores/lab-sets'
import useCommonStore from '@/stores/common'
import useLabStore from '@/stores/labs'
import _ from 'lodash'
import { QBtn, QCardSection, QExpansionItem } from 'quasar'


interface LabSetItem {
  id_lab: string
  id_category1: string
  id_category2_lab: string
  id_cm_device: string
  [key: string]: string
}

interface LabSet {
  [key: string]: LabSetItem[]
}

interface LabSetList {
  [key: string]: LabSet
}

interface LabDevice {
  id_common: number
  name_common: string
  [key: string]: any
}

interface SelectedCategory {
  device: number
  category: number
}

const LAB_SET_ITEM_BG_COLOR = '#c0d5f4'

const props = defineProps({
  labSetList: {
    type: Object as PropType<LabSetList>,
    required: true,
    default: () => {}
  },
  labSetListLastSaved: {
    type: Object as PropType<LabSetList>,
    required: true,
    default: () => {}
  },
  doReset: {
    type: Function as PropType<(value: boolean) => void>,
    required: true,
    default: () => {}
  }
})

const labSetStore = useLabSetStore()
const categoryStore = useCategoryStore()
const commonStore = useCommonStore()
const labStore = useLabStore()
const emits = defineEmits(['close'])
const categoryList = ref<any[]>([])
const selectedDevice = ref<number[]>([])
const deviceCategoryList = ref<Record<string, Record<string, any>[]>>({})
const savedLabSetList = ref<Record<string, Record<string, LabSetItem[]>>>({})
const modifiedLabSetList = ref<Record<string, Record<string, LabSetItem[]>>>({})
const currentLabSetList = ref<Record<string, Record<string, LabSetItem[]>>>({})
const currentCategory = ref<SelectedCategory | null>(null)
const isSave = ref<boolean>(false)
const currentNotFoundLabItems = ref<LabSetItem[]>([])
const lastLabItemIndexInRowFlexContainer = ref<number>(0)
const renderATickLate = ref<boolean>(true)

const deviceStoreList = computed(() => {
  return commonStore.getCommonDeviceOptionActiveList.concat([{id_common: 0, name_common: 'それ以外の検査'}] as any)
})

const canClearLabSetItems = computed(() => {
  return Object.keys(currentLabSetList.value).length > 0
})

const currentCategoryData = computed(() => {
  return categoryList.value.find((v) => v.id_category == currentCategory.value?.category)
})

const toggleSelectLabItemStatus = computed(() => {
  if(!currentCategory.value) return false
  const { total, used } = getLabSetsCounter(
    currentCategory.value.device,
    currentCategory.value.category,
    undefined,
    'data',
    'same_item_from_other_device'
  ) as {
    total: number
    used: number
    }
  return used >= total
})

const currentLabSetItemsByCategory = computed(() => {
  if (!currentCategory.value) return []
  const labSetItems = deviceCategoryList.value[currentCategory.value?.device]
    .find((v) => v.id_category === currentCategory.value?.category)
  return labSetItems?.sets ?? []
})

const setUserLabSetList = (labSetListData: LabSetList = props.labSetList) => {
  if (!labSetListData) {
    return
  }
  const cloneLabSetListData = _.cloneDeep(labSetListData)
  const labSetByDevice: LabSetList = {}
  Object.keys(cloneLabSetListData).forEach((groupKey) => {
    const groupedLabSet = cloneLabSetListData[groupKey]
    // Rearrange groupedLabSet by id_cm_device
    Object.keys(groupedLabSet).forEach((categoryKey) => {
      const labItemsByDevice = _.groupBy(
        _.map(groupedLabSet[categoryKey], item => ({
          ...item,
          id_cm_device: (item as any).id_cm_device || 0
        })),
        'id_cm_device'
      )
      // group each lab items in device by categeroy
      Object.keys(labItemsByDevice).forEach((deviceKey) => {
        const labItems = _.groupBy(labItemsByDevice[deviceKey], 'id_category2_lab')
        if(!labSetByDevice[deviceKey]) {
          labSetByDevice[deviceKey] = labItems
        } else {
          labSetByDevice[deviceKey] = {
            ...labSetByDevice[deviceKey],
            ...labItems
          }
        }
      })
    })
  })

  Object.keys(labSetByDevice).forEach((deviceKey) => {
    delete savedLabSetList.value[deviceKey]
    delete currentLabSetList.value[deviceKey]
    delete modifiedLabSetList.value[deviceKey]
  })
  
  Object.keys(labSetByDevice).forEach((deviceKey) => {
    const labItems = labSetByDevice[deviceKey]

    if (!savedLabSetList.value[deviceKey]) {
      savedLabSetList.value[deviceKey] = {}
      currentLabSetList.value[deviceKey] = {}
      modifiedLabSetList.value[deviceKey] = {}
    }
    Object.keys(labItems).forEach((categoryKey) => {
      
      labItems[categoryKey].forEach((v: any) => {
        const labItemInCategory = labItems[categoryKey].find((labItem: any) =>
          deviceCategoryList.value[deviceKey].find(
            (category: any) => category.id_category == v.id_category2_lab
          )?.sets.find((set: any) => set.id_lab == v.id_lab)
        )
        if (!labItemInCategory) {
          // Store all not found user lab items from master list
          const alreadyAdded = currentNotFoundLabItems.value.find((item: any) => item.id_lab == v.id_lab && item.id_category2_lab == v.id_category2_lab)
          if (!alreadyAdded) {
            currentNotFoundLabItems.value.push(v)
            const setToModify = deviceCategoryList.value[deviceKey].find((v: any) => v.id_category == Number(categoryKey))
            if (setToModify) {
              setToModify.sets.push(v)
            }
          }
        }
      })

      // holder for reset lab set list
      if(!savedLabSetList.value[deviceKey][categoryKey]) savedLabSetList.value[deviceKey][categoryKey] = []
      savedLabSetList.value[deviceKey][categoryKey].push(
        ...labItems[categoryKey].map((v: any) => ({ ...v, isDeleted: false }))
      )

      // holder for current lab set list
      // Initialize current lab set list array if needed
      if (!currentLabSetList.value[deviceKey][categoryKey]) {
        currentLabSetList.value[deviceKey][categoryKey] = []
      }

      // Add non-deleted items to current lab set list
      currentLabSetList.value[deviceKey][categoryKey].push(
        ...labItems[categoryKey]
          .map((v: any) => ({
            ...v,
            isDeleted: typeof v.isDeleted === 'boolean' ? v.isDeleted : false
          }))
          .filter((v: any) => !v.isDeleted)
      )

      // Initialize modified lab set list array if needed
      if (!modifiedLabSetList.value[deviceKey][categoryKey]) {
        modifiedLabSetList.value[deviceKey][categoryKey] = []
      }

      // Add non-deleted items to modified lab set list 
      modifiedLabSetList.value[deviceKey][categoryKey].push(
        ...labItems[categoryKey]
          .map((v: any) => ({
            ...v,
            isDeleted: typeof v.isDeleted === 'boolean' ? v.isDeleted : false
          }))
          .filter((v: any) => !v.isDeleted)
      )
    })
  })
}

const getDeviceCategoryList = () => {
  const categoryStoreList: any[] = categoryStore.getAllCategories.filter((v) => v.flg_for_lab)
  const storeLabSets = labStore.getLabSets as typeof labStore.getLabSets & {
    lab_device_list: Record<string, Record<string, any>>
    lab_group_by_category: Record<string, any>
  }
  deviceStoreList.value.forEach((device: any) => {
      if (!_.has(deviceCategoryList.value, device.id_common)) {
        deviceCategoryList.value[device.id_common] = []
      }

      const idCategoryList =  device.id_common === 0 
        ? Object.keys(storeLabSets?.lab_group_by_category)
        : Object.keys(storeLabSets?.lab_device_list?.[device.id_common])

      idCategoryList.forEach((idCategory) => {
        const category = categoryStoreList.find(
          (v) => v.id_category === Number(idCategory)
        )

        if (category) {
          deviceCategoryList.value[device.id_common].push({
            ...category,
            sets: device.id_common === 0
              ? Object.values(storeLabSets?.lab_group_by_category?.[idCategory] || {})
              : Object.values(storeLabSets?.lab_device_list?.[device.id_common]?.[idCategory] || {})
                  .concat(Object.values(storeLabSets?.lab_group_by_category?.[idCategory] || {}))
          })
        }
      })
  })
}

const getLabSetsCounter = (
  idDevice: number,
  idCategory?: number,
  parentId?: number, // unused
  get?: 'total' | 'used' | 'unused' | 'both' | 'data' | 'deleted',
  extend?: 'same_item_from_other_device'
): string | number | { total: number; used: number; unused: number; deleted: number } => {
  const toLookDevice = idDevice == -1 ? 0 : idDevice
  const labDeviceList = deviceCategoryList.value[toLookDevice] as any[]
  if (!labDeviceList) return 0
  let total: number = 0
  let used: number = 0
  let unused: number = 0
  let deleted: number = 0
  if (_.isNull(idCategory) || _.isUndefined(idCategory)) {
    total = labDeviceList.length
    used = Object.keys(currentLabSetList.value[idDevice] ?? {})
      .filter(key => Array.isArray(currentLabSetList.value[idDevice][key]) && 
              currentLabSetList.value[idDevice][key].length > 0)
      .length
    unused = total - used
    // Calculate deleted items by comparing saved and current lab items
    Object.keys(savedLabSetList.value[idDevice] ?? {}).forEach(key => {
      if (Array.isArray(savedLabSetList.value[idDevice][key])) {
        const savedItems = savedLabSetList.value[idDevice][key]
        const currentItems = currentLabSetList.value[idDevice]?.[key] || []
        // Count items that exist in saved but not in current (by id_lab)
        const deletedInCategory = savedItems.filter(savedItem => 
          !currentItems.some(currentItem => currentItem.id_lab === savedItem.id_lab)
        ).length
        deleted += deletedInCategory
      }
    })
  } else {
    const labSetsItem = labDeviceList.filter((v) => v.id_category == idCategory)
    total = labSetsItem.reduce((total, item) => {
      // Check if sets exists and is an array or object
      const setsLength = item.sets ? 
        (Array.isArray(item.sets) ? item.sets.length : 
        (typeof item.sets === 'object' ? Object.keys(item.sets).length : 0)) : 0
      
      return total + setsLength
    }, 0)
    const currentUsed = currentLabSetList.value[idDevice]?.[idCategory]
    const savedUsed = savedLabSetList.value[idDevice]?.[idCategory]
    used = currentUsed?.length ?? 0
    if (extend == 'same_item_from_other_device') {
      let usedFromOtherDevice: number = 0
      labSetsItem.forEach((v: any) => {
        v.sets.forEach((set: any) => {
          if (getDevicesHasSelectedLabItems(idDevice, idCategory, set.id_lab, 'labItems').length > 0) {
            usedFromOtherDevice++
          }
        })
      })
      used = used + usedFromOtherDevice
    }
    unused = total - used
    // Calculate deleted items by comparing saved and current lab items by id_lab
    deleted = 0
    if (savedUsed && Array.isArray(savedUsed)) {
      deleted = savedUsed.filter(savedItem => 
        !currentUsed || !currentUsed.some(currentItem => currentItem.id_lab === savedItem.id_lab)
      ).length
    }
  }
  switch (get) {
    case 'total':
      return total
    case 'used':
      return used
    case 'unused':
      return unused
    case 'deleted':
      return deleted
    case 'both':
      return `${used}/${total}`
    case 'data':
      return { total, used, unused, deleted }
    default:
      return total
  }
}

const isLabSetItemSelected = (labItemId: number) => {
  if (!currentCategory.value) return false
  return currentLabSetList.value[currentCategory.value.device]?.[currentCategory.value.category]?.find(
    (v: any) => v.id_lab === labItemId
  )
}

const isLabSetItemDeleted = (labItemId: number) => {
  if (!currentCategory.value) return false
  const { device, category } = currentCategory.value
  
  // Check if item exists in saved list
  const existsInSaved = savedLabSetList.value[device]?.[category]?.some(
    (v: any) => v.id_lab === labItemId
  )
  
  // Check if item exists in current list
  const existsInCurrent = isLabSetItemSelected(labItemId)
  // Item is deleted if it exists in saved but not in current
  return existsInSaved && !existsInCurrent
}

const deviceHasDeletedLabItems = (deviceId: number) => {
  return getLabSetsCounter(deviceId, undefined, undefined, 'deleted') as number > 0
}

const getLastCategoryFromFlexContainer = (clickedElement: Event | HTMLElement , valueCategory: SelectedCategory) => {
  const container = document.getElementById(`category-flex-${valueCategory?.device}`)
  if (!container) {
    return null
  }

  const children = Array.from(container.getElementsByClassName('ref-button-parent')) as HTMLElement[]
  if (children.length === 0) {
    return null
  }

  const targetElement = (clickedElement instanceof Event)
    ? clickedElement.target as HTMLElement
    : clickedElement

  const clickedRect = targetElement.closest('.ref-button-parent')?.getBoundingClientRect()
  const clickedY = clickedRect?.y
  if (!clickedY) {
    return 0
  }

  let lastIndexInRow = 0
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const rect = child.getBoundingClientRect()
    // If element is on same row as clicked element (within 1px threshold)
    if (Math.abs(rect.y - clickedY) < 1) {
      lastIndexInRow = i
    }
  }
  return lastIndexInRow
}

const getDevicesHasSelectedLabItems = (deviceToExclude: number, categoryToFind: number, labItemId: number, get: 'devices' | 'labItems' = 'devices') => {
  let labItemsExisted: LabSetItem[] = []
  const devices = Object.keys(currentLabSetList.value)
    .filter(deviceId => {
      // Convert deviceId to number for comparison
      const deviceIdNum = Number(deviceId);
      // Exclude the specified device
      if (deviceIdNum === deviceToExclude) return false;
      // Check if this device has the specified lab item
      const hasLabItem = currentLabSetList.value[deviceIdNum]?.[categoryToFind]?.some(item => {
        // Compare as strings to ensure consistent comparison
        if(item.id_lab.toString() === labItemId.toString()) {
          labItemsExisted.push(item)
        }
        return item.id_lab.toString() === labItemId.toString()
      })
      return hasLabItem
    })
    .map(deviceId => {
      // Find the device in deviceStoreList to get its name
      const deviceInfo = deviceStoreList.value.find((d: LabDevice) => d.id_common === Number(deviceId));
      return {
        id: Number(deviceId),
        name: deviceInfo?.name_common || `Device ${deviceId}`
      };
    });
  return get === 'devices' ? devices as unknown as LabDevice[] : labItemsExisted
}

const handleToggleButton = (value: number | {device: number, category: number}, type: 'device' | 'category' | 'lab', event?: Event) => {
  if (type == 'device') {
    categoryList.value = []
    if (selectedDevice.value.includes(value as number)) 
      selectedDevice.value = selectedDevice.value.filter((id) => id !== value)
    else selectedDevice.value.push(value as number)
    const labSets = labStore.getLabSets as typeof labStore.getLabSets & {
      lab_group_by_category: Record<string, any>
      lab_device_list: Record<string, Record<string, any>>
    }
    const whitelistedCategory: number[] = []
    if (labSets?.lab_device_list) {
      selectedDevice.value?.forEach((idDevice) => {
        if (idDevice == 0) {
          // IF NO DEVICE IS SELECTED
          const idCategoryList = Object.keys(labSets?.lab_group_by_category)
          idCategoryList.forEach((idCategory) => {
            const category = categoryStore.getAllCategories.find((v) => v.id_category == Number(idCategory))
            if (category && !whitelistedCategory.includes(category.id_category)) {
              categoryList.value.push(category)
              whitelistedCategory.push(category.id_category)
            }
          })
        } else {
          // IF OTHER DEVICE IS SELECTED
          const idCategoryList = Object.keys(labSets?.lab_device_list?.[idDevice])
          idCategoryList.forEach((idCategory) => {
            const category = categoryStore.getAllCategories.find((v) => v.id_category == Number(idCategory))
            if (category && !whitelistedCategory.includes(category.id_category)) {
              categoryList.value.push(category)
              whitelistedCategory.push(category.id_category)
            }
          })
        }
      })
    }
  } else if (type == 'category') {
    const valueCategory = value as SelectedCategory
    currentCategory.value = valueCategory
    if (event) {
      nextTick(() => {
        renderATickLate.value = false
      }).then(() => {
        const lastIndexInRow = getLastCategoryFromFlexContainer(event, valueCategory)
        lastLabItemIndexInRowFlexContainer.value = lastIndexInRow ?? 0
        renderATickLate.value = true
      })
    }
  } else if (type == 'lab') {
    const valueLab = value as number
    
    if (!isLabSetItemSelected(valueLab)) {
      const devicesThatHasSelectedLabItem = getDevicesHasSelectedLabItems(
        currentCategory.value?.device ?? -1,
        currentCategory.value?.category ?? -1, 
        valueLab,
        'devices'
      )

      if(devicesThatHasSelectedLabItem.length > 0) {
        mtUtils.autoCloseAlert(`この項目は他の機器で既に選択されています。先に他の機器から削除してください。(${devicesThatHasSelectedLabItem.map((v: any) => v.name).join(', ')})`)
        return
      }
    }

    if (isLabSetItemSelected(valueLab) && currentCategory.value?.category) {
      const deviceCategory = currentLabSetList.value[currentCategory.value.device]?.[currentCategory.value.category]
      
      if (deviceCategory) {
        currentLabSetList.value[currentCategory.value.device][currentCategory.value.category] = deviceCategory.filter(
          (item: any) => item.id_lab !== valueLab
        )
      }
    } else {
      const toAddLabItem = currentLabSetItemsByCategory.value.find(
        (v: any) => v.id_lab == valueLab
      )

      if (toAddLabItem && currentCategory.value?.category) {
        const { device, category } = currentCategory.value
        const savedItem = savedLabSetList.value[device]?.[category]?.find(
          (item: any) => item.id_lab === valueLab
        )
        const itemToAdd = savedItem
          ? { ...toAddLabItem, ...(savedItem ?? {}), id_cm_device: device || null, isDeleted: false }
          : { ...toAddLabItem, id_cm_device: device || null, isDeleted: false }
        
        if (!currentLabSetList.value[device]) {
          currentLabSetList.value[device] = {}
        }

        if (!currentLabSetList.value[device][category]) {
          currentLabSetList.value[device][category] = []
        }
        currentLabSetList.value[device][category].push(itemToAdd)
      }
    }
  }
}

const handleResetLabSetItems = (action: 'reset' | 'undo' | 'clear') => {
  const resetCallbackValid = props.doReset && props.doReset instanceof Function
  if (action == 'reset') {
    setUserLabSetList(props.labSetListLastSaved)
    save(savedLabSetList.value, 'undo')
    if (resetCallbackValid) {
      props.doReset(true)
    }
  } else if (action == 'undo') {
    currentLabSetList.value = _.cloneDeep(modifiedLabSetList.value)
  } else {
    currentLabSetList.value = {}
  }
}

const handleToggleSelectLabItemStatus = (action?: 'fill') => {
  const fillLabSetList = async () => {
    const category = currentCategory.value?.category
    const device = currentCategory.value?.device
    
    if (category) {
      const labSetsItem = deviceCategoryList.value[device ?? 0].filter((v) => v.id_category == category)
      const flaggedDevicesNames: LabDevice[] = []
      labSetsItem.forEach((v: any) => {
        v.sets.forEach((set: any) => {
          const devicesThatHasSelectedLabItem = getDevicesHasSelectedLabItems(device ?? 0, category, set.id_lab, 'devices')
          if (devicesThatHasSelectedLabItem.length > 0) {
            flaggedDevicesNames.push(
              ...(devicesThatHasSelectedLabItem as unknown as LabDevice[])
                .filter((v: LabDevice) => !flaggedDevicesNames.find((v2: LabDevice) => v2.id_common == v.id_common))
            )
          }
        })
      })

      if (flaggedDevicesNames.length > 0) {
        const response = await mtUtils.confirm(
          `他のデバイスで同じ項目が見つかりました。(${
            flaggedDevicesNames
              .map((v: LabDevice) => v.name_common)
              .join(', ')
          })`,
          '確認',
          '確認',
          undefined,
          undefined,
          undefined,
          {
            show: false,
            callBackFun: Function
          },
          true,
          'キャンセル',
          true
        )
        if (!response) return
      }

      
      if (!currentLabSetList.value[device ?? 0]) {
        currentLabSetList.value[device ?? 0] = {}
      }

      if (!currentLabSetList.value[device ?? 0][category]) {
        currentLabSetList.value[device ?? 0][category] = []
      }

      currentLabSetList.value[device ?? 0][category] = [
        ...currentLabSetItemsByCategory.value.filter(
          (v: any) => {
            const isIn = getDevicesHasSelectedLabItems(
              device ?? 0,
              category,
              v.id_lab,
              'devices'
            ).length
            return !isIn
          }
        ).map((v: any) => ({
          ...v,
          id_cm_device: device ?? 0
        }))
      ]

      if (currentLabSetList.value[device ?? 0][category].length === 0) { 
        mtUtils.autoCloseAlert('選択されていません。全ての項目は他のデバイスで見つかりました。')
      }
    }
  }

  if (action === 'fill') {
    fillLabSetList()
    return
  }

  const category = currentCategory.value?.category
  const device = currentCategory.value?.device
  if (toggleSelectLabItemStatus.value) {
    if (category) {
      currentLabSetList.value[device ?? 0][category] = []
    }
  } else {
    fillLabSetList()
  }
}

const closeModal = () => {
  emits('close')
}

async function save(labSetToSave: LabSetList = currentLabSetList.value, action: 'save' | 'undo' = 'save') {
  isSave.value = true
  const labSets = labStore.getLabSets as typeof labStore.getLabSets & {
    lab_device_list: Record<string, any>
    lab_group_by_category: Record<string, any>
  }
  const resultLabSet: LabSetList = labSetToSave
  Object.keys(resultLabSet).forEach((deviceKey: string) => {
    if (Object.keys(resultLabSet[deviceKey]).length === 0) { 
      delete resultLabSet[deviceKey]
    }
  })

  if (action === 'undo') {
    // can be use to reset just change labSetToSave
    labSetStore.setSelectedLabSet(resultLabSet as any)
    return
  }

  labSetStore.setSelectedLabSet(resultLabSet as any)
  closeModal()
}

const renderCategoryButton = (category: any, device: number, order: number = 0) => {
  // use rendered function to avoid calling getLabSetsCounter multiple times
  const { total, used, deleted } = getLabSetsCounter(device, category.id_category, category.parentCategory, 'data') as {
    total: number
    used: number
    unused: number
    deleted: number
  }
  const isSelected = currentCategory.value?.category === category.id_category && 
    currentCategory.value?.device === device
  return h('div', {
    class: ['column q-px-xs q-pt-xs q-pb-none'],
    style: {
      order: order,
      backgroundColor: isSelected ? LAB_SET_ITEM_BG_COLOR : 'inherit',
      borderTopLeftRadius: isSelected ? '5px' : '0',
      borderTopRightRadius: isSelected ? '5px' : '0'
    }
    }, [
      h(QBtn, {
        outline: used === 0,
        onClick: (event: Event) => handleToggleButton({
          device: device,
          category: category.id_category,
        }, 'category', event),
        style: {
          backgroundColor: used > 0 ? '#1d7afc' : '#ffffff !important',
          color: used > 0 ? '#fff' : '',
          width: 'fit-content'
        },
        // ref-button-parent is important to get the last category from flex container
        class: ['q-mb-xs', 'ref-button-parent']
      }, [
        category.name_category,
        h('span', {
          style: { 
            color: used > 0 ? '#cccaca' : '#757575' 
          }
        }, `(${used}/${total})`),
        deleted > 0 && h('span', {
          style: { 
            color: used > 0 ? '#dd0101' : '#ff4040',
            textShadow: used > 0 ? '0 0 1px white' : 'none'
          }
        }, `(${deleted})`)
      ]),
      // h('div', {
      //   class: 'full-width', 
      //   style: {
      //     borderRadius: '5px',
      //     height: '5px',
      //     background: isSelected ? '#424242' : 'transparent'
      //   }
      // })
    ])
}

onMounted(async () => {
  const labSets = labStore.getLabSets as typeof labStore.getLabSets & { lab_device_list: Record<string, any> }
  const promises = [categoryStore.fetchCategories({ code_category_prefix: 'LB1_' }, 'LB1')]
  if (!labSets?.lab_device_list) promises.push(labStore.fetchLabByLabDevice())
  await mtUtils.promiseAllWithLoaderMsg(promises, '')
  getDeviceCategoryList()
  setUserLabSetList()
})

onUnmounted(() => {
  if (!isSave.value) {
    save(modifiedLabSetList.value, 'undo')
  }
})

</script>

<template>
  <q-form @submit="() => save()">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        検査グループ
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-py-sm">
      <div class="row q-mb-md">
        <div class="col-12">
          <div class="row q-ml-sm q-mb-xs items-center" style="gap: 10px;">
            <span>検査機器</span>
            <q-btn 
              class="q-px-sm q-ml-auto" 
              dense 
              icon="sync" 
              label="リセット" 
              @click="handleResetLabSetItems('reset')" 
            />
            <q-btn 
              class="q-px-sm" 
              dense 
              icon="undo" 
              label="元に戻す" 
              @click="handleResetLabSetItems('undo')" 
            />
            <q-btn 
              class="q-px-sm" 
              dense 
              icon="delete_forever" 
              label="クリア" 
              @click="handleResetLabSetItems('clear')"
              :disable="!canClearLabSetItems"
            />
          </div>
          <div class="flex items-center">
            <template v-for="device in deviceStoreList" :key="device.id_common">
              <q-btn
              :outline="!selectedDevice.includes(device.id_common)"
              @click="handleToggleButton(device.id_common, 'device')"
              :style="{backgroundColor: selectedDevice.includes(device.id_common) ? '#1d7afc' : '', color: selectedDevice.includes(device.id_common) ? '#fff' : ''}"
              class="q-ma-xs"
              >
                <q-icon name="error" style="font-size: 16px; color: #ff4040; margin-top: 2px;" v-if="deviceHasDeletedLabItems(device.id_common)" />
                {{ device.name_common }}
                <span :style="{ color: selectedDevice.includes(device.id_common) ? '#cccaca' : '#757575'}">
                  ({{ getLabSetsCounter(device.id_common, undefined, undefined, 'both') }})
                </span>
              </q-btn>
            </template>
          </div>
        </div>
      </div>
      <div v-if="selectedDevice.length > 0" class="row" style="width: calc(100% - 8px);">
        <div class="col-12">
          <div class="row q-ml-sm q-mb-xs items-center" style="gap: 10px;">
            <span>臨床検査分類</span>
          </div>
          <div class="column" id="category-container-ref">
            <template v-for="device in selectedDevice" :key="device">
                <span class="text-grey-500 q-px-sm text-caption">
                  {{ deviceStoreList.find((v: any) => v.id_common == device)?.name_common }}
                </span>
                <div class="flex items-center" :id="`category-flex-${device}`" >
                  <template v-for="(category, index) in deviceCategoryList[device]" :key="groupName">
                    <component :is="renderCategoryButton(category, device, index)" />
                  </template>
                  <div
                    class="column full-width q-mb-xs"
                    v-if="currentCategory?.device === device && renderATickLate"
                    :style="{ order: lastLabItemIndexInRowFlexContainer, backgroundColor: LAB_SET_ITEM_BG_COLOR }"
                  >
                    <q-expansion-item
                      expand-separator
                      dense
                      dense-toggle
                      header-class="q-px-sm text-black"
                      v-if="currentCategory?.category"
                      id="lab-items-section"
                    >
                      <template #header>
                        <div class="row q-ml-sm q-mb-xs items-center full-width" style="gap: 10px;">
                          <div class="column">
                            <MtFormCheckBox
                              :label="`${toggleSelectLabItemStatus ? '全選択解除' : '全選択'} (${currentCategoryData?.label}) (${getLabSetsCounter(currentCategory?.device, currentCategory?.category, undefined, 'both')})`"
                              :checked="!!toggleSelectLabItemStatus"
                              @update:checked="handleToggleSelectLabItemStatus"
                              class="mt-1"
                            />
                          </div>
                          <span class="q-ml-auto text-grey-500">項目管理</span>
                        </div>
                      </template>
                      <q-card-section class="q-pt-none q-pb-sm q-px-sm">
                        <template v-for="labItem in currentLabSetItemsByCategory">
                            <q-btn
                              :outline="!isLabSetItemSelected(labItem.id_lab) && !isLabSetItemDeleted(labItem.id_lab)"
                              @click="handleToggleButton(labItem.id_lab, 'lab')"
                              :style="{
                                backgroundColor: isLabSetItemSelected(labItem.id_lab) ? '#1d7afc !important' : '#fff !important',
                                color: getDevicesHasSelectedLabItems(currentCategory?.device, currentCategory?.category, labItem.id_lab).length > 0 
                                  ? isLabSetItemSelected(labItem.id_lab) ? '#fff !important' : '#757575 !important'
                                  : isLabSetItemSelected(labItem.id_lab) 
                                    ? '#fff' 
                                    : '',
                                border: isLabSetItemDeleted(labItem.id_lab) ? '1px solid #dd0101 !important' : 'none'
                              }"
                              dense
                              class="q-ma-xs q-px-sm"
                            >
                              {{ labItem.name_lab }}
                            </q-btn>
                          </template>
                      </q-card-section>
                    </q-expansion-item>
                  </div>
                </div>
            </template>
          </div>
        </div>
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

#lab-items-section {
  :deep(.q-hoverable:hover > .q-focus-helper) {
    background-color: #c0d5f4 !important;
  }
}
</style>
