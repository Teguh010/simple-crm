<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref, withDefaults } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Utilities
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'
import { setPageTitle } from '@/utils/pageTitleHelper'
import {
  comTypeDose,
  copyText,
  dateFormat,
  formatDateTime,
  formatDateWithTime,
  getCustomerLabelColor,
  getCustomerName,
  getDateTimeNow,
  getPetFirstName,
  roundZeroAfterPoint,
  typeDoseQuantityUI
} from '@/utils/aahUtils'
import prescriptionUtils from '@/pages/request/prescription/prescriptionUtils'

// Components
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import GeneralCancellationModel from '@/components/GeneralCancellationModel.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import PrescriptionDetailAssortPocket from '@/components/PocketList/PrescriptionDetailAssortPocket.vue'
import PrescriptionDetailBox from '@/components/PocketList/PrescriptionDetailBox.vue'

// Stores
import useCustomerStore from '@/stores/customers'
import usePrescriptionStore from '@/stores/prescription'
import usePetBioStore from '@/stores/pet-bios'
import useCategoryStore from '@/stores/categories'
import useTask from '@/stores/task'
import useEmployeeStore from '@/stores/employees'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCommonStore from '@/stores/common'
import useMessageStore from '@/stores/message-clinic'
import useDoseStore from '@/stores/dose-frequencies'
// Types
import { PrescriptionDetailType, PrescriptionType, RequestDetailPageType } from '@/types/types'
import UpdateGroupTitle2Modal from '@/pages/request/prescription/UpdateGroupTitle2Modal.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'

// Lazy-loaded Components
const updPrescriptionDetailByPet = defineAsyncComponent(
  () =>
    import('@/pages/request/prescription/UpdPrescriptionDetailByPetModal.vue')
)
const UpdPrescriptionHeader = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdPrescriptionHeaderModel.vue')
)
const UpdPrescriptionDetailModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdPrescriptionDetailModal.vue')
)
const UpdateTaskModal = defineAsyncComponent(
  () => import('@/pages/task/UpdateTaskModal.vue')
)
const ViewTaskDetailModal = defineAsyncComponent(
  () => import('@/pages/task/ViewTaskDetailModal.vue')
)
const UpdateGroupTitleModal = defineAsyncComponent(
  () => import('./UpdateGroupTitleModal.vue')
)
const UpdatePdfPrescriptionSetting = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdatePdfPrescriptionSetting.vue')
)
const GetPdfPrescriptionPrepList = defineAsyncComponent(
  () => import('@/pages/request/prescription/GetPdfPrescriptionPrepList.vue')
)
const UpdateMessageThreadModal = defineAsyncComponent(
  () => import('@/pages/message/UpdateMessageThreadModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/ViewPetDetailModal.vue')
)

const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const employeeStore = useEmployeeStore()
const prescriptionStore = usePrescriptionStore()
const illnessHistoryStore = useIllnessHistoryStore()
const { getCustomer } = storeToRefs(customerStore)
const petBioInfoStore = usePetBioStore()
const messageStore = useMessageStore()
const doseStore = useDoseStore()
const taskStore = useTask()
const router = useRouter()

const props = withDefaults(
  defineProps<{
    requestDetailPage: RequestDetailPageType
    id_pet: string
    prescriptionObj: PrescriptionType
    fromPD: boolean
    id_customer: string
    fromPage: string
    pageTitle: string
  }>(),
  {
    fromPD: false,
    fromPage: '',
    pageTitle: '',
    id_customer: ''
  }
)
const emits = defineEmits(['close'])

const petList: any = computed(() => customerStore.getCustomer?.pets)
const selectedPet = ref('')

const sortMode = ref(false)
const mergeMode = ref(true)
const id_pet = ref(null)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const prescriptionPdfAttributes = reactive({
  render: false
})
const PrescriptionDetailAssortData = ref([])

const prescriptionHeader = ref({
  title_prescription: null,
  memo_prescription: '',
  prescription_detail_list: <any>[],
  id_pet_bio_info: null,
  number_prescription: '',
  request: null,
  id_request: null,
  id_prescription: null,
  id_customer: null,
  id_pet: null,
  id_employee_staff: null,
  flg_cancel: null,
  datetime_cancel: null,
  memo_cancel: null,
  id_employee_doctor: null,
  flg_all_prepared: null,
  flg_delivered: null,
  id_pet_illness_history: '',
  val_weight: null,
  flg_task_created: null,
  flgCompleteUi: false,
  flg_prescription_order: false,

  id_employee_review1: '',
  id_employee_review2: '',
  id_employee_review3: '',
})

const isTaskModal = ref(false)
const petBioObj = ref(<any>null)

const commonTypeAnimalOptionList: any = ref([])

const valWeightUI = computed(() => {
  return `${(prescriptionHeader.value.val_weight / 1000).toFixed(2)} Kg`
})
const typeAnimalUI = computed(() => {
  if (
    customerStore?.getCustomer?.pets?.find(
      (petObj: any) => petObj.id_pet == prescriptionHeader.value.id_pet
    )?.id_cm_animal
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == prescriptionHeader.value.id_pet
    )?.id_cm_animal
    return `${
      commonTypeAnimalOptionList.value.find(
        (obj: any) => obj.value == typeAnimal
      )?.label
    }`
  }
  return ''
})

async function executeTogether() {
  await customerStore.selectCustomer(
    props?.prescriptionObj?.id_customer ??
      props?.requestDetailPage?.id_customer ??
      props.id_customer
  )
  illnessHistoryStore.fetchPreparationIllnessHistorys({
    id_pet: props.prescriptionObj?.id_pet ?? props.requestDetailPage?.id_pet
  })
  useCommonStore().fetchPreparationCommonList({ code_common: [1] })
}
async function init() {
  const isCustomerSame =
    customerStore.getCustomer?.id_customer !=
    (props.prescriptionObj?.id_customer ??
      props.requestDetailPage?.id_customer ??
      props.id_customer)
  if (props.fromPD) {

    await Promise.all([
      prescriptionStore.fetchRequestByPrescription(
        props?.prescriptionObj?.id_prescription
      ),
      isCustomerSame ? executeTogether() : null,
      illnessHistoryStore.getLeftSideIllnessHistoryList.length == 0
        ? illnessHistoryStore.fetchPreparationIllnessHistorys({
            id_pet:
              props.prescriptionObj?.id_pet ?? props.requestDetailPage?.id_pet
          })
        : null
    ])
  } else {
    await Promise.all([
      prescriptionStore.fetchPrescriptionByRequest(
        props?.prescriptionObj?.id_request ??
          props?.requestDetailPage?.id_request,
        { flg_medicine: true }
      ),
      isCustomerSame ? executeTogether() : null,
      illnessHistoryStore.getLeftSideIllnessHistoryList.length == 0
        ? illnessHistoryStore.fetchPreparationIllnessHistorys({
            id_pet:
              props.prescriptionObj?.id_pet ?? props.requestDetailPage?.id_pet
          })
        : null
    ])
  }

  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    }))

  id_pet.value = props.id_pet
  const findPet = customerStore.getCustomer?.pets?.find(
    (pet: any) => pet.id_pet == id_pet.value
  )
  if (findPet) {
    selectedPet.value = `${findPet?.name_pet}:${findPet?.id_pet}`
  }
  prescriptionHeader.value =
    prescriptionStore.getPrescriptionListByRequest.find(
      (preObj: any) => preObj.id_pet == id_pet.value
    )

  petBioObj.value = petBioInfoStore.getPetBios.find(
    (obj: any) =>
      obj.id_pet_bio_info == prescriptionHeader.value.id_pet_bio_info
  )
  if (
    prescriptionHeader.value.flg_delivered ||
    prescriptionHeader.value.flg_cancel
  ) {
    disableHeaderUpdate.value = true
  }

  if (isTaskModal.value) {
    taskStore.fetchTaskByRequest(prescriptionHeader.value.id_request)
    isTaskModal.value = false
  }
}
const petName = (value: string | number) =>
  getPetFirstName(getCustomer.value?.pets?.find((v) => v.id_pet === value))

