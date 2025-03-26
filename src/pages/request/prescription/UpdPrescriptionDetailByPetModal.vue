<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
// Other component imports
import PrescriptionDetailListBox from '@/pages/request/prescription/PrescriptionDetailListBox.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

// Store imports
import useCustomerStore from '@/stores/customers'
import usePrescriptionStore from '@/stores/prescription'
import useServiceGroupStore from '@/stores/service-groups'
import useServiceDetailStore from '@/stores/service-details'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useItemStore from '@/stores/items'
import useCommonStore from '@/stores/common'

// Utility imports
import { flatMap, groupBy, sortBy } from 'lodash'
import {
  formatDate,
  getDateByFormat,
  getDateTimeNow,
  getDateToday,
  getFullPetNameWithoutHonorific,
  getPetFirstNameOnly,
  highlightText,
  roundZeroAfterPoint,
  setCharAt
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import aahValidations from '@/utils/aahValidations'
import { event_bus } from '@/utils/eventBus'

// Type imports
import { PrescriptionType } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import useDoseStore from '../../../stores/dose-frequencies'
import useKeywordStore from '@/stores/keyword'
import PrescriptionIsuComparisonModal from '@/pages/request/prescription/PrescriptionIsuComparisonModal.vue'

// Dynamically import pages
const SearchMedicineList = defineAsyncComponent(
  () => import('@/pages/master/itemService/SearchMedicineList.vue')
)
const ViewItemServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/master/itemService/ViewItemServiceDetailModal.vue')
)

const props = defineProps({
  id: String,
  id_customer: String,
  id_pet: String,
  serviceDetail: <any>Object,
  requestObj: Object,
  request_detail_page: Object
})

const serviceDetailStore = useServiceDetailStore()
const itemStore = useItemStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const customerStore = useCustomerStore()
const serviceGroupStore = useServiceGroupStore()
const prescriptionStore = usePrescriptionStore()

const { getPrescriptionListByRequest, getPrescriptionDetailList } =
  storeToRefs(prescriptionStore)

const { getItems } = storeToRefs(itemStore)

const { getCustomer } = storeToRefs(customerStore)

const emits = defineEmits(['close'])

const isCloseDetail = ref(false)
const childFormRefs = ref([])
const historyTFlgUI = ref(false)
const iconClickUI = ref(false)
const searchKeyword = ref('')
const allServices = ref([])
const allTop30 = ref([])
const filteredKeyword = ref({
  single: [],
  multiple: []
})
const allKeyword = ref({
  single: [],
  multiple: []
})
const sKRef = ref<HTMLElement>()
const multipleKeyWordRef = ref<HTMLElement>()

const selectedServices = ref([] as Array<any>)
const bookingRequestDetails = ref([] as Array<any>)

const tab = ref('history')
const petList = ref()
const petSelected = ref()
const isTypeAnimal = ref(false)
const showPrescriptionList = ref(false)
const prescriptionDefaultList = ref<PrescriptionType[]>([])

const commonTypeAnimalOptionList: any = ref([])

const petSelectedLabel = ref()

const valWeightUI = computed(() => {
  if (
    prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)?.val_weight
  ) {
    return `${(
      prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)
        ?.val_weight / 1000
    ).toFixed(2)} Kg`
  }
  return ''
})

const typeAnimalUI = computed(() => {
  if (
    customerStore.getCustomer &&
    customerStore.getCustomer?.pets &&
    customerStore?.getCustomer?.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal
    return `${
      commonTypeAnimalOptionList.value.find(
        (obj: any) => obj.value == typeAnimal
      )?.label
    }`
  }
  return ''
})

const onTop30Check = async (itemService: any) => {
  if (iconClickUI.value) {
    return
  }

  if (itemService?.flg_not_available) {
    await mtUtils.autoCloseAlert('この医薬品は禁忌指定されています。')
    return
  }

  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    selected.checkbox = !selected.checkbox
    return
  }

  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )

  prescriptionStore.setSelectedTab(2)
  prescriptionStore.resetSuggestCounter()
  selectedServices.value.push({
    selectedTab: 2,
    name_item_service: itemService.name_item_service,
    name_prescription_display: itemService.name_item_service,
    name_category1: itemService?.name_category1,
    name_category2: itemService?.name_category2,
    id_category1: itemService?.id_category1,
    id_category2: itemService?.id_category2,
    id_item_service: itemService?.id_item_service,
    flg_apply_insurance: prescriptionHeader.flg_apply_insurance,
    type_medicine_dosage: itemService?.type_medicine_dosage,
    type_medicine_format: itemService?.type_medicine_format,
    flg_prevention: itemService?.flg_prevention,
    type_prevention: itemService?.type_prevention,
    flg_non_charge: props?.requestObj?.flg_complete,
    show: !isCloseDetail.value,
    process_drip: {
      id_prescription_detail: `PD_${getDateTimeNow().replace(
        /-/g,
        ''
      )}_${Math.floor(Math.random() * 100000)}`,
      id_prescription_detail_ref: ``,
      isPlusItem: false
    },
    id_employee_doctor:
      props.requestObj?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      props.requestObj?.id_employee_staff ??
      JSON.parse(localStorage.getItem('id_employee'))
  })
  bookingRequestDetails.value.push({
    tBookingFlag: itemService?.item_service_unit_list?.[0]?.interval
      ? true
      : false,
    tBookingFlgTime: false,
    tBookingFlgRepeat: false,
    date_booking_confirmed: null,
    time_booking_confirmed: null,
    days_repeat: null,
    flg_continue: true,
    flg_exempt: false,
    flg_end: false,
    type_day: 1
  })
}

const copyCurrentPD = async (history: any) => {
  if (iconClickUI.value) {
    return
  }
  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )

  prescriptionStore.setSelectedTab(1)
  prescriptionStore.resetSuggestCounter()

  const tempHistory = {
    selectedTab: 1,
    name_item_service: history.name_prescription_display,
    name_prescription_display: history.name_prescription_display,
    name_category1: history?.name_category1,
    name_category2: history?.name_category2,
    id_category1: history?.id_category1,
    id_category2: history?.id_category2,
    id_item_service: history.id_item_service,
    flg_apply_insurance: prescriptionHeader.flg_apply_insurance,
    type_medicine_dosage: history.type_medicine_dosage,
    type_medicine_format: history.type_medicine_format,
    total_days_dose: history.total_days_dose,
    memo_dose: history.memo_dose,
    memo_alert: history.memo_alert,
    id_dosage_frequency: history.id_dosage_frequency,
    id_prescription_detail_copied: history.id_prescription_detail,
    flg_prevention: history?.flg_prevention,
    type_prevention: history?.type_prevention,
    flg_non_charge: props?.requestObj?.flg_complete,
    name_medicine_format: history.name_medicine_format,
    isCurrentPH: true, // This flag is used if we want to copy in same prescription header.
    val_efficacy_strength_doctor: history.val_efficacy_strength_doctor,
    prescription_detail_assort_list_UI: history.prescription_detail_assort_list,
    name_medicine_format_ui: history.name_medicine_format,
    show: !isCloseDetail.value,
    id_employee_doctor:
      props.requestObj?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      props.requestObj?.id_employee_staff ??
      JSON.parse(localStorage.getItem('id_employee'))
  }

  selectedServices.value.push(tempHistory)
  bookingRequestDetails.value.push({
    tBookingFlag: history?.item_service_unit_list?.[0]?.interval ? true : false,
    tBookingFlgTime: false,
    tBookingFlgRepeat: false,
    date_booking_confirmed: null,
    time_booking_confirmed: null,
    days_repeat: null,
    flg_continue: true,
    flg_exempt: false,
    flg_end: false,
    type_day: 1
  })
}

