import {defineStore} from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";
import { TermType } from "@/types/types";

export const useTerm = defineStore("term", {
  state: () => ({
    searchParam: null,
    searchCount: 0,
    terms: [] as TermType[],
    term: null,
    recentTerm: null,
  }),

  getters: {
    getTerms: (state) => state.terms,
    getTerm: (state) => state.term,
    getRecentTerm: (state) => state.recentTerm
  },

  actions: {
    selectTerm(id: string | number | null = null) {
      if (this.terms.length > 0) {
        this.term = id && this.terms ? this.terms.find((v: any) => v.id_task === id) : null;
      } else {
        this.term = id && this.terms ? this.terms.find((v: any) => v.id_task === id) : null;
      }
    },
    async fetchTerms(data: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'/mst/get-terms-list', data)
      if (res){
        this.terms = res;
      }
    },
    async submitTerm(data: object, url: string = '/mst/terms') {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, url, data)
      if (res){
        this.recentTerm = res;
      }
    },
    async updateTerm(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`/mst/terms/${id}`, data )
      if (res){
        this.recentTerm = res;
      }
    },
   async destroyTerm(id: number | string) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/mst/terms/${id}` )
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useTerm;
