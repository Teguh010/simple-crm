import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { TodoNotificationsType } from '@/types/types'

export const useTodoNotificationStore = defineStore('todo_notification', {
  state: () => ({
    all_todo_notifications: <any>[],
    todo_notifications: <TodoNotificationsType>{
      customer_message_thread_list: [],
      clinic_message_thread_list: [],
      task_list: []
    },
    todo_notification: null,
    recentTodoNotification: null
  }),

  getters: {
    getAllTodoNotifications: (state) => state.all_todo_notifications,
    getTodoNotifications: (state) => state.todo_notifications,
    getTodoNotification: (state) => state.todo_notification,
    getRecentTodoNotification: (state) => state.recentTodoNotification
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectTodoNotification(id: string | number = null) {
      this.todo_notification = id
        ? this.todo_notifications.find(
            (v: any) => v.id_todo_notification === id
          )
        : null
    },

    async fetchTodoNotifications(data: any | null = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'todo_notifications',
        data
      )
      if (res && res) {
        this.todo_notifications = res
      }
    },

    async submitTodoNotification(data: object) {
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'todo_notifications',
        data
      )
      if (res) {
        this.recentTodoNotification = res
      }
    },

    async updateTodoNotification(id: number | string, data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/todo_notifications/${id}`,
        data
      )
      if (res) {
        this.recentTodoNotification = res
      }
    },

    async destroyTodoNotification(id: number | string) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/todo_notifications/${id}`
      )
      if (res) {
        return true
      }
      return false
    }
  }
})

export default useTodoNotificationStore
