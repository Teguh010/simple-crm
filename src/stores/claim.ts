import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/boot/axios'

export const useClaimStore = defineStore('claim', () => {
  const claimByCart = ref(null)

  const getClaimByCart = computed(() => claimByCart.value)

  const fetchClaimByCart = (id_cart: any) => {
    return new Promise((resolve, reject) => {
      api
        .get(`claim`, { params: { id_cart: id_cart } })
        .then((response) => {
          claimByCart.value = response.data.data
          resolve(response.data.data)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateCartClaim = (id_claim: any, data: any) => {
    return new Promise((resolve, reject) => {
      api
        .put(`claim1/${id_claim}`, data)
        .then((response) => {
          claimByCart.value = [response.data.data]
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    claimByCart,
    getClaimByCart,
    fetchClaimByCart,
    updateCartClaim
  }
})

export default useClaimStore
