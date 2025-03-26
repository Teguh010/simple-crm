<script lang="ts" setup>
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

import useCustomerStore from '@/stores/customers'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import {
  calculateDate,
  concatenate,
  getDateTimeNow,
  getDateToday,
  isBitSet,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import { event_bus } from '@/utils/eventBus'
import useInjectStore from '@/stores/inject'
import MtModalHeader from '@/components/MtModalHeader.vue'
import injectUtils from '@/pages/request/inject/injectUtils'
import { timeHourMinute, typeBodyWeightUnit, typeRabiesProcess, typeRabiesRound } from '@/utils/enum'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCliCommonStore from '@/stores/cli-common'
import useAddressesStore from '@/stores/addresses'
import OptionItemServiceUnitModalUI from '@/pages/request/serviceDetail/OptionItemServiceUnitModalUI.vue'
import { round } from 'lodash'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import { TextTemplateType } from '@/types/types'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'

const injectStore = useInjectStore()
const customerStore = useCustomerStore()
const templateStore = useTextTemplateStore()

const { getTemplates } = storeToRefs(templateStore)

const props = defineProps({
  item: <any>Object,
  index: Object,
  requestObj: <any>Object,
  rabies: Object,
  callBack: Function,
  injectHeader: Object
})

const isEdit = ref(false)
const isManualDrip = ref(false)

const emits = defineEmits(['removeItem', 'checkSuggestionResponse'])

const getFormData = () => {


  if (injectDetailForm.value.datetime_processed == '') {
  }

  if (injectDetailForm.value.val_efficacyingredient === 'NaN') injectDetailForm.value.val_efficacyingredient = 1

  if (injectDetailForm.value.val_efficacy_strength_doctor) {
    injectDetailForm.value.val_efficacy_strength_doctor = Number(injectDetailForm.value.val_efficacy_strength_doctor).toFixed(4)
  }

  if (injectDetailForm.value.booking && injectDetailForm.value.booking.id_booking) {
    injectDetailForm.value.booking.datetime_booking_confirmed = injectDetailForm.value.booking.date_booking_confirmed
    if (injectDetailForm.value.booking.FlgUI && injectDetailForm.value.booking.time_booking_confirmed) {
      injectDetailForm.value.booking.datetime_booking_confirmed = `${injectDetailForm.value.booking.date_booking_confirmed} ${injectDetailForm.value.booking.time_booking_confirmed}:00`
    } else {
      injectDetailForm.value.booking.datetime_booking_confirmed = `${injectDetailForm.value.booking.date_booking_confirmed} 00:00:00`
    }
  }

  if (injectDetailForm.value.type_detail == 2 || injectDetailForm.value.type_detail == 3) {
    injectDetailForm.value.effort_unit_list = selectedISU.value.filter((item: any) => item.checked)
  }

  if (injectDetailForm.value.val_dosage_decided)
    injectDetailForm.value.val_dosage_decided = roundZeroAfterPoint(
      injectDetailForm.value.val_dosage_decided,
      3
    )

  delete injectDetailForm.value.datetime_insert
  delete injectDetailForm.value.datetime_update

  if ('id_employee_update' in injectDetailForm.value)
    delete injectDetailForm.value.id_employee_update

  return injectDetailForm.value
}

const changeShowDetails = (value) => {
  injectDetailForm.value.show = value
}

defineExpose({
  getFormData,
  changeShowDetails
})

const calculatedEfficacy = ref()

const medicineObj = ref<any>({
  id_dosage_frequency_1: null,
  id_dosage_frequency_2: null,
  id_dosage_frequency_3: null
})

let selectedISU = ref([])
const isEffortAvailable = ref({})
const flgPlusItem = ref(false)

const itemServiceUnitList: any = ref([])
const dosageFixedDetailList: any = ref([])
const dosageVariableRes: any = ref([])

const publicHealthCenterList: any = ref([])

const addTemplateModal = ref(false)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])

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
  time_start: null,
  date_end: null,
  id_employee_doctor: null,
  id_employee_staff: null,
  type_inject_route: null,
  num_conduct: 1,
  val_weight: null,
  val_dosage_suggested: null,
  val_dosage_decided: null,
  val_used_portion: null,
  val_efficacyingredient: null,
  calculation_fixed_unit: '1',
  val_used_liquid: null,
  datetime_processed: getDateTimeNow(),
  speed_process: null,
  type_speed_unit: null,
  time_process: null,
  type_process_time: null,
  flg_non_charge: null,
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
  id_employee_insert: null,
  datetime_insert: null,
  id_employee_update: null,
  datetime_update: null,
  name_medicine_format: '',
  rabies: {},
  booking: {},
  show: true,
  type_detail: 1,
  process_helper: {
    id_inject_detail: null,
    inject_detail_parent: null
  }
})

const commonTypeAnimalOptionList: any = ref([])

let itemServiceResponse

const dosageVariableRange: any = ref(null)
const dosageVariableRangeUnit: any = ref()
const dosageVariableRangeValue: any = ref({
  min: 0,
  max: 0
})

const toggleDialog1 = ref({})
const selectedUnit = ref()

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

function removeItem() {
  emits('removeItem', injectDetailForm.value.id_item_service)
}

watch(
  () => useInjectStore().currentHeader,
  (nowValue, oldValue) => {
    if (nowValue) {
      injectDetailForm.value.flg_non_charge = nowValue.flg_non_charge
    }
  },
  {
    deep: true
  }
)

