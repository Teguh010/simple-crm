<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import { checkDateRange, concatenate, formatDate, getDateToday } from '@/utils/aahUtils'
import useAuthStore from '@/stores/auth'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import selectOptions from '@/utils/selectOptions'
import { LocalStorage } from 'quasar'
import aahMessages from '@/utils/aahMessages'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import useCommonStore from '@/stores/common'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { PetType, TextTemplateType } from '@/types/types'
import AddTextTemplateModal from '../task/AddTextTemplateModal.vue'
import useTextTemplateStore from '@/stores/text-template'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useItemStore from '@/stores/items'
import { groupBy } from 'lodash'
import dayjs from '@/boot/dayjs'
import useIllnessHistoryStore from '@/stores/illness-history'
import { timeHourMinuteInterval_5 } from '@/utils/enumDateTime'
import aahValidations from '@/utils/aahValidations'
import { SharedValueObject, SharedValueType, SharedValueTypes, useMovableModalStore } from '@/stores/movable-modal'
import UpdQtRequest from '@/pages/queueTicket/UpdQtRequest.vue'
import UpsertRequestModal, { UpsertRequestModalProps } from '@/pages/request/UpsertRequestModal.vue'

interface RequestWithServiceDetail {
  id_service_item: string
  code_customer: string
  date_request_start: string
  date_request_goal: string
  datetime_service_start: string
  datetime_service_end: string
  start_time: string
  end_time: string
  title_request: string
  id_customer: string
  code_ahmics_customer: string
  flg_non_charge: boolean
  flg_booking: boolean
  id_pet: string
  name_customer: string
  flg_ticket: boolean
  memo_request: string
  id_employee_doctor: string
  id_employee_staff: string
  id_employee_request: string
  flg_in_app_payment: boolean
  id_clinic: null
  flg_complete: boolean
  flg_apply_insurance: boolean
  id_item_service: string
  id_item_service_unit: string
  id_employee_doctor_service_unit: string
  id_illness_history: string
  id_service_item_unit: string
  name_category1: string
  name_category2: string
  code_category2: string
  name_item_service: string
  show_time_ui: boolean
}

const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getDoctors } = storeToRefs(employeeStore)
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const commonStore = useCommonStore()
const templateStore = useTextTemplateStore()
const itemStore = useItemStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const illnessHistoryStore = useIllnessHistoryStore()
const movableModalStore = useMovableModalStore()

const { getCustomerOption } = storeToRefs(customerStore)
const { getAuthUser } = storeToRefs(authStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const { getTemplates } = storeToRefs(templateStore)
const { getCalendarServiceItems } = itemStore
const { getCalendarServiceUnits } = itemServiceUnitStore
const { getAllIllnessHistorys } = storeToRefs(illnessHistoryStore)

const illnessHistory = computed(() => {
  return getAllIllnessHistorys.value.filter((illness) => illness.label)
})

const itemServicesOption = computed(() => {
  return getCalendarServiceItems
    .map(service => ({ 
      value: service.id_item_service, 
      label: service.name_item_service, 
      name_category1: service.name_category1, 
      name_category2: service.name_category2,
      code_category2: service.code_category2,
    }))
})

const itemServiceUnitByServiceId = computed(() => {
  return groupBy(
    getCalendarServiceUnits
      .map(service => ({
        value: service.id_item_service_unit,
        label: service.name_service_item_unit,
        id_item_service: service.id_item_service,
        duration: parseInt(service.memo_etc1 ?? '30'),
        flg_non_charge: service.flg_non_charge
      })),
    'id_item_service'
  )
})

const emits = defineEmits(['close'])

const props = defineProps({
  request: <any>Object,
  id_pet: { type: String, default: '' },
  id_customer: { type: String, default: '' },
  data: { type: Object },
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  requestDuplicate: { type: Boolean, default: false },
  id_request_old: {
    type: Number,
    default: null
  },
  disable_customer: { type: Boolean, default: false },
  disable_pet: { type: Boolean, default: false }
})

const requestForm = ref<RequestWithServiceDetail>({
  id_service_item: '',
  date_request_start: getDateToday(),
  date_request_goal: '',
  datetime_service_start: '',
  datetime_service_end: '',
  start_time: '07:00',
  end_time: '07:30',
  title_request: '',
  code_customer: '',
  id_customer: '',
  code_ahmics_customer: '',
  flg_non_charge: false,
  flg_booking: false,
  id_pet: '',
  name_customer: '',
  flg_ticket: false,
  flg_apply_insurance: false,
  memo_request: '',
  memo_service: '',
  id_employee_doctor: '',
  id_employee_staff: '',
  id_employee_request: '',
  flg_in_app_payment: false,
  id_clinic: null,
  flg_complete: false,
  id_item_service: '',
  id_item_service_unit: '',
  id_employee_doctor_service_unit: '',
  id_illness_history: '',
  id_service_item_unit: null,
  name_category1: '',
  name_category2: '',
  code_category2: '',
  name_item_service: '',
  show_time_ui: false,
})

const isEdit = ref(false)
const isPet = ref(false)
const addTemplateModal = ref(false)
const memoTemplates = ref<TextTemplateType[]>([])
const selectedTemplate = ref('')

const requestListByCustomer = ref([])

const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])
const illnessHistoryDefault = ref([])
const flg_control_title_Request = ref(true)
const bookingDisabled = ref(false)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const assignPageData = (newData: any) => {
  if (newData?.id_request) {
    for (let key in requestForm) {
      requestForm.value[key] = newData[key]
    }
  }
}

