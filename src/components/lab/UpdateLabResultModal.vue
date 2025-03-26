<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import MtModalHeader from '../MtModalHeader.vue'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import MtFormInputDateTime from '../form/MtFormInputDateTime.vue'
import MtFormMultipleSelection from '../form/MtFormMultipleSelection.vue'
import aahValidations from '@/utils/aahValidations'
import MtFormInputText from '../form/MtFormInputText.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useCategoryStore from '@/stores/categories'
import { flatMap, forEach, groupBy, mapValues, orderBy } from 'lodash'
import MtTable2 from '../MtTable2.vue'
import useLabResultStore from '@/stores/lab-results'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '../OptionModal.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCommonStore from '@/stores/common'
import { Category, Common, LabRange, TextTemplateType } from '@/types/types'
import { concatenate, formatDateWithTime, getCurrentPetAgeInMonth } from '@/utils/aahUtils'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useTextTemplateStore from '@/stores/text-template'
import useServiceDetailStore from '@/stores/service-details'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import MtFormRadiobtn from '../form/MtFormRadiobtn.vue'
import MtFormPullDown from '../form/MtFormPullDown.vue'
import GetPdfLabResultOne from '@/pages/labResult/GetPdfLabResultOne.vue'
import MtInputForm from '../form/MtInputForm.vue'
import selectOptions from '@/utils/selectOptions'
import useLabSetStore from '@/stores/lab-sets'
import MtPetInfo from '../MtPetInfo.vue'

const props = defineProps({
  id_pet: String,
  id_pet_illness_history: Number,
  date: String,
  id_category2_lab: Number,
  id_device_category: Number,
  lab_set_type: String
})
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }

const templateStore = useTextTemplateStore()
const categoryStore = useCategoryStore()
const customerStore = useCustomerStore()
const labResultStore = useLabResultStore()
const commonStore = useCommonStore()
const illnessHistoryStore = useIllnessHistoryStore()
const serviceDetailStore = useServiceDetailStore()
const labSetStore = useLabSetStore()

const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)
const { getAllSubCategories } = storeToRefs(categoryStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getCommonDeviceOptionList, getCommonDeviceOptionActiveList, getCommonUnitOptionList } = storeToRefs(commonStore)
const { getLabResultsByPet } = storeToRefs(labResultStore)
const { getServiceDetail } = storeToRefs(serviceDetailStore)

const petList: any = ref([])
const labSelectedList: any = ref([])
const deviceList: any = ref([])
const deviceListDefault: any = reactive([])
const data = ref({
  datetime_registered: null,
  id_pet: props.id_pet,
  instpet_id: null,
  id_employee_registered: null,
  id_pet_illness_history: [] as number[],
  device: null,
  lab_set: '',
  code_labcat2: '',
  id_service_detail: null,
  number_service_detail: null
})
const columns = [
  { name: 'name_lab', label: '項目', field: 'name_lab', align: 'center', style: 'width: 20%', headerStyle: 'width: 20%' },
  { name: 'id_cm_unit', label: '単位', field: 'id_cm_unit', align: 'center', style: 'width: 6%' },
  { name: 'qualifier', label: '符号', field: 'qualifier', align: 'center', style: 'width: 20px' },
  { name: 'val_result', label: '値', field: 'val_result', align: 'center', style: 'width: 25px' },
  { name: 'memo_alert', label: 'アラート', field: 'memo_alert', align: 'center', style: 'width: 20px' },
  { name: 'range', label: '基準値', field: 'range', align: 'center', style: 'width: 20px' },
  { name: 'memo_lab', label: '説明', field: 'memo_lab', align: 'left', style: 'width: 50px' },
  { name: 'action', label: '', field: 'action', align: 'center', style: 'width: 8px' }
]
const addTemplateModalFlg = ref(false)
const qualifiers = ref()
const currentIdCategory = ref(-1)
const currentIdDevice = ref(-1)
const currentQualifier = ref(-1)

const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])
const serviceDetailListByPet = ref([])

const labResultRowsData = ref([])
const pdfConfirmationDialog = ref(false)
const pdfConfiguration = reactive({
  color: '1',
  flgShowValResultBg: true,
  flgShowIcons: true
})
const pdfAttributes = reactive({
  labResult: { render: false, mode: 'download' }
})

