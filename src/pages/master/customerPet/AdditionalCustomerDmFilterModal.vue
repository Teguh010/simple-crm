<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import { typePreventionV1 } from '@/utils/enum'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useCommonStore from '@/stores/common'
import { storeToRefs } from 'pinia'
import useRequestStore from '@/stores/requests'
import useCustomerStore from '@/stores/customers'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { dateFormat } from '@/utils/aahUtils'
import { date } from 'quasar'
import useDiseaseStore from '@/stores/diseases'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCliCommonStore from '@/stores/cli-common'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtSearchItemService from '@/components/MtSearchItemService.vue'

const diseaseStore = useDiseaseStore()
const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const requestStore = useRequestStore()
const customerStore = useCustomerStore()
const { getCustomer } = storeToRefs(customerStore)

const emits = defineEmits(['close'])
const props = defineProps({
  search: {
    type: Object,
    default: () => ({})
  },
  callBackSearch: Function
})
const closeModal = () => {
  emits('close')
}

const search = ref({
  id_customer: null,
  id_pet: null,
  id_cm_animal_list: [],
  id_disease: null,
  date_range_list: [
    { date_start: null, date_end: null }
  ]
})

const searchData = () => {
  props.callBackSearch(search.value)
  emits('close')
}

function UpdEndDate(val, field) {
  if (val) {
    search.value[field] = dateFormat(date.addToDate(val, { month: 1 }))
  }
}

const customerList = ref([])
const customerListDefault = reactive([])

const allDiseaseList = ref([])
const typeCustomerColorList = ref([])
const allDiseaseListDefault = reactive([])

const dateRangeList = ref([])

function addDateRange() {
  if (search.value.date_range_list.length < 3) {
    search.value.date_range_list.push({ 
      date_start: null, 
      date_end: null 
    })
  }
}

function popDateRange() {
  if (search.value.date_range_list.length > 1) {
    search.value.date_range_list.splice(search.value.date_range_list.length - 1, 1)
  } else {
    if (search.value.date_range_list[0].date_start || search.value.date_range_list[0].date_end) {
      search.value.date_range_list[0] = {
        date_start: null,
        date_end: null
      }
    }
  }
}

function updateServiceEndDate(val, idx) {
  if (val) {
    search.value.date_range_list[idx].date_end = dateFormat(date.addToDate(val, { month: 1 }))
  }
}

const getColorValue = (value: String | undefined) => { 
  if (!value) { 
    return {};
  }
  if (value.startsWith('rgb') || value.startsWith('#')) { 
    return {
      style: `color: ${value};`
    }
  }
  return {
    color: value
  };
}

const init = async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [1, 2] })

  allDiseaseList.value = [...diseaseStore.getAllDiseases]
  allDiseaseListDefault.push(...diseaseStore.getAllDiseases)

  typeCustomerColorList.value = useCliCommonStore().getCliCommonCustomerColorList.map(item => {
    return {
      label: item.name_cli_common,
      value: item.code_func1,
      color: item.text1
    }
  })
  
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  if (props.search) {
    const mergedSearch = { ...props.search }
    
    if (!mergedSearch.date_range_list) {
      mergedSearch.date_range_list = [{ date_start: null, date_end: null }]
    } else if (typeof mergedSearch.date_range_list === 'string') {
      mergedSearch.date_range_list = JSON.parse(mergedSearch.date_range_list)
    }
    
    search.value = mergedSearch
  }

  search.value.id_item_service_unit = []
  search.value.id_item_service = []
  
}

function selectingWhole(value) {
  search.value.id_item_service_list = JSON.stringify(value)
}

