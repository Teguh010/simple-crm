import { defineStore } from "pinia";
import { api } from "@/boot/axios";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";
import { getDateToday } from "@/utils/aahUtils";

export const usePetInsuranceStore = defineStore("pet_insurances", {
  state: () => ({
    pet_insurances: [],
    pet_insurance: null,
    recentPetInsurance: null,
  }),
  getters: {
    getPetInsurances: (state) => state.pet_insurances,
    getPetInsurance: (state) => state.pet_insurance,
    getRecentPetInsurance: (state) => state.recentPetInsurance,
  },

  actions: {
    selectPetInsurance(id: string | number) {
      this.pet_insurance = this.pet_insurances.find((v: any) => v.id_pet_insurance === id);
    },

    async fetchPetInsurances(data: any | null = null) {
      try {
        let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'pet_insurances', data);
        if (res) {
          this.pet_insurances = res; 
    
          if (res.length > 0) {
            const activePetInsurances = res.filter((v: any) => 
              v.date_insurance_start <= getDateToday() && 
              v.date_insurance_end >= getDateToday()
            );
    
            if (activePetInsurances.length > 0) {
              if (activePetInsurances.length > 1) {
                const mainPetInsurance = activePetInsurances.find((v) => v.flg_insurance_main);
                this.pet_insurance = mainPetInsurance || activePetInsurances[0];
              } else {
                this.pet_insurance = activePetInsurances[0];
              }
            } else {
              this.pet_insurance = null;
            }
          } else {
            this.pet_insurance = null;
          }
        } else {
          this.pet_insurances = [];
          this.pet_insurance = null;
        }
      } catch (error) {
        console.error('Failed to fetch pet insurances:', error);
        
        this.pet_insurances = [];
        this.pet_insurance = null;
      }
    },    
    async fetchPreparationPetInsurances() {
      var res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'mst/pet_insurances',)
      if (res){
        const modifiedData = res.map((v) => {
          return {
            value: v.id_pet_insurance,
            label: v.name_pet_insurance,
          };
        });
        this.pet_insurances = modifiedData;
      }
    },
    async submitPetInsurance(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, '/pet_insurances', data )
      if (res){
        this.recentPetInsurance = res;
      }
    },
    async updatePetInsurance(id: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/pet_insurances/${id}`, data);
      if (res){
        this.recentPetInsurance = res;
      }
    },

    async destroyPetInsurance(idPet: number | string, idPetInsurance: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/pets/${idPet}/pet_insurances/${idPetInsurance}`, {}, true, {}, false, true);
      if (res.code == '200'){
        return true;
      }
      else if (res.status === 400 && res.data && res.data?.data.includes("associated with a cart")) {
        await mtUtils.alert('過去に保険会計のデータと紐づいているため削除できません。')
        return Promise.reject(new Error('This PetInsurance is currently associated with a cart.'));
      }
      return false;
    },
  },
});

export default usePetInsuranceStore;
