<script  lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
    name: "MtUtilsAlert",
    methods: {
      close(){
        this.$emit('close')
      }
    }
  })
</script>

<script setup lang="ts">
  const props = defineProps<{
    title: string;
    message: string;
    center: boolean
  }>();
  const flgShow = ref(true)
</script>

<template>
  <q-dialog v-model="flgShow" @hide="close" v-on:keyup.enter="close">
    <q-card>
      <q-card-section v-if="props.title" :class="props.center ? 'flex justify-center' : '' ">
        <div class="text-h6">{{ props.title }}</div>
      </q-card-section>
      <q-card-section class="message">
        <div v-html="props.message"></div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn label="OK" color="primary" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
.message{
  white-space: pre-wrap;
}
</style>
