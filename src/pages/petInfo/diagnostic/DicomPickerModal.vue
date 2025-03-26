<script setup lang="ts">
import { computed, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useClinicalFilesStore from '@/stores/clinical-files'

const clinicalFilesStore = useClinicalFilesStore()
const emits = defineEmits(['close'])
const props = defineProps({
  callback: Function
})
const selectedFiles = ref([])

const closeModal = async () => {
  emits('close')
}

const dcmClinicalFiles = computed(() => {
  const dcmFiles = clinicalFilesStore.getClinicalFiles.filter(file => file.type_file === 3)
  return dcmFiles
})

const toggleSelection = (file) => {
  const index = selectedFiles.value.indexOf(file);
  if (index > -1) {
    selectedFiles.value.splice(index, 1); 
  } else {
    selectedFiles.value.push(file);
  }
};

const submit = async () => {
  closeModal()
  await props.callback(selectedFiles.value)
}

</script>

<template>
  <MtModalHeader 
    @closeModal="closeModal"  class="dicom-header q-py-sm">
      <q-toolbar-title class="text-grey-900 title2 bold" >
        <span class="dicom-title">表示するファイルを選択</span>
      </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-my-lg">
    <div class="file-grid">
      <div
        v-for="file in dcmClinicalFiles"
        :key="file.id_clinical_file"
        class="file-item"
        @click="toggleSelection(file)"
        :class="{ 'selected': selectedFiles.includes(file) }"
      >
        <img :src="file.thumbnail_path" alt="thumbnail" class="thumbnail"/>
        <span class="file-name">{{ file.name_file }}</span>
      </div>
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
        :disable="selectedFiles.length === 0"
        @click="submit"
      >
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style scoped lang="scss">

.file-selection-container {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.file-item {
  border: 2px solid transparent;
  border-radius: 10px;
  padding: 10px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  position: relative;
}

.file-item.selected {
  border-color: #007bff; /* Change this color to whatever you prefer */
}

.thumbnail {
  width: 100%;
  height: auto;
  border-radius: 10px;
  margin-bottom: 10px;
}

.file-name {
  display: block;
  margin-top: 5px;
  font-weight: bold;
}

</style>
