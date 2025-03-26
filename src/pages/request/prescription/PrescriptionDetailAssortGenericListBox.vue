<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { roundZeroAfterPoint } from '@/utils/aahUtils'
import useCommonStore from '@/stores/common'

const props = defineProps({
  itemUnit: null,
  prescriptionAssort: <any>Object,
  isEdit: Boolean,
  disable: Boolean,
  itemServiceUnitList: <any>Object,
  pillDivision: <any>Object,
  calculatedDosage: <any>Object
})

const emits = defineEmits(['removeIndex'])
const getFormData = () => {
  if (prescriptionAssortForm.value.val_dosage_decided)
    return prescriptionAssortForm.value
  return null
}

defineExpose({
  getFormData
})


function customRound(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.95) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.05) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}
const calculatedTotalDosage = computed(() => {
  if (prescriptionAssortForm.value.val_dosage_decided && props.calculatedDosage)
    return (
      roundZeroAfterPoint(customRound(props.calculatedDosage * Number(prescriptionAssortForm.value.val_dosage_decided)))
    )
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
  val_dosage_decided_Ui: null
})

function getItemServiceUnit(value) {
  return props.itemServiceUnitList.find(
    (itemService: any) => itemService.id_item_service_unit == value
  )
}

function getNameServiceItemUnit(value) {
  return props.itemServiceUnitList.find(
    (itemService: any) => itemService.id_item_service_unit == value
  )?.name_service_item_unit
}

const unitName = (value) => {
  return useCommonStore().getCommonUnitOptionList.find((v) => v.id_common === value)?.name_common
}

onMounted(() => {
  console.log(props.prescriptionAssort.val_dosage_decided, 'Reached', props.isEdit)
  prescriptionAssortForm.value = { ...props.prescriptionAssort }
  if (!props.isEdit) {
    prescriptionAssortForm.value.val_dosage_decided = roundZeroAfterPoint(
      prescriptionAssortForm.value?.val_dosage_suggested
    )
  }
})
</script>

<template>
  <div class="row q-mb-xs flex items-center full-width">
    <div class="col-auto">
      <q-btn
        v-if="!disable"
        flat
        round
        @click="
          () => {
            emits('removeIndex')
          }
        "
      >
        <q-icon class="text-grey-600" name="close" size="13px" />
      </q-btn>
    </div>
    <div
      class="col-6 col-sm-4 col-md-5 flex items-center content-center item-name"
    >
      {{ getNameServiceItemUnit(prescriptionAssortForm?.id_item_service_unit) }} 
    </div>
    <div class="col-2 cursor-pointer">
      <div
        class="flex column"
      >
        <MtFormInputNumber
          class="field-right-text right-text assort-dose-icon"
          v-model:value="prescriptionAssortForm.val_dosage_decided"
          label="1回"
          mode="dosage"
        />
      </div>
    </div>
    <div class="col-1 q-ml-md">
      <span>
        {{ unitName(getItemServiceUnit(prescriptionAssortForm.id_item_service_unit)?.id_common) }}
      </span>
    </div>
    <div class="col-1 cursor-pointer">
      <div
        class="flex column"
      >
        <MtFormInputNumber
          class="field-right-text right-text assort-dose-icon text-right"
          v-model:value="calculatedTotalDosage"
          label="総数"
          mode="dosage"
          @update:value="(value) => {
            prescriptionAssortForm.val_dosage_decided = value / calculatedDosage
          }"
        />
      </div>
    </div>
    <div class="col-1 q-ml-md">
      <span>
        {{ unitName(getItemServiceUnit(prescriptionAssortForm.id_item_service_unit)?.id_common) }}
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
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
