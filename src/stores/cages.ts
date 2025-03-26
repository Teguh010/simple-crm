
import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { CageType, RoomType } from '@/types/types'
import { ref, computed } from 'vue'

type CagesType = {
  id_room: string
  room_list: RoomType[]
}

type ModifiedDataType = {
  id_room: string
  label: string
  name_cage: string
  value: string
}

export const useCageStore = defineStore('cage', () => {
  // State
  const cages = ref<any>([])
  const all_cages = ref<ModifiedDataType[]>([])
  const cage = ref(null)
  const recentCage = ref(null)
  const searchedCages = ref([])
  const cagesByLoginClinic = ref([])

  // Getters
  const getCages = computed(() => cages.value)
  const getAllCages = computed(() => all_cages.value)
  const getCage = computed(() => cage.value)
  const getRecentCage = computed(() => recentCage.value)
  const getSearchedCages = computed(() => searchedCages.value)
  const getCagesByLoginClinic = computed(() => cagesByLoginClinic.value)

  // Actions
  const selectCage = (id: string | number | null = null) => {
    cage.value = id ? cages.value.find((v: any) => v.id_cage === id) : null
  }

  const fetchCages = async (data: CageType | null = null) => {
    let res: any = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      'mst/cages',
      data
    )
    if (res) {
      cages.value = res
      searchedCages.value = res
    }
  }

  // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
  const fetchPreparationCages = async () => {
    const res: any = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      'mst/cages'
    )
    if (res) {
      const response = JSON.parse(JSON.stringify(res))
      cages.value = res
      cagesByLoginClinic.value = response.filter(
        (v: any) =>
          v.id_clinic ===
          localStorage.getItem('id_clinic')?.toString().replace('"', '')
      )

      let modifiedData = [] as ModifiedDataType[]
      res.map((v: CagesType) => {
        v?.room_list?.map((room: RoomType) => {
          room?.cage_list?.map((cag: CageType) => {
            const name = cag?.name_cage ? cag?.name_cage : ''
            modifiedData.push({
              value: cag.id_cage,
              label:
                cag.code_cage + '　' + cag.name_cage + ' @' + room.name_room,
              name_cage: `${name} @ ${room.name_room}`,
              id_room: cag.id_room
            })
          })
        })
      })
      all_cages.value = modifiedData
    }
  }

  const submitCage = async (data: object) => {
    const res: any = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'mst/cages',
      data
    )
    if (res) {
      recentCage.value = res
    }
  }

  const updateCage = async (id_cage: number | string, data: object) => {
    const res: any = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `/mst/cages/${id_cage}`,
      data
    )
    if (res) {
      recentCage.value = res
    }
  }

  const destroyCage = async (id_cage: number | string) => {
    const res: any = await mtUtils.callApi(
      selectOptions.reqMethod.DELETE,
      `/mst/cages/${id_cage}`
    )
    return res ? true : false
  }

  return {
    cages,
    all_cages,
    cage,
    recentCage,
    searchedCages,
    cagesByLoginClinic,
    getCages,
    getAllCages,
    getCage,
    getRecentCage,
    getSearchedCages,
    getCagesByLoginClinic,
    selectCage,
    fetchCages,
    fetchPreparationCages,
    submitCage,
    updateCage,
    destroyCage
  }
})

export default useCageStore