watch(() => useInjectStore().currentSelectedIdEmployeeDoctor, (nowValue, oldValue) => {
  if (isEdit.value) return
  if (!isEdit.value && nowValue) {
    injectDetailForm.value.id_employee_doctor = nowValue
  }
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
    calculatedEfficacy.value = roundZeroAfterPoint((injectDetailForm.value?.val_weight / 1000) * injectDetailForm.value?.val_efficacy_strength_doctor)
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


const updatePortion = async () => {

  if (selectedUnit.value && (!selectedUnit.value?.val_liquid || !selectedUnit.value?.val_efficacyingredient)) {
    await mtUtils.alert('品名包装単位に薬液全量の登録がありません。', '確認')
    if (Number(injectDetailForm.value.val_dosage_decided) === 0) {
      injectDetailForm.value.val_dosage_decided = 1
    }
    return
  }

  if (injectDetailForm.value.type_medicine_dosage == 2 || injectDetailForm.value.type_medicine_dosage == 3) {
    let calculatedEfficacyIngredient = (Number(injectDetailForm.value.val_used_portion) / Number(selectedUnit.value.val_liquid)) * selectedUnit.value.val_efficacyingredient
    injectDetailForm.value.val_efficacy_strength_doctor = calculatedEfficacyIngredient / (Number(injectDetailForm.value.val_weight) / 1000)
  }

  if (injectDetailForm.value.type_medicine_dosage == 4) {
    injectDetailForm.value.val_dosage_decided = (injectDetailForm.value.val_used_portion / (selectedUnit.value.val_liquid ?? 1))
  }

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
  if (type === 51) {
    if (injectDetailForm.value?.memo_etc1) {
      injectDetailForm.value.memo_etc1 = `${injectDetailForm.value.memo_etc1} ${value}`
    } else {
      injectDetailForm.value.memo_etc1 = value
    }
    return
  }
  if (type === 52) {
    if (injectDetailForm.value?.memo_etc2) {
      injectDetailForm.value.memo_etc2 = `${injectDetailForm.value.memo_etc2} ${value}`
    } else {
      injectDetailForm.value.memo_etc2 = value
    }
    return
  }
}

function computeValSuggested(value) {
  if (value) {
    injectDetailForm.value.val_dosage_suggested = value
    percent.value =
      value /
      Number(
        itemServiceUnitList.value.find(
          (itemService: any) =>
            itemService.id_item_service_unit ==
            injectDetailForm.value.id_item_service_unit
        )?.val_liquid
      )
    injectDetailForm.value.val_dosage_decided =
      value /
      Number(
        itemServiceUnitList.value.find(
          (itemService: any) =>
            itemService.id_item_service_unit ==
            injectDetailForm.value.id_item_service_unit
        )?.val_liquid
      )
    injectDetailForm.value.val_used_liquid = value
  }
}

async function setInjectHeader() {
  const idPet: any = customerStore.getPet.id_pet
  const injectHeader = injectStore.getInjectHeaderByPet(idPet)
  if (!injectStore.getInjectHeaderByPet(idPet)) {
    // await mtUtils.alert('対象ペットにはまだ処方箋が作成されていません。')
    return
  }
}


function CalculateValueDecidedForISU(parent: any) {
  selectedISU.value.map((assort: any) => {
    if (!assort.checked) return


    const cliCommon = useCliCommonStore().getCliCommonAutoPriceCalculation
      .filter((cliCommon) => new Date(cliCommon.date_end) > new Date())
      .find((cliCommon) => cliCommon.code_func2 == assort.id_item_service_unit)
    if (cliCommon) {
      assort.val_dosage_decided = 1
      if (cliCommon.text1 == 3) {
        assort.val_dosage_decided = Number(parent.num_conduct)
      }
    }
    return assort
  })
}

function setValDosageQuantity(nowValue) {
  const parent = nowValue.find((item) => item?.process_helper?.id_inject_detail == injectDetailForm.value?.process_helper?.id_inject_detail_parent)

  if (parent) {
    CalculateValueDecidedForISU(parent)
    return
  }

  const plusIdx = nowValue.findIndex((item: any) => item?.process_helper?.id_inject_detail == injectDetailForm.value?.process_helper?.id_inject_detail_parent)

  if (plusIdx > -1) {
    const parentList = [...nowValue].splice(0, plusIdx).filter((item) => item.type_detail == 1)
    if (parentList.length > 0) {
      const plusParent = parentList[parentList.length - 1]
      if (plusParent) CalculateValueDecidedForISU(plusParent)
      return
    }
  }
}

watch(() => injectStore.injectDetailListByUI, (nowValue, oldValue) => {
    if (nowValue && !isEdit.value) {
      if (![2, 3].includes(injectDetailForm.value.type_detail)) {
        return
      }
      setValDosageQuantity(nowValue)
    }
  },
  { deep: true })

const changeIsManualDrip = (value: boolean) => {
  if (!value) {
    injectDetailForm.value.calculation_fixed_unit = '2'
    injectUtils.computeTime(injectDetailForm.value)
    injectUtils.computeVolume(injectDetailForm.value)
    injectUtils.computeFlowRate(injectDetailForm.value)
  }
}

function createValue(val, done) {
  if (val.length > 0) {
    if (!publicHealthCenterList.value.find((phc: any) => phc.label == val)) {
      publicHealthCenterList.value.push({ value: val, label: val })
    }
    done(val, 'add')
  }
}

async function calculateBookingDate() {

  let interval = itemServiceUnitList.value.find(
    (itemService: any) =>
      itemService.id_item_service_unit ==
      injectDetailForm.value.id_item_service_unit
  )?.interval

  if (interval) {
    injectDetailForm.value.booking.flg_booking = true
  }

  if (injectDetailForm.value.booking.flg_booking == true && interval) {

    const confirm = await mtUtils.confirm(
      'この商品には次回予定日の設定があります。\nこのオーダーに次回予定日を設定しますか？',
      '次回来院の適用', '適用'
    )

    if (!confirm) {
      injectDetailForm.value.booking.flg_booking = false
      return
    }

    interval = (interval.length > 0) ? interval.split(' ') : null

    let cycle, unit
    if (interval && interval.length == 2) {
      cycle = interval[0]
      unit = interval[1]

      if (unit == '日') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(getDateToday(), cycle, '1')
      }
      if (unit == '週') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(getDateToday(), cycle, '2')
      }
      if (unit == '月') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(getDateToday(), cycle, '3')
      }
      if (unit == '年') {
        injectDetailForm.value.booking.date_booking_confirmed = calculateDate(getDateToday(), cycle, '4')
      }
    }
    injectDetailForm.value.booking.id_request = injectDetailForm.value.id_request
    injectDetailForm.value.booking.type_prevention = injectDetailForm.value.type_prevention
  }
}

