<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useClinicStore from '@/stores/clinics'
import {
  dateFormat,
  getDateToday,
  filterRows,
  aahTruncate
} from '@/utils/aahUtils'
import { formattedPrice } from '@/utils/helper'
import { typeWeekday } from '@/utils/enum'
import { date } from 'quasar'

const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const close = () => emits('close')

const props = defineProps({
  resultList: {
    type: Array<any>,
    required: true
  },
  dateParams: {
    type: Object,
    required: true
  }
})

const columns = ref([
  { name: 'number_cart', label: '日付 / 領収#', field: 'number_cart', align: 'left' },
  { name: 'name_customer_display', label: '顧客CD / 顧客名', field: 'name_customer_display', align: 'right' },
  { name: 'name_pet', label: 'ペット名', field: 'name_pet', align: 'right' },
  { name: 'total_modified_sales_amount_notax', label: '診療金額', field: 'total_modified_sales_amount_notax', align: 'right' },
  { name: 'total_cd_disc', label: '割引額', field: 'total_cd_disc', align: 'right' },
  { name: 'total_tax_amount', label: '外税額', field: 'total_tax_amount', align: 'right' },
  { name: 'total_amount_insured', label: '保険負担', field: 'total_amount_insured', align: 'right' },
  { name: 'cart_balance_paid_this_time', label: '未収精算', field: 'cart_balance_paid_this_time', align: 'right' },
  { name: 'total_upfront_payment_used', label: '前受精算', field: 'total_upfront_payment_used', align: 'right' },
  { name: 'total_temp_cash_payment', label: '売上外', field: 'total_temp_cash_payment', align: 'right' },
  { name: 'total_cash_payment', label: '現金入金', field: 'total_cash_payment', align: 'right' },
  { name: 'total_other_payment', label: '現金外入金', field: 'total_other_payment', align: 'right' },
  { name: 'total_refund_payment', label: '返金額', field: 'total_refund_payment', align: 'right' },
  { name: 'total_cart_balance', label: '未収繰越', field: 'total_cart_balance', align: 'right' },
  { name: 'total_upfront_payment_not_used', label: '前受繰越', field: 'total_upfront_payment_not_used', align: 'right' },
  { name: 'payment_method_labels', label: '金種', field: 'payment_method_labels', align: 'right' },
  { name: 'name_employee', label: '会計者', field: 'name_employee', align: 'right' }
]), rows = ref([])

const exportPdf = ref()

const summary = reactive({
  total_carts: null,
  total_modified_sales_amount_notax: null,
  date_difference: null,
  average_per_day: null,
  average: null,
  total_tax_amount: null,
  total_amount_insured: null,
  total_upfront_payment_used: null,
  total_temp_cash_payment: null,
  total_cash_payment: null,
  total_other_payment: null,
  total_refund_payment: null
})

async function init() {
  await nextTick()
  const rowsData = populateRows()
  rows.value = exportPdf.value.populateRows(rowsData, 24, 26)
  await nextTick()
  generateReport()
  close()
}

function generateReport() {
  let jsPDFOptions = { orientation : 'landscape' }
  let imagePDFOptions:any = {quality: 0.1}
  let pagesNumber:Number = 0
  exportPdf.value.generateReport(getFileName(), pagesNumber , jsPDFOptions, imagePDFOptions)
}

function getFileName() {
  const formattedDate = dateFormat(getDateToday(), 'YYYYMMDD');
  const formattedSelectedDayRange = `${dateFormat(props.dateParams.date_start, 'YYMMDD')}_${dateFormat(props.dateParams.date_end, 'YYMMDD')}`;
  return `領収日計_${formattedSelectedDayRange}_${clinicStore.getClinic.name_clinic_display}(出力${formattedDate})`;
}


function populateRows() {
  // Columns we do NOT want to include in the summations
  const excludedColumns = [
    'clinic_display_order',
    // 'total_upfront_payment_used',
    'total_upfront_payment_not_used',
    'total_cart_balance'
  ];
  let rowsData = []
  let sumRow = {flgSumRow: true}
  // calculating daily sum
  for(let i = 0; i < props.resultList.length; i++) {
    let row = props.resultList[i]
    let dailySumRow:any = {number_cart: row.date_cart, flgDateLabelRow: true}
    if(row.carts && row.carts.length && row.carts.length > 0) {
      row.carts.forEach((cart: any) => {
        for(let key in cart) {
          if (!excludedColumns.includes(key) && typeof cart[key] === 'number') {
            if(dailySumRow[key]) dailySumRow[key] += cart[key]
            else dailySumRow[key] = cart[key]
          }
        }
      })
    }
    dailySumRow.name_customer_display = `領収 ${row.carts.length} 件`
    rowsData.push(dailySumRow)
    rowsData.push(...row.carts)
  }
  // calulating final sum
  rowsData.forEach((el: any) => {
    columns.value.forEach((column: any) => {
      if(el[column.field] && typeof el[column.field] === 'number' && !Boolean(el.flgDateLabelRow) && !excludedColumns.includes(column.field)) {
        if(sumRow[column.field]) sumRow[column.field] += el[column.field]
        else sumRow[column.field] = el[column.field]
      }
    })
  })
  sumRow.number_cart = '合計'
  rowsData.push(sumRow)
  rowsData.forEach((row) => {
    for(let key in row) {
      if(typeof row[key] === 'number' && row[key] === 0) {
        row[key] = null
      }
    }    
  })
  // Average row
  let totalCarts:Number = rowsData.filter((el: any) => !el.flgDateLabelRow && !el.flgSumRow).length
  let average:Number = Math.floor(sumRow.total_modified_sales_amount_notax / totalCarts)
  let averageRow:any = {'total_carts': totalCarts, 'average': average, flgAverageRow: true}
  setSummary(sumRow, averageRow)
  
  return rowsData
}

