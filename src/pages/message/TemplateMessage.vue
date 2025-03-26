<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import _ from 'lodash'
import useTextTemplateStore from '@/stores/text-template'

const props = defineProps({
  memoTask: {
    type: Object,
    default: {
      value: ''
    }
  },
  sendText: {
    type: Object,
    default: {
      value: ''
    }
  },
  customerMessageTemplates: {
    type: Boolean,
    default: {
      value: false
    }
  }
})
const emits = defineEmits(['close'])
const templateStore = useTextTemplateStore()
const { getTemplates } = storeToRefs(templateStore)
const typeTemplatesToShow = ref(62)
const emojis = [
  '👍',
  '💪',
  '✋',
  '😃',
  '😆',
  '😅',
  '🥳',
  '😔',
  '😫',
  '😢',
  '🐶',
  '🐕',
  '🐱',
  '🦮',
  '🙀',
  '💉',
  '💊',
  '🩺',
  '📸',
  '🩹',
  '🧻',
  '🦴',
  '🦠',
  '🚑',
  '⏱'
]
const insertSentence = async (content: String) => {
  let confirmMsg = 'このテンプレートを選択しますか?'
  await mtUtils
    .confirm(confirmMsg, '確認', ' 送信する', ' 選択して編集する')
    .then((confirmation) => {
      if (confirmation === 'edit') {
        props.memoTask.text = content
        mtUtils.autoCloseAlert(aahMessages.success)
        closeModal()
      } else if (confirmation === 'send') {
        props.sendText.text = content
        mtUtils.autoCloseAlert(aahMessages.success)
        closeModal()
      }
    })
}

const handleMemoTempletes = async (emoji: any) => {
  let confirmMsg = 'このテンプレートを選択しますか?'
  await mtUtils.confirm(confirmMsg, '確認!', 'はい').then((confirmation) => {
    if (confirmation) {
      if (emoji) {
        props.sendText.text = emoji
      }
      mtUtils.autoCloseAlert(aahMessages.success)
      closeModal()
    }
  })
}
const closeModal = () => {
  emits('close')
}
onMounted(async () => {
  await templateStore.fetchTemplates()
  if (props.customerMessageTemplates === true) {
    typeTemplatesToShow.value = 72
  } else {
    typeTemplatesToShow.value = 62

  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      メッセージテンプレート
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div class="flex">
      <div
        v-for="(emoji, i) in emojis"
        :key="i"
        class="bg-grey-100 q-px-lg q-py-md q-ml-md q-mt-md  cursor-pointer text-h6 border-outline-400"
        @click="handleMemoTempletes(emoji)"
      >
        {{ emoji }}
      </div>
    </div>
    <div
      class="q-mb-lg q-mt-lg"
      v-for="(template, i) in _.sortBy(getTemplates, 'display_order', 'asc')"
      :key="i"
    >
      <template v-if="template.type_text_template === typeTemplatesToShow ">
        <div
          class="row q-pb-sm q-bb-dashed cursor-pointer"
          v-if="template.flg_title"
        >
          <div>
            {{ template.memo_template }}
          </div>
        </div>
        <div class="row q-pa-md q-bb-dashed" v-else>
          <div
            class="col-12 sentence cursor-pointer q-ml-xl"
            @click="insertSentence(template.memo_template)"
          >
            {{ template.memo_template }}
          </div>
        </div>
      </template>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.sentence {
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 3;
  height: auto;
  word-wrap: break-word;
  white-space: normal !important;
  text-transform: none;
}
.emojiBox {
  border: 1px solid #bdbdbd;
}
</style>