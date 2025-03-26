const routes = [
  {
    path: '/',
    redirect: '/auth/login'
  },
  {
    path: '/auth',
    component: () => import('@/components/layouts/UnauthorizedLayout.vue'),
    meta: {
      title: 'auth',
      guest: true
    },
    children: [
      {
        name: 'Login',
        path: 'login',
        component: () => import('@/pages/auth/LoginPage.vue')
      },
      {
        name: 'Register',
        path: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue')
      },
      {
        name: 'ForgotPassword',
        path: 'forgot-password',
        component: () => import('@/pages/auth/ForgotPasswordPage.vue')
      },
      {
        name: 'NewPassword',
        path: 'new-password',
        component: () => import('@/pages/auth/NewPasswordPage.vue')
      }
    ]
  },
  {
    path: '',
    component: () => import('@/components/layouts/MenuModal.vue'),
    children: [
      {
        name: 'Dashboard',
        path: '',
        component: () => import('@/pages/dashboard/MainDashboard.vue')
      },
      {
        name: 'downloadCenter',
        path: '/downloadCenter',
        component: () => import('@/pages/master/data/downloadCenter.vue')
      },
      {
        name: 'SearchCustomerList',
        path: '/SearchCustomerList',
        component: () =>
          import('@/pages/master/customerPet/SearchCustomerPetList.vue')
      },
      {
        name: 'SearchDmCustomerPetList',
        path: '/SearchDmCustomerPetList',
        component: () =>
          import('@/pages/master/customerPet/SearchDmCustomerPetList.vue')
      },
      {
        name: 'SearchCustomersList',
        path: '/SearchCustomersList',
        component: () =>
          // import('@/pages/master/customerPet/SearchCustomersList.vue')
          import('@/pages/master/customerPet/SearchCustomersList.vue')
      },
      {
        name: 'PetDetail',
        path: '/PetDetail/:id_customer/:id_pet',
        props: true,
        component: () =>
          import('@/pages/master/customerPet/detail/PetDetail.vue')
      },
      {
        name: 'SearchEmployeeList',
        path: '/SearchEmployeeList',
        component: () =>
          import('@/pages/master/employee/SearchEmployeeList.vue')
      },
      {
        name: 'SearchBreedDiseaseList',
        path: '/SearchBreedDiseaseList',
        component: () =>
          import('@/pages/master/breedDisease/SearchBreedDiseaseList.vue')
      },
      {
        name: 'SearchPaymentRequestList',
        path: '/SearchPaymentRequestList',
        component: () =>
          import('@/pages/paymentRequest/SearchPaymentRequestList.vue')
      },
      {
        name: 'SearchCategoryList',
        path: '/SearchCategoryList',
        component: () =>
          import('@/pages/master/category/SearchCategoryList.vue')
      },
      {
        name: 'SearchManualLabCategoryList',
        path: '/SearchManualLabCategoryList',
        component: () =>
          import('@/pages/master/category/manualLabCategory/SearchManualLabCategoryList.vue')
      },
      {
        name: 'SearchLabList',
        path: '/SearchLabList',
        component: () => import('@/pages/master/lab/SearchLabList.vue')
      },
      {
        name: 'SearchCommonList',
        path: '/SearchCommonList',
        component: () => import('@/pages/master/common/SearchCommonList.vue')
      },
      {
        name: 'SearchCliCommonList',
        path: '/SearchCliCommonList',
        component: () =>
          import('@/pages/master/cliCommon/SearchCliCommonList.vue')
      },
      {
        name: 'SearchTypeAnimalColorList',
        path: '/SearchTypeAnimalColorList',
        component: () =>
          import('@/pages/master/common/SearchTypeAnimalColorList.vue')
      },
      {
        name: 'SearchServiceDetailList',
        path: '/itemService/SearchServiceDetailList',
        component: () =>
          import('@/pages/request/serviceDetail/SearchServiceDetailList.vue')
      },
      {
        name: 'SearchItemServiceUnitList',
        path: '/SearchItemServiceUnitList',
        component: () =>
          import('@/pages/master/itemService/SearchItemServiceUnitList.vue')
      },
      {
        name: 'SearchTaskList',
        path: '/SearchTaskList',
        component: () => import('@/pages/task/SearchTaskList.vue')
      },
      {
        name: 'SearchTodoTaskList',
        path: '/SearchTodoTaskList',
        component: () => import('@/pages/task/SearchTodoTaskList.vue')
      },
      {
        name: 'SearchItemServiceList',
        path: '/SearchItemServiceList',
        component: () =>
          import('@/pages/master/itemService/SearchItemServiceList.vue')
      },
      {
        name: 'SearchPrescriptionList',
        path: '/SearchPrescriptionList',
        component: () =>
          import('@/pages/request/prescription/SearchPrescriptionList.vue')
      },
      {
        name: 'SearchInjectList',
        path: '/SearchInjectList',
        component: () => import('@/pages/request/inject/SearchInjectList.vue')
      },
      {
        name: 'Search',
        path: '/SearchInjectList',
        component: () => import('@/pages/request/inject/SearchInjectList.vue')
      },
      {
        name: 'SearchSalesReportList',
        path: '/SearchSalesReportList',
        component: () => import('@/pages/cart/salesReportVer1Modal.vue')
      },
      {
        name: 'SearchCartList',
        path: '/SearchCartList',
        component: () => import('@/pages/cart/SearchCartList.vue'),
        children: [
          {
            name: 'SearchCartListDetail',
            path: '/SearchCartList/detail'
          }
        ]
      },
      {
        name: 'SearchPrintList',
        path: '/SearchPrintList',
        component: () => import('@/pages/master/print/SearchPrintList.vue')
      },
      // {
      //   name: 'SearchUnitList',
      //   path: '/SearchUnitList',
      //   component: () => import('@/pages/master/unit/SearchUnitList.vue')
      // },
      {
        name: 'SearchClinicList',
        path: '/SearchClinicList',
        component: () => import('@/pages/master/clinic/SearchClinicList.vue')
      },
      {
        name: 'SearchCageList',
        path: '/SearchCageList',
        component: () => import('@/pages/master/cage/SearchCageList.vue')
      },
      {
        name: 'SearchCageConditionList',
        path: '/SearchCageConditionList',
        component: () =>
          import('@/pages/master/cageCondition/SearchCageConditionList.vue')
      },
      {
        name: 'SearchDosageFrequencyList',
        path: '/SearchDosageFrequencyList',
        component: () =>
          import('@/pages/master/dose/SearchDosageFrequencyList.vue')
      },
      {
        name: 'SearchPetInsuranceList',
        path: '/SearchPetInsuranceList',
        component: () =>
          import('@/pages/master/petInsurance/SearchPetInsuranceList.vue')
      },
      {
        name: 'SearchDiseaseList',
        path: '/SearchDiseaseList',
        component: () => import('@/pages/master/disease/SearchDiseaseList.vue')
      },
      {
        name: 'SearchDiseaseinsurerList',
        path: '/SearchDiseaseinsurerList',
        component: () =>
          import('@/pages/master/disease/SearchDiseaseInsuerList.vue')
      },
      {
        name: 'MessageClinic',
        path: '/MessageClinic',
        alias: '/message_threads',
        component: () => import('@/pages/message/MessageClinic.vue')
      },
      {
        name: 'MessageCustomer',
        path: '/MessageCustomer',
        alias: '/customer_message',
        component: () => import('@/pages/message/MessageCustomer.vue')
      },
      {
        name: 'SearchIllnessHistory',
        path: '/SearchIllnessHistory',
        component: () =>
          import('@/pages/petInfo/illnessHistory/SearchIllnessHistory.vue')
      },
      {
        name: 'SearchRequestList',
        path: '/SearchRequestList',
        component: () => import('@/pages/request/SearchRequestList.vue')
      },
      {
        name: 'OrderMaster',
        path: '/OrderMaster',
        component: () => import('@/pages/orderMaster/Index.vue')
      },
      {
        name: 'SearchBookingList',
        path: '/SearchBookingList',
        component: () => import('@/pages/booking/SearchBookingList.vue')
      },
      {
        name: 'SearchLabDataPrepList',
        path: '/SearchLabDataPrepList',
        component: () => import('@/pages/labDataPrep/SearchLabDataPrepList.vue')
      },
      {
        name: 'RequestDetail',
        path: '/SearchRequestList/:id',
        props: true,
        component: () => import('@/pages/request/detail/RequestDetail.vue'),
        children: [
          {
            name: 'RequestDetailPrescription',
            path: '/SearchRequestList/:id/prescription'
          },
          {
            name: 'RequestDetailServiceDetail',
            path: '/SearchRequestList/:id/serviceDetail'
          },
          {
            name: 'RequestDetailInject',
            path: '/SearchRequestList/:id/inject'
          }
        ]
      },
      {
        name: 'SearchManufacturerList',
        path: '/SearchManufacturerList',
        component: () =>
          import('@/pages/master/manufacturer/SearchManufacturerList.vue')
      },
      {
        name: 'SearchStatusList',
        path: '/SearchStatusList',
        component: () => import('@/pages/master/status/SearchStatusList.vue')
      },
      {
        name: 'SearchBioConditionList',
        path: '/SearchBioConditionList',
        component: () =>
          import('@/pages/petInfo/bioCondition/SearchBioConditionList.vue')
      },
      {
        name: 'SearchNextVisitList',
        path: '/SearchNextVisitList',
        component: () => import('@/pages/nextVisit/SearchNextVisitList.vue')
      },
      {
        name: 'SearchMemoCarteList',
        path: '/SearchMemoCarteList',
        component: () => import('@/pages/memoCarte/SearchMemoCarteList.vue')
      },
      {
        name: 'SearchIllnessHistoryList',
        path: '/SearchIllnessHistoryList',
        component: () => import('@/pages/illnessHistory/SearchIllnessHistoryList.vue')
      },
      {
        name: 'SearchBusinessHourSlotList',
        path: '/SearchBusinessHourSlotList',
        component: () =>
          import(
            '@/pages/master/businessHourSlot/SearchBusinessHourSlotList.vue'
          )
      },
      {
        name: 'SearchBusinessDayList',
        path: '/SearchBusinessDayList',
        component: () =>
          import('@/pages/master/businessDay/SearchBusinessDayList.vue')
      },
      {
        name: 'SearchSpecialBusinessDayList',
        path: '/SearchSpecialBusinessDayList',
        component: () =>
          import('@/pages/specialBusinessDay/SearchSpecialBusinessDayList.vue')
      },
      {
        name: 'SearchQueueTicketList',
        path: '/SearchQueueTicketList',
        component: () => import('@/pages/queueTicket/SearchQueueTicketList.vue')
      },
      {
        name: 'SearchStatusBoardList',
        path: '/SearchStatusBoardList',
        component: () => import('@/pages/statusBoard/SearchStatusBoardList.vue')
      },
      {
        name: 'SearchServiceGroupList',
        path: '/SearchServiceGroupList',
        component: () =>
          import('@/pages/template/serviceGroup/SearchServiceGroupList.vue')
      },
      {
        name: 'SearchTaskGroupList',
        path: '/SearchTaskGroupList',
        component: () =>
          import('@/pages/template/taskGroup/SearchTaskGroupList.vue')
      },
      {
        name: 'Calendar',
        path: '/Calendar',
        component: () =>
          import('@/pages/doctorAvailability/DoctorAvailabilityNew.vue')
      },
      {
        name: 'UpdateAllDoctorAvailability',
        path: '/UpdateAllDoctorAvailability',
        component: () =>
          import('@/pages/doctorAvailability/UpdateAllDoctorAvailability.vue')
      },
      {
        name: 'SearchCustodyCheckList',
        path: '/SearchCustodyChecklistList',
        component: () =>
          import('@/pages/custodyCheck/SearchCustodyCheckList.vue')
      },
      {
        name: 'SearchPaymentReceiptList',
        path: '/SearchPaymentReceiptList',
        component: () => import('@/pages/payment/SearchPaymentReceiptList.vue')
      },
      {
        name: 'SearchPaymentList',
        path: '/SearchPaymentList',
        component: () => import('@/pages/payment/SearchPaymentList.vue')
      },
      {
        name: 'SearchCartBalanceList',
        path: '/SearchCartBalanceList',
        component: () => import('@/pages/cartBalance/SearchCartBalance.vue')
      },
      {
        name: 'SearchTextTemplateList',
        path: '/SearchTextTemplateList',
        component: () =>
          import('@/pages/master/textTemplate/SearchTextTemplateList.vue')
      },
      {
        name: 'SearchShemeImageTemplateList',
        path: '/SearchShemeImageTemplateList',
        component: () =>
          import('@/pages/master/textTemplate/SearchShemeImageTemplateList.vue')
      },
      {
        name: 'SearchFoodPrepList',
        path: '/SearchFoodPrepList',
        component: () =>
          import('@/pages/master/foodPrep/SearchFoodPrepList.vue')
      },
      {
        name: 'SearchRoomList',
        path: '/SearchRoomList',
        component: () => import('@/pages/master/room/SearchRoomList.vue')
      },
      {
        name: 'SearchClinicPlanList',
        path: '/SearchClinicPlanList',
        component: () => import('@/pages/clinicPlan/SearchClinicPlanList.vue')
      },
      {
        name: 'SearchConversationList',
        path: '/SearchConversationList',
        component: () =>
          import('@/pages/conversation/KoekaruSearchConversationList.vue')
      },
      {
        name: 'SearchPrintList',
        path: '/SearchPrintList',
        component: () => import('@/pages/master/print/SearchPrintList.vue')
      },
      {
        name: 'SearchInfoList',
        path: '/SearchInfoList',
        component: () => import('@/pages/info/SearchInfoList.vue')
      },
      {
        name: 'SearchTaskPetCustodyList',
        path: '/SearchTaskPetCustodyList',
        component: () =>
          import('@/pages/petCustody/SearchTaskPetCustodyList.vue')
      },
      {
        name: 'SearchTaskPetCustodyLargeList',
        path: '/SearchTaskPetCustodyLargeList',
        component: () =>
          import('@/pages/petCustody/SearchTaskPetCustodyLargeList.vue')
      },
      {
        name: 'SearchTermList',
        path: '/SearchTermList',
        component: () => import('@/pages/term/SearchTermList.vue')
      },
      {
        name: 'SearchEmpInfoList',
        path: '/SearchEmpInfoList',
        component: () => import('@/pages/empInfo/SearchEmpInfoList.vue')
      },
      {
        name: 'SearchDepartmentTypeList',
        path: '/SearchDepartmentTypeList',
        component: () =>
          import(
            '@/pages/master/cliCommon/department/SearchDepartmentTypeList.vue'
          )
      },
      {
        name: 'SearchCustodyItemOptionList',
        path: '/SearchCustodyItemOptionList',
        component: () =>
          import(
            '@/pages/master/cliCommon/custody/SearchCustodyItemOptionList.vue'
          )
      },
      {
        name: 'SearchCustomerColorList',
        path: '/SearchCustomerColorList',
        component: () =>
          import(
            '@/pages/master/cliCommon/customerColor/SearchCustomerColorList.vue'
          )
      },
      {
        name: 'SearchQueueTicketPurposeList',
        path: '/SearchQueueTicketPurposeList',
        component: () =>
          import(
            '@/pages/master/cliCommon/queueTicket/SearchQueueTicketPurposeList.vue'
          )
      },
      {
        name: 'SearchDiagnosticInfoList',
        path: '/SearchDiagnosticInfoList',
        component: () =>
          import(
            '@/pages/master/cliCommon/diagnosticInfo/SearchDiagnosticInfoList.vue'
          )
      },
      {
        name: 'SearchPublicHealthList',
        path: '/SearchPublicHealthList',
        component: () =>
          import(
            '@/pages/master/cliCommon/publicHealth/SearchPublicHealthList.vue'
          )
      },
      {
        name: 'SearchPrintPdfList',
        path: '/SearchPrintPdfList',
        component: () =>
          import('@/pages/master/cliCommon/printPdf/SearchPrintPdfList.vue')
      },
      {
        name: 'SearchTackSealList',
        path: '/SearchTackSealList',
        component: () =>
          import('@/pages/master/cliCommon/tackSeal/SearchTackSealList.vue')
      },
      {
        name: 'SearchAutoPriceCalculationList',
        path: '/SearchAutoPriceCalculationList',
        component: () =>
          import(
            '@/pages/master/cliCommon/autoPriceCalculation/SearchAutoPriceCalculationList.vue'
          )
      },
      {
        name: 'SearchModalbuttonList',
        path: '/SearchModalbuttonList',
        component: () =>
          import(
            '@/pages/master/cliCommon/modalButton/SearchModalButtonList.vue'
          )
      },
      {
        name: 'SearchPaymentMethodList',
        path: '/SearchPaymentMethodList',
        component: () =>
          import(
            '@/pages/master/cliCommon/paymentMethod/SearchPaymentMethodList.vue'
          )
      },
      {
        name: 'SearchDiscountRateList',
        path: '/SearchDiscountRateList',
        component: () =>
          import(
            '@/pages/master/cliCommon/discountRate/SearchDiscountRateList.vue'
          )
      },
      {
        name: 'SearchPetHairList',
        path: '/SearchPetHairList',
        component: () =>
          import('@/pages/master/cliCommon/petHairColor/SearchPetHairList.vue')
      },
      {
        name: 'SearchPetAlertType',
        path: '/SearchPetAlertType',
        component: () =>
          import('@/pages/master/cliCommon/petAlertType/SearchPetAlertType.vue')
      },
      {
        name: 'SearchTypeServiceList',
        path: '/SearchTypeServiceList',
        component: () =>
          import('@/pages/master/common/SearchTypeServiceList.vue')
      },
      {
        name: 'SearchTypeCategory',
        path: '/SearchTypeCategory',
        component: () =>
          import('@/pages/master/cliCommon/typeCategory/SearchTypeCategory.vue')
      },
      {
        name: 'SearchIdexxTestList',
        path: '/SearchIdexxTestList',
        component: () =>
          import('@/pages/master/common/idexxTest/SearchIdexxTestList.vue')
      },
      {
        name: 'SearchLabDeviceList',
        path: '/SearchLabDeviceList',
        component: () =>
          import('@/pages/master/common/device/SearchLabDeviceList.vue')
      },
      {
        name: 'SearchMemoCarteSourceList',
        path: '/SearchMemoCarteSourceList',
        component: () =>
          import(
            '@/pages/master/cliCommon/carteSource/SearchMemoCarteSourceList.vue'
          )
      },
      {
        name: 'SearchTypeFirstRecognizedList',
        path: '/SearchTypeFirstRecognizedList',
        component: () =>
          import(
            '@/pages/master/firstRecognized/SearchTypeFirstRecognizedList.vue'
          )
      },
      {
        name: 'SearchReviewList',
        path: '/SearchReviewList',
        component: () => import('@/pages/master/review/SearchReviewList.vue')
      },
      {
        name: 'SearchMedConditionList',
        path: '/SearchMedConditionList',
        component: () =>
          import('@/pages/master/medCondition/SearchMedConditionList.vue')
      },
      {
        name: 'SearchMedRouteList',
        path: '/SearchMedRouteList',
        component: () =>
          import('@/pages/master/cliCommon/medRoute/SearchMedRouteList.vue')
      },
      {
        name: 'SearchMedEvaluationList',
        path: '/SearchMedEvaluationList',
        component: () =>
          import(
            '@/pages/master/cliCommon/medEvaluation/SearchMedEvaluationList.vue'
          )
      },
      {
        name: 'SearchIdexxIvlsList',
        path: '/SearchIdexxIvlsList',
        component: () =>
          import('@/pages/master/cliCommon/idexxIvls/SearchIdexxIvlsList.vue')
      },
      {
        name: 'SearchEmailCompaignList',
        path: '/SearchEmailCompaignList',
        component: () =>
          import('@/pages/master/emailCompaign/SearchEmailCompaignList.vue')
      },
      {
        name: 'SearchLabPrintList',
        path: '/SearchLabPrintList',
        component: () =>
          import('@/pages/master/labPrint/SearchLabPrintList.vue')
      },
      {
        name: 'SearchProjectWorkList',
        path: '/SearchProjectWorkList',
        component: () =>
          import('@/pages/master/project/SearchProjectWorkList.vue')
      }
    ]
  },
  {
    name: 'CheckIn',
    path: '/CheckIn',
    component: () => import('@/pages/queueTicket/CheckIn.vue')
  },
  {
    name: 'WaitingScreenPerDoctor',
    path: '/WaitingScreenPerDoctor',
    component: () => import('@/pages/queueTicket/WaitingScreenPerDoctor.vue')
  },
  {
    name: 'WaitingScreenPerDoctorMix',
    path: '/WaitingScreenPerDoctorMix',
    component: () => import('@/pages/queueTicket/WaitingScreenPerDoctorMix.vue')
  },
  {
    name: 'WaitingScreenPerPurposeMix',
    path: '/WaitingScreenPerPurposeMix',
    component: () =>
      import('@/pages/queueTicket/WaitingScreenPerPurposeMix.vue')
  },
  {
    name: 'CallScreen',
    path: '/CallScreen',
    component: () => import('@/pages/queueTicket/CallScreen.vue')
  },
  {
    name: 'ViewPdfPetCarteHtml',
    path: '/ViewPdfPetCarteHtml',
    component: () => import('@/pages/memoCarte/ViewPdfPetCarteHtml.vue')
  },
  {
    name: 'Logs',
    path: '/logs',
    component: () => import('@/components/ServerLogs.vue')
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes
