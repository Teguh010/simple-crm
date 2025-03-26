<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { event_bus } from '@/utils/eventBus'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'
import useConversationStore from '@/stores/Conversation'
import _ from 'lodash'
import { useRecording } from './useRecording'
import mtUtils from '@/utils/mtUtils'
import router from '@/router'

const CreateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/CreateMemoCarteModal.vue')
)

const emits = defineEmits(['close'])

const customerStore = useCustomerStore()
const petStore = usePetStore()
const conversationStore = useConversationStore()

const {
  pauseRecording,
  resumeRecording,
  saveCurrentRecord,
  seconds,
  tempFullTranscript,
  flg_auto_memocarte_ai
} = useRecording()

const isMoveDragging = ref(false)
const resizeDraggingSide = ref(null)
const resizeDraggingVertical = ref(null)
const dragStartX = ref(null)
const dragStartY = ref(null)
const startClientRect = ref(null)
const elModal = ref(null)

const listNotification = ref([])
const tempListNotification = ref([])

const statusMessageEnum = (val: number) => {
  switch (val) {
    case 0: //Generating
      return '要約生成中...'
    case 1: //Generated
      return '要約完了'
    case 2: //onHold
      return '保留中'
    case 3: //Error
      return 'エラー'
    default:
      return '要約生成中...'
  }
}

const addNotificationList = (data) => {
  const findidConversation = tempListNotification.value.find(
    (item) => item.idConversation === data.idConversation
  )
  if (findidConversation) {
    const notificationData = {
      nameFamily: findidConversation.nameFamily,
      namePet: findidConversation.namePet,
      idRequest: findidConversation.idRequest,
      idConversation: findidConversation.idConversation,
      isMedicalRecord: findidConversation.isMedicalRecord,
      statusMessage: data.statusMessage,
      seconds: data.seconds,
      transcriptMedical: tempFullTranscript.value,
      transcript: conversationStore.getTranscriptChats,
      summary: '',
      generatedTranscript: '',
      source: findidConversation.source,
      createMemoCarteData: findidConversation.createMemoCarteData,
      currentMemoCarteData: findidConversation.currentMemoCarteData
    }

    listNotification.value.push(notificationData)
    return
  }

  const notificationData = {
    nameFamily: customerStore.getCustomer.name_family,
    namePet: petStore.getPet.name_pet,
    idRequest: conversationStore.getRequestId,
    idConversation: data.idConversation,
    isMedicalRecord: data.isMedicalRecord,
    statusMessage: data.statusMessage,
    seconds: data.seconds,
    transcriptMedical: tempFullTranscript.value,
    transcript: conversationStore.getTranscriptChats,
    summary: '',
    generatedTranscript: '',
    source: conversationStore.getSource,
    createMemoCarteData: conversationStore.getCreateMemoCarteData ?? null,
    currentMemoCarteData: conversationStore.getCurrentMemoCarteData ?? null
  }
  listNotification.value.push(notificationData)
}

const MIN_HEIGHT = 100
const MIN_WIDTH = 100

const width = ref(200)
const height = ref(200)
const pos = ref({
  x: window.innerWidth - 220,
  y: 4
})

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

