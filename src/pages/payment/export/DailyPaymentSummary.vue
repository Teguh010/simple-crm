<script lang="ts" setup>
import { ref, onMounted } from 'vue'

import { formattedPrice } from '@/utils/helper'
import usePaymentStore from '@/stores/payment'
import { getDateByFormat } from "@/utils/aahUtils";
import { typePaymentStatus } from '@/utils/enum'

import MtModalHeader from '@/components/MtModalHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormPullDown from "@/components/form/MtFormPullDown.vue";
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
  type_payment_status: 1
})

const closeModal = () => {
  emits('close')
}

const generateColumns = (methodNames) => {
  const baseColumns = [
    {
      name: 'date_payment',
      align: 'center',
      label: '対象日',
      field: 'date_payment'
    },
    {
      name: 'total_amount',
      align: 'center',
      label: '合計',
      field: 'total_amount',
      format: (val) => `$${val.toFixed(2)}`
    }
  ]

  const methodColumns = Object.keys(methodNames).map((key) => ({
    name: key,
    align: 'center',
    label: methodNames[key],
    field: key,
    format: (val) => `$${val ? val.toFixed(2) : '0.00'}`
  }))

  return [...baseColumns, ...methodColumns]
}

function convertToCSV() {
  const columnMap = columns.value.reduce((map, col) => {
    map[col.name] = col.label
    return map
  }, {})

  const obj = rows.value.map((row) => {
    let a_row = {}
    columns.value.forEach((col) => {
      const key = col.name
      if (row[key].toString().search(/^\d+(?:[.,]\d+)*$/) === -1) {
        a_row[key] = row[key]
      } else {
        a_row[key] = formattedPrice(row[key])
      }
    })
    return a_row
  })

  const array = [Object.values(columnMap)].concat(obj)
  return array
    .map((it) => Object.values(it).map((v) => `"${v}"`).toString())
    .join('\n')
}

const copytoclipboard = () => {
// Create a map of column names to labels
const columnMap = columns.value.reduce((map, col) => {
    map[col.name] = col.label;
    return map;
  }, {});

  // Process each row and format data as needed
  const clipboardData = rows.value.map((row) => {
    let a_row = {};
    columns.value.forEach((col) => {
      const key = col.name;
      if (row[key].toString().search(/^\d+(?:[.,]\d+)*$/) === -1) {
        a_row[key] = row[key];
      } else {
        a_row[key] = formattedPrice(row[key]); // Assume formattedPrice formats price
      }
    });
    return a_row; // Return the formatted row object
  });

  // Prepare the data for clipboard (replace with your desired formatting)
  const csvString = [
    Object.values(columnMap).join('\t'), // Header row
    ...clipboardData.map(row => 
      Object.values(row).join('\t') // Data rows
    )
  ].join('\n');

  // Copy the data to the clipboard
  navigator.clipboard.writeText(csvString)
    .then(() => {
      mtUtils.autoCloseAlert('コピーしました！')
    })
    .catch(error => {
      console.error('Failed to copy data:', error);
    });
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
  link.setAttribute('download', 'Report.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleTypePaymentStatusChange = () => {
  fetchPaymentData()
}

// Fetch Payment Data
const fetchPaymentData = async () => {
  const response = await paymentStore.fetchDailyPaymentSummary({
    date_start: props.params.date_start,
    date_end: props.params.date_end,
    type_payment_status: searchData.value.type_payment_status
  })

  const { payment_summary, payment_method_names } = response.data.data

  // Generate columns dynamically
  columns.value = generateColumns(payment_method_names)

  // Set the rows data
  rows.value = payment_summary
}

onMounted(async () => {
  await fetchPaymentData()
})
</script>

<template>
  <q-form>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          集計
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
        <PdfExport ref="exportPdf" orientationMode="landscape" sheetName="lab_result" />
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="content">
      <MtTable2
        :columns="columns"
        :rows="rows"
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
            <div v-if="col.field == 'date_payment'" key="date_cart" auto-width>
              <div class="body1 row regular text-grey-900">
                <span>
                  {{
                    row['date_payment'] ? getDateByFormat(row['date_payment']) : null
                  }}
                </span>
              </div>
            </div>
            <div v-else auto-width>
              <div class="body1 regular text-grey-900 text-right">
                {{ typeof row[col.field] === 'number' ? formattedPrice(row[col.field]) : row[col.field] }}
              </div>
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
