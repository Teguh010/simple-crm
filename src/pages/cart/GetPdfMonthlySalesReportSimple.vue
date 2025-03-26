<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useClinicStore from '@/stores/clinics'
import {
  dateFormat,
  getDateToday,
  filterRows
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
  date_start: String
})

const exportPdf = ref()

const summary = reactive({
  total_carts: null,
  total_no_tax_amount: null,
  distinct_cart_days: null,
  average_per_day: null,
  average: null,
  total_tax_amount: null,
  total_temp_cash_payments: null,
  total_amount_insured: null,
  total_valid_payments: null,
  total_cash_payments: null,
  total_creditcard_payments: null,
  total_other_payments: null
})

const columns = ref([
  { name: 'date_cart', label: '日付', field: 'date_cart', align: 'left' },
  { name: 'total_carts', label: '件数', field: 'total_carts', align: 'right' },
  { name: 'total_no_tax_amount', label: '診療金額/税抜', field: 'total_no_tax_amount', align: 'right' },
  { name: 'total_tax_amount', label: '外税額', field: 'total_tax_amount', align: 'right' },
  { name: 'total_temp_cash_payments', label: '売上外', field: 'total_temp_cash_payments', align: 'right' },
  { name: 'total_amount_insured', label: '保険負担', field: 'total_amount_insured', align: 'right' },
  { name: 'total_sales_amount_intax', label: '診療金額/税込', field: 'total_sales_amount_intax', align: 'right' },
  { name: 'total_valid_payments', label: '入金額', field: 'total_valid_payments', align: 'right' },
  { name: 'total_cash_payments', label: '内訳 > 現金', field: 'total_cash_payments', align: 'right' },
  { name: 'total_creditcard_payments', label: '> クレジット', field: 'total_creditcard_payments', align: 'right' },
  { name: 'total_other_payments', label: '> その他', field: 'total_other_payments', align: 'right' },
])

const rows = ref([])

function populateRows() {
  let data = [...props.resultList]
  let sumRow = {flgSumRow: true}
  data.forEach((el: any) => {
    columns.value.forEach((column: any) => {
      if(el[column.field] && typeof el[column.field] === 'number') {
        if(sumRow[column.field]) sumRow[column.field] += el[column.field]
        else sumRow[column.field] = el[column.field]
      }
    })
  })
  sumRow.date_cart = '合計'
  data.push(sumRow)

  let average:Number = Math.floor(sumRow.total_sales_amount_intax / sumRow.total_carts)
  let distinctCartDays:Number = props.resultList.filter((el: any) => el.total_carts > 0).length
  let averageRow:any = {'total_carts': sumRow.total_carts, 'average': average, 'distinctCartDays': distinctCartDays, flgAverageRow: true}

  data.forEach((row) => {
    for(let key in row) {
      if(typeof row[key] === 'number' && row[key] === 0) {
        row[key] = null
      }
    }    
  })
  setSummary(sumRow, averageRow)

  return data
}

