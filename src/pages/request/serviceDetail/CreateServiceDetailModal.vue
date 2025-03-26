<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import { flatMap, groupBy, orderBy, sortBy } from 'lodash'
import {
  calculateDate,
  checkDateRange,
  dateDifferences,
  dateFormat,
  formatDate,
  getDateToday,
  getDaysAfterDate,
  getFullPetNameWithoutHonorific,
  getPetFirstNameOnly,
  highlightText,
  isBitSet,
  roundFloat,
  setCharAt
} from '@/utils/aahUtils'
import UpdatePetCustodyModal from '@/pages/petCustody/UpdatePetCustodyModal.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import useServiceGroupStore from '@/stores/service-groups'
import useServiceDetailStore from '@/stores/service-details'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import useCategoryStore from '@/stores/categories'
import useItemServiceUnitStore from '@/stores/item-service-units'
import { storeToRefs } from 'pinia'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import SearchItemUnitListModal from '@/pages/master/itemService/SearchItemUnitList.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahValidations from '@/utils/aahValidations'
import { event_bus } from '@/utils/eventBus'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import { RequestDetailPageType, ServiceDetailType, TextTemplateType } from '@/types/types'
import DateScheduleCreateServiceDetailModal from './DateScheduleCreateServiceDetailModal.vue'
import { fixedCode, noAutoCorrect, timeHourMinute, typeBooking } from '@/utils/enum'
import OptionItemServiceUnitModalUI from './OptionItemServiceUnitModalUI.vue'
import { CATEGORY_ITEM_SERVICE_DATE, CATEGORY_ITEM_SERVICE_PDF_PRINTING } from '@/utils/const/constServiceDetail'
import usePetStore from '@/stores/pets'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import SearchIdexxTestListModal from './SearchIdexxTestListModal.vue'
import useCliCommonStore from '@/stores/cli-common'
import dayjs from '@/boot/dayjs'
import selectOptions from '@/utils/selectOptions'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import useKeywordStore from '@/stores/keyword'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import useTextTemplateStore from '@/stores/text-template'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'

const SDIsuComparisonModal = defineAsyncComponent(
  () => import('@/pages/request/serviceDetail/SDIsuComparisonModal.vue')
)

const props = withDefaults(
  defineProps<{
    id: string
    id_customer: string | number
    id_pet: string | number
    modalVisible?: boolean
    request_detail_page: RequestDetailPageType
  }>(),
  {
    id: '',
    id_customer: '',
    id_pet: '',
    modalVisible: false
  }
)

const emits = defineEmits<{
  (e: 'close'): void
  (e: 'tabChanged'): void
}>()

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const employeeStore = useEmployeeStore()
const categoryStore = useCategoryStore()
const serviceDetailStore = useServiceDetailStore()
const cliCommonStore = useCliCommonStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const petStore = usePetStore()
const templateStore = useTextTemplateStore()

const illnessHistoryStore = useIllnessHistoryStore()

const getIllnessHistorys = computed(() => {
  return illnessHistoryStore.getIllnessHistorys
  
}) 

const serviceGroupStore = useServiceGroupStore()
const {
  getServiceDetails,
  getHistoryServiceDetail,
  getServiceDetailDateSchedule
} = storeToRefs(serviceDetailStore)
const { getCustomer } = storeToRefs(customerStore)
const { getServiceGroups } = storeToRefs(serviceGroupStore)
const searchKeyword = ref('')
const searchServiceGroup = ref('')
const allHistoryServices = ref([] as any)
const allTop30 = ref([] as any)
const allServiceGroup = ref([] as any)

const isCloseDetail = ref(false)
const selectedServices = ref([] as Array<any>)
const bookingRequestDetails = ref([] as Array<any>)
const tab = ref('history')
const serviceForm = ref(null)
const petList = ref<any>([])
const petListDefault = reactive<any>([])
const petSelected = ref()
const isTypeAnimal = ref(false)
const receivedISU = ref({
  selected: false
})
const loading = ref(false)
const showServiceDetailList = ref(false)
const getServiceDetailPerPetList = ref<ServiceDetailType[]>([])
const now = dayjs()
const serviceStartTime = now.floor('minute', 5).format('HH:mm')
const serviceEndTime = now.add(1, 'hour').floor('minute', 5).format('HH:mm')
const showTimeOption = ref(false)
const petSelectedLabel = ref()

const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])
const selectedServiceDetailIndex = ref<null | number>(null)

const mapFlgInsurance = async (ISU: any = null, IS: any = null) => {
  let apply_insurance = true
  let today = new Date()

  if (apply_insurance) {
    const pet = useCustomerStore().getCustomer.pets?.find(
      (v) => v.id_pet == petSelected.value.id_pet
    )
    if (
      pet &&
      pet.pet_insurance &&
      pet.pet_insurance.length &&
      pet.pet_insurance.length > 0
    ) {
      let pet_insurance = pet.pet_insurance.find((v) => new Date(v.date_insurance_end) > today)

      if (!pet_insurance) {
        return false
      }

      if (pet_insurance) {
        let itemService = null

        if (ISU) {
          itemService = await mtUtils.callApi(
            selectOptions.reqMethod.GET,
            `/mst/item_services/${ISU.id_item_service}`
          )
        } else if (IS) {
          itemService = IS
        }

        if (itemService) {
          return isBitSet(
            itemService.type_insurer,
            pet_insurance.code_insurer
          )
        }
      }
    }
  }
  return false
}

const copyCurrentSD = async (history) => {
  const selected: any = flatMap(allHistoryServices.value).find(
    (v) => v.id_service_detail === history.id_service_detail
  )

  const illnessHistory = illnessHistoryStore.getLeftSideIllnessHistoryList?.map(
    (v) => v.id_pet_illness_history
  )
  const tempService = {
    ...history,
    item_service: selected.item_service,
    showTimeOption: false,
    list_idexx_test: history.item_service_unit?.list_idexx_test || null,
    list_test: history.item_service_unit?.list_test,
    memo_etc3: history.item_service_unit?.memo_etc3,
    id_item_service: selected?.id_item_service || null,
    quantity: roundFloat(selected.quantity) || 1,
    id_item_service_unit: selected?.id_item_service_unit || null,
    flg_pet_custody_control: selected?.flg_pet_custody_control || false,
    time_service_start: serviceStartTime,
    time_service_end: serviceEndTime,
    flg_apply_insurance: await mapFlgInsurance(history, null),
    flg_booking: props.request_detail_page?.flg_booking,
    type_booking: 1,
    service_HH_MM: '00:00',
    flg_non_charge:
      history.item_service_unit.flg_non_charge ||
      props.request_detail_page.flg_complete || false,
    flg_ui_datetime_service_end: false,
    name: selected.name_item_service,
    flgRabiesUi: history.code_categor2 == 'CO5_6',
    rabies: {
      memo_exemption_rabies: '',
      date_exempt_start: null,
      date_exempt_end: null
    },
    show: !isCloseDetail.value
  }

  if (tempService.code_category2 == 'CO5_6') {
    tempService.flgRabiesUi = true
    tempService.rabies.date_exempt_start = tempService.datetime_service_start
  }

  if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
  selectedServices.value.push(tempService)
}
const onTop30CheckISU = async (top30: any, ISU: any, IS: any, index: number) => {
  const selected: any = allTop30.value
    .find((v) => v.id_item_service == IS.id_item_service)
    ?.item_service_unit_list.find(
      (v) => v.id_item_service_unit == ISU.id_item_service_unit
    )

  // if (selected.checked) {
  const illnessHistory = illnessHistoryStore.getLeftSideIllnessHistoryList?.map(
    (v) => v.id_pet_illness_history
  )

  const today = new Date()
  const m_price = ISU.price_list.find((p: any) => new Date(p.date_start) <= today && today <= new Date(p.date_end))
  
  
  const tempService = {
    ...ISU,
    showTimeOption: false,
    item_service: IS,
    item_service_unit: ISU,
    flg_no_illness_history: IS.flg_no_illness_history,
    name_category1: top30.name_category1,
    name_category2: top30.name_category2,
    code_category2: top30.code_category2,
    id_item_service: top30.id_item_service,
    id_category1: selected.id_category1,
    quantity: 1,
    flg_apply_insurance: await mapFlgInsurance(null, IS),
    flg_pet_custody_control: top30.flg_pet_custody_control || false,
    datetime_service_start: calculateDateStartSD(),
    datetime_service_end: calculateDateStartSD(),
    time_service_start: serviceStartTime,
    time_service_end: serviceEndTime,
    flg_booking: props.request_detail_page?.flg_booking,
    type_booking: 1,
    service_HH_MM: '00:00',
    flg_non_charge:
      selected.flg_non_charge ||
      props.request_detail_page.flg_complete ||
      false,
    flg_ui_datetime_service_end: false,
    flg_schedule: false,
    flg_next_cart: false,
    name: selected.name_service_item_unit,
    id_employee_doctor: props.request_detail_page?.id_employee_doctor,
    type_service: selected.flg_service
      ? commonStore.getCommonTypeServiceOptionList.find(
          (v: any) => v.id_common == IS.id_cm_type_service
        )?.code_func1
      : null,
    type_item: !selected.flg_service ? selected.type_item : null,
    date_schedule: null,
    id_employee_staff: props.request_detail_page?.id_employee_staff,
    flgRabiesUi: top30.code_categor2 == 'CO5_6',
    rabies: {
      memo_exemption_rabies: '',
      date_exempt_start: null,
      date_exempt_end: null
    },
    show: !isCloseDetail.value,
    selectedISU: top30.item_service_unit_list.map((item, idx) => {
      const today = new Date()
      const price = item.price_list.find((p) => new Date(p.date_start) <= today && today <= new Date(p.date_end))
      return {
        ...item,
        checked: idx == 0,
        unitPrice: price?.price,
        label: item.name_service_item_unit,
        value: item.id_item_service_unit,
        quantity: idx == 0 ? 1 : null,
        type_detail: 2,
        id_price: price?.id_price
      }
    }),
    type_detail: IS?.flg_plus_item ? 2 : 1,
    flg_next_cart: IS?.flg_plus_item,
    flg_takeout: IS?.flg_takeout
  }

  if (m_price) {
    tempService.unit_price = m_price.price
    tempService.base_unit_price = m_price.price
    tempService.id_price = m_price.id_price
  }


  tempService.base_calculated_tax_exculsive_price = tempService.unit_price

  if (tempService.item_service_unit.flg_tax_included) {
    if (tempService.item_service_unit.type_tax == 1) {
      tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.1)
    } else if (tempService.item_service_unit.type_tax == 2) {
      tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.08)
    }
  }
  
  if (ISU.interval) {
    const confirm = await mtUtils.confirm(
      'この商品には次回予定日の設定があります。\nこのオーダーに次回予定日を設定しますか？',
      '次回来院の適用',
      '適用'
    )
    if (confirm) tempService.flg_schedule = true
  }

  //TODO 狂犬病猶予
  if (tempService.code_category2 == 'CO5_6') {
    tempService.flgRabiesUi = true
    tempService.rabies.date_exempt_start = tempService.datetime_service_start
  }

  if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
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

  if (ISU.interval && tempService.flg_schedule) {
    changeFlgSchedule(
      tempService.flg_schedule,
      selectedServices.value.length - 1,
      tempService
    )
  }
}

