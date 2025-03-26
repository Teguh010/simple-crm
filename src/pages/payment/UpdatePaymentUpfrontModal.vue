<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateTimeNow, roundFloat, isDateOutOfToday } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import useCustomerStore from '@/stores/customers'
import usePaymentStore from '@/stores/payment'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'

import { setPageTitle } from '@/utils/pageTitleHelper'
import dayjs from 'dayjs'
import selectOptions from '@/utils/selectOptions'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import aahMessages from '@/utils/aahMessages'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

const commonStore = useCommonStore()
const paymentStore = usePaymentStore()
const cartStore = useCartStore()
const customerStore = useCustomerStore()
const cliCommonStore = useCliCommonStore()

const {
  getCart,
  getCustomerCartBalance,
  getLatestCartBalanceRecord,
  getFlgAddCartBalance
} = storeToRefs(cartStore)
const { getPayments } = storeToRefs(paymentStore)
const { getCustomer } = storeToRefs(customerStore)
const { getCliCommonCustomerColorList, getCliCommonTypePaymentMethodList } = storeToRefs(cliCommonStore)

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  cartData: Object,
  isRefunded: Boolean,
  amountRemaining: Number,
  pageTitle: String,
  fromPage: String
})

const data = ref({
  type_payment_category: null,
  datetime_bill: getDateTimeNow(),
  type_payment_method: '',
  type_cc_brand: 0,
  number_cc_last_four_digits: '',
  flg_refund: false,
  flg_loss: false,
  flg_payment_advance: false,
  memo_payment: '',
  amount_payment: 0,
  datetime_payment: getDateTimeNow(),
  type_payment_status: 1,
  date_payment_plan: null,
  id_cart: null,
  id_customer: null
})

const now = dayjs()

const amount_remaining = ref(0)
const datetime_processed = ref(now.format('YYYY-MM-DD HH:mm:ss'))

const availablePaymentMethods = ref<any>([])
const isEdit = ref(false)
const currentCustomer = ref(null)
const customerColor = ref('')

const closeModal = () => {
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
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
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            paymentStore.deletePayment(data.value.id_payment).then(async () => {
              mtUtils.autoCloseAlert(aahMessages.success)
              await paymentStore.fetchPaymentByCustomer({
                id_cart: props.cartData.id_cart,
                flg_upfront_ui: true,
                id_customer: props.cartData.id_customer,
                flg_refund_occurred: true,
                flg_refund_conducted: true
              })
              emits('close')
            })
          }
        })
    }
  }
}

const getAmountLoss = () => {
  let amount_loss = 0
  if (!getPayments.value?.payment_list) return 0

  getPayments.value?.payment_list.forEach((payment: any) => {
    if (payment.flg_loss) {
      amount_loss += Number(payment.amount_loss)
    }
  })
  return amount_loss
}
const cartAmountRemaining = computed(() => {
  let totalPaid = 0
  let cartBalance = 0

  getPayments.value?.payment_list?.forEach((payment) => {
    if (!payment.flg_refund_occurred && !payment.flg_loss) {
      totalPaid += Number(payment.amount_payment)
    }
  })

  if (
    getLatestCartBalanceRecord.value &&
    getLatestCartBalanceRecord.value.id_cart_balance ==
      getCart.value?.id_cart_balance &&
    getLatestCartBalanceRecord.value.amount_adjustment < 0
  ) {
    cartBalance = getCart.value?.flg_completed
      ? Number(getLatestCartBalanceRecord.value.bal_updated)
      : Math.abs(Number(getCustomerCartBalance.value))
  }

  if (getFlgAddCartBalance.value) {
    const amountInstallment =
      getCart.value?.cart_details.find(
        (detail) =>
          detail.flg_group_title && detail.group_detail?.cb_installment
      )?.group_detail?.amount_installment || cartBalance

    return (
      getCart.value?.bill - getAmountLoss() + Number(amountInstallment) - totalPaid
    )
  }

  // return ''
  return getCart.value?.bill - getAmountLoss() - totalPaid
})
const useUpfrontForRemainingBill = () => {
  amount_remaining.value = cartAmountRemaining.value
}
const useFullAmountUpfront = () => {
  amount_remaining.value = computedAmountRemaining.value
}
const calculateProcessPayment = (payment: any) => {
  if (!payment?.payment_upfront_list?.length) {
    return payment.amount_upfront_received
  }

  return payment.payment_upfront_list.reduce(
    (acc, curr) =>
      curr.flg_refund_occurred
        ? acc - curr.amount_refund
        : acc - curr.amount_payment,
    payment.amount_upfront_received
  )
}
const computedAmountRemaining = computed(() => {
  const payment: any = data.value
  let process_payment = payment.amount_upfront_received
  process_payment = calculateProcessPayment(payment)
  return roundFloat(Math.abs(process_payment))
})

