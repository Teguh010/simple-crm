<script setup lang="ts">
import { ref, withDefaults } from 'vue'
import { aahUtilsGetEmployeeName, decoder, formatHoursMinutes, timeDifferences } from '@/utils/aahUtils'
import ViewMessageFile from './ViewMessageFile.vue'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'
import { FileType, MessageAttributeListType, MessageImageFileType, MessageThreadType, MessageType } from '@/types/types'
import useEmployeeStore from '@/stores/employees'
import useMessageStore from '@/stores/message-clinic'

type PropsDataType = {
  type_department: number
  typeMessage: number
  messageTextarea: string
  id_file: null
  id_employee: string
  name_employee: string
  id_employee_insert: string
  filedata: []
}

const today = new Date()
const selectedMessage = ref('')
const employeeStore = useEmployeeStore()
const messageStore = useMessageStore()
const { getMessages } = storeToRefs(messageStore)
const messageBox = ref()
const windowInnerHeight = ref(window.innerHeight)
const showScrollToBottom = ref(false)

const props = withDefaults(
  defineProps<{
    allTypeThreads: MessageThreadType[]
    data: PropsDataType
    messageAttributeList: MessageAttributeListType[]
    headerElementHeight: number
    messageFontSize: number
    chatMessageHeight: number
    employeeId: string
    selectedThread: MessageThreadType
  }>(),
  {
    allTypeThreads: () => {
      return [] as MessageThreadType[]
    },
    data: () => {
      return {} as PropsDataType
    },
    messageAttributeList: () => {
      return [] as MessageAttributeListType[]
    },
    headerElementHeight: 0,
    messageFontSize: 0,
    chatMessageHeight: 0,
    employeeId: ''
  }
)

const emits = defineEmits<{
  (e: 'copyMessageLink', value: MessageType): void
  (e: 'deleteMessage', value: MessageType): void
  (
    e: 'openImageViewModal',
    path: FileType[] | string,
    index: number,
    singleImage: boolean
  ): void
  (e: 'scrollToBottom'): void
}>()

const copyMessageLink = (data: MessageType) => {
  emits('copyMessageLink', data)
}

const deleteMessage = (data: MessageType) => {
  emits('deleteMessage', data)
}

const scrollToBottom = () => {
  emits('scrollToBottom')
}

