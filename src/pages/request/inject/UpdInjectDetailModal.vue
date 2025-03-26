<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import selectOptions from '@/utils/selectOptions'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import usePrescriptionStore from '@/stores/prescription'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import usePrintStore from '@/stores/prints'

import {
  aahUtilsGetEmployeeName,
  aahUtilsGetUpdatedEmployeeName,
  calculateDate,
  calculateDays,
  concatenate,
  copyText,
  getDateByFormat,
  getDateToday,
  roundZeroAfterPoint,
  getFullPetNameWithoutHonorific
} from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import useCommonStore from '@/stores/common'
import { event_bus } from '@/utils/eventBus'
import injectUtils from '@/pages/request/inject/injectUtils'
import {
  timeHourMinute,
  typeBodyWeightUnit,
  typeRabiesProcess,
  typeRabiesRound
} from '@/utils/enum'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useInjectStore from '@/stores/inject'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCliCommonStore from '@/stores/cli-common'
import { injectDetailAttributes } from '@/utils/pdfAttributes/injectDetails'
import useClinicStore from '@/stores/clinics'
import useEmployeeStore from '@/stores/employees'
import useAddressesStore from '@/stores/addresses'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import dayjs from '@/boot/dayjs'
import { round } from 'lodash'
import useTextTemplateStore from '@/stores/text-template'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import { storeToRefs } from 'pinia'
import { TextTemplateType } from '@/types/types'

const UpdatePrintCanvasModal = defineAsyncComponent(
  () => import(`@/pages/master/print/UpdatePrintCanvasModal.vue`)
)

const props = defineProps({
  injectObj: Object,
  injectDetail: Object,
  requestObj: Object,
  otherInjectDetailList: Array<Object>
})
const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const prescriptionStore = usePrescriptionStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const employeeStore = useEmployeeStore()
const clinicStore = useClinicStore()
const templateStore = useTextTemplateStore()
const injectStore = useInjectStore()

const { getTemplates } = storeToRefs(templateStore)

const isSubmitAble = ref(false)
const printStore = usePrintStore()

const closeModal = () => {
  emits('close')
}

const petList = ref()
const selectedUnit = ref()
const id_pet = ref()
const petSelectedLabel = ref()

let injectDetailJson = null
let itemServiceUnitObj = ref(null)
const pdfArrayBuffer = ref(null)
const quantity_dose = ref<any>(0)
const isEdit = ref(false)
const toggleDialog1 = ref([])
const injectEffortList = ref([])

const percent = ref(null)

const percentOption = [
  { label: '0.1', value: 10 },
  { label: '0.2', value: 20 },
  { label: '0.3', value: 30 },
  { label: '0.4', value: 40 },
  { label: '0.5', value: 50 },
  { label: '0.6', value: 60 },
  { label: '0.7', value: 70 },
  { label: '0.8', value: 80 },
  { label: '0.9', value: 90 },
  { label: '1', value: 100 },
  { label: '1.25', value: 125 },
  { label: '1.5', value: 150 },
  { label: '1.75', value: 175 },
  { label: '2', value: 200 },
  { label: '2.25', value: 225 },
  { label: '2.50', value: 250 },
  { label: '2.75', value: 275 },
  { label: '3', value: 300 }
]

const medicineObj = ref<any>({
  id_dosage_frequency_1: null,
  id_dosage_frequency_2: null,
  id_dosage_frequency_3: null
})

const flgPlusItem = ref(false)

const dosageVariableRange: any = ref(null)
const dosageVariableRes: any = ref([])

const publicHealthCenterList: any = ref([])

const dosageVariableRangeUnit: any = ref()
const dosageVariableRangeValue: any = ref({
  min: 0,
  max: 0
})

const calculatedEfficacy = ref()

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

const efficacyCalculation = computed(() => {
  calculatedEfficacy.value = roundZeroAfterPoint(
    (injectDetailForm.value.val_weight / 1000) *
      injectDetailForm.value?.val_efficacy_strength_doctor
  )
  if (injectDetailForm.value.type_medicine_dosage == '3') {
    calculatedEfficacy.value = roundZeroAfterPoint(
      1 * injectDetailForm.value?.val_efficacy_strength_doctor
    )

    injectDetailForm.value.val_used_portion = calculatedEfficacy.value
    injectDetailForm.value.val_dosage_decided =
      injectDetailForm.value.val_used_portion /
      injectDetailForm.value.val_liquid

    return concatenate(
      '1',
      '(kg) x ',
      roundZeroAfterPoint(injectDetailForm.value.val_efficacy_strength_doctor),
      ' = ',
      calculatedEfficacy.value,
      'mg'
    )
  }

  if (injectDetailForm.value.type_medicine_dosage == '2') {
    calculatedEfficacy.value = roundZeroAfterPoint(
      (injectDetailForm.value?.val_weight / 1000) *
        injectDetailForm.value?.val_efficacy_strength_doctor
    )
  }

  return concatenate(
    roundZeroAfterPoint(Number(injectDetailForm.value.val_weight) / 1000),
    '(kg) x ',
    roundZeroAfterPoint(injectDetailForm.value?.val_efficacy_strength_doctor),
    ' = ',
    calculatedEfficacy.value,
    'ml'
  )
})

const injectDetailForm = ref({
  id_inject_detail: null,
  id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
  id_inject: null,
  id_inject_detail_parent: null,
  id_item_service: null,
  id_item_service_unit: null,
  code_category2: null,
  name_category1: null,
  name_category2: null,
  id_category1: null,
  id_category2: null,
  id_pet: null,
  date_start: null,
  date_end: null,
  datetime_start: '',
  datetime_end: '',
  time_start: '00:00',
  time_end: '00:00',
  id_employee_doctor: null,
  type_inject_route: null,
  num_conduct: 1,
  val_weight: null,
  val_dosage_suggested: null,
  val_dosage_decided: 1,
  val_used_portion: null,
  val_efficacyingredient: null,
  calculation_fixed_unit: null,
  val_used_liquid: null,
  datetime_processed: null,
  speed_process: null,
  type_speed_unit: null,
  time_process: '00:00:00',
  type_process_time: null,
  flg_non_charge: null,
  flg_apply_insurance: false,
  flg_next_cart: null,
  type_booking: null,
  flg_detailed_cart_name: null,
  memo_inject: null,
  lot_number1: null,
  lot_number2: null,
  flg_group_title: null,
  row: null,
  flg_etc1: null,
  memo_etc1: null,
  flg_etc2: null,
  memo_etc2: null,
  flg_delete: null,
  id_employee_staff: null,
  id_employee_insert: null,
  datetime_insert: null,
  id_employee_update: null,
  datetime_update: null,
  booking: {
    FlgUI: false
  }
})

const timeOption = ref(false)

const tBookingData = ref({
  date_booking_confirmed: getDateToday(),
  time_booking_confirmed: null,
  days_repeat: null,
  flg_continue: true,
  flg_exempt: false,
  flg_end: false,
  type_day: 1
})
const tBookingFlag = ref(false)
const tBookingFlgTime = ref(false)
const tBookingFlgRepeat = ref(false)

function updateValue1() {
  injectDetailForm.value.val_dosage_suggested = percent.value / 100
  toggleDialog1.value = false
}

const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])

const receivedISU = ref({})
const disableHeaderUpdate = ref(false)

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const menuOptions = [
  {
    title: '削除',
    name: 'delete',
    isChanged: false,
    attr: {
      class: props.injectObj?.flg_delivered
        ? 'disabled'
        : injectDetailForm.value.flg_cancel || props.injectObj?.flg_cancel
        ? 'disabled'
        : null,
      clickable: props.injectObj?.flg_delivered
        ? false
        : !(injectDetailForm.value.flg_cancel || props.injectObj?.flg_cancel)
    }
  }
]

