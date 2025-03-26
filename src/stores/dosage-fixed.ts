import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useDosageFixedStore = defineStore('dosage_fixed', {
  state: () => ({
    all_dosage_fixed: null,
    dosage_fixed: null,
    recent_dosage_fixed: null
  }),

  getters: {
    getAllDosageFixed: (state) => state.all_dosage_fixed,
    getDosageFixed: (state) => state.dosage_fixed,
    getRecentDosageFixed: (state) => state.recent_dosage_fixed
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectDosageFixed (id: string | number | null = null) {
      this.dosage_fixed = id ? this.all_dosage_fixed.find((v: any) => v.id_dosage_fixed === id) : null
    },

    fetchDosageFixed (data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/dosage-fixed`, { params: data })
          .then((response) => {
            this.all_dosage_fixed = response.data.data.map(v => {
              return {
                ...v,
                value: v.id_dosage_fixed,
                label: `${v.val_weight_min} ~ ${v.val_weight_max}`
              }
            })
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    getSingleDosageFixed (id: any = null, data: any = {}) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/dosage-fixed/${id}`, data)
          .then((response) => {
            this.dosage_fixed = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitDosageFixed (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/dosage-fixed', data)
          .then((response) => {
            this.recent_dosage_fixed = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateDosageFixed (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/dosage-fixed/${id}`, data)
          .then((response) => {
            this.recent_dosage_fixed = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyDosageFixed (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/dosage-fixed/${id}`)
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

export default useDosageFixedStore
