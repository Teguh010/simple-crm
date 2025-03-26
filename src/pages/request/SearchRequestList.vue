<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { keyBy, keys } from 'lodash'

// Utilities
import mtUtils from '@/utils/mtUtils'
import {
  aahUtilsGetEmployeeName,
  getCustomerLabelColor,
  getCustomerName,
  getDateToday,
  getDaysBefore
} from '@/utils/aahUtils'
import { setPageTitle } from '@/utils/pageTitleHelper'

// Stores
import useRequestStore from '@/stores/requests'
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import useEmployeeStore from '@/stores/employees'

// Components
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import useCliCommonStore from '@/stores/cli-common'
import useServiceDetailStore from '@/stores/service-details'

// Lazy-loaded Components
const UpdateRequestModal = defineAsyncComponent(
  () => import('./UpdateRequestModal.vue')
)
const AdditionalFilterRequestModal = defineAsyncComponent(
  () => import('./AdditionalFilterRequestModal.vue')
)

// Store Instances
const requestStore = useRequestStore()
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const employeeStore = useEmployeeStore()
const cliCommonStore = useCliCommonStore()
const serviceDetailStore = useServiceDetailStore()

// Store References
const {
  getAdditionalSearchRequest,
  getAdditionalSearchCountRequest,
  getRequests
} = storeToRefs(requestStore)
const { getAllCustomerPreps } = storeToRefs(customerStore)
const badgeCount = computed(() => requestStore.getAdditionalSearchCountRequest)
// Router
const router = useRouter()
const route = useRoute()

// Computed Properties
const action = computed(() => actionStore.action)
const params = computed(() => actionStore.params)

// Reactive Variables
const customerList = ref<any>([])
const customerListDefault = reactive<any>([])

const search = ref<RequestType>({
  date_request_start: getDaysBefore(1),
  date_request_goal: getDateToday(),
  number_request: null,
  name_customer: '',
  id_customer: null,
  id_pet: null,
  code_customer: null,
  title_request: null,
  flg_complete: null,
  flg_complete_payment: null,
  id_clinic: null
})

const columns = [
  {
    name: 'number_request',
    label: 'リクエスト番号',
    field: 'number_request',
    align: 'left'
  },
  {
    name: 'date_request_start ',
    label: '開始日',
    field: 'date_request_start',
    align: 'left'
  },
  {
    name: 'date_request_goal',
    label: '終了日',
    field: 'date_request_goal',
    align: 'left'
  },
  {
    name: 'code_customer',
    label: '診察券番号',
    field: 'code_customer',
    align: 'left'
  },
  {
    name: 'name_customer',
    label: 'オーナー名',
    field: 'name_customer',
    align: 'left'
  },
  {
    name: 'title_request',
    label: 'リクエスト名',
    field: 'title_request',
    align: 'left',
    style: 'width: 300px'
  },
  {
    name: 'id_employee_doctor',
    label: '担当獣医師',
    field: 'id_employee_doctor',
    align: 'left'
  },
  {
    name: 'flg_complete',
    label: '完了',
    field: 'flg_complete',
    align: 'center'
  },
  {
    name: 'open_request_detail',
    label: ' ',
    field: 'open_request_detail',
    align: 'left'
  }
  // {
  //   name: 'flg_complete_payment',
  //   label: '支払完了',
  //   field: 'flg_complete_payment',
  //   align: 'center'
  // }
]

const openSearchModal = async () => {
  await mtUtils.smallPopup(AdditionalFilterRequestModal, {
    search: search.value
  })

  const additionalSearchRequest = getAdditionalSearchRequest.value

  if (additionalSearchRequest) {
    // 1. Remove the old flags so they don't remain if absent in the new payload
    delete search.value.flg_complete
    delete search.value.flg_complete_payment
    delete search.value.id_employee_doctor
    delete search.value.id_employee_staff
    delete search.value.number_request
    delete search.value.name_customer
    delete search.value.id_customer
    delete search.value.id_pet
    delete search.value.id_cm_animal_list
    delete search.value.title_request
    search.value = {
      ...search.value,
      ...additionalSearchRequest
    }

    // Parse JSON strings if needed
    if (search.value.id_cm_animal_list) {
      search.value.id_cm_animal_list = JSON.stringify(search.value.id_cm_animal_list)
    }
    if (search.value.id_cm_breed_list) {
      search.value.id_cm_breed_list = JSON.stringify(search.value.id_cm_breed_list)
    }
    
    search.value.json = true
    init()
  }
}

