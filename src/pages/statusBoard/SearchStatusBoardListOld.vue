<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import StatusBoardBlock from './StatusBoardBlock.vue'
import UpdateRequestModal from '@/pages/request/UpdateRequestModal.vue'
import draggable from 'vuedraggable'
import useRequestStatus from '@/stores/request-statuses'
import { formatDateWithTime, getDateToday, getDaysAfter, getDaysBefore, getEmployeeDisplayName } from '@/utils/aahUtils'
import useEmployeeStore from '@/stores/employees'
import useStatusStore from '@/stores/status'
import useCliCommonStore from '@/stores/cli-common'
import { forOwn, groupBy, mapValues, sortBy } from 'lodash'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useActionStore from '@/stores/action'
import usePetStore from '@/stores/pets'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { event_bus } from '@/utils/eventBus'
import MtHeader from '@/components/layouts/MtHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import selectOptions from '@/utils/selectOptions'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'

const emits = defineEmits(['close'])
const props = defineProps({
  header: { type: Boolean, default: true },
  id_request: String,
  id_pet: String,
  fromPage: String,
  petListDefault: { type: Array, default: () => [] }
})
const cliCommonStore = useCliCommonStore()
const employeeStore = useEmployeeStore()
const requestStatusStore = useRequestStatus()
const statusStore = useStatusStore()
const petStore = usePetStore()
const { getRequestStatusList } = storeToRefs(requestStatusStore)
const { getStatuses } = storeToRefs(statusStore)
const { getEmployees } = storeToRefs(employeeStore)
const { getPets } = storeToRefs(petStore)
const { getCliCommonTypeCategoryList } = storeToRefs(cliCommonStore)
const actionStore = useActionStore()
const petList = ref(props.petListDefault)
const lastSubChild = ref<HTMLElement>()

const typeCategoryChild = ref([])
const typeCategoryParent = ref([])
const cliCommonOptionList: any = ref([])

const timeSelection = [
  { label: '昨日', value: 'yesterday' },
  { label: '今日', value: 'today' },
  { label: '明日', value: 'tomorrow' }
]
// { label: '入院', value: 'flg_hospitalization' }

const requestStatusList = ref({
  1: [],
  2: [],
  3: [],
  4: [],
  5: [],
  10: [],
  20: [],
  21: []
})
const defaultTemplate = ref(requestStatusList.value)
const subChildStatuses = ref([])
const employeeList: any = ref([])
const employeeListDefault: any = reactive([])

const dateSearch = ref<string | null>(null)
const timeSearch = ref('today')
const employeeSelected = ref(null)

const isDragging = ref(false)
const selectedDraggable = ref({})
const statusBoardKey = ref(0)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const closeModal = () => {
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}
const search = async () => {
  if (timeSearch.value == 'today') dateSearch.value = getDateToday()
  else if (timeSearch.value == 'yesterday') dateSearch.value = getDaysBefore(1)
  else if (timeSearch.value == 'tomorrow') dateSearch.value = getDaysAfter(1)

  await requestStatusStore.fetchRequestStatusesDate({
    time_selection: formatDateWithTime(dateSearch.value, 'YYYY-MM-DD'),
    id_employee_staff: employeeSelected.value,
    flg_hospitalization: timeSearch.value == 'flg_hospitalization'
  })

  init()
}

const searchByDate = async (e: string) => {
  timeSearch.value = ''
  await requestStatusStore.fetchRequestStatusesDate({
    time_selection: formatDateWithTime(e, 'YYYY-MM-DD'),
    id_employee_staff: employeeSelected.value
  })
  init()
}

// const getEmployeeName = (employeeObj: any) => {
//   let employee: any = null
//   if (employeeObj.id_employee_doctor)
//     employee = getEmployees.value.find(
//       (emp: any) => emp.id_employee == employeeObj.id_employee_doctor
//     )
//   else
//     employee = getEmployees.value.find(
//       (emp: any) => emp.id_employee == employeeObj.id_employee_staff
//     )