const submit = async () => {
  if (data.value.type_payment_status === 3) {
    await mtUtils.alert(
      '入金が「保留」になっています。\n内容を確認して下さい。'
    )
    return
  }

  if (amount_remaining.value == 0) {
    await mtUtils.alert('0円以上で登録してください。')
    return
  }

  if (
    parseInt(computedAmountRemaining.value) < parseInt(amount_remaining.value)
  ) {
    await mtUtils.alert('残高以上の金額を入力することはできません。')
    return
  }

  const isRefund = data.value.flg_refund;
  const updatedData = {
    ...data.value,
    flg_upfront_used: true,
    datetime_upfront_used: appendCurrentTime(datetime_processed.value),
    id_cart_processed: props.cartData.id_cart,
    new_amount_payment_UI: true,
    flg_refund_occurred: isRefund,
    flg_refund_conducted: isRefund,
    datetime_refund_occurred: isRefund ? appendCurrentTime(datetime_processed.value) : null,
    datetime_refund_conducted: isRefund ? appendCurrentTime(datetime_processed.value) : null,
    amount_refund: isRefund ? data.value.amount_payment : null,
    amount_payment: isRefund ? null : data.value.amount_payment,
    type_payment_status: isRefund ? '2': data.value.type_payment_status,
    datetime_payment: appendCurrentTime(datetime_processed.value),
    datetime_bill: appendCurrentTime(datetime_processed.value),
    type_payment_method: isRefund ? data.value.type_payment_method : null,
  };

  if (parseInt(computedAmountRemaining.value) === parseInt(amount_remaining.value)) {
    data.value = {
      ...updatedData,
      flg_no_remaining_upfront_UI: true,
    };
  } else if (parseInt(computedAmountRemaining.value) > parseInt(amount_remaining.value)) {
    data.value = updatedData;
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `payment-flag-upfront/${data.value.id_payment}`,
    { ...data.value, amount_remaining: amount_remaining.value }
  )

  if (response) {
    await mtUtils.autoCloseAlert('更新しました。')
    closeModal()
  }
}

function appendCurrentTime(dateString) {
  // Parse the input date string
  const date = new Date(dateString)

  // Create a new Date object to get the current time
  const currentTime = new Date()

  // Extract hours, minutes, and seconds
  const hours = currentTime.getHours().toString().padStart(2, '0')
  const minutes = currentTime.getMinutes().toString().padStart(2, '0')
  const seconds = currentTime.getSeconds().toString().padStart(2, '0')

  // Format the time string
  const timeString = `${hours}:${minutes}:${seconds}`

  // Format the date part of the input date object
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  // Combine date and time
  const formattedDateTime = `${year}-${month}-${day} ${timeString}`

  return formattedDateTime
}

// Example usage:
const dateString = '2024-06-10'
const dateTimeWithCurrentTime = appendCurrentTime(dateString)

const setCustomerColor = () => {
  const colorJson = getCliCommonCustomerColorList.value.find(
    (cc) => cc.code_func1 === currentCustomer.value.type_customer_color
  )
  if (colorJson) {
    const col = 'bg-' + colorJson.label + ' q-ml-sm q-mt-xs'
    customerColor.value = col
  }
}

const isIpad = computed(() => {
  const userAgent = navigator.userAgent.toLowerCase()
  const isIPad =
    /ipad/.test(userAgent) ||
    (/macintosh/.test(userAgent) && 'ontouchend' in document)
  if (isIPad) {
    return true
  }
  return false
})

