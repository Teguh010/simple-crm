<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useRequestStore from '@/stores/requests'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import MtTable2 from '@/components/MtTable2.vue'
import useEmployeeStore from '@/stores/employees'
import {
  formatDateWithTime,
  getDateToday,
  getDaysBefore,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCliCommonStore from '@/stores/cli-common'
import { BookingType } from '@/types/types'
import UpdateCustomerModal from '../master/customerPet/UpdateCustomerModal.vue'
import ViewPetDetailModal from '../master/customerPet/ViewPetDetailModal.vue'
import useServiceDetailStore from '@/stores/service-details'
import UpdateServiceDetailModal from '../request/serviceDetail/UpdateServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import AdditionalFilterRequestModal from '../request/AdditionalFilterRequestModal.vue'
import UpdateRequestModal from '../request/UpdateRequestModal.vue'

const requestStore = useRequestStore()
const customerStore = useCustomerStore()
const {
  getAdditionalSearchRequest,
  getAdditionalSearchCountRequest,
  getBookingList
} = storeToRefs(requestStore)
const actionStore = useActionStore()
const router = useRouter()
const route = useRoute()
const employeeStore = useEmployeeStore()
// const { getAction, getParams } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)
const params = computed(() => actionStore.params)

const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const serviceDetailStore = useServiceDetailStore()
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)

const customerList = ref<any>([])
const customerListDefault = reactive<any>([])

const search = ref({
  datetime_booking_confirmed_start: getDaysBefore(4),
  datetime_booking_confirmed_end: getDateToday(),
  type_booking_source: 2
})

const columns = [
  {
    name: 'datetime_booking_confirmed',
    label: '確定予約日',
    field: 'datetime_booking_confirmed',
    align: 'left',
    style: 'width:12%'
  },
  {
    name: 'datetime_booking1',
    label: '希望日',
    field: 'datetime_booking1',
    align: 'left',
    style: 'width:12%'
  },
  {
    name: 'request',
    label: 'リクエスト番号',
    field: 'request',
    align: 'left',
    style: 'width:12%'
  },
  {
    name: 'customer',
    label: 'オーナー名',
    field: 'customer',
    align: 'left',
    style: 'width:12%'
  },
  {
    name: 'pet',
    label: 'ペット名',
    field: 'pet',
    align: 'left'
  },
  {
    name: 'service',
    label: '商品・サービス名称',
    field: 'service',
    align: 'left'
  }
]

const openSearchModal = async () => {
  await mtUtils.smallPopup(AdditionalFilterRequestModal, {
    search: search.value
  })
  if (getAdditionalSearchRequest.value) {
    search.value = getAdditionalSearchRequest.value
    search.value.id_cm_animal_list = JSON.stringify(
      search.value.id_cm_animal_list
    )
    search.value.id_cm_breed_list = JSON.stringify(
      search.value.id_cm_breed_list
    )
    search.value.json = true
    init()
  }
}

const openAddModal = async (params = null) => {
  await mtUtils.mediumPopup(UpdateRequestModal, params)
  init()
}
const onRowClick = async (row: any) => {
  // await router.push({ name: 'RequestDetail', params: { id: row.id_request } })
}
const searchData = () => {
  const id_clinic = localStorage.getItem('id_clinic')
    ? JSON.parse(localStorage.getItem('id_clinic')!)
    : null

  if (id_clinic) {
    search.value.id_clinic = id_clinic
  }
  search.value.id_clinic = id_clinic
  requestStore.fetchBooking(search.value)
}
const clearSearch = () => {
  search.value.id_customer = null
  search.value.id_pet = null
  search.value.number_request = null
  search.value.title_request = null
  search.value.code_customer = null
  search.value.flg_complete = false
  search.value.flg_complete_payment = false
  search.value.id_clinic = null

  requestStore.setRequestSearch(search.value, 0)
  //init()
}

const labelColor = (type_customer_color: number) => {
  return getCliCommonCustomerColorList.value.find(
    (v) => parseInt(v.code_func1) === type_customer_color
  )?.name_cli_common
}

const init = async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  await requestStore.fetchBooking(search.value)
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
    searchData()
  }
}

const openRequestPage = (row: BookingType) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: row.id_request }
  })?.href
  return window.open(route, '_blank')
}

const openCustomerModal = async (row: BookingType) => {
  await mtUtils.popup(UpdateCustomerModal, {
    data: row.customer
  })
}

const openPetDetailModal = async (row: BookingType) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.id_customer,
    id_pet: row.id_pet
  })
}

