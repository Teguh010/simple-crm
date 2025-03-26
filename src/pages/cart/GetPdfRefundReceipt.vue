<script lang="ts" setup>
import { nextTick, onMounted, ref, reactive } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useClinicStore from '@/stores/clinics'
import usePaymentStore from '@/stores/payment'
import useCustomerStore from '@/stores/customers'
import html2pdf from 'html2pdf.js'
import { storeToRefs } from 'pinia'
import {
  formatDate,
  getDateToday
} from '@/utils/aahUtils'
import { formattedPrice } from '@/utils/helper'

const props = defineProps({
  data: Object,
  refundPdfAttributes: { render: Boolean },
  callback: Function,
  flgDownloadPdf:Boolean
})

const clinicStore = useClinicStore()
const paymentStore = usePaymentStore()
const customerStore = useCustomerStore()
const { getPayments } = storeToRefs(paymentStore)

const closeUpdDialogFlg = ref(false)
const exportPdf = ref()
const refundData = reactive({
  refund_date: '',
  refund_amount: '',
  refund_memo: props.data.memo_refund
})

function populateData() {
  if(getPayments.value && getPayments.value.refund_conducted_list && getPayments.value.refund_conducted_list.length > 0) {
    const firstRefundConducted = getPayments.value.refund_conducted_list[0]
    refundData.refund_date = firstRefundConducted.datetime_refund_conducted
    refundData.refund_amount = getPayments.value.refund_conducted_list.reduce((totalRefundAmount, payment) => totalRefundAmount + Number(payment.amount_refund), 0).toFixed(0)
  }  
}

function generateReport() {
  let imagePDFOptions: any = { quality: 0.85 }, jsPDFOptions: any = { format: 'a5', orientation: 'landscape' }, pagesNumber: Number = 0
  exportPdf.value.generateReport(getFileName(), pagesNumber, jsPDFOptions, imagePDFOptions)
}

function getFileName() {
  let customerName: any = customerStore.getAllCustomers.find((customer: any) => customer.value === props.data.id_customer)?.name_customer_display
  return `${getDateToday()}_${customerName}様`
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
      orientation: 'landscape',
      format: [148, 210]
    },
    pagebreak: {
      mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
      avoid: 'img'
    }
  }

  const iframePdf = document.querySelector(`[refundReceiptPdf="${true}"]`)
  if (iframePdf) iframePdf.remove()
  html2pdf().set(options).from(element).toPdf().get('pdf').then(function(pdf) {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('refundReceiptPdf', true)
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
    props.refundPdfAttributes.render = false
  })
}

async function init() {  
  populateData()
  await nextTick()
  if (props.callback) {
    let imagePDFOptions: any = { quality: 0.85 }, jsPDFOptions: any = {format: 'A5', orientation: 'landscape'}, pagesNumber: Number = 0
    return exportPdf.value.getPdfBlob(getFileName(), pagesNumber, jsPDFOptions, imagePDFOptions).then((blob: Blob) => {
      props.callback(blob, `${getFileName()}.pdf`)
    })
  }
  if (props.flgDownloadPdf) {
    generateReport()
    return close()
  }
  return generateAndPrintPDF()
}

onMounted(() => {
  init()
})
</script>

<template>
  <div ref="modelBodyRef" v-close-popup="closeUpdDialogFlg" v-show="false">
    <PdfExport ref="exportPdf" sheetName="_注文書" />
    <div class="q-pt-none page-inner-body text-grey-900">
      <q-card id="element-to-print" class="bg-white" square :style="{'max-width': '1000px', 'margin': 'auto'}">
        <div class="card-pdf-main q-px-md q-pt-md refund-receipt-pdf relative-position" style="min-height: 550px;">
          <div class="text-center text-weight-medium font-24px title">返金受領証</div>
          <div class="q-mt-md flex justify-between items-end">
            <div class="q-px-lg q-pb-sm clinic-name flex items-end">
              <div class="font-16px"> {{clinicStore.getClinic?.name_clinic_display}} </div>
              <div class="q-ml-lg font-12px">御中</div>
            </div>
            <div class="text-grey-900">
              <span class="q-mr-lg">発行日</span> {{ formatDate(refundData.refund_date) }}
            </div>  
          </div>

          <div class="q-mt-lg flex justify-center items-center refund-amount-section text-center">
            <span class="font-16px text-weight-medium q-mr-lg" style="position: relative; top: 4px;">金額</span>
            <span class="font-24px text-weight-medium">￥ {{ formattedPrice(refundData.refund_amount) }} -</span>
          </div>

          <div class="refund-memo-section q-mt-md q-pa-sm font-12px">
            <div>備考</div>
            <div v-html="refundData.refund_memo" />
          </div>

          <div class="row text-grey-900 absolute-bottom q-px-md q-mb-md">
            <div class="col-5 q-pr-md">
              <div class="q-mb-sm">上記の金額を受領しました。</div>
              <div class="text-right border-bottom q-mb-sm">年　　　月　　　日</div>
            </div>
            <div class="col-7 q-pl-md">
              <div class="border-bottom q-mb-sm">お名前</div>
              <div class="border-bottom q-mb-sm">ご住所</div>
              <div class="border-bottom q-mb-sm">お名前</div>
              <div class="border-bottom q-mb-sm">ご連絡先 <span style="margin-left: 150px;">（　　　　　）</span></div>
            </div>
          </div>
        </div>
      </q-card>
    </div>
  </div>
</template>

<style scoped src="../pdfExport/style.scss"></style>
<style lang="scss" scoped>
.refund-receipt-pdf {
  .title {
    letter-spacing: 20px;
  }
  .clinic-name {
    border-bottom: 2px solid #C04040;
  }
  .refund-amount-section {
    height: 51px;
    background: rgba(224, 140, 140, .2);
  }
  .refund-memo-section {
    border: 1px solid #C04040;
    height: 70px;
  }
  .border-bottom {
    border-bottom: 1px solid #000000 !important;
  }
}
</style>