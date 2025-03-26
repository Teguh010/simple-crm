<script setup lang="ts">
import { onMounted, onUnmounted, nextTick, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import { orderBy } from 'lodash'
import mtUtils from '@/utils/mtUtils'
import CreateLabResultModal from './CreateLabResultModal.vue'
import {
  dateFormat,
  formatDateWithTime,
  getCurrentPetAgeInMonth,
  getCustomerName,
  getDateToday
} from '@/utils/aahUtils'
import useIllnessHistoryStore from '@/stores/illness-history'
import MtFormRadiobtn from '../form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import GetPdfLabResultOne from '@/pages/labResult/GetPdfLabResultOne.vue'
import { LAB_CATEGORY_PARENT_ID } from '@/utils/constent'
import { date } from 'quasar'
import UpdateLabResultModal from './UpdateLabResultModal.vue'
import GetPdfLabResultComparison from '@/pages/labResult/GetPdfLabResultComparison.vue'
import UpdateInfoListModal from '@/pages/info/UpdateInfoListModal.vue'
import { Category, CliCommon, Common, IllnessHistoryType } from '@/types/types'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '@/stores/common'
import selectOptions from '@/utils/selectOptions'
import useCliCommonStore from '@/stores/cli-common'
import useLabPrintStore from '@/stores/lab-prints'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import useServiceDetailStore from '@/stores/service-details'
import UpdateLabSetModal from '@/pages/master/lab/UpdateLabSetModal.vue'
import MtModalHeaderLabResult from './MtModalHeaderLabResult.vue'
import GetPdfFixedLabComparisonView from '@/pages/labResult/GetPdfFixedLabComparisonView.vue'
import { useHtmlBox } from '@/composables/useHtmlBox'

const props = defineProps({
  id_pet: String,
  id_pet_illness_history: String,
  hideHeader: false,
  defaultYearPeriod: {
    type: String,
    default: 'all'
  },
  fixedFilter: {
    type: Boolean,
    default: false
  },
  scrollAreaRef: Object,
  illnessHistorySelected: Object,
  isSidebarOpen: { type: Boolean, default: false }
})
const categoryStore = useCategoryStore()
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const serviceDetailStore = useServiceDetailStore()
const labPrintStore = useLabPrintStore()

const { getIllnessHistorys, getIllnessHistory } =
  storeToRefs(illnessHistoryStore)
const { getAllSubCategories } = storeToRefs(categoryStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getCommonDeviceOptionList } = storeToRefs(commonStore)
const { getLabPrints } = storeToRefs(labPrintStore)

const showUnitRange = ref(false)
const selectLatest6Days = ref(false)
const selectLabPrint = ref(null)
const pdfFixedLabComparisonDialog = ref(false)
const yearPeriod = ref(props.defaultYearPeriod)
const illnessHistoryList = ref<IllnessHistoryType[]>([])
const illnessHistoryListDefault = reactive<{ label: string; value: number }[]>(
  []
)
const illnessHistorySelected = ref()
const searchLabName = ref('')

const illnessHistoryRef = ref()
const tabs = ref('basic_inspection')
const itemCheckList = ref({})
const dateCheckList = ref({})
const router = useRouter(),
  route = useRoute()
const file_for_t_info = ref(null)
const checklistData = ref({})
const apiCalled = ref(false)
const groupedData = ref({})
const categoryGroupedList = ref({})
const labPrintList = reactive([])
const columnData = ref({})
const labData = ref({})
const deviceData = ref({})
const alreadyVisited = ref([])
const nextPage = ref(null)
const Container = ref(null)
const tableMaxWidth = ref('100%')
const toolBarRef = ref<HTMLElement | null>(null)
const { cHeight: boxCHeight, height: boxHeight } = useHtmlBox(toolBarRef)

const tableVersion = ref(0)

const labResultListByPet = ref([])

const pdfConfirmationDialog = ref(false)
const pdfConfiguration = reactive({
  color: '1',
  flgShowValResultBg: true,
  flgShowIcons: true
})
const pdfAttributes = reactive({
  labResult: { render: false, mode: 'download' }
})
const labResultRowsData = ref([] as any[])

const dataReady = ref(false)

const onEnterPress = () => {
  illnessHistoryRef.value?.focus()
}
const addingColumn = () => {
  groupedData.value = {}
  categoryGroupedList.value = {}
  columnData.value = {}
  labData.value = {}
  deviceData.value = {}

  const petLabResult = labResultListByPet.value.map(v => {
    const category = categoryStore.getAllCategories.find(c => c.id_category == v.id_category2_lab)
    return { ...v, datetime_registered: formatDateWithTime(v.datetime_registered), category }
  })

  const sortedLabResult = orderBy(
    petLabResult,
    ['datetime_registered', 'lab_set.display_order', 'lab_device.display_order', 'id_lab_result'],
    ['desc', 'asc', 'asc', 'asc']
  )

  const deviceIdMapping = {}
  let currentIndex = 0

  sortedLabResult
    .map(item => {
      let lab_set_device = item.id_cm_device && item.lab_device ? item.lab_device : item.lab_set
      return lab_set_device ? { ...item, lab_set_device, lab: lab_set_device.lab ?? item.lab } : { ...item }
    })
    .forEach(item => {
      if (!deviceIdMapping.hasOwnProperty(item.id_cm_device))
        deviceIdMapping[item.id_cm_device] = currentIndex++
      const deviceId = item.id_cm_device ? deviceIdMapping[item.id_cm_device] : item.id_category2_lb2

      if (!groupedData.value[item.id_category2_lab])
        groupedData.value[item.id_category2_lab] = {}
      if (!checklistData.value[item.id_category2_lab])
        checklistData.value[item.id_category2_lab] = {}
      if (!columnData.value[item.id_category2_lab])
        columnData.value[item.id_category2_lab] = {}
      if (!labData.value[item.id_category2_lab])
        labData.value[item.id_category2_lab] = {}

      if (!groupedData.value[item.id_category2_lab][deviceId])
        groupedData.value[item.id_category2_lab][deviceId] = {
          lab_set_type: item.id_cm_device ? 'lab-device' : item.id_category2_lb2 ? 'lab-set' : 'lab-ref',
          lr_value: {}
        }
      if (!labData.value[item.id_category2_lab][deviceId])
        labData.value[item.id_category2_lab][deviceId] = []
      if (!checklistData.value[item.id_category2_lab][deviceId])
        checklistData.value[item.id_category2_lab][deviceId] = { checked: false }
      if (!categoryGroupedList.value[`cat${item.id_category2_lab}`])
        categoryGroupedList.value[`cat${item.id_category2_lab}`] = {}
      if (!deviceData.value[deviceId])
        deviceData.value[deviceId] = item.id_cm_device ? item.id_cm_device : item.id_category2_lb2
      if (!columnData.value[item.id_category2_lab][deviceId])
        columnData.value[item.id_category2_lab][deviceId] = [
          {
            name: 'name_lab',
            label: '項目',
            field: 'name_lab',
            align: 'left',
            width: '150px',
            order: 1
          },
          {
            name: 'id_cm_unit',
            label: '単位',
            field: 'id_cm_unit',
            align: 'center',
            width: '60px',
            order: 2
          },
          {
            name: 'range',
            label: '基準値',
            field: 'range',
            align: 'center',
            width: '80px',
            order: 3
          }
        ]

      const date = formatDateWithTime(item.datetime_registered)

      if (!groupedData.value[item.id_category2_lab][deviceId].lr_value[date])
        groupedData.value[item.id_category2_lab][deviceId].lr_value[date] = []
      if (!columnData.value[item.id_category2_lab][deviceId].find(v => v.name === 'date' && formatDateWithTime(v.date) == date)) {
        columnData.value[item.id_category2_lab][deviceId].push({
          name: 'date',
          label: date,
          date,
          field: 'date',
          align: 'center',
          colspan: '2',
          order: 4
        })
        columnData.value[item.id_category2_lab][deviceId] = orderBy(
          columnData.value[item.id_category2_lab][deviceId],
          ['order', 'date'],
          ['asc', 'desc']
        )
      }

      if (
        !labData.value[item.id_category2_lab][deviceId].find(v => v.id_lab == item.id_lab) ||
        !groupedData.value[item.id_category2_lab][deviceId].lr_value[date].find(v =>
          formatDateWithTime(v.datetime_registered) == date &&
          (item.id_cm_device != null ? v.id_cm_device == item.id_cm_device : true) &&
          v.id_lab == item.id_lab
        )
      ) {
        groupedData.value[item.id_category2_lab][deviceId].lr_value[date].push(item)
      }

      categoryGroupedList.value[`cat${item.id_category2_lab}`] = {
        ...categoryStore.getAllCategories.find(v => v.id_category == item.id_category2_lab),
        device_id: deviceId
      }

      if (
        !labData.value[item.id_category2_lab][deviceId].find(v => v.id_lab == item.id_lab) ||
        !groupedData.value[item.id_category2_lab][deviceId].lr_value[date].find(v =>
          formatDateWithTime(v.datetime_registered) == date &&
          (item.id_cm_device != null ? v.id_cm_device == item.id_cm_device : true) &&
          v.id_lab == item.id_lab
        )
      ) {
        if (item.lab_set_device) {
          labData.value[item.id_category2_lab][deviceId].push({
            ...item.lab_set_device,
            lab_set_device: item.lab_set_device,
            ranges: {
              low_critical: item.low_critical,
              low: item.low,
              high: item.high,
              high_critical: item.high_critical
            }
          })
        } else {
          labData.value[item.id_category2_lab][deviceId].push({
            ...item,
            lab_set_device: { display_order: 9999999999 },
            ranges: {
              low_critical: item.low_critical,
              low: item.low,
              high: item.high,
              high_critical: item.high_critical
            }
          })
        }
      }
      if (
        !labData.value[item.id_category2_lab][deviceId].find(v => v.field == 'service_detail') &&
        item.id_service_detail
      ) {
        labData.value[item.id_category2_lab][deviceId].push({
          field: 'service_detail',
          label: 'Service Detail'
        })
      }
      labData.value[item.id_category2_lab][deviceId] = orderBy(
        labData.value[item.id_category2_lab][deviceId],
        ['lab_set_device.display_order', 'lab_device.display_order', 'lab_set.display_order']
      )
    })

  // Initialize dateCheckList and itemCheckList for every category/device index
  for (const id in groupedData.value) {
    if (!dateCheckList.value[id]) dateCheckList.value[id] = {}
    if (!itemCheckList.value[id]) itemCheckList.value[id] = {}
    for (const deviceIndex in groupedData.value[id]) {
      if (!dateCheckList.value[id][deviceIndex]) dateCheckList.value[id][deviceIndex] = {}
      if (!itemCheckList.value[id][deviceIndex]) itemCheckList.value[id][deviceIndex] = {}
    }
  }

  nextTick(() => {
    dataReady.value = true
    // Increment tableVersion to force re-render if needed.
    tableVersion.value++
  })
}

const onServiceDetailClick = async (id_service_detail: string) => {
  serviceDetailStore.fetchServiceDetailById(id_service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
}

const openAddModal = async (data: Object | null = null) => {
  await mtUtils.popup(CreateLabResultModal, { id_pet: props.id_pet, additional: data })
  await init()
}
const onRowClick = async (
  col,
  id_category,
  id_device_category,
  lab_set_type
) => {
  if (col.field === 'date') {
    await mtUtils.popup(UpdateLabResultModal, {
      id_pet: props.id_pet,
      date: col.date,
      id_category2_lab: id_category,
      id_device_category,
      lab_set_type
    })
    labResultListByPet.value = []
    alreadyVisited.value = []
    nextPage.value = null
    await init()
  } else {
    return false
  }
}
const showValResult = (value: any, id_lab: number) => {
  if (value) {
    const findData = value.find((element) => element.id_lab == id_lab)
    if (findData) {
      const v1 = findData.val_result?.toString()?.replace(',', '')
      if (parseFloat(v1) > parseFloat(findData.high))
        return `<span class="q-ml-xs" style="color: red">${findData.val_result} <small>▲</small></span>`
      else if (parseFloat(v1) < parseFloat(findData.low))
        return `<span class="q-ml-xs" style="color: blue">${findData.val_result} <small>▼</small></span>`
      return findData.val_result
    }
  }
  return ''
}
const showQualifier = (value: any, id_lab: string) => {
  if (value) {
    const findData = value.find((element) => element.id_lab == id_lab)
    if (findData) {
      return findData.qualifier ? findData.qualifier : findData.qualifier
    }
  }
  return ''
}
const scrollToSection = (val: string) => {
  // TODO
  // emit('scrollToItem', val)
  const element = document.getElementById(val)
  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}
const typeLabUnitName = (value) =>
  useCommonStore().getCommonUnitOptionList.find(
    (item) => item.id_common === value
  )?.name_common
const filter = async () => {
  let startDate, endDate, currentDate
  if (yearPeriod.value === 'last90days') {
    // get last 90 days
    endDate = getDateToday()
    startDate = dateFormat(
      new Date(new Date().setDate(new Date(endDate).getDate() - 90))
    )
  } else if (yearPeriod.value === 'current') {
    // set start date as first date of current year, end date as today
    endDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(endDate), {
        year: new Date(endDate).getFullYear(),
        month: 1,
        day: 1
      })
    )
  } else if (yearPeriod.value === 'last') {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(currentDate), {
        year: new Date(currentDate).getFullYear() - 1,
        month: 1,
        day: 1
      })
    )
    endDate = dateFormat(
      date.adjustDate(new Date(currentDate), {
        year: new Date(currentDate).getFullYear() - 1,
        month: 12,
        day: 31
      })
    )
  }
  let filters = {}
  if (startDate && endDate)
    Object.assign(filters, { date_start: startDate, date_end: endDate })
  if (props.illnessHistorySelected || illnessHistorySelected.value)
    Object.assign(filters, {
      id_pet_illness_history:
        props.illnessHistorySelected ?? illnessHistorySelected.value
    })
  if (searchLabName.value)
    Object.assign(filters, { name_lab: searchLabName.value.toLowerCase() })

  return filters
}
const updateCategoryCheckboxBar = (id_category: number, deviceIndex: number) => {
  checklistData.value[id_category][deviceIndex].checked =
    !checklistData.value[id_category][deviceIndex].checked
  updateCategoryCheckbox(checklistData.value[id_category][deviceIndex].checked, id_category, deviceIndex)
}

