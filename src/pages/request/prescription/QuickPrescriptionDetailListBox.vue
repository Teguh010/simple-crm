<script lang="ts" setup>
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import useItemStore from '@/stores/items'
import selectOptions from '@/utils/selectOptions'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import usePrescriptionStore from '@/stores/prescription'
import useCustomerStore from '@/stores/customers'
import aahValidations from '@/utils/aahValidations'
import { groupBy, random } from 'lodash'
import PrescriptionDetailAssortListBox from '@/pages/request/prescription/PrescriptionDetailAssortListBox.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import {
  calculateDate,
  calculateDays,
  concatenate,
  getDateToday,
  isBitSet,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import useDoseStore from '@/stores/dose-frequencies'
import MtModalHeader from '@/components/MtModalHeader.vue'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import { event_bus } from '@/utils/eventBus'
import prescriptionUtils from '@/pages/request/prescription/prescriptionUtils'
import PrescriptionDetailAssortDripBox from '@/pages/request/prescription/PrescriptionDetailAssortPowderBox.vue'
import { timeHourMinute, typeBodyWeightUnit, typeDays } from '@/utils/enum'
import { TextTemplateType } from '@/types/types'
import useTextTemplateStore from '@/stores/text-template'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import PrescriptionDetailAssortGenericListBox
  from '@/pages/request/prescription/PrescriptionDetailAssortGenericListBox.vue'
import useCliCommonStore from '@/stores/cli-common'
import PrescriptionDetailAssortBPowderBox from '@/pages/request/prescription/PrescriptionDetailAssortBPowderBox.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'

const prescriptionStore = usePrescriptionStore()
const customerStore = useCustomerStore()
const itemStore = useItemStore()
const doseStore = useDoseStore()
const templateStore = useTextTemplateStore()

const { getTemplates } = storeToRefs(templateStore)
const { getPrescriptionAssortVolume } = storeToRefs(usePrescriptionStore())

const props = defineProps({
  item: <any>[],
  index: Object,
  bookingDetail: Object,
  petBodyWeight: {
    type: String,
    default: ''
  },
  callBack: Function,
  detailList: <any>Array
})


const emits = defineEmits(['removeItem', 'checkSuggestionResponse', 'checked', 'prescriptionDetailList', 'removeGroup'])

const getFormData = () => {

  // for plus item
  if (flgPlusItems.value) {
    prescriptionDetailForm.value['plus_item'] = true
    prescriptionDetailForm.value.prescription_detail_assort_list = selectedISU.value.filter((item) => item.checked)
    return prescriptionDetailForm.value
  }

  prescriptionDetailForm.value['plus_item'] = false
  prescriptionDetailForm.value.prescription_detail_assort_list = Object.values(childFormRefs.value)
    .map((childForm) => childForm.getFormData())
    .filter((formData) => formData !== null)

  if (prescriptionDetailForm.value.type_medicine_dosage == 2) {
    if (val_total_efficacyingredient.value > calculatedEfficacy.value) {
      prescriptionDetailForm.value.flg_overdosing = true
    }
  }

  return prescriptionDetailForm.value
}

const changeShowDetails = (value) => {
  prescriptionDetailForm.value.show = value
}

defineExpose({
  getFormData,
  changeShowDetails
})

const isQuantityAvailable = ref(true)
const dosageFrequencyList = ref<any>([])
const flgPlusItems = ref(false)
const isEffortAvailable = ref(null)

const typeDoseUI = ref(1)

const medicineObj = ref<any>({
  id_dosage_frequency_1: null,
  id_dosage_frequency_2: null,
  id_dosage_frequency_3: null
})
const itemServiceUnitList: any = ref([])
const dosageFixedList: any = ref([])
const dosageFixedListByGroup: any = ref({})
const dosageVariableRes: any = ref([])
const dosageVariableRange: any = ref(null)
const dosageVariableRangeUnit: any = ref()
const dosageVariableRangeValue: any = ref({
  min: 0,
  max: 0
})
const calculatedEfficacy = ref(null)
const itemServiceUnitD = ref(false)
const prescriptionDetailForm = ref({
  id_prescription: null,
  id_prescription_detail: null,
  id_item_service: null,
  type_medicine_dosage: '1',
  dosage_frequency_UI: '1',
  id_dosage_frequency: null,
  total_days_dose: null,
  memo_dose: null,
  memo_clinic_prep: null,
  date_start: null,
  date_end: null,
  type_medicine_format_ui: '1',
  memo_alert: null,
  flg_non_charge: false,
  flg_apply_insurance: false,
  id_category1: null,
  id_category2: null,
  efficacy_per_kg: '',
  prescription_detail_assort_list: <any>[],
  val_efficacy_strength_doctor: null,
  val_total_efficacyingredient: null,
  id_pet: null,
  dosage_frequency_CB_UI: false,
  flg_overdosing: false,
  name_medicine_format: null,
  id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
  fe_division: {
    pill_division: []
  },
  process_drip: {
    'id_prescription_detail': null,
    'id_prescription_detail_parent': null,
    'isPlusItem': false
  },
  show: true,
  type_detail: 1,
  id_employee_staff: null,
  group_id_ui: null
})

const commonTypeAnimalOptionList: any = ref([])

const pillDivisionList: any = ref([])

const feDivision = ref({
  fe_use: false,
  pill_division: []
})

const receivedISU = ref({
  selected: false
})

const toggleDivision = ref(false)
const quantity_dose = ref(0)
const childFormRefs = ref([])
const filteredDoseOptionList = ref([])

const disable_dosage_frequency_UI = ref(false)
const bookingDetail = ref({})

const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])

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
  if (typeDoseUI.value == '10' || typeDoseUI.value == '99') {
    return '回分'
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
const flgBodyWeight = computed(() => {
  if (!props.petBodyWeight) return false
  const [weight, unit] = props.petBodyWeight.split(' ')
  if (!weight || parseFloat(weight) == 0) return false
  return true
})
const getItem = (value: string) =>
  itemStore.getAllItems.find((v: any) => v.id_item_service == value)

const efficacyCalculation = computed(() => {
  const prescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()
  calculatedEfficacy.value = roundZeroAfterPoint(
    (prescriptionHeader?.val_weight / 1000) *
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
    roundZeroAfterPoint(prescriptionHeader?.val_weight / 1000),
    '(kg) x ',
    roundZeroAfterPoint(
      prescriptionDetailForm.value.val_efficacy_strength_doctor
    ),
    ' = ',
    calculatedEfficacy.value,
    'mg'
  )
})

const updateWholePill = (value) => {
  let calculatedRemainingPill = value.pill / calculatedTotalDosage.value


  let calculatedEfficacyIngredient = Number(calculatedRemainingPill) * Number(value.unit.val_efficacyingredient)


  prescriptionDetailForm.value.val_efficacy_strength_doctor = calculatedEfficacyIngredient / Number(prescriptionStore.getQuickPrescriptionHeader()?.val_weight / 1000)


  if (prescriptionDetailForm.value.type_medicine_dosage == 4) {
    const prescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()
    calculatedEfficacy.value = roundZeroAfterPoint(
      (prescriptionHeader?.val_weight / 1000) *
      prescriptionDetailForm.value?.val_efficacy_strength_doctor
    )
  }

  prescriptionDetailForm.value.flg_overdosing = false
  if (prescriptionDetailForm.value.val_efficacy_strength_doctor > dosageVariableRangeValue.value.max) {
    prescriptionDetailForm.value.flg_overdosing = true
  }
}

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

const calculatedTotalDosage = computed(() => {
  if (quantity_dose.value)
    return Math.ceil(
      roundZeroAfterPoint(prescriptionDetailForm.value.total_days_dose) *
      Number(quantity_dose.value ?? 1) ?? 1
    )
  return 1
})

const val_total_efficacyingredient = ref(assignComputedProperty())

const assortUnitUi = computed(() => {
  if (
    prescriptionDetailForm.value.prescription_detail_assort_list &&
    prescriptionDetailForm.value.prescription_detail_assort_list.length > 0
  ) {
    return `${
      useCommonStore().getCommonUnitOptionList.find(
        (commonObj: any) =>
          commonObj.value ==
          prescriptionDetailForm.value.prescription_detail_assort_list[0]
            .id_cm_unit_medicine
      )?.label
    }`
  }
  return ''
})

function assignComputedProperty() {
  return computed(() => {
    const formValues = Object.values(childFormRefs.value)
      .map((childForm) => childForm.getFormData())
      .filter((formData) => formData !== null)

    let ef = formValues.reduce((sum, formData) => {
      const efficacy = formData.val_efficacyingredient || 0
      const dosage =
        formData.val_dosage_decided || formData.val_dosage_suggested || 0

      if (
        [2, '2'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v) => v.value == prescriptionDetailForm.value?.type_medicine_format_ui)?.code_func1)
      ) {
        return sum + efficacy
      }
      if (
        [3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
          .find((v) => v.value == prescriptionDetailForm.value.type_medicine_format_ui)?.code_func1)
      ) {
        return (sum + efficacy)
      }
      return (sum + efficacy) * dosage
    }, 0)
    return ef
  })
}

const efficacyPetKg = computed(() => {

  return (
    val_total_efficacyingredient.value /
    (prescriptionStore.getQuickPrescriptionHeader()?.val_weight / 1000)
  )
})

const checkPerHeadAvailable = computed(() => {
  const perHead = dosageVariableRes.value.find(
    (dosVa: any) =>
      dosVa.type_body_weight_unit == 3 &&
      (!dosVa.id_common || dosVa.id_common == customerStore.getPet?.id_common)
  )
  if (perHead) {
    return true
  }
  return false
})

