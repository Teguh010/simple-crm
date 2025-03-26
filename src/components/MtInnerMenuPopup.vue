<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  popup?: Object,
  persistent?: boolean
}>()

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
  flgShow
})

const emit = defineEmits(['close']);

function close(){
  emit('close')
}

</script>

<template>
  <q-dialog v-model="flgShow" class="small" @hide="close" :persistent="persistent">
    <div ref="elm" class="mt-small-popup" />
  </q-dialog>
</template>

<style lang="scss" scoped>
.mt-small-popup {
  border: #666666 1px solid;
  border-radius: 6px;
  background-color: #FFFFFF;
  width: 550px !important;
  height: auto;
}

div {
  overflow: hidden !important;
}
</style>
