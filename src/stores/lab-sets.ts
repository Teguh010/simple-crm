import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { orderBy } from 'lodash'
import { LabSet } from '@/types/types'

export const useLabSetStore = defineStore('lab_set', {
  state: () => ({
    allLabSets: [] as LabSet[],
    labSets: [] as LabSet[],
    labSet: {} as LabSet,
    recentLabSet: {} as LabSet,
    recentLabSetByCategory: {} as Array<LabSet>,
    selectedLabSet: [] as object[],
  }),
  getters: {
    getAllLabSets: (state) => state.allLabSets,
    getLabSets: (state) => state.labSets,
    getLabSet: (state) => state.lab_set,
    getRecentLabSet: (state) => state.recentLabSet,
    getRecentLabSetByCategory: (state) => state.recentLabSetByCategory,
    getSelectedLabSet: (state) => state.selectedLabSet,
  },

  actions: {
    setSelectedLabSet(value: Array<object>) {
      this.selectedLabSet = value;
    },
    resetSelectedLabSet() {
      this.selectedLabSet = [];
    },

    async fetchLabSets(data: any | null = null, stored: string | null = null){
      let res: LabSet[] = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/lab_set',
        data
      )
      if (res) {
        this.labSets = res
      }
    },

    async fetchPreparationLabSets(data: any | null = null, stored: string | null = null){
      let res: LabSet[] = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/lab_set',
        data
      )
      if (res) {
        this.allLabSets = res
      }
    },

    async fetchLabByLabDevice(data: any | null = null, stored: string | null = null) {
      let res: LabSet[] = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/lab_by_lab_device', data
      )
      if (res) {
        this.labSets = res
      }
    },

    async submitLabSet(data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/lab_set',
        data
      )
      if (res) {
        this.recentLabSet = res
        return true
      }
      return false
    },

    async submitLabSetByCategory(data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/lab_set_by_category',
        data
      )
      if (res) {
        this.recentLabSet = res
        return true
      }
      return false
    },

    async getLabSetById(id_lab_set: number) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/lab_set/${id_lab_set}`
      )
      if (res) {
        this.labSet = res
      }
    },

    async updateLabSet(id_lab_set: number, data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/mst/lab_set/${id_lab_set}`,
        data
      )
      if (res) {
        this.recentLabSet = res
        return true
      }
      return false
    },

    async updateLabSetByCategory(id_category: number, data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/mst/lab_set_by_category/${id_category}`,
        data
      )
      if (res) {
        this.recentLabSetByCategory = res
        return true
      }
      return false
    },

    async destroyLabSet(id_lab_set: number | string) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/mst/lab_set/${id_lab_set}`
      )
      return res ? true : false
    },

    async updateLabSetDisplayOrder(data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/lab_set_display_order',
        data
      )
      if (res) {
        return true
      }
      return false
    },
  }
})

export default useLabSetStore