function resetFilter() {
  // Reset all values to default
  search.value = {
    id_customer: null,
    id_pet: null,
    id_cm_animal_list: [],
    id_disease: null,
    address: null,
    type_customer_color: null,
    type_prevention: null,
    pet_age_less: null,
    pet_age_up: null,
    customer_visit_date_start: null,
    customer_visit_date_end: null,
    flg_dm: false,
    flg_digital_dm: false,
    flg_pet_dm: false,
    name_item_service_unit: null,
    id_item_service: [],
    // Keep 1 empty date range default
    date_range_list: [{ 
      date_start: null, 
      date_end: null 
    }]
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      予防DMリスト 詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="filter-modal-container scrollable-content q-mt-none">
    <div class="row q-col-gutter-md ">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFilterSelect
          v-model:options="customerList"
          v-model:selecting="search.id_customer"
          :options-default="customerListDefault"
          autofocus
          label="診察券番号"
          tabindex="1"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="search.address"
          label="住所（自由入力）"
          type="text"
        >
        </MtInputForm>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFormMultipleSelection
          v-model="search.id_cm_animal_list"
          :options="getCommonTypeAnimalOptionList"
          label="動物種"
          option-label="label"
          option-value="value"
        >
        </MtFormMultipleSelection>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFormPullDown
          v-model:options="typeCustomerColorList"
          v-model:selected="search.type_customer_color"
          customOption
          label="オーナー色区分"
        >
          <template v-slot:option="{ slotProps }">
            <q-item v-bind="slotProps.itemProps">
              <q-item-section v-if="slotProps.opt.color !== ''" side>
                <q-icon size="25px" name="circle" v-bind="getColorValue(slotProps.opt.color)" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ slotProps.opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </MtFormPullDown>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFilterSelect
          v-model:options="allDiseaseList"
          v-model:selecting="search.id_disease"
          :options-default="allDiseaseListDefault"
          label="傷病名"
          tabindex="8"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12" tabindex="7">
        <MtSearchItemService
          :multiple="true"
          label="予防系の商品サービス（親商品名）"
          @update:selecting="selectingWhole"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="search.name_item_service_unit"
          label="予防系の品名包装単位名（子商品名）"
          type="text"
        >
        </MtInputForm>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm
          v-model="search.pet_age_less"
          autofocus
          label="ペット年齢：Start"
          type="number"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm
          v-model="search.pet_age_up"
          autofocus
          label="ペット年齢：End"
          type="number"
        />
      </div>
      <div class="col-12 caption2 regular text-grey-700 text-right">
        ※ 3歳から7歳までを検索する場合には、3 ~ 8 と入力
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtFormInputDate
          v-model:date="search.customer_visit_date_start"
          autofocus
          label="オーナー最終来院：Start"
          type="date"
          @update:date="(val) => UpdEndDate(val, 'customer_visit_date_end')"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtFormInputDate
          v-model:date="search.customer_visit_date_end"
          autofocus
          label="オーナー最終来院：End"
          type="date"
        />
      </div>
      <div class="col-12">
        <div class="row q-col-gutter-md" v-for="(range, index) in search.date_range_list" :key="index">
          <div class="col-lg-6 col-md-6 col-sm-6">
            <MtFormInputDate
              v-model:date="range.date_start"
              autofocus
              label="実施日：Start"
              type="date"
              @update:date="(val) => updateServiceEndDate(val, index)"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-6">
            <MtFormInputDate
              v-model:date="range.date_end"
              autofocus
              label="実施日：End"
              type="date"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6 caption2 regular text-grey-700 text-right">年をまたぐ日付検索：</div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <q-btn
          class="q-mr-sm"
          flat
          label="+ 実施日の追加"
          size="12px"
          @click="addDateRange"
        />
        <q-btn flat label="- 削除" size="12px" @click="popDateRange"></q-btn>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtFormCheckBox v-model:checked="search.flg_dm" label="オーナーDM可のみ" />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtFormCheckBox v-model:checked="search.flg_digital_dm" label="オーナーデジタルDM可のみ" />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtFormCheckBox v-model:checked="search.flg_pet_dm" label="ペットDM可のみ" />
      </div>
    </div>
    <div class="col-12 text-right q-pt-none">
     <q-btn flat class="text-blue" size="sm" @click="resetFilter">条件クリア</q-btn>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" tabindex="9" @click="searchData">
        <span>適用</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 47% 6% 47%;
}

.grid-1 {
  display: grid;
  grid-template-columns: 45% 6% 45%;
}

.grid-check {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px
}

.scrollable-content {
  max-height: calc(90vh - 120px);
  overflow-y: auto;
  padding-right: 8px;
}

.filter-modal-container {
  padding: 16px;
}
</style>