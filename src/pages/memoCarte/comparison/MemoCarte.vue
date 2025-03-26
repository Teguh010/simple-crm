<script setup lang="ts">
import { computed, onMounted, reactive, ref, Ref } from 'vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import KoekaruServiceUnavailableModal from './KoekaruServiceUnavailableModal.vue'

import {
  changeToggleDropdownNames,
  convertWeightInG,
  formatDateWithTime,
  getDateTimeNow,
  getDateToday,
  isBitSet,
  formatNumberWithDecimals
} from '@/utils/aahUtils'
import { CliCommon, IllnessHistoryType, CarteGroup, ClinicalFile } from '@/types/types'
import useCustomerStore from '@/stores/customers'
import useClinicCommonStore, { useCliCommonStore } from '@/stores/cli-common'
import useClinicStore from '@/stores/clinics'
import useMemoCarteStore from '@/stores/memo-cartes'
import useIllnessHistoryStore from '@/stores/illness-history'
import useTextTemplateStore from '@/stores/text-template'
import useClinicalFilesStore from '@/stores/clinical-files'
import aahValidations from '@/utils/aahValidations'
import { typeBodyWeight, typeCarteConfig, typeMedConditionColor } from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { flatMap, forEach, groupBy, isEqual, sortBy, uniq } from 'lodash'
import usePetBioStore from '@/stores/pet-bios'
import useMedConditionStore from '@/stores/med-conditions'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { useRoute } from 'vue-router'
import selectOptions from '@/utils/selectOptions'

type memoFieldsType = {
  field: string
  name: string
  label: string
}

const route = useRoute()

const customerStore = useCustomerStore()
const clinicCommonStore = useClinicCommonStore()
const clinicStore = useClinicStore()
const illnessHistoryStore = useIllnessHistoryStore()
const textTemplateStore = useTextTemplateStore()
const memoCarteStore = useMemoCarteStore()
const clinicalFilesStore = useClinicalFilesStore()
const cliCommonStore = useCliCommonStore()
const medConditionStore = useMedConditionStore()
const petBioStore = usePetBioStore()
const { getIllnessHistorys, getLeftSideIllnessHistoryList } =
  storeToRefs(illnessHistoryStore)
const { getCliCommonTypeCarteSourceList, getCliCommonTypeMemoCarteList } =
  storeToRefs(cliCommonStore)

const isEdit = ref(false)
const petSelected = ref()
const customerSelected = ref()
const memoFieldsRef = ref([])
const foreColor: Ref<string[]> = ref([
  '#ffff00',
  '#ffff00',
  '#ffff00',
  '#ffff00'
])
const currentFocusedMemo = ref<string>('memo_other'),
  fileInput = ref()
const flgEditorToolbar = ref<boolean>(true)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const clinicFiles = ref([])
const clinicCommonList = ref([]),
  disableCliCommon = ref(false)
const typeCarteConfigList = ref([])
const addTemplateModalFlg = ref(false),
  textTemplatesList = ref([])
const multipleImage = ref([])
const deleteImage = ref([])
const disableClinicalFileBtn = ref(false)
const filePaths = ref([])
const previewImage = ref(false)
const removedConditionData = ref([])
let observer: MutationObserver | null = null
const id_pet_illness_history = ref([]) // Separate ref for reactivity
const currentData = ref()
const data = ref({
  id_pet: '',
  id_request: '',
  id_customer: '',
  id_employee: defaultEmployee,
  datetime_memo_carte: getDateTimeNow(),
  id_pet_illness_history: null,
  id_clinic: Number(localStorage.getItem('id_clinic')) || '',
  memo_sbj: '',
  memo_obj: '',
  memo_ass: '',
  memo_other: '',
  id_cli_common: -1,
  illnessHistoryOptions: null,
  type_input: 2
})

const petBioInfoData = ref({
  id_pet: null,
  id_customer: null,
  val_weight: null,
  type_body_weight: 1,
  val_temperature: null,
  val_respiration_rate: null,
  val_heartbeat_rate: null,
  val_pressure_systolic: null,
  val_pressure_diastolic: null,
  val_pressure_mean_arterial: null,
  val_blood_oxygen_level: null,
  val_blood_carbon_dioxide_level: null,
  id_clinic: localStorage.getItem('id_clinic') || ''
})

const medConditionData = reactive([])

const props = withDefaults(
  defineProps<{
    dateInsert: string
    dataCartes: CarteGroup
    clinicalFile?: ClinicalFile[]
    idPetIllnessHistory?: string
    datetimeInsert: string
    idCustomer: string
    idPet: string
    screenMargin:number
    requestDetailPage?:any
  }>(),
  {
    dateInsert: '',
    dataCartes: {},
    clinicalFile: [],
    idPetIllnessHistory: '',
    datetimeInsert: '',
    idCustomer: '',
    idPet: '',
    screenMargin: 172
  }
)

const memoFields: memoFieldsType[] = [
  { field: 'memo_sbj', name: 'memo_sbj', label: 'S: 主観' },
  { field: 'memo_obj', name: 'memo_obj', label: 'O: 客観' },
  { field: 'memo_ass', name: 'memo_ass', label: 'A: 評価' },
  { field: 'memo_other', name: 'memo_other', label: 'P: 計画他' }
]