const onTop30CheckISO = async (list: any, ISO: any, IS: any) => {
  let tempHistory = { ...ISO }

  IS = ISO.id_item_service_child

  if (tempHistory.item_service_unit_list.length > 0) {
    receivedISU.value.selected = false

    await mtUtils.smallPopup(OptionItemServiceUnitModalUI, {
      itemServiceUnitList: tempHistory.item_service_unit_list,
      class: 'service-detail-hover',
      selectedUnit: (value) => {
        receivedISU.value = {
          ...value
        }
      }
    })

    if (!receivedISU.value.selected) return

    tempHistory.id_item_service_option1 = `${tempHistory.id_item_service_option}${receivedISU.value.id_item_service_unit}`
    tempHistory.name_item_service = receivedISU.value.name_service_item_unit
    tempHistory.name_service_item_unit =
      receivedISU.value.name_service_item_unit
    tempHistory.name = receivedISU.value.name_service_item_unit
    tempHistory.id_item_service_unit = receivedISU.value.id_item_service_unit
    tempHistory.list_idexx_test = receivedISU.value?.list_idexx_test
    tempHistory.list_test = receivedISU.value?.list_test
    tempHistory.memo_etc3 = receivedISU.value?.memo_etc3
    tempHistory.flg_pet_custody_control =
      receivedISU.value?.flg_pet_custody_control
    tempHistory.flg_non_charge = receivedISU.value?.flg_non_charge
  }

  const illnessHistory = illnessHistoryStore.getLeftSideIllnessHistoryList?.map(
    (v) => v.id_pet_illness_history
  )


  const today = new Date()
  const m_price = receivedISU.value.price_list.find((p: any) => new Date(p.date_start) <= today && today <= new Date(p.date_end))
  
  const tempService = {
    ...tempHistory,
    showTimeOption: false,
    item_service: IS,
    item_service_unit: receivedISU.value,
    id_item_service: IS.id_item_service,
    flg_no_illness_history: IS.flg_no_illness_history,
    quantity: 1,
    flg_pet_custody_control: IS?.flg_pet_custody_control || false,
    datetime_service_start: calculateDateStartSD(),
    datetime_service_end: calculateDateStartSD(),
    time_service_start: serviceStartTime,
    time_service_end: serviceEndTime,
    flg_booking: props.request_detail_page?.flg_booking,
    flg_apply_insurance: await mapFlgInsurance(null, IS),
    type_booking: 1,
    service_HH_MM: '00:00',
    flg_non_charge:
      tempHistory.flg_non_charge ||
      props.request_detail_page.flg_complete ||
      false,
    flg_ui_datetime_service_end: false,
    flg_schedule: false,
    name: tempHistory.name
      ? tempHistory.name
      : tempHistory.id_item_service_child.name_item_service,
    id_employee_doctor: props.request_detail_page?.id_employee_doctor,
    type_service: IS.flg_service
      ? commonStore.getCommonTypeServiceOptionList.find(
          (v: any) => v.id_common == IS.id_cm_type_service
        )?.code_func1
      : null,
    type_item: !IS.flg_service ? IS.type_item : null,
    id_employee_staff: props.request_detail_page?.id_employee_staff ?? null,
    flgRabiesUi: tempHistory.code_categor2 == 'CO5_6',
    rabies: {
      memo_exemption_rabies: '',
      date_exempt_start: null,
      date_exempt_end: null
    },
    show: !isCloseDetail.value,
    id_price: m_price?.id_price,
    unit_price: m_price?.price,
    base_unit_price: m_price?.price,
    flg_discount: false
  }


  tempService.base_calculated_tax_exculsive_price = tempService.unit_price

  if (tempService.item_service_unit.flg_tax_included) {
    if (tempService.item_service_unit.type_tax == 1) {
      tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.1)
    } else if (tempService.item_service_unit.type_tax == 2) {
      tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.08)
    }
  }

  if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
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
const onHistoryCheck = async (history) => {
  const selected: any = flatMap(allHistoryServices.value).find(
    (v) => v.id_service_detail === history.id_service_detail
  )

  const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparisonSD', {
    id_service_detail: history.id_service_detail
  })

  let m_price = null

  if (comparisonResponse && Object.keys(comparisonResponse).length > 0) {
    await mtUtils.smallPopup(SDIsuComparisonModal, {
      comparisonResponse: comparisonResponse,
      service_detail: history,
      callBack: (param: any) => {
        if (param.submitted) {
          m_price = param[history.id_service_detail]
        }
      }
    })
  }


  const illnessHistory = illnessHistoryStore.getLeftSideIllnessHistoryList?.map(
    (v) => v.id_pet_illness_history
  )
  const tempService = {
    ...history,
    showTimeOption: false,
    item_service_unit: history.item_service_unit,
    list_idexx_test: history.item_service_unit?.list_idexx_test,
    list_test: history.item_service_unit?.list_test,
    memo_etc3: history.item_service_unit?.memo_etc3,
    flg_no_illness_history: history.item_service.flg_no_illness_history,
    id_item_service: selected?.id_item_service || null,
    quantity: roundFloat(selected.quantity) || 1,
    id_item_service_unit: selected?.id_item_service_unit || null,
    flg_pet_custody_control: selected?.flg_pet_custody_control || false,
    datetime_service_start: getDateToday(),
    datetime_service_end: calculateEndDateSelectedSD(
      selected?.datetime_service_start,
      selected?.datetime_service_end
    ),
    time_service_start: serviceStartTime,
    time_service_end: serviceEndTime,
    flg_apply_insurance: await mapFlgInsurance(history, null),
    flg_booking: props.request_detail_page?.flg_booking,
    type_booking: 1,
    service_HH_MM: '00:00',
    id_employee_doctor:
      props.request_detail_page.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      props.request_detail_page.id_employee_staff ??
      JSON.parse(localStorage.getItem('id_employee')),
    flg_non_charge: history.item_service_unit.flg_non_charge || props.request_detail_page.flg_complete || false,
    flg_ui_datetime_service_end: false,
    name: selected.name_item_service,
    flgRabiesUi: history.code_categor2 == 'CO5_6',
    rabies: {
      memo_exemption_rabies: '',
      date_exempt_start: null,
      date_exempt_end: null
    },
    show: !isCloseDetail.value,
    flg_next_cart: !!history.flg_plus_item,
    unit_price: history.unit_price,
    base_unit_price: m_price?.price || history.unit_price
  }
  if (m_price) {
    tempService.unit_price = m_price.price
    tempService.id_price = m_price.id_price
  }

  tempService.base_calculated_tax_exculsive_price = tempService.unit_price

  if (tempService.item_service_unit.flg_tax_included) {
    if (tempService.item_service_unit.type_tax == 1) {
      tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.1)
    } else if (tempService.item_service_unit.type_tax == 2) {
      tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.08)
    }
  }

  if (tempService.code_category2 == 'CO5_6') {
    tempService.flgRabiesUi = true
    tempService.rabies.date_exempt_start = tempService.datetime_service_start
  }

  if (illnessHistory) tempService.id_pet_illness_history = illnessHistory

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

