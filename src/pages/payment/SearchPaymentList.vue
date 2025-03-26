<script setup lang="ts">
// Vue core imports
import { onMounted,watch, reactive, ref, defineAsyncComponent, computed, onUnmounted } from 'vue'

// External component imports
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtTable2 from '@/components/MtTable2.vue'

// Store imports
import usePaymentStore from '@/stores/payment'
import useCartStore from '@/stores/carts'
import useCustomerStore from '@/stores/customers'
import useCliCommonStore from '@/stores/cli-common'
import { storeToRefs } from 'pinia'

// Utility imports
import mtUtils from '@/utils/mtUtils'
import {
  concatenate,
  dateFormat,
  getDateByFormat,
  getDateToday,
  getDaysBefore,
  getCustomerLabelColor,
  isDateOutOfToday,
  roundFloat
} from '@/utils/aahUtils'
import { formattedPrice, formatDecimalNumber } from '@/utils/helper'
import { typePaymentStatus } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'

// Local component imports with defineAsyncComponent
const UpdatePaymentModal = defineAsyncComponent(
  () => import('./UpdatePaymentModal.vue')
)
const DailyPaymentSummary = defineAsyncComponent(
  () => import('./export/DailyPaymentSummary.vue')
)
const PaymentSummary = defineAsyncComponent(
  () => import('./export/PaymentSummary.vue')
)
const IsAdminUser = defineAsyncComponent(
  () => import('@/pages/cart/IsAdminUser.vue')
)
const UpdateCartHeaderModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartHeaderModal.vue')
)

import type { Payment } from '@/types/types'
import SalesReportVer1Modal from '../cart/salesReportVer1Modal.vue'

const paymentStore = usePaymentStore()
const cartStore = useCartStore()
const customerStore = useCustomerStore()
const cliCommonStore = useCliCommonStore()

const { getPayments } = storeToRefs(paymentStore)
const { getAllCustomers, getAllCustomerPreps, getCustomerListOptions } = storeToRefs(customerStore)
const { getCliCommonTypePaymentMethodList } = storeToRefs(cliCommonStore)

const customerList = ref([]),
  customerListDefault = reactive([])

const searchData = ref({
  name_customer_search: null,
  type_payment_status: 1,
  date_from: getDaysBefore(0),
  date_to: getDateToday(),
  id_customer: '',
  type_payment_method: ''
})

const columns = ref([
  {
    name: 'number_payment',
    label: '入金番号',
    field: 'number_payment',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'number_cart',
    label: '会計',
    field: 'number_cart',
    align: 'center',
    style: 'width: 5%'
  },
  {
    name: 'type_payment_method',
    label: '支払方法',
    field: 'type_payment_method',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'name_customer_display',
    label: 'オーナー名',
    field: 'name_customer_display',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'datetime_payment',
    label: '入金日時',
    field: 'datetime_payment',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'amount_payment',
    label: '入金額',
    field: 'amount_payment',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'amount upfront received',
    label: '前金額',
    field: 'amount_upfront_received',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'amount_loss',
    label: '損金',
    field: 'amount_loss',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'flg_type',
    label: '',
    field: 'flg_type',
    align: 'center',
    style: 'width: 10%'
  },
  // {
  //   name: 'flg_loss',
  //   label: '損金',
  //   field: 'flg_loss',
  //   align: 'center',
  //   style: 'width: 5%'
  // },
  // {
  //   name: 'flg_refund_occurred',
  //   label: '返金済',
  //   field: 'flg_refund_occurred',
  //   align: 'center',
  //   style: 'width: 5%'
  // },
  // {
  //   name: 'flg_upfront',
  //   label: '前受入金',
  //   field: 'flg_upfront',
  //   align: 'center',
  //   style: 'width: 5%'
  // },
  // {
  //   name: 'flg_upfront_used',
  //   label: '前受清算',
  //   field: 'flg_upfront_used',
  //   align: 'center',
  //   style: 'width: 5%'
  // },
  {
    name: 'type_payment_status',
    label: 'ステータス',
    field: 'type_payment_status',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'memo_payment',
    label: '備考',
    field: 'memo_payment',
    align: 'center',
    style: 'width: 20%'
  }
])
const selectCustomer = (id: string) => {
  return customerStore.getAllCustomers.find((cust) => {
    return cust.value === id
  })?.name_family
}
const onRowClick = async (paymentData: {}) => {
  await cartStore.fetchCart(paymentData.id_cart)
  const cartData = cartStore.getCart
  const customer = selectCustomer(cartData.id_customer)
  const copiedObject = { ...paymentData }
  const pageTitle = `入金: ${customer} 様`
  const fromPage = '入金一覧'
  await mtUtils.mediumPopup(UpdatePaymentModal, {
    data: copiedObject,
    cartData: cartData,
    pageTitle,
    fromPage
  })
}
const search = async () => {
  await paymentStore.fetchPayments(searchData.value).then(() => {
    updateColLabels()
  })
}
const moveNext = (e) => {
  const inputs = Array.from(
    e.target.form.querySelectorAll('input[type="text"]')
  )
  const index = inputs.indexOf(e.target)
  if (index === 0 || index === 1) {
    inputs[index + 1].focus()
  } else {
    inputs[2].blur()
    search()
  }
}
watch(
  () => searchData.value.date_from,
  (newStartDate) => {
    searchData.value.date_to = newStartDate;
  }
);

