<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref } from 'vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import selectOptions from '@/utils/selectOptions'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import PrescriptionDetailAssortListBox from '@/pages/request/prescription/PrescriptionDetailAssortListBox.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import usePrescriptionStore from '@/stores/prescription'
import { storeToRefs } from 'pinia'
import aahValidations from '@/utils/aahValidations'
import { groupBy, random } from 'lodash'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
// import { CATEGORY_PRESCRIPTION_PDF_PRINTING } from '@/utils/const/constPrescriptionDetail'
import usePrintStore from '@/stores/prints'
import { prescriptionDetailAttributes } from '@/utils/pdfAttributes/prescriptionDetails'
import useClinicStore from '@/stores/clinics'
import useRequestStore from '@/stores/requests'
import useItemServiceUnitStore from '@/stores/item-service-units'

import {
  aahUtilsGetEmployeeName,
  aahUtilsGetUpdatedEmployeeName,
  calculateDate,
  calculateDays,
  concatenate,
  copyText,
  dateFormat,
  formatDateWithTime,
  getDateByFormat,
  getDateToday,
  roundZeroAfterPoint
} from '@/utils/aahUtils'

import useDoseStore from '@/stores/dose-frequencies'
import aahMessages from '@/utils/aahMessages'
import GeneralCancellationModel from '@/components/GeneralCancellationModel.vue'
import useCommonStore from '@/stores/common'
import useEmployeeStore from '@/stores/employees'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import prescriptionUtils from '@/pages/request/prescription/prescriptionUtils'
import { event_bus } from '@/utils/eventBus'
import PrescriptionDetailAssortDripBox from '@/pages/request/prescription/PrescriptionDetailAssortPowderBox.vue'
import { timeHourMinute, typeBodyWeightUnit } from '@/utils/enum'
import useCliCommonStore from '@/stores/cli-common'
import useCategoryStore from '@/stores/categories'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useTextTemplateStore from '@/stores/text-template'
import PrescriptionDetailAssortGenericListBox
  from '@/pages/request/prescription/PrescriptionDetailAssortGenericListBox.vue'
import { TextTemplateType } from '@/types/types'
import PrescriptionDetailAssortBPowderBox from '@/pages/request/prescription/PrescriptionDetailAssortBPowderBox.vue'

export type PartialTextTemplateType = Pick<TextTemplateType, 'title' | 'flg_title' | 'attr' | 'isSelected'>

const UpdatePrintCanvasModal = defineAsyncComponent(
  () => import(`@/pages/master/print/UpdatePrintCanvasModal.vue`)
)

const props = defineProps({
  prescriptionObj: Object,
  prescriptionDetail: Object,
  isLeft: {
    default: false
  }
})
const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const prescriptionStore = usePrescriptionStore()
const commonStore = useCommonStore()
const itemUnitStore = useItemServiceUnitStore()

const isSubmitAble = ref(false)
const doseStore = useDoseStore()
const printStore = usePrintStore()
const categoryStore = useCategoryStore()
const cliCommonStore = useCliCommonStore()
const employeeStore = useEmployeeStore()
const clinicStore = useClinicStore()
const requestStore = useRequestStore()
const templateStore = useTextTemplateStore()

const { getTemplates } = storeToRefs(templateStore)
const { getPrint } = storeToRefs(printStore)
const { getPrescriptionAssortVolume } = storeToRefs(usePrescriptionStore())

const loading = ref(false)

const closeModal = () => {
  emits('close')
}

const petList = ref()
const id_pet = ref()
const itemServiceUnitD = ref(false)
const filteredDoseOptionList: any = ref([])
const typeMedicineOptionList: any = ref([])
const typeMedicineDefaultOptionList: any = reactive([])

let old_id_prescription_detail: any = null
let prescriptionDetailJson = null
const isQuantityAvailable = ref(true)
const dosageFrequencyList = ref<any>([])
const quantity_dose = ref<any>(0)
const isEdit = ref(false)
const filteredOptionList = ref([])

const medicineObj = ref<any>({
  id_dosage_frequency_1: null,
  id_dosage_frequency_2: null,
  id_dosage_frequency_3: null
})
const itemServiceUnitList: any = ref([])
const dosageVariableRes: any = ref([])
const dosageFixedList: any = ref([])
const dosageFixedListByGroup: any = ref({})
const dosageVariableRangeUnit: any = ref()
const dosageVariableRangeValue: any = ref({
  min: 0,
  max: 0
})

const prescriptionDetailForm = ref({
  id_prescription: null,
  id_prescription_detail: null,
  id_item_service: null,
  type_medicine_dosage: '1',
  dosage_frequency_UI: '1',
  id_dosage_frequency: null,
  total_days_dose: null,
  memo_dose: null as string | null,
  memo_clinic_prep: null,
  date_start: null,
  date_end: null,
  datetime_pickup_plan: null,
  memo_alert: null as string | null,
  flg_apply_insurance: false,
  id_category1: null,
  id_category2: null,
  prescription_detail_assort_list: <any>[],
  old_id_prescription_detail: null,
  val_efficacy_strength_doctor: null,
  val_total_efficacyingredient: null,
  total_amount_dose: null,
  dosage_frequency_CB_UI: false,
  flg_cancel: null,
  flg_hospitalization_usage: false,
  val_weight: null,
  flg_overdosing: false,
  id_clinic: null,
  id_pet: null,
  fe_division: {},
  name_medicine_format: null,
  id_employee_staff: null,
})

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
const pdfArrayBuffer = ref(null)

const receivedISU = ref({})
const typeDoseUI = ref(1)
const disableHeaderUpdate = ref(false)
const childFormRefs = ref([])
const dosageVariableRange: any = ref()

const disable_dosage_frequency_UI: any = ref(false)

const val_total_efficacyingredient = ref(assignComputedProperty())
const calculatedEfficacy = ref(null)

const feDivision = ref({
  fe_use: false,
  pill_division: []
})

const toggleDivision = ref(false)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
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
const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<PartialTextTemplateType[]>([])

const menuOptions = [
  {
    title: 'キャンセル',
    name: 'cancel',
    isChanged: false,
    attr: {
      class: props.prescriptionObj?.flg_delivered
        ? 'disabled'
        : prescriptionDetailForm.value.flg_cancel ||
        props.prescriptionObj?.flg_cancel
          ? 'disabled'
          : null,
      clickable: props.prescriptionObj?.flg_delivered
        ? false
        : !(
          prescriptionDetailForm.value.flg_cancel ||
          props.prescriptionObj?.flg_cancel
        )
    }
  },
  {
    title: '削除',
    name: 'delete',
    isChanged: false,
    attr: {
      class: props.prescriptionObj?.flg_delivered
        ? 'disabled'
        : prescriptionDetailForm.value.flg_cancel ||
        props.prescriptionObj?.flg_cancel
          ? 'disabled'
          : null,
      clickable: props.prescriptionObj?.flg_delivered
        ? false
        : !(
          prescriptionDetailForm.value.flg_cancel ||
          props.prescriptionObj?.flg_cancel
        )
    }
  }
]

