<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  popup: Object
  persistent: boolean
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
  <q-dialog
    v-model="flgShow"
    full-width
    full-height
    @hide="close"
    :class="className"
    transition-duration="0"
    :persistent="persistent"
  >
    <div class="popup-scroll-area" ref="elm" />
  </q-dialog>
</template>

<style lang="scss" scoped>
@mixin tablet {
  @media screen and (min-width: (768px)) and (max-width: (1080px)) {
    @content;
  }
}

.popup-scroll-area {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
}

div {
  overflow: hidden !important;
}
</style>
