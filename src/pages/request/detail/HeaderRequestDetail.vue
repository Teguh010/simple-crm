<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUpdated,
  reactive,
  ref,
  watch
} from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'

// Utilities
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import {
  aahUtilsGetEmployeeName,
  aahUtilsGetPetInsurance,
  convertWeightInG,
  copyText,
  dateFormat,
  formatDate,
  getCurrentPetAge,
  getCustomerLabelColor,
  getCustomerName,
  getFullPetName,
  getPetFirstName,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'

// Components
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import OptionModal from '@/components/OptionModal.vue'

// Stores
import useActionStore from '@/stores/action'
import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'
import useIllnessHistoryStore from '@/stores/illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import usePetBioStore from '@/stores/pet-bios'
import useRequestStatus from '@/stores/request-statuses'
import useRequestStore from '@/stores/requests'
import useCartStore from '@/stores/carts'
import usePetInsuranceStore from '@/stores/pet-insurances'
import useMessageStore from '@/stores/message-clinic'
import useMemoCustomerStore, { TypeMemoCustomer } from '@/stores/memo-customer'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import { event_bus } from '@/utils/eventBus'
import useInsuranceStore from '@/stores/insurances'

// Types and Enums
import { typeBodyWeight, typePetGender } from '@/utils/enum'
import {
  CustomerType,
  MemoCustomerType,
  PetType,
  RequestDetailPageType
} from '@/types/types'
import usePetStore from '@/stores/pets'

// Lazy-loaded Components
const UpdateCustomerModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/UpdateCustomerModal.vue')
)
const UpdateCartHeaderModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartHeaderModal.vue')
)
const UpdateCustomerPetMemoModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/UpdateCustomerPetMemoModal.vue')
)
const UpdateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMemoCarteModal.vue')
)
const UpdatePetBioInfoModal = defineAsyncComponent(
  () => import('@/pages/petInfo/bioInfo/UpdatePetBioInfoModal.vue')
)
const UpdateRequestModal = defineAsyncComponent(
  () => import('../UpdateRequestModal.vue')
)
const SearchStatusBoardListModal = defineAsyncComponent(
  () => import('@/pages/statusBoard/SearchStatusBoardListModal.vue')
)
const UpdateRequestStatusModal = defineAsyncComponent(
  () => import('../status/UpdateRequestStatusModal.vue')
)
const UpdateMessageThreadModal = defineAsyncComponent(
  () => import('@/pages/message/UpdateMessageThreadModal.vue')
)
const UpdatePetModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/UpdatePetModal.vue')
)
const ViewMemoCustomerModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/ViewMemoCustomerModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/ViewPetDetailModal.vue')
)
const UpdatePdfPetCarteSetting = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdatePdfPetCarteSetting.vue')
)

const props = withDefaults(
  defineProps<{
    id: string
    customerSelected?: CustomerType
    petSelected?: PetType
    petList: PetType[]
    showHeader?: boolean
    requestDetailPage?: RequestDetailPageType
  }>(),
  {
    id: '',
    showHeader: true,
    customerSelected: () => {
      return {} as CustomerType
    },
    petSelected: () => {
      return {} as PetType
    },
    petList: () => {
      return [] as PetType[]
    },
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    }
  }
)

