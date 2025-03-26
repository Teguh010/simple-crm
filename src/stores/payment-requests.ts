import { defineStore } from "pinia";
import { api } from "@/boot/axios";
import { PaymentRequest } from "src/types/types";

export type PaymentRequestState = {
  paymentRequest: PaymentRequest | null;
  paymentRequests: Array<PaymentRequest> | null;
};

export const usePaymentRequestStore = defineStore("payment-requests", {
  state: (): PaymentRequestState => ({
    paymentRequest: null,
    paymentRequests: [],
  }),

  getters: {
    getPaymentRequests: (state: PaymentRequestState) => state.paymentRequests,
    getPaymentRequest: (state: PaymentRequestState) => state.paymentRequest,
  },

  actions: {
    selectPaymentRequest(id: string | number | null) {
      this.paymentRequest = this.paymentRequests.find(
        (v: PaymentRequest) => v.id_payment_request === id
      );
    },

    fetchPaymentRequests() {
      return new Promise((resolve, reject) => {
        api
          .get("mst/payment-request")
          .then((response) => {
            this.paymentRequests = response.data.data as PaymentRequest[];
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    fetchPaymentRequest(id: string) {
      return new Promise((resolve, reject) => {
        api
          .get(`mst/payment-request/${id}`)
          .then((response) => {
            this.paymentRequest = response.data.data as PaymentRequest;
            resolve(response);
          })
          .catch((error) => {
            reject(error.response);
          });
      });
    },

    submitPaymentRequest(data: PaymentRequest) {
      return new Promise((resolve, reject) => {
        api
          .post("mst/payment-request", data)
          .then((response) => {
            this.paymentRequest = response.data;
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    updatePaymentRequest(data: PaymentRequest) {
      return new Promise((resolve, reject) => {
        api
          .put(`mst/payment-request/${data.id_payment_request}`, data)
          .then((response) => {
            this.paymentRequest = response.data as PaymentRequest;
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    deletePaymentRequest(id: number) {
      return new Promise((resolve, reject) => {
        api
          .delete(`mst/payment-request/${id}`)
          .then((response) => {
            const findIndex = this.paymentRequests?.findIndex(
              (pm: PaymentRequest) => pm.id === id
            );
            findIndex !== undefined &&
              this.paymentRequests?.splice(findIndex, 1);
            resolve(response);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
});
