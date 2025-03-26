<script setup lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'

const props = defineProps({
  styleAttr: Object
})

const flgShow = ref(true)
const elm = computed({
  get: () => {
    return this.$refs.elm.outerHTML
  },
  set: () => { }
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
  <q-dialog v-model="flgShow" @hide="close">
    <q-scroll-area class="ns-popup" style="width: 100%; max-width: 98vw" :style="styleAttr">
      <div ref="elm" />
    </q-scroll-area>
  </q-dialog>
</template>
<style lang="scss" scoped>
.backgroundEvent {
  position: absolute;
  width: 100vw;
  height:96vh;
}
.ns-popup {
  background-color: $black;
  border-radius: 6px;
  width: 100%;
  height:100%;
}
div {
  overflow: hidden !important;
}
</style>