//   if (employee) return getEmployeeDisplayName(employee)
//   return ''
// }
const refresh = () => {
  window.location.reload()
}
const openAddModal = async (params = null) => {
  await mtUtils.mediumPopup(UpdateRequestModal, params)
  init()
}

async function updateDisplayOrder(value: any, category) {
  let payload = {
    req_status_list: []
  }
  if (value && value.moved) {
    requestStatusList.value[category].map((item: any, index: number) => {
      payload.req_status_list.push(item.id_req_status)
      payload[`${item.id_req_status}`] = index
    })
  }
  await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'UpdReqStatusOrder',
    payload
  )
}
const dragStart = () => {
  isDragging.value = true
  const element = document.getElementById('scrollableDiv')!
  if (element.scrollTop > 0) {
    element.scrollTop = 0
  }
}

const setDraggedItem = (selectedElement: object) => {
  selectedDraggable.value = selectedElement
}
const onDragOver = (target: any) => {
  target.isOver = true
}
const onDragLeave = (target: any) => {
  target.isOver = false
}
const dragEnd = () => {
  isDragging.value = false
  selectedDraggable.value = {}
}
const dropItem = async (target: any) => {
  target.isOver = false

  let payload: {
    id_status: string | number
    datetime_cart?: string
  } = {
    id_status: target.id_status
  }
  if (
    (target.type_category_parent === 21 ||
      target.type_category_parent === 20) &&
    (selectedDraggable.value.status.type_category_parent !== 21 ||
      selectedDraggable.value.status.type_category_parent !== 20)
  ) {
    payload = {
      ...payload,
      datetime_cart: formatDateWithTime(new Date(), 'YYYY/MM/DD HH:mm:ss')
    }
  } else if (
    (target.type_category_parent !== 21 ||
      target.type_category_parent !== 20) &&
    selectedDraggable.value.id_status !== target.id_status
  ) {
    payload = {
      ...payload,
      datetime_cart: null
    }
  }

  await requestStatusStore.updateRequestStatuses(
    selectedDraggable.value?.id_req_status,
    payload
  )
  mtUtils.autoCloseAlert('ステータスを更新しました。')

  dragEnd()
  await init(true, false)
}

const onTouchMove = (subChild: any) => {
  subChild.isOver = true
}

const onTouchEnd = async (subChild: any) => {
  subChild.isOver = false
  await dropItem(subChild)
}

const getSubChildFromElement = (element: HTMLElement) => {
  const categoryChildValue = element
    .closest('.child-column')
    ?.getAttribute('data-value') as string
  const subChildId = element.getAttribute('data-id')
  return subChildStatuses.value[categoryChildValue]?.find(
    (subChild: any) => subChild.id_status === subChildId
  )
}

const handleTouchMove = (event: TouchEvent) => {
  requestAnimationFrame(() => {
    if (isDragging.value) {
      const touch = event.touches[0]
      const element = document.elementFromPoint(
        touch.clientX,
        touch.clientY
      ) as HTMLElement

      if (element) {
        if (element.classList.contains('box')) {
          const subChild = getSubChildFromElement(element)
          onTouchMove(subChild)
          lastSubChild.value = subChild
          return lastSubChild.value
        }

        if (element.parentElement?.classList.contains('box')) {
          const subChild = getSubChildFromElement(element.parentElement)
          onTouchMove(subChild)
          lastSubChild.value = subChild
          return lastSubChild.value
        }

        if (!element.classList.contains('box')) {
          onDragLeave(lastSubChild.value)
          return
        }
      }
    }
  })
}

const handleTouchEnd = async (event: TouchEvent) => {
  if (isDragging.value) {
    const touch = event.changedTouches[0]
    const element = document.elementFromPoint(
      touch.clientX,
      touch.clientY
    ) as HTMLElement

    if (element) {
      if (element.classList.contains('box')) {
        const subChild = getSubChildFromElement(element)
        await onTouchEnd(subChild)
        return
      }

      if (element.parentElement?.classList.contains('box')) {
        const subChild = getSubChildFromElement(element.parentElement)
        await onTouchEnd(subChild)
        return
      }
    }
  }
}

