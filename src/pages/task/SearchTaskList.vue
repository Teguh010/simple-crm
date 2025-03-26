<script setup lang="ts">
import { onMounted, ref, watch, reactive, computed } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import mtUtils from '@/utils/mtUtils'
import useTask from '@/stores/task'
import UpdateTaskModal from './UpdateTaskModal.vue'
import ViewTaskDetailModal from './ViewTaskDetailModal.vue'
import AdditionalFilterTaskModal from './AdditionalFilterTaskModal.vue'
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import { storeToRefs } from 'pinia'
import { concatenate, formatDate, getDateTimeNow, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCategoryStore from '@/stores/categories'
import MtTable2 from '@/components/MtTable2.vue'
import { event_bus } from '@/utils/eventBus'
import { useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'

const taskStore = useTask()
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const categoryStore = useCategoryStore()
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)
const { getCustomerOption } = storeToRefs(customerStore)
const { getTaskSearchParams, getTaskSearchCount } = storeToRefs(taskStore)
const customerList = ref([])
const customerListDefault = reactive([])
const employeeId = JSON.parse(localStorage?.getItem('id_employee'))
const router = useRouter()
const searchData = ref({
  number_task: '',
  name_pet: '',
  type_task_place: '',
  code_customer: '',
  id_pet: '',
  date_start: getDaysBefore(3),
  date_end: getDateToday()
})
const columns = [
  {
    name: 'number_task',
    label: 'タスク番号',
    field: 'number_task',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'datetime_insert',
    label: 'タスク起票日時',
    field: 'datetime_insert',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'name_customer',
    label: 'オーナー',
    field: 'name_customer',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'name_pet',
    label: 'ペット名',
    field: 'name_pet',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'title_task',
    label: 'タスク名',
    field: 'title_task',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'id_category1',
    label: '大分類',
    field: 'id_category1',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'id_category2',
    label: '中分類',
    field: 'id_category2',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'place_task',
    label: '対応部署',
    field: 'place_task',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'edit_task',
    label: '編集',
    field: 'edit_task',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'copy_task',
    label: '複製',
    field: 'copy_task',
    align: 'left',
    style: 'width: 5%'
  }
]

const openSearchModal = async () => {
  await mtUtils.smallPopup(AdditionalFilterTaskModal)
}

const openAddModal = async () => {
  taskStore.selectTask(null)
  await mtUtils.popup(UpdateTaskModal, {}, true)
}
const editRecord = async (data: any) => {
  let updatedFlg = { value: false }
  taskStore.setTaskSearchParams(searchData.value, 0)
  await mtUtils.popup(UpdateTaskModal, { data, updatedFlg }, true)
}

const onRowClick = async (data: any) => {
  taskStore.selectTask(data.id_task)
  taskStore.setTaskSearchParams(searchData.value, 0)
  router.replace({ query: { id: data.id_task}})
  await mtUtils.mediumPopup(ViewTaskDetailModal, { data, fromPage: 'タスク一覧' })
  router.replace({ name: 'SearchTaskList' })
}

const handleCopyTask = async (taskData: any) => {
  let confirmMsg = ' このタスクをベースに新しいタスクを作成しますか?'
  taskData.id_task = ''
  taskData.number_task = ''
  const data = {
    type_link1: taskData.type_link1,
    id_link1: taskData.id_link1,
    // old id task copied from
    id_task_copied: taskData.id_task,
    flg_task_hospital: taskData.flg_task_hospital,
    id_category1: taskData.id_category1,
    id_category2: taskData.id_category2,
    title_task: taskData.title_task,
    memo_task_todo: taskData.memo_task_todo,
    memo_task_report: taskData.memo_task_report,
    datetime_plan: taskData.datetime_plan,
    flg_emargency: taskData.flg_emargency,
    type_task_place: taskData.type_task_place,
    id_employee_request: taskData.id_employee_request,
    datetime_request: getDateTimeNow(),
    flg_unassigned: taskData.flg_unassigned,
    id_employee_staff: taskData.id_employee_staff,
    name_employee_staff: taskData.name_employee_staff,
    id_employee_created: employeeId,
    datetime_created: getDateTimeNow(),
    flg_start_arroval_required: taskData.flg_start_arroval_required,
    type_task_review: taskData.type_task_review,
    id_customer: taskData.id_customer,
    name_customer: taskData.name_customer,
    code_customer: taskData.code_customer,
    id_pet: taskData.id_pet,
    name_pet: taskData.name_pet
  }
  const copiedTaskData = true
  await mtUtils
    .confirm(confirmMsg, '確認', 'はい、複製します')
    .then((confirmation) => {
      if (confirmation) {
        if (taskData) {
          mtUtils.popup(UpdateTaskModal, { data, copiedTaskData })
        }
      }
    })
}
const reset = async () => {
  searchData.value.number_task = ''
  searchData.value.id_pet = ''
  searchData.value.code_customer = ''
  searchData.value.type_task_place = '';
  searchData.value.date_start = null,
    searchData.value.date_end = null,
    taskStore.setTaskSearchParams(searchData.value, 0)
  await taskStore.fetchTask(searchData.value)
}
const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  taskStore.fetchTask({
    date_start: searchData?.value?.date_start,
    date_end: searchData?.value?.date_end,
    id_clinic: id_clinic
  })
}
async function selectingCustomer(value: any, initCall = false) {
  searchData.value.code_customer = value
  isPet.value = false
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
    await customerStore.selectCustomerOptions(value)
    let selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      searchData.value.code_customer = selectedCustomer.code_customer

      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: any) => {
          petListDefault.push({
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet
          })
        })
        petList.value = [...petListDefault]
        isPet.value = true
      }
    }
  } else {
    searchData.value.code_customer = ''
    // requestForm.code_ahmics_customer = ''
    searchData.value.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}