const updateCategoryCheckbox = (value: boolean, id_category: number, deviceIndex: number) => {
  if (value) {
    const dates = columnData.value?.[id_category]?.[deviceIndex].find(col => col.field === 'date')
    if (!dateCheckList.value[id_category]) dateCheckList.value[id_category] = {}
    if (!itemCheckList.value[id_category]) itemCheckList.value[id_category] = {}
    if (!dateCheckList.value[id_category][deviceIndex])
      dateCheckList.value[id_category][deviceIndex] = {}
    if (!itemCheckList.value[id_category][deviceIndex])
      itemCheckList.value[id_category][deviceIndex] = {}
    Object.assign(dateCheckList.value[id_category][deviceIndex], { [dates.date]: true })
    labData.value[id_category][deviceIndex].forEach(element => {
      Object.assign(itemCheckList.value[id_category][deviceIndex], { [element.id_lab]: true })
    })
  } else {
    dateCheckList.value[id_category][deviceIndex] = {}
    itemCheckList.value[id_category][deviceIndex] = {}
  }
}
const getCategoryName = (id_category: number) =>
  getAllSubCategories.value.find(
    (item: Category) => item.id_category == id_category
  )?.name_category
const getDeviceName = (id: number, lab_set_type: string) => {
  if (lab_set_type == 'lab-device')
    return getCommonDeviceOptionList.value.find(
      (item: Common) => item.id_common == id
    )?.name_common
  else if (lab_set_type == 'lab-set')
    return categoryStore.getCategoriesLB2.find(
      (item: Category) => item.id_category == id
    )?.name_category
  else
    return cliCommonStore.getCliCommonOuterLabRef.find(
      (item: CliCommon) => item.id_cli_common == id
    )?.name_cli_common
}
const openLabSetModal = async (
  id_category_device: number,
  lab_set_type: string
) => {
  if (lab_set_type == 'lab-set')
    await mtUtils.mediumPopup(UpdateLabSetModal, {
      id_category: id_category_device,
      lab_set_type
    })
  if (lab_set_type == 'lab-device')
    await mtUtils.mediumPopup(UpdateLabSetModal, {
      id_device: id_category_device,
      lab_set_type
    })

  labResultListByPet.value = []
  await init()
}

