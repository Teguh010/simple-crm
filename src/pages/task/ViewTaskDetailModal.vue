<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import OptionModal from '@/components/OptionModal.vue'
import TaskStatusModal from './TaskStatusModal.vue'
import mtUtils from '@/utils/mtUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtstatusCheckCircle from '@/components/MtstatusCheckCircle.vue'
import aahMessages from '@/utils/aahMessages'
import useTask from '@/stores/task'
import { useEmployeeStore } from '@/stores/employees'
import UpdateTaskModal from './UpdateTaskModal.vue'
import { storeToRefs } from 'pinia'
import { copyText, formatDate, formatHoursMinutes, getDateTimeNow, timeDifferences } from '@/utils/aahUtils'
import useActionStore from '@/stores/action'
import aahValidations from '@/utils/aahValidations'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useCategoryStore from '@/stores/categories'
import { useRouter } from 'vue-router'
import useServiceDetailStore from '@/stores/service-details'
import useMessageStore from '@/stores/message-clinic'
import ViewPrescriptionModal from '../request/prescription/ViewPrescriptionModal.vue'
import ViewPetDetailModal from '@/pages/master/customerPet/ViewPetDetailModal.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import UpdateMessageThreadModal from '@/pages/message/UpdateMessageThreadModal.vue'
import { TaskType } from '@/types/types'
import { typeLinkCategory } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'

const UpdateServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/request/serviceDetail/UpdateServiceDetailModal.vue')
)

const emits = defineEmits(['close'])
const props = defineProps<{ data: TaskType; id_request: string, fromPage: string }>()
const router = useRouter()
const closeModal = () => {
  emits('close')
  setPageTitle(props.fromPage)
}
const serviceDetailStore = useServiceDetailStore()
const taskStore = useTask()
const actionStore = useActionStore()
const employeeStore = useEmployeeStore()
const messageStore = useMessageStore()
const { getTask } = storeToRefs(taskStore)
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)

const { getServiceDetail } = storeToRefs(serviceDetailStore)
const categoryStore = useCategoryStore()
const isApproved = ref(true)

const data = ref({
  flg_prepared: false,
  flg_checked: false,
  flg_started: false,
  flg_completed: false,
  datetime_request: null,
  datetime_approved: null,
  datetime_checked: null,
  datetime_started: null,
  datetime_completed: null,
  type_task_review: null
})

const menuOptions = [
  {
    title: 'URLコピー',
    name: 'url',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: '編集',
    name: 'edit',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: 'スレッド作成',
    name: 'create_thread',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: 'スレッド検索',
    name: 'thread search',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: 'キャンセル',
    name: 'cancel',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: '削除',
    name: 'delete',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  }
]

const init = async () => {
  taskStore.selectTask(props.data.id_task)
  if (getTask.value) {
    for (let key in getTask.value) {
      data.value[key] = getTask.value[key]
    }
    return data.value
  }
}

const openMenu = async (data: any) => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            let id = props.data.id_task
            taskStore.destroyTask(id).then(() => {
              emits('close')
              taskStore.fetchTask()
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    } else if (selectedOption.name === 'edit') {
      let updatedFlg = { value: false }
      await mtUtils.popup(UpdateTaskModal, { data, updatedFlg }, true)
      if (updatedFlg.value) {
        init()
      }
    } else if (selectedOption.name === 'cancel') {
      closeModal()
    } else if (selectedOption.name === 'create_thread') {
      const threadData = {
        memo_goal: '',
        id_pet: data?.id_pet,
        id_customer: data?.id_customer,
        linkCategory: 5,
        id_link1: data.id_task,
        number_link1: data.number_task
      }
      localStorage.setItem('pageAction', 'createThread')
      localStorage.setItem('createThread', JSON.stringify(threadData))
      await mtUtils.popup(UpdateMessageThreadModal, {})
      const recentThread = messageStore.getRecentThreadMessage
      if (recentThread && Object.keys(recentThread).length > 0) {
        messageStore.setRecentMessageThread(null)
        const confirmation = await mtUtils.confirm(
          '院内スレッドを作成しました。スレッドを開きますか？',
          '確認',
          'スレッドを開く'
        )
        if (confirmation) {
          const route = router.resolve({ name: 'MessageClinic' })?.href
          window.open(route, '_blank')
        }
      }
    } else if (selectedOption.name === 'url') {
      navigator.clipboard.writeText(window.location.href).then(async () => {
        localStorage.setItem('pageAction', 'taskDetails')
        localStorage.setItem('pageActionParam', props.data.id_task)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      })
    } else if (selectedOption.name === 'thread search') {
      let link = router.resolve({
        name: 'MessageClinic',
        query: { task_id: data.number_task }
      })?.href
      if (link) {
        window.open(link, '_blank')
      }
    }
  }
}

