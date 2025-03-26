<script setup lang="ts">
import { ref } from 'vue'

const emits = defineEmits(['close', 'download', 'print'])
const closeModal = (() => emits('close'))

const downloadPdf = () => {
  emits('close', 'download')
}

const printdPdf = () => {
  emits('close', 'print')
}

const selectedOption = ref<'download' | 'print'>('download')
</script>
<template>
  <div class="q-pa-md">
    <div class="text-center text-body2">Select between Download and print</div>
    <div class="q-mt-lg row flex justfiy-center gap-4" style="justify-content: center">
      <q-btn 
        outline 
        class="bg-grey-100 text-grey-800" 
        @click="closeModal"
        >
        <span>キャンセル</span>
      </q-btn>
      <q-btn label="Download" color="primary" @click="downloadPdf" />
      <q-btn label="Print" color="primary" @click="printdPdf" />
    </div>
  </div>
</template>