import {defineStore} from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";

export const useSpecialBusinessDayStore = defineStore("special_business_day", {
  state: () => ({
    businessDays: <any>[],
    businessDay: null,
    recentBusinessDay: null,
  }),

  getters: {
    getSpecialBusinessDays: (state) => state.businessDays,
    getSpecialBusinessDay: (state) => state.businessDay,
    getRecentSpecialBusinessDay: (state) => state.recentBusinessDay,
  },

  // Temporary turn off the presist before stable
  persist: false,

  actions: {
    selectSpecialBusinessDay(id: string | number = null) {
      this.businessDay = id
        ? this.getSpecialBusinessDays.find((v: any) => v.id_special_business_day === id)
        : null;
    },

    async fetchSpecialBusinessDays(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'special_business_days', data)
      if (res && res){
        this.businessDays = res;
      }
    },
    
    async submitSpecialBusinessDay(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'special_business_days', data )
      if (res){
        this.recentBusinessDay = res;
      }
    },

    async updateSpecialBusinessDay(id_special_business_day: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/special_business_days/${id_special_business_day}`, data);
      if (res){
        this.recentBusinessDay = res;
      }
    },

    async destroySpecialBusinessDay(id_special_business_day: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/special_business_days/${id_special_business_day}`);
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useSpecialBusinessDayStore;