const emit = defineEmits(['init', 'changeSelectedPet', 'toggleHeader'])
const customerStore = useCustomerStore()
const requestStatusStore = useRequestStatus()
const petBioStore = usePetBioStore()
const requestStore = useRequestStore()
const actionStore = useActionStore()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const petInsuranceStore = usePetInsuranceStore()
const employeeStore = useEmployeeStore()
const commonStore = useCommonStore()
const cartStore = useCartStore()
const messageStore = useMessageStore()
const cliCommonStore = useCliCommonStore()
const petStore = usePetStore()
const { getRequestStatusList } = storeToRefs(requestStatusStore)
const { getIllnessHistory } = storeToRefs(illnessHistoryStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const petInsurance = computed(() => petInsuranceStore.getPetInsurances)
const { getCliCommonTypePetNatureList } = storeToRefs(cliCommonStore)
const action = computed(() => actionStore.action)
const memoCustomerStore = useMemoCustomerStore()

const router = useRouter()
const route = useRoute()

const statusSelected = ref()
let petListDefault: any = reactive([])
const selectedPet = ref<number | string>()

const typeAnimal = (value: number) =>
  getCommonTypeAnimalOptionList.value.find((v) => v.id_common == value)
const typeBodyWeightName = (value: number) =>
  typeBodyWeight.find((v) => v.value === value)?.label
const typePetAlertName = (value: string): string[] => {
  if (value) {
    const alerts = value.split('')
    const indexes = alerts
      .map((alert, idx) => {
        if (parseInt(alert)) return idx
      })
      .filter((index) => {
        return index !== undefined
      })

    return getCliCommonTypePetNatureList.value
      .filter((common, i) => {
        return indexes.includes(i)
      })
      .map((common) => {
        return common.text1
      })
  }
  return []
}
const breedName = (value: number) =>
  commonStore.getCommonBreedOptionList.find((v) => v.id_common == value)
    ?.name_common

// const checkTypeAnimalDog = (id_cm_animal: number) => [11, 12, 13].includes(parseInt(typeAnimal(id_cm_animal)?.code_func1))

const openCustomerDetail = async () => {
  await mtUtils.popup(UpdateCustomerModal, { data: customerStore.getCustomer })
  emit('init', true)
  // const route = router.resolve({
  //   name: 'SearchCustomerList',
  //   query: { id: customerStore.getCustomer.id_customer }
  // })
  // window.open(route.href, '_blank')
}
//ペット性別
const getPetGenderLabel = (genderValue) => {
  const gender = typePetGender.find((g) => g.value === genderValue)
  return gender ? gender.label : '不明'
}

const openPetDetail = async (e?: Event | null, tab?: string) => {
  if (e) e.preventDefault()
  if (!props.petSelected.id_pet) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_request: props.requestDetailPage?.id_request,
    id_pet_illness_history: getIllnessHistory.value?.id_pet_illness_history,
    requestDetailPage: props.requestDetailPage,
    tab
  })
  if (petStore.isPetUpdated) {
    petStore.setIsPetUpdatedStatus(false)
    emit('init', true)
  }
  if (requestStore.getRequestPageIsRefreshedPage) emit('init', true)
}
const memoCustomerPetModal = async () => {
  await mtUtils.mediumPopup(UpdateCustomerPetMemoModal, {
    id_pet: props.petSelected?.id_pet
  })
}
const memoCustomerModal = async () => {
  await mtUtils.popup(ViewMemoCustomerModal, {
    id_customer: props.customerSelected?.id_customer
  })
}
const createPetBioInfoModal = async () => {
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    from_request_page: true
  })
}
const createMemoCarteModal = async () => {
  memoCarteStore.selectMemoCarte(null)
  await mtUtils.popup(UpdateMemoCarteModal, {
    id_request: props.id,
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_pet_illness_history: getIllnessHistory.value?.id_pet_illness_history
  }, true)
}
const editPetBioInfoModal = async () => {
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_pet_bio_info: petBioStore.getPetBioForHeader?.id_pet_bio_info,
    date: petBioStore.getPetBioForHeader?.datetime_measure,
    from_request_page: true
  })
}
const openCartModal = async () => {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/CheckSDWithCD',
    {
      id_request: props.id
    }
  )

  let is_sync = false

  if (response && response.difference) {
    const confirmation = await mtUtils.confirm(
      '治療サービスオーダーと会計明細の販売単価または数量に差異がありました。 \n会計明細を更新しますか？',
      '確認',
      '反映しない',
      '反映する'
    )
    if (confirmation && confirmation == 'edit') {
      is_sync = true
    }
  }

  await cartStore
    .createCartFromRequest(props.id, {
      id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
      is_sync: is_sync
    })
    .catch((error) => {
      if (error.response.status === 409) {
        return mtUtils
          .confirm('会計側のデータを更新しますか？', '確認')
          .then((confirmation) => {
            const merge_action = confirmation ? 1 : 0
            cartStore.createCartFromRequest(props.id, {
              merge_action: merge_action
            })
          })
      }
    })
    .then((response) => {
      mtUtils.popup(UpdateCartHeaderModal, {
        data: cartStore.getCart,
        selectedIllnessHistory: getIllnessHistory.value
      })
    })
  // await mtUtils.popup(UpdateCartHeaderModal, {
  //   data: cartStore.getCart,
  //   selectedIllnessHistory: getIllnessHistory.value
  // })
}
async function openCreateStatus() {
  petListDefault = props.petList
  let updatedFlg = { value: false }

  await mtUtils.smallPopup(UpdateRequestStatusModal, {
    request: requestStore.getRequest,
    petListDefault,
    isNew: true,
    selectedCustomer: props.requestDetailPage.id_customer,
    selectedPet: props.requestDetailPage.id_pet,
    updatedFlg
  })

  await requestStatusStore.fetchRequestStatusesByIdRequest(
    props.id,
    props.requestDetailPage.id_pet
  )
  statusSelected.value = requestStatusStore.getRequestStatuses?.find(
    (status: any) => status.id_status
  )
}
const changeSelectedPet = async (id_pet: number | string) => {
  illnessHistoryStore.setIllnessHistoryList(null)
  event_bus.emit('resetIllnessHistory')

  await requestStatusStore.fetchRequestStatusesByIdRequest(props.id, id_pet)
  statusSelected.value = requestStatusStore.getRequestStatuses?.find(
    (status: any) => status.id_status
  )
  const selectedPet = customerStore.getCustomer.pets.find((pet) => {
    return pet.id_pet === id_pet
  })
  router.replace({
    path: route.path,
    query: { ...route.query, code_pet: selectedPet?.code_pet }
  })
  emit('changeSelectedPet', id_pet)
}
const openStatusBoardList = async () => {
  await mtUtils.popup(SearchStatusBoardListModal, {
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    petListDefault: props.petList,
    id_request: props.requestDetailPage?.id_request,
    isFromRequest: true,
    header: false
  })
  await requestStatusStore.fetchRequestStatusesByIdRequest(
    props.id,
    props.petSelected?.id_pet
  )
  statusSelected.value = requestStatusStore.getRequestStatuses?.find(
    (status: any) => status.id_status
  )
}
const openPreventativeOnViewPetDetailModal = async (
  type_preventative: number
) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    additional: { menu: 'preventative', type: type_preventative }
  })
}
watch(action, async () => {
  if (action.value === 'updateReqStatus') {
    await requestStatusStore.fetchRequestStatusesByIdRequest(
      props.id,
      props.petSelected?.id_pet
    )
    statusSelected.value = getRequestStatusList.value?.find(
      (status: any) => status.id_status
    )
    actionStore.resetAction()
  }
})

