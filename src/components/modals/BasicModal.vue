<script lang="ts" setup>
import { computed } from 'vue'
import useModalStore, { ModalSize } from '@/stores/modal'
import { storeToRefs } from 'pinia'

const basicModalStore = useModalStore()
const { close } = basicModalStore
const { getModalShowStatus, getModalPersistence, getModalSize, getModalComponent } = storeToRefs(basicModalStore)

const emits = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const className = computed(() => {
  switch (getModalSize.value) {
    case ModalSize.SMALL:
      return 'small-width'
    case ModalSize.MEDIUM:
      return 'medium-width'
    default:
      return 'medium-width'
  }
})
</script>

<template>
  <q-dialog
    :model-value="getModalShowStatus"
    :persistent="getModalPersistence"
    :class="className"
    :full-height="false"
    @hide="close"
  >
    <div class="basic-modal-content">
      <component
        :is="getModalComponent"
      />
    </div>
  </q-dialog>
</template>

<style lang="scss" scoped>
.basic-modal-content {
  height: 300px;
}

.small-width {
  min-width: 300px;
  max-width: 600px;
}
.medium-width {
  min-width: 600px;
  max-width: 1200px;
}
</style>