const openRequestDetail = (row) => {
  if (row && row.id_request) {
    const route = router.resolve({
      name: 'RequestDetail',
      params: { id: row.id_request }
    })
    window.open(route.href, '_blank')
  } else {
    console.error('Invalid row data')
  }
}

const openAddModal = async (params = null) => {
  await mtUtils.mediumPopup(UpdateRequestModal, params)
  init()
}
const onRowClick = async (row: any) => {
  serviceDetailStore.setServiceDetailList(null)
  customerStore.resetSelectedCustomer()
  await router.push({ name: 'RequestDetail', params: { id: row.id_request } })
}
const searchData = () => {
  const id_clinic = localStorage.getItem('id_clinic')
    ? JSON.parse(localStorage.getItem('id_clinic')!)
    : null

  if (id_clinic) {
    search.value.id_clinic = id_clinic
  }
  search.value.id_clinic = id_clinic
  requestStore.fetchRequests(search.value)
}
const clearSearch = () => {
  search.value.date_request_start = null
  search.value.date_request_goal = null
  search.value.id_customer = null
  search.value.id_pet = null
  search.value.number_request = null
  search.value.title_request = null
  search.value.code_customer = null
  search.value.flg_complete = null
  search.value.flg_complete_payment = null
  search.value.id_clinic = null
  search.value.id_employee_doctor = null
  search.value.id_employee_staff=null
  search.value.id_cm_animal_list = null
  search.value.id_cm_breed_list=null

  requestStore.setRequestSearch(null, 0)
  //init()
}

function getDoctorName(value: any) {
  const employee: any = employeeStore.getAllEmployees.find((emp: any) => {
    emp.id_employee === value
  })
  if (employee) {
    return employee.name_employee
  }
}
const init = async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  await requestStore.fetchRequests(search.value)
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
watch(
  () => search.value.date_request_start,
  (newStartDate) => {
    search.value.date_request_goal = newStartDate;
  }
);
const getEmployeeLabel = (empId: any) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const setSearchRequestByParams = async () => {
  if (route.query.id_customer)
    search.value.id_customer = route.query.id_customer as string
  if (route.query.id_pet) search.value.id_pet = route.query.id_pet as string
  if (route.query.id_customer || route.query.id_pet) {
    search.value.date_request_start = undefined
    search.value.date_request_goal = undefined
  }

  let count = 0
  keys(search.value).forEach((key) => {
    const val = search.value[key as keyof typeof search.value] as any
    if (
      ![
        'date_request_start',
        'date_request_goal',
        'flg_complete_payment',
        'flg_complete',
        'id_cm_animal_list',
        'id_cm_breed_list'
      ].includes(key)
    ) {
      if (val && val !== null && val !== false && val !== '') count++
    }
  })

  const id_clinic = localStorage.getItem('id_clinic')
    ? JSON.parse(localStorage.getItem('id_clinic')!)
    : null

  if (id_clinic) {
    search.value.id_clinic = id_clinic
  }
  requestStore.setRequestSearch(search.value, count)
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: 'Test',
    content: 'Test'
  })
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
  await setSearchRequestByParams()
  await init()
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [14] })
  if (
    action.value === 'createRequest' ||
    localStorage.getItem('pageAction') === 'createRequest'
  ) {
    await openAddModal(params.value)
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
    requestStore.openUpdateModal = false
  } else {
    requestStore.setRequestSearch(null, 0)
  }

  // set page title
  setPageTitle('リクエスト一覧')
})

const customerDataById = computed(() => {
  return keyBy(getAllCustomerPreps.value, 'id_customer')
})

