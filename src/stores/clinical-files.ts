import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { ClinicalFile } from '@/types/types'

export const useClinicalFilesStore = defineStore('clinical-files', {
  state: () => ({
    clinical_files: [] as ClinicalFile[],
    all_clinical_files: [] as ClinicalFile[],
    clinical_file: null,
    recentClinicalFile: null,
    nextPage: null,
    visitedPages: [],
    selectedClinicalFileComparison: [] as ClinicalFile[],
  }),

  getters: {
    getClinicalFiles: (state) => state.clinical_files,
    getAllClinicalFiles: (state) => state.all_clinical_files,
    getClinicalFile: (state) => state.clinical_file,
    getRecentClinicalFile: (state) => state.recentClinicalFile,
    getSelectedClinicalFileComparison: (state) => state.selectedClinicalFileComparison,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    resetState() {
      this.nextPage = null
      this.visitedPages = []
    },
    extendClinicalFileList(data: any, modifiedData: any) {

      this.all_clinical_files.push(...modifiedData)
      this.clinical_files.push(...data)
    },
    selectClinicalFile(id: string | number | null = null) {
      this.clinical_file = id
        ? this.clinical_files?.data?.find((v: any) => v.id_clinical_file === id)
        : null
    },

    setSelectedClinicalFileComparison(value: ClinicalFile[]) {
      this.selectedClinicalFileComparison = value
    },
    resetSelectedClinicalFileComparison() {
      this.selectedClinicalFileComparison = [] as ClinicalFile[]
    },

    fetchClinicalFiles(data: any = null, fetchNext: boolean = false) {
      return new Promise((resolve, reject) => {

        if (fetchNext && !this.nextPage) {
          reject('Fetch Next is not available')
          return
        }
        
        api
          .get(`clinical_files`, { params: {
            ...data, 
            // page: this.nextPage // commenting page because caused error on the staging
          } })
          .then((response) => {
            const modifiedData = response.data.data.map((v: any) => {
              return {
                value: v.id_clinical_file,
                label: v.code_clinical_file + ' ' + v.memo_clinical_file
              }
            })

            if (!fetchNext) {
              this.all_clinical_files = modifiedData
              this.clinical_files = response.data.data
            }

            if (fetchNext && !this.visitedPages.includes(this.nextPage)) {
              this.extendClinicalFileList(response.data.data, modifiedData)
              this.visitedPages.push(response?.data?.current)
            }

            if (response.data.next) {
              this.nextPage = response.data.next.split('page=')[1]
            } else {
              this.nextPage = null
            }

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitClinicalFile(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('clinical_files', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentClinicalFile = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateClinicalFile(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`clinical_files/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            this.recentClinicalFile = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyClinicalFile(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`clinical_files/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    getClinicalFileDcmUrl(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .get(`clinical_file_dcm_view/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    getPatientClinicalFilesDcmUrls(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`clinical_file_dcm_view`, data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyDcmViewerFile(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`delete_clinical_file_dcms`, data)
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

export default useClinicalFilesStore
