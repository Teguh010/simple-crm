<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Components
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtToggleExpand from '@/components/MtToggleExpand.vue'

// Stores
import useCartStore from '@/stores/carts'
import useTask from '@/stores/task'
import useCustomerStore from '@/stores/customers'

import usePetStore from '@/stores/pets'
import useActionStore from '@/stores/action'
import useRequestStatus from '@/stores/request-statuses'

// Utils
import mtUtils from '@/utils/mtUtils'
import { concatenate, formatDate, getCustomerLabelColor, getDateByFormat, getDateToday } from '@/utils/aahUtils'
import { formattedPrice } from '@/utils/helper'
import { setPageTitle } from '@/utils/pageTitleHelper'
import IsAdminUser from '@/pages/cart/IsAdminUser.vue'
import { typeCategoryChild } from '@/utils/enum'
import { groupBy } from 'lodash'
import dayjs from 'dayjs'
import UpdateRequestStatusModal from '../request/status/UpdateRequestStatusModal.vue'
import OptionModal from '@/components/OptionModal.vue'

// Lazy-loaded Components
const SearchCartListFilterModal = defineAsyncComponent(
  () => import('./SearchCartListFilterModal.vue')
)
const UpdateCartModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartModal.vue')
)
const UpdateCartHeaderModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartHeaderModal.vue')
)
const SearchCartClaimList = defineAsyncComponent(
  () => import('@/pages/cart/SearchCartClaimList.vue')
)
const MonthlySalesExport = defineAsyncComponent(
  () => import('@/pages/cart/export/MonthlySalesExport.vue')
)
const DailySalesExport = defineAsyncComponent(
  () => import('@/pages/cart/export/DailySalesExport.vue')
)
const CategorySalesExport = defineAsyncComponent(
  () => import('@/pages/cart/export/CategorySalesExport.vue')
)
const DoctorSalesExport = defineAsyncComponent(
  () => import('@/pages/cart/export/DoctorSalesExport.vue')
)
const ISUSalesExport = defineAsyncComponent(
  () => import('@/pages/cart/export/ISUSalesExport.vue')
)
const SearchStatusBoardListModal = defineAsyncComponent(
  () => import('@/pages/statusBoard/SearchStatusBoardListModal.vue')
)

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const taskStore = useTask()
const customerStore = useCustomerStore()
const petStores = usePetStore()
const actionStore = useActionStore()
const requestStatusStore = useRequestStatus()

const { getCarts } = storeToRefs(cartStore)
const { getRequestStatusList } = storeToRefs(requestStatusStore)
const { getTaskSearchCount } = storeToRefs(taskStore)
const { getAllCustomers, getAllCustomerPreps } = storeToRefs(customerStore)
const action = computed(() => actionStore.action)
const filteredReqStatusList = computed(() => {
  const filtered = getRequestStatusList.value.filter((data) => {
    return [20, 21].includes(data.status.type_category_child)
  })
  const grouped = groupBy(filtered, 'status.type_category_child')

  return Object.entries(grouped).map(([type_category_child, groupData]) => {
    const subHeaderGroups = groupBy(groupData, 'status.name_status')

    return {
      label:
        typeCategoryChild.find(
          (type) => type.value === parseInt(type_category_child)
        )?.label ?? '',
      child: Object.entries(subHeaderGroups).map(
        ([subHeader, subGroupData]) => ({
          subHeader: subHeader,
          subData: subGroupData.map((data) => ({
            label: concatenate(
              getAllCustomers.value.find((c) => {
                return c.value === data.id_customer
              })?.code_customer,
              data.name_customer,
              calculatePassedTime(data.datetime_check_in)
            ),
            value: data.id_req_status
          }))
        })
      )
    }
  })
})
const cartsSortByCartNumber = computed(() => {
  return [...getCarts.value].sort((a, b) => {
    const [_A, cartNumberA] = a.number_cart.split('-')
    const [_B, cartNumberB] = b.number_cart.split('-')
    if(parseInt(cartNumberA) > parseInt(cartNumberB)) {
      return -1
    }
    else if(parseInt(cartNumberA) < parseInt(cartNumberB)) {
      return 1
    }
    return 0
  })
})

const customerList = ref([])
const customerListDefault = reactive([])

