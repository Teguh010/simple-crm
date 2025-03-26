<script setup lang="ts">
// Vue core imports
import { defineAsyncComponent, onMounted, ref } from 'vue'

// Component imports
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import CellCollapse from './components/CellCollapse.vue'

// Utility imports
import { getDateToday, getDaysBefore } from '@/utils/aahUtils'
import { formattedPrice } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'

// Store imports
import useRequestStore from '@/stores/requests'
import { storeToRefs } from 'pinia'

// Router import
import { useRouter } from 'vue-router'

// Lazy-loaded components
const UpdateCartHeaderModal = defineAsyncComponent(() => import('../cart/UpdateCartHeaderModal.vue'))
const UpdatePaymentModal = defineAsyncComponent(() => import('../payment/UpdatePaymentModal.vue'))
const UpdateServiceDetailModal = defineAsyncComponent(() => import('../request/serviceDetail/UpdateServiceDetailModal.vue'))
const ViewPrescriptionModal = defineAsyncComponent(() => import('../request/prescription/ViewPrescriptionModal.vue'))
const ViewInjectHeaderModal = defineAsyncComponent(() => import('../request/inject/ViewInjectHeaderModal.vue'))

const router = useRouter()
const requestStore = useRequestStore()
const { getRequestAndCartList } = storeToRefs(requestStore)

// State
const search = ref({
  date_start: getDaysBefore(1),
  date_end: getDateToday()
})

const rows = ref([])
const rowChecked = ref([])
const collapseAll = ref([])
const buttonIcon = ref([])
const requestCountValue = ref(0)
const cartCountValue = ref(0)

// Columns configuration
const columns = [
  { name: 'toggle', label: '', field: 'toggle', align: 'center', style: 'width:1%' },
  { name: 'checkbox', label: '', field: 'checkbox', style: 'width:1%', overLoad: true },
  { name: 'request', label: 'リクエスト', field: 'request', style: 'width:25%' },
  { name: 'cart', label: '会計', field: 'cart', style: 'width:30%' },
  { name: 'payment', label: '入金', field: 'payment' },
  { name: 'balance', label: '差引残高', field: 'balance', align: 'center' },
  { name: 'status', label: '会計ステータス', field: 'status', align: 'center' }
]

// Utility functions
const groupBy = (array, key) =>
  array.reduce((acc, item) => {
    const keyValue = item[key]
    if (!acc[keyValue]) acc[keyValue] = []
    acc[keyValue].push(item)
    return acc
  }, {})

const extractPayments = carts =>
  carts.flatMap(cart => cart.payment_list || [])

const getPaymentBalance = cart => {
  const totalPaymentAmount = cart.payment_list.reduce((sum, payment) => sum + (parseFloat(payment.amount_payment) || 0), 0)
  return formattedPrice(parseFloat(cart.bill || 0) - totalPaymentAmount)
}

const checkAllCartsPaid = carts =>
  carts.length > 0 && carts.every(cart => cart.flg_paid)

const transformData = (item, detailConfigs) => {
  const groupedData = {}
  detailConfigs.forEach(({ details, type, dateField }) => {
    details.forEach(detail => {
      const petId = detail.id_pet
      const petInfo = detail.pet
      const date = detail[dateField]
      if (!groupedData[petId]) groupedData[petId] = { pet: petInfo, dates: {} }
      if (!groupedData[petId].dates[date]) groupedData[petId].dates[date] = []
      groupedData[petId].dates[date].push({ ...detail, type })
    })
  })
  Object.values(groupedData).forEach(petGroup => {
    const sortedDates = Object.keys(petGroup.dates)
      .sort((a, b) => new Date(a) - new Date(b))
      .reduce((acc, date) => {
        acc[date] = petGroup.dates[date]
        return acc
      }, {})
    petGroup.dates = sortedDates
  })
  return { ...item, groupedData }
}

