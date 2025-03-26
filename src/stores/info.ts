import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useInfoStore = defineStore("info", {
  state: () => ({
    all_infos: <any>[],
    infos: <any>[],
    info: null,
    recentInfo: null,
  }),

  getters: {
    getAllInfos: (state) => state.all_infos,
    getInfos: (state) => state.infos,
    getInfo: (state) => state.info,
    getRecentInfo: (state) => state.recentInfo,
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectInfo(id: string | number = null) {
      this.info = id
        ? this.infos.find((v: any) => v.id_notification === id)
        : null;
    },
    async fetchInfos(data: any | null = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'info', data)
      if (res && res){
        this.infos = res;
      }
    },
    async submitInfo(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'info', data )
      if (res){
        this.recentInfo = res;
      }
    },
    async submitInfoFromDmPage(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'info_from_dm_page', data )
      if (res){
        this.recentInfo = res;
      }
    },
    async bulkCreateInfo(data: object) {
      var res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'info_list', data)
      if (res) {
        this.recentInfo = res
      }
    },
    async getInfoById(id_notification: any, data = null) {
      let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`info/${id_notification}`)
      if(res){
        this.info = res
      }
    },
    async updateInfo(id_notification: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `info/${id_notification}`, data);
      if (res){
        this.recentInfo = res;
      }
    },
    async bulkUpdateDeleteInfos(data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.POST, `info_bulk_update_delete`, data);
      if (res){
        return res
      }
    },
    async destroyInfo(id_notification: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `info/${id_notification}`);
      if (res){
        return true;
      }
      return false;
    },
  },
});

export default useInfoStore;
