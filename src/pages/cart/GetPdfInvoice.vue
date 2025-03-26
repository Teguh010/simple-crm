<script lang="ts" setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import {
  concatenate,
  dateFormat,
  formatDate,
  getDateToday,
  getImage,
  getPetFirstName,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import { formattedPrice, numberFormat } from '@/utils/helper'
import useClinicStore from '@/stores/clinics'
import useCustomerStore from '@/stores/customers'
import useClaimStore from '@/stores/claim'
import html2pdf from 'html2pdf.js'
import mtUtils from '@/utils/mtUtils'
import { groupBy } from 'lodash'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'
import usePaymentStore from '@/stores/payment'

const clinicStore = useClinicStore()
const customerStore = useCustomerStore()
const paymentStore = usePaymentStore()

const claimStore = useClaimStore()
const { getClaimByCart } = storeToRefs(claimStore)

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  invoicePdfAttributes: { render: Boolean },
  callback: Function,
  flgDownloadPdf: Boolean,
  flg_display_cart_detail_discount: {
    type: Boolean,
    default: false
  }
})
const petWiseData = ref({})
const exportPdf = ref()
const clinic = ref(JSON.parse(localStorage.getItem('clinic') ?? '{}'))
const cartClaim = ref(null)
const closeUpdDialogFlg = ref(false)
const calcRows: any = ref([])
const showDiscount = ref(props.flg_display_cart_detail_discount)

const { getPayments, getPaymentList, getCartPayments } = storeToRefs(paymentStore)

const defaultColsWidth = {
  'treatment_detail' : {width: 68, checked: false},
  'unit_price' : {width: 17, checked: false},
  'quantity' : {width: 5, checked: false},
  'amount_of_money' : {width: 9, checked: false},
  'tax_column' : {width: 1, checked: false}
}
let colsWidth = reactive({})

const columns = ref([
  {
    name: 'treatment_detail',
    label: '診療内容',
    align: 'left',
    field: 'treatment_detail'
  },
  {
    name: 'unit_price',
    label: '単価',
    align: 'center',
    field: 'dosage_frequency'
  },
  {
    name: 'quantity',
    label: '数量',
    align: 'center',
    field: 'quantity'
  },
  {
    name: 'amount_of_money',
    label: '金額',
    align: 'center',
    field: 'amount_of_money'
  },
  {
    name: 'tax_column',
    label: '',
    align: 'center',
    field: 'tax_column'
  }
])

const rows = ref([])

const petNames = () => {
  const cart_details = props.data.cart_details
  const petIds = new Set(cart_details.map(cd => cd?.id_pet?.id_pet))
  return Array.from(petIds)
    .filter(id => id)
    .map(id => {
      const cartDetailPet = cart_details.find(cd => cd?.id_pet?.id_pet === id)?.id_pet
      return getPetFirstName(cartDetailPet)
    })
    .filter(Boolean)
    .join(', ')
}