function getReportData() {
  let summary = {}
  let report_data = []
  getPayments.value.forEach((cart) => {
    const date = getDateByFormat(cart.datetime_payment)
    if (!summary[date]) {
      summary[date] = []
    }
    summary[date].push({
      amount_payment: cart.amount_payment,
      type_payment_method: cart.type_payment_method
    })
  })
  let entries = Object.entries(summary)
  entries.forEach((entry) => {
    let data = entry[1]
    let amountPayment = 0
    let l_payment_method = data[0].type_payment_method
    let paymentMethods = []
    data.forEach((item) => {
      amountPayment += parseFloat(item.amount_payment) || 0
      if (!paymentMethods.includes(item.type_payment_method)) {
        paymentMethods.push(item.type_payment_method)
      }
    })
    let oneRecord = {
      datetime_payment: entry[0],
      amount_payment: amountPayment,
      type_payment_method: paymentMethods.join(',')
    }
    report_data.push(oneRecord)
  })
  return report_data
}

const generateColumns = (methodNames) => {
  const baseColumns = [
    {
      name: 'date_payment',
      align: 'center',
      label: '対象日',
      field: 'date_payment'
    },
    {
      name: 'amount',
      align: 'center',
      label: '合計',
      field: 'total_amount',
      format: (val) => `$${val.toFixed(2)}`
    }
  ]

  const methodColumns = Object.keys(methodNames).map((key) => ({
    name: 'amount',
    align: 'center',
    label: methodNames[key],
    field: key,
    format: (val) => `$${val ? val.toFixed(2) : '0.00'}`
  }))

  return [...baseColumns, ...methodColumns]
}

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

async function openDailyPaymentPrintCSV() {
  if (!(await isAdminEmployee())) return
  await mtUtils.popup(DailyPaymentSummary, {
    params: {
      date_start: searchData.value.date_from,
      date_end: searchData.value.date_to
    }
  })
}

async function openPaymentPrintCSV() {
  if (!(await isAdminEmployee())) return
  await mtUtils.popup(PaymentSummary, {
    params: {
      date_start: searchData.value.date_from,
      date_end: searchData.value.date_to
    }
  })
}

async function openSalesChart() {
  await mtUtils.popup(SalesReportVer1Modal)
}

const getPaymentStatusChipColor = (status: any) => {
  status = typePaymentStatus.find((option) => option.value === status)
  return status
}
const init = async () => {
  await search()
}

