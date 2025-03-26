<script setup lang="ts">
import {onMounted, reactive, ref, computed} from 'vue'
import useConversationStore from '@/stores/Conversation'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'

const emit = defineEmits(['update:chat'])

const props = withDefaults(defineProps<{
  chat: string,
  isFinished: boolean,
  link: string,
  allClasses: string,
  searchedQuery: string,
  idSpeech: string
}>(), {
  chat: '',
  isFinished: false,
  link: '',
  allClasses: '',
  searchedQuery: '',
  idSpeech: ''
})

const conversationStore = useConversationStore()
const { getSummaryGenerated } = storeToRefs(conversationStore)

const isPlaying = ref(false), audioRef = ref(null), inputRef = ref(null), highlightClass = ref('')

const currentChat = computed({
  get: () => props.chat,
  set: (value) => {
    emit('update:chat', value);
  }
})

const playAudio = () => {
  if (audioRef.value) {
    isPlaying.value = true
    audioRef.value.play();
  }
};

const pauseAudio = () => {
  if (audioRef.value) {
    isPlaying.value = false
    audioRef.value.pause();
  }
};

const getClassesArray = (highlight:any = false) => {
  let classes = []
  if(getSummaryGenerated.value) {
    classes.push('full-width')
  }
}

const deleteTranscriptBubble = async () => {
  if(!props.idSpeech) return false
  await mtUtils.confirm(aahMessages.delete_ask, aahMessages.delete)
    .then((confirmation) => {
      if (confirmation) {
        conversationStore.deleteSpeech(props.idSpeech).then(() => {
          conversationStore.setTranscriptChats(conversationStore.getTranscriptChats.filter((chat) => chat.id_speech !== props.idSpeech))
        })
      }
  })
}

defineExpose({
  inputRef
})

</script>

<template>
  <div class="summary flex justify-center" :class="allClasses" :id="`speech-${idSpeech}`" ref="inputRef">
    <q-input
      borderless
      type="textarea"
      autogrow
      v-model="currentChat"
      @focus="selected = true"
      @blur="selected = true"
      class="box q-py-xs q-px-md bg-grey-100 flex justify-between items-center"
      :class="getClassesArray()"
     >
        <template v-slot:append>
          <div v-if="isFinished" class="q-pl-lg flex items-center icons" style="flex-wrap: nowrap">
            <q-icon name="delete" @click="deleteTranscriptBubble" />
            <q-icon name="pause" class="play_icon" v-if="isPlaying" @click="pauseAudio" />
            <q-icon name="play_arrow" class="play_icon" @click="playAudio" v-else />
          </div>
        </template>
      </q-input>
  </div>
  <audio ref="audioRef" :src="link" style="display: none;" @ended = "isPlaying = false"></audio>
</template>

<style lang="scss" scoped>
  .summary {
     flex-wrap: nowrap;
    .box {
      border-radius: 30px;
      width: 80%;
      flex-wrap: nowrap;
      transition: .1s;
      &.highlight {
        background-color: $accent-100 !important;
        border: 4px solid $accent-300;
      }
      @media screen and (max-width: 767px) {
        width: 100%;
      }
      :deep(.q-field__control) {
        align-items: center;
         textarea {
        //   overflow-y: visible !important;
          padding-left: 5px;
          line-height: 1.3;
         }
      }
      :deep(i) {
        font-size: 20px;
        cursor: pointer;
        &.play_icon {
          font-size: 25px;
        }
        &:nth-child(2) {
          margin: 0 10px;
        }
      }
    }
  }
</style>