<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCageConditionStore from '@/stores/cage-conditions'
import { imageResize } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import UploadFile from '@/components/UploadFile.vue'
import aahValidations from '@/utils/aahValidations'

const emits = defineEmits(['close'])
const cageConditionStore = useCageConditionStore()
const props = defineProps({ data: Object })

const isEdit = ref(false)

const myForm = ref(null)

const f1_status = ref('unchanged')
const f2_status = ref('unchanged')
const f3_status = ref('unchanged')

const data = ref({
  code_cage_condition: null,
  memo_cage_condition: null,
  memo_purpose: null,
  file_path1: null,
  file_path2: null,
  file_path3: null,
  id_clinic: null
})

const closeModal = () => {
  emits('close')
}

const fileUploadKeys = ref({
  file1_key: 0,
  file2_key: 0,
  file3_key: 0
})

const submit = () => {
  let formData = new FormData()
  if (props.data?.id_cage_condition) {
    if (f1_status.value == 'changed') {
      formData.append('file_path1', data.value.file_path1)
    } else if (f1_status.value == 'removed') {
      formData.append('file_path1', null)
    }
    if (f2_status.value == 'changed') {
      formData.append('file_path2', data.value.file_path2)
    } else if (f2_status.value == 'removed') {
      formData.append('file_path2', null)
    }
    if (f3_status.value == 'changed') {
      formData.append('file_path3', data.value.file_path3)
    } else if (f3_status.value == 'removed') {
      formData.append('file_path3', null)
    }
    formData.append('memo_cage_condition', data.value.memo_cage_condition)
    formData.append('memo_purpose', data.value.memo_purpose)

    cageConditionStore
      .updateCageCondition(props.data?.id_cage_condition, formData)
      .then(() => {
        cageConditionStore.fetchCageConditions()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    if (data.value.file_path1) {
      formData.append('file_path1', data.value.file_path1)
    }
    if (data.value.file_path2) {
      formData.append('file_path2', data.value.file_path2)
    }
    if (data.value.file_path3) {
      formData.append('file_path3', data.value.file_path3)
    }
    formData.append('memo_cage_condition', data.value.memo_cage_condition)
    formData.append('memo_purpose', data.value.memo_purpose)
    formData.append('id_clinic', data.value.id_clinic)
    cageConditionStore.submitCageCondition(formData).then(() => {
      cageConditionStore.fetchCageConditions()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
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
            cageConditionStore
              .destroyCageCondition(data.value.id_cage_condition)
              .then(() => {
                cageConditionStore.fetchCageConditions()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const updateFileUploadKeys = () => {
  for (const key in fileUploadKeys.value) {
    ++fileUploadKeys.value[key]
  }
}

onMounted(async () => {
  if (props.data?.id_cage_condition) {
    // Update case
    isEdit.value = true

    await cageConditionStore.fetchCageConditionById(props.data.id_cage_condition)
    console.log(cageConditionStore.getCageCondition)
    data.value = { ...cageConditionStore.getCageCondition }
    updateFileUploadKeys()
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit" ref="myForm">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        ケージ準備
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-12">
          <MtInputForm v-if="isEdit" type="text" filled readonly v-model="data.code_cage_condition" label="ケージ準備CD"
            required :rules="[aahValidations.validationRequired]" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-lg-4 col-md-4 col-sm-12">
          <div class="text-center body1 regular text-grey-700 q-mb-md">
            ケージ画像1 *
          </div>
          <UploadFile
            accept="image/*"
            :fileUrl="data.file_path1"
            @fileUploaded="(file: File) => {data.file_path1 = file; f1_status = 'changed'}"
            @fileRemoved="() => {data.file_path1 = null; f1_status = 'removed'}"
            :key="fileUploadKeys.file1_key"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-12">
          <div class="text-center body1 regular text-grey-700 q-mb-md">
            ケージ画像2
          </div>
          <UploadFile
            accept="image/*"
            :fileUrl="data.file_path2"
            @fileUploaded="(file: File) => { data.file_path2 = file; f2_status = 'changed'} "
            @fileRemoved="() => { data.file_path2 = null; f2_status = 'removed' }"
            :key="fileUploadKeys.file2_key"
          />
        </div>  
        <div class="col-lg-4 col-md-4 col-sm-12">
          <div class="text-center body1 regular text-grey-700 q-mb-md">
            ケージ画像3
          </div>
          <UploadFile
            accept="image/*"
            :fileUrl="data.file_path3"
            @fileUploaded="(file: File) => { data.file_path3 = file; f3_status = 'changed'} "
            @fileRemoved="() => { data.file_path3 = null; f3_status = 'removed' }"
            :key="fileUploadKeys.file3_key"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm 
            type="text" 
            v-model="data.memo_cage_condition" 
            autogrow 
            autofocus
            tabindex="1"
            label="準備名・方法 *"
            required />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm 
            type="text" 
            v-model="data.memo_purpose" 
            autogrow
            label="用途・注意点等" 
            tabindex="2"
            required />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm 
            type="text" 
            v-model="data.display_order" 
            tabindex="4"
            label="表示順序（0~999; 小を上位表示）" />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated tabindex="5" color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
