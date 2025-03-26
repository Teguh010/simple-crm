<script setup lang="ts">
// 0 = open
// 1 = close
// small menu label for menu closed state
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import selectOptions from '@/utils/selectOptions'
import { storeToRefs } from 'pinia'
import {
  aahTruncate,
  formatDate,
  getCurrentPetAge,
  getCustomerKanaName,
  getCustomerLabelColor,
  getCustomerNameWithCode,
  getDateByFormat,
  getDateToday,
  getFullPetNameWithoutHonorific,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import useActionStore from '@/stores/action'
import { useRoute, useRouter } from 'vue-router'
import useEmployeeStore from '@/stores/employees'
import usePetInsuranceStore from '@/stores/pet-insurances'
import useCommonStore from '@/stores/common'
import useRequestStore from '@/stores/requests'
import useMessageStore from '@/stores/message-clinic'
import useMemoCustomerStore, { TypeMemoCustomer } from '@/stores/memo-customer'
import useBookingStore, { fetchBookingByPetResponse } from '@/stores/bookings'
import useServiceDetailStore from '@/stores/service-details'
import useInjectStore from '@/stores/inject'
import { codeCliCommonList, typePetGender, typePreventionV1, typeTitlePetCustomerUpdated } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import {
  Common,
  IllnessHistoryType,
  MemoCustomerType,
  PetInsurance,
  PetType,
  RequestDetailPageType
} from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import PreventionPetDetail from './detail/PreventionPetDetail.vue'
import ViewPetDetailModal from './ViewPetDetailModal.vue'
import InjectHistoryPetDetail from '@/pages/master/customerPet/detail/InjectHistoryPetDetail.vue'
import dayjs from 'dayjs'
import ShampooExtraPetDetail from '@/pages/master/customerPet/detail/ShampooExtraPetDetail.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import { useMovableModalStore } from '@/stores/movable-modal'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtPetInfo from '@/components/MtPetInfo.vue'

const UpdAutoRequestModal = defineAsyncComponent(
  () => import('@/pages/request/UpdAutoRequestModal.vue')
)
const UpdateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMemoCarteModal.vue')
)
const UpdatePetBioInfoModal = defineAsyncComponent(
  () => import('@/pages/petInfo/bioInfo/UpdatePetBioInfoModal.vue')
)
const CreateRequestServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/request/CreateRequestServiceDetailModal.vue')
)
const UpdateRequestModal = defineAsyncComponent(
  () => import('@/pages/request/UpdateRequestModal.vue')
)
const UpdateCustomerModal = defineAsyncComponent(
  () => import('./UpdateCustomerModal.vue')
)
const MemoCartePetDetail = defineAsyncComponent(
  () => import('./detail/MemoCartePetDetail.vue')
)
const UpdateCustomerPetMemoModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/UpdateCustomerPetMemoModal.vue')
)
const UpdatePetModal = defineAsyncComponent(
  () => import('./UpdatePetModal.vue')
)
const TaskPetDetail = defineAsyncComponent(
  () => import('./detail/TaskPetDetail.vue')
)
const PetDiagonsticDetail = defineAsyncComponent(
  () => import('./detail/PetDiagonsticDetail.vue')
)
const ServiceDetailSurgeryPetDetail = defineAsyncComponent(
  () => import('./detail/ServiceDetailSurgeryPetDetail.vue')
)
const PrescriptionHistoryPetDetail = defineAsyncComponent(
  () => import('./detail/PrescriptionHistoryPetDetail.vue')
)
const IllnessHistoryPetDetail = defineAsyncComponent(
  () => import('./detail/IllnessHistoryPetDetail.vue')
)
const ServiceDetailPetDetail = defineAsyncComponent(
  () => import('./detail/ServiceDetailPetDetail.vue')
)
const FoodExtraPetDetail = defineAsyncComponent(
  () => import('./detail/FoodExtraPetDetail.vue')
)
const PetBioInfoPetDetail = defineAsyncComponent(
  () => import('./detail/PetBioInfoPetDetail.vue')
)
const LabResultPetDetail = defineAsyncComponent(
  () => import('@/components/lab/LabResultPetDetail.vue')
)
const PetBioConditionPetDetail = defineAsyncComponent(
  () => import('./detail/PetBioConditionPetDetail.vue')
)
const PetDetailHospitalization = defineAsyncComponent(
  () => import('./detail/PetDetailHospitalization.vue')
)

const SearchCartCustomerListModal = defineAsyncComponent(
  () => import('./detail/SearchCartCustomerListModal.vue')
)
const UpdateMessageThreadModal = defineAsyncComponent(
  () => import('@/pages/message/UpdateMessageThreadModal.vue')
)
const ViewVrHtmlModal = defineAsyncComponent(
  () => import('./ViewVrHtmlModal.vue')
)
const UpdateInfoListModal = defineAsyncComponent(
  () => import('@/pages/info/UpdateInfoListModal.vue')
)
const ViewMemoCustomerModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/ViewMemoCustomerModal.vue')
)
const ViewPrescriptionModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/ViewPrescriptionModal.vue')
)
const UpdateServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/request/serviceDetail/UpdateServiceDetailModal.vue')
)
const UpdInjectDetailModal = defineAsyncComponent(
  () => import('@/pages/request/inject/UpdInjectDetailModal.vue')
)

const UpdatePdfPetCarteSetting = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdatePdfPetCarteSetting.vue')
)

const props = defineProps<{
  id_customer: number
  id_pet: string
  code_customer?: number
  code_pet?: string
  id_request?: string
  additional?: { menu: string; type: string | null }
  id_pet_illness_history?: string
  fromPage?: string
  pageTitle?: string
  tab?: string
  requestDetailPage?: RequestDetailPageType
}>()

const localIdPet = ref<string | null>(props.id_pet)
const localCodePet = ref<string | null>(props.code_pet ?? null)

const emits = defineEmits(['close'])
const closeModal = () => {
  // event_bus.emit('searchMemoCarte')
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}

const MENU_NAMES = [
  'ペット基本',
  '予防',
  '現疾患・既往歴',
  '手術・麻酔',
  '治療・サービス',
  '処方箋',
  '注射・点滴',
  '入院',
  'タスク',
  'メモカルテ',
  '検査結果',
  '生体情報',
  '状態管理',
  '関連資料',
  'フード歴',
  '美容歴'
]
const commonStore = useCommonStore()
const employeeStore = useEmployeeStore()
const router = useRouter()
const route = useRoute()
const actionStore = useActionStore()
const customerStore = useCustomerStore()
const messageStore = useMessageStore()
const cliCommonStore = useCliCommonStore()
const illnessHistoryStore = useIllnessHistoryStore()
const requestStore = useRequestStore()
const memoCustomerStore = useMemoCustomerStore()
const serviceDetailStore = useServiceDetailStore()
const injectStore = useInjectStore()

const petInsuranceStore = usePetInsuranceStore()
const { getPetInsurances } = storeToRefs(petInsuranceStore)
const { getAllEmployees } = storeToRefs(employeeStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getCliCommonHairColorList, getCliCommonTypePetNatureList } =
  storeToRefs(cliCommonStore)
const { getInjectListByRequest } = storeToRefs(injectStore)

const menu = ref('ペット基本')
const customerSelected = ref()
const petSelected = ref()
const labResultRef = ref()
const petDiagonsticRef = ref()
const labIllnessHistoryRef = ref()
const serviceDetailPetRef = ref()
const prescriptionPetRef = ref()
const InjectPetRef = ref()
const taskByPetRef = ref()
const memoCarteRef = ref()
const petBioInfoRef = ref()
const petBioConditionRef = ref()
const foodExtraRef = ref()
const scrollAreaRef = ref()
const labIllnessHistoryList = ref<IllnessHistoryType[]>([])
const labIllnessHistorySelected = ref()
const labIllnessHistoryListDefault = ref([])