function onDrag(event) {
  // const { x, y } = getCoordinates(event)

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
    const changeValue = event.clientX - dragStartY.value
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

function onTouchEnd() {
  isMoveDragging.value = false
  resizeDraggingSide.value = null
  resizeDraggingVertical.value = null
  dragStartX.value = null
  dragStartY.value = null
  startClientRect.value = null
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

function onMouseMove(event) {
  onDrag(event)
}

function onMouseUp() {
  onDragEnd()
}

function onMouseDragStart(event) {
  onMoveDragStart(event)
}

const closeModal = () => {
  event_bus.emit('close-notification')
  resetStoreData(true)
  emits('close')
}

const openConversationList = () => {
  window.open('/SearchConversationList', '_blank')
}

const updateNotificationStatus = (data: {
  statusMessage: number
  id_conversation: string
}) => {
  
  const findidConversation = listNotification.value.find(
    (item) => item.idConversation === data.id_conversation
  )
  if (findidConversation) {
    findidConversation.statusMessage = data.statusMessage

    setTimeout(async () => {
      if (
        findidConversation.statusMessage === 1 && 
        flg_auto_memocarte_ai.value &&
        findidConversation.summary && 
        findidConversation.createMemoCarteData
      ) {

        const submitData = {
          createMemoCarteData: {
            id_request: findidConversation.idRequest,
            ...findidConversation.createMemoCarteData
          },
          content: findidConversation.generatedTranscript || findidConversation.transcriptMedical,
          summary: findidConversation.summary,
          currentMemoCarteData: findidConversation.currentMemoCarteData
        }

        try {
          event_bus.emit('auto-submit-memo-carte', submitData)
          
          const indexTemp = tempListNotification.value.findIndex(
            (item) => item.idConversation === data.id_conversation
          )
          const indexList = listNotification.value.findIndex(
            (item) => item.idConversation === data.id_conversation
          )
          
          if (indexTemp !== -1) {
            tempListNotification.value.splice(indexTemp, 1)
          }
          if (indexList !== -1) {
            listNotification.value.splice(indexList, 1)
          }
        } catch (error) {
          console.error('🔴 Error in auto submit:', error)
        }
      } else if (
        findidConversation.statusMessage === 1 &&
        findidConversation.isMedicalRecord &&
        findidConversation.createMemoCarteData === null &&
        flg_auto_memocarte_ai.value
      ) {
        const indexTemp = tempListNotification.value.findIndex(
          (item) => item.idConversation === data.id_conversation
        )
        const indexList = listNotification.value.findIndex(
          (item) => item.idConversation === data.id_conversation
        )
        const indexMemo = conversationStore.getRecentMemoCarteList.findIndex(
          (item) => item.id_request === findidConversation.idRequest
        )

        if (indexMemo !== -1) {
          conversationStore.recentMemoCarteList.splice(indexMemo, 1)
        }
        if (indexTemp !== -1) {
          tempListNotification.value.splice(indexTemp, 1)
        }
        if (indexList !== -1) {
          listNotification.value.splice(indexList, 1)
        }
      } else if (
        findidConversation.statusMessage === 1 &&
        !findidConversation.isMedicalRecord &&
        flg_auto_memocarte_ai.value
      ) {
        const indexTemp = tempListNotification.value.findIndex(
          (item) => item.idConversation === data.id_conversation
        )
        const indexList = listNotification.value.findIndex(
          (item) => item.idConversation === data.id_conversation
        )
        const indexMemo = conversationStore.getRecentMemoCarteList.findIndex(
          (item) => item.id_request === findidConversation.idRequest
        )

        if (indexMemo !== -1) {
          conversationStore.recentMemoCarteList.splice(indexMemo, 1)
        }
        if (indexTemp !== -1) {
          tempListNotification.value.splice(indexTemp, 1)
        }
        if (indexList !== -1) {
          listNotification.value.splice(indexList, 1)
        }
      } else if (
        findidConversation.statusMessage === 1 &&
        findidConversation.isMedicalRecord
      ) {
        const indexTemp = tempListNotification.value.findIndex(
          (item) => item.idConversation === data.id_conversation
        )
        const indexMemo = conversationStore.getRecentMemoCarteList.findIndex(
          (item) => item.id_request === findidConversation.idRequest
        )

        if (indexMemo !== -1) {
          conversationStore.recentMemoCarteList.splice(indexMemo, 1)
        }

        if (indexTemp !== -1) {
          tempListNotification.value.splice(indexTemp, 1)
        }
      }

      // Pindahkan pengecekan list kosong ke dalam setTimeout
      if (listNotification.value.length === 0) {
        closeModal()
      }
    }, 5000)
  }
}

const switchRecording = async (list) => {
  if (conversationStore.flgRecording) {
    pauseRecording()
    await mtUtils
      .confirm(
        `Switch recording to request id ${list.idRequest} ?`,
        'Switch Recording Confirmation',
        '削除',
        undefined,
        undefined,
        undefined,
        {
          show: false,
          callBackFun: Function
        },
        true
      )
      .then((confirmation) => {
        if (confirmation) {
          const findidConversation = listNotification.value.find(
            (item) => item.idConversation === list.id_conversation
          )

          if (!findidConversation) {
            saveCurrentRecord({
              id_conversation: conversationStore.conversationId,
              is_medical_record: conversationStore.typeMedical,
              status_message: 2,
              seconds: seconds.value
            })
          }

          startRecording(list)
        } else {
          resumeRecording()
        }
      })
  } else {
    startRecording(list)
  }
}

const startRecording = async (list) => {
  conversationStore.requestId = list.idRequest
  conversationStore.setConversationId(list.idConversation)
  seconds.value = list.seconds

  conversationStore.transcriptChats = list.transcript

  tempFullTranscript.value = list.transcriptMedical

  const index = listNotification.value.findIndex(
    (item) => item.idConversation === list.idConversation
  )
  if (index !== -1) {
    tempListNotification.value.push(list)
    listNotification.value.splice(index, 1)
  }
  resetStoreData()
  event_bus.emit('close-draggable-recording-modal')
  if (list.isMedicalRecord) {
    if (list.source === 'create_memo_carte') {
      conversationStore.setSource('create_memo_carte')
    } else {
      conversationStore.setSource('update_memo_carte')
    }
    mtUtils.draggablePopupSevice()
  } else {
    mtUtils.draggablePopup()
  }
  conversationStore.setFlgRecording(true)
  event_bus.emit('recording-start')
}

const resetStoreData = (all: boolean = false) => {
  ;[
    'ai_summary',
    'ai_transcript_chats',
    'ai_summary_generated',
    'ai_flg_recording',
    'memo_cart_content'
  ].forEach((key) => {
    localStorage.removeItem(key)
  })
  conversationStore.setFlgRecording(false)
  if (all) {
    conversationStore.setSummaryGenerated(false)
    conversationStore.setSummaryGenerating(false)
    // conversationStore.setTranscriptChats([])
    // conversationStore.setSummary([])
    // seconds.value = 0
  }
}

const openSummary = async (list) => {
  const index = listNotification.value.findIndex(
    (item) => item.idConversation === list.idConversation
  )
  if (index !== -1) {
    listNotification.value.splice(index, 1)
  }

  const currentRoute = router.currentRoute.value

  if (list.source === 'create_memo_carte') {
    if (!conversationStore.getCreateMemoCarteModal) {
      mtUtils.popup(CreateMemoCarteModal, list.createMemoCarteData)

      setTimeout(() => {
        event_bus.emit(
          'update-memo-field',
          {
            content: list.generatedTranscript || list.transcriptMedical,
            summary: list.summary
          },
          list.currentMemoCarteData
        )
      }, 1000)
    } else if (
      conversationStore.getCreateMemoCarteModal &&
      currentRoute.params?.id === list.idRequest
    ) {
      event_bus.emit(
        'update-memo-field',
        {
          content: list.generatedTranscript || list.transcriptMedical,
          summary: list.summary
        },
        list.currentMemoCarteData
      )
    } else if (
      conversationStore.getCreateMemoCarteModal &&
      currentRoute.params?.id !== list.idRequest
    ) {
      event_bus.emit('close-create-carte-modal')

      setTimeout(() => {
        mtUtils.popup(CreateMemoCarteModal, list.createMemoCarteData)
      }, 500)
      setTimeout(() => {
        event_bus.emit(
          'update-memo-field',
          {
            content: list.generatedTranscript || list.transcriptMedical,
            summary: list.summary
          },
          list.currentMemoCarteData
        )
      }, 1000)
    }

    return
  }

  mtUtils.draggablePopupSummary({
    summary: list.summary,
    transcript: list.generatedTranscript,
    requestData: `${list.nameFamily} ${list.namePet} ${list.idRequest}`
  })
}

const setGeneratedSummaryandTranscript = (data) => {
  const findidConversation = listNotification.value.find(
    (item) => item.idConversation === data.id_conversation
  )
  if (findidConversation) {
    findidConversation.summary = data.summary
    findidConversation.generatedTranscript = data.transcript
  }
}

const spliceData = (id_conversation) => {
  const index = listNotification.value.findIndex(
    (item) => item.idConversation === id_conversation
  )
  if (index !== -1) {
    listNotification.value.splice(index, 1)
  }
}

// event_bus.on('close-notification-modal', () => {
//   closeModal()
// })
event_bus.on('set-generated-summary-and-transcript', (data) => {
  setGeneratedSummaryandTranscript(data)
})
event_bus.on('update-notification-status', (data) => {
  updateNotificationStatus(data)
})
event_bus.on('add-notification-list', (data) => {
  addNotificationList(data)
})

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  document.addEventListener('touchmove', onTouchMove)
  document.addEventListener('touchend', onTouchEnd)
})

