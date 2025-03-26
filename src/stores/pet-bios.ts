import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { dateFormat } from '@/utils/aahUtils'
import { typeBodyWeight } from '@/utils/enum'
import { PetBioInfoType } from '@/types/types';
import mtUtils from '@/utils/mtUtils';
import selectOptions from '@/utils/selectOptions';

export const usePetBioStore = defineStore("pet_bios", {
  state: () => ({
    pet_bios: [] as PetBioInfoType[],
    pet_bio: {} as PetBioInfoType,
    pet_bio_for_header: {} as PetBioInfoType,
    recentPetBio: {} as PetBioInfoType,
    petBioOptionDefault:<any>[],
  }),
  getters: {
    getPetBios: (state) => state.pet_bios,
    getPetBio: (state) => state.pet_bio,
    getPetBioForHeader: (state) => state.pet_bio_for_header,
    getRecentPetBio: (state) => state.recentPetBio,
    getPetBioOptionDefault:(state) => state.petBioOptionDefault
  },

  // Temporary turn off the presist before stable
  // persist: true,
  actions: {
    setPetBioToNull() {
      this.pet_bio = {} as PetBioInfoType
      this.pet_bios = []
      this.recentPetBio = {} as PetBioInfoType
      this.petBioOptionDefault = []
    },
    selectPetBio(id: string | number | object | null) {
      if (typeof id === 'object') this.pet_bio = id as PetBioInfoType
      else this.pet_bio = this.pet_bios.find((v: any) => { return v.id_pet_bio_info === id }) as PetBioInfoType;
    },

    fetchPetBio(data?: any, defaultPetBioId: number | null = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/pet_bio_info`, { params: data })
          .then((response) => {
            this.pet_bios = response.data.data;

            let selectedPetBio = response.data.data?.[0]

            if (defaultPetBioId) {
              if (response.data.data.find((petBio: PetBioInfoType) => petBio.id_pet_bio_info == defaultPetBioId))
                selectedPetBio = response.data.data.find((petBio: PetBioInfoType) => petBio.id_pet_bio_info == defaultPetBioId)
            } else if (response.data.data.find((petBio: PetBioInfoType) => petBio.val_weight))
              selectedPetBio = response.data.data.find((petBio: PetBioInfoType) => petBio.val_weight)
            else selectedPetBio = response.data.data?.[0]

            this.pet_bio_for_header = selectedPetBio
            this.pet_bio = selectedPetBio

            this.petBioOptionDefault = response.data.data.filter((v) => v.val_weight).map((petBioObj:any) => {
              return {...petBioObj, 
                label:`
                  ${petBioObj.type_body_weight == 1 ? parseFloat(petBioObj.val_weight) / 1000 : parseFloat(petBioObj.val_weight)} ${typeBodyWeight.find((obj:any)=> obj.value == petBioObj.type_body_weight)?.label}
                  （ ${dateFormat(petBioObj.datetime_measure, 'YYYY/MM/DD HH:mm')} ）
                  ` , 
                value:petBioObj.id_pet_bio_info}
            })
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    async submitPetBio(data: object) {
      const response = await mtUtils.callApi(selectOptions.reqMethod.POST, '/pet_bio_info', data, false, { "Content-Type": "multipart/form-data" })
      if (response) {
        this.recentPetBio = response
      }
      // return new Promise((resolve, reject) => {
      //   api
      //     .post(`/pet_bio_info`, data, {
      //       headers: { "Content-Type": "multipart/form-data" },
      //     })
      //     .then((response) => {
      //       this.recentPetBio = response.data;
      //       resolve(response);
      //     })
      //     .catch((error) => {
      //       reject(error);
      //     });
      // });
    },

    async updatePetBio(id: number | string, data: object) {
      const response = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/pet_bio_info/${id}`, data, false, { "Content-Type": "multipart/form-data" })
      if (response) {
        this.recentPetBio = response
      }

      // return new Promise((resolve, reject) => {
      //   api
      //     .put(`/pet_bio_info/${id}`, data, {
      //       headers: { "Content-Type": "multipart/form-data" },
      //     })
      //     .then((response) => {
      //       this.recentPetBio = response.data;
      //       resolve(response);
      //     })
      //     .catch((error) => {
      //       reject(error);
      //     });
      // });
    },

    destroyPetBio(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/pet_bio_info/${id}`)
          .then((response) => {
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
});

export default usePetBioStore;