const init = async () => {
  const [clinicResponse] = await mtUtils.promiseAllWithLoader([clinicStore.fetchClinicById(props.data.id_clinic)])
  clinic.value = clinicResponse
  
  if(clinic.value.memo_bank_info) {
    let tempInfo: string = clinic.value.memo_bank_info
    tempInfo = tempInfo.replace(/\r\n/g, '<br />')
    clinic.value.memo_bank_info = tempInfo
  }

  await nextTick()
  if(clinic.value.logo_file_path1) clinic.value.logo_file_path1 = await getImage(clinic.value.logo_file_path1)
  await nextTick()

  cartClaim.value = getClaimByCart.value
  let cart_details = props.data.cart_details

  petWiseData.value = groupBy(cart_details.filter((cd) => cd.group_detail), (cd) => cd?.id_pet?.id_pet ? cd.id_pet.id_pet : 'no_pet')

  let keys: any = Object.keys(petWiseData.value)
  // sort based on date
  Object.keys(petWiseData.value).forEach((key, idx) => {
    petWiseData.value[key] = petWiseData.value[key].sort((a: any, b: any) => {
      return new Date(a.date_order_start).getTime() - new Date(b.date_order_start).getTime()
    })
  })

  let rowsData: any = []
  Object.keys(petWiseData.value).forEach((key, idx) => {
    const cartDetailPet: any = petWiseData.value[key][0]?.id_pet
    const fullPetName = getPetFirstName(cartDetailPet)

    if (fullPetName) rowsData.push({ 'name_pet': fullPetName, flg_name_pet: true, flg_other: false })
    else if (key == 'no_pet') rowsData.push({ 'name_pet': 'その他 ', flg_name_pet: true, flg_other: true })

    if((fullPetName || key == 'no_pet') && Boolean(props.data.name_insured_disease))
      rowsData.push({ flg_name_insured_disease: true, 'name_insured_disease': props.data.name_insured_disease})

    petWiseData.value[key].forEach((item, idx) => {
      if (item.group_detail && !(item.group_detail.flg_group_item)) {

        let flg_tax_included = item.group_detail.flg_tax_included
        let amount_sales = item.amount_sales
        let unit_sales = item.unit_sales
        let unit_price = item.unit_price
        let quantity = item.quantity
        let discounted_amount = item.amount_detail_discounted
        let sales_ratio = item.sales_ratio

        if (!item.flg_group_title) {
          amount_sales = Number(item.amount_sales).toFixed(0)
          unit_sales = Number(item.unit_sales).toFixed(0)
          unit_price = Number(item.unit_price).toFixed(0)
          discounted_amount = Number(item.amount_detail_discounted).toFixed(0)
          sales_ratio = Number(item.sales_ratio).toFixed(0)
          quantity = item.quantity
        }

        if (item.flg_group_title) {
          amount_sales = Number(item.group_detail.amount_sales).toFixed(0)
          unit_sales = Number(item.group_detail.unit_sales).toFixed(0)
          unit_price = Number(item.group_detail.unit_price).toFixed(0)
          discounted_amount = Number(item.group_detail.amount_detail_discounted).toFixed(0)
          sales_ratio = Number(item.group_detail.sales_ratio).toFixed(0)
          quantity = item.group_detail.quantity ?? item.quantity
        }

        if (item.flg_group_title && item.group_detail.cb_installment) {
          amount_sales = Number(item.group_detail.amount_installment).toFixed(0)
          quantity = null
          unit_sales = null
        }

        if (item.flg_group_title) {
          let isWholeInsured = true
          props.data.cart_details.forEach((cd: any) => {
            if (item.group_detail && item.group_detail?.id_cart_detail_list?.includes(cd.id_cart_detail) && !cd.flg_pet_insurance) {
              isWholeInsured = false
            }
          })
          item.flg_pet_insurance = isWholeInsured
        }
      
        rowsData.push({
          ...item,
          flgShowDateStart: idx === 0 ? true : petWiseData.value[key][idx]['date_order_start'] === petWiseData.value[key][idx - 1]['date_order_start'] ? false : true,
          flg_tax_included: flg_tax_included,
          amount_sales: amount_sales,
          unit_sales: unit_sales,
          unit_price: unit_price,
          quantity: quantity,
          discounted_amount: discounted_amount,
          nameCartItemWidthHeight: getTextWidthHeight(item.name_cart_item_display ?? '')
        })
      }
    })
  })

  keys =
    [{ key: 'total_sales_amount_notax', show: true, label: '小計' },
      {
        key: 'total_discount_notax',
        show: (parseInt(props.data['total_ch_disc_notax']) || parseInt(props.data['total_cd_disc'])) ?? false,
        label: '全体割引額'
      },
      {
        key: 'vat10_modified_sales_amount_notax',
        show: (parseInt(props.data['vat10_modified_sales_amount_notax'])),
        label: '10%対象計'
      },
      { key: 'vat10_tax', show: (parseInt(props.data['vat10_tax'])), label: '消費税(10%)' },
      {
        key: 'vat08_modified_sales_amount_notax',
        show: (parseInt(props.data['vat08_modified_sales_amount_notax'])),
        label: '外税(軽減税率8%)対象計'
      },
      { key: 'vat08_tax', show: (parseInt(props.data['vat08_tax'])), label: '外税(軽減税率8%)' },
      {
        key: 'tax_exempt_modified_sales_amount_notax',
        show: (parseInt(props.data['tax_exempt_modified_sales_amount_notax'])),
        label: '非課税対象計'
      },
      // { key: 'total_modified_sales_amount_notax', show: true, label: '税別 総計' },
      { key: 'total_sales_amount_intax', show: true, label: '税込 総計' }
    ]

  keys.forEach((key, idx) => {
    let value: any = formattedPrice(props.data[key.key])
    if (key.key == 'total_sales_amount_notax') {
      value = formattedPrice(Number(props.data['total_sales_amount_notax']) + Number(props.data['total_cd_disc']))
    }
    if (key.key == 'total_discount_notax') {
      value = parseInt(props.data['total_cd_disc']) + parseInt(props.data['total_ch_disc_notax'])
      value = '-' + ' ' + formattedPrice(value)
    }
    if (key.key === 'vat10_modified_sales_amount_notax') {
      key.label = concatenate('税率 10%対象計', ' / 消費税 10%')
      value = concatenate(formattedPrice(props.data[key.key]), ` / 消費税等 ${formattedPrice(props.data['vat10_tax'])}`)
    } else if (key.key === 'vat10_tax') {
      return
    }
    if (key.key === 'vat08_modified_sales_amount_notax') {
      key.label = concatenate('税率 8%対象計', ' / 消費税 8%')
      value = concatenate(formattedPrice(props.data[key.key]), ` / 外消費税等 8% ${formattedPrice(props.data['vat08_tax'])} `)
    } else if (key.key === 'vat08_tax') {
      return
    }
    if (key.show) {
      calcRows.value.push({
        key: key.key,
        label: key.label,
        value: value,
        calcIndex: idx,
        flgBold: key.key === 'total_sales_amount_intax' ? true : false
      })
    }
  })
  if(totalPayment.value.totalUpfrontReceived > 0 ) {
    rowsData.push(
      {
        name_cart_item_display:  `前受け金 ${formattedPrice(totalPayment.value.totalUpfrontReceived)}円`,
        amount_price: totalPayment.value.totalUpfrontReceived
      }
    )  
  }
  if(totalPayment.value.totalRefund > 0 ) {
    rowsData.push(
      {
        name_cart_item_display: `返金 ${formattedPrice(totalPayment.value.totalRefund)}円`,
        amount_price: totalPayment.value.totalRefund
      }
    )  
  }

  colsWidth = getColsWidth(rowsData)
  await nextTick()
  let startPageRows: number = getWholeLossAmount() ? 11 : 12, midPageRows: number = 22, lastPageRows: number = 0
  const expectedCalcRows:number = 8, defaultRows: number = 12, lastPageMaxRows: number = 24
  midPageRows += expectedCalcRows
  if(rowsData.length + (expectedCalcRows - calcRows.value.length) > lastPageMaxRows) {
    startPageRows = 30 // for two page case
    lastPageRows = defaultRows + (expectedCalcRows - calcRows.value.length)
  }
  else {
    startPageRows += (expectedCalcRows - calcRows.value.length)
    if(rowsData.length + (expectedCalcRows - calcRows.value.length) <= lastPageMaxRows && rowsData.length > startPageRows) {
      const firstPageLastIndex = startPageRows - 1
      let tempObj = { ...rowsData[firstPageLastIndex] }; // Clone tempObj to avoid reference issues
      
      Object.keys(tempObj).forEach(key => tempObj[key] = ''); // Clear tempObj data
      
      for (let i = 30; i > firstPageLastIndex; i--) {
          rowsData.splice(firstPageLastIndex, 0, { ...tempObj }); // Insert cloned object
      }
      startPageRows = 30 // for two page case
      midPageRows = defaultRows + (expectedCalcRows - calcRows.value.length)
    }
  }
  rows.value = exportPdf.value.populateRows(rowsData, startPageRows, midPageRows, lastPageRows)
  for(let i = 0; i < rows.value.length; i++) {
    rows.value[i].push({flg_insurance_applicable_text: true})
  }
  if (props.callback) {
    await nextTick()
    let imagePDFOptions: any = { quality: 0.85 }, jsPDFOptions: any = {format: 'A5'}, pagesNumber: Number = 0
    exportPdf.value.getPdfBlob(getFileName(), pagesNumber, jsPDFOptions, imagePDFOptions).then((blob: Blob) => {
      props.callback(blob, `${getFileName()}.pdf`)
    })
    await nextTick()
    return close()
  }
  if (props.flgDownloadPdf) {
    await nextTick()
    generateReport()
    return close()
  }
  return generateAndPrintPDF()
}