const petCustody = ref()
const typePetAlertNames = ref<any>([])
const typeAnimal = ref<Common | null>(null)
const isSidebarOpen = ref(true)
const defaultYearPeriod = ref('last90days')
const typePrevention = ref<number | null>(null)
const clinicData = JSON.parse(localStorage.getItem('clinic') || '{}')
let popupsList: Array<Record<string, any>> | null = null
const sidebarStateKey = 'viewPetDetailModalOpenCloseCondition'
const loading = ref(false)

const memoCustomerColumns = [
  { name: 'datetime_booking_confirmed', label: '次回予定日', field: 'datetime_booking_confirmed', align: 'center' },
  { name: 'type_prevention', label: '予防区分', field: 'type_prevention', align: 'center' },
  { name: 'name_booking_source', label: '商品名', field: 'name_booking_source', align: 'center' },
  { name: 'category_names', label: '分類', field: 'category_names', align: 'center' },
  { name: 'date_start', label: '前回実施日', field: 'date_start', align: 'center' },
]

const otherPets = computed(() =>
  petSelected.value
    ? customerStore.getCustomer.pets?.filter(
        (v) => v.id_pet !== petSelected.value?.id_pet
      ) || false
    : false
)

const todoLengthCheck = computed(() => {
  return memoCustomerStore.getMemoCustomers
    .filter(
      (memo: MemoCustomerType) =>
        memo.type_memo_customer === TypeMemoCustomer.TODO && memo.flg_complete === false
    ).length
})

const breedName = (value: number) =>
  commonStore.getCommonBreedOptionList.find((v) => v.id_common === value)
    ?.name_common
const typeGenderName = (value: number) =>
  typePetGender.find((v) => v.value === value)?.label

const changeMenu = (value: string) => {
  const tabIndex = MENU_NAMES.findIndex((menu) => menu === value)
  menu.value = value
  router.replace({
    path: route.path,
    query: {
      ...route.query,
      tab: tabIndex + 1
    }
  })
}
const openCreateRQModal = async () => {
  let data = {
    id_pet: localIdPet.value,
    id_customer: props.id_customer,
    date_request_start: getDateToday(),
    date_request_goal: getDateToday()
  }
  await mtUtils.mediumPopup(UpdateRequestModal, data)
}

const movableModalStore = useMovableModalStore()

const openCreateBookingRQModal = async () => {
  movableModalStore.setMovableModalData({
    id_customer: props.id_customer,
    id_pet: getPet.value.id_pet,
    code_customer: getCustomer.value?.code_customer,
    code_pet: getPet.value?.code_pet
  })

  const calendarUrl = router.resolve({
    name: 'Calendar',
    query: {
      view: 'per3days',
      code_customer: getCustomer.value?.code_customer,
      code_pet: getPet.value?.code_pet,
      createModal: 'true'
    }
  })
  window.open(calendarUrl.href, '_blank')
}
const openInfoModal = async () => {
  await mtUtils.mediumPopup(UpdateInfoListModal, {
    customerObj: getCustomer.value,
    petObj: getPet.value,
    fromViewPetModal: true,
    lineMessageType: 'p'
  })
}
const openSearchCartCustomerListModal = async () => {
  await mtUtils.popup(SearchCartCustomerListModal, {
    id_customer: props.id_customer
  })
}
const hairColorName = (value: number) => {
  return getCliCommonHairColorList.value.find((v) => v.id_cli_common == value)
    ?.name_cli_common
}

const getTypePetAlertNames = async () => {
  const petAlerts = getCliCommonTypePetNatureList.value.filter((common) => {
    return common.code_cli_common === codeCliCommonList[8].value.toString()
  })

  typePetAlertNames.value = []
  ;[...(getPet.value?.pet_alert ?? [])].forEach((v, index) => {
    if (v === '1') typePetAlertNames.value.push(petAlerts[index])
  })
}

const getTypeAnimal = (value: number): Common => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v) => v.id_common == value
  )
}

const memoCustomerPetModal = async () => {
  await mtUtils.mediumPopup(UpdateCustomerPetMemoModal, {
    id_pet: localIdPet.value
  })
}

const openMenu = async () => {
  let menuOptions = [
    { title: 'URLコピー', name: 'url_copy' },
    { title: '編集', name: 'edit' },
    { title: 'スレッド作成', name: 'create_thread' },
    { title: 'スレッド検索', name: 'search_thread' }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'edit') {
      await mtUtils.popup(UpdatePetModal, {
        callBackClose: () => {
          emits('close')
        }
      })

      loading.value = true
      await init()
      loading.value = false
    } else if (selectedOption.name == 'url_copy') {
      try {
        const relativeUrl = router.resolve({
          name: 'SearchCustomerList',
          query: {
            id: getCustomer.value?.id_customer,
            petId: getPet.value?.id_pet
          }
        }).href
        const baseUrl = window.location.origin
        const url = baseUrl + relativeUrl

        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました。')
      }
    } else if (selectedOption.name == 'create_thread') {
      await mtUtils.popup(UpdateMessageThreadModal, {
        id_customer: getCustomer.value?.id_customer,
        id_pet: getPet.value?.id_pet
      })
      const recentThread = messageStore.getRecentThreadMessage
      if (recentThread && Object.keys(recentThread).length > 0) {
        messageStore.setRecentMessageThread(null)
        const confirmation = await mtUtils.confirm(
          '院内スレッドを作成しました。スレッドを開きますか？',
          '確認',
          'スレッドを開く'
        )
        if (confirmation) {
          const route = router.resolve({ name: 'MessageClinic' })?.href
          window.open(route, '_blank')
        }
      }
    }
  }
}
const petInsurances = computed(() => {
  return getPetInsurances.value.map((v: PetInsurance) => {
    const start_date = formatDate(v.date_insurance_start)
    const end_date = formatDate(v.date_insurance_end)

    return {
      ...v,
      is_old:
        (start_date && start_date > getDateToday()) ||
        (end_date && end_date < getDateToday())
          ? true
          : false
    }
  })
})

const alertMissingData = computed(() => {
  const common = getTypeAnimal(parseInt(getPet.value.id_cm_animal))
  if (!getPet.value.id_cm_animal) {
    return '動物種が未設定です。データ不正で正しく機能しない為登録してください。'
  }
  if (!getPet.value.id_cm_breed) {
    return '動物品種が未設定です。'
  }
  if (
    !getPet.value.id_cm_hair &&
    ['2', '11', '12', '13'].includes(common?.code_func1)
  ) {
    return '毛色が未設定です。'
  }
  return ''
})

const openCustomerDetail = async () => {
  try {
    await customerStore.selectCustomer(props?.id_customer)
    const data = getCustomer.value
    await mtUtils.popup(UpdateCustomerModal, { data })
    await init()
  } catch (error) {
    console.error(error)
  }
}

const openCreateMemoCarte = async () => {
  if (!localIdPet.value) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  useMemoCarteStore().selectMemoCarte(null)
  await mtUtils.popup(UpdateMemoCarteModal, {
    id_request: props.id_request,
    id_customer: props.id_customer.toString(),
    id_pet: localIdPet.value.toString(),
    id_pet_illness_history:
      illnessHistoryStore.getIllnessHistory?.id_pet_illness_history
  }, true)
}

const createPetBioInfoModal = async () => {
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {
    id_customer: props.id_customer,
    id_pet: localIdPet.value,
    from_request_page: true
  })
}
const openAutoRequestModal = async () => {
  await mtUtils.popup(UpdAutoRequestModal, {
    id_customer: props.id_customer,
    id_pet: localIdPet.value
  })
}
const getEmployeeName = (idEmployee: any) =>
  getAllEmployees.value.find((employee) => employee.value === idEmployee)?.label
// const getInsurance = (value: number) => {
//   insuranceStore.getInsurances.find((v) => v.id_insurance_plan === value)
// }

const apiCalled = ref(false)