const selectDefaultEmployee = () => {
  employeeSelected.value = defaultEmployee
}

const onEmployeeSelected = async (value) => {
  employeeSelected.value = value
  await requestStatusStore.fetchRequestStatusesDate({
    time_selection: formatDateWithTime(dateSearch.value, 'YYYY-MM-DD'),
    id_employee_staff: employeeSelected.value
  })
  initBoardList()
}

const init = async (initOnce: any = false, isRefresh: boolean = false) => {
  cliCommonOptionList.value = []
  await cliCommonStore.fetchPreparationCliCommonList(
    {
      code_cli_common: [20],
      id_clinic: [JSON.parse(localStorage.getItem('id_clinic')!) as number]
    },
    true
  )

  cliCommonOptionList.value = sortBy(
    getCliCommonTypeCategoryList.value,
    'code_func1'
  )
  typeCategoryParent.value = cliCommonOptionList.value
    .filter((v: any) => v.code_func1 && !v.code_func2)
    .map((v: any) => ({
      label: v.label,
      value: Number(v.code_func1)
    }))

  typeCategoryChild.value = cliCommonOptionList.value
    .filter((v: any) => v.code_func1 && v.code_func2)
    .map((v: any) => ({
      label: v.label,
      value: Number(v.code_func2)
    }))

  const promises = []

  if (initOnce) {
    promises.push(statusStore.fetchStatuses())

    if (dateSearch.value) {
      promises.push(
        requestStatusStore.fetchRequestStatusesDate({
          time_selection: formatDateWithTime(dateSearch.value, 'YYYY-MM-DD'),
          id_employee_staff: employeeSelected.value
          // id_employee_doctor: employeeSelected.value ? employeeSelected.value : ''
        })
      )
    }
    await search()
  }

  if (props.id_request) {
    promises.push(
      requestStatusStore.fetchRequestStatusesDate({
        id_request: props.id_request,
        id_pet: props.id_pet
      })
    )
  }

  await mtUtils.promiseAllWithLoader(promises)

  initBoardList()

  if (isRefresh) mtUtils.autoCloseAlert('データを更新しました')
}

const initBoardList = () => {
  const groupStatusChild = groupBy(getStatuses.value, 'type_category_child')
  const sortedGroups = mapValues(groupStatusChild, (group) =>
    sortBy(group, 'display_order')
  )
  subChildStatuses.value = sortedGroups

  employeeList.value = [
    ...getEmployees.value.map((v) => ({
      label: getEmployeeDisplayName(v),
      value: v.id_employee
    }))
  ]
  employeeListDefault.push(...employeeList.value)

  const statusList = groupBy(
    getRequestStatusList.value,
    'status.type_category_child'
  )
  forOwn(requestStatusList.value, (val, key) => {
    requestStatusList.value[key] = []
    if (statusList[key]) {
      requestStatusList.value[key] = statusList[key]
    }
  })

  Object.keys(subChildStatuses.value).forEach((key) => {
    requestStatusList.value[key] = sortBy(requestStatusList.value[key], 'display_order')
  })

  typeCategoryChild.value.forEach((catChild: { value: string | number }) => {
    const valKey = catChild.value as keyof typeof requestStatusList.value
    if (requestStatusList.value[valKey]) {
      // Group by id_status
      const groupedByIdStatus = requestStatusList.value[valKey].reduce(
        (acc, item) => {
          const key = item.id_status
          if (!acc[key]) {
            acc[key] = []
          }
          acc[key].push(item)
          return acc
        },
        {}
      )

      // Sort each group by display_order
      Object.keys(groupedByIdStatus).forEach((key) => {
        groupedByIdStatus[key].sort(
          (
            a: {
              display_order: number
              datetime_check_in: string
              datetime_status_changed: string
            },
            b: {
              display_order: number
              datetime_check_in: string
              datetime_status_changed: string
            }
          ) => {
            // compare by display_order
            if (a.display_order < b.display_order) return -1
            if (a.display_order > b.display_order) return 1

            // If display_order is the same, compare by datetime_check_in
            const dateCheckInA = new Date(a.datetime_check_in)
            const dateCheckInB = new Date(b.datetime_check_in)

            if (dateCheckInA < dateCheckInB) return -1
            if (dateCheckInA > dateCheckInB) return 1

            // If datetime_check_in is the same, sort by datetime_status_changed
            const dateStatusChangedA = new Date(a.datetime_status_changed)
            const dateStatusChangedB = new Date(b.datetime_status_changed)

            if (dateStatusChangedA < dateStatusChangedB) return -1
            if (dateStatusChangedA > dateStatusChangedB) return 1

            return 0
          }
        )
      })

      // Flatten the grouped and sorted items back into a single array
      requestStatusList.value[valKey] = Object.values(groupedByIdStatus).flat()
    }
  })

  defaultTemplate.value = requestStatusList.value
}


