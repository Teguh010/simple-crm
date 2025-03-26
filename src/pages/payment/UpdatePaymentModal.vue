<script setup lang="ts">
import { computed, onMounted, reactive, ref, defineAsyncComponent } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import {
  applyModalBottomPadding,
  formatDate,
  formatHoursMinutes,
  getDateToday,
  isDateOutOfToday,
  roundFloat
} from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import useCustomerStore from '@/stores/customers'
import usePaymentStore from '@/stores/payment'
import { storeToRefs } from 'pinia'
import aahValidations from '@/utils/aahValidations'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import {
  timeHourMinute,
  typeCcBrand,
  typePaymentCategory,
  typePaymentStatus
} from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import dayjs, { Dayjs } from 'dayjs'
import { roundToNearestQuarterHour } from '@/utils/roundToNearestQuarterHour'
import useCliCommonStore from '@/stores/cli-common'
import useCartStore from '@/stores/carts'
import { Platform } from 'quasar'

const UpdateCartHeaderModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartHeaderModal.vue')
)

const paymentStore = usePaymentStore()
const customerStore = useCustomerStore()
const cliCommonStore = useCliCommonStore()
const cartStore = useCartStore()

const { getPayments, getPayment } = storeToRefs(paymentStore)
const { getCustomer } = storeToRefs(customerStore)
const { getCliCommonCustomerColorList, getCliCommonTypePaymentMethodList } =
  storeToRefs(cliCommonStore)

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  cartData: Object,
  isRefunded: Boolean,
  amountRemaining: Number,
  pageTitle: String,
  fromPage: String,
  flgTempCash: {
    default: false,
    type: Boolean
  }
})

const isIpad = Platform.is.ipad

const alertTobeDisplayed = ref(['決済方法を最終確認して下さい。'])
const flg_refund = ref(false)
const disableUI = ref(false)

const data = ref({
  type_payment_category: null,
  datetime_bill: null,
  type_payment_method: '',
  type_cc_brand: 0,
  number_cc_last_four_digits: '',
  flg_refund_occurred: false,
  flg_loss: false,
  flg_payment_advance: false,
  memo_payment: '',
  amount_payment: 0,
  datetime_payment: null,
  type_payment_status: 1,
  date_payment_plan: null,
  id_cart: null,
  id_customer: null,
  flg_temp_cash: false
})

const now = dayjs()
const roundedTime = roundToNearestQuarterHour(now as Dayjs)

const datetime_bill_date = ref(getDateToday())
const datetime_bill_time = ref(roundedTime.format('HH:mm'))
const datetime_payment_date = ref(getDateToday())
const datetime_payment_time = ref(roundedTime.format('HH:mm'))
const datetime_refund_date = ref(getDateToday())
const datetime_refund_time = ref(roundedTime.format('HH:mm'))

const amount_remaining = ref(0)
const remainingRefund = ref(0)

const typePaymentStatusList = ref(
  typePaymentStatus.filter(
    (payment) => payment.value == 1 || payment.value == 3
  )
)
const paymentStatusListDefault = reactive<any>([])
const availablePaymentMethods = ref<any>([])
const isEdit = ref(false)
const currentCustomer = ref(null)
const customerColor = ref('')
const old_datetime_payment = ref(null)
const amount_a = ref(null)
const amount_c = ref(null)
const isSubmitting = ref(false)

const isCashPayment = computed(() => data.value.type_payment_method === '1')

const closeModal = () => {
  emits('close')
  setPageTitle(props.fromPage)
}

const disableSubmit = computed(() => {
  return (
    Boolean(amount_a.value) &&
    Number(amount_a.value) - Number(data.value.amount_payment) < 0
  )
})

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: props.cartData.flg_completed ? 'disabled' : '',
        clickable: props.cartData.flg_completed ? false : true
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
              await mtUtils.promiseAllWithLoader([
                cartStore.fetchCart(props.cartData.id_cart)
              ])
              await paymentStore.fetchPaymentsByCart(props.cartData?.id_cart)

              emits('close')
            })
          }
        })
    }
  }
}

