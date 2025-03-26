import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { sortBy } from 'lodash'

export const useDiseaseStore = defineStore('disease', {
  state: () => ({
    allDisease: [],
    listDisease: [],
    diseases: [],
    disease: null,
    recentDisease: null,
    diseaseImages: [],
  }),
  getters: {
    getAllDiseases: (state) => state.allDisease,
    getListDisease: (state) => state.listDisease,
    getDiseases: (state) => state.diseases,
    getDisease: (state) => state.disease,
    getRecentDisease: (state) => state.recentDisease,
    getDiseasImages: (state) => state.diseaseImages,
  },

  persist: true,
  actions: {

    selectDisease(id = null) {
      this.disease = id ? this.diseases.find((v) => v.id_disease === id) : null
    },

    async fetchDiseases(data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/diseases`, { params: data })
          .then((response) => {
            this.diseases = response.data.data.map((v) => {
              return {
                ...v,
                value: v.id_disease,
                label: v.name_disease
              }
            })
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async fetchDiseaseImages(diseasId) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/diseases_images/${diseasId}`)
          .then((response) => {
            this.diseaseImages = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async fetchPreparationDiseases(storedClinicId: string|null) {
      const response = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/diseases',
        { no_pagination: true, id_clinic: storedClinicId }
      )
      if (response) {
        const diseaseOption = response.map((v) => {
          return {
            value: v.id_disease,
            label: v.name_disease
          }
        })
        const diseaseOptionAll = response.map((v) => {
          return {
            ...v,
            value: v.id_disease,
            label: v.name_disease
          }
        })
        this.allDisease = [...sortBy(diseaseOption, 'display_order')]
        this.listDisease = [...sortBy(diseaseOptionAll, 'display_order')]
      }
    },

    async submitDisease(data) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/diseases', data)
          .then((response) => {
            this.recentDisease = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async updateDisease(id, data) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/diseases/${id}`, data)
          .then((response) => {
            this.recentDisease = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async importDiseases(data) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/diseases/import', data, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async exportDiseases() {
      return new Promise((resolve, reject) => {
        api
          .get('/mst/diseases/export')
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async destroyDisease(id) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/diseases/${id}`)
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

export default useDiseaseStore
