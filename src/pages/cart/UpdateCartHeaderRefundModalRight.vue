<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  reactive,
  ref
} from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { absoluteFormattedPrice, formattedPrice } from '@/utils/helper'
import {
  dateFormat,
  getDateTimeNow,
  getDateToday,
  roundFloat,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import { roundToNearestQuarterHour } from '@/utils/roundToNearestQuarterHour'
import dayjs, { Dayjs } from 'dayjs'
import {
  typeCartRoundUnit,
  typePaymentStatus,
  typePriceAdjustment
} from '@/utils/enum'
import aahValidations from '@/utils/aahValidations'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'

// Stores
import useCartStore from '@/stores/carts'
import usePaymentStore from '@/stores/payment'
import usePaymentReceiptStore from '@/stores/paymentReceipt'
import useClaimStore from '@/stores/claim'
import useCartDetailStore from '@/stores/cart-details'
import useClinicStore from '@/stores/clinics'
import useCustomerStore from '@/stores/customers'

// Components
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import MtFormDecimalNumber from '@/components/form/MtFormDecimalNumber.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'

import aahMessages from '@/utils/aahMessages'
import AmountLossUnitModal from '@/pages/cart/AmountLossUnitModal.vue'

// Lazy-loaded Components
const UpdatePaymentModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdatePaymentModal.vue')
)
const UpdateRefundModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdateRefundModal.vue')
)
const UpdatePaymentReceiptModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdatePaymentReceiptModal.vue')
)
const UpdatePetInsuranceInfoModal = defineAsyncComponent(
  () => import('@/pages/insurance/UpdatePetInsuranceInfoModal.vue')
)
const SendBillPdfModal = defineAsyncComponent(
  () => import('@/pages/cart/SendBillPdfModal.vue')
)
const GetPdfInvoice = defineAsyncComponent(() => import('./GetPdfInvoice.vue'))
const UpdateInfoListModal = defineAsyncComponent(
  () => import('@/pages/info/UpdateInfoListModal.vue')
)
const UpdatePaymentUpfrontModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdatePaymentUpfrontModal.vue')
)
const CDInstallmentModal = defineAsyncComponent(
  () => import('@/pages/cart/CDInstallmentModal.vue')
)
const ViewInvoice = defineAsyncComponent(
  () => import('@/pages/cart/ViewInvoice.vue')
)

// Store References
const cartStore = useCartStore()
const paymentStore = usePaymentStore()
const paymentReceiptStore = usePaymentReceiptStore()
const customerStore = useCustomerStore()
const claimStore = useClaimStore()

const {
  getCart,
  getCustomerCartBalance,
  getLatestCartBalanceRecord,
  getFlgAddCartBalance
} = storeToRefs(cartStore)
const { getPayments } = storeToRefs(paymentStore)
const { getCustomer } = storeToRefs(customerStore)

// Reactive Variables
const invoicePdfAttributes = reactive({
  render: false
})

const router = useRouter()
const props = defineProps({
  data: Object,
  scrollAreaHeight: Object,
  fromPage: String
})

const data = ref({})

const paymentBasePayload = ref({
  type_payment_category: 1,
  datetime_bill: null,
  type_payment_method: 1,
  type_cc_brand: 0,
  number_cc_last_four_digits: '',
  flg_refund_occurred: false,
  flg_loss: false,
  flg_payment_advance: false,
  memo_payment: '',
  amount_payment: 0,
  datetime_payment: getDateTimeNow(),
  type_payment_status: 1,
  date_payment_plan: null,
  id_cart: null,
  id_customer: getCustomer.value.id_customer,
  flg_temp_cash: false,
  flg_upfront: false,
  amount_upfront_received: 0,
  id_clinic: getCart.value.id_clinic
})

const initialCartBalanceLastTime = ref(0)
const invoicePdf = ref(null)

const isPetMultiple: any = ref(false)
const useCloseWithOutConfirmation: any = ref(false)
const showDiscount = ref(false)

const computedDisabled = computed(() => {
  return !Math.abs(Number(getCustomerCartBalance.value)) > 0
})

const computedBill = computed(() => {
  return formattedPrice(getCart.value?.bill - getAmountLoss(), true) ?? 0
})

const computedTotalSalesAmountIntax = computed(() => {
  return (
    formattedPrice(
      getCart.value?.total_sales_amount_intax - getAmountLoss(),
      true
    ) ?? 0
  )
})

const getAmountLoss = () => {
  let amount_loss = 0
  if (!getPayments.value.payment_list) return 0

  getPayments.value.payment_list.forEach((payment: any) => {
    if (payment.flg_loss) {
      amount_loss += Number(payment.amount_loss)
    }
  })
  return amount_loss
}

const openUpdatePetInsuranceInfoModal = async (
  status: any,
  finalCheck: any = false
) => {
  const id_pet =
    props.data.cart_details && props.data.cart_details.length > 0
      ? props.data.cart_details.filter(
          (detail: any) => detail?.id_pet != null
        )[0].id_pet.id_pet
      : null

  await mtUtils.mediumPopupWithPresistance(UpdatePetInsuranceInfoModal, {
    data: props.data,
    id_pet: id_pet,
    typeApplicationStatus: status,
    finalCheck: finalCheck,
    finalCallBack: () => {
      useCloseWithOutConfirmation.value = true
    }
  })
}

const openUpdatePaymentModal = async (refundMode: Boolean) => {
  if (isDecimal()) {
    const decimalConfirmation = await mtUtils.confirm(
      '1円以下の端数処理が必要な会計です。',
      '注意',
      '端数の処理'
    )
    if (!decimalConfirmation) return

    if (decimalConfirmation) {
      await removeDecimalCart()
    }
  }

  if (getCart.value.flg_completed) {
    await mtUtils.autoCloseAlert('完了会計に入金は追加できません。')
    return
  }

  let remainingRefundAmount = amountRemaining.value

  if (refundMode) {
    if (!getCart.value.flg_refund) {
      await mtUtils.autoCloseAlert('返金会計を作成してください。')
      return
    }

    remainingRefundAmount = 0
    getPayments.value.payment_list.forEach((payment) => {
      if (payment.flg_refund_occurred) {
        remainingRefundAmount += Math.abs(Number(payment.amount_payment))
      }
    })

    remainingRefundAmount = amountRemaining.value + remainingRefundAmount
  }
  await mtUtils.mediumPopup(UpdateRefundModal, {
    fromPage: props.fromPage,
    pageTitle: props.fromPage,
    data: props.data,
    cartData: props.data,
    isRefunded: refundMode,
    amountRemaining: remainingRefundAmount
  })
  return
}

const openUpdatePaymentModalEditedMode = async (
  payment: any,
  refunded: any = false
) => {
  if (refunded) {
    if (!getCart.value.flg_refund) {
      const confirmation = await mtUtils.confirm(
        'この入金を前受金として登録しますか？',
        '注意',
        'OK'
      )

      if (!confirmation) {
        return
      }

      if (confirmation) {
        const response = await mtUtils.callApi(
          selectOptions.reqMethod.POST,
          `change-payment-status/${payment.id_payment}`
        )

        if (!response) {
          await mtUtils.autoCloseAlert('Error')
          return
        }

        if (response) {
          await mtUtils.promiseAllWithLoader([
            usePaymentStore().fetchPaymentByCustomer({
              id_cart: props.data?.id_cart,
              flg_upfront_ui: true,
              id_customer: props.data.id_customer,
              flg_refund_occurred: true
            })
          ])
          return
        }
      }
    }
  }

  await mtUtils.mediumPopup(UpdatePaymentModal, {
    fromPage: props.fromPage,
    pageTitle: props.fromPage,
    data: payment,
    cartData: getCart.value,
    isRefunded: payment.flg_refund_occurred,
    amountRemaining: amountRemaining.value
  })
}

