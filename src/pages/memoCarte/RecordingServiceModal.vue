<script lange="ts" setup>
import {
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  reactive,
  nextTick
} from 'vue'
import UpdateConversationSpeechModal from '@/pages/memoCarte/UpdateConversationSpeechModal.vue'
import useConversationStore from '@/stores/Conversation'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { useRecording } from './useRecording'
import { event_bus } from '@/utils/eventBus'
import _ from 'lodash'

import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import ConfirmKoekaruQuestionTemplateModal from './ConfirmKoekaruQuestionTemplateModal.vue'
import ConfirmKoekaruRequestModal from './ConfirmKoekaruRequestModal.vue'
import RecordingLimitConfirmation from '@/pages/memoCarte/confirmation/RecordingLimitConfirmation.vue'

const MIN_HEIGHT = 100
const MIN_WIDTH = 100

const width = ref(400)
const height = ref(600)
const pos = ref({
  x: window.innerWidth - 410,
  y: window.innerHeight - 610
})

const isMoveDragging = ref(false)
const resizeDraggingSide = ref(null)
const resizeDraggingVertical = ref(null)
const dragStartX = ref(null)
const dragStartY = ref(null)
const startClientRect = ref(null)
const elModal = ref(null)
// prettier-ignore
const scrollArea = ref()

const {
  resumeRecording,
  pauseRecording,
  recordingTime,
  deleteConversation,
  recordingButtonIcon,
  toggleTranscribing,
  tempTranscript,
  tempFullTranscript,
  fullTranscript,
  createNotification,
  stopRecording,
  isPaused,
  selectedServiceType,
  isRecording
} = useRecording()

const conversationStore = useConversationStore()
const {
  getFlgRecording,
  getSummaryGenerating,
  getSummaryGenerated,
  getSummaryError,
  getQuestionTemplate,
  getTranscriptChats
} = storeToRefs(conversationStore)

const emits = defineEmits(['close'])

const disableReq = ref(false)

const closeModal = () => {
  emits('close')
}

function onDrag(event) {
  if (
    dragStartX.value == null ||
    dragStartY.value == null ||
    startClientRect.value == null
  ) {
    return
  }

  if (isMoveDragging.value) {
    pos.value.x = _.clamp(
      startClientRect.value.x + (event.clientX - dragStartX.value),
      0,
      window.innerWidth - width.value
    )
    pos.value.y = _.clamp(
      startClientRect.value.y + (event.clientY - dragStartY.value),
      0,
      window.innerHeight - height.value
    )
  }

  if (resizeDraggingVertical.value === 'top') {
    const changeValue = event.clientY - dragStartY.value
    const bottomY = startClientRect.value.y + startClientRect.value.height
    pos.value.y = _.clamp(
      startClientRect.value.y + changeValue,
      0,
      bottomY - MIN_HEIGHT
    )
    height.value = bottomY - pos.value.y
  }

  if (resizeDraggingVertical.value === 'bottom') {
    const changeValue = event.clientY - dragStartY.value
    height.value = _.clamp(
      startClientRect.value.height + changeValue,
      MIN_HEIGHT,
      window.innerHeight - startClientRect.value.y
    )
  }

  if (resizeDraggingSide.value === 'left') {
    const changeValue = event.clientX - dragStartX.value
    const rightX = startClientRect.value.x + startClientRect.value.width
    pos.value.x = _.clamp(
      startClientRect.value.x + changeValue,
      0,
      rightX - MIN_WIDTH
    )
    width.value = rightX - pos.value.x
  }

  if (resizeDraggingSide.value === 'right') {
    const changeValue = event.clientX - dragStartX.value
    width.value = _.clamp(
      startClientRect.value.width + changeValue,
      MIN_WIDTH,
      window.innerWidth - startClientRect.value.x
    )
  }
}

function getCoordinates(event) {
  if (event.touches) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    }
  } else {
    return {
      x: event.clientX,
      y: event.clientY
    }
  }
}

