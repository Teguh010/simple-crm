<script setup lang="ts">
import { dateFormat } from '@/utils/aahUtils';
import { event_bus } from '@/utils/eventBus';
import mtUtils from '@/utils/mtUtils';
import UpdateClinicalFileModal from '@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue';

const emit = defineEmits(['refresh'])
const props = defineProps({
  clinicalFileList: Array<Object>,
  requestDetailPage: Object,
  petSelected: Object
})

const onClickFileClinic = async (
  data: Object,
  i: Number,
  date_insert: string
) => {
  const video = document.getElementById(`cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  await mtUtils.popup(UpdateClinicalFileModal, {
    data,
    allData: props.clinicalFileList
  })
  event_bus.emit('reloadRight', true)
  emit('refresh')
}
</script>

<template>
  <div
    v-if="props.clinicalFileList?.length > 0"
    class="q-mb-md row c-gap"
  >
    <div
      v-for="(files, i) in props.clinicalFileList"
      @click="onClickFileClinic(files, i, dateFormat(date_insert))"
      :key="`MiddleRequestDetail-files-${i}-${files.file_path}`"
      class="col-12 image-container cursor-pointer"
    >
      <img
        v-if="files.type_file == 1 || files.type_file == 3"
        :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
        class="full-width flex column-sm box-corner"
        @error="replaceByDefaultImg"
      />
      <video
        v-else-if="files.type_file == 2"
        :id="`cli_file_video_${i}`"
        class="full-width box-corner"
        controls
      >
        <source :src="files.file_path" type="video/mp4" />
      </video>
      <img
        v-else-if="files.file_path?.includes('.pdf')"
        :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
        class="xy full-width box-corner"
      />
      <img
        v-else-if="
          files.file_path?.includes('.mp3') ||
          files.file_path?.includes('.wav')
        "
        :src="'/src/assets/img/clinicalFiles/audio.png'"
        class="xy full-width box-corner"
      />
      <img v-else :src="fileLogo" class="xy full-width box-corner" />
      <div class="date-overlay">
        {{ dateFormat(files.datetime_receive) }}
      </div>
    </div>
  </div>
</template>
<style>
.box-corner {
  border-radius: 10px;;
}
</style>