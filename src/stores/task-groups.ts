import { defineStore } from 'pinia'
import { api } from '@/boot/axios'

export const useTaskGroupStore = defineStore('task_group', {
  state: () => ({
    task_groups: [],
    task_group: null,
    recentTaskGroup: null
  }),

  getters: {
    getTaskGroups: (state) => state.task_groups,
    getTaskGroup: (state) => state.task_group,
    getRecentTaskGroup: (state) => state.recentTaskGroup
  },

  
  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectTaskGroup (id: string | number | null = null) {
      this.task_group = id && this.task_groups ? this.task_groups.find((v: any) => v.id_task_group === id) : null
    },

    fetchTaskGroups (data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/task_groups`, { params: data })
          .then((response) => {
            this.task_groups = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchTaskGroupById(data = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/task_groups/${data.id_task_group}`)
          .then((response) => {
            this.task_group = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitTaskGroup (data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/mst/task_groups', data)
          .then((response) => {
            this.recentTaskGroup = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateTaskGroup (id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/mst/task_groups/${id}`, data)
          .then((response) => {
            this.recentTaskGroup = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyTaskGroup (id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/mst/task_groups/${id}`)
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

export default useTaskGroupStore
