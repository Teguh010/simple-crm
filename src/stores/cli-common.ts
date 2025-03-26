import { defineStore } from 'pinia'
import { api } from '@/boot/axios'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { CliCommon, GenericValueLabelType } from '@/types/types'
import useItemStore from '@/stores/items'
import useItemServiceUnitStore from '@/stores/item-service-units'

export const useCliCommonStore = defineStore('cli-common', {
  state: () => ({
    cliCommonOptionList: [] as CliCommon[],
    allCliCommonMedConditionOptionList: [] as GenericValueLabelType[],
    cliCommonMedConditionOptionList: [] as GenericValueLabelType[],

    recentCliCommon: {} as CliCommon,

    // cliCommon state based on value from enum codeCliCommonList
    cliCommonTypeDepartmentList: [] as CliCommon[],
    cliCommonCustodyItemList: [] as CliCommon[],
    cliCommonCustomerColorList: [] as CliCommon[],
    cliCommonQTVisitPurposeList: [] as CliCommon[],
    cliCommonPublicHealthCenterList: [] as CliCommon[],
    cliCommonTypePaymentMethodList: [] as CliCommon[],
    cliCommonDiscountRateList: [] as CliCommon[],
    cliCommonHairColorList: [] as CliCommon[],
    cliCommonTypePetNatureList: [] as CliCommon[],
    cliCommonTypeDiagnosisList: [] as CliCommon[],
    cliCommonTypeCarteSourceList: [] as CliCommon[],
    cliCommonQuestionnaireVisitList: [] as CliCommon[],
    cliCommonTypeMedRouteList: [] as CliCommon[],
    cliCommonTypeMemoCarteList: [] as CliCommon[],
    cliCommonTypeReviewFoodList: [] as CliCommon[],
    cliCommonIVLS: [] as CliCommon[],
    cliCommonPrintPdf: [] as CliCommon[],
    cliCommonTackSeal: [] as CliCommon[],
    cliCommonAutoPriceCalculation: [] as CliCommon[],
    cliCommonOuterLabRef: [] as CliCommon[],
    cliCommonModalButton: [] as CliCommon[],
    cliCommonTypeReviewWaterList: [] as CliCommon[],
    cliCommonTypeReviewFecesList: [] as CliCommon[],
    cliCommonTypeReviewUrineList: [] as CliCommon[],
    cliCommonTypeReviewVomitList: [] as CliCommon[],
    cliCommonTypeReviewRespirationList: [] as CliCommon[],
    cliCommonTypeReviewWellnessList: [] as CliCommon[],
    cliCommonTypeReviewTemperatureList: [] as CliCommon[],
    cliCommonTypeCategoryList: [] as CliCommon[],
    cliCommonMedConBcsList: [] as CliCommon[],
    cliCommonMedConBcsWithNonActiveList: [] as CliCommon[],
    cliCommonMedConHeartNoiseList: [] as CliCommon[],
    cliCommonMedConLungNoiseList: [] as CliCommon[],
    cliCommonMedConLymphNodeList: [] as CliCommon[],
    cliCommonMedConCrtList: [] as CliCommon[],
    cliCommonMedConMembraneList: [] as CliCommon[],
    cliCommonMedConDehydrationList: [] as CliCommon[],
    cliCommonMedConHeartBeatList: [] as CliCommon[]
  }),

  getters: {
    getCliCommonOptionList: (state) => state.cliCommonOptionList,
    getAllCliCommonMedConditionOptionList: (state) =>
      state.allCliCommonMedConditionOptionList,
    getCliCommonMedConditionOptionList: (state) =>
      state.cliCommonMedConditionOptionList,

    // cliCommon getters based on value from enum codeCliCommonList
    getCliCommonTypeDepartmentList: (state) =>
      state.cliCommonTypeDepartmentList,
    getCliCommonCustodyItemList: (state) => state.cliCommonCustodyItemList,
    getCliCommonCustomerColorList: (state) => state.cliCommonCustomerColorList,
    getCliCommonQTVisitPurposeList: (state) =>
      state.cliCommonQTVisitPurposeList,
    getCliCommonPublicHealthCenterList: (state) =>
      state.cliCommonPublicHealthCenterList,
    getCliCommonTypePaymentMethodList: (state) =>
      state.cliCommonTypePaymentMethodList,
    getCliCommonDiscountRateList: (state) => state.cliCommonDiscountRateList,
    getCliCommonHairColorList: (state) => state.cliCommonHairColorList,
    getCliCommonTypePetNatureList: (state) => state.cliCommonTypePetNatureList,
    getCliCommonTypeDiagnosisList: (state) => state.cliCommonTypeDiagnosisList,
    getCliCommonTypeCarteSourceList: (state) =>
      state.cliCommonTypeCarteSourceList,
    getCliCommonQuestionnaireVisitList: (state) =>
      state.cliCommonQuestionnaireVisitList,
    getCliCommonTypeMedRouteList: (state) => state.cliCommonTypeMedRouteList,
    getCliCommonTypeMemoCarteList: (state) => state.cliCommonTypeMemoCarteList,
    getCliCommonTypeReviewFoodList: (state) =>
      state.cliCommonTypeReviewFoodList,
    getCliCommonTypeReviewWaterList: (state) =>
      state.cliCommonTypeReviewWaterList,
    getCliCommonTypeReviewFecesList: (state) =>
      state.cliCommonTypeReviewFecesList,
    getCliCommonTypeReviewUrineList: (state) =>
      state.cliCommonTypeReviewUrineList,
    getCliCommonTypeCategoryList: (state) => state.cliCommonTypeCategoryList,
    getCliCommonIVLS: (state) => state.cliCommonIVLS,
    getCliCommonPrintPdf: (state) => state.cliCommonPrintPdf,
    getCliCommonTackSeal: (state) => state.cliCommonTackSeal,
    getCliCommonAutoPriceCalculation: (state) => state.cliCommonAutoPriceCalculation,
    getCliCommonOuterLabRef: (state) => state.cliCommonOuterLabRef,
    getCliCommonModalButton: (state) => state.cliCommonModalButton,
    getCliCommonTypeReviewVomitList: (state) =>
      state.cliCommonTypeReviewVomitList,
    getCliCommonTypeReviewRespirationList: (state) =>
      state.cliCommonTypeReviewRespirationList,
    getCliCommonTypeReviewWellnessList: (state) =>
      state.cliCommonTypeReviewWellnessList,
    getCliCommonTypeReviewTemperatureList: (state) =>
      state.cliCommonTypeReviewTemperatureList,
    getCliCommonMedConBcsList: (state) => state.cliCommonMedConBcsList,
    getCliCommonMedConBcsWithNonActiveList: (state) => state.cliCommonMedConBcsWithNonActiveList,
    getCliCommonMedConHeartNoiseList: (state) =>
      state.cliCommonMedConHeartNoiseList,
    getCliCommonMedConLungNoiseList: (state) =>
      state.cliCommonMedConLungNoiseList,
    getCliCommonMedConLymphNodeList: (state) =>
      state.cliCommonMedConLymphNodeList,
    getCliCommonMedConCrtList: (state) => state.cliCommonMedConCrtList,
    getCliCommonMedConMembraneList: (state) =>
      state.cliCommonMedConMembraneList,
    getCliCommonMedConDehydrationList: (state) =>
      state.cliCommonMedConDehydrationList,
    getCliCommonMedConHeartBeatList: (state) =>
      state.cliCommonMedConHeartBeatList
  },
  persist: true,

  // In Store Should Always have different state for each code_cli_common
  // If we are accessing certain code_cli_common don't access CliCommonList it will return current state of API response
  actions: {
    fetchPreparationCliCommonList(
      data: any = null,
      forceFetch: boolean = false
    ) {
      if (data && data.code_cli_common) {
        let shouldReturn = true

        if (
          data.code_cli_common.includes(1) &&
          this.cliCommonTypeDepartmentList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(2) &&
          this.cliCommonCustodyItemList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(3) &&
          this.cliCommonCustomerColorList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(4) &&
          this.cliCommonQTVisitPurposeList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(5) &&
          this.cliCommonPublicHealthCenterList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(6) &&
          this.cliCommonTypePaymentMethodList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(7) &&
          this.cliCommonDiscountRateList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(8) &&
          this.cliCommonHairColorList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(9) &&
          this.cliCommonTypePetNatureList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(10) &&
          this.cliCommonTypeDiagnosisList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(11) &&
          this.cliCommonTypeCarteSourceList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(12) &&
          this.cliCommonQuestionnaireVisitList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(13) &&
          this.cliCommonTypeMedRouteList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(14) &&
          this.cliCommonTypeMemoCarteList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(15) &&
          this.cliCommonIVLS.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(16) &&
          this.cliCommonPrintPdf.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(19) &&
          this.cliCommonOuterLabRef.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(20) &&
          this.cliCommonTypeCategoryList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(21) &&
          this.cliCommonTackSeal.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(22) &&
          this.cliCommonAutoPriceCalculation.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(18) &&
          this.cliCommonModalButton.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(51) &&
          this.cliCommonTypeReviewFoodList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(52) &&
          this.cliCommonTypeReviewWaterList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(53) &&
          this.cliCommonTypeReviewFecesList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(54) &&
          this.cliCommonTypeReviewUrineList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(55) &&
          this.cliCommonTypeReviewVomitList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(56) &&
          this.cliCommonTypeReviewRespirationList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(57) &&
          this.cliCommonTypeReviewWellnessList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(58) &&
          this.cliCommonTypeReviewTemperatureList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(201) &&
          this.cliCommonMedConBcsList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(202) &&
          this.cliCommonMedConHeartNoiseList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(203) &&
          this.cliCommonMedConLungNoiseList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(204) &&
          this.cliCommonMedConLymphNodeList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(205) &&
          this.cliCommonMedConCrtList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(206) &&
          this.cliCommonMedConMembraneList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(207) &&
          this.cliCommonMedConDehydrationList.length === 0
        ) {
          shouldReturn = false
        }
        if (
          data.code_cli_common.includes(208) &&
          this.cliCommonMedConHeartBeatList.length === 0
        ) {
          shouldReturn = false
        }
        if (shouldReturn && !forceFetch) {
          return
        }
      }
      const params = { code_cli_common: '' }
      if (data && data.code_cli_common) {
        params.code_cli_common = JSON.stringify(data.code_cli_common)
      }
      return new Promise((resolve, reject) => {
        api
          .get<{ data: CliCommon[] }>(`/mst/clinic_common`, { params })
          .then((response) => {
            const modifiedData = response.data.data.filter((c) => new Date(c.date_end) > new Date()).map((v: any) => {
              return {
                ...v,
                value: v.id_cli_common,
                label: v.name_cli_common
              }
            })
            const modifiedWithNonActiveData = response.data.data.map((v: any) => {
              return {
                ...v,
                value: v.id_cli_common,
                label: v.name_cli_common
              }
            })
            this.cliCommonOptionList = modifiedData

            if (data && data.code_cli_common) {
              if (data.code_cli_common.includes(1)) {
                this.cliCommonTypeDepartmentList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '1'
                )
              }
              if (data.code_cli_common.includes(2)) {
                this.cliCommonCustodyItemList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '2'
                )
              }
              if (data.code_cli_common.includes(3)) {
                this.cliCommonCustomerColorList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '3'
                )
              }
              if (data.code_cli_common.includes(4)) {
                // filter and remap the value to code_func1
                this.cliCommonQTVisitPurposeList = modifiedData
                  .filter((v: CliCommon) => v.code_cli_common === '4')
                  .map((v: CliCommon) => {
                    return { ...v, value: v.code_func1 }
                  })
              }
              if (data.code_cli_common.includes(5)) {
                this.cliCommonPublicHealthCenterList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '5'
                )
              }
              if (data.code_cli_common.includes(6)) {
                this.cliCommonTypePaymentMethodList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '6'
                )
              }
              if (data.code_cli_common.includes(7)) {
                this.cliCommonDiscountRateList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '7'
                )
              }
              if (data.code_cli_common.includes(8)) {
                this.cliCommonHairColorList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '8'
                )
              }
              if (data.code_cli_common.includes(9)) {
                this.cliCommonTypePetNatureList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '9'
                )
              }
              if (data.code_cli_common.includes(10)) {
                this.cliCommonTypeDiagnosisList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '10'
                )
              }
              if (data.code_cli_common.includes(11)) {
                this.cliCommonTypeCarteSourceList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '11'
                )
              }
              if (data.code_cli_common.includes(12)) {
                this.cliCommonQuestionnaireVisitList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '12'
                )
              }
              if (data.code_cli_common.includes(13)) {
                this.cliCommonTypeMedRouteList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '13'
                )
              }
              if (data.code_cli_common.includes(14)) {
                this.cliCommonTypeMemoCarteList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '14'
                )
              }
              if (data.code_cli_common.includes(15)) {
                this.cliCommonIVLS = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '15'
                )
              }
              if (data.code_cli_common.includes(16)) {
                this.cliCommonPrintPdf = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '16'
                )
                useItemStore().setItemServiceList(
                  response.data?.options?.item_service_list
                )
                useItemServiceUnitStore().setItemServiceUnitList(
                  response.data?.options?.item_service_unit_list
                )
              }
              if (data.code_cli_common.includes(18)) {
                this.cliCommonModalButton = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '18'
                )
              }
              if (data.code_cli_common.includes(19)) {
                this.cliCommonOuterLabRef = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '19'
                )
              }
              if (data.code_cli_common.includes(20)) {
                this.cliCommonTypeCategoryList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '20'
                )
              }
              if (data.code_cli_common.includes(21)) {
                this.cliCommonTackSeal = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '21'
                )
              }
              if (data.code_cli_common.includes(22)) {
                this.cliCommonAutoPriceCalculation = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '22'
                )
              }
              if (data.code_cli_common.includes(51)) {
                this.cliCommonTypeReviewFoodList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '51'
                )
              }
              if (data.code_cli_common.includes(52)) {
                this.cliCommonTypeReviewWaterList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '52'
                )
              }
              if (data.code_cli_common.includes(53)) {
                this.cliCommonTypeReviewFecesList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '53'
                )
              }
              if (data.code_cli_common.includes(54)) {
                this.cliCommonTypeReviewUrineList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '54'
                )
              }
              if (data.code_cli_common.includes(55)) {
                this.cliCommonTypeReviewVomitList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '55'
                )
              }
              if (data.code_cli_common.includes(56)) {
                this.cliCommonTypeReviewRespirationList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '56'
                )
              }
              if (data.code_cli_common.includes(57)) {
                this.cliCommonTypeReviewWellnessList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '57'
                )
              }
              if (data.code_cli_common.includes(58)) {
                this.cliCommonTypeReviewTemperatureList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '58'
                )
              }
              if (data.code_cli_common.includes(201)) {
                this.cliCommonMedConBcsList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '201'
                )
              }
              if (data.code_cli_common.includes(201)) {
                this.cliCommonMedConBcsWithNonActiveList = modifiedWithNonActiveData.filter(
                  (v: CliCommon) => v.code_cli_common === '201'
                )
              }
              if (data.code_cli_common.includes(202)) {
                this.cliCommonMedConHeartNoiseList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '202'
                )
              }
              if (data.code_cli_common.includes(203)) {
                this.cliCommonMedConLungNoiseList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '203'
                )
              }
              if (data.code_cli_common.includes(204)) {
                this.cliCommonMedConLymphNodeList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '204'
                )
              }
              if (data.code_cli_common.includes(205)) {
                this.cliCommonMedConCrtList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '205'
                )
              }
              if (data.code_cli_common.includes(206)) {
                this.cliCommonMedConMembraneList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '206'
                )
              }
              if (data.code_cli_common.includes(207)) {
                this.cliCommonMedConDehydrationList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '207'
                )
              }
              if (data.code_cli_common.includes(208)) {
                this.cliCommonMedConHeartBeatList = modifiedData.filter(
                  (v: CliCommon) => v.code_cli_common === '208'
                )
              }
            }
            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },
    fetchMedConditionCliCommonList(data: any = null) {
      const params = { minimum_id: 101 }
      if (data && data.code_cli_common)
        Object.assign(params, {
          code_cli_common: JSON.stringify(data.code_cli_common)
        })

      // Object.assign(params, { date_start: getDateToday() })
      // Object.assign(params, { date_end: getDateToday() })

      return new Promise((resolve, reject) => {
        api
          .get(`/mst/clinic_common`, { params })
          .then((response) => {
            const modifiedData = response.data.data.map((v: CliCommon) => {
              return {
                ...v,
                value: v.id_cli_common,
                label: v.name_cli_common
              }
            })
            this.allCliCommonMedConditionOptionList = modifiedData

            resolve(response)
          })
          .catch((error) => {
            reject(error)
          })
      })
    },

    async submitClinicCommon(data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'mst/clinic_common',
        data
      )
      if (res) {
        this.recentCliCommon = res
      }
    },

    async updateClinicCommon(id: number | string, data: object) {
      let res: any = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `mst/clinic_common/${id}`,
        data
      )
      if (res) {
        this.recentCliCommon = res
      }
    },

    destroyCliCommon(id_cli_common: any) {
      return mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `mst/clinic_common/${id_cli_common}`
      )
    }
  }
})

export default useCliCommonStore
