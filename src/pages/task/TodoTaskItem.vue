<script setup lang="ts">
import {
  aahUtilsGetEmployeeName,
  formatDate,
  formatHoursMinutes,
  timeDifferences
} from '@/utils/aahUtils'
import { computed, onMounted, ref } from 'vue'
import { useEmployeeStore } from '@/stores/employees'
import MtstatusCheckCircle from '@/components/MtstatusCheckCircle.vue'
import mtUtils from '@/utils/mtUtils'
import TaskStatusModal from './TaskStatusModal.vue'
import ViewTaskDetailModal from './ViewTaskDetailModal.vue'
import useCategoryStore from '@/stores/categories'
import useTask from '@/stores/task'
import MtTable2 from '@/components/MtTable2.vue'
import { TaskType } from '@/types/types'

const props = withDefaults(
  defineProps<{
    dateType?: string
    status: string | Object
    rows: TaskType
    customClassCircle?: string,
    fromPage: string
  }>(),
  {
    dateType: 'today',
    status: 'light-grey-box',
    customClassCircle: ''
  }
)
const emits = defineEmits(['fetchList', 'refresh'])
const taskStore = useTask()
const isApproved = ref(true)
const employeeStore = useEmployeeStore()
const categoryStore = useCategoryStore()

const columns = [
  {
    name: 'valOrder',
    label: '',
    field: 'val_order',
    align: 'left'
  },
  {
    name: 'datetime_plan',
    label: '完了予定',
    field: 'datetime_plan',
    align: 'left'
  },
  {
    name: 'status',
    label: '完了',
    field: 'status',
    align: 'left'
  },
  {
    name: 'title_task',
    label: '',
    field: 'title_task',
    align: 'left'
  }
]

const today = new Date()
const taskCopiedList = ref<Array<TaskType>>([])
const timeRemaining = ref(0)
let interval = setInterval(() => {
  if (timeRemaining.value <= 0) {
    clearInterval(interval)
  } else {
    timeRemaining.value--
  }
}, 60000)

const dateDisplay = computed(() => {
  // display date based on date type prop, if today, display only the hours
  // if not today, display date + hours in YYYY/MM/DD HH:mm format
  if (props.dateType === 'today') {
    if (props.rows.val_order) {
      const data = taskCopiedList.value.find((task) => {
        return !task.flg_checked
      })

      if (data) {
        timeRemaining.value = timeDifferences(
          data.datetime_plan,
          today,
          'minutes'
        )
        return formatHoursMinutes(data.datetime_plan)
      }

      return formatHoursMinutes(props.rows.datetime_plan)
    }

    return formatHoursMinutes(props.rows.datetime_plan)
  }

  return `${formatDate(props.rows?.datetime_plan)} ${formatHoursMinutes(
    props.rows.datetime_plan
  )}`
})

const init = async () => {
  emits('fetchList')
}

const formatDateDisplay = (data: string) => {
  if (props.dateType === 'today') {
    return formatHoursMinutes(data)
  }
  return `${formatDate(data)} ${formatHoursMinutes(data)}`
}

const onRowClick = async (data: any) => {
  taskStore.selectTask(data.id_task)
  await mtUtils.mediumPopup(ViewTaskDetailModal, { data, fromPage: props.fromPage })
}
const handlePetLink = (data: any) => {
  window.open(`/PetDetail/${data?.id_customer}/${data?.id_pet}`, '_blank')
}
const getEmpDetails = (id: string) => {
  return employeeStore.getEmployees.find((v) => v.id_employee === id)
}
const getCategoryName = (id_category: string) => {
  return categoryStore.getCategories.find((categoryObj: any) => {
    return categoryObj.id_category == id_category
  })?.name_category
}
const getCustomClassName = (value: { flg_prepared: boolean }) => {
  const basicClass = 'small'
  if (!value.flg_prepared) {
    return `${basicClass} disable`
  }
  return basicClass
}

