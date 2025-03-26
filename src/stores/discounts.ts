import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useDiscountStore = defineStore('discount', {
  state: () => ({
    all_discounts: <any>[],
    discounts: <any>[],
    discount: null,
    recentDiscount: null
  }),

  getters: {
    getAllDiscounts: (state) => state.all_discounts,
    getDiscounts: (state) => state.discounts,
    getDiscount: (state) => state.discount,
    getRecentDiscount: (state) => state.recentDiscount
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectDiscount(id: string | number = null) {
      this.discount = id
        ? this.discounts.find((v: any) => v.id_discount === id)
        : null
    },

    async fetchDiscounts(data: any) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/discounts',
        data
      )
      if (res && res) {
        this.discounts = res
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationDiscounts(taskModal?: any) {
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/discounts'
      )
      if (res) {
        const modifiedData = res.map((v) => {
          return {
            value: v.id_discount,
            label: v.discount_rate
          }
        })
        this.all_discounts = modifiedData
        this.discounts = res
      }
    },

    async submitDiscount(data: object) {
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/discounts',
        data
      )
      if (res) {
        this.recentDiscount = res
      }
    },

    async getDiscountById(id_discount: any, data = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/discounts/${id_discount}`
      )
      if (res) {
        this.discounts = res
      }
    },

    async updateDiscount(id_discount: number | string, data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/mst/discounts/${id_discount}`,
        data
      )
      if (res) {
        this.recentDiscount = res
      }
    },

    async destroyDiscount(id_discount: number | string) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/mst/discounts/${id_discount}`
      )
      if (res) {
        return true
      }
      return false
    }
  }
})

export default useDiscountStore
