<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted } from 'vue'
import MtTable2 from '@/components/MtTable2.vue'
import { formattedPrice } from '@/utils/helper'
import { getDateByFormat } from '@/utils/aahUtils'
import { typePaymentMethod } from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({
  rows: [],
  columns: []
})

const closeModal = () => {
  emits('close')
}

function convertToCSV() {
   // Create a map of column names to labels
  const columnMap = props.columns.reduce((map, col) => {
    map[col.name] = col.label
    return map
  }, {})
  const obj = props.rows.map((row: any) => {
    let a_row = {}
    for (let col in props.columns) {
      let key = props.columns[col].name
      if (key === 'type_payment_method') {
        let tpms = []
        row[key].split(',').forEach((tpm_) => {
          tpms.push(typePaymentMethod.find((tpm) => tpm.value == tpm_)?.label)
        })
        a_row[key] = tpms.join(', ')
        continue
      }
      if (row[key].toString().search(/^\d+(?:[.,]\d+)*$/) == -1) {
        a_row[key] = row[key]
      } else {
        a_row[key] = formattedPrice(row[key])
      }
    }
    return a_row
  })
  const array = [Object.values(columnMap)].concat(obj)
  return array.map(it => {
    return Object.values(it).map(v => `"${v}"`).toString()
  }).join('\n')
}

const export_csv = () => {
  const csvString = convertToCSV()
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'Report.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(async () => {
})

</script>
<template>
  <q-form>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          集計
        </q-toolbar-title>
        <PdfExport ref="exportPdf" orientationMode="landscape" sheetName="lab_result" />
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="content">
      <MtTable2
        :columns="props.columns"
        :rows="props.rows"
        :rowsBg="true"
        flat
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            class="cursor-pointer"
          >
            <div 
              v-if="col.field == 'datetime_payment'" 
              key="datetime_payment" 
              class="text-center"
            >
              {{
                row['datetime_payment'] ? getDateByFormat(row['datetime_payment']) : null
              }}
            </div>

            <div 
              v-else-if="col.field == 'amount_payment'" 
              key="amount_payment" 
              auto-width
              class="text-right"
            >
              {{ row['amount_payment'] ? formattedPrice(row['amount_payment']) : null }}
            </div>

            <div 
              v-else-if="col.field == 'type_payment_method'" 
              key="type_payment_method" 
              auto-width
              class="text-center"
            >
              {{
                row['type_payment_method'].split(',').map((tpm_) => {
                  return typePaymentMethod.find((tpm) => tpm.value == tpm_)?.label
                }).join(', ')
              }}
            </div>

            <div 
              v-else-if="col.field == 'date_cart'" 
              key="date_cart" 
              auto-width
              class="text-center"
            >
              {{
                row['date_cart'] ? getDateByFormat(row['date_cart']) : null
              }}
            </div>

            <div 
              v-else-if="col.field == 'total_cd_disc'" 
              key="total_cd_disc" 
              auto-width
              class="text-right"
            >
              {{ row['total_cd_disc'] ? formattedPrice(row['total_cd_disc']) : null }}
            </div>

            <div 
              v-else-if="col.field == 'total_ch_disc_notax'" 
              key="total_ch_disc_notax" 
              auto-width
              class="text-right"
            >
              {{ formattedPrice(row['total_ch_disc_notax']) }}
            </div>

            <div 
              v-else-if="col.field == 'total_amount_insured'" 
              key="total_amount_insured" 
              auto-width
              class="text-right"
            >
              {{ formattedPrice(row['total_amount_insured']) }}
            </div>

            <div 
              v-else-if="col.field == 'ins_target'" 
              key="ins_target" 
              auto-width
              class="text-right"
            >
              {{ formattedPrice(row['ins_target']) }}
            </div>

            <div 
              v-else-if="col.field == 'bill'" 
              key="bill" 
              auto-width
              class="text-right"
            >
              <div class="body1 regular text-grey-900 text-right">
                {{ row['bill'] ? formattedPrice(row['bill']) : 0 }}
              </div>
            </div>
            <!-- generic fields -->
            <div 
              v-else-if="col.field.startsWith('date')" 
              auto-width
              class="text-center"
            >
              {{
                row[col.field] ? getDateByFormat(row[col.field]) : null
              }}
            </div>
            
            <div 
              v-else-if="col.name == 'amount'" 
              auto-width
              class="text-right"
            >
              {{
                row[col.field] ? formattedPrice(row[col.field]) : 0
              }}
            </div>

            <div v-else auto-width class="text-right" >
              {{ row[col.field] }}
            </div>

          </td>
        </template>
      </MtTable2>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="export_csv">
          <span>CSVダウンロード</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style scoped>
.print-content * {
  font-size: 12px !important;
}

.custom-col {
  flex: 0 0 calc(100% / 9 / 2);
  max-width: calc(100% / 9 / 2);
  text-align: center; /* Just for visualization */
}
</style>