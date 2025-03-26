import { defineStore } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { PrescriptionType } from '@/types/types'

export const usePrescriptionStore = defineStore('prescription', {
  state: () => ({
    prescriptionListByRequest: <any>[],
    quickPrescriptionHeader: <any>[],
    prescriptionListByPet: <any>[],
    prescriptionDetailList: <any>[],
    itemServiceUnit: <any>[],
    allPrescriptionDetailList:<any>[], 
    searchParam: null,
    selectedMedicine : null,
    totalSuggestApiRequest:0,
    totalSuggestApiResponse:0,
    totalSuggestApiError: 0,
    selectedTab: 0,
    prescriptionAssortVolume: 0,
    assortRadioValue: null,
    allPrescriptionData: [] as PrescriptionType[],
    prescriptionDetailListByUI: [], // This array will be used to store state of createByPet
    dmSearchParam: null,
    dmSearchCount: 0,
  }),

  getters: {
    getPrescriptionListByRequest: (state) => state.prescriptionListByRequest,
    getPrescriptionListByPet: (state) => state.prescriptionListByPet,
    getPrescriptionHeaderByPet(state) {
      return (id_pet) =>
        state.prescriptionListByRequest.find(
          (prescription: any) => prescription.id_pet === id_pet
        )
    },
    getQuickPrescriptionHeader: (state: any) => {
      return (id_pet) => state.quickPrescriptionHeader
    },
    getPrescriptionDetailList: (state) => state.prescriptionDetailList,
    getItemServiceUnit: (state)=>state.itemServiceUnit,
    getAllPrescriptionDetailList: (state) => state.allPrescriptionDetailList,
    getPrescriptionSearchParams: (state) => state.searchParam,
    getSelectedMedicine:(state) => state.selectedMedicine,
    getSuggestAPIReqCounter:(state)=>state.totalSuggestApiRequest,
    getSuggestAPIResCounter:(state)=>state.totalSuggestApiResponse,
    getSuggestAPIErrorCounter:(state)=>state.totalSuggestApiError,
    getSelectedTab:(state)=>state.selectedTab,
    getPrescriptionAssortVolume:(state)=>state.prescriptionAssortVolume,
    getAllPrescriptionData: (state) => state.allPrescriptionData,
    getDmSearchParams: (state) => state.dmSearchParam,
    getDmSearchCount: (state) => state.dmSearchCount,
  },

  // Temporary turn off the presist before stable
  // persist: true,

  actions: {
    setAssortVolume(payload) {
      this.prescriptionAssortVolume = payload
    },
    resetPrescriptionListByRequest() {
      this.prescriptionListByRequest.length = 0;
    },
    setPrescriptionHeaderForQuickRequest(prescriptionHeader: any) {
      this.quickPrescriptionHeader = prescriptionHeader
    },
    setSelectedTab(value:any){
      this.selectedTab = value
    },
    resetSuggestCounter(){
      this.totalSuggestApiRequest = 0
      this.totalSuggestApiResponse = 0
      this.totalSuggestApiError = 0
    },
    setSuggestAPIReqCounter(){
      this.totalSuggestApiRequest += 1
    },
    setSuggestAPIResCounter(){
      this.totalSuggestApiResponse += 1
    },
    setTotalSuggestApiError(){
      this.totalSuggestApiError += 1
    },
    setItemServiceUnitList (value:any){
      this.itemServiceUnit = value
    },
    setPrescriptionSearchParams(value: any) {
      this.searchParam = value;
    },
    setSelectedMedicine(value : any){
      this.selectedMedicine = value
    },
    resetPrescriptionDetailListUI() {
      this.prescriptionDetailListByUI.length = 0
    },
    pushIntoPrescriptionDetailList(value) {
      this.prescriptionDetailListByUI.push(value)
    },
    removeIndexFromDetailList(index) {
      this.prescriptionDetailListByUI.splice(index, 1)
    },
    async fetchAllPrescriptionData() {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'SearchPrescriptionList'
      )
      if (response) {
        this.allPrescriptionData = response
      }
    },
    async fetchPrescriptionByRequest(id_request: any, params:any = {}) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `request/${id_request}/prescription`,
        params
      )
      if (response) {
        this.prescriptionListByRequest.length = 0

        this.prescriptionListByRequest = [...response].map((prescriptionObj: any) => {
          if (
            prescriptionObj &&
            prescriptionObj.prescription_detail_list &&
            prescriptionObj.prescription_detail_list.length
          ) {
            const updatedList = prescriptionObj.prescription_detail_list.reduce((acc: any[], item: any) => {
              if (item.id_prescription_detail_ref == null) {
                acc.push({ ...item, effort_item: null });
              } else if (item.id_prescription_detail_ref != null && !(item.flg_etc1 || item.flg_etc2)) {
                acc.push({ ...item, effort_item: null })
              } else {
                const parent = acc.find(
                  (parentItem) => parentItem.id_prescription_detail === item.id_prescription_detail_ref
                );
                if (parent && item.flg_etc2) {
                  parent.effort_item = item;
                }
              }
              return acc;
            }, []);

            prescriptionObj.prescription_detail_list = updatedList;
          }

          return prescriptionObj;
        })
      }
    },
    async fetchPrescriptionListComplete(id_request: any, params:any = {}) { // Using on view pet detail modal
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `request/${id_request}/prescription`,
        params
      )
      if (response) {
        this.prescriptionListByRequest.length = 0

        this.prescriptionListByRequest = [...response].map((prescriptionObj: any) => {
          if (
            prescriptionObj &&
            prescriptionObj.prescription_detail_list &&
            prescriptionObj.prescription_detail_list.length
          ) {
            const updatedList = prescriptionObj.prescription_detail_list.reduce((acc: any[], item: any) => {
              if (item.id_prescription_detail_ref == null) {
                acc.push({ ...item, effort_item: null });
              } else if (item.id_prescription_detail_ref != null && !(item.flg_etc1 || item.flg_etc2)) {
                acc.push({ ...item, effort_item: null })
              } else {
                const parent = acc.find(
                  (parentItem) => parentItem.id_prescription_detail === item.id_prescription_detail_ref
                );
                if (parent && item.flg_etc2) {
                  parent.effort_item = item;
                }
              }
              return acc;
            }, []);

            prescriptionObj.prescription_detail_list = updatedList;
          }

          return prescriptionObj;
        })
      }
    },
    async fetchRequestByPrescription(id_prescription : any) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `request/prescription/${id_prescription}`
      )
      if (response) {
        this.prescriptionListByRequest.length = 0
        this.prescriptionListByRequest = [...response]
      }
    },
    async submitPrescriptionObj(id_request: any, payload: any) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `request/${id_request}/prescription`,
        payload, false, {}, false, true
      )
      if (res) {
        return res
      }
      return null
    },
    async updPrescriptionObj(id_request: any, id_prescription:any, payload: any) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `request/${id_request}/prescription/${id_prescription}`,
        payload
      )
      if (res) {
        return res
      }
      return null
    },
    async updateSpecificColumnPrescriptionDetail(id_prescription_detail: string, payload: object) {
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `UpdPrescriptionDetailNo/${id_prescription_detail}`,
        payload
      )
      if (response) {
        return response
      }
      return null
    },
    async createPrescriptionDetail(id_request: any, payload: any) {
      if (!payload.id_prescription) {
        return
      }
      const response: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `request/${id_request}/prescription_detail`,
        payload
      )
      if (response) {
        return response
      }
      return null
    },
    async createPrescriptionDetailBooking(id_request: string, id_prescription_detail: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.POST, `/request/${id_request}/prescription_detail/${id_prescription_detail}/booking`, data)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },
    async updateFlgNonCharge(data: object) {
      const res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        '/prescription_detail/bulk-update-flg-non-charge',
        data
      )
      if (res) {
        return res
      }
      return null
    },
    async updatePrescriptionDetailBooking(id_request: string, id_prescription_detail: string, id_booking: string, data: object) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.PUT, `/request/${id_request}/prescription_detail/${id_prescription_detail}/booking/${id_booking}`, data)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },
    async fetchItemServiceUnit(id_item_service:any){
    const response : any = await mtUtils.callApi(selectOptions.reqMethod.GET, '/mst/item_service_units',
        { 'id_item_service' : id_item_service})
    if(response){
      this.itemServiceUnit = response
      return this.itemServiceUnit
    }
    return null
    },
    // prescription Detail section 
    async fetchPrescriptionDetailList(params:any){
      const response : any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'prescription_details', params)
        if ( response){
          this.prescriptionDetailList = response
        }
    },
    async fetchPrescriptionListByPet(id_pet:string, data: any = {}){
      const response : any = await mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchPrescriptionList', {id_pet, ...data})
        if ( response){
          this.prescriptionListByPet = response
        }
    },
    destroyPrescription(id_request :any , id_prescription:any){
      return mtUtils.callApi(selectOptions.reqMethod.DELETE, `request/${id_request}/prescription/${id_prescription}`)
    },
    destroyPrescriptionDetail(id_prescription:any, id_prescription_detail : any){
      return mtUtils.callApi(selectOptions.reqMethod.DELETE, `prescriptions/${id_prescription}/prescription_details/${id_prescription_detail}`)
    },
    async destroyPrescriptionDetailBooking(id_request: string, id_prescription_detail: string, id_booking: string) {
      try {
        const res = await mtUtils.callApi(selectOptions.reqMethod.DELETE, `/request/${id_request}/prescription_detail/${id_prescription_detail}/booking/${id_booking}`)
        return res
      } catch(error) {
        mtUtils.alert(error.message, "Error!");
      }
    },
    setDmSearchParams(value: any, count: number) {
      this.dmSearchParam = value
      this.dmSearchCount = count
    },
  }
})

export default usePrescriptionStore