const submit = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (props.isRefunded) {
      if (remainingRefund.value > 0) {
        mtUtils.autoCloseAlert('返金額が不正です。')
        return
      }
    }
    if (
      !isEdit.value &&
      !props.isRefunded &&
      (!data.value.amount_payment ||
        data.value.amount_payment === '0' ||
        isNaN(Number(data.value.amount_payment)))
    ) {
      mtUtils.autoCloseAlert('支払金額：有効な数値を入力してください。')
      return
    }

    if (!data.value.flg_loss && !Boolean(data.value.type_payment_status)) {
      mtUtils.autoCloseAlert('支払ステータスを選択してください')
      return
    }

    if (datetime_bill_date.value != '' && datetime_bill_time.value != '') {
      data.value.datetime_bill = datetime_bill_date.value
      data.value.datetime_bill += ' ' + datetime_bill_time.value + ':00'
    }

    console.log(datetime_payment_date.value, datetime_payment_time.value)

    if (
      datetime_payment_date.value != '' &&
      datetime_payment_time.value != ''
    ) {
      data.value.datetime_payment = datetime_payment_date.value
      data.value.datetime_payment += ' ' + datetime_payment_time.value + ':00'
    }

    if (Boolean(amount_a.value) && isCashPayment) {
      data.value.amount_received = amount_a.value
    }

    if (Boolean(amount_c.value) && isCashPayment) {
      data.value.amount_change = amount_c.value
    }

    const { type_payment_status, ...objectData } = data.value

    const dataToSubmit = data.value.flg_loss ? { ...objectData } : data.value

    if (data.value.flg_upfront) {
      data.value.amount_upfront_received = data.value.amount_payment
      data.value.datetime_upfront = data.value.datetime_payment
    }

    if (!isEdit.value) {
      data.value.id_customer = props.cartData.id_customer
      dataToSubmit.id_customer = data.value.id_customer

      if (data.value.flg_loss) {
        dataToSubmit.amount_loss = data.value.amount_payment
      }

      if (data.value.flg_refund_occurred) {
        dataToSubmit.datetime_payment = null
        dataToSubmit.datetime_refund_occurred = datetime_refund_date.value
        dataToSubmit.datetime_refund_occurred +=
          ' ' + datetime_refund_time.value + ':00'
      }

      if (dataToSubmit.amount_received) {
        dataToSubmit.amount_received = Number(
          dataToSubmit.amount_received
        ).toFixed(2)
      }

      if (dataToSubmit.amount_payment) {
        dataToSubmit.amount_payment = Number(
          dataToSubmit.amount_payment
        ).toFixed(2)
      }

      const resp = await paymentStore.submitPayment(dataToSubmit as any)
      if (resp.data.code == 200) {
        mtUtils.autoCloseAlert(aahMessages.success)
        await paymentStore.fetchPaymentByCustomer({
          id_cart: props.cartData.id_cart,
          flg_upfront_ui: true,
          id_customer: props.cartData.id_customer,
          flg_refund_occurred: true,
          flg_refund_conducted: true
        })
        await mtUtils.promiseAllWithLoader([
          cartStore.fetchCart(props.cartData.id_cart),
          await paymentStore.fetchPaymentsByCart(props.data?.id_cart)
        ])
        closeModal()
      } else {
        mtUtils.autoCloseAlert(aahMessages.failed)
      }
      return
    }
    /// I removed datetime_payment for this issue TODO, not sure about it ! ! !

    if (data.value.amount_received) {
      data.value.amount_received = Number(data.value.amount_received).toFixed(2)
    }

    if (data.value.amount_payment) {
      data.value.amount_payment = Number(data.value.amount_payment).toFixed(2)
    }

    const resp = await paymentStore.updatePayment(data.value as any)
    if (resp.data.code == 200) {
      mtUtils.autoCloseAlert(aahMessages.success)
      await paymentStore.fetchPaymentByCustomer({
        id_cart: props.cartData?.id_cart,
        flg_upfront_ui: true,
        id_customer: props.cartData.id_customer,
        flg_refund_conducted: true,
        flg_refund_occurred: true
      })
      await mtUtils.promiseAllWithLoader([
        cartStore.fetchCart(props.cartData.id_cart)
      ])
      closeModal()
    } else {
      mtUtils.autoCloseAlert(aahMessages.failed)
    }
  } catch (error) {
    console.error('Error during submission:', error)
    mtUtils.autoCloseAlert(aahMessages.failed)
  } finally {
    isSubmitting.value = false
  }
}

