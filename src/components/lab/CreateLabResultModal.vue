<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import MtModalHeader from '../MtModalHeader.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import MtFormInputDateTime from '../form/MtFormInputDateTime.vue'
import MtFormMultipleSelection from '../form/MtFormMultipleSelection.vue'
import aahValidations from '@/utils/aahValidations'
import MtFormInputText from '../form/MtFormInputText.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useCategoryStore from '@/stores/categories'
import { flatMap, groupBy, mapValues, sortBy } from 'lodash'
import MtTable2 from '../MtTable2.vue'
import useLabResultStore from '@/stores/lab-results'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '../OptionModal.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import { concatenate, formatDateWithTime, getCurrentPetAgeInMonth, getDateTimeNow } from '@/utils/aahUtils'
import useCommonStore from '@/stores/common'
import { Common, GenericValueLabelType, LabRange, TextTemplateType } from '@/types/types'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useLabDeviceStore from '@/stores/lab-devices'
import useTextTemplateStore from '@/stores/text-template'
import MtFormRadiobtn from '../form/MtFormRadiobtn.vue'
import MtFormPullDown from '../form/MtFormPullDown.vue'
import useLabSetStore from '@/stores/lab-sets'
import selectOptions from '@/utils/selectOptions'
import useMemoCarteStore from '@/stores/memo-cartes'
import MtPetInfo from '../MtPetInfo.vue'
import { QSpinner } from 'quasar'

const props = defineProps({id_pet: String, id_pet_illness_history: String, additional: Object})
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }

const templateStore = useTextTemplateStore()
const categoryStore = useCategoryStore()
const customerStore = useCustomerStore()
const labDeviceStore = useLabDeviceStore()
const labResultStore = useLabResultStore()
const illnessHistoryStore = useIllnessHistoryStore()
const commonStore = useCommonStore()
const labSetStore = useLabSetStore()
const memoCarteStore = useMemoCarteStore()

const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)
const { getSubCategories, getCategoriesLB2 } = storeToRefs(categoryStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getCommonUnitOptionList, getCommonDeviceOptionActiveList } = storeToRefs(commonStore)

const petList: any = ref([])
const labSelectedList: any = ref([])
const deviceList: any = ref([])
const deviceListDefault: any = reactive([])
const code_device = ref(null)
const search = ref({
  id_category_selected: [],
  id_device: null,
  lab_set: '1',
  code_labcat2: '',
  device: '',
})
const data = ref({
  datetime_registered: formatDateWithTime(getDateTimeNow(), 'YYYY-MM-DD HH:mm'),
  id_pet: props.id_pet,
  code_labgrpcat2: null,
  id_category2_lb2: null,
  id_employee_registered: JSON.parse(localStorage.getItem('id_employee') || null),
  id_pet_illness_history: null,
  device: null,
  memo_alert: '',
  id_service_detail: null,
  number_service_detail: null
})
const columns = [
  { name: 'name_lab', label: '項目', field: 'name_lab', align: 'center', style: 'width: 20%', headerStyle: 'width: 20%' },
  { name: 'id_cm_unit', label: '単位', field: 'id_cm_unit', align: 'center', style: 'width: 6%' },
  { name: 'qualifier', label: '符号', field: 'qualifier', align: 'center', style: 'width: 12%' },
  { name: 'val_result', label: '値', field: 'val_result', align: 'center', style: 'width: 30px' },
  { name: 'range', label: '基準値', field: 'range', align: 'center', style: 'width: 20%' },
  { name: 'memo_lab', label: '説明', field: 'memo_lab', align: 'left', style: 'width: 30px; font-size: 15px' },
  { name: 'action', label: '', field: 'action', align: 'center', style: 'width: 10px' }
]
const addTemplateModalFlg = ref(false)
const qualifiers = ref()
const currentIdCategory = ref(-1)
const currentIdDevice = ref(-1)
const currentQualifier = ref(-1)

const serviceDetailListByPet = ref([])

const categoriesLB2DefaultList = reactive<GenericValueLabelType[]>([])
const categoriesLB2List = ref<GenericValueLabelType[]>([])

const commonDeviceDefaultList = reactive<GenericValueLabelType[]>([])
const commonDeviceList = ref<GenericValueLabelType[]>([])

