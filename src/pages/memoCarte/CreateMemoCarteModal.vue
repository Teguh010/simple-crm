<script setup lang="ts">
import { computed, onMounted, reactive, ref, Ref, onBeforeUnmount, watch, nextTick, defineAsyncComponent } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import LeftCreateMemoCarteModal from './LeftCreateMemoCarteModal.vue'
import FabricMemoCarteModal from './FabricMemoCarteModal.vue'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import { useRecordingModal } from './composables/UseRecordingModal'
import { useRecording } from './useRecording'
import KoekaruServiceUnavailableModal from './KoekaruServiceUnavailableModal.vue'
import ViewLargeMemoCarteComparison from './comparison/ViewLargeMemoCarteComparison.vue'
import MtPetInfoDynamic from '@/components/MtPetInfoDynamic.vue'

import UpdatePdfPetCarteSetting from'@/pages/memoCarte/UpdatePdfPetCarteSetting.vue'

const CameraVideoModal = defineAsyncComponent(
  () => import('@/pages/petInfo/clinicalFilesUploaderUrl/CameraVideoModal.vue')
)
const UpdateClinicalFileModal = defineAsyncComponent(
  () => import('@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue')
)

import {
  changeToggleDropdownNames,
  convertWeightInG,
  copyText,
  dateFormat,
  formatDateWithTime,
  formatNumberWithDecimals,
  getDateTimeNow,
  getDateToday,
  getFullPetName,
  isBitSet,
  formatDateTime,
  openViewAllCartePerDateList
} from '@/utils/aahUtils'
import { removeHtmlTag } from './memoCarteUtils'
import { CliCommon, IllnessHistoryType, RequestDetailPageType, CarteGroup, ClinicalFile } from '@/types/types'
import useCustomerStore from '@/stores/customers'
import useFabricStore from '@/stores/fabrics'
import useClinicCommonStore, { useCliCommonStore } from '@/stores/cli-common'
import useClinicStore from '@/stores/clinics'
import useMemoCarteStore from '@/stores/memo-cartes'
import useIllnessHistoryStore from '@/stores/illness-history'
import useTextTemplateStore from '@/stores/text-template'
import useClinicalFilesStore from '@/stores/clinical-files'
import aahValidations from '@/utils/aahValidations'
import aahMessages from '@/utils/aahMessages'
import {
  typeBodyWeight,
  typeCarteConfig,
  typeMedConditionColor
} from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { flatMap, forEach, groupBy, isEqual, set, sortBy, uniq } from 'lodash'
import { event_bus } from '@/utils/eventBus'
import usePetBioStore from '@/stores/pet-bios'
import selectOptions from '@/utils/selectOptions'
import OptionModal from '@/components/OptionModal.vue'
import useMedConditionStore from '@/stores/med-conditions'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import useConversationStore from '@/stores/Conversation'
import koekaruApi from '@/boot/axiosKoekaru'
import { useRoute } from 'vue-router'

type memoFieldsType = {
  field: string
  name: string
  label: string
}

const emits = defineEmits(['close'])
const dataChecker = () => {
  const current = currentData.value
  return (
    isEqual(current?.data, data.value) &&
    isEqual(current.petBioInfoData, petBioInfoData.value) &&
    isEqual(current?.medConditionData, medConditionData) &&
    isEqual(current.petSelected, petSelected.value) &&
    isEqual(current.customerSelected, customerSelected.value) &&
    isEqual(current.multipleImage, multipleImage.value) &&
    isEqual(current.id_pet_illness_history,id_pet_illness_history.value)
  )
}

const closeModal = async (direct: boolean = true) => {
  if (!direct) {
    if (!dataChecker()) {
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
        if (
          !data.value.id_employee ||                  
          !data.value.datetime_memo_carte ||         
          !data.value.id_cli_common ||           
          !id_pet_illness_history.value || 
          id_pet_illness_history.value.length === 0
        ) {
          await mtUtils.autoCloseAlert("必須項目を入力してください。"); 
          return;
        }
        await mtUtils.autoCloseAlert(aahMessages.success)
        submit()
      }
    }
  }

  fabricStore.resetFabricOption()
  event_bus.emit('reloadParent')
  emits('close')
}

const route = useRoute()

const MIN_WIDTH_FOR_ICONS_TEXT = 1400
const showHeaderIconsText = ref(window.innerWidth >= MIN_WIDTH_FOR_ICONS_TEXT)

const customerStore = useCustomerStore()
const fabricStore = useFabricStore()
const clinicCommonStore = useClinicCommonStore()
const clinicStore = useClinicStore()
const illnessHistoryStore = useIllnessHistoryStore()
const textTemplateStore = useTextTemplateStore()
const memoCarteStore = useMemoCarteStore()
const { getMemoCartes } = storeToRefs(memoCarteStore)
const clinicalFilesStore = useClinicalFilesStore()
const cliCommonStore = useCliCommonStore()
const medConditionStore = useMedConditionStore()
const petBioStore = usePetBioStore()
const { getPetBios } = storeToRefs(petBioStore)
const { getFabric } = storeToRefs(fabricStore)
const { getIllnessHistorys, getLeftSideIllnessHistoryList } =
  storeToRefs(illnessHistoryStore)
const { getCliCommonTypeCarteSourceList, getCliCommonTypeMemoCarteList } =
  storeToRefs(cliCommonStore)
const { getTemplates } = storeToRefs(textTemplateStore)
const { openRecordingSettingsModal } = useRecordingModal()
const { flg_auto_memocarte_ai } =
  useRecording()
const petCartePdfConfirmationDialog = ref(false)
const employeeRef = ref(null);
const dateRef = ref(null);
const pullDownRef = ref(null);
const diseaseRef = ref(null);
const isEdit = ref(false)
const isSelect = ref(false)
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
const disableClinicalFileBtn = ref(false)
const leftSidebarOpen = ref(false)
const rightSidebarOpen = ref(false)
const isDragging = ref(false)
const multipleImage = ref([])
const deleteImage = ref([])
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
const sidebarKey = ref(0)

const medConditionData = reactive([])

const props = withDefaults(
  defineProps<{
    date_insert?: string
    datetimeInsert?: string
    data_cartes?: object
    clinical_file?: array
    id_request: string
    id_customer: string
    id_pet: string
    number_request?: string
    id_pet_illness_history?: string
    id_memo_carte?: number
    memo_other?: string
    id_employee?: string
    requestDetailPage?: RequestDetailPageType
    duplciateCart?: { value: boolean }
    autoSaveOnMount: boolean
    callBackRefresh: Function | null
  }>(),
  {
    date_insert: '',
    datetimeInsert: '',
    data_cartes: {},
    clinical_file: [],
    id_request: '',
    number_request: '',
    id_customer: '',
    id_pet: '',
    id_pet_illness_history: '',
    id_memo_carte: -1,
    memo_other: '',
    id_employee: '',
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    },
    duplciateCart: () => {
      return { value: false }
    },
    autoSaveOnMount: false,
    callBackRefresh: null
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

const openMenu = async () => {
  let menuOptions = [
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
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
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
            const payload = {
              group_carte: props.data_cartes?.memo_carte_list?.[0]?.group_carte
                ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
                : null,
              id_pet: data.value.id_pet
            }
            await memoCarteStore.destroyMemoCarteGrouped(payload)
            await event_bus.emit('searchMemoCarte')
            mtUtils.autoCloseAlert(aahMessages.success)
            emits('close')
          }
        })
    }
    else if(selectedOption.name == 'pet_carte_pdf') {
      petCartePdfConfirmationDialog.value = true
    }
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

const sortedMedCondition = (medConditionArr: any) => {
  const allMedConditionList = clinicCommonStore.allCliCommonMedConditionOptionList

  // Create a lookup map for display_order
  const orderMap = Object.fromEntries(allMedConditionList.map(item => [item.code_cli_common, item.display_order]));
  const sortedMedConditionArr = medConditionArr.sort((a, b) => orderMap[a.code_cli_common] - orderMap[b.code_cli_common])

  return sortedMedConditionArr
}

