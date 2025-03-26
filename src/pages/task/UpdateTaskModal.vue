<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'
import usePetStore from '@/stores/pets'
import useTextTemplateStore from '@/stores/text-template'
import {
  calculateDate,
  calculateDays,
  concatenate,
  copyText,
  dateFormat,
  formatDate,
  formatDateWithTime,
  formatHoursMinutes,
  formatTime,
  getDateTimeNow,
  getDateToday,
  getDaysAfter,
  getFullPetName,
  getHoursAfter,
  getHoursAfterByDate
} from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import selectOptions from '@/utils/selectOptions'
import useTask from '@/stores/task'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import useRequestStore from '@/stores/requests'
import { sortBy } from 'lodash'
import { event_bus } from '@/utils/eventBus'
import {
  timeHourMinute,
  typeLinkCategory,
  typeTaskReview,
  typeRepeatTimeUi,
  typeRepeatRangeUi
} from '@/utils/enum'
import dayjs, { Dayjs } from 'dayjs'
import { roundToNearestQuarterHour } from '@/utils/roundToNearestQuarterHour'
import useCliCommonStore from '@/stores/cli-common'
import { CliCommon } from '@/types/types'

interface TaskDepList {
  label: string
  value: number
}

const data = reactive({
  id_link1: '',
  number_link1: '',
  type_link1: 0,
  id_category1: '',
  id_category2: '',
  name_category1: '',
  name_category2: '',
  title_task: '',
  memo_task_todo: '',
  datetime_plan: null,
  flg_emargency: false,
  type_department: null,
  place_task: '',
  id_employee_request: '',
  datetime_request: null,
  flg_unassigned: false,
  id_employee_staff: '',
  flg_start_arroval_required: false,
  flg_approved: false,
  flg_completed: false,
  flg_task_reviewed1: false,
  flg_task_reviewed2: false,
  id_pet: '',
  name_employee_staff: '',
  id_customer: '',
  code_customer: '',
  name_customer: '',
  name_pet: '',
  id_prescription: null,
  id_prescription_detail: null,
  flg_non_charge: false,
  flg_task_hospital: false,
  type_task_review: 99,
  flg_prepared: false,
  flg_closed: false,
  datetime_approved: null,
  id_employee_approved: null,
  val_order: null,
  datetime_task_plan: null,
  id_pet_custody: '',
  flg_pet_custody_ui: false,
  type_repeat_range_ui: 3,
  type_repeat_time_ui: 3,
  flg_task_future_date_ui: false,
  date_repeat_start_ui: null,
  date_repeat_end_ui: null,
  id_clinic: null
})

const flg_repetitive_ui = ref(false)
const petCustodyList = ref([])
const petCustodyDefaultList = reactive([])
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const isNextDay = computed(() => {
  // Step 1: Parse plan_HH_MM to get the initial plan time
  if (!plan_HH_MM.value) return true

  const [hours, minutes] = plan_HH_MM.value.split(':').map(Number)
  let planDate = new Date()
  planDate.setHours(hours, minutes, 0, 0) // Set plan time for today

  if (data.type_repeat_time_ui > 20) {
    return true
  }
  // Step 2: Convert repeat_range_ui to minutes
  const repeatMinutes = convertToMinutes(
    typeRepeatRangeUi.find((t) => t.value == data.type_repeat_range_ui)?.enLabel
  )

  // Step 3: Calculate total added time
  const totalAddedMinutes = repeatMinutes * data.type_repeat_time_ui

  // Step 4: Add total added time to initial plan time
  planDate.setMinutes(planDate.getMinutes() + totalAddedMinutes)

  // Step 5: Check if the resulting time is on the next day
  const isNextDay = planDate.getDate() !== new Date().getDate()
  checkedFlgTaskFutureDateUi(!isNextDay)
  if (isNextDay) {
    data.flg_task_future_date_ui = false
  }
  return isNextDay
})

// Helper function to convert repeat_range_ui to minutes
function convertToMinutes(range) {
  if (!range) return 0
  const unit = range.slice(-1)

  const value = parseFloat(range.slice(0, -1))

  switch (unit) {
    case 'M':
      return value // Already in minutes
    case 'H':
      return value * 60 // Convert hours to minutes
    case 'D':
      return value * 24 * 60 // Convert hours to minutes in days
    case 'W':
      return value * 24 * 60 * 7 // Convert hours to minutes in days
    case 'O':
      return value // Convert hours to minutes in days
    default:
      return 0
  }
}
const now = dayjs()
const roundedTime = roundToNearestQuarterHour(now as Dayjs)