const employeeName = (value) =>
  employeeStore.getAllEmployees.find((v) => v.value == value)?.label


const getEmployee = (id_employee) => {
  return employeeStore.getEmployees.find(
    (v) => v.id_employee == id_employee
  )
}


const addPrescriptionDetail = async () => {
  const tempPet = customerStore.getPet
  
  await mtUtils.popup(updPrescriptionDetailByPet, {
    id_pet: props.id_pet,
    requestObj: props.requestDetailPage
  }, true)
  customerStore.selectPet(tempPet.id_pet)
  await init()
}
const updateFlgAsk = async () => {
  const payload = {
    ...prescriptionHeader.value
  }

  if (prescriptionHeader.value.flg_prescription_order == false) {
    if (prescriptionHeader.value.flg_delivered == true) {
      payload.flg_delivered = false
      prescriptionHeader.value.flg_delivered = false
      payload.flg_all_prepared = false
      prescriptionHeader.value.flg_all_prepared = false
      payload.flg_prescription_order = false
      payload.datetime_delivered = null
      prescriptionHeader.value.datetime_delivered = null
      payload.id_employee_delivered = null
      prescriptionHeader.value.id_employee_delivered = null
    } else if (prescriptionHeader.value.flg_all_prepared == true) {
      payload.flg_all_prepared = false
      prescriptionHeader.value.flg_all_prepared = false
      payload.flg_prescription_order = false
    } else {
      payload.flg_prescription_order = false
    }
  } else {
    payload.flg_prescription_order = true
  }
  await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `prescription/${prescriptionHeader.value.id_prescription}`,
    {
      ...payload
    }
  )

  await init()
}
const updateFlgPrepared = async () => {
  const payload = {
    ...prescriptionHeader.value
  }

  if (prescriptionHeader.value.flg_all_prepared == false) {
    if (prescriptionHeader.value.flg_delivered == true) {
      payload.flg_delivered = false
      prescriptionHeader.value.flg_delivered = false
      payload.flg_all_prepared = false
      prescriptionHeader.value.flg_all_prepared = false
      payload.datetime_delivered = null
      prescriptionHeader.value.datetime_delivered = null
      payload.id_employee_delivered = null
      prescriptionHeader.value.id_employee_delivered = null
    } else {
      payload.flg_all_prepared = false
    }
  } else {
    payload.flg_all_prepared = true
  }
  await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `prescription/${prescriptionHeader.value.id_prescription}`,
    {
      ...payload
    }
  )

  await init()
}
const updateFlgComplete = async () => {
  const payload = {
    ...prescriptionHeader.value
  }
  if (prescriptionHeader.value.flg_delivered == false) {
    payload.flg_delivered = false
    payload.datetime_delivered = null
    payload.id_employee_delivered = null
  } else {
    payload.flg_delivered = true
    payload.datetime_delivered = getDateTimeNow()
    payload.id_employee_delivered = Number(localStorage.getItem('id_employee'))
  }
  await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `prescription/${prescriptionHeader.value.id_prescription}`,
    {
      ...payload
    }
  )

  await init()
}
const openPetDetail = async () => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: prescriptionHeader.value.id_customer,
    id_pet: prescriptionHeader.value.id_pet
  })
}
const openRequestDetail = () => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: prescriptionHeader.value.id_request }
  })
  window.open(route.href, '_blank')
}
const openCustomerDetail = () => {
  const route = router.resolve({
    name: 'SearchCustomerList',
    query: { id: prescriptionHeader.value?.id_customer }
  })
  window.open(route.href, '_blank')
}

const openAddTitleModal = async (mode: any = null) => {

  if (mode == 'merge') {
    if (prescriptionHeader.value.prescription_detail_list.filter((v) => v.checked) &&
      prescriptionHeader.value.prescription_detail_list.filter((v) => v.checked).length < 2) {
      await mtUtils.alert('合成する医薬品を2つ以上選択してください。', '確認')
      return
    }
  }


  if (mode == 'merge') {
    await mtUtils.smallPopup(UpdateGroupTitle2Modal, {
      prescription: prescriptionHeader.value,
      mode: mode
    })
    init()
    return
  }
  await mtUtils.smallPopup(UpdateGroupTitleModal, {
    prescription: prescriptionHeader.value,
    mode: mode
  })

  // prescriptionHeader.value.prescription_detail_list.map(
  //   (pd: any, index) => {
  //     return {
  //       id_prescription_detail: pd.id_prescription_detail,
  //       row: pd.row + 1
  //     }
  //   }
  // )
  
  await submitSortMode(false, false)
  await init()
}

const updPrescriptionDetailGroup = async (prescriptionDetail: any) => {

  if (prescriptionDetail.type_detail == 5) {
    await mtUtils.smallPopup(UpdateGroupTitle2Modal, {
      prescriptionDetail: prescriptionDetail,
      mode: 'merge'
    })
    init()
    return
  }
  
  await mtUtils.smallPopup(UpdateGroupTitleModal, {
    prescriptionDetail: prescriptionDetail
  })
  init()
}

const getISU = (value, list) => {
  return list?.find((is: any) => is.id_item_service_unit === value)
}

