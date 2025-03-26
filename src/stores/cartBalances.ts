import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/boot/axios'
import { CartBalance } from 'src/types/types'

export const useCartBalanceStore = defineStore('cart-balance', () => {
  const cart_balance = ref({} as CartBalance)
  const cart_balances = ref<Array<CartBalance>>([])

  const getCartBalances = computed(() => cart_balances.value)
  const getCartBalance = computed(() => cart_balance.value)

  const selectCartBalanceRequest = (id: string | number | null) => {
    cart_balance.value =
      cart_balances.value.find((v: CartBalance) => v.id_cart_balance === id) ||
      ({} as CartBalance)
  }

  const fetchCartBalances = (data: any = null) => {
    return new Promise((resolve, reject) => {
      api
        .get('cart-balance', { params: data })
        .then((response) => {
          cart_balances.value = response.data.data as CartBalance[]
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchCartBalance = (id: string) => {
    return new Promise((resolve, reject) => {
      api
        .get(`cart-balance/${id}`)
        .then((response) => {
          cart_balance.value = response.data.data as CartBalance
          resolve(response)
        })
        .catch((error) => {
          reject(error.response)
        })
    })
  }

  const submitCartBalance = (data: CartBalance) => {
    return new Promise((resolve, reject) => {
      api
        .post('cart-balance', data)
        .then((response) => {
          cart_balance.value = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchCartBalancesByDate = (data: any) => {
    return new Promise((resolve, reject) => {
      api
        .post('CartBalanceByDate', {
          datetime_paid_last: data.datetime_paid_last,
          id_customer: data.id_customer
        })
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  } 
  
  const updateCartBalance = (data: CartBalance) => {
    return new Promise((resolve, reject) => {
      api
        .put(`cart-balance/${data.id_cart_balance}`, data)
        .then((response) => {
          cart_balance.value = response.data as CartBalance
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchLatestCartBalanceOfCustomer = (id_customer: string) => {
    return new Promise((resolve, reject) => {
      api
        .get(`/cart-balance/${id_customer}/latest`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const deleteCartBalance = (id: number) => {
    return new Promise((resolve, reject) => {
      api
        .delete(`cart-balance/${id}`)
        .then((response) => {
          const findIndex = cart_balances.value?.findIndex(
            //@ts-ignore
            (pm: CartBalance) => pm.id === id
          )
          findIndex !== undefined && cart_balances.value?.splice(findIndex, 1)
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    cart_balance,
    cart_balances,
    getCartBalances,
    getCartBalance,
    selectCartBalanceRequest,
    fetchCartBalances,
    fetchCartBalance,
    submitCartBalance,
    updateCartBalance,
    fetchLatestCartBalanceOfCustomer,
    deleteCartBalance,
    fetchCartBalancesByDate
  }
})

export default useCartBalanceStore