function getCategoryName(id_category: any) {
  return categoryStore.getCategories.find((categoryObj: any) => {
    return categoryObj.id_category == id_category
  })?.name_category
}
function getCustomerName(code_customer: any) {
  return customerList.value.find((customerObj: any) => {
    return customerObj.code_customer == code_customer
  })?.label
}
const goToTODO = () => {
  window.open('SearchTodoTaskList', '_blank')
  return false
}
const moveNext = (e) => {
  const inputs = Array.from(e.target.form.querySelectorAll('input[type="text"]'));
  const index = inputs.indexOf(e.target);
  if (index === 0) {
    inputs[index + 1].focus();
  } else {
    inputs[1].blur();
    search()
  }
}
watch(action, () => {
  // =======================
  // WATCH GETACTION ON PINIA, NOTE : DO NOT UPDATE THIS watch() FUNCTION WITHOUT PERMISSION OF RIZAL OR MOTO
  // =======================
  if (action.value === 'createTask') {
    openAddModal()
    actionStore.resetAction()
  }
})

const init = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  await taskStore.fetchTask({
    date_start: searchData?.value?.date_start,
    date_end: searchData?.value?.date_end,
    id_clinic: id_clinic
  })
}

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  taskStore.setTaskSearchParams(searchData.value, 0)
  await init()
  if (
    action.value === 'createTask' ||
    localStorage.getItem('pageAction') === 'createTask'
  ) {
    openAddModal()
    sessionStorage.setItem('pageType', 'modal')
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  } else if (
    taskStore.getTasks &&
    localStorage.getItem('pageAction') === 'taskDetails'
  ) {
    const taskId = localStorage.getItem('pageActionParam')
    const taskData = taskStore.getTasks.find(
      (tsk: any) => tsk.id_task == taskId
    )
    if (taskData) {
      onRowClick(taskData)
      localStorage.removeItem('pageAction')
      localStorage.removeItem('pageActionParam')
    }
  }

  // set page title
  setPageTitle('タスク一覧')
})