const findTypePaymentLabel = (value: string | number) => {
  return getCliCommonTypePaymentMethodList.value.find(
    (tpm) => String(tpm.code_func1) === String(value)
  )?.name_cli_common
}

const getCustomerData = (id_customer: any) =>
  getAllCustomerPreps.value.find(
    (customer: any) => customer.id_customer == id_customer
  )

const updateColLabels = () => {
  const REFUND: number = 2
  if (searchData.value.type_payment_status == REFUND) {
    columns.value.find((col) => col.field == 'datetime_payment').label =
      '取引日'
    columns.value.find((col) => col.field == 'amount_payment').label = '返金額'
  } else {
    columns.value.find((col) => col.field == 'datetime_payment').label =
      '入金日時'
    columns.value.find((col) => col.field == 'amount_payment').label = '入金額'
  }
}

const paymentAggregates = computed(() =>
  getPayments.value.reduce(
    (summary, payment) => {
      // Ensure `roundFloat` returns a number
      const amountPayment = roundFloat(payment.amount_payment || 0);
      const amountUpfrontReceived = roundFloat(payment.amount_upfront_received || 0);
      const amountRefund = roundFloat(payment.amount_refund || 0);
      const amountLoss = Number(roundFloat(payment.amount_loss ?? 0)) || 0;
      // loss
      if(payment.flg_loss || payment.flg_loss_decimal) {
        console.log(amountLoss)
        summary.loss.amount += amountLoss;
        summary.loss.count += 1;
        console.log(summary.loss)
      } else if (payment.flg_upfront_used && !payment.flg_refund_conducted) { //upfront
        summary.upfront.amount += amountPayment;
        summary.upfront.count += 1;
      // Handle payment calculations
      } else if (payment.flg_upfront) { // upfront
        summary.payment.amount += amountUpfrontReceived;
        summary.payment.count += 1;
      } else if (payment.flg_refund_conducted) { // refund
        summary.payment.amount -= amountRefund;
        summary.payment.count += 1;
      } else if (!payment.flg_upfront && !payment.flg_upfront_used && !payment.flg_refund_conducted) { // normal payments
        summary.payment.amount += amountPayment;
        summary.payment.count += 1;
      } 

      return summary;
    },
    {
      payment: { amount: 0, count: 0 },
      upfront: { amount: 0, count: 0 },
      loss: { amount: 0, count: 0 },
    }
  )
);

const paymentMethodOptions = computed(() =>
  getCliCommonTypePaymentMethodList.value
    .filter((item) => !isDateOutOfToday(item?.date_start, item?.date_end))
    .map((i) => ({
      value: i.code_func1,
      label: i.name_cli_common
    }))
)

const totalPaymentAmount = computed(() =>
  getPayments.value.reduce((sum, payment: Payment) => {
    if (payment.flg_refund) {
      return sum - Number(payment.amount_payment || 0)
    }
    return sum + Number(payment.amount_payment || 0)
  }, 0)
)

const totalUpfrontAmount = computed(() =>
  getPayments.value.reduce(
    (sum, payment: Payment) =>
      sum + Number(payment.amount_upfront_received || 0),
    0
  )
)

async function openCart(row: any) {
  await mtUtils.popup(UpdateCartHeaderModal, {
    data: {
      id_customer: row.id_customer,
      id_cart: row.id_cart
    },
    allData: useCartStore().getCarts,
    fromPage: '入金一覧'
  })
}

const handleBeforeUnload = () => {
  localStorage.removeItem('paymentSearchData')
}

