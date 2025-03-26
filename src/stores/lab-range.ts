import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { LAB_RANGE } from '@/pages/master/lab/types_lab'
import selectOptions from '@/utils/selectOptions'

export const useLabRangeStore = defineStore('labRange', {
  state: () => ({
    labRanges: <LAB_RANGE[]>[],
    labRange: <LAB_RANGE | null>null
  }),

  getters: {
    getLabRanges: (state) => state.labRanges,
    getLabRange: (state) => state.labRange
  },

  actions: {
    async fetchLabRanges(id_lab_set: number, lab_set_type: number) {
      try {
        let res: any = await mtUtils.callApi(
          'GET',
          `mst/lab_range?${lab_set_type == 1 ? `id_lab_set` : `id_lab_device`}=${id_lab_set}`
        )
        this.labRanges = res
      } catch (error) {
        this.labRanges = []
      }
    },
    async destroyLabRange(id_lab_range: number | string) {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/mst/lab-range/${id_lab_range}`
      )
      return res ? true : false
    },
  }
})

export default useLabRangeStore
