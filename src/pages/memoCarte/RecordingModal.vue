<script lange="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import UpdateConversationSpeechModal from '@/pages/memoCarte/UpdateConversationSpeechModal.vue'
import useConversationStore from '@/stores/Conversation'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { useRecording } from './useRecording'
import { event_bus } from '@/utils/eventBus'
import _ from 'lodash'

const MIN_HEIGHT = 100
const MIN_WIDTH = 100

const width = ref(200)
const height = ref(200)
const pos = ref({
  x: window.innerWidth - 200,
  y: window.innerHeight - 210
})

const isMoveDragging = ref(false)
const resizeDraggingSide = ref(null)
const resizeDraggingVertical = ref(null)
const dragStartX = ref(null)
const dragStartY = ref(null)
const startClientRect = ref(null)
const elModal = ref(null)

const {
  recognition,
  isRecording,
  startRecording,
  resumeRecording,
  pauseRecording,
  seconds,
  recordingTime,
  deleteConversation,
  recordingButtonIcon,
  toggleTranscribing,
  isPaused,
  handleLimitRecording,
  stopRecording,
  createNotification,
  selectedServiceType
} = useRecording()

const conversationStore = useConversationStore()
const {
  getFlgRecording,
  getSummaryGenerating,
  getSummaryGenerated,
  getSummaryError
} = storeToRefs(conversationStore)

const emits = defineEmits(['close'])

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

function onDragEnd() {
  isMoveDragging.value = false
  resizeDraggingSide.value = null
  resizeDraggingVertical.value = null
  dragStartX.value = null
  dragStartY.value = null
  startClientRect.value = null
}

function onMoveDragStart(event) {
  event.preventDefault()
  event.stopPropagation()

  elModal.value.focus()

  isMoveDragging.value = true
  dragStartX.value = event.clientX
  dragStartY.value = event.clientY
  startClientRect.value = {
    x: pos.value.x,
    y: pos.value.y,
    width: width.value,
    height: height.value
  }
}

async function openTranscriptModal() {
  await mtUtils.popup(UpdateConversationSpeechModal, {
    persistent: true
  })
  // .then(() => {
  //   conversationStore.setAutoReflectMemoCarte(true)
  // })
}

const deleteRecording = async () => {
  if (!isPaused.value) {
    await pauseRecording()
  }
  if (await deleteConversation()) closeModal()
}

const updateRecordingDatetime = async () => {
  if (isRecording.value && !useConversationStore().getFlgPaused) {
    await pauseRecording()
  }
}

event_bus.on('recording-start', () => {
  toggleTranscribing()
})

event_bus.on('close-draggable-recording-modal', () => {
  closeModal()
})

event_bus.on('recording-limit-reached', async () => {
  const result = await handleLimitRecording()
  if (result) {
    closeModal()
  }
})

const handleQuickSubmit = async () => {
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
    selectedServiceType.value = 2
    selectedQuestionTemplateId.id = conversationStore.getQuestionTemplate?.[0]?.question_id || '1'
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

onMounted(() => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
  window.addEventListener('beforeunload', updateRecordingDatetime)

  event_bus.on('voice-command-stop', async (data) => {
    console.log('Voice command received in RecordingModal:', data?.source)
    if (isRecording.value && !isPaused.value) {
      await handleQuickSubmit()
    }
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('beforeunload', updateRecordingDatetime)
  event_bus.off('recording-start')
  event_bus.off('close-draggable-recording-modal')
  event_bus.off('voice-command-stop')
})
</script>

<template>
  <div
    class="adjustable-modal"
    ref="elModal"
    v-show="getFlgRecording"
    :style="{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }"
    tabindex="0"
    @click="openTranscriptModal"
    :class="getSummaryGenerated ? 'summary-generated' : ''"
  >
    <div
      class="adjustable-modal__header relative-position"
      @mousedown="onMoveDragStart"
    >
      <!-- comment this for new UI generate notification -->

      <div class="header">
        <div class="header__title body1 text-center q-mt-lg">録音中</div>
      </div>

      <!-- end  -->
      <div>
        <div class="text-center recording-time">{{ recordingTime }}</div>
        <div class="flex justify-center q-mt-lg gap-2">
          <q-btn
            :icon="recordingButtonIcon"
            class="bg-danger q-px-xl text-white"
            @click.stop="toggleTranscribing"
          />
        </div>
        <div
          class="text-center q-mt-sm cursor-pointer"
          @click.stop="deleteRecording"
        >
          録音を中止
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
  z-index: $z-index-modal;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  width: 185px;
  height: 200px;
  border-top: 6px solid var(--Status-Danger, #be0123);
  &.summary-generated {
    border-color: #34c759;
  }

  &:focus,
  &:focus-within {
    z-index: $z-index-modal + 1;
    outline: 0;
  }
}

.header {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &__title {
    font-weight: bold;
    color: var(--Status-Danger, #be0123);
  }
  &__summary_title {
    height: calc(200px - 30px);
  }
  &__summary_generated {
    color: #34c759;
  }
}

.recording-time {
  color: var(--System-Gray-900, #212121);
  font-size: 24px;
  font-weight: bold;
}
</style>
