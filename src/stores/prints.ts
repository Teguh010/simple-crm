import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { PrintType } from '@/types/types'

export const usePrintStore = defineStore('prints', {
  state: () => ({
    all_prints: [] as PrintType[],
    print: {} as PrintType,
    recentPrint: null
  }),
  getters: {
    getAllPrints: (state) => state.all_prints,
    getPrint: (state) => state.print,
    getRecentPrint: (state) => state.recentPrint
  },

  // Temporary turn off the presist before stable
  persist: true,
  actions: {
    async selectPrint(id: any, forceFetch = false) {
      if (this.print && this.print.id_print === id && !forceFetch) {
        return
      }
      this.print = null
      if (id) {
        const response: any = await mtUtils.callApi(
          selectOptions.reqMethod.GET,
          `mst/print/${id}`
        )
        if (response) {
          this.print = response
          return this.print
        }
      }
    },
    async fetchPrints(data = {}) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/mst/print',
        { paginated: true, ...data }
      )
      if (response) {
        this.all_prints = response
      }
    },
    submitPrint(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('mst/print', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentPrint = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    updatePrint(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/print/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentPrint = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async fetchTextCopyablePdf(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('mst/text-selectable-print', data)
          .then((response) => {
            this.recentPrint = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    destroyPrint(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/print/${id}`)
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

export default usePrintStore
