<script setup lang="ts">
import { onMounted, reactive, ref, nextTick } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useConversationStore, { ConversationStatus } from '@/stores/Conversation'
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import { useRecording } from './useRecording'
import { nanoid } from 'nanoid'
import usePetStore from '@/stores/pets'
import koekaruApi, { secretKey, getInstance } from '@/boot/axiosKoekaru'
import { PetType } from '@/types/types'

const props = withDefaults(
  defineProps<{
    id_employee: string
    datetime_memo_carte: string
    id_customer: string
    id_pet: string
    id_request: string
    number_request: string
    petSelected: PetType
    popup: any
  }>(),
  {
    id_employee: '',
    datetime_memo_carte: '',
    id_pet: '',
    id_customer: '',
    id_request: '',
    number_request: '',
    popup: {}
  }
)
const defaultEmployee = JSON.parse(
  localStorage.getItem('id_employee') as string
)

const emits = defineEmits(['close'])

const { seconds, tempFullTranscript, tempTranscript, saveCurrentRecord, recordingLimit } =
  useRecording()
const petsStore = usePetStore()
const conversationStore = useConversationStore()
const idEmployee = ref('')
const disableButton = ref(true)

const closeModal = () => {
  emits('close')
}

const data = ref({
  vet_name_user: '',
  datetime_memo_carte: '',
  id_question: '',
  microphone: ''
})

const microphonesList = ref<Array<any>>([]),
  microphonesListDefault = reactive<Array<any>>([])

const countdown = ref(false)
const countdownTime = ref(3)

async function requestMicrophoneAccess() {
  try {
    // Request access to the microphone only
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    await listAudioInputs()
  } catch (error) {}
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
      microphonesListDefault.push(...microphonesList.value)
      await nextTick()
      data.value.microphone = microphonesList.value[0]?.value

      disableButton.value = false
    })
    .catch((error) => {})
}

const startRecording = async () => {
  seconds.value = 0
  if (seconds.value >= recordingLimit.value) {
    await mtUtils.alert('Recording limit reached')
    return
  }
  disableButton.value = true
  if (!data.value.microphone) {
    await mtUtils.alert('マイクが未選択です')
    disableButton.value = false
    return false
  }

  if (conversationStore.flgRecording) {
    saveCurrentRecord({
      id_conversation: conversationStore.conversationId,
      is_medical_record: conversationStore.typeMedical,
      status_message: 2,
      seconds: seconds.value
    })
    // createNotification()
  }

  petsStore.pet = props.petSelected
  conversationStore.requestId = props.id_request
  const conversation_id = nanoid()
  conversationStore.setConversationId(conversation_id)

  resetStoreData()
  event_bus.emit('close-draggable-recording-modal')

  mtUtils.draggablePopupSevice()
  countdown.value = true
  const interval = setInterval(() => {
    countdownTime.value -= 1
    if (countdownTime.value === 0) {
      clearInterval(interval)

      conversationStore.setFlgRecording(true)
      conversationStore.setCurrentMic(data.value.microphone)
      props.popup.recordingStarted = true
      closeModal()
      event_bus.emit('recording-start')
      countdown.value = false
      countdownTime.value = 3
      disableButton.value = false
    }
  }, 1000)
}

const resetStoreData = () => {
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
  conversationStore.setSummaryGenerated(false)
  conversationStore.setSummaryGenerating(false)
  conversationStore.setTranscriptChats([])
  conversationStore.setSummary([])
  seconds.value = 0
  tempFullTranscript.value = ''
  tempTranscript.value = ''
}

const selectDefaultEmployee = () => {
  idEmployee.value = defaultEmployee
}

const init = async () => {
  const res = await koekaruApi.get('/questions')
  conversationStore.setQuestionTemplate(res.data.data)

  await nextTick()
  if (res.status === 200) {
    await requestMicrophoneAccess()
  } else {
    await mtUtils.alert('質問テンプレートの取得に失敗しました')
  }
}

onMounted(async () => {
  idEmployee.value = props.id_employee
  data.value.datetime_memo_carte = props.datetime_memo_carte

  try {
    if (!secretKey) await getInstance()
    await init()
  } catch (error: any) {
    if (error.response.data.detail === 'unauthorised access') {
      getInstance()
      await init()
    }
  }
})
</script>

<template>
  <q-form class="">
    <MtModalHeader @closeModal="disableButton ? '' : closeModal()">
      <div class="full-width"></div>
    </MtModalHeader>
    <q-card-section class="content q-px-md">
      <div class="flex row q-gutter-sm justify-center items-center">
        <q-btn
          round
          outline
          fab
          size="xl"
          class="bg-white text-primary flex row q-pa-lg"
          @click="startRecording()"
          :disable="disableButton"
          style="width: 120px; height: 118px"
        >
          <div
            class="flex column items-center justify-center"
            v-if="!countdown"
          >
            <div class="q-mx-sm">録音開始</div>
            <div class="">
              <q-icon name="mic_none" size="xl"> </q-icon>
            </div>
          </div>
          <div class="flex column items-center justify-center" v-else>
            <div class="text-grey-900 text-weight-bold" style="font-size: 46px">
              {{ countdownTime }}
            </div>
          </div>
        </q-btn>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn
          :disable="disableButton"
          outline
          class="bg-grey-100 text-grey-800"
          @click="closeModal()"
        >
          <span>キャンセル</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.mobile.platform-ios .content {
  height: auto !important;
}
</style>
