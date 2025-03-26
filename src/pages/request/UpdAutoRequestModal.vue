<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import {
  calculateDate,
  calculateDays,
  checkDateRange,
  concatenate,
  copyText,
  formatDate,
  formatDateWithTime,
  formatHoursMinutes,
  getDateByFormat,
  getDateTimeNow,
  getDateToday,
  getDaysAfter,
  getFullPetNameWithoutHonorific,
  getHoursAfter,
  getHoursAfterByDate,
  isBitSet
} from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import selectOptions from '@/utils/selectOptions'
import { LocalStorage } from 'quasar'
import aahMessages from '@/utils/aahMessages'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import useCommonStore from '@/stores/common'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { CliCommon, PetType } from '@/types/types'
import { fixedCode, noAutoCorrect, timeHourMinute, typeBooking } from '@/utils/enum'
import aahValidations from '@/utils/aahValidations'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import { CATEGORY_ITEM_SERVICE_PDF_PRINTING } from '@/utils/const/constServiceDetail'
import SearchIdexxTestListModal from '@/pages/request/serviceDetail/SearchIdexxTestListModal.vue'
import useCategoryStore from '@/stores/categories'
import useCliCommonStore from '@/stores/cli-common'
import useIllnessHistoryStore from '@/stores/illness-history'
import dayjs from 'dayjs'
import UpdatePetCustodyModal from '@/pages/petCustody/UpdatePetCustodyModal.vue'
import useServiceDetailStore from '@/stores/service-details'
import useTask from '@/stores/task'
import usePrescriptionStore from '@/stores/prescription'
import QuickPrescriptionDetailListBox from '@/pages/request/prescription/QuickPrescriptionDetailListBox.vue'
import usePetBioStore from '@/stores/pet-bios'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import OptionItemServiceUnitModalUI from '@/pages/request/serviceDetail/OptionItemServiceUnitModalUI.vue'
import QuickInjectDetailListBox from '@/pages/request/inject/QuickInjectDetailListBox.vue'
import { event_bus } from '@/utils/eventBus'

type RequestFormType = {
  id_request: Number
  date_request_start: string
  date_request_goal: string
  title_request: string
  number_request: string
  code_customer: string
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
  flg_complete: boolean,
  id_prescriptionUI: string
}

const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const categoryStore = useCategoryStore()
const petBioStore = usePetBioStore()
const illnessHistoryStore = useIllnessHistoryStore()

const serviceDetailStore = useServiceDetailStore()
const cliCommonStore = useCliCommonStore()
const prescriptionStore = usePrescriptionStore()

const { getDoctors } = storeToRefs(employeeStore)
const router = useRouter()
const commonStore = useCommonStore()

const { getCustomerOption } = storeToRefs(customerStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)

// const authUser = computed(() => authStore.authUser)

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

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const requestForm = reactive<RequestFormType>({
  id_request: null,
  date_request_start: getDateToday(),
  date_request_goal: getDateToday(),
  title_request: '',
  number_request: '',

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

  id_employee_doctor: '',
  id_employee_staff: '',
  id_employee_request: '',
  flg_in_app_payment: false,
  id_clinic: null,
  flg_complete: false,
  id_pet_illness_history: [],
  id_prescriptionUI: `PH_${getDateTimeNow().replace(
    /-/g,
    ''
  )}_${Math.floor(Math.random() * 100000)}`
})

const prescriptionHeader1 = ref({
  id_prescription: null,
  flg_non_charge: false,
  flg_all_prepared: false,
  flg_prescription_order: false,
  flg_delivered: false,
  flg_next_cart: false,
  flg_apply_insurance: false,
  id_pet_illness_history: [],
  id_request: null,
  id_pet_bio_info: null,
  val_weight: null,
  id_pet: requestForm.id_pet,
  title_prescription: '',
  type_booking: 1,
  number_prescription: '',
  id_customer: null,
  total_days_dose: 1,
  date_start: getDateToday(),
  date_end: getDateToday(),
  datetime_delivered: null,
  datetime_cancel: null,
  datetime_pickup_plan: null,
  memo_cancel: null,
  flg_cancel: false,
  id_clinic: '',
  id_employee_doctor: '',
  id_employee_delivered: '',
  memo_prescription: '',
  number_request: '',
  id_prescriptionUI: requestForm.id_prescriptionUI
})


const injectForm = ref({
  id_inject: null,
  number_inject: '',
  type_inject_route: null,
  flg_non_charge: false,
  flg_delivered: false,
  flg_next_cart: false,
  id_pet_illness_history: [],
  id_request: null,
  id_pet_bio_info: null,
  val_weight: null,
  id_pet: null,
  title_inject: '',
  type_booking: 1,
  id_customer: null,
  date_start: null,
  date_end: null,
  time_start: null,
  memo_cancel: null,
  flg_cancel: false,
  id_clinic: '',
  id_employee_doctor: defaultEmployee,
  memo_inject: '',
  booking: {
    FlgUI: false
  },
  flg_apply_insurance: false
})


const time_range = ref([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])

const isEdit = ref(false)
const isPet = ref(false)

const requestListByCustomer = ref([])

const customerList = ref([])
const customerListDefault = reactive([])

const illnessHistoryList = ref([])

const serviceGroupList = ref([])
const serviceGroupDefaultList = reactive([])

const serviceDetailGroupList = ref([])
const prescriptionGroupList = ref([])
const injectGroupList = ref([])
const mixGroupList = ref([])

const taskGroupList = ref([])
const taskGroupListDefault = reactive([])


const allServiceGroup = ref([])
const allTaskGroup = ref([])

const selectedServices = ref([])
const selectedPrescriptionDetailList = ref([])
const selectedInjectDetailList = ref([])

const selectedTaskList = ref([])

const taskDepList = ref([])

const tab = ref('im_g')


const petList: any = ref([])
const petListDefault: any = reactive([])
const bookingRequestDetails = ref([] as Array<any>)


const valWeightUI = computed(() => {
  if (
    prescriptionHeader1.value.val_weight
  ) {
    return `${(
      prescriptionHeader1.value?.val_weight / 1000
    ).toFixed(2)} Kg`
  }
  return ''
})

const childFormRefs = ref([])
const childFormInjectRefs = ref([])

const setChildRef = (index) => (el) => {
  if (el) {
    childFormRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    delete childFormRefs.value[index]
  }
}

const setChildFormInjectRefs = (index) => (el) => {
  if (el) {
    childFormInjectRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    delete childFormInjectRefs.value[index]
  }
}


const removePrescriptionItem = (key: string, index: any) => {
  selectedPrescriptionDetailList.value.splice(index, 1)
  bookingRequestDetails.value.splice(index, 1)
  prescriptionStore.removeIndexFromDetailList(index)
  childFormRefs.value.splice(index, 1)
}

