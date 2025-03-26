import { Component, markRaw } from 'vue'
import { defineStore } from 'pinia'

interface ModalStoreState {
  component: Component | null
  show: boolean
  data: ModalStoreData | null
  loading: boolean
  persistent: boolean
  size: ModalSize
}

export enum ModalSize {
  SMALL = 'small',
  MEDIUM = 'medium',
}

export type BasicModalParam = Partial<ModalStoreState>

interface ModalStoreData {
  submitFn?: () => Promise<void>
  [key: string]: any
}

export const useModalStore = defineStore('modal', {
  state: (): ModalStoreState => ({
    component: null,
    show: false,
    data: null,
    loading: false,
    persistent: false,
    size: ModalSize.MEDIUM,
  }),
  
  getters: {
    getModalData: (state) => state.data,
    getModalShowStatus: (state) => state.show,
    getModalComponent: (state) => state.component,
    getModalPersistence: (state) => state.persistent,
    getModalSize: (state) => state.size,
    getModalLoading: (state) => state.loading
  },

  actions: {
    open(
      {
        component,
        data,
        persistent = false,
        loading = false,
        size = ModalSize.MEDIUM
      }: BasicModalParam
    ): void {
      this.component = component ? markRaw(component) : null
      this.data = data || null
      this.persistent = persistent
      this.loading = loading
      this.size = size
      this.show = true
    },
    
    close(): void {
      this.component = null
      this.data = null
      this.persistent = false
      this.show = false
      this.size = ModalSize.MEDIUM
    },

    toggleLoading(value: boolean): void {
      this.loading = value
    },
  }
})

export default useModalStore
