<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import { decimalToFraction, roundZeroAfterPoint } from '@/utils/aahUtils'

// Stores
import useEmployeeStore from '@/stores/employees'
import useDoseStore from '@/stores/dose-frequencies'
import useCommonStore from '@/stores/common'
import { getTypeDosageUI } from '../../pages/request/prescription/prescriptionUtils'

// Lazy-loaded Components
const UpdPrescriptionDetailModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdPrescriptionDetailModal.vue')
)
const UpdateGroupTitleModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdateGroupTitleModal.vue')
)

// Store Instances
const employeeStore = useEmployeeStore()
const doseStore = useDoseStore()

const props = defineProps({
  data: Object,
  prescription: Object,
  left: { type: Boolean, default: false }
})

const employeeName = (value: string) => {
  const employee = employeeStore.getEmployeeListWOF.find(
    (v) => v.value === value
  )
  if (employee) return employee.label
  return ''
}
const getISU = (value, list) => {
  return list?.find((is: any) => is.id_item_service_unit == value)
}


const fullCircles = (value: any) => {
  return parseInt(Number(value))
}

const partialCircle = (value: any) => {
  // Fractional part of the value represents the partial circle
  let temValue = null
  temValue = value.toString()
  if (
    temValue &&
    temValue.includes('.') &&
    temValue.split('.').length &&
    temValue.split('.').length >= 2
  ) {
    const fractionalPart = parseFloat(`0.${temValue.split('.')[1]}`)
    return fractionalPart > 0 ? fractionalPart : 0 // Ensure there is a fractional part
  }
}

function getFractionForm(totalDosage: any, row: any) {
  let full = fullCircles(totalDosage)
  let partial = partialCircle(totalDosage)
  return `${full ? full : ''} ${full && partial ? ' + ' : ''}   ${
    partial ? decimalToFraction(partial) : ''
  }`
}

function customRound(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.90) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.10) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}

function customRoundV1(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.80) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.10) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}


function customRoundV2(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.75) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.10) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return number
  }
}

const getQuanityDosage = (value: any) =>
  doseStore?.getAllDoses?.find((item: any) => item.value == value)
    ?.quantity_dose ?? 1

