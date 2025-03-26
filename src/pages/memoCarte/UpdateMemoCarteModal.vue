<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, Ref, nextTick } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useMemoCarteStore from '@/stores/memo-cartes'
import useIllnessHistoryStore from '@/stores/illness-history'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import {
  changeToggleDropdownNames,
  copyText,
  formatDateWithTime,
  getDateTimeNow,
  getDateToday,
  getFullPetName,
  getLoggedinUser,
  updateBtnLabel,
  openViewAllCartePerDateList
} from '@/utils/aahUtils'
import { removeHtmlTag } from './memoCarteUtils'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import FabricMemoCarteModal from './FabricMemoCarteModal.vue'
import LeftUpdateMemoCarteModal from './LeftUpdateMemoCarteModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import UpdateRecordingHeaderModal from '@/pages/memoCarte/UpdateRecordingHeaderModal.vue'
import UpdateRecordingServiceModal from '@/pages/memoCarte/UpdateRecordingServiceModal.vue'
import SelectServiceTypeRecordingModal from '@/pages/memoCarte/SelectServiceTypeRecordingModal.vue'
import KoekaruServiceUnavailableModal from './KoekaruServiceUnavailableModal.vue'
import UpdatePdfPetCarteSetting from'@/pages/memoCarte/UpdatePdfPetCarteSetting.vue'

import useCustomerStore from '@/stores/customers'
import useTextTemplateStore from '@/stores/text-template'
import useConversationStore from '@/stores/Conversation'
import UpdateTaskModal from '../task/UpdateTaskModal.vue'
import useFabricStore from '@/stores/fabrics'
import { storeToRefs } from 'pinia'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useTask from '@/stores/task'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import AddTextTemplateModal from '../task/AddTextTemplateModal.vue'
import UpdateMessageThreadModal from '@/pages/message/UpdateMessageThreadModal.vue'
import useMessageStore from '@/stores/message-clinic'
import { sortBy } from 'lodash'
import { useRouter } from 'vue-router'
import { event_bus } from '@/utils/eventBus'
import { useRecording } from './useRecording'
import useClinicStore from '@/stores/clinics'
import koekaruApi from '@/boot/axiosKoekaru'
import { CliCommon, IllnessHistoryType, RequestDetailPageType, MemoCarteType } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import useClinicalFilesStore from '@/stores/clinical-files'
import { useMovableModalStore } from '@/stores/movable-modal'
import UpdateMovableMemoCarteModal from '@/pages/memoCarte/UpdateMovableMemoCarteModal.vue'
import MtPetInfo from '@/components/MtPetInfo.vue'

type memoFieldsType = {
  field: string
  name: string
  label: string
}

const fabricStore = useFabricStore()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const clinicStore = useClinicStore()
const taskStore = useTask()
const textTemplateStore = useTextTemplateStore()
const conversationStore = useConversationStore()
const cliCommonStore = useCliCommonStore()
const messageStore = useMessageStore()
const clinicalFilesStore = useClinicalFilesStore()
const { pauseRecording, resumeRecording, isPaused, flg_auto_memocarte_ai } =
  useRecording()
const { getTemplates } = storeToRefs(textTemplateStore)
const { getMemoCartes, getMemoCartePetDetail } = storeToRefs(memoCarteStore)
const { getIllnessHistorys, getLeftSideIllnessHistoryList } =
  storeToRefs(illnessHistoryStore)
const { getFabric } = storeToRefs(fabricStore)
const { getCliCommonTypeCarteSourceList } = storeToRefs(cliCommonStore)
const emits = defineEmits(['close'])
const router = useRouter()
const movableModalStore = useMovableModalStore()

const fabricImages = ref([])
const memoFieldsRef = ref([])

const isSubmitting = ref(false)
const isSaving = ref(false)

const MIN_WIDTH_FOR_ICONS_TEXT = 1400
const showHeaderIconsText = ref(window.innerWidth >= MIN_WIDTH_FOR_ICONS_TEXT)

const petCartePdfConfirmationDialog = ref(false)

type MovableMemoCartContentType = {
  datetime_memo_carte: string
  id_clinic: string
  id_customer: string
  id_employee: number
  id_pet: string
  id_pet_illness_history: string[]
  id_request: string
  illnessHistoryOptions: string[]
  memo_other: string
  id_cli_common: number
}

const props = withDefaults(
  defineProps<{
    data: object
    id_request: string
    id_customer: string
    id_pet: string
    number_request?: string
    id_pet_illness_history?: string
    id_memo_carte?: number
    memo_other?: string
    datetime_memo_carte?: string
    id_employee?: string
    requestDetailPage?: RequestDetailPageType
    updatedFlg?: { value: boolean }
    fromMovableMemoCarte?: boolean
    movable_cart_content?: MovableMemoCartContentType,
    autoSaveOnMount: boolean,
    callBackRefresh: Function
  }>(),
  {
    data: {},
    id_request: '',
    number_request: '',
    id_customer: '',
    id_pet: '',
    id_pet_illness_history: '',
    id_memo_carte: -1,
    memo_other: '',
    datetime_memo_carte: '',
    id_employee: '',
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    },
    updatedFlg: () => {
      return { value: false }
    },
    fromMovableMemoCarte: false,
    movable_cart_content: () => {
      return {} as MovableMemoCartContentType
    },
    callBackRefresh: Function,
    autoSaveOnMount: false
  }
)
const memoFields: memoFieldsType[] = [
  { field: 'memo_sbj', name: 'memo_sbj', label: 'S: 主観' },
  { field: 'memo_obj', name: 'memo_obj', label: 'O: 客観' },
  { field: 'memo_ass', name: 'memo_ass', label: 'A: 評価' },
  { field: 'memo_other', name: 'memo_other', label: 'P: 計画他' }
]

