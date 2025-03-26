<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtTable2 from '@/components/MtTable2.vue'
import SearchStatusBoardListModal from '../statusBoard/SearchStatusBoardListModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import { storeToRefs } from 'pinia'
import {
  concatenate,
  formatDateWithTime,
  formatHoursMinutes,
  getCustomerLabelColor,
  getCustomerName,
  getDateToday
} from '@/utils/aahUtils'
import useQueueTicketStore from '@/stores/queue_ticket'
import UpdateQueueTicketModal from './UpdateQueueTicketModal.vue'
import useEmployeeStore from '@/stores/employees'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import _, { map } from 'lodash'
import { useRouter } from 'vue-router'
import useCommonStore from '@/stores/common'
import { statusQueueTicket, typeProcessTime, typeWeekday } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '../../stores/clinics'
import useCliCommonStore from '@/stores/cli-common'
import EmailModal from './SendEmailModal.vue'
import selectOptions from '@/utils/selectOptions'
import dayjs from 'dayjs'
import { Platform, useQuasar } from 'quasar'
import UpdQtRequest from '@/pages/queueTicket/UpdQtRequest.vue'

type Doctor = {
  id: number
  name: string
  count: number
  qt_list: string[]
  color: string
}
const $q = useQuasar()

const router = useRouter()

const actionStore = useActionStore()
const cliCommonStore = useCliCommonStore()
const queueTicketStore = useQueueTicketStore()
const customerStore = useCustomerStore()
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)
const { getCliCommonQTVisitPurposeList } = storeToRefs(cliCommonStore)
const { getFilteredQueueTicketLists, getDataFromCustomerPage } =
  storeToRefs(queueTicketStore)
const { getCustomer: getCustomerStore, getPet } = storeToRefs(customerStore)
const employeeStore = useEmployeeStore()
const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const columns = [
  {
    name: 'label_time',
    label: '対応時刻',
    field: 'label_time',
    align: 'center'
  },
  {
    name: 'number_queue_ticket',
    label: '受付番号',
    field: 'number_queue_ticket',
    align: 'center'
  },
  {
    name: 'customer_info',
    label: 'オーナー',
    field: 'customer_info',
    align: 'center'
  },
  {
    name: 'name_pet',
    label: 'ペット',
    field: 'name_pet',
    align: 'center',
    style: 'width: 350px'
  },
  {
    name: 'memo',
    label: 'メモ',
    field: 'memo',
    align: 'center',
    style: 'width: 350px'
  },
  {
    name: 'type_status_queue_ticket',
    label: 'ステータス',
    field: 'type_status_queue_ticket',
    align: 'center'
  },
  {
    name: 'flags',
    label: '呼出',
    field: 'flags',
    align: 'center'
  },
  {
    name: 'type_process_time',
    label: '想定時間',
    field: 'type_process_time',
    align: 'center'
  }
]

const doctorColors = [
  '#1e88e5',
  '#1ec500',
  '#ff8c39',
  '#3965ff',
  '#ed39ff',
  '#7039ff',
  '#ff3939',
  '#00cc94',
  '#bd7700',
  '#84bd00'
]

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const todaysDate = getDateToday()
const typeAnimalOptions = ref()
const tab = ref('受付中')
const tabItems = ref(['受付中', '呼出済', '不在', '削除'])
const searchDoctor = ref('')
const status1_2 = ref(0)
const status3 = ref(0)
const status4 = ref(0)
const status90_99 = ref(0)
const rows1_2 = ref([])
const rows3 = ref([])
const rows4 = ref([])
const rows90_99 = ref([])
const doctors = ref([] as Doctor[])
const totalStatus = ref(0)
const visit_purpose_ticket = ref('')
const link = ref(-1)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const typeAnimal = ref('')
const sortOptions = [
  { label: 'Time ↑', value: 'time_asc' },
  { label: 'Time ↓', value: 'time_desc' }
]

const numberSortOptions = [
  { label: 'Number ↑', value: 'number_asc' },
  { label: 'Number ↓', value: 'number_desc' }
]

const processOrderOptions = [
  { label: 'Process ↑', value: 'process_asc' },
  { label: 'Process ↓', value: 'process_desc' }
]

const openAddModal = async () => {
  if (getDataFromCustomerPage.value?.id_customer) {
    const { id_customer, id_pet } = getDataFromCustomerPage.value
    await mtUtils.mediumPopup(UpdateQueueTicketModal, {
      data: { id_customer, id_pet: id_pet }
    })
    await refresh()
    return queueTicketStore.clearDataFromCustomerPage()
  }
  await mtUtils.mediumPopup(UpdateQueueTicketModal)
  await refresh()
}
const onRowClick = async (data, index) => {
  if (index != '7' && index != '8') {
    await mtUtils.mediumPopup(UpdateQueueTicketModal, {
      data,
      fromPage: '受付・整理券'
    })
    await refresh()
  }
}
const onFilterQTClick = async (ticketNumber: string) => {
  const queueNumber = ticketNumber.split(' ')[0]
  const qtData = getFilteredQueueTicketLists.value.find((ticket) => {
    return ticket.number_queue_ticket === queueNumber
  })
  await mtUtils.mediumPopup(UpdateQueueTicketModal, {
    data: qtData,
    fromPage: '受付・整理券'
  })
}

