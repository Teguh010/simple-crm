<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { decimalToFraction, roundZeroAfterPoint } from '@/utils/aahUtils'
import ProgressCircle from '@/pages/request/prescription/ProgressCircle.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { partialPillOptions, wholePillOptions } from '@/utils/enum'

const props = defineProps({
  itemUnit: null,
  prescriptionAssort: <any>Object,
  isEdit: Boolean,
  disable: Boolean,
  itemServiceUnitList: <any>Object,
  pillDivision: <any>Object,
  calculatedTotalDosage: <any>Object
})

const emits = defineEmits(['removeIndex'])
const getFormData = () => {
  if (prescriptionAssortForm.value.val_dosage_decided && Number(prescriptionAssortForm.value.val_dosage_decided) > 0)
    return prescriptionAssortForm.value
  return null
}

defineExpose({
  getFormData
})
const toggleDialog = ref(false)
const fullCircles = computed(() => {
  if (prescriptionAssortForm.value?.val_dosage_decided) {
    return parseInt(prescriptionAssortForm.value?.val_dosage_decided)
  }
})
const partialCircle = computed(() => {
  // Fractional part of the value represents the partial circle
  const temValue = prescriptionAssortForm.value?.val_dosage_decided?.toString()
  if (
    temValue &&
    temValue.includes('.') &&
    temValue.split('.').length &&
    temValue.split('.').length >= 2
  ) {
    const fractionalPart = parseFloat(`0.${temValue.split('.')[1]}`)
    return fractionalPart > 0 ? fractionalPart : 0 // Ensure there is a fractional part
  }
})

const wholeValue = ref(0)
const partialValue = ref(0)

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
  val_dosage_decided_Ui: null
})

function updateValue() {

  prescriptionAssortForm.value.val_dosage_decided = roundZeroAfterPoint(
    wholeValue.value + partialValue.value
  )
  processStringForValue()

  if (wholeValue.value + partialValue.value === 0) {
    prescriptionAssortForm.value.val_dosage_decided_Ui = ''
  }
  
  
  toggleDialog.value = false
}
function getNameServiceItemUnit(value) {
  return props.itemServiceUnitList.find(
    (itemService: any) => itemService.id_item_service_unit == value
  )?.name_service_item_unit
}