const removeGroup = (key: any, index) => {
  selectedPrescriptionDetailList.value.findIndex((o) => o.process_drip.id_prescription_detail == key)

  if (key != -1) {
    prescriptionStore.removeIndexFromDetailList(index)
    childFormRefs.value.splice(index, 1)
    selectedPrescriptionDetailList.value.splice(index, 1)
    let child_array = selectedPrescriptionDetailList.value.filter((child) => child?.process_drip?.id_prescription_detail_ref == key)

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


function selectedPetBioInfo(value: any) {
  if (value) {
    prescriptionHeader1.value.val_weight = petBioStore.getPetBioOptionDefault.find(
      (petBioObj: any) => petBioObj.id_pet_bio_info === value
    ).val_weight
  }
}

const callBackOption = (option: any) => {
  if (option) {
    onTop30CheckISO(new Event('click'), [], option, null, true)
  }
}

const callBackOptionInject = (option: any) => {
  if (option) {
    onTop30CheckISOInject(new Event('click'), [], option, null, true)
  }
}


const receivedISU = ref({
  selected: false,
  id_item_service_unit: null,
  name_service_item_unit: null
})

const onTop30CheckISOInject = async (
  list: any,
  ISO: any,
  IS: any,
  callBack: any = false
) => {
  const petSelected = petListDefault.find((v) => v.value == requestForm.id_pet)

  let tempHistory = { ...ISO }

  let selectedIS = tempHistory.id_item_service_child

  if (selectedIS.flg_merge_price && !callBack) {
    return
  }

  if (!callBack && tempHistory.item_service_unit_list.length > 0) {
    receivedISU.value.selected = false

    await mtUtils.smallPopup(OptionItemServiceUnitModalUI, {
      itemServiceUnitList: tempHistory.item_service_unit_list,
      selectedUnit: (unit) => {
        receivedISU.value = { ...unit }
      },
      class: 'inject-detail-hover'
    })

    if (!receivedISU.value.selected) return
  }

  if (callBack && tempHistory) {

    const itemService = orderAlltop30.value.find(
      (item) => item.id_item_service == tempHistory.id_item_service_parent
    )
    if (itemService) {
      const item_service_option = itemService.item_service_option_list.find(
        (O) => O.id_item_service_option == tempHistory.id_item_service_option
      )

      if (
        item_service_option &&
        item_service_option.item_service_unit_list &&
        item_service_option.item_service_unit_list.length &&
        item_service_option.item_service_unit_list.length > 0
      ) {
        item_service_option.item_service_unit_list.map((unit, idx) => {
          if (idx !== 0) return
          const tempService = {
            ...unit,
            checked: idx == 0,
            val_dosage_decided: idx == 0 ? 1 : 0,
            item_service: selectedIS,
            name_category1: selectedIS.name_category1,
            name_category2: selectedIS.name_category2,
            code_category2: selectedIS.code_category2,
            id_item_service: selectedIS.id_item_service,
            id_category1: selectedIS.id_category1,
            id_category2: selectedIS.id_category2,
            process_helper: tempHistory.process_helper,
            quantity: 1,
            num_conduct: 1,
            id_pet: requestForm.id_pet,
            flg_prevention: selectedIS.flg_prevention,
            type_prevention: selectedIS.type_prevention,
            name_inject_display: selectedIS.name_item_service,
            id_item_service_unit: unit.id_item_service_unit,
            val_efficacyingredient: unit.val_efficacyingredient,
            id_employee_doctor: requestForm.id_employee_doctor,
            id_employee_staff: requestForm?.id_employee_staff,
            flg_non_charge: requestForm.flg_complete,
            type_detail: 3,
            show: false
          }
          selectedInjectDetailList.value.push(tempService)
        })
      }
    }
    return
  }

  const tempService = {
    ...receivedISU.value,
    checked: true,
    item_service: selectedIS,
    name_category1: selectedIS.name_category1,
    name_category2: selectedIS.name_category2,
    code_category2: selectedIS.code_category2,
    id_item_service: selectedIS.id_item_service,
    id_category1: selectedIS.id_category1,
    id_category2: selectedIS.id_category2,
    quantity: 1,
    id_pet: petSelected.value,
    flg_prevention: selectedIS.flg_prevention,
    type_prevention: selectedIS.type_prevention,
    name_inject_display: receivedISU.value.name_service_item_unit,
    id_item_service_unit: receivedISU.value.id_item_service_unit,
    val_efficacyingredient: receivedISU.value.val_efficacyingredient,
    id_employee_doctor: requestForm?.id_employee_doctor,
    id_employee_staff: requestForm.id_employee_staff,
    flg_non_charge: requestForm.flg_complete,
    val_dosage_decided: 1,
    type_detail: 1,
    show: false,
    id_pet_illness_history: requestForm.id_pet_illness_history
  }
  selectedInjectDetailList.value.push(tempService)
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
  const petSelected = petListDefault.find((v) => v.value == requestForm.id_pet)

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
    flg_apply_insurance: requestForm.flg_apply_insurance,
    flg_prevention: selectedIS.flg_prevention,
    type_prevention: selectedIS.type_prevention,
    name_prescription_display: selectedIS.name_item_service,
    name_item_service: selectedIS.name_item_service,
    id_employee_doctor: requestForm?.id_employee_doctor,
    id_employee_staff: requestForm.id_employee_staff,
    flg_non_charge: requestForm?.flg_non_charge,
    process_drip: {
      id_prescription_detail: `PD_${getDateTimeNow().replace(
        /-/g,
        ''
      )}_${Math.floor(Math.random() * 100000)}`,
      id_prescription_detail_ref: tempHistory?.id_prescription_detail_ref ?? '',
      isPlusItem: !!tempHistory.id_prescription_detail_ref
    },
    show: false,
    type_detail: !!tempHistory.id_prescription_detail_ref ? 3 : 1
  }

  selectedPrescriptionDetailList.value.push(tempService)
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

const setPrescriptionHeaderGroup = (prescription_detail_group) => {
  prescriptionGroupList.value = prescription_detail_group
  prescriptionHeader1.value.id_pet = requestForm.id_pet
  prescriptionHeader1.value.id_customer = requestForm.id_customer
  prescriptionHeader1.value.id_employee_doctor = requestForm.id_employee_doctor
  prescriptionHeader1.value.date_start = requestForm.date_request_start
  prescriptionHeader1.value.date_end = requestForm.date_request_goal
  prescriptionStore.setPrescriptionHeaderForQuickRequest(prescriptionHeader1.value)
}

const setInjectHeaderGroup = (inject_detail_group) => {
  injectGroupList.value = inject_detail_group
  injectForm.value.id_pet = requestForm.id_pet
  injectForm.value.id_customer = requestForm.id_customer
  injectForm.value.id_employee_doctor = requestForm.id_employee_doctor
  injectForm.value.date_start = requestForm.date_request_start
  injectForm.value.date_end = requestForm.date_request_goal
}

const tabChanged = async (v: string) => {

  if (v == 'sd_g') {
    const [service_group_list] = await mtUtils.promiseAllWithLoader([
      mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/service_groups', {
        isServiceGroup: true
      })])

    if (service_group_list) {
      serviceDetailGroupList.value = service_group_list
    }

  } else if (v == 'pd_g') {
    const [prescription_detail_group] = await mtUtils.promiseAllWithLoader([
      mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/service_groups', {
        isPrescriptionGroup: true
      })])

    if (prescription_detail_group) {
      setPrescriptionHeaderGroup(prescription_detail_group)
    }
  } else if (v == 'id_g') {

    const [inject_detail_group] = await mtUtils.promiseAllWithLoader([
      mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/service_groups', {
        isInjectGroup: true
      })])

    if (inject_detail_group) {
      setInjectHeaderGroup(inject_detail_group)
    }

  } else if (v == 'im_g') {

    const [other_group] = await mtUtils.promiseAllWithLoader([
      mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/service_groups', {
        isOtherGroup: true
      })])


    let Category_Inject = ['MD2', 'MD10', 'MD11']
    let Category_C_Inject = ['MD12_1', 'MD13_1', 'MD14_1']


    if (other_group) {
      mixGroupList.value = other_group.map((sg: any) => {
        const temp = sg
        temp.service_group_item_list = temp.service_group_item_list.map((sGI: any) => {
          let isServiceItem = false
          let isPrescriptionItem = false
          let isInjectItem = false

          const code_category2 = sGI.item_service_unit.id_item_service.code_category2
          const containsInject = Category_Inject.some(category => code_category2.startsWith(category))
          const containsCInject = Category_C_Inject.some(category => code_category2 === category)

          if (containsInject || containsCInject) {
            isInjectItem = true
          } else if (sGI.item_service_unit.id_item_service.flg_service) {
            isServiceItem = true
          } else {
            isPrescriptionItem = true
          }

          return {
            ...sGI,
            isChecked: true,
            isServiceItem,
            isPrescriptionItem,
            isInjectItem,
            item: sGI.item_service_unit.id_item_service
          }
        })
        return temp
      })
    }
  }
}

