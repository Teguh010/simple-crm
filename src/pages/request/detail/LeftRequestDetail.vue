<script setup lang="ts">
import { computed, defineAsyncComponent, defineProps, onMounted, onUnmounted, ref, withDefaults } from 'vue'
import { debounce, groupBy, values } from 'lodash'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Platform } from 'quasar'

// Components
import OptionModal from '@/components/OptionModal.vue'

import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import ServiceDetailPocketList from '@/components/PocketList/ServiceDetailPocketList.vue'
import LabResultPocketList from '@/components/PocketList/LabResultPocketList.vue'
import PrescriptionPocketList from '@/components/PocketList/PrescriptionPocketList.vue'
import ClinicalFilePocketList from '@/components/PocketList/ClinicalFilePocketList.vue'

// Stores
import useEmployeeStore from '@/stores/employees'
import useIllnessHistoryStore from '@/stores/illness-history'
import useClinicalFilesUploaderStore from '@/stores/clinical-files-uploader'
import useDiseaseStore from '@/stores/diseases'
import useMemoCarteStore from '@/stores/memo-cartes'
import useCustomerStore from '@/stores/customers'

// Utilities and Types
import mtUtils from '@/utils/mtUtils'
import { formatDateWithTime, getCustomerNameById, getDateToday, getPetFirstName } from '@/utils/aahUtils'
import { typeDiagnosisConfidence } from '@/utils/enum'
import { IllnessHistoryType, PetType, RequestDetailPageType } from '@/types/types'
import InjectPocketList from '@/components/PocketList/InjectPocketList.vue'
import UpdIllnessHistory from '@/pages/request/detail/UpdIllnessHistory.vue'
import { event_bus } from '@/utils/eventBus'
import useRequestStatus from '@/stores/request-statuses'

// Lazy-loaded Components
const closeSidebar = (e: any) => {
  console.log("clicked: ")
  leftSidebar.value = !leftSidebar.value  
}

const UpdateClinicalFileModal = defineAsyncComponent(
  () => import('@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue')
)
const GetPdfIllnessHistory = defineAsyncComponent(
  () => import('@/pages/request/GetPdfIllnessHistory.vue')
)
const UpdateIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue')
)
const QuickIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/QuickIllnessHistoryModal.vue')
)
const ZoomImageModal = defineAsyncComponent(
  () => import('@/pages/message/ZoomImageModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/ViewPetDetailModal.vue')
)
const QrCodeShowModal = defineAsyncComponent(
  () => import('@/pages/petInfo/clinicalFilesUploaderUrl/QrCodeShowModal.vue')
)
const CameraVideoModal = defineAsyncComponent(
  () => import('@/pages/petInfo/clinicalFilesUploaderUrl/CameraVideoModal.vue')
)

const props = withDefaults(
  defineProps<{
    illnessId: {
    type: Number,
    required: true,
  },
    rightSidebar: boolean
    petSelected?: PetType
    showHeader?: boolean
    requestDetailPage?: RequestDetailPageType
    scrollAreaHeight: {
      height: string
    }
  }>(),
  {
    rightSidebar: false,
    showHeader: true,
    petSelected: () => {
      return {} as PetType
    },
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    },
    scrollAreaHeight: () => {
      return {
        height: ''
      }
    }
  }
)
const reduceHeightForTablet = ref(Platform.is.mobile ? 10 : 0)
const emit = defineEmits(['initCall'])
const route = useRoute()
const leftSidebar = ref(false)
const leftSection = ref(true)
const leftSidebarRef = ref()
const openSidebarButtonRef = ref()
const illnessHistoryList = ref([])

const requestStatusStore = useRequestStatus()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const clinicalFilesUploaderStore = useClinicalFilesUploaderStore()
const employeeStore = useEmployeeStore()
const diseaseStore = useDiseaseStore()
const customerStore = useCustomerStore()
const { getCustomer, getPet } = storeToRefs(customerStore)
const {
  getIllnessHistory,
  getLeftSideIllnessHistoryList,
  getIllnessHistorys,
} = storeToRefs(illnessHistoryStore)
const { getDiseasImages } = storeToRefs(diseaseStore)

const labResultList = computed(() =>
  groupBy(getIllnessHistory.value?.lab_result_list, 'category2_lab.id_category')
)
const diagnosisConfidenceName = (value: number) =>
  typeDiagnosisConfidence.find((v) => v.value === value)?.label
const employeeName = (value: string) =>
  employeeStore.getAllEmployees.find((v) => v.value === value)?.label
// const showSurgeryButton = computed(() => {
//   if (getIllnessHistory.value?.service_detail_list?.length > 0) {
//     if (
//       some(getIllnessHistory.value?.service_detail_list, (v) => v.flg_surgery)
//     )
//       return true
//   }
//   return false
// })
const selectCheckBoox = () => {
  getLeftSideIllnessHistoryList.value.forEach((item: any) => {
    const matchedObj = getIllnessHistorys.value.find(
      (element) =>
        element.id_pet_illness_history == item.id_pet_illness_history
    )
    if (matchedObj) {
      matchedObj.isChecked = true
    }
  })

  if (illnessHistoryList.value.length == 0) {
    illnessHistoryList.value = illnessHistoryStore.getIllnessHistorys.map((ih) => {
      let isChecked = ih.isChecked
      const status = requestStatusStore.getRequestStatuses?.find((status) => status.id_status)

      if (values(status?.ui_state?.illness_history_list)?.includes(ih.id_pet_illness_history.toString())) isChecked = true
      return { ...ih, isChecked }
    })
  }
}

event_bus.on('resetIllnessHistory', () => {
  illnessHistoryList.value = []
})

event_bus.on('selectIllnessHistory', async (selectedIllness: {illnessHistory: IllnessHistoryType, updateCheckbox: boolean}) => {
  const { illnessHistory, updateCheckbox } = selectedIllness
  await selectIllnessHistory(illnessHistory, updateCheckbox)
})
const selectIllnessHistory = debounce(
  async (
    illnessHistory: IllnessHistoryType,
    updateCheckbox: boolean = false
  ) => {

    if (updateCheckbox) illnessHistory.isChecked = !illnessHistory.isChecked
    const status = requestStatusStore.getRequestStatuses?.find(
      (status: any) => status.id_status && status.id_pet == illnessHistory.id_pet
    )

    illnessHistoryStore.updReqUiState({
      id_pet_illness_history: illnessHistory.id_pet_illness_history,
      operation: illnessHistory.isChecked ? 'push' : 'pop',
      id_req_status: status?.id_req_status
    })
    
    
    const clickedIllnessHistory = illnessHistoryStore.getIllnessHistorys.find(
      (i: any) =>
        i.id_pet_illness_history == illnessHistory.id_pet_illness_history
    )

    if (clickedIllnessHistory) {
      if (illnessHistory.isChecked) {
        await illnessHistoryStore.selectIllnessHistory(
          illnessHistory.id_pet_illness_history,
          { isWhole: false }
        )
        getIllnessHistory.value.service_detail_list =
          getIllnessHistory.value.service_detail_list.slice(0, 5)
      } else {
        illnessHistoryStore.removeIllnessHistory(illnessHistory)
        illnessHistoryStore.unToggleActiveIllnessHistory(
          illnessHistory.id_pet_illness_history
        )
        memoCarteStore.fetchMemoCarteV1({
          id_pet: illnessHistory.id_pet
        })
      }
    }
  },
  300
)

