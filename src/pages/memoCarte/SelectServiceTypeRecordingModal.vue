<script setup lang="ts">
import { ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import aahValidations from '@/utils/aahValidations'
import useConversationStore from '@/stores/Conversation'

const conversationStore = useConversationStore()

const props = defineProps({
  popup: {
    type: Object,
    default: {}
  }
})

const serviceType = ref(true)
const itemServiceType = [
  {
    label: '1人メモ',
    value: true
  },
  {
    label: '診療会話',
    value: false
  }
]

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const submit = () => {
  props.popup.isMedicalRecord =
    props.popup.source === 'create_memo_carte' ? true : serviceType.value
  props.popup.selected = true
  closeModal()
}
</script>

<template>
  <q-form>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        声でカルテ® 基本設定
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="q-my-md text-center">
      <template v-if="popup.source === 'create_memo_carte'">
        <div class="custom-button-select-container">
          <div
            @click="submit"
            class="recording-btn bg-primary flex column justify-center items-center cursor-pointer custom-mic-button-select"
          >
            <q-img
              src="@/assets/img/request/dictation_mic.png"
              fit="none"
              width="16px"
              height="16px"
            />
            <span class="text-white custom-text-mic">新規</span>
          </div>
          <div class="text-grey-800 q-pt-md text-bold">音声からSOAPを作成</div>
        </div>
      </template>
      <template v-else>
        <MtInputForm
          type="radio"
          class="q-mt-none q-ml-md"
          v-model="serviceType"
          :items="itemServiceType"
          required
          :rules="[aahValidations.validationRequired]"
        />
        <div class="text-center modal-btn q-mt-md">
          <q-btn
            outline
            class="bg-grey-100 text-grey-800"
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn unelevated color="primary" class="q-ml-md" @click="submit">
            <span>進める</span>
          </q-btn>
        </div>
      </template>
    </q-card-section>
  </q-form>
</template>
<style scoped>
.custom-mic-button-select {
  border-radius: 50%;
  height: 70px;
  width: 70px;
}
.custom-button-select-container {
  justify-items: center;
}
</style>
