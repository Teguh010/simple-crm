<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import mtUtils from '@/utils/mtUtils'
import aahValidations from '@/utils/aahValidations'
import aahMessages from '@/utils/aahMessages'
import { ref, reactive, onMounted, computed } from 'vue'
import { GenericValueLabelType, Common, CliCommon, Category } from '@/types/types'
import { storeToRefs } from 'pinia'
import { forEach, groupBy, mapValues, sortBy } from 'lodash'

import useCategoryStore from '@/stores/categories'
import useLabPrintStore from '@/stores/lab-prints'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import useLabSetStore from '@/stores/lab-sets'
import useLabDeviceStore from '@/stores/lab-devices'
import MtInputForm from '@/components/form/MtInputForm.vue'

const categoryStore = useCategoryStore()
const labPrintStore = useLabPrintStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const labSetStore = useLabSetStore()
const labDeviceStore = useLabDeviceStore()
const { getCategoriesLB1, getCategoriesLB2 } = storeToRefs(categoryStore)
const { getCommonDeviceOptionActiveList, getCommonDeviceOptionList } = storeToRefs(commonStore)
const { getCliCommonOuterLabRef } = storeToRefs(cliCommonStore)
const { getLabPrints, getLabPrint } = storeToRefs(labPrintStore)

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

interface Props {
  idLabPrint?: number
  callback: Function
}
const props = withDefaults(defineProps<Props>(), {
  callback: () => {}
})

const LAB_SET = 1, LAB_DEVICE = 2, LAB_REF = 3, PET_INFO = 4, GROUP_INFO = 5
const MAX_ROWS_PER_PAGE = 56

const groupInput = ref({
  is_group: true,
  label: '',
  name_button_lab_print: '',
  uniqueId: '',
  flg_delete: 0,
  id_lab_print_ref: props.idLabPrint || '',
  flg_above_blank_row: false,
  flg_indent: false,
  display_order: 0,
  id_clinic: null,
  id_lab_set: null,
  id_lab_device: null,
  id_lab_ref: null,
  type_pet_bio_info: null
})

const labPrintOptions = ref([]), labPrintOptionsDefault = reactive([])
const deviceSetRefPetOptions = ref([
  { label: '手入力検査', value: LAB_SET },
  { label: '院内検査機器', value: LAB_DEVICE },
  { label: '外注検査', value: LAB_REF },
  { label: '体重 / TPR', value: PET_INFO }
])

const search = reactive({
  mode: LAB_SET
})

const petBioRows = [
  { label: '体重', uniqueId: `petbio-1`, code: 1 },
  { label: '体温 T', uniqueId: `petbio-2`, code: 2 },
  { label: '心拍 P', uniqueId: `petbio-4`, code: 4 },
  { label: '呼吸数 R',uniqueId: `petbio-8`, code: 8 }
]

let rowIndex = 0

const categoriesLB2DefaultList = reactive<GenericValueLabelType[]>([])
const categoriesLB2List = ref<GenericValueLabelType[]>([])

const commonDeviceDefaultList = reactive<GenericValueLabelType[]>([])
const commonDeviceList = ref<GenericValueLabelType[]>([])

const commonOuterLabDefaultList = reactive<GenericValueLabelType[]>([])
const commonOuterLabList = ref<GenericValueLabelType[]>([])

const allLabs = ref([]), 
 selectedLabs = ref([])

const temporarlyMovedRows = ref<Set<number>>(new Set([])),
  selectedLabIds = ref<Set<number>>(new Set([]))

const isEdit = ref(false)  

const getTotalPages = computed(() => {
  const totalLabs = selectedLabs.value.reduce((acc, curr) => acc + (curr.flg_above_blank_row ? 2 : 1), 0)
  if(totalLabs > MAX_ROWS_PER_PAGE) {
    const totalPages = Math.floor(totalLabs / MAX_ROWS_PER_PAGE)
    const remainingItems = totalLabs - (totalPages * MAX_ROWS_PER_PAGE)
    return `${totalPages} page ${MAX_ROWS_PER_PAGE}(rows) + ${remainingItems} items`
  }
  return `1 page ${totalLabs}(items)`
})

