import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useDownloadCenterStore = defineStore('download_center', {
  state: () => ({
    download_center_files: [],
  }),

  getters: {
    getDownloadCenterFiles: (state) => state.download_center_files,
  },

  actions: {
    async fetchDownloadCenterFiles(id_clinic: String) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `mst/download-center-files/${id_clinic}`
      )
      if (res) {
        this.download_center_files = res
      }
    },
  }
})

export default useDownloadCenterStore
