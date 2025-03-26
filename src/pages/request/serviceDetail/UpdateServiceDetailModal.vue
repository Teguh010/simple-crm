<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Notify } from 'quasar'

// Utilities
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import { event_bus } from '@/utils/eventBus'
import { setPageTitle } from '@/utils/pageTitleHelper'
import {
  aahUtilsGetEmployeeName,
  aahUtilsGetUpdatedEmployeeName,
  checkDateRange,
  copyText,
  dateFormat,
  getDateByFormat,
  getDateToday
} from '@/utils/aahUtils'
import { timeHourMinute, typeBooking } from '@/utils/enum'
import { CATEGORY_ITEM_SERVICE_DATE, CATEGORY_ITEM_SERVICE_PDF_PRINTING } from '@/utils/const/constServiceDetail'
import { serviceDetailAttributes } from '@/utils/pdfAttributes/serviceDetails'
import dayjs from '@/boot/dayjs'
import selectOptions from '@/utils/selectOptions'
import { timeHourMinuteInterval_5 } from '@/utils/enumDateTime'

// Components
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import ShowLabResultComponent from '@/components/lab/ShowLabResultComponent.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import CreateLabResultModal from '@/components/lab/CreateLabResultModal.vue'

// Stores
import useServiceDetailStore from '@/stores/service-details'
import useCategoryStore from '@/stores/categories'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCustomerStore from '@/stores/customers'
import useTask from '@/stores/task'
import useClinicStore from '@/stores/clinics'
import useRequestStore from '@/stores/requests'
import useEmployeeStore from '@/stores/employees'
import useMessageStore from '@/stores/message-clinic'
import useCommonStore from '@/stores/common'
import usePrintStore from '@/stores/prints'
import usePetStore from '@/stores/pets'
import useCliCommonStore from '@/stores/cli-common'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useMemoCarteStore from '@/stores/memo-cartes'
import useTextTemplateStore from '@/stores/text-template'

// Types
import { Category, RabiesType, TextTemplateType } from '@/types/types'

// Lazy-loaded Components
const UpdateTaskModal = defineAsyncComponent(
  () => import('@/pages/task/UpdateTaskModal.vue')
)
const UpdateMessageThreadModal = defineAsyncComponent(
  () => import('@/pages/message/UpdateMessageThreadModal.vue')
)
const ConfirmCancelServiceDetailModal = defineAsyncComponent(
  () => import('./ConfirmCancelServiceDetailModal.vue')
)
const DateScheduleCreateServiceDetailModal = defineAsyncComponent(
  () => import('./DateScheduleCreateServiceDetailModal.vue')
)
const SearchIdexxTestListModal = defineAsyncComponent(
  () => import('./SearchIdexxTestListModal.vue')
)
const ViewItemServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/master/itemService/ViewItemServiceDetailModal.vue')
)

const UpdatePrintCanvasModal = defineAsyncComponent(
  () => import(`@/pages/master/print/UpdatePrintCanvasModal.vue`)
)
const GetPdfLabResultOne = defineAsyncComponent(
  () => import(`@/pages/labResult/GetPdfLabResultOne.vue`)
)
const ViewLabResultModal = defineAsyncComponent(
  () => import(`@/components/lab/ViewLabResultModal.vue`)
)

const props = defineProps({
  refetchAll: { type: Boolean, default: false },
  updatedFlg: { type: Object, default: { value: false } },
  request: { type: Object },
  callBackFromCalender: { type: Function },
  fromPage: String,
  pageTitle: String,
  requestObj: Object,
  otherServiceDetailList: Array<Object>
})

const emits = defineEmits(['close'])
const router = useRouter()
const templateStore = useTextTemplateStore()
const requestStore = useRequestStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const serviceDetailStore = useServiceDetailStore()
const customerStore = useCustomerStore()
const cliCommonStore = useCliCommonStore()
const categoryStore = useCategoryStore()
const employeeStore = useEmployeeStore()
const illnessHistoryStore = useIllnessHistoryStore()
const commonStore = useCommonStore()
const printStore = usePrintStore()
const petStore = usePetStore()
const { getServiceDetail, getServiceDetailDateSchedule } =
  storeToRefs(serviceDetailStore)
const { getCommonTypePrintSize } = storeToRefs(commonStore)
const { getPrint } = storeToRefs(printStore)
const { getRequest } = storeToRefs(requestStore)
const taskStore = useTask()
const messageStore = useMessageStore()
const clinicStore = useClinicStore()

const closeModal = () => {
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}
const illnessHistoryList = ref<any>([])
const selectedPet = ref('')
const petSelected = ref()
const serviceEffortList = ref([])

const data = ref({
  memo_service: null,
  number_service_detail: null,
  datetime_service_start: null,
  datetime_service_end: null,
  quantity: '1' as string | number,
  id_pet_illness_history: null,
  id_employee_doctor: '',
  id_employee_staff: '',
  flg_non_charge: null,
  flg_pet_custody_control: false,
  flg_complete: false,
  id_pet: null,
  flg_cancel: false,
  memo_cancel: '',
  show_time_ui: false,
  date_schedule: null,
  flg_next_cart: false,
  flg_schedule: false,
  id_clinic: '',
  selected_idexx: [],
  rabies: {} as RabiesType,
  flg_apply_insurance: false,
  flg_takeout: false,
  item_service: null,
  base_calculated_tax_exculsive_price: null,
  item_service_unit: null
})
const tBookingData = ref({
  date_booking_confirmed: getDateToday(),
  time_booking_confirmed: null,
  days_repeat: null,
  flg_continue: true,
  flg_exempt: false,
  flg_end: false,
  type_day: 1
})

const pdfArrayBuffer = ref(null)
const dataPrint = ref({
  name_print: '',
  id_clinic: '',
  type_print: '',
  type_print_size: 1,
  flg_landscape: false,
  pdf_path: '',
  item1: '',
  xy_hw1: '',
  type_print_output1: 1,
  font_size1: 0,
  item2: '',
  xy_hw2: '',
  type_print_output2: 1,
  font_size2: 0,
  item3: '',
  xy_hw3: '',
  type_print_output3: 1,
  font_size3: 0,
  item4: '',
  xy_hw4: '',
  type_print_output4: 1,
  font_size4: 0,
  item5: '',
  xy_hw5: '',
  type_print_output5: 1,
  font_size5: 0,
  item6: '',
  xy_hw6: '',
  type_print_output6: 1,
  font_size6: 0,
  item7: '',
  xy_hw7: '',
  type_print_output7: 1,
  font_size7: 0,
  item8: '',
  xy_hw8: '',
  type_print_output8: 1,
  font_size8: 0,
  item9: '',
  xy_hw9: '',
  type_print_output9: 1,
  font_size9: 0,
  item10: '',
  xy_hw10: '',
  type_print_output10: 1,
  font_size10: 0
})
const service_HH_MM = ref('00:00')
const show_start_time_HH_MM = ref('00:00')
const show_end_time_HH_MM = ref('00:00')
const modalHeight = ref(window.innerHeight - 100)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const tBookingFlag = ref(false)
const tBookingFlgTime = ref(false)
const tBookingFlgRepeat = ref(false)
const oldFlgSchedule = ref(false)
const newFlgSchedule = ref(false)
const now = dayjs()
const serviceStartTime = now.floor('minute', 5).format('HH:mm')
const serviceEndTime = now.add(1, 'hour').floor('minute', 5).format('HH:mm')