const init = async (filters: object | null = null) => {
  dataReady.value = false
  filters = await filter()
  await fetchMoreData1(false)
  await addingColumn()
  await nextTick()
  dataReady.value = true
}

const fetchMoreData1 = async (fetchMore: boolean = true) => {
  await fetchMoreData(fetchMore)
}

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value,
    page_size: 1000
  }

  if (fetchMore) {
    if (!nextPage.value) {
      return
    }
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'lab_results',
    filterData,
    true
  )

  if (response && response.data) {
    if (!alreadyVisited.value.includes(nextPage.value)) {
      labResultListByPet.value.push(...response.data)
      alreadyVisited.value.push(response.current)
    }
    if (response.next) {
      nextPage.value = response.next.split('page=')[1]
    } else {
      nextPage.value = null
    }
  }
}

const openLabResultMultiModal = async () => {
  await mtUtils.popup(GetPdfLabResultComparison, {
    dateCheckList: dateCheckList.value,
    itemCheckList: itemCheckList.value,
    groupedData: groupedData.value,
    callback: fillPdfToPPs,
    showValResult
  })
}

const pdfLabResultComparisonCallBack = async (pdfContent: String) => {
  let stylesHtml = ''
  for (const node of [
    ...document.querySelectorAll('link[rel="stylesheet"], style')
  ]) {
    stylesHtml += node.outerHTML
  }
  const PPP = `<!DOCTYPE html>
  <html>
    <head>
      ${stylesHtml}
    </head>
    <body>
      ${pdfContent}
    </body>
  </html>`

  var options = {
    margin: 10,
    filename: 'output.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }

  html2pdf()
    .set(options)
    .from(PPP)
    .toPdf()
    .get('pdf')
    .then(function (pdf) {
      var blob = pdf.output('blob')
      blob.name = 'output.pdf'
      file_for_t_info.value = blob
    })
}

const fillPdfToPPs = (pdf_blob: Blob, pdfFileName: string = '') => {
  if (pdfFileName.length == 0) {
    pdfFileName = `${date.formatDate(
      Date.now(),
      'YYYYMMDD'
    )}_比較_${getCustomerName(getCustomer.value)}様`
  }
  const name_customer = getCustomer.value.name_customer_display
  const clinic = JSON.parse(localStorage.getItem('clinic'))?.label
  const message_content = `${name_customer} 様<br><br>検査結果を以下に添付させていただきます。<br>ご確認をお願いいたします。 `
  mtUtils.popup(UpdateInfoListModal, {
    predefinedFile: pdf_blob,
    predefinedMessage: message_content,
    customerObj: getCustomer.value,
    lineMessageType: 'lab_report',
    pdfFileName: pdfFileName,
    fromLabResult: true
  })
}

const togglePdfConfirmation = () => {
  pdfConfirmationDialog.value = !pdfConfirmationDialog.value
}

const openLabResultOneModal = async (confirmation: string = 'sendMyVetty') => {
  labResultRowsData.value.length = 0
  Object.keys(checklistData.value).forEach(idxc => {
    const indexCategory = checklistData.value[idxc]
    Object.keys(indexCategory)
      .filter(idxd => indexCategory[idxd].checked)
      .forEach(async idxd => {
        const category = getAllSubCategories.value.find((item: Category) => item.id_category == idxc)
        if (groupedData.value[idxc] && groupedData.value[idxc][idxd]?.lr_value) {
          Object.keys(groupedData.value[idxc][idxd]?.lr_value).forEach(registeredDate => {
            const examRegisteredDate = registeredDate.endsWith('00:00')
              ? registeredDate.slice(0, -5)
              : registeredDate.slice(0, -3) + '時頃'
            if (
              itemCheckList.value[idxc] &&
              itemCheckList.value[idxc][idxd] &&
              dateCheckList.value[idxc] &&
              dateCheckList.value[idxc][idxd] &&
              dateCheckList.value[idxc][idxd][registeredDate]
            ) {
              labResultRowsData.value.push({
                flgNameRow: true,
                ...category,
                registeredDate: examRegisteredDate
              })
            }
            const lab_result = groupedData.value[idxc][idxd]?.lr_value[registeredDate]
            const lab_result_sorted = orderBy(
                lab_result?.filter(result => {
                  if (
                    itemCheckList.value[idxc] &&
                    itemCheckList.value[idxc][idxd] &&
                    dateCheckList.value[idxc] &&
                    dateCheckList.value[idxc][idxd]
                  ) {
                    return (
                      Object.entries(itemCheckList.value[idxc][idxd])
                        .filter(v => v[1])
                        .map(v => parseInt(v[0]))
                        .includes(result.id_lab) &&
                      Object.entries(dateCheckList.value[idxc][idxd])
                        .filter(v => !!v[1])
                        .map(v => v[0])
                        .includes(result.datetime_registered)
                    )
                  }
                  return false
                }),
                ['lab_set_device.display_order', 'lab_set.display_order', 'lab_device.display_order']
              )
            
            lab_result_sorted.forEach((value, key) => {
              labResultRowsData.value.push({
                ...value,
                labCategoryId: idxc,
                registeredDate: examRegisteredDate
              })

              if (value.id_service_detail && key == (lab_result_sorted.length - 1)) {
                labResultRowsData.value.push({
                  flgSDRow: true,
                  id_service_detail: value.id_service_detail,
                  number_service_detail: value.number_service_detail,
                })
              }
            })
          })
        }
      })
  })

  pdfAttributes.labResult.render = true
  pdfAttributes.labResult.mode = confirmation
}

const handleFilterChange = ({ yearPeriod, illness_history }) => {
  labResultListByPet.value = []
  alreadyVisited.value = []
  nextPage.value = null
  illnessHistorySelected.value = illness_history

  init()
}

defineExpose({
  fetchMoreData1,
  openLabResultMultiModal,
  togglePdfConfirmation,

  handleFilterChange,
  openAddModal,
  toolBarRef
})

const handleSelectLatestSixDays = (val: boolean) => {
  Object.keys(checklistData.value).forEach(idCategory => {
    Object.keys(checklistData.value[idCategory]).forEach(deviceIndex => {
      checklistData.value[idCategory][deviceIndex].checked = val
      updateCategoryCheckbox(val, idCategory, deviceIndex)
      if (columnData.value[idCategory][deviceIndex] && Array.isArray(columnData.value[idCategory][deviceIndex])) {
        const latestSixDates = columnData.value[idCategory][deviceIndex]
          .filter(col => col.field === 'date')
          .slice(0, 6)
        latestSixDates.forEach(col => {
          dateCheckList.value[idCategory][deviceIndex][col.date] = val
        })
      }
    })
  })
}

const generateFixLabComparisonPdf = async (mode: 'print' | 'download') => {
  if(!selectLabPrint.value) {
    mtUtils.alert('Please select a Lab Print record')
    return
  }

  await mtUtils.pdfRender(GetPdfFixedLabComparisonView, {
    idLabPrint: selectLabPrint.value,
    idPet: props.id_pet,
    mode
  })
}

const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}


