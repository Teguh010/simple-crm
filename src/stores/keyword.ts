import { defineStore } from 'pinia'

const KEYWORDS_LIMIT = 10

interface KeywordStoreState {
  serviceDetailKeywords: string[]
  prescriptionKeywords: string[]
  injectKeywords: string[]
}

export const useKeywordStore = defineStore('keyword', {
  state: (): KeywordStoreState => ({
    serviceDetailKeywords: [],
    prescriptionKeywords: [],
    injectKeywords: [],
  }),
  
  persist: true,
  
  getters: {
    getServiceDetailKeywords: (state) => state.serviceDetailKeywords,
    getPrescriptionKeywords: (state) => state.prescriptionKeywords,
    getInjectKeywords: (state) => state.injectKeywords,
  },

  actions: {
    addServiceDetailKeyword(keyword: string) {
      if (this.serviceDetailKeywords.length >= KEYWORDS_LIMIT) {
        this.serviceDetailKeywords.shift()
      }
      
      if (this.serviceDetailKeywords.find((key) => key === keyword)) {
        return 
      }
      this.serviceDetailKeywords.push(keyword)
    },
    addPrescriptionKeyword(keyword: string) {
      if (this.prescriptionKeywords.length >= KEYWORDS_LIMIT) {
        this.prescriptionKeywords.shift()
      }

      if (this.prescriptionKeywords.find((key) => key === keyword)) {
        return
      }
      this.prescriptionKeywords.push(keyword)
    },
    addInjectKeyword(keyword: string) {
      if (this.injectKeywords.length >= KEYWORDS_LIMIT) {
        this.injectKeywords.shift()
      }

      if (this.injectKeywords.find((key) => key === keyword)) {
        return
      }
      this.injectKeywords.push(keyword)
    },
    removeServiceDetailKeyword(index: number) {
      this.serviceDetailKeywords.splice(index, 1)
    },
    removePrescriptionKeyword(index: number) {
      this.prescriptionKeywords.splice(index, 1)
    },
    removeInjectKeyword(index: number) {
      this.injectKeywords.splice(index, 1)
    },
    clearServiceDetailKeywords() {
      this.serviceDetailKeywords = []
    },
    clearPrescriptionKeywords() {
      this.prescriptionKeywords = []
    },
    clearInjectKeywords() {
      this.injectKeywords = []
    }
  }
})

export default useKeywordStore
