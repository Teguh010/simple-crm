<script setup lang="ts">
import { computed, ref, withDefaults, onMounted, onUpdated } from 'vue'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { MessageType, MessageThreadType } from '@/types/types'
import mtUtils from '@/utils/mtUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import TemplateMessage from './TemplateMessage.vue'
import {
  aahUtilsGetEmployeeName,
  decoder,
  formatHoursMinutes,
  getCustomerLabelColor,
  timeDifferences,
  dateFormat
} from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import useThreadCustomer from '@/stores/message-customer'
import useEmployeeStore from '@/stores/employees'
import { typeCustomerThread } from '@/utils/enum'
// import { marked } from 'marked'

type MessageAttributeListType = {
  index: number
  id: string
  isASingleEmoji: boolean
  showTimestamp: boolean
  isStartToday: boolean
  isStartYesterday: boolean
  isDayStartSeparator: boolean | null
}

const props = withDefaults(
  defineProps<{
    drawer: boolean
    marginLeft: number
    messageFontSize: number
    messageAttributeList: MessageAttributeListType[]
    selectedThread: MessageThreadType
    employeeId: string
    messageText: string
    headerHeight: number
  }>(),
  {
    drawer: false,
    marginLeft: 0,
    headerHeight: 0,
    messageAttributeList: () => {
      return [] as MessageAttributeListType[]
    },
    selectedThread: () => {
      return {} as MessageThreadType
    }
  }
)

const emits = defineEmits<{
  (e: 'handleClickBar', value: string): void
  (e: 'handleCodeCustomerLink'): void
  (e: 'handlePetLink'): void
  (e: 'handleFontSize', value: boolean): void
  (e: 'handleRefreshClick'): void
  (e: 'handleCloseThread', value: MessageThreadType): void
  (e: 'handleFlgPinned', value: MessageThreadType): void
  (e: 'handleOpenMenu'): void
  (e: 'handleBookingReservation', value: MessageThreadType): void
  (e: 'handleCancelReservation', value: MessageThreadType): void
  (e: 'handleOpenMessageTemplateModal'): void
  (e: 'handleSendMessage', value: string): void
  (e: 'copyMessageLink', value: MessageType): void
  (e: 'deleteMessage', value: MessageType): void
  (e: 'scrollToBottom'): void
}>()

// const renderer = new marked.Renderer()

// renderer.list = function (body, ordered, start) {
//   const temp = "<h3 class='text-h3'>${body}</h3>"

//   return temp
// }

const today = new Date()
const employeeId = JSON.parse(localStorage?.getItem('id_employee') ?? '')
const customerStore = useCustomerStore()
const customerThreadStore = useThreadCustomer()
const employeeStore = useEmployeeStore()
const { getAllEmployees } = storeToRefs(employeeStore)
const { getThreadMessages, getMessages } = storeToRefs(customerThreadStore)
const { getCustomerListOptions, getCustomer } = storeToRefs(customerStore)
const sendMessage = ref('')
const selectedMessage = ref('')
const messageBox = ref()
const headerElement = ref()
const headerHeight = ref(0)
const footerElement = ref()
const footerHeight = ref(0)
const showScrollToBottom = ref(false)
const lastIndexOf = ref(0)
const showTextAreaError = computed(() => {
  if (sendMessage.value.length >= 1000) return true
  return false
})

const messageCounter = computed(() => {
  return sendMessage.value.length
})

const handleClickBar = (value: string) => {
  emits('handleClickBar', value)
}

const handleCodeCustomerLink = () => {
  emits('handleCodeCustomerLink')
}

const handlePetLink = () => {
  emits('handlePetLink')
}

const handleFontSize = (value: boolean) => {
  emits('handleFontSize', value)
}

const handleCloseThread = (value: MessageThreadType) => {
  emits('handleCloseThread', value)
}

const handleFlgPinned = (value: MessageThreadType) => {
  emits('handleFlgPinned', value)
}

const handleBookingReservation = (value: MessageThreadType) => {
  emits('handleBookingReservation', value)
}

const handleCancelReservation = (value: MessageThreadType) => {
  emits('handleCancelReservation', value)
}

const handleRefreshClick = () => {
  emits('handleRefreshClick')
}

const handleOpenMenu = () => {
  emits('handleOpenMenu')
}

const copyMessageLink = (data: MessageType) => {
  emits('copyMessageLink', data)
}

const deleteMessage = (data: MessageType) => {
  emits('deleteMessage', data)
}

