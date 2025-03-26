<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref,nextTick } from 'vue'
import { storeToRefs } from 'pinia'

// Plugins
import { useDialogFactory } from '@/plugins/MtQuasarDialog'

// Components
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'

import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import OptionModal from '@/components/OptionModal.vue'
import DialogContentDiseaseOpt from './DialogContentDiseaseOpt.vue'

// Utilities
import { blank, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import { event_bus } from '@/utils/eventBus'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useCustomerStore from '@/stores/customers'
import useDiseaseStore from '@/stores/diseases'
import useEmployeeStore from '@/stores/employees'

// Types and Enums
import { typeDiagnosisConfidence, typeHistoryConfig } from '@/utils/enum'
import { PetType, RequestDetailPageType } from '@/types/types'
import { forEach, orderBy, sortBy, toArray, uniq, values } from 'lodash'
import useCategoryStore from '@/stores/categories'
import useRequestStatus from '@/stores/request-statuses'

// Store Instances
const employeeStore = useEmployeeStore()
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const diseaseStore = useDiseaseStore()
const categoryStore = useCategoryStore()
const requestStatusStore = useRequestStatus()

// Store References
const { getDoctors, getNonDoctors } = storeToRefs(employeeStore)
const { getListDisease, getAllDiseases } = storeToRefs(diseaseStore)
const { getPet } = storeToRefs(customerStore)
const { getLeftSideIllnessHistoryList } = storeToRefs(illnessHistoryStore)

const QuickIllnessHistoryModal = defineAsyncComponent(
  () => import('./QuickIllnessHistoryModal.vue')
)

// Props and Emits
const emits = defineEmits(['close', 'edit', 'deleted'])
const props = withDefaults(
  defineProps<{
    petSelected: PetType | null
    create: boolean
    id_employee_doctor: string | number
    id_employee_staff: string | number
    id_pet_illness_history?: string
    requestDetailPage: RequestDetailPageType | null
    viewOnly: boolean
    withScroll: boolean
    fullWidth: boolean
  }>(),
  {
    petSelected: null,
    create: false,
    id_employee_doctor: '',
    id_employee_staff: '',
    id_pet_illness_history: '',
    requestDetailPage: null,
    viewOnly: false,
    withScroll: true,
    fullWidth: false
  }
)

// Reactive Variables
const petSelected = ref()
const customerSelected = ref()
const petList = ref()
const diseaseList = ref([])
const diseaseListDefault = reactive([])
const selectedDoctor = ref()
const loading = ref(false)
const formRef = ref<any>(null)
const diseaseSelectRef = ref(null)
const showValidation = ref(false)

const data = ref({
  id_pet_illness_history: '',
  id_pet: '',
  name_disease: '',
  name_disease_free: '',
  id_disease: '',
  diagnosis_confidence: 4,
  type_history: 1,
  flg_congenital: false,
  flg_chronical: false,
  flg_free_disease_name_ui: false,
  flg_pinned: false,
  date_req_bgn: getDateToday(),
  flg_finished: false,
  date_req_end: '',

  id_employee_doctor: '',
  id_employee_staff: '',

  memo_symptoms: '',
  memo_inspection: '',
  memo_diagnosis: '',
  memo_plan: '',
  memo_after: '',
  memo_other: '',
  disease: {
    id_category1: '',
    id_category2: ''
  },
  id_clinic: ''
})
const search = ref({
  id_category1: null,
  id_category2: null
})
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const openMenu = async () => {
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
      title: '削除',
      name: 'delete',
      isChanged: false
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
          url = `${url}&ih=${data.value.id_pet_illness_history}`
        }
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました!')
      } catch (e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました')
      }
    }
    if (selectedOption.name == 'delete') {
      try {
        await illnessHistoryStore.destroyIllnessHistory(data.value.id_pet_illness_history)
        
        emits('deleted', data.value.id_pet_illness_history)
        
        await illnessHistoryStore.fetchIllnessHistorys({
          id_pet: petSelected.value?.id_pet,
          id_customer: customerSelected.value?.id_customer
        })
        .then(() => {
          illnessHistoryStore.removeIllnessHistory(data.value)
        })
        .catch((error) => {
          throw Error(error)
        })
        .finally(() => {
          event_bus.emit('reloadRight', true)
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
        })
      } catch (error) {
        mtUtils.autoCloseAlert('削除に失敗しました', 'error')
      }
    }
  }
}