const onFilterDoctorClick = (data: { id: number }) => {
  searchDoctor.value = data.id.toString()
  selectedDoctor(data.id)
}
const emailSendModalOpen = async (row) => {
  await mtUtils.smallPopup(EmailModal, { queueTicketData: row })
}
const getCustomer = (id_customer) => {
  let customer = customerStore.getAllCustomerPreps?.find(
    (cus) => cus.id_customer == id_customer
  )
  return customer
}

const getTypeAnimalColor = (name_common: string) => {
  const typeAnimal = getCommonTypeAnimalOptionList.value.find(
    (v: any) => v.name_common == name_common
  )
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}

const visitPurpose = (type_visit_purpose_ticket: number[]) => {
  return getCliCommonQTVisitPurposeList.value
    .filter((purpose) =>
      type_visit_purpose_ticket?.includes(purpose.id_cli_common)
    )
    .map((purpose) => purpose.name_cli_common)
    .join(', ')
}

const displayDoctors = (doctorsId: any[]) => {
  return doctorsId
    ?.map((id) => {
      let e = employeeStore.getEmployees.find((v) => v.id_employee === id)
      return e ? `${e.name_family} ${e.name_first}` : '担当なし'
    })
    .join(', ')
}

const getProcessTime = (type_process_time) =>
  typeProcessTime.find((v) => v.value === type_process_time)?.label

const getStatusQueueTicket = (type_status_queue_ticket) =>
  statusQueueTicket.find((v) => v.value == type_status_queue_ticket)?.label

const selectedDoctor = async (value: number | null) => {
  await queueTicketStore.fetchQueueTicketList({
    id_employee_doctor: value === 0 ? null : value,
    type_animal: typeAnimal.value,
    today: true
  })
  queueTicketStore.filterQueueTicketsByTypeAnimal(typeAnimal.value)
  setupQueueTicket()
}
const filterVisitPurpose = async (value) => {
  await queueTicketStore.fetchQueueTicketList({
    type_visit_purpose_ticket: value,
    id_employee_doctor: searchDoctor.value,
    type_animal: typeAnimal.value,
    today: true
  })
  queueTicketStore.filterQueueTicketsByTypeAnimal(typeAnimal.value)
  setupQueueTicket()
}

const modalData = ref({ customerName: '', newStatus: '' })

const handleAutoRequestTitle = (ticketData: any) => {
  // let autoTitle = ''
  const selectedEmployeeDoctor = employeeStore.getAllEmployees.find(
    (v: any) => v.value === ticketData?.id_employee_doctor
  )?.label
  const name_customer = concatenate(
    ticketData?.customer?.name_family,
    ticketData?.customer?.name_first
  )
  const fixedTextCustomer = name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeDoctor ? '/ 担当: ' : ''
  return (
    getDateToday() +
    ' ' +
    ticketData?.customer?.code_customer +
    ' ' +
    name_customer +
    ' ' +
    (fixedTextCustomer ?? '') +
    ' ' +
    (selectedEmployeeDoctor ?? '') +
    (fixedTextDoctor ?? '') +
    ' ' +
    (fixedTextStaff
      ? fixedTextDoctor !== ''
        ? fixedTextStaff
        : fixedTextStaff.replace('/ ', '')
      : '') +
    (selectedEmployeeDoctor ?? '')
  )
}

const filterQueueTicket = async (ticketData) => {
  const customerName = ticketData.customer.name_customer_display

  const newStatus = getStatusQueueTicket(ticketData['type_status_queue_ticket'])

  await openConfirmationModal(customerName, newStatus, ticketData)
}

const openConfirmationModal = async (
  customerName: string,
  newStatus,
  ticketData
) => {
  modalData.value = { customerName, newStatus }
  // Open the modal and pass ticketData as a prop
  const title_request = handleAutoRequestTitle(ticketData)
  const confirmMsg = `${customerName}様の受付ステータスを${newStatus}に変更しますか？`
  await mtUtils
    .confirm(confirmMsg, '確認', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        queueTicketStore
          .updateQueueTicketList(ticketData.id_queue_ticket, {
            ...ticketData,
            title_request: title_request,
            type_visit_purpose_ticket: ticketData.type_visit_purpose_ticket
          })
          .then(async () => {
            // After successful update, call setupQueueTicket
            await refresh() // Call the function
            closeModal() // Close the modal after the operation
          })
      }
    })
}

const filterRowsByLink = (rows, type: any = '1_2') => {
  if (!rows) return []

  if (link.value === -1) {
    if (type == '4') {
      return rows.sort(
        (a, b) => Date.parse(b.datetime_absent) - Date.parse(a.datetime_absent)
      )
    }
    if (type == '3') {
      return rows.sort(
        (a, b) =>
          Date.parse(b.datetime_service_start) -
          Date.parse(a.datetime_service_start)
      )
    }
    if (type == '90_99') {
      return rows.sort(
        (a, b) => Date.parse(b.datetime_bin) - Date.parse(a.datetime_bin)
      )
    }
    return rows
  }

  if (link.value === -1) {
    return rows
  }

  return rows
}

// State Management
const sortState = ref({
  activeSort: localStorage.getItem('queueTicketLastSort') || 'process',
  timeDirection: 'time_asc', // Default ascending
  numberDirection: 'number_asc', // Default ascending
  processDirection: 'process_asc' // Default ascending
})

const isDragEnabled = computed(() => sortState.value.activeSort === 'process')