const addGroupToSelectedList = () => {
  groupInput.value.uniqueId = getUniqueId(groupInput.value)
  groupInput.value.label = groupInput.value.name_button_lab_print

  selectedLabs.value.push({...groupInput.value, flg_delete: 0})
  selectedLabIds.value.add(groupInput.value.uniqueId)
}

const addLabToSelectedList = (idx: number) => {
  const labPrintRecord = allLabs.value[idx]
  if(!selectedLabIds.value.has(labPrintRecord.uniqueId)) {
    selectedLabs.value.push({...labPrintRecord, flg_delete: 0})
    selectedLabIds.value.add(labPrintRecord.uniqueId)
    return
  }
  const element = document.getElementById(labPrintRecord.uniqueId)
  if(element) {
    element.classList.add('scale-up')
    setTimeout(() => {
      element.classList.remove('scale-up')
    }, 500)
  }
}

const removeSelectedItem = (row) => {
  const selectedItem = selectedLabs.value.find((v) => v.uniqueId === row.uniqueId)
  selectedItem.flg_delete = 1
}

const rewriteDisplayOrder = () => {
  selectedLabs.value = selectedLabs.value.map((v, idx) => ({
    ...v,
    display_order: idx + 1
  }))
}

const changeDirection = (idx:number, direction: 'UP' | 'DOWN') => {
  if(selectedLabs.value.length === 1) return
  const currentGroup = selectedLabs.value[idx]
  const totalLabGroups = selectedLabs.value.length

  temporarlyMovedRows.value.add(currentGroup.uniqueId)
  setTimeout(() => {
    temporarlyMovedRows.value.delete(currentGroup.uniqueId)
  }, 1000)

  if (direction === 'UP') {
    const prevGroupIdx = ((idx - 1) + totalLabGroups) % totalLabGroups
    const temp = selectedLabs.value[prevGroupIdx]
    selectedLabs.value[prevGroupIdx] = currentGroup
    selectedLabs.value[idx] = temp
  } else if (direction === 'DOWN') {
    const nextGroupIdx = (idx + 1) % totalLabGroups
    const temp = selectedLabs.value[nextGroupIdx]
    selectedLabs.value[nextGroupIdx] = currentGroup
    selectedLabs.value[idx] = temp
  }

  rewriteDisplayOrder()
  temporarlyMovedRows.value.add(selectedLabs.value[idx].uniqueId)
  setTimeout(() => {
    temporarlyMovedRows.value.delete(selectedLabs.value[idx].uniqueId)
  }, 1000)
}

const changeCategory = async (idCategory: number | null | '') => {

  if(!idCategory) {
    allLabs.value.length = 0
    return
  }

  await labSetStore.fetchLabSets({
    id_category2_lb2: idCategory,
    no_pagination: true,
  })

  const labSets = labSetStore.getLabSets.map(v => {
    const category = categoryStore.getAllCategories.find(c => c.id_category == v.lab?.id_category2_lab)
    return {...v, category}
  })
  
  allLabs.value = mappingLabList(mapValues(
    groupBy(sortBy(labSets, 'category.display_order'), 'id_category2_lb2'),
    (itemsByCategory2Lb2) => mapValues(
      groupBy(itemsByCategory2Lb2, 'id_cm_device'),
      (itemsByDevice) => groupBy(sortBy(itemsByDevice, 'display_order'), 'id_category2_lb1')
    )
  ))
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
          newList.push(value4)
        })
      })
    })
  })

  return newList.map((v) => ({
    isCategoryLB2: v?.isCategoryLB2,
    name_category: v?.name_category,
    isDevice: v?.isDevice,
    name_device: v?.name_device,
    isCategoryLB1: v?.isCategoryLB1,
    label: v.lab?.name_lab,
    labelEn: v.lab?.name_lab_en,
    id_lab_device: v?.id_lab_device,
    id_lab_set: v?.id_lab_set,
    id_lab_ref: v?.id_lab_ref,
    flg_above_blank_row: false,
    flg_indent: false,
    uniqueId: getUniqueId(v),
    flg_delete: 0,
  }))
}

