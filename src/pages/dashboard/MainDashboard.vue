<script lang="ts" setup>
import { onMounted, ref, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Components
import MtTable2 from '@/components/MtTable2.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'

// Lazy-loaded Components (if applicable)
const ViewEmpInfoModal = defineAsyncComponent(() => import('@/pages/empInfo/ViewEmpInfoModal.vue'))

// Stores
import useAuthStore from '@/stores/auth'
import useEmployeeStore from '@/stores/employees'
import useTask from '@/stores/task'
import useEmpInfoStore from '@/stores/empInfo'
import { useDashboardStore } from '@/stores/dashboard'
import useCliCommonStore from '@/stores/cli-common'
// Types
import {
  CliCommon,
  Common,
  EmployeeType,
  MessageThreadType,
  TaskType
} from '@/types/types'

// Utils
import { formatDate, formatHoursMinutes } from '@/utils/aahUtils'
import { typeThreadClassification, typeEmpInfo } from '@/utils/enum'
import { orderBy } from 'lodash'
import dayjs from 'dayjs'
import mtUtils from '@/utils/mtUtils'

const router = useRouter()
const authStore = useAuthStore()
const employeeStore = useEmployeeStore()
const taskStore = useTask()
const cliCommonStore = useCliCommonStore()
const empInfoStore = useEmpInfoStore()

const { getAuthUser } = storeToRefs(authStore)

const { getEmployees } = storeToRefs(employeeStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)

const dashboardStore = useDashboardStore();
const getDashboard = computed(() => dashboardStore.state.dashboard)
const getBusinessPlanToday = computed(() => dashboardStore.state.business_plan_today)

const typeDeptList = ref(<Array<Common>>[])
const notificationListByPerson = ref([])

const threadColumns = [
  {
    name: 'datetime_update',
    label: '最新メッセージ日時',
    field: 'datetime_update',
    align: 'left'
  },
  {
    name: 'owner_name',
    label: 'オーナー名',
    field: 'owner_name',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'name_thread',
    label: 'スレッド名',
    field: 'name_thread',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'status',
    label: '状態',
    field: 'status',
    align: 'left'
    // stlye: 'width: 50%'
  }
]

const threadRows = [
  {
    thread_time: '2024/05/18 10:10',
    owner_name: '安藤裕子',
    thread_name: 'ホテル予約',
    status: '申請中'
  },
  {
    thread_time: '2024/05/18 11:10',
    owner_name: '相田美沙',
    thread_name: 'ホテル予約',
    status: '確定済'
  }
]

const hospitalColumns = [
  {
    name: 'datetime_update',
    label: '最新メッセージ日時',
    field: 'datetime_update',
    align: 'left'
  },
  {
    name: 'id_employee_ask',
    label: '質問者',
    field: 'id_employee_ask',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'id_employee_answer',
    label: '対象者',
    field: 'id_employee_answer',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'purpose',
    label: '目的',
    field: 'purpose',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'name_thread',
    label: 'スレッド名',
    field: 'name_thread',
    align: 'left'
    // stlye: 'width: 50%'
  }
]

const departmentTaskColumns = [
  {
    name: 'datetime_request',
    label: '最新メッセージ日時',
    field: 'datetime_request',
    align: 'left'
  },
  {
    name: 'id_employee_request',
    label: '依頼者',
    field: 'id_employee_request',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'id_employee_staff',
    label: '主担当者',
    field: 'id_employee_staff',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'title_task',
    label: 'タスク名',
    field: 'title_task',
    align: 'left',
    stlye: 'width: 50%'
  },
  {
    name: 'status',
    label: '状態',
    field: 'status',
    align: 'left'
    // stlye: 'width: 50%'
  }
]

const empInfoColumns = [
  {
    name: 'type_emp_info',
    label: '連絡区分',
    field: 'type_emp_info',
    align: 'left',
    stlye: 'width: 15%'
  },
  {
    name: 'id_employee_posted',
    label: 'From',
    field: 'id_employee_posted',
    align: 'left',
    stlye: 'width: 15%'
  },
  {
    name: 'title',
    label: 'タイトル',
    field: 'title',
    align: 'left',
    stlye: 'width: 20%'
  },
  {
    name: 'memo_emp_info',
    label: '連絡内容',
    field: 'memo_emp_info',
    align: 'left',
    stlye: 'width: 50%'
  },
]

const selectedDepartment = ref(localStorage.getItem('userTypeDepartment'))
const selectedEmployee = ref(localStorage.getItem('id_employee'))

const handleThreadType = (value: number) => {
  return typeThreadClassification.find((items: any) => items.value === value)
    ?.label
}

const openMessageClinic = (message_thread: MessageThreadType) => {
  let link = router.resolve({
    name: 'MessageClinic',
    query: { mt: message_thread.id_message_thread }
  })?.href
  if (link) {
    window.open(link, '_blank')
  }
}

const openDetailTaskPage = (task: TaskType) => {
  taskStore.selectTask(task.id_task)
  localStorage.setItem('pageAction', 'taskDetails')
  localStorage.setItem('pageActionParam', task.id_task)

  let link = router.resolve({
    name: 'SearchTaskList',
    query: { id: task.id_task }
  })?.href
  if (link) {
    window.open(link, '_blank')
  }
}
const openTaskPage = (task: TaskType) => {
  let link = router.resolve({ name: 'SearchTaskList' })?.href
  if (link) {
    window.open(link, '_blank')
  }
}
const openCustomerMessagePage = () => {
  let link = router.resolve({ name: 'MessageCustomer' })?.href
  if (link) {
    window.open(link, '_blank')
  }
}
const openMessageClinicPage = () => {
  let link = router.resolve({ name: 'MessageClinic' })?.href
  if (link) {
    window.open(link, '_blank')
  }
}
const openClinicPlanList = () => {
  let link = router.resolve({ name: 'SearchClinicPlanList' })?.href
  if (link) {
    window.open(link, '_blank')
  }
}
const openEmpInfoListPage = () => {
  let link = router.resolve({ name: 'SearchEmpInfoList' })?.href
  if (!link) return
  
  // For iOS/iPad Safari
  if (navigator.userAgent.match(/ipad|iphone|ipod/i)) {
    // Create and trigger a click on an anchor element
    const a = document.createElement('a')
    a.setAttribute('href', link)
    a.setAttribute('target', '_blank')
    a.setAttribute('rel', 'noopener noreferrer')
    
    // The element needs to be on the DOM for Safari
    document.body.appendChild(a)
    a.click()
    
    // Clean up
    document.body.removeChild(a)
  } else {
    // For other browsers, continue using window.open
    window.open(link, '_blank')
  }
}

const getEmployeeName = (id_employee: number) => {
  const employee = getEmployees.value.find(
    (v: EmployeeType) => v.id_employee === id_employee
  )
  return employee?.name_display
}

const changeSelectedDepartment = async (v: string) => {
  dashboardStore.setSelectedDepartment(v)
  await init()
}

const init = async () => {
  if (
    getAuthUser.value.id_clinic_list.length > 1 &&  
    !localStorage.getItem('selectedClinic')             
  ) {
    return
  }
  dashboardStore.setSelectedDepartment(selectedDepartment.value)
  const storedClinicId = localStorage.getItem('id_clinic')
  const authClinicID = authStore!.getAuthUser?.id_clinic;  

  await mtUtils.promiseAllWithLoader([
    dashboardStore.fetchDashBoard({
      type_department: selectedDepartment.value,
      id_clinic: authClinicID ?? storedClinicId,
      id_employee: selectedEmployee.value,
      type_department: selectedDepartment.value
    })])


  let listPerPerson = <any>[]

  // Count Customer Message List Per Person
  getDashboard.value.department_message_thread_list.filter((data) => {
    return data.type_department === parseInt(selectedDepartment.value)
  }).forEach((curr) => {
    const data = listPerPerson.find(
      (item) => item.id_employee === curr.id_employee_answer
    )
    if (data) data.count_customer_mtl++
    else
      listPerPerson.push({
        id_employee: curr.id_employee_answer,
        count_customer_mtl: 1,
        count_clinic_mtl: 0,
        count_task_list: 0
      })
  })

  // Count Task List Per Person
  getDashboard.value.task_list.filter((data) => {
    return data.type_department === parseInt(selectedDepartment.value)
  }).forEach((curr) => {
    const data = listPerPerson.find(
      (item) => item.id_employee === curr.id_employee_staff
    )
    if (data) data.count_task_list++
    else
      listPerPerson.push({
        id_employee: curr.id_employee_staff,
        count_customer_mtl: 0,
        count_clinic_mtl: 0,
        count_task_list: 1
      })
  })

  notificationListByPerson.value = orderBy(listPerPerson, 'id_employee')
}

// this function use for Auto Reset Password
function daysBetweenDates(date: string): number {
  const givenDate: Date = new Date(date)
  const currentDate: Date = new Date()
  const differenceInMilliseconds: number =
    currentDate.getTime() - givenDate.getTime()
  const millisecondsPerDay: number = 1000 * 60 * 60 * 24
  const differenceInDays: number = differenceInMilliseconds / millisecondsPerDay

  return Math.floor(differenceInDays)
}

const loginPasswordUpdatedDays = daysBetweenDates(
  authStore!.getAuthUser?.datetime_login_pw_updated as string
)

const isNotificationEmpty = computed(() => {
  const { employee_message_thread_list, department_message_thread_list, task_list } = getDashboard.value;

  return (
    getDashboard.value &&
    (
      (employee_message_thread_list && employee_message_thread_list.length > 0) ||
      (department_message_thread_list && department_message_thread_list.length > 0) ||
      (task_list && task_list.length > 0)
    )
  );
});

const getTypeEmpInfo = (type_emp_info: number) => typeEmpInfo.find((item: any) => item.value === type_emp_info)?.label

const openViewEmpInfoModal = async (row: typeEmpInfo) => {
  let attr = {
    isConfirmed: false
  }
  await empInfoStore.selectEmpInfo(row.id_emp_info)
  await mtUtils.smallPopup(ViewEmpInfoModal, {data: row, attr})
  if(attr.isConfirmed) {
    init()
  }
}

const getEmployeeInfo = (id: number) => {
  const info = getEmployees.value.find((emp: EmployeeType) => {
    return emp.id_employee === id
  })

  return {
    name: info?.name_display,
    picture: info?.image_path1
  }
}

const departmentTaskList = computed(() => {
  return getDashboard.value.task_list.filter((task) => {
    return task.type_department === parseInt(selectedDepartment.value)
  })
})

const empMessageThreadList = computed(() => {
  return getDashboard.value.employee_message_thread_list.filter((msg) => {
    return msg.type_department === parseInt(selectedDepartment.value)
  })
})

onMounted(async () => {
  await employeeStore.fetchEmployees()
  typeDeptList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))
  if (getAuthUser.value)
    selectedDepartment.value = getAuthUser.value.type_department
      ? getAuthUser.value.type_department
      : 1


  init()
})
</script>