// Sort handler
const handleSortTypeChange = async () => {
  switch (sortState.value.activeSort) {
    case 'process':
      sortState.value.timeDirection = 'time_asc'
      sortState.value.numberDirection = 'number_asc'
      sortState.value.processDirection = 'process_asc'
      break
    case 'time':
      sortState.value.processDirection = 'process_asc'
      sortState.value.numberDirection = 'number_asc'
      sortState.value.timeDirection = 'time_asc'
      break
    case 'number':
      sortState.value.processDirection = 'process_asc'
      sortState.value.timeDirection = 'time_asc'
      sortState.value.numberDirection = 'number_asc'
      break
  }

  // Save state immediately after change
  localStorage.setItem('queueTicketLastSort', sortState.value.activeSort)
  localStorage.setItem('queueTicketTimeSort', sortState.value.timeDirection)
  localStorage.setItem('queueTicketNumberSort', sortState.value.numberDirection)
  localStorage.setItem(
    'queueTicketProcessSort',
    sortState.value.processDirection
  )

  await handleSortChange()
}

// Mount hook
onMounted(() => {
  // Apply saved sort if exists
  if (sortState.value.activeSort !== 'process') {
    handleSortTypeChange()
  }
})

// Add sortByOption function
const sortByOption = (rows: any[]) => {
  if (!rows) return []

  const direction =
    sortState.value.activeSort === 'process'
      ? sortState.value.processDirection
      : sortState.value.activeSort === 'number'
      ? sortState.value.numberDirection
      : sortState.value.timeDirection

  return [...rows].sort((a, b) => {
    switch (sortState.value.activeSort) {
      case 'process':
        return direction === 'process_asc'
          ? a.process_order - b.process_order
          : b.process_order - a.process_order

      case 'number':
        const numA = parseInt(a.number_queue_ticket)
        const numB = parseInt(b.number_queue_ticket)
        return direction === 'number_asc' ? numA - numB : numB - numA

      case 'time':
        const timeA = new Date(a.datetime_issued).getTime()
        const timeB = new Date(b.datetime_issued).getTime()
        return direction === 'time_asc' ? timeA - timeB : timeB - timeA

      default:
        return 0
    }
  })
}

// Update computed properties that use sortByOption
const filteredRows90_99 = computed(() => {
  const filtered = filterRowsByLink(rows90_99.value, '90_99')
  return sortByOption(filtered)
})

const filteredRows1_2 = computed(() =>
  sortByOption(filterRowsByLink(rows1_2.value, '1_2'))
)
const filteredRows3 = computed(() =>
  sortByOption(filterRowsByLink(rows3.value, '3'))
)
const filteredRows4 = computed(() =>
  sortByOption(filterRowsByLink(rows4.value, '4'))
)

const absentQueueTicketList = computed(() => {
  if (getFilteredQueueTicketLists.value.length) {
    return getFilteredQueueTicketLists.value
      .filter((v: any) => v.flg_auto_absent_updated && !v.flg_absent_confirmed)
      .sort(
        (a, b) => Date.parse(b.datetime_absent) - Date.parse(a.datetime_absent)
      )
  }
  return null
})

const isIpad = computed(() => {
  return Platform.is.ipad
})

const setupQueueTicket = async () => {
  const res1_2 = getFilteredQueueTicketLists.value.filter((ticket) => {
    return (
      ticket.type_status_queue_ticket == '1' ||
      ticket.type_status_queue_ticket == '2'
    )
  })
  status1_2.value = res1_2?.length
  rows1_2.value = res1_2 ? res1_2 : []
  totalStatus.value = getFilteredQueueTicketLists.value.filter((ticket) => {
    return ticket.type_status_queue_ticket == '2'
  })?.length
  const res3 = getFilteredQueueTicketLists.value.filter(
    (ticket) => ticket.type_status_queue_ticket == '3'
  )
  status3.value = res3?.length
  rows3.value = res3 ? res3 : []
  const res4 = getFilteredQueueTicketLists.value.filter(
    (ticket) => ticket.type_status_queue_ticket == '4'
  )
  status4.value = res4?.length
  rows4.value = res4 ? res4 : []
  const res90_99 = getFilteredQueueTicketLists.value.filter((ticket) => {
    return (
      ticket.type_status_queue_ticket == '90' ||
      ticket.type_status_queue_ticket == '99'
    )
  })
  status90_99.value = res90_99?.length
  rows90_99.value = res90_99 ? res90_99 : []
  doctors.value = []
  let qt = [] as string[]
  let colorIndex = 0
  getFilteredQueueTicketLists.value.map((ticket) => {
    map(ticket.queue_detail, (detail) => {
      map(detail.type_doctor_list, (id_doctor) => {
        let d = doctors.value.find((v: any) => v.id == id_doctor)

        if (
          ticket.type_status_queue_ticket === 1 ||
          ticket.type_status_queue_ticket === 2
        ) {
          if (d) {
            d.count++
            if (!d.qt_list.includes(ticket.number_queue_ticket)) {
              d.qt_list.push(
                `${ticket.number_queue_ticket} ${ticket.customer.code_customer} ${ticket.customer.name_customer_display}`
              )
            }
          } else {
            qt.push(
              `${ticket.number_queue_ticket} ${ticket.customer.code_customer} ${ticket.customer.name_customer_display}`
            )

            const doctorFromEmployeeStore = employeeStore.getDoctors.find((v) => v.id_employee === id_doctor)
            if (doctorFromEmployeeStore) {
              doctors.value.push({
                id: id_doctor,
                name: doctorFromEmployeeStore.name_display,
                count: 1,
                qt_list: qt,
                color: doctorFromEmployeeStore.color ?? '#9e9e9e'
              })
            } else {
              if (doctors.value.find((v) => v.id === 0)) {
                doctors.value.find((v) => v.id === 0).count++
              } else {
                doctors.value.push({ id: 0, name: '担当なし', count: 1, qt_list: qt, color: '#9e9e9e' })
              }
            }
            colorIndex++
          }
        }
      })
    })

    qt = []
  })
}
const openRequestDetail = (row) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: row['request'].id_request }
  })
  window.open(route.href, '_blank')
}
const handleStatus = (data: any, status: String) => {
  data[status] = !data[status]
  queueTicketStore
    .updateQueueTicketList(data.id_queue_ticket, data)
    .then(async () => {
      await queueTicketStore.fetchQueueTicketList({
        today: true,
        id_employee_doctor: searchDoctor.value
      })
      setupQueueTicket()
    })
}
const refresh = async () => {
  if (typeAnimal.value) {
    await queueTicketStore.fetchQueueTicketList({
      today: true,
      id_employee_doctor: searchDoctor.value
    })
    return await selectAnimalType(typeAnimal.value)
  }
  await queueTicketStore.fetchQueueTicketList({
    today: true,
    id_employee_doctor: searchDoctor.value
  })
  setupQueueTicket()
}
const selectDefaultEmployee = () => {
  searchDoctor.value = defaultEmployee
}
const updateFlgAbsent = async (ticketData: any) => {
  await mtUtils.promiseAllWithLoader([
    queueTicketStore.updateQueueTicketList(ticketData.id_queue_ticket, {
      flg_absent_confirmed: true
    })
  ])
  queueTicketStore.fetchQueueTicketList({
    today: true,
    id_employee_doctor: searchDoctor.value
  })
  setupQueueTicket()
}

