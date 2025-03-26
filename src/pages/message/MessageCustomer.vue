<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UpdateNextVisitModal from './UpdateNextVisitModal.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import UpdateMessageThreadModal from './UpdateMessageThreadModal.vue'
import TemplateMessage from './TemplateMessage.vue'
import useMessageStore from '@/stores/message-clinic'
import useThreadCustomer from '@/stores/message-customer'
import { storeToRefs } from 'pinia'
import {
  aahUtilsGetEmployeeName,
  getCustomerNameById,
  getDateTimeNow,
  getDateToday,
  isEmty,
  parseForSingleEmoji
} from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import dayjs from 'dayjs'
import useEmployeeStore from '@/stores/employees'
import useCommonStore from '@/stores/common'
import aahMessages from '@/utils/aahMessages'
import { useRoute, useRouter } from 'vue-router'
import FilterCustomerThreadModal from './FilterCustomerThreadModal.vue'
import UpdateCustomerModal from '@/pages/master/customerPet/UpdateCustomerModal.vue'
import ViewPetDetailModal from '@/pages/master/customerPet/ViewPetDetailModal.vue'
import { MessageThreadType, MessageType } from '@/types/types'
import MessageCustomerDrawer from './MessageCustomerDrawer.vue'
import MessageCustomerChat from './MessageCustomerChat.vue'
import { typeCustomerThread } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import PaidConsultoReservationMaking from '@/components/form/PaidConsultoReservationMaking.vue'
import useCliCommonStore from '@/stores/cli-common'
import ConfirmBookingModal from '@/pages/message/ConfirmBookingModal.vue'

type MessageAttributeListType = {
  index: number
  id: string
  isASingleEmoji: boolean
  showTimestamp: boolean
  isStartToday: boolean
  isStartYesterday: boolean
  isDayStartSeparator: boolean | null
}

const emits = defineEmits(['close'])
const drawer = ref(true)
const panel = ref('open')
const tabPanelName = ref('open')
const messageStore = useMessageStore()
const customerThreadStore = useThreadCustomer()
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const { getThreadMessages, getMessages } = storeToRefs(customerThreadStore)
const { getCustomerListOptions, getCustomer } = storeToRefs(customerStore)
const drawerHeader = ref()
const headerElement = ref(null)
const footerElement = ref(null)
const headerHeight = ref()
const footerHeight = ref()
const selectedThread = ref<MessageThreadType>()
const allTypeThreads = ref<Array<MessageThreadType>>()
const messageAttributeList = ref<Array<MessageAttributeListType>>()
const showTextAreaError = ref(false)
const route = useRoute()
const router = useRouter()
let startTodayFound = false
let drawerHeaderHeight = 0
let startDateTime = null
let startDateTimeDayjs = null
const messageFontSize = ref(1.1)
const marginLeft = ref(0)
const marginRight = ref(0)
const overflowDiv = ref()
const overflowLeft = ref()
const showRightBtn = ref(false)
const showLeftBtn = ref(false)
const employeeId = JSON.parse(localStorage?.getItem('id_employee')).toString()
const confirmationId = ref()
const headerContainer = ref<HTMLElement>()
const headerIndex = ref(0)
const menuOptions = [
  {
    title: 'スレッドURLをコピー',
    name: 'Copy thread URL',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: '編集',
    name: 'edit',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: '削除',
    name: 'close',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  }
]
const closedThreadsMenuOptions = [
  {
    title: 'スレッドURLをコピー',
    name: 'Copy thread URL',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  }
]

const openUpdateModal = async () => {
  await mtUtils.mediumPopup(UpdateNextVisitModal)
}