const typeMemoCarte = computed(() =>
  getCliCommonTypeCarteSourceList.value.map((v: CliCommon) => ({
    ...v,
    label: v.name_cli_common,
    value: v.id_cli_common
  }))
)
const cliMedCondition = (code_cli_common: string) =>
  getCliCommonTypeMemoCarteList.value.find(
    (v) => v.code_func1 == code_cli_common
  )
const sanitizeInput = (field) => {
  const content = data.value[field]
  // Check if the content is just a <br> or empty
  if (content.trim() === '<br>' || content.trim() === '') {
    data.value[field] = '' // Set to an empty string
  }
}

const onPasteEditor = (event) => {
  event.preventDefault()
  event.stopPropagation()

  // Get plain text from clipboard
  const plainText = event.clipboardData.getData('text/plain')

  // Insert plain text at the current cursor position
  document.execCommand('insertText', false, plainText)
}

const selectDefaultEmployee = () => {
  data.value.id_employee = defaultEmployee
}

const setChildRef = (index) => (el) => {
  if (el) {
    memoFieldsRef.value[index] = el
  } else {
    memoFieldsRef.value.splice(index, 1)
  }
}

const colorClicked = (index) => {
  const edit = memoFieldsRef.value[index]
  edit.runCmd('foreColor', foreColor.value[index])
  edit.focus()
}

const fetchCommonCliRecords = async (code_func1,flg_func1, index: number) => {
  let isCodeCommmonFetched: boolean = false
  if (
    clinicCommonList.value[index] &&
    clinicCommonList.value[index].length > 0
  ) {
    clinicCommonList.value[index].forEach((item) => {
      item.clinicCommonData.forEach((codeCliCommon) => {
        if (codeCliCommon.code_cli_common === code_func1) {
          isCodeCommmonFetched = true
        }
      })
    })
  }
  if (isCodeCommmonFetched) return false
  disableCliCommon.value = true

  if (clinicCommonStore.allCliCommonMedConditionOptionList.length > 0) {
    let group =
      getCliCommonTypeMemoCarteList.value.find((cli) => {
        return cli.code_func1 === code_func1
      }) ?? {}
    let clinicCommonData = [
      ...clinicCommonStore.allCliCommonMedConditionOptionList
        .filter(
          (v) =>
            v.code_cli_common === code_func1 &&
            v.date_start <= getDateToday() &&
            v.date_end >= getDateToday()
        )
        .sort((a, b) => a.display_order - b.display_order)
    ]

    if (!clinicCommonList.value[index]) clinicCommonList.value[index] = []
    clinicCommonList.value[index].push({
      groupName: group.name_cli_common,
      flg_func1: group.flg_func1,
      display_order: group?.display_order || 0,
      clinicCommonData
    })
    clinicCommonList.value[index].sort(
      (a, b) => a.display_order - b.display_order
    )
    if (!medConditionData[index]) medConditionData[index] = []
    medConditionData[index].push({
      memo_record: null,
      code_func1: null,
      text1:null,
      flg_func1:flg_func1,
      code_cli_common: code_func1,
      display_order: group?.display_order || 0
    })
    medConditionData[index].sort((a, b) => a.display_order - b.display_order)
  }
  disableCliCommon.value = false
}

const deleteCliCommonRow = (index, idx, id_med_condition) => {
  clinicCommonList.value[index].splice(idx, 1)
  medConditionData[index].splice(idx, 1)
  removedConditionData.value.push(id_med_condition)
}

const showMemoField = (
  field: 'memo_sbj' | 'memo_obj' | 'memo_ass' | 'memo_other'
) => {
  switch (field) {
    case 'memo_sbj':
      return typeCarteConfigList.value[2]?.isChecked
    case 'memo_obj':
      return typeCarteConfigList.value[3]?.isChecked
    case 'memo_ass':
      return typeCarteConfigList.value[6]?.isChecked
    case 'memo_other':
      return typeCarteConfigList.value[7]?.isChecked
  }
}


const handleUpdateMemo = (value: any) => {
  if (showMemoField(currentFocusedMemo.value))
    data.value[currentFocusedMemo.value] += ' ' + value.replace(/\n/g, '<br>')
}

const handleMedCondition = (cliCodeCommon, index, idx, flg_func1) => {
  medConditionData[index][idx].type_med_condition =
    medConditionData[index][idx].type_med_condition == cliCodeCommon.code_func1
      ? null
      : cliCodeCommon.code_func1
  medConditionData[index][idx].code_cli_common = cliCodeCommon.code_cli_common
  medConditionData[index][idx].flg_func1 = flg_func1
  medConditionData[index][idx].text1 = cliCodeCommon.text1 ?? ''
}

const updateValue = (type) => {
  if (type == 'val_weight')
    petBioInfoData.value.val_weight = petBioInfoData.value.val_weight
      ? parseFloat(petBioInfoData.value.val_weight).toFixed(2)
      : ''
  if (type == 'val_temperature')
    petBioInfoData.value.val_temperature = petBioInfoData.value.val_temperature
      ? parseFloat(petBioInfoData.value.val_temperature).toFixed(1)
      : ''
}

