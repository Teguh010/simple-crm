import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { computed, reactive } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import useCartStore from '@/stores/carts'

export const useCartDetailStore = defineStore('cart-details', () => {
  const state = reactive({
    all_cart_details: <any>[],
    cart_details: <any>[],
    cart_detail: null,
    recentCartDetail: null
  })

  const getAllCartDetails = computed(() => state.all_cart_details)
  const getCartDetails = computed(() => state.cart_details)
  const getCartDetail = computed(() => state.cart_detail)
  const getRecentCartDetail = computed(() => state.recentCartDetail)

  const selectCartDetail = (id = null) =>  {
    state.cart_detail = id
      ? state.cart_details.find((v: any) => v.id_cart === id)
      : null
  }

  const fetchCartDetailsByCartId = (id_cart: string, data: any = null) =>  {
    return new Promise((resolve, reject) => {
      api
        .get(`/cart/${id_cart}/cart_detail`, { params: data })
        .then((response) => {
          state.cart_details = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const fetchCartDetails = (data: any = null) =>  {
    return new Promise((resolve, reject) => {
      api
        .get(`/cart_detail`, { params: data })
        .then((response) => {
          state.cart_details = response.data.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

   const mergeCartDetail = async (data: object)  => {
    let res = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'merge_cart_details',
      data
    )
  }

  const submitCartDetail = (data: object)  => {
    return new Promise((resolve, reject) => {
      api
        .post('/cart_detail', data)
        .then((response) => {
          state.recentCartDetail = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const updateCartDetail = ( id: number | string, data: object, isPartial: boolean = false
  ) =>  {
    return new Promise((resolve, reject) => {
      const url = `/cart_detail/${id}${isPartial ? '?partial=true' : ''}`
      api
        .put(url, data)
        .then((response) => {
          state.recentCartDetail = response.data
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const bulkUpdateFlgPetInsurance = (data: object) =>  {
    return new Promise((resolve, reject) => {
      api
        .put('/cart_detail/bulk-update-flg-pet-insurance', data)
        .then((response) => {
          useCartStore().setCart(response.data.data)
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  const destroyCartDetail = (id: number | string) =>  {
    return new Promise((resolve, reject) => {
      api
        .delete(`/cart_detail/${id}`)
        .then((response) => {
          resolve(response)
        })
        .catch((error) => {
          reject(error)
        })
    })
  }

  return {
    state,
    getAllCartDetails,
    getCartDetails,
    getCartDetail,
    getRecentCartDetail,
    selectCartDetail,
    fetchCartDetailsByCartId,
    fetchCartDetails,
    mergeCartDetail,
    submitCartDetail,
    updateCartDetail,
    bulkUpdateFlgPetInsurance,
    destroyCartDetail
  }
})

export default useCartDetailStore