function generateAndPrintPDF() {
  const element = document.getElementById('element-to-print')
  const options = {
    margin: 1,
    filename: getFileName(),
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { letterRendering: true, scale: 5 },
    jsPDF: {
      unit: 'mm',
      putOnlyUsedFonts: true,
      floatPrecision: 16,
      compressPdf: true,
      orientation: 'portrait',
      format: [148, 210]
    },
    pagebreak: {
      mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
      avoid: 'img'
    }
  }

  const iframePdf = document.querySelector(`[invoicePdf="${true}"]`)
  if (iframePdf) iframePdf.remove()
  html2pdf().set(options).from(element).toPdf().get('pdf').then(function(pdf) {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('invoicePdf', true)
    iframe.style.visibility = 'hidden'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '100px'
    iframe.style.height = '100px'
    document.body.appendChild(iframe)

    iframe.src = pdf.output('bloburl')

    iframe.onload = function() {
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }, 300)
    }
    props.invoicePdfAttributes.render = false
  })
}

function getPaidAmount() {
  let paidAmount = 0
  let amount_upfront_received = 0
  
  getPayments.value.payment_list.forEach((payment) => {
    paidAmount += Number(payment.amount_payment)
  })

  getPayments.value.upfront_payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart).map((payment: any) => {
    amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
  })

  return Number(paidAmount) + Number(amount_upfront_received)
}

function getInstallment(): number {
  return Number(
    props.data.cart_details.find(
      (detail) => detail.flg_group_title && detail.group_detail?.cb_installment
    )?.group_detail?.amount_installment || 0
  );
}

// TODO:  might remove this later
function getUpfrontPayment() {
  let amount_upfront_received = 0
  if (getPayments.value && getPayments.value.upfront_payment_list && getPayments.value.upfront_payment_list.length > 0) {
    getPayments.value.upfront_payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart).map((payment: any) => {
      amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
    })
  }

  return amount_upfront_received
}

const upfrontPaymentDisplay = computed(() => {
  const used = totalPayment.value.upfrontUsed
  const received = totalPayment.value.upfrontReceived

  if (used > 0 && received > 0) {
    return `前受 入金${formattedPrice(received)}円/清算${formattedPrice(used)}円`;
  } else if (used > 0) {
    return `前受清算 ${formattedPrice(used)}円`;
  } else if (received > 0) {
    return `前受金 ${formattedPrice(received)}円`;
  } else {
    return ''; // Default case: no upfront payments
  }
});

const totalPayment = computed(() => {
  let totalCash = 0;
  let totalCredit = 0;
  let totalOther = 0;
  let upfrontUsed = 0;
  let upfrontReceived = 0;
  let totalLoss = 0;
  let totalRefund = 0;
  let totalUpfrontReceived = 0;

  getCartPayments.value?.forEach((payment: any) => {
    // Handle loss payments
    if (payment.flg_loss || payment.flg_loss_decimal) {
      totalLoss += Number(payment.amount_loss) || 0;
      return; // Skip further calculations for loss payments
    }

    // Calculate upfront used
    if (
      payment.flg_upfront_used &&
      !payment.flg_refund_conducted &&
      payment.id_payment_ref !== null &&
      !payment.flg_delete
    ) {
      upfrontUsed += Number(payment.amount_payment) || 0;
    }

    // Calculate upfront received
    if (!payment.flg_delete) {
      if (payment.flg_upfront_used && payment.flg_refund_conducted) {
        upfrontReceived -= Number(payment.amount_refund) || 0;
      } else if (payment.flg_upfront && !payment.flg_refund_conducted) {
        upfrontReceived += Number(payment.amount_upfront_received) || 0;
        totalUpfrontReceived +=payment.amount_upfront_received || 0; //without including refund

      }
    }

    // total refunded amount
    if (!payment.flg_delete && payment.flg_refund_conducted) {
      totalRefund += Number(payment.amount_refund);
    }

    // Calculate total amount
    let totalAmount = 0;
    if (payment.flg_upfront) {
      totalAmount += Number(payment.amount_upfront_received) || 0;
    } else if (payment.flg_refund_conducted) {
      totalAmount -= Number(payment.amount_refund) || 0;
    } else if (!payment.flg_upfront && !payment.flg_upfront_used && !payment.flg_refund_conducted) {
      totalAmount += Number(payment.amount_payment) || 0;
    }

    // Categorize totalAmount by payment method
    if (payment.type_payment_method === 1) {
      totalCash += totalAmount;
    } else if (payment.type_payment_method === 2) {
      totalCredit += totalAmount;
    } else {
      totalOther += totalAmount;
    }
  });

  const totalPaid = totalCash + totalCredit + totalOther;
  const totalBillPaid = totalPaid - upfrontReceived + upfrontUsed

  return {
    cash: totalCash,
    credit: totalCredit,
    other: totalOther,
    totalPaid,
    upfrontUsed,
    upfrontReceived,
    loss: totalLoss,
    totalRefund,
    totalUpfrontReceived,
    totalBillPaid,
  };
});


