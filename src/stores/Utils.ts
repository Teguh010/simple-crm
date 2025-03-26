import { defineStore } from 'pinia'

export const useUtilsStore = defineStore('utils', {
  state: () => ({
    validationParam: {
      tax_rate: null,
      type_tax: null,
      id_cart_detail: null
    }

  }),

  getters: {
    getValidationParam: (state) => state.validationParam
  },

  actions: {
    setValidationParam(tax_rate, type_tax, id_cart_detail = null) {
      this.validationParam.tax_rate = tax_rate
      this.validationParam.type_tax = type_tax
      this.validationParam.id_cart_detail = id_cart_detail
    }
  }
})

export default useUtilsStore