const toggleLeftSection = () => {
  leftSection.value = !leftSection.value
}
const openEditIllnessHistoryModal = async (id_pet_illness_history: number) => {
  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    id_employee_doctor: props.requestDetailPage?.id_employee_doctor,
    petSelected: props.petSelected,
    id_pet_illness_history
  })
}
const openMenuIllnessHistory = async (id_pet_illness_history: number) => {
  let menuOptions = [
    {
      title: 'URLコピー',
      name: 'url_copy',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '対応歴の置換',
      name: 'replace',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '編集',
      name: 'edit',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '紹介状印刷',
      name: 'generate_illness_history_pdf',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '内容コピー',
      name: 'copy_record',
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
    if (selectedOption.name == 'url_copy') {
      try {
        let url = window.location.href
        if (!url.includes('code_pet')) {
          url = `${url}?code_pet=${props.petSelected?.code_pet}`
        }
        if (!url.includes('ih')) {
          url = `${url}&ih=${id_pet_illness_history}`
        }
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました!')
      } catch (e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました')
      }
    }
    if (selectedOption.name == 'replace') {
      await mtUtils.smallPopup(UpdIllnessHistory, {
        id_pet_illness_history,
        id_pet: props.petSelected?.id_pet,
        id_request: props.requestDetailPage.id_request
      })
      emit('initCall')
    }
    if (selectedOption.name == 'edit') {
      await openEditIllnessHistoryModal(id_pet_illness_history)
      emit('initCall')
    }
    if (selectedOption.name == 'generate_illness_history_pdf') {
      await mtUtils.popup(GetPdfIllnessHistory, {})
    }
    if (selectedOption.name == 'copy_record') {
      const selectedIH = getLeftSideIllnessHistoryList.value?.find(
        (i: any) => i.id_pet_illness_history == id_pet_illness_history
      )

      let text =
        '## 期間 \n' +
        selectedIH?.date_req_bgn +
        '～' +
        (selectedIH?.date_req_end ? selectedIH?.date_req_end : '')
      text +=
        '\n\n## 傷病名 \n' +
        (selectedIH.name_disease
          ? selectedIH.name_disease
          : selectedIH.name_disease_free)
      if (selectedIH.memo_symptoms)
        text += '\n\n## 確度 \n' + selectedIH.memo_symptoms
      if (selectedIH.memo_inspection)
        text += '\n\n## 検査 / 類症鑑別 \n' + selectedIH.memo_inspection
      if (selectedIH.memo_diagnosis)
        text += '\n\n## 評価 / エビデンス \n' + selectedIH.memo_diagnosis
      if (selectedIH.memo_plan)
        text += '\n\n## 治療方針・計画 \n' + selectedIH.memo_plan
      if (selectedIH.memo_after)
        text += '\n\n## 予後 \n' + selectedIH.memo_after
      if (selectedIH.memo_other)
        text += '\n\n## その他 \n' + selectedIH.memo_other
      if (employeeName(selectedIH.id_employee_doctor))
        text += '\n\n## 担当医 \n' + employeeName(selectedIH.id_employee_doctor)
      if (employeeName(selectedIH.id_employee_staff))
        text += '\n\n## 担当者 \n' + employeeName(selectedIH.id_employee_staff)
      if (selectedIH.id_pet) {
        text += '\n\n## 患者ペット情報'
        text +=
          ' \n' +
          getCustomer.value.code_customer +
          ' ' +
          getCustomerNameById(getCustomer.value, 1)
        text +=
          ' \n' + getPet.value.code_pet + ' ' + getPetFirstName(getPet.value)
      }

      // text = text.replace(/\n/g, '<br />')
      try {
        await navigator.clipboard.writeText(text)
        mtUtils.autoCloseAlert('内容をコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('内容コピーに失敗しました。')
      }
    }
  }
}
const openIllnessHistoryDetail = async (id_pet_illness_history) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: props.petSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_request: props.requestDetailPage?.id_request,
    id_pet_illness_history: id_pet_illness_history,
    additional: {
      menu: 'illness_history'
    }
  })
}
const openPrescriptionHistoryDetail = async (id_pet_illness_history) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: props.petSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_request: props.requestDetailPage?.id_request,
    id_pet_illness_history: id_pet_illness_history,
    additional: {
      menu: 'prescription_history'
    }
  })
}

const openInjectHistoryDetail = async (id_pet_illness_history) => {
  await mtUtils.mediumPopup(ViewInjectHeaderModal, {
    requestDetailPage: props.requestDetailPage,
    id_pet: props.petSelected?.id_pet,
    id_inject: inject.id_inject,
    InjectObj: inject
  })
}

const openLabResultDetail = async (id_pet_illness_history) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: props.petSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_request: props.requestDetailPage?.id_request,
    id_pet_illness_history: id_pet_illness_history,
    additional: {
      menu: 'lab_result'
    }
  })
}
const openPetDiagnosticDetail = async (id_pet_illness_history) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: props.petSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    id_request: props.requestDetailPage?.id_request,
    id_pet_illness_history: id_pet_illness_history,
    additional: {
      menu: 'pet_diagnostic'
    }
  })
}
const openAddIllnessHistoryModal = async () => {
  if (!props.petSelected.id_pet) {
    return mtUtils.autoCloseAlert('ペットを選択してください')
  }
  await mtUtils.popup(QuickIllnessHistoryModal, {
    id_employee_doctor: props.requestDetailPage?.id_employee_doctor,
    id_employee_staff: props.requestDetailPage?.id_employee_staff,
    petSelected: props.petSelected,
    requestDetailPage: props.requestDetailPage,
    create: true
  })
  // await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
  //   id_employee_doctor: props.requestDetailPage?.id_employee_doctor,
  //   id_employee_staff: props.requestDetailPage?.id_employee_staff,
  //   petSelected: props.petSelected,
  //   requestDetailPage: props.requestDetailPage,
  //   create: true
  // })
}
const toggleActiveIH = (illness) => {
  illnessHistoryStore.toggleActiveIllnessHistory(illness.id_pet_illness_history)
  memoCarteStore.fetchMemoCarteV1({ id_pet: illness.id_pet })
}
const closeLeftSidebar = (e: any) => {
  if (!leftSidebar.value) return false
  const clicked = e.target
  window.addEventListener('click', function check(e) {
    if (clicked === e.target) {
      leftSidebar.value = true
    } else {
      leftSidebar.value = false
      removeEventListener('click', check)
    }
  })
}
const diseaseImgArray = async (selectedDisease: any) => {
  // create array to preview images
  const diseaseImages = [] as any
  for (let i = 0; i < 3; i++) {
    if (selectedDisease[`file_path${i + 1}`]?.length) {
      diseaseImages.push({
        file_url: selectedDisease[`file_path${i + 1}`]
      })
    }
  }
  await mtUtils.imageViewPopup(ZoomImageModal, {
    files: diseaseImages,
    index: 0,
    singleImage: false,
    styleAttr: { 'max-width': '100vw' }
  })
}
const openImageViewModal = async (diseaseId: string) => {
  // get disease and preview images
  await diseaseStore.fetchDiseaseImages(diseaseId)
  if (getDiseasImages.value) {
    const selectedDisease = getDiseasImages.value
    if (
      selectedDisease?.file_path1 &&
      (selectedDisease?.file_path2 || selectedDisease?.file_path3)
    ) {
      await diseaseImgArray(selectedDisease)
    }
  }
}
const onCameraVideoModalClose = (newClincalFile: Object) => {
  illnessHistoryStore.selectIllnessHistory(
    newClincalFile.id_pet_illness_history
  )
}
const generateQrForClinicalFileUpload = async (illHistory: any) => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  if (!id_clinic) {
    mtUtils.autoCloseAlert('対象施設が選択されていません。')
    return
  }
  const data = {
    id_pet_illness_history: illHistory.id_pet_illness_history,
    id_pet: props.petSelected.id_pet,
    id_customer: props.petSelected.id_customer,
    id_clinic: id_clinic,
    type_provider: 1,
    name_file: null,
    type_file: 1,
    // type_diagnostic_info: null,
    memo_file_storage: null,
    datetime_receive: formatDateWithTime(getDateToday(), 'YYYY/MM/DD HH:mm:ss'),
    type_receive_format: null
  }
  clinicalFilesUploaderStore.submitClinicalFileUploader(data).then((resp) => {
    let token = resp.data.data.token
    let id_clinic = resp.data.data.id_clinic
    mtUtils.littlePopup(QrCodeShowModal, { token: token, id_clinic: id_clinic })
  })
}
const updateClinicalFileDirect = async (petIllnessHistory: any) => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  const data = {
    id_pet: petIllnessHistory.id_pet,
    id_pet_illness_history: [petIllnessHistory.id_pet_illness_history],
    id_customer: props.petSelected.id_customer,
    id_clinic: id_clinic
  }
  await mtUtils.mediumPopup(UpdateClinicalFileModal, {
    data: data,
    onCompleteCallback: onCameraVideoModalClose
  })
}
const uploadClinicalFileWithStream = async (illHistory: any) => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  if (!id_clinic) {
    mtUtils.autoCloseAlert('対象施設が選択されていません。')
    return
  }
  mtUtils.mediumPopup(CameraVideoModal, {
    pet_illness_history: illHistory,
    id_clinic: id_clinic,
    petSelected: props.petSelected,
    modalClosedCallback: onCameraVideoModalClose,
    persistent: true
  })
}