const memoCarteList = ref([])
const addTemplateModalFlg = ref(false),
  textTemplatesList = ref([])
const closeModal = async (direct: boolean = true) => {
  if (!direct) {
    if (
      JSON.stringify(currentData.value) !== JSON.stringify(data.value) ||
      JSON.stringify(currentImageData.value) !==
        JSON.stringify(fabricImages.value)
    ) {
      const confirmation = await mtUtils.confirm(
        '未保存の内容があります。 \n 保存しますか？',
        '確認',
        '保存して閉じる',
        null,
        null,
        null,
        {
          show: false,
          callBackFun: Function
        },
        true,
        '保存しないで閉じる',
        true
      )
      if (confirmation) {
        submit()
      }
    }
  }
  fabricStore.resetFabricOption()
  emits('close')
}
const isDatetimeEdited = ref(false)
const petSelected = ref()
const customerSelected = ref()
const targetRef = ref()
const foreColor = ref('#ffff00')
const foreColorMd: Ref<string[]> = ref([
  '#ffff00',
  '#ffff00',
  '#ffff00',
  '#ffff00'
])
const memoCarteIndex = ref(0)
let observer = null // it will watch DOM changes
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const employeeRef = ref()

const setMemoCarteContent = (memo: MemoCarteType) => {
  data.value = memo
  data.value.memo_other = memo.memo_other
  currentData.value = JSON.parse(JSON.stringify(data.value))
}
const memoCarteNext = () => {
  if (memoCarteIndex.value !== 0) {
    memoCarteIndex.value--
    setMemoCarteContent(memoCarteList.value[memoCarteIndex.value])
  }
}
const memoCartePrev = () => {
  if (memoCarteIndex.value !== memoCarteList.value?.length - 1) {
    memoCarteIndex.value++
    setMemoCarteContent(memoCarteList.value[memoCarteIndex.value])
  }
}
// const handlePaste = async (event) => {
//   event.preventDefault()
//   // Get the plain text from the clipboard
//   const text = (event.clipboardData || window.clipboardData).getData('text')

//   // Insert text at cursor position
//   document.execCommand('insertHtml', true, text) // I updated from insertText to insertHtml in order to retain the styling, with insertText, the div and other tags get removed.
// }
const colorClicked = (index?) => {
  let edit
  if (index !== undefined) {
    //  get the editor instance
    edit = memoFieldsRef.value[index]
    edit.runCmd('foreColor', foreColorMd.value[index])
  } else {
    edit = targetRef.value
    edit.runCmd('foreColor', foreColor.value)
  }
  edit.focus()
}
const data = ref({
  id_pet: '',
  id_request: '',
  id_customer: '',
  id_employee: defaultEmployee,
  datetime_memo_carte: getDateTimeNow(),
  id_pet_illness_history: [],
  id_clinic: '',
  memo_other: '',
  memo_sbj: null,
  memo_obj: null,
  memo_ass: null,
  illnessHistoryOptions: null,
  id_cli_common: -1,
  illnessHistoryOptions: null,
  type_input: 2,
  flg_pinned: false
})

const currentData = ref('')
const currentImageData = ref()
const setDefaultDateTime = () => {
  if (!isDatetimeEdited) {
    const memo_carte = memoCarteList.value.find(
      (item) => item.id_memo_carte === props.id_memo_carte
    )
    data.value.datetime_memo_carte = formatDateWithTime(
      memo_carte.datetime_memo_carte,
      'YYYY/MM/DD HH:mm:ss'
    )
  } else {
    data.value.datetime_memo_carte = formatDateWithTime(
      data.value.datetime_memo_carte,
      'YYYY/MM/DD HH:mm:ss'
    )
  }
}

const typeMemoCarte = computed(() => {
  return getCliCommonTypeCarteSourceList.value
    .filter((v: CliCommon) => v.code_cli_common == 11)
    .map((v: CliCommon) => ({
      ...v,
      label: v.name_cli_common,
      value: v.id_cli_common
    }))
})

