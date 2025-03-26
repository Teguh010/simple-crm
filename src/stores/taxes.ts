import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { typeTax } from '@/utils/enum'

export const useTaxStore = defineStore('taxes', {
  state: () => ({
    taxes: [],
  }),

  getters: {
    getTaxes: (state) => state.taxes,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    fetchTaxes(data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/taxes`, { params: data })
          .then((response) => {
            const modifiedData = response.data.data.map((v) => {
              return {
                value: v.id_tax,
                label: typeTax.find(
                  (vu) => vu.value === v.type_tax
                )?.label,
                tax_rate: v.tax_rate,
                type_tax: v.type_tax
              }
            })
            this.taxes = modifiedData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
  }
})

export default useTaxStore