const setPaymentStatus = () => {
  const paymentMethod = parseInt(data.value.type_payment_method)
  if (data.value.type_payment_category === 1) {
    // Condition #1: Type_payment_status == 1 (入金済)
    if ([1, 2, 4, 5, 6, 7, 8, 9, 10, 11].includes(paymentMethod)) {
      data.value.type_payment_status = typePaymentStatus[0].value // Set to "入金済"
    }
  } else if (data.value.type_payment_category === 2) {
    // Condition #2: Type_payment_status == 2 (返金済)
    // Always set to "返金済" when a refund has been completed

    // Condition #3: Type_payment_status == 3 (保留)
    if (paymentMethod === 2) {
      data.value.type_payment_status = typePaymentStatus[2].value // Set to "保留"
    }

    // Condition #4: Type_payment_status == 4 (支払い待ち)
    if ([2, 3, 4, 12, 13].includes(paymentMethod)) {
      data.value.type_payment_status = typePaymentStatus[3].value // Set to "支払い待ち"
    }

    // Condition #5: Type_payment_status == 5 (失敗)
    // No specific condition provided, it seems like it's for failed payments
  }

  //fallback - select first index
  if (data.value.type_payment_status <= 0) {
    data.value.type_payment_status = typePaymentStatus[0]?.value ?? -1
  }
}

const updateTypePaymentCategory = (val: any) => {
  if (val == 2 || val == 3) {
    data.value.type_payment_status = typePaymentStatus[3].value
  } else {
    data.value.type_payment_status = typePaymentStatus[0].value
  }
  setPaymentStatus()
}

const updateTypePaymentMethod = (val: any) => {
  data.value.type_cc_brand = 0
  data.value.type_payment_status = -1
  setPaymentStatus()
}

const updateTypeCcBrand = (val: any) => {
  setPaymentStatus()
}

const getTotalPaidAmount = () => {
  let totalPaid = 0
  getPayments.value?.payment_list.forEach((payment) => {
    if (!(payment.flg_refund_occurred || payment.flg_refund_conducted)) {
      totalPaid += Number(payment.amount_payment)
    }
  })
  return totalPaid
}

const getAmountLoss = () => {
  let amount_loss = 0
  if (!getPayments.value.payment_list) return 0

  getPayments.value.payment_list.forEach((payment: any) => {
    if (payment.flg_loss || payment.flg_loss_decimal) {
      amount_loss += Number(payment.amount_loss)
    }
  })
  return amount_loss
}

const getTotalRefundAmount = () => {
  let totalRefund = 0
  getPayments.value.refund_occurred_list.forEach((payment) => {
    totalRefund += Number(payment.amount_refund)
  })
  getPayments.value.refund_conducted_list.forEach((payment) => {
    totalRefund += Number(payment.amount_refund)
  })
  return totalRefund
}

const updateRemainingRefund = (val: any) => {
  data.value.remainingRefund = 0

  if (isNaN(val)) {
    data.value.amount_refund = 0
  }
  if (!isNaN(val)) {
    remainingRefund.value =
      Number(props.cartData.bill) + Number(getTotalRefundAmount()) + Number(val)
  } else {
    remainingRefund.value = Number(props.cartData.bill)
  }
}
const updateAmountRemaining = (val: any) => {
  if (isNaN(val)) {
    data.value.amount_payment = 0
  }

  let totalPaid = getTotalPaidAmount()

  const amountInstallment =
    useCartStore().getCart.cart_details.find(
      (cd) => cd.flg_group_title && cd.group_detail['cb_installment']
    )?.group_detail['amount_installment'] || 0

  if (isNaN(val)) {
    amount_remaining.value = roundFloat(
      Number(props.cartData.bill) - totalPaid - getAmountLoss()
    )
  } else {
    amount_remaining.value =
      Number(props.cartData.bill) -
      Number(totalPaid) -
      getAmountLoss() -
      Number(val) +
      Number(amountInstallment)
  }

  if (isNaN(data.value.amount_payment)) {
    data.value.amount_payment = 0
  }

  if (Number(val) > Number(amount_a.value)) {
    amount_a.value = Number(val)
    amount_c.value = 0
  } else if (Number(amount_a.value)) {
    const tempAmount = Number(amount_a.value) - Number(val)
    amount_c.value = tempAmount >= 0 ? tempAmount : 0
  }
}