const requestStore = useRequestStore()
const taskStore = useTask()
const { getRequest } = storeToRefs(requestStore)
const { getTaskSearchParams } = storeToRefs(taskStore)
const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const employeeStore = useEmployeeStore()
const petsStore = usePetStore()
const templateStore = useTextTemplateStore()
const cliCommonStore = useCliCommonStore()
const isEdit = ref(false)
const customerList = ref([])
const customerListDefault = reactive([])
let selectedCustomer = reactive([])
const isPet = ref(false)
const petList: any = ref([])
const petListDefault: any = reactive([])
const parentCategory: any = ref([])
const parentCategoryDefault: any = reactive([])
const subCategory: any = ref([])
const subCategoryDefault: any = reactive([])
const emits = defineEmits(['close'])
const { getAllSubCategories, getAllCategories } = storeToRefs(categoryStore)
const { getCustomerOption } = storeToRefs(customerStore)
const { getTemplates } = storeToRefs(templateStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const today_request = ref(getDateToday())
const today_plan = ref(getDateToday())
const request_HH = ref('00')
const request_MM = ref('00')
const plan_HH_MM = ref(roundedTime.format('HH:mm'))
const date_end_ui = ref(getDateToday())
const end_plan_HH_MM_ui = ref('00:00')
const flg_control_title_task = ref(true)
const showNumberRequest = ref(false)
const dataLoaded = ref(false)
const taskCompleted = ref(false)
const plan_day = ref('today')
const time_range = ref([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
const reqDateTime = ref('')
const calculatedTaskList = ref(0)
const todatDateTime = ref(formatDateWithTime(getDateTimeNow()))
const addTemplateModalFlg = ref(false),
  textTemplatesList = ref([])
const taskDepList = ref<TaskDepList[]>([])

const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  copiedTaskData: {
    type: Boolean,
    default: false
  },
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  isCustody: {
    type: Object,
    default: {
      value: false
    }
  }
})
const formTaskRef = ref(props.data)
const id_pet_custody_ui = ref(false)
const closeModal = () => {
  emits('close')
}

async function selectingCustomer(value: any, initCall = false) {
  data.id_customer = value
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
    await customerStore.selectCustomerOptions(value)
    selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      data.name_customer = selectedCustomer.name_customer_display
      data.code_customer = selectedCustomer.code_customer

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
        if (!isEdit.value && petList.value.length > 0) {
          data.id_pet = petList.value[0].value // set first pet as default in create task
          selectingPet(petList.value[0].value)
        }
      }
    }
  } else {
    data.id_pet = ''
    isPet.value = false
    petList.value.length = 0
    petListDefault.length = 0
    data.name_customer = ''
    data.code_customer = ''
    data.name_pet = ''
    data.id_customer = ''
  }
}

async function assignPageData(row: any) {
  if (row) {
    for (let key in row) {
      data[key] = row[key]
    }
  }
}

const selectingPet = async (value: any) => {
  if (value) {
    data.name_pet = selectedCustomer?.pets.find(
      (pet: any) => pet.id_pet === value
    )?.name_pet
  } else {
    data.name_pet = ''
  }
}

const handleCategory = (value: any) => {
  if (value === null) {
    data.id_category2 = ''
  }
}
const handleUnAssigned = (value: any) => {
  if (value === true) {
    data.id_employee_staff = ''
  }
}
const checkedFlgTaskFutureDateUi = (value: any) => {
  if (!value) {
    date_end_ui.value = null
    end_plan_HH_MM_ui.value = null
    return
  }
  end_plan_HH_MM_ui.value = plan_HH_MM.value
  date_end_ui.value = calculateDate(today_plan.value, 2)
  calculateRepetitiveTask()
  return
}
const handleTypeTask = (value: any) => {
  data.place_task =
    taskDepList.value.find((i: any) => i.value === value)?.label || ''
}
const openSearchTemplateModal = async () => {
  if (getTemplates.value.length === 0) {
    await templateStore.fetchTemplates()
  }
  if (
    getTemplates.value &&
    getTemplates.value.length &&
    getTemplates.value.length > 0
  ) {
    textTemplatesList.value = sortBy(getTemplates.value, 'display_order', 'asc')
      .filter((template) => template.type_text_template === 81)
      .map((template: any) => {
        return {
          title: template.memo_template,
          flg_title: template.flg_title,
          attr: {
            class: template.flg_title ? 'bg-grey-300' : ''
          },
          isSelected: false
        }
      })
    addTemplateModalFlg.value = true
  }
}
const handleAutoTaskTitle = () => {
  let autoTitle = ''
  const nameEmployeeRequest = employeeStore.getAllEmployees.find(
    (emp: any) => emp.value === data.id_employee_request
  )
  const TypeTaskPlace = taskDepList.value.find(
    (item) => item.value === data.type_department
  )
  const selectedCustomerData = customerStore.getAllCustomers?.find(
    (cus) => cus.value == data.id_customer
  )
  // const selectedPet = petsStore.getPets?.find((pet) => pet.value == data.id_pet)
  const nameEmployeeStaff = employeeStore.getAllEmployees.find(
    (emp: any) => emp.value === data.id_employee_staff
  )
  const selectedPet = getCustomerOption.value?.pets?.find(
    (pet: any) => pet.value == data.id_pet
  )
  const fixedText = nameEmployeeStaff?.label ? 'から ' : ''
  if (data.type_link1 !== 0) {
    let selectedTypeLink1 = typeLinkCategory.find(
      (item) => item.value === data.type_link1
    )
    autoTitle =
      (TypeTaskPlace?.label !== undefined ? TypeTaskPlace?.label : '') +
      ' ' +
      (selectedTypeLink1?.label !== undefined ? selectedTypeLink1?.label : '') +
      ' ' +
      (data.id_link1 !== undefined ? data.id_link1 : '') +
      ' ' +
      (nameEmployeeRequest?.label !== undefined
        ? nameEmployeeRequest?.label
        : '') +
      ' ' +
      (fixedText !== undefined ? fixedText : '') +
      (nameEmployeeStaff?.label !== undefined ? nameEmployeeStaff?.label : '') +
      ' ' +
      (data.code_customer !== undefined ? data.code_customer : '') +
      ' ' +
      (getFullPetName(selectedPet, selectedCustomerData) !== undefined
        ? getFullPetName(selectedPet, selectedCustomerData)
        : '')
    return autoTitle
  } else {
    autoTitle =
      (TypeTaskPlace?.label !== undefined ? TypeTaskPlace?.label : '') +
      ' ' +
      (nameEmployeeRequest?.label !== undefined
        ? nameEmployeeRequest?.label
        : '') +
      ' ' +
      (nameEmployeeStaff?.label !== undefined ? nameEmployeeStaff?.label : '') +
      ' ' +
      (data.code_customer !== undefined ? data.code_customer : '') +
      ' ' +
      (getFullPetName(selectedPet, selectedCustomerData) !== undefined
        ? getFullPetName(selectedPet, selectedCustomerData)
        : '')
    return autoTitle
  }
}

