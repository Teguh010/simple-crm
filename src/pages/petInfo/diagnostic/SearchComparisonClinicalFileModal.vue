<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCustomerStore from '@/stores/customers';
import useIllnessHistoryStore from '@/stores/illness-history';
import { formatDate } from '@/utils/aahUtils';
import { onMounted, ref } from 'vue';
import fileLogo from '@/assets/img/clinicalFiles/file.png';
import useClinicalFilesStore from '@/stores/clinical-files';
import { ClinicalFile } from '@/types/types';
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue';

const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }
const clinicList = ref([] as ClinicalFile[])

const customerStore = useCustomerStore()
const illnessHistoryStore = useIllnessHistoryStore()
const clinicalFileStore = useClinicalFilesStore()
const replaceByDefaultImg = (e) => { e.target.src = fileLogo }
const onImageClick = (index: number) => {
  clinicList.value[index].checked = !clinicList.value[index]?.checked
}
const onCheckboxClick = (event: boolean, index: number) => {
  console.log('Checkbox clicked', event, index)
}
const submit = () => {
  clinicalFileStore.setSelectedClinicalFileComparison(clinicList.value.filter((file) => file.checked))
  closeModal()
}

onMounted(async () => {
  await clinicalFileStore.fetchClinicalFiles({
    id_pet: customerStore.getPet.id_pet,
    // id_pet_illness_history: illnessHistoryStore.getIllnessHistory.id_pet_illness_history
  })
  clinicList.value = [...clinicalFileStore.getClinicalFiles].map((file) => ({...file, checked: false }))
})
</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
      比較ファイルを選択
    </q-toolbar-title>
  </MtModalHeader>

  <q-form @submit="submit">
    <q-card-section class="content">
      <div
        class="clinical-files"
      >
        <div class="image-container cursor-pointer">
          <div
            class="file"
            v-for="(files, i) in clinicList"
            :key="i"
            @click.stop="onImageClick(i)"
          >
            <MtFormCheckBox
              class="absolute"
              v-model:checked="files.checked"
              @update:checked="onCheckboxClick($event, i)"
            />
            <img
              v-if="files.type_file == 1"
              loading="lazy"
              :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
              class="thumbnail-style"
              @error="replaceByDefaultImg"
            />
            <video
              v-else-if="files.type_file == 2"
              :id="`cli_file_video_${i}`"
              class="thumbnail-style"
              style="width: 169px;"
              @click.stop.prevent="onImageClick(i)"
              controls
            >
              <source :src="files.file_path" type="video/mp4" />
            </video>
            <img
              v-else-if="files.file_path?.includes('.pdf')"
              loading="lazy"
              :src="files.thumbnail_path"
              class="xy thumbnail-style"
            />
            <img
              v-else-if="files.type_file == 3"
              loading="lazy"
              :src="files.thumbnail_path"
              class="thumbnail-style"
              @error="replaceByDefaultImg"
            />
            <img
              v-else-if="
                files.file_path?.includes('.mp3') ||
                files.file_path?.includes('.wav')
              "
              loading="lazy"
              src="@/assets/img/clinicalFiles/audio.png"
              class="xy thumbnail-style"
            />
            <img
              v-else
              loading="lazy"
              :src="fileLogo"
              class="xy thumbnail-style"
            />
            <div class="date-overlay">
              {{ formatDate(files.datetime_receive) }}
            </div>
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style scoped lang="scss">
.clinical-files {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-direction: column;
  max-width: 100%;
  justify-content: center;
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
