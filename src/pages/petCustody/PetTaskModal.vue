<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateToday } from '@/utils/aahUtils'
import MtFormCheckBoxMultiple from '@/components/form/MtFormCheckBoxMultiple.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useTask from '@/stores/task'
import { storeToRefs } from 'pinia'
import _ from 'lodash'
import TodoTaskItem from '@/pages/task/TodoTaskItem.vue'
import { TaskType } from '@/types/types'

const props = defineProps<{
  id_pet: string
  id_request: string
  id_customer: string
  name_pet: string
  custody: Object
}>()
const taskStore = useTask()
const { getTasks, getTaskRequests } = storeToRefs(taskStore)
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const data = ref({
  date: getDateToday(),
  dateType: 'today',
  location: []
})
const taskData = ref({
  type_task_place: null,
  date_type: 'datetime_plan',
  order_by: 'asc',
  datetime_plan: data.value.date,
  id_pet: null
})
const rows = ref<Array<TaskType>>([])
const allRows = ref<Array<TaskType>>([])
const totalTask = ref(0)
const incompleted = ref(0)
const emergency = ref(0)
const flgCompleted = ref(0)
const flgApproved = ref(0)
const finalApproval = ref(0)
const taskLocations = ref([
  {
    label: '犬舎1',
    value: 1
  },
  {
    label: '犬舎2',
    value: 2
  },
  {
    label: '犬舎3',
    value: 3
  },
  {
    label: '美容',
    value: 4
  }
])
const tab = ref('全て')
const params = ref({})
const refresh = ref(false)
const init = async () => {
  if (getTasks.value) {
    if (tab.value == '全て') {
      rows.value = getTasks.value.filter((tsk) => {
        return tsk.flg_closed === false && tsk?.val_order <= 1
      })

      allRows.value = rows.value
      rows.value = _.sortBy(rows.value, 'number_task', 'desc')
    } else if (tab.value == '未完了') {
      rows.value = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.id_pet === props.id_pet &&
          tsk.id_customer === props.id_customer &&
          tsk.flg_started === false
        )
      })
    } else if (tab.value == '至急') {
      rows.value = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.id_pet === props.id_pet &&
          tsk.id_customer === props.id_customer &&
          tsk.flg_emargency === true
        )
      })
    } else if (tab.value == '完了') {
      rows.value = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.id_pet === props.id_pet &&
          tsk.id_customer === props.id_customer &&
          tsk.flg_completed === false
        )
      })
    } else if (tab.value == '事前承認待ち') {
      rows.value = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.id_pet === props.id_pet &&
          tsk.id_customer === props.id_customer &&
          tsk.flg_approved === false
        )
      })
    } else if (tab.value == '最終承認待ち') {
      rows.value = getTasks.value.filter((tsk) => {
        return (
          tsk.flg_closed === false &&
          tsk.id_pet === props.id_pet &&
          tsk.id_customer === props.id_customer &&
          tsk.flg_start_arroval_required === true &&
          tsk.flg_completed === true
        )
      })
    }

    totalTask.value = allRows.value.length
    const incomplete = allRows.value.filter((tsk) => {
      return tsk.flg_closed === false && tsk.flg_started === false
    })
    incompleted.value = incomplete?.length
    const emer = allRows.value.filter((tsk) => {
      return (
        tsk.flg_closed === false &&
        tsk.flg_completed === false &&
        tsk.flg_emargency === true
      )
    })
    emergency.value = emer?.length
    const flgc = allRows.value.filter((tsk) => {
      return tsk.flg_closed === false && tsk.flg_completed === false
    })
    flgCompleted.value = flgc?.length
    const flgA = allRows.value.filter((tsk) => {
      return tsk.flg_closed === false && tsk.flg_approved === false
    })
    flgApproved.value = flgA?.length
    const flgApproval = allRows.value.filter((tsk) => {
      return (
        tsk.flg_closed === false &&
        tsk.flg_start_arroval_required === true &&
        tsk.flg_completed === true
      )
    })
    finalApproval.value = flgApproval?.length
  }
}
const changeDate = async (prefix: string) => {
  data.value.dateType = prefix
  if (prefix != 'today') {
    if (taskData.value.datetime_plan === null) {
      taskData.value.datetime_plan = getDateToday()
    }
    taskData.value.datetime_plan = changeDate(data.value.date, prefix)
    data.value.date = taskData.value.datetime_plan
  } else {
    taskData.value.datetime_plan = getDateToday()
    data.value.date = getDateToday()
  }

  await taskStore.fetchTask({
    ...taskData.value,
    id_request: props.id_request
  })
  refresh.value = false
  await init()
  refresh.value = true
}
const changeTab = (tab: string) => {
  init()
}

