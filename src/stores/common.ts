import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { getDateToday } from '@/utils/aahUtils'

export const useCommonStore = defineStore('common', {
  state: () => ({
    commonOptionList: [] as any[],
    commonTypeAnimalOptionList: <any>[],
    commonBreedOptionList: <any>[],
    commonPetHairColorOptionList: <any>[],
    commonUnitOptionList: <any>[],
    commonPillDivisionOptionList: <any>[],
    commonDiseaseInsurerOptionList: <any>[],
    commonDeviceOptionList: <any>[],
    commonDeviceOptionActiveList: <any>[],
    commonCustodyOptionList: <any>[],
    commonDeptList: <any>[],
    commonTypeServiceOptionList: <any>[],
    commonTypeMedicineFormatOptionList: <any>[],
    commonTypePetAlertOptionList: <any>[],
    commonTypeVisitPurposeList: <any>[],
    commonTypeReviewFood: <any>[],
    commonTypeReviewWater: <any>[],
    commonTypeReviewFeces: <any>[],
    commonTypeReviewUrine: <any>[],
    commonTypeReviewVomit: <any>[],
    commonTypeReviewRespiration: <any>[],
    commonTypeReviewWellness: <any>[],
    commonTypeReviewBodyTemprature: <any>[],
    commonTypeMedicineRouteList: <any>[],
    commonTypeGeneralInsurerOptionList: <any>[],
    commonDiscountRatesList: <any>[],
    commonTypePrintSize: <any>[],
    commonTypeCustomerColorList: <any>[],
    commonIdexxSearchList: <any>[],
  }),

  getters: {
    getCommonOptionList: (state) => state.commonOptionList,
    getCommonTypeAnimalOptionList: (state) => state.commonTypeAnimalOptionList,
    getCommonBreedOptionList: (state) => state.commonBreedOptionList,
    getCommonPetHairColorOptionList: (state) => state.commonPetHairColorOptionList,
    getCommonUnitOptionList: (state) => state.commonUnitOptionList,
    getCommonPillDivisionOptionList: (state) => state.commonPillDivisionOptionList,
    getCommonDiseaseInsurerOptionList: (state) => state.commonDiseaseInsurerOptionList,
    getCommonDepartmentList: (state) => state.commonDeptList,
    getCommonDeviceOptionList: (state) => state.commonDeviceOptionList,
    getCommonDeviceOptionActiveList: (state) => state.commonDeviceOptionActiveList,
    getCommonCustodyOptionList: (state) => state.commonCustodyOptionList,
    getCommonTypeServiceOptionList: (state) => state.commonTypeServiceOptionList,
    getCommonTypeMedicineFormatOptionList: (state) => state.commonTypeMedicineFormatOptionList,
    getCommonTypePetAlertOptionList: (state) => state.commonTypePetAlertOptionList,
    getCommonTypeVisitPurposeList: (state) => state.commonTypeVisitPurposeList,
    getCommonTypeReviewFood: (state) => state.commonTypeReviewFood,
    getCommonTypeReviewWater: (state) => state.commonTypeReviewWater,
    getCommonTypeReviewFeces: (state) => state.commonTypeReviewFeces,
    getCommonTypeReviewUrine: (state) => state.commonTypeReviewUrine,
    getCommonTypeReviewVomit: (state) => state.commonTypeReviewVomit,
    getCommonTypeReviewRespiration: (state) => state.commonTypeReviewRespiration,
    getCommonTypeReviewWellness: (state) => state.commonTypeReviewWellness,
    getCommonTypeReviewBodyTemprature: (state) => state.commonTypeReviewBodyTemprature,
    getCommonTypeMedicineRouteList: (state) => state.commonTypeMedicineRouteList,
    getCommonTypeGeneralInsurerOptionList: (state) => state.commonTypeGeneralInsurerOptionList,
    getCommonDiscountRatesList: (state) => state.commonDiscountRatesList,
    getCommonTypePrintSize: (state) => state.commonTypePrintSize,
    getCommonTypeCustomerColorList: (state) => state.commonTypeCustomerColorList,
    getCommonIdexxSearchList: (state) => state.commonIdexxSearchList,
  },
  persist: true,

  // In Store Should Always have different state for each code_common
  // If we are accessing certain code_common don't access CommonList it will return current state of API response
  actions: {

    fetchPreparationCommonList(data: any = null, forceFetch: boolean = false) {
      if (data && data.code_common) {
        let shouldReturn = true;

        if (data.code_common.includes(1) && this.commonTypeAnimalOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(2) && this.commonBreedOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(3) && this.commonPetHairColorOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(4) && this.commonUnitOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(5) && this.commonPillDivisionOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(6) && this.commonDiseaseInsurerOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(7) && this.commonDeviceOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(7) && this.commonDeviceOptionActiveList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(9) && this.commonDeptList.length === 0) {
          shouldReturn = false; 
        }
        if (data.code_common.includes(10) && this.commonTypePetAlertOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(11) && this.commonTypeServiceOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(12) && this.commonTypeMedicineFormatOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(13) && this.commonTypeVisitPurposeList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(17) && this.commonTypeReviewFood.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(18) && this.commonTypeReviewWater.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(19) && this.commonTypeReviewFeces.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(20) && this.commonTypeReviewUrine.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(21) && this.commonTypeReviewVomit.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(22) && this.commonTypeReviewRespiration.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(23) && this.commonTypeReviewWellness.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(24) && this.commonTypeReviewBodyTemprature.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(25) && this.commonTypeCustomerColorList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(27) && this.commonTypeMedicineRouteList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(28) && this.commonTypePrintSize.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(29) && this.commonTypeGeneralInsurerOptionList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(30) && this.commonDiscountRatesList.length === 0) {
          shouldReturn = false;
        }
        if (data.code_common.includes(31) && this.commonDiscountRatesList.length === 0) {
          shouldReturn = false;
        }
        if (shouldReturn && !forceFetch) {
          return;
        }
      }

      const params = { code_common: '', ...data }
      if (data && data.code_common) {
        params.code_common = JSON.stringify(data.code_common)
      }
      return new Promise((resolve, reject) => {
        api
          .get(`/mst/common`, {params})
          .then((response) => {
            if (this.commonOptionList) {
              this.commonOptionList = this.commonOptionList.filter((v) => !data.code_common.includes(v.code_common))
            }
            this.commonOptionList.push(...response.data.data)
            const modifiedData = response.data.data.map((v: any) => {
              return {
                ...v,
                value: v.id_common,
                label: v.name_common,
              }
            })

            if (data && data.code_common) {
              if (data.code_common.includes(1)) {
                this.commonTypeAnimalOptionList = modifiedData.filter((v: any) => v.code_common == 1)
              }
              if (data.code_common.includes(2)) {
                this.commonBreedOptionList = modifiedData.filter((v: any) => v.code_common == 2)
              }
              if (data.code_common.includes(3)) {
                this.commonPetHairColorOptionList = modifiedData.filter((v: any) => v.code_common == 3)
              }
              if (data.code_common.includes(4)) {
                this.commonUnitOptionList = modifiedData.filter((v: any) => v.code_common == 4)
              }
              if (data.code_common.includes(5)) {
                this.commonPillDivisionOptionList = modifiedData.filter((v: any) => v.code_common == 5)
              }
              if (data.code_common.includes(6)) {
                this.commonDiseaseInsurerOptionList = modifiedData.filter((v: any) => v.code_common == 6)
              }
              if (data.code_common.includes(7)) {
                this.commonDeviceOptionList = modifiedData.filter((v: any) => v.code_common == 7)
              }
              if (data.code_common.includes(7)) {
                this.commonDeviceOptionActiveList = modifiedData.filter((v: any) => 
                  v.code_common == 7 && 
                  v.date_start && v.date_end &&
                  v.date_start < getDateToday() && 
                  v.date_end > getDateToday()
                )
              }
              if (data.code_common.includes(8)) {
                this.commonCustodyOptionList = modifiedData.filter((v: any) => v.code_common == 8)
              }
              if (data.code_common.includes(9)) {
                this.commonDeptList = modifiedData.filter((v: any) => v.code_common == 9)
              }
              if (data.code_common.includes(10)) {
                this.commonTypePetAlertOptionList = modifiedData.filter((v: any) => v.code_common == 10)
              }
              if (data.code_common.includes(11)) {
                this.commonTypeServiceOptionList = modifiedData.filter((v: any) => v.code_common == 11)
              }
              if (data.code_common.includes(12)) {
                this.commonTypeMedicineFormatOptionList = modifiedData.filter((v: any) => v.code_common == 12).sort((a, b) => a.display_order - b.display_order)
              }
              if (data.code_common.includes(13)) {
                // created a new modified array because, we need code_func1 as an value in all typePurposeTicket selectionOptions.
                const modifiedPurpose = response.data.data.map((v: any) => {
                  return {
                    ...v,
                    // changed here v.code_func1 as an value not v.id_common
                    value: v.code_func1,
                    label: v.name_common,
                  }})
                this.commonTypeVisitPurposeList = modifiedPurpose.filter((v: any) => v.code_common == 13)
              }
              if (data.code_common.includes(17)) {
                this.commonTypeReviewFood = modifiedData.filter((v: any) => v.code_common == 17)
              }
              if (data.code_common.includes(18)) {
                this.commonTypeReviewWater = modifiedData.filter((v: any) => v.code_common == 18)
              }
              if (data.code_common.includes(19)) {
                this.commonTypeReviewFeces = modifiedData.filter((v: any) => v.code_common == 19)
              }
              if (data.code_common.includes(20)) {
                this.commonTypeReviewUrine = modifiedData.filter((v: any) => v.code_common == 20)
              }
              if (data.code_common.includes(21)) {
                this.commonTypeReviewVomit = modifiedData.filter((v: any) => v.code_common == 21)
              }
              if (data.code_common.includes(22)) {
                this.commonTypeReviewRespiration = modifiedData.filter((v: any) => v.code_common == 22)
              }
              if (data.code_common.includes(23)) {
                this.commonTypeReviewWellness = modifiedData.filter((v: any) => v.code_common == 23)
              }
              if (data.code_common.includes(24)) {
                this.commonTypeReviewBodyTemprature = modifiedData.filter((v: any) => v.code_common == 24)
              }
              if (data.code_common.includes(25)) {
                this.commonTypeCustomerColorList = modifiedData.filter((v: any) => v.code_common == 25)
              }
              if (data.code_common.includes(27)) {
                this.commonTypeMedicineRouteList = modifiedData.filter((v: any) => v.code_common == 27)
              }
              if (data.code_common.includes(28)) {
                this.commonTypePrintSize = modifiedData.filter((v: any) => v.code_common == 28)
              }
              
              if (data.code_common.includes(29)) {
                this.commonTypeGeneralInsurerOptionList = modifiedData.filter((v: any) => v.code_common == 29)
              }
              if (data.code_common.includes(30)) {
                this.commonDiscountRatesList = modifiedData.filter((v: any) => v.code_common == 30)
              }
              if (data.code_common.includes(31)) {
                this.commonIdexxSearchList = modifiedData.filter((v: any) => v.code_common == 31)
              }
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    destroyCommon(id_common: any) {
      return mtUtils.callApi(selectOptions.reqMethod.DELETE, `mst/common/${id_common}`)
    }
  }
})

export default useCommonStore
