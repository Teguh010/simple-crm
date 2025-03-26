<script setup lang="ts">
import { computed, ref } from 'vue'
import useConversationStore from '@/stores/Conversation'
import TranscriptBubble from '@/pages/memoCarte/TranscriptBubble.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { storeToRefs } from 'pinia'
import { useRecording } from '@/pages/memoCarte/useRecording'
import AudioPlayer from '@liripeng/vue-audio-player'
import { audioSpeedOptions } from '@/utils/enum'

const { fullAudioSource } = useRecording()

const props = defineProps({
  fullAudioSrc: {
    default: '',
    required: false
  },
  showSummaryExpand: {
    default: false,
    required: true
  }
})

const emit = defineEmits(['toggle', 'toggle:summary'])

const conversationStore = useConversationStore()
const { getTranscriptChats, getSummaryGenerated, getCurrentConversation } =
  storeToRefs(conversationStore)

const searchedQuery = ref(''),
  isPlaying = ref(false),
  audioRef = ref(null),
  transcriptChatsRef = ref(null),
  childFormRefs = ref([])

const regenerateSummaryQueue = () => {
  // Enable Regenerate button when edit feature is added.
}

const getFullAudioSrc = () => {
  return [
    getCurrentConversation.value?.path_full_audio_file || fullAudioSource.value
  ]
}

const setChildRef = (index: any) => (el: any) => {
  if (el) {
    childFormRefs.value[index] = el
  } else childFormRefs.value.splice(index, 1)
}

const transcriptionSearched = ref('')

const transcriptionHighlighted = computed(() => {
  if (!transcriptionSearched.value) {
    return getTranscriptChats.value
  }
  return transcriptionSearched.value
})

const searchKeyword = () => {
  if (!searchedQuery.value || !getCurrentConversation.value?.transcription) {
    transcriptionSearched.value = getCurrentConversation.value?.transcription
    return
  }
  const regex = new RegExp(`(${searchedQuery.value})`, 'gi')
  const transcript = getCurrentConversation.value?.transcription.replace(
    regex,
    '<span class="highlight">$1</span>'
  )
  console.log(transcript)
  transcriptionSearched.value = transcript
}
</script>

<template>
  <div class="">
    <div class="flex">
      <div
        class="text-center header text-white q-py-xs q-mb-sm"
        style="flex: 1"
      >
        <q-icon
          name="chevron_left"
          size="25px"
          class="q-ml-md cursor-pointer"
          style="float: left"
          @click="$emit('toggle')"
          v-if="!showSummaryExpand"
        />
        文字おこし
      </div>
      <div
        class="text-center bg-accent-900 text-white q-py-xs q-mb-sm"
        v-if="showSummaryExpand"
        @click="$emit('toggle:summary')"
      >
        <q-icon
          name="chevron_right"
          size="25px"
          class="text-center q-px-md cursor-pointer"
        />
      </div>
    </div>
    <div class="q-pa-sm">
      <div>
        <!--          <q-input-->
        <!--            v-if=""-->
        <!--            v-model="getCurrentConversation.transcription"-->
        <!--            filled-->
        <!--            type="textarea"-->
        <!--            autogrow-->
        <!--            input-style="min-height: 300px"-->
        <!--          />-->
        <div
          id="transcription-field"
          class="highlightable-input"
          v-html="transcriptionHighlighted"
        />
      </div>
      <!--        <q-scroll-area style="width: 100%; max-width: 100%; height: calc(100vh - 445px)" class="separate-scrollbar" ref="transcriptChatsRef">-->

      <!--          <template v-for="(item, idx) in getTranscriptChats" :key="`${idx}-${item.id_speech}`">-->
      <!--            <TranscriptBubble-->
      <!--              v-model:chat="item.speech"-->
      <!--              :isFinished="getSummaryGenerated"-->
      <!--              :link="item.speech_audio_url"-->
      <!--              :allClasses="!(idx === 0) ? 'q-mt-md' : ''"-->
      <!--              :idSpeech="item.id_speech"-->
      <!--              :ref="setChildRef(idx)"-->
      <!--            />-->
      <!--          </template>-->
      <!--        </q-scroll-area>-->
      <div>
        <div class="q-mt-md">
          <audio-player
            ref="audioRef"
            :audio-list="getFullAudioSrc()"
            theme-color="#BC6EFF"
            :show-next-button="false"
            :show-prev-button="false"
            :playback-rates="audioSpeedOptions.map((v) => v.value)"
          />
        </div>
        <div class="flex items-center q-mt-md">
          <MtInputForm
            type="text"
            v-model="searchedQuery"
            outlined
            @keydown.enter="searchKeyword"
          />
          <q-btn
            icon="search"
            color="primary"
            rounded
            class="q-ml-sm"
            @click="searchKeyword"
          />
        </div>
        <div>
          <!-- <q-btn label="再要約" unelevated color="primary" @click="regenerateSummaryQueue" /> -->
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header {
  background-color: var(--System-Gray-900, #212121);
}
.separate-scrollbar {
  :deep(.q-scrollarea__content) {
    max-height: unset !important;
  }
}

.highlightable-input {
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.42);
  min-height: 300px;
  font-weight: 400;
  letter-spacing: 0.00937em;
  padding: 12px;
  color: rgba(0, 0, 0, 0.87);
  border-radius: 8px 8px 0 0;
}

:deep(.highlight) {
  background-color: yellow;
}
</style>
