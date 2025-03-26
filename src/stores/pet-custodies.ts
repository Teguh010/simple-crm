import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { PetCustodyType } from '@/types/types'

export const usePetCustodyStore = defineStore("pet_custody", {
  state: () => ({
    all_pet_custodies: <any>[],
    pet_custodies: [] as PetCustodyType[],
    pet_custody: {} as PetCustodyType,
    recentPetCustody: null,
  }),

  getters: {
    getAllPetCustodies: (state) => state.all_pet_custodies,
    getPetCustodies: (state) => state.pet_custodies,
    getPetCustody: (state) => state.pet_custody,
    getRecentPetCustody: (state) => state.recentPetCustody,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectPetCustody(id: string | number = null) {
      this.pet_custody = id
        ? this.pet_custodies.find((v: PetCustodyType) => v.id_pet_custody === id)
        : null;
    },

    async fetchPetCustodies(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'pet_custody', data)
      if (res){
        this.pet_custodies = res;
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationPetCustodies(taskModal?: any) {
      var res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'pet_custody',)
      if (res){
        const modifiedData = res.map((v) => {
          return {
            value: v.id_pet_custody,
            label: v.name_pet_custody,
          };
        });
        this.all_pet_custodies = modifiedData;
        this.pet_custodies = res;
      }
    },
    async submitPetCustody(data: object) {
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'pet_custody', data )
      if (res){
        this.recentPetCustody = res;
      }
    },

    async getPetCustodyById(id_pet_custody: any, data = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `/pet_custody/${id_pet_custody}`)
      if(res){
        this.pet_custody = res
      }
    },

    async fetchPreparationPetCustodiesID(id_customer: any) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/pet_custody/${id_customer}`)
      if(res){
        const modifiedData = {
          value: res.id_pet_custody,
          label: res.name_pet_custody,
          parentPetCustody: res.type_pet_custody_layer,
        };
        this.all_pet_custodies = [modifiedData];
      }
    },
    async updatePetCustody(id_pet_custody: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `pet_custody/${id_pet_custody}`, data);
      if (res){
        this.recentPetCustody = res;
      }
    },

    async destroyPetCustody(id_pet_custody: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `pet_custody/${id_pet_custody}`);
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default usePetCustodyStore;
