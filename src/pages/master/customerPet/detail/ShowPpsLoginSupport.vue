<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import axios from 'axios'

const emits = defineEmits(['close'])
const props = defineProps({ data_url: String })

const showLoadingQr = ref(false)
const qrCodeImageSrc = ref('')
const urlGenerated = ref('')

const closeModal = () => {
  emits('close')
}

const generateQRCode = (data_url: String) => {
  axios({
    method: 'GET',
    url: 'https://api.qrserver.com/v1/create-qr-code/',
    params: {
      data: data_url,
      size: '200x200',
      margin: '0'
    },
    responseType: 'arraybuffer'
  })
    .then((response) => {
      const qr_img_src = URL.createObjectURL(new Blob([response.data]))
      showLoadingQr.value = false
      qrCodeImageSrc.value = qr_img_src
      urlGenerated.value = data_url
    })
    .catch((error) => {})
}

const copyUrl = () => {
  navigator.clipboard.writeText(props.data_url).then(async () => {
    mtUtils.autoCloseAlert('URLをコピーしました。')
  })
}

onMounted(() => {
  generateQRCode(props.data_url)
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      myVettyログインサポート
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-px-xl">
    <div class="col-12 flex justify-center">
      <div class="col-8 text-center">
        <div class="q-my-md">URLをオーナー様に提供してください。</div>
        <div v-if="qrCodeImageSrc" class="q-px-lg q-py-md">
          <img class="qr-code" :src="qrCodeImageSrc" alt="QR Code" />
          <br />
        </div>
        <div class="q-px-lg q-py-md text-center modal-btn">
          <q-btn flat class="bg-grey-200 text-grey-800" @click="copyUrl()">
            <q-icon name="content_copy" class="q-mr-md" size="sm" />
            <span>URLコピー</span>
          </q-btn>
        </div>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style scoped lang="scss"></style>