const openMenu = async () => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      if (props.injectObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await mtUtils.callApi(
              selectOptions.reqMethod.DELETE,
              `inject_detail/${injectDetailForm.value.id_inject_detail}`
            )
          }
        })
      await mtUtils.autoCloseAlert('削除しました。')
      closeModal()
    }
  }
}

const commonTypeAnimalOptionList: any = ref([])

const valWeightUI = computed(() => {
  return `${(props.injectObj.val_weight / 1000).toFixed(2)} Kg`
})
const typeAnimalUI = computed(() => {
  if (
    customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == props?.injectObj?.id_pet
    )?.id_cm_animal
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == props?.injectObj?.id_pet
    )?.id_cm_animal
    return `${
      commonTypeAnimalOptionList.value.find(
        (obj: any) => obj.value == typeAnimal
      )?.label ?? ''
    }`
  }
  return ''
})

function createValue(val, done) {
  if (val.length > 0) {
    if (!publicHealthCenterList.value.find((phc: any) => phc.label == val)) {
      publicHealthCenterList.value.push({ value: val, label: val })
    }
    done(val, 'toggle')
  }
}

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

// const initStylesheets = async () => {
//   const stylesheets = [
//     {
//       href: 'https://printjs-4de6.kxcdn.com/print.min.css',
//       integrity: ''
//     }
//   ]
//   stylesheets.forEach((stylesheetObj) => {
//     let link = document.createElement('link')
//     link.href = stylesheetObj.href
//     link.rel = 'stylesheet'
//     if (stylesheetObj.integrity !== '') {
//       link.integrity = stylesheetObj.integrity
//     }
//     link.crossOrigin = 'anonymous'
//     link.referrerPolicy = 'no-referrer'
//     document.head.appendChild(link)
//   })
// }
const initStylesheets = async () => {
  const stylesheets = [
    {
      href: 'https://fonts.googleapis.com/css2?family=Gothic+A1:wght@500;600&display=swap',
      integrity: ''
    },
    {
      href: 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@600&display=swap',
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

const deleteOldPdfObjects = () => {
  try {
    fabric = null
  } catch (e) {}
}

const getEmployeeLabel = (empId) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const getNewEmployeeLabel = (empId) => {
  return aahUtilsGetUpdatedEmployeeName(employeeStore.getEmployees, empId)
}

const getPdfMappingJson = async () => {
  const currentClinic = await clinicStore.fetchClinicById(
    props.injectObj?.id_clinic
  )
  const pdfMappingJson = { ...props.injectDetail }
  pdfMappingJson.id_pet = props.injectObj?.pet
  pdfMappingJson.id_customer = props.injectObj?.customer
  pdfMappingJson.id_request = props.injectObj?.request
  pdfMappingJson.id_clinic = currentClinic
  pdfMappingJson.id_employee_doctor = getNewEmployeeLabel(
    pdfMappingJson.id_employee_doctor
  )
  pdfMappingJson.id_employee_staff = getNewEmployeeLabel(
    pdfMappingJson.id_employee_staff
  )
  pdfMappingJson.id_item_service_unit = itemServiceUnitObj.value
  pdfMappingJson.rabies = Boolean(props.injectObj?.rabies)
    ? props.injectObj?.rabies
    : {}
  // TODO TEMPORALLY DISABLED BY MOTO DUE TO URGENT ERROR
  // pdfMappingJson.rabies.id_employee_registered = getEmployeeLabel(
  //   props.injectObj?.rabies.id_employee_registered
  // )
  // pdfMappingJson.rabies.id_employee_processed = getEmployeeLabel(
  //   props.injectObj?.rabies.id_employee_processed
  // )
  try {
    if (
      Boolean(props.injectDetail?.booking) &&
      props.injectDetail?.booking.length > 0
    ) {
      pdfMappingJson.booking = props.injectDetail?.booking[0]
    } else {
      pdfMappingJson.booking = Boolean(props.injectDetail?.booking)
        ? props.injectDetail?.booking
        : {}
    }
  } catch (error) {
    pdfMappingJson.booking = Boolean(props.injectDetail?.booking)
      ? props.injectDetail?.booking
      : {}
  }
  if (pdfMappingJson?.id_item_service_unit?.memo_etc1) {
    pdfMappingJson.id_item_service_unit.memo_etc1 =
      pdfMappingJson.id_item_service_unit.memo_etc1.replaceAll(',', '\n')
  }
  if (pdfMappingJson?.id_item_service_unit?.memo_etc2) {
    pdfMappingJson.id_item_service_unit.memo_etc2 =
      pdfMappingJson.id_item_service_unit.memo_etc2.replaceAll(',', '\n')
  }
  if (pdfMappingJson?.id_item_service_unit?.memo_etc3) {
    pdfMappingJson.id_item_service_unit.memo_etc3 =
      pdfMappingJson.id_item_service_unit.memo_etc3.replaceAll(',', '\n')
  }
  pdfMappingJson.id_item_service = pdfMappingJson.item_service

  try {
    delete pdfMappingJson.item_service
  } catch (ee) {}

  console.log('pdfMappingJson', pdfMappingJson)

  return pdfMappingJson
}

const showButton = computed(() => {
  // return {
  //   button_label: "Test",
  //   target_modal: 'update_print_canvas_modal',
  //   id_print: '29'
  // }
  let getCliCommon = cliCommonStore.getCliCommonPrintPdf.find((v) => {
    if (v.memo_etc2) {
      return props.injectDetail?.id_item_service_unit == v.memo_etc2
    }
    if (v.memo_etc1) {
      return props.injectDetail?.id_item_service == v.memo_etc1
    }
    if (v.text1) {
      return props.injectDetail?.code_category2 == v.text1
    }
    if (v.code_func1) {
      return props.injectDetail?.code_category1 == v.code_func1
    }
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
  return false
})

const clickButtonPDFPrinting = async () => {
  if (showButton.value.target_modal === 'update_print_canvas_modal') {
    deleteOldPdfObjects()
    await initScripts()
    // await initStylesheets()
    await Promise.all([
      commonStore.fetchPreparationCommonList({ code_common: [28] }),
      printStore.selectPrint(showButton.value.id_print, true)
      // printStore.selectPrint(100029, true)
    ])
    if (printStore.getPrint) {
      dataPrint.value = { ...printStore.getPrint }

      try {
        const binaryString = atob(printStore.getPrint.pdf_path)
        const arrayBuffer = new ArrayBuffer(dataPrint.value.pdf_path.length)
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

      await mtUtils.popup(UpdatePrintCanvasModal, {
        data: dataPrint.value,
        pdfData: pdfArrayBuffer.value,
        canvasWidth: dataPrint.value.flg_landscape ? ht : wd,
        canvasHeight: dataPrint.value.flg_landscape ? wd : ht,
        dataToRender: dataToRender,
        hideRightButtons: false,
        renderDirectly: true,
        rightBoxButtons: injectDetailAttributes,
        showSendNotificationBtn: true
      })
    }
  }
}

event_bus.on('isu_child', (isu_child) => {
  receivedISU.value = { ...isu_child }
})

function calculateBookingDate() {
  let interval = itemServiceUnitObj.interval

  if (injectDetailForm.value.booking.flg_booking == true && interval) {
    interval = interval.length > 0 ? interval.split(' ') : null

    let cycle, unit
    if (interval && interval.length == 2) {
      cycle = interval[0]
      unit = interval[1]

      const date_start = injectStore.getCurrentHeader.date_start

      if (unit == '日') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(
          injectDetailForm.value.date_start,
          cycle,
          '1'
        )
      }
      if (unit == '週') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(
          injectDetailForm.value.date_start,
          cycle,
          '2'
        )
      }
      if (unit == '月') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(
          injectDetailForm.value.date_start,
          cycle,
          '3'
        )
      }
      if (unit == '年') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(
          injectDetailForm.value.date_start,
          cycle,
          '4'
        )
      }
    }
    injectDetailForm.value.booking.id_request =
      injectDetailForm.value.id_request
  }
}
const check_and_update_booking = async (oldInjectDetail) => {
  const recentInjectDetail = injectDetailForm.value
  const booking = oldInjectDetail.booking ?? tBookingData.value

  if (!booking.id_booking) {
    const datetimeBookingConfirmed =
      getDateByFormat(
        new Date(tBookingData.value.date_booking_confirmed),
        'YYYY/MM/DD'
      ) +
      ' ' +
      (tBookingData.value.time_booking_confirmed ?? '00:00') +
      ':00'
    const bookingJson = {
      id_clinic: recentInjectDetail.id_clinic,
      id_customer: recentInjectDetail.id_customer,
      id_pet: recentInjectDetail.id_pet,
      id_request: recentInjectDetail.id_request,
      id_inject_detail: recentInjectDetail.id_inject_detail,
      days_repeat: tBookingData.value.days_repeat,
      flg_continue: tBookingData.value.flg_continue,
      flg_exempt: tBookingData.value.flg_exempt,
      flg_end: tBookingData.value.flg_end,
      type_booking_source: 2,
      datetime_booking_confirmed: datetimeBookingConfirmed,
      ...props.injectObj
    }
    const resp = await injectStore.createInjectDetailBooking(
      recentInjectDetail.id_request,
      recentInjectDetail.id_inject_detail,
      bookingJson
    )
  } else if (oldInjectDetail.booking && !recentInjectDetail.booking) {
    if (booking.id_booking) {
      const resp = await injectStore.destroyInjectDetailBooking(
        recentInjectDetail.id_request,
        recentInjectDetail.id_inject_detail,
        booking.id_booking
      )
    }
  } else if (oldInjectDetail.booking && recentInjectDetail.booking) {
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
    const resp = await injectStore.updateInjectDetailBooking(
      recentInjectDetail.id_request,
      recentInjectDetail.id_inject_detail,
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
  if (
    props.injectDetail?.type_detail == '3' ||
    props.injectDetail?.type_detail == '2'
  ) {
    const promiseList = injectEffortList.value.map(async (effort_item) => {
      const API_URL = `inject_detail/${effort_item.id_inject_detail}`
      await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        API_URL,
        {
          ...effort_item,
          id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
          val_dosage_decided: effort_item.val_dosage_decided
            ? Number(effort_item.val_dosage_decided).toFixed(3)
            : effort_item.val_dosage_decided
        },
        true
      )
    })
    await mtUtils.promiseAllWithLoader(promiseList)
    event_bus.emit('reloadRight', true)
    await mtUtils.autoCloseAlert('明細を更新しました。')
    closeModal()
    return
  }
  // DONE EFFORT ITEM LOGIC

  const API_URL = `inject_detail/${injectDetailForm.value.id_inject_detail}`

  if (tBookingData.value && tBookingData.value.id_booking) {
    tBookingData.value.datetime_booking_confirmed =
      tBookingData.value.date_booking_confirmed

    if (tBookingFlgTime.value && tBookingData.value.time_booking_confirmed) {
      tBookingData.value.datetime_booking_confirmed = `${tBookingData.value.date_booking_confirmed} ${tBookingData.value.time_booking_confirmed}:00`
    } else {
      tBookingData.value.datetime_booking_confirmed = `${tBookingData.value.date_booking_confirmed} 00:00:00`
    }
  }

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    API_URL,
    {
      booking: tBookingData.value,
      ...injectDetailForm.value,
      id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
      val_used_liquid: medicineObj.value.flg_drip_carrier
        ? injectDetailForm.value.val_used_liquid.toFixed(4)
        : null,
      val_dosage_decided: injectDetailForm.value.val_dosage_decided
        ? Number(injectDetailForm.value.val_dosage_decided).toFixed(3)
        : injectDetailForm.value.val_dosage_decided,
      val_efficacy_strength_doctor: injectDetailForm.value
        .val_efficacy_strength_doctor
        ? Number(injectDetailForm.value.val_efficacy_strength_doctor).toFixed(4)
        : injectDetailForm.value.val_efficacy_strength_doctor,
      val_efficacyingredient:
        Number(injectDetailForm.value.val_efficacyingredient) ?? 1
    },
    true
  )
  await check_and_update_booking({ ...props.injectDetail })
  if (response && response.code == 200) {
    event_bus.emit('reloadRight', true)
    await mtUtils.autoCloseAlert('明細を更新しました。')
    closeModal()
    return
  }
  await mtUtils.autoCloseAlert('エラー')
  return null
}

const openAddTextTemplateModal = async (value: number) => {
  typeMemoSelected.value = value
  await templateStore.fetchTemplates({ type_text_template: value })

  memoTemplates.value = getTemplates.value
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
  if (type === 52) {
    if (injectDetailForm.value?.memo_etc1) {
      injectDetailForm.value.memo_etc1 = `${injectDetailForm.value.memo_etc1} ${value}`
    } else {
      injectDetailForm.value.memo_etc1 = value
    }
    return
  }
  if (type === 51) {
    if (injectDetailForm.value?.memo_etc2) {
      injectDetailForm.value.memo_etc2 = `${injectDetailForm.value.memo_etc2} ${value}`
    } else {
      injectDetailForm.value.memo_etc2 = value
    }
    return
  }
}

const val_total_efficacyingredient = ref(assignComputedProperty())

function assignComputedProperty() {
  return computed(() => {
    const val_dosage = injectDetailForm.value.val_dosage_decided ?? 0
    const val_efficacyingredient =
      selectedUnit.value.val_efficacyingredient ?? 0
    return Number(val_dosage) * Number(val_efficacyingredient)
  })
}

const efficacyPetKg = computed(() => {
  return (
    val_total_efficacyingredient.value /
    Number(injectDetailForm?.value?.val_weight / 1000)
  )
})

const openItemServiceModel = async (row) => {
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })
}

