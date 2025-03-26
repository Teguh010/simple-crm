<script setup lang="ts">
import { ref, computed } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { Cropper } from 'vue-advanced-cropper';
import "vue-advanced-cropper/dist/style.css";
import { event_bus } from '@/utils/eventBus'

const emit = defineEmits(['close'])
const closeModal = () => {
  emit('close')
}

const props = defineProps({
  image: {
    type: String,
    required: true
  } ,
  extraKeys: {
    type: String,
    required: false
  },
  cropType: {
    type: String,
    required: false
  },
})

const cropperRef = ref(null)

const cropImage = () => {
  const canvas = cropperRef.value.getResult().canvas;
  if (canvas) {
    canvas.toBlob((blob) => {  
      let imageAttr = {
        blob: blob,
        image: canvas.toDataURL('image/png'), // use png to preserve transparent background
        type: props.extraKeys
      }
      event_bus.emit('cropped-image', imageAttr)
      closeModal()
    }, 'image/png');
  }  
}

const aspectRatio = computed(()=>{
  if(!Boolean(props.cropType) || props.cropType == null){
    return 1;
  }else if(props.cropType == 'landscape'){
    return 3/1;
  }else{
    return 1;
  }
})

</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      画像トリミング
    </q-toolbar-title>
  </MtModalHeader>
  <div v-if="image">
    <q-card-section class="content">
      <cropper
        ref="cropperRef"
        :src="image"
        :stencil-props="{
          aspectRatio: aspectRatio
        }"
        class="cropper"
        background-class="bg-white"
      />
    </q-card-section>
    <q-card-section class="q-bt bg-white justify-center flex">
      <q-btn label="適用" @click="cropImage" color="primary" />
    </q-card-section>
  </div>
</template>
<style lang="scss" scoped>

</style>