const clickDateTimeRequestStart = (value: any) => {
  if (value) {
    requestForm.value.date_request_goal = value
  }
}

const fetchRequestByCustomer = async (value: any) => {
  const res: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    '/requests',
    { id_customer: value, date_request_start: getDateToday() }
  )
  if (res) {
    requestListByCustomer.value = res
  }
}

const selectingCustomer = async (value: any, initCall = false) => {
  requestForm.value.id_customer = value
  isPet.value = false

  requestListByCustomer.value = []

  if (value) {

    await mtUtils.promiseAllWithLoader([
      customerStore.selectCustomerOptions(value),
      fetchRequestByCustomer(value)
    ])

    let selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      requestForm.value.code_customer = selectedCustomer.code_customer
      requestForm.value.code_ahmics_customer = selectedCustomer.code_ahmics_customer
      requestForm.value.name_customer = concatenate(
        selectedCustomer.name_family,
        selectedCustomer.name_first
      )

      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: PetType) => {
          if (petObj.flg_unlist || petObj.flg_deceased) return

          petListDefault.push({
            ...petObj,
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet,
            icon:
              getCommonTypeAnimalOptionList.value.find((c) => {
                return c.value === petObj.id_cm_animal
              })?.text1 ?? '',
          })
        })
        petList.value = [...petListDefault]
        isPet.value = true

        if (!isEdit.value && petList.value.length > 0) {
          requestForm.value.id_pet =
          petListDefault.find((pet: any) => pet.id_pet === props?.id_pet)
            ?.id_pet ?? petListDefault[0]?.id_pet
          
          if (!requestForm.value.id_employee_doctor) {
            await updateDefaultPetDoctor(requestForm.value.id_pet);
          }
        }
      }
    }
  } else {
    requestForm.value.code_customer = ''
    requestForm.value.code_ahmics_customer = ''
    requestForm.value.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}

const closeModal = () => {
  emits('close')
  movableModalStore.closeMovableModal()
}

const handleAutoRequestTitle = () => {
  const { id_employee_doctor, id_employee_staff, name_customer, date_request_start, code_customer } = requestForm.value || {}
  const employees = employeeStore.getAllEmployees

  const selectedEmployeeDoctor = employees.find((v: any) => v.value === id_employee_doctor)?.label || ''
  const selectedEmployeeStaff = employees.find((v: any) => v.value === id_employee_staff)?.label || ''

  const fixedTextCustomer = name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeStaff ? `/ 担当: ` : ''

  return [
    date_request_start || '',
    code_customer || '',
    name_customer || '',
    fixedTextCustomer,
    selectedEmployeeDoctor,
    fixedTextDoctor,
    selectedEmployeeStaff ? (fixedTextDoctor ? fixedTextStaff : fixedTextStaff.replace('/ ', '')) : '',
    selectedEmployeeStaff
  ].join(' ').trim()
}

const checkForRequestExistence = async () => {
  if (
    !requestForm.value.id_request &&
    !requestForm.value.id_request &&
    requestListByCustomer.value &&
    requestListByCustomer.value.length > 0
  ) {
    await mtUtils.smallPopup(UpsertRequestModal, { 
      requestList: requestListByCustomer.value,
      idCustomer: requestForm.value.id_customer, 
      callbackFn: save,
    })
    return
  }
  await save()
}