async function selectedTypeMedicine(value: any) {
  if (
    injectDetailForm.value.val_dosage_decided === null ||
    injectDetailForm.value.val_dosage_decided == ''
  ) {
    injectDetailForm.value.val_dosage_decided = 1
  }

  dosageVariableRange.value = null

  if (value == 2 || value == 3) {
    if (dosageVariableRes.value.length && dosageVariableRes.value.length > 0) {
      const temp_type_body_weight_unit = value == 2 ? [1, 2] : [3]
      var dosageVariable: any = null

      const dosageVariableList = dosageVariableRes.value.filter((dosVa: any) =>
        temp_type_body_weight_unit.includes(dosVa.type_body_weight_unit)
      )
      if (
        dosageVariableList &&
        dosageVariableList.length &&
        dosageVariableList.length > 0
      ) {
        dosageVariable = dosageVariableList.find(
          (dosVa: any) =>
            dosVa.id_cm_animal == customerStore.getPet?.id_cm_animal
        )
        if (!dosageVariable) {
          dosageVariable = dosageVariableList.find(
            (dosVa: any) => !dosVa.id_cm_animal
          )
        }
      }

      if (
        dosageVariable &&
        dosageVariable.val_dose_min &&
        dosageVariable.val_dose_max &&
        dosageVariable.val_dose_max > 0
      ) {
        dosageVariableRange.value = `${dosageVariable.val_dose_min} 〜 ${dosageVariable.val_dose_max}`
        const tempUnit = useCommonStore().getCommonUnitOptionList.find(
          (unitObj: any) => unitObj.value == dosageVariable.id_cm_unit_medicine
        )?.name_common
        const tempUnit2 = `${
          typeBodyWeightUnit.find(
            (obj: any) => obj.value == dosageVariable.type_body_weight_unit
          )?.label ?? ''
        }`
        dosageVariableRangeUnit.value = tempUnit
          ? `${tempUnit} ` + '/' + tempUnit2
          : tempUnit2

        if (!isEdit.value) {
          injectDetailForm.value.val_efficacy_strength_doctor =
            roundZeroAfterPoint(dosageVariable.val_dose_min)
        }

        dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
        dosageVariableRangeValue.value.max = dosageVariable.val_dose_max
        return
      }
      if (dosageVariable && dosageVariable.val_dose_min) {
        dosageVariableRange.value =
          `${dosageVariable.val_dose_min}` +
          `${
            typeBodyWeightUnit.find(
              (obj: any) => obj.value == dosageVariable.type_body_weight_unit
            )?.label ?? ''
          }`

        if (!isEdit.value) {
          injectDetailForm.value.val_efficacy_strength_doctor =
            roundZeroAfterPoint(dosageVariable.val_dose_min)
        }

        dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
      }

      if (!dosageVariable) {
        await mtUtils.autoCloseAlert(
          '有効成分の服用範囲がマスタに登録されていません'
        )
      }
    }
  }
}