const editorBackground = computed(() => {
  return (
    typeMemoCarte.value.find((carte) => {
      return carte.id_cli_common === data.value.id_cli_common
    })?.text1 ?? ''
  )
})
const openMenu = async () => {
  let menuOptions = [
    {
      title: 'スレッド作成',
      name: 'create_thread',
      isChanged: false,
      attr: { class: null, clickable: true }
    },
    {
      title: 'カルテ印刷',
      name: 'pet_carte_pdf',
      isChanged: false,
      attr: { 
        class: null, 
        clickable: true 
      }
    },
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: { class: null, clickable: true }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await memoCarteStore.destroyMemoCarte(props.id_memo_carte)

            mtUtils.autoCloseAlert(aahMessages.success)
            props.callBackRefresh()
            emits('close')
          }
        })
    }
    // Create thread
    else if (selectedOption.name == 'create_thread') {
      const threadData = {
        memo_goal: '',
        id_pet: data.value?.id_pet,
        id_customer: data.value.id_customer,
        linkCategory: 4,
        id_link1: data.value.id_memo_carte,
        number_link1: data.value.number_memo_carte
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
    }
    else if(selectedOption.name == 'pet_carte_pdf') {
      petCartePdfConfirmationDialog.value = true
    }
  }
}
const storeClinicalFile = async () => {
  if (fabricStore.getFabricOption.length > 0) {
    for (const item of fabricStore.getFabricOption) {
      const createData = {
        ...item,
        id_pet_illness_history: data.value.id_pet_illness_history?.[0]
          ? data.value.id_pet_illness_history?.[0]
          : null,
        datetime_receive: formatDateWithTime(
          data.value.datetime_memo_carte,
          'YYYY/MM/DD HH:mm:ss'
        ),
        name_file: formatDateWithTime(
          getDateTimeNow(),
          'FileMemoCarte_YYYYMMDD_HHmmss.jpeg'
        ),
        type_file: 1,
        type_receive_format: 2,
        type_provider: 1
      }
      await clinicalFilesStore.submitClinicalFile(createData).then(() => {
        clinicalFilesStore.fetchClinicalFiles({
          id_pet: props.id_pet
        })
      })
    }

    fabricStore.resetFabricOption()
  }
}
const submit = async (close: boolean = true, autoSave: boolean = false) => {
  if (isSubmitting.value || isSaving.value) return

  const checkMemoFields = memoFields
    .map((v) => {
      if (data.value[v.field]) return true
      return false
    })
    .filter((v) => v)

  //  Check if the memo fields is exceed 2000 characters and then show alert exact alert if its more than 1 field show all of them
  if (checkMemoFields.length > 0) {
    if (data.value.memo_sbj || data.value.memo_obj || data.value.memo_ass) {
      const memoFieldsExceed = memoFields.filter(
        (v) => data.value[v.field].replace(/<[^>]*>/g, '').length > 2000
      )
      if (memoFieldsExceed.length > 0) {
        let memoFieldsExceedNames = memoFieldsExceed
          .map((v) => v.label)
          .join(', ')
        return mtUtils.alert(
          `${memoFieldsExceedNames} は2000文字を超えています。`,
          'Error: MC000b'
        )
      }
    } else {
      if (data.value.memo_other.replace(/<[^>]*>/g, '').length > 2000) {
        return mtUtils.alert('メモカルテの文字数が2000文字を超えています。')
      }
    }
  }

  if (close) {
    isSubmitting.value = true
  } else {
    isSaving.value = !autoSave
  }
  try {
    if (!data.value.id_pet_illness_history)
      delete data.value.id_pet_illness_history
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

    if (
      !data.value.memo_other &&
      !(data.value.memo_sbj || data.value.memo_obj || data.value.memo_ass) &&
      !fabricStore.getFabricOption.length
    ) {
      if (!autoSave) mtUtils.alert('メモカルテに内容がありません。', 'Error: MC000b')
      return
    }

    if (data.value.id_memo_carte) {
      setDefaultDateTime()
      const fetchResponse = await memoCarteStore.updateMemoCarte(data.value.id_memo_carte, data.value)
      await storeClinicalFile()
      await memoCarteStore.fetchMemoCarteV1({
        id_pet: props.id_pet,
        id_customer: props.id_customer
      })
      await memoCarteStore.fetchMemoCartePinned({ id_pet: props.id_pet })
      if (!autoSave) {
        mtUtils.autoCloseAlert(aahMessages.success)
      }
      setMemoCarteContent(fetchResponse.data.data)
      
      if (close) {
        emits('close')
      }
    } else {
      data.value.datetime_memo_carte = formatDateWithTime(
        props.autoSaveOnMount ? getDateTimeNow() : data.value.datetime_memo_carte,
        'YYYY/MM/DD HH:mm:ss'
      )
      const fetchResponse = await memoCarteStore.submitMemoCarte(data.value)
      await storeClinicalFile()

      await memoCarteStore.fetchMemoCarteV1({
        id_pet: props.id_pet,
        id_customer: props.id_customer
      })
      await memoCarteStore.fetchMemoCartePinned({ id_pet: props.id_pet })
      event_bus.emit('reloadLeft')
      if (!autoSave) {
        mtUtils.autoCloseAlert(props.autoSaveOnMount ? 'カルテをコピーしました！' : aahMessages.success)
      }
      if (close) {
        emits('close')
      } else {
        setMemoCarteContent(fetchResponse.data.data)
      }
    }
  } catch (error) {
    console.error('Error submitting memo:', error)
    mtUtils.alert(
      'エラーが発生しました。\n管理者にお問い合わせください。',
      'Error: MC001'
    )
  } finally {
    isSubmitting.value = false
    isSaving.value = false
  }
}
const toggleMemoCarteFlgPinned = async () => {
  data.value.flg_pinned = !data.value.flg_pinned
  await submit(false)
}