const ihLabels = (typeHistory: number) => {
  switch (typeHistory) {
    case 1:
      return {
        labelMemoSymptoms: '主訴',
        labelDiagnosisConfidence: '確度',
        labelMemoInspection: '検査 / 類症鑑別',
        labelMemoDiagnosis: '評価 / エビデンス',
        labelMemoPlan: '治療方針・計画',
        labelMemoAfter: '予後',
        labelMemoOther: 'その他'
      }
    case 2: // Prevent related history 予防・健診歴
      return {
        labelMemoSymptoms: 'ワクチンメモ',
        labelMemoInspection: 'フィラリアメモ',
        labelMemoDiagnosis: 'ノミダニメモ',
        labelMemoPlan: '狂犬病メモ',
        labelMemoAfter: '健康診断メモ',
        labelMemoOther: 'その他'
      }
    case 4: // Salon 美容歴
      return {
        labelMemoSymptoms: 'トリミング時の反応と行動',
        labelMemoInspection: 'アレルギーや皮膚の問題',
        labelMemoDiagnosis: 'オーナー基本要望',
        labelMemoPlan: 'トリマー共通メモ',
        labelMemoAfter: 'トリミングによるケガ',
        labelMemoOther: 'その他'
      }
    case 8:
      return {
        labelMemoSymptoms: 'オーナーの要望',
        labelMemoInspection: '獣医師の推奨',
        labelMemoDiagnosis: '評価 / エビデンス',
        labelMemoPlan: '治療方針・計画',
        labelMemoAfter: '予後',
        labelMemoOther: 'その他'
      }
    default:
      return {
        labelMemoSymptoms: '主訴',
        labelDiagnosisConfidence: '確度',
        labelMemoInspection: '検査 / 類症鑑別',
        labelMemoDiagnosis: '評価 / エビデンス',
        labelMemoPlan: '治療方針・計画',
        labelMemoAfter: '予後',
        labelMemoOther: 'その他'
      }
  }
}
const isUpdating = ref(false)

const handleFlgPinned = async (illness: IllnessHistoryType) => {
  if (isUpdating.value) return
  isUpdating.value = true

  try {
    illness.flg_pinned = !illness?.flg_pinned

      await mtUtils.autoCloseAlert(illness.flg_pinned ? 'ピン留めしました。' : 'ピン留めを解除しました。')
    
    await illnessHistoryStore.updateIllnessHistory(illness.id_pet_illness_history, illness)
    
    await illnessHistoryStore.selectIllnessHistory(illness.id_pet_illness_history)
    
    if (typeof filterData !== 'undefined') {
      await illnessHistoryStore.fetchIllnessHistories(filterData.value)
    }
    if (typeof init === 'function') {
      await init()
    }
  } catch (error) {
    console.error('Failed to update pin status:', error)
    await mtUtils.autoCloseAlert('ピン留めの更新に失敗しました。', 'error')
    
    illness.flg_pinned = !illness.flg_pinned
  } finally {
    isUpdating.value = false
  }
}

const handleClickOutside = (event) => {
  if (leftSidebar.value) {
    if ((leftSidebarRef.value && !leftSidebarRef.value.contains(event.target)) && (openSidebarButtonRef.value && !openSidebarButtonRef.value?.contains(event.target)))
      leftSidebar.value = false;
    else leftSidebar.value = true;
  }
};

onMounted(async () => {
  // Hide the left section if opening on tablet
  // if (window.innerWidth < 1200) {
  //   leftSection.value = false
  // }
  console.log(getLeftSideIllnessHistoryList.value)
  document.addEventListener('click', handleClickOutside);
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  event_bus.off('selectIllnessHistory')
});