event_bus.on('taskAdded', async () => {
  await init()
})
</script>
<template>  
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          タスク一覧 
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                outlined
                type="date"
                label="起票日：Start"
                autofocus
                tabindex="1"
                v-on:keydown.enter="moveNext"
                @update:date="()=> searchData.date_end = searchData.date_start"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                outlined
                class="q-mx-sm"
                type="date"
                label="起票日：End"
                tabindex="2"
                v-on:keydown.enter="moveNext"
              />
              <q-btn            
                @click="openSearchModal"
                outline
              >
                詳細検索
                <q-badge v-if="getTaskSearchCount > 0" color="red" floating>
                  {{ getTaskSearchCount }}
                </q-badge>
              </q-btn>
              <q-btn
                @click="reset"            
                unelevated
                outline
                class="q-mx-sm"
                color="grey-100"
                text-color="primary"
                label="クリア" />
              <q-btn
                @click="search"            
                unelevated
                color="grey-800"
                tabindex="3"
                text-color="white"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
              <q-btn            
                unelevated
                color="primary"
                class="q-mx-sm"
                text-color="white"
                @click="openAddModal"
              >
                <q-icon size="20px" name="add" />タスク
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                outlined
                type="date"
                label="起票日：Start"
                autofocus
                class="ipad-field-size-md"
                tabindex="1"
                v-on:keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                outlined
                class="q-mx-sm ipad-field-size-md"
                type="date"
                label="起票日：End"
                tabindex="2"
                v-on:keydown.enter="moveNext"
              />
              <q-btn
                @click="openSearchModal"
                outline
              >
                <q-icon name="tune" /> 
                <q-badge v-if="getTaskSearchCount > 0" color="red" floating>
                  {{ getTaskSearchCount }}
                </q-badge>
              </q-btn>
              <q-btn
                @click="search"
                unelevated
                color="primary"
                tabindex="3"
                class="q-mx-sm"
                text-color="white"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
              <q-btn
                unelevated
                color="primary"
                text-color="white"
                @click="openAddModal"
              >
                <q-icon size="20px" name="add" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果 :<span class="q-ml-sm">{{ taskStore.getTasks.length }}件</span>
      </div>
      <div>
        <q-btn            
          unelevated
          outline
          @click="goToTODO()">
          <q-icon name="task_alt" class="q-mr-sm" />
          TODO
        </q-btn>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="taskStore.getTasks"
      :rowsBg="true"
      class="custody-table"
      :style="{ height: 'calc(100vh - 120px)', boxShadow: 'none' }"
      flat
      no-data-message="登録がありません。"
      no-result-message="該当のデータが見つかりませんでした"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          @click="onRowClick(row)"
          class="cursor-pointer"
          :class="[{
            flg_cancel_row: row.flg_cancel,
            flg_complete_row: row.flg_complete,
            flg_closed_row: row.flg_closed
          }]"
        >
          <div v-if="col.field == 'datetime_insert'" class="body1 regular text-grey-700">
            {{ formatDate(row.datetime_insert) }}
          </div>
          <div v-else-if="col.field == 'code_customer'" class="body1 regular text-grey-700">
            {{ getCustomerName(row.code_customer) }}
          </div>
          <div v-else-if="col.field == 'name_pet'" class="body1 regular text-grey-700">
            {{ row.name_pet  }}
          </div>
          <div v-else-if="col.field == 'title_task'" class="body1 regular text-grey-700">
            <div class="body1 regular ellipsis" style="width: 300px">
              {{ row.title_task }}
            </div>
          </div>
          <div v-else-if="col.field == 'id_category1'" class="body1 regular text-grey-700">
            {{ getCategoryName(row.id_category1) }}
          </div>
          <div v-else-if="col.field == 'id_category2'" class="body1 regular text-grey-700">
            {{ getCategoryName(row.id_category2) }}
          </div>
          <div v-else-if="col.field == 'edit_task'" class="body1 regular text-grey-700">
            <q-btn
              @click.stop="editRecord(row)"
              unelevated
              round
              size="12px"
              icon="edit"
              class="text-grey-800"
            />
          </div>
          <div v-else-if="col.field == 'copy_task'" class="body1 regular text-grey-700">
            <q-btn
              @click.stop="handleCopyTask(row)"
              unelevated
              round
              size="12px"
              icon="difference"
              class="text-grey-800"
            />
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
</style>