onMounted(async () => {

  const endDate = getDateToday()
  const startDate = dateFormat(
    date.adjustDate(new Date(endDate), {
      year: new Date(endDate).getFullYear(),
      month: 1,
      day: 1
    })
  )

  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [7] }, true),
    categoryStore.fetchSubCategories(LAB_CATEGORY_PARENT_ID),
    categoryStore.fetchCategories(
      { flg_for_lab: true, code_category_prefix: 'LB2_' },
      'LB2'
    ),
    labPrintStore.fetchLabPrints()
  ])

  if (getIllnessHistorys.value.length === 0)
    await illnessHistoryStore.fetchIllnessHistorys({
      id_pet: props?.id_pet,
      id_customer: props?.id_customer
    })
  getIllnessHistorys.value.forEach((v: IllnessHistoryType) =>
    illnessHistoryListDefault.push({
      label: v.name_disease ? v.name_disease : v.name_disease_free,
      value: v.id_pet_illness_history
    })
  )
  if (props.id_pet_illness_history)
    illnessHistorySelected.value = props.id_pet_illness_history
  illnessHistoryList.value = [...illnessHistoryListDefault]

  getLabPrints.value.forEach((labPrint) => {
    labPrintList.push({
      value: labPrint.id_lab_print,
      label: labPrint.name_button_lab_print,
      display_order: labPrint.display_order
    })
  })

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
    <!-- Render table only when dataReady is true -->
    <div class="position-relative" :key="tableVersion">
      <div
        v-if="!props.hideHeader"
        class="flex justify-between full-width z-top bg-white fixed-top mt-dotted-bottom"
        ref="toolBarRef"
        style="left: -10px; top: 0;"
      >
        <div
          class="flex full-width q-pa-sm items-center q-pl-lg"
          style="gap: 13px"
        >
          <MtModalHeaderLabResult
            v-model:year-period="yearPeriod"
            v-model:show-unit-range="showUnitRange"
            v-model:select-latest-six-days="selectLatest6Days"
            v-model:pdf-fixed-lab-comparison-dialog="pdfFixedLabComparisonDialog"
            v-model:select-lab-print="selectLabPrint"
            v-model:tabs="tabs"
            :illness-history-list-default="illnessHistoryListDefault"
            :category-grouped-list="categoryGroupedList"
            :lab-print-list="labPrintList"
            :fixed-filter="fixedFilter"
            @filter-change="handleFilterChange"
            @tab-change="scrollToSection"
            @open-add-modal="openAddModal"
            @update:selectLatestSixDays="handleSelectLatestSixDays"
          />
        </div>
      </div>
      <div class="q-pt-md" :style="!props.hideHeader ? { marginTop: (boxHeight || boxCHeight) + 'px' } : {}">
        <template v-if="dataReady" v-for="(device, id_category) in groupedData" :key="id_category">
          <div v-for="(lab_result, deviceIndex) in device" :key="`${id_category}-${deviceIndex}`" class="category-header" :id="`category-${id_category}`">
            <div @click="updateCategoryCheckboxBar(id_category, deviceIndex)" class="cursor-pointer bg-grey-300 q-py-xs q-px-sm justify-between flex items-center">
              <div>
                {{ getCategoryName(id_category) }} ({{ labData[id_category][deviceIndex].length }})
                <MtFormCheckBox
                  :key="`header-checkbox-${id_category}-${deviceIndex}`"
                  class="q-ml-sm"
                  v-model:checked="checklistData[id_category][deviceIndex].checked"
                  @update:checked="updateCategoryCheckbox($event, id_category, deviceIndex)"
                  @click.stop
                />
              </div>
              <div class="flex items-center">
                <div
                  class="q-mr-sm"
                  @click.stop="
                    openLabSetModal(
                      deviceData[deviceIndex],
                      lab_result.lab_set_type
                    )
                  "
                >
                  {{
                    deviceData[deviceIndex]
                      ? getDeviceName(
                          deviceData[deviceIndex],
                          lab_result.lab_set_type
                        )
                      : '機器設定なし'
                  }}
                  <q-icon name="help" class="q-pa-xs" />
                </div>
                <q-btn
                  unelevated
                  color="primary"
                  text-color="white"
                  @click.stop="
                    openAddModal({
                      id_category: id_category,
                      deviceCategory: deviceData[deviceIndex],
                      lab_set_type: lab_result.lab_set_type
                    })
                  "
                  dense
                  class="q-px-md"
                >
                  <q-icon name="add" size="12px" />
                </q-btn>
              </div>
            </div>
            <div class="table-container">
              <q-table
                :key="tableVersion"
                :columns="columnData[id_category][deviceIndex]"
                :rows="labData[id_category][deviceIndex]"
                :rowsBg="true"
                :class="[
                  'my-sticky-header-column-table',
                  { 'sidebar-open': props.isSidebarOpen }
                ]"
                style="display: inline-block"
                flat
                hide-bottom
                :rows-per-page-options="[0]"
                :hide-pagination="true"
                no-data-message="登録がありません。"
                no-result-message="該当のデータが見つかりませんでした"
              >
                <template v-slot:header="{ cols }">
                  <q-tr>
                    <template v-for="col in cols" :key="col.name">
                      <template v-if="['id_cm_unit', 'range'].includes(col.field) && !showUnitRange"></template>
                      <q-th
                        v-else-if="col.field === 'date'"
                        :class="checklistData[id_category][deviceIndex].checked ? 'cursor-pointer' : ''"
                        @click="checklistData[id_category][deviceIndex].checked ? (dateCheckList[id_category][deviceIndex][col.date] = !dateCheckList[id_category][deviceIndex][col.date]) : ''"
                        style="width: 130px"
                        class="dark"
                      >
                        <MtFormCheckBox
                          :key="`col-checkbox-${id_category}-${deviceIndex}-${col.date}`"
                          :keep-color="true"
                          color="orange"
                          v-show="checklistData[id_category][deviceIndex].checked"
                          v-model:checked="dateCheckList[id_category][deviceIndex][col.date]"
                          @click.stop
                        />
                        {{ formatDateWithTime(col.label, 'YY/MM/DD') }}
                        <small>{{ formatDateWithTime(col.label, 'HH:mm') }}</small>
                      </q-th>
                      <q-th v-else :key="col.name" class="light">
                        {{ col.label }}
                      </q-th>
                    </template>
                  </q-tr>
                </template>
                <template v-slot:body="{ row, rowIndex }">
                  <template v-if="row.flg_above_blank_row">
                    <q-tr :key="`blank-${rowIndex}`">
                      <div style="height: 10px"></div>
                    </q-tr>
                  </template>
                  <q-tr :key="row.id_lab || rowIndex">
                    <template v-for="col in columnData[id_category][deviceIndex]" :key="col.name">
                      <template v-if="['id_cm_unit', 'range'].includes(col.field) && !showUnitRange"></template>
                      <q-td v-else-if="['service_detail'].includes(row.field)">
                        <div v-if="col.field == 'date'" class="text-center text-blue cursor-pointer" @click.stop="onServiceDetailClick(lab_result.lr_value[col.date]?.[0]?.id_service_detail)">
                          {{ lab_result.lr_value[col.date]?.[0]?.number_service_detail || '検査サービス' }}
                        </div>
                        <div v-else></div>
                      </q-td>
                      <q-td
                        v-else
                        :class="(col.field === 'date' ? 'cursor-pointer' : '') + (row.flg_above_blank_row ? ' q-bt ' : '')"
                        @click="onRowClick(col, id_category, deviceData[deviceIndex], lab_result.lab_set_type)"
                      >
                        <div>
                          <div v-if="col.field === 'date'">
                            <div class="row">
                              <div class="col-6 text-center q-br">
                                {{ showQualifier(lab_result.lr_value[col.date], row.id_lab) }}
                              </div>
                              <div class="col-6 text-center">
                                <div v-html="showValResult(lab_result.lr_value[col.date], row.id_lab)" />
                              </div>
                            </div>
                          </div>
                          <div v-else-if="col.field === 'name_lab'">
                            <div
                              @click="
                                checklistData[id_category][deviceIndex].checked
                                  ? (itemCheckList[id_category][deviceIndex][
                                      row.id_lab
                                    ] =
                                      !itemCheckList[id_category][deviceIndex][
                                        row.id_lab
                                      ])
                                  : ''
                              "
                              :class="
                                (checklistData[id_category][deviceIndex].checked
                                  ? 'cursor-pointer '
                                  : ' ') + (row.flg_indent ? 'q-pl-md' : '')
                              "
                              class="flex no-wrap items-center"
                            >
                              <MtFormCheckBox
                                :key="`row-checkbox-${id_category}-${deviceIndex}-${row.id_lab}`"
                                v-if="checklistData[id_category][deviceIndex].checked"
                                v-model:checked="itemCheckList[id_category][deviceIndex][row.id_lab]"
                                @click.stop
                              />
                              <div class="q-mr-md">
                                <b>
                                  <template
                                    v-if="row.lab && row?.lab?.name_lab_en != ''"
                                  >
                                    {{ row?.lab?.name_lab_en?.replace('%', ' ') }}
                                  </template>
                                  <template v-else>
                                    {{ row?.name_lab_en?.replace('%', ' ') }}
                                  </template>
                                </b>
                              </div>
                              <div>
                                <template
                                  v-if="row.lab && row?.lab?.name_lab != ''"
                                >
                                  {{
                                    row?.lab?.name_lab_en == row?.lab?.name_lab
                                      ? ''
                                      : row?.lab?.name_lab
                                  }}
                                </template>
                                <template v-else>
                                  {{
                                    row?.name_lab_en == row?.name_lab
                                      ? ''
                                      : row?.name_lab
                                  }}
                                </template>
                              </div>
                            </div>
                          </div>
                          <div v-else-if="col.field === 'id_cm_unit'">
                            {{ typeLabUnitName(row.id_cm_unit) }}
                          </div>
                          <div v-else-if="col.field === 'range'">
                            {{ 
                              (row.ranges.low || row.ranges.high) ? `${row.ranges.low || '-'} ~ ${row.ranges.high || '-'}` : ''
                            }}
                          </div>
                          <div
                            v-else
                            class="body1 text-center regular text-grey-900"
                          >
                            {{ row[col.field] ? row[col.field] : '' }}
                          </div>
                        </div>
                      </q-td>
                    </template>
                  </q-tr>
                </template>
              </q-table>
            </div>
          </div>
        </template>
      </div>
      <q-dialog v-model="pdfConfirmationDialog">
        <q-card class="q-pa-lg">
          <q-card-section>
            <div class="text-h6">
              <q-icon size="25px" name="error_outline" /> 確認
            </div>
          </q-card-section>
          <q-card-section class="q-pt-none message q-mb-md">
            検査結果を myVetty に送信しますか?
            <div class="q-mt-md">
              <span>出力色 </span>
              <MtFormRadiobtn
                v-model:selected="pdfConfiguration.color"
                label="青"
                val="1"
              />
              <MtFormRadiobtn
                v-model:selected="pdfConfiguration.color"
                label="黒"
                val="2"
              />
            </div>
            <div class="q-mt-md">
              <MtFormCheckBox
                v-model:checked="pdfConfiguration.flgShowValResultBg"
                label="背景色を付ける"
              />
            </div>
            <div class="q-mt-md">
              <MtFormCheckBox
                v-model:checked="pdfConfiguration.flgShowIcons"
                label="基準値範囲外ハイライト"
              />
            </div>
          </q-card-section>
          <q-card-actions class="justify-end">
            <q-btn
              label="キャンセル"
              text-color="primary"
              class="q-mr-md"
              outline
              color="white"
              v-close-popup
            />
            <q-btn
              label="PDFダウンロード"
              color="primary"
              @click="openLabResultOneModal('download')"
              v-close-popup
            />
            <q-btn
              label="印刷"
              color="primary"
              @click="openLabResultOneModal('print')"
              v-close-popup
            />
            <q-btn
              label="myVetty送信"
              color="primary"
              class="no-uppercase"
              @click="openLabResultOneModal('sendMyVetty')"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
      <GetPdfLabResultOne
        v-if="pdfAttributes.labResult.render"
        :resultList="labResultRowsData"
        :callback="
          pdfAttributes.labResult.mode == 'sendMyVetty' ? fillPdfToPPs : undefined
        "
        :defaultConfiguration="pdfConfiguration"
        :pdfAttributes="pdfAttributes"
      />

      <q-dialog v-model="pdfFixedLabComparisonDialog">
        <q-card class="q-pa-lg">
          <q-card-actions class="justify-center">
            <q-btn
              label="キャンセル"
              text-color="primary"
              outline
              color="white"
              v-close-popup
            />
            <q-btn
              label="PDFダウンロード"
              color="primary"
              @click="generateFixLabComparisonPdf('download')"
              v-close-popup
            />
            <q-btn
              label="印刷"
              color="primary"
              @click="generateFixLabComparisonPdf('print')"
              v-close-popup
            />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </q-scroll-area>
