import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'

export const useServiceDetailStore = defineStore('service_detail', {
  state: () => ({
    allServiceDetails: [],
    serviceDetails: [],
    serviceDetail: <any>{},
    recentServiceDetail: null,
    serviceGroupItems: <any>[],
    historyServiceDetail: <any>[],

    serviceDetailParams: {
      id_category1: [],
      id_category2: []
    },
    
    serviceDetailDiseases: [],
    serviceDetailSurgeries: [],
    serviceDetailTreatments: [],

    serviceDetailDateSchedule: null,
    recentServiceDetailList: <any>[],
    recentIdexxGroupServiceDetail: null,
    
    searchScheduleParams: null,
    selectedServiceDetailRecordList: <any>[],
    selectedIdexx: <Array<number>>[],
    idexxProccessData: <Object>{},
    idexxUrl: null
  }),

  getters: {
    getAllServiceDetails: (state) => state.allServiceDetails,
    getServiceDetails: (state) => state.serviceDetails,
    getServiceDetail: (state) => state.serviceDetail,
    getRecentServiceDetail: (state) => state.recentServiceDetail,
    getServiceDetailTempItems: (state) => state.serviceGroupItems,
    getHistoryServiceDetail: (state) => state.historyServiceDetail,

    getServiceDetailParams: (state) => state.serviceDetailParams,

    getServiceDetailDiseases: (state) => state.serviceDetailDiseases,
    getServiceDetailSurgeries: (state) => state.serviceDetailSurgeries,
    getServiceDetailTreatment: (state) => state.serviceDetailTreatments,

    getSearchScheduleParams: (state) => state.searchScheduleParams,

    getServiceDetailDateSchedule: (state) => state.serviceDetailDateSchedule,

    getSelectedServiceDetailRecordList: (state) => state.selectedServiceDetailRecordList,
    getSelectedIdexx: (state) => state.selectedIdexx,
    getIdexxProcessData: (state) => state.idexxProccessData,
    getIdexxUrl: (state) => state.idexxUrl,
    getRecentIdexxGroupServiceDetail: (state) => state.recentIdexxGroupServiceDetail
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    setSelectedServiceDetailRecordList(data: any) {
      this.selectedServiceDetailRecordList = data
    },

    resetRecentIdexxGroupServiceDetail() {
      this.recentIdexxGroupServiceDetail = null
    },
    
    addServiceDetailItem(data: object) {
      this.serviceGroupItems.push(data)
    },
    setServiceDetailList(value:any){
      if (!value) {
        this.serviceDetails = []
        return
      }
      this.serviceDetails = value.reduce((acc: any[], item: any) => {
        if (item.type_detail != 2) {
          acc.push({ ...item, effort_item: [] })
        } else if (item.type_detail == 2) {
          if (!acc.find((already) => already.effort_item.find((secAlready) => item.id_service_detail == secAlready.id_service_detail)))
            acc.push({
              ...item,
              effort_item: value.filter((child) => child.id_item_service == item.id_item_service && child.type_detail == 2)
            })
        } else {

        }
        return acc
      }, [])
    },
    setServiceDetail(value: any) {
      this.serviceDetail = value
    },
    setServiceDetailParams (value: any) {
      this.serviceDetailParams = value
    },
    setSearchScheduleParams(value: any) {
      this.searchScheduleParams = value;
    },
    setServiceDetailDateSchedule(value: any) {
      this.serviceDetailDateSchedule = value;
    },
    setSelectedIdexx(value: Array<number>) {
      this.selectedIdexx = value;
    },
    resetSelectedIdexx() {
      this.selectedIdexx = [];
    },
    setIdexxProccessData(value: Object) {
      this.idexxProccessData = value;
    },
    resetIdexxProccessData() {
      this.idexxProccessData = {};
    },
    selectServiceDetail(id: string | number | null = null, type = '') {
      let serviceDetailList = this.serviceDetails
      if (type !== '') {
        if (type === 'disease') serviceDetailList = this.serviceDetailDiseases
        else if (type ==='surgeries') serviceDetailList = this.serviceDetailSurgeries
        else if (type === 'treatment') serviceDetailList = this.serviceDetailTreatments
      }

      this.serviceDetail = id ? serviceDetailList.find((v: any) => v.id_service_detail === id) : null
      // TODO: For quick fixing, this code need to be improved
      if (!this.serviceDetail) {
        let serviceDetail = this.serviceDetailDiseases.find((v: any) => v.id_service_detail === id)
        if (!serviceDetail) {
          serviceDetail = this.serviceDetailSurgeries.find((v: any) => v.id_service_detail === id)
        }
        this.serviceDetail = serviceDetail
      }
    },


    // refactored all fetch api function to follow code rules of calling api via mtUtils.callApi() function
    async fetchAllServiceDetails(data: any = null) {
      try {
        let res : any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'service_details', data)
        if (res){
          this.allServiceDetails = res
          this.serviceDetails = res
        }
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async fetchAllHistoryServiceDetails(data: {id_customer: string, id_pet: string}) {
      // Use to get history service detail, on data able to return id_pet for filter
      // Used on Create Service Detail to get history SD list
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.GET, 'service_details', data)
        this.historyServiceDetail = res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async fetchSpecificServiceDetails(data: any = null) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.GET, 'service_details', data)
        this.serviceDetailDiseases = res.filter((v) => !v.flg_surgery && !v.flg_anesthesia && !v.flg_prevention)
        this.serviceDetailSurgeries = res.filter((v) => v.flg_surgery || v.flg_anesthesia)
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async fetchServiceDetails(id_request: any, data: any = null) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.GET, `/request/${id_request}/service_detail`, data)
        this.setServiceDetailList(res)
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async fetchServiceDetailById(id_service_detail: string | number | null = null) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.GET, `/service_details/${id_service_detail}`)
        this.serviceDetail = res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async submitServiceDetail(id_request: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.POST, `/request/${id_request}/service_detail`, data)
        if (res) {
        this.recentServiceDetail = res
        }
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async submitServiceDetailList(data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.POST, `/service_detail`, data)

        if (res) {
          this.recentServiceDetailList = res.service_detail_list
          if (res.idexx_group_service_detail) this.recentIdexxGroupServiceDetail = res.idexx_group_service_detail
          return res
        }

      } catch (error) {
        mtUtils.alert(error.message, 'Error!')
      }
    },
    
    async submitServiceDetailBooking(id_request: string, id_service_detail: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.POST, `/request/${id_request}/service_detail/${id_service_detail}/booking`, data)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async fetchGetIdexxUrl(id_service_detail) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.GET, `/get_lab_raw_url_idexx`, {
          id_service_detail
        })
        if (res)
          this.idexxUrl = res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },
    
    async submitServiceDetailIdexx(data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.POST, `/idexx_order`, data)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async updateServiceDetail(id_request: string, id: number | string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/request/${id_request}/service_detail/${id}`, data)
        this.recentServiceDetail = res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async updateServiceDetailBooking(id_request: string, id_service_detail: string, id_booking: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/request/${id_request}/service_detail/${id_service_detail}/booking/${id_booking}`, data)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async confirmIdexx(orderId: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.PUT, `https://integration.vetconnectplus.com/ui/order/${orderId}`, data)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async updateFlgNonCharge(data: object) {
      try {
        await mtUtils.callApi(selectOptions.reqMethod.PUT, '/service_detail/bulk-update-flg-non-charge', data)
        // Handle the response, e.g., update the local state
        // const res = await mtUtils.callApi(selectOptions.reqMethod.PUT, '/service_detail/bulk-update-flg-non-charge', data)
        // this.recentServiceDetail = res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async destroyServiceDetail(id_request: string, id: number | string) {
      try {
        await mtUtils.callApi(selectOptions.reqMethod.DELETE,`/request/${id_request}/service_detail/${id}`)
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

    async destroyServiceDetailBooking(id_request: string, id_service_detail: string, id_booking: string) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/request/${id_request}/service_detail/${id_service_detail}/booking/${id_booking}`)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },

  }
})

export default useServiceDetailStore
