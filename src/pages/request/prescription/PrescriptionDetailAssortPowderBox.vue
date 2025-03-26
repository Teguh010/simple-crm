<script lang="ts" setup>

import { computed, onMounted, ref, watch } from 'vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useCommonStore from '../../../stores/common'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { roundZeroAfterPoint } from '../../../utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { round } from 'lodash'


const props = defineProps({
  itemUnit: null,
  prescriptionAssort: <any>Object,
  isEdit: Boolean,
  disable: Boolean,
  itemServiceUnitList: <any>Object,
  radioValue: null,
  efficacyCalculation: Object,
  calculatedTotalDosage: Object
})
const selectedUnit = ref(null)

function customRound(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.9) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.15) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}

watch(() => props.efficacyCalculation, (newVal, oldVal) => {
  if (newVal) {

    const ratioWeight = (selectedUnit?.value?.val_efficacyingredient ?? 1) / (selectedUnit?.value?.val_liquid ?? 1)
    
    prescriptionAssortForm.value.val_amount_powder = (props.efficacyCalculation / ratioWeight)
    prescriptionAssortForm.value.val_dosage_decided = (Number(prescriptionAssortForm?.value?.val_amount_powder ?? 1) / (selectedUnit?.value?.val_liquid ?? 1))
    prescriptionAssortForm.value.val_efficacyingredient = Number(prescriptionAssortForm.value.val_dosage_decided) * Number(selectedUnit?.value?.val_efficacyingredient ?? 1)

    prescriptionAssortForm.value.val_amount_powder = prescriptionAssortForm.value.val_amount_powder.toFixed(4)
    prescriptionAssortForm.value.val_dosage_decided = prescriptionAssortForm.value.val_dosage_decided.toFixed(4)
    prescriptionAssortForm.value.val_efficacyingredient = prescriptionAssortForm.value.val_efficacyingredient.toFixed(4)

    currentPill.value = round(prescriptionAssortForm.value.val_dosage_decided * props.calculatedTotalDosage, 3)
  }
})


const totalPowder = computed(() => {
  return Number(props.calculatedTotalDosage * prescriptionAssortForm.value.val_amount_powder).toFixed(4)
})

const emits = defineEmits(['removeIndex', 'wholePill'])
const getFormData = () => {
  if (prescriptionAssortForm.value.val_dosage_decided) return prescriptionAssortForm.value
  return null
}

