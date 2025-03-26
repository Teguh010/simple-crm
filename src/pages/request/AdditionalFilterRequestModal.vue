<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useRequestStore from '@/stores/requests'
import useCustomerStore from '@/stores/customers'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { keys } from 'lodash'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { storeToRefs } from 'pinia'
import useCommonStore from '@/stores/common'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'

const props = defineProps({
  search: {
    type: Object,
    default: () => ({})
  }
})
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const requestStore = useRequestStore()
const customerStore = useCustomerStore()
const { getCustomer } = storeToRefs(customerStore)

const customerList = ref([])
const customerListDefault = reactive([])

const breedOptionList = ref([])
const breedDefaultOptionList = reactive([])

const search = ref({
  number_request: null,
  name_customer: '',
  id_customer: null,
  id_pet: null,
  code_customer: null,
  title_request: null,
  flg_complete: false,
  flg_complete_payment: false,
  id_clinic: null
})
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const searchData = () => {
  let count = 0

  const finalPayload = {}

  Object.entries(search.value).forEach(([key, value]) => {
    // Skip unneeded fields
    if (['date_request_start', 'date_request_goal', 'id_clinic', 'json'].includes(key)) {
      return;
    }
    if (['flg_complete'].includes(key)) {
      if (value === true) {
        finalPayload[key] = false
        count++
      }
      return
    }
    if ([ 'flg_complete_payment'].includes(key)) {
      if (value === true) {
        finalPayload[key] = false
        count++
      }
      return
    }

    if (
      (Array.isArray(value) && value.length > 0) ||
      // Or a boolean true (for other boolean fields that are not flg_complete*)
      (typeof value === 'boolean' && value === true) ||
      // Or any non-null, non-boolean, non-empty value
      (value !== null && value !== '' && !Array.isArray(value) && typeof value !== 'boolean')
    ) {
      finalPayload[key] = value
      count++
    }
  })
  requestStore.setRequestSearch(finalPayload, count)
  emits('close')
}


async function selectingCustomer() {
  if (!search.value.id_customer) {
    // Reset id_pet if customer is cleared
    search.value.id_pet = null
  } else {
    await customerStore.selectCustomer(search.value.id_customer)
    if (getCustomer.value) {
      if (
        getCustomer.value &&
        getCustomer.value.pets &&
        getCustomer.value.pets.length &&
        getCustomer.value.pets.length > 0
      ) {
        search.value.id_pet = getCustomer.value.pets[0].id_pet
      }
    }
  }
}

function selectedAnimalOption(value) {
  if (value) {
    const code_func1 = commonStore.getCommonTypeAnimalOptionList?.find(
      (animal: any) => value.includes(animal.id_common)
    )?.code_func1

    if (code_func1) {
      breedDefaultOptionList.length = 0
      breedOptionList.value.length = 0
      breedDefaultOptionList.push(
        ...commonStore.getCommonBreedOptionList.filter(
          (common: any) => common.code_func1 == code_func1
        )
      )

      if ([1, 2, 4, '1', '2', '3'].includes(code_func1)) {
        // This if is for bread of dogs, due to 3 sizes

        breedOptionList.value.length = 0
        breedDefaultOptionList.push(
          ...commonStore.getCommonBreedOptionList.filter((common: any) =>
            [1, 2, 4, '1', '2', '3'].includes(common.code_func1)
          )
        )
      }

      breedOptionList.value = [...breedDefaultOptionList]
    }
  }
}

const init = async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [1, 2] })
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
 if (props.search.id_employee_doctor){
    search.value.id_employee_doctor=props.search.id_employee_doctor
 }
 if (props.search.id_employee_staff){
    search.value.id_employee_staff=props.search.id_employee_staff
 }
  if (props.search.number_request){
    search.value.number_request= props.search.number_request
  }
  if (props.search.name_customer){
    search.value.name_customer= props.search.name_customer
  }
  if (props.search.id_customer){
    search.value.id_customer= props.search.id_customer
  }
  if (props.search.id_pet){
    search.value.id_pet= props.search.id_pet
  }
  if (props.search.code_customer){
    search.value.code_customer= props.search.code_customer
  }
  if (props.search.title_request){
    search.value.title_request= props.search.title_request
  }
  if (props.search.id_clinic){
    search.value.id_clinic= props.search.id_clinic
  }
  if (props.search.flg_complete === null ) {
    search.value.flg_complete = false
  } else if (props.search.flg_complete === false){
    search.value.flg_complete = true
  }
  if (props.search.flg_complete_payment === null  ) {
    search.value.flg_complete_payment = false
  } else if (props.search.flg_complete_payment === false  ) {
    search.value.flg_complete_payment = true
  }

  if (props.search.id_cm_animal_list) {
    search.value.id_cm_animal_list = JSON.parse(
      props.search.id_cm_animal_list
    )
    selectedAnimalOption(search.value.id_cm_animal_list)
  }
  if (props.search.id_cm_breed_list)
    search.value.id_cm_breed_list = JSON.parse(
      props.search.id_cm_breed_list
    )
}

const selectDefaultEmployee = (key: string) => {
  search.value[key] = defaultEmployee
}

onMounted(() => {
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-lg">
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFilterSelect
        outlined
        label="診察券番号"
        tabindex="1"
        autofocus
        v-model:selecting="search.id_customer"
        v-model:options="customerList"
        :options-default="customerListDefault"
        @update:selecting="selectingCustomer"
      />
    </div>
    <div
      class="col-lg-12 col-md-12 col-sm-12"
      v-if="search.id_customer && getCustomer"
    >
      <MtFormPullDown
        outlined
        tabindex="2"
        label="ペット名"
        v-model:selected="search.id_pet"
        v-model:options="getCustomer.pets"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.number_request"
        label="リクエスト番号"
        outlined
        tabindex="3"
        type="text"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <InputEmployeeOptGroup
        v-model:selected="search.id_employee_doctor"
        label="担当医"
        outlined
        tabindex="4"
        type-occupation="doctor"
        clearable
        show-select-default-employee
        @update:select-default-employee="
          selectDefaultEmployee('id_employee_doctor')
        "
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <InputEmployeeOptGroup
        v-model:selected="search.id_employee_staff"
        label="担当者"
        tabindex="5"
        outlined
        type-occupation="staff"
        clearable
        show-select-default-employee
        @update:select-default-employee="
          selectDefaultEmployee('id_employee_staff')
        "
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.title_request"
        label="リクエスト名"
        outlined
        tabindex="6"
        type="text"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFormMultipleSelection
        :options="getCommonTypeAnimalOptionList"
        v-model="search.id_cm_animal_list"
        label="動物種"
        option-label="label"
        option-value="value"
        outlined
        required
        @update:model-value="selectedAnimalOption"
      >
      </MtFormMultipleSelection>
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFormMultipleSelection
        v-if="search.id_cm_animal_list"
        v-model="search.id_cm_breed_list"
        v-model:options="breedOptionList"
        :options-default="breedDefaultOptionList"
        class="q-mr-sm selection-field"
        label="ペット品種"
        outlined
        tabindex="8"
      />
    </div>
    <div class="col-12">
      <MtInputForm
        type="checkbox"
        v-model="search.flg_complete"
        :items="[{ label: '未完了のみ', value: 1 }]"
      />
      <MtInputForm
        type="checkbox"
        v-model="search.flg_complete_payment"
        :items="[{ label: '支払未完了のみ', value: 1 }]"
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn
        tabindex="10"
        color="primary"
        class="q-ml-md"
        @click="searchData()"
      >
        <span>確定</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