function getJPDay(dateCart: string){
  let day:number = date.getDayOfWeek(dateCart)
  if (day < 7) {
    day = day + 1
  } else {
    day = 1
  }
  return typeWeekday.find((v: any) => v.value === day)?.label
}

function getDaysDifference() {
  const unit = 'days'
  const date1 = props.dateParams.date_start, date2 = props.dateParams.date_end
  return date.getDateDiff(date2, date1, unit) + 1
}

function setSummary(sumRow: Object, averageRow: Object) {
  summary.total_carts = averageRow.total_carts
  summary.total_modified_sales_amount_notax = sumRow.total_modified_sales_amount_notax
  summary.date_difference = getDaysDifference()
  summary.average_per_day = Math.round(averageRow.total_carts / getDaysDifference())
  summary.average = Math.round(sumRow.total_modified_sales_amount_notax / averageRow.total_carts)
  summary.total_tax_amount = sumRow.total_tax_amount
  summary.total_amount_insured = sumRow.total_amount_insured
  summary.total_upfront_payment_used = sumRow.total_upfront_payment_used
  summary.total_temp_cash_payment = sumRow.total_temp_cash_payment
  summary.total_cash_payment = sumRow.total_cash_payment
  summary.total_other_payment = sumRow.total_other_payment
  summary.total_refund_payment = sumRow.total_refund_payment
  summary.total_cart_balance = sumRow.total_cart_balance
}