function processStringForValue() {
  if (fullCircles.value && partialCircle.value) {
    prescriptionAssortForm.value.val_dosage_decided_Ui = `${
      fullCircles.value
    } + ${decimalToFraction(partialCircle.value)}`
    return
  }

  if (fullCircles.value && !partialCircle.value) {
    prescriptionAssortForm.value.val_dosage_decided_Ui = `${fullCircles.value}`
    return
  }

  if (partialCircle.value) {
    prescriptionAssortForm.value.val_dosage_decided_Ui = `${decimalToFraction(partialCircle.value)}`
    return
  }
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

const getFraction = computed(() => {
  const totalPill = Number(props.calculatedTotalDosage) * Number(prescriptionAssortForm.value?.val_dosage_decided)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {

    if (parseInt(Number(totalPill)) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`  
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
  return ''
})

onMounted(() => {
  prescriptionAssortForm.value = { ...props.prescriptionAssort }
  prescriptionAssortForm.value.val_dosage_decided =
    prescriptionAssortForm.value.val_dosage_decided ??
    prescriptionAssortForm.value.val_dosage_suggested
  prescriptionAssortForm.value.val_dosage_decided = roundZeroAfterPoint(
    prescriptionAssortForm.value.val_dosage_decided
  )
  if (prescriptionAssortForm.value.val_dosage_decided) {
    const tempString =
      prescriptionAssortForm.value.val_dosage_decided.toString()
    if (tempString.includes('.')) {
      partialValue.value = parseFloat(
        `0.${roundZeroAfterPoint(tempString.split('.')[1])}`
      )
    } else {
      wholeValue.value = parseInt(
        prescriptionAssortForm.value.val_dosage_decided.toString()
      )
    }
  }
  if (!props.isEdit) {
    prescriptionAssortForm.value.val_dosage_decided = roundZeroAfterPoint(
      prescriptionAssortForm.value?.val_dosage_suggested
    )
  }
  processStringForValue()
})
</script>

<template>
  <div class="row q-mb-xs flex items-center full-width">
    <div class="col-auto">
      <q-btn
        flat
        round
        @click="
          () => {
            emits('removeIndex')
          }
        "
        v-if="!disable"
      >
        <q-icon size="13px" name="close" class="text-grey-600" />
      </q-btn>
    </div>
    <div
      class="col-4 col-sm-4 col-md-4 flex items-center content-center item-name"
    >
      {{ getNameServiceItemUnit(prescriptionAssortForm?.id_item_service_unit) }}
    </div>
    <div class="col-3 cursor-pointer">
      <div
        class="flex column"
        @click="
          () => {
            toggleDialog = !toggleDialog
          }
        "
      >
        <div class="d-flex items-center">
          <MtFormInputNumber
            class="field-right-text assort-dose-icon text-center"
          mode="dosage"
          v-model:value="prescriptionAssortForm.val_dosage_decided_Ui"
            label="処方1回"
          readonly
          />
          <span class="q-ml-xs"> 錠</span>
        </div>
        <span
          class="suggested-item q-my-xs"
          v-if="prescriptionAssortForm.val_dosage_suggested"
        >
          自動計算
          <span>{{
            roundZeroAfterPoint(prescriptionAssortForm?.val_dosage_suggested)
          }}</span>
          錠</span
        >
      </div>
    </div>
    <div class="q-ml-md col-3 flex items-center justify-between">
      <div
        class="progress-circles"
        v-if="prescriptionAssortForm.val_dosage_decided"
      >
        <progress-circle
          v-if="prescriptionAssortForm.val_dosage_decided >= 1"
          :key="'full-' + 1"
          :value="1"
          :amount-pill="fullCircles"
        ></progress-circle>
        <progress-circle
          v-if="partialCircle > 0"
          :value="partialCircle"
          key="partial"
        ></progress-circle>
      </div>
      <span>
        <small class="text-grey-600 q-mr-md">総数</small>
        {{ parseInt(customRound(Number(calculatedTotalDosage) * Number(prescriptionAssortForm.val_dosage_decided))) > 0 ?
        `${parseInt(customRound(Number(calculatedTotalDosage) * Number(prescriptionAssortForm.val_dosage_decided)))} ` : '' 
        }} {{ getFraction }} 錠 
      </span>
    </div>
    <q-dialog v-model="toggleDialog">
      <q-card>
        <MtModalHeader
          @close-modal="() => (toggleDialog = !toggleDialog)"
          :closeBtn="false"
        >
          <div class="column q-mb-sm">
            <q-toolbar-title
              class="text-grey-900 title2 bold q-pa-none q-mt-md q-mb-xs"
            >
              処方錠剤数の調整
            </q-toolbar-title>
          </div>
        </MtModalHeader>
        <q-card-section class="q-pa-md">
          <div class="c-grid">
            <div class="q-mb-lg">
              <MtFormPullDown
                label="単位：錠（分割なし）"
                :options="wholePillOptions"
                v-model="wholeValue"
              />
            </div>
            <div class="q-mb-lg">
              <MtFormPullDown
                :options="partialPillOptions"
                label="単位：分割"
                v-model:selected="partialValue"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-bt bg-white">
          <div class="text-center modal-btn">
            <q-btn
              outline
              class="bg-grey-100 text-grey-800"
              @click="() => (toggleDialog = false)"
            >
              <span>閉じる</span>
            </q-btn>
            <q-btn
              unelevated
              color="primary"
              class="q-ml-md"
              @click="updateValue"
            >
              <span>適用</span>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="scss">
.item-name {
  color: var(--System-Gray-900, #212121);
  font-size: 15px;
  font-style: normal;
  font-weight: 700;
  line-height: 20px; /* 133.333% */
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

.d-flex {
  display: flex;
  align-items: center;
}
</style>