const disableHeaderUpdate = ref(false)
const openMenu = async () => {
  let menuOptions = [
    {
      title: 'URLコピー ',
      name: 'copy_url',
      isChanged: false,
      clickable: true
    },
    {
      title: 'リクエスト検索',
      name: 'open_request_page',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'スレッド作成 ',
      name: 'create_thread',
      isChanged: false,
      clickable: true
    },
    {
      title: 'スレッド検索 ',
      name: 'search_thread',
      isChanged: false,
      clickable: true
    },
    {
      title: '編集',
      name: 'edit',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '準備完了済',
      name: 'flg_all_prepared',
      isChanged: false,
      attr: {
        class: prescriptionHeader.value.flg_delivered
          ? 'disabled'
          : prescriptionHeader.value.flg_cancel
          ? 'disabled'
          : '',
        clickable: !(
          prescriptionHeader.value.flg_delivered ||
          prescriptionHeader.value.flg_cancel
        )
      },
      showIcon: prescriptionHeader.value.flg_all_prepared
    },
    {
      title: '受け渡し済み',
      name: 'flg_delivered',
      isChanged: false,
      attr: {
        class: prescriptionHeader.value.flg_delivered
          ? 'disabled'
          : prescriptionHeader.value.flg_cancel
          ? 'disabled'
          : '',
        clickable: !(
          prescriptionHeader.value.flg_delivered ||
          prescriptionHeader.value.flg_cancel
        )
      },
      showIcon: prescriptionHeader.value.flg_delivered
    },
    {
      title: 'キャンセル',
      name: 'cancel',
      isChanged: false,
      attr: {
        class: prescriptionHeader.value.flg_delivered
          ? 'disabled'
          : prescriptionHeader.value.flg_cancel
          ? 'disabled'
          : '',
        clickable: !(
          prescriptionHeader.value.flg_delivered ||
          prescriptionHeader.value.flg_cancel
        )
      }
    },
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: prescriptionHeader.value.flg_delivered ? 'disabled' : '',
        clickable: !prescriptionHeader.value.flg_delivered
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'open_request_page') {
      const route = router.resolve({
        name: 'RequestDetail',
        params: { id: prescriptionHeader.value.id_request }
      })
      window.open(route.href, '_blank')
    } else if (selectedOption.name == 'copy_url') {
      try {
        let url = window.location.href
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました。')
      }
    } else if (selectedOption.name == 'create_thread') {
      const threadData = {
        memo_goal: '',
        id_pet: prescriptionHeader.value.id_pet,
        id_customer: prescriptionHeader.value.id_customer,
        linkCategory: 3,
        id_link1: prescriptionHeader.value.id_prescription,
        number_link1: prescriptionHeader.value.number_prescription,
        id_employee_answer: prescriptionHeader.value.id_employee_staff
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
        id_customer: prescriptionHeader.value?.id_customer,
        id_pet: prescriptionHeader.value.id_pet,
        id_employee_answer: prescriptionHeader.value.id_employee_staff,
        number_prescription: prescriptionHeader.value.number_prescription
      }
      localStorage.setItem('pageAction', 'searchThread')
      localStorage.setItem('searchThread', JSON.stringify(searchThreadData))
      const route = router.resolve({
        name: 'MessageClinic'
      })
      window.open(route.href, '_blank')
    } else if (selectedOption.name == 'edit') {
      await mtUtils.popup(UpdPrescriptionHeader, {
        requestObj: props.requestDetailPage,
        prescriptionObj: prescriptionHeader.value
      }, true)
      await init()
    } else if (selectedOption.name == 'delete') {
      if (prescriptionHeader.value.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      const confirmation = await mtUtils.confirm(
        aahMessages.delete_ask,
        aahMessages.delete
      )
      if (confirmation) {
        const resDelete = await prescriptionStore.destroyPrescription(
          prescriptionHeader.value.id_request,
          prescriptionHeader.value.id_prescription
        )
        if (resDelete) {
          event_bus.emit('reloadLeft')
          emits('close')
          await mtUtils.autoCloseAlert(aahMessages.success)
        }
      }
    }
    if (selectedOption.name == 'cancel') {
      if (prescriptionHeader.value.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils.smallPopup(GeneralCancellationModel, {
        url: `prescription/${prescriptionHeader.value.id_prescription}`
      })
      closeModal()
    }
    if (selectedOption.name == 'flg_all_prepared') {
      await mtUtils
        .callApi(
          selectOptions.reqMethod.PUT,
          `prescription/${prescriptionHeader.value.id_prescription}`,
          {
            flg_all_prepared: true
          }
        )
        .then(async () => {
          await mtUtils.autoCloseAlert(aahMessages.success)
          await init()
        })
    }

    if (selectedOption.name == 'flg_delivered') {
      let id_employee_delivered = JSON.parse(
        localStorage.getItem('id_employee')
      )
      const confirmation = await mtUtils.confirm(
        'オーナーに処方箋を渡しましたか？',
        '確認',
        'はい',
        null,
        null,
        null,
        {
          show: true,
          callBackFun: (value) => {
            id_employee_delivered = value
          }
        }
      )

      if (confirmation) {
        await mtUtils
          .callApi(
            selectOptions.reqMethod.PUT,
            `prescription/${prescriptionHeader.value.id_prescription}`,
            {
              flg_delivered: true,
              id_employee_delivered: id_employee_delivered,
              datetime_delivered: getDateTimeNow()
            }
          )
          .then(async () => {
            await mtUtils.autoCloseAlert(aahMessages.success)
            await init()
          })
      }
    }
  }
}

function quantityDose(total_days_dose, id_dosage_frequency) {
  return roundZeroAfterPoint(total_days_dose) * typeDoseQuantityUI(id_dosage_frequency).quantity_dose ?? 1
}
const updateEmployeeReview = async (value, column: string) => {
  const payload = {
    ...prescriptionHeader.value
  }

  if (payload[column]) payload[column] = value

  await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `prescription/${prescriptionHeader.value.id_prescription}`,
    {
      ...payload
    }
  )

  await init()
}
const changeFlgPrepared = async (prescription_detail: PrescriptionDetailType) => {
  // flg_prepared_raw.value = !flg_prepared_raw.value
  prescription_detail.flg_prepared = !prescription_detail.flg_prepared
  const payload = { flg_prepared: prescription_detail.flg_prepared }
  let x = await prescriptionStore.updateSpecificColumnPrescriptionDetail(prescription_detail.id_prescription_detail, payload)
  await init()
  prescriptionHeader.value.prescription_detail_list.forEach((item:any)=>{
    if(item.id_prescription_detail == x.id_prescription_detail){
      item.flg_prepared = x.flg_prepared
    }
  })
}

const getPetIllnessHistory = computed(() => {
  if (!prescriptionHeader.value.id_pet_illness_history) {
    return
  }

  let formattedIllnesses =
    prescriptionHeader?.value?.id_pet_illness_history.map(
      (idPetHisString: any) => {
        let petIllnessHistory: any
        if (illnessHistoryStore.getAllIllnessHistorys.length > 0) {
          petIllnessHistory = illnessHistoryStore.getAllIllnessHistorys.find(
            (iH: any) => {
              return iH.value == idPetHisString
            }
          )
        } else if (
          illnessHistoryStore.getLeftSideIllnessHistoryList.length > 0
        ) {
          petIllnessHistory =
            illnessHistoryStore.getLeftSideIllnessHistoryList.find(
              (iH: any) => {
                return iH.id_pet_illness_history == idPetHisString
              }
            )
        }

        if (petIllnessHistory) {
          return `${
            petIllnessHistory.number_pet_illness_history
              ? petIllnessHistory.number_pet_illness_history
              : ''
          } ${
            petIllnessHistory.name_disease ??
            petIllnessHistory.name_disease_free ??
            ''
          }`
        } else {
          return ''
        }
      }
    )
  return formattedIllnesses?.join(', ')
})
const createTaskModal = async () => {
  isTaskModal.value = false
  taskStore.selectTask(null)

  const copiedTaskData = true
  const data = {
    id_customer: prescriptionHeader.value.id_customer,
    id_pet: prescriptionHeader.value.id_pet,
    type_link1: 3,
    number_link1: prescriptionHeader.value?.number_prescription,
    id_employee_staff: prescriptionHeader.value.id_employee_staff,
    memo_task_todo: prescriptionHeader.value?.memo_prescription,
    id_employee_request: JSON.parse(localStorage.getItem('id_employee')),
    id_category1: JSON.parse(<string>localStorage.getItem('clinic'))
      ?.id_category_task_prescription
  }
  const tempTask: any = taskStore.getTaskRequests.find(
    (taskObj: any) =>
      taskObj.id_link1 == prescriptionHeader.value.id_prescription
  )
  if (tempTask) {
    taskStore.selectTask(tempTask.id_task)
    await mtUtils.mediumPopup(ViewTaskDetailModal, {
      data: tempTask,
      id_request: props?.requestDetailPage?.id_request
    })
  } else {
    await mtUtils.popup(UpdateTaskModal, { data, copiedTaskData }, true)
    isTaskModal.value = true
  }
  await init()
}
const updPrescriptionDetailModal = async (prescriptionDetail: any) => {
  const flgPlusItem = prescriptionDetail?.type_detail == 2 || prescriptionDetail?.type_detail == 3
  
  if (flgPlusItem) {
    await mtUtils.smallPopup(UpdPrescriptionDetailModal, {
      prescriptionObj: prescriptionHeader.value,
      prescriptionDetail: prescriptionDetail
    })
    init()
    return
  }

  await mtUtils.mediumPopup(UpdPrescriptionDetailModal, {
    prescriptionObj: prescriptionHeader.value,
    prescriptionDetail: prescriptionDetail
  })
  init()
}