const parseSummary = (summary: string) => {
  const sections = {
    memo_sbj: '', // 主観 (Subjective)
    memo_obj: '', // 客観 (Objective)
    memo_ass: '', // 評価 (Assessment)
    memo_other: '' // 計画他 (Plan)
  }

  // Split summary berdasarkan section
  const sectionTexts = summary.split('<br/><br/>')

  sectionTexts.forEach((section) => {
    // Extract title dan content
    const titleMatch = section.match(/<b>## (.+?)<\/b><br\/>(.+)/)
    if (!titleMatch) return

    const [, title, content] = titleMatch
    const bulletPoints = content
      .split('<br/>')
      .map((text) => `• ${text}`)
      .join('<br/>')

    // Map ke section yang sesuai
    switch (title.trim()) {
      case '主観':
        sections.memo_sbj = `<p><strong>## 要確認</strong></p><p>${bulletPoints}</p><p>---</p>`
        break
      case '客観':
        sections.memo_obj = `<p><strong>## 要確認</strong></p><p>${bulletPoints}</p><p>---</p>`
        break
      case '評価':
        sections.memo_ass = `<p><strong>## 要確認</strong></p><p>${bulletPoints}</p><p>---</p>`
        break
      case '計画他':
        sections.memo_other = `<p><strong>## 要確認</strong></p><p>${bulletPoints}</p><p>---</p>`
        break
    }
  })

  return sections
}

const findTypeMedCondition = (type: any) => {
  const findType = typeMedConditionColor.find((t) => t.value == type)
  return findType
}

const initMedCondition = (medCon, forceUpdate = false) => {
  clinicCommonList.value = groupBy(
    medCon?.map((medical_condition) => {
      let clinicCommonData = [
        ...clinicCommonStore.allCliCommonMedConditionOptionList
          .filter((v) => v.code_cli_common == medical_condition.code_cli_common)
          .sort((a, b) => a.display_order - b.display_order)
      ]

      return {
        ...medical_condition,
        order: medical_condition.flg_func1 ? 0 : 1,
        groupName: cliMedCondition(medical_condition.code_cli_common)
          ?.name_cli_common,
        clinicCommonData
      }
    }),
    'order'
  )

  // Filter the data in clinicCommonList.value
  Object.keys(clinicCommonList.value).forEach((key) => {
    clinicCommonList.value[key] = clinicCommonList.value[key].map((item) => {
      return {
        ...item,
        clinicCommonData: item.clinicCommonData.filter(
          (v) => v.date_start <= getDateToday() && v.date_end >= getDateToday()
        )
      }
    })
  })

  forEach(clinicCommonList.value, (v, index) => {
    forEach(v, (cliCodeCommon, idx) => {
      if (!medConditionData[index]) medConditionData[index] = []
      if (!medConditionData[index][idx] || forceUpdate)
        medConditionData[index][idx] = {
          ...cliCodeCommon,

          type_med_condition: cliCodeCommon.type_med_condition,
          text1: cliCodeCommon.clinicCommonData.find(
            (v) => v.code_func1 == cliCodeCommon.type_med_condition
          )?.text1|| null,
          code_cli_common: cliCodeCommon.code_cli_common,
          flg_func1: cliCodeCommon.flg_func1
        }
    })
  })
}

const updateCarte = async () => {
  if (
    !id_pet_illness_history.value ||
    id_pet_illness_history.value.length === 0
  ) {
    return false
  }

  const datetime = formatDateWithTime(
    data.value.datetime_memo_carte,
    'YYYY/MM/DD HH:mm:ss'
  )

  data.value.id_pet_illness_history = id_pet_illness_history.value
  const petBioPayload = { ...petBioInfoData.value }
  if (petBioPayload.type_body_weight == 1 && petBioPayload.val_weight) {
    petBioPayload.val_weight = petBioPayload.val_weight * 1000
  }

  const checkMemoFields = memoFields
    .map((v) => {
      if (data.value[v.field]) return true
      return false
    })
    .filter((v) => v)
  if (checkMemoFields.length > 0) {
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
  }

    if (petBioPayload.val_weight)
    petBioPayload.val_weight = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_weight)
    )
  if (petBioPayload.val_temperature)
    petBioPayload.val_temperature = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_temperature)
    )
  if (petBioPayload.val_pressure_systolic)
    petBioPayload.val_pressure_systolic = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_pressure_systolic)
    )
  if (petBioPayload.val_pressure_diastolic)
    petBioPayload.val_pressure_diastolic = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_pressure_diastolic)
    )
  if (petBioPayload.val_pressure_mean_arterial)
    petBioPayload.val_pressure_mean_arterial = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_pressure_mean_arterial)
    )
  if (petBioPayload.val_blood_oxygen_level)
    petBioPayload.val_blood_oxygen_level = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_blood_oxygen_level)
    )
  if (petBioPayload.val_blood_carbon_dioxide_level)
    petBioPayload.val_blood_carbon_dioxide_level = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_blood_carbon_dioxide_level)
    )
  if (petBioPayload.val_respiration_rate)
    petBioPayload.val_respiration_rate = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_respiration_rate)
    )
  if (petBioPayload.val_heartbeat_rate)
    petBioPayload.val_heartbeat_rate = formatNumberWithDecimals(
      parseFloat(petBioPayload.val_heartbeat_rate)
    )

  const apiPromises = []
    // MED CONDITION
  if (medConditionData) {
    sortBy(
      flatMap(medConditionData) // UPDATE EXISITING MED CONDITION
        .filter((v) => v && v.id_med_condition),
      'display_order'
    ).forEach((item) => {
      const cliCommonTypeMemoCarte = getCliCommonTypeMemoCarteList.value.find(
        (v) => v.code_func1 == item?.code_cli_common
      )
      const medItems = {
        ...item,
        id_pet: props.idPet,
        id_customer: props.idCustomer,
        id_employee_record: data.value.id_employee,
        datetime_record: datetime,
        display_order: cliCommonTypeMemoCarte?.display_order || 0
      }
      apiPromises.push(
        medConditionStore.updateMedCondition(item.id_med_condition, medItems)
      )
    })

    const newMedCondition = sortBy(
      flatMap(medConditionData) // ADD NEW MED CONDITION
        .filter((v) => v && !v.id_med_condition)
        .map((item) => {
          const cliCommonTypeMemoCarte =
            getCliCommonTypeMemoCarteList.value.find(
              (v) => v.code_func1 == item?.code_cli_common
            )
          return {
            ...item,
            flg_func1: item.flg_func1,
            id_pet: props.idPet,
            id_customer: props.idCustomer,
            id_employee_record: data.value.id_employee,
            datetime_record: datetime,
            datetime_insert: datetime,
            group_carte: props.dataCartes?.memo_carte_list?.[0]?.group_carte,
            display_order: cliCommonTypeMemoCarte?.display_order || 0
          }
        }),
      'display_order'
    )

    if (newMedCondition.length > 0) {
      apiPromises.push(
        memoCarteStore.submitMemoCarteV1({
          med_condition_list: newMedCondition
        })
      )
    }
    if (removedConditionData) {
      removedConditionData.value.forEach((v) => {
        if (v) {
          const payloadSend = data.value.id_employee
          apiPromises.push(
            medConditionStore.destroyMedCondition(v, payloadSend)
          )
        }
      })
      removedConditionData.value = []
    }

    // PET BIO INFO
    if (petBioPayload.id_pet_bio_info) {
      apiPromises.push(
        mtUtils.callApiEx({
          method: selectOptions.reqMethod.PUT,
          url: `/pet_bio_info/${petBioPayload.id_pet_bio_info}`,
          params: {
            ...petBioPayload,
            id_pet: props.idPet,
            id_customer: props.idCustomer,
            datetime_measure: datetime,
            datetime_insert: datetime,
            group_carte: props.dataCartes?.memo_carte_list?.[0]?.group_carte
          },
        })
      )
    } else {
      if (
        petBioPayload.val_weight ||
        petBioPayload.val_temperature ||
        petBioPayload.val_pressure_systolic ||
        petBioPayload.val_pressure_diastolic ||
        petBioPayload.val_pressure_mean_arterial ||
        petBioPayload.val_blood_oxygen_level ||
        petBioPayload.val_blood_carbon_dioxide_level ||
        petBioPayload.val_respiration_rate ||
        petBioPayload.val_heartbeat_rate
      )
        apiPromises.push(
          mtUtils.callApiEx({
            method: selectOptions.reqMethod.POST,
            url: `/pet_bio_info`,
            params: {
              ...petBioPayload,
              id_pet: props.idPet,
              id_customer: props.idCustomer,
              datetime_measure: datetime,
              datetime_insert: datetime,
              group_carte: props.dataCartes?.memo_carte_list?.[0]?.group_carte
            }
          })
        )
    }

    // CLINICAL FILE
    if (multipleImage.value.length > 0) {
      multipleImage.value.forEach((item) => {
        item.datetime_receive = datetime
        item.group_carte = props.dataCartes?.memo_carte_list?.[0]?.group_carte
        if (item.old === undefined || item.old === null || item.old === false) {
          item.old = true
          apiPromises.push(clinicalFilesStore.submitClinicalFile(item))
        }
      })
      currentData.value.multipleImage = multipleImage.value
    }
    if (deleteImage.value?.length > 0) {
      deleteImage.value.forEach((id_clincal_file) => {
        apiPromises.push(
          clinicalFilesStore.destroyClinicalFile(id_clincal_file)
        )
      })
      currentData.value.multipleImage = multipleImage.value
    }
  }

  const response = await mtUtils.promiseAllWithLoaderMsg(
    [
      memoCarteStore.updateMemoCarte(data.value.id_memo_carte, {
        ...data.value
      }),
      ...apiPromises
    ],
    '更新しています...'
  )
  
  if (!response || !(Array.isArray(response))) {
    throw new Error('Failed to update memo carte')
  }
}

