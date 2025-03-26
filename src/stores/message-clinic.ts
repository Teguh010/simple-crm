import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { FileType, MessageThreadType, MessageType } from '@/types/types'
import { head } from 'lodash'

export const useMessageStore = defineStore('message_threads', {
  state: () => ({
    messages: [] as MessageType[],
    message: null,
    recentMessage: null,
    threadMessages: [] as MessageThreadType[],
    recentThreadMessage: null,
    files: [],
    recentFile: null,
    threadFiles: [] as FileType[],
    recentThreadFile: null
    // textTemplates:[],
    // recentTextTemplate: null,
  }),

  getters: {
    getMessages: (state) => state.messages,
    getMessage: (state) => state.message,
    getRecentMessage: (state) => state.recentMessage,
    getThreadMessages: (state) => state.threadMessages,
    getRecentThreadMessage: (state) => state.recentThreadMessage,
    getFiles: (state) => state.files,
    getRecentFile: (state) => state.recentFile,
    getThreadFiles: (state) => state.threadFiles,
    getRecentThreadFile: (state) => state.recentThreadFile
    // getTextTemplates: (state) => state.textTemplates,
    // getRecentTextTemplate : (state) => state.recentTextTemplate
  },

  actions: {
    setRecentMessageThread(value) {
      this.recentThreadMessage = value
    },
    selectMessage(id: string | number | null = null) {
      this.message = id
        ? this.messages.find((v: any) => v.id_cage === id)
        : null
    },
    async fetchThreadMessages(data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'message_threads?type_thread_list=1',
        data
      )
      if (res) {
        this.threadMessages = res
      }
    },
    async fetchMessageThreadById(id: any) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `message_threads/${id}`
      )
      if (res) {
        this.recentThreadMessage = res
        return res
      }
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
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `message_threads/${id}/messages`,
        data
      )
      if (res) {
        this.recentMessage = res
        this.messages.push(res)
      }
    },
    // async sendNotificationMultiCastMessage(userId: any, message: any) {
    //   const headers = {
    //     Authorization: `Bearer ${import.meta.env.VITE_API_CHANNEL_ACCESS_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   }
    //   const data = {
    //     to: userId,
    //     messages: [
    //       {
    //         type: 'text',
    //         text: message
    //       }
    //     ]
    //   }
    //   var res: any = await mtUtils.callApi(
    //     selectOptions.reqMethod.POST,
    //     ` https://api.line.me/v2/bot/message/multicast`,
    //     data, false, headers
    //   )
    // },
    // async sendNotificationBrodcastMessage(message: any) {
    //   const headers = {
    //     Authorization: `Bearer ${import.meta.env.VITE_API_CHANNEL_ACCESS_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   }
    //   const data = {
    //     messages: [
    //       {
    //         type: 'text',
    //         text: message
    //       }
    //     ]
    //   }
    //   var res: any = await mtUtils.callApi(
    //     selectOptions.reqMethod.POST,
    //     `https://api.line.me/v2/bot/message/broadcast`,
    //     data, false, headers
    //   )
    // },
    async sendNotificationMessage(userId: any, message: any) {
      const headers = {
        Authorization: `Bearer ${
          import.meta.env.VITE_API_CHANNEL_ACCESS_TOKEN
        }`,
        'Content-Type': 'application/json'
      }
      const data = {
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      }
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `https://api.line.me/v2/bot/message/push`,
        data,
        false,
        headers
      )
    },
    async sendMessageOnLine(userId: any, message: any) {
      // const headers = {
      //   Authorization: `Bearer ${import.meta.env.VITE_API_CHANNEL_ACCESS_TOKEN}`,
      //   'Content-Type': 'application/json'
      // }
      const forAlldata = {
        message: message
      }
      const forSingledata = {
        user_id: userId,
        message: message
      }
      const data = userId ? forSingledata : forAlldata
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `mst/message_send`,
        data,
        false
      )
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
    async fetchDepartmentTypeThreadMessages(
      departmentId: any,
      data: any = null
    ) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `message_threads?type_thread_list=1&type_department=${departmentId}`,
        data
      )
      if (res) {
        this.threadMessages = res
      }
    },
    async submitThreadMessages(data: object) {
      return mtUtils
        .callApi(selectOptions.reqMethod.POST, 'message_threads', data)
        .then((res) => {
          this.recentThreadMessage = res
        })
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
    async deleteThreadMessages(id: number | string) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `message_threads/${id}`
      )
      if (res) {
        this.recentThreadMessage = res
      }
    },
    async fetchFiles(data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/files',
        data
      )
      if (res) {
        this.files = res
      }
    },
    async submitFiles(data: any) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/files',
        data
      )
      if (res) {
        this.recentFile = res
      }
    },
    async fetchThreadFiles(id: any, data: any = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `message_thread_files/${id}`
      )
      if (res) {
        this.threadFiles = res
      } else {
        this.threadFiles = []
      }
    }

    // async fetchTextTemplate(data: any = null) {
    //   const res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`mst/text-template`, data )
    //   if (res){
    //     this.textTemplates = res;
    //   }
    //   },
  }
})

export default useMessageStore
