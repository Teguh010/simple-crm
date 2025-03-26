<script lang="ts" setup>

import MtModalHeader from '@/components/MtModalHeader.vue'


const emits = defineEmits(['close'])
const props = defineProps({ callBack: Function })


const closeModal = () => {
  emits('close')
}

const updateEmit = (value) => {
  props.callBack(value)
  closeModal()
}

</script>

<template>
  <q-card class="mt-small-popup">
    <MtModalHeader class="bg-light-blus" @close-modal="closeModal">
      <div class="full-width">入金調整</div>
    </MtModalHeader>
    <div class="flex columns q-pb-md justify-around">
      <div :class="props.class" class="flex box hover" @click="updateEmit(10)">
        10円以下調整
      </div>
      <div :class="props.class" class="flex box hover" @click="updateEmit(100)">
        100円以下調整
      </div>
    </div>
  </q-card>
</template>

<style lang="scss" scoped>

.box {
  display: flex;
  align-items: center;
  color: $grey-800;
  padding: 10px 15px;
  margin: 5px 10px !important;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.hover {
  &:hover {
    background-color: rgba(255, 236, 248, 0.9);
  }
}

</style>