const updateUpFrontPayment = async (payment: any) => {
  await mtUtils.mediumPopup(UpdatePaymentUpfrontModal, {
    data: payment,
    cartData: props.data,
    isRefunded: payment.flg_refund,
    amountRemaining: amountRemaining.value
  })
  await mtUtils.promiseAllWithLoader([
    usePaymentStore().fetchPaymentByCustomer({
      id_cart: props.data?.id_cart,
      flg_upfront_ui: true,
      id_customer: props.data.id_customer,
      flg_refund_occurred: true
    })
  ])
}

async function updatePaymentFlgConducted(payment: any) {
  if (!getCart.value.flg_refund) {
    await mtUtils.autoCloseAlert(
      '返金を行うには返金会計を作成する必要があります。'
    )
    return
  }

  const now = dayjs()
  const roundedTime = roundToNearestQuarterHour(now as Dayjs)

  const datetime_bill_date = dateFormat(getDateToday(), 'YYYY-MM-DD')
  const datetime_bill_time = roundedTime.format('HH:mm')

  const payload = {
    id_payment: payment.id_payment,
    flg_refund_conducted: true,
    id_cart_processed: getCart.value.id_cart,
    datetime_refund_conducted:
      datetime_bill_date + ' ' + datetime_bill_time + ':00'
  }

  let alreadyConductedAmount = 0

  getPayments.value.refund_conducted_list.map((refund: any) => {
    if (refund.id_cart_processed == getCart.value.id_cart) {
      alreadyConductedAmount += Number(refund.amount_refund)
    }
  })

  if (
    alreadyConductedAmount +
      Number(payment.amount_refund) +
      Number(getCart.value.bill) >
    0
  ) {
    await mtUtils.alert(
      `返金額が合計金額を超えています。\n返金額を確認してください。`,
      '確認'
    )
    return
  }

  await usePaymentStore().updatePayment(payload)

  await mtUtils.promiseAllWithLoader([
    usePaymentStore().fetchPaymentByCustomer({
      id_cart: props.data?.id_cart,
      flg_upfront_ui: true,
      id_customer: props.data.id_customer,
      flg_refund_occurred: true,
      flg_refund_conducted: true
    })
  ])
}

function calculateRemainingUpFront(payment: any) {
  let process_payment = payment.amount_upfront_received

  if (
    payment &&
    payment.payment_upfront_list &&
    payment.payment_upfront_list.length > 0
  ) {
    process_payment = payment.payment_upfront_list.reduce(
      (acc: any, curr: any) => acc - curr.amount_payment,
      payment.amount_upfront_received
    )
  }
  return roundFloat(Math.abs(process_payment))
}

const openPaymentReceiptModalOnPayment = async (payment: any) => {
  await paymentReceiptStore.fetchPaymentReceipts({
    id_payment: payment.id_payment
  })

  if (paymentReceiptStore.getPaymentReceipts?.length > 0) {
    const receipt = paymentReceiptStore.getPaymentReceipts[0]
    await mtUtils.mediumPopup(UpdatePaymentReceiptModal, {
      pageTitle: props.fromPage,
      fromPage: props.fromPage,
      data: receipt
    })
  } else {
    const dataTosend = {
      id_payment: payment.id_payment,
      id_clinic: props.data.id_clinic,
      number_cart: props.data.number_cart,
      id_pet: props.data.id_pet,
      id_customer_name: props.data.name_customer,
      amount_receipt: payment.amount_payment,
      id_customer: props.data.id_customer,
      paymentObj: { ...payment }
    }

    await mtUtils.mediumPopup(UpdatePaymentReceiptModal, {
      fromPage: props.fromPage,
      onIdPaymentClickData: dataTosend
    })
  }
}

const openSearchPaymentList = () => {
  localStorage.setItem(
    'paymentSearchData',
    JSON.stringify({
      id_customer: props.data.id_customer
    })
  )
  const routeData = router.resolve({ name: 'SearchPaymentList' })
  window.open(routeData.href, '_blank')
}

const createBill = async () => {
  if (isDecimal()) {
    const decimalConfirmation = await mtUtils.confirm(
      '1円以下の端数処理が必要な会計です。',
      '注意',
      '端数の処理'
    )
    if (!decimalConfirmation) return

    if (decimalConfirmation) {
      await removeDecimalCart()
    }
  }

  const GETPDF: Number = 1,
    PRINT: Number = 2,
    PPS: Number = 3,
    VIEW_INVOICE: Number = 4
  let popup: any = {
    attr: {
      isConfirmed: false
    },
    modelValue: null,
    showDiscount: false
  }
  await mtUtils.smallPopup(SendBillPdfModal, { popup })
  if (popup.attr.isConfirmed) {
    if (popup.modelValue === GETPDF) {
      await mtUtils.pdfRender(GetPdfInvoice, {
        data: {
          ...props.data,
          flg_billed: true,
          datetime_billed: getDateTimeNow()
        },
        flgDownloadPdf: true,
        flg_display_cart_detail_discount: popup.showDiscount
      })
    } else if (popup.modelValue === PRINT) {
      props.data.flg_billed = true
      props.data.datetime_billed = getDateTimeNow()
      invoicePdfAttributes.render = true
      showDiscount.value = popup.showDiscount
    } else if (popup.modelValue === PPS) {
      await mtUtils.pdfRender(GetPdfInvoice, {
        data: {
          ...props.data,
          flg_billed: true,
          datetime_billed: getDateTimeNow()
        },
        callback: updateInfoListModalWithPdf,
        flg_display_cart_detail_discount: popup.showDiscount
      })
    } else if (popup.modelValue === VIEW_INVOICE) {
      await mtUtils.popup(ViewInvoice, {
        data: {
          ...props.data,
          flg_billed: true,
          datetime_billed: getDateTimeNow()
        },
        flg_display_cart_detail_discount: popup.showDiscount
      })
    }
  }
}

const updateInfoListModalWithPdf = (pdf_blob: Blob, pdfFileName: string) => {
  const name_customer = getCustomer.value.name_customer_display
  const clinic = JSON.parse(localStorage.getItem('clinic'))?.label
  const messageContent = `${name_customer} ${clinic} `
  mtUtils.mediumPopup(UpdateInfoListModal, {
    predefinedFile: pdf_blob,
    predefinedMessage: messageContent,
    customerObj: getCustomer.value,
    fromCart: true,
    lineMessageType: 'billing',
    pdfFileName
  })
}

const updateTotalAdjustmentIntax = () => {
  let numericValue = Number(props.data?.total_adjustment_intax)
  // Ensure the value is numeric
  if (isNaN(numericValue)) return

  // Adjust the sign based on type_price_adjustment
  if (props.data?.type_price_adjustment == '1') {
    // Force the value to be negative
    props.data.total_adjustment_intax = -Math.abs(numericValue)
  } else if (props.data?.type_price_adjustment == '2') {
    // Force the value to be positive
    props.data.total_adjustment_intax = Math.abs(numericValue)
  } else {
    // No adjustment if type_price_adjustment is neither 1 nor 2
    props.data.total_adjustment_intax = null
  }
}