const categoryLabCounts = ref<{ [key: string]: number } | null>(null)

const openQualifierModal = (id_category: number, qualifier: number, id_device = null) => {
  if (search.value.lab_set == '1' && id_device) currentIdDevice.value = id_device
  currentIdCategory.value = id_category
  currentQualifier.value = qualifier
  addTemplateModalFlg.value = true
}
const handleUpdateQualifier = (value: string | number) => {
  if (currentIdCategory.value != -1 || currentQualifier.value != -1 && value) {
    if (search.value.lab_set == '1')
      labSelectedList.value[currentIdDevice.value][currentIdCategory.value][currentQualifier.value].qualifier = value
    else if (search.value.lab_set == '2')
      labSelectedList.value[currentIdCategory.value][currentQualifier.value].qualifier = value

    currentIdCategory.value = -1
    currentQualifier.value = -1

    qualifiers.value = templateStore.getTemplates?.map((item: TextTemplateType) => ({...item, title: item.memo_template, isSelected: false}))
  }
}

const getDeviceName = (id_device: number) => {
  if (id_device) {
    const device = commonStore.getCommonDeviceOptionActiveList.find((v) => v.id_common == id_device)
    if (device) return device?.name_common + ' ' + device?.code_func1
  }
  return '機器なし'
}
const getCategoryName = (id_category: number) => categoryStore.getCategoriesLB1.find((v) => v.id_category == id_category)?.name_category
const getCategoryDeviceName = (id_category_device: number) => {
  if (search.value.lab_set == '1')
    return categoryStore.getCategoriesLB1.find((v) => v.id_category == id_category_device)?.name_category
  else
    return commonStore.getCommonDeviceOptionActiveList.find((v) => v.id_common == id_category_device)?.name_common
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: 'URLコピー',
      name: 'url_copy',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            // TO DO : DELETE FUNCTION
          }
        })
    } else if (selectedOption.name == 'url_copy') {
      // TO DO : URL COPY FUNCTION
      try {
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました。')
      }
    }
  }
}
const updatePetSelected = (id_pet: string) => {
  illnessHistoryStore.fetchIllnessHistorys({ id_pet: id_pet, id_customer: getCustomer.value?.id_customer })
}

const changeCategory = (value) => {
  labSelectedList.value = []
  if (value) {
    data.value.id_category2_lb2 = value
    const payload = {id_category : value}
    fetchLabSets(payload)
  }
}

const fetchLabSets = async (value: {id_category: number} | null = null) => {
  if (value) {
    await labSetStore.fetchLabSets({
      id_category2_lb2: value.id_category,
      no_pagination: true,
    })

    labSelectedList.value = mapValues(
      groupBy(
        sortBy(labSetStore.getLabSets
          .map((v) => ({ ...v, qualifier: '', val_result: '' })), 'display_order'), 
        'id_category2_lb2'
      ),
      (deviceGroup) => groupBy(deviceGroup, 'id_category2_lb1')
    )
  }
}

const changeLabSet = () => {
  labSelectedList.value = []
  data.value.code_labgrpcat2 = null
  data.value.device = null
  search.value.id_category2_lb2 = ''
  search.value.device = ''
}

const changeDevice = (value) => {
  data.value.device = commonStore.getCommonDeviceOptionActiveList.find((v) => v.id_common == value)
  fetchLabDevice(value)
}
const fetchLabDevice = async (value: number | null = null) => {
  if (!value) {
    labSelectedList.value = []
  } else {
    await labDeviceStore.fetchLabDevices({
      code_device: value,
    })
    labSelectedList.value = { [value]: sortBy(labDeviceStore.getLabDevices.filter((v) => v.lab), 'display_order') }
  }
}

const removeItem = (id_category, lab) => {
  const indexToRemove = labSelectedList.value[id_category].findIndex(item => item.id_lab === lab.id_lab);
  if (indexToRemove !== -1) {
    labSelectedList.value[id_category].splice(indexToRemove, 1);
  }
}
const typeLabUnitName = (value) => {
  return commonStore.getCommonUnitOptionList.find(item => item.id_common === value)?.name_common
}

