import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { LAB } from '@/pages/master/labDevices/types_labDevices'

export const useLabDeviceStore = defineStore('labDevices', {
  state: () => ({
    allLabDevices: <LAB[]>[],
    labDevices: <LAB[]>[],
    labDevice: <LAB | null>null,
    recentLabDevice: <LAB | null>null,
    labDevicesSpecificList: <LAB[]>[],
    labRefList: <any[]>[]
  }),

  getters: {
    getAllLabDevices: (state) => state.allLabDevices,
    getLabDevices: (state) => state.labDevices,
    getLabDeviceSpecificList: (state) => state.labDevicesSpecificList,
    getLabDevice: (state) => state.labDevice,
    getRecentLabDevice: (state) => state.recentLabDevice,
    getLabRefList: (state) => state.labRefList
  },

  // persist: true,

  actions: {
    async fetchPreparationLabDevices(params = {}) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/lab_devices', params)
      if (res) {
        this.allLabDevices = res
      }
    },

    async fetchLabDevices(params = {}) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/lab_devices', params)
      if (res) {
        this.labDevices = res
      }
    },

    async fetchLabRefList(params = {}) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/lab_ref', params)
      if (res) {
        this.labRefList = res
      }
    },

    async submitLabDevice(data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.POST,'mst/lab_devices',data)
      if (res) {
        this.recentLabDevice = res
      }
    },

    async getLabDeviceById(id_lab_device: any, data = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/lab_devices/${id_lab_device}`
      )
      if (res) {
        this.labDevice = res
      }
    },

    async updateLabDevice(id_lab_device: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/mst/lab_devices/${id_lab_device}`,data)
      if (res) {
        this.recentLabDevice = res
        return true
      }
      return false
    },

    async destroyLabDevice(id_lab_device: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/mst/lab_devices/${id_lab_device}`)
      if (res) {
        return true
      }
      return false
    },

    async updateLabDeviceDisplayOrder(data: object) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/lab_devices_display_order',
        data
      )
      if (res) {
        return true
      }
      return false
    },
  }
})

export default useLabDeviceStore