const openCreateTaskModal = async () => {
  taskStore.selectTask(null)
  const taskData = {
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    type_link1: 4,
    number_link1:
      props.id_memo_carte != -1 ? data.value?.number_memo_carte : '',
    id_employee_staff: props.requestDetailPage?.id_employee_staff,
    id_employee_request: JSON.parse(localStorage.getItem('id_employee'))
  }
  await mtUtils.popup(UpdateTaskModal, { data: taskData, copiedTaskData: true }, true)
}
const openFabricMemoCarteModal = async () => {
  await mtUtils.mediumPopup(FabricMemoCarteModal, {
    id_memo_carte: props.id_memo_carte,
    additional_image: data.value?.files,
    id_customer: data.value?.id_customer,
    id_pet: data.value?.id_pet,
    popup: {
      persistent: true
    }
  })
  if (fabricStore.getFabricOption.length > 0) {
    fabricImages.value = fabricStore.getFabricOption
  }
}
const showMemoField = (
  field: 'memo_sbj' | 'memo_obj' | 'memo_ass' | 'memo_other'
) => {
  switch (field) {
    case 'memo_sbj':
      return data.value.memo_sbj
    case 'memo_obj':
      return data.value.memo_obj
    case 'memo_ass':
      return data.value.memo_ass
    case 'memo_other':
      return data.value.memo_other
  }
}
const setChildRef = (index) => (el) => {
  if (el) {
    memoFieldsRef.value[index] = el
  } else {
    memoFieldsRef.value.splice(index, 1)
  }
}
const openTemplateTextModal = async () => {
  await textTemplateStore.fetchTemplates({ type_text_template: 21, no_pagination: true })
  if (getTemplates.value.length) {
    textTemplatesList.value = sortBy(
      getTemplates.value,
      'display_order',
      'asc'
    ).map((template: any) => {
      return {
        title: template.memo_template,
        flg_title: template.flg_title,
        attr: {
          class: template.flg_title ? 'bg-grey-300' : ''
        },
        isSelected: false
      }
    })
  }
  addTemplateModalFlg.value = true
}
const openRecordingSettingsModal = async () => {
  // console.log('clinicStore.getClinic', clinicStore.getClinics)
  const checkAvailability = await koekaruApi.get(`/koekaru-availability`)

  if (!checkAvailability.data.data.is_service_available) {
    await mtUtils.smallPopup(KoekaruServiceUnavailableModal)
    return
  }
  if (localStorage.getItem('id_clinic')) {
    const filterClinic = clinicStore.getClinics.find(
      (clinic) => clinic.id_clinic == localStorage.getItem('id_clinic')
    )
    if (filterClinic) {
      flg_auto_memocarte_ai.value = filterClinic.flg_auto_memocarte_ai
    }
  }
  let confirmationUtils = false
  if (
    conversationStore.flgRecording &&
    props.id_request === conversationStore.requestId
  ) {
    pauseRecording()
    await mtUtils
      .confirm(
        'There is an ongoing record, you sure want to create another one?',
        'Recording Confirmation',
        '削除',
        null,
        null,
        null,
        {
          show: false,
          callBackFun: Function
        },
        true
      )
      .then((confirmation) => {
        if (!confirmation) {
          confirmationUtils = false
          resumeRecording()
        } else {
          confirmationUtils = true
          console.log(conversationStore)
        }
      })
  } else {
    confirmationUtils = true
  }

  if (!confirmationUtils) return

  if (conversationStore.flgRecording) {
    pauseRecording()
  }

  const recordingData = {
    id_employee: data.value.id_employee,
    datetime_memo_carte: data.value.datetime_memo_carte
  }
  let popup = {
    isMedicalRecord: false,
    recordingStarted: false,
    selected: false
  }
  // conversationStore.setMemoCarte(data.value)
  // localStorage.setItem('memo_cart_content', JSON.stringify(data.value))

  await mtUtils.smallPopup(SelectServiceTypeRecordingModal, { popup })

  if (popup.isMedicalRecord && popup.selected) {
    await mtUtils.smallPopup(UpdateRecordingServiceModal, {
      ...recordingData,
      id_customer: props.id_customer,
      id_pet: props.id_pet,
      id_request: props.id_request,
      number_request: props.number_request,
      petSelected: petSelected.value,
      popup: popup
    })
    if (popup.recordingStarted) {
      conversationStore.setSource('update_memo_carte')
      conversationStore.setCreateMemoCarteData(null)
      conversationStore.setCurrentMemoCarteData(null)
      conversationStore.setRecentMemoCarteList(data.value)
      conversationStore.typeMedical = true
      closeModal()
    }
  } else if (popup.selected) {
    await mtUtils.smallPopup(UpdateRecordingHeaderModal, {
      ...recordingData,
      id_customer: props.id_customer,
      id_pet: props.id_pet,
      id_request: props.id_request,
      number_request: props.number_request,
      petSelected: petSelected.value,
      popup: popup
    })
    if (popup.recordingStarted) {
      conversationStore.setSource('update_memo_carte')
      conversationStore.setCreateMemoCarteData(null)
      conversationStore.setCurrentMemoCarteData(null)
      conversationStore.setRecentMemoCarteList(data.value)
      conversationStore.typeMedical = false
      closeModal()
    }
  }
}