const getRangeIndex = (lab_ranges: Array<LabRange>) => {
  if (!lab_ranges?.length) return -1

  // Priority 1: Match all three attributes
  const fullMatch = lab_ranges.findIndex(v => 
    v.id_cm_animal == getPet.value?.id_cm_animal &&
    v.pet_gender == getPet.value?.type_pet_gender &&
    isInAgeRange(v.min_age_mon, v.max_age_mon)
  )
  if (fullMatch !== -1) return fullMatch

  // Priority 2: Match animal_id and gender only
  const genderMatch = lab_ranges.findIndex(v =>
    v.id_cm_animal == getPet.value?.id_cm_animal &&
    v.pet_gender == getPet.value?.type_pet_gender &&
    !v.min_age_mon && !v.max_age_mon
  )
  if (genderMatch !== -1) return genderMatch

  // Priority 3: Match only animal_id
  const animalIdMatch = lab_ranges.findIndex(v =>
    v.id_cm_animal == getPet.value?.id_cm_animal &&
    !v.pet_gender &&
    !v.min_age_mon && !v.max_age_mon
  )
  if (animalIdMatch !== -1) return animalIdMatch

  // Priority 4: Default case - single record with no attributes
  if (lab_ranges.length == 1 &&
      !lab_ranges[0].id_cm_animal &&
      (!lab_ranges[0].pet_gender  || lab_ranges[0].pet_gender == 10) &&
      !lab_ranges[0].min_age_mon &&
      !lab_ranges[0].max_age_mon) {
    return 0
  }

  return -1
}

const isInAgeRange = (min_age_mon: string | number, max_age_mon: string | number) => {
  const currentAge = getCurrentPetAgeInMonth(getPet.value)
  if (!currentAge) return false
  
  const minAge = min_age_mon && min_age_mon != '-1' ? Number(min_age_mon) : null
  const maxAge = max_age_mon && max_age_mon != '-1' ? Number(max_age_mon) : null

  if (minAge === null && maxAge === null) return false
  if (minAge === null) return currentAge <= maxAge
  if (maxAge === null) return currentAge >= minAge
  return currentAge >= minAge && currentAge <= maxAge
}

const showRange = (lab_ranges: Array<LabRange>) => {
  const index = getRangeIndex(lab_ranges)

  if (lab_ranges?.[index]?.low || lab_ranges?.[index]?.high)
    return `${lab_ranges?.[index]?.low || '-'} ~ ${lab_ranges?.[index]?.high || '-'}`

  return ''
}

const fetchMemoCarteList = async () => {
  let payload: any = {
    id_pet: getPet.value?.id_pet,
    id_customer: getCustomer.value?.id_customer
  }
  await Promise.all([memoCarteStore.fetchMemoCarteV1(payload)])
}

const submit = async () => {
  data.value.datetime_registered = formatDateWithTime(data.value.datetime_registered, 'YYYY-MM-DD HH:mm')

  let labResultSelectedList = flatMap(labSelectedList.value)
  if (search.value.lab_set == '1') 
    labResultSelectedList = flatMap(labSelectedList.value, (category2) =>
      flatMap(category2)
    )

  const labData = labResultSelectedList
    .filter((lab) => lab?.val_result || lab?.qualifier)
    .map((lab) => ({
      name_lab: lab?.lab?.name_lab,
      name_lab_en: lab?.lab?.name_lab_en,
      id_category2_lab: lab?.id_category2_lb1,
      id_category2_lb2: lab?.id_category2_lb2,
      id_lab: parseInt(lab?.lab?.id_lab),
      qualifier: lab?.qualifier,
      val_result: lab?.val_result?.toString()?.replace(',', ''),
      id_pet: data.value.id_pet,
      id_pet_illness_history: data.value.id_pet_illness_history?.[0]?.id_pet_illness_history,
      id_employee_registered: data.value.id_employee_registered,
      seq_processed: 1,
      datetime_registered: data.value.datetime_registered + ':00',
      code_device: data.value.device?.code_common,
      name_device: data.value.device?.label,
      id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
      id_cm_device: data.value.device?.id_common,
      name_unit_result: getCommonUnitOptionList.value.find((item: Common) => item.id_common === lab?.id_cm_unit)?.name_common,
      name_unit_device: getCommonDeviceOptionActiveList.value.find((item: Common) => item.id_common === data.value.device?.id_common)?.text1,
      id_cm_unit: lab?.id_cm_unit,
      low: lab?.lab_range?.[getRangeIndex(lab?.lab_range)]?.low,
      low_critical: lab?.lab_range?.[getRangeIndex(lab?.lab_range)]?.low_critical,
      high: lab?.lab_range?.[getRangeIndex(lab?.lab_range)]?.high,
      high_critical: lab?.lab_range?.[getRangeIndex(lab?.lab_range)]?.high_critical,
      id_service_detail: data.value.id_service_detail,
      number_service_detail: data.value.number_service_detail
    }))

  await labResultStore.submitLabResult({ lab_result: labData }).then(() => {
    fetchMemoCarteList()
  })
  mtUtils.autoCloseAlert(aahMessages.success)
  closeModal()
}