const calculatedTotalNumber = (prescriptionDetail: any) => {
  return (
    parseFloat(Number(prescriptionDetail.total_days_dose)) * (Number(getQuanityDosage(prescriptionDetail.id_dosage_frequency)) ?? 1)
  )
}
const getFraction = (totalDosage, row) => {

  const totalPill = Number(totalDosage) * Number(row)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {

    if (parseInt(totalPill) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
  return ''
}

const getWholeDosageFraction = (item, PA) => {
  let temp_dosage = ''
  if (PA.val_dosage_decided && Number(PA.val_dosage_decided) > 0) {
    if (parseInt(Number(calculatedTotalNumber(item) * PA.val_dosage_decided)) > 0) {
      temp_dosage += parseInt(customRoundV1(Number(calculatedTotalNumber(item) * Number(PA.val_dosage_decided))))
    }

    temp_dosage += getFraction(calculatedTotalNumber(item), PA.val_dosage_decided)

    temp_dosage = `( ${temp_dosage} ${item.name_medicine_format} )`
  }
  return temp_dosage
}

const getWholeAmount = (item, PA) => {
  let temp_dosage = ''
  if (PA.val_dosage_decided && Number(PA.val_dosage_decided) > 0) {
    if (parseInt(Number(calculatedTotalNumber(item) * PA.val_dosage_decided)) > 0) {
      temp_dosage += customRoundV2(Number(calculatedTotalNumber(item) * Number(PA.val_dosage_decided)))
    }
  }

  return Number(temp_dosage).toFixed(1)
}


function getUnit(unitId: any) {
  if (typeof unitId == 'string') return unitId
  return (
    useCommonStore().getCommonUnitOptionList.find(
      (unit) => unit.id_common == unitId
    )?.name_common ?? ''
  )
}

function getUnitFromAssort(itemService: any, id_item_service_unit) {

  if (!itemService) return

  const itemServiceUnit = itemService.item_service_unit_list.find((isu) => isu.id_service_item_unit = id_item_service_unit)
  if (!itemServiceUnit) return

  return (
    useCommonStore().getCommonUnitOptionList.find(
      (unit) => unit.id_common == itemServiceUnit.id_common
    )?.name_common ?? ''
  )
}


const updPrescriptionDetailGroup = async (
  prescription: any,
  prescriptionDetail: any
) => {
  await mtUtils.smallPopup(UpdateGroupTitleModal, {
    prescription: prescription,
    prescriptionDetail: prescriptionDetail
  })
  event_bus.emit('reloadRight', true)
}

const updPrescriptionDetailModal = async (
  prescription: any,
  prescriptionDetail: any
) => {
  const flgPlusItem = prescriptionDetail?.type_detail == 2 || prescriptionDetail?.type_detail == 3
  
  if (flgPlusItem) {
    await mtUtils.smallPopup(UpdPrescriptionDetailModal, {
      prescriptionObj: prescription,
      prescriptionDetail: prescriptionDetail,
      requestObj: props.request,
      isLeft: props.left
    })
    event_bus.emit('reloadRight', true)
    return
  }
  
  
  await mtUtils.mediumPopup(UpdPrescriptionDetailModal, {
    prescriptionObj: prescription,
    prescriptionDetail: prescriptionDetail,
    requestObj: props.request,
    isLeft: props.left
  })
  event_bus.emit('reloadRight', true)
}

</script>

<template>
  <template v-if="props.data">
    <div
      class="item_divier_prescription"
      :class="{
            'cancel-notification-box': props.data.flg_cancel,
            'q-ml-sm': (props.data.type_detail == 1 && props.data.id_prescription_detail_ref)
          }">
      <!--Plus Item Case-->
      <div
        v-if="props.data.type_detail == 2"
        @click="updPrescriptionDetailModal(props.prescription, props.data)"
        class="body2 regular ellipsis q-pb-xs"
      >
        <div>
          <span
            v-if="props.data?.flg_non_charge"
            class="field-label-free-color-small bg-accent-900 text-white"
          >
            会計外
          </span>
          <span
            v-if="props.data?.flg_hospitalization_usage"
            class="field-label-free-color-small bg-emerald-green text-dark-emerald-green"
          >
            院
          </span>
          <q-icon
            v-if="props.data.flg_apply_insurance"
            name="health_and_safety"
            class="text-light-blue q-mr-xs"
          />
          <span class="q-mr-sm">
            {{ props.data.name_prescription_display }}
          </span>
        </div>
        <div v-for="assort in props.data.prescription_detail_assort_list" class="flex q-mr-xs caption2 text-grey-700">
          {{ getISU(assort.id_item_service_unit, props.data.item_service?.item_service_unit_list)?.name_service_item_unit }}
          <div class="q-ml-md">{{ roundZeroAfterPoint(assort.val_dosage_decided) }} 個</div>
        </div>
      </div>
      <!--Normal PD Case-->
      <div
        v-else-if="props.data.flg_group_title != '1'"
        class="body2 regular text-grey-900"
        @click="updPrescriptionDetailModal(props.prescription, props.data)"
      >
        <div class="ellipsis prescription-name" :class="{ left: left }">
          <span
            v-if="props.data?.flg_non_charge"
            class="field-label-free-color-small bg-accent-900 text-white"
          >
            会計外
          </span>
          <span
            v-if="props.data?.flg_risk_animal || props.data?.flg_overdosing"
            class="field-label-free-color-small bg-darkred text-white"
          >
            R
          </span>
          <span
            v-if="props.data?.flg_hospitalization_usage"
            class="field-label-free-color-small bg-emerald-green text-dark-emerald-green"
          >
            院
          </span>
          <q-icon
                v-if="props.data.flg_apply_insurance"
                name="health_and_safety"
                class="text-light-blue q-mr-xs"
              />
          <span class="text-black">{{ props.data.name_prescription_display }}</span>
          <span class="q-ml-sm text-grey-700">
            <small>{{ props.data.name_category1 }}</small>
          </span>
          <q-icon name="arrow_right" />
          <span class="text-grey-700">
            <small>{{ props.data.name_category2 }}</small>
          </span>
        </div>
        <!--Medicine 錠の場合-->
        <div v-for="assort in props.data.prescription_detail_assort_list" v-if="props.data.name_medicine_format == '錠'"
             :key="assort.id_prescription_detail_assort"
             :class="{ left: left }" class="ellipsis widthToTruncate body2 regular">
          <small>
            {{ getFractionForm(assort.val_dosage_decided) }}
            {{ getUnit(props.data.name_medicine_format) }}
          </small>
          <small class="q-mx-xs">
            {{
              doseStore?.getAllDoses?.find(
                (dose) => props.data?.id_dosage_frequency == dose?.value
              )?.short_name
            }}
          </small>
          <small class="q-ml-md">
            総量：{{ getWholeDosageFraction(props.data, assort) }}
          </small>
        </div>
        <!--Medicine 錠でない場合-->
        <div v-for="assort in props.data.prescription_detail_assort_list" v-if="props.data.name_medicine_format != '錠'"
             :key="assort.id_prescription_detail_assort"
             :class="{ left: left }" class="ellipsis widthToTruncate body2 regular">
          <small>
            {{ roundZeroAfterPoint(assort.val_dosage_decided) }}
            {{ getUnitFromAssort(props.data.item_service, assort.id_item_service_unit) }}
          </small>
          <small class="q-mx-md">
            {{
              doseStore?.getAllDoses?.find(
                (dose) => props.data?.id_dosage_frequency == dose?.value
              )?.short_name
            }}
          </small>
          <small v-if="props.data.type_detail == 1" class="q-ml-md">
            総量：{{ getWholeAmount(props.data, assort) }}
            {{ getUnitFromAssort(props.data.item_service, assort.id_item_service_unit) }}
          </small>
        </div>
        <div v-if="props.data.type_detail == 1" :class="{ left: left }" class="ellipsis widthToTruncate body2 regular">
          <small v-if="props.data.id_employee_staff" class="pocket-staff-label">
            {{
              props.data.id_employee_staff
                ? employeeName(props.data.id_employee_staff)
                : ''
            }}
          </small>
          <small> {{ props.data.date_start + ' ~ ' }} </small>
          <small v-if="props.data.total_days_dose">
            ( {{ roundZeroAfterPoint(props.data.total_days_dose) }} {{ getTypeDosageUI(props.data) }} )
          </small>
          <small class="q-mx-xs">
            {{ '/ ' + props.data?.memo_dose ? props.data.memo_dose : '' }}
            {{ props.data?.memo_alert ? props.data.memo_alert : '' }}
          </small>
        </div>
      </div>
      <div
        v-else
        class="prescription_group"
        :class="props.data.flg_cancel ? 'cancel-notification-box' : ''"
        @click="updPrescriptionDetailGroup(props.data, props.data)"
      >
        <small class="label q-mr-sm">一包化</small>
        {{ props.data.name_prescription_display }}
      </div>
    </div>
    <div
      @click.stop="updPrescriptionDetailModal(props.data, props.data.effort_item)"
      class="item_divier_prescription no-left-border q-ml-lg body2 regular ellipsis q-pb-xs"
      v-if="props.data.effort_item"
    >
      <div class="flex justify-between">
        <span class="q-mr-sm">
          {{ props?.data?.effort_item.name_prescription_display }}
        </span>
      </div>
      <div v-for="assort in props?.data?.effort_item?.prescription_detail_assort_list"
           class="flex q-mr-xs caption2 text-grey-700">
        {{ getISU(assort.id_item_service_unit, props?.data?.effort_item?.item_service?.item_service_unit_list)?.name_service_item_unit
        }}
        <div class="q-ml-md">{{ roundZeroAfterPoint(assort.val_dosage_decided) }} 個</div>
      </div>
    </div>
  </template>
</template>
<style lang="scss" scoped>
.item_divier_prescription {
  cursor: pointer;
  border-left: 5px solid #beccee;
  &:hover {
    background-color: rgba(236, 248, 255, 0.7);
  }

  &:active {
    background-color: rgba(236, 248, 255, 0.8);
  }

  &:focus {
    background-color: rgba(236, 248, 255, 0.9);
  }

  &.no-left-border {
    border-left: 1px dotted rgb(227 227 227);
  }

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px !important;
  .prescription-name {
    max-width: 30vw;
    @media screen and (max-width: 1440px) {
      max-width: 22vw;
    }
    &.left {
      @media screen and (max-width: 1440px) {
        max-width: 25vw;
      }
    }
    // @media screen and (max-width: 1280px) {
    //   max-width: 15vw;
    // }
    // @media screen and (max-width: 960px) {
    //   max-width: 12vw;
    // }
  }
}
.widthToTruncate {
  // max-width: 270px;
  max-width: 30vw;
  @media screen and (max-width: 1100px) {
    max-width: 30vw;
  }
  @media screen and (max-width: 1040px) {
    // For IPAD
    max-width: 25vw;
  }
  @media screen and (max-width: 900px) {
    // For IPAD
    max-width: 22vw;
  }
  @media screen and (max-width: 430px) {
    // For Phone
    max-width: 32vw;
  }
  &.left {
    @media screen and (max-width: 1440px) {
      max-width: 25vw;
    }
  }
}
.prescription-header-btn {
  background-color: #e9efff;
  text-align: center;
  padding: 0px 10px;
}
.prescription-header-btn-span {
  height: 20px;
  display: flex;
  align-items: center;
  padding: 2px 8px;
}

.prescription_group {
  background-color: #deefff;
  font-size: 13px;
  text-align: center;
}
.prescription_group .label {
  color: #8baac5;
  font-weight: bold;
}

.divider {
      width: 100%;
      padding: 5px 0 5px;
      background: $grey-100;
  }
  .pocket-staff-label {
    background: #dddddd;
    color:#111;
    padding: 0 6px ;
    margin: 2px 3px 2px 0px;
  }
</style>
