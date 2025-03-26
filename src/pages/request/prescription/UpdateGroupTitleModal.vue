<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { onMounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import { sortBy } from 'lodash'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'

const isEdit = ref(false)

type TextTemplateListType = {
  title: string
  flg_title: boolean
  attr: {
    class: string
  }
  isSelected: boolean
}

const props = defineProps({ prescription: null, prescriptionDetail: null, mode: null })
const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}
const textTemplateStore = useTextTemplateStore()
const { getTemplates } = storeToRefs(textTemplateStore)

const addTemplateModalFlg = ref(false)
const textTemplatesList = ref<Array<TextTemplateListType>>([])
const data = ref({
  name_prescription_display: '',
  id_prescription_detail: null,
  memo_alert: null,
  memo_dose_display: null,
  memo_clinic_prep: null,
  type_detail: 1
})

const openTemplateTextModal = async () => {
  await textTemplateStore.fetchTemplates({ type_text_template: 91 })
  textTemplatesList.value = sortBy(
    getTemplates.value,
    'display_order',
    'asc'
  ).map((template: any) => {
    return {
      title: template.memo_template,
      flg_title: template.flg_title,
      attr: {
        class: template.flg_title ? 'bg-grey-300' : ''
      },
      isSelected: false
    }
  })
  addTemplateModalFlg.value = true
  // if (getTemplates.value.length) {
  // }
}
const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      const confirmation = await mtUtils.confirm(
        aahMessages.delete_ask,
        aahMessages.delete
      )
      if (confirmation) {
        const response = await mtUtils.callApi(
          selectOptions.reqMethod.DELETE,
          `/UpdPrescriptionDetailNo/${data.value.id_prescription_detail}`,
          {}
        )
        if (response) {
          await mtUtils.autoCloseAlert('一包化のタイトルを削除しました')
        }
      }
    }
  }
  closeModal()
}
const submit = async () => {
  if (data.value.id_prescription_detail) {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `/UpdPrescriptionDetailNo/${data.value.id_prescription_detail}`,
      {
        ...data.value
      }
    )
    if (response) {
      await mtUtils.autoCloseAlert('一包化のタイトルを更新しました')
    }
    closeModal()
    return
  }
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/UpdPrescriptionDetailNo',
    {
      id_prescription: props.prescription.id_prescription,
      id_pet: props.prescription.id_pet,
      name_prescription_display: data.value.name_prescription_display,
      flg_group_title: true,
      row: 1,
      prescription_detail_ref_list: props.mode && props.mode == 'merge' ? props.prescription.prescription_detail_list.filter((v) => v.checked).map(v => v.id_prescription_detail) : null,
      type_detail: props.prescription.prescription_detail_list.filter((v) => v.checked) ? 5 : 4,
      memo_alert: data.value.memo_alert,
      memo_dose_display: data.value.memo_dose_display
    }
  )
  if (response) {
    closeModal()
    await mtUtils.autoCloseAlert('一包化タイトルを作成しました')
  }
}
onMounted(async () => {
  if (props.prescriptionDetail) {
    data.value.name_prescription_display =
      props.prescriptionDetail.name_prescription_display
    data.value.id_prescription_detail =
      props.prescriptionDetail.id_prescription_detail
    data.value.memo_alert = props.prescriptionDetail.memo_alert
    data.value.memo_dose_display = props.prescriptionDetail.memo_dose_display
    data.value.type_detail = props.prescriptionDetail.type_detail
    isEdit.value = true
    return 
  }

  data.value.type_detail = 4
  if (props.mode && props.mode == 'merge') {
    data.value.name_prescription_display = props?.prescription?.prescription_detail_list.filter((v) => v?.checked).map((v) => v?.name_prescription_display).join(', ')
    data.value.memo_alert = props?.prescription?.prescription_detail_list.filter((v) => v?.checked).map((v) => v?.memo_alert).join('\n')
    data.value.memo_dose_display = props?.prescription?.prescription_detail_list.filter((v) => v?.checked).map((v) => v?.memo_dose_display).join('\n')
    data.value.type_detail = 5
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title>
        <div class="row justify-end">
          <q-btn
            @click="openTemplateTextModal"
            flat
            class="cursor-pointer q-mx-sm"
          >
            <q-icon name="playlist_add" />テンプレ
          </q-btn>
          <q-btn round flat @click="openMenu" class="q-mx-sm">
            <q-icon name="more_horiz" size="xs" />
          </q-btn>
        </div>
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <p v-if="!isEdit && props.mode === 'merge'" class="text-center">合成医薬品名を入力してください。</p>
      <p v-else-if="!isEdit && props.mode !== 'merge'" class="text-center">一包化する際のタイトルをご入力ください。</p>
      <div class="q-mr-sm">
        <MtInputForm
          v-model="data.name_prescription_display"
          label="表示名"
          type="text"
        />
      </div>
      <div v-if="data.type_detail == 5 " class="q-mr-sm">
        <MtInputForm
          v-model="data.memo_dose_display"
          label="服用メモ"
          type="text"
          autogrow
        />
      </div>
      <div v-if="data.type_detail == 5" class="q-mr-sm">
        <MtInputForm
          v-model="data.memo_alert"
          label="注意事項"
          type="text"
          autogrow
        />
      </div>
      <div v-if="data.type_detail === 5" class="q-mr-sm">
        <MtInputForm
          v-model="data.memo_clinic_prep"
          label="調剤指示（院内メモ）"
          type="text"
          autogrow
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="一包化タイトル"
    :options="textTemplatesList"
    :data="data"
    memoKey="name_prescription_display"
  />
</template>
