<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateToday } from '@/utils/aahUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { timeHourMinute } from '@/utils/enum'

const emits = defineEmits(['close'])

const props = defineProps({ data: Object })
const schedule_start_date = ref(getDateToday())
const schedule__start_HH_MM = ref('')
const schedule_end_date = ref(getDateToday())
const schedule_end_HH_MM = ref('')
const requestForm = reactive({
  plan_name: '',
  content: '',
  unconfirmed_schedule: false,
  id_employee_staff: '',
  flg_cancel_employee: false
})
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const closeModal = () => {
  emits('close')
}

function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      requestForm[key] = data[key]
    }
  }
}
const submit = async () => {}
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
        .confirm('本当に削除しますか？', '確認') //TODO: 共通化する必要あり
        .then((confirmation) => {
          if (confirmation) {
            //TODO: 削除処理
          }
        })
    }
  }
}

const selectDefaultEmployee = () => {
  requestForm.id_employee_staff = defaultEmployee
}

onMounted(() => {})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        院内予定
      </q-toolbar-title>
      <q-btn flat round v-if="props.data" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="requestForm.plan_name"
            label="予定名 *"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="requestForm.content"
            label="予定内容"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtFormInputDate
            v-model:date="schedule_start_date"
            type="date"
            label="開始予定日"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            type="selection"
            v-model:selected="schedule__start_HH_MM"
            :options="timeHourMinute"
            label="開始予定時間"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtFormInputDate
            v-model:date="schedule_end_date"
            type="date"
            label="終了予定日"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            type="selection"
            v-model:selected="schedule_end_HH_MM"
            :options="timeHourMinute"
            label="終了予定時間"
          />
        </div>
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            v-model="requestForm.unconfirmed_schedule"
            :items="[{ label: '未確定の予定' }]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <InputEmployeeOptGroup
            v-model:selected="requestForm.id_employee_staff"
            label="主担当者"
            show-select-default-employee
            @update:select-default-employee="selectDefaultEmployee"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm q-mt-md q-mb-md">
        <MtInputForm
          type="checkbox"
          v-model="requestForm.flg_cancel_employee"
          :items="[{ label: 'キャンセル' }]"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>リクエスト作成</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