const duplicateMemoCarte = async () => {
  await navigator.clipboard.writeText(data.value.memo_other)
  props.updatedFlg.value = true
  localStorage.setItem('copyText', 'true')
  closeModal()
}

const checkIfMemoisHtmlOnly = (text: string) => {
  if (
    text
      .replace(/<[^>]*>/g, '')
      .replace(/<br\/>/g, '')
      .replace(/&nbsp;/g, '').length === 0
  ) {
    return true
  }
  return false
}

const copyMemoCarte = async () => {
  // Create a temporary div element
  let tempDiv = document.createElement('div')

  // check all memo fields in data and if it has value then add it to the tempDiv
  if (
    data.value.memo_other &&
    !(data.value.memo_ass && data.value.memo_obj && data.value.memo_sbj)
  ) {
    tempDiv.innerHTML += `${removeHtmlTag(data.value.memo_other)}`
  } else {
    memoFields.forEach((field) => {
      if (
        data.value[field.field] &&
        !checkIfMemoisHtmlOnly(data.value[field.field])
      ) {
        tempDiv.innerHTML += `${field.label} \n ${removeHtmlTag(
          data.value[field.field]
        )} \n\n`
      }
    })
  }
  // Remove img elements
  tempDiv.querySelectorAll('img').forEach((img) => {
    img?.parentNode?.removeChild(img)
  })

  // Get the updated HTML content
  let updatedHtml = tempDiv.innerHTML

  copyText(updatedHtml, 'コピーしました！\n貼り付けできます。')
}

//The function is updating the memo which is updated the AddTextTemplateModal component.
const handleUpdateMemo = (value: any) => {
  data.value.memo_other += ' ' + value.replace(/\n/g, '<br>')
}

const openMemoCarteMoveableModal = () => {
  movableModalStore.openMovableModal(data.value, UpdateMovableMemoCarteModal)
  closeModal()
}

const selectDefaultEmployee = () => {
  data.value.id_employee = defaultEmployee
}

const onPasteEditor = (event) => {
  event.preventDefault()
  event.stopPropagation()

  const plainText = event.clipboardData.getData('text/plain');
  const formattedText = plainText.replace(/\n/g, '<br />');
  
  document.execCommand('insertHTML', false, formattedText);
};


onUnmounted(() => {
  // Removing paste from clipboard event listener while onunmounted
  const editorElement = targetRef.value?.$el
  // if (editorElement) editorElement.removeEventListener('paste', handlePaste)
  // stop watching DOM changes
  observer?.disconnect()
})

let autoSaveMillSecs = 10000
let autoSaveTimer = null  // Auto save timer ID
let lastChanged = -1

const onUserActivity = () => {
  lastChanged = Date.now()
}

const autoSaveMemoCarte = () => {
  const elapsed = Date.now() - lastChanged
  if (elapsed < autoSaveMillSecs) {
    console.log(`UpdateMemoCarte: user has been active in the past ${elapsed} ms.`)
    return
  }
  const changed = (
    JSON.stringify(currentData.value) !== JSON.stringify(data.value) ||
    JSON.stringify(currentImageData.value) !== JSON.stringify(fabricImages.value)
  )
  if (changed) {
    console.log('UpdateMemoCarte: autosave changes')
    submit(false, true)
  } else {
    console.log('UpdateMemoCarte: no changes to save')
  }
}

const generatePetCartePdf = async (mode: 'download' | 'print') => {
  mtUtils.popup(UpdatePdfPetCarteSetting, {
    generatePdfAndClose: true,
    dateInsert: data.value.datetime_memo_carte.slice(0, 10),
    datetimeInsert: data.value.datetime_memo_carte,
    flgPinnedCarte: data.value.flg_pinned,
    mode
  })
}

const computedEditorHeight = computed(() => editorHeight.value)

const updateEditorHeight = () => {
  nextTick(() => {
    const editor = document.querySelector('.q-editor.editor.col');
    if (editor) {
      console.log('editor.clientHeight:', editor.clientHeight);
      document.documentElement.style.setProperty('--editor-height', `${editor.clientHeight}px`);
    }
  });
};

const handleScreenChange = () => {
  updateEditorHeight()
  showHeaderIconsText.value = window.innerWidth >= MIN_WIDTH_FOR_ICONS_TEXT
}

