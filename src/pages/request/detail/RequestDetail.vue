<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Platform } from 'quasar'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import { setPageTitle } from '@/utils/pageTitleHelper'

// Stores
import useCustomerStore from '@/stores/customers'
import useRequestStore from '@/stores/requests'
import useIllnessHistoryStore from '@/stores/illness-history'
import useServiceDetailStore from '@/stores/service-details'
import usePetBioStore from '@/stores/pet-bios'
import usePetInsuranceStore from '@/stores/pet-insurances'
import useMemoCarteStore from '@/stores/memo-cartes'
import useTask from '@/stores/task'
import usePrescriptionStore from '@/stores/prescription'
import useCommonStore from '@/stores/common'
import useMemoCustomerStore from '@/stores/memo-customer'
import useCliCommonStore from '@/stores/cli-common'

// Types
import { CustomerType, PetType, RequestDetailPageType } from '@/types/types'

// components
import HeaderRequestDetail from './HeaderRequestDetail.vue'
import LeftRequestDetail from './LeftRequestDetail.vue'
import MiddleRequestDetail from './MiddleRequestDetail.vue'
import RightRequestDetail from './RightRequestDetail.vue'
import useInjectStore from '@/stores/inject'
import useInsuranceStore from '@/stores/insurances'
import useRequestStatus from '@/stores/request-statuses'
import { values } from 'lodash'

// Lazy-loaded Components
const ViewPrescriptionModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/ViewPrescriptionModal.vue')
)
const UpdateServiceDetailModal = defineAsyncComponent(
  () => import('../serviceDetail/UpdateServiceDetailModal.vue')
)
const UpdateIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue')
)
const AllCartePerDateListModal = defineAsyncComponent(
  () => import('@/pages/request/AllCartePerDateListModal.vue')
)

const props = withDefaults(
  defineProps<{
    id: string
  }>(),
  {
    id: ''
  }
)

// const requestDetailPage: RequestDetailPageType = reactive({
//   id_request: '',
//   title_request: '',
//   number_request: '',
//   id_pet: '',
//   id_customer: '',
//   code_customer: '',
//   name_customer: '',
//   name_pet: '',
//   id_employee_staff: '',
//   id_employee_doctor: '',
//   date_start: '',
//   date_end: '',
//   date_request_start: '',
//   date_request_goal: '',
//   memo_request: '',
//   flg_non_charge: false,
//   flg_in_app_payment: false,
//   id_employee_request: '',
//   flg_booking: false,
//   flg_complete: false,
//   flg_apply_insurance: false
// })