const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])

const menuOptions = [
  {
    title: 'URLコピー',
    name: 'URL copy',
    isChanged: false,
    attr: { class: null, clickable: true }
  },
  {
    title: 'リクエスト検索',
    name: 'open_request_page',
    isChanged: false,
    attr: { class: null, clickable: true }
  },
  {
    title: 'スレッド作成',
    name: 'create_thread',
    isChanged: false,
    attr: { class: null, clickable: true }
  },
  {
    title: 'タスク作成',
    name: 'create_task',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: 'キャンセル',
    name: 'cancel',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
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
const openMenu = async () => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'open_request_page') {
      const route = router.resolve({
        name: 'RequestDetail',
        params: { id: getServiceDetail.value?.id_request }
      })
      window.open(route.href, '_blank')
    } else if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            serviceDetailStore
              .destroyServiceDetail(
                getRequest.value?.id,
                getServiceDetail.value?.id_service_detail
              )
              .then(() => {
                serviceDetailStore.fetchServiceDetails(
                  getServiceDetail.value?.id_request,
                  { id_customer: getRequest.value?.id_customer }
                ),
                  emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    } else if (selectedOption.name == 'cancel') {
      await mtUtils.smallPopup(ConfirmCancelServiceDetailModal, {
        id_customer: getRequest.value?.id_customer,
        id_pet: getRequest.value?.id_pet
      })
      closeModal()
    } else if (selectedOption.name == 'create_task') {
      if (data.value.flg_complete === false) {
        createTaskModal()
      } else {
        mtUtils.autoCloseAlert(aahMessages.task_is_completed)
      }
    } else if (selectedOption.name == 'create_thread') {
      const threadData = {
        memo_goal: '',
        id_pet: data.value?.id_pet,
        id_customer: data.value.id_customer,
        linkCategory: 2,
        id_link1: data.value.id_service_detail,
        number_link1: data.value.number_service_detail
      }
      localStorage.setItem('pageAction', 'createThread')
      localStorage.setItem('createThread', JSON.stringify(threadData))
      await mtUtils.popup(UpdateMessageThreadModal, {})
      const recentThread = messageStore.getRecentThreadMessage
      if (recentThread && Object.keys(recentThread).length > 0) {
        messageStore.setRecentMessageThread(null)
        const confirmation = await mtUtils.confirm(
          '院内スレッドを作成しました。スレッドを開きますか？',
          '確認',
          'スレッドを開く'
        )
        if (confirmation) {
          const route = router.resolve({ name: 'MessageClinic' })?.href
          window.open(route, '_blank')
        }
      }
    } else if (selectedOption.name == 'URL copy') {
      try {
        let url = window.location.href
        if (url.includes('?')) {
          url =
            url.split('?')[0] +
            '?sd=' +
            getServiceDetail.value?.id_service_detail
        } else {
          url = url + '?sd=' + getServiceDetail.value?.id_service_detail
        }
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました!')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました')
      }
    }
  }
}
const showIdexxName = (value: Array<string>) => {
  return value
    .map((v) => {
      const name = commonStore.getCommonIdexxSearchList.find(
        (c) => c.code_func2 == v
      )?.name_common
      return name
    })
    .join(', ')
}
const openEventAvailable = async () => {
  await mtUtils.smallPopup(DateScheduleCreateServiceDetailModal, {
    datetime: data.value.datetime_service_end
  })
  if (getServiceDetailDateSchedule.value) {
    data.value.date_schedule = getServiceDetailDateSchedule.value
    serviceDetailStore.setServiceDetailDateSchedule(null)
  }
}
const createTaskModal = async () => {
  taskStore.selectTask(null)
  const copiedTaskData = true
  const data = {
    id_customer: getRequest.value.id_customer,
    id_pet: getRequest.value.id_pet,
    type_link1: 2,
    number_link1: getServiceDetail.value?.number_service_detail,
    id_employee_staff: getRequest.value.id_employee_staff,
    memo_task_todo: getServiceDetail.value?.memo_service,
    id_employee_request: JSON.parse(localStorage.getItem('id_employee'))
  }
  await mtUtils.popup(UpdateTaskModal, { data, copiedTaskData }, true)
}
const getCategory = (value: number) =>
  categoryStore.getAllCategories.find((v: number) => v.value == value)

const check_and_update_booking = async (oldServiceDetail) => {
  const updatedServiceDetail = serviceDetailStore.recentServiceDetail
  const booking = oldServiceDetail.booking
  if (
    oldServiceDetail.flg_schedule == false &&
    updatedServiceDetail.flg_schedule == true
  ) {
    const datetimeBookingConfirmed =
      getDateByFormat(
        new Date(tBookingData.value.date_booking_confirmed),
        'YYYY/MM/DD'
      ) +
      ' ' +
      (tBookingData.value.time_booking_confirmed ?? '00:00') +
      ':00'
    const bookingJson = {
      id_clinic: updatedServiceDetail.id_clinic,
      id_customer: updatedServiceDetail.id_customer,
      id_pet: updatedServiceDetail.id_pet,
      id_request: updatedServiceDetail.id_request,
      id_service_detail: updatedServiceDetail.id_service_detail,
      days_repeat: tBookingData.value.days_repeat,
      flg_continue: tBookingData.value.flg_continue,
      flg_exempt: tBookingData.value.flg_exempt,
      flg_end: tBookingData.value.flg_end,
      type_booking_source: 2,
      datetime_booking_confirmed: datetimeBookingConfirmed
    }
    const resp = await serviceDetailStore.submitServiceDetailBooking(
      updatedServiceDetail.id_request,
      updatedServiceDetail.id_service_detail,
      bookingJson
    )
  } else if (
    oldServiceDetail.flg_schedule == true &&
    updatedServiceDetail.flg_schedule == false
  ) {
    if (booking && booking.id_booking) {
      const resp = await serviceDetailStore.destroyServiceDetailBooking(
        updatedServiceDetail.id_request,
        updatedServiceDetail.id_service_detail,
        booking.id_booking
      )
    }
  } else if (
    oldServiceDetail.flg_schedule == true &&
    updatedServiceDetail.flg_schedule == true &&
    booking &&
    booking.id_booking
  ) {
    const datetimeBookingConfirmed =
      getDateByFormat(
        new Date(tBookingData.value.date_booking_confirmed),
        'YYYY/MM/DD'
      ) +
      ' ' +
      (tBookingData.value.time_booking_confirmed ?? '00:00') +
      ':00'
    tBookingData.value.datetime_booking_confirmed = datetimeBookingConfirmed
    if (tBookingFlgRepeat.value == false) {
      tBookingData.value.days_repeat = null
      tBookingData.value.flg_continue = false
      tBookingData.value.flg_exempt = false
      tBookingData.value.flg_end = false
    }
    const resp = await serviceDetailStore.updateServiceDetailBooking(
      updatedServiceDetail.id_request,
      updatedServiceDetail.id_service_detail,
      booking.id_booking,
      tBookingData.value
    )
  }
}