// TODO: might remove later: this is replaced by totalPayment
function getTotalPaymentReceived(method: any) {
  // 1 for cash, 2 for credit cart, 3 for other
  let payment_amount = 0
  let amount_upfront_received = 0
  
  
  if (method == 1 || method == 2) {
    getPayments.value.payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart && payment.type_payment_method == method).map((payment: any) => {
      payment_amount += parseInt(Number(payment.amount_payment))
    })

    getPayments.value.upfront_payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart && payment.type_payment_method == method).map((payment: any) => {
      amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
    })
    return amount_upfront_received + payment_amount
  }

  getPayments.value.payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart && ![1, 2, '1', '2'].includes(payment.type_payment_method)).map((payment: any) => {
    payment_amount += parseInt(Number(payment.amount_payment))
  })

  getPayments.value.upfront_payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart && ![1, 2, '1', '2'].includes(payment.type_payment_method)).map((payment: any) => {
    amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
  })

  return amount_upfront_received + payment_amount
}

function getUpfrontReceivedAmount() {
  let amount_upfront_received = 0
  getPayments.value.upfront_payment_list
    .filter((payment: any) =>
      payment.id_cart === props.data.id_cart &&
      !getPayments.value.payment_list.find((pay) => pay.id_payment === payment.id_payment_ref)
    )
    .forEach((payment: any) => {
      amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
    })
  return Number(amount_upfront_received)
}

function getTotalPaymentAmount() {
  let amount_upfront_received = 0
  getPayments.value.upfront_payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart).map((payment: any) => {
    amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
  })
  return Number(amount_upfront_received)
}


const getAmountLoss = () => {
  let amount_loss = 0

  getPayments.value.payment_list.forEach((payment: any) => {
    if (payment.flg_loss) {
      amount_loss += Number(payment.amount_loss)
    }
  })
  return amount_loss
}

const getWholeLossAmount = () => {
  let amount_loss = 0

  getPayments.value.payment_list.forEach((payment: any) => {
    if (payment.flg_loss || payment.flg_loss_decimal) {
      amount_loss += Number(payment.amount_loss)
    }
  })
  return amount_loss
}


// function getTotalInvoiceAmount() {

//   return Number(props.data.bill) - getAmountLoss() 
// }

const totalInvoiceAmount = computed(() => {
  return (Number(props.data.bill) - Number(totalPayment.value.loss) + Number(getInstallment()))
})

function getTotalInvoiceAmount() {
  const totalAmount = 
    Number(props.data.bill) - 
    Number(getAmountLoss()) +
    Number(getUpfrontPayment()) + 
    Number(getInstallment());
  
  return totalAmount;
}

function getExcludedInsuredAmount() {
  const totalAmount = 
    Number(props.data.total_sales_amount_intax) - 
    Number(props.data.total_amount_insured);
  
  return totalAmount;
}

const totalBillAmountRemaining = computed(() => {
  // TODO: may be need to consider insurance too
  let amountInstallment = 0
  if (getInstallment() > 0) {
    amountInstallment = getInstallment()
  }
  return props.data.bill + amountInstallment - totalPayment.value.totalBillPaid - totalPayment.value.loss
})

function getTotalBillAmount() {
  const amountInstallment = props.data.cart_details.find((detail) => detail.flg_group_title && detail.group_detail?.cb_installment)?.group_detail?.amount_installment || 0

  if (amountInstallment > 0) {
    return (getPaidAmount()) - (getTotalInvoiceAmount() + Number(amountInstallment) + getUpfrontReceivedAmount())
  }

  return (getPaidAmount()) - (getTotalInvoiceAmount() + getUpfrontReceivedAmount())
}

function getDiseaseName() {
  let name_disease, type_insurance_purpose, code_insurer

  useCartStore().getCart.cart_details.forEach((detail: any) => {
    if (detail.flg_pet_insurance && detail.type_insurance_purpose == 5 && (detail.name_ins1 != '' && detail.name_ins2 != '')) {
      name_disease = detail.name_ins2
    }
  })


  if (!(cartClaim.value && cartClaim.value.length > 0)) return name_disease

  if (cartClaim.value[0] && cartClaim.value[0].pet_insurance) {
    code_insurer = cartClaim.value[0].pet_insurance.code_insurer
  }

  if (code_insurer == 2) {

    useCartStore().getCart.cart_details.forEach((detail: any) => {
      if (detail.type_insurance_purpose in [2, 3, 4] && (detail.name_ins1 != '' && detail.name_ins2 != '')) {
        name_disease = detail.name_ins2
      }
    })
  }
  if (code_insurer == 1) {
    return useCartStore().getCart.name_ins2
  }


  return name_disease
}

const isDiscountApplied = (row: Object) => { 
  const defaultSalesRatio: number = 100
  return showDiscount.value && row.sales_ratio && row.sales_ratio != defaultSalesRatio
}  

const getUnitSalesAmount = (row: Object) => {
  if(isDiscountApplied(row)) {
    return `<span><s class="q-mr-sm">${formattedPrice(row.unit_price)}</s>${formattedPrice(row.unit_sales)}</span>`
  }
  return `<span>${formattedPrice(row.unit_price) ? formattedPrice(row.unit_price) : ''}</span>`
}