const openLabResultMultiModal = () => {
  if (labResultRef.value) {
    labResultRef.value.openLabResultMultiModal()
  }
}
const togglePdfConfirmation = () => {
  if (labResultRef.value) {
    labResultRef.value.togglePdfConfirmation()
  }
}

const handleScrollToItem = (val) => {
  // TODO
  const scrollAreaEl = scrollAreaRef.value.$refs.target
  const element = document.getElementById(val)
  if (element && scrollAreaEl) {
    const elementPosition = element.offsetTop
    scrollAreaEl.scrollTop = elementPosition + 50
  }
}
const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true

    if (menu.value == '検査結果') {
      await labResultRef.value.fetchMoreData1()
    }

    if (menu.value == '関連資料') {
      await petDiagonsticRef.value.fetchMoreData()
    }

    if (menu.value == '現疾患・既往歴') {
      await labIllnessHistoryRef.value.fetchMoreData()
    }

    if (menu.value == '治療・サービス') {
      await serviceDetailPetRef.value.fetchMoreData()
    }
    if (menu.value == '処方箋') {
      // await prescriptionPetRef.value.fetchMoreData(false)
    }

    if (menu.value == 'タスク') {
      await taskByPetRef.value.fetchMoreData()
    }
    if (menu.value == 'メモカルテ') {
      await memoCarteRef.value.fetchMoreData()
    }
    if (menu.value == '生体情報') {
      await petBioInfoRef.value.fetchMoreData()
    }
    if (menu.value == '状態管理') {
      await petBioConditionRef.value.fetchMoreData()
    }
    apiCalled.value = false
  }
}
const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  localStorage.setItem(sidebarStateKey, isSidebarOpen.value ? '0' : '1')
}
const openRequestDetailPage = () => {
  router.push({
    name: 'SearchRequestList',
    query: { id_customer: props.id_customer, id_pet: localIdPet.value }
  })
  mtUtils.closePopup(popupsList)
}
const openLatestRequestDetailPage = async () => {
  if (localIdPet.value !== null) {
    await requestStore.fetchRequestByPet(localIdPet.value)
    const url = router.resolve({
      name: 'RequestDetail',
      params: { id: requestStore.getLatestRequestByPet.id_request || '' }
    })
    window.open(url.fullPath, '_self')
    mtUtils.closePopup(popupsList)
  } else {
    console.error('localIdPet is null, cannot open request detail page.')
  }
}

const typeTitlePetCustomerUpdatedName = (value: any) =>
  typeTitlePetCustomerUpdated.find((item) => item.value === value)

// Booking by pet pagination module
const bookingStore = useBookingStore()
const {
  getAllBookingsByPet,
  pagination,
  getPageCount
} = storeToRefs(bookingStore)
const getBookingsByPet = (currentPage: number) => {
  return bookingStore.fetchBookingsByPet({
    id_customer: props.id_customer,
    id_pet: localIdPet.value,
    page: currentPage,
    page_size: pagination.value.pageSize
  })
}
const onUpdatePetBookingPage = (page: number) => {
  getBookingsByPet(page)
}

const init = async () => {
  const urlCodePet = route.query.code_pet

  if (props.code_pet) {
    localCodePet.value = props.code_pet
  } else if (urlCodePet) {
    localCodePet.value = urlCodePet.toString()
  }

  let conditionalPromises = []
  if(memoCustomerStore.getMemoCustomers.length === 0) {
    conditionalPromises.push(
      memoCustomerStore.fetchMemoCustomers({
        id_customer: props.id_customer
      })
    )
  }

  const response = await mtUtils.promiseAllWithLoader([
    petInsuranceStore.fetchPetInsurances({
      id_pet: localIdPet.value
    }),
    customerStore.selectCustomer(props.id_customer, true),
    commonStore.fetchPreparationCommonList({ code_common: [2, 3, 10] }),
    illnessHistoryStore.fetchIllnessHistorys({
      id_pet: localIdPet.value,
      id_customer: props.id_customer
    }),
    mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchPetCustodyList', {
      id_pet: localIdPet.value,
      date: getDateToday()
    }),
    getBookingsByPet(pagination.value.currentPage),
    ...conditionalPromises
  ])

  if (!response) {
    console.error('Error loading data.')
    return
  }

  const illnessHistories = await illnessHistoryStore.getIllnessHistorys
  if (illnessHistories) {
    labIllnessHistoryList.value = illnessHistories
    labIllnessHistoryListDefault.value = illnessHistories.map((history) => ({
      label: history.name_disease || history.name_disease_free,
      value: history.id_pet_illness_history
    }))
  }

  const [pC] = response

  await cliCommonStore.fetchPreparationCliCommonList(
    {
      code_cli_common: [
        codeCliCommonList[7].value,
        codeCliCommonList[8].value,
        codeCliCommonList[10].value
      ]
    },
    true
  )

  customerSelected.value = getCustomer.value

  if (localCodePet.value && customerSelected.value) {
    const matchedPet = customerSelected.value.pets?.find(
      (pet: PetType) => pet.code_pet === localCodePet.value?.toString()
    )

    if (matchedPet) {
      localIdPet.value = matchedPet.id_pet
    } else {
      console.warn(`Pet with code_pet ${localCodePet.value} not found`)
    }
  }

  customerStore.selectPet(localIdPet.value!)
  petSelected.value = getPet.value

  getTypePetAlertNames()
  typeAnimal.value = await getTypeAnimal(Number(getPet.value?.id_cm_animal))
  if (pC && Array.isArray(pC) && pC.length > 0) {
    petCustody.value = pC[0]
  }
}

const checkPetCustodyAvailable = () => {
  const link = router.resolve({
    name: 'SearchTaskPetCustodyList',
    query: {
      id: petCustody.value.id_pet_custody
    }
  })
  window.open(link.href, '_blank')
}

const openHtmlSite = () => {
  let buttons: any = []

  buttons.push({
    label: `${getPet.value.code_pet_ex ? getPet.value.code_pet_ex : ''} ${
      getPet.value.name_pet
    } 詳細情報`,
    code_customer_ex: getCustomer.value.code_customer_ex,
    code_pet_ex: getPet.value.code_pet_ex,
    flgPetDetailBtn: true
  })

  buttons.push({
    label: `${getPet.value.code_pet_ex ? getPet.value.code_pet_ex : ''} ${
      getPet.value.name_pet
    } カルテ情報`,
    code_customer_ex: getCustomer.value.code_customer_ex,
    code_pet_ex: getPet.value.code_pet_ex,
    flgPetMemoCarteBtn: true
  })

  mtUtils.littlePopup(ViewVrHtmlModal, { buttons })
}

const openUpdatePetModal = async () => {
  await mtUtils.popup(UpdatePetModal, {
    callBackClose: () => {
      emits('close')
    }
  })

  await init()
}

const openPetInsurance = async () => {
  await mtUtils.popup(UpdatePetModal, {
    openInsuranceTab: true
  })
}

const openOtherPetModal = async (pet: PetType) => {
  await mtUtils.closePopup(popupsList)

  await router.replace({
    path: route.path,
    query: {
      code_customer: getCustomer.value?.code_customer,
      code_pet: pet?.code_pet,
      tab: 1
    }
  })

  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: pet?.id_customer,
    id_pet: pet?.id_pet,
    code_pet: pet?.code_pet,
    code_customer: getCustomer.value?.code_customer,
    tab: 1
  })
}

const memoCustomerModal = async () => {
  await mtUtils.popup(ViewMemoCustomerModal, {
    id_customer: props?.id_customer
  })
}

const getBookingSourceData = (row: fetchBookingByPetResponse) => {
  let data = {}
  if(row.prescription_detail) {
    data.name = row.prescription_detail.name_prescription_display
    data.name_category = `${row.prescription_detail.name_category1} / ${row.prescription_detail.name_category2}`
    data.date_start = row.prescription_detail.date_start
  }
  else if(row.inject_detail) {
    data.name = row.inject_detail.name_inject_display
    data.name_category = `${row.inject_detail.name_category1} / ${row.inject_detail.name_category2}`
    data.date_start = row.inject_detail.date_start
  }
  else if(row.service_detail) {
    data.name = row.service_detail.name_item_service
    data.name_category = `${row.service_detail.name_category1} / ${row.service_detail.name_category2}`
    data.date_start = row.service_detail.date_service_start
  }

  return data
}