const submit = async (
  closeModal: boolean = true,
  autoSave: boolean = false
)  => {
  const { id_pet, id_customer } = memoCarteStore.currentPage;
  const petId = id_pet || props.id_pet;
  const customerId = id_customer || props.id_customer;
  try {
    if (
      !data.value.id_employee ||
      !data.value.datetime_memo_carte ||
      !data.value.id_cli_common ||
      !id_pet_illness_history.value ||
      id_pet_illness_history.value.length === 0
    ) {
      // Show validation alert when user hasn't saved and do not show when autosaving
      if (!autoSave) {
        await mtUtils.autoCloseAlert("必須項目を入力してください。");
      }
      return
    }
    const datetime = formatDateWithTime(
      data.value.datetime_memo_carte,
      'YYYY/MM/DD HH:mm:ss'
    )
    data.value.id_pet_illness_history = id_pet_illness_history.value;
    const petBioPayload = { ...petBioInfoData.value };
    if (petBioPayload.type_body_weight == 1 && petBioPayload.val_weight) {
      petBioPayload.val_weight = petBioPayload.val_weight * 1000;
    }
    const checkMemoFields = memoFields
      .map((v) => {
        if (data.value[v.field]) return true
        return false
      })
      .filter((v) => v);
    if (checkMemoFields.length > 0) {
      const memoFieldsExceed = memoFields.filter(
        (v) => data.value[v.field].replace(/<[^>]*>/g, '').length > 2000
      );
      if (memoFieldsExceed.length > 0) {
        let memoFieldsExceedNames = memoFieldsExceed
          .map((v) => v.label)
          .join(', ');
        return mtUtils.alert(
          `${memoFieldsExceedNames} は2000文字を超えています。`,
          'Error: MC000b'
        );
      }
    }
  
    if (petBioPayload.val_weight)
      petBioPayload.val_weight = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_weight)
      );
    if (petBioPayload.val_temperature)
      petBioPayload.val_temperature = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_temperature)
      );
    if (petBioPayload.val_pressure_systolic)
      petBioPayload.val_pressure_systolic = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_pressure_systolic)
      );
    if (petBioPayload.val_pressure_diastolic)
      petBioPayload.val_pressure_diastolic = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_pressure_diastolic)
      );
    if (petBioPayload.val_pressure_mean_arterial)
      petBioPayload.val_pressure_mean_arterial = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_pressure_mean_arterial)
      );
    if (petBioPayload.val_blood_oxygen_level)
      petBioPayload.val_blood_oxygen_level = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_blood_oxygen_level)
      );
    if (petBioPayload.val_blood_carbon_dioxide_level)
      petBioPayload.val_blood_carbon_dioxide_level = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_blood_carbon_dioxide_level)
      );
    if (petBioPayload.val_respiration_rate)
      petBioPayload.val_respiration_rate = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_respiration_rate)
      );
    if (petBioPayload.val_heartbeat_rate)
      petBioPayload.val_heartbeat_rate = formatNumberWithDecimals(
        parseFloat(petBioPayload.val_heartbeat_rate)
      );

    if (isEdit.value) {
      const promisesEdit = [];
      // MED CONDITION
      if (medConditionData) {
        sortBy(
          flatMap(medConditionData) // UPDATE EXISTING MED CONDITION
            .filter((v) => v && v.id_med_condition),
          'display_order'
        ).forEach((item) => {
          const cliCommonTypeMemoCarte = getCliCommonTypeMemoCarteList.value.find(
            (v) => v.code_func1 == item?.code_cli_common
          );
          const medItems = {
            ...item,
            id_pet: props.id_pet,
            id_customer: props.id_customer,
            id_employee_record: data.value.id_employee,
            datetime_record: datetime,
            display_order: cliCommonTypeMemoCarte?.display_order || 0
          };
          promisesEdit.push(
            medConditionStore.updateMedCondition(item.id_med_condition, medItems)
          )
        });
        const newMedCondition = sortBy(
          flatMap(medConditionData) // ADD NEW MED CONDITION
            .filter((v) => v && !v.id_med_condition)
            .map((item) => {
              const cliCommonTypeMemoCarte =
                getCliCommonTypeMemoCarteList.value.find(
                  (v) => v.code_func1 == item?.code_cli_common
                );
              return {
                ...item,
                flg_func1: item.flg_func1,
                id_pet: props.id_pet,
                id_customer: props.id_customer,
                id_employee_record: data.value.id_employee,
                datetime_record: datetime,
                datetime_insert: datetime,
                group_carte: isEdit.value && !props.autoSaveOnMount
                  ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
                  : null,
                display_order: cliCommonTypeMemoCarte?.display_order || 0
              };
            }),
          'display_order'
        );
        console.log('newMedCondition', newMedCondition)
        if (newMedCondition.length > 0) {
          promisesEdit.push(
            memoCarteStore.submitMemoCarteV1({
              med_condition_list: newMedCondition
            })
          );
        }
        if (removedConditionData) {
          removedConditionData.value.forEach((v) => {
            if (v) {
              const payloadSend = data.value.id_employee;
              promisesEdit.push(
                medConditionStore.destroyMedCondition(v, payloadSend)
              );
            }
          });
          removedConditionData.value = [];
        }
      }

      // PET BIO INFO
      if (petBioPayload.id_pet_bio_info) {
        promisesEdit.push(
          mtUtils.callApiEx({
            method: selectOptions.reqMethod.PUT,
            url: `/pet_bio_info/${petBioPayload.id_pet_bio_info}`,
            params: {
              ...petBioPayload,
              id_pet: props.id_pet,
              id_customer: props.id_customer,
              datetime_measure: datetime,
              datetime_insert: datetime,
              group_carte:
                isEdit.value && !props.autoSaveOnMount
                  ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
                  : null
            },
            silent: autoSave
          })
        );
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
        ) {
          promisesEdit.push(
            mtUtils.callApiEx({
              method: selectOptions.reqMethod.POST,
              url: `/pet_bio_info`,
              params: {
                ...petBioPayload,
                id_pet: props.id_pet,
                id_customer: props.id_customer,
                datetime_measure: datetime,
                datetime_insert: datetime,
                group_carte: isEdit.value && !props.autoSaveOnMount
                  ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
                  : null
              },
              silent: autoSave
            })
          );
        }
      }

      // CLINICAL FILE
      if (multipleImage.value.length > 0) {
        const idPetIllnessHistoryString = id_pet_illness_history?.value?.join(',') || '';
        multipleImage.value.forEach((item) => {
          item.datetime_receive = datetime;
          item.id_pet_illness_history = idPetIllnessHistoryString;
          item.group_carte = isEdit.value && !props.autoSaveOnMount
            ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
            : null;
          if (item.old === undefined || item.old === null || item.old === false) {
            item.old = true;
            promisesEdit.push(clinicalFilesStore.submitClinicalFile(item));
          }
        });
        currentData.value.multipleImage = multipleImage.value;
      }
      if (deleteImage.value?.length > 0) {
        deleteImage.value.forEach((id_clincal_file) => {
          promisesEdit.push(
            clinicalFilesStore.destroyClinicalFile(id_clincal_file)
          );
        });
        currentData.value.multipleImage = multipleImage.value;
      }

      // CALL UPDATE API
      if (data.value.id_memo_carte != -1) {
        if (autoSave) {
          await mtUtils.promiseAllSilently([
            useMemoCarteStore().updateMemoCarte(data.value.id_memo_carte, {
              ...data.value
            }),
            ...promisesEdit
          ]);
        } else {
          await mtUtils.promiseAllWithLoaderMsg(
            [
              useMemoCarteStore().updateMemoCarte(data.value.id_memo_carte, {
                ...data.value
              }),
              ...promisesEdit
            ],
            '更新しています...'
          );
        }
      } else {
        const med_conditions =
          props?.data_cartes?.medical_condition?.map((condition, index) => ({
            code_cli_common: condition.code_cli_common,
            id_pet: props.id_pet,
            id_customer: props.id_customer,
            id_employee_record: data.value.id_employee,
            datetime_record: datetime,
            flg_func1: true,
            code_func1: null,
            display_order: index
          })) || [];

        const { id_memo_carte, ...filteredData } = data.value;
        promisesEdit.push(
          memoCarteStore
            .submitMemoCarteV1({
              memo_carte: filteredData,
              med_condition_list: med_conditions
            })
            .then((response) => {
              data.value.id_memo_carte = response.data.data.id_memo_carte;
            })
        );
      }
  
      currentData.value.data = data.value;
      currentData.value.petBioInfoData = petBioInfoData.value;
      currentData.value.id_pet_illness_history = id_pet_illness_history.value;
      currentData.value.medConditionData.splice(
        0,
        currentData.value.medConditionData.length,
        ...medConditionData
      );

      if (petBioPayload.val_weight) {
        await usePetBioStore().fetchPetBio({
          id_pet: props.id_pet,
          id_customer: props.id_customer,
          fetch_weight: true
        });
      }
      await memoCarteStore.fetchMemoCarteV1({
        id_pet: petId,
        id_customer: customerId,
        page_size: 300
      });

      if (!closeModal) {
        // UPDATE UI MED CONDITION DATA IF NON-CLOSE MODAL BUTTON IS CLICKED
        initMedCondition(
          memoCarteStore.getFilteredMemoCartesV1[dateFormat(datetime)].others[
            datetime
          ].medical_condition,
          true
        );
      }
      sidebarKey.value = sidebarKey.value + 1;
      if (closeModal) emits('close');
      return;
    }
    if (isSelect.value) {
      const promisesEdit = [];
      // MED CONDITION
      if (medConditionData) {
        sortBy(
          flatMap(medConditionData) // UPDATE EXISITING MED CONDITION
            .filter((v) => v && v.id_med_condition),
          'display_order'
        ).forEach((item) => {
          const cliCommonTypeMemoCarte = getCliCommonTypeMemoCarteList.value.find(
            (v) => v.code_func1 == item?.code_cli_common
          );
          const medItems = {
            ...item,
            id_pet: data?.value.id_pet,
            id_customer: data?.value.id_customer,
            id_employee_record: data.value.id_employee,
            datetime_record: datetime,
            display_order: cliCommonTypeMemoCarte?.display_order || 0
          };
          promisesEdit.push(
            medConditionStore.updateMedCondition(item.id_med_condition, medItems)
          );
        });
        const newMedCondition = sortBy(
          flatMap(medConditionData) // ADD NEW MED CONDITION
            .filter((v) => v && !v.id_med_condition)
            .map((item) => {
              const cliCommonTypeMemoCarte =
                getCliCommonTypeMemoCarteList.value.find(
                  (v) => v.code_func1 == item?.code_cli_common
                );
              return {
                ...item,
                flg_func1: item.flg_func1,
                id_pet: data?.value.id_pet,
                id_customer: data?.value.id_customer,
                id_employee_record: data?.value.id_employee,
                datetime_record: datetime,
                datetime_insert: datetime,
                group_carte: data?.value.group_carte,
                display_order: cliCommonTypeMemoCarte?.display_order || 0
              };
            }),
          'display_order'
        );
        if (newMedCondition.length > 0) {
          promisesEdit.push(
            memoCarteStore.submitMemoCarteV1({
              med_condition_list: newMedCondition
            })
          );
        }
        if (removedConditionData) {
          removedConditionData.value.forEach((v) => {
            if (v) {
              const payloadSend = data.value.id_employee;
              promisesEdit.push(
                medConditionStore.destroyMedCondition(v, payloadSend)
              );
            }
          });
          removedConditionData.value = [];
        }
      }

      // PET BIO INFO
      if (petBioPayload.id_pet_bio_info) {
        promisesEdit.push(
          mtUtils.callApiEx({
            method: selectOptions.reqMethod.PUT,
            url: `/pet_bio_info/${petBioPayload.id_pet_bio_info}`,
            params: {
              ...petBioPayload,
              id_pet: props.id_pet,
              id_customer: props.id_customer,
              datetime_measure: datetime,
              datetime_insert: datetime,
              group_carte:
                isEdit.value && !props.autoSaveOnMount
                  ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
                  : null
            },
            silent: autoSave
          })
        );
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
        ) {
          promisesEdit.push(
            mtUtils.callApiEx({
              method: selectOptions.reqMethod.POST,
              url: `/pet_bio_info`,
              params: {
                ...petBioPayload,
                id_pet: props.id_pet,
                id_customer: props.id_customer,
                datetime_measure: datetime,
                datetime_insert: datetime,
                group_carte: data?.value.group_carte,
              },
              silent: autoSave
            })
          );
        }
      }
  
      // CLINICAL FILE
      if (multipleImage.value.length > 0) {
        const idPetIllnessHistoryString = id_pet_illness_history?.value?.join(',') || '';
        multipleImage.value.forEach((item) => {
          item.datetime_receive = datetime;
          item.id_pet_illness_history = idPetIllnessHistoryString;
          item.group_carte = data?.value.group_carte;
          if (item.old === undefined || item.old === null || item.old === false) {
            item.old = true;
            promisesEdit.push(clinicalFilesStore.submitClinicalFile(item));
          }
          event_bus.emit('reloadParent');
        });
        currentData.value.multipleImage = multipleImage.value;
      }
      if (deleteImage.value?.length > 0) {
        deleteImage.value.forEach((id_clincal_file) => {
          promisesEdit.push(
            clinicalFilesStore.destroyClinicalFile(id_clincal_file)
          );
        });
        currentData.value.multipleImage = multipleImage.value;
      }

      // CALL UPDATE API
      if (data.value.id_memo_carte != -1) {
        if (autoSave) {
          await mtUtils.promiseAllSilently([
            useMemoCarteStore().updateMemoCarte(data.value.id_memo_carte, {
              ...data.value
            }),
            ...promisesEdit
          ]);
        } else {
          await mtUtils.promiseAllWithLoaderMsg(
            [
              useMemoCarteStore().updateMemoCarte(data.value.id_memo_carte, {
                ...data.value
              }),
              ...promisesEdit
            ],
            '更新しています...'
          );
        }
      } else {
        const med_conditions =
          props?.data_cartes?.medical_condition?.map((condition, index) => ({
            code_cli_common: condition.code_cli_common,
            id_pet: props.id_pet,
            id_customer: props.id_customer,
            id_employee_record: data.value.id_employee,
            datetime_record: datetime,
            flg_func1: true,
            code_func1: null,
            display_order: index
          })) || [];

        const { id_memo_carte, ...filteredData } = data.value;
        promisesEdit.push(
          memoCarteStore
            .submitMemoCarteV1({
              memo_carte: filteredData,
              med_condition_list: med_conditions
            })
            .then((response) => {
              data.value.id_memo_carte = response.data.data.id_memo_carte;
            })
        );
      }
  
      currentData.value.data = data.value;
      currentData.value.petBioInfoData = petBioInfoData.value;
      currentData.value.id_pet_illness_history = id_pet_illness_history.value;
      currentData.value.medConditionData.splice(
        0,
        currentData.value.medConditionData.length,
        ...medConditionData
      );

      if (petBioPayload.val_weight) {
        await usePetBioStore().fetchPetBio({
          id_pet: props.id_pet,
          id_customer: props.id_customer,
          fetch_weight: true
        });
      }
      if (!autoSave) event_bus.emit('reloadLeft');
      await memoCarteStore.fetchMemoCarteV1({
        id_pet: petId,
        id_customer: customerId,
        page_size: 300
      });

      if (!closeModal) {
        // UPDATE UI MED CONDITION DATA IF NON-CLOSE MODAL BUTTON IS CLICKED
        initMedCondition(
          memoCarteStore.getFilteredMemoCartesV1[dateFormat(datetime)].others[
            datetime
          ].medical_condition,
          true
        );
      }
      sidebarKey.value = sidebarKey.value + 1;
      if (closeModal) emits('close');

       memoCarteStore.setCurrentPage({
        id_request: '',
        id_pet: '',
        id_customer: ''
      });
      return;
    }

    let payload = {
      memo_carte: {
        ...data.value,
        datetime_memo_carte: datetime,
        id_pet_illness_history: id_pet_illness_history.value
      },
      med_condition_list: sortBy(
        uniq(flatMap(medConditionData))
          .filter((v) => v && !v.id_med_condition)
          .map((item) => {
            const cliCommonTypeMemoCarte =
              getCliCommonTypeMemoCarteList.value.find(
                (v) => v.code_func1 == item?.code_cli_common
              );
            return {
              ...item,
              id_pet: props.id_pet,
              id_customer: props.id_customer,
              id_employee_record: data.value.id_employee,
              datetime_record: datetime,
              display_order: cliCommonTypeMemoCarte?.display_order || 0
            };
          }),
        'display_order'
      )
    };

    // Pet bio validation
    const checkPetBio = Object.keys(petBioPayload)
      .map((v) => {
        if (
          !['id_clinic', 'id_pet', 'id_customer', 'type_body_weight'].includes(v)
        )
          if (petBioPayload?.[v]) return true;
        return false;
      })
      .filter((v) => v);

    if (
      petBioPayload.val_temperature ||
      petBioPayload.val_pressure_systolic ||
      petBioPayload.val_pressure_diastolic ||
      petBioPayload.val_pressure_mean_arterial ||
      petBioPayload.val_blood_oxygen_level ||
      petBioPayload.val_blood_carbon_dioxide_level ||
      petBioPayload.val_respiration_rate ||
      petBioPayload.val_heartbeat_rate ||
      convertWeightInG(
        petBioPayload.val_weight,
        petBioStore.getPetBio?.type_body_weight
      ) !==
        convertWeightInG(
          petBioStore.getPetBio?.val_weight,
          petBioStore.getPetBio?.type_body_weight
        )
    ) {
      if (checkPetBio.length > 0) {
        Object.assign(payload, {
          pet_bio_info: {
            ...petBioPayload,
            id_pet: props.id_pet,
            id_customer: props.id_customer,
            datetime_measure: datetime
          }
        });
      }
    }

    let promises = [];
    if (multipleImage.value.length > 0) {
      multipleImage.value.forEach((item) => {
        item.datetime_receive = datetime;
        item.group_carte = isEdit.value && !props.autoSaveOnMount
          ? props.data_cartes?.memo_carte_list?.[0]?.group_carte
          : null;
        if (item.old === undefined || item.old === null || item.old === false) {
          item.old = true;
          promises.push(clinicalFilesStore.submitClinicalFile(item));
        }
      });
      currentData.value.multipleImage = multipleImage.value;
    }
  
    if (
      payload &&
      (payload.memo_carte.memo_ass != '' ||
        payload.memo_carte.memo_obj != '' ||
        payload.memo_carte.memo_other != '' ||
        payload.memo_carte.memo_sbj != '' ||
        payload.med_condition_list.length > 0 ||
        payload.pet_bio_info)
    ) {
      promises.push(memoCarteStore.submitMemoCarteV1(payload));
      const response = await mtUtils.promiseAllWithLoaderMsg(
        promises,
        '更新しています...'
      );
      currentData.value.data = data.value;
      currentData.value.medConditionData = medConditionData;
      currentData.value.petBioInfoData = petBioInfoData.value;
      currentData.value.id_pet_illness_history = id_pet_illness_history.value;
      disableClinicalFileBtn.value = false;
      isDragging.value = false;
      await memoCarteStore.fetchMemoCarteV1({
        id_pet,
        id_customer,
        page_size: 200
      });
      if (petBioPayload.val_weight) {
        usePetBioStore().fetchPetBio({
          id_pet,
          id_customer,
          fetch_weight: true
        });
      }

      if (!closeModal || autoSave) {
        // UPDATE UI MED CONDITION DATA IF NON-CLOSE MODAL BUTTON IS CLICKED
        initMedCondition(
          memoCarteStore.getFilteredMemoCartesV1[dateFormat(datetime)].others[
            datetime
          ].medical_condition,
          true
        );
        if (response && typeof response != 'string') {
          isEdit.value = true;

          const id_memo_carte =
            response?.[response.length - 1]?.data?.data?.memo_carte?.id_memo_carte;
          if (id_memo_carte) data.value.id_memo_carte = id_memo_carte;
  
          const id_pet_bio_info =
            response?.[response.length - 1]?.data?.data?.pet_bio_info
              ?.id_pet_bio_info;
          if (id_pet_bio_info)
            petBioInfoData.value.id_pet_bio_info = id_pet_bio_info;
        }
      }

      if (!autoSave) mtUtils.autoCloseAlert(aahMessages.success);
      if (closeModal) emits('close');
    }
  } catch (error) {
    await mtUtils.alert("エラーがありました。更新できません。");
  }
};