const searchData = ref({
  number_cart: null,
  this_month: false,
  last_month: false,
  code_customer: '',
  name_customer: '',
  date_start: dayjs().format('YYYY/MM/DD'),
  date_end: dayjs().format('YYYY/MM/DD'),
  type_insurance_provider:null,
  flg_completed: null, 
  flg_modified: null,
  
  
})

const isExpand = ref(false)
const isLoading = ref(false)
const btnIcon = ref('keyboard_arrow_down')

const columns = [
  {
    name: 'number_cart',
    label: '会計番号',
    field: 'number_cart',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'date_cart',
    label: '会計日',
    field: 'date_cart',
    align: 'center',
    style: 'width:8%'
  },
  {
    name: 'code_customer',
    label: '診察券番号',
    field: 'code_customer',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'name_customer',
    label: 'オーナー名',
    field: 'name_customer',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'total_cd_disc',
    label: '個別割引',
    field: 'total_cd_disc',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'total_ch_disc_notax',
    label: '全体割引',
    field: 'total_ch_disc_notax',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'ins_target',
    label: '保険対象額',
    field: 'ins_target',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'total_amount_insured',
    label: '保険負担',
    field: 'total_amount_insured',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'bill',
    label: '顧客請求(税込)',
    field: 'bill',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'flg_insure_request',
    label: '保険請求',
    field: 'flg_insure_request',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'flg_completed',
    label: '完了',
    field: 'flg_completed',
    align: 'center',
    style: 'width: 10%'
  }
]

const openSearchModal = async () => {
  await mtUtils.smallPopup(SearchCartListFilterModal, {
    data: searchData.value,
    callbackFunction: setDateRange,
    callbackSearchModal: callbackSearchModal
  })
}

async function callbackSearchModal(searchParam) {
  

  searchData.value = searchParam
  await search()
}

const openExportMenu = async () => {
  let menuOptions = [
    {
      title: '日計',
      name: 'dailySales',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '月計',
      name: 'monthlySales',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '分類別',
      name: 'categorySales',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '担当別',
      name: 'doctorSales',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '品名包装単位別',
      name: 'isuSales',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'dailySales') {
      if (!(await isAdminEmployee())) return

      await mtUtils.popup(DailySalesExport, {
        params: {
          date_start: searchData.value.date_start,
          date_end: searchData.value.date_end
        }
      })
    } else if (selectedOption.name == 'monthlySales') {
      if (!(await isAdminEmployee())) return
      await mtUtils.popup(MonthlySalesExport)
    } else if (selectedOption.name == 'categorySales') {
      if (!(await isAdminEmployee())) return
      await mtUtils.popup(CategorySalesExport, {
        params: {
          date_start: searchData.value.date_start,
          date_end: searchData.value.date_end
        }
      })
    } else if (selectedOption.name == 'doctorSales') {
      if (!(await isAdminEmployee())) return
      await mtUtils.popup(DoctorSalesExport, {
        params: {
          date_start: searchData.value.date_start,
          date_end: searchData.value.date_end
        }
      })
    } else if (selectedOption.name == 'isuSales') {
      if (!(await isAdminEmployee())) return
      await mtUtils.popup(ISUSalesExport, {
        params: {
          date_start: searchData.value.date_start,
          date_end: searchData.value.date_end
        }
      })
    }
  }
}

function setDateRange(type) {
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()

  if (type == 'current') {
    searchData.value.date_start = formatDate(
      new Date(currentYear, currentMonth, 1)
    )
    searchData.value.date_end = getDateToday()
  }
  if (type === 'prev') {
    searchData.value.date_start = formatDate(
      new Date(currentYear, currentMonth - 1, 1)
    )
    searchData.value.date_end = formatDate(
      new Date(currentYear, currentMonth, 0)
    )
  }
  if (type === 'beforePrev') {
    searchData.value.date_start = formatDate(
      new Date(currentYear, currentMonth - 2, 1)
    )
    searchData.value.date_end = formatDate(
      new Date(currentYear, currentMonth - 1, 0)
    )
  }
  search()
}

const calculatePassedTime = (date: string) => {
  const today = dayjs()
  const isToday = dayjs(date).isToday()

  if (isToday) {
    const diff = today.diff(date, 'minute')

    if (diff > 60) {
      const hour = diff / 60
      const minute = diff - 60 * Math.floor(hour)
      return `${Math.floor(hour)}h ${minute}m`
    }

    if (diff > 0 && diff < 60) {
      return `${diff}m`
    }

    if (diff < 0) {
      const aheadTime = dayjs(date).format('HH:MM')
      return `${aheadTime}`
    }
  }

  return dayjs(date).format('YYYY/MM/DD')
}

