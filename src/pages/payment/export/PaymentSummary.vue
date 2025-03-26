<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { ref, onMounted } from 'vue'
import MtTable2 from '@/components/MtTable2.vue'
import { formattedPrice } from '@/utils/helper'
import { getDateByFormat } from '@/utils/aahUtils'
import usePaymentStore from '@/stores/payment'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import {typePaymentMethod, typePaymentStatus} from '@/utils/enum'
import * as Encoding from 'encoding-japanese';

const paymentStore = usePaymentStore()

const emits = defineEmits(['close'])
const props = defineProps({
  params: {
    type: Object,
    default: () => ({})
  }
})

const rows = ref([])
const columns = ref([])

const searchData = ref({
  type_payment_status: 1 // Default to "1"
})

const closeModal = () => {
  emits('close')
}

// Generate CSV
function convertToCSV() {
  // Create a map of column names to labels
  const columnMap = columns.value.reduce((map, col) => {
    map[col.name] = col.label
    return map
  }, {})

  // Create rows with properly formatted data
  const obj = rows.value.map((row: any) => {
    let a_row = {}
    columns.value.forEach((col) => {
      let key = col.name
      if (typeof row[key] === 'string' && key === 'type_payment_method') {
        // If the column is payment method, format it
        let tpms = []
        row[key].split(',').forEach((tpm_) => {
          tpms.push(typePaymentMethod.find((tpm) => tpm.value == tpm_)?.label)
        })
        a_row[key] = tpms.join(', ')
      } else if (typeof row[key] === 'number') {
        // If it's a number, format as price
        a_row[key] = formattedPrice(row[key])
      } else {
        // Default case for other data
        a_row[key] = row[key]
      }
    })
    return a_row
  })

  // Prepare the CSV content
  const array = [Object.values(columnMap)].concat(obj.map(row => Object.values(row)))

  // Convert array to CSV string
  return array.map(row => row.map(v => `"${v}"`).join(',')).join('\n')
}


const export_csv = () => {
  const csvString = convertToCSV()
 // Convert CSV content to Shift-JIS
const shiftJISArray = Encoding.stringToCode(csvString);
  const shiftJIS = Encoding.convert(shiftJISArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  const uint8Array = new Uint8Array(shiftJIS);
  const blob = new Blob([uint8Array], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'PaymentSummary.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const copytoclipboard = () => {
  // Create a map of column names to labels
  const columnMap = columns.value.reduce((map, col) => {
    map[col.name] = col.label;
    return map;
  }, {});

  // Create rows with properly formatted data
  const formattedRows = rows.value.map((row: any) => {
    let a_row = {};
    columns.value.forEach((col) => {
      let key = col.name;
      if (typeof row[key] === 'string' && key === 'type_payment_method') {
        // If the column is payment method, format it
        let tpms = [];
        row[key].split(',').forEach((tpm_) => {
          tpms.push(typePaymentMethod.find((tpm) => tpm.value == tpm_)?.label);
        });
        a_row[key] = tpms.join(', ');
      } else if (typeof row[key] === 'number') {
        // If it's a number, format as price
        a_row[key] = formattedPrice(row[key]);
      } else {
        // Default case for other data
        a_row[key] = row[key];
      }
    });
    return a_row;
  });

  // Prepare the data for clipboard (replace with your desired formatting)
  const clipboardData = [
    Object.values(columnMap).join('\t'), // Header row
    ...formattedRows.map(row => Object.values(row).join('\t')) // Data rows
  ].join('\n');

  // Copy the data to the clipboard
  navigator.clipboard.writeText(clipboardData)
    .then(() => {
      mtUtils.autoCloseAlert('コピーしました！')
    })
    .catch(error => {
      console.error('Failed to copy data:', error);
    });
}

// Generate rows based on payment methods
const generateRows = (payment_summary) => {
  const rows = {
    date_start: payment_summary.date_start,
    date_end: payment_summary.date_end,
    total_amount: payment_summary.paid_amount
  }

  Object.keys(payment_summary.payment_methods).forEach((method) => {
    rows[
      `pm_${method}`
    ] = `${payment_summary.payment_methods[method].count} | ${payment_summary.payment_methods[method].amount}`
  })
  return [rows]
}
// Generate columns based on payment methods dynamically
const generateColumns = (payment_method_names) => {
  return [
    {
      name: 'date_start',
      align: 'center',
      label: '開始日',
      field: 'date_start'
    },
    {
      name: 'date_end',
      align: 'center',
      label: '終了日',
      field: 'date_end'
    },
    {
      name: 'total_amount',
      align: 'center',
      label: '合計',
      field: 'total_amount'
    },
    ...Object.keys(payment_method_names).map((key) => ({
      name: `pm_${key}`,
      align: 'center',
      label: `${payment_method_names[key]}`,
      field: `pm_${key}`
    }))
  ]
}

// Fetch Payment Data
const fetchPaymentData = async () => {
  const response = await paymentStore.fetchPaymentSummary({
    date_start: props.params.date_start,
    date_end: props.params.date_end,
    type_payment_status: searchData.value.type_payment_status // Include payment status
  })

  const { payment_summary, payment_method_names } = response.data.data
  
  rows.value = generateRows(payment_summary)
  columns.value = generateColumns(payment_method_names)
}

// Handle Payment Status Change
const handleTypePaymentStatusChange = () => {
  fetchPaymentData()
}

// Fetch data on mount
onMounted(async () => {
  await fetchPaymentData()
})
</script>

<template>
  <q-form>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          支払サマリー
        </q-toolbar-title>
        <div>
          <MtFormPullDown
            v-model:selected="searchData.type_payment_status"
            :options="typePaymentStatus"
            class="q-mx-sm selection-field"
            label="ステータス"
            outlined
            @update:selected="handleTypePaymentStatusChange"
          />
        </div>
        <PdfExport ref="exportPdf" orientationMode="landscape" sheetName="payment_summary" />
      </q-toolbar>
    </MtModalHeader>

    <q-card-section class="content">
      <MtTable2
        :columns="columns"
        :rows="rows"
        :rowsBg="true"
        flat
        no-data-message="データがありません。"
        no-result-message="該当のデータが見つかりませんでした"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            class="cursor-pointer"
          >
            <div v-if="col.field.startsWith('date')" class="text-center">
              {{ row[col.field] ? getDateByFormat(row[col.field]) : null }}
            </div>
            <div v-else class="text-right">
              {{ typeof row[col.field] === 'number' ? formattedPrice(row[col.field]) : row[col.field] }}
            </div>
          </td>
        </template>
      </MtTable2>
    </q-card-section>

    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="export_csv">
          <span>CSVダウンロード</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="copytoclipboard">
          <span>コピー</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style scoped>
.print-content * {
  font-size: 12px !important;
}
</style>