const calculateBookingDate = async () => {
  if (prescriptionDetailForm?.value.prescription_detail_assort_list && prescriptionDetailForm?.value.prescription_detail_assort_list.length < 1)
    return
  const unit_selected = prescriptionDetailForm?.value.prescription_detail_assort_list[0].id_item_service_unit

  let interval = itemServiceUnitList.value.find((item: any) => item.id_item_service_unit == unit_selected)?.interval


  if (interval) {
    const confirm = await mtUtils.confirm(
      'この商品には次回予定日の設定があります。\nこのオーダーに次回予定日を設定しますか？',
      '次回来院の適用', '適用'
    )
    if (!confirm) {
      bookingDetail.value.tBookingFlag = false
      return
    }
    if (confirm)
      bookingDetail.value.tBookingFlag = true
  }

  if (bookingDetail.value.tBookingFlag == true && interval) {
    interval = (interval.length > 0) ? interval.split(' ') : null
    let cycle, unit
    if (interval && interval.length == 2) {
      cycle = interval[0]
      unit = interval[1]

      if (unit == '日') {
        bookingDetail.value.date_booking_confirmed = calculateDate(prescriptionDetailForm.value.date_start, cycle, '1')
      }
      if (unit == '週') {
        bookingDetail.value.date_booking_confirmed = calculateDate(prescriptionDetailForm.value.date_start, cycle, '2')
      }
      if (unit == '月') {
        bookingDetail.value.date_booking_confirmed = calculateDate(prescriptionDetailForm.value.date_start, cycle, '3')
      }
      if (unit == '年') {
        bookingDetail.value.date_booking_confirmed = calculateDate(prescriptionDetailForm.value.date_start, cycle, '4')
      }
    }
  }
  bookingDetail.value.id_request = prescriptionDetailForm.value.id_request
  bookingDetail.value.id_customer = prescriptionStore.getQuickPrescriptionHeader().id_customer
  bookingDetail.value.id_pet = prescriptionDetailForm.value.id_pet
}

const onDateChanged = () => {
  prescriptionDetailForm.value.total_days_dose = calculateDays(
    prescriptionDetailForm.value.date_start,
    prescriptionDetailForm.value.date_end,
    typeDoseUI.value
  )
}


function selectedTypeMedicineFormat1(value) {
  if (!value) {
    prescriptionDetailForm.value.name_medicine_format = ''
    return
  }
  prescriptionDetailForm.value.name_medicine_format =
    useCommonStore().getCommonTypeMedicineFormatOptionList.find(
      (v: any) => v.id_common == value
    )?.name_common

  let val_liquid = false
  if (prescriptionDetailForm.value.name_medicine_format == '粉A') {
    itemServiceResponse.item_service_unit_list.forEach((isu: any) => {
      if (isu.val_liquid) {
        val_liquid = true
      }
    })
  }
}

async function selectedTypeMedicineFormat(value) {
  if (!value) {
    prescriptionDetailForm.value.name_medicine_format = ''
    return
  }
  prescriptionDetailForm.value.name_medicine_format =
    useCommonStore().getCommonTypeMedicineFormatOptionList.find(
      (v: any) => v.id_common == value
    )?.name_common


  if (prescriptionDetailForm.value.name_medicine_format == '粉A' ||
    prescriptionDetailForm.value.name_medicine_format == '粉B') {

    medicineObj.value.flg_dosage_fixed = false
    prescriptionDetailForm.value.val_weight = prescriptionStore.getQuickPrescriptionHeader().val_weight

    childFormRefs.value = []

    let val_liquid = false
    if (prescriptionDetailForm.value.name_medicine_format == '粉A') {
      itemServiceResponse.item_service_unit_list.forEach((isu: any) => {
        if (isu.val_liquid) {
          val_liquid = true
        }
      })
    }

    if (medicineObj.value.flg_dosage_variable) {
      if (!val_liquid && prescriptionDetailForm.value.name_medicine_format == '粉A') {

        await mtUtils.alert('医薬品重量の設定がないため、力価計算ができません。\n数量指定で登録してください。', '注意')
        prescriptionDetailForm.value.type_medicine_format_ui = useCommonStore().getCommonTypeMedicineFormatOptionList.find((v: any) => v.name_common == '粉B')?.id_common
        prescriptionDetailForm.value.type_medicine_dosage = '4'
        prescriptionDetailForm.value.name_medicine_format = '粉B'
        await selectedTypeMedicine(4)
        await fetchItemServiceUnits()
        return
      }
      await selectedTypeMedicine(2)
    } else if (medicineObj.value.flg_dosage_per_head) {
      prescriptionDetailForm.value.type_medicine_dosage = '3'
      await selectedTypeMedicine(3)
    } else if (medicineObj.value.flg_dosage_quantity) {
      prescriptionDetailForm.value.type_medicine_dosage = '4'
      await selectedTypeMedicine(4)

    }

    await fetchItemServiceUnits()
    return
  }

  if ([3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v: any) => v.id_common == value)?.code_func1)) {

    if (medicineObj.value.flg_dosage_variable) {
      prescriptionDetailForm.value.type_medicine_dosage = '2'
      await selectedTypeMedicine(2)
      return
    }

    if (medicineObj.value.flg_dosage_per_head) {
      prescriptionDetailForm.value.type_medicine_dosage = '3'
      await selectedTypeMedicine(3)
      return
    }

    if (medicineObj.value.flg_dosage_quantity) {
      prescriptionDetailForm.value.type_medicine_dosage = '4'
      await selectedTypeMedicine(4)
      return
    }

  }

}

async function selectedTypeMedicine(value: any) {
  if (value == 2) {
    applyDefaultSetting(true)
  }

  prescriptionDetailForm.value.prescription_detail_assort_list = []
  dosageVariableRange.value = null
  prescriptionDetailForm.value.flg_overdosing = false
  filteredDoseOptionList.value = doseStore.getAllDoses
  typeDoseUI.value = null

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
        prescriptionDetailForm.value.val_efficacy_strength_doctor =
          dosageVariable.default_val_dosage || dosageVariable.val_dose_min
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
        prescriptionDetailForm.value.val_efficacy_strength_doctor =
          dosageVariable.val_dose_min
        dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
      }

      if (!dosageVariable) {
        await mtUtils.autoCloseAlert(
          '有効成分の範囲が対象動物で見つかりませんでした。\n医薬品データを見直してください。'
        )
      }
    }
  }
  if (value == 4) {
    if (medicineObj.value && medicineObj.value.id_dosage_frequency_1) {
      prescriptionDetailForm.value.dosage_frequency_UI = '1'
      selectedIdDosageFrequency('1')
      await fetchItemServiceUnits(4)
      return
    }

    prescriptionDetailForm.value.dosage_frequency_CB_UI = true
    let tempDosageFrequencyDosage: any = doseStore.getAllDoses[0]

    if (tempDosageFrequencyDosage) {
      prescriptionDetailForm.value.id_dosage_frequency =
        tempDosageFrequencyDosage.value
      typeDoseUI.value = tempDosageFrequencyDosage
      prescriptionDetailForm.value.total_days_dose = tempDosageFrequencyDosage.type_dose
      isQuantityAvailable.value = true
    }

    prescriptionDetailForm.value.dosage_frequency_UI = ''
    quantity_dose.value = 1

    prescriptionDetailForm.value.date_end = calculateDate(
      prescriptionDetailForm.value.date_start,
      prescriptionDetailForm.value.total_days_dose,
      typeDoseUI.value
    )
    await fetchItemServiceUnits(4)
  }
}

function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      prescriptionDetailForm.value[key] = data[key]
    }
  }
}

function removeItem() {
  emits('removeItem', prescriptionDetailForm.value.process_drip.id_prescription_detail)
}

const setChildRef = (index) => (el) => {
  if (el) {
    childFormRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    childFormRefs.value.splice(index, 1)
  }
}

function applyDefaultSetting(value: any) {
  if (!value) {
    toggleDivision.value = false
  }

  feDivision.value.fe_use = true
  feDivision.value.pill_division = pillDivisionList.value
  prescriptionDetailForm.value.fe_division = feDivision
}

function selectedIdDosageFrequency(value: any) {
  isQuantityAvailable.value = false

  if (value == 1 && medicineObj.value.id_dosage_frequency_1 && !prescriptionDetailForm.value.dosage_frequency_CB_UI) {
    prescriptionDetailForm.value.id_dosage_frequency =
      medicineObj.value.id_dosage_frequency_1

    if (dosageFrequencyList.value.find((df: any) => df.value == prescriptionDetailForm.value.id_dosage_frequency)?.quantity_dose) {
      isQuantityAvailable.value = true
      quantity_dose.value = dosageFrequencyList.value.find((df: any) => df.value == prescriptionDetailForm.value.id_dosage_frequency).quantity_dose
    }
    value = medicineObj.value.id_dosage_frequency_1
    calculateDosageFrequency(value)
    return
  }

  if (value == 2 && medicineObj.value.id_dosage_frequency_2 && !prescriptionDetailForm.value.dosage_frequency_CB_UI) {
    prescriptionDetailForm.value.id_dosage_frequency =
      medicineObj.value.id_dosage_frequency_2
    if (dosageFrequencyList.value.find((df: any) => df.value == prescriptionDetailForm.value.id_dosage_frequency)?.quantity_dose) {
      isQuantityAvailable.value = true
      quantity_dose.value = dosageFrequencyList.value.find((df: any) => df.value == prescriptionDetailForm.value.id_dosage_frequency).quantity_dose
    }
    value = medicineObj.value.id_dosage_frequency_2
    calculateDosageFrequency(value)
    return
  }

  if (value == 3 && medicineObj.value.id_dosage_frequency_3 && !prescriptionDetailForm.value.dosage_frequency_CB_UI) {
    prescriptionDetailForm.value.id_dosage_frequency =
      medicineObj.value.id_dosage_frequency_3
    if (dosageFrequencyList.value.find((df: any) => df.value == prescriptionDetailForm.value.id_dosage_frequency)?.quantity_dose) {
      isQuantityAvailable.value = true
      quantity_dose.value = dosageFrequencyList.value.find((df: any) => df.value == prescriptionDetailForm.value.id_dosage_frequency).quantity_dose
    }
    value = medicineObj.value.id_dosage_frequency_3
    calculateDosageFrequency(value)
    return
  }

  calculateDosageFrequency(value)
}

