import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import useCustomerStore from '@/stores/customers'
import useServiceDetailStore from '@/stores/service-details'
import { RequestType, RequestDetailPageType } from 'src/types/types'
import { get, set } from 'lodash'

export const useRequestStore = defineStore('request', {
  state: () => ({
    all_requests: [],
    latest_request_by_pet: {} as RequestType,
    additionalSearchRequest: null,
    additionalSearchCountRequest: 0,
    requests: [],
    request: <any>{},
    recentRequest: null,
    selectedPet: {},
    requestCustomer: {},
    selectedRequest: {},
    search: {} as RequestType,
    openUpdateModal: false,
    bookings: [],
    requestListByPet: [] as RequestType[],
    cartListByPet: [],
    requestAndCartList: [],
    requestPageIsRefreshed: false,
    requestDetailPage: {
      id_request: '',
      title_request: '',
      number_request: '',
      id_pet: '',
      id_customer: '',
      code_customer: '',
      name_customer: '',
      name_pet: '',
      id_employee_staff: '',
      id_employee_doctor: '',
      date_start: '',
      date_end: '',
      date_request_start: '',
      date_request_goal: '',
      memo_request: '',
      flg_non_charge: false,
      flg_in_app_payment: false,
      id_employee_request: '',
      flg_booking: false,
      flg_complete: false,
      flg_apply_insurance: false
    } as RequestDetailPageType
  }),

  getters: {
    getAllRequests: (state) => state.all_requests,
    getLatestRequestByPet: (state) => state.latest_request_by_pet,
    getRequests: (state) => state.requests,
    getRequest: (state) => state.request,
    getRecentRequest: (state) => state.recentRequest,
    getAdditionalSearchRequest: (state) => state.additionalSearchRequest,
    getAdditionalSearchCountRequest: (state) =>
      state.additionalSearchCountRequest,
    getBookingList: (state) => state.bookings,
    getRequestListByPet: (state) => state.requestListByPet,
    getCartListByPet: (state) => state.cartListByPet,
    getRequestAndCartList: (state) => state.requestAndCartList,
    getRequestPageIsRefreshedPage: (state) => state.requestPageIsRefreshed,
    getRequestDetailPage: (state) => state.requestDetailPage
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    setRequestDetailPage(value: RequestDetailPageType) {
      this.requestDetailPage = value
    },
    setRequestPageRefresh(value: boolean) {
      this.requestPageIsRefreshed = value
    },
    setRequestSearch(value: any, count: number) {
      this.additionalSearchRequest = value
      this.additionalSearchCountRequest = count
    },
    selectRequest(id: string | number | null = null) {
      this.request = id
        ? this.requests.find((v: any) => v.id_request_service === id)
        : null
    },

    async fetchRequests(data: any = null) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/requests',
        { ...data }
      )
      if (res) {
        this.requests = res
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationRequests() {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/requests'
      )
      if (res) {
        this.all_requests = res.map((v: any) => {
          return {
            value: v.id_request,
            label: v.title_request
          }
        })
      }
    },

    async fetchRequestsByIdPet(
      data: { id_pet: number; flg_cart: boolean } = {
        id_pet: -1,
        flg_cart: false
      }
    ) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/request_list_by_pet',
        { ...data }
      )
      if (res) {
        if (data.flg_cart) this.cartListByPet = res
        else this.requestListByPet = res
      }
    },

    async fetchRequestByPet(id_pet: number | string) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/requests',
        { id_pet }
      )
      if (res && res[0]) {
        this.latest_request_by_pet = res[0]
      }
    },

    fetchRequest(id: any, data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/requests/${id}`, data)
          .then((response) => {
            this.request = response.data.data
            useCustomerStore().setCustomer(this.request.customer)
            useServiceDetailStore().setServiceDetailList(
              this.request.service_detail_list
            )
            resolve(response)
          })
          .catch((error) => {
            this.request = {}
            reject(error)
          })
      })
    },

    submitRequest(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/requests', data)
          .then((response) => {
            this.recentRequest = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateRequest(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/requests/${id}`, data)
          .then((response) => {
            this.recentRequest = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyRequest(id: any) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/requests/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    sendPdf(id: any, url: any, message: any) {
      const data = {
        id_customer: id,
        pdf_url: url,
        message: message
      }
      return new Promise((resolve, reject) => {
        api
          .post(`mst/send_pdf`, data)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    // BOOKING

    async fetchBooking(data: any = null) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/bookings',
        { ...data }
      )
      if (res) {
        this.bookings = res
      }
    },
    // fetch advanced search request
    async fetchBookingRequest(data: any = null) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/requests',
        { ...data }
      )
      if (res) {
        return res
      }
    },

    // fetch request and carts in single api
    async fetchRequestsAndCarts(data: any = null) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        '/request/check_requests_and_carts',
        { ...data }
      )
      if (res) {
        this.requestAndCartList = res
      }
    }
  }
})

export default useRequestStore