const transformRequest = request =>
  transformData(request, [
    { details: request.service_details_request || [], type: 'service', dateField: 'date_service_start' },
    { details: request.prescription_details || [], type: 'prescription', dateField: 'date_start' },
    { details: request.inject_details || [], type: 'inject', dateField: 'date_start' }
  ])

const transformCarts = carts =>
  carts.map(cart =>
    transformData(cart, [
      { details: cart.cart_details || [], type: 'cart', dateField: 'date_order_start' }
    ])
  )

const processData = data => {
  const requestList = data.request_list || []
  const cartList = data.cart_list || []
  const cartsByRequestId = groupBy(cartList, 'id_request')
  const rowsData = []

  requestList.forEach(request => {
    const associatedCarts = cartsByRequestId[request.id_request] || []
    const payments = extractPayments(associatedCarts)
    rowsData.push({
      toggle: '',
      checkbox: false,
      request: transformRequest(request),
      cart: transformCarts(associatedCarts),
      payment: payments,
    })
    delete cartsByRequestId[request.id_request]
  })

  Object.values(cartsByRequestId).forEach(standaloneCarts => {
    standaloneCarts.forEach(cart => {
      rowsData.push({
        toggle: '',
        checkbox: false,
        request: null,
        cart: transformCarts([cart]),
        payment: extractPayments([cart])
      })
    })
  })

  return rowsData
}

const searchData = async () => {
  await requestStore.fetchRequestsAndCarts(search.value)
  const rowsData = processData(getRequestAndCartList.value)
  rows.value = rowsData
  requestCountValue.value = getRequestAndCartList.value.request_list.length
  cartCountValue.value = getRequestAndCartList.value.cart_list.length
  rowChecked.value = new Array(rows.value.length).fill(false)
  collapseAll.value = new Array(rows.value.length).fill(false)
  buttonIcon.value = new Array(rows.value.length).fill('keyboard_arrow_down')
}

// Actions
const clearSearch = () => {
  search.value = { date_start: '', date_end: '' }
}

 const getCart = (id_payment) => {
    return getRequestAndCartList.value.cart_list.find((cart) =>
      cart.payment_list.some((payment) => payment.id_payment === id_payment)
    ) || null;
  };

const getPayment = (id_payment) => {
    for (const cart of getRequestAndCartList.value.cart_list) {
      const payment = cart.payment_list.find(
        (payment) => payment.id_payment === id_payment
      );
      if (payment) {
        return payment;
      }
    }
    return null;
  };


const confirmToClose = () => {
  mtUtils.confirm('Are you sure to close this?', 'Confirmation')
}

const openTarget = async ({ type = '', id = '', data = {} }) => {
  if (type === 'request') {
    const route = router.resolve({ name: 'RequestDetail', params: { id } })
    window.open(route.href, '_blank')
  } else if (type === 'cart') {
    mtUtils.popup(UpdateCartHeaderModal, { data, fromPage: '会計一覧' })
  } else if (type === 'payment') {
    let cartData = getCart(id)
    let paymentData = getPayment(id)
    mtUtils.mediumPopup(UpdatePaymentModal, { data: paymentData, cartData: cartData })
  }
}

const openPocketList = ({ type = '', id = '' }) => {
  const popupMap = {
    service: UpdateServiceDetailModal,
    prescription: ViewPrescriptionModal,
    inject: ViewInjectHeaderModal
  }
  if (popupMap[type]) {
    mtUtils.mediumPopup(popupMap[type], { id }, true)
  }
}

const toggleRow = index => {
  collapseAll.value[index] = !collapseAll.value[index]
  buttonIcon.value[index] = collapseAll.value[index] ? 'keyboard_arrow_right' : 'keyboard_arrow_down'
}

const getRowspan = (field, row) => 
  ['toggle', 'checkbox', 'request'].includes(field) ? row.cart.length || 1 : 1