const getCartBillingData = () => {
  return {
    ch_disc_rate: props.data?.ch_disc_rate,
    type_ch_disc: props.data?.type_ch_disc,
    ch_disc_rate1: props.data?.ch_disc_rate1,
    cart_payment_this_time: props.data?.cart_payment_this_time,
    type_price_adjustment: props.data?.type_price_adjustment,
    total_adjustment_intax: props.data?.total_adjustment_intax,
    date_ins_type2: props.data?.date_ins_type2,
    days_ins_type2: props.data?.days_ins_type2,
    date_ins_type3_start: props.data?.date_ins_type3_start,
    date_ins_type3_end: props.data?.date_ins_type3_end,
    days_ins_type3: props.data?.days_ins_type3,
    date_ins_type4: props.data?.date_ins_type4,
    total_ins_type4: props.data?.total_ins_type4
  }
}

const shouldSplitCart = () => {
  const cartDetails = getCart.value?.cart_details // Assuming getCart.value is your cart data

  let insuredPets = new Set()
  let uninsuredPets = new Set()

  for (let detail of cartDetails) {
    const petId = detail.id_pet?.id_pet
    const hasInsurance = detail.flg_pet_insurance
    if (petId) {
      if (hasInsurance) {
        insuredPets.add(petId)
        uninsuredPets.delete(petId) // Remove from uninsured if previously added
      } else {
        // Add to uninsured only if not already marked as insured
        if (!insuredPets.has(petId)) {
          uninsuredPets.add(petId)
        }
      }
    }
  }
  // Check conditions
  if (insuredPets.size > 1) {
    // More than one insured pet
    return true
  } else if (insuredPets.size === 1 && uninsuredPets.size >= 1) {
    // One insured pet and one or more uninsured pets
    return true
  } else {
    // Single pet (insured or uninsured) or multiple uninsured pets
    return false
  }
}

const handleCartSplitting = async (
  formattedData: any = null,
  flg: any = false
) => {
  const confirmation = await mtUtils.confirm(
    '会計を分割しますか？',
    '会計の分割',
    '分割',
    undefined,
    '保険適用のサービス又は商品があるため、会計を分割しないと再計算できません'
  )
  if (confirmation) {
    await cartStore.splitCartForBilling(getCart.value?.id_cart)
    // openMergeSplitModal()
  } else {
    if (formattedData) {
      formattedData = formattedData.map((item: any) => ({
        id_cart_detail: item.id_cart_detail,
        flg_pet_insurance: false,
        id_cart: item.id_cart,
        type_insurance_purpose: 1
      }))
      await useCartDetailStore().bulkUpdateFlgPetInsurance(formattedData)
    }
  }
}

const refreshDome = ref(true)

const updateCartAndBilling = async (
  alertMessage,
  formattedData: any = null,
  flag: any = false,
  isAutoAdjustment: any = false
) => {
  if (getCart.value.flg_completed) {
    return
  }

  if (shouldSplitCart()) {
    await handleCartSplitting(formattedData, flag)
  }
  let cartBillingData = getCartBillingData()

  if (cartBillingData.type_ch_disc == '1') {
    if (cartBillingData.ch_disc_rate >= 100) {
      await mtUtils.alert(
        '割引（％）限度を超えています。確認して下さい。',
        'エラー'
      )
      return
    }
  }

  if (cartBillingData.type_ch_disc == '2') {
    if (cartBillingData.ch_disc_rate1 >= getCart.value.bill) {
      await mtUtils.alert(
        `割引額には請求金額より小さな金額を入力してください： (${getCart.value.bill})`,
        'Error: CT001b'
      )
      return
    }
  }

  if (isAutoAdjustment) {
    if (useClinicStore().getClinic.type_cart_round_unit) {
      const unit = typeCartRoundUnit.find(
        (item) => item.value == useClinicStore().getClinic.type_cart_round_unit
      ).unit
      if (
        unit ==
        getAdjustmentAmount(
          cartBillingData.type_price_adjustment,
          unit,
          getCart.value?.bill
        )
      ) {
        await mtUtils.autoCloseAlert('診療明細の端数は処理済です')
        return
      }
      cartBillingData.total_adjustment_intax = getAdjustmentAmount(
        cartBillingData.type_price_adjustment,
        unit,
        getCart.value?.bill
      )
    }
  }

  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
  ])
  refreshDome.value = false
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
  refreshDome.value = true
  // data.value = JSON.parse(JSON.stringify(getCart.value))
  mtUtils.autoCloseAlert(alertMessage)
}

const getAdjustmentAmount = (
  typeRound: any = 1,
  unit: any = 0,
  billing: any
) => {
  if (typeRound == 1) return billing % unit

  return unit - (billing % unit)
}
const calculateBillingAmount = async (
  formattedData: any = null,
  flag: any = false
) => {
  if (getCart.value.flg_completed) {
    await mtUtils.autoCloseAlert(
      '完了済の会計です。\nメニューの「会計修正」から実行してください。'
    )
    return
  }

  try {
    await updateCartAndBilling('請求金額を更新しました', formattedData, flag)
  } catch (error) {
    console.error(error)
    // Handle error
  }
}

event_bus.on('callUpdateBillingAPI', async (value) => {
  refreshDome.value = value
})

const effectiveBalance = computed(() => {
  if (
    getCart.value?.id_cart_balance ==
    getLatestCartBalanceRecord.value?.id_cart_balance
  )
    return getCustomerCartBalance.value
  return amountRemaining.value - getCustomerCartBalance.value ?? 0
})

const getEquation = computed(() => {
  return `${getCart.value.bill} + ${
    getCart.value.cart_details.find(
      (cd) => cd.flg_group_title && cd.group_detail['cb_installment']
    )?.group_detail['amount_installment'] || 0
  }`
})

const amountRemaining = computed(() => {
  let totalPaid = 0

  let cartBalance = 0
  getPayments.value.payment_list?.forEach((payment) => {
    if (!payment.flg_refund_occurred && !payment.flg_loss) {
      totalPaid += Number(payment.amount_payment)
    }
  })

  if (getCart.value && getCart.value.flg_insure_request && false) {
    useCartStore().setFlgAddCartBalance(false)
  }

  if (
    getLatestCartBalanceRecord.value &&
    getLatestCartBalanceRecord.value.id_cart_balance ==
      getCart.value.id_cart_balance
  ) {
    cartBalance = getCart.value.flg_completed
      ? Number(getLatestCartBalanceRecord.value.bal_updated)
      : Math.abs(Number(getCustomerCartBalance.value))
  }

  if (cartStore.getFlgAddCartBalance) {
    const amountInstallment =
      getCart.value.cart_details.find(
        (detail) =>
          detail.flg_group_title && detail.group_detail?.cb_installment
      )?.group_detail?.amount_installment || cartBalance

    return (
      props.data.bill - getAmountLoss() + Number(amountInstallment) - totalPaid
    )
  }

  return props.data.bill - getAmountLoss() - totalPaid
})

const totalPayment = computed(() => {
  let totalCash = 0
  let totalCredit = 0
  let totalOther = 0

  getPayments.value?.payment_list.forEach((payment: any) => {
    if (payment.flg_upfront_used == 1) return

    if (payment.type_payment_status != 1) return

    if (payment.type_payment_method == 1) {
      totalCash += Number(payment.amount_payment)
    }
    if (payment.type_payment_method == 2) {
      totalCredit += Number(payment.amount_payment)
    }
    if (payment.type_payment_method != 1 && payment.type_payment_method != 2) {
      totalOther += Number(payment.amount_payment)
    }
  })
  return { cash: totalCash, credit: totalCredit, other: totalOther }
})