function calculateDosageFrequency(value) {

  const tempDosage: any = doseStore.getAllDoses.find((dose: any) => dose.value == value)

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
      if (props.item.selectedTab != 1) {
        prescriptionDetailForm.value.total_days_dose = 1
      }
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
    prescriptionDetailForm.value.id_dosage_frequency = filteredDoseOptionList.value[0].value
    selectedIdDosageFrequency(prescriptionDetailForm.value.id_dosage_frequency)
  }
}

async function fetchItemServiceUnits(typeMedicineDosage: any = null) {
  const response = itemServiceUnitList.value.filter((itemUnit: any) => new Date(itemUnit.date_end) > new Date())

  if (response.length === 0 && prescriptionDetailForm.value.type_detail == 1 && medicineObj.value?.id_medicine) {
    await mtUtils.alert('この商品には、品名包装単位（子商品）の登録がありません。', '注意')
    return
  }

  if (
    response &&
    response.length &&
    response.length > 0 &&
    !medicineObj.value.flg_drip_carrier
  ) {
    prescriptionDetailForm.value.prescription_detail_assort_list.length = 0
    const sortByDisplayOrder = response.sort((a, b) => a.display_order - b.display_order)

    sortByDisplayOrder.forEach((itemUnit: any, index) => {
      let tempObj = {
        id_prescription_detail_assort: random(10000, 100000),
        id_prescription: prescriptionDetailForm.value.id_prescription,
        id_prescription_detail:
        prescriptionDetailForm.value.id_prescription_detail,
        id_item_service_unit: itemUnit.id_item_service_unit,
        type_medicine_dosage: itemUnit.type_medicine_dosage,
        id_cm_unit_medicine: itemUnit.id_cm_unit_medicine,
        type_dosage_calculation: medicineObj.value.type_dosage_calculation,
        val_efficacyingredient: itemUnit.val_efficacyingredient,
        powderFormatUi: false
      }
      if (index == 0 && typeMedicineDosage == 4) {
        tempObj['val_dosage_suggested'] = '1'
      }
      prescriptionDetailForm.value.prescription_detail_assort_list.push(tempObj)
    })

    prescriptionDetailForm.value.prescription_detail_assort_list.push({
      id_prescription_detail_assort: random(10000, 100000),
      id_prescription: prescriptionDetailForm.value.id_prescription,
      id_prescription_detail:
      prescriptionDetailForm.value.id_prescription_detail,
      type_dosage_calculation: medicineObj.value.type_dosage_calculation,
      powderFormatUi: true
    })
  }
  let isExist = false
  isExist = await prescriptionUtils.processDripAssort(
    prescriptionDetailForm,
    response,
    medicineObj,
    receivedISU
  )
  if (isExist) {
    removeItem()
  }
}

async function fetchSuggestedAmount() {
  if (
    !(await aahValidations.prescriptionDetailValidation(
      prescriptionDetailForm.value
    ))
  ) {
    return
  }

  let prescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()

  prescriptionStore.resetSuggestCounter()
  prescriptionStore.setSuggestAPIReqCounter()

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'prescriptions/suggested_amounts',
    {
      prescription: prescriptionHeader,
      is_prescription_header: true,
      prescription_detail_list: [
        {
          ...prescriptionDetailForm.value,
          id_clinic: localStorage.getItem('id_clinic')
        }
      ]
    }
  )

  if (
    response &&
    response.prescription_detail_list &&
    response.prescription_detail_list.length > 0
  ) {
    prescriptionDetailForm.value.val_total_efficacyingredient = null
    prescriptionDetailForm.value.prescription_detail_assort_list = []
    const prescriptionDetailObj: any = response.prescription_detail_list[0]
    assignPageData(prescriptionDetailObj)
    prescriptionDetailForm.value.id_clinic = localStorage.getItem('id_clinic')
    prescriptionDetailForm.value.type_medicine_dosage = `${prescriptionDetailObj.type_medicine_dosage}`
    const pdList = response.prescription_detail_list[0]

    if (
      pdList.prescription_detail_assort_list &&
      pdList.prescription_detail_assort_list.length > 0
    ) {
      if (props.item.selectedTab != 3)
        await mtUtils.autoCloseAlert('服用量を計算しました。')
      prescriptionDetailForm.value.prescription_detail_assort_list =
        pdList.prescription_detail_assort_list
    } else {
      await mtUtils.alert(
        `対象： ${props.item.name_item_service} \n` +
        '体重及び指定条件を満たす処方がありませんでした。' +
        '\n条件変更をするか、数量指定で処方箋の登録を行ってください。',
        ' 条件変更が必要です'
      )
    }
  }

  if (
    response &&
    response.error &&
    response.error.length &&
    response.error.length > 0 &&
    props.item.selectedTab != 3
  ) {

    if (props.item.selectedTab == 2 || prescriptionDetailForm.value.type_medicine_dosage == '2') {
      // TODO This condition is redundant !
      prescriptionDetailForm.value.type_medicine_dosage = '4'

      if (response.error.some((error: any) => error.includes('1061'))) {
        await mtUtils.alert('医薬品マスタに可変量の指定がない為、このオプションは利用できません。', '注意')
      }

      await selectedTypeMedicine(4)
      return
    }

    await mtUtils.autoCloseAlert('Error : ' + response.error[0])
  }


  if (
    response &&
    response.error &&
    response.error.length &&
    response.error.length > 0 &&
    props.item.selectedTab == 3
  ) {
    prescriptionStore.setTotalSuggestApiError()
  }
  if (response) {
    prescriptionStore.setSuggestAPIResCounter()
    emits('checkSuggestionResponse')
  }
}

const calculateDateStartPrescription = (date_start, date_end) => {
  if (getDateToday() >= date_start && getDateToday() <= date_end) return getDateToday()
  if (getDateToday() < date_start) return date_start
  if (getDateToday() > date_end) return date_end
  return date_start
}

