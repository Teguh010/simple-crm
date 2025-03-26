<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import useIllnessHistoryStore from '@/stores/illness-history'
import useNlClinicalFilesStore from '@/stores/nl-clinical-files'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import { imageResize } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import usePetStore from '@/stores/pets'
import aahValidations from '@/utils/aahValidations'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import {
  typeDiagnosticInfo,
  typeFile,
  typeProvider,
  typeReceiveFormat
} from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({ data: Object, onModelClosed: Function })
const illnessHistoryStore = useIllnessHistoryStore()
const nlClinicalFilesStore = useNlClinicalFilesStore()
const customerStore = useCustomerStore()
const petStore = usePetStore()

const petList: any = ref([])
const petListDefault: any = reactive([])
const data = ref({
  id_clinical_file: null,
  id_customer: null,
  id_pet: null,
  file_path: null,
  id_pet_illness_history: null,
  type_provider: null,
  name_file: null,
  type_file: null,
  type_receive_format: null,
  type_diagnostic_info: null,
  memo_file_storage: null,
  id_employee_supplier: null,
  name_supplier_other: null,
  datetime_receive: getDateToday()
})
const doSubmit = ref(false)
const f_status = ref('unchanged')
const previewImage = ref(false)
const temp = ref([])
const history = ref([])
const isEdit = ref(false)
const petName = ref('')
const { getCustomer } = storeToRefs(customerStore)
const petIllnessHistoryList = ref([])
const petIllnessHistoryListDefault = reactive<any>([])
const name_customer_display = ref('')

const submit = () => {
  if (data.value.datetime_receive) {
    data.value.datetime_receive = formatDateWithTime(
      data.value.datetime_receive,
      'YYYY/MM/DD HH:mm:ss'
    )
  }
  if (f_status.value === 'unchanged') {
    delete data.value.file_path
  }
  if (temp.value.length > 0) {
    if (typeof temp.value[0] == 'number') {
      data.value.type_diagnostic_info = temp.value.join(',')
    } else {
      let t = []
      t.push(
        temp.value.map((item) => {
          return item.value
        })
      )
      data.value.type_diagnostic_info = t.join(',')
    }
  } else {
    delete data.value.type_diagnostic_info
  }
  emits('close')
  mtUtils.autoCloseAlert(aahMessages.success)
  props.onModelClosed(data.value)
}

const onFileAdded = (value) => {
  data.value.name_file = value[0].name.substr(0, value[0].name.lastIndexOf('.'))
  doSubmit.value = true
  f_status.value = 'changed'
  if(value[0].type.startsWith("image/")){
    data.value.file_path = value[0]
    data.value.type_file = 1
    // imageResize(value[0])
    // .then((i) => {
    //   data.value.file_path = i
    //   data.value.type_file = 1
    // })
    // .catch((error) => {
    //   doSubmit.value = false
    //   console.error('Failed to resize image:', error)
    // })
  } else if (value[0].type.startsWith('video/')) {
    data.value.file_path = value[0]
    data.value.type_file = 2
  } else {
    data.value.file_path = value[0]
    data.value.type_file = 99 //other
  }
}
const onFileRemoved = () => {
  previewImage.value = false
  data.value.file_path = null
  doSubmit.value = false
  data.value.name_file = null
  data.value.type_file = null
  f_status.value = 'removed'
}
const closeModal = () => {
  emits('close')
  props.onModelClosed()
}

const setOptionsForPetList = () => {
  petList.value.length = 0
  petListDefault.length = 0
  petListDefault.push({
    value: petStore.getPet.id_pet,
    label: petStore.getPet.code_pet + ' ' + petStore.getPet.name_pet
  })
  petList.value = [...petListDefault]
  data.value.id_pet = petStore.getPet.id_pet
}

