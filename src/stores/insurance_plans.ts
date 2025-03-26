import {defineStore} from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";

export const useInsurancePlanStore = defineStore("insurance_plan", {
  state: () => ({
    all_insurance_plans: <any>[],
    insurance_plans: <any>[],
    insurance_plan: null,
    recentInsurancePlan: null,
  }),

  getters: {
    getAllInsurancePlans: (state) => state.all_insurance_plans,
    getInsurancePlans: (state) => state.insurance_plans,
    getInsurancePlan: (state) => state.insurance_plan,
    getRecentInsurancePlan: (state) => state.recentInsurancePlan,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectInsurancePlan(id: string | number = null) {
      this.insurance_plan = id
        ? this.insurance_plans.find((v: any) => v.id_insurance_plan === id)
        : null;
    },

    async fetchInsurancePlans(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'/mst/insurance_plans', data)
      if (res && res){
        this.insurance_plans = res;
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationInsurancePlans(taskModal?: any) {
      var res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'/mst/insurance_plans',)
      if (res){
        const modifiedData = res.map((v) => {
          return {
            value: v.id_insurance_plan,
            label: v.name_insurance_plan,
          };
        });
        this.all_insurance_plans = modifiedData;
        this.insurance_plans = res;
      }
    },
    async submitInsurancePlan(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/insurance_plans', data )
      if (res){
        this.recentInsurancePlan = res;
      }
    },

    async getInsurancePlanById(id_customer: any, data = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/insurance_plans/${id_customer}`)
      if(res){
        this.insurance_plans = res
      }
    },

    async fetchPreparationInsurancePlansID(id_customer: any) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/insurance_plans/${id_customer}`)
      if(res){
        const modifiedData = {
          value: res.id_insurance_plan,
          label: res.name_insurance_plan,
          parentInsurancePlan: res.type_insurance_plan_layer,
        };
        this.all_insurance_plans = [modifiedData];
      }
    },
    async updateInsurancePlan(id_insurance_plan: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/insurance_plans/${id_insurance_plan}`, data);
      if (res){
        this.recentInsurancePlan = res;
      }
    },

    async destroyInsurancePlan(id_insurance_plan: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/insurance_plans/${id_insurance_plan}`);
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useInsurancePlanStore;