const setChildRef = (index) => (el) => {
  if (el) {
    memoFieldsRef.value[index] = el
  } else {
    memoFieldsRef.value.splice(index, 1)
  }
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
    fabricStore.getFabricOption.forEach((v) => {
      const images = {
        ...v,
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
      multipleImage.value.push(images)
      filePaths.value.push(v.file_path)
    })
  }
}

const colorClicked = (index) => {
  const edit = memoFieldsRef.value[index]
  edit.runCmd('foreColor', foreColor.value[index])
  edit.focus()
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

    fileList.forEach((file) => {
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
        id_pet: props.id_pet,
        id_customer: props.id_customer,
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
      rightSidebarOpen.value = true;
      return
    })

    // Reset the input to avoid reprocessing the same files
    target.value = ''
  }
}

const onFileRemoved = (index: number, id_clinical_file: number) => {
  multipleImage.value.splice(index, 1)
  filePaths.value.splice(index, 1)
  deleteImage.value.push(id_clinical_file)
  currentData.value.multipleImage = multipleImage.value
}

const fetchCommonCliRecords = async (code_func1, flg_func1, index: number) => {
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
      text1: null,
      flg_func1: flg_func1,
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

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  const dt = e.dataTransfer
  if (!dt || !dt.files || dt.files.length === 0) return

  const fakeEvent = {
    target: {
      files: dt.files,
      value: ''  
    }
  } as unknown as Event

  onFileChange(fakeEvent)
  isDragging.value = false
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragEnter = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false
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

const conversationStore = useConversationStore()

const handleRecordingClick = async () => {
  const checkAvailability = await koekaruApi.get(`/koekaru-availability`)
    memoCarteStore.setCurrentPage({
    id_request: '',
    id_pet: '',
    id_customer: ''
  });

  memoCarteStore.setCurrentPage({
    id_request: props.id_request,
    id_pet: props.id_pet,
    id_customer: props.id_customer
  });

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

  if (flg_auto_memocarte_ai.value && (!id_pet_illness_history.value || id_pet_illness_history.value.length === 0)) {
    mtUtils.autoCloseAlert("For auto-submit memo, please select a pet illness history first.")
    return
  }
  
  const recordingData = {
    id_employee: data.value.id_employee,
    datetime_memo_carte: data.value.datetime_memo_carte,
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    id_request: props.id_request,
    number_request: props.number_request,
    petSelected: petSelected.value
  }

  const createMemoCarteData = {
    id_request: props.id_request,
    number_request: props.number_request,
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    id_pet_illness_history: props.id_pet_illness_history
  }

  const currentData = {
    data: data.value,
    petBioInfoData: petBioInfoData.value,
    medConditionData: medConditionData,
    petSelected: petSelected.value,
    customerSelected: customerSelected.value,
    clinicCommonList: clinicCommonList.value,
    id_pet_illness_history:id_pet_illness_history.value
    // multipleImage: multipleImage.value
  }

  const shouldClose = await openRecordingSettingsModal(
    'create_memo_carte',
    recordingData,
    createMemoCarteData,
    currentData
  )

  if (shouldClose && recordingData.source !== 'create_memo_carte') {
    closeModal()
  }

  memoCarteStore.setTempFormData({
    petBioInfo: petBioInfoData.value,
    memoCarteData: data.value,
    medConditionData: medConditionData,
    clinicalFiles: multipleImage.value
  })
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

event_bus.on('close-create-carte-modal', () => {
  closeModal()
})

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
    }).reverse()
  })

  forEach(clinicCommonList.value, (v, index) => {
    forEach(v, (cliCodeCommon, idx) => {
      if (!medConditionData[index]) medConditionData[index] = []
      if (!medConditionData[index][idx] || forceUpdate)
        medConditionData[index][idx] = {
          ...cliCodeCommon,

          type_med_condition: cliCodeCommon.type_med_condition,
          text1:
            cliCodeCommon.clinicCommonData.find(
              (v) => v.code_func1 == cliCodeCommon.type_med_condition
            )?.text1 || null,
          code_cli_common: cliCodeCommon.code_cli_common,
          flg_func1: cliCodeCommon.flg_func1
        }
    })
  })
}

