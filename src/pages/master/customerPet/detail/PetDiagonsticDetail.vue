<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import useClinicalFilesStore from '@/stores/clinical-files'
import UpdateClinicalFileModal from '@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue'
import ClinicalFilesUploaderUrl from '@/pages/petInfo/clinicalFilesUploaderUrl/ClinicalFilesUploaderUrl.vue'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { formatDate } from '@/utils/aahUtils'
import _, { groupBy, sortBy } from 'lodash'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCustomerStore from '@/stores/customers'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import fileLogo from '@/assets/img/clinicalFiles/file.png';

const props = defineProps({
  id_customer: String,
  id_pet: String,
  code_customer: String,
  fixedFilter: { type: Boolean, default: false },
  id_pet_illness_history: String
})

const clinicalFilesStore = useClinicalFilesStore()
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)
const { getClinicalFiles } = storeToRefs(clinicalFilesStore)

const apiCalled = ref(false)
const illnessHistoryList = ref([])
const illnessHistoryListDefault = reactive([])
const illnessHistorySelected = ref(null)

const clinicalFileList = computed(() => {
  return groupBy(
    sortBy(
      getClinicalFiles.value.map(v => ({...v, date_receive: formatDate(v.datetime_receive)})),
      'datetime_receive',
      'asc'
    ).reverse(),
    'date_receive'
  )
})

function getSelectedClinic() {
  try {
    return JSON.parse(localStorage.getItem('id_clinic'))
  } catch (error) {
    return null
  }
}

const illnessHistoryName = (value: any) => {
  return value
    .map((v: string) => {
      const illness = getIllnessHistorys.value.find(
        (ih) => ih.id_pet_illness_history === v
      )
      if (illness)
        return illness.name_disease
          ? illness.name_disease
          : illness.name_disease_free
    })
    .join(', ')
}

const generateQrForNonLoginUsers = async () => {
  const id_clinic = getSelectedClinic()

  if (id_clinic == null) {
    await mtUtils.autoCloseAlert(
      'QRコードを生成する前にクリニックを選択してください'
    )
  } else {
    let data = {
      id_customer: props.id_customer,
      id_pet: props.id_pet,
      code_customer: props.code_customer,
      id_pet_illness_history:
        illnessHistorySelected.value.id_pet_illness_history
    }
    await mtUtils.mediumPopup(ClinicalFilesUploaderUrl, { data })
  }
}

