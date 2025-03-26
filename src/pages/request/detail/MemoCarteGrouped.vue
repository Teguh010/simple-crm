<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onUnmounted,
  ref
} from 'vue'
import { storeToRefs } from 'pinia'
// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import aahMessages from '@/utils/aahMessages'
import {
  convertWeightInG,
  dateFormat,
  formatDate,
  formatDateWithTime,
  parseForlinks,
  roundZeroAfterPoint,
  searchWithHighlight
} from '@/utils/aahUtils'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import useCliCommonStore from '@/stores/cli-common'
import useCommonStore from '@/stores/common'
import useServiceDetailStore from '@/stores/service-details'

// Assets
import fileLogo from '@/assets/img/clinicalFiles/file.png'

// Types
import {
  CliCommon,
  Common,
  CustomerType,
  MedCondition,
  MemoCarteType,
  ClinicalFile,
  PetType,
  RequestDetailPageType
} from '@/types/types'

// Lazy-loaded Components
const UpdateClinicalFileModal = defineAsyncComponent(() => import('@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue'))
const GetPdfLabResultComparison = defineAsyncComponent(() => import('@/pages/labResult/GetPdfLabResultComparison.vue'))
const UpdateServiceDetailModal = defineAsyncComponent(() => import('@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'))
const UpdateMemoCarteModal = defineAsyncComponent(() => import('@/pages/memoCarte/UpdateMemoCarteModal.vue'))
const UpdateMedConditionModal = defineAsyncComponent(() => import('@/pages/medCondition/UpdateMedConditionModal.vue'))
const CreateMemoCarteModalV1 = defineAsyncComponent(() => import('@/pages/memoCarte/CreateMemoCarteModal.vue'))
const VerifySummary = defineAsyncComponent(() => import('@/pages/memoCarte/confirmation/VerifySummary.vue'))
const UnverifySummary = defineAsyncComponent(() => import('@/pages/memoCarte/confirmation/UnverifySummary.vue'))
const ViewLabResultModal = defineAsyncComponent(() => import('@/components/lab/ViewLabResultModal.vue'))


const props = withDefaults(
  defineProps<{
    id: string
    data: object
    date: string
    id_customer: string
    id_pet?: string
    show_lab_result: boolean
    show_clinical_file: boolean
    clinical_file: Array<ClinicalFile>
  }>(),
  {
    id: '',
    data: {},
    date: '',
    id_customer: '',
    id_pet: '',
    show_lab_result: true,
    show_clinical_file: true,
    clinical_file: [] as Array<ClinicalFile>
  }
)
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const serviceDetailStore = useServiceDetailStore()

const {
  getAllCliCommonMedConditionOptionList,
  getCliCommonOptionList,
  getCliCommonTypeMemoCarteList,
  getCliCommonTypeCarteSourceList
} = storeToRefs(cliCommonStore)

const emit = defineEmits(['onCloseModal'])
const scrollAreaRef = ref()
const memoCarteSearch = ref<string[]>([])
const isSearchExpanded = ref(false)
const typeSource = ref<number | null>(null)
const pdfConfirmationDialog = ref(false)
const labResultSelected = ref([])

const showV1 = ref(true)

const defaultLRColumn = [
  { name: 'name_lab', label: '項目', field: 'name_lab', align: 'left', width: '50%' },
  { name: 'name_unit_result', label: '単位', field: 'name_unit_result', align: 'center', width: '25%' },
  { name: 'range', label: '基準値', field: 'range', align: 'center', width: '25%' }
]

const typeMemoCarte = computed(
  () => getCliCommonTypeCarteSourceList.value.filter((v: CliCommon) => v.code_cli_common == 11).map((v: CliCommon) => ({
    ...v,
    label: v.name_cli_common,
    value: v.id_cli_common
  }))
)

const typeLabUnitName = (value: number) => commonStore.getCommonUnitOptionList.find((item: Common) => item.id_common === value)?.name_common

const illnessHistoryName = (value: any) => {
  if (value && value.length > 0)
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
  return value
}

