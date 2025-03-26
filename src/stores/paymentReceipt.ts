import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { PaymentReceipt } from 'src/types/types'

export type PaymentReceiptState = {
  paymentReceipt: PaymentReceipt
  paymentReceipts: Array<PaymentReceipt>
}

export const usePaymentReceiptStore = defineStore('paymentReceipt', {
  state: (): PaymentReceiptState => ({
    paymentReceipt: {} as PaymentReceipt,
    paymentReceipts: []
  }),

  getters: {
    getPaymentReceipts: (state: PaymentReceiptState) => state.paymentReceipts,
    getPaymentReceipt: (state: PaymentReceiptState) => state.paymentReceipt
  },

  actions: {
    selectPaymentReceipt(id: string | number | null) {
      this.paymentReceipts = this.paymentReceipts.find(
        (v: PaymentReceipt) => v.id_payment_receipt === id
      )
    },

    fetchPaymentReceipts(data: any) {
      return new Promise((resolve, reject) => {
        api
          .get('payment-reciept', { params: data })
          .then((response) => {
            this.paymentReceipts = response.data.data as PaymentReceipt[]
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPaymentReceipt(id: string) {
      return new Promise((resolve, reject) => {
        api
          .get(`payment-reciept/${id}`)
          .then((response) => {
            this.paymentReceipt = response.data.data as PaymentReceipt
            resolve(response)
          })
          .catch((error) => {
            reject(error.response)
          })
      })
    },

    submitPaymentReceipt(data: PaymentReceipt) {
      return new Promise((resolve, reject) => {
        api
          .post('payment-reciept', data)
          .then((response) => {
            this.paymentReceipt = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updatePaymentReceipt(data: PaymentReceipt) {
      return new Promise((resolve, reject) => {
        api
          .put(`payment-reciept/${data.id_payment_receipt}`, data)
          .then((response) => {
            this.paymentReceipt = response.data as PaymentReceipt
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    deletePaymentReceipt(id: number) {
      return new Promise((resolve, reject) => {
        api
          .delete(`payment-reciept/${id}`)
          .then((response) => {
            const findIndex = this.paymentReceipts?.findIndex(
              (pm: PaymentReceipt) => pm.id_payment_receipt === id
            )
            findIndex !== undefined &&
              this.paymentReceipts?.splice(findIndex, 1)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default usePaymentReceiptStore
