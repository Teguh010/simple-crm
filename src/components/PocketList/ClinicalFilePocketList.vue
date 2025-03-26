<script setup lang="ts">
import { computed, defineProps, nextTick, ref, withDefaults, defineAsyncComponent } from 'vue'
import { Loading } from 'quasar'
import { sortBy } from 'lodash'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { formatDate } from '@/utils/aahUtils'
import { event_bus } from '@/utils/eventBus'
import aahMessages from '@/utils/aahMessages'
import dayjs from 'dayjs'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useClinicalFilesStore from '@/stores/clinical-files'

// Lazy-loaded Components
const UpdateClinicalFileModal = defineAsyncComponent(() => import('@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue'))

// Assets
import fileLogo from '@/assets/img/clinicalFiles/file.png'

// Store Instances
const clinicalFilesStore = useClinicalFilesStore()
const illnessHistoryStore = useIllnessHistoryStore()

const props = withDefaults(
  defineProps<{
    data: ClinicalFile[]
    id_customer: number | string
    id_pet: number | string
    illnessHistories: IllnessHistoryType
  }>(),
  {
    data: () => {
      return [] as ClinicalFile[]
    },
    illnessHistories: () => {
      return {} as IllnessHistoryType
    }
  }
)

const emits = defineEmits<{
  (e: 'file-uploaded', value: IllnessHistoryType): void
  (e: 'generate-qr-for-clinical-file-upload', value: IllnessHistoryType): void
  (e: 'upload-clinical-file-with-stream', value: IllnessHistoryType): void
  (e: 'update-clinical-file-direct', value: IllnessHistoryType): void
}>()

const f_status = ref('unchanged')
const temp = ref([])
const uploader = ref()
const isDragging = ref(false)
const multipleData = ref([] as ClinicalFile[])

