<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { copyText } from '@/utils/aahUtils'
import _ from 'lodash'
import { useTextSelection } from '@/utils/composables/UseTextSelection'
import TextEditModal from '@/components/modals/TextEditModal.vue'
import mtUtils from '@/utils/mtUtils'
import { useConversationStore } from '@/stores/Conversation'
import { useRecording } from './useRecording'
import aahMessages from '@/utils/aahMessages'

const conversationStore = useConversationStore()

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

const props = defineProps({
  summary: {
    type: String,
    required: true
  },
  transcript: {
    type: String,
    required: true
  },
  requestData: {
    type: String
  }
})

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const formattedTranscript = computed(() => {
  return props.transcript.replace(/。/g, '。<br><br>')
})

const formattedSummary = computed(() => {
  return props.summary.split('## pet_owner_name')[0]
})

const copyTranscript = () => {
  const newTranscript = props.transcript.replace(/。/g, '。\n')

  copyText(newTranscript)
}
const copySummary = () => {
  let textContent = props.summary.replace(/<br\s*\/?>/gi, '\n')

  textContent = textContent.replace(/<\/?b>/gi, '')

  const index = textContent.indexOf('## pet_owner_name')
  if (index !== -1) {
    textContent = textContent.substring(0, index)
  }
  copyText(textContent)
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
  if (
    event.target.classList.contains('transcript-content') ||
    event.target.closest('.transcript-content')
  ) {
    if (!event.ctrlKey && !event.metaKey) return
  }

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

const selectedTab = ref('文字起こし')
const tabsData = [
  { id: '1', label: '文字起こし' },
  { id: '2', label: '要約' }
]

const selectedText = ref('')
const tooltipInputText = ref('')
const showForm = ref(false)

const { updateFeedbackData, setTranscriptData } = useRecording()

const handleFeedbackComplete = () => {
  isFeedbackMode.value = false
}

const handleSelectionComplete = (text: string, fullSentence: string) => {
  mtUtils.smallPopup(TextEditModal, {
    text,
    fullSentence,
    selectedWord: text,
    conversationId: conversationStore.conversationId,
    onFeedbackComplete: handleFeedbackComplete,
    popup: {
      popupClassName: 'text-edit-popup'
    }
  })
}

const handleMouseSelection = () => {
  if (!isFeedbackMode.value) return

  const selection = window.getSelection()
  const transcriptWindow = document.getElementById('transcript_window')

  if (
    selection &&
    selection.toString().trim() !== '' &&
    transcriptWindow &&
    transcriptWindow.contains(selection.anchorNode)
  ) {
    const fullSentence = selection.anchorNode.parentNode.textContent
    handleSelectionComplete(selection.toString(), fullSentence)
  }
}

const {} = useTextSelection({
  containerId: 'transcript_window',
  onSelectionComplete: (text) => {
    if (!isFeedbackMode.value) return
    handleSelectionComplete(text, text)
  }
})

onMounted(async () => {
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', onDragEnd)
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchEnd)
  if (props.transcript) {
    setTranscriptData(props.transcript)
  }
})

onBeforeUnmount(() => {
  // stop event listensers
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', onDragEnd)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
})

const isFeedbackMode = ref(false)

const toggleFeedbackMode = () => {
  isFeedbackMode.value = !isFeedbackMode.value
}
</script>

