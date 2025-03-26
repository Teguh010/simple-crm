<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent, computed, reactive } from 'vue'
import { Loading } from 'quasar'
import dayjs from 'dayjs'

import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtTable2 from '@/components/MtTable2.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'

import { storeToRefs } from 'pinia'
import useCommonStore from '@/stores/common'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import useIllnessHistoryStore from '@/stores/illness-history'

/** -------------- Utility imports ----------- **/
import mtUtils from '@/utils/mtUtils'
import {
  getCustomerName,
  searchWithHighlight,
  getCustomerLabelColor,
  getPetImageUrl,
  handleImageError,
  getFullPetNameWithoutHonorific
} from '@/utils/aahUtils'
import { typeDiagnosisConfidence } from '@/utils/enum'

/* ---------------------- Async Page Imports ---------------------- */
const UpdateIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/ViewPetDetailModal.vue')
)

const commonStore = useCommonStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const { getCustomerListOptions } = storeToRefs(customerStore)
const illnessHistoryStore = useIllnessHistoryStore()

const pageTitle = ref('既往歴一覧')
const customerList = ref([])
const customerListDefault = reactive([])

const computedIllnessHistory = computed(
  () => illnessHistoryStore.getSearchIllnessHistoryData
)
const computedDoctors = computed(() => employeeStore.getDoctors)
const computedCustomerListOption = computed(() => getCustomerListOptions.value)

const columns = [
  {
    name: 'id_customer',
    label: 'オーナー',
    field: 'id_customer',
    align: 'left',
    style: 'width: 160px'
  },
  {
    name: 'id_pet',
    label: 'ペット',
    field: 'id_pet',
    align: 'left',
    style: 'width: 160px'
  },
  {
    name: 'name_disease',
    label: '疾患・診断名',
    field: 'name_disease',
    align: 'left',
    style: 'width: 264px'
  },
  {
    name: 'diagnosis_confidence',
    label: '診断確度',
    field: 'diagnosis_confidence',
    align: 'left',
    style: 'width: 144px'
  },
  {
    name: 'memo_symptoms',
    label: '主訴',
    field: 'memo_symptoms',
    align: 'left'
  },
  {
    name: 'date_req_bgn',
    label: '開始日',
    field: 'date_req_bgn',
    align: 'left',
    style: 'width: 120px'
  },
  {
    name: 'id_employee_doctor',
    label: '担当医',
    field: 'id_employee_doctor',
    align: 'left',
    style: 'width: 160px'
  }
]

const computedGetPet = computed(() => customerStore.getPet)
const onRowClick = async (data) => {
  await customerStore.selectCustomer(data.pet.customer.id_customer, true)
  const updateIHModalPayload = {
    id_pet_illness_history: data.id_pet_illness_history,
    id_employee_doctor: data.id_employee_doctor,
    petSelected: computedGetPet.value
  }
  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, updateIHModalPayload)
  await search()
}

const moveNext = (e: any) => {
  const inputs = Array.from(
    e.target.form.querySelectorAll('input[type="text"]')
  )
  const index = inputs.indexOf(e.target)
  if (index === 0) {
    ;(inputs[index + 1] as HTMLElement).focus()
  } else {
    ;(inputs[1] as HTMLElement).blur()
    search()
  }
}

const searchData = ref({
  illness_search: '',
  date_start: dayjs().format('YYYY/MM/DD'),
  date_end: dayjs().format('YYYY/MM/DD'),
  id_employee_doctor: '',
  id_customer: ''
})

async function selectingCustomer(e) {
  // console.log('e:', e)
  // if (!searchData.value.id_customer) {
  //   // Reset id_pet if customer is cleared
  //   searchData.value.id_pet = null
  // } else {
  //   await customerStore.selectCustomer(searchData.value.id_customer)
  //   if (computedCustomer.value) {
  //     if (
  //       computedCustomer.value?.pets?.length > 0
  //     ) {
  //       searchData.value.id_pet = computedCustomer.value.pets[0].id_pet
  //     }
  //   }
  // }
}

