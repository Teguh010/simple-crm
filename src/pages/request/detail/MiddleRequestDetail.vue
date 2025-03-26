<script setup lang="ts">
import {
  ComponentOptionsBase,
  ComponentPublicInstance,
  computed,
  defineAsyncComponent,
  nextTick,
  onMounted,
  onUnmounted,
  onUpdated,
  reactive,
  ref,
  watch
} from 'vue'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import aahMessages from '@/utils/aahMessages'
import {
  convertWeightInG,
  dateFormat,
  formatDate,
  formatDateWithTime,
  getCustomerName,
  parseForlinks,
  roundZeroAfterPoint,
  searchWithHighlight,
  getDateTimeNow
} from '@/utils/aahUtils'
import { api } from '@/boot/axios'
import { debounce } from 'lodash'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import useConversationStore from '@/stores/Conversation'
import useCliCommonStore from '@/stores/cli-common'
import useClinicCommonStore from '@/stores/cli-common'
import useCommonStore from '@/stores/common'
import useCategoryStore from '@/stores/categories'
import useServiceDetailStore from '@/stores/service-details'
import useLabResultStore from '@/stores/lab-results'
import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'

// Components
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import CreateTemplateMemoCarteModal from '@/pages/memoCarte/CreateTemplateMemoCarteModal.vue'
import UpdateInfoListModal from '@/pages/info/UpdateInfoListModal.vue'
import PinnedMemoCarte from '@/pages/request/detail/memo-carte/PinnedMemoCarte.vue'
import dayjs, { Dayjs } from 'dayjs'
import minMax from 'dayjs/plugin/minMax'
import AllCartePerDateListModal from '@/pages/request/AllCartePerDateListModal.vue'
// Assets
import fileLogo from '@/assets/img/clinicalFiles/file.png'

// Types
import {
  CarteGroup,
  CliCommon,
  Common,
  CustomerType,
  LabResult,
  MedCondition,
  MemoCarteType,
  PetType,
  RequestDetailPageType
} from '@/types/types'
import useFabricStore from '@/stores/fabrics'

import { typeMedConditionColor } from '@/utils/enum'
import { useRoute } from 'vue-router'
import UpdateLabResultModal from '@/components/lab/UpdateLabResultModal.vue'

// Lazy-loaded Components
const UpdateClinicalFileModal = defineAsyncComponent(
  () => import('@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue')
)
const GetPdfLabResultComparison = defineAsyncComponent(
  () => import('@/pages/labResult/GetPdfLabResultComparison.vue')
)
const GetPdfLabResultOne = defineAsyncComponent(
  () => import('@/pages/labResult/GetPdfLabResultOne.vue')
)
const UpdateServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/request/serviceDetail/UpdateServiceDetailModal.vue')
)
const UpdateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMemoCarteModal.vue')
)
const UpdateMedConditionModal = defineAsyncComponent(
  () => import('@/pages/medCondition/UpdateMedConditionModal.vue')
)
const CreateMemoCarteModalV1 = defineAsyncComponent(
  () => import('@/pages/memoCarte/CreateMemoCarteModal.vue')
)
const VerifySummary = defineAsyncComponent(
  () => import('@/pages/memoCarte/confirmation/VerifySummary.vue')
)
const UnverifySummary = defineAsyncComponent(
  () => import('@/pages/memoCarte/confirmation/UnverifySummary.vue')
)
const ViewLabResultModal = defineAsyncComponent(
  () => import('@/components/lab/ViewLabResultModal.vue')
)
const FabricMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/FabricMemoCarteModal.vue')
)

dayjs.extend(minMax)
const route = useRoute()

const props = withDefaults(
  defineProps<{
    id: string
    scrollAreaHeight: { height: string }
    customerSelected: CustomerType
    petSelected?: PetType
    requestDetailPage: RequestDetailPageType
  }>(),
  {
    id: '',
    customerSelected: () => {
      return {} as CustomerType
    },
    petSelected: () => {
      return {} as PetType
    },
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    }
  }
)

const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const categoryStore = useCategoryStore()
const serviceDetailStore = useServiceDetailStore()
const fabricStore = useFabricStore()
const labResultStore = useLabResultStore()
const conversationStore = useConversationStore()
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const clinicCommonStore = useClinicCommonStore()

const { getFabric } = storeToRefs(fabricStore)
const { getFilteredMemoCartesV1 } = storeToRefs(memoCarteStore)
const {
  getAllCliCommonMedConditionOptionList,
  getCliCommonOptionList,
  getCliCommonTypeMemoCarteList,
  getCliCommonTypeCarteSourceList
} = storeToRefs(cliCommonStore)
const { getCustomer } = storeToRefs(customerStore)

const memoCarteDate = ref('')
const scrollAreaRef = ref()
const sectionsRefs = reactive([] as any)
const memoCarteSearch = ref<string[]>([])
const isSearchExpanded = ref(false)
const typeSource = ref<number | null>(null)
const pdfConfirmationDialog = ref(false)
const pdfConfiguration = reactive({
  color: '1',
  flgShowValResultBg: true,
  flgShowIcons: true
})
const labResultSelected = ref([])

const showV1 = ref(true)
const showLabResults = ref<boolean>(JSON.parse(localStorage.getItem('showLabResults') ?? 'true'))

const defaultLRColumn = [
  {
    name: 'name_lab',
    label: '項目',
    field: 'name_lab',
    align: 'left',
    width: '25%'
  },
  {
    name: 'name_unit_result',
    label: '単位',
    field: 'name_unit_result',
    align: 'center',
    width: '15%'
  },
  {
    name: 'range',
    label: '基準値',
    field: 'range',
    align: 'center',
    width: '20%'
  }
]

const setSectionRef = (
  el:
    | Element
    | ComponentPublicInstance<
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        {},
        false,
        ComponentOptionsBase<
          any,
          any,
          any,
          any,
          any,
          any,
          any,
          any,
          any,
          {},
          {},
          string,
          {}
        >,
        {},
        {}
      >
    | null
) => {
  sectionsRefs.push(el)
}

const typeMemoCarte = computed(() =>
  getCliCommonTypeCarteSourceList.value
    .filter((v: CliCommon) => v.code_cli_common == 11)
    .map((v: CliCommon) => ({
      ...v,
      label: v.name_cli_common,
      value: v.id_cli_common
    }))
)

const allEmployees = computed(() => employeeStore.getAllEmployees)
const getEmployeeByMemoCarte = (memoCarte: MemoCarteType) => {
  const memoCarteEmployee = allEmployees?.value.find(
    (v) => v.value === memoCarte?.id_employee
  )
  return memoCarteEmployee ? memoCarteEmployee.label : ''
}

const typeLabUnitName = (value: number) =>
  commonStore.getCommonUnitOptionList.find(
    (item: Common) => item.id_common === value
  )?.name_common

const illnessHistoryName = (value: any) => {
  return value
    .map((v: string) => {
      const illness = illnessHistoryStore.getIllnessHistorys.find(
        (ih) => ih.id_pet_illness_history === v
      )
      if (illness)
        return illness.name_disease
          ? illness.name_disease
          : illness.name_disease_free
    })
    .join(', ')
}

