import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useInsuranceStore = defineStore('insurance', {
  state: () => ({
    insurers: [],
    insurances: [],
    insurance: null,
    recentInsurance: null,
    insuranceDefaultOptions : <any> [],
    insurerDefaultOptions: <any>[],
    insuranceListByPet: <any>[],
  }),

  getters: {
    getInsurers: (state) => state.insurers,
    getInsurances: (state) => state.insurances,
    getInsurance: (state) => state.insurance,
    getRecentInsurance: (state) => state.recentInsurance,
    getInsuranceDefaultOptions:(state)=> state.insuranceDefaultOptions,
    getInsurerDefaultOptions: (state) => state.insurerDefaultOptions,
    getInsuranceListByPet: (state) => state.insuranceListByPet
  },

  
  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectInsurance (id: string | number = null) {
      this.insurance = id ? this.insurances.find((v: any) => v.id_insurance_plan === id) : null
    },

    setPetInsuranceList() {
      this.insuranceListByPet.length = 0
    },

    fetchInsurers (data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/insurers`, { params: data })
          .then((response) => {
            response.data.data = response.data.data.filter(function (el) {
              return el.id_insurer != '' 
              }
            );
            this.insurers = response.data.data
            this.insurerDefaultOptions = []
            response.data.data.forEach((insurerObj:any) => {
              this.insurerDefaultOptions.push(
                  { label: insurerObj.name_insurer, value: insurerObj.id_insurer})
            })
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchInsurances (data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/insurance_plans`, { params: data })
          .then((response) => {
            this.insurances = response.data.data
            if (response && response.data && response.data.data && response.data.data.length && response.data.data.length > 0){
              response.data.data.forEach((insurance:any)=>{
                this.insuranceDefaultOptions.push({
                  value: insurance.id_insurer,
                  label : insurance.name_insurance_plan
                })
              })
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPetInsuranceList(data = null) {
      this.insuranceListByPet.length = 0
      return new Promise((resolve, reject) => {
        api
          .get(`/pet_insurances`, {params: data})
          .then((response) => {
            this.insurances = response.data.data
            if (response && response.data && response.data.data && response.data.data.length && response.data.data.length > 0) {
              this.insuranceListByPet = response.data.data
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitInsurance (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/insurance_plans', data)
          .then((response) => {
            this.recentInsurance = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateInsurance (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/insurance_plans/${id}`, data)
          .then((response) => {
            this.recentInsurance = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyInsurance (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/insurance_plans/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default useInsuranceStore
