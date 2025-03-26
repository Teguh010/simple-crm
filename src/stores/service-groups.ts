import { defineStore } from 'pinia'
// import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useServiceGroupStore = defineStore('service_group', {
  state: () => ({
    service_groups: [],
    service_group: null,
    recentServiceGroup: null,
    serviceGroupItems: []
  }),

  getters: {
    getServiceGroups: (state) => state.service_groups,
    getServiceGroup: (state) => state.service_group,
    getRecentServiceGroup: (state) => state.recentServiceGroup
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {

    selectServiceGroup (id: string | number | null = null) {
      this.service_group = id ? this.service_groups.find((v: any) => v.id_service_group === id) : null
    },

    // refactored all fetch api function to follow code rules of calling api via mtUtils.callApi() function
    async fetchServiceGroups (data = null) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/service_groups`, data)
        this.service_groups = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async submitServiceGroup (data: object) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.POST, '/mst/service_groups', data)
        this.recentServiceGroup = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async updateServiceGroup (id: number | string, data: object) {
      try {
        const response: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/service_groups/${id}`, data)
        this.recentServiceGroup = response
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    },

    async destroyServiceGroup (id: number | string) {
      try {
        await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/service_groups/${id}`)
      } catch(error) {
        mtUtils.alert(error.message, "Error!")
      }
    }
  }
})

export default useServiceGroupStore
