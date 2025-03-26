<script setup lang="ts">
import { defineComponent, ref, computed } from 'vue'

const props = defineProps<{
  popup?: Object
}>()

const className = ref('ns-popup')

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
    <div ref="elm" class="mt-small-popup" />
  </q-dialog>
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
