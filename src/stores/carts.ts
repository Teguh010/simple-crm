import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { Notify } from 'quasar'

function initialState() {
  return {
    all_carts: <any>[],
    carts: [],
    cart: null,
    recentCart: null,
    additionalSearchParams: null,
    flgRenderInvoice: false,
    openUpdateModal: false,
    flgAddCartBalance: false,
    flgAllowCartUpdate: false,
    flgRefundCart: false,
    customerCartBalance: null,
    latestCartBalanceRecord: null
  }
}

export const useCartStore = defineStore('cart', {
  state: initialState,

  getters: {
    getFlgAllowCartUpdate: (state) => state.flgAllowCartUpdate,
    getAllCarts: (state) => state.all_carts,
    getCarts: (state) => state.carts,
    getCart: (state) => state.cart,
    getRecentCart: (state) => state.recentCart,
    getAdditionalSearchParams: (state) => state.additionalSearchParams,
    getFlgRenderInvoice: (state) => state.flgRenderInvoice,
    getFlgAddCartBalance: (state) => state.flgAddCartBalance,
    getFlgRefundCart: (state) => state.flgRefundCart,
    getCustomerCartBalance: (state) => state.customerCartBalance,
    getLatestCartBalanceRecord: (state) => state.latestCartBalanceRecord
  },

  actions: {
    setCustomerCartBalance(value: any) {
      this.customerCartBalance = value
    },
    setLatestCartBalance(value: any) {
      this.latestCartBalanceRecord = value
    },
    setFlgRefundCart(value: any) {
      this.flgRefundCart = value
    },
    setFlgAllowCartUpdate(value: any) {
      this.flgAllowCartUpdate = value
    },
    setFlgAddCartBalance(value: any) {
      this.flgAddCartBalance = value
    },

    setAdditionalSearchParams(value: any) {
      this.additionalSearchParams = value
    },

    setCart(value: any) {
      this.cart = value
    },
    setFlgRenderInvoice(value: any) {
      this.flgRenderInvoice = value
    },
    fetchCarts(data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/cart`, { params: data })
          .then((response) => {
            this.carts = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchCartsRaw(data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/cart`, { params: data })
          .then((response) => {
            resolve(response.data.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchCartByRequest(id_request: string) {
      return new Promise((resolve, reject) => {
        api
          .get(`/request/${id_request}/cart`)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            this.checkNotification(response.data.data)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchCart(id_cart: string) {
      return new Promise((resolve, reject) => {
        api
          .get(`/cart/${id_cart}`)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitCart(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/cart', data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }

            this.checkNotification(response.data.data)

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateCart(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/cart/${id}`, data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            this.checkNotification(response.data.data)
            resolve(response)
          })
          .catch((error) => {
            // Extract error response safely
            const responseData = error.response?.data?.data || {}
            const title = responseData.message || error.response?.data?.message || 'Error updating cart!'
            const errorsArray = responseData.errors || error.response?.data?.errors || []
            const errorDetails = Array.isArray(errorsArray) ? errorsArray.join('<br>') : String(errorsArray)

            // Show error notification with a newline after the title
            Notify.create({
              message: `${title}<br>${errorDetails ? `${errorDetails}` : ''}`, // Ensures title is always followed by a newline
              type: 'negative',
              timeout: 0,
              html: true, // Allows <br> for proper formatting
              closeBtn: 'OK',
              multiLine: true,
            })
            reject(error)
          })
      })
    },

    refundCart(id_cart: string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`/cart/${id_cart}/refund`, data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateCartInsurance(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/cart/${id}`, data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            resolve(response)
          })
          .catch((error) => {
            reject(error.response)
          })
      })
    },

    updateDiscount(id_cart: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/cart/${id_cart}/update-discount`, data)
          .then((response) => {
            // this.cart = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchSalesSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('sales_summary', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchDailySalesSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('cart_summary_daily', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchMonthlySalesSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('cart_summary_monthly', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchCartSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('cart_summary', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchCategorySalesSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('sales_summary_by_category', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchDoctorSalesSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('sales_summary_by_doctor', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchISUSalesSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('sales_summary_by_isu', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    syncUpdatedCartDetail(updatedDetail) {
      const excludeFields = [
        'id_pet',
        'id_service_detail',
        'id_prescription_detail',
        'cart_detail_assorts'
      ]
      // Find the index of the cart detail to be updated
      const index = this.cart.cart_details.findIndex(
        (detail) => detail.id_cart_detail === updatedDetail.id_cart_detail
      )

      // Proceed with the update, excluding specified fields
      const fieldsToUpdate = Object.keys(updatedDetail).reduce((acc, key) => {
        if (!excludeFields.includes(key)) {
          acc[key] = updatedDetail[key]
        }
        return acc
      }, {})

      // If found, update the cart detail in the state
      if (index !== -1) {
        this.cart.cart_details[index] = {
          ...this.cart.cart_details[index],
          ...fieldsToUpdate
          // Explicitly copy any nested objects/arrays if necessary to avoid direct mutation
        }
      } else {
        // Optional: Handle the case where the cart detail isn't found. This could involve logging an error,
        // pushing the new detail to the array, or simply ignoring it.
      }
    },

    updateBillingAmount(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/cart/${id}/update-billing`, data)
          .then((response) => {
            // this.cart = response.data.data
            this.checkNotification(response.data.data)
            resolve(response)
          })
          .catch((error) => {
            Notify.create({
              message:
                error.response.data.data ?? 'Error in billing calculation!',
              type: 'negative'
            })
            reject(error)
          })
      })
    },

    splitCart(id: string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`/cart/${id}/split-cart`, data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    splitCartForBilling(id: string, data: object | null = null) {
      return new Promise((resolve, reject) => {
        api
          .put(`/cart/${id}/split-cart-for-billing`, data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    splitAndMergeCart(id: string, data: object | null = null) {
      return new Promise((resolve, reject) => {
        api
          .post(`/cart/${id}/cart-merge-split`, data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    createCartFromRequest(id_request: string, data: object | null = null) {
      return new Promise((resolve, reject) => {
        api
          .post(`/request/${id_request}/cart`, data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            this.checkNotification(response.data.data)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    duplicateCart(id_cart: string, data: object | null = null) {
      return new Promise((resolve, reject) => {
        api
          .post(`/cart/${id_cart}/duplicate-cart`, data)
          .then((response) => {
            this.cart = { ...response.data.data, type_ch_disc: '1' }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    validateCartBalance(cart: any) {
      return new Promise((resolve, reject) => {
        api
          .post(`validate_cart_balance`, { ...cart })
          .then((response) => {
            resolve(response.data.data)
            return response
          })
          .catch((error) => {
            if (
              error &&
              error.response &&
              error.response.data &&
              error.response.data.data
            ) {
              reject(error.response.data.data)
              return
            }
            reject(error)
            return
          })
      })
    },

    checkCartCompletion(cart: any) {
      console.log(cart)
      return new Promise((resolve, reject) => {
        api
          .post(`check-cart-completion`, {
            id_cart: cart.id_cart,
            id_customer: cart.id_customer
          })
          .then((response) => {
            resolve(response)
            return response
          })
          .catch((error) => {
            if (
              error &&
              error.response &&
              error.response.data &&
              error.response.data.data
            ) {
              reject(error.response.data.data)
              return
            }
            reject(error)
            return
          })
      })
    },

    destroyCart(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/cart/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    createCartBalance(id_cart: string) {
      return new Promise((resolve, reject) => {
        api
          .post(`/cart/${id_cart}/create-balance`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyCartBalance(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/cart-balance/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchLatestCartBalanceOfCustomer(id_customer: string) {
      this.customerCartBalance = null
      this.latestCartBalanceRecord = null

      return new Promise((resolve, reject) => {
        api
          .get(`/cart/customer/${id_customer}/cart-balance`)
          .then((response) => {
            this.latestCartBalanceRecord = response.data.data
            this.customerCartBalance = this.latestCartBalanceRecord.bal_updated

            if (Number(this.customerCartBalance) < 0) {
              this.setFlgAddCartBalance(true)
            }

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    checkNotification(response) {
      if (
        response &&
        response.notification &&
        response.notification.length &&
        response.notification.length > 0
      ) {
        if (response.notification.find((v) => v == '100'))
          Notify.create({
            progress: true,
            message: '保険証が失効しています。\n再登録が必要です。',
            icon: 'info',
            color: 'white',
            textColor: 'red'
          })
        if (response.notification.find((v) => v == '130')) {
          Notify.create({
            progress: true,
            message:
              '「通院・入院」または「手術のみ」\t' +
              'で保険請求は行えません。申請内容を確認して下さい。',
            icon: 'info',
            color: 'primary',
            textColor: 'white',
            actions: [
              {
                label: 'OK',
                color: 'white',
                textColor: 'white',
                handler: () => {}
              }
            ],
            timeout: 0
          })
        }
        if (response.notification.find((v) => v == '30010')) {
          Notify.create({
            progress: true,
            message:
              ' Cart Balance Created by this cart has been already paid partially or whole. ',
            icon: 'info',
            color: 'primary',
            textColor: 'white',
            actions: [
              {
                label: 'OK',
                color: 'white',
                textColor: 'white',
                handler: () => {}
              }
            ],
            timeout: 0
          })
        }
        if (response.notification.find((v) => v == '500')) {
          Notify.create({
            progress: true,
            message:
              'Error INS010: エラーが発生しました。サポートデスクへお問い合わせください。',
            icon: 'info',
            type: 'negative'
          })
        }
      }
    },

    resetState(parts = []) {
      // Get the initial state
      const initial = initialState()

      // Determine which parts to reset
      const keysToReset = parts.length === 0 ? Object.keys(initial) : parts

      // Reset the specified parts
      keysToReset.forEach((key) => {
        if (key in this) {
          this[key] = initial[key]
        }
      })
    }
  }
})

export default useCartStore
