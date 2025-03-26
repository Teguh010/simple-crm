import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useDosageVariableStore = defineStore('dosage_variable', {
  state: () => ({
    all_dosage_variable: null,
    dosage_variable: null,
    recent_dosage_variable: null
  }),

  getters: {
    getAllDosageVariable: (state) => state.all_dosage_variable,
    getDosageVariable: (state) => state.dosage_variable,
    getRecentDosageVariable: (state) => state.recent_dosage_variable
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectDosageVariable (id: string | number | null = null) {
      this.dosage_variable = id ? this.all_dosage_variable.find((v: any) => v.id_dosage_variable === id) : null
    },

    fetchDosageVariable (data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/dosage-variable`, { params: data })
          .then((response) => {
            this.all_dosage_variable = response.data.data.map(v => {
              return {
                ...v,
                value: v.id_dosage_variable,
                label: `${v.val_weight_min} ${v.val_weight_max}`
              }
            })
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    getSingleDosageVariable (id: any = null, data: any = {}) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/dosage-variable/${id}`, data)
          .then((response) => {
            this.dosage_variable = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitDosageVariable (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/dosage-variable', data)
          .then((response) => {
            this.recent_dosage_variable = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateDosageVariable (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/dosage-variable/${id}`, data)
          .then((response) => {
            this.recent_dosage_variable = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyDosageVariable (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/dosage-variable/${id}`)
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

export default useDosageVariableStore