const onFileRemoved = (index: number, id_clinical_file: number) => {
  multipleImage.value.splice(index, 1)
  filePaths.value.splice(index, 1)
  deleteImage.value.push(id_clinical_file)
  currentData.value.multipleImage = multipleImage.value
}

const onFileChange = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files

  if (!files?.length) return

  if (files.length) {
    const fileList: File[] = Array.from(files)
    const ALLOWED_TYPES = [
      'image/',
      'video/',
      'audio/',
      'text/csv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    fileList.forEach((file: File) => {
      // Validate file type
      const isAllowedType = ALLOWED_TYPES.some(
        (type) => file.type.startsWith(type) || file.type.includes(type)
      )
      if (!isAllowedType) {
        console.error(
          `File "${file.name}" has an unsupported file type: ${file.type}`
        )
        return
      }

      let payload: any = {
        datetime_receive: formatDateWithTime(
          getDateTimeNow(),
          'YYYY/MM/DD HH:mm:ss'
        ),
        id_pet: props.idPet,
        id_customer: props.idCustomer,
        id_pet_illness_history: data.value.id_pet_illness_history?.[0],
        name_file: file.name,
        file_path: file
      }
      if (file?.type?.startsWith('image/')) {
        payload.type_file = 1
      } else if (file?.type?.startsWith('video/')) {
        payload.type_file = 2
      } else if (
        file?.type?.startsWith('audio/') ||
        file?.type?.includes('/pdf') ||
        file?.type?.includes('text/csv') ||
        file?.type?.includes('/doc') ||
        file?.type?.includes('/docx') ||
        file?.type?.includes('document') ||
        file?.type?.includes('sheet')
      ) {
        payload.type_file = 99
      }

      // Prevent duplicate files in `multipleImage` or `filePaths`
      if (multipleImage.value.some((item) => item?.name_file === file.name)) {
        console.warn(`File "${file.name}" is already added.`)
        return
      }

      previewImage.value = true
      multipleImage.value.push(payload)
      filePaths.value.push(URL.createObjectURL(file))
      return
    })

    // Reset the input to avoid reprocessing the same files
    target.value = ''
  }
}

