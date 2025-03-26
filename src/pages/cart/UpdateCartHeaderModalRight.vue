<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import JsBarcode from 'jsbarcode'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { absoluteFormattedPrice, formattedPrice } from '@/utils/helper'
import { getDateTimeNow, roundFloat, roundZeroAfterPoint } from '@/utils/aahUtils'
import { typeCartRoundUnit, typePaymentStatus, typePriceAdjustment } from '@/utils/enum'
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
import aahMessages from '@/utils/aahMessages'
import AmountLossUnitModal from '@/pages/cart/AmountLossUnitModal.vue'
import ConfrimPaymentModal from '@/pages/cart/ConfrimPaymentModal.vue'
import { Notify } from 'quasar'
import useCommonStore from '@/stores/common'

// Lazy-loaded Components
const UpdatePaymentModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdatePaymentModal.vue')
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
const UpdatePaymentDateModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdatePaymentDateModal.vue')
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
const { getPayments, getCartPayments } = storeToRefs(paymentStore)
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
const showLoadingQr = ref(false)
const qrCodeImageSrc = ref('')

const computedDisabled = computed(() => {
  return Number(getCustomerCartBalance.value) < 0
})

const computedBill = computed(() => {
  return formattedPrice(getCart.value?.bill - getAmountLoss()) ?? 0
})

const computedTotalSalesAmountIntax = computed(() => {
  return (
    formattedPrice(
      getCart.value?.total_sales_amount_intax - getAmountLoss(),
      true
    ) ?? 0
  )
})

const getBarcodeFormat = (typeCartBarCode: number): string => {
  switch (typeCartBarCode) {
    case 3:
      return 'CODE128'
    case 4:
      return 'MSI'
    case 5:
      return 'pharmacode'
    case 6:
      return 'EAN13'
    default:
      return 'CODE128'
  }
}

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
  if(
    getCart.value.id_pet_insurance && 
    getCart.value.flg_insure_request && 
    claimStore.getClaimByCart && 
    claimStore.getClaimByCart.length === 0) 
  {
    let paymentOptions = {
      attr: {
        paymentConfirmed: false
      }
    }
    await mtUtils.smallPopupWithPresistance(ConfrimPaymentModal, {
      paymentOptions
    })
    if(!paymentOptions.attr.paymentConfirmed) return
  }

  if (
    getCart?.value?.pet_insurance &&
    useCommonStore().getCommonTypeGeneralInsurerOptionList?.find(
      (i: any) => i.id_common == getCart?.value?.pet_insurance.id_cm_insurer
    )?.code_func1 == 2
  ) {
    let decimalQty = false

    getCart?.value.cart_details.forEach((cd: any) => {
      // Check if quantity has a decimal and value after decimal is > 0
      if (cd.quantity % 1 !== 0) {
        // Check if quantity is not an integer
        const decimalValue = cd.quantity - Math.floor(cd.quantity) // Extract the decimal part
        if (decimalValue > 0) {
          decimalQty = true
        }
      }
    })

    if (decimalQty) {
      const confirmation = await mtUtils.confirm(
        '特定の会計明細で「数量」に会計処理を行えない端数が生じています。\n内容を確認し、数量を変更するか、金額保持したまま数量の調整を行ってください。',
        '対応が必要です',
        'キャンセル',
        '数量を自動調整'
      )

      if (confirmation != 'edit') return

      let cartBillingData = getCartBillingData()

      cartBillingData.remove_decimal = true

      await mtUtils.promiseAllWithLoader([
        cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
      ])
      refreshDome.value = false
      await mtUtils.promiseAllWithLoader([
        cartStore.fetchCart(getCart.value?.id_cart)
      ])
      refreshDome.value = true
      return
    }
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

  await mtUtils.mediumPopup(UpdatePaymentModal, {
    fromPage: props.fromPage,
    pageTitle: props.fromPage,
    data: props.data,
    cartData: props.data,
    isRefunded: refundMode,
    amountRemaining: remainingRefundAmount
  })
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
              flg_refund_occurred: true,
              flg_refund_conducted: true
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

/**
 * Validate upfront payment usage by calling the backend API only if necessary.
 */
const validateUpfrontUsage = async (payment) => {
  const currentCartId = getCart.value?.id_cart // The cart trying to use the upfront
  const upfrontPaymentId = payment.id_payment // The upfront payment being used
  const upfrontCartId = payment.id_cart // The cart where the upfront payment was created

  // If the upfront payment is from the same cart, no validation is needed
  if (currentCartId === upfrontCartId) {
    return true
  }

  try {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      `validate-upfront-usage`,
      {
        current_cart_id: currentCartId,
        upfront_payment_id: upfrontPaymentId
      },
      false,
      {},
      false,
      true
    )
    if (!response.valid) {
      // await mtUtils.autoCloseAlert(response.data.message || 'Upfront payment validation failed.')
      mtUtils.alert(response?.data?.message || 'Something went wrong!')
      return false
    }

    return true
  } catch (error) {
    console.error('Error validating upfront payment usage:', error)
    mtUtils.alert(error.response?.data?.message || 'Something went wrong!')

    // await mtUtils.autoCloseAlert(error.response?.data?.message || 'Something went wrong!')
    return false
  }
}


const updateUpFrontPayment = async (payment: any) => {
  const isValid = await validateUpfrontUsage(payment)

  if (!isValid) {
    console.warn("Upfront payment validation failed.")
    return 
  }

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
      flg_refund_occurred: true,
      flg_refund_conducted: true
    }),
    await paymentStore.fetchPaymentsByCart(props.data?.id_cart)
  ])
}