const updateCValue = (val: any) => {
  if (val) {
    const tempAmount = Number(val) - Number(data.value.amount_payment)
    amount_c.value = tempAmount >= 0 ? tempAmount : 0
  }
}

const setAmountFromPayment = () => {
  if (data.value.amount_payment !== null && !isNaN(data.value.amount_payment)) {
    amount_a.value = data.value.amount_payment
    amount_c.value = 0
  } else {
    console.warn('Amount payment is not valid.')
  }
}

const setCustomerColor = () => {
  const colorJson = getCliCommonCustomerColorList.value.find(
    (cc) => cc.code_func1 === currentCustomer.value.type_customer_color
  )
  if (colorJson) {
    const col = 'bg-' + colorJson.label + ' q-ml-sm q-mt-xs'
    customerColor.value = col
  }
}

const updateTypePaymentStatusOnFlgRefundChange = (val: boolean) => {
  if (val) {
    radioSelectflg('flg_refund')
    data.value.type_payment_status = typePaymentStatus[1].value
    typePaymentStatusList.value = typePaymentStatus.filter(
      (payment) => payment.value == 2 || payment.value == 3
    )
    if (data.value.amount_payment > 0) {
      data.value.amount_payment *= -1
    }
  } else {
    data.value.amount_payment = Math.abs(data.value.amount_payment)
  }
}

const radioSelectflg = (val: string) => {
  if (val === 'flg_refund') {
    data.value.flg_refund = true
    data.value.flg_loss = false
    data.value.flg_payment_advance = false
  } else if (val === 'flg_loss') {
    data.value.flg_refund = false
    data.value.flg_loss = true
    data.value.flg_payment_advance = false
  } else {
    typePaymentStatusList.value = typePaymentStatus.filter(
      (payment) => payment.value == 1 || payment.value == 3
    )
    data.value.type_payment_status = typePaymentStatus[0].value
    data.value.flg_refund_occurred = false
    data.value.flg_loss = false
    data.value.flg_payment_advance = true
  }
}

// Validation rule
const paymentCategoryRule = [
  (val) => {
    // Check if type_payment_category is 2 and both stripe and paypay are false
    if (
      val === 2 &&
      !availablePaymentMethods.value.stripe &&
      !availablePaymentMethods.value.paypay
    ) {
      return 'お客様は後払い可能なオプション未登録です。'
    }
    return true // Return true if the validation should pass
  }
]

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

const init = () => {
  const tempList = getCliCommonTypePaymentMethodList.value
    .filter((item) => !isDateOutOfToday(item.date_start, item.date_end))
    .map((i) => ({
      value: i.code_func1,
      label: i.name_cli_common
    }))
    .sort((a: any, b: any) => a?.display_order - b?.display_order)

  data.value.type_payment_method = tempList[0].value

  data.value.type_cc_brand = typeCcBrand[0].value

  data.value.type_payment_status = typePaymentStatus[0].value

  data.value.id_cart = props.cartData.id_cart

  data.value.flg_refund_occurred = props.isRefunded

  try {
    if (props.cartData.id_request.flg_in_app_payment === false) {
      data.value.type_payment_category = typePaymentCategory[0].value
    } else if (props.cartData.id_request.flg_in_app_payment) {
      data.value.type_payment_category = typePaymentCategory[1].value
    }
  } catch (error) {
    data.value.type_payment_category = typePaymentCategory[0].value
  }

  if (props.isRefunded) {
    updateRemainingRefund(0)
  }

  if (props.flgTempCash) {
    data.value.type_payment_method = 1
    data.value.flg_temp_cash = true
    disableUI.value = true
    data.value.amount_payment = props.amountRemaining
    data.value.type_payment_category = 1
  }

  if (!props.isRefunded) {
    data.value.amount_payment = props.amountRemaining
  }

  if (!isEdit.value) amount_a.value = data.value.amount_payment
}

