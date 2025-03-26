import { defineStore } from "pinia";
import mtUtils from "@/utils/mtUtils";
import selectOptions from "@/utils/selectOptions";
import { api } from '@/boot/axios'

export const useInfoDetailStore = defineStore("infoDetail", {
  state: () => ({
    all_info_details: <any>[],
    infoDetails: <any>[],
    infoDetail: null,
    recentInfoDetail: null,
  }),

  getters: {
    getAllInfoDetails: (state) => state.all_info_details,
    getInfoDetails: (state) => state.infoDetails,
    getInfoDetail: (state) => state.infoDetail,
    getRecentInfoDetail: (state) => state.recentInfoDetail,
  },

  // Temporary turn off the presist before stable
  persist: true,

  actions: {
    selectInfoDetail(id: string | number = null) {
      this.infoDetail = id
        ? this.infoDetails.find((v: any) => v.id_info_detail === id)
        : null;
    },
    async fetchInfoDetails(data: any | null = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'info_detail', data)
      if (res && res) {
        this.infoDetails = res;
      }
    },
    async submitInfoDetail(data: object) {
      return new Promise((resolve, reject) => {
        api
          .post(`info_detail`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
          .then((response) => {
            this.recentInfoDetail = response.data.data
            resolve(response.data.data)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    async getInfoDetailById(id_info_detail: any, data = null) {
      let res: any = await mtUtils.callApi(selectOptions.reqMethod.GET, `info_detail/${id_info_detail}`)
      if (res) {
        this.infoDetail = res
      }
    },
    async updateInfoDetail(id_info_detail: number | string, data: object) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `info_detail/${id_info_detail}`, data, false, { 'Content-Type': 'multipart/form-data' });
      if (res) {
        this.recentInfoDetail = res;
      }
    },
    async destroyInfoDetail(id_info_detail: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `info_detail/${id_info_detail}`);
      if (res) {
        return true;
      }
      return false;
    },
  },
});

export default useInfoDetailStore;