async function fetchServiceDetailByPet() {
  let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'service_details', {
    id_pet: data.value.id_pet,
    lab: true
  })
  if (res) {
    serviceDetailListByPet.value = res.map((item: any) => ({
      label: `${item.number_service_detail} ${item.name_item_service}`,
      value: item.id_service_detail,
      number_service_detail: item.number_service_detail,
      name_item_service: item.name_item_service
    }))
  }
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
  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [7] }, true),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB1_' }, 'LB1'),
    templateStore.fetchTemplates({ type_text_template: 45 }),
    fetchServiceDetailByPet()
  ])
  petList.value.length = 0
  petList.value = [...getCustomer.value?.pets]

  deviceListDefault.length = 0
  deviceList.value.length = 0

  commonStore.getCommonDeviceOptionActiveList.map((item) => {
    const temObj = {
      label: concatenate(item.name_common, item.name_device),
      id_common:item.id_common,
    }

    deviceListDefault.push(temObj)
    deviceList.value.push(temObj)
  })

  qualifiers.value = templateStore.getTemplates?.map((item: TextTemplateType) => ({...item, title: item.memo_template, isSelected: false}))

  if (getIllnessHistorys.value.length === 0) illnessHistoryStore.fetchIllnessHistorys({ id_pet: props.id_pet, id_customer: getCustomer.value?.id_customer })

  if (props.id_pet_illness_history)
    data.value.id_pet_illness_history = [props.id_pet_illness_history]
  else if (getIllnessHistorys.value.length > 0)
    data.value.id_pet_illness_history = [getIllnessHistorys.value[0]]

  if (props.additional) {
    if (props.additional.lab_set_type == 'lab-device') {
      if (props.additional.deviceCategory) {
        search.value.lab_set = '2'
        data.value.device = deviceList.value.find((v: Common) => v.id_common == props.additional?.deviceCategory)
        search.value.device = props.additional?.deviceCategory
        changeDevice(props.additional?.deviceCategory)
      }
    } else if (props.additional.lab_set_type == 'lab-set') {
      if (props.additional.deviceCategory) {
        search.value.lab_set = '1'
        search.value.id_category2_lb2 = props.additional?.deviceCategory
        changeCategory(props.additional?.deviceCategory)
      }
    }
  }

  if (getCategoriesLB2?.value?.length) {
    getCategoriesLB2.value.forEach((item) => {
      categoriesLB2DefaultList.push({ value: item.id_category, label: item.name_category })
    })
    categoriesLB2List.value = [...categoriesLB2DefaultList]
  }

  if (getCommonDeviceOptionActiveList?.value?.length) {
    getCommonDeviceOptionActiveList.value.forEach((item: Common) => {
      commonDeviceDefaultList.push({ value: item.id_common, label: item.name_common })
    })
    commonDeviceList.value = [...commonDeviceDefaultList]
  }

  initLabCounts()
})
</script>