const UiDisable = computed(() => {
  if (cartStore.getFlgAllowCartUpdate) {
    return false
  }
  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

const calculatedDiscount = ref(null)

const discountDisable = computed(() => {
  let isDisable = false
  calculatedDiscount.value = 0
  if (getCart.value && Number(getCart.value.total_cd_disc) > 0) {
    isDisable = true
    getCart.value.cart_details.forEach((detail) => {
      if (detail.sales_ratio && Number(detail.sales_ratio) == 100) {
        isDisable = false
      }
    })
  }
  processSelectRadio()
  let total_amount =
    Number(getCart.value.total_modified_sales_amount_notax) +
    Number(getCart.value.total_cd_disc)
  calculatedDiscount.value =
    ((total_amount - Number(getCart.value.total_modified_sales_amount_notax)) /
      total_amount) *
    100
  calculatedDiscount.value = calculatedDiscount.value.toFixed(2)

  return isDisable
})

async function removeInsurance() {
  await cartStore.updateCartInsurance(getCart.value.id_cart, {
    id_pet_insurance: null,
    flg_insure_request: false
  })
  await calculateBillingAmount()
}

async function checkLossPayment() {
  let payload = JSON.parse(JSON.stringify(paymentBasePayload.value))

  payload.id_cart = getCart.value.id_cart

  let amountLoss = 0

  getCart.value.cart_details.forEach((detail) => {
    if (detail && detail.group_detail && detail.group_detail['loss_amount']) {
      amountLoss += Number(detail.group_detail['loss_amount'])
    }
  })

  if (
    getPayments.value.payment_list &&
    getPayments.value.payment_list.length > 0
  ) {
    const decimalLoss = getPayments.value.payment_list.find(
      (py) => py.flg_loss_decimal
    )

    if (decimalLoss) {
      return
    }
  }

  if (amountLoss > 0) {
    payload.flg_loss_decimal = true

    payload.amount_loss = amountLoss.toFixed(8)
    payload.type_payment_category = null
    payload.type_payment_method = null
    payload.type_payment_status = null

    await paymentStore.submitPayment(payload as any).then(async (response) => {
      await usePaymentStore().fetchPaymentByCustomer({
        id_cart: getCart.value.id_cart,
        flg_upfront_ui: true,
        id_customer: getCart.value.id_customer,
        flg_refund_occurred: true,
        flg_refund_conducted: true
      })
    })
  }
}

async function checkAndProcessUpFrontPayment() {
  let flg_front_used = false

  getPayments.value.payment_list.forEach((payment) => {
    if (payment.flg_upfront_used) {
      flg_front_used = true
    }
  })
}

const removeDecimalCart = async () => {
  let cartBillingData = {
    special_case: true,
    ch_disc_rate: getCart.value.ch_disc_rate,
    cart_payment_this_time: getCart.value.cart_payment_this_time,
    type_price_adjustment: getCart.value.type_price_adjustment,
    total_adjustment_intax: getCart.value.total_adjustment_intax,
    date_ins_type2: getCart.value.date_ins_type2,
    days_ins_type2: getCart.value.days_ins_type2,
    date_ins_type3_start: getCart.value.date_ins_type3_start,
    date_ins_type3_end: getCart.value.date_ins_type3_end,
    days_ins_type3: getCart.value.days_ins_type3,
    date_ins_type4: getCart.value.date_ins_type4,
    total_ins_type4: getCart.value.total_ins_type4
  }

  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
  ])

  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
}

const isDecimal = () => {
  let isDecimal = false
  if (
    getCart.value &&
    getCart.value.cart_details &&
    getCart.value.cart_details.length > 0
  ) {
    getCart.value.cart_details.forEach((cd: any) => {
      if (cd && cd.amount_sales) {
        if (Number(cd.amount_sales) - parseInt(Number(cd.amount_sales)) > 0) {
          isDecimal = true
        }
      }
    })
  }
  return isDecimal
}

const updateDateCartForRefund = () => {
  cartStore
    .updateCart(getCart.value.id_cart, { date_cart: data.value.date_cart })
    .then(() => {
      console.log('会計日を更新しました')
      // Optionally, you can handle success actions here, such as updating the UI or notifying the user.
    })
    .catch((error) => {
      console.error('会計日の更新に失敗しました', error)
      // Optionally, you can handle the error here, such as displaying an error message to the user.
    })
}

const deletePayment = async (id: number) => {
  await mtUtils
    .confirm(aahMessages.delete_ask, aahMessages.delete)
    .then(async (confirmation) => {
      if (confirmation) {
        if (getCart.value.flg_completed) {
          await mtUtils.autoCloseAlert(
            '会計は完了しているため、削除できません。'
          )
        } else {
          paymentStore.deletePayment(id).then(async () => {
            mtUtils.autoCloseAlert(aahMessages.success)
            await mtUtils.promiseAllWithLoader([
              usePaymentStore().fetchPaymentByCustomer({
                id_cart: props.data?.id_cart,
                flg_upfront_ui: true,
                id_customer: props.data.id_customer,
                flg_refund_occurred: true,
                flg_refund_conducted: true
              })
            ])
          })
        }
      }
    })
}

async function completeCart() {
  let totalPayment = 0

  if (
    getPayments.value &&
    getPayments.value.refund_conducted_list &&
    getPayments.value.refund_conducted_list.length > 0
  ) {
    getPayments.value.refund_conducted_list.forEach((payment) => {
      totalPayment += parseInt(Math.abs(payment.amount_refund))
    })
  }

  if (
    getPayments.value &&
    getPayments.value.refund_occurred_list &&
    getPayments.value.refund_occurred_list.length > 0
  ) {
    getPayments.value.refund_occurred_list.forEach((payment) => {
      totalPayment += parseInt(Math.abs(payment.amount_refund))
    })
  }

  if (Math.abs(Number(totalPayment)) > Math.abs(Number(getCart.value.bill))) {
    await mtUtils.alert(
      '返金額が合計金額を超えています。\n返金額を確認してください。',
      '確認'
    )
    return
  }
  if (isDecimal()) {
    const decimalConfirmation = await mtUtils.confirm(
      '1円以下の端数処理が必要な会計です。',
      '注意',
      '端数の処理'
    )
    if (!decimalConfirmation) return
    if (decimalConfirmation) {
      await removeDecimalCart()
    }
  }
  cartStore
    .updateCart(getCart.value.id_cart, { flg_completed: true })
    .then(async () => {
      // await cartStore.createCartBalance(getCart.value.id_cart)
      await mtUtils.promiseAllWithLoader([
        cartStore.fetchLatestCartBalanceOfCustomer(props.data.id_customer),
        cartStore.fetchCart(getCart.value.id_cart)
      ])
    })
}

function areAllElementsSame(array) {
  return array.every((element) => element === array[0])
}