const submit = async () => {
  if (props.requestObj && props.requestObj.flg_complete) {
    await mtUtils.autoCloseAlert(
      '会計が完了している為、\n会計項目をリクエストに追加することは出来ません。'
    )
    return
  }

  // IF THE DATA IS AN EFFORT ITEM
  if (data.value.type_detail == '3' || data.value?.type_detail == '2') {
    const promiseList = serviceEffortList.value.map(async (effort_item) => {
      const API_URL = `/request/${effort_item.id_request}/service_detail/${effort_item.id_service_detail}`
      await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        API_URL,
        {
          ...effort_item,
          id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value
        },
        true
      )
    })
    await mtUtils.promiseAllWithLoader(promiseList)
    event_bus.emit('reloadRight', true)
    event_bus.emit('reloadLeft')
    await mtUtils.autoCloseAlert('明細を更新しました。')
    closeModal()
    return
  }
  // DONE EFFORT ITEM LOGIC

  if (
    dayjs(data.value?.rabies?.date_exempt_start).isAfter(
      dayjs(data.value?.rabies?.date_exempt_end)
    )
  ) {
    await mtUtils.autoCloseAlert('日付を確認してください')
    return
  }

  if (
    data.value?.rabies?.date_exempt_start &&
    data.value?.rabies?.date_exempt_end
  ) {
    data.value.datetime_service_start = data.value.rabies.date_exempt_start
    data.value.datetime_service_end = data.value.rabies.date_exempt_end
  }

  if (
    !checkDateRange([
      {
        start_date: data.value.datetime_service_start,
        end_date: data.value.datetime_service_end
      }
    ])
  )
    return false
  data.value.id_pet = petSelected.value.id_pet
  // if(data.value.type_booking != 1){
  //   data.value.datetime_service_start = getDateByFormat(data.value.datetime_service_start,"YYYY/MM/DD") + " " + service_HH_MM.value + ":00"
  // }
  data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  data.value.datetime_service_start =
    getDateByFormat(data.value.datetime_service_start, 'YYYY/MM/DD') +
    ' ' +
    (show_start_time_HH_MM.value ? show_start_time_HH_MM.value : '00:00') +
    ':00'
  data.value.datetime_service_end =
    getDateByFormat(data.value.datetime_service_end, 'YYYY/MM/DD') +
    ' ' +
    (show_end_time_HH_MM.value ? show_end_time_HH_MM.value : '00:00') +
    ':00'
  const od = { ...getServiceDetail.value }
  serviceDetailStore
    .updateServiceDetail(
      getServiceDetail.value?.id_request,
      getServiceDetail.value?.id_service_detail,
      {
        ...data.value,
        id_pet: petSelected.value
      }
    )
    .then(async () => {
      await check_and_update_booking(od)

      // if (data.value.selected_idexx?.length > 0) {
      //   const createIdexxData = {
      //     id_service_detail: getServiceDetail.value?.id_service_detail,
      //     status: "CREATED",
      //     editable: true,
      //     test: data.value.selected_idexx,
      //     ivls: [{
      //       serialNumber: cliCommonStore.getCliCommonIVLS?.[0]?.code_func1 || '',
      //       displayName: null
      //     }]
      //   }
      //   const submit_idexx = await serviceDetailStore.submitServiceDetailIdexx(createIdexxData)
      //   if (submit_idexx?.uiURL) window.open(submit_idexx.uiURL, '_blank')
      // }

      if (getServiceDetail.value?.type_prevention) {
        const getSelectedPet = customerStore.getCustomer?.pets.find(
          (pet: any) => getServiceDetail.value.id_pet == pet.id_pet
        )
        await petStore.updatePet(
          getServiceDetail.value?.id_pet,
          getServiceDetail.value?.id_customer,
          {
            id_customer: getServiceDetail.value?.id_customer,
            id_pet: getServiceDetail.value?.id_pet,
            name_pet: getSelectedPet?.name_pet,
            ['date_last_type_prev_' + getServiceDetail.value.type_prevention]:
              dateFormat(data.value.datetime_service_end)
          }
        )
      }

      if (props.refetchAll)
        await serviceDetailStore.fetchAllServiceDetails({
          id_pet: getServiceDetail.value?.id_pet,
          id_customer: getServiceDetail.value?.id_customer
        })
      else
        await serviceDetailStore.fetchServiceDetails(
          getServiceDetail.value?.id_request,
          { id_pet: getServiceDetail.value?.id_pet }
        )
      props.updatedFlg.value = true
      if (props.callBackFromCalender) {
        props.callBackFromCalender()
      }

      event_bus.emit('reloadTop', true)
      closeModal()
      mtUtils.autoCloseAlert(aahMessages.success)
    })
}
const getEmployeeLabel = (empId) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}
const getNewEmployeeLabel = (empId) => {
  return aahUtilsGetUpdatedEmployeeName(employeeStore.getEmployees, empId)
}
const changeQuantity = (val: any) => {
  data.value.quantity = val
}

const roundQuantity = (quantity: any) => {
  let num = parseFloat(quantity)
  if (Number.isInteger(num)) {
    return Math.round(num)
  } else {
    return Math.round((num + Number.EPSILON) * 10) / 10
  }
}

