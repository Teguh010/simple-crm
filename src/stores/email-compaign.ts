
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useEmailCompaignStore = defineStore('emailCompaign', () => {
  
  const emailCompaigns = ref<any>([])
  const emailCompaign = ref<any>(null)
  const recentEmailCompaign = ref<any>(null)
  const allEmailCompaigns = ref<any>([])

  const getEmailCompaigns = computed(() => emailCompaigns.value)
  const getEmailCompaign = computed(() => emailCompaign.value)
  const getRecentEmailCompaign = computed(() => recentEmailCompaign.value)
  const getAllEmailCompaigns = computed(() => allEmailCompaigns.value)

  const fetchEmailCompaignById = async (clinic_id: string) => {
    let res = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/email-compaign`
    )
    if (res) {
      emailCompaign.value = res
      return res
    }
  }

  const fetchEmailCompaigns = (data = null) => {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/email-compaign`, { params: data })
        .then((response) => {
          emailCompaigns.value = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const submitEmailCompaign = (data:object) => {
    return new Promise((resolve, reject) => {
      api
        .post('/mst/email-compaign', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          recentEmailCompaign.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateEmailCompaign = (id: number | string, data: object) => {
    return new Promise((resolve, reject) => {
      api
        .put(`/mst/email-compaign/${id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        .then((response) => {
          recentEmailCompaign.value = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const destroyEmailCompaign = (id: number | string) => {
    return new Promise((resolve, reject) => {
      api
        .delete(`/mst/email-compaign/${id}`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    emailCompaigns,
    emailCompaign,
    recentEmailCompaign,
    allEmailCompaigns,
    getEmailCompaigns,
    getEmailCompaign,
    getRecentEmailCompaign,
    getAllEmailCompaigns,
    fetchEmailCompaignById,
    fetchEmailCompaigns,
    submitEmailCompaign,
    updateEmailCompaign,
    destroyEmailCompaign
  }
}, {
  persist: true
})

export default useEmailCompaignStore
