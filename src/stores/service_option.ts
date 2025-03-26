import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useServiceOptionStore = defineStore('service_options', {
  state: () => ({
    all_service_options: [],
    service_options: [],
    service_option: null,
    recent_service_option: null
  }),

  getters: {
    getAllServiceOptions: (state) => state.all_service_options,
    getServiceOptions: (state) => state.service_options,
    getServiceOption: (state) => state.service_option,
    getRecentServiceOption: (state) => state.recent_service_option
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectServiceOption(id: string | number | null = null) {
      this.service_option = id
        ? this.service_options.find((v: any) => v.id_service_detail === id)
        : null
    },
    async fetchServiceOptions(data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/item_service_options',
        data
      )
      if (res && res) {
        this.service_options = res
        const modifiedData = res.map((v: any) => {
          return {
            ...v,
            value: v.id_item_service_option,
            label: v.name_item_service_option
          }
        })
        this.all_service_options = modifiedData
      }
    },
    async fetchServiceOptionById(id: number | string) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `mst/item_service_options/${id}`
      )
      if (res && res) {
        this.service_options = res
      }
    },
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    async fetchPreparationServiceOptions() {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/item_service_options'
      )
      if (res && res) {
        const modifiedData = res.map((v: any) => {
          return {
            ...v,
            value: v.id_item_service_option,
            label: v.name_item_service_option
          }
        })
        this.all_service_options = modifiedData
      }
    },

    async submitServiceOptions(data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/item_service_options',
        data
      )
      if (res && res) {
        this.recent_service_option = res
      }
    },
    async updateServiceOption(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `mst/item_service_options/${id}`,
        data
      )
      if (res && res) {
        this.recent_service_option = res
      }
    },
    async destroyServiceOption(id: number | string) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `mst/item_service_options/${id}`
      )
      if (res && res) {
        return true
      }
      return false
    }
  }
})
