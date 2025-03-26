<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import useIllnessHistoryStore from '@/stores/illness-history'
import useClinicalFilesStore from '@/stores/clinical-files'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import { QUploader } from 'quasar'
import DoubleZoomImageModal from '@/pages/message/DoubleZoomImageModal.vue'
import { typeDiagnosticInfo, typeFile, typeProvider } from '@/utils/enum'
import DicomViewerModal from './DicomViewerModal.vue'
import { ClinicalFile } from '@/types/types'
import { convertBlobToBase64 } from '@/utils/convertBlobToBase64'
import dayjs from 'dayjs'
import useMemoCarteStore from '@/stores/memo-cartes'
import FabricMemoCarteModal from '@/pages/memoCarte/FabricMemoCarteModal.vue'
import { event_bus } from '@/utils/eventBus'

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  onCompleteCallback: Function,
  allData: Array
})
const illnessHistoryStore = useIllnessHistoryStore()
const clinicalFilesStore = useClinicalFilesStore()
const customerStore = useCustomerStore()
const memoCarteStore = useMemoCarteStore()

const petList: any = ref([])
const data = ref({
  id_clinical_file: null,
  id_customer: null,
  id_pet: null,
  file_path: null,
  id_pet_illness_history: [],
  type_provider: 1,
  name_file: null,
  type_file: 1,
  type_receive_format: 2,
  type_diagnostic_info: null,
  memo_file_storage: null,
  id_employee_supplier: null,
  name_supplier_other: null,
  datetime_receive: getDateToday(),
  id_clinic: null,
  flg_delete: false
})
const filePaths = ref<Array<string | ArrayBuffer | null>>([])
const multipleData = ref<ClinicalFile[]>([
  {
    id_clinical_file: null,
    id_customer: null,
    id_pet: null,
    file_path: null,
    id_pet_illness_history: [],
    type_provider: 1,
    name_file: null,
    type_file: 1,
    type_receive_format: 2,
    type_diagnostic_info: null,
    memo_file_storage: null,
    id_employee_supplier: null,
    name_supplier_other: null,
    datetime_receive: getDateToday(),
    id_clinic: null
  }
])
const currentMultipleData = ref(0)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const uploadNew = ref(false)
const doSubmit = ref(false)
const f_status = ref('unchanged')
const previewImage = ref(false)
const isDragging = ref(false)
const temp = ref([])
const history = ref([])
const isEdit = ref(false)
const petName = ref('')
const uploader = ref(null)
const { getCustomer } = storeToRefs(customerStore)
const petIllnessHistoryList = ref([])
const petIllnessHistoryListDefault = reactive<any>([])
const petIllnessHistorySelected = ref([])
const uploadedFileUrl = ref('')

const submit = () => {
  if (f_status.value === 'unchanged') {
    delete multipleData.value[0].file_path
  }

  const payload: ClinicalFile[] = multipleData.value.map((data: ClinicalFile) => {
    const payloadData = { ...data };
    if (temp.value.length > 0) {
      if (typeof temp.value[0] === 'number') {
        payloadData.type_diagnostic_info = temp.value.join(',');
      } else {
        const t = temp.value.map((item) => item.value);
        payloadData.type_diagnostic_info = t.join(',');
      }
    } else {
      delete payloadData.type_diagnostic_info;
    }
    if (Array.isArray(payloadData.id_pet_illness_history)) {
      if (payloadData.id_pet_illness_history.length > 0) {
        payloadData.id_pet_illness_history = payloadData.id_pet_illness_history.join(',');
      }
    }
    if (payloadData.datetime_receive) {
      payloadData.datetime_receive = formatDateWithTime(payloadData.datetime_receive, 'YYYY/MM/DD HH:mm:ss');
    }

    return payloadData;
  });

  payload.forEach((data) => {
    if (data.id_clinical_file) {
      doSubmit.value = false;
      clinicalFilesStore
        .updateClinicalFile(data.id_clinical_file, data)
        .then(async () => {
          await Promise.all([
            memoCarteStore.fetchMemoCarteV1({
              id_pet: data.id_pet,
              id_customer: data.id_pet,
            }),
            clinicalFilesStore.fetchClinicalFiles({
              id_pet: data.id_pet,
            }),
          ]);
          if (props.onCompleteCallback) {
            props.onCompleteCallback(data);
          }
          event_bus.emit('reloadLeft');
          emits('close');
          await mtUtils.autoCloseAlert(aahMessages.success);
        })
        .finally(() => {
          doSubmit.value = true;
        });
    } else {
      doSubmit.value = false;
      clinicalFilesStore
        .submitClinicalFile(data)
        .then(async () => {
          await Promise.all([
            memoCarteStore.fetchMemoCarteV1({
              id_pet: data.id_pet,
              id_customer: data.id_pet,
            }),
            clinicalFilesStore.fetchClinicalFiles({
              id_pet: data.id_pet,
            }),
          ]);
          if (props.onCompleteCallback) {
            props.onCompleteCallback(clinicalFilesStore.recentClinicalFile.data);
          }
          emits('close');
          await mtUtils.autoCloseAlert(aahMessages.success);
        })
        .finally(() => {
          doSubmit.value = true;
        });
    }
  });
};

