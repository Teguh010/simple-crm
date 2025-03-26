import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { MessageThreadType, MessageType } from '@/types/types'
import { api } from '@/boot/axios'

export const useThreadCustomer = defineStore('message_threads_customer', {
  state: () => ({
    messages: [] as MessageType[],
    message: null,
    recentMessage: null,
    thread_Messages: [] as MessageThreadType[],
    recentThreadMessage: null
    // files: [],
    // recentFile: null,
    // threadFiles: [],
    // recentThreadFile: null
    // textTemplates:[],
    // recentTextTemplate: null,
  }),

  getters: {
    getMessages: (state) => state.messages,
    getMessage: (state) => state.message,
    getRecentMessage: (state) => state.recentMessage,
    getThreadMessages: (state) => state.thread_Messages,
    getRecentThreadMessage: (state) => state.recentThreadMessage
    // getFiles: (state) => state.files,
    // getRecentFile: (state) => state.recentFile,
    // getThreadFiles: (state) => state.threadFiles,
    // getRecentThreadFile: (state) => state.recentThreadFile
    // getTextTemplates: (state) => state.textTemplates,
    // getRecentTextTemplate : (state) => state.recentTextTemplate
  },

  actions: {
    selectMessage(id: string | number | null = null) {
      this.message = id
        ? this.messages.find((v: any) => v.id_cage === id)
        : null
    },
    async fetchMessages(id: any, data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `message_threads/${id}/messages`,
        data
      )
      if (res) {
        this.messages = res
      }
    },
    async submitMessages(data: object, id: any) {
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `message_threads/${id}/messages`,
        data
      )
      if (res) {
        this.recentMessage = res
      }
    },
    async fetchThreadMessages(data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'message_threads?type_thread_list=2',
        data
      )
      if (res) {
        this.thread_Messages = res
      }
    },
    async fetchTypeThreadMessages(typeThread: number, data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `message_threads?type_thread_list=2&type_thread=${typeThread}`,
        data
      )
      if (res) {
        this.thread_Messages = res
      }
    },
    async fetchMessageThreadById(id: any) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `message_threads/${id}`
      )
      if (res) {
        this.recentThreadMessage = res
      }
    },
    async submitThreadMessages(data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'message_threads',
        data
      )
      if (res) {
        this.recentThreadMessage = res
      }
    },
    async updateThreadMessages(id: number | string, data: any) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `message_threads/${id}`,
        data
      )
      if (res) {
        this.recentThreadMessage = res
      }
    },
    async deleteMessages(
      threadId: number | string,
      messageId: number | string
    ) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `message_threads/${threadId}/messages/${messageId}`
      )
      if (res) {
        this.recentThreadMessage = res
      }
    },
    async deleteThreadMessages(id: number | string) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `message_threads/${id}`
      )
      if (res) {
        this.recentThreadMessage = res
      }
    },
    // async ThreadConsultoReservation(id: number | string, data: any) {
    //   const res: any = await mtUtils.callApi(
    //     selectOptions.reqMethod.POST,
    //     `/message_threads/${id}/confirm-application`,
    //     data
    //   )
    //   if (res) {
    //     this.recentThreadMessage = res
    //     return res
    //   }
    // },
    async ThreadConsultoReservation(id: number | string, data: any) {
      return new Promise((resolve, reject) => {
        api
          .post(`/message_threads/${id}/confirm-application`, data)
          .then((response) => {
            this.recentThreadMessage = response
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    }
  }
})

export default useThreadCustomer