let autoSaveMillSecs = 500000
let autoSaveTimer = null // Auto save timer ID
let lastChanged = -1
let callAutoSave = false

const onUserActivity = () => {
  lastChanged = Date.now()
  callAutoSave = true
}

const autoSaveMemoCarte = async () => {
  const elapsed = Date.now() - lastChanged
  if (elapsed < autoSaveMillSecs) {
    console.log(
      `CreateMemoCarte: user has been active in the past ${elapsed} ms.`
    )
  } else if (callAutoSave) {
    console.log("CreateMemoCarte: Attempting to auto-save...")
    await submit(false, true)
    if (
      !data.value.id_employee ||
      !data.value.datetime_memo_carte ||
      !data.value.id_cli_common ||
      !id_pet_illness_history.value ||
      id_pet_illness_history.value.length === 0
    ) {
      console.log("CreateMemoCarte: Autosave not called due to validation.");
    } else {
      console.log("CreateMemoCarte: Autosave called");
      callAutoSave = false
    }
  }
}

const copyMemoCarte = () => {
  // Create a temporary container for plain text
  let tempDiv = document.createElement('div')

  tempDiv.textContent =
    'S: 主観' + '\n' + removeHtmlTag(data.value.memo_sbj) + '\n\n'
  tempDiv.textContent +=
    'O: 客観' + '\n' + removeHtmlTag(data.value.memo_obj) + '\n\n'
  tempDiv.textContent +=
    'A: 評価' + '\n' + removeHtmlTag(data.value.memo_ass) + '\n\n'
  tempDiv.textContent +=
    'P: 計画他' + '\n' + removeHtmlTag(data.value.memo_other)

  let updatedText = tempDiv.textContent

  copyText(updatedText, 'カルテをコピーしました！')
}

const duplicateMemoCarte = () => {
  props.duplciateCart.value = true
  closeModal()
}