const openImageViewModal = async (file, play: boolean) => {
  const files = props.allData
    ?.filter((item) => item.type_file == 1 || item.type_file == 2)
    ?.map((item) => ({ ...item, content_type: 'image' }))
  const currentIndex = files?.findIndex((item) => item.id_clinical_file === multipleData.value[0].id_clinical_file)

  await mtUtils.imageViewPopup(DoubleZoomImageModal, {
    files,
    currentIndex,
    singleImage: false,
    index: 0,
    comparison: 'clinical_file',
    play,
  })
}
const openDicomViewModal = async (file) => {
  await mtUtils.popup(DicomViewerModal, {
    dicom_url: file,
    id_clinical_file: data.value.id_clinical_file,
    id_pet: data.value.id_pet,
    persistent: true
  })
}

const handleFileUploaded = async (files: readonly File[]): Promise<void> => {
  if (files.length > 10) {
    uploader?.value?.reset()
    mtUtils.autoCloseAlert('同時アップロードは最大10点です')
    return
  }
  const promises = files.map((fileObject, index) => {
    return onFileAdded(fileObject, index)
  })
  await Promise.all(promises)
}

const onFileAdded = async (fileObject: File, index: number) => {
  if (!fileObject.size) {
    return mtUtils.autoCloseAlert('アップロードするファイルを選択してください')
  }

  previewImage.value = true
  doSubmit.value = true
  f_status.value = 'changed'

  // generate multiple payload start on index 1 and above
  if (index) {
    generateMultiplePayload()
  }

  try {
    if (fileObject.type.startsWith('image/')) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 1
      if (fileObject.__img) {
        const filePath = await convertBlobToBase64(fileObject.__img.src)
        filePaths.value[index] = filePath
      } else {
        const filePath = URL.createObjectURL(fileObject)
        filePaths.value[index] = filePath
      }
    } else if (fileObject.type.startsWith('video/')) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 2
      const filePath = URL.createObjectURL(fileObject)
      filePaths.value[index] = filePath
    } else if (fileObject.type.includes('dicom') || fileObject.name.endsWith('.dcm')) {
      multipleData.value[index].name_file = fileObject.name
      multipleData.value[index].file_path = fileObject
      multipleData.value[index].type_file = 3
      const filePath = await URL.createObjectURL(fileObject)
      filePaths.value[index] = filePath
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
      const filePath = URL.createObjectURL(fileObject)
      filePaths.value[index] = filePath
    } else {
      mtUtils.alert('エラー', 'ファイルがサポートされていません').then(() => {
        onFileRemoved(index)
        uploader.value.reset()
      })
    }
    isDragging.value = false
  } catch (error) {
    console.error('Error processing file: ', error)
  }
}

