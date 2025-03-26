<script setup lang="ts">
import { onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import { event_bus } from '@/utils/eventBus'
import mtUtils from '@/utils/mtUtils'
import FabricMemoCarteModal from './FabricMemoCarteModal.vue'
import { CustomerType, PetType } from '@/types/types'
import useIllnessHistoryStore from '@/stores/illness-history'

const illnessHistoryStore = useIllnessHistoryStore()

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}
const props = withDefaults(
  defineProps<{
    isDirectSubmit: boolean
    customerSelected: CustomerType
    petSelected?: PetType
  }>(),
  {
    isDirectSubmit: false,
    customerSelected: () => {
      return {} as CustomerType
    },
    petSelected: () => {
      return {} as PetType
    }
  }
)

const templateStore = useTextTemplateStore()
const { getTemplates } = storeToRefs(templateStore)

const useTemplate = async (template) => {
  templateStore.selectTemplate(template.id_text_template)

  if (props.isDirectSubmit) {
    await mtUtils.fullHeightPopup(FabricMemoCarteModal, {
      id_memo_carte: null,
      id_customer: props.customerSelected?.id_customer,
      id_pet: props.petSelected?.id_pet,
      isDirectSubmit: props.isDirectSubmit,
      id_pet_illness_history: [illnessHistoryStore.getIllnessHistory?.id_pet_illness_history],
      imageUrl: template.img_file_path_template
    })
  }
  closeModal()
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files

  if (!files?.length) return

  if (files.length) {
    const fileList: File[] = Array.from(files)
    let imageUrl: string | ArrayBuffer

    fileList.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        imageUrl = event.target?.result;

        if (!props.isDirectSubmit) {
          event_bus.emit('addImageUrl', imageUrl)
        }

        if (props.isDirectSubmit) {
          mtUtils.mediumPopup(FabricMemoCarteModal, {
            id_memo_carte: null,
            id_customer: props.customerSelected?.id_customer,
            id_pet: props.petSelected?.id_pet,
            isDirectSubmit: props.isDirectSubmit,
            id_pet_illness_history: [illnessHistoryStore.getIllnessHistory?.id_pet_illness_history],
            imageUrl
          })
        }
      };

      reader.readAsDataURL(file);
    })
  }
  closeModal()
  return
}

onMounted(() => {
  templateStore.fetchTemplates({ type_text_template: 100 })
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      シェーマ図
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-py-md q-px-xl">
    <div>
      <div class="row items-start q-col-gutter-md">
        <div class="col-sm-4 col-md-3 col-lg-2 cursor-pointer">
          <div
            @click="$refs.fileInput.click()"
            class="bg-grey-300 text-grey-800 flex items-center justify-center"
            style="width: 80%; height: 200px;"
          >
            <q-icon name="add" size="lg" />
          </div>
          <input
            type="file"
            style="display: none"
            ref="fileInput"
            accept="image/*"
            multiple
            @change="onFileChange($event)"
          />
        </div>
        <div v-for="template in getTemplates" class="col-sm-4 col-md-3 col-lg-2 cursor-pointer"
             @click="useTemplate(template)">
          <q-card style="width: 80%;">
            <q-img :src="template.img_file_path_template" style="height: 200px;">
              <div class="absolute-bottom text-subtitle2 text-center">
                {{ template.memo_template }}
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