const handleStatusUpdateRepetitiveTask = async (info: TaskType) => {
  let updatedFlg = { value: false }
  await mtUtils.littlePopup(TaskStatusModal, { info, updatedFlg })
  emits('refresh')
  if (updatedFlg.value) {
    init()
  }
}

const handleStatus = async (clickedStatus: number, info: TaskType) => {
  if (isApproved.value === true) {
    if (
      clickedStatus == 1 &&
      props.rows?.datetime_checked !== null &&
      props.rows?.datetime_started !== null
    ) {
      return false
    }
    if (clickedStatus == 1 && props.rows?.flg_prepared === false) {
      return false
    }
    if (
      clickedStatus == 2 &&
      props.rows?.datetime_started !== null &&
      props.rows?.datetime_completed !== null
    ) {
      return false
    }
    if (
      clickedStatus == 2 &&
      info.datetime_checked === null &&
      info.id_employee_checked === null
    ) {
      return false
    } else if (
      clickedStatus == 3 &&
      info.datetime_started === null &&
      info.id_employee_started === null
    ) {
      return false
    }
    info.clickedStatus = clickedStatus
    let updatedFlg = { value: false }
    await mtUtils.littlePopup(TaskStatusModal, { info, updatedFlg })
    emits('refresh')
    if (updatedFlg.value) {
      init()
    }
  }
}

const updateFlgComplete = async (row: TaskType) => {
  let updatedFlg = { value: false }
  let info = { clickedStatus: 3, ...row }
  await mtUtils.littlePopup(TaskStatusModal, { info, updatedFlg })
  init()
}
const getCompleteInfo = (row: TaskType) => {
  const tempText = `${formatHoursMinutes(row['datetime_completed'])} 
  ${aahUtilsGetEmployeeName(
    employeeStore.allEmployees,
    row['id_employee_completed']
  )} 
  ${row['memo_task_report']}`
  return tempText
}

onMounted(() => {
  if (
    props.rows?.task_copied_list &&
    props?.rows?.task_copied_list?.length > 0
  ) {
    taskCopiedList.value = [{ ...props.rows }, ...props.rows.task_copied_list]
  }
})
</script>

