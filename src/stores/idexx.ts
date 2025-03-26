import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useIdexxStore = defineStore('idexx', {
  state: () => ({
    recentIdexx: <object | null>null,
    idexxBreedList: <object[] | null>null,
  }),

  getters: {
    getRecentIdexx: (state) => state.recentIdexx,
    getIdexxBreedList: (state) => state.idexxBreedList,
  },

  // persist: true,

  actions: {
    async updateDatasetIdexx(data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'idexx_ivls_devices', data)
      if (res) {
        this.recentIdexx = res
      }
    },
    async fetchIdexxBreedList() {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'idexx_ref_breed')

      if (res) {
        this.idexxBreedList = res
      }
    },
  }
})

export default useIdexxStore