const onDateSelected = async (date) => {
  const copyArray = [...allHistoryServices.value[date]]
  const copyArray1 = [...allHistoryServices.value[date]]

  const illnessHistory = illnessHistoryStore.getLeftSideIllnessHistoryList?.map(
    (v) => v.id_pet_illness_history
  )
  let compareServiceDetailList = []

  copyArray1.splice(0, 30).forEach(async (history) => {
    compareServiceDetailList.push(history.id_service_detail)
  })


  const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparisonSD', {
    id_service_detail_list: compareServiceDetailList
  })

  let IsuBySD = {}

  if (comparisonResponse && Object.keys(comparisonResponse).length > 0) {
    await mtUtils.smallPopup(SDIsuComparisonModal, {
      comparisonResponse: comparisonResponse,
      service_detail: history,
      callBack: (param: any) => {
        if (param.submitted) {
          IsuBySD = param
        }
      }
    })
  }
  
  copyArray.splice(0, 30).forEach(async (history) => {
    const tempService = {
      ...history,
      showTimeOption: false,
      id_item_service: history?.id_item_service || null,
      flg_no_illness_history: history.item_service.flg_no_illness_history,
      quantity: roundFloat(history.quantity) || 1,
      id_item_service_unit: history?.id_item_service_unit || null,
      flg_pet_custody_control: history?.flg_pet_custody_control || false,
      datetime_service_start: calculateDateStartSD(),
      datetime_service_end: calculateDateStartSD(),
      time_service_start: serviceStartTime,
      time_service_end: serviceEndTime,
      flg_apply_insurance: await mapFlgInsurance(null, history.item_service),
      flg_booking: props.request_detail_page?.flg_booking,
      type_booking: 1,
      service_HH_MM: '00:00',
      flg_non_charge:
        history.flg_non_charge ||
        props.request_detail_page.flg_complete ||
        false,
      flg_ui_datetime_service_end: false,
      flg_schedule: false,
      name: history.name_item_service,
      type_service: history.flg_service ? history.type_service : null,
      type_item: !history.flg_service ? history.type_item : null,
      flgRabiesUi: history.code_categor2 == 'CO5_6',
      rabies: {
        memo_exemption_rabies: '',
        date_exempt_start: null,
        date_exempt_end: null
      },
      show: !isCloseDetail.value,
      id_price: (history.id_service_detail in IsuBySD) ? IsuBySD[history.id_service_detail].id_price : history.id_price,
      unit_price: (history.id_service_detail in IsuBySD) ? IsuBySD[history.id_service_detail].price : history.unit_price,
      base_unit_price: (history.id_service_detail in IsuBySD) ? IsuBySD[history.id_service_detail].price : history.unit_price
    }

    tempService.base_calculated_tax_exculsive_price = tempService.unit_price

    if (tempService.item_service_unit.flg_tax_included) {
      if (tempService.item_service_unit.type_tax == 1) {
        tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.1)
      } else if (tempService.item_service_unit.type_tax == 2) {
        tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.08)
      }
    }
    
    if (tempService.code_category2 == 'CO5_6') {
      tempService.flgRabiesUi = true
      tempService.rabies.date_exempt_start = tempService.datetime_service_start
    }

    if (illnessHistory) tempService.id_pet_illness_history = illnessHistory

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
  })
}

const onServiceGroupCheck = async (keyword: any) => {
  const selected: any = allServiceGroup.value.find(
    (v) => v.code_service_group === keyword.code_service_group
  )

  const newArray = selected.service_group_item_list.map(async (item) => {

    const today = new Date()
    const m_price = item?.item_service_unit?.price_list.find((p: any) => new Date(p.date_start) <= today && today <= new Date(p.date_end))
    
    const tempService = {
      ...item.item_service_unit,
      item_service_unit: item.item_service_unit,
      showTimeOption: false,
      id_item_service: item.item_service_unit?.id_item_service?.id_item_service,
      flg_no_illness_history: item.item_service_unit?.id_item_service?.flg_no_illness_history,
      item_service: item.item_service_unit?.id_item_service,
      quantity: item.quantity || 1,
      name: item.item_service_unit?.name_service_item_unit,
      name_category1: item.item_service_unit?.id_item_service?.name_category1,
      name_category2: item.item_service_unit?.id_item_service?.name_category2,
      flg_pet_custody_control:
        item.item_service_unit?.id_item_service?.flg_pet_custody_control ||
        false,
      flg_apply_insurance: await mapFlgInsurance(
        null,
        item.item_service_unit?.id_item_service
      ),
      datetime_service_start: calculateDateStartSD(),
      datetime_service_end: calculateDateStartSD(),
      time_service_start: serviceStartTime,
      time_service_end: serviceEndTime,
      flg_booking: props.request_detail_page?.flg_booking,
      type_booking: 1,
      flg_non_charge:
        item.flg_non_charge || props.request_detail_page.flg_complete || false,
      flg_ui_datetime_service_end: false,
      flg_schedule: false,
      id_pet_illness_history: [
        illnessHistoryStore.getIllnessHistory?.id_pet_illness_history
      ],
      id_employee_doctor: props.request_detail_page?.id_employee_doctor,
      type_service: item.item_service_unit?.id_item_service.flg_service
        ? commonStore.getCommonTypeServiceOptionList.find(
            (v: any) =>
              v.id_common ==
              item.item_service_unit?.id_item_service?.id_cm_type_service
          )?.code_func1
        : null,
      type_item: !item.item_service_unit?.id_item_service.flg_service
        ? selected.type_item
        : null,
      flgRabiesUi:
        item.item_service_unit?.id_item_service?.code_categor2 == 'CO5_6',
      rabies: {
        memo_exemption_rabies: '',
        date_exempt_start: null,
        date_exempt_end: null
      },
      flg_takeout: item.item_service_unit?.id_item_service?.flg_takeout
    }

    if (tempService.code_category2 == 'CO5_6') {
      tempService.flgRabiesUi = true
      tempService.rabies.date_exempt_start = tempService.datetime_service_start
    }

    if (m_price) {
      tempService.unit_price = m_price.price
      tempService.base_unit_price = m_price.price
      tempService.id_price = m_price.id_price
    }

    tempService.base_calculated_tax_exculsive_price = tempService.unit_price

    if (tempService.item_service_unit.flg_tax_included) {
      if (tempService.item_service_unit.type_tax == 1) {
        tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.1)
      } else if (tempService.item_service_unit.type_tax == 2) {
        tempService.base_calculated_tax_exculsive_price = Math.round(tempService.base_calculated_tax_exculsive_price / 1.08)
      }
    }

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
    return tempService
  })
  const updateArray = await Promise.all(newArray)
  selectedServices.value = [...selectedServices.value, ...updateArray]
}
const onSearchServiceGroup = async () => {
  await serviceGroupStore.fetchServiceGroups({
    name_service_group: searchServiceGroup.value.toLowerCase(),
    type_animal: isTypeAnimal.value ? petSelected.value.id_cm_animal : null,
    isServiceGroup: true
  })
  allServiceGroup.value = getServiceGroups.value
}

const keywordStore = useKeywordStore()

const { getServiceDetailKeywords } = storeToRefs(keywordStore)

const quickSearchKeyword = async (keyword: string) => {
  searchKeyword.value = keyword

  await onSearchKeyword(true)
}

const removeKeyword = (keywordIndex: number) => {
  keywordStore.removeServiceDetailKeyword(keywordIndex)
}

const onSearchKeyword = async (quickSearch = false) => {
  if (searchKeyword.value.length === 0) {
    return
  }

  if (!quickSearch) {
    keywordStore.addServiceDetailKeyword(searchKeyword.value)
  }

  await itemServiceUnitStore.SearchItemServiceWithOptions({
    search_words: searchKeyword.value,
    type_animal: isTypeAnimal.value ? petSelected.value.id_cm_animal : null,
    flg_service: true,
    no_pagination: true
  })
  const modifiedData = [
    ...sortBy(
      itemServiceUnitStore.getItemServiceWithOptionList,
      'display_order'
    ).map((item: any) => {
      console.log("Item: ", item)
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
    })
  ]

  const filterModifiedData = modifiedData
    .map((data) => {
      data.item_service_unit_list = data?.item_service_unit_list?.filter(
        (item) => {
          return filterDataByDate(item.date_start, item.date_end)
        }
      )
      data.item_service_option_list = data?.item_service_option_list?.filter(
        (item) => {
          item.item_service_unit_list = sortBy(
            item.item_service_unit_list,
            'display_order'
          ).filter((itemService) => {
            return filterDataByDate(
              itemService.date_start,
              itemService.date_end
            )
          })

          return item.item_service_unit_list.length > 0
        }
      )
      return data
    })
    .filter((data) => {
      return (
        data.item_service_unit_list.length > 0 ||
        data.item_service_option_list.length > 0
      )
    })

  const sortedData = orderBy(
    filterModifiedData,
    (item) => {
      const matchedItems = item?.item_service_unit_list?.filter((isu) =>
        isu.name_service_item_unit.toLowerCase().includes(searchKeyword.value)
      )
      return matchedItems.length
    },
    'desc'
  )

  allTop30.value = sortedData
}
const showDateSchedule = (item) => {
  if (item.code_category2) {
    const findCategory = CATEGORY_ITEM_SERVICE_DATE.find((v) =>
      item.code_category2?.startsWith(v.code_category1)
    )
    if (findCategory) return findCategory
    else return false
  } else return false
}
const openEventAvailable = async (item, key) => {
  await mtUtils.smallPopup(DateScheduleCreateServiceDetailModal, {
    datetime: item.datetime_service_start
  })
  if (getServiceDetailDateSchedule.value) {
    selectedServices.value[key].date_schedule =
      getServiceDetailDateSchedule.value
    serviceDetailStore.setServiceDetailDateSchedule(null)
  }
}
const calculateDateStartSD = () => {
  if (
    getDateToday() >= props.request_detail_page?.date_request_start &&
    getDateToday() <= props.request_detail_page?.date_request_goal
  )
    return getDateToday()
  if (getDateToday() < props.request_detail_page?.date_request_start)
    return props.request_detail_page?.date_request_start
  if (getDateToday() > props.request_detail_page?.date_request_goal)
    return props.request_detail_page?.date_request_goal
  return props.request_detail_page?.date_request_start
}
const calculateEndDateSelectedSD = (
  datetime_start: string,
  datetime_end: string
) => {
  const days = dateDifferences(datetime_end, datetime_start)
  const newDate = getDaysAfterDate(getDateToday(), days)

  return newDate
}
const isShowIdexxName = (value: string) => {
  if (value && typeof value == 'string') value = JSON.parse(value)

  if (value && value.length > 0) return true
  return false
}
const showIdexxName = (value: Array<string> | number | string) => {
  if (value && typeof value == 'number' && value == noAutoCorrect)
    return '設定なし'

  if (value && typeof value == 'string') value = JSON.parse(value)

  if (value && value.length > 0) {
    if (value && value.includes(noAutoCorrect)) return '設定なし'

    return value
      .map((v) => {
        const name = commonStore.getCommonIdexxSearchList.find(
          (c) => c.code_func2 == v
        )?.name_common
        return name
      })
      .join(', ')
  } else return '-'
}
const getItem = (value: string) => value
const categoryName = (value: any) =>
  categoryStore.getAllCategories.find((v) => v.value === value)?.label
