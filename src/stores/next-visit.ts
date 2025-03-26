import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from "@/utils/mtUtils";
import aahGlobal from '@/utils/aahGlobal'
import selectOptions from '@/utils/selectOptions';

export const useNextVisitStore = defineStore('next_visit', {
  state: () => ({
    nextVisitLists: [],
    nextVisitList: null,
    recentNextVisitList: null
  }),

  getters: {
    getNextVisitLists: (state) => state.nextVisitLists,
    getNextVisitList: (state) => state.nextVisitList,
    getRecentNextVisitList: (state) => state.recentNextVisitList
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {

    selectNextVisit (id: string | number | null = null) {
      this.nextVisitList = id ? this.nextVisitLists.find((v: any) => v.id_next_visit === id) : null
    },

    async fetchNextVisitList (data: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'next_visit', data)
      if (res && res){
        this.nextVisitLists = res;
      }
      
    },

    async submitNextVisitList (data: object) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.POST,'next_visit', data)
      if (res && res){
        this.recentNextVisitList = res;
      }
    },

    async updateNextVisitList (id: number | string, data: object) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`next_visit/${id}`, data)
      if (res && res){
        this.recentNextVisitList = res;
      }
    },

    async destroyNextVisitList (id: number | string) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `next_visit/${id}`)
      if (res && res){
        return true;
      }
    }
  }
})

export default useNextVisitStore