const openMenu = async () => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'cancel') {
      if (props.prescriptionObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils.smallPopup(GeneralCancellationModel, {
        url: `prescription_details/${prescriptionDetailForm.value.id_prescription_detail}`,
        isMemo: false
      })
      closeModal()
    }
    if (selectedOption.name == 'delete') {
      if (props.prescriptionObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            prescriptionStore
              .destroyPrescriptionDetail(
                prescriptionDetailForm.value.id_prescription,
                prescriptionDetailForm.value.id_prescription_detail
              )
              .then(() => {
                event_bus.emit('reloadLeft')
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const calculateDay1 = (date_start, date_end, total_days) => {
  return calculateDays(date_start, date_end, total_days)
}

const getFormData = () => {

  if (flgPlusItem.value && prescriptionDetailForm.value?.prescription_detail_assort_list && prescriptionDetailForm.value.prescription_detail_assort_list.length > 0) {
    return prescriptionDetailForm.value.prescription_detail_assort_list = prescriptionDetailForm.value?.prescription_detail_assort_list?.filter((item) => item.checked)
  }

  prescriptionDetailForm.value.prescription_detail_assort_list = Object.values(
    childFormRefs.value
  )
    .map((childForm) => childForm.getFormData())
    .filter((formData) => formData !== null)

  if (prescriptionDetailForm.value.type_medicine_dosage == 2) {
    if (val_total_efficacyingredient.value > calculatedEfficacy.value) {
      prescriptionDetailForm.value.flg_overdosing = true
    }
  }
  return prescriptionDetailForm.value
}

const updateWholePill = (value) => {
  let calculatedRemainingPill = value.pill / calculatedTotalDosage.value

  let calculatedEfficacyIngredient = Number(calculatedRemainingPill) * Number(value.unit.val_efficacyingredient)

  prescriptionDetailForm.value.val_efficacy_strength_doctor = calculatedEfficacyIngredient / Number(prescriptionStore.getPrescriptionHeaderByPet(
    prescriptionDetailForm.value.id_pet
  )?.val_weight / 1000)

  prescriptionDetailForm.value.flg_overdosing = false
  if (prescriptionDetailForm.value.val_efficacy_strength_doctor > dosageVariableRangeValue.value.max) {
    prescriptionDetailForm.value.flg_overdosing = true
  }
}

function assignComputedProperty() {
  return computed(() => {
    const formValues = Object.values(childFormRefs.value)
      .map((childForm) => childForm.getFormData())
      .filter((formData) => formData !== null)

    return formValues.reduce((sum, formData) => {
      const efficacy = formData.val_efficacyingredient || 0
      const dosage = formData.val_dosage_decided || formData.val_dosage_suggested || 0
      if (prescriptionDetailForm.value.name_medicine_format != '錠') {
        return sum + efficacy
      }
      
      return sum + efficacy * dosage
    }, 0)
  })
}

const efficacyPetKg = computed(() => {
  return (
    val_total_efficacyingredient.value /
    prescriptionDetailForm?.value?.val_weight
  )
})

const comTypeDose = computed(() => {
  if (typeDoseUI.value == '1') {
    return '日'
  }
  if (typeDoseUI.value == '2') {
    return '週'
  }
  if (typeDoseUI.value == '3') {
    return 'ヵ月'
  }
  if (typeDoseUI.value == '10' || typeDoseUI.value == '99') {
    return '回分'
  }
  return '日'
})
const comTypeFreeUI = computed(() => {
  if (typeDoseUI.value == '1') {
    return '回/日'
  }
  if (typeDoseUI.value == '2') {
    return '回/週'
  }
  if (typeDoseUI.value == '3') {
    return '回/月'
  }
  return ''
})
const totalDoseUI = computed(() => {
  if (typeDoseUI.value == '1') {
    return 'total-days-dose-icon-default'
  }
  if (typeDoseUI.value == '2') {
    return 'total-days-dose-icon-week'
  }
  if (typeDoseUI.value == '3') {
    return 'total-days-dose-icon-month'
  }
  if (typeDoseUI.value == '10' || typeDoseUI.value == '99') {
    return 'total-days-dose-icon-demand'
  }
  return 'total-days-dose-icon-default'
})

const efficacyCalculation = computed(() => {
  calculatedEfficacy.value = roundZeroAfterPoint(
    props.prescriptionDetail?.val_weight *
    prescriptionDetailForm.value?.val_efficacy_strength_doctor
  )
  if (prescriptionDetailForm.value.type_medicine_dosage == '3') {
    calculatedEfficacy.value = roundZeroAfterPoint(
      1 * prescriptionDetailForm.value?.val_efficacy_strength_doctor
    )
    return concatenate(
      '1',
      '(kg) x ',
      roundZeroAfterPoint(
        prescriptionDetailForm.value.val_efficacy_strength_doctor
      ),
      ' = ',
      calculatedEfficacy.value,
      'mg'
    )
  }
  return concatenate(
    roundZeroAfterPoint(props.prescriptionDetail.val_weight),
    '(kg) x ',
    roundZeroAfterPoint(
      prescriptionDetailForm.value.val_efficacy_strength_doctor
    ),
    ' = ',
    calculatedEfficacy.value,
    'mg'
  )
})

const commonTypeAnimalOptionList: any = ref([])

const pillDivisionList: any = ref([])

const feDivisionFlgCount = computed(() => {
  return Object.entries(feDivision.value?.pill_division).reduce(
    (count, [key, value]) => {
      if (key == 'fe_use') {
        return count
      }
      return value.flg_func1 == true ? count + 1 : count
    },
    0
  )
})

function selectedTypeMedicineFormat(value) {
  if (!value) {
    prescriptionDetailForm.value.name_medicine_format = ''
    return
  }
  prescriptionDetailForm.value.name_medicine_format =
    useCommonStore().getCommonTypeMedicineFormatOptionList.find(
      (v: any) => v.id_common == value
    )?.name_common
}

async function selectedTypeMedicine(value: any = null, initCall: any = false) {
  if (isEdit.value && !initCall) {
    return
  }
  filteredDoseOptionList.value = doseStore.getAllDoses

  if (value == 2 || value == 3) {
    if (dosageVariableRes.value.length && dosageVariableRes.value.length > 0) {
      const temp_type_body_weight_unit = value == 2 ? [1, 2] : [3]
      var dosageVariable: any = null
      var pet = customerStore.getCustomer.pets.find(
        (petObj: any) => prescriptionDetailForm.value.id_pet == petObj.id_pet
      )

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
        dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
      }

      if (!dosageVariable) {
        await mtUtils.autoCloseAlert(
          '有効成分の服用範囲がマスタに登録されていません'
        )
      }
    }
  }
  if (value == 4) {
    filteredDoseOptionList.value = doseStore.getAllDoses
    let tempDosageFrequencyDosage: any = doseStore.getAllDoses.find(
      (dFObj: any) =>
        dFObj.value == prescriptionDetailForm.value.id_dosage_frequency
    )
    if (tempDosageFrequencyDosage) {
      prescriptionDetailForm.value.dosage_frequency_CB_UI = true
      prescriptionDetailForm.value.id_dosage_frequency = tempDosageFrequencyDosage.value
      typeDoseUI.value = tempDosageFrequencyDosage.type_dose
      quantity_dose.value = tempDosageFrequencyDosage.quantity_dose ?? 1
    }
  }
}

function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      prescriptionDetailForm.value[key] = data[key]
    }
  }
}

const valWeightUI = computed(() => {
  return `${props.prescriptionObj.val_weight / 1000} Kg`
})
const typeAnimalUI = computed(() => {
  if (
    customerStore?.getCustomer?.pets.find(
      (petObj: any) => petObj.id_pet == props.prescriptionObj.id_pet
    )?.id_cm_animal
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == props.prescriptionObj.id_pet
    )?.id_cm_animal
    return `${
      commonTypeAnimalOptionList.value.find(
        (obj: any) => obj.value == typeAnimal
      )?.label ?? ''
    }`
  }
  return ''
})

function checkValEfficacy(value) {
  const tempValue = JSON.parse(prescriptionDetailJson)
  if (tempValue.val_efficacy_strength_doctor != value && prescriptionDetailForm.value.name_medicine_format != '粉A') {
    prescriptionDetailForm.value.prescription_detail_assort_list = []
    isSubmitAble.value = true
    isEdit.value = false
  }
  prescriptionDetailForm.value.flg_overdosing = false
  if (value > dosageVariableRangeValue.value.max) {
    prescriptionDetailForm.value.flg_overdosing = true
  }
}

const setChildRef = (index) => (el) => {
  if (el) {
    childFormRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    childFormRefs.value.splice(index, 1)
  }
}

async function fetchItemServiceUnits() {
  const response = itemServiceUnitList.value

  if (response.length === 0) {
    await mtUtils.alert('この商品には、品名包装単位（子商品）の登録がありません。', '注意')
    return
  }
  
  if (response && response.length && response.length > 0) {
    prescriptionDetailForm.value.prescription_detail_assort_list.length = 0
    response.filter((itemUnit) => new Date(itemUnit.date_end) > new Date().getDate())
      .forEach((itemUnit: any) => {
        let tempObj = {
          id_prescription_detail_assort: random(10000, 100000),
          id_prescription: prescriptionDetailForm.value.id_prescription,
          id_prescription_detail:
          prescriptionDetailForm.value.id_prescription_detail,
          id_item_service_unit: itemUnit.id_item_service_unit,
          type_medicine_dosage: itemUnit.type_medicine_dosage,
          id_cm_unit_medicine: itemUnit.id_cm_unit_medicine,
          type_dosage_calculation: medicineObj.value.type_dosage_calculation,
          val_efficacyingredient: itemUnit.val_efficacyingredient
        }
        if (prescriptionDetailForm.value.typeMedicineDosage == 4) {
          tempObj['val_dosage_suggested'] = '1'
          totalDoseUI.value = 10
        }
        prescriptionDetailForm.value.prescription_detail_assort_list.push(tempObj)
    })
  }
  if (medicineObj.value.flg_drip_carrier) {
    await prescriptionUtils.processDripAssort(
      prescriptionDetailForm,
      response,
      medicineObj,
      receivedISU
    )
  }
}

event_bus.on('isu_child', (isu_child) => {
  receivedISU.value = { ...isu_child }
})