async function setPrescriptionHeader() {
  const idPet: any = customerStore.getPet.id_pet
  const prescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()
  if (!prescriptionStore.getQuickPrescriptionHeader()) {
    await mtUtils.alert('対象ペットにはまだ処方箋が作成されていません。')
    return
  }

  prescriptionDetailForm.value = {
    ...props.item,
    total_days_dose: prescriptionHeader?.total_days_dose,
    date_start: calculateDateStartPrescription(prescriptionHeader.date_start, prescriptionHeader.date_end),
    date_end: prescriptionHeader.date_end,
    id_prescription: prescriptionHeader.id_prescription,
    id_employee_doctor: prescriptionHeader.id_employee_doctor,
    id_pet: prescriptionHeader.id_pet,
    id_pet_bio_info: prescriptionHeader.id_pet_bio_info,
    type_medicine_format: null,
    val_weight: prescriptionHeader.val_weight,
    id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
    process_drip: {
      ...props.item.process_drip
    }
  }

  prescriptionStore.pushIntoPrescriptionDetailList(prescriptionDetailForm.value)
  prescriptionDetailForm.value.prescription_detail_assort_list = []
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
    if (prescriptionDetailForm.value.memo_dose) {
      prescriptionDetailForm.value.memo_dose = `${prescriptionDetailForm.value.memo_dose} ${value}`
    } else {
      prescriptionDetailForm.value.memo_dose = value
    }
    return
  }
  if (type === 44 || type === 43) {
    if (prescriptionDetailForm.value.memo_alert) {
      prescriptionDetailForm.value.memo_alert = `${prescriptionDetailForm.value.memo_alert} ${value}`
    } else {
      prescriptionDetailForm.value.memo_alert = value
    }
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

event_bus.on('isu_child', (isu_child) => {
  receivedISU.value = { ...isu_child }
})


const mapFlgInsurance = async (ISU: any = null, IS: any = null) => {
  let apply_insurance = true
  let today = new Date()
  if (apply_insurance) {
    let today = new Date()
    const pet = useCustomerStore().getCustomer.pets.find((v) => v.id_pet == prescriptionDetailForm.value.id_pet)
    if (pet && pet.pet_insurance && pet.pet_insurance.length && pet.pet_insurance.length > 0) {
      let pet_insurance = pet.pet_insurance.find((v) => new Date(v.date_insurance_end) > today)

      if (!pet_insurance) {
        return false
      }

      if (pet_insurance) {
        let itemService = null

        if (ISU) {
          itemService = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/item_services/${ISU.id_item_service}`)
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

const ISU: any = ref({})
let selectedISU = ref([])

function CalculateValueDecidedForISU(parent: any) {
  selectedISU.value.map((assort: any) => {
    if (!assort.checked) return

    const cliCommon = useCliCommonStore().getCliCommonAutoPriceCalculation.filter((cliCommon) => new Date(cliCommon.date_end) > new Date())
      .find((cliCommon) => cliCommon.code_func2 == assort.id_item_service_unit)

    // This will link merge item with parent
    if (prescriptionDetailForm.value.type_detail == 3) {
      prescriptionDetailForm.value.process_drip.id_prescription_detail_ref = parent.process_drip.id_prescription_detail
    }

    if (cliCommon) {
      assort.val_dosage_decided = 1

      if (cliCommon.text1 == 2 || cliCommon.text1 == 3) {
        prescriptionDetailForm.value.date_start = parent.date_start
        prescriptionDetailForm.value.date_end = parent.date_end
      }

      if (cliCommon.text1 == 2) {
        assort.val_dosage_decided = Number(parent.total_days_dose)
      }

      if (cliCommon.text1 == 3) {
        const dosage = doseStore.getAllDoses.find((dose: any) => dose.value == parent.id_dosage_frequency)
        if (dosage.quantity_dose) {
          assort.val_dosage_decided = Math.ceil((Number(parent.total_days_dose) * Number(dosage?.quantity_dose ?? 1)))
        } else {
          assort.val_dosage_decided = Number(parent.total_days_dose) * Number(dosage?.quantity_dose ?? 1)
        }
      }
    }
    return assort
  })
}

function setValDosageQuantity(nowValue) {
  const parent = nowValue.find((item) => item?.process_drip && item?.process_drip?.id_prescription_detail == prescriptionDetailForm.value?.process_drip?.id_prescription_detail_ref)
  if (parent) {
    CalculateValueDecidedForISU(parent)
    return
  }

  const plusIdx = nowValue.findIndex((item: any) => item.process_drip &&
    item.process_drip?.id_prescription_detail == prescriptionDetailForm.value?.process_drip?.id_prescription_detail)


  if (plusIdx > -1) {
    const parentList = [...nowValue].splice(0, plusIdx).filter((item) => item.type_detail == 1)
    if (parentList.length > 0) {
      const plusParent = parentList[parentList.length - 1]
      if (plusParent) CalculateValueDecidedForISU(plusParent)
      return
    }
  }
}

watch(() => prescriptionStore.prescriptionDetailListByUI, (nowValue, oldValue) => {
    if (nowValue) {
      if (![2, 3].includes(prescriptionDetailForm.value.type_detail)) {
        return
      }
      setValDosageQuantity(nowValue)
    }
  },
  { deep: true })

watch(() => prescriptionStore.quickPrescriptionHeader,
  (nowValue, oldValue) => {
    if (nowValue) {

      if (prescriptionStore.quickPrescriptionHeader.date_start && prescriptionStore.quickPrescriptionHeader.date_end) {
        prescriptionDetailForm.value.date_start = prescriptionStore.quickPrescriptionHeader.date_start
        prescriptionDetailForm.value.date_end = prescriptionStore.quickPrescriptionHeader.date_end
        onDateChanged()
      }
      prescriptionDetailForm.value.flg_non_charge = prescriptionStore.quickPrescriptionHeader.flg_non_charge
      prescriptionDetailForm.value.flg_apply_insurance = prescriptionStore.quickPrescriptionHeader.flg_apply_insurance
      prescriptionDetailForm.value.id_customer = prescriptionStore.quickPrescriptionHeader.id_customer
      prescriptionDetailForm.value.id_pet = prescriptionStore.quickPrescriptionHeader.id_pet
    }
  }, {
    deep: true,
    immediate: true
  })

// # flg_group_title
const typeMedicineOptionList: any = ref([])
const typeMedicineDefaultOptionList: any = reactive([])
let itemServiceResponse: any = reactive({})

onMounted(async () => {

  if (props.item && props.item.flg_group_title) {
    const idPet: any = customerStore.getPet.id_pet
    const prescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()
    if (!prescriptionStore.getQuickPrescriptionHeader()) {
      await mtUtils.alert('対象ペットにはまだ処方箋が作成されていません。')
      return
    }

    prescriptionDetailForm.value = { ...props.item }
    prescriptionDetailForm.value.date_start = calculateDateStartPrescription(prescriptionHeader.date_start, prescriptionHeader.date_end)
    filteredDoseOptionList.value = doseStore.getAllDoses
    useCommonStore().getCommonTypeMedicineFormatOptionList.filter((v) => ![8, 9, '8', '9'].includes(v.code_func1)).map(v => {
      typeMedicineDefaultOptionList.push(v)
    })
    typeMedicineOptionList.value = [...typeMedicineDefaultOptionList]
    return
  }

  itemServiceResponse = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `/mst/item_services/${props.item.id_item_service}`
  )

  flgPlusItems.value = itemServiceResponse.flg_plus_item
  ISU.value = itemServiceResponse.item_service_unit_list

  const optionPlusItem = itemServiceResponse.option_list.find((option) => option.id_item_service_child?.flg_merge_price)
  if (optionPlusItem && props.item.selectedTab != 1) {
    isEffortAvailable.value = {
      ...optionPlusItem,
      id_prescription_detail_ref: props.item?.process_drip?.id_prescription_detail
    }
    props.callBack(isEffortAvailable.value)
  }

  itemServiceResponse.item_service_unit_list.map((items, idx) => {
    const today = new Date()
    const price = items.price_list.find((p) =>
      new Date(p.date_start) <= today && today <= new Date(p.date_end))

    selectedISU.value.push({
      checked: idx == 0,
      id_item_service_unit: items.id_item_service_unit,
      label: items.name_service_item_unit,
      value: items.id_item_service_unit,
      unitPrice: Number(price?.price),
      val_dosage_decided: idx == 0 ? 1 : null,
      id_cm_unit_medicine: items.id_cm_unit_medicine,
      val_efficacyingredient: 1
    })
  })


  await useCommonStore().fetchPreparationCommonList({
    code_common: [1, 4, 5, 12]
  })

  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    }))

  pillDivisionList.value = useCommonStore()
    .getCommonPillDivisionOptionList.map((o: any) => {
      const tempObj: any = {
        value: o.id_common,
        name_common: o.name_common,
        flg_func1: o.flg_func1,
        display_order: o.display_order,
        code_func1: o.code_func1,
        denominator: 0
      }
      const match = o.name_common.match(/\/(\d+)/)
      tempObj.denominator = match ? parseInt(match[1]) : 0
      return tempObj
    })
    .sort((a: any, b: any) => a.display_order - b.display_order)

  await setPrescriptionHeader()

  if (itemServiceResponse) {

    prescriptionDetailForm.value.memo_alert = itemServiceResponse.memo_alert
    prescriptionDetailForm.value.flg_apply_insurance = await mapFlgInsurance(null, itemServiceResponse)
    prescriptionDetailForm.value.flg_etc2 = itemServiceResponse.flg_merge_price
    prescriptionDetailForm.value.type_detail = itemServiceResponse.flg_merge_price ? 3 : 1
    flgPlusItems.value = itemServiceResponse.flg_merge_price || itemServiceResponse.flg_plus_item

    if (flgPlusItems.value) {
      await fetchItemServiceUnits(4)
      prescriptionDetailForm.value.type_medicine_dosage = 4
      prescriptionDetailForm.value.type_detail = itemServiceResponse.flg_plus_item ? 2 : itemServiceResponse.flg_merge_price ? 3 : 1
      if (props.item && props.item.isCurrentPH && props.item.prescription_detail_assort_list_UI) {
        prescriptionDetailForm.value.prescription_detail_assort_list = props.item.prescription_detail_assort_list_UI
        selectedISU.value.map((isu: any) => {
          const Unit = prescriptionDetailForm.value.prescription_detail_assort_list.find((assort: any) => {
            return isu.id_item_service_unit == assort.id_item_service_unit
          })
          if (Unit) {
            isu.checked = true
            isu.val_dosage_decided = Unit.val_dosage_decided
            isu.id_prescription_detail_assort = Unit.id_prescription_detail_assort
          }
        })
        prescriptionDetailForm.value.isCurrentPH = true
        await calculateBookingDate()
      }
      return
    }

    if (itemServiceResponse.medicine) {
      const tempMedicine = itemServiceResponse.medicine

      dosageFrequencyList.value = tempMedicine.dosage_frequency_list.map(
        (dosageFrequency: any) => {
          const tempU =
            dosageFrequency.type_dose == 1
              ? '回/日'
              : dosageFrequency.type_dose == 2
                ? '回/週'
                : dosageFrequency.type_dose == 3
                  ? '回/月'
                  : ''
          return {
            quantity_dose: dosageFrequency.quantity_dose,
            label: `${dosageFrequency.name_dose_short} `,
            value: dosageFrequency.id_dosage_frequency
          }
        }
      )
      if (
        tempMedicine.id_dosage_frequency_1 &&
        (tempMedicine.flg_dosage_fixed ||
          tempMedicine.flg_dosage_variable ||
          tempMedicine.flg_dosage_per_head)
      ) {
        prescriptionDetailForm.value.dosage_frequency_UI = '1'
        prescriptionDetailForm.value.id_dosage_frequency =
          tempMedicine.id_dosage_frequency_1
        quantity_dose.value = doseStore.getAllDoses.find(
          (dose) => dose.value == tempMedicine.id_dosage_frequency_1
        )?.quantity_dose ?? 1
      }
      medicineObj.value = tempMedicine
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

      let selectedGroupKey =
        customerStore.getPet.id_cm_animal || defaultGroupKey
      const gby = groupBy(dosageFixedList.value, 'id_common')

      if (!gby[selectedGroupKey]?.length) {
        selectedGroupKey = defaultGroupKey
      }

      dosageFixedListByGroup.value = selectedGroupKey
        ? { [selectedGroupKey]: gby[selectedGroupKey] }
        : {}
    }

    if (itemServiceResponse.item_service_unit_list) {
      itemServiceUnitList.value =
        itemServiceResponse.item_service_unit_list.filter((v) => {
          const dateEnd = new Date(v?.date_end)
          const today = new Date()
          return dateEnd > today
        }).sort(
          (itemA: any, itemB: any) => {
            return itemA.display_order - itemB.display_order
          }
        )
    }
    if (itemServiceResponse.dosage_variable_list) {
      dosageVariableRes.value = itemServiceResponse.dosage_variable_list
    }
  }

  if (medicineObj.value) {

    pillDivisionList.value = useCommonStore()
      .getCommonPillDivisionOptionList.map((o: any) => {
        const tempObj: any = {
          value: o.id_common,
          name_common: o.name_common,
          flg_func1: medicineObj.value.type_efficacy_calculation ? isBitSet(parseInt(Number(medicineObj.value.type_efficacy_calculation)), parseInt(Number(o.code_func2))) : o.flg_func1,
          display_order: o.display_order,
          code_func1: o.code_func1,
          denominator: 0
        }
        const match = o.name_common.match(/\/(\d+)/)
        tempObj.denominator = match ? parseInt(match[1]) : 0
        return tempObj
      })
      .sort((a: any, b: any) => a.display_order - b.display_order)

    const prescriptionHeader = prescriptionStore.getQuickPrescriptionHeader()
    prescriptionDetailForm.value.type_medicine_dosage = ''

    filteredDoseOptionList.value = doseStore.getAllDoses
    if (props.item.selectedTab == 1) {
      if (props.item.type_medicine_dosage) {
        switch (props.item.type_medicine_dosage) {
          case 1:
            prescriptionDetailForm.value.type_medicine_dosage = '1'
            break
          case 2:
            prescriptionDetailForm.value.type_medicine_dosage = '2'
            break
          case 3:
            prescriptionDetailForm.value.type_medicine_dosage = '3'
            break
          default:
            prescriptionDetailForm.value.type_medicine_dosage = '4'

        }
      }

      prescriptionDetailForm.value.total_days_dose = props.item.total_days_dose
      let cycle = doseStore.getAllDoses.find(
        (dose) => dose.value == props.item.id_dosage_frequency
      )?.type_dose ?? 1

      prescriptionDetailForm.value.date_end = calculateDate(prescriptionDetailForm.value.date_start, props.item.total_days_dose, cycle)

      prescriptionDetailForm.value.name_medicine_format = props.item.name_medicine_format
      prescriptionDetailForm.value.type_medicine_format_ui = useCommonStore().getCommonTypeMedicineFormatOptionList.find((v: any) => v.name_common == props.item.name_medicine_format)?.id_common

      prescriptionDetailForm.value.id_dosage_frequency = props.item.id_dosage_frequency
      prescriptionDetailForm.value.memo_alert = props.item.memo_alert
      prescriptionDetailForm.value.memo_dose = props.item.memo_dose

      if (prescriptionDetailForm.value.val_weight == '' || prescriptionDetailForm.value.val_weight === null) {
        prescriptionDetailForm.type_medicine_dosage = '4'
      }

      switch (prescriptionDetailForm.value.id_dosage_frequency) {
        case medicineObj.value.id_dosage_frequency_1:
          prescriptionDetailForm.value.dosage_frequency_UI = '1'
          selectedIdDosageFrequency('1')
          break
        case medicineObj.value.id_dosage_frequency_2:
          prescriptionDetailForm.value.dosage_frequency_UI = '2'
          selectedIdDosageFrequency('2')
          break
        case medicineObj.value.id_dosage_frequency_3:
          prescriptionDetailForm.value.dosage_frequency_UI = '3'
          selectedIdDosageFrequency('3')
          break
        default:
          prescriptionDetailForm.value.dosage_frequency_CB_UI = true
          prescriptionDetailForm.value.dosage_frequency_UI = '4'
          break
      }


      await selectedTypeMedicine(prescriptionDetailForm.value.type_medicine_dosage)

      prescriptionDetailForm.value.val_efficacy_strength_doctor = props.item.val_efficacy_strength_doctor

      if (props.item.isCurrentPH) {
        let prescriptionDetailAssortListUI = []

        const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchPrescriptionDetailAssortList', {
          id_prescription_detail: props.item.prescription_detail.id_prescription_detail
        })
        if (response) {
          prescriptionDetailAssortListUI = response
          prescriptionDetailAssortListUI.map((pda) => {
            if (pda.id_prescription_detail_assort in props.item.pda_list) {
              pda.id_item_service_unit = props.item.pda_list[pda.id_prescription_detail_assort]
            }
          })
        }

        console.log(prescriptionDetailAssortListUI)
        prescriptionDetailForm.value.prescription_detail_assort_list = prescriptionDetailAssortListUI

        if (props.bookingDetail) {
          bookingDetail.value = props.bookingDetail
          await calculateBookingDate()
        }
        return
      }

      await fetchSuggestedAmount()

      if (props.bookingDetail) {
        bookingDetail.value = props.bookingDetail
        await calculateBookingDate()
      }
      return
    }

    if (medicineObj.value.id_cm_med_format) {
      prescriptionDetailForm.value.type_medicine_format_ui =
        medicineObj.value.id_cm_med_format

      prescriptionDetailForm.value.name_medicine_format =
        useCommonStore().getCommonTypeMedicineFormatOptionList.find(
          (v) => v.id_common == medicineObj.value.id_cm_med_format
        )?.name_common

      if ([3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v) => v.value == prescriptionDetailForm?.value.type_medicine_format_ui)?.code_func1)) {
        medicineObj.value.flg_dosage_fixed = false
      }
    }

    if (medicineObj.value.flg_dosage_fixed && (prescriptionDetailForm.value.name_medicine_format != '粉B')) {
      prescriptionDetailForm.value.type_medicine_dosage = '1'
      prescriptionDetailForm.value.val_weight = prescriptionHeader.val_weight
    }

    if (
      medicineObj.value.flg_dosage_variable &&
      prescriptionDetailForm.value.type_medicine_dosage == ''
    ) {
      prescriptionDetailForm.value.type_medicine_dosage = '2'
      await selectedTypeMedicine(2)
      prescriptionDetailForm.value.val_weight = prescriptionHeader.val_weight
    }

    if (
      medicineObj.value.flg_dosage_per_head &&
      prescriptionDetailForm.value.type_medicine_dosage == ''
    ) {

      if (prescriptionDetailForm.value.name_medicine_format == '粉B' || prescriptionDetailForm.value.name_medicine_format == '液状') {

        if (itemServiceUnitList.value.find((v) => Number(v.val_liquid) > 0)) {
          prescriptionDetailForm.value.type_medicine_dosage = '3'
          await selectedTypeMedicine(3)
          prescriptionDetailForm.value.val_weight = '1'
        }

      }

      if (checkPerHeadAvailable.value) {
        prescriptionDetailForm.value.type_medicine_dosage = '3'
        await selectedTypeMedicine(3)
        prescriptionDetailForm.value.val_weight = '1'
      }
    }

    if (
      medicineObj.value.flg_dosage_quantity &&
      prescriptionDetailForm.value.type_medicine_dosage == ''
    ) {
      prescriptionDetailForm.value.type_medicine_dosage = '4'
      await selectedTypeMedicine(4)
      prescriptionDetailForm.value.val_weight = prescriptionHeader.val_weight
      if (props.bookingDetail) {
        bookingDetail.value = props.bookingDetail
        await calculateBookingDate()
      }
      return
    }

    if (!flgPlusItems.value &&
      medicineObj.value.id_cm_animal.find(
        (comObj: any) =>
          comObj.id_cm_animal == customerStore.getPet.id_cm_animal &&
          comObj?.status == 99
      )
    ) {
      await mtUtils.autoCloseAlert(
        '指定の医薬品は禁忌に設定されているため、\n対象ペットには追加できません。'
      )
      removeItem()
      return
    }

    if (!flgPlusItems.value &&
      !(
        medicineObj.value.flg_dosage_quantity ||
        medicineObj.value.flg_dosage_variable ||
        medicineObj.value.flg_dosage_fixed ||
        medicineObj.value.flg_dosage_per_head
      )
    ) {
      await mtUtils.autoCloseAlert(
        '処方箋の登録情報が不正です。確認してください。'
      )
      removeItem()
      return
    }

    if (!flgPlusItems.value &&
      !medicineObj.value.id_cm_animal.find(
        (comObj: any) =>
          comObj.id_cm_animal == customerStore.getPet.id_cm_animal &&
          comObj.status == 1
      )
    ) {
      await mtUtils.autoCloseAlert('医薬品の想定対象外の動物種です。')
    }
  }

  if (props.bookingDetail) {
    bookingDetail.value = props.bookingDetail
    await calculateBookingDate()
  }


  if (flgPlusItems.value) {
    prescriptionDetailForm.value.type_medicine_dosage = '4'
  }


  if (props.item && props.item.isCurrentPH && props.item.prescription_detail_assort_list_UI) {
    prescriptionDetailForm.value.prescription_detail_assort_list = props.item.prescription_detail_assort_list_UI

    prescriptionDetailForm.value.type_medicine_format_ui =
      useCommonStore().getCommonTypeMedicineFormatOptionList.find(
        (v: any) => v.label == prescriptionDetailForm.value.name_medicine_format_ui
      )?.id_common
    return
  }

  if (!flgPlusItems.value)
    await fetchSuggestedAmount()

})
onUnmounted(() => {
  event_bus.off('isu_child')
  prescriptionStore.setAssortVolume(null)
})

</script>

<template>
  <!--PlusItemのケース-->
  <div v-if="props.item.flg_group_title">
    <div>
      <div :class="props.item.type_detail != 5 ? 'prescription_group' : '' " class="q-mr-sm">
        <MtInputForm
          v-model="prescriptionDetailForm.name_prescription_display"
          label="表示名"
          type="text"
        />
      </div>
      <template v-if="prescriptionDetailForm.type_detail == 5">
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-auto">服用頻度 *</div>
          <div class="col-4 q-pt-sm">
            <MtFormPullDown
              v-model:selected="prescriptionDetailForm.id_dosage_frequency"
              :options="filteredDoseOptionList"
              label="その他指定頻度"
              @update:selected="selectedIdDosageFrequency"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <MtFormInputNumber
              v-model:value="prescriptionDetailForm.total_days_dose"
              :label=" prescriptionDetailForm.type_medicine_dosage == '4'
                  ? '服用回数' : '服用日数 *' "
              :rules="[aahValidations.validationRequired]"
              class="field-right-text"
              mode="dosage"
              required
            />
          </div>
          <div class="col">
            <MtFormInputDate
              v-model:date="prescriptionDetailForm.date_start"
              :rules="[aahValidations.validationRequired]"
              label="服用 開始日 *"
              required
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <MtFilterSelect
              v-model:selecting="prescriptionDetailForm.name_medicine_format"
              :options="typeMedicineOptionList"
              :options-default="typeMedicineDefaultOptionList"
              label="処方時の薬剤形状 *"
              required
              @update:selecting="selectedTypeMedicineFormat1"
            />
          </div>
          <div class="col">
            <InputEmployeeOptGroup
              v-model="prescriptionDetailForm.id_employee_staff"
              label="記録者名"
              show-select-default-employee
              type-occupation="staff"
            />
          </div>
        </div>
        <div v-if="prescriptionDetailForm.type_detail == 5 " class="q-mr-sm">
          <MtInputForm
            v-model="prescriptionDetailForm.memo_dose_display"
            autogrow
            label="服用メモ"
            type="text"
          />
        </div>
        <div v-if="prescriptionDetailForm.type_detail == 5" class="q-mr-sm">
          <MtInputForm
            v-model="prescriptionDetailForm.memo_alert"
            autogrow
            label="注意事項"
            type="text"
          />
        </div>
        <div v-if="prescriptionDetailForm.type_detail === 5" class="q-mr-sm">
          <MtInputForm
            v-model="prescriptionDetailForm.memo_clinic_prep"
            autogrow
            label="調剤指示（院内メモ）"
            type="text"
          />
        </div>
        <div class="col-auto row justify-end">
          <q-btn
            flat
            unelevated
            @click="()=> { 
            emits('removeGroup', prescriptionDetailForm?.process_drip.id_prescription_detail)
          }"
          >
            <q-icon name="delete"></q-icon>
            削除
          </q-btn>
        </div>
      </template>
    </div>
  </div>
  <div v-else-if="flgPlusItems">
    <div>
      <div v-if="!flgBodyWeight">
        <span class="text-danger"><q-icon name="warning_amber" /> ペットの体重が未設定です。</span>
      </div>
      <div class="flex justify-between q-pl-md q-pa-sm gap-4 light-prescription-blue">
        <div class="flex-1">
          <div class="title2 text-grey-900 bold q-mb-xs">
            {{ item.name_item_service }}
            <q-icon
              class="cursor-pointer"
              name="quiz"
              size="1em"
              @click="
                () => {
                  mtUtils.popup(ViewItemServiceDetailModal, {
                    id: item?.id_item_service
                  })
                }
              "
            />
          </div>
          <div class="text-body2 text-grey-700 flex items-center">
            {{ item.name_category1 }}
            <q-icon name="arrow_right" />
            {{ item.name_category2 }}
          </div>
        </div>
        <div>
          <q-btn class="q-ml-md" color="primary" outline size="11px" unelevated
                 @click="prescriptionDetailForm.show = !prescriptionDetailForm.show">
            {{ prescriptionDetailForm.show ? '閉じる' : '開く' }}
          </q-btn>
        </div>
      </div>

      <div v-show="prescriptionDetailForm.show">
        <!-- Factors to calculate prescription detail & assort data -->
        <div class="q-mx-md">
          <!-- <div class="row q-col-gutter-md">
            <div class="col-auto q-pt-sm">
              <MtFormRadiobtn
                label="数量指定"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                val="4"
                @update:selected="selectedTypeMedicine(4)"
                :selected="true"
              />
            </div>
          </div> -->
          <div class="row q-col-gutter-md q-mt-xs">
            <div class="col-6">
              <InputEmployeeOptGroup
                v-model="prescriptionDetailForm.id_employee_staff"
                label="担当者"
                show-select-default-employee
                type-occupation="staff"
              />
            </div>
          </div>

          <div class="row q-col-gutter-md q-mt-xs">
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                autogrow
                label="服用メモ"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(42)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                autogrow
                label="注意事項"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(44)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
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
          <div class="row q-col-gutter-md q-mb-md justify-between q-mt-sm">
            <div class="col-auto">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_non_charge"
                label="会計対象外"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_hospitalization_usage"
                label="院内使用"
              />
            </div>
            <div class="col-auto">
              <MtInputForm
                v-model="prescriptionDetailForm.flg_apply_insurance"
                :items="[{ label: '保険適用' }]"
                type="checkbox"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                unelevated
                @click="removeItem(prescriptionDetailForm.id_item_service)"
              >
                <q-icon name="delete"></q-icon>
                削除
              </q-btn>
            </div>
          </div>
          <div v-for="item in selectedISU" :key="item.value" class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <MtFormCheckBox
                v-model:checked="item.checked"
                :label="item.label"
                class="q-mr-md"
                @update:checked="()=>{
                  setValDosageQuantity(prescriptionStore.prescriptionDetailListByUI)
                }"
              />
            </div>
            <div class="col-3">
              <MtFormInputNumber
                v-if="item.checked"
                v-model:value="item.val_dosage_decided"
                class=" q-mr-md" label="数量"
                mode="dosage"
              />
            </div>
            <div class="col-3 flex items-end justify-end">
              <div v-if="item.checked" class="caption1 regular">合計金額：
                {{ item.unitPrice * (item.val_dosage_decided ?? 1) }} 円
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="medicineObj.flg_drip_carrier && prescriptionDetailForm.process_drip"
          class="q-mx-md drip-box q-pa-sm q-mb-md"
        >
          <div class="row items-center">
            <span class="text-white pill-title title4">点滴指示</span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="prescriptionDetailForm.type_medicine_format_ui"
                :options="useCommonStore().getCommonTypeMedicineFormatOptionList
                .filter((v)=> ![8,9, '8', '9'].includes(v.code_func1))"
                :rules="[aahValidations.validationRequired]"
                label="処方時の薬剤形状 *"
                required
                @update:selected="selectedTypeMedicineFormat"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="
                prescriptionDetailForm.process_drip.id_cm_med_route
              "
                :options="useCommonStore().getCommonTypeMedicineRouteList"
                :rules="[aahValidations.validationRequired]"
                label="処方時の薬剤形状 *"
                required
                @update:selected="selectedTypeMedicineFormat"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
                val="1"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="prescriptionDetailForm.process_drip.time"
                :disable="
                prescriptionDetailForm.process_drip.calculation_fixed_unit == '1'
              "
                label="投与時間"
                type="number"
                @updatedValue="
                () => {
                  prescriptionUtils.computeVolume(prescriptionDetailForm)
                  prescriptionUtils.computeFlowRate(prescriptionDetailForm)
                }
              "
              />
            </div>
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.time_unit"
              class="q-pr-md"
              label="時間"
              val="1"
            />
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.time_unit"
              class="q-pr-md"
              label="分間"
              val="2"
            />
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
                class="q-pr-md"
                val="2"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="prescriptionDetailForm.process_drip.flow_rate"
                :disable="
                prescriptionDetailForm.process_drip.calculation_fixed_unit == '2'
              "
                label="流量速度"
                type="number"
                @updatedValue="
                () => {
                  prescriptionUtils.computeTime(prescriptionDetailForm)
                  prescriptionUtils.computeVolume(prescriptionDetailForm)
                }
              "
              />
            </div>
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
              class="q-pr-md"
              label="mL/時"
              val="1"
            />
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
              class="q-pr-md"
              label="mL/分"
              val="2"
            />
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
                class="q-pr-md"
                val="3"
              />
            </div>
            <div class="col-5">
              <MtFormInputNumber
                v-model:value="getPrescriptionAssortVolume"
                :disable="
                prescriptionDetailForm.process_drip.calculation_fixed_unit == '3'
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
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                autogrow
                label="服用メモ"
                type="text"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                autogrow
                label="注意事項"
                type="text"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
                autogrow
                label="調剤指示（院内メモ）"
                type="text"
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
                flat
                unelevated
                @click="removeItem(prescriptionDetailForm.id_item_service)"
              >
                <q-icon name="delete"></q-icon>
                削除
              </q-btn>
            </div>
          </div>
        </div>

      </div>

      <q-dialog
        v-model="toggleDivision"
        style="
        {
          width: 310px !important;
        }
      "
        @update:model-value="applyDefaultSetting"
      >
        <q-card class="mt-small-popup">
          <MtModalHeader
            class="bg-sky-blue"
            @close-modal="() => (toggleDivision = !toggleDivision)"
          >
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
              color="primary"
              label="保存"
              size="sm"
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
    </div>
  </div>
  <div v-else>
    <div>
      <div v-if="!flgBodyWeight" class="q-mb-xs">
        <span class="text-danger"><q-icon name="warning_amber" /> ペットの体重が未設定です。</span>
      </div>
      <div class="flex justify-between q-pl-md q-pa-sm gap-4 light-prescription-blue">
        <div class="flex-1">
          <div class="title2 text-grey-900 bold q-mb-xs">
            {{ item.name_item_service }}
            <q-icon
              class="cursor-pointer q-pl-sm"
              name="quiz"
              size="1em"
              @click="
                () => {
                  mtUtils.popup(ViewItemServiceDetailModal, {
                    id: item?.id_item_service
                  })
                }
              "
            />
          </div>
          <div class="text-body2 text-grey-700 flex items-center">
            {{ item.name_category1 }}
            <q-icon name="arrow_right" />
            {{ item.name_category2 }}
          </div>
        </div>
        <div>
          <q-btn class="q-mr-md" outline @click="fetchItemServiceUnits">
            全表示
          </q-btn>
          <template
            v-if="![2, 3, '2', '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == prescriptionDetailForm?.type_medicine_format_ui)?.code_func1 )">
            <q-btn
              v-if="prescriptionDetailForm.type_medicine_dosage != '4'"
              :disable="prescriptionDetailForm.type_medicine_dosage == '4'"
              outline
              @click="fetchSuggestedAmount"
            >
              自動
            </q-btn>
            <q-btn
              v-if="
              prescriptionDetailForm.type_medicine_dosage == '2' ||
              prescriptionDetailForm.type_medicine_dosage == '3'
            "
              :disable="prescriptionDetailForm.type_medicine_dosage == '4'"
              class="q-ml-md"
              outline
              @click="toggleDivision = !toggleDivision"
            >
              <q-icon class="" name="drag_indicator" size="2em" />
              <q-badge v-if="feDivisionFlgCount > 0" color="red" floating>
                {{ feDivisionFlgCount }}
              </q-badge>
            </q-btn>
          </template>
          <q-btn class="q-ml-md" color="primary" outline size="11px" unelevated
                 @click="prescriptionDetailForm.show = !prescriptionDetailForm.show">
            {{ prescriptionDetailForm.show ? '閉じる' : '開く' }}
          </q-btn>
        </div>
      </div>

      <div v-show="prescriptionDetailForm.show">
        <div class="q-mt-sm">
          <span
            :class="
              prescriptionDetailForm.flg_overdosing ? 'text-darkred' : 'text-white'
            "
            class="q-mt-xs"
          >
            <small>※ 規定量以上の投与です。注意してください。</small>
          </span>
        </div>

        <!-- Factors to calculate prescription detail & assort data -->
        <div v-if="!medicineObj.flg_drip_carrier" class="q-mx-md">
          <div class="row q-col-gutter-md">
            <div class="col-auto">服用量計算 *</div>
            <div class="col-auto q-pt-sm">
              <MtFormRadiobtn
                v-if="(medicineObj.flg_dosage_fixed && ![2, 3, '2', '3', 15, '15']
                .includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == 
                  prescriptionDetailForm?.type_medicine_format_ui)?.code_func1 ))"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                class="q-pr-md"
                label="早見表"
                val="1"
                @update:selected="selectedTypeMedicine"
              />
              <MtFormRadiobtn
                v-if="medicineObj.flg_dosage_variable"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                class="q-pr-md"
                label="可変量/kg"
                val="2"
                @update:selected="selectedTypeMedicine"
              />
              <MtFormRadiobtn
                v-if="checkPerHeadAvailable"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                class="q-pr-md"
                label="可変量/head"
                val="3"
                @update:selected="selectedTypeMedicine"
              />
              <MtFormRadiobtn
                v-if="medicineObj.flg_dosage_quantity"
                v-model="prescriptionDetailForm.type_medicine_dosage"
                label="数量指定"
                val="4"
                @update:selected="selectedTypeMedicine"
              />
            </div>
          </div>
          <div
            v-if="
              dosageVariableRange &&
              (prescriptionDetailForm.type_medicine_dosage == 2 ||
                prescriptionDetailForm.type_medicine_dosage == 3)
            "
          >
            <div class="row">
              <MtFormInputNumber
                v-model:value="prescriptionDetailForm.val_efficacy_strength_doctor"
                class="col-2 field-right-text doctor-amount-icon"
                label="服用成分量"
                mode="dosage"
                @blur="()=>fetchSuggestedAmount()"
                @update:value="
                  (value) => {
                    prescriptionDetailForm.flg_overdosing = false
                    if (value > dosageVariableRangeValue.max) {
                      prescriptionDetailForm.flg_overdosing = true
                    }
                  }
                "
              />
              <div
                v-show="efficacyCalculation"
                class="flex calculation-process bi-grid-3x2-gap"
              >
                <q-icon class="q-pt-xs q-mr-sm" name="info" />
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
          <div v-if="prescriptionDetailForm.type_medicine_dosage == 1 &&
          ![ 3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == 
             prescriptionDetailForm?.type_medicine_format_ui)?.code_func1 )">
            <q-btn
              color="primary"
              label="投薬早見表"
              size="sm"
              @click="
                () => {
                  if (itemServiceUnitList.length === 0) {
                    mtUtils.autoCloseAlert('品名包装単位がありません。')
                    return
                  }
                  itemServiceUnitD = true
                }
              "
            />
            <q-dialog v-model="itemServiceUnitD">
              <q-card style="width: 720px; max-width: 80vw">
                <div class="row q-col-gutter-xs">
                  <div class="col-12">
                    <!--              <p class="q-mb-md">早見表</p>-->
                    <table
                      v-for="[index2, fixedDosage] in Object.entries(
                        dosageFixedListByGroup
                      )"
                      :key="index2"
                      class="table-custom-fixed q-pa-lg"
                    >
                      <thead>
                      <tr>
                        <td class="q-ba q-pa-lg">
                          <div class="title2 text-grey-900 bold q-mb-xs">
                            {{
                              getItem(item.id_item_service)?.name_item_service
                            }}
                            {{
                              `( ${
                                useCommonStore().getCommonTypeAnimalOptionList.find(
                                  (v) => v.value == index2
                                )?.label ?? '全種'
                              } )`
                            }}
                          </div>
                          <div class="text-body2 text-grey-700 flex items-center">
                            {{ item.name_category1 }}
                            <q-icon name="arrow_right" />
                            {{ item.name_category2 }}
                          </div>
                        </td>
                        <template
                          v-if="
                              itemServiceUnitList && itemServiceUnitList.length > 0
                            "
                        >
                          <template
                            v-for="(item, index) in itemServiceUnitList"
                            :key="index"
                          >
                            <td class="q-ba q-pa-lg">
                              <span>{{ item.name_service_item_unit }} </span>
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
                                <span class="body2">g</span>{{ '  未満 ' }} <br />
                                <span class="flex justify-center">
                                  {{
                                    ` ( ${
                                      useCommonStore().getCommonOptionList.find(
                                        (v) => v.value == fixedDosage.id_common
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
                                      fixedDosage.dosage_fixed_detail_list.length >
                                        0 &&
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

          <div class="row q-col-gutter-md q-my-md">
            <div class="col-auto">服用頻度 *</div>
            <div class="col-auto q-pt-sm">
              <MtFormRadiobtn
                v-if="medicineObj && medicineObj.id_dosage_frequency_1"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                :disable="disable_dosage_frequency_UI"
                :label="dosageFrequencyList[0].label"
                class="q-pr-md"
                val="1"
                @update:selected="selectedIdDosageFrequency"
              />
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_2"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                :disable="disable_dosage_frequency_UI"
                :label="dosageFrequencyList[1].label"
                class="q-pr-md"
                val="2"
                @update:selected="selectedIdDosageFrequency"
              />
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_3"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                :disable="disable_dosage_frequency_UI"
                :label="dosageFrequencyList[2].label"
                class="q-pr-md"
                val="3"
                @update:selected="selectedIdDosageFrequency"
              />
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.dosage_frequency_CB_UI"
                class="q-pr-md"
                label="他"
                @update:checked="checkedDosageFreqCB_UI"
              />
            </div>
            <div
              v-if="prescriptionDetailForm.dosage_frequency_CB_UI"
              class="col-4 q-pt-sm"
            >
              <MtFormPullDown
                v-model:selected="prescriptionDetailForm.id_dosage_frequency"
                :options="filteredDoseOptionList"
                label="その他指定頻度"
                @update:selected="selectedIdDosageFrequency"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div v-if="prescriptionDetailForm.type_medicine_dosage" class="col-4">
              <MtFormInputNumber
                v-if="isQuantityAvailable"
                v-model:value="prescriptionDetailForm.total_days_dose"
                :class="totalDoseUI"
                :label="
                  prescriptionDetailForm.type_medicine_dosage == '4'
                    ? '服用回数'
                    : '服用日数 *'
                "
                :rules="[aahValidations.validationRequired]"
                class="field-right-text total-days-dose-icon"
                mode="dosage"
                required
                @update:value="
                  () => {
                    prescriptionDetailForm.date_end = calculateDate(
                      prescriptionDetailForm.date_start,
                      prescriptionDetailForm.total_days_dose,
                      typeDoseUI
                    )
                  }
                "
              />
            </div>
            <div class="col-4">
              <MtFormInputDate
                v-model:date="prescriptionDetailForm.date_start"
                :rules="[aahValidations.validationRequired]"
                label="服用 開始日 *"
                required
                @update:date="()=>{
                  prescriptionDetailForm.date_end = calculateDate(
                      prescriptionDetailForm.date_start,
                      prescriptionDetailForm.total_days_dose,
                      typeDoseUI
                    )
                }"
              />
            </div>
            <div
              v-if="
                !(
                  prescriptionDetailForm.type_medicine_dosage == '10' ||
                  typeDoseUI == '10'
                )
              "
              class="col-4"
            >
              <MtFormInputDate
                v-if="isQuantityAvailable"
                v-model:date="prescriptionDetailForm.date_end"
                label="服用 終了日"
                @update:date="()=>{
                  if (prescriptionDetailForm.date_start > prescriptionDetailForm.date_end) {
                    prescriptionDetailForm.date_start = prescriptionDetailForm.date_end
                  }
                  onDateChanged()
                }"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="prescriptionDetailForm.type_medicine_format_ui"
                :options="useCommonStore().getCommonTypeMedicineFormatOptionList.filter((v) => ![8,9, '8', '9'].includes(v.code_func1))"
                :rules="[aahValidations.validationRequired]"
                label="処方時の薬剤形状 *"
                required
                @update:selected="selectedTypeMedicineFormat"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                autogrow
                label="服用メモ"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(42)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                autogrow
                label="注意事項"
                type="text"
              >
                <template #append>
                  <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(43)" />
                </template>
              </MtInputForm>
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
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
          <div class="row q-col-gutter-md q-mb-md justify-between">
            <div class="col-6">
              <InputEmployeeOptGroup
                v-model="prescriptionDetailForm.id_employee_staff"
                label="担当者"
                show-select-default-employee
                type-occupation="staff"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md justify-between">
            <div class="col-auto">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_non_charge"
                label="会計対象外"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                v-model:checked="bookingDetail.tBookingFlag"
                label="次回予定の作成"
                @update:checked="calculateBookingDate(bookingDetail, )"
              />
            </div>
            <div class="col-auto">
              <MtInputForm
                v-model="prescriptionDetailForm.flg_apply_insurance"
                :items="[{ label: '保険適用' }]"
                type="checkbox"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                v-model:checked="prescriptionDetailForm.flg_hospitalization_usage"
                label="院内使用"
              />
            </div>
            <div class="col-auto">
              <q-btn v-if="isEffortAvailable" class="text-white q-mr-md" color="primary" size="sm" @click="()=>{
                  props.callBack(isEffortAvailable)
                }">
                追加サービス
              </q-btn>
            </div>
            <div class="col-auto q-ml-md">
              <q-btn
                flat
                unelevated
                @click="removeItem(prescriptionDetailForm.id_item_service)"
              >
                <q-icon name="delete"></q-icon>
                削除
              </q-btn>
            </div>
          </div>


          <!-- T BOOKING -->
          <div v-if="bookingDetail.tBookingFlag" class="">
            <div class="row q-col-gutter-md q-pa-md items-center">
              <div class="col-4">
                <MtFormInputDate
                  v-model:date="bookingDetail.date_booking_confirmed"
                  datetime
                  label="予定日"
                />
              </div>
              <div class="col-3 text-center">
                <MtInputForm
                  v-model="bookingDetail.tBookingFlgTime"
                  :items="[{ label: '時刻' }]"
                  type="checkbox"
                />
              </div>
              <div v-if="bookingDetail.tBookingFlgTime" class="col-4">
                <MtFormPullDown
                  v-model:selected="bookingDetail.time_booking_confirmed"
                  :options="timeHourMinute"
                  label="時：分"
                  @update:selected="(value) => { if(value){ bookingDetail.datetime_booking_confirmed += value}}"
                />
              </div>
            </div>
            <div v-if="false" class="row q-col-gutter-md q-pa-md items-center">
              <div class="col-4">
                <MtInputForm
                  v-model="bookingDetail.tBookingFlgRepeat"
                  :items="[{ label: '繰返し' }]"
                  type="checkbox"
                />
              </div>
              <div v-if="bookingDetail.tBookingFlgRepeat" class="col-3">
                <MtInputForm
                  v-model="bookingDetail.days_repeat"
                  label="繰り返しサイクル"
                  type="number"
                />
              </div>
              <div v-if="bookingDetail.tBookingFlgRepeat" class="col-4">
                <MtFormPullDown
                  v-model="bookingDetail.type_day"
                  :options="typeDays"
                  label="タイプ日"
                  type="selection"
                />
              </div>

            </div>
            <div v-if="false" class="row q-col-gutter-md q-pa-md items-center">
              <div class="col-4">
                <MtInputForm
                  v-model="bookingDetail.flg_continue"
                  :items="[{ label: '継続' }]"
                  type="checkbox"
                />
              </div>
              <div class="col-3">
                <MtInputForm
                  v-model="bookingDetail.flg_exempt"
                  :items="[{ label: '猶予' }]"
                  type="checkbox"
                />
              </div>
              <div class="col-4">
                <MtInputForm
                  v-model="bookingDetail.flg_end"
                  :items="[{ label: '最終' }]"
                  type="checkbox"
                />
              </div>
            </div>
          </div>

        </div>
        <div
          v-if="medicineObj.flg_drip_carrier && prescriptionDetailForm.process_drip"
          class="q-mx-md drip-box q-pa-sm q-mb-md"
        >
          <div class="row items-center">
            <span class="text-white pill-title title4">点滴指示</span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="prescriptionDetailForm.type_medicine_format_ui"
                :options="useCommonStore().getCommonTypeMedicineFormatOptionList"
                :rules="[aahValidations.validationRequired]"
                label="処方時の薬剤形状 *"
                required
                @update:selected="selectedTypeMedicineFormat"
              />
            </div>
            <div class="col-4">
              <MtFormPullDown
                v-model:selected="
                  prescriptionDetailForm.process_drip.id_cm_med_route
                "
                :options="useCommonStore().getCommonTypeMedicineRouteList"
                :rules="[aahValidations.validationRequired]"
                label="処方時の薬剤形状 *"
                required
                @update:selected="selectedTypeMedicineFormat"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
                val="1"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="prescriptionDetailForm.process_drip.time"
                :disable="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit == '1'
                "
                label="投与時間"
                type="number"
                @updatedValue="
                  () => {
                    prescriptionUtils.computeVolume(prescriptionDetailForm)
                    prescriptionUtils.computeFlowRate(prescriptionDetailForm)
                  }
                "
              />
            </div>
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.time_unit"
              class="q-pr-md"
              label="時間"
              val="1"
            />
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.time_unit"
              class="q-pr-md"
              label="分間"
              val="2"
            />
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
                class="q-pr-md"
                val="2"
              />
            </div>
            <div class="col-5">
              <MtInputForm
                v-model="prescriptionDetailForm.process_drip.flow_rate"
                :disable="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit == '2'
                "
                label="流量速度"
                type="number"
                @updatedValue="
                  () => {
                    prescriptionUtils.computeTime(prescriptionDetailForm)
                    prescriptionUtils.computeVolume(prescriptionDetailForm)
                  }
                "
              />
            </div>
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
              class="q-pr-md"
              label="mL/時"
              val="1"
            />
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
              class="q-pr-md"
              label="mL/分"
              val="2"
            />
          </div>
          <div class="row q-gutter-md q-mb-md">
            <div class="col-1">
              <MtFormRadiobtn
                v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
                class="q-pr-md"
                val="3"
              />
            </div>
            <div class="col-5">
              <MtFormInputNumber
                v-model:value="getPrescriptionAssortVolume"
                :disable="
                  prescriptionDetailForm.process_drip.calculation_fixed_unit == '3'
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
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_dose"
                autogrow
                label="服用メモ"
                type="text"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_alert"
                autogrow
                label="注意事項"
                type="text"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="prescriptionDetailForm.memo_clinic_prep"
                autogrow
                label="調剤指示（院内メモ）"
                type="text"
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
                flat
                unelevated
                @click="removeItem(prescriptionDetailForm.id_item_service)"
              >
                <q-icon name="delete"></q-icon>
                削除
              </q-btn>
            </div>
          </div>
        </div>

        <!-- prescription assort data -->
        <div
          v-if="prescriptionDetailForm.prescription_detail_assort_list && prescriptionDetailForm.prescription_detail_assort_list.length > 0"
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
            v-if="[ 3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.value == prescriptionDetailForm.type_medicine_format_ui)?.code_func1 ) &&
             itemServiceResponse.item_service_unit_list.find((v)=> (Number(v.val_efficacyingredient)  > 0 && Number(v.val_liquid)))"
            :ref="setChildRef(prescriptionDetailForm.prescription_detail_assort_list.length - 1)"
            :calculatedTotalDosage="calculatedTotalDosage"
            :efficacyCalculation="calculatedEfficacy"
            :is-edit="props.item && props.item.isCurrentPH"
            :itemServiceUnitList="itemServiceResponse.item_service_unit_list"
            :pillDivision="pillDivisionList"
            :prescription-assort="prescriptionDetailForm.prescription_detail_assort_list[prescriptionDetailForm.prescription_detail_assort_list.length - 1]"
            class="assort-box"
            @removeIndex="
                () => {
                  prescriptionDetailForm.prescription_detail_assort_list.splice(
                    prescriptionDetailForm.prescription_detail_assort_list.length - 1,
                    1
                  )
                }
              "
            @whole-pill="updateWholePill"
          />
          <PrescriptionDetailAssortBPowderBox
            v-for="(
                prescriptionAssort, index
              ) in prescriptionDetailForm?.prescription_detail_assort_list"
            v-else-if="([ 15, '15', 5 , '5'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.value == prescriptionDetailForm.type_medicine_format_ui)?.code_func1 ) &&
             ['2', '3'].includes(prescriptionDetailForm.type_medicine_dosage)) &&
             itemServiceResponse.item_service_unit_list.find((v)=> Number(v.val_efficacyingredient)  > 0) && itemServiceResponse.item_service_unit_list.find((v)=> Number(v.val_liquid)  > 0)"
            :key="prescriptionAssort.id_prescription_detail_assort"
            :ref="setChildRef(index)"
            :calculatedTotalDosage="calculatedTotalDosage"
            :is-edit="prescriptionDetailForm?.isCurrentPH"
            :itemServiceUnitList="itemServiceResponse.item_service_unit_list"
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
          <div
            v-for="(
              prescriptionAssort, index
            ) in prescriptionDetailForm?.prescription_detail_assort_list"
            v-else-if="![1, '1' ].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.value == prescriptionDetailForm.type_medicine_format_ui)?.code_func1 ) || 
            ([ 3, '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.value == prescriptionDetailForm.type_medicine_format_ui)?.code_func1) &&
             !itemServiceResponse.item_service_unit_list.find((v)=> Number(v.val_efficacyingredient) > 0)  )"
            :key="prescriptionAssort.id_prescription_detail_assort"
            class="full-width"
          >
            <PrescriptionDetailAssortGenericListBox
              v-if="!prescriptionAssort.powderFormatUi"
              :ref="setChildRef(index)"
              :calculatedDosage="calculatedTotalDosage"
              :is-edit="prescriptionDetailForm?.isCurrentPH"
              :itemServiceUnitList="itemServiceResponse.item_service_unit_list"
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
              v-if="!prescriptionAssort.powderFormatUi"
              :ref="setChildRef(index)"
              :calculatedTotalDosage="calculatedTotalDosage"
              :is-edit="prescriptionDetailForm?.isCurrentPH"
              :itemServiceUnitList="itemServiceResponse.item_service_unit_list"
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
                      roundZeroAfterPoint(prescriptionDetailForm.total_days_dose) +
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
            v-if="val_total_efficacyingredient && [1, 3 , '1' , '3', '5', '15', 15, 5].includes(useCommonStore().getCommonTypeMedicineFormatOptionList
            .find((v)=> v.value == prescriptionDetailForm.type_medicine_format_ui)?.code_func1 ) && assortUnitUi != 'undefined'"
            class="dosage-variable-range"
          >
            処方明細の総有効成分量：
            {{ roundZeroAfterPoint(val_total_efficacyingredient, 3) + ' ' + assortUnitUi }}
            <span class="q-ml-sm">
              （
              {{
                Number(efficacyPetKg.toFixed(2)) == 0 ? roundZeroAfterPoint(efficacyPetKg) + ` ${assortUnitUi} / Kg` :
                  roundZeroAfterPoint(efficacyPetKg.toFixed(2)) + ` ${assortUnitUi} / Kg`
              }}）</span>
          </div>
        </div>


      </div>

      <q-dialog
        v-model="toggleDivision"
        style="
          {
            width: 310px !important;
          }
        "
        @update:model-value="applyDefaultSetting"
      >
        <q-card class="mt-small-popup">
          <MtModalHeader
            class="bg-sky-blue"
            @close-modal="() => (toggleDivision = !toggleDivision)"
          >
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
              color="primary"
              label="保存"
              size="sm"
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
    </div>
  </div>

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    :data="prescriptionDetailForm"
    :options="memoTemplates"
    :single-option="true"
    modelTitle="処方箋"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>

<style lang="scss" scoped>
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

.doctor-amount-icon-kg::after {
  content: 'mg';
  /* font-family: 'Material Icons'; */
  top: 65% !important;
}

.doctor-amount-icon-head::after {
  content: '頭';
  /* font-family: 'Material Icons'; */
  top: 65% !important;
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