const refresh = async () => {
  await mtUtils.promiseAllWithLoader([
    cliCommonStore.fetchPreparationCliCommonList(
      { code_cli_common: [15, 16, 18] },
      true
    ),
    requestStore.fetchRequest(getServiceDetail?.value?.id_request),
    await customerStore.selectCustomer(getServiceDetail.value.id_customer),
    illnessHistoryStore.fetchIllnessHistorys({
      id_pet: getServiceDetail.value.id_pet,
      id_customer: getServiceDetail.value.id_customer
    }),
    itemServiceUnitStore.fetchItemServiceUnit(
      getServiceDetail.value.id_item_service_unit
    )
  ])

  data.value = JSON.parse(JSON.stringify(getServiceDetail.value))
  data.value.quantity = roundQuantity(data.value.quantity ?? 1)

  data.value.item_service = itemServiceUnitStore.getItemServiceUnit.item_service
  data.value.item_service_unit = itemServiceUnitStore.getItemServiceUnit


  if (data.value.item_service_unit.flg_tax_included) {
    if (data.value.item_service_unit.type_tax == 1) {
      data.value.base_calculated_tax_exculsive_price = Math.round(data.value.unit_price / 1.1)
    } else if (data.value.item_service_unit.type_tax == 2) {
      data.value.base_calculated_tax_exculsive_price = Math.round(data.value.unit_price / 1.08)
    }
  }

  const findPet = customerStore.getCustomer?.pets?.find(
    (pet: any) => pet.id_pet == data.value.id_pet
  )

  if (findPet) {
    selectedPet.value = `${findPet?.name_pet}:${findPet?.id_pet}`
  }
  petSelected.value = customerStore.getCustomer?.pets.find(
    (pet: any) => getServiceDetail.value.id_pet == pet.id_pet
  )?.id_pet

  illnessHistoryList.value = illnessHistoryStore.getIllnessHistorys.map(
    (obj: any) => ({
      value: obj.id_pet_illness_history,
      label: obj.name_disease ? obj.name_disease : obj.name_disease_free
    })
  )

  if (
    !data.value.id_pet_illness_history ||
    (Array.isArray(data.value.id_pet_illness_history) &&
      data.value.id_pet_illness_history.length === 0)
  ) {
    const defaultIllness = illnessHistoryList.value.find(
      (illness) => illness.label === '不明/予約経由'
    )

    if (defaultIllness) {
      // Karena ini multiple selection, kita set sebagai array
      data.value.id_pet_illness_history = [defaultIllness.value]
    }
  }

  if (data.value.lab_order) {
    data.value.selected_idexx = data.value.lab_order?.list_test?.split(', ')
  }

  return
}

const onUpdateStartDate = (value: string) => {
  data.value.datetime_service_end = value
}

onMounted(async () => {
  if (props.otherServiceDetailList?.length > 0) {
    props.otherServiceDetailList.forEach((v) => {
      serviceEffortList.value.push({
        ...v,
        checked: true
      })
    })
  }

  await refresh()
  init()

  // set page title
  if (props.pageTitle) {
    setPageTitle(props.pageTitle)
  }

  setBookingIfUpdateCase()
})
const setBookingIfUpdateCase = () => {
  const currentServiceDetail = getServiceDetail.value
  if (currentServiceDetail.flg_schedule) {
    tBookingFlag.value = true
    tBookingFlgTime.value = true
    if (currentServiceDetail.booking) {
      tBookingData.value = currentServiceDetail.booking
    }
    tBookingFlgRepeat.value =
      typeof tBookingData.value.days_repeat == 'number' ||
      tBookingData.value.flg_exempt ||
      tBookingData.value.flg_end ||
      tBookingData.value.flg_continue
    if (
      currentServiceDetail.booking &&
      currentServiceDetail.booking.datetime_booking_confirmed
    ) {
      const date_booking_confirmed =
        currentServiceDetail?.booking?.datetime_booking_confirmed?.split(' ')[0]
      const time_booking_confirmed =
        currentServiceDetail?.booking?.datetime_booking_confirmed?.split(' ')[1]
      tBookingData.value.date_booking_confirmed = date_booking_confirmed
      tBookingData.value.time_booking_confirmed = time_booking_confirmed.slice(
        0,
        -3
      )
    }
  }
}

const showButtonIdexx = computed(() => {
  if (props.otherServiceDetailList?.length > 0) {
    return false
  }

  if (itemServiceUnitStore.getItemServiceUnit?.list_idexx_test) {
    let list_idexx_test =
      itemServiceUnitStore.getItemServiceUnit?.list_idexx_test

    if (
      typeof itemServiceUnitStore.getItemServiceUnit?.list_idexx_test ==
      'string'
    )
      list_idexx_test = JSON.parse(
        itemServiceUnitStore.getItemServiceUnit?.list_idexx_test
      )

    if (
      list_idexx_test &&
      list_idexx_test.length > 0 &&
      !itemServiceUnitStore.getItemServiceUnit?.memo_etc3
    )
      return true
    else return false
  }
  return false
})

const showButtonLab = computed(() => {
  if (
    itemServiceUnitStore.getItemServiceUnit?.list_test &&
    ['lab-set', 'lab-device'].includes(
      itemServiceUnitStore.getItemServiceUnit?.memo_etc3
    )
  )
    return itemServiceUnitStore.getItemServiceUnit
  return false
})

const addLabModal = async () => {
  let id_pet = data.value.id_pet
  const data1 = {
    deviceCategory: itemServiceUnitStore.getItemServiceUnit?.list_test,
    lab_set_type: itemServiceUnitStore.getItemServiceUnit?.memo_etc3,
    strict: true
  }
  await mtUtils.popup(CreateLabResultModal, {
    id_pet: id_pet,
    additional: data1
  })
}

const showButton = computed(() => {
  // return {
  //   button_label: "Test",
  //   code_category1: "",
  //   code_category2: "",
  //   target_modal: "update_print_canvas_modal",
  //   id_print: "8"
  // }

  const category1 = categoryStore.getAllCategories.find(
    (v: Category) => v.id_category == getServiceDetail?.value?.id_category1
  )

  let getCliCommon = cliCommonStore.getCliCommonPrintPdf.find((v) => {
    if (v.memo_etc2)
      return getServiceDetail.value.id_item_service_unit == v.memo_etc2
    if (v.memo_etc1)
      return getServiceDetail.value.id_item_service == v.memo_etc1
    if (v.text1) return getServiceDetail.value.code_category2 == v.text1
    if (v.code_func1) return category1?.code_category == v.code_func1
  })
  if (!getCliCommon)
    getCliCommon = cliCommonStore.getCliCommonModalButton.find((v) => {
      if (v.memo_etc2)
        return getServiceDetail.value.id_item_service_unit == v.memo_etc2
      if (v.memo_etc1)
        return getServiceDetail.value.id_item_service == v.memo_etc1
      if (v.text1) return getServiceDetail.value.code_category2 == v.text1
      if (v.code_func1) return category1?.code_category == v.code_func1
    })

  if (getCliCommon) {
    return {
      button_label: getCliCommon.name_cli_common,
      code_category1: getCliCommon.code_func1,
      code_category2: getCliCommon.text1,
      target_modal: getCliCommon.text2,
      id_print: getCliCommon.code_func2
    }
  }

  const getCategoryISPdfPrinitng = CATEGORY_ITEM_SERVICE_PDF_PRINTING.find(
    (v) => getServiceDetail.value.code_category2 === v.code_category2
  )
  if (getCategoryISPdfPrinitng) return getCategoryISPdfPrinitng

  return false
})
const initScripts = async () => {
  const scripts = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.5.0/fabric.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.2.0/jspdf.umd.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      integrity: ''
    },
    {
      src: '  https://printjs-4de6.kxcdn.com/print.min.js',
      integrity: ''
    }
  ]
  scripts.forEach((scriptObj) => {
    let script = document.createElement('script')
    script.src = scriptObj.src
    if (scriptObj.integrity !== '') {
      script.integrity = scriptObj.integrity
    }
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    document.body.appendChild(script)
  })
}

