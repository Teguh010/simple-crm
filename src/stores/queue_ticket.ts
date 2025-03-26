import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { QueueTicketType } from '@/types/types'
import { api } from '@/boot/axios'
import dayjs, { Dayjs } from 'dayjs'

export const useQueueTicketStore = defineStore('queue_ticket', {
  state: () => ({
    filteredQueueTickets: [] as QueueTicketType[],
    queueTickets: [] as QueueTicketType[],
    queueTicket: null,
    recentQueueTicket: null,
    openUpdateModal: false,
    dataFromCustomerPage: {} as QueueTicketType
  }),

  getters: {
    getFilteredQueueTicketLists: (state) => state.filteredQueueTickets,
    getQueueTicketLists: (state) => state.queueTickets,
    getQueueTicketList: (state) => state.queueTicket,
    getRecentQueueTicketList: (state) => state.recentQueueTicket,
    getDataFromCustomerPage: (state) => state.dataFromCustomerPage
  },

  persist: true,

  actions: {
    clearDataFromCustomerPage() {
      this.dataFromCustomerPage = {} as QueueTicketType
    },
    
    setDataFromCustomerPage(data: QueueTicketType) {
      this.dataFromCustomerPage = data
    },

    selectCustody(id: string | number | null = null) {
      this.queueTicket = id
        ? this.queueTickets?.data.find((v: any) => v.id_custody === id)
        : null
    },

    clearAllStates() {
      this.queueTickets = []
      this.queueTicket = null
      this.recentQueueTicket = null
    },

    filterQueueTicketsByTypeAnimal(typeAnimal: number | string) {
      if (typeAnimal === '00') {
        this.filteredQueueTickets = this.queueTickets.filter((qt) => {
          return [1, 2, 3].includes(qt.petList[0].id_cm_animal)
        })
        return this.filteredQueueTickets
      }

      if (typeAnimal) {
        this.filteredQueueTickets = this.queueTickets.filter((qt) => {
          return qt.petList.some((pet) => pet.id_cm_animal == typeAnimal)
        })
        return this.filteredQueueTickets
      }
      this.filteredQueueTickets = this.queueTickets
      return this.filteredQueueTickets
    },

    async fetchQueueTicketList(data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get('queue_ticket', { params: data })
          .then((response) => {
            this.queueTickets = response.data.data
            this.filteredQueueTickets = response.data.data.sort((a, b) => a.process_order - b.process_order)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async submitQueueTicketList(data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'queue_ticket',
        data
      )
      if (res) {
        this.recentQueueTicket = res
      }
    },

    async decryptQr(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`mst/qr-decrypt`, data)
          .then((response) => {
            // this.paymentRequest = response.data.data as PaymentRequest;
            resolve(response);
          })
          .catch((error) => {
            reject(error.response);
          });
      });
    },

    async updateQueueTicketList(id: number | string, data: object) {

      const payload = data

      if (payload.datetime_estimate !== null) {
        let now: Dayjs
        const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (hhmmRegex.test(payload.datetime_estimate)) {
          const hour = parseInt(payload.datetime_estimate.split(':')[0])
          const minute = parseInt(payload.datetime_estimate.split(':')[1])
          now = dayjs().hour(hour).minute(minute)
        } else {
          now = dayjs(payload.datetime_estimate)
        }
        payload.datetime_estimate = now.format('YYYY-MM-DD HH:mm:ss')
      }
      
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `queue_ticket/${id}`,
        payload
      )
      if (res) {
        this.recentQueueTicket = res
      }
    },

    async sendEmail(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `queue_ticket/${id}/send_email`,
        data
      )
      return res
    },

    async destroyQueueTicketList(id: number | string) {
      return mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `queue_ticket/${id}`
      )
    }
  }
})

export default useQueueTicketStore
