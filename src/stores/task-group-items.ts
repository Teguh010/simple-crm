import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useTaskGroupItemStore = defineStore('task_group_item', {
  state: () => ({
    task_group_items: [],
    task_group_item: null,
    recentTaskGroupItem: null
  }),

  getters: {
    getTaskGroupItems: (state) => state.task_group_items,
    getTaskGroupItem: (state) => state.task_group_item,
    getRecentTaskGroupItem: (state) => state.recentTaskGroupItem
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectTaskGroupItem (id: string | number | null = null) {
      this.task_group_item = id ? this.task_group_items.find((v: any) => v.id_task_group_item === id) : null
    },

    fetchTaskGroupItems (id_task_group = null, data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/task_groups/${id_task_group}/tasks`, { params: data })
          .then((response) => {
            this.task_group_items = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitTaskGroupItem (id_task_group = null, data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`/mst/task_groups/${id_task_group}/tasks`, data)
          .then((response) => {
            this.recentTaskGroupItem = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateTaskGroupItem (id_task_group = null, id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/task_groups/${id_task_group}/tasks/${id}`, data)
          .then((response) => {
            this.recentTaskGroupItem = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyTaskGroupItem (id_task_group = null, id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/task_groups/${id_task_group}/tasks/${id}`)
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

export default useTaskGroupItemStore