const requestsList = computed(() => {
  return getRequests.value?.map((request) => {
    const customerData = customerDataById?.value[request?.id_customer]
    if (!customerData) {
      return request
    }

    const {
      type_customer_color,
      name_kana_family,
      name_kana_first,
      name_customer_display,
      name_family,
      name_corporate
    } = customerDataById?.value[request?.id_customer]

    return {
      ...request,
      type_customer_color,
      customerFullName: `${name_kana_family} ${name_kana_first}`,
      customerName: getCustomerName({
        name_customer_display,
        name_family,
        name_corporate
      })
    }
  })
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          リクエスト一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="search.date_request_start as String"
                :tabindex="1"
                autofocus
                label="開始日：Start"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="search.date_request_goal as String"
                :tabindex="2"
                class="q-mx-sm"
                label="開始日：End"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <!-- <q-btn dense flat round @click="openHelpMenu">
                <q-icon size="24px" name="help_outline" />
              </q-btn> -->
              <q-btn outline @click="openSearchModal">
                詳細検索
                <span
                  v-if="badgeCount > 0"
                  class="q-badge q-badge--floating q-badge--top q-badge--right text-white bg-red"
                >
                  {{ badgeCount }}
                </span>
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
                <q-icon size="20px" name="search" />検索
              </q-btn>
              <q-btn
                class="q-ml-sm"
                color="grey-800"
                text-color="white"
                unelevated
                @click="openAddModal()"
              >
                <q-icon size="20px" name="add" />リクエスト
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="search.date_request_start as String"
                autofocus
                class="q-mr-sm ipad-field-size-md"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="search.date_request_goal as String"
                class="ipad-field-size-md"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <q-btn class="q-ml-sm" outline @click="openSearchModal">
                <q-icon name="tune" />
                <q-badge
                  v-if="getAdditionalSearchCountRequest > 0"
                  color="red"
                  floating
                >
                  {{ getAdditionalSearchCountRequest }}
                </q-badge>
              </q-btn>
              <q-btn
                color="grey-800"
                text-color="white"
                unelevated
                class="q-mx-sm"
                @click="searchData()"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
              <q-btn
                color="grey-800"
                text-color="white"
                unelevated
                @click="openAddModal()"
              >
                <q-icon size="20px" name="add" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果：<span class="q-ml-sm"> {{ getRequests.length }} 件</span>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="requestsList"
      :rowsBg="true"
      :style="{
        height: 'calc(100dvh - 90px)',
        touchAction: 'pan-y' 
      }"
      flat
      class="table-container"
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
          <div v-if="col.field == 'number_request'">
            {{ row['number_request'] }}
          </div>
          <div v-else-if="col.field == 'name_customer'">
            <span class="caption2 regular text-grey-700">
              {{ row?.customerFullName }}
            </span>
            <div>
              {{ row?.customerName }}
              <q-icon
                v-if="row?.type_customer_color"
                size="12px"
                name="circle"
                class="q-ml-xs"
                :style="{
                  color: getCustomerLabelColor(row?.type_customer_color)
                }"
                :color="getCustomerLabelColor(row?.type_customer_color)"
              />
            </div>
          </div>
          <div v-else-if="col.field == 'date_request_start'">
            {{ row['date_request_start'] }}
          </div>
          <div v-else-if="col.field == 'date_request_goal'">
            {{ row['date_request_goal'] }}
          </div>
          <div v-else-if="col.field == 'code_customer'">
            {{ row['code_customer'] }}
          </div>
          <div
            v-else-if="col.field == 'title_request'"
            class="ellipsis"
            style="width: 300px"
          >
            {{ row['title_request'] }}
          </div>
          <div v-else-if="col.field == 'id_employee_doctor'">
            {{ getEmployeeLabel(row['id_employee_doctor']) }}
          </div>
          <div v-else-if="col.field == 'flg_complete'" class="text-green">
            <q-icon v-if="row[col.field]" size="24px" name="check_circle" />
          </div>
          <!-- <div
            v-else-if="col.field == 'flg_complete_payment'"
            class="body1 regular text-grey-900"
          >
            <q-icon v-if="row[col.field]" size="24px" name="check_circle" />
          </div> -->
          <div
            v-else-if="col.field == 'open_request_detail'"
            class="col-sm-1 col-xs-1"
            @click.stop="openRequestDetail(row)"
          >
            <q-icon size="24px" name="open_in_new" />
          </div>
          <div v-else class="body1 regular text-grey-900">
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

.table-container :deep(.q-markup-table.q-table__container) {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-x: none;
  -webkit-overflow-scrolling: touch;
}
</style>