const openUpdPrescriptionHeaderModel = () => {
  mtUtils.popup(UpdPrescriptionHeader, {
    requestObj: props.requestDetailPage,
    prescriptionObj: prescriptionHeader.value
  }, true)
}

const submitSortMode = async (showAlert = true, isUpdateList = true) => {
 
    const updateList = prescriptionHeader.value.prescription_detail_list.map(
    (pd: any, index) => {
      return {
        id_prescription_detail: pd.id_prescription_detail,
        row: isUpdateList ? pd.row : pd.row + 1
      }
    }
  )
  
  console.log("updateList", updateList);
  
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/UpdPrescriptionDetailNo',
    {
      prescription_detail_list: updateList
    },
    true
  )

  if (response && showAlert) {
    await mtUtils.autoCloseAlert('順序を更新しました。')
    sortMode.value = false
    init()
  }
}

function individualRowMove(rowIndex: number, direction: 'UP' | 'DOWN') {
  if (
    (direction === 'UP' && rowIndex === 0) ||
    (direction === 'DOWN' &&
      rowIndex === prescriptionHeader.value.prescription_detail_list.length - 1)
  ) {
    return
  }
  let nextIndex = direction === 'UP' ? rowIndex - 1 : rowIndex + 1
  let current = prescriptionHeader.value.prescription_detail_list.splice(
    rowIndex,
    1
  )
  prescriptionHeader.value.prescription_detail_list.splice(
    nextIndex,
    0,
    ...current
  )
}

function moveRecordUp(records, recordId) {
  let record = records.find(r => r.id_prescription_detail === recordId)
  if (!record) return

  // Get siblings (records with the same parent)
  let siblings = records.filter(
    r => r.id_prescription_detail_ref === record.id_prescription_detail_ref
  )
  siblings.sort((a, b) => a.row - b.row)

  let index = siblings.findIndex(r => r.id_prescription_detail === recordId)
  if (index > 0) {
    let prevSibling = siblings[index - 1];

    // Swap 'row' values
    [record.row, prevSibling.row] = [prevSibling.row, record.row]

    // Re-sort the records based on new 'row' values
    records.sort((a, b) => a.row - b.row)

    // Normalize rows to ensure sequential numbering
    normalizeRows(records)
  }
}

function moveRecordDown(records, recordId) {
  let record = records.find(r => r.id_prescription_detail === recordId)
  if (!record) return

  // Get siblings (records with the same parent)
  let siblings = records.filter(
    r => r.id_prescription_detail_ref === record.id_prescription_detail_ref
  )
  siblings.sort((a, b) => a.row - b.row)

  let index = siblings.findIndex(r => r.id_prescription_detail === recordId)
  if (index < siblings.length - 1) {
    let nextSibling = siblings[index + 1];

    // Swap 'row' values
    [record.row, nextSibling.row] = [nextSibling.row, record.row]

    // Re-sort the records based on new 'row' values
    records.sort((a, b) => a.row - b.row)

    // Normalize rows to ensure sequential numbering
    normalizeRows(records)
  }
}
function initializeRowsIfNeeded(records) {
  // Check if any record has a null 'row' value
  const needsInitialization = records.some(record => record.row == null)

  if (needsInitialization) {
    initializeRows(records)
  }
}

function initializeRows(records) {
  // Initialize a counter for the row numbers
  let rowNumber = 1

  // Iterate over the records in their current order
  records.forEach(record => {
    if (record.row == null) {
      // Assign the current row number
      record.row = rowNumber
    }

    // Increment the row number
    rowNumber++

    // If the record is a group title, handle its child items
    if (record.id_prescription_detail_ref === null && record.flg_group_title) {
      // Get child items of the group
      let children = records.filter(
        r => r.id_prescription_detail_ref === record.id_prescription_detail
      )

      // Assign row numbers to child items if necessary
      children.forEach(child => {
        if (child.row == null) {
          child.row = rowNumber
        }
        rowNumber++
      })
    }
  })
}

function moveGroupDown(records, parentId) {
  // Ensure records are sorted by 'row' values
  records.sort((a, b) => a.row - b.row)

  // Find the index of the parentRecord in the records array
  let parentIndex = records.findIndex(
    r => r.id_prescription_detail === parentId && r.id_prescription_detail_ref === null
  )
  if (parentIndex === -1) return // Parent record not found

  // Determine the start and end indices of the current group
  let groupStartIndex = parentIndex
  let groupEndIndex = parentIndex

  for (let i = parentIndex + 1; i < records.length; i++) {
    if (records[i].id_prescription_detail_ref === parentId) {
      groupEndIndex = i
    } else {
      break
    }
  }

  // Find the next group's start index
  let nextGroupStartIndex = groupEndIndex + 1
  if (nextGroupStartIndex >= records.length) return // No next group to move down

  // Determine the next group's end index
  let nextGroupParentId = records[nextGroupStartIndex].id_prescription_detail
  let nextGroupEndIndex = nextGroupStartIndex

  for (let i = nextGroupStartIndex + 1; i < records.length; i++) {
    if (records[i].id_prescription_detail_ref === nextGroupParentId) {
      nextGroupEndIndex = i
    } else {
      break
    }
  }

  // Calculate the size of the groups
  let currentGroupSize = groupEndIndex - groupStartIndex + 1
  let nextGroupSize = nextGroupEndIndex - nextGroupStartIndex + 1

  // Adjust the 'row' values
  // Increase 'row' values of current group by nextGroupSize
  for (let i = groupStartIndex; i <= groupEndIndex; i++) {
    records[i].row += nextGroupSize
  }

  // Decrease 'row' values of next group by currentGroupSize
  for (let i = nextGroupStartIndex; i <= nextGroupEndIndex; i++) {
    records[i].row -= currentGroupSize
  }

  // Re-sort the records based on new 'row' values
  records.sort((a, b) => a.row - b.row)

  // Normalize rows to ensure sequential numbering
  normalizeRows(records)
}