<template>
  <div
    class="adjustable-modal"
    ref="elModal"
    :style="{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }"
    tabindex="0"
  >
    <div
      class="text-center q-mb-sm"
      style="color: #6b4f74; font-size: 14px; font-weight: bold"
      v-if="requestData"
    >
      {{ requestData }}
    </div>
    <div
      class="adjustable-modal__header relative-position col flex column"
      @mousedown="onMoveDragStart"
      @touchstart="onTouchDragStart"
    >
      <div class="no-drag" v-if="summary">
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
            :style="`background-color: ${
              selectedTab === tab.label &&
              tab.label === '文字起こし' &&
              isFeedbackMode
                ? '#FFE8E8'
                : selectedTab === tab.label
                ? '#f1f5f9'
                : '#eeeeee'
            }`"
          />
        </q-tabs>
      </div>

      <q-tab-panels
        v-model="selectedTab"
        animated
        class="col"
        :style="`background-color: ${
          selectedTab === '文字起こし' && isFeedbackMode ? '#FFE8E8' : '#f1f5f9'
        }; ${
          summary
            ? ''
            : 'border-top-left-radius: 8px; border-top-right-radius: 8px;'
        }`"
      >
        <q-tab-panel
          name="文字起こし"
          class="q-px-none q-pb-none flex column relative"
        >
          <q-scroll-area class="q-pa-sm col">
            <div
              id="transcript_window"
              class="transcript-content"
              :class="{ 'feedback-mode': isFeedbackMode }"
              @mouseup="handleMouseSelection"
            >
              <div
                :class="isFeedbackMode ? 'q-mt-xl no-drag' : ''"
                v-html="formattedTranscript"
                @mousedown.stop
              ></div>
            </div>
          </q-scroll-area>
          <div
            v-if="isFeedbackMode"
            class="absolute absolute-top feedback-mode-header q-mx-sm q-mt-md"
          >
            誤変換がある単語を選択してください
          </div>
          <div
            :class="`absolute corner-button q-pa-sm ${
              isFeedbackMode ? 'feedback-mode' : ''
            }`"
          >
            <q-btn
              round
              flat
              color="#4E6E9D"
              icon="o_feedback"
              @click="toggleFeedbackMode"
              class="no-drag"
            />
          </div>

          <div class="absolute absolute-bottom-right q-pb-sm q-pr-sm">
            <q-btn
              icon="content_copy"
              style="background: white; color: #c4c4c4"
              round
              size="14px"
              flat
              @click="copyTranscript()"
              class="no-drag"
            />
          </div>
        </q-tab-panel>
        <q-tab-panel
          name="要約"
          class="q-pa-none q-pb-none flex column relative"
        >
          <q-scroll-area
            class="q-pa-sm col"
            style="font-size: 13px"
            ref="scrollArea"
          >
            <div class="" v-html="formattedSummary"></div>
          </q-scroll-area>
          <div class="absolute absolute-bottom-right q-pb-sm q-pr-sm">
            <q-btn
              icon="content_copy"
              style="background: white; color: #c4c4c4"
              round
              size="14px"
              flat
              @click="copySummary()"
              class="no-drag"
            />
          </div>
        </q-tab-panel>
      </q-tab-panels>

      <div class="flex items-center justify-center q-mt-xs">
        <q-btn
          flat
          dense
          class="text-center q-px-lg no-drag"
          label="閉じる"
          style="font-size: 12px"
          @click.stop="closeModal"
        />
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
  background-color: #eeeeee;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  width: 400px;
  height: 600px;
  border: 4px solid #009639;

  &:focus,
  &:focus-within {
    z-index: $z-index-modal + 1;
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
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .q-tab.relative-position.self-stretch.flex.flex-center.text-center.q-tab--inactive.q-focusable.q-hoverable.cursor-pointer {
    background-color: #eeeeee;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
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

.transcript-content {
  position: relative;
  // padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  user-select: text !important;
  -webkit-user-select: text !important;
  transition: background-color 0.3s ease;
  cursor: text;

  &.feedback-mode {
    ::selection {
      background-color: #ffeb3b; // Warna kuning stabilo
      color: black; // Memastikan text tetap terlihat
    }
    :deep(::selection) {
      background-color: #ffeb3b;
      color: black;
    }
  }

  &.dragging {
    cursor: grab !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  ::v-deep(p) {
    margin-bottom: 0.5rem;
    line-height: 1.5;
    user-select: text !important;
    -webkit-user-select: text !important;
  }
}

.adjustable-modal {
  &__header {
    cursor: grab;

    &:active {
      cursor: grabbing;
    }

    .transcript-content {
      pointer-events: auto;
      user-select: text !important;
      -webkit-user-select: text !important;
    }
  }
}

.feedback-mode-header {
  background-color: #ffff;
  color: black;
  padding: 8px 12px;
  border-radius: 4px 4px 0 0;
  font-size: 14px;
  text-align: center;
  margin-bottom: -4px;
}
.corner-button {
  position: absolute;
  top: -10px;
  right: -10px;
}

.draggable-header {
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
}

.transcript-content {
  // max-height: 400px;
  overflow-y: auto;
  padding-bottom: 10px;
}
</style>
