<script setup lang="ts">
import { computed, nextTick, onMounted, ref, reactive } from 'vue'
import ViewTaskDetailModal from '@/pages/task/ViewTaskDetailModal.vue'
import ViewPrescriptionModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import UpdateMessageThreadModal from './UpdateMessageThreadModal.vue'
import FilterMessageThreadModal from './FilterMessageThreadModal.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import useMessageStore from '@/stores/message-clinic'
import { storeToRefs } from 'pinia'
import {
  aahUtilsGetEmployeeName,
  getCustomerNameById,
  getDateTimeNow,
  parseForSingleEmoji
} from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import dayjs from 'dayjs'
import useEmployeeStore from '@/stores/employees'
import ZoomImageModal from './ZoomImageModal.vue'
import useActionStore from '@/stores/action'
import { useRouter, useRoute } from 'vue-router'
import MessageClinicDrawer from './MessageClinicDrawer.vue'
import CreateMessage from './CreateMessage.vue'
import TemplateMessage from './TemplateMessage.vue'
import useCustomerStore from '@/stores/customers'
import useCartStore from '@/stores/carts'
import UpdateCartHeaderModal from '@/pages/cart/UpdateCartHeaderModal.vue'
import UpdateMemoCarteModal from '@/pages/memoCarte/UpdateMemoCarteModal.vue'
import useMemoCarteStore from '@/stores/memo-cartes'
import useTask from '@/stores/task'
import {
  MessageThreadType,
  MessageType,
  MessageAttributeListType
} from '@/types/types'
import useServiceDetailStore from '@/stores/service-details'
import UpdateCustomerModal from '@/pages/master/customerPet/UpdateCustomerModal.vue'
import ViewPetDetailModal from '@/pages/master/customerPet/ViewPetDetailModal.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { typeThreadClassification, typeLinkCategory } from '@/utils/enum'
import useAuthStore from '@/stores/auth'
import { setPageTitle } from '@/utils/pageTitleHelper'

type FilterDataType = {
  type_department: number | null
  flg_goal_achieved: boolean | null
  flg_closed: boolean | null
  name_thread: string | null
  number_link1: string | null
  id_customer: string | null
  id_pet: string | null
  id_employee_ask: string | null
  id_employee_answer: string | null
}

const REQUEST_TYPE_THREAD = 'リクエスト'
const SERVICE_TYPE_THREAD = 'サービス'
const PRESCRIPTION_TYPE_THREAD = '処方箋'
const MEMO_TYPE_THREAD = 'メモカルテ'
const TASK_TYPE_THREAD = 'タスク'
const ACCOUNTING_TYPE_THREAD = '会計'
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const taskStore = useTask()
const serviceDetailStore = useServiceDetailStore()
const memoCarteStore = useMemoCarteStore()
const messageStore = useMessageStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const actionStore = useActionStore()
// const { getAction, getParams } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)
const params = computed(() => actionStore.params)

const { getFiles, getThreadFiles, getMessages } = storeToRefs(messageStore)
const messageThreadStore = useMessageStore()
const { getThreadMessages } = storeToRefs(messageThreadStore)

const employeeId = Number(JSON.parse(localStorage?.getItem('id_employee')))
const selectedThread = ref<MessageThreadType>()
const selectedTypeLink = ref()
const messageAttributeList = ref<Array<MessageAttributeListType>>([])
const allTypeThreads = ref<Array<MessageThreadType>>()
const confirmationId = ref()
let startDateTime: any = null
let startDateTimeDayjs: any = null
let startTodayFound = false
let drawer = ref(true)
const emits = defineEmits(['close'])
const headerElement = ref(null)
const footerElement = ref(null)
const headerHeight = ref()
const footerHeight = ref()
const overflowDiv = ref()
const overflowLeft = ref()
const showRightBtn = ref(false)
const showLeftBtn = ref(false)
const messageView = [
  { label: 'メッセージ', value: 1 },
  { label: 'ファイル', value: 2 }
]
const messageFontSize = ref(1.1)
const textArea = ref(null)
const marginLeft = ref(0)
const marginRight = ref(0)
const staticImgUrl = ref()
const headerContainer = ref<HTMLElement>()
const headerIndex = ref(0)
const imageMessages = ref<any>([])
const authStore = useAuthStore()
const sendMessageBtnRef = ref(null)
const isDragging = ref(false)

const handleEmpName = (empId: string) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const data = ref({
  type_department: 0,
  typeMessage: 1,
  messageTextarea: '',
  id_file: null,
  id_employee: employeeId,
  name_employee: handleEmpName(employeeId),
  id_employee_insert: employeeId,
  filedata: []
})
const employeeList = ref([])
const employeeListDefault = reactive([])
const selectedFields = ref(0)
const filterThreadData = ref({
  name_thread: '',
  id_customer: '',
  id_pet: '',
  flg_closed: false,
  id_employee_ask: '',
  id_employee_answer: '',
  flg_goal_achieved: false
})


String.prototype.toHtmlEntities = function () {
  if (
    (/\p{Emoji}/u.test(this) || /(<([^>]+)>)/gi.test(this)) &&
    (!this.includes('https') || /(<([^>]+)>)/gi.test(this)) &&
    (!this.includes('http') || /(<([^>]+)>)/gi.test(this)) &&
    (!this.includes('www.') || /(<([^>]+)>)/gi.test(this))
  ) {
    return this.replace(/[^a-z0-9\s]/gmu, (s) => '&#' + s.codePointAt(0) + ';')
  } else {
    return this
  }
}

const fileLabel = computed(() => {
  if (window.innerWidth < 1024) return ''
  return 'ファイル添付'
})

const showTextAreaError = computed(() => {
  if (data.value.messageTextarea.length >= 1000) return true
  return false
})

const messageCounter = computed(() => {
  return data.value.messageTextarea.length
})

const disableSendBtn = computed(() => {
  if (data.value.messageTextarea.length >= 1000) return true
  return false
})

