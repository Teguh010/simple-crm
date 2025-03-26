import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { Payment } from 'src/types/types'

export type PaymentState = {
  payment: Payment
  payments: Array<Payment>
  paymentList: Array<Payment>
  cartPayments: Array<Payment>
}

export const usePaymentStore = defineStore('payment', {
  state: (): PaymentState => ({
    payment: {} as Payment,
    payments: [],
    cartPayments: [] as Payment[],
    paymentList: [] as Payment[]
  }),

  getters: {
    getPayments: (state: PaymentState) => state.payments,
    getPayment: (state: PaymentState) => state.payment,
    getPaymentList: (state: PaymentState) => state.paymentList,
    getCartPayments: (state: PaymentState) => state.cartPayments
  },

  actions: {
    selectPaymentRequest(id: string | number | null) {
      this.payment = this.payments.find((v: Payment) => v.id_payment === id)
    },

    fetchPayments(data: any) {
      return new Promise((resolve, reject) => {
        api
          .get('payment', { params: data })
          .then((response) => {
            if (data.type_payment_status == 2) {
              const filteredPayment = response.data.data.filter(
                (v: Payment) => v.datetime_refund_conducted !== null
              )
              this.payments = filteredPayment
            } else {
              this.payments = response.data.data
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPaymentByCustomer(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('payment-flag-upfront', { params: data })
          .then((response) => {
            this.payments = response.data.data
            this.paymentList.push(...response.data.data.payment_list)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPaymentsByCart(
      id_cart: string,
      data?: Record<string, any>
    ): Promise<any> {
      return new Promise((resolve, reject) => {
        api
          .get(`cart/${id_cart}/payments`, { params: data || {} })
          .then((response) => {
            this.cartPayments = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPayment(id: string) {
      return new Promise((resolve, reject) => {
        api
          .get(`payment/${id}`)
          .then((response) => {
            this.payment = response.data.data as Payment
            resolve(response)
          })
          .catch((error) => {
            reject(error.response)
          })
      })
    },

    fetchDailyPaymentSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('payment_summary_daily', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPaymentSummary(data: string) {
      return new Promise((resolve, reject) => {
        api
          .get('payment_summary', { params: data })
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitPayment(data: Payment) {
      return new Promise((resolve, reject) => {
        api
          .post('payment', data)
          .then((response) => {
            this.payment = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updatePayment(data: Payment) {
      return new Promise((resolve, reject) => {
        api
          .put(`payment/${data.id_payment}`, data)
          .then((response) => {
            this.payment = response.data as Payment
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    deletePayment(id: number) {
      return new Promise((resolve, reject) => {
        api
          .delete(`payment/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default usePaymentStore
