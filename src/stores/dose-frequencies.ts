import { defineStore } from 'pinia'
import selectOptions from '@/utils/selectOptions'
import mtUtils from '@/utils/mtUtils'

export const useDoseStore = defineStore('dose-frequency', {
  state: () => ({
    all_doses: [],
    doses: [],
    dose: null,
    recentDose: null
  }),

  getters: {
    getAllDoses: (state) => state.all_doses,
    getDoses: (state) => state.doses,
    getDose: (state) => state.dose,
    getRecentDose: (state) => state.recentDose
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectDose (id: string | number | null = null) {
      this.dose = id ? this.doses.find((v: any) => v.id_dosage_frequency === id) : null
    },

    async fetchDoses (data: any = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/dosage-frequency', data)
      if (res && res){
        this.doses = res;
        return this.doses;
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationDoses () {
      var res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/dosage-frequency')
      if (res && res){
        this.all_doses = res.map((v:any) => {
          const tempU = v.type_dose == 1 ? '回/日' : v.type_dose == 2 ? '回/週' : v.type_dose == 3 ? '回/月' : ''
          const tempS = `(${v?.quantity_dose}${tempU})`
          return {
            value: v.id_dosage_frequency,
            quantity_dose:v.quantity_dose,
            label: `${v.name_dose_short}  ${v?.quantity_dose ? tempS : ''} `,
            type_dose: v.type_dose,
            short_name: v.name_dose_short
          };
        });
        return this.all_doses;
      }
    },

  async submitDose (data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/dosage-frequency', data )
      if (res){
        this.recentDose = res;
      }
    },

  async updateDose (id: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/mst/dosage-frequency/${id}`, data);
      if (res){
        this.recentDose = res;
      }
    },

   async destroyDose (id: number | string) {
    const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/mst/dosage-frequency/${id}`);
    if (res){
      return true;
    }
    return false;
  },
  },
});

export default useDoseStore
