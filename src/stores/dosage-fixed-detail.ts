import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useDosageFixedDetailStore = defineStore('dosage_fixed_detail', {
  state: () => ({
    dosage_fixed_detail: null,
    recent_dosage_fixed_detail: null
  }),

  getters: {
    getDosageFixedDetail: (state) => state.dosage_fixed_detail,
    getRecentDosageFixedDetail: (state) => state.recent_dosage_fixed_detail
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    getSingleDosageFixedDetail (id: any = null, data: any = {}) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/dosage-fixed-detail/${id}`, data)
          .then((response) => {
            this.dosage_fixed_detail = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitDosageFixedDetail (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/dosage-fixed-detail', data)
          .then((response) => {
            this.recent_dosage_fixed_detail = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateDosageFixedDetail (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/dosage-fixed-detail/${id}`, data)
          .then((response) => {
            this.recent_dosage_fixed_detail = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyDosageFixedDetail (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/dosage-fixed-detail/${id}`)
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

export default useDosageFixedDetailStore