async function fetchSuggestedAmount() {
  if (!old_id_prescription_detail) {
    old_id_prescription_detail =
      prescriptionDetailForm.value.id_prescription_detail
  }
  if (
    !(await aahValidations.prescriptionDetailValidation(
      prescriptionDetailForm.value
    ))
  ) {
    return
  }
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'prescriptions/suggested_amounts',
    {
      prescription_detail_list: [
        {
          ...prescriptionDetailForm.value,
          id_clinic: JSON.parse(localStorage.getItem('id_clinic'))
        }
      ]
    }
  )
  isSubmitAble.value = false
  isEdit.value = false
  if (
    response &&
    response.prescription_detail_list &&
    response.prescription_detail_list.length > 0
  ) {
    prescriptionDetailForm.value.val_total_efficacyingredient = null
    prescriptionDetailForm.value.prescription_detail_assort_list = []
    const prescriptionDetailObj: any = response.prescription_detail_list[0]
    assignPageData(prescriptionDetailObj)
    prescriptionDetailForm.value.type_medicine_dosage = `${prescriptionDetailObj.type_medicine_dosage}`
    prescriptionDetailForm.value.prescription_detail_assort_list =
      response.prescription_detail_list[0].prescription_detail_assort_list
  }
  if (
    response &&
    response.error &&
    response.error.length &&
    response.error.length > 0
  ) {
    await mtUtils.autoCloseAlert('Error :' + response.error[0])
  }
}

function setTypeMedicineFormat() {
  filteredOptionList.value = doseStore.getAllDoses
  prescriptionDetailForm.value.type_medicine_dosage = `${props.prescriptionDetail?.type_medicine_dosage}`
  if (prescriptionDetailForm.value.type_medicine_dosage == '4') {
    // filteredOptionList.value = doseStore.getAllDoses.filter(
    //   (value) => !value.quantity_dose
    // )
  }
}

async function selectedIdDosageFrequency(value: any) {
  isQuantityAvailable.value = false
  if (value == 1 && medicineObj.value.id_dosage_frequency_1 && !prescriptionDetailForm.value.dosage_frequency_CB_UI) {
    prescriptionDetailForm.value.id_dosage_frequency =
      medicineObj.value.id_dosage_frequency_1
    if (dosageFrequencyList.value[0].quantity_dose) {
      quantity_dose.value = dosageFrequencyList.value[0].quantity_dose
      isQuantityAvailable.value = true
      return
    }
    const response: any = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'prescriptions/suggested_amounts',
      { prescription_detail_list: [prescriptionDetailForm.value] }
    )
    isSubmitAble.value = false
    isEdit.value = false
    if (
      response &&
      response.prescription_detail_list &&
      response.prescription_detail_list.length > 0
    ) {
      prescriptionDetailForm.value.val_total_efficacyingredient = null
      prescriptionDetailForm.value.prescription_detail_assort_list = []
      const prescriptionDetailObj: any = response.prescription_detail_list[0]
      assignPageData(prescriptionDetailObj)
      prescriptionDetailForm.value.type_medicine_dosage = `${prescriptionDetailObj.type_medicine_dosage}`
      const pdList = response.prescription_detail_list[0]
      if (
        pdList.prescription_detail_assort_list &&
        pdList.prescription_detail_assort_list.length > 0
      ) {
        prescriptionDetailForm.value.prescription_detail_assort_list =
          pdList.prescription_detail_assort_list
      }
    }
    if (
      response &&
      response.error &&
      response.error.length &&
      response.error.length > 0
    ) {
      await mtUtils.autoCloseAlert('Error : 処方箋の更新に失敗しました。')
    }
  }
  if (value == 2 && medicineObj.value.id_dosage_frequency_2 && !prescriptionDetailForm.valuedosage_frequency_CB_UI) {
    prescriptionDetailForm.value.id_dosage_frequency =
      medicineObj.value.id_dosage_frequency_2
    if (dosageFrequencyList.value[1].quantity_dose) {
      quantity_dose.value = dosageFrequencyList.value[1].quantity_dose
      isQuantityAvailable.value = true
      return
    }
  }
  if (value == 3 && medicineObj.value.id_dosage_frequency_3 && !prescriptionDetailForm.valuedosage_frequency_CB_UI) {
    prescriptionDetailForm.value.id_dosage_frequency =
      medicineObj.value.id_dosage_frequency_3
    if (dosageFrequencyList.value[2].quantity_dose) {
      quantity_dose.value = dosageFrequencyList.value[2].quantity_dose
      isQuantityAvailable.value = true
      return
    }
  }
  const tempDosage: any = doseStore.getAllDoses.find(
    (dose: any) => dose.value == value
  )
  if (
    tempDosage &&
    !(tempDosage.type_dose == '10' || tempDosage.type_dose == '99')
  ) {
    if (!tempDosage.quantity_dose) {
      mtUtils.autoCloseAlert('服用量/日の値の取得に失敗しました。')
    }
  }

  if (tempDosage) {
    typeDoseUI.value = tempDosage?.type_dose
    if (typeDoseUI.value == '1') {
      
    } else {
      prescriptionDetailForm.value.total_days_dose = 1
    }
    prescriptionDetailForm.value.date_end = calculateDate(
      prescriptionDetailForm.value.date_start,
      prescriptionDetailForm.value.total_days_dose,
      typeDoseUI.value
    )
    quantity_dose.value = tempDosage?.quantity_dose ?? 1
    isQuantityAvailable.value = true
    return
  }
}

function checkedDosageFreqCB_UI() {
  disable_dosage_frequency_UI.value = false
  if (prescriptionDetailForm.value.dosage_frequency_CB_UI) {
    disable_dosage_frequency_UI.value = true
    prescriptionDetailForm.value.id_dosage_frequency = null
    prescriptionDetailForm.value.dosage_frequency_UI = ''
  }
}

const calculatedTotalDosage = computed(() => {
  if (quantity_dose.value)
    return Math.ceil(
      roundZeroAfterPoint(prescriptionDetailForm.value.total_days_dose) *
      Number(quantity_dose.value ?? 1) ?? 1
    )
  return 1
})

const assortUnitUi = computed(() => {
  if (
    prescriptionDetailForm.value.prescription_detail_assort_list &&
    prescriptionDetailForm.value.prescription_detail_assort_list.length > 0
  ) {
    return `${
      useCommonStore().getCommonUnitOptionList.find(
        (commonObj: any) =>
          commonObj.id_common ==
          prescriptionDetailForm.value.prescription_detail_assort_list[0]
            .id_cm_unit_medicine
      )?.label
    }`
  }
  return ''
})

const getPrice = (id_item_service_unit) => {
  const currentDate = new Date()
  const price = itemServiceUnitList.value
    .find(v => v.id_item_service_unit === id_item_service_unit)
    ?.price_list
    ?.find(pObj => {
      const startDate = new Date(pObj.date_start)
      const endDate = new Date(pObj.date_end)
      return startDate <= currentDate && currentDate <= endDate
    })
    ?.price ?? 0
  return Number(price)
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

const getEmployeeLabel = (empId) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}
const getNewEmployeeLabel = (empId) => {
  return aahUtilsGetUpdatedEmployeeName(employeeStore.getEmployees, empId)
}
const showButton = computed(() => {
  const getCategory1 = categoryStore.getAllCategories.find(
    (v) => v.id_category == props.prescriptionDetail?.id_category1
  )
  const getCategory2 = categoryStore.getAllCategories.find(
    (v) => v.id_category == props.prescriptionDetail?.id_category2
  )
  let getCliCommon = cliCommonStore.getCliCommonPrintPdf.find((v) => {
    if (v.memo_etc2)
      return props.prescriptionDetail?.id_item_service_unit == v.memo_etc2
    if (v.memo_etc1)
      return props.prescriptionDetail?.id_item_service == v.memo_etc1
    if (v.text1) return getCategory2?.code_category == v.text1
    if (v.code_func1) return getCategory1?.code_category == v.code_func1
  })
  if (!getCliCommon)
    getCliCommon = cliCommonStore.getCliCommonModalButton.find((v) => {
      if (v.memo_etc2)
        return props.prescriptionDetail?.id_item_service_unit == v.memo_etc2
      if (v.memo_etc1)
        return props.prescriptionDetail?.id_item_service == v.memo_etc1
      if (v.text1) return getCategory2?.code_category == v.text1
      if (v.code_func1) return getCategory1?.code_category == v.code_func1
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

  // const getCategoryISPdfPrinitng = CATEGORY_ITEM_SERVICE_PDF_PRINTING.find(
  //   (v) => getServiceDetail.value.code_category2 === v.code_category2
  // )
  // if (getCategoryISPdfPrinitng) return getCategoryISPdfPrinitng

  return false
})

const deleteOldPdfObjects = () => {
  if (fabric) {
    fabric = null
  }
}

const getPdfMappingJson = async () => {
  const pdfMappingJson = { ...props.prescriptionDetail }
  const currentPet = customerStore.getCustomer.pets.find(
    (p) => p.id_pet == props.prescriptionObj.id_pet
  )
  const currentClinic = await clinicStore.fetchClinicById(
    props.prescriptionObj.id_clinic
  )
  let dosageFrequency = doseStore.all_doses.find(
    (d) => d.value == pdfMappingJson.id_dosage_frequency
  )
  for (let key in pdfMappingJson) {
    if (key == 'id_pet') {
      pdfMappingJson.id_pet = currentPet
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
    } else if (key == 'id_dosage_frequency') {
      pdfMappingJson.id_dosage_frequency = dosageFrequency
    } else if (key == 'booking') {
      if (
        Boolean(pdfMappingJson.booking) &&
        pdfMappingJson.booking.length > 0
      ) {
        pdfMappingJson.booking = pdfMappingJson.booking[0]
      }
    }
  }
  try {
    pdfMappingJson.id_item_service_unit =
      props.prescriptionDetail.item_service.item_service_unit_list[0]
  } catch (e) {
    pdfMappingJson.id_item_service_unit = {}
  }
  pdfMappingJson.id_request = requestStore.getRequest
  pdfMappingJson.id_customer = customerStore.getCustomer
  return pdfMappingJson
}

const clickButtonPDFPrinting = async () => {
  if (showButton.value.target_modal === 'update_print_canvas_modal') {
    deleteOldPdfObjects()
    await initScripts()
    await Promise.all([
      commonStore.fetchPreparationCommonList({ code_common: [28] }),
      printStore.selectPrint(showButton.value.id_print, true)
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
      } catch (e) {
      }

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
        rightBoxButtons: prescriptionDetailAttributes,
        showSendNotificationBtn: true
      })
    }
  }
}

