<script setup lang="ts">
import { ComponentPublicInstance, Ref, onMounted, onUnmounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'

const closeUpdDialogFlg = ref(false)
const props = defineProps<{ files: any; index?: any; singleImage?: any }>()
let currentFile: any = null
const currentSource = ref<string>('')
const currentContentType = ref<string>('image')
let currentIndex = ref(0)
const image:Ref<ComponentPublicInstance | null> = ref(null)
const isZoomed = ref(false)
const transform = ref({ scale: 1, x: 0, y: 0 })
let lastPosition = { x: 0, y: 0 }
let dragging = false

function init() {
  getCurrentFile()
}

function clickNext() {
  if (currentIndex.value <= props.files.length - 2) {
    ++currentIndex.value
  } else {
    currentIndex.value = 0
  }
  init()
}

function clickPrev() {
  if (currentIndex.value > 0) {
    --currentIndex.value
  } else {
    currentIndex.value = props.files.length - 1
  }
  init()
}

async function getCurrentFile() {
  currentContentType.value = ''
  currentSource.value = ''

  currentFile = props.singleImage ? props.files : props.files[currentIndex.value]?.file_url
  currentContentType.value = props.singleImage ? 'image' : props.files[currentIndex.value]?.content_type
  if (!currentFile) {
    await fetchImage()
  } else {
    currentSource.value = currentFile
  }
}

async function fetchImage() {
  await mtUtils.loadImage('/api/Common/GetImage', { id_file: currentFile })
    .then(imageLoadedComplete)
}

async function imageLoadedComplete(loadedImage: any) {
  currentSource.value = loadedImage
  props.files[currentIndex.value].imageDataPath = loadedImage
}

async function close() {
  closeUpdDialogFlg.value = true
}

const handleTouchStart = (event:TouchEvent) => {
  if (event.touches.length === 1) {
    startDrag(event.touches[0])
    event.preventDefault()
  }
}

const handleMouseDown = (event:MouseEvent) => {
  startDrag(event)
  event.preventDefault()
}

const startDrag = ({ clientX, clientY } :{
  clientX: number
  clientY: number
}) => {
  dragging = true
  lastPosition.x = clientX
  lastPosition.y = clientY
  updateCursor()
}

const handleMove = (event:TouchEvent | MouseEvent) => {
  if (dragging && isZoomed.value) {
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const deltaX = clientX - lastPosition.x
    const deltaY = clientY - lastPosition.y

    transform.value.x += deltaX
    transform.value.y += deltaY
    applyTransform()

    lastPosition.x = clientX
    lastPosition.y = clientY
  }
}

const handleEnd = () => {
  dragging = false
  updateCursor()
}

const applyTransform = () => {
  const img = image.value?.$el.querySelector('img')
  img.style.transform = `translate(${transform.value.x}px, ${transform.value.y}px) scale(${transform.value.scale})`
}

const toggleZoom = () => {
  isZoomed.value = !isZoomed.value
  if (isZoomed.value) {
    transform.value.scale = 1.5
    transform.value.x = -(image?.value?.$el.clientWidth * (transform.value.scale - 1) / 2)
    transform.value.y = -(image?.value?.$el.clientHeight * (transform.value.scale - 1) / 2)
  } else {
    transform.value = { scale: 1, x: 0, y: 0 }
  }
  applyTransform()
  updateCursor()
}

const updateCursor = () => {
  const img = image.value!.$el.querySelector('img')
  if (isZoomed.value) {
    img.style.cursor = dragging ? 'grabbing' : 'grab'
  } else {
    img.style.cursor = 'zoom-in'
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

onMounted(() => {
  currentIndex.value = props.index
  init()
  window.addEventListener('keydown', keydownHandler);
})

onUnmounted(() => {
  window.removeEventListener('keydown', keydownHandler);
})
</script>

<template>
  <div class="imageBox" v-close-popup="closeUpdDialogFlg">
    <q-btn @click="close" flat round dense icon="close" class="btn close" />
    <q-btn
      v-if="!props.singleImage"
      @click="clickPrev"
      flat
      round
      dense
      icon="chevron_left"
      class="btn prev"
    />
    <q-btn
      v-if="!props.singleImage"
      @click="clickNext"
      flat
      round
      dense
      icon="chevron_right"
      class="btn next"

    />
    <video
      v-if="false"
      style=""
      controls
      class="modal-image"
    >
      <source :src="currentSource" type="video/mp4" />
    </video>
    <q-img
      :src="currentSource"
      fit="contain"
      sizes="(max-width: 400px) 400w,
              (min-width: 400px) and (max-width: 800px) 800w,
              (min-width: 800px) and (max-width: 1200px) 1200w,
              (min-width: 1200px) 1600w"
      class="modal-image"
      ref="image"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
      @mousemove="handleMove"
      @touchmove="handleMove"
      @mouseup="handleEnd"
      @touchend="handleEnd"
      @dblclick="toggleZoom"
    />
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
  top: 5%;
  z-index: 1000;
}
.next {
  right: 2%;
  top: 50%;
  z-index: 1000;
}
.prev {
  left: 2%;
  top: 50%;
  z-index: 1000;
}
</style>