const fetchMemoCarteList = async () => {
  let payload: any = {
    id_pet: props!.id_pet,
    id_customer: props.id_customer
  }
  await Promise.all([memoCarteStore.fetchMemoCarteV1(payload)])
}
const createMemoCarteModal = async (openV1Version: boolean = false) => {
  if (!props.id_pet) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  memoCarteStore.selectMemoCarte(null)
  await mtUtils.popup(!openV1Version ? UpdateMemoCarteModal : CreateMemoCarteModalV1, {
    id_request: props.id,
    // number_request: props?.requestDetailPage?.number_request ?? '',
    id_customer: props.id_customer.toString(),
    id_pet: props.id_pet.toString(),
    id_pet_illness_history:
      illnessHistoryStore.getIllnessHistory?.id_pet_illness_history.toString()
  }, !openV1Version)
}
const medConditionModal = async (med_condition: MedCondition) => {
  await mtUtils.smallPopup(UpdateMedConditionModal, {
    med_condition,
    id_customer: props.id_customer.toString(),
    id_pet: props.id_pet.toString(),
    callBackRefresh: () => fetchMemoCarteList()
  })
}
const memoCarteModal = async (memo_carte: MemoCarteType) => {
  memoCarteStore.selectMemoCarte(memo_carte.id_memo_carte)
  let updatedFlg = { value: false }
  await mtUtils.popup(UpdateMemoCarteModal, {
    id_request: props.id,
    id_memo_carte: memo_carte.id_memo_carte,
    id_customer: props.id_customer.toString(),
    id_pet: props.id_pet.toString(),
    data: memo_carte,
    // requestDetailPage: props.requestDetailPage,
    callBackRefresh: () => fetchMemoCarteList(),
    updatedFlg
  }, true)
  await emit('onCloseModal')
  if (updatedFlg.value) {
    createMemoCarteModal()
  }

}
const memoCarteGroupModalOpen = async (date_insert: string, data_cartes: object) => {
  if (!props.id_pet) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  memoCarteStore.selectMemoCarte(null)
  await mtUtils.popup(CreateMemoCarteModalV1, {
    id_request: props.id,
    date_insert,
    data_cartes,
    clinical_file: props.clinical_file || [],
    // number_request: props?.requestDetailPage?.number_request ?? '',
    id_customer: props.id_customer.toString(),
    id_pet: props.id_pet.toString(),
    id_pet_illness_history:
      illnessHistoryStore.getIllnessHistory?.id_pet_illness_history.toString(),
    callBackRefresh: () => fetchMemoCarteList(),
  })
  await emit('onCloseModal')
}
const codeCommonList = (code_cli_common: number) => {
  return getAllCliCommonMedConditionOptionList.value.filter((v: CliCommon) => v.code_cli_common == code_cli_common)
}
const getMedConditionName = (code_cli_common: number, code_func1: number) => getAllCliCommonMedConditionOptionList.value.find((v: CliCommon) => v.code_cli_common == code_cli_common && v.code_func1 == code_func1)?.name_cli_common

