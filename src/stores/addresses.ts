import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/boot/axios'
import axios from 'axios'

export const useAddressesStore = defineStore('addresses', () => {
 
  const addresses = ref([])
  const address = ref(null)
  const recentAddress = ref(null)
  const zipCode = ref([])
  const lastFetchCustomerId = ref(null)
  const addressPetRabies = ref(null)
  // const getAddresses = computed(() => addresses.value)
  // const getAddress = computed(() => address.value)
  // const getRecentAddress = computed(() => recentAddress.value)
  // const getZipCode = computed(() => zipCode.value)

  const fetchZipCode = (zip_code: string) => {
    return new Promise((resolve, reject) => {
      let api_link
      if (import.meta.env.VITE_APP_ENV === 'local')
        api_link = `/searchzipcode/api/v1/addresses`
      else api_link = `https://searchaddress-api.motocle8.com/api/v1/addresses`

      axios
        .get(api_link, { params: { zip_code, format: 'json' } })
        .then((response) => {
          zipCode.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchAddresses = (id_customer: string | number, forceFetch: any = false) => {
    if (lastFetchCustomerId.value && lastFetchCustomerId.value === id_customer && !forceFetch) {
      return
    }
    
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/customers/${id_customer}/addresses`)
        .then((response) => {
          addresses.value = response.data.data
          lastFetchCustomerId.value = id_customer
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchAllAddresses = () => {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/addresses`)
        .then((response) => {
          addresses.value = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
  const fetchAddressPetRabies = (id_pet: string | number) => {
    return new Promise((resolve, reject) => {
      api
        .get(`/mst/pets/${id_pet}/address`)
        .then((response) => {
          addressPetRabies.value = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
  const submitAddress = (id_customer: string | number, data: object) => {
    return new Promise((resolve, reject) => {
      api
        .post(`/mst/customers/${id_customer}/addresses`, data)
        .then((response) => {
          recentAddress.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateAddress = (id: number | string, id_customer: string | number, data: object) => {
    return new Promise((resolve, reject) => {
      api
        .put(`/mst/customers/${id_customer}/addresses/${id}`, data)
        .then((response) => {
          recentAddress.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const destroyAddress = (id: number | string, id_customer: string | number) => {
    return new Promise((resolve, reject) => {
      api
        .delete(`/mst/customers/${id_customer}/addresses/${id}`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    addresses,
    address,
    recentAddress,
    zipCode,
    addressPetRabies,
    // getAddresses,
    // getAddress,
    // getRecentAddress,
    // getZipCode,
    fetchZipCode,
    fetchAddresses,
    fetchAllAddresses,
    submitAddress,
    updateAddress,
    destroyAddress,
    fetchAddressPetRabies,
  }
})

export default useAddressesStore
