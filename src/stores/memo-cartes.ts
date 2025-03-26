import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import { CarteGroup, ClinicalFile, MemoCarteType } from '@/types/types'
import useIllnessHistoryStore from '@/stores/illness-history'
import { dateFormat, formatDateWithTime } from '@/utils/aahUtils'
import { orderBy } from 'lodash'

export type MemoCarteGroupType = {
  date_insert: string;
  data_cartes: CarteGroup;
  clinical_file: ClinicalFile[];
  id_pet_illness_history: string;
  datetimeInsert: string;
}

export const useMemoCarteStore = defineStore('memo_cartes', {
  state: () => ({
    memo_cartes: [] as MemoCarteType[],
    memo_carte_pet_details: [] as MemoCarteType[],
    memo_carte: {} as MemoCarteType,
    filteredMemoCarte: [],
    recentMemoCarte: null,
    flgMovableMemoCarte:
      JSON.parse(sessionStorage.getItem('flgMovableMemoCarte') ?? null) ||
      false,
    memoData: '',
    filteredMemoCarteV1: [] as MemoCarteType[],
    memoCartePinned: {} as MemoCarteType,
    memoCartePinnedGroupByDate: {} as MemoCarteType,
    petAllTodos: [],
    petDetailTodos: {} as { carte_list: Array<Object>, date: string, request: Array<Request> },
    groupedMemoCartes: [] as MemoCarteGroupType[],
    currentPage: {
      id_request: null as string | null,
      id_pet: null as string | number | null,
      id_customer: null as string | number | null,
    },
    tempFormData: {
      petBioInfo: null,
      memoCarteData: null,
      medConditionData: [],
      clinicalFiles: []
    }
  }),
  getters: {
    getMemoCartes: (state) => state.memo_cartes,
    getMemoCartePetDetail: (state) => state.memo_carte_pet_details,
    getMemoCarte: (state) => state.memo_carte,
    getFilteredMemoCartes: (state) => state.filteredMemoCarte,
    getFilteredMemoCartesV1: (state) => state.filteredMemoCarteV1,
    getRecentMemoCarte: (state) => state.recentMemoCarte,
    getMovableMemoCarte: (state) => state.flgMovableMemoCarte,
    getMemoData: (state) => state.memoData,
    getMemoCartePinned: (state) => state.memoCartePinned,
    getPetAllTodos: (state) => state.petAllTodos,
    getPetDetailTodos: (state) => state.petDetailTodos,
    getGroupedMemoCartes: (state) => state.groupedMemoCartes,
    getMemoCartePinnedGroupByDate: (state) => state.memoCartePinnedGroupByDate
  },

  // Temporary turn off the presist before stable
  // persist: true,
  actions: {
    extendFilteredMemoCarte(memo_cartes: MemoCarteType[]) {
      this.filteredMemoCarteV1 = {
        ...this.filteredMemoCarteV1,
        ...memo_cartes
      }
    },
    setMemoData(value: string) {
      this.memoData = value
    },
    setMemoCartePetDetails(memo_cartes: MemoCarteType[]) {
      this.memo_carte_pet_details = memo_cartes
    },
    setMemoCarteListToNull() {
      this.memo_carte_pet_details = []
      this.memo_cartes = []
      this.filteredMemoCarteV1 = []
    },
    setMemoCarte(value: any) {
      this.memo_carte = value
    },
    setMovableMemoCarte(value: boolean) {
      this.flgMovableMemoCarte = value
    },
    selectMemoCarte(id: string | number | null = null) {
      this.memo_carte = id
        ? this.memo_cartes.find((v: any) => v.id_memo_carte === id)
        : {}
    },
    filterMemoCarte(id_pet_illness_history: Array<number> | null) {
      if (this.memo_cartes.length) {
        if (id_pet_illness_history?.length) {
          this.filteredMemoCarte = this.memo_cartes.filter((memo) => {
            return memo.id_pet_illness_history.some((element) => {
              return id_pet_illness_history.includes(element)
            })
          })
        } else {
          this.filteredMemoCarte = this.memo_cartes
        }
      }
    },
    fetchMemoCartePinned(data) {
      return new Promise((resolve, reject) => {
        api
          .get(`/pinned_memo_cartes`, { params: data })
          .then((response) => {
            this.memoCartePinned = response.data.data
            this.memoCartePinnedGroupByDate = this.processCarte(this.memoCartePinned, data)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    fetchPetAllTodos(data) {
      return new Promise((resolve, reject) => {
        api
          .get(`/pet_carte_by_date`, { params: data })
          .then((response) => {
            this.petAllTodos = response.data.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    fetchPetDetailTodos(data) {
      return new Promise((resolve, reject) => {
        api
          .post(`/pet_carte_by_date`, data)
          .then((response) => {
            this.petDetailTodos = response.data.data

            if (this.petDetailTodos) {
              const filterData = data
              const unorderedCartes = (this.petDetailTodos.carte_list || []).reduce((acc, item) => {
                const dateInsert = item.datetime_insert
                if (!acc[dateInsert]) {
                  acc[dateInsert] = {
                    grouped_cartes: false,
                    memo_carte_list: [],
                    medical_condition: [],
                    pet_bio: {},
                    lab_result_list: {},
                    clinical_file_list: [],
                    lab_result_note_list: []
                  }
                }

                if (item.memo_carte) {
                  if (filterData && filterData.memo_other) {
                    const temp_memo =
                      item.memo_carte?.memo_obj +
                      item.memo_carte?.memo_sbj +
                      item.memo_carte?.memo_ass +
                      item?.memo_carte?.memo_other +
                      item.memo_carte?.pet_illness_history_list.reduce((v, illness) => {
                        return (
                          v +
                          `${illness?.name_disease ? illness.name_disease : ''} ${
                            illness?.name_disease_free ? illness.name_disease_free : ''
                          }`
                        )
                      }, '')

                    filterData?.memo_other.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

                    const terms = filterData.memo_other
                      .split(',')
                      .map((term) => term.trim())
                    const regexPattern = `(${terms.join('|')})`
                    const regex = new RegExp(regexPattern, 'gi')

                    if (temp_memo.search(regex) !== -1) {
                      acc[dateInsert].memo_carte_list.push(item.memo_carte)
                    }
                  } else {
                    acc[dateInsert].memo_carte_list.push(item.memo_carte)
                  }

                  if (item.memo_carte.memo_other && (item.memo_carte?.memo_sbj || item?.memo_carte?.memo_ass || item?.memo_carte?.memo_obj)) {
                    acc[dateInsert].grouped_cartes = true
                  }
                }

                if (item.pet_bio) {
                  acc[dateInsert].pet_bio = item.pet_bio
                }

                if (item.medical_condition) {
                  acc[dateInsert].medical_condition.push(item.medical_condition)
                }

                if (item.clinical_file) {
                  if (
                    !acc[dateInsert]?.clinical_file_list.find(
                      (v: ClinicalFile) =>
                        v.id_clinical_file == item.clinical_file.id_clinical_file
                    )
                  )
                    acc[dateInsert]?.clinical_file_list.push(item.clinical_file)
                }

                if (item.lab_result_note) {
                  if (
                    !acc[dateInsert]?.lab_result_note_list.find(
                      (v: any) =>
                        v.id_lab_result_note == item.lab_result_note.id_lab_result_note
                    )
                  )
                    acc[dateInsert]?.lab_result_note_list.push(item.lab_result_note)
                }

                if (item.lab_result) {
                  const dateTime = formatDateWithTime(
                    item.lab_result.datetime_registered
                  )
                  if (
                    !acc[dateInsert].lab_result_list[
                      item.lab_result.id_category2_lab
                    ]
                  )
                    acc[dateInsert].lab_result_list[
                      item.lab_result.id_category2_lab
                    ] = {}
                  if (
                    !acc[dateInsert].lab_result_list[
                      item.lab_result.id_category2_lab
                    ][item.lab_result.id_cm_device]
                  )
                    acc[dateInsert].lab_result_list[
                      item.lab_result.id_category2_lab
                    ][item.lab_result.id_cm_device] = {}
                  if (
                    !acc[dateInsert].lab_result_list[
                      item.lab_result.id_category2_lab
                    ][item.lab_result.id_cm_device][dateTime]
                  )
                    acc[dateInsert].lab_result_list[
                      item.lab_result.id_category2_lab
                    ][item.lab_result.id_cm_device][dateTime] = []

                  acc[dateInsert].lab_result_list[
                    item.lab_result.id_category2_lab
                  ][item.lab_result.id_cm_device][dateTime].push(item.lab_result)

                  acc[dateInsert].lab_result_list[
                    item.lab_result.id_category2_lab
                  ][item.lab_result.id_cm_device][dateTime] = orderBy(acc[dateInsert].lab_result_list[
                    item.lab_result.id_category2_lab
                  ][item.lab_result.id_cm_device][dateTime], ['lab_set.display_order', 'lab_device.display_order', 'lab.display_order'], ['asc', 'asc', 'asc'])
                }

                if ((acc[dateInsert].memo_carte_list.length > 0 && (
                  acc[dateInsert].pet_bio?.id_pet_bio_info ||
                  acc[dateInsert].medical_condition.length > 0
                )) || item.type_carte == 2) {
                  acc[dateInsert].grouped_cartes = true
                }

                return acc
              }, {})
              this.petDetailTodos.carte_list = Object.fromEntries(
                Object.entries(unorderedCartes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
              );
            }

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async fetchMemoCarteV1(data: any) {
      data = {
        ...data,
        illnessHistoryList: JSON.stringify(
          useIllnessHistoryStore().getActiveIllnessHistoryList
        )
      }
      return new Promise((resolve, reject) => {
        api
          .get(`/cartes`, { params: data })
          .then((response) => {
            this.memo_cartes.length = 0

            const sortedData = Object.fromEntries(
              Object.entries(this.processCarte(response.data.data, data)).sort(
                ([keyA], [keyB]) => (keyA < keyB ? 1 : -1)
              )
            )
            this.filteredMemoCarteV1 = sortedData
            this.setGroupedMemoCarteData()

            this.memo_carte = this.memo_cartes[0]
            resolve(response)
          })
          .catch((error) => {
            console.error('Error fetching memo carte:', error);
            reject(error)
          })
      })
    },
    fetchMemoCarte(data: any) {
      return new Promise((resolve, reject) => {
        api
          .get(`/memo_carte`, { params: data })
          .then((response) => {
            this.memo_cartes = response.data.data
            this.filteredMemoCarte = this.memo_cartes
            this.memo_carte = response.data.data?.[0]
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    fetchMemoCarteForPetDetail(data: any) {
      return new Promise((resolve, reject) => {
        api
          .get(`/memo_carte`, { params: data })
          .then((response) => {
            this.memo_carte_pet_details = response.data.data
            console.log('this.memo_carte_pet_details', this.memo_carte_pet_details)
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitMemoCarte(data: object, refresh: boolean = true) {
      return new Promise((resolve, reject) => {
        api
          .post(`/memo_carte`, data)
          .then((response) => {
            if (!refresh) {
              resolve(response)
            } else {
              this.recentMemoCarte = response.data
              resolve(response)
            }
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    submitMemoCarteV1(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`/cartes`, data)
          .then((response) => {
            this.recentMemoCarte = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateMemoCarte(id: number | string, data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/memo_carte/${id}`, data)
          .then((response) => {
            this.recentMemoCarte = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    updateMemoCarteGrouped(data: object) {
      return new Promise((resolve, reject) => {
        api
          .put(`/update_cartes`, data)
          .then((response) => {
            this.recentMemoCarte = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyMemoCarte(id: number | string) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/memo_carte/${id}`)
          .then((response) => {
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    destroyMemoCarteGrouped(data: object) {
      return new Promise((resolve, reject) => {
        api
          .delete(`/update_cartes`, { data })
          .then((response) => {
            this.recentMemoCarte = response.data
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    processCarte(value: any, filterData: any) {
      let data = value
      if (filterData && filterData.id_cli_common) {
        data = value.filter((item) => {
          return item?.memo_carte?.id_cli_common === filterData.id_cli_common
        })
      }
      if (!data.length) {
        return data
      }
      if (data.length) {
        return data.reduce((acc, item) => {
          const dateInsert = dateFormat(item.date_insert)
          const dateTimeInsert = item.datetime_group_carte
          if (!acc[dateInsert]) {
            acc[dateInsert] = {
              clinical_file_list: [],
              others: {}
            }
          }
          if (!acc[dateInsert].others[dateTimeInsert]) {
            acc[dateInsert].others[dateTimeInsert] = {
              grouped_cartes: false,
              date_insert: dateInsert,
              memo_carte_list: [],
              lab_result_list: {},
              medical_condition: [],
              pet_bio: {},
              lab_result_note_list: []
            }
          }

          if (item.memo_carte) {
            if (filterData && filterData.memo_other) {
              const temp_memo =
                item.memo_carte?.memo_obj +
                item.memo_carte?.memo_sbj +
                item.memo_carte?.memo_ass +
                item?.memo_carte?.memo_other +
                item.memo_carte?.pet_illness_history_list.reduce(
                  (v, illness) => {
                    return (
                      v +
                      `${illness?.name_disease ? illness.name_disease : ''} ${
                        illness?.name_disease_free
                          ? illness.name_disease_free
                          : ''
                      }`
                    )
                  },
                  ''
                )

              filterData?.memo_other.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

              const terms = filterData.memo_other
                .split(',')
                .map((term) => term.trim())
              const regexPattern = `(${terms.join('|')})`
              const regex = new RegExp(regexPattern, 'gi')

              if (temp_memo.search(regex) !== -1) {
                acc[dateInsert].others[dateTimeInsert].memo_carte_list.push({
                  ...item.memo_carte,
                  group_carte: item.group_carte
                })
              }
            } else {
              acc[dateInsert].others[dateTimeInsert].memo_carte_list.push({
                ...item.memo_carte,
                group_carte: item.group_carte
              })
            }

            if (
              item.memo_carte.memo_other &&
              (item.memo_carte?.memo_sbj ||
                item?.memo_carte?.memo_ass ||
                item?.memo_carte?.memo_obj)
            ) {
              acc[dateInsert].others[dateTimeInsert].grouped_cartes = true
            }

            this.memo_cartes.push({ ...item.memo_carte, group_carte: item.group_carte })
          }

          if (item.clinical_file) {
            if (
              !acc[dateInsert]?.clinical_file_list.find(
                (v: ClinicalFile) =>
                  v.id_clinical_file == item.clinical_file.id_clinical_file
              )
            )
              acc[dateInsert]?.clinical_file_list.push(item.clinical_file)
          }


          if (item.lab_result_note) {
            if (
              !acc[dateInsert]?.others[dateTimeInsert].lab_result_note_list.find(
                (v: any) =>
                  v.id_lab_result_note == item.lab_result_note.id_lab_result_note
              )
            )
              acc[dateInsert]?.others[dateTimeInsert].lab_result_note_list.push(item.lab_result_note)
          }

          if (item.pet_bio) {
            acc[dateInsert].others[dateTimeInsert].pet_bio = item.pet_bio
          }

          if (item.medical_condition) {
            acc[dateInsert].others[dateTimeInsert].medical_condition.push(
              item.medical_condition
            )
          }

          if (item.lab_result) {
            const dateTime = formatDateWithTime(
              item.lab_result.datetime_registered
            )
            if (
              !acc[dateInsert].others[dateTimeInsert].lab_result_list[
                item.lab_result.id_category2_lab
              ]
            )
              acc[dateInsert].others[dateTimeInsert].lab_result_list[
                item.lab_result.id_category2_lab
              ] = {}
            if (
              !acc[dateInsert].others[dateTimeInsert].lab_result_list[
                item.lab_result.id_category2_lab
              ][item.lab_result.id_cm_device]
            )
              acc[dateInsert].others[dateTimeInsert].lab_result_list[
                item.lab_result.id_category2_lab
              ][item.lab_result.id_cm_device] = {}
            if (
              !acc[dateInsert].others[dateTimeInsert].lab_result_list[
                item.lab_result.id_category2_lab
              ][item.lab_result.id_cm_device][dateTime]
            )
              acc[dateInsert].others[dateTimeInsert].lab_result_list[
                item.lab_result.id_category2_lab
              ][item.lab_result.id_cm_device][dateTime] = []

            acc[dateInsert].others[dateTimeInsert].lab_result_list[
              item.lab_result.id_category2_lab
            ][item.lab_result.id_cm_device][dateTime].push(item.lab_result)

            acc[dateInsert].others[dateTimeInsert].lab_result_list[
              item.lab_result.id_category2_lab
            ][item.lab_result.id_cm_device][dateTime] = orderBy(acc[dateInsert].others[dateTimeInsert].lab_result_list[
              item.lab_result.id_category2_lab
            ][item.lab_result.id_cm_device][dateTime], ['lab_set.display_order', 'lab_device.display_order', 'lab.display_order'], ['asc', 'asc', 'asc'])
          }

          if (
            acc[dateInsert].others[dateTimeInsert].memo_carte_list.filter(
              (v) => v.memo_obj || v.memo_sbj || v.memo_ass
            ).length > 0 ||
            item.type_carte == 2
          ) {
            acc[dateInsert].others[dateTimeInsert].grouped_cartes = true
          }

          return acc
        }, {})
      }
    },
    setGroupedMemoCarteData() {
      const groupedMemoCartesData:MemoCarteGroupType[] = []
      let memoCartes = this.filteredMemoCarteV1
    
      Object.keys(memoCartes).forEach((dateInsert: string) => {
    
        Object.keys(memoCartes[dateInsert].others).forEach((datetimeInsert: string) => {
          let groupedCart = memoCartes[dateInsert].others[datetimeInsert]
    
          if(groupedCart.grouped_cartes) {
            let tempMemoCarte: MemoCarteGroupType = {
              date_insert: dateInsert,
              data_cartes: groupedCart,
              id_pet_illness_history: useIllnessHistoryStore().getActiveIllnessHistoryList.getIllnessHistory?.id_pet_illness_history.toString() || '',
              clinical_file: memoCartes[dateInsert]?.clinical_file_list.filter((v) => v.datetime_receive === datetimeInsert) || [],
              datetimeInsert: datetimeInsert
            }
            groupedMemoCartesData.push(tempMemoCarte)
          }
        })
      })

      this.groupedMemoCartes = groupedMemoCartesData
    },
    setCurrentPage(payload: { id_request: string; id_pet: string | number; id_customer: string | number }) {
      this.currentPage = payload;
    },
    setTempFormData(data: any) {
      this.tempFormData = {
        petBioInfo: data.petBioInfo || null,
        memoCarteData: data.memoCarteData || null, 
        medConditionData: data.medConditionData || [],
        clinicalFiles: data.clinicalFiles || []
      }
    },
    clearTempFormData() {
      this.tempFormData = {
        petBioInfo: null,
        memoCarteData: null,
        medConditionData: [],
        clinicalFiles: []
      }
    }
  }
})

export default useMemoCarteStore
