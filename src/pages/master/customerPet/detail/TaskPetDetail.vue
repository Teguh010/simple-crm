<script setup lang="ts">
import useTask from '@/stores/task'
import ViewTaskDetailModal from '@/pages/task/ViewTaskDetailModal.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { storeToRefs } from 'pinia'
import { computed, onMounted, ref } from 'vue'
import { fromPairs, groupBy, orderBy } from 'lodash'
import useCategoryStore from '@/stores/categories'
import useEmployeeStore from '@/stores/employees'
import { dateFormat, formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { date } from 'quasar'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { typeLink1 } from '@/utils/enum'
import selectOptions from '@/utils/selectOptions'

const props = defineProps({ id_pet: String, fixedFilter: { type: Boolean, default: false } })
const taskStore = useTask()
const categoryStore = useCategoryStore()
const employeeStore = useEmployeeStore()
const { getTasks } = storeToRefs(taskStore)
const yearPeriod = ref('last90days')
const typeLink = ref()

const apiCalled = ref(false)
const taskListByPet = ref([])
const alreadyVisited = ref([])
const nextPage = ref(null)

const typeLinkName = (value) => typeLink1.find(item => item.value === value)?.label
const filter = async () => {
  let startDate, endDate, currentDate
  if(yearPeriod.value === 'last90days') {
    // get last 90 days
   endDate = getDateToday()
   startDate = dateFormat(new Date(new Date().setDate(new Date(endDate).getDate() - 90)))
  }
  else if(yearPeriod.value === 'current') {
    // set start date as first date of current year, end date as today
   endDate = getDateToday()
   startDate = dateFormat(date.adjustDate(new Date(endDate), {year: new Date(endDate).getFullYear(), month: 1, day: 1}))
  }
  else if(yearPeriod.value === 'last') {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(date.adjustDate(new Date(currentDate), {year: new Date(currentDate).getFullYear() - 1, month: 1, day: 1}))
    endDate = dateFormat(date.adjustDate(new Date(currentDate), {year: new Date(currentDate).getFullYear() - 1, month: 12, day: 31}))
  }
  let filters = {}
  if (startDate && endDate) Object.assign(filters, {'date_start':  startDate, 'date_end': endDate})
  if (typeLink.value) Object.assign(filters, {'type_link1': typeLink.value})

  return filters
}

const getEmployeeName = (idEmployee: any) => {
  return employeeStore.getAllEmployees.find((employee) => employee.value === idEmployee)?.label
}

const getBgBorderColor = (task:any) => {
  let classes:any = []
  if(task.flg_emargency) classes.push('bg-warning-100 border-red')
  else classes.push('bg-gray-900 border-tosca')
  return classes
}
const openTaskDetail = async (data:any) => {
  taskStore.selectTask(data.id_task)
  await mtUtils.mediumPopup(ViewTaskDetailModal, { data })
  await init()
}

const groupedTaskByData = computed(() => {
  // Grouped task by date
  const grouped = groupBy(taskListByPet.value, (task) => task?.datetime_insert?.substring(0, 10))
  // Create entries to easier the ordering
  const entries = Object.entries(grouped)
  // Process order the data
  const order = orderBy(entries, 
    ([key, value]) => {
      return new Date(key.split('-').reverse().join('-'))
    }, ['desc']
  )

  // Return the actual object data that already sorted.
  return fromPairs(order)
})

const init = async (refreshData: boolean = false) => {
  if(refreshData) {
    taskListByPet.value.length = 0
  } 
  await fetchMoreData(false)
}

defineExpose({ fetchMoreData })

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value,
    order_by: 'datetime_insert'
  }

  if (fetchMore) {
    if (!nextPage.value) {
      await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
      return
    }
  }

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'tasks', filterData, true)

  if (response && response.data) {

    if (!alreadyVisited.value.includes(nextPage.value)) {
      taskListByPet.value.push(...response.data)
      alreadyVisited.value.push(response.current)
    }
    if (response.next) {
      nextPage.value = response.next.split('page=')[1]

    } else {
      nextPage.value = null
    }
  }

}
const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}