const submitDuplicateCart = async () => {
  if (
    !id_pet_illness_history.value ||
    id_pet_illness_history.value.length === 0
  ) {
    return
  }

  const currentDatetime = formatDateWithTime(
    getDateTimeNow(),
    'YYYY/MM/DD HH:mm:ss'
  )

  data.value.datetime_memo_carte = currentDatetime
  data.value.id_pet_illness_history = id_pet_illness_history.value
  const petBioPayload = { ...petBioInfoData.value }
  if (petBioPayload.type_body_weight == 1 && petBioPayload.val_weight) {
    petBioPayload.val_weight = petBioPayload.val_weight * 1000
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
    delete petBioPayload.id_pet_bio_info
  delete petBioPayload.datetime_insert
  delete petBioPayload.datetime_update
  delete petBioPayload.flg_delete
  delete petBioPayload.id_employee_insert
  delete petBioPayload.id_employee_update

  apiPromises.push(
    mtUtils.callApiEx({
      method: selectOptions.reqMethod.POST,
      url: `/pet_bio_info`,
      params: {
        ...petBioPayload,
        id_pet: props.id_pet,
        id_customer: props.id_customer,
        datetime_measure: currentDatetime,
        datetime_insert: currentDatetime
      }
    })
  )

  let { id_memo_carte, ...filteredData } = data.value
  let medConditionData = props.data_cartes.medical_condition.map(
    (medCondition) => {
      return {
        ...medCondition,
        datetime_record: currentDatetime,
        type_med_condition: medCondition.type_med_condition.toString()
      }
    }
  )

  medConditionData.forEach((medCondition) => {
    delete medCondition.id_med_condition
    delete medCondition.datetime_insert
    delete medCondition.datetime_update
    delete medCondition.id_employee_insert
    delete medCondition.id_employee_update
  })

  let payload = {
    med_condition_list: medConditionData,
    memo_carte: filteredData
  }

  const response = await mtUtils.promiseAllWithLoaderMsg(
    [memoCarteStore.submitMemoCarteV1(payload), ...apiPromises],
    '更新しています...'
  )

  mtUtils.autoCloseAlert('カルテを複製しました！\nこのまま編集してください。')
  await memoCarteStore.fetchMemoCarteV1({
    id_pet: props.id_pet,
    id_customer: props.id_customer,
    page_size: 200
  })

  if (response && Array.isArray(response)) {
    isEdit.value = true

    initMedCondition(response?.[0]?.data?.data?.med_condition_list, true)

    const id_memo_carte = response?.[0]?.data?.data?.memo_carte?.id_memo_carte
    if (id_memo_carte) data.value.id_memo_carte = id_memo_carte

    const id_pet_bio_info = response?.[1]?.id_pet_bio_info
    if (id_pet_bio_info) petBioInfoData.value.id_pet_bio_info = id_pet_bio_info
  }
}

const petWeightData = ref()
const fetchPetBioWeightData = async () => {
  try {
    const filterData = {
      id_pet: props.id_pet,
      id_customer: props?.id_customer
    }
    await petBioStore.fetchPetBio(filterData)
    if (!getPetBios.value || getPetBios.value.length === 0) return
    petWeightData.value = getPetBios.value
      .filter((bio) => bio.val_weight)
      .slice(0, 2)
  } catch (error) {
    await mtUtils.autoCloseAlert('データの取得中にエラーが発生しました')
  }
}

const petWeightInfoLabel = (data: any) => {
  if (!data) return '-'
  const weight =
    data.type_body_weight === 1
      ? (data.val_weight / 1000).toFixed(2) + ' kg'
      : parseFloat(data.val_weight).toFixed(2) + ' g'
  return `${weight} (${formatDateTime(data.datetime_measure)})`
}

const setWeightData = (data: any) => {
  if (data.type_body_weight === 1) {
    petBioInfoData.value.val_weight = data.val_weight / 1000
  } else {
    petBioInfoData.value.val_weight = data.val_weight
  }
  petBioInfoData.value.type_body_weight = data.type_body_weight
}

const openMemoCarteComparisonModal = async () => {
  await mtUtils.popup(ViewLargeMemoCarteComparison, {
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    datetimeInsert: props.datetimeInsert,
    requestDetailPage: props.requestDetailPage
  })
  updateCurrentCarte()
}

const updateCurrentCarte = () => {
  let updatedCarte = memoCarteStore.getFilteredMemoCartesV1?.[props.date_insert].others?.[props.datetimeInsert]
  let updatedClinicalFiles = memoCarteStore.getFilteredMemoCartesV1?.[props.date_insert]?.clinical_file_list.filter((file:ClinicalFile) => file.datetime_receive === props.datetimeInsert)
  if(updatedCarte) {
    data.value = {
      id_pet: updatedCarte?.memo_carte_list?.[0]?.id_pet || '',
      id_request: updatedCarte?.memo_carte_list?.[0]?.id_request || '',
      id_customer: updatedCarte?.memo_carte_list?.[0]?.id_customer || '',
      id_employee:
        updatedCarte?.memo_carte_list?.[0]?.id_employee ||
        defaultEmployee,
      datetime_memo_carte:
        updatedCarte?.memo_carte_list?.[0]?.datetime_memo_carte ||
        getDateTimeNow(),
      id_clinic:
        updatedCarte?.memo_carte_list?.[0]?.id_clinic ||
        Number(localStorage.getItem('id_clinic')) ||
        '',
      memo_sbj: updatedCarte?.memo_carte_list?.[0]?.memo_sbj || '',
      memo_obj: updatedCarte?.memo_carte_list?.[0]?.memo_obj || '',
      memo_ass: updatedCarte?.memo_carte_list?.[0]?.memo_ass || '',
      memo_other: updatedCarte?.memo_carte_list?.[0]?.memo_other || '',
      id_cli_common:
        updatedCarte?.memo_carte_list?.[0].id_cli_common || -1,
      illnessHistoryOptions:
        updatedCarte?.memo_carte_list?.[0]?.illnessHistoryOptions ||
        null,
      type_input: updatedCarte?.memo_carte_list?.[0]?.type_input || 2,
      id_memo_carte:
        updatedCarte?.memo_carte_list?.[0]?.id_memo_carte || -1
    }  

    id_pet_illness_history.value = [
      ...(updatedCarte?.memo_carte_list?.[0]?.id_pet_illness_history ||
        [])
    ]
    let val_weight

    if (updatedCarte?.pet_bio?.val_weight) {
      val_weight = convertWeightInG(
        updatedCarte?.pet_bio?.val_weight,
        updatedCarte?.pet_bio?.type_body_weight
      )
      if (typeof val_weight == 'string') {
        val_weight = parseFloat(val_weight).toFixed(2)
      }
    }
    petBioInfoData.value = {
      id_pet: updatedCarte?.pet_bio?.id_pet || null,
      id_customer: updatedCarte?.pet_bio?.id_customer || null,
      val_weight: val_weight || null,
      type_body_weight: updatedCarte?.pet_bio?.type_body_weight ?? 1,
      val_temperature: updatedCarte?.pet_bio?.val_temperature
        ? parseFloat(updatedCarte?.pet_bio?.val_temperature).toFixed(1)
        : '',
      val_respiration_rate:
        updatedCarte?.pet_bio?.val_respiration_rate || null,
      val_heartbeat_rate:
        updatedCarte?.pet_bio?.val_heartbeat_rate || null,
      val_pressure_systolic:
        updatedCarte?.pet_bio?.val_pressure_systolic || null,
      val_pressure_diastolic:
        updatedCarte?.pet_bio?.val_pressure_diastolic || null,
      val_pressure_mean_arterial:
        updatedCarte?.pet_bio?.val_pressure_mean_arterial || null,
      val_blood_oxygen_level:
        updatedCarte?.pet_bio?.val_blood_oxygen_level || null,
      val_blood_carbon_dioxide_level:
        updatedCarte?.pet_bio?.val_blood_carbon_dioxide_level || null,
      id_clinic:
        updatedCarte?.pet_bio?.id_clinic ||
        localStorage.getItem('id_clinic') ||
        '',
      id_pet_bio_info: updatedCarte?.pet_bio?.id_pet_bio_info || null,
      datetime_measure: updatedCarte?.pet_bio?.datetime_measure
        ? formatDateWithTime(
            updatedCarte?.pet_bio?.datetime_measure,
            'YYYY/MM/DD HH:mm:ss'
          )
        : ''
    }
    if (updatedClinicalFiles) {
      multipleImage.value.length = 0
      filePaths.value.length = 0
      updatedClinicalFiles.forEach((v: ClinicalFile) => {
        const newClinical = { ...v, old: true }
        multipleImage.value.push(newClinical)
        filePaths.value.push(newClinical.file_path)
      })
    }

    if (clinicCommonStore.allCliCommonMedConditionOptionList.length > 0) {
      initMedCondition(updatedCarte?.medical_condition, true)
    }

    currentData.value = {
      data: JSON.parse(JSON.stringify(data.value)),
      petBioInfoData: JSON.parse(JSON.stringify(petBioInfoData.value)),
      medConditionData: JSON.parse(JSON.stringify(medConditionData)),
      petSelected: JSON.parse(JSON.stringify(petSelected.value)),
      customerSelected: JSON.parse(JSON.stringify(customerSelected.value)),
      clinicCommonList: JSON.parse(JSON.stringify(clinicCommonList.value)),
      multipleImage: JSON.parse(JSON.stringify(multipleImage.value)),
      id_pet_illness_history:JSON.parse(JSON.stringify(id_pet_illness_history.value))
    }
  }
}

const generatePetCartePdf = async (mode: 'download' | 'print') => {
  mtUtils.popup(UpdatePdfPetCarteSetting, {
    generatePdfAndClose: true,
    dateInsert: props.date_insert,
    datetimeInsert: props.datetimeInsert,
    mode
  })
}

onMounted(async () => {
  if (employeeRef.value) {
    employeeRef.value.$el.focus();
  }
  if (dateRef.value) {
    dateRef.value.$el.focus(); 
  }
  if (pullDownRef.value) {
    pullDownRef.value.$el.focus();
  }
  if (diseaseRef.value) {
    diseaseRef.value.$el.focus(); 
  }

  try {
    // Temporarily disable the autosave feature while waiting for the data-saving logic to be refactored.
    // Commenting out the autosave timer and related logic.
    // console.log('CreateMemoCarte: create autosave timer')
    // nextTick(() => {
    //   watch(
    //     [
    //       data,
    //       id_pet_illness_history,
    //       petBioInfoData,
    //       medConditionData,
    //       petSelected,
    //       customerSelected,
    //       multipleImage
    //     ],
    //     () => {
    //       onUserActivity()
    //     },
    //     { deep: true }
    //   )
    // })
    // always open the right side
    rightSidebarOpen.value = true;
  
    // Commenting out the autosave timer and related logic.
    // autoSaveTimer = setInterval(autoSaveMemoCarte, autoSaveMillSecs)
    if (props.date_insert && props.date_insert != '') isEdit.value = true
    await cliCommonStore.fetchPreparationCliCommonList({
      code_cli_common: [11, 14]
    })

    // SET DEFAULT VAL WEIGHT
    petBioInfoData.value.val_weight = null

    data.value.id_cli_common = typeMemoCarte.value?.[0]?.id_cli_common
    if (isEdit.value) {
      data.value = {
        id_pet: props.data_cartes?.memo_carte_list?.[0]?.id_pet || '',
        id_request: props.data_cartes?.memo_carte_list?.[0]?.id_request || '',
        id_customer: props.data_cartes?.memo_carte_list?.[0]?.id_customer || '',
        id_employee:
          props.data_cartes?.memo_carte_list?.[0]?.id_employee ||
          defaultEmployee,
        datetime_memo_carte:
          props.data_cartes?.memo_carte_list?.[0]?.datetime_memo_carte ||
          getDateTimeNow(),
        id_clinic:
          props.data_cartes?.memo_carte_list?.[0]?.id_clinic ||
          Number(localStorage.getItem('id_clinic')) ||
          '',
        memo_sbj: props.data_cartes?.memo_carte_list?.[0]?.memo_sbj || '',
        memo_obj: props.data_cartes?.memo_carte_list?.[0]?.memo_obj || '',
        memo_ass: props.data_cartes?.memo_carte_list?.[0]?.memo_ass || '',
        memo_other: props.data_cartes?.memo_carte_list?.[0]?.memo_other || '',
        id_cli_common:
          props.data_cartes?.memo_carte_list?.[0].id_cli_common || -1,
        illnessHistoryOptions:
          props.data_cartes?.memo_carte_list?.[0]?.illnessHistoryOptions ||
          null,
        type_input: props.data_cartes?.memo_carte_list?.[0]?.type_input || 2,
        id_memo_carte:
          props.data_cartes?.memo_carte_list?.[0]?.id_memo_carte || -1
      }

      id_pet_illness_history.value = [
        ...(props.data_cartes?.memo_carte_list?.[0]?.id_pet_illness_history ||
          [])
      ]
      let val_weight

      if (props.data_cartes?.pet_bio?.val_weight) {
        val_weight = convertWeightInG(
          props.data_cartes?.pet_bio?.val_weight,
          props.data_cartes?.pet_bio?.type_body_weight
        )
        if (typeof val_weight == 'string') {
          val_weight = parseFloat(val_weight).toFixed(2)
        }
      }
      petBioInfoData.value = {
        id_pet: props.data_cartes?.pet_bio?.id_pet || null,
        id_customer: props.data_cartes?.pet_bio?.id_customer || null,
        val_weight: val_weight || null,
        type_body_weight: props.data_cartes?.pet_bio?.type_body_weight ?? 1,
        val_temperature: props.data_cartes?.pet_bio?.val_temperature
          ? parseFloat(props.data_cartes?.pet_bio?.val_temperature).toFixed(1)
          : '',
        val_respiration_rate:
          props.data_cartes?.pet_bio?.val_respiration_rate || null,
        val_heartbeat_rate:
          props.data_cartes?.pet_bio?.val_heartbeat_rate || null,
        val_pressure_systolic:
          props.data_cartes?.pet_bio?.val_pressure_systolic || null,
        val_pressure_diastolic:
          props.data_cartes?.pet_bio?.val_pressure_diastolic || null,
        val_pressure_mean_arterial:
          props.data_cartes?.pet_bio?.val_pressure_mean_arterial || null,
        val_blood_oxygen_level:
          props.data_cartes?.pet_bio?.val_blood_oxygen_level || null,
        val_blood_carbon_dioxide_level:
          props.data_cartes?.pet_bio?.val_blood_carbon_dioxide_level || null,
        id_clinic:
          props.data_cartes?.pet_bio?.id_clinic ||
          localStorage.getItem('id_clinic') ||
          '',
        id_pet_bio_info: props.data_cartes?.pet_bio?.id_pet_bio_info || null,
        datetime_measure: props.data_cartes?.pet_bio?.datetime_measure
          ? formatDateWithTime(
              props.data_cartes?.pet_bio?.datetime_measure,
              'YYYY/MM/DD HH:mm:ss'
            )
          : ''
      }
      if (props.clinical_file?.length > 0) {
        props.clinical_file.forEach((v) => {
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
        initMedCondition(props?.data_cartes?.medical_condition)
      }
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

    data.value.id_customer = props.id_customer
    data.value.id_pet = props.id_pet
    if (props.id_request) data.value.id_request = props.id_request

    if (getIllnessHistorys.value.length === 0) {
      await illnessHistoryStore.fetchIllnessHistorys({
        id_pet: petSelected.value?.id_pet,
        id_customer: customerSelected.value?.id_customer
      })
    }
    if (props.id_memo_carte === -1) {
      if (
        getLeftSideIllnessHistoryList.value &&
        getLeftSideIllnessHistoryList.value.length > 0
      ) {
        let defaultIllnessHistory = getLeftSideIllnessHistoryList.value
          .filter((v: IllnessHistoryType) => v.id_pet_illness_history)
          .map((v: IllnessHistoryType) => v.id_pet_illness_history)

        data.value.id_pet_illness_history = defaultIllnessHistory
        if (!isEdit.value) {
          id_pet_illness_history.value = [...defaultIllnessHistory]
        }
      }
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

    event_bus.on('update-memo-field', (payload, currentData) => {
      if (payload.summary) {
        if (currentData) {
          data.value = currentData.data
          petBioInfoData.value = currentData.petBioInfoData
          petSelected.value = currentData.petSelected
          customerSelected.value = currentData.customerSelected
          clinicCommonList.value = currentData.clinicCommonList
          medConditionData.splice(
            0,
            medConditionData.length,
            ...currentData.medConditionData
          )
          multipleImage.value = currentData.multipleImage || []
          id_pet_illness_history.value = currentData.id_pet_illness_history
        }

        const sections = parseSummary(payload.summary)
        Object.entries(sections).forEach(([field, content]) => {
          if (content && !content.includes('情報が関連していません')) {

            if (data.value[field]) {
              data.value[field] += '<br/><br/>' + content
            } else {
              data.value[field] = content
            }            
          }
        })
      }
    })

    // fetch weight history
    await fetchPetBioWeightData()

    // 乃口 チェリー ちゃん
    // 松本 梅子 ちゃん

    currentData.value = {
      data: JSON.parse(JSON.stringify(data.value)),
      petBioInfoData: JSON.parse(JSON.stringify(petBioInfoData.value)),
      medConditionData: JSON.parse(JSON.stringify(medConditionData)),
      petSelected: JSON.parse(JSON.stringify(petSelected.value)),
      customerSelected: JSON.parse(JSON.stringify(customerSelected.value)),
      clinicCommonList: JSON.parse(JSON.stringify(clinicCommonList.value)),
      multipleImage: JSON.parse(JSON.stringify(multipleImage.value)),
      id_pet_illness_history:JSON.parse(JSON.stringify(id_pet_illness_history.value))
    }
    nextTick(() => {
      const toolbars = document.querySelectorAll('.q-editor__toolbar')
      toolbars.forEach((toolbar) => {
        toolbar.style.position = 'relative'
        const copyToolbarGroups = toolbar.querySelectorAll('.q-editor__toolbar-group')
        let copyToolbarGroup = null
        copyToolbarGroups.forEach(group => {
          if (group.querySelector('.copy-field-icon')) {
            copyToolbarGroup = group
            group.style.position = 'unset'
            const copyIcon = copyToolbarGroup.querySelector('.copy-field-icon')
            copyIcon.style.position = 'absolute'
            copyIcon.style.right = '10px'
            copyIcon.style.top = '10px'
          }
        })
      })
    })
    if (props.autoSaveOnMount) {
      nextTick(() => {
        submitDuplicateCart()
      })
    }
  } catch (error) {}

  window.addEventListener('resize', handleScreenChange)
})

onBeforeUnmount(() => {
  event_bus.off('update-memo-field')
  event_bus.off('close-create-carte-modal')
  conversationStore.setCreateMemoCarteModal(false)
  if (autoSaveTimer != null) {
    console.log('CreatteMemoCarte clear autosave timer')
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
  window.removeEventListener('mousemove', onUserActivity)
  window.removeEventListener('click', onUserActivity)
  window.removeEventListener('keydown', onUserActivity)
  window.removeEventListener('touchstart', onUserActivity)
  window.removeEventListener('resize', handleScreenChange)
})

const toggleLeftSidebar = () => {
  leftSidebarOpen.value = !leftSidebarOpen.value
}

const toggleRightSidebar = () => {
  rightSidebarOpen.value = !rightSidebarOpen.value
}
const mainContentStyle = computed(() => ({
  marginLeft: leftSidebarOpen.value ? '380px' : '0',
  marginRight: rightSidebarOpen.value ? '250px' : '0',
  transition: 'margin 0.3s ease'
}))
const scrollToSection = (field) => {
  const section = document.getElementById(field);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  } else {
    console.warn(`Section with id ${field} not found`);
  }
};

const selectedMemoCarte = ref(null);

const handleMemoCarteSelection = (selectedData: { id_memo_carte: number, filterData: any, memo: any,filterFiles:any }) => {
  selectedMemoCarte.value = selectedData.memo; 
  fetchMemoCarteData(selectedData.id_memo_carte, selectedData.filterData,selectedData.filterFiles,);
};


const fetchMemoCarteData = async (idMemoCarte: number, filterData: any,filterFiles:any) => {
  try {
    isEdit.value = false
    isSelect.value = true;
    const response = getMemoCartes.value.find(v => v.id_memo_carte == idMemoCarte);
    data.value = {
      ...response,
    };
    id_pet_illness_history.value = response.id_pet_illness_history ?? [];
    let val_weight;

    if (filterData?.pet_bio?.val_weight) {
      val_weight = convertWeightInG(
        filterData?.pet_bio?.val_weight,
        filterData?.pet_bio?.type_body_weight
      );
      if (typeof val_weight === 'string') {
        val_weight = parseFloat(val_weight).toFixed(2);
      }
    }

    petBioInfoData.value = {
      id_pet: filterData?.pet_bio?.id_pet || null,
      id_customer: filterData?.pet_bio?.id_customer || null,
      val_weight: val_weight || null,
      type_body_weight: filterData?.pet_bio?.type_body_weight ?? 1,
      val_temperature: filterData?.pet_bio?.val_temperature
        ? parseFloat(filterData?.pet_bio?.val_temperature).toFixed(1)
        : '',
      val_respiration_rate: filterData?.pet_bio?.val_respiration_rate || null,
      val_heartbeat_rate: filterData?.pet_bio?.val_heartbeat_rate || null,
      val_pressure_systolic: filterData?.pet_bio?.val_pressure_systolic || null,
      val_pressure_diastolic: filterData?.pet_bio?.val_pressure_diastolic || null,
      val_pressure_mean_arterial: filterData?.pet_bio?.val_pressure_mean_arterial || null,
      val_blood_oxygen_level: filterData?.pet_bio?.val_blood_oxygen_level || null,
      val_blood_carbon_dioxide_level: filterData?.pet_bio?.val_blood_carbon_dioxide_level || null,
      id_clinic: filterData?.pet_bio?.id_clinic || localStorage.getItem('id_clinic') || '',
      id_pet_bio_info: filterData?.pet_bio?.id_pet_bio_info || null,
      datetime_measure: filterData?.pet_bio?.datetime_measure
        ? formatDateWithTime(filterData?.pet_bio?.datetime_measure, 'YYYY/MM/DD HH:mm:ss')
        : ''
    };

    if (filterFiles?.length > 0) {
      filterFiles.forEach((v) => {
        const newClinical = { ...v, old: true };
        multipleImage.value.push(newClinical);
        filePaths.value.push(newClinical.file_path);
      });
    } else {
      multipleImage.value = [];
      filePaths.value = [];
    }
    
    const code_cli_common = filterData?.code_cli_common || [11, 14];

    if (clinicCommonStore.allCliCommonMedConditionOptionList.length === 0) {
      await clinicCommonStore.fetchMedConditionCliCommonList({
        code_cli_common: code_cli_common,
      });
    }

    if (clinicCommonStore.allCliCommonMedConditionOptionList.length > 0) {
     initMedCondition(filterData?.medical_condition, true);
    }
    currentData.value = {
    data: JSON.parse(JSON.stringify(data.value)),
    petBioInfoData: JSON.parse(JSON.stringify(petBioInfoData.value)),
    medConditionData: JSON.parse(JSON.stringify(medConditionData)),
    petSelected: JSON.parse(JSON.stringify(petSelected.value)),
    customerSelected: JSON.parse(JSON.stringify(customerSelected.value)),
    clinicCommonList: JSON.parse(JSON.stringify(clinicCommonList.value)),
    multipleImage: JSON.parse(JSON.stringify(multipleImage.value)),
    id_pet_illness_history:JSON.parse(JSON.stringify(id_pet_illness_history.value))
  }

  } catch (error) {
    console.error('Error fetching memo carte data:', error);
  }
};


const onCameraVideoModalClose = (newClincalFile: Object) => {
  multipleImage.value.push(newClincalFile);
  filePaths.value.push(newClincalFile?.file_path);
}
const uploadClinicalFileWithStream = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  if (!id_clinic) {
    mtUtils.autoCloseAlert('対象施設が選択されていません。')
    return
  }
  const transformedData = {
    pet_illness_history: {
      id_pet_illness_history: props.id_pet_illness_history, 
    },
    id_clinic: id_clinic,
    petSelected: {
      id_customer: props.id_customer, 
      id_pet: props.id_pet,
      name_pet: '',     
    },
  };
  mtUtils.mediumPopup(CameraVideoModal, {
    pet_illness_history: transformedData.pet_illness_history.id_pet_illness_history,
    id_clinic: transformedData.id_clinic,
    petSelected: transformedData.petSelected,
    modalClosedCallback: onCameraVideoModalClose,
    persistent: true,
  });

}
const updateClinicalFileDirect = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  const data = {
    id_pet: Number(props.id_pet),
    id_pet_illness_history: [Number(props.id_pet_illness_history)],
    id_customer: Number(props.id_customer),
    id_clinic: id_clinic
  }
  await mtUtils.mediumPopup(UpdateClinicalFileModal, {
    data: data,
    onCompleteCallback: onCameraVideoModalClose
  })
}

const handleScreenChange = () => {
  showHeaderIconsText.value = window.innerWidth >= MIN_WIDTH_FOR_ICONS_TEXT
}

const handleOpenViewAllCartePerDateList = () => {
  openViewAllCartePerDateList(customerSelected.value, petSelected.value)
}

const copyCurrentField = (content: string) => {
  copyText(removeHtmlTag(content))
}

</script>
<template>
  <div class="modal-layout">
    <!-- Left Sidebar -->
    <div
      class="custom-sidebar left-sidebar"
      :class="{ open: leftSidebarOpen }"
      style="overflow: hidden;"
    >
    <div class="sidebar-header w-full" style="margin-left: 10px;" >
        <q-btn
          flat
          round
          dense
          @click.stop="toggleLeftSidebar"
          class="arrow-btn"
          style="background-color: lightgray; border-radius: 3px;  padding: 2px;"
          square
          align="between"
          unelevated
        >
        <div style="margin-left: 295px;">

          非表示
        <q-icon name="chevron_left"  />
        </div>
        </q-btn>
    </div>
    <LeftCreateMemoCarteModal :key="sidebarKey"  :id_pet="props.id_pet" :id_customer = "props.id_customer"  @setMemoCarteContent="handleMemoCarteSelection" />
    </div>

    <!-- Main Content Area -->
    <div class="main-content">
      <MtModalHeader @closeModal="closeModal(false)" class="memo-carte-header col-auto">
        <q-toolbar-title class="text-grey-900 title3 bold row items-center header-title">
          カルテ：
          <span @click="copyText(data.number_memo_carte)" class="cursor-pointer">
            {{ data?.number_memo_carte }}
            <q-icon name="content_copy" class="blue" />
          </span>
          <span v-if="data.id_pet" class="q-ml-md" style="min-width: 0;">
            <MtPetInfoDynamic
              :data="data"
              class="ellipsis" 
            />
          </span>
        </q-toolbar-title>
        <div class="memoFields-container">
          <q-btn
            v-for="(memo, index) in memoFields"
            :key="index"
            color="primary"
            flat
            class="q-px-sm bg-primary text-white memoBtn"
            size="11px"
            @click="scrollToSection(memo.field)"
          >
            {{ memo.label.charAt(0) }}
          </q-btn>
        </div>
        <div>
        <q-btn flat 
          style="left: 10px;" 
          size="11px"
          @click="handleOpenViewAllCartePerDateList"
        >
          日
        </q-btn>
        <q-btn @click="openTemplateTextModal" flat class="q-mx-sm">
          <q-icon name="playlist_add" class="q-mr-sm" /><span v-if="showHeaderIconsText">テンプレ</span>
        </q-btn>
        <q-btn flat unelevated v-if="typeCarteConfigList[8]?.isChecked"  @click="$refs.fileInput.click()"  :disable="disableClinicalFileBtn" class="q-mr-sm">
          <q-icon name="insert_drive_file" size="20px" />
          <span v-if="showHeaderIconsText">画像資料</span>
          <input
            type="file"
            style="display: none"
            ref="fileInput"
            multiple
            @change="onFileChange($event)"
            />
        </q-btn>
        <q-btn flat unelevated @click="openFabricMemoCarteModal" class="q-mr-sm">
          <q-icon name="add_photo_alternate" class="q-mr-sm" />
          <span v-if="showHeaderIconsText">シェーマ</span>
        </q-btn>
        <q-btn
          @click="duplicateMemoCarte"
          flat
          class="q-mr-sm"
          v-if="!!props.data_cartes?.memo_carte_list?.length"
        >
          <q-icon name="copy_all" class="q-mr-sm" /><span v-if="showHeaderIconsText">複製</span>
        </q-btn>
        <q-btn
          @click="copyMemoCarte"
          flat
          class="q-mr-sm"
          v-if="!!props.data_cartes?.memo_carte_list?.length"
        >
          <q-icon name="content_copy" class="q-mr-sm" /><span v-if="showHeaderIconsText">コピー</span>
        </q-btn>
        <q-btn
          @click="openMemoCarteComparisonModal"
          flat
          class="q-mr-sm"
          v-if="!!props.data_cartes?.memo_carte_list?.length"
        >
          <q-icon name="compare" class="q-mr-sm" /> <span v-if="showHeaderIconsText">比較</span>
        </q-btn>
        <q-btn
          @click="openCreateTaskModal"
          unelevated
          class="q-mr-sm"
          v-if="props?.id_memo_carte != -1"
        >
          <q-icon name="add" class="q-mr-sm" />
          <span>タスク</span>
        </q-btn>
        <q-btn
          unelevated
          flat
          round
          class="q-mr-sm" 
          @click="openMemoCarteMoveableModal"
          v-if="props?.id_memo_carte != -1"
        >
          <q-icon name="chrome_reader_mode" />
        </q-btn>
       
        <q-btn
          v-if="isEdit"
          @click="openMenu"
          icon="more_horiz"
          flat
          round
          class="q-mr-sm"
        />
        </div>
      </MtModalHeader>

      <!-- Arrow Buttons Below Header -->
      <div class="arrow-buttons" :class="['flex', leftSidebarOpen ? 'justify-end' : 'justify-between']" >
        <div v-if="!leftSidebarOpen" style="margin-left: 10px;">
          <q-btn
            flat
            round
            dense
            @click.stop="toggleLeftSidebar"
            class="arrow-btn"
            icon="chevron_right"
          >
          </q-btn>
        </div> 
        <div v-if="!rightSidebarOpen" style="margin-right: 10px;">
          <q-btn
            flat
            round
            dense
            @click.stop="toggleRightSidebar"
            class="arrow-btn"
            icon="chevron_left"
          >
          </q-btn>
        </div>
      </div>

  <q-card-section
    class="content file-container"
    :class="{ 'drag-over': isDragging }"
    :style="mainContentStyle"
  >
    <q-icon
      v-if="isDragging"
      class="upload-icon"
      size="xl"
      name="cloud_upload"
    />
    <div
      class="row q-gutter-md"
    >
      <div class="col-2" v-if="props.id_memo_carte != -1">
        <LeftUpdateMemoCarteModal @setMemoCarteContent="setMemoCarteContent" />
      </div>
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
                  required
                  :rules="[aahValidations.validationRequired]" 
                />
              </div>
              <div class="col-3">
                <MtFormInputDate
                  v-model:date="data.datetime_memo_carte"
                  label="メモカルテ記録日時"
                  ref="dateRef"
                  required
                  :rules="[aahValidations.validationRequired]" 

                />
              </div>
              <div class="col-3">
                <MtFormPullDown
                  v-model:selected="data.id_cli_common"
                  :options="typeMemoCarte"
                  label="カルテ区分"
                  ref="pullDownRef"
                  custom-option
                  required
                  :rules="[aahValidations.validationRequired]" 
                  autofocus
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
                  ref="diseaseRef"
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
            <div class="col-3">
              <MtFormInputNumber
                label="体重"
                decimalSize="2"
                v-model:value="petBioInfoData.val_weight"
                @blur="updateValue('val_weight')"
              />
            </div>

            <div
              class="col-9"
              style="display: flex; align-items: center; gap: 16px"
            >
              <div class="">
                <MtInputForm
                  type="radio"
                  :items="typeBodyWeight"
                  v-model="petBioInfoData.type_body_weight"
                  required
                  :rules="[aahValidations.validationRequired]"
                />
              </div>
              <div
                class=""
                v-if="petWeightData && petWeightData.length > 0"
                v-for="weight in petWeightData"
              >
                <q-btn
                  :label="petWeightInfoLabel(weight)"
                  flat
                  no-caps
                  size="12px"
                  class="bg-grey-200 text-grey-800 q-py-none"
                  @click="setWeightData(weight)"
                >
                </q-btn>
              </div>
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
            <div class="w-full text-right">
              <div
                class="recording-btn bg-primary flex column justify-center items-center cursor-pointer custom-mic-button"
                @click="handleRecordingClick()"
              >
                <q-img
                  src="@/assets/img/request/dictation_mic.png"
                  fit="none"
                  width="16px"
                  height="16px"
                />
                <span class="text-white custom-text-mic">新規</span>
              </div>
            </div>
            <template v-for="(memo, index) in memoFields" :key="memo.field">
              <template v-if="showMemoField(memo.field)">
                <div
                  :id="memo.field"
                  :class="index !== 0 ? 'q-mt-md' : ''"
                  class="text-weight-bold q-mb-sm"
                >
                  {{ memo.label }}
                </div>
                <div class="q-my-md btn-container">
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
                        fetchCommonCliRecords(
                          cliCodeCommon.code_func1,
                          cliCodeCommon.flg_func1,
                          index
                        )
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
                                    )?.backgroundColor || '#0369a1'
                                  : '#0369a1',
                              color:
                                medConditionData[index][idx]
                                  .type_med_condition ==
                                cliCodeCommon.code_func1
                                  ? findTypeMedCondition(
                                      medConditionData[index][idx].text1
                                    )?.color ?? 'white'
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
                    ['copy'],
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
                  <template v-slot:copy>
                    <q-icon name="content_copy" class="text-white cursor-pointer copy-field-icon" @click="copyCurrentField(data[memo.field])" />
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
          </div>
        </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white"  :style="mainContentStyle">
        <div class="text-center modal-btn">
          <q-btn
            outline
            class="bg-grey-100 text-grey-800"
            @click="closeModal(false)"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn unelevated color="primary" class="q-ml-md" @click="submit(true)">
            <span>保存して閉じる</span>
          </q-btn>
          <q-btn unelevated color="primary" class="q-ml-md" @click="submit(false)">
            <span>保存</span>
          </q-btn>
        </div>
  </q-card-section>
      <!-- </div> -->

      <AddTextTemplateModal
        v-model:value="addTemplateModalFlg"
        modelTitle="メモカルテ テンプレート"
        :options="textTemplatesList"
        :data="data"
        @update:memo="handleUpdateMemo"
      />
    </div>

    <!-- Right Sidebar -->
    <div
      class="custom-sidebar right-sidebar"
      :class="{ open: rightSidebarOpen }"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
    >
      <div class="sidebar-header q-px-sm">
        <q-btn
          flat
          round
          dense
          @click.stop="toggleRightSidebar"
          class="arrow-btn full-width"
          style="background-color: lightgray;border-radius: 3px;  padding-left: 10px;padding-right: 6px;"
          square
          align="between"
          unelevated
        >
          <div class="flex justify-between items-center full-width">
            一覧で表示
            <q-icon name="chevron_right" />
          </div>
        </q-btn>
      </div>
      <div class="right-sidebar-content" style="overflow-y: auto;">
        <div class="uploaded-images">
            <template v-for="(file, index) in multipleImage" :key="index">
              <!-- other file type -->
              <div
                class="relative-position"
                style="border: 2px solid lightgray;border-radius:6px;" 
                v-if="file && file?.type_file && file.type_file == 99"
              >
                <div>
                  <q-icon
                    name="receipt_long"
                    color="red"
                    size="20px"
                    class="q-mr-sm"
                  />
                  {{ file.name_file }}
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
              <!-- video and image file type -->
              <div
                class="flex items-center relative-position"
                style="border: 2px solid lightgray;border-radius:6px;" 
                v-else
              >
                <video v-if="file && file?.type_file && file.type_file == 2" style="max-width: 100%" controls>
                  <source :src="file.old ? file.file_path : filePaths[index]" :type="file.type || 'video/mp4'" class="xy thumbnail-style" />
                </video>
                <img 
                  v-else
                  :src="filePaths[index]"
                  spinner-color="white"
                  class="q-ml-md"
                  :style="{
                  backgroundColor: 'gray',
                  width: '200px',
                  height: '200px',
                  objectFit: 'cover',
                 
                }"
                />
                
                <q-badge
                  color="red"
                  transparent
                  floating
                  class="cursor-pointer file-delete-btn"
                  @click="onFileRemoved(index, file.id_clinical_file)"
                >
                  <q-icon name="close" />
                </q-badge>
              </div>
            </template>
            <div class="row q-mt-xs justify-center">
              <q-btn
                  class="full-height bg-grey-200 q-mx-md"
                  @click="updateClinicalFileDirect()"
                  size="24"
                  flat
                  round
                >
                  <q-icon
                    name="cloud_upload"
                    class="text-grey-800 clinicalFileActionIcon"
                    size="sm"
                  />
              </q-btn>
              <q-btn
                class="full-height bg-grey-200 q-mx-md"
                @click="uploadClinicalFileWithStream()"
                size="24"
                flat
                round
              >
                <q-icon
                  name="add_a_photo"
                  class="text-grey-800 clinicalFileActionIcon"
                  size="sm"
                />
              </q-btn>
            </div>
        </div>
      </div>
    </div>
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
  </div>
</template>

<style lang="scss" scoped>
.modal-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

/* Custom Sidebar Styles */
.custom-sidebar {
  position: fixed;
  top: 95px;
  bottom: 25px;
  background-color:white;
  transform: translateX(-100%);
  transition: transform 0.3s ease;
  z-index: 1000;
  overflow-y: auto;
  opacity: 0;

  &.right-sidebar {
    right: 25px;
    width: 270px;
    left: auto;
    transform: translateX(100%);
  }

  &.open.left-sidebar {
    transform: translateX(0);
    opacity: 1;
  }

  &.open.right-sidebar {
    transform: translateX(0);
    opacity: 1;
  }

  .close-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
  }
}