const getColsWidth = (rowsData) => {
  rowsData.forEach((row) => {
    if(Boolean(row.amount_sales) && String(row.amount_sales)?.length >= 5 && !defaultColsWidth['amount_of_money']['checked']) {
      defaultColsWidth['amount_of_money']['width'] = defaultColsWidth['amount_of_money']['width'] += 2
      defaultColsWidth['treatment_detail']['width'] = defaultColsWidth['treatment_detail']['width'] -= 2
      defaultColsWidth['amount_of_money']['checked'] = true
    }  
    if(isDiscountApplied(row) 
      && ((Boolean(row.unit_sales) && String(row.unit_sales)?.length >= 5) || (Boolean(row.unit_price) && String(row.unit_price)?.length >= 5))
      && !defaultColsWidth['unit_price']['checked']) {
        defaultColsWidth['unit_price']['width'] = defaultColsWidth['unit_price']['width'] += 2
        defaultColsWidth['treatment_detail']['width'] = defaultColsWidth['treatment_detail']['width'] -= 2
        defaultColsWidth['unit_price']['checked'] = true
    } 
  })
  for (let key in defaultColsWidth) {
    defaultColsWidth[key]['width'] = `${defaultColsWidth[key]['width']}%`
  }
  return defaultColsWidth
}

const close = () => {
  emits('close')
}
const generateReport = () => {
  let imagePDFOptions: any = { quality: 0.85 }, jsPDFOptions: any = { format: 'a5' }, pagesNumber: Number = 0
  exportPdf.value.generateReport(getFileName(), pagesNumber, jsPDFOptions, imagePDFOptions)
}

const getFileName = () => {
  let customerName: any = customerStore.getAllCustomers.find((customer: any) => customer.value === props.data.id_customer)?.name_customer_display
  return `${getDateToday()}_${customerName}様`
}

const flgShowCalcRow = (value, key) => {
  if (['total_sales_amount_notax', 'total_discount_notax', 'total_sales_amount_intax'].includes(key)) {
    return true
  }
  return Boolean(Number(value)) ? true : false
}

const getTextWidthHeight = (text, font = "10px 'Noto Sans JP', sans-serif") => {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  
  font = text.length > 25 ? "7px 'Noto Sans JP', sans-serif" : font
  context.font = font
  const width = context.measureText(text).width;

  const fontSize = text.length > 22 ? 7 : 10
  const height = fontSize * 1.2

  return { width, height }
}

const getNameCartItemDisplay = (row) => {
  if(Object.keys(row) && row?.group_detail && row.group_detail?.cb_installment) {
    return `繰越金 ${formattedPrice(Number(row.group_detail.amount_installment).toFixed(0))}円`
  }
  else if(Object.keys(row) && row.flg_upfront_payment) {
    const totalUpfrontPayment = getUpfrontPayment()
    return `前受け金 ${formattedPrice(totalUpfrontPayment)}円`
  }
  return row.name_cart_item_display ? row.name_cart_item_display : ''
}

const showDiscountPercentage = (row) => {
  if (row?.sales_ratio == null) return false
  const salesRatio = Number(row.sales_ratio) 
  return Number.isFinite(salesRatio) && Math.round(100 - salesRatio) !== 0
}

onMounted(() => {
  init()
})

onUnmounted(() => {
  rows.value.length = 0
})
</script>