const handleEmpName = (empId: string) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const data = ref({
  thread_Selection: 0,
  type_department: 0,
  typeMessage: 1,
  messageTextarea: '',
  id_employee: employeeId,
  name_employee: handleEmpName(employeeId),
  id_employee_insert: employeeId
})
const selectedFields = ref(0)
const filterThreadData = ref({
  name_thread: '',
  id_customer: '',
  type_thread: 50
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

const clearFilterData = async () => {
  for (let key in filterThreadData.value) {
    if (key == 'flg_closed' || key == 'flg_goal_achieved') {
      filterThreadData.value[key] = false
    } else {
      filterThreadData.value[key] = ''
    }
  }
}

const scrollToBottom = () => {
  let elements = document.getElementsByClassName('chat-bubble')
  setTimeout(() => {
    elements[elements.length - 1].scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    })
  }, 500)
}

const handleUrlThread = async () => {
  const allThreads = getThreadMessages?.value?.pinned_threads.concat(
    getThreadMessages?.value?.unpinned_threads
  )
  const threadData = allThreads.find(
    (items) => items?.id_message_thread == route.query?.id
  )
  if (threadData) {
    selectedThread.value = threadData
  } else {
    router.push('/404Page')
  }
  if (selectedThread.value?.flg_closed) {
    allTypeThreads.value = allThreads.filter(
      (thread) => thread.flg_closed === true
    )
    panel.value = 'close'
    tabPanelName.value = 'close'
  } else {
    allTypeThreads.value = allThreads.filter(
      (thread) => thread.flg_closed !== true
    )
    panel.value = 'open'
    tabPanelName.value = 'open'
  }
  await customerStore.selectCustomer(selectedThread.value?.id_customer)
  await customerThreadStore.fetchMessages(
    selectedThread.value?.id_message_thread
  )
  if (getMessages) {
    messageAttributeList.value = []
    startTodayFound = false
    await assignAttributesForMessages(getMessages)
    scrollToBottom()
  }
}

const setSelectedThread = async (data: MessageThreadType) => {
  selectedThread.value = data
  await customerStore.selectCustomer(selectedThread.value.id_customer)
  await messageStore.fetchMessages(selectedThread.value?.id_message_thread)
  if (getMessages) {
    messageAttributeList.value = []
    startTodayFound = false
    await customerStore.selectCustomer(selectedThread.value?.id_customer)
    await customerThreadStore.fetchMessages(
      selectedThread.value?.id_message_thread
    )
    await assignAttributesForMessages(getMessages)
  }
  if (window.innerWidth <= 800) {
    drawer.value = !drawer.value
    scrollToBottom()
  }
  setPageTitle(`予約: ${selectedThread.value.name_thread}`)
}

const init = async (
  refresh?: boolean,
  filterThreads?: boolean,
  closedThreads?: boolean
) => {
  if (filterThreads) {
    if (closedThreads) {
      allTypeThreads.value = getThreadMessages?.value?.pinned_threads
        .concat(getThreadMessages?.value?.unpinned_threads)
        ?.filter((thread) => thread.flg_closed === true)
    } else {
      allTypeThreads.value = getThreadMessages?.value?.pinned_threads
        .concat(getThreadMessages?.value?.unpinned_threads)
        ?.filter((thread) => thread.flg_closed !== true)
    }
  } else {
    if (closedThreads) {
      allTypeThreads.value = getThreadMessages?.value?.pinned_threads
        .concat(getThreadMessages?.value?.unpinned_threads)
        ?.filter((thread) => thread.flg_closed === true)
    } else {
      allTypeThreads.value = getThreadMessages?.value?.pinned_threads
        .concat(getThreadMessages?.value?.unpinned_threads)
        ?.filter((thread) => thread.flg_closed !== true)
    }
    clearFilterData()
    selectedFields.value = 0
  }
  selectedThread.value = refresh
    ? selectedThread.value
    : allTypeThreads?.value[0]
  await customerThreadStore.fetchMessages(
    selectedThread.value?.id_message_thread
  )

  if (getMessages.value.length) {
    messageAttributeList.value = []
    startTodayFound = false
    await customerStore.selectCustomer(selectedThread.value?.id_customer)
    await assignAttributesForMessages(getMessages)
    scrollToBottom()
  }

  setPageTitle(`予約: ${selectedThread.value.name_thread}`)
}

