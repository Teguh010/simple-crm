import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/boot/axios'
import dayjs from 'dayjs'
import { ClinicPlanType } from '@/types/types'

export const useClinicPlanStore = defineStore('clinic_plan', () => {
  const clinicPlans = ref<ClinicPlanType[]>([])
  const todayClinicPlans = ref<ClinicPlanType[]>([])
  const tomorrowClinicPlans = ref<ClinicPlanType[]>([])
  const clinicPlan = ref<ClinicPlanType | null>(null)
  const recentClinicPlan = ref<ClinicPlanType | null>(null)

  const getClinicPlans = computed(() => clinicPlans.value)
  const getClinicPlan = computed(() => clinicPlan.value)
  const getTodayClinicPlans = computed(() => todayClinicPlans.value)
  const getTomorrowClinicPlans = computed(() => tomorrowClinicPlans.value)
  const getRecentClinicPlan = computed(() => recentClinicPlan.value)

  const selectClinicPlan = (id: string | number | null = null) => {
    clinicPlan.value = id
      ? clinicPlans.value.find((v: any) => v.id_price === id)
      : null
  }

  const fetchClinicPlans = (data = null) => {
    return new Promise((resolve, reject) => {
      api
        .get(`/clinic_plan`, { params: data })
        .then((response) => {
          clinicPlans.value = response.data.data
          todayClinicPlans.value = clinicPlans.value.filter((plan) => {
            return dayjs().isSame(dayjs(plan.datetime_clinic_plan_start), 'day')
          })
          tomorrowClinicPlans.value = clinicPlans.value.filter((plan) => {
            return dayjs()
              .add(1, 'day')
              .isSame(dayjs(plan.datetime_clinic_plan_start), 'day')
          })
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const submitClinicPlan = (data: object) => {
    return new Promise((resolve, reject) => {
      api
        .post('/clinic_plan', data)
        .then((response) => {
          recentClinicPlan.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateClinicPlan = (id: number | string, data: object) => {
    return new Promise((resolve, reject) => {
      api
        .put(`/clinic_plan/${id}`, data)
        .then((response) => {
          recentClinicPlan.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const destroyClinicPlan = (id: number | string) => {
    return new Promise((resolve, reject) => {
      api
        .delete(`/clinic_plan/${id}`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    clinicPlans,
    clinicPlan,
    recentClinicPlan,
    getClinicPlans,
    getClinicPlan,
    getRecentClinicPlan,
    getTodayClinicPlans,
    getTomorrowClinicPlans,
    selectClinicPlan,
    fetchClinicPlans,
    submitClinicPlan,
    updateClinicPlan,
    destroyClinicPlan
  }
})

export default useClinicPlanStore
