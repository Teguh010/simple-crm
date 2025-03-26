import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useClinicStore = defineStore('clinic', {
  state: () => ({
    clinics: [],
    clinic: null,
    recentClinic: null,
    mainClinic: null,
    allClinics: [],
  }),
  persist: true,
  getters: {
    getClinics: (state) => state.clinics,
    getClinic: (state) => state.clinic,
    getRecentClinic: (state) => state.recentClinic,
    getMainClinic: (state) => state.mainClinic,
    getAllClinics: (state) => state.allClinics,
  },
  actions: {
    selectClinic(id = null) {
      if (id) {
        this.clinic = this.clinics.find((v) => v.id_clinic === id) || null
      } else {
        this.clinic = this.clinics.length > 0 ? this.clinics[0] : null
      }
    },

    async fetchClinicById(clinic_id) {
      try {
        const res = await mtUtils.callApi(
          selectOptions.reqMethod.GET,
          `/mst/clinics/${clinic_id}`
        )
        if (res) {
          this.clinic = res
          return res
        }
      } catch (error) {
        throw error
      }
    },

    fetchClinics(data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/clinics`, { params: data })
          .then((response) => {
            this.clinics = response.data.data
            this.mainClinic =
              this.clinics.find((clinic) => clinic.flg_clinic_main) || null
            localStorage.setItem('clinic', JSON.stringify(this.mainClinic))
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPreparatioClinic(data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/clinics`, { params: data })
          .then((response) => {
            this.clinics = response.data.data
            const modifiedData = response.data.data.map((v) => {
              return {
                flg_pill_0125: v.flg_pill_0125,
                flg_pill_0333: v.flg_pill_0333,
                flg_pill_0250: v.flg_pill_0250,
                flg_pill_050: v.flg_pill_050,
                value: v.id_clinic,
                label: v.name_clinic_display,
                flgSelected: false,
              }
            })
            this.allClinics = modifiedData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitClinic(data) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/clinics', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then((response) => {
            this.recentClinic = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateClinic(id, data) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/clinics/${id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          .then((response) => {
            this.recentClinic = response.data.data
            this.clinic = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyClinic(id) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/clinics/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
  },
})

export default useClinicStore