const openBookingSourceModal = async (row: fetchBookingByPetResponse) => {
  if(row.prescription_detail) {
    await mtUtils.mediumPopup(ViewPrescriptionModal, {
      id_pet: row.id_pet,
      requestDetailPage: {...row }
    }, true)
  }

  else if(row.service_detail) {
    serviceDetailStore.fetchServiceDetailById(row.service_detail.id_service_detail)
    await mtUtils.mediumPopup(UpdateServiceDetailModal)
  }

  else if(row.inject_detail) {
    let injectHeader, injectDetail
    const response: any = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      'SearchInjectList',
      {id_inject: row.inject_detail.id_inject},
      true
    )
    if(response.data && response.data.length > 0) {
      injectHeader = response.data[0]
      if(injectHeader) injectDetail = injectHeader.inject_detail_list.find((injectDetail) => injectDetail.id_inject_detail === row.inject_detail.id_inject_detail)
      if(!injectHeader || !injectDetail) {
        throw new Error('Unable to find inject detail or inject header')
      }
    }
    await mtUtils.mediumPopup(UpdInjectDetailModal, {
      injectObj: injectHeader,
      injectDetail: injectDetail
    })
  }
}

const openPetCartePdfSettingsModal = async () => {
  await mtUtils.popup(UpdatePdfPetCarteSetting, {})
}

// const initializeDataFromQuery = async () => {
//   const urlCodePet = route.query.code_pet
//   if (urlCodePet) {
//     localCodePet.value = urlCodePet

//     await init()

//     const matchedPet = customerSelected.value?.pets?.find(
//       (pet: PetType) => pet.code_pet === localCodePet.value?.toString()
//     )

//     if (matchedPet) {
//       localIdPet.value = matchedPet.id_pet
//     } else {
//       console.warn(`Pet with code_pet ${localCodePet.value} not found.`)
//     }
//   }
// }

// const updateDataFromQuery = () => {
//   const { code_customer, code_pet, tab } = route.query
//   if (code_customer && code_pet) {
//     customerSelected.value = Number(code_customer)
//     petSelected.value = String(code_pet)
//   }
//   if (tab) {
//     const tabIndex = Number(tab) - 1
//     menu.value = MENU_NAMES[tabIndex] || MENU_NAMES[0]
//   }
// }

// watch(
//   () => route.query,
//   () => {
//     updateDataFromQuery()
//   },
//   { immediate: true }
// )

onMounted(async () => {
  const savedState = localStorage.getItem(sidebarStateKey)
  if (savedState !== null) {
    isSidebarOpen.value = savedState === '0'
  }

  loading.value = true

  await init()

  // if (props.tab) {
  //   menu.value = MENU_NAMES[parseInt(props.tab) - 1]
  // } else {

  router.replace({
    path: route.path,
    query: {
      code_customer: props.code_customer,
      code_pet: localCodePet.value,
      tab: 1
    }
  })
  // }

  popupsList = Array.from(document.getElementsByClassName('ns-popup'))
  loading.value = false

  if (props.additional) {
    defaultYearPeriod.value = 'all'
    if (props.additional.menu === 'illness_history')
      changeMenu('治療・サービス')
    if (props.additional.menu === 'pet_diagnostic') changeMenu('関連資料')
    if (props.additional.menu === 'prescription_history') changeMenu('処方箋')
    if (props.additional.menu === 'lab_result') changeMenu('検査結果')
    if (props.additional.menu === 'preventative') {
      changeMenu('予防')
      if (props.additional?.type) {
        const typeAsNumber = Number(props.additional.type)
        if (!isNaN(typeAsNumber)) {
          typePrevention.value = typeAsNumber - 1
        }
      }
    }
  }

  if (props.pageTitle) {
    setPageTitle(props.pageTitle)
  }
})

onUnmounted(() => {
  router.replace({ path: route.path, query: {} })
})

const handleLabIllnessHistoryFilterChange = () => {
  if (labResultRef.value) {
    labResultRef.value.handleFilterChange({
      illness_history: labIllnessHistorySelected.value
    })
  }
}
</script>

