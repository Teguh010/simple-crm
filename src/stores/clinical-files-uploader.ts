import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'

export const useClinicalFilesUploaderStore = defineStore('clinical-files-uploader', {
  state: () => ({
    clinical_file_uploader: null,
    recentClinicalFileUploader: null
  }),

  getters: {
    getClinicalFileUploader: (state) => state.clinical_file_uploader,
    getRecentClinicalFileUploader: (state) => state.recentClinicalFileUploader
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    // selectClinicalFile(id: string | number | null = null) {
    //   this.clinical_file = id
    //     ? this.clinical_files?.data?.find((v: any) => v.id_clinical_file === id)
    //     : null
    // },

    submitClinicalFileUploader(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('mst/clincal_files_uploader_url', data,{
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentClinicalFileUploader = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateClinicalFileUploader(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`mst/clincal_files_uploader_url/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentClinicalFileUploader = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyClinicalFileUploader(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`mst/clincal_files_uploader_url/${id}`)
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

export default useClinicalFilesUploaderStore