const openQualifierModal = (id_category: number, qualifier: number, id_device = null) => {
  if (data.value.lab_set == '1' && id_device) currentIdDevice.value = id_device
  currentIdCategory.value = id_category
  currentQualifier.value = qualifier
  addTemplateModalFlg.value = true
}
const handleUpdateQualifier = (value: string | number) => {
  
 if(value){
 
  if (currentIdCategory.value != -1 || currentQualifier.value != -1 && value) {
    if (data.value.lab_set == '1'){
      
      labSelectedList.value[currentIdDevice.value][currentIdCategory.value][currentQualifier.value].qualifier = value
    }
    
    else if (data.value.lab_set == '2')
   

      labSelectedList.value[currentIdCategory.value][currentQualifier.value].qualifier = value

    currentIdCategory.value = -1
    currentQualifier.value = -1

    qualifiers.value = templateStore.getTemplates?.map((item: TextTemplateType) => ({...item, title: item.memo_template, isSelected: false}))
  }
 }
  
}

const onServiceDetailClick = async (id_service_detail: string) => {
  serviceDetailStore.fetchServiceDetailById(id_service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
  await serviceDetailStore.fetchServiceDetailById(getServiceDetail.value?.id_service_detail)
  data.value.memo_service = getServiceDetail.value?.memo_service
}

const togglePdfConfirmation = () => {
  pdfConfirmationDialog.value = !pdfConfirmationDialog.value
}
const openAddTextTemplateModal = async (value: number) => {
  typeMemoSelected.value = value
  await templateStore.fetchTemplates({ type_text_template: value })

  memoTemplates.value = templateStore.getTemplates.filter((template) => {
    return template.type_text_template === value
  }).map((template: any) => {
    return {
      title: template.memo_template,
      flg_title: template.flg_title,
      attr: {
        class: template.flg_title ? 'bg-grey-300' : ''
      },
      isSelected: false
    }
  })

  addTemplateModal.value = true
}
const handleUpdateMemo = (value: string, type: number) => {
  if (type === 32) {
    data.value.memo_service = data.value.memo_service ? `${data.value.memo_service} ${value}` : `${value}`
    return
  }
}

const openLabResultOneModal = async (confirmation: string = 'sendMyVetty') => {
  labResultRowsData.value.length = 0

  if (data.value.lab_set == '1') {
    forEach(labSelectedList.value,
      (items, id_category) => {
        const category = getAllSubCategories.value.find((v: Category) => v.id_category == id_category)
        labResultRowsData.value.push({ flgNameRow: true, ...category })
        forEach(items, ((item) =>
          forEach(item, lab => {
            labResultRowsData.value.push(lab)
          })
        ))
      }
    )
  } else if (data.value.lab_set == '2') {
    forEach(labSelectedList.value, (items, id_device) => {
      const device = commonStore.getCommonDeviceOptionList.find((v) => v.id_common == id_device)
      labResultRowsData.value.push({ flgNameRow: true, ...device })
      forEach(items, (item => labResultRowsData.value.push(item)))
    })
  }
  
  pdfAttributes.labResult.render = true
  pdfAttributes.labResult.mode = confirmation
}

const fillPdfToPPs = (pdf_blob: Blob, pdfFileName: string = '') => {
  if(pdfFileName.length == 0){
    pdfFileName = `${date.formatDate(Date.now(), 'YYYYMMDD')}_比較_${getCustomerName(getCustomer.value)}様`
  }
  const name_customer = getCustomer.value.name_customer_display
  const clinic = JSON.parse(localStorage.getItem('clinic'))?.label
  const message_content = `${name_customer} 様<br><br>検査結果を以下に添付させていただきます。<br>ご確認をお願いいたします。 `
  mtUtils.popup(UpdateInfoListModal, {
    predefinedFile: pdf_blob,
    predefinedMessage: message_content,
    customerObj: getCustomer.value,
    lineMessageType: 'lab_report',
    pdfFileName: pdfFileName,
    fromLabResult: true
  })
}

const getDeviceName = (id_device: number) => {
  if (id_device) {
    const device = commonStore.getCommonDeviceOptionList.find((v) => v.id_common == id_device)
    if (device) return device?.name_common + ' ' + device?.code_func1
  }
  return '機器なし'
}
const getCategoryName = (id_category: number) => categoryStore.getCategoriesLB1.find((v) => v.id_category == id_category)?.name_category

const getRangeIndex = (lab_ranges: Array<LabRange>) => {
  if (!lab_ranges?.length) return -1

  // Priority 1: Match all three attributes
  const fullMatch = lab_ranges.findIndex(v => 
    v.id_cm_animal_id == getPet.value?.id_cm_animal_id &&
    v.pet_gender == getPet.value?.type_pet_gender &&
    isInAgeRange(v.min_age_mon, v.max_age_mon)
  )
  if (fullMatch !== -1) return fullMatch

  // Priority 2: Match animal_id and gender only
  const genderMatch = lab_ranges.findIndex(v =>
    v.id_cm_animal_id == getPet.value?.id_cm_animal_id &&
    v.pet_gender == getPet.value?.type_pet_gender &&
    !v.min_age_mon && !v.max_age_mon
  )
  if (genderMatch !== -1) return genderMatch

  // Priority 3: Match only animal_id
  const animalIdMatch = lab_ranges.findIndex(v =>
    v.id_cm_animal_id == getPet.value?.id_cm_animal_id &&
    !v.pet_gender &&
    !v.min_age_mon && !v.max_age_mon
  )
  if (animalIdMatch !== -1) return animalIdMatch

  // Priority 4: Default case - single record with no attributes
  if (lab_ranges.length == 1 && 
      !lab_ranges[0].id_cm_animal_id &&
      !lab_ranges[0].pet_gender &&
      !lab_ranges[0].min_age_mon &&
      !lab_ranges[0].max_age_mon) {
    return 0
  }

  return -1
}

const isInAgeRange = (min_age_mon: string | number | undefined, max_age_mon: string | number | undefined) => {
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
        .then(async (confirmation) => {
          if (confirmation) {
            let labData = []

            if (data.value.lab_set == '1')
              flatMap(Object.values(labSelectedList.value),
                items => forEach(items, (item => forEach(item, lab => {
                  labData.push({
                    id_lab_result: lab?.id_lab_result,
                    flg_delete: true,
                    id_employee_registered: data.value.id_employee_registered,
                    seq_processed: 1,
                    id_pet: props.id_pet,
                  })
                })))
              )
            else if (data.value.lab_set == '2')
              flatMap(Object.values(labSelectedList.value),
                items => forEach(items, lab => {
                  labData.push({
                    id_lab_result: lab?.id_lab_result,
                    flg_delete: true,
                    id_employee_registered: data.value.id_employee_registered,
                    seq_processed: 1,
                    id_pet: props.id_pet,
                  })
                })
              )

            await labResultStore.updateLabResult({ lab_result: labData })
            mtUtils.autoCloseAlert(aahMessages.success)
            closeModal()
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
const getLabResultDataByCategory = async (value: any) => {
  labSelectedList.value = []
  if (value) {
    await labSetStore.fetchLabSets({ id_category2_lb2: value, no_pagination: true })

    const labResultIdLabArr = getLabResultsByPet.value.map(r => r.id_lab)
    let listLab = []

    getLabResultsByPet.value.forEach((r) => {
      let selectedLab = labSetStore.getLabSets.find((v) => v.id_lab == r.id_lab)
      if (!listLab.find(item => item.id_lab == r.id_lab)) {
        listLab.push({
          ...(selectedLab ? selectedLab : r),
          id_lab_result: r.id_lab_result,
          is_deleted: false,
          is_new: false, // For update case, allowing to edit this data
          qualifier: r.qualifier,
          memo_alert: r.memo_alert,
          val_result: r.val_result,
          seq_processed: r.seq_processed,
          id_cm_unit: r.id_cm_unit || selectedLab?.id_cm_unit,
          low: r.low,
          high: r.high,
          low_critical: r.low_critical,
          high_critical: r.high_critical
        })
      }
    })

    labSetStore.getLabSets
      .forEach((v) => {
        if (!labResultIdLabArr.includes(v.id_lab)) {
          listLab.push({
            ...v,
            is_deleted: false,
            is_new: true, // For update case, this is the un filled data
          })
        }
      })

    const list = mapValues(groupBy(listLab, 'id_category2_lb2'),
      (value) => groupBy(orderBy(value, ['lab_set.display_order', 'lab.display_order']), 'lab.id_category2_lab')
    )
    if (list) labSelectedList.value = list
  }
}
const getLabResultDataByDevice = async (value: any) => {
  labSelectedList.value = []
  if (value) {
    let listLab = []
    const result = getLabResultsByPet.value

    if (result.length > 0)
      result.forEach((r) => {
        if (!listLab.find(item => item.id_lab == r.id_lab)) {
          listLab.push(r)
          listLab?.sort((a, b) => a.display_order - b.display_order)
        }
      })

    const list = groupBy(orderBy(listLab, ['lab_device.display_order', 'lab.display_order']), 'id_cm_device')
    if (list) labSelectedList.value = list
  }
}
const getLabResultDataByRef = async () => {
  labSelectedList.value = []
  let listLab = []
  const result = getLabResultsByPet.value

  if (result.length > 0)
    result.forEach((r) => {
      listLab.push(r)
      listLab?.sort((a, b) => a.display_order - b.display_order)
    })

  const list = groupBy(orderBy(listLab, ['seq_processed', 'lab_set.display_order', 'lab.display_order']), 'id_cm_device')
  if (list) labSelectedList.value = list
}
const removeItem = (id_device: number, index: number, id_category = -1) => {
  if (data.value.lab_set == '1') {
    if (labSelectedList.value?.[id_device]?.[id_category]?.[index])
      labSelectedList.value[id_device][id_category][index].is_deleted = !labSelectedList.value[id_device][id_category][index].is_deleted
  }
  else if (data.value.lab_set == '2') {
    if (labSelectedList.value?.[id_device]?.[index])
      labSelectedList.value[id_device][index].is_deleted = !labSelectedList.value[id_device][index].is_deleted
  }
}
const typeLabUnitName = (value) => {
  return commonStore.getCommonUnitOptionList.find(item => item.id_common == value)?.name_common
}

const getRange = (lab_ranges: Array<LabRange>, id_cm_device: number) => {
  let index = -1
  if (lab_ranges && lab_ranges.length > 0) {
    const index_by_filter = lab_ranges?.findIndex((v) => {
      let pet_gender = true
      if (v.pet_gender && v.pet_gender != '@' && getPet.value?.type_pet_gender) pet_gender = v.pet_gender == getPet.value?.type_pet_gender

      let min_age_mon = true
      if (v.min_age_mon && v.min_age_mon != '-1' && getCurrentPetAgeInMonth(getPet.value)) min_age_mon = v.min_age_mon <= getCurrentPetAgeInMonth(getPet.value)

      let max_age_mon = true
      if (v.max_age_mon && v.max_age_mon != '-1' && getCurrentPetAgeInMonth(getPet.value)) max_age_mon = v.max_age_mon >= getCurrentPetAgeInMonth(getPet.value)

      let filter_id_cm_device = true
      if (v.id_cm_device && v.id_cm_device != '-1' && id_cm_device) filter_id_cm_device = v.id_cm_device == id_cm_device

      return (pet_gender && min_age_mon && max_age_mon && filter_id_cm_device)
    })
    if (index_by_filter != -1) index = index_by_filter
  }
  return index
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


const submit = async () => {
  let labResultCreateList = [] // For create new lab result
  let labResultUpdateList = [] // For update exisiting lab result

  if (data.value.lab_set == '1') {
    const labResultDeleteSelected = labResultUpdateList?.filter(item => item.flg_delete)
    if (labResultDeleteSelected.length > 0) {
      const confirmation = await mtUtils.confirm(`検査項目 ${labResultDeleteSelected.length} 件が削除対象として選択されています。\n削除しますか？`, aahMessages.delete)
      if (!confirmation) return false
    }

    flatMap(Object.values(labSelectedList.value),
      items => forEach(items, (item => forEach(item, lab => {
        if (!lab?.is_new) {
          labResultUpdateList.push({
            id_lab_result: lab?.id_lab_result,
            name_lab: lab?.name_lab,
            id_category2_lab: lab?.id_category2_lab,
            id_lab: lab?.id_lab,
            qualifier: lab?.qualifier,
            val_result: lab?.val_result?.toString()?.replace(',', ''),
            memo_alert: lab?.memo_alert,
            flg_delete: lab?.is_deleted ? true : false,
            id_pet: props.id_pet,
            id_pet_illness_history: data.value.id_pet_illness_history?.[0]?.id_pet_illness_history,
            id_employee_registered: data.value.id_employee_registered,
            seq_processed: 1,
            datetime_registered: data.value.datetime_registered + ':00',
            id_cm_device: data.value.device?.id_common,
            id_service_detail: data.value.id_service_detail,
            number_service_detail: data.value.number_service_detail
          })
        } else if (lab?.is_new && (lab?.val_result || lab?.qualifier)) {
          labResultCreateList.push({
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
            low: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.low,
            low_critical: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.low_critical,
            high: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.high,
            high_critical: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.high_critical,
            id_service_detail: data.value.id_service_detail,
            number_service_detail: data.value.number_service_detail
          })
        }
      })))
    )
  } else if (data.value.lab_set == '2'){
    const labResultDeleteSelected = flatMap(labSelectedList.value).filter(item => item?.is_deleted)
    if (labResultDeleteSelected.length > 0) {
      const confirmation = await mtUtils.confirm(`検査項目 ${labResultDeleteSelected.length} 件が削除対象として選択されています。\n削除しますか？`, aahMessages.delete)
      if (!confirmation) return false
    }

    labResultUpdateList = flatMap(labSelectedList.value)
      .filter((lab) => !lab.is_new)
      .map((lab: any) => ({
        id_lab_result: lab.id_lab_result,
        name_lab: lab.name_lab,
        id_category2_lab: lab.id_category2_lab,
        id_lab: lab.id_lab,
        qualifier: lab.qualifier,
        val_result: lab.val_result?.toString()?.replace(',', ''),
        memo_alert: lab.memo_alert,
        flg_delete: lab.is_deleted ? true : false,
        id_pet: props.id_pet,
        id_pet_illness_history: data.value.id_pet_illness_history?.[0]?.id_pet_illness_history,
        id_employee_registered: data.value.id_employee_registered,
        seq_processed: 1,
        datetime_registered: data.value.datetime_registered + ':00',
        id_cm_device: data.value.device?.id_common,
        id_service_detail: data.value.id_service_detail,
        number_service_detail: data.value.number_service_detail
      }))
    labResultCreateList = flatMap(labSelectedList.value)
      .filter((lab) => lab?.is_new && (lab?.val_result || lab?.qualifier))
      .map((lab: any) => ({
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
        low: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.low,
        low_critical: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.low_critical,
        high: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.high,
        high_critical: lab?.lab_range?.[getRange(lab?.lab_range, lab.id_cm_device)]?.high_critical,
        id_service_detail: data.value.id_service_detail,
        number_service_detail: data.value.number_service_detail
      }))
  }

  const promises = [
    labResultStore.updateLabResult({ lab_result: labResultUpdateList })
  ]
  if (labResultCreateList.length > 0) promises.push(labResultStore.submitLabResult({ lab_result: labResultCreateList }))
  if (getServiceDetail.value?.number_service_detail) {
    promises.push(
      serviceDetailStore
        .updateServiceDetail(getServiceDetail.value?.id_request, getServiceDetail.value?.id_service_detail,
          {
            memo_service: data.value.memo_service,
            id_pet: props.id_pet,
            id_customer: getCustomer.value?.id_customer
          }
        )
    )
  }

  await Promise.all(promises)
  mtUtils.autoCloseAlert(aahMessages.success)
  closeModal()
}
onMounted(async () => {
  const formatted_data = formatDateWithTime(props.date, 'YYYY-MM-DD HH:mm:ss')

  let promises = []
  if (getIllnessHistorys.value.length === 0) promises.push(illnessHistoryStore.fetchIllnessHistorys({ id_pet: props?.id_pet, id_customer: getCustomer.value?.id_customer }))

  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [7] }, true),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'),
    templateStore.fetchTemplates({ type_text_template: 45 }),
    labResultStore.fetchLabResultsByPet(props.id_pet, {
      date: formatted_data,
      id_category2_lab: props.lab_set_type == 'lab-device' ? null : props.id_category2_lab,
      id_cm_device: props.id_device_category,
      is_filtering_device: props.lab_set_type == 'lab-device' ? true : false,
    }),
    fetchServiceDetailByPet(),
    ...promises
  ])
  petList.value.length = 0
  petList.value = [...getCustomer.value?.pets]

  deviceList.value.length = 0
  deviceListDefault.length = 0
  deviceList.value = [...getCommonDeviceOptionList.value.map((v: Common) => ({ ...v, label: concatenate(v.name_common, v.name_device), value: v.id_common }))]
  deviceListDefault.push(...deviceList.value)

  if (props.id_pet_illness_history)
    data.value.id_pet_illness_history = [props.id_pet_illness_history]
  else if (getIllnessHistorys.value.length > 0)
    data.value.id_pet_illness_history = [getIllnessHistorys.value?.[0]]

  qualifiers.value = templateStore.getTemplates?.map((item: TextTemplateType) => ({...item, title: item.memo_template, isSelected: false}))

  if (getLabResultsByPet.value[0]?.id_service_detail) await serviceDetailStore.fetchServiceDetailById(getLabResultsByPet.value[0]?.id_service_detail)
  else serviceDetailStore.setServiceDetail({})

  data.value = {
    lab_set: getLabResultsByPet.value[0]?.id_category2_lb2 ? '1' : '2',
    code_labcat2: getLabResultsByPet.value[0]?.id_category2_lb2 ? categoryStore.getCategoriesLB2.find((v) => v.id_category == getLabResultsByPet.value[0]?.id_category2_lb2) : '',
    datetime_registered: getLabResultsByPet.value[0]?.datetime_registered,
    id_pet: props.id_pet,
    instpet_id: getLabResultsByPet.value[0]?.instpet_id,
    id_employee_registered: getLabResultsByPet.value[0]?.id_employee_registered,
    id_pet_illness_history: [getLabResultsByPet.value[0]?.id_pet_illness_history],
    device: getLabResultsByPet.value[0]?.id_cm_device ? commonStore.getCommonDeviceOptionActiveList.find((v) => v.id_common == getLabResultsByPet.value[0]?.id_cm_device) : null,
    id_service_detail: getLabResultsByPet.value[0]?.id_service_detail,
  }
  if (getServiceDetail.value) Object.assign(data.value, {memo_service: getServiceDetail.value?.memo_service})
  console.log('props.lab_set_type', props.lab_set_type)
  console.log('props.id_device_category', props.id_device_category)
  if (props.lab_set_type == 'lab-set')
    getLabResultDataByCategory(props.id_device_category)
  else if (props.lab_set_type == 'lab-device')
    getLabResultDataByDevice(props.id_device_category)
  else if (props.lab_set_type == 'lab-ref')
    getLabResultDataByRef()
})
onUnmounted(() => {
  labResultStore.resetLabResultByPet()
})
</script>

<template>
  <MtModalHeader class="q-bb mt-header" @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold row items-center">
      検査結果
      <MtPetInfo class="ellipsis full-width" />
    </q-toolbar-title>
    <q-btn
      outline
      label="検査結果：1回"
      class="q-mr-sm"
      @click="togglePdfConfirmation()"
    />
    <q-btn round flat @click="openMenu" class="q-mx-sm">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
  </MtModalHeader>
  <q-form @submit="submit">
    <q-card-section class="content q-py-md q-px-xl">
      <div class="row q-col-gutter-md">
        <div class="col-2">
          <MtFormInputDateTime
            v-model:date="data.datetime_registered"
            required
            :rules="[aahValidations.validationRequired]"
            label="検査日時"
          />
        </div>
        <div class="col-2">
          <MtFormMultipleSelection
            :options="getIllnessHistorys"
            :option-label="(v) => v?.name_disease ? v?.name_disease : v?.name_disease_free"
            option-value="id_pet_illness_history"
            v-model="data.id_pet_illness_history"
            required
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

      <template v-if="data.lab_set == '1'">
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
              flat
              :style="{overflow: 'auto'}"
              no-data-message="登録がありません。"
              no-result-message="該当のデータが見つかりませんでした"
            >
              <template v-slot:body="{ row, index }">
                <template v-if="row.flg_above_blank_row">
                  <q-tr>
                  <q-td colspan="10" class="bg-grey-300 full-width" style="height: 10px"></q-td>
                  </q-tr>
                </template>
                <q-tr>
                  <td
                    class="cursor-pointer items-center"
                    v-for="col in columns"
                    :class="row.is_deleted === true ? 'bg-yellow' : ''"
                  >
                    <div>
                      <div v-if="col.field === 'name_lab'">
                        <div class="flex no-wrap full-width" :class="row.flg_indent ? 'q-pl-md' : ''">
                          <div class="no-wrap text-weight-bold q-mr-md">
                            {{ (row?.lab?.name_lab_en ? row?.lab?.name_lab_en : row?.name_lab_en)?.replace('%',' ') }}
                          </div>
                          <div class="no-wrap">
                            {{
                              row?.lab?.name_lab ? (row?.lab?.name_lab_en == row?.lab?.name_lab ? '' : row?.lab?.name_lab)
                                : (row?.name_lab_en == row?.name_lab ? '' : row?.name_lab)
                            }}
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'qualifier'" class="flex no-wrap">
                        <MtFormInputText v-model="row.qualifier" class="q-pa-none q-mr-xs">
                          <template v-slot:append>
                            <q-btn @click="openQualifierModal(id_category, index, id_device)" flat dense>
                              <q-icon name="add" />
                            </q-btn>
                          </template>
                        </MtFormInputText>
                      </div>
                      <div v-else-if="col.field === 'val_result'">
                        <MtFormInputText
                          v-model="row.val_result"
                          input-class="text-right"
                        />
                      </div>
                      <div v-else-if="col.field === 'memo_alert'">
                        <MtFormInputText
                          label=""
                          v-model="row.memo_alert"
                          readonly
                        />
                      </div>
                      <div v-else-if="col.field === 'range'" class="text-center">
                        <template v-if="row?.low && row?.high">
                          {{ row?.low }} ~ {{ row?.high }}
                        </template>
                        <template v-else>
                          {{ showRange(row.lab_range, row.id_cm_device) }}
                        </template>
                      </div>
                      <div v-else-if="col.field === 'id_cm_unit'">
                        {{ typeLabUnitName(row.id_cm_unit) }}
                      </div>
                      <div 
                        class="q-mt-md self-items-center flex justify-end" 
                        v-else-if="col.field === 'action'"
                      >
                        <q-icon
                          v-if="!row.is_new"
                          name="cancel"
                          @click.stop="removeItem(id_device, index, id_category)"
                          class="cursor-pointer clear-icon text-grey-600"
                          size="21px"
                        />
                      </div>
                      <div v-else-if="col.field === 'memo_lab'" class="text-left caption1 regular">
                        {{ row[col.field] ? row[col.field] : '' }}
                      </div>
                      <div v-else class="text-center regular text-grey-900">
                        {{ row[col.field] ? row[col.field] : '' }}
                      </div>
                    </div>
                  </td>
                </q-tr>
              </template>
            </MtTable2>
          </div>
        </div>
      </template>
      <template v-if="data.lab_set == '2'">
        <div v-for="(labs, id_device) in labSelectedList">
          <div class="flex justify-between bg-grey-300 q-pa-xs">
            <div class="q-pl-md">
              {{ getDeviceName(id_device) }} ({{ labs.length }})
            </div>
          </div>
          <MtTable2
            :columns="columns"
            :rows="labs"
            :rowsBg="true"
            flat
            :style="{overflow: 'unset '}"
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
            <template v-slot:body="{ row, index }">
              <template v-if="row.lab_device?.flg_above_blank_row">
                <q-tr>
                  <q-td colspan="10" class="bg-grey-300 full-width" style="height: 10px"></q-td>
                </q-tr>
              </template>
              <q-tr>
                <q-td
                  class="cursor-pointer items-center"
                  v-for="col in columns"
                  :class="row.is_deleted === true ? 'bg-yellow' : ''"
                >
                  <div>
                    <div v-if="col.field === 'name_lab'">
                      <div class="flex no-wrap full-width" :class="row.lab_device?.flg_indent ? 'q-pl-md' : ''">
                        <div class="no-wrap text-weight-bold q-mr-md">
                          {{ (row?.lab?.name_lab_en ? row?.lab?.name_lab_en : row?.name_lab_en)?.replace('%',' ') }}
                        </div>
                        <div class="no-wrap">
                          {{
                            row?.lab?.name_lab ? (row?.lab?.name_lab_en == row?.lab?.name_lab ? '' : row?.lab?.name_lab)
                              : (row?.name_lab_en == row?.name_lab ? '' : row?.name_lab)
                          }}
                        </div>
                      </div>
                    </div>
                    <div v-else-if="col.field === 'qualifier'" class="flex no-wrap">
                      <MtFormInputText v-model="row.qualifier" class="q-pa-none q-mr-xs">
                        <template v-slot:append>
                          <q-btn @click="openQualifierModal(id_device, index, id_device)" flat dense>
                            <q-icon name="add" />
                          </q-btn>
                        </template>
                      </MtFormInputText>
                    </div>
                    <div v-else-if="col.field === 'val_result'">
                      <MtFormInputText
                        v-model="row.val_result"
                        input-class="text-right"
                      />
                    </div>
                    <div v-else-if="col.field === 'memo_alert'">
                      <MtFormInputText
                        label=""
                        v-model="row.memo_alert"
                        readonly
                      />
                    </div>
                    <div v-else-if="col.field === 'range'" class="text-center">
                      <template v-if="row?.low && row?.high">
                        {{ row?.low }} ~ {{ row?.high }}
                      </template>
                      <template v-else>
                        {{ showRange(row.lab_range, row.id_cm_device) }}
                      </template>
                    </div>
                    <div v-else-if="col.field === 'id_cm_unit'">
                      {{ typeLabUnitName(row.id_cm_unit) }}
                    </div>
                    <div 
                      class="q-mt-md self-items-center flex justify-end" 
                      v-else-if="col.field === 'action'"
                    >
                      <q-icon
                        v-if="!row.is_new"
                        name="cancel"
                        @click.stop="removeItem(id_device, index)"
                        class="cursor-pointer clear-icon text-grey-600"
                        size="21px"
                      />
                    </div>
                    <div v-else-if="col.field === 'memo_lab'" class="text-left caption1 regular">
                      {{ row[col.field] ? row[col.field] : '' }}
                    </div>
                    <div v-else class="text-center regular text-grey-900">
                      {{ row[col.field] ? row[col.field] : '' }}
                    </div>
                  </div>
                </q-td>
              </q-tr>
            </template>
          </MtTable2>
        </div>
      </template>

      <div v-if="getServiceDetail.number_service_detail" class="q-mb-md q-mt-md">
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <MtInputForm
              v-model="data.memo_service"
              autogrow
              label="詳細・メモ"
              type="text"
            >
              <template #append>
                <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(32)" />
              </template>
            </MtInputForm>
          </div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-6">
            <div @click.stop="onServiceDetailClick(getServiceDetail.id_service_detail)" class="text-blue cursor-pointer q-mt-md">
              {{ getServiceDetail.number_service_detail }}
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <q-dialog v-model="pdfConfirmationDialog">
    <q-card class="q-pa-lg">
      <q-card-section>
        <div class="text-h6">
          <q-icon size="25px" name="error_outline" /> 確認
        </div>
      </q-card-section>
      <q-card-section class="q-pt-none message q-mb-md">
        検査結果を myVetty に送信しますか?
        <div class="q-mt-md">
          <span>出力色 </span>
          <MtFormRadiobtn v-model:selected="pdfConfiguration.color" label="青" val="1" />
          <MtFormRadiobtn v-model:selected="pdfConfiguration.color" label="黒" val="2" />
        </div>
        <div class="q-mt-md"><MtFormCheckBox v-model:checked="pdfConfiguration.flgShowValResultBg" label="背景色を付ける" /></div>
        <div class="q-mt-md"><MtFormCheckBox v-model:checked="pdfConfiguration.flgShowIcons" label="基準値範囲外ハイライト" /></div>
      </q-card-section>  
      <q-card-actions class="justify-end">
        <q-btn
          label="キャンセル"
          text-color="primary"
          class="q-mr-md"
          outline
          color="white"
          @click="pdfConfirmationDialog = false"
          v-close-popup
        />
        <q-btn
          label="PDFダウンロード"
          color="primary"
          @click="openLabResultOneModal('download')"
          v-close-popup
        />
        <q-btn
          label="印刷"
          color="primary"
          @click="openLabResultOneModal('print')"
          v-close-popup
        />
        <q-btn
          label="myVetty送信"
          color="primary"
          class="no-uppercase"
          @click="openLabResultOneModal('sendMyVetty')"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <GetPdfLabResultOne
    v-if="pdfAttributes.labResult.render"
    :resultList="labResultRowsData"
    :showRange="showRange"
    :showValResult="showValResult"
    :callback="pdfAttributes.labResult.mode == 'sendMyVetty' ? fillPdfToPPs : null"
    :defaultConfiguration="pdfConfiguration"
    :pdfAttributes="pdfAttributes"
  />

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="検査結果 入力テンプレート"
    :options="qualifiers"
    :data="labSelectedList"
    :single-option="true"
    @update:memo="handleUpdateQualifier"
  />

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="効能効果テンプレート"
    :options="memoTemplates"
    :data="data"
    :single-option="true"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>