const onFileRemoved = (index: number) => {
  multipleData.value[index].file_path = null
  multipleData.value[index].name_file = null
  multipleData.value[index].type_file = null
  multipleData.value.length = 0
  filePaths.value.length = 0
  previewImage.value = false
  doSubmit.value = false
  f_status.value = 'removed'
  isEdit.value = false
  uploadNew.value = true
  generateMultiplePayload()
}
const goSwitch = (direction: string) => {
  if (props.allData?.length) {
    const currentIndex = props.allData?.findIndex(
      (item) => item.id_clinical_file === multipleData.value[0].id_clinical_file
    )
    if (direction === 'next') {
      if (props.allData[currentIndex + 1]) init(props.allData[currentIndex + 1])
    } else if (direction === 'previous') {
      if (props.allData[currentIndex - 1]) init(props.allData[currentIndex - 1])
    }
  }
}
const closeModal = () => {
  emits('close')
}
const setOptionsForPetList = () => {
  petList.value = getCustomer.value?.pets

  // If there is only one pet, set it as the default
  if (getCustomer.value?.pets.length === 1) {
    data.value.id_pet = getCustomer.value?.pets[0].id_pet
  }
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
                await Promise.all([
                  memoCarteStore.fetchMemoCarteV1({
                    id_pet: data.value.id_pet
                  }),
                  clinicalFilesStore.fetchClinicalFiles({
                    id_pet: data.value.id_pet
                  }),
                  illnessHistoryStore.selectIllnessHistory(
                    data.value.id_pet_illness_history?.[0]
                  )
                ])
                if (props.onCompleteCallback) {
                  props.onCompleteCallback(
                    // clinicalFilesStore.recentClinicalFile.data
                    data.value
                  )
                }
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const init = (newData: ClinicalFile = null) => {
  petList.value = getCustomer.value?.pets
  // data.value = JSON.parse(JSON.stringify(newData ? newData : props.data))
  multipleData.value[currentMultipleData.value] = JSON.parse(
    JSON.stringify(newData ? newData : props.data)
  )

  // if image is exist from api response
  if (props.data?.file_path) {
    doSubmit.value = true
    previewImage.value = true
    isEdit.value = true
    filePaths.value[currentMultipleData.value] = props.data?.file_path
  }

  // if image is exist from api response
  if (newData?.file_path) {
    doSubmit.value = true
    previewImage.value = true
    isEdit.value = true
    filePaths.value[currentMultipleData.value] = newData?.file_path
  }

  if (props.data?.type_diagnostic_info) {
    props.data?.type_diagnostic_info.map((item) => {
      let a = typeDiagnosticInfo.find((option) => option.value == item)
      temp.value.push(a)
    })
  }
  petName.value = props.data?.id_pet
  if (props.data?.id_pet_illness_history) {
    const id_pet_illness_history_list = [...data.value.id_pet_illness_history]
    data.value.id_pet_illness_history.length = 0
    illnessHistoryStore.getIllnessHistorys.forEach((item: any) => {
      id_pet_illness_history_list.forEach((id: string) => {
        if (id == item.id_pet_illness_history) {
          data.value.id_pet_illness_history.push(item.id_pet_illness_history)
        }
      })
    })
  }
  data.value.id_clinic = data.value.id_clinic
  if (!isEdit.value) {
    multipleData.value[currentMultipleData.value].type_file = 1
    multipleData.value[currentMultipleData.value].type_provider = 1
    multipleData.value[currentMultipleData.value].type_receive_format = 2
    multipleData.value[currentMultipleData.value].datetime_receive =
      dayjs().format('YYYY/MM/DD HH:mm:ss')
  }
}
const selectDefaultEmployee = () => {
  data.value.id_employee_supplier = defaultEmployee
}
const handleFileUpload = () => {
  const input = document.querySelector(
    '.modal-upload-section .q-uploader__input'
  )
  input?.click()
}

const switchPreviewData = (direction: 'next' | 'previous') => {
  if (direction === 'next') {
    if (currentMultipleData.value !== multipleData.value.length - 1) {
      currentMultipleData.value++
    }
  }
  if (direction === 'previous') {
    if (currentMultipleData.value !== 0) {
      currentMultipleData.value--
    }
  }
}

const generateMultiplePayload = () => {
  const idPetIllnessHistory = []
  if (props.data.id_pet_illness_history) {
    const id_pet_illness_history_list = [...props.data.id_pet_illness_history]
    illnessHistoryStore.getIllnessHistorys.forEach((item: any) => {
      id_pet_illness_history_list.forEach((id: string) => {
        if (id == item.id_pet_illness_history) {
          idPetIllnessHistory.push(item.id_pet_illness_history)
        }
      })
    })
  }
  filePaths.value.push('')

  return multipleData.value.push({
    ...props.data,
    id_pet_illness_history: idPetIllnessHistory,
    datetime_receive: dayjs().format('YYYY/MM/DD HH:mm:ss')
  })
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

const openEditModal = async () => {
  await mtUtils.fullHeightPopup(FabricMemoCarteModal, {
    id_memo_carte: null,
    id_customer: data.value?.id_customer,
    id_pet: data.value?.id_pet,
    isDirectSubmit: true,
    id_pet_illness_history: [illnessHistoryStore.getIllnessHistory?.id_pet_illness_history],
    imageUrl: filePaths.value[currentMultipleData.value],
    isEdit: true,
    id_clinical_file: data.value?.id_clinical_file
  })
  closeModal()
}

const updateClinicalFile = async () => {
  if (data.value.id_clinical_file) {
    data.value = {
      ...data.value,
      id_pet_illness_history: data.value.id_pet_illness_history.join(','),
      flg_delete: true
    }
    await clinicalFilesStore.updateClinicalFile(data.value.id_clinical_file, data.value)
    closeModal()
  }
}

onMounted(async () => {
  if (props.data.id_clinical_file) {
    data.value = props.data
    isEdit.value = true
  } else {
    uploadNew.value = true
    data.value.id_clinic = JSON.parse(JSON.stringify(props.data.id_clinic))
  }
  init()
  event_bus.on('updateClinicalFile', async () => { await updateClinicalFile() })
})

onUnmounted(() => {
  event_bus.off('updateClinicalFile')
})
</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
      関連資料
    </q-toolbar-title>
    <MtPetFilterSelect
      v-model:selecting="petName"
      :pet-list="petList"
      label="ペット名"
      class="q-mx-md"
      readonly
    />
    <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-md">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
    <q-btn v-if="isEdit" flat round @click="openEditModal" class="q-mx-md">
      <q-icon size="xs" name="edit" />
    </q-btn>
  </MtModalHeader>

  <q-card-section class="content">
    <div
      class="clinical-files"
      :class="{ 'drag-over': isDragging }"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
    >
      <q-icon
        v-if="isDragging"
        class="upload-icon"
        size="xl"
        name="cloud_upload"
      />
        <q-card-section class="q-px-xl">
          <div
            v-if="props.allData && props.allData?.length > 0"
            class="flex justify-between q-mb-sm"
          >
            <q-btn @click="goSwitch('previous')" flat>
              <q-icon name="keyboard_arrow_left" />
            </q-btn>
            <q-btn @click="goSwitch('next')" flat>
              <q-icon name="keyboard_arrow_right" />
            </q-btn>
          </div>

          <div class="row q-col-gutter-md q-mb-lg q-py-sm q-px-md">
            <div
              class="col flex items-center justify-center upload-section bg-grey-100"
            >
              <q-uploader
                v-model="data.file_path"
                label="ファイルを選択する"
                color="primary"
                ref="uploader"
                class="text-center bg-grey-100"
                flat
                square
                rounded
                multiple
                @added="handleFileUploaded"
                @removed="onFileRemoved(currentMultipleData)"
                v-if="!previewImage"
              />
              <div v-if="previewImage" class="relative-position rpd">
                <q-btn
                  v-if="filePaths.length > 1"
                  class="preview-button-prev"
                  flat
                  round
                  @click="switchPreviewData('previous')"
                >
                  <q-icon name="keyboard_arrow_left" />
                </q-btn>
                <q-btn
                  v-if="filePaths.length > 1"
                  class="preview-button-next"
                  flat
                  round
                  @click="switchPreviewData('next')"
                >
                  <q-icon name="keyboard_arrow_right" />
                </q-btn>
                <div v-if="multipleData[currentMultipleData].type_file == 1">
                  <q-img
                    :src="filePaths[currentMultipleData]"
                    spinner-color="white"
                    class="cursor-pointer"
                    @click="
                      openImageViewModal(
                        multipleData[currentMultipleData]
                      )
                    "
                  />
                </div>
                <video
                  v-else-if="multipleData[currentMultipleData].type_file == 2"
                  style="height: 100%; max-width: 100%"
                  @click.stop.prevent="openImageViewModal(multipleData[currentMultipleData], true)"
                  :src="filePaths[currentMultipleData]"
                />
                <iframe
                  v-else-if="multipleData[currentMultipleData].type_file === 99"
                  :src="filePaths[currentMultipleData]"
                  style="width: 100%; height: 90vh"
                  frameborder="0"
                ></iframe>
                <q-img
                  v-else-if="
                    (typeof multipleData[currentMultipleData].file_path ==
                      'string' &&
                      multipleData[currentMultipleData].file_path.includes(
                        '.mp3'
                      )) ||
                    (typeof multipleData[currentMultipleData].file_path ==
                      'string' &&
                      multipleData[currentMultipleData].file_path.includes(
                        '.wav'
                      ))
                  "
                  :src="'/src/assets/img/clinicalFiles/audio.png'"
                  spinner-color="white"
                  class="cursor-pointer"
                />
                <q-img
                  v-else-if="multipleData[currentMultipleData].type_file == 3"
                  @click="
                    openDicomViewModal(
                      multipleData[currentMultipleData].file_path
                    )
                  "
                  :src="multipleData[currentMultipleData].thumbnail_path"
                  spinner-color="white"
                  class="cursor-pointer"
                />
                <q-img
                  v-else
                  :src="'/src/assets/img/clinicalFiles/file.png'"
                  spinner-color="white"
                  class="cursor-pointer"
                />
                <q-badge
                  color="red"
                  floating
                  transparent
                  class="cursor-pointer"
                  @click="onFileRemoved(currentMultipleData)"
                >
                  <q-icon name="close" />
                </q-badge>
              </div>
            </div>
            <div class="col">
              <div class="flex items-center justify-between q-mb-md">
                <div class="col">
                  <MtFormMultipleSelection
                    :options="illnessHistoryStore.getIllnessHistorys"
                    :option-label="
                      (v) =>
                        v.name_disease ? v.name_disease : v.name_disease_free
                    "
                    option-value="id_pet_illness_history"
                    v-model="
                      multipleData[currentMultipleData].id_pet_illness_history
                    "
                    required
                    :rules="[aahValidations.validationRequired]"
                    label="現疾患・既往歴"
                    show-quick-illness-history
                  />
                </div>
                <div class="col q-ml-sm">
                  <MtFormPullDown
                    label="情報元区分"
                    v-model:selected="
                      multipleData[currentMultipleData].type_provider
                    "
                    :options="typeProvider"
                  />
                </div>
              </div>
              <div class="flex items-center justify-between q-mb-md">
                <!--<div class="col q-mr-sm">
                  <MtInputForm
                    type="text"
                    v-model="multipleData[currentMultipleData].name_file"
                    class=""
                    label="ファイル名"
                  />
                </div>-->
                <div class="col q-mr-sm">
                  <MtFormInputDate
                    v-model:date="
                      multipleData[currentMultipleData].datetime_receive
                    "
                    label="受領日時"
                  />
                </div>
                <div class="col">
                  <MtFormPullDown
                    label="ファイル区分"
                    v-model:selected="multipleData[currentMultipleData].type_file"
                    :options="typeFile"
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
                    required
                    label="区分"
                  />
                </div>
              </div>
              <div class="col q-mb-md">
                <MtInputForm
                  type="text"
                  v-model="multipleData[currentMultipleData].memo_file_storage"
                  class=""
                  label="ファイル保管メモ"
                  autogrow
                />
              </div>
              <!--<div class="flex items-center justify-between q-mb-md">
                <div class="col q-mr-sm">
                  <InputEmployeeOptGroup
                    v-model:selected="multipleData[currentMultipleData].id_employee_supplier"
                    label="取引先名"
                    show-select-default-employee
                    @update:select-default-employee="selectDefaultEmployee"
                  />
                </div>
                <div class="col">
                  <MtInputForm
                    type="text"
                    v-model="multipleData[currentMultipleData].name_supplier_other"
                    class=""
                    label="その他取引先名"
                  />
                </div>
              </div>-->

              <div class="flex items-center justify-between q-mb-md">
                <!--<div class="col">
                  <MtFormPullDown
                    label="受領形式"
                    v-model:selected="multipleData[currentMultipleData].type_receive_format"
                    :options="typeReceiveFormat"
                  />
                </div>-->
              </div>
            </div>
          </div>
        </q-card-section>
    </div>
  </q-card-section>

  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>閉じる</span>
      </q-btn>
      <q-btn
        unelevated
        color="primary"
        class="q-ml-md"
        :disable="!doSubmit"
        @click="submit"
      >
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
<style lang="scss" scoped>
.upload-section {
  border: 1px dotted $grey-500;
  padding: 0;
  height: auto;
  cursor: pointer;
}

.rpd {
  width: 100%;
}

.rpd > img {
  width: 100%;
}

.q-uploader.hide-preview :deep(.q-uploader__list) {
  display: none;
}

.preview-button-prev {
  position: absolute;
  bottom: 50%;
  left: 12px;
  color: $white;
  background-color: $black;
  opacity: 0.4;
  z-index: 2;
}
.preview-button-next {
  position: absolute;
  bottom: 50%;
  right: 12px;
  color: $white;
  background-color: $black;
  opacity: 0.4;
  z-index: 2;
}
.clinical-files {
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
    bottom: 75px;
  }
}
</style>