const openUpdateModal = async () => {
  await mtUtils.mediumPopup(UpdateRequestModal, {
    request: requestStore.getRequest
  })
}
const refreshKey = computed(() => {
  return JSON.stringify(props.requestDetailPage)
})
const openMenu = async () => {
  const menuOptions = [
    {
      title: 'URLコピー',
      name: 'url_copy',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '編集',
      name: 'edit',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '対応完了',
      name: 'request_complete',
      isChanged: false,
      attr: { class: null, clickable: true },
      showIcon: props.requestDetailPage.flg_complete
    },
    {
      title: 'スレッド作成',
      name: 'create_thread',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'スレッド検索',
      name: 'search_thread',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'RQ 予約新規',
      name: 'duplicate_request',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'RQ コピー新規',
      name: 'whole_request_duplicate',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    // Please uncomment item below if feature is needed
    // {
    //   title: '預かり品追加',
    //   name: 'create_items',
    //   isChanged: false,
    //   attr: { class: null, clickable: true }
    // },
    {
      title: '入院・預かり',
      name: 'check_pet_custody',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '会計する',
      name: 'open_cart',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'カルテ出力',
      name: 'pet_carte_pdf',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '情報更新',
      name: 'refresh',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'キャンセル',
      name: 'cancel',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: { class: null, clickable: true }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      const confirmation = await mtUtils.confirm(
        'リクエストの削除\n この操作では関連するオーダーまで削除します。\n 実行しますか？',
        '確認'
      );

      if (confirmation) {
        try {
          await requestStore.destroyRequest(props?.id);
          mtUtils.autoCloseAlert(aahMessages.success);
          router.push({ name: 'SearchRequestList' });
        } catch (error) {
          mtUtils.autoCloseAlert('完了したリクエストは削除できません。\n削除を希望される場合は、リクエストを未完了の状態に変更してから削除してください。');
        }
      }
    } else if (selectedOption.name == 'edit') {
      await mtUtils.mediumPopup(UpdateRequestModal, {
        request: requestStore.getRequest
      })
    } else if (selectedOption.name == 'request_complete') {
      const confirmation = await mtUtils.confirm(
        '以下の変更を適用します。\n' +
        '①会計対象項目は追加できなくなります\n' +
        '②未完了の項目を完了ステータスに更新します',
        'リクエストを完了しますか？',
        'OK'
      )

      if (confirmation) {
        await requestStore.updateRequest(props.requestDetailPage.id_request, {
          flg_complete: 1
        })
        event_bus.emit('reloadLeft')
        event_bus.emit('reloadTop')
        event_bus.emit('reloadRight', true)
        await mtUtils.autoCloseAlert(aahMessages.success)
      }
    } else if (selectedOption.name == 'url_copy') {
      try {
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました。')
      }
    } else if (selectedOption.name == 'create_thread') {
      const threadData = {
        memo_goal: '会計のスレッド ' + props.requestDetailPage.title_request,
        id_pet: props.requestDetailPage.id_pet,
        id_customer: props.customerSelected?.id_customer,
        linkCategory: 1,
        id_link1: props.requestDetailPage.id_request,
        number_link1: props.requestDetailPage.number_request,
        id_employee_answer: props.requestDetailPage.id_employee_staff
      }
      localStorage.setItem('pageAction', 'createThread')
      localStorage.setItem('createThread', JSON.stringify(threadData))
      await mtUtils.popup(UpdateMessageThreadModal, {})
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
    } else if (selectedOption.name == 'search_thread') {
      const searchThreadData = {
        id_customer: props.customerSelected?.id_customer,
        id_pet: props.requestDetailPage.id_pet,
        id_employee_answer: props.requestDetailPage.id_employee_staff
      }
      actionStore.setAction('searchThread', {
        data: searchThreadData
      })
      router.push({ name: 'MessageClinic' })
    } else if (selectedOption.name == 'duplicate_request') {
      const requestData = {
        memo_request: props.requestDetailPage.memo_request,
        id_employee_doctor: props.requestDetailPage.id_employee_doctor,
        id_employee_staff: props.requestDetailPage.id_employee_staff,
        flg_non_charge: props.requestDetailPage.flg_non_charge,
        flg_in_app_payment: props.requestDetailPage.flg_in_app_payment,
        id_employee_request: props.requestDetailPage.id_employee_request,
        flg_booking: 1
      }
      actionStore.setAction('createRequest', {
        id_customer: props.customerSelected?.id_customer,
        id_pet: props.requestDetailPage.id_pet,
        data: requestData
      })
      router.push({ name: 'SearchRequestList' })
    } else if (selectedOption.name == 'whole_request_duplicate') {
      await processWholeRequestDuplication()
    } else if (selectedOption.name === 'open_cart') {
      openCartModal()
    } else if (selectedOption.name === 'refresh') {
      emit('init', true)
    } else if (selectedOption.name === 'check_pet_custody') {
      await checkPetCustodyAvailable()
    } else if (selectedOption.name === 'pet_carte_pdf') {
      openPetCartePdfSettingsModal()
    }
  }
}

async function checkPetCustodyAvailable() {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'SearchPetCustodyList',
    { id_pet: props.requestDetailPage.id_pet }
  )
  if (response) {
    if (response && !response.length) {
      await mtUtils.autoCloseAlert('入院・預かり管理は見つかりませんでした。')
      return
    }
    const link = router.resolve({
      name: 'SearchTaskPetCustodyList',
      query: {
        id: response[0].id_pet_custody
      }
    })
    window.open(link.href, '_blank')
  }
}
async function processWholeRequestDuplication() {
  const requestData = {
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.requestDetailPage.id_pet,
    data: {
      memo_request: props.requestDetailPage.memo_request,
      id_employee_doctor: props.requestDetailPage.id_employee_doctor,
      id_employee_staff: props.requestDetailPage.id_employee_staff,
      flg_non_charge: props.requestDetailPage.flg_non_charge,
      flg_in_app_payment: props.requestDetailPage.flg_in_app_payment,
      id_employee_request: props.requestDetailPage.id_employee_request,
      flg_booking: false
    },
    requestDuplicate: true,
    id_request_old: props.requestDetailPage.id_request,
    disable_customer: true,
    disable_pet: true
  }

  const confirmation: any = await mtUtils.confirm(
    ' 本RQの明細を複製して新規RQを作成しますか？',
    '確認',
    ' 通常の複製',
    null,
    null,
    { label: '予定として複製', action: 'withBooking', show: true }
  )
  if (confirmation) {
    if (confirmation && confirmation === 'withBooking') {
      requestData.data.flg_booking = true
    }
    await mtUtils.mediumPopup(UpdateRequestModal, requestData)
  }
}