const onHistoryCheck = async (history, fromGroup: any = false,
                              parentId: any = null, pda_list: any = []) => {
  if (iconClickUI.value) {
    return
  }


  const selected: any = flatMap(allServices.value).find(
    (v: any) => v.id_prescription_detail === history.id_prescription_detail
  )
  const key = selectedServices.value.findIndex(
    (v: any) => v.id_prescription_detail === history.id_prescription_detail
  )

  prescriptionStore.setSelectedTab(1)
  prescriptionStore.resetSuggestCounter()
  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    selected.checkbox = !selected.checkbox
    return
  }
  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )
  let copyPrevious = true

  if (!fromGroup) {
    const confirm = await mtUtils.confirm(
      'そのまま複製しますか？\n体重を考慮して再計算しますか？',
      '確認',
      '再計算',
      null,
      null,
      { label: 'そのまま複製', show: true, action: 'OK' }
    )

    if (confirm && confirm != 'OK') copyPrevious = false
  }


  if (!fromGroup && copyPrevious) {

    const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparison', {
      id_prescription_detail_list: [history.id_prescription_detail]
    })

    if (comparisonResponse && Object.keys(comparisonResponse).length > 0) {
      await mtUtils.smallPopup(PrescriptionIsuComparisonModal, {
        comparisonResponse: comparisonResponse,
        prescriptionDetailList: [history],
        callBack: (param: any) => {
          if (param.submitted) {
            pda_list = param.pA_list
          }
        }
      })
    }
  }
  console.log(history, history.type_medicine_dosage)
  let tempHistory = {
    selectedTab: 1,
    prescription_detail: history,
    name_item_service: history.name_prescription_display,
    name_prescription_display: history.name_prescription_display,
    name_category1: history?.name_category1,
    name_category2: history?.name_category2,
    id_category1: history?.id_category1,
    id_category2: history?.id_category2,
    id_item_service: history.id_item_service,
    flg_apply_insurance: prescriptionHeader.flg_apply_insurance,
    type_medicine_dosage: history.type_medicine_dosage,
    type_medicine_format: history.type_medicine_format,
    total_days_dose: history.total_days_dose,
    memo_dose: history.memo_dose,
    memo_alert: history.memo_alert,
    id_dosage_frequency: history.id_dosage_frequency,
    id_prescription_detail_copied: history.id_prescription_detail,
    flg_prevention: history?.flg_prevention,
    type_prevention: history?.type_prevention,
    flg_non_charge: props?.requestObj?.flg_complete,
    name_medicine_format: history.name_medicine_format,
    val_efficacy_strength_doctor: history.val_efficacy_strength_doctor,
    pda_list: pda_list,
    show: !isCloseDetail.value,
    id_employee_doctor:
      props.requestObj?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      props.requestObj?.id_employee_staff ??
      JSON.parse(localStorage.getItem('id_employee')),
    isCurrentPH: copyPrevious,
    name_medicine_format_ui: copyPrevious ? history.name_medicine_format : null,
    flg_group_title: history.flg_group_title ?? false,
    process_drip: {
      id_prescription_detail: `PD_${getDateTimeNow().replace(
        /-/g,
        ''
      )}_${Math.floor(Math.random() * 100000)}`,
      id_prescription_detail_ref: fromGroup ? parentId : null
    }
  }


  if (history.flg_group_title) {
    tempHistory = {
      ...history,
      show: !isCloseDetail.value,
      selectedTab: 1,
      prescription_detail: history,
      id_employee_doctor:
        props.requestObj?.id_employee_doctor ??
        JSON.parse(localStorage.getItem('id_employee')),
      id_employee_staff:
        props.requestObj?.id_employee_staff ??
        JSON.parse(localStorage.getItem('id_employee')),
      isCurrentPH: copyPrevious,
      process_drip: {
        id_prescription_detail: `PD_${getDateTimeNow().replace(
          /-/g,
          ''
        )}_${Math.floor(Math.random() * 100000)}`,
        id_prescription_detail_ref: null
      },
      id_prescription: prescriptionHeader.id_prescription
    }
  }
  selectedServices.value.push(tempHistory)

  if (tempHistory.flg_group_title) {
    Object.values(allServices.value).flat() // Flatten grouped data into a single array
      .filter(pdHis => {
        if (pdHis.id_prescription_detail_ref == history.id_prescription_detail) {
          onHistoryCheck(pdHis, true, tempHistory.process_drip.id_prescription_detail) // Perform side effect
          return true // Keep this item in the filtered result
        }
        return false // Exclude this item
      })
  }
  
  bookingRequestDetails.value.push({
    tBookingFlag: history?.item_service_unit_list?.[0]?.interval ? true : false,
    tBookingFlgTime: false,
    tBookingFlgRepeat: false,
    date_booking_confirmed: null,
    time_booking_confirmed: null,
    days_repeat: null,
    flg_continue: true,
    flg_exempt: false,
    flg_end: false,
    type_day: 1
  })
}

const onDateSelected = async (keyword: any) => {
  if (iconClickUI.value) {
    return
  }
  const selected: any = allServices.value[keyword]
  // selected.checkbox = !selected.checkbox
  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    // selected.checkbox = !selected.checkbox
    return
  }
  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )

  // if (selected.checkbox) {
  prescriptionStore.setSelectedTab(1)
  prescriptionStore.resetSuggestCounter()

  let copyPrevious = true

  const confirm = await mtUtils.confirm(
    'そのまま複製しますか？\n体重を考慮して再計算しますか？',
    '確認',
    '再計算',
    null,
    null,
    { label: 'そのまま複製', show: true, action: 'OK' }
  )

  if (confirm && confirm != 'OK') copyPrevious = false


  const newArray1 = [...selected]

  let prescription_detail_list = []

  newArray1.filter((v) => v.type_detail != 3 && !v.id_prescription_detail_ref)
    .slice(0, 30)
    .map((history) => {
      prescription_detail_list.push(history.id_prescription_detail)
    })

  let prescription_detail_assort_list = []

  if (copyPrevious) {
    const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparison', {
      id_prescription_detail_list: prescription_detail_list
    })

    if (comparisonResponse && Object.keys(comparisonResponse).length > 0) {
      await mtUtils.smallPopup(PrescriptionIsuComparisonModal, {
        comparisonResponse: comparisonResponse,
        prescriptionDetailList: selected,
        callBack: (param: any) => {
          if (param.submitted) {
            prescription_detail_assort_list = param.pA_list
          }
        }
      })
    }
  }
  
  
  const newArray = selected
    .filter((v) => v.type_detail != 3 && !v.id_prescription_detail_ref)
    .slice(0, 30)
    .map((history) => {
      onHistoryCheck(history, true, null, prescription_detail_assort_list)
    })
}