onMounted(async () => {
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [25] })

  currentCustomer.value = getCustomer.value

  setCustomerColor()

  flg_refund.value = props.isRefunded

  const copiedPaymentObj = { ...props.data }

  if (copiedPaymentObj.id_payment) {
    // call payment api again to get the latest data. this is because the data might have been updated by webhook
    await paymentStore.fetchPayment(copiedPaymentObj.id_payment)
    // old_datetime_payment.value = copiedPaymentObj.datetime_payment
    // data.value = copiedPaymentObj
    old_datetime_payment.value = getPayment.value.datetime_payment
    // data.value = copiedPaymentObj
    data.value = getPayment.value
    data.value.amount_payment = roundFloat(data.value.amount_payment)

    amount_remaining.value = props.amountRemaining

    isEdit.value = true
    // amount_a.value = props.data.amount_received
    // amount_c.value = props.data.amount_change
    amount_a.value = getPayment.value.amount_received
    amount_c.value = getPayment.value.amount_change
  } else {
    init()
  }

  if (flg_refund.value && !Boolean(props?.data?.id_payment)) {
    data.value.type_payment_status = typePaymentStatus[1].value
    data.value.amount_refund = Math.abs(
      Number(props.cartData.bill) + Number(getTotalRefundAmount())
    )
  }

  if (isEdit.value) {
    if (data.value.datetime_bill !== null) {
      datetime_bill_date.value = formatDate(data.value.datetime_bill)
      datetime_bill_time.value = formatHoursMinutes(data.value.datetime_bill)
    }
    if (data.value.datetime_payment !== null) {
      datetime_payment_date.value = formatDate(data.value.datetime_payment)
      datetime_payment_time.value = formatHoursMinutes(
        data.value.datetime_payment
      )
      // datetime_payment_time.value =
    }
  }

  mtUtils
    .callApi(
      selectOptions.reqMethod.POST,
      `/customer/check-available-payment-methods/${getCustomer.value.id_customer}`
    )
    .then((resp: any) => {
      availablePaymentMethods.value = resp
    })

  if (props.pageTitle) {
    setPageTitle(props.pageTitle)
  }

  applyModalBottomPadding()
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="true">
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
        会計番号 :
        <span
          class="text-blue cursor-pointer"
          @click="openCart(props.cartData)"
        >
          {{ props.cartData.number_cart }}
        </span>
      </span>
      <div class="q-ml-auto"></div>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section
      class="q-px-xl content-small-screen"
      style="overflow-y: scroll; max-height: 75vh"
      id="content-area"
      :class="{ content: isIpad }"
    >
      <div v-for="(alert, index) in alertTobeDisplayed" :key="index">
        <q-icon size="20px" name="error" color="negative" />
        <span class="caption2 text-negative q-ml-xs">{{ alert }}</span>
      </div>
      <div
        class="q-my-sm text-danger"
        v-if="data.type_payment_category == 2 && availablePaymentMethods"
      >
        <span
          class="caption2 q-my-xs q-mr-lg"
          v-for="(value, key) in availablePaymentMethods"
          :key="key"
        >
          {{ key }} - {{ value ? '登録あり' : 'myVettyで決済未登録' }}
        </span>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormPullDown
            :disable="disableUI"
            v-model:selected="data.type_payment_category"
            :options="typePaymentCategory"
            :rules="paymentCategoryRule"
            :styling="'col-lg-4 col-md-4 col-sm-6'"
            label="決済方法"
            @update:selected="updateTypePaymentCategory"
          />
        </div>
        <template v-if="!props.isRefunded">
          <div class="col-lg-4 col-md-4 col-sm-6">
            <MtFormInputDate
              v-model:date="datetime_bill_date"
              type="date"
              label="請求日時 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-4 col-md-4 col-sm-6">
            <MtFormPullDown
              type="selection"
              v-model:selected="datetime_bill_time"
              :options="timeHourMinute"
              label="時：分 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </template>
        <template v-else>
          <div class="col-lg-4 col-md-4 col-sm-6">
            <MtFormInputDate
              v-model:date="datetime_refund_date"
              type="date"
              label="返金日時 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-4 col-md-4 col-sm-6">
            <MtFormPullDown
              type="selection"
              v-model:selected="datetime_refund_time"
              :options="timeHourMinute"
              label="時：分 *"
              required
              class="w-100"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </template>
      </div>
      <div class="row q-col-gutter-md q-my-xl items-center">
        <template v-if="isCashPayment">
          <div class="col-lg-6 col-md-6 col-sm-6">
            <div class="row items-center">
              <div class="col-auto">
                <span>お預り</span>
                <span class="large-title q-mr-md"> ￥</span>
              </div>
              <div class="col-9">
                <MtFormInputNumber2
                  v-model:value="amount_a"
                  :disable="isEdit"
                  tabindex="2"
                  :input-class="{ 'size-large': true }"
                  :input-style="{
                    'font-size': isIpad ? '20px' : '30px',
                    'font-weight': 'bold',
                    'text-align': 'right'
                  }"
                  :showCopyButton="true"
                  :copyButtonLabel="'釣0'"
                  @update:modelValue="updateCValue"
                  @copyButtonClick="setAmountFromPayment"
                />
              </div>
            </div>
          </div>
          <div class="w-100"></div>
          <!--Break line-->
        </template>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row items-center">
            <div class="col-auto">
              <span>入金額</span>
              <span class="large-title q-mr-md"> ￥</span>
            </div>
            <div v-if="props.isRefunded" class="col-9">
              <MtFormInputNumber2
                v-model:value="data.amount_refund"
                :disable="isEdit"
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
                @update:value="updateRemainingRefund"
              />
            </div>
            <div v-else-if="isEdit && data.flg_loss">
              <MtFormInputNumber2
                v-model:value="data.amount_loss"
                :disable="isEdit && !data.flg_upfront_used"
                :input-class="{ 'size-extra-large': true }"
                :input-style="{
                  'font-size': isIpad ? '30px' : '45px',
                  'font-weight': 'bold',
                  'padding-bottom': '16px',
                  'text-align': 'right'
                }"
                :qClass="'q-number-height-lg'"
                :rules="[aahValidations.validationNonZeroNumber]"
                autofocus
                tabindex="1"
                @update:value="updateAmountRemaining"
              />
            </div>
            <div v-else-if="isEdit && data.flg_upfront" class="col-9">
              <MtFormInputNumber2
                v-model:value="data.amount_upfront_received"
                :input-style="{
                  'font-size': isIpad ? '30px' : '45px',
                  'font-weight': 'bold',
                  'padding-bottom': '16px',
                  'text-align': 'right'
                }"
                :disable="isEdit"
                tabindex="1"
                autofocus
                :input-class="{ 'size-extra-large': true }"
                :rules="[aahValidations.validationFormattedNumber]"
                :qClass="'q-number-height-lg'"
                @update:value="updateAmountRemaining"
              />
            </div>
            <div v-else class="col-9">
              <MtFormInputNumber2
                v-model:value="data.amount_payment"
                :input-style="{
                  'font-size': isIpad ? '30px' : '45px',
                  'font-weight': 'bold',
                  'padding-bottom': '16px',
                  'text-align': 'right'
                }"
                :disable="isEdit"
                tabindex="1"
                autofocus
                :input-class="{ 'size-extra-large': true }"
                :rules="[aahValidations.validationFormattedNumber]"
                :qClass="'q-number-height-lg'"
                @update:value="updateAmountRemaining"
              />
            </div>
          </div>
        </div>
        <div v-if="!data.flg_upfront_used" class="col-lg-6 col-md-6 col-sm-12">
          <div class="row items-center">
            <div class="col-auto">
              <span v-if="!isEdit">残金</span>
              <span
                v-if="!props.isRefunded && !isEdit"
                class="large-title q-mr-md"
              >
                ￥</span
              >
            </div>
            <div v-if="!props.isRefunded" class="col-9">
              <MtFormInputNumber2
                v-if="!isEdit"
                outlined
                disable
                v-model:value="amount_remaining"
                :input-style="{
                  'font-size': isIpad ? '20px' : '25px',
                  color: 'black',
                  'text-align': 'right'
                }"
              />
            </div>
            <div v-else class="col-9">
              <MtFormInputNumber2
                v-model:value="remainingRefund"
                :input-style="{
                  'font-size': isIpad ? '20px' : '25px',
                  color: 'black',
                  'text-align': 'right'
                }"
                disable
                outlined
              />
            </div>
          </div>
        </div>
        <template v-if="isCashPayment">
          <div class="col-lg-6 col-md-6 col-sm-6 q-mt-md">
            <div class="row items-center">
              <div class="col-auto">
                <span>おつり</span>
                <span class="large-title q-mr-md"> ￥</span>
              </div>
              <div class="col-9">
                <MtFormInputNumber2
                  v-model="amount_c"
                  disable
                  :input-class="{ 'size-large': true }"
                  :input-style="{
                    'font-size': isIpad ? '20px' : '30px',
                    'font-weight': 'bold',
                    'text-align': 'right'
                  }"
                />
              </div>
            </div>
          </div>
          <div v-if="!isEdit" class="w-100"></div>
          <!--Break line-->
        </template>
      </div>
      <div class="row q-col-gutter-md q-mb-md items-center">
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
          :styling="'col-lg-4 col-md-4 col-sm-6'"
          @update:selected="updateTypePaymentMethod"
          style="width: 30%"
          :disable="disableUI"
        />
        <MtFormPullDown
          v-if="data.type_payment_method == 2"
          v-model:selected="data.type_cc_brand"
          :options="typeCcBrand"
          label="カード種別"
          class="q-ml-md col-3"
          @update:selected="updateTypeCcBrand"
        />
        <MtInputForm
          v-if="data.type_payment_method == 2"
          type="text"
          label="カード番号下４桁"
          class="q-ml-md col-3 q-pt-md q-pl-md"
          v-model="data.number_cc_last_four_digits"
        />
      </div>
      <div
        v-if="!(data.id_payment || data.flg_upfront_used || disableUI)"
        class="row q-col-gutter-md q-mb-md"
      >
        <div class="col-3" v-if="props.isRefunded">
          <MtFormCheckBox
            label="返金"
            v-model:checked="data.flg_refund_occurred"
            @update:modelValue="updateTypePaymentStatusOnFlgRefundChange"
            :disable="data.flg_temp_cash || props.isRefunded"
          />
        </div>
        <template v-if="!props.isRefunded">
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_upfront"
              :disable="data.flg_temp_cash"
              label="前受金"
              @update:modelValue="radioSelectflg('flg_upfront')"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_loss"
              :disable="data.flg_temp_cash"
              label="損金計上"
              @update:modelValue="radioSelectflg('flg_loss')"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_temp_cash"
              disable
              label="売上外"
            />
          </div>
        </template>
      </div>

      <!--      This one is for is Edit Case  -->
      <div v-if="isEdit" class="row q-col-gutter-md q-mb-md">
        <div v-if="props.isRefunded" class="col-3">
          <MtFormCheckBox
            v-model:checked="data.flg_refund_occurred"
            :disable="isEdit"
            label="返金"
            @update:modelValue="updateTypePaymentStatusOnFlgRefundChange"
          />
        </div>
        <template v-if="!props.isRefunded">
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_upfront"
              :disable="isEdit"
              label="前受金"
              @update:modelValue="radioSelectflg('flg_upfront')"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_loss"
              :disable="isEdit"
              label="損金計上"
              @update:modelValue="radioSelectflg('flg_loss')"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="data.flg_temp_cash"
              :disable="isEdit"
              label="売上外"
            />
          </div>
        </template>
      </div>
      <div class="q-mb-lg">
        <MtInputForm
          type="text"
          label="入金メモ"
          autogrow
          tabindex="10"
          v-model="data.memo_payment"
        />
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6" v-if="!data.flg_loss">
          <MtFormPullDown
            label="ステータス"
            v-model:selected="data.type_payment_status"
            :options="typePaymentStatusList"
            tabindex="6"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormInputDate
            type="date"
            label="入金予定日"
            v-model:date="data.date_payment_plan"
            v-if="data.type_payment_status == 4"
          />
        </div>
      </div>
      <div
        v-if="data?.type_payment_status === 1 || data?.flg_loss"
        class="row q-col-gutter-md q-mb-md"
      >
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormInputDate
            v-model:date="datetime_payment_date"
            type="date"
            :label="data?.flg_loss ? '計上日時 *' : '入金日時 *'"
            required
            :rules="[aahValidations.validationRequired]"
            tabindex="4"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormPullDown
            type="selection"
            v-model:selected="datetime_payment_time"
            :options="timeHourMinute"
            label="時：分 *"
            required
            :rules="[aahValidations.validationRequired]"
            tabindex="5"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          tabindex="7"
          class="q-ml-md"
          type="submit"
          :loading="isSubmitting"
          :disable="disableSubmit || isSubmitting"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
<style scoped>
.header-sticky {
  position: sticky;
  width: 100%;
  height: 5vh;
  background: white !important;
  top: 0;
  z-index: 100;
}

@media screen and (max-width: 640px) {
  .content-small-screen {
    max-height: calc(100vh - 300px);
    height: unset !important;
    overflow-y: auto;
  }
}
</style>
