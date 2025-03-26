<script setup lang="ts">
import { defineComponent, ref, computed } from 'vue'

const props = defineProps<{
  popup?: Object,
  width?: string
}>()

const className = ref('ns-popup')
const popupWidth = computed(() => props.width || '500px')

function init() {
  if (props?.popup?.popupClassName) {
    className.value = props.popup.popupClassName
  }
}
const flgShow = ref(true)
const elm = computed({
  get: () => {
    return this.$refs.elm.outerHTML
  },
  set: () => {}
})

defineExpose({
  elm,
  flgShow
})

const emit = defineEmits(['close'])

function close() {
  emit('close')
}
init()
</script>

<template>
  <q-dialog v-model="flgShow" @hide="close">
    <div ref="elm" class="mt-small-popup scrollable-popup" :style="{ width: popupWidth }" />
  </q-dialog>
</template>

<style lang="scss" scoped>
.mt-small-popup {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
  max-height: 90vh;
  overflow-y: auto;
}

div {
  overflow: hidden !important;
}

.scrollable-popup {
  .filter-modal-container {
    max-height: calc(90vh - 120px);
    overflow-y: auto;
    padding-right: 16px;
  }
}
</style> 