const openImageViewModal = (
  path: FileType[] | string,
  index: number,
  singleImage: boolean
) => {
  emits('openImageViewModal', path, index, singleImage)
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

const handleEmpName = (empId: string) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const handleShowScrollToBottom = (data: any) => {
  const { clientHeight, scrollHeight, scrollTop } = data.target
  const totalHeight = clientHeight + scrollTop
  if (totalHeight < scrollHeight) {
    showScrollToBottom.value = true
    return showScrollToBottom.value
  }
  showScrollToBottom.value = false
  return showScrollToBottom.value
}

const downloadPdfFile = (item: MessageImageFileType) => {
  const a = document.createElement('a')
  a.href = item.file_url
  a.download = a.href
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<template>
  <div
    ref="messageBox"
    id="messageBox"
    class="chat-blk"
    :style="{
      maxHeight: `calc(100vh - ${
        props.data.typeMessage === 1
          ? props.chatMessageHeight
          : props.headerElementHeight + 35
      }px)`
    }"
    @scroll.native="handleShowScrollToBottom"
  >
    <div
      v-if="selectedThread?.memo_goal"
      class="goal_memo q-mt-xl q-pa-sm"
      :style="`font-size: ${messageFontSize.toFixed(1)}em`"
    >
      <div class="goal_memo_text">
        スレッド目的：<br />
        <div v-html="decoder(selectedThread?.memo_goal)" />
      </div>
    </div>
    <div
      v-if="getMessages && props.data?.typeMessage === 1"
      v-for="(item, index) in getMessages"
      :key="index"
    >
      <div
        v-if="
          props.messageAttributeList[index]?.isDayStartSeparator !== null ||
          props.messageAttributeList[index]?.isStartToday ||
          props.messageAttributeList[index]?.isStartYesterday
        "
        class="flex flex-center no-wrap full-width file-divider q-my-lg"
      >
        <span class="line"></span>
        <span
          v-if="props.messageAttributeList[index]?.isDayStartSeparator !== null"
          class="text dateLetterSpacing q-pa-sm"
        >
          {{ props.messageAttributeList[index]?.isDayStartSeparator }}
        </span>
        <span
          v-if="props.messageAttributeList[index]?.isStartToday"
          class="text dateLetterSpacing q-pa-sm"
        >
          今日
        </span>
        <span
          v-if="props.messageAttributeList[index]?.isStartYesterday"
          class="text dateLetterSpacing q-pa-sm"
        >
          昨日
        </span>
        <span class="line"></span>
      </div>
      <div
        v-if="item?.message?.includes('さんによる確認が完了しました。 このスレッドは終了します。')"
        :style="`font-size: ${messageFontSize.toFixed(1)}em`"
        class="goalAchivedAlert q-mt-lg q-pa-sm"
      >
        <span class="goalAchivedTxt"
          >{{ handleEmpName(selectedThread?.id_employee_achieved) + ' ' }}
          {{ item?.message }}</span
        >
      </div>
      <div class="flex items-center no-wrap">
        <div v-if="item?.id_message === selectedMessage">
          <q-btn
            :ripple="true"
            @click="deleteMessage(item)"
            v-if="
              isUnderTenMins(item) && item?.id_employee !== props.employeeId
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
        <q-chat-message
          :id="item.id_message"
          v-if="!item?.message?.includes('さんによる確認が完了しました。 このスレッドは終了します。')"
          :class="
            (item && item.id_file && item.id_file.content_type && (item?.id_file?.content_type?.includes('image') || item?.id_file?.content_type?.includes('video')))
              ? 'sendedImageDiv'
              : props.messageAttributeList[index]?.isASingleEmoji
              ? 'emojiMsg'
              : item?.id_employee === props.employeeId &&
                item?.message?.length > 250
              ? 'longSend'
              : item?.id_employee === props.employeeId &&
                item?.message?.length <= 50
              ? 'shortSend'
              : item?.id_employee === props.employeeId &&
                item?.message?.length > 50
              ? 'mediumSend'
              : item?.id_employee !== props.employeeId &&
                item?.message?.length > 250
              ? 'longRecieved'
              : item?.id_employee !== props.employeeId &&
                item?.message?.length <= 50
              ? 'shortRecieved'
              : 'mediumRecieved'
          "
          :sent="item?.id_employee === props.employeeId"
          :name="
            props.messageAttributeList[index]?.showTimestamp &&
            item?.datetime_insert &&
            item?.id_employee === props.employeeId
              ? handleEmpName(item?.id_employee) +
                ', ' +
                formatHoursMinutes(item?.datetime_insert)
              : props.messageAttributeList[index]?.showTimestamp &&
                item?.datetime_insert < 1 &&
                item?.id_employee === props.employeeId
              ? handleEmpName(item?.id_employee)
              : props.messageAttributeList[index]?.showTimestamp &&
                item?.datetime_insert &&
                item?.id_employee !== props.employeeId
              ? handleEmpName(item?.id_employee) +
                ', ' +
                formatHoursMinutes(item?.datetime_insert)
              : props.messageAttributeList[index]?.showTimestamp &&
                item?.datetime_insert < 1 &&
                item?.id_employee !== props.employeeId
              ? handleEmpName(item?.id_employee)
              : item.id_employee !== props.employeeId && (index === 0 || getMessages[index - 1]?.id_employee !== item.id_employee)
              ? handleEmpName(item?.id_employee) : ''
          "
          :style="`font-size:${messageFontSize.toFixed(1)}em; width:100%`"
        >
          <div
            v-if="
              props.messageAttributeList[index]?.isASingleEmoji || item?.message
            "
            :class="
              props.messageAttributeList[index]?.isASingleEmoji
                ? 'single-emoji'
                : ''
            "
          >
            <div
              class="cursor-pointer"
              @click="selectMessage(item?.id_message)"
              v-if="item?.message"
              v-html="decoder(item?.message)"
            />
          </div>
          <div
            @click="selectMessage(item?.id_message)"
            class="flex"
            v-if="item?.id_file?.content_type"
          >
            <div
              class="q-ml-xs cursor-pointer"
              v-if="item?.id_file?.content_type?.includes('image')"
              @click="openImageViewModal(item?.id_file?.file_url, 0, true)"
            >
              <q-img class="imageSize" :src="item?.id_file?.thumbnail_url" alt="" />
            </div>
            <div v-if="item?.id_file?.content_type?.includes('video')" class="q-ml-xs cursor-pointer video-size">
              <video style="" controls class="video-content">
                <source :src="item?.id_file?.file_url" type="video/mp4" />
              </video>
            </div>
            <div v-if="item?.id_file?.content_type?.includes('pdf')" class="q-ml-xs cursor-pointer video-size">
              <span @click="downloadPdfFile(item.id_file)">
                <q-icon name="picture_as_pdf" size="xl" />
                {{ item.id_file.file_name ? item.id_file.file_name : 'File.pdf' }}
              </span>
            </div>
          </div>
        </q-chat-message>
        <div v-if="item?.id_message === selectedMessage">
          <q-btn
            v-if="
              isUnderTenMins(item) && item?.id_employee === props.employeeId
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
    <ViewMessageFile
      :data="data"
      :messageAttributeList="props.messageAttributeList"
      :employeeId="props.employeeId"
      :allTypeThreads="props.allTypeThreads"
      @open-image-view-modal="openImageViewModal"
    />
    <div
      class="column full-width flex-center logoComponent"
      v-if="getMessages.length < 1 && props.allTypeThreads?.length"
    >
      <!-- <img src="@/assets/img/login/aah_logo.svg" alt="logo" class="logoImage" /> -->
      {{ 'メッセージを投稿しましょう！' }}
    </div>
  </div>
  <span class="scroll-to-bottom-btn" :class="{ show: showScrollToBottom }">
    <q-btn color="primary" @click="scrollToBottom">
      <q-icon size="22px" name="vertical_align_bottom" />
    </q-btn>
  </span>
</template>

<style lang="scss" scoped>
.chat-blk {
  width: 98%;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-right: 12px;
  height: 100vh;
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
.sendedImageDiv {
  :deep(.q-message-text) {
    padding: 0px;
    font-size: 12px;
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
    width: 360px;
    height: 240px;
    object-fit: cover;
    border-radius: 5px;
  }
  .video-size {
    width: 360px;
    height: 250px;
    border-radius: 5px;
    .video-content {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    @media screen and (max-width: 375px) {
      width: 300px;
    }
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
    cursor: pointer;
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
    cursor: pointer;
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
    cursor: pointer;
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
    cursor: pointer;
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
    cursor: pointer;
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
  font-size: 12px;
  font-weight: 300;
  max-width: 250px;
  color: #888;
  :deep(.q-message-text) {
    margin-top: 5px;
    line-height: 1.6;
    cursor: pointer;
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
.goalAchivedAlert {
  width: 70%;
  background-color: #dbdbdb !important;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0px auto 15px auto;
  overflow: hidden;
}
.goal_memo_text {
  line-height: 2;
  text-align: center;
  color: #576100 !important;
}
.goalAchivedTxt {
  max-width: 350px;
  line-height: 2;
  text-align: center;
  color: #6b6b6b !important;
}
.dateLetterSpacing {
  letter-spacing: 1px;
}
.logoComponent {
  margin-top: 5%;
}
.logoImage {
  width: 224px;
  height: 39px;
}
.deleteBtn {
  border-radius: 50%;
}
.copyBtn {
  border-radius: 50%;
}
.scroll-to-bottom-btn {
  &.show {
    display: inline-block;
  }
  display: none;
  position: absolute;
  width: 120px;
  z-index: 5;
  @media screen and (min-width: 300px) and (max-width: 800px) {
    bottom: 30%;
    right: 0px;
  }
  @media screen and (min-width: 500px) {
    bottom: 25%;
    right: 0px;
  }
  @media screen and (min-width: 1920px) {
    bottom: 30%;
    right: 0px;
  }
  @media screen and (min-width: 2560px) {
    bottom: 25%;
    right: 0px;
  }
}
</style>
