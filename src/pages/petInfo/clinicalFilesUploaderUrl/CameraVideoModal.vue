<script setup lang="ts">
import { onMounted, ref} from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import useClinicalFilesStore from '@/stores/clinical-files'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'

const emits = defineEmits(['close'])
const props = defineProps({
  pet_illness_history:Object,
  id_clinic: String,
  petSelected: Object,
  modalClosedCallback: Function
})

const clinicalFilesStore = useClinicalFilesStore()

const isCameraOpen = ref(false)
const isPhotoTaken = ref(false)
const isShotPhoto = ref(false)
const isLoading = ref(false)
const link = ref('#')
const camera = ref(null)
const canvas = ref(null)
const isRecording = ref(false);
// let mediaRecorder = null;
// let recordedChunks = [];
const mediaRecorder = ref(null);
const recordedChunks = ref([]);
const showRecording = ref(false);
const recordedVideoUrl = ref("");
const recordedVideoBlob = ref(null);
const facingMode = ref("environment");

const closeModal = () => {
  console.log("------------ closeModal ------------");
  stopCameraStream()
  stopRecording()
  emits('close');
}

function toggleCamera() {
  if(isCameraOpen.value) {
    isCameraOpen.value = false;
    isPhotoTaken.value = false;
    isShotPhoto.value = false;
    stopCameraStream();
  } else {
    isCameraOpen.value = true;
    createCameraElement();
  }
}
   
function switchCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  createCameraElement();
}

function createCameraElement() {
  isLoading.value = true;
  showRecording.value = false;
  
  // const constraints = (window.constraints = {
  //   audio: false,
  //   video: true
  // });
  const constraints = {
    audio: false,
    video: { facingMode: facingMode.value }
  }

  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    isLoading.value = false;
    camera.value.srcObject = stream;
  }).catch(error => {
    isLoading.value = false;
    alert("ERR : ブラウザ・カメラ設定によるエラーで処理を継続できません。");
  });
}
    
function stopCameraStream() {
  try{
    let tracks = camera.value.srcObject.getTracks();
    tracks.forEach(track => {
      track.stop();
    });
  }catch(error){
  }
}
    
function takePhoto() {
  if(!isPhotoTaken) {
    isShotPhoto.value = true;

    const FLASH_TIMEOUT = 50;

    setTimeout(() => {
      isShotPhoto.value = false;
    }, FLASH_TIMEOUT);
  }
  
  const video_ = camera.value;
  const canvas_ = canvas.value;
  canvas_.width = video_.videoWidth;
  canvas_.height = video_.videoHeight;

  isPhotoTaken.value = !isPhotoTaken.value;
  const context = canvas.value.getContext('2d');
  // context.drawImage(camera.value, 0, 0, 450, 337.5);
  context.drawImage(video_, 0, 0, video_.videoWidth, video_.videoHeight);
}
    
function downloadImage() {
  const download = document.getElementById("downloadPhoto");
  const canvas_ = document.getElementById("photoTaken").toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
  download.setAttribute("href", canvas_);
  download?.click()
}

