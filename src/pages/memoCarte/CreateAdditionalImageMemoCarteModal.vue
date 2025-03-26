<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { storeToRefs } from 'pinia';
import useFabricStore from '@/stores/fabrics';

const props = defineProps({additional_image: Array})
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }

const fabricStore = useFabricStore()

const useTemplate = (additional) => {
  fabricStore.setAdditionalMemoCarte(additional)
  closeModal()
}
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      Template
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-py-md q-px-xl">
    <div>
      <div class="row items-start q-col-gutter-md">
        <div v-for="template in props.additional_image" @click="useTemplate(template)" class="col-4 cursor-pointer">
          <q-card>
            <q-img :src="template.file_url">
              <div class="absolute-bottom text-subtitle2 text-center">
                {{ template.id_object }}
              </div>
            </q-img>
          </q-card>
        </div>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
    </div>
  </q-card-section>
</template>