const isShowIdexxName = (value: string) => {
  if (value && typeof value == 'string') value = JSON.parse(value)

  if (value && value.length > 0) return true
  return false
}

async function openItemServiceModel(row, key?) {
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })
}


const clickDateTimeRequestStart = (value: any) => {
  if (value) {
    requestForm.date_request_goal = value
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
  requestForm.id_customer = value
  isPet.value = false
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
    await mtUtils.promiseAllWithLoader([
      customerStore.selectCustomerOptions(value),
      fetchRequestByCustomer(value)
    ])

    let selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      requestForm.code_customer = selectedCustomer.code_customer
      requestForm.code_ahmics_customer = selectedCustomer.code_ahmics_customer
      requestForm.name_customer = concatenate(
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
              })?.text1 ?? ''
          })
        })
        petList.value = [...petListDefault]
        isPet.value = true
        if (!isEdit.value && petList.value.length > 0) {
          requestForm.id_pet =
            petListDefault.find((pet: any) => pet.id_pet === props?.id_pet)
              ?.id_pet ?? petListDefault[0]?.id_pet
          await updateDefaultPetDoctor(requestForm.id_pet)
        }
      }
    }
  } else {
    requestForm.code_customer = ''
    requestForm.code_ahmics_customer = ''
    requestForm.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}

const selectServiceGroup = (id_service_group: any) => {
  allServiceGroup.value.length = 0
  allServiceGroup.value = serviceGroupDefaultList.filter((sg) => sg.id_service_group == id_service_group)
}

const onTaskGroupCheck = async (id_task_group: any) => {
  const selected: any = allTaskGroup.value.find(
    (v) => v.id_task_group == id_task_group
  )
  let plan_HH_MM

  let newTime = getHoursAfter(1)
  let newMinute = formatHoursMinutes(newTime).split(':')[1]
  if (newMinute > 45) {
    plan_HH_MM = formatDateWithTime(getHoursAfterByDate(newTime, 1), 'HH') + ':00'
  } else {
    plan_HH_MM = formatHoursMinutes(newTime).split(':')[0] + ':' + Math.ceil(newMinute / 15) * 15
  }

  const newArray = selected.task_group_item_list.map(async (item) => {
    const tempTask = {
      ...item,
      plan_day: 'today',
      today_plan: requestForm.date_request_start,
      plan_HH_MM: plan_HH_MM,
      todatDateTime: formatDateWithTime(getDateTimeNow()),
      type_link1: 1,
      id_link1: requestForm.number_request,
      id_employee_request: requestForm.id_employee_request,
      type_department: item.type_task_place,
      place_task: item.place_task
    }
    return tempTask
  })
  const updateArray = await Promise.all(newArray)
  selectedTaskList.value = [...selectedTaskList.value, ...updateArray]
}

const setTime = (hour: Number, item: any) => {
  let day = item.plan_day
  item.today_plan =
    day == 'today'
      ? getDateToday()
      : day == 'tomorrow'
        ? getDaysAfter(1)
        : getDaysAfter(2)
  hour = hour < 10 ? '0' + hour : hour
  item.plan_HH_MM = hour + ':00'
}


const mapFlgInsurance = async (ISU: any = null, IS: any = null) => {
  let apply_insurance = requestForm.flg_apply_insurance
  if (apply_insurance) {
    const pet = useCustomerStore().getCustomer.pets?.find(
      (v) => v.id_pet == requestForm.id_pet
    )
    if (
      pet &&
      pet.pet_insurance &&
      pet.pet_insurance.length &&
      pet.pet_insurance.length > 0
    ) {
      let pet_insurance = pet.pet_insurance.find((v) => v.flg_insurance_main)

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
          apply_insurance = isBitSet(
            itemService.type_insurer,
            pet_insurance.code_insurer
          )
        }
      }
    }
  }
  return apply_insurance
}

const updateSelectedItem = (value) => {
  if (value && selectedServices.value && selectedServices.value.length > 0) {

    selectedServices.value.map((service) => {
      service.id_pet_illness_history.length = 0
      service.id_pet_illness_history.push(...value)
    })
  }

}


const getItem = (value: string) => value

const openSearchIdexxTestList = async (key) => {
  await mtUtils.mediumPopup(SearchIdexxTestListModal)
  if (serviceDetailStore.getSelectedIdexx.length > 0) {
    selectedServices.value[key].list_idexx_test =
      serviceDetailStore.getSelectedIdexx

    serviceDetailStore.resetSelectedIdexx()
  }
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

const showIdexxName = (value: Array<string>) => {
  if (value && typeof (value) == 'string')
    value = JSON.parse(value)

  if (value && value.length > 0)
    return value
      .map((v) => {
        const name = commonStore.getCommonIdexxSearchList.find(
          (c) => c.code_func2 == v
        )?.name_common
        return name
      })
      .join(', ')
  else return '-'
}

const onServiceGroupCheckInject = (keyword: any, tempMixServiceGroup: any = null) => {
  let selected

  if (!tempMixServiceGroup) {
    selected = injectGroupList.value.find((v) => v.code_service_group === keyword.code_service_group)
    selected.checkbox = !selected.checkbox
  } else {
    selected = tempMixServiceGroup.find((v) => v.code_service_group === keyword.code_service_group)
    selected.service_group_item_list = selected.service_group_item_list.filter((sgi) => sgi.isInjectItem && sgi.isChecked)
    selected.checkbox = !selected.checkbox
  }

  if (selected.checkbox) {
    const newArray = selected.service_group_item_list.map((item) => {
      return {
        ...item.item_service_unit,
        id_item_service:
        item.item_service_unit?.id_item_service?.id_item_service,
        item_service: item.item_service_unit?.id_item_service,

        name_category1: item.item_service_unit?.id_item_service?.name_category1,
        name_category2: item.item_service_unit?.id_item_service?.name_category2,
        code_category2: item.item_service_unit?.id_item_service?.code_category2,

        flg_prevention: item.item_service_unit?.id_item_service.flg_prevention,
        type_prevention:
        item.item_service_unit?.id_item_service.type_prevention,
        name_inject_display: item.item_service_unit.name_service_item_unit,
        val_dosage_decided: 1,
        val_efficacyingredient: item.item_service_unit.val_efficacyingredient,
        id_employee_doctor: requestForm?.id_employee_doctor,
        id_employee_staff: requestForm.id_employee_staff,

        id_pet_illness_history: requestForm.id_pet_illness_history,
        id_employee_doctor: requestForm.id_employee_doctor,
        id_pet: requestForm.id_pet,
        flg_prevention: item.item_service_unit?.id_item_service.flg_prevention,
        type_prevention:
        item.item_service_unit?.id_item_service.type_prevention,
        flg_non_charge: requestForm.flg_complete,
        id_inject_detail_UI: `ID_${getDateTimeNow().replace(
          /-/g,
          ''
        )}_${Math.floor(Math.random() * 100000)}`
      }
    })
    selectedInjectDetailList.value = [...selectedInjectDetailList.value, ...newArray]
  }
}

const onServiceGroupMixed = async (keyword) => {
  prescriptionHeader1.value.id_pet = requestForm.id_pet
  prescriptionHeader1.value.id_customer = requestForm.id_customer
  prescriptionHeader1.value.id_employee_doctor = requestForm.id_employee_doctor
  prescriptionHeader1.value.date_start = requestForm.date_request_start
  prescriptionHeader1.value.date_end = requestForm.date_request_goal
  prescriptionStore.setPrescriptionHeaderForQuickRequest(prescriptionHeader1.value)

  injectForm.value.id_pet = requestForm.id_pet
  injectForm.value.id_customer = requestForm.id_customer
  injectForm.value.id_employee_doctor = requestForm.id_employee_doctor
  injectForm.value.date_start = requestForm.date_request_start
  injectForm.value.date_end = requestForm.date_request_goal

  onMultipleKeywordCheck(keyword, [...JSON.parse(JSON.stringify(mixGroupList.value))])
  onServiceGroupCheckInject(keyword, [...JSON.parse(JSON.stringify(mixGroupList.value))])
  onServiceGroupCheck(keyword, [...JSON.parse(JSON.stringify(mixGroupList.value))])

}

const onServiceGroupCheck = async (keyword: any, tempMixServiceGroup: any = null) => {
  let selected = null

  if (!tempMixServiceGroup)
    selected = serviceDetailGroupList.value.find((v) => v.code_service_group === keyword.code_service_group)
  else {
    selected = tempMixServiceGroup.find((v) => v.code_service_group === keyword.code_service_group)
    selected.service_group_item_list = selected.service_group_item_list.filter((sgi) => sgi.isServiceItem && sgi.isChecked)
  }
  
  const newArray = selected.service_group_item_list.map(async (item) => {
    const tempService = {
      ...item.item_service_unit,
      showTimeOption: false,
      id_item_service: item.item_service_unit?.id_item_service?.id_item_service,
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
      datetime_service_start: requestForm?.date_request_start,
      datetime_service_end: requestForm?.date_request_start,
      time_service_start: '00:00',
      time_service_end: '00:00',
      flg_booking: requestForm?.flg_booking,
      type_booking: 2,
      flg_non_charge: requestForm.flg_non_charge,
      flg_ui_datetime_service_end: false,
      flg_schedule: false,
      id_pet_illness_history: [...requestForm.id_pet_illness_history],
      id_employee_doctor: requestForm?.id_employee_doctor,
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
      }
    }

    if (tempService.code_category2 == 'CO5_6') {
      tempService.flgRabiesUi = true
      tempService.rabies.date_exempt_start = tempService.datetime_service_start
    }
    return tempService
  })
  const updateArray = await Promise.all(newArray)
  selectedServices.value = [...selectedServices.value, ...updateArray]
}