onBeforeUnmount(() => {
  if (autoSaveTimer != null) {
    console.log('UpdateMemoCarte clear autosave timer')
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
  window.removeEventListener('mousemove', onUserActivity)
  window.removeEventListener('click', onUserActivity)
  window.removeEventListener('keydown', onUserActivity)
  window.removeEventListener('touchstart', onUserActivity)
  window.removeEventListener('resize', handleScreenChange)
})

onMounted(async () => {
  console.log('UpdateMemoCarte: create autosave timer')
  window.addEventListener('mousemove', onUserActivity)
  window.addEventListener('click', onUserActivity)
  window.addEventListener('keydown', onUserActivity)
  window.addEventListener('touchstart', onUserActivity)
  autoSaveTimer = setInterval(autoSaveMemoCarte, autoSaveMillSecs)

  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [11] })
  data.value.id_cli_common = typeMemoCarte.value?.[0]?.id_cli_common

  if (getMemoCartePetDetail.value.length > 0)
    memoCarteList.value = getMemoCartePetDetail.value
  else if (getMemoCartes.value.length > 0)
    memoCarteList.value = getMemoCartes.value

  // Adding paste from clipboard event listener
  const editorElement = targetRef.value.$el
  // if (editorElement) editorElement.addEventListener('paste', handlePaste)

  data.value.id_customer = props.id_customer
  data.value.id_pet = props.id_pet

  if (props.id_request) data.value.id_request = props.id_request
  petSelected.value = customerStore.getPet
  customerSelected.value = customerStore.getCustomer

  if (getIllnessHistorys.value.length === 0)
    illnessHistoryStore.fetchIllnessHistorys({
      id_pet: petSelected.value?.id_pet,
      id_customer: customerSelected.value?.id_customer
    })

  if (props.fromMovableMemoCarte) {
    for (let key in props.movable_cart_content) {
      data.value[key] = props.movable_cart_content[key]
    }
  }

  if (props.id_memo_carte != -1) {
    data.value.id_memo_carte = props.id_memo_carte
    if (props.id_pet_illness_history) {
      data.value.id_pet_illness_history = [+props.id_pet_illness_history]
      data.value.illnessHistoryOptions = [props.id_pet_illness_history]
    }

    if (props.memo_other) {
      data.value.memo_other = props.memo_other
    }

    if (props.datetime_memo_carte) {
      data.value.datetime_memo_carte = props.datetime_memo_carte
    }

    if (!props.memo_other) {
      const memoCarteFind = memoCarteList.value?.find(
        (item) => item.id_memo_carte === props.id_memo_carte
      )
      if (memoCarteFind) {
        data.value = JSON.parse(JSON.stringify(memoCarteFind))
        data.value.datetime_memo_carte = formatDateWithTime(
          data.value.datetime_memo_carte,
          'YYYY/MM/DD HH:mm:ss'
        )
      } else if (props.data) {
        data.value = props.data
        data.value.datetime_memo_carte = formatDateWithTime(
          data.value.datetime_memo_carte,
          'YYYY/MM/DD HH:mm:ss'
        )
      }
    }
  } else {
    data.value.datetime_memo_carte = getDateTimeNow()
    if (
      localStorage.getItem('copyText') &&
      localStorage.getItem('copyText') == 'true'
    ) {
      const text = await navigator.clipboard.readText()
      data.value.memo_other = text
      localStorage.removeItem('copyText')
    }

    data.value.id_employee = getLoggedinUser()?.id_employee
    if (
      !Boolean(data.value.id_employee) &&
      employeeRef.value &&
      employeeRef.value.sortEmpList &&
      employeeRef.value.sortEmpList.length > 0
    ) {
      // get first employee
      let firstEmployee: any = employeeRef.value.sortEmpList.find(
        (emp) => !emp.disable
      )
      if (firstEmployee && firstEmployee?.value) {
        employeeRef.value.modelValue = firstEmployee.value
      }
    }
  }

  if (props.id_memo_carte === -1) {
    if (
      getLeftSideIllnessHistoryList.value &&
      getLeftSideIllnessHistoryList.value.length &&
      getLeftSideIllnessHistoryList.value.length > 0
    ) {
      let defaultIllnessHistory = getLeftSideIllnessHistoryList.value
        .filter((v: IllnessHistoryType) => v.id_pet_illness_history)
        .map((v: IllnessHistoryType) => v.id_pet_illness_history)

      data.value.id_pet_illness_history = defaultIllnessHistory
    }
  }

  const observerCallback = (mutationList, observer) => {
    for (let mutation of mutationList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.matches('[role="menu"]') ||
              node.matches('.q-editor__toolbar-group'))
          ) {
            changeToggleDropdownNames()
          }
        })
      }
    }
  }
  observer = new MutationObserver(observerCallback)
  observer.observe(document.body, { childList: true, subtree: true })
  if (props.id_memo_carte === -1) {
    const pet = customerStore.getPet
    const isDeceased = pet?.flg_deceased || false
    const isDeletedByCustomer = pet?.flg_delete_by_customer || false

    if (isDeceased || isDeletedByCustomer) {
      const todayDate = getDateToday()
      data.value.memo_other = `※ 自動作成 ※<br>オーナー様より亡くなった/除外登録がありました。<br>${todayDate}`
    }
  }

  currentData.value = JSON.parse(JSON.stringify(data.value))
  currentImageData.value = JSON.parse(JSON.stringify(fabricImages.value))

  nextTick(() => {
    if(props.autoSaveOnMount) {
      delete data.value.id_memo_carte
      submit(false, false)
    }
  })

  updateEditorHeight();
  window.addEventListener('resize', handleScreenChange)
})

const onFileRemoved = (index: number) => {
  fabricImages.value.splice(index, 1)
}

const handleOpenViewAllCartePerDateList = () => {
  openViewAllCartePerDateList(customerSelected.value, petSelected.value)
}
</script>