const fetchMemoCarteList = async () => {
  let payload: any = {
    id_pet: props.petSelected?.id_pet,
    id_customer: props.customerSelected?.id_customer
  }
  await Promise.all([memoCarteStore.fetchMemoCarteV1(payload)])
}
const createMemoCarteModal = async (openV1Version: boolean = false) => {
  if (!props.petSelected.id_pet) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  memoCarteStore.selectMemoCarte(null)

  await mtUtils.popup(
    !openV1Version ? UpdateMemoCarteModal : CreateMemoCarteModalV1,
    {
      id_request: props.id,
      number_request: props?.requestDetailPage?.number_request ?? '',
      id_customer: props.customerSelected?.id_customer.toString(),
      id_pet: props.petSelected?.id_pet.toString(),
      id_pet_illness_history:
        illnessHistoryStore.getIllnessHistory?.id_pet_illness_history.toString(),
      popup: {
        persistent: true
      }
    },
    !openV1Version
  )
}
const medConditionModal = async (med_condition: MedCondition) => {
  await mtUtils.smallPopup(UpdateMedConditionModal, {
    med_condition,
    id_customer: props.customerSelected?.id_customer.toString(),
    id_pet: props.petSelected?.id_pet.toString(),
    callBackRefresh: () => fetchMemoCarteList()
  })
}
const memoCarteModal = async (id_memo_carte: string) => {
  let updatedFlg = { value: false }
  memoCarteStore.selectMemoCarte(id_memo_carte)
  let UpdateMemoCarteModalProps = {
    id_request: props.id,
    id_memo_carte: id_memo_carte,
    id_customer: props.customerSelected?.id_customer.toString(),
    id_pet: props.petSelected?.id_pet.toString(),
    requestDetailPage: props.requestDetailPage,
    callBackRefresh: () => fetchMemoCarteList(),
    updatedFlg,
    popup: {
      persistent: true
    }
  }

  await mtUtils.popup(UpdateMemoCarteModal, UpdateMemoCarteModalProps, true)
  if (updatedFlg.value) {
    await mtUtils.popup(UpdateMemoCarteModal, {
      ...UpdateMemoCarteModalProps,
      autoSaveOnMount: true
    }, true)
  }
}
const memoCarteGroupModalOpen = async (
  date_insert: string,
  data_cartes: object,
  clinical_file: Array<any> = [],
  dt_insert = ''
) => {
  if (!props.petSelected.id_pet) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  
  memoCarteStore.selectMemoCarte(null)
  let duplciateCart = { value: false }
  let memoCarteProps = {
    id_request: props.id,
    date_insert,
    datetimeInsert: dt_insert,
    data_cartes,
    clinical_file,
    number_request: props?.requestDetailPage?.number_request ?? '',
    id_customer: props.customerSelected?.id_customer.toString(),
    id_pet: props.petSelected?.id_pet.toString(),
    id_pet_illness_history:
      illnessHistoryStore.getIllnessHistory?.id_pet_illness_history.toString(),
    popup: {
      persistent: true
    },
    duplciateCart
  }

  await mtUtils.popup(CreateMemoCarteModalV1, memoCarteProps)

  if (duplciateCart.value) {
    // Duplicate large memo cart
    console.log('Duplicated carte...')
    await mtUtils.popup(CreateMemoCarteModalV1, {
      ...memoCarteProps,
      date_insert: dateFormat(getDateTimeNow(), 'YYYY/MM/DD'),
      autoSaveOnMount: true
    })
  }
}