const route = useRoute()
const router = useRouter()
const insuranceStore = useInsuranceStore()
const cliCommonStore = useCliCommonStore()
const petInsuranceStore = usePetInsuranceStore()
const serviceDetailStore = useServiceDetailStore()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const petBioStore = usePetBioStore()
const requestStore = useRequestStore()
const { requestDetailPage } = storeToRefs(requestStore)
const taskStore = useTask()
const customerStore = useCustomerStore()
const prescriptionStore = usePrescriptionStore()
const requestStatusStore = useRequestStatus()
const { getRequest } = storeToRefs(requestStore)
const { getPrescriptionListByRequest } = storeToRefs(prescriptionStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const rightSidebar = ref(true)
const customerSelected = ref<CustomerType>({})
const petList = ref([])
const petSelected = ref<PetType>({})
const HeaderRequestDetailRef = ref(null)
const commonStore = useCommonStore()
const memoCustomerStore = useMemoCustomerStore()
const activateDropdown = ref<number[]>([])

const rightRequestDetailRef = ref(null)

// Define a ref for the header height
const headerHeight = ref(130) // Adjust this value based on your header height

// Adjust the height value for tablets to prevent page scrolling
const reduceHeightForTablet = ref(Platform.is.mobile ? 10 : 0)

// Compute the main content height dynamically
const mainHeight = computed(
  () => `calc(100dvh - ${headerHeight.value + reduceHeightForTablet.value}px)`
)

// Compute the main content style object based on above properties
const scrollAreaHeight = computed(() => {
  return { height: mainHeight.value }
})

function assignPageData(newData: any) {
  for (let key in requestDetailPage.value) {
    requestDetailPage.value[key] = newData[key]
  }
}

const changeSelectedPet = async (id_pet: string | number) => {
  const idPet = parseInt(id_pet)
  if (!idPet) {
    petSelected.value = null
    return
  }
  petSelected.value = petList.value.find((pet: any) => {
    return pet.id_pet === idPet
  })
  customerStore.selectPet(idPet)
  requestDetailPage.value.id_pet = idPet
  const pageTitle = `${getCustomer?.value?.name_family}${getPet?.value?.name_pet}`
  if (pageTitle) {
    setPageTitle(`RQ: ${pageTitle}`)
  }
  init()
}

const setterActivatedDropdown = () => {
  activateDropdown.value = []
  let currentHighestDropdown = 4
  // check if the value is already in the local storage
  let localValue = parseInt(localStorage.getItem('requestOpenCloseCondition') || '0', 10) 
  if(localValue === 0) return
  while (localValue > 0) {
    // Check if the current highest dropdown is activated
    if (localValue >= Math.pow(2, currentHighestDropdown)) {
        // Subtract the value of the activated dropdown and add it to the activated list
        localValue -= Math.pow(2, currentHighestDropdown);
        activateDropdown.value.push(currentHighestDropdown);
    }

    // Decrement the current highest dropdown to check the next lower one
    currentHighestDropdown--;
  }

  if (activateDropdown.value.includes(0)) headerHeight.value = 130
  else headerHeight.value = 70
}


const toggleDropdown = (value: number) => {
  const localValue = parseInt(localStorage.getItem('requestOpenCloseCondition') || '0', 10) 
  if(activateDropdown.value.includes(value)){
    activateDropdown.value = activateDropdown.value.filter((v) => v !== value)
    // store new value based on activateDropdown
    let newValue = 0
    activateDropdown.value.forEach((v) => {
      newValue += Math.pow(2, v)
    })
    localStorage.setItem('requestOpenCloseCondition', newValue.toString())
  } else {
    const newValue = Math.pow(2, value)
    // store the of the sum of the values in local storage
    localStorage.setItem(
      'requestOpenCloseCondition',
      (localValue + newValue).toString()
    )
  }
  setterActivatedDropdown()
}

const openPrescriptionListModal = async (prescription: any) => {
  await router.replace({
    name: 'RequestDetailPrescription',
    query: { id_prescription: prescription.id_prescription }
  })
  customerStore.selectPet(prescription.id_pet)
  await mtUtils.mediumPopup(ViewPrescriptionModal, {
    requestDetailPage: requestDetailPage.value,
    id_pet: prescription.id_pet
  }, true)
  await router.replace({ name: 'RequestDetail' })
}

const openItemServiceDetailModal = async (id_service_detail: any) => {
  serviceDetailStore.selectServiceDetail(id_service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {
    data: requestStore.getRequest.value
  })
}

const openEditIllnessHistoryModal = async (id_pet_illness_history: any) => {
  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    id_employee_doctor: requestDetailPage.value.id_employee_doctor,
    petSelected: petSelected.value,
    id_pet_illness_history
  })
  await router.replace({ name: 'RequestDetail' })
}