onMounted(async () => {
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [25] })
  currentCustomer.value = getCustomer.value
  setCustomerColor()

  if (props.pageTitle) {
    setPageTitle(props.pageTitle)
  }

  if (props.data) {
    data.value = { ...props.data }
    // data.value.datetime_upfront = getDateTimeNow()

    if (props.data.id_payment) {
      isEdit.value = true
    }
  }
  
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader :closeBtn="true" @close-modal="closeModal">
      <q-toolbar-title
        class="text-grey-900 title2 bold"
        style="max-width: max-content"
      >
        請求・入金
      </q-toolbar-title>
      <span class="body1">
        診察券番号 : {{ props.cartData.code_customer }}
      </span>
      <span class="flex body1 q-ml-sm">
        {{ props.cartData.name_customer }}
        <div
          :class="customerColor"
          style="border-radius: 10px; width: 13px; height: 13px"
        />
      </span>
      <span class="body1 q-ml-sm">
        会計番号 : {{ props.cartData.number_cart }}
      </span>
      <div class="q-ml-auto"></div>
      <q-btn v-if="isEdit" class="q-mx-sm" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl q-mb-md">
      <div
        v-if="data.type_payment_category == 2 && availablePaymentMethods"
        class="q-my-sm text-danger"
      >
        <span
          v-for="(value, key) in availablePaymentMethods"
          :key="key"
          class="caption2 q-my-xs q-mr-lg"
        >
          {{ key }} - {{ value ? '登録あり' : 'myVettyで決済未登録' }}
        </span>
      </div>

      <div class="row q-col-gutter-md q-mt-sm">
        <!--Break line-->
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row items-center">
            <div class="col-auto">
              <span>前受金受領総額</span>
              <span class="large-title q-mr-md"> ￥</span>
            </div>
            <div class="col-9">
              <MtFormInputNumber2
                v-model:value="data.amount_upfront_received"
                :disable="true"
                label="受領総額"
                :input-class="{ 'size-extra-large': true }"
                :input-style="{
                  'font-size': isIpad ? '30px' : '45px',
                  'font-weight': 'bold',
                  'padding-bottom': '16px',
                  'text-align': 'right'
                }"
                :qClass="'q-number-height-lg'"
                autofocus
                tabindex="1"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12"></div>

        <!--Break line-->
      </div>
      <div class="row q-col-gutter-md q-my-sm q-pb-md">
        <div class="col-lg-6 col-md-6 col-sm-12 q-mt-lg">
          <div class="row items-center">
            <div class="col-auto">
              <span>前受金残高</span>
              <span class="large-title q-mr-md"> ￥</span>
            </div>
            <div class="col-9">
              <MtFormInputNumber2
                v-model:value="computedAmountRemaining"
                :disable="true"
                :input-class="{ 'size-extra-large': true }"
                :input-style="{
                  'font-size': isIpad ? '30px' : '45px',
                  'font-weight': 'bold',
                  'padding-bottom': '16px',
                  'text-align': 'right'
                }"
                :qClass="'q-number-height-lg'"
                autofocus
                label="残高"
                tabindex="1"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row items-center">
            <div class="col-auto">
              <span>今回利用額</span>
              <span class="large-title q-mr-md"> ￥</span>
            </div>
            <div class="col-9 text-right">
              <section class="flex justify-end" style="gap: 8px">
                <q-btn
                  flat
                  size="12px"
                  class="bg-grey-200 text-grey-800 q-py-none q-mb-sm"
                  label="残高を計算する"
                  @click="useUpfrontForRemainingBill()"
                />
                <q-btn
                  flat
                  size="12px"
                  class="bg-grey-200 text-grey-800 q-py-none q-mb-sm"
                  label="全額"
                  @click="useFullAmountUpfront()"
                />
              </section>
              <MtFormInputNumber2
                v-model:value="amount_remaining"
                :input-style="{
                  'font-size': isIpad ? '20px' : '25px',
                  color: 'black',
                  'text-align': 'right'
                }"
                outlined
              />
            </div>
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-md-4">
          <MtFormCheckBox v-model:checked="data.flg_refund" label="前受金の返金" />
        </div>
        <div class="col-md-4" v-if="data.flg_refund">
          <MtFormPullDown
            v-model:selected="data.type_payment_method"
            label="支払い方法区分"
            :options="
              getCliCommonTypePaymentMethodList
                .filter(
                  (item) => !isDateOutOfToday(item?.date_start, item?.date_end)
                )
                .map((i) => ({ value: i.code_func1, label: i.name_cli_common }))
            "
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-md-4">
          <MtFormInputDate v-model:date="datetime_processed" label="前受金 処理日" />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="full-width q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          class="q-ml-md"
          color="primary"
          tabindex="7"
          type="submit"
          unelevated
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