const save = async (id_request?: any) => {
  if(id_request) {
    requestForm.value.id_request = id_request
  }

  if (
    !checkDateRange([
      {
        start_date: requestForm.value.date_request_start,
        end_date: requestForm.value.date_request_goal
      }
    ])
  )
    return false
  // requestForm.value.name_employee_request = employeeStore.getAllEmployees.find(
  //   (v: any) => v.value === requestForm.value?.id_employee_request
  // )?.label
  //
  // requestForm.value.name_employee_staff = employeeStore.getAllEmployees.find(
  //   (v: any) => v.value === requestForm.value?.id_employee_staff
  // )?.label

  requestForm.value.title_request = flg_control_title_Request.value
    ? handleAutoRequestTitle()
    : requestForm.value.title_request=
  requestForm.value.title_request = flg_control_title_Request.value
    ? handleAutoRequestTitle()
    : requestForm.value.title_request
  
  const startTime = requestForm.value.show_time_ui ? requestForm.value.start_time : '00:00'
  const endTime = requestForm.value.show_time_ui ? requestForm.value.end_time : '00:00'

  requestForm.value.datetime_service_start = dayjs(
    `${requestForm.value.date_request_start} ${startTime}:00`,
    'YYYY/MM/DD HH:mm:ss'
  ).format('YYYY-MM-DD HH:mm:ss')
  
  requestForm.value.datetime_service_end = dayjs(
    `${requestForm.value.date_request_goal} ${endTime}:00`,
    'YYYY/MM/DD HH:mm:ss'
  ).format('YYYY-MM-DD HH:mm:ss')

  const itemService = itemServicesOption.value.find((v: any) => v.value === requestForm.value?.id_service_item)
  if(itemService) {
    requestForm.value.name_category1 = itemService.name_category1
    requestForm.value.name_category2 = itemService.name_category2
    requestForm.value.code_category2 = itemService.code_category2
    requestForm.value.name_item_service = itemService.label
  }

  const payload = {
    ...requestForm.value,
    id_request_old: props?.id_request_old
  }
  await mtUtils.callApi(selectOptions.reqMethod.POST, `calendar/requests`, payload)
  await mtUtils.autoCloseAlert(aahMessages.success)
  props.updatedFlg = true
  await getMovableModalData.value?.callbackFn()
  await getMovableModalData.value?.secondCallbackFn?.(startTime)
  closeModal()
}

const handleRequestTitle = (value: any) => {
  if (value === true) {
    requestForm.value.title_request = ''
  }
}

const updateDefaultPetDoctor = async (value: any) => {
  if(value == '') {
    requestListByCustomer.value = []
  }
  
  requestForm.value.flg_apply_insurance = false

  let selectedCustomer = getCustomerOption.value
  await illnessHistoryStore.fetchIllnessHistorys({ id_pet: requestForm.value.id_pet, id_customer: selectedCustomer.id_customer })
  requestForm.value.id_illness_history = ''
  if (value && !isEdit.value) {
    const relatedPet = petListDefault.find((v) => v.value === value)
    if(!relatedPet) {
      return
    }
    
    let mainDoctor = relatedPet.id_employee_main_doctor
    
    if(!mainDoctor) {
      mainDoctor = selectedCustomer.id_employee_doctor
    }
    requestForm.value.id_employee_doctor = mainDoctor
    requestForm.value.id_employee_staff = mainDoctor

    if (relatedPet && relatedPet.pet_insurance && relatedPet.pet_insurance.length && relatedPet.pet_insurance.length > 0) {
      const insurancePlan = relatedPet.pet_insurance[0]
      const start_date = formatDate(insurancePlan.date_insurance_start)
      const end_date = formatDate(insurancePlan.date_insurance_end)
      if (start_date <= getDateToday() && end_date > getDateToday()) {
        requestForm.value.flg_apply_insurance = true
      }
    }
  }
}

const selectDefaultEmployee = (key: string) => {
  requestForm[key] = defaultEmployee
}

const openRequestDetail = (id_request) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })  
  window.open(route.href, '_blank')
}