const updatePaymentDate = async (payment: any) => {
  await mtUtils.smallPopup(UpdatePaymentDateModal, {
    data: payment,
    cartData: props.data
  })
  // await mtUtils.promiseAllWithLoader([
  //   usePaymentStore().fetchPaymentByCustomer({
  //     id_cart: props.data?.id_cart,
  //     flg_upfront_ui: true,
  //     id_customer: props.data.id_customer,
  //     flg_refund_occurred: true,
  //     flg_refund_conducted: true
  //   })
  // ])
}

async function removeRefundPayment(row) {
  const confirmation = await mtUtils.confirm(
    aahMessages.delete_ask,
    aahMessages.delete
  )

  if (confirmation) {
    await paymentStore.deletePayment(row.id_payment)
    await mtUtils.autoCloseAlert(aahMessages.success)
  }

  await mtUtils.promiseAllWithLoader([
    usePaymentStore().fetchPaymentByCustomer({
      id_cart: props.data?.id_cart,
      flg_upfront_ui: true,
      id_customer: props.data.id_customer,
      flg_refund_occurred: true,
      flg_refund_conducted: true
    }),
    await paymentStore.fetchPaymentsByCart(props.data?.id_cart)
  ])
}

async function updatePaymentFlgConducted(payment: any) {
  if (!getCart.value.flg_refund) {
    await mtUtils.autoCloseAlert('返金を行う為には返金会計を作成してください。')
    return
  }

  const payload = {
    id_payment: payment.id_payment,
    flg_refund_conducted: true,
    id_cart_processed: getCart.value.id_cart
  }
  let alreadyConductedAmount = 0

  getPayments.value.refund_conducted_list.map((refund: any) => {
    if (refund.id_cart_processed == getCart.value.id_cart) {
      alreadyConductedAmount += Number(refund.amount_refund)
    }
  })

  if (
    alreadyConductedAmount +
      Number(payment.amount_refund) -
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
    }),
    await paymentStore.fetchPaymentsByCart(props.data?.id_cart)
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
      (acc: any, curr: any) => {
        if (curr.flg_refund_occurred) {
          return acc - curr.amount_refund
        }
        return acc - curr.amount_payment
      },
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
  let mostRecent, mostLater

  // Get the first non-empty array, prioritizing payment_list
  const paymentSources = [
    getPayments.value?.payment_list,
    getPayments.value?.refund_occurred_list,
    getPayments.value?.refund_conducted_list
  ];

  // Find the first array that has data
  const paymentsHasData = paymentSources.find(arr => Array.isArray(arr) && arr.length > 0);

  // Convert datetime_payment to Date object and find most recent & most later
  if (paymentsHasData) {
    mostRecent = paymentsHasData.reduce((max, curr) => {
        return new Date(curr.datetime_payment) > new Date(max.datetime_payment) ? curr : max
      }
    );
  
    mostLater = paymentsHasData.reduce((min, curr) => {
        return new Date(curr.datetime_payment) < new Date(min.datetime_payment) ? curr : min
      }
    );
  }

  localStorage.setItem(
    'paymentSearchData',
    JSON.stringify({
      id_customer: props.data?.id_customer,
      date_from: mostLater?.datetime_payment.split(' ')[0] || null,
      date_to: mostRecent?.datetime_payment.split(' ')[0] || null,
      type_payment_status: mostRecent?.type_payment_status || 1
    })
  )
  const routeData = router.resolve({ name: 'SearchPaymentList' })
  window.open(routeData.href, '_blank')
}

const generateQrFromLocalStorage = async (): Promise<string> => {
  showLoadingQr.value = true

  try {
    const idClinic = getCart.value?.id_clinic || ''
    if (!idClinic) {
      throw new Error('id_clinic missing')
    }

    const qrCodeUrl = await mtUtils.fetchQrCode(
      amountRemaining.value,
      '50x50',
      '0'
    )
    qrCodeImageSrc.value = qrCodeUrl
    return qrCodeUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw error
  } finally {
    showLoadingQr.value = false
  }
}

const formatToEAN13 = (value: string): string => {
  const numericValue = value.replace(/\D/g, ''); // Remove non-numeric characters

  if (numericValue.length > 12) {
    return numericValue.slice(0, 12); // Trim to 13 digits
  } else {
    return numericValue.padStart(12, '0'); // Pad with leading zeros
  }
};