const fetchLabDevice = async (codeDevice: number | null) => {

  if(!codeDevice) {
    allLabs.value.length = 0
    return
  }

  await labDeviceStore.fetchLabDevices({
    code_device: codeDevice
  })

  let newList = [] as Array<object>
  const labDevicesMapping = labDeviceStore.getLabDevices.filter((v) => v.lab).map(v => {
    const category = categoryStore.getAllCategories.find(c => c.id_category == v.lab?.id_category2_lab)
    return {...v, category}
  })
  const lab_devices = groupBy(sortBy(labDevicesMapping, 'category.display_order'), 'lab.id_category2_lab')
  
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
        memo_lab: value2.memo_lab
      })
    })
  })
  allLabs.value = newList.map((v) => ({
    isCategoryLB2: v?.isCategoryLB2,
    name_category: v?.name_category,
    label: v.lab?.name_lab,
    labelEn: v.lab?.name_lab_en,
    id_lab_device: v?.id_lab_device,
    id_lab_set: v?.id_lab_set,
    id_lab_ref: v?.id_lab_ref,
    flg_above_blank_row: false,
    flg_indent: false,
    uniqueId: getUniqueId(v),
    flg_delete: 0,
  }))
}

const changeOuterLabRef = async (codeDevice: number | null) => {

  if (!codeDevice) {
    allLabs.value.length = 0
    return
  }
  await labDeviceStore.fetchLabRefList({
    code_device: codeDevice
  })
  allLabs.value = labDeviceStore.getLabRefList
}

const resetLabRows = () => {
  allLabs.value.length = 0
  search.id_cli_common = search.code_labcat2 = search.device = null
}

const handleLabsSelection = (val: number) => {
  resetLabRows()
  if(val === PET_INFO) {
    allLabs.value = petBioRows.map((v) => ({
      ...v,
      id_lab_device: null,
      id_lab_set: null,
      id_lab_ref: null
    }))
  }
}

const submit = async () => {
  if(selectedLabs.value.length === 0) {
    mtUtils.autoCloseAlert('Please select at least one lab')
    return
  }

  let labItems = selectedLabs.value
    .filter((v) => !v.uniqueId.includes('petbio'))
    .map((v) => {
      const labItem = {
        id_lab_device: v?.id_lab_device,
        id_lab_set: v?.id_lab_set,
        id_lab_ref: v?.id_lab_ref,
        id_lab_print: v?.id_lab_print,
        flg_above_blank_row: v.flg_above_blank_row,
        flg_indent: v.flg_indent,
        flg_delete: v.flg_delete,
        display_order: v.display_order
      }
      if(v.is_group) {
        labItem.is_group = v.is_group
        labItem.name_button_lab_print = v.name_button_lab_print
      }

      return labItem
    })

  selectedLabs.value
    .filter((v) => v.uniqueId.includes('petbio'))
    .forEach((v) => {
      labItems.push({
        type_pet_bio_info: Number(v.uniqueId.replace(/\D/g, '')),
        flg_above_blank_row: v.flg_above_blank_row,
        id_lab_print: v?.id_lab_print,
        flg_indent: v.flg_indent,
        flg_delete: v.flg_delete,
        display_order: v.display_order
      })
    })

  labPrintStore.createLabPrintChilds(search.labPrint, labItems).then(() => {
    props.callback()
    mtUtils.autoCloseAlert(aahMessages.success)
    closeModal()
  })
}

const getRowIndex = (idx) => {
  if(idx === 0) rowIndex = 1
  return rowIndex++
}

const getUniqueId = (record) => {
  if(record.id_lab_set) return `labset-${record.id_lab_set}`
  else if(record.id_lab_device) return `labdevice-${record.id_lab_device}`
  else if(record.id_lab_ref) return `labref-${record.id_lab_ref}`
  else if(record.type_pet_bio_info) return `petbio-${record.type_pet_bio_info}`
  else return `group-${record.id_group}`
}