const openCartModal = async () => {
  taskStore.selectTask(null)
  await mtUtils.smallPopup(UpdateCartModal)
  await mtUtils.promiseAllWithLoader([search()])
}

const onRowClick = async (data) => {
  await customerStore.selectCustomer(data.id_customer)
  await router.replace({
    name: 'SearchCartListDetail',
    query: { id_cart: data.id_cart }
  })
  await mtUtils.popup(UpdateCartHeaderModal, {
    data,
    allData: getCarts.value,
    fromPage: '会計一覧',
    fromList: true
  })
  await router.replace({ name: 'SearchCartList' })
  await mtUtils.promiseAllWithLoader([search()])
}

const conditionCleard = () => {
  searchData.value.number_cart = null
  searchData.value.this_month = false
  searchData.value.last_month = false
  searchData.value.code_customer = ''
  searchData.value.date_start = null
  searchData.value.date_end = null
  searchData.value.id_customer = null
  searchData.value.type_insurance_provider = null
  searchData.value.flg_completed = null
  searchData.value.flg_modified = null
  searchData.value.InsCartOption = null
  searchData.value.processStatus = null
  searchData.value.id_cm_animal_list = null
  
}

const search = async () => {
  await cartStore.fetchCarts({
    number_cart: searchData.value.number_cart,
    this_month: searchData.value.this_month,
    last_month: searchData.value.last_month,
    code_customer: searchData.value.code_customer,
    date_start: searchData.value.date_start,
    date_end: searchData.value.date_end,
    id_customer: searchData.value.id_customer,
    id_pet: searchData.value.id_pet,
    flg_completed: searchData?.value.flg_completed, 
    flg_modified: searchData?.value.flg_modified,
    type_insurance_provider:searchData?.value.type_insurance_provider,
    id_cm_animal_list: searchData?.value.id_cm_animal_list?.length ? JSON.stringify(searchData.value.id_cm_animal_list) : null
  })
}

const moveNext = (e) => {
  const inputs = Array.from(
    e.target.form.querySelectorAll('input[type="text"]')
  )
  const index = inputs.indexOf(e.target)
  if (index === 0) {
    inputs[index + 1].focus()
  } else {
    inputs[1].blur()
    search()
  }
}
watch(
  () => searchData.value.date_start,
  (newStartDate) => {
    searchData.value.date_end = newStartDate;
  }
);
async function isAdminEmployee() {
  let isValidUser = false

  await mtUtils.littlePopup(IsAdminUser, {
    callBack: (isValid) => {
      isValidUser = isValid
    }
  })

  if (isValidUser) {
    await mtUtils.autoCloseAlert('パスワードを認証しました。')
    return true
  }

  return false
}

const openPrintCSV = async () => {
  await mtUtils.popup(SearchCartClaimList)
}

const openDailySalesExport = async () => {
  if (!(await isAdminEmployee())) return

  await mtUtils.popup(DailySalesExport, {
    params: {
      date_start: searchData.value.date_start,
      date_end: searchData.value.date_end
    }
  })
}

const openCategorySalesExport = async () => {
  if (!(await isAdminEmployee())) return
  await mtUtils.popup(CategorySalesExport, {
    params: {
      date_start: searchData.value.date_start,
      date_end: searchData.value.date_end
    }
  })
}

const openDoctorSalesExport = async () => {
  if (!(await isAdminEmployee())) return
  await mtUtils.popup(DoctorSalesExport, {
    params: {
      date_start: searchData.value.date_start,
      date_end: searchData.value.date_end
    }
  })
}

const openMonthlySalesExport = async () => {
  if (!(await isAdminEmployee())) return
  await mtUtils.popup(MonthlySalesExport)
}

const toggleExpand = async () => {
  isExpand.value = !isExpand.value
  localStorage.setItem('cartExpanded', isExpand.value ? '1' : '0')
  btnIcon.value = isExpand.value ? 'keyboard_arrow_up' : 'keyboard_arrow_down'

  if (isExpand.value) {
    isLoading.value = true
    await requestStatusStore
      .fetchRequestStatusesDate({
        time_selection: 'today'
      })
      .finally(() => {
        isLoading.value = false
      })
  }
}

