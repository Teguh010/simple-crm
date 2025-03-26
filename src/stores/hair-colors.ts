import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'

export const useHairColorStore = defineStore('hair_color', {
  state: () => ({
    all_hair_colors: <any>[],
    hair_colors: [],
    hair_color: null,
    recentHairColor: null,
  }),

  getters: {
    getAllHairColors: (state) => state.all_hair_colors,
    getHairColors: (state) => state.hair_colors,
    getHairColor: (state) => state.hair_color,
    getRecentHairColor: (state) => state.recentHairColor,
  },

  
  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectHairColor (id: string | number | null = null) {
      this.hair_color = id ? this.hair_colors?.data.find((v: any) => v.id_hair_color === id) : null
    },

    fetchHairColors (data: any = null) {
      if (!data) {
        data = {
          start: aahGlobal.start_pages,
          length: aahGlobal.length_pages
        }
      }
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/hair_colors`, { params: data })
          .then((response) => {
            this.hair_colors = response.data
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
    fetchPreparationHairColors () {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/hair_colors`)
          .then((response) => {
            const modifiedData = response.data.data.map(v => {
              return {
                value: v.id_hair_color,
                label: v.name_hair_color
              }
            })

            this.all_hair_colors = [...modifiedData]
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitHairColor (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/hair_colors', data)
          .then((response) => {
            this.recentHairColor = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateHairColor (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/hair_colors/${id}`, data)
          .then((response) => {
            this.recentHairColor = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyHairColor (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/hair_colors/${id}`)
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

export default useHairColorStore