const init = async (withRequest = false) => {
  illnessHistoryStore.setIllnessHistoryList(null)
  memoCarteStore.setMemoCarte(null)
  memoCarteStore.setMemoCarteListToNull()
  petBioStore.setPetBioToNull()

  if (withRequest) {
    // This called when needed to re-fetch request and customer data. ex: when the sync button is clicked
    petSelected.value = null
    await requestStore.fetchRequest(props.id)
    assignPageData({ ...requestStore.getRequest })
    await mtUtils.promiseAllWithLoader([customerStore.selectCustomer(
      requestStore.getRequest.id_customer,
      true
    ), requestStatusStore.fetchRequestStatusesByIdRequest(
      props.id,
      petSelected.value?.id_pet
    )])
    customerSelected.value = getCustomer.value
    petList.value = getCustomer.value?.pets
    petSelected.value = getPet.value
    customerStore.selectPet(petSelected.value?.id_pet ?? getCustomer.value?.pets?.[0]?.id_pet)

    requestDetailPage.value.id_pet = getPet?.value?.id_pet
    requestDetailPage.value.name_pet = getPet?.value?.name_pet
    requestDetailPage.value.id_customer = getCustomer.value?.id_customer
    requestDetailPage.value.code_customer = getCustomer.value?.code_customer
  }

  await Promise.all([
    commonStore.fetchPreparationCommonList({
      code_common: [11, 12, 31, 25, 27, 29]
    }),
    cliCommonStore.fetchPreparationCliCommonList({
      code_cli_common: [5, 13, 11, 14]
    }, true),
    petSelected?.value?.id_pet
    ? illnessHistoryStore.fetchIllnessHistorys({
        id_pet: petSelected.value?.id_pet,
        id_customer: customerSelected.value?.id_customer,
      }).then(async () => {
        const status = requestStatusStore.getRequestStatuses?.find((status) => status.id_status && status.id_pet == petSelected.value?.id_pet)

        if (values(status?.ui_state?.illness_history_list)?.length > 0) {
          illnessHistoryStore.getIllnessHistorys.map((ih, key) => {
            if (
              values(status?.ui_state?.illness_history_list)?.includes(ih.id_pet_illness_history.toString()) && ih.flg_pinned
            ) {
              illnessHistoryStore.selectIllnessHistory(
                ih.id_pet_illness_history,
                { isWhole: false }
              )
            }
            if (
              values(status?.ui_state?.illness_history_list)?.includes(ih.id_pet_illness_history.toString()) && !ih.flg_pinned
            ) {
              illnessHistoryStore.selectIllnessHistory(
                ih.id_pet_illness_history,
                { isWhole: false }
              )
            }
          })
        } else {
          illnessHistoryStore.getIllnessHistorys.map(async (ih, key) => {
            if (key == 0 && status) {
              await illnessHistoryStore.selectIllnessHistory(
                ih.id_pet_illness_history,
                { isWhole: false }
              )
              await illnessHistoryStore.updReqUiState({
                id_pet_illness_history: ih.id_pet_illness_history,
                operation: 'push',
                id_req_status: status?.id_req_status
              })
              ih.isActiveIH = true
              ih.isChecked = true
            }
          })
        }
      })
    : null,
    petInsuranceStore.fetchPetInsurances({
      id_pet: petSelected.value?.id_pet,
      id_customer: customerSelected.value?.id_customer
      // active_insurance_only: true
    }),
    petBioStore.fetchPetBio({
      id_pet: petSelected.value?.id_pet,
      id_customer: customerSelected.value?.id_customer,
      fetch_weight: true,
      page_size:10,
    }),
    memoCarteStore.fetchMemoCarteV1({
      id_pet: petSelected.value?.id_pet,
      id_customer: customerSelected.value?.id_customer,
      page_size: 200
    }),
    memoCarteStore.fetchMemoCartePinned({ id_pet: petSelected.value?.id_pet }),
    taskStore.fetchTaskByRequest(props.id),
    prescriptionStore.fetchPrescriptionByRequest(props.id),
    useInjectStore().fetchInjectByRequest(props.id),
    memoCustomerStore.fetchMemoCustomers({
      id_customer: customerSelected.value?.id_customer
    }),
    insuranceStore.fetchInsurances()
  ])

  if (route?.query?.id_prescription) {
    await openPrescriptionListModal(
      getPrescriptionListByRequest.value.find(
        (prescriptionObj: { id_prescription: string }) =>
          prescriptionObj.id_prescription == route.query.id_prescription
      )
    )
    prescriptionStore.fetchPrescriptionByRequest(props.id)
  } else if (route?.query?.sd) {
    await openItemServiceDetailModal(route?.query?.sd)
    serviceDetailStore.fetchServiceDetails(props.id, {
      id_customer: getCustomer.value?.id_customer,
      id_request: requestDetailPage.value.id_request
    })
  } else if (route?.query?.id_service_detail) {
    await openItemServiceDetailModal(route?.query?.id_service_detail)
    serviceDetailStore.fetchServiceDetails(props.id, {
      id_customer: getCustomer.value?.id_customer,
      id_request: requestDetailPage.value.id_request
    })
  } else if (route?.query?.ih) {
    await openEditIllnessHistoryModal(route?.query?.ih)
  } else if (route?.query?.open_carte_per_date_list) {
    await mtUtils.popup(AllCartePerDateListModal, {
      customerSelected: customerSelected.value,
      petSelected: petSelected.value
    })

  } else if (route?.query?.open_cart) {
    if (HeaderRequestDetailRef.value) {
      HeaderRequestDetailRef.value?.openCartModal()
    }
  }

  requestStore.setRequestPageRefresh(false)
  rightRequestDetailRef.value?.reRenderDOM()
}

const leftSideInItCall = async (hardReset = false) => {
  const promises = []
  if (hardReset) {
    illnessHistoryStore.setIllnessHistoryList(null)
    promises.push(illnessHistoryStore.selectIllnessHistoryByPet(petSelected.value?.id_pet))
  } else {
    illnessHistoryStore.getLeftSideIllnessHistoryList?.forEach(v => {
      promises.push(illnessHistoryStore.refreshLeftSideIH(v.id_pet_illness_history))
    })
    illnessHistoryStore.setIllnessHistoryList(null)
  }

  await Promise.all([
    serviceDetailStore.fetchServiceDetails(props.id, {
      id_customer: getCustomer.value?.id_customer,
      id_request: requestDetailPage.value.id_request
    }),
    ...promises
  ])
}
const resetRequestStore = () => {
  customerStore.resetSelectedCustomer()
  illnessHistoryStore.setIllnessHistory(null)
  illnessHistoryStore.setIllnessHistoryList(null)
  serviceDetailStore.setServiceDetailList(null)
  memoCustomerStore.resetCustomerMemo()

  prescriptionStore.resetPrescriptionListByRequest()

  memoCarteStore.setMemoCarte(null)
  memoCarteStore.setMemoCarteListToNull()
}

