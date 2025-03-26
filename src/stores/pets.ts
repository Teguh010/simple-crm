import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { PetType } from '@/types/types'
import useCustomerStore from './customers';

export const usePetStore = defineStore('pets', {
  state: () => ({
    pets: [] as PetType[],
    pet: {} as PetType,
    recentPet: null,
    petPreventativeDetail: null,
    petFoodShampooList: [],
    petMemos: [] as { id: number; memo: string }[],
    petUpdated: false,
  }),
  getters: {
    getPets: (state) => state.pets,
    getPet: (state) => state.pet,
    getRecentPet: (state) => state.recentPet,
    getPetPreventativeDetail: (state) => state.petPreventativeDetail,
    getPetFoodShampooList: (state) => state.petFoodShampooList,
    getPetMemos: (state) => state.petMemos,

    isPetUpdated: (state) => state.petUpdated,
  },

  // Temporary turn off the presist before stable
  // persist: true,
  actions: {
    setPet(pet: PetType) {
      this.pet = pet
    },
    clearPetMemo() {
      this.petMemos.length = 0
    },
    selectPet(id: string | number = null) {
      this.pet = id ? this.pets.find((v: any) => v.id_pet === id) : null
    },
    setIsPetUpdatedStatus(status = false) {
      this.petUpdated = status
    },
    setPetMemo(id: number, memo: string) {
      if (id) {
        const data = this.petMemos.find((memo) => {
          return memo.id === id
        })
        if (data) {
          data.memo = memo
          return data.memo
        }
        return this.petMemos.push({ id, memo })
      }
    },
    fetchPetPreventativeDetail(
      id_customer: string,
      id_pet: string,
      data: object = {}
    ) {
      return new Promise((resolve, reject) => {
        api
          .get(`/pet_preventative_details`, {
            params: { id_customer, id_pet, ...data }
          })
          .then((response) => {
            this.petPreventativeDetail = response.data.data[0]
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPets(id_customer: string | number) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/customers/${id_customer}/pets`)
          .then((response) => {
            this.pets = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    fetchPreparationPets(id_customer?: any, data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/pets`)
          .then((response) => {
            const modifiedData = response.data.data.map((v) => {
              const tempObj = {
                id_pet: v.id_pet,
                value: v.id_pet,
                label: v.name_pet,
                type_title_pet_customer_updated:
                  v.type_title_pet_customer_updated,
                name_pet: 'no name',
                ...v
              }
              if (v.name_pet) {
                tempObj['name_pet'] = v.name_pet
              } else if (v.name_kana_pet) {
                tempObj['name_pet'] = v.name_kana_pet
              }
              return tempObj
            })
            this.pets = modifiedData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitPet(id_customer: string | number, data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`/mst/customers/${id_customer}/pets`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            const customerStore = useCustomerStore()
            this.recentPet = response.data.data
            this.pet = response.data.data

            this.pets.push(this.pet)
            customerStore.addPrepPet(id_customer, this.pet)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPetByCustomer(id: number | string, id_customer: string | number) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/customers/${id_customer}/pets/${id}`)
          .then((response) => {
            this.pet = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async fetchPetProfileImageContent(
      id: number | string,
      id_customer: string | number
    ) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/customers/${id_customer}/pets/${id}/pet-profile-content`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updatePet(id: number | string, id_customer: number, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/customers/${id_customer}/pets/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          .then((response) => {
            const customerStore = useCustomerStore()
            this.recentPet = response.data.data
            this.pet = response.data.data

            const index = this.pets.findIndex(v => v.id_pet == this.pet.id_pet)
            this.pets[index] = this.pet
            this.petUpdated = true
            customerStore.changePrepPet(id_customer, this.pet)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyPet(id: number | string, id_customer: number) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/customers/${id_customer}/pets/${id}`)
          .then((response) => {
            const customerStore = useCustomerStore()
            const index = this.pets.findIndex(v => v.id_pet == id)
            this.pets.splice(index, 1)

            customerStore.deletePrepPet(id_customer, this.pet)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPetSDFoodAndShampoo(id_pet: number, data: object = {}) {
      return new Promise((resolve, reject) => {
        api
          .get(`pet_history/${id_pet}/food_shampoo`, { params: { ...data } })
          .then((response) => {
            this.petFoodShampooList = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default usePetStore