const handleUrlThread = async () => {
  allTypeThreads.value = getThreadMessages?.value?.pinned_threads.concat(
    getThreadMessages?.value?.unpinned_threads
  )
  const pinnedThread = getThreadMessages?.value.pinned_threads.filter(
    (items: any) => items?.id_message_thread == route.query?.id
  )
  const unPinnedThread = getThreadMessages?.value.unpinned_threads.filter(
    (items: any) => items?.id_message_thread == route.query?.id
  )
  if (pinnedThread?.length) {
    selectedThread.value = pinnedThread[0]
  } else if (unPinnedThread?.length) {
    selectedThread.value = unPinnedThread[0]
  } else {
    router.push('/404Page')
  }
  if (selectedThread.value?.id_message_thread) {
    await messageStore.fetchMessages(selectedThread.value?.id_message_thread)
  }
  const typeLink = typeLinkCategory.find(
    (items: any) => items.value === selectedThread.value?.type_link1
  )
  customerStore.selectCustomer(selectedThread.value?.id_customer)
  selectedTypeLink.value = typeLink
  const allEmployees = employeeStore?.getAllEmployees
  if (getMessages) {
    messageAttributeList.value = []
    startTodayFound = false
    await assignAttributesForMessages(getMessages)
    scrollToBottom()
  }
  if (allEmployees) {
    employeeList.value.length = 0
    employeeListDefault.length = 0
    employeeList.value = [...employeeStore.getEmployeeListOptions]
    employeeListDefault.push(...employeeStore.getEmployeeListOptions)
    confirmationId.value = employeeId
  }
}
const clearFilterData = async () => {
  filterThreadData.value = {
    name_thread: '',
    id_customer: '',
    id_pet: '',
    flg_closed: false,
    id_employee_ask: '',
    id_employee_answer: '',
    flg_goal_achieved: false
  }
}
const init = async (refresh?: boolean, filterThreads?: boolean) => {
  if (filterThreads) {
    allTypeThreads.value = getThreadMessages?.value?.pinned_threads.concat(
      getThreadMessages?.value?.unpinned_threads
    )
  } else {
    allTypeThreads.value = getThreadMessages?.value?.pinned_threads.concat(
      getThreadMessages?.value?.unpinned_threads
    )

    clearFilterData()
    selectedFields.value = 0
  }

  // refresh true will not change existing selected thread
  selectedThread.value = refresh
    ? selectedThread.value
    : allTypeThreads?.value[0]
  await messageStore.fetchMessages(selectedThread.value?.id_message_thread)
  const typeLink = typeLinkCategory.find(
    (items: any) => items.value === selectedThread.value?.type_link1
  )
  selectedTypeLink.value = typeLink
  const allEmployees = employeeStore?.getAllEmployees
  if (getMessages) {
    messageAttributeList.value = []
    startTodayFound = false
    await assignAttributesForMessages(getMessages)
    scrollToBottom()
  }
  if (allEmployees) {
    employeeList.value.length = 0
    employeeListDefault.length = 0
    employeeList.value = [...employeeStore.getEmployeeListOptions]
    employeeListDefault.push(...employeeStore.getEmployeeListOptions)
    confirmationId.value = employeeId
    customerStore.selectCustomer(selectedThread.value?.id_customer)
  }

  setPageTitle(`スレ: ${selectedThread.value.name_thread}`)
}

const setSelectedThread = async (value: MessageThreadType) => {
  selectedThread.value = value

  await customerStore.selectCustomer(selectedThread.value?.id_customer)
  await messageStore.fetchMessages(selectedThread.value?.id_message_thread)
  await messageStore.fetchThreadFiles(selectedThread.value?.id_message_thread)
  if (getMessages) {
    messageAttributeList.value = []
    startTodayFound = false
    await assignAttributesForMessages(getMessages)
  }
  if (window.innerWidth <= 800) {
    drawer.value = !drawer.value
    scrollToBottom()
  }
  const allEmployees = employeeStore?.getAllEmployees
  if (allEmployees) {
    confirmationId.value = employeeId
  }
  const typeLink = typeLinkCategory.find(
    (items: any) => items.value === selectedThread.value?.type_link1
  )
  selectedTypeLink.value = typeLink
  router.push({
    name: 'MessageClinic',
    query: {
      mt: value.id_message_thread
    }
  })
  setPageTitle(`スレ: ${selectedThread.value.name_thread}`)
}
const openUpdateModal = async () => {
  messageStore.selectMessage(null)
  await mtUtils.popup(UpdateMessageThreadModal)
  if (messageStore.getRecentThreadMessage !== null) {
    await handleRefreshClick()
    const data = {...messageStore.getRecentThreadMessage}

    if (data.flg_read === null) {
      data.flg_read = false
    }
    
    await setSelectedThread(data)
  }
}
const openThreadFilterModal = async () => {
  let filterData = filterThreadData.value
  let fields = { valuedTotalFields: 0 }
  let cancelFilter = { value: false }
  await mtUtils.mediumPopup(FilterMessageThreadModal, {
    filterData,
    fields,
    cancelFilter
  })
  // if any typeDepartment selected then it will  select default alltype Departments
  data.value.type_department = 0
  cancelFilter.value !== true ? await init(false, true) : await init()
  filterThreadData.value = filterData
  selectedFields.value = fields.valuedTotalFields
}
const handleCloseThread = async (data: MessageThreadType) => {
  const confirmMsg =
    'このスレッドをクローズしますか？\n一覧から非表示化されます。'
  const confirmation = await mtUtils.confirm(
    confirmMsg,
    'スレッドをクローズしますか？',
    'はい'
  )

  if (confirmation) {
    data.flg_closed = true
    data.datetime_closed = getDateTimeNow()
    console.log("data", data);
    if (data.flg_read === null) {
      return
    }
    await messageStore.updateThreadMessages(data?.id_message_thread, data)
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
    // await handleRefreshClick()
    // remove query after closing thread
    router.replace({ query: {} })
    await init()
  }
}
const handleReopenThread = async (data: MessageThreadType) => {
  const confirmMsg = '一度閉じたスレッドです。\n本当に再開しますか？'
  const confirmation = await mtUtils.confirm(
    confirmMsg,
    'スレッドを再開しますか？',
    'はい'
  )

  if (confirmation) {
    data.flg_closed = false
    data.datetime_closed = null
    await messageStore.updateThreadMessages(data?.id_message_thread, data)
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
    await handleRefreshClick()
    await init()
  }
}
const handleResumeThread = async (data: MessageThreadType) => {
  const confirmMsg = '一度閉じたスレッドです。\n本当に再開しますか？'
  const confirmation = await mtUtils.confirm(
    confirmMsg,
    'スレッドを再開しますか？',
    'はい'
  )
  
  if (confirmation) {
    data.flg_goal_achieved = false
    data.datetime_closed = null
    
    await messageStore.updateThreadMessages(data?.id_message_thread, data)
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
    await handleRefreshClick()
    // await init()
  }
}
const handleConfirm = async (threadData: any) => {
  if (!confirmationId.value) {
    return mtUtils.autoCloseAlert('送信者を選択してください！')
  }
  const authUser = authStore?.authUser
  const messageData = {
    type_message: data.value?.typeMessage,
    message: `${authUser?.name_display} さんによる確認が完了しました。 このスレッドは終了します。`,
    id_file: data.value?.id_file,
    id_employee: data.value?.id_employee,
    name_employee: data.value?.name_employee,
    id_employee_insert: data.value?.id_employee_insert,
    filedata: data.value?.filedata,
    room_id: selectedThread.value
  }
          
  if (threadData.flg_read === null) {
    return
  }
  let confirmMsg = '目的達成に更新しますか？'
  await mtUtils
    .confirm(confirmMsg, '確認して下さい', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        if (threadData) {
          threadData.flg_goal_achieved = true
          threadData.id_employee_achieved = confirmationId.value
          threadData.name_employee_achieved = handleEmpName(
            confirmationId.value
          )
          
          
          await messageStore.updateThreadMessages(
            threadData?.id_message_thread,
            threadData
          )
          await messageStore.submitMessages(
            messageData,
            selectedThread.value?.id_message_thread
          )
          
          assignAttributesOnClick(messageStore.getRecentMessage)
          scrollToBottom()
        }
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      }
    })
  await handleRefreshClick()
  // await init()
}

