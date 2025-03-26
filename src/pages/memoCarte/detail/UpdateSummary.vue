<script setup lang="ts">
import { ref } from 'vue'
import useConversationStore from '@/stores/Conversation'
import { storeToRefs } from 'pinia'
import { useRecording } from '../useRecording'

const { updatedSummary } = useRecording()

const props = defineProps({
  showSpeechExpand: {
    default: false,
    required: true
  }
})

const emit = defineEmits(['toggle', '@toggle:speech'])

const conversationStore = useConversationStore()
const { getSummary } = storeToRefs(conversationStore)
console.log('getSummary', getSummary)
</script>

<template>
  <div class="flex items-center">
    <div
      v-if="showSpeechExpand"
      class="speech-header text-white q-py-xs text-center q-mb-sm"
      @click="$emit('toggle:speech')"
    >
      <q-icon
        name="chevron_left"
        size="25px"
        class="q-px-md cursor-pointer text-center"
      />
    </div>
    <div
      class="text-center bg-accent-900 text-white q-py-xs q-mb-sm"
      style="flex: 1"
    >
      要約
      <q-icon
        name="chevron_right"
        size="25px"
        style="float: right"
        class="q-mr-md cursor-pointer"
        @click="$emit('toggle')"
        v-if="!showSpeechExpand"
      />
    </div>
  </div>
  <div class="summary q-pa-sm">
    <q-scroll-area
      style="width: 100%; max-width: 100%; height: calc(100vh - 285px)"
      class="separate-scrollbar"
    >
      <template
        v-for="(item, idx) in updatedSummary(getSummary)"
        :key="`${idx}-${item.id_question_detail}`"
      >
        <div class="summary-title" :class="!(idx === 0) ? 'q-mt-md' : ''">
          {{ item.question_display_title }}
        </div>
        <q-input
          type="textarea"
          v-model="item.ai_summary"
          autogrow
          borderless
          class="q-mt-xs answer summary-ai-answer bg-white q-pa-sm"
        />
      </template>
    </q-scroll-area>
  </div>
</template>

<style lang="scss" scoped>
.speech-header {
  background-color: var(--System-Gray-900, #212121);
}
.summary {
  background-color: $accent-050;
  &.content-sec {
    height: calc(100vh - 285px);
  }
  .summary-title {
    color: var(--System-Gray-900, #212121);
    font-weight: bold;
    font-size: 15px;
  }
  .answer {
    :deep(textarea) {
      padding-top: 0 !important;
      line-height: 1.6;
    }
  }
  .separate-scrollbar {
    :deep(.q-scrollarea__content) {
      max-height: unset !important;
    }
  }
}
</style>