onMounted(async () => {
  await searchData()
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          オーダー・会計状態確認
        </q-toolbar-title>
        <!-- Search Fields -->
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="search.date_start"
                :tabindex="1"
                autofocus
                label="開始日：Start"
                outlined
                type="date"
                @update:date="
                  () => {
                    search.date_end = search.date_start
                  }
                "
              />
              <MtFormInputDate
                v-model:date="search.date_end"
                :tabindex="2"
                class="q-mx-sm"
                label="開始日：End"
                outlined
                type="date"
              />
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
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="search.date_start"
                autofocus
                class="q-mr-sm ipad-field-size-md"
                outlined
                type="date"
              />
              <MtFormInputDate
                v-model:date="search.date_end"
                class="ipad-field-size-md"
                outlined
                type="date"
              />
              <q-btn
                color="grey-800"
                text-color="white"
                unelevated
                class="q-mx-sm"
                @click="searchData()"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <span>
        リクエスト数 {{ requestCountValue }} 件、会計数 {{ cartCountValue }} 件
      </span>
      <q-btn
        color="grey-300"
        outline
        text-color="primary"
        @click="confirmToClose"
      >
        会計の一括終了
      </q-btn>
    </div>
    <MtTable2
      :columns="columns"
      :rows="rows"
      :rowsBg="true"
      class="custody-table"
      bordered
      separator="cell"
      :style="{ boxShadow: 'none', height: 'calc(100vh - 70px)' }"
      flat
    >
      <template #row="{ row, index: rowIndex }">
        <td
          v-for="(col, colIndex) in columns"
          :key="colIndex"
          class="cursor-pointer caption3 regular text-grey-900"        >
          <div v-if="col.field === 'toggle'">
            <q-btn
              flat
              dense
              round
              :icon="buttonIcon[rowIndex]"
              @click="toggleRow(rowIndex)"
            ></q-btn>
          </div>
          <div v-else-if="col.field === 'checkbox'">
            <MtFormCheckBox v-model:checked="rowChecked[rowIndex]" />
          </div>
          <div v-else-if="col.field === 'request'" class="cell">
            <CellCollapse
              :collapse-all="collapseAll[rowIndex]"
              :cell-data="row[col.field]"
              mode="request"
              @open-target="openTarget"
              @open-pocket-list="openPocketList"
            />
          </div>
          <div v-else-if="col.field === 'cart'" class="cell">
            <CellCollapse
              :collapse-all="collapseAll[rowIndex]"
              :cell-data="row[col.field]"
              mode="cart"
              @open-target="openTarget"
              @open-pocket-list="openPocketList"
            />
          </div>
          <div v-else-if="col.field === 'payment'" class="cell">
            <CellCollapse
              :collapse-all="collapseAll[rowIndex]"
              :cell-data="row[col.field]"
              mode="payment"
              :show-collapse-toggle="false"
              @open-target="openTarget"
              @open-pocket-list="openPocketList"
            />
          </div>

          <!-- Column for Balance -->
          <div v-else-if="col.field === 'balance'" class="text-center">
            <div v-for="(cart, index) in row.cart" :key="cart.id_cart">
              <div v-if="index > 0" class="horizontal-separator"></div>
              <span class="text-h5" >
                {{ getPaymentBalance(cart) }}
              </span>
            </div>
          </div>

          <!-- Column for Status -->
          <div v-else-if="col.field === 'status'" class="text-center">
            <div v-for="(cart, index) in row.cart" :key="cart.id_cart">
              <!-- Horizontal Separator for each cart except the first one -->
              <div v-if="index > 0" class="horizontal-separator"></div>
              <span
                class="text-h5"
                :class="cart.flg_closed ? 'text-green' : 'text-black'"
              >
                <q-icon v-if="cart.flg_closed" size="22px" name="check_circle" />
                {{ cart.flg_closed ? '会計済み' : '未' }}
              </span>
            </div>
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss">
.tableBox {
  margin: 20px 0;
}

.cell {
  padding: 22px 10px;
}

.flg-complete {
  background-color: #deffda;
}

.cell-collapse-class {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