const scrollToTop = () => {
  if (sectionsRefs.length === 0) {
    updateSectionsRefs()
  }
  const el = sectionsRefs[0]
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

const codeCommonList = (code_cli_common: number) => {
  return getAllCliCommonMedConditionOptionList.value.filter(
    (v: CliCommon) => v.code_cli_common == code_cli_common
  )
}
const getMedConditionName = (code_cli_common: number, code_func1: number) =>
  getAllCliCommonMedConditionOptionList.value.find(
    (v: CliCommon) =>
      v.code_cli_common == code_cli_common && v.code_func1 == code_func1
  )?.name_cli_common

const openVerifyUnverifyModal = async (memoCarte: MemoCarteType) => {
  let popup: {
    isConfirmed: boolean
  } = {
    isConfirmed: false
  }
  let memoCartePayload = {
    ...memoCarte,
    datetime_memo_carte: memoCarte.datetime_memo_carte.includes('T')
      ? memoCarte.datetime_memo_carte.split('T').join(' ')
      : memoCarte.datetime_memo_carte
  }
  if (memoCarte.flg_verified) {
    // open unverify modal
    await mtUtils.smallPopup(UnverifySummary, { popup })
    if (popup.isConfirmed) {
      memoCarteStore
        .updateMemoCarte(memoCarte.id_memo_carte, {
          ...memoCartePayload,
          flg_verified: '0'
        })
        .then(async () => {
          fetchMemoCarteList()
          mtUtils.autoCloseAlert(aahMessages.success)
        })
    }
  } else {
    // open verify modal
    await mtUtils.smallPopup(VerifySummary, { popup })
    if (popup.isConfirmed) {
      memoCarteStore
        .updateMemoCarte(memoCarte.id_memo_carte, {
          ...memoCartePayload,
          flg_verified: '1'
        })
        .then(async () => {
          fetchMemoCarteList()
          mtUtils.autoCloseAlert(aahMessages.success)
        })
    }
  }
}

const onClickFileClinic = async (
  data: Object,
  i: Number,
  date_insert: string
) => {
  const video = document.getElementById(`cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  await mtUtils.popup(UpdateClinicalFileModal, {
    data,
    allData: getFilteredMemoCartesV1.value[date_insert]?.clinical_file_list
  })
  event_bus.emit('reloadRight', true)
}

const searchFilters = (val?: number, searchMemo?: string[]) => {
  const filters: {
    id_pet: string
    id_cli_common?: number
    memo_other?: string
  } = {
    id_pet: props?.petSelected?.id_pet
  }
  if (val) {
    filters.id_cli_common = val
  }
  if (memoCarteSearch.value.length > 0) {
    filters.memo_other = searchMemo
      ? searchMemo?.join(', ').toLowerCase()
      : memoCarteSearch.value.join(', ').toLowerCase()
  }
  return filters
}

const openLabResultDetailModal = async (item: LabResult | null = null) => {
  if (item) {
    await mtUtils.popup(UpdateLabResultModal, {
      id_pet: props.petSelected.id_pet,
      date: formatDateWithTime(item.datetime_registered),
      id_category2_lab: item.id_category2_lab,
      id_device_category: item.id_cm_device || item.id_category2_lb2,
      lab_set_type: item.id_cm_device ? 'lab-device' : (item.id_category2_lb2 ? 'lab-set' : 'lab-ref')
    })
    fetchMemoCarteList()
    event_bus.emit('reloadRight', true)
  }
}

const openLabResultViewModal = async () => {
  const params = { request: props?.requestDetailPage }

  await mtUtils.popup(ViewLabResultModal, params, true)
  event_bus.emit('reloadRight', true)
}

const showValResult = (lab_result) => {
  if (lab_result.val_result) {
    const v1 = lab_result.val_result?.toString()?.replace(',', '')
    if (parseFloat(v1) > parseFloat(lab_result.high))
      return `<span class="q-ml-xs" style="color: red">${lab_result.val_result} <small>▲</small></span>`
    else if (parseFloat(v1) < parseFloat(lab_result.low))
      return `<span class="q-ml-xs" style="color: blue">${lab_result.val_result} <small>▼</small></span>`
    return lab_result.val_result
  }
  return ''
}

const searchMemoCarte = async () => {
  // scrollAreaRef
  if (showV1.value) {
    await memoCarteStore.fetchMemoCarteV1(searchFilters(typeSource.value!))
    scrollAreaRef.value.setScrollPosition('vertical', 0, 100)
    return
  }
}
const expandSearch = async () => {
  if (!isSearchExpanded.value) {
    isSearchExpanded.value = true
  } else {
    isSearchExpanded.value = false
    typeSource.value = null
    memoCarteSearch.value = []
    if (showV1.value) {
      await memoCarteStore.fetchMemoCarteV1({
        id_pet: props.petSelected!.id_pet
      })
      return
    }
  }
}

const fillPdfToPPs = (pdf_blob: any, pdfFileName: string = '') => {
  if (pdfFileName.length == 0) {
    pdfFileName = `${date.formatDate(
      Date.now(),
      'YYYYMMDD'
    )}_比較_${getCustomerName(getCustomer.value)}様`
  }
  const name_customer = getCustomer.value.name_customer_display
  const message_content = `${name_customer} 様<br><br>ご依頼いただいた検査に関し、検査結果を以下に添付させていただきます。<br>ご確認お願い致します。`
  mtUtils.popup(UpdateInfoListModal, {
    predefinedFile: pdf_blob,
    predefinedMessage: message_content,
    customerObj: getCustomer.value,
    lineMessageType: 'lab_report',
    pdfFileName: pdfFileName,
    fromLabResult: true
  })
}

const openLabResultOneModal = async (confirmation: string = 'sendMyVetty') => {
  let rowsData: any = [] as any
  if (labResultSelected.value) {
    const categoryData = categoryStore.getAllCategories.find(
      (v) =>
        v.id_category ==
        (labResultSelected.value[0]?.lab?.id_category2_lab ||
          labResultSelected.value[0]?.id_category2_lab)
    )
    rowsData.push({ flgNameRow: true, ...categoryData })

    labResultSelected.value.forEach((lb) => {
      rowsData.push({
        ...lb,
        labCategoryId: lb?.id_category2_lab,
        registeredDate: lb?.datetime_registered
      })
    })
    const getLabResultWithSD = rowsData.find((v) => v.id_service_detail)
    if (getLabResultWithSD) {
      await serviceDetailStore.fetchServiceDetailById(
        getLabResultWithSD?.id_service_detail
      )
    } else {
      serviceDetailStore.setServiceDetail({})
    }

    const labResultIds = rowsData
      .filter((v) => !v.flgNameRow)
      .map((v) => v.id_lab_result)
    if (labResultIds && labResultIds.length > 0) {
      await labResultStore.fetchLabResults({
        // order_by: 'display_order',
        id_pet: props.petSelected?.id_pet,
        lab_result_list: JSON.stringify(labResultIds)
      })
    }
    const labResultLookup = labResultStore.getLabResults.reduce(
      (allLabResults, currentLabResult) => {
        allLabResults[currentLabResult.id_lab_result] = currentLabResult
        return allLabResults
      },
      {}
    )

    rowsData = rowsData
      .map((labResult) =>
        labResult.flgNameRow
          ? { ...labResult }
          : { ...labResultLookup[labResult.id_lab_result] }
      )
      .sort((a, b) => a.display_order - b.display_order)
  }

  mtUtils.pdfRender(GetPdfLabResultOne, {
    resultList: rowsData,
    showValResult,
    callback: confirmation === 'sendMyVetty' ? fillPdfToPPs : null,
    defaultConfiguration: pdfConfiguration,
    pdfAttributes: {
      labResult: {
        render: true,
        mode: confirmation
      }
    }
  })
}

const openLabResultMultiModal = async (row) => {
  await mtUtils.popup(GetPdfLabResultComparison, {
    data: row,
    isSingle: true,
    id_pet: props.petSelected?.id_pet,
    callback: fillPdfToPPs
  })
}

const togglePdfConfirmation = (value: Array<object>) => {
  labResultSelected.value = []
  pdfConfirmationDialog.value = !pdfConfirmationDialog.value
  labResultSelected.value = value
}

const openServiceDetail = async (id_service_detail: string) => {
  await serviceDetailStore.fetchServiceDetailById(id_service_detail)
  serviceDetailStore.setServiceDetail(serviceDetailStore.getServiceDetail)

  await mtUtils.mediumPopup(UpdateServiceDetailModal)
}

const showHTMLDataV1 = (memoCarte: any) => {
  let tempHTML = ''

  if (memoCarte && memoCarte.memo_sbj) {
    tempHTML +=
      (memoCarte.memo_obj || memoCarte.memo_ass || memoCarte.memo_other
        ? '<b>S: 主観</b><br>'
        : '') +
      memoCarte.memo_sbj +
      '<br> <br>'
  }

  if (memoCarte && memoCarte.memo_obj) {
    tempHTML += '<b>O: 客観</b><br>' + memoCarte.memo_obj + '<br> <br>'
  }

  if (memoCarte && memoCarte.memo_ass) {
    tempHTML += '<b>A: 評価</b><br>' + memoCarte.memo_ass + '<br> <br>'
  }

  if (
    memoCarte &&
    memoCarte.memo_other && 
    !(memoCarte.memo_sbj || memoCarte.memo_obj || memoCarte.memo_ass)
  ) {
    tempHTML += memoCarte.memo_other
  } else {
    tempHTML += '<b>P: 計画他</b><br>' + memoCarte.memo_other + '<br> <br>'
  }

  return generateHTMLParser(tempHTML)
}

const showHTMLDataLabResultV1 = (memoCarte: any) => {
  let tempHTML = ''
  if (
    memoCarte &&
    memoCarte.id_lab_result_note
  ) {
    tempHTML += `<b> ${memoCarte.title} </b><br><br>` + memoCarte.memo_other + '<br> <br>'
  }

  return generateHTMLParser(tempHTML)
}

const openIdexxUrl = async (labResultNote) => {
  if (labResultNote.id_lab_raw && labResultNote.id_service_detail) {
    await serviceDetailStore.fetchGetIdexxUrl(labResultNote.id_service_detail)
    if (serviceDetailStore.getIdexxUrl) window.open(serviceDetailStore.getIdexxUrl, '_blank')
    else mtUtils.autoCloseAlert('リンクが無効です。')
  }
}


const showHTMLDataV1Specific = (text: string) => {
  let tempHTML = ''

  if (text) {
    tempHTML = text + '<br>'
  }
  return generateHTMLParser(tempHTML)
}

const generateHTMLParser = (tempHTML: string) => {
  if (
    !memoCarteSearch.value ||
    memoCarteSearch.value.length === 0 ||
    isSearchExpanded.value === false
  ) {
    return parseForlinks(tempHTML)
  } else if (memoCarteSearch.value.length > 0) {
    return searchWithHighlight(tempHTML, memoCarteSearch.value.join(','))
  }
}

const updateSectionsRefs = () => {
  sectionsRefs.length = 0
  const elements = document.querySelectorAll('.scroll-section')
  elements.forEach((el) => sectionsRefs.push(el))
}

const handleTypeSourceChange = async (val: number) => {
  if (showV1.value) {
    await memoCarteStore.fetchMemoCarteV1(searchFilters(val))
    updateSectionsRefs()
    return
  }
}
const removeSearchChipHandler = async (val: {
  index: number
  value: string
}) => {
  memoCarteSearch.value = memoCarteSearch.value.filter((v) => v !== val.value)
  await memoCarteStore.fetchMemoCarteV1(
    searchFilters(typeSource.value!, memoCarteSearch.value as string[])
  )
}
const apiCalled = ref(false)
const handleScroll = debounce(async (e: Event) => {
  const data: any = searchFilters(
    typeSource.value!,
    memoCarteSearch.value as string[]
  )

  let keys = Object.keys(getFilteredMemoCartesV1.value)
  let lastKey = keys[keys.length - 1]

  if (
    getFilteredMemoCartesV1.value[lastKey] &&
    getFilteredMemoCartesV1.value[lastKey].others &&
    Object.keys(getFilteredMemoCartesV1.value[lastKey]?.others)
  )
    data['end_date'] = formatDate(
      getFilteredMemoCartesV1.value[lastKey]?.others[
        Object.keys(getFilteredMemoCartesV1.value[lastKey]?.others)[0]
      ]?.date_insert
    )

  data['page_size'] = 250

  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await mtUtils.promiseAllWithLoader([fetchMoreData(data)])
    apiCalled.value = false
  }
}, 300)

async function fetchMoreData(data) {
  data = {
    ...data,
    illnessHistoryList: JSON.stringify(
      useIllnessHistoryStore().getActiveIllnessHistoryList
    )
  }
  return new Promise((resolve, reject) => {
    api
      .get(`/cartes`, { params: data })
      .then((response) => {
        useMemoCarteStore().extendFilteredMemoCarte(
          useMemoCarteStore().processCarte(response.data.data, data)
        )
        resolve(response)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

const openViewAllCartePerDateList = async () =>{
  await mtUtils.popup(AllCartePerDateListModal, {
    customerSelected: props.customerSelected,
    petSelected: props.petSelected
  })
}
const getMemoCarteCliCommonFunc = (value: number) => {
  const cli = getCliCommonOptionList.value.find(
    (v: CliCommon) => v.id_cli_common == value
  )
  if (cli) return cli.code_func1
  else return 0
}
const getMemoCarteBgColor = (memoCarte: any) => {
  if (memoCarte) {
    const cli = getCliCommonOptionList.value.find(
      (v: CliCommon) => v.id_cli_common == memoCarte?.id_cli_common
    )
    if (cli) return cli.text1
    else return 'memo-carte'
  }
  return 'memo-carte'
}
const getMemoCartelabel = (id_cli_common: any) => {
  const cli = getCliCommonOptionList.value.find(
    (v: CliCommon) => v.id_cli_common == id_cli_common
  )
  if (cli) return cli.name_cli_common
  else return 'memo-carte'
}
const cliCommonName = (code_func1: number | string) =>
  getCliCommonTypeMemoCarteList.value.find(
    (v: CliCommon) => v.code_func1 == code_func1
  )?.name_cli_common

event_bus.on('searchMemoCarte', () => {
  searchMemoCarte()
})
onUnmounted(() => {
  event_bus.off('searchMemoCarte')
})

const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
}

const findTypeMedCondition = (
  code_cli_common: any,
  type_med_condition: any
) => {
  let getMemoDatafromClinicCommonData =
    clinicCommonStore.allCliCommonMedConditionOptionList.filter(
      (v) =>
        v.code_cli_common == code_cli_common &&
        v.code_func1 == type_med_condition
    )

  if (getMemoDatafromClinicCommonData.length > 0) {
    let findType = typeMedConditionColor.find(
      (t) => t.value == getMemoDatafromClinicCommonData[0].text1
    )
    return findType
  } else return ''
}

const getUniqueSetOfCarte = (labResult: any) => {
  // return Object.values(
  //   labResult
  //   .reduce((acc, current) => {
  //     const labId = current.lab?.id_lab

  //     if (!acc[labId] || acc[labId].id_lab_result < current.id_lab_result) {
  //       acc[labId] = current
  //     }

  //     return acc
  //   }, {})
  // )
  // .sort((a, b) => a.display_order - b.display_order)
  return labResult.sort((a, b) => a.display_order - b.display_order)
}

const hideMemoCarte = (memoCarte) => {
  const requiredFields = [
    'memo_ass',
    'memo_customer_ai',
    'memo_illness_ai',
    'memo_obj',
    'memo_other',
    'memo_plan_ai',
    'memo_prescription_ai',
    'memo_sbj',
    'memo_service_ai',
    'memo_transcription_ai'
  ]

  return !requiredFields.some((field) => memoCarte?.[field])
}

const isIpad = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPad =
    /ipad/.test(userAgent) ||
    (/macintosh/.test(userAgent) && 'ontouchend' in document)
  if (isIPad) {
    return true
  }
  return false
})

const createTextTemplateImage = async () => {
  await mtUtils.popup(CreateTemplateMemoCarteModal, {
    isDirectSubmit: true,
    customerSelected: props.customerSelected,
    petSelected: props.petSelected
  })
}

const getLastUpdateDate = (carte: CarteGroup): string => {
  const allDates:string[] = []
  if(carte.pet_bio && Object.keys(carte.pet_bio).length > 0) {
    if(carte.pet_bio.datetime_update) allDates.push(carte.pet_bio.datetime_update)
  }
  carte.medical_condition.forEach((medicalCondition: MedCondition) => {
    if(medicalCondition.datetime_update) allDates.push(medicalCondition.datetime_update)
  })
  carte.memo_carte_list.forEach((memoCarte: MemoCarteType) => {
    if(memoCarte.datetime_update) allDates.push(memoCarte.datetime_update)
  })
  const parsedDates:Dayjs[] = allDates.map((date: string) => dayjs(date))
  if(parsedDates.length > 0) {
    let maxDate = dayjs.max(parsedDates)
    return maxDate.format('YYYY/MM/DD HH:mm')
  }
  return carte.memo_carte_list.length ? dayjs(carte.memo_carte_list[0].datetime_insert).format('YYYY/MM/DD HH:mm') : null
}


const handleLabResultToggle = () => {
  showLabResults.value = !showLabResults.value
  localStorage.setItem('showLabResults', showLabResults.value)
}

const sortedMedCondition = (dateInsert, dateTimeInsert, isSubjective: boolean) => {
  const medConditionArr = getFilteredMemoCartesV1.value[dateInsert]?.others[
    dateTimeInsert
  ]?.medical_condition.filter((v) => {
    return isSubjective ? v.flg_func1 : !v.flg_func1
  })

  const allMedConditionList = clinicCommonStore.allCliCommonMedConditionOptionList

  // Create a lookup map for display_order
  const orderMap = Object.fromEntries(allMedConditionList.map(item => [item.code_cli_common, item.display_order]));
  const sortedMedConditionArr = medConditionArr.sort((a, b) => orderMap[a.code_cli_common] - orderMap[b.code_cli_common])

  return sortedMedConditionArr
}

onMounted(() => {
  memoCarteStore.setCurrentPage({
    id_request: props.id,
    id_pet: props.petSelected?.id_pet,
    id_customer: props.customerSelected?.id_customer,
  })
})

onUpdated(() => {
  const { carte_per_date } = route.query
  if (carte_per_date) {
    nextTick(() => {
      openViewAllCartePerDateList()
    })
  }
  memoCarteStore.setCurrentPage({
    id_request: props.id,
    id_pet: props.petSelected?.id_pet,
    id_customer: props.customerSelected?.id_customer,
  });
})
</script>
<template>
  <div class="col relative-position">
    <q-scroll-area
      class="bg-grey-200 q-pt-md q-px-md"
      :class="isIpad ? '' : 'q-pb-xl'"
      :style="props.scrollAreaHeight"
      ref="scrollAreaRef"
      @scroll="handleScroll"
    >
      <q-page-sticky expand position="top" @click.stop="scrollToTop">
        <q-toolbar class="flex justify-end q-pa-none">
          <div class="bg-grey-300 q-px-md">
            {{ memoCarteDate ? formatDate(memoCarteDate) : '' }}
          </div>
        </q-toolbar>
      </q-page-sticky>
      <div class="flex justify-end fixed-top expand-search full-width q-pa-md">
        <q-btn v-if="!isSearchExpanded" flat @click="expandSearch">
          <q-icon class="q-mr-xs" name="search" />
        </q-btn>
      </div>
      <div class="flex justify-end fixed-top expand-search q-pa-md">
        <q-select
          v-if="isSearchExpanded"
          v-model="memoCarteSearch"
          use-input
          use-chips
          autofocus
          multiple
          outlined
          rounded
          hide-bottom-space
          hide-dropdown-icon
          input-debounce="0"
          new-value-mode="add-unique"
          @keyup.enter.stop="searchMemoCarte"
          @remove="removeSearchChipHandler"
          class="select-search"
        >
          <template v-slot:prepend>
            <q-icon color="grey-800 " name="search" />
            <MtFormPullDown
              v-model="typeSource"
              :options="typeMemoCarte"
              color="grey-8"
              label="カルテ区分"
              class="form-pulldown"
              custom-option
              @update:selected="handleTypeSourceChange"
            >
              <template #selectedItem="{ slotProps }">
                <q-item-label>
                  {{ slotProps.opt.label }}
                </q-item-label>
              </template>
              <template #option="{ slotProps }">
                <q-item
                  v-bind="slotProps.itemProps"
                  :class="`bg-${slotProps.opt.text1}`"
                  :style="{ backgroundColor: slotProps.opt.text1 }"
                >
                  <q-item-section>
                    {{ slotProps.opt.label }}
                  </q-item-section>
                </q-item>
              </template>
            </MtFormPullDown>
          </template>
          <template v-slot:append v-if="isSearchExpanded ? 'close' : 'search'">
            <q-icon
              class="cursor-pointer"
              color="grey-800"
              name="close"
              @click="expandSearch"
            />
          </template>
        </q-select>
      </div>
      <PinnedMemoCarte
        v-for="data in memoCarteStore.getMemoCartePinned"
        :id_request="props.id"
        :id_pet="props.petSelected!.id_pet"
        :id_customer="props.customerSelected?.id_customer"
        :data="data"
      />
      <div
        v-for="(date_insert, index) in Object.keys(getFilteredMemoCartesV1)"
        :ref="setSectionRef"
        v-if="getFilteredMemoCartesV1"
        v-show="showV1"
        :key="`section-${index}`"
        class="q-mb-md"
      >
        <template
          v-if="getFilteredMemoCartesV1[date_insert].others"
          v-for="dt_insert in Object.keys(
            getFilteredMemoCartesV1[date_insert].others
          )"
        >
          <!-- THIS DIV IS FOR GROUPED CARTES -->
          <div
            v-if="
              getFilteredMemoCartesV1[date_insert].others[dt_insert]
                .grouped_cartes ||
              getFilteredMemoCartesV1[date_insert].others[dt_insert]
                .type_carte == 2
            "
          >
            <div
              class="memo-title q-mb-md q-pa-md cursor-pointer bg-memo-carte relative-position"
              :class="
                'bg-' +
                getMemoCarteBgColor(
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.memo_carte_list?.[0]
                )
              "
              :style="{
                backgroundColor: getMemoCarteBgColor(
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.memo_carte_list?.[0]
                )
              }"
              @click.stop="
                memoCarteGroupModalOpen(
                  date_insert,
                  getFilteredMemoCartesV1[date_insert].others[dt_insert],
                  getFilteredMemoCartesV1[date_insert]?.clinical_file_list,
                  dt_insert
                )
              "
            >
              <div class="flex items-center">
                <strong class="letter-space-050">
                  {{ formatDate(date_insert) }}
                </strong>
                <template
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list.length > 0
                  "
                >
                  <small
                    v-if="
                      getMemoCarteCliCommonFunc(
                        getFilteredMemoCartesV1[date_insert].others[dt_insert]
                          ?.memo_carte_list?.[0].id_cli_common
                      ) != 5 &&
                      getMemoCarteCliCommonFunc(
                        getFilteredMemoCartesV1[date_insert].others[dt_insert]
                          ?.memo_carte_list?.[0].id_cli_common
                      ) !== null
                    "
                    :class="{
                      'bg-green text-grey-100 q-br-5 q-px-xs q-ml-md':
                        getMemoCarteCliCommonFunc(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].id_cli_common
                        ) == 1,
                      'bg-grey-600 text-grey-100 q-br-5 q-px-xs q-ml-md':
                        getMemoCarteCliCommonFunc(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].id_cli_common
                        ) == 2,
                      'bg-blue-800 text-white q-br-5 q-px-xs q-ml-md':
                        getMemoCarteCliCommonFunc(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].id_cli_common
                        ) == 6,
                      'chip-purple text-white q-br-5 q-px-xs q-ml-md':
                        getMemoCarteCliCommonFunc(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].id_cli_common
                        ) == 10,
                      'bg-pink-700 text-white q-br-5 q-px-xs q-ml-md':
                        getMemoCarteCliCommonFunc(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].id_cli_common
                        ) == 15
                    }"
                  >
                    {{
                      typeMemoCarte.find(
                        (v) =>
                          v.value ===
                          getMemoCarteCliCommonFunc(
                            getFilteredMemoCartesV1[date_insert].others[
                              dt_insert
                            ]?.memo_carte_list?.[0].id_cli_common
                          )
                      )?.label
                    }}
                  </small>
                  <small class="text-grey-600 q-ml-md q-mr-xs"
                    >対象診察 :</small
                  >
                  {{
                    illnessHistoryName(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0]?.id_pet_illness_history
                    )
                  }}
                  <template
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0].type_input === 1
                    "
                  >
                    <div
                      class="row bg-white cursor-pointer q-px-md q-py-xs q-ml-xl memo_ai"
                      @click.stop="
                        openVerifyUnverifyModal(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0]
                        )
                      "
                    >
                      <img
                        v-if="
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].flg_verified
                        "
                        class="verify-img q-mr-sm"
                        height="26"
                        src="@/assets/img/aiVetty/verify_confirm.png"
                        width="25"
                      />
                      <span class="text-grey-600">AIカルテ</span>
                      <div
                        :class="
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].flg_verified
                            ? 'verify-status text-blue'
                            : 'unverify-status'
                        "
                        class="status q-pl-sm"
                      >
                        {{
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.memo_carte_list?.[0].flg_verified
                            ? 'レビュー済'
                            : '確認してください！'
                        }}
                      </div>
                    </div>
                  </template>
                  <small class="text-grey-600 q-ml-auto q-mr-xs">{{
                    getMemoCartelabel(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0].id_cli_common
                    )
                  }}</small>
                </template>
              </div>

              <div
                v-if="
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.pet_bio
                "
                class="q-mt-md"
              >
                <b
                  class="q-mb-sm"
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.pet_bio &&
                    Object.keys(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        .pet_bio
                    ).length > 0
                  "
                  >生体情報</b
                >
                <div class="row">
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_weight
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">体重</span>
                    <span class="pet-bio-info-option"
                      >{{
                        parseFloat(
                          convertWeightInG(
                            getFilteredMemoCartesV1[date_insert].others[
                              dt_insert
                            ]?.pet_bio?.val_weight,
                            getFilteredMemoCartesV1[date_insert].others[
                              dt_insert
                            ]?.pet_bio?.type_body_weight
                          )
                        )?.toFixed(2)
                      }}
                    </span>
                    <span class="pet-bio-info-unit">{{
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.type_body_weight == 1
                        ? 'kg'
                        : 'g'
                    }}</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_temperature
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">体温 T</span>
                    <span class="pet-bio-info-option"
                      >{{
                        parseFloat(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_temperature
                        )?.toFixed(1)
                      }}
                    </span>
                    <span class="pet-bio-info-unit">℃</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_heartbeat_rate
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">心拍 P</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_heartbeat_rate
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">回/分 (bpm)</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_respiration_rate
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">呼吸数 R</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_respiration_rate
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">回/分</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_pressure_systolic
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">収縮期血圧</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_pressure_systolic
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">mmHg</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_pressure_diastolic
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">拡張期血圧</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_pressure_diastolic
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">mmHg</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_pressure_mean_arterial
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">平均動脈圧</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_pressure_mean_arterial
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">mmHg</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_blood_oxygen_level
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">SpO2</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_blood_oxygen_level
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">%</span>
                  </div>
                  <div
                    v-if="
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.pet_bio?.val_blood_carbon_dioxide_level
                    "
                    class="col-6 q-mb-xs"
                  >
                    <span class="pet-bio-info-label">pCO2</span>
                    <span class="pet-bio-info-option"
                      >{{
                        roundZeroAfterPoint(
                          getFilteredMemoCartesV1[date_insert].others[dt_insert]
                            ?.pet_bio?.val_blood_carbon_dioxide_level
                        )
                      }}
                    </span>
                    <span class="pet-bio-info-unit">mmHg</span>
                  </div>
                </div>
              </div>

              <div
                v-if="
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.memo_carte_list?.[0]?.memo_sbj ||
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.memo_carte_list?.[0]?.memo_obj ||
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.memo_carte_list?.[0]?.memo_ass ||
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.memo_carte_list?.[0]?.memo_other ||
                  getFilteredMemoCartesV1[date_insert].others[dt_insert]
                    ?.medical_condition.length > 0
                "
                :key="`${date_insert}-${index}`"
                class="q-mt-sm"
              >
                <div
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list?.[0]?.memo_sbj ||
                    getFilteredMemoCartesV1[date_insert].others[
                      dt_insert
                    ]?.medical_condition.filter((v) => v.flg_func1).length > 0
                  "
                  class="q-mt-md"
                >
                  <b>S: 主観</b>
                </div>
                <template
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list?.[0]?.memo_sbj ||
                    getFilteredMemoCartesV1[date_insert].others[
                      dt_insert
                    ]?.medical_condition.filter((v) => v.flg_func1)
                  "
                >
                  <div class="row">
                    <div
                      v-for="medCondition in sortedMedCondition(date_insert, dt_insert, true)"
                      class="flex items-start"
                      :class="medCondition?.memo_record ? 'col-12' : 'col-6'"
                    >
                      <template v-if="medCondition?.code_cli_common">
                        <div class="flex">
                          <span class="med-condition-label">{{
                            cliCommonName(medCondition?.code_cli_common)
                          }}</span>
                          <span
                            class="med-condition-option"
                            :style="{
                              backgroundColor: findTypeMedCondition(
                                medCondition.code_cli_common,
                                medCondition.type_med_condition
                              )?.backgroundColor,
                              color: findTypeMedCondition(
                                medCondition.code_cli_common,
                                medCondition.type_med_condition
                              )?.color
                            }"
                            >{{
                              getMedConditionName(
                                medCondition?.code_cli_common,
                                medCondition.type_med_condition
                              )
                            }}</span
                          >
                        </div>

                        <div
                          v-if="medCondition?.memo_record"
                          class="body2 regular q-ml-sm q-pb-sm"
                          style="margin-top: 6px"
                        >
                          {{ medCondition?.memo_record }}
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
                <div
                  v-html="
                    showHTMLDataV1Specific(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0]?.memo_sbj
                    )
                  "
                  class="q-mt-xs q-pb-xs"
                ></div>

                <div
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list?.[0]?.memo_obj ||
                    getFilteredMemoCartesV1[date_insert].others[
                      dt_insert
                    ]?.medical_condition.filter((v) => !v.flg_func1).length > 0
                  "
                  class="q-mt-md"
                >
                  <b>O: 客観</b>
                </div>
                <template
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list?.[0]?.memo_obj ||
                    getFilteredMemoCartesV1[date_insert].others[
                      dt_insert
                    ]?.medical_condition.filter((v) => !v.flg_func1)
                  "
                >
                  <div class="row">
                    <div
                      v-for="medCondition in sortedMedCondition(date_insert, dt_insert, false)"
                      class="flex items-start"
                      :class="medCondition?.memo_record ? 'col-12' : 'col-6'"
                    >
                      <template v-if="medCondition?.code_cli_common">
                        <div class="flex">
                          <span class="med-condition-label">{{
                            cliCommonName(medCondition?.code_cli_common)
                          }}</span>
                          <span
                            class="med-condition-option"
                            :style="{
                              backgroundColor: findTypeMedCondition(
                                medCondition.code_cli_common,
                                medCondition.type_med_condition
                              )?.backgroundColor,
                              color: findTypeMedCondition(
                                medCondition.code_cli_common,
                                medCondition.type_med_condition
                              )?.color
                            }"
                            >{{
                              getMedConditionName(
                                medCondition?.code_cli_common,
                                medCondition.type_med_condition
                              )
                            }}</span
                          >
                        </div>

                        <div
                          v-if="medCondition?.memo_record"
                          class="body2 regular q-ml-sm q-pb-sm"
                          style="margin-top: 6px"
                        >
                          {{ medCondition?.memo_record }}
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
                <div
                  v-html="
                    showHTMLDataV1Specific(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0]?.memo_obj
                    )
                  "
                  class="q-mt-xs q-pb-xs"
                ></div>

                <div
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list?.[0]?.memo_ass
                  "
                  class="q-mt-md"
                >
                  <b>A: 評価</b>
                </div>
                <div
                  v-html="
                    showHTMLDataV1Specific(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0]?.memo_ass
                    )
                  "
                  class="q-pb-xs"
                ></div>
                <div
                  v-if="
                    getFilteredMemoCartesV1[date_insert].others[dt_insert]
                      ?.memo_carte_list?.[0]?.memo_other
                  "
                  class="q-mt-md"
                >
                  <b>P: 計画他</b>
                </div>
                <div
                  v-html="
                    showHTMLDataV1Specific(
                      getFilteredMemoCartesV1[date_insert].others[dt_insert]
                        ?.memo_carte_list?.[0]?.memo_other
                    )
                  "
                  class="q-pb-xs"
                ></div>
              </div>
              <div class="row justify-between q-mt-md text-grey-700">
                <small class="col row items-center">
                  <q-icon
                    name="history"
                    class="cursor-pointer q-mr-xs"
                    size="16px"
                  />
                  {{ getLastUpdateDate(getFilteredMemoCartesV1[date_insert].others[dt_insert]) }}
                </small>
                <small
                  v-if="getEmployeeByMemoCarte(getFilteredMemoCartesV1[date_insert].others[dt_insert]?.memo_carte_list[0])"
                  class="col-auto row items-center"
                >
                  <q-icon
                    name="person"
                    class="cursor-pointer q-mr-xs"
                    size="16px"
                  />
                  {{ getEmployeeByMemoCarte(getFilteredMemoCartesV1[date_insert].others[dt_insert]?.memo_carte_list[0]) }}
                </small>
              </div>
            </div>
          </div>

          <!-- IF CARTES IS NOT GROUPED -->
          <template v-else>
            <!-- THIS DIV IS FOR MEMO_CARTE -->
            <div
              v-for="(memoCarte, index) in getFilteredMemoCartesV1[date_insert]
                .others[dt_insert]?.memo_carte_list"
              :key="`${date_insert}-${index}`"
              :class="
                getMemoCarteBgColor(memoCarte)
                  ? `bg-${getMemoCarteBgColor(memoCarte)} `
                  : ' ' + hideMemoCarte(memoCarte)
                  ? 'hidden '
                  : ' '
              "
              :style="{ backgroundColor: getMemoCarteBgColor(memoCarte) }"
              class="memo-title q-mb-md q-pa-md cursor-pointer"
              @click.stop="memoCarteModal(memoCarte.id_memo_carte)"
            >
              <div class="flex items-center">
                <strong class="letter-space-050">
                  {{ formatDate(memoCarte?.datetime_memo_carte) }}
                </strong>
                <small
                  v-if="
                    getMemoCarteCliCommonFunc(memoCarte.id_cli_common) != 5 &&
                    getMemoCarteCliCommonFunc(memoCarte.id_cli_common) !== null
                  "
                  :class="{
                    'bg-green text-grey-100 q-br-5 q-px-xs q-ml-md':
                      getMemoCarteCliCommonFunc(memoCarte.id_cli_common) == 1,
                    'bg-grey-600 text-grey-100 q-br-5 q-px-xs q-ml-md':
                      getMemoCarteCliCommonFunc(memoCarte.id_cli_common) == 2,
                    'bg-blue-800 text-white q-br-5 q-px-xs q-ml-md':
                      getMemoCarteCliCommonFunc(memoCarte.id_cli_common) == 6,
                    'chip-purple text-white q-br-5 q-px-xs q-ml-md':
                      getMemoCarteCliCommonFunc(memoCarte.id_cli_common) == 10,
                    'bg-pink-700 text-white q-br-5 q-px-xs q-ml-md':
                      getMemoCarteCliCommonFunc(memoCarte.id_cli_common) == 15
                  }"
                >
                  {{
                    typeMemoCarte.find(
                      (v) =>
                        v.value ===
                        getMemoCarteCliCommonFunc(memoCarte.id_cli_common)
                    )?.label
                  }}
                </small>
                <small class="text-grey-600 q-ml-md q-mr-xs">対象診察 :</small>
                {{ illnessHistoryName(memoCarte?.id_pet_illness_history) }}
                <template v-if="memoCarte.type_input === 1">
                  <div
                    class="row bg-white cursor-pointer q-px-md q-py-xs q-ml-xl memo_ai"
                    @click.stop="openVerifyUnverifyModal(memoCarte)"
                  >
                    <img
                      v-if="memoCarte.flg_verified"
                      class="verify-img q-mr-sm"
                      height="26"
                      src="@/assets/img/aiVetty/verify_confirm.png"
                      width="25"
                    />
                    <span class="text-grey-600">AIカルテ</span>
                    <div
                      :class="
                        memoCarte.flg_verified
                          ? 'verify-status text-blue'
                          : 'unverify-status'
                      "
                      class="status q-pl-sm"
                    >
                      {{
                        memoCarte.flg_verified
                          ? 'レビュー済'
                          : '確認してください！'
                      }}
                    </div>
                  </div>
                </template>
                <small class="text-grey-600 q-ml-auto">{{
                  getMemoCartelabel(memoCarte.id_cli_common)
                }}</small>
              </div>
              <div
                v-html="showHTMLDataV1(memoCarte)"
                class="q-mt-md q-mb-lx"
              ></div>
              <div class="row justify-between q-mt-md text-grey-700">
                <small class="col row items-center">
                  <q-icon
                    name="history"
                    class="cursor-pointer q-mr-xs"
                    size="16px"
                  />
                  {{ getLastUpdateDate(getFilteredMemoCartesV1[date_insert].others[dt_insert]) }}
                </small>
                <small
                  v-if="getEmployeeByMemoCarte(memoCarte)"
                  class="col-auto row items-center"
                >
                  <q-icon
                    name="person"
                    class="cursor-pointer q-mr-xs"
                    size="16px"
                  />
                  {{ getEmployeeByMemoCarte(memoCarte) }}
                </small>
              </div>
            </div>

            <!-- THIS DIV IS FOR LAB RESULT -->
            <template
              v-if="
                getFilteredMemoCartesV1[date_insert].others[dt_insert]
                  ?.lab_result_list && showLabResults
              "
            >
              <template
                v-for="device in getFilteredMemoCartesV1[date_insert].others[
                  dt_insert
                ]?.lab_result_list"
              >
                <template v-for="dates in device">
                  <div v-for="(lab_result, datetime_registered) in dates">
                    <div
                      class="bg-white memo-title q-my-md q-pa-md cursor-pointer"
                      @click="openLabResultDetailModal(lab_result?.[0])"
                    >
                      <q-table
                        :columns="[
                          ...defaultLRColumn,
                          {
                            name: 'date',
                            label: formatDateWithTime(
                              datetime_registered,
                              'YY/MM/DD HH時'
                            ),
                            date: datetime_registered,
                            field: 'date',
                            align: 'center',
                            colspan: '2',
                            width: '40%'
                          }
                        ]"
                        :rows="getUniqueSetOfCarte(lab_result)"
                        :rowsBg="true"
                        class="my-sticky-header-column-table"
                        flat
                        hide-bottom
                        :rows-per-page-options="[0]"
                        no-data-message="登録がありません。"
                        no-result-message="該当のデータが見つかりませんでした"
                      >
                        <template v-slot:header="{ cols }">
                          <q-tr>
                            <template v-for="col in cols">
                              <q-th
                                v-if="col.field === 'date'"
                                style="width: 150px"
                                class="dark"
                              >
                                {{ col.label }}
                              </q-th>
                              <q-th v-else class="light">
                                {{ col.label }}
                              </q-th>
                            </template>
                          </q-tr>
                        </template>
                        <template v-slot:body="{ row, cols }">
                          <template v-if="row?.lab_device?.flg_above_blank_row || row?.lab_set?.flg_above_blank_row">
                            <q-tr>
                              <div style="height: 10px"></div>
                            </q-tr>
                          </template>
                          <q-tr>
                            <q-td
                              v-for="col in cols"
                              :width="col.width"
                              :class="[
                                col.field === 'date' ? 'cursor-pointer' : '',
                                row?.lab_device?.flg_above_blank_row || row?.lab_set?.flg_above_blank_row ? 'q-bt' : ''
                              ]"
                              style="white-space: unset;"
                            >
                              <div key="memo_internal">
                                <div v-if="col.field === 'date'">
                                  <div class="row">
                                    <div class="col-6 text-center q-br">
                                      {{ row.qualifier }}
                                    </div>
                                    <div class="col-6 text-center">
                                      <div v-html="showValResult(row)" />
                                    </div>
                                  </div>
                                </div>
                                <div v-else-if="col.field === 'name_lab'">
                                  <div
                                    class="flex text-wrap items-center"
                                    :class="row?.lab_device?.flg_indent || row?.lab_set?.flg_indent ? 'q-ml-md' : ''"
                                  >
                                    <div class="q-mr-md">
                                      <b>{{
                                        row?.name_lab_en
                                          ? row?.name_lab_en?.replace('%', ' ')
                                          : row?.lab?.name_lab_en?.replace(
                                              '%',
                                              ' '
                                            )
                                      }}</b>
                                    </div>
                                    <div>
                                      {{
                                        row?.name_lab_en || row?.name_lab
                                          ? row?.name_lab_en == row?.name_lab
                                            ? ''
                                            : row?.name_lab
                                          : row?.lab?.name_lab_en ==
                                            row?.lab?.name_lab
                                          ? ''
                                          : row?.lab?.name_lab
                                      }}
                                    </div>
                                  </div>
                                </div>
                                <div v-else-if="col.field === 'range'">
                                  <div
                                    v-if="row.low && row.high"
                                    class="flex no-wrap items-center"
                                  >
                                    {{ row.low }} ~ {{ row.high }}
                                  </div>
                                </div>
                                <div
                                  v-else-if="col.field === 'name_unit_result'"
                                  class="body1 text-center regular text-grey-900"
                                >
                                  {{
                                    row.id_cm_unit
                                      ? typeLabUnitName(row.id_cm_unit)
                                      : row.name_unit_result
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
                          </q-tr>
                        </template>
                      </q-table>
                      <div class="flex justify-between">
                        <div>
                          <div
                            v-if="lab_result?.[0]?.id_service_detail"
                            @click.stop="
                              openServiceDetail(
                                lab_result?.[0]?.id_service_detail
                              )
                            "
                            class="caption1 regular q-mt-sm text-blue"
                          >
                            {{ lab_result?.[0]?.number_service_detail }}
                          </div>
                        </div>
                        <div class="flex justify-end">
                          <!--Single Lab Result PDF-->
                          <div
                            @click.stop="togglePdfConfirmation(lab_result)"
                            class="caption1 regular q-mt-sm text-blue"
                          >
                            <q-icon name="compare" />
                            一回
                          </div>
                          <div class="caption1 regular q-mt-sm">
                            <span class="q-mx-xs">/</span>
                          </div>
                          <!--Comparison Lab Result-->
                          <div
                            @click.stop="openLabResultMultiModal(lab_result)"
                            class="caption1 regular q-mt-sm text-blue"
                          >
                            比較
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </template>

            <div
              v-for="(labResultNote, index) in getFilteredMemoCartesV1[date_insert]
                .others[dt_insert]?.lab_result_note_list"
              :key="`${date_insert}-${index}`"
              class="memo-title q-mb-md q-pa-md cursor-pointer bg-memo-carte relative-position bg-white"
            >
              <div class="flex items-center">
                <strong class="letter-space-050">
                  {{ formatDate(labResultNote?.datetime_registered) }}
                </strong>
              </div>
              <div
                class="q-mt-md q-mb-lx"
                v-html="showHTMLDataLabResultV1(labResultNote)"
              ></div>
              <div class="flex row justify-end">
                <q-btn
                  outline
                  unelevated
                  @click="openIdexxUrl(labResultNote)"
                >
                  IDEXX
                  <q-icon class="q-pl-sm" name="open_in_new" size="14px" />
                </q-btn>
              </div>
            </div>
            <div
              v-if="
                getFilteredMemoCartesV1[dateFormat(date_insert)]?.clinical_file_list
                  ?.length > 0
              "
              class="q-mb-md row c-gap"
            >
              <div
                v-for="(files, i) in getFilteredMemoCartesV1[
              dateFormat(date_insert)
            ]?.clinical_file_list.filter((cf)=> cf.id_lab_result)"
                :key="`MiddleRequestDetail-files-${i}-${files.file_path}`"
                class="col-auto image-container cursor-pointer"
                @click="onClickFileClinic(files, i, dateFormat(date_insert))"
              >
                <img
                  v-if="files.type_file == 1 || files.type_file == 3"
                  :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
                  class="thumbnail-style flex column-sm"
                  @error="replaceByDefaultImg"
                />
                <video
                  v-else-if="files.type_file == 2"
                  :id="`cli_file_video_${i}`"
                  class="thumbnail-style"
                  controls
                  style="width: 169px"
                >
                  <source :src="files.file_path" type="video/mp4" />
                </video>
                <img
                  v-else-if="files.file_path?.includes('.pdf')"
                  :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
                  class="xy thumbnail-style"
                />
                <img
                  v-else-if="
                files.file_path?.includes('.mp3') ||
                files.file_path?.includes('.wav')
              "
                  :src="'/src/assets/img/clinicalFiles/audio.png'"
                  class="xy thumbnail-style"
                />
                <img v-else :src="fileLogo" class="xy thumbnail-style" />
                <div class="date-overlay">
                  {{ formatDate(files.datetime_receive) }}
                </div>
              </div>
            </div>

            <!-- THIS DIV IS FOR MEDICAL CONDITION -->
            <div
              v-for="(medCondition, index) in getFilteredMemoCartesV1[
                date_insert
              ].others[dt_insert]?.medical_condition"
              :key="`${date_insert}-${index}`"
              :class="'bg-' + getMemoCarteBgColor(medCondition)"
              class="memo-title q-mb-md q-pa-md cursor-pointer"
              :style="{ backgroundColor: getMemoCarteBgColor(medCondition) }"
              @click.stop="medConditionModal(medCondition)"
            >
              <div class="flex items-center">
                <strong class="letter-space-050">
                  {{ formatDate(medCondition?.datetime_record) }}
                </strong>
                <small class="text-grey-600 q-ml-md q-mr-xs"></small>
                {{ cliCommonName(medCondition?.code_cli_common) }}
              </div>
              <div class="q-mt-md q-mb-sm">
                <q-btn-group outline spread class="btn-options items-center">
                  <template
                    v-for="cliCodeCommon in codeCommonList(
                      medCondition?.code_cli_common
                    )"
                    :key="cliCodeCommon.id_cli_common"
                  >
                    <q-btn
                      :outline="
                        medCondition.type_med_condition !=
                        cliCodeCommon.code_func1
                      "
                      :label="cliCodeCommon.name_cli_common"
                      :style="{
                        backgroundColor:
                          medCondition.type_med_condition ==
                          cliCodeCommon.code_func1
                            ? '#1d7afc'
                            : '',
                        color:
                          medCondition.type_med_condition ==
                          cliCodeCommon.code_func1
                            ? '#fff'
                            : ''
                      }"
                    />
                  </template>
                </q-btn-group>
                <div v-if="medCondition?.memo_record" class="q-mt-md">
                  {{ medCondition?.memo_record }}
                </div>
              </div>
            </div>
          </template>
        </template>

        <!-- THIS DIV IS FOR CLINICAL FILE -->
        <div
          v-if="
            getFilteredMemoCartesV1[dateFormat(date_insert)]?.clinical_file_list
              ?.length > 0
          "
          class="q-mb-md row c-gap"
        >
          <div
            v-for="(files, i) in getFilteredMemoCartesV1[
              dateFormat(date_insert)
            ]?.clinical_file_list.filter((cf)=> !cf.id_lab_result)"
            @click="onClickFileClinic(files, i, dateFormat(date_insert))"
            :key="`MiddleRequestDetail-files-${i}-${files.file_path}`"
            class="col-auto image-container cursor-pointer"
          >
            <img
              v-if="files.type_file == 1 || files.type_file == 3"
              :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
              class="thumbnail-style flex column-sm"
              @error="replaceByDefaultImg"
            />
            <video
              v-else-if="files.type_file == 2"
              :id="`cli_file_video_${i}`"
              class="thumbnail-style"
              style="width: 169px"
              controls
            >
              <source :src="files.file_path" type="video/mp4" />
            </video>
            <img
              v-else-if="files.file_path?.includes('.pdf')"
              :src="files.thumbnail_path ? files.thumbnail_path : fileLogo"
              class="xy thumbnail-style"
            />
            <img
              v-else-if="
                files.file_path?.includes('.mp3') ||
                files.file_path?.includes('.wav')
              "
              :src="'/src/assets/img/clinicalFiles/audio.png'"
              class="xy thumbnail-style"
            />
            <img v-else :src="fileLogo" class="xy thumbnail-style" />
            <div class="date-overlay">
              {{ formatDate(files.datetime_receive) }}
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex justify-end fixed-bottom full-width q-pa-md ipad-top-button-bottom"
        :style="isIpad ? { bottom: '85px' } : { bottom: '55px' }"
      >
        <q-btn flat @click.stop="scrollToTop()">
          <q-icon class="q-mr-xs" name="vertical_align_top" />
          TOP
        </q-btn>
      </div>
      <!-- <div
        class="flex justify-center bg-grey-300 full-width"
        :class="isIpad ? 'q-pa-sm' : 'fixed-bottom q-pa-md'"
      > -->
      <div
        class="flex justify-center bg-grey-300 full-width fixed-bottom q-py-sm z-index-9"
      >
        <q-btn flat 
          class="absolute q-py-none q-px-sm q-my-xs text-blue" 
          style="left: 10px;" 
          @click.stop="openViewAllCartePerDateList"
          size="11px"
        >
          日
        </q-btn>
        <q-btn @click.stop="createMemoCarteModal(true)" flat class="text-blue">
          診療カルテ
        </q-btn>
        <q-btn @click.stop="createMemoCarteModal()" flat class="text-blue">
          メモカルテ
        </q-btn>
        <q-btn @click.stop="openLabResultViewModal()" flat class="text-blue">
          検査
        </q-btn>
        <q-btn @click.stop="createTextTemplateImage" flat class="text-blue">
          シェーマ
        </q-btn>
        <q-btn flat 
          class="absolute q-py-none q-px-sm q-my-xs" 
          style="right: 10px;" 
          @click.stop="handleLabResultToggle"
          :class="[showLabResults ? 'bg-primary text-white' : 'bg-grey-200 text-grey-700']"
          size="11px"
        >
          検
        </q-btn>
      </div>
    </q-scroll-area>

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
              label="基準値範囲外アイコン"
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
            @click="cancel"
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
  </div>
</template>

<style lang="scss">
.memo-title {
  padding: 10px 15px;
  border-radius: 10px;
  line-height: 1.7;
  max-width: 100%;
  word-break: break-all;

  .memo_ai {
    border: 1px solid $grey-300;
    border-radius: 3px;
    z-index: auto;

    .verify-img {
      img {
        object-fit: contain !important;
      }
    }

    .status {
      font-size: 15px;
      // Adding this to allow click event to be triggered because of sticky date
      position: relative;
      // z-index: 999;

      &.unverify-status {
        color: #971717;
      }

      &.verify-status {
        text-decoration: underline;
      }
    }
  }
}

.select-search {
  width: 160px;
  @media (min-width: 500px) {
    width: 200px;
  }
  @media (min-width: 600px) {
    width: 300px;
  }
  background-color: hsla(0, 0%, 100%, 0.6);
  border-radius: 28px;
}

.form-pulldown {
  width: 100%;
  @media (min-width: 600px) {
    width: 110px;
  }
}

.c-gap {
  column-gap: 20px;
  row-gap: 20px;
}

.image-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 169px;
  height: 123px;
}

.thumbnail-style {
  border-radius: 8px;
  height: 123px;
  max-width: 169px;
  object-fit: cover;
}

.image-container img,
.image-container video {
  width: 100%;
  height: 100%;
}

.date-overlay {
  position: absolute;
  bottom: 4px;
  right: 6px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 5px;
  font-size: 12px;
  border-radius: 8px;
}

.btn-options {
  background: white;
  border-radius: 20px;

  .q-btn--outline:before {
    border: 1px solid #1d7afc;
  }

  .q-btn--outline:not(:first-child):before {
    border-left: 0;
  }
}

.q-table__card {
  border: 1px solid $grey-300;
}

.my-sticky-header-column-table td:nth-of-type(1),
.my-sticky-header-column-table th:nth-of-type(1) {
  text-wrap: nowrap;
}

.my-sticky-header-column-table .dark {
  background-color: #424242;
  color: white;
}

.my-sticky-header-column-table .light {
  background-color: #fff4cb;
  color: black;
}

.my-sticky-header-column-table .q-table thead tr,
.my-sticky-header-column-table .q-table tbody td {
  padding: 1px;
  padding-left: 5px;
  height: 13px;
}

.my-sticky-header-column-table .q-table thead tr th {
  padding: 3px;
  font-weight: 400;
}

.my-sticky-header-column-table .q-table thead tr > th:not(:first-child),
.my-sticky-header-column-table .q-table tbody tr > td:not(:first-child) {
  border-left-width: 1px;
}

.expand-search {
  z-index: 2;
}

.ipad-fixed-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
}
.pet-bio-info-label {
  padding: 2px 5px;
  margin: 7px 15px 7px 0px;
  color: #222;
  border-radius: 3px;
  font-size: 12px;
  background: #e1e5eb;
}
.pet-bio-info-option {
  font-weight: bold;
  color: #222;
}
.pet-bio-info-unit {
  margin-left: 8px;
  font-size: 12px;
}
.med-condition-label {
  padding: 0px 5px 0px;
  margin: 5px 15px 5px 0px;
  color: #222;
  border-radius: 3px;
  font-size: 12px;
  background: #e1e5eb;
}
.med-condition-option {
  padding: 0px 12px;
  font-size: 14px;

  border-radius: 25px;
  margin: 3px 10px 3px 0px;

  font-weight: bold;
}
.q-bt {
  border-top: 1px solid #e0e0e0 !important;
}
</style>