const updateDatetimeMemoCarte = (val: string) => {
  data.value.datetime_memo_carte = val
}

onMounted(async () => {
  try {
  // SET DEFAULT VAL WEIGHT
  petBioInfoData.value.val_weight = null

  data.value.id_cli_common = typeMemoCarte.value?.[0]?.id_cli_common
  data.value = {
    id_pet: props.dataCartes?.memo_carte_list?.[0]?.id_pet || '',
    id_request: props.dataCartes?.memo_carte_list?.[0]?.id_request || '',
    id_customer: props.dataCartes?.memo_carte_list?.[0]?.id_customer || '',
    id_employee: props.dataCartes?.memo_carte_list?.[0]?.id_employee || defaultEmployee,
    datetime_memo_carte: props.dataCartes?.memo_carte_list?.[0]?.datetime_memo_carte || getDateTimeNow(),
    id_clinic: props.dataCartes?.memo_carte_list?.[0]?.id_clinic || Number(localStorage.getItem('id_clinic')) || '',
    memo_sbj: props.dataCartes?.memo_carte_list?.[0]?.memo_sbj || '',
    memo_obj: props.dataCartes?.memo_carte_list?.[0]?.memo_obj || '',
    memo_ass: props.dataCartes?.memo_carte_list?.[0]?.memo_ass || '',
    memo_other: props.dataCartes?.memo_carte_list?.[0]?.memo_other || '',
    id_cli_common: props.dataCartes?.memo_carte_list?.[0].id_cli_common || -1,
    illnessHistoryOptions: props.dataCartes?.memo_carte_list?.[0]?.illnessHistoryOptions || null,
    type_input: props.dataCartes?.memo_carte_list?.[0]?.type_input || 2,
    id_memo_carte: props.dataCartes?.memo_carte_list?.[0]?.id_memo_carte || -1
  }  

  id_pet_illness_history.value = [
    ...(props.dataCartes?.memo_carte_list?.[0]?.id_pet_illness_history || [])
  ]  
    let val_weight 

    if (props.dataCartes?.pet_bio?.val_weight) {
        val_weight = convertWeightInG(
        props.dataCartes?.pet_bio?.val_weight,
        props.dataCartes?.pet_bio?.type_body_weight
        )  
        if (typeof val_weight == 'string') {
        val_weight = parseFloat(val_weight).toFixed(2)
        }
    }
    petBioInfoData.value = {
      id_pet: props.dataCartes?.pet_bio?.id_pet || null,
      id_customer: props.dataCartes?.pet_bio?.id_customer || null,
      val_weight: val_weight || null,
      type_body_weight: props.dataCartes?.pet_bio?.type_body_weight ?? 1,
      val_temperature: props.dataCartes?.pet_bio?.val_temperature
        ? parseFloat(props.dataCartes?.pet_bio?.val_temperature).toFixed(1)
        : '',
      val_respiration_rate: props.dataCartes?.pet_bio?.val_respiration_rate || null,
      val_heartbeat_rate: props.dataCartes?.pet_bio?.val_heartbeat_rate || null,
      val_pressure_systolic: props.dataCartes?.pet_bio?.val_pressure_systolic || null,
      val_pressure_diastolic: props.dataCartes?.pet_bio?.val_pressure_diastolic || null,
      val_pressure_mean_arterial: props.dataCartes?.pet_bio?.val_pressure_mean_arterial || null,
      val_blood_oxygen_level: props.dataCartes?.pet_bio?.val_blood_oxygen_level || null,
      val_blood_carbon_dioxide_level: props.dataCartes?.pet_bio?.val_blood_carbon_dioxide_level || null,
      id_clinic: props.dataCartes?.pet_bio?.id_clinic || localStorage.getItem('id_clinic') || '',
      id_pet_bio_info: props.dataCartes?.pet_bio?.id_pet_bio_info || null,
      datetime_measure: props.dataCartes?.pet_bio?.datetime_measure
          ? formatDateWithTime(props.dataCartes?.pet_bio?.datetime_measure, 'YYYY/MM/DD HH:mm:ss')
          : ''
    }
    if (props.clinicalFile?.length > 0) {
      props.clinicalFile.forEach((v) => {
        const newClinical = { ...v, old: true }
        multipleImage.value.push(newClinical)
        filePaths.value.push(newClinical.file_path)
      })
    }

      const code_cli_common = props.code_cli_common || [11, 14] 
      if (clinicCommonStore.allCliCommonMedConditionOptionList.length === 0) {
        await clinicCommonStore.fetchMedConditionCliCommonList({
          code_cli_common: code_cli_common
        })
    }

    if (clinicCommonStore.allCliCommonMedConditionOptionList.length > 0) {
        initMedCondition(props?.dataCartes?.medical_condition)
    }

  petSelected.value = customerStore.getPet
  customerSelected.value = customerStore.getCustomer

  const typeCarteConfigVal = clinicStore.getClinic?.type_carte_config
  typeCarteConfigList.value = typeCarteConfig.map((el) => {
    return {
      ...el,
      isChecked: isBitSet(typeCarteConfigVal, el.value)
    }
  })

  if (getIllnessHistorys.value.length === 0){
    await illnessHistoryStore.fetchIllnessHistorys({
      id_pet: data.value.id_pet,
      id_customer: data.value?.id_customer
    })
  }
  // Updating q-editor toolbar names to JP
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

  currentData.value = {
    data: JSON.parse(JSON.stringify(data.value)),
    petBioInfoData: JSON.parse(JSON.stringify(petBioInfoData.value)),
    medConditionData: JSON.parse(JSON.stringify(medConditionData)),
    petSelected: JSON.parse(JSON.stringify(petSelected.value)),
    customerSelected: JSON.parse(JSON.stringify(customerSelected.value)),
    clinicCommonList: JSON.parse(JSON.stringify(clinicCommonList.value)),
    multipleImage: JSON.parse(JSON.stringify(multipleImage.value))
  }
  } catch (error) {
  }
})