const openMenu = async () => {
  const data = selectedThread.value
  const id_customer = data?.id_customer
  const id_pet = data?.id_pet
  const menuOptions = [
    {
      title: 'スレッドURLをコピー',
      name: 'Copy thread URL',
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
      title: '削除',
      name: 'close',
      isChanged: false,
      attr: { class: null, clickable: true }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: [...menuOptions] })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'edit') {
      await mtUtils.popup(UpdateMessageThreadModal, {
        data,
        id_customer,
        id_pet
      })
      await init()
      await handleRefreshClick()
    } else if (selectedOption.name === 'close') {
      await handleCloseThread(data)
    } else if (selectedOption.name === 'Copy thread URL') {
      navigator.clipboard
        .writeText(
          `${window.location.origin}/message_threads?id=${selectedThread.value?.id_message_thread}`
        )
        .then(async () => {
          mtUtils.autoCloseAlert('URLをコピーしました')
        })
    }
  }
}
const handleFormData = (file: any) => {
  const data = new FormData()
  // file?.map((image: any) => data.append('file', image))
  data.append('le', file)
  return data
}
const sendImageFile = async () => {
  if (getFiles.value) {
    await getFiles.value.map((item: any) =>
      data.value.filedata.push(item?.file_url)
    )
    const recentFileId = messageStore.getRecentFile?.id_file
    data.value.id_file = recentFileId

    const messageData = {
      type_message: data.value?.typeMessage,
      message: '',
      id_file: data.value?.id_file,
      id_employee: data.value?.id_employee,
      name_employee: data.value?.name_employee,
      id_employee_insert: data.value?.id_employee_insert,
      room_id: selectedThread.value?.id_message_thread
    }

    if (data.value.id_file && selectedThread.value) {
      await messageStore.submitMessages(
        messageData,
        selectedThread.value?.id_message_thread
      )
      //  getMessages.value.push(messageDataSend)
      assignAttributesOnClick(messageStore.getRecentMessage)
      // isUnderLastTenMins(messageStore.getRecentMessage)
      scrollToBottom()
    }
    data.value.messageTextarea = ''
    // recentImageFile = null
    data.value.id_file = null
    onClickFocusInput()
    await messageStore.fetchFiles()
  }
}
const previewFile = async (file: any) => {
  const imageFile = file[0]
  // staticImgUrl.value = URL.createObjectURL(file[0])
  // for (let i = 0; i <= imageFile?.length - 1; i++) {
  const formData = handleFormData(imageFile)
  await messageStore.submitFiles(formData)
  await messageStore.getRecentFile
  const recentFileId = messageStore.getRecentFile?.id_file
  data.value.id_file = recentFileId
  isDragging.value = false
  await sendImageFile()
}
const onClickFocusInput = () => {
  textArea.value?.$refs?.textArea?.focus()
}
const handleSendClick = async () => {
  if (data.value.messageTextarea?.length >= 1000) {
    return mtUtils.autoCloseAlert(
      'メッセージは1000文字以内で入力してください',
      'Error!'
    )
  } else {
    const messageData = {
      type_message: data.value?.typeMessage,
      message: data.value.messageTextarea.toHtmlEntities(),
      id_file: data.value?.id_file,
      id_employee: data.value?.id_employee,
      name_employee: handleEmpName(data.value.id_employee),
      id_employee_insert: data.value?.id_employee_insert,
      room_id: selectedThread?.value?.id_message_thread
    }

    if (
      (data.value.messageTextarea !== '' && selectedThread.value) ||
      (data.value.filedata.length > 0 && selectedThread.value)
    ) {
      await messageStore.submitMessages(
        messageData,
        selectedThread.value?.id_message_thread
      )
      // await messageStore.sendNotificationMessage(
      //   selectedThread.value?.line_user_id,
      //   data.value.messageTextarea
      // )
      // await getMessages.value.push(messageStore.getRecentMessage)
      assignAttributesOnClick(messageStore.getRecentMessage)
      scrollToBottom()
      // isUnderLastTenMins(messageStore.getRecentMessage)
    }
    data.value.messageTextarea = ''
    // data.value.filedata = []
    onClickFocusInput()

    // last conversation thread should be on top after pinned threads.
    if (
      allTypeThreads?.value[0]?.id_message_thread !==
      selectedThread.value?.id_message_thread &&
      getThreadMessages.value?.unpinned_threads[0]?.id_message_thread !==
      selectedThread.value?.id_message_thread
    ) {
      await messageStore.fetchThreadMessages(filterThreadData.value)
      // init(true) will to not change existing selected thread,it will just refresh current threads list.
      await init(true)
    }
  }
}

