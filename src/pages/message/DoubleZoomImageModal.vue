<script setup lang="ts">
import { ComponentPublicInstance, Ref, onMounted, onUnmounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import SearchComparisonClinicalFileModal from '@/pages/petInfo/diagnostic/SearchComparisonClinicalFileModal.vue'
import useClinicalFilesStore from '@/stores/clinical-files';
import { ClinicalFile } from '@/types/types';
import fileLogo from '@/assets/img/clinicalFiles/file.png';

const clinicalFileStore = useClinicalFilesStore()
const closeUpdDialogFlg = ref(false)
const props = defineProps<{ files: any; index: any; singleImage?: any, currentIndex: number, comparison: string, play?: boolean }>()
let currentFile: any = null
const currentSource = ref<string>('')
const currentContentType = ref<string>('image')
const currentIndex = ref(0)
const nextIndex = ref(0)
const image1:Ref<ComponentPublicInstance | null> = ref(null)
const image2:Ref<ComponentPublicInstance | null> = ref(null)
const isZoomed = ref(false)
const transform = ref({ first: {scale: 1, x: 0, y: 0, rotate: 0, isZoomed: false}, second: {scale: 1, x: 0, y: 0, rotate: 0, isZoomed: false} })
const allFiles = ref([] as ClinicalFile[])
let lastPosition = { x: 0, y: 0 }
let dragging = { first: { isDragging: false, lastPositionX: 0, lastPositionY: 0 }, second: { isDragging: false, lastPositionX: 0, lastPositionY: 0 }}
const nextSource = ref<string>('')
const showComparison = ref(false)

const openComparisonModal = async () => {
  if (props.comparison === 'clinical_file') {
    await mtUtils.popup(SearchComparisonClinicalFileModal, {})
    if (clinicalFileStore.getSelectedClinicalFileComparison.length > 0) {
      allFiles.value = clinicalFileStore.getSelectedClinicalFileComparison
      console.log(allFiles.value)

      nextIndex.value = 0
      nextSource.value = allFiles.value?.[0]

      showComparison.value = true
    }
  } else {
    toggleComparison()
  }
}
const toggleComparison = () => showComparison.value = !showComparison.value
function clickNext() {
  nextSource.value = ''

  if (nextIndex.value != allFiles.value.length - 1) ++nextIndex.value
  else nextIndex.value = 0

  if (nextIndex.value === allFiles.value.length) nextIndex.value = 0

  nextSource.value = allFiles.value[nextIndex.value]
  transform.value.second = { scale: 1, x: 0, y: 0, rotate: 0, isZoomed: false }
  dragging.second = { isDragging: false, lastPositionX: 0, lastPositionY: 0 }
  applyTransform(2)
  updateCursor(2)
}

function clickPrev() {
  nextSource.value = ''

  if (nextIndex.value != 0) --nextIndex.value
  else nextIndex.value = allFiles.value.length - 1

  if (nextIndex.value < 0) nextIndex.value = allFiles.value.length - 1

  nextSource.value = allFiles.value[nextIndex.value]
  transform.value.second = { scale: 1, x: 0, y: 0, rotate: 0, isZoomed: false }
  dragging.second = { isDragging: false, lastPositionX: 0, lastPositionY: 0 }
  applyTransform(2)
  updateCursor(2)
}

async function fetchImage() {
  await mtUtils.loadImage('/api/Common/GetImage', { id_file: currentFile })
    .then(imageLoadedComplete)
}

async function imageLoadedComplete(loadedImage: any) {
  currentSource.value = loadedImage
  allFiles.value[currentIndex.value].imageDataPath = loadedImage
}

async function close() {
  closeUpdDialogFlg.value = true
}

const handleTouchStart = (event:TouchEvent, imgRefNumber: number) => {
  if (event.touches.length === 1) {
    startDrag(event.touches[0], imgRefNumber)
    event.preventDefault()
  }
}

const handleMouseDown = (event:MouseEvent, imgRefNumber: number) => {
  startDrag(event, imgRefNumber)
  event.preventDefault()
}

const startDrag = ({ clientX, clientY } :{
  clientX: number
  clientY: number
}, imgRefNumber: number) => {
  if (imgRefNumber == 1) {
    dragging.first.isDragging = true
    dragging.first.lastPositionX = clientX
    dragging.first.lastPositionY = clientY
  } else {
    dragging.second.isDragging = true
    dragging.second.lastPositionX = clientX
    dragging.second.lastPositionY = clientY
  }
  updateCursor(imgRefNumber)
}

const handleMove = (event:TouchEvent | MouseEvent, imgRefNumber: number) => {
  if (imgRefNumber == 1) {
    if (dragging.first.isDragging && transform.value.first.isZoomed) {
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      const deltaX = clientX - dragging.first.lastPositionX
      const deltaY = clientY - dragging.first.lastPositionY

      transform.value.first.x += deltaX
      transform.value.first.y += deltaY

      applyTransform(imgRefNumber)

      dragging.first.lastPositionX = clientX
      dragging.first.lastPositionY = clientY
    }
  } else {
    if (dragging.second.isDragging && transform.value.second.isZoomed) {
      const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
      const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
      const deltaX = clientX - dragging.second.lastPositionX
      const deltaY = clientY - dragging.second.lastPositionY

      transform.value.second.x += deltaX
      transform.value.second.y += deltaY

      applyTransform(imgRefNumber)

      dragging.second.lastPositionX = clientX
      dragging.second.lastPositionY = clientY
    }
  }
}

const handleEnd = (imgRefNumber: number) => {
if (imgRefNumber == 1) {
  dragging.first.isDragging = false
} else {
  dragging.second.isDragging = false
}
  updateCursor(imgRefNumber)
}

const rotateRight = (imgRefNumber: number) => {
  // Increase the rotation angle by 90 degrees
  if (imgRefNumber == 1) {
    transform.value.first.rotate = (transform.value.first.rotate - 90) % 360
  } else {
    transform.value.second.rotate = (transform.value.second.rotate - 90) % 360
  }

  applyTransform(imgRefNumber)
}

const applyTransform = (imgRefNumber: number) => {
  if (imgRefNumber == 1) {
    const img = image1.value?.$el.querySelector('img')
    img.style.transform = `translate(${transform.value.first.x}px, ${transform.value.first.y}px) scale(${transform.value.first.scale})  rotate(${transform.value.first.rotate}deg)`
  } else {
    const img = image2.value?.$el.querySelector('img')
    img.style.transform = `translate(${transform.value.second.x}px, ${transform.value.second.y}px) scale(${transform.value.second.scale})  rotate(${transform.value.second.rotate}deg)`
  }
}

const toggleZoom = (imgRefNumber: number) => {
  if (imgRefNumber == 1) {
    transform.value.first.isZoomed = !transform.value.first.isZoomed
    const img = image1.value?.$el.querySelector('img')
    if (transform.value.first.isZoomed) {
      transform.value.first.scale = 1.5
      transform.value.first.x = -(img?.clientWidth * (transform.value.first.scale - 1) / 2)
      transform.value.first.y = -(img?.clientHeight * (transform.value.first.scale - 1) / 2)
    } else {
      transform.value.first = { scale: 1, x: 0, y: 0, rotate: 0, isZoomed: false }
    }
  } else {
    transform.value.second.isZoomed = !transform.value.second.isZoomed
    const img = image2.value?.$el.querySelector('img')
    if (transform.value.second.isZoomed) {
      transform.value.second.scale = 1.5
      transform.value.second.x = -(img?.clientWidth * (transform.value.second.scale - 1) / 2)
      transform.value.second.y = -(img?.clientHeight * (transform.value.second.scale - 1) / 2)
    } else {
      transform.value.second = { scale: 1, x: 0, y: 0, rotate: 0, isZoomed: false }
    }
  }
  
  applyTransform(imgRefNumber)
  updateCursor(imgRefNumber)
}

const updateCursor = (imgRefNumber: number) => {
  if (imgRefNumber == 1) {
    const img = image1.value?.$el.querySelector('img')
    if (transform.value.first.isZoomed) img.style.cursor = dragging ? 'grabbing' : 'grab'
    else img.style.cursor = 'zoom-in'
  } else {
    const img = image2.value?.$el.querySelector('img')
    if (transform.value.second.isZoomed) img.style.cursor = dragging ? 'grabbing' : 'grab'
    else img.style.cursor = 'zoom-in'
  }
}

const keydownHandler = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowLeft': 
      clickPrev(); 
      break;
    case 'ArrowRight': 
      clickNext(); 
      break;
    default: 
      return;
  }
};

