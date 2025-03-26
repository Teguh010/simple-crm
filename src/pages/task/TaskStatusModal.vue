<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { useEmployeeStore } from '@/stores/employees'
import { useTask } from '@/stores/task'
import { getDateTimeNow } from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'

const statusData = reactive({
  id_task: '',
  id_employee_approved: '',
  flg_approved: false,
  flg_prepared: false,
  datetime_approved: null,
  id_employee_checked: '',
  datetime_checked: null,
  flg_checked: false,
  id_employee_started: '',
  datetime_started: null,
  flg_started: false,
  id_employee_completed: '',
  datetime_completed: null,
  flg_completed: false,
  memo_task_report: ''
})
//const closeUpdDialogFlg = ref(true)
const emit = defineEmits(['close'])
const props = defineProps({
  info: {
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
const employeeStore = useEmployeeStore()
const taskStore = useTask()
const { getTaskSearchParams } = storeToRefs(taskStore)

const closeModal = () => {
  emit('close')
  //closeUpdDialogFlg.value = false
}

function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      statusData[key] = data[key]
    }
  }
}
const submit = async () => {
  if (props.info?.clickedStatus === 0) {
    if (statusData.id_employee_approved === null) {
      statusData.datetime_approved = null
      statusData.flg_approved = false
      statusData.flg_prepared = false
    } else {
      statusData.datetime_approved = getDateTimeNow()
      statusData.flg_approved = true
      statusData.flg_prepared = true
    }
  }
  if (props.info?.clickedStatus === 1) {
    if (statusData.id_employee_checked === null) {
      statusData.datetime_checked = null
      statusData.flg_checked = false
    } else {
      statusData.datetime_checked = getDateTimeNow()
      statusData.flg_checked = true
    }
  }
  if (props.info?.clickedStatus === 2) {
    if (statusData.id_employee_started === null) {
      statusData.datetime_started = null
      statusData.flg_started = false
    } else {
      statusData.datetime_started = getDateTimeNow()
      statusData.flg_started = true
    }
  }
  if (props.info?.clickedStatus === 3) {
    if (statusData.id_employee_completed === null) {
      statusData.datetime_completed = null
      statusData.flg_completed = false
      statusData.memo_task_report = ''
    } else {
      statusData.datetime_completed = getDateTimeNow()
      statusData.flg_completed = true
    }
  }
  if (props.info.task_copied_list && props.info.task_copied_list.length) {
    statusData.datetime_checked = getDateTimeNow()
    statusData.flg_checked = true
  }

  if (statusData.clickedStatus) delete statusData.clickedStatus

  await taskStore
    .updateTask(statusData.id_task, statusData)
    .then(async () => {
      props.updatedFlg.value = true
      if (getTaskSearchParams.value) await taskStore.fetchTask(getTaskSearchParams.value)
      else await taskStore.fetchTask()
    
      closeModal()
      mtUtils.autoCloseAlert(aahMessages.success)
    })
    .catch((error) => mtUtils.alert(error.message, "Error"))
}

const selectDefaultEmployee = (key: string) => {
  statusData[key] = defaultEmployee
}

onMounted(() => {
  assignPageData(props.info)
  if (localStorage.getItem('id_employee')) {
    if (props.info?.clickedStatus === 0) {
      statusData.id_employee_approved = JSON.parse(
        localStorage.getItem('id_employee')
      )
    }
    if (props.info?.clickedStatus === 1) {
      statusData.id_employee_checked = JSON.parse(
        localStorage.getItem('id_employee')
      )
    }
    if (props.info?.clickedStatus === 2) {
      statusData.id_employee_started = JSON.parse(
        localStorage.getItem('id_employee')
      )
    }
    if (props.info?.clickedStatus === 3) {
      statusData.id_employee_completed = JSON.parse(
        localStorage.getItem('id_employee')
      )
    }
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="true">
      <q-toolbar-title class="text-grey-900 title2 bold">
        タスク進捗
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section>
      <div class="q-my-md" v-if="props.info?.clickedStatus === 0">
        <InputEmployeeOptGroup
          v-model:selected="statusData.id_employee_approved"
          label="担当者"
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee('id_employee_approved')"
        />
      </div>
      <div class="q-my-md" v-if="props.info?.clickedStatus === 1">
        <InputEmployeeOptGroup
          v-model:selected="statusData.id_employee_checked"
          label="担当者"
          clearable
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee('id_employee_checked')"
        />
      </div>
      <div class="q-my-md" v-if="props.info?.clickedStatus === 2">
        <InputEmployeeOptGroup
          v-model:selected="statusData.id_employee_started"
          label="担当者"
          clearable
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee('id_employee_started')"
        />
      </div>
      <div class="q-my-md" v-if="props.info?.clickedStatus === 3">
        <InputEmployeeOptGroup
          v-model:selected="statusData.id_employee_completed"
          label="担当者"
          clearable
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee('id_employee_completed')"
        />
      </div>
      <div class="q-my-md" v-if="props.info?.clickedStatus === 3">
        <MtInputForm
          type="text"
          v-model="statusData.memo_task_report"
          label="レポート・報告"
          autogrow
        />
      </div>
      <div class="text-grey-700">
        <small>
          ステータスを戻す場合には担当者を未選択で保存してください。
        </small>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn unelevated color="primary" type="submit">
          <span>保存</span>
        </q-btn>
        <q-btn outline class="bg-grey-100 text-grey-800 q-mt-md" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
