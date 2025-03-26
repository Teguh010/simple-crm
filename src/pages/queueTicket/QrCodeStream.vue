<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { QrcodeStream } from 'vue-qrcode-reader'
import CheckInModal from './CheckInModal.vue'
import { useCustomerStore } from '@/stores/customers'
import { useQueueTicketStore } from '@/stores/queue_ticket'

const customerStore = useCustomerStore()
const queueTicketStore = useQueueTicketStore()

const emits = defineEmits(['close'])
const vshowQrcodeStream = ref(false)

const decryptQr = async (base64String: String) => {
  const replacements = {
    '-': '+',
    _: '/',
    '.': '='
  }

  base64String = base64String.replace(
    /[-_.]/g,
    (match) => replacements[match] || match
  )

  const decodedString = atob(base64String)
  const printableCharsRegex = /^[\x20-\x7E]*$/
  if (printableCharsRegex.test(decodedString)) {
    return {
      code_clinic: decodedString.split('-')[0],
      customerId: decodedString.split('-')[1]
    }
  } else {
    try {
      let d_resp = await queueTicketStore.decryptQr({ qr_text: base64String })
      d_resp = d_resp.data.data.qr_text
      let code_clinic = d_resp.substring(0, 4)
      let code_customer = parseInt(d_resp.slice(-6))

      return {
        code_clinic: code_clinic,
        code_customer
      }
    } catch (error) {
      console.error('QR Decode Error:', {
        error: error?.data?.data?.detail,
        full_error: error
      })
      closeModal()
      mtUtils.autoCloseAlert(error?.data?.data?.detail)
      return
    }
  }
}

const onDetect = async (data?: any) => {
  if (!Boolean(data) || Object.keys(data).length == 0) {
    return
  }

  try {
    const qrData = data[0]
    let decoded_qr_response = await decryptQr(qrData.rawValue)

    if (!decoded_qr_response) {
      console.error('QR Decode Failed - No Response')
      return
    }

    const { code_customer } = decoded_qr_response
    await mtUtils.promiseAllWithLoader([
      customerStore.SearchCustomerByCode(code_customer, true),
      queueTicketStore.fetchQueueTicketList({
        code_customer,
        today: true
      })
    ])

    const customerDetails = JSON.parse(
      JSON.stringify(customerStore.getCustomer)
    )
    customerDetails.pets = customerDetails.pets.filter((pet: any) => {
      if (
        !(
          pet.flg_deceased ||
          pet.flg_delete_by_customer ||
          pet.flg_pet_excluded ||
          pet.flg_unlist
        )
      ) {
        return pet
      }
    })

    const queueTickets = queueTicketStore.queueTickets

    vshowQrcodeStream.value = false
    closeModal()
    mtUtils.popup(CheckInModal, {
      data: customerDetails,
      todayQtickets: queueTickets
    }, true)
  } catch (error) {
    console.error('Error processing QR:', error)
    await mtUtils.autoCloseAlert(error)
  }
}

const scannerOptions = computed(() => ({
  constraints: {
    facingMode: 'user',
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    aspectRatio: { ideal: 1 }
  },
  decoder: {
    tryHarder: true,
    scale: 2
  }
}))

const closeModal = () => {
  vshowQrcodeStream.value = false
  queueTicketStore.clearAllStates()
  customerStore.customer = {}
  emits('close')
}

let lastChanged = -1
let callReset = false
let autoSaveMillSecs = 500000
let autoResetTimer: any = null // Auto save timer ID

const resetQrCodeStream = () => {
  const elapsed = Date.now() - lastChanged
  if (elapsed < autoSaveMillSecs) {
    console.log(
      `Checkin QR: user has been active in the past ${elapsed} ms.`
    )
  } else if (callReset) {
    console.log("Checkin QR: Attempting to auto-reset...")
    closeModal()
  }
}

const onUserActivity = () => {
  console.log("Checkin QR: User activity detected")
  lastChanged = Date.now()
  callReset = true
}

onMounted(async () => {
  autoResetTimer = setInterval(resetQrCodeStream, 10000)
  vshowQrcodeStream.value = true

  window.addEventListener('mousemove', onUserActivity)
  window.addEventListener('click', onUserActivity)
  window.addEventListener('keydown', onUserActivity)
  window.addEventListener('touchstart', onUserActivity)
})
onUnmounted(() => {
  if (autoResetTimer != null) {
    console.log('autoResetTimer', autoResetTimer)
    clearInterval(autoResetTimer)
    autoResetTimer = null
  }
  clearInterval(autoResetTimer)
  
  window.removeEventListener('mousemove', onUserActivity)
  window.removeEventListener('click', onUserActivity)
  window.removeEventListener('keydown', onUserActivity)
  window.removeEventListener('touchstart', onUserActivity)
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      📱 診察券QRコードをかざしてください
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content ipad-modal-content q-pa-none">
    <div class="camera-container">
      <qrcode-stream
        v-if="vshowQrcodeStream"
        @detect="onDetect"
        :constraints="scannerOptions.constraints"
        :decoder="scannerOptions.decoder"
        class="qrcode-stream"
      >
        <div class="qr-frame">
          <div class="scan-region-highlight"></div>
          <div class="scan-region-highlight-text">
            QRコードをこちらに合わせてください
          </div>
        </div>
      </qrcode-stream>
    </div>
  </q-card-section>
</template>

<style>
.ipad-modal-content {
  height: 80vh; 
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center; /* 縦方向の中央揃え */
  position: relative;
  touch-action: none; /* Prevent browser handling of touch events */
}

.afterQr1 {
  width: 60%;
  height: 10rem;
  margin: 0 auto;
  border: 2px solid #2c6671;
  text-align: center;
  padding-top: 1rem;
  border-radius: 1rem;
}

.afterQr1 > p {
  color: #2c6671;
  font-size: 1rem;
  font-style: normal;
  font-weight: 700;
  text-align: center;
  padding-top: 3rem;
}

.afterQr2 {
  width: 50%;
  height: 5rem;
  margin: 0 auto;
  text-align: center;
  padding-top: 1.5rem;
}

.afterQr2 > p {
  color: #2c6671;
  font-size: 1.5rem;
  font-style: normal;
  font-weight: 700;
  text-align: center;
}

.qr-frame {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 300px;
  height: 300px;
  border: 2px solid #fff;
  border-radius: 10px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  /* Ensure frame stays on top */
  z-index: 2;
  /* Prevent frame from scaling */
  transform-origin: center;
  pointer-events: none;
}

.scan-region-highlight {
  border: 2px solid #2c6671;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  border-radius: 10px;
}

.scan-region-highlight-text {
  color: #fff;
  text-align: center;
  position: absolute;
  font-size: 12px;
  left: 0;
  right: 0;
  top: -30px;
}

.qrcode-stream {
  width: 100%;
  height: 100%;
  transition: transform 1s ease-in-out;
}

.qrcode-stream__camera {
  aspect-ratio: 1;
  object-fit: cover;
}

.camera-controls,
.camera-switch-btn {
  display: none;
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 100%;
  height: 100%;
  margin: 0 auto;
  overflow: hidden; /* Prevent content overflow during zoom */
}

.qr-location-indicator {
  position: absolute;
  border: 2px solid #00ff00;
  background: rgba(0, 255, 0, 0.2);
  pointer-events: none;
  transition: all 0.3s ease-out;
}

.qr-location-indicator.zooming {
  transition: all 1s ease-in-out;
}
</style>