const category1Selected = async (value: any) => {
  data.value.disease.id_category1 = value
  if (!data.value.id_pet_illness_history) data.value.id_disease = ''
  if (value) {
    diseaseList.value.length = 0
    diseaseListDefault.length = 0
    diseaseList.value = [
      ...filteredListDisease.value.filter((item) => item.id_category1 === value)
    ]
    diseaseListDefault.push(
      ...filteredListDisease.value.filter((item) => item.id_category1 === value)
    )
  } else {
    diseaseList.value.length = 0
    diseaseListDefault.length = 0
    diseaseList.value = [...filteredListDisease.value]
    diseaseListDefault.push(...filteredListDisease.value)
  }
}

const category2Selected = async (value: any) => {
  data.value.disease.id_category2 = value
  if (!data.value.id_pet_illness_history) data.value.id_disease = ''
  if (value) {
    diseaseList.value.length = 0
    diseaseListDefault.length = 0
    diseaseList.value = [
      ...filteredListDisease.value.filter(
        (item) =>
          item.id_category1 === data.value.disease.id_category1 &&
          item.id_category2 === value
      )
    ]
    diseaseListDefault.push(
      ...filteredListDisease.value.filter(
        (item) =>
          item.id_category1 === data.value.disease.id_category1 &&
          item.id_category2 === value
      )
    )
  } else {
    if (data.value.disease.id_category1) {
      diseaseList.value.length = 0
      diseaseListDefault.length = 0

      diseaseList.value = [
        ...filteredListDisease.value.filter(
          (item) => item.id_category1 === data.value.disease.id_category1
        )
      ]
      diseaseListDefault.push(
        ...filteredListDisease.value.filter(
          (item) => item.id_category1 === data.value.disease.id_category1
        )
      )
    }
  }
}

const blankField = (row) => (data.value = blank(data.value, row))

const selectingDisease = async (value) => {
  if (value) {
    showValidation.value = false
  }
  if (!value || value == '') {
    data.value.name_disease = ''
  }
  data.value.flg_congenital = false
  if (data.value.id_disease) {
    const selectedDisease = filteredListDisease.value.find(
      (item) => item.id_disease === data.value.id_disease
    )
    data.value.name_disease = selectedDisease?.name_disease
    data.value.flg_congenital = selectedDisease?.flg_congenital
    const conditions = [
      selectedDisease?.memo_inspection,
      selectedDisease?.memo_diagnosis,
      selectedDisease?.memo_plan,
      selectedDisease?.memo_after,
      selectedDisease?.memo_other
    ]
    if (
      conditions.some((cd) => {
        return cd
      })
    ) {
      await mtUtils
        .confirm(
          '基本治療方針のデータがあります。既往歴に反映しますか？',
          '傷病マスタの適用',
          '適用'
        )
        .then((confirmation) => {
          if (confirmation) {
            if (selectedDisease) {
              data.value.memo_inspection =
                data.value.memo_inspection +
                ' ' +
                selectedDisease.memo_inspection
              data.value.memo_diagnosis =
                data.value.memo_diagnosis + ' ' + selectedDisease.memo_diagnosis
              data.value.memo_plan =
                data.value.memo_plan + ' ' + selectedDisease.memo_plan
              data.value.memo_after =
                data.value.memo_after + ' ' + selectedDisease.memo_after
              data.value.memo_other =
                data.value.memo_other + ' ' + selectedDisease.memo_other
            }
          }
        })
    }
  }
}

