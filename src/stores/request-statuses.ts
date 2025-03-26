import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { api } from '@/boot/axios'
import { RequestStatusType } from '@/types/types'

export const useRequestStatus = defineStore("request-status", {
  state: () => ({
    req_status: <RequestStatusType>{},
    all_req_status: <RequestStatusType[]>[],
    request_statuses: <RequestStatusType[]>[],
  }),

  getters: {
    getRequestStatus: (state) => state.req_status,
    getRequestStatuses: (state) => state.all_req_status,
    getRequestStatusList: (state) => state.request_statuses,
  },

  actions: {
    setReqStatus(value: RequestStatusType) {
      this.req_status = value
    },
    async fetchRequestStatusesById(id_req_status: number){
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.GET, `req_statuses/${id_req_status}`)
      if (res){
        this.req_status = res
      }
    },
    async fetchRequestStatusesByIdRequest(id_request :number, id_pet: number = null){
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.GET, `req_statuses`, {id_request, id_pet})
      if (res){
        this.all_req_status = res
      }
    },
    async fetchRequestStatusesDate(data :any ){
      return new Promise((resolve, reject) => {
        api
          .get(`/req_statuses`, { params: data })
          .then((response) => {
            this.request_statuses = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async fetchRequestStatusesDateV2(data :any ){
      return new Promise((resolve, reject) => {
        api
          .get(`/req_statuses-v1`, { params: data })
          .then((response) => {
            this.request_statuses = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async submitRequestStatuses(data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'req_statuses',
        data
      )
      if (res){
        this.request_statuses = res
      }
    },
    async updateRequestStatuses(id_req_status: string, payload: any){
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `req_statuses/${id_req_status}`, payload)
      if (res){
        this.request_statuses = res
      }
    },
    async destroyRequestStatuses(id_req_status: string){
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `req_statuses/${id_req_status}`)
      if (res){
        return true;
      }
      return false;
    }
  },
});

export default useRequestStatus;