const check_and_update_booking = async (updatedPrescDetail) => {
  if (Boolean(tBookingData.value.id_booking) && tBookingFlag.value == true) {
    // update case
    const datetimeBookingConfirmed =
      getDateByFormat(
        new Date(tBookingData.value.date_booking_confirmed),
        'YYYY/MM/DD'
      ) + ' ' + (tBookingData.value.time_booking_confirmed ?? '00:00') + ':00'
    
    tBookingData.value.datetime_booking_confirmed = datetimeBookingConfirmed

    if (tBookingFlgRepeat.value == false) {
      tBookingData.value.days_repeat = null
      tBookingData.value.flg_continue = false
      tBookingData.value.flg_exempt = false
      tBookingData.value.flg_end = false
    }
    const resp = await prescriptionStore.updatePrescriptionDetailBooking(
      updatedPrescDetail.id_request,
      updatedPrescDetail.id_prescription_detail,
      tBookingData.value.id_booking,
      tBookingData.value
    )
  } else if (
    !Boolean(tBookingData.value.id_booking) &&
    tBookingFlag.value == true
  ) {
    // create case
    const datetimeBookingConfirmed =
      getDateByFormat(
        new Date(tBookingData.value.date_booking_confirmed),
        'YYYY/MM/DD'
      ) +
      ' ' +
      (tBookingData.value.time_booking_confirmed ?? '00:00') +
      ':00'
    const bookingJson = {
      id_clinic: updatedPrescDetail.id_clinic,
      id_customer: customerStore.getCustomer.id_customer,
      id_pet: updatedPrescDetail.id_pet,
      id_request: updatedPrescDetail.id_request,
      id_prescription: updatedPrescDetail.id_prescription,
      id_prescription_detail: updatedPrescDetail.id_prescription_detail,
      days_repeat: tBookingData.value.days_repeat,
      flg_continue: tBookingData.value.flg_continue,
      flg_exempt: tBookingData.value.flg_exempt,
      flg_end: tBookingData.value.flg_end,
      type_booking_source: 2,
      datetime_booking_confirmed: datetimeBookingConfirmed
    }
    const resp = await prescriptionStore.createPrescriptionDetailBooking(
      updatedPrescDetail.id_request,
      updatedPrescDetail.id_prescription_detail,
      bookingJson
    )
  } else if (
    Boolean(tBookingData.value.id_booking) &&
    tBookingFlag.value == false
  ) {
    // delete case
    if (tBookingData.value.id_booking) {
      const resp = await prescriptionStore.destroyPrescriptionDetailBooking(
        updatedPrescDetail.id_request,
        updatedPrescDetail.id_prescription_detail,
        tBookingData.value.id_booking
      )
    }
  }
}

const submit = async () => {
  getFormData()

  const API_URL = `prescriptions/${prescriptionDetailForm.value.id_prescription}/prescription_details/${prescriptionDetailForm.value.id_prescription_detail}`

  if (old_id_prescription_detail) {
    ;`prescriptions/${prescriptionDetailForm.value.id_prescription}/prescription_details/${old_id_prescription_detail}`
  }

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    API_URL,
    {
      ...prescriptionDetailForm.value,
      id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value
    }
  )
  if (response) {
    await check_and_update_booking(response)
    await mtUtils.autoCloseAlert('明細を更新しました。')
    closeModal()
  }
  return null
}
const selectDefaultEmployee = () => {
  prescriptionDetailForm.value.id_employee_staff = defaultEmployee
}