const selectTaskGroup = (id_task_group: any) => {
  allTaskGroup.value.length = 0
  allTaskGroup.value = taskGroupListDefault.filter((sg) => sg.id_task_group == id_task_group)
}

const closeModal = () => {
  emits('close')
}
const handleAutoRequestTitle = () => {
  // let autoTitle = ''
  const selectedEmployeeDoctor = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_doctor
  )?.label
  const selectedEmployeeStaff = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_staff
  )?.label
  const fixedTextCustomer = requestForm.name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeStaff ? '/ 担当: ' : ''
  let autoTitle =
    (requestForm.date_request_start !== undefined
      ? requestForm.date_request_start
      : '') +
    ' ' +
    (requestForm.code_customer !== undefined ? requestForm.code_customer : '') +
    ' ' +
    (requestForm.name_customer !== undefined ? requestForm.name_customer : '') +
    (fixedTextCustomer !== undefined ? fixedTextCustomer : '') +
    ' ' +
    (selectedEmployeeDoctor !== undefined ? selectedEmployeeDoctor : '') +
    (fixedTextDoctor !== undefined ? fixedTextDoctor : '') +
    ' ' +
    (fixedTextStaff !== undefined
      ? fixedTextDoctor !== ''
        ? fixedTextStaff
        : fixedTextStaff.replace('/ ', '')
      : '') +
    (selectedEmployeeStaff !== undefined ? selectedEmployeeStaff : '')
  return autoTitle
}
const iconClickUI = ref(false)
const onMultipleKeywordCheck = async (keyword: any, tempMixServiceGroup: any = null) => {
  if (iconClickUI.value) {
    return
  }
  const petSelected = petListDefault.find((v) => v.value == requestForm.id_pet)
  let selected

  if (!tempMixServiceGroup) {
    selected = prescriptionGroupList.value.find((v) => v.code_service_group === keyword.code_service_group)
  } else {
    selected = tempMixServiceGroup.find((v) => v.code_service_group === keyword.code_service_group)
    selected.service_group_item_list = selected.service_group_item_list.filter((sgi) => sgi.isPrescriptionItem && sgi.isChecked)
  }


  prescriptionStore.setSelectedTab(3)
  prescriptionStore.resetSuggestCounter()
  const newArray = selected.service_group_item_list.map((item) => ({
    ...item,
    selectedTab: 3,
    id_service_group: selected.id_service_group,
    ...item.item,
    flg_apply_insurance: requestForm?.flg_apply_insurance,
    id_employee_doctor:
      requestForm?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    id_employee_staff:
      requestForm?.id_employee_doctor ??
      JSON.parse(localStorage.getItem('id_employee')),
    process_drip: {
      id_prescription_detail: `PD_${getDateTimeNow().replace(
        /-/g,
        ''
      )}_${Math.floor(Math.random() * 100000)}`,
      id_prescription_detail_ref: null,
      isPlusItem: false
    }
  }))
  selectedPrescriptionDetailList.value = [...selectedPrescriptionDetailList.value, ...newArray]
  // TODO NEED TO FIX THIS BOOKING BUG FOR GROUP AND OnDateClick

  selectedPrescriptionDetailList.value.forEach((item) => {
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
}


const save = async () => {
  if (
    !requestForm.id_request &&
    !requestForm.id_request &&
    requestListByCustomer.value &&
    requestListByCustomer.value.length > 0
  ) {
    const confirmation = await mtUtils.confirm(
      '対象オーナーには未完了のリクエストが存在します。\n新規作成しますか？',
      '確認',
      'OK'
    )
    if (!confirmation) return
  }

  if (
    !checkDateRange([
      {
        start_date: requestForm.date_request_start,
        end_date: requestForm.date_request_goal
      }
    ])
  ) return false


  for (const element of selectedServices.value) {
    const petSelected = petListDefault.find((v) => v.value == requestForm.id_pet)

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
      if (!petSelected.name_kana_pet)
        validationIdexx.push('ペットカナ名')
      if (!petSelected.id_cm_animal) validationIdexx.push('動物種')
      if (!petSelected.id_cm_breed) validationIdexx.push('品種')
      if (!petSelected.type_pet_gender)
        validationIdexx.push('ペット性別')
      if (!petSelected.date_birth)
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
  }

  requestForm.name_employee_request = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_request
  )?.label

  requestForm.name_employee_staff = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_staff
  )?.label

  requestForm.title_request = handleAutoRequestTitle()

  let payload = { ...requestForm }

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
        row: (index + 1),
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

  let injectHeader = injectForm.value
  let allFormInjectData = []
  const tempValidationInjectData = []


  tempValidationInjectData.push(aahValidations.injectHeaderValidation(injectHeader))

  injectHeader = {
    ...injectHeader,
    datetime_start: `${injectHeader?.date_start} 00:00:00`,
    datetime_end: `${injectHeader?.date_end} 00:00:00`
  }

  let merge_item_unit_list = []
  allFormInjectData = Object.values(childFormInjectRefs.value)
    .map((childForm, index) => {
      const childData = childForm.getFormData()

      const booking = childData.booking?.flg_booking ? childData.booking : null

      if (booking) {
        const dateBookingConfirmed: string = booking.date_booking_confirmed!

        const timeBookingConfirmed: string = booking.time_booking_confirmed!

        var datetimeBookingConfirmed = new Date(dateBookingConfirmed)

        datetimeBookingConfirmed =
          getDateByFormat(datetimeBookingConfirmed, 'YYYY/MM/DD') +
          ' ' +
          (timeBookingConfirmed ?? '00:00') +
          ':00'
      }

      let datetime_start = `${injectHeader?.date_start} 00:00:00`
      let datetime_end = `${injectHeader?.date_end} 00:00:00`


      if (childData.type_detail == 2 || childData.type_detail == 3) {
        if (
          childData.effort_unit_list &&
          childData.effort_unit_list.length > 0
        ) {
          childData.effort_unit_list.map((effort_unit: any) => {
            merge_item_unit_list.push({
              ...childData,
              date_start: injectHeader?.date_start,
              date_end: injectHeader?.date_end,
              datetime_start: datetime_start,
              datetime_end: datetime_end,
              id_employee_doctor: injectHeader?.id_employee_doctor,
              id_pet: injectHeader?.id_pet,
              id_clinic: localStorage.getItem('id_clinic'),
              name_inject_display: effort_unit.label,
              name_service_item_unit: effort_unit.label,
              ...effort_unit
            })
          })
        }
        return null
      }

      return {
        ...childData,
        // row: pdListLength + (index + 1),
        date_start: injectHeader?.date_start,
        date_end: injectHeader?.date_end,
        datetime_start: datetime_start,
        datetime_end: datetime_end,
        id_employee_doctor: injectHeader?.id_employee_doctor,
        id_pet: injectHeader?.id_pet,
        id_clinic: localStorage.getItem('id_clinic'),
        booking: booking
          ? {
            ...childData.booking,
            datetime_booking_confirmed: datetimeBookingConfirmed
          }
          : null
      }
    })
    .filter((item) => item !== null)

  allFormInjectData.push(...merge_item_unit_list)

  allFormInjectData.map((iDObj) => {
    tempValidationInjectData.push(aahValidations.injectDetailValidation(iDObj))
  })

  const resultValidationInject = await Promise.all(tempValidationInjectData)

  if (resultValidationInject.includes(false)) {
    return
  }

  let res = await mtUtils.callApi(selectOptions.reqMethod.POST, 'requests', payload)

  if (res) {
    requestForm.id_request = res.id_request
    requestForm.number_request = res.number_request

    await saveServiceDetail()

    if (prescriptionHeader1.value && prescriptionHeader1.value.id_pet && allFormData && allFormData.length > 0) {
      await savePrescriptionGroup()
    }

    if (injectForm.value && injectForm.value.id_pet && allFormInjectData && allFormInjectData.length > 0) {
      await saveInjectGroup()
    }
    
    
    await mtUtils.autoCloseAlert(aahMessages.success)

    if (props.updatedFlg.value === false) {
      router.push({ name: 'RequestDetail', params: { id: res.id_request } })
      emits('close')
    }
  }

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

const saveServiceDetail = async () => {
  const petSelected = petListDefault.find((v) => v.value == requestForm.id_pet)
  try {
    let status = true
    let status_custody_control = false
    let flg_hospitalization = false
    const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

    let dateRanges = []
    selectedServices.value.forEach((element: any) => {
      if (Boolean(element.flg_ui_datetime_service_end)) {
        dateRanges.push({
          start_date: element.datetime_service_start,
          end_date: element.datetime_service_end
        })
      }
    })
    if (dateRanges && dateRanges.length > 0 && !checkDateRange(dateRanges))
      return false
    let selectedSDIndex = 0
    for (const element of selectedServices.value) {
      // IDEXX CREATING VALIDATION
      if (
        element.list_idexx_test &&
        typeof element.list_idexx_test == 'string' &&
        JSON.parse(element.list_idexx_test)?.length > 0 &&
        !JSON.parse(element.list_idexx_test).includes(noAutoCorrect)
      ) {
        let validationIdexx = []
        if (!element.id_employee_doctor) validationIdexx.push('担当医')
        if (!petSelected.name_kana_pet)
          validationIdexx.push('ペットカナ名')
        if (!petSelected.id_cm_animal) validationIdexx.push('動物種')
        if (!petSelected.id_cm_breed) validationIdexx.push('品種')
        if (!petSelected.type_pet_gender)
          validationIdexx.push('ペット性別')
        if (!petSelected.date_birth)
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
        id_request: requestForm.id_request,
        id_customer: requestForm.id_customer,
        id_pet: requestForm.id_pet,
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
        type_service: element.type_service ? element.type_service
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

      try {
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
          const submit_idexx = await serviceDetailStore.submitServiceDetailIdexx(createIdexxData)
          if (submit_idexx?.uiURL) window.open(submit_idexx.uiURL, '_blank')
        }
      } catch (error) {
        await mtUtils.autoCloseAlert(`${store.name_item_service} is failed to create.`)
        status = false
      }
      selectedSDIndex++
    }

    if (status) {
      if (status_custody_control) {
        const create_custody_control = selectedServices.value.filter(
          (v) => v.flg_pet_custody_control
        )
        await mtUtils.mediumPopup(UpdatePetCustodyModal, {
          data: create_custody_control,
          id_customer: props.id_customer,
          id_pet: petSelected?.id_pet,
          id_request: requestForm.id_request,
          flg_hospitalization: flg_hospitalization
        })
      }
    }
  } catch (error) {
    await mtUtils.autoCloseAlert('Service Detail Failed to create')
  }
}

const handleAutoPrescriptionTitle = (value: any = null) => {
  const date_start = prescriptionHeader1.value.date_start
  const date_end = prescriptionHeader1.value?.date_end ?? ''
  if (date_end == '') {
    prescriptionHeader1.value.title_prescription = `${getFullPetNameWithoutHonorific(
      customerStore.getCustomer?.pets?.find(
        (petObj: any) =>
          petObj.id_pet === requestForm?.id_pet
      ),
      customerStore.getCustomer
    )} 様 の処方箋（ ${date_start} ）`
    return
  }
  prescriptionHeader1.value.title_prescription = `${getFullPetNameWithoutHonorific(
    customerStore.getCustomer?.pets?.find(
      (petObj: any) =>
        petObj.id_pet === requestForm.id_pet
    ),
    customerStore.getCustomer
  )} 様 の処方箋（ ${date_start} ～  ${date_end} ）`
}

const savePrescriptionGroup = async () => {
  handleAutoPrescriptionTitle()

  const response = await prescriptionStore.submitPrescriptionObj(
    requestForm.id_request,
    { ...prescriptionHeader1.value, id_request: requestForm.id_request }
  )

  if (response?.id_prescription) {
    let allFormData = Object.values(childFormRefs.value).map(
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
          row: (index + 1),
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

    allFormData = allFormData.map((pdObj: any) => {
      const temp = {
        ...pdObj,
        id_prescription: response.id_prescription
      }

      temp.prescription_detail_assort_list = temp.prescription_detail_assort_list.map((pdaObj: any) => {
        return {
          ...pdaObj,
          id_prescription: response.id_prescription
        }
      })
      return temp
    })

    await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      '/prescription_details',
      { prescription_detail_list: allFormData }
    )
  }


}


const handleAutoInjectTitle = (value: any = null) => {
  const date_start = injectForm.value.date_start
  const date_end = injectForm.value?.date_end ?? ''
  if (date_end == '') {
    injectForm.value.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
      petObj.id_pet === injectForm.value.id_pet), customerStore.getCustomer)} 様 の注射/点滴（ ${date_start} ）`
    return
  }
  injectForm.value.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
    petObj.id_pet === injectForm.value.id_pet), customerStore.getCustomer)} 様 の注射/点滴（ ${date_start} ～  ${date_end} ）`
}