function onTouchMove(event) {
  const { x, y } = getCoordinates(event)

  if (
    dragStartX.value == null ||
    dragStartY.value == null ||
    startClientRect.value == null
  ) {
    return
  }

  if (isMoveDragging.value) {
    pos.value.x = _.clamp(
      startClientRect.value.x + (x - dragStartX.value),
      0,
      window.innerWidth - width.value
    )
    pos.value.y = _.clamp(
      startClientRect.value.y + (y - dragStartY.value),
      0,
      window.innerHeight - height.value
    )
  }

  if (resizeDraggingVertical.value === 'top') {
    const changeValue = y - dragStartY.value
    const bottomY = startClientRect.value.y + startClientRect.value.height
    pos.value.y = _.clamp(
      startClientRect.value.y + changeValue,
      0,
      bottomY - MIN_HEIGHT
    )
    height.value = bottomY - pos.value.y
  }

  if (resizeDraggingVertical.value === 'bottom') {
    const changeValue = y - dragStartY.value
    height.value = _.clamp(
      startClientRect.value.height + changeValue,
      MIN_HEIGHT,
      window.innerHeight - startClientRect.value.y
    )
  }

  if (resizeDraggingSide.value === 'left') {
    const changeValue = x - dragStartX.value
    const rightX = startClientRect.value.x + startClientRect.value.width
    pos.value.x = _.clamp(
      startClientRect.value.x + changeValue,
      0,
      rightX - MIN_WIDTH
    )
    width.value = rightX - pos.value.x
  }

  if (resizeDraggingSide.value === 'right') {
    const changeValue = x - dragStartX.value
    width.value = _.clamp(
      startClientRect.value.width + changeValue,
      MIN_WIDTH,
      window.innerWidth - startClientRect.value.x
    )
  }
}

function onDragEnd() {
  isMoveDragging.value = false
  resizeDraggingSide.value = null
  resizeDraggingVertical.value = null
  dragStartX.value = null
  dragStartY.value = null
  startClientRect.value = null
}

function onTouchEnd() {
  isMoveDragging.value = false
  resizeDraggingSide.value = null
  resizeDraggingVertical.value = null
  dragStartX.value = null
  dragStartY.value = null
  startClientRect.value = null
}

function onMoveDragStart(event) {
  if (event.target.closest('.no-drag')) {
    return
  }
  event.preventDefault()
  event.stopPropagation()

  elModal.value.focus()

  const { x, y } = getCoordinates(event)

  isMoveDragging.value = true
  dragStartX.value = x
  dragStartY.value = y
  startClientRect.value = {
    x: pos.value.x,
    y: pos.value.y,
    width: width.value,
    height: height.value
  }
}

function onTouchDragStart(event) {
  if (event.target.closest('.no-drag')) {
    return
  }
  event.preventDefault()
  event.stopPropagation()

  elModal.value.focus()

  const { x, y } = getCoordinates(event)

  isMoveDragging.value = true
  dragStartX.value = x
  dragStartY.value = y
  startClientRect.value = {
    x: pos.value.x,
    y: pos.value.y,
    width: width.value,
    height: height.value
  }
}

const deleteRecording = async () => {
  disableReq.value = true
  if (!isPaused.value) {
    await pauseRecording()
  }
  if (await deleteConversation()) closeModal()
  else disableReq.value = false
}

const selectedTab = ref('声カル作成')
const tabsData = [
  { id: '1', label: '声カル作成' },
  { id: '2', label: '設定' }
]

const microphonesList = ref()
const microphonesListDefault = ref([])
const data = ref({
  microphone: ''
})

async function requestMicrophoneAccess() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true })
    await listAudioInputs()
  } catch (error) {
    console.log('reqmicerr', error)
  }
}

async function listAudioInputs() {
  navigator.mediaDevices
    .enumerateDevices()
    .then(async (devices) => {
      microphonesList.value = devices
        .filter((device) => device.kind === 'audioinput')
        .map((mic) => {
          return {
            label: mic.label,
            value: mic.deviceId
          }
        })

      microphonesListDefault.value.push(...microphonesList.value)
      await nextTick()
      data.value.microphone = microphonesList.value[0]?.value
    })
    .catch((error) => {
      console.log('listerr', error)
    })
}

// const serviceType = ref(1)
const itemServiceType = [
  {
    label: '文字起こしのみ',
    value: 1
  },
  {
    label: '要約付き',
    value: 2
  }
]

const recordingState = ref('recording')

const zIndex = computed(() => {
  return conversationStore.getSource === 'create_memo_carte' ? 99 : 10
})