async function selectedCategory1(value: any) {
  data.id_category1 = value
  if (value) {
    data.flg_start_arroval_required = categoryStore.getAllCategories.filter(
      (i) => i?.id_category === value
    )[0]?.flg_approval_required
  } else {
    data.flg_start_arroval_required = false
    data.type_department = null
    handleTypeTask(data?.type_department)
  }
}

function selectedCategory2(value: any) {
  data.id_category2 = value
  if (value) {
    data.type_department = categoryStore.getSubCategories.find(
      (v) => v.id_category === value
    )?.type_department
    handleTypeTask(data?.type_department)
  }
}

function calculateRepetitiveTask() {
  calculatedTaskList.value = []
  if (!plan_HH_MM.value) return true

  const [hours, minutes] = plan_HH_MM.value.split(':').map(Number)
  let initialPlanDate = new Date(today_plan.value)
  initialPlanDate.setHours(hours, minutes, 0, 0) // Set initial plan time for today

  const valueToTime = convertToMinutes(
    typeRepeatRangeUi.find((t) => t.value == data.type_repeat_range_ui)?.enLabel
  )

  for (let i = 0; i < data.type_repeat_time_ui; i++) {
    // Calculate the date for the current task
    let taskDate = new Date(initialPlanDate) // Create a new Date object for each task
    if (
      typeRepeatRangeUi
        .find((t) => t.value == data.type_repeat_range_ui)
        ?.enLabel.endsWith('O')
    ) {
      // Handle month addition
      taskDate.setMonth(taskDate.getMonth() + valueToTime * (i + 1))
    } else {
      // For units other than months, add minutes
      if (i > 0) taskDate.setMinutes(taskDate.getMinutes() + valueToTime * i)
    }

    calculatedTaskList.value.push({
      val_order: i + 1,
      datetime_plan_ui: dateFormat(taskDate, 'YYYY/MM/DD HH:mm'),
      datetime_plan: dateFormat(taskDate, 'YYYY/MM/DD HH:mm') + ':00',
      flg_valid: true
    })
  }
  if (data.flg_task_future_date_ui) {
    let totalDays = calculateDays(today_plan.value, date_end_ui.value)
    let tempEachDayTask = []

    for (let day = 1; day < totalDays; day++) {
      // Start from 1 as we want to add tasks for future dates
      calculatedTaskList.value.forEach((task, index) => {
        let taskDate = new Date(task.datetime_plan)
        taskDate.setDate(taskDate.getDate() + day)

        tempEachDayTask.push({
          val_order: calculatedTaskList.value.length * day + (index + 1),
          datetime_plan_ui: dateFormat(taskDate, 'YYYY/MM/DD HH:mm'),
          datetime_plan: dateFormat(taskDate, 'YYYY/MM/DD HH:mm') + ':00',
          flg_valid: true,
          flg_repetitive: true
        })
      })
    }
    calculatedTaskList.value = [...calculatedTaskList.value, ...tempEachDayTask]
  }
}

