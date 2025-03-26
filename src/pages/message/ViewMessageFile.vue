<script setup lang="ts">
import { withDefaults } from 'vue'
import { aahUtilsGetEmployeeName, formatDateWithTime } from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import useEmployeeStore from '@/stores/employees'
import useMessageStore from '@/stores/message-clinic'
import {
  FileType,
  MessageAttributeListType,
  MessageThreadType
} from '@/types/types'

type PropsDataType = {
  type_department: number
  typeMessage: number
  messageTextarea: string
  id_file: null
  id_employee: string
  name_employee: string
  id_employee_insert: string
  filedata: []
}

const employeeStore = useEmployeeStore()
const messageStore = useMessageStore()
const { getThreadFiles, getMessages } = storeToRefs(messageStore)

const props = withDefaults(
  defineProps<{
    allTypeThreads: MessageThreadType[]
    data: PropsDataType
    messageAttributeList: MessageAttributeListType[]
    employeeId: string
  }>(),
  {}
)

const emits = defineEmits<{
  (
    e: 'openImageViewModal',
    path: FileType[] | string,
    index: number,
    singleImage: boolean
  ): void
}>()

const openImageViewModal = (
  path: FileType[] | string,
  index: number,
  singleImage: boolean
) => {
  emits('openImageViewModal', path, index, singleImage)
}

const handleEmpName = (empId: string) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}
</script>

<template>
  <div class="classify" v-if="getThreadFiles && props.data.typeMessage === 2">
    <div
      v-for="(image, indx) in getThreadFiles"
      :key="indx"
      class="imagesFiles"
      @click="openImageViewModal(getThreadFiles, indx, false)"
    >
      <q-img
        v-if="!image?.content_type.includes('video')"
        :src="image?.thumbnail_url"
        alt=""
        :ratio="16 / 9"
      />
      <div v-else class="video-size">
        <q-icon name="play_circle_filled" class="play-button" />
        <video style="" class="video-content">
          <source :src="image?.file_url" type="video/mp4" />
        </video>
      </div>
      <span class="messageName">{{
        image?.id_employee_insert === props.employeeId
          ? formatDateWithTime(image?.datetime_insert)
          : image?.datetime_insert < 1 &&
            image?.id_employee_insert === props.employeeId
          ? handleEmpName(image?.id_employee_insert)
          : image?.id_employee_insert !== props.employeeId
          ? formatDateWithTime(image?.datetime_insert)
          : image?.datetime_insert < 1 &&
            image?.id_employee_insert !== props.employeeId
          ? handleEmpName(image?.id_employee_insert)
          : ''
      }}</span>
    </div>
  </div>
  <div
    class="column full-width flex-center logoComponent"
    v-if="
      getMessages.length > 0 &&
      getThreadFiles.length < 1 &&
      props.allTypeThreads?.length &&
      props.data.typeMessage === 2
    "
  >
    <!-- <img src="@/assets/img/login/aah_logo.svg" alt="logo" class="logoImage" /> -->
    {{ 'メッセージを投稿しましょう！' }}
  </div>
</template>
<style lang="scss" scoped>
.messageName {
  width: 100px;
  padding: 3px;
  margin-left: -110px;
  font-size: 12px;
  color: white;
  margin-top: auto;
  margin-bottom: 7px;
  z-index: 100;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.614);
}
.classify {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 15px;
  border-radius: 12px;
}
.imagesFiles {
  display: flex;
  width: 100%;
  margin-bottom: 15px;
  border-radius: 12px;
  background-color: transparent !important;
  overflow: hidden;
  cursor: pointer;
}
.logoComponent {
  margin-top: 5%;
}
.logoImage {
  width: 224px;
  height: 39px;
}
.video-size {
  width: 360px;
  height: 220px;
  border-radius: 5px;
  position: relative;
  .play-button {
    position: absolute;
    width: 100%;
    height: 100%;
    font-size: 60px;
    color: white;
    margin-top: auto;
    z-index: 100;
    border-radius: 5px;
    background-color: rgba(0, 0, 0, 0.614);
  }
  .video-content {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  @media screen and (max-width: 375px) {
    width: 300px;
  }
}
@media screen and (min-width: 2700px) {
  .classify {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr;
  }
}
@media screen and (min-width: 2100px) {
  .classify {
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  }
}
@media screen and (max-width: 1399px) {
  .classify {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
@media screen and (max-width: 999px) {
  .classify {
    grid-template-columns: 1fr 1fr;
  }
  .messageName {
    width: 70px;
    margin-left: -90px;
  }
}
@media screen and (max-width: 450px) {
  .classify {
    grid-template-columns: 1fr;
  }
}
</style>