<template>
  <q-form>
    <MtModalHeader class="full-width mt-header" @closeModal="closeModal">
      <q-toolbar-title>
        <MtPetInfo class="ellipsis full-width" />
      </q-toolbar-title>
      <template v-if="menu == '検査結果'">
        <div class="select-lab-result q-mr-sm">
          <MtFilterSelect
            v-model:options="labIllnessHistoryList"
            v-model:selecting="labIllnessHistorySelected"
            ref="labIllnessHistoryRef"
            label="現疾患・既往歴"
            :options-default="labIllnessHistoryListDefault"
            :options-label="(v: IllnessHistoryType) => v.name_disease ? v.name_disease : v.name_disease_free"
            @onEnterPress="handleLabIllnessHistoryFilterChange"
            @update:selecting="handleLabIllnessHistoryFilterChange"
          />
        </div>
        <q-btn
          outline
          label="結果結果：比較"
          class="q-mr-sm"
          @click="openLabResultMultiModal()"
        />
        <q-btn
          outline
          label="検査結果：1回"
          class="q-mr-sm"
          @click="togglePdfConfirmation()"
        />
      </template>
      <div>
        <q-btn
          @click="openRequestDetailPage"
          label="リクエスト検索"
          class="bg-grey-300 q-mr-sm"
          unelevated
        />
        <!-- <q-btn class="q-mr-xs" unelevated round @click="openCreateRQModal">
          <q-icon size="15px" name="library_add" />
        </q-btn>
        <q-btn class="q-mr-xs" unelevated round @click="openCreateBookingRQModal">
          <q-icon size="15px" name="edit_calendar" /> 
        </q-btn> -->
        <q-btn
          v-if="clinicData.clinic?.url_vr_html?.substr(0, 5) === 'https'"
          class="text-grey-800 q-mr-sm"
          icon="stars"
          round
          size="12px"
          unelevated
          @click="openHtmlSite"
        />
        <q-btn unelevated round @click="openUpdatePetModal">
          <q-icon size="15px" name="edit" />
        </q-btn>
        <q-btn unelevated round @click="openMenu" class="q-mx-sm">
          <q-icon size="15px" name="more_horiz" />
        </q-btn>
      </div>
    </MtModalHeader>
    <q-card-section class="view-pet-modal-content content hide-scrollbar pet-modal" style="padding: 0px;">
      <div class="row full-height">
        <div v-if="isSidebarOpen" class="col-auto">
          <q-scroll-area
            style="max-width: 100%"
            class="separate-scrollbar ah-menu-expanded full-height"
          >
            <div
              class="absolute full-height"
              style="
                right: 8px;
                top: 0;
                bottom: 0;
                width: 1px;
                background-color: rgba(0, 0, 0, 0.12);
              "
            ></div>
            <div class="title1 text-grey-800 q-pr-sm">
              <q-list separator>
                <q-item
                  @click="toggleSidebar"
                  clickable
                  v-ripple
                  class="flex items-center justify-end"
                >
                  <q-icon name="chevron_left" />
                </q-item>
                <q-item
                  @click="changeMenu('ペット基本')"
                  :active="menu === 'ペット基本'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>ペット基本</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('予防')"
                  :active="menu === '予防'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>予防</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('現疾患・既往歴')"
                  :active="menu === '現疾患・既往歴'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>現疾患・既往歴</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('手術・麻酔')"
                  :active="menu === '手術・麻酔'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>手術・麻酔</q-item-section>
                </q-item>
                <q-item
                  v-ripple
                  :active="menu === '入院'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  @click="changeMenu('入院')"
                >
                  <q-item-section>入院</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('治療・サービス')"
                  :active="menu === '治療・サービス'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>治療・サービス</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('処方箋')"
                  :active="menu === '処方箋'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>処方箋</q-item-section>
                </q-item>
                <q-item
                  v-ripple
                  :active="menu === '注射・点滴'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  @click="changeMenu('注射・点滴')"
                >
                  <q-item-section>注射・点滴</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('タスク')"
                  :active="menu === 'タスク'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>タスク</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('メモカルテ')"
                  :active="menu === 'メモカルテ'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>メモカルテ</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('検査結果')"
                  :active="menu === '検査結果'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>検査結果</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('生体情報')"
                  :active="menu === '生体情報'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>生体情報</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('状態管理')"
                  :active="menu === '状態管理'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>状態管理</q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('関連資料')"
                  :active="menu === '関連資料'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>関連資料</q-item-section>
                </q-item>
                <q-item
                  :active="menu === 'フード歴'"
                  @click="changeMenu('フード歴')"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>フード歴</q-item-section>
                </q-item>
                <q-item
                  v-ripple
                  :active="menu === '美容歴'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  @click="changeMenu('美容歴')"
                >
                  <q-item-section>美容歴</q-item-section>
                </q-item>
                <!-- TODO Pending until we finalize the requirement and api 
                  <q-item
                  @click="changeMenu('共有写真')"
                  :active="menu === '共有写真'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>共有写真</q-item-section>
                </q-item>-->
                <q-item
                  @click="openSearchCartCustomerListModal"
                  active-class="bg-grey-700 text-white"
                  clickable
                  v-ripple
                >
                  <q-item-section>会計</q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-scroll-area>
        </div>
        <div class="short-sidebar-container" v-else>
          <q-btn class="ah-menu-collapsed-btn" flat square unelevated :ripple="false" @click="toggleSidebar">
            <q-icon name="chevron_right" />
          </q-btn>
          <q-scroll-area
            style="max-width: 100%"
            class="separate-scrollbar ah-menu-collapsed full-height"
          >
            <div
              class="absolute full-height"
              style="
                right: 8px;
                top: 0;
                bottom: 0;
                width: 1px;
                background-color: rgba(0, 0, 0, 0.12);
              "
            ></div>
            <div class="title1 text-grey-800">
              <q-list separator>
                <q-item
                  @click="changeMenu('ペット基本')"
                  :active="menu === 'ペット基本'"
                  active-class="bg-grey-700 text-white" 
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label items-center"
                    ><q-icon name="pets" class="text-center"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('予防')"
                  :active="menu === '予防'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    >予</q-item-section
                  >
                </q-item>
                <q-item
                  @click="changeMenu('現疾患・既往歴')"
                  :active="menu === '現疾患・既往歴'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    >歴</q-item-section
                  >
                </q-item>
                <q-item
                  @click="changeMenu('手術・麻酔')"
                  :active="menu === '手術・麻酔'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    >OP</q-item-section
                  >
                </q-item>
                <q-item
                  v-ripple
                  :active="menu === '入院'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  @click="changeMenu('入院')"
                >
                  <q-item-section class="short-sidebar-label"
                    >入</q-item-section
                  >
                </q-item>
                <q-item
                  @click="changeMenu('治療・サービス')"
                  :active="menu === '治療・サービス'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    >治</q-item-section
                  >
                </q-item>
                <q-item
                  @click="changeMenu('処方箋')"
                  :active="menu === '処方箋'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    >薬</q-item-section
                  >
                </q-item>
                <q-item
                  v-ripple
                  :active="menu === '注射・点滴'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  @click="changeMenu('注射・点滴')"
                >
                  <q-item-section class="short-sidebar-label"
                    >注</q-item-section
                  >
                </q-item>
                <q-item
                  @click="changeMenu('タスク')"
                  :active="menu === 'タスク'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="task_alt"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('メモカルテ')"
                  :active="menu === 'メモカルテ'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="edit"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('検査結果')"
                  :active="menu === '検査結果'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="folder_open"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('生体情報')"
                  :active="menu === '生体情報'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="scale"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('状態管理')"
                  :active="menu === '状態管理'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="linear_scale"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="changeMenu('関連資料')"
                  :active="menu === '関連資料'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="folder_open"
                  /></q-item-section>
                </q-item>
                <q-item
                  :active="menu === 'フード歴'"
                  @click="changeMenu('フード歴')"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="rice_bowl"
                  /></q-item-section>
                </q-item>
                <q-item
                  v-ripple
                  :active="menu === '美容歴'"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  @click="changeMenu('美容歴')"
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="content_cut"
                  /></q-item-section>
                </q-item>
                <q-item
                  @click="openSearchCartCustomerListModal"
                  active-class="bg-grey-700 text-white"
                  clickable
                  class="q-pa-none"
                  v-ripple
                >
                  <q-item-section class="short-sidebar-label"
                    ><q-icon name="shopping_cart"
                  /></q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-scroll-area>
        </div>
        <template v-if="!loading">
          <div class="col">
            <div v-if="getCustomer && getPet">
              <div v-if="menu === 'ペット基本'">
                <q-scroll-area
                  class="view-pet-modal-content-inner separate-scrollbar"
                  style="width: 100%; max-width: 100%"
                  @scroll="handleScroll"
                  ref="scrollAreaRef"
                >
                  <q-toolbar class="justify-between no-wrap">
                    <div
                      class="flex q-col-gutter-md items-center caption2 regular text-grey-700 q-py-xs"
                    >
                      <div class="col-auto">
                        <span class="caption1 regular text-grey-500 q-mb-xs">
                          {{ getCustomer?.name_kana_family + ' ' }}
                          {{ getPet?.name_kana_pet }}
                        </span>
                        <div class="title2 bold text-black">
                          {{
                            getFullPetNameWithoutHonorific(getPet, getCustomer)
                          }}
                          <span class="q-ml-xs caption2 regular">
                            {{
                              typeTitlePetCustomerUpdatedName(
                                getPet?.type_title_pet_customer_updated
                              )?.label
                            }}
                          </span>
                        </div>
                      </div>
                      <div class="col-auto">
                        <span class="caption1 regular text-grey-500 q-mt-xs"
                          >性別</span
                        >
                        <div class="title2 bold">
                          {{ typeGenderName(getPet?.type_pet_gender) }}
                        </div>
                      </div>
                      <div class="col-auto">
                        <span class="caption1 regular text-grey-500 q-mt-xs"
                          >品種名</span
                        >
                        <div class="title2 bold">
                          {{ breedName(getPet?.id_cm_breed) }}
                        </div>
                      </div>
                      <div
                        v-if="
                          getPet?.date_birth &&
                          !getPet?.flg_pet_excluded &&
                          !getPet?.flg_deceased
                        "
                        class="caption2 regular text-grey-700"
                      >
                        <span class="caption1 regular text-grey-500 q-mt-xs"
                          >生年月日</span
                        >
                        <div class="title2 bold">
                          {{ formatDate(getPet?.date_birth) }}
                          <span class="q-ml-md">
                            ( 年齢： {{ getCurrentPetAge(getPet) }} )
                          </span>
                        </div>
                      </div>
                      <div>
                        <q-btn
                          v-if="getPet && getPet.flg_existence"
                          class="body2 regular border-btn q-ml-sm"
                          color="accent-800"
                          padding="7px 12px"
                          text-color="grey-500"
                          unelevated
                        >
                          平均寿命以上
                        </q-btn>
                      </div>
                      <div>
                        <q-btn
                          class="bg-grey-300 btn-memo"
                          unelevated
                          @click="memoCustomerPetModal"
                        >
                          <div
                            class="text-left"
                            v-html="
                              aahTruncate(
                                customerStore?.getPet?.memo_pet || 'メモ入力',
                                30
                              )
                            "
                          ></div>
                        </q-btn>
                      </div>
                    </div>
                  </q-toolbar>
                  <q-separator />
                  <!-- Display this alert missing data if the animal doesn't have id_cm_animal, id_cm_breed, id_cm_hair -->
                  <q-banner
                    v-if="alertMissingData"
                    class="text-white bg-red-8 q-mt-md cursor-pointer"
                    @click="openUpdatePetModal"
                  >
                    {{ alertMissingData }}
                  </q-banner>
                  <!--Display this below section only when we have ACTIVE pet custody record-->
                  <div
                    v-if="petCustody"
                    class="round-section-free-bg bg-accent-300 q-pa-md q-mt-lg flex justify-between"
                  >
                    <div>
                      <div class="title2 bold text-black q-mb-md">
                        預かり管理中
                      </div>
                      <div>
                        <span class="caption1 q-mr-md">期間</span>
                        <span>
                          {{
                            dayjs(petCustody.datetime_start).format(
                              'YYYY/MM/DD HH:mm'
                            )
                          }}
                        </span>
                        ～
                        <span>
                          {{
                            petCustody.datetime_goal
                              ? dayjs(petCustody.datetime_goal).format(
                                  'YYYY/MM/DD HH:mm'
                                )
                              : ''
                          }}</span
                        >
                      </div>
                    </div>
                    <div class="flex items-center">
                      <q-btn
                        dense
                        flat
                        padding="4px 10px"
                        unelevated
                        @click="checkPetCustodyAvailable"
                        >預り・入院管理
                      </q-btn>
                    </div>
                  </div>
                  <div class="row q-col-gutter-lg q-my-md">
                    <div class="col-md-auto col-sm-12 q-mr-sm">
                      <q-img
                        v-if="getPet"
                        :src="getPetImageUrl(getPet)"
                        :style="
                          getPet?.image_path1 || getPet?.image_path2
                            ? 'width: 220px; height: 220px;'
                            : 'width: 90px; height: 90px;'
                        "
                        class="q-mb-sm roundedImage image-responsive"
                        @error="handleImageError($event, getPet)"
                      />
                      <div v-else class="default bg-grey-300" />
                      <div class="body2 regular text-grey-700 q-mb-sm">
                        <template v-if="getPet">
                          <small class="text-grey-500"
                            >オーナーペット名：</small
                          >
                          {{ getPet?.name_pet }}
                        </template>
                        <template v-else>
                          <q-skeleton height="100px" type="text" />
                        </template>
                      </div>
                      <div class="body2 regular text-grey-700 q-mb-sm">
                        <small class="text-grey-500">初診日：</small>
                        <span>{{ getPet?.date_register || '-' }}</span>
                      </div>
                      <div class="body2 regular text-grey-700 q-mb-sm">
                        <small class="text-grey-500">最終来院：</small>
                        <span>{{ getPet?.date_last_visit || '-' }}</span>
                      </div>
                      <!--TODO<q-btn
                        unelevated
                        outline
                        padding="4px 10px"
                        label="疾患相関"
                        class="body2 q-mt-md text-grey-700"
                      />-->
                    </div>
                    <div class="col-md-auto col-sm-12">
                      <div class="row q-col-gutter-md q-mb-sm">
                        <div>
                          <span class="caption2 regular text-grey-500"
                            >ペットCD</span
                          >
                          <p class="text-grey-700">
                            {{ getPet?.code_pet }}
                          </p>
                        </div>
                        <div class="q-ml-lg">
                          <span class="caption2 regular text-grey-500"
                            >動物種別</span
                          >
                          <p class="text-grey-700">
                            {{ typeAnimal?.name_common }}

                            <q-icon
                              v-if="
                                typeAnimal?.text1 && typeAnimal?.text1 != ''
                              "
                              :color="typeAnimal?.text1 || ''"
                              class="q-ml-xs"
                              name="circle"
                              size="20px"
                              :style="{ color: typeAnimal?.text1 }"
                            />
                          </p>
                        </div>
                        <div class="q-ml-lg">
                          <span class="caption2 regular text-grey-500"
                            >毛色</span
                          >
                          <p class="text-grey-700">
                            {{ hairColorName(getPet?.id_cm_hair) }}
                          </p>
                        </div>
                      </div>
                      <div
                        v-if="getPet?.id_employee_main_doctor"
                        class="q-mb-md"
                      >
                        <span class="field-label1">担当医</span>
                        <span>{{
                          getEmployeeName(getPet?.id_employee_main_doctor)
                        }}</span>
                      </div>
                      <div v-if="getPet?.id_employee_main" class="q-mb-md">
                        <span class="field-label1">担当VT</span>
                        <span>{{
                          getEmployeeName(getPet?.id_employee_main)
                        }}</span>
                      </div>
                      <div v-if="getPet?.pet_alert" class="q-mb-md">
                        <span class="field-label1">性格</span>
                        <template v-for="(common, index) in typePetAlertNames">
                          <!-- <span> {{ common?.name_cli_common || '' }} </span> -->
                          <q-icon
                            v-if="common?.text1 && common?.text1 != ''"
                            :color="common?.text1 || ''"
                            class="q-ml-xs"
                            name="circle"
                            size="20px"
                            :style="{ color: common?.text1 }"
                          />

                          <span v-if="index != typePetAlertNames.length - 1">
                          </span>
                        </template>
                      </div>
                      <div
                        v-if="getPet?.flg_allergy || getPet?.flg_sideeffect"
                        class="q-mb-md"
                      >
                        <span class="field-label1">注意</span>
                        <span
                          v-if="getPet.flg_allergy"
                          class="field-label-free-color bg-negative text-white"
                        >
                          アレルギー
                        </span>
                        <span
                          v-if="getPet.flg_sideeffect"
                          class="field-label-free-color bg-negative text-white q-mr-none"
                        >
                          副作用
                        </span>
                      </div>
                      <div v-if="getPet?.flg_microchip" class="q-mb-md">
                        <span class="field-label1">マイクロチップ(MC)#</span>
                        <span>{{ getPet.microchip_id }}</span>
                      </div>
                      <div v-if="getPet?.flg_microchip" class="q-mb-md">
                        <span class="field-label1">MC挿入部位</span>
                        <span>{{ getPet.microchip_place }}</span>
                      </div>
                      <div v-if="getPet?.code_city_hall" class="q-mb-md">
                        <span class="field-label1">保健所コード</span>
                        <span>{{ getPet.code_city_hall }}</span>
                      </div>
                      <div v-if="getPet?.datetime_licensed" class="q-mb-md">
                        <span class="field-label1">鑑札登録日</span>
                        <span>{{ formatDate(getPet.datetime_licensed) }}</span>
                      </div>
                      <div v-if="getPet?.license_id" class="q-mb-md">
                        <span class="field-label1">鑑札番号</span>
                        <span>{{ getPet.license_id }}</span>
                      </div>
                      <div v-if="getPet?.name_registered" class="q-mb-md">
                        <span class="field-label1">保健所登録者</span>
                        <span>{{ getPet.name_registered }}</span>
                      </div>
                    </div>
                    <div class="col-lg-auto col-md-auto col-sm-12">
                      <div v-if="getPet?.memo_pet_info" class="q-mb-md">
                        <div class="q-mb-sm">
                          <span class="field-label1">その他ペットメモ</span>
                        </div>
                        <div class="width-90">
                          <p class="text-grey-700 ellipsis">
                            {{ getPet.memo_pet_info || '-' }}
                          </p>
                        </div>
                      </div>
                      <div
                        v-if="getCustomer && getCustomer.memo_customer"
                        class="q-mb-md"
                      >
                        <div class="q-mb-sm">
                          <span class="field-label1">オーナーメモ</span>
                        </div>
                        <p class="caption1-view text-grey-700">
                          {{ getCustomer.memo_customer || '-' }}
                        </p>
                      </div>
                      <div
                        v-if="getPet && getPet.memo_pet_by_customer"
                        class="q-mb-md"
                      >
                        <div class="q-mb-sm">
                          <span class="field-label1">飼い主メモ</span>
                        </div>
                        <p class="caption1-view text-grey-700">
                          {{ getPet.memo_pet_by_customer || '-' }}
                        </p>
                      </div>
                      <div class="q-mb-md">
                        <div class="q-mb-sm">
                          <span class="field-label1">ペット保険</span>
                        </div>
                        <div
                          v-for="pet_insurance in petInsurances"
                          v-if="
                            petSelected &&
                            petSelected?.flg_insurance_plan &&
                            petInsurances &&
                            petInsurances.length > 0
                          "
                        >
                          <div
                            :class="pet_insurance.is_old ? 'text-red' : ''"
                            class="cursor-pointer"
                            @click="openPetInsurance"
                          >
                            <span
                              v-if="pet_insurance.is_old"
                              class="text-bold text-red"
                            >
                              【失効】
                            </span>
                            <span class="q-mr-md text-blue">{{
                              pet_insurance.insurer?.name_insurer
                            }}</span>
                            <span class="q-mr-md">{{
                              pet_insurance.insurance_plan?.name_insurance_plan
                            }}</span>
                            <span class="q-mr-md"
                              >{{ pet_insurance.date_insurance_start }} ~
                              {{ pet_insurance.date_insurance_end }}</span
                            >
                          </div>
                        </div>
                        <div v-else>なし</div>
                      </div>
                      <div v-if="getPet?.flg_deceased" class="q-mb-sm">
                        <span class="field-label1">亡くなった日</span>
                        <span>{{
                          getPet.datetime_deceased
                            ? formatDate(getPet.datetime_deceased)
                            : null
                        }}</span>
                      </div>
                      <div v-if="getPet?.flg_send_flower" class="q-mb-sm">
                        <span class="field-label1">花送付日</span>
                        <span>{{
                          formatDate(getPet.datetime_send_flower)
                        }}</span>
                      </div>
                      <div v-if="getPet?.flg_send_flower" class="q-mb-sm">
                        <span class="field-label1">花送付メモ</span>
                        <span>{{ getPet.memo_send_flower || '-' }}</span>
                      </div>
                      <div v-if="getPet?.flg_pet_excluded" class="q-mb-sm">
                        <span class="field-label1">除外</span>
                        <span>{{
                          getPet.date_excluded
                            ? formatDate(getPet.datetime_deceased)
                            : null
                        }}</span>
                        <span class="q-ml-sm">{{
                          getPet.memo_excluded || '-'
                        }}</span>
                      </div>
                      <div
                        v-if="getPet?.flg_delete_by_customer"
                        class="remove-pet q-my-md"
                      >
                        <!---->
                        <q-icon class="q-mr-sm" name="do_disturb_on" />
                        オーナーによるペット登録の削除
                      </div>
                      <div v-if="getPet?.flg_unlist" class="remove-pet q-mb-sm">
                        <!---->
                        <q-icon class="q-mr-sm" name="do_disturb_on" />
                        システム除外
                      </div>
                    </div>
                  </div>
                  <q-separator class="q-mb-sm" />
                  <div class="flex items-center">
                    <q-btn
                      @click="openLatestRequestDetailPage"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="find_in_page" class="q-mr-xs" />
                      最新RQ
                    </q-btn>
                    <q-btn
                      @click="openRequestDetailPage"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="search" class="q-mr-xs" />
                      履歴RQ
                    </q-btn>
                    <q-btn
                      @click="openCreateRQModal"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="add" class="q-mr-xs" />
                      RQ
                    </q-btn>
                    <q-btn
                      @click="openCreateMemoCarte"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="add" class="q-mr-xs" />
                      メモカルテ
                    </q-btn>
                    <q-btn
                      @click="createPetBioInfoModal"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="add" class="q-mr-xs" />
                      TPR
                    </q-btn>
                    <q-btn
                      @click="openAutoRequestModal"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="library_add" class="q-mr-xs" />
                      <b class="text-weight-bold text-red">[調整中]</b>
                      クイックRQ
                    </q-btn>
                    <q-btn
                      @click="openCreateBookingRQModal"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="edit_calendar" class="q-mr-xs" />
                      予約追加
                    </q-btn>
                    <q-btn
                      @click="openInfoModal"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="mail" class="q-mr-xs" />
                      通知
                    </q-btn>
                    <q-btn
                      @click="openPetCartePdfSettingsModal"
                      class="bg-grey-300 q-mb-sm q-mr-sm"
                      unelevated
                    >
                      <q-icon name="picture_as_pdf" class="q-mr-xs" />
                      カルテ出力
                    </q-btn>
                  </div>
                  <q-separator />
                  <div class="flex justify-between items-center">
                    <div class="flex q-my-md items-center">
                      <span class="body2 q-mr-md regular text-grey-500">
                        オーナー様
                      </span>
                      <div class="flex">
                        <div class="col-auto">
                          <div class="text-grey-600 q-mb-sm">
                            {{ getCustomerKanaName(getCustomer) }}
                          </div>
                          <p
                            class="body1 regular q-ma-none"
                            @click="openCustomerDetail"
                          >
                            <span class="cursor-pointer text-blue text-underline">
                              {{ getCustomerNameWithCode(getCustomer) }}
                            </span>
                            <span class="caption1 regular text-grey-700 q-mx-sm"
                              >様</span
                            >
                            <q-icon
                              v-if="
                                getCustomerLabelColor(
                                  getCustomer?.type_customer_color
                                )
                              "
                              :color="
                                getCustomerLabelColor(
                                  getCustomer?.type_customer_color
                                )
                              "
                              name="circle"
                              size="12px"
                            />
                          </p>
                        </div>
                        <div class="col-auto">
                          <ol>
                            <li v-for="(tel, index) in getCustomer?.customer_tel">
                              {{ tel.tel_full }}
                              <span v-if="tel.title_tel"
                              >({{ tel.title_tel }})</span
                            >
                            </li>
                          </ol>
                        </div>
                      </div>
                    </div>
                    <div style="flex-basis: 50%;">
                      <q-btn v-if="customerStore?.getCustomer" @click="memoCustomerModal"
                        class="bg-grey-100 caption1 text-grey-800 q-my-sm q-py-xs" unelevated align="left" style="width: 100%">
                          <div class="items-center justify-between" style="width: 100%; display: flex">
                            <div class="text-left ellipsis btn-memo">
                              <span class="no-uppercase">
                                {{ memoCustomerStore.getCustomerMemo ?? 'メモ' }}
                              </span>
                            </div>
                            <div style="font-size: 12px">
                              <span>
                                <q-icon name="push_pin" class="q-mr-xs" size="15px" />
                                  {{
                                    memoCustomerStore.getMemoCustomers.filter(
                                      (memo: MemoCustomerType) => !!memo.flg_pin
                                    ).length
                                  }}
                              </span>
                              <span class="responsive-hide q-ml-sm">
                                <q-icon
                                  name="format_list_bulleted"
                                  class="q-mr-xs"
                                  size="16px"
                                />
                                  {{
                                    memoCustomerStore.getMemoCustomers.filter(
                                      (memo: MemoCustomerType) =>
                                        memo.type_memo_customer === TypeMemoCustomer.MEMO
                                      ).length
                                  }}
                              </span>
                              <span class="q-ml-sm" :class="{ 'blink text-danger': todoLengthCheck >= 1 }">
                                <q-icon name="task_alt" class="q-mr-xs" size="16px" />
                                {{ todoLengthCheck }}
                              </span>
                            </div>
                          </div>
                        </q-btn>
                      </div>
                    </div>
                  <q-separator />
                  <div v-if="otherPets" class="flex q-my-md items-center">
                    <span class="body2 q-mr-md regular text-grey-500"
                      >他ペット</span
                    >
                    <div>
                      <div v-for="pet in otherPets" class="flex">
                        <div class="q-mr-md">
                          {{ pet.code_pet }}
                        </div>
                        <div
                          @click.stop="openOtherPetModal(pet)"
                          class="q-mr-md text-blue cursor-pointer"
                        >
                          {{ pet.name_pet }}
                        </div>
                        <div class="q-mr-md">
                          <q-icon
                            v-if="getTypeAnimal(pet?.id_cm_animal)?.text1"
                            :color="
                              getTypeAnimal(pet?.id_cm_animal)?.text1 || ''
                            "
                            class="q-ml-xs"
                            name="circle"
                            size="12px"
                            :style="{
                              color: getTypeAnimal(pet?.id_cm_animal)?.text1
                            }"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <q-separator />
                  <div class="q-my-md flex" style="gap: 40px">
                    <span class="body2 q-mr-md regular text-grey-500"
                      >次回来院</span
                    >
                    <div class="flex-1">
                      <MtTable2
                        :columns="memoCustomerColumns"
                        :rows="getAllBookingsByPet"
                        :rowsBg="true"
                        flat
                        classTd="text-grey-500"
                        class="memo-customer-table"
                      >
                        <template v-slot:row="{ row }">
                          <td
                            v-for="(col, index) in memoCustomerColumns"
                            :key="index">
                              <div class="text-center" v-if="col.field === 'datetime_booking_confirmed'">
                                {{ getDateByFormat(row.datetime_booking_confirmed) }}
                              </div>
                              <div class="text-center" v-if="col.field === 'type_prevention'">
                                {{ typePreventionV1.find((type) => type.value === row.type_prevention)?.label || '' }}
                              </div>
                              <div class="text-center text-blue cursor-pointer text-underline" v-if="col.field === 'name_booking_source'" @click="openBookingSourceModal(row)">
                                {{ getBookingSourceData(row).name }}
                              </div>
                              <div class="text-center" v-if="col.field === 'category_names'">
                                {{ getBookingSourceData(row).name_category }}
                              </div>
                              <div class="text-center" v-if="col.field === 'date_start'">
                                {{ getDateByFormat(getBookingSourceData(row).date_start) }}
                              </div>
                          </td>
                        </template>
                      </MtTable2>
                      <q-pagination
                        v-if="getPageCount && getPageCount !== 1"
                        v-model="pagination.currentPage"
                        :max="getPageCount"
                        :max-pages="5"
                        boundary-numbers
                        direction-links
                        class="q-mt-sm justify-center"
                        @update:model-value="onUpdatePetBookingPage"
                      />
                    </div>
                  </div>
                </q-scroll-area>
              </div>
              <div class="section-padding-right-0" v-if="menu === '予防'">
                <PreventionPetDetail
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  :id_request="props.id_request"
                  :type_prevention="typePrevention"
                />
              </div>
              <div v-if="menu === '現疾患・既往歴'">
                <IllnessHistoryPetDetail
                  ref="labIllnessHistoryRef"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                />
              </div>
              <div v-if="menu === '手術・麻酔'">
                <ServiceDetailSurgeryPetDetail
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  :requestDetailPage="requestDetailPage"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '入院'">
                <PetDetailHospitalization
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  :requestDetailPage="requestDetailPage"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '治療・サービス'">
                <ServiceDetailPetDetail
                  ref="serviceDetailPetRef"
                  :defaultYearPeriod="defaultYearPeriod"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '処方箋'">
                <PrescriptionHistoryPetDetail
                  ref="prescriptionPetRef"
                  :defaultYearPeriod="defaultYearPeriod"
                  :id_pet="petSelected?.id_pet"
                  deletable
                  fixed-filter
                />
              </div>
              <div v-if="menu === '注射・点滴'">
                <InjectHistoryPetDetail
                  ref="InjectPetRef"
                  :defaultYearPeriod="defaultYearPeriod"
                  :id_pet="petSelected?.id_pet"
                  deletable
                  fixed-filter
                />
              </div>
              <div v-if="menu === 'タスク'">
                <TaskPetDetail
                  ref="taskByPetRef"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                />
              </div>
              <div v-if="menu === 'メモカルテ'">
                <MemoCartePetDetail
                  ref="memoCarteRef"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '検査結果'">
                <LabResultPetDetail
                  ref="labResultRef"
                  :defaultYearPeriod="'all'"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                  :isSidebarOpen="isSidebarOpen"
                />
              </div>
              <div v-if="menu === '生体情報'">
                <PetBioInfoPetDetail
                  ref="petBioInfoRef"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '状態管理'">
                <PetBioConditionPetDetail
                  ref="petBioConditionRef"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '関連資料'">
                <PetDiagonsticDetail
                  ref="petDiagonsticRef"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                />
              </div>
              <div v-if="menu === 'フード歴'">
                <FoodExtraPetDetail
                  ref="foodExtraRef"
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '美容歴'">
                <ShampooExtraPetDetail
                  :id_customer="customerSelected?.id_customer"
                  :id_pet="petSelected?.id_pet"
                  :requestDetailPage="requestDetailPage"
                  fixed-filter
                />
              </div>
              <div v-if="menu === '共有写真'">
                <p class="q-pl-md text-grey-500">共有写真はありません。</p>
              </div>
            </div>
            <div v-else class="q-pa-xl flex flex-center column text-center">
              <span>No Data Found</span>
            </div>
          </div>
        </template>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
          <span>キャンセル</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss">