async function fetchPetCustodyList(value) {
  petCustodyList.value.length = 0
  petCustodyList.value = [...petCustodyDefaultList]
  if (!value) return
  if (petCustodyDefaultList.length > 0) return

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'SearchPetCustodyList'
  )

  if (response) {
    response.forEach((petCustody: any) => {
      let tempDate = formatDate(petCustody.datetime_start_plan) + ' ～ '
      if (petCustody.datetime_goal_plan)
        tempDate += ' ' + formatDate(petCustody.datetime_goal_plan)
      let tempPetCustody = {
        label:
          petCustody.number_pet_custody +
          ' ' +
          getFullPetName(petCustody.pet, petCustody.customer) +
          `（  ${tempDate}  ）`,
        value: petCustody.id_pet_custody
      }
      petCustodyDefaultList.push(tempPetCustody)
      petCustodyList.value = [...petCustodyDefaultList]
    })
  }
}

const submit = async () => {
  if (today_request.value != '') {
    data.datetime_request = today_request.value
    data.datetime_request +=
      request_HH.value !== null ? ' ' + request_HH.value : ' 00'
    data.datetime_request +=
      request_MM.value !== null ? ':' + request_MM.value : ':00'
    data.datetime_request += ':00'
  }
  if (today_plan.value != '') {
    data.datetime_plan = today_plan.value
    data.datetime_plan +=
      plan_HH_MM.value !== null ? ' ' + plan_HH_MM.value : ' 00'
    data.datetime_plan += ':00'
  }
  data.type_link1 = data.type_link1 === 0 ? null : data.type_link1

  data.name_category1 = getAllCategories.value.find(
    (v) => data.id_category1 === v.value
  )?.label
  data.name_category2 = getAllSubCategories.value.find(
    (v) => data.id_category2 === v.value
  )?.label

  data.title_task = flg_control_title_task
    ? handleAutoTaskTitle()
    : data.title_task
  //return
  if (isEdit.value) {
    await taskStore
      .updateTask(data.id_task, data)
      .then(async () => {
        if (getTaskSearchParams.value)
          await taskStore.fetchTask(getTaskSearchParams.value)
        if (getRequest.value)
          await taskStore.fetchTaskByRequest(getRequest.value?.id_request)

        props.updatedFlg.value = true
        closeModal()
        mtUtils.autoCloseAlert(aahMessages.success)
      })
      .catch((error) => {})
  } else {
    if (data.type_link1 === 2) data.number_link1 = data.id_link1

    if (flg_repetitive_ui.value) {
      taskStore
        .submitTask(
          { ...data, repetitive_task_list: calculatedTaskList.value },
          '/repetitive_tasks'
        )
        .then(async () => {
          if (getTaskSearchParams.value)
            await taskStore.fetchTask(getTaskSearchParams.value)
          if (getRequest.value)
            await taskStore.fetchTaskByRequest(getRequest.value?.id_request)
          closeModal()
          mtUtils.autoCloseAlert(aahMessages.success)
        })
        .catch((error) => {})
      return
    }

    taskStore
      .submitTask({ ...data, repetitive_task_list: calculatedTaskList.value })
      .then(async () => {
        if (getTaskSearchParams.value)
          await taskStore.fetchTask(getTaskSearchParams.value)
        if (getRequest.value)
          await taskStore.fetchTaskByRequest(getRequest.value?.id_request)
        closeModal()
        mtUtils.autoCloseAlert(aahMessages.success)
      })
      .catch((error) => {})
  }
  event_bus.emit('taskAdded')
}

const handleTypeLink = () => {
  if (data.type_link1 === null || data.type_link1 === 0) {
    showNumberRequest.value = false
    data.type_link1 = 0
  } else if (data.type_link1 !== null || data.type_link1 !== 0) {
    showNumberRequest.value = true
    data.id_link1 = data.number_link1
  }
}

const handleTaskTitle = (value: any) => {
  if (value === true) {
    data.title_task = ''
  }
}

const getTaskDepList = async () => {
  taskDepList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: parseInt(obj.code_func1)
  }))
}

