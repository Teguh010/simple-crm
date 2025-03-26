<script setup lang="ts">
import { defineComponent, ref, computed } from 'vue'
import RecordingModal from '@/pages/memoCarte/RecordingModal.vue'

const flgShow = ref(true)
const elm = computed({
  get: () => {
    return this.$refs.elm.outerHTML
  },
  set: () => {

  }
})

defineExpose({
  elm,
})

const emit = defineEmits(['close']);

function close(){
  emit('close')
}

</script>

<template>
  <RecordingModal @close="close" />
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