const initStylesheets = async () => {
  const stylesheets = [
    {
      href: 'https://printjs-4de6.kxcdn.com/print.min.css',
      integrity: ''
    }
  ]
  stylesheets.forEach((stylesheetObj) => {
    let link = document.createElement('link')
    link.href = stylesheetObj.href
    link.rel = 'stylesheet'
    if (stylesheetObj.integrity !== '') {
      link.integrity = stylesheetObj.integrity
    }
    link.crossOrigin = 'anonymous'
    link.referrerPolicy = 'no-referrer'
    document.head.appendChild(link)
  })
}

const openItemServiceModel = async (row) => {
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })
}
const deleteOldPdfObjects = () => {
  if (fabric) {
    fabric = null
  }
}

const openAddTextTemplateModal = async (value: number) => {
  typeMemoSelected.value = value
  await templateStore.fetchTemplates({ type_text_template: value })

  memoTemplates.value = templateStore.getTemplates
    .filter((template) => {
      return template.type_text_template === value
    })
    .map((template: any) => {
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
  if (type === 31) {
    data.value.memo_service = data.value.memo_service
      ? `${data.value.memo_service} ${value}`
      : `${value}`
    return
  }
}
const updateTime = (start: boolean = false) => {
  const dateStart: string = data.value.datetime_service_start!
  const dateEnd: string = data.value.datetime_service_end!
  const dateTimeStart = new Date(
    `${dateStart.split(' ')[0]} ${show_start_time_HH_MM.value ?? '00:00'}:00`
  )
  const dateTimeEnd = new Date(
    `${dateEnd.split(' ')[0]} ${show_end_time_HH_MM.value ?? '00:00'}:00`
  )

  if (
    start &&
    dateStart!.split(' ')[0] === dateEnd!.split(' ')[0] &&
    dateTimeStart !== null &&
    dateTimeStart > dateTimeEnd
  ) {
    show_end_time_HH_MM.value = show_start_time_HH_MM.value
  } else if (
    dateStart!.split(' ')[0] === dateEnd!.split(' ')[0] &&
    dateTimeEnd !== null &&
    dateTimeStart > dateTimeEnd
  ) {
    show_start_time_HH_MM.value = show_end_time_HH_MM.value
  }
}
const showDateSchedule = computed(() => {
  if (getServiceDetail.value.code_category2) {
    const findCategory = CATEGORY_ITEM_SERVICE_DATE.find((v) =>
      getServiceDetail.value.code_category2?.startsWith(v.code_category1)
    )
    if (findCategory) return findCategory
    else return false
  } else return false
})
const getPdfMappingJson = async () => {
  const pdfMappingJson = { ...getServiceDetail.value }
  let currentPet = customerStore.getCustomer.pets.find(
    (p) => p.id_pet == pdfMappingJson.id_pet
  )
  await itemServiceUnitStore.fetchItemServiceUnit(
    pdfMappingJson.id_item_service_unit
  )
  const currentItemServiceUnit = itemServiceUnitStore.getItemServiceUnit
  const currentClinic = await clinicStore.fetchClinicById(
    pdfMappingJson.id_clinic
  )
  for (let key in pdfMappingJson) {
    if (key == 'id_pet') {
      pdfMappingJson.id_pet = currentPet
    } else if (key == 'id_customer') {
      pdfMappingJson.id_customer = customerStore.getCustomer
    } else if (key == 'id_request') {
      pdfMappingJson.id_request = requestStore.getRequest
    } else if (key == 'id_clinic') {
      pdfMappingJson.id_clinic = currentClinic
    } else if (key == 'id_employee_doctor') {
      pdfMappingJson.id_employee_doctor = getNewEmployeeLabel(
        pdfMappingJson.id_employee_doctor
      )
    } else if (key == 'id_employee_staff') {
      pdfMappingJson.id_employee_staff = getNewEmployeeLabel(
        pdfMappingJson.id_employee_staff
      )
    } else if (key == 'booking') {
      if (
        Boolean(pdfMappingJson.booking) &&
        pdfMappingJson.booking.length > 0
      ) {
        pdfMappingJson.booking = pdfMappingJson.booking[0]
      }
    }
  }
  pdfMappingJson.rabies = Boolean(pdfMappingJson.rabies)
    ? pdfMappingJson.rabies
    : {}
  pdfMappingJson.rabies.id_employee_registered = getEmployeeLabel(
    pdfMappingJson.rabies?.id_employee_registered
  )
  pdfMappingJson.rabies.id_employee_processed = getEmployeeLabel(
    pdfMappingJson.rabies?.id_employee_processed
  )
  pdfMappingJson.id_item_service_unit = currentItemServiceUnit
  return pdfMappingJson
}

const isAlreadyRefreshing = ref(false)
const refreshIdexxLabResult = async () => {
  if (isAlreadyRefreshing.value) return

  if (!data.value.id_service_detail) return

  const confirmation = await mtUtils.confirm(
    'IDEXX検査の結果を再取得しますか?',
    '確認',
    'OK'
  )

  if (!confirmation) return

  isAlreadyRefreshing.value = true

  const notif = Notify.create({
    group: false,
    timeout: 0,
    spinner: true,
    message: '検査結果を再取得中...'
  })

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'refresh_idexx_lab_result',
    {
      id_service_detail: data.value.id_service_detail
    }
  )

  if (!response) {
    notif({
      icon: 'info',
      spinner: false,
      message: '処理に失敗しました。',
      type: 'negative',
      timeout: 500,
      progress: true,
      actions: [
        {
          icon: 'close',
          color: 'white',
          round: true,
          handler: () => {}
        }
      ]
    })
    return
  }

  await requestStore.fetchRequest(getServiceDetail?.value?.id_request)
  serviceDetailStore.setServiceDetail(
    serviceDetailStore.getServiceDetails.find(
      (v) => v.id_service_detail == getServiceDetail.value.id_service_detail
    )
  )

  await refresh()

  notif({
    icon: 'done',
    spinner: false,
    message: '更新しました。 ',
    type: 'positive',
    timeout: 500,
    progress: true
  })

  useMemoCarteStore()
    .fetchMemoCarteV1({
      id_pet: data.value?.id_pet,
      id_customer: data.value?.id_customer,
      end_date: getDateToday(),
      page_size: 200
    })
    .then((res) => {
      isAlreadyRefreshing.value = false
    })
}

const removeIdexx = async () => {
  data.value.selected_idexx = []

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.DELETE,
    `update_idexx_order/${data.value.lab_order.lab_order_id}`,
    {},
    false,
    {},
    false,
    true
  )

  if (response && response.status == '400') {
    await mtUtils.autoCloseAlert('処理中の為、更新できません。')
  }

  if (response && response.status == '200') {
    await mtUtils.autoCloseAlert('IDEXXオーダーを削除しました。')
    serviceDetailStore.resetSelectedIdexx()
  }
}

