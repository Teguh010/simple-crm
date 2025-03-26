import { defineStore } from 'pinia'
import mtUtils from "@/utils/mtUtils";
import selectOptions from '@/utils/selectOptions';

export const useItemUnitStore = defineStore('item_unit', {
  state: () => ({
    item_units: [],
  }),

  getters: {
    getItemUnits: (state) => state.item_units
  },

  actions: {

    async fetchItemUnits(data: any = null) {
        const res:any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/mst/item_units`, data)
        if(res && res) {
          this.item_units = res
        }
    },
  }
})

export default useItemUnitStore