function moveGroupUp(records, parentId) {
  // Ensure records are sorted by 'row' values
  records.sort((a, b) => a.row - b.row)

  // Find the index of the parentRecord in the records array
  let parentIndex = records.findIndex(
    r => r.id_prescription_detail === parentId && r.id_prescription_detail_ref === null
  )
  if (parentIndex <= 0) return // Parent record not found or already at the top

  // Determine the start and end indices of the current group
  let groupStartIndex = parentIndex
  let groupEndIndex = parentIndex

  for (let i = parentIndex + 1; i < records.length; i++) {
    if (records[i].id_prescription_detail_ref === parentId) {
      groupEndIndex = i
    } else {
      break
    }
  }

  // Find the previous group's start index
  let prevGroupEndIndex = groupStartIndex - 1
  if (prevGroupEndIndex < 0) return // No previous group to move up

  let prevGroupParentId = records[prevGroupEndIndex].id_prescription_detail_ref === null
    ? records[prevGroupEndIndex].id_prescription_detail
    : records[prevGroupEndIndex].id_prescription_detail_ref

  let prevGroupStartIndex = prevGroupEndIndex
  for (let i = prevGroupEndIndex - 1; i >= 0; i--) {
    if (
      records[i].id_prescription_detail_ref === prevGroupParentId ||
      records[i].id_prescription_detail === prevGroupParentId
    ) {
      prevGroupStartIndex = i
    } else {
      break
    }
  }

  // Calculate the size of the groups
  let currentGroupSize = groupEndIndex - groupStartIndex + 1
  let prevGroupSize = prevGroupEndIndex - prevGroupStartIndex + 1

  // Adjust the 'row' values
  // Decrease 'row' values of current group by prevGroupSize
  for (let i = groupStartIndex; i <= groupEndIndex; i++) {
    records[i].row -= prevGroupSize
  }

  // Increase 'row' values of previous group by currentGroupSize
  for (let i = prevGroupStartIndex; i <= prevGroupEndIndex; i++) {
    records[i].row += currentGroupSize
  }

  // Re-sort the records based on new 'row' values
  records.sort((a, b) => a.row - b.row)

  // Normalize rows to ensure sequential numbering
  normalizeRows(records)
}

function normalizeRows(records) {
  // Sort all records by current 'row' values
  records.sort((a, b) => a.row - b.row)

  // Reassign 'row' values starting from 1
  records.forEach((record, index) => {
    record.row = index + 1
  })
}

const submit = () => {
  createTaskModal()
}

const openPdfPrecriptionSettingModal = () => {
  mtUtils.popup(UpdatePdfPrescriptionSetting, {
    prescription: {...prescriptionHeader.value}
  })
}

const countPD = computed(() => prescriptionHeader.value.prescription_detail_list.length)
const countCheckedPD = computed(() => prescriptionHeader.value.prescription_detail_list.filter((v) => v.flg_prepared).length)

const generatePdfPrescriptionPrepList = () => {
  PrescriptionDetailAssortData.value.length = 0
  for (
    let i = 0;
    i < prescriptionHeader.value.prescription_detail_list.length;
    i++
  ) {
    let prescriptionDetail =
      prescriptionHeader.value.prescription_detail_list[i]
    PrescriptionDetailAssortData.value.push(prescriptionDetail)
    if (
      prescriptionDetail.prescription_detail_assort_list &&
      prescriptionDetail.prescription_detail_assort_list.length &&
      prescriptionDetail.prescription_detail_assort_list.length > 0
    ) {
      prescriptionDetail.prescription_detail_assort_list.forEach(
        (assort: any) => {
          PrescriptionDetailAssortData.value.push({
            itemServiceUnitList:
              prescriptionDetail?.item_service?.item_service_unit_list,
            itemService: prescriptionDetail?.item_service,
            flgAssortRow: true,
            assortData: { ...assort },
            total_days_dose: prescriptionDetail.total_days_dose,
            unitName: prescriptionDetail.name_medicine_format,
            id_dosage_frequency: prescriptionDetail?.id_dosage_frequency
          })
        }
      )
    }
  }
  prescriptionPdfAttributes.render = true
}

const getNameDosageFormal = (value: number) =>
  doseStore.getDoses.find((dose: any) => dose.id_dosage_frequency == value)
    ?.name_dose_formal

const getQuantityUnit = (value: number) =>
  doseStore.getDoses.find((dose: any) => dose.id_dosage_frequency == value)
    ?.quantity_dose ?? 1

const closeModal = () => {
  emits('close')
  event_bus.emit('reloadLeft')
  event_bus.emit('reloadRight', true)
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}

onMounted(async () => {
  event_bus.on('prescription-updated', init)
  await init()
  if (doseStore.getDoses.length === 0) await doseStore.fetchDoses()

  // set page title
  const pageTitle = `${props?.prescriptionObj?.customer?.name_family}${props?.prescriptionObj?.pet?.name_pet}`
  if (props?.prescriptionObj?.customer?.name_family) {
    setPageTitle(`処方: ${pageTitle}`)
  }
})
</script>

