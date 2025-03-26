<script setup lang="ts">
import { defineComponent, ref, computed } from 'vue'
import DraggableCustomerPetByPhoneNumber from './CustomerPetByPhoneNumberNotificationModal.vue'

const props = defineProps({
  data: Object
})

const elm = computed({
  get: () => {
    return this.$refs.elm.outerHTML
  },
  set: () => {}
})

defineExpose({
  elm
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
</script>

<template>
  <DraggableCustomerPetByPhoneNumber @close="close" :data="data" />
</template>

<style lang="scss" scoped>
.mt-small-popup {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
  width: 310px !important;
  height: auto;
}

div {
  overflow: hidden !important;
}
</style>