function beforeYesterdaySet(current, beforeYesterdayDate, attribute) {
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

async function assignAttributesForMessages(messageList) {
  messageAttributeList.value = []
  let yesterdayFound = false
  let beforeYesterdayDate = null
  if (
    messageList?.value &&
    messageList?.value.length &&
    messageList?.value.length > 0
  ) {
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
      let currentTimeStamp = dayjs(current.datetime_insert)
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

function assignAttributesOnClick(message) {
  let current = message
  let prev = getMessages.value[getMessages.value?.length - 1]
  let yesterdayFound = false
  let beforeYesterdayDate = null
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
  let currentTimeStamp = dayjs(current.datetime_insert)
  let difference = currentTimeStamp.diff(startDateTimeDayjs, 'minutes')
  if (
    difference >= 0 &&
    difference <= 9 &&
    current.id_employee_insert === prev.id_employee_insert
  ) {
    attribute.showTimestamp = false
  } else {
    attribute.showTimestamp = true
    startDateTimeDayjs = dayjs(message.datetime_insert)
    startDateTime = message.datetime_insert
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
      drawerHeaderHeight = drawerHeader?.value?.offsetHeight
    }, 200)
  } else {
    drawer.value = true
    setTimeout(() => {
      handleMessageBoxHeight()
      drawerHeaderHeight = drawerHeader?.value?.offsetHeight
    }, 200)
  }
  await handleMessageBoxHeight()
}

const handleCloseThread = async (threadData: MessageThreadType) => {
  const messageData = {
    type_message: data.value?.typeMessage,
    message: '本件はクローズされました。\nこれ以降のメッセージはできません。',
    id_customer: selectedThread.value?.id_customer,
    id_employee: data.value?.id_employee,
    room_id: selectedThread.value?.id_message_thread
  }
  const messageDataSend = {
    type_message: data.value?.typeMessage,
    message: '本件はクローズされました。\nこれ以降のメッセージはできません。',
    id_customer: selectedThread.value?.id_customer,
    id_employee: data.value?.id_employee,
    room_id: selectedThread.value?.id_customer,
    datetime_insert: getDateToday()
  }
  let confirmMsg =
    'このスレッドをクローズしますか？\n一覧から非表示化されます。'
  await mtUtils
    .confirm(confirmMsg, 'スレッドをクローズしますか？', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        if (threadData) {
          threadData.flg_closed = true
          threadData.datetime_closed = getDateTimeNow()
          await customerThreadStore.updateThreadMessages(
            threadData?.id_message_thread,
            threadData
          )
          customerThreadStore.submitMessages(
            messageData,
            selectedThread.value?.id_message_thread
          )
          getMessages.value.push(messageDataSend)
          assignAttributesOnClick(messageDataSend)
          scrollToBottom()
        }
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      }
      await init()
    })
}

const handleOpenMenu = async () => {
  const data = selectedThread.value
  const id_customer = data?.id_customer
  const id_pet = data?.id_pet
  await mtUtils.littlePopup(OptionModal, {
    options:
      tabPanelName.value === 'close' ? closedThreadsMenuOptions : menuOptions
  })
  let selectedOption =
    tabPanelName.value === 'close'
      ? closedThreadsMenuOptions.find((i) => i.isChanged == true)
      : menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'edit') {
      await mtUtils
        .popup(UpdateMessageThreadModal, {
          data,
          id_customer,
          id_pet
        })
        .then(async () => {
          await customerThreadStore.fetchThreadMessages()
          await init()
        })
    } else if (selectedOption.name === 'close') {
      await handleCloseThread(data)
    } else if (selectedOption.name === 'Copy thread URL') {
      navigator.clipboard
        .writeText(
          `${window.location.origin}/customer_message?id=${selectedThread.value?.id_message_thread}`
        )
        .then(async () => {
          mtUtils.autoCloseAlert('URLをコピーしました。')
        })
    }
  }
}

