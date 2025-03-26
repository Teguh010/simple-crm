<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'

const emits = defineEmits(['close'])

const closeModal = () => emits('close')

const props = defineProps<{
  confirmationResult: {
    confirmed: boolean
  }
}>()

const goAhead = () => {
  props.confirmationResult.confirmed = true
  closeModal()
}

const cancel = () => {
  props.confirmationResult.confirmed = false
  closeModal()
}
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      生成を開始しますか？
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section>
    <div class="flex items-center q-gutter-sm justify-center">
      <q-btn
        label="キャンセル"
        dense
        outline
        class="bg-white text-primary q-mr-sm q-py-xs q-px-lg col"
        style="font-size: 12px"
        @click.stop="cancel()"
      />
      <q-btn
        flat
        dense
        label="はい"
        style="font-size: 12px"
        class="text-white bg-primary text-center q-py-xs q-px-lg col"
        @click.stop="goAhead()"
      />
    </div>
  </q-card-section>
</template>