const openServiceModal = async (row: BookingType) => {
  serviceDetailStore.setServiceDetail(row.service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
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

watch(
  () => requestStore.openUpdateModal,
  (nowValue) => {
    if (nowValue) {
      openAddModal()
      requestStore.openUpdateModal = false
    }
  }
)

onMounted(async () => {
  await init()

  // set page title
  setPageTitle('次回予定日')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none gap-2">
        <q-toolbar-title class="title2 bold text-grey-900">
          次回予定日
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <form class="flex items-center no-wrap">
                <MtFormInputDate
                  v-model:date="search.datetime_booking_confirmed_start as String"
                  :tabindex="1"
                  autofocus
                  label="確定予定日：Start"
                  outlined
                  type="date"
                  @keydown.enter="moveNext"
                />
                <MtFormInputDate
                  v-model:date="search.datetime_booking_confirmed_end as String"
                  :tabindex="2"
                  class="q-mx-sm"
                  label="確定予定日：End"
                  outlined
                  type="date"
                  @keydown.enter="moveNext"
                />
              </form>
            </div>
          </div>
        </div>
        <div class="row justify-end desktop-hide">
          <div class="col-12">
            <div class="flex items-center no-wrap">
              <MtFormInputDate
                v-model:date="search.datetime_booking_confirmed_start as String"
                autofocus
                class="q-mr-sm"
                outlined
                label="確定予定日：Start"
                type="date"
                @keydown.enter="moveNext"
              />
              ~
              <MtFormInputDate
                v-model:date="search.datetime_booking_confirmed_end as String"
                class="q-ml-sm"
                label="確定予定日：End"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
            </div>
          </div>
        </div>
        <div class="row">
          <q-btn outline @click="openSearchModal">
            詳細検索
            <q-badge
              v-if="getAdditionalSearchCountRequest > 0"
              color="red"
              floating
            >
              {{ getAdditionalSearchCountRequest }}
            </q-badge>
          </q-btn>
          <q-btn
            class="q-mx-sm"
            color="grey-100"
            outline
            text-color="primary"
            unelevated
            @click="clearSearch()"
          >
            クリア
          </q-btn>
          <q-btn
            color="grey-800"
            tabindex="3"
            text-color="white"
            unelevated
            @click="searchData()"
          >
            <q-icon name="search" size="20px" />
            検索
          </q-btn>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果：<span class="q-ml-sm"> {{ getBookingList.length }} 件</span>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="requestStore.getBookingList"
      :rowsBg="true"
      :style="{ height: 'calc(100dvh - 90px)' }"
      flat
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          :class="{
            flg_cancel_row: row.flg_cancel,
            flg_complete_row: row.flg_complete
          }"
          :style="col.style"
          @click="onRowClick(row)"
        >
          <div v-if="col.field == 'request'" @click="openRequestPage(row)">
            <span class="text-blue cursor-pointer">
              {{ row['request'] ? row['request']['number_request'] : '' }}
            </span>
          </div>
          <div v-else-if="['datetime_booking_confirmed'].includes(col.field)">
            {{ formatDateWithTime(row[col.field]) }}
          </div>
          <div v-else-if="['datetime_booking1'].includes(col.field)">
            {{
              row['datetime_booking1']
                ? formatDateWithTime(row['datetime_booking1'])
                : ''
            }}
            {{
              row['datetime_booking2']
                ? formatDateWithTime(row['datetime_booking2'])
                : ''
            }}
            {{
              row['datetime_booking3']
                ? formatDateWithTime(row['datetime_booking3'])
                : ''
            }}
          </div>

          <div
            v-else-if="col.field == 'customer'"
            @click="openCustomerModal(row)"
          >
            <div v-if="row['customer']">
              {{ row.customer.code_customer }}
              <span class="caption2 regular text-grey-700">
                {{ row.customer?.name_kana_family }}
                {{ row.customer?.name_kana_first }}
              </span>
            </div>
            <div class="text-blue cursor-pointer">
              {{ row['customer']['name_family'] }}
              {{ row.customer?.name_first }}
              <q-icon
                :color="labelColor(row['customer']['type_customer_color'])"
                name="circle"
                size="12px"
                :style="{
                  color: labelColor(row['customer']['type_customer_color'])
                }"
              />
            </div>
          </div>
          <div
            v-else-if="col.field == 'service'"
            class="text-blue cursor-pointer"
            @click="openServiceModal(row)"
          >
            {{
              row['service_detail']
                ? row['service_detail']['name_item_service']
                : ''
            }}
            {{
              row['prescription_detail']
                ? row['prescription_detail']['name_prescription_display']
                : ''
            }}
          </div>
          <div
            v-else-if="col.field == 'pet'"
            class="text-blue cursor-pointer avatar-container"
            @click="openPetDetailModal(row)"
          >
            <img
              v-if="row && row.pet"
              :alt="row.pet['name_pet']"
              :src="getPetImageUrl(row.pet)"
              class="image-responsive"
              loading="lazy"
              @error="handleImageError($event, row.pet)"
            />
            <div v-else class="default bg-grey-300" />
            <div v-if="row && row.pet">
              <span class="caption2 regular text-grey-600">
                {{ row.pet['name_kana_pet'] }}
              </span>
              <div class="text-blue text-bold">
                {{ row.pet['name_pet'] }}
                <q-icon
                  :color="getTypeAnimalColor(row.pet['id_cm_animal'])"
                  :style="{
                    color: getTypeAnimalColor(row.pet['id_cm_animal'])
                  }"
                  class="q-ml-xs"
                  name="circle"
                  size="12px"
                />
              </div>
            </div>
            <!-- {{ row['pet'] ? row['pet']['name_pet'] : '' }} -->
          </div>
          <div v-else>
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
</style>
