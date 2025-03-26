import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'
import { CustodyChecklistType } from '@/types/types'

export const useCustodyStore = defineStore('custody', {
  state: () => ({
    custodies: [] as CustodyChecklistType[],
    custody: {} as CustodyChecklistType,
    recentcustody: {} as CustodyChecklistType
  }),

  getters: {
    getCustodies: (state) => state.custodies,
    getCustody: (state) => state.custody,
    getRecentCustody: (state) => state.recentcustody
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {

    selectCustody (id: string | number | null = null) {
      this.custody = id ? this.custodies?.data.find((v: any) => v.id_custody === id) : null
    },

    fetchCustodies (data: any = null) {
      if (!data) {
        data = {
          start: aahGlobal.start_pages,
          length: aahGlobal.length_pages
        }
      }
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/custodies`, { params: data })
          .then((response) => {
            this.custodies = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitCustody (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/custodies', data)
          .then((response) => {
            this.recentcustody = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateCustody (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/custodies/${id}`, data)
          .then((response) => {
            this.recentcustody = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyCustody (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/custodies/${id}`)
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

export default useCustodyStore
