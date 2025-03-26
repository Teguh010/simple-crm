<script setup lang="ts">
import { onMounted, reactive, ref, computed, nextTick } from 'vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useQuestionTemplateStore from '@/stores/questionTemplates'
import useConversationStore, { ConversationStatus } from '@/stores/Conversation'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import { useRecording } from './useRecording'
import { Notify } from 'quasar'
import { useRoute } from 'vue-router'
import useCustomerStore from '@/stores/customers'
import usePetStore from '@/stores/pets'
import { nanoid } from 'nanoid'
import koekaruApi, { secretKey, getInstance } from '@/boot/axiosKoekaru'
import { PetType } from '@/types/types'

const customerStore = useCustomerStore()
const petsStore = usePetStore()

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
const route = useRoute()
const defaultEmployee = JSON.parse(
  localStorage.getItem('id_employee') as string
)

const emits = defineEmits(['close'])

const { seconds, saveCurrentRecord } = useRecording()

const questionTemplateStore = useQuestionTemplateStore()
const conversationStore = useConversationStore()
const employeesStore = useEmployeeStore()
const { getAllQuestionTemplates } = storeToRefs(questionTemplateStore)
const { getEmployees, getDoctors } = storeToRefs(employeesStore)
const { getCustomer } = storeToRefs(customerStore)
const { getPet } = storeToRefs(petsStore)
const idEmployee = ref('')

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
const questionTemplatesList = ref<Array<any>>([]),
  questionTemplatesListDefault = reactive<Array<any>>([])

async function requestMicrophoneAccess() {
  try {
    // Request access to the microphone only
    await navigator.mediaDevices.getUserMedia({ audio: true })
    listAudioInputs()
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
      console.log('microphonesList.value', microphonesList.value)
    })
    .catch((error) => {})
}

const startRecording = async () => {
  if (!data.value.microphone) {
    await mtUtils.alert('マイクが未選択です')
    return false
  }
  if (!data.value.id_question) {
    await mtUtils.alert('要約フォーマットを指定してください')
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

  // getting related code_employee from m_employees
  if (
    getEmployees.value &&
    getEmployees.value.length &&
    getEmployees.value.length > 0
  ) {
    data.value.vet_name_user = getEmployees.value.find(
      (v) => v.id_employee == idEmployee.value
    )?.code_employee as string
  }

  petsStore.setPet(props.petSelected)
  conversationStore.requestId = props.id_request
  conversationStore.setQuestionId(data.value.id_question)
  const conversation_id = nanoid()
  conversationStore.setConversationId(conversation_id)

  resetStoreData()
  event_bus.emit('close-draggable-recording-modal')
  mtUtils.draggablePopup()
  conversationStore.setFlgRecording(true)
  conversationStore.setCurrentMic(data.value.microphone)
  props.popup.recordingStarted = true
  closeModal()
  event_bus.emit('recording-start')
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
}

const selectDefaultEmployee = () => {
  idEmployee.value = defaultEmployee
}

const init = async () => {
  const res = await koekaruApi.get('/questions')
  if (res) {
    idEmployee.value = props.id_employee
    data.value.datetime_memo_carte = props.datetime_memo_carte
    await requestMicrophoneAccess()
    const questionTemplate = res.data.data.map((question: any) => {
      return {
        label: question.name_template,
        value: question.question_id,
        ...question
      }
    })
    questionTemplateStore.questionTemplates = questionTemplate
    questionTemplatesList.value = [
      ...questionTemplateStore.getAllQuestionTemplates
    ]
    questionTemplatesListDefault.push(
      ...questionTemplateStore.getAllQuestionTemplates
    )
    if (
      questionTemplatesList.value &&
      questionTemplatesList.value.length &&
      questionTemplatesList.value.length > 0
    ) {
      data.value.id_question = questionTemplatesList.value.find(
        (v) => v.value
      )?.value
    }
  }
}

onMounted(async () => {
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
  <q-form>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        声でカルテ® 基本設定
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="q-my-md">
        <InputEmployeeOptGroup
          label="記録者"
          v-model:selected="idEmployee"
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee"
        />
      </div>
      <div class="q-my-md">
        <MtFormInputDate
          v-model:date="data.datetime_memo_carte"
          label="メモカルテ記録日時"
        />
      </div>
      <div class="q-my-md">
        <MtFilterSelect
          v-model:options="questionTemplatesList"
          label="カルテ型"
          v-model:selecting="data.id_question"
          :options-default="questionTemplatesListDefault"
        />
      </div>
      <div class="q-my-md">
        <MtFilterSelect
          v-model:options="microphonesList"
          label="録音デバイス"
          v-model:selecting="data.microphone"
          :options-default="microphonesListDefault"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          @click="startRecording()"
        >
          <span>録音開始</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style></style>