const clickButtonModal = async (target_modal) => {
  if (target_modal === 'order_idexx') {
    await itemServiceUnitStore.fetchItemServiceUnit(
      getServiceDetail.value.id_item_service_unit
    )

    await mtUtils.mediumPopup(SearchIdexxTestListModal, {
      id_service_detail: getServiceDetail.value?.id_service_detail,
      default_idexx: itemServiceUnitStore.getItemServiceUnit?.list_idexx_test,
      selected_idexx: data.value.selected_idexx
    })
    if (serviceDetailStore.getSelectedIdexx.length > 0) {
      data.value.selected_idexx = serviceDetailStore.getSelectedIdexx

      serviceDetailStore.resetSelectedIdexx()
    }
    return
  }

  if (showButton.value.target_modal === 'update_print_canvas_modal') {
    deleteOldPdfObjects()
    await initScripts()
    await initStylesheets()
    await Promise.all([
      commonStore.fetchPreparationCommonList({ code_common: [28] }),
      printStore.selectPrint(showButton.value.id_print, true)
      // printStore.selectPrint(100029, true)
    ])
    if (getPrint.value) {
      dataPrint.value = { ...getPrint.value }

      try {
        const binaryString = atob(getPrint.value.pdf_path)
        const arrayBuffer = new ArrayBuffer(getPrint.value.pdf_path.length)
        pdfArrayBuffer.value = arrayBuffer
        const uint8Array = new Uint8Array(arrayBuffer)
        for (let i = 0; i < binaryString.length; i++) {
          uint8Array[i] = binaryString.charCodeAt(i)
        }
        dataPrint.value.pdf_path = new Blob([uint8Array], {
          type: 'application/pdf'
        })
      } catch (e) {}

      // const screenSize = getCommonTypePrintSize.value.find(
      //   (v: any) => Number(v.code_func1) == dataPrint.value.type_print_size
      // )?.text1
      // const wd = Number(screenSize.split(',')[0])
      // const ht = Number(screenSize.split(',')[1])
      const wd = 210
      const ht = 296

      const dataToRender = await getPdfMappingJson()
      console.log(dataToRender)

      await mtUtils.popup(UpdatePrintCanvasModal, {
        data: dataPrint.value,
        pdfData: pdfArrayBuffer.value,
        canvasWidth: dataPrint.value.flg_landscape ? ht : wd,
        canvasHeight: dataPrint.value.flg_landscape ? wd : ht,
        dataToRender: dataToRender,
        hideRightButtons: false,
        renderDirectly: true,
        rightBoxButtons: serviceDetailAttributes,
        showSendNotificationBtn: true
      })
    }
  } else if (showButton.value.target_modal === 'view_lab_result_one') {
    const selectedCategories: any = labCategoryList.filter((v) => !!v.checked)
    if (selectedCategories.length === 0) return false
    const rowsData: any = [] as any
    selectedCategories.forEach((category) => {
      rowsData.push({ flgNameRow: true, ...category })
      if (
        labList[category.id_category] &&
        labList[category.id_category].length > 0
      ) {
        labList[category.id_category].forEach((lab) => {
          rowsData.push({
            ...lab,
            labCategoryId: category.id_category,
            registeredDate: category.registeredDate
          })
        })
      }
    })

    await mtUtils.pdfRender(GetPdfLabResultOne, {
      resultList: rowsData,
      labList: labList,
      labResultList: labResultList,
      showValResult
    })
  } else if (showButton.value.target_modal === 'view_lab_result_modal') {
    await mtUtils.popup(ViewLabResultModal, {
      id_customer: getRequest.value?.id_customer,
      id_pet: getRequest.value?.id_pet
    }, true)
  } else if (showButton.value.target_modal === 'open_lab_prep_list') {
    const route = router.resolve({ name: 'SearchLabDataPrepList' })
    window.open(route.href, '_blank')
  }
}

const changeFlgSchedule = (checked) => {
  tBookingFlag.value = checked
  if (tBookingFlag.value == false) {
    tBookingData.value.date_booking_confirmed = null
    tBookingData.value.time_booking_confirmed = null
    tBookingFlgTime.value = false
    tBookingFlgRepeat.value = false
    tBookingData.value.days_repeat = null
    tBookingData.value.flg_continue = true
    tBookingData.value.flg_exempt = false
    tBookingData.value.flg_end = false
  }
}

const init = () => {
  const startTime = dayjs(
    data.value.datetime_service_start,
    'YYYY/MM/DD HH:mm:ss'
  )
  const endTime = dayjs(data.value.datetime_service_end, 'YYYY/MM/DD HH:mm:ss')

  if (
    startTime.format('HH:mm') === '00:00' &&
    endTime.format('HH:mm') === '00:00'
  ) {
    data.value.show_time_ui = false
    show_start_time_HH_MM.value = serviceStartTime
    show_end_time_HH_MM.value = serviceEndTime
    return
  }

  data.value.show_time_ui = true
  show_start_time_HH_MM.value = startTime.format('HH:mm')
  show_end_time_HH_MM.value = endTime.format('HH:mm')
}

const selectDefaultEmployee = (key: string) => {
  data.value[key] = defaultEmployee
}