function submit(){
  const currentDateTime = formatDateWithTime(getDateToday(),'YYYY/MM/DD HH:mm:ss')
  const filename = `${props.petSelected.id_customer}_${currentDateTime}`
  const data = {
    id_customer: props.petSelected.id_customer,
    id_pet: props.petSelected.id_pet,
    name_pet: props.petSelected.name_pet,
    id_clinic: props.id_clinic,
    id_pet_illness_history: props.pet_illness_history.id_pet_illness_history,
    name_file: isPhotoTaken.value ? filename + '.jpg' : filename + '.mp4',
    file_path: null,
    type_file: 1,
    memo_file_storage: "カメラから撮影",
    name_supplier_other: '',
    datetime_receive: currentDateTime,
    type_receive_format: 1,
    type_diagnostic_info: 2,
  }
  if(isPhotoTaken.value) {
    document.getElementById("photoTaken").toBlob(function(blob) {
      data.file_path = blob
      data.type_file = 1
      clinicalFilesStore.submitClinicalFile(data).then(() => {
        clinicalFilesStore.fetchClinicalFiles({
          id_pet: data.id_pet
        })
        props.modalClosedCallback(clinicalFilesStore.recentClinicalFile.data)
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
    })
  }else{
    data.file_path = recordedVideoBlob.value
    data.type_file = 2
    clinicalFilesStore.submitClinicalFile(data).then(() => {
      clinicalFilesStore.fetchClinicalFiles({
        id_pet: data.id_pet
      })
      props.modalClosedCallback(clinicalFilesStore.recentClinicalFile.data)
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}


function startRecording() {
  const stream = camera.value.srcObject;
  const options = { mimeType: 'video/webm;codecs=vp9,opus' };
  mediaRecorder.value = new MediaRecorder(stream,options);
  
  mediaRecorder.value.ondataavailable = function(event) {
    if (event.data.size > 0) {
      recordedChunks.value.push(event.data);
    }
  };
  
  mediaRecorder.value.onstop = function() {
    const blob = new Blob(recordedChunks.value, { type: 'video/webm;codecs=vp9,opus' });
    const url = URL.createObjectURL(blob);
    recordedVideoBlob.value = blob;
    recordedVideoUrl.value = url;
    
    const videoElement = document.createElement('video');
    videoElement.id = 'recordedVideo'
    videoElement.style = "width: 100%; height: 100%;"
    videoElement.controls = true; // Show video controls
    videoElement.src = recordedVideoUrl.value;

    const videoContainer = document.getElementById('videoContainer')
    const btnEle = videoContainer.getElementsByTagName('button')[0]

    videoContainer.insertBefore(videoElement, btnEle);


    // Do something with the recorded video URL, like display it or upload it
    recordedChunks.value = [];
  };
  
  mediaRecorder.value.start();
  isRecording.value = true;
}

function stopRecording() {
  if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
    mediaRecorder.value.stop();
    isRecording.value = false;
    showRecording.value = true;
  }
  stopCameraStream()

}

function discordRecordedVideo(){
  mediaRecorder.value = null;
  recordedChunks.value = [];
  showRecording.value = false;
  recordedVideoUrl.value = '';
  recordedVideoBlob.value = null;
  isCameraOpen.value = false;
  isPhotoTaken.value = false;
  isShotPhoto.value = false;
  stopCameraStream();
  if(document.getElementById('recordedVideo')){
    document.getElementById('recordedVideo')?.remove()
  }
}

onMounted(() => {
 
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      画像・動画の撮影
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section :class="{ 'content': isCameraOpen}" >
    <div class="flex justify-center">
      <div id="app" class="web-camera-container" v-if="!showRecording">
        <div v-if="isCameraOpen" v-show="!isLoading" class="camera-box" :class="{ 'flash' : isShotPhoto }">
          <div class="camera-shutter" :class="{'flash' : isShotPhoto}"></div>
          <video v-show="!isPhotoTaken" ref="camera" :style="{width: '100%', height: '100%', objectFit: 'cover'}" autoplay></video>
          <canvas v-show="isPhotoTaken" id="photoTaken" ref="canvas" :style="{width: '100%', height: '100%', objectFit: 'cover'}"></canvas>
        </div>        
        <div class="flex justify-center items-center">
          <div v-if="!isCameraOpen" class="camera-button q-ml-md q-mt-sm">
            <button
              type="button" 
              class="button is-rounded q-mt-lg" 
              :class="{ 'primary' : !isCameraOpen}" 
              @click="toggleCamera"
              :disabled="isRecording"
            >
              <span >カメラ起動</span>
            </button>
          </div>          
          <span v-show="isCameraOpen && isLoading" class="col camera-loading">
            <ul class="loader-circle">
              <li></li>
              <li></li>
              <li></li>
            </ul>
          </span>
        </div>
      </div>
      <div
        v-if="showRecording"
        style="height: calc(100vh - 300px);"
        :style="{width: '100%', objectFit: 'cover' }"
        id="videoContainer"
      >
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white row justify-center gap-5">
    <q-btn
          v-if="showRecording"
          label="削除する"
          @click="discordRecordedVideo"
        />
    <div v-if="isCameraOpen && !isLoading && !showRecording" class="camera-shoot row">
      <button 
              type="button" 
              class="is-rounded is-danger" 
              @click="toggleCamera"
              :disabled="isRecording"
          
            >
            <q-icon name="highlight_off" size="30px" />
          </button>
            <button type="button" class="button q-ml-md" @click="takePhoto" :disabled="isRecording">
              <q-icon name="photo_camera" size="30px"></q-icon>
            </button>
            <q-btn
              class="q-ml-md"
              label="録画 開始"
              @click="startRecording"
              :disabled="isRecording || isPhotoTaken"
            />
            <q-btn
              class="q-ml-md"
              label="録画 終了"
              @click="stopRecording"
              :disabled="!isRecording"
            />
            <q-btn
              class="q-ml-md"
              color="primary"
              text-color="white"        
              @click.stop="switchCamera()"
              :disabled="isRecording || isPhotoTaken"
            >
              <q-icon name="flip_camera_android" size="32px" />
            </q-btn>
          </div>
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn 
        unelevated 
        color="primary" 
        class="q-ml-md" 
        @click="submit"
        :disable="!((isPhotoTaken || showRecording) && isCameraOpen)"
      >
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>


<style scoped lang="scss">

body {
  display: flex;
  justify-content: center;
}

.is-rounded{
  border-radius: 290486px;
  padding: 1em;
}

.is-danger{
  background-color: #ff3860;
  border-color: transparent;
  color: #fff;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.web-camera-container {
  // margin-top: 2rem;
  // margin-bottom: 2rem;
  // padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  height: fit-content;
  
  .camera-button {
    margin-bottom: 2rem;
  }
  
  .camera-box {   
    width: 100%;
    height: calc(100vh - 300px);
    position: relative;
    .camera-shutter {
      opacity: 0;
      // width: 700px;
      // height: 530px;
      width: 100%;
      height: 100%;
      inset: 0;
      background-color: #fff;
      position: absolute;
      
      &.flash {
        opacity: 1;
      }
    }
  }
  
  .camera-shoot {
    margin: 1rem 0;
    
    button {
      height: 60px;
      width: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 100%;
      
      img {
        height: 35px;
        object-fit: cover;
      }
    }
  }
  
  .camera-loading {
    overflow: hidden;
    height: 100%;
    position: absolute;
    width: 100%;
    min-height: 150px;
    margin: 3rem 0 0 -1.2rem;
    
    ul {
      height: 100%;
      position: absolute;
      width: 100%;
      z-index: 999999;
      margin: 0;
    }
    
    .loader-circle {
      display: block;
      height: 14px;
      margin: 0 auto;
      top: 50%;
      left: 100%;
      transform: translateY(-50%);
      transform: translateX(-50%);
      position: absolute;
      width: 100%;
      padding: 0;
      
      li {
        display: block;
        float: left;
        width: 10px;
        height: 10px;
        line-height: 10px;
        padding: 0;
        position: relative;
        margin: 0 0 0 4px;
        background: #999;
        animation: preload 1s infinite;
        top: -50%;
        border-radius: 100%;
        
        &:nth-child(2) {
          animation-delay: .2s;
        }
        
        &:nth-child(3) {
          animation-delay: .4s;
        }
      }
    }
  }

  @keyframes preload {
    0% {
      opacity: 1
    }
    50% {
      opacity: .4
    }
    100% {
      opacity: 1
    }
  }
}


#videoContainer{
  text-align: center;
  justify-content: center;
}

#recordedVideo{
  width: 100%;
  height: 100%;
}

canvas{
  box-shadow: none;
  -webkit-box-shadow: none
}
.canvas-container{
  box-shadow: none;
  -webkit-box-shadow: none
}
button{
  cursor: pointer;
}

</style>
