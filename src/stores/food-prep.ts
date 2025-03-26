import {defineStore} from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { GenericValueLabelType } from '@/types/types';

export const useFoodPrepStore = defineStore('food_prep', {
  state: () => ({
    food_preps: [],
    all_food_preps: [] as GenericValueLabelType[],
    food_prep:null,
    recentFoodPrep: null,
    search_food_prep : [],
  }),
  getters: {
    getFoodPreps: (state) => state.food_preps,
    getAllFoodPreps: (state) => state.all_food_preps,
    getFoodPrep: (state) => state.food_prep,
    getRecentFoodPrep: (state) => state.recentFoodPrep,
    getSearchedFoodPreps:(state) => state.search_food_prep
  },
  
  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectFoodPrep(id: string | number = null) {
      this.food_prep = id
        ? this.food_preps.find((v: any) => v.id_food_prep === id)
        : null; 
    },

    async fetchFoodPreps(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/food_prep', data)
      if (res && res){
        this.food_preps = res;
        this.search_food_prep = res;
      }
    },
    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationFoodPreps() {
      const res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/food_prep',)
      if (res){
        const modifiedData = res.map((v:any) => {
          return {
            value: v.id_food_prep,
            label: v.name_food_prep,
            name_food_prep: v.name_food_prep
          };
        });
        this.all_food_preps = modifiedData;
        this.food_preps = res;
      }
    },
    async submitFoodPrep(data: object) {
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/food_prep', data )
      if (res){
        this.recentFoodPrep = res;
      }
    },
    async updateFoodPrep(id_foodPrep: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT,`mst/food_prep/${id_foodPrep}`, data);
      if (res){
        this.recentFoodPrep = res;
        
      }
    },
    async destroyFoodPrep(id_foodPrep: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `mst/food_prep/${id_foodPrep}`);
      if (res){
        return true;
      }
      return false;
    }
  }
})

export default useFoodPrepStore