async function init() {
  await nextTick()
  const rowsData = populateRows()
  rows.value = exportPdf.value.populateRows(rowsData, 24, 26)
  await nextTick()
  generateReport()
  close()
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

function generateReport() {
  let jsPDFOptions = { orientation : 'landscape' }
  let imagePDFOptions:any = {quality: 0.1}
  let pagesNumber:Number = 0
  exportPdf.value.generateReport(getFileName(), pagesNumber , jsPDFOptions, imagePDFOptions)
}

function getFileName() {
  const formattedDate = dateFormat(getDateToday(), 'YYYYMMDD');
  const formattedMonth = dateFormat(props.date_start, 'YYYY年MM月分');
  return `領収月計_${formattedMonth}_${clinicStore.getClinic.name_clinic_display}(出力${formattedDate})`;
}

function setSummary(sumRow: Object, averageRow: Object) {
  summary.total_carts = averageRow.total_carts
  summary.total_no_tax_amount = sumRow.total_no_tax_amount
  summary.distinct_cart_days = averageRow.distinctCartDays
  summary.average_per_day = Math.round(averageRow.total_carts / averageRow.distinctCartDays)
  summary.average = averageRow.average
  summary.total_tax_amount = sumRow.total_tax_amount
  summary.total_temp_cash_payments = sumRow.total_temp_cash_payments
  summary.total_amount_insured = sumRow.total_amount_insured
  summary.total_valid_payments = sumRow.total_valid_payments
  summary.total_cash_payments = sumRow.total_cash_payments
  summary.total_creditcard_payments = sumRow.total_creditcard_payments
  summary.total_other_payments = sumRow.total_other_payments
}

onMounted(() => {
  init()
})

</script>
<template>
  <div>
    <PdfExport ref="exportPdf" sheetName="_注文書" />
    <div class="q-pa-md page-inner-body text-grey-900 ">
      <q-card id="element-to-print" class="bg-white q-pa-none" square style="max-width: 1200px; margin: auto">
         <div v-for="(page, idx) in rows" :key="idx" class="card-pdf-main q-px-md">
          <div class="flex justify-between q-mt-md">
            <div>
              <span><q-chip square color="primary" class="text-white">月計</q-chip> </span>
              <span class="q-ml-md">{{dateFormat(props.date_start, 'YYYY年MM月') + '分'}}</span>
              <div class="font-10px">
                <span class="text-grey-700">
                  追加抽出条件: 
                </span>
                <span></span>
              </div>
            </div>
           <div>
              <span class="title"><span class="q-pr-sm"></span>{{ clinicStore.getClinic.code_clinic }} {{ clinicStore.getClinic.name_clinic_display }}</span>
              <div class="font-10px text-right"><span class="text-grey-700 q-pr-sm">出力日:</span> {{ dateFormat(new Date(), 'YYYY/MM/DD HH:mm') }}</div>
            </div>
          </div>

          <div class="q-pa-sm bg-grey-200 font-10px" style="border: 1px solid #000;" v-if="idx === 0">
            <div class="row q-col-gutter-md">
              <div class="col-1"> [集計] </div>
              <div class="col">
                <span>会計件数: {{summary.total_carts}}件</span>
                <span class="q-ml-md">会計税別金額: {{formattedPrice(summary.total_no_tax_amount)}}円</span>
                <span class="q-ml-md">（期間内診療日数 {{summary.distinct_cart_days}}日 / 診療日平均 {{summary.average_per_day}}件)</span>
                <span class="q-ml-md">会計単価: {{formattedPrice(summary.average)}}円</span>
              </div>
            </div>  
            <div class="row q-col-gutter-md">
              <div class="col-1"></div>  
              <div class="col"> 
                <span>外税額: {{formattedPrice(summary.total_tax_amount)}}円</span>
                <span class="q-ml-md">保険負担額: {{formattedPrice(summary.total_amount_insured ? summary.total_amount_insured : 0)}}円</span>
                <span class="q-ml-md">売上外金額: {{formattedPrice(summary.total_temp_cash_payments ? summary.total_temp_cash_payments : 0)}}円</span>
                <span class="q-ml-md">入金額: {{formattedPrice(summary.total_valid_payments ? summary.total_valid_payments : 0)}}円</span>
                <span class="q-ml-md">現金入金: {{formattedPrice(summary.total_cash_payments ? summary.total_cash_payments : 0)}}円</span>
                <span class="q-ml-md">クレカ入金: {{formattedPrice(summary.total_creditcard_payments ? summary.total_creditcard_payments : 0)}}円</span>
                <span class="q-ml-md">の他入金額: {{formattedPrice(summary.total_other_payments ? summary.total_other_payments : 0)}}円</span>
              </div>
            </div>
          </div>

          <div class="row full-width">
            <div class="col-12 relative-position" :style="{'min-height': idx === 0 ? '650px' : '700px'}">
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
                    <q-tr :class="idx == 0 ? 'first-page' : ''" :props="props" class="table-body-row">
                      <q-td key="date_cart" :props="props">
                        <div class="font-10px" :class="props.row.flgSumRow ? 'text-weight-bold text-center font-12px bg-grey-400' : ''">{{ props.row.date_cart }}<span v-if="props.row.date_cart && !(props.row.flgSumRow)" class="q-ml-sm">{{getJPDay(props.row.date_cart)}}</span></div>
                      </q-td>
                      <q-td key="total_carts" :props="props">
                        <div class="font-10px">{{ props.row.total_carts }}</div>
                      </q-td>
                      <q-td key="total_no_tax_amount" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_no_tax_amount) }}</div>
                      </q-td>
                      <q-td key="total_tax_amount" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_tax_amount) }}</div>
                      </q-td>
                      <q-td key="total_temp_cash_payments" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_temp_cash_payments) }}</div>
                      </q-td>
                      <q-td key="total_amount_insured" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_amount_insured) }}</div>
                      </q-td>
                      <q-td key="total_sales_amount_intax" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_sales_amount_intax) }}</div>
                      </q-td>
                      <q-td key="total_valid_payments" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_valid_payments) }}</div>
                      </q-td>
                      <q-td key="total_cash_payments" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_cash_payments) }}</div>
                      </q-td>
                      <q-td key="total_creditcard_payments" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_creditcard_payments) }}</div>
                      </q-td>
                      <q-td key="total_other_payments" :props="props">
                        <div class="font-10px">{{ formattedPrice(props.row.total_other_payments) }}</div>
                      </q-td>
                    </q-tr>
                  </template>
                </q-table>
                <div class="absolute-bottom full-width font-10px flex justify-between" style="border-top: 2px solid #000;">
                  <div>Vetty電子カルテ 発行番号# {{ 'CMON' + clinicStore.getClinic.code_clinic }}{{ dateFormat(new Date(), 'YYYYMMDDHHmm') }}</div>
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
}
.table-body-row > td.q-td{
  border-bottom: 1px dotted rgba(0, 0, 0, 0.12);
  height: 24px !important;
}
</style>