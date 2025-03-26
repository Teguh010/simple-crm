<script lang="ts" setup>
import { computed, onMounted, ref, withDefaults } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import {
  copyText,
  formatDateWithTime,
  getCustomerLabelColor,
  getCustomerName,
  getDateTimeNow,
  getPetFirstName,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import usePetBioStore from '@/stores/pet-bios'
import useCategoryStore from '@/stores/categories'
import OptionModal from '@/components/OptionModal.vue'
import { useRouter } from 'vue-router'
import aahMessages from '@/utils/aahMessages'
import GeneralCancellationModel from '@/components/GeneralCancellationModel.vue'
import UpdateTaskModal from '@/pages/task/UpdateTaskModal.vue'
import useTask from '@/stores/task'
import useEmployeeStore from '@/stores/employees'
import useIllnessHistoryStore from '@/stores/illness-history'
import MtInputForm from '@/components/form/MtInputForm.vue'
import ViewTaskDetailModal from '@/pages/task/ViewTaskDetailModal.vue'
import selectOptions from '@/utils/selectOptions'
import UpdatePdfPrescriptionSetting from '@/pages/request/prescription/UpdatePdfPrescriptionSetting.vue'
import useCommonStore from '@/stores/common'
import GetPdfPrescriptionPrepList from '@/pages/request/prescription/GetPdfPrescriptionPrepList.vue'
import UpdateMessageThreadModal from '@/pages/message/UpdateMessageThreadModal.vue'
import useMessageStore from '@/stores/message-clinic'
import { RequestDetailPageType } from '@/types/types'
import { event_bus } from '@/utils/eventBus'
import { setPageTitle } from '@/utils/pageTitleHelper'
import ViewPetDetailModal from '@/pages/master/customerPet/ViewPetDetailModal.vue'
import useInjectStore from '@/stores/inject'
import UpdInjectHeaderModal from '@/pages/request/inject/UpdInjectHeaderModal.vue'
import UpdInjectDetailByPet from '@/pages/request/inject/UpdInjectDetailByPet.vue'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import UpdateInjectHeaderDetailModal from './UpdateInjectHeaderDetailModal.vue'

const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const employeeStore = useEmployeeStore()
const injectStore = useInjectStore()
const illnessHistoryStore = useIllnessHistoryStore()
const { getCustomer } = storeToRefs(customerStore)
const petBioInfoStore = usePetBioStore()
const messageStore = useMessageStore()
const taskStore = useTask()
const router = useRouter()

const props = withDefaults(
  defineProps<{
    requestDetailPage: RequestDetailPageType
    id_pet: string
    id_inject: string
    InjectObj: any
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

const selectedPet = ref('')

const sortMode = ref(false)
const id_pet = ref(null)
const id_inject = ref(null)

const injectHeader = ref({
  title_prescription: null,
  memo_prescription: '',
  prescription_detail_list: <any>[],
  id_pet_bio_info: null,
  number_prescription: '',
  request: null,
  id_request: null,
  id_inject: null,
  id_customer: null,
  id_pet: null,
  id_employee_staff: null,
  flg_cancel: null,
  datetime_cancel: null,
  memo_cancel: null,
  id_employee_doctor: null,
  flg_delivered: null,
  id_pet_illness_history: '',
  val_weight: null,
  flg_task_created: null,
  rabies: {}
})

const isTaskModal = ref(false)
const petBioObj = ref(<any>null)

const commonTypeAnimalOptionList: any = ref([])

const valWeightUI = computed(() => {
  return `${(injectHeader?.value?.val_weight / 1000).toFixed(2)} Kg`
})
const typeAnimalUI = computed(() => {
  if (
    customerStore?.getCustomer?.pets?.find(
      (petObj: any) => petObj.id_pet == injectHeader?.value?.id_pet
    )?.id_cm_animal
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == injectHeader?.value?.id_pet
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
    props?.InjectObj?.id_customer ??
      props?.requestDetailPage?.id_customer ??
      props.id_customer
  )
  illnessHistoryStore.fetchPreparationIllnessHistorys({
    id_pet: props.InjectObj?.id_pet ?? props.requestDetailPage?.id_pet
  })
  useCommonStore().fetchPreparationCommonList({ code_common: [1] })
}

async function init() {
  const isCustomerSame =
    customerStore.getCustomer?.id_customer !=
    (props.injectObj?.id_customer ??
      props.requestDetailPage?.id_customer ??
      props.id_customer)

  if (props.fromPD) {
    await Promise.all([
      injectStore.fetchRequestByInject(props?.injectObj?.id_inject),
      isCustomerSame ? executeTogether() : null
    ])
  } else {
    await Promise.all([
      injectStore.fetchInjectByRequest(
        props?.InjectObj?.id_request ?? props?.requestDetailPage?.id_request
      ),
      isCustomerSame ? executeTogether() : null
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

  id_inject.value = props.InjectObj.id_inject

  injectHeader.value =
    injectStore.getInjectListByRequest.find(
      (preObj: any) =>
        preObj.id_pet == id_pet.value && preObj.id_inject == id_inject.value
    ) ?? props.InjectObj

  petBioObj.value = petBioInfoStore.getPetBios.find(
    (obj: any) => obj.id_pet_bio_info == injectHeader.value.id_pet_bio_info
  )

  if (injectHeader.value.flg_completed) {
    disableHeaderUpdate.value = true
  }

  if (isTaskModal.value) {
    taskStore.fetchTaskByRequest(injectHeader.value.id_request)
    isTaskModal.value = false
  }
}

const petName = (value: string | number) =>
  getPetFirstName(getCustomer.value?.pets?.find((v) => v.id_pet === value))

const categoryName = (value: any) =>
  categoryStore.getAllCategories.find((v) => v.value === value)?.label

const employeeName = (value) =>
  employeeStore.getAllEmployees.find((v) => v.value === value)?.label

const addPrescriptionDetail = async () => {
  console.log(injectHeader.value)
  await mtUtils.popup(UpdInjectDetailByPet, {
    id_pet: props.id_pet,
    injectObj: injectHeader.value,
    requestObj: props.requestDetailPage
  }, true)
  await init()
}
const openPetDetail = async () => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: injectHeader.value.id_customer,
    id_pet: injectHeader.value.id_pet
  })
}
const openRequestDetail = () => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: injectHeader.value.id_request }
  })
  window.open(route.href, '_blank')
}
const openCustomerDetail = () => {
  const route = router.resolve({
    name: 'SearchCustomerList',
    query: { id: injectHeader.value?.id_customer }
  })
  window.open(route.href, '_blank')
}

