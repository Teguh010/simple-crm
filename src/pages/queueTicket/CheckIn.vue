<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import mtUtils from '@/utils/mtUtils'
import useClinicStore from '@/stores/clinics'
import QrCodeStream from './QrCodeStream.vue'
import logoDefault from '@/assets/img/login/logo.png'
import useCliCommonStore from '@/stores/cli-common'
import useEmployeeStore from '@/stores/employees'

// クリニックストアの使用
const ClinicStore = useClinicStore()
const cliCommonStore = useCliCommonStore()
const clinicName = ref("")
const logo_file_path1 = ref('')

// クリニック名を取得する関数
const fetchClinicName = async () => {
  const id_clinic = localStorage.getItem('id_clinic')
  if (Boolean(id_clinic)) {
    const clinic = await ClinicStore.fetchClinicById(JSON.parse(id_clinic))
    clinicName.value = clinic.name_clinic_display
    logo_file_path1.value = clinic.logo_file_path1
  } else {
    clinicName.value = ""
  }
}

const fetchCliCommonPurposeVisit = async () => {
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [4] }, true)
}

// チェックインが受け入���られた時に実行される関数
const checkInAccepted = async () => {
  await mtUtils.mediumPopup(QrCodeStream, null, false, '55%')
  await init()
}

const init = async () => {
  console.log('initCalled')
  await fetchClinicName()
  await fetchCliCommonPurposeVisit()
  await useEmployeeStore().fetchPreparationEmployees()
}

// コンポーネントがマウントされたときにクリニック名を取得
onMounted(async () => {
  await init()
})
</script>

<template>
  <MtHeader>
    <q-toolbar class="text-primary q-pa-none">
      <q-toolbar-title class="title2 bold text-grey-900">
        受付
      </q-toolbar-title>
    </q-toolbar>
  </MtHeader>
  <div class="window-height window-width row justify-center items-center touch-none" @click="checkInAccepted()">
    <div class="col-lg-8 col-sm-12 q-pa-xl">
      <img 
        :src="logo_file_path1 || logoDefault" 
        alt="logo" 
        class="img-cont q-mb-xl" />
      <p class="info-text q-px-xl">『受付する』ボタンを押して、<br/>診察券QRコードを読み取ってください。</p>
      <div class="row justify-center q-pa-md">
        <q-btn flat class="accept-btn">
          <span>受付する</span>
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.img-cont {
  max-height: 180px;
  max-width: 450px;
  display: block;
  margin: 0 auto;
}

.info-text {
  color: #2e2e2e;
  text-align: center;
  font-family: Noto Sans JP;
  font-size: 2rem;
  font-style: normal;
  font-weight: 700;
  margin-bottom: 30px;
  line-height: normal;
}

.accept-btn {
  width: 30rem;
  padding: 1rem 0.75rem;
  border-radius: 0.25rem;
  border: transparent;
  background: #013566;
  box-shadow: 4px 4px 4px 0px rgba(0, 0, 0, 0.25);
  color: #ffffff;
  font-size: 3rem;
  line-height: 2.5;
  font-weight: 700;
}

.touch-none {
  touch-action: none;
}

@media only screen and (max-width: 1600px) {
  .img-cont {
    margin-bottom: 5rem;
  }
}

@media only screen and (min-width: 1601px) {
  .img-cont {
    margin-bottom: 3rem;
  }
}
</style>
