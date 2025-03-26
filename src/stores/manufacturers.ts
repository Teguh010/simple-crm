import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useManufacturerStore = defineStore('manufacturer', {
  state: () => ({
    all_manufacturers: [],
    manufacturers: [],
    manufacturer: null,
    recentManufacturer: null
  }),

  getters: {
    getAllManufacturers: (state) => state.all_manufacturers,
    getManufacturers: (state) => state.manufacturers,
    getManufacturer: (state) => state.manufacturer,
    getRecentManufacturer: (state) => state.recentManufacturer
  },

  
  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectManufacturer (id: string | number | null = null) {
      this.manufacturer = id ? this.manufacturers.find((v: any) => v.id_manufacturer === id) : null
    },

    fetchManufacturers (data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/manufacturers`, { params: data })
          .then((response) => {
            this.manufacturers = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    fetchPreparationManufacturers () {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/manufacturers`)
          .then((response) => {
            const modifiedData = response.data.data.map(v => {
              return {
                value: v.id_manufacturer,
                label: v.name_manufacturer
              }
            })

            this.all_manufacturers = modifiedData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitManufacturer (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/manufacturers', data)
          .then((response) => {
            this.recentManufacturer = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateManufacturer (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/manufacturers/${id}`, data)
          .then((response) => {
            this.recentManufacturer = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyManufacturer (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/manufacturers/${id}`)
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

export default useManufacturerStore