const saveInjectGroup = async () => {
  let injectHeader = injectForm.value
  let allFormInjectData
  const tempValidationInjectData = []


  tempValidationInjectData.push(aahValidations.injectHeaderValidation(injectHeader))

  injectHeader = {
    ...injectHeader,
    datetime_start: `${injectHeader?.date_start} 00:00:00`,
    datetime_end: `${injectHeader?.date_end} 00:00:00`
  }

  let merge_item_unit_list = []
  allFormInjectData = Object.values(childFormInjectRefs.value)
    .map((childForm, index) => {
      const childData = childForm.getFormData()

      const booking = childData.booking?.flg_booking ? childData.booking : null

      if (booking) {
        const dateBookingConfirmed: string = booking.date_booking_confirmed!

        const timeBookingConfirmed: string = booking.time_booking_confirmed!

        var datetimeBookingConfirmed = new Date(dateBookingConfirmed)

        datetimeBookingConfirmed =
          getDateByFormat(datetimeBookingConfirmed, 'YYYY/MM/DD') +
          ' ' +
          (timeBookingConfirmed ?? '00:00') +
          ':00'
      }

      let datetime_start = `${injectHeader?.date_start} 00:00:00`
      let datetime_end = `${injectHeader?.date_end} 00:00:00`


      if (childData.type_detail == 2 || childData.type_detail == 3) {
        if (
          childData.effort_unit_list &&
          childData.effort_unit_list.length > 0
        ) {
          childData.effort_unit_list.map((effort_unit: any) => {
            merge_item_unit_list.push({
              ...childData,
              date_start: injectHeader?.date_start,
              date_end: injectHeader?.date_end,
              datetime_start: datetime_start,
              datetime_end: datetime_end,
              id_employee_doctor: injectHeader?.id_employee_doctor,
              id_pet: injectHeader?.id_pet,
              id_request: requestForm.id_request,
              id_clinic: localStorage.getItem('id_clinic'),
              name_inject_display: effort_unit.label,
              name_service_item_unit: effort_unit.label,
              ...effort_unit
            })
          })
        }
        return null
      }

      return {
        ...childData,
        // row: pdListLength + (index + 1),
        id_request: requestForm.id_request,
        date_start: injectHeader?.date_start,
        date_end: injectHeader?.date_end,
        datetime_start: datetime_start,
        datetime_end: datetime_end,
        id_employee_doctor: injectHeader?.id_employee_doctor,
        id_pet: injectHeader?.id_pet,
        id_clinic: localStorage.getItem('id_clinic'),
        booking: booking
          ? {
            ...childData.booking,
            datetime_booking_confirmed: datetimeBookingConfirmed
          }
          : null
      }
    })
    .filter((item) => item !== null)

  allFormInjectData.push(...merge_item_unit_list)

  allFormInjectData.map((iDObj) => {
    tempValidationInjectData.push(aahValidations.injectDetailValidation(iDObj))
  })

  const resultValidationInject = await Promise.all(tempValidationInjectData)

  if (resultValidationInject.includes(false)) {
    return
  }

  handleAutoInjectTitle()
  injectHeader.title_inject = injectForm.value.title_inject
  injectHeader.id_request = requestForm.id_request
  injectHeader.id_clinic = localStorage.getItem('id_clinic')

  if (injectHeader && !injectHeader.id_inject) {
    const response: any = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'UpdInjectHeader',
      {
        inject: injectHeader,
        inject_detail_list: allFormInjectData.filter((id: any) => {
          // This if is for excluding flg_etc1 with 0 dosage, means only valid merge price item
          return !(id.flg_etc1 && id.val_dosage_decided === 0)
        })
      },
      true
    )

    if (response && response.code == 200) {
      await mtUtils.autoCloseAlert(aahMessages.success)
      event_bus.emit('reloadLeft')
      closeModal()
      return
    }

    await mtUtils.autoCloseAlert('エラー')
    return
  }

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/inject_detail',
    { inject_detail_list: allFormData }
  )
  if (response) {
    await mtUtils.autoCloseAlert(aahMessages.success)
    event_bus.emit('reloadLeft')
    closeModal()
    return
  }

  await mtUtils.autoCloseAlert('エラー')
  return
}