let timeoutId
let intervalId

const startIntervalAtNextMinute = () => {
  const now = new Date()
  const nextMinute = new Date(now.getTime() + 60000)
  nextMinute.setSeconds(0, 0)

  const timeUntilNextMinute = nextMinute - now

  timeoutId = setTimeout(() => {
    refresh() // Call the API immediately at the start of the next minute
    intervalId = setInterval(refresh, 60000) // Set an interval to call the API every 60 seconds
  }, timeUntilNextMinute)
}

const clearDoctorFilter = async () => {
  searchDoctor.value = ''
  await selectedDoctor(null)
}

const openQTRQ = async (row: any) => {
  await mtUtils.smallPopup(UpdQtRequest, { queueTicket: row })
  await mtUtils.promiseAllWithLoader([refresh()])
}

watch(
  () => queueTicketStore.openUpdateModal,
  (nowValue) => {
    if (nowValue) {
      openAddModal()
      actionStore.resetAction()
      localStorage.removeItem('pageAction')
      queueTicketStore.openUpdateModal = false
    }
  }
)

const handleSortChange = async () => {
  await refresh()

  const result = sortByOption(rows1_2.value)
}

const fetchCustomersWithPets = async (page: number = 1) => {
  await customerStore.fetchCustomersWithPets({ page })
}

onMounted(async () => {
  await commonStore.fetchPreparationCommonList(
    { code_common: [1, 13, 29] },
    true
  )
  await cliCommonStore.fetchPreparationCliCommonList(
    { code_cli_common: [4] },
    true
  )
  await queueTicketStore.fetchQueueTicketList({
    today: true,
    id_employee_doctor: searchDoctor.value
  })
  await fetchCustomersWithPets()
  if (
    action.value === 'createQueueTicket' ||
    localStorage.getItem('pageAction') === 'createQueueTicket'
  ) {
    openAddModal()
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
    queueTicketStore.openUpdateModal = false
  }

  queueTicketStore.filterQueueTicketsByTypeAnimal(typeAnimal.value)
  setupQueueTicket()

  startIntervalAtNextMinute()

  typeAnimalOptions.value = getCommonTypeAnimalOptionList.value
    .filter((op) => {
      return op.value !== 3
    })
    .map((opt) => {
      if (opt.value === 1) {
        return {
          label: '全て',
          value: ''
        }
      }
      if (opt.value === 2) {
        return {
          label: '犬',
          value: '00'
        }
      }
      return {
        label: opt.label,
        value: opt.value
      }
    })
  // set page title
  setPageTitle('受付・整理券')

  // Apply saved sort if exists
  if (sortState.value.activeSort !== 'process') {
    await handleSortChange()
  }
})

const selectAnimalType = async (val: number | string) => {
  queueTicketStore.filterQueueTicketsByTypeAnimal(val)
  await setupQueueTicket()
}

const openStatusBoardListModal = async () => {
  await nextTick(() => {
    mtUtils.popup(SearchStatusBoardListModal, {})
  })
}

// Add process order tracking
const currentProcessOrder = ref('asc')

// Notification handler
const showDragDropWarning = () => {
  $q.notify({
    message:
      '順番の並び替えを実行するには「処理順」のフィルターを適応してください',
    color: 'primary',
    icon: 'info',
    position: 'top',
    timeout: 4000,
    actions: [{ icon: 'close', color: 'white' }]
  })
}

// Add drag attempt handler
const handleDragAttempt = () => {
  if (!isDragEnabled.value) {
    showDragDropWarning()
  }
}