<template>
  <q-form  @submit="submit">
    <MtModalHeader class="col-auto" @closeModal="closeModal">
      <q-toolbar-title
        class="text-grey-900 title2 bold prescription-title cursor-pointer"
        @click="
          prescriptionHeader.number_prescription
            ? copyText(prescriptionHeader.number_prescription)
            : null
        "
      >
        <q-icon
          name="check_circle"
          class="text-blue q-mr-xs"
          v-if="prescriptionHeader.flg_delivered"
        />
        処方箋 {{ prescriptionHeader.number_prescription }}
        <q-icon name="content_copy" class="text-blue q-ml-xs" />
      </q-toolbar-title>
      <MtInputForm
        type="text"
        v-model="selectedPet"
        label="ペットCD"
        class="col-2 q-mr-sm"
        readonly
      />
      <MtInputForm
        type="text"
        v-model="typeAnimalUI"
        label="動物種"
        readonly
        class="col-2 q-ml-sm"
      />
      <MtInputForm
        type="text"
        v-model="valWeightUI"
        label="体重"
        readonly
        class="col-1 q-ml-sm"
      />
      <q-btn unelevated round @click="openUpdPrescriptionHeaderModel">
        <q-icon size="15px" name="edit" />
      </q-btn>
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
      <q-card-section class="q-pa-lg content">
        <div v-if="id_pet" class="q-mb-lg">
          <div
            v-if="prescriptionHeader.flg_cancel"
            class="cancel-notification-box q-mb-md"
          >
            <div class="text-body1">
              <span class="text-darkred"
                ><strong>この処方箋はキャンセルされました。</strong></span
              >
            </div>
            <div class="q-my-xs">
              キャンセル日時：{{
                formatDateWithTime(prescriptionHeader.datetime_cancel)
              }}
              <span v-if="prescriptionHeader.memo_cancel"
                >理由： {{ prescriptionHeader.memo_cancel }}
              </span>
            </div>
          </div>
          <div class="flex items-center light-prescription-blue q-pa-sm">
            <div class="text-body1 q-ml-md">
              <span v-if="prescriptionHeader.flg_non_charge" class="text-darkred"
                ><strong>[会計対象外] </strong></span
              >
              {{ prescriptionHeader.number_prescription }}
              {{ prescriptionHeader.title_prescription }}
            </div>
            <q-space />
            <div v-if="prescriptionHeader.flg_delivered">
              <span class="font-10px">受け渡し 完了日時 </span>
              {{ formatDateTime(prescriptionHeader.datetime_delivered) }}
            </div>
            <q-btn
              class="q-ml-md"
              label="薬袋・説明書"
              outline
              @click="openPdfPrecriptionSettingModal"
            />
            <q-btn
              class="q-ml-md"
              label="準備リスト"
              outline
              @click="generatePdfPrescriptionPrepList"
            />
          </div>
          <div class="row q-mt-sm">
            <div class="col-6">
              <div
                v-if="prescriptionHeader.memo_prescription"
                class="row full-width text-grey-800"
              >
                <q-icon class="q-mr-xs" name="description" />
                {{ prescriptionHeader.memo_prescription }}
              </div>
              <div class="row q-mt-xs">
                <div class="col-auto flex items-center q-mr-md">
                  <small class="text-grey-600 q-mr-sm">オーナー/ペット</small>
                  <div class="cursor-pointer" @click="openCustomerDetail">
                    <span class="text-blue">{{ getCustomerName(customerStore.getCustomer) + ' 様' }}</span>
                    <q-icon
                      :color="
                        getCustomerLabelColor(
                          customerStore.getCustomer?.type_customer_color
                        )
                      "
                      class="q-ml-xs"
                      name="circle"
                      size="12px"
                    />
                  </div>
                </div>
                <div class="col-auto q-mr-md">
                  <div
                    class="text-blue cursor-pointer"
                    @click.stop="openPetDetail()"
                  >
                    {{ petName(id_pet) }}
                  </div>
                </div>
                <div class="col-auto">
                  <div class="q-mr-sm">
                    <small class="text-grey-600 q-mr-sm">処方医:</small>
                    {{ employeeName(prescriptionHeader.id_employee_doctor) }}
                  </div>
                </div>
              </div>
              <div class="row full-width q-mt-xs">
                <small class="col-auto flex">
                  <div class="text-blue cursor-pointer" @click="openRequestDetail">
                    {{ prescriptionHeader?.request.number_request }}
                    <span class="text-grey-500">{{
                      ' / ' + prescriptionHeader?.request.title_request
                    }}</span>
                  </div>
                </small>
              </div>
              <div v-if="prescriptionHeader.id_pet_illness_history">
                <small class="text-grey-600 q-mr-sm">対象診察：</small>
                {{ getPetIllnessHistory }}
              </div>
            </div>
            <div class="col-6">
              <div class="row q-col-gutter-sm q-mb-sm">
                <div class="col q-mr-lg">
                  <MtFormCheckBox
                    v-model:checked="prescriptionHeader.flg_prescription_order"
                    label="調剤依頼"
                    @update:checked="updateFlgAsk"
                  />
                </div>
                <div class="col q-mr-lg">
                  <MtFormCheckBox
                    v-model:checked="prescriptionHeader.flg_all_prepared"
                    label="準備完了"
                    @update:checked="updateFlgPrepared"
                  />
                </div>
                <div class="col">
                  <MtFormCheckBox
                    v-model:checked="prescriptionHeader.flg_delivered"
                    label="受け渡し済"
                    @update:checked="updateFlgComplete"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-xs bg-accent-100">
                <div class="col q-mr-sm">
                  <InputEmployeeOptGroup
                    ref="inputDoctor"
                    v-model:selected="prescriptionHeader.id_employee_review1"
                    clearable
                    label="確認者1"
                    show-select-default-employee
                    @update:model-value="updateEmployeeReview($event, 'id_employee_review1')"
                    @update:select-default-employee="()=>{prescriptionHeader.id_employee_review1 = defaultEmployee}"
                  />
                </div>
                <div class="col q-mr-sm">
                  <InputEmployeeOptGroup
                    ref="inputDoctor"
                    v-model:selected="prescriptionHeader.id_employee_review2"
                    clearable
                    label="確認者2"
                    show-select-default-employee
                    @update:model-value="updateEmployeeReview($event, 'id_employee_review2')"
                    @update:select-default-employee="()=>{prescriptionHeader.id_employee_review2 = defaultEmployee}"
                  />
                </div>
                <div class="col">
                  <InputEmployeeOptGroup
                    ref="inputDoctor"
                    v-model:selected="prescriptionHeader.id_employee_review3"
                    clearable
                    label="確認者3"
                    show-select-default-employee
                    @update:model-value="updateEmployeeReview($event, 'id_employee_review3')"
                    @update:select-default-employee="()=>{prescriptionHeader.id_employee_review3 = defaultEmployee}"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="flex">
            <div class="row justify-between items-center full-width q-my-sm">
  
              <div class="flex gap-2">
                <!-- <template v-if="prescriptionHeader.flg_delivered">
                  <p v-if="prescriptionHeader.flg_all_prepared" class="q-ma-none">
                    <q-icon class="text-positive" name="check_circle" />
                    準備完了済
                  </p>
                  <p v-if="prescriptionHeader.flg_delivered" class="q-ma-none">
                    <q-icon class="text-positive" name="check_circle" />
                    受け渡し済み
                  </p>
                </template> -->
              </div>
  
            </div>
          </div>
          <div class="flex items-center q-pa-sm">
            <div class="caption1 regular field-label-free-color bg-grey-200">
              <!--if the total PD is all checked ; meaning all flg-prepared = T, then change bg color into "bg-green-100"-->
              <q-icon name="check_circle" class="q-mx-sm" :class="countCheckedPD == countPD ? 'text-green bg-green-100' : 'text-grey-500'" />
              <!--Use 'text-green' : 'text-grey-500'-->
              <span class="q-mr-md" :class="countCheckedPD == countPD ? 'text-green' : 'text-grey-500'">{{ countCheckedPD }} / {{ countPD }}</span>
              <!--xx is number of checked PD, XX is total PD -->
            </div>
            <q-space></q-space>
            <div class="col-auto">
              <q-btn class="q-mr-md" @click="sortMode = !sortMode">
                <q-icon class="q-mr-sm" name="filter_list" size="20" />
                {{ sortMode ? '順序変更中' : '順序' }}
              </q-btn>
              <q-btn @click="openAddTitleModal">
                <q-icon class="q-mr-sm" name="add" size="20" />
                一包化
              </q-btn>
              <!-- <q-btn class="q-ml-sm" @click="()=> mergeMode = !mergeMode">
                <q-icon class="q-mr-sm" name="filter_list" size="20" />
                Merge Group
              </q-btn> -->
            </div>
          </div>
          <div
            v-for="(
              prescription_detail, index
            ) in prescriptionHeader.prescription_detail_list"
            :key="prescription_detail.id_prescription_detail"
            class="q-mt-md row items-center"
          >
            <div 
              @click.stop="changeFlgPrepared(prescription_detail)" 
              style="margin-right: 1rem;"
              class="cursor-pointer"
              :class="prescription_detail.flg_prepared ? 'text-green' : 'text-grey-300'"
            >
              <q-icon size="40px" name="check_circle" />
            </div>
            <div class="col">
              <template v-if="prescription_detail.type_detail == 2">
                <div
                  class="q-bl-md-tosca q-pa-md item_divier_prescription item_divier_prescription__compact"
                  @click="updPrescriptionDetailModal(prescription_detail)"
                >
                  <div>
                    {{ prescription_detail.name_prescription_display }} [{{ prescription_detail.name_prescription_display }}]
                  </div>
                  <div
                    v-if="prescription_detail?.prescription_detail_assort_list"
                    v-for="assort in prescription_detail?.prescription_detail_assort_list"
                    class="row"
                  >
                    <div class="col-3">
                      {{ getISU(assort.id_item_service_unit, prescription_detail?.item_service?.item_service_unit_list)?.name_service_item_unit }}
                    </div>
                    <div class="col-6 q-px-xl">
                      数量: {{ parseFloat(assort.val_dosage_decided) }}
                      合計金額：{{ parseFloat(assort.val_dosage_decided) * getISU(assort.id_item_service_unit, prescription_detail.item_service?.item_service_unit_list)?.unit_price }}円
                    </div>
                  </div>
                </div>
              </template>
              <div
                v-else-if="prescription_detail.flg_group_title != '1'"
                class="row q-bl-md-sky-blue q-pa-md item_divier_prescription justify-between"
                :class="(prescription_detail.id_prescription_detail_ref && 
                !(prescription_detail.type_detail == 2 || prescription_detail.type_detail == 3) ) ? 'q-ml-xl q-bl-md-lg-blue q-pa-md item_divier_prescription' : ''"
                @click="updPrescriptionDetailModal(prescription_detail)"
              >
                <div class="col-6">
                  <div class="items-start">
                    <div class="text-body1">
                      <!--Important alert section starts-->
                      <div
                        v-if="
                          prescription_detail.prescription_detail_assort_list
                            .length == 0 ||
                          !(
                            Number(prescription_detail.val_weight) ==
                              Number(prescriptionHeader.val_weight / 1000) ||
                            Number(prescription_detail.val_weight) ==
                              Number(prescriptionHeader.val_weight * 1000)
                          )
                        "
                        class="important-alert-prescription"
                      >
                        <div
                          v-if="
                            !(
                              Number(prescription_detail.val_weight) ==
                                Number(prescriptionHeader.val_weight / 1000) ||
                              Number(prescription_detail.val_weight) ==
                                Number(prescriptionHeader.val_weight * 1000)
                            )
                          "
                        >
                          <small
                            ><!--body weight failed-->
                            <q-icon class="q-mr-xs" name="notifications" />
                            明細の更新に失敗しました。体重データを確認してください。
                          </small>
                        </div>
                        <div>
                          <!--missing assorts-->
                          <small
                            v-if="
                              prescription_detail.prescription_detail_assort_list
                                .length == 0
                            "
                          >
                            <q-icon class="q-mr-xs" name="notifications" />
                            明細登録が未完了です。
                          </small>
                        </div>
                      </div>
                      <!--Important alert section ends-->
                      <div>
                        <span
                          v-if="prescription_detail?.flg_hospitalization_usage"
                          class="field-label-free-color bg-emerald-green text-dark-emerald-green"
                        >
                          院内
                        </span>
                        <strong>{{
                          prescription_detail.name_prescription_display
                        }}</strong>
                        <q-btn
                          class="text-grey-700 quiz-btn q-ml-sm"
                          flat
                          icon="quiz"
                          round
                          size="10px"
                          @click.stop="
                            prescriptionUtils.openItemServiceModal(
                              prescription_detail.id_item_service
                            )
                          "
                        />
                        <small class="text-grey-600 q-ml-md">
                        {{ prescription_detail.name_category1 }}
                        <q-icon name="arrow_right" />
                        {{ prescription_detail.name_category2 }}
                      </small>
                      </div>
  
                      <!--Sub alert per prescription detail-->
                      <div v-if="prescription_detail.flg_cancel">
                        <span class="text-darkred q-mt-xs">
                          <small
                            >※ キャンセル済（日時：{{
                              dateFormat(
                                prescription_detail.datetime_cancel,
                                'YYYY/MM/DD hh:mm'
                              )
                            }}）</small
                          >
                        </span>
                      </div>
                      <div v-if="prescription_detail.flg_risk_animal">
                        <span class="text-darkred q-mt-xs">
                          <small
                            >※
                            医薬品の想定対象外の動物種です。注意してください。</small
                          >
                        </span>
                      </div>
                      <div v-if="prescription_detail.flg_overdosing">
                        <span class="text-darkred q-mt-xs">
                          <small
                            >※ 規定量以上の投与です。注意してください。</small
                          >
                        </span>
                      </div>
                      <div v-if="prescription_detail.flg_non_charge">
                        <span class="text-darkred q-mt-xs"
                          ><small>※ 会計対象外</small></span
                        >
                      </div>
                      <!--Sub alert end-->
                    </div>
                  </div>
                  <div class="q-my-xs">
                    <small class="field-label-free-color-small bg-grey-200">服用期間</small>
                    <span>
                      {{ prescription_detail.date_start + ' ～ ' + prescription_detail.date_end ?? '' }}
                    </span>
                    <small class="field-label-free-color-small bg-grey-200 q-ml-md">頻度</small>
                    <span v-if="prescription_detail.total_days_dose">
                      {{
                        ' ' +
                        roundZeroAfterPoint(prescription_detail.total_days_dose) +
                        comTypeDose(
                          typeDoseQuantityUI(
                            prescription_detail.id_dosage_frequency
                          ).typeDoseUI
                        ) +
                        ' x 頻度 ' +
                        ' ' +
                        getNameDosageFormal(
                          prescription_detail.id_dosage_frequency
                        )
                      }}
                    </span>
                      <!--                  <span v-if="prescription_detail.total_days_dose" class="q-ml-md">-->
                      <!--                    {{ (Number(getQuantityUnit(prescription_detail.id_dosage_frequency)) * Number(prescription_detail.total_days_dose))-->
                      <!--                    }} dosage-->
                      <!--                  </span>-->
                  </div>
                  <div v-if="prescription_detail.memo_dose || prescription_detail.memo_alert" class="row q-mb-xs">
                    <div v-if="prescription_detail.memo_dose" class="col-6">
                      <small class="field-label-free-color-small bg-grey-200">服用メモ</small>
                      <small>{{ prescription_detail.memo_dose }}</small>
                    </div>
                    <div v-if="prescription_detail.memo_alert" class="col-6">
                      <small class="field-label-free-color-small bg-grey-200">注意</small>
                      <small>{{ prescription_detail.memo_alert }}</small>
                    </div>
                  </div>
                  <div v-if="prescription_detail.memo_clinic_prep" class="memo-clinic-prep-box q-mt-sm q-mr-md" >
                    <small class="text-weight-bold q-mr-xs">院内指示</small>
                    <span style="white-space: pre-wrap;">{{ prescription_detail.memo_clinic_prep }}</span>
                  </div>
                </div>
                <div class="col-6 flex">
                  <div class="p-o-box flex column">
                    <PrescriptionDetailBox
                      :prescription-detail="prescription_detail"
                    />
                    <div
                      v-if="
                        prescription_detail?.prescription_detail_assort_list
                          ?.length > 0
                      "
                      class="prescription-box q-px-md"
                    >
                      <PrescriptionDetailAssortPocket
                        v-for="(
                          prescriptionAssort, index
                        ) in prescription_detail?.prescription_detail_assort_list"
                        :key="prescriptionAssort.id_prescription_detail_assort"
                        :disable="disableHeaderUpdate"
                        :id-dosage-frequency="
                          prescription_detail?.id_dosage_frequency
                        "
                        :isEdit="false"
                        :itemServiceUnitList="
                          prescription_detail?.item_service?.item_service_unit_list
                        "
                        :prescription-assort="prescriptionAssort"
                        :prescriptionDetail="prescription_detail"
                        :total-days-dose="prescription_detail?.total_days_dose"
                        :unitName="prescription_detail.name_medicine_format"
                        class="assort-box"
                      />
                    </div>
                  </div>
                  <div v-if="sortMode" class="sort-box flex justify-center column">
                    <div class="group-align-btn">
                      <q-btn
                        v-if="sortMode"
                        class="cursor-pointer"
                        flat
                        icon="expand_less"
                        round
                        size="14px"
                        @click.stop="moveRecordUp(prescriptionHeader.prescription_detail_list, prescription_detail.id_prescription_detail)"
                      />
                    </div>
                    <div class="group-align-btn">
                      <q-btn
                        v-if="sortMode"
                        class="cursor-pointer"
                        flat
                        icon="keyboard_arrow_down"
                        round
                        size="14px"
                        @click.stop="moveRecordDown(prescriptionHeader.prescription_detail_list, prescription_detail.id_prescription_detail)"
                      />
                    </div>
                  </div>
                  <div v-if="!sortMode && mergeMode && !prescription_detail.id_prescription_detail_ref"
                      class="sort-box flex justify-center column items-center">
                    <div class="group-align-btn">
                      <MtFormCheckBox
                        v-model:checked="prescription_detail.checked"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div
                v-else
                class="prescription_group q-bl-md-sky-blue q-pa-md item_divier_prescription"
              >
                <div
                  class="row justify-between"
                  @click="updPrescriptionDetailGroup(prescription_detail)"
                >
                  <div :class="sortMode ? 'col-9' : 'col-9'" class=" flex items-center justify-between">
                    <div>
                      <strong>
                        <small v-if="sortMode" class="text-grey-600">グループ： </small>
                        {{ prescription_detail.name_prescription_display }}
                      </strong>
                    </div>
                    <div v-if="prescription_detail.type_detail == 5" class="row column">
                      <span v-if="prescription_detail?.id_dosage_frequency">服用頻度:
                        <strong class="q-pl-sm">
                          {{ doseStore?.getDoses?.find((dose: any) => dose.id_dosage_frequency == prescription_detail?.id_dosage_frequency)?.name_dose_short
                          }}
                          ( {{ getNameDosageFormal(prescription_detail.id_dosage_frequency) }} )
                        </strong>
                      </span>
                      <span v-if="prescription_detail.date_start">服用 開始日: <strong
                        class="q-pl-sm"> ({{ prescription_detail.date_start }})</strong></span>
                    </div>
                    <div v-if="prescription_detail.type_detail == 5" class="row column">
                      <div>
                        <span v-if="prescription_detail.total_days_dose">
                          服用回数:<strong>{{ roundZeroAfterPoint(prescription_detail.total_days_dose) }}</strong>
                        </span>
                        <span v-if="prescription_detail.total_days_dose" class="q-ml-lg">
                          総服用回数: <strong>{{ quantityDose(prescription_detail.total_days_dose, prescription_detail.id_dosage_frequency)
                          }} 回分 </strong>
                        </span>
                      </div>
                      <span>処方時の薬剤形状: <strong>{{ prescription_detail.name_medicine_format }}</strong></span>
                      <span v-if="prescription_detail.id_employee_staff"> 記録者名: <strong>{{
                          getEmployee(prescription_detail.id_employee_staff)
                            ?.name_display }}</strong> </span>
                    </div>
  
                  </div>
  
                  <div class="col-auto flex justify-center">
                    <div class="group-align-btn">
                      <q-btn
                        v-if="sortMode"
                        class="text-blue cursor-pointer q-mr-sm"
                        flat
                        icon="expand_less"
                        round
                        size="18px"
                        @click.stop="()=>{
                          moveGroupUp(prescriptionHeader.prescription_detail_list, prescription_detail.id_prescription_detail)
                        }"
                      />
                    </div>
                    <div class="group-align-btn">
                      <q-btn
                        v-if="sortMode"
                        class="text-blue cursor-pointer"
                        flat
                        icon="keyboard_arrow_down"
                        round
                        size="18px"
                        @click.stop="()=>{
                          moveGroupDown(prescriptionHeader.prescription_detail_list, prescription_detail.id_prescription_detail)
                        }"
                      />
                    </div>
                    <div class="fake-group-align"></div>
                  </div>
                </div>
              </div>
  
              <template v-if="prescription_detail.effort_item">
                <div
                  class="q-ml-xl q-bl-md-lg-blue q-pa-md item_divier_prescription item_divier_prescription__compact"
                  @click="updPrescriptionDetailModal(prescription_detail.effort_item)"
                >
                  <div>
                    {{ prescription_detail.effort_item.name_prescription_display }} [{{ prescription_detail.name_prescription_display }}]
                  </div>
                  <div class="row">
                    <div
                      v-if="prescription_detail.effort_item?.prescription_detail_assort_list"
                      v-for="assort in prescription_detail.effort_item?.prescription_detail_assort_list"
                      class="col-6"
                    >
                      <div class="flex justify-between q-mr-md">
                        <div>
                          {{ getISU(assort.id_item_service_unit, prescription_detail.effort_item?.item_service?.item_service_unit_list)?.name_service_item_unit }}
                        </div>
                        <div>
                          数量: {{ parseFloat(assort.val_dosage_decided) }}
                          合計金額：{{ parseFloat(assort.val_dosage_decided) * getISU(assort.id_item_service_unit, prescription_detail.effort_item?.item_service?.item_service_unit_list)?.unit_price }}円
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </q-card-section>
    <q-card-section class="q-bt bg-white col-auto">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <template v-if="sortMode">
          <q-btn
            class="q-ml-md"
            color="primary"
            unelevated
            @click="submitSortMode"
          >
            変更を反映
          </q-btn>
        </template>
        <template v-else>
          <q-btn
            type="submit"
            unelevated
            color="primary"
            class="q-ml-md"
            :disable="disableHeaderUpdate"
          >
            <span v-if="!prescriptionHeader?.flg_task_created"
              >タスクにする</span
            >
            <span v-else>タスク確認</span>
          </q-btn>
        </template>
      </div>
    </q-card-section>
    <q-btn
      round
      color="black"
      class="add-btn"
      @click="addPrescriptionDetail()"
      v-if="!disableHeaderUpdate"
      ><q-icon name="add"
    /></q-btn>
    <q-btn
      v-if="!disableHeaderUpdate"
      class="merge-btn"
      color="black"
      round
      @click="openAddTitleModal('merge')"
    >
      <q-icon name="group_work" />
    </q-btn>
    <GetPdfPrescriptionPrepList
      v-if="prescriptionPdfAttributes.render"
      :prescriptionHeader="prescriptionHeader"
      :resultList="PrescriptionDetailAssortData"
      :getCustomer="customerStore.getCustomer"
      :getPet="customerStore.getCustomer?.pets.find((pet: any) => pet.id_pet == prescriptionHeader.id_pet)"
      :employeeName="employeeName"
      :prescriptionPdfAttributes="prescriptionPdfAttributes"
      :getNameDosageFormal="getNameDosageFormal"
    />
  </q-form>