const setFilter = async (value: {
  type_thread: number
  name_thread: string
  id_customer: string
}) => {
  if (value) {
    await customerThreadStore.fetchThreadMessages(value)
    tabPanelName.value === 'close'
      ? await init(false, false, true)
      : await init()
  } else {
    await customerThreadStore.fetchThreadMessages()
    tabPanelName.value === 'close'
      ? await init(false, false, true)
      : await init()
  }
}

const handleSendMessage = async (text: string) => {
  const messageData = {
    type_message: data.value?.typeMessage,
    message: text,
    id_customer: selectedThread.value?.id_customer,
    id_employee: data.value?.id_employee,
    room_id: selectedThread?.value?.id_message_thread,
    message_source: 1
  }
  const messageDataSend = {
    type_message: data.value?.typeMessage,
    message: text,
    id_customer: selectedThread.value?.id_customer,
    id_employee: data.value?.id_employee,
    room_id: selectedThread.value?.id_message_thread,
    datetime_insert: dayjs(),
    message_source: 1
  }

  await customerThreadStore.submitMessages(
    messageData,
    selectedThread.value?.id_message_thread
  )
  getMessages.value.push(messageDataSend)
  assignAttributesOnClick(messageDataSend)
  scrollToBottom()
  showTextAreaError.value = false
  data.value.messageTextarea = ''
}

const handleOpenMessageTemplateModal = async () => {
  let memoTask = { text: '' }
  let sendText = { text: '' }
  const customerMessageTemplates = true
  await mtUtils.mediumPopup(TemplateMessage, {
    memoTask,
    sendText,
    customerMessageTemplates
  })
  data.value.messageTextarea = sendText?.text
  if (sendText.text != '') {
    handleSendMessage(data.value.messageTextarea)
  }
  if (memoTask.text != '') {
    data.value.messageTextarea =
      data.value.messageTextarea != ''
        ? data.value.messageTextarea + '\n' + memoTask.text
        : memoTask.text
  }
}

const openMessageThreadModal = async () => {
  messageStore.selectMessage(null)
  await mtUtils.popup(UpdateMessageThreadModal)
}