onMounted( async () => {

  categoryStore.getCategoriesLB2.filter((v) => v.flg_active).forEach((v: Category) => {
    categoriesLB2DefaultList.push({ label: v.name_category, value: v.id_category})
  })
  categoriesLB2List.value = [...categoriesLB2DefaultList]

  if (getCommonDeviceOptionActiveList?.value?.length) {
    getCommonDeviceOptionActiveList.value.forEach((item: Common) => {
      commonDeviceDefaultList.push({ value: item.id_common, label: item.name_common })
    })
    commonDeviceList.value = [...commonDeviceDefaultList]
  }

  if (getCliCommonOuterLabRef?.value?.length) {
    getCliCommonOuterLabRef.value.forEach((item: CliCommon) => {
      commonOuterLabDefaultList.push({ value: item.id_cli_common, label: item.name_cli_common.trim() })
    })
    commonOuterLabList.value = [...commonOuterLabDefaultList]
  }

  labPrintOptions.value = getLabPrints.value.map((v) => ({
    label: v.name_button_lab_print,
    value: v.id_lab_print
  }))
  labPrintOptionsDefault.push(...labPrintOptions.value)

 
  if(props.idLabPrint) {
    isEdit.value = true
    await labPrintStore.getLabPrintById(props.idLabPrint)
    const { lab_print_items: labPrintItems } = getLabPrint.value
    selectedLabs.value = sortBy(labPrintItems.map((labPrint) => {
      const uniqueId = getUniqueId(labPrint)
      let tempLabPrint = {
        ...labPrint,
        label: labPrint.type_pet_bio_info ? petBioRows.find((v) => v.code == labPrint.type_pet_bio_info)?.label : labPrint?.lab?.name_lab,
        labelEn: labPrint.type_pet_bio_info ? petBioRows.find((v) => v.code == labPrint.type_pet_bio_info)?.label : labPrint?.lab?.name_lab_en,
        uniqueId,
        flg_delete: 0
      }
      selectedLabIds.value.add(uniqueId)
      return tempLabPrint
    }).filter((v) => v.flg_delete === 0), 'display_order')

    search.labPrint = props.idLabPrint
    groupInput.value.id_lab_print_ref = props.idLabPrint
    deviceSetRefPetOptions.value.push({ label: 'グループ', value: GROUP_INFO })
  }

})
</script>
<template>
<q-form @submit="submit">
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title
      class="row no-wrap items-center text-grey-900 title2 bold"
        >出力検査項目
    </q-toolbar-title>
    <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
      <q-icon size="xs" name="more_horiz" />
     </q-btn>
  </MtModalHeader>
  <q-card-section class="content">
    <div class="row q-col-gutter-md">
      <div class="col-4">
        <MtFilterSelect
          label="紐づける出力ボタン"
          v-model:options="labPrintOptions"
          v-model:options-default="labPrintOptionsDefault"
          v-model:selecting="search.labPrint"
          required
          :rules="[aahValidations.validationRequired]"
          :disable="isEdit"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-4">
        <MtFormPullDown
          label="出力データ分類"
          v-model:options="deviceSetRefPetOptions"
          v-model:selected="search.mode"
          @update:selected="handleLabsSelection"
          tabindex="2"
        />
      </div>  
      <div class="col-4">
        <MtFilterSelect
          v-if="search.mode == LAB_SET"
          v-model:selecting="search.code_labcat2"
          v-model:options="categoriesLB2List"
          :options-default="categoriesLB2DefaultList"
          type="text"
          label="検査セット"
          class="q-mr-sm selection-field"
          @update:selecting="changeCategory"
        />
        <MtFilterSelect
          v-if="search.mode == LAB_DEVICE"
          v-model:options="commonDeviceList"
          :options-default="commonDeviceDefaultList"
          label="院内検査機器"
          class="q-mr-sm selection-field"
          v-model:selecting="search.device"
          @update:selecting="fetchLabDevice"
        />
        <MtFilterSelect
          v-if="search.mode == LAB_REF"
          v-model:selecting="search.id_cli_common"
          v-model:options="commonOuterLabList"
          :options-default="commonOuterLabDefaultList"
          class="q-mr-sm selection-field"
          label="外注検査"
          @update:selecting="changeOuterLabRef"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col flex column gap-3">
        <template v-if="allLabs.length > 0">
          <template v-for="(row, idx) in allLabs">
           <div>
             <div class="bg-grey-300 q-pa-xs" v-if="row.isCategoryLB2">
               <span> {{ row.name_category }} </span>
             </div>
             <div class="bg-grey-200 q-pa-xs" v-else-if="row.isDevice">
               <span> {{ row.name_device }} </span>
             </div>
             <div class="bg-grey-100 q-pa-xs" v-else-if="row.isCategoryLB1">
               <span> {{ row.name_category }} </span>
             </div>
             <div v-else class="bg-accent-200 q-py-xs flex items-center justify-between cursor-pointer q-px-lg" @click="addLabToSelectedList(idx)">
              <span>{{row?.label}}<span v-if="row?.labelEn" class="caption1 regular">（{{row?.labelEn}}）</span></span>
              <q-icon name="play_arrow" class="text-grey-900" size="13px"/>
             </div>
           </div>
          </template>
        </template>
        <template v-else-if="search.mode === GROUP_INFO">
          <div class="text-center flex">
            <MtInputForm type="text" label="Group Name" v-model="groupInput.name_button_lab_print" />
            <q-btn color="primary" label="Add" @click="addGroupToSelectedList" />
          </div>
        </template>
      </div>
      <div class="col flex column gap-3">
        <template v-for="(row, idx) in sortBy(selectedLabs.filter((v) => v.flg_delete === 0), 'display_order')">
           <div class="bg-white q-px-md q-py-xs" v-if="row.flg_above_blank_row">
             <span class="caption1 bold text-grey-800 q-mr-sm"></span> 
           </div>
           <div
            class="q-py-xs flex justify-between items-center cursor-pointer q-px-md"
             :id="row.uniqueId"
             :class="temporarlyMovedRows.has(row.uniqueId) ? 'bg-accent-200' : (row.name_button_lab_print ? 'bg-grey-100' : 'bg-yellow')">
             <div>
              <span class="caption1 bold text-grey-800 q-mr-sm" :class="row.flg_indent ? 'q-pl-md' : ''">{{ getRowIndex(idx) + "." }}</span> 
              <span class="caption1 bold text-grey-900">{{row.labelEn || row.label || row.name_button_lab_print}}</span>
             </div>
             <div class="flex items-center">
               <div v-if="!row.name_button_lab_print">
                 <MtFormCheckBox label="1つ上空行" v-model:checked="row.flg_above_blank_row" />
                 <MtFormCheckBox label="インデント" v-model:checked="row.flg_indent" class="q-mx-md" />
               </div>
               <q-icon name="arrow_upward" @click="changeDirection(idx, 'UP')" />
               <q-icon name="arrow_downward" class="q-ml-sm q-mr-md" @click="changeDirection(idx, 'DOWN')" />
               <q-icon name="close" @click="removeSelectedItem(row)" class="text-darkred" />
             </div>
           </div>
           <div >
             <q-separator v-if="(idx + 1) % MAX_ROWS_PER_PAGE == 0" class="q-my-sm" />
           </div>
        </template>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt q-pt-xs bg-white">
    <div class="row">
      <div class="col-9">
        <div class="text-right modal-btn">
          <q-btn 
            outline 
            class="bg-grey-100 text-grey-800"
            @click="closeModal"
            >
          <span>キャンセル</span>
          </q-btn>
          <q-btn
            class="q-ml-md"
            color="primary"
            type="submit"
            unelevated
            >
            <span>保存</span>
          </q-btn>
        </div>
      </div>
      <div class="col-3">
        <div class="text-right q-mt-sm">
          {{ getTotalPages }}
        </div>
      </div>
    </div>
  </q-card-section>
  </q-form>
</template>
<style lang="scss">
.scale-up {
  transform: scale(1.02);
  transition: transform 0.5s;
}
</style>