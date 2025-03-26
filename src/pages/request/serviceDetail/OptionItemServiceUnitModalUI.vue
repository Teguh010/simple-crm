<script lang="ts" setup>

import MtModalHeader from '@/components/MtModalHeader.vue'


const emits = defineEmits(['close'])
const props = defineProps({ itemServiceUnitList: Object, selectedUnit: Function, class: String })

function updateEmit(ISU1) {
  props.selectedUnit({ ...ISU1, selected: true })
  closeModal()
}

const closeModal = () => {
  emits('close')
}

</script>

<template>
  <q-card class="mt-small-popup">
    <MtModalHeader class="bg-light-blus" @close-modal="closeModal">
      <div class="full-width">対象の商品サービスを選択してください。</div>
    </MtModalHeader>
    <q-scroll-area style="height: 50vh">
      <div class="flex columns q-pb-md">
        <div v-for="ISU1 in props?.itemServiceUnitList" :key="ISU1?.id_item_service_unit" class="flex">
          <div :class="props.class" class="flex item-service-unit-box" @click="updateEmit(ISU1)">
            <q-icon class="q-pt-xs q-mr-sm" name="arrow_right" />
            {{ ISU1?.name_service_item_unit }}
          </div>
        </div>
      </div>
    </q-scroll-area>
  </q-card>
</template>

<style lang="scss" scoped>

.item-service-unit-box {
  display: flex;
  align-items: center;
  color: $grey-800;
  padding: 10px 15px;
  margin: 5px 10px !important;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.service-detail-hover {
  &:hover {
    background-color: rgba(255, 236, 248, 0.7);
  }
}

.inject-detail-hover {
  &:hover {
    background-color: rgba(245, 240, 255)
  }
}

.prescription-detail-hover {
  &:hover {
    background-color: rgba(242, 250, 255)
  }
}

</style>