const openStatusBoardModal = async (value: number) => {
  const data = getRequestStatusList.value.find((v) => {
    return v.id_req_status === value
  })

  await customerStore.selectCustomer(data?.id_customer, true)

  await mtUtils.smallPopup(UpdateRequestStatusModal, {
    request: { ...data },
    isNew: false,
    statusData: { ...data?.status, id_req_status: data?.id_req_status },
    selectedPet: data?.id_pet,
    selectedCustomer: data?.id_customer,
    updatedFlg: {
      value: false
    },
    typeCategoryParent: data?.status?.type_category_parent
  })
}

const openStatusBoardListModal = async () => {
  await nextTick(() => {
    mtUtils.popup(SearchStatusBoardListModal, {})
  })
}

const getCustomerData = (id_customer: any) =>
  getAllCustomerPreps.value.find(
    (customer: any) => customer.id_customer == id_customer
  )

watch(
  () => cartStore.openUpdateModal,
  (nowValue) => {
    if (nowValue) {
      openCartModal()
      localStorage.removeItem('pageAction')
      actionStore.resetAction()
      cartStore.openUpdateModal = false
    }
  }
)

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  let query_id_customer = null
  // cartStore.fetchCarts()
  // taskStore.fetchTask()

  if (
    route.query.source &&
    ['customer_detail', 'cart_balance'].includes(route.query.source) &&
    route.query.id_customer
  ) {
    cartStore.fetchCarts({
      id_customer: parseInt(route.query.id_customer)
    })
  } else await search()

  if (route?.query?.id_cart) {
    await cartStore.fetchCarts({
      date_start: '',
      date_end: '',
    })
    const cart = getCarts.value.find((v) => v.id_cart === route.query.id_cart)
    onRowClick(cart)
  }
  if (
    action.value === 'createCart' ||
    localStorage.getItem('pageAction') === 'createCart'
  ) {
    openCartModal()
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
    cartStore.openUpdateModal = false
  }

  const storedExpand = localStorage.getItem('cartExpanded')
  if (storedExpand === '1') {
    isExpand.value = true
    btnIcon.value = 'keyboard_arrow_up'
    await requestStatusStore.fetchRequestStatusesDate({
      time_selection: 'today'
    })
  }

  // set page title
  setPageTitle('会計一覧')
})
</script>
<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          会計一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                outlined
                label="会計日：Start"
                type="date"
                autofocus
                tabindex="1"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                outlined
                class="q-mx-sm"
                type="date"
                label="会計日：End"
                tabindex="2"
                @keydown.enter="moveNext"
              />
              <q-btn @click="openSearchModal" outline>
                詳細検索
                <q-badge v-if="getTaskSearchCount > 0" color="red" floating>
                  {{ getTaskSearchCount }}
                </q-badge>
              </q-btn>
              <q-btn
                class="q-mx-sm"
                unelevated
                outline
                color="grey-100"
                text-color="primary"
                @click="conditionCleard"
              >
                クリア
              </q-btn>
              <q-btn
                @click="search"
                tabindex="3"
                unelevated
                color="grey-800"
                text-color="white"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
              <q-btn
                unelevated
                color="primary"
                text-color="white"
                class="q-ml-sm"
                @click="openCartModal"
              >
                <q-icon size="20px" name="add" />
                会計
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                outlined
                label="会計日：Start"
                type="date"
                autofocus
                tabindex="1"
                class="ipad-field-size-md"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                outlined
                class="q-mx-sm ipad-field-size-md"
                type="date"
                label="会計日：End"
                tabindex="2"
                @keydown.enter="moveNext"
              />
              <q-btn @click="openSearchModal" outline>
                <q-icon name="tune" />
                <q-badge v-if="getTaskSearchCount > 0" color="red" floating>
                  {{ getTaskSearchCount }}
                </q-badge>
              </q-btn>
              <q-btn
                @click="search"
                tabindex="3"
                unelevated
                color="grey-800"
                text-color="white"
                class="q-mx-sm"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
              <q-btn
                unelevated
                color="primary"
                text-color="white"
                @click="openCartModal"
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
        検索結果 :<span class="q-ml-sm">{{ getCarts.length }}件</span>
      </div>
      <div class="row items-center gap-2 justify-end">
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="toggleExpand"
        >
          <q-icon name="people" class="q-mr-xs" />
          会計ステータス
          <q-icon :name="btnIcon" class="q-mr-xs" />
        </q-btn>
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="openStatusBoardListModal"
        >
          <q-icon name="people" class="q-mr-xs" />
          SB
        </q-btn>
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="openPrintCSV"
        >
          保険一括請求
        </q-btn>
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="openExportMenu"
        >
          <!-- <q-icon class="text-grey-500" name="summarize" size="20px" /> -->
          <q-icon name="text_snippet" />
          会計
        </q-btn>
      </div>
    </div>
    <MtToggleExpand
      :is-loading="isLoading"
      :is-expand="isExpand"
      :data="filteredReqStatusList"
      @on-badge-click="openStatusBoardModal"
    />
    <MtTable2
      :columns="columns"
      :rows="cartsSortByCartNumber"
      :show-filter="false"
      row-key="name"
      :rowsBg="true"
      flat
      :style="{
        height: isExpand ? 'calc(100vh - 270px)' : 'calc(100vh - 135px)',
        touchAction: 'pan-y'
      }"
      class="table-container"
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer caption3 regular text-grey-900"
          v-for="(col, index) in columns"
          :key="index"
          :class="{
            flg_cancel_row: row.flg_cancel,
            flg_complete_row: row.flg_completed
          }"
          @click="onRowClick(row)"
        >
          <div
            v-if="col.field == 'number_cart'"
            auto-width
            key="number_cart"
            class="text-center"
          >
            {{ row['number_cart'] }}
          </div>
          <div v-if="col.field == 'date_cart'" auto-width key="date_cart">
            <span
              >{{ row['date_cart'] ? getDateByFormat(row['date_cart']) : null }}
            </span>
          </div>
          <div
            v-if="col.field == 'code_customer'"
            auto-width
            key="code_customer"
            class="text-center"
          >
            {{ row['code_customer'] }}
          </div>

          <div
            v-if="col.field == 'name_customer'"
            auto-width
            key="name_customer"
          >
            <div class="column">
              <span class="caption2 regular text-grey-700"
                >{{ getCustomerData(row.id_customer)?.name_kana_family }}
                {{ getCustomerData(row.id_customer)?.name_kana_first }}</span
              >
              <span>
                {{ getCustomerData(row.id_customer)?.name_family }}
                {{ getCustomerData(row.id_customer)?.name_first }}
                <q-icon
                  v-if="getCustomerData(row.id_customer)?.type_customer_color"
                  size="12px"
                  name="circle"
                  class="q-ml-xs"
                  :color="
                    getCustomerLabelColor(
                      getCustomerData(row.id_customer)?.type_customer_color
                    )
                  "
                  :style="{
                    color: getCustomerLabelColor(
                      getCustomerData(row.id_customer)?.type_customer_color
                    )
                  }"
                />
              </span>
            </div>
          </div>

          <div
            v-if="col.field == 'bill'"
            auto-width
            key="bill"
            class="text-right"
            :class="{
              'text-red': row['bill'].toString().includes('-')
            }"
          >
            {{ row['bill'] ? formattedPrice(row['bill']) : 0 }}
          </div>

          <div
            v-if="col.field == 'total_cd_disc'"
            key="total_cd_disc"
            auto-width
            class="text-right"
          >
            {{ formattedPrice(row['total_cd_disc']) }}
          </div>

          <div
            v-if="col.field == 'total_ch_disc_notax'"
            key="total_ch_disc_notax"
            auto-width
            class="text-right"
          >
            {{ formattedPrice(row['total_ch_disc_notax']) }}
          </div>

          <div
            v-if="col.field == 'total_amount_insured'"
            auto-width
            key="total_amount_insured"
            class="text-right"
          >
            {{ formattedPrice(row['total_amount_insured']) }}
          </div>

          <div
            v-if="col.field == 'ins_target'"
            auto-width
            key="ins_target"
            class="text-right"
          >
            {{ formattedPrice(row['ins_target']) }}
          </div>

          <div
            v-if="col.field == 'flg_insure_request'"
            auto-width
            key="flg_insure_request"
            class="text-center"
          >
            {{ row['flg_insure_request'] == true ? '有' : '' }}
          </div>

          <div v-if="col.field == 'flg_completed'" class="text-green">
            <q-icon v-if="row[col.field]" size="22px" name="check_circle" />
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

.statusBorders {
  border-radius: 24px;
  color: $white;
}

.typeCustomerColor {
  width: 15px;
  height: 15px;
  border-radius: 50%;
}

.table-container :deep(.q-markup-table.q-table__container) {
  max-width: 100%;
  overflow: auto;
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}
</style>
