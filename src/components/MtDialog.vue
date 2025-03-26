<script setup lang="ts">
  import {ref} from 'vue'

  const props = defineProps<{
    title: string;
    message: string;
  }>();
  const flgShow = ref(true)
  const emits = defineEmits(['close'])

  function close(){
    emits('close')
  }
</script>

<template>
  <div v-close-popup="flgShow" class="bg-secondary">
      <q-toolbar class="flex justify-end">
        <q-btn @click="close" flat round dense icon="close" />
      </q-toolbar>
    <q-card >
      <q-card-section v-if="props.title">
        <div class="text-h6">{{ props.title }}</div>
      </q-card-section>
      <q-card-section :class="props.title === null ? 'q-pt-md' : 'q-pt-none'" class="q-pt-none message">
        {{props.message}}
      </q-card-section>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.message{
  white-space: pre-wrap;
}
.popup-header {
  background: $white;
  color: $grey-800;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
}

.popup-footer {
  background: $grey-900;
}
</style>
