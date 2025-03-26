<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import AudioPlayer from '@liripeng/vue-audio-player'
import { useRecording } from '@/pages/memoCarte/useRecording'
import useConversationStore from '@/stores/Conversation'
import { typeAudioSpeedOptions } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import TextEditModal from '@/components/modals/TextEditModal.vue'
import mtUtils from '@/utils/mtUtils'
import { useTextSelection } from '@/utils/composables/UseTextSelection'

const { updatedSummary } = useRecording()

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const props = defineProps({ data: Object, searchData: Function })

const conversationStore = useConversationStore()

const searchedQuery = ref(''),
  transcription = ref(props.data.transcription),
  transcriptionSearched = ref('')

const isFeedbackMode = ref(false)

const toggleFeedbackMode = () => {
  isFeedbackMode.value = !isFeedbackMode.value
}

const handleFeedbackComplete = () => {
  isFeedbackMode.value = false
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

const getFullAudioSrc = () => {
  return [props.data?.path_full_audio_file]
}

const audioRef = ref(null)
const currentTime = ref(0)
const isPlaying = ref(false)
const activeChunkIndex = ref({ segmentIndex: -1, chunkIndex: -1 })
const audioElement = ref<HTMLAudioElement | null>(null)

const handleTimeUpdate = (event) => {
  currentTime.value = event.target.currentTime
}

watch([currentTime, isPlaying], ([newTime, playing]) => {
  
  if (!playing) {
    activeChunkIndex.value = { segmentIndex: -1, chunkIndex: -1 }
    return
  }

  for (let i = 0; i < props.data.transcript_with_timeline.length; i++) {
    const segment = props.data.transcript_with_timeline[i]
    for (let j = 0; j < segment.chunk.length; j++) {
      const chunk = segment.chunk[j]
      if (newTime >= chunk.start_time && newTime <= chunk.end_time) {
        activeChunkIndex.value = { segmentIndex: i, chunkIndex: j }
        return
      }
    }
  }
  activeChunkIndex.value = { segmentIndex: -1, chunkIndex: -1 }
}, { immediate: true })

const handleSegmentClick = async (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const startTime = parseFloat(target.getAttribute('data-start-time') || '0')
  
  
  if (audioRef.value) {
    try {
      const audioElement = audioRef.value.$el.querySelector('audio')

      if (audioElement) {
        audioElement.currentTime = startTime
        currentTime.value = startTime 
        
        if (isPlaying.value) {
          const playPromise = audioElement.play()
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
            }).catch(error => {
              console.error('Error playing audio:', error)
            })
          }
        } else {
          console.warn('Audio seeked without playing (pause state)')
        }
      } else {
        console.warn('Audio element not found')
      }
    } catch (error) {
      console.error('Error controlling audio:', error)
    }
  } else {
    console.warn('Audio ref not available')
  }
}

onMounted(() => {
  const transcriptWindow = document.getElementById('transcript_window')
  if (transcriptWindow) {
    transcriptWindow.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.classList.contains('transcript-segment')) {
        handleSegmentClick(e)
      }
    })
  }
})

const transcriptionHighlighted = computed(() => {
  if (searchedQuery.value && props.data.transcription) {
    const regex = new RegExp(`(${searchedQuery.value})`, 'gi')
    return props.data.transcription.replace(
      regex,
      '<span class="highlight">$1</span>'
    )
  }

  if (!props.data.transcript_with_timeline) {
    return props.data.transcription
  }

  return props.data.transcript_with_timeline.map((segment, segmentIndex) => {
    return segment.chunk.map((chunk, chunkIndex) => {
      const isActive = isPlaying.value && 
        activeChunkIndex.value.segmentIndex === segmentIndex && 
        activeChunkIndex.value.chunkIndex === chunkIndex
      
      return `<span 
        class="transcript-segment${isActive ? ' active-transcript' : ''}"
        data-segment="${segmentIndex}"
        data-chunk="${chunkIndex}"
        data-start-time="${chunk.start_time}"
        data-end-time="${chunk.end_time}"
      >${chunk.text.trim()}</span>`
    }).join(' ')
  }).join(' ')
})

watch(activeChunkIndex, (newValue) => {
}, { deep: true })

const searchKeyword = () => {
  if (!searchedQuery.value || !transcription.value) {
    transcriptionSearched.value = transcription.value
    return
  }
  const regex = new RegExp(`(${searchedQuery.value})`, 'gi')
  const transcript = transcription.value.replace(
    regex,
    '<span class="highlight">$1</span>'
  )
  transcriptionSearched.value = transcript
}

const newUpdatedSummary = computed(() => {
  return updatedSummary(props.data.summary)
})

const {
  handleTouchStart: onTouchStart,
  handleTouchMove: onTouchMove,
  handleTouchEnd: onTouchEnd
} = useTextSelection({
  containerId: 'transcript_window',
  onSelectionComplete: (text) => {
    if (!isFeedbackMode.value) return
    handleSelectionComplete(text, text)
  }
})

