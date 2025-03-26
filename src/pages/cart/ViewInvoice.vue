<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCustomerStore from '@/stores/customers'
import useClaimStore from '@/stores/claim'
import usePaymentStore from '@/stores/payment'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'
import { groupBy } from 'lodash'
import {
  concatenate,
  customRound,
  dateFormat,
  decimalToFraction,
  getPetFirstName,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import { formatDecimalNumber, formattedPrice, numberFormat } from '@/utils/helper'
import useDoseStore from '@/stores/dose-frequencies'

const customerStore = useCustomerStore()
const paymentStore = usePaymentStore()
const { getPayments, getPaymentList, getCartPayments } = storeToRefs(paymentStore)
const claimStore = useClaimStore()
const { getClaimByCart } = storeToRefs(claimStore)

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

const props = defineProps({
  data: Object,
  flg_display_cart_detail_discount: {
    type: Boolean,
    default: false
  }
})

const petWiseData = ref({})
const cartClaim = ref(null)
const calcRows: any = ref([])
const showDiscount = ref(props.flg_display_cart_detail_discount)
const totalIntaxRef = ref(0)
const showDetail = ref(true)

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

const getDiseaseName = () =>{
  let name_disease, type_insurance_purpose, code_insurer

  if (!(cartClaim.value && cartClaim.value.length > 0)) return

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

const getTotalInvoiceAmount = () => {
  const totalAmount = 
    Number(props.data.bill) - 
    Number(getAmountLoss()) +
    Number(getUpfrontPayment()) + 
    Number(getInstallment());
  
  return totalAmount;
}

const getTotalBillAmount = () => {
  const amountInstallment = props.data.cart_details.find((detail) => detail.flg_group_title && detail.group_detail?.cb_installment)?.group_detail?.amount_installment || 0

  if (amountInstallment > 0) {
    return (getPaidAmount()) - (getTotalInvoiceAmount() + Number(amountInstallment) + getUpfrontReceivedAmount())
  }

  return (getPaidAmount()) - (getTotalInvoiceAmount() + getUpfrontReceivedAmount())
}

const getUpfrontReceivedAmount = () => {
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

const getPaidAmount = () => {
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

const getUpfrontPayment = () => {
  let amount_upfront_received = 0
  if (getPayments.value && getPayments.value.upfront_payment_list && getPayments.value.upfront_payment_list.length > 0) {
    getPayments.value.upfront_payment_list.filter((payment: any) => payment.id_cart == props.data.id_cart).map((payment: any) => {
      amount_upfront_received += parseInt(Number(payment.amount_upfront_received))
    })
  }

  return amount_upfront_received
}

const getTotalPaymentReceived = (method: any) => {
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

const getUnitSalesAmount = (row: Object) => {
  const defaultSalesRatio: number = 100
  if (showDiscount.value && row.sales_ratio && row.sales_ratio != defaultSalesRatio) {
    return `<span><s class="q-mr-sm">${formattedPrice(row.unit_price)}</s>${formattedPrice(row.unit_sales)}</span>`
  }
  return `<span>${formattedPrice(row.unit_price) ? formattedPrice(row.unit_price) : ''}</span>`
}

const handleShowDetail = () => {
  showDetail.value = !showDetail.value

  return showDetail
}

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

const totalInvoiceAmount = computed(() => {
  return (Number(props.data.bill) - Number(totalPayment.value.loss) + Number(getInstallment()))
})

const totalBillAmountRemaining = computed(() => {
  // TODO: may be need to consider insurance too
  let amountInstallment = 0
  if (getInstallment() > 0) {
    amountInstallment = getInstallment()
  }
  return props.data.bill + amountInstallment - totalPayment.value.totalBillPaid - totalPayment.value.loss
})

const init = async () => {
  
  cartClaim.value = getClaimByCart.value
  let cart_details = props.data.cart_details

  petWiseData.value = groupBy(cart_details.filter((cd) => cd.group_detail && !cd.group_detail.cb_installment), (cd) => cd?.id_pet?.id_pet ? cd.id_pet.id_pet : 'no_pet')

  let keys: any = Object.keys(petWiseData.value)
  // sort based on date
  Object.keys(petWiseData.value).forEach((key, idx) => {
    petWiseData.value[key] = petWiseData.value[key].sort((a: any, b: any) => {
      return new Date(a.date_order_start).getTime() - new Date(b.date_order_start).getTime()
    })
  })

  let rowsData: any = []
  Object.keys(petWiseData.value).forEach((key, idx) => {
    let cartDetailPet: any = petWiseData.value[key][0]?.id_pet
    let customer: any = customerStore.getAllCustomers.find((customer: any) => customer.value === cartDetailPet?.id_customer)
    let fullPetName = getPetFirstName(cartDetailPet)

    if (fullPetName) {
      rowsData.push({ 
        'name_pet': fullPetName, 
        flg_name_pet: true, 
        flg_other: false 
      })

      if (props.data.name_insured_disease) {
        rowsData.push({
          name_insured_disease: props.data.name_insured_disease,
          flg_insured_disease: true
        })
      }
    }

    if (key === 'no_pet') {
      rowsData.push({ 'name_pet': 'その他 ', flg_name_pet: true, flg_other: true })
    }

    petWiseData.value[key].forEach((item, idx) => {
      if (item.group_detail && !(item.group_detail.flg_group_item || item.group_detail.cb_installment)) {

        let flg_tax_included = item.group_detail.flg_tax_included
        let amount_sales = item.amount_sales
        let unit_sales = item.unit_sales
        let quantity = item.quantity
        let discounted_amount = item.amount_detail_discounted
        let sales_ratio = item.sales_ratio
        if (!item.flg_group_title) {
          amount_sales = Number(item.amount_sales).toFixed(0)
          unit_sales = Number(item.unit_sales).toFixed(0)
          discounted_amount = Number(item.amount_detail_discounted).toFixed(0)
          sales_ratio = Number(item.sales_ratio).toFixed(0)
          quantity = item.quantity
        }

        if (item.flg_group_title) {
          amount_sales = Number(item.group_detail.amount_sales).toFixed(0)
          unit_sales = Number(item.group_detail.unit_sales).toFixed(0)
          discounted_amount = Number(item.group_detail.amount_detail_discounted).toFixed(0)
          sales_ratio = Number(item.group_detail.sales_ratio).toFixed(0)
          quantity = item.group_detail.quantity ?? item.quantity
        }

        if (item.flg_group_title && item.group_detail.cb_installment) {
          amount_sales = Number(item.group_detail.amount_installment).toFixed(0)
          quantity = null
          unit_sales = null
        }

        rowsData.push({
          ...item,
          flgShowDateStart: idx === 0 ? true : petWiseData.value[key][idx]['date_order_start'] === petWiseData.value[key][idx - 1]['date_order_start'] ? false : true,
          flg_tax_included: flg_tax_included,
          amount_sales: amount_sales,
          unit_sales: unit_sales,
          quantity: quantity,
          discounted_amount: discounted_amount,
          sales_ratio: sales_ratio
        })
      }
    })
  })

  keys =
    [
      { key: 'total_sales_amount_notax', show: true, label: '小計' },
      {
        key: 'total_discount_notax',
        show: (parseInt(props.data['total_ch_disc_notax']) || parseInt(props.data['total_cd_disc']) ) ?? false,
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
        flg_upfront_payment: true,
        name_cart_item_display:  `前受け金 ${formattedPrice(totalPayment.value.totalUpfrontReceived)}円`,
        amount_price: totalPayment.value.totalUpfrontReceived
      }
    )  
  }
  if(totalPayment.value.totalRefund > 0 ) {
    rowsData.push(
      {
        flg_upfront_payment: true,
        name_cart_item_display: `返金 ${formattedPrice(totalPayment.value.totalRefund)}円`,
        amount_price: totalPayment.value.totalRefund
      }
    )  
  }
  await nextTick()
  rows.value.push(...rowsData, {flg_insurance_applicable_text: true})

}

const showDiscountPercentage = (row) => {
  if (row?.sales_ratio == null) return false
  const salesRatio = Number(row.sales_ratio) 
  return Number.isFinite(salesRatio) && Math.round(100 - salesRatio) !== 0
}


const getFractionFromValDosage = (value) => {
  const temValue = value?.val_dosage_decided?.toString()
  let partialPart = 0
  let fullPart = 0

  if (value?.val_dosage_decided) {
    fullPart = parseInt(value?.val_dosage_decided)
  }

  if (
    temValue &&
    temValue.includes('.') &&
    temValue.split('.').length &&
    temValue.split('.').length >= 2
  ) {
    const fractionalPart = parseFloat(`0.${temValue.split('.')[1]}`)
    fractionalPart > 0 ? partialPart = fractionalPart : 0 // Ensure there is a fractional part
  }

  if (fullPart && partialPart) {
    return `${
      fullPart
    } + ${decimalToFraction(partialPart)}`
  }


  if (fullPart && !partialPart) {
    return `${fullPart}`
  }

  if (partialPart) {
    return `${decimalToFraction(partialPart)}`
  }

}


const getCalculatedTotalDosage = (pd) => {
  let quantity_dose = useDoseStore().getAllDoses.find(
    (dose: any) =>
      dose.value == pd?.id_dosage_frequency
  )?.quantity_dose ?? 1

  return Math.ceil(
    roundZeroAfterPoint(pd.total_days_dose) *
    Number(quantity_dose ?? 1) ?? 1
  )
}
const getFractionForWhole = (pd, pa) => {

  const calculatedTotalDosage = getCalculatedTotalDosage(pd)

  const totalPill = Number(calculatedTotalDosage) * Number(pa.val_dosage_decided)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {

    if (parseInt(Number(totalPill)) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
}


init()
</script>
<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        診療明細
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content content-height">
      <div class="row full-width q-mt-xs card-pdf-main full-height">
        <div class="col-7 relative-position q-pr-sm" :style="{ width: showDetail ? '' : '100% !important'}">
          <q-scroll-area
            style="height: calc(100vh - 220px);"
            class="q-pr-sm full-height"
          >  
          <q-table 
            :columns="columns" 
            :rows="rows" 
            :rows-per-page-options="[rows.length]"
            class="relative-position invoice-table"
            flat
            hide-bottom row-key="number" style="table-layout: fixed; width: 100%;"
          >    
            <template v-slot:header="props">
              <q-tr 
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
                  <div class="text-center font-20px" style="padding-top: 2px; padding-bottom: 2px;">
                    {{ col.label }}
                  </div>
                </q-th>
              </q-tr>
            </template>

            <template v-slot:body="props">
              <q-tr v-if="props.row.flg_name_pet" :props="props">
                <q-td :class="[((props.rowIndex + idx) % 2 == '0') ? 'bg-grey-200' : '']"
                  class="border-left-black border-right-black border-bottom-black font-20px" colspan="100%">
                  <div class="flex justify-between items-center">
                    <div> {{ props.row.name_pet }}</div>
                    <div v-if="!props.row?.flg_other" class="q-mx-md">
                      <span class="q-mr-sm"> {{ getDiseaseName() }} </span>
                      <span v-if="cartClaim && cartClaim?.length">発症日: {{ dateFormat(cartClaim[0]?.onset_date) }} </span>
                    </div>
                  </div>
                </q-td>
              </q-tr>
              <q-tr v-else-if="props.row.name_insured_disease" :props="props">
                <q-td 
                  :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                  class="border-left-black border-right-black border-bottom-black font-20px" 
                  colspan="100%"
                >
                  <span class="text-grey-8">{{ props.row.name_insured_disease }}</span>
                </q-td>
              </q-tr>
              <q-tr v-else-if="props.row.flgTotalRow">
               <q-td :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                 class="text-center table-cell-custom-border font-20px" colspan="100">
                 <div class="text-right">
                   <span class="text-center q-mr-lg">内消費税（8%） {{ numberFormat(formattedPrice(data?.vat08_tax)) }}</span>
                   <span class="fw-300 col-2 text-center"> 内消費税（10%） {{ numberFormat(formattedPrice(data.vat10_tax)) }}</span>
                 </div>
               </q-td>
              </q-tr>
              <q-tr v-else-if="props.row.flg_insurance_applicable_text">
                <q-td :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                  class="border-left-black border-bottom-black border-right-black border-top-black font-20px" colspan="100%"
                  :style="{ 'border-bottom-left-radius': '6px', 'border-bottom-right-radius': '6px' }">
                    <div class="text-right">@：保険適用項目</div>
                </q-td>
              </q-tr>
              <q-tr v-else>
                <q-td key="treatment_detail"
                  :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '', 'border-bottom-none border-left-black']"
                  :props="props" colspan="68%" :calcIndex="props.row.calcIndex" style="width: 68%"
                  class="font-20px"
                >  
                  <div v-if="Object.keys(props.row).length" class="flex" style="flex-wrap: nowrap;">
                    <div v-if="props.row.flgShowDateStart" style="min-width: 120px;">
                      <span>{{ props.row.date_order_start }}</span>
                    </div>
                    <div v-else style="min-width: 120px;"></div>
                    <div class="ellipsis" style="max-width: 620px;" :class="props.row?.name_cart_item_display && props.row?.name_cart_item_display?.length > 25 ? '' : 'font-26px'"> 
                      {{ props.row.name_cart_item_display ? props.row.name_cart_item_display : '' }}
                      <div v-if="props.row?.id_prescription_detail">
                        <div
                          v-if="props.row?.id_prescription_detail && props.row?.id_prescription_detail.type_detail == 1"
                          class="q-px-md q-mb-sm caption1 regular ">
                            <span v-if="props.row?.id_prescription_detail.name_medicine_format == '錠'"
                                  class="q-mr-md">
                              1回分：{{ getFractionFromValDosage(props.row?.prescriptionAssort) }}
                            </span>
                          <span v-else
                                class="q-mr-md ">1回分：{{ props.row?.prescriptionAssort.val_dosage_decided
                            }}</span>
                          <span>{{ useDoseStore().getAllDoses.find((dos) => dos.value == props.row?.id_prescription_detail.id_dosage_frequency)?.label
                            }}
                            </span>
                          <div class="caption1 regular q-my-sm flex items-center">
                              <span v-if="props.row?.id_prescription_detail.total_days_dose">
                                総服用日数：
                                {{ formatDecimalNumber(props.row?.id_prescription_detail.total_days_dose)
                                }}日間
                              </span>
                            <span v-if="props.row?.id_prescription_detail.total_amount_dose"
                                  class="q-px-md">
                                総服用回数：{{ formatDecimalNumber(props.row?.id_prescription_detail.total_amount_dose)
                              }}回
                              </span>
                          </div>
                          <div class="caption1 regular q-my-sm flex items-center">                              
                              <span v-if="props.row?.id_prescription_detail.name_medicine_format == '錠'"
                                    class="q-mr-md">
                                服用総数：
                                {{ parseInt(customRound(Number(getCalculatedTotalDosage(props.row?.id_prescription_detail)) * Number(props.row?.prescriptionAssort.val_dosage_decided))) > 0 ?
                                `${parseInt(customRound(Number(getCalculatedTotalDosage(props.row?.id_prescription_detail)) * Number(props.row?.prescriptionAssort.val_dosage_decided)))} ` : ''
                                }} 
                                {{ getFractionForWhole(props.row?.id_prescription_detail, props.row?.prescriptionAssort)
                                }} 錠
                              </span>
                            <span v-else class="q-mr-md">
                                服用総数：{{ roundZeroAfterPoint(customRound(props.row?.prescriptionAssort.val_dosage_decided * getCalculatedTotalDosage(props.row?.id_prescription_detail)))
                              }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div v-if="props.row?.flg_group_title" class="">
                        <div
                          v-for="(prescriptionDetailGroup, cartIndexP) in useCartStore().getCart.cart_details.filter((nCd) =>  props.row?.group_detail.id_cart_detail_list.includes(nCd.id_cart_detail))"
                          class="caption1 regular q-mt-sm  full-width"
                        >
                          <div
                            v-if="prescriptionDetailGroup.id_service_detail || prescriptionDetailGroup.id_inject_detail"
                            class="row q-px-md q-mb-sm" @click="">
                            <div class="caption1 q-mb-sm col-6">
                              <span class="list">{{ cartIndexP + 1 }} -</span>
                              {{ prescriptionDetailGroup.name_cart_item_display }}
                            </div>
                          </div>
                          <div
                            v-if="prescriptionDetailGroup.id_prescription_detail && prescriptionDetailGroup.id_prescription_detail.type_detail == 1"
                            class="q-px-md q-mb-sm">
                            <div v-if="prescriptionDetailGroup.id_prescription_detail_assort" class="row" @click="">
                              <div class="caption1 q-mb-sm col-6">
                                <span class="list">{{ cartIndexP + 1 }} -</span>
                                {{ prescriptionDetailGroup.name_cart_item_display }}
                              </div>
                            </div>
                            <span v-if="prescriptionDetailGroup.id_prescription_detail.name_medicine_format == '錠'"
                                  class="q-mr-md">
                              1回分：{{ getFractionFromValDosage(prescriptionDetailGroup?.prescriptionAssort) }}
                            </span>
                            <span v-else
                                  class="q-mr-md">1回分：{{ roundZeroAfterPoint(prescriptionDetailGroup?.prescriptionAssort.val_dosage_decided, 2)
                              }}</span>
                            <span>{{ useDoseStore().getAllDoses.find((dos) => dos.value == prescriptionDetailGroup.id_prescription_detail.id_dosage_frequency)?.label }}
                            </span>
                            <div class="caption1 regular q-my-sm flex items-center">
                              <span v-if="prescriptionDetailGroup.id_prescription_detail.total_days_dose">
                                総服用日数：
                                {{ formatDecimalNumber(prescriptionDetailGroup.id_prescription_detail.total_days_dose)
                                }}日間
                              </span>
                              <span v-if="prescriptionDetailGroup.id_prescription_detail.total_amount_dose"
                                    class="q-px-md">
                                総服用回数：{{ formatDecimalNumber(prescriptionDetailGroup.id_prescription_detail.total_amount_dose)
                                }}回
                              </span>
                            </div>
                            <div class="caption1 regular q-my-sm flex items-center">                              
                              <span v-if="prescriptionDetailGroup.id_prescription_detail.name_medicine_format == '錠'"
                                    class="q-mr-md">
                                服用総数：
                                {{ parseInt(customRound(Number(getCalculatedTotalDosage(prescriptionDetailGroup.id_prescription_detail)) * Number(prescriptionDetailGroup.prescriptionAssort.val_dosage_decided))) > 0 ?
                                `${parseInt(customRound(Number(getCalculatedTotalDosage(prescriptionDetailGroup.id_prescription_detail)) * Number(prescriptionDetailGroup.prescriptionAssort.val_dosage_decided)))} ` : ''
                                }} 
                                {{ getFractionForWhole(prescriptionDetailGroup.id_prescription_detail, prescriptionDetailGroup.prescriptionAssort)
                                }} 錠
                              </span>
                              <span v-else class="q-mr-md">
                                服用総数：{{ roundZeroAfterPoint(customRound(prescriptionDetailGroup.prescriptionAssort.val_dosage_decided * getCalculatedTotalDosage(prescriptionDetailGroup.id_prescription_detail)))
                                }}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span 
                      style="flex: 1; text-align: right;"
                      v-if="showDiscountPercentage(props.row)"
                    >
                      [{{Math.round(100 - Number(props.row.sales_ratio))}}% discount]
                    </span>
                  </div>
                </q-td>
                <q-td key="unit_price" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']" :props="props"
                  class="text-right border-left-black border-bottom-none q-pr-sm font-20px"
                  colspan="16%" style="width: 16%">
                    <div v-if="Object.keys(props.row).length && props.row">
                      <span v-if="!props.row.flg_group_title" v-html="getUnitSalesAmount(props.row)" />
                      <span v-if="props.row.flg_group_title">{{ formattedPrice(props.row?.group_detail?.unit_sales)
                        }}</span>
                    </div>
                  </q-td>
                  <q-td key="quantity" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']" :props="props"
                    class="text-center border-left-black border-bottom-none font-20px"
                    colspan="7%" style="width: 7%"
                  >  
                    <div v-if="Object.keys(props.row).length && props.row">
                      {{ props.row.quantity > 0 ? roundZeroAfterPoint(props.row.quantity) ? roundZeroAfterPoint(props.row.quantity) : '' : '' }}
                    </div>
                  </q-td>
                  <q-td key="amount_of_money" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']"
                    :props="props" class="border-left-black border-bottom-none text-right font-26px" 
                    colspan="8%" style="width: 8%"
                  >  
                    <div v-if="Object.keys(props.row).length && props.row">
                      <template v-if="props.row.flg_tax_included">
                        <span v-if="props.row.flg_tax_included"></span>
                        {{ props.row.type_tax == 1 ? formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' : ''
                        }}
                        {{ props.row.type_tax == 2 ? formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' : ''
                        }}
                        {{ !(props.row.type_tax == 1 || props.row.type_tax == 2) ? formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' : ''
                        }}
                        <span :class="props.row.flg_pet_insurance ? '' : 'invisible'">
                            @
                        </span>
                      </template>
                      <template v-else-if="!showDiscount">
                        <span v-if="!props.row.flg_group_title">
                          {{ formattedPrice(props.row.amount_price) ? formattedPrice(props.row.amount_price) : '' }} 
                        </span>
                        <span v-if="props.row.flg_group_title">
                          {{ formattedPrice(props.row.group_detail.amount_sales) ? formattedPrice(props.row.group_detail.amount_sales) : ''
                          }}
                        </span>
                        <span :class="props.row.flg_pet_insurance ? '' : 'invisible'">@</span>
                      </template>
                      <template v-else>
                        {{ formattedPrice(props.row.amount_sales) ? formattedPrice(props.row.amount_sales) : '' }}
                        <span :class="props.row.flg_pet_insurance  ? '' : 'invisible'">@</span>
                      </template>
                    </div>
                  </q-td>
                  <q-td key="tax_column" :class="[((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '']" :props="props"
                    class="text-right border-right-black border-bottom-none font-20px" colspan="1%" style="width: 1%">
                      <div> {{ Number(props.row.type_tax) == 3 ? '非' : Number(props.row.type_tax) == 2 ? '軽' : '' }}</div>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div class="col-12 q-mt-md">
              <template v-for="(row, calcRowIndex) in calcRows" :key="`${calcRowIndex}-${row.key}`">
                <div class="flex">
                  <div
                    :class="[((calcRowIndex % 2) == '0') ? 'bg-grey-200' : '', row.flgBold ? 'text-weight-bold' : '', calcRowIndex === calcRows.length - 1 ? 'border-bottom-black' : 'border-bottom-none']"
                    :style="{'flex-basis': '60%', 'border-top': calcRowIndex === 0 ? '1px solid #000 !important' : '', 'border-top-left-radius': calcRowIndex === 0 ? '6px' : '', 'border-bottom-left-radius': calcRowIndex === calcRows.length - 1 ? '6px' : ''}"
                    class="border-left-black font-20px height-48 flex items-center">
                      <div class="q-pl-sm">{{ row.label }}</div>
                  </div>
                  <div
                    :class="[((calcRowIndex % 2) == '0') ? 'bg-grey-200' : '', calcRowIndex === calcRows.length - 1 ? 'border-bottom-black' : 'border-bottom-none']"
                    :style="{'flex-basis': '38%', 'border-top': calcRowIndex === 0 ? '1px solid #000 !important' : ''}"
                    class="text-right border-left-black font-26px height-48 flex items-center justify-end">
                    {{ row.value }}
                  </div>
                  <div
                    :class="[((calcRowIndex % 2) == '0') ? 'bg-grey-200' : '', calcRowIndex === calcRows.length - 1 ? 'border-bottom-black' : 'border-bottom-none']"
                    :style="{'flex-basis': '2%', 'border-top': calcRowIndex === 0 ? '1px solid #000 !important' : '', 'border-top-right-radius': calcRowIndex === 0 ? '6px' : '', 'border-bottom-right-radius': calcRowIndex === calcRows.length - 1 ? '6px' : ''}"
                    class="text-right border-right-black font-20px height-48 flex items-center" colspan="2%"
                  >     
                    <div></div>
                  </div>
                </div>
              </template>
            </div>
           </q-scroll-area>  
          </div>
          <div class="row col-5 q-pl-sm light-shadow-left" v-if="showDetail">
            <div class="col-12 q-mt-md font-20px">
              <div>
                <q-btn 
                  @click="handleShowDetail()"
                  icon="chevron_right" 
                  fab
                  flat
                  color="primary"
                  class="absolute right q-mr-md"
                  style="top: 10%; right: 0%; transform: translateY(-50%);"
                />
              </div>
              <div class="flex justify-between q-mt-xl">
                <div>合計ご請求額</div>
                <div class="font-26px">
                  {{ showDiscount ? formattedPrice(props.data.total_sales_amount_intax) : formattedPrice(totalIntaxRef)
                  }} 円
                </div>
              </div>
              <div class="flex justify-between">
                <div class="q-my-xs">保険負担額 @</div>
                <div class="q-my-xs font-26px">
                  {{ props.data.total_amount_insured ? formattedPrice(props.data.total_amount_insured) : '' }} 円
                </div>
              </div>
              <div v-if="getWholeLossAmount()" class="flex justify-between">
                <div class="q-my-xs">端数調整</div>
                <div class="q-my-xs font-26px">
                  {{ getWholeLossAmount() }} 円
                </div>
              </div>
              <div class="flex justify-between bg-accent-200 q-pa-md">
                <div class="q-mt-md">今回ご請求額</div>
                <div class="font-30px text-weight-bold q-mt-md">{{ (formattedPrice(totalInvoiceAmount)) }} 円</div>
              </div>
              <q-separator class="q-my-md" color="black" />
              <div class="flex justify-between q-mt-md" v-if="totalPayment.upfrontReceived > 0">
                <div>前受金</div>
                <div class="bg-grey-200"> {{ formattedPrice(totalPayment.upfrontReceived) }}円</div>
              </div>
              <div class="flex justify-between q-my-md" v-if="totalPayment.upfrontUsed > 0">
                <div>前受清算</div>
                <div class="bg-grey-200"> {{ formattedPrice(totalPayment.upfrontUsed) }}円</div>
              </div>
              <div class="flex justify-between q-my-md">
                <div>未払い金額</div>
                <div class="bg-grey-200"> {{ formattedPrice(getInstallment()) }}円</div>
              </div>
              <q-separator class="q-my-md" color="black" />
              <div class="flex justify-between q-py-sm">
                <div>ご入金額</div>
                <div class="bg-grey-200"> 現金 {{ formattedPrice(totalPayment?.cash) }}円</div>
                <div class="bg-grey-200"> ｸﾚｶ決済 {{ formattedPrice(totalPayment?.credit) }}円</div>
                <div class="bg-grey-200">他決済 {{ formattedPrice(totalPayment?.other) }}円</div>
              </div>
              <div class="flex justify-end border-bottom-black q-my-sm">
                <div class="q-mb-md">入金合計 {{ formattedPrice(totalPayment?.totalPaid) }}円</div>
              </div>
              <div class="flex justify-between">
                <div class="q-my-xs">累計繰越金</div>
                <div class="q-my-xs">{{ (formattedPrice(totalBillAmountRemaining)) }} 円</div>
              </div>
            </div>
          </div>
          <q-btn 
            v-show="!showDetail"
            @click="handleShowDetail()"
            icon="chevron_left" 
            fab
            flat
            color="primary"
            class="absolute right q-mr-md bg-white"
            style="top: 10%; right: 0%; transform: translateY(-50%);"
          />
        </div>
    </q-card-section>
  </div>
</template>
<style scoped src="../pdfExport/style.scss"></style>
<style lang="scss" scoped>
.invoice-table {
  border: 0 !important;
}
.q-table tbody td {
  height: 48px !important;
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
.height-48 {
  height: 48px;
}
.content-height {
  height: calc(100vh - 108px) !important;
}
.full-height {
  height: 100%;
}
.bordered-circle {
  border: 2px solid currentColor;
  border-radius: 50%;
  padding: 4px;
}
.light-shadow-left {
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
}
</style>
