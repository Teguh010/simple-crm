<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  ref
} from 'vue'
import { storeToRefs } from 'pinia'
// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import aahMessages from '@/utils/aahMessages'
import {
  formatDate,
  parseForlinks,
  searchWithHighlight
} from '@/utils/aahUtils'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import useCliCommonStore from '@/stores/cli-common'
import useCommonStore from '@/stores/common'
import useServiceDetailStore from '@/stores/service-details'

// Types
import {
  CliCommon,
  Common,
  MedCondition,
  MemoCarteType
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
    id_customer: string
    id_pet?: string
  }>(),
  {
    id: '',
    data: {},
    id_customer: '',
    id_pet: '',
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

const typeMemoCarte = computed(
  () => getCliCommonTypeCarteSourceList.value.filter((v: CliCommon) => v.code_cli_common == 11).map((v: CliCommon) => ({
    ...v,
    label: v.name_cli_common,
    value: v.id_cli_common
  }))
)

const typeLabUnitName = (value: number) => commonStore.getCommonUnitOptionList.find((item: Common) => item.id_common === value)?.name_common

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
    // number_request: props?.requestDetailPage?.number_request ?? '',
    id_customer: props.id_customer.toString(),
    id_pet: props.id_pet.toString(),
    id_pet_illness_history:
      illnessHistoryStore.getIllnessHistory?.id_pet_illness_history.toString()
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
  })
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
  } else if (memoCarte && memoCarte.memo_other) {
    tempHTML += '<b>P: 計画他</b><br>' + memoCarte?.memo_other + '<br> <br>'
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
    <!-- THIS DIV IS FOR MEMO_CARTE -->
    <div
      :class="hideMemoCarte(props.data?.memo_carte) ? 'hidden ': ' '"
      :style="{
        backgroundColor: getMemoCarteBgColor(props.data?.memo_carte),
        border: '2px solid #0057FF'
      }"
      class="memo-title q-mb-md q-pa-md cursor-pointer"
      @click.stop="memoCarteModal(props.data?.memo_carte)"
    >
      <div class="row full-width">
        <div class="col flex items-center">
          <q-icon
            name="push_pin"
            size="16px"
            class="text-blue text-center font-12px"
          />
          <strong class="text-blue q-ml-xs">
            {{ formatDate(props.data?.memo_carte?.datetime_memo_carte) }}
          </strong>
          <small
            v-if="getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) != 5 && getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) !== null"
            :class="{
            'bg-green text-grey-100 q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) == 1,
            'bg-grey-600 text-grey-100 q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) == 2,
            'bg-blue-800 text-white q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) == 6,
            'chip-purple text-white q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) == 10,
            'bg-pink-700 text-white q-br-5 q-px-xs q-ml-md':
              getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common) == 15
          }"
          >
            {{
              typeMemoCarte.find((v) => v.value === getMemoCarteCliCommonFunc(props.data?.memo_carte?.id_cli_common))
                ?.label
            }}
          </small>
          <span class="text-grey-600 q-ml-md q-mr-xs">対象診察 :</span>
          {{ illnessHistoryName(props.data?.memo_carte?.id_pet_illness_history) }}
          <template v-if="props.data?.memo_carte?.type_input === 1">
            <div
              class="row bg-white cursor-pointer q-px-md q-py-xs q-ml-xl memo_ai"
              @click.stop="openVerifyUnverifyModal(props.data?.memo_carte)"
            >
              <img
                v-if="props.data?.memo_carte?.flg_verified"
                class="verify-img q-mr-sm"
                height="26"
                src="@/assets/img/aiVetty/verify_confirm.png"
                width="25"
              />
              <span class="text-grey-600">AIカルテ</span>
              <div
                :class="
                props.data?.memo_carte?.flg_verified
                  ? 'verify-status text-blue'
                  : 'unverify-status'
              "
                class="status q-pl-sm"
              >
                {{
                  props.data?.memo_carte?.flg_verified ? 'レビュー済' : '確認してください！'
                }}
              </div>
            </div>
          </template>
          <small class="text-grey-600 q-ml-auto">{{ getMemoCartelabel(props.data?.memo_carte?.id_cli_common) }}</small>
        </div>
      </div>
      <div
        class="row full-width q-mt-md"
        v-html="showHTMLDataV1(props.data?.memo_carte)"
      ></div>
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
.font-10px {
  font-size: 10px;
}
.font-12px {
  font-size: 12px;
}
</style>