<template>
  <div class="row">
    <div class="col-xs-12 col-sm-6 col-md-4" style="max-height: calc(100vh - 60px); overflow-y: scroll;">
      <aside class="container-aside">
        <div class="aside-title">
          <q-space></q-space>
          <MtFormPullDown
            v-model:selected="selectedDepartment"
            @update:selected="changeSelectedDepartment"
            :clearable="false"
            :options="typeDeptList"
            class="department-pulldown q-mr-sm"
            label="部署"
            outlined
          />
          <InputEmployeeOptGroup
            v-model:selected="selectedEmployee"
            :department-selected="selectedDepartment?.toString()"
            class="w-200 q-pa-none"
            label="担当者 *"
            show-select-default-employee
            @update:selected="init()"
          />
        </div>
        <template v-if="isNotificationEmpty">
          <div class="all-department">
            <div class="divider">
              <span class="body1 bold text-accent-800">部門全体</span>
            </div>
            <div class="all-notifications">
              <div class="notification-content">
                <p class="notification-title">
                  <q-icon class="notification-icon" name="app_shortcut"/>
                  予約受付スレッド
                </p>
                <span class="notification-count">{{
                    empMessageThreadList?.length
                }}</span>
              </div>
              <div class="notification-content">
                <p class="notification-title">
                  <q-icon class="notification-icon" name="forum"/>
                  院内メッセージ
                </p>
                <span class="notification-count">{{
                  getDashboard.department_message_thread_list?.length
                }}</span>
              </div>
              <div class="notification-content">
                <p class="notification-title">
                  <q-icon class="notification-icon" name="assignment_turned_in"/>
                  部門宛タスク
                </p>
                <span class="notification-count">{{
                  departmentTaskList?.length
                }}</span>
              </div>
            </div>
          </div>
          <div class="assignments">
            <div class="divider">
              <span class="body1 bold text-accent-800">担当者別</span>
            </div>
            <div v-for="employee in notificationListByPerson" class="row">
              <div class="col-8">
                <span>{{
                  employee.id_employee
                    ? getEmployeeName(employee.id_employee)
                    : '🐶😸'
                }}</span>
              </div>
              <div class="col-2">
                <span class="assignment-count">
                  <q-icon name="forum" /> {{ employee.count_customer_mtl }}
                </span>
              </div>
              <div class="col-2">
                <span class="assignment-count">
                  <q-icon name="assignment_turned_in" />
                  {{ employee.count_task_list }}
                </span>
              </div>
            </div>
          </div>
        </template>
        <div class="noTaskImg" v-else>
          <q-img
            src="@/assets/img/task/no_top_task.png"
            style="width: 70%"
            alt="no_task"
            loading="lazy"
            spinner-color="white"
          />
        </div>
      </aside>
    </div>
    <div class="col-xs-12 col-sm-6 col-md-8">
      <main class="container-main">
        <div class="card">
          <div class="card-main">
            <div v-if="getBusinessPlanToday.normal" class="time-table">
              <span class="body1">{{ getBusinessPlanToday?.normal?.name_business_hour }}</span>
              <div v-if="getBusinessPlanToday.normal.time_business_start1" class="body2">
                時間枠1 {{ getBusinessPlanToday.normal.time_business_start1 }} ～
                {{ getBusinessPlanToday.normal.time_business_end1 }}
              </div>
              <div v-if="getBusinessPlanToday.normal.time_business_start2" class="body2">
                時間枠2 {{ getBusinessPlanToday.normal.time_business_start2 }} ～
                {{ getBusinessPlanToday.normal.time_business_end2 }}
              </div>
              <div v-if="getBusinessPlanToday.normal.time_business_start3" class="body2">
                時間枠3 {{ getBusinessPlanToday.normal.time_business_start3 }} ～
                {{ getBusinessPlanToday.normal.time_business_end3 }}
              </div>

            </div>
            <div class="divider" />

            <!-- today clinic plan -->
            <div class="time-table">
              <div class="time-table-header">
                <span class="body1 bold text-grey-800">今日の院内予定</span>
                <template v-if="getDashboard && getDashboard.clinical_plan_today && getDashboard.clinical_plan_today?.length > 3">
                  <span class="body1 text-blue cursor-pointer" @click="openClinicPlanList">他 {{getDashboard.clinical_plan_today?.length - 3}} 件</span>
                </template>
              </div>

              <template v-if="getDashboard && getDashboard.clinical_plan_today && getDashboard.clinical_plan_today?.length > 0">
                <span v-for="plan in getDashboard.clinical_plan_today?.slice(0, 3)" :key="plan.id_clinic_plan" class="body2">
                  {{
                    plan.datetime_clinic_plan_start ? dayjs(plan.datetime_clinic_plan_start).format('hh:mm') : '-'
                  }} {{plan.title_clinic_plan}}
                </span>
              </template>
              <template v-else>
                <span class="text-grey-500">
                  本日の院内予定なし
                </span>
              </template>
            </div>

            <!-- tomorrow clinic plan -->
            <div class="time-table">
              <span class="body1 bold text-grey-800">明日の院内予定</span>
              <template v-if="getDashboard && getDashboard.clinical_plan_tomorrow">
                <span v-for="plan in getDashboard.clinical_plan_tomorrow" :key="plan.id_clinic_plan" class="body2">
                  {{
                    plan.datetime_clinic_plan_start ? dayjs(plan.datetime_clinic_plan_start).format('hh:mm') : '-'
                  }} {{plan.title_clinic_plan}}
                </span>
              </template>
              <template v-else>
                <span class="text-grey-500">
                  明日の院内予定なし
                </span>
              </template>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="body1 bold">
              <q-icon name="app_shortcut" /> 院内連絡
            </span>
            <div @click="openEmpInfoListPage" class="cursor-pointer text-blue">
              院内連絡
            </div>
          </div>
        <MtTable2
            :columns="empInfoColumns"
            :rows="getDashboard.emp_info_list"
            style="max-height: calc(6 * 48px);overflow-y: auto"
          >
          <template v-slot:row="{ row }">
            <td
                v-for="(col, index) in empInfoColumns"
                :key="index"
                class="cursor-pointer"
              >
                <div @click="openViewEmpInfoModal(row)">
                  <div class="body1 regular text-grey-900" v-if="col.field === 'type_emp_info'">
                    {{ getTypeEmpInfo(row[col.field]) }}
                  </div>
                  <div class="body1 regular text-grey-900" v-else-if="col.field === 'id_employee_posted'">
                    <q-avatar>
                      <img v-if="getEmployeeInfo(row[col.field]).picture" :src="getEmployeeInfo(row[col.field]).picture" alt="profile picture" />
                      <q-icon v-else name="account_circle" size="lg" class="text-grey-500" />
                    </q-avatar>
                    <span>
                      {{ getEmployeeInfo(row[col.field]).name }}
                    </span>
                  </div>

                        
                <div
                  class="body1 regular text-grey-900"
                  v-else-if="col.field === 'title'"
                  style="white-space: normal; word-break: break-word;"
                >
                  {{ row[col.field] }}
                </div>
                <div
                  v-else-if="col.field === 'memo_emp_info'"
                  style="max-width: 40vw; white-space: normal; word-break: break-word;"
                  class="body1 regular text-grey-900"
                  v-html="row[col.field]"
                />
              </div>
            </td>
          </template>
        </MtTable2>
        </div>  
        <div class="card">
          <div class="card-header">
            <span class="body1 bold">
              <q-icon name="app_shortcut" /> {{typeDeptList.find((el) => el.value == selectedDepartment)?.label}} 予約受付スレッド
            </span>
            <div @click="openCustomerMessagePage" class="cursor-pointer text-blue"> 
              予約受付スレッド 
            </div>
          </div>
          <MtTable2
            v-if="getDashboard && getDashboard.department_message_thread_list"
            :columns="hospitalColumns"
            :rows="getDashboard.department_message_thread_list.slice().splice(0, 5)"
          >
            <template v-slot:row="{ row }">
              <td
                @click="openMessageClinic(row)"
                class="cursor-pointer"
                v-for="(col, index) in hospitalColumns"
                :key="index"
              >
                <span v-if="col.field === 'datetime_update'">{{
                  formatDate(row.datetime_update) +
                  ' ' +
                  formatHoursMinutes(row.datetime_update)
                }}</span>
                <span v-else-if="col.field === 'id_employee_ask'">{{
                  getEmployeeName(row.id_employee_ask)
                }}</span>
                <span v-else-if="col.field === 'id_employee_answer'">{{
                  getEmployeeName(row.id_employee_answer)
                }}</span>
                <span v-else-if="col.field === 'purpose'">{{
                  handleThreadType(row?.type_thread)
                }}</span>
                <span v-else-if="col.field === 'name_thread'">{{
                  row.name_thread
                }}</span>
              </td>
            </template>
          </MtTable2>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="body1 bold">
              <q-icon name="forum" /> {{typeDeptList.find((el) => el.value == selectedDepartment)?.label}} 院内メッセージ
            </span>
            <div @click="openMessageClinicPage" class="cursor-pointer text-blue">
              院内メッセージ 
            </div>
          </div>
          <MtTable2
            v-if="getDashboard && getDashboard.employee_message_thread_list"
            :columns="threadColumns"
            :rows="getDashboard.employee_message_thread_list.slice().splice(0, 5)"
          >
            <template v-slot:row="{ row }">
              <td
                @click="openMessageClinic(row)"
                class="cursor-pointer"
                v-for="(col, index) in threadColumns"
                :key="index"
              >
                <span v-if="col.field === 'datetime_update'">{{
                  formatDate(row.datetime_update) +
                  ' ' +
                  formatHoursMinutes(row.datetime_update)
                }}</span>
                <span v-else-if="col.field === 'owner_name'">{{
                  getEmployeeName(row.id_employee_ask)
                }}</span>
                <span v-else-if="col.field === 'name_thread'">{{
                  row.name_thread
                }}</span>
                <span v-else-if="col.field === 'status'">{{
                  row.flg_closed ? '対応済' : '未完了'
                }}</span>
              </td>
            </template>
          </MtTable2>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="body1 bold">
              <q-icon name="assignment_turned_in" /> {{typeDeptList.find((el) => el.value == selectedDepartment)?.label}} 部門タスク
            </span>
            <div @click="openTaskPage" class="cursor-pointer text-blue">
              タスク一覧
            </div>
          </div>
          <MtTable2
            v-if="getDashboard && getDashboard.task_list"
            :columns="departmentTaskColumns"
            :rows="getDashboard.task_list.slice().splice(0, 5)"
          >
            <template v-slot:row="{ row }">
              <td
                @click="openDetailTaskPage(row)"
                class="cursor-pointer"
                v-for="(col, index) in departmentTaskColumns"
                :key="index"
              >
                <span v-if="col.field === 'datetime_request'">{{
                  formatDate(row.datetime_request) +
                  ' ' +
                  formatHoursMinutes(row.datetime_request)
                }}</span>
                <span v-else-if="col.field === 'id_employee_request'">{{
                  getEmployeeName(row.id_employee_request)
                }}</span>
                <span v-else-if="col.field === 'id_employee_staff'">{{
                  getEmployeeName(row.id_employee_staff)
                }}</span>
                <span v-else-if="col.field === 'title_task'">{{
                  row.title_task
                }}</span>
                <span v-else-if="col.field === 'status'">{{
                  row.flg_completed ? '完了' : '未完了'
                }}</span>
              </td>
            </template>
          </MtTable2>
        </div>
      </main>
    </div>
  </div>