const init = () => {
  if (data.flg_start_arroval_required === false) {
    data.flg_approved = false
    data.flg_prepared = true
  } else {
    if (data.flg_approved === true) {
      data.flg_prepared = true
      data.datetime_approved = getDateTimeNow()
      if (localStorage.getItem('id_employee')) {
        data.id_employee_approved = JSON.parse(
          localStorage.getItem('id_employee')
        )
      }
    } else {
      data.flg_prepared = false
      data.datetime_approved = null
      data.id_employee_approved = null
    }
  }
  // check if task completed
  if (
    data.type_task_review == '1' &&
    data.flg_completed === true &&
    data.flg_task_reviewed1 === true
  ) {
    taskCompleted.value = true
  }
  if (
    data.type_task_review == '2' &&
    data.flg_completed === true &&
    data.flg_task_reviewed1 === true &&
    data.flg_task_reviewed2 === true
  ) {
    taskCompleted.value = true
  }
  if (
    data.type_task_review == '2' &&
    data.flg_completed === true &&
    data.flg_task_reviewed1 === false &&
    data.flg_task_reviewed2 === false
  ) {
    taskCompleted.value = true
  }
}
const headerClass = computed(() => {
  if (taskCompleted.value) {
    return 'success-row green'
  } else if (data.flg_emargency) {
    return 'alert-row text-darkred'
  }
  return '' // Default class
})
const iconName = computed(() => {
  if (data.flg_emargency) {
    return 'run_circle'
  } else {
    return ''
  }
})
const nonUrgency = computed(() => {
  return data.flg_emargency
})
const setTime = (hour: Number) => {
  let day = plan_day.value
  today_plan.value =
    day == 'today'
      ? getDateToday()
      : day == 'tomorrow'
      ? getDaysAfter(1)
      : getDaysAfter(2)
  hour = hour < 10 ? '0' + hour : hour
  plan_HH_MM.value = hour + ':00'
}

const selectDefaultEmployee = (key: string) => {
  data[key] = defaultEmployee
}

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  await getTaskDepList()
  if (
    categoryStore.getAllCategories &&
    categoryStore.getAllCategories.length > 0
  ) {
    parentCategory.value = [
      ...categoryStore.getAllCategories.filter((i) => i?.parentCategory === 1)
    ]
    parentCategoryDefault.push(...parentCategory.value)
  }

  if (props.data?.id_task) {
    await assignPageData(props.data)
    isEdit.value = true
    handleTypeLink()
    if (props.data?.id_pet_custody) {
      id_pet_custody_ui.value = true
    }
    if (props.data.id_customer != '' || props.data.id_customer !== null) {
      await selectingCustomer(props.data.id_customer)
      selectingPet(props.data.id_pet)
    }
    if (props.data.id_category1 != '' || props.data.id_category1 !== null) {
      selectedCategory1(props.data.id_category1)
    }
    if (
      props.data.datetime_request !== '' ||
      props.data.datetime_request !== null
    ) {
      today_request.value = formatDate(props.data.datetime_request)
      let req_time = formatTime(props.data.datetime_request)
      request_HH.value = req_time.split(':')[0]
      let m = req_time.split(':')[1]
      request_MM.value = Math.ceil(m / 5) * 5
      reqDateTime.value = formatDateWithTime(props.data.datetime_request)
    }
    if (props.data.datetime_plan !== '' || props.data.datetime_plan !== null) {
      today_plan.value = formatDate(props.data.datetime_plan)
      plan_HH_MM.value = formatHoursMinutes(props.data.datetime_plan)
    }
  } else if (props.copiedTaskData) {
    await assignPageData(props.data)
    handleTypeTask(props.data?.type_department)
    handleTypeLink()
    if (props.data.id_customer != '' || props.data.id_customer !== null) {
      await selectingCustomer(props.data.id_customer)
    }
    if (props.data.id_category1 != '' || props.data.id_category1 !== null) {
      selectedCategory1(props.data.id_category1)
    }
    today_request.value = getDateToday()
    let currentTime = formatHoursMinutes(getDateTimeNow())
    request_HH.value = currentTime.split(':')[0]
    let m = currentTime.split(':')[1]
    request_MM.value =
      Math.ceil(m / 5) * 5 == 60 ? Math.floor(m / 5) * 5 : Math.ceil(m / 5) * 5

    // today_plan.value = getDaysAfter(4)
    let newTime = getHoursAfter(3)
    let newMinute = formatHoursMinutes(newTime).split(':')[1]
    if (newMinute > 45) {
      plan_HH_MM.value =
        formatDateWithTime(getHoursAfterByDate(newTime, 1), 'HH') + ':00'
    } else {
      plan_HH_MM.value =
        formatHoursMinutes(newTime).split(':')[0] +
        ':' +
        Math.ceil(newMinute / 15) * 15
    }
  } else {
    isEdit.value = false
    if (localStorage.getItem('id_employee')) {
      data.id_employee_request = JSON.parse(localStorage.getItem('id_employee'))
    }
    let currentTime = formatHoursMinutes(getDateTimeNow())
    request_HH.value = currentTime.split(':')[0]
    let m = currentTime.split(':')[1]
    request_MM.value = Math.ceil(m / 5) * 5
    let newDate = getHoursAfter(4)
    data.datetime_plan = formatDate(newDate)
    data.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
  fetchPetCustodyList(true)
  init()
  dataLoaded.value = true
})
</script>