const val_total_efficacyingredient = ref(assignComputedProperty())

function assignComputedProperty() {
  return computed(() => {
    const val_dosage = injectDetailForm.value.val_dosage_decided ?? 0
    const val_efficacyingredient = selectedUnit.value.val_efficacyingredient ?? 0
    return Number(val_dosage) * Number(val_efficacyingredient)
  })
}

const efficacyPetKg = computed(() => {
  return (
    val_total_efficacyingredient.value /
    Number((injectDetailForm?.value?.val_weight) / 1000)
  )
})

async function autoCalculatedSpecificRange() {

  if (injectDetailForm.value.id_item_service_unit) {
    const requiredWeightRange = dosageFixedDetailList.value.find((dfd) => (Number(dfd.val_weight_min) <= Number(injectDetailForm.value.val_weight) && Number(injectDetailForm.value.val_weight) <= Number(dfd.val_weight_max)
      && dfd.id_item_service_unit == injectDetailForm.value.id_item_service_unit))

    if (requiredWeightRange) {
      const unit = itemServiceUnitList.value.find(
        (itemService: any) =>
          itemService.id_item_service_unit ==
          injectDetailForm.value.id_item_service_unit
      )
      injectDetailForm.value.val_used_portion = Number(requiredWeightRange.quantity)
      injectDetailForm.value.val_dosage_decided = Number(injectDetailForm.value.val_used_portion) / Number(unit.val_liquid ?? 1)
      return
    }
    await mtUtils.alert('指定体重に該当する早見表の値がありませんでした。', '注意')
    return
  }
}

async function selectedTypeMedicine(value: any) {

  dosageVariableRange.value = null

  if (value == 1) {
    await autoCalculatedSpecificRange()
    return
  }

  injectDetailForm.value.val_dosage_decided = 1

  if (value == 2 || value == 3) {
    if (dosageVariableRes.value.length === 0) {
      injectDetailForm.value.type_medicine_dosage = '4'
      return
    }

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
          injectDetailForm.value.val_efficacy_strength_doctor = dosageVariable.val_dose_min
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
          injectDetailForm.value.val_efficacy_strength_doctor = dosageVariable.val_dose_min
        }

        dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
      }

      if (!dosageVariable) {
        await mtUtils.autoCloseAlert(
          '有効成分の範囲が対象動物で見つかりませんでした。\n医薬品データを見直してください。'
        )
      }
    }
  }
}


watch(() => props.injectHeader, (nowValue, oldValue) => {
  if (nowValue) {
    injectDetailForm.value.id_customer = nowValue.id_customer
    injectDetailForm.value.id_pet = nowValue.id_pet
    injectDetailForm.value.id_employee_doctor = nowValue.id_employee_doctor
    injectDetailForm.value.date_start = nowValue.date_start
    injectDetailForm.value.flg_apply_insurance = nowValue.flg_apply_insurance
    injectDetailForm.value.flg_non_charge = nowValue.flg_non_charge
    injectDetailForm.value.rabies.date_tag_issued = nowValue.date_start
    injectDetailForm.value.rabies.id_employee_registered = nowValue.id_employee_doctor
  }

}, {
  deep: true,
  immediate: true
})

watch(() => calculatedEfficacy.value, (nowValue) => {
  if (nowValue) {

    if (!selectedUnit.value.val_efficacyingredient && injectDetailForm.value.type_medicine_dosage == '2') {
      injectDetailForm.value.val_used_portion = calculatedEfficacy.value
      injectDetailForm.value.val_dosage_decided = (Number(injectDetailForm.value.val_used_portion) / Number(selectedUnit?.value.val_liquid)).toFixed(2)
      return
    }

    const ratioWeight = (selectedUnit?.value?.val_efficacyingredient ?? 1) / (selectedUnit?.value?.val_liquid ?? 1)
    injectDetailForm.value.val_used_portion = round((nowValue / ratioWeight), 2)
    injectDetailForm.value.val_dosage_decided = (Number(injectDetailForm?.value?.val_used_portion ?? 1) / (selectedUnit?.value?.val_liquid ?? 1))
    injectDetailForm.value.val_efficacyingredient = Number(injectDetailForm.value.val_dosage_decided ?? 1) * Number(selectedUnit?.value?.val_efficacyingredient ?? 1)

    injectDetailForm.value.val_dosage_decided = injectDetailForm.value.val_dosage_decided.toFixed(3)
    injectDetailForm.value.val_efficacyingredient = injectDetailForm.value.val_efficacyingredient.toFixed(3)
  }
})

function updateValue1() {
  injectDetailForm.value.val_dosage_suggested = percent.value / 100
  toggleDialog1.value = false
}

function getItemServiceUnit(value) {
  return itemServiceUnitList.value.find(
    (itemService: any) => itemService.id_item_service_unit == value
  )
}

const formatNumber = (value: string) => {
  if (injectDetailForm.value.val_dosage_decided) {
    const dosage = String(injectDetailForm?.value?.val_dosage_decided)
    if (dosage.includes('.')) {
      const split = injectDetailForm?.value?.val_dosage_decided?.split('.')
      if (split && split[1] !== '000') {
        if (split[1].length <= 3) injectDetailForm.value.val_dosage_decided = injectDetailForm.value.val_dosage_decided ? parseFloat(injectDetailForm.value.val_dosage_decided).toFixed(split[1].length) : ''
        else injectDetailForm.value.val_dosage_decided = injectDetailForm.value.val_dosage_decided ? parseFloat(injectDetailForm.value.val_dosage_decided).toFixed(3) : ''
      } else injectDetailForm.value.val_dosage_decided = parseFloat(injectDetailForm.value.val_dosage_decided).toFixed(0)
    }
  } else {
    injectDetailForm.value.val_dosage_decided = 0
  }
}