onBeforeUnmount(() => {
  // stop event listeners
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
  event_bus.off('update-notification-status')
  event_bus.off('close-notification-modal')
  event_bus.off('set-generated-summary-and-transcript')
})
</script>

<template>
  <div
    class="adjustable-modal-container"
    ref="elModal"
    :style="{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }"
    tabindex="0"
    @mousedown="onMouseDragStart"
    @touchstart="onTouchDragStart"
  >
    <div
      class="adjustable-modal-content q-pa-sm"
      :style="list.statusMessage === 3 ? 'height: 100px' : 'height: 75px'"
      v-for="list in listNotification"
      :key="list.idConversation"
    >
      <div class="flex q-gutter-sm">
        <div class="col">
          <div
            class="text-h4 q-mb-md no-drag"
            style="font-weight: bold"
            :style="`color: ${
              list.statusMessage === 1 ? '#34c759' : '#be0123'
            }`"
            id="status-notification"
            @click="list.statusMessage === 2 ? switchRecording(list) : ''"
          >
            {{ statusMessageEnum(list.statusMessage) }}
          </div>
        </div>
        <div class="no-drag">
          <i
            v-if="list.statusMessage === 1"
            @click="openSummary(list)"
            style="font-size: 22px"
            class="q-icon notranslate material-icons text-black"
            aria-hidden="true"
            role="img"
            >description</i
          >
          <i
            v-else
            @click="openConversationList"
            id="openNotificationIcon"
            style="font-size: 22px"
            class="q-icon notranslate material-icons text-black"
            aria-hidden="true"
            role="img"
            >open_in_new</i
          >
        </div>
      </div>
      <div class="text-black">
        {{ `${list.nameFamily} ${list.namePet} ${list.idRequest}` }}
      </div>

      <div
        class="flex items-center justify-center"
        v-if="list.statusMessage === 3"
      >
        <q-btn
          flat
          dense
          class="text-primary text-center q-px-sm no-drag"
          label="×閉じる"
          style="font-size: 12px"
          @click.stop="spliceData(list.idConversation)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
$z-index-modal: 99999999999;

* {
  box-sizing: border-box;
}

.adjustable-modal-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: $z-index-modal;
  display: flex;
  flex-direction: column;
  // background-color: #fff;
  // border-radius: 8px;
  // box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  // width: 214px;
  // height: 75px;
  &.summary-generated {
    border-color: #34c759;
  }

  &:focus,
  &:focus-within {
    z-index: $z-index-modal + 1;
    outline: 0;
  }
}

.adjustable-modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.15);
  width: 214px;
  //height: 75px;
  margin-bottom: 8px;
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
</style>