const saveTaskList = async () => {

  let allTask = selectedTaskList.value.map((task) => {
    if (task.today_plan != '') {
      task.datetime_plan = task.today_plan
      task.datetime_plan += task.plan_HH_MM !== null ? ' ' + plan_HH_MM : ' 00'
      task.datetime_plan += ':00'
    }
    useTask().submitTask({ ...task, id_link1: requestForm.id_request })
  })
  await mtUtils.promiseAllWithLoader(allTask)
}

const removeItem = (key: number) => {
  selectedServices.value.splice(key, 1)
  bookingRequestDetails.value.splice(key, 1)
}

const removeItemInject = (key: number, id: any) => {
  const index = selectedInjectDetailList.value.findIndex((id: any) => {
    if (id.id_inject_detail_UI == key) {
      return true
    }
    return false
  })
  selectedInjectDetailList.value.splice(index, 1)
  bookingRequestDetails.value.splice(index, 1)
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


const updateDefaultPetDoctor = async (value: any) => {
  requestForm.flg_apply_insurance = false
  illnessHistoryList.value.length = 0
  requestForm.id_pet_illness_history.length = 0
  selectedServices.value.length = 0

  if (value && !isEdit.value) {
    await mtUtils.promiseAllWithLoader([petBioStore.fetchPetBio({
      id_pet: requestForm.id_pet,
      id_customer: requestForm.id_customer,
      fetch_weight: true
    }).then(() => {
      if (petBioStore.getPetBioOptionDefault.length > 0) {
        prescriptionHeader1.value.val_weight =
          petBioStore.getPetBioOptionDefault[0].val_weight
        prescriptionHeader1.value.id_pet_bio_info =
          petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
      }
    }),
      useIllnessHistoryStore().fetchIllnessHistorys({
      id_pet: requestForm.id_pet,
      id_customer: requestForm.id_customer
    }).then((v) => {
      v.data.data.map((ih) => {
        illnessHistoryList.value.push({
          label: ih.name_disease ?? ih.name_disease_free,
          value: ih.id_pet_illness_history
        })
      })
      })])
    let relatedPet = petListDefault.find((v) => v.value === value)
    requestForm.id_employee_doctor = relatedPet?.id_employee_main_doctor ?? ''
    requestForm.id_employee_staff = relatedPet?.id_employee_main ?? ''

    if (relatedPet && relatedPet.pet_insurance && relatedPet.pet_insurance.length && relatedPet.pet_insurance.length > 0) {
      const insurancePlan = relatedPet.pet_insurance[0]
      const start_date = formatDate(insurancePlan.date_insurance_start)
      const end_date = formatDate(insurancePlan.date_insurance_end)
      if (start_date <= getDateToday() && end_date > getDateToday()) {
        requestForm.flg_apply_insurance = true
      }
    }
  }
}


const selectDefaultEmployee = (key: string) => {
  requestForm[key as keyof RequestFormType] = defaultEmployee
}

const getTaskDepList = async () => {
  taskDepList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: parseInt(obj.code_func1)
  }))
}

const setChildPrescriptionDetail = () => {
  let tempPrescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()
  if (tempPrescriptionHeader) {
    tempPrescriptionHeader = { ...requestForm }
    tempPrescriptionHeader.date_start = requestForm.date_request_start
    tempPrescriptionHeader.date_end = requestForm.date_request_goal
    tempPrescriptionHeader.id_employee_doctor = requestForm.id_employee_doctor
    tempPrescriptionHeader.val_weight = prescriptionHeader1.value.val_weight
    tempPrescriptionHeader.id_pet_bio_info = prescriptionHeader1.value.id_pet_bio_info
    tempPrescriptionHeader.total_days_dose = prescriptionHeader1.value.total_days_dose
    prescriptionStore.setPrescriptionHeaderForQuickRequest(tempPrescriptionHeader)
  }
}


const setChildInjectHeader = () => {
  injectForm.value.id_pet = requestForm.id_pet
  injectForm.value.id_customer = requestForm.id_customer
  injectForm.value.id_employee_doctor = requestForm.id_employee_doctor
  injectForm.value.date_start = requestForm.date_request_start
  injectForm.value.date_end = requestForm.date_request_goal
  injectForm.value.flg_apply_insurance = requestForm.flg_apply_insurance
  injectForm.value.id_pet_illness_history = requestForm.id_pet_illness_history
  injectForm.value.flg_non_charge = requestForm.flg_non_charge
}
const setChildSdDetail = () => {
  selectedServices.value.map((sd: any) => {
    sd.date_start = requestForm.date_request_start
    sd.datetime_service_start = requestForm.date_request_start
    sd.date_end = requestForm.date_request_goal
    sd.datetime_service_end = requestForm.date_request_goal
    sd.flg_non_charge = requestForm.flg_non_charge
    sd.flg_apply_insurance = requestForm.flg_apply_insurance
    sd.id_employee_doctor = requestForm.id_employee_doctor
  })
}