.left-sidebar {
  width: 380px;
}

.right-sidebar-content {
  padding: 16px;
}

.uploaded-images {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.uploaded-image {
  border: 1px solid #ccc;
  border-radius: 4px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  overflow-y: auto;
  transition: margin 0.3s ease;
}

.arrow-btn {
  cursor: pointer;
  transition: transform 0.2s ease;
}

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
.file-container {
  border: 2px dashed transparent;
  transition: border-color 0.3s ease;
  position: relative;

  &.drag-over {
    border-color: #3e7fff;
    background-color: rgba(62, 127, 255, 0.15);
  }

  .upload-icon {
    position: absolute;
    color: #3e7fff;
    z-index: 2;
    background-color: rgba(62, 127, 255, 0.25);
    border-radius: 100%;
    padding: 8px;
    left: 50%;
    bottom: 12px;
    transform: translateX(-50%);
  }
}
.custom-mic-button-container {
  width: 100%;
  justify-items: right;
}
.custom-mic-button {
  border-radius: 50%;
  padding: 9px 5px;
  height: 55px;
  width: 55px;
  position: absolute;
  right: 5px;
  top: 20px;
}
.custom-text-mic {
  font-size: 12px;
}
.right-sidebar-content h6 {
  margin-bottom: 16px;
}

.btn-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.memoFields-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

@media (max-width: 600px) {
  .memoFields-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1080px) { 
  .custom-sidebar {
    top: 85px;
  }
}
@media (max-width: 1680px) { 
  .custom-sidebar {
    top: 70px;
  }
}
@media (max-width: 1400px) { 
  .custom-sidebar {
    top: 85px;
  }
}

@media (max-width: 768px) { 
  .custom-sidebar {
    top: 127px;
  }
}

.file-delete-btn {
  top: 6px;
  right: 6px;
}

.header-title {
  flex-wrap: nowrap;
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
    .q-btn:not(.memoBtn) {
      padding: 4px 0;
      margin-right: 2px;
      :deep(.q-icon) {
        font-size: 12px;
      }
    }

    .memoBtn {
      :deep(.q-btn__content) {
        font-size: 6px !important;
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