const firstVideo = ref<HTMLVideoElement | null>(null)

onMounted(() => {
  currentIndex.value = props.currentIndex
  currentSource.value = props.files[currentIndex.value]
  nextIndex.value = props.currentIndex + 1
  nextSource.value = props.files[nextIndex.value]
  allFiles.value = [...props.files]

  window.addEventListener('keydown', keydownHandler)
  
  setTimeout(() => {
    if(props.play && firstVideo.value) {
        firstVideo.value.play()
      }
  }, 1000)
})

onUnmounted(() => {
  window.removeEventListener('keydown', keydownHandler);
})
</script>

<template>
  <div class="imageBox" v-close-popup="closeUpdDialogFlg">
    <q-btn @click="close" flat round dense icon="close" class="btn close" />
    <q-btn @click="openComparisonModal" flat dense class="btn toggle-comparison">
      {{ showComparison ? '比較モードオン' : '比較モードオフ' }}
    </q-btn>
    <q-btn v-if="showComparison" @click="rotateRight(1)" flat dense class="btn rotate-left">
      <q-icon name="rotate_left" />
    </q-btn>
    <q-btn @click="rotateRight(showComparison ? 2 : 1)" flat dense class="btn rotate-right">
      <q-icon name="rotate_left" />
    </q-btn>
    <q-btn
      v-if="showComparison"
      @click.stop="clickPrev"
      flat
      round
      dense
      icon="chevron_left"
      class="btn prev"
    />
    <q-btn
      v-if="showComparison"
      @click.stop="clickNext"
      flat
      round
      dense
      icon="chevron_right"
      class="btn next"
    />
    <div class="row">
      <div class="col">
        <template v-if="currentSource.type_file == 1">
          <q-img
            :src="currentSource.file_path"
            fit="contain"
            sizes="(max-width: 400px) 400w,
                    (min-width: 400px) and (max-width: 800px) 800w,
                    (min-width: 800px) and (max-width: 1200px) 1200w,
                    (min-width: 1200px) 1600w"
            class="modal-image"
            ref="image1"
            @mousedown="handleMouseDown($event, 1)"
            @touchstart="handleTouchStart($event, 1)"
            @mousemove="handleMove($event, 1)"
            @touchmove="handleMove($event, 1)"
            @mouseup="handleEnd(1)"
            @touchend="handleEnd(1)"
            @dblclick="toggleZoom(1)"
          />
        </template>
        <div v-else-if="currentSource.type_file == 2" class="text-center full-height">
          <video
            :id="`cli_file_video_current`"
            style="max-width: 100%; height: 94vh;"
            controls
            playsinline
            muted
            ref="firstVideo"
          >
            <source :src="currentSource.file_path" type="video/mp4" />
          </video>
        </div>
        <img
          v-else-if="currentSource.file_path?.includes('.pdf')"
          loading="lazy"
          :src="currentSource.thumbnail_path"
          class="xy thumbnail-style"
        />
        <img
          v-else-if="currentSource.type_file == 3"
          loading="lazy"
          :src="currentSource.thumbnail_path"
          class="thumbnail-style"
          @error="replaceByDefaultImg"
        />
        <img
          v-else-if="
            currentSource.file_path?.includes('.mp3') ||
            currentSource.file_path?.includes('.wav')
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
      </div>
      <div v-if="showComparison" class="col-6">
        <template v-if="nextSource.type_file == 1">
          <q-img
            :src="nextSource.file_path"
            fit="contain"
            sizes="(max-width: 400px) 400w,
                    (min-width: 400px) and (max-width: 800px) 800w,
                    (min-width: 800px) and (max-width: 1200px) 1200w,
                    (min-width: 1200px) 1600w"
            class="modal-image"
            ref="image2"
            @mousedown="handleMouseDown($event, 2)"
            @touchstart="handleTouchStart($event, 2)"
            @mousemove="handleMove($event, 2)"
            @touchmove="handleMove($event, 2)"
            @mouseup="handleEnd(2)"
            @touchend="handleEnd(2)"
            @dblclick="toggleZoom(2)"
          />
        </template>
        <div v-else-if="nextSource.type_file == 2" class="text-center full-height">
          <video
            :id="`cli_file_video_next`"
            style="max-width: 100%; height: 94vh;"
            controls
            playsinline
            muted
          >
            <source :src="nextSource.file_path" type="video/mp4" />
          </video>
        </div>
        <img
          v-else-if="nextSource.file_path?.includes('.pdf')"
          loading="lazy"
          :src="nextSource.thumbnail_path"
          class="xy thumbnail-style"
        />
        <img
          v-else-if="nextSource.type_file == 3"
          loading="lazy"
          :src="nextSource.thumbnail_path"
          class="thumbnail-style"
          @error="replaceByDefaultImg"
        />
        <img
          v-else-if="
            nextSource.file_path?.includes('.mp3') ||
            nextSource.file_path?.includes('.wav')
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
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.imageBox {
  margin-top: 1px;
  height: 94vh;
}
.modal-image {
  width: 90%;
  height: 94vh;
  margin: 0px 5% 0px 5%;
  transition: transform 0.3s ease;
  cursor: zoom-in;
}
.btn {
  position: absolute;
  color: white;
}
.close {
  right: 2%;
  top: 3%;
  z-index: 1000;
}
.toggle-comparison {
  right: 5%;
  top: 3%;
  z-index: 1000;
}
.rotate-right {
  right: 15%;
  top: 3%;
  z-index: 1000;
}
.rotate-left {
  right: 55%;
  top: 3%;
  z-index: 1000;
}
.next {
  right: 1%;
  top: 50%;
  z-index: 1000;
}
.prev {
  left: 50%;
  top: 50%;
  z-index: 1000;
}
</style>
