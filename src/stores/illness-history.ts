import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { IllnessHistoryType } from '@/types/types'

export const useIllnessHistoryStore = defineStore('illness_history', {
  state: () => ({
    allPreventativeMedicine: [] as IllnessHistoryType[],
    allDiseaseFreeData: [] as IllnessHistoryType[],
    all_illness_historys: [] as IllnessHistoryType[],
    illness_historys: [] as IllnessHistoryType[],
    searchIllnessHistoryData: [] as IllnessHistoryType[],
    searchPaginationIH: {
      next: null,
      count: 0
    },
    illness_history: {} as IllnessHistoryType,
    recentIllnessHistory: {} as IllnessHistoryType,
    leftSideIllnessHistoryList: [] as IllnessHistoryType[],
    activeIllnessHistoryList: [] as IllnessHistoryType[],
    nextPage: null,
    visitedPages: []
  }),

  getters: {
    getAllPreventativeMedicine: (state) => state.allPreventativeMedicine,
    getAllDiseaseFreeData: (state) => state.allDiseaseFreeData,
    getAllIllnessHistorys: (state) => state.all_illness_historys,
    getIllnessHistorys: (state) => {
      return state.illness_historys
    },
    getSearchIllnessHistoryData: (state) => state.searchIllnessHistoryData,
    getSearchIHPagination: (state) => state.searchPaginationIH,
    getIllnessHistory: (state) => state.illness_history,
    getRecentIllnessHistory: (state) => state.recentIllnessHistory,
    getLeftSideIllnessHistoryList: (state) => state.leftSideIllnessHistoryList,
    getActiveIllnessHistoryList: (state) => state.activeIllnessHistoryList
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    setIllnessHistory(value: number | IllnessHistoryType) {
      if (typeof value === 'number')
        this.illness_history = this.illness_historys.find(
          (illnessHistory) => illnessHistory.id_pet_illness_history === value
        )
      else this.illness_history = value
    },
    setIllnessHistoryList(value) {
      if (!value) {
        this.all_illness_historys = []
        this.leftSideIllnessHistoryList = []
        return
      }
      this.all_illness_historys = value
    },
    removeIllnessHistory(value: IllnessHistoryType) {
      this.leftSideIllnessHistoryList = this.leftSideIllnessHistoryList.filter(
        (illnessHistory) =>
          illnessHistory.id_pet_illness_history != value.id_pet_illness_history
      )
    },
    addIllnessHistory(value: IllnessHistoryType) {
      value.isActiveIH = false
      this.leftSideIllnessHistoryList.push(value)
    },
    addPinnedToTop(value: IllnessHistoryType) {
      const find = this.leftSideIllnessHistoryList.find(
        (illnessHistory) => illnessHistory.id_pet_illness_history == value.id_pet_illness_history
      )
      if (!find) this.leftSideIllnessHistoryList.unshift(value)
    },
    toggleActiveIllnessHistory(value) {
      if (value) {
        const find = this.activeIllnessHistoryList.find(
          (illnessHistory) => illnessHistory === value
        )

        if (find) {
          const index = this.activeIllnessHistoryList.indexOf(value)
          this.activeIllnessHistoryList.splice(index, 1)
        } else this.activeIllnessHistoryList.push(value)
      }
    },
    unToggleActiveIllnessHistory(value) {
      const find = this.activeIllnessHistoryList.find(
        (illnessHistory) => illnessHistory === value
      )
      if (find) {
        const index = this.activeIllnessHistoryList.indexOf(value)
        this.activeIllnessHistoryList.splice(index, 1)
      }
    },
    extendIllnessHistoryList(value) {
      this.illness_history.push(...value)
    },

    refreshLeftSideIH(
      id: string | number | null = null
    ) {
      return new Promise((resolve, reject) => {
        api
          .get(`/illness_history/${id}`, { params: { isWhole: false } })
          .then((response) => {
            const illness_history = response.data.data
            if (!this.leftSideIllnessHistoryList.find(v => v.id_pet_illness_history == illness_history.id_pet_illness_history))
              this.leftSideIllnessHistoryList.push(illness_history)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    selectIllnessHistory(
      id: string | number | null = null,
      params: any = null
    ) {
      return new Promise((resolve, reject) => {
        api
          .get(`/illness_history/${id}`, { params: params })
          .then((response) => {
            if (params) {
              this.illness_history = response.data.data
              this.illness_history.isActiveIH = false
              if (!this.leftSideIllnessHistoryList.find(v => v.id_pet_illness_history == this.illness_history.id_pet_illness_history)) {
                if (this.illness_history.flg_pinned) {
                  this.addPinnedToTop(this.illness_history)
                  return
                }
                this.leftSideIllnessHistoryList.push(this.illness_history)
              }
              resolve(response)
            } else {
              //update Case
              this.illness_history = response.data.data
              // this.leftSideIllnessHistoryList.push(this.illness_history)
              this.leftSideIllnessHistoryList.find((item: any) => {
                if (
                  item.id_pet_illness_history ==
                  response.data.data.id_pet_illness_history
                ) {
                  Object.assign(item, response.data.data)
                  item.isChecked = true
                  item.isActiveIH = false
                }
              })
              resolve(response)
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    selectIllnessHistoryByPet(
      id_pet: string | number | null = null,
      checkbox: boolean = false
    ) {
      return new Promise((resolve, reject) => {
        api
          .get(`/illness_history_by_pet/${id_pet}`)
          .then((response) => {
            if (response.data.data.id_pet_illness_history) {
              this.illness_history = response.data.data
              if (this.illness_history) {
                this.illness_history.isActiveIH = false
                this.leftSideIllnessHistoryList = [this.illness_history]
              }
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    fetchIllnessHistoryForPreventative(data: any = null) {
      this.allPreventativeMedicine = []
      return new Promise((resolve, reject) => {
        api
          .get(`/illness_history`, { params: data })
          .then((response) => {
            this.allPreventativeMedicine = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchIllnessHistorys(data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/illness_history`, { params: data })
          .then((response) => {
            this.illness_historys = response.data.data
            this.illness_historys = this.illness_historys.sort((a, b) => {
              return (a.flg_pinned === b.flg_pinned) ? 0 : a.flg_pinned ? -1 : 1;
            });

            const modifiedData = response.data.data
              .map((v) => {
                return {
                  value: v.id_pet_illness_history,
                  label: v.name_disease || v.name_disease_free,
                  number_pet_illness_history: v.number_pet_illness_history
                }
            })
            this.all_illness_historys = modifiedData

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchSearchIllnessHistoryData(data: any = null) {
      return new Promise((resolve, reject) => {
        api
          .get(`/GetIllnessHistoryListV2`, { params: data })
          .then((response) => {
            this.searchIllnessHistoryData = response.data.data
            this.searchPaginationIH = {
              next: response.data.next,
              count: response.data.count
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchMoreIllnessHistoryList(data: any = null, fetchNext: boolean = false) {
      return new Promise((resolve, reject) => {
        if (fetchNext && !this.nextPage) {
          reject('Fetch Next is not available')
          return
        }
        api
          .get(`/illness_history`, { params: { ...data, page: this.nextPage } })
          .then((response) => {
            if (fetchNext && !this.visitedPages.includes(this.nextPage)) {
              this.extendIllnessHistoryList(response.data.data)
            }

            if (response.data.next) {
              this.nextPage = response.data.next.split('page=')[1]
            } else {
              this.nextPage = null
            }

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    fetchPreparationIllnessHistorys(data: any) {
      return new Promise((resolve, reject) => {
        api
          .get(`/illness_history`, { params: data })
          .then((response) => {
            const illnessData = response.data.data
              .filter((v) => {
                return v.name_disease
              })
              .map((v) => {
                return {
                  value: v.id_pet_illness_history,
                  label: v.name_disease,
                  number_pet_illness_history: v.number_pet_illness_history
                }
              })

            const diseaseFreeData = response.data.data
              .filter((v) => {
                return v.name_disease_free
              })
              .map((v) => {
                return {
                  value: v.id_pet_illness_history,
                  label: v.name_disease_free,
                  number_pet_illness_history: v.number_pet_illness_history
                }
              })
            this.all_illness_historys = illnessData
            this.allDiseaseFreeData = diseaseFreeData
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitIllnessHistory(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post('/illness_history', data)
          .then((response) => {
            this.recentIllnessHistory = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateIllnessHistory(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/illness_history/${id}`, data)
          .then((response) => {
            this.recentIllnessHistory = response.data
            this.illness_historys = this.illness_historys.sort((a, b) => {
              return (a.flg_pinned === b.flg_pinned) ? 0 : a.flg_pinned ? -1 : 1;
          });
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyIllnessHistory(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/illness_history/${id}`)
          .then((response) => {
            this.illness_historys = this.illness_historys.filter(
              item => item.id_pet_illness_history !== id
            )
            this.all_illness_historys = this.all_illness_historys.filter(
              item => item.id_pet_illness_history !== id
            )
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchPetIllnessHistorys(data: any) {
      return new Promise((resolve, reject) => {
        api
          .get(
            `/illness_history?id_pet=${data.petId}&id_customer=${data.customerId}`
          )
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    updReqUiState(data: any) {
      return new Promise((resolve, reject) => {
        api.post(`/UpdReqUiState`, data)
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

export default useIllnessHistoryStore