const changePet = async (v: any) => {
  /* TODO Talha, do we need this here? */
  if (!petSelected.value) {
    await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。', '')
    return
  }
  petSelected.value = v
  customerStore.selectPet(v.id_pet)
  init()
}

const filterDataByDate = (dateStart: string, dateEnd: string) => {
  const today = new Date()
  const formatDateStart = new Date(dateStart)
  formatDateStart.setHours(0, 0, 0, 0)
  const formatDateEnd = new Date(dateEnd)
  return (
    (!formatDateStart || today >= formatDateStart) &&
    (!formatDateEnd || today < formatDateEnd)
  )
}

const tabChanged = async (v: string) => {
  if (v == 'top30') {
    await itemServiceUnitStore.SearchItemServiceWithOptions({
      val_top30: true,
      type_animal: isTypeAnimal.value ? petSelected.value.id_cm_animal : null,
      flg_service: true,
      no_pagination: true
    })

    const modifiedData = [
      ...sortBy(
        itemServiceUnitStore.getItemServiceWithOptionList,
        'display_order'
      ).map((item: any) => {
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
      })
    ]

    const filterModifiedData = modifiedData
      .map((data) => {
        data.item_service_unit_list = data?.item_service_unit_list?.filter(
          (item) => {
            return filterDataByDate(item.date_start, item.date_end)
          }
        )
        data.item_service_option_list = data?.item_service_option_list?.filter(
          (item) => {
            item.item_service_unit_list = sortBy(
              item.item_service_unit_list,
              'display_order'
            ).filter((itemService) => {
              return filterDataByDate(
                itemService.date_start,
                itemService.date_end
              )
            })

            return item.item_service_unit_list.length > 0
          }
        )
        return data
      })
      .filter((data) => {
        return (
          data.item_service_unit_list.length > 0 ||
          data.item_service_option_list.length > 0
        )
      })

    allTop30.value = filterModifiedData
  }
  if (v == 'service_group') {
    await serviceGroupStore.fetchServiceGroups({
      type_animal: isTypeAnimal.value ? petSelected.value?.id_cm_animal : null,
      isServiceGroup: true
    })

    const modifiedData = [
      ...sortBy(getServiceGroups.value, 'display_order')
        .filter((data: any) => data.type_group_item !== 1)
        .map((data: any) => ({ ...data, checkbox: false }))
    ]

    const filterModifiedData = modifiedData
      .map((data) => {
        data.service_group_item_list = data.service_group_item_list?.filter(
          (item) => {
            return filterDataByDate(
              item.item_service_unit.date_start,
              item.item_service_unit.date_end
            )
          }
        )

        return data
      })
      .filter((data) => {
        return data.service_group_item_list.length > 0
      })

    allServiceGroup.value = filterModifiedData
  }
  if (v == 'keyword') {
    allTop30.value = []
  }
}

async function openItemServiceModel(row, key?) {
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })

  await init_data()
  // Trigger fetch again
  if (key === 'top30') {
    console.log('top30')
    await tabChanged('top30')
  }
}

const openSearchIdexxTestList = async (key) => {
  await mtUtils.mediumPopup(SearchIdexxTestListModal)
  if (serviceDetailStore.getSelectedIdexx.length > 0) {
    selectedServices.value[key].list_idexx_test =
      serviceDetailStore.getSelectedIdexx

    serviceDetailStore.resetSelectedIdexx()
  }
}

const closeModal = () => {
  emits('close')
}
const removeItem = (key: number) => {
  selectedServices.value.splice(key, 1)
  bookingRequestDetails.value.splice(key, 1)
}
const check_and_create_booking = async (index, service_detail_response) => {
  const service_detail_obj = service_detail_response
  const bookingDetails = bookingRequestDetails.value[index]

  if (!bookingDetails) {
    return
  }

  if (bookingDetails && !bookingDetails.tBookingFlag) {
    return
  }

  const timeBookingConfirmed: string = bookingDetails?.time_booking_confirmed

  const format = formatDate(
    bookingDetails?.date_booking_confirmed,
    'YYYY-MM-DD'
  )

  const datetimeBookingConfirmed =
    format + ' ' + (timeBookingConfirmed ?? '00:00') + ':00'

  const temp = {
    id_clinic: service_detail_obj.id_clinic,
    id_customer: service_detail_obj.id_customer,
    id_pet: service_detail_obj.id_pet,
    id_request: service_detail_obj.id_request,
    id_service_detail: service_detail_obj.id_service_detail,
    days_repeat: bookingDetails.days_repeat,
    flg_continue: bookingDetails.flg_continue,
    flg_exempt: bookingDetails.flg_exempt,
    flg_end: bookingDetails.flg_end,
    type_booking_source: 2,
    datetime_booking_confirmed: datetimeBookingConfirmed
  }

  const resp = await serviceDetailStore.submitServiceDetailBooking(
    service_detail_obj.id_request,
    service_detail_obj.id_service_detail,
    temp
  )
}

