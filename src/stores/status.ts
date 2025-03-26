import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useStatusStore = defineStore('status', {
  state: () => ({
    statuses: [],
    status: null,
    recentStatus: null,
    allStatuses: [],
  }),

  getters: {
    getStatuses: (state) => state.statuses,
    getStatus: (state) => state.status,
    getrecentStatus: (state) => state.recentStatus,
    getAllStatuses: (state) => state.allStatuses,
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectStatus (id: string | number = null) {
      this.status = id ? this.statuses.find((v: any) => v.id_status === id) : null
    },

    fetchStatuses (data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/statuses`, { params: data })
          .then((response) => {
            this.statuses = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchAllStatuses () {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/status_all`)
          .then((response) => {
            this.allStatuses = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitStatus (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/statuses', data)
          .then((response) => {
            this.recentStatus = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateStatus (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/statuses/${id}`, data)
          .then((response) => {
            this.recentStatus = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyStatus (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/statuses/${id}`)
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

export default useStatusStore
