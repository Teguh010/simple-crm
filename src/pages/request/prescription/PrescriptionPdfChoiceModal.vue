<script setup lang="ts">
import { ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

type PopupType = {
  confirmed: Boolean,
  attr: {
    choice: number
  }  
}

interface Props {
  popup: PopupType  
}

const props = defineProps<Props>()

const PDF_CHOICE:number = ref(1)

const handleConfirmChoice = () => {
  props.popup.confirmed = true  
  props.popup.attr.choice = PDF_CHOICE.value
  closeModal()
}

</script>
<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
         印刷設定
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <!-- <div class="q-mt-lg text-center">
        
      </div> -->
      <div class="flex justify-center" style="margin: 50px 0; gap: 50px">
        <MtFormRadiobtn label="PDFダウンロード" :val="1" v-model:selected="PDF_CHOICE" />
        <MtFormRadiobtn label="印刷" :val="2" v-model:selected="PDF_CHOICE" />
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
          @click="handleConfirmChoice()"
        >
          <span>実行</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>