const openDetailPet = async (row) => {
  const pageTitle = `顧客: ${getFullPetNameWithoutHonorific(
    row.pet,
    row.pet.customer
  )}`
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.pet.customer.id_customer,
    id_pet: row.id_pet,
    code_customer: row.pet.customer.code_customer,
    code_pet: row.pet.code_pet,
    tab: 1,
    fromPage: 'オーナー・ペット検索',
    pageTitle
  })
  await search()
}
const getTypeAnimal = (id_cm_animal: number) => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v: any) => v.id_common == id_cm_animal
  )
}
const getTypeAnimalColor = (id_cm_animal: number) => {
  const typeAnimal = getTypeAnimal(id_cm_animal)
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}

const getDiagnosisConfidence = (id) =>
  typeDiagnosisConfidence.find((v) => v.value === id)?.label

const getDoctorName = (doctorId: number) => {
  const doctor = computedDoctors.value.find(
    (doctor) => doctor.id_employee === doctorId
  )
  return doctor ? doctor.name_display : ''
}

const getSearchIHPagination = computed(
  () => illnessHistoryStore.getSearchIHPagination
)
const maxPage = computed(() =>
  Math.ceil(getSearchIHPagination.value.count / 100)
)
const onPageChange = async (page) => {
  await search(page)
}

const search = async (pageNumber = 1) => {
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: 'データ取得中...',
    messageColor: 'black'
  })
  await illnessHistoryStore.fetchSearchIllnessHistoryData({
    date_bgn_start: searchData.value.date_start || '',
    date_bgn_end: searchData.value.date_end || '',
    id_employee_doctor: searchData.value.id_employee_doctor || '',
    id_customer: searchData.value.id_customer || '',
    search_word: searchData.value.illness_search || '',
    page: pageNumber,
    type_history: 1
  })
  Loading.hide()
}

const openSearchModal = async () => {
  // await mtUtils.smallPopup(AdditionalFilterRequestModal, {
  //   search: search.value
  // })
  // const additionalSearchRequest = getAdditionalSearchRequest.value
  // if (additionalSearchRequest) {
  //   // 1. Remove the old flags so they don't remain if absent in the new payload
  //   delete search.value.flg_complete
  //   delete search.value.flg_complete_payment
  //   delete search.value.id_employee_doctor
  //   delete search.value.id_employee_staff
  //   delete search.value.number_request
  //   delete search.value.name_customer
  //   delete search.value.id_customer
  //   delete search.value.id_pet
  //   delete search.value.id_cm_animal_list
  //   delete search.value.title_request
  //   search.value = {
  //     ...search.value,
  //     ...additionalSearchRequest
  //   }
  //   // Parse JSON strings if needed
  //   if (search.value.id_cm_animal_list) {
  //     search.value.id_cm_animal_list = JSON.stringify(search.value.id_cm_animal_list)
  //   }
  //   if (search.value.id_cm_breed_list) {
  //     search.value.id_cm_breed_list = JSON.stringify(search.value.id_cm_breed_list)
  //   }
  //   search.value.json = true
  //   init()
  // }
}

const current = ref(1)

