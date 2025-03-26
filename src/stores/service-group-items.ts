import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useServiceGroupItemStore = defineStore('service_group_item', {
  state: () => ({
    service_group_items: [],
    service_group_item: null,
    recentServiceGroupItem: null
  }),

  getters: {
    getServiceGroupItems: (state) => state.service_group_items,
    getServiceGroupItem: (state) => state.service_group_item,
    getRecentServiceGroupItem: (state) => state.recentServiceGroupItem
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectServiceGroupItem (id: string | number | null = null) {
      this.service_group_item = id ? this.service_group_items.find((v: any) => v.id_service_group_item === id) : null
    },

    selectServiceGroupItems (serviceGroupItems:any = []) {
      this.service_group_items = serviceGroupItems
    },

    fetchServiceGroupItems (id_service_group: string, data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/service_groups/${id_service_group}/items`, { params: data })
          .then((response) => {
            this.service_group_items = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitServiceGroupItem (id_service_group: string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`/mst/service_groups/${id_service_group}/items`, data)
          .then((response) => {
            this.recentServiceGroupItem = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateServiceGroupItem (id_service_group: string, id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/service_groups/${id_service_group}/items/${id}`, data)
          .then((response) => {
            this.recentServiceGroupItem = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyServiceGroupItem (id_service_group: string, id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/service_groups/${id_service_group}/items/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default useServiceGroupItemStore