const goTo = () => {
  window.open('/MessageClinic', '_blank')
  return false
}

const handleStatus = async (clickedStatus: number, info: any) => {
  if (isApproved.value === true) {
    if (
      clickedStatus == 1 &&
      data.value?.datetime_checked !== null &&
      data.value?.datetime_started !== null
    ) {
      return false
    }
    if (clickedStatus == 1 && data.value?.flg_prepared === false) {
      return false
    }
    if (
      clickedStatus == 2 &&
      data.value?.datetime_started !== null &&
      data.value?.datetime_completed !== null
    ) {
      return false
    }
    if (
      clickedStatus == 2 &&
      data.value?.datetime_checked === null &&
      data.value?.id_employee_checked === null
    ) {
      return false
    } else if (
      clickedStatus == 3 &&
      data.value?.datetime_started === null &&
      data.value?.id_employee_started === null
    ) {
      return false
    }
    info.clickedStatus = clickedStatus
    let updatedFlg = { value: false }
    await mtUtils.littlePopup(TaskStatusModal, { info, updatedFlg })
    if (props.id_request) await taskStore.fetchTaskByRequest(props.id_request)
    init()
  }
}

const getEmpDetails = (id: Number) => {
  return employeeStore.getEmployees.find((v) => v?.id_employee === id)
}
function getCategoryName(id_category: any) {
  return categoryStore.getCategories.find((categoryObj: any) => {
    return categoryObj.id_category == id_category
  })?.name_category
}
const openViewPetDetailModal = () => {
  mtUtils.popup(ViewPetDetailModal, {
    id_pet: props.data?.id_pet,
    id_customer: props.data?.id_customer
  })
}
const handleTypeLink = async () => {
  if (props.data.type_link1 == 2) {
    await serviceDetailStore.fetchServiceDetailById(props.data?.id_link1)
    await mtUtils.mediumPopup(UpdateServiceDetailModal, {})
  } else if (props.data.type_link1 == 3) {
    await mtUtils.mediumPopup(ViewPrescriptionModal, {
      prescriptionObj: {
        id_prescription: props.data?.id_link1
      },
      id_pet: props.data?.id_pet,
      fromPD: true,
      id_customer: props.data?.id_customer
    }, true)
  } else {
    window.open(`/SearchRequestList/${props.data?.id_link1}/`, '_blank')
  }
}
const save = () => {
  if (props.data.id_employee_reviewed1 !== null) {
    props.data.datetime_task_reviewed1 = getDateTimeNow()
    props.data.flg_task_reviewed1 = true
  }
  if (props.data.id_employee_reviewed2 !== null) {
    props.data.datetime_task_reviewed2 = getDateTimeNow()
    props.data.flg_task_reviewed2 = true
  }
  taskStore
    .updateTask(props.data.id_task, props.data)
    .then(() => {
      closeModal()
      mtUtils.autoCloseAlert(aahMessages.success)
    })
    .catch((error) => mtUtils.alert(error.message, 'Error'))
}
const headerClass = computed(() => {
  if (props.data?.flg_emargency) {
    return 'alert-row text-darkred'
  } else {
    return '' // Default class
  }
})
const iconName = computed(() => {
  if (props.data?.flg_emargency) {
    return 'run_circle'
  } else {
    return ''
  }
})
const nonUrgency = computed(() => {
  return props.data?.flg_emargency
})
const calculateTimeRemaining = computed(() => {
  let diff = timeDifferences(
    props.data?.datetime_plan,
    getDateTimeNow(),
    'hours'
  )
  if (diff > 0) {
    if (diff < 24) {
      return timeConvert(diff)
    } else if (diff > 24 && diff < 48) {
      return '1日'
    } else if (diff > 48 && diff < 72) {
      return '2日'
    } else if (diff > 72 && diff < 96) {
      return '3日'
    } else if (diff > 96) {
      return '3日以上'
    }
  } else {
    return '予定時刻を終了しました'
  }
})
function timeConvert(n) {
  var num = n
  var hours = num / 60
  var rhours = Math.floor(hours)
  var minutes = (hours - rhours) * 60
  var rminutes = Math.round(minutes)
  return rhours + ' : ' + rminutes
}

