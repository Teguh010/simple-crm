import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { empInfoType } from '@/types/types'

type empInfoReadType = {
  id_emp_info: number,
  id_employee: number,
  flg_read: boolean
}

export const useEmpInfoStore = defineStore("empInfo", {
  state: () => ({
    allEmpInfos: [] as empInfoType[],
    empInfos: [] as empInfoType[],
    empInfo: {} as empInfoType,
    recentEmpInfo: {} as empInfoType
  }),
  
  getters: {
    getAllEmpInfos: (state) => state.allEmpInfos,
    getEmpInfos: (state) => state.empInfos,
    getEmpInfo: (state) => state.empInfo,
    getRecentEmpInfo: (state) => state.recentEmpInfo
  },

  actions: {
    async fetchEmpInfos(data: any | null = null) {
      const res : any = await mtUtils.callApi(selectOptions.reqMethod.GET,'emp_info', data)
      if (res && res){
        this.empInfos = res;
      }
    },
    async submitEmpInfo(data: object) {
      var res : any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'emp_info', data )
      if (res){
        this.recentEmpInfo = res;
      }
      return res
    },
    async updateEmpInfo(id_emp_info: number | string, data: empInfoType) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.PUT, `emp_info/${id_emp_info}`, data);
      if (res){
        this.recentEmpInfo = res;
      }
      return res
    },
    async selectEmpInfo(id: string | number = '') {
      if(this.empInfo && this.empInfo.id_emp_info === id) {
        return
      }
      this.empInfo = {} as empInfoType
      const res:any = await mtUtils.callApi(selectOptions.reqMethod.GET, `emp_info/${id}`) as empInfoType
      if(res) {
        this.empInfo = res
      }
    },
    async destroyEmpInfo(id_emp_info: number | string) {
      const res: any = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `emp_info/${id_emp_info}`);
      if (res){
        return true;
      }
      return false;
    },
    async updateEmpInfoRead(data:empInfoReadType) {
      const res:any = await mtUtils.callApi(selectOptions.reqMethod.POST, 'emp_info_read', data)
      if(res) {
        return true;
      }
      return false
    },
    async sendEmail(id_emp_info: number | string) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `emp_info/${id_emp_info}/send_email`
      )
      return res
    },
  }
});

export default useEmpInfoStore;