const addressList = ref([])

const setBookingIfUpdateCase = () => {
  const bookingDetails = injectDetailForm.value.booking

  if (bookingDetails && bookingDetails.id_booking) {
    tBookingFlag.value = true
    tBookingFlgTime.value = true
    tBookingData.value = bookingDetails
    tBookingFlgRepeat.value =
      typeof tBookingData.value.days_repeat == 'number' ||
      tBookingData.value.flg_exempt ||
      tBookingData.value.flg_end ||
      tBookingData.value.flg_continue
    if (bookingDetails.datetime_booking_confirmed) {
      const date_booking_confirmed =
        bookingDetails.datetime_booking_confirmed.split(' ')[0]
      const time_booking_confirmed =
        bookingDetails.datetime_booking_confirmed.split(' ')[1]
      tBookingData.value.date_booking_confirmed = date_booking_confirmed
      tBookingData.value.time_booking_confirmed = time_booking_confirmed.slice(
        0,
        -3
      )
    }
  }
}

const itemServiceUnitList = ref([])

function getItemServiceUnit(value) {
  return itemServiceUnitList.value.find(
    (itemService: any) => itemService.id_item_service_unit == value
  )
}

const unitName = (value) => {
  return useCommonStore().getCommonUnitOptionList.find(
    (v) => v.id_common == value
  )?.name_common
}