<template>
  <MtModalHeader class="q-bb mt-header" @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold row items-center">
      検査結果
      <MtPetInfo class="ellipsis full-width" />
    </q-toolbar-title>
    <q-btn round flat @click="openMenu" class="q-mx-sm">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
  </MtModalHeader>
  <!-- <q-form> -->
  <q-card-section class="content q-py-md q-px-xl">
    <div class="row q-gutter-md">
      <div class="col-2">
        <MtFormInputDateTime
          v-model:date="data.datetime_registered"
          required
          :rules="[aahValidations.validationRequired]"
          label="検査日時"
        />
      </div>
      <div class="col-3">
        <MtFormRadiobtn @update:selected="changeLabSet" :disable="props.additional?.strict" v-model:selected="search.lab_set" label="手入力検査" val="1" />
        <MtFormRadiobtn @update:selected="changeLabSet" :disable="props.additional?.strict" v-model:selected="search.lab_set" label="院内検査機器" val="2" class="q-mr-md" />
      </div>
      <div class="col">
        <MtFilterSelect
          v-if="search.lab_set == '1'"
          v-model:selecting="search.id_category2_lb2"
          v-model:options="categoriesLB2List"
          :options-default="categoriesLB2DefaultList"
          :disable="props.additional?.strict"
          label="手入力検査"
          class="q-mr-sm selection-field"
          outlined
          @update:selecting="changeCategory"
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
          :disable="props.additional?.strict"
          label="院内検査機器"
          class="q-mr-sm selection-field"
          outlined
          @update:selecting="changeDevice"
          v-model:selecting="search.device"
        />
        <!-- <MtFormPullDown
          v-if="search.lab_set == '1'"
          option-label="name_category"
          option-value="id_category"
          :options="getCategoriesLB2"
          label="手入力検査"
          class="q-mr-sm selection-field"
          outlined
          :disable="props.additional?.strict"
          @update:selected="changeCategory"
          v-model="search.code_labcat2"
        />
        <MtFormPullDown
          v-if="search.lab_set == '2'"
          option-label="name_common"
          option-value="id_common"
          :options="commonStore.getCommonDeviceOptionActiveList"
          label="院内検査機器"
          class="q-mr-sm selection-field"
          outlined
          :disable="props.additional?.strict"
          @update:selected="changeDevice"
          v-model="search.device"
        /> -->
      </div>
    </div>
    <div class="row q-gutter-md q-mb-md">
      <div class="col-2">
        <MtFormMultipleSelection
          :options="getIllnessHistorys"
          :option-label="(v) => v.name_disease ? v.name_disease : v.name_disease_free"
          v-model="data.id_pet_illness_history"
          required
          dense
          :rules="[aahValidations.validationRequired]"
          label="現疾患・既往歴"
          show-quick-illness-history
        />
      </div>
      <div class="col-2">
        <InputEmployeeOptGroup
          v-model:selected="data.id_employee_registered"
          label="担当者 *"
        />
      </div>
      <div class="col-3">
        <MtFormPullDown
          v-model:selected="data.id_service_detail"
          :options="serviceDetailListByPet"
          label="検査・連携治療サービス"
          @update:selected="(value)=>{
            if(value) {
              data.number_service_detail = serviceDetailListByPet.find(item=> value == value)?.number_service_detail
            }
          }"
        >

        </MtFormPullDown>
      </div>
    </div>

    <template v-if="search.lab_set == '1'">
      <div v-for="(devices, id_device) in labSelectedList">
        <div class="bg-grey-300 q-pa-xs">
          <div class="q-ml-sm">
            {{ getDeviceName(id_device) }}
          </div>
        </div>
        <div v-for="(labs, id_category) in devices">
          <div class="bg-grey-200 q-pa-xs">
            <div class="q-ml-sm">
              {{ id_category ? getCategoryName(id_category) : '' }}
            </div>
          </div>
          <MtTable2
            :columns="columns"
            :rows="labs"
            :rowsBg="true"
            :style="{overflow: 'unset'}"
            :styleTableOnModal="true"
            flat
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
            <template v-slot:row="{ row, index }">
              <td
                class="cursor-pointer items-center"
                v-for="(col, idxcolumn) in columns"
                :key="idxcolumn"
              >
                <div>
                  <div v-if="col.field === 'name_lab'">
                    <div class="flex no-wrap full-width">
                      <div class="q-mr-md">
                        {{ row?.lab?.name_lab_en }}
                      </div>
                      <div class="full-width">
                        {{ row?.lab?.name_lab }}
                      </div>
                    </div>
                  </div>
                  <div v-else-if="col.field === 'qualifier'" class="flex no-wrap">
                    <MtFormInputText v-model="row.qualifier" class="q-pa-none q-mr-xs">
                      <template v-slot:append>                      
                        <q-icon name="add" class="cursor-pointer" @click="openQualifierModal(id_category, index, id_device)" />                      
                      </template>
                    </MtFormInputText>
                  </div>
                  <div v-else-if="col.field === 'val_result'">
                    <MtFormInputText
                      v-model="row.val_result"
                      input-class="text-right"
                    />
                  </div>
                  <div v-else-if="col.field === 'range'" class="text-center">
                    {{ showRange(row.lab_range) }}
                  </div>
                  <div v-else-if="col.field === 'date'">
                    <div class="row">
                      <div class="col-6">
                        {{ row.lab.qualifier }}
                      </div>
                      <div class="col-6">
                        {{ row.lab.val_result }}
                      </div>
                    </div>
                  </div>
                  <div v-else-if="col.field === 'id_cm_unit'">
                    {{ typeLabUnitName(row.id_cm_unit) }}
                  </div>
                  <div v-else-if="col.field === 'memo_lab'" class="text-left regular">
                    {{ row[col.field] ? row[col.field] : '' }}
                  </div>
                  <div v-else class="body1 text-center regular text-grey-900">
                    {{ row[col.field] ? row[col.field] : '' }}
                  </div>
                </div>
              </td>
            </template>
          </MtTable2>
        </div>
      </div>
    </template>

    <template v-else-if="search.lab_set == '2'">
      <div v-for="(labs, id_category) in labSelectedList">
        <div class="flex justify-between bg-grey-300 q-pa-xs">
          <div class="q-ml-sm">
            {{ id_category ? getCategoryDeviceName(id_category) : '' }}
          </div>
        </div>
        <MtTable2
          :columns="columns"
          :rows="labs"
          :rowsBg="true"
          :style="{overflow: 'unset'}"
          :styleTableOnModal="true"
          flat
          no-data-message="登録がありません。"
          no-result-message="該当のデータが見つかりませんでした"
        >
          <template v-slot:row="{ row, index }">
            <td
              class="cursor-pointer items-center"
              v-for="(col, idxcolumn) in columns"
              :key="idxcolumn"
            >
              <div>
                <div v-if="col.field === 'name_lab'">
                  <div class="flex no-wrap full-width">
                    <div class="q-mr-md">
                      {{ row?.lab?.name_lab_en }}
                    </div>
                    <div class="full-width">
                      {{ row?.lab?.name_lab }}
                    </div>
                  </div>
                </div>
                <div v-else-if="col.field === 'qualifier'" class="flex no-wrap">
                  <MtFormInputText v-model="row.qualifier" class="q-pa-none q-mr-xs">
                    <template v-slot:append>                      
                      <q-icon name="add" class="cursor-pointer" @click="openQualifierModal(id_category, index)" />                      
                    </template>
                  </MtFormInputText>
                </div>
                <div v-else-if="col.field === 'val_result'">
                  <MtFormInputText
                    v-model="row.val_result"
                    input-class="text-right"
                  />
                </div>
                <div v-else-if="col.field === 'range'" class="text-center">
                  {{ showRange(row.lab_range) }}
                </div>
                <div v-else-if="col.field === 'date'">
                  <div class="row">
                    <div class="col-6">
                      {{ row.lab.qualifier }}
                    </div>
                    <div class="col-6">
                      {{ row.lab.val_result }}
                    </div>
                  </div>
                </div>
                <div v-else-if="col.field === 'id_cm_unit'">
                  {{ typeLabUnitName(row.id_cm_unit) }}
                </div>
                <div class="q-mt-md self-items-center flex justify-end" v-else-if="col.field === 'action'">
                  <q-icon
                    name="cancel"
                    @click.stop="removeItem(id_category, row)"
                    class="cursor-pointer clear-icon text-grey-600"
                    size="21px"
                  />
                </div>
                <div v-else-if="col.field === 'memo_lab'" class="text-left regular">
                  {{ row[col.field] ? row[col.field] : '' }}
                </div>
                <div v-else class="body1 text-center regular text-grey-900">
                  {{ row[col.field] ? row[col.field] : '' }}
                </div>
              </div>
            </td>
          </template>
        </MtTable2>
      </div>
    </template>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="submit" type="submit">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
  <!-- </q-form> -->

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="検査結果 入力テンプレート"
    :options="qualifiers"
    :data="labSelectedList"
    :single-option="true"
    @update:memo="handleUpdateQualifier"
  />
</template>