onMounted(async () => {
  init()
})
</script>
<template>
  <div>
    <PdfExport ref="exportPdf" />
    <div class="q-pa-md page-inner-body text-grey-900 ">
      <q-card id="element-to-print" class="bg-white q-pa-none" square style="max-width: 1200px; margin: auto">
        <div v-for="(page, idx) in rows" :key="idx" class="card-pdf-main q-px-md">
          <div class="flex justify-between q-mt-md">
            <div>
              <div><q-chip square color="primary" class="text-white">日計</q-chip>
                <span class="font-12px text-grey-800 q-mx-sm">
                  [ 期間 ]
                </span>
                <span class="font-12px text-grey-800">
                  {{props.dateParams.date_start}}~{{props.dateParams.date_end}}
                </span>
              </div>
              <div class="font-10px">
                <span class="text-grey-700">
                  追加抽出条件: 
                </span>
                <span>
                  XX
                </span>
              </div>
            </div>
            <div>
              <span class="title">{{ clinicStore.getClinic.code_clinic }} / {{ clinicStore.getClinic.name_clinic_display }}</span>
              <div class="font-10px text-right"><span class="text-grey-700 q-pr-sm">出力日:</span> {{ dateFormat(new Date(), 'YYYY/MM/DD HH:mm') }}</div>
            </div>
          </div>
          
          <div class="q-pa-sm bg-grey-200 font-10px" style="border: 1px solid #000;" v-if="idx === 0">
            <div class="row q-col-gutter-md">
              <div class="col-1"> [集計] </div>
              <div class="col">
                <span>会計件数: {{summary.total_carts}}件</span>
                <span class="q-ml-md">会計税別金額: {{formattedPrice(summary.total_modified_sales_amount_notax)}}円</span>
                <span class="q-ml-md">（期間内診療日数 {{summary.date_difference}}日 / 診療日平均 {{summary.average_per_day}}件)</span>
                <span class="q-ml-md">会計単価: {{formattedPrice(summary.average)}}円</span>
              </div>
            </div>  
            <div class="row q-col-gutter-md">
              <div class="col-1"></div>  
              <div class="col"> 
                <span>外税額: {{formattedPrice(summary.total_tax_amount)}}円</span>
                <span class="q-ml-md">保険負担額: {{formattedPrice(summary.total_amount_insured)}}円</span>
                <span class="q-ml-md">売上外入金: {{formattedPrice(summary.total_temp_cash_payment)}}円</span>
                <span class="q-ml-md">現金入金: {{formattedPrice(summary.total_cash_payment)}}円</span>
                <span class="q-ml-md">現金外入金: {{formattedPrice(summary.total_other_payment)}}円</span>
                <!-- <span class="q-ml-md">Refund: {{formattedPrice(summary.total_refund_payment)}}円</span> -->
                <span class="q-ml-md">累計未収金: {{formattedPrice(summary.total_cart_balance)}}円</span>
              </div>
            </div>
          </div>

          <div class="row full-width">
            <div class="col-12 relative-position" :style="{'min-height': idx === 0 ? '640px' : '690px'}">
              <q-table
                :columns="columns"
                :rows="filterRows(page)"
                :rows-per-page-options="[page.length]"
                class="relative-position "
                flat
                hide-bottom row-key="number" style="table-layout: fixed; width: 100%">
                  <template v-slot:header="props">
                    <q-tr v-if="page.length > 0" :props="props" style="background: transparent">
                      <q-th v-for="(col, idx) in props.cols"
                         class="table-head"
                         :key="col.name"
                         :props="props">
                           <div class="font-10px text-grey-800" style="padding-top: 2px; padding-bottom: 2px;">
                             {{ col.label }}
                           </div>
                      </q-th>
                    </q-tr>
                  </template>
                  <template v-slot:body="props">
                    <q-tr
                      :class="[page[props.rowIndex + 1]?.flgDateLabelRow ? 'date-label-row' : 'table-body-row', props.row.flgDateLabelRow ? 'bg-grey-200' : '']">
                        <q-td key="number_cart" :props="props">
                          <div class="font-10px" :class="props.row.flgSumRow ? 'text-weight-bold text-center font-12px bg-grey-400' : ''">{{ props.row.number_cart }} <span v-if="props.row.flgDateLabelRow" class="q-pl-sm">{{getJPDay(props.row.number_cart)}}</span></div>
                        </q-td>
                        <q-td key="name_customer_display" :props="props">
                          <div class="font-10px text-center">{{ props.row.name_customer_display }}</div>
                        </q-td>
                        <q-td key="name_pet" :props="props">
                          <div class="font-10px"> {{ aahTruncate(props.row.name_pet, 20) }} </div>
                        </q-td>
                        <q-td key="total_modified_sales_amount_notax" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_modified_sales_amount_notax) }}</div>
                        </q-td>
                        <q-td key="total_cd_disc" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_cd_disc) }}</div>
                        </q-td>
                        <q-td key="total_tax_amount" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_tax_amount) }}</div>
                        </q-td>
                        <q-td key="total_amount_insured" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_amount_insured) }}</div>
                        </q-td>
                        <q-td key="cart_balance_paid_this_time" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.cart_balance_paid_this_time) }}</div>
                        </q-td>
                        <q-td key="total_upfront_payment_used" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_upfront_payment_used) }}</div>
                        </q-td>
                        <q-td key="total_temp_cash_payment" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_temp_cash_payment) }}</div>
                        </q-td>
                        <q-td key="total_cash_payment" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_cash_payment) }}</div>
                        </q-td>
                        <q-td key="total_other_payment" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_other_payment) }}</div>
                        </q-td>
                        <q-td key="total_refund_payment" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_refund_payment) }}</div>
                        </q-td>
                        <q-td key="total_cart_balance" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_cart_balance) }}</div>
                        </q-td>
                        <q-td key="total_upfront_payment_not_used" :props="props">
                          <div class="font-10px">{{ formattedPrice(props.row.total_upfront_payment_not_used) }}</div>
                        </q-td>
                        <q-td key="payment_method_labels" :props="props">
                          <div class="font-10px" v-if="!Boolean(props.row.total_cash_payment)">{{ props.row.payment_method_labels }}</div>
                        </q-td>
                        <q-td key="name_employee" :props="props">
                          <div class="font-10px">{{ props.row.name_employee }}</div>
                        </q-td>
                    </q-tr>  
                  </template>
              </q-table>  
              <div class="absolute-bottom full-width font-10px flex justify-between" style="border-top: 2px solid #000;">
                <div>Vetty電子カルテ 発行番号# <span>{{ 'CDAY' + clinicStore.getClinic.code_clinic }}{{ dateFormat(new Date(), 'YYYYMMDDHHmm') }}</span></div>
                <div>Page: {{ idx + 1 }} / {{ rows.length }}</div>
              </div>  
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
<style src="../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
.table-head {
  border-bottom: 2px solid #000;
  font-weight: 400;
}
.table-body-row > td.q-td{
  border-bottom: 1px dotted rgba(0, 0, 0, 0.12);
  height: 24px !important;
  white-space: nowrap !important;
}
.date-label-row > td.q-td {
  height: 24px !important;
  border-bottom: 1px solid $grey-700;
}
</style>