<template>
  <q-form class="column full-height" @submit="submit" @input="lastChanged = Date.now()">
    <MtModalHeader class="col-auto memo-carte-header" @closeModal="closeModal(false)">
      <q-toolbar-title class="text-grey-900 title3 bold row items-center header-title">
        メモカルテ：
        <span @click="copyText(data.number_memo_carte)" class="cursor-pointer">
          {{ data.number_memo_carte }}
          <q-icon name="content_copy" class="blue" />
        </span>
        <span class="q-ml-md" style="min-width: 0;">
          <MtPetInfo class="ellipsis" />
        </span>
      </q-toolbar-title>
      <div class="header-menu-btn-sec">
      <q-btn flat 
        style="left: 10px;" 
        size="11px"
        @click="handleOpenViewAllCartePerDateList"
        class="q-mr-sm"
      >
        <span v-if="showHeaderIconsText">日</span>
      </q-btn>
        <q-btn @click="openTemplateTextModal" flat class="q-mx-sm ">
          <q-icon class="q-mr-sm" name="playlist_add" />
          <span v-if="showHeaderIconsText">テンプレ</span>
        </q-btn>
        <q-btn flat unelevated @click="openFabricMemoCarteModal" class="q-mr-sm ">
          <q-icon name="add_photo_alternate" class="q-mr-sm" />
          <span v-if="showHeaderIconsText">シェーマ図</span>
        </q-btn>
        <q-btn
          @click="duplicateMemoCarte"
          flat
          class="q-mr-sm "
          v-if="props.id_memo_carte != -1"
        >
          <q-icon class="q-mr-sm" name="copy_all" />
          <span v-if="showHeaderIconsText">複製</span>
        </q-btn>
        <q-btn
          @click="copyMemoCarte"
          flat
          class="q-mr-sm "
          v-if="props.id_memo_carte != -1"
        >
          <q-icon class="q-mr-sm" name="content_copy" />
          <span v-if="showHeaderIconsText">コピー</span>
        </q-btn>
        <q-btn
          @click="openCreateTaskModal"
          unelevated
          class="q-mr-sm "
          v-if="props.id_memo_carte != -1"
        >
          <q-icon name="add" class="q-mr-sm" />
          <span v-if="showHeaderIconsText">タスク</span>
        </q-btn>
        <q-btn
          unelevated
          flat
          round
          class="q-mr-sm "
          @click="openMemoCarteMoveableModal"
        >
          <q-icon name="chrome_reader_mode" />
        </q-btn>
        <q-btn
          v-if="props.id_memo_carte != -1"
          @click="openMenu"
          icon="more_horiz"
          flat
          round
          class="q-mr-sm"
        />
      </div>
    </MtModalHeader>
    <q-card-section class="col">
      <div class="row q-col-gutter-md">
        <div class="col-lg-2 col-md-2 col-sm-2">
          <LeftUpdateMemoCarteModal
            @setMemoCarteContent="setMemoCarteContent"
          />
        </div>
        <div class="col-lg-10 col-md-10 col-sm-10">
          <div class="column no-wrap full-height">
            <!-- memo metadata form -->
            <div class="col-auto q-mb-md">
              <div class="row items-center" style="gap: 16px">
                <div class="col">
                  <InputEmployeeOptGroup
                    v-model:selected="data.id_employee"
                    label="記入者"
                    show-select-default-employee
                    ref="employeeRef"
                    @update:select-default-employee="selectDefaultEmployee"
                  />
                </div>
                <div class="col">
                  <MtFormInputDate
                    v-model:date="data.datetime_memo_carte"
                    label="メモカルテ記録日時"
                    @update:date="isDatetimeEdited = true"
                  />
                </div>
                <div class="col">
                  <MtFormPullDown
                    v-model:selected="data.id_cli_common"
                    :options="typeMemoCarte"
                    label="カルテ区分"
                    custom-option
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
                        :style="{
                          backgroundColor:
                            slotProps.opt.text1.startsWith('#') ||
                            slotProps.opt.text1.startsWith('rgb')
                              ? slotProps.opt.text1
                              : ''
                        }"
                      >
                        <q-item-section>
                          {{ slotProps.opt.label }}
                        </q-item-section>
                      </q-item>
                    </template>
                  </MtFormPullDown>
                </div>
                <div class="col-2">
                  <MtFormMultipleSelection
                    :options="getIllnessHistorys"
                    :option-label="
                      (v: IllnessHistoryType): string => {
                        return v.name_disease ? v.name_disease : v.name_disease_free
                      }
                    "
                    option-value="id_pet_illness_history"
                    v-model="data.id_pet_illness_history"
                    required
                    :rules="[aahValidations.validationRequired]"
                    label="現疾患・既往歴"
                    show-quick-illness-history
                  />
                </div>
                <div class="col-1 text-center">
                  <q-btn
                    @click="toggleMemoCarteFlgPinned"
                    flat
                    round
                    class=""
                    :style="{ opacity: data.flg_pinned ? 1 : 0.5 }"
                  >
                    <q-icon
                      class="cursor-pointer text-darkred"
                      name="push_pin"
                      size="30px"
                    />
                  </q-btn>
                </div>
              </div>
            </div>
            <q-scroll-area visible class="full-width col memo-content">
              <div
                v-if="!(data.memo_sbj || data.memo_obj || data.memo_ass)"
                class="col row"
              >
                <div class="col column relative-position">
                  <q-editor
                    :toolbar="[
                      ['left', 'center', 'right', 'justify'],
                      ['bold', 'italic', 'strike', 'underline'],
                      ['undo', 'redo'],
                      ['token'],
                      [
                        {
                          label: $q.lang.editor.formatting,
                          icon: $q.iconSet.editor.formatting,
                          list: 'no-icons',
                          options: ['p', 'h2', 'h3', 'h4', 'h5']
                        }
                      ]
                    ]"
                    @paste="onPasteEditor"
                    ref="targetRef"
                    toolbar-bg="primary"
                    toolbar-text-color="white"
                    toolbar-toggle-color="accent-700"
                    class="editor col"
                    :content-class="`bg-${editorBackground}`"
                    :content-style="{
                      backgroundColor:
                        editorBackground.startsWith('#') ||
                        editorBackground.startsWith('rgb')
                          ? editorBackground
                          : ''
                    }"
                    v-model="data.memo_other"
                    @update:model-value="updateBtnLabel"
                  >
                    <template v-slot:token>
                      <q-color
                        @click="colorClicked()"
                        v-model="foreColor"
                        no-header
                        no-footer
                        default-view="palette"
                        :palette="[
                          '#000000',
                          '#FF0000',
                          '#0000FF',
                          '#008000',
                          '#ffff00'
                        ]"
                        unelevated
                        class="q-mt-sm bg-primary color-picker"
                      />
                    </template>
                  </q-editor>
                  <div class="col-auto bg-grey-050 full-width q-px-md q-py-sm">
                    <div
                      class="flex justify-end q-mb-sm caption2 regular text-grey-600"
                      :class="
                        data.memo_other.replace(/<[^>]*>/g, '').length > 2000
                          ? 'text-red'
                          : ''
                      "
                    >
                      {{ data.memo_other.replace(/<[^>]*>/g, '').length }} / 2000
                    </div>
                    <div class="flex justify-between">
                      <div
                        @click.stop="memoCartePrev()"
                        :class="
                          memoCarteIndex != memoCarteList.length - 1
                            ? 'text-blue'
                            : ''
                        "
                        class="cursor-pointer"
                      >
                        前のカルテ
                      </div>
                      <div
                        @click.stop="memoCarteNext()"
                        :class="memoCarteIndex != 0 ? 'text-blue' : ''"
                        class="cursor-pointer"
                      >
                        次のカルテ
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="
                      !data.id_memo_carte && data.id_pet_illness_history?.length > 0
                    "
                    class="absolute-bottom recording-btn bg-primary flex column justify-center items-center cursor-pointer"
                    @click="openRecordingSettingsModal"
                  >
                    <q-img
                      src="@/assets/img/request/dictation_mic.png"
                      fit="none"
                      width="25px"
                      height="25px"
                    />
                    <span class="text-white">新規</span>
                  </div>
                </div>
              </div>
    
              <!-- Show fabric images -->
              <div v-if="fabricImages.length > 0" class="col q-mt-md">
                <div class="row gap-2">
                  <div v-for="(image, index) in fabricImages" class="col-2">
                    <div class="relative-position">
                      <q-img :src="image.file_path" alt="Preview" />
                      <q-badge
                        color="red"
                        floating
                        transparent
                        class="cursor-pointer"
                        @click="onFileRemoved(index)"
                      >
                        <q-icon name="close" />
                      </q-badge>
                    </div>
                  </div>
                </div>
              </div>
            </q-scroll-area>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn
          outline
          class="bg-grey-100 text-grey-800"
          @click="closeModal(false)"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          type="submit"
          :loading="isSubmitting"
          :disable="isSubmitting"
        >
          <span>保存して閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          :loading="isSaving"
          :disable="isSaving"
          @click="submit(false)"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <q-dialog v-model="petCartePdfConfirmationDialog">
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
          @click="generatePetCartePdf('download')"
          v-close-popup
        />
        <q-btn
          label="印刷"
          color="primary"
          @click="generatePetCartePdf('print')"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="メモカルテ テンプレート"
    :options="textTemplatesList"
    :data="data"
    @update:memo="handleUpdateMemo"
  />
