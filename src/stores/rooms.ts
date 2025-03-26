import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useRoomStore = defineStore('room', {
  state: () => ({
    all_rooms: <any>[],
    rooms: [],
    room: null,
    recentRoom: null
  }),

  getters: {
    getAllRooms: (state) => state.all_rooms,
    getRooms: (state) => state.rooms,
    getRoom: (state) => state.room,
    getRecentRoom: (state) => state.recentRoom
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectRoom(id: string | number = null) {
      this.room = id ? this.rooms.find((v: any) => v.id_room === id) : null
    },

    async fetchRooms(data: any | null = null) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/rooms',
        data
      )
      if (res && res) {
        this.rooms = res
      }
    },

    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationRooms() {
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'mst/rooms'
      )
      if (res) {
        // const modifiedData = res.map((v) => {
        //   return {
        //     value: v.id_room,
        //     label: v.name_room,
        //     ...v
        //   }
        // })
        let modifiedData = [] as any
      res.map((v: any) => {
               v?.rooms?.map((room: any) => {
                modifiedData.push({
              value: room.id_room,
              label: room.name_room,
              ...room
            })})
        })
        this.all_rooms = modifiedData
        this.rooms = res
      }
    },

    async submitRoom(data: object) {
      var res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/rooms',
        data
      )
      if (res) {
        this.recentRoom = res
      }
    },

    async updateRoom(id: number | string, data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/mst/rooms/${id}`,
        data
      )
      if (res) {
        this.recentRoom = res
      }
    },

    async destroyRoom(id: number | string) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/mst/rooms/${id}`
      )
      if (res) {
        return true
      }
      return false
    }
  }
})

export default useRoomStore
