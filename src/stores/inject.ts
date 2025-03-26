import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useInjectStore = defineStore('inject', {
  state: () => ({
    injectListByRequest: <any>[],
    injectListByPet: <any>[],
    injectDetailList: <any>[],
    itemServiceUnit: <any>[],
    valWeight: <any>0,
    searchParam: null,
    itemServiceUnitList: [],
    currentHeader: null,
    allInjectData: [] as any[],
    injectDetailListByUI: [] as any[],
    currentSelectedIdEmployeeDoctor: null
  }),

  getters: {
    getCurrentItemServiceUnitList: (state) => state.itemServiceUnitList,
    getInjectListByRequest: (state) => state.injectListByRequest,
    getInjectListByPet: (state) => state.injectListByPet,
    getInjectHeaderByPet(state) {
      return (id_pet) =>
        state.injectListByRequest.find(
          (prescription: any) => prescription.id_pet === id_pet
        )
    },
    getInjectDetailList: (state) => state.injectDetailList,
    getValWeight: (state) => state.valWeight,
    getInjectSearchParam: (state) => state.searchParam,
    getCurrentHeader: (state) => state.currentHeader,
    getAllInjectData: (state) => state.allInjectData,
    getCurrentSelectedIdEmployeeDoctor: (state) => state.currentSelectedIdEmployeeDoctor
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    setCurrentHeader(value) {
      this.currentHeader = value
    },
    resetItemServiceUnitList() {
      this.itemServiceUnitList.length = 0
    },
    appendToItemServiceList(value: any) {
      this.itemServiceUnitList.push(value)
    },
    setInjectSearchParam(value: any) {
      this.searchParam = value
    },
    setValWeight(value: any) {
      this.valWeight = value
    },
    resetInjectListByRequest() {
      this.injectListByRequest.length = 0
    },
    setSelectedTab(value: any) {
      this.selectedTab = value
    },
    resetSuggestCounter() {
      this.totalSuggestApiRequest = 0
      this.totalSuggestApiResponse = 0
      this.totalSuggestApiError = 0
    },
    setSuggestAPIReqCounter() {
      this.totalSuggestApiRequest += 1
    },
    setSuggestAPIResCounter() {
      this.totalSuggestApiResponse += 1
    },
    setTotalSuggestApiError() {
      this.totalSuggestApiError += 1
    },
    setItemServiceUnitList(value: any) {
      this.itemServiceUnitList = value
    },
    setInjectSearchParams(value: any) {
      this.searchParam = value
    },
    setSelectedMedicine(value: any) {
      this.selectedMedicine = value
    },
    setCurrentSelectedIdEmployee(value: any) {
      this.currentSelectedIdEmployeeDoctor = value
    },
    resetInjectDetailListByUI() {
      this.injectDetailListByUI.length = 0
    },
    pushIntoInjectDetailListUI(value: any) {
      this.injectDetailListByUI.push(value)
    },
    async fetchAllInjectData() {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'SearchInjectList'
      )
      if (response) {
        this.allInjectData = response
      }
    },
    async fetchInjectByRequest(id_request: any, params: any = {}) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `request/${id_request}/inject`,
        params
      )
      if (response) {
        this.injectListByRequest.length = 0

        this.injectListByRequest = [...response].map((injectObj: any) => {
          if (
            injectObj &&
            injectObj.inject_detail_list &&
            injectObj.inject_detail_list.length
          ) {
            const updatedList = injectObj.inject_detail_list.reduce((acc: any[], item: any) => {
              if (item.id_inject_detail_parent == null && item.type_detail != 2) {
                acc.push({ ...item, effort_item: [] });
              } else if (item.id_inject_detail_parent == null && item.type_detail == 2) {
                if (!acc.find((already) => already.effort_item.find((secAlready) => item.id_inject_detail == secAlready.id_inject_detail)))
                  acc.push({
                    ...item,
                    effort_item: injectObj.inject_detail_list.filter((child) => child.id_item_service == item.id_item_service && child.type_detail == 2)
                  })
              } else {
                const parent = acc.find(
                  (parentItem) => parentItem.id_inject_detail == item.id_inject_detail_parent
                );
                if (parent && item.type_detail == 3) {
                  parent.effort_item.push(item);
                }
              }
              return acc;
            }, []);

            injectObj.inject_detail_list = updatedList;
          }

          return injectObj;
        })
      }
    },
    async fetchRequestByInject(id_prescription: any) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `request/prescription/${id_prescription}`
      )
      if (response) {
        this.injectListByRequest.length = 0
        this.injectListByRequest = [...response]
      }
    },
    async submitInjectObj(id_request: any, payload: any) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `request/${id_request}/inject`,
        payload
      )
      if (res) {
        return res
      }
      return null
    },
    async updInjectObj(id_request: any, id_inject: any, payload: any) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `request/${id_request}/inject/${id_inject}`,
        payload
      )
      if (res) {
        return res
      }
      return null
    },
    async createInjectDetailBooking(id_request: string, id_inject_detail: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.POST, `/request/${id_request}/inject_detail/${id_inject_detail}/booking`, data)
        return res
      } catch (error) {
        mtUtils.alert(error.message, 'Error!')
      }
    },
    async updateFlgNonCharge(data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        '/inject_detail/bulk-update-flg-non-charge',
        data
      )
      if (res) {
        return res
      }
      return null
    },
    async updateInjectDetailBooking(id_request: string, id_inject_detail: string, id_booking: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/request/${id_request}/inject_detail/${id_inject_detail}/booking/${id_booking}`, data)
        return res
      } catch (error) {
        mtUtils.alert(error.message, 'Error!')
      }
    },
    async fetchItemServiceUnit(id_item_service: any) {
      const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, '/mst/item_service_units',
        { 'id_item_service': id_item_service })
      if (response) {
        this.itemServiceUnit = response
        return this.itemServiceUnit
      }
      return null
    },
    // prescription Detail section 
    async fetchInjectDetailByPet(params: any) {
      const response: any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'inject_detail', params)
      if (response) {
        this.injectDetailList = response
      }
    },
    destoryInject(id_request: any, id_inject: any) {
      return mtUtils.callApi(selectOptions.reqMethod.DELETE, `request/${id_request}/inject/${id_inject}`)
    },
    destroyInjectDetail(id_prescription: any, id_inject_detail: any) {
      return mtUtils.callApi(selectOptions.reqMethod.DELETE, `inject/${id_prescription}/inject_details/${id_inject_detail}`)
    },
    async destroyInjectDetailBooking(id_request: string, id_inject_detail: string, id_booking: string) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/request/${id_request}/inject_detail/${id_inject_detail}/booking/${id_booking}`)
        return res
      } catch (error) {
        mtUtils.alert(error.message, 'Error!')
      }
    }
  }
})

export default useInjectStore