async function updateUpfrontPayment() {
  let payload = JSON.parse(JSON.stringify(paymentBasePayload.value))
  let totalAmountPayment = 0
  payload.id_cart = getCart.value.id_cart

  // merge payments
  let payment_list = []

  // other payment type
  let otherPaymentMethod = false

  // upfront payment old cart detail
  // id_cart_old = Will be old Cart ID
  // id_cart_processed will be new Cart ID

  let id_cart_old = null
  let id_payment_ref = null

  let paymentMethodList = []

  getPayments.value.payment_list.map((py) => {
    if (py.type_payment_category == 1) {
      totalAmountPayment += Number(py.amount_payment)
      payment_list.push(py.id_payment)

      if (py.flg_upfront_used) {
        id_cart_old = py.id_cart
        id_payment_ref = py.id_payment
      }
    }

    if (py.type_payment_method != 1) {
      otherPaymentMethod = true
    }
    paymentMethodList.push(py.type_payment_method)
  })

  if (
    otherPaymentMethod &&
    paymentMethodList.length > 0 &&
    !areAllElementsSame(paymentMethodList)
  ) {
    await mtUtils.alert(
      '支払い済の入金、または同じ支払い方法の入金からしか処理を実行できません。\n入金内容を確認してください。'
    )
    return
  }

  const processedPaymentAmount = totalAmountPayment + amountRemaining.value
  const newPaymentAmount = Math.abs(amountRemaining.value)

  const upfrontPaymentPayload = {
    ...payload,
    flg_upfront: true,
    amount_upfront_received: newPaymentAmount,
    id_cart: id_cart_old ? id_cart_old : getCart.value.id_cart,
    id_cart_processed: null,
    id_payment_ref: id_payment_ref
  }

  const updatedPayment = {
    ...payload,
    amount_payment: processedPaymentAmount,
    id_cart_processed: id_cart_old ? getCart.value.id_cart : null,
    id_cart: id_cart_old ? id_cart_old : getCart.value.id_cart,
    flg_upfront_used: !!id_cart_old
  }

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `merge-payment-upfront`,
    {
      payment_list: payment_list,
      payment: updatedPayment,
      upfront_payment: upfrontPaymentPayload
    }
  )

  if (response && response.code == 400) {
    await mtUtils.alert(response.message, 'Error')
  }
}

async function createLossPayment() {
  let unit = 0
  await mtUtils.littlePopup(AmountLossUnitModal, {
    callBack: (lossUnit) => (unit = lossUnit)
  })

  if (unit === 0) return

  let payload = JSON.parse(JSON.stringify(paymentBasePayload.value))

  payload.flg_loss = true
  payload.amount_loss = (getCart.value?.bill - getAmountLoss()) % unit

  payload.id_cart = getCart.value.id_cart

  if (!payload.amount_loss) return

  paymentStore.submitPayment(payload as any).then(async (resp) => {
    if (resp.data.code == 200) {
      mtUtils.autoCloseAlert(aahMessages.success)
      await paymentStore.fetchPaymentByCustomer({
        id_cart: getCart.value.id_cart,
        flg_upfront_ui: true,
        id_customer: getCart.value.id_customer,
        flg_refund_occurred: true,
        flg_refund_conducted: true
      })
    } else {
      mtUtils.autoCloseAlert(aahMessages.failed)
    }
  })
}

async function updRefundPayment() {
  let payload = JSON.parse(JSON.stringify(paymentBasePayload.value))
  let totalAmountPayment = 0
  payload.id_cart = getCart.value.id_cart

  // merge payments
  let payment_list = []

  // other payment type
  let otherPaymentMethod = false

  getPayments.value.payment_list.map((py) => {
    if (py.type_payment_category == 1) {
      totalAmountPayment += Number(py.amount_payment)
      payment_list.push(py.id_payment)
    }

    if (py.type_payment_category != 1) {
      otherPaymentMethod = true
    }

    if (py.type_payment_method != 1) {
      otherPaymentMethod = true
    }
  })

  if (otherPaymentMethod) {
    await mtUtils.alert(
      '支払い済の入金、または同じ支払い方法の入金からしか処理を実行できません。\n入金内容を確認してください。'
    )
    return
  }

  const processedPaymentAmount = totalAmountPayment + amountRemaining.value
  const newPaymentAmount = Math.abs(amountRemaining.value)

  const refundPaymentPayload = {
    ...payload,
    amount_refund: newPaymentAmount,
    flg_refund_occurred: true
  }

  const updatedPayment = {
    ...payload,
    amount_payment: processedPaymentAmount
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `merge-payment-refund`,
    {
      payment_list: payment_list,
      payment: updatedPayment,
      refund_payment: refundPaymentPayload
    }
  )

  if (response && response.code == 400) {
    await mtUtils.alert(response.message, 'Error')
  }
}

async function createInsuranceClaim() {
  let isClaimPrepared = false
  const response: any = await useClaimStore()?.fetchClaimByCart(
    props.data.id_cart
  )

  if (response && response.length === 0) {
    await mtUtils.alert('Error-INS03：保険の承認番号が不正です。')
    return
  }

  if (response && response.length > 0) {
    const claim = response[0]
    if (claim.id_claim && claim.type_status_application == 1) {
      await mtUtils.alert(
        'この会計は保険請求の対象です。\n請求内容に間違いがないかを確認してください。\n確認後に終了しましょう。',
        '保険内容の確認'
      )
      await openUpdatePetInsuranceInfoModal(11)
    }
    if (claim.id_claim && claim.type_status_application == 11) {
      const response = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `claim/applyClaim`,
        {
          ...claim,
          id_cm_insurer: claim?.pet_insurance.id_cm_insurer,
          id_clinic: JSON.parse(localStorage.getItem('clinic')).value,
          medical_list: claim.claim_detail_list
        }
      )
      if (response && response.code == 200) {
        await mtUtils.autoCloseAlert(
          response.message,
          '請求送信が完了しました。'
        )
      }

      if (response && response.code == 500) {
        await mtUtils.alert(
          response.message.replace(/\s*\n\s*/g, '\n').trim(),
          'エラー'
        )
      }
    }

    if (claim.id_claim && claim.type_status_application == 20) {
      await mtUtils.autoCloseAlert('保険請求済みの会計です。')
    }
  }
}

function processSelectRadio() {
  props.data.ch_disc_rate = null
  props.data.ch_disc_rate1 = null
}

const isNegative = (val: any) => Number(val) < 0

async function createInstallment() {
  if (Math.abs(Number(getCustomerCartBalance.value)) <= 0) {
    return
  }

  if (
    getCart.value.cart_details &&
    getCart.value.cart_details.length > 0 &&
    getCart.value.cart_details.find(
      (v) => v.flg_group_title && v.group_detail['cb_installment']
    )
  ) {
    await mtUtils.alert('未収金は「その他」明細に追加済です。')
    return
  }

  await mtUtils.smallPopup(CDInstallmentModal, {
    previousCB: Math.abs(getCustomerCartBalance.value).toFixed(0)
  })

  await cartStore.fetchCart(getCart.value.id_cart)
}

const comparePaymentWithRefundAmount = computed(() => {
  const totalWithTax = parseInt(Number(getCart.value.bill))

  let totalPayment: number = 0

  if (
    getPayments.value &&
    getPayments.value.refund_conducted_list &&
    getPayments.value.refund_conducted_list.length > 0
  ) {
    getPayments.value.refund_conducted_list.forEach((payment) => {
      totalPayment += parseInt(Math.abs(payment.amount_refund))
    })
  }

  if (
    getPayments.value &&
    getPayments.value.refund_occurred_list &&
    getPayments.value.refund_occurred_list.length > 0
  ) {
    getPayments.value.refund_occurred_list.forEach((payment) => {
      totalPayment += parseInt(Math.abs(payment.amount_refund))
    })
  }

  return totalWithTax === -totalPayment
})

const flgPaymentConducted = computed(() => {
  return (
    getCart.value?.flg_refund &&
    comparePaymentWithRefundAmount.value &&
    getPayments.value?.refund_occurred_list.length === 0
  )
})

