import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import aahGlobal from '@/utils/aahGlobal'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { typeFloor } from '@/utils/enum'

export const usefeedstore = defineStore('feed', {
  state: () => ({
    feeds: [],
    all_feeds: [],
    feed: null,
    recentFeed: null,
    searchedFeeds : [],
  }),
  getters: {
    getfeeds: (state) => state.feeds,
    getAllfeeds: (state) => state.all_feeds,
    getfeed: (state) => state.feed,
    getRecentfeed: (state) => state.recentFeed,
    getSearchedfeeds:(state) => state.searchedFeeds
  },
  
  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectfeed(id: string | number = null) {
      this.feed = id
        ? this.feeds.find((v: any) => v.id_feed === id)
        : null;
    },
    async fetchfeeds(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'/feeds', data)

      if (res && res){
        this.feeds = res;
        this.searchedFeeds = res;
      }
    },
    //
    // FOR PREPARATION ONLY, THIS FUNCTION SHOULD BE CALLED ONCE ON THE MainLayout.vue files
    //
    async fetchPreparationfeeds() {
      var res:any = await mtUtils.callApi(selectOptions.reqMethod.GET,'/feeds',)
      if (res){
        const modifiedData = res.map((v:any) => {
          const typeFloorName = typeFloor.find(floor => floor.value === v.type_floor)?.label
          // const typeRoomfeedName = selectOptions.typeList.typefeedRoom.find(room => room.value === v.type_room_feed)?.label
          return {
            value: v.id_feed,
            label: v.code_feed + ' ' + v.name_feed + ' / ' + typeFloorName
            //  + ' (' + typeRoomfeedName + ')',
          };
        });
        this.all_feeds = modifiedData;
        this.feeds = res;

      }
    },
    async submitfeed(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, '/feed', data )
      if (res){
        this.recentFeed = res;
      }
    },
    async updatefeed(id_feed: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/feed/${id_feed}`, data);
      if (res){
        this.recentFeed = res;
      }
    },
    async destroyefeed(id_feed: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/feed/${id_feed}`);
      if (res){
        this.recentFeed = res;
      }
    },
  }
})

export default usefeedstore