onMounted(async () => {
  if (getCustomerListOptions.value.length === 0) {
    await customerStore.fetchPreparationCustomers()
  }
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  // customerList.value = customerStore.getAllCustomers.map((customer: any) => {
  //   return {
  //     label: concatenate(
  //       customer.code_customer,
  //       customer.name_customer_display
  //     ),
  //     value: customer.value
  //   }
  // })
  // customerListDefault.push(...customerList.value)

  const paymentSearchData = JSON.parse(
    localStorage.getItem('paymentSearchData')
  )

  if (paymentSearchData) {
    searchData.value.id_customer = paymentSearchData.id_customer
    searchData.value.date_to = paymentSearchData.date_to
    searchData.value.date_from = paymentSearchData.date_from
    searchData.value.type_payment_status = paymentSearchData.type_payment_status ? paymentSearchData.type_payment_status : 1
  }
  await init()
  setPageTitle('入金一覧')

  // Fetch payment method list with code 6 (payment method)
  await cliCommonStore.fetchPreparationCliCommonList({
    code_cli_common: [6]
  })
  window.addEventListener("beforeunload", handleBeforeUnload);
})

onUnmounted(() => {
  window.removeEventListener("beforeunload", handleBeforeUnload);
})
</script>
<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 q-ml-sm">
          入金一覧
        </q-toolbar-title>
        <div class="row mobile-hide flex justify-end">
          <MtFormInputDate
            v-model:date="searchData.date_from"
            outlined
            class="col-2"
            label="入金日：Start"
            type="date"
            @keydown.enter="moveNext"
            tabindex="1"
          />
          <MtFormInputDate
            v-model:date="searchData.date_to"
            outlined
            label="入金日：End"
            type="date"
            class="q-mx-sm col-2"
            @keydown.enter="moveNext"
            tabindex="2"
          />
          <MtFilterSelect
            v-model:options="customerList"
            v-model:selecting="searchData.id_customer"
            :options-default="customerListDefault"
            label="オーナー名"
            outlined
            class="col-2"
          />
          <MtFilterSelect
            :options="
              getCliCommonTypePaymentMethodList
                .filter(
                  (item) => !isDateOutOfToday(item?.date_start, item?.date_end)
                )
                .map((i) => ({ value: i.code_func1, label: i.name_cli_common }))
            "
            v-model:selecting="searchData.type_payment_method"
            :options-default="paymentMethodOptions"
            label="支払方法"
            outlined
            class="col-2 q-ml-sm"
          />
          <MtFormPullDown
            v-model:selected="searchData.type_payment_status"
            :options="typePaymentStatus"
            class="q-mx-sm selection-field"
            label="ステータス"
            outlined
          />
          <q-btn
            @click="search"
            unelevated
            color="primary"
            text-color="white"
            tabindex="3"
          >
            <q-icon size="20px" name="search" />検索</q-btn
          >
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_from"
                outlined
                label="入金日：Start"
                type="date"
                @keydown.enter="moveNext"
                class="ipad-field-size-md"
                tabindex="1"
              />
              <MtFormInputDate
                v-model:date="searchData.date_to"
                outlined
                label="入金日：End"
                type="date"
                class="q-mx-sm ipad-field-size-md"
                @keydown.enter="moveNext"
                tabindex="2"
              />
              <MtFilterSelect
                v-model:options="customerList"
                v-model:selecting="searchData.id_customer"
                :options-default="customerListDefault"
                label="オーナー名"
                outlined
              />
              <MtInputForm
                v-model="searchData.type_payment_status"
                :items="typePaymentStatus"
                class="q-mx-sm ipad-field-size-md"
                label="ステータス"
                outlined
                type="selection"
              />
              <q-btn
                @click="search"
                unelevated
                color="primary"
                text-color="white"
                tabindex="3"
              >
                <q-icon size="20px" name="search"
              /></q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row q-mb-sm q-px-md q-pt-lg">
      <div class="summary-col" style="width: 20%">
        <div class="body1 regular text-grey-700">
          検索結果：<span class="q-ml-sm">{{ getPayments.length }} 件</span>
        </div>
      </div>
      <!-- <div style="width: 10%"></div> -->
      <div style="width: 10%"></div>
      <div style="width: 10%"></div>
      <div style="width: 10%" class="text-center">
        <small class="q-pl-md">
          
          入金 {{ paymentAggregates.payment.count }} 件
          <!-- 入金 {{ getPayments.filter((p) => p.amount_payment > 0).length }} 件 -->
        </small>
        <div class="caption1 bold q-pl-md">
          {{ formattedPrice(paymentAggregates.payment.amount) }}
          <!-- {{ formattedPrice(totalPaymentAmount) }} -->
          <small>円</small>
        </div>
      </div>
      <div style="width: 10%" class="text-center">
        <small>
          前受
          {{ paymentAggregates.upfront.count }}
          件
        </small>
        <div class="caption1 bold">
          {{ formattedPrice(paymentAggregates.upfront.amount) }}
          <small>円</small>
        </div>
      </div>

      <div style="width: 10%" class="text-center">
        <small>
          損金
          {{ paymentAggregates.loss.count }}
          件
        </small>
        <div class="caption1 bold">
          {{ formatDecimalNumber(paymentAggregates.loss.amount) ?? 0 }}
          <small>円</small>
        </div>
      </div>

      <div style="width: 30%" class="text-right">
        <div class="">
          <div class="row items-center justify-end">
            <q-btn
              color="grey-100"
              outline
              text-color="primary"
              unelevated
              class="q-mr-sm"
              @click="openDailyPaymentPrintCSV"
            >
              <q-icon
                class="text-grey-500 q-mr-xs"
                name="summarize"
                size="20px"
              />
              日次集計
            </q-btn>
            <q-btn
              color="grey-100"
              class="q-mr-sm"
              outline
              text-color="primary"
              unelevated
              @click="openPaymentPrintCSV"
            >
              <q-icon
                class="text-grey-500 q-mr-xs"
                name="summarize"
                size="20px"
              />
              期間集計
            </q-btn>
            <q-btn
              color="grey-100"
              outline
              text-color="primary"
              unelevated
              @click="openSalesChart"
            >
              <q-icon class="text-grey-500 q-mr-xs" name="summarize" size="20px" />
              日報
            </q-btn>
          </div>
        </div>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="getPayments"
      :show-filter="false"
      row-key="name"
      :rowsBg="true"
      flat
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div
            v-if="col.field == 'number_payment'"
            auto-width
            class="text-center"
            key="number_payment"
          >
            {{ row['number_payment'] }}
          </div>
          <div v-if="col.field == 'number_cart'" key="number_cart" auto-width>
            <div class="body1 regular text-grey-900 row justify-center items-center" @click.stop="openCart(row)">
              <span class="cursor-pointer">
                <q-icon name="shopping_cart" size="24px" class="text-blue" />
              </span>
            </div>
          </div>
          <div
            v-if="col.field == 'type_payment_method'"
            auto-width
            class="text-center"
            key="type_payment_method"
          >
            <div class="no-wrap">
              {{ findTypePaymentLabel(row['type_payment_method']) }}
            </div>
          </div>

          <div
            v-if="col.field == 'name_customer_display'"
            auto-width
            class="text-center"
            key="name_customer_display"
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
            v-if="col.field == 'datetime_payment'"
            auto-width
            class="text-center"
            key="datetime_payment"
          >
            <span v-if="row.flg_refund_occurred">{{
              dateFormat(row['datetime_refund_occurred'], 'YYYY/MM/DD HH:mm')
            }}</span>
            <span v-else>{{
              dateFormat(row['datetime_payment'], 'YYYY/MM/DD HH:mm')
            }}</span>
          </div>

          <div
            v-if="col.field == 'amount_payment'"
            auto-width
            key="amount_payment"
            class="text-center"
          >
            <span v-if="row.flg_refund_occurred" class="text-red">
              - {{ formattedPrice(row['amount_refund']) }}
            </span>
            <span
              v-else-if="row.flg_upfront"
              :class="
                row['amount_upfront_received'] < 0 ? 'text-red' : 'text-green'
              "
            >
              {{ formattedPrice(row['amount_upfront_received']) }}
            </span>
            <span v-else-if="row.flg_upfront_used" class="text-green">
              <!-- don't show anything -->
            </span>
            <span
              v-else-if="!(row.flg_loss || row.flg_loss_decimal)"
              :class="row['amount_payment'] < 0 ? 'text-red' : 'text-green'"
            >
              {{ formattedPrice(row['amount_payment']) }}
            </span>

            <!-- {{ formattedPrice(row['total_amount_insured']) }} -->
          </div>

          <div
            v-if="col.field == 'amount_upfront_received'"
            key="amount_upfront_received"
            auto-width
            class="text-center"
          >
            <span
              v-if="!row.flg_upfront && row.flg_upfront_used && parseFloat(row['amount_payment']) !== 0"
              :class="row['amount_payment'] < 0 ? 'text-red' : 'text-green'"
            >
              {{ formattedPrice(row['amount_payment']) }}
            </span>
            <span
              v-if="row.flg_upfront && row.flg_upfront_used"
              :class="
                row['amount_upfront_received'] < 0 ? 'text-red' : 'text-green'
              "
            >
              {{ formattedPrice(row['amount_upfront_received']) }}
            </span>
            <!-- {{ formattedPrice(row['amount_upfront_received']) }} -->
          </div>

          <div 
            v-if="col.field =='amount_loss'" 
            auto-width
            key="amount_loss"
            class="text-center">
            <span v-if="row.flg_loss || row.flg_loss_decimal" class="text-red">
              {{ formattedPrice(row['amount_loss']) }}
            </span>
          </div>

          <div 
            v-if="col.field =='flg_type'" 
            auto-width
            key="flg_type"
            class="text-center"
          >
            <span v-if="row.flg_upfront">前受入金</span>
            <span v-else-if="row.flg_upfront_used">前受清算</span>
            <span v-else-if="row.flg_refund_conducted">返金済</span>
            <span v-else-if="row.flg_loss || row.flg_loss_decimal">損金</span>
          </div>
          
          <div
            v-if="col.field == 'type_payment_status'"
            key="type_payment_status"
            class="text-center"
          >
            <q-chip
              dense
              :class="
                getPaymentStatusChipColor(row['type_payment_status'])?.color
              "
              v-if="!(row.flg_loss || row.flg_loss_decimal)"
            >
              <div
                class="caption1 text-grey-white text-center"
                style="color: white; min-width: 70px"
              >
                {{
                  getPaymentStatusChipColor(row['type_payment_status'])?.label
                }}
              </div>
            </q-chip>
          </div>
          
          <div
            v-if="col.field == 'memo_payment'"
            auto-width
            key="memo_payment"
            class="fit"
          >
            {{ row['memo_payment'] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.red {
  color: #ff4343;
}
.custom-table-box {
  margin-bottom: -34px;
}

.summary-row {
  display: flex;
  width: 100%;
  padding: 30px 16px 10px;
}

// .summary-col {
//   &:nth-child(1) {
//     width: 10%;
//   }
//   &:nth-child(2) {
//     width: 12%;
//   }
//   &:nth-child(3) {
//     width: 13%;
//   }
//   &:nth-child(4) {
//     width: 15%;
//   }
//   &:nth-child(5) {
//     width: 10%;
//   }
//   &:nth-child(6) {
//     width: 10%;
//   }
//   &:nth-child(7) {
//     width: 5%;
//   }
//   &:nth-child(8) {
//     width: 5%;
//   }
//   &:nth-child(9) {
//     width: 5%;
//   }
//   &:nth-child(10) {
//     width: 40%;
//   }
  // &:nth-child(11) {
  //   width: 10%;
  // }
  // &:nth-child(12) {
  //   width: 40%;
  // }
// }

.summary-data {
  text-align: left;
  padding-left: 16px;
}

.summary-text {
  font-weight: bold;
}
</style>
