import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'

export const useNlClinicalFilesStore = defineStore('nl-clinical-files', {
  state: () => ({
    nl_clinical_files: [],
    all_nl_clinical_files: [],
    nl_clinical_file: null,
    recentNlClinicalFile: null,
  }),

  getters: {
    getNlClinicalFiles: (state) => state.nl_clinical_files,
    getAllNlClinicalFiles: (state) => state.all_nl_clinical_files,
    getNlClinicalFile: (state) => state.nl_clinical_file,
    getRecentNlClinicalFile: (state) => state.recentNlClinicalFile
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {

    setAllNlClinicalFiles(nlClinicalFiles: any){
      this.all_nl_clinical_files = nlClinicalFiles
    },
    
    checkNlClinicalFileUploaderToken(token: String) {
      return new Promise((resolve, reject) => {
        api
          .get(`nl/clinical_files/token-check`,{params: {token: token}})
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitNlClinicalFile(token: string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`nl/clinical_files?token=${token}`, data,{
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentNlClinicalFile = response.data
            // localStorage.setItem("token", token)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyNlClinicalFile(token: string, id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`nl/clinical_files/${id}?token=${token}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyNlClinicalFileUploader(id: string, token: String) {
      return new Promise((resolve, reject) => {
        api
          .delete(`nl/clinical_files/token-delete/${id}`,{params: {token: token}})
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

export default useNlClinicalFilesStore