const openAddTextTemplateModal = async () => {
  await templateStore.fetchTemplates({ type_text_template: 31 })

  memoTemplates.value = getTemplates.value.filter((template) => {
    return template.type_text_template === 31
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

const handleUpdateRequestMemo = (value: string) => {
  const prefix = requestForm.value.memo_service ? requestForm.value.memo_service + '\n' : ''
  requestForm.value.memo_service = prefix + value
}

const updateDateTime = () => {
  if (requestForm.value.date_request_start) {
    const timeValue = requestForm.value.show_time_ui ? requestForm.value.start_time : '00:00'
    requestForm.value.datetime_service_start = 
      `${requestForm.value.date_request_start} ${timeValue}:00`
  }
  
  if (requestForm.value.date_request_goal) {
    const timeValue = requestForm.value.show_time_ui ? requestForm.value.end_time : '00:00'
    requestForm.value.datetime_service_end = 
      `${requestForm.value.date_request_goal} ${timeValue}:00`
  }
}

const handleTimeUIToggle = (show) => {
  requestForm.value.show_time_ui = show
  if (!show) {
    requestForm.value.start_time = '00:00'
    requestForm.value.end_time = '00:00'
  } else {
    requestForm.value.start_time = '07:00'
    requestForm.value.end_time = '07:30'
  }
  updateDateTime()
}

const handleUpdateRequestStartDate = (newDate) => {
  if (newDate) {
    requestForm.value.date_request_goal = newDate
    updateDateTime()
  }
}

const handleUpdateServiceItemUnit = (selectedItemServiceUnit: null | object = null) => {
  if (!selectedItemServiceUnit) {
    selectedItemServiceUnit = itemServiceUnitByServiceId.value[requestForm.value.id_service_item]?.[0]
  }
  requestForm.value.id_service_item_unit = selectedItemServiceUnit.value
  requestForm.value.flg_non_charge = selectedItemServiceUnit.flg_non_charge
}

const handleUpdateRequestEndDate = (newDate) => {
  if (newDate) {
    if (requestForm.value.date_request_start && newDate < requestForm.value.date_request_start) {
      requestForm.value.date_request_goal = requestForm.value.date_request_start
    } else {
      requestForm.value.date_request_goal = newDate
    }
    updateDateTime()
  }
}

const handleUpdateStartTime = (newTime) => {
  if (newTime) {
    requestForm.value.start_time = newTime
    if (!requestForm.value.end_time || requestForm.value.end_time <= requestForm.value.start_time) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const endTime = dayjs().set('hour', hours).set('minute', minutes).add(30, 'minute')
      const formattedEndTime = endTime.format('HH:mm')
      requestForm.value.end_time = formattedEndTime
    }
    updateDateTime()
  }
};

const handleEndTimeUpdate = (newTime) => {
  if (newTime) {
    if (requestForm.value.date_request_start === requestForm.value.date_request_goal && 
        requestForm.value.start_time) {
      if (newTime <= requestForm.value.start_time) {
        const [hours, minutes] = requestForm.value.start_time.split(':').map(Number)
        const endTime = dayjs().set('hour', hours).set('minute', minutes).add(30, 'minute')
        requestForm.value.end_time = endTime.format('HH:mm')
      } else {
        requestForm.value.end_time = newTime
      }
    } else {
      requestForm.value.end_time = newTime
    }
    updateDateTime()
  }
};

const availableEndTimes = computed(() => {
  if (requestForm.value.date_request_start !== requestForm.value.date_request_goal || 
      !requestForm.value.start_time) {
    return timeHourMinuteInterval_5
  }
  return timeHourMinuteInterval_5.filter(time => time > requestForm.value.start_time)
});

const setDefaultSelections = () => {
  if (itemServicesOption.value.length > 0) {
    requestForm.value.id_service_item = itemServicesOption.value[0].value
  }
  
  if (requestForm.value.id_service_item && itemServiceUnitByServiceId.value[requestForm.value.id_service_item]?.length > 0) {
    requestForm.value.id_service_item_unit = itemServiceUnitByServiceId.value[requestForm.value.id_service_item][0].value
  }
}

watch([getCalendarServiceItems, getCalendarServiceUnits], () => {
  setDefaultSelections()
}, { immediate: true })

watch(() => requestForm.value.id_service_item, (newValue) => {
  if (newValue && itemServiceUnitByServiceId.value[newValue]?.length > 0) {
    requestForm.value.id_service_item_unit = itemServiceUnitByServiceId.value[newValue][0].value
  } else {
    requestForm.value.id_service_item_unit = null
  }
})
watch(() => requestForm.value.start_time, (newTime) => {
  if (newTime) {
    const [hours, minutes] = newTime.split(':').map(Number)
    const endTime = dayjs().set('hour', hours).set('minute', minutes).add(30, 'minute')
    setEndTimeBasedOnDuration(requestForm.value.id_service_item_unit)
    updateDateTime()
  }
})

watch(() => requestForm.value.id_service_item_unit, (newValue) => {
  setEndTimeBasedOnDuration(newValue)
})

const setEndTimeBasedOnDuration = (id_item_service_unit: number) => {
  const itemServiceUnit = itemServiceUnitByServiceId.value[requestForm.value.id_service_item].find(itemServiceUnit => itemServiceUnit.value === id_item_service_unit)
  if(itemServiceUnit && requestForm.value.start_time) {
    const [hours, minutes] = requestForm.value.start_time.split(':').map(Number)
    let duration = Number(itemServiceUnit.duration);
    if (isNaN(duration) || duration <= 0 || !duration) {
      duration = 15;
    }
    requestForm.value.end_time = dayjs().set('hours', hours).set('minutes', minutes).add(duration, 'minute').format('HH:mm')
  }
}

onMounted(async () => {  
  requestForm.value.id_employee_request = JSON.parse(
    LocalStorage.getItem('id_employee') ?? ''
  )
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.data?.id_employee) {
    requestForm.value.id_employee_staff = props.data?.id_employee
    requestForm.value.id_employee_doctor = props.data?.id_employee
  }
  if (props.data?.show_time_ui !== undefined) {
    requestForm.value.show_time_ui = props.data.show_time_ui
  }
  // Create modal
  if (props.id_pet !== '' && props.id_customer !== '') {
    requestForm.value.id_customer = props.id_customer
    requestForm.value.id_pet = props.id_pet

    if (props.data?.memo_request) {
      requestForm.value.memo_request = props.data.memo_request
    }
    if (props.data?.id_employee_doctor) {
      requestForm.value.id_employee_doctor = props.data.id_employee_doctor
    }
    if (props.data?.id_employee_staff) {
      requestForm.value.id_employee_staff = props.data.id_employee_staff
    }
    if (props.data?.flg_non_charge) {
      requestForm.value.flg_non_charge = props.data.flg_non_charge
    }
    if (props.data?.flg_in_app_payment) {
      requestForm.value.flg_in_app_payment = props.data.flg_in_app_payment
    }
    if (props.data?.id_employee_request) {
      requestForm.value.id_employee_request = props.data.id_employee_request
    }
  }
  if (props.data?.date_request_start) {
    requestForm.value.date_request_start = props.data?.date_request_start
    requestForm.value.date_request_goal = props.data?.date_request_goal
    requestForm.value.flg_booking = props.data?.flg_booking
    bookingDisabled.value = true
    
    if (props.data?.start_time) {
      const time = dayjs(`${props.data?.date_request_start} ${props.data?.start_time}`).floor('minute', 5).format('HH:mm')
      requestForm.value.start_time = time
      requestForm.value.end_time = time
    }
  }

  if (props.data?.flg_booking) {
    requestForm.value.flg_booking = props.data?.flg_booking
    bookingDisabled.value = true
  }

  if (props.request?.id_employee_doctor) {
    requestForm.value.id_employee_doctor = props.request.id_employee_doctor
  }
  if (props.request?.id_employee_staff) {
    requestForm.value.id_employee_staff = props.request.id_employee_staff
  }
  
  fillDataForMovableModal()

  requestForm.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

  const code_customer = route.query.code_customer as string
  const code_pet = route.query.code_pet as string
  
  if (code_customer) {
    const customer = await customerStore.SearchCustomerByCode(code_customer)    
    if (customer?.id_customer) {
      requestForm.value.id_customer = customer.id_customer
      await selectingCustomer(customer.id_customer)

      if (code_pet && petListDefault.length > 0) {
        const pet = petListDefault.find(p => p.code_pet === code_pet)
        if (pet) {
          console.log('Found pet:', pet)
          requestForm.value.id_pet = pet.id_pet
          await updateDefaultPetDoctor(pet.id_pet)
        }
      }
    }
  }
})
const { getMovableModalData, getSharedValue } = storeToRefs(movableModalStore)
const fillDataForMovableModal = () => {
  const obj = getMovableModalData.value
  for(const key of Object.keys(obj)) {
    if(key !== 'callbackFn') {
      requestForm.value[key] = obj[key]
    }
  }
  if(requestForm.value.id_customer) {
    selectingCustomer(parseInt(requestForm.value.id_customer))
  }
  if(getMovableModalData.value.show_time_ui) {
    const time = dayjs(`${requestForm.value.date_request_start} ${requestForm.value.start_time}`).floor('minute', 5).format('HH:mm')
    requestForm.value.start_time = time
    requestForm.value.end_time = time
    requestForm.value.show_time_ui = true
  }
  if(getMovableModalData.value.id_employee) {
    requestForm.value.id_employee_doctor = getMovableModalData.value.id_employee
  }
  setDefaultSelections()
  setEndTimeBasedOnDuration(requestForm.value.id_service_item_unit)
}

watch(() => getSharedValue.value, (val) => {
  if (val?.type === SharedValueTypes.UPDATE_CALENDAR_DATE) {
    requestForm.value.date_request_start = val.value
    requestForm.value.date_request_goal = val.value
  }
  
  else if(val?.type === SharedValueTypes.UPDATE_CALENDAR_DATETIME) {
    requestForm.value.date_request_start = val.value.format('YYYY/MM/DD')
    requestForm.value.date_request_goal = val.value.format('YYYY/MM/DD')
    handleUpdateStartTime(val.value.format('HH:mm'))
  }
})
</script>

<template>
  <q-form style="height: 100%" @submit="checkForRequestExistence">
    <MtModalHeader @closeModal="closeModal" class="header-sticky">
      <q-toolbar-title class="text-grey-900 title2 bold">
        カレンダー 予約リクエスト
      </q-toolbar-title>
    </MtModalHeader>

    <q-card-section class="q-px-xl scrollable-content">
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="3" class="col-6 col-sm-3">
          <MtFormInputDate
            label="リクエスト開始日"
            v-model:date="requestForm.date_request_start"
            @update:date="handleUpdateRequestStartDate"
          ></MtFormInputDate>
        </div>
        <div v-if="requestForm.show_time_ui" class="col-6 col-sm-3">
          <MtFormPullDown
            v-model="requestForm.start_time"
            :options="timeHourMinuteInterval_5"
            label="時：分"
            type="selection"
            @update:model-value="handleUpdateStartTime"
          />
        </div>
        <div tabindex="4" class="col-6 col-sm-3">
          <MtFormInputDate
            label="リクエスト終了日"
            v-model:date="requestForm.date_request_goal"
            @update:date="handleUpdateRequestEndDate"
          ></MtFormInputDate>
        </div>
        <div v-if="requestForm.show_time_ui" class="col-6 col-sm-3">
          <MtFormPullDown
            v-model="requestForm.end_time"
            :options="availableEndTimes"
            label="時：分"
            type="selection"
            @update:model-value="handleEndTimeUpdate"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div v-if="!flg_control_title_Request" class="col-12">
          <MtInputForm
            type="text"
            :filled="flg_control_title_Request"
            v-model="requestForm.title_request"
            :label="
              flg_control_title_Request
                ? '保存時に自動でタイトルを生成します'
                : 'リクエスト名 *'
            "
            :required="!flg_control_title_Request"
            :rules="[(val: string) => !!val || 'エラーメッセージ']"
          />
        </div>
        <div v-if="requestForm.title_request !== undefined">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '自動タイトル' }]"
            v-model="flg_control_title_Request"
            @update:model-value="handleRequestTitle"
          />
        </div>
        <div class="col q-ml-md">
          <MtInputForm
            v-model="requestForm.show_time_ui"
            :items="[{ label: '時刻' }]"
            type="checkbox"
            @update:model-value="handleTimeUIToggle"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="1" class="col-lg-4 col-md-4 col-sm-12">
          <MtFilterSelect
            label="診察券番号 "
            v-model:selecting="requestForm.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            :disable="disable_customer"
            autofocus
            custom-option
            @update:selecting="selectingCustomer"
            :rules="[aahValidations.validationRequired]"
          >
            <template #selectedCustomOption="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon
                      v-if="slotProps.opt.icon"
                      name="circle"
                      size="16px"
                      :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-12" v-if="requestForm.id_customer !== '' && illnessHistory.length > 0">
          <MtFormPullDown
            v-model="requestForm.id_illness_history"
            :options="illnessHistory"
            label="既往歴"
            type="selection"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div
          class="row col-lg-4 col-md-4 col-sm-12 column text-blue cursor-pointer"
        >
          <q-scroll-area style="height: calc(45px)">
            <div
              v-for="request in requestListByCustomer"
              :key="request.id_request"
              @click="openRequestDetail(request.id_request)"
            >
              {{ request.number_request }}
            </div>
          </q-scroll-area>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="2" class="col-lg-4 col-md-4 col-sm-12" v-if="isPet">
          <MtFilterSelect
            v-model:selecting="requestForm.id_pet"
            v-model:options="petList"
            :options-default="petListDefault"
            label="デフォルトペット"
            custom-option
            :disable="disable_pet"
            @update:selecting="updateDefaultPetDoctor"
            :rules="[aahValidations.validationRequired]"
          >
            <template #selectedItem="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon
                      v-if="slotProps.opt.icon"
                      name="circle"
                      size="16px"
                      :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12" tabindex="10">
          <MtInputForm
            type="text"
            v-model="requestForm.memo_service"
            label="予約オーダー 詳細・メモ"
            autogrow
          >
            <template #append>
              <q-icon
                name="add"
                class="cursor-pointer"
                @click="openAddTextTemplateModal"
              />
            </template>
          </MtInputForm>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '会計対象外' }]"
            v-model="requestForm.flg_non_charge"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormCheckBox
            v-model:checked="requestForm.flg_apply_insurance"
            label="保険適用"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <q-markup-table separator="none">
