<script lang="ts" setup>

import { roundZeroAfterPoint, typeDoseQuantityUI } from "@/utils/aahUtils";

const props = defineProps({prescriptionDetail: Object})

function quantityDose() {
  return roundZeroAfterPoint(props.prescriptionDetail.total_days_dose) * typeDoseQuantityUI(props.prescriptionDetail.id_dosage_frequency).quantity_dose ?? 1
}

</script>

<template>
  <div class="flex justify-between q-mb-xs q-px-sm">
    <div class="">
      <span class="text-grey-700 title-font">
        総服用回数: 
      </span>
      <span class="pill-title"> 
        {{ quantityDose() }} 回分
      </span>
    </div>
    <div>
      <span class="q-mr-sm text-grey-700 title-font">服用形状:</span>
      <span class="pill-title">{{ prescriptionDetail.name_medicine_format ?? '' }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.title-font {
  font-size: 11px;
}

.pill-title {
  color: var(--System-Gray-900, #212121);
  font-style: normal;
  font-weight: 700;
  line-height: 20px; /* 133.333% */
}


</style>