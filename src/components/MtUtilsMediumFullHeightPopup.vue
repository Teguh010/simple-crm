<script setup lang="ts">
  import { defineComponent, ref, computed } from 'vue'

  const className = ref('ns-popup')
  function init(){
    if(props?.popup?.popupClassName){
      className.value = props.popup.popupClassName
    }
  }

  const props = defineProps<{
    popup: Object
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
  })

  const emit = defineEmits(['close']);

  function close(){
    emit('close')
  }

  init()

</script>

<template>
  <q-dialog v-model="flgShow" @hide="close" full-height :class="className">
    <q-scroll-area class="popup-scroll-area" style="width: 70%; max-width: 80vw;">
      <div ref="elm" />
    </q-scroll-area>
  </q-dialog>
</template>

<style lang="scss" scoped>
.popup-scroll-area {
  border: $grey-800 1px solid;
  border-radius: 6px;
  background-color: $white;
  width: 100%;
  height: 560px;
}

div {
  overflow: hidden !important;
}
@media screen and (max-width: 820px) {
  .ns-popup{
    width: 90% !important;
  }
}
</style>