const startKoekaruRequest = async (isFromLimit = false) => {
  disableReq.value = true
  if (!isPaused.value) {
    await pauseRecording()
  }

  if (isFromLimit) {
    if (conversationStore.getSource === 'create_memo_carte') {
      if (document.querySelector('.q-dialog')) {
        return
      }

      const confirmLimit = await mtUtils.confirm(
        '利用制限に達しました。現在、このアプリケーションでは1回の録音につき最大25分までご利用いただけます。\n\nこれまでの内容をリクエストする場合は「リクエスト」ボタンを押してください。\n不要な場合は「閉じる」ボタンを押して、詳細画面の「削除」ボタンよりレコードを破棄してください。',
        '録音制限',
        'リクエスト',
        null,
        null,
        null,
        {
          show: false,
          callBackFun: Function
        },
        true,
        '閉じる',
        true
      )

      if (!confirmLimit) {
        disableReq.value = false
        isPaused.value = true
        return
      }
    } else {
      if (document.querySelector('.q-dialog')) {
        return
      }

      let popup = {
        isConfirmed: false,
        id_template: '1',
        apiOptions: 'speech'
      }

      await mtUtils.smallPopup(RecordingLimitConfirmation, { popup })

      if (!popup.isConfirmed) {
        disableReq.value = false
        isPaused.value = true
        return
      }

      const conversation_id = conversationStore.conversationId
      createNotification(conversation_id, true)
      await stopRecording(
        popup.id_template,
        selectedServiceType.value,
        conversation_id,
        popup.id_template
      )
      closeModal()
      return
    }
  }

  const conversation_id = conversationStore.conversationId
  let selectedQuestionTemplateId = {
    id: ''
  }
  const confirmationResult = {
    confirmed: false
  }

  if (selectedServiceType.value === 2) {
    if (conversationStore.getSource !== 'create_memo_carte') {
      await mtUtils.smallPopup(
        ConfirmKoekaruQuestionTemplateModal,
        {
          questionTemplates: conversationStore.getQuestionTemplate,
          selectedQuestionTemplateId,
          confirmationResult
        },
        {
          persistent: true
        }
      )
    } else {
      if (!isFromLimit) {
        await mtUtils.confirm(
          'この内容でSOAPを生成しますか？',
          '確認',
          '生成',
          null,
          null,
          null,
          {
            show: false,
            callBackFun: Function
          },
          true
        ).then(async (confirmation) => {
          if (confirmation) {
            selectedQuestionTemplateId.id = '3'
            confirmationResult.confirmed = true
          }
        })
      } else {
        selectedQuestionTemplateId.id = '3'
        confirmationResult.confirmed = true
      }
    }
    if (!confirmationResult.confirmed) {
      disableReq.value = false
      resumeRecording()
      return
    }
  } else {
    await mtUtils.smallPopup(ConfirmKoekaruRequestModal, { confirmationResult })
    if (!confirmationResult.confirmed) {
      disableReq.value = false
      resumeRecording()
      return
    }
  }

  event_bus.emit('close-draggable-recording-modal')
  createNotification(conversation_id, true)
  await stopRecording(
    null,
    selectedServiceType.value,
    conversation_id,
    selectedQuestionTemplateId.id
  )
  closeModal()
}

event_bus.on('recording-start', () => {
  toggleTranscribing()
})

event_bus.on('close-draggable-recording-modal', () => {
  closeModal()
})

const scrollToBottom = () => {
  if (scrollArea.value) {
    const newHeight = scrollArea.value.getScroll().verticalSize
    scrollArea.value.setScrollPosition('vertical', newHeight)
  }
}

const observer = ref()

const realTimeScript = computed(() => {
  const splitter = tempFullTranscript.value.split('。')
  const joiner = splitter.join('<br />')

  return joiner.length > 0
    ? `${joiner} <br /> ${tempTranscript.value}`
    : `${tempTranscript.value}`
})

onMounted(async () => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchEnd)
  await requestMicrophoneAccess()

  if (conversationStore.getSource === 'create_memo_carte') {
    selectedServiceType.value = 2
  }

  console.log('Mounting voice command listener')
  
  event_bus.on('voice-command-stop', async (data) => {
    if (isRecording.value && !isPaused.value) {
      await handleQuickSubmit()
    }
  })

  if (scrollArea.value) {
    observer.value = new MutationObserver(async () => {
      await nextTick()
      scrollToBottom()
    })

    observer.value.observe(scrollArea.value.$el, {
      childList: true,
      subtree: true
    })
  }

  event_bus.on('recording-limit-reached', async () => {
    await startKoekaruRequest(true)
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  event_bus.off('recording-start')
  event_bus.off('close-draggable-recording-modal')
  event_bus.off('voice-command-stop')
  if (observer.value) {
    observer.value.disconnect()
  }
  event_bus.off('recording-limit-reached')
})

const handleQuickSubmit = async () => {
  disableReq.value = true
  if (!isPaused.value) {
    await pauseRecording()
  }

  const conversation_id = conversationStore.conversationId
  let selectedQuestionTemplateId = {
    id: ''
  }

  if (conversationStore.getSource === 'create_memo_carte') {
    selectedQuestionTemplateId.id = '3'
    selectedServiceType.value = 2 
  } else {
    if (selectedServiceType.value === 2) {
      selectedQuestionTemplateId.id = conversationStore.getQuestionTemplate?.[0]?.question_id || '1'
    }
  }

  const confirmationResult = {
    confirmed: true
  }

  event_bus.emit('close-draggable-recording-modal')
  createNotification(conversation_id, true)
  
  await stopRecording(
    null,
    selectedServiceType.value,
    conversation_id,
    selectedQuestionTemplateId.id
  )
  closeModal()
}
</script>