function beforeYesterdaySet(
  current: any,
  beforeYesterdayDate: any,
  attribute: any
) {
  let beforeYesterday = dayjs().subtract(1, 'day')

  if (dayjs(current.datetime_insert).isBefore(beforeYesterday, 'day')) {
    if (beforeYesterdayDate === null) {
      beforeYesterdayDate = current.datetime_insert
      attribute.isDayStartSeparator = dayjs(current.datetime_insert).format(
        'YYYY/MM/DD (dddd)'
      )
    } else {
      if (
        dayjs(current.datetime_insert).isAfter(
          dayjs(beforeYesterdayDate),
          'day'
        )
      ) {
        beforeYesterdayDate = current.datetime_insert
        attribute.isDayStartSeparator = dayjs(current.datetime_insert).format(
          'YYYY/MM/DD (dddd)'
        )
      }
    }
  }

  return beforeYesterdayDate
}
async function assignAttributesForMessages(messageList: any) {
  messageAttributeList.value = []
  let yesterdayFound = false
  let beforeYesterdayDate: any = null
  if (messageList?.value?.length) {
    for (let i = 0; i < messageList?.value.length; i++) {
      let current = messageList?.value[i]
      let prev = messageList?.value[i === 0 ? i : i - 1]
      current.type_message = parseInt(current?.type_message)
      prev.type_message = parseInt(prev?.type_message)
      let attribute = {
        index: i,
        id: messageList?.value[i].id_message_thread,
        isASingleEmoji: false,
        showTimestamp: i === 0,
        isStartToday: false,
        isStartYesterday: false,
        isDayStartSeparator: null
      }
      // if it is a text
      if (current?.type_message === 1 && current?.message) {
        if (parseForSingleEmoji(current?.message)) {
          attribute.isASingleEmoji = true
        }
      }
      //  determine whether to show timestamp or not
      let currentTimeStamp = dayjs(current?.datetime_insert)
      let difference = currentTimeStamp.diff(startDateTimeDayjs, 'minutes')

      if (
        i > 0 &&
        difference >= 0 &&
        difference <= 9 &&
        current.id_employee_insert === prev.id_employee_insert
      ) {
        attribute.showTimestamp = false
      } else {
        attribute.showTimestamp = true
        startDateTimeDayjs = dayjs(messageList?.value[i].datetime_insert)
        startDateTime = messageList?.value[i].datetime_insert
      }
      // determine whether to show message separator for today, yesterday and by day
      if (!startTodayFound && dayjs(current.datetime_insert).isToday()) {
        startTodayFound = true
        attribute.isStartToday = true
      } else {
        attribute.isStartToday = false
      }
      if (!yesterdayFound && dayjs(current.datetime_insert).isYesterday()) {
        yesterdayFound = true
        attribute.isStartYesterday = true
      } else {
        attribute.isStartYesterday = false
      }
      beforeYesterdayDate = beforeYesterdaySet(
        current,
        beforeYesterdayDate,
        attribute
      )
      messageAttributeList?.value.push(attribute)
    }
  }
}
function assignAttributesOnClick(message: any) {
  let current = message
  
  let prev = getMessages.value[getMessages.value?.length - 1]
  let yesterdayFound = false
  let beforeYesterdayDate: any = null
  let attribute = {
    index: getMessages?.value?.length,
    id: message?.room_id?.id_message_thread,
    showTimestamp: false,
    isASingleEmoji: false,
    isStartToday: false,
    isStartYesterday: false,
    isDayStartSeparator: null
  }
  if (current?.type_message === 1 && current?.message) {
    if (parseForSingleEmoji(current?.message)) {
      attribute.isASingleEmoji = true
    }
  }
  //  determine whether to show timestamp or not
  let currentTimeStamp = dayjs(current?.datetime_insert)
  let difference = currentTimeStamp.diff(startDateTimeDayjs, 'minutes')
  if (
    difference >= 0 &&
    difference <= 9 &&
    current.id_employee_insert === prev.id_employee_insert
  ) {
    attribute.showTimestamp = false
  } else {
    attribute.showTimestamp = true
    startDateTimeDayjs = dayjs(message?.datetime_insert)
    startDateTime = message?.datetime_insert
  }
  // determine whether to show message separator for today, yesterday and by day
  if (!startTodayFound && dayjs(current.datetime_insert).isToday()) {
    startTodayFound = true
    attribute.isStartToday = true
  } else {
    attribute.isStartToday = false
  }
  if (!yesterdayFound && dayjs(current.datetime_insert).isYesterday()) {
    yesterdayFound = true
    attribute.isStartYesterday = true
  } else {
    attribute.isStartYesterday = false
  }
  beforeYesterdayDate = beforeYesterdaySet(
    current,
    beforeYesterdayDate,
    attribute
  )
  messageAttributeList?.value?.push(attribute)
}
function scrollToBottom() {
  let element = document.getElementById('messageBox')
  setTimeout(() => {
    element?.lastElementChild?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  }, 500)
}
const selectedFilter = async (value: FilterDataType) => {
  filterThreadData.value = value
  if (value) {
    await messageStore.fetchThreadMessages(value)
    await nextTick(() => init(false, true))
  } else {
    await messageStore.fetchThreadMessages()
    await init()
  }
}
const handleRefreshClick = async () => {
  selectedFields.value = 0
  await messageThreadStore.fetchThreadMessages(filterThreadData.value)
  if (getThreadMessages?.value) {
    await init(true)
    data.value.type_department = 0
  }
}
const handleFlgPinned = async (data: MessageThreadType) => {
  data.flg_emr_pinned = !data?.flg_emr_pinned
  data.flg_pinned = !data?.flg_pinned
  if (data.flg_emr_pinned === true) {
    await mtUtils.autoCloseAlert('ピン留めしました。')
  } else {
    await mtUtils.autoCloseAlert('ピン留めを解除しました。')
  }
  await messageStore.updateThreadMessages(data?.id_message_thread, data)
  await messageStore.fetchThreadMessages(filterThreadData.value)
  await init()
}
const openImageViewModal = (
  image: string,
  index: number,
  singleImage: boolean
) => {
  mtUtils.imageViewPopup(ZoomImageModal, {
    files: image,
    index,
    singleImage
  })
}
const handleReportLinks = async (reportType: string) => {
  if (reportType === REQUEST_TYPE_THREAD) {
    return window.open(
      `/SearchRequestList/${selectedThread.value?.id_link1}`,
      '_blank'
    )
  }
  if (reportType === SERVICE_TYPE_THREAD) {
    await serviceDetailStore.fetchServiceDetailById(
      selectedThread.value?.id_link1
    )
    return await nextTick(() => mtUtils.popup(UpdateServiceDetailModal))
  }
  if (reportType === PRESCRIPTION_TYPE_THREAD) {
    const customer = customerStore.getAllCustomers.find(
      (cus) => cus?.value == selectedThread.value.id_customer
    )
    const pet = customerStore.getCustomer?.pets?.find(
      (v) => v.id_pet == selectedThread.value.code_pet
    )
    return await mtUtils.mediumPopup(ViewPrescriptionModal, {
      prescriptionObj: {
        id_prescription: selectedThread.value?.id_link1,
        id_customer: selectedThread.value?.id_customer,
        id_pet: selectedThread.value?.code_pet,
        customer,
        pet
      },
      id_pet: selectedThread.value?.code_pet,
      fromPD: true,
      fromPage: selectedThread.value.name_thread
    }, true)
  }
  if (reportType === MEMO_TYPE_THREAD) {
    await memoCarteStore.fetchMemoCarte({
      id_pet: selectedThread.value?.id_pet,
      id_customer: selectedThread.value?.id_customer,
      id_memo_carte: selectedThread.value?.id_link1
    })
    return await nextTick(() => {
      mtUtils.popup(UpdateMemoCarteModal, {
        id_pet: selectedThread.value?.id_pet,
        id_customer: selectedThread.value?.id_customer,
        id_memo_carte: parseInt(selectedThread.value?.id_link1)
      }, true)
    })
  }
  if (reportType === TASK_TYPE_THREAD) {
    await taskStore.fetchTask({
      number_task: selectedThread.value.number_link1
    })
    let taskData: any = taskStore.getTasks.find(
      (task) => task.number_task === selectedThread.value.number_link1
    )

    return await nextTick(() => {
      mtUtils.mediumPopup(ViewTaskDetailModal, {
        data: {
          ...taskData
        },
        fromPage: selectedThread.value.name_thread
      })
    })
  }
  if (reportType === ACCOUNTING_TYPE_THREAD) {
    await cartStore.fetchCart(selectedThread.value?.id_link1)
    return await nextTick(() =>
      mtUtils.popup(UpdateCartHeaderModal, { data: cartStore.getCart })
    )
  }
}
const handleDrawer = () => {
  drawer.value = !drawer.value
}
const handleFontSize = (increase: any) => {
  if (increase) {
    messageFontSize.value += 0.2
  } else {
    messageFontSize.value -= 0.2
  }
}
const handleMessageBoxHeight = async () => {
  headerHeight.value = await headerElement.value?.offsetHeight
  footerHeight.value =
    (await headerElement?.value?.offsetHeight) +
    footerElement?.value?.offsetHeight +
    15
}
const handleResizeWidth = async () => {
  if (window.innerWidth <= 800) {
    drawer.value = false
    setTimeout(() => {
      handleMessageBoxHeight()
    }, 200)
  } else {
    drawer.value = true
    setTimeout(() => {
      handleMessageBoxHeight()
    }, 200)
  }
  await handleMessageBoxHeight()
}

