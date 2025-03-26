<script setup lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'

const emit = defineEmits(['close'])
const props = defineProps<{
  position: 'standard' | 'top' | 'right' | 'bottom' | 'left'
}>()
function close() {
  flgShow.value = !flgShow.value
  emit('close')
}

const flgShow = ref(true)

const elm = computed({
  get: () => {
    return this.$refs.elm.outerHTML
  },
  set: () => {},
})

defineExpose({
  elm,
  flgShow,
})
</script>

<template>
  <q-dialog
    transition-duration="0"
    v-model="flgShow"
    @hide="close"
    :class="`mt-dialog-${props.position}`"
  >
    <div ref="elm" />
  </q-dialog>
</template>

<style lang="scss" scoped>
.ns-popup {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
}

div {
  overflow: hidden !important;
}
</style>

<!-- this is the only way to adjust the position of the dialog from top-->
<style lang="scss">
.mt-dialog-top {
  .q-dialog__inner {
    align-items: start !important;
    margin-top: 80px !important;
  }
}
</style>