const scrollToBottom = () => {
  emits('scrollToBottom')
}

const selectMessage = (messageId: string) => {
  // if a user clicks the same message twice, then deselect the message
  if (selectedMessage.value === messageId) {
    selectedMessage.value = ''
    return selectedMessage.value
  }

  selectedMessage.value = messageId
  return selectedMessage.value
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
  sendMessage.value = sendText?.text
  if (sendText.text != '') {
    handleSendMessage()
  }
  if (memoTask.text != '') {
    sendMessage.value =
      sendMessage.value != ''
        ? sendMessage.value + '\n' + memoTask.text
        : memoTask.text
  }
}

const handleSendMessage = () => {
  if (sendMessage.value.length >= 1000)
    return mtUtils.autoCloseAlert(
      "最大文字数は1000文字です",
      'Error'
    )
  emits('handleSendMessage', sendMessage.value)
  sendMessage.value = ''
}

const getEmployeeName = (empId: string) => {
  return aahUtilsGetEmployeeName(getAllEmployees.value, empId)
}

const getTypeThreadName = (threadTypeEnum: number) => {
  return typeCustomerThread.find((data) => data.value === threadTypeEnum)?.label
}

const getCustomerLabel = (cusId: string) => {
  return getCustomerListOptions.value?.find((cus) => cus?.value == cusId)?.label
}

const handleCustomerTypeLabelColor = (customerId: string) => {
  if (!customerId) return false
  const customer = customerStore.getAllCustomers.find(
    (cus) => cus?.value == customerId
  )
  return customer && customer?.type_customer_color
    ? getCustomerLabelColor(customer?.type_customer_color)
    : null
}

const getPetName = (petId: string) => {
  return getCustomer.value?.pets?.find((pet) => pet?.value == petId)?.label
}

const isUnderTenMins = (message: MessageType) => {
  const msgTime = message.datetime_insert
  const diff = timeDifferences(today, msgTime, 'minutes')
  const isToday = dayjs(message?.datetime_insert).isToday()

  if (isToday && diff <= 10) {
    return true
  } else {
    return false
  }
}

const handleShowScrollToBottom = (data: any) => {
  const { clientHeight, scrollHeight, scrollTop } = data.target
  const totalHeight = clientHeight + scrollTop
  if (totalHeight < scrollHeight - 1) {
    showScrollToBottom.value = true
    return showScrollToBottom.value
  }
  showScrollToBottom.value = false
  return showScrollToBottom.value
}
window.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key == 'Enter') {
    handleSendMessage()
  }
})

const htmlStringPurify = (val: string, date: string) => {
  const lines = val.split('\n')
  let result = []
  let currentTitle = ''

  result.push(`
    <div class="memo-row">
      <div class="memo-label">
        <h3>受付日</h3>
      </div>
      <div class="memo-value">
        <h3>${date}</h3>
      </div>
    </div>
  `)

  lines.forEach((line, index) => {
    if (line.startsWith('###')) {
      currentTitle = line.slice(3).trim()
    } else if (currentTitle) {
      const value = line.includes('undefined') ? '--' : line.trim()

      if (currentTitle === 'ペットのお名前') {
        currentTitle = '' 
        return
      }

      result.push(`
        <div class="memo-row">
          <div class="memo-label">
            <h3>${currentTitle}</h3>
          </div>
          <div class="memo-value">
            <h3>${value}</h3>
          </div>
        </div>
      `)

      currentTitle = ''
    }
  })

  return result.join('')
}

const handlesendseen = () => {
  let data = getMessages.value
  for (let index = 0; index <= data.length; index++) {
    const ele = data[index]
    if (ele?.id_employee) {
      lastIndexOf.value = index
    }
  }
}
const handleIdEmployee = (itemEmpId, empId) => {
  if (typeof(itemEmpId) === 'string') {
    return parseInt(itemEmpId) === empId
  } else{
    return itemEmpId === empId
  }
}
const getIdEployeeInInt = (item:any) => {
  return typeof(item?.id_employee) === 'string' ? parseInt(item?.id_employee) : item?.id_employee
}
onMounted(() => {
  handlesendseen()
})

onUpdated(() => {
  handlesendseen()
})
</script>