const updateFlgComplete = async (value) => {
  if (!value) return

  const payload = {
    ...injectHeader.value
  }

  payload.flg_completed = true

  await injectStore.updInjectObj(
    injectHeader.value.id_request,
    injectHeader.value.id_inject,
    payload
  )

  await init()
}

const updPrescriptionDetailGroup = async (prescriptionDetail: any) => {
  await mtUtils.smallPopup(UpdateGroupTitleModal, {
    prescriptionDetail: prescriptionDetail
  })
  init()
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
      title: '編集',
      name: 'edit',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: injectHeader.value.flg_delivered ? 'disabled' : '',
        clickable: !injectHeader.value.flg_delivered
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'open_request_page') {
      const route = router.resolve({
        name: 'RequestDetail',
        params: { id: injectHeader.value.id_request }
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
        id_pet: injectHeader.value.id_pet,
        id_customer: injectHeader.value.id_customer,
        linkCategory: 3,
        id_link1: injectHeader.value.id_inject,
        number_link1: injectHeader.value.number_prescription,
        id_employee_answer: injectHeader.value.id_employee_staff
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
        id_customer: injectHeader.value?.id_customer,
        id_pet: injectHeader.value.id_pet,
        id_employee_answer: injectHeader.value.id_employee_staff,
        number_prescription: injectHeader.value.number_prescription
      }
      localStorage.setItem('pageAction', 'searchThread')
      localStorage.setItem('searchThread', JSON.stringify(searchThreadData))
      const route = router.resolve({
        name: 'MessageClinic'
      })
      window.open(route.href, '_blank')
    } else if (selectedOption.name == 'edit') {
      await mtUtils.mediumPopup(UpdInjectHeaderModal, {
        requestObj: props.requestDetailPage,
        injectObj: injectHeader.value
      })
      await init()
    } else if (selectedOption.name == 'delete') {
      if (injectHeader.value.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      const confirmation = await mtUtils.confirm(
        aahMessages.delete_ask,
        aahMessages.delete
      )
      if (confirmation) {
        const resDelete = await injectStore.destoryInject(
          injectHeader.value.id_request,
          injectHeader.value.id_inject
        )
        if (resDelete) {
          event_bus.emit('reloadLeft')
          emits('close')
          await mtUtils.autoCloseAlert(aahMessages.success)
        }
      }
    }
    if (selectedOption.name == 'cancel') {
      if (injectHeader.value.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils.smallPopup(GeneralCancellationModel, {
        url: `prescription/${injectHeader.value.id_inject}`
      })
      closeModal()
    }
    if (selectedOption.name == 'flg_all_prepared') {
      await mtUtils
        .callApi(
          selectOptions.reqMethod.PUT,
          `prescription/${injectHeader.value.id_inject}`,
          {
            flg_all_prepared: true
          }
        )
        .then(async () => {
          await mtUtils.autoCloseAlert(aahMessages.success)
          await init()
        })
    }

    if (confirmation) {
      await mtUtils
        .callApi(
          selectOptions.reqMethod.PUT,
          `prescription/${injectHeader.value.id_inject}`,
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

const getPetIllnessHistory = computed(() => {
  if (!injectHeader.value.id_pet_illness_history) {
    return
  }
  let formattedIllnesses = injectHeader?.value?.id_pet_illness_history.map(
    (idPetHisString: any) => {
      let petIllnessHistory: any =
        illnessHistoryStore.getLeftSideIllnessHistoryList.find((iH: any) => {
          return iH.value == idPetHisString.id_pet_illness_history
        })
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
const openItemServiceModel = async (row) => {
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })
}
const createTaskModal = async () => {
  isTaskModal.value = false
  taskStore.selectTask(null)

  const copiedTaskData = true
  const data = {
    id_customer: injectHeader.value.id_customer,
    id_pet: injectHeader.value.id_pet,
    type_link1: 3,
    number_link1: injectHeader.value?.number_prescription,
    id_employee_staff: injectHeader.value.id_employee_staff,
    memo_task_todo: injectHeader.value?.memo_prescription,
    id_employee_request: JSON.parse(localStorage.getItem('id_employee')),
    id_category1: JSON.parse(<string>localStorage.getItem('clinic'))
      ?.id_category_task_prescription
  }
  const tempTask: any = taskStore.getTaskRequests.find(
    (taskObj: any) => taskObj.id_link1 == injectHeader.value.id_inject
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
const openInjectDetailModal = async (injectDetail: any, otherInjectDetailList = null) => {
  if (injectDetail.type_detail == 2 || injectDetail.type_detail == 3) {
    await mtUtils.smallPopup(UpdInjectDetailModal, {
      injectObj: injectHeader.value,
      injectDetail: injectDetail,
      otherInjectDetailList
    })
    init()
    return false
  }
  await mtUtils.mediumPopup(UpdInjectDetailModal, {
    injectObj: injectHeader.value,
    injectDetail: injectDetail
  })
  init()
}
const submitSortMode = async () => {
  let start = 0
  const updateList = injectHeader.value.prescription_detail_list.map(
    (pd: any, index) => {
      start += 10
      return {
        id_inject_detail: pd.id_inject_detail,
        row: start + index
      }
    }
  )
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/UpdPrescriptionDetailNo',
    {
      prescription_detail_list: updateList
    },
    true
  )

  if (response) {
    await mtUtils.autoCloseAlert('順序を更新しました。')
    sortMode.value = false
    init()
  }
}

function individualRowMove(rowIndex: number, direction: 'UP' | 'DOWN') {
  if (
    (direction === 'UP' && rowIndex === 0) ||
    (direction === 'DOWN' &&
      rowIndex === injectHeader.value.prescription_detail_list.length - 1)
  ) {
    return
  }
  let nextIndex = direction === 'UP' ? rowIndex - 1 : rowIndex + 1
  let current = injectHeader.value.prescription_detail_list.splice(rowIndex, 1)
  injectHeader.value.prescription_detail_list.splice(nextIndex, 0, ...current)
}


function moveGroupUp(records, parentId) {
  let parentRecord = records.find(r => r.id_prescription_detail === parentId && r.id_prescription_detail_ref === null)
  if (!parentRecord) return

  let siblings = records.filter(r => r.id_prescription_detail_ref === null)
  siblings.sort((a, b) => a.row - b.row)

  let index = siblings.findIndex(r => r.id_prescription_detail === parentId)
  if (index > 0) {
    let prevSibling = siblings[index - 1];
    // Swap positions
    [parentRecord.position, prevSibling.position] = [prevSibling.position, parentRecord.position]
  }
}

function moveGroupDown(records, parentId) {
  let parentRecord = records.find(r => r.id_prescription_detail === parentId && r.id_prescription_detail_ref === null)
  if (!parentRecord) return

  let siblings = records.filter(r => r.id_prescription_detail_ref === null)
  siblings.sort((a, b) => a.row - b.row)

  let index = siblings.findIndex(r => r.id_prescription_detail === parentId)
  if (index < siblings.length - 1) {
    let nextSibling = siblings[index + 1];
    // Swap positions
    [parentRecord.position, nextSibling.position] = [nextSibling.position, parentRecord.position]
  }
}

function normalizePositions(records) {
  let grouped = {}

  // Group records by parent_id
  records.forEach(record => {
    const key = record.id_prescription_detail_ref || 'root'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(record)
  })

  // Sort and reassign positions within each group
  Object.values(grouped).forEach(group => {
    group.sort((a, b) => a.row - b.row)
    group.forEach((record, index) => {
      record.row = index + 1
    })
  })
}

const submit = () => {
  createTaskModal()
}

const openPdfPrecriptionSettingModal = () => {
  mtUtils.popup(UpdatePdfPrescriptionSetting, {
    prescription: injectHeader.value
  })
}

const generatePdfPrescriptionPrepList = () => {
  mtUtils.pdfRender(GetPdfPrescriptionPrepList, {
    injectHeader: injectHeader.value,
    resultList: injectHeader.value.prescription_detail_list,
    getPetIllnessHistory: getPetIllnessHistory.value,
    getCustomer: customerStore.getCustomer,
    getPet: customerStore.getCustomer?.pets.find(
      (pet: any) => pet.id_pet === injectHeader.value.id_pet
    ),
    employeeName
  })
}

const closeModal = () => {
  event_bus.emit('reloadLeft')
  event_bus.emit('reloadRight', true)
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}

const openUpdateInjectHeader = async () => {
  const injectDetailList = injectHeader.value.inject_detail_list
  await mtUtils.mediumPopup(UpdateInjectHeaderDetailModal, {
    requestObj: props.requestDetailPage ?? props.InjectObj.request,
    id_pet: customerStore.getPet?.id_pet,
    injectHeader: injectHeader.value,
    injectDetailList: injectDetailList,
    rabies: injectHeader.value.rabies
  })
  await init()
}

onMounted(async () => {
  await init()

  // set page title
  const pageTitle = `${props?.InjectObj?.customer?.name_family}${props?.InjectObj?.pet?.name_pet}`
  if (props.InjectObj) {
    setPageTitle(`注射・点滴 : ${pageTitle}`)
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="text-grey-900 title2 bold prescription-title cursor-pointer"
        @click="
          injectHeader.number_inject
            ? copyText(injectHeader.number_inject)
            : null
        "
      >
        注射・点滴 {{ injectHeader.number_inject }}
        <q-icon class="text-blue q-ml-xs" name="content_copy" />
      </q-toolbar-title>
      <q-space></q-space>
      <MtInputForm
        v-model="selectedPet"
        label="ペットCD"
        readonly
        type="text"
      />
      <div class="q-mx-sm col-1">
        <MtInputForm
          v-model="typeAnimalUI"
          label="動物種"
          readonly
          type="text"
        />
      </div>
      <MtInputForm
        v-model="valWeightUI"
        class="col-1 q-ml-md"
        label="体重"
        readonly
        type="text"
      />
      <q-btn unelevated round @click="openUpdateInjectHeader">
        <q-icon size="15px" name="edit" />
      </q-btn>
      <q-btn class="q-mx-sm" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl content">
      <div v-if="id_pet" class="q-mb-lg">
        <div
          v-if="injectHeader.flg_cancel"
          class="cancel-notification-box q-mb-md"
        >
          <div class="text-body1">
            <span class="text-darkred"
              ><strong>この注射・点滴はキャンセルされました。</strong></span
            >
          </div>
          <div class="q-my-xs">
            キャンセル日時：{{
              formatDateWithTime(injectHeader.datetime_cancel)
            }}
            <span v-if="injectHeader.memo_cancel"
              >理由： {{ injectHeader.memo_cancel }}
            </span>
          </div>
        </div>
        <div class="flex items-center light-shot-blue q-pa-sm">
          <div class="text-body1 q-ml-md">
            <span v-if="injectHeader.flg_non_charge" class="text-darkred"
              ><strong>[会計対象外] </strong></span
            >
            {{ injectHeader.number_inject }}
            {{ injectHeader.title_inject }}
          </div>
          <q-space />
          <!--            <q-btn-->
          <!--              class="q-ml-md"-->
          <!--              label="薬袋・説明書印刷"-->
          <!--              outline-->
          <!--              @click="openPdfPrecriptionSettingModal"-->
          <!--            />-->
          <!--            <q-btn-->
          <!--              class="q-ml-md"-->
          <!--              label="準備リスト印刷"-->
          <!--              outline-->
          <!--              @click="generatePdfPrescriptionPrepList"-->
          <!--            />-->
        </div>
        <div class="flex">
          <div
            v-if="injectHeader.id_pet_illness_history"
            class="row justify-between full-width q-my-sm"
          >
            <div class="q-mt-sm">
              <span class="text-grey-600 q-mr-sm"
                ><small>対象診察：</small></span
              >
              {{ getPetIllnessHistory }}
            </div>
            <div>
              <p v-if="injectHeader.flg_completed" class="q-mt-sm">
                <q-icon class="text-positive" name="check_circle" />
                完了
              </p>
              <div v-else class="q-mt-sm">
                <MtFormCheckBox
                  v-model:checked="injectHeader.flg_completed"
                  label="完了"
                  @update:checked="updateFlgComplete"
                />
              </div>
            </div>
          </div>
          <div v-if="injectHeader.rabies && injectHeader.rabies.id_rabies">
            <div class="q-mb-md">
              <span class="text-grey-600 q-mr-sm"
                ><small>狂犬病ワクチン関連情報</small></span
              >
              <div class="row">
                <span
                  v-if="injectHeader.rabies.license_id"
                  class="q-mx-md text-grey-600"
                >
                  鑑札番号/登録番号 :
                  <span class="text-grey-900">
                    {{ injectHeader.rabies.license_id }}
                  </span>
                </span>
                <span
                  v-if="injectHeader.rabies.code_city_hall"
                  class="q-mx-md text-grey-600"
                >
                  保健所CD :
                  <span class="text-grey-900">
                    {{ injectHeader.rabies.code_city_hall }}
                  </span>
                </span>
                <span
                  v-if="injectHeader.rabies.num_tag"
                  class="q-mx-md text-grey-600"
                >
                  済票番号 :
                  <span class="text-grey-900">
                    {{ injectHeader.rabies.num_tag }}
                  </span>
                </span>
              </div>
              <div class="row">
                <span
                  v-if="injectHeader.rabies.date_exempt_start"
                  class="q-mx-md text-grey-600"
                >
                  猶予開始日 :
                  <span class="text-blue">
                    {{ injectHeader.rabies.date_exempt_start }}
                  </span>
                </span>

                <span
                  v-if="injectHeader.rabies.date_exempt_end"
                  class="q-mx-md text-grey-600"
                >
                  猶予終了日 :
                  <span class="text-blue">
                    {{ injectHeader.rabies.date_exempt_end }}
                  </span>
                </span>

                <span
                  v-if="injectHeader.rabies.date_tag_issued"
                  class="q-mx-md text-grey-600"
                >
                  済票発行日 :
                  <span class="text-blue">
                    {{ injectHeader.rabies.date_tag_issued }}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div
            v-if="injectHeader.memo_inject"
            class="row full-width text-grey-800"
          >
            <q-icon class="q-mr-xs" name="description" />
            {{ injectHeader.memo_inject }}
          </div>
          <div class="row full-width q-my-sm">
            <div class="col-auto flex items-center q-mr-md">
              <div class="q-mr-sm">オーナー名：</div>
              <div class="text-blue cursor-pointer" @click="openCustomerDetail">
                {{ getCustomerName(customerStore.getCustomer) + ' 様' }}
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
            <div class="col-auto flex items-center q-mr-md">
              <div class="q-mx-sm">ペット名：</div>
              <div
                class="text-blue cursor-pointer"
                @click.stop="openPetDetail()"
              >
                {{ petName(id_pet) }}
              </div>
            </div>
            <div class="col-auto">
              <div class="q-mr-sm">
                担当医:
                {{ employeeName(injectHeader.id_employee_doctor) }}
              </div>
            </div>
          </div>
          <div class="row full-width q-my-sm">
            <div class="col-auto flex">
              <div class="text-blue cursor-pointer" @click="openRequestDetail">
                {{ injectHeader?.request?.number_request }}
                <span class="text-grey-500">{{
                  ' / ' + injectHeader?.request?.title_request
                }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="flex items-center q-pa-sm">
          <q-space></q-space>
        </div>
        <div
          v-for="(inject_detail, index) in injectHeader.inject_detail_list"
          :key="inject_detail.id_inject_detail"
          class="q-mt-md"
          @click="openInjectDetailModal(inject_detail)"
        >
          <div
            v-if="inject_detail.flg_group_title != '1'"
            class="row q-bl-md-lg-purple q-pa-md item_divier_prescription justify-between"
          >
            <div class="col-6">
              <div class="col-auto">
                <div class="items-start">
                  <div class="text-body1">
                    <div class="flex items-center">
                      <strong>{{ inject_detail.name_inject_display }}</strong>

                      <div @click.stop="openItemServiceModel(inject_detail)">
                        <q-btn
                          class="text-grey-700"
                          flat
                          icon="quiz"
                          round
                          size="12px"
                        />
                      </div>
                    </div>
                    <small class="text-grey-600">
                      <span>（分類：</span>
                      {{ inject_detail.name_category1 }}
                      <q-icon name="arrow_right" />
                      {{ inject_detail.name_category2 }}
                      ）
                    </small>
                    <div v-if="inject_detail.memo_inject" class="text-grey-700">
                      <q-icon class="q-mr-xs" name="description" />
                      <span v-if="inject_detail.memo_inject">{{
                        inject_detail.memo_inject
                      }}</span>
                    </div>
                    <!--Sub alert per prescription detail-->
                    <div v-if="inject_detail.flg_non_charge">
                      <span class="text-darkred q-mt-xs"
                        ><small>※ 会計対象外</small></span
                      >
                    </div>
                    <!--Sub alert end-->
                  </div>
                </div>
              </div>
              <div class="col-auto">
                <div class="text-grey-700">
                  <span class="q-mr-sm"><small>期間</small></span>
                  <span>
                    {{
                      inject_detail.date_start +
                        ' ～ ' +
                        inject_detail.date_end ?? ''
                    }}
                  </span>
                </div>
                <span class="text-body1"></span>
              </div>
            </div>
            <div class="col-6 flex">
              <div class="p-o-box flex column text-grey-700">
                <div class="row">
                  <div>
                    <span class="text-grey-600"> ロット番号 : </span>
                    <span class="text-blue">
                      {{ inject_detail.lot_number1 }}
                      <span v-if="inject_detail.lot_number2">
                        / {{ inject_detail.lot_number2 }}
                      </span>
                    </span>
                  </div>
                </div>
                <div class="row q-mb-md">
                  <span class="q-mr-sm">投与量 </span>
                  <span class="q-mr-sm">
                    {{ roundZeroAfterPoint(inject_detail.val_dosage_decided) }}
                  </span>
                  {{ inject_detail.name_medicine_format }} |
                  <span class="q-mx-sm">
                    {{ roundZeroAfterPoint(inject_detail.val_used_portion) }} ml
                  </span>
                </div>
                <div v-if="inject_detail.speed_process" class="row">
                  <span class="q-mr-sm">流量速度</span>
                  <span class="q-mr-sm"
                    >{{ inject_detail.speed_process }}
                  </span>
                  <span class="q-mx-sm">
                    {{ inject_detail.type_speed_unit == 1 ? 'mL/時' : 'mL/分' }}
                    |</span
                  >
                  <span class="q-mx-md"> 投与時間 </span>
                  <span>
                    {{ inject_detail.time_process }}
                    {{
                      inject_detail.type_process_time == 1 ? '時間' : '分間'
                    }}</span
                  >
                </div>
              </div>
              <div class="sort-box flex justify-center column">
                <div class="group-align-btn">
                  <q-btn
                    v-if="sortMode"
                    class="cursor-pointer"
                    flat
                    icon="expand_less"
                    round
                    size="14px"
                    @click.stop="individualRowMove(index, 'UP')"
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
                    @click.stop="individualRowMove(index, 'DOWN')"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            v-else
            class="prescription_group q-bl-md-lg-purple q-pa-md item_divier_prescription"
          >
            <div
              class="row justify-between"
              @click="updPrescriptionDetailGroup(prescription_detail)"
            >
              <strong class="col-9 flex items-center"
                ><small v-if="sortMode" class="text-grey-600">グループ： </small
                >{{ prescription_detail.name_prescription_display }}</strong
              >
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
                      moveGroupUp(injectHeader.inject_detail_list, prescription_detail.id_prescription_detail);
                      normalizePositions()
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
                    @click.stop="moveGroupDown(injectHeader.inject_detail_list, 'DOWN')"
                  />
                </div>
                <div class="fake-group-align"></div>
              </div>
            </div>
          </div>


          <template v-if="inject_detail.effort_item && inject_detail.effort_item.length > 0">
            <div
              class="q-ml-xl q-bl-md-lg-purple q-pa-md item_divier_prescription"
              @click.stop="openInjectDetailModal(inject_detail.effort_item?.[0], inject_detail.effort_item)"
            >
              <div>
                {{ inject_detail.effort_item?.[0]?.item_service?.name_item_service }} [{{ inject_detail.name_inject_display }}]
              </div>
              <div class="row">
                <div
                  v-if="inject_detail.effort_item"
                  v-for="effort in inject_detail.effort_item"
                  class="col-12"
                >
                  <div class="flex justify-between q-mr-md">
                    <div>
                      {{ effort.name_inject_display }}
                    </div>
                    <div>
                      {{ roundZeroAfterPoint(effort.val_dosage_decided) }} 個
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </q-card-section>
    <q-btn
      v-if="!disableHeaderUpdate"
      class="add-btn"
      color="black"
      round
      @click="addPrescriptionDetail()"
    >
      <q-icon name="add" />
    </q-btn>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
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
            :disable="disableHeaderUpdate"
            class="q-ml-md"
            color="primary"
            type="submit"
            unelevated
          >
            <span v-if="!injectHeader?.flg_task_created">タスクにする</span>
            <span v-else>タスク確認</span>
          </q-btn>
        </template>
      </div>
    </q-card-section>
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
    background-color: rgba(245, 240, 255, 0.9);
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
}

.font-10px {
  font-size: 10px;
}

.add-btn {
  position: absolute !important;
  bottom: 81px;
  right: 20px;
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
</style>
