<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useCustomerStore from '@/stores/customers'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import usePrescriptionStore from '@/stores/prescription'
import { storeToRefs } from 'pinia'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useDiseaseStore from '@/stores/diseases'
import useItemStore from '@/stores/items'
import useCommonStore from '@/stores/common'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtSearchItemService from '@/components/MtSearchItemService.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const diseaseStore = useDiseaseStore()
const customerStore = useCustomerStore()
const prescriptionStore = usePrescriptionStore()
const itemStore = useItemStore()
const { getAllItems } = storeToRefs(itemStore)
const { getPrescriptionSearchParams } = storeToRefs(prescriptionStore)
const { getCustomer } = storeToRefs(customerStore)


const {getCommonTypeAnimalOptionList} = storeToRefs(useCommonStore());

const customerList = ref([])
const customerListDefault = reactive([])
const allDiseaseList = ref([])
const allDiseaseListDefault = reactive([])
const itemServiceOptions: any = ref([])
const itemServiceDefaultOptions: any = reactive([])

const searchDetails = ref({
  number_prescription: null,
  id_customer: null,
  title_prescription: null,
  id_pet: null,
  flg_delivered: false,
  id_item_service: null,
  id_disease: null,
  id_cm_animal: null,
  id_category1: [],
  id_category2: [],
  id_employee_doctor: '',
  id_employee_staff: '',
  number_request: '',
})
const defaultEmployee = JSON.parse(localStorage.getItem("id_employee"))

const category1Selected = async (value: any) => {
  searchDetails.value.id_category1 = value
}

const category2Selected = async (value: any) => {
  searchDetails.value.id_category2 = value
}


function setPrescriptionSearchParams(){
  searchDetails.value.id_cm_animal_list = JSON.stringify(searchDetails.value.id_cm_animal_list)
  prescriptionStore.setPrescriptionSearchParams(searchDetails.value)
  closeModal()
}
async function selectingCustomer(){
 await customerStore.selectCustomer(searchDetails.value.id_customer)
  if(getCustomer.value){
    if(getCustomer.value && getCustomer.value.pets && getCustomer.value.pets.length && getCustomer.value.pets.length > 0){
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

  getAllItems.value.filter((v) => !v.flg_service && v.type_item === 1)?.forEach((itemService: any) => {
    itemServiceDefaultOptions.push({
      value: itemService.id_item_service,
      label: itemService.name_item_service
    })
  })
  itemServiceOptions.value = [...itemServiceDefaultOptions]
  if (getPrescriptionSearchParams.value) {
    searchDetails.value = getPrescriptionSearchParams.value
    if (getPrescriptionSearchParams.value.id_cm_animal_list) {
      searchDetails.value.id_cm_animal_list = JSON.parse(getPrescriptionSearchParams.value.id_cm_animal_list)
    }
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-scroll-area class="content" :style="{'height' : `${64 * 12}px`}">
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
          clearable
          label="担当医"
          outlined
          tabindex="4"
          type-occupation="doctor"
          :multiple="true"
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee('id_employee_doctor')"
          />
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12">
        <InputEmployeeOptGroup
          v-model="searchDetails.id_employee_staff"
          clearable
          label="受け渡し担当者"
          outlined
          tabindex="5"
          type-occupation="staff"
          show-select-default-employee
          @update:select-default-employee="selectDefaultEmployee('id_employee_staf')"
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
          v-model="searchDetails.number_prescription"
          label="処方箋番号"
          outlined
          tabindex="7"
          type="text"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="searchDetails.title_prescription"
          label="処方箋名"
          outlined
          tabindex="8"
          type="text" />
      </div>
      <MtCategorySelectionComponent
        :data="{id_category1: getPrescriptionSearchParams?.id_category1,id_category2: getPrescriptionSearchParams?.id_category2}"
        :flg_for_medicine="true"
        :id_category1="searchDetails.id_category1"
        :id_category2="searchDetails.id_category2"
        :multiple="true"
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
          v-model="searchDetails.memo_prescription"
          label="処方箋メモ"
          outlined
          tabindex="11"
          type="text" />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="searchDetails.flg_delivered"
          :items="[{ label: '受け渡し未完了のみ' }]"
          type="checkbox"
        />
      </div>
    </q-card-section>
  </q-scroll-area>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn tabindex="20" color="primary" class="q-ml-md" @click="setPrescriptionSearchParams">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
