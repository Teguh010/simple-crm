<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateByFormat } from '@/utils/aahUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useDoctorAvailabilityStore from '@/stores/doctor-availabilities'

const emits = defineEmits(['close'])

const doctorAvailabilityStore = useDoctorAvailabilityStore()
//const { getAllBusinessHourSlots } = storeToRefs(businessHourSlot)
const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  }
})
const requestForm = reactive({
  id_doctor_availability: null,
  datetime_business_day: null,
  flg_unavailable: false,
  id_employee: '',
  flg_slot1_available: false,
  limit_number1: '',
  flg_slot2_available: false,
  limit_number2: '',
  flg_slot3_available: false,
  limit_number3: ''
})
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const closeModal = () => {
  emits('close')
}

const submit = async () => {
  if (requestForm.limit_number1 == '') {
    delete requestForm.limit_number1
  }
  if (requestForm.limit_number2 == '') {
    delete requestForm.limit_number2
  }
  if (requestForm.limit_number3 == '') {
    delete requestForm.limit_number3
  }
  requestForm.datetime_business_day = getDateByFormat(
    requestForm.datetime_business_day,
    'YYYY/MM/DD HH:mm:ss'
  )
  if (requestForm.id_doctor_availability) {
    doctorAvailabilityStore
      .updateDoctorAvailability(requestForm.id_doctor_availability, requestForm)
      .then(async () => {
        props.updatedFlg.value = true
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    delete requestForm.id_doctor_availability
    doctorAvailabilityStore
      .submitDoctorAvailability(requestForm)
      .then(async () => {
        props.updatedFlg.value = true
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
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
        .confirm('本当に削除しますか？', '確認') //TODO: 共通化する必要あり
        .then((confirmation) => {
          if (confirmation) {
            //TODO: 削除処理
          }
        })
    }
  }
}
function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      requestForm[key] = data[key]
    }
  }
}

const selectDefaultEmployee = () => {
  requestForm.id_employee = defaultEmployee
}

onMounted(() => {
  if (props.data) {
    assignPageData(props.data)
  }
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        時間枠別管理：稼働 & 休み
      </q-toolbar-title>
      <!-- <q-btn flat round v-if="props.data" class="q-mr-sm" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn> -->
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-12 col-sm-12">
          <MtFormInputDate
            v-model:date="requestForm.datetime_business_day"
            type="date"
            label="対象日 *"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-lg-6 col-md-12 col-sm-12">
          <InputEmployeeOptGroup
            label="対象者 *"
            v-model:selected="requestForm.id_employee"
            :rules="[aahValidations.validationSelection]"
            show-select-default-employee
            @update:select-default-employee="selectDefaultEmployee"
          />
        </div>
      </div>
      <div class="round-section-free-bg bg-accent-050 q-pa-md">
        <div class="body2 regular text-accent-900 q-mb-sm">診療時間枠</div>
        <div class="q-pl-md">時間枠 1 : 00:00 ~ 00:00</div>
      </div>
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-lg-4 col-md-6 col-sm-12">
          <MtInputForm
            type="checkbox"
            v-model="requestForm.flg_unavailable"
            :items="[{ label: '終日休み' }]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-6 col-sm-12">
          <MtInputForm
            type="checkbox"
            v-model="requestForm.flg_slot1_available"
            :items="[{ label: '時間枠1' }]"
          />
        </div>
        <div
          v-if="requestForm?.flg_slot1_available"
          class="col-lg-4 col-md-6 col-sm-12"
        >
          <MtInputForm
            type="text"
            v-model="requestForm.limit_number1"
            label="整理券の取得上限"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-6 col-sm-12">
          <MtInputForm
            type="checkbox"
            v-model="requestForm.flg_slot2_available"
            :items="[{ label: '時間枠2' }]"
          />
        </div>
        <div
          v-if="requestForm?.flg_slot2_available"
          class="col-lg-4 col-md-6 col-sm-12"
        >
          <MtInputForm
            type="text"
            v-model="requestForm.limit_number2"
            label="整理券の取得上限"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-6 col-sm-12">
          <MtInputForm
            type="checkbox"
            v-model="requestForm.flg_slot3_available"
            :items="[{ label: '時間枠3' }]"
          />
        </div>
        <div
          v-if="requestForm?.flg_slot3_available"
          class="col-lg-4 col-md-6 col-sm-12"
        >
          <MtInputForm
            type="text"
            v-model="requestForm.limit_number3"
            label="整理券の取得上限"
          />
        </div>
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
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