<!--            <thead>-->
<!--              <tr>-->
<!--                <th class="text-left">サービス</th>-->
<!--                <th-->
<!--                  v-for="(serviceUnit, index) in itemServiceUnitByServiceId"-->
<!--                  :key="index"-->
<!--                  class="text-left"-->
<!--                >-->
<!--                  {{ serviceUnit.name_item_service_unit }}-->
<!--                </th>-->
<!--              </tr>-->
<!--            </thead>-->
            <tbody>
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <MtFormPullDown
                    v-model="requestForm.id_service_item"
                    :options="itemServicesOption"
                    @update:selected="handleUpdateServiceItemUnit()"
                    label="カレンダー予約商品"
                    type="selection"
                  />
                </td>
                <td class="flex" style="height: 100%;">
                <div class="choice-chip-container">
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="option in itemServiceUnitByServiceId[requestForm.id_service_item]"
                      :key="option.value"
                      @click="handleUpdateServiceItemUnit(option)"
                      type="button"
                      class="choice-chip"
                      :class="{ 'choice-chip-selected': requestForm.id_service_item_unit === option.value }"
                    >
                      {{ option.label }}
                    </button>
                  </div>
                </div>
              </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
        <div tabindex="16" class="col-3">
          <InputEmployeeOptGroup
            v-model:selected="requestForm.id_employee_doctor"
            label="主担当"
            clearable
            class="clear-icon"
            dense
            show-select-default-employee
            @update:select-default-employee="
              selectDefaultEmployee('id_employee_doctor')
            "
          />
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="text-center modal-btn">
        <q-btn
          outline
          class="bg-grey-100 text-grey-800"
          @click="closeModal()"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          type="submit"
          tabindex="30"
          unelevated
          color="primary"
          class="q-ml-md"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="治療サービス 詳細・メモ"
    :options="memoTemplates"
    :data="requestForm"
    :single-option="true"
    @update:memo="handleUpdateRequestMemo"
  />
</template>

<style lang="scss" scoped>
.choice-chip-container {
  margin-bottom: 1rem;
}

.choice-chip {
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: #e5e7eb;
  color: #374151;
  border: none;
  outline: none;
}

.choice-chip:hover {
  background-color: #d1d5db;
}

.choice-chip-selected {
  background-color: #3b82f6;
  color: white;
}

.choice-chip-selected:hover {
  background-color: #2563eb;
}
.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
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
.header-sticky {
  position: sticky;
  width: 100%;
  height: 71px;
  background: white !important;
  top: 0;
  z-index: 100;
}
</style>