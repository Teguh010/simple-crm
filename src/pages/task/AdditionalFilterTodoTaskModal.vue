<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useTask from '@/stores/task'
import { storeToRefs } from 'pinia'
import _ from 'lodash'
import useCommonStore from '@/stores/common'
import { CliCommon } from '@/types/types'

const props = defineProps({
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  datetime: {
    type: String,
    default: {
      value: null
    }
  },
  activeOption: {
    type: Number,
    default: {
      value: 1
    }
  }
})
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const taskData = ref({
  type_task_place: null,
  date_type: 'datetime_plan',
  order_by: 'asc',
  flg_completed: false
})
const radioSelection = computed(() => {
  return [
    { label: '予定完了日時', value: 'datetime_plan' },
    { label: 'タスク依頼日時', value: 'datetime_request' }
  ]
})
// const sortOptions = ref([
//   { label: 'ペットごと', value: 'id_pet' },
//   { label: '大分類ごと', value: 'id_category1' },
//   { label: 'ステータスごと', value: 'status' }
// ])
const statusLabels = [
  { label: '承認待ち', value: 'flg_approved' },
  { label: '確認済', value: 'flg_checked' },
  { label: '着手済', value: 'flg_started' },
  { label: '完了', value: 'flg_completed' }
]
const taskStore = useTask()
const commonStore = useCommonStore()
const { getTasks, getTaskSearchParams } = storeToRefs(taskStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(commonStore)
const rows = ref([])
const typeDeptList = ref([])

const init = async () => {
  if (getTasks.value) {
    if (activeOption.value == 'id_pet') {
      let res = getTasks.value.filter((tsk) => {
        return tsk.flg_closed === false && tsk.id_pet !== null
      })
      rows.value = _.groupBy(res, (item) => `${item.id_pet}`)
    } else if (activeOption.value == 'id_category1') {
      let res = getTasks.value.filter((tsk) => {
        return tsk.flg_closed === false && tsk.id_category1 !== null
      })
      rows.value = _.groupBy(res, (item) => `${item.id_category1}`)
    } else if (activeOption.value == 'status') {
      let resApproved = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.flg_approved === true &&
          tsk.datetime_approved === null &&
          tsk.flg_checked === false &&
          tsk.flg_started === false &&
          tsk.flg_completed === false
        )
      })
      let approvedGrp = { flg_approved: [] }
      if (resApproved.length > 0) {
        approvedGrp = _.groupBy(resApproved, (item) => `flg_approved`)
      }

      let resChecked = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.flg_checked === true &&
          tsk.flg_started === false &&
          tsk.flg_completed === false
        )
      })
      let checkedGrp = { flg_checked: [] }
      if (resChecked.length > 0) {
        checkedGrp = _.groupBy(resChecked, (item) => `flg_checked`)
      }

      let resStarted = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.flg_checked === true &&
          tsk.flg_started === true &&
          tsk.flg_completed === false
        )
      })
      let startedGrp = { flg_started: [] }
      if (resStarted.length > 0) {
        startedGrp = _.groupBy(resStarted, (item) => `flg_started`)
      }

      let resCompleted = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.flg_checked === true &&
          tsk.flg_started === true &&
          tsk.flg_completed === true
        )
      })
      let completedGrp = { flg_completed: [] }
      if (resCompleted.length > 0) {
        completedGrp = _.groupBy(resCompleted, (item) => `flg_completed`)
      }

      rows.value = _.merge(approvedGrp, checkedGrp, startedGrp, completedGrp)
    } else {
      rows.value = []
    }
  }
  let storage_data = taskData.value
  storage_data.activeOption = activeOption.value
  localStorage.setItem('task_todo_condition', JSON.stringify(storage_data))
}

const applyFilter = async () => {
  let count = 0
  Object.keys(taskData.value).forEach((key) => {
    if (key != 'activeOption') {
      if (
        (['number', 'string', 'boolean'].includes(typeof taskData.value[key]) &&
          taskData.value[key] !== '') ||
        taskData.value[key]?.length > 0
      ) {
        count += 1
      }
    }
  })

  if (props.datetime) {
    if (taskData.value.date_type == 'datetime_plan') {
      delete taskData.value.datetime_request
      taskData.value.datetime_plan = props.datetime
    } else if (taskData.value.date_type == 'datetime_request') {
      delete taskData.value.datetime_plan
      taskData.value.datetime_request = props.datetime
    }
  }
  //return false
  await taskStore.fetchTask(taskData.value)
  taskStore.setTaskSearchParams(taskData.value, count)
  taskData.value.activeOption = props.activeOption.value
  localStorage.setItem('task_todo_condition', JSON.stringify(taskData.value))
  //init()
  props.updatedFlg.value = true
  closeModal()
}
onMounted(async () => {
  typeDeptList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))
  if (
    localStorage.getItem('task_todo_condition') !== null &&
    localStorage.getItem('task_todo_condition') != 'null'
  ) {
    let storage_data = JSON.parse(localStorage.getItem('task_todo_condition'))
    taskData.value.type_task_place = storage_data.type_task_place
    taskData.value.date_type = storage_data.date_type
    taskData.value.order_by = storage_data.order_by
    taskData.value.flg_completed = storage_data.flg_completed
    props.activeOption.value = storage_data.activeOption
  }
  //await taskStore.fetchTask(taskData.value)
  //init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-lg">
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFormPullDown
        v-model="taskData.type_task_place"
        :options="typeDeptList"
        label="対象部署"
        outlined
        type="selection"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <!-- <MtInputForm
          type="selection"
          v-model="activeOption"
          label=""
          outlined
          :items="sortOptions"
          @update:model-value="applyCondtion"
        /> -->
      <MtFormRadiobtn
        v-model:selected="taskData.date_type"
        class="q-mr-sm"
        label="予定完了日時"
        size="28px"
        type="radio"
        val="datetime_plan"
      />
      <MtFormRadiobtn
        v-model:selected="taskData.date_type"
        label="タスク依頼日時"
        size="28px"
        type="radio"
        val="datetime_request"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFormPullDown
        v-model="taskData.order_by"
        :options="[
          { label: '昇順', value: 'asc' },
          { label: '降順', value: 'desc' }
        ]"
        label="降順"
        outlined
        type="selection"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFormCheckBox
        v-model:checked="taskData.flg_completed"
        label="完了タスク"
        left-label
        type="checkbox"
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn color="primary" class="q-ml-md" @click="applyFilter">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
