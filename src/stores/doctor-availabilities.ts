import { defineStore } from "pinia"
import mtUtils from "@/utils/mtUtils"
import selectOptions from "@/utils/selectOptions"

export interface DoctorAvailability {
  id_doctor_availability: number
  flg_slot_available: boolean
  limit_number: number
  flg_unavailable: boolean
  flg_delete: boolean
  datetime_insert: string
  datetime_update: string
  id_clinic: number
  id_employee: number
  id_employee_insert: number
  id_employee_update: number
  date_business_day: string
  type_slot_number: number | null
}

interface DoctorAvailabilityState {
  doctorAvailabilities: DoctorAvailability[]
  doctorAvailability: DoctorAvailability | null
  recentDoctorAvailability: DoctorAvailability | null
}

export const useDoctorAvailabilityStore = defineStore('DoctorAvailability', {
  state: (): DoctorAvailabilityState => ({
    doctorAvailabilities: [],
    doctorAvailability: null,
    recentDoctorAvailability: null
  }),

  getters: {
    getDoctorAvailabilities: (state) => state.doctorAvailabilities,
    getDoctorAvailability: (state) => state.doctorAvailability,
    getRecentDoctorAvailability: (state) => state.recentDoctorAvailability,
  },

  // Temporary turn off the presist before stable
  persist: false,

  actions: {
    selectDoctorAvailability (id: string | number = null) {
      this.doctorAvailability = id
        ? this.getDoctorAvailabilities.find((v: any) => v.id_doctor_availability === id)
        : null
    },

    async fetchDoctorAvailabilities (data: any | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'doctor_availabilities', data)
      if (res && res) {
        this.doctorAvailabilities = res
      }
    },

    async submitDoctorAvailability (data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'doctor_availabilities', data)
      if (res) {
        this.recentDoctorAvailability = res
      }
    },

    async updateDoctorAvailability (id_doctor_availability: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/doctor_availabilities/${id_doctor_availability}`, data)
      if (res) {
        this.recentDoctorAvailability = res
      }
    },

    async destroyDoctorAvailability (id_doctor_availability: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/doctor_availabilities/${id_doctor_availability}`)
      if (res) {
        return true
      }
      return false
    },
  },
})

export default useDoctorAvailabilityStore;
