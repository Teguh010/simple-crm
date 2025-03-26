<script lang="ts" setup>
import { defineAsyncComponent, ref, onMounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'

import { PetType, RequestDetailPageType } from '@/types/types'
import { getFullPetNameWithoutHonorific } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { sortBy, filter } from 'lodash'
import { event_bus } from '@/utils/eventBus'

import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'
import useCategoryStore from '@/stores/categories'
import useDiseaseStore from '@/stores/diseases'
import useIllnessHistoryStore from '@/stores/illness-history'
import useRequestStore from '@/stores/requests'

import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'

import aahValidations from '@/utils/aahValidations'
import { getDateToday } from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'

const InputEmployeeOptGroup = defineAsyncComponent(
  () => import('@/components/form/InputEmployeeOptGroup.vue')
)

const UpdateIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue')
)

// Props and Emits
const emits = defineEmits(['close', 'edit', 'deleted'])
const props = withDefaults(
  defineProps<{
    // petSelected: PetType | null
    create: boolean
    id_employee_doctor: string | number
    id_employee_staff: string | number
    id_pet_illness_history?: string
    // requestDetailPage: RequestDetailPageType | null
    viewOnly: boolean
    withScroll: boolean
    fullWidth: boolean
    fromForm: boolean
  }>(),
  {
    // petSelected: null,
    create: false,
    id_employee_doctor: '',
    id_employee_staff: '',
    id_pet_illness_history: '',
    // requestDetailPage: null,
    viewOnly: false,
    withScroll: true,
    fullWidth: false,
    fromForm: false
  }
)

const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const diseaseStore = useDiseaseStore()
const illnessHistoryStore = useIllnessHistoryStore()
const requestStore = useRequestStore()

const { getPet } = storeToRefs(customerStore)

const employeeStore = useEmployeeStore()
const { getDoctors, getNonDoctors } = storeToRefs(employeeStore)
const { getLeftSideIllnessHistoryList } = storeToRefs(illnessHistoryStore)
const { getRequestDetailPage } = storeToRefs(requestStore)

const route = useRoute()

const loading = ref(false)
const data = ref({
  id_pet: '',
  id_disease: '',
  id_clinic: '',
  type_history: 1,
  flg_pinned: false,
  name_disease: '', // data from button
  flg_congenital: false,
  flg_chronical: false,
  type_diagnosis_confidence: 1,
  memo_symptoms: '',
  memo_inspection: '',
  memo_diagnosis: '',
  memo_plan: '',
  memo_after: '',
  memo_other: '',
  date_req_bgn: getDateToday(),
  flg_finished: false,
  id_employee_doctor: '', //get from ui
  id_employee_staff: ''
})

const petSelected = ref()
const selectedDoctor = ref()
const customerSelected = ref()

const sortedDiseaseListUnderHundred = computed(() => {
  const filterByFlgQuick = filter(
    diseaseStore.getListDisease,
    'flg_quick_illness_history'
  )
  const filterByDisplayOrderUnder100 = filter(
    filterByFlgQuick,
    (disease) => disease.display_order < 100
  )
  return sortBy(filterByDisplayOrderUnder100, 'display_order')
})

const sortedDiseaseListOverHundred = computed(() => {
  const filterByFlgQuick = filter(
    diseaseStore.getListDisease,
    'flg_quick_illness_history'
  )
  const filterByDisplayOrderOver100 = filter(
    filterByFlgQuick,
    (disease) => disease.display_order >= 100
  )
  return sortBy(filterByDisplayOrderOver100, 'display_order')
})

const optionLabel = (v) => {
  if (v) {
    if (v.customer_name_family)
      return getFullPetNameWithoutHonorific(v) + ' : ' + v.code_pet
    if (v.name_pet) return v.name_pet + ' : ' + v.code_pet
    return v.label
  }
  return ''
}

const setPetSelected = ref()

const selectDefaultEmployee = (key: string) => {
  data.value[key] = defaultEmployee
}

const closeModal = () => {
  loading.value = false
  emits('close')
}
const switchToUpdateIllnessHistory = async () => {
  closeModal()

  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    id_employee_doctor: getRequestDetailPage.value.id_employee_doctor,
    id_employee_staff: getRequestDetailPage.value.id_employee_staff,
    petSelected: getPet.value,
    requestDetailPage: getRequestDetailPage.value,
    create: true
  })
}

const init = () => {
  petSelected.value = getPet.value
  setPetSelected.value = optionLabel(petSelected.value)
  customerSelected.value = customerStore.getCustomer
  data.value.id_employee_doctor = getPet.value.id_employee_main_doctor
  selectedDoctor.value = getPet.value.id_employee_main_doctor
}

