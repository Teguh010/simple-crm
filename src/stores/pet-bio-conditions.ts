import {defineStore} from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";

export const usePetBioConditionStore = defineStore("pet_bio_condition", {
  state: () => ({
    all_pet_bio_conditions: <any>[],
    pet_bio_conditions: <any>[],
    pet_bio_condition: null,
    recentPetBioCondition: null,
  }),

  getters: {
    getAllPetBioConditions: (state) => state.all_pet_bio_conditions,
    getPetBioConditions: (state) => state.pet_bio_conditions,
    getPetBioCondition: (state) => state.pet_bio_condition,
    getRecentPetBioCondition: (state) => state.recentPetBioCondition,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectPetBioCondition(id: string | number = null) {
      this.pet_bio_condition = id
        ? this.pet_bio_conditions.find((v: any) => v.id_pet_bio_condition === id)
        : null;
    },

    async fetchPetBioConditions(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'pet_bio_condition', data)
      if (res && res){
        this.pet_bio_conditions = res;
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationPetBioConditions(taskModal?: any) {
      var res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'pet_bio_condition',)
      if (res){
        const modifiedData = res.map((v) => {
          return {
            value: v.id_pet_bio_condition,
            label: v.name_pet_bio_condition,
            parentPetBioCondition: v.type_pet_bio_condition_layer,
          };
        });
        this.all_pet_bio_conditions = modifiedData;
        this.pet_bio_conditions = res;
      }
    },
    async submitPetBioCondition(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'pet_bio_condition', data )
      if (res){
        this.recentPetBioCondition = res;
      }
    },

    async getPetBioConditionById(id_customer: any, data = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/pet_bio_condition/${id_customer}`)
      if(res){
        this.pet_bio_conditions = res
      }
    },

    async fetchPreparationPetBioConditionsID(id_customer: any) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/pet_bio_condition/${id_customer}`)
      if(res){
        const modifiedData = {
          value: res.id_pet_bio_condition,
          label: res.name_pet_bio_condition,
          parentPetBioCondition: res.type_pet_bio_condition_layer,
        };
        this.all_pet_bio_conditions = [modifiedData];
      }
    },
    async updatePetBioCondition(id_pet_bio_condition: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/pet_bio_condition/${id_pet_bio_condition}`, data);
      if (res){
        this.recentPetBioCondition = res;
      }
    },

    async destroyPetBioCondition(id_pet_bio_condition: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/pet_bio_condition/${id_pet_bio_condition}`);
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default usePetBioConditionStore;