onMounted(async () => {
  data.value.date_cart = getCart.value.date_cart
  processSelectRadio()
  await mtUtils.promiseAllWithLoader([
    usePaymentStore().fetchPaymentByCustomer({
      id_cart: props.data?.id_cart,
      flg_upfront_ui: true,
      id_customer: props.data.id_customer,
      flg_refund_occurred: true,
      flg_refund_conducted: true
    }),
    cartStore.fetchLatestCartBalanceOfCustomer(props.data.id_customer),
    claimStore.fetchClaimByCart(props.data.id_cart)
  ])

  initialCartBalanceLastTime.value = props.data?.cart_balance_last_time

  if (getCart.value && getCart.value.id_pet) {
    isPetMultiple.value = true
  }
})

onUnmounted(() => {
  event_bus.off('callUpdateBillingAPI')
})
</script>

<template>
  <div
    v-if="refreshDome"
    :style="props.scrollAreaHeight"
    class="q-pl-sm scrolledRight text-grey-900"
  >
    <!-- 個別または全体の割引合計 / Discount part-->
    <div
      class="row q-col-gutter-md q-mb-sm q-pr-md"
      v-if="!getCart?.flg_refund"
    >
      <div class="col-auto q-mr-sm">
        <div>全体割引/値引</div>
      </div>
      <div v-if="true" class="col-lg-4 col-md-4 col-sm-auto">
        <MtFormDecimalNumber
          v-if="props.data.type_ch_disc in [2, '2']"
          v-model="props.data.ch_disc_rate"
          :min="0"
          :rules="[aahValidations.validationNonNegativeNumber]"
          input-class="text-center"
          label="割引率（％）"
          outlined
        />
        <MtFormDecimalNumber
          v-else
          :min="0"
          v-model="props.data.ch_disc_rate1"
          label="値引額"
          input-class="text-center"
          outlined
          :rules="[aahValidations.validationNonNegativeNumber]"
        />
      </div>
      <div v-if="false" class="col-lg-4 col-md-4 col-sm-auto">
        <MtFormDecimalNumber
          v-if="props.data.type_ch_disc in [2, '2']"
          v-model="calculatedDiscount"
          :disable="discountDisable"
          :min="0"
          :rules="[aahValidations.validationNonNegativeNumber]"
          input-class="text-center"
          label="割引率（％）"
          outlined
        />
      </div>
      <q-space />
      <div>
        <MtFormRadiobtn
          v-model:selected="props.data.type_ch_disc"
          label="割引（%）"
          val="1"
          @update:selected="processSelectRadio"
        />
        <MtFormRadiobtn
          v-model:selected="props.data.type_ch_disc"
          label="値引"
          val="2"
          @update:selected="processSelectRadio"
        />
      </div>
    </div>
    <!-- ---- -->
    <div class="row q-col-gutter-md q-mb-sm q-pr-md">
      <div class="col-lg-3 col-md-3 col-sm-6">
        <span class="">小計</span>
      </div>
      <q-space />
      <div class="col-auto text-right">
        <div class="title2 regular text-black">
          <span class="q-mr-xs">¥</span>
          <span
            :class="
              isNegative(props.data.total_modified_sales_amount_notax)
                ? 'text-negative'
                : ''
            "
          >
            {{
              formattedPrice(
                Number(props.data.total_modified_sales_amount_notax) +
                  Number(props.data.total_cd_disc)
              ) ?? 0
            }}
          </span>
        </div>
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-sm q-pr-md">
      <div class="col-lg-3 col-md-3 col-sm-6">
        <div class="">全体割引計</div>
      </div>
      <q-space />
      <div class="col-auto text-right">
        <div class="title2 regular text-black">
          <span class="q-mr-xs">¥</span
          ><span
            :class="isNegative(props.data.total_cd_disc) ? 'text-negative' : ''"
            >{{ formattedPrice(props.data.total_cd_disc) }}</span
          >
        </div>
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-sm q-pr-md">
      <div class="col-lg-3 col-md-3 col-sm-6">
        <div>小計 (全体割引後)</div>
      </div>
      <q-space />
      <div class="col-auto text-right">
        <div class="title2 regular text-black">
          <span class="q-mr-xs">¥</span>
          <span
            :class="
              isNegative(props.data.total_modified_sales_amount_notax)
                ? 'text-negative'
                : ''
            "
          >
            {{
              formattedPrice(props.data.total_modified_sales_amount_notax) ?? 0
            }}
          </span>
        </div>
      </div>
    </div>
    <q-separator class="q-my-md" />
    <div class="row q-col-gutter-md q-mb-sm q-pr-md caption1 regular">
      <!--消費税前合計 / NoTax part-->
      <div class="col-lg-6 col-md-6 col-sm-12">
        <div class="col-12 q-mb-sm q-pl-xs">税抜合計</div>
        <div class="row q-col-gutter-md text-right">
          <div
            v-if="parseInt(props.data.vat10_modified_sales_amount_notax) != 0"
            class="col-6"
          >
            10%対象
          </div>
          <div
            v-if="parseInt(props.data.vat10_modified_sales_amount_notax) != 0"
            class="col-6"
          >
            ¥
            <span
              :class="
                isNegative(props.data.vat10_modified_sales_amount_notax)
                  ? 'text-negative'
                  : ''
              "
            >
              {{
                formattedPrice(props.data.vat10_modified_sales_amount_notax) ??
                0
              }}
            </span>
          </div>
          <div
            v-if="parseInt(props.data.vat08_modified_sales_amount_notax) != 0"
            class="col-6"
          >
            8%対象
          </div>
          <div
            v-if="parseInt(props.data.vat08_modified_sales_amount_notax) != 0"
            class="col-6"
          >
            ¥
            <span
              :class="
                isNegative(props.data.vat08_modified_sales_amount_notax)
                  ? 'text-negative'
                  : ''
              "
            >
              {{
                formattedPrice(props.data.vat08_modified_sales_amount_notax) ??
                0
              }}
            </span>
          </div>
          <div
            v-if="
              parseInt(props.data.tax_exempt_modified_sales_amount_notax) != 0
            "
            class="col-6"
          >
            非課税
          </div>
          <div
            v-if="
              parseInt(props.data.tax_exempt_modified_sales_amount_notax) != 0
            "
            class="col-6"
          >
            ¥
            <span
              :class="
                isNegative(props.data.tax_exempt_modified_sales_amount_notax)
                  ? 'text-negative'
                  : ''
              "
            >
              {{
                formattedPrice(
                  props.data.tax_exempt_modified_sales_amount_notax
                ) ?? 0
              }}
            </span>
          </div>
        </div>
      </div>
      <!--消費税 / Tax part-->
      <div class="col-lg-6 col-md-6 col-sm-12">
        <div class="col-12 q-mb-sm q-pl-xs">消費税</div>
        <div class="row q-col-gutter-md text-right">
          <div v-if="parseInt(props.data.vat10_tax) != 0" class="col-6">
            10%対象
          </div>
          <div v-if="parseInt(props.data.vat10_tax) != 0" class="col-6">
            ¥
            <span
              :class="isNegative(props.data.vat10_tax) ? 'text-negative' : ''"
              >{{ formattedPrice(props.data.vat10_tax) ?? 0 }}</span
            >
          </div>
          <div v-if="parseInt(props.data.vat08_tax) != 0" class="col-6">
            8%対象
          </div>
          <div v-if="parseInt(props.data.vat08_tax) != 0" class="col-6">
            ¥
            <span
              :class="isNegative(props.data.vat08_tax) ? 'text-negative' : ''"
              >{{ formattedPrice(props.data.vat08_tax) ?? 0 }}</span
            >
          </div>
        </div>
      </div>
    </div>
    <!-- ---- -->

    <q-separator class="q-my-md" v-if="!getCart?.flg_refund" />
    <div v-if="getCustomerCartBalance && !getCart?.flg_refund">
      <div class="row q-col-gutter-md q-mb-sm q-pr-md">
        <div class="col-lg-6 col-md-6 col-sm-6">
          <div>前回繰越金</div>
        </div>
        <div
          v-if="!getCart.flg_completed"
          class="col-lg-6 col-md-6 col-sm-6 text-right"
        >
          <div class="row flex justify-end">
            <span
              :class="isNegative(getCustomerCartBalance) ? 'text-negative' : ''"
              class="q-mb-xs"
            >
              ¥ {{ absoluteFormattedPrice(getCustomerCartBalance ?? 0) }}</span
            >
          </div>
          <q-btn
            :disable="computedDisabled"
            class="bg-grey-800 text-white"
            size="sm"
            unelevated
            @click="createInstallment()"
          >
            <q-icon name="add" />
            未収金
          </q-btn>
        </div>
        <div v-else class="col-6 col-md-6 col-sm-6 text-right">
          <div class="row justify-end">
            {{
              roundZeroAfterPoint(
                Math.abs(Number(getCart.cart_balance_last_time))
              )
            }}
          </div>
        </div>
      </div>
      <q-separator class="q-my-md" />
    </div>
    <div class="row q-col-gutter-md" v-if="!getCart?.flg_refund">
      <div
        :class="
          getCart.id_pet_insurance && getCart.ins_target != '0.00000'
            ? ''
            : 'body1 bold text-black'
        "
      >
        {{
          getCart.id_pet_insurance && getCart.ins_target != '0.00000'
            ? '保険前金額'
            : '今回売上金額'
        }}
      </div>
      <q-space></q-space>
      <div class="col-auto q-mr-md">
        <div
          :class="
            getCart.id_pet_insurance && getCart.ins_target != '0.00000'
              ? 'title2 regular text-black'
              : 'title1 bold text-black'
          "
        >
          <span class="q-pr-xs">¥</span>
          <span
            :class="
              isNegative(props.data.total_sales_amount_intax)
                ? 'text-negative'
                : ''
            "
          >
            {{ computedTotalSalesAmountIntax }}
          </span>
        </div>
        <div class="row justify-end">
          <q-btn
            v-if="!getCart.id_pet_insurance && Number(getCart.ins_target) === 0"
            class="text-grey-700 q-mt-sm flex items-center"
            size="sm"
            unelevated
            outline
            @click="createLossPayment()"
          >
            端数損金
          </q-btn>
        </div>
      </div>
    </div>
    <q-separator class="q-my-md" />
    <!--保険適用額 / Insurance-->
    <div
      class="row q-col-gutter-md q-mb-sm q-pr-md"
      v-if="!getCart?.flg_refund"
    >
      <div class="col-lg-5 col-md-5 col-sm-6">
        <div
          v-if="getCart.id_pet_insurance && getCart.ins_target != '0.00000'"
          class="body1 regular"
        >
          保険対象額
        </div>
        <div v-else class="body1 regular">保険適用なし</div>
        <div
          v-if="getCart.id_pet_insurance && getCart.ins_target != '0.00000'"
          class="text-right"
        >
          <div class="text-grey-900">
            <span class="q-pr-xs">¥</span>-<span
              :class="
                isNegative(props.data.total_amount_insured)
                  ? 'text-negative'
                  : ''
              "
            >
              {{ formattedPrice(props.data.total_amount_insured, true) ?? 0 }}
            </span>
            <q-btn
              :disabled="UiDisable"
              class="q-ml-md"
              flat
              round
              @click="removeInsurance"
            >
              <q-icon name="close" size="xs" />
            </q-btn>
          </div>
        </div>
      </div>
      <div
        class="col-lg-7 col-md-7 col-sm-6"
        v-if="getCart.id_pet_insurance && getCart.ins_target != '0.00000'"
      >
        <div class="row">
          <div class="col-6">
            <div class="body1 bold text-black">自己負担額 <br /></div>
          </div>
          <div class="col-6 text-right">
            <div class="title1 bold text-grey-900">
              <span class="q-pr-xs">¥</span>
              <span :class="isNegative(props.data.bill) ? 'text-negative' : ''">
                {{ computedBill }}
              </span>
            </div>
            <div class="row justify-end">
              <q-btn
                v-if="
                  getCart.id_pet_insurance && Number(getCart.ins_target) !== 0
                "
                class="text-grey-700 q-mt-sm flex items-center"
                outline
                size="sm"
                unelevated
                @click="createLossPayment()"
              >
                端数損金
              </q-btn>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="
          claimStore.getClaimByCart && claimStore.getClaimByCart.length === 0
        "
        class="text-danger caption1 bold q-mr-md q-pt-none"
      >
        見積り状態：承認番号は取得していません。
      </div>
    </div>
    <!--調整金額 / Adjustment Price part-->
    <div class="row q-col-gutter-md q-my-md" v-if="!getCart?.flg_refund">
      <div class="col">
        <div class="text-grey-700">調整</div>
      </div>
      <span
        class="flex justify-between items-center text-center text-blue cursor-pointer"
        @click="
          updateCartAndBilling(
            '自動調整の対象外の金額です。',
            null,
            false,
            true
          )
        "
      >
        自動調整
      </span>
      <div class="col-lg-4 col-md-4 col-sm-4">
        <MtFormPullDown
          type="selection"
          outlined
          v-model:selected="props.data.type_price_adjustment"
          :options="typePriceAdjustment"
          label="調整区分"
          @update:model-value="updateTotalAdjustmentIntax"
        />
      </div>
      <div class="col-lg-3 col-md-3 col-sm-3">
        <MtFormInputNumber2
          v-model:value="props!.data!.total_adjustment_intax"
          outlined
          label="調整額"
          @update:modelValue="updateTotalAdjustmentIntax"
          @_enter="
            (value) => {
              if (value) {
                props!.data!.total_adjustment_intax = value
                calculateBillingAmount()
              }
            }
          "
          :input-style="{ 'font-size': '15px' }"
        />
      </div>
      <div class="col-auto text-right">
        <q-btn class="bg-grey-300" flat @click="calculateBillingAmount"
          >再計算
        </q-btn>
      </div>
    </div>
    <q-separator class="grey-600 q-my-md" v-if="!getCart?.flg_refund" />
    <!-- -----  -->
    <div class="row q-col-gutter-md flex justify-between q-mb-lg q-pr-sm">
      <div class="col-lg-6 col-md-6 col-sm-6">
        <q-btn
          class="bg-grey-100 body1 bold text-grey-800 full-width border-btn"
          unelevated
          @click="createBill"
        >
          <q-icon name="description" size="xs" class="q-mr-sm" />
          診療明細
        </q-btn>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6" v-if="!getCart.flg_refund">
        <q-btn
          class="bg-grey-800 body1 text-white full-width"
          unelevated
          style="border: 1px solid #424242"
          @click="openUpdatePaymentModal(false)"
        >
          <q-icon name="payments" size="xs" class="q-mr-sm" />
          入金・請求
        </q-btn>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6" v-if="getCart.flg_refund">
        <q-btn
          class="bg-grey-100 body1 regular text-grey-800 full-width border-btn"
          unelevated
          @click="openUpdatePaymentModal(true)"
          :disable="flgPaymentConducted"
        >
          返金
        </q-btn>
      </div>
    </div>
    <!-- -----  -->
    <div class="q-mt-lg q-pr-sm">
      <q-separator color="grey-400 q-my-xs"></q-separator>
      <!-- refund_occurred_list  -->
      <div
        v-for="payment in getPayments.refund_occurred_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row items-center justify-between bg-aliceblue">
            <div
              class="col-8 cursor-pointer q-hoverable"
              @click="openUpdatePaymentModalEditedMode(payment, true)"
            >
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <div class="body1 regular text-red">
                    ¥ -{{
                      formattedPrice(
                        roundFloat(Math.abs(payment.amount_refund))
                      )
                    }}
                  </div>
                </div>
                <div class="col-4 q-pl-sm">返金予定</div>
                <div class="col-4">
                  <div v-if="!payment.flg_loss" class="text-grey-700">
                    受付決済
                  </div>
                  <div v-else class="text-red">decimal loss</div>
                </div>
              </div>
            </div>
            <div class="col-4 text-right flex items-center gap-1">
              <q-btn
                class="col bg-grey-200 caption2 regular text-grey-800"
                padding="1px 6px"
                style="border: 0.5px solid #757575"
                unelevated
                @click="updatePaymentFlgConducted(payment)"
              >
                返金済にする
              </q-btn>
              <q-btn
                dense
                flat
                round
                @click="deletePayment(payment.id_payment)"
              >
                <q-icon size="xs" name="close" />
              </q-btn>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>

      <!-- refund_conducted_list  -->
      <div
        v-for="payment in getPayments.refund_conducted_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row items-center justify-between bg-FFEEF9">
            <div class="col-8 cursor-pointer q-hoverable">
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <div class="body1 regular text-red">
                    ¥ -{{
                      formattedPrice(
                        roundFloat(Math.abs(payment.amount_refund))
                      )
                    }}
                  </div>
                </div>
                <div class="col-4 q-pl-sm">
                  <q-chip
                    class="caption1 bold text-white q-py-xs status-chip"
                    :class="{
                      'bg-positive': payment.type_payment_status == 1,
                      'bg-negative': payment.type_payment_status == 2
                    }"
                    >{{
                      typePaymentStatus.find(
                        (t_ps) => t_ps.value === payment?.type_payment_status
                      )?.label
                    }}
                  </q-chip>
                </div>
                <div class="col-4">
                  <div v-if="!payment.flg_loss" class="text-grey-700">
                    受付決済
                  </div>
                  <div v-else class="text-red">入金調整（損金）</div>
                </div>
              </div>
            </div>
            <div class="col-4 text-right flex items-center gap-1">
              <div class="col">返金実施</div>
              <q-btn
                dense
                flat
                round
                @click="deletePayment(payment.id_payment)"
              >
                <q-icon size="xs" name="close" />
              </q-btn>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
    </div>

    <!-- totalPayment  -->
    <div class="q-mt-md q-pr-sm">
      <div v-if="getPayments?.payment_list?.length > 0 && !getCart?.flg_refund">
        <div class="flex justify-between font-10px q-mt-xs q-pt-none">
          <div>入金合計</div>
          <div>
            現金
            <span class="text-green"
              >¥ {{ formattedPrice(totalPayment.cash) }}</span
            >
          </div>
          <div>
            ｸﾚｶ決済
            <span class="text-green"
              >¥ {{ formattedPrice(totalPayment.credit) }}</span
            >
          </div>
          <div>
            他決済
            <span class="text-green"
              >¥ {{ formattedPrice(totalPayment.other) }}</span
            >
          </div>
        </div>
      </div>

      <!-- openSearchPaymentList  -->
      <div class="text-right q-mb-md">
        <q-btn
          flat
          dense
          class="caption1 regular text-blue text-underline"
          @click="openSearchPaymentList"
        >
          入金一覧
        </q-btn>
      </div>

      <div class="row justify-between">
        <div class="q-mr-md" v-if="getCart?.flg_refund">
          <MtFormInputDate
            v-model:date="data.date_cart"
            tabindex="1"
            autofocus
            label="会計日"
            outlined
            :disable="getCart.flg_completed"
            type="date"
            @update:date="updateDateCartForRefund()"
          />
        </div>
        <q-btn
          v-if="!getCart?.flg_refund"
          :disable="!getCart.id_pet_insurance || !getCart.flg_completed"
          class="text-white q-px-md"
          dense
          color="primary"
          unelevated
          @click="createInsuranceClaim"
        >
          保険請求の実行
        </q-btn>
        <q-btn
          dense
          class="text-white q-px-md"
          :class="
            !getCart.flg_completed || !flgPaymentConducted
              ? 'bg-blue'
              : 'bg-light-blue'
          "
          unelevated
          :disable="getCart.flg_completed || !flgPaymentConducted"
          @click="completeCart"
        >
          {{ getCart.flg_completed ? '終了済' : '会計を終了' }}
        </q-btn>
      </div>
      <!-- getLatestCartBalanceRecord sepator  -->
      <q-separator
        color="grey-700 q-my-md"
        v-if="!getCart?.flg_refund"
      ></q-separator>

      <!-- getLatestCartBalanceRecord  -->
      <div class="q-px-md q-mb-xl" v-if="!getCart?.flg_refund">
        <div>
          <div
            v-if="
              getCart?.id_cart_balance !=
              getLatestCartBalanceRecord?.id_cart_balance
            "
            class="row items-center justify-between"
          >
            <div class="col-6">
              <div class="body1 regular text-grey-700">支払残高</div>
            </div>
            <div class="col-6">
              <div
                :class="amountRemaining > 0 ? 'text-red' : 'text-green'"
                class="title1 bold text-right"
              >
                ¥ {{ formattedPrice(amountRemaining) }}
              </div>
              <div v-if="amountRemaining < 0" class="title1 bold text-right">
                ( {{ getEquation }} )
              </div>
            </div>
          </div>
          <div
            v-else-if="getCart.flg_completed"
            class="row items-center justify-between"
          >
            <div class="col-6">
              <div class="body1 regular text-grey-700">
                会計完了時の累計繰越金
              </div>
            </div>
            <div class="col-6">
              <div
                :class="amountRemaining > 0 ? 'text-red' : 'text-green'"
                class="title1 bold text-right"
              >
                ¥ {{ formattedPrice(Math.abs(Number(getCustomerCartBalance))) }}
              </div>
              <div v-if="amountRemaining < 0" class="title1 bold text-right">
                ( {{ getEquation }} )
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <GetPdfInvoice
      v-if="invoicePdfAttributes.render"
      :data="props.data"
      ref="invoicePdf"
      :invoicePdfAttributes="invoicePdfAttributes"
      :flg_display_cart_detail_discount="showDiscount"
    />
  </div>
</template>

<style lang="scss" scoped>
.border-btn {
  border: 1px solid $grey-800;
}

.status-chip {
  max-width: 71px;
  width: 100%;

  :deep(.q-chip__content) {
    justify-content: center;
  }
}

.scrolledRight {
  overflow: auto;
}

.bg-aliceblue {
  background-color: aliceblue;
}

.bg-FFEEF9 {
  background-color: #ffeef9;
}
</style>