const onMultipleKeywordCheck = async (keyword: any) => {
  if (iconClickUI.value) {
    return
  }
  const selected: any = filteredKeyword.value.multiple.find(
    (v: any) => v.id_service_group === keyword.id_service_group
  )
  // selected.checkbox = !selected.checkbox
  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    // selected.checkbox = !selected.checkbox
    return
  }
  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )

  // if (selected.checkbox) {
  prescriptionStore.setSelectedTab(3)
  prescriptionStore.resetSuggestCounter()
  const newArray = selected.service_group_item_list.map((item) => ({
    ...item,
    selectedTab: 3,
    id_service_group: selected.id_service_group,
    ...item.item,
    flg_non_charge: props?.requestObj?.flg_complete,
    flg_apply_insurance: prescriptionHeader.flg_apply_insurance,
    id_employee_doctor:
      props.requestObj?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      props.requestObj?.id_employee_staff ??
      JSON.parse(localStorage.getItem('id_employee'))
  }))
  selectedServices.value = [...selectedServices.value, ...newArray]
  // TODO NEED TO FIX THIS BOOKING BUG FOR GROUP AND OnDateClick

  selectedServices.value.forEach((item) => {
    bookingRequestDetails.value.push({
      tBookingFlag: item?.interval ? true : false,
      tBookingFlgTime: false,
      tBookingFlgRepeat: false,
      date_booking_confirmed: null,
      time_booking_confirmed: null,
      days_repeat: null,
      flg_continue: true,
      flg_exempt: false,
      flg_end: false,
      type_day: 1
    })
  })
  // } else
  //   selectedServices.value = selectedServices.value.filter(
  //     (serviceGroupObj: any) =>
  //       serviceGroupObj.id_service_group != keyword.id_service_group
  //   )
}

const setChildRef = (index) => (el) => {
  if (el) {
    childFormRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    delete childFormRefs.value[index]
  }
}

const onTop30CheckISO = async (
  event: any,
  list: any,
  ISO: any,
  IS: any,
  callBack: any = false
) => {
  event.stopPropagation()

  let tempHistory = { ...ISO }

  let selectedIS = tempHistory.id_item_service_child

  if (selectedIS.flg_merge_price && !callBack) {
    return
  }

  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    return
  }
  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )

  const tempService = {
    item_service: selectedIS,
    name_category1: selectedIS.name_category1,
    name_category2: selectedIS.name_category2,
    code_category2: selectedIS.code_category2,
    id_item_service: selectedIS.id_item_service,
    id_category1: selectedIS.id_category1,
    id_category2: selectedIS.id_category2,
    quantity: 1,
    id_pet: petSelected.value,
    flg_apply_insurance: prescriptionHeader.flg_apply_insurance,
    flg_prevention: selectedIS.flg_prevention,
    type_prevention: selectedIS.type_prevention,
    name_prescription_display: selectedIS.name_item_service,
    name_item_service: selectedIS.name_item_service,
    id_employee_doctor: props.request_detail_page?.id_employee_doctor,
    id_employee_staff: props.request_detail_page?.id_employee_staff,
    flg_non_charge: props?.requestObj?.flg_non_charge,
    process_drip: {
      id_prescription_detail: `PD_${getDateTimeNow().replace(
        /-/g,
        ''
      )}_${Math.floor(Math.random() * 100000)}`,
      id_prescription_detail_ref: tempHistory?.id_prescription_detail_ref ?? '',
      isPlusItem: !!tempHistory.id_prescription_detail_ref
    },
    show: !isCloseDetail.value,
    type_detail: !!tempHistory.id_prescription_detail_ref ? 3 : 1
  }

  selectedServices.value.push(tempService)
  bookingRequestDetails.value.push({
    tBookingFlag: false,
    tBookingFlgTime: false,
    tBookingFlgRepeat: false,
    date_booking_confirmed: null,
    time_booking_confirmed: null,
    days_repeat: null,
    flg_continue: true,
    flg_exempt: false,
    flg_end: false,
    type_day: 1
  })
}

const onSingleKeywordCheck = async (event: any, keyword: any) => {
  if (iconClickUI.value) {
    return
  }

  if (keyword?.flg_not_available) {
    await mtUtils.autoCloseAlert('この医薬品は禁忌指定されています。')
    return
  }

  const selected: any = filteredKeyword.value.single.find(
    (v: any) => v.id_item_service === keyword.id_item_service
  )
  const key = selectedServices.value.findIndex(
    (v: any) => v.id_item_service === keyword.id_item_service
  )

  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    // selected.checkbox = !selected.checkbox
    return
  }
  const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  )

  // selected.checkbox = !selected?.checkbox

  // if (selected.checkbox) {
  prescriptionStore.setSelectedTab(4)
  prescriptionStore.resetSuggestCounter()
  selectedServices.value.push({
    selectedTab: 4,
    name_item_service: keyword.name_item_service,
    name_prescription_display: keyword.name_item_service,
    name_category1: keyword?.name_category1,
    name_category2: keyword?.name_category2,
    id_category1: keyword?.id_category1,
    id_category2: keyword?.id_category2,
    id_item_service: keyword?.id_item_service,
    flg_apply_insurance: prescriptionHeader.flg_apply_insurance,
    type_medicine_dosage: keyword?.type_medicine_dosage,
    type_medicine_format: keyword?.type_medicine_format,
    flg_prevention: keyword?.flg_prevention,
    type_prevention: keyword?.type_prevention,
    flg_non_charge: props?.requestObj?.flg_complete,
    process_drip: {
      id_prescription_detail: `PD_${getDateTimeNow().replace(
        /-/g,
        ''
      )}_${Math.floor(Math.random() * 100000)}`,
      id_prescription_detail_ref: ``,
      isPlusItem: false
    },
    show: !isCloseDetail.value,
    id_employee_doctor:
      props.requestObj?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      props.requestObj?.id_employee_staff ??
      JSON.parse(localStorage.getItem('id_employee'))
  })
  bookingRequestDetails.value.push({
    tBookingFlag: false,
    tBookingFlgTime: false,
    tBookingFlgRepeat: false,
    date_booking_confirmed: null,
    time_booking_confirmed: null,
    days_repeat: null,
    flg_continue: true,
    flg_exempt: false,
    flg_end: false,
    type_day: 1
  })
  // } else {
  //   selectedServices.value.splice(key, 1)
  //   bookingRequestDetails.value.splice(key, 1)
  // }
}
const searchMultipleKeyword = async () => {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    '/mst/service_groups',
    {
      isPrescriptionGroup: true,
      type_animal: isTypeAnimal.value
        ? useCommonStore().getCommonTypeAnimalOptionList.find(
            (animal: any) =>
              customerStore?.getCustomer?.pets.find(
                (petObj: any) => petObj.id_pet == petSelected.value
              )?.id_cm_animal == animal.id_common
          )?.code_func2
        : null,
      type_animal_allowed: customerStore?.getCustomer?.pets.find(
        (petObj: any) => petObj.id_pet == petSelected.value
      )?.id_cm_animal
    }
  )

  filteredKeyword.value.multiple = response
    .map((serviceGroupObj: any) => {
      return { ...serviceGroupObj, checkbox: false }
    })
    .filter(
      (v: any) =>
        v.name_service_group
          .trim()
          .toLowerCase()
          .indexOf(searchKeyword.value.toLowerCase()) > -1
    )
}
const searchSingleKeyword = async (value: any) => {
  if (searchKeyword.value == '') {
    return
  }
  let params = {
    flg_service: false,
    type_item: 1,
    type_animal_allowed: customerStore?.getCustomer?.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal
  }

  let resp = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'mst/SearchPrescriptionItemWithOption',
    {
      search_words: searchKeyword.value,
      ...params,
      exclude_inject: true
    }
  )
  appendUpdatedList(resp)
}