<template>
  <div ref="modelBodyRef" v-close-popup="closeUpdDialogFlg" v-show="false">
    <PdfExport ref="exportPdf" sheetName="_注文書" />
    <div class="q-pt-none page-inner-body text-grey-900">
      <q-card id="element-to-print" class="bg-white" square :style="{'max-width': '1000px', 'margin': 'auto'}">
        <div v-for="(page, idx) in rows" :key="idx" class="card-pdf-main side-adjustment-margin-for-iPad" :class="exportPdf?.pdfPerPagePadding()">
          <div class="row relative-position border-bottom-black">
            <div class="title1 text-weight-bold text-center full-width q-pb-xs">診 療 明 細 書</div>
            <div class="absolute-right">{{ (idx + 1) }}/{{ rows.length }}</div>
          </div>
          <div class="flex justify-between items-end q-mt-xs">
            <div>
              <div class="title2 q-mb-xs">
                {{ concatenate(props.data.name_customer, '') }}
                <span class="font-13px">様</span>
                <span class="q-ml-md font-10px">診察券番号：{{ props.data.code_customer }}</span>
              </div>
              <div class="font-12px">ペット患者： {{ petNames() }}</div>
            </div>
            <div class="text-right">
              <div class="font-13px q-mb-xs border-bottom-black">発行日： {{ formatDate(props.data.datetime_billed) }}</div>
              <div class="caption3 regular">
                {{ '# ' + props?.data?.id_request ? props?.data?.id_request?.number_request : '-'
                }}{{ props?.data?.number_cart }}
              </div>
            </div>
          </div>
          <div class="row full-width q-mt-xs">
            <div class="col-12 relative-position" style="height: 670px;">
              <q-table 
                :columns="columns" 
                :rows="page" 
                :rows-per-page-options="[page.length]"
                class="relative-position invoice-table"
                flat
                hide-bottom row-key="number" style="table-layout: fixed; width: 100%;"
              >
                <template v-slot:header="props">
                  <q-tr 
                    v-if="page.length > 0" 
                    :props="props" 
                    style="background: transparent;"
                  >
                    <q-th 
                      v-for="(col, idx) in props.cols" 
                      :key="col.name"
                      :class="idx === 0 ? 'border-left-black' : idx === props.cols.length - 1 ? 'border-right-black' : ''"
                      :style="{ 'border-top-left-radius': idx === 0 ? '6px' : '', 'border-top-right-radius': idx === props.cols.length - 1 ? '6px' : ''}"
                      :colspan="col.field === 'treatment_detail' ? '68%' : col.field === 'tax_column' ? '2%' : col.field === 'dosage_frequency' ? '16%' : '7%'"
                      :props="props" 
                      class="border-top-black border-bottom-black border-black"
                    >
                      <div class="text-center" style="padding-top: 2px; padding-bottom: 2px; font-size: 13px; font-weight: 400;">
                        {{ col.label }}
                      </div>
                    </q-th>
                  </q-tr>
                </template>

                <template v-slot:body="props">
                  <q-tr v-if="props.row.flg_name_pet" :props="props">
                    <q-td :class="[((props.rowIndex + idx) % 2 == '0') ? 'bg-grey-200' : '']"
                          class="border-left-black border-right-black border-bottom-black" colspan="100%">
                      <div class="flex justify-between items-center">
                        <div class="font-10px"> {{ props.row.name_pet }}</div>
                        <div v-if="!props.row?.flg_other" class="q-ml-md font-10px">
                          <span class="q-mr-sm"> {{ getDiseaseName() }} </span>
                          <span v-if="cartClaim && cartClaim?.length">発症日: {{ dateFormat(cartClaim[0]?.onset_date)
                            }} </span>
                        </div>
                      </div>
                    </q-td>
                  </q-tr>
                  <q-tr v-else-if="props.row.flg_name_insured_disease" :props="props">
                    <q-td :class="[((props.rowIndex + idx) % 2 == '0') ? 'bg-grey-200' : '']"
                          class="border-left-black border-right-black border-bottom-black" colspan="100%">
                      <div class="font-10px"> {{ props.row.name_insured_disease }} </div>
                    </q-td>
                  </q-tr>
                  <q-tr v-else-if="props.row.flgTotalRow">
                    <q-td :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                          class="font-10px text-center table-cell-custom-border" colspan="100">
                      <div class="text-right">
                        <span
                          class="font-10px text-center q-mr-lg">内消費税（8%） {{ numberFormat(formattedPrice(data?.vat08_tax))
                          }}</span>
                        <span
                          class="font-10px fw-300 col-2 text-center"> 内消費税（10%） {{ numberFormat(formattedPrice(data.vat10_tax))
                          }}</span>
                      </div>
                    </q-td>
                  </q-tr>
                  <q-tr v-else-if="props.row.flg_insurance_applicable_text">
                    <q-td :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                          class="font-10px border-left-black border-bottom-black border-right-black border-top-black" colspan="100%"
                           :style="{ 'border-bottom-left-radius': '6px', 'border-bottom-right-radius': '6px' }">
                      <div class="text-right">@：保険適用項目</div>
                    </q-td>
                  </q-tr>
                  <q-tr v-else>
                    <q-td key="treatment_detail"
                          :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '', 'border-bottom-none border-left-black', props.row?.name_cart_item_display && props.row?.name_cart_item_display?.length > 25 ? 'font-7px' : 'font-10px']"
                          :props="props" :colspan="colsWidth['treatment_detail']['width']" :calcIndex="props.row.calcIndex" :style="{'width': colsWidth['treatment_detail']['width']}"
                          >
                      <div v-if="Object.keys(props.row).length" class="flex" style="flex-wrap: nowrap;">
                        <div v-if="props.row.flgShowDateStart" style="min-width: 70px;" class="font-10px">
                          <span>{{ props.row.date_order_start }}</span>
                        </div>
                        <div v-else style="min-width: 70px;"></div>
                        <div :style="{'width': '100%','max-width': '245px', 'white-space': 'pre-line', 'max-height': '16px', 'line-height': props.row?.name_cart_item_display && props.row?.name_cart_item_display?.length > 25 ? 1: ''}"> 
                          {{ getNameCartItemDisplay(props.row) }}
                        </div>
                        <span class="q-ml-xs flex items-end" v-if="props.row.name_cart_item_display && props.row.nameCartItemWidthHeight && Math.ceil(props.row.nameCartItemWidthHeight.width) > 490">...</span> <!-- JsPdf lib not rendering ... for ellipsis class -->
                        <span 
                          style="float: right;"
                          v-if="showDiscountPercentage(props.row) && showDiscount"
                        >
                          [{{Math.round(100 - Number(props.row.sales_ratio))}}% discount]
                        </span>
                      </div>
                    </q-td>
                    <q-td key="unit_price" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                       :props="props"
                       class="font-10px text-right border-left-black border-bottom-none q-pr-sm"
                       :colspan="colsWidth['unit_price']['width']" :style="{'width': colsWidth['unit_price']['width']}">
                      <div
                        v-if="Object.keys(props.row).length && props.row && !props.row.flg_group_title && !props.row.flg_tax_included">
                        <span v-html="getUnitSalesAmount(props.row)" />
                      </div>
                      <div v-else-if="props.row.flg_tax_included">
                        {{ formattedPrice(props.row.unit_sales) ? formattedPrice(props.row.unit_sales) : '' }}
                      </div>
                      <div v-else>
                        {{ formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' }}
                      </div>
                    </q-td>
                    <q-td key="quantity" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']" :props="props"
                          class="font-10px text-center border-left-black border-bottom-none"
                          :colspan="colsWidth['quantity']['width']" :style="{'width': colsWidth['quantity']['width']}">
                      <div v-if="Object.keys(props.row).length && props.row">
                        {{ props.row.quantity > 0 ? roundZeroAfterPoint(props.row.quantity) ? roundZeroAfterPoint(props.row.quantity) :
                        roundZeroAfterPoint(props.row.quantity) : roundZeroAfterPoint(props.row.quantity) }}
                      </div>
                    </q-td>
                    <q-td key="amount_of_money" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                          :props="props" class="font-10px border-left-black border-bottom-none text-right"
                          :colspan="colsWidth['amount_of_money']['width']" :style="{'width': colsWidth['amount_of_money']['width']}">
                      <div v-if="Object.keys(props.row).length && props.row">
                        <template v-if="props.row.flg_tax_included">
                          <span v-if="props.row.flg_tax_included"></span>
                          {{ props.row.type_tax == 1 ? formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' : ''
                          }}
                          {{ props.row.type_tax == 2 ? formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' : ''
                          }}
                          {{ !(props.row.type_tax == 1 || props.row.type_tax == 2) ? formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' : ''
                          }}
                          <span :class="props.row.flg_pet_insurance ? '' : 'invisible'"
                                class="font-9px">
                            @
                          </span>
                        </template>
                        <template v-else-if="!showDiscount && !props.row.flg_group_title">
                          {{ formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' }}
                          <span :class="props.row.flg_pet_insurance  ? '' : 'invisible'">@</span>
                        </template>
                        <template v-else>
                          {{ formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' }}
                          <span :class="props.row.flg_pet_insurance ? '' : 'invisible'">@</span>
                        </template>
                      </div>
                    </q-td>
                    <q-td key="tax_column" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']" :props="props"
                          class="font-10px text-right border-right-black border-bottom-none" :colspan="colsWidth['tax_column']['width']" :style="{'width': colsWidth['tax_column']['width']}">
                      <div> {{ Number(props.row.type_tax) == 3 ? '非' : Number(props.row.type_tax) == 2 ? '軽' : '' }}
                      </div>
                    </q-td>
                  </q-tr>
                </template>
                <template v-if="idx === rows.length - 1" v-slot:bottom-row>
                  <q-tr>
                    <q-td class="border-bottom-none" style="height: 12px !important"></q-td>
                  </q-tr>
                  <template v-for="(row, calcRowIndex) in calcRows" :key="`${calcRowIndex}-${row.key}`">
                    <q-tr :bottom-row="true">
                      <q-td class="border-bottom-none" colspan="30%" style="width: 30%">
                        <div></div>
                      </q-td>
                      <q-td
                        :class="[((calcRowIndex % 2) == '0') ? 'bg-grey-200' : '', row.flgBold ? 'text-weight-bold' : '', calcRowIndex === calcRows.length - 1 ? 'border-bottom-black' : 'border-bottom-none']"
                        :style="{'border-top': calcRowIndex === 0 ? '1px solid #000 !important' : '', 'border-top-left-radius': calcRowIndex === 0 ? '6px' : '', 'border-bottom-left-radius': calcRowIndex === calcRows.length - 1 ? '6px' : ''}"
                        class="font-10px border-left-black" colspan="43%">
                        <div class="q-pl-sm">{{ row.label }}</div>
                      </q-td>
                      <q-td :class="[((calcRowIndex % 2) == '0') ? 'bg-grey-200' : '', calcRowIndex === calcRows.length - 1 ? 'border-bottom-black' : 'border-bottom-none']"
                            :style="{'border-top': calcRowIndex === 0 ? '1px solid #000 !important' : ''}"
                            class="font-10px text-right border-left-black" colspan="25%">
                        {{ row.value }}
                      </q-td>
                      <q-td :class="[((calcRowIndex % 2) == '0') ? 'bg-grey-200' : '', calcRowIndex === calcRows.length - 1 ? 'border-bottom-black' : 'border-bottom-none']"
                        :style="{'border-top': calcRowIndex === 0 ? '1px solid #000 !important' : '', 'border-top-right-radius': calcRowIndex === 0 ? '6px' : '', 'border-bottom-right-radius': calcRowIndex === calcRows.length - 1 ? '6px' : ''}"
                        class="font-10px text-right border-right-black" colspan="2%"
                      >
                        <div></div>
                      </q-td>
                    </q-tr>
                  </template>
                </template>
              </q-table>
              <div v-if="idx === rows.length - 1" class="row q-mt-sm absolute-bottom">
                <div class="col-6">
                  <div class="flex"  style="flex-wrap: nowrap; gap: 15px;">
                    <div v-if="clinic.logo_file_path1">
                      <img :src="clinic.logo_file_path1" style="max-width: 80px; max-height: 80px; object-fit: cover;" />
                      <div v-if="props.data.qrcode" class="q-pt-md">
                        <img :src="props.data.qrcode" alt="QR Code" />
                      </div>
                    </div>
                    <div>
                      <div class="font-13px text-weight-bold">{{ clinic?.name_clinic_display }}</div>
                      <div class="font-10px">
                        {{ concatenate(clinic?.address_prefecture || '', clinic?.address_city || '', clinic?.address_other || '') }}
                      </div>
                      <div class="font-10px">
                        <span>TEL: {{ clinic?.phone1 }}</span>
                      </div>
                      <div class="font-10px" v-if="clinic?.fax">
                        <!-- FAX: {{ String(clinic?.fax).padEnd(11, 'x') }} -->
                        FAX: {{ clinic?.fax }}
                      </div>
                      <div v-if="clinic?.number_invoice_register" class="font-10px">登録番号:
                        {{ clinic.number_invoice_register }}
                      </div>
                      <div class="text-body2" v-if="clinic.memo_slogan">{{ clinic?.memo_slogan }}</div>
                      <template v-if="clinic.memo_bank_info">
                        <div class="font-10px q-mt-sm">銀行振込</div>
                        <div class="font-10px ellipsis-3-lines" v-html="clinic.memo_bank_info" />
                      </template>
                    </div>
                  </div>
                   <div v-if="props.data.barcode" class="text-left">
                        <img :src="props.data.barcode" alt="Barcode" style="max-width: 200px; margin: auto;" />
                    </div>
                </div>
                <div class="col-6">
                  <div class="row font-10px">
                    <div class="col-6 text-right">合計ご請求額</div>
                    <div class="col-6 text-right">
                      {{ props.data.total_sales_amount_intax ? formattedPrice(props.data.total_sales_amount_intax) : '' }} 円
                    </div>
                  </div>
                  <!-- <div class="flex justify-between font-10px">
                    <div class="q-my-xs">保険負担額 @</div>
                    <div class="q-my-xs">
                      {{ props.data.total_amount_insured ? formattedPrice(props.data.total_amount_insured) : '' }} 円
                    </div>
                  </div> -->
                  <div class="row font-10px q-my-xs q-pt-none">
                    <div class="col-6 text-right">
                      保険負担額 @　{{ props.data.total_amount_insured ? formattedPrice(props.data.total_amount_insured) : '' }} 円
                    </div>
                    <div class="col-6 text-right">
                      自己負担額　{{ props.data.total_amount_insured ? formattedPrice(getExcludedInsuredAmount()) : '' }} 円
                    </div>
                  </div>
                  <div class="row font-10px q-pt-none">
                    <div class="col-6 text-right">
                      前回繰越金　{{ formattedPrice(getInstallment()) }} 円
                    </div>
                    <div class="col-6 text-right" v-if="upfrontPaymentDisplay">
                      {{ upfrontPaymentDisplay }}
                    </div>
                    <div class="col-6 text-right" v-if="totalPayment.totalRefund > 0">
                      返金額　{{ formattedPrice(totalPayment.totalRefund) }} 円
                    </div>
                  </div>
                  <div v-if="getWholeLossAmount()" class="flex justify-between font-10px">
                    <div class="q-my-xs">端数調整</div>
                    <div class="q-my-xs">
                      {{ getWholeLossAmount() }} 円
                    </div>
                  </div>
                  <div class="flex justify-between">
                    <div :class="['text-body2', props.data.qrcode ? 'q-mt-md' : 'q-mt-lg']">今回ご請求額</div>
                    <div class="title1 q-mt-md">{{ (formattedPrice(totalInvoiceAmount)) }} 円</div>
                  </div>
                  <q-separator class="q-mt-xs" color="black" />

                  <div style="min-height: 20px;" class="row font-10px q-pt-none">
                    <template v-if="props.data.amount_received && !data.flg_refund">
                      <div class="col-6 flex justify-between">
                        <div>受領額</div>
                        <div class="q-mr-md">{{formattedPrice(props.data.amount_received)}}</div>
                      </div>
                      <div class="col-6 flex justify-between">
                        <div class="q-ml-md">お釣り</div>
                        <div>{{formattedPrice(props.data.amount_change)}}</div>
                      </div>
                    </template>
                  </div>
                  <!-- <div class="flex justify-between font-10px q-my-xs q-pt-none">
                    <div>
                      その他
                    </div>
                    <div class="bg-grey-200">
                      未払い金額 {{ formattedPrice(getInstallment()) }}円
                    </div>
                    <div class="bg-grey-200">
                      前受金 {{ formattedPrice(getUpfrontPayment()) }}円
                    </div>
                  </div> -->
                  <!-- <q-separator class="q-mt-xs" color="black" /> -->
                  <div class="flex justify-between font-10px q-mt-sm q-pt-none">
                    <div>
                      ご入金額
                    </div>
                    <div class="bg-grey-200">
                      現金 {{ formattedPrice(totalPayment?.cash) }} 円
                    </div>
                    <div class="bg-grey-200">
                      ｸﾚｶ決済 {{ formattedPrice(totalPayment?.credit) }} 円
                    </div>
                    <div class="bg-grey-200">
                      他決済 {{ formattedPrice(totalPayment?.other) }} 円
                    </div>
                  </div>
                  <div class="flex justify-end border-bottom-black font-10px">
                    <div class="q-mb-xs">入金合計 {{ formattedPrice(totalPayment?.totalPaid) }}円</div>
                    <!-- <div class="q-mb-xs">入金合計 {{ formattedPrice(getPaidAmount()) }}円</div> -->
                  </div>
                  <div class="flex justify-between font-10px" style="min-height: 20px;">
                    <div class="q-my-xs" v-if="!data.flg_refund">お支払い残高</div>
                    <div class="q-my-xs" v-if="!data.flg_refund">{{ (formattedPrice(totalBillAmountRemaining)) }} 円</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 font-9px border-top-black" :class="props.flgDownloadPdf ? 'q-mb-sm' : ''">
              {{ clinic.memo_bill_message }}
            </div>
          </div>
          <template v-if="idx + 1 != rows.length">
            <div class="html2pdf__page-break"></div>
          </template>
        </div>
      </q-card>
    </div>
  </div>
</template>

<style scoped src="../pdfExport/style.scss"></style>
<style lang="scss" scoped>
@media print {
  @page {
      margin: 0;
      padding: 0;
  }
  body {
      margin: 0;
      padding: 0;
  }
  header, footer {
      display: none !important;
  }
}
body {
  margin: 0;
  padding: 0;
}
.invoice-table {
  border: 0 !important;
  :deep(.q-table) {
    table-layout: fixed;
  }
}
.q-table tbody td {
  height: 20px !important;
}
.border-top-black {
  border-top: 1px solid #000;
}

.border-bottom-black {
  border-bottom: 1px solid #000;
}

.border-left-black {
  border-left: 1px solid #000;
}

.border-right-black {
  border-right: 1px solid #000;
}

.border-black {
  border-color: #000;
}
@media print {
  body {
    margin: 0;
    padding: 0;
    zoom: 1;
  }
  #element-to-print {
    width: 148mm;
    height: 210mm;
  }
}
.side-adjustment-margin-for-iPad {
  margin-left: 12px !important; 
  margin-right: 12px !important;
}
</style>
