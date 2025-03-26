<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import { useRecording } from '@/pages/memoCarte/useRecording'

interface UpdateData {
  originalText: string
  correctedText: string
  fullSentence: string
}

const props = defineProps({
  text: {
    type: String,
    required: true
  },
  fullSentence: {
    type: String,
    required: true
  },
  selectedWord: {
    type: String,
    required: true
  },
  conversationId: {
    type: String,
    required: true
  },
  popup: {
    type: Object,
    default: () => ({})
  },
  onFeedbackComplete: {
    type: Function,
    default: () => {}
  }
})

const emits = defineEmits(['close', 'update:text', 'save'])
const { updateFeedbackData } = useRecording()

const editedText = ref(props.text)
const updatedData = ref<UpdateData[]>([])
const initialEditedText = ref('')

const localText = computed({
  get: () => editedText.value,
  set: (value) => {
    editedText.value = value
    emits('update:text', value)
    if (value !== props.text) {
      updatedData.value = [{
        originalText: props.text,
        correctedText: value,
        fullSentence: props.fullSentence
      }]
    } else {
      updatedData.value = []
    }
  }
})

const showConfirmation = ref(false)

const shouldEnableButton = computed(() => {
  if (updatedData.value.length === 0) return false
  
  if (showConfirmation.value && editedText.value !== initialEditedText.value) return true
  
  if (!showConfirmation.value && updatedData.value.length > 0) return true
  
  return false
})

const handleSave = async () => {
  try {
    const correctedSentence = props.fullSentence.replace(
      props.selectedWord,
      editedText.value
    )

    await updateFeedbackData(
      props.conversationId,
      props.fullSentence,
      correctedSentence,
      props.selectedWord,
      editedText.value
    )
  mtUtils.autoCloseAlertWithHeader(aahMessages.successWithHeader)
    props.onFeedbackComplete()
    emits('save')
    closeModal()
  } catch (error) {
    console.error('Error saving feedback:', error)
  }
}

const closeModal = () => {
  emits('close')
}

const handleShowConfirmation = () => {
  showConfirmation.value = true
  initialEditedText.value = editedText.value
}

</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
      フィードバックを送信する
      </q-toolbar-title>
    </MtModalHeader>

    <q-card-section class="w-full">
      <div class="q-pb-md">
        声カルをご利用いただきありがとうございます！<br>
        獣医療用語に誤変換がある場合は、修正してフィードバックを送信してください。
        文字起こし精度の改善に役立てさせていただきます。
      </div>
      <div class="row">
        <div class="col-10">
          <MtInputForm
            v-model="localText"
            outlined
            type="text"
            class="q-mb-md custom-input-modal"
          />
        </div>
        <div class="col-2">
          <q-btn 
            unelevated  
            :disabled="!shouldEnableButton"
            color="primary" 
            class="q-ml-md" 
            @click="handleShowConfirmation"
          >
            <span>保存</span>
          </q-btn>
        </div>
      </div>

      <div v-if="showConfirmation" class="column items-center q-mt-lg">
        <q-card v-if="updatedData.length" class="comparison-card q-mb-lg">
          <q-card-section>
            <div class="row comparison-header">
              <div class="col-6 text-center text-weight-medium">修正前</div>
              <div class="col-6 text-center text-weight-medium">修正後</div>
            </div>
            <div v-for="(item, index) in updatedData" :key="index" class="row comparison-row">
              <div class="col-6 text-center py-md">{{ item.originalText }}</div>
              <div class="col-6 text-center py-md text-negative">{{ item.correctedText }}</div>
            </div>
          </q-card-section>
        </q-card>

        <div v-if="updatedData && updatedData.length > 0">
          <q-btn
            unelevated
            color="primary"
            class="confirmation-btn q-mb-lg"
            @click="handleSave"
            :disable="!updatedData.length"
          >
            フィードバックを送る
          </q-btn>
        </div>
      </div>
    </q-card-section>
  </div>
</template>

<style lang="scss" scoped>
.custom-input-modal {
  width: 100% !important;
}

.confirmation-btn {
  width: 400px;
}

.modal-btn {
  margin-top: 32px;
}

.comparison-card {
  width: 100%;
  max-width: 600px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}

.comparison-header {
  border-radius: 8px 8px 0 0;

  .col-6 {
    padding: 12px 0;
    position: relative;

    &:first-child::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: #e9ecef;
    }
  }
}

.comparison-row {
  border-top: 1px solid #e9ecef;
  
  .col-6 {
    padding: 12px 16px;
    position: relative;

    &:first-child::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 1px;
      background-color: #e9ecef;
    }
  }
}
</style>