const formatEAN13FromSetting = (
  part1: string,
  part2: string, 
  part3: string,
  part4: string,
  part5: string,
  partValues: Record<string, string>
) => {
  // Initialize the result string with 13 zeros
  let result = '0'.repeat(13);
  // Process each part
  const processPart = (partConfig: string, partKey: string) => {
    if (!partConfig) return;
    
    const segments = partConfig.split(',');
    if (segments.length < 2) return;
    
    const position = parseInt(segments[0], 10);
    const length = parseInt(segments[1], 10);
    
    if (isNaN(position) || isNaN(length) || length === 0) return;
    
    // Get the value from partValues or use '0' if not available
    const value = partValues[partKey] || '0';
    
    // Format the value according to the specified length
    const formattedValue = value.padStart(length, '0').slice(0, length);
    
    // Replace the characters at the specified position
    const newResult = result.split('');
    for (let i = 0; i < length; i++) {
      if (position + i < newResult.length) {
        newResult[position + i] = formattedValue[i];
      }
    }
    result = newResult.join('');
  };
  
  // Process each part in order
  processPart(part1, 'part1');
  processPart(part2, 'part2');
  processPart(part3, 'part3');
  processPart(part4, 'part4');
  processPart(part5, 'part5');
  // Ensure the final result is padded to 13 digits
  return result.substring(0, 13).padStart(13, '0');
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
    try {
      if(props.data?.id_clinic) {
        await useClinicStore().fetchClinicById(props.data!.id_clinic)
      }
      const clinicData: any = useClinicStore().getClinic
      const typeCartBarCode = clinicData.type_cart_bar_code
      let qrCodeUrl = null
      let barcodeDataURL = null
      if (typeCartBarCode === 2) {
        qrCodeUrl = await mtUtils.fetchQrCode(
          amountRemaining.value,
          '75x75',
          '0'
        )
        qrCodeImageSrc.value = qrCodeUrl
      } else if (typeCartBarCode !== 1) {
        const canvas = document.getElementById(
          'barcodeCanvas'
        ) as HTMLCanvasElement
        if (canvas) {
          let formattedValue = amountRemaining.value?.toString() || '1234567890';
          let displayValue = false
          let extraOptions = {}
          if (typeCartBarCode === 6) { 
            const flaggedCustom: boolean = clinicData?.flg_cart_barcode_definition
            const calculatedPrice = (): number => {
                const amountInstallment =
                  (getCart.value as any)?.cart_details.find(
                    (detail: any) =>
                      detail.flg_group_title && detail.group_detail?.cb_installment
                  )?.group_detail?.amount_installment || 0
                const originalBillAmount = props.data?.bill
                const billLoss = getAmountLoss()
                return Math.floor(originalBillAmount - billLoss + amountInstallment)
              }
            let toConvertInEan: string = calculatedPrice().toString()
            if (flaggedCustom) {
              const firstPart = !clinicData?.barcode_1flag ? '' : clinicData?.barcode_1flag?.toString().split(',')
              const secondPart = !clinicData?.barcode_2code ? '' : clinicData?.barcode_2code?.toString().split(',')
              
              toConvertInEan = formatEAN13FromSetting(
                clinicData?.barcode_1flag ?? '',
                clinicData?.barcode_2code ?? '',
                clinicData?.barcode_3pricecheckdigit ?? '',
                clinicData?.barcode_4price ?? '',
                clinicData?.barcode_5checkdigit ?? '',
                {
                  part1: firstPart.length > 2 ? firstPart[2] ?? '' : '',
                  part2: secondPart.length > 2 ? secondPart[2] ?? '' : '', // Item Code - Todo Where to get
                  part3: '0', //  Price Check Digit - not used price check digit
                  part4:  calculatedPrice().toString(), // Price - Rounded by floor based in ViewInvoice.vue
                  part5: '1', // Check Digit - Does not matter libary calculates the check digit
                }
              )
              extraOptions = {
                textMargin: 0,
                fontOptions: 'bold',
              }
            }
            displayValue = true
            formattedValue = formatToEAN13(toConvertInEan);
          }
          JsBarcode(canvas, formattedValue, {
            format: getBarcodeFormat(typeCartBarCode),
            displayValue: displayValue,
            width: 3,
            height: typeCartBarCode === 6 ? 80 : 40,
            ...extraOptions
          })
          barcodeDataURL = canvas.toDataURL('image/png')
        }
      }

      const pdfData = {
        ...props.data,
        flg_billed: true,
        datetime_billed: getDateTimeNow(),
        barcode: barcodeDataURL,
        qrcode: qrCodeUrl
      }

      if (popup.modelValue === GETPDF) {
        await mtUtils.pdfRender(GetPdfInvoice, {
          data: pdfData,
          flgDownloadPdf: true,
          flg_display_cart_detail_discount: popup.showDiscount
        })
      } else if (popup.modelValue === PRINT) {
        props.data.flg_billed = true
        props.data.datetime_billed = getDateTimeNow()
        props.data.barcode = barcodeDataURL
        props.data.qrcode = qrCodeUrl
        invoicePdfAttributes.render = true
        showDiscount.value = popup.showDiscount
      } else if (popup.modelValue === PPS) {
        await mtUtils.pdfRender(GetPdfInvoice, {
          data: pdfData,
          callback: updateInfoListModalWithPdf,
          flg_display_cart_detail_discount: popup.showDiscount
        })
      } else if (popup.modelValue === VIEW_INVOICE) {
        await mtUtils.popup(ViewInvoice, {
          data: pdfData,
          flg_display_cart_detail_discount: popup.showDiscount
        })
      }
    } catch (error) {
      console.error('Failed to generate QR code or barcode:', error)
    }
  }
}