</template>

<style lang="scss" scoped>
.modal-header {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 0;
  background-color: $white;
}

.modal-footer {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background-color: $white;
  border-top: 1px solid #e0e0e0;
}
.item_divier_prescription {
  cursor: pointer;
  &:hover {
    background-color: rgba(236, 248, 255, 0.7);
  }
  &:active {
    background-color: rgba(236, 248, 255, 0.8);
  }
  &:focus {
    background-color: rgba(236, 248, 255, 0.9);
  }
  border-bottom: 1px dotted rgb(227 227 227);
  padding: 8px 10px 8px !important;
  min-height: 101px;
  &__compact {
    min-height: unset;
  }
}
.font-10px {
  font-size: 10px;
}
.add-btn {
  position: absolute !important;
  bottom: 81px;
  right: 20px;
}

.merge-btn {
  position: absolute !important;
  bottom: 81px;
  right: 80px;
}
::v-deep(.q-select.disable-color) {
  background-color: white;
}
.prescription-title {
  display: flex;
  align-content: center;
  justify-items: center;
  align-items: center;
}

.group-align-btn {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
}

.fake-group-align {
  height: 40px;
  width: 10px;
}

.prescription_group {
  min-height: 20px;
  background-color: rgba(236, 248, 255, 0.7);
}

.p-o-box {
  width: 90%;
}

.prescription-box {
  border-radius: 5px;
  background-color: #fafafa;
  border: 2px solid #d9d9d9;
}

.sort-box {
  width: 10%;
}
.memo-clinic-prep-box {
  background-color: rgb(182, 246, 255);
  border-radius: 5px;
  padding: 4px 7px; 
  color: #00364b;

}

</style>
