import { defineStore } from 'pinia'
import { type Component, markRaw } from 'vue'
import type { ValueOf } from '@/types/types'

export const SharedValueTypes = {
  UPDATE_CALENDAR_DATE: 'UPDATE_CALENDAR_DATE',
  UPDATE_CALENDAR_DATETIME: 'UPDATE_CALENDAR_DATETIME'
} as const

export type SharedValueType = ValueOf<typeof SharedValueTypes>

export interface SharedValueObject {
  type: SharedValueType
  value: any
}

interface MovableModalStoreState {
  component: Component | null
  show: boolean
  data: any
  sharedValue: SharedValueObject | null
}

export const useMovableModalStore = defineStore('movable-modal', {
  state: (): MovableModalStoreState => ({
    component: null,
    show: false,
    data: null,
    sharedValue: null
  }),
  persist: true,
  getters: {
    getMovableModalShowStatus: (state) => state.show,
    getMovableModalComponent: (state) => state.component,
    getMovableModalData: (state) => state.data,
    getSharedValue: (state) => state.sharedValue
  },
  actions: {
    openMovableModal (data: any, component: Component) {
      this.show = true
      this.component = markRaw(component)
      this.data = data
    },
    closeMovableModal () {
      this.show = false
      this.component = null
      this.data = null
    },
    showMovableModal () {
      this.show = true
    },
    hideMovableModal () {
      this.show = false
    },
    setMovableModalComponent (component: Component) {
      this.component = markRaw(component)
    },
    clearMovableModalComponent () {
      this.component = null
    },
    setMovableModalData (data: any) {
      this.data = data
    },
    clearMovableModalData () {
      this.data = null
    },
    setSharedValue (val: SharedValueObject) {
      this.sharedValue = val
    }
  }
})