<template>
  <q-form class="column full-height" @submit="submit">
    <MtModalHeader
      @closeModal="closeModal"
      :closeBtn="true"
      :class="headerClass"
      class="col-auto"
    >
      <q-toolbar-title
        :class="{ 'cursor-pointer': data.number_task }"
        @click="data.number_task ? copyText(data.number_task) : null"
        class="title2 bold"
      >
        <q-icon
          v-if="nonUrgency"
          :name="iconName"
          class="q-mr-xs"
          size="24px"
        />
        {{ isEdit ? 'タスク番号：' : '新規タスク' }}
        <span v-if="data.number_task">
          {{ data.number_task }}
          <q-icon class="text-blue" name="content_copy" />
        </span>
        <span class="q-ml-sm">
          （
          <MtFormCheckBox
            type="checkbox"
            label="事務タスク ）"
            v-model:checked="data.flg_task_hospital"
          />
        </span>
      </q-toolbar-title>
    </MtModalHeader>
    <q-scroll-area visible class="full-width col column">
      <q-card-section class="full-width col q-px-lg">
        <!-- Basic setting for task -->
        <div class="q-mb-sm">
          <h4 class="text-white bg-grey-600 title4">基本設定</h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{ isEdit ? '' : 'タスク内容を設定してください。' }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <MtCategorySelectionComponent
            :data="formTaskRef"
            :flg_for_task="true"
            @category1Selected="selectedCategory1"
            @category2Selected="selectedCategory2"
          />
          <div class="col-3">
            <MtFormPullDown
              v-model:selected="data.type_department"
              :options="taskDepList"
              :rules="[aahValidations.validationRequired]"
              label="対応部署 *"
              required
              type="selection"
              @update:selected="handleTypeTask"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_emargency"
              label="至急対応"
              type="checkbox"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div v-if="!flg_control_title_task" class="col-9">
            <MtInputForm
              v-model="data.title_task"
              :disable="flg_control_title_task"
              :filled="flg_control_title_task"
              :label="
                flg_control_title_task
                  ? '保存時に自動でタイトルを生成します'
                  : 'タスク名 *'
              "
              :rules="[aahValidations.validationRequired]"
              required
              type="text"
            />
          </div>
          <div v-if="data.title_task !== undefined" class="col-auto">
            <MtInputForm
              v-model="flg_control_title_task"
              :items="[{ label: '自動タイトル' }]"
              type="checkbox"
              @update:model-value="handleTaskTitle"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col">
            <MtInputForm
              v-model="data.memo_task_todo"
              autogrow
              class="add-template-field"
              label="タスク・指示内容"
              type="text"
            >
              <template v-slot:append>
                <q-btn
                  class="cursor-pointer"
                  flat
                  icon="queue"
                  label="テンプレ"
                  @click.stop="openSearchTemplateModal"
                >
                </q-btn>
              </template>
            </MtInputForm>
          </div>
        </div>
        <div v-if="isEdit" class="row items-center q-col-gutter-md q-mb-md">
          <MtInputForm
            v-model="data.flg_closed"
            :items="[{ label: 'クローズする' }]"
            type="checkbox"
          />
        </div>
        <hr class="light q-mb-lg" />
        <!-- From who to who, until when the task needs to be done -->
        <div class="q-mb-md q-mt-lg">
          <h4 class="text-white bg-grey-600 title4">
            {{ isEdit ? '担当者・期日' : '誰がいつまでに実施すべきですか？' }}
          </h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{ isEdit ? '' : 'タスクの担当者と期日を指定してください。' }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
            <InputEmployeeOptGroup
              v-model:selected="data.id_employee_staff"
              :disable="data.flg_unassigned"
              label="主担当者（タスク実施）"
              show-select-default-employee
              @update:select-default-employee="
                selectDefaultEmployee('id_employee_staff')
              "
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_unassigned"
              label="担当者指名なし"
              type="checkbox"
              @update:checked="handleUnAssigned"
            />
          </div>
          <div v-if="isEdit && id_pet_custody_ui" class="col-6">
            <MtFilterSelect
              v-model:selecting="data.id_pet_custody"
              :options="petCustodyList"
              :options-default="petCustodyDefaultList"
              label="連携する管理"
            />
          </div>
          <div v-if="!isEdit" class="col-3">
            <MtFormCheckBox
              v-model:checked="flg_repetitive_ui"
              label="繰り返しタスク"
              type="checkbox"
              @update:checked="
                (value) => {
                  if (value) calculatedTaskList = []
                }
              "
            />
          </div>
        </div>
  
        <div v-if="flg_repetitive_ui" class="repeat-setting">
          <div class="row">
            <div class="col-6">
              <div class="repeat-task-title">繰り返し条件の設定</div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-6">
                  <MtFormCheckBox
                    v-model:checked="data.flg_pet_custody_ui"
                    label="入院・預かりとの連携"
                    type="checkbox"
                    @update:checked="
                      (value) => {
                        if (!value) data.id_pet_custody = null
                      }
                    "
                  />
                </div>
                <div v-if="data.flg_pet_custody_ui" class="col-12">
                  <MtFilterSelect
                    v-model:options="petCustodyList"
                    v-model:selecting="data.id_pet_custody"
                    :options-default="petCustodyDefaultList"
                    label="連携する管理"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-my-md">
                <div class="col-6">
                  <MtFormPullDown
                    v-model:selected="data.type_repeat_range_ui"
                    :options="typeRepeatRangeUi"
                    :rules="[aahValidations.validationRequired]"
                    label="繰り返し期間"
                    required
                    @update:selected="calculateRepetitiveTask()"
                  />
                </div>
                <div class="col-6">
                  <MtFormPullDown
                    v-model:selected="data.type_repeat_time_ui"
                    :options="typeRepeatTimeUi"
                    :rules="[aahValidations.validationRequired]"
                    label="繰り返し回数"
                    required
                    type="selection"
                    @update:selected="calculateRepetitiveTask()"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-my-md">
                <div class="col-6">
                  <MtFormInputDate
                    v-model:date="today_plan"
                    :rules="[aahValidations.validationRequired]"
                    label="初回タスク日 *"
                    required
                    type="date"
                    @update:date="calculateRepetitiveTask()"
                  />
                </div>
                <div class="col-5">
                  <MtFormPullDown
                    v-model:selected="plan_HH_MM"
                    :options="timeHourMinute"
                    :rules="[aahValidations.validationRequired]"
                    label="時：分 *"
                    required
                    type="selection"
                    @update:selected="calculateRepetitiveTask()"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-my-md">
                <div class="col-6">
                  <MtFormCheckBox
                    v-model:checked="data.flg_task_future_date_ui"
                    :disable="isNextDay"
                    label="下記日時まで繰り返す"
                    type="checkbox"
                    @update:checked="checkedFlgTaskFutureDateUi"
                  />
                </div>
              </div>
              <div
                v-if="isNextDay"
                class="row justify-center items-center text-grey-600 q-pt-md"
              >
                上記設定では日をまたぐ為、終了日の設定はできません。
              </div>
              <div
                v-if="data.flg_task_future_date_ui"
                class="row q-col-gutter-md q-mb-md"
              >
                <div class="col-6">
                  <MtFormInputDate
                    v-model:date="date_end_ui"
                    :rules="[aahValidations.validationRequired]"
                    label="繰り返し終了予定日 *"
                    required
                    type="date"
                  />
                </div>
              </div>
            </div>
            <div class="col-6">
              <div class="row q-col-gutter-md q-mb-sm">
                <q-space></q-space>
                <div class="col-auto">
                  <q-btn
                    flat
                    icon="calculate"
                    label="対象日時を計算"
                    @click="calculateRepetitiveTask"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md suggested-repeat-list q-mb-sm">
                <div class="col-12 caption1 text-grey-700">
                  ✓が入った日時で繰り返しタスクを作成できます。
                </div>
                <q-scroll-area style="width: 100%; height: 225px">
                  <div
                    v-for="(task, index) in calculatedTaskList"
                    :key="index"
                    class="q-mb-xs cursor-pointer col-12"
                  >
                    <MtFormCheckBox
                      v-model:checked="task.flg_valid"
                      :disable="index == 0"
                      class="q-mr-sm"
                      type="checkbox"
                    />
                    <span class="q-mr-md">
                      {{ task.val_order }}
                      <small class="text-grey-600">回</small>
                    </span>
                    <span class="q-mr-md">
                      <small class="text-grey-600">{{
                        task.datetime_plan_ui
                      }}</small>
                    </span>
                  </div>
                </q-scroll-area>
              </div>
              <div class="row justify-center items-center text-grey-600 q-pt-md">
                条件を指定して計算ボタンを押下してください。
              </div>
            </div>
          </div>
        </div>
        <!-- End -->
        <div
          v-if="!(isEdit || flg_repetitive_ui)"
          class="row q-pa-sm q-mt-lg q-mb-md"
        >
          <div class="col-auto q-col-gutter-md bg-accent-050">
            <div class="q-px-md q-py-sm">
              <small class="text-grey-600 q-mr-md">入力補助：終了予定</small>
              <small>
                <MtInputForm
                  v-model="plan_day"
                  :items="[
                    { label: '今日', value: 'today' },
                    { label: '明日', value: 'tomorrow' },
                    { label: '明後日', value: 'day-after-tomorrow' }
                  ]"
                  type="radio"
                />
              </small>
              <!-- Select today or tomorrow for start-plan date -->
            </div>
            <div class="q-pa-sm q-ml-md q-mb-none">
              <small
                v-for="(hour, i) in time_range"
                :key="i"
                class="input-assist-datetime"
                @click="setTime(hour)"
                >{{ hour }}時</small
              >
            </div>
            <div class="q-pa-sm q-ml-md q-mb-md">
              <small class="text-grey-700 q-mr-md">
                現在時刻：
                {{ todatDateTime }}
              </small>
              <!-- Show current date & time format yyyy/mm/dd hh:mm -->
            </div>
          </div>
        </div>
        <template v-if="!flg_repetitive_ui">
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="today_plan"
                :rules="[aahValidations.validationRequired]"
                label="終了予定日 *"
                required
                type="date"
              />
            </div>
            <div class="col-2">
              <MtFormPullDown
                v-model:selected="plan_HH_MM"
                :options="timeHourMinute"
                :rules="[aahValidations.validationRequired]"
                label="時：分 *"
                required
                type="selection"
              />
            </div>
          </div>
        </template>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-3">
            <InputEmployeeOptGroup
              v-model:selected="data.id_employee_request"
              :rules="[aahValidations.validationRequired]"
              label="タスク依頼者 *"
              required
              show-select-default-employee
              @update:select-default-employee="
                selectDefaultEmployee('id_employee_request')
              "
            />
          </div>
          <div v-if="isEdit" class="col-3">
            <MtInputForm
              v-model="reqDateTime"
              label="タスク依頼日時"
              readonly
              type="text"
            >
            </MtInputForm>
          </div>
        </div>
        <hr class="light q-mb-lg" />
        <!-- Task reviewer setting -->
        <div class="q-mb-md q-mt-lg">
          <h4 class="text-white bg-grey-600 title4">
            {{ isEdit ? '承認の設定・状況' : '承認・レビューは必要ですか？' }}
          </h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{
              isEdit
                ? ''
                : 'タスク開始前の承認必須や、タスク完了後のレビューが必要な場合には設定してください。'
            }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_start_arroval_required"
              :disable="data.flg_approved"
              label="開始前の承認必須"
              type="checkbox"
              @update:checked="init"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-if="data.flg_start_arroval_required"
              v-model:checked="data.flg_approved"
              label="承認済"
              type="checkbox"
              @update:checked="init"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-12 q-mb-none">
            タスク終了後の承認者数：
            <span>
              <template v-for="(type, i) in typeTaskReview">
                <MtFormRadiobtn
                  v-model:selected="data.type_task_review"
                  :label="type.label"
                  :val="type.value"
                  type="radio"
                />
              </template>
            </span>
            <p class="caption1 text-grey-600">
              ※ タスク完了後のレビューは基本不要です。
            </p>
          </div>
        </div>
        <hr class="light q-mb-lg" />
        <!-- Define which data would be associated with this task -->
        <div class="q-mb-md q-mt-lg">
          <h4 class="text-white bg-grey-600 title4">
            {{ isEdit ? '関連情報' : '連携するデータはありますか？' }}
          </h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{
              isEdit
                ? ''
                : '[オプション] リクエスト、オーナー・ペット、サービス、処方箋などタスクに紐づく情報を設定してください。'
            }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
            <MtFilterSelect
              v-model:options="customerList"
              v-model:selecting="data.id_customer"
              :options-default="customerListDefault"
              class="q-pb-none"
              label="診察券番号・オーナー名"
              @update:selecting="selectingCustomer"
            />
          </div>
          <div v-show="isPet" class="col-3">
            <MtFilterSelect
              v-model:options="petList"
              v-model:selecting="data.id_pet"
              :options-default="petListDefault"
              label="ペット名"
              @update:selecting="selectingPet"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-auto">
            <span class="body1 regular text-grey-700">連携区分 :</span>
          </div>
          <div class="col-10">
            <MtInputForm
              v-model="data.type_link1"
              :items="typeLinkCategory"
              class="q-mr-lg"
              type="radio"
              @update:model-value="handleTypeLink"
            />
            <div class="row">
              <div class="col-4 q-mt-sm q-mb-lg">
                <MtInputForm
                  v-if="showNumberRequest"
                  v-model="data.id_link1"
                  :rules="[aahValidations.validationRequired]"
                  label="連携番号"
                  required
                  type="text"
                />
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-scroll-area>
    <q-card-section class="q-bt bg-white col-auto">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="タスク指示内容テンプレート"
    :options="textTemplatesList"
    :data="data"
    memoKey="memo_task_todo"
  />
</template>

<style lang="scss">
.add-template-field {
  .q-field__control {
    align-items: center !important;
  }
}

.repeat-task-title {
  font-size: medium;
  font-weight: bold;
  margin-bottom: 20px !important;
  color: rgb(30, 71, 57);
}

.repeat-setting {
  background-color: rgb(215, 255, 242);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 10px;
}

.suggested-repeat-list {
  background-color: rgb(233, 255, 248);
  border-radius: 10px;
  padding: 15px !important;
  margin: 15px 0 15px 20px !important;
}
// .content {
//   &::-webkit-scrollbar {

//   }
// }
</style>
