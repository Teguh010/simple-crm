<script lang="ts">
  import { defineComponent, ref, computed  } from 'vue'
  export default defineComponent({
    name: "MtUtilsPopup",
    methods: {
      close(){
        this.$emit('close')
      }
    }
  })
</script>

<script setup lang="ts">
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

</script>

<template>
  <q-dialog v-model="flgShow" @hide="close">
      <div ref="elm" />
  </q-dialog>
</template>

<style lang="scss" scoped>
.q-dialog{
  border: $grey-800 1px solid;
  border-radius: 15px;
  background-color: $white;
}

div {
  overflow: hidden !important;
}
</style>