<template>
  <div
    class="row col-12 q-pa-sm q-pl-md q-pt-md q-mt-md q-br-3"
    :class="status"
    v-if="!props.rows?.id_task_copied"
  >
    <div class="col-6 cursor-pointer">
      <div
        class="flex items-end q-mb-md"
        style="gap: 16px"
        @click="onRowClick(props.rows)"
      >
        <span class="body1 bold text-grey-900" v-if="props.rows?.datetime_plan">
          ⌛{{ dateDisplay }}
        </span>
        <template v-if="props.rows.val_order">
          <span v-if="timeRemaining <= 30" class="caption2 bold text-negative">
            残り
            <span class="large-title bold"> {{ timeRemaining }} </span>
            分 {{ taskCopiedList.length }} 回目
          </span>
        </template>
      </div>
      <div @click="onRowClick(props.rows)">
        <span class="body1 text-grey-900 q-mb-md">
          {{ props.rows?.title_task }}
        </span>
      </div>
      <div
        class="q-mb-md"
        @click="onRowClick(props.rows)"
        v-if="props.rows?.memo_task_todo"
      >
        <span class="body1 text-grey-900 q-mb-md">
          {{ props.rows?.memo_task_todo }}
        </span>
      </div>
      <div class="body1 text-grey-900 q-mb-md" v-if="props.rows?.id_link1">
        治療サービス明細番号：
        <span class="blue text-underline cursor-pointer">{{
          props.rows?.id_link1
        }}</span>
      </div>
      <div class="body1 column text-grey-900" @click="onRowClick(props.rows)">
        <div v-if="props.rows?.id_category1" class="q-mb-sm">
          {{ getCategoryName(props.rows?.id_category1) }} •
          {{ getCategoryName(props.rows?.id_category2) }}
        </div>
        <div class="q-my-md">
          <span v-if="props.rows?.place_task" class="q-mr-lg">
            <span class="field-label1">場所</span> {{ props.rows?.place_task }}
          </span>
          <span v-if="props.rows?.id_employee_staff">
            <span class="field-label1">主担当</span>
            {{ getEmpDetails(props.rows?.id_employee_staff)?.name_family }}
          </span>
        </div>
        <div class="q-mb-md">
          <span v-if="props.rows?.id_employee_request" class="q-mr-lg">
            <span class="field-label1">依頼者</span>
            {{ getEmpDetails(props.rows?.id_employee_request)?.name_display }}
          </span>
          <span v-if="props.rows?.datetime_request">
            <span class="field-label1">依頼日時</span>
            {{
              formatDate(props.rows?.datetime_request) +
              ' ' +
              formatHoursMinutes(props.rows?.datetime_request)
            }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="taskCopiedList?.length > 0" class="col-6">
      <div
        v-if="props.rows.flg_start_arroval_required"
        class="q-mt-md row justify-center items-center"
      >
        <div class="column justify-center detailsStatusBox">
          <q-btn
            class="progress-btn approve-required"
            padding="15px 25px"
            unelevated
          >
            <q-icon class="q-mr-sm" name="done" size="18px" />
            承認
          </q-btn>
          <div class="flex items-center justify-center q-mt-sm">
            {{ formatHoursMinutes(props.rows?.datetime_approved) }}
          </div>
          <div class="flex items-center justify-center">
            {{
              props.rows?.id_employee_approved
                ? getEmpDetails(props.rows?.id_employee_approved)?.name_display
                : ''
            }}
          </div>
        </div>
      </div>
    </div>

    <div v-else class="col-6">
      <div class="q-mt-md row justify-start items-center">
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center text-center"
            @click="handleStatus(0, props.rows)"
          >
            <MtstatusCheckCircle
              :statusChecked="isApproved && props.rows?.flg_prepared"
              :customClass="props.customClassCircle"
            />
            <div class="column items-center datetime">
              <div v-if="props.rows?.flg_prepared">
                <span
                  :class="
                    props.rows?.flg_prepared ? 'text-grey-800' : 'text-grey-400'
                  "
                  >依頼済</span
                >
              </div>
              <div v-else>
                <span class="text-darkred">未承認</span>
              </div>
              <div v-if="props.rows?.datetime_approved">
                {{
                  props.rows?.datetime_approved
                    ? formatHoursMinutes(props.rows?.datetime_approved)
                    : ''
                }}
              </div>
              <div v-else-if="props.rows?.flg_prepared">
                {{
                  props.rows?.datetime_request
                    ? formatHoursMinutes(props.rows?.datetime_request)
                    : ''
                }}
              </div>
              <div>
                {{
                  props.rows?.id_employee_request
                    ? getEmpDetails(props.rows?.id_employee_request)
                        ?.name_display
                    : ''
                }}
              </div>
            </div>
          </div>
          <div
            class="bg-accent-200 statusDivider"
            :class="props.customClassCircle"
          ></div>
        </div>
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center text-center"
            @click="handleStatus(1, props.rows)"
          >
            <MtstatusCheckCircle
              :statusChecked="isApproved && props.rows?.flg_checked"
              :customClass="
                !props.rows?.flg_prepared
                  ? 'disable'
                  : '' + props.customClassCircle
              "
            />
            <div class="column items-center datetime">
              <div>
                <span
                  :class="
                    isApproved && rows?.flg_checked
                      ? 'text-grey-800'
                      : 'text-grey-400'
                  "
                  >確認済</span
                >
              </div>
              <div>
                {{
                  props.rows?.datetime_checked
                    ? formatHoursMinutes(props.rows?.datetime_checked)
                    : ''
                }}
              </div>
              <div>
                {{
                  props.rows?.id_employee_checked
                    ? getEmpDetails(props.rows?.id_employee_checked)
                        ?.name_display
                    : ''
                }}
              </div>
            </div>
          </div>
          <div
            class="bg-accent-200 statusDivider"
            :class="props.customClassCircle"
          ></div>
        </div>
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center"
            @click="handleStatus(2, props.rows)"
          >
            <MtstatusCheckCircle
              :statusChecked="isApproved && props.rows?.flg_started"
              :customClass="
                (!props.rows?.flg_checked ? 'disable' : '') +
                ' ' +
                props.customClassCircle
              "
            />
            <div class="column items-center datetime">
              <div>
                <span
                  :class="
                    isApproved && rows?.flg_started
                      ? 'text-grey-800'
                      : 'text-grey-400'
                  "
                  >着手済</span
                >
              </div>
              <div>
                {{
                  props.rows?.datetime_started
                    ? formatHoursMinutes(props.rows?.datetime_started)
                    : ''
                }}
              </div>
              <div>
                {{
                  props.rows?.id_employee_started
                    ? getEmpDetails(props.rows?.id_employee_started)
                        ?.name_display
                    : ''
                }}
              </div>
            </div>
          </div>
          <div
            class="bg-accent-200 statusDivider"
            :class="props.customClassCircle"
          ></div>
        </div>
        <div>
          <div class="row justify-center items-start detailsStatusBox">
            <div
              class="column justify-center items-center"
              @click="handleStatus(3, props.rows)"
            >
              <MtstatusCheckCircle
                :statusChecked="isApproved && props.rows?.flg_completed"
                :customClass="
                  (!props.rows?.flg_started ? 'disable' : '') +
                  ' ' +
                  props.customClassCircle
                "
              />
              <div class="column items-center datetime">
                <div>
                  <span
                    :class="
                      isApproved && rows?.flg_completed
                        ? 'text-grey-800'
                        : 'text-grey-400'
                    "
                    >完了</span
                  >
                </div>
                <div>
                  {{
                    props.rows?.datetime_completed
                      ? formatHoursMinutes(props.rows?.datetime_completed)
                      : ''
                  }}
                </div>
                <div>
                  {{
                    props.rows?.id_employee_completed
                      ? getEmpDetails(props.rows?.id_employee_completed)
                          ?.name_display
                      : ''
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row justify-start q-mt-lg">
        <q-btn
          padding="2px 20px"
          unelevated
          class="progress-btn"
          :class="{
            active:
              props.rows?.flg_start_arroval_required &&
              !props.rows?.flg_approved,
            disable: !props.rows?.flg_start_arroval_required,
            approved: props.rows?.flg_approved
          }"
          v-if="props.rows?.flg_start_arroval_required"
        >
          <q-icon size="16px" name="done" /> 承認
        </q-btn>
        <q-btn
          padding="2px 20px"
          unelevated
          class="progress-btn"
          v-if="props.rows?.type_task_review !== 99"
          :class="{
            approved: props.rows?.flg_task_reviewed1,
            disable: !props.rows?.flg_task_reviewed1
          }"
        >
          <q-icon size="16px" name="done" /> 最終1
        </q-btn>
        <q-btn
          padding="2px 20px"
          unelevated
          class="progress-btn"
          v-if="props.rows?.type_task_review === 2"
          :class="{
            approved: props.rows?.flg_task_reviewed2,
            disable: !props.rows?.flg_task_reviewed2
          }"
        >
          <q-icon size="16px" name="done" /> 最終2
        </q-btn>
      </div>
    </div>

    <div v-if="taskCopiedList?.length > 0" class="row col-12 q-mt-md">
      <MtTable2
        :columns="columns"
        :rows="taskCopiedList"
        :sticky="false"
        :dense="true"
        :flat="true"
        rowsBg="completed_task"
        class="rep_task_table"
      >
        <template v-slot:row="{ row }">
          <td v-for="(col, index) in columns" :key="index" class="col-auto">
            <div
              v-if="col.field == 'val_order'"
              class="body1 bold reduce-padding val_order"
              :class="{
                'text-grey-500': row['flg_completed'],
                'text-white bg-grey-600': !row['flg_completed']
              }"
            >
              {{ row['val_order'] }}
            </div>
            <div
              v-else-if="col.field == 'datetime_plan'"
              class="caption1"
              :class="{
                'text-grey-500': row['flg_completed'],
                'text-grey-900 bold': !row['flg_completed']
              }"
            >
              {{ formatDateDisplay(row['datetime_plan']) }}
            </div>
            <div v-else-if="col.field == 'status'">
              <q-icon
                size="30px"
                name="done"
                color="grey-600"
                v-if="row['flg_completed']"
              />
              <div v-else @click="handleStatusUpdateRepetitiveTask(row)">
                <MtstatusCheckCircle
                  :customClass="
                    getCustomClassName(row) + ' ' + props.customClassCircle
                  "
                  :statusChecked="row['flg_checked']"
                />
              </div>
            </div>
            <div
              v-else-if="col.field == 'title_task'"
              class="text-left text-grey-700"
              @click="updateFlgComplete(row)"
            >
              <div v-if="row['flg_completed']">
                {{ getCompleteInfo(row) }}
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </div>
  <div
    class="row col-12 q-pa-sm q-pl-md q-pt-md q-mt-md q-br-3"
    :class="status"
    v-else
  >
    <div class="col-6 cursor-pointer">
      <div class="q-mb-md" @click="onRowClick(props.rows)">
        <span class="blue text-underline q-pr-sm">
          # {{ props.rows?.number_task }}
        </span>
        <span class="title1 bold text-grey-900 q-mb-md">
          {{ props.rows?.title_task }}
        </span>
      </div>
      <div @click="onRowClick(props.rows)">
        <span
          class="body1 bold text-grey-900 q-mb-md"
          v-if="props.rows?.datetime_plan"
        >
          ⌛{{
            ' ' +
            formatDate(props.rows?.datetime_plan) +
            ' ' +
            formatHoursMinutes(props.rows?.datetime_plan)
          }}
        </span>
        <span v-if="props.rows?.place_task" class="q-ml-md">
          場所： {{ props.rows?.place_task }}
        </span>
      </div>
      <div
        @click="onRowClick(props.rows)"
        class="body1 text-grey-900 q-mb-md"
        v-if="props.rows?.memo_task_todo"
      >
        {{ props.rows?.memo_task_todo }}
      </div>
      <div class="body1 text-grey-900 q-mb-md" v-if="props.rows?.id_pet">
        対象ペット:
        <span
          class="blue text-underline cursor-pointer"
          @click="handlePetLink(props.rows)"
          >{{ props.rows?.name_pet }}</span
        >
      </div>
      <div class="body1 column text-grey-900" @click="onRowClick(props.rows)">
        <div v-if="props.rows?.id_category1" class="q-mb-sm">
          {{ getCategoryName(props.rows?.id_category1) }} •
          {{ getCategoryName(props.rows?.id_category2) }}
        </div>
        <div v-if="props.rows?.id_employee_staff" class="q-mb-sm">
          主担当者：
          {{ getEmpDetails(props.rows?.id_employee_staff)?.name_family }}
        </div>
        <div v-if="props.rows?.datetime_request" class="q-mb-md">
          <span>
            <span class="field-label1">依頼日</span>
            {{
              formatDate(props.rows?.datetime_request) +
              ' ' +
              formatHoursMinutes(props.rows?.datetime_request)
            }}
            {{
              getEmpDetails(props.rows?.id_employee_request)?.name_kana_family
            }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="taskCopiedList?.length > 0" class="col-6">
      <div
        v-if="props.rows.flg_start_arroval_required"
        class="q-mt-md row justify-center items-center"
      >
        <div class="column justify-center detailsStatusBox">
          <q-btn
            class="progress-btn approve-required"
            padding="15px 25px"
            unelevated
          >
            <q-icon class="q-mr-sm" name="done" size="18px" />
            承認
          </q-btn>
          <div class="flex items-center justify-center q-mt-sm">11:45</div>
          <div class="flex items-center justify-center">佐藤先生</div>
        </div>
      </div>
    </div>
    <div v-else class="col-6">
      <div class="q-mt-md row justify-start items-center">
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center text-center"
            @click="handleStatus(0, props.rows)"
          >
            <MtstatusCheckCircle
              :statusChecked="isApproved && props.rows?.flg_prepared"
              :customClass="props.customClassCircle"
            />
            <div class="column items-center datetime">
              <div v-if="props.rows?.flg_prepared">
                <span
                  :class="
                    props.rows?.flg_prepared ? 'text-grey-800' : 'text-grey-400'
                  "
                  >依頼済</span
                >
              </div>
              <div v-else>
                <span class="text-darkred">未承認</span>
              </div>
              <div v-if="props.rows?.datetime_approved">
                {{
                  props.rows?.datetime_approved
                    ? formatHoursMinutes(props.rows?.datetime_approved)
                    : ''
                }}
              </div>
              <div v-else-if="props.rows?.flg_prepared">
                {{
                  props.rows?.datetime_request
                    ? formatHoursMinutes(props.rows?.datetime_request)
                    : ''
                }}
              </div>
              <div>
                {{
                  props.rows?.id_employee_request
                    ? getEmpDetails(props.rows?.id_employee_request)
                        ?.name_display
                    : ''
                }}
              </div>
            </div>
          </div>
          <div
            class="bg-accent-200 statusDivider"
            :class="props.customClassCircle"
          ></div>
        </div>
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center text-center"
            @click="handleStatus(1, props.rows)"
          >
            <MtstatusCheckCircle
              :customClass="
                props.customClassCircle +
                ' ' +
                (!props.rows?.flg_prepared ? 'disable' : '')
              "
              :statusChecked="isApproved && props.rows?.flg_checked"
            />
            <div class="column items-center datetime">
              <div>
                <span
                  :class="
                    isApproved && rows?.flg_checked
                      ? 'text-grey-800'
                      : 'text-grey-400'
                  "
                  >確認済</span
                >
              </div>
              <div>
                {{
                  props.rows?.datetime_checked
                    ? formatHoursMinutes(props.rows?.datetime_checked)
                    : ''
                }}
              </div>
              <div>
                {{
                  props.rows?.id_employee_checked
                    ? getEmpDetails(props.rows?.id_employee_checked)
                        ?.name_display
                    : ''
                }}
              </div>
            </div>
          </div>
          <div
            class="bg-accent-200 statusDivider"
            :class="props.customClassCircle"
          ></div>
        </div>
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center"
            @click="handleStatus(2, props.rows)"
          >
            <MtstatusCheckCircle
              :customClass="
                props.customClassCircle +
                ' ' +
                (!props.rows?.flg_checked ? 'disable' : '')
              "
              :statusChecked="isApproved && props.rows?.flg_started"
            />
            <div class="column items-center datetime">
              <div>
                <span
                  :class="
                    isApproved && rows?.flg_started
                      ? 'text-grey-800'
                      : 'text-grey-400'
                  "
                  >着手済</span
                >
              </div>
              <div>
                {{
                  props.rows?.datetime_started
                    ? formatHoursMinutes(props.rows?.datetime_started)
                    : ''
                }}
              </div>
              <div>
                {{
                  props.rows?.id_employee_started
                    ? getEmpDetails(props.rows?.id_employee_started)
                        ?.name_display
                    : ''
                }}
              </div>
            </div>
          </div>
          <div
            class="bg-accent-200 statusDivider"
            :class="props.customClassCircle"
          ></div>
        </div>
        <div>
          <div class="row justify-center items-start detailsStatusBox">
            <div
              class="column justify-center items-center"
              @click="handleStatus(3, props.rows)"
            >
              <MtstatusCheckCircle
                :customClass="
                  (!props.rows?.flg_started ? 'disable' : '') +
                  ' ' +
                  props.customClassCircle
                "
                :statusChecked="isApproved && props.rows?.flg_completed"
              />
              <div class="column items-center datetime">
                <div>
                  <span
                    :class="
                      isApproved && rows?.flg_completed
                        ? 'text-grey-800'
                        : 'text-grey-400'
                    "
                    >完了</span
                  >
                </div>
                <div>
                  {{
                    props.rows?.datetime_completed
                      ? formatHoursMinutes(props.rows?.datetime_completed)
                      : ''
                  }}
                </div>
                <div>
                  {{
                    props.rows?.id_employee_completed
                      ? getEmpDetails(props.rows?.id_employee_completed)
                          ?.name_display
                      : ''
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row justify-start q-mt-lg">
        <q-btn
          v-if="props.rows?.flg_start_arroval_required"
          :class="{
            active:
              props.rows?.flg_start_arroval_required &&
              !props.rows?.flg_approved,
            disable: !props.rows?.flg_start_arroval_required,
            approved: props.rows?.flg_approved
          }"
          class="progress-btn"
          padding="2px 20px"
          unelevated
        >
          <q-icon name="done" size="16px" />
          承認
        </q-btn>
        <q-btn
          v-if="props.rows?.type_task_review !== 99"
          :class="{
            approved: props.rows?.flg_task_reviewed1,
            disable: !props.rows?.flg_task_reviewed1
          }"
          class="progress-btn"
          padding="2px 20px"
          unelevated
        >
          <q-icon name="done" size="16px" />
          最終1
        </q-btn>
        <q-btn
          v-if="props.rows?.type_task_review === 2"
          :class="{
            approved: props.rows?.flg_task_reviewed2,
            disable: !props.rows?.flg_task_reviewed2
          }"
          class="progress-btn"
          padding="2px 20px"
          unelevated
        >
          <q-icon name="done" size="16px" />
          最終2
        </q-btn>
      </div>
    </div>
    <div v-if="taskCopiedList?.length > 0" class="row col-12 q-mt-md">
      <MtTable2
        :dense="true"
        :columns="columns"
        :rows="taskCopiedList"
        :sticky="false"
      >
        <template v-slot:row="{ row }">
          <td v-for="(col, index) in columns" :key="index" class="col-auto">
            <div
              v-if="col.field == 'val_order'"
              class="body1 bold text-grey-500 reduce-padding"
            >
              {{ row['val_order'] }}
            </div>
            <div
              v-else-if="col.field == 'datetime_plan'"
              class="text-grey-500 caption1"
            >
              {{ formatDateDisplay(row['datetime_plan']) }}
            </div>
            <div
              v-else-if="col.field == 'title_task'"
              class="text-left text-grey-700"
              @click="updateFlgComplete(row)"
            >
              <div v-if="row['flg_completed']">
                {{ getCompleteInfo(row) }}
              </div>
              <div v-else @click="handleStatusUpdateRepetitiveTask(row)">
                <MtstatusCheckCircle
                  :customClass="
                    getCustomClassName(row) + ' ' + props.customClassCircle
                  "
                  :statusChecked="row['flg_checked']"
                />
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.statusDivider {
  width: 75px;
  height: 2px;
  margin-top: 35px;
}
.statusDivider.small {
  width: 50px;
  margin-top: 15px;
}
.light-grey-box {
  background-color: $grey-050;
  border-left: 5px solid $grey-700;
  .q-stepper {
    background-color: $grey-050;
  }
}
.grey-box {
  background-color: $grey-300;
  border-left: 5px solid $grey-500;
  .q-stepper {
    background-color: $grey-300;
  }
}
.red-box {
  background-color: #f9e6ea;
  border-left: 5px solid $negative;
  .q-stepper {
    background-color: #f9e6ea;
  }
}
.progress-btn {
  border-radius: 8px;
  margin-right: 1em;
  &.approved {
    background-color: $accent-200;
    color: $accent-900;
    border: 2px solid $accent-900;
  }
  &.active {
    background-color: $accent-050;
    color: $accent-200;
    border: 2px solid $accent-200;
  }
  &.disable {
    background-color: $grey-100;
    color: $grey-300;
    border: 2px solid $grey-300;
  }
  &.approve-required {
    border-radius: 20px;
    background-color: $grey-200;
    color: $grey-800;
    border: 2px solid $grey-600;
  }
}
.reduce-padding {
  padding-left: 2px;
  padding-right: 2px;
}
</style>
