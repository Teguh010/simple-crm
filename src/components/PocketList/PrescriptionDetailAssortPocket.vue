<script lang="ts" setup>

import { computed, onMounted, ref } from 'vue'
import usePrescriptionStore from '@/stores/prescription'
import { decimalToFraction, roundFloat, roundZeroAfterPoint, typeDoseQuantityUI } from '@/utils/aahUtils'
import ProgressCircle from '@/pages/request/prescription/ProgressCircle.vue'

const prescriptionStore = usePrescriptionStore()

const props = defineProps({
  itemUnit: null,
  prescriptionAssort: <any>Object,
  isEdit: Boolean,
  disable: Boolean,
  itemServiceUnitList: <any>Object,
  unitName: Object,
  totalDaysDose: String,
  idDosageFrequency: String,
  prescriptionDetail: <any>Object
})

const emits = defineEmits(['removeIndex'])
const getFormData = () => {
  if (prescriptionAssortForm.value.val_dosage_decided) return prescriptionAssortForm.value;
  return null
}

defineExpose({
  getFormData
});
const wholeValue = ref(0)
const partialValue = ref(0)

const fullCircles = computed(() => {
  // Integer part of the value represents the number of full circles
  return parseInt(prescriptionAssortForm.value?.val_dosage_decided);
})
const partialCircle = computed(() => {
  // Fractional part of the value represents the partial circle
  let temValue = null
  temValue = prescriptionAssortForm.value?.val_dosage_decided?.toString()
  if (temValue && temValue.includes('.') && temValue.split('.').length && temValue.split('.').length >= 2) {
    const fractionalPart = parseFloat(`0.${temValue.split('.')[1]}`);
    return fractionalPart > 0 ? fractionalPart : 0; // Ensure there is a fractional part
  }
})


const prescriptionAssortForm: any = ref({
  id_prescription_detail_assort: null,
  id_prescription: null,
  id_prescription_detail: null,
  id_item_service_unit: null,
  type_medicine_dosage: null,
  val_dose_min: null,
  val_dosage_suggested: null,
  val_efficacyingredient_assort: null,
  type_dosage_calculation: null,

})

function customRound(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.85) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.15) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}

function getNameServiceItemUnit(value) {
  return props.itemServiceUnitList?.find((itemService: any) => itemService.id_item_service_unit == value)?.name_service_item_unit
}

function totalDose() {
  let totalCircles = 0
  if (fullCircles.value && partialCircle.value) totalCircles = fullCircles.value + partialCircle.value
  else if (fullCircles.value) totalCircles = fullCircles.value
  else if (partialCircle.value) totalCircles = partialCircle.value
  
  return roundFloat(totalCircles * (roundZeroAfterPoint(props.totalDaysDose) * typeDoseQuantityUI(props.idDosageFrequency).quantity_dose || 1))
}

onMounted(() => {
  prescriptionAssortForm.value = {...props.prescriptionAssort}
  prescriptionAssortForm.value.val_dosage_decided = prescriptionAssortForm.value.val_dosage_decided ?? prescriptionAssortForm.value.val_dosage_suggested
  prescriptionAssortForm.value.val_dosage_decided = roundZeroAfterPoint(prescriptionAssortForm.value.val_dosage_decided)

  if (prescriptionAssortForm.value.val_dosage_decided) {
    const tempString = prescriptionAssortForm.value.val_dosage_decided.toString()
    if (tempString.includes('.')) {
      partialValue.value = parseFloat(`0.${roundZeroAfterPoint(tempString.split('.')[1])}`)
    } else {
      wholeValue.value = parseFloat(prescriptionAssortForm.value.val_dosage_decided.toString())
    }
  }

})

</script>

<template>
  <div class="q-my-md row assort-box justify-between">
    <div class="col">
      <div class="flex justify-between items-center">
        <div>
          <div class="flex items-center content-center item-name justify-between">
            {{ getNameServiceItemUnit(prescriptionAssortForm?.id_item_service_unit) }} 
            <span v-if="!prescriptionDetail?.process_drip?.flg_drip_carrier">
              ( {{ `${fullCircles ? fullCircles : ''} ${fullCircles && partialCircle ? ' + ' : ''}   ${partialCircle ? decimalToFraction(partialCircle) : ''}`
              }} )
            </span>
          </div>
          <div v-if="!prescriptionDetail?.process_drip?.flg_drip_carrier" class="q-mt-xs text-grey-700">
            必要総数： {{ prescriptionDetail?.name_medicine_format == '粉' ? customRound(totalDose()) : totalDose() }}
            {{ prescriptionDetail?.name_medicine_format }}
          </div>
        </div>
        <div v-if="prescriptionDetail?.name_medicine_format == '錠'" 
             class="q-ml-md flex items-center content-center">
          <div v-if="prescriptionAssortForm.val_dosage_decided" class="progress-circles">
            <progress-circle
              v-if="prescriptionAssortForm.val_dosage_decided >= 1"
              :key="'full-' + 1"
              :amount-pill="fullCircles"
              :is-custom="true"
              :value="1"
            ></progress-circle>
            <progress-circle
              v-if="partialCircle> 0"
              key="partial"
              :is-custom="true"
              :value="partialCircle"
              :amount-pill="decimalToFraction(partialCircle)"
            ></progress-circle>
          </div>
          <small class="ellipsis q-ml-sm">{{ unitName }}</small>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.assort-box {
}

.item-name {
}

.w75px {
  width: 75px;
  height: 32.5px;
}

.suggested-item {
  color: var(--System-Gray-600, #757575);
  font-size: 10px;
  font-style: normal;
  font-weight: 400;
  line-height: 14px; /* 133.333% */
  max-resolution: 4px;
}

.assort-dose-icon::after {
  content: '錠/服用';
  top: 65% !important;
}

.progress-circles {
  display: flex; /* Or any other layout styling */
  gap: 10px; /* Spacing between circles */
}

.c-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px;
}
</style>