event_bus.on('setInjectKeyword', (itemServices = []) => {
  if (itemServices && itemServices.length && itemServices.length > 0) {
    const items = itemServices.map((v) => ({
      ...v,
      name_prescription_display: v.name_item_service ?? '',
      show: !isCloseDetail.value
    }))

    // allKeyword.value.push(...items)
    items.forEach((item) => {
      selectedServices.value.push(item)
      bookingRequestDetails.value.push({
        tBookingFlag: false,
        tBookingFlgTime: false,
        tBookingFlgRepeat: false,
        date_booking_confirmed: null,
        time_booking_confirmed: null,
        days_repeat: null,
        flg_continue: true,
        flg_exempt: false,
        flg_end: false,
        type_day: 1
      })
    })
  }
})

const keywordStore = useKeywordStore()

const { getPrescriptionKeywords } = storeToRefs(keywordStore)

const quickSearchKeyword = async (keyword: string) => {
  searchKeyword.value = keyword

  await onSearchKeyword(true)
}

const removeKeyword = (keywordIndex: number) => {
  keywordStore.removePrescriptionKeyword(keywordIndex)
}

const onSearchKeyword = async (quickSearch = false) => {
  if (!quickSearch) {
    keywordStore.addPrescriptionKeyword(searchKeyword.value)
  }

  let params = {
    flg_service: false,
    type_item: 1,
    type_animal_allowed: customerStore?.getCustomer?.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal
  }

  if (searchKeyword.value.length > 0) {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/SearchPrescriptionItemWithOption`,
      {
        type_animal: isTypeAnimal.value
          ? useCommonStore().getCommonTypeAnimalOptionList.find(
              (animal: any) =>
                customerStore?.getCustomer?.pets.find(
                  (petObj: any) => petObj.id_pet == petSelected.value
                )?.id_cm_animal == animal.id_common
            )?.code_func2
          : null,
        type_item: 1,
        flg_inject: false,
        ...params,
        search_words: searchKeyword.value
      }
    )

    const processedData = sortBy(response, 'display_order').map((item: any) => {
      item.item_service_option_list = sortBy(
        item.item_service_option_list,
        'display_order'
      ).map((ISO: any) => {
        const childProps = ISO.id_item_service_child
          ? { ...ISO.id_item_service_child }
          : {}

        ISO.item_service_unit_list = ISO.item_service_unit_list?.filter(
          (item) => {
            const today = new Date()
            const formatDateStart = new Date(item.date_start)
            const formatDateEnd = new Date(item.date_end)

            return (
              (!formatDateStart || today > formatDateStart) &&
              (!formatDateEnd || today < formatDateEnd)
            )
          }
        )
        return { ...ISO, ...childProps, checked: false }
      })

      item.item_service_unit_list = sortBy(
        item.item_service_unit_list,
        'display_order'
      ).map((ISU: any) => {
        return { ...ISU, checked: false }
      })

      return { ...item, checked: false }
    })

    // Sort the processed data based on the number of matched items
    const sortedData = processedData.sort((a, b) => {
      const aMatchCount = a.item_service_unit_list.filter((isu) =>
        isu.name_service_item_unit
          .toLowerCase()
          .includes(searchKeyword.value.toLowerCase())
      ).length
      const bMatchCount = b.item_service_unit_list.filter((isu) =>
        isu.name_service_item_unit
          .toLowerCase()
          .includes(searchKeyword.value.toLowerCase())
      ).length
      return bMatchCount - aMatchCount // Sort in descending order
    })

    filteredKeyword.value.single = sortedData
  }
}

const appendUpdatedList = async (value: any) => {
  filteredKeyword.value.single = value
}

const orderAlltop30 = computed(() => {
  // sort the smallest val_top30 is higher
  return allTop30.value
    .sort((a, b) => {
      return a.val_top30 - b.val_top30
    })
    .map((item) => {
      return {
        ...item,
        item_service_unit_list: item.item_service_unit_list.sort((a, b) => {
          return a.display_order - b.display_order
        })
      }
    })
})

const changePet = async (v: any) => {
  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    return
  }
  await prescriptionStore.fetchPrescriptionDetailList({
    id_pet: petSelected.value
  })
  customerStore.selectPet(petSelected.value)
  init()
}
const openMedicineList = async () => {
  let selectedMedicines: any

  await mtUtils.popup(SearchMedicineList, {
    normalMode: true,
    selectedItems: (value) => {
      selectedMedicines = value
    }
  })

  if (
    selectedMedicines &&
    selectedMedicines.length &&
    selectedMedicines.length > 0
  ) {
    if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
      await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
      return
    }
    filteredKeyword.value.single.push(...selectedMedicines)
    selectedMedicines.forEach((tempMedicine) => {
      selectedServices.value.push({
        selectedTab: 4,
        name_item_service: tempMedicine?.name_item_service,
        name_prescription_display: tempMedicine?.name_item_service,
        id_category1: tempMedicine?.id_category1,
        id_category2: tempMedicine?.id_category2,
        id_item_service: tempMedicine?.id_item_service,
        type_medicine_dosage: tempMedicine?.type_medicine_dosage,
        type_medicine_format: tempMedicine?.type_medicine_format,
        flg_prevention: tempMedicine?.flg_prevention,
        type_prevention: tempMedicine?.type_prevention,
        name_category1: tempMedicine?.name_category1,
        name_category2: tempMedicine?.name_category2,
        code_category2: tempMedicine?.code_category2,
        show: !isCloseDetail.value,
        process_drip: {
          id_prescription_detail: `PD_${getDateTimeNow().replace(
            /-/g,
            ''
          )}_${Math.floor(Math.random() * 100000)}`,
          id_prescription_detail_ref: ``,
          isPlusItem: false
        }
      })
      bookingRequestDetails.value.push({
        tBookingFlag: false,
        tBookingFlgTime: false,
        tBookingFlgRepeat: false,
        date_booking_confirmed: null,
        time_booking_confirmed: null,
        days_repeat: null,
        flg_continue: true,
        flg_exempt: false,
        flg_end: false,
        type_day: 1
      })
    })
    prescriptionStore.setSelectedMedicine(null)
  }
}
const closeModal = () => {
  emits('close')
}
const changeIsCloseDetail = (value) => {
  const newValue = setCharAt(
    localStorage.getItem('is_close_detail'),
    1,
    value ? '1' : '0'
  ) // SD 0, PD 1, InD 2
  localStorage.setItem('is_close_detail', newValue)
  Object.values(childFormRefs.value).forEach((childForm) =>
    childForm.changeShowDetails(!value)
  )
}
const removeItem = (key: string, index: any) => {
  selectedServices.value.splice(index, 1)
  prescriptionStore.removeIndexFromDetailList(index)
  childFormRefs.value.splice(index, 1)
}

const removeGroup = (key: any, index) => {
  selectedServices.value.findIndex((o) => o.process_drip.id_prescription_detail == key)
  if (key != -1) {
    prescriptionStore.removeIndexFromDetailList(index)
    childFormRefs.value.splice(index, 1)
    selectedServices.value.splice(index, 1)
    let child_array = selectedServices.value.filter((child) => child?.process_drip?.id_prescription_detail_ref == key)

    child_array.forEach((child, index) => {
      if (child.process_drip.id_prescription_detail_ref == key) {
        let childIndex = selectedServices.value.findIndex((o) => o?.process_drip?.id_prescription_detail_ref == key)

        if (childIndex != -1) {
          selectedServices.value.splice(childIndex, 1)
          prescriptionStore.removeIndexFromDetailList(childIndex)
          childFormRefs.value.splice(childIndex, 1)
        }
      }
    })

  }
}

const callBackOption = (option: any) => {
  if (option) {
    onTop30CheckISO(new Event('click'), [], option, null, true)
  }
}

const toggleResponseAlert = async () => {
  if (
    prescriptionStore.getSuggestAPIReqCounter ==
      prescriptionStore.getSuggestAPIResCounter &&
    prescriptionStore.getSelectedTab == 3
  ) {
    if (prescriptionStore.totalSuggestApiError) {
      await mtUtils.autoCloseAlert(
        ` From ${prescriptionStore.getSuggestAPIReqCounter} items, ${prescriptionStore.getSuggestAPIErrorCounter} failed \nTODO/Error : 処方箋の更新に失敗しました。`
      )
    } else {
      await mtUtils.autoCloseAlert('服用量を計算しました。')
    }
  }
}

async function save() {
  if (!petSelected.value) {
    await mtUtils.autoCloseAlert('対象のペットを選択してください。 ')
    return false
  }
  if (selectedServices.value.length === 0) {
    await mtUtils.autoCloseAlert('明細を1つ以上追加してください。 ')
    return false
  }
  const pdListLength = prescriptionStore.getPrescriptionHeaderByPet(
    petSelected.value
  ).prescription_detail_list.length


  const allFormData = Object.values(childFormRefs.value).map(
    (childForm, index) => {
      const dateBookingConfirmed: string =
        bookingRequestDetails.value[index].date_booking_confirmed!

      const timeBookingConfirmed: string =
        bookingRequestDetails.value[index].time_booking_confirmed!

      var datetimeBookingConfirmed = new Date(dateBookingConfirmed)

      datetimeBookingConfirmed =
        getDateByFormat(datetimeBookingConfirmed, 'YYYY/MM/DD') +
        ' ' +
        (timeBookingConfirmed ?? '00:00') +
        ':00'

      bookingRequestDetails.value[index].datetime_booking_confirmed =
        datetimeBookingConfirmed

      return {
        ...childForm.getFormData(),
        row: pdListLength + (index + 1),
        process_drip: {
          ...childForm.getFormData()['process_drip'],
          flg_drip_carrier: false
        },
        id_clinic: localStorage.getItem('id_clinic'),
        booking_detail: bookingRequestDetails.value[index]
      }
    }
  )
  const tempValidation = allFormData.map((pDObj) =>
    aahValidations.prescriptionDetailValidation(pDObj)
  )

  const resultValidation = await Promise.all(tempValidation)

  if (resultValidation.includes(false)) {
    return
  }

  if (props.requestObj && props.requestObj.flg_complete) {
    if (
      allFormData &&
      allFormData.some((pdObj: any) => !pdObj.flg_non_charge)
    ) {
      await mtUtils.autoCloseAlert(
        '会計が完了している為、\n会計項目をリクエストに追加することは出来ません。'
      )
      return
    }
  }

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/prescription_details',
    { prescription_detail_list: allFormData }
  )

  let tempArray: any = []
  if (response) {
    if (response && response.error.length && response.error.length > 0) {
      response.error.forEach((error: any) => {
        tempArray.push(
          ...selectedServices.value.filter(
            (pdObj: any) => pdObj.id_item_service == error.id_item_service
          )
        )
      })
      selectedServices.value = tempArray
    }
    if (tempArray.length && tempArray.length > 0) {
      await mtUtils.autoCloseAlert('処方箋明細の更新に失敗しました。')
      return
    }
    event_bus.emit('reloadLeft')
    closeModal()
  }
}

async function selectedTab(value: any) {
  if (value == 'top30') {
    await Promise.all([
      itemServiceUnitStore.fetchItemServiceMedicineTop30({
        type_animal: isTypeAnimal.value
          ? useCommonStore().getCommonTypeAnimalOptionList.find(
              (animal: any) =>
                customerStore?.getCustomer?.pets.find(
                  (petObj: any) => petObj.id_pet == petSelected.value
                )?.id_cm_animal == animal.id_common
            )?.code_func2
          : null,
        type_animal_allowed: customerStore?.getCustomer?.pets.find(
          (petObj: any) => petObj.id_pet == petSelected.value
        )?.id_cm_animal
      })
    ])

    allTop30.value = [
      ...sortBy(
        itemServiceUnitStore.getItemServiceMedicineTop30s,
        'display_order'
      ).map((data: any) => ({
        ...data,
        checkbox: false
      }))
    ]
  }

  if (value == 'keyword_multiple') {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      '/mst/service_groups',
      {
        isPrescriptionGroup: true,
        type_animal: isTypeAnimal.value
          ? useCommonStore().getCommonTypeAnimalOptionList.find(
              (animal: any) =>
                customerStore?.getCustomer?.pets.find(
                  (petObj: any) => petObj.id_pet == petSelected.value
                )?.id_cm_animal == animal.id_common
            )?.code_func2
          : null,
        type_animal_allowed: customerStore?.getCustomer?.pets.find(
          (petObj: any) => petObj.id_pet == petSelected.value
        )?.id_cm_animal
      }
    )
    allKeyword.value.multiple = response.map((serviceGroupObj: any) => {
      return { ...serviceGroupObj, checkbox: false }
    })
    filteredKeyword.value.multiple = allKeyword.value.multiple.filter((res) => {
      return res.service_group_item_list.length > 0
    })
    multipleKeyWordRef?.value?.$refs.textRef.focus()
  }
  if (value == 'keyword_single') {
    allKeyword.value.single = [
      ...getItems.value
        .filter((data: any) => data.type_item == 1)
        .map((data: any) => ({ ...data, checkbox: false }))
    ]
  }
}

async function openItemServiceModel(row, key?) {
  iconClickUI.value = true
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })
  iconClickUI.value = false
  if (key == 'top30') {
    await selectedTab('top30')
  }
  await prescriptionStore.fetchPrescriptionDetailList({ id_pet: props.id_pet })
  allServices.value = groupBy(
    getPrescriptionDetailList.value
      .map((data: any) => ({
        ...data,
        checkbox: false,
        datetime: formatDate(data.datetime_insert)
      }))
      .filter(
        (data: any) =>
          !(data.datetime == getDateToday() || data.flg_group_title)
      ),
    'datetime'
  )
}

const groupedPrescriptionPerPetList = (data) => {
  return groupBy(
    data.map((pd: any) => ({
      ...pd,
      datetime: formatDate(pd.date_start)
    })),
    'datetime'
  )
}

const init = async () => {
  await serviceGroupStore.fetchServiceGroups()
  await serviceDetailStore.fetchServiceDetails(props.id, {
    id_customer: props.id_customer
  })
  selectedServices.value = []
}

const petName = (value: string | number) => {
  return getPetFirstNameOnly(
    getCustomer?.value?.pets?.find((v) => v.id_pet == value)
  )
}
const optionLabel = (v) => {
  if (v) {
    if (v.customer_name_family)
      return getFullPetNameWithoutHonorific(v) + ' : ' + v.code_pet
    if (v.name_pet) return v.name_pet + ' : ' + v.code_pet
    return v.label
  }
  return ''
}

onMounted(async () => {
  if (!localStorage.getItem('is_close_detail'))
    localStorage.setItem('is_close_detail', '000') // '000' => INDEX 0 for SD, INDEX 1 for PD, INDEX 2 for InD
  isCloseDetail.value =
    localStorage.getItem('is_close_detail')?.toString()[1] == '1' ? true : false

  prescriptionStore.resetPrescriptionDetailListUI()

  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    }))

  await Promise.all([
    useCliCommonStore().fetchPreparationCliCommonList({
      code_cli_common: [22]
    }),
    prescriptionStore.fetchPrescriptionDetailList({ id_pet: props.id_pet })
  ])

  allServices.value = groupBy(
    getPrescriptionDetailList.value
      .map((data: any) => ({
        ...data,
        checkbox: false,
        datetime: formatDate(data.date_start)
      }))
      .filter(
        (data: any) =>
          !(
            data.datetime == getDateToday() ||
            data.type_detail == 2 ||
            data.type_detail == 3
          )
      ),
    'datetime'
  )


  // Sort each group by a specific property (e.g., `row`)
  for (const key in allServices.value) {
    allServices.value[key] = allServices.value[key].sort((a: any, b: any) => {
      // Replace 'row' with the property you want to sort by
      if (a.row < b.row) return -1
      if (a.row > b.row) return 1
      return 0
    })
  }

  historyTFlgUI.value = true

  petList.value = customerStore.getCustomer?.pets
  if (props.id_pet) {
    customerStore.selectPet(props.id_pet)
  }
  petSelected.value = customerStore?.getPet?.id_pet
  petSelectedLabel.value = optionLabel(customerStore?.getPet)

  if (!prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
  }
  if (!typeAnimalUI.value) {
    await mtUtils.alert('動物種を設定してください。', '確認')
  }

  if (!Object.keys(allServices.value).length) {
    tab.value = 'top30'
    selectedTab('top30')
  }

  if (getPrescriptionListByRequest.value.length) {
    prescriptionDefaultList.value = [
      prescriptionStore.getPrescriptionHeaderByPet(petSelected.value)
    ]
  }
})
</script>

<template>
  <div class="column full-height">
    <MtModalHeader @closeModal="closeModal()" class="bg-sky-blue col-auto">
      <q-toolbar-title class="text-grey-900 title2 bold">
        処方箋明細
      </q-toolbar-title>
      <q-space></q-space>
      <MtInputForm
        type="text"
        v-model="petSelectedLabel"
        label="対象ペット名"
        readonly
      />
      <!-- <MtPetFilterSelect
        v-model:selecting="petSelected"
        :pet-list="petList"
        label="対象ペット名"
        @update:model-value="changePet"
      /> -->
      <div class="q-ml-sm col-1">
        <MtInputForm
          type="text"
          v-model="typeAnimalUI"
          label="動物種"
          readonly
        />
      </div>
      <div class="q-ml-sm col-1">
        <MtInputForm
          type="text"
          v-model="valWeightUI"
          label="適用ペット体重"
          readonly
        />
      </div>
      <div class="q-ml-sm col-auto">
        <MtFormCheckBox
          v-model:checked="isCloseDetail"
          @update:checked="changeIsCloseDetail"
          label="明細閉じる"
        />
      </div>
      <div class="q-ml-sm">
        <q-btn
          unelevated
          outline
          class="q-mx-sm"
          @click="showPrescriptionList = !showPrescriptionList"
          >既存表示
        </q-btn>
      </div>
    </MtModalHeader>
    <q-card-section class="q-px-md col">
      <div class="row full-height" style="gap: 16px">
        <div :class="showPrescriptionList ? 'col-2' : 'hidden'">
          <div
            v-for="(data, key) in prescriptionDefaultList"
            class="q-mt-md flex column gap-2"
            :key="key"
          >
            <p class="text-bold q-ma-none">
              {{ petName(props?.id_pet) }} ({{
                data?.prescription_detail_list.length
              }})
            </p>
            <template
              v-for="(
                prescription_detail, date
              ) in groupedPrescriptionPerPetList(data.prescription_detail_list)"
            >
              <div class="caption1 regular divider">
                <span class="q-ml-sm">{{ date }}</span>
              </div>
              <div
                v-if="data.prescription_detail_list.length"
                v-for="datum in prescription_detail"
                class="flex"
                @click="copyCurrentPD(datum)"
              >
                <div class="q-pl-sm cursor-pointer">
                  - {{ datum?.name_prescription_display }}
                </div>
                <q-btn
                  class="text-grey-700"
                  flat
                  icon="content_copy"
                  round
                  size="8px"
                />
              </div>
              <p v-else class="q-ma-none">No data</p>
            </template>
          </div>
        </div>
        <div class="col column">
          <q-tabs
            @update:modelValue="selectedTab"
            v-model="tab"
            align="justify"
            dense
            active-color="grey-900"
            class="text-grey-700 q-bb q-mb-md col-auto"
            indicator-color="accent-700"
          >
            <q-tab name="history" label="履歴" />
            <q-tab name="top30" label="TOP30" />
            <q-tab name="keyword_multiple" label="グループ検索" />
            <q-tab name="keyword_single" label="個別検索" />
          </q-tabs>

          <q-scroll-area v-if="tab === 'history'" visible class="full-width col">
            <template
              v-for="(service, date) in allServices"
              :key="date"
              v-if="historyTFlgUI"
            >
              <div
                class="row IS-history-date cursor-pointer"
                @click="onDateSelected(date)"
              >
                <div class="col">
                  {{ date }}
                </div>
                <div class="text-grey-500 col-auto">
                  <q-icon name="content_copy"></q-icon>
                  コピー
                </div>
              </div>
              <div
                v-for="value in service"
                :key="value.id_prescription_detail"
                class="flex no-wrap q-mb-xs"
              >
                <q-card
                  :class="value.id_prescription_detail_ref ? 'q-ml-md': ''"
                  class="cursor-pointer q-card-medicine q-mb-sm full-width-wm"
                  flat
                  @click.prevent="onHistoryCheck(value)"
                >
                  <q-card-section class="q-py-none">
                    <div class="flex justify-between items-center">
                      <div class="flex">
                        <div :class="value.flg_group_title ? 'q-my-sm' : 'q-pt-sm' " class="body2 bold text-black">
                          {{ value.name_prescription_display }}
                        </div>
                        <div v-if="!value.flg_group_title">
                          <span class="caption1 text-grey-600 q-ml-md">{{
                            value.name_category2
                          }}</span>
                          <span class="body2 text-grey-800 q-ml-md">{{
                            value.date_start
                          }}</span>
                          <span> ~ </span>
                          <span class="body2 text-grey-800">{{
                            value.date_end
                          }}</span>
                          <div class="flex column">
                            <div
                              v-if="
                                useDoseStore().getAllDoses.find(
                                  (v) => v.value == value.id_dosage_frequency
                                )
                              "
                              class="body2 text-grey-600 q-ml-md q-mb-xs"
                            >
                              指定頻度 :
                              <strong class="body2 text-grey-800 q-ml-md">
                                {{
                                  useDoseStore().getAllDoses.find(
                                    (v) => v.value == value.id_dosage_frequency
                                  )?.label
                                }}
                              </strong>
                            </div>
                            <div
                              v-if="value.val_efficacy_strength_doctor"
                              class="body2 text-grey-600 q-ml-md"
                            >
                              服用成分量 :
                              <strong class="q-ml-md body2 text-grey-800">
                                ({{
                                  roundZeroAfterPoint(
                                    value.val_efficacy_strength_doctor
                                  )
                                }})
                              </strong>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div
                        @click.prevent="openItemServiceModel(value)"
                        class="z-index-100"
                        v-if="!value.flg_group_title"
                      >
                        <q-btn
                          class="text-grey-700 quiz-btn q-py-sm"
                          flat
                          icon="quiz"
                          round
                          size="10px"
                        />
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </template>
            <template v-else>
              <div
                class="flex justify-center content-center items-center full-height"
              >
                処方歴はありません。
              </div>
            </template>
          </q-scroll-area>

          <q-scroll-area v-if="tab === 'top30'" visible class="full-width col">
            <div class="q-mb-sm flex justify-end">
              <div>
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="typeAnimalUI"
                  class="q-mr-xl"
                  @click="selectedTab('top30')"
                />
              </div>
            </div>

            <div
              v-for="top30 in orderAlltop30"
              :key="top30.key"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-medicine full-width cursor-pointer"
                flat
                @click.prevent="onTop30Check(top30)"
              >
                <q-card-section class="q-px-md q-py-sm">
                  <div class="flex justify-between items-center">
                    <div class="flex items-center">
                      <span class="top30_round">{{ top30.val_top30 }}</span>
                      <div class="q-mr-lg">
                        <div class="q-mb-sm">
                          <span
                            v-if="top30.flg_not_available"
                            class="text-darkred"
                          >
                            [ 禁忌の為 使用不可 ]
                          </span>
                          <span class="body1 bold text-black">
                            {{ top30.name_item_service }}
                          </span>
                          <span class="caption1 regular text-grey-600 q-ml-md">
                            {{ top30.name_category1 }}
                            <q-icon name="arrow_right" />
                            {{ top30.name_category2 }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      @click.prevent="openItemServiceModel(top30, 'top30')"
                      class="z-index-100"
                    >
                      <q-btn
                        icon="quiz"
                        flat
                        round
                        size="18px"
                        class="text-grey-700"
                      />
                    </div>
                  </div>
                  <div v-if="top30?.item_service_option_list?.length">
                    <div class="caption2 text-grey-600 q-my-xs">
                      関連オプション
                    </div>
                    <div class="flex columns">
                      <div
                        v-for="ISO in top30?.item_service_option_list"
                        :key="ISO?.id_item_service_option"
                        class="flex"
                        @click.stop="
                          onTop30CheckISO(
                            $event,
                            top30?.item_service_option_list,
                            ISO,
                            top30
                          )
                        "
                      >
                        <div
                          v-if="
                            ISO?.id_item_service_child &&
                            !ISO?.id_item_service_child.flg_service
                          "
                          class="flex item-service-option-box"
                        >
                          <q-icon
                            class="text-grey-700 q-pt-xs"
                            name="arrow_right"
                          />
                          {{ ISO?.id_item_service_child.name_item_service }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>

          <q-scroll-area
            v-if="tab === 'keyword_multiple'"
            visible
            class="full-width col"
          >
            <div class="q-mb-sm flex justify-between">
              <div class="q-mb-sm">キーワード</div>
              <div>
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="typeAnimalUI"
                  class="q-mr-xl"
                  @click="searchMultipleKeyword"
                />
              </div>
            </div>

            <div class="flex no-wrap q-mb-md">
              <MtInputForm
                ref="multipleKeyWordRef"
                type="text"
                dense
                v-model="searchKeyword"
                class="full-width q-mr-md"
                outlined
                @keydown.enter="searchMultipleKeyword"
              />
              <q-btn
                @click="searchMultipleKeyword"
                class="bg-grey-800 q-ml-md text-white"
                flat
                round
              >
                <q-icon name="search" />
              </q-btn>
            </div>
            <div
              v-for="keyword in filteredKeyword.multiple"
              :key="keyword.id_service_group"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-medicine cursor-pointer full-width"
                flat
                @click.prevent="onMultipleKeywordCheck(keyword)"
              >
                <q-card-section>
                  <div class="flex justify-between items-center">
                    <div class="flex full-width">
                      <div class="medicine-group-title full-width">
                        {{ keyword.name_service_group }}
                      </div>
                      <div class="flex">
                        <div
                          v-for="items in keyword.service_group_item_list"
                          :key="items.id_service_group_item"
                          class="medicine-group-item q-mt-xs q-ml-md"
                        >
                          <div
                            class="flex body1 bold text-grey-800 q-mb-xs justify-between items-center"
                          >
                            {{ items.item?.name_item_service }}
                            <div @click.prevent="openItemServiceModel(items)">
                              <q-btn
                                icon="quiz"
                                flat
                                round
                                size="15px"
                                class="text-grey-700"
                              />
                            </div>
                          </div>
                          <div class="body2 text-grey-600 flex items-center">
                            {{ items?.item?.name_category1 }}
                            <q-icon name="arrow_right" />
                            {{ items?.item?.name_category2 }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>

          <q-scroll-area
            v-if="tab === 'keyword_single'"
            visible
            class="full-width col"
          >
            <div class="q-mb-sm flex justify-between">
              <span> キーワード </span>
              <div
                v-if="
                  useCommonStore().getCommonTypeAnimalOptionList.find(
                    (v) => petSelected.id_cm_animal == v.id_common
                  )
                "
              >
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="
                    useCommonStore().getCommonTypeAnimalOptionList.find(
                      (v) => petSelected.id_cm_animal == v.id_common
                    ).name_common
                  "
                  class="q-mr-xl"
                  @click="onSearchKeyword()"
                />
              </div>
            </div>
            <div class="flex no-wrap q-mb-xs">
              <MtInputForm
                dense
                type="text"
                v-model="searchKeyword"
                class="full-width q-mr-md"
                outlined
                @keydown.enter.prevent="onSearchKeyword()"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="searchKeyword && searchKeyword.length > 0"
                    class="cursor-pointer q-mr-md"
                    name="close"
                    size="xs"
                    @click="
                      () => {
                        searchKeyword = ''
                      }
                    "
                  >
                  </q-icon>
                  <q-icon
                    class="cursor-pointer"
                    name="feed"
                    @click="openMedicineList"
                  />
                </template>
              </MtInputForm>
              <q-btn
                class="bg-grey-800 q-ml-md text-white"
                round
                flat
                @click="onSearchKeyword()"
              >
                <q-icon name="search" />
              </q-btn>
            </div>
            <div class="flex items-center q-mb-md">
              <small class="text-grey-700 q-mr-sm">履歴 (10件)</small>
              <div class="flex row">
                <q-chip
                  v-for="(keyword, index) in getPrescriptionKeywords"
                  clickable
                  removable
                  size="13px"
                  @click="quickSearchKeyword(keyword)"
                  @remove="removeKeyword(index)"
                >
                  {{ keyword }}
                </q-chip>
              </div>
            </div>
            <div
              v-for="top30 in filteredKeyword.single"
              :key="top30.id_item_service_option"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-medicine full-width cursor-pointer q-mb-md"
                flat
              >
                <q-card-section>
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0 ||
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex justify-between items-center q-pb-sm"
                    @click="onSingleKeywordCheck($event, top30)"
                  >
                    <div class="flex items-center">
                      <div class="q-mr-lg">
                        <div
                          v-if="!searchKeyword"
                          class="body1 bold text-grey-800 q-mb-sm"
                        >
                          {{ top30.name_item_service }}
                        </div>
                        <div
                          v-if="searchKeyword"
                          class="body1 bold text-grey-800 q-mb-sm"
                          v-html="
                            highlightText({
                              searchQuery: searchKeyword,
                              content: top30.name_item_service
                            })
                          "
                        ></div>
                        <div
                          v-if="top30?.name_category2"
                          class="body2 text-grey-600 flex items-center"
                        >
                          {{ top30.name_category1 }}
                          <q-icon name="arrow_right" />
                          {{ top30.name_category2 }}
                        </div>
                      </div>
                    </div>
                    <div class="flex">
                      <q-chip
                        v-if="top30.flg_prevention"
                        class="chip-blue"
                        text-color="white"
                      >
                        予防
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_pet_custody_control"
                        class="chip-red"
                        text-color="white"
                      >
                        預かり
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_surgery"
                        class="chip-purple"
                        text-color="white"
                      >
                        手術
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_anesthesia"
                        class="chip-green"
                        text-color="white"
                      >
                        麻酔
                      </q-chip>
                      <div @click.prevent="openItemServiceModel(top30)">
                        <q-btn
                          class="text-grey-700"
                          flat
                          icon="quiz"
                          round
                          size="15px"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="false"
                    :class="
                      top30?.item_service_option_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex columns"
                  >
                    <div
                      v-for="ISU in top30?.item_service_unit_list"
                      :key="ISU.id_item_service_unit"
                      class="flex"
                      @click.stop="onSingleKeywordCheck($event, top30)"
                    >
                      <div class="flex item-service-unit-box">
                        <q-icon class="q-pt-xs q-mr-sm" name="play_arrow" />
                        <span v-if="!searchKeyword">
                          {{ ISU.name_service_item_unit }}
                        </span>
                        <span
                          v-if="searchKeyword"
                          v-html="
                            highlightText({
                              searchQuery: searchKeyword,
                              content: ISU.name_service_item_unit
                            })
                          "
                        ></span>
                      </div>
                    </div>
                  </div>
                  <div v-if="top30?.item_service_option_list?.length">
                    <div class="flex caption1 text-grey-500 q-ml-md q-my-md">
                      関連オプション
                    </div>
                    <div class="flex columns">
                      <div
                        v-for="ISO in top30?.item_service_option_list"
                        :key="ISO?.id_item_service_option"
                        class="flex"
                        @click.stop="
                          onTop30CheckISO(
                            $event,
                            top30?.item_service_option_list,
                            ISO,
                            top30
                          )
                        "
                      >
                        <div
                          v-if="
                            ISO?.id_item_service_child &&
                            !ISO?.id_item_service_child.flg_service
                          "
                          class="flex item-service-option-box"
                        >
                          <q-icon
                            class="text-grey-700 q-pt-xs"
                            name="arrow_right"
                          />
                          {{ ISO?.name_item_service }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>
        </div>
        <div class="col column">
          <q-scroll-area visible class="full-width col">
            <div
              v-if="selectedServices.length > 0"
              v-for="(item, index) in selectedServices"
              :key="`${item.id_item_service}${selectedTab}`"
              class="q-mb-lg"
            >
              <PrescriptionDetailListBox
                :item="item"
                :index="index"
                :bookingDetail="bookingRequestDetails[index]"
                :ref="setChildRef(index)"
                @removeItem="removeItem($event, index)"
                @checkSuggestionResponse="toggleResponseAlert"
                :petBodyWeight="valWeightUI"
                :callBack="callBackOption"
                :detailList="selectedServices"
                @removeGroup="removeGroup($event, index)"
              />
            </div>
          </q-scroll-area>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white col-auto">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" @click="save()">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>
<style lang="scss" scoped>
// higher Reso
.tab-view {
  height: calc(100dvh - 250px);
}

.side-tab-view {
  height: calc(100dvh - 210px);
}

.item-service-unit-box {
  display: flex;
  align-items: center;
  background-color: rgba(190, 204, 238, 0.5);
  color: $grey-800;
  padding: 8px 10px;
  margin: 5px 8px !important;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background-color: rgba(190, 204, 238, 0.8);
  }
}

.item-service-option-box {
  display: flex;
  align-items: center;
  color: $grey-700;
  padding: 3px 6px;
  margin: 3px 8px 3px 0px !important;
  border-radius: 4px;
  font-size: 13px;

  &:hover {
    background-color: rgba(196, 196, 196, 0.7);
    color: $grey-900;
  }
}
.z-index-100 {
  z-index: 100 !important;
}

.search-btn {
  width: 50px;
  height: 42px;
}

.medicine-group-title {
  background-color: #4f5f83;
  color: white !important;
  border-radius: 4px;
  padding: 4px 8px;
}

.medicine-group-item {
  margin: 12px 0px 0px 15px !important;
  padding: 8px 12px;
  background-color: $grey-200 !important;
  border-radius: 10px;
}

.quiz-btn {
  min-height: unset;
}

.divider {
  padding: 5px 0 5px;
  background: $grey-100;
}

.full-width-wm {
  width: 100% !important;
}
</style>
