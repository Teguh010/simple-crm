<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import { imageResize } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import { typeTextTemplate } from '@/utils/enum'

const props = defineProps({
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  data: Object,
  searchData: Function
})
const templateStore = useTextTemplateStore()
const { getTemplate } = storeToRefs(templateStore)

const emits = defineEmits(['close'])

const isEdit = ref(false)

const data = ref({
  type_text_template: 100,
  flg_title: false,
  memo_template: '',
  img_file_path_template: null,
  display_order: null
})
const file_path = ref()
const file_name = ref('')
const f_status = ref('unchanged')
const closeModal = () => {
  emits('close')
}
function onFilePicked(e: any, type: any) {
  imageResize(e.target.files[0])
    .then((i) => {
      //data.value.type = i
      if (type === 'file_path') {
        file_path.value = URL.createObjectURL(i)
        data.value.img_file_path_template = e.target.files[0]
        file_name.value = e.target.files[0].name
        f_status.value = 'changed'
      }
    })
    .catch((error) => {
      console.error('Failed to resize image:', error)
    })
}
const removeImage = () => {
  file_path.value = null
  data.value.img_file_path_template = null
  file_name.value = ''
  f_status.value = 'removed'
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
            templateStore
              .destroyTemplate(data.value.id_text_template)
              .then(() => {
                props.searchData()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const submit = () => {
  let formData = new FormData()
  formData.append('flg_title', data.value.flg_title)
  formData.append('type_text_template', data.value.type_text_template)
  formData.append('memo_template', data.value.memo_template)
  if (data.value.display_order) {
    formData.append('display_order', data.value.display_order)
  }
  if (props.data) {
    if (f_status.value == 'changed') {
      formData.append(
        'img_file_path_template',
        data.value.img_file_path_template
      )
    }

    if (f_status.value == 'removed') {
      formData.append('img_file_path_template', '')
    }

    if (f_status.value == 'unchanged') {
      formData.append(
        'img_file_path_template',
        data.value.img_file_path_template
      )
    }


    templateStore
      .updateTemplate(data.value.id_text_template, formData)
      .then(async () => {
        props.updatedFlg.value = true
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    if (file_name.value != '') {
      formData.append(
        'img_file_path_template',
        data.value.img_file_path_template
      )
    }
    formData.append('id_clinic', data.value.id_clinic)
    templateStore.submitTemplate(formData).then(async () => {
      props.updatedFlg.value = true
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

onMounted(() => {
  if (props.data?.id_text_template) {
    // Update case
    isEdit.value = true
    data.value = {...props.data}
    if (data.value.img_file_path_template) {
      file_path.value = data.value.img_file_path_template
    }
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        シェーマ図
      </q-toolbar-title>
      <q-btn flat round v-if="isEdit" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-lg content">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          type="text"
          outlined
          autogrow
          v-model="data.memo_template"
          label="タイトル"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <div class="body1 regular text-grey-700 q-pb-md">
          画像
        </div>
        <div v-if="file_path" class="relative-position">
          <q-img :src="file_path" spinner-color="white" class="full-width" />
          <q-badge color="red" floating transparent @click="removeImage">
            <q-icon name="close" />
          </q-badge>
        </div>
        <q-btn
          v-else
          @click="$refs.file.click()"
          unelevated
          color="grey-300"
          text-color="grey-800"
          class="full-width q-pa-xl"
        >
          <q-icon size="60px" name="add" />
        </q-btn>
        <input
          type="file"
          style="display: none"
          ref="file"
          accept="image/*"
          @change="onFilePicked($event, 'file_path')"
        />
      </div>
      <div class="col-6">
        <MtFormInputNumber
          type="number"
          v-model:value="data.display_order"
          label="表示順序（0~999; 小を上位表示）"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" @click="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>