function assignPageData(row: any) {
  if (row) {
    for (let key in row) {
      data.value[key] = row[key]
    }
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            clinicalFilesStore
              .destroyClinicalFile(data.value.id_clinical_file)
              .then(async () => {
                await clinicalFilesStore.fetchClinicalFiles()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

onMounted(async () => {
  data.value.id_customer = props.data.id_customer
  data.value.id_pet_illness_history = props.data.id_pet_illness_history
  petIllnessHistoryList.value.length = 0
  petIllnessHistoryListDefault.length = 0
  petIllnessHistoryList.value = [...illnessHistoryStore.getAllIllnessHistorys]
  petIllnessHistoryListDefault.push(
    ...illnessHistoryStore.getAllIllnessHistorys
  )
  history.value = petIllnessHistoryList.value[0]

  data.value.id_clinic = props.data.id_clinic
  data.value.type_provider = props.data.type_provider
  data.value.type_file = props.data.type_file
  data.value.type_diagnostic_info = props.data.type_diagnostic_info
  data.value.memo_file_storage = props.data.memo_file_storage
  data.value.name_supplier_other = props.data.name_supplier_other
  data.value.datetime_receive = props.data.datetime_receive
  data.value.type_receive_format = props.data.type_receive_format
  data.value.id_employee_supplier = props.data.id_employee_supplier
  data.value.name_file = props.data.name_file

  petName.value = props.data.name_pet
  if (data.value.type_diagnostic_info?.length > 0) {
    temp.value = data.value.type_diagnostic_info.map((item: any) => {
      return Number(item)
    })
  }
  petList.value = getCustomer.value.pets
  if(typeof props.data.id_pet =='string'){
    data.value.id_pet = Number(props.data.id_pet)
  }else{
    data.value.id_pet = props.data.id_pet
  }
  name_customer_display.value = props.data.name_customer_display
})

</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        関連資料
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="custom-height-div content q-px-lg">
      <div class="row items-center q-pb-lg  justify-around">
        <div>
          <span class="bold">お客様: </span><span>{{ name_customer_display }}</span>
        </div>
        <div>
          <span class="bold">ペット: </span><span>{{ petName }}</span>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-lg q-py-sm q-px-md">
        <div
          class="col-md-12 col-xs-12 flex items-center justify-center bg-grey-100"
        >
          <q-uploader
            label="ファイルを選択する"
            color="primary"
            flat
            square
            rounded
            class="text-center bg-grey-100"
            v-model="data.file_path"
            @added="onFileAdded"
            @removed="onFileRemoved"
            v-if="!previewImage"
          />
          <div v-if="previewImage" class="relative-position">
            <q-img
              :src="data.file_path"
              spinner-color="white"
              style="width: 200px"
              class="border-radius cursor-pointer"
            />
            <q-badge
              color="red"
              floating
              transparent
              class="cursor-pointer"
              @click="onFileRemoved"
            >
              <q-icon name="close" />
            </q-badge>
          </div>
        </div>

        <div class="col-12">
          <div class="col-md-6 col-xs-12">
            <div class="row flex items-center justify-between q-mb-md">
              <div class="col-6 col-xs-12">
                <MtFormPullDown
                  label="ファイル区分"
                  v-model:selected="data.type_file"
                  :options="typeFile"
                  :rules="[aahValidations.validationRequired]"
                />
              </div>
            </div>
            <div class="col q-mb-lg">資料区分</div>
            <div class="flex flex items-center justify-between q-mb-md">
              <div class="col">
                <MtFormMultipleSelection
                  :options="typeDiagnosticInfo"
                  option-label="label"
                  option-value="value"
                  v-model="temp"
                  label="区分"
                />
              </div>
            </div>
            <div class="col q-mb-md">
              <MtInputForm
                type="text"
                v-model="data.memo_file_storage"
                label="ファイルメモ"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="row text-center modal-btn justify-around">
        <q-btn
          outline
          class="col-md-5 col-xs-5 bg-grey-100 text-grey-800"
          @click="closeModal()"
        >
          <span>閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="col-md-5 col-xs-5"
          type="submit"
          :disable="!doSubmit"
        >
          <span>追加</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style lang="scss" scoped>
.upload-section {
  border: 1px dotted $grey-500;
  min-height: 400px;
}

@media only screen and (max-width: 1600px) {
  .small .content {
    max-height: calc(95vh - 200px);
  }
}
.bold{
  font-weight: bold;
}
</style>
