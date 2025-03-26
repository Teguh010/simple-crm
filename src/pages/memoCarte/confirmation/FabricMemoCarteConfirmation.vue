<script setup lang="ts">
import { defineEmits, defineProps, withDefaults } from 'vue';

const props = withDefaults(
  defineProps<{
    popup: {
      value: 'createNew' | 'replace' | string
    }
  }>(), {
    popup: {
      value: ''
    }
  }
)

const emit = defineEmits<{
  (e: 'close'): void
}>()

const closeModal = () => {
  emit('close')
}

const handleConfirmationClick = (v: string) => {
  props.popup.value = v
  closeModal()
}
</script>
<template>
  <div class="flex column gap-2 q-pa-md">
    <span>How do you want to save this image?</span>
    <div class="flex gap-2 items-center">
      <q-btn color="primary" outline unelevated @click="handleConfirmationClick('createNew')">Create New Record</q-btn>
      <q-btn color="primary" unelevated @click="handleConfirmationClick('replace')">Replace Old Record</q-btn>
    </div>
  </div>
</template>