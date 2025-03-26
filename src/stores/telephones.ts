import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'
import mtUtils from '@/utils/mtUtils'

export const useTelephoneStore = defineStore('telephone', {
  state: () => ({
    telephones: [],
    telephone: null,
    recenttelephone: null,
    telephonesLocalData: [],
    telephonseLocalDataIndex: null,
  }),

  getters: {
    getTelephones: (state) => state.telephones,
    getTelephone: (state) => state.telephone,
    getRecentTelephone: (state) => state.recenttelephone,
    getTelephonesLocalData: (state) => state.telephonesLocalData,
    getTelephonesLocalDataIndex: (state) => state.telephonseLocalDataIndex,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    selectTelephone(id: string | number | null = null) {
      this.telephone = id
        ? this.telephones?.find((v: any) => v.id_telephone === id)
        : null
    },

    fetchTelephones(data: any = null) {
      return api
        .get(`/mst/tel`, { params: data })
        .then((response) => {
          this.telephones = response.data
          return response
        })
        .catch((error) => {
          const errorMessage = mtUtils.formattedErrors(error)
          console.error(error)
          console.error('errorMessage', errorMessage)
          if (errorMessage) mtUtils.alert(errorMessage, 'Error!')
          throw error
        })
    },

    submitTelephone(data: object) {
      return api
        .post('/mst/tel', data)
        .then((response) => {
          this.recenttelephone = response.data
          return response
        })
        .catch((error) => {
          const errorMessage = mtUtils.formattedErrors(error)
          console.error(error)
          console.error('errorMessage', errorMessage)
          if (errorMessage) mtUtils.alert(errorMessage, 'Error!')
          throw error
        })
    },

    updateTelephone(id: number | string, data: object) {
      return api
        .put(`/mst/tel/${id}`, data)
        .then((response) => {
          this.recenttelephone = response.data
          return response
        })
        .catch((error) => {
          const errorMessage = mtUtils.formattedErrors(error)
          console.error(error)
          console.error('errorMessage', errorMessage)
          if (errorMessage) mtUtils.alert(errorMessage, 'Error!')
          throw error
        })
    },

    destroyTelephone(id: number | string) {
      return api
        .delete(`/mst/tel/${id}`)
        .then((response) => {
          return response
        })
        .catch((error) => {
          const errorMessage = mtUtils.formattedErrors(error)
          console.error(error)
          console.error('errorMessage', errorMessage)
          if (errorMessage) mtUtils.alert(errorMessage, 'Error!')
          throw error
        })
    },

    setTelephonesLocalData(data: any) {
      this.telephonesLocalData = [...data]
    },
    setTelephonesLocalDataIndex(index: number) {
      this.telephonseLocalDataIndex = index
    }
  }
})

export default useTelephoneStore
