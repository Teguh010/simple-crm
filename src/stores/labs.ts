import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { LABGROUPQPARAM, LAB } from '@/pages/master/lab/types_lab'
import { LabSet } from '@/types/types'

export const useLabStore = defineStore('lab', {
  state: () => ({
    allLabs: <LAB[]>[],
    labs: <LAB[]>[],
    lab: <LAB | null>null,
    recentLab: <LAB | null>null,
    labSpecificList: <LAB[]>[],
    labSets: <LAB[]>[],
  }),

  getters: {
    getAllLabs: (state) => state.allLabs,
    getLabs: (state) => state.labs,
    getLabSpecificList: (state) => state.labSpecificList,
    getLab: (state) => state.lab,
    getRecentLab: (state) => state.recentLab,
    getLabSets: (state) => state.labSets,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectLab(id: string | number = null) {
      this.lab = id
        ? this.labs.find((v: any) => v.id_lab === id)
        : null
    },
    resetSelectedLab() { this.lab = null },
    async fetchLabs(params = {}) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/labs', params)
      if (res && res.length > 0) {
        this.labs = res
      }
    },
    async fetchLabByLabDevice(data: any | null = null, stored: string | null = null) {
      let res: LabSet[] = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/lab_by_lab_device', data
      )
      if (res) {
        this.labSets = res
      }
    },

    async fetchLabByIdCategories(params = { id_category2_lab: null, no_pagination: false }) {
      if (params.id_category2_lab) {
        if (['string', 'number'].includes(typeof params.id_category2_lab)) params.id_category2_lab = [parseInt(params.id_category2_lab)]
        params.id_category2_lab = JSON.stringify(params.id_category2_lab)
      } else delete params.id_category2_lab

      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/labs', params)
      if (res && res.length > 0) {
        this.labSpecificList = res
      }
    },

    async fetchLabsByGroup(params: LABGROUPQPARAM) {
      let keys = Object.keys(params);
      keys.forEach((key) => {
        if (params[key as keyof LABGROUPQPARAM] === '') {
          delete params[key as keyof LABGROUPQPARAM];
        }
      });
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/get_group_labs',params)
      if (res && res.length > 0) {
        this.labs = res
      }
    },

    clearLabsState() {
      this.labs = []
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationLabs() {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/labs')
      if (res) {
        const modifiedData = res.map((v: any) => {
          return {
            ...v,
            value: v.id_lab,
            label: v.name_lab
          }
        })
        this.allLabs = modifiedData
        this.labs = res
      }
    },

    async fetchLabsWithIDs(id_labs: Array<number>) {
      if (id_labs.length > 0) {
        const filter = { id_lab: id_labs.join(',') }
        var res: any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/labs', filter)
        if (res) {
          const modifiedData = res.map((v: any) => {
            return {
              ...v,
              value: v.id_lab,
              label: v.name_lab
            }
          })
          this.allLabs = modifiedData
          this.labs = res
        }
      }
    },

    async submitLab(data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.POST,'mst/labs',data)
      if (res) {
        this.recentLab = res
      }
    },

    async getLabById(id_lab: any, data = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/mst/labs/${id_lab}`
      )
      if (res) {
        this.lab = res
      }
    },

    async updateLab(id_lab: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/mst/labs/${id_lab}`,data)
      if (res) {
        this.recentLab = res
      }
    },

    async destroyLab(id_lab: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/mst/labs/${id_lab}`)
      if (res) {
        return true
      }
      return false
    }
  }
})

export default useLabStore