const openRequestPage = () => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: getRequest.value?.id_request }
  })

  window.open(route.fullPath, '_blank')
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader class="bg-light-blush" @closeModal="closeModal">
      <q-toolbar-title
        @click="copyText(getServiceDetail?.number_service_detail)"
        class="text-grey-900 title2 bold cursor-pointer"
      >
        <span>治療サービス明細：</span>
        {{ getServiceDetail?.number_service_detail }}
        <q-icon name="content_copy" class="text-blue" />
      </q-toolbar-title>
      <!-- <MtPetFilterSelect
        v-model:selecting="petSelected"
        :pet-list="petList"
        label="対象ペット *"
      /> -->
      <MtInputForm
        v-model="selectedPet"
        label="対象ペット *"
        readonly
        type="text"
      />
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-pa-lg content">
      <div
        class="flex justify-between bg-grey-300 q-pa-sm q-pl-md bg-light-blush"
      >
        <div>
          <div class="flex items-center">
            <div class="title2 text-grey-900 bold">
              {{
                [2, 3].includes(getServiceDetail?.type_booking)
                  ? '[ 予約 ] '
                  : ''
              }}
              {{ getServiceDetail?.name_item_service }}
            </div>
            <div @click.stop="openItemServiceModel(getServiceDetail)">
              <q-btn
                class="text-grey-800 q-ml-md"
                flat
                icon="quiz"
                round
                size="12px"
              />
            </div>
          </div>
          <div class="text-body2 text-grey-700 flex items-center">
            {{ getServiceDetail?.name_category1 }}
            <q-icon name="arrow_right" />
            {{ getServiceDetail?.name_category2 }}
          </div>
        </div>
        <div class="flex">
          <q-chip
            v-if="getServiceDetail?.flg_prevention"
            class="chip-blue"
            text-color="white"
          >
            予防
          </q-chip>
          <q-chip
            v-if="getServiceDetail?.flg_pet_custody_control"
            class="chip-red"
            text-color="white"
          >
            預かり
          </q-chip>
          <q-chip
            v-if="getServiceDetail?.flg_surgery"
            class="chip-purple"
            text-color="white"
          >
            手術
          </q-chip>
          <q-chip
            v-if="getServiceDetail?.flg_anesthesia"
            class="chip-green"
            text-color="white"
          >
            麻酔
          </q-chip>
          <q-btn
            v-if="showButtonIdexx"
            color="primary"
            class="q-ml-md"
            unelevated
            @click="clickButtonModal('order_idexx')"
          >
            IDEXX院内検査
          </q-btn>
          <q-btn
            v-else-if="showButtonLab"
            color="primary"
            class="q-ml-md"
            unelevated
            @click="addLabModal"
          >
            {{
              showButtonLab.memo_etc3 == 'lab-set'
                ? '手入力検査'
                : '検査機器（IDEXX以外）'
            }}
          </q-btn>
          <q-btn
            v-else-if="showButton"
            color="primary"
            class="q-ml-md"
            unelevated
            @click="clickButtonModal"
          >
            {{ showButton.button_label }}
          </q-btn>
        </div>
      </div>

      <template
        v-for="effort_item in serviceEffortList"
        v-if="serviceEffortList?.length > 0"
      >
        <div
          class="row q-col-gutter-md q-mb-md mt-2"
          style="flex-direction: column"
        >
          <div class="row border-bottom q-mt-md">
            <div class="col-6">
              <MtFormCheckBox
                v-model:checked="effort_item.checked"
                :label="effort_item.name_item_service"
                class="q-mr-md"
                @update:checked="
                  (value) => {
                    effort_item.quantity = value ? 1 : 0
                  }
                "
              />
            </div>
            <div class="col-3">
              <MtFormInputNumber
                v-if="effort_item.checked"
                v-model:value="effort_item.quantity"
                class="q-mr-md"
                label="数量"
                mode="dosage"
              />
            </div>
            <!--              <div class="col-3 flex items-end justify-end">-->
            <!--                <div v-if="effort_item.checked" class="caption1 regular">合計金額：-->
            <!--                  {{ itemServiceUnitObj?.unit_price * (effort_item.quantity ?? 1) }} 円-->
            <!--                </div>-->
            <!--              </div>-->
          </div>
        </div>
      </template>
      <template v-else>
        <div class="row q-col-gutter-md q-my-sm">
          <div class="col">
            <MtFormInputDate
              v-model:date="data.datetime_service_start"
              :rules="[aahValidations.validationRequired]"
              datetime
              label="開始日"
              @update:date="onUpdateStartDate"
            />
          </div>
          <div v-if="data.show_time_ui" class="col">
            <MtFormPullDown
              v-model="show_start_time_HH_MM"
              :options="timeHourMinuteInterval_5"
              label="時：分"
              type="selection"
              @update:model-value="updateTime(true)"
            />
          </div>
          <div class="col">
            <MtFormInputDate
              v-model:date="data.datetime_service_end"
              :rules="[aahValidations.validationRequired]"
              datetime
              label="終了日"
            />
          </div>
          <div v-if="data.show_time_ui" class="col">
            <MtFormPullDown
              v-model:selected="show_end_time_HH_MM"
              :options="timeHourMinuteInterval_5"
              label="時：分"
              type="selection"
              @update:model-value="updateTime()"
            />
          </div>
          <div class="col-1">
            <MtFormInputNumber
              v-model:value="data.quantity"
              label="数量"
              mode="dosage"
              input-class="price-title"
            />
          </div>
          <div class="col">
            <MtFormInputNumber2
              v-model:value="data.unit_price"
              label="販売価格（円）"
              input-class="price-title"
              @update:value="()=>{
                data.flg_discount = data.item_service_unit.price_list.find((pr:any) => pr.id_price == data.id_price)?.price > data.unit_price
                if(data.item_service_unit.flg_tax_included){
                  if(data.item_service_unit.type_tax == 1){
                    data.base_calculated_tax_exculsive_price = Math.round(data.unit_price  / 1.1)
                  }
                  else if(data.item_service_unit.type_tax == 2){
                    data.base_calculated_tax_exculsive_price = Math.round(data.unit_price  / 1.08)
                  }
                }
              }"
            ></MtFormInputNumber2>
            <span v-if="data?.item_service_unit?.flg_tax_included" class="text-danger">
              上記表示は内税価格 税別単価: {{ data.base_calculated_tax_exculsive_price }} 円
            </span>
            <mt-form-check-box
              v-model:checked="data.flg_discount"
              label="割引"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col">
            <MtFormMultipleSelection
              v-model="data.id_pet_illness_history"
              :options="illnessHistoryList"
              :rules="[aahValidations.validationRequired]"
              label="現疾患・既往歴"
              show-quick-illness-history
            />
          </div>
          <div class="col">
            <InputEmployeeOptGroup
              v-model:selected="data.id_employee_doctor"
              label="主担当者"
              show-select-default-employee
              @update:select-default-employee="
                selectDefaultEmployee('id_employee_doctor')
              "
            />
          </div>
          <div class="col">
            <InputEmployeeOptGroup
              v-model:selected="data.id_employee_staff"
              label="副担当者"
              show-select-default-employee
              @update:select-default-employee="
                selectDefaultEmployee('id_employee_staff')
              "
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-6">
            <MtInputForm
              v-model="data.memo_service"
              autogrow
              label="詳細・メモ"
              type="text"
            >
              <template #append>
                <q-icon
                  class="cursor-pointer"
                  name="add"
                  @click="openAddTextTemplateModal(31)"
                />
              </template>
            </MtInputForm>
          </div>
        </div>
        <!--If this is CO5 狂犬病猶予 Service, display below -->
        <div
          v-if="data.rabies && data.rabies.id_rabies"
          class="row q-col-gutter-md q-mt-sm"
        >
          <div class="col-3">
            <MtFormInputDate
              v-model:date="data.rabies.date_exempt_start"
              :rules="[aahValidations.validationRequired]"
              class="col-4"
              label="猶予開始日"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-model:date="data.rabies.date_exempt_end"
              :rules="[aahValidations.validationRequired]"
              class="col-4"
              label="猶予終了日"
            />
          </div>
          <div class="col-6">
            <MtInputForm
              v-model="data.rabies.memo_exemption_rabies"
              :rules="[aahValidations.validationRequired]"
              class="col-12 q-ml-md"
              label="猶予理由"
              type="text"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-auto">
            <MtInputForm
              v-model="data.flg_apply_insurance"
              :items="[{ label: '保険適用' }]"
              type="checkbox"
            />
          </div>
          <div class="col-auto">
            <MtInputForm
              v-model="data.flg_non_charge"
              :items="[{ label: '会計対象外' }]"
              type="checkbox"
            />
          </div>
          <div class="col-auto">
            <MtInputForm
              v-model="data.flg_pet_custody_control"
              :items="[{ label: '預り管理' }]"
              :rules="[aahValidations.validationRequired]"
              type="checkbox"
            />
          </div>
          <div class="col-auto">
            <MtInputForm
              v-model="data.show_time_ui"
              :items="[{ label: '実施時刻' }]"
              type="checkbox"
            />
          </div>
          <div v-if="getRequest?.flg_booking" class="col-2">
            <MtFormPullDown
              v-model:selected="data.type_booking"
              :options="typeBooking"
              label="予約区分（カレンダー表示）"
              type="selection"
            />
          </div>
          <div class="col-auto">
            <MtInputForm
              v-model="data.flg_next_cart"
              :items="[{ label: '次回の会計' }]"
              type="checkbox"
            />
          </div>
          <div class="col-auto">
            <MtFormCheckBox
              v-model:checked="data.flg_takeout"
              label="持ち帰り"
            />
          </div>
          <!-- T BOOKING -->
          <div class="col-auto">
            <MtInputForm
              v-model="data.flg_schedule"
              :items="[{ label: '次回予定' }]"
              type="checkbox"
              @update:model-value="changeFlgSchedule"
            />
          </div>
          <div v-if="showDateSchedule" class="col-auto">
            <q-btn flat @click="openEventAvailable()">
              <q-icon name="event_available" size="xs" />
            </q-btn>
          </div>
          <div v-if="tBookingFlag && tBookingData" class="col-auto">
            <MtFormInputDate
              v-model:date="tBookingData.date_booking_confirmed"
              datetime
              label="予定日"
            />
          </div>
          <div v-if="tBookingFlag && tBookingData" class="col-auto">
            <MtInputForm
              v-model="tBookingFlgTime"
              :items="[{ label: '時刻指定' }]"
              type="checkbox"
            />
          </div>
          <div v-if="tBookingFlgTime" class="col-2">
            <MtFormPullDown
              v-model="tBookingData.time_booking_confirmed"
              :options="timeHourMinute"
              label="時：分"
              type="selection"
              @update:model-value="updateTime(true)"
            />
          </div>
          <div class="col-auto">
            <MtInputForm
              v-model="data.flg_complete"
              :items="[{ label: '完了' }]"
              type="checkbox"
            />
          </div>
        </div>
        <hr class="light" />
        <div v-if="data.flg_cancel" class="row q-col-gutter-md q-mt-sm">
          <div class="col">
            <MtInputForm
              v-model="data.memo_cancel"
              disable
              label="キャンセル理由"
              type="text"
            />
          </div>
        </div>

        <!-- Showing IDEXX -->
        <div
          v-if="data.lab_order && data.lab_order.type_machine != '2'"
          class="row q-col-gutter-md q-mt-sm"
        >
          <div v-if="data.selected_idexx" class="col-6">
            IDEXX検査 : <br />{{ showIdexxName(data.selected_idexx) }}
          </div>
          <div v-if="data.selected_idexx" class="col-6 text-right">
            <q-btn
              class="hide-tablet"
              flat
              icon="sync"
              round
              size="24"
              @click="refreshIdexxLabResult"
            />
            <q-btn
              v-if="data.selected_idexx"
              class="q-ml-md"
              color="primary"
              outline
              @click="removeIdexx"
              >削除</q-btn
            >
            <!-- <q-btn @click="activateIdexx" color="primary" outline class="q-ml-md">Activate</q-btn> -->
          </div>
        </div>

        <!-- Showing Lab Result -->
        <div class="q-pa-sm">
          <ShowLabResultComponent
            :id_pet="getServiceDetail.id_pet"
            :id_service_detail="getServiceDetail.id_service_detail"
            :showIdexxButton="showButtonIdexx"
          />
        </div>

        <!-- Related RQ info starts -->
        <div class="q-mt-md q-mb-md">
          <h4 class="text-white bg-grey-600 title4">リクエスト</h4>
        </div>
        <div class="q-mt-lg" v-if="getRequest?.number_request">
          <div class="q-mb-sm">
            <span
              :class="{ 'cursor-pointer': getRequest?.number_request }"
              @click="
                getRequest?.number_request
                  ? copyText(getRequest?.number_request)
                  : null
              "
            >
              {{ getRequest?.number_request }}
              <q-icon class="text-blue" name="content_copy" />
            </span>
            <span
              class="text-grey-700 cursor-pointer q-mt-sm q-pl-md"
              @click.stop="openRequestPage"
            >
              {{ getRequest?.title_request }}
            </span>
            <span
              class="text-blue cursor-pointer"
              @click.stop="openRequestPage"
            >
              リクエストを開く
              <q-icon class="q-ml-sm" name="open_in_new" />
            </span>
          </div>
          <div class="q-mb-sm">
            <span class="field-label1">開始日</span
            >{{ getRequest?.date_request_start + '　' }}
            <span class="field-label1 q-ml-xl">主担当者</span
            >{{ getEmployeeLabel(getRequest?.id_employee_doctor) }}
          </div>
        </div>
        <div v-else class="text-grey-500">番号取得失敗</div>
      </template>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal">
          <span>閉じる</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="治療サービス"
    :options="memoTemplates"
    :data="data"
    :single-option="true"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>
