import type { Component } from 'vue'
import { Dialog, QDialogProps } from 'quasar'

import MtDialogBase from '@/components/dialogs/MtDialogBase.vue'

export const useDialogFactory = () => {
  /**
   * Opens a dialog with a specified component and props.
   * @param component - The custom Vue component to render in the dialog.
   * @param props - Props to pass to the custom dialog component.
   * @returns - Dialog lifecycle promise (onOk, onCancel, onDismiss).
   */
  const openDialog = (
    dialogCustomComponent: Component,
    props?: {
      dialogBase?: QDialogProps
      dialogContent?: Record<string, unknown>
    }
  ): ReturnType<typeof Dialog.create> => {
    return Dialog.create({
      component: MtDialogBase,
      componentProps: { ...props, dialogCustomComponent }
    })
  }

  return { openDialog }
}