const { openDialog } = useDialogFactory()
const onClickDiseaseOpt = () => {
  mtUtils.popup(DialogContentDiseaseOpt, {
    onSubmit(selectedDisease) {
      data.value.id_disease = selectedDisease.value
      selectingDisease(selectedDisease)
    }
  }, true)
  // openDialog(DialogContentDiseaseOpt, {
  //   dialogBase: { maximized: true, persistent: false, noEscDismiss: false }
  // }).onOk((itemDisease) => {
  //   data.value.id_disease = itemDisease.value
  //   selectingDisease(itemDisease)
  // })
}
const onClearReadonly = () => {
  data.value.id_disease = ''
  selectingDisease(data.value.id_disease)
}

const InputEmployeeOptGroup = defineAsyncComponent(
  () => import('@/components/form/InputEmployeeOptGroup.vue')
)

const changePetSelected = (v) => {
  petSelected.value = v
  data.value.id_pet = v.id_pet
}
const submit = async () => {
  showValidation.value = false
  if (!data.value.id_disease && !data.value.name_disease_free) {
    showValidation.value = true
    await nextTick()
    diseaseSelectRef.value?.$el.querySelector('input')?.focus()
    return
  }
  const isValid = await formRef.value?.validate()
  if (!isValid) {
    return
  }
  loading.value = true
  if (!petSelected.value.id_pet) {
    mtUtils.autoCloseAlert('対象ペット情報を設定してください。')
    loading.value = false
    return false
  }
  data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  if (!data.value.flg_finished) delete data.value.date_req_end
  if (!data.value.flg_free_disease_name_ui) delete data.value.name_disease_free
  data.value.id_pet = petSelected.value.id_pet
  if (!props.create) {
    illnessHistoryStore
      .updateIllnessHistory(data.value.id_pet_illness_history, data.value)
      .then(async () => {
        loading.value = false
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
        event_bus.emit('resetIllnessHistory')
        await illnessHistoryStore.selectIllnessHistory(
          illnessHistoryStore.getIllnessHistory?.id_pet_illness_history
        )
        await illnessHistoryStore.fetchIllnessHistorys({
          id_pet: petSelected.value?.id_pet,
          id_customer: customerSelected.value?.id_customer
        })
      })
  } else {
    delete data.value.id_pet_illness_history
    illnessHistoryStore
      .submitIllnessHistory(data.value)
      .then(async (response) => {
        loading.value = false
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
        event_bus.emit('resetIllnessHistory')
        const addedIllnessHistory = {
          id_pet_illness_history: response?.data?.data?.id_pet_illness_history,
          id_pet: petSelected.value.id_pet,
        }
        const selectedIllnessPayload = {
          illnessHistory: addedIllnessHistory,
          updateCheckbox: true
        }
        event_bus.emit('selectIllnessHistory', selectedIllnessPayload)

        const status = requestStatusStore.getRequestStatuses?.find((status: any) => status.id_status)
        illnessHistoryStore.updReqUiState({
          id_pet_illness_history: addedIllnessHistory.id_pet_illness_history,
          operation: 'push',
          id_req_status: status?.id_req_status
        })
        await illnessHistoryStore.fetchIllnessHistorys({
          id_pet: petSelected.value?.id_pet,
          id_customer: customerSelected.value?.id_customer
        })
        if (!getLeftSideIllnessHistoryList.value.length) {
          illnessHistoryStore.selectIllnessHistory(
            response?.data?.data?.id_pet_illness_history,
            { isWhole: false }
          )
        }
      })
  }
}
const closeModal = () => {
  loading.value = false
  emits('close')
}
const init = () => {
  if (data.value?.name_disease_free) {
    data.value.flg_free_disease_name_ui = true
  } else {
    data.value.flg_free_disease_name_ui = false
  }
}