const isForceFallback = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPhone = /iphone/.test(userAgent)
  const isIPad =
    /ipad/.test(userAgent) ||
    (/macintosh/.test(userAgent) && 'ontouchend' in document)

  if (isIPhone || isIPad) {
    return true
  }

  return false
})

const isMobile = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPhone = /iphone/.test(userAgent)
  const isIPad =
    /ipad/.test(userAgent) ||
    (/macintosh/.test(userAgent) && 'ontouchend' in document)
  const isAndroid = /android/.test(userAgent)
  if (isIPhone || isIPad || isAndroid) {
    return true
  }
  return false
})

onMounted(async () => {
  // set page title
  setPageTitle('SB:ステータスボード')
  await init(true)
})

event_bus.on('refresh-status-board', async () => {
  await init(true)
  statusBoardKey.value++
})
const getMStatus = (value) => {
  return {
      color: value.color_code && value.color_code != '' ? value.color_code : 'rgb(62, 62, 62)',
      padding: '7px 12px',
      borderRadius: '20px',
      backgroundColor: value.bg_color_code && value.bg_color_code != '' ? value.bg_color_code : 'rgb(232, 232, 232)'
    }
}
</script>
<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          ステータスボード
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <div v-if="props.header" class="flex items-center">
                <div class="q-mr-sm">
                  <MtFormRadiobtn
                    v-for="time in timeSelection"
                    :label="time.label"
                    v-model="timeSearch"
                    :val="time.value"
                    class="q-pr-md"
                    @update:selected="search"
                    :key="time.value"
                  />
                </div>
                <div class="q-mr-sm">
                  <MtFormInputDate
                    v-model:date="dateSearch"
                    outlined
                    type="date"
                    label="リクエスト日"
                    @update:date="searchByDate"
                  />
                </div>
                <div class="flex q-mr-sm items-center q-ml-sm text-grey-500">
                  <q-btn
                    padding="5px"
                    unelevated
                    color="white"
                    text-color="text-grey-700"
                    class="text-grey-700 q-ba q-mx-sm"
                    @click="init(true, true)"
                  >
                    <q-icon size="16px" name="repeat" />
                  </q-btn>
                  <div class="col-2" style="min-width: 200px">
                    <InputEmployeeOptGroup
                      v-model:selected="employeeSelected"
                      department-selected=""
                      show-select-default-employee
                      @update:select-default-employee="selectDefaultEmployee"
                      @update:model-value="onEmployeeSelected"
                    />
                  </div>
                </div>
                <q-btn
                  unelevated
                  color="primary"
                  class="text-grey-800 q-mx-sm"
                  @click="openAddModal"
                >
                  <q-icon size="20px" name="add" />
                  <span v-if="!isMobile"> リクエスト </span>
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div
      class="q-px-md content"
      :style="isDragging ? 'height: 100vh' : ''"
      id="scrollableDiv"
    >
      <div class="table-row">
        <div class="row items-center text-center text-white">
          <div
            v-for="categoryParent in typeCategoryParent"
            :class="
              categoryParent.value === 1
                ? 'parent-column-1 bg-green-800'
                : categoryParent.value === 11
                ? 'parent-column-2 bg-accent-800'
                : categoryParent.value === 21
                ? 'parent-column-3 bg-blue-700'
                : ''
            "
          >
            {{ categoryParent.label }}
          </div>
        </div>
        <div class="row">
          <div
            v-for="categoryChild in typeCategoryChild"
            class="q-py-sm bg-green-100 title2 bold text-center child-column"
            :class="
              categoryChild.value < 10
                ? 'bg-green-100'
                : categoryChild.value <= 11
                ? 'bg-accent-100'
                : categoryChild.value <= 21
                ? 'bg-blue-200'
                : ''
            "
          >
            {{ categoryChild.label }}
            ({{
              requestStatusList[categoryChild.value]
                ? requestStatusList[categoryChild.value].length
                : 0
            }})
          </div>
        </div>
      </div>
      <div class="row">
        <div
          v-for="(categoryChild, index) in typeCategoryChild"
          :data-value="categoryChild.value"
          class="child-column"
        >
          <div class="middle-box full-width">
            <draggable
              v-model="defaultTemplate[categoryChild.value]"
              :itemKey="`draggable-item-${index}`"
              :force-fallback="isForceFallback"
              class="list-group"
              group="people"
              :delay="100"
              :delayOnTouchOnly="true"
              :touch-action="'pan-y'"
              @start="dragStart"
              @end="dragEnd"
              @change="updateDisplayOrder($event, categoryChild.value)"
            >
              <template #item="{ element, index }">
                <div
                  @mousedown="setDraggedItem(element)"
                  @touchend="handleTouchEnd"
                  @touchmove="handleTouchMove"
                  @touchstart="setDraggedItem(element)"
                >
                  <StatusBoardBlock
                    v-show="!isDragging"
                    :key="statusBoardKey"
                    :employee-name="element.name_display"
                    :memo-status="element.memo_status"
                    :number-of-status="
                      element.count_complete_sd +
                      element.count_complete_ph +
                      element.count_complete_inject +
                      '/' +
                      (element.count_available_sd +
                        element.count_available_ph +
                        element.count_available_inject)
                    "
                    :categoryChild="categoryChild"
                    :statusObj="element"
                  />
                </div>
              </template>
            </draggable>
            <div
              v-show="isDragging"
              v-for="subChild in subChildStatuses[categoryChild.value]"
              :key="subChild.id_status"
              :data-id="subChild.id_status"
              @dragover.prevent="onDragOver(subChild)"
              @dragleave="onDragLeave(subChild)"
              @drop="dropItem(subChild)"
              @touchmove="onDragOver(subChild)"
              @touchend="onDragLeave(subChild)"
              class="box text-center"
              :class="{
                'bg-green-100': categoryChild.value < 10 && subChild.isOver,
                'bg-accent-100':
                  categoryChild.value <= 11 &&
                  categoryChild.value >= 10 &&
                  subChild.isOver,
                'bg-blue-200':
                  categoryChild.value <= 21 &&
                  categoryChild.value >= 20 &&
                  subChild.isOver
              }"
            >
            <span 
              :style="getMStatus(subChild)">
                {{ subChild.name_status }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.box {
  border: 3px dotted #ccc;
  margin: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  position: relative;
}
.parent-column-1 {
  width: 62.5%;
}
.parent-column-2 {
  width: 12.5%;
}
.parent-column-3 {
  width: 25%;
}
.child-column {
  width: 12.5%;
  touch-action: pan-y;
}

.drag-status-color {
  background-color: rgb(232, 232, 232);
  color: rgb(62, 62, 62);
  padding: 7px 12px;
  border-radius: 20px;
}
.modal-scroll-area {
  height: calc(100vh - 130px);
}
.content {
  margin: 16px 0 0 0;
  height: calc(100vh - 60px);
  position: relative;
  .table-row {
    position: sticky;
    top: 0;
    z-index: 1;
  }
}
</style>