onMounted(async () => {
  await init()
})
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar"
    style="width: 100%; max-width: 100%"
    @scroll="handleScroll"
    ref="scrollAreaRef"
  >
    <div>
      <div class="full-width q-pr-lg z-top" :class="props.fixedFilter ? 'bg-white fixed ah-adjust-for-thumb-scroller' : ''">
        <div class="flex no-wrap items-center q-mb-md" style="gap: 13px">
          <div style="flex: 1">
            <MtFormPullDown
              type="selection"
              label="関連区分"
              v-model:selected="typeLink"
              :options="typeLink1"
              autofocus
              @onEnterPress="init"
            />
          </div>
          <div>
            <MtFormRadiobtn label="直近90日" v-model="yearPeriod" val="last90days" />
            <MtFormRadiobtn label="今年" v-model="yearPeriod" val="current" /> 
            <MtFormRadiobtn label="去年" v-model="yearPeriod" val="last" /> 
            <MtFormRadiobtn label="全期間" v-model="yearPeriod" val="all" /> 
          </div>
          <div>
            <q-btn 
              
              unelevated
              @click="init"
              color="accent-800"
              text-color="white"
            >
              <q-icon size="20px" name="search" />検索
            </q-btn>
          </div>
        </div>
      </div>
        <q-list v-if="taskListByPet && taskListByPet.length > 0" :class="props.fixedFilter ? 'q-pt-xxl' : ''">
        <template v-for="(item, date) in groupedTaskByData" >
          <div class="text-grey-500 q-mt-md q-mb-sm"> {{date}} </div>
            <q-item 
              v-for="(task, idx) in groupedTaskByData[date]" 
              :key="task.id_task" 
              class="q-mb-md task-item" 
              :class="getBgBorderColor(task)" 
              clickable @click="openTaskDetail(task)">
              <q-item-section class="col q-mr-lg">
                <q-btn v-if="task.flg_emargency && !task.flg_completed" color="danger" class="body2 q-mb-sm" style="width: 80px;">
                  <q-icon name="warning" size="12px" class="q-pr-sm" />
                  <span>至急</span>
                </q-btn>
                <div class="title2 bold text-grey-900 q-mr-md">
                  {{ task.title_task }}
                </div>
                <div class="flex q-mt-md">
                  <span v-if="task?.number_task" class="q-mr-md">
                    <span class="field-label1">タスク番号</span>
                    {{ task.number_task }}
                  </span>
                  <span v-if="task?.number_link1" class="q-mr-md">
                    <span class="field-label1">関連</span>
                    {{ typeLinkName(task.type_link1) }}
                  </span>
                  <span v-if="task?.number_link1" class="q-mr-md">
                    <span class="field-label1">関連番号</span>
                    {{ task.number_link1 }}
                  </span>
                </div>
                <div v-if="task?.datetime_plan && !task.flg_completed" class="q-mt-md">
                  <span class="q-mr-md">
                    <span class="field-label1">予定完了</span>
                    {{formatDateWithTime(task.datetime_plan)}}
                  </span>
                </div>
              </q-item-section>
              <q-item-section class="col-4">
                <div class="flex">
                  <span class="text-grey-800 q-mr-md">
                    <small class="q-mr-xs">
                      <span class="field-label1">ステータス</span>
                      <span v-if="task.flg_completed">
                        <q-icon name="check_circle" size="15px" class="green q-pr-xs" />
                        完了
                      </span>
                      <span v-else>
                        <q-icon name="cancel" size="15px" class="text-darkred q-pr-xs" />
                        未完了
                      </span>
                    </small>
                  </span>
                  <!-- <span class="text-grey-600 q-mr-md">
                    <small v-if="task?.id_category1" class="q-mr-xs">
                      <span class="field-label1">分類</span>
                      {{ getCategoryName(task.id_category1) }} 
                      <q-icon name="play_arrow" size="10px" class="q-px-sm"/> 
                      {{ getCategoryName(task.id_category2) }}
                    </small>
                  </span>  -->
                </div>
                <div v-if="task.place_task" class="q-mt-md">
                  <span class="field-label1">担当（部門）</span>
                  {{task.place_task}} {{getEmployeeName(task.id_employee_staff)}}
                </div>
              </q-item-section>
            </q-item>
        </template>
      </q-list>
      <p v-else class="q-pl-md text-grey-500">
        タスクはありません。
      </p>
    </div>
  </q-scroll-area>
</template>
<style lang="scss" scoped>
.task-item {
  margin-left: 10px;
  border-left: 8px solid;
  border-bottom-left-radius: 6px;
  border-top-left-radius: 6px;
  &.border-tosca {
    border-color: $tosca;
  }
  &.border-red {
    border-color: $darkRed;
  }
}
</style>
