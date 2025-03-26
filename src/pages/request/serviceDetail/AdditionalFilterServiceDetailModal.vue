<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useServiceDetailStore from '@/stores/service-details'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCategoryStore from '@/stores/categories'
import useDiseaseStore from '@/stores/diseases'
import useCommonStore from '@/stores/common'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { dateFormat } from '@/utils/aahUtils'
import { date } from 'quasar'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import MtSearchItemService from '@/components/MtSearchItemService.vue'

const emits = defineEmits(['close'])
const props = defineProps({ search: Object, popup: Object })

const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const serviceDetailStore = useServiceDetailStore()
const diseaseStore = useDiseaseStore()
const { getCustomer } = storeToRefs(customerStore)
const { getCategories } = storeToRefs(categoryStore)
const { getServiceDetailParams } = storeToRefs(serviceDetailStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(useCommonStore())

const customerList = ref([])
const customerListDefault = reactive([])
const allDiseaseListDefault = reactive([])
const allDiseaseList = ref([])
const search = ref({
  number_service_detail: null,
  name_item_service: null,
  id_customer: null,
  id_pet: null,
  flg_complete: false,
  id_category1: [],
  id_category2: [],
  id_disease: null,
  id_employee_doctor: '',
  id_employee_staff: '',
  date_range_list: []
})
const dateRangeList = ref([])
const defaultEmployee = JSON.parse(localStorage.getItem("id_employee"))

const closeModal = () => {
  emits('close')
}

const category1Selected = async (value: any) => {
  search.value.id_category1 = value
}

const category2Selected = async (value: any) => {
  search.value.id_category2 = value
}

const searchData = () => {
  serviceDetailStore.setServiceDetailParams(search.value)
  emits('close')
}

const selectCustomer = async (value) => {
  await customerStore.selectCustomer(value)
  if (getCustomer.value) {
    if (getCustomer.value && getCustomer.value.pets && getCustomer.value.pets.length && getCustomer.value.pets.length > 0) {
      search.value.id_pet = getCustomer.value.pets[0].id_pet
    }
  }
}

function addDateRange() {
  if (dateRangeList.value.length < 3) {
    dateRangeList.value.push({ datetime_service_start: null, datetime_service_end: null })
  }
  search.value.date_range_list = dateRangeList.value
  if (dateRangeList.value.length) {
    let firstDateRange = search.value.date_range_list[0]
    let currentMonth = new Date().getMonth() + 1, currentYear = new Date().getFullYear(),
      lastDayNextMonth = new Date(currentYear, currentMonth + 1, 0)
    if (dateRangeList.value.length === 1) {
      firstDateRange.datetime_service_start = dateFormat(date.buildDate({
        year: currentMonth === 12 ? currentYear + 1 : currentYear,
        month: currentMonth === 12 ? 1 : currentMonth + 1,
        day: 1
      }))
      firstDateRange.datetime_service_end = dateFormat(date.buildDate({
        year: currentMonth === 12 ? currentYear + 1 : currentYear,
        month: currentMonth === 12 ? 1 : currentMonth + 1,
        day: lastDayNextMonth
      }))
    }
    for (let i = 1; i < dateRangeList.value.length; i++) {
      let dateRange = dateRangeList.value[i]
      dateRange.datetime_service_start = firstDateRange.datetime_service_start
      dateRange.datetime_service_end = firstDateRange.datetime_service_end
    }
  }
}

function popDateRange() {
  dateRangeList.value.splice(dateRangeList.value.length - 1, 1)
  search.value.date_range_list = dateRangeList.value
}

function updateServiceEndDate(val, idx) {
  if(val) {
    search.value.date_range_list[idx].datetime_service_end = dateFormat(date.addToDate(val, {month: 1}))
  }
}

function applyFilter() {
  props.popup.searchData = true
  serviceDetailStore.setServiceDetailParams(search.value)
  closeModal()
}

const init = async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  allDiseaseList.value = [...diseaseStore.getAllDiseases]
  allDiseaseListDefault.push(...diseaseStore.getAllDiseases)


  search.value = props.search
  if (props.search.date_range_list && typeof props.search.date_range_list == 'string') {
    search.value.date_range_list = JSON.parse(props.search.date_range_list)
  }
  if (props.search.id_cm_animal_list && typeof props.search.id_cm_animal_list == 'string') {
    search.value.id_cm_animal_list = JSON.parse(props.search.id_cm_animal_list)
  }
}