const createIllnessHistory = async (item) => {
  loading.value = true
  data.value.id_pet = petSelected.value.id_pet
  data.value.name_disease = item.name_disease
  data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  data.value.id_disease = item.id_disease

  illnessHistoryStore
    .submitIllnessHistory(data.value)
    .then(async (response) => {
      loading.value = false
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
      console.log("route.name", route.name);
      
      if (route.name === 'RequestDetail') {
        event_bus.emit('resetIllnessHistory')
        const addedIllnessHistory = {
          id_pet_illness_history: response?.data?.data?.id_pet_illness_history,
          id_pet: petSelected.value.id_pet
        }

        const selectedIllnessPayload = {
          illnessHistory: addedIllnessHistory,
          updateCheckbox: true
        }
        event_bus.emit('selectIllnessHistory', selectedIllnessPayload)

        // const status = requestStatusStore.getRequestStatuses?.find(
        //   (status: any) => status.id_status
        // )
        // illnessHistoryStore.updReqUiState({
        //   id_pet_illness_history: addedIllnessHistory.id_pet_illness_history,
        //   operation: 'push',
        //   id_req_status: status?.id_req_status
        // })

        await illnessHistoryStore.fetchIllnessHistorys({
          id_pet: petSelected.value?.id_pet,
          id_customer: customerSelected.value?.id_customer
        })

        if (props.fromForm) {
          event_bus.emit(
            'submitQuickIllnessHistory',
            addedIllnessHistory.id_pet_illness_history
          )
        }
        if (!getLeftSideIllnessHistoryList.value.length) {
          illnessHistoryStore.selectIllnessHistory(
            response?.data?.data?.id_pet_illness_history,
            { isWhole: false }
          )
        }
      }
    })
}

onMounted(async () => {
  await categoryStore.fetchPreparationCategories()
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal" :closeBtn="viewOnly ? false : true">
    <q-toolbar-title class="text-grey-900 title2 bold">
      クイック既往歴
    </q-toolbar-title>

    <q-btn
      class="bg-grey-300 q-mr-sm q-px-lg"
      size="14px"
      @click="switchToUpdateIllnessHistory"
      outline
    >
      <span>対応歴の詳細登録</span>
    </q-btn>

    <MtInputForm
      type="text"
      v-model="setPetSelected"
      label="対象ペット *"
      readonly
    />
  </MtModalHeader>
  <q-form
  >
    <q-card-section class="q-px-lg">
      <!--Common Section-->
      <div class="row q-col-gutter-md q-mb-md">
        <div :class="props.fullWidth ? 'col-10' : 'col-3'">
          <MtFormInputDate
            type="date"
            v-model:date="data.date_req_bgn"
            label="開始日 *"
            required
            :rules="[aahValidations.validationRequired]"
            :readonly="viewOnly"
          />
        </div>
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
      </div>

      <div class="caption1 regular text-grey-700 q-mt-md">
        既往歴の簡易登録を行います。簡易登録した既往歴を後から詳細の病名に変更可能です。対応歴の詳細を登録する場合には「対応歴の詳細登録」ボタンから行ってください。<br />ここに表示する項目は傷病マスタからカスタマイズ可能です。
      </div>

      <q-scroll-area class="modal-content q-mt-sm" :visible="false">
        <h3 class="q-my-md">診療科</h3>
        <div class="row q-mt-md q-mb-lg q-ml-none">
          <div
            class="col-2 q-pr-sm q-pb-sm"
            v-for="item in sortedDiseaseListUnderHundred"
          >
            <q-btn
              @click="createIllnessHistory(item)"
              class="full-width text-black q-py-xs"
              unelevated
              outline
              size="18px"
              :loading="loading"
            >
              <span> {{ item.label }} </span>
            </q-btn>
          </div>
        </div>
        <h3 class="q-my-md">主な主訴</h3>
        <div class="row q-my-md q-ml-none">
          <div
            class="col-3 q-pr-sm q-pb-sm"
            v-for="item in sortedDiseaseListOverHundred"
          >
            <q-btn
              @click="createIllnessHistory(item)"
              class="full-width bg-grey-200 text-black q-py-xs"
              unelevated
              size="18px"
              :loading="loading"
            >
              <span> {{ item.label }} </span>
            </q-btn>
          </div>
        </div>
      </q-scroll-area>
    </q-card-section>
  </q-form>
</template>

<style scoped>
.modal-content {
  height: calc(100vh - 240px);
  overflow: hidden;
}
</style>
