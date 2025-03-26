<script setup lang="ts">
import type { Component } from 'vue'
import { QDialog, useDialogPluginComponent } from 'quasar'
import type { QDialogProps } from 'quasar'

type DialogProps = {
  dialogBase?: QDialogProps
  dialogCustomComponent: Component
  dialogContent?: Record<string, unknown>
}
const props = defineProps<DialogProps>()
const emits = defineEmits([...useDialogPluginComponent.emits])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent()
</script>

<template>
  <q-dialog
    ref="dialogRef"
    :persistent="props.dialogBase?.persistent"
    :no-esc-dismiss="
      props.dialogBase?.noEscDismiss ?? !props.dialogBase?.persistent
    "
    :no-backdrop-dismiss="
      props.dialogBase?.noBackdropDismiss ?? !props.dialogBase?.persistent
    "
    :no-route-dismiss="
      props.dialogBase?.noRouteDismiss ?? !props.dialogBase?.persistent
    "
    :auto-close="props.dialogBase?.autoClose"
    :no-refocus="props.dialogBase?.noRefocus"
    :no-focus="props.dialogBase?.noFocus"
    :seamless="props.dialogBase?.seamless"
    :maximized="props.dialogBase?.maximized"
    :full-width="props.dialogBase?.fullWidth"
    :full-height="props.dialogBase?.fullHeight"
    :position="props.dialogBase?.position"
    :square="props.dialogBase?.square"
    :transition-show="props.dialogBase?.transitionShow"
    :transition-hide="props.dialogBase?.transitionHide"
    :transition-duration="props.dialogBase?.transitionDuration"
    @hide="onDialogHide"
  >
    <component
      :is="props.dialogCustomComponent"
      v-bind="props.dialogContent"
      @onClose="onDialogHide"
      @onSubmit="onDialogOK"
      @onCancel="onDialogCancel"
    />
  </q-dialog>
</template>

<style scoped></style>