onMounted(() => {
  init()

  // set page title
  const pageTitle = `${props?.data?.title_task}`
  if (props.data) {
    setPageTitle(`TK: ${pageTitle}`)
  }
})
</script>

<template>
  <MtModalHeader :class="headerClass" :closeBtn="true" @closeModal="closeModal">
    <q-toolbar-title class="title2 bold">
      <q-icon v-if="nonUrgency" :name="iconName" class="q-mr-xs" size="24px" />
      <span class="q-mr-xs">タスク： </span>
      <span v-if="data.number_task">
        {{ data.number_task }}
        <q-icon
          name="content_copy"
          class="text-blue cursor-pointer"
          @click="data.number_task ? copyText(data.number_task) : null"
        />
        <span class="q-ml-md">
          {{ data.title_task }}
        </span>
      </span>
      <span v-else class="text-grey-400"> 取得失敗 </span>
    </q-toolbar-title>
    <q-btn
      v-if="!isEdit"
      unelevated
      color="primary"
      class="q-ml-md q-mr-sm"
      @click="goTo()"
    >
      <span>スレッド作成</span>
    </q-btn>
    <q-btn v-if="props.data" flat round @click="openMenu(props.data)">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
  </MtModalHeader>
  <q-scroll-area style="height: 70vh">
    <q-card-section class="q-px-xl">
      <div
        v-if="data?.flg_emargency"
        class="half-width row justify-center items-center bg-danger text-white q-mb-lg q-mx-auto q-pa-xs q-br-3"
      >
        <q-icon class="q-mr-xs" name="warning" />
        至急
      </div>
      <div class="row justify-center items-center q-mt-md">
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center text-center"
            @click="handleStatus(0, data)"
          >
            <MtstatusCheckCircle
              :statusChecked="isApproved && data?.flg_prepared"
            />
            <div class="column items-center datetime">
              <div v-if="data?.flg_prepared">
                <span
                  :class="data?.flg_prepared ? 'text-grey-800' : 'text-grey-400'"
                >依頼済</span
                >
              </div>
              <div v-else>
                <span class="text-darkred">未承認</span>
              </div>
              <div v-if="data?.datetime_approved">
                {{
                  data?.datetime_approved
                    ? formatDate(data?.datetime_approved)
                    : ''
                }}
                <br />
                {{
                  data?.datetime_approved
                    ? formatHoursMinutes(data?.datetime_approved)
                    : ''
                }}
              </div>
              <div v-else-if="data?.flg_prepared">
                {{
                  data?.datetime_request
                    ? formatDate(data?.datetime_request)
                    : ''
                }}
                <br />
                {{
                  data?.datetime_request
                    ? formatHoursMinutes(data?.datetime_request)
                    : ''
                }}
              </div>
            </div>
          </div>
          <div class="bg-accent-200 statusDivider"></div>
        </div>
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center text-center"
            @click="handleStatus(1, data)"
          >
            <MtstatusCheckCircle
              :customClass="{ disable: !data?.flg_prepared }"
              :statusChecked="isApproved && data?.flg_checked"
            />
            <div class="column items-center datetime">
              <div>
                <span
                  :class="
                    isApproved && data?.flg_checked
                      ? 'text-grey-800'
                      : 'text-grey-400'
                  "
                >確認済</span
                >
              </div>
              <div>
                {{
                  data?.datetime_checked
                    ? formatDate(data?.datetime_checked)
                    : ''
                }}
                <br />
                {{
                  data?.datetime_checked
                    ? formatHoursMinutes(data?.datetime_checked)
                    : ''
                }}
              </div>
            </div>
          </div>
          <div class="bg-accent-200 statusDivider"></div>
        </div>
        <div class="row justify-center items-start detailsStatusBox">
          <div
            class="column justify-center items-center"
            @click="handleStatus(2, data)"
          >
            <MtstatusCheckCircle
              :customClass="{ disable: !data?.flg_checked }"
              :statusChecked="isApproved && data?.flg_started"
            />
            <div class="column items-center datetime">
              <div>
                <span
                  :class="data?.flg_started ? 'text-grey-800' : 'text-grey-400'"
                >着手済</span
                >
              </div>
              <div>
                {{
                  data?.datetime_started
                    ? formatDate(data?.datetime_started)
                    : ''
                }}
                <br />
                {{
                  data?.datetime_started
                    ? formatHoursMinutes(data?.datetime_started)
                    : ''
                }}
              </div>
            </div>
          </div>
          <div class="bg-accent-200 statusDivider"></div>
        </div>
        <div>
          <div class="row justify-center items-start detailsStatusBox">
            <div
              class="column justify-center items-center"
              @click="handleStatus(3, data)"
            >
              <MtstatusCheckCircle
                :customClass="{ disable: !data?.flg_started }"
                :statusChecked="isApproved && data?.flg_completed"
              />
              <div class="column items-center datetime">
                <div>
                  <span
                    :class="
                      data?.flg_completed ? 'text-grey-800' : 'text-grey-400'
                    "
                  >完了</span
                  >
                </div>
                <div>
                  {{
                    data?.datetime_completed
                      ? formatDate(data?.datetime_completed)
                      : ''
                  }}
                  <br />
                  {{
                    data?.datetime_completed
                      ? formatHoursMinutes(data?.datetime_completed)
                      : ''
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="row justify-center items-center q-mt-md q-pb-sm">
        <div
          v-if="data?.flg_completed && data?.type_task_review !== 99"
          class="row justify-center items-center text-center"
        >
          <div class="q-mr-sm caption1 text-grey-900 bold">最終承認1</div>
          <InputEmployeeOptGroup
            v-model:selected="data.id_employee_reviewed1"
            :rules="[aahValidations.validationSelection]"
            bgColor="accent-100"
            label=""
            required
          />
        </div>
        <div
          v-if="data?.flg_completed && data.type_task_review === 2"
          class="row justify-center items-center text-center text-grey-900"
        >
          <div class="q-mx-sm caption1 text-grey-900 bold">最終承認2</div>
          <MtInputForm
            v-model="data.id_employee_reviewed2"
            :items="employeeStore.getAllEmployees"
            :rules="[aahValidations.validationSelection]"
            bgColor="accent-100"
            label=""
            outlined
            required
            type="selection"
          />
        </div>
      </div>
      <div class="row q-mt-lg q-mb-xs text-grey-900">
        <div class="col">{{ data.title_task }}</div>
      </div>
      <div
        v-if="props.data?.id_category1"
        class="row justify-start items-start caption1 text-grey-700"
      >
        <div class="col">
          {{ getCategoryName(props.data?.id_category1) }} •
          {{ getCategoryName(props.data?.id_category2) }}
        </div>
      </div>
      <div class="row q-mt-lg text-grey-900">
        <div class="col q-mb-lg">
          <span>⌛</span>
          <small class="text-grey-500 q-mr-sm"> 目標完了時刻 </small>
          <span class="title2 bold">
            {{
              formatDate(data?.datetime_plan) +
              ' ' +
              formatHoursMinutes(data?.datetime_plan)
            }}
          </span>
          <span class="q-ml-md">
            <q-icon name="schedule" />
            <small class="text-grey-500 q-pa-sm">残り時間</small>
            <span>
              {{ calculateTimeRemaining }}
            </span>
          </span>
        </div>
      </div>
      <div class="row justify-start q-mt-lg">
        <div class="col-6 q-col-gutter-md">
          <div
            class="row justify-start items-start q-mb-md q-pa-lg bg-accent-050"
          >
            <div class="col-12 q-mb-sm">
              <small class="text-grey-500">タスク内容</small><br />
              <div class="preline">{{ data?.memo_task_todo }}</div>
            </div>
            <hr class="task-description" />
            <div class="col-12 q-mt-sm">
              <small class="text-grey-500 q-pb-md">連携情報</small><br />
              <span class="text-blue cursor-pointer" @click="openViewPetDetailModal">{{
                  data.name_pet
                }}</span>
            </div>
            <!-- Task type_link info here -->
            <div
              v-if="
                data.type_link1 !== null &&
                data.type_link1 !== 0 &&
                data.number_link1
              "
              class="col-12 q-mt-sm"
            >
              <small class="text-grey-500 q-pb-md">{{
                  typeLinkCategory.find(
                    (item) => item.value === data.type_link1
                  )?.label
                }}</small
              ><br />
              <span class="text-blue cursor-pointer" @click="handleTypeLink">{{
                  data.number_link1
                }}</span>
            </div>
          </div>
          <div
            v-if="data.memo_task_report"
            class="row justify-start items-start q-mb-md q-px-lg bg-accent-100"
          >
            <div class="col-12 q-mb-md">
              <small class="text-grey-500">レポート</small><br />
              {{ data.memo_task_report }}
            </div>
          </div>
        </div>
        <div class="col-6 q-pl-md q-col-gutter-md">
          <div class="row q-ml-md q-pa-md">
            <div class="col-col q-mb-md">
              <span class="text-grey-500">場所：</span>
              {{ data.place_task }}
            </div>
            <div class="col q-ml-lg">
              <span class="text-grey-500">主担当者：</span>
              {{ getEmpDetails(data?.id_employee_staff)?.name_display }}
            </div>
            <div class="col-12 q-mr-lg q-mb-lg">
              <span class="text-grey-500">依頼：</span>
              {{ getEmpDetails(data?.id_employee_request)?.name_display }}
              <q-icon
                class="text-grey-500 q-ml-sm q-mr-xs"
                name="alternate_email"
              />
              <span class="text-grey-600">
                {{
                  formatDate(data?.datetime_request) +
                  ' ' +
                  formatHoursMinutes(data?.datetime_request)
                }}
              </span>
            </div>
            <div class="col-12 text-grey-600 q-mb-sm">
              <q-icon name="keyboard_arrow_left" />
              <small>進捗ステータス</small>
              <q-icon name="keyboard_arrow_right" />
            </div>
            <!-- 承認（開始前承認必要フラグが正のとき） -->
            <div v-if="data.flg_start_arroval_required" class="col-12 q-mb-md">
              <span
                :class="[
                  'q-mr-sm',
                  {
                    green: data.flg_approved,
                    'text-grey-400': !data.flg_approved
                  }
                ]"
              >
                <q-icon class="q-ml-xs title2" name="check_circle" size="24" />
                承認
              </span>
              <span class="title2 regular">
                {{
                  getEmpDetails(props.data?.id_employee_approved)?.name_display
                }}
              </span>
              <span v-if="data.flg_approved">
                <q-icon
                  class="text-grey-500 q-ml-sm q-mr-xs"
                  name="alternate_email"
                />
                <span class="text-grey-600">
                  {{
                    formatDate(data?.datetime_approved) +
                    ' ' +
                    formatHoursMinutes(data?.datetime_approved)
                  }}
                </span>
              </span>
            </div>
            <!-- 確認 -->
            <div class="col-12 q-mb-md">
              <span
                :class="[
                  'q-mr-sm',
                  { green: data.flg_checked, 'text-grey-400': !data.flg_checked }
                ]"
              >
                <q-icon class="q-ml-xs title2" name="check_circle" size="24" />
                確認
              </span>
              <span class="title2 regular">
                {{ getEmpDetails(data?.id_employee_checked)?.name_display }}
              </span>
              <span v-if="data.flg_checked">
                <q-icon
                  class="text-grey-500 q-ml-sm q-mr-xs"
                  name="alternate_email"
                />
                <span class="text-grey-600">
                  {{
                    formatDate(data?.datetime_checked) +
                    ' ' +
                    formatHoursMinutes(data?.datetime_checked)
                  }}
                </span>
              </span>
            </div>
            <!-- 着手 -->
            <div class="col-12 q-mb-md">
              <span
                :class="[
                  'q-mr-sm',
                  { green: data.flg_started, 'text-grey-400': !data.flg_started }
                ]"
              >
                <q-icon class="q-ml-xs title2" name="check_circle" size="24" />
                着手
              </span>
              <span class="title2 regular">
                {{ getEmpDetails(data?.id_employee_started)?.name_display }}
              </span>
              <span v-if="data.flg_started">
                <q-icon
                  class="text-grey-500 q-ml-sm q-mr-xs"
                  name="alternate_email"
                />
                <span class="text-grey-600">
                  {{
                    formatDate(data?.datetime_started) +
                    ' ' +
                    formatHoursMinutes(data?.datetime_started)
                  }}
                </span>
              </span>
            </div>
            <!-- 完了 -->
            <div class="col-12 q-mb-md">
              <span
                :class="[
                  'q-mr-sm',
                  {
                    green: data.flg_completed,
                    'text-grey-400': !data.flg_completed
                  }
                ]"
              >
                <q-icon class="q-ml-xs title2" name="check_circle" size="24" />
                完了
              </span>
              <span class="title2 regular">
                {{
                  getEmpDetails(data?.id_employee_completed)?.name_display
                }}
              </span>
              <span v-if="data.flg_completed">
                <q-icon
                  class="text-grey-500 q-ml-sm q-mr-xs"
                  name="alternate_email"
                />
                <span class="text-grey-600">
                  {{
                    formatDate(data?.datetime_completed) +
                    ' ' +
                    formatHoursMinutes(data?.datetime_completed)
                  }}
                </span>
              </span>
            </div>
            <!-- 承認者１ -->
            <div v-if="data.type_task_review !== 99 && data.type_task_review !== null" class="col-12 q-mb-md">
              <span
                :class="[
                  'q-mr-sm',
                  {
                    green: data.flg_task_reviewed1,
                    'text-grey-400': !data.flg_task_reviewed1
                  } ]"
              >
                <q-icon class="q-ml-xs title2" name="check_circle" size="24" />
                承認者 1
              </span>
              <span class="title2 regular">
                {{
                  getEmpDetails(data?.id_employee_reviewed1)?.name_display
                }}
              </span>
              <span v-if="data.flg_task_reviewed1">
                <q-icon
                  class="text-grey-500 q-ml-sm q-mr-xs"
                  name="alternate_email"
                />
                <span class="text-grey-600">
                  {{
                    formatDate(data?.datetime_task_reviewed1) +
                    ' ' +
                    formatHoursMinutes(
                      data?.datetime_task_reviewed1
                    )
                  }}
                </span>
              </span>
            </div>
            <!-- 承認者２ -->
            <div v-if="data.type_task_review = 2" class="col-12 q-mb-md">
              <span
                :class="[
                  'q-mr-sm',
                  {
                    green: data.flg_task_reviewed2,
                    'text-grey-400': !data.flg_task_reviewed2
                  }
                ]"
              >
                <q-icon class="q-ml-xs title2" name="check_circle" size="24" />
                承認者 2
              </span>
              <span class="title2 regular">
                {{
                  getEmpDetails(props.data?.id_employee_reviewed2)?.name_display
                }}
              </span>
              <span v-if="data.flg_task_reviewed2">
                <q-icon
                  class="text-grey-500 q-ml-sm q-mr-xs"
                  name="alternate_email"
                />
                <span class="text-grey-600">
                  {{
                    formatDate(props.data?.datetime_task_reviewed2) +
                    ' ' +
                    formatHoursMinutes(
                      props.data?.datetime_task_reviewed2
                    )
                  }}
                </span>
              </span>
            </div>
            <!-- 承認者３ -->
            <div v-if="data?.flg_completed" class="col-12 text-grey-900">
              <MtFormCheckBox
                v-model:checked="data.flg_closed"
                label="クローズする"
                type="checkbox"
              />
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-scroll-area>
  <div class="q-py-md q-bt bg-white">
    <div class="row justify-center items-center">
      <q-btn
        outline
        class="bg-grey-100 text-grey-800 col-2 q-mx-xs"
        @click="closeModal"
      >
        閉じる
      </q-btn>
      <!-- <q-btn
        outline
        class="bg-primary text-grey-100 col-2 q-mx-xs"
        @click="save"
        v-if="props.data?.flg_completed && props.data.type_task_review !== 99"
      >
        保存
      </q-btn> -->
    </div>
  </div>
</template>

<style lang="scss">
.detailsStatusBox {
  height: 120px;
}

.statusDivider {
  width: 75px;
  height: 2px;
  margin-top: 35px;
}

.closingCard {
  height: 50px;
}

.ApprovaldataBox {
  color: $grey-600;
  width: 150px;
  height: 33px;
}

hr.task-description {
  width: 100%;
  border: 1px solid rgb(186, 182, 157);
}

.sticky {
  &-header {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: $white;
  }
  &-footer {
    position: sticky;
    bottom: 0;
    z-index: 1;
    background-color: $white;
  }
}
</style>