<template>
  <div
    class="adjustable-modal"
    ref="elModal"
    v-show="getFlgRecording"
    :style="{
      transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
      zIndex: zIndex
    }"
    tabindex="0"
  >
    <div
      class="adjustable-modal__header relative-position col flex column"
      @mousedown="onMoveDragStart"
      @touchstart="onTouchDragStart"
    >
      <div class="no-drag">
        <q-tabs
          v-model="selectedTab"
          align="center"
          class="full-width"
          dense
          indicator-color="transparent"
        >
          <q-tab
            v-for="tab in tabsData"
            :key="tab.id"
            :name="tab.label"
            :label="tab.label"
          />
        </q-tabs>
      </div>

      <q-tab-panels
        v-model="selectedTab"
        animated
        class="col"
        style="background-color: #f1f5f9"
      >
        <q-tab-panel name="声カル作成" class="q-px-none q-pb-none flex column">
          <div class="header">
            <div class="flex items-center">
              <div class="title col">
                {{ isPaused ? '一時停止中...' : '録音中...' }}
              </div>
              <div class="time q-pr-md">{{ recordingTime }}</div>
            </div>
          </div>

          <q-scroll-area
            class="col q-pa-sm"
            style="font-size: 13px"
            ref="scrollArea"
          >
            <div class="" v-html="realTimeScript"></div>
          </q-scroll-area>
        </q-tab-panel>
        <q-tab-panel name="設定" class="q-pa-none">
          <div class="col flex column">
            <div class="col">
              <div
                v-if="conversationStore.getSource !== 'create_memo_carte'"
                class="q-mt-xl q-mb-md"
                style="max-width: 250px; margin-left: auto; margin-right: auto"
              >
                <MtInputForm
                  type="radio"
                  class="q-mt-none"
                  v-model="selectedServiceType"
                  :items="itemServiceType"
                  required
                />
              </div>

              <div class="q-px-md">
                <MtFilterSelect
                  v-if="data.microphone"
                  v-model:options="microphonesList"
                  label="録音デバイス"
                  v-model:selecting="data.microphone"
                  :options-default="microphonesListDefault"
                />
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <div class="">
        <div class="btn-container q-py-none no-drag">
          <q-btn
            :label="isPaused ? '再開' : '一時停止'"
            dense
            class="bg-white q-mr-sm q-py-xs"
            outline
            @click.stop="toggleTranscribing"
            :disable="disableReq"
          />
         <q-btn
            flat
            dense
            class="text-white bg-primary text-center q-py-xs"
            label="生成"
            @click.stop="startKoekaruRequest(false)"
            :disable="disableReq"
          />
        </div>
        <div class="flex items-center justify-center q-mt-xs no-drag">
          <q-btn
            flat
            dense
            class="text-center q-px-lg"
            label="閉じる"
            @click.stop="deleteRecording"
            :disable="disableReq"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$z-index-modal: 10;

* {
  box-sizing: border-box;
}

.adjustable-modal {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  background-color: #eeeeee;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  width: 400px;
  height: 600px;
  border: 4px solid #009639;
  // border-top: 6px solid var(--Status-Danger, #BE0123);
  &.summary-generated {
    border-color: #34c759;
  }

  &:focus,
  &:focus-within {
    outline: 0;
  }

  // set q-tab

  .q-tab.q-tab__label {
    font-size: 12px;
  }
  .q-tabs--dense .q-tab {
    min-height: 30px;
  }

  .q-tab.relative-position.self-stretch.flex.flex-center.text-center.q-tab--active.q-focusable.q-hoverable.cursor-pointer {
    background-color: #f1f5f9;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .q-tab.relative-position.self-stretch.flex.flex-center.text-center.q-tab--inactive.q-focusable.q-hoverable.cursor-pointer {
    background-color: #eeeeee;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .btn-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    justify-content: center;
    background-color: #f1f5f9;
    padding-bottom: 8px;
    padding-left: 8px;
    padding-right: 8px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
    // margin-left: 1px;
  }
}

.header {
  // background-color: #f1f5f9;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
  font-size: 14px;
  .title {
    text-align: center;
    font-weight: bold;

    color: var(--Status-Danger, #be0123);
  }
}

.recording-time {
  color: var(--System-Gray-900, #212121);
  font-size: 24px;
  font-weight: bold;
}
</style>
