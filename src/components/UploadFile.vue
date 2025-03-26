<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { imageResize } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'

const emits = defineEmits(['fileUploaded', 'fileRemoved'])

const maxFileSizeinMb = 10 * 1024 * 1024

interface fileProps {
  multiple: boolean
  accept: string
  maxFiles: number
  rules: Array<any>
  autofocus: boolean
  clearable: boolean
  loading: boolean
  maxFileSize: number
  fileUrl: string | Blob
}

const props = withDefaults(defineProps<fileProps>(), {
  multiple: false,
  accept: 'image/*,.pdf',
  maxFiles: 1,
  rules: [],
  autofocus: false,
  clearable: false,
  loading: false,
  maxFileSize: maxFileSizeinMb,
  fileUrl: ''
})

const qFilePicker = ref()
const modelValue = ref()
const filePath = ref<string | null>(null), fileName = ref<string>('')

const handleFileUpload = async (file: File) => {
  if (file.type.startsWith('image/')) {
    const i = await getResizedImage(file)
    filePath.value = URL.createObjectURL(i)
    filePath.value += '#type=.img'
  } else {
    filePath.value = URL.createObjectURL(file)
    filePath.value += '#type=.pdf'
  }
  fileName.value = file.name
  emits('fileUploaded', file)
}

type rejectType = {
  failedPropValidation: string,
  file: File
}
const handleUploadReject = (reject: rejectType[]) => {
   const alertMessage:string = reject[0].failedPropValidation 
   mtUtils.alert(alertMessage)
}

const removeFile = () => {
  filePath.value = null
  emits('fileRemoved')
}

const getResizedImage = (file: any) => {
  return Promise.resolve(imageResize(file))
}

const getFileName = (filePath: string): string => {
  let fileName:string = filePath.split('/')
  fileName = fileName[fileName.length - 1]
  if(fileName.includes('?')) fileName = fileName.split('?')[0]
  return fileName
}

onMounted(() => {
  if(props.fileUrl) {
    filePath.value = props.fileUrl
    fileName.value = getFileName(props.fileUrl)
  }
})
</script>

<template>
   <div>
      <template v-if="!filePath">
        <q-file
          v-model="modelValue"
          :multiple="multiple"
          :accept="accept"
          :max-files="maxFiles"
          :autofocus="autofocus"
          :clearable="clearable"
          :loading="loading"
          :max-file-size="maxFileSize"
          ref="qFilePicker"
          @update:model-value="handleFileUpload"
          @rejected="handleUploadReject"
          class="qFilePicker"
        >
          <template v-slot:default>
            <q-responsive :ratio="4/3" class="full-width">
              <q-btn
                unelevated
                color="grey-300"
                text-color="grey-800"
                class="full-width q-pa-xl"
                @click="$refs.qFilePicker.pickFiles()"
                style="width: 100%"
              >
                <q-icon size="60px" name="add" />
              </q-btn>
            </q-responsive>
          </template>
        </q-file>
      </template>
      <template v-else>
        <div
          class="relative-position text-center"
          style="width: 100%; height: 100%"
        >
          <q-img
            v-if="!filePath.includes('.pdf')"
            :src="filePath"
            spinner-color="white"
            class="full-width full-height"
            :style="{ backgroundColor: 'gray' }"
            :ratio="4/3"
            :fit="'cover'"
          />
          <template v-else>
            <q-icon
              name="receipt_long"
              size="20px"
              color="red-10"
              class="q-mr-sm"
           />
           {{fileName}}
           </template>
           <q-badge
             color="red"
             floating
             transparent
             class="cursor-pointer"
             @click="removeFile"
            >  
              <q-icon name="close" />
            </q-badge>
          </div>
      </template>
   </div>
</template>
<style lang="scss" scoped>
.qFilePicker {
   :deep(.q-field__native) {
     display: none;
   } 
}
</style>