onMounted(async () => {
  setterActivatedDropdown()
  const { code_pet: codePet } = route.query

  // Hide the left section if opening on tablet
  // if (window.innerWidth < 1200) rightSidebar.value = false

  // Initialization function for RQ detail page
  resetRequestStore()

  await requestStore.fetchRequest(props.id)
  await customerStore.selectCustomer(requestStore.getRequest.id_customer, true)
  assignPageData({ ...requestStore.getRequest })

  customerSelected.value = getCustomer.value
  petList.value = getCustomer.value?.pets

  if (codePet) {
    const pet = customerStore.getCustomer.pets.find((pet) => {
      return pet.code_pet === codePet
    })
    customerStore.selectPet(parseInt(pet?.id_pet as string))
  } else {
    customerStore.selectPet(requestStore.getRequest.id_pet)
  }

  if (petList.value.length) {
    requestDetailPage.value.id_pet = getPet?.value?.id_pet
    requestDetailPage.value.name_pet = getPet?.value?.name_pet
    requestDetailPage.value.id_customer = getCustomer.value?.id_customer
    requestDetailPage.value.code_customer = getCustomer.value?.code_customer
    petSelected.value = getPet.value
  }
  await init()

  event_bus.emit('reloadRight', false)

  // set page title
  const pageTitle = `${getCustomer?.value?.name_family}${getPet?.value?.name_pet}`
  if (pageTitle) {
    setPageTitle(`RQ: ${pageTitle}`)
  }
})

event_bus.on('reloadLeft', async (hardReset = false) => {
  await leftSideInItCall(hardReset)
  // await init()
})
event_bus.on('reloadTop', async () => {
  await requestStore.fetchRequest(props.id)
  await customerStore.selectCustomer(requestStore.getRequest.id_customer, true)
  customerStore.selectPet(
    getCustomer.value?.pets?.find(
      (v: PetType) => v.id_pet == petSelected.value?.id_pet
    )?.id_pet
  )
  petSelected.value = getPet.value

  assignPageData({ ...requestStore.getRequest })
  requestDetailPage.value.id_pet = getPet?.value?.id_pet
  requestDetailPage.value.name_pet = getPet?.value?.name_pet
  requestDetailPage.value.id_customer = getCustomer.value?.id_customer
  requestDetailPage.value.code_customer = getCustomer.value?.code_customer
})
onUnmounted(() => {
  resetRequestStore()

  event_bus.off('reloadLeft')
  event_bus.off('reloadTop')
})
</script>

<template>
  <div>
    <HeaderRequestDetail
      ref="HeaderRequestDetailRef"
      :id="props.id"
      :requestDetailPage="requestDetailPage"
      :petSelected="petSelected"
      :petList="petList"
      :showHeader="activateDropdown.includes(0)"
      :customerSelected="customerSelected"
      @changeSelectedPet="changeSelectedPet"
      @init="init"
      @toggleHeader="toggleDropdown(0)"
    />
    <div
      class="row"
      :class="activateDropdown.includes(0) ? 'content-request' : 'content-request-small'"
    >
      <LeftRequestDetail
        :rightSidebar="rightSidebar"
        :petSelected="petSelected"
        :showHeader="activateDropdown.includes(0)"
        :requestDetailPage="requestDetailPage"
        :scrollAreaHeight="scrollAreaHeight"
        @init-call="leftSideInItCall"
      />
      <MiddleRequestDetail
        :id="props.id"
        :petSelected="petSelected"
        :customerSelected="customerSelected"
        :requestDetailPage="requestDetailPage"
        :scrollAreaHeight="scrollAreaHeight"
      />
      <RightRequestDetail
        :showService="activateDropdown.includes(1)"
        :showPrescription="activateDropdown.includes(2)"
        :showInjection="activateDropdown.includes(3)"
        :showTasks="activateDropdown.includes(4)"
        :petSelected="petSelected"
        :customerSelected="customerSelected"
        :id="props.id"
        :requestDetailPage="requestDetailPage"
        @update:rightSidebar="rightSidebar = $event"
        :rightSidebar="rightSidebar"
        :scrollAreaHeight="scrollAreaHeight"
        ref="rightRequestDetailRef"
        @toggle-dropdown="toggleDropdown($event)"
      />
    </div>
  </div>
</template>
<style scoped lang="scss">
:deep(.q-field--standard .q-field__control:after) {
  height: 0;
}
:deep(.q-field--standard .q-field__control:before) {
  border: 0;
  transition: none;
}

.content-request {
  padding-top: 80px;
}
.content-request-small {
  padding-top: 20px;
}
@media only screen and (max-width: 1200px) {
  // For IPAD
  .content-request {
    padding-top: 90px;
  }
  .content-request-small {
    padding-top: 30px;
  }
}
</style>