const handleClickBar = (value: string) => {
  const element = headerContainer.value?.children[1]
  if (value === 'scrollLeft') {
    if (headerIndex.value !== 0) {
      headerIndex.value -= 1
      element?.children[headerIndex.value]?.scrollIntoView()
    }
  } else if (value === 'scrollRight') {
    if (headerIndex.value < 3) {
      headerIndex.value += 1
      element?.children[headerIndex.value]?.scrollIntoView()
    }
  }
}

const openMessageTemplateModal = async () => {
  let memoTask = { text: '' }
  let sendText = { text: '' }
  await mtUtils.mediumPopup(TemplateMessage, { memoTask, sendText })
  data.value.messageTextarea = sendText?.text
  if (sendText.text != '') {
    handleSendClick()
  }
  if (memoTask.text != '') {
    data.value.messageTextarea =
      data.value.messageTextarea != ''
        ? data.value.messageTextarea + '\n' + memoTask.text
        : memoTask.text
  }
}
const handleCodeCustomerLink = async () => {
  const data = customerStore.getCustomer
  await mtUtils.popup(UpdateCustomerModal, { data })
}
const handlePetLink = async () => {
  if (selectedThread.value.pets && selectedThread.value.pets.length > 0) {
    let petId: any = selectedThread.value.pets[0]
    await mtUtils.popup(ViewPetDetailModal, {
      id_customer: selectedThread.value?.id_customer,
      id_pet: petId
    })
  }
}
const handleThreadType = (threadId: number) => {
  return typeThreadClassification.find((items: any) => items.value === threadId)
    ?.label
}
const handleCustomerName = (customerId: string) => {
  const customer = customerStore.getAllCustomers.find(
    (cus) => cus?.value == customerId
  )
  return getCustomerNameById(customer, 1)
}
const handlePetName = (pets: Number[]) => {
  if (pets && pets.length && pets.length > 0) {
    return pets.map((petId: Number) => customerStore.getCustomer?.pets?.find(
      (pet: any) => pet?.value == petId
    )?.label).join(', ')
  }
  return ''
}
const handleToggleBtn = async (value: any) => {
  scrollToBottom()
  if (value == 2) {
    await messageStore.fetchThreadFiles(selectedThread.value?.id_message_thread)
  }
}

const deleteMessage = async (item: any) => {
  const id_message = item?.id_message
  let confirmMsg = 'このメッセージを削除してもよろしいですか?'
  await mtUtils
    .confirm(confirmMsg, 'このメッセージを削除しますか?', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        messageStore.deleteMessages(
          selectedThread?.value?.id_message_thread,
          id_message
        )
        mtUtils.autoCloseAlert(aahMessages.success)
      }
    })
  await handleRefreshClick()
  await init(true, false)
}
const copyMessageLink = async (item: MessageType) => {
  const domain = window.location.host
  let link = ''
  if (domain.includes('localhost')) {
    link = `http://${domain}/MessageClinic?mt=${item.id_message_thread}&m=${item.id_message}`
  } else {
    link = `https://${domain}/MessageClinic?mt=${item.id_message_thread}&m=${item.id_message}`
  }
  await navigator.clipboard.writeText(link)
  mtUtils.autoCloseAlert('コピーしました。')
}

const checkURLParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const id_message_thread = urlParams.get('mt')
  const id_message = urlParams.get('m')

  if (id_message_thread) {
    messageThreadStore.fetchMessageThreadById(id_message_thread).then((res) => {
      const data = {...res}
      if (data.flg_read === null) {
      data.flg_read = false
    }
        setSelectedThread(data)
      // setSelectedThread(messageThreadStore.getRecentThreadMessage)
    })
  }
  if (id_message) {
    setTimeout(() => {
      const messageElement = document.getElementById(id_message)
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 1000)
  }
}

