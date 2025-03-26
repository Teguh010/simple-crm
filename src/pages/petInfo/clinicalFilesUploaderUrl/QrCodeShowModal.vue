<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import axios from 'axios'

const emits = defineEmits(['close'])
const props = defineProps({ token: String, id_clinic: String })

const showLoadingQr = ref(false)
const qrCodeImageSrc = ref('')
const urlGenerated = ref('')

const closeModal = () => {
  emits('close')
}

function encodeStringToBase64(str: any) {
  return btoa(str)
}

const generateQRCode = (token: String, id_clinic: String) => {
  const baseUrl = window.location.origin
  const host = window.location.host

  const part_1 = baseUrl.startsWith('http://') ? 'http://' : 'https://'
  const part_2 = host
  const part_3 = `/nl/documents?token=${token}`
  var randomUrl = part_1 + part_2 + part_3

  randomUrl = randomUrl + '&cli=' + encodeStringToBase64(id_clinic)
  console.log(randomUrl)
  axios({
    method: 'GET',
    url: 'https://api.qrserver.com/v1/create-qr-code/',
    params: {
      data: randomUrl,
      size: '200x200',
      margin: '0'
    },
    responseType: 'arraybuffer'
  })
    .then((response) => {
      const qr_img_src = URL.createObjectURL(new Blob([response.data]))
      showLoadingQr.value = false
      qrCodeImageSrc.value = qr_img_src
      urlGenerated.value = randomUrl
    })
    .catch((error) => {})
}

onMounted(() => {
  generateQRCode(props.token, props.id_clinic)
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      QRコード
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-px-xl q-py-xl">
    <div class="col-12 flex justify-center">
      <div class="col-8">
        <div v-if="qrCodeImageSrc">
          <img class="qr-code" :src="qrCodeImageSrc" alt="QR Code" />
          <br />
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