const getEmployeeName = (empId: number) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const openPetInsurance = async () => {
  await mtUtils.popup(UpdatePetModal, {
    openInsuranceTab: true
  })
}

const stretchCols = computed(() => {
  return window.innerWidth < 1024
})

const todoLengthCheck = computed(() => {
  return memoCustomerStore.getMemoCustomers
    .filter(
      (memo: MemoCustomerType) =>
        memo.type_memo_customer === TypeMemoCustomer.TODO
    )
    .filter((memo: MemoCustomerType) => memo.flg_complete === false).length
})

const openPetCartePdfSettingsModal = async () => {
  await mtUtils.popup(UpdatePdfPetCarteSetting, {})
}

// const stretchCols = computed(() => window.innerWidth < 1200 || Platform.is.ios)

onMounted(async () => {
  const { code_pet: codePet, id_pet: id_pet, tab } = route.query
  await mtUtils.promiseAllWithLoader([
    requestStatusStore.fetchRequestStatusesByIdRequest(
      props.id,
      id_pet ? id_pet : props.requestDetailPage.id_pet
    )
  ])
  if (
    actionStore.action === 'overviewModal' ||
    localStorage.getItem('pageAction') === 'overviewModal' ||
    (route.query?.openCart && route.query?.openCart as string === 'true')
  ) {
    openCartModal()
  }
  if (
    actionStore.action === 'createMemoCart' ||
    localStorage.getItem('pageAction') === 'createMemoCart'
  ) {
    createMemoCarteModal()
    sessionStorage.setItem('pageType', 'modal')
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
  const tempIdPet = id_pet ?? props.requestDetailPage.id_pet
  customerStore.selectPet(tempIdPet)
  selectedPet.value = tempIdPet

  statusSelected.value = requestStatusStore.getRequestStatuses?.find(
    (status: any) => status.id_status
  )
})

onUpdated(() => {
  const { tab } = route.query
  if (tab) {
    nextTick(() => {
      openPetDetail(null, tab as string)
    })
  }
})
defineExpose({ openCartModal })
</script>

<template>
  <MtHeader class="q-bb">
    <div :class="props.showHeader ? 'show-header' : 'hide-header'" class="row">
      <template v-if="props.showHeader">
        <div :class="stretchCols ? 'col-4' : 'col-4'">
          <div class="q-mt-sm q-mr-md">
            <div style="display: flex">
              <small v-if="!props.requestDetailPage.flg_complete" class="text-grey-500 q-mr-sm ellipsis">リクエスト番号</small>
              <small v-if="props.requestDetailPage.flg_apply_insurance"
                class="field-label-free-color body2 text-white bg-light-blue">
                保
              </small>
              <small v-if="
                props.requestDetailPage.flg_booking &&
                props.requestDetailPage.flg_complete == false
              " class="field-label-free-color body2 text-accent-050 bg-accent-800">
                予約
              </small>
              <small v-if="props.requestDetailPage.flg_complete"
                class="field-label-free-color body2 text-white bg-green-800 status-text">
                <span class="large-text">このRQは完了しています</span>
                <span class="small-text">完了</span>
              </small>
              <span @click="copyText(props.requestDetailPage.number_request)"
                class="title2 text-grey-800 bold cursor-pointer ellipsis ellipsis-1-lines q-mr-sm">
                {{ props.requestDetailPage.number_request }}
                <q-icon name="content_copy" class="text-blue" />
              </span>
            </div>
            <div class="text-grey-700 ellipsis ellipsis-1-lines cursor-pointer" @click="openUpdateModal">
              <small class="text-weight-bold" :key="refreshKey">
                <q-icon name="date_range" />
                {{
                  props.requestDetailPage.date_request_start ===
                    props.requestDetailPage.date_request_goal
                    ? props.requestDetailPage.date_request_start
                    : props.requestDetailPage.date_request_start +
                    ' ~ ' +
                    props.requestDetailPage.date_request_goal
                }}
              </small>
              <small class="q-ml-md"><q-icon name="people_alt" />
                {{
                  getEmployeeName(props.requestDetailPage.id_employee_doctor)
                }}
              </small>
              <small v-if="props.requestDetailPage.id_employee_staff" class="q-ml-xs">
                {{
                  '/ ' +
                  getEmployeeName(props.requestDetailPage.id_employee_staff)
                }}
              </small>
              <small class="text-blue q-ml-md"><q-icon name="create" />
                編集
                <!-- {{
                  getEmployeeName(props.requestDetailPage.id_employee_request)
                }} -->
              </small>
            </div>
            <div v-if="customerStore.getCustomer" class="flex no-wrap q-mt-xs">
              <div @click="openCustomerDetail" class="cursor-pointer" style="min-width: 130px">
                <small class="text-grey-600">{{
                  customerStore.getCustomer?.code_customer
                }}</small>
                <small class="text-grey-600 text-truncate q-ml-xs" v-if="customerStore.getCustomer?.name_kana_family">- {{ customerStore.getCustomer?.name_kana_family }} ｻﾏ</small>
                <div class="flex items-center">
                  <div v-if="customerStore.getCustomer" class="flex items-center">
                    <span class="text-blue text-truncate">
                      {{ getCustomerName(customerStore.getCustomer) || '' }}
                    </span>
                    <small class="text-grey-600">様</small>
                  </div>

                  <q-icon size="13px" name="circle" class="q-ml-xs" v-if="
                    getCustomerLabelColor(
                      customerStore.getCustomer?.type_customer_color
                    )
                  " :style="{
                      color: getCustomerLabelColor(
                        customerStore.getCustomer?.type_customer_color
                      )
                    }" :color="getCustomerLabelColor(
                      customerStore.getCustomer?.type_customer_color
                    )
                      " />
                </div>
              </div>
              <q-btn v-if="customerStore?.getCustomer" @click="memoCustomerModal"
                class="bg-grey-100 caption1 text-grey-800 q-my-sm q-py-xs" unelevated align="left" style="width: 100%">
                <div class="items-center justify-between" style="width: 100%; display: flex">
                  <div class="text-left ellipsis btn-memo">
                    <span>
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
        </div>
        <div :class="stretchCols ? 'col-5' : 'col-7'">
          <div class="bg-accent-050">
            <div :class="stretchCols ? 'justify-start' : 'justify-between'" class="flex no-wrap items-center">
              <div class="q-br" :style="{ 'flex-basis': stretchCols ? '70%' : '' }">
                <div class="q-px-xs">
                  <MtFormPullDown v-if="petList" label="" :options="petList" v-model:selected="selectedPet"
                    :custom-slot="true" :custom-option="true" @update:selected="changeSelectedPet">
                    <template v-slot:option="{ slotProps }">
                      <q-item clickable @click="slotProps.toggleOption(slotProps.opt)">
                        <span :class="slotProps.opt.flg_unlist ? 'text-darkred' : ''
                          ">
                          {{ slotProps.label }}
                        </span>
                      </q-item>
                    </template>
                    <template v-slot:selected>
                      <div @click.stop="openPetDetail" class="avatar-container">
                        <img v-if="props.petSelected" :src="getPetImageUrl(props.petSelected)"
                          @error="handleImageError($event, props.petSelected)" class="image-responsive" />
                        <div v-else class="default bg-grey-300" />
                        <div class="name-pet-container">
                          <small>{{ props.petSelected?.name_kana_pet }}</small>
                          <div class="text-subtitle1 text-blue text-bold ellipsis pet-name">
                            {{
                              getPetFirstName(props.petSelected) ||
                              'ペット未選択'
                            }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </MtFormPullDown>
                </div>
                <div v-if="statusSelected" class="flex justify-center text-center cursor-pointer q-px-xs q-my-xs"
                  @click.stop="openStatusBoardList">
                  {{ statusSelected?.status?.name_status }} {{ ' ' }}
                  <strong class="q-ml-sm">
                    {{
                      requestStatusStore.getRequestStatuses &&
                        requestStatusStore.getRequestStatuses?.length > 1
                        ? ` (+ ${requestStatusStore.getRequestStatuses?.length - 1
                        })`
                        : ''
                    }}
                  </strong>
                </div>
                <div v-else class="cursor-pointer q-px-md">
                  <q-btn @click="openCreateStatus" class="bg-grey-300" icon="add" size="12px" outline />
                </div>
              </div>
              <div v-if="!stretchCols" class="q-mx-xs hide-tablet ellipsis ellipsis-1-lines">
                <!-- <div>
                  <small class="text-grey-500">詳細情報</small>
                </div> -->
                <div class="ellipsis">
                  <!-- <q-icon name="arrow_right" /> -->
                  <span class="cursor-pointer q-ml-xs" @click="copyText(props.petSelected?.code_pet)">
                    <small class="field-label-free-color-small bg-white text-grey-700 q-mr-md">ペットCD</small>
                    <b>{{ props.petSelected?.code_pet }}</b>
                  </span>
                </div>
                <div class="ellipsis">
                  <q-icon name="arrow_right" />
                  <span class="q-ml-xs cursor-pointer" v-html="aahUtilsGetPetInsurance(props.petSelected, petInsurance)
                    " @click="openPetInsurance">
                  </span>
                </div>
                <div class="ellipsis">
                  <q-icon name="arrow_right" />
                  <span class="q-ml-xs">
                    {{ getCurrentPetAge(props.petSelected) }}
                  </span>
                  <span v-if="props.petSelected?.id_cm_animal" class="q-px-xs text-grey-500">/</span>
                  <span>
                    {{
                      typeAnimal(props.petSelected?.id_cm_animal)?.name_common
                    }}
                  </span>
                  <span class="q-px-xs text-grey-500">/</span>
                  <span v-if="props.petSelected?.id_cm_breed">
                    {{ breedName(props.petSelected?.id_cm_breed) }}
                  </span>
                  <small v-else class="text-grey-500"> 品種未設定 </small>
                </div>
                <div class="ellipsis">
                  <q-icon name="arrow_right" />
                  <span class="q-mr-sm">
                    <small>{{
                      getPetGenderLabel(props.petSelected?.type_pet_gender)
                    }}</small>
                  </span>
                  <q-icon v-for="(alert, index) in typePetAlertName(
                    props.petSelected?.pet_alert
                  )" size="12px" name="circle" :color="alert" :key="index" :style="{ color: alert }"
                    class="q-mr-xs" />
                  <span v-if="
                    !typePetAlertName(props.petSelected?.pet_alert).length
                  " class="text-grey-500 q-ml-xs q-mr-sm">
                    {{ '--' }}
                  </span>
                  <span v-if="props.petSelected?.flg_allergy" class="field-label-free-color bg-negative text-white">
                    アレルギー
                  </span>
                  <span v-if="props.petSelected?.flg_sideeffect"
                    class="field-label-free-color bg-negative text-white q-mr-none">
                    副作用
                  </span>
                </div>
              </div>
              <div class="w-30 hide-tablet">
                <div class="row q-col-gutter-md caption1 regular text-grey-700 q-mb-xs">
                  <div @click="openPreventativeOnViewPetDetailModal(4)" class="col center-prev-med cursor-pointer">
                    <div>
                      <img src="@/assets/img/request/prev-med1.svg" class="prev-med-icon" />
                    </div>
                    <div>
                      {{
                        dateFormat(
                          props.petSelected?.date_last_type_prev_4,
                          'YY.MM'
                        ) || '-'
                      }}
                    </div>
                  </div>
                  <div @click="openPreventativeOnViewPetDetailModal(3)" class="col center-prev-med cursor-pointer">
                    <div>
                      <img src="@/assets/img/request/prev-med2.svg" class="prev-med-icon" />
                    </div>
                    <div>
                      {{
                        dateFormat(
                          props.petSelected?.date_last_type_prev_3,
                          'YY.MM'
                        ) || '-'
                      }}
                    </div>
                  </div>
                  <div @click="openPreventativeOnViewPetDetailModal(2)" class="col center-prev-med cursor-pointer">
                    <div>
                      <img src="@/assets/img/request/prev-med3.svg" class="prev-med-icon" />
                    </div>
                    <div>
                      {{
                        dateFormat(
                          props.petSelected?.date_last_type_prev_2,
                          'YY.MM'
                        ) || '-'
                      }}
                    </div>
                  </div>
                  <div @click="openPreventativeOnViewPetDetailModal(1)" class="col center-prev-med cursor-pointer">
                    <!-- <div @click="openPreventativeOnViewPetDetailModal(1)" v-if="checkTypeAnimalDog(props.petSelected?.id_cm_animal)" class="col center-prev-med cursor-pointer"> -->

                    <div>
                      <img src="@/assets/img/request/prev-med4.svg" class="prev-med-icon" />
                    </div>
                    <div>
                      {{
                        dateFormat(
                          props.petSelected?.date_last_type_prev_1,
                          'YY.MM'
                        ) || '-'
                      }}
                    </div>
                  </div>
                </div>
                <q-btn v-if="props.petSelected" @click="memoCustomerPetModal"
                  class="bg-grey-200 caption1 text-grey-800 btn-memo-pet q-my-sm q-py-xs" unelevated>
                  <div class="text-left ellipsis">
                    <span>
                      {{ props.petSelected.memo_pet || 'ペットメモ' }}
                    </span>
                  </div>
                </q-btn>
              </div>
              <div class="q-mx-md ellipsis ellipsis-1-lines" :style="{ 'flex-basis': stretchCols ? '50%' : '' }">
                <div @click="editPetBioInfoModal" class="cursor-pointer">
                  <div>
                    <small class="text-grey-600 hide_small_screen">
                      体重：
                    </small>
                    <span
                      v-if="petBioStore.getPetBioForHeader?.val_weight"
                      class="text-subtitle1 text-blue text-bold"
                    >
                      {{
                        parseFloat(
                          convertWeightInG(
                            petBioStore.getPetBioForHeader?.val_weight,
                            petBioStore.getPetBioForHeader?.type_body_weight
                          )
                        )?.toFixed(2)
                      }}
                    </span>
                    <small class="text-grey-600 q-pl-xs">{{
                      typeBodyWeightName(
                        petBioStore.getPetBioForHeader?.type_body_weight
                      )
                    }}</small>
                  </div>
                  <div v-if="petBioStore.getPetBioForHeader?.datetime_measure" class="text-grey-500">
                    <small><q-icon name="scale" />
                      {{
                        formatDate(
                          petBioStore.getPetBioForHeader?.datetime_measure
                        ) ?? ''
                      }}
                    </small>
                  </div>
                </div>
                <div class="q-mr-md q-mt-xs">
                  <q-btn @click="createPetBioInfoModal" class="bg-grey-300" icon="add" size="18" unelevated />
                </div>
              </div>
            </div>
          </div>
        </div>
        <q-space></q-space>
        <div class="col-1">
          <div class="flex justify-end">
            <q-btn class="hide-tablet" icon="shopping_cart" @click="openCartModal" round size="24" flat />
            <q-btn @click="openMenu" icon="more_horiz" round size="24" flat />
          </div>
          <div class="flex justify-end hide_small_screen">
            <q-btn class="hide-tablet" @click="emit('init', true)" round icon="sync" size="24" flat />
            <q-btn @click="emit('toggleHeader')" icon="keyboard_arrow_down" size="24" round flat />
          </div>
        </div>
      </template>
    </div>
    <div :class="props.showHeader ? 'hidden' : ''" class="col-12">
      <div @click="emit('toggleHeader')" class="cursor-pointer flex justify-between items-center q-my-xs">
        <div class="flex items-center">
          <div class="cursor-pointer hide-tablet">
            <small class="text-grey-500 q-mr-sm">リクエスト番号</small>
            <small v-if="props.requestDetailPage.flg_booking"
              class="field-label-free-color body2 text-white bg-accent-800">
              予約
            </small>
            <span class="title2 text-grey-800 bold q-mr-sm">
              {{ props.requestDetailPage.number_request }}
            </span>
            <q-icon name="content_copy" class="text-blue"
              @click.stop="copyText(props.requestDetailPage.number_request)" />
          </div>
          <div class="q-ml-xl" @click.stop="openPetDetail">
            <div class="avatar-container">
              <img v-if="props.petSelected" :src="getPetImageUrl(props.petSelected)"
                @error="handleImageError($event, props.petSelected)" class="image-responsive" />
              <div v-else class="default bg-grey-300" />
              <span class="text-subtitle1 text-blue text-bold">
                {{
                  getFullPetName(props.petSelected, props.customerSelected) ||
                  'ペット未選択'
                }}
              </span>
            </div>
          </div>
          <div @click.stop="editPetBioInfoModal" class="q-ml-xl">
            <small class="text-grey-600"> 体重： </small>
            <span class="text-subtitle1 text-blue text-bold">
              {{
                parseFloat(
                  convertWeightInG(
                    petBioStore.getPetBioForHeader?.val_weight,
                    petBioStore.getPetBioForHeader?.type_body_weight
                  )
                )?.toFixed(2)
              }}
            </span>
            <small class="text-grey-600 q-pl-xs">{{
              typeBodyWeightName(
                petBioStore.getPetBioForHeader?.type_body_weight
              )
            }}</small>
          </div>
        </div>
        <div class="flex justify-end">
          <q-btn @click.stop="openCartModal" icon="shopping_cart" size="24" flat round class="hide-tablet" />
          <q-btn @click.stop="emit('init', true)" class="hide-tablet q-mx-sm" round icon="sync" size="24" flat />
          <q-btn @click.stop="openMenu" round icon="more_horiz" size="24" flat />
        </div>
      </div>
    </div>
  </MtHeader>
</template>

<style lang="scss" scoped>
.large-text {
  display: none;
}

@media screen and (min-width: 1160px) {
  .small-text {
    display: none;
  }

  .large-text {
    display: inline;
  }
}

.avatar-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: start;
  gap: 8px;

  img,
  .default {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}

.name-pet-container {
  display: flex;
  flex-direction: column;
}

.hide-header {
  opacity: 0;
  max-height: 0px;
}

.show-header {
  opacity: 1;
  max-height: 150px;
}

.btn-memo-pet {
  width: 100%;
  max-width: 325px;
}

@media (min-width: 768px) and (max-width: 991.98px) and (max-height: 495px) {
  .q-mx-md.ellipsis.ellipsis-1-lines {
    overflow: visible;
  }

  .show-header {
    height: 105px;
    overflow-y: hidden;
  }
}

@media (min-width: 992px) and (max-width: 1199.98px) {
  .q-mx-md.ellipsis.ellipsis-1-lines {
    overflow: visible;
  }

  .show-header {
    height: 105px;
    overflow-y: hidden;
  }
}

@media (min-width: 1200px) {
  .q-mx-md.ellipsis.ellipsis-1-lines {
    overflow: visible;
  }

  .show-header {
    height: 105px;
    overflow-y: hidden;
  }
}

.hide_small_screen {
  @media screen and (max-width: 1075px) {
    display: none;
  }
}

.btn-memo {
  width: 100%;
  max-width: 200px;

  @media screen and (max-width: 1600px) {
    max-width: 150px;
  }

  @media screen and (max-width: 1400px) {
    max-width: 100px;
  }

  @media screen and (max-width: 1310px) {
    max-width: 60px;
  }
}

.responsive-hide {
  @media screen and (max-width: 1100px) {
    display: none;
  }
}

.pet-name {
  width: 100%;
  max-width: 125px;
}

:deep(.btn-memo-pet .q-btn__content) {
  text-align: left !important;
  justify-content: start;
  text-transform: none;
}

.hide-tablet {
  @media screen and (max-width: 960px) {
    display: none;
  }
}

.customer-memo-btn {
  @media screen and (max-width: 1200px) {
    line-height: 1.2;
  }
}

.prev-med-icon {
  width: 25px;
  height: 25px;
  margin: 7px 0;
}

.center-prev-med {
  display: flex;
  flex-direction: column;
  /* 子要素を縦方向に配置 */
  align-items: center;
  /* 子要素を横方向の中央に配置 */
  justify-content: center;
  /* 子要素を縦方向の中央に配置 */
  height: 100%;
  /* 必要に応じて高さを設定 */
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
