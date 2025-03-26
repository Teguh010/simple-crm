<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import OptionModal from '@/components/OptionModal.vue'
import { ref, onMounted } from 'vue'
import aahValidations from '@/utils/aahValidations'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import {
  LabPrint
} from '@/types/types'

import useLabPrintStore from '@/stores/lab-prints'

const labPrintStore = useLabPrintStore()

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

interface Props {
  idLabPrint?: number,
  labPrint?: LabPrint
  callback: Function
}
const props = withDefaults(defineProps<Props>(), {
  callback: () => {}
})

const buttonName = ref(''),
  isEdit = ref(false)

const submit = async () => {
  let payload = {
    name_button_lab_print: buttonName.value
  }
  if(props.idLabPrint) {
    labPrintStore.updateLabPrint(props.idLabPrint, payload).then(() => {
      props.callback()
      mtUtils.autoCloseAlert(aahMessages.success)
      closeModal()
    })
  } else {
    labPrintStore.submitLabPrint(payload).then(() => {
      props.callback()
      mtUtils.autoCloseAlert(aahMessages.success)
      closeModal()
    })
  }
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
            labPrintStore.deleteLabPrint(props.idLabPrint).then(() => {
              props.callback()
              mtUtils.autoCloseAlert(aahMessages.success)
              closeModal()
           })
          }
      })
    }
  }
}

onMounted(() => {
  if(props.idLabPrint) {
    buttonName.value = props.labPrint!.name_button_lab_print
    isEdit.value = true
  }
})

</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
          >出力ボタン名
      </q-toolbar-title>
      <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section>
      <div class="row q-mb-md">
        <div class="col">
          <MtInputForm 
            type="text"
            label="出力ボタン名 *"
            hint="検査結果画面に出力されるボタン"
            required
            v-model="buttonName"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn 
          outline 
          class="bg-grey-100 text-grey-800"
          @click="closeModal"
          >
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          class="q-ml-md"
          color="primary"
          type="submit"
          unelevated
          >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>