const handleRefreshClick = async () => {
  await customerThreadStore.fetchThreadMessages()
  if (getThreadMessages?.value) {
    tabPanelName.value === 'close'
      ? await init(true, false, true)
      : await init()
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
  await customerThreadStore.updateThreadMessages(data?.id_message_thread, data)
  await customerThreadStore.fetchThreadMessages()
  await init()
}

const getCustomerLabel = (cusId: string) => {
  return getCustomerListOptions.value?.find((cus) => cus?.value == cusId)?.label
}

const handlePetName = (petId: string) => {
  return getCustomer.value?.pets?.find((pet) => pet?.value == petId)?.label
}

const handleFontSize = (increase: boolean) => {
  if (increase) {
    messageFontSize.value += 0.2
  } else {
    messageFontSize.value -= 0.2
  }
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

const handleDrawer = () => {
  drawer.value = !drawer.value
}
const handleCustomerName = (customerId: string) => {
  const customer = customerStore.getAllCustomers.find(
    (cus) => cus?.value == customerId
  )

  return getCustomerNameById(customer, 3)
}

const openThreadFilterModal = async () => {
  let filterData = filterThreadData.value
  let fields = { valuedTotalFields: 0 }
  let cancelFilter = { value: false }
  await mtUtils.mediumPopup(FilterCustomerThreadModal, {
    filterData,
    fields,
    cancelFilter
  })
  // if any thread type selected then it will selecte default alltype threads
  data.value.thread_Selection = 0
  // if panel is closed then it will open panel to show filtered threads
  tabPanelName.value === 'open'
    ? cancelFilter.value !== true
      ? await init(false, true)
      : await init()
    : cancelFilter.value !== true
    ? await init(false, true, true)
    : await init(false, false, true)
  filterThreadData.value = filterData
  selectedFields.value = fields.valuedTotalFields
}

const handleCancelReservation = async (threadData: MessageThreadType) => {
  const messageData = {
    type_message: data.value?.typeMessage,
    message: `予約は 病院担当者 によってキャンセルされました。\nキャンセル日時： ${getDateToday()}`,
    id_customer: selectedThread.value?.id_customer,
    id_employee: data.value?.id_employee,
    room_id: selectedThread?.value?.id_message_thread,
    type_booking_status: 5
  }
  const messageDataSend = {
    type_message: data.value?.typeMessage,
    message: `予約は 担当者 によってキャンセルされました。\nキャンセル日時： ${getDateToday()}`,
    id_customer: selectedThread.value?.id_customer,
    id_employee: data.value?.id_employee,
    room_id: selectedThread.value?.id_message_thread,
    datetime_insert: dayjs(),
    type_booking_status: 5
  }
  let confirmMsg = 'キャンセルしますか？'
  await mtUtils.confirm(confirmMsg, '確認', 'はい').then((confirmation) => {
    if (confirmation) {
      if (threadData) {
        threadData.flg_goal_achieved = true
        threadData.id_employee_achieved = data.value.id_employee
        customerThreadStore.updateThreadMessages(
          threadData?.id_message_thread,
          threadData
        )
        customerThreadStore.submitMessages(
          messageData,
          selectedThread.value?.id_message_thread
        )
        getMessages.value.push(messageDataSend)
        assignAttributesOnClick(messageDataSend)
        scrollToBottom()
      }
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    }
  })
}
const UrlPathofRedirect = (val) => {
  if (val == 50) return 'prescriptionreservationcontent'
  if (val == 60) return 'reservationcontent'
  if (val == 70) return 'salonreservationcontent'
}

const handleBookingReservation = async (threadData: MessageThreadType) => {
  const booking_status = threadData?.type_thread === 90 ? 6 : 2
  const messageData = {
    type_message: data.value?.typeMessage,
    message:
      threadData?.type_thread === 90
        ? '本件はクローズされました。\nこれ以降のメッセージはできません。'
        : '予約を作成しました。',
    id_customer: selectedThread.value?.id_customer,
    id_employee:
      threadData?.type_thread === 90 ? null : data.value?.id_employee,
    room_id: selectedThread?.value?.id_message_thread,
    type_booking_status: booking_status
  }
  const messageDataSend = {
    type_message: data.value?.typeMessage,
    message:
      threadData?.type_thread === 90
        ? '本件はクローズされました。\nこれ以降のメッセージはできません。'
        : '予約を作成しました。',
    id_customer: selectedThread.value?.id_customer,
    id_employee:
      threadData?.type_thread === 90 ? null : data.value?.id_employee,
    room_id: selectedThread.value?.id_message_thread,
    datetime_insert: getDateToday(),
    type_booking_status: booking_status
  }

  if (selectedThread?.value?.type_thread === 80) {
    if (selectedThread.value?.type_thread === 80) {
    localStorage.setItem('selectedTreat', JSON.stringify(selectedThread.value))
    } else {
      localStorage.setItem('selectedTreat', JSON.stringify(null))
    }

    mtUtils.mediumPopup(PaidConsultoReservationMaking)
  } else {
    await mtUtils.mediumPopup(ConfirmBookingModal, { 
      memoGoal: threadData.memo_goal, 
      typeThread: `${threadData.type_thread}`,
      threadData,
      messageData,
      messageDataSend,
      bookingStatus: booking_status,
      assignAttributesOnClick,
      scrollToBottom
    })
  }
}

const handleUpdateTab = async (value: string) => {
  if (value === 'open') return await init(false, false, false)
  return await init(false, false, true)
}

const getTypeThreadName = (threadTypeEnum: number) => {
  return typeCustomerThread.find((thrd) => thrd.value === threadTypeEnum)?.label
}

const handleCodeCustomerLink = async () => {
  const data = customerStore.getCustomer
  await mtUtils.popup(UpdateCustomerModal, { data })
}

const handlePetLink = async () => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: selectedThread.value?.id_customer,
    id_pet: selectedThread.value?.id_pet
  })
}

