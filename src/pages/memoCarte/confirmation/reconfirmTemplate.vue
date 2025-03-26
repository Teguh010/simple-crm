<script lang="ts" setup>
import { ref, computed } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useConversationStore from '@/stores/Conversation'
import useQuestionTemplateStore from '@/stores/questionTemplates'
import { storeToRefs } from 'pinia'
import { chunk } from 'lodash'
import { useQuasar } from 'quasar'
import selectedImage from '@/assets/img/aiVetty/selected_template.png'
import unselectedImage from '@/assets/img/aiVetty/unselected_template.png'

const $q = useQuasar()

const isLtSm = computed(() => {
  return $q.screen.lt.sm
})

const emits = defineEmits(['close'])

const props = defineProps({
  popup: {
    type: Object,
    default: {}
  }
})

const conversationStore = useConversationStore()
const questionTemplateStore = useQuestionTemplateStore()
const { getAllQuestionTemplates } = storeToRefs(questionTemplateStore)
const selectedTemplate = ref(conversationStore.questionId)

const closeModal = () => {
  emits('close')
}
const setCurrentItem = (id: Number) => {
  selectedTemplate.value = id
}

const itemsToShow = 3
const slide = ref(0)

const carouselList = computed(() => {
  if ($q.screen.lt.sm) {
    return getAllQuestionTemplates.value
  }
  return chunk(getAllQuestionTemplates.value, itemsToShow)
})

const confirmTemplate = () => {
  props.popup.isConfirmed = true
  props.popup.id_template = selectedTemplate.value
  // props.popup.apiOptions = apiSelect.value
  closeModal()
}

const apiOptions: { label: string; value: string }[] = [
  {
    label: '標準',
    value: 'web_speech'
  },
  {
    label: '高 (β版)',
    value: 'whisper'
  }
]

const apiSelect = ref('whisper')

const isSelected = (questionTemplateId: number) => {
  return questionTemplateId === selectedTemplate.value
}
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        診療を終了しますか？
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="flex justify-center items-center" style="height: 100%">
        <q-carousel
          v-model="slide"
          transition-prev="slide-right"
          transition-next="slide-left"
          swipeable
          animated
          control-color="primary"
          padding
          arrows
          class="bg-white"
          height="200px"
        >
          <q-carousel-slide
            v-for="(carouselItem, carouselIndex) in carouselList"
            :key="`carousel-${carouselIndex}`"
            :name="carouselIndex"
            class="column no-wrap row justify-center"
          >
            <div class="row justify-center template-container">
              <template
                v-for="(item, index) in Array.isArray(carouselItem)
                  ? carouselItem
                  : [carouselItem]"
                :key="`carousel-${carouselIndex}-subitem-${index}`"
              >
                <div
                  class="box flex column items-center cursor-pointer justify-center relative-position"
                  :class="
                    isSelected(item?.question_id) ? 'selected' : 'unselected'
                  "
                  @click="setCurrentItem(item.question_id)"
                >
                  <div
                    class="absolute-right chip-label flex justify-center items-center"
                    v-if="isSelected(item?.question_id)"
                  >
                    選択中
                  </div>
                  <img
                    :src="
                      isSelected(item?.question_id)
                        ? selectedImage
                        : unselectedImage
                    "
                    :style="{
                      width: isLtSm ? '65px' : '95px',
                      height: isLtSm ? '92px' : '122px'
                    }"
                  />
                  <span class="name q-mt-sm text-weight-bold">{{
                    item?.name_template
                  }}</span>
                </div>
              </template>
            </div>
          </q-carousel-slide>
        </q-carousel>
      </div>
    </q-card-section>
    <!-- <q-card-section class="text-center q-mb-lg">
      <div class="text-primary font-weight-bold heading">
        要約精度を選択してください
      </div>
      <div class="flex text-left justify-center">
        <q-option-group
          :options="apiOptions"
          type="radio"
          v-model="apiSelect"
        />
      </div>
    </q-card-section> -->
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          @click="confirmTemplate()"
        >
          <span>要約作成</span>
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