const onPlay = () => {
  isPlaying.value = true
}

const onPause = () => {
  isPlaying.value = false
}
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      文字おこし / 要約 / 音声
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-px-xl">
    <div class="row">
      <div
        :class="
          newUpdatedSummary && newUpdatedSummary.length > 0 ? 'col-6' : 'col-12'
        "
      >
        <div
          class="text-center header text-white q-py-xs q-mb-sm"
          style="flex: 1"
        >
          文字おこし
        </div>
        <div class="q-py-sm q-pr-xs">
          <div v-if="isFeedbackMode" class="feedback-mode-header">
            誤変換がある単語を選択してください
          </div>
          <q-scroll-area
            style="width: 100%; max-width: 100%; height: calc(100vh - 385px)"
            class="separate-scrollbar summary q-pa-sm"
            :class="{ 'feedback-mode': isFeedbackMode }"
          >
            <div class="flex-grow-container relative">
              <div
                id="transcript_window"
                class="highlightable-input"
                v-html="transcriptionHighlighted"
                @mouseup="handleMouseSelection"
                @touchstart.stop="onTouchStart" 
                @touchmove.stop="onTouchMove" 
                @touchend.stop="onTouchEnd"
              />
              <q-btn
              class="absolute corner-button"
              round 
              flat 
              color="#4E6E9D" 
              icon="o_feedback" 
              @click="toggleFeedbackMode"
            />
            </div>
          </q-scroll-area>
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
      </div>
      <div
        class="col-6"
        v-if="newUpdatedSummary && newUpdatedSummary.length > 0"
      >
        <div class="text-center bg-accent-900 text-white q-py-xs q-mb-sm">
          要約
        </div>
        <div class="q-py-sm q-pl-xs">
          <q-scroll-area
            style="width: 100%; max-width: 100%; height: calc(100vh - 385px)"
            class="separate-scrollbar summary q-pa-sm"
          >
            <div class="row q-col-gutter-md">
              <template
                v-for="(item, idx) in newUpdatedSummary"
                :key="`${idx}-${item.id_question_detail}`"
              >
                <div
                  :class="
                    newUpdatedSummary.length && newUpdatedSummary.length > 1
                      ? 'col-6'
                      : 'col-12'
                  "
                >
                  <div class="summary-title">
                    {{ item.question_display_title }}
                  </div>
                  <q-input
                    type="textarea"
                    v-model="item.ai_summary"
                    autogrow
                    borderless
                    class="q-mt-xs answer summary-ai-answer bg-white q-pa-sm"
                  />
                </div>
              </template>
            </div>
          </q-scroll-area>
        </div>
      </div>
    </div>
    <div class="q-mt-md full-audio-player">
      <audio-player
        v-if="getFullAudioSrc().length > 0"
        ref="audioRef"
        :audio-list="getFullAudioSrc()"
        theme-color="#BC6EFF"
        :show-next-button="false"
        :show-prev-button="false"
        :playback-rates="typeAudioSpeedOptions.map((v) => v.value)"
        @timeupdate="handleTimeUpdate"
        @play="onPlay"
        @pause="onPause"
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white"> </q-card-section>
</template>

<style lang="scss" scoped>
.header {
  background-color: var(--System-Gray-900, #212121);
}

.summary {
  background-color: $accent-050;
  &.content-sec {
    height: calc(100vh - 385px);
  }
  .summary-title {
    color: var(--System-Gray-900, #212121);
    font-weight: bold;
    font-size: 15px;
  }
  .answer {
    min-height: calc(100% - 32px);
    margin: 10px 0;
    :deep(textarea) {
      padding-top: 0 !important;
      line-height: 1.6;
    }
  }
}
.separate-scrollbar {
  :deep(.q-scrollarea__content) {
    max-height: unset !important;
  }
}
.full-audio-player {
  width: 50%;
  margin: 16px auto;
}

.highlightable-input {
  min-height: 300px;
  font-weight: 400;
  letter-spacing: 0.00937em;
  padding: 12px;
  color: rgba(0, 0, 0, 0.87);
  border-radius: 8px 8px 0 0;
  line-height: 1.8;

  :deep(.transcript-segment) {
    display: inline-block;
    padding: 2px 4px;
    margin: 0 2px;
    border-radius: 3px;
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      background-color: rgba(188, 110, 255, 0.1) !important;
    }
    
    &.active-transcript {
      background-color: rgba(188, 110, 255, 0.2) !important;
      box-shadow: 0 0 0 2px rgba(188, 110, 255, 0.1) !important;
    }
  }
}

:deep(.highlight) {
  background-color: yellow;
}

.feedback-mode-header {
  background-color: #FFFF;
  color: black;
  padding: 8px 16px;
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

.summary {
  &.feedback-mode {
    background-color: #FFE8E8;
    
    ::selection {
      background-color: #FFEB3B;
      color: black;
    }
    :deep(::selection) {
      background-color: #FFEB3B;
      color: black;
    }
  }
}
</style>