const showButton = (id_category: string) => {
  const code_category = categoryStore.getAllCategories.find(
    (v) => v.id_category === id_category
  )?.code_category
  const getCategoryCustomButton = CATEGORY_ITEM_SERVICE_PDF_PRINTING.find(
    (v) => code_category === v.code_category1 && v.target_modal == 'order_idexx'
  )

  if (getCategoryCustomButton) return getCategoryCustomButton
  else return false
}
const submit = async () => {
  // const date = {
  //   start:
  // }

  if (!petSelected.value) {
    mtUtils.autoCloseAlert('対象のペットを選択してください。 ')
    return false
  }
  if (selectedServices?.value.length === 0) {
    mtUtils.autoCloseAlert('明細を1つ以上追加してください。 ')
    return false
  }
  // if (illnessHistoryStore.getIllnessHistorys.length == 0) {
  //   mtUtils.autoCloseAlert('Illness History is not exist for this pet.')
  //   return false
  // }

  try {
    let status = true
    let status_custody_control = false
    let flg_hospitalization = false
    const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

    let dateRanges = []

    selectedServices?.value.forEach((element: any) => {
      if (Boolean(element.flg_ui_datetime_service_end)) {
        dateRanges.push({
          start_date: element.datetime_service_start,
          end_date: element.datetime_service_end
        })
      }
    })

    let tempPlusItemList = []

    selectedServices?.value?.filter((ele) => ele?.type_detail == 2)
      .map((sd) => {sd.selectedISU?.filter((nof) => nof?.checked)
          .map((i) => {
            tempPlusItemList.push({
              ...sd,
              ...i,
              list_idexx_test: JSON.stringify([])
            })
          })
      })

    let payloadList = [
      ...selectedServices?.value?.filter((e) => e?.type_detail != 2),
      ...tempPlusItemList
    ]

    if (dateRanges && dateRanges.length > 0 && !checkDateRange(dateRanges))
      return false

    let selectedSDIndex = 0
    for (const element of payloadList) {
      // IDEXX CREATING VALIDATION
      if (
        element.list_idexx_test &&
        ((typeof element.list_idexx_test == 'string' &&
          JSON.parse(element.list_idexx_test)?.length > 0) ||
          (Array.isArray(element.list_idexx_test) &&
            element.list_idexx_test?.length > 0))
      ) {
        let validationIdexx = []
        if (!element.id_employee_doctor) validationIdexx.push('担当医')
        if (!petSelected.value.name_kana_pet)
          validationIdexx.push('ペットカナ名')
        if (!petSelected.value.id_cm_animal) validationIdexx.push('動物種')
        if (!petSelected.value.id_cm_breed) validationIdexx.push('品種')
        if (!petSelected.value.type_pet_gender)
          validationIdexx.push('ペット性別')
        if (!petSelected.value.date_birth)
          validationIdexx.push('ペット生年月日')

        if (validationIdexx.length > 0) {
          let validationMessage = `IDEXX検査のオーダー作成に必要な項目が不足しています。\n再設定してください。\n`
          validationIdexx.forEach((v) => {
            validationMessage += `<ol>${v}</ol>`
          })
          await mtUtils.alert(validationMessage, '確認してください')
          return false
        }
      }

      const serviceStartDate = dayjs(
        element.datetime_service_start,
        'YYYY/MM/DD'
      )
      const serviceEndDate = dayjs(element.datetime_service_end, 'YYYY/MM/DD')

      let serviceStartDatetime, serviceEndDatetime

      if (element.showTimeOption.value) {
        serviceStartDatetime = dayjs(
          `${serviceStartDate.format('YYYY-MM-DD')} ${
            element.time_service_start
          }`
        )
        serviceEndDatetime = dayjs(
          `${serviceEndDate.format('YYYY-MM-DD')} ${element.time_service_end}`
        )
      } else {
        serviceStartDatetime = dayjs(
          `${serviceStartDate.format('YYYY-MM-DD')} 00:00:00`
        )
        serviceEndDatetime = dayjs(
          `${serviceEndDate.format('YYYY-MM-DD')} 00:00:00`
        )
      }
      element.datetime_service_start = serviceStartDatetime.format(
        'YYYY-MM-DD HH:mm:ss'
      )
      element.datetime_service_end = serviceEndDatetime.format(
        'YYYY-MM-DD HH:mm:ss'
      )

      const category2 = categoryStore.getAllCategories?.find(
        (v) => v.id_category == element.item_service.id_category2
      )

      const store = {
        ...element,
        code_category2: category2?.code_category,
        id_item_service: element.id_item_service,
        id_request: props.id,
        id_customer: props.id_customer,
        id_pet: props.id_pet,
        name_item_service: element.name_item_service
          ? element.name_item_service
          : element.name_service_item_unit,
        id_pet_illness_history: element.id_pet_illness_history,
        flg_complete: false,
        id_item_service_unit: element?.id_item_service_unit,
        flg_surgery: element.item_service.flg_surgery,
        flg_schedule: element.flg_schedule,
        flg_anesthesia: element.item_service.flg_anesthesia,
        flg_prevention: element.item_service.flg_prevention,
        type_prevention: element.item_service.type_prevention,
        flg_pet_custody_control: element.flg_pet_custody_control,
        id_category1: element.item_service.id_category1,
        id_category2: element.item_service.id_category2,
        name_category1: element.item_service.name_category1,
        name_category2: element.item_service.name_category2,
        type_service: element.type_service
          ? element.type_service
          : element.id_item_service.type_service,
        type_item: element.item_service.type_item,
        id_clinic: id_clinic
      }

      if (element.id_employee_doctor) {
        const employee = employeeStore.getAllEmployees.find(
          (v) => v.value === element.id_employee_doctor
        )
        store.name_display = employee?.label
      }

      if (element.id_employee_staff) {
        const employee = employeeStore.getAllEmployees.find(
          (v) => v.value === element.id_employee_staff
        )
        store.name_employee_staff = employee?.label
      }

      if (element.flg_pet_custody_control) {
        status_custody_control = true
        flg_hospitalization =
          element.code_category2 == fixedCode.category_hospitalization
      }

      Object.keys(store).map((objectKey) => {
        if (
          store[objectKey] === null ||
          store[objectKey] === undefined ||
          store[objectKey] === ''
        ) {
          delete store[objectKey]
        }
      })

      if (props.request_detail_page && props.request_detail_page.flg_complete) {
        if (!store.flg_non_charge) {
          await mtUtils.autoCloseAlert(
            '会計が完了している為、\n会計項目をリクエストに追加することは出来ません。'
          )
          return
        }
      }

      if (
        dayjs(element.rabies.date_exempt_start).isAfter(
          dayjs(element.rabies.date_exempt_end)
        )
      ) {
        // 日付を確認してください
        await mtUtils.autoCloseAlert('日付を確認してください')
        return
      }

      try {
        loading.value = true
        await serviceDetailStore.submitServiceDetail(props.id, store)
        await check_and_create_booking(
          selectedSDIndex,
          serviceDetailStore.getRecentServiceDetail
        )

        let list_idexx_test = element.list_idexx_test

        if (Array.isArray(element.list_idexx_test)) {
          list_idexx_test = JSON.stringify(element.list_idexx_test)
        }

        if (
          list_idexx_test &&
          typeof list_idexx_test == 'string' &&
          JSON.parse(list_idexx_test)?.length > 0 &&
          !JSON.parse(list_idexx_test).includes(noAutoCorrect)
        ) {
          const createIdexxData = {
            id_service_detail:
              serviceDetailStore.getRecentServiceDetail?.id_service_detail,
            status: 'SUBMITTED',
            editable: true,
            test: JSON.parse(list_idexx_test),
            ivls: [
              {
                serialNumber:
                  cliCommonStore.getCliCommonIVLS?.[0]?.code_func1 || '',
                displayName: null
              }
            ]
          }
          const submit_idexx =
            await serviceDetailStore.submitServiceDetailIdexx(createIdexxData)
          if (submit_idexx?.uiURL) window.open(submit_idexx.uiURL, '_blank')
        }

        if (store.type_prevention) {
          await petStore.updatePet(
            petSelected.value?.id_pet,
            props.id_customer,
            {
              id_customer: props.id_customer,
              id_pet: petSelected.value?.id_pet,
              name_pet: petSelected.value.name_pet,
              ['date_last_type_prev_' + store.type_prevention]: dateFormat(
                store.datetime_service_end
              )
            }
          )
        }
      } catch (error) {
        console.log(error)
        mtUtils.autoCloseAlert(aahMessages.failed)
        status = false
        break // Stop the loop if there is an error
      }
      selectedSDIndex++
    }
    loading.value = false
    if (status) {
      if (status_custody_control) {
        const create_custody_control = payloadList?.filter(
          (v) => v.flg_pet_custody_control
        )
        await mtUtils.mediumPopup(UpdatePetCustodyModal, {
          data: create_custody_control,
          id_customer: props.id_customer,
          id_pet: petSelected.value?.id_pet,
          id_request: props.id,
          flg_hospitalization: flg_hospitalization
        })
      } else {
        mtUtils.autoCloseAlert(aahMessages.success)
      }
      init()
      emits('close')
      event_bus.emit('reloadTop', true)
      event_bus.emit('reloadLeft')
    }
  } catch (error) {
    console.log('Error on submit', error)
    mtUtils.autoCloseAlert(aahMessages.failed)
  }
}
const openSearchItemUnitListModal = async () => {
  await mtUtils.popup(SearchItemUnitListModal, {})
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
        item_service_unit_list: sortBy(
          item.item_service_unit_list,
          'display_order'
        )
      }
    })
})
event_bus.on('setItemServiceGroup', (itemServices = []) => {
  if (itemServices && itemServices.length && itemServices.length > 0) {
    allTop30.value.push(...itemServices)
  }
})
const init = async () => {
  selectedServices.value = []
}

const changeIsCloseDetail = (value) => {
  const newValue = setCharAt(
    localStorage.getItem('is_close_detail'),
    0,
    value ? '1' : '0'
  ) // SD 0, PD 1, InD 2
  localStorage.setItem('is_close_detail', newValue)
  selectedServices.value.map((v) => {
    v.show = !value
    return v
  })
}

const changeFlgSchedule = (checked, index, ISU: any = null) => {
  bookingRequestDetails.value[index].tBookingFlag = checked
  if (bookingRequestDetails.value[index].tBookingFlag == false) {
    bookingRequestDetails.value[index].date_booking_confirmed = null
    bookingRequestDetails.value[index].time_booking_confirmed = null
    bookingRequestDetails.value[index].tBookingFlgTime = false
    bookingRequestDetails.value[index].tBookingFlgRepeat = false
    bookingRequestDetails.value[index].days_repeat = null
    bookingRequestDetails.value[index].flg_continue = true
    bookingRequestDetails.value[index].flg_exempt = false
    bookingRequestDetails.value[index].flg_end = false
  }

  if (
    bookingRequestDetails.value[index].tBookingFlag == true &&
    ISU &&
    ISU.interval
  ) {
    let interval = ISU.interval.length > 0 ? ISU.interval.split(' ') : null
    let cycle, unit
    if (interval && interval.length == 2) {
      cycle = interval[0]
      unit = interval[1]

      if (unit == '日') {
        bookingRequestDetails.value[index].date_booking_confirmed =
          calculateDate(ISU.datetime_service_start, cycle, '1')
      }
      if (unit == '週') {
        bookingRequestDetails.value[index].date_booking_confirmed =
          calculateDate(ISU.datetime_service_start, cycle, '2')
      }
      if (unit == '月') {
        bookingRequestDetails.value[index].date_booking_confirmed =
          calculateDate(ISU.datetime_service_start, cycle, '3')
      }
      if (unit == '年') {
        bookingRequestDetails.value[index].date_booking_confirmed =
          calculateDate(ISU.datetime_service_start, cycle, '4')
      }
    }
  }
}

// group
const groupedServicesDetailsbyDate = computed(() => {
  return groupBy(
    getServiceDetailPerPetList?.value.map((data: any) => ({
      ...data,
      datetime: formatDate(data.datetime_service_start)
    })),
    'datetime'
  )
})

const selectDefaultEmployee = (value: string, key: number) => {
  selectedServices.value[key][value] = defaultEmployee
}