const openDiagnosticModal = async () => {
  const id_clinic = getSelectedClinic()
  const currentPet = customerStore.getPet
  if (id_clinic == null) {
    await mtUtils.autoCloseAlert(
      'さらにアクションを実行する前にクリニックを選択してください'
    )
  } else {
    let data = {
      id_customer: props.id_customer,
      id_pet: props.id_pet,
      code_customer: props.code_customer,
      name_pet: currentPet.name_pet,
      id_clinic: id_clinic,
      id_pet_illness_history: [illnessHistorySelected.value]
    }
    await mtUtils.mediumPopup(UpdateClinicalFileModal, { data: data })
  }
}
const onRowClick = async (data: any, i: Number) => {
  const video = document.getElementById(`pd_cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  const currentPet = customerStore.getPet
  data.name_pet = currentPet.name_pet
  await mtUtils.mediumPopup(UpdateClinicalFileModal, {
    data: data,
    allData: _.sortBy(
      getClinicalFiles.value,
      'datetime_receive',
      'asc'
    ).reverse()
  })
}

const refreshFilePreviews = () => {
  const allxy = document.getElementsByClassName('xy')
  for (let i = 0; i < allxy.length; i++) {
    if (allxy[i].getElementsByTagName('img')[0]) {
      allxy[i].getElementsByTagName('img')[0].style =
        'width: 50px; height: 50px; margin-left: 3.5rem;margin-top: 2rem;'
    }
  }
}

const filter = async () => {
  let filters = {}
  if (illnessHistorySelected.value)
    Object.assign(filters, {
      id_pet_illness_history: illnessHistorySelected.value
    })
  return filters
}

const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
}

const init = async () => {
  const filterObj = await filter()
  await clinicalFilesStore.fetchClinicalFiles({
    id_pet: props.id_pet,
    ...filterObj
  })
  refreshFilePreviews()
}
onMounted(async () => {
  if (getIllnessHistorys.value.length === 0)
    await illnessHistoryStore.fetchIllnessHistorys({
      id_pet: props?.id_pet,
      id_customer: props?.id_customer
    })
  getIllnessHistorys.value.map((v: any) => {
    illnessHistoryListDefault.push({
      label: v.name_disease ? v.name_disease : v.name_disease_free,
      value: v.id_pet_illness_history
    })
  })
  if (props.id_pet_illness_history)
    illnessHistorySelected.value = props.id_pet_illness_history
  illnessHistoryList.value = [...illnessHistoryListDefault]

  await init()
  refreshFilePreviews()
})

defineExpose({
  fetchMoreData
})

let isErrorHandled = false;

const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}

async function fetchMoreData() {
  if (isErrorHandled) return;
  
  const filters = await filter();
  try {
    await clinicalFilesStore.fetchClinicalFiles(
      {
        id_pet: props.id_pet,
        ...filters
      },
      true
    );
  } catch (error) {
    if (!isErrorHandled) {
      isErrorHandled = true; 
      mtUtils.autoCloseAlert('指定の条件下で全てのデータを呼び出しました。');
      
      setTimeout(() => {
        isErrorHandled = false;
      }, 3000);
    }
  }
}
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar"
    style="width: 100%; max-width: 100%"
    @scroll="handleScroll"
    ref="scrollAreaRef"
  >
    <div
        class="full-width q-py-xs q-pr-lg z-top sticky-header"
      :class="props.fixedFilter ? 'bg-white header-container' : ''"
    >
      <div class="flex no-wrap items-center q-mb-md" style="gap: 13px">
        <div style="flex: 1">
          <MtFilterSelect
            label="現疾患・既往歴"
            v-model:options="illnessHistoryList"
            :options-default="illnessHistoryListDefault"
            v-model:selecting="illnessHistorySelected"
            autofocus
            @onEnterPress="init()"
            @update:selecting="()=>{init();}"
          />
        </div>
        <div>
          <q-btn
            padding="6px 14px"
            unelevated
            @click="init()"
            color="accent-800"
            text-color="white"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
        </div>
        <div>
          <q-btn
            unelevated
            padding="6px 14px"
            color="primary"
            text-color="white"
            @click="generateQrForNonLoginUsers()"
          >
            <q-icon size="18px" name="add" class="q-mr-xs" />QRコード</q-btn
          >
        </div>
        <div class="q-mr-xs"></div>
        <div>
          <q-btn
            unelevated
            padding="6px 14px"
            color="primary"
            text-color="white"
            @click="openDiagnosticModal()"
          >
            <q-icon size="18px" name="add" class="q-mr-xs" />資料
          </q-btn>
        </div>
      </div>
    </div>
    <div class="bg-white q-px-md q-py-xs">
      <template v-for="(files, date) in clinicalFileList">
        <div class="caption1 regular divider q-mt-md q-mb-xs">
          <span class="text-weight-bold q-ml-sm">{{ date }}</span>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div
            class="col-auto cursor-pointer"
            v-for="(file, i) in files"
            :key="i"
            @click.stop="onRowClick(file, i)"
          >
            <div class="image-container">
              <div class="file">
                  <img
                    v-if="file.type_file == 1"
                    :src="file.thumbnail_path ? file.thumbnail_path : fileLogo"
                    class="thumbnail-style"
                    @error="replaceByDefaultImg"
                  />
                  <video
                    v-else-if="file.type_file == 2"
                    :id="`cli_file_video_${i}`"
                    class="thumbnail-style"
                    style="width: 169px;"
                    controls
                    @click.stop.prevent="onRowClick(file, i)"
                  >
                    <source :src="file.file_path" type="video/mp4" />
                  </video>
                  <img
                    v-else-if="file.file_path?.includes('.pdf')"
                    :src="file.thumbnail_path"
                    class="xy thumbnail-style"
                  />
                  <img
                    v-else-if="file.type_file == 3"
                    :src="file.thumbnail_path"
                    class="thumbnail-style"
                    @error="replaceByDefaultImg"
                  />
                  <img
                    v-else-if="
                      file.file_path?.includes('.mp3') ||
                      file.file_path?.includes('.wav')
                    "
                    src="@/assets/img/clinicalFiles/audio.png"
                    class="xy thumbnail-style"
                  />
                  <img v-else :src="fileLogo" class="xy thumbnail-style" />
                  <div class="date-overlay">
                    {{ formatDate(file.datetime_receive) }}
                  </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </q-scroll-area>
</template>

<style scoped lang="scss">
.altered_img {
  width: 50px;
  height: 50px;
  margin-left: 3.5rem;
  margin-top: 2rem;
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
  height: 100%;
  max-width: 180px;
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
.header-container {
  position: relative;
}
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

</style>