const sortedInjectList = (injectList) => {
  return [...injectList].sort((a, b) => {
    const dateA = new Date(a.datetime_start || a.date_start)
    const dateB = new Date(b.datetime_start || b.date_start)
    return dateB.getTime() - dateA.getTime() // DESC
  })
}
const isTickAll = ref(false)
const tickAll = () => {
  illnessHistoryList.value.forEach(async  (illness) => {
    const status = requestStatusStore.getRequestStatuses?.find(
      (status: any) => status.id_status && status.id_pet == illness.id_pet
    )
    const clickedIllnessHistory = illnessHistoryStore.getIllnessHistorys.find(
      (i: any) =>
        i.id_pet_illness_history == illness.id_pet_illness_history
    )

    illness.isChecked = isTickAll.value
 

    illnessHistoryStore.updReqUiState({
      id_pet_illness_history: illness.id_pet_illness_history,
      operation: illness.isChecked ? 'push' : 'pop',
      id_req_status: status?.id_req_status
    })

    if (clickedIllnessHistory) {
      if (illness.isChecked) {
        await illnessHistoryStore.selectIllnessHistory(
          illness.id_pet_illness_history,
          { isWhole: false }
        )
        getIllnessHistory.value.service_detail_list =
          getIllnessHistory.value.service_detail_list.slice(0, 5)
      } else {
        illnessHistoryStore.removeIllnessHistory(illness)
        illnessHistoryStore.unToggleActiveIllnessHistory(
          illness.id_pet_illness_history
        )
        memoCarteStore.fetchMemoCarteV1({
          id_pet: illness.id_pet
        })
      }
    }

  })

  
}
</script>
<template>
  <div
    class="absolute-left"
    v-if="leftSection"
    :class="
      (props.showHeader ? 'sidebar' : 'top-sidebar') +
      ' ' +
      (leftSidebar ? 'bg-grey-050' : 'small-left-sidebar')
    "
  >
    <div ref="leftSidebarRef" v-if="leftSidebar">
      <div class="flex justify-between items-center bg-grey-800 text-white" style="border-left: 5px solid rgb(97, 97, 97)">

        <div class="q-pa-xs q-px-md" style="background-color: rgb(97, 97, 97);" >
          <MtFormCheckBox
            v-model:checked="isTickAll"
            @update:checked="tickAll()"
            
          />
        </div>
        <q-btn
          @click.stop="leftSidebar = !leftSidebar"
          class=" "
          square
          unelevated
        >
          <div class="row items-center justify-end full-width">
            <span class="q-mr-sm">対応歴リストを閉じる</span>
            <q-icon name="chevron_left" />
          </div>
        </q-btn>
      </div>
        
      <!-- <q-btn
        @click.stop="leftSidebar = !leftSidebar"
        class="bg-grey-800 text-white full-width"
        square
        unelevated
      >
        <div class="row items-center justify-end full-width">
          <span class="q-mr-sm">対応歴リストを閉じる</span>
          <q-icon name="chevron_left" />
        </div>
      </q-btn> -->
      <q-list v-if="illnessHistoryList.length > 0">
        <q-scroll-area
          :style="{ height: `calc(100vh - ${reduceHeightForTablet + 190}px)` }"
        >
          <q-item
            v-for="(illness, index) in illnessHistoryList"
            :key="index"
            clickable
            style="border-left: 5px solid #616161"
            :class="{
              'bg-history-2': illness.type_history === 2,
              'bg-history-4': illness.type_history === 4
            }"
            @click.stop="selectIllnessHistory(illness, true)"
          >
            <q-item-section>
              <div class="flex justify-between items-center">
                <div>
                  <span v-if="illness.type_history === 2"> 予防・健診 </span>
                  <span v-if="illness.type_history === 4"> 美容 </span>
                  <span v-if="illness.type_history === 8"> その他 </span>
                  <MtFormCheckBox
                    v-model:checked="illness.isChecked"
                    @update:checked="selectIllnessHistory(illness)"
                  />
                  <small class="text-grey-600 q-mb-sm">
                    {{ illness.date_req_bgn ?? '----/--/--' }} ～
                    {{ illness.date_req_end ?? '' }}
                  </small>
                  <div>
                    <span class="body1 bold q-pr-sm">
                      {{
                        illness.name_disease
                          ? illness.name_disease
                          : illness.name_disease_free
                      }}
                    </span>
                    <small
                      v-if="illness?.id_employee_doctor"
                      class="text-grey-600"
                    >
                      {{
                        illness?.id_employee_doctor
                          ? employeeName(illness?.id_employee_doctor)
                          : '-'
                      }}
                    </small>
                  </div>
                </div>
                <div class="flex items-center">
                  <q-icon v-if="illness.flg_surgery" name="brush" size="24" />
                  <q-icon 
                    name="push_pin"
                    class="cursor-pointer"
                    size="22px"
                    :style="{'opacity': illness.flg_pinned ? 1 : 0.3}"
                    @click.stop="() => handleFlgPinned(illness)"
                  />
              </div>
              </div>
            </q-item-section>
          </q-item>
          <q-separator />
        </q-scroll-area>
      </q-list>
      <div v-else>
        <p class="text-grey-500 text-center q-mt-md">
          既往歴・対応歴はありません。
        </p>
      </div>
    </div>
  </div>
  <div
    class="q-br"
    :class="
      leftSection
        ? props.rightSidebar
          ? 'col-4'
          : 'col-5'
        : 'small-left-section'
    "
    id="left-detail-section"
  >
    <q-scroll-area
      :style="props.scrollAreaHeight"
      :horizontal-thumb-style="{ width: '0', opacity: 0 }"
    >
      <template v-if="leftSection">
        <div @click="leftSidebar = !leftSidebar" class="position-relative">
          <div
            align="between"
            class="bg-grey-050 text-grey-700 cursor-pointer full-width q-pa-none q-px-sm fixed items-center justify-between flex"
            style="z-index: 1; min-height: 2.572em;"
            square
            unelevated
            @click="selectCheckBoox"
            ref="openSidebarButtonRef"
          >
            対応歴リストを表示
            <q-icon
              name="chevron_left"
              size="18px"
              @click.stop="leftSection = !leftSection"
            />
          </div>
          <q-btn
            class="bg-grey-800 text-white q-mx-sm add-btn-right"
            style="z-index: 1"
            unelevated
            @click.stop="openAddIllnessHistoryModal"
          >
            <q-icon name="add" />
            対応歴
          </q-btn>
        </div>
        <div class="mt-36">
          <div
            v-for="illHistory in getLeftSideIllnessHistoryList"
            v-if="getLeftSideIllnessHistoryList?.length > 0"
            :key="illHistory.id_pet_illness_history"
          >
            <div
              class="row justify-between items-center q-pl-md q-pr-xs q-pt-md"
              :class="{
                'bg-history-2': illHistory.type_history === 2,
                'bg-history-4': illHistory.type_history === 4,
                'bg-grey-200':
                  illHistory.type_history !== 2 && illHistory.type_history !== 4
              }"
            >
              <div>
                <span class="text-grey-700"
                  >{{ illHistory?.date_req_bgn ?? '期間未設定' }}
                  <small class="q-pa-sm">～</small>
                  {{ illHistory?.date_req_end ?? ' ' }}
                </span>
                <span v-if="illHistory.type_history === 8" class="text-h5 text-bold illness_name"> その他 </span>
                <p v-else class="text-h5 text-bold illness_name">
                  {{
                    illHistory.name_disease
                      ? illHistory.name_disease
                      : illHistory.name_disease_free
                  }}
                </p>
              </div>
              <div class="flex justify-end">
                <div class="q-mb-md">
                  <q-icon 
                    name="push_pin"
                    class="cursor-pointer q-mr-md"
                    size="22px"
                    :style="{'opacity': illHistory?.flg_pinned ? 1 : 0.3}"
                    @click.stop="() => handleFlgPinned(illHistory)"
                  />
                  <q-toggle
                    @update:model-value="toggleActiveIH(illHistory)"
                    v-model="illHistory.isActiveIH"
                    v-if="illHistory"
                  >
                    <q-tooltip> メモカルテを絞り込む </q-tooltip>
                  </q-toggle>
                  <q-btn
                    v-if="illHistory?.flg_disease_img"
                    class="text-grey-400 q-mr-md"
                    flat
                    icon="collections"
                    padding="4px"
                    rounded
                    unelevated
                    @click="openImageViewModal(illHistory?.id_disease)"
                  >
                  </q-btn>
                  <!-- <q-btn
                    v-if="showSurgeryButton"
                    class="bg-grey-800 text-white"
                    unelevated
                    >手術歴
                  </q-btn> -->
                  <q-btn
                    v-if="illnessHistoryStore.getIllnessHistory"
                    @click="
                      openEditIllnessHistoryModal(illHistory?.id_pet_illness_history)
                    "
                    icon="edit"
                    size="24"
                    flat
                    round
                  />
                  <q-btn
                    v-if="illnessHistoryStore.getIllnessHistory"
                    @click="
                      openMenuIllnessHistory(illHistory?.id_pet_illness_history)
                    "
                    icon="more_horiz"
                    size="24"
                    flat
                    round
                  />
                </div>
              </div>
            </div>
            <div
              v-if="illHistory.type_history === null"
              class="full-width q-pl-md q-pr-xs q-mt-md"
            >
              <div v-if="illHistory?.memo_symptoms" class="q-mb-md">
                <div class="ih-label">
                  {{ ihLabels(illHistory.type_history)?.labelMemoSymptoms }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_symptoms }}
                </div>
              </div>
              <div class="row" v-if="illHistory?.diagnosis_confidence">
                <div class="col q-mb-xs">
                  <div class="ih-label">
                    {{
                      ihLabels(illHistory.type_history)
                        ?.labelDiagnosisConfidence
                    }}
                  </div>
                  <div>
                    {{
                      illHistory?.diagnosis_confidence
                        ? diagnosisConfidenceName(
                            illHistory?.diagnosis_confidence
                          )
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_doctor">
                  <div class="ih-label q-mb-xs">担当医</div>
                  <div>
                    {{
                      illHistory?.id_employee_doctor
                        ? employeeName(illHistory?.id_employee_doctor)
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_staff">
                  <span class="ih-label q-mb-xs">担当者</span>
                  <p class="ellipsis">
                    {{
                      illHistory?.id_employee_staff
                        ? employeeName(illHistory?.id_employee_staff)
                        : '-'
                    }}
                  </p>
                </div>
              </div>
              <div v-if="illHistory?.memo_inspection" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoInspection }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_inspection }}
                </div>
              </div>
              <div v-if="illHistory?.memo_diagnosis" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoDiagnosis }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_diagnosis }}
                </div>
              </div>
              <div v-if="illHistory?.memo_plan" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoPlan }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_plan }}
                </div>
              </div>
              <div v-if="illHistory?.memo_after" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoAfter }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_after }}
                </div>
              </div>
              <div v-if="illHistory?.memo_other" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoOther }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_other }}
                </div>
              </div>
              <div class="q-pb-lg q-mb-md">
                <q-expansion-item
                  v-if="illHistory?.service_detail_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連治療"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連治療</div>
                      <q-btn
                        dense
                        flat
                        square
                        unelevated
                        color="blue"
                        @click.stop="
                          openIllnessHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ServiceDetailPocketList
                    v-for="data in illHistory?.service_detail_list"
                    :key="data.id_service_detail"
                    :copy-icon="true"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    :left="true"
                    :rightSidebar="props.rightSidebar"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                  />
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.prescription_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連処方箋</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPrescriptionHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <PrescriptionPocketList
                    v-for="data in illHistory?.prescription_list"
                    :key="data.id_prescription"
                    :data="data"
                    :request="requestDetailPage"
                    :left="true"
                    :rightSidebar="props.rightSidebar"
                    class="q-ml-lg"
                    parentId="left-detail-section"
                  />
                </q-expansion-item>
                <template v-if="illHistory?.inject_list?.length > 0">
                  <div class="text-h6 q-mt-md q-mb-sm">注射・点滴</div>
                  <q-expansion-item
                    class="full-width"
                    default-opened
                    dense
                    header-class="q-bb"
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="full-width flex justify-between items-center">
                        <div class="ih-label">注射・点滴</div>
                        <q-btn
                          color="blue"
                          dense
                          flat
                          square
                          unelevated
                          @click.stop="openInjectHistoryDetail(illHistory.id_pet_illness_history)"
                        >
                          もっと見る
                        </q-btn>
                      </div>
                    </template>
                    <InjectPocketList
                      v-for="inject in sortedInjectList(illHistory.inject_list)"
                      :key="inject.id_inject"
                      :data="inject"
                      :request="requestDetailPage"
                      :parent-id="'left-detail-section'"
                      :left="true"
                    />
                  </q-expansion-item>
                </template>

                <q-expansion-item
                  v-if="Object.keys(labResultList).length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">検査結果</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openLabResultDetail(illHistory.id_pet_illness_history)
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <LabResultPocketList
                    v-for="(data, key) in labResultList"
                    :key="key"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                  />
                </q-expansion-item>

                <!-- TO DO : Create component for this : -->
                <q-expansion-item
                  v-if="false"
                  default-opened
                  dense
                  expand-icon-class="text-white"
                  header-class="bg-grey-800 text-white"
                  label="検査結果"
                >
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.clinical_file_list?.length > 0 || true"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連資料"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連資料</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPetDiagnosticDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ClinicalFilePocketList
                    class="q-pa-sm"
                    :id_customer="props.petSelected?.id_customer"
                    :id_pet="props.petSelected?.id_pet"
                    :data="illHistory?.clinical_file_list"
                    :illnessHistories="illHistory"
                    :onFileUpdated="onCameraVideoModalClose"
                    @file-uploaded="onCameraVideoModalClose"
                    @generate-qr-for-clinical-file-upload="
                      generateQrForClinicalFileUpload
                    "
                    @update-clinical-file-direct="updateClinicalFileDirect"
                    @upload-clinical-file-with-stream="
                      uploadClinicalFileWithStream
                    "
                  />
                </q-expansion-item>
              </div>
            </div>
            <!--既往歴・現疾患 Illness History where type = 1 -->
            <div
              v-if="illHistory.type_history === 1"
              class="full-width q-pl-md q-pr-xs q-mt-md"
            >
              <div v-if="illHistory?.memo_symptoms" class="q-mb-md">
                <div class="ih-label">
                  {{ ihLabels(illHistory.type_history)?.labelMemoSymptoms }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_symptoms }}
                </div>
              </div>
              <div class="row">
                <div class="col q-mb-xs">
                  <div class="ih-label">
                    {{
                      ihLabels(illHistory.type_history)
                        ?.labelDiagnosisConfidence
                    }}
                  </div>
                  <div>
                    {{
                      illHistory?.diagnosis_confidence
                        ? diagnosisConfidenceName(
                            illHistory?.diagnosis_confidence
                          )
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_doctor">
                  <div class="ih-label q-mb-xs">担当医</div>
                  <div>
                    {{
                      illHistory?.id_employee_doctor
                        ? employeeName(illHistory?.id_employee_doctor)
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_staff">
                  <span class="ih-label q-mb-xs">担当者</span>
                  <p class="ellipsis">
                    {{
                      illHistory?.id_employee_staff
                        ? employeeName(illHistory?.id_employee_staff)
                        : '-'
                    }}
                  </p>
                </div>
              </div>
              <div v-if="illHistory?.memo_inspection" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoInspection }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_inspection }}
                </div>
              </div>
              <div v-if="illHistory?.memo_diagnosis" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoDiagnosis }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_diagnosis }}
                </div>
              </div>
              <div v-if="illHistory?.memo_plan" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoPlan }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_plan }}
                </div>
              </div>
              <div v-if="illHistory?.memo_after" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoAfter }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_after }}
                </div>
              </div>
              <div v-if="illHistory?.memo_other" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoOther }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_other }}
                </div>
              </div>
              <div class="q-pb-lg q-mb-md">
                <q-expansion-item
                  v-if="illHistory?.service_detail_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連治療"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連治療</div>
                      <q-btn
                        dense
                        flat
                        square
                        unelevated
                        color="blue"
                        @click.stop="
                          openIllnessHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ServiceDetailPocketList
                    v-for="data in illHistory?.service_detail_list"
                    :key="data.id_service_detail"
                    :copy-icon="true"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    :rightSidebar="props.rightSidebar"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                    :left="true"
                  />
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.prescription_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連処方箋</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPrescriptionHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <PrescriptionPocketList
                    v-for="data in illHistory?.prescription_list"
                    :key="data.id_prescription"
                    :data="data"
                    class="q-ml-lg"
                    :request="requestDetailPage"
                    :rightSidebar="props.rightSidebar"
                    parentId="left-detail-section"
                    :left="true"
                  />
                </q-expansion-item>
                <template v-if="illHistory?.inject_list?.length > 0">
                  <q-expansion-item
                    class="full-width"
                    default-opened
                    dense
                    header-class="q-bb"
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="full-width flex justify-between items-center">
                        <div class="ih-label">注射・点滴</div>
                        <q-btn
                          color="blue"
                          dense
                          flat
                          square
                          unelevated
                          @click.stop="openInjectHistoryDetail(illHistory.id_pet_illness_history)"
                        >
                          もっと見る
                        </q-btn>
                      </div>
                    </template>
                    <InjectPocketList
                      v-for="inject in sortedInjectList(illHistory.inject_list)"
                      :key="inject.id_inject"
                      :data="inject"
                      :request="requestDetailPage"
                      :parent-id="'left-detail-section'"
                      :left="true"
                    />
                  </q-expansion-item>
                </template>
                <q-expansion-item
                  v-if="Object.keys(labResultList).length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">検査結果</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openLabResultDetail(illHistory.id_pet_illness_history)
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <LabResultPocketList
                    v-for="(data, key) in labResultList"
                    :key="key"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                  />
                </q-expansion-item>

                <!-- TO DO : Create component for this : -->
                <q-expansion-item
                  v-if="false"
                  default-opened
                  dense
                  expand-icon-class="text-white"
                  header-class="bg-grey-800 text-white"
                  label="検査結果"
                >
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.clinical_file_list?.length > 0 || true"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連資料"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連資料</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPetDiagnosticDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ClinicalFilePocketList
                    class="q-pa-sm"
                    :id_customer="props.petSelected?.id_customer"
                    :id_pet="props.petSelected?.id_pet"
                    :data="illHistory?.clinical_file_list"
                    :illnessHistories="illHistory"
                    :onFileUpdated="onCameraVideoModalClose"
                    @file-uploaded="onCameraVideoModalClose"
                    @generate-qr-for-clinical-file-upload="
                      generateQrForClinicalFileUpload
                    "
                    @update-clinical-file-direct="updateClinicalFileDirect"
                    @upload-clinical-file-with-stream="
                      uploadClinicalFileWithStream
                    "
                  />
                </q-expansion-item>
              </div>
            </div>
            <!--予防/健診 PREVENT where type = 2 -->
            <div
              v-if="illHistory.type_history === 2"
              class="full-width q-pl-md q-pr-xs q-mt-md"
            >
              <div class="row" v-if="illHistory?.diagnosis_confidence">
                <div class="col" v-if="illHistory?.id_employee_doctor">
                  <div class="ih-label q-mb-xs">担当医</div>
                  <div>
                    {{
                      illHistory?.id_employee_doctor
                        ? employeeName(illHistory?.id_employee_doctor)
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_staff">
                  <span class="ih-label q-mb-xs">担当者</span>
                  <p class="ellipsis">
                    {{
                      illHistory?.id_employee_staff
                        ? employeeName(illHistory?.id_employee_staff)
                        : '-'
                    }}
                  </p>
                </div>
              </div>
              <div v-if="illHistory?.memo_symptoms" class="q-mb-md">
                <div class="ih-label">
                  {{ ihLabels(illHistory.type_history)?.labelMemoSymptoms }}
                </div>
                <div class="ill_label">
                  {{ illHistory?.memo_symptoms }}
                </div>
              </div>
              <div v-if="illHistory?.memo_inspection" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoInspection }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_inspection }}
                </div>
              </div>
              <div v-if="illHistory?.memo_diagnosis" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoDiagnosis }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_diagnosis }}
                </div>
              </div>
              <div v-if="illHistory?.memo_plan" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoPlan }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_plan }}
                </div>
              </div>
              <div v-if="illHistory?.memo_after" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoAfter }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_after }}
                </div>
              </div>
              <div v-if="illHistory?.memo_other" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoOther }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_other }}
                </div>
              </div>
              <div class="q-pb-lg q-mb-md">
                <q-expansion-item
                  v-if="illHistory?.service_detail_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連治療"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連治療</div>
                      <q-btn
                        dense
                        flat
                        square
                        unelevated
                        color="blue"
                        @click.stop="
                          openIllnessHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ServiceDetailPocketList
                    v-for="data in illHistory?.service_detail_list"
                    :key="data.id_service_detail"
                    :copy-icon="true"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    :rightSidebar="props.rightSidebar"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                    :left="true"
                  />
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.prescription_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連処方箋</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPrescriptionHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <PrescriptionPocketList
                    v-for="data in illHistory?.prescription_list"
                    :key="data.id_prescription"
                    :data="data"
                    class="q-ml-lg"
                    :request="requestDetailPage"
                    :rightSidebar="props.rightSidebar"
                    parentId="left-detail-section"
                    :left="true"
                  />
                </q-expansion-item>
                <template v-if="illHistory?.inject_list?.length > 0">
                  <q-expansion-item
                    class="full-width"
                    default-opened
                    dense
                    header-class="q-bb"
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="full-width flex justify-between items-center">
                        <div class="ih-label">注射・点滴</div>
                        <q-btn
                          color="blue"
                          dense
                          flat
                          square
                          unelevated
                          @click.stop="openInjectHistoryDetail(illHistory.id_pet_illness_history)"
                        >
                          もっと見る
                        </q-btn>
                      </div>
                    </template>
                    <InjectPocketList
                      v-for="inject in sortedInjectList(illHistory.inject_list)"
                      :key="inject.id_inject"
                      :data="inject"
                      :request="requestDetailPage"
                      :parent-id="'left-detail-section'"
                      :left="true"
                    />
                  </q-expansion-item>
                </template>
                <q-expansion-item
                  v-if="Object.keys(labResultList).length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">検査結果</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openLabResultDetail(illHistory.id_pet_illness_history)
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <LabResultPocketList
                    v-for="(data, key) in labResultList"
                    :key="key"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                  />
                </q-expansion-item>

                <!-- TO DO : Create component for this : -->
                <q-expansion-item
                  v-if="false"
                  default-opened
                  dense
                  expand-icon-class="text-white"
                  header-class="bg-grey-800 text-white"
                  label="検査結果"
                >
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.clinical_file_list?.length > 0 || true"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連資料"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連資料</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPetDiagnosticDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ClinicalFilePocketList
                    class="q-pa-sm"
                    :id_customer="props.petSelected?.id_customer"
                    :id_pet="props.petSelected?.id_pet"
                    :data="illHistory?.clinical_file_list"
                    :illnessHistories="illHistory"
                    :onFileUpdated="onCameraVideoModalClose"
                    @file-uploaded="onCameraVideoModalClose"
                    @generate-qr-for-clinical-file-upload="
                      generateQrForClinicalFileUpload
                    "
                    @update-clinical-file-direct="updateClinicalFileDirect"
                    @upload-clinical-file-with-stream="
                      uploadClinicalFileWithStream
                    "
                  />
                </q-expansion-item>
              </div>
            </div>
            <!--美容 / Salon where type = 4 -->
            <div
              v-if="illHistory.type_history === 4"
              class="full-width q-pl-md q-pr-xs q-mt-md"
            >
              <div class="row">
                <div class="col" v-if="illHistory?.id_employee_doctor">
                  <div class="ih-label q-mb-xs">担当医</div>
                  <div>
                    {{
                      illHistory?.id_employee_doctor
                        ? employeeName(illHistory?.id_employee_doctor)
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_staff">
                  <span class="ih-label q-mb-xs">担当者</span>
                  <p class="ellipsis">
                    {{
                      illHistory?.id_employee_staff
                        ? employeeName(illHistory?.id_employee_staff)
                        : '-'
                    }}
                  </p>
                </div>
              </div>
              <div v-if="illHistory?.memo_symptoms" class="q-mb-md">
                <div class="ih-label">
                  {{ ihLabels(illHistory.type_history)?.labelMemoSymptoms }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_symptoms }}
                </div>
              </div>
              <div v-if="illHistory?.memo_inspection" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoInspection }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_inspection }}
                </div>
              </div>
              <div v-if="illHistory?.memo_diagnosis" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoDiagnosis }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_diagnosis }}
                </div>
              </div>
              <div v-if="illHistory?.memo_plan" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoPlan }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_plan }}
                </div>
              </div>
              <div v-if="illHistory?.memo_after" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoAfter }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_after }}
                </div>
              </div>
              <div v-if="illHistory?.memo_other" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoOther }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_other }}
                </div>
              </div>
              <div class="q-pb-lg q-mb-md">
                <q-expansion-item
                  v-if="illHistory?.service_detail_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連治療"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連治療</div>
                      <q-btn
                        dense
                        flat
                        square
                        unelevated
                        color="blue"
                        @click.stop="
                          openIllnessHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ServiceDetailPocketList
                    v-for="data in illHistory?.service_detail_list"
                    :key="data.id_service_detail"
                    :copy-icon="true"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                    :left="true"
                    :rightSidebar="props.rightSidebar"
                  />
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.prescription_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連処方箋</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPrescriptionHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <PrescriptionPocketList
                    v-for="data in illHistory?.prescription_list"
                    :key="data.id_prescription"
                    :data="data"
                    class="q-ml-lg"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    :left="true"
                    :rightSidebar="props.rightSidebar"
                  />
                </q-expansion-item>
                <template v-if="illHistory?.inject_list?.length > 0">
                  <q-expansion-item
                    class="full-width"
                    default-opened
                    dense
                    header-class="q-bb"
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="full-width flex justify-between items-center">
                        <div class="ih-label">注射・点滴</div>
                        <q-btn
                          color="blue"
                          dense
                          flat
                          square
                          unelevated
                          @click.stop="openInjectHistoryDetail(illHistory.id_pet_illness_history)"
                        >
                          もっと見る
                        </q-btn>
                      </div>
                    </template>     
                    <InjectPocketList
                      v-for="inject in sortedInjectList(illHistory.inject_list)"
                      :key="inject.id_inject"
                      :data="inject"
                      :request="requestDetailPage"
                      :parent-id="'left-detail-section'"
                      :left="true"
                    />
                  </q-expansion-item>
                </template>
                <q-expansion-item
                  v-if="Object.keys(labResultList).length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">検査結果</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openLabResultDetail(illHistory.id_pet_illness_history)
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <LabResultPocketList
                    v-for="(data, key) in labResultList"
                    :key="key"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                  />
                </q-expansion-item>

                <!-- TO DO : Create component for this : -->
                <q-expansion-item
                  v-if="false"
                  default-opened
                  dense
                  expand-icon-class="text-white"
                  header-class="bg-grey-800 text-white"
                  label="検査結果"
                >
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.clinical_file_list?.length > 0 || true"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連資料"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連資料</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPetDiagnosticDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ClinicalFilePocketList
                    class="q-pa-sm"
                    :id_customer="props.petSelected?.id_customer"
                    :id_pet="props.petSelected?.id_pet"
                    :data="illHistory?.clinical_file_list"
                    :illnessHistories="illHistory"
                    :onFileUpdated="onCameraVideoModalClose"
                    @file-uploaded="onCameraVideoModalClose"
                    @generate-qr-for-clinical-file-upload="
                      generateQrForClinicalFileUpload
                    "
                    @update-clinical-file-direct="updateClinicalFileDirect"
                    @upload-clinical-file-with-stream="
                      uploadClinicalFileWithStream
                    "
                  />
                </q-expansion-item>
              </div>
            </div>

            <!--その他健診など / Other where type = 8 -->
            <div
              v-if="illHistory.type_history === 8"
              class="full-width q-pl-md q-pr-xs q-mt-md"
            >
              <div class="row">
                <div class="col" v-if="illHistory?.id_employee_doctor">
                  <div class="ih-label q-mb-xs">担当医</div>
                  <div>
                    {{
                      illHistory?.id_employee_doctor
                        ? employeeName(illHistory?.id_employee_doctor)
                        : '-'
                    }}
                  </div>
                </div>
                <div class="col" v-if="illHistory?.id_employee_staff">
                  <span class="ih-label q-mb-xs">担当者</span>
                  <p class="ellipsis">
                    {{
                      illHistory?.id_employee_staff
                        ? employeeName(illHistory?.id_employee_staff)
                        : '-'
                    }}
                  </p>
                </div>
              </div>
              <div v-if="illHistory?.memo_symptoms" class="q-mb-md">
                <div class="ih-label">
                  {{ ihLabels(illHistory.type_history)?.labelMemoSymptoms }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_symptoms }}
                </div>
              </div>
              <div v-if="illHistory?.memo_inspection" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoInspection }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_inspection }}
                </div>
              </div>
              <div v-if="illHistory?.memo_other" class="q-my-md">
                <div class="ih-label q-mb-xs">
                  {{ ihLabels(illHistory.type_history)?.labelMemoOther }}
                </div>
                <div style="white-space: pre-wrap">
                  {{ illHistory?.memo_other }}
                </div>
              </div>
              <div class="q-pb-lg q-mb-md">
                <q-expansion-item
                  v-if="illHistory?.service_detail_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連治療"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連治療</div>
                      <q-btn
                        dense
                        flat
                        square
                        unelevated
                        color="blue"
                        @click.stop="
                          openIllnessHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ServiceDetailPocketList
                    v-for="data in illHistory?.service_detail_list"
                    :key="data.id_service_detail"
                    :copy-icon="true"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                    :left="true"
                    :rightSidebar="props.rightSidebar"
                  />
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.prescription_list?.length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連処方箋</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPrescriptionHistoryDetail(
                            illHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <PrescriptionPocketList
                    v-for="data in illHistory?.prescription_list"
                    :key="data.id_prescription"
                    :data="data"
                    class="q-ml-lg"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    :left="true"
                    :rightSidebar="props.rightSidebar"
                  />
                </q-expansion-item>
                <template v-if="illHistory?.inject_list?.length > 0">
                  <q-expansion-item
                    class="full-width"
                    default-opened
                    dense
                    header-class="q-bb"
                    switch-toggle-side
                  >
                    <template v-slot:header>
                      <div class="full-width flex justify-between items-center">
                        <div class="ih-label">注射・点滴</div>
                        <q-btn
                          color="blue"
                          dense
                          flat
                          square
                          unelevated
                          @click.stop="openInjectHistoryDetail(illHistory.id_pet_illness_history)"
                        >
                          もっと見る
                        </q-btn>
                      </div>
                    </template>
                    <InjectPocketList
                      v-for="inject in sortedInjectList(illHistory.inject_list)"
                      :key="inject.id_inject"
                      :data="inject"
                      :request="requestDetailPage"
                      :parent-id="'left-detail-section'"
                      :left="true"
                    />
                  </q-expansion-item>
                </template>
                <q-expansion-item
                  v-if="Object.keys(labResultList).length > 0"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">検査結果</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openLabResultDetail(illHistory.id_pet_illness_history)
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <LabResultPocketList
                    v-for="(data, key) in labResultList"
                    :key="key"
                    :data="data"
                    :petSelected="petSelected"
                    :request="requestDetailPage"
                    parentId="left-detail-section"
                    class="q-ml-lg"
                    @init-call="emit('initCall')"
                  />
                </q-expansion-item>

                <!-- TO DO : Create component for this : -->
                <q-expansion-item
                  v-if="false"
                  default-opened
                  dense
                  expand-icon-class="text-white"
                  header-class="bg-grey-800 text-white"
                  label="検査結果"
                >
                </q-expansion-item>

                <q-expansion-item
                  v-if="illHistory?.clinical_file_list?.length > 0 || true"
                  class="full-width"
                  header-class="q-bb"
                  default-opened
                  switch-toggle-side
                  dense
                  label="関連資料"
                >
                  <template v-slot:header>
                    <div class="full-width flex justify-between items-center">
                      <div class="ih-label">関連資料</div>
                      <q-btn
                        flat
                        square
                        unelevated
                        dense
                        color="blue"
                        @click.stop="
                          openPetDiagnosticDetail(
                            getIllnessHistory.id_pet_illness_history
                          )
                        "
                      >
                        もっと見る
                      </q-btn>
                    </div>
                  </template>
                  <ClinicalFilePocketList
                    class="q-pa-sm"
                    :id_customer="props.petSelected?.id_customer"
                    :id_pet="props.petSelected?.id_pet"
                    :data="illHistory?.clinical_file_list"
                    :illnessHistories="illHistory"
                    :onFileUpdated="onCameraVideoModalClose"
                    @file-uploaded="onCameraVideoModalClose"
                    @generate-qr-for-clinical-file-upload="
                      generateQrForClinicalFileUpload
                    "
                    @update-clinical-file-direct="updateClinicalFileDirect"
                    @upload-clinical-file-with-stream="
                      uploadClinicalFileWithStream
                    "
                  />
                </q-expansion-item>
              </div>
            </div>
          </div>
          <div v-else>
            <p class="text-grey-500 text-center q-mt-md">
              既往歴・対応歴はありません。
            </p>
          </div>
        </div>
      </template>
      <template v-else>
        <q-btn
          class="full-height"
          @click="toggleLeftSection"
          icon="chevron_right"
          size="24"
          flat
          round
        />
      </template>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">

.ill_label{
  word-wrap: break-word;
  min-width:180px;
  max-width:450px;
}
.illness_name{
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis;
  min-width:250px;
  max-width:280px;
}
::v-deep .q-scrollarea__content.absolute {
  width: 100% !important;
}
.sidebar {
  top: 128px;
  width: 400px;
  z-index: 3;
}

.add-btn-right {
  position: absolute;
  right: 30px;
}
.top-sidebar {
  top: 69px;
  height: 76vh;
  width: 400px;
  z-index: 3;
}

.small-left-sidebar {
  width: 0px;

  .q-list {
    display: none;
  }
}

.small-left-section {
  width: 75px;
}

.ih-label {
  font-size: 12px;
  display: inline-block;
  background-color: #e1e5eb;
  color: #404145;
  border-radius: 6px;
  padding: 2px 6px;
  margin-bottom: 5px;
}

.clinicalFileActionIcon {
  margin: 0 auto;
}

.bg-history-2 {
  background-color: #b3ffa9;
}

.bg-history-4 {
  background-color: #ffc0f1;
}

@media (min-width: 768px) and (max-width: 991.98px){
  ::v-deep .q-scrollarea__content.absolute {
    width: 100% !important;
  }
  .illness_name {
    min-width: 80px;
    max-width: 80px;
  }
  ::v-deep .ellipsis.widthToTruncate.body2.regular.left {
      min-width: 20px !important;
      max-width: 220px !important;
  }
  ::v-deep.ill_label{
  word-wrap: break-word;
  min-width:100px;
  max-width: 110px;
}
}

@media (max-width: 900px) {
  ::v-deep .q-scrollarea__content.absolute {
    width: 100% !important;
  }
  .illness_name {
    min-width: 30px; 
    max-width: 30px; 
  }
  ::v-deep .ellipsis.widthToTruncate.body2.regular.left {
      min-width: 20px !important;
      max-width: 150px !important;
  }
  ::v-deep.ill_label{
  word-wrap: break-word;
  min-width:150px;
  max-width: 250px;
}
}

@media (min-width: 901px) and (max-width: 991.98px) {
  ::v-deep .q-scrollarea__content.absolute {
    width: 100% !important;
  }
  .illness_name {
    min-width:110px;
  max-width:110px;
  }
  ::v-deep .ellipsis.widthToTruncate.body2.regular.left {
      min-width: 30px !important;
      max-width: 200px !important;
  }
  ::v-deep.ill_label{
  word-wrap: break-word;
  min-width:180px;
  max-width: 270px;
}
}

@media (min-width: 992px) and (max-width: 1199.98px) {
  ::v-deep .q-scrollarea__content.absolute {
    width: 100% !important;
  }
  .illness_name {
    min-width:150px;
  max-width:150px;
  }
  ::v-deep .ellipsis.widthToTruncate.body2.regular.left {
      min-width: 40px !important;
      max-width: 215px !important;
  }
  ::v-deep.ill_label{
  word-wrap: break-word;
  min-width:250px;
  max-width: 350px;
}
}

@media (min-width: 1200px) {
  ::v-deep .q-scrollarea__content.absolute {
    width: 100% !important;
  }
  .illness_name {
    min-width:200px;
  max-width:260px;
  }
}
</style>