const updateInfoListModalWithPdf = async (
  pdf_blob: Blob,
  pdfFileName: string
) => {
  const name_customer = getCustomer.value.name_customer_display
  const clinic = JSON.parse(localStorage.getItem('clinic'))?.label
  const messageContent = `${name_customer} ${clinic} `
  await mtUtils.mediumPopup(UpdateInfoListModal, {
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
  isAutoAdjustment: any = false,
  alertMessagePopup: any = true
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
        'Error: CT001a'
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

  if (alertMessagePopup) mtUtils.autoCloseAlert(alertMessage)
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
  flag: any = false,
  alertMessagePopup: any = true
) => {
  if (getCart.value.flg_completed) {
    await mtUtils.autoCloseAlert(
      '完了済の会計です。\nメニューの「会計修正」から実行してください。'
    )
    return
  }

  try {
    await updateCartAndBilling(
      '請求金額を更新しました',
      formattedData,
      flag,
      false,
      alertMessagePopup
    )
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
      getCart.value.id_cart_balance &&
    getLatestCartBalanceRecord.value.amount_adjustment < 0
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

  getCartPayments.value?.forEach((payment: any) => {
    let totalAmount = 0

    // Apply the conditions to calculate the adjusted amount
    // TODO: need to add flg_loss condition too
    if (payment.flg_loss) return
    if (payment.flg_upfront) {
      totalAmount += Number(payment.amount_upfront_received) || 0
    } else if (payment.flg_refund_conducted) {
      totalAmount -= Number(payment.amount_refund) || 0
    } else if (
      !payment.flg_upfront &&
      !payment.flg_upfront_used &&
      !payment.flg_refund_conducted
    ) {
      totalAmount += Number(payment.amount_payment) || 0
    }

    // Categorize the adjusted amount based on payment method
    if (payment.type_payment_method === 1) {
      totalCash += totalAmount
    } else if (payment.type_payment_method === 2) {
      totalCredit += totalAmount
    } else {
      totalOther += totalAmount
    }
  })
  let total = totalCash + totalCredit + totalOther;
  return { cash: totalCash, credit: totalCredit, other: totalOther, total }
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
    remove_insurance: true,
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

function checkLeftAndRightEqual() {
  let totalLeft = 0
  getCart.value.cart_details.forEach((cd: any) => {
    totalLeft += parseInt(Number(cd.amount_sales))
  })

  if (
    Number(totalLeft) == Number(getCart.value.total_modified_sales_amount_notax)
  ) {
    return true
  }

  return false
}

function isCdContainsDecimal(cd: any) {
  if (cd.quantity % 1 !== 0) {
    // Check if quantity is not an integer
    const decimalValue = cd.quantity - Math.floor(cd.quantity) // Extract the decimal part
    if (decimalValue > 0) {
      return true
    }
  }
  return false
}

async function completeCart() {
  if (
    getCart?.value?.pet_insurance &&
    useCommonStore().getCommonTypeGeneralInsurerOptionList?.find(
      (i: any) => i.id_common == getCart?.value?.pet_insurance.id_cm_insurer
    )?.code_func1 == 2
  ) {
    let decimalQty = false

    getCart?.value.cart_details.forEach((cd: any) => {
      // Check if quantity has a decimal and value after decimal is > 0
      if (cd.quantity % 1 !== 0) {
        // Check if quantity is not an integer
        const decimalValue = cd.quantity - Math.floor(cd.quantity) // Extract the decimal part
        if (decimalValue > 0) {
          decimalQty = true
        }
      }
    })

    if (decimalQty) {
      const confirmation = await mtUtils.confirm(
        '特定の会計明細で「数量」に会計処理を行えない端数が生じています。\n内容を確認し、数量を変更するか、金額保持したまま数量の調整を行ってください。',
        '対応が必要です',
        'キャンセル',
        '数量を自動調整'
      )

      if (confirmation != 'edit') return

      let cartBillingData = getCartBillingData()

      cartBillingData.remove_decimal = true

      await mtUtils.promiseAllWithLoader([
        cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
      ])
      refreshDome.value = false
      await mtUtils.promiseAllWithLoader([
        cartStore.fetchCart(getCart.value?.id_cart)
      ])
      refreshDome.value = true
      return
    }
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

  if (!checkLeftAndRightEqual()) {
    await mtUtils.alert(
      '会計明細の内容が更新されました。\n再計算ボタンを押して会計内容を再チェックしてください。',
      '確認'
    )
    return
  }

  // We don't want to show alertMessagePopup.
  const prevBill = getCart.value.bill
  const prevInsuranceAmount = getCart.value.total_amount_insured

  await calculateBillingAmount(null, false, false)

  if (
    prevBill != getCart.value.bill ||
    prevInsuranceAmount != getCart.value.total_amount_insured
  ) {
    await mtUtils.alert(
      '⚠️注意が必要です。\n\n会計終了時の最終金額確認で金額の誤差が生じた為、再集計により画面に表示している金額を正常化しました。\n請求金額と入金金額を再度ご確認ください。'
    )
  }

  if (getFlgAddCartBalance.value) {
    const amountInstallment =
      getCart.value.cart_details.find(
        (detail) =>
          detail.flg_group_title && detail.group_detail?.cb_installment
      )?.group_detail?.amount_installment || 0

    // We will check if there is any installment ? if no installment and we have cart balance then we
    if (amountInstallment <= 0 && Math.abs(getCustomerCartBalance.value) > 0) {
      // This if condition will return
      if (Number(amountRemaining.value) !== 0) {
        await mtUtils.smallPopup(CDInstallmentModal, {
          message: '未収金があります。請求に追加してください。',
          previousCB: Math.abs(Number(getCustomerCartBalance.value)).toFixed(0)
        })
        return
      }
    }

    // Please add payment first or remove cart balance payment to complete the cart. Because your paid amount is less
    if (Number(amountInstallment) > 0 && Number(amountRemaining.value) > 0) {
      await mtUtils.alert('支払いを追加してください。', 'Error')
      return
    }
  }

  // check if there is payment install or not if flgAutoPayment is true
  if (
    parseInt(Number(getCart.value.bill)) > 0 &&
    getPayments.value &&
    getPayments.value.payment_list &&
    getPayments.value.payment_list.length === 0
  ) {
    const confirmation = await mtUtils.confirm(
      '入金額が不足しています。\n会計を完了して未払金を登録します。\n\n実行しますか？',
      '確認',
      '実行'
    )
    if (!confirmation) return
  }

  if (amountRemaining.value < 0) {
    if (
      getPayments.value.payment_list.find((payment) => payment.flg_upfront_used)
    ) {
      await mtUtils.alert(
        `請求金額と入金額が一致していません。\n前受金の利用を削除するか、入金額を調整してください。\n調整が必要な額： ¥ ${amountRemaining.value}`,
        'エラー'
      )
      return
    }

    const confirmation = await mtUtils.confirm(
      '過入金が発生しました。\n対応を登録してください。 ',
      '確認',
      '前受金の作成',
      '返金の作成'
    )

    if (!confirmation) return

    if (confirmation == 'send') {
      // Upfront Case
      await updateUpfrontPayment()
    }

    if (confirmation == 'edit') {
      // Refund Case
      await updRefundPayment()
    }

    await usePaymentStore().fetchPaymentByCustomer({
      id_cart: getCart.value.id_cart,
      flg_upfront_ui: true,
      id_customer: getCart.value.id_customer,
      flg_refund_occurred: true,
      flg_refund_conducted: true
    })
    return
  }

  await checkLossPayment()

  if (props.data.flg_insure_request && props.data.id_pet_insurance) {
    let isClaimPrepared = false
    const response: any = await claimStore.fetchClaimByCart(props.data.id_cart)

    if (response && response.length === 0) {
      await mtUtils.alert(
        'Error-INS01：保険請求が不要な場合、保険見積額の X を押下して保険モードを解除してください。',
        'エラー'
      )
      return
    }
    if (response && response.length > 0) {
      const claim = response[0]
      if (claim.id_claim && claim.type_status_application == 1) {
        useCloseWithOutConfirmation.value = false
        await openUpdatePetInsuranceInfoModal(11, true)
        if (useCloseWithOutConfirmation.value) return
      }
    }
  }

  //
  // if (getCart.value.parent || getCart.value.children && checkCartCompletion) {
  //   const checkConfirmation = await mtUtils.confirm('Are sure want to close this cart, altering this will not be possible later.', 'Attention', 'OK')
  //   if (!checkConfirmation) return
  // }
  //

  const response1 = await cartStore.validateCartBalance({
    id_cart: getCart.value.id_cart,
    id_customer: getCart.value.id_customer,
    current_balance: amountRemaining.value,
    total_payment_amount:
      totalPayment.value.cash +
      totalPayment.value.credit +
      totalPayment.value.other,
    bill: getCart.value.bill
  })

  await cartStore
    .fetchLatestCartBalanceOfCustomer(getCart.value.id_customer)
    .catch((error) => {
      console.error(error)
    })

  cartStore
    .updateCart(getCart.value.id_cart, { flg_completed: true })
    .then(async () => {
      await cartStore.createCartBalance(getCart.value.id_cart)
      await cartStore.fetchLatestCartBalanceOfCustomer(props.data.id_customer)
      if (Number(getCustomerCartBalance.value) < 0) {
        await customerStore.updateCustomer(getCart.value.id_customer, {
          flg_unpaid: true
        })
      }
      await cartStore.fetchCart(getCart.value.id_cart)
      // await mtUtils.promiseAllWithLoader([
      //   cartStore.fetchLatestCartBalanceOfCustomer(props.data.id_customer),
      //   cartStore.fetchCart(getCart.value.id_cart)
      // ])
    })
    .catch((error) => {
      if (
        error.response &&
        error.response.data &&
        error.response.data.data &&
        error.response.data.data.detail.includes('40050')
      ) {
        Notify.create({
          progress: true,
          message:
            ' Cart Balance Created by this cart has been already paid partially or whole. ',
          type: 'negative',
          actions: [
            {
              label: 'OK',
              color: 'white',
              textColor: 'white',
              handler: () => {}
            }
          ],
          timeout: 0
        })
      }
    })
}

function areAllElementsSame(array) {
  return array.every((element) => element === array[0])
}

/**
 * Example function:
 * 1) Finds the largest payment from getPayments.value.payment_list.
 * 2) Updates that payment by subtracting the remaining amount.
 * 3) Creates a new payment (upfront) with the subtracted portion.
 */

async function updateUpfrontPayment() {
  // Clone your base payload so you don't mutate
  const basePayload = JSON.parse(JSON.stringify(paymentBasePayload.value))
  basePayload.id_cart = getCart.value.id_cart

  // Step 1: Identify the biggest payment
  const allPayments = getPayments.value.payment_list
  if (!allPayments || allPayments.length === 0) {
    await mtUtils.alert('No payments found.', 'Error')
    return
  }

  // Find the largest by amount_payment
  const biggestPayment = allPayments.reduce((max, curr) => {
    return Number(curr.amount_payment) > Number(max.amount_payment) ? curr : max
  }, allPayments[0])

  // We'll subtract from the biggest payment
  const leftover = amountRemaining.value // This is your "N" (the amount to slice off)
  const updatedAmount = Number(biggestPayment.amount_payment) + Number(leftover)

  // Safety check: if leftover is bigger than the biggest payment, handle error or proceed as needed
  if (updatedAmount < 0) {
    await mtUtils.alert(
      'Remaining amount is larger than the biggest payment. Cannot proceed.',
      'Error'
    )
    return
  }

  // Step 2: Build your "update" payload for the biggest payment
  const updatedPaymentPayload = {
    ...biggestPayment,
    amount_payment: updatedAmount // Biggest payment minus leftover
  }

  // Step 3: Build your "create" payload for the new (upfront) payment
  // This is the "N" portion you sliced off
  const newUpfrontPayload = {
    ...basePayload,
    amount_upfront_received: Math.abs(leftover), // The leftover you subtracted
    flg_upfront: true, // Mark this as an upfront payment (if that's your logic)
    // If you need to link it back:
    id_payment_ref: biggestPayment.id_payment,
    datetime_payment: biggestPayment.datetime_payment,
    datetime_upfront: biggestPayment.datetime_payment,
    type_payment_method: biggestPayment.type_payment_method,
    type_payment_category: biggestPayment.type_payment_category,
    // ... any other fields you want
  }

  // Step 4: Call your update API for the biggest payment
  let response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `process_payment`,
    {
      base_payment: updatedPaymentPayload,
      upfront_payment: newUpfrontPayload
    }
  )

  if (!response) {
    await mtUtils.autoCloseAlert('Error')
    return
  }

  // Done. Optionally alert success or refresh your screen.
  await mtUtils.alert(
    '過入金から前受金を作成しました。'
  )
}

const computedDecimal = () => {
  let isDecimal = false
  if (
    cartStore.getCart &&
    cartStore.getCart.cart_details &&
    cartStore.getCart.cart_details.length > 0
  ) {
    cartStore.getCart.cart_details.forEach((cd: any) => {
      if (cd && cd.amount_sales) {
        if (Number(cd.amount_sales) - parseInt(Number(cd.amount_sales)) > 0) {
          isDecimal = true
        }
      }
    })
  }
  return isDecimal
}

async function createLossPayment() {
  if (computedDecimal()) {
    await mtUtils.alert(
      '会計明細に1円以下の端数が含まれています。\n損金処理を行う前に会計明細の端数処理を実施してください。',
      '注意'
    )
    return
  }

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
  // Clone your base payload so you don't mutate
  const basePayload = JSON.parse(JSON.stringify(paymentBasePayload.value))
  basePayload.id_cart = getCart.value.id_cart

  // Step 1: Identify the biggest payment
  const allPayments = getPayments.value.payment_list
  if (!allPayments || allPayments.length === 0) {
    await mtUtils.alert('No payments found.', 'Error')
    return
  }

  // Find the largest by amount_payment
  const biggestPayment = allPayments.reduce((max, curr) => {
    return Number(curr.amount_payment) > Number(max.amount_payment) ? curr : max
  }, allPayments[0])

  // We'll subtract from the biggest payment
  const leftover = amountRemaining.value // This is your "N" (the amount to slice off)
  const updatedAmount = Number(biggestPayment.amount_payment) + Number(leftover)

  // Safety check: if leftover is bigger than the biggest payment, handle error or proceed as needed
  if (updatedAmount < 0) {
    await mtUtils.alert(
      'Remaining amount is larger than the biggest payment. Cannot proceed.',
      'Error'
    )
    return
  }

  // Step 2: Build your "update" payload for the biggest payment
  const updatedPaymentPayload = {
    ...biggestPayment,
    amount_payment: updatedAmount // Biggest payment minus leftover
  }

  // Step 3: Build your "create" payload for the new (upfront) payment
  // This is the "N" portion you sliced off
  const newRefundPayload = {
    ...basePayload,
    amount_refund: Math.abs(leftover), // The leftover you subtracted
    flg_refund_occurred: true, // Mark this as an upfront payment (if that's your logic)
    // If you need to link it back:
    id_payment_ref: biggestPayment.id_payment,
    datetime_payment: biggestPayment.datetime_payment,
    datetime_refund_occurred: biggestPayment.datetime_payment
    // ... any other fields you want
  }

  // Step 4: Call your update API for the biggest payment
  let response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `process_payment`,
    {
      base_payment: updatedPaymentPayload,
      refund_payment: newRefundPayload
    }
  )

  if (!response) {
    await mtUtils.alert('Error')
    return
  }

  // Done. Optionally alert success or refresh your screen.
  await mtUtils.alert(
    '過入金から返金を作成しました。'
  )
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

const filteredUpfrontPayment = computed(() =>
  getCartPayments.value?.filter((payment) => payment.flg_upfront) ?? []
);

onMounted(async () => {
  processSelectRadio()
  await mtUtils.promiseAllWithLoader([
    usePaymentStore().fetchPaymentByCustomer({
      id_cart: props.data?.id_cart,
      flg_upfront_ui: true,
      id_customer: props.data.id_customer,
      flg_refund_occurred: true,
      flg_refund_conducted: true
    }),

    /**
     * added new api fetchPaymentsByCart because the previous one (fetchPaymentByCustomer) looks complicated
     * and also, it doesnt load all the payment records for the cart (for eg: it misses fully used upfront record )
     * even though it's not needed in the UI at this time, its still an actual payment,
     * and we need to show this total in the payment section
     */
    await paymentStore.fetchPaymentsByCart(props.data?.id_cart),
    cartStore.fetchLatestCartBalanceOfCustomer(props.data.id_customer),
    claimStore.fetchClaimByCart(props.data.id_cart)
  ])

  initialCartBalanceLastTime.value = props.data?.cart_balance_last_time

  if (getCart.value && getCart.value.id_pet) {
    isPetMultiple.value = true
  }

  if (
    getCart.value &&
    getCart.value.flg_insure_request &&
    getCart.value.id_pet_insurance
  ) {
    // cartStore.setFlgAddCartBalance(false)
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
    <div class="row q-col-gutter-md q-mb-sm q-pr-md">
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
    <q-separator class="q-my-md" />
    <div v-if="getCustomerCartBalance">
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
              :class="
                isNegative(getCustomerCartBalance)
                  ? 'text-negative'
                  : 'text-green'
              "
              class="q-mb-xs"
            >
              ¥ {{ absoluteFormattedPrice(getCustomerCartBalance ?? 0) }}</span
            >
          </div>
          <q-btn
            :disable="!computedDisabled"
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
              roundZeroAfterPoint(Math.abs(Number(getCart.total_cart_balance)))
            }}
          </div>
        </div>
      </div>
      <q-separator class="q-my-md" />
    </div>
    <div class="row q-col-gutter-md">
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
    <div class="row q-col-gutter-md q-mb-sm q-pr-md">
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
          claimStore.getClaimByCart &&
          claimStore.getClaimByCart.length === 0 &&
          getCart.flg_insure_request &&
          getCart.id_pet_insurance
        "
        class="text-danger caption1 bold q-mr-md q-pt-none"
      >
        見積り状態：承認番号は取得していません。
      </div>
    </div>
    <!--調整金額 / Adjustment Price part-->
    <div class="row q-col-gutter-md q-my-md">
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
          :disable="data.id_claim"
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
    <q-separator class="grey-600 q-my-md" />
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
        <canvas style="display: none" id="barcodeCanvas"></canvas>
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
        >
          返金
        </q-btn>
      </div>
    </div>
    <div class="q-mt-lg q-pr-sm">
      <q-separator color="grey-400 q-my-xs"></q-separator>
      <div
        v-for="payment in getPayments?.upfront_payment_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row q-col-gutter-sm items-center justify-between">
            <div
              class="col cursor-pointer q-hoverable"
              @click="updateUpFrontPayment(payment)"
            >
              <span v-if="payment.datetime_upfront">
                {{ payment.datetime_upfront.split(' ')[0] }}
              </span>
            </div>
            <div
              class="col-7 cursor-pointer q-hoverable"
              @click="updateUpFrontPayment(payment)"
            >
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  ¥ {{ formattedPrice(calculateRemainingUpFront(payment)) }}
                </div>
                <!-- <div class="col-4">
                </div> -->
                <div class="col-4">
                  <div class="text-grey-700">前受金</div>
                </div>
                <div class="col-4">
                  <q-icon
                    name="event"
                    @click.stop="updatePaymentDate(payment)"
                    size="sm"
                    color="primary"
                  ></q-icon>
                </div>
              </div>
            </div>
            <div v-if="false" class="col-2 text-right">
              <div>
                <q-btn
                  class="bg-grey-200 caption2 regular text-grey-800"
                  padding="1px 6px"
                  style="border: 0.5px solid #757575"
                  unelevated
                  @click="updateUpFrontPayment(payment)"
                >
                  領収
                </q-btn>
              </div>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
      <div
        v-for="payment in filteredUpfrontPayment"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row q-col-gutter-sm items-center justify-between">
            <div class="col-3 cursor-pointer q-hoverable">
              <div 
                class="body1 regular text-grey-700"
                @click="openUpdatePaymentModalEditedMode(payment)"
              >
                {{ payment.datetime_upfront?.split(' ')[0] }}
              </div>
            </div>
            <div class="col-7 cursor-pointer q-hoverable">
              <div 
                class="row items-center justify-center" 
                @click="openUpdatePaymentModalEditedMode(payment)"
              >
                <div class="col-4 text-grey-700 text-right">
                  前 ¥ {{ formattedPrice(payment.amount_upfront_received) }}
                </div>
                <div class="col-4">
                  <q-chip
                    class="caption2 regular bg-positive text-white status-chip"
                    >{{
                      typePaymentStatus.find(
                        (t_ps) => t_ps.value === payment?.type_payment_status
                      )?.label
                    }}
                  </q-chip>
                </div>
                <div class="col-4">
                  <div class="text-grey-700">受付決済</div>
                </div>
              </div>
            </div>
            <div class="col-2 text-right">
              <div>
                <q-btn
                  padding="1px 6px"
                  class="bg-grey-200 caption2 regular text-grey-800"
                  unelevated
                  style="border: 0.5px solid #757575"
                  @click="openPaymentReceiptModalOnPayment(payment)"
                  v-if="!payment.flg_loss"
                >
                  領収
                </q-btn>
                <div v-else class="text-danger q-mr-md">損金処理</div>
              </div>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
      <div
        v-for="payment in getPayments.payment_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div
            v-if="payment.flg_loss_decimal"
            class="row q-col-gutter-sm items-center justify-between caption2 reugular bg-grey-100"
          >
            <div class="col-3">
              <div>
                {{ payment.datetime_payment?.split(' ')[0] }}
              </div>
            </div>
            <div class="col-7">
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <div class="text-red">
                    ¥ {{ roundZeroAfterPoint(Math.abs(payment.amount_loss)) }}
                  </div>
                </div>
                <div class="col-4"></div>
                <div class="col-4">端数損金処理</div>
              </div>
            </div>
          </div>
          <div v-else class="row q-col-gutter-sm items-center justify-between">
            <div
              class="col-3 cursor-pointer q-hoverable"
              @click="openUpdatePaymentModalEditedMode(payment)"
            >
              <div class="body1 regular text-grey-700">
                {{ payment.datetime_payment?.split(' ')[0] }}
              </div>
            </div>
            <div
              class="col-7 cursor-pointer q-hoverable"
              @click="openUpdatePaymentModalEditedMode(payment)"
            >
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <template v-if="!payment.flg_loss">
                    <div
                      v-if="!payment.flg_refund_occurred"
                      class="body1 regular text-grey-700"
                    >
                      <q-icon
                        v-if="payment.flg_upfront_used"
                        class="text-red"
                        name="arrow_upward"
                      ></q-icon>
                      ¥
                      {{
                        Math.abs(payment.amount_payment) != 0
                          ? formattedPrice(
                              roundFloat(Math.abs(payment.amount_payment))
                            )
                          : '0'
                      }}
                    </div>
                    <div v-else class="body1 regular text-red">
                      <q-icon
                        v-if="payment.flg_upfront_used"
                        class="text-red"
                        name="arrow_upward"
                      ></q-icon>
                      ¥ -{{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_refund))
                        )
                      }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="body1 regular text-red">
                      ¥ {{ roundZeroAfterPoint(Math.abs(payment.amount_loss)) }}
                    </div>
                  </template>
                </div>
                <div class="col-4">
                  <q-chip
                    v-if="!payment.flg_loss"
                    class="caption2 regular bg-positive text-white status-chip"
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
                </div>
              </div>
            </div>
            <div class="col-2 text-right">
              <div>
                <q-btn
                  padding="1px 6px"
                  class="bg-grey-200 caption2 regular text-grey-800"
                  unelevated
                  style="border: 0.5px solid #757575"
                  @click="openPaymentReceiptModalOnPayment(payment)"
                  v-if="!payment.flg_loss"
                >
                  領収
                </q-btn>
                <div v-else class="text-danger q-mr-md">損金処理</div>
              </div>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
      <div
        v-for="payment in getPayments.cart_processed_payment_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row q-col-gutter-sm items-center justify-between">
            <div
              class="col-3 cursor-pointer q-hoverable"
              @click="openUpdatePaymentModalEditedMode(payment)"
            >
              <div class="body1 regular text-grey-700">
                {{ payment.datetime_payment?.split(' ')[0] }}
              </div>
            </div>
            <div class="col-7 cursor-pointer q-hoverable">
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <template v-if="!payment.flg_loss">
                    <div
                      v-if="!payment.flg_refund_occurred"
                      class="body1 regular text-grey-700"
                    >
                      <q-icon
                        v-if="payment.flg_upfront_used"
                        class="text-red"
                        name="arrow_upward"
                      ></q-icon>
                      ¥
                      {{
                        Math.abs(payment.amount_cart_balance) != 0
                          ? formattedPrice(
                              roundFloat(Math.abs(payment.amount_cart_balance))
                            )
                          : '0'
                      }}
                    </div>
                  </template>
                </div>
                <div class="col-4">
                  <q-chip
                    v-if="!payment.flg_loss"
                    class="caption2 regular bg-warning text-white status-chip"
                    >{{
                      typePaymentStatus.find(
                        (t_ps) => t_ps.value === payment?.type_payment_status
                      )?.label
                    }}
                  </q-chip>
                </div>
                <div class="col-4">
                  <div v-if="!payment.flg_loss" class="text-grey-700">
                    Cb Payment
                  </div>
                </div>
              </div>
            </div>
            <div class="col-2 text-right"></div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
      <div
        v-for="payment in getPayments.refund_occurred_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row items-center justify-between bg-aliceblue">
            <div
              class="col-3 cursor-pointer q-hoverable"
              @click="openUpdatePaymentModalEditedMode(payment, true)"
            >
              <div class="body1 regular text-grey-700">
                {{ payment.datetime_payment?.split(' ')[0] }}
              </div>
            </div>
            <div
              class="col-7 cursor-pointer q-hoverable"
              @click="openUpdatePaymentModalEditedMode(payment, true)"
            >
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <template v-if="!payment.flg_loss">
                    <div
                      v-if="!payment.flg_refund_occurred"
                      class="body1 regular text-grey-700"
                    >
                      ¥
                      {{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_payment))
                        )
                      }}
                    </div>
                    <div v-else class="body1 regular text-red">
                      <q-icon
                        v-if="payment.flg_upfront_used"
                        class="text-red"
                        name="arrow_upward"
                      ></q-icon>
                      ¥ -{{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_refund))
                        )
                      }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="body1 regular text-red">
                      ¥
                      {{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_loss))
                        )
                      }}
                    </div>
                  </template>
                </div>
                <div class="col-4">
                  <q-chip
                    class="caption1 bold bg-positive text-white q-py-xs status-chip"
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
                  <div v-else class="text-red">decimal loss</div>
                </div>
              </div>
            </div>
            <div class="col-2 text-right">
              <div>
                <q-btn
                  class="bg-grey-200 caption2 regular text-grey-800"
                  padding="1px 6px"
                  style="border: 0.5px solid #757575"
                  unelevated
                  @click="updatePaymentFlgConducted(payment)"
                >
                  返金予定
                </q-btn>
              </div>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
      <div
        v-for="payment in getPayments.refund_conducted_list"
        :key="payment.id_payment"
        :name="payment.id_payment"
        class="q-pa-none"
      >
        <div class="my-box">
          <div class="row items-center bg-FFEEF9">
            <div class="col-3 cursor-pointer q-hoverable" @click="">
              <div class="body1 regular text-grey-700">
                {{ payment.datetime_refund_conducted?.split(' ')[0] }}
              </div>
            </div>
            <div class="col-7 cursor-pointer q-hoverable" @click="">
              <div class="row items-center justify-center">
                <div class="col-4 text-right">
                  <template v-if="!payment.flg_loss">
                    <div
                      v-if="!payment.flg_refund_occurred"
                      class="body1 regular text-grey-700"
                    >
                      ¥
                      {{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_payment))
                        )
                      }}
                    </div>
                    <div v-else class="body1 regular text-red">
                      <q-icon
                        v-if="payment.flg_upfront_used"
                        class="text-red"
                        name="arrow_upward"
                      ></q-icon>
                      ¥ -{{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_refund))
                        )
                      }}
                    </div>
                  </template>
                  <template v-else>
                    <div class="body1 regular text-red">
                      ¥
                      {{
                        formattedPrice(
                          roundFloat(Math.abs(payment.amount_loss))
                        )
                      }}
                    </div>
                  </template>
                </div>
                <div class="col-4">
                  <q-chip
                    class="caption1 bold bg-positive text-white q-py-xs status-chip"
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
            <div class="col-2 text-right">
              <q-icon
                v-if="payment.flg_upfront_used"
                class="text-red"
                name="close"
                size="md"
                @click="removeRefundPayment(payment)"
              ></q-icon>
            </div>
          </div>
          <q-separator color="grey-400 q-my-xs"></q-separator>
        </div>
      </div>
    </div>
    <div class="q-mt-md q-pr-sm">
      <div v-if="getCartPayments?.length > 0">
        <div class="flex justify-between font-10px q-mt-xs q-pt-none">
          <div>入金合計</div>
          <div>
            現金
            <span class="text-green"
              >¥ {{ formattedPrice(totalPayment?.cash) }}</span
            >
          </div>
          <div>
            ｸﾚｶ決済
            <span class="text-green"
              >¥ {{ formattedPrice(totalPayment?.credit) }}</span
            >
          </div>
          <div>
            他決済
            <span class="text-green"
              >¥ {{ formattedPrice(totalPayment?.other) }}</span
            >
          </div>
        </div>
      </div>
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
        <q-btn
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
          :class="!getCart.flg_completed ? 'bg-light-blue' : 'bg-blue'"
          unelevated
          :disable="getCart.flg_completed"
          @click="completeCart"
        >
          {{ getCart.flg_completed ? '終了済' : '会計を終了' }}
        </q-btn>
      </div>
      <q-separator color="grey-700 q-my-md"></q-separator>
      <div class="q-px-md q-mb-xl">
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
          <div v-else class="row items-center justify-between">
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
