<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import AdditionalFilterTodoTaskModal from './AdditionalFilterTodoTaskModal.vue'
import { getDaysAfter, getDaysAfterDate, getDaysBefore } from '@/utils/aahUtils'
import TodoTaskItem from './TodoTaskItem.vue'
import UpdateTaskModal from './UpdateTaskModal.vue'
import useTask from '@/stores/task'
import { storeToRefs } from 'pinia'
import _ from 'lodash'
import mtUtils from '@/utils/mtUtils'
import useCategoryStore from '@/stores/categories'
import { typeTaskTodoList } from '@/utils/enum'
import { useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { CliCommon, GenericValueLabelType } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'

interface TodoDepList {
  label: string
  value: number
}

const place = ref<GenericValueLabelType>({
  label: '',
  value: 0
})
const taskData = ref({
  type_department: 1,
  date_type: 'datetime_plan',
  order_by: 'asc',
  flg_completed: false,
  datetime_plan: getDaysBefore(1)
})
const radioSelection = computed(() => {
  return [
    { label: '予定完了日時', value: 'datetime_plan' },
    { label: 'タスク依頼日時', value: 'datetime_request' }
  ]
})
const statusLabels = [
  { label: '承認待ち', value: 'flg_approved' },
  { label: '確認済', value: 'flg_checked' },
  { label: '着手済', value: 'flg_started' },
  { label: '完了', value: 'flg_completed' }
]
const taskStore = useTask()
const { getTasks } = storeToRefs(taskStore)
const cliCommonStore = useCliCommonStore()
const categoryStore = useCategoryStore()
const { getTaskSearchParams, getTaskSearchCount } = storeToRefs(taskStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const activeOption = ref(1)
const rows = ref([])
const router = useRouter()
const todoDepList = ref<TodoDepList[]>([])

const init = async () => {
  if (getTasks.value) {
    if (activeOption.value == 1) {
      let res = getTasks.value.filter((tsk) => {
        return tsk.flg_closed === false && tsk.id_pet !== null
      })
      rows.value = _.groupBy(res, (item) => `${item.id_pet}`)
    } else if (activeOption.value == 2) {
      let res = getTasks.value.filter((tsk) => {
        return tsk.flg_closed === false && tsk.id_category1 !== null
      })
      rows.value = _.groupBy(res, (item) => `${item.id_category1}`)
    } else if (activeOption.value == 3) {
      let resApproved = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.flg_approved === false &&
          tsk.flg_start_arroval_required === true
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

  place.value = todoDepList.value.find(
    (v) => v.value === taskData.value.type_department
  )!
  router.replace({
    query: {
      place: place.value ? place.value.label.toLowerCase() : '',
      date: taskData.value.datetime_plan
    }
  })
  setPageTitle(`TODO: ${place.value?.label}`)
}

const openSearchModal = async () => {
  let updatedFlg = { value: false }
  let datetime = taskData.value.datetime_plan
  await mtUtils.smallPopup(AdditionalFilterTodoTaskModal, {
    updatedFlg,
    datetime,
    activeOption
  })
  if (updatedFlg.value) {
    init()
  }
}
const openAddModal = async () => {
  taskStore.selectTask(null)
  await mtUtils.popup(UpdateTaskModal, {}, true)
}
const applyCondtion = async (value: String) => {
  init()
}

const refresh = async () => {
  await taskStore.fetchTask(taskData.value)
  init()
}
const getLabel = (value) => {
  return statusLabels.find((v) => v?.value === value)?.label
}
// const getPlaces = computed(() => {
//   todoDepList.value.unshift({ label: '全て', value: null })
//   return todoDepList.value
// })
const changeDate = async (prefix) => {
  if (taskData.value.datetime_plan === null) {
    taskData.value.datetime_plan = getDaysAfter(1)
  }

  if (prefix == 'next') {
    taskData.value.datetime_plan = getDaysAfterDate(
      taskData.value.datetime_plan,
      1
    )
  }

  if (prefix == 'prev') {
    taskData.value.datetime_plan = getDaysAfterDate(
      taskData.value.datetime_plan,
      -1
    )
  }

  await taskStore.fetchTask(taskData.value)
  init()
}
function getCategoryName(id_category: any) {
  return categoryStore.getCategories.find((categoryObj: any) => {
    return categoryObj.id_category == id_category
  })?.name_category
}
const handlePlan = async (value) => {
  if (value === null) {
    taskData.value.datetime_plan = null
  } else {
    taskData.value.datetime_plan = value
  }
  await taskStore.fetchTask(taskData.value)
  init()
}

const getTodoDepList = async () => {
  todoDepList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))
  taskData.value.type_department = todoDepList.value[0].value
}

const countFilter = computed(() => {
  if (getTaskSearchCount.value) return getTaskSearchCount.value
  let count = 0
  let st = localStorage.getItem('task_todo_condition')
  if (st) {
    let storage_data = JSON.parse(st)
    Object.keys(storage_data).forEach((key) => {
      if (
        key != 'activeOption' &&
        key != 'datetime_plan' &&
        key != 'datetime_request'
      ) {
        if (
          (['number', 'string', 'boolean'].includes(typeof storage_data[key]) &&
            storage_data[key] !== '') ||
          storage_data[key]?.length > 0
        ) {
          count += 1
        }
      }
    })
  }
  return count
})
onMounted(async () => {
  let storage_data = ''
  await getTodoDepList()
  if (
    localStorage.getItem('task_todo_condition') !== null &&
    localStorage.getItem('task_todo_condition') != 'null'
  ) {
    // taskData.value.type_department = storage_data.type_department
    taskData.value.type_department = todoDepList.value[0].value
    taskData.value.date_type = storage_data.date_type
    taskData.value.order_by = storage_data.order_by
    taskData.value.flg_completed = storage_data.flg_completed
    taskData.value.activeOption = storage_data.activeOption
    activeOption.value = storage_data.activeOption
    if (storage_data.date_type == 'datetime_plan') {
      delete taskData.value.datetime_request
      taskData.value.datetime_plan = storage_data.datetime_plan
        ? storage_data.datetime_plan
        : taskData.value.datetime_plan
    } else if (storage_data.date_type == 'datetime_request') {
      delete taskData.value.datetime_plan
      taskData.value.datetime_request = storage_data.datetime_request
        ? storage_data.datetime_request
        : taskData.value.datetime_plan
    }
  }
  await taskStore.fetchTask(taskData.value)
  if (storage_data.date_type == 'datetime_request') {
    taskData.value.datetime_plan = storage_data.datetime_request
  }
  init()
})
</script>

<template>
  <q-page style="min-height: unset !important;">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          タスク一覧
        </q-toolbar-title>
        <div class="flex justify-end align-end items-center">
          <div class="flex items-between">
            <MtFormPullDown
              v-model="taskData.type_department"
              :options="todoDepList"
              autofocus
              label="対象部署"
              outlined
              :style="'width: 200px'"
              type="selection"
              @update:selected="refresh"
            />
            <q-btn class="q-mx-sm" outline @click="openSearchModal">
              詳細検索
              <q-badge v-if="countFilter" color="red" floating>
                {{ countFilter }}
              </q-badge>
            </q-btn>
            <q-btn flat icon="chevron_left" round @click="changeDate('prev')" />
            <MtFormInputDate
              v-model:date="taskData.datetime_plan"
              :clearable="true"
              class="search-field q-mx-xs"
              label="予定完了日時"
              outlined
              type="date"
              @update:modelValue="handlePlan"
            />
            <q-btn
              flat
              icon="chevron_right"
              round
              @click="changeDate('next')"
            />
          </div>
          <q-btn
            class="q-mx-sm"
            color="white"
            outline
            text-color="primery"
            unelevated
            @click="refresh"
          >
            <q-icon name="repeat" size="20px" />
          </q-btn>
          <q-btn
            color="primary"
            text-color="white"
            unelevated
            @click="openAddModal"
          >
            <q-icon name="add" size="20px" />
            タスク
          </q-btn>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row q-pl-sm justify-between q-pr-sm q-mt-lg gt-md">
      <div class="flex">
        <MtFormPullDown
          outlined
          type="selection"
          v-model="activeOption"
          :options="typeTaskTodoList"
          @update:model-value="applyCondtion"
        />
      </div>
    </div>

    <div
      class="q-px-md content q-mb-md"
      style="height: calc(100vh - 120px);"
    >
      <div
        class="row q-pl-sm q-pr-sm q-mt-lg q-mb-lg"
        v-for="(item, i) in rows"
        :key="i"
        v-if="rows && Object.keys(rows).length > 0"
      >
        <div class="row text-grey-900 title2 bold q-pl-xs">
          <span v-if="activeOption == 1">{{ item[0]?.name_pet }}</span>
          <span v-if="activeOption == 2">{{
            getCategoryName(item[0]?.id_category1)
          }}</span>
          <span v-if="activeOption == 3">{{ getLabel(i) }}</span>
          （{{ item.length }})
        </div>
        <TodoTaskItem
          v-for="(row, j) in item"
          :status="{
            'red-box': row.flg_emargency,
            'grey-box': row.flg_completed,
            'light-grey-box': !row.flg_emargency || !row.flg_completed
          }"
          :rows="row"
          :key="j"
          :from-page="`TODO: ${place.label}`"
          class="q-ml-md q-pl-md"
          @refresh="refresh"
        />
      </div>
      <div v-else class="page-center">
        <div class="flex items-center text-grey-500">
          <q-icon name="thumb_up_alt" size="120px" />
          <div class="text-center large-title">タスクはありません。</div>
        </div>
      </div>
    </div>
  </q-page>
</template>