const mapFlgInsurance = async (ISU: any = null, IS: any = null) => {
  let apply_insurance = true
  let today = new Date()
  if (apply_insurance) {
    let today = new Date()
    const pet = useCustomerStore().getCustomer.pets.find((v) => v.id_pet == injectDetailForm.value.id_pet)
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

const unitName = (value) => {
  return useCommonStore().getCommonUnitOptionList.find((v) => v.id_common == value)?.name_common
}
const addressList = ref([])
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

onMounted(async () => {

  if (props.item.id_inject_detail) {
    // IsEdit case
    isEdit.value = true
  }

  addressList.value = useAddressesStore()
    .addresses.filter(
      (address: any) => address.id_customer == props.requestObj.id_customer
    )
    .map((address: any) => ({
      label: ` ${address.zip_code ?? ''} ${address.address_prefecture ?? ''} ${
        address.address_city ?? ''
      } ${address.address_other ?? ''} `,
      value: address.id_address
    }))


  publicHealthCenterList.value = [
    ...useCliCommonStore().getCliCommonPublicHealthCenterList.map(
      (phc: any) => ({
        ...phc,
        label: `${phc.code_func1} ${phc.name_cli_common}`,
        value: `${phc.code_func1} ${phc.name_cli_common}`
      })
    )
  ]

  let process_helper = {
    id_inject_detail: null,
    id_inject_detail_parent: null
  }

  if (!isEdit.value) {
    process_helper.id_inject_detail = `ID_${getDateTimeNow().replace(/-/g, '')}_${Math.floor(Math.random() * 100000)}`
    if (props.item.type_detail == 3) {
      process_helper.id_inject_detail_parent = props.item.process_helper.id_inject_detail
    }
  }

  injectDetailForm.value = {
    ...props.item,
    id_employee_doctor: props.item?.id_employee_doctor,
    id_employee_staff: props.item?.id_employee_staff,
    type_medicine_dosage: 99,
    process_helper: process_helper,
    rabies: {
      ...props.rabies,
      id_employee_registered: !isEdit.value ? defaultEmployee : props.rabies?.id_employee_registered,
      date_tag_issued: !isEdit.value ? getDateToday() : props.rabies?.date_tag_issued,
      license_id: !isEdit.value ? customerStore.getCustomer.pets.find(
        (pet: any) => pet.id_pet == props.item.id_pet
      )?.license_id : props.rabies?.license_id,
      code_city_hall: !isEdit.value ? customerStore.getCustomer.pets.find(
        (pet: any) => pet.id_pet == props.item.id_pet
      )?.code_city_hall : props.rabies?.code_city_hall,
      type_rabies_process: !isEdit.value ? 1 : props.rabies?.type_rabies_process,
      flg_exempt: false,
      type_rabies_round: !isEdit.value ? 1 : props.rabies?.type_rabies_round,
      id_address: !isEdit.value ? addressList.value &&
      addressList.value.length &&
      addressList.value.length > 0
        ? addressList.value[0].value
        : null : props.rabies?.id_address

    },
    num_conduct: 1,
    booking: !isEdit.value ? { ...props.item?.booking, FlgUI: false } : {}
  }

  if (isEdit.value && props.item.booking) {
    injectDetailForm.value.booking = { ...props.item.booking }
    if (injectDetailForm.value.booking && injectDetailForm.value.booking.id_booking) {
      injectDetailForm.value.booking.flg_booking = true
      if (injectDetailForm.value.booking.datetime_booking_confirmed && injectDetailForm.value.booking.datetime_booking_confirmed.split(' ').length > 1) {
        injectDetailForm.value.booking.FlgUI = true
        injectDetailForm.value.booking.date_booking_confirmed = injectDetailForm.value.booking.datetime_booking_confirmed.split(' ')[0]
        injectDetailForm.value.booking.time_booking_confirmed = injectDetailForm.value.booking.datetime_booking_confirmed.split(' ')[1].slice(0, -3)

        if (injectDetailForm.value.booking.time_booking_confirmed == '00:00') {
          injectDetailForm.value.booking.FlgUI = false
        }
      }
    }
  }

  if (injectDetailForm.value.val_liquid > 0) {
    percent.value = 100
  }

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

  await setInjectHeader()
  injectStore.pushIntoInjectDetailListUI(injectDetailForm.value)
  itemServiceResponse = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `/mst/item_services/${props.item.id_item_service}`
  )

  if (itemServiceResponse) {
    flgPlusItem.value = itemServiceResponse.flg_plus_item || itemServiceResponse.flg_merge_price

    if (itemServiceResponse.flg_plus_item && props.item.type_detail != 3) {
      injectDetailForm.value.type_detail = 2
    }

    if (!isEdit.value) {
      injectDetailForm.value.flg_apply_insurance = await mapFlgInsurance(null, itemServiceResponse)
    }


    if (itemServiceResponse.flg_merge_price && props.item.type_detail != 3) {
      injectDetailForm.value.type_detail = 3
    }


    const optionPlusItem = itemServiceResponse.option_list.find((option) => option.id_item_service_child?.flg_merge_price)
    if (optionPlusItem) {
      isEffortAvailable.value = {
        ...optionPlusItem,
        process_helper: injectDetailForm.value.process_helper
      }
      props.callBack(isEffortAvailable.value)
    }

    if (itemServiceResponse.item_service_unit_list) {
      if (props.item.showUnit) {
        await mtUtils.smallPopup(OptionItemServiceUnitModalUI, {
          itemServiceUnitList: itemServiceResponse.item_service_unit_list,
          selectedUnit: (value) => {
            injectDetailForm.value = {
              ...injectDetailForm.value,
              ...value
            }
            useInjectStore().appendToItemServiceList(value)
          },
          class: 'inject-detail-hover'
        })
      }

      if (itemServiceResponse.medicine) {
        medicineObj.value = itemServiceResponse.medicine

      }

      if (itemServiceResponse.dosage_fixed_list) {
        itemServiceResponse.dosage_fixed_list.map((dosageFixed) => {
          dosageFixed.dosage_fixed_detail_list.map((dosageFixedDetail) => {
            const temp = { ...dosageFixed, ...dosageFixedDetail }
            dosageFixedDetailList.value.push(temp)
          })
        })
      }

      itemServiceUnitList.value = itemServiceResponse.item_service_unit_list
      if (!isEdit.value) {
        await calculateBookingDate()
      }
      computeValSuggested(Number(injectDetailForm.value.val_liquid))

      const today = new Date()


      itemServiceResponse.item_service_unit_list.map((items, idx) => {
        const price = items.price_list.find((p) =>
          new Date(p.date_start) <= today && today <= new Date(p.date_end))
        selectedISU.value.push({
          checked: idx === 0,
          id_item_service_unit: items.id_item_service_unit,
          label: items.name_service_item_unit, value: items.id_item_service_unit,
          unitPrice: Number(price?.price),
          val_dosage_decided: idx === 0 ? 1 : null,
          id_cm_unit_medicine: items.id_cm_unit_medicine,
          val_efficacyingredient: 1
        })
      })

      selectedUnit.value = itemServiceResponse.item_service_unit_list.find((item) => item.id_item_service_unit == props.item.id_item_service_unit)

    }


    if (itemServiceResponse.dosage_variable_list) {
      dosageVariableRes.value = itemServiceResponse.dosage_variable_list
    }
  }

  if (!injectDetailForm.value.id_inject_detail) {
    injectDetailForm.value.val_weight = useInjectStore().getValWeight
    injectDetailForm.value.id_employee_staff = props.requestObj.id_employee_staff
    if (!injectDetailForm.value.id_employee_doctor) {
      injectDetailForm.value.id_employee_doctor = useInjectStore().getCurrentSelectedIdEmployeeDoctor
    }
  }

  if (medicineObj.value && medicineObj.value.flg_drip_carrier) {
    injectDetailForm.value.speed_process =
      (injectDetailForm.value.val_weight / 1000 ?? 1) * 2
    injectDetailForm.value.type_speed_unit = '1'
    injectDetailForm.value.type_process_time = '1'
    injectDetailForm.value.time_process = 1
    injectDetailForm.value.calculation_fixed_unit = '2'
    injectUtils.computeTime(injectDetailForm.value)
  }


  if (medicineObj.value && !medicineObj.value.flg_drip_carrier) {
    if (!injectDetailForm.value.id_inject_detail) {
      injectDetailForm.value.val_used_portion = props.item.val_liquid
    }

    if (medicineObj.value.flg_dosage_fixed
      && injectDetailForm.value.type_medicine_dosage == 99) {
      injectDetailForm.value.type_medicine_dosage = '1'
      await selectedTypeMedicine(1)
      const requiredWeightRange = dosageFixedDetailList.value.find((dfd) => (Number(dfd.val_weight_min) <= Number(injectDetailForm.value.val_weight) && Number(injectDetailForm.value.val_weight) <= Number(dfd.val_weight_max)
        && dfd.id_item_service_unit == injectDetailForm.value.id_item_service_unit))

      if (!requiredWeightRange) {
        injectDetailForm.value.type_medicine_dosage = 99
      }

    }

    if (
      medicineObj.value.flg_dosage_variable &&
      injectDetailForm.value.type_medicine_dosage == 99
    ) {
      injectDetailForm.value.type_medicine_dosage = '2'
      await selectedTypeMedicine(2)
    }

    if (
      medicineObj.value.flg_dosage_per_head &&
      injectDetailForm.value.type_medicine_dosage == 99
    ) {
      injectDetailForm.value.type_medicine_dosage = '3'
      await selectedTypeMedicine(3)
    }

    if (
      medicineObj.value.flg_dosage_quantity &&
      injectDetailForm.value.type_medicine_dosage == 99
    ) {
      injectDetailForm.value.type_medicine_dosage = '4'
    }
  }

  if (medicineObj.value && !props.item.id_inject_detail) {
    injectDetailForm.value.name_medicine_format =
      useCommonStore().getCommonTypeMedicineFormatOptionList.find(
        (v: any) => v.id_common == medicineObj.value.id_cm_med_format
      )?.name_common

    if (medicineObj.valye &&
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

    if (
      !(
        medicineObj.value.flg_dosage_quantity ||
        medicineObj.value.flg_dosage_variable ||
        medicineObj.value.flg_dosage_fixed ||
        medicineObj.value.flg_dosage_per_head
      ) && injectDetailForm.value.type_detail == 1
    ) {
      await mtUtils.autoCloseAlert(
        '投与薬の登録情報が不正です。確認してください。'
      )
      removeItem()
      return
    }

    if (
      injectDetailForm.value.type_detail == 1 &&
      !medicineObj.value.id_cm_animal.find(
        (comObj: any) =>
          comObj.id_cm_animal == customerStore.getPet.id_cm_animal &&
          comObj.status == 1
      )
    ) {
      await mtUtils.autoCloseAlert('医薬品の想定対象外の動物種です。')
      return
    }
  }
  formatNumber()
})

onUnmounted(() => {
  event_bus.off('isu_child')
})
</script>

<template>
  <div>
    <div class="flex justify-between q-pa-sm light-shot-blue">
      <div>
        <div class="title2 text-grey-900 bold q-mb-xs">
          {{ item.name_inject_display }}
          <q-icon
            class="cursor-pointer q-pl-sm"
            flat
            name="quiz" round
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
        <q-btn
          class="q-mt-sm"
          color="primary"
          outline
          size="11px"
          unelevated
          @click="injectDetailForm.show = !injectDetailForm.show"
        >{{ injectDetailForm.show ? '閉じる' : '開く' }}
        </q-btn
        >
      </div>
    </div>
    <div v-if="flgPlusItem">
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-6">
          <MtInputForm
            v-model="injectDetailForm.memo_etc1"
            autogrow
            label="服用メモ"
            type="text"
          >
            <template #append>
              <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(51)" />
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
              <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(52)" />
            </template>
          </MtInputForm>
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-sm " style="flex-direction: column">
        <div v-for="item in selectedISU" :key="selectedISU.value" class="row border-bottom">
          <div class="col-6">
            <MtFormCheckBox
              v-model:checked="item.checked"
              :label="item.label"
              class="q-mr-md"
              @update:checked="()=>{
                setValDosageQuantity(injectStore.injectDetailListByUI)
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
      <div class="row q-col-gutter-md q-mb-md justify-end">
        <q-btn
          flat
          unelevated
          @click="removeItem(injectDetailForm.id_item_service)"
        >
          <q-icon color="danger" name="delete"></q-icon>
          削除
        </q-btn>
      </div>
    </div>
    <div v-if="injectDetailForm.show && !flgPlusItem" class="q-mt-sm">
      <div
        v-if="medicineObj.flg_drip_carrier"
        class="q-mx-md drip-box q-pa-sm q-mb-md"
      >
        <div class="row items-center">
          <span class="text-white pill-title title4">点滴指示</span>
        </div>
        <div class="row q-col-gutter-md q-my-sm">
          <div class="col-1 q-mr-md"></div>
          <div class="col-5">
            <InputEmployeeOptGroup
              v-model:selected="injectDetailForm.id_employee_doctor"
              department-selected=""
              label="担当医 *"
              required
              show-select-default-employee
              type-occupation="doctor"
            />
          </div>
          <div class="col-5">
            <InputEmployeeOptGroup
              v-model:selected="injectDetailForm.id_employee_staff"
              department-selected=""
              label="担当者"
              show-select-default-employee
            />
          </div>
          <div v-if="false" class="col-3">
            <MtFormInputNumber
              v-model:value="injectDetailForm.num_conduct"
              :decimal-size="1"
              label="回数指定"
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
              :disable="!isManualDrip && injectDetailForm.calculation_fixed_unit == '1'"
              label="投与時間"
              type="number"
              @updatedValue="
                () => {
                  if (!isManualDrip) {
                    injectUtils.computeVolume(injectDetailForm)
                    injectUtils.computeFlowRate(injectDetailForm)
                  }
                }
              "
            />
          </div>
          <MtFormRadiobtn
            v-model="injectDetailForm.type_process_time"
            class="q-pr-md"
            label="時間"
            val="1"
            @update:selected="
              (value) => {
                if (value == '1') {
                  injectDetailForm.time_process =
                    injectDetailForm.time_process / 60
                }
                // injectUtils.computeVolume(injectDetailForm)
              }
            "
          />
          <MtFormRadiobtn
            v-model="injectDetailForm.type_process_time"
            class="q-pr-md"
            label="分間"
            val="2"
            @update:selected="
              (value) => {
                if (value == '2') {
                  injectDetailForm.time_process =
                    injectDetailForm.time_process * 60
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
              :disable="!isManualDrip && injectDetailForm.calculation_fixed_unit == '2'"
              label="流量速度"
              type="number"
              @updatedValue="
                () => {
                  if (!isManualDrip) {
                    injectUtils.computeTime(injectDetailForm)
                    injectUtils.computeVolume(injectDetailForm)
                  }
                }
              "
            />
          </div>
          <MtFormRadiobtn
            v-model="injectDetailForm.type_speed_unit"
            class="q-pr-md"
            label="mL/時"
            val="1"
            @update:selected="
              (value) => {
                if (value == '1')
                  injectDetailForm.speed_process =
                    injectDetailForm.speed_process / 60
                // injectUtils.computeVolume(injectDetailForm)
              }
            "
          />
          <MtFormRadiobtn
            v-model="injectDetailForm.type_speed_unit"
            class="q-pr-md"
            label="mL/分"
            val="2"
            @update:selected="
              (value) => {
                if (value == '2')
                  injectDetailForm.speed_process =
                    injectDetailForm.speed_process * 60
                // injectUtils.computeVolume(injectDetailForm)
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
              :disable="!isManualDrip && injectDetailForm.calculation_fixed_unit == '3'"
              class="field-right-text assort-drip-text-1"
              label="投与量"
              mode="dosage"
              @update:value="
                (value) => {
                  if (!isManualDrip) {
                    injectUtils.computeTime(injectDetailForm)
                    injectUtils.computeFlowRate(injectDetailForm)
                  }
                }
              "
            />
          </div>
          <div class="col">
            <MtFormCheckBox
              v-model:checked="isManualDrip"
              class="q-pr-md"
              label="Is manual drip?"
              @update:checked="changeIsManualDrip"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12">
            <MtInputForm
              v-model="injectDetailForm.memo_inject"
              autogrow
              label="注射・点滴 全体メモ"
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
          <div class="col-2 q-ml-md">
            <q-btn
              flat
              unelevated
              @click="removeItem(injectDetailForm.id_item_service)"
            >
              <q-icon color="danger" name="delete"></q-icon>
              削除
            </q-btn>
          </div>
        </div>
      </div>
      <div v-if="!medicineObj.flg_drip_carrier" class="q-mx-md q-pt-sm">
        <div class="row q-col-gutter-md q-pt-xs">
          <div class="col-auto">投与量計算 *</div>
          <div class="col-auto q-pt-sm">
            <MtFormRadiobtn
              v-if="medicineObj.flg_dosage_fixed"
              v-model="injectDetailForm.type_medicine_dosage"
              class="q-pr-md"
              label="早見表"
              val="1"
              @update:selected="selectedTypeMedicine"
            />
            <MtFormRadiobtn
              v-if="medicineObj.flg_dosage_variable"
              v-model="injectDetailForm.type_medicine_dosage"
              :disable="isEdit"
              class="q-pr-md"
              label="可変量/kg"
              val="2"
              @update:selected="selectedTypeMedicine"
            />
            <MtFormRadiobtn
              v-if="medicineObj.flg_dosage_per_head"
              v-model="injectDetailForm.type_medicine_dosage"
              :disable="isEdit"
              class="q-pr-md"
              label="可変量/head"
              val="3"
              @update:selected="selectedTypeMedicine"
            />
            <MtFormRadiobtn
              v-if="medicineObj.flg_dosage_quantity"
              v-model="injectDetailForm.type_medicine_dosage"
              :disable="isEdit"
              label="数量指定"
              val="4"
              @update:selected="selectedTypeMedicine"
            />
          </div>
        </div>
        <div
          v-if="
            dosageVariableRange &&
            (injectDetailForm.type_medicine_dosage == 2 ||
              injectDetailForm.type_medicine_dosage == 3)
          "
        >
          <div class="row">
            <MtFormInputNumber
              v-if="injectDetailForm.val_dosage_decided && !selectedUnit?.val_efficacyingredient && injectDetailForm.val_weight"
              v-model:value="injectDetailForm.val_efficacy_strength_doctor"
              :decimal-size="3"
              class="col-2 field-right-text doctor-amount-icon"
              label="投与レート"
              mode="dosage"
            />
            <MtFormInputNumber
              v-else
              v-model:value="injectDetailForm.val_efficacy_strength_doctor"
              :decimal-size="1"
              class="col-2 field-right-text doctor-amount-icon"
              label="投与成分量"
              mode="dosage"
            />
            <div
              v-if="efficacyCalculation && selectedUnit.val_efficacyingredient"
              class="flex calculation-process bi-grid-3x2-gap"
            >
              <q-icon class="q-pt-xs q-mr-sm" name="info" />
              {{ '投与1回あたりの有効成分量： ' + efficacyCalculation }}
            </div>
            <div
              v-if="injectDetailForm.val_dosage_decided && !selectedUnit?.val_efficacyingredient && injectDetailForm.val_weight"
              class="flex calculation-process bi-grid-3x2-gap"
            >
              <q-icon class="q-pt-xs q-mr-sm" name="info" />
              投与レートから計算
            </div>
          </div>
          <div class="row q-my-sm">
            <div
              v-if="injectDetailForm.val_dosage_decided && !selectedUnit?.val_efficacyingredient && injectDetailForm.val_weight"
              class="dosage-variable-range">
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
          <div class="col-4">
            <MtFormInputNumber
              v-model:value="injectDetailForm.num_conduct"
              :decimal-size="1"
              autogrow
              label="回数指定"
              mode="dosage"
            />
          </div>
          <div class="col-4">
            <MtInputForm
              v-model="injectDetailForm.lot_number1"
              label="ロット番号 1"
              type="text"
            />
          </div>
          <div
            v-if="
              props.item &&
              props.item.name_category2 &&
              !props.item.name_category2.includes('MD10_1')
            "
            class="col-4"
          >
            <MtInputForm
              v-model="injectDetailForm.lot_number2"
              autogrow
              label="ロット番号 2"
              type="text"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
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
            />
          </div>
        </div>
        <!--狂犬病ワクチン/Rabies-->
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
              @update:date="
                (value) => {
                  injectDetailForm.date_start = value
                }
              "
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
              v-model="injectDetailForm.rabies.code_city_hall"
              :options="publicHealthCenterList"
              bg-color="white"
              class="clear-icon"
              clearable
              color="blue"
              dense
              emit-value
              label="保健所CD"
              use-input
              @update:modelValue="
                (value) => {
                  if (value) {
                    injectDetailForm.rabies.code_city_hall = value
                  }
                }
              "
              @new-value="createValue"
            ></q-select>
          </div>
          <div class="col-4">
            <InputEmployeeOptGroup
              v-model:selected="injectDetailForm.rabies.id_employee_registered"
              label="登録担当者ID"
            />
          </div>
          <div class="col-4">
            <MtFormPullDown
              v-model:selected="injectDetailForm.rabies.type_rabies_process"
              :options="typeRabiesProcess"
              label="狂犬病申請処理区分"
            ></MtFormPullDown>
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
              <div v-if="injectDetailForm.rabies.flg_exempt" class="col-12">
                <MtInputForm
                  v-model="injectDetailForm.rabies.memo_exemption_rabies"
                  autogrow
                  label="猶予理由"
                  type="text"
                />
              </div>
            </div>
          </div> -->
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12">
            <MtInputForm
              v-model="injectDetailForm.memo_inject"
              autogrow
              label="注射・点滴 個別メモ"
              type="text"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="injectDetailForm.flg_non_charge"
              label="会計対象外"
            />
          </div>
          <div class="col-6">
            <MtFormCheckBox v-model:checked="injectDetailForm.flg_apply_insurance" label="保険適用" />
          </div>
          <div class="col-2 q-ml-md">
            <q-btn
              flat
              unelevated
              @click="removeItem(injectDetailForm.id_item_service)"
            >
              <q-icon color="danger" name="delete"></q-icon>
              削除
            </q-btn>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md justify-between">
          <div class="col-3">
            <MtFormCheckBox v-model:checked="injectDetailForm.booking.flg_booking" label="次回予定の作成"
                            @update:checked="calculateBookingDate(injectDetailForm.booking)" />
          </div>

          <template v-if="injectDetailForm.booking.flg_booking">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="injectDetailForm.booking.date_booking_confirmed"
                label="予定日"
              />
            </div>
            <div class="col-3 text-center">
              <MtInputForm
                v-model="injectDetailForm.booking.FlgUI"
                :items="[{ label: '時刻' }]"
                type="checkbox"
              />
            </div>
            <div v-if="injectDetailForm.booking.FlgUI" class="col-3">
              <MtFormPullDown
                v-model:selected="injectDetailForm.booking.time_booking_confirmed"
                :options="timeHourMinute"
                label="時：分"
              />
            </div>
          </template>
        </div>
      </div>

      <div class="assort-container full-width q-mt-md">
        <div class="q-mb-sm">
          <h4 class="text-white bg-grey-600 title4">投与薬明細</h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            以下の内容で注射 / 点滴します。
          </span>
        </div>
        <div
          v-if="medicineObj.flg_drip_carrier"
          class="row q-mb-xs flex full-width"
        >
          <div class="col-9 col-sm-9 col-md-9 flex item-name column">
            {{ injectDetailForm.name_inject_display }}
            ( {{ injectDetailForm.val_liquid }} mL )
            <span class="caption1 regular total-volume q-mt-sm q-ml-sm">
              全量： {{ roundZeroAfterPoint(injectDetailForm.val_liquid) }} mL
            </span>
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
                v-model:value="injectDetailForm.val_dosage_decided"
                :decimal-size="4"
                class="field-right-text assort-drip-text"
                label="売上量"
                mode="dosage"
                readonly
              />
            </div>
          </div>
        </div>
        <div
          v-if="!medicineObj.flg_drip_carrier"
          class="row q-mb-xs flex full-width"
        >
          <div class="col-9 col-sm-9 col-md-9 flex item-name column">
            {{ injectDetailForm.name_inject_display }}
            <span v-if="selectedUnit?.val_efficacyingredient && Number(selectedUnit?.val_efficacyingredient) > 0"
                  class="caption1 regular total-volume q-mt-xs q-ml-sm">
              力価：{{ roundZeroAfterPoint(selectedUnit?.val_efficacyingredient) }}
              {{
                useCommonStore().getCommonUnitOptionList.find(
                  (v) => v.id_common == injectDetailForm.id_cm_unit_medicine
                )?.name_common
              }}
            </span>
            <span v-if="injectDetailForm?.val_liquid > 0" class="caption1 regular total-volume q-ml-sm">
              全量： {{ roundZeroAfterPoint(injectDetailForm.val_liquid) }} mL
            </span>
            <span v-else class="caption1 regular total-volume q-ml-sm">
              登録なし
            </span>

            <div
              v-if="injectDetailForm.val_dosage_decided && selectedUnit?.val_efficacyingredient && injectDetailForm.val_weight && Number(efficacyPetKg.toFixed(2)) !== 0 "
              class="dosage-variable-range"
            >
              処方明細の総有効成分量：
              <span class="q-ml-sm">
                （
                {{
                  Number(efficacyPetKg.toFixed(2)) === 0 ? roundZeroAfterPoint(efficacyPetKg) + ` ${unitName(selectedUnit.id_cm_unit_medicine)} / Kg` :
                    roundZeroAfterPoint(efficacyPetKg.toFixed(2)) + ` ${unitName(selectedUnit.id_cm_unit_medicine)} / Kg`
                }}）
              </span>
            </div>
            <div
              v-if="injectDetailForm.val_dosage_decided && !selectedUnit?.val_efficacyingredient && injectDetailForm.val_weight"
              class="dosage-variable-range"
            >
              <span class="q-ml-sm">
                （ {{ `${Number(injectDetailForm.val_weight) / 1000} * ${roundZeroAfterPoint(injectDetailForm.val_efficacy_strength_doctor)} = ${roundZeroAfterPoint(roundZeroAfterPoint(Number(injectDetailForm.val_weight) / 1000) * Number(injectDetailForm.val_efficacy_strength_doctor))}`
                }}  ）
              </span>
            </div>
          </div>
          <div class="col-3 flex ">
            <div class="c-grid-w">
              <MtFormInputNumber
                v-model:value="injectDetailForm.val_dosage_decided"
                :decimal-size="4"
                label="売上量"
                @blur="formatNumber('val_dosage_decided')"
              />
              <div>
                {{ unitName(getItemServiceUnit(injectDetailForm.id_item_service_unit)?.id_common) }}
              </div>
              総売上量 : {{ parseFloat((injectDetailForm.num_conduct * injectDetailForm.val_dosage_decided)).toFixed(3)
              }}
              {{ unitName(getItemServiceUnit(injectDetailForm.id_item_service_unit)?.id_common) }}
            </div>
            <div class="c-grid-w">
              <MtFormInputNumber
                v-model:value="injectDetailForm.val_used_portion"
                :decimal-size="4"
                label="1回投与量"
                mode="dosage"
                @blur="updatePortion"
              />
              <div>
                ml
              </div>
              総投与量 : {{ parseFloat((injectDetailForm.num_conduct * injectDetailForm.val_used_portion).toFixed(2)) }}
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
                v-model="percent"
                :menu-self="'center start'"
                :options="percentOption"
                label="drip unit"
                @update:selected="
                  (value) => {
                    if (!medicineObj.flg_drip_carrier) {
                      injectDetailForm.val_used_portion =
                        (injectDetailForm.val_liquid * value) / 100
                      injectDetailForm.val_dosage_decided = value / 100
                      return
                    }
                    injectDetailForm.val_dosage_decided = value / 100
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
  </div>

  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    :data="injectDetailForm"
    :options="memoTemplates"
    :single-option="true"
    modelTitle="注射・点滴"
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

.ml-for-portion::after {
  content: 'ml';
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

.dosage-variable-range {
  color: var(--Status-Danger, #be0123);
  font-size: 13px;
  font-style: normal;
  font-weight: 400;
  line-height: 14px;
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
