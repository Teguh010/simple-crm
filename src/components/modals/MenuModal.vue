<script lang="ts" setup>
import { defineComponent, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useModal } from '@/stores/modal'

const modal = useModal()

const {
  isOpen,
  view,
  loading,
  defaultValue,
  presistent,
  fullHeight
} = storeToRefs(modal)

const model = ref(defaultValue)

defineComponent({
  name: 'MainLayout'
})
</script>

<template>
  <q-dialog
    :model-value="isOpen"
    @hide="modal.close()"
    :persistent="presistent"
    :full-height="fullHeight"
    :class="fullHeight ? 'full-height' : ''"
  >
    <q-card
      v-if="isOpen"
      class="q-card-height basic-card q-ma-md"
    >
      <component
        v-if="!loading"
        :is="view"
        v-bind:model="model"
        v-model="model"
      />
      <q-inner-loading :showing="loading">
        <q-spinner size="50px" color="primary" />
      </q-inner-loading>
    </q-card>
  </q-dialog>
</template>

<style lang="scss" scoped>
</style>
