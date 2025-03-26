<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useCustomerStore from '@/stores/customers'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { storeToRefs } from 'pinia'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useDiseaseStore from '@/stores/diseases'
import useItemStore from '@/stores/items'
import useCommonStore from '@/stores/common'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtSearchItemService from '@/components/MtSearchItemService.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import useInjectStore from '@/stores/inject'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const diseaseStore = useDiseaseStore()
const customerStore = useCustomerStore()
const injectStore = useInjectStore()
const itemStore = useItemStore()
const { getInjectSearchParam } = storeToRefs(injectStore)
const { getCustomer } = storeToRefs(customerStore)


const { getCommonTypeAnimalOptionList } = storeToRefs(useCommonStore())

const customerList = ref([])
const customerListDefault = reactive([])
const allDiseaseList = ref([])
const allDiseaseListDefault = reactive([])

const searchDetails = ref({
  numer_inject: null,
  id_customer: null,
  title_inject: null,
  id_pet: null,
  id_item_service: null,
  id_disease: null,
  id_cm_animal: null,
  id_category1: null,
  id_category2: null,
  id_employee_doctor: '',
  id_employee_staff: '',
  number_request: ''
})

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))


const category1Selected = (id_category1: string) => {
  searchDetails.value.id_category1 = id_category1
}
const category2Selected = (id_category2: string) => {
  searchDetails.value.id_category2 = id_category2
}

function setPrescriptionSearchParams() {
  searchDetails.value.id_cm_animal_list = JSON.stringify(searchDetails.value.id_cm_animal_list)
  injectStore.setInjectSearchParam(searchDetails.value)
  closeModal()
}

async function selectingCustomer() {
  await customerStore.selectCustomer(searchDetails.value.id_customer)
  if (getCustomer.value) {
    if (getCustomer.value && getCustomer.value.pets && getCustomer.value.pets.length && getCustomer.value.pets.length > 0) {
      searchDetails.value.id_pet = getCustomer.value.pets[0].id_pet
    }
  }
}

const selectDefaultEmployee = (key: string) => {
  searchDetails.value[key] = defaultEmployee
}

onMounted(() => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  allDiseaseList.value = [...diseaseStore.getAllDiseases]
  allDiseaseListDefault.push(...diseaseStore.getAllDiseases)

  if (getInjectSearchParam.value) {
    searchDetails.value = getInjectSearchParam.value
    if (getInjectSearchParam.value.id_cm_animal_list) {
      searchDetails.value.id_cm_animal_list = JSON.parse(getInjectSearchParam.value.id_cm_animal_list)
    }
  }
  searchDetails.value.id_category1 = null
  searchDetails.value.id_category2 = null
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-scroll-area :style="{'height' : `${64 * 12}px`}" class="content">
    <q-card-section class="row q-col-gutter-lg">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFilterSelect
          v-model:options="customerList"
          v-model:selecting="searchDetails.id_customer"
          :options-default="customerListDefault"
          autofocus
          label="診察券番号"
          outlined
          tabindex="1"
          @update:selecting="selectingCustomer()"
        />
      </div>
      <div v-if="searchDetails.id_customer && getCustomer" class="col-lg-12 col-md-12 col-sm-12">
        <MtFormPullDown
          v-model:options="getCustomer.pets"
          v-model:selected="searchDetails.id_pet"
          label="ペット名"
          outlined
          tabindex="2"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFormMultipleSelection
          v-model="searchDetails.id_cm_animal_list"
          :options="getCommonTypeAnimalOptionList"
          label="動物種"
          option-label="label"
          option-value="value"
          outlined
          required>
        </MtFormMultipleSelection>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <InputEmployeeOptGroup
          v-model="searchDetails.id_employee_doctor"
          :multiple="true"
          clearable
          label="担当医"
          outlined
          show-select-default-employee
          tabindex="4"
          type-occupation="doctor"
          @update:select-default-employee="selectDefaultEmployee('id_employee_doctor')"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="searchDetails.number_request"
          label="リクエスト番号"
          outlined
          tabindex="6"
          type="text"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="searchDetails.number_inject"
          label="注射番号"
          outlined
          tabindex="7"
          type="text"
        />
      </div>
      <MtCategorySelectionComponent
        :data="{id_category1: searchDetails.id_category1, id_category2: searchDetails.id_category2}"
        :flg_for_medicine="true"
        :flg_specific_category="true"
        :specific_category_list="['MD2', 'MD10', 'MD11', 'MD12', 'MD13', 'MD14']"
        :id_category1="searchDetails.id_category1"
        :id_category2="searchDetails.id_category2"
        full_width
        outlined
        @category1Selected="category1Selected"
        @category2Selected="category2Selected"
      />
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtSearchItemService
          label="医薬品名"
          outlined
          tabindex="9"
          @update:selecting="(value)=>{
             searchDetails.id_item_service = value
           }"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFilterSelect
          v-model:options="allDiseaseList"
          v-model:selecting="searchDetails.id_disease"
          :options-default="allDiseaseListDefault"
          label="傷病名"
          outlined
          tabindex="10"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="searchDetails.memo_inject"
          label="注射・点滴メモ"
          outlined
          tabindex="11"
          type="text" />
      </div>
    </q-card-section>
  </q-scroll-area>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" tabindex="20" @click="setPrescriptionSearchParams">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