function selectingWhole(value) {
  search.value.id_item_service_list = JSON.stringify(value)
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
  <q-card-section class="row q-col-gutter-md content">
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFilterSelect
        outlined
        label="診察券番号"
        autofocus
        tabindex="0"
        v-model:selecting="search.id_customer"
        v-model:options="customerList"
        :options-default="customerListDefault"
        @update:selecting="selectCustomer"
      />
    </div>
    <div v-if="search.id_customer && getCustomer" class="col-lg-12 col-md-12 col-sm-12">
      <MtFormPullDown
        outlined
        label="ペット名"
        tabindex="2"
        v-model:selected="search.id_pet"
        v-model:options="getCustomer.pets"
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
        required>
      </MtFormMultipleSelection>
    </div>
    <!-- Talha -->
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.number_request"
        outlined
        label="リクエスト番号"
        tabindex="4"
        type="text" />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.number_service_detail"
        outlined
        label="治療サービス番号"
        tabindex="5"
        type="text" />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12" tabindex="7">
      <MtSearchItemService
        :multiple="true"
        label="商品名（治療サービス）"
        outlined
        @update:selecting="selectingWhole"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.parent_name_item_service"
        label="品名包装単位名"
        outlined
        type="text"
      >
      </MtInputForm>
    </div>
    <MtCategorySelectionComponent
      :flg_for_service="true"
      :flg_for_food="true"
      :flg_for_item="true"
      :data="{id_category1: search.id_category1, id_category2: search.id_category2}"
      :id_category1="search.id_category1"
      :id_category2="search.id_category2"
      full_width
      outlined
      @category1Selected="category1Selected"
      @category2Selected="category2Selected"
    />
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFilterSelect
        :options-default="allDiseaseListDefault"
        v-model:options="allDiseaseList"
        v-model:selecting="search.id_disease"
        label="傷病名"
        tabindex="8"
        outlined
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <InputEmployeeOptGroup
        v-model="search.id_employee_doctor"
        label="担当医"
        outlined
        tabindex="9"
        type-occupation="doctor"
        clearable
        show-select-default-employee
        @update:select-default-employee="selectDefaultEmployee('id_employee_doctor')"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <InputEmployeeOptGroup
        v-model="search.id_employee_staff"
        label="担当者"
        tabindex="10"
        outlined
        type-occupation="staff"
        clearable
        show-select-default-employee
        @update:select-default-employee="selectDefaultEmployee('id_employee_staff')"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid">
        <MtInputForm
          v-model="search.pet_age_less"
          autofocus
          label="ペット年齢：Start"
          outlined
          type="number"
        />
        <span class="flex content-center justify-center">
             〜
        </span>
        <MtInputForm
          v-model="search.pet_age_up"
          autofocus
          label="ペット年齢：End"
          outlined
          type="number"
        />
      </div>
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid q-mb-md" v-for="(range, index) in search.date_range_list" :key="index">
        <MtFormInputDate
          v-model:date="range.datetime_service_start"
          autofocus
          label="予定日：Start"
          outlined
          type="date"
          @update:date="(val) => updateServiceEndDate(val, index)"
        />
        <span class="flex content-center justify-center">
           〜
        </span>
        <MtFormInputDate
          v-model:date="range.datetime_service_end"
          autofocus
          label="予定日：end"
          outlined
          type="date"
        />
      </div>
    </div>

    <div class="col-lg-12 col-md-12 col-sm-12 flex justify-between">
      <MtInputForm
        tabindex="20"
        type="checkbox"
        v-model="search.flg_complete"
        :items="[{ label: 'サービス未完了のみ' }]"
      />

      <div>
        <q-btn
          class="q-mr-sm"
          flat
          label="+"
          @click="addDateRange"
        />
        <q-btn flat label="-" @click="popDateRange"></q-btn>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="applyFilter()">
        <span>保存</span>
      </q-btn>
      
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 47% 6% 47%;
}

.grid-check {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px
}
</style>
