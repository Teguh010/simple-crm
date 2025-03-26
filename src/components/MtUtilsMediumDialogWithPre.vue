<script lang="ts" setup>
import { computed, ref } from 'vue'

const props = defineProps<{
  popup: Object
  scrollAreaFlg?: false
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
  set: () => {
  }
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
  <q-dialog
    v-model="flgShow"
    class="medium"
    persistent
    transition-duration="0"
    @hide="close"
  >
    <q-scroll-area v-if="scrollAreaFlg" class="popup-scroll-area">
      <div ref="elm" />
    </q-scroll-area>
    <div v-else ref="elm" class="popup-scroll-area" />
  </q-dialog>
</template>

<style lang="scss" scoped>
@mixin tablet {
  @media screen and (min-width: (768px)) and (max-width: (1080px)) {
    @content;
  }
}

.popup-scroll-area {
  width: 70%;
  max-width: 80vw;
  border: #666666 1px solid;
  border-radius: 6px;
  background-color: #ffffff;
  z-index: 1;
}

.quotemodal .popup-scroll-area :deep(.q-scrollarea__content) {
  width: 100% !important;
}

div {
  overflow: hidden !important;
}

@media only screen and (max-width: 950px) {
  .popup-scroll-area {
    width: 100%;
    max-width: 100%;
  }
}

@media only screen and (min-width: 1024px) and (max-width: 1150px) {
  :deep(.row > .col-sm-12) {
    height: auto;
    width: 100%;
  }
}
</style>
