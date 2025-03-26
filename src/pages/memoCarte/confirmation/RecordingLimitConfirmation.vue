<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'

import useConversationStore from '@/stores/Conversation'
import useQuestionTemplateStore from '@/stores/questionTemplates'
import { storeToRefs } from 'pinia'


const emits = defineEmits(['close'])

const props = defineProps({
  popup: {
    type: Object,
    default: {}
  }
})

const conversationStore = useConversationStore()
const questionTemplateStore = useQuestionTemplateStore()
const { getQuestionTemplate } = storeToRefs(conversationStore)
const { getAllQuestionTemplates } = storeToRefs(questionTemplateStore)

const selectedTemplate = ref('1')

const mapQuestionTemplates = computed(() => {
  const templates = getQuestionTemplate.value?.length 
    ? getQuestionTemplate.value 
    : getAllQuestionTemplates.value

  return templates?.map((template) => ({
    label: template.name_template,
    value: template.question_id
  })) || []
})

onMounted(async () => {  
  if (conversationStore.getSource === 'update_memo_carte') {
    selectedTemplate.value = '1' 
  }
})

const closeModal = () => {
  emits('close')
}

const confirmTemplate = () => {
  props.popup.isConfirmed = true
  props.popup.id_template = selectedTemplate.value
  closeModal()
}
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        録音制限
      </q-toolbar-title>
    </MtModalHeader>

    <q-card-section >
      <div class="text-grey-800 q-mb-lg">
        利用制限に達しました。現在、このアプリケーションでは1回の録音につき最大25分までご利用いただけます。
        <br><br>
        これまでの内容をリクエストする場合は下記のテンプレートを選択して「リクエスト」ボタンを押してください。
        <br>
        不要な場合は「閉じる」ボタンを押して、詳細画面の「削除」ボタンよりレコードを破棄してください。
      </div>

     <div class="q-pa-md text-center">
          <MtInputForm
            type="radio"
            class="q-mt-none"
            v-model="selectedTemplate"
            :items="mapQuestionTemplates"
            required
          />
        </div>
    </q-card-section>

    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          @click="confirmTemplate()"
          :disabled="!selectedTemplate"
        >
          <span>リクエスト</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style lang="scss" scoped>
.template-container {
  gap: 40px;
  min-height: 180px;
  .box {
    min-width: 177px;
    min-height: 171px;
    border-radius: 20px;
    .chip-label {
      color: #9c45e7;
      background: #ebd3ff;
      width: 47px;
      height: 18px;
      border-radius: 10px;
      font-size: 10px;
      top: 10px;
      right: 10px;
    }

    &.selected {
      background: #fcf4f4;
      .name {
        color: #565656;
      }
    }
    &.unselected {
      background: #f6f6f6;
      .name {
        color: #bababa;
      }
    }
  }
}
</style>