<template>
  <q-page-container class="bg-grey-100">
    <q-page :class="!selectedThread ? 'flex items-center justify-center' : ''">
      <div
        ref="headerElement"
        v-if="selectedThread?.id_message_thread"
        class="relative-position bg-grey-100 full-width"
      >
        <div class="row no-wrap items-center justify-between q-px-md q-py-sm">
          <div
            :class="!drawer ? 'q-ml-xl' : ''"
            class="flex no-wrap text-grey-900 text-left ellipsis"
          >
            <span
              v-if="selectedThread?.type_thread"
              class="q-ml-sm text-grey-700 border-outline-600 q-px-md"
            >
              {{ getTypeThreadName(selectedThread?.type_thread) }}
            </span>
            <span class="q-ml-sm text-black threadNameBox">
              <!--Show icon for either "urgent" or "closed" if applicable-->
              <span
                v-if="selectedThread?.flg_closed"
                class="q-mr-xs text-grey-800 bold"
              >
                <q-icon name="do_disturb_on" size="20px" class="q-pr-xs" />
                [ 対応終了 ]
              </span>
              <span
                v-if="selectedThread?.flg_urgent"
                class="q-mr-xs text-negative bold"
              >
                <q-icon name="run_circle" size="20px" class="q-pr-xs" />
                [ 至急 ]
              </span>
              {{ selectedThread?.name_thread }}
            </span>
          </div>
          <div class="refreshToPinBox">
            <div class="flex no-wrap items-center justify-end">
              <q-btn
                :disable="messageFontSize.toFixed(1) === '0.9'"
                @click="handleFontSize(false)"
                text-color="black"
                padding="3px"
                unelevated
              >
                <q-icon size="20px" name="chevron_left" />
              </q-btn>
              <q-btn
                :disable="messageFontSize.toFixed(1) === '1.5'"
                @click="handleFontSize(true)"
                text-color="black"
                padding="3px"
                unelevated
              >
                <q-icon size="20px" name="chevron_right" />
              </q-btn>
              <q-btn
                @click="handleRefreshClick"
                round
                unelevated
                text-color="black"
                padding="3px"
              >
                <q-icon size="20px" name="refresh" />
              </q-btn>
              <q-btn
                v-if="!selectedThread.flg_closed"
                round
                unelevated
                :text-color="
                  selectedThread?.flg_emr_pinned ? 'grey-400' : 'grey-800'
                "
                padding="3px"
                :disable="selectedThread?.flg_closed"
                @click="handleFlgPinned(selectedThread)"
              >
                <q-icon size="18px" name="push_pin" />
              </q-btn>
              <q-btn
                round
                unelevated
                text-color="black"
                padding="3px"
                @click="handleOpenMenu"
              >
                <q-icon size="20px" name="more_horiz" />
              </q-btn>
            </div>
          </div>
        </div>
        <!-- Customer and Pet information -->
        <div
          ref="headerContainer"
          class="row no-wrap q-py-xs q-px-lg items-center justify-center bg-grey-800"
        >
          <q-btn
            unelevated
            padding="1px"
            class="left-button bg-grey-700 q-mr-auto q-mt-auto"
            @click="handleClickBar('scrollLeft')"
            round
          >
            <q-icon name="chevron_left" color="white" size="20px" />
          </q-btn>
          <div ref="overflowDiv" class="thread-info-header">
            <div :style="{ marginLeft: `${marginLeft}px` }" ref="overflowLeft">
              <div class="flex no-wrap items-end text-grey-100">
                <span
                  class="q-pl-lg"
                  v-if="getCustomerLabel(selectedThread?.id_customer)"
                  >オーナー：</span
                >
                <span
                  @click="handleCodeCustomerLink"
                  class="cursor-pointer linkColor"
                >
                  {{ getCustomerLabel(selectedThread?.id_customer) }}
                </span>
                <span>
                  <q-icon
                    v-if="
                      handleCustomerTypeLabelColor(selectedThread?.id_customer)
                    "
                    size="13px"
                    name="circle"
                    class="q-ml-xs"
                    :color="
                      handleCustomerTypeLabelColor(selectedThread?.id_customer)
                    "
                  />
                </span>
                <span v-if="getPetName(selectedThread?.id_pet)">
                  <span class="q-pl-lg">ペット：</span>
                  <span @click="handlePetLink" class="cursor-pointer linkColor">
                    {{ getPetName(selectedThread?.id_pet) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
          <q-btn
            unelevated
            padding="1px"
            class="right-button q-ml-auto q-mt-auto bg-grey-700"
            @click="handleClickBar('scrollRight')"
            round
          >
            <q-icon name="chevron_right" color="white" size="20px" />
          </q-btn>
        </div>
      </div>
      <template v-if="selectedThread?.id_message_thread">
        <div class="q-px-lg bg-grey-100">
          <div
            ref="messageBox"
            id="messageBox"
            class="chat-blk"
            @scroll.native="handleShowScrollToBottom"
          >
            <div
              v-if="selectedThread?.memo_goal"
              class="goal_memo q-py-lg"
              :style="`font-size:${messageFontSize.toFixed(1)}em`"
            >
              <div class="goal_memo_text">
                 <h3>
                  {{selectedThread?.name_thread}}
                </h3>
                <div
                  class="memo"
                  v-html="htmlStringPurify(selectedThread.memo_goal, dateFormat(selectedThread?.datetime_insert))"
                ></div>
              </div>
            </div>
            <div
              v-if="selectedThread?.type_thread === 90"
              class="specialMessageBox q-mt-lg q-pa-sm bg-51BB41 cursor-pointer"
              @click="handleBookingReservation(selectedThread)"
            >
              <span
                class="specialMessageTxt text-white"
                :style="`font-size:${messageFontSize.toFixed(1)}em`"
                >有料相談の依頼が入りました。
                <br />オーナー様から相談内容が届いたら返信をしてください。</span
              >
            </div>
            <div v-else>
              <div
                v-if="!selectedThread?.flg_goal_achieved"
                class="specialMessageBox q-mt-lg q-pa-sm bg-51BB41 cursor-pointer"
                @click="handleBookingReservation(selectedThread)"
              >
                <span
                  class="specialMessageTxt text-white"
                  :style="`font-size:${messageFontSize.toFixed(1)}em`"
                  >予約の依頼が入りました。
                  <br />日付の確認を行い、オーナー様へ返信してください。</span
                >
              </div>
            </div>
            <div
              v-if="getMessages"
              v-for="(item, index) in getMessages"
              :key="index"
              class="chat-bubble"
            >
              <div
                v-if="
                  messageAttributeList[index]?.isDayStartSeparator !== null ||
                  messageAttributeList[index]?.isStartToday ||
                  messageAttributeList[index]?.isStartYesterday
                "
                class="flex flex-center no-wrap full-width file-divider q-my-lg"
              >
                <span class="line"></span>
                <span
                  v-if="
                    messageAttributeList[index]?.isDayStartSeparator !== null
                  "
                  class="text dateLetterSpacing q-pa-sm"
                >
                  {{ messageAttributeList[index]?.isDayStartSeparator }}
                </span>
                <span
                  v-if="messageAttributeList[index]?.isStartToday"
                  class="text dateLetterSpacing q-pa-sm"
                  >今日</span
                >
                <span
                  v-if="messageAttributeList[index]?.isStartYesterday"
                  class="text dateLetterSpacing q-pa-sm"
                  >昨日</span
                >
                <span class="line"></span>
              </div>
              <div
                v-if="
                  item?.message?.includes(
                    'によってキャンセルされました。\nキャンセル日時'
                  )
                "
                class="specialMessageBox q-mt-lg q-pa-sm bg-F7E3EF"
              >
                <span
                  class="specialMessageTxt"
                  :style="`font-size:${messageFontSize.toFixed(1)}em`"
                >
                  {{ item?.message }}</span
                >
              </div>
              <div
                v-else-if="item?.message?.includes('予約を作成しました。')"
                class="specialMessageBox q-mt-lg q-pa-sm bg-51BB41"
              >
                <span
                  class="specialMessageTxt text-white"
                  :style="`font-size:${messageFontSize.toFixed(1)}em`"
                >
                  {{ item?.message }}</span
                >
              </div>
              <div
                v-else-if="
                  item?.message ===
                  '本件はクローズされました。\nこれ以降のメッセージはできません。'
                "
                class="specialMessageBox q-mt-lg q-pa-sm bg-grey-300"
              >
                <span
                  class="specialMessageTxt text-black"
                  :style="`font-size:${messageFontSize.toFixed(1)}em`"
                  >{{ item?.message }}</span
                >
              </div>
              <div
                :class="
                  item?.id_employee ? 'justify-end items-end' : 'items-center'
                "
                class="flex no-wrap"
              >
                <div v-if="item?.id_message === selectedMessage">
                  <q-btn
                    :ripple="true"
                    @click="deleteMessage(item)"
                    v-if="
                      isUnderTenMins(item) &&
                      item?.id_employee !== props.employeeId
                    "
                    padding="2px"
                    class="q-ml-xs deleteBtn"
                    unelevated
                  >
                    <q-icon name="cancel" size="22px" />
                  </q-btn>
                  <q-btn
                    :ripple="true"
                    @click="copyMessageLink(item)"
                    v-if="item?.id_employee !== props.employeeId"
                    padding="2px"
                    class="q-ml-xs copyBtn"
                    unelevated
                  >
                    <q-icon name="link" size="22px" />
                  </q-btn>
                </div>
                <div class="text-right" v-if="item?.id_employee">
                  <!-- <q-icon v-if="item?.id_employee && index === lastIndexOf && item?.flg_is_read" class="text-grey-600 eye-icon" name="visibility"/> -->
                  <div
                    class="text-grey-600 eye-icon"
                    v-if="
                      item?.id_employee &&
                      index === lastIndexOf &&
                      item?.flg_is_read
                    "
                  >
                    既読
                  </div>
                </div>
                <q-chat-message
                  class="groupchat"
                  :id="item.id_message"
                  v-if="
                    !item?.message?.includes(
                      'によってキャンセルされました。\nキャンセル日時'
                    ) &&
                    item?.message !== '予約を作成しました。' &&
                    item?.message !==
                      '本件はクローズされました。\nこれ以降のメッセージはできません。'
                  "
                  :name="
                    messageAttributeList[index]?.showTimestamp &&
                    item?.datetime_insert && handleIdEmployee(item?.id_employee, employeeId)
                      ? getEmployeeName(getIdEployeeInInt(item)) +
                        ', ' +
                        formatHoursMinutes(item?.datetime_insert)
                      : messageAttributeList[index]?.showTimestamp &&
                        item?.datetime_insert < 1 && handleIdEmployee(item?.id_employee, employeeId)
                      ? getEmployeeName(item?.id_employee)
                      : messageAttributeList[index]?.showTimestamp &&
                        item?.datetime_insert &&
                        item?.id_employee !== employeeId
                      ? getCustomerLabel(item?.id_customer) +
                        ', ' +
                        formatHoursMinutes(item?.datetime_insert)
                      : messageAttributeList[index]?.showTimestamp &&
                        item?.datetime_insert < 1 &&
                        item?.id_employee !== employeeId
                      ? getCustomerLabel(item?.id_customer)
                      : ''
                  "
                  :style="`font-size:${messageFontSize.toFixed(
                    1
                  )}em; width:auto`"
                  :sent="handleIdEmployee(item?.id_employee, employeeId)"
                  :class="
                    item?.id_file?.file_url?.length > 0
                      ? 'sendedImageDiv'
                      : messageAttributeList[index]?.isASingleEmoji
                      ? 'emojiMsg'
                      : handleIdEmployee(item?.id_employee, employeeId) &&
                        item?.message?.length > 250
                      ? 'longSend'
                      : handleIdEmployee(item?.id_employee, employeeId)&&
                        item?.message?.length <= 50
                      ? 'shortSend'
                      : handleIdEmployee(item?.id_employee, employeeId) &&
                        item?.message?.length > 50
                      ? 'mediumSend'
                      : item?.id_employee !== employeeId &&
                        item?.message?.length > 250
                      ? 'longRecieved'
                      : item?.id_employee !== employeeId &&
                        item?.message?.length <= 50
                      ? 'shortRecieved'
                      : item?.image_path1
                      ? 'sendedImageDiv'
                      : 'mediumRecieved'
                  "
                >
                  <div
                    v-if="
                      messageAttributeList[index]?.isASingleEmoji ||
                      item?.message
                    "
                    :class="
                      messageAttributeList[index]?.isASingleEmoji
                        ? 'single-emoji'
                        : ''
                    "
                  >
                    <div
                      v-if="item?.message"
                      class="cursor-pointer"
                      v-html="decoder(item?.message)"
                      @click="selectMessage(item?.id_message)"
                    />
                  </div>
                  <div
                    v-if="item?.image_path1"
                    class="showUploadedImage sendedImageDiv"
                  >
                    <q-img :src="item?.image_path1"></q-img>
                  </div>
                </q-chat-message>
                <div v-if="item?.id_message === selectedMessage">
                  <q-btn
                    v-if="
                      isUnderTenMins(item) &&
                      item?.id_employee === props.employeeId
                    "
                    :ripple="true"
                    padding="2px"
                    class="q-ml-xs deleteBtn"
                    unelevated
                    @click="deleteMessage(item)"
                  >
                    <q-icon name="cancel" size="22px" />
                  </q-btn>
                  <q-btn
                    v-if="item?.id_employee === props.employeeId"
                    :ripple="true"
                    padding="2px"
                    class="q-ml-xs copyBtn"
                    unelevated
                    @click="copyMessageLink(item)"
                  >
                    <q-icon name="link" size="22px" />
                  </q-btn>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          v-if="selectedThread"
          ref="footerElement"
          class="relative-position bg-grey-100 footerBox"
        >
          <div class="message-input" :class="{ error: showTextAreaError }">
            <MtInputForm
              v-model="sendMessage"
              autogrow
              type="textarea"
              classStyle="input-message-text"
              :borderless="true"
              :disable="selectedThread?.flg_closed"
              placeholder="メッセージ..."
            />
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
          <div class="row q-mx-auto q-mb-md q-mt-lg">
            <div
              v-if="
                !selectedThread?.flg_goal_achieved ||
                selectedThread?.type_booking_status !== 5 ||
                selectedThread?.type_booking_status !== 6
              "
              :class="{
                'col-10': !selectedThread?.flg_goal_achieved,
                'col-6': selectedThread?.flg_goal_achieved
              }"
            >
              <div class="btn-action-message-container">
                <q-btn
                  v-if="selectedThread?.type_thread !== 90 && !selectedThread?.flg_closed"
                  :tabindex="1"
                  unelevated
                  class="bg-grey-800 text-white btn-action-message"
                  @click="handleCancelReservation(selectedThread)"
                >
                  <span class="btn-label">予約キャンセル</span>
                  <q-icon class="btn-icon" name="check_circle" />
                </q-btn>
                <q-btn
                  v-if="selectedThread?.type_thread !== 90 && !selectedThread?.flg_closed"
                  :tabindex="2"
                  unelevated
                  flat
                  class="bg-accent-900 text-white btn-action-message"
                  @click="handleBookingReservation(selectedThread)"
                >
                  <span class="btn-label"> 予約確定</span>
                  <q-icon class="btn-icon" name="cancel_schedule_send" />
                </q-btn>
                <q-btn
                  v-if="
                    selectedThread?.type_thread === 90 &&
                    !selectedThread?.flg_closed
                  "
                  :tabindex="2"
                  unelevated
                  flat
                  class="bg-accent-900 text-white btn-action-message"
                  @click="handleBookingReservation(selectedThread)"
                >
                  <span class="btn-label">相談終了</span>
                  <q-icon class="btn-icon" name="cancel_schedule_send" />
                </q-btn>
                <!-- <q-btn
                  unelevated
                  :tabindex="3"
                  bg-color="white"
                  flat
                  class="btn-action-message btn-template-message"
                  @click="handleOpenMessageTemplateModal"
                  :disable="selectedThread?.flg_closed"
                >
                  <q-icon name="comment_bank" class="text-grey-800" />
                </q-btn> -->
              </div>
            </div>
            <div
              :class="{
                'col-2': !selectedThread?.flg_goal_achieved,
                'col-6': selectedThread?.flg_goal_achieved
              }"
            >
              <div class="btn-action-message-container justify-end">
                <q-btn
                  v-if="
                    selectedThread?.flg_goal_achieved ||
                    selectedThread?.type_booking_status === 5
                  "
                  :tabindex="4"
                  unelevated
                  text-color="white"
                  class="btn-action-message bg-grey-600"
                  @click="handleCloseThread(selectedThread)"
                  :disable="selectedThread?.flg_closed"
                >
                  <span class="btn-label">クローズ</span>
                  <q-icon class="btn-icon" name="cancel_schedule_send" />
                </q-btn>
                <q-btn
                  :tabindex="0"
                  outlined
                  unelevated
                  class="btn-action-message btn-send bg-grey-800 text-white"
                  :disable="
                    selectedThread?.flg_closed ||
                    showTextAreaError ||
                    selectedThread?.type_booking_status === 5
                  "
                  @click="handleSendMessage"
                >
                  <span class="btn-label">送信</span>
                  <q-icon class="btn-icon" name="send" />
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div>
        <div class="column full-width flex-center" v-if="!selectedThread">
          <!-- <img
            src="@/assets/img/login/aah_logo.svg"
            alt="logo"
            class="logoImage"
          /> -->
          {{ 'メッセージを投稿しましょう！' }}
        </div>
      </div>
    </q-page>
  </q-page-container>
  <span class="scroll-to-bottom-btn" :class="{ show: showScrollToBottom }">
    <q-btn color="primary" @click="scrollToBottom">
      <q-icon size="22px" name="vertical_align_bottom" />
    </q-btn>
  </span>
</template>

<style lang="scss" scoped>
// Message CSS Start

.chat-blk {
  width: 98%;
  overflow-y: scroll;
  overflow-x: hidden;
  padding: 12px;
  height: 100vh;
  max-height: calc(100vh - 300px);
}
.chat-blk::-webkit-scrollbar {
  margin-left: 15px;
  width: 14px;
}
.chat-blk::-webkit-scrollbar-thumb {
  border: 4px solid rgba(0, 0, 0, 0);
  background-clip: padding-box;
  border-radius: 9999px;
  background-color: #aaaaaa;
}
.chat-bubble {
  padding: 0px 0;
}
:deep(.q-message-text) {
  padding: 14px;
  font-weight: 300;
  max-width: 248px;

  &:last-child {
    min-height: 62px;
  }
}
.refreshToPinBox {
  width: 100%;
  max-width: max-content;
  min-width: max-content;
}
.date-divider {
  text-align: center;
  position: relative;

  &::before {
    content: '';
    display: inline-block;
    position: absolute;
    bottom: 9px;
    left: 0;
    width: 100%;
    border-bottom: 1px solid #989898;
  }

  span {
    display: inline-block;
    position: relative;
    padding: 0 20px;
    background: #f5f5f5;
    font-size: 12px;
    color: #848484;
    font-weight: 300;
  }
}
:deep(.message-textarea) {
  .q-field__control {
    height: 90px;
  }
}
.drawerBtn {
  margin-top: 10px;
  margin-left: 40px;
}
.drawerHeaderBox {
  width: 349px;
}
.scrollBox {
  height: 80%;
  border-top: 1px solid #dddd;
}
.message-input {
  &.error {
    background: #ffe6e6;
  }
  min-height: 120px;
  max-height: 300px;
  border: 1px solid #e7e7e7;
  padding: 0px 15px 0px 15px;
  background: white;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  overflow-y: scroll;
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
  position: relative;
  .message-within-controls {
    .mb-10px-btn {
      margin-bottom: 10px;
    }
  }
}
.message-text-counter {
  .error {
    color: $darkRed;
    font-weight: bold;
  }
}
.message-input::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
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
.footerBox {
  bottom: 0px;
  width: 100%;
  margin: 0;
  padding: 0 32px;
}
.width93 {
  width: 93%;
}
.reservationBtnBox {
  min-width: 350px;
}
.sendBtnBox {
  margin-left: auto;
  max-width: max-content;
  min-width: max-content;
}
.goal_memo_text {
  line-height: 1;
  text-align: center;
  color: #576100 !important;
  .memo {
    h3 {
      font-size: 18px !important;
      font-weight: bold !important;
      line-height: 1 !important;
    }
  }
}
.goal_memo {
  width: 70%;
  background-color: #efefd2 !important;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto 15px auto;
  overflow: hidden;
}
.file-divider {
  .line {
    flex-grow: 1;
    border: 1px solid #dddddd;
  }
  .text {
    margin: 0px 5px !important;
    font-size: 12px;
    color: #868686;
  }
}
.linkColor {
  color: #91c8fc;
}
.dateLetterSpacing {
  letter-spacing: 1px;
}
.specialMessageBox {
  width: 70%;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 10px auto 15px auto;
  overflow: hidden;
}
.specialMessageTxt {
  max-width: 100%;
  line-height: 2;
  text-align: center;
  white-space: pre-wrap;
}
.sendedImageDiv {
  :deep(.q-message-text) {
    padding: 0px;
    font-weight: 300;
    max-width: 600px;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 0px 20px;
      background-color: transparent !important;
    }
  }
  .imageSize {
    width: 80px;
    height: 80px;
    border-radius: 5px;
  }
  .lasImag {
    position: absolute;
    top: 13px;
    bottom: 0;
    width: 80px;
    height: 80px;
    opacity: 0.7;
    border-radius: 4px;
    font-size: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: black;
    color: white;
  }
}
.emojiMsg {
  :deep(.q-message-text) {
    max-width: 500px;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 0px 20px;
      background-color: transparent !important;
    }
  }
}
.shortSend {
  :deep(.q-message-text) {
    margin-top: 5px;
    padding: 14px;
    line-height: 1.6;
    font-weight: 300;
    max-width: 250px;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 0px 20px;
      background-color: #bff1ff;
    }
  }
  :deep(.q-message-text--send) {
    color: black;
  }
}
.mediumSend {
  :deep(.q-message-text) {
    margin-top: 5px;
    padding: 14px;
    line-height: 1.6;
    font-weight: 300;
    max-width: 400px;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 0px 20px;
      background-color: #bff1ff;
    }
  }
  :deep(.q-message-text--send) {
    color: black;
  }
}
.longSend {
  :deep(.q-message-text) {
    margin-top: 5px;
    padding: 14px;
    line-height: 1.6;
    font-weight: 300;
    max-width: 700px;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 0px 20px;
      background-color: #bff1ff;
    }
  }
  :deep(.q-message-text--send) {
    color: black;
  }
}
.longRecieved {
  margin-top: 5px;
  padding: 14px;
  font-size: 12px;
  font-weight: 300;
  max-width: 700px;
  color: #888;
  :deep(.q-message-text) {
    line-height: 1.6;
    margin-top: 5px;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 20px 0px;
      background-color: #c9c9c9 !important;
    }
  }
  :deep(.q-message-text--send) {
    color: black;
  }
}
.mediumRecieved {
  margin-top: 5px;
  padding: 14px;
  font-size: 12px;
  font-weight: 300;
  max-width: 400px;
  color: #888;
  :deep(.q-message-text) {
    margin-top: 5px;
    line-height: 1.6;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 20px 0px;
      background-color: #c9c9c9 !important;
    }
  }
  :deep(.q-message-text--send) {
    color: black;
  }
}
.shortRecieved {
  margin-top: 5px;
  padding: 14px;
  font-weight: 300;
  max-width: 250px;
  color: #888;
  :deep(.q-message-text) {
    margin-top: 5px;
    line-height: 1.6;
    &:last-child::before {
      display: none !important;
    }
    &:last-child {
      border-radius: 20px 20px 20px 0px;
      background-color: #c9c9c9 !important;
    }
  }
  :deep(.q-message-text--send) {
    color: black;
  }
}
.single-emoji {
  font-size: 70px !important;
  padding: 0px !important;
  background-color: transparent !important;
  border-radius: 0 !important;
  transform: translateX(2px);
}
.logoImage {
  width: 224px;
  height: 39px;
}
.threadNameBox {
  width: 80%;
  text-overflow: ellipsis;
  overflow: hidden;
}
.maxWidth {
  max-width: max-content;
}
.thredinfoHeader {
  width: 97%;
  overflow: hidden;
}
.overflowLeftBox {
  display: flex !important;
  flex-wrap: nowrap !important;
  text-wrap: nowrap !important;
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

.btn-action-message-container {
  display: flex;
  align-items: center;
  gap: 16px;
  .btn-action-message {
    padding: 7px 48px;
    &.btn-send {
      border: 1px solid #c7c7c7;
    }
    .btn-label {
      @media screen and (max-width: 500px) {
        display: none;
      }
      @media screen and (min-width: 575px) {
        display: inline;
      }
    }
    .btn-icon {
      @media screen and (max-width: 500px) {
        display: inline;
      }
      @media screen and (min-width: 575px) {
        display: none;
      }
    }
    @media screen and (max-width: 500px) {
      padding: 7px 14px;
    }
    @media screen and (min-width: 500px) and (max-width: 800px) {
      padding: 7px 32px;
    }
  }
}
.scroll-to-bottom-btn {
  &.show {
    display: inline-block;
    text-align: center;
  }
  display: none;
  position: absolute;
  width: 120px;
  z-index: 5;
  @media screen and (min-width: 300px) and (max-width: 400px) {
    bottom: 30%;
    right: 12px;
  }
  @media screen and (min-width: 400px) {
    bottom: 25%;
    right: 12px;
  }
  @media screen and (min-width: 1024px) {
    bottom: 20%;
    right: 12px;
  }
  @media screen and (min-width: 1366px) {
    bottom: 25%;
    right: 12px;
  }
  @media screen and (min-width: 1500px) {
    bottom: 28%;
    right: 12px;
  }
}

.groupchat {
  padding: 0 !important;
  margin: 0 !important;
}
.q-message-container {
  margin: 0 !important;
}
.eye-icon {
  /* margin: 0 -32px -50px 0;*/
  margin: 0px 5px 0px 0px;
  z-index: 1;
}

.showUploadedImage img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showUploadedImage {
  width: 220px;
  height: auto;
}
</style>
