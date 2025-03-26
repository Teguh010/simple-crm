<script setup lang="ts">
import { ref, nextTick } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import {
 dateFormat,
 getDateToday,
 filterRows,
} from '@/utils/aahUtils'
import useClinicStore from '@/stores/clinics'
import { formattedPrice } from '@/utils/helper'

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

const clinicStore = useClinicStore()

const exportPdf = ref()
const totalAmountSalesSum = ref(0), top10Categories = ref([])

const columns = ref([
  { name: 'classification', label: '分類', field: 'classification', align: 'left' },
  { name: 'code_category1', label: '分類CD', field: 'code_category1', align: 'left' },
  { name: 'name_category1', label: '项目名', field: 'name_category1', align: 'left' },
  { name: 'cd_count', label: '件数', field: 'cd_count', align: 'right' },
  { name: 'total_quantity', label: '数量', field: 'total_quantity', align: 'right' },
  { name: 'total_amount_sales', label: '金额', field: 'total_amount_sales', align: 'right' },
  { name: 'average', label: '平均単価', field: 'average', align: 'right' },
  { name: 'percentage', label: '比率(%)', field: 'percentage', align: 'right' }
]), rows = ref([])

async function init() {
  await nextTick()
  const rowsData = populateRows()
  rows.value = exportPdf.value.populateRows(rowsData, 24, 26)
  await nextTick()
  generateReport()
  close()
}

function populateRows() {
  let rowsData = [...props.resultList]
  totalAmountSalesSum.value = rowsData.reduce((sum, row) => !row.heading ? sum + row.total_amount_sales : sum, 0)
  rowsData.forEach((row, idx) => {
    row['percentage'] = getTotalPercentage(row.total_amount_sales, 1)
    row['average'] = Math.round(parseInt(row.total_amount_sales) / row.total_quantity)
  })
  top10Categories.value = [...rowsData].filter((el) => !el.heading).sort((a, b) => b.total_amount_sales - a.total_amount_sales).slice(0, 10)
  return rowsData
}

function generateReport() {
  let jsPDFOptions = { orientation : 'landscape' }
  let imagePDFOptions:any = {quality: 0.1}
  let pagesNumber:Number = 0
  exportPdf.value.generateReport(getFileName(), pagesNumber , jsPDFOptions, imagePDFOptions)
}

function getFileName() {
  const formattedDate = dateFormat(getDateToday(), 'YYMMDD');
  const formattedSelectedDayRange = `${dateFormat(props.dateParams.date_start, 'YYMMDD')}_${dateFormat(props.dateParams.date_end, 'YYMMDD')}`;
  return `担当別売上_${formattedSelectedDayRange}_${clinicStore.getClinic.name_clinic_display}(DL${formattedDate})`;
}

function getCircledNumber(number: Number){
  return String.fromCodePoint(9311 + number);
}

function getTotalPercentage(value: Number, decimalLimit: Number = 2) {
  return +((value / totalAmountSalesSum.value) * 100).toFixed(decimalLimit)
}

init()

</script>
<template>
  <div>
    <PdfExport ref="exportPdf" />
    <div class="q-pa-md page-inner-body text-grey-900 ">
      <q-card id="element-to-print" class="bg-white q-pa-none" square style="max-width: 1200px; margin: auto">
        <div v-for="(page, idx) in rows" :key="idx" class="card-pdf-main q-px-md">
          <div class="flex justify-between q-mt-md">
            <div>
              <span class="title">対象者別売上集計</span>
              <span class="q-mx-sm"> [ 期間 ]</span>
              <span>{{ props.dateParams.date_start + ' ~ ' + props.dateParams.date_end }}</span>
            </div>
            <div>
              <span class="title">{{ clinicStore.getClinic.code_clinic }} / {{ clinicStore.getClinic.name_clinic_display }}</span>
              <div class="font-10px text-right"><span class="text-grey-700 q-pr-sm">出力日:</span> {{ dateFormat(new Date(), 'YYYY/MM/DD HH:mm') }}</div>
            </div>
          </div>

          <div class="q-pa-sm bg-grey-200 font-10px" style="border: 1px solid #000;" v-if="idx === 0">
            <div>合計 {{formattedPrice(totalAmountSalesSum)}} 円 </div>
            <template v-for="(cat, idx) in top10Categories" :key="idx">
               <span :class="idx !== 0 ? 'q-ml-sm' : ''">{{getCircledNumber(idx + 1)}}</span> <span>{{cat.name_category2}}
               <span v-if="cat.name_category2">:</span> {{formattedPrice(cat.total_amount_sales)}}円 / 
               <span>{{getTotalPercentage(cat.total_amount_sales, 1)}}%</span></span>
            </template>
          </div>

          <div class="row full-width">
            <div class="col-12 relative-position" :style="{'min-height': idx === 0 ? '650px' : '720px'}">
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
                    <q-tr v-if="props.row.heading" :props="props" class="table-body-row">
                      <q-td :class="'heading' + props.row.heading" :colspan="columns.length">
                        <strong class="font-10px" :class="props.row.heading === 3 ? 'text-weight-regular' : ''">
                          {{ props.row.label }}
                        </strong>
                      </q-td>
                    </q-tr>
                    <q-tr v-else :props="props" class="table-body-row">
                      <q-td key="classification" :props="props">
                        <div class="font-10px">
                        </div>
                      </q-td>
                      <q-td key="code_category1" :props="props">
                        <div class="font-10px">{{props.row.code_category1}}</div>
                      </q-td>
                       <q-td key="name_category1" :props="props">
                        <div class="font-10px">{{props.row.name_category1}}</div>
                      </q-td>
                      <q-td key="cd_count" :props="props">
                        <div class="font-10px">{{props.row.cd_count}}</div>
                      </q-td>
                      <q-td key="total_quantity" :props="props">
                        <div class="font-10px">{{parseFloat(props.row.total_quantity).toFixed(2)}}</div>
                      </q-td>
                      <q-td key="total_amount_sales" :props="props">
                        <div class="font-10px">{{formattedPrice(props.row.total_amount_sales)}}</div>
                      </q-td>
                       <q-td key="average" :props="props">
                        <div class="font-10px">{{formattedPrice(props.row.average)}}</div>
                      </q-td>
                      <q-td key="percentage" :props="props">
                        <div class="font-10px">{{props.row.percentage}}%</div>
                      </q-td>
                    </q-tr>
                  </template>
              </q-table>
              <div class="absolute-bottom full-width font-10px flex justify-between" style="border-top: 2px solid #000;">
                <div>Vetty電子カルテ 発行番号# </div>
                <div>Page: {{ idx + 1 }} / {{ rows.length }}</div>
              </div>
              <template v-if="idx + 1 != rows.length">
                <div class="html2pdf__page-break"></div>
              </template> 
            </div>
          </div>      
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
  &.heading2 {
    height: 20px !important;
  }
}
.title {
  font-size: 16px;
  font-weight: bold;
}

.heading1 {
  padding: 4px;
  background: #757575;
  color: #fff;
  strong {
    margin-left: 0px;
    display: block;
  }
}

.heading2 {
  padding: 4px;
  background: #eee;
  color: #000;
  strong {
    margin-left: 20px;
    display: block;
    margin-top: -2px;
  }
}

.heading3 {
  padding: 4px;
  strong {
    margin-left: 40px;
  }
}

.heading4 {
  font-size: 1em;
  padding: 4px;
  strong {
    margin-left: 60px;
  }
}
</style>