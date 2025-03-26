import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useDiseasesInsuredStore = defineStore('diseasesInsured', {
  state: () => ({
    all_diseases_insured: [],
    diseasesInsured: [],
    diseaseInsured: null,
    recentDiseaseInsured: null,
    nextPage: true
  }),

  getters: {
    getAllDiseasesInsured: (state) => state.all_diseases_insured,
    getDiseasesInsured: (state) => state.diseasesInsured,
    getDiseaseInsured: (state) => state.diseaseInsured,
    getNextPage: (state) => state.nextPage
  },


  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectDiseaseInsured (id: string | number | null = null) {
      this.diseaseInsured = id ? this.diseasesInsured.find((v: any) => v.id_disease_insurer === id) : null
    },

    fetchDiseasesInsured (data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/disease_insurers`, { params: data })
          .then((response) => {
            this.diseasesInsured = response.data.data
            if(response.data.next !== null){
              this.nextPage = true
            } else {
              this.nextPage = false
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitDiseaseInsured (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/disease_insurers', data)
          .then((response) => {
            this.recentDiseaseInsured = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateDiseaseInsured (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/disease_insurers/${id}`, data)
          .then((response) => {
            this.recentDiseaseInsured = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyDiseaseInsured (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/disease_insurers/${id}`)
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

export default useDiseasesInsuredStore
