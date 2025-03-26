import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { api } from '@/boot/axios'

export interface BusinessHourSlot {
  display_order: number
  id_business_hour_slot: number
  id_clinic: number
  id_employee_insert: number
  id_employee_update: number
  name_business_hour: string
  ticket_limit_upper1: number | null
  ticket_limit_upper2: number | null
  ticket_limit_upper3: number | null
  time_business_end1: string
  time_business_end2: string
  time_business_end3: string
  time_business_start1: string
  time_business_start2: string
  time_business_start3: string
  time_checkin_end1: string
  time_checkin_end2: string
  time_checkin_end3: string
  time_checkin_start1: string
  time_checkin_start2: string
  time_checkin_start3: string
  time_ticket_issue_end1: string
  time_ticket_issue_end2: string
  time_ticket_issue_end3: string
  time_ticket_issue_start1: string
  time_ticket_issue_start2: string
  time_ticket_issue_start3: string
  type_business_day: number
}

export const useBusinessHourSlot = defineStore('business_hour_slot', () => {
  const state = reactive({
    all_business_hour_slots: <any>[],
    // allBusinessHourSlots: <any>[],
    business_hour_slots: <any>[],
    business_hour_slot: null,
    recentBusinessHourSlot: null
  })

  const getAllBusinessHourSlots = computed(() => state.all_business_hour_slots)
  const getBusinessHourSlots = computed(() => state.business_hour_slots)
  const getBusinessHourSlot = computed(() => state.business_hour_slot)
  const getRecentBusinessHourSlot = computed(() => state.recentBusinessHourSlot)

  const selectBusinessHourSlot = (id: string | number | null = null)=> {
    state.business_hour_slot = id
      ? state.business_hour_slots.find(
          (v: any) => v.id_business_hour_slot === id
        )
      : null
  }

  const fetchBusinessHourSlots = (data: any = null)=> {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/business_hour_slots`, { params: data })
        .then((response) => {
          state.business_hour_slots = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchPreparationBusinessHourSlots = ()=> {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/business_hour_slots`)
        .then((response) => {
          const modifiedData = response.data.data.map((v: any) => {
            return {
              value: v.id_business_hour_slot,
              label: v.name_business_hour
            }
          })
          state.all_business_hour_slots = modifiedData
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const submitBusinessHourSlot = (data: object)=> {
    return new Promise((resolve, reject) => {
      api
        .post('/mst/business_hour_slots', data)
        .then((response) => {
          state.recentBusinessHourSlot = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateBusinessHourSlot = (id: number | string, data: object)=> {
    return new Promise((resolve, reject) => {
      api
        .put(`/mst/business_hour_slots/${id}`, data)
        .then((response) => {
          state.recentBusinessHourSlot = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const destroyBusinessHourSlot = (id: number | string) =>{
    return new Promise((resolve, reject) => {
      api
        .delete(`/mst/business_hour_slots/${id}`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    getAllBusinessHourSlots,
    getBusinessHourSlots,
    getBusinessHourSlot,
    getRecentBusinessHourSlot,
    state,
    selectBusinessHourSlot,
    fetchBusinessHourSlots,
    fetchPreparationBusinessHourSlots,
    submitBusinessHourSlot,
    updateBusinessHourSlot,
    destroyBusinessHourSlot
  }
})

export default useBusinessHourSlot