const openAddTextTemplateModal = async (value: number) => {
  typeMemoSelected.value = value
  await templateStore.fetchTemplates({ type_text_template: value })

  memoTemplates.value = getTemplates.value.filter((template) => {
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
  if (type === 42) {
    prescriptionDetailForm.value.memo_dose = `${prescriptionDetailForm.value.memo_dose ? prescriptionDetailForm.value.memo_dose + ' ' : ''}${value}`
    return
  }
  if (type === 43) {
    prescriptionDetailForm.value.memo_alert = `${prescriptionDetailForm.value.memo_alert ? prescriptionDetailForm.value.memo_alert + ' ' : ''}${value}`
    return
  }
  if (type === 46) {
    const memo_clinic_prep = prescriptionDetailForm.value.memo_clinic_prep
    if (memo_clinic_prep) {
      prescriptionDetailForm.value.memo_clinic_prep = `${memo_clinic_prep} ${value}`
    } else {
      prescriptionDetailForm.value.memo_clinic_prep = value
    }
  }
}

const flgPlusItem = ref<boolean>(false)

const onUpdateStartDate = (value: string) => {
  prescriptionDetailForm.value.date_end = value
}

onMounted(async () => {
  petList.value = customerStore.getCustomer.pets

  id_pet.value = props.prescriptionObj.id_pet

  const [itemServiceResponse, _] = await Promise.all([
    mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/item_services/${props.prescriptionDetail?.id_item_service}`
    ),
    useCommonStore().fetchPreparationCommonList({ code_common: [1, 4, 5, 12] })
  ])
  // const itemServiceResponse : any = )

  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    }))

  pillDivisionList.value = useCommonStore()
    .getCommonPillDivisionOptionList.map((o: any) => ({
      value: o.id_common,
      name_common: o.name_common,
      flg_func1: o.flg_func1,
      display_order: o.display_order,
      code_func1: o.code_func1
    }))
    .sort((a: any, b: any) => a.display_order - b.display_order)

  useCommonStore().getCommonTypeMedicineFormatOptionList
    .filter((v) => ![8, 9, '8', '9'].includes(v.code_func1)).map((o: any) => {
    typeMedicineDefaultOptionList.push(o)
  })
  typeMedicineOptionList.value = [...typeMedicineDefaultOptionList]

  prescriptionDetailForm.value = {
    ...props.prescriptionDetail,
    id_clinic: JSON.parse(<string>localStorage.getItem('clinic'))?.id_clinic,
    fe_division: {
      fe_use: false,
      pill_division: []
    }
  }
  prescriptionDetailForm.value.old_id_prescription_detail =
    props.prescriptionDetail.id_prescription_detail
  prescriptionDetailForm.value.prescription_detail_assort_list =
    props.prescriptionDetail?.prescription_detail_assort_list
  if (
    props.prescriptionObj?.flg_delivered ||
    prescriptionDetailForm.value.flg_cancel
  ) {
    disableHeaderUpdate.value = true
  }
  setTypeMedicineFormat()
  isEdit.value = true

  if (itemServiceResponse) {
    flgPlusItem.value = itemServiceResponse.flg_plus_item || itemServiceResponse.flg_merge_price
    
    if (itemServiceResponse.medicine) {
      const tempMedicine = itemServiceResponse.medicine

      dosageFrequencyList.value = tempMedicine.dosage_frequency_list.map(
        (dosageFrequency: any) => ({
          quantity_dose: dosageFrequency.quantity_dose,
          label: `${dosageFrequency.name_dose_short} `,
          value: dosageFrequency.id_dosage_frequency
        })
      )
      const saveDosageFrequencyIndex = dosageFrequencyList.value.findIndex(
        (obj: any) => obj.value == props.prescriptionDetail?.id_dosage_frequency
      )
      quantity_dose.value = doseStore.getAllDoses.find(
        (dose: any) =>
          dose.value == props.prescriptionDetail?.id_dosage_frequency
      )?.quantity_dose

      if (saveDosageFrequencyIndex != -1) {
        prescriptionDetailForm.value.dosage_frequency_UI = `${
          saveDosageFrequencyIndex + 1
        }`
      } else {
        disable_dosage_frequency_UI.value = true
        prescriptionDetailForm.value.dosage_frequency_CB_UI = true
      }

      medicineObj.value = tempMedicine
      let tempDosageFrequencyDosage: any = doseStore.getAllDoses.find(
        (dFObj: any) =>
          dFObj.value == prescriptionDetailForm.value.id_dosage_frequency
      )
      if (tempDosageFrequencyDosage) {
        typeDoseUI.value = tempDosageFrequencyDosage.type_dose
      }
    }

    if (itemServiceResponse.item_service_unit_list) {
      itemServiceUnitList.value = itemServiceResponse.item_service_unit_list.filter((itemUnit) => new Date(itemUnit.date_end) > new Date())
    }
    
    if (itemServiceResponse.dosage_fixed_list) {
      // Replace null id_common values with a default key before grouping
      const defaultGroupKey = 'all' // Use a string to represent 'all' to avoid mixing types
      const preprocessedList = itemServiceResponse.dosage_fixed_list.map(
        (item) => ({
          ...item,
          id_common: item.id_common === null ? defaultGroupKey : item.id_common
        })
      )

      dosageFixedList.value = preprocessedList
      dosageFixedListByGroup.value = groupBy(dosageFixedList.value, 'id_common')

      let selectedGroupKey = props.prescriptionObj.id_pet || defaultGroupKey
      const gby = groupBy(dosageFixedList.value, 'id_common')

      if (!gby[selectedGroupKey]?.length) {
        selectedGroupKey = defaultGroupKey
      }

      dosageFixedListByGroup.value = selectedGroupKey
        ? { [selectedGroupKey]: gby[selectedGroupKey] }
        : {}
    }


    if (itemServiceResponse.dosage_variable_list) {
      dosageVariableRes.value = itemServiceResponse.dosage_variable_list
    }
    if (flgPlusItem) {
      prescriptionDetailForm.value?.prescription_detail_assort_list?.map((item: any) => {
        item.checked = true
      })

      prescriptionDetailForm.value.prescription_detail_assort_list = prescriptionDetailForm.value?.prescription_detail_assort_list?.filter((item: any) => {
        if (item.val_dosage_decided) return true
        return false
      })

    }


    prescriptionDetailJson = JSON.stringify(prescriptionDetailForm.value)
  }

  await selectedTypeMedicine(
    prescriptionDetailForm.value.type_medicine_dosage,
    true
  )

  setBookingIfUpdateCase()

  if (props.isLeft) {
    let prescriptionDetailAssortListUI = []

    const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchPrescriptionDetailAssortList', {
      id_prescription_detail: prescriptionDetailForm.value.id_prescription_detail
    })
    if (response) {
      prescriptionDetailAssortListUI = response
    }
    prescriptionDetailForm.value.prescription_detail_assort_list = prescriptionDetailAssortListUI
  }
  
  loading.value = true
  if (itemServiceUnitList.value.length === 0) {
    await mtUtils.alert('この商品には、品名包装単位（子商品）の登録がありません。', '注意')
  }
  
  if (!typeAnimalUI.value) {
    await mtUtils.alert('動物種を設定してください。', '確認')
  }

})

const setBookingIfUpdateCase = () => {
  const bookingDetails =
    prescriptionDetailForm.value.booking &&
    prescriptionDetailForm.value.booking.length > 0 ? prescriptionDetailForm.value.booking[0] : null
  
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

onUnmounted(() => {
  event_bus.off('isu_child')
  prescriptionStore.setAssortVolume(null)
})

defineExpose({
  getFormData
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader
      @closeModal="closeModal"
      class="light-prescription-blue"
      :close-bt="false"
    >
      <q-toolbar-title class="text-grey-900 title2 bold cursor-pointer">
        <span>処方箋明細：</span>
        {{ prescriptionDetail?.name_prescription_display }}
        <q-icon
          name="content_copy"
          class="text-blue"
          @click="copyText(prescriptionObj?.number_prescription)"
        />
      </q-toolbar-title>
      <MtPetFilterSelect
        :pet-list="petList"
        v-model:selecting="id_pet"
        class="col-auto"
        readonly
      />
      <div class="q-ml-sm col-1">
        <MtInputForm
          type="text"
          v-model="typeAnimalUI"
          label="動物種"
          readonly
        />
      </div>
      <MtInputForm
        type="text"
        v-model="valWeightUI"
        label="体重"
        readonly
        class="col-1 q-ml-md"
      />
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>

    <q-card-section class="q-pa-lg content">
      <template v-if="loading">
        <div
          class="cancel-notification-box q-mb-md"
          v-if="prescriptionObj?.flg_cancel"
        >
          <div class="text-body1">
            <span class="text-darkred"
            ><strong>この処方箋はキャンセルされました。</strong></span
            >
          </div>
          <div class="q-my-xs">
            キャンセル日時：{{
              formatDateWithTime(prescriptionObj?.datetime_cancel)
            }}
            <span v-if="prescriptionObj?.memo_cancel"
            >理由： {{ prescriptionObj?.memo_cancel }}
            </span>
          </div>
        </div>
        <div class="flex justify-between q-pa-md light-prescription-blue">
          <div>
            <div class="title2 text-grey-900 bold q-mb-xs">
              {{ prescriptionDetail.name_prescription_display }}
              <q-btn
                class="text-grey-700 quiz-btn"
                flat
                icon="quiz"
                round
                size="14px"
                @click="prescriptionUtils.openItemServiceModal(prescriptionDetail.id_item_service)"
              />
            </div>
            <div class="text-body2 text-grey-700 flex items-center">
              {{ prescriptionDetailForm.name_category1 }}
              <q-icon name="arrow_right" />
              {{ prescriptionDetailForm.name_category2 }}
            </div>
          </div>
          <div
            v-if="
              !(
                prescriptionObj?.flg_cancel || prescriptionDetailForm.flg_cancel
              )
            "
          >
            <q-btn
              outline
              class="q-mr-md"
              @click="fetchItemServiceUnits"
              v-if="!disableHeaderUpdate"
            >
              全表示
            </q-btn>
            <q-btn
              outline
              @click="fetchSuggestedAmount"
              v-if="!disableHeaderUpdate"
              v-show="prescriptionDetailForm.type_medicine_dosage != '4'"
            >
              自動
            </q-btn>
            <q-btn
              outline
              @click="toggleDivision = !toggleDivision"
              class="q-ml-md"
              v-if="prescriptionDetailForm.type_medicine_dosage == '2'"
            >
              <q-icon class="" size="2em" name="drag_indicator" />
              <q-badge v-if="feDivisionFlgCount > 0" color="red" floating>
                {{ feDivisionFlgCount }}
              </q-badge>
            </q-btn>
            <q-btn
              v-if="showButton"
              class="q-ml-md"
              color="primary"
              unelevated
              @click="clickButtonPDFPrinting"
            >
              {{ showButton.button_label }}
            </q-btn>
          </div>
        </div>
        <!--Important alert section starts-->
        <template v-if="!prescriptionDetailForm.flg_etc1 && !prescriptionDetailForm.flg_etc2">
          <div
            v-if="
              (prescriptionDetailForm?.prescription_detail_assort_list &&
                prescriptionDetailForm?.prescription_detail_assort_list.length ==
                  0) ||
              !(
                Number(prescriptionDetailForm.val_weight) ==
                  Number(prescriptionObj.val_weight / 1000) ||
                Number(prescriptionDetailForm.val_weight) ==
                  Number(prescriptionObj.val_weight * 1000)
              )
            "
            class="important-alert-prescription"
          >
            <div
              v-if="
                !(
                  Number(prescriptionDetailForm.val_weight) ==
                    Number(prescriptionObj.val_weight / 1000) ||
                  Number(prescriptionDetailForm.val_weight) ==
                    Number(prescriptionObj.val_weight * 1000)
                )
              "
            >
              <small
              ><!--body weight failed-->
                <q-icon class="q-mr-xs" name="notifications" />
                明細の更新に失敗しました。体重データを確認してください。
              </small>
            </div>
            <div>
              <!--missing assorts-->
              <small
                v-if="
                  prescriptionDetailForm?.prescription_detail_assort_list?.length ==
                  0
                "
              >
                <q-icon class="q-mr-xs" name="notifications" />
                明細登録が未完了です。
              </small>
            </div>
          </div>
          <!--Important alert section ends-->
          <!--Sub alert per prescription detail-->
          <div v-if="prescriptionDetailForm.flg_cancel">
            <span class="text-darkred q-mt-xs">
              <small
              >※ キャンセル済（日時：{{
                  dateFormat(
                    prescriptionDetailForm.datetime_cancel,
                    'YYYY/MM/DD hh:mm'
                  )
                }}）</small
              >
            </span>
          </div>
        </template>
        <template v-if="!prescriptionDetailForm.flg_etc1 && !prescriptionDetailForm.flg_etc2">
          <div v-if="prescriptionDetailForm.flg_risk_animal">
          <span class="text-darkred q-mt-xs">
            <small>※ 医薬品の想定対象外の動物種です。注意してください。</small>
          </span>
        </div>
        <div v-if="prescriptionDetailForm.flg_overdosing">
          <span class="text-darkred q-mt-xs">
            <small>※ 規定量以上の投与です。注意してください。</small>
          </span>
        </div>
        <div v-if="prescriptionDetailForm.flg_non_charge">
          <span class="text-darkred q-mt-xs"><small>※ 会計対象外</small></span>
        </div>
        </template>
        <!--Sub alert end-->
        <!-- Factors to calculate prescription detail & assort data -->
        <div
          v-if="!medicineObj.flg_drip_carrier && !prescriptionDetailForm.flg_etc1 && !prescriptionDetailForm.flg_etc2"
          class="q-mx-md">
          <div class="row q-col-gutter-md">
            <div class="col-auto">服用量計算 *</div>
            <div class="col-auto q-pt-sm">
              <MtFormRadiobtn
                v-if="prescriptionDetailForm.type_medicine_dosage == '1'"
                label="早見表"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                disable
                val="1"
                @update:selected="selectedTypeMedicine"
                class="q-pr-md"
              />
              <MtFormRadiobtn
                v-if="prescriptionDetailForm.type_medicine_dosage == '2'"
                label="可変量/kg"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                disable
                val="2"
                @update:selected="selectedTypeMedicine"
                class="q-pr-md"
              />
              <MtFormRadiobtn
                v-if="prescriptionDetailForm.type_medicine_dosage == '3'"
                label="可変量/head"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                disable
                val="3"
                @update:selected="selectedTypeMedicine"
                class="q-pr-md"
              />
              <MtFormRadiobtn
                v-if="prescriptionDetailForm.type_medicine_dosage == '4'"
                label="数量指定"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                disable
                val="4"
                @update:selected="selectedTypeMedicine"
              />
            </div>
          </div>
          <div v-if="prescriptionDetailForm.type_medicine_dosage == 1">
            <q-btn
              label="投薬早見表"
              color="primary"
              size="sm"
              @click="itemServiceUnitD = true"
            />
            <q-dialog v-model="itemServiceUnitD">
              <q-card style="width: 720px; max-width: 80vw">
                <div class="row q-col-gutter-xs">
                  <div class="col-12">
                    <!--              <p class="q-mb-md">早見表</p>-->
                    <table
                      class="table-custom-fixed q-pa-lg"
                      v-for="[index2, fixedDosage] in Object.entries(
                        dosageFixedListByGroup
                      )"
                      :key="index2"
                    >
                      <thead>
                      <tr>
                        <td class="q-ba q-pa-lg">
                          <div class="title2 text-grey-900 bold q-mb-xs">
                            {{ prescriptionDetail.name_prescription_display }}
                            {{
                              ` ( ${
                                commonTypeAnimalOptionList.find(
                                  (v) => v.value == index2
                                )?.label ?? '全種'
                              } )`
                            }}
                          </div>
                          <div
                            class="text-body2 text-grey-700 flex items-center"
                          >
                            {{ prescriptionDetailForm.name_category1 }}
                            <q-icon name="arrow_right" />
                            {{ prescriptionDetailForm.name_category2 }}
                          </div>
                        </td>
                        <template
                          v-if="
                              itemServiceUnitList &&
                              itemServiceUnitList.length > 0
                            "
                        >
                          <template
                            v-for="(item, index) in itemServiceUnitList"
                            :key="index"
                          >
                            <td class="q-ba q-pa-lg">
                              <span>{{ item.name_service_item_unit }}</span>
                            </td>
                          </template>
                        </template>
                      </tr>
                      </thead>
                      <tbody>
                      <template v-if="fixedDosage && fixedDosage.length > 0">
                        <tr
                          v-for="(fixedDosage, index2) in fixedDosage"
                          :key="index2"
                        >
                          <td class="q-pa-sm q-ba q-pa-lg">
                              <span>
                                {{ fixedDosage.val_weight_min }}
                                <span class="body2">g</span> ~
                                {{ fixedDosage.val_weight_max }}
                                <span class="body2">g</span>{{ '  未満 ' }}
                                <br />
                                <span class="flex justify-center">
                                  {{
                                    ` ( ${
                                      commonTypeAnimalOptionList.find(
                                        (v) => v.value == index2
                                      )?.label ?? '全種'
                                    } )`
                                  }}
                                </span>
                              </span>
                          </td>
                          <template
                            v-if="
                                itemServiceUnitList &&
                                itemServiceUnitList.length > 0
                              "
                          >
                            <template
                              v-for="(item2, index3) in itemServiceUnitList"
                              :key="index3"
                            >
                              <td
                                class="q-ba text-center fixed-detail-hover q-pa-lg"
                              >
                                <div
                                  v-if="
                                      fixedDosage.dosage_fixed_detail_list &&
                                      fixedDosage.dosage_fixed_detail_list
                                        .length > 0 &&
                                      fixedDosage.dosage_fixed_detail_list.find(
                                        (v) =>
                                          v.id_item_service_unit ==
                                            item2.id_item_service_unit &&
                                          v.id_dosage_fixed ==
                                            fixedDosage.id_dosage_fixed
                                      )
                                    "
                                  class="cursor-pointer"
                                >
                                  {{
                                    fixedDosage.dosage_fixed_detail_list.find(
                                      (v) =>
                                        v.id_item_service_unit ==
                                        item2.id_item_service_unit &&
                                        v.id_dosage_fixed ==
                                        fixedDosage.id_dosage_fixed
                                    )?.quantity
                                  }}
                                   <span class="body2">{{
                                    fixedDosage.dosage_fixed_detail_list.find(
                                      (v) =>
                                        v.id_item_service_unit ==
                                        item2.id_item_service_unit &&
                                        v.id_dosage_fixed ==
                                        fixedDosage.id_dosage_fixed
                                    )?.type_unit_label
                                  }}</span>
                                </div>
                                <div
                                  v-else
                                  class="cursor-pointer bg-grey-100 text-black full-width full-height"
                                ></div>
                              </td>
                            </template>
                          </template>
                        </tr>
                      </template>
                      </tbody>
                    </table>
                  </div>
                </div>
              </q-card>
            </q-dialog>
          </div>
          <div
            v-if="
              prescriptionDetailForm.type_medicine_dosage == 2 ||
              prescriptionDetailForm.type_medicine_dosage == 3
            "
          >
            <div class="row">
              <MtFormInputNumber
                label="処方成分量"
                mode="dosage"
                v-model:value="
                  prescriptionDetailForm.val_efficacy_strength_doctor
                "
                class="col-2 field-right-text doctor-amount-icon"
                @update:value="checkValEfficacy"
                :readonly="disableHeaderUpdate"
                @blur="()=>fetchSuggestedAmount()"
              />
              <div
                class="flex calculation-process bi-grid-3x2-gap"
                v-if="efficacyCalculation"
              >
                <q-icon name="info" class="q-pt-xs q-mr-sm" />
                {{ '服用1回あたりの有効成分量： ' + efficacyCalculation }}
              </div>
            </div>
            <div class="row q-my-sm">
              <div class="dosage-variable-range">
                規定成分量範囲： {{ dosageVariableRange }}
                <span class="q-mr-xs">{{ dosageVariableRangeUnit }}</span>
              </div>
            </div>
          </div>
          <div v-if="!flgPlusItem" class="row q-col-gutter-md q-my-md">
            <div class="col-auto">服用頻度 *</div>
            <div class="col-auto q-pt-sm">
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_1"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                :disable="disable_dosage_frequency_UI || disableHeaderUpdate"
                :label="dosageFrequencyList[0].label"
                class="q-pr-md"
                val="1"
                @update:selected="selectedIdDosageFrequency"
              />
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_2"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                :disable="disable_dosage_frequency_UI || disableHeaderUpdate"
                :label="dosageFrequencyList[1].label"
                class="q-pr-md"
                val="2"
                @update:selected="selectedIdDosageFrequency"
              />
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_3"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                :disable="disable_dosage_frequency_UI || disableHeaderUpdate"
                :label="dosageFrequencyList[2].label"
                class="q-pr-md"
                val="3"
                @update:selected="selectedIdDosageFrequency"
              />
              <MtFormCheckBox
                label="他"
                v-model:checked="prescriptionDetailForm.dosage_frequency_CB_UI"
                @update:checked="checkedDosageFreqCB_UI"
                class="q-pr-md"
                :disable="disableHeaderUpdate"
              />
            </div>
            <div
              class="col-4 q-pt-sm"
              v-if="prescriptionDetailForm.dosage_frequency_CB_UI"
            >
              <MtFormPullDown
                label="その他指定頻度"
                v-model:selected="prescriptionDetailForm.id_dosage_frequency"
                :options="filteredOptionList"
                @update:selected="selectedIdDosageFrequency"
                :disable="disableHeaderUpdate"
              />
            </div>
          </div>
          <div v-if="!flgPlusItem" class="row q-col-gutter-md q-mb-md">
            <div class="col">
              <MtFormInputNumber
                v-model:value="prescriptionDetailForm.total_days_dose"
                mode="dosage"
                :label="
                  prescriptionDetailForm.type_medicine_dosage == '4'
                    ? '服用回数'
                    : '服用日数 *'
                "
                class="field-right-text"
                :class="totalDoseUI"
                v-if="isQuantityAvailable"
                @update:value="
                  () => {
                    prescriptionDetailForm.date_end = calculateDate(
                      prescriptionDetailForm.date_start,
                      prescriptionDetailForm.total_days_dose,
                      typeDoseUI
                    )
                  }
                "
                required
                :rules="[aahValidations.validationRequired]"
                :readonly="disableHeaderUpdate"
              />
            </div>
            <div class="col">
              <MtFormInputDate
                v-model:date="prescriptionDetailForm.date_start"
                label="服用 開始日 *"
                @update:date="
                  (value) => {
                    prescriptionDetailForm.total_days_dose = calculateDay1(
                      prescriptionDetailForm.date_start,
                      prescriptionDetailForm.date_end,
                      typeDoseUI
                    )
                    onUpdateStartDate(value)
                  }
                "
                required
                :rules="[aahValidations.validationRequired]"
                :readonly="disableHeaderUpdate"
              />
            </div>
            <div
              class="col"
              v-if="
                !(
                  prescriptionDetailForm.type_medicine_dosage == '10' ||
                  typeDoseUI == '10'
                )
              "
            >
              <MtFormInputDate
                v-model:date="prescriptionDetailForm.date_end"
                label="服用 終了日"
                v-if="isQuantityAvailable"
                @update:date="
                  () => {
                    prescriptionDetailForm.total_days_dose = calculateDay1(
                      prescriptionDetailForm.date_start,
                      prescriptionDetailForm.date_end,
                      typeDoseUI
                    )
                  }
                "
                :readonly="disableHeaderUpdate"
              />
            </div>
            <div class="col-4">
              <MtFilterSelect
                label="処方時の薬剤形状 *"
                v-model:options="typeMedicineOptionList"
                v-model:selecting="prescriptionDetailForm.name_medicine_format"
                :options-default="typeMedicineDefaultOptionList"
                required
                :rules="[aahValidations.validationRequired]"
                :readonly="disableHeaderUpdate"
                @update:selecting="selectedTypeMedicineFormat"
              />
            </div>
            <div class="col">
              <InputEmployeeOptGroup
                v-model="prescriptionDetailForm.id_employee_staff"
                label="記録者名"
                type-occupation="staff"
                show-select-default-employee
                @update:select-default-employee="selectDefaultEmployee"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                type="text"
                label="服用メモ"
                autogrow
                :readonly="disableHeaderUpdate"
              >
                <template #append>
                  <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(42)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                type="text"
                label="注意事項"
                autogrow
                :readonly="disableHeaderUpdate"
              >
                <template #append>
                  <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(43)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
                type="text"
                label="調剤指示（院内メモ）"
                autogrow
                :readonly="disableHeaderUpdate"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(46)" />
                </template>
              </MtInputForm>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_non_charge"
                label="会計対象外"
                :disable="disableHeaderUpdate"
              />
            </div>
            <div class="col">
              <MtInputForm
                v-model="tBookingFlag"
                :items="[{ label: '次回予定の作成' }]"
                type="checkbox"
                @update:model-value="changeFlgSchedule"
              />
            </div>
            <div class="col">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_apply_insurance"
                label="保険適用"
                :disable="disableHeaderUpdate"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox 
                v-model:checked="prescriptionDetailForm.flg_hospitalization_usage"
                label="院内使用"
                :disable="disableHeaderUpdate"
              />
            </div>
          </div>

          <!-- T BOOKING -->
          <div class="" v-if="tBookingFlag">
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
        <!--点滴の場合-->
        <div v-if="medicineObj.flg_drip_carrier"
             class="q-mx-md drip-box q-pa-sm q-mb-md"
        >
          <div class="row items-center">
            <span class="text-white pill-title title4">点滴指示</span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4">
              <MtFilterSelect
                label="処方時の薬剤形状 *"
                v-model:options="typeMedicineOptionList"
                v-model:selecting="prescriptionDetailForm.name_medicine_format"
                :options-default="typeMedicineDefaultOptionList"
                required
                :rules="[aahValidations.validationRequired]"
                :readonly="disableHeaderUpdate"
                @update:selecting="selectedTypeMedicineFormat"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                label="処方時の薬剤形状 *"
                :options="useCommonStore().getCommonTypeMedicineRouteList"
                v-model:selected="
                  prescriptionDetailForm.process_drip.id_cm_med_route
                "
                :rules="[aahValidations.validationRequired]"
                required
                @update:selected="selectedTypeMedicineFormat"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit
                "
                val="1"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="prescriptionDetailForm.process_drip.time"
                type="number"
                label="投与時間"
                :disable="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit ==
                  '1'
                "
                @updatedValue="
                  () => {
                    prescriptionUtils.computeVolume(prescriptionDetailForm)
                    prescriptionUtils.computeFlowRate(prescriptionDetailForm)
                  }
                "
              />
            </div>
            <MtFormRadiobtn
              label="時間"
              v-model="prescriptionDetailForm.process_drip.time_unit"
              val="1"
              class="q-pr-md"
            />
            <MtFormRadiobtn
              label="分間"
              v-model="prescriptionDetailForm.process_drip.time_unit"
              val="2"
              class="q-pr-md"
            />
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit
                "
                class="q-pr-md"
                val="2"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="prescriptionDetailForm.process_drip.flow_rate"
                type="number"
                label="流量速度"
                @updatedValue="
                  () => {
                    prescriptionUtils.computeTime(prescriptionDetailForm)
                    prescriptionUtils.computeVolume(prescriptionDetailForm)
                  }
                "
                :disable="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit ==
                  '2'
                "
              />
            </div>
            <MtFormRadiobtn
              label="mL/時"
              v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
              val="1"
              class="q-pr-md"
            />
            <MtFormRadiobtn
              label="mL/分"
              v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
              val="2"
              class="q-pr-md"
            />
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit
                "
                class="q-pr-md"
                val="3"
              />
            </div>
            <div class="col-5">
              <MtFormInputNumber
                v-model:value="getPrescriptionAssortVolume"
                :disable="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit ==
                  '3'
                "
                class="field-right-text assort-drip-text-1"
                label="投与量"
                mode="dosage"
                @update:value="
                  (value) => {
                    usePrescriptionStore().setAssortVolume(value)
                    prescriptionUtils.computeTime(prescriptionDetailForm)
                    prescriptionUtils.computeFlowRate(prescriptionDetailForm)
                  }
                "
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                type="text"
                label="服用メモ"
                autogrow
              />
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                type="text"
                label="注意事項"
                autogrow
              />
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
                type="text"
                label="調剤指示（院内メモ）"
                autogrow
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md justify-between">
            <div class="col-6">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_non_charge"
                label="会計対象外"
              />
            </div>
            <div class="col-2 q-ml-md">
              <q-btn
                unelevated
                flat
                @click="removeItem(prescriptionDetailForm.id_item_service)"
              >
                <q-icon name="delete"></q-icon>
                削除
              </q-btn>
            </div>
          </div>
        </div>

        <!-- prescription assort data -->
        <template v-if="!flgPlusItem">
          <div
            v-if="
            prescriptionDetailForm.prescription_detail_assort_list &&
            prescriptionDetailForm.prescription_detail_assort_list.length > 0
          "
            class="assort-container full-width q-mt-md"
          >
            <div class="q-mb-sm">
              <h4 class="text-white bg-grey-600 title4">
                {{ medicineObj?.flg_drip_carrier ? '投与薬明細' : '処方箋明細' }}
              </h4>
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              以下の内容で処方します。
            </span>
            </div>
            <PrescriptionDetailAssortDripBox
              v-if="
              [3,'3'].includes(
                useCommonStore().getCommonTypeMedicineFormatOptionList.find(
                  (v) =>
                    v.name_common ==
                    prescriptionDetailForm?.name_medicine_format
                )?.code_func1
              )  &&
             itemServiceUnitList.find((v)=> Number(v.val_efficacyingredient)  > 0 )
            "
              :ref="
              setChildRef(
                prescriptionDetailForm.prescription_detail_assort_list.length -
                  1
              )
            "
              :calculatedTotalDosage="calculatedTotalDosage"
              :efficacyCalculation="calculatedEfficacy"
              :is-edit="true"
              :itemServiceUnitList="itemServiceUnitList"
              :prescription-assort="
              prescriptionDetailForm.prescription_detail_assort_list[
                prescriptionDetailForm.prescription_detail_assort_list.length -
                  1
              ]
            "
              class="assort-box"
              @removeIndex="
              () => {
                prescriptionDetailForm.prescription_detail_assort_list.splice(
                  prescriptionDetailForm.prescription_detail_assort_list
                    .length - 1,
                  1
                )
              }
            "
              @whole-pill="updateWholePill"
            />
            <PrescriptionDetailAssortBPowderBox
              v-else-if="[15,'15', 5, '5'].includes(
                useCommonStore().getCommonTypeMedicineFormatOptionList.find(
                  (v) =>
                    v.name_common ==
                    prescriptionDetailForm?.name_medicine_format
                )?.code_func1
              ) && ['2', '3'].includes(prescriptionDetailForm.type_medicine_dosage)   &&
             itemServiceUnitList.find((v)=> Number(v.val_efficacyingredient)  > 0 )
            "
              v-for="(
                prescriptionAssort, index
              ) in prescriptionDetailForm?.prescription_detail_assort_list"
              class="assort-box"
              :ref="setChildRef(index)"
              :calculatedTotalDosage="calculatedTotalDosage"
              :is-edit="true"
              :itemServiceUnitList="itemServiceUnitList"
              :pillDivision="pillDivisionList"
              :prescription-assort="prescriptionAssort"
              @removeIndex="
                () => {
                  prescriptionDetailForm.prescription_detail_assort_list.splice(
                    index,
                    1
                  )
                }
              "
            />
            <div
              v-for="(
              prescriptionAssort, index
            ) in prescriptionDetailForm?.prescription_detail_assort_list"
              v-else-if="![1, '1' ].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.name_common == prescriptionDetailForm.name_medicine_format)?.code_func1 ) || 
            ([ 3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.name_common == prescriptionDetailForm.name_medicine_format)?.code_func1) &&
             !itemServiceUnitList.find((v)=> Number(v.val_efficacyingredient)  > 0 ))"
              :key="prescriptionAssort.id_prescription_detail_assort"
              class="full-width"
            >
              <PrescriptionDetailAssortGenericListBox
                v-if="!prescriptionAssort.powderFormatUi"
                is-edit
                :ref="setChildRef(index)"
                :calculatedDosage="calculatedTotalDosage"
                :itemServiceUnitList="itemServiceUnitList"
                :pillDivision="pillDivisionList"
                :prescription-assort="prescriptionAssort"
                class="assort-box"
                @removeIndex="
                () => {
                  prescriptionDetailForm.prescription_detail_assort_list.splice(
                    index,
                    1
                  )
                }
              "
              />
            </div>
            <div
              v-for="(
              prescriptionAssort, index
            ) in prescriptionDetailForm?.prescription_detail_assort_list"
              v-else
              :key="prescriptionAssort.id_prescription_detail_assort"
              class="full-width"
            >
              <PrescriptionDetailAssortListBox
                :ref="setChildRef(index)"
                :is-edit="true"
                :itemServiceUnitList="itemServiceUnitList"
                :prescription-assort="prescriptionAssort"
                class="assort-box"
                @removeIndex="
                () => {
                  prescriptionDetailForm.prescription_detail_assort_list.splice(
                    index,
                    1
                  )
                }
              "
                :calculatedTotalDosage="calculatedTotalDosage"
              />
            </div>
            <div
              v-if="!medicineObj.flg_drip_carrier"
              class="dose-container row q-py-md"
            >
              <div class="col-6 items-center">
                <div class="flex items-center content-center">
                  <div class="text-grey-700 q-mr-md">総服用回数</div>
                  <div class="amount-dose">
                    {{ calculatedTotalDosage }}
                    回分
                    <small v-if="typeDoseUI != '10'" class="regular">
                      （
                      {{
                        ' ' +
                        roundZeroAfterPoint(
                          prescriptionDetailForm.total_days_dose
                        ) +
                        comTypeDose +
                        ' x 頻度 ' +
                        quantity_dose +
                        ' ' +
                        comTypeFreeUI
                      }}）
                    </small>
                  </div>
                </div>
              </div>
              <div class="col-2 second-col-dose flex content-center">
                <span class="q-mr-sm">服用形状</span>
                <span class="pill-title">{{
                    prescriptionDetailForm.name_medicine_format ?? ''
                  }}</span>
              </div>
            </div>
            <div
              v-if="val_total_efficacyingredient && !medicineObj.flg_drip_carrier && [1, 3 ,5 , 15 , '1' , '3', '5', '15' ].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.name_common == prescriptionDetailForm.name_medicine_format)?.code_func1 )"
              class="dosage-variable-range"
            >
              処方明細の総有効成分量：
              {{
                roundZeroAfterPoint(val_total_efficacyingredient.toFixed(2)) + assortUnitUi
              }}
              <span class="q-ml-sm">
              （
              {{ roundZeroAfterPoint(efficacyPetKg.toFixed(2)) + ` ${assortUnitUi} / Kg` }}
              ）</span
              >
            </div>
          </div>
        </template>
        <template v-else>
          <div class="row q-col-gutter-md q-my-md">
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                :readonly="disableHeaderUpdate"
                autogrow
                label="服用メモ"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(42)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                :readonly="disableHeaderUpdate"
                autogrow
                label="注意事項"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(43)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
                :readonly="disableHeaderUpdate"
                autogrow
                label="調剤指示（院内メモ）"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(46)" />
                </template>
              </MtInputForm>
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-md">
            <div class="col">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_non_charge"
                label="会計対象外"
                :disable="disableHeaderUpdate"
              />
            </div>
            <div class="col">
              <MtFormCheckBox 
                v-model:checked="prescriptionDetailForm.flg_hospitalization_usage"
                label="院内使用"
                :disable="disableHeaderUpdate"
              />
            </div>
            <div class="col">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_apply_insurance"
                label="保険適用"
                :disable="disableHeaderUpdate"
              />
            </div>
          </div>
          <div 
            v-for="item in prescriptionDetailForm.prescription_detail_assort_list" 
            :key="item.id_prescription_detail_assort"
            class="row q-col-gutter-md q-my-sm"
          >
            <div class="col-4">
              <MtFormCheckBox
                v-model:checked="item.checked"
                :label="itemServiceUnitList.find((v)=> v.id_item_service_unit == item.id_item_service_unit)?.name_service_item_unit"
                class="q-mr-md" />
            </div>
            <div class="col-4">
              <MtFormInputNumber 
                v-if="item.checked"
                v-model:value="item.val_dosage_decided"
                class="q-mr-md" 
                label="数量"
                :decimal-size="1"
                mode="dosage"
              />
            </div>
            <div class="col-4 flex items-end justify-end">
              <div v-if="item.checked" class="caption1 regular">
                合計金額：
                {{ Number(getPrice(item.id_item_service_unit) ?? 0) * (item.val_dosage_decided ?? 1)
                }}円
              </div>
            </div>
          </div>
        </template>
      </template>
    </q-card-section>

    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          type="submit"
          unelevated
          color="primary"
          class="q-ml-md"
          :disable="
            isSubmitAble ||
            prescriptionObj?.flg_cancel ||
            prescriptionDetailForm.flg_cancel ||
            disableHeaderUpdate
          "
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
    <q-dialog
      v-model="toggleDivision"
      style="
         {
          width: 310px !important;
        }
      "
      @update:model-value="
        (value) => {
          if (!value) {
            toggleDivision = false
            feDivision.fe_use = false
          }
        }
      "
    >
      <q-card class="mt-small-popup">
        <MtModalHeader class="bg-sky-blue">
          <div class="full-width">錠剤分割オプション</div>
        </MtModalHeader>
        <q-scroll-area class="division-model">
          <div class="q-col-gutter-md q-mb-xs q-pl-md q-pt-md">
            <div
              v-for="pill in pillDivisionList"
              :key="pill.id_common"
              class="col-auto"
            >
              <MtFormCheckBox
                v-model:checked="pill.flg_func1"
                :label="pill.name_common"
              />
            </div>
          </div>
        </q-scroll-area>
        <div class="flex justify-center q-py-md">
          <q-btn
            label="保存"
            size="sm"
            color="primary"
            @click="
              () => {
                feDivision.pill_division = pillDivisionList
                prescriptionDetailForm.fe_division = feDivision
                toggleDivision = false
                feDivision.fe_use = true
              }
            "
          ></q-btn>
        </div>
      </q-card>
    </q-dialog>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="効能効果テンプレート"
    :options="memoTemplates"
    :data="prescriptionDetailForm"
    :single-option="true"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>
<style scoped lang="scss">
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
  background-color: $light-prescription-blue !important;
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
</style>