const deleteMessage = async (item: any) => {
  const id_message = item?.id_message
  let confirmMsg = 'このメッセージを削除してもよろしいですか?'
  await mtUtils
    .confirm(confirmMsg, 'このメッセージを削除しますか?', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        customerThreadStore.deleteMessages(
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
    link = `http://${domain}/MessageCustomer?mt=${item.id_message_thread}&m=${item.id_message}`
  } else {
    link = `https://${domain}/MessageCustomer?mt=${item.id_message_thread}&m=${item.id_message}`
  }
  await navigator.clipboard.writeText(link)
  mtUtils.autoCloseAlert('コピーしました。')
}

const checkURLParams = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const id_message_thread = urlParams.get('mt')
  const id_message = urlParams.get('m')
  if (id_message_thread) {
    customerThreadStore.fetchMessageThreadById(id_message_thread).then(() => {
      setSelectedThread(customerThreadStore.getRecentThreadMessage)
    })
  }
  if (id_message) {
    setTimeout(() => {
      const messageElement = document.getElementById(id_message)
      messageElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 1000)
  }
}

onMounted(async () => {
  drawerHeaderHeight = drawerHeader?.value?.offsetHeight
  let data = {}
  if (route.query?.task_id) {
    data.name_thread = route.query.task_id
  }
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [3] })
  await customerThreadStore.fetchThreadMessages(data)
  if (route.query?.id !== undefined) {
    await handleUrlThread()
    await handleMessageBoxHeight()
  } else {
    if (getThreadMessages?.value) {
      await init()
      await handleMessageBoxHeight()
    }
  }
  if (window.innerWidth <= 800) {
    drawer.value = false
    setTimeout(() => {
      handleMessageBoxHeight()
    }, 200)
  }
  checkURLParams()
})

window.addEventListener('resize', handleResizeWidth)
</script>

<template>
  <q-layout view="lHh Lpr lff" container class="window-height">
    <!-- Chat drawer -->
    <q-btn
      v-if="!drawer"
      flat
      @click="drawer = !drawer"
      round
      dense
      class="q-ml-xl fixed-top-left z-top drawerBtn"
    >
      <q-icon size="22px" name="chevron_right" />
    </q-btn>
    <MessageCustomerDrawer
      :all-type-threads="allTypeThreads"
      :drawer="drawer"
      :drawer-header-height="drawerHeaderHeight"
      :selected-fields="selectedFields"
      :selected-thread="selectedThread"
      @filter-menu-hide="setFilter"
      @handle-refresh-click="handleRefreshClick"
      @handle-drawer="handleDrawer"
      @handle-update-panel="handleUpdateTab"
      @open-thread-filter-modal="openThreadFilterModal"
      @set-selected-thread="setSelectedThread"
      @handle-flg-pinned="handleFlgPinned"
    />
    <!-- Chat room -->
    <MessageCustomerChat
      :drawer="drawer"
      :margin-left="marginLeft"
      :header-height="headerHeight"
      :message-font-size="messageFontSize"
      :message-attribute-list="messageAttributeList"
      :selected-thread="selectedThread"
      :message-text="data.messageTextarea"
      :employee-id="employeeId"
      @handle-click-bar="handleClickBar"
      @handle-code-customer-link="handleCodeCustomerLink"
      @handle-pet-link="handlePetLink"
      @handle-font-size="handleFontSize"
      @handle-refresh-click="handleRefreshClick"
      @handle-close-thread="handleCloseThread"
      @handle-open-menu="handleOpenMenu"
      @handle-booking-reservation="handleBookingReservation"
      @handle-cancel-reservation="handleCancelReservation"
      @handle-open-message-template-modal="handleOpenMessageTemplateModal"
      @handle-flg-pinned="handleFlgPinned"
      @handle-send-message="handleSendMessage"
      @copy-message-link="copyMessageLink"
      @delete-message="deleteMessage"
      @scroll-to-bottom="scrollToBottom"
    />
  </q-layout>
</template>