const onDrop = async (dropEvent: any) => {
  const { draggedIndex, targetIndex, ...row } = dropEvent

  // Get current sorted rows and ensure they're sorted by process_order
  const currentRows = [...filteredRows1_2.value].sort((a, b) =>
    currentProcessOrder.value === 'asc'
      ? a.process_order - b.process_order
      : b.process_order - a.process_order
  )

  // Calculate new positions
  const draggedItem = currentRows[draggedIndex]
  const targetItem = currentRows[targetIndex]
  const isMovingUp = targetIndex < draggedIndex

  // Remove dragged item
  currentRows.splice(draggedIndex, 1)

  // Insert at new position
  currentRows.splice(targetIndex, 0, draggedItem)

  // Prepare payload
  const payload = {
    queue_ticket_list: []
  }

  // Reassign process orders
  currentRows.forEach((item, index) => {
    const newOrder =
      currentProcessOrder.value === 'asc'
        ? index + 1
        : currentRows.length - index
    payload.queue_ticket_list.push(item.id_queue_ticket)
    payload[item.id_queue_ticket] = newOrder
  })

  try {
    await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'UpdQueueTicketOrder',
      payload
    )
    await refresh()
  } catch (error) {
    console.error('Reorder failed:', error)
    await refresh()
  }
}