const selectDefaultEmployee = (key: string) => {
  data.value[key] = defaultEmployee
}

const formLabels = computed(() => {
  switch (data.value.type_history) {
    case 1:
      return {
        labelMemoSymptoms: '主訴',
        labelMemoInspection: '検査 / 類症鑑別',
        labelMemoDiagnosis: '評価 / 診断',
        labelMemoPlan: '治療方針',
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
    case 8: // Other history その他
      return {
        labelMemoSymptoms: 'オーナーの要望',
        labelMemoInspection: '獣医師の推奨',
        labelMemoDiagnosis: '',
        labelMemoPlan: '',
        labelMemoAfter: '',
        labelMemoOther: 'その他'
      }
    default:
      return {
        labelMemoSymptoms: '主訴',
        labelMemoInspection: '検査 / 類症鑑別',
        labelMemoDiagnosis: '評価 / 診断',
        labelMemoPlan: '治療方針',
        labelMemoAfter: '予後',
        labelMemoOther: 'その他'
      }
  }
})

const isUpdating = ref(false)

const togglePin = async () => {
  if (isUpdating.value) return
  isUpdating.value = true

  try {
    data.value.flg_pinned = !data.value.flg_pinned

    if (props.create) {
      await mtUtils.autoCloseAlert(
        data.value.flg_pinned
          ? 'ピン留めしました。'
          : 'ピン留めを解除しました。'
      )
    } else {
      await illnessHistoryStore.updateIllnessHistory(
        data.value.id_pet_illness_history,
        {
          flg_pinned: data.value.flg_pinned
        }
      )

      await mtUtils.autoCloseAlert(
        data.value.flg_pinned
          ? 'ピン留めしました。'
          : 'ピン留めを解除しました。'
      )

      await illnessHistoryStore.selectIllnessHistory(
        data.value.id_pet_illness_history
      )

      if (typeof filterData !== 'undefined') {
        await illnessHistoryStore.fetchIllnessHistorys(filterData.value)
      }
    }
  } catch (error) {
    console.error('Failed to update pin status:', error)
    await mtUtils.autoCloseAlert('ピン留めの更新に失敗しました。', 'error')

    data.value.flg_pinned = !data.value.flg_pinned
  } finally {
    isUpdating.value = false
  }
}

const filteredListDisease = computed(() => {
  const returnedList = []
  const popularDisease = []
  const parentCategoryList = uniq(
    getListDisease.value.map((v) => v.id_category2)
  )

  const popularDiseaseList = sortBy(
    getListDisease.value,
    'display_order'
  ).filter((v) => v.display_order <= 50)
  if (popularDiseaseList.length > 0) {
    returnedList.push({
      label: 'よくある傷病',
      disable: true,
      color: '#0b3391'
    })
    popularDiseaseList.forEach((disease) => {
      popularDisease.push(disease.id_disease)
      returnedList.push(disease)
    })
  }

  parentCategoryList.forEach((id_category2) => {
    if (
      getListDisease.value.filter((v) => v.id_category2 == id_category2)
        ?.length > 0
    ) {
      const category = categoryStore.getAllCategories.find(
        (v) => v.id_category == id_category2
      )
      returnedList.push({
        ...category,
        disable: true,
        color: '#0b3391'
      })

      forEach(sortBy(getListDisease.value, 'display_order'), (disease) => {
        if (
          disease.id_category2 == id_category2 &&
          !popularDisease?.includes(disease.id_disease)
        )
          returnedList.push(disease)
      })
    }
  })

  return toArray(returnedList)
})

onMounted(async () => {
  diseaseList.value.length = 0
  diseaseListDefault.length = 0
  diseaseList.value = [...filteredListDisease.value]
  diseaseListDefault.push(...diseaseList.value)

  if (!props.create) {
    if (props.id_pet_illness_history) {
      await illnessHistoryStore.selectIllnessHistory(
        props.id_pet_illness_history
      )
      data.value = JSON.parse(
        JSON.stringify(illnessHistoryStore.getIllnessHistory)
      )
    }
    init()
  } else {
    if (props.requestDetailPage) {
      data.value.date_req_bgn = props.requestDetailPage.date_request_start
    }
  }

  petList.value = customerStore.getCustomer?.pets
  petSelected.value = props.petSelected
  customerSelected.value = customerStore.getCustomer

  if (props.id_employee_doctor) {
    data.value.id_employee_doctor = props.id_employee_doctor
    selectedDoctor.value = props.id_employee_doctor
    // data.value.id_employee_staff = props.requestDetailPage.id_employee_staff
  } else if (getPet.value) {
    data.value.id_employee_doctor = getPet.value.id_employee_main_doctor
    selectedDoctor.value = getPet.value.id_employee_main_doctor
  } else if (props.requestDetailPage) {
    data.value.id_employee_doctor = props.requestDetailPage.id_employee_doctor
    data.value.id_employee_staff = props.requestDetailPage.id_employee_staff
    selectedDoctor.value = props.requestDetailPage.id_employee_staff
  } else if (localStorage.getItem('id_employee_doctor')) {
    data.value.id_employee_doctor = localStorage.getItem('id_employee_doctor')
    selectedDoctor.value = localStorage.getItem('id_employee_doctor')
  } else {
    data.value.id_employee_doctor = getDoctors.value?.[0]?.id_employee
    selectedDoctor.value = getNonDoctors.value?.[0]?.id_employee
  }

  if (!data.value.type_history) {
    data.value.type_history = 1
  }

  if (!data.value.id_employee_staff) {
    data.value.id_employee_staff = props.requestDetailPage
      ? props.requestDetailPage.id_employee_staff
      : illnessHistoryStore.getIllnessHistory?.id_employee_staff
  }

  if (illnessHistoryStore?.getIllnessHistory?.id_employee_doctor) {
    data.value.id_employee_doctor =
      illnessHistoryStore.getIllnessHistory.id_employee_doctor
  }
})

const updateStaff = (val: number) => {
  data.value.id_employee_staff = val
}

const setTypeHistory = (val: number) => {
  const label: string = typeHistoryConfig.find((history) => {
    return history.value === val
  })?.label
  if (val !== 1) {
    data.value.flg_free_disease_name_ui = true
    data.value.name_disease_free = label
    return
  }
  data.value.flg_free_disease_name_ui = false
  data.value.name_disease_free = ''
  return
}

const switchToQuickIllnessHistory = async () => {
  closeModal()
  await mtUtils.popup(QuickIllnessHistoryModal, {
    id_employee_doctor: props.requestDetailPage?.id_employee_doctor,
    id_employee_staff: props.requestDetailPage?.id_employee_staff,
    petSelected: props.petSelected,
    requestDetailPage: props.requestDetailPage,
    create: true
  })
}
</script>

<template>
  <MtModalHeader @closeModal="closeModal" :closeBtn="viewOnly ? false : true">
    <q-toolbar-title class="text-grey-900 title2 bold">
      {{
        typeHistoryConfig.find((type) => {
          return type.value === data.type_history
        })?.label
      }}
    </q-toolbar-title>
    <q-btn
      class="bg-grey-300 q-mr-sm q-px-lg"
      size="14px"
      @click="switchToQuickIllnessHistory"
      outline
      v-if="create"
    >
      <span>かんたん入力</span>
    </q-btn>
    <MtPetFilterSelect
      v-model:selecting="petSelected"
      :pet-list="petList"
      label="対象ペット *"
      @update:model-value="changePetSelected"
      :customer="customerStore.getCustomer"
      :readonly="viewOnly"
    />
    <q-btn class="q-mx-sm" flat round @click="openMenu" v-if="!viewOnly">
      <q-icon name="more_horiz" size="xs" />
    </q-btn>
    <q-btn flat round @click="emits('edit')" v-if="viewOnly">
      <q-icon size="xs" name="edit" />
    </q-btn>
  </MtModalHeader>
  <q-form ref="formRef" @submit.prevent="submit" :class="props.withScroll ? 'modal-content' : ''">
    <q-card-section class="q-px-lg">
      <div
        class="col q-mb-md bg-accent-100 q-pa-md"
        v-if="!props.id_pet_illness_history"
      >
        <MtInputForm
          type="radio"
          v-model="data.type_history"
          :items="typeHistoryConfig"
          @update:model-value="setTypeHistory"
          :readonly="viewOnly"
        />
        <div class="caption1 regular text-grey-600 q-mt-sm">
          ※ 初回選択。予防/美容等は1頭に1つ作成しご利用ください。
        </div>
      </div>
      <!-- <div v-if="data.type_history === 1 && !data.name_disease_free">
        <MtCategorySelectionComponent
          :flg_for_disease="true"
          prefix="DS"
          :data="data.disease"
          :id_category1="data.disease.id_category1"
          @category1Selected="category1Selected"
          @category2Selected="category2Selected"
          :id_category2="data.disease.id_category2"
          col_class="col-3"
          :readonly="viewOnly"
        />
      </div> -->

      <!--Necessary these only when this is illness history-->
      <div v-if="data.type_history === 1" class="row q-col-gutter-md q-my-md">
        <div class="col-3">
          <MtFilterSelect
            ref="diseaseSelectRef"
            label="傷病名・診断名 *"
            v-model:selecting="data.id_disease"
            v-model:options="diseaseList"
            class="bg-white"
            :error="showValidation"
            :error-message="showValidation ? '入力必須項目です' : ''"
            :options-default="diseaseListDefault"
            @selected="selectingDisease"
            @click="onClickDiseaseOpt"
            @on-clear-readonly="onClearReadonly"
            readonly
            clearable-readonly
            tabindex="1"
            required
          />
          <!-- :disable="viewOnly" -->
        </div>
        <div class="col q-ml-md">
          <div class="flex items-center bg-grey-200 q-pa-sm">
            診断確度
            <MtInputForm
              type="radio"
              class="q-ml-md"
              v-model="data.diagnosis_confidence"
              label="診断確度"
              :items="typeDiagnosisConfidence"
              tabindex="2"
              :readonly="viewOnly"
            />
          </div>
        </div>
      </div>

      <!--Necessary these only when this is illness history-->
      <div v-if="data.type_history === 1" class="row q-col-gutter-md q-mb-md">
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '診断前状態名' }]"
            v-model="data.flg_free_disease_name_ui"
            @click="blankField(['name_disease_free'])"
            :readonly="viewOnly"
          />
        </div>
        <div class="col-3" v-if="data.flg_free_disease_name_ui">
          <MtInputForm
            type="text"
            v-model="data.name_disease_free"
            label="診断前状態名：自由入力"
          />
          <!-- :disable="viewOnly" -->
        </div>
        <!-- <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '先天性疾患' }]"
            v-model="data.flg_congenital"
            :readonly="viewOnly"
          />
        </div> -->
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '慢性疾患' }]"
            v-model="data.flg_chronical"
            :readonly="viewOnly"
          />
        </div>
      </div>

      <!--Common Section-->
      <div class="row q-col-gutter-md q-mb-md">
        <div  :class="props.fullWidth ? 'col-10' : 'col-3'">
          <MtFormInputDate
            type="date"
            v-model:date="data.date_req_bgn"
            label="開始日 *"
            tabindex="3"
            required
            :rules="[aahValidations.validationRequired]"
            :readonly="viewOnly"
          />
        </div>
        <div :class="props.fullWidth ? 'col-12' : 'col-auto'" v-if="!viewOnly">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '終了' }]"
            v-model="data.flg_finished"
            tabindex="4"
            :readonly="viewOnly"
          />
        </div>
        <div v-if="data.flg_finished" :class="props.fullWidth ? 'col-12' : 'col-3'">
          <MtFormInputDate
            type="date"
            v-model:date="data.date_req_end"
            label="終了日"
            tabindex="5"
            :readonly="viewOnly"
          />
        </div>
        <div class="col" style="text-align: right">
          <q-btn flat round dense @click="togglePin" :readonly="viewOnly">
            <q-icon
              name="push_pin"
              size="22px"
              :style="{ opacity: data.flg_pinned ? 1 : 0.3 }"
            />
          </q-btn>
        </div>
      </div>

      <!--Common Section-->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-3" :class="props.fullWidth ? 'col-6' : 'col-3'">
          <InputEmployeeOptGroup
            v-model:selected="data.id_employee_doctor"
            :id-employee="data.id_employee_doctor"
            type-occupation="doctor"
            tabindex="10"
            label="担当医"
            show-select-default-employee
            @update:select-default-employee="
              selectDefaultEmployee('id_employee_doctor')
            "
            :readonly="viewOnly"
          />
        </div>
        <div class="col-3" :class="props.fullWidth ? 'col-6' : 'col-3'">
          <InputEmployeeOptGroup
            v-model:selected="data.id_employee_staff"
            :id-employee="data.id_employee_staff"
            type-occupation="staff"
            label="主担当者"
            tabindex="11"
            show-select-default-employee
            @update:model-value="updateStaff"
            @update:select-default-employee="
              selectDefaultEmployee('id_employee_staff')
            "
            :readonly="viewOnly"
          />
        </div>
      </div>

      <!--Common Section-->
      <div class="row q-col-gutter-md q-mb-md">
        <div v-if="(viewOnly && data.memo_symptoms) || !viewOnly" class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_symptoms"
            :label="formLabels.labelMemoSymptoms"
            tabindex="20"
            autogrow
            :readonly="viewOnly"
          />
        </div>
        <div v-if="(viewOnly && data.memo_inspection) || !viewOnly" class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_inspection"
            :label="formLabels.labelMemoInspection"
            tabindex="21"
            autogrow
            :readonly="viewOnly"
          />
        </div>
      </div>

      <!--Hide these when type = other IH-->
      <div class="row q-col-gutter-md q-mb-md" v-if="data.type_history !== 8">
        <div v-if="(viewOnly && data.memo_diagnosis) || !viewOnly" class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_diagnosis"
            :label="formLabels.labelMemoDiagnosis"
            tabindex="22"
            autogrow
            :readonly="viewOnly"
          />
        </div>
        <div v-if="(viewOnly && data.memo_plan) || !viewOnly" class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_plan"
            :label="formLabels.labelMemoPlan"
            tabindex="23"
            autogrow
            :readonly="viewOnly"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-lg-6 col-md-6 col-sm-12" v-if="(viewOnly && data.memo_after) || !viewOnly && data.type_history !== 8">
          <MtInputForm
            type="text"
            v-model="data.memo_after"
            :label="formLabels.labelMemoAfter"
            tabindex="24"
            autogrow
            :readonly="viewOnly"
          />
        </div>
        <div v-if="(viewOnly && data.memo_other) || !viewOnly" class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_other"
            :label="formLabels.labelMemoOther"
            tabindex="25"
            autogrow
            :readonly="viewOnly"
          />
        </div>
      </div>
    </q-card-section>
  </q-form>
  <q-card-section class="q-bt bg-white" v-if="!viewOnly">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal">
        <span>キャンセル</span>
      </q-btn>
      <q-btn
        @click="submit"
        unelevated
        color="primary"
        tabindex="30"
        class="q-ml-md"
        :readonly="viewOnly"
        :loading="loading"
      >
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
<style scoped>
.modal-content {
  max-height: calc(100vh - 235px);
  overflow-y: auto;
}
</style>