watch(() => requestForm, (nowValue, oldValue) => {
  if (nowValue) {
    setChildPrescriptionDetail()
    setChildSdDetail()
    setChildInjectHeader()
  }
}, {
  deep: true
})


onMounted(async () => {
  requestForm.id_employee_doctor = JSON.parse(
    LocalStorage.getItem('id_employee') ?? ''
  )

  const [service_group_list, task_group_list, _] = await mtUtils.promiseAllWithLoader([
    mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/service_groups', {
      isServiceGroup: true
    }),
    mtUtils.callApi(selectOptions.reqMethod.GET, '/mst/task_groups'),
    useCliCommonStore().fetchPreparationCliCommonList(
      { code_cli_common: [15] },
      true
    )
  ])
  serviceDetailGroupList.value = service_group_list

  customerList.value.length = 0
  customerListDefault.length = 0

  serviceGroupList.value.length = 0
  serviceGroupDefaultList.length = 0


  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  // getTaskDepList()

  if (props.request) {
    // On edit modal
    isEdit.value = true
  } else {
    // Create modal
    if (props.id_pet !== '' && props.id_customer !== '') {
      requestForm.id_customer = props.id_customer
      selectingCustomer(requestForm.id_customer)
      updateDefaultPetDoctor(props.id_pet)
      requestForm.id_pet = props.id_pet
    }

    requestForm.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="save">
    <MtModalHeader class="header-sticky" @closeModal="closeModal">
      <q-toolbar-title
        :class="{ 'cursor-pointer': requestForm.number_request }"
        class="text-grey-900 title2 bold"
        @click="
          requestForm.number_request
            ? copyText(requestForm.number_request)
            : null
        "
      >
        クイック・リクエスト
        <!-- <span v-if="requestForm.number_request">
          {{ requestForm.number_request }}
          <q-icon class="text-blue" name="content_copy" />
        </span> -->
        <span class="caption1 regular text-grey-700">
          RQ / ｽﾃｰﾀｽ / ｵｰﾀﾞｰ 一括登録
        </span>
      </q-toolbar-title>
      <q-btn
        v-if="isEdit"
        class="bg-grey-200 text-grey-500 q-mr-md"
        label="リクエスト完了"
        style="border: 1px solid #9e9e9e; border-radius: 8px"
        unelevated
      />
      <q-btn
        v-if="isEdit"
        class="bg-grey-200 text-grey-500 q-mr-md"
        label="リクエスト支払完了"
        style="border: 1px solid #9e9e9e; border-radius: 8px"
        unelevated
      />
    </MtModalHeader>
    <q-card-section
      class="q-px-xl"
      style="overflow-y: scroll; height: 82vh"
    >
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-4 col-md-4 col-sm-6" tabindex="3">
              <MtFormInputDate
                v-model:date="requestForm.date_request_start"
                label="リクエスト開始日"
                :rules="[aahValidations.validationRequired]"
                @update:date="
                (value) => {
                  clickDateTimeRequestStart(value)
                  prescriptionHeader1.total_days_dose = calculateDays(
                    requestForm.date_request_start,
                    requestForm.date_request_goal
                  )
                }
              "
              ></MtFormInputDate>
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6" tabindex="4">
              <MtFormInputDate
                v-model:date="requestForm.date_request_goal"
                label="リクエスト終了日"
                :rules="[aahValidations.validationRequired]"
                @update:date="
                (value) => {
                  prescriptionHeader1.total_days_dose = calculateDays(
                    requestForm.date_request_start,
                    requestForm.date_request_goal
                  )
                }
              "
              ></MtFormInputDate>
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6" tabindex="5">
              <MtFormInputNumber
                v-model:value="prescriptionHeader1.total_days_dose"
                :label="'服用日数 *'"
                :rules="[aahValidations.validationRequired]"
                class="field-right-text total-days-dose-icon"
                mode="dosage"
                required
                @update:value="
                  () => {
                    requestForm.date_request_goal = calculateDate(
                      requestForm.date_request_start, prescriptionHeader1.total_days_dose ,1)
                  }
                "
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-4 col-md-4 col-sm-6" tabindex="1">
              <MtFilterSelect
                v-model:options="customerList"
                v-model:selecting="requestForm.id_customer"
                :disable="disable_customer"
                :options-default="customerListDefault"
                autofocus
                custom-option
                label="診察券番号 "
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
                          :color="slotProps.opt.icon"
                          :style="{ color: slotProps.opt.icon }"
                          name="circle"
                          size="16px"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
              </MtFilterSelect>
            </div>
            <div v-if="isPet" class="col-lg-4 col-md-4 col-sm-6" tabindex="2">
              <MtFilterSelect
                v-model:options="petList"
                v-model:selecting="requestForm.id_pet"
                :disable="disable_pet"
                :options-default="petListDefault"
                custom-option
                label="デフォルトペット"
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
                          :color="slotProps.opt.icon"
                          :style="{ color: slotProps.opt.icon }"
                          name="circle"
                          size="16px"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
              </MtFilterSelect>
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6" tabindex="1">
              <MtFormPullDown
                v-model:selected="prescriptionHeader1.id_pet_bio_info"
                :options="petBioStore.getPetBioOptionDefault"
                label="生体情報"
                @update:selected="selectedPetBioInfo"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-4 col-md-4 col-sm-6">
              <InputEmployeeOptGroup
                v-model:selected="requestForm.id_employee_doctor"
                label="リクエスト 担当医*"
                show-select-default-employee
                @update:select-default-employee="
                selectDefaultEmployee('id_employee_doctor')
              "
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormMultipleSelection
                v-if="isPet"
                v-model="requestForm.id_pet_illness_history"
                :options="illnessHistoryList"
                :rules="[aahValidations.validationRequired]"
                label="現疾患・既往歴"
                @update:modelValue="updateSelectedItem"
                show-quick-illness-history
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtInputForm
                v-model="requestForm.flg_non_charge"
                :items="[{ label: '会計対象外' }]"
                type="checkbox"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormCheckBox
                v-model:checked="requestForm.flg_apply_insurance"
                label="保険適用"
              />
            </div>
          </div>
          <hr>
          <div class="row q-col-gutter-md q-mb-md">
            <q-tabs
              v-model="tab"
              active-color="grey-900"
              align="justify"
              class="text-grey-700 q-bb q-mb-sm"
              dense
              indicator-color="accent-700"
              @update:model-value="tabChanged"
            >
              <q-tab label="ミックスG" name="im_g" />
              <q-tab label="治療サービスG" name="sd_g" />
              <q-tab label="処方箋G" name="pd_g" />
              <q-tab label="注射G" name="id_g" />
            </q-tabs>
          </div>
          <q-scroll-area
            v-if="tab === 'im_g'"
            class="full-width col h-300px"
            visible
          >
            <div
              v-for="service_group in mixGroupList"
              :key="service_group.id_service_group"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-drip cursor-pointer full-width q-card-drip"
                flat
                @click.prevent="onServiceGroupMixed(service_group)"
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
                          @click.stop="($event)=> {
                            $event.preventDefault();
                            items.isChecked = !items.isChecked;
                          }"
                        >
                          <div
                            class="flex body1 bold text-grey-800 q-mb-xs justify-between items-center"
                            @click.prevent="($event)=> {
                              $event.preventDefault();
                            }">
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
                            <div>
                              {{ items.item_service_unit.id_item_service?.name_category1 }}
                              <q-icon name="arrow_right" />
                              {{ items.item_service_unit.id_item_service
                              ?.name_category2 }}
                            </div>
                            <MtFormCheckBox v-model:checked="items.isChecked" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>
          <q-scroll-area v-if="tab === 'sd_g'" class="full-width col h-300px">
            <div
              v-for="service_group in serviceDetailGroupList"
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
                            <div @click.stop="openItemServiceModel(items.item_service_unit?.id_item_service)">
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
          <q-scroll-area
            v-if="tab === 'pd_g'"
            class="full-width col h-300px"
            visible
          >
            <div
              v-for="keyword in prescriptionGroupList"
              :key="keyword.id_service_group"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-medicine cursor-pointer full-width"
                flat
                @click.prevent="onMultipleKeywordCheck(keyword, null)"
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
                                class="text-grey-700"
                                flat
                                icon="quiz"
                                round
                                size="15px"
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
            v-if="tab === 'id_g'"
            class="full-width col h-300px"
            visible
          >
            <div
              v-for="service_group in injectGroupList"
              :key="service_group.id_service_group"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-drip cursor-pointer full-width q-card-drip"
                flat
                @click.prevent="onServiceGroupCheckInject(service_group)"
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
        </div>
        <div class="col">
          <q-scroll-area class="full-width side-tab-view">
            <div>
              <div
                v-for="(item, key) in selectedServices"
                v-if="selectedServices.length > 0"
                class="q-mb-md"
              >
                <div class="flex justify-between q-pa-sm bg-light-blush">
                  <div>
                    <div
                      class="title2 text-grey-900 bold q-mb-xs flex items-center"
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
                          class="text-grey-700 q-ml-md"
                          flat
                          icon="quiz"
                          round
                          size="10px"
                        />
                      </div>
                    </div>
                    <div class="text-body2 text-grey-700 flex items-center">
                      {{ item.name_category1 }}
                      <q-icon name="arrow_right" />
                      {{ item.name_category2 }}
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
                      class="q-mt-sm"
                      color="primary"
                      outline
                      size="11px"
                      unelevated
                      @click="item.show = !item.show"
                    >{{ item.show ? '閉じる' : '開く' }}
                    </q-btn
                    >
                  </div>
                </div>
                <div v-show="item.show">
                  <div v-if="isShowIdexxName(item?.list_idexx_test)" class="q-pa-sm">
                    IDEXX臨床検査 :
                    {{ showIdexxName(item?.list_idexx_test) }}
                  </div>
                  <div class="row q-col-gutter-md q-mt-xs">
                    <div class="col">
                      <MtFormInputDate
                        v-model:date="item.datetime_service_start"
                        label="実施日"
                        required
                        @update:date="
                          item.datetime_service_end = item.datetime_service_start"
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
                            if (item.datetime_service_start > item.datetime_service_end) {
                              item.datetime_service_start = item.datetime_service_end
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
                      <MtInputForm
                        v-model="item.quantity"
                        label="数量"
                        type="number"
                      />
                    </div>
                  </div>
                  <div class="row q-col-gutter-md q-mt-xs">
                    <div class="col-6">
                      <MtFormMultipleSelection
                        v-model="item.id_pet_illness_history"
                        :options="illnessHistoryList"
                        label="現疾患・既往歴"
                        :rules="[aahValidations.validationRequired]"
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
                      />
                    </div>
                  </div>
                  <div class="row q-col-gutter-md q-mt-xs">
                    <div class="col-12 col-sm-4">
                      <MtInputForm
                        v-model="item.showTimeOption"
                        :items="[{ label: '時刻' }]"
                        type="checkbox"
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <MtInputForm
                        v-model="item.flg_non_charge"
                        :items="[{ label: '会計対象外' }]"
                        type="checkbox"
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <MtFormCheckBox
                        v-model:checked="item.flg_next_cart"
                        label="次回の会計"
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <MtInputForm
                        v-model="item.flg_pet_custody_control"
                        :items="[{ label: '預り管理' }]"
                        type="checkbox"
                      />
                    </div>
                    <div v-if="item?.flg_booking" class="col-12 col-sm-4">
                      <MtFormPullDown
                        v-model:selected="item.type_booking"
                        :options="typeBooking"
                        label="予約区分 "
                        type="selection"
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <MtInputForm
                        v-model="item.flg_schedule"
                        :items="[{ label: '次回予定' }]"
                        type="checkbox"
                        @update:model-value="
                          changeFlgSchedule(item.flg_schedule, key, item)
                        "
                      />
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-btn
                        color="grey-333"
                        flat
                        unelevated
                        @click="removeItem(key)"
                      >
                        <q-icon name="delete"></q-icon>
                        削除
                      </q-btn>
                    </div>
                  </div>
                  <div class="row q-col-gutter-md q-mt-xs">
                    <div class="col">
                      <MtFormCheckBox
                        v-model:checked="item.flg_apply_insurance"
                        label="保険適用"
                      />
                    </div>
                  </div>

                  <!-- T BOOKING -->
                  <div v-if="bookingRequestDetails[key]?.tBookingFlag" class="">
                    <div class="row q-col-gutter-md q-pa-md items-center">
                      <div class="col-4">
                        <MtFormInputDate
                          v-model:date="
                            bookingRequestDetails[key].date_booking_confirmed
                          "
                          datetime
                          label="予定日"
                        />
                      </div>
                      <div class="col-3 text-center">
                        <MtInputForm
                          v-model="bookingRequestDetails[key].tBookingFlgTime"
                          :items="[{ label: '時刻指定' }]"
                          type="checkbox"
                        />
                      </div>
                      <div
                        v-if="bookingRequestDetails[key].tBookingFlgTime"
                        class="col-4"
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
                </div>
                <hr v-show="item.show" class="light q-mb-md" />
              </div>
            </div>
            <div
              v-for="(item, index) in selectedPrescriptionDetailList"
              v-if="selectedPrescriptionDetailList.length > 0"
              :key="`${item.id_item_service}pd_g`"
              class="q-mb-lg"
            >
              <QuickPrescriptionDetailListBox
                :ref="setChildRef(index)"
                :bookingDetail="bookingRequestDetails[index]"
                :callBack="callBackOption"
                :detailList="selectedServices"
                :index="index"
                :item="item"
                :petBodyWeight="valWeightUI"
                @checkSuggestionResponse="toggleResponseAlert"
                @removeGroup="removeGroup($event, index)"
                @removeItem="removePrescriptionItem($event, index)"
              />
            </div>
            <div
              v-for="(item, index) in selectedInjectDetailList"
              v-if="selectedInjectDetailList.length > 0"
              :key="`${item.id_item_service}-id`"
              class="q-mb-lg"
            >
              <QuickInjectDetailListBox
                :ref="setChildFormInjectRefs(index)"
                :call-back="callBackOptionInject"
                :index="index"
                :injectHeader="injectForm"
                :item="item"
                :request-obj="requestForm"
                @removeItem="removeItemInject($event, item.id_inject_detail_UI)"
              >
              </QuickInjectDetailListBox>
            </div>
          </q-scroll-area>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white bottom-sticky">
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
            tabindex="30"
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
  height: 5vh;
  background: white !important;
  top: 0;
  z-index: 100;
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


.q-card-task {
  border-left: 6px solid #B5E9C1;
  background: $grey-050;
  border-radius: 6px;
  padding: 0px;
}


.task-group-title {
  background-color: #3C4D40;
  color: white !important;
  border-radius: 4px;
  padding: 4px 8px;
  letter-spacing: 2px;
}

.task-group-item {
  margin: 12px 0px 0px 15px !important;
  padding: 8px 12px;
  background-color: $grey-200 !important;
  border-radius: 10px;
}


.side-tab-view {
  height: calc(100vh - 210px);
}

.h-300px {
  height: 420px;
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
</style>
