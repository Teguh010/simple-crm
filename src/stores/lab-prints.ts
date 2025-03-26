import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import {
  LabPrint
} from '@/types/types'

export const useLabPrintStore = defineStore('labPrints', {
  state: () => ({
    labPrints: <LabPrint[]>[],
    labPrintsByPet: <LabPrint[]>[],
    labPrint: <LabPrint | null>null,
    recentLabPrint: <LabPrint | null>null,
    labPrintPdf: <LabPrint | null>null
  }),
  
  getters: {
    getLabPrints: (state) => state.labPrints,
    getLabPrint: (state) => state.labPrint,
    getRecentLabPrint: (state) => state.recentLabPrint,
    getLabPrintsByPet: (state) => state.labPrintsByPet,
    getLabPrintPdf: (state) => state.labPrintPdf
  },
  actions: {
    async fetchLabPrints(data: object) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'mst/lab-print/', data)
      if (res && res.results) {
        this.labPrints = res.results
      }
    },

    async submitLabPrint(data: object) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/lab-print/', data)
      if (res) {
        this.recentLabPrint = res
      }
    },

    async getLabPrintById(idLabPrint: string | number) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/lab-print/${idLabPrint}`)
      if (res) {
        this.labPrint = res.results
      }
    },

    async fetchLabPrintData(idLabPrint: string | number, idPet: string | number, withLabResult: boolean = false) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/lab-print/${idLabPrint}/pet/${idPet}?with_lab_results=${withLabResult}`)
      if (res) {
        this.labPrint = res.results
      }
    },

    async getLabPrintPdfById(idPet: string | number) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/lab-print/pdf/${idPet}`)
      if (res) {
        this.labPrintPdf = res.results
      }
    },

    async fetchLabPrintsByPet(idPet: number) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/lab-print/${idPet}`)
      if (res) {
        this.labPrintsByPet = res.results
      }
    },

    async updateLabPrint(idLabPrint: string | number, data: any) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/mst/lab-print/${idLabPrint}/`, data)
      if (res) {
        this.recentLabPrint = res
      }
    },

    async createLabPrintChilds (idLabPrint: string | number, data: any[]) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/mst/lab-print/${idLabPrint}/items/`, data)
      if (res) {
        this.labPrint = res
      }
    },

    async deleteLabPrint(idLabPrint: string | number) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/mst/lab-print/${idLabPrint}/`)
    },
  }
})

export default useLabPrintStore