const onRowClick = async (data: any, i: Number) => {
  const video = document.getElementById(`cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  illnessHistoryStore.setIllnessHistory(props.illnessHistories?.id_pet_illness_history)
  await mtUtils.popup(UpdateClinicalFileModal, {
    data,
    allData: props.data,
    onCompleteCallback: props.onFileUpdated
  })
  event_bus.emit('reloadRight', true)
}
const clinicList = computed(() => {
  return sortBy(props.data, 'datetime_receive', 'asc').reverse()
})

const handleFileUploaded = async (files: File[]) => {
  multipleData.value = []
  if (files.length > 10) {
    uploader.value.reset()
    isDragging.value = false
    return mtUtils.autoCloseAlert('最大10点までアップロードできます。')
  }
  const promises = files.map((fileObject, index) => {
    return onFileAdded(fileObject, index)
  })
  await Promise.all(promises)
  await uploadFile().then(() => {
    nextTick(() => {
      illnessHistoryStore.selectIllnessHistory(
        props.illnessHistories?.id_pet_illness_history
      )
    })
  })
}

const onFileAdded = async (fileObject: File, index: number) => {
  if (!fileObject.size) {
    isDragging.value = false
    return mtUtils.autoCloseAlert('アップロードするファイルを選択してください')
  }

  f_status.value = 'changed'

  // generate multiple payload start on index 1 and above
  generateMultiplePayload()

  try {
    if (fileObject.type.startsWith('image/')) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 1
    } else if (fileObject.type.startsWith('video/')) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 2
    } else if (fileObject.name.includes('dcm')) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 3
    } else if (
      fileObject.type.startsWith('audio/') ||
      fileObject.type.includes('/pdf') ||
      fileObject.type.includes('text/csv') ||
      fileObject.type.includes('/doc') ||
      fileObject.type.includes('/docx') ||
      fileObject.type.includes('document') ||
      fileObject.type.includes('sheet')
    ) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 99
    } else {
      isDragging.value = false
      mtUtils.alert('エラー', 'ファイルがサポートされていません').then(() => {
        onFileRemoved(index)
        uploader.value.reset()
      })
    }
  } catch (error) {
    console.error('Error processing file: ', error)
  }
}
const onFileRemoved = (index: number) => {
  multipleData.value[index].file_path = null
  multipleData.value[index].name_file = null
  multipleData.value[index].type_file = null
  multipleData.value.length = 0
  f_status.value = 'removed'

  generateMultiplePayload()
}

const generateMultiplePayload = () => {
  const idPetIllnessHistory = []
  console.log('props.illnessHistories :>> ', props.illnessHistories);
  if (props.illnessHistories.length) {
    const id_pet_illness_history_list = [...props.illnessHistories]
    illnessHistoryStore.getIllnessHistorys.forEach((item: any) => {
      id_pet_illness_history_list.forEach((id: string) => {
        if (id == item.id_pet_illness_history) {
          idPetIllnessHistory.push(item.id_pet_illness_history)
        }
      })
    })
  }

  multipleData.value.push({
    id_clinical_file: null,
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    file_path: null,
    // id_pet_illness_history: idPetIllnessHistory,
    id_pet_illness_history: props.illnessHistories?.id_pet_illness_history,
    type_provider: 1,
    name_file: null,
    type_file: 1,
    type_receive_format: 2,
    type_diagnostic_info: null,
    memo_file_storage: null,
    id_employee_supplier: null,
    name_supplier_other: null,
    datetime_receive: dayjs().format('YYYY/MM/DD HH:mm:ss'),
    id_clinic: null
  })
}

const uploadFile = async () => {
  isDragging.value = false
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: '読み込み中です...',
    messageColor: 'black'
  })

  const payload: ClinicalFile[] = multipleData.value.map(
    (data: ClinicalFile) => {
      if (temp.value.length > 0) {
        if (typeof temp.value[0] == 'number') {
          data.type_diagnostic_info = temp.value.join(',')
        } else {
          let t = []
          t.push(
            temp.value.map((item) => {
              return item.value
            })
          )
          data.type_diagnostic_info = t.join(',')
        }
      } else {
        delete data.type_diagnostic_info
      }
      if (Array.isArray(data.id_pet_illness_history)) {
        if (data.id_pet_illness_history.length > 0) {
          data.id_pet_illness_history = data.id_pet_illness_history.join(',')
        }
      }
      return data
    }
  )

  try {
    const postRequests = payload.map((data) =>
      clinicalFilesStore.submitClinicalFile(data)
    )
    await Promise.all(postRequests)

    Loading.hide()
    mtUtils.autoCloseAlert(aahMessages.success)

    await illnessHistoryStore.selectIllnessHistory(
      props.illnessHistories.id_pet_illness_history
    )
  } catch (error) {
    console.error('Error uploading files:', error)
    Loading.hide()
    mtUtils.autoCloseAlert(aahMessages.failed)
  }
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) {
    handleFileUploaded(files)
  }
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragEnter = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
}

const updateClincalFileDirect = (data: IllnessHistoryType) => {
  emits('update-clinical-file-direct', data)
}

const generateQrForClinicalFileUpload = (data: IllnessHistoryType) => {
  emits('generate-qr-for-clinical-file-upload', data)
}

const uploadClinicalFileWithStream = (data: IllnessHistoryType) => {
  emits('upload-clinical-file-with-stream', data)
}

const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
}

</script>

<template>
  <div
    class="clinical-files"
    :class="{ 'drag-over': isDragging }"
    @dragenter.prevent="onDragEnter"
    @dragleave.prevent="onDragLeave"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
  >
    <div class="image-container cursor-pointer">
      <q-icon
        v-if="isDragging"
        class="upload-icon"
        size="xl"
        name="cloud_upload"
      />
      <div
        class="file"
        v-for="(files, i) in clinicList"
        :key="`ClinicalFilePocketList-files-${i}-${files.file_path}`"
        @click="onRowClick(files, i)"
      >
        <img
          v-if="files.type_file == 1"
          :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
          class="thumbnail-style"
          @error="replaceByDefaultImg"
        />
        <video
          v-else-if="files.type_file == 2"
          :id="`cli_file_video_${i}`"
          class="thumbnail-style"
          style="width: 169px;"
          controls
        >
          <source :src="files.file_path" type="video/mp4" />
        </video>
        <img
          v-else-if="files.file_path?.includes('.pdf')"
          :src="files.thumbnail_path"
          class="xy thumbnail-style"
        />
        <img
          v-else-if="files.type_file == 3"
          :src="files.thumbnail_path"
          class="thumbnail-style"
          @error="replaceByDefaultImg"
        />
        <img
          v-else-if="
            files.file_path?.includes('.mp3') ||
            files.file_path?.includes('.wav')
          "
          src="@/assets/img/clinicalFiles/audio.png"
          class="xy thumbnail-style"
        />
        <img
          v-else
          :src="fileLogo"
          class="xy thumbnail-style"
        />
        <div class="date-overlay">
          {{ formatDate(files.datetime_receive) }}
        </div>
      </div>
    </div>
    <div class="row q-mt-xs justify-center">
      <q-btn
        class="full-height bg-grey-200 q-mx-md"
        @click="updateClincalFileDirect(props.illnessHistories)"
        size="24"
        flat
        round
      >
        <q-icon
          name="cloud_upload"
          class="text-grey-800 clinicalFileActionIcon"
          size="sm"
        />
      </q-btn>
      <q-btn
        class="full-height bg-grey-200 q-mx-md"
        flat
        round
        size="24"
        @click="generateQrForClinicalFileUpload(props.illnessHistories)"
      >
        <q-icon
          name="qr_code"
          class="text-grey-800 clinicalFileActionIcon"
          size="sm"
        />
      </q-btn>
      <q-btn
        class="full-height bg-grey-200 q-mx-md"
        @click="uploadClinicalFileWithStream(props.illnessHistories)"
        size="24"
        flat
        round
      >
        <q-icon
          name="add_a_photo"
          class="text-grey-800 clinicalFileActionIcon"
          size="sm"
        />
      </q-btn>
    </div>
  </div>
</template>

<style scoped lang="scss">
.clinical-files {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-direction: column;
  max-width: 600px;
  flex-wrap: wrap;
  border: 2px dashed transparent;
  transition: border-color 0.3s ease;
  position: relative;

  &.drag-over {
    border-color: $blue;
    background-color: rgb(62, 127, 255, 0.15);
  }

  .upload-icon {
    position: absolute;
    color: $blue;
    z-index: 2;
    background-color: rgb(62, 127, 255, 0.25);
    border-radius: 100%;
    padding: 8px;
    left: 50%;
    bottom: 12px;
  }

  .image-container {
    display: flex;
    width: 100%;
    height: 100%;
    gap: 8px;
    flex-wrap: wrap;
    .file {
      position: relative;
      cursor: pointer;
    }
  }
  .thumbnail-style {
    border-radius: 8px;
    height: 123px;
    max-width: 169px;
  }
  .image-container img,
  .image-container video {
    width: 100%;
    // height: 100%;
  }

  .date-overlay {
    position: absolute;
    bottom: 4px;
    right: 4px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    padding: 2px 5px;
    font-size: 12px;
    border-radius: 8px;
  }

  .upload-section {
    border: 1px dotted $grey-500;
    padding: 0;
    height: 123px;
    cursor: pointer;
  }
}
img[src*="file.png"] {
  // width: 300px;
  // background-color:red
}
</style>
