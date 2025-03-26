<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import axios from 'axios'
import useClinicalFilesUploaderStore from '@/stores/clinical-files-uploader'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import mtUtils from '@/utils/mtUtils'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'
import {
  typeDiagnosticInfo,
  typeFile,
  typeProvider,
  typeReceiveFormat
} from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({ data: Object, id_pet_illness_history: String })
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const clinicalFilesUploaderStore = useClinicalFilesUploaderStore()
const petStore = usePetStore()
const petIllnessHistoryList = ref([])
const petIllnessHistoryListDefault = reactive<any>([])
const showLoadingQr = ref(false)
const qrCodeImageSrc = ref('')
const urlGenerated = ref('')
const petName = ref('')
const data_ = ref({
  id_pet_illness_history: null,
  id_pet: props.data.id_pet,
  id_customer: props.data.id_customer,
  id_clinic: null,
  type_provider: null,
  name_file: null,
  type_file: null,
  type_diagnostic_info: null,
  memo_file_storage: null,
  id_employee_supplier: null,
  name_supplier_other: null,
  datetime_receive: getDateToday(),
  type_receive_format: null
})
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const closeModal = () => {
  emits('close')
}

function getSelectedClinic() {
  try {
    return JSON.parse(localStorage.getItem('id_clinic'))
  } catch (error) {
    return ''
  }
}

function petIllnessSelected(selectedIll: any) {}

function encodeStringToBase64(str: any) {
  return btoa(str)
}

const generateQRCode = (token: String, id_clinic: String) => {
  const baseUrl = window.location.origin
  if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
    var randomUrl = `${baseUrl}/nl/documents?token=${token}`
  } else {
    const part_1 = baseUrl.startsWith('http://') ? 'http://' : 'https://'
    const part_2 = 'files.stg-cs.vetty' + baseUrl.split('.vetty')[1]
    const part_3 = `/nl/documents?token=${token}`
    var randomUrl = part_1 + part_2 + part_3
  }
  randomUrl = randomUrl + '&cli=' + encodeStringToBase64(id_clinic)
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

const generateQr = () => {
  showLoadingQr.value = true
  const id_clinic = getSelectedClinic()
  data_.value.id_clinic = id_clinic
  if (data_.value.datetime_receive) {
    data_.value.datetime_receive = formatDateWithTime(
      data_.value.datetime_receive,
      'YYYY/MM/DD HH:mm:ss'
    )
  }
  clinicalFilesUploaderStore
    .submitClinicalFileUploader(data_.value)
    .then((resp) => {
      let token = resp.data.data.token
      let id_clinic = resp.data.data.id_clinic
      generateQRCode(token, id_clinic)
    })
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(urlGenerated.value)
    mtUtils.autoCloseAlert('リンクをコピーしました。')
  } catch ($e) {
    mtUtils.autoCloseAlert('URLコピーに失敗しました')
  }
}

const selectDefaultEmployee = () => {
  data_.value.id_employee_supplier = defaultEmployee
}

onMounted(async () => {
  // await petStore.getPet(data_.value.id_pet)
  // petStore.selectPet(data_.value.id_pet)
  petName.value = customerStore.getCustomer.pets.find(
    (p) => p.id_pet === data_.value.id_pet
  )

  petIllnessHistoryList.value.length = 0
  petIllnessHistoryListDefault.length = 0
  petIllnessHistoryList.value = [...illnessHistoryStore.getAllIllnessHistorys]
  petIllnessHistoryListDefault.push(
    ...illnessHistoryStore.getAllIllnessHistorys
  )

  if (props.id_pet_illness_history)
    data_.value.id_pet_illness_history = props.id_pet_illness_history
  else if (illnessHistoryStore.getAllIllnessHistorys.length > 0)
    data_.value.id_pet_illness_history =
      illnessHistoryStore.getAllIllnessHistorys[0]

  data_.value.type_provider = typeProvider[0].value
  data_.value.type_file = typeFile[0].value
})
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        QRコード経由の資料アップロード
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="q-card__section q-card__section--vert">
      <div class="row">
        <div class="col-6">
          <div class="flex items-center justify-between q-mb-md">
            <div class="col">
              <MtInputForm
                v-model="data_.id_pet_illness_history"
                type="selection"
                :multiple="false"
                label="既往歴・現疾患 *"
                :items="petIllnessHistoryList"
                :option-label="'label'"
                :option-value="'value'"
                @update:model-value="petIllnessSelected"
              />
            </div>
            <div class="col q-ml-sm">
              <MtFormPullDown
                label="情報元区分"
                v-model:selected="data_.type_provider"
                :options="typeProvider"
              />
            </div>
          </div>
          <div class="flex items-center justify-between q-mb-md">
            <div class="col q-mr-sm">
              <MtInputForm
                type="text"
                v-model="data_.name_file"
                class=""
                label="ファイル名"
              />
            </div>
            <div class="col">
              <MtFormPullDown
                label="ファイル区分"
                v-model:selected="data_.type_file"
                :options="typeFile"
              />
            </div>
          </div>
          <div class="flex flex items-center justify-between q-mb-md">
            <div class="col">
              <MtFormMultipleSelection
                :options="typeDiagnosticInfo"
                option-label="label"
                option-value="value"
                v-model="data_.type_diagnostic_info"
                label="データ検査区分"
              />
            </div>
          </div>
          <div class="col q-mb-md">
            <MtInputForm
              type="text"
              v-model="data_.memo_file_storage"
              class=""
              label="ファイル保管メモ"
            />
          </div>
          <div class="flex items-center justify-between q-mb-md">
            <div class="col q-mr-sm">
              <InputEmployeeOptGroup
                v-model:selected="data_.id_employee_supplier"
                label="提出元 企業名"
                show-select-default-employee
                @update:select-default-employee="selectDefaultEmployee"
              />
            </div>
            <div class="col">
              <MtInputForm
                type="text"
                v-model="data_.name_supplier_other"
                class=""
                label="その他 企業名"
              />
            </div>
          </div>
          <div class="flex items-center justify-between q-mb-md">
            <div class="col q-mr-sm">
              <MtFormInputDate
                v-model:date="data_.datetime_receive"
                label="受領日時"
              />
            </div>
            <div class="col">
              <MtFormPullDown
                label="受領形式"
                v-model:selected="data_.type_receive_format"
                :options="typeReceiveFormat"
              />
            </div>
          </div>
        </div>
        <div class="col-6 q-pa-md">
          <div class="row justify-center">
            <div class="col-6">
              <MtPetFilterSelect
                v-model:selecting="petName"
                :pet-list="[]"
                label="ペット名"
                readonly
              />
            </div>
          </div>
          <div class="col-12 flex justify-center q-mt-lg">
            <div class="col-8">
              <div v-if="qrCodeImageSrc">
                <img class="qr-code" :src="qrCodeImageSrc" alt="QR Code" />
                <br />
                <q-btn
                  outline
                  class="col-12 full-width bg-grey-100 text-grey-800 q-mt-md"
                  @click="copyUrl()"
                >
                  <span>リンクをコピー</span>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
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
          @click="generateQr()"
          :disable="data_.id_pet_illness_history === null"
        >
          <span>QRコード生成</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style lang="scss" scoped>
.upload-section {
  border: 1px dotted $grey-500;
  min-height: 400px;
}
</style>