const openVerifyUnverifyModal = async (memoCarte: MemoCarteType) => {
  let popup: {
    isConfirmed: boolean
  } = {
    isConfirmed: false
  }
  let memoCartePayload = {
    ...memoCarte,
    datetime_memo_carte: memoCarte.datetime_memo_carte.includes('T') ? memoCarte.datetime_memo_carte.split('T').join(' ') : memoCarte.datetime_memo_carte
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

const onClickFileClinic = async (data: Object, i: Number, date_insert: string) => {
  const video = document.getElementById(`cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  await mtUtils.popup(UpdateClinicalFileModal, {
    data,
    allData: props.data?.clinical_file_list
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

const openLabResultDetailModal = async (item) => {
  await mtUtils.popup(ViewLabResultModal, {
    id_lab_result: item.id_lab_result,
    // request: props?.requestDetailPage,
    id_pet_illness_history: item.id_pet_illness_history,
  }, true)
  event_bus.emit('reloadRight', true)
}

const showValResult = (lab_result) => {
  if (lab_result.val_result) {
    const v1 = lab_result.val_result?.toString()?.replace(',','')
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
    scrollAreaRef.value?.setScrollPosition('vertical', 0, 100)
    return
  }
}

const openLabResultMultiModal = async (row) => {
  await mtUtils.popup(GetPdfLabResultComparison, {
    data: row,
    isSingle: true
  })
}

const togglePdfConfirmation = (value: Array<object>) => {
  labResultSelected.value = []
  pdfConfirmationDialog.value = !pdfConfirmationDialog.value
  labResultSelected.value = value
}

const openServiceDetail = async (id_service_detail: string) => {
  serviceDetailStore.fetchServiceDetailById(id_service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
}

const showHTMLDataV1 = (memoCarte: any) => {
  let tempHTML = ''

  if (memoCarte && memoCarte.memo_sbj) {
    tempHTML += (memoCarte.memo_obj || memoCarte.memo_ass || memoCarte.memo_other ? '<b>S: 主観</b><br>' : '') + memoCarte.memo_sbj + '<br> <br>'
  }

  if (memoCarte && memoCarte.memo_obj) {
    tempHTML += '<b>O: 客観</b><br>' + memoCarte.memo_obj + '<br> <br>'
  }

  if (memoCarte && memoCarte.memo_ass) {
    tempHTML += '<b>A: 評価</b><br>' + memoCarte.memo_ass + '<br> <br>'
  }

  if (memoCarte && memoCarte.memo_other && !(memoCarte.memo_sbj || memoCarte.memo_obj || memoCarte.memo_ass)) {
    tempHTML +=  memoCarte.memo_other
  } else {
    tempHTML += '<b>P: 計画他</b><br>' + memoCarte.memo_other + '<br> <br>'
  }

  return generateHTMLParser(tempHTML)
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
const getMemoCarteCliCommonFunc = (value: number) => {
  const cli = getCliCommonOptionList.value.find((v: CliCommon) => v.id_cli_common == value)
  if (cli) return cli.code_func1
  else return 0
}
const getMemoCarteBgColor = (memoCarte: any) => {
  const cli = getCliCommonOptionList.value.find((v: CliCommon) => v.id_cli_common == memoCarte?.id_cli_common)
  if (cli) return cli.text1
  else return 'memo-carte'
}
const getMemoCartelabel = (id_cli_common: any) => {
  const cli = getCliCommonOptionList.value.find((v: CliCommon) => v.id_cli_common == id_cli_common)
  if (cli) return cli.name_cli_common
  else return 'memo-carte'
}
const cliCommonName = (code_func1: number | string) => getCliCommonTypeMemoCarteList.value.find((v: CliCommon) => v.code_func1 == code_func1)?.name_cli_common

event_bus.on('searchMemoCarte', () => {
  searchMemoCarte()
})
onUnmounted(() => {
  event_bus.off('searchMemoCarte')
})

const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
}

const getUniqueSetOfCarte = (labResult: any) => {
  return Object.values(
    labResult.reduce((acc, current) => {
      const labId = current.lab?.id_lab

      if (!acc[labId] || acc[labId].id_lab_result < current.id_lab_result) {
        acc[labId] = current
      }

      return acc
    }, {})
  ).sort((a, b) => a.display_order - b.display_order)
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
  ];

  return !requiredFields.some(field => memoCarte?.[field]);
};
</script>
<template>
  <!-- THIS DIV IS FOR GROUPED CARTES -->
  <div
    v-if="props.data.grouped_cartes || props.data.type_carte == 2"
  >
    <div 
      class="memo-title q-mb-md q-pa-md cursor-pointer bg-memo-carte"
      :class="getMemoCarteBgColor(props.data?.memo_carte_list?.[0]) ? `bg-${getMemoCarteBgColor(props.data?.memo_carte_list?.[0])} ` : ' ' + hideMemoCarte(props.data?.memo_carte_list?.[0]) ? 'hidden ': ' '"
      :style="{ backgroundColor: getMemoCarteBgColor(props.data?.memo_carte_list?.[0])}"
      @click.stop="memoCarteGroupModalOpen(props.date, props.data)"
    >
      <div class="flex items-center">
        <strong class="letter-space-050">
          {{ formatDate(props.date) }}
        </strong>
        <template v-if="props.data?.memo_carte_list.length > 0">
          <small
            v-if="getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) != 5 && getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) !== null"
            :class="{
            'bg-green text-grey-100 q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) == 1,
            'bg-grey-600 text-grey-100 q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) == 2,
            'bg-blue-800 text-white q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) == 6,
            'chip-purple text-white q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) == 10,
            'bg-pink-700 text-white q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common) == 15
          }"
          >
            {{
              typeMemoCarte.find((v) => v.value === getMemoCarteCliCommonFunc(props.data?.memo_carte_list?.[0].id_cli_common))
                ?.label
            }}
          </small>
          <small class="text-grey-600 q-ml-md q-mr-xs">対象診察 :</small>
          {{ illnessHistoryName(props.data?.memo_carte_list?.[0]?.id_pet_illness_history) }}
          <template v-if="props.data?.memo_carte_list?.[0].type_input === 1">
            <div
              class="row bg-white cursor-pointer q-px-md q-py-xs q-ml-xl memo_ai"
              @click.stop="openVerifyUnverifyModal(props.data?.memo_carte_list?.[0])"
            >
              <img
                v-if="props.data?.memo_carte_list?.[0].flg_verified"
                class="verify-img q-mr-sm"
                height="26"
                src="@/assets/img/aiVetty/verify_confirm.png"
                width="25"
              />
              <span class="text-grey-600">AIカルテ</span>
              <div
                :class="
                props.data?.memo_carte_list?.[0].flg_verified
                  ? 'verify-status text-blue'
                  : 'unverify-status'
              "
                class="status q-pl-sm"
              >
                {{
                  props.data?.memo_carte_list?.[0].flg_verified ? 'レビュー済' : '確認してください！'
                }}
              </div>
            </div>
          </template>
          <small class="text-grey-600 q-ml-auto q-mr-xs">{{ getMemoCartelabel(props.data?.memo_carte_list?.[0].id_cli_common)}}</small>
        </template>
      </div>

      <div v-if="props.data?.pet_bio" class="q-mt-md">
        <b class="q-mb-sm">生体情報</b>
        <div class="row">
          <div v-if="props.data?.pet_bio?.val_weight" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">体重</span>
            <span class="pet-bio-info-option">{{
              parseFloat(convertWeightInG(props.data?.pet_bio?.val_weight, props.data?.pet_bio?.type_body_weight))?.toFixed(2)
            }}
          </span>
          <span class="pet-bio-info-unit">{{ props.data?.pet_bio?.type_body_weight == 1 ? 'kg' : 'g'}}</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_temperature" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">体温 T</span>
            <span class="pet-bio-info-option">{{ parseFloat(props.data?.pet_bio?.val_temperature)?.toFixed(1) }}
            </span>
            <span class="pet-bio-info-unit">℃</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_heartbeat_rate" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">心拍 P</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_heartbeat_rate) }}
            </span>
            <span class="pet-bio-info-unit">回/分 (bpm)</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_respiration_rate" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">呼吸数 R</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_respiration_rate) }}
            </span>
            <span class="pet-bio-info-unit">回/分</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_pressure_systolic" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">収縮期血圧</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_pressure_systolic) }}
            </span>
            <span class="pet-bio-info-unit">mmHg</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_pressure_diastolic" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">拡張期血圧</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_pressure_diastolic) }}
            </span>
            <span class="pet-bio-info-unit">mmHg</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_pressure_mean_arterial" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">平均動脈圧</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_pressure_mean_arterial) }}
            </span>
            <span class="pet-bio-info-unit">mmHg</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_blood_oxygen_level" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">SpO2</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_blood_oxygen_level) }}
            </span>
            <span class="pet-bio-info-unit">%</span>
          </div>
          <div v-if="props.data?.pet_bio?.val_blood_carbon_dioxide_level" class="col-6 q-mb-xs">
            <span class="pet-bio-info-label">pCO2</span>
            <span class="pet-bio-info-option">{{ roundZeroAfterPoint(props.data?.pet_bio?.val_blood_carbon_dioxide_level) }}
            </span>
            <span class="pet-bio-info-unit">mmHg</span>
          </div>
        </div>
      </div>

      <div
        v-if="
          props.data?.memo_carte_list?.[0]?.memo_sbj ||
          props.data?.memo_carte_list?.[0]?.memo_obj ||
          props.data?.memo_carte_list?.[0]?.memo_ass ||
          props.data?.memo_carte_list?.[0]?.memo_other ||
          props.data?.medical_condition.length > 0
        "
        :key="`${props.date}-${index}`"
        class="q-mt-sm"
      >
        <div
          v-if="
            props.data?.memo_carte_list?.[0]?.memo_sbj || 
            props.data?.medical_condition.filter((v) => v.flg_func1).length > 0
          "
          class="q-mt-md"          
        >
          <b>S: 主観</b>
        </div>                
        <template v-if="props.data?.memo_carte_list?.[0]?.memo_sbj || 
          props.data?.medical_condition.filter((v) => v.flg_func1)">
          <div v-for="medCondition in props.data?.medical_condition.filter((v) => v.flg_func1)" class="flex">
            <template v-if="medCondition?.code_cli_common">
              <div class="flex">
                <span class="med-condition-label">{{ cliCommonName(medCondition?.code_cli_common) }}</span> 
                <span class="med-condition-option">{{ getMedConditionName(medCondition?.code_cli_common, medCondition.type_med_condition) }}</span>
              </div>

              <div v-if="medCondition?.memo_record" class="body2 regular q-ml-sm q-pb-sm">
                {{ medCondition?.memo_record }}
              </div>
            </template>
          </div>
        </template>
        <div 
          v-html="showHTMLDataV1Specific(props.data?.memo_carte_list?.[0]?.memo_sbj)"
          class="q-mt-xs q-pb-xs"></div>

        <div 
          v-if="
              props.data?.memo_carte_list?.[0]?.memo_obj || 
              props.data?.medical_condition.filter((v) => !v.flg_func1).length > 0
            "
          class="q-mt-md"
        >
          <b>O: 客観</b>
        </div>
        <template v-if="props.data?.memo_carte_list?.[0]?.memo_obj || 
          props.data?.medical_condition.filter((v) => !v.flg_func1)">
          <div v-for="medCondition in props.data?.medical_condition.filter((v) => !v.flg_func1)" class="flex">
            <template v-if="medCondition?.code_cli_common">
              <div class="flex">
                <span class="med-condition-label ">{{ cliCommonName(medCondition?.code_cli_common) }}</span>
                <span class="med-condition-option ">{{ getMedConditionName(medCondition?.code_cli_common, medCondition.type_med_condition) }}</span>
              </div>

              <div v-if="medCondition?.memo_record" class="body2 regular q-ml-sm q-pb-sm">
                {{ medCondition?.memo_record }}aa
              </div>
            </template>
          </div>
        </template>
        <div v-html="showHTMLDataV1Specific(props.data?.memo_carte_list?.[0]?.memo_obj)"
        class="q-mt-xs q-pb-xs"></div>

        <div 
          v-if="props.data?.memo_carte_list?.[0]?.memo_ass"
          class="q-mt-md">
          <b >A: 評価</b>
        </div>
        <div
          v-html="showHTMLDataV1Specific(props.data?.memo_carte_list?.[0]?.memo_ass)"
          class="q-pb-xs"></div>
        <div
        v-if="props.data?.memo_carte_list?.[0]?.memo_other"
        class="q-mt-md">
          <b>P: 計画他</b>
        </div>
        <div
          v-html="showHTMLDataV1Specific(props.data?.memo_carte_list?.[0]?.memo_other)"
          class="q-pb-xs"></div>
      </div>
    </div>
  </div>

  <!-- IF CARTES IS NOT GROUPED -->
  <template v-else>
    <!-- THIS DIV IS FOR MEMO_CARTE -->
    <div
      v-for="(memoCarte, index) in props.data?.memo_carte_list"
      :key="`${props.date}-${index}`"
      :class="getMemoCarteBgColor(memoCarte) ? `bg-${getMemoCarteBgColor(memoCarte)} ` : ' ' + hideMemoCarte(memoCarte) ? 'hidden ': ' '"
      :style="{ backgroundColor: getMemoCarteBgColor(memoCarte)}"
      class="memo-title q-mb-md q-pa-md cursor-pointer"
      @click.stop="memoCarteModal(memoCarte)"
    >
      <div class="flex items-center">
        <strong class="letter-space-050">{{
            formatDate(memoCarte?.datetime_memo_carte)
          }}</strong>
        <small
          v-if="getMemoCarteCliCommonFunc(memoCarte.id_cli_common) != 5 && getMemoCarteCliCommonFunc(memoCarte.id_cli_common) !== null"
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
            typeMemoCarte.find((v) => v.value === getMemoCarteCliCommonFunc(memoCarte.id_cli_common))
              ?.label
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
                memoCarte.flg_verified ? 'レビュー済' : '確認してください！'
              }}
            </div>
          </div>
        </template>
        <small class="text-grey-600 q-ml-auto">{{ getMemoCartelabel(memoCarte.id_cli_common) }}</small>
      </div>
      <div
        class="q-mt-md q-mb-lx"
        v-html="showHTMLDataV1(memoCarte)"
      ></div>
    </div>

    <!-- THIS DIV IS FOR LAB RESULT -->
    <template v-if="props.data?.lab_result_list && props.show_lab_result">
      <template v-for="device in props.data?.lab_result_list">
        <template v-for="dates in device">
          <div v-for="(lab_result, datetime_registered) in dates">
            <div
              class="bg-white memo-title q-my-md q-pa-md cursor-pointer"
              @click="openLabResultDetailModal(lab_result?.[0])"
            >
              <q-table
                :columns="[...defaultLRColumn, { name: 'date', label: formatDateWithTime(datetime_registered, 'YY/MM/DD HH時'), date: datetime_registered, field: 'date', align: 'center', colspan: '2' }]"
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
                <template v-slot:body-cell="{ row, col }">
                  <q-td
                    :width="col.width"
                    :class="col.field === 'date' ? 'cursor-pointer' : ''"
                  >
                    <div key="memo_internal">
                      <div
                        v-if="col.field === 'date'"
                      >
                        <div class="row">
                          <div class="col-6 text-center q-br">
                            {{ row.qualifier }}
                          </div>
                          <div class="col-6 text-center">
                            <div
                              v-html="showValResult(row)"
                            />
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'name_lab'">
                        <div
                          class="flex text-wrap items-center"
                        >
                          <div class="q-mr-md">
                            <b>{{ row?.name_lab_en?.replace('%',' ') }}</b>
                          </div>
                          <div>
                            {{ row?.name_lab_en == row?.name_lab ? '' : row?.name_lab }}
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'range'">
                        <div v-if="row.low && row.high" class="flex no-wrap items-center">
                          {{ row.low }} ~ {{ row.high }}
                        </div>
                      </div>
                      <div v-else-if="col.field === 'name_unit_result'" class="body1 text-center regular text-grey-900">
                        {{ row.id_cm_unit ? typeLabUnitName(row.id_cm_unit) : row.name_unit_result }}
                      </div>
                      <div v-else class="body1 text-center regular text-grey-900">
                        {{ row[col.field] ? row[col.field] : '' }}
                      </div>
                    </div>
                  </q-td>
                </template>
              </q-table>
              <div class="flex justify-between">
                <div>
                  <div v-if="lab_result?.[0]?.id_service_detail" @click.stop="openServiceDetail(lab_result?.[0]?.id_service_detail)" class="caption1 regular q-mt-sm text-blue">
                    {{ lab_result?.[0]?.number_service_detail }}
                  </div>
                </div>
                <div class="flex justify-end">
                  <!--Single Lab Result PDF-->
                  <div @click.stop="togglePdfConfirmation(lab_result)" class="caption1 regular q-mt-sm text-blue">
                    <q-icon name="compare" /> 
                    一回
                  </div>
                  <div class="caption1 regular q-mt-sm">
                    <span class="q-mx-xs">/</span>
                  </div>
                  <!--Comparison Lab Result-->
                  <div @click.stop="openLabResultMultiModal(lab_result)"  class="caption1 regular q-mt-sm text-blue">
                    比較
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>

    <!-- THIS DIV IS FOR MEDICAL CONDITION -->
    <div
      v-for="(medCondition, index) in props.data?.medical_condition"
      :key="`${props.date}-${index}`"
      :class="'bg-' + getMemoCarteBgColor(medCondition)"
      class="memo-title q-mb-md q-pa-md cursor-pointer"
      :style="{ backgroundColor: getMemoCarteBgColor(medCondition)}"
      @click.stop="medConditionModal(medCondition)"
    >
      <div class="flex items-center">
        <strong class="letter-space-050">{{ formatDate(medCondition?.datetime_record) }}</strong>
        <small class="text-grey-600 q-ml-md q-mr-xs"></small>
        {{ cliCommonName(medCondition?.code_cli_common) }}
      </div>
      <div class="q-mt-md q-mb-sm">
        <q-btn-group outline spread class="btn-options items-center">
          <template v-for="cliCodeCommon in codeCommonList(medCondition?.code_cli_common)"
                    :key="cliCodeCommon.id_cli_common">
            <q-btn
              :outline="medCondition.type_med_condition != cliCodeCommon.code_func1"
              :label="cliCodeCommon.name_cli_common"
              :style="{backgroundColor: medCondition.type_med_condition == cliCodeCommon.code_func1 ? '#1d7afc' : '', color: medCondition.type_med_condition == cliCodeCommon.code_func1 ? '#fff' : ''}"
            />
          </template>
        </q-btn-group>
        <div v-if="medCondition?.memo_record" class="q-mt-md">
          {{ medCondition?.memo_record }}
        </div>
      </div>
    </div>
  </template>

  <!-- THIS DIV IS FOR CLINICAL FILE -->
  <div v-if="props.data?.clinical_file_list && props.data?.clinical_file_list.length > 0 && props.show_clinical_file" class="q-mb-md row c-gap">
    <div v-for="(files, i) in props.data?.clinical_file_list"
        @click="onClickFileClinic(files, i, dateFormat(props.date))"
        :key="i" class="col-auto image-container cursor-pointer">
      <img v-if="files.type_file == 1 || files.type_file == 3"
          :src="files.thumbnail_path ? files.thumbnail_path : fileLogo" class="thumbnail-style flex column-sm"
          @error="replaceByDefaultImg" />
      <video v-else-if="files.type_file == 2"
        :id="`cli_file_video_${i}`"
        class="thumbnail-style"
        style="width: 169px;"
        controls
      >
        <source :src="files.file_path" type="video/mp4">
      </video>
      <img v-else-if="files.file_path?.includes('.pdf')"
          :src="files.thumbnail_path ? files.thumbnail_path : fileLogo" class="xy thumbnail-style" />
      <img v-else-if="files.file_path?.includes('.mp3') || files.file_path?.includes('.wav')"
          :src="'/src/assets/img/clinicalFiles/audio.png'" class="xy thumbnail-style" />
      <img v-else :src="fileLogo" class="xy thumbnail-style" />
      <div class="date-overlay">
        {{ formatDate(files.datetime_receive) }}
      </div>
    </div>
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
  border-radius: 28px
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
  position: relative;
  display: inline-block;
  width: 169px;
  height: 123px;
}

.thumbnail-style {
  border-radius: 8px;
  height: 123px;
  max-width: 169px;

}

.image-container img, .image-container video {
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

.my-sticky-header-column-table td:nth-of-type(1), .my-sticky-header-column-table th:nth-of-type(1) {
  text-wrap: nowrap;
}

.my-sticky-header-column-table .dark {
  background-color: #424242;
  color: white;
}

.my-sticky-header-column-table .light {
  background-color: #fff4cb ;
  color: black;
}

.my-sticky-header-column-table .q-table thead tr, .my-sticky-header-column-table .q-table tbody td {
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
  background: #dddddd;
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
  background: #dddddd;
}
.med-condition-option {
  padding: 0px 12px ;
  font-size : 14px; 
  background: #fff;
  border-radius: 25px;
  margin: 3px 10px 3px 0px;
  color: #0084f0;
  font-weight: bold;
}
</style>