const updatePortion = async () => {
  if (
    !selectedUnit.value?.val_liquid ||
    !selectedUnit.value?.val_efficacyingredient
  ) {
    await mtUtils.alert('品名包装単位に薬液全量の登録がありません。', '確認')
  }

  let calculatedEfficacyIngredient =
    (Number(injectDetailForm.value.val_used_portion) /
      Number(selectedUnit.value.val_liquid ?? 1)) *
    selectedUnit.value.val_efficacyingredient
  injectDetailForm.value.val_efficacy_strength_doctor =
    calculatedEfficacyIngredient /
    (Number(injectDetailForm.value.val_weight) / 1000)
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

const optionLabel = (v) => {
  if (v) {
    if (v.customer_name_family)
      return getFullPetNameWithoutHonorific(v) + ' : ' + v.code_pet
    if (v.name_pet) return v.name_pet + ' : ' + v.code_pet
    return v.label
  }
  return ''
}

watch(
  () => calculatedEfficacy.value,
  (nowValue, oldValue) => {
    if (nowValue && oldValue) {
      if (
        !selectedUnit.value.val_efficacyingredient &&
        injectDetailForm.value.type_medicine_dosage == '2'
      ) {
        injectDetailForm.value.val_used_portion = calculatedEfficacy.value
        injectDetailForm.value.val_dosage_decided =
          Number(injectDetailForm.value.val_used_portion) /
          Number(selectedUnit?.value.val_liquid)
        return
      }

      const ratioWeight =
        (selectedUnit?.value?.val_efficacyingredient ?? 1) /
        (selectedUnit?.value?.val_liquid ?? 1)
      injectDetailForm.value.val_used_portion = round(nowValue / ratioWeight, 4)
      injectDetailForm.value.val_dosage_decided =
        Number(injectDetailForm?.value?.val_used_portion ?? 1) /
        (selectedUnit?.value?.val_liquid ?? 1)
      injectDetailForm.value.val_efficacyingredient =
        Number(injectDetailForm.value.val_dosage_decided) *
        Number(selectedUnit?.value?.val_efficacyingredient ?? 1)

      injectDetailForm.value.val_dosage_decided =
        injectDetailForm.value.val_dosage_decided.toFixed(3)
      injectDetailForm.value.val_efficacyingredient =
        injectDetailForm.value.val_efficacyingredient.toFixed(3)
    }
  }
)

onMounted(async () => {
  petList.value = customerStore.getCustomer.pets
  id_pet.value = props.injectObj?.id_pet
  petSelectedLabel.value = optionLabel(props.injectObj.pet)

  const [itemServiceResponse, _] = await Promise.all([
    mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/item_services/${props.injectDetail?.id_item_service}`
    ),
    useCommonStore().fetchPreparationCommonList({ code_common: [1, 4, 5, 12] }),
    useCliCommonStore().fetchPreparationCliCommonList({
      code_cli_common: [5, 16, 13]
    }),
    useAddressesStore().fetchAddresses(customerStore.getCustomer.id_customer)
  ])

  addressList.value = useAddressesStore()
    .addresses.filter(
      (address: any) =>
        address.id_customer == customerStore.getCustomer.id_customer
    )
    .map((address: any) => ({
      label: ` ${address.zip_code ?? ''} ${address.address_prefecture ?? ''} ${
        address.address_city ?? ''
      } ${address.address_other ?? ''} `,
      value: address.id_address
    }))

  publicHealthCenterList.value = [
    ...useCliCommonStore()
      .getCliCommonPublicHealthCenterList.filter(
        (phc: any) =>
          phc.date_start <= getDateToday() && phc.date_end >= getDateToday()
      )
      .map((phc: any) => ({
        ...phc,
        label: `${phc.code_func1} ${phc.name_cli_common}`,
        value: `${phc.code_func1} ${phc.name_cli_common}`
      }))
  ]
  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    }))

  let timeStart = '00:00'
  let timeEnd = '00:00'

  if (props.injectDetail.datetime_end && props.injectDetail.datetime_start) {
    timeStart = dayjs(
      props.injectDetail.datetime_end,
      'YYYY/MM/DD HH:mm:ss'
    ).format('HH:mm')
    timeEnd = dayjs(
      props.injectDetail.datetime_start,
      'YYYY/MM/DD HH:mm:ss'
    ).format('HH:mm')
  }

  if (timeStart !== '00:00' || timeEnd !== '00:00') {
    timeOption.value = true
  }

  injectDetailForm.value = {
    ...props.injectDetail,
    time_start: timeStart ?? '00:00',
    time_end: timeEnd ?? '00:00',
    id_clinic: JSON.parse(<string>localStorage.getItem('clinic'))?.id_clinic,
    type_medicine_dosage: props.injectDetail?.type_medicine_dosage?.toString(),
    rabies: props.injectObj.rabies ? props.injectObj.rabies : {}
  }

  if (
    injectDetailForm.value.time_start &&
    injectDetailForm.value.time_start != ''
  ) {
    injectDetailForm.value.time_start =
      injectDetailForm.value.time_start.split(':')[0] +
      ':' +
      injectDetailForm.value.time_start.split(':')[1]
  }

  isEdit.value = true
  setBookingIfUpdateCase()

  if (itemServiceResponse) {
    if (itemServiceResponse.medicine) {
      medicineObj.value = itemServiceResponse.medicine
      flgPlusItem.value =
        itemServiceResponse.flg_merge_price ||
        itemServiceResponse.medicine.flg_plus_item
      injectDetailForm.value.checked = flgPlusItem.value
    }
    itemServiceUnitList.value = itemServiceResponse.item_service_unit_list

    selectedUnit.value = itemServiceResponse.item_service_unit_list.find(
      (v) =>
        v.id_item_service_unit == injectDetailForm.value.id_item_service_unit
    )

    if (itemServiceResponse.dosage_variable_list) {
      dosageVariableRes.value = itemServiceResponse.dosage_variable_list

      await selectedTypeMedicine(
        injectDetailForm.value.type_medicine_dosage,
        true
      )
    }
    injectDetailJson = JSON.stringify(injectDetailForm.value)

    itemServiceUnitObj.value = itemServiceResponse.item_service_unit_list.find(
      (v) =>
        v.id_item_service_unit == injectDetailForm.value.id_item_service_unit
    )
    // itemServiceUnitObj.value = itemServiceResponse.item_service_unit_list[0]
  }

  injectDetailForm.value.calculation_fixed_unit = '2'

  if (props.otherInjectDetailList?.length > 0) {
    props.otherInjectDetailList.forEach((v) => {
      injectEffortList.value.push({
        ...v,
        checked: true
      })
    })
  }

  if (!typeAnimalUI.value) {
    await mtUtils.alert('動物種を設定してください。', '確認')
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader
      :close-bt="false"
      class="light-shot-blue"
      @closeModal="closeModal"
    >
      <q-toolbar-title class="text-grey-900 title2 bold cursor-pointer">
        <span>注射・点滴：</span>
        {{ injectObj?.number_inject }}
        <q-icon
          class="text-blue"
          name="content_copy"
          @click="copyText(injectObj?.number_inject)"
        />
      </q-toolbar-title>
      <q-space></q-space>
      <MtInputForm
        v-model="petSelectedLabel"
        label="ペット"
        readonly
        type="text"
      />
      <!-- <MtPetFilterSelect
        v-model:selecting="id_pet"
        :pet-list="petList"
        class="col-auto"
        readonly
      /> -->
      <div class="q-ml-sm col-1">
        <MtInputForm
          v-model="typeAnimalUI"
          label="動物種"
          readonly
          type="text"
        />
      </div>
      <MtInputForm
        v-model="valWeightUI"
        class="col-1 q-ml-md"
        label="体重"
        readonly
        type="text"
      />
      <q-btn class="q-mx-sm" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-pa-lg content">
      <div class="flex justify-between q-pa-md light-shot-blue">
        <div>
          <div class="flex items-center">
            <div class="title2 text-grey-900 bold q-mb-xs">
              {{
                props.injectDetail?.flg_etc1
                  ? props.injectDetail.item_service?.name_item_service
                  : props.injectDetail.name_inject_display
              }}
            </div>

            <div @click.stop="openItemServiceModel(injectDetail)">
              <q-btn class="text-grey-700" flat icon="quiz" round size="12px" />
            </div>
          </div>
          <div class="text-body2 text-grey-700 flex items-center">
            {{ injectDetailForm.name_category1 }}
            <q-icon name="arrow_right" />
            {{ injectDetailForm.name_category2 }}
          </div>
        </div>
        <div class="flex">
          <q-btn
            v-if="showButton"
            color="primary"
            unelevated
            @click="clickButtonPDFPrinting"
          >
            {{ showButton.button_label }}
          </q-btn>
        </div>
      </div>
      <div
        v-if="
          props.injectDetail?.type_detail == 2 ||
          props.injectDetail.type_detail == 3
        "
      >
        <div class="row q-col-gutter-md q-mt-xs">
          <div class="col-6">
            <MtInputForm
              v-model="injectDetailForm.memo_etc1"
              autogrow
              label="服用メモ"
              type="text"
            >
              <template #append>
                <q-icon
                  class="cursor-pointer"
                  name="add"
                  @click="openAddTextTemplateModal(51)"
                />
              </template>
            </MtInputForm>
          </div>
          <div class="col-6">
            <MtInputForm
              v-model="injectDetailForm.memo_etc2"
              autogrow
              label="注意事項"
              type="text"
            >
              <template #append>
                <q-icon
                  class="cursor-pointer"
                  name="add"
                  @click="openAddTextTemplateModal(52)"
                />
              </template>
            </MtInputForm>
          </div>
        </div>
        <template
          v-if="injectEffortList?.length > 0"
          v-for="effort_item in injectEffortList"
        >
          <div
            class="row q-col-gutter-md q-mb-md mt-2"
            style="flex-direction: column"
          >
            <div class="row border-bottom q-mt-md">
              <div class="col-6">
                <MtFormCheckBox
                  v-model:checked="effort_item.checked"
                  :label="effort_item.name_inject_display"
                  class="q-mr-md"
                  @update:checked="
                    (value) => {
                      effort_item.val_dosage_decided = value ? 1 : 0
                    }
                  "
                />
              </div>
              <div class="col-3">
                <MtFormInputNumber
                  v-if="effort_item.checked"
                  v-model:value="effort_item.val_dosage_decided"
                  class="q-mr-md"
                  label="数量"
                  mode="dosage"
                />
              </div>
              <div class="col-3 flex items-end justify-end">
                <div v-if="effort_item.checked" class="caption1 regular">
                  合計金額：
                  {{
                    itemServiceUnitObj?.unit_price *
                    (effort_item.val_dosage_decided ?? 1)
                  }}
                  円
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div
            class="row q-col-gutter-md q-mb-md mt-2"
            style="flex-direction: column"
          >
            <div class="row border-bottom q-mt-md">
              <div class="col-3">
                <MtFormInputNumber
                  v-model:value="injectDetailForm.val_dosage_decided"
                  class="q-mr-md"
                  label="数量"
                  mode="dosage"
                />
              </div>
              <div class="col-3 flex items-end justify-end">
                {{
                  itemServiceUnitObj?.unit_price *
                  (injectDetailForm.val_dosage_decided ?? 1)
                }}
                円
              </div>
            </div>
          </div>
        </template>
      </div>
      <div v-else>
        <div
          v-if="medicineObj.flg_drip_carrier"
          class="drip-box q-pa-sm q-mb-md q-mt-lg"
        >
          <div class="row items-center">
            <span class="text-white pill-title title4">点滴指示</span>
          </div>
          <div class="row q-col-gutter-md q-my-sm">
            <div class="col-1 q-mr-md"></div>
            <div class="col-4">
              <InputEmployeeOptGroup
                v-model:selected="injectDetailForm.id_employee_doctor"
                department-selected=""
                label="担当医 *"
                required
                show-select-default-employee
                type-occupation="doctor"
              />
            </div>
            <div class="col-4">
              <InputEmployeeOptGroup
                v-model:selected="injectDetailForm.id_employee_staff"
                department-selected=""
                label="担当者"
                show-select-default-employee
                type-occupation="doctor"
              />
            </div>
            <div v-if="false" class="col-3">
              <MtFormInputNumber
                v-model:value="injectDetailForm.num_conduct"
                label="回数指定"
                :decimal-size="1"
                mode="dosage"
              />
            </div>
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="injectDetailForm.calculation_fixed_unit"
                val="1"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="injectDetailForm.time_process"
                label="投与時間"
                type="number"
                @updatedValue="
                  (value) => {
                    if (value == '1') {
                      injectDetailForm.time_process =
                        injectDetailForm.time_process / 60
                    }
                    injectUtils.computeVolume(injectDetailForm)
                    injectUtils.computeFlowRate(injectDetailForm)
                  }
                "
                :disable="injectDetailForm.calculation_fixed_unit == '1'"
              />
            </div>
            <MtFormRadiobtn
              label="時間"
              v-model="injectDetailForm.type_process_time"
              :val="1"
              class="q-pr-md"
              @update:selected="
                (value) => {
                  if (value == '2') {
                    injectDetailForm.time_process =
                      injectDetailForm.time_process * 60
                  }
                  injectUtils.computeVolume(injectDetailForm)
                }
              "
            />
            <MtFormRadiobtn
              label="分間"
              v-model="injectDetailForm.type_process_time"
              :val="2"
              class="q-pr-md"
              @update:selected="
                (value) => {
                  injectUtils.computeVolume(injectDetailForm)
                  if (value == '2') {
                    injectDetailForm.type_speed_unit = 2
                  }
                }
              "
            />
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="injectDetailForm.calculation_fixed_unit"
                class="q-pr-md"
                val="2"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="injectDetailForm.speed_process"
                type="number"
                :disable="injectDetailForm.calculation_fixed_unit == '2'"
                label="流量速度"
                @updatedValue="
                  () => {
                    injectUtils.computeTime(injectDetailForm)
                    injectUtils.computeVolume(injectDetailForm)
                  }
                "
              />
            </div>
            <MtFormRadiobtn
              label="mL/時"
              v-model="injectDetailForm.type_speed_unit"
              :val="1"
              class="q-pr-md"
              :disable="injectDetailForm.type_process_time == '2'"
              @update:selected="
                () => {
                  injectUtils.computeVolume(injectDetailForm)
                }
              "
            />
            <MtFormRadiobtn
              class="q-pr-md"
              v-model="injectDetailForm.type_speed_unit"
              :val="2"
              label="mL/分"
              @update:selected="
                () => {
                  injectUtils.computeVolume(injectDetailForm)
                }
              "
            />
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="injectDetailForm.calculation_fixed_unit"
                class="q-pr-md"
                val="3"
              />
            </div>
            <div class="col-5">
              <MtFormInputNumber
                v-model:value="injectDetailForm.val_used_liquid"
                :disable="injectDetailForm.calculation_fixed_unit == '3'"
                class="field-right-text assort-drip-text-1"
                label="投与量"
                mode="dosage"
                @update:value="
                  (value) => {
                    injectUtils.computeTime(injectDetailForm)
                    injectUtils.computeFlowRate(injectDetailForm)
                  }
                "
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <MtInputForm
                v-model="injectDetailForm.memo_inject"
                autogrow
                label="注射・点滴メモ"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md justify-between">
            <div class="col-6">
              <MtFormCheckBox
                v-model:checked="injectDetailForm.flg_non_charge"
                label="会計対象外"
              />
            </div>
            <div class="col-6">
              <MtFormCheckBox
                v-model:checked="injectDetailForm.flg_apply_insurance"
                label="保険適用"
              />
            </div>
          </div>
        </div>
        <div
          v-if="!medicineObj.flg_drip_carrier"
          class="q-mx-md q-pa-sm q-mb-md"
        >
          <div class="row q-col-gutter-md q-my-md">
            <div class="col-auto">投薬方法 *</div>
            <div class="col-auto q-pt-sm">
              <MtFormRadiobtn
                v-if="medicineObj.flg_dosage_fixed"
                v-model="injectDetailForm.type_medicine_dosage"
                :disable="true"
                :readonly="true"
                class="q-pr-md"
                label="早見表"
                val="1"
                @update:selected="selectedTypeMedicine"
              />
              <MtFormRadiobtn
                v-if="medicineObj.flg_dosage_variable"
                v-model="injectDetailForm.type_medicine_dosage"
                class="q-pr-md"
                label="可変量/kg"
                val="2"
                @update:selected="selectedTypeMedicine"
                :disable="true"
                :readonly="true"
              />
              <MtFormRadiobtn
                v-if="medicineObj.flg_dosage_per_head"
                v-model="injectDetailForm.type_medicine_dosage"
                class="q-pr-md"
                label="可変量/head"
                val="3"
                @update:selected="selectedTypeMedicine"
                :disable="true"
                :readonly="true"
              />
              <MtFormRadiobtn
                v-if="medicineObj.flg_dosage_quantity"
                v-model="injectDetailForm.type_medicine_dosage"
                label="数量指定"
                val="4"
                @update:selected="selectedTypeMedicine"
                :disable="true"
                :readonly="true"
              />
            </div>
          </div>
          <div
            v-if="
              dosageVariableRange &&
              ([2, '2'].includes(injectDetailForm.type_medicine_dosage) ||
                injectDetailForm.type_medicine_dosage == 3)
            "
          >
            <div class="row">
              <MtFormInputNumber
                v-if="
                  injectDetailForm.val_dosage_decided &&
                  !selectedUnit?.val_efficacyingredient &&
                  injectDetailForm.val_weight
                "
                v-model:value="injectDetailForm.val_efficacy_strength_doctor"
                class="col-2 field-right-text doctor-amount-icon"
                label="投与レート"
                mode="dosage"
                :decimal-size="4"
              />
              <MtFormInputNumber
                v-else
                v-model:value="injectDetailForm.val_efficacy_strength_doctor"
                class="col-2 field-right-text doctor-amount-icon"
                label="投与成分量"
                mode="dosage"
                :decimal-size="3"
              />
              <div
                v-if="
                  efficacyCalculation && selectedUnit.val_efficacyingredient
                "
                class="flex calculation-process bi-grid-3x2-gap"
              >
                <q-icon class="q-pt-xs q-mr-sm" name="info" />
                {{ '投与1回あたりの有効成分量： ' + efficacyCalculation }}
              </div>
              <div
                v-if="
                  injectDetailForm.val_dosage_decided &&
                  !selectedUnit?.val_efficacyingredient &&
                  injectDetailForm.val_weight
                "
                class="flex calculation-process bi-grid-3x2-gap"
              >
                <q-icon class="q-pt-xs q-mr-sm" name="info" />
                投与レートから計算
              </div>
            </div>
            <div class="row q-my-sm">
              <div
                v-if="
                  injectDetailForm.val_dosage_decided &&
                  !selectedUnit?.val_efficacyingredient &&
                  injectDetailForm.val_weight
                "
                class="dosage-variable-range"
              >
                投与レートの範囲： {{ dosageVariableRange }}
                <span class="q-mr-xs">{{ dosageVariableRangeUnit }}</span>
              </div>
              <div v-else class="dosage-variable-range">
                規定成分量範囲： {{ dosageVariableRange }}
                <span class="q-mr-xs">{{ dosageVariableRangeUnit }}</span>
              </div>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="injectDetailForm.date_start"
                label="開始日"
                @update:date="
                  () => {
                    injectDetailForm.date_end = injectDetailForm.date_start
                    injectDetailForm.total_days_dose = calculateDays(
                      injectDetailForm.date_start,
                      injectDetailForm.date_end
                    )
                  }
                "
              />
            </div>
            <div class="col-3" v-if="timeOption">
              <MtFormPullDown
                v-model="injectDetailForm.time_start"
                :options="timeHourMinute"
                label="時：分"
                type="selection"
              />
            </div>
            <div class="col-3">
              <MtFormInputDate
                v-model:date="injectDetailForm.date_end"
                label="終了日"
                @update:date="
                  () => {
                    if (
                      injectDetailForm.date_start > injectDetailForm.date_end
                    ) {
                      injectDetailForm.date_start = injectDetailForm.date_end
                    }
                    injectDetailForm.total_days_dose = calculateDays(
                      injectDetailForm.date_start,
                      injectDetailForm.date_end
                    )
                  }
                "
              />
            </div>
            <div class="col" v-if="timeOption">
              <MtFormPullDown
                v-model="injectDetailForm.time_end"
                :options="timeHourMinute"
                label="時：分"
                type="selection"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputNumber
                v-model:value="injectDetailForm.num_conduct"
                autogrow
                label="回数指定"
                :decimal-size="1"
                mode="dosage"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="injectDetailForm.lot_number1"
                label="ロット番号 1"
                type="text"
              />
            </div>
            <div class="col-3">
              <!-- <div
            v-if="!injectDetailForm.code_category2 == 'MD10_1'"
            class="col-5"
          > -->
              <MtInputForm
                v-model="injectDetailForm.lot_number2"
                autogrow
                label="ロット番号 2"
                type="text"
              />
            </div>
          </div>
          <div
            v-if="injectDetailForm.code_category2 == 'MD10_1'"
            class="row q-col-gutter-md q-mb-md"
          >
            <div class="col-4">
              <MtInputForm
                v-model="injectDetailForm.rabies.num_tag"
                autogrow
                label="済票番号"
                type="text"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="injectDetailForm.rabies.type_rabies_round"
                :options="typeRabiesRound"
                autogrow
                label="代行区分"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="injectDetailForm.rabies.id_address"
                :options="addressList"
                autogrow
                label="申請住所"
              />
            </div>

            <div class="col-4">
              <MtFormInputDate
                v-model:date="injectDetailForm.rabies.date_tag_issued"
                label="済票発行日"
              />
            </div>
            <div class="col-4">
              <MtInputForm
                v-model="injectDetailForm.rabies.license_id"
                autogrow
                label="鑑札番号/登録番号"
                type="text"
              />
            </div>
            <div class="col-4">
              <q-select
                :options="publicHealthCenterList"
                bg-color="white"
                class="clear-icon"
                v-model="injectDetailForm.rabies.code_city_hall"
                emit-value
                clearable
                color="blue"
                label="保健所CD"
                dense
                use-input
                @new-value="createValue"
                @update:modelValue="
                  (value) => {
                    if (value) {
                      injectDetailForm.rabies.code_city_hall = value
                    }
                  }
                "
              ></q-select>
            </div>
            <div class="col-4">
              <InputEmployeeOptGroup
                v-model:selected="
                  injectDetailForm.rabies.id_employee_registered
                "
                label="登録担当者ID"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="injectDetailForm.rabies.type_rabies_process"
                :options="typeRabiesProcess"
                label="狂犬病申請処理区分"
              />
            </div>
            <div class="col-4">
              <InputEmployeeOptGroup
                v-model:selected="injectDetailForm.rabies.id_employee_processed"
                label="申請担当者ID"
              />
            </div>
            <div class="col-8">
              <MtInputForm
                v-model="injectDetailForm.rabies.memo_process"
                autogrow
                label="狂犬病用 院内処理メモ"
                type="text"
              />
            </div>
            <!-- <div class="col-12">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-4">
                  <MtFormCheckBox
                    v-model:checked="injectDetailForm.rabies.flg_exempt"
                    label="猶予"
                  />
                </div>
                <div v-if="injectDetailForm.rabies.flg_exempt" class="col-4">
                  <MtFormInputDate
                    v-model:date="injectDetailForm.rabies.date_exempt_start"
                    label="猶予開始日"
                  />
                </div>
              <div v-if="injectDetailForm.rabies.flg_exempt" class="col-4">
                <MtFormInputDate
                  v-model:date="injectDetailForm.rabies.date_exempt_end"
                  label="猶予終了日"
                />
              </div>
              <div v-if="injectDetailForm.rabies.flg_exempt" class="col-6">
                <MtInputForm
                  v-model="injectDetailForm.rabies.memo_exemption_rabies"
                  autogrow
                  label="猶予理由"
                  type="text"
                />
              </div>

            </div>
          </div> -->
            <div class="col-4"></div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-3 col-md-6 col-sm-6">
              <InputEmployeeOptGroup
                v-model:selected="injectDetailForm.id_employee_doctor"
                department-selected=""
                label="担当医 *"
                required
                show-select-default-employee
                type-occupation="doctor"
              />
            </div>
            <div class="col-lg-3 col-md-6 col-sm-6">
              <InputEmployeeOptGroup
                v-model:selected="injectDetailForm.id_employee_staff"
                department-selected=""
                label="担当者"
                show-select-default-employee
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <MtInputForm
                v-model="injectDetailForm.memo_inject"
                autogrow
                label="注射・点滴 個別メモ"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md justify-between">
            <div class="col">
              <MtFormCheckBox v-model:checked="timeOption" label="時刻" />
            </div>
            <div class="col">
              <MtFormCheckBox
                v-model:checked="injectDetailForm.flg_non_charge"
                label="会計対象外"
              />
            </div>
            <div class="col">
              <MtFormCheckBox
                v-model:checked="injectDetailForm.flg_apply_insurance"
                label="保険適用"
              />
            </div>
            <div class="col">
              <div class="col">
                <MtInputForm
                  v-model="tBookingFlag"
                  :items="[{ label: '次回予定の作成' }]"
                  type="checkbox"
                  @update:model-value="changeFlgSchedule"
                />
              </div>
            </div>
          </div>
          <div v-if="tBookingFlag" class="">
            <div class="row q-col-gutter-md q-pa-md items-center">
              <div class="col-4">
                <MtFormInputDate
                  v-model:date="tBookingData.date_booking_confirmed"
                  datetime
                  label="予定日"
                />
              </div>
              <div class="col-3 text-center">
                <MtInputForm
                  v-model="tBookingFlgTime"
                  :items="[{ label: '時刻' }]"
                  type="checkbox"
                />
              </div>
              <div v-if="tBookingFlgTime" class="col-4">
                <MtFormPullDown
                  v-model="tBookingData.time_booking_confirmed"
                  :options="timeHourMinute"
                  label="時：分"
                  type="selection"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="medicineObj.flg_drip_carrier"
          class="assort-container full-width q-mt-md"
        >
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">投与薬明細</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              以下の内容で注射 / 点滴します。
            </span>
          </div>
          <div class="row q-mb-xs flex full-width">
            <div class="col-9 col-sm-9 col-md-9 flex item-name">
              {{ injectDetailForm.name_inject_display }}
            </div>
            <div class="col-3">
              <div
                class="flex column q-mb-md"
                @click="
                  () => {
                    toggleDialog1 = !toggleDialog1
                  }
                "
              >
                <MtFormInputNumber
                  v-model="injectDetailForm.val_dosage_decided"
                  class="field-right-text assort-drip-text"
                  label="売上量"
                  mode="dosage"
                  readonly
                  :decimal-size="1"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="!medicineObj.flg_drip_carrier"
          class="assort-container q-mt-md"
        >
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">投与薬明細</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              以下の内容で処方します。
            </span>
          </div>
          <div class="row q-mb-xs flex full-width">
            <div class="col-9 col-sm-9 col-md-9 flex item-name column">
              {{ injectDetailForm.name_inject_display }}
              <span
                v-if="
                  itemServiceUnitObj?.val_efficacyingredient &&
                  Number(itemServiceUnitObj?.val_efficacyingredient) > 0
                "
                class="caption1 regular total-volume q-mt-xs q-ml-sm"
              >
                力価：{{
                  roundZeroAfterPoint(
                    itemServiceUnitObj?.val_efficacyingredient
                  )
                }}
                {{
                  useCommonStore().getCommonUnitOptionList.find(
                    (v) =>
                      v.id_common == itemServiceUnitObj?.id_cm_unit_medicine
                  )?.name_common
                }}
              </span>
              <span
                v-if="
                  itemServiceUnitObj?.val_liquid &&
                  Number(itemServiceUnitObj?.val_liquid) > 0
                "
                class="caption1 regular total-volume q-ml-sm"
              >
                全量： {{ itemServiceUnitObj?.val_liquid }} mL
              </span>
              <span v-else class="caption1 regular total-volume q-ml-sm">
                登録なし
              </span>

              <div
                v-if="
                  injectDetailForm.val_dosage_decided &&
                  selectedUnit?.val_efficacyingredient &&
                  injectDetailForm.val_weight
                "
                class="dosage-variable-range"
              >
                処方明細の総有効成分量：
                <span class="q-ml-sm">
                  （
                  {{
                    Number(efficacyPetKg.toFixed(2)) == 0
                      ? roundZeroAfterPoint(efficacyPetKg) +
                        ` ${unitName(selectedUnit.id_cm_unit_medicine)} / Kg`
                      : roundZeroAfterPoint(efficacyPetKg.toFixed(2)) +
                        ` ${unitName(selectedUnit.id_cm_unit_medicine)} / Kg`
                  }}）
                </span>
              </div>
              <div
                v-if="
                  injectDetailForm.val_dosage_decided &&
                  !selectedUnit?.val_efficacyingredient &&
                  injectDetailForm.val_weight
                "
                class="dosage-variable-range"
              >
                <span class="q-ml-sm">
                  （
                  {{
                    `${
                      Number(injectDetailForm.val_weight) / 1000
                    } * ${roundZeroAfterPoint(
                      injectDetailForm.val_efficacy_strength_doctor
                    )} = ${(
                      (Number(injectDetailForm.val_weight) / 1000) *
                      Number(injectDetailForm.val_efficacy_strength_doctor)
                    ).toFixed(2)} ml`
                  }}
                  ）
                </span>
              </div>
            </div>
            <div class="col-3">
              <div class="c-grid-w">
                <MtFormInputNumber
                  v-model:value="injectDetailForm.val_dosage_decided"
                  label="売上量"
                  mode="dosage"
                  :decimal-size="4"
                />
                <div>
                  {{
                    unitName(
                      getItemServiceUnit(injectDetailForm.id_item_service_unit)
                        ?.id_common
                    )
                  }}
                </div>
                総売上量 :
                {{
                  parseFloat(
                    injectDetailForm.num_conduct *
                      injectDetailForm.val_dosage_decided
                  ).toFixed(2)
                }}
                {{
                  unitName(
                    getItemServiceUnit(injectDetailForm.id_item_service_unit)
                      ?.id_common
                  )
                }}
              </div>

              <div class="c-grid-w">
                <div>
                  <MtFormInputNumber
                    v-model:value="injectDetailForm.val_used_portion"
                    class="field-right-text assort-drip-text-1 ml-for-portion"
                    label="1回投与量"
                    mode="dosage"
                    :decimal-size="4"
                    @blur="updatePortion"
                  />
                </div>
                <div>ml</div>
                総投与量 :
                {{
                  parseFloat(
                    (
                      injectDetailForm.num_conduct *
                      injectDetailForm.val_used_portion
                    ).toFixed(2)
                  )
                }}
                ml
              </div>
            </div>
          </div>
        </div>
      </div>
      <q-dialog v-model="toggleDialog1" size="sm">
        <q-card>
          <MtModalHeader
            :closeBtn="false"
            @close-modal="() => (toggleDialog1 = !toggleDialog1)"
          >
            <div class="column q-mb-sm">
              <q-toolbar-title
                class="text-grey-900 title2 bold q-pa-none q-mt-md q-mb-xs"
              >
              </q-toolbar-title>
            </div>
          </MtModalHeader>
          <q-card-section class="q-pa-md">
            <div class="c-grid">
              <div class="q-mb-lg">
                <MtFormPullDown
                  v-model:selected="percent"
                  :options="percentOption"
                  label="drip unit"
                  :menu-self="'center start'"
                  @update:selected="
                    (value) => {
                      injectDetailForm.val_dosage_decided = value / 100
                      injectDetailForm.val_used_portion =
                        (itemServiceUnitObj.val_liquid * value) / 100
                    }
                  "
                />
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-bt bg-white">
            <div class="text-center modal-btn">
              <q-btn
                class="bg-grey-100 text-grey-800"
                outline
                @click="() => (toggleDialog1 = false)"
              >
                <span>閉じる</span>
              </q-btn>
              <q-btn
                class="q-ml-md"
                color="primary"
                unelevated
                @click="updateValue1"
              >
                <span>保存</span>
              </q-btn>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-card-section>

    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          :disable="
            isSubmitAble ||
            injectObj?.flg_cancel ||
            injectDetailForm.flg_cancel ||
            disableHeaderUpdate
          "
          class="q-ml-md"
          color="primary"
          type="submit"
          unelevated
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="処方箋"
    :options="memoTemplates"
    :data="injectDetailForm"
    :single-option="true"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>
<style lang="scss" scoped>
.modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 0;
}

.modal-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background-color: $white;
  border-top: 1px solid #e0e0e0;
}

.font-12px {
  font-size: 12px !important;
}

.assort-container {
  border-radius: 4px;
  border: 1px solid var(--System-Gray-500, #9e9e9e);
  background: var(--System-Gray-100, #f5f5f5);
  display: flex;
  padding: 10px 15px 10px 15px;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  align-self: stretch;

  .dose-container {
    display: flex;
    align-items: center;
    align-self: stretch;
    border-top: 1px solid var(--System-Gray-600, #757575);

    .amount-dose {
      color: var(--System-Gray-900, #212121);
      font-size: 15px;
      font-style: normal;
      font-weight: 700;
      line-height: 20px; /* 133.333% */
    }

    .second-col-dose {
      color: var(--System-Gray-900, #212121);
      font-size: 12px;
      font-style: normal;
      font-weight: 700;
      line-height: 15px; /* 125% */
      .pill-title {
        color: var(--System-Gray-900, #212121);
        font-size: 15px;
        font-style: normal;
        font-weight: 700;
        line-height: 20px; /* 133.333% */
      }
    }
  }
}

.doctor-amount-icon::after {
  content: 'mg';
  top: 65% !important;
}

.total-days-dose-icon::after {
  content: '日';
  top: 65% !important;
}

::v-deep(.q-select.disable-color) {
  background-color: $light-shot-blue !important;
}

.mt-small-popup {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
  width: 260px !important;
}

.division-model {
  height: 225px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.drip-box {
  background: #fffbea;

  .pill-title {
    background-color: #c1a14e;
    color: white;
  }
}

.item-name {
  color: var(--System-Gray-900, #212121);
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
  line-height: 20px; /* 133.333% */
}

.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}

.total-volume {
  color: $grey-700;
  padding: 5px;
  border-radius: 5px;
  font-size: 13px;
  display: inline-block;
}

.c-grid-w {
  display: grid;
  grid-template-columns: 3fr 1fr;
  column-gap: 10px;
}
</style>
