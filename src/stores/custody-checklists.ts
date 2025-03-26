import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import aahGlobal from '@/utils/aahGlobal'
import selectOptions from '@/utils/selectOptions'
import { CustodyType, GenericValueLabelType } from '@/types/types'

export const useCustodyCheckListsStore = defineStore('custody_checklists', {
  state: () => ({
    custodyCheckLists: [] as CustodyType[],
    custodyCheckList: {} as CustodyType,
    recentcustodyCheckList: {} as CustodyType,
    allCustodyCheckLists: [] as GenericValueLabelType[]
  }),

  getters: {
    getCustodyCheckLists: (state) => state.custodyCheckLists,
    getCustodyCheckList: (state) => state.custodyCheckList,
    getRecentCustodyCheckList: (state) => state.recentcustodyCheckList,
    getAllCustodyCheckLists: (state) => state.allCustodyCheckLists
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectCustody(id: string | number | null = null) {
      this.custodyCheckList = id
        ? this.custodyCheckLists.find((v: any) => v.id_custody_checklist === id)
        : null
    },

    async fetchCustodyCheckList(data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'custody-check/list',
        data
      )
      if (res) {
        this.custodyCheckLists = res
        const modifiedData = res.map((v: any) => {
          return {
            value: v.id_custody_checklist,
            label: v.name_custody
          }
        })

        this.allCustodyCheckLists = modifiedData
      }
    },
    async submitCustodyCheckList(data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'custody-check/list',
        data
      )
      if (res) {
        this.recentcustodyCheckList = res
      }
    },

    async updateCustodyCheckList(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `custody-check/list/${id}`,
        data
      )
      if (res) {
        this.recentcustodyCheckList = res
      }
    },

    async destroyCustodyCheckList(id: number | string) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `custody-check/list/${id}`
      )
      if (res) {
        return true
      }
    }
  }
})

export default useCustodyCheckListsStore