</template>

<style lang="scss" scoped>
.color-picker {
  max-width: 20px;
  box-shadow: none;
  border-radius: 0;
}

.q-editor {
  border-radius: 10px;
}

.recording-btn {
  width: 80px;
  height: 80px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}

.editor {
  line-height: 1.7;
  word-break: break-all;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }

  :deep(.q-editor__content) {
    padding: 16px;
  }
}

.seditor {
  line-height: 1.7;

  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }

  :deep(.q-editor__content) {
    padding: 16px;
    height: calc(200px);
  }
}

.header-title {
  flex-wrap: nowrap;
}

:deep(.memo-content) {
  .q-scrollarea__content {
    display: flex;
    flex-direction: column;
  }
}

.memo-carte-header {
  @media screen and (max-width: 1024px) {
    .q-btn{
      padding: 4px 4px;
      :deep(.q-icon) {
        font-size: 16px;
      }
    }
  }
  
  @media screen and (max-width: 768px) {
    .q-btn {
      padding: 4px 0;
      margin-right: 2px;
      :deep(.q-icon) {
        font-size: 12px;
      }
    }

    .q-btn--round {
      min-width: 1.5em;
    }
    
    .q-toolbar__title, :deep(.pet-name), :deep(.pet-kana-name) {
      font-size: 10px !important;
    }
  }
}
</style>