</template>
<style lang="scss">
.container {
  &-aside {
    display: flex;
    flex-direction: column;
    padding: 24px 32px;
    gap: 20px;
    background-color: $white;
    height: 100%;

    .aside-title {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .department-pulldown {
        min-width: 120px;
      }
    }

    .noTaskImg {
      flex: 1 1 0%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .divider {
      padding: 0 0 8px;
      border-bottom: 1px solid $accent-800;
    }

    .all-department {
      background-color: $accent-050;
      padding: 20px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;
      @media screen and (max-width: 1200px) {
        padding: 16px;
      }
    }

    .all-notifications {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;

      .notification-content {
        display: flex;
        align-items: center;
        flex-direction: column;
        flex: 1 0 1rem;
        gap: 20px;

        .notification-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          margin: 0;
          @media screen and (max-width: 1200px) {
            font-size: 14px;
          }
          .notification-icon {
            font-size: 32px;
            @media screen and (max-width: 1200px) {
              font-size: 24px;
            }
          }
        }
        
        .notification-count {
          font-size: 40px;
          font-weight: 700;
          @media screen and (max-width: 1200px) {
            font-size: 32px;
          }
        }
      }
    }

    .assignments {
      background-color: $white;
      padding: 20px 32px;
      display: flex;
      flex-direction: column;
      gap: 20px;

      .row {
        padding: 0 10px;
        align-items: center;
      }

      .assignment-count {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 19px;
      }
    }
  }

  &-main {
    display: flex;
    flex-direction: column;
    padding: 24px 20px;
    gap: 30px;
    background-color: $grey-100;
    height: calc(100vh - 60px);
    overflow-y: scroll;

    .card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 6px 16px;

      &-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      &-main {
        background-color: $white;
        padding: 6px 16px;
        display: flex;
        gap: 24px;

        .divider {
          min-height: 100px;
          max-height: 100px;
          height: 100%;
          background-color: $grey-300;
          width: 2px;
        }

        .time-table {
          display: flex;
          flex-direction: column;
          gap: 5px;

          &-header {
            display: flex;
            justify-content: space-between;
          }
        }
      }
    }
  }
}
</style>