const init_data = async () => {
  await Promise.all([
    cliCommonStore.fetchPreparationCliCommonList(
      { code_cli_common: [15] },
      true
    ),
    serviceDetailStore.fetchServiceDetails(props.id, {
      id_customer: props.id_customer
    }),
    serviceDetailStore.fetchAllHistoryServiceDetails({
      id_pet: props?.id_pet,
      id_customer: props?.id_customer
    })
  ])
  if (getHistoryServiceDetail.value) {
    allHistoryServices.value = groupBy(
      getHistoryServiceDetail?.value.map((data: any) => ({
        ...data,
        checkbox: false,
        datetime: formatDate(data.datetime_service_start)
      })),
      'datetime'
    )
    if (!Object.keys(allHistoryServices.value).length) {
      tab.value = 'top30'
      tabChanged('top30')
    }
  }
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

const openAddTextTemplateModal = async (typeTextTemplate: number, serviceDetailIndex: number) => {
  selectedServiceDetailIndex.value = serviceDetailIndex;
  typeMemoSelected.value = typeTextTemplate
  await templateStore.fetchTemplates({ type_text_template: typeTextTemplate })

  memoTemplates.value = templateStore.getTemplates?.filter((template) => {
    return template.type_text_template === typeTextTemplate
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

const handleUpdateMemo = (memoValue: string, type: number) => {
  const index = selectedServiceDetailIndex.value;
  if (index !== null && memoValue) {
    selectedServices.value[index].memo_service = selectedServices.value[index]
      .memo_service
      ? `${selectedServices.value[index].memo_service} ${memoValue}`
      : `${memoValue}`
  }
}

onMounted(async () => {
  if (!localStorage.getItem('is_close_detail'))
    localStorage.setItem('is_close_detail', '000') // '000' => INDEX 0 for SD, INDEX 1 for PD, INDEX 2 for InD
  isCloseDetail.value =
    localStorage.getItem('is_close_detail')?.toString()[0] == '1' ? true : false

  await init_data()

  petList.value.length = 0
  petListDefault.length = 0
  petList.value = [
    ...customerStore.getCustomer?.pets?.filter(
      (pet) => !pet.flg_unlist && !pet.flg_deceased
    )
  ]
  petListDefault.push(
    ...customerStore.getCustomer?.pets?.filter(
      (pet) => !pet.flg_unlist && !pet.flg_deceased
    )
  )
  petSelected.value = customerStore.getPet
  petSelectedLabel.value = optionLabel(customerStore?.getPet)
  if (getServiceDetails.value.length) {
    getServiceDetailPerPetList.value = getServiceDetails.value?.filter((sd) => {
      return sd.id_pet === props.id_pet
    })
  }
})

onUnmounted(() => {
  console.log('Unmounted ServiceDetail')
})
</script>

<template>
  <q-card class="column full-height">
    <MtModalHeader @closeModal="closeModal()" class="bg-light-blush col-auto">
      <q-toolbar-title class="text-grey-900 title2 bold">
        治療サービス明細
      </q-toolbar-title>
      <div class="row">
        <div class="col-12">
          <div class="flex items-center">
            <MtInputForm
              v-model="petSelectedLabel"
              label="対象ペット *"
              readonly
              type="text"
              class="q-mr-sm selection-field"
            />
  
            <!-- <MtPetFilterSelect
              v-model:selecting="petSelected"
              :pet-list="petList"
              label="対象ペット *"
              @update:model-value="changePet"
              class="q-mr-sm selection-field"
            /> -->
            <div class="q-mr-sm">
              <MtFormCheckBox
                v-model:checked="isCloseDetail"
                @update:checked="changeIsCloseDetail"
                label="明細閉じる"
              />
            </div>
            <q-btn
              unelevated
              outline
              class="q-mx-sm"
              @click="showServiceDetailList = !showServiceDetailList"
              >既存表示
            </q-btn>
          </div>
        </div>
      </div>
    </MtModalHeader>
    <q-card-section class="q-px-lg col">
      <div class="row full-height" style="gap: 16px">
        <div :class="showServiceDetailList ? 'col-2' : 'hidden'">
          <p class="text-bold q-ma-none">
            {{ petName(props?.id_pet) }} ({{
              getServiceDetailPerPetList?.length
            }})
          </p>
          <div
            v-if="getServiceDetailPerPetList.length"
            v-for="(service, date, key) in groupedServicesDetailsbyDate"
            class="flex column gap-2 caption1 regular q-mt-xs"
            :key="key"
          >
            <div class="caption1 regular divider">
              <span class="q-ml-sm">{{ date }}</span>
            </div>
            <div v-for="sd in service" class="flex" @click="copyCurrentSD(sd)">
              <div class="q-pl-sm cursor-pointer">
                - {{ sd.name_item_service }}
              </div>
              <q-btn
                class="text-grey-700"
                flat
                icon="content_copy"
                round
                size="8px"
              />
            </div>
          </div>
          <div v-else>
            <p class="q-ma-none">治療サービス未追加</p>
          </div>
        </div>
        <div class="col column">
          <q-tabs
            v-model="tab"
            align="justify"
            dense
            active-color="grey-900"
            class="text-grey-700 q-bb q-mb-sm col-auto"
            indicator-color="accent-700"
            @update:model-value="tabChanged"
          >
            <q-tab label="履歴" name="history" />
            <q-tab label="TOP30" name="top30" />
            <q-tab label="グループ検索" name="service_group" />
            <q-tab label="個別検索" name="keyword" />
          </q-tabs>

          <q-scroll-area v-if="tab === 'history'" class="full-width col">
            <template
              v-if="allHistoryServices"
              v-for="(service, date) in allHistoryServices"
              :key="date"
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
                :key="value.id_service_detail"
                class="flex no-wrap q-mb-xs"
              >
                <q-card
                  class="cursor-pointer q-card-IS full-width"
                  flat
                  @click="onHistoryCheck(value)"
                >
                  <q-card-section class="q-py-xs">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center">
                        <div class="body2 bold black">
                          {{ value.name_item_service }}
                        </div>
                        <div
                          v-if="value?.id_category1"
                          class="body2 text-grey-600 flex items-center q-ml-md"
                        >
                          {{ value.name_category1 }}
                          <q-icon name="arrow_right" />
                          {{ value.name_category2 }}
                        </div>
                      </div>
                      <div class="flex">
                        <q-chip
                          v-if="value.flg_prevention"
                          class="chip-blue"
                          text-color="white"
                        >
                          予防
                        </q-chip>
                        <q-chip
                          v-if="value.flg_pet_custody_control"
                          class="chip-red"
                          text-color="white"
                        >
                          預かり
                        </q-chip>
                        <q-chip
                          v-if="value.flg_surgery"
                          class="chip-purple"
                          text-color="white"
                        >
                          手術
                        </q-chip>
                        <q-chip
                          v-if="value.flg_anesthesia"
                          class="chip-green"
                          text-color="white"
                        >
                          麻酔
                        </q-chip>
                        <div @click.stop="openItemServiceModel(value)">
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
                      v-if="value?.memo_service"
                      class="text-body2 q-mt-sm text-grey-700"
                    >
                      {{ value?.memo_service }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </template>
          </q-scroll-area>

          <q-scroll-area v-else-if="tab === 'top30'" class="full-width col">
            <div class="q-mb-sm flex justify-end">
              <div
                v-if="
                  commonStore.getCommonTypeAnimalOptionList.find(
                    (v) => petSelected?.id_cm_animal == v.id_common
                  )
                "
              >
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="
                    commonStore.getCommonTypeAnimalOptionList.find(
                      (v) => petSelected?.id_cm_animal == v.id_common
                    )?.name_common
                  "
                  class="q-mr-xl"
                  @click="tabChanged('top30')"
                />
              </div>
            </div>
            <div
              v-for="top30 in orderAlltop30"
              :key="top30.key"
              class="flex no-wrap"
            >
              <q-card class="q-card-IS full-width cursor-pointer q-mb-md" flat>
                <q-card-section class="q-py-xs">
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0 ||
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex justify-between items-center q-pb-sm"
                  >
                    <div class="flex items-center no-wrap">
                      <span class="top30_round">{{ top30.val_top30 }}</span>
                      <div class="q-mr-lg">
                        <div class="q-mb-sm">
                          <span class="body1 bold black">
                            {{ top30.name_item_service }}
                          </span>                        
                          <span
                            v-if="top30?.name_category2"
                            class="caption1 text-grey-600 q-ml-md"
                          >
                            {{ top30.name_category1 }}
                            <q-icon name="arrow_right" />
                            {{ top30.name_category2 }}
                          </span>
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
  
                      <div @click.stop="openItemServiceModel(top30, 'top30')">
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
                    :class="
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex columns"
                  >
                    <div
                      v-for="(ISU, index) in top30?.item_service_unit_list"
                      :key="ISU.id_item_service_unit"
                      class="flex"
                      @click.stop="onTop30CheckISU(top30, ISU, top30, index)"
                    >
                      <div class="flex item-service-unit-box">
                        <q-icon class="q-pt-xs q-mr-sm" name="play_arrow" />
                        {{ ISU.name_service_item_unit }}
                      </div>
                    </div>
                  </div>
                  <div v-if="top30?.item_service_option_list?.length > 0">
                    <div class="caption1 text-grey-600 q-ml-md q-mt-sm q-mb-xs">
                      関連オプション
                    </div>
                    <div class="flex columns">
                      <div
                        v-for="ISO in top30?.item_service_option_list"
                        :key="ISO?.id_item_service_option"
                        class="flex"
                        @click.stop="
                          onTop30CheckISO(
                            top30?.item_service_option_list,
                            ISO,
                            top30
                          )
                        "
                      >
                        <div class="flex item-service-option-box">
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

          <q-scroll-area
            v-else-if="tab === 'service_group'"
            class="full-width col"
          >
            <div class="q-mb-sm flex justify-between">
              <span> キーワード </span>
              <div
                v-if="
                  commonStore.getCommonTypeAnimalOptionList.find(
                    (v) => petSelected?.id_cm_animal == v.id_common
                  )
                "
              >
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="
                    commonStore.getCommonTypeAnimalOptionList.find(
                      (v) => petSelected?.id_cm_animal == v.id_common
                    ).name_common
                  "
                  class="q-mr-xl"
                  @click="onSearchServiceGroup"
                />
              </div>
            </div>
            <div class="flex no-wrap q-mb-md">
              <MtInputForm
                type="text"
                dense
                v-model="searchServiceGroup"
                class="full-width q-mr-md"
                outlined
                autofocus
                @keydown.enter.prevent="onSearchServiceGroup"
              />
              <q-btn
                @click="onSearchServiceGroup"
                class="bg-grey-800 q-ml-md text-white"
                flat
                round
              >
                <q-icon name="search" />
              </q-btn>
            </div>
            <div
              v-for="service_group in allServiceGroup"
              :key="service_group.id_service_group"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-IS cursor-pointer full-width"
                flat
                @click.prevent="onServiceGroupCheck(service_group)"
              >
                <q-card-section>
                  <div class="flex justify-between items-center">
                    <div class="flex full-width">
                      <div class="service-group-title full-width">
                        {{ service_group.name_service_group }}
                      </div>
                      <div class="flex">
                        <div
                          v-for="items in service_group.service_group_item_list"
                          :key="items.id_service_group_item"
                          class="service-group-item q-mt-xs q-ml-md"
                        >
                          <div
                            class="flex body1 bold text-grey-800 q-mb-xs justify-between items-center"
                          >
                            {{
                              items.item_service_unit?.name_service_item_unit
                            }}
                            <div
                              @click.stop="
                                openItemServiceModel(
                                  items.item_service_unit?.id_item_service
                                )
                              "
                            >
                              <q-btn
                                class="text-grey-700"
                                flat
                                icon="quiz"
                                round
                                size="15px"
                              />
                            </div>
                          </div>
                          <div class="body2 text-grey-600 flex items-center">
                            {{
                              items.item_service_unit.id_item_service
                                ?.name_category1
                            }}
                            <q-icon name="arrow_right" />
                            {{
                              items.item_service_unit.id_item_service
                                ?.name_category2
                            }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>

          <q-scroll-area v-else-if="tab === 'keyword'" class="full-width col">
            <div class="q-mb-sm flex justify-between">
              <span> キーワード </span>
              <div
                v-if="
                  commonStore.getCommonTypeAnimalOptionList.find(
                    (v) => petSelected?.id_cm_animal == v.id_common
                  )
                "
              >
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="
                    commonStore.getCommonTypeAnimalOptionList.find(
                      (v) => petSelected?.id_cm_animal == v.id_common
                    ).name_common
                  "
                  class="q-mr-xl"
                  @click="onSearchKeyword()"
                />
              </div>
            </div>
            <div class="flex no-wrap q-mb-xs">
              <MtInputForm
                type="text"
                dense
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
                        allTop30 = []
                      }
                    "
                  >
                  </q-icon>
                  <q-icon
                    class="cursor-pointer"
                    name="feed"
                    @click="openSearchItemUnitListModal"
                  />
                </template>
              </MtInputForm>
              <q-btn
                @click="onSearchKeyword()"
                class="bg-grey-800 q-ml-md text-white"
                flat
                round
              >
                <q-icon name="search" />
              </q-btn>
            </div>
            <div class="flex items-center q-mb-md">
              <small class="text-grey-700 q-mr-sm">履歴 (10件)</small>
              <div class="flex row">
                <q-chip
                  v-for="(keyword, index) in getServiceDetailKeywords"
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
              v-for="top30 in allTop30"
              :key="top30.id_service_detail"
              class="flex no-wrap q-mb-md"
            >
              <q-card class="q-card-IS full-width cursor-pointer q-mb-md" flat>
                <q-card-section class="q-py-xs">
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0 ||
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex justify-between items-center q-pb-sm"
                  >
                    <div class="flex items-center">
                      <div class="q-mr-lg">
                        <div
                          v-if="!searchKeyword"
                          class="body1 bold black q-mb-sm"
                        >
                          {{ top30.name_item_service }}
                        </div>
                        <div
                          v-if="searchKeyword"
                          class="body1 bold black q-mb-sm"
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
  
                      <div @click.stop="openItemServiceModel(top30)">
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
                    :class="
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex columns"
                  >
                    <div
                      v-for="(ISU, index) in top30?.item_service_unit_list"
                      :key="ISU.id_item_service_unit"
                      class="flex"
                      @click.stop="onTop30CheckISU(top30, ISU, top30, index)"
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
                  <div v-if="top30?.item_service_option_list?.length > 0">
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
                            top30?.item_service_option_list,
                            ISO,
                            top30
                          )
                        "
                      >
                        <div class="flex item-service-option-box">
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
          <q-scroll-area class="full-width col">
            <div>
              <div
                v-if="selectedServices.length > 0"
                v-for="(item, key) in selectedServices"
                class="q-mb-md"
              >
                <div class="flex justify-between q-pa-sm bg-light-blush">
                  <div>
                    <div
                      class="title2 text-grey-900 bold flex items-center q-pl-sm"
                    >
                      {{
                        item.flg_booking && [2, 3].includes(item.type_booking)
                          ? '[ 予約 ] '
                          : ''
                      }}
                      {{ item.name ? item.name : item.name_service_item_unit }}

                      <div
                        @click.stop="openItemServiceModel(item.item_service)"
                      >
                        <q-btn
                          class="text-grey-800 q-mx-sm"
                          flat
                          icon="quiz"
                          round
                          size="12px"
                        />
                      </div>
                      <div class="caption1 regular text-grey-700 flex items-center">
                        {{ item.name_category1 }}
                        <q-icon name="arrow_right" />
                        {{ item.name_category2 }}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div v-if="showButton(item.id_category1)">
                      <q-btn outline @click="openSearchIdexxTestList(key)">
                        IDEXX検査項目
                      </q-btn>
                    </div>
                    <div class="flex">
                      <q-chip
                        v-if="getItem(item.item_service)?.flg_prevention"
                        class="chip-blue"
                        text-color="white"
                      >
                        予防
                      </q-chip>
                      <q-chip
                        v-if="
                          getItem(item.item_service)?.flg_pet_custody_control
                        "
                        class="chip-red"
                        text-color="white"
                      >
                        預かり
                      </q-chip>
                      <q-chip
                        v-if="getItem(item.item_service)?.flg_surgery"
                        class="chip-purple"
                        text-color="white"
                      >
                        手術
                      </q-chip>
                      <q-chip
                        v-if="getItem(item.item_service)?.flg_anesthesia"
                        class="chip-green"
                        text-color="white"
                      >
                        麻酔
                      </q-chip>
                    </div>
                  </div>
                  <div>
                    <q-btn
                      unelevated
                      outline
                      size="11px"
                      color="primary"
                      @click="item.show = !item.show"
                      >{{ item.show ? '閉じる' : '開く' }}
                    </q-btn>
                  </div>
                </div>
                <div v-show="item.show">
                  <template v-if="item?.item_service.flg_plus_item">
                    <div class="row q-col-gutter-md q-mt-xs">
                      <div class="col-6">
                        <MtInputForm
                          v-model="item.memo_service"
                          autogrow
                          label="服用メモ"
                          type="text"
                        >
                          <template #append> </template>
                        </MtInputForm>
                      </div>
                      <div class="col-6">
                        <MtInputForm
                          v-model="item.memo_etc1"
                          autogrow
                          label="注意事項"
                          type="text"
                        >
                          <template #append> </template>
                        </MtInputForm>
                      </div>
                    </div>
                    <div
                      class="row q-col-gutter-md q-mb-md justify-between q-mt-sm"
                    >
                      <div class="col-auto">
                        <MtFormCheckBox
                          v-model:checked="item.flg_non_charge"
                          label="会計対象外"
                        />
                      </div>
                      <div class="col-auto">
                        <MtInputForm
                          v-model="item.flg_apply_insurance"
                          :items="[{ label: '保険適用' }]"
                          type="checkbox"
                        />
                      </div>
                      <div class="col-auto">
                        <MtFormCheckBox
                          v-model:checked="item.flg_next_cart"
                          label="次回の会計"
                        />
                      </div>
                      <div class="col-auto">
                        <MtFormCheckBox
                          v-model:checked="item.flg_takeout"
                          label="持ち帰り"
                        />
                      </div>
                      <div class="col-auto">
                        <q-btn flat unelevated @click="removeItem(key)">
                          <q-icon name="delete"></q-icon>
                          削除
                        </q-btn>
                      </div>
                    </div>
                    <div
                      class="row q-col-gutter-md q-my-sm"
                      style="flex-direction: column"
                    >
                      <div
                        v-for="pISU in item.selectedISU"
                        :key="pISU.value"
                        class="row border-bottom"
                      >
                        <div class="col-6">
                          <MtFormCheckBox
                            v-model:checked="pISU.checked"
                            :label="pISU.label"
                            class="q-mr-md"
                            @update:checked="
                              () => {
                                pISU.quantity = 1
                              }
                            "
                          />
                        </div>
                        <div class="col-3">
                          <MtFormInputNumber
                            v-if="pISU.checked"
                            v-model:value="pISU.quantity"
                            class="q-mr-md"
                            label="数量"
                            mode="dosage"
                          />
                        </div>
                        <div class="col-3 flex items-end justify-end">
                          <div v-if="pISU.checked" class="caption1 regular">
                            合計金額：
                            {{ pISU.unitPrice * (item.quantity ?? 1) }} 円
                          </div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <div v-else>
                    <div
                      v-if="isShowIdexxName(item.list_idexx_test)"
                      class="q-pa-sm"
                    >
                      IDEXX臨床検査 : {{ showIdexxName(item.list_idexx_test) }}
                    </div>
                    <div class="row q-col-gutter-md q-mt-xs">
                      <div class="col">
                        <MtFormInputDate
                          v-model:date="item.datetime_service_start"
                          label="実施日"
                          required
                          @update:date="
                            item.datetime_service_end =
                              item.datetime_service_start
                          "
                        />
                      </div>
                      <div v-if="item.showTimeOption" class="col">
                        <MtFormPullDown
                          v-model="item.time_service_start"
                          :options="timeHourMinute"
                          label="時：分"
                          type="selection"
                        />
                      </div>
                      <div class="col">
                        <MtFormInputDate
                          v-model:date="item.datetime_service_end"
                          :rules="[aahValidations.validationRequired]"
                          label="終了日"
                          required
                          @update:date="
                            () => {
                              if (
                                item.datetime_service_start >
                                item.datetime_service_end
                              ) {
                                item.datetime_service_start =
                                  item.datetime_service_end
                              }
                            }
                          "
                        />
                      </div>
                      <div v-if="item.showTimeOption" class="col">
                        <MtFormPullDown
                          v-model="item.time_service_end"
                          :options="timeHourMinute"
                          label="時：分"
                          type="selection"
                        />
                      </div>
                      <div class="col">
                        <MtFormInputNumber
                          v-model:value="item.quantity"
                          mode="dosage"
                          label="数量"
                          input-class="price-title"
                        />
                      </div>
                      <div class="col">
                        <MtFormInputNumber2
                          v-model:value="item.unit_price"
                          label="販売価格（円）"
                          input-class="price-title"
                          @update:value="()=>{
                            item.flg_discount = item.base_unit_price > item.unit_price
                            if(item.item_service_unit.flg_tax_included){
                              if(item.item_service_unit.type_tax == 1){
                                item.base_calculated_tax_exculsive_price = Math.round(item.unit_price  / 1.1)
                              }
                              else if(item.item_service_unit.type_tax == 2){
                                item.base_calculated_tax_exculsive_price = Math.round(item.unit_price  / 1.08)
                              }
                            }
                          }"
                        />
                        <span v-if="item.item_service_unit.flg_tax_included" class="text-danger">
                          上記表示は内税価格 税別単価: {{ item.base_calculated_tax_exculsive_price }} 円
                        </span>
                        <mt-form-check-box
                          v-model:checked="item.flg_discount"
                          label="割引"
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md q-mt-xs">
                      <div v-if="!item.flg_no_illness_history" class="col-6">
                        <MtFormMultipleSelection
                          v-model="item.id_pet_illness_history"
                          :option-label="
                            (v) =>
                              v.name_disease
                                ? v.name_disease
                                : v.name_disease_free
                          "
                          :options="getIllnessHistorys"
                          label="現疾患・既往歴"
                          option-value="id_pet_illness_history"
                          :rules="[aahValidations.validationRequired]"
                          show-quick-illness-history
                        />
                      </div>

                      <div class="col-3">
                        <InputEmployeeOptGroup
                          v-model:selected="item.id_employee_doctor"
                          label="担当医"
                          show-select-default-employee
                          type-occupation="doctor"
                          @update:select-default-employee="
                            selectDefaultEmployee('id_employee_doctor', key)
                          "
                        />
                      </div>
                      <div class="col-3">
                        <InputEmployeeOptGroup
                          v-model:selected="item.id_employee_staff"
                          label="主担当者"
                          show-select-default-employee
                          type-occupation="staff"
                          @update:select-default-employee="
                            selectDefaultEmployee('id_employee_staff', key)
                          "
                        />
                      </div>
                    </div>
                    <div class="row q-col-gutter-md q-mt-xs">
                      <div class="col-6">
                        <MtInputForm
                          v-model="item.memo_service"
                          autogrow
                          label="詳細・メモ"
                          type="text"
                        >
                          <template #append>
                            <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(31, key)" />
                          </template>
                        </MtInputForm>
                      </div>
  
                    </div>
                    <div class="row q-col-gutter-md q-mt-xs">
                      <div class="col-auto">
                        <MtFormCheckBox
                          v-model:checked="item.flg_apply_insurance"
                          label="保険適用"
                        />
                      </div>
                      <div class="col-auto ">
                        <MtInputForm
                          v-model="item.flg_non_charge"
                          :items="[{ label: '会計対象外' }]"
                          type="checkbox"
                        />
                      </div>
                      <div class="col-auto">
                        <MtInputForm
                          v-model="item.flg_pet_custody_control"
                          :items="[{ label: '預り管理' }]"
                          type="checkbox"
                        />
                      </div>                      
                      <div class="col-auto">
                        <MtInputForm
                          v-model="item.showTimeOption"
                          :items="[{ label: '実施時刻' }]"
                          type="checkbox"
                        />
                      </div>
                      <div v-if="item?.flg_booking" class="col-3">
                        <MtFormPullDown
                          v-model:selected="item.type_booking"
                          :options="typeBooking"
                          label="予約区分（カレンダー表示）"
                          type="selection"
                        />
                      </div>
                      <div class="col-auto">
                        <MtFormCheckBox
                          v-model:checked="item.flg_next_cart"
                          label="次回の会計"
                        />
                      </div>
                      <div class="col-auto">
                        <MtFormCheckBox
                          v-model:checked="item.flg_takeout"
                          label="持ち帰り"
                        />
                      </div>
                      <div class="col-auto">
                        <MtInputForm
                          v-model="item.flg_schedule"
                          :items="[{ label: '次回予定' }]"
                          type="checkbox"
                          @update:model-value="
                            changeFlgSchedule(item.flg_schedule, key, item)
                          "
                        />
                      </div>
                      <!-- T BOOKING -->
                      <div class="col-3" v-if="bookingRequestDetails[key]?.tBookingFlag">
                        <MtFormInputDate
                          v-model:date="
                            bookingRequestDetails[key].date_booking_confirmed
                          "
                          datetime
                          label="次回予定日"
                        />
                      </div>
                      <!--Facilitate a user to input next schedule date-->
                      <div class="col-auto" v-if="showDateSchedule(item)">
                        <q-btn flat @click="openEventAvailable(item, key)">
                          <q-icon name="event_available" size="xs" />
                        </q-btn>
                      </div>
                      <div class="col-auto" v-if="bookingRequestDetails[key]?.tBookingFlag">
                        <MtInputForm
                          v-model="bookingRequestDetails[key].tBookingFlgTime"
                          :items="[{ label: '次回予定時刻' }]"
                          type="checkbox"
                        />
                      </div>
                      <div
                        v-if="bookingRequestDetails[key].tBookingFlgTime"
                        class="col-3"
                      >
                        <MtFormPullDown
                          v-model="
                            bookingRequestDetails[key].time_booking_confirmed
                          "
                          :options="timeHourMinute"
                          label="時：分"
                          type="selection"
                        />
                      </div>
                    </div>
                  </div>
                  <!--If this is CO5 狂犬病猶予 Service, display below -->
                  <div
                    v-if="item.code_category2 == 'CO5_6'"
                    class="row q-col-gutter-md q-mt-xs"
                  >
                    <div class="col-3">
                      <MtFormInputDate
                        v-model:date="item.rabies.date_exempt_start"
                        :rules="[aahValidations.validationRequired]"
                        label="猶予開始日"
                      />
                    </div>
                    <div class="col-3">
                      <MtFormInputDate
                        v-model:date="item.rabies.date_exempt_end"
                        :rules="[aahValidations.validationRequired]"
                        label="猶予終了日"
                      />
                    </div>
                    <div class="col-6">
                      <MtInputForm
                        v-model="item.rabies.memo_exemption_rabies"
                        :rules="[aahValidations.validationRequired]"
                        autogrow
                        label="猶予理由"
                        type="text"
                      />
                    </div>
                  </div>
                  <div class="row justify-end">
                    <div class="col-auto ">
                        <q-btn
                          color="negative"
                          flat
                          unelevated
                          @click="removeItem(key)"
                        >
                          <q-icon name="delete"></q-icon>
                          削除
                        </q-btn>
                      </div>
                  </div>
                </div>
                <hr v-show="item.show" class="light q-mb-md" />
              </div>
              <div class="q-ml-md" v-else>
                左から治療サービス明細を追加してください。
              </div>
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
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          :loading="loading"
          :disable="loading"
          @click="submit"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="詳細・メモ"
    :options="memoTemplates"
    :data="selectedServices"
    :single-option="true"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>

<style lang="scss" scoped>
.side-tab-view {
  height: calc(100dvh - 210px);
}

.item-service-unit-box {
  display: flex;
  align-items: center;
  background-color: rgba(255, 236, 248, 0.7);
  color: $grey-800;
  padding: 8px 10px;
  margin: 5px 8px !important;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background-color: rgba(236, 213, 228, 0.7);
  }
}

.item-service-option-box {
  display: flex;
  align-items: center;
  color: $grey-700;
  padding: 4px 8px;
  margin: 3px 8px !important;
  border-radius: 4px;
  font-size: 13px;

  &:hover {
    background-color: rgba(196, 196, 196, 0.7);
    color: $grey-900;
  }
}

.t-border {
  border-bottom: 1px solid #e3e3e3;
}

.b-border {
  border-bottom: 1px solid #e3e3e3;
}

.service-group-title {
  background-color: #7b6272;
  color: white !important;
  border-radius: 4px;
  padding: 4px 8px;
  letter-spacing: 2px;
}

.service-group-item {
  margin: 12px 0px 0px 15px !important;
  padding: 8px 12px;
  background-color: $grey-200 !important;
  border-radius: 10px;
}

.divider {
  padding: 5px 0 8px;
  background: $grey-100;
}

.phone-icon::after {
  content: 'phone / smartphone';
  font-family: 'Material Icons';
  top: 65% !important;
}
</style>