const selectDefaultEmployee = () => {
  confirmationId.value = defaultEmployee
}

const setFocusOnSendMessage = () => {
  sendMessageBtnRef.value.$el.focus()
}

const onDrop = async (e: DragEvent) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer?.files || [])
  files.forEach(async (file) => await previewFile([file]))
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
}

const onDragEnter = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

onMounted(async () => {
  let data = { ...filterThreadData.value }
  if (route.query?.task_id) {
    data.name_thread = route.query.task_id
  }

  await messageThreadStore.fetchThreadMessages(data)
  if (route.query?.id !== undefined) {
    await handleUrlThread()
  } else if (getThreadMessages?.value) {
    await init()
  }

  if (
    action.value === 'createThread' ||
    localStorage.getItem('pageAction') === 'createThread'
  ) {
    let tempParams: any = params.value
    if (localStorage.getItem('createThread')) {
      tempParams = {
        data: JSON.parse(<string>localStorage.getItem('createThread')),
        id_customer: JSON.parse(<string>localStorage.getItem('createThread'))
          .id_customer,
        id_pet: JSON.parse(<string>localStorage.getItem('createThread')).id_pet
      }
      localStorage.removeItem('createThread')
    }

    await mtUtils.popup(UpdateMessageThreadModal, tempParams)
    await setSelectedThread(messageStore.getRecentThreadMessage)
    if (messageStore.getRecentThreadMessage) {
      await init(true)
    }
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  } else if (
    action.value === 'searchThread' ||
    localStorage.getItem('pageAction') === 'searchThread'
  ) {
    let tempParams = params.value?.data
    if (localStorage.getItem('searchThread')) {
      tempParams = JSON.parse(localStorage.getItem('searchThread'))
      localStorage.removeItem('searchThread')
    }
    await messageStore.fetchThreadMessages({ ...tempParams })
    await init()
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
  await handleResizeWidth()

  checkURLParams()
})

window.addEventListener('resize', handleResizeWidth)
window.addEventListener('keydown', async (event) => {
  if (event.ctrlKey && event.key == 'Enter') {
    await handleSendClick()
  }
})
</script>

<template>
  <q-layout view="lHh Lpr lff" container class="window-height">
    <q-btn v-if="!drawer" flat @click="handleDrawer" round dense class="q-ml-xl fixed-top-left z-top drawerBtn">
      <q-icon size="22px" name="chevron_right" />
    </q-btn>
    <MessageClinicDrawer :data="data" :drawer="drawer" :allTypeThreads="allTypeThreads" :selectedThread="selectedThread"
      :selectedFields="selectedFields" @handle-drawer="handleDrawer" @open-update-modal="openUpdateModal"
      @selected-filter="selectedFilter" @set-selected-thread="setSelectedThread"
      @handle-refresh-click="handleRefreshClick" @handle-thread-type="handleThreadType"
      @handle-flg-pinned="handleFlgPinned" @open-thread-filter-modal="openThreadFilterModal" />
    <q-page-container class="bg-grey-100">
      <q-page :class="!selectedThread ? 'flex items-center justify-center' : ''">
        <div ref="headerElement" v-if="selectedThread" class="relative-position bg-grey-100 full-width">
          <div class="q-px-md q-py-sm">
            <div class="row no-wrap items-center justify-between">
              <div :class="!drawer ? 'q-ml-xl' : ''" class="flex no-wrap text-grey-900 text-left ellipsis">
                <span class="field-label-msg q-px-md" :class="selectedThread?.flg_goal_achieved
                    ? 'goalAchivedBg '
                    : 'goalUnAchivedBg'
                  ">
                  <span v-if="selectedThread?.flg_goal_achieved">
                    <q-icon size="20px" name="outlined_flag" class="achieved_icon q-pr-xs" />達成
                  </span>
                  <span v-else>未達成</span>
                </span>
                <span v-if="selectedThread?.type_thread" class="q-ml-sm text-grey-700 border-outline-600 q-px-md">
                  {{ handleThreadType(selectedThread?.type_thread) }}
                </span>
                <span class="q-ml-sm text-black threadNameBox">
                  <!--Show icon for either "urgent" or "closed" if applicable-->
                  <span v-if="selectedThread?.flg_closed" class="q-mr-xs text-grey-800 bold">
                    <q-icon name="do_disturb_on" size="20px" class="q-pr-xs" />
                    [ 終了しました ]
                  </span>
                  <span v-if="selectedThread?.flg_urgent" class="q-mr-xs text-negative bold">
                    <q-icon name="run_circle" size="20px" class="q-pr-xs" />
                    [ 至急 ]
                  </span>
                  {{ selectedThread?.name_thread }}
                </span>
              </div>
              <div class="refreshToPinBox">
                <div class="flex no-wrap items-center justify-end">
                  <q-btn @click="handleRefreshClick" round unelevated text-color="black" padding="3px">
                    <q-icon size="20px" name="refresh" />
                  </q-btn>
                  <div>
                    <q-btn :disable="messageFontSize.toFixed(1) === '0.9'" @click="handleFontSize(false)"
                      text-color="black" padding="3px" unelevated>
                      <q-icon size="20px" name="chevron_left" />
                    </q-btn>
                    <q-btn :disable="messageFontSize.toFixed(1) === '1.5'" @click="handleFontSize(true)"
                      text-color="black" padding="3px" unelevated>
                      <q-icon size="20px" name="chevron_right" />
                    </q-btn>
                  </div>
                  <div class="flex q-mx-sm">
                    <q-btn-toggle v-model="data.typeMessage" color="white" text-color="black" toggle-color="grey-800"
                      unelevated dense class="message-type" :options="messageView"
                      @update:model-value="handleToggleBtn" />
                  </div>
                  <q-btn round unelevated :text-color="selectedThread?.flg_emr_pinned ? 'grey-400' : 'grey-800'
                    " padding="3px" @click="handleFlgPinned(selectedThread)">
                    <q-icon size="18px" name="push_pin" />
                  </q-btn>
                  <q-btn padding="3px" round unelevated text-color="black" @click="openMenu">
                    <q-icon size="20px" name="more_horiz" />
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
          <div ref="headerContainer" class="row no-wrap q-py-xs q-px-lg items-center justify-center bg-grey-800">
            <q-btn unelevated padding="3px" class="left-button q-mr-auto" @click="handleClickBar('scrollLeft')">
              <q-icon name="chevron_left" color="white" size="30px" />
            </q-btn>
            <div ref="overflowDiv" class="thread-info-header">
              <div class="overflowLeftBox" ref="overflowLeft">
                <span v-if="selectedThread.id_employee_ask" class="text-white q-mr-sm employeeNameBox">
                  {{ handleEmpName(selectedThread.id_employee_ask) }}
                </span>
                <q-icon name="arrow_right" class="text-grey-200 q-pt-xs" size="16px" />
                <span class="q-ml-sm text-white no-wrap LabelsBox">
                  {{
                    selectedThread.id_employee_answer
                      ? handleEmpName(selectedThread.id_employee_answer)
                      : '犬舎'
                  }}
                </span>
              </div>
              <div class="no-wrap headerBox">
                <span v-if="selectedTypeLink" class="text-white q-ml-sm no-wrap LabelsBox">
                  {{ selectedTypeLink?.label + '：' }}
                </span>
                <span v-if="selectedThread?.number_link1" class="q-ml-sm cursor-pointer LabelsBox linkColor"
                  @click="handleReportLinks(selectedTypeLink?.label)">
                  {{ selectedThread?.number_link1 }}
                </span>
              </div>
              <div v-if="handleCustomerName(selectedThread?.id_customer)" class="no-wrap headerBox">
                <span class="text-white no-wrap LabelsBox"> オーナー：</span>
                <div @click="handleCodeCustomerLink" class="no-wrap q-ml-sm cursor-pointer overflowClipBox">
                  {{ handleCustomerName(selectedThread?.id_customer) }}
                </div>
              </div>
              <div v-if="selectedThread?.pets.length > 0" class="no-wrap headerBox">
                <span class="text-white nowrap LabelsBox">ペット：</span>
                <div @click="handlePetLink" class="no-wrap q-ml-sm cursor-pointer overflowClipBox">
                  {{ handlePetName(selectedThread?.pets) }}
                </div>
              </div>
            </div>
            <q-btn unelevated padding="3px" class="right-button q-ml-auto" @click="handleClickBar('scrollRight')">
              <q-icon name="chevron_right" color="white" size="30px" />
            </q-btn>
          </div>
        </div>
        <div @dragenter.prevent="onDragEnter" @dragleave.prevent="onDragLeave" @dragover.prevent="onDragOver"
          @drop.prevent="onDrop" v-if="selectedThread" class="message-thread-container q-px-lg"
          :class="{ 'drag-over': isDragging }">
          <q-icon v-if="isDragging" class="upload-icon" size="xl" name="cloud_upload" />
          <!-- <div class="file-drop-container">
          </div> -->
          <CreateMessage :chatMessageHeight="footerHeight" :data="data" :messageFontSize="messageFontSize"
            :headerElementHeight="headerHeight" :messageAttributeList="messageAttributeList" :employeeId="employeeId"
            :selectedThread="selectedThread" :allTypeThreads="allTypeThreads"
            @open-image-view-modal="openImageViewModal" @delete-message="deleteMessage"
            @copy-message-link="copyMessageLink" @scroll-to-bottom="scrollToBottom" />
          <div v-if="data.typeMessage === 1" ref="footerElement" class="relative-position bg-grey-100 footerBox">
            <div class="message-input" :class="{ error: showTextAreaError }">
              <MtInputForm v-model="data.messageTextarea" ref="textArea" type="textarea" :borderless="true"
                :classStyle="'input-message-text'" placeholder="メッセージ..." @keydown.tab.prevent="setFocusOnSendMessage">
                <template #append>
                  <div class="absolute-top-right">
                    <InputEmployeeOptGroup v-model:selected="data.id_employee" label="" />
                  </div>
                </template>
              </MtInputForm>
            </div>
            <div class="row justify-between q-mx-auto q-mb-xs q-mt-xs">
              <span>
                <span v-if="showTextAreaError" class="text-negative">
                  メッセージは1000文字以内で送信してください！
                </span>
              </span>
              <span class="message-text-counter">
                <span :class="{ error: showTextAreaError }">{{
                  messageCounter
                }}</span>
                / 1000
              </span>
            </div>
            <div class="row">
              <div class="col-lg-2 col-xs-2">
                <q-file tabindex="1" dense multiple :stack-label="true" :bottom-slots="false" filled borderless
                  bg-color="white" :label="fileLabel" class="btn-file-uploader shadow-1 q-pa-none"
                  @update:model-value="previewFile">
                  <template v-slot:prepend>
                    <q-icon size="20px" name="attach_file" class="text-grey-800 bold" />
                  </template>
                </q-file>
              </div>
              <div class="col-lg-4 col-sm-4 col-xs-3">
                <q-btn tabindex="2" padding="9px" flat class="btn-file-uploader q-pa-none q-ml-sm"
                  @click="openMessageTemplateModal">
                  <q-icon size="20px" name="comment_bank" class="text-grey-800 q-pl-sm q-pr-sm" />
                </q-btn>
              </div>
              <!-- <div
               
                class="col-lg-2 col-sm-2 col-xs-3"
              >
                
              </div> -->
              <div class="col">
                <div class="btn-action-message-container">
                  <InputEmployeeOptGroup v-if="!selectedThread?.id_employee_achieved" v-model:selected="confirmationId"
                    :tabindex="3" show-select-default-employee
                    @update:select-default-employee="selectDefaultEmployee" />
                  <!-- if thread is closed, hide confirm/close thread btn -->
                  <q-btn v-if="!selectedThread?.flg_closed" :class="selectedThread?.flg_goal_achieved
                      ? 'bg-grey-600'
                      : 'bg-positive'
                    " :label="selectedThread?.flg_goal_achieved ? 'クローズ' : '確認済'
                      " class="btn-action-message" tabindex="4" text-color="white" unelevated @click="
                      selectedThread?.flg_goal_achieved
                        ? handleCloseThread(selectedThread)
                        : handleConfirm(selectedThread)
                      " />
                  <!-- if thread is closed, show reopen thread btn -->
                  <q-btn v-if="selectedThread?.flg_closed" :tabindex="4" unelevated text-color="white"
                    class="btn-action-message" :class="selectedThread?.flg_closed ? 'bg-positive' : 'bg-grey-600'
                      " @click="handleReopenThread(selectedThread)">
                    <span class="btn-label">
                      {{
                        selectedThread?.flg_closed ? '再開する' : 'クローズする'
                      }}
                    </span>
                    <q-icon class="btn-icon" name="cancel_schedule_send" />
                  </q-btn>
                  <!-- if thread is achieved, show resume thread btn -->
                  <q-btn v-if="selectedThread?.flg_goal_achieved" :tabindex="4" class="btn-action-message bg-grey-600"
                    text-color="white" unelevated @click="handleResumeThread(selectedThread)">
                    <span class="btn-label"> 再開 </span>
                    <q-icon class="btn-icon" name="cancel_schedule_send" />
                  </q-btn>
                  <q-btn :tabindex="0" outlined unelevated class="btn-action-message bg-grey-800 text-white"
                    :disable="disableSendBtn" @click="handleSendClick" ref="sendMessageBtnRef">
                    <span class="btn-label">送信</span>
                    <q-icon class="btn-icon" name="send" />
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="column full-width flex-center" v-if="!selectedThread">
            <!-- <img
              src="@/assets/img/login/vetty.svg"
              alt="logo"
              class="logoImage"
            /> -->
            {{ 'メッセージを投稿しましょう！' }}
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style lang="scss" scoped>
.message-type {
  border: 1px solid #333;

  :deep(button) {
    min-width: 66px;
    min-height: 20px;
    max-height: 20px;
    display: flex;
    justify-content: center;
    padding: 0 6px;
  }
}

.message-input {
  &.error {
    background: #ffe6e6;
  }

  min-height: 131px;
  max-height: 300px;
  border: 1px solid #e7e7e7;
  padding: 0px 15px 0px 15px;
  background: white;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  overflow-y: scroll;
  -ms-overflow-style: none;
  /* Internet Explorer 10+ */
  scrollbar-width: none;
  /* Firefox */
  position: relative;

  .message-within-controls {
    .mb-10px-btn {
      margin-bottom: 10px;
    }
  }
}

.message-input::-webkit-scrollbar {
  display: none;
  /* Safari and Chrome */
}

.message-text-counter {
  .error {
    color: $darkRed;
    font-weight: bold;
  }
}

.input-message-text {
  &.q-field--labeled.q-field--dense {

    :deep(textarea),
    :deep(.q-field__control-container) {
      height: 250px;
      padding: 0;
    }
  }

  :deep(textarea) {
    resize: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  :deep(.q-field__control) {
    height: 100%;
    padding: 0px;

    &:before,
    &:after {
      display: none;
    }
  }
}

.btn-file-uploader {
  max-width: fit-content;
  border-radius: 10px;

  :deep(.q-field__control) {
    min-height: 30px !important;
    height: 38px;
    border-radius: 10px;
    max-width: fit-content;

    &:after {
      display: none;
    }
  }

  .q-field__prepend {
    width: 42.5px;
    padding-right: unset;
    display: flex;
    justify-content: center;
  }

  .q-field__input+div {
    display: none;
  }

  :deep(.q-field__label) {
    top: 10px;
    transform: none !important;
    color: #424242;
    font-weight: bold;
  }
}

.goalAchivedBg {
  background-color: #00ad35;
}

.goalUnAchivedBg {
  background-color: #b99b14;
}

.achieved_icon {
  color: #ffffff !important;
}

.drawerBtn {
  margin-top: 10px;
  margin-left: 40px;
}

.refreshToPinBox {
  width: 100%;
  max-width: max-content;
  min-width: max-content;
}

.threadNameBox {
  width: 80%;
  text-overflow: ellipsis;
  overflow: hidden;
}

.left-button {
  @media screen and (max-width: 1600px) {
    display: inline-flex;
  }

  display: none;
}

.right-button {
  @media screen and (max-width: 1600px) {
    display: inline-flex;
  }

  display: none;
}

.thread-info-header {
  display: flex;
  flex-wrap: nowrap;
  gap: 48px;
  width: 100%;
  scroll-behavior: smooth;
  overflow-x: scroll;
  overflow-y: hidden;

  ::-webkit-scrollbar {
    display: none;
  }

  scrollbar-width: none;
}

.overflowLeftBox {
  display: flex !important;
  flex-wrap: nowrap !important;
  text-wrap: nowrap !important;
}

.employeeNameBox {
  white-space: nowrap !important;
  text-wrap: nowrap !important;
}

.headerBox {
  display: flex !important;
  flex-wrap: nowrap !important;
  max-width: max-content !important;
  text-wrap: nowrap !important;
}

.LabelsBox {
  width: 100%;
  max-width: max-content !important;
  white-space: nowrap !important;
  text-wrap: nowrap !important;
}

.linkColor {
  color: #91c8fc;
}

.overflowClipBox {
  width: 100%;
  max-width: max-content !important;
  text-overflow: clip !important;
  white-space: nowrap !important;
  text-wrap: nowrap !important;
  color: #91c8fc;
}

.footerBox {
  bottom: 0px;
  width: 100%;
}

.width93 {
  width: 93%;
}

.logoImage {
  width: 224px;
  height: 39px;
}

.btn-action-message-container {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;

  .btn-action-message {
    padding: 7px 48px;
    border: 1px solid #bdbdbd;

    &.btn-send {
      border: 1px solid #c7c7c7;
    }

    .btn-label {
      @media screen and (min-width: 300px) {
        display: none;
      }

      @media screen and (min-width: 1024px) {
        display: inline;
      }
    }

    .btn-icon {
      @media screen and (min-width: 300px) {
        display: inline;
      }

      @media screen and (min-width: 1024px) {
        display: none;
      }
    }

    @media screen and (max-width: 500px) {
      padding: 7px 14px;
    }

    @media screen and (min-width: 500px) and (max-width: 1024px) {
      padding: 7px 32px;
    }
  }

  @media screen and (max-width: 500px) {
    gap: 4px;
  }

  @media screen and (min-width: 500px) and (max-width: 1024px) {
    gap: 4px;
  }
}

.field-label-msg {
  border-radius: 4px;
  color: white;
}

.message-thread-container {
  position: relative;
  border: 2px dashed transparent;
  transition: border-color 0.3s ease;
  background-color: $grey-100;

  &.drag-over {
    border-color: $blue;
    background-color: rgb(62, 127, 255, 0.15);
  }

  .upload-icon {
    position: absolute;
    color: $blue;
    z-index: 2;
    background-color: rgb(62, 127, 255, 0.25);
    border-radius: 100%;
    padding: 8px;
    left: 50%;
    bottom: 30%;
  }
}
</style>
