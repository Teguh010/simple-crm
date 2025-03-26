<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { ref, onMounted } from 'vue'
import useConversationStore from '@/stores/Conversation'

type KoekaruQuestionTemplate = {
  question_id: string
  name_template: string
  questions: {
    question: string
    question_display_title: string
  }[]
}

const emits = defineEmits(['close'])

const closeModal = () => emits('close')

const props = defineProps<{
  questionTemplates: KoekaruQuestionTemplate[]
  selectedQuestionTemplateId: { id: String }
  confirmationResult: {
    confirmed: boolean
  }
}>()

const { questionTemplates } = props

const selectedQuestionTemplate = ref(questionTemplates[0].question_id)

const mapQuestionTemplates = questionTemplates.map((questionTemplate) => {
  return {
    label: questionTemplate.name_template,
    value: questionTemplate.question_id
  }
})

const cancel = () => {
  props.confirmationResult.confirmed = false
  closeModal()
}

const continueWithSelectedQuestionTemplate = () => {
  props.selectedQuestionTemplateId.id = selectedQuestionTemplate.value
  props.confirmationResult.confirmed = true
  closeModal()
}

const conversationStore = useConversationStore()

onMounted(() => {
  if (conversationStore.getSource === 'create_memo_carte') {
    selectedQuestionTemplate.value = '3'
    continueWithSelectedQuestionTemplate()
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      質問テンプレートを選択してください
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section>
    <form class="flex items-center justify-center">
      <MtInputForm
        type="radio"
        class="q-mt-none"
        v-model="selectedQuestionTemplate"
        :items="mapQuestionTemplates"
        required
      />
    </form>
  </q-card-section>
  <q-card-section>
    <div class="flex items-center q-gutter-sm">
      <q-btn
        label="キャンセル"
        dense
        outline
        class="bg-white text-primary q-mr-sm q-py-xs q-px-lg col"
        style="font-size: 12px"
        @click="cancel()"
      >
      </q-btn>
      <q-btn
        flat
        dense
        label="確認"
        style="font-size: 12px"
        class="text-white bg-primary text-center q-py-xs q-px-lg col"
        @click="continueWithSelectedQuestionTemplate()"
      >
      </q-btn>
    </div>
  </q-card-section>
</template>

<style>
fieldset {
  border: none;
  padding: 10px;
  margin-bottom: 10px;
}

fieldset > input {
  margin-right: 10px;
}

mr-10 {
  margin-right: 10px;
}
</style>
