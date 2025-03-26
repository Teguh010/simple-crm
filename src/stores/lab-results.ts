import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { LabResult } from '@/types/types'

export const useLabResultStore = defineStore('labResult', {
  state: () => ({
    allLabResults: [] as LabResult[],
    labResults: [] as LabResult[],
    labResult: null,
    recentLabResult: null,
    labResultsByPet: [] as LabResult[],
    labResultPrepListGrouped: [] as LabResult[],
    labResultPrepList: [] as LabResult[],
    next: null,
    labResultOther: [] as LabResult[],
  }),

  getters: {
    getAllLabResults: (state) => state.allLabResults,
    getLabResults: (state) => state.labResults,
    getLabResultsByPet: (state) => state.labResultsByPet,
    getLabResult: (state) => state.labResult,
    getRecentLabResult: (state) => state.recentLabResult,
    getLabResultPrepListGrouped: (state) => state.labResultPrepListGrouped,
    getLabResultPrepList: (state) => state.labResultPrepList,
    getLabResultOther: (state) => state.labResultOther,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    resetLabResultByPet () { this.labResultsByPet = [] },

    extendLabResultListByPet(value) {
      this.labResultsByPet.push(...value)
    },
    async selectLabResult(id: string | number = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `lab_results/${id}`)
      if (res && res) {
        this.labResult = res
      }
    },

    async fetchLabResults(data: object | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'lab_results', data)
      if (res && res) {
        this.labResults = res
      }
    },

    async fetchOtherLabResults(data: object | null = null) {
      // Purpose : for get other results for comparison pdf data
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'lab_results', data)
      if (res && res) {
        this.labResultOther = res
      }
    },

    async fetchLabResultsByPet(id_pet: string | null = null, data: object | null = null, fetchNext: boolean = false) {
      if (fetchNext && !this.next) {
        await mtUtils.autoCloseAlert('指定の条件下で全てのデータを呼び出しました。')
        return
      }
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'lab_results', {
        id_pet, ...data,
        // page: this.next
      }, true)
      if (res && res) {
        if (!fetchNext) {
          this.labResultsByPet = res.data
        }
        // if (fetchNext) {
        //   this.extendLabResultListByPet(res.data)
        // }
        // if (res.next) {
        //   this.next = res.next.split('page=')[1]
        //   console.log('next page:', this.next)
        //   return
        // }
        // this.next = null
      }
    },

    async fetchLabDataPrepList(data: object | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'lab_result_prep_grouped', data)
      if (res && res) {
        this.labResultPrepListGrouped = res
      }
    },
    async fetchLabDataPrepListDetail(data: object | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'lab_result_prep_list', data)
      if (res && res) {
        this.labResultPrepList = res
      }
    },

    async revertBulkLabResultPrep(data: object | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,'bulk_lab_result_prep_revert', data)
      if (res) return true
      return false
    },
    

    async submitLabResult(data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.POST,'lab_results',{...data})
      if (res) {
        this.recentLabResult = res
      }
    },

    async updateLabResult(data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,'bulk_update_lab_results',{...data})
      if (res) {
        this.recentLabResult = res
      }
    },

    async updateLabResultsPrepBulk(data: object | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.POST,'bulk_lab_result_prep_update', {...data})
      return res
      // if (res && res) {
      //   this.labResultPrepListGrouped = res
      // }
    },

    async getLabResultById(id_lab_result: any, data = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/lab_results/${id_lab_result}`)
      if (res) {
        this.labResults = res
      }
    },

    async updateSingleLabResult(id_lab_result: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/lab_results/${id_lab_result}`,data)
      if (res) {
        this.recentLabResult = res
      }
    },

    async destroyLabResultPrep(id_lab_result_prep: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/lab_result_prep/${id_lab_result_prep}`)
      if (res) {
        return true
      }
      return false
    },

    async destroyBulkLabResultPrep(data: any) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.POST,'bulk_lab_result_prep_delete', {...data})
      // const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/lab_result_prep/${id_lab_result_prep}`)
      if (res) {
        return true
      }
      return false
    },

    async destroyLabResult(id_lab_result: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/lab_results/${id_lab_result}`)
      if (res) {
        return true
      }
      return false
    }
  }
})

export default useLabResultStore