defineExpose({
  updateCarte,
  updateDatetimeMemoCarte
})

</script>
<template>
  <q-card-section
    :style="{'height': `calc(100dvh - ${screenMargin}px)`, 'overflow-y': 'auto'}"
  >
    <div
      class="row q-gutter-md"
    >
      <div class="col">
        <div class="row items-center q-gutter-md q-mb-md">
          <div class="col">
            <div class="row items-center q-col-gutter-md">
              <div class="col-3">
                <InputEmployeeOptGroup
                  v-model:selected="data.id_employee"
                  label="記入者"
                  show-select-default-employee
                  ref="employeeRef"
                  @update:select-default-employee="selectDefaultEmployee"
                />
              </div>
              <div class="col-3">
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
                      :style="{ backgroundColor: slotProps.opt.text1 }"
                    >
                      <q-item-section>
                        {{ slotProps.opt.label }}
                      </q-item-section>
                    </q-item>
                  </template>
                </MtFormPullDown>
              </div>
              <div class="col-3">
                <!-- props {{ id_pet_illness_history }}
                  data {{ data.id_pet_illness_history }} -->
                <MtFormMultipleSelection
                  :options="getIllnessHistorys"
                  :option-label="
                      (v: IllnessHistoryType): string => {
                        return v.name_disease ? v.name_disease : v.name_disease_free
                      }
                    "
                  option-value="id_pet_illness_history"
                  v-model="id_pet_illness_history"
                  required
                  :rules="[aahValidations.validationRequired]"
                  label="現疾患・既往歴"
                  show-quick-illness-history
                />
              </div>
            </div>
          </div>
        </div>
        <div v-if="typeCarteConfigList[0]?.isChecked">
          <h6>生体情報</h6>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-3 col-md-3 col-sm-6">
              <MtFormInputNumber
                label="体重"
                decimalSize="2"
                v-model:value="petBioInfoData.val_weight"
                @blur="updateValue('val_weight')"
              />
            </div>
            <div class="col-lg-3 col-md-3 col-sm-6">
              <MtInputForm
                type="radio"
                :items="typeBodyWeight"
                v-model="petBioInfoData.type_body_weight"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <template
            v-if="
              typeCarteConfigList[0]?.isChecked ||
              typeCarteConfigList[1]?.isChecked
            "
          >
            <div class="col-lg-3 col-md-3 col-sm-6 field-right-text temp">
              <MtFormInputNumber
                label="体温 T"
                decimalSize="1"
                v-model:value="petBioInfoData.val_temperature"
                @blur="updateValue('val_temperature')"
              />
            </div>
          </template>
          <div
            class="col-lg-3 col-md-3 col-sm-6 field-right-text bpm"
            v-if="typeCarteConfigList[1]?.isChecked"
          >
            <MtFormInputNumber
              mode="number"
              label="心拍 P"
              v-model:value="petBioInfoData.val_heartbeat_rate"
            />
          </div>
          <template
            v-if="
              typeCarteConfigList[0]?.isChecked ||
              typeCarteConfigList[1]?.isChecked
            "
          >
            <div
              class="col-lg-3 col-md-3 col-sm-6 field-right-text respiration-amount"
            >
              <MtFormInputNumber
                mode="number"
                label="呼吸数 R"
                v-model:value="petBioInfoData.val_respiration_rate"
              />
            </div>
          </template>
        </div>
        <!-- <template v-if="typeCarteConfigList[1]?.isChecked">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-3 col-md-3 col-sm-6 field-right-text mmHg">
              <MtFormInputNumber
                mode="dosage"
                label="収縮期血圧"
                decimalSize="1"
                v-model:value="petBioInfoData.val_pressure_systolic"
              />
            </div>
            <div class="col-lg-3 col-md-3 col-sm-6 field-right-text mmHg">
              <MtFormInputNumber
                mode="dosage"
                label="拡張期血圧"
                decimalSize="1"
                v-model:value="petBioInfoData.val_pressure_diastolic"
              />
            </div>
            <div class="col-lg-3 col-md-3 col-sm-6 field-right-text mmHg">
              <MtFormInputNumber
                mode="dosage"
                label="平均動脈圧"
                decimalSize="1"
                v-model:value="petBioInfoData.val_pressure_mean_arterial"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div
              class="col-lg-3 col-md-3 col-sm-6 field-right-text blood-percent"
            >
              <MtFormInputNumber
                mode="dosage"
                label="血中酸素濃度"
                decimalSize="1"
                v-model:value="petBioInfoData.val_blood_oxygen_level"
              />
            </div>
            <div
              class="col-lg-3 col-md-3 col-sm-6 field-right-text blood-percent"
            >
              <MtFormInputNumber
                mode="dosage"
                label="血中二酸化炭素濃度"
                decimalSize="1"
                v-model:value="petBioInfoData.val_blood_carbon_dioxide_level"
              />
            </div>
          </div>
        </template> -->
        <!-- <div class="q-mb-md" v-if="typeCarteConfigList[4]?.isChecked">
          <h6>診療所見</h6>
          
        </div> -->
        <div class="row">
          <h6>メモカルテ</h6>
          <div class="col relative-position">
            <q-toggle
              label="ツールバー"
              class="q-mt-sm"
              v-model="flgEditorToolbar"
              color="primary"
            />
          </div>
        </div>
        <div class="row">
          <div class="col relative-position">
            <template v-for="(memo, index) in memoFields" :key="memo.field">
              <template v-if="showMemoField(memo.field)">
                <div
                  :class="index !== 0 ? 'q-mt-md' : ''"
                  class="text-weight-bold q-mb-sm"
                >
                  {{ memo.label }}
                </div>
                <div class="q-my-md">
                  <template
                    v-if="index === 0 || index === 1"
                    v-for="cliCodeCommon in getCliCommonTypeMemoCarteList.filter(
                      (v) => {
                        if (index === 0) {
                          return v.flg_func1
                        }
                        return !v.flg_func1
                      }
                    )"
                    :key="cliCodeCommon.id_cli_common"
                  >
                    <q-btn
                      color="primary"
                      :label="cliCodeCommon.name_cli_common"
                      :disable="disableCliCommon"
                      class="q-mr-md"
                      @click="
                        fetchCommonCliRecords(cliCodeCommon.code_func1,cliCodeCommon.flg_func1, index)
                      "
                    />
                  </template>
                </div>
                <template
                  v-if="(index === 0 || index === 1) && clinicCommonList[index]"
                  v-for="(codeCommonList, idx) in clinicCommonList[index]"
                  :key="idx"
                >
                  <div
                    class="row no-wrap items-center"
                    :class="idx !== 0 ? 'q-mt-md' : ''"
                  >
                    <div class="col-auto">
                      <div
                        class="field-label-free-color-small bg-grey-300 text-black q-pb-xs"
                      >
                        {{ codeCommonList.groupName }}
                      </div>
                    </div>
                    <div class="col">
                      <q-btn-group
                        outline
                        spread
                        class="btn-options items-center"
                      >
                        <template
                          v-for="cliCodeCommon in codeCommonList.clinicCommonData"
                          :key="cliCodeCommon.id_cli_common"
                        >
                          <q-btn
                            :outline="
                              medConditionData[index][idx].type_med_condition !=
                              cliCodeCommon.code_func1
                            "
                            :label="cliCodeCommon.name_cli_common"
                            :class="
                              medConditionData[index][idx].type_med_condition ==
                              cliCodeCommon.code_func1
                                ? 'btn-border'
                                : ''
                            "
                            @click="
                              handleMedCondition(
                                cliCodeCommon,
                                index,
                                idx,
                                codeCommonList.flg_func1
                              )
                            "
                            :style="{
                              backgroundColor:
                                medConditionData[index][idx]
                                  .type_med_condition ==
                                cliCodeCommon.code_func1
                                  ? findTypeMedCondition(
                                      medConditionData[index][idx].text1
                                    )?.backgroundColor || '#e0e0e0'
                                  : '#e0e0e0',
                              color:
                                medConditionData[index][idx]
                                  .type_med_condition ==
                                cliCodeCommon.code_func1
                                  ? findTypeMedCondition(
                                      medConditionData[index][idx].text1
                                    )?.color
                                  : ''
                            }"
                          />
                        </template>
                      </q-btn-group>
                    </div>
                    <div class="col-5 flex items-center">
                      <MtInputForm
                        type="text"
                        class="q-mx-lg"
                        label="補足メモ・所見"
                        autogrow
                        style="flex: 1"
                        v-model="medConditionData[index][idx].memo_record"
                      />
                      <q-icon
                        name="highlight_off"
                        size="20px"
                        color="red"
                        class="cursor-pointer"
                        @click="
                          deleteCliCommonRow(
                            index,
                            idx,
                            medConditionData[index][idx].id_med_condition
                          )
                        "
                      />
                    </div>
                  </div>
                </template>

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
                  :ref="setChildRef(index)"
                  toolbar-bg="primary"
                  toolbar-text-color="white"
                  toolbar-toggle-color="accent-700"
                  class="editor q-mt-md"
                  :class="[!flgEditorToolbar ? 'hide-toolbar' : '']"
                  v-model="data[memo.field]"
                  @focus="currentFocusedMemo = memo.field"
                  @input="sanitizeInput(memo.field)"
                >
                  <template v-slot:token>
                    <q-color
                      @click="colorClicked(index)"
                      v-model="foreColor[index]"
                      no-header
                      no-footer
                      default-view="palette"
                      :palette="[
                        '#000000',
                        '#FF0000',
                        '#0000FF',
                        '#008000',
                        '#505050'
                      ]"
                      unelevated
                      class="q-mt-sm bg-primary color-picker"
                    />
                  </template>
                </q-editor>
                <div
                  :class="
                    data[memo.field]?.replace(/<[^>]*>/g, '').length > 2000
                      ? 'text-red'
                      : ''
                  "
                  class="flex justify-end q-mb-sm caption2 regular text-grey-600"
                >
                  {{ data[memo.field]?.replace(/<[^>]*>/g, '').length }} / 2000
                </div>
              </template>
            </template>
          </div>
        </div>
        <div class="row q-mt-md" v-if="typeCarteConfigList[8]?.isChecked">
          <q-btn
            @click="$refs.fileInput.click()"
            unelevated
            color="grey-300"
            text-color="grey-800"
            class="q-pa-xl"
            :disable="disableClinicalFileBtn"
          >
            <q-icon name="add" size="90px" />
          </q-btn>
          <input
            type="file"
            style="display: none"
            ref="fileInput"
            multiple
            @change="onFileChange($event)"
          />
          <div class="flex items-center" style="gap: 20px">
            <template v-for="(file, index) in multipleImage" :key="index">
              <!-- other file type -->
              <div
                class="relative-position"
                v-if="file && file?.type_file && file.type_file == 99"
              >
                <div>
                  <q-icon
                    name="receipt_long"
                    color="red"
                    size="20px"
                    class="q-mr-sm"
                  />{{ file.name_file }}
                </div>
                <q-badge
                  color="red"
                  floating
                  transparent
                  class="cursor-pointer"
                  @click="onFileRemoved(index, file.id_clinical_file)"
                >
                  <q-icon name="close" />
                </q-badge>
              </div>
              <!-- video file type -->
              <div
                class="relative-position"
                v-else-if="file && file?.type_file && file.type_file == 2"
              >
                <video style="max-width: 350px" controls>
                  <source :src="file.file_path" type="video/mp4" />
                </video>

                <q-badge
                  color="red"
                  floating
                  transparent
                  class="cursor-pointer"
                  @click="onFileRemoved(index, file.id_clinical_file)"
                >
                  <q-icon name="close" />
                </q-badge>
              </div>
              <!-- image file type -->
              <div class="relative-position" v-else>
                <img
                  :src="filePaths[index]"
                  spinner-color="white"
                  class="q-ml-md"
                  :style="{
                    backgroundColor: 'gray',
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover'
                  }"
                />
                <q-badge
                  color="red"
                  floating
                  transparent
                  class="cursor-pointer"
                  @click="onFileRemoved(index, file.id_clinical_file)"
                >
                  <q-icon name="close" />
                </q-badge>  
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </q-card-section>
  <!-- </div> -->

</template>
<style lang="scss" scoped>
.temp::after {
  content: '℃';
}
.mmHg::after {
  content: 'mmHg';
}
.blood-percent::after {
  content: '%';
}
.respiration-amount::after {
  content: '回/分';
}
.bpm::after {
  content: '回/分 (bpm)';
}
:deep(.q-editor__content) {
  padding: 16px;
}
.editor {
  line-height: 1.7;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }
}
.hide-toolbar {
  :deep(.q-editor__toolbars-container) {
    display: none;
  }
}
.btn-border {
  border-top: 1px solid #9e9e9e;
  border-bottom: 1px solid #9e9e9e;
  border-right: 1px solid #9e9e9e;
  .q-btn--outline:first-child:before {
    border-left: 1px solid #9e9e9e;
  }
}
.btn-options {
  border-radius: 20px;
  .q-btn--outline:before {
    border: 1px solid #9e9e9e;
  }
  .q-btn--outline:not(:first-child):before {
    border-left: 0;
  }
}
</style>