defineExpose({
  getFormData
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

async function calculateNumber() {

  if (!selectedUnit.value.val_liquid) {
    await mtUtils.alert('錠剤から粉にする場合、指定医薬品の錠剤重量を設定する必要があります。', 'マスタを確認してください')
    selectedUnit.value = null
    prescriptionAssortForm.value.id_item_service_unit = null
    return
  }
  const ratioWeight = selectedUnit.value?.val_efficacyingredient / selectedUnit.value?.val_liquid
  prescriptionAssortForm.value.val_amount_powder = (props.efficacyCalculation / ratioWeight).toFixed(4)
  prescriptionAssortForm.value.val_dosage_decided = (Number(prescriptionAssortForm.value.val_amount_powder) / selectedUnit.value?.val_liquid).toFixed(4)
  currentPill.value = round(prescriptionAssortForm.value.val_dosage_decided * props.calculatedTotalDosage)
  updateWholePill(prescriptionAssortForm.value.val_dosage_decided * props.calculatedTotalDosage, selectedUnit.value)
}

function updateEffiacay() {
  prescriptionAssortForm.value.val_amount_powder = (prescriptionAssortForm.value.val_dosage_decided * (selectedUnit.value?.val_liquid ?? 1)).toFixed(4)
  prescriptionAssortForm.value.val_efficacyingredient = (Number(prescriptionAssortForm.value.val_dosage_decided) * Number((selectedUnit.value?.val_efficacyingredient ?? 1))).toFixed(4)
  currentPill.value = Number(props.calculatedTotalDosage) * prescriptionAssortForm.value.val_dosage_decided
}

function updatePill() {
  prescriptionAssortForm.value.val_dosage_decided = (prescriptionAssortForm.value.val_amount_powder / selectedUnit.value?.val_liquid).toFixed(4)
  prescriptionAssortForm.value.val_efficacyingredient = Number(prescriptionAssortForm.value.val_dosage_decided) * Number(selectedUnit.value?.val_efficacyingredient).toFixed(4)
}

function updateWholePill(value) {
  emits('wholePill', { pill: value, unit: selectedUnit.value })
}


onMounted(async () => {
  let max = -999
  console.log(props.prescriptionAssort.val_dosage_decided, 'Reached')
  prescriptionAssortForm.value = { ...props.prescriptionAssort }


  props.itemServiceUnitList.map((itemUnit, index) => {
    if (itemUnit && itemUnit?.val_liquid && Number(itemUnit?.val_liquid) > max) {
      max = Number(itemUnit?.val_liquid)
      prescriptionAssortForm.value.id_item_service_unit = itemUnit.id_item_service_unit
      selectedUnit.value = itemUnit
      prescriptionAssortForm.value.id_cm_unit_medicine = itemUnit.id_cm_unit_medicine
    }
  })

  if (!selectedUnit.value) {
    await mtUtils.alert('錠剤から粉にする場合、指定医薬品の錠剤重量を設定する必要があります。', 'マスタを確認してください')
    return
  }
  
  if (props.isEdit) {
    props.itemServiceUnitList.map((itemUnit, index) => {
      if (itemUnit.id_item_service_unit == props.prescriptionAssort.id_item_service_unit) {
        prescriptionAssortForm.value.id_item_service_unit = itemUnit.id_item_service_unit
        selectedUnit.value = itemUnit
        prescriptionAssortForm.value.id_cm_unit_medicine = itemUnit.id_cm_unit_medicine
      }
    })
    currentPill.value = customRound(props.calculatedTotalDosage * prescriptionAssortForm.value?.val_dosage_decided)
    
    const ratioWeight = prescriptionAssortForm.value?.val_efficacyingredient / (selectedUnit.value?.val_liquid * prescriptionAssortForm.value?.val_dosage_decided)
    prescriptionAssortForm.value.val_amount_powder = (prescriptionAssortForm.value?.val_efficacyingredient / ratioWeight).toFixed(4)
    prescriptionAssortForm.value.val_dosage_decided = (Number(prescriptionAssortForm.value?.val_amount_powder) / selectedUnit.value?.val_liquid).toFixed(4)
    prescriptionAssortForm.value.val_efficacyingredient = Number(prescriptionAssortForm.value?.val_dosage_decided) * Number(selectedUnit.value?.val_efficacyingredient)

    return
  }
  
  const ratioWeight = selectedUnit.value?.val_efficacyingredient / selectedUnit.value?.val_liquid
  prescriptionAssortForm.value.val_amount_powder = (props.efficacyCalculation / ratioWeight)

  prescriptionAssortForm.value.val_dosage_decided = (Number(prescriptionAssortForm.value.val_amount_powder) / selectedUnit.value?.val_liquid)
  prescriptionAssortForm.value.val_efficacyingredient = Number(prescriptionAssortForm.value.val_dosage_decided) * Number(selectedUnit.value?.val_efficacyingredient)

  prescriptionAssortForm.value.val_amount_powder = (prescriptionAssortForm.value.val_amount_powder).toFixed(4)
  prescriptionAssortForm.value.val_dosage_decided = (prescriptionAssortForm.value.val_dosage_decided).toFixed(4)
  prescriptionAssortForm.value.val_efficacyingredient = (prescriptionAssortForm.value.val_efficacyingredient).toFixed(4)

  if (props.efficacyCalculation > 0 && props.calculatedTotalDosage > 0 && selectedUnit.value.val_efficacyingredient > 0) {
    currentPill.value = (props.efficacyCalculation / selectedUnit.value.val_efficacyingredient) * Number(props.calculatedTotalDosage)
    updateWholePill(currentPill.value, selectedUnit.value)
    return
  }
  currentPill.value = 1
  updateWholePill(1, selectedUnit.value)
})

const showModifiedPill = ref(false)
const currentPill = ref(0)
</script>

<template>
  <div class="row q-mb-xs flex full-width ">
    <div class="col-7 row  col-sm-5 col-md-6 ">
      <div v-for="itemUnit in props.itemServiceUnitList" :key="itemUnit.id_item_service_unit" class="row full-width">
        <div class="col-2">
          <MtFormRadiobtn 
            v-model:selected="prescriptionAssortForm.id_item_service_unit"
            :val="itemUnit.id_item_service_unit"
            @update:selected="async ()=>{
              selectedUnit = props.itemServiceUnitList.find(item=>item.id_item_service_unit == itemUnit.id_item_service_unit)
                await calculateNumber()
              }" 
            />
        </div>
        <div :class="itemUnit.id_item_service_unit != selectedUnit?.id_item_service_unit ? 'text-grey-400' : '' "
             class="col-9 flex items-center content-center item-name" @click="async ()=>{
               prescriptionAssortForm.id_item_service_unit = itemUnit.id_item_service_unit;
               selectedUnit = props.itemServiceUnitList.find(item=>item.id_item_service_unit == itemUnit.id_item_service_unit)
                await calculateNumber()
             }">
          {{ itemUnit.name_service_item_unit }}
        </div>
      </div>
    </div>
    <div class="col-5 cursor-pointer col-sm-5 col-md-6">
      <div class="row q-col-gutter-md full-width">
        <div class="col-6 d-flex">
          <MtFormInputNumber
            v-model:value="prescriptionAssortForm.val_dosage_decided"
            :class="showModifiedPill ? 'col-3' : 'col-6'" class="field-right-text assort-text-1 right-text"
            label="1回量"
            :decimal-size="5"
            mode="dosage" @update:value="updateEffiacay"
          />
          <span class="q-ml-sm">錠</span>
        </div>
        <div class="col-6 d-flex">
          <MtFormInputNumber
            v-model:value="currentPill" :decimal-size="5"
            class="col-3 field-right-text assort-text-1 right-text" label="総数" mode="dosage"
            @update:value="(value)=>{
              updateWholePill(value)
            }"
          />
          <span class="q-ml-sm">錠</span>
        </div>
      </div>
      <div class="row q-col-gutter-md full-width">
        <div class="col-6">
          <MtFormInputNumber 
            v-model:value="prescriptionAssortForm.val_amount_powder"
            class="col-6 field-right-text assort-text-2 right-text" label="1回分の粉量"
            :decimal-size="5" mode="dosage"
            @update:value="updatePill"
          />
        </div> 
        <div class="col-6 caption1 regular text-right q-pr-sm q-mt-md">
          総粉量： {{ roundZeroAfterPoint(round(totalPowder, 2)) }}
          {{ useCommonStore().getCommonUnitOptionList.find((v: any) => v.id_common == selectedUnit?.id_cm_unit_medicine)?.name_common
          }}
        </div>
      </div>
      <!-- <div class="col-6 q-mt-sm">
        <div class="dosage-variable-range">
          1回分の有効成分量： {{ calculatedEfficacyIngredient }}
          {{ useCommonStore().getCommonUnitOptionList.find((v) => v.id_common == selectedUnit?.id_cm_unit_medicine)?.name_common
          }}
        </div>
      </div> -->
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


.assort-text-1:after {
  content: '錠';
  top: 65% !important;
}

.assort-text-2:after {
  content: 'mg';
  top: 65% !important;
}

.d-flex {
  display: flex;
  align-items: center;
}
</style>