const getDayName = (dateString: string) => {
  const date = new Date(dateString).getDay()
  return typeWeekday[date].label
}

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
  if (intervalId) clearInterval(intervalId)
})
</script>
<template>
  <div>
    <MtHeader :notSticky="false">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          <span>受付</span>
          <span class="body2 q-ml-lg">{{
            todaysDate + ' - ' + getDayName(todaysDate)
          }}</span>
        </q-toolbar-title>
        <div class="flex items-center q-mr-md">
          <q-btn
            padding="5px 5px"
            round
            unelevated
            color="white"
            text-color="primery"
            class="q-ml-sm"
            @click="refresh"
          >
            <q-icon size="20px" name="refresh" />
          </q-btn>
        </div>
        <q-btn class="q-mx-sm" outline @click="openStatusBoardListModal">
          <q-icon name="people" class="q-mr-xs" />
          ステータスボード
        </q-btn>

        <q-btn
          unelevated
          color="primary"
          text-color="white"
          class="q-ml-xs"
          @click="openAddModal"
        >
          <q-icon size="20px" name="add" />
          受付
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="q-px-md">
      <div v-if="absentQueueTicketList?.length" class="q-mt-md absent-box">
        <div
          v-for="queue in absentQueueTicketList"
          :key="queue.id_queue_ticket"
          class="q-pa-xs absent-item"
        >
          <span>
            [自動不在]　 呼出
            {{ formatDateWithTime(queue.datetime_absent, 'HH:mm') }}
          </span>
          <span class="q-ml-md">
            {{ queue.number_queue_ticket }} /
            {{ getCustomerName(queue.customer) }} 様 /
            {{
              `${queue?.petList[0]?.id_pet} ${queue?.petList[0]?.name_pet}`
            }}　　 {{ useClinicStore()?.getClinic?.min_auto_absent }} 分間不在
          </span>
          <q-btn
            class="q-ml-lg"
            color="primary"
            size="sm"
            text-color="white"
            unelevated
            @click="updateFlgAbsent(queue)"
          >
            確認しました
          </q-btn>
        </div>
      </div>
      <div class="q-px-md content q-mb-md" style="height: calc(100vh - 49px)">
        <div class="row q-col-gutter-md q-mt-xs">
          <div class="col">
            <div class="row items-center q-mb-sm">
              <div class="col-auto">
                <q-tabs
                  v-model="tab"
                  dense
                  inline-label
                  indicator-color="grey-300"
                  active-bg-color="blue-700"
                  active-class="text-white bold body1"
                  class="ticket-tabs"
                >
                  <q-tab name="受付中" :label="'受付中 (' + status1_2 + ')'" />
                  <q-tab name="呼出済" :label="'呼出済 (' + status3 + ')'" />
                  <q-tab name="不在" :label="'不在 (' + status4 + ')'" />
                  <q-tab name="削除" :label="'削除 (' + status90_99 + ')'" />
                </q-tabs>
              </div>
              <q-space></q-space>
              <div class="col-2 q-mx-md">
                <MtFormPullDown
                  v-model="sortState.activeSort"
                  :options="[
                    { label: '処理順で並び替え', value: 'process' },
                    { label: '整理券番号で並び替え', value: 'number' },
                    { label: '整理券発行時間で並び替え', value: 'time' }
                  ]"
                  @update:model-value="handleSortTypeChange"
                  outlined
                />
              </div>
              <div
                v-if="useClinicStore().getClinic?.min_auto_absent > 0"
                class="col-auto q-pr-md"
              >
                自動不在 : {{ useClinicStore()?.getClinic?.min_auto_absent }} 分
              </div>
              <div v-else class="col-auto q-mr-sm">自動不在なし</div>
              <div class="col-2 q-pr-md">
                <MtFormPullDown
                  v-model:selected="typeAnimal"
                  label="動物区分"
                  :options="
                    getCommonTypeAnimalOptionList.filter((p) =>
                      dayjs(p.date_end).isSame(dayjs('9999/12/31'), 'year')
                    )
                  "
                  outlined
                  @update:selected="refresh"
                />
              </div>
              <div class="col-2 q-pr-md">
                <InputEmployeeOptGroup
                  label="担当医"
                  class=""
                  type-occupation="doctor"
                  v-model:selected="searchDoctor"
                  defaultBlank
                  show-select-default-employee
                  @update:model-value="selectedDoctor"
                  @update:select-default-employee="selectDefaultEmployee"
                />
              </div>
            </div>
            <div class="row q-col-gutter-xs">
              <div class="col-auto q-mr-md">
                <q-list separator>
                  <q-item
                    clickable
                    v-ripple
                    :active="link === -1"
                    active-class="active-menu"
                    @click=";(link = -1), filterVisitPurpose('')"
                  >
                    <q-item-section>全て</q-item-section>
                  </q-item>
                  <q-item
                    clickable
                    v-ripple
                    :active="link === visit.id_cli_common"
                    active-class="active-menu"
                    @click="
                      ;(link = visit.id_cli_common),
                        filterVisitPurpose(visit.id_cli_common)
                    "
                    v-for="(
                      visit, index
                    ) in getCliCommonQTVisitPurposeList.filter((p) =>
                      dayjs(p.date_end).isSame(dayjs('9999/12/31'), 'year')
                    )"
                    :key="index"
                  >
                    <q-item-section>{{ visit.label }}</q-item-section>
                  </q-item>
                </q-list>
              </div>

              <div class="col">
                <q-tab-panels v-model="tab" animated>
                  <q-tab-panel
                    :name="tabData"
                    class="q-pt-none q-px-xs"
                    v-for="(tabData, index) in tabItems"
                    :key="index"
                  >
                    <MtTable2
                      :columns="columns"
                      :rows="
                        index == 0
                          ? filteredRows1_2
                          : index == 1
                          ? filteredRows3
                          : index == 2
                          ? filteredRows4
                          : filteredRows90_99
                      "
                      row-key="name"
                      :classTd="'bg-grey-300 caption2 bold text-grey-800'"
                      :rowsBg="true"
                      flat
                      separator="cell"
                      bordered
                      :style="{
                        height: isIpad
                          ? 'calc(100vh - 160px)'
                          : 'calc(100vh - 130px)',
                        boxShadow: 'none'
                      }"
                      draggable
                      :allowDrop="sortState.activeSort === 'process'"
                      :class="{ 'no-drag': !isDragEnabled }"
                      @onDrop="onDrop"
                      @dragAttempt="handleDragAttempt"
                      @dragstart="handleDragAttempt"
                    >
                      <template v-slot:row="{ row }">
                        <td
                          class="cursor-pointer"
                          :class="row['flg_appointment'] ? 'bg-accent-100' : ''"
                          v-for="(col, index) in columns"
                          :key="index"
                          :data-index="index"
                          @click="onRowClick(row, index)"
                        >
                          <div
                            v-if="col.field == 'label_time'"
                            key="label_time"
                          >
                            <div class="column no-wrap">
                              <div v-if="row['datetime_issued']">
                                <span
                                  class="caption1 regular text-grey-900 text-no-wrap"
                                  >整理券</span
                                >
                                <span
                                  class="caption1 regular text-grey-900 q-ml-sm"
                                  >{{
                                    formatHoursMinutes(row['datetime_issued'])
                                  }}</span
                                >
                              </div>
                              <div v-if="row['datetime_check_in']">
                                <span
                                  class="caption1 regular text-grey-900 text-no-wrap"
                                  >待合
                                </span>
                                <span
                                  class="caption1 regular text-grey-900 q-ml-sm"
                                  >{{
                                    formatHoursMinutes(row['datetime_check_in'])
                                  }}</span
                                >
                              </div>
                              <div v-if="row['datetime_service_start']">
                                <span
                                  class="caption1 regular text-grey-900 text-no-wrap"
                                  >済</span
                                >
                                <span
                                  class="caption1 regular text-grey-900 q-ml-sm"
                                  >{{
                                    formatHoursMinutes(
                                      row['datetime_service_start']
                                    )
                                  }}</span
                                >
                              </div>
                              <div v-if="row['datetime_absent']">
                                <span
                                  class="caption1 regular text-grey-900 text-no-wrap"
                                  >不在</span
                                >
                                <span
                                  class="caption1 regular text-grey-900 q-ml-sm"
                                  >{{
                                    formatHoursMinutes(row['datetime_absent'])
                                  }}</span
                                >
                              </div>
                              <div v-if="row['datetime_cancel']">
                                <span
                                  class="caption1 regular text-grey-900 text-no-wrap"
                                  >キャンセル</span
                                >
                                <span
                                  class="caption1 regular text-grey-900 q-ml-sm"
                                  >{{
                                    formatHoursMinutes(row['datetime_cancel'])
                                  }}</span
                                >
                              </div>
                              <div v-if="row['datetime_bin']">
                                <span
                                  class="caption1 regular text-grey-900 text-no-wrap"
                                  >削除</span
                                >
                                <span
                                  class="caption1 regular text-grey-900 q-ml-sm"
                                  >{{
                                    formatHoursMinutes(row['datetime_bin'])
                                  }}</span
                                >
                              </div>
                            </div>
                          </div>
                          <div
                            v-if="col.field == 'number_queue_ticket'"
                            key="number_queue_ticket"
                          >
                            <div class="column items-center no-wrap">
                              <div v-if="row['number_queue_ticket']">
                                <div class="q-mb-xs">
                                  <span class="num-qt-box q-pr-sm">{{
                                    row['number_queue_ticket']
                                  }}</span>
                                  <span
                                    v-if="
                                      row['type_status_queue_ticket'] === 1 ||
                                      row['type_status_queue_ticket'] === 2
                                    "
                                    :style="{
                                      backgroundColor:
                                        doctors.find((doc) => {
                                          return (
                                            doc.id === row['id_employee_doctor']
                                          )
                                        })?.color ?? doctorColors[0]
                                    }"
                                    class="num-process"
                                  >
                                    {{ row['process_order'] }}
                                  </span>
                                </div>
                                <div
                                  v-if="
                                    row['request'] && row['request'].id_request
                                  "
                                  class="text-blue caption1 regular text-grey-900"
                                  @click="openRequestDetail(row)"
                                >
                                  <span v-if="row['request']">{{
                                    row['request'].number_request
                                  }}</span>
                                </div>
                                <div
                                  v-else
                                  class="text-blue cursor-pointer"
                                  @click.stop="openQTRQ(row)"
                                >
                                  <!-- <div v-if="row.type_status_queue_ticket == 2 || row.type_status_queue_ticket == 3">-->
                                  <q-icon name="search" /> RQ
                                  <!--</div>-->
                                </div>
                              </div>
                              <div
                                v-if="row['flg_new_customer']"
                                class="q-mb-xs"
                              >
                                <q-badge
                                  class="bg-ticket1 caption2 bold justify-center custom-badge"
                                  text-color="white"
                                  label="新"
                                  rounded
                                />
                              </div>
                              <div
                                v-if="row['flg_visit_for_pet']"
                                class="q-mb-xs"
                              >
                                <q-badge
                                  class="bg-ticket3 caption2 bold justify-center custom-badge"
                                  text-color="white"
                                  label="見"
                                  rounded
                                />
                              </div>
                              <div
                                v-if="row['flg_appointment']"
                                class="q-mb-xs"
                              >
                                <q-badge
                                  class="bg-ticket2 caption2 bold justify-center custom-badge"
                                  text-color="white"
                                  label="予"
                                  rounded
                                />
                              </div>
                              <div
                                v-if="row['flg_web_payment_requested']"
                                class="q-mb-xs"
                              >
                                <q-badge
                                  class="bg-ticket4 caption2 bold justify-center custom-badge"
                                >
                                  <q-icon name="payment" color="white" />
                                </q-badge>
                              </div>
                            </div>
                          </div>
                          <div
                            v-if="col.field == 'customer_info'"
                            key="customer_info"
                          >
                            <div class="column">
                              <span
                                class="caption1 regular text-grey-900 q-mb-sm"
                                >{{ row['code_customer'] }}</span
                              >
                              <!-- <span class="caption2 regular text-grey-700">{{
                                getCustomerKanaNameHonorific(
                                  getCustomer(row['id_customer'])
                                )
                              }}</span> -->
                              <div class="row items-center no-wrap">
                                <span class="caption1 bold text-grey-900">
                                  {{
                                    getCustomerName(
                                      getCustomer(row['id_customer'])
                                    )
                                  }}
                                </span>
                                <small class="q-ml-xs">様</small>
                                <q-badge
                                  v-if="
                                    getCustomerLabelColor(
                                      getCustomer(row['id_customer'])
                                        ?.type_customer_color
                                    )
                                  "
                                  rounded
                                  :color="
                                    getCustomerLabelColor(
                                      getCustomer(row['id_customer'])
                                        ?.type_customer_color
                                    )
                                  "
                                  style="width: 12px; height: 12px"
                                  :style="{
                                    color: getCustomerLabelColor(
                                      getCustomer(row['id_customer'])
                                        ?.type_customer_color
                                    ),
                                    backgroundColor: getCustomerLabelColor(
                                      getCustomer(row['id_customer'])
                                        ?.type_customer_color
                                    )
                                  }"
                                  class="q-ml-sm"
                                />
                                <q-icon
                                  @click.stop="
                                    row.customer.email1 !== '' ||
                                    row.customer.email2 !== ''
                                      ? emailSendModalOpen(row)
                                      : ''
                                  "
                                  :class="{
                                    'active-email-icon':
                                      row.customer.email1 !== '' ||
                                      row.customer.email2 !== '',
                                    'disable-email-icon':
                                      row.customer.email1 === '' &&
                                      row.customer.email2 === ''
                                  }"
                                  name="email"
                                />
                              </div>
                            </div>
                          </div>
                          <div v-if="col.field == 'name_pet'" key="name_pet">
                            <div class="caption1 regular text-grey-900">
                              <div
                                v-for="pet in row['petList']"
                                class="q-my-xs ellipsis"
                              >
                                {{ pet?.name_pet }}
                                <q-badge
                                  rounded
                                  :color="
                                    getTypeAnimalColor(
                                      pet?.common_name?.name_common
                                    )
                                  "
                                  style="width: 12px; height: 12px"
                                  :style="{
                                    'background-color': getTypeAnimalColor(
                                      pet?.common_name?.name_common
                                    )
                                  }"
                                  class="q-ml-xs q-mt-xs"
                                />
                                <span
                                  class="q-ml-md">{{ visitPurpose(row?.queue_detail?.[pet.id_pet]?.type_purpose_list) }}</span>
                                <span class="q-ml-md">
                                  <q-icon
                                    name="person" /> {{ displayDoctors(row?.queue_detail?.[pet.id_pet]?.type_doctor_list) }}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div v-if="col.field == 'memo'" key="memo">
                            <div
                              class="caption2 regular text-grey-800 bg-accent-200 ellipsis-2-lines"
                            >
                              {{ row['memo_customer'] }}
                            </div>
                            <q-separator
                              v-if="row['memo_customer'] || row['memo_admin']"
                              color="grey-400"
                              class="q-my-sm"
                            />
                            <div
                              class="caption2 regular text-grey-800 bg-grey-100 ellipsis-2-lines"
                            >
                              {{ row['memo_admin'] }}
                              <q-tooltip>{{ row['memo_admin'] }}</q-tooltip>
                            </div>
                          </div>
                          <div
                            v-if="col.field == 'type_status_queue_ticket'"
                            key="status"
                          >
                            <div
                              class="caption1 regular text-grey-900 ellipsis"
                              @click.stop
                            >
                              <MtFormPullDown
                                v-model:selected="
                                  row['type_status_queue_ticket']
                                "
                                :clearable="false"
                                :options="statusQueueTicket"
                                outlined
                                @update:selected="filterQueueTicket(row)"
                              />
                            </div>
                          </div>
                          <div v-if="col.field == 'flags'" key="flags" class="">
                            <div
                              class="body1 column items-center regular text-grey-900"
                              style="gap: 8px"
                            >
                              <div
                                class="curser-pointer"
                                @click.stop="handleStatus(row, 'flg_tel_requested')"
                              >
                                <q-btn
                                  round
                                  :outline="
                                    row['flg_tel_requested'] ? false : true
                                  "
                                  size="sm"
                                  :color="
                                    row['flg_tel_requested']
                                      ? 'blue-7'
                                      : 'grey-7'
                                  "
                                >
                                  <q-icon name="settings_phone" />
                                </q-btn>
                              </div>
                              <div
                                class="curser-pointer"
                                @click.stop="handleStatus(row, 'flg_parking_wait')"
                              >
                                <q-btn
                                  round
                                  :outline="
                                    row['flg_parking_wait'] ? false : true
                                  "
                                  size="sm"
                                  :color="
                                    row['flg_parking_wait']
                                      ? 'blue-7'
                                      : 'grey-7'
                                  "
                                >
                                  <q-icon name="directions_car" />
                                </q-btn>
                              </div>
                            </div>
                          </div>
                          <div
                            v-if="col.field == 'type_process_time'"
                            key="type_process_time"
                          >
                            <div
                              class="caption1 regular text-grey-900 text-center"
                            >
                              {{ getProcessTime(row['type_process_time']) }}
                            </div>
                          </div>
                        </td>
                      </template>
                    </MtTable2>
                  </q-tab-panel>
                </q-tab-panels>
              </div>
            </div>
          </div>
          <div class="col-auto">
            <div class="q-mb-sm q-pb-xs text-center">
              <q-icon size="20px" name="person" class="text-blue-700" />
              <span class="caption1 regular text-grey-800 q-ml-xs">合計</span>
              <span class="q-mx-sm title1 bold text-grey-900"
                >{{ totalStatus }}組</span
              >
              <span class="caption1 regular text-grey-800">待ち</span>
            </div>
            <div class="column">
              <template
                v-for="(doctor, index) in _.orderBy(
                  doctors,
                  ['count'],
                  ['desc']
                )"
                :key="index"
              >
                <q-btn-dropdown
                  class="q-mb-sm"
                  split
                  :label="`${doctor?.name}(${doctor?.count})`"
                  size="sm"
                  align="center"
                  unelevated
                  content-class="caption1 bold"
                  @click="onFilterDoctorClick(doctor)"
                  :style="{ backgroundColor: doctor.color, color: '#fff' }"
                >
                  <q-list>
                    <q-item
                      clickable
                      v-close-popup
                      v-for="(qt, i) in doctor.qt_list"
                    >
                      <q-item-section>
                        <q-item-label @click="onFilterQTClick(qt)">{{
                          qt
                        }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </template>
              <q-btn
                v-if="searchDoctor"
                label="絞込解除"
                unelevated
                size="sm"
                color="primary"
                @click="clearDoctorFilter"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.q-table {
  th {
    padding: 7px;
  }

  td {
    padding: 7px;
  }
}

.custom-badge {
  width: 20px;
  height: 20px;
}

.medicalExmColor {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: #ffb444;
}

.status {
  padding: 5px;
}

.ticket-tabs {
  .q-tab {
    min-width: 125px;
    border-right: 1px solid $grey-200;
  }
}

.active-menu {
  border-right: 13px solid $blue-700;
}

.absent-box {
  border: 2px solid $red;
  background-color: #ffeceb;
  padding: 5px 10px;
  border-radius: 5px;
  height: 100%;
  .absent-item {
    max-height: 120px;
  }
}
.num-qt-box {
  // border: 2px solid $blue-700;
  // background-color: #e6f7ff;
  // padding: 5px 10px;
  border-radius: 5px;
  font-weight: 900;
  font-size: 28px;
}

.num-process {
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 900;
  font-size: 14px;
  color: #fff;
}

.active-email-icon {
  margin-left: auto;
  font-size: 20px;
  color: #424242;
}

.active-email-icon:hover {
  transform: Scale(1.2);
}

.disable-email-icon {
  margin-left: auto;
  font-size: 20px;
  color: #b2babb;
}

.employeeName {
  padding-top: 2px;
  padding-bottom: 2px;
}

.no-drag {
  cursor: default !important;
}
.no-drag tr {
  cursor: default !important;
  user-select: none;
  -webkit-user-drag: none;
}
</style>