</template>

<style lang="scss" scoped>
.q-table__card {
  border: 1px solid $grey-300;
}

.my-sticky-header-column-table td:nth-of-type(1),
.my-sticky-header-column-table th:nth-of-type(1) {
  text-wrap: nowrap;
}

.my-sticky-header-column-table .dark {
  background-color: #424242 !important;
  color: white !important;
}

.my-sticky-header-column-table .light {
  background-color: #fff4cb !important;
  color: black !important;
}

.my-sticky-header-column-table .q-table thead tr,
.my-sticky-header-column-table .q-table tbody td {
  padding: 1px;
  padding-left: 5px;
  height: 13px;
}

.my-sticky-header-column-table .q-table thead tr th {
  padding: 3px;
}

.my-sticky-header-column-table .q-table thead tr > th:not(:first-child),
.my-sticky-header-column-table .q-table tbody tr > td:not(:first-child) {
  border-left-width: 1px;
}

.category-header {
  scroll-margin-top: 6rem;
}

.category-header:last-of-type {
  .table-container {
    margin-bottom: 0;
  }
}

.scroll-container {
  overflow: auto;
  overscroll-behavior: contain;
  scroll-snap-type: none;
}

.fixed-container {
  position: fixed;
  left: 0;
  right: 0;
  overflow-y: auto;
  overflow-x: hidden;
  // height: 90%;
 
}

.table-container {
  position: relative;
  overflow-x: auto;
  white-space: nowrap;
  margin-bottom: 34px;
  
}


.my-sticky-header-column-table {
  
  /* Default when sidebar is closed */
  max-width: calc(100vw - 150px);

  &.sidebar-open {
    /* When sidebar is open */
    max-width: calc(100vw - 335px);
  }
  td:first-child {
    /* bg color is important for td; just specify one */
    background-color: white;
  }


  /* this will be the loading indicator */
  thead {
    tr:last-child th {
      /* height of all previous header rows */
      top: 48px;
      /* highest z-index */
      z-index: 3;
    }

    tr:first-child th {
      top: 0;
      z-index: 1;
    }
  }

  tr:first-child th:first-child {
    /* highest z-index */
    z-index: 3;
  }

  td:first-child {
    z-index: 1;
  }

  td:first-child, th:first-child {
    position: sticky;
    left: 0;
  }

  /* prevent scrolling behind sticky top row on focus */
  tbody {
    /* height of all previous header rows */
    scroll-margin-top: 48px;
  }
}

.q-bt {
  border-top: 1px solid #e0e0e0;
}
</style>