.status {
  width: 120px;
  height: 30px;
}
.border-radius {
  border-radius: 10px;
}
.separate-scrollbar {
  height: calc(100vh - 189px);
  &.ah-menu-expanded {
    width: 250px; // Large screens (default)

    @media screen and (max-width: 1024px) {
      width: 230px; // Medium screens
    }
    @media screen and (max-width: 600px) {
      width: 180px; // Small screens
    }
  }
  &.ah-menu-collapsed {
    width: 66px; 
    :deep(.q-scrollarea__content) {
      padding-right: 8px;
    }
  }
  :deep(.q-scrollarea__content) {
    max-height: unset !important;
  }
  @media screen and (min-width: 1900px) {
    height: 77vh;
  }

  :deep(.q-list) {
    .q-item:last-child {
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
  }
}
.border-btn {
  border: 1px solid #b2a9a9;
  border-radius: 10px;
}

.width-90 {
  width: 90% !important;
  max-width: 300px;
}
.short-sidebar-container {
  // width: 45px; 
  .ah-menu-collapsed-btn {
    width: calc(100% - 8px);
    height: 48px;
    border-right: 1px solid rgba(0, 0, 0, 0.12); 
    border-bottom: 1px solid rgba(0, 0, 0, 0.12); 
  }
}
.short-sidebar-label {
  display: flex;
  text-align: center;
  align-items: center;
  justify-content: center;
  width: 43px;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

:deep(.q-card__section--vert) {
  &.view-pet-modal-content {
    padding: 0px !important;
  }
  &:has(.section-padding-right-0) {
    padding-right: 0px !important;
  }
  .view-pet-modal-content-inner {
    padding-left: 16px;
    padding-right: 16px;
    .ah-adjust-for-thumb-scroller { // for header with fixed only
      left: -16px !important;
      padding-right: 0px !important;
      padding-left: 20px !important;
    }
  }
}

.memo-customer-table {
  :deep(.q-table__card) {
    border: unset;
    .q-table {
      thead > tr {
        height: unset !important;
        th {
          font-weight: 400;
          padding: 0 16px 7px;
        }
      }
      tbody > tr > td {
        height: unset;
      }
      tbody > tr:nth-child(odd) {
        td {
          background: #eeeeee;
        }
      }
    }
  }
}

.btn-memo {
  width: 100%;
  max-width: 600px;

  @media screen and (max-width: 1800px) {
    max-width: 500px;
  }

  @media screen and (max-width: 1400px) {
    max-width: 400px;
  }

  @media screen and (max-width: 1310px) {
    max-width: 350px;
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.blink {
  animation: blink 0.8s infinite;
  animation-iteration-count: 10;
  /* Stops after 10 seconds */
}
</style>
