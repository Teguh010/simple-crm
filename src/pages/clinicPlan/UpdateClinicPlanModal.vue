<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useClinicPlanStore from '@/stores/clinic-plan'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { formatDate, formatHoursMinutes, getDateToday } from '@/utils/aahUtils'
import { timeHourMinute, typePlanStatus } from '@/utils/enum'
import dayjs from 'dayjs'

const clinicPlanStore = useClinicPlanStore()

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
  },
  callBackFromCalender: {
    type: Function,
    default: null
  }
})
const emits = defineEmits(['close'])
const myForm = ref(null)
const showTimeInput = ref(false)
const isEdit = ref(false)
const clinicForm = ref({
  title_clinic_plan: null,
  memo_clinic_plan: null,
  datetime_clinic_plan_start: getDateToday(),
  datetime_clinic_plan_end: getDateToday(),
  type_plan_status: 2,
  id_employee: null,
  memo_place: null,
  id_clinic: null
})
const flg_start = ref(true)
const flg_end = ref(true)
const plan_start_HH_MM = ref('11:00')
const plan_end_HH_MM = ref('12:00')
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const closeModal = () => {
  emits('close')
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
            clinicPlanStore
              .destroyClinicPlan(clinicForm.value.id_clinic_plan)
              .then(() => {
                clinicPlanStore.fetchClinicPlans()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const submit = () => {
  if (showTimeInput.value) {
    plan_start_HH_MM.value = plan_start_HH_MM.value || '00:00'
    clinicForm.value.datetime_clinic_plan_start =
      formatDate(clinicForm.value.datetime_clinic_plan_start) +
      ' ' +
      plan_start_HH_MM.value +
      ':00'

    plan_end_HH_MM.value = plan_end_HH_MM.value || '00:00'
    clinicForm.value.datetime_clinic_plan_end =
      formatDate(clinicForm.value.datetime_clinic_plan_end) +
      ' ' +
      plan_end_HH_MM.value +
      ':00'
  } else {
    clinicForm.value.datetime_clinic_plan_start = formatDate(clinicForm.value.datetime_clinic_plan_start) + ' 00:00:00'
    clinicForm.value.datetime_clinic_plan_end = formatDate(clinicForm.value.datetime_clinic_plan_end) + ' 00:00:00'
  }

  //return false
  myForm.value.validate().then((success) => {
    if (success) {
      if (props.data?.id_clinic_plan) {
        clinicPlanStore
          .updateClinicPlan(props.data?.id_clinic_plan, clinicForm.value)
          .then(async () => {
            await clinicPlanStore.fetchClinicPlans()
            props.updatedFlg.value = true
            if (props.callBackFromCalender) {
              props.callBackFromCalender()
            }
            emits('close')
            mtUtils.autoCloseAlert(aahMessages.success)
          })
      } else {
        clinicPlanStore.submitClinicPlan(clinicForm.value).then(async () => {
          await clinicPlanStore.fetchClinicPlans()
          if (props.callBackFromCalender) {
            props.callBackFromCalender()
          }
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
        })
      }
    }
  })
}
const assignPageData = (info: any) => {
  if (info) {
    for (let key in info) {
      clinicForm.value[key] = info[key]
    }
  }
}

const selectDefaultEmployee = () => {
  clinicForm.value.id_employee = null
}



onMounted(() => {
  if (props.data?.id_clinic_plan) {
    // Update case
    isEdit.value = true
    assignPageData(props.data)
    plan_start_HH_MM.value = formatHoursMinutes(
      clinicForm.value.datetime_clinic_plan_start
    )
    clinicForm.value.datetime_clinic_plan_start = formatDate(
      clinicForm.value.datetime_clinic_plan_start
    )
    if (plan_start_HH_MM.value !== null) {
      flg_start.value = true
    }
    plan_end_HH_MM.value = formatHoursMinutes(
      clinicForm.value.datetime_clinic_plan_end
    )
    clinicForm.value.datetime_clinic_plan_end = formatDate(
      clinicForm.value.datetime_clinic_plan_end
    )
    if (plan_end_HH_MM.value !== null) {
      flg_end.value = true
    }
    selectDefaultEmployee()
  } else {
    // Create case
    isEdit.value = false
    clinicForm.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    selectDefaultEmployee()
  }
})
</script>

<template>
  <q-form @submit="submit" ref="myForm">
    <MtModalHeader @closeModal="closeModal">
      <div class="row q-mr-auto">
        <q-toolbar-title class="text-grey-900 title2 bold">
          院内予定
        </q-toolbar-title>
      </div>
      <q-btn flat round v-if="isEdit" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-md content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            label="行事名 *"
            v-model="clinicForm.title_clinic_plan"
            :rules="[aahValidations.validationRequired]"
            autofocus
            :tabindex="1"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtInputForm
            v-model="clinicForm.memo_clinic_plan"
            class="limited-autogrow"
            type="text"
            label="内容"
            autogrow
            :tabindex="2"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtFormInputDate
            datetime
            label="開始予定日時"
            v-model:date="clinicForm.datetime_clinic_plan_start"
            :rules="[aahValidations.validationRequired]"
            :tabindex="3"
          ></MtFormInputDate>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6 q-mt-sm q-ml-lg">
          <MtInputForm
            type="checkbox"
            v-model="showTimeInput"
            :items="[{ label: '時間指定' }]"
            :tabindex="4"
          />
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6" v-if="showTimeInput">
          <MtFormPullDown
            type="selection"
            v-model:selected="plan_start_HH_MM"
            :options="timeHourMinute"
            label="時：分"
            :tabindex="5"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtFormInputDate
            datetime
            label="終了予定日"
            v-model:date="clinicForm.datetime_clinic_plan_end"
            :rules="[aahValidations.validationRequired]"
            :tabindex="6"
          ></MtFormInputDate>
        </div>
        <div class="col-lg-2 col-md-4 col-sm-6 q-mt-sm q-ml-lg">

        </div>
        <div class="col-lg-2 col-md-4 col-sm-6" v-if="showTimeInput">
          <MtFormPullDown
            type="selection"
            v-model:selected="plan_end_HH_MM"
            :options="timeHourMinute"
            label="時：分"
            :tabindex="8"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormPullDown
            type="selection"
            v-model:options="typePlanStatus"
            label="院内予定区分"
            v-model:selected="clinicForm.type_plan_status"
            :tabindex="9"
          ></MtFormPullDown>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            label="場所"
            v-model="clinicForm.memo_place"
            :tabindex="11"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          :tabindex="12"
          type="submit"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style scoped lang="scss">
:deep(.q-field__native) {
  min-height: 1ch;
  max-height: 50ch;
}
</style>
