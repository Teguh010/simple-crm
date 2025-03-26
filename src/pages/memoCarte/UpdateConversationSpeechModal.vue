<script setup lang="ts">
import { onMounted, reactive, ref, nextTick, onUnmounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import TranscriptBubble from '@/pages/memoCarte/TranscriptBubble.vue'
import useConversationStore from '@/stores/Conversation'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'
import UpdateSpeech from '@/pages/memoCarte/detail/UpdateSpeech.vue'
import UpdateSummary from '@/pages/memoCarte/detail/UpdateSummary.vue'
import VerifySummaryModal from '@/pages/memoCarte/confirmation/VerifySummary.vue'
import DeleteRecording from '@/pages/memoCarte/confirmation/DeleteRecording.vue'
import reconfirmTemplate from '@/pages/memoCarte/confirmation/reconfirmTemplate.vue'
import { storeToRefs } from 'pinia'
import useMemoCarteStore from '@/stores/memo-cartes'
import { useRecording } from './useRecording'
import { event_bus } from '@/utils/eventBus'
import mtUtils from '@/utils/mtUtils'
import { Notify } from 'quasar'
import aahMessages from '@/utils/aahMessages'

const {
  toggleTranscribing,
  stopRecording,
  resumeRecording,
  tempTranscript,
  seconds,
  deleteConversation,
  recordingButtonIcon,
  flgVerified,
  submitMemoCarte,
  pauseRecording,
  createNotification,
  isPaused,
  handleLimitRecording
} = useRecording()

const emits = defineEmits(['close'])

const closeModal = async () => {
  emits('close')
}

const loader = ref(false)

const conversationStore = useConversationStore()
const memoCarteStore = useMemoCarteStore()
const {
  getTranscriptChats,
  getSummaryGenerating,
  getSummaryGenerated,
  getCurrentConversation,
  getSummary
} = storeToRefs(conversationStore)

const showSummaryExpand = ref(false),
  showSpeechExpand = ref(false),
  transcriptChatScroll = ref(null)

const toggleSpeechExpand = () => {
  showSpeechExpand.value = !showSpeechExpand.value
}

const toggleSummaryExpand = () => {
  showSummaryExpand.value = !showSummaryExpand.value
}

function getTranscriptChatsHeight() {
  return window.innerHeight - 290 + 'px'
}

// event_bus.on('speech_created', (virtualIndex: any) => {
//   nextTick().then(() => {
//     // @ts-ignore
//     transcriptChatScroll.value?.setScrollPercentage('vertical', 2.0)
//   })
// })

const verifySummary = async () => {
  let popup: { isConfirmed: boolean } = {
    isConfirmed: false
  }
  await mtUtils.smallPopup(VerifySummaryModal, { popup })
  if (popup.isConfirmed) {
    let payload: { flg_verified: boolean } = {
      flg_verified: true
    }

    // if (
    //   getTranscriptChats.value &&
    //   getTranscriptChats.value.length &&
    //   getTranscriptChats.value.length > 0
    // ) {
    //   // @ts-ignore
    //   getTranscriptChats.value.forEach(
    //     (speech: any) =>
    //       (speech.id_conversation =
    //         getCurrentConversation.value.id_conversation)
    //   )

    //   // Update all speeches
    //   await Promise.all(
    //     getTranscriptChats.value?.map((speech: any) =>
    //       conversationStore.editSpeech(speech.id_speech, speech)
    //     )
    //   )
    // }

    // Update summary
    // @ts-ignore
    // payload.summary = getSummary.value
    // @ts-ignore
    // conversationStore
    //   .editConversation(getCurrentConversation.value.id_conversation, payload)
    //   .then(async () => {
    //     flgVerified.value = '1'
    // submit memo carte with flg_verified = true
    await submitMemoCarte()
    //   closeModal()
    // })
  }
}

const deleteRecording = async () => {
  loader.value = true
  if (!isPaused.value) {
    await pauseRecording()
  }
  if (await deleteConversation()) {
    event_bus.emit('close-draggable-recording-modal')
    closeModal()
  } else {
    loader.value = false
  }
}

const openReconfirmTemplateModal = async () => {
  loader.value = true
  const conversation_id = conversationStore.conversationId
  const question_id = conversationStore.questionId
  let popup: any = {
    isConfirmed: false,
    id_template: question_id,
    apiOptions: 'speech'
  }
  if (!isPaused.value) {
    await pauseRecording()
  }
  await mtUtils.mediumPopup(reconfirmTemplate, { popup })
  if (popup.isConfirmed) {
    event_bus.emit('close-draggable-recording-modal')
    createNotification(conversation_id, false)
    closeModal()
    await stopRecording(
      popup.id_template,
      2,
      // popup.apiOptions,
      conversation_id,
      popup.id_template
    )
  } else {
    loader.value = false
    resumeRecording()
  }
}

const handleSubmitMemoCarte = async () => {
  let popup: { isConfirmed: boolean } = {
    isConfirmed: false
  }
  await mtUtils.smallPopup(VerifySummaryModal, { popup })
  if (popup.isConfirmed) {
    await submitMemoCarte()
    closeModal()
  }
}

onMounted(() => {
  conversationStore.setAutoReflectMemoCarte(false)
})

event_bus.on('recording-limit-reached', async () => {
  const result = await handleLimitRecording()
  if (result) {
    closeModal()
  }
})

// onUnmounted(() => {
//   event_bus.off('speech_created')
// })
</script>

<template>
  <q-form>
    <MtModalHeader @closeModal="closeModal" :closeBtn="false">
      <q-toolbar-title class="text-grey-900 title2 bold">
        {{ getSummaryGenerated ? '文字おこし / 要約　テキスト編集' : '' }}
      </q-toolbar-title>
      <template v-if="!getSummaryGenerated">
        <q-btn
          :icon="recordingButtonIcon"
          class="bg-danger q-px-xl text-white q-mr-md"
          @click.stop="toggleTranscribing"
          :disable="loader"
        >
        </q-btn>
        <q-btn
          outline
          class="bg-grey-100 text-grey-800 q-mr-md"
          @click="deleteRecording"
          :disable="loader"
        >
          <span>録音を中止</span>
        </q-btn>
      </template>
      <q-btn flat round @click="closeModal" :disable="getSummaryGenerated">
        <q-icon size="xs" name="close" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="q-mb-md">
        <div class="q-gutter-md">
          <div class="row">
            <template v-if="!getSummaryGenerated">
              <div class="col-12">
                <q-scroll-area
                  :style="{ width: '100%', height: getTranscriptChatsHeight() }"
                  width="100%"
                  class="separate-scrollbar q-mt-sm"
                  ref="transcriptChatScroll"
                >
                  <template
                    v-if="
                      getTranscriptChats &&
                      getTranscriptChats.length &&
                      getTranscriptChats.length > 0
                    "
                  >
                    <template
                      v-for="(item, idx) in getTranscriptChats"
                      :key="idx"
                    >
                      <TranscriptBubble
                        v-model:chat="item.speech"
                        :isFinished="getSummaryGenerated"
                        :link="item.speech_audio_url"
                        :allClasses="!(idx === 0) ? 'q-mt-md' : ''"
                      />
                    </template>
                  </template>
                </q-scroll-area>
              </div>
              <div
                class="bubble col-12 flex items-center q-pl-md bg-grey-100 q-mt-lg"
              >
                {{ tempTranscript }}
              </div>
            </template>
            <template v-else>
              <div
                :class="showSpeechExpand ? 'col' : 'col-6'"
                v-if="!showSummaryExpand"
              >
                <UpdateSpeech
                  :fullAudioSrc="getCurrentConversation?.path_full_audio_file"
                  :showSummaryExpand="showSpeechExpand"
                  @toggle="toggleSummaryExpand"
                  @toggle:summary="showSpeechExpand = false"
                />
              </div>
              <div
                :class="showSummaryExpand ? 'col' : 'col-6'"
                v-if="!showSpeechExpand"
              >
                <UpdateSummary
                  :showSpeechExpand="showSummaryExpand"
                  @toggle="toggleSpeechExpand"
                  @toggle:speech="showSummaryExpand = false"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn
          unelevated
          color="primary"
          :disable="loader"
          class="q-ml-md"
          @click="openReconfirmTemplateModal"
        >
          要約リクエスト
        </q-btn>

        <!-- <template v-else>
          <q-btn
            outline
            class="bg-grey-100 text-grey-800"
            @click="handleSubmitMemoCarte"
          >
            <img
              src="@/assets/img/aiVetty/save.png"
              class="text-white q-mr-sm"
              style="width: 22px; height: 18px"
            />
            一時保存
          </q-btn>
          <q-btn
            unelevated
            color="primary"
            class="q-ml-md"
            @click="verifySummary"
          >
            <img
              src="@/assets/img/aiVetty/verify.png"
              class="text-white q-mr-sm"
              style="width: 20px; height: 20px"
            />
            確定保存
          </q-btn>
        </template> -->
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.mobile.platform-ios .content {
  height: calc(100dvh - 21dvh);
}
.bubble {
  min-height: 48px;
  border-radius: 30px;
  padding-top: 9px;
  padding-bottom: 9px;
  position: fixed;
  bottom: 80px;
  width: 90% !important;
}

.separate-scrollbar {
  :deep(.q-scrollarea__content) {
    max-height: unset !important;
  }
}
</style>
