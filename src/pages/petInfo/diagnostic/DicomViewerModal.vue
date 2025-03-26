<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useClinicalFilesStore from '@/stores/clinical-files'
import DicomPickerModal from './DicomPickerModal.vue'
import mtUtils from '@/utils/mtUtils'
import { Loading } from 'quasar'

const clinicalFilesStore = useClinicalFilesStore()
const emits = defineEmits(['close'])
const props = defineProps({
  dicom_url: String,
  id_clinical_file: String,
  id_pet: String
})

const dicom_url = ref('https://image-emr.motocle2.com/viewer/dicomjson?lng=ja-jp&url=')
// const dicom_url = ref("http://localhost:3000/viewer/dicomjson?lng=ja-jp&url=")
const dicom_json_url = ref('')
const displayIframe = ref(false)
const petClinicalDicomFiles = ref([])
const selectedPetClinicalDicomFiles = ref([])
const recent_json_file_name = ref('')

// const dirname = path.basename(process.cwd());
const closeModal = async () => {
  clinicalFilesStore.destroyDcmViewerFile({
    opened_clinical_files: selectedPetClinicalDicomFiles.value, 
    recent_json_file_name: recent_json_file_name.value,
    id_pet: props.id_pet
  })
  emits('close')
}

const renderNewDicomFileInViewer = async () => {
  if(selectedPetClinicalDicomFiles.value.length <= 0) {
    return
  }
  const confirmation = await mtUtils.confirm("選択した DICOM ファイルをレンダリングするかどうかを確認してください。", "ファイル変更の確認", "私が確認する")
  if(confirmation){
    Loading.show({
      backgroundColor: 'transparent',
      spinnerColor: 'black',
      message: '読み込み中です...',
      messageColor: 'black'
    })
    const id_clinical_files = selectedPetClinicalDicomFiles.value
    const resp = await clinicalFilesStore.getPatientClinicalFilesDcmUrls(
      {id_clinical_files: id_clinical_files, recent_json_file_name: recent_json_file_name.value}
    )
    Loading.hide()
    dicom_json_url.value = resp.data.data.url
    recent_json_file_name.value = resp.data.data.recent_json_file
    dicom_url.value = dicom_url.value.split('url=')[0] + 'url='
    dicom_url.value += dicom_json_url.value
    displayIframe.value = true
  }
}

const callbackfromDicomPickerModal = async (selectedFiles:any) => {
  selectedPetClinicalDicomFiles.value = selectedFiles.map(file => file.id_clinical_file)
  await renderNewDicomFileInViewer()
}

const renderOnFirstOpen = async () => {
  await clinicalFilesStore.fetchClinicalFiles({id_pet: props.id_pet})
  const id_clinical_files = [props.id_clinical_file]
  selectedPetClinicalDicomFiles.value = id_clinical_files
  const resp = await clinicalFilesStore.getPatientClinicalFilesDcmUrls({id_clinical_files: id_clinical_files, recent_json_file_name: recent_json_file_name.value})
  dicom_json_url.value = resp.data.data.url
  recent_json_file_name.value = resp.data.data.recent_json_file
  dicom_url.value += dicom_json_url.value
  displayIframe.value = true
}

window.addEventListener('message', function(event) {
  if (event.data === 'openModal') {
    mtUtils.smallPopup(DicomPickerModal, {callback: callbackfromDicomPickerModal})
  }
});

onMounted(async () => {
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: '読み込み中です...',
    messageColor: 'black'
  })
  await renderOnFirstOpen()
  Loading.hide()
})
</script>

<template>

  <MtModalHeader 
    @closeModal="closeModal"  class="dicom-header q-py-sm">
      <q-toolbar-title class="text-grey-900 title2 bold" >
        <span class="dicom-title">DICOM Viewer</span>
      </q-toolbar-title>

  </MtModalHeader>

  <div
    style="
      height: 100%;
      width: 100%;
      margin: 0px;
      padding: 0px;
      overflow: hidden;
    "
  >
    <iframe
      v-if="displayIframe"
      :src="dicom_url"
      target="_blank"
      frameborder="0"
      class="dicom-viewer"
    ></iframe>
  </div>
</template>

<style scoped lang="scss">
.dicom-viewer {
  display: block;
  width: 100%;
  height: calc(100vh - 100px);
  overflow: hidden;
}
.dicom-header{
  background-color: rgb(4 28 74 / 1); 
  color:white
}
.dicom-title{
  color: white;
}
</style>