onMounted(async () => {
  if (getCustomerListOptions.value.length === 0) {
    await customerStore.fetchPreparationCustomers()
  }
  customerList.value.length = 0
  customerListDefault.length = 0
  if (computedCustomerListOption.value) {
    customerList.value = [...computedCustomerListOption.value]
    customerListDefault.push(...computedCustomerListOption.value)
  }
  search()
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          {{ pageTitle }}
        </q-toolbar-title>
        <!-- For Desktop View -->
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                :tabindex="1"
                label="開始日：Start"
                outlined
                type="date"
                style="width: 168px"
                @keydown.enter="moveNext"
                @update:date="
                  () => {
                    searchData.date_end = searchData.date_start
                  }
                "
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                :tabindex="2"
                class="q-mx-sm"
                label="開始日：End"
                outlined
                type="date"
                style="width: 168px"
                @keydown.enter="moveNext"
              />
              <InputEmployeeOptGroup
                v-model:selected="searchData.id_employee_doctor"
                :tabindex="3"
                label="担当医"
                outlined
                type-occupation="doctor"
                clearable
                :show-select-default-employee="false"
                class="q-mr-sm"
                style="min-width: 168px"
              />

              <MtFilterSelect
                label="診察券番号"
                class="q-mr-sm"
                style="width: 168px"
                v-model:selecting="searchData.id_customer"
                v-model:options="customerList"
                :options-default="customerListDefault"
                outlined
                @update:selecting="selectingCustomer"
              />

              <MtInputForm
                type="text"
                label="疾患検索"
                outlined
                v-model="searchData.illness_search"
                class="search-field q-mr-sm"
                @keydown.enter="moveNext"
              />

              <!-- <q-btn outline @click="openSearchModal">
                詳細検索
                <q-badge color="red" rounded floating />
              </q-btn> -->

              <q-btn
                color="grey-800"
                text-color="white"
                tabindex="4"
                unelevated
                @click="search()"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
            </div>
          </div>
        </div>
        <!-- For Mobile/Tablet View -->
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                class="q-mr-sm ipad-field-size-md"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                class="ipad-field-size-md"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <InputEmployeeOptGroup
                v-model:selected="searchData.id_employee_doctor"
                label="担当医"
                :show-select-default-employee="false"
                type-occupation="doctor"
              />
              <MtInputForm
                type="text"
                label="メモカルテ内容"
                outlined
                v-model="searchData.illness_search"
                class="search-field q-mr-sm"
                @keydown.enter="moveNext"
              />
              <q-btn
                color="grey-800"
                text-color="white"
                unelevated
                class="q-mx-sm"
                @click="search()"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      style="margin-bottom: 64px"
      :columns="columns"
      :rows="computedIllnessHistory"
      :rowsBg="true"
      flat
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          class="cursor-pointer"
          @click="onRowClick(row)"
        >
          <div
            v-if="col.field === 'id_customer'"
            class="body1 regular text-grey-900"
          >
            <span class="caption1 regular text-grey-700">
              {{ row?.pet?.customer?.name_kana_family }}
              {{ row?.pet?.customer?.name_kana_first }}
            </span>
            <div class="text-bold avatar-container">
              {{ getCustomerName(row?.pet?.customer) }}
              <q-icon
                v-if="row?.pet?.customer['type_customer_color']"
                size="12px"
                name="circle"
                class="q-ml-xs"
                :color="
                  getCustomerLabelColor(row.pet.customer['type_customer_color'])
                "
                :style="{
                  color: getCustomerLabelColor(
                    row.pet.customer['type_customer_color']
                  )
                }"
              />
            </div>
          </div>
          <div
            v-else-if="col.field === 'id_pet'"
            class="body1 regular text-grey-900"
          >
            <div @click.stop="openDetailPet(row)" class="avatar-container">
              <img
                v-if="row.pet"
                :src="getPetImageUrl(row.pet)"
                @error="handleImageError($event, row)"
                :alt="row['name_pet']"
                class="image-responsive"
                loading="lazy"
              />
              <div v-else class="default bg-grey-300" />
              <div>
                <span class="caption1 regular text-grey-700">
                  {{ row?.pet?.name_kana_pet }}
                </span>
                <div class="text-blue text-bold">
                  {{ row?.pet?.name_pet }}
                  <q-icon
                    size="12px"
                    name="circle"
                    class="q-ml-xs"
                    :color="getTypeAnimalColor(row?.pet?.['id_cm_animal'])"
                    :style="{
                      color: getTypeAnimalColor(row?.pet?.['id_cm_animal'])
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            v-else-if="col.field === 'name_disease'"
            class="body1 regular text-grey-900"
          >
            <span
              v-html="
                searchWithHighlight(
                  row?.['name_disease'] !== '' && row?.['name_disease'] !== null
                    ? row?.['name_disease']
                    : row?.['name_disease_free'],
                  searchData.illness_search
                )
              "
            ></span>
          </div>
          <div
            v-else-if="col.field === 'diagnosis_confidence'"
            class="body1 regular text-grey-900"
          >
            {{ getDiagnosisConfidence(row?.diagnosis_confidence) }}
          </div>
          <div
            v-else-if="col.field === 'id_employee_doctor'"
            class="body1 regular text-grey-900"
          >
            {{ getDoctorName(row?.id_employee_doctor) }}
          </div>
          <div
            v-else
            class="tableRow body1 regular text-grey-900 ellipsis-2-lines"
          >
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
    <div
      v-if="getSearchIHPagination?.count > 0 && maxPage > 1"
      class="row q-pa-md fixed-bottom"
      style="
        background: rgba(255, 255, 255, 0.2);
        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      "
    >
      <q-pagination
        v-model="current"
        class="col justify-end"
        :max="maxPage"
        direction-links
        @update:model-value="onPageChange"
      />
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.tableRow {
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
}
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  // cursor: pointer;
  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
</style>