const getRowStatus = (item: TaskType) => {
  if (item.flg_emargency) return 'red-box'
  if (item.flg_completed) return 'grey-box'
  if (!item.flg_emargency || !item.flg_completed) return 'light-grey-box'
}

onMounted(async () => {
  params.value = {
    ...taskData.value,
    id_request: props.id_request
  }
  await taskStore.fetchTask(params.value)
  init()
  refresh.value = true
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      <div class="flex items-center justify-between">
        <div>{{ props.name_pet }} ({{ totalTask }})</div>
        <div class="flex items-center">
          <q-btn
            class="q-mr-sm"
            flat
            label="今日"
            padding="4px 10px"
            style="border: 1px solid #9e9e9e"
            unelevated
            @click="changeDate('today')"
          />
          <q-btn
            flat
            icon="chevron_left"
            padding="2px"
            style="border: 1px solid #9e9e9e"
            unelevated
            @click="changeDate('prev')"
          />
          <MtFormInputDate
            v-model:date="data.date"
            class="search-field q-mx-xs"
            outlined
            type="date"
            @update:date="changeDate('selected')"
          />
          <q-btn
            flat
            icon="chevron_right"
            padding="2px"
            style="border: 1px solid #9e9e9e"
            unelevated
            @click="changeDate('next')"
          />
          <q-btn
            class="q-ml-sm"
            flat
            label="全日程"
            padding="4px 10px"
            style="border: 1px solid #9e9e9e"
            unelevated
            @click="changeDate('allSchedule')"
          />
        </div>
      </div>
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content">
    <div class="row q-gutter-md justify-end q-mb-md">
      <div class="flex items-center">
        <MtFormCheckBoxMultiple
          :items="taskLocations"
          class="q-mr-md"
          v-model:checked="data.location"
        />
      </div>
    </div>
    <div class="row q-gutter-md q-mb-md">
      <div class="row items-center q-mb-sm">
        <div class="col-auto">
          <q-tabs
            v-model="tab"
            active-bg-color="grey-700"
            active-class="text-white bold body1"
            class="ticket-tabs"
            dense
            indicator-color="grey-300"
            inline-label
            @update:model-value="changeTab"
          >
            <q-tab label="全て" name="全て" />
            <q-tab :label="'未完了 (' + incompleted + ')'" name="未完了" />
            <q-tab :label="'至急 (' + emergency + ')'" name="至急" />
            <q-tab :label="'完了 (' + flgCompleted + ')'" name="完了" />
            <q-tab
              :label="'事前承認待ち (' + flgApproved + ')'"
              name="事前承認待ち"
            />
            <q-tab
              :label="'最終承認待ち (' + finalApproval + ')'"
              name="最終承認待ち"
            />
          </q-tabs>
        </div>
      </div>
    </div>
    <div class="row q-gutter-md q-mb-md" v-if="rows.length">
      <TodoTaskItem
        v-for="(item, i) in rows"
        v-if="refresh"
        :key="i"
        :rows="item"
        :status="getRowStatus(item)"
        :date-type="data.dateType"
        class="q-ml-md q-pl-md"
        @fetch-list="changeDate('today')"
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>閉じる</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
