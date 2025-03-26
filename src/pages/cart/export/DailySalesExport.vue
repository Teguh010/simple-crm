<script lang="ts" setup>
import { exportFile } from 'quasar'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'

import { ref, onMounted, defineAsyncComponent } from 'vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useCartStore from '@/stores/carts'
import useClinicStore from '@/stores/clinics'
import { formatDecimalNumber } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'
import { dateFormat, getDateToday, getDateTimeNow } from '@/utils/aahUtils'

const GetPdfDailySalesReportSimple = defineAsyncComponent(() => import('@/pages/cart/GetPdfDailySalesReportSimple.vue'))
const UpdateCartHeaderModal = defineAsyncComponent(() => import('@/pages/cart/UpdateCartHeaderModal.vue'))

import * as Encoding from 'encoding-japanese';
const cartStore = useCartStore()
const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const props = defineProps({
  params: {}
})
const flgCompleted = ref(1)
const disableExport = ref(true)

const searchDate = ref(dateFormat(getDateToday(), 'YYYY/MM/DD'))

const baseColumns = [
  {
    name: 'number_cart',
    label: '日付 / 領収#',
    field: 'number_cart',
    align: 'left'
  },
  {
    name: 'name_customer_display',
    label: '顧客CD / 名',
    field: 'name_customer_display',
    align: 'right'
  },
  { name: 'name_pet', label: 'ペット', field: 'name_pet', align: 'right' },
  {
    name: 'total_modified_sales_amount_notax',
    label: '診療金額',
    field: 'total_modified_sales_amount_notax',
    align: 'right'
  },
  {
    name: 'total_cd_disc',
    label: '割引額',
    field: 'total_cd_disc',
    align: 'right'
  },
  {
    name: 'total_tax_amount',
    label: '外税額',
    field: 'total_tax_amount',
    align: 'right'
  },
  {
    name: 'total_amount_insured',
    label: '保険負担',
    field: 'total_amount_insured',
    align: 'right'
  },
  {
    name: 'cart_balance_paid_this_time', // change here
    label: '未収精算',
    field: 'cart_balance_paid_this_time',
    align: 'right'
  },
  {
    name: 'total_upfront_payment_used',
    label: '前受精算',
    field: 'total_upfront_payment_used',
    align: 'right'
  },
  {
    name: 'total_temp_cash_payment',
    label: '売上外',
    field: 'total_temp_cash_payment',
    align: 'right'
  },
  {
    name: 'total_cash_payment',
    label: '現金入金',
    field: 'total_cash_payment',
    align: 'right'
  },
  {
    name: 'total_other_payment',
    label: '現金外入金',
    field: 'total_other_payment',
    align: 'right'
  },
  {
    name: 'total_refund_payment',
    label: '返金額',
    field: 'total_refund_payment',
    align: 'right'
  },
  {
    name: 'total_cart_balance',
    label: '未収繰越',
    field: 'total_cart_balance',
    // field: 'outstanding_balance_paid',
    align: 'right'
  },
  {
    name: 'total_upfront_payment_not_used',
    label: '前受繰越',
    field: 'total_upfront_payment_not_used',
    align: 'right'
  },
  {
    name: 'payment_method_labels',
    label: '金種',
    field: 'payment_method_labels',
    align: 'right'
  },
  {
    name: 'name_employee',
    label: '会計者',
    field: 'name_employee',
    align: 'right'
  }
]

const columns = ref([])
const rows = ref([])
const payment_method_names = ref([])

const csvBaseColumns = [
  {
    name: 'clinic_display_order',
    label: '順序',
    field: 'clinic_display_order',
    align: 'left'
  },
  { name: 'code_clinic', label: '病院CD', field: 'code_clinic', align: 'left' },
  {
    name: 'name_clinic_display',
    label: '病院名',
    field: 'name_clinic_display',
    align: 'left'
  },
  { name: 'date_cart', label: '領収日', field: 'date_cart', align: 'left' },
  {
    name: 'number_cart',
    label: '日付 / 領収#',
    field: 'number_cart',
    align: 'left'
  },
  {
    name: 'name_customer_display',
    label: '顧客CD / 名',
    field: 'name_customer_display',
    align: 'right'
  },
  { name: 'name_pet', label: 'ペット', field: 'name_pet', align: 'right' },
  { name: 'pet_count', label: '頭数', field: 'pet_count', align: 'right' },
  {
    name: 'total_modified_sales_amount_notax',
    label: '診療金額',
    field: 'total_modified_sales_amount_notax',
    align: 'right'
  },
  {
    name: 'total_cd_disc',
    label: '割引額',
    field: 'total_cd_disc',
    align: 'right'
  },
  {
    name: 'total_tax_amount',
    label: '外税額',
    field: 'total_tax_amount',
    align: 'right'
  },
  {
    name: 'total_amount_insured',
    label: '保険負担',
    field: 'total_amount_insured',
    align: 'right'
  },
  {
    name: 'cart_balance_paid_this_time',
    label: '未収精算',
    field: 'cart_balance_paid_this_time',
    align: 'right'
  },
  {
    name: 'total_upfront_payment_used',
    label: '前受精算',
    field: 'total_upfront_payment_used',
    align: 'right'
  },
  {
    name: 'total_temp_cash_payment',
    label: '売上外',
    field: 'total_temp_cash_payment',
    align: 'right'
  },
  {
    name: 'total_cash_payment',
    label: '現金入金',
    field: 'total_cash_payment',
    align: 'right'
  },
  {
    name: 'total_other_payment',
    label: '現金外入金',
    field: 'total_other_payment',
    align: 'right'
  },
  {
    name: 'total_refund_payment',
    label: '返金額',
    field: 'total_refund_payment',
    align: 'right'
  },
  {
    name: 'cart_balance_this_time',
    label: '今回未収',
    field: 'cart_balance_this_time',
    align: 'right'
  },
  {
    name: 'cart_balance_last_time',
    label: '累計未収',
    field: 'cart_balance_last_time',
    align: 'right'
  },
  {
    name: 'total_upfront_payment_not_used',
    label: '前受繰越',
    field: 'total_upfront_payment_not_used',
    align: 'right'
  },
  {
    name: 'payment_method_labels',
    label: '金種',
    field: 'payment_method_labels',
    align: 'right'
  },
  {
    name: 'datetime_export',
    label: '抽出日',
    field: 'datetime_export',
    align: 'right'
  },
  {
    name: 'name_employee',
    label: '会計者',
    field: 'name_employee',
    align: 'right'
  }
]

const closeModal = () => {
  emits('close')
}

const generateColumns = (includeDynamic = false, cols) => {
  // Initialize with static columns
  const columns = [...cols]

  // Optionally add dynamic payment method columns
  if (includeDynamic) {
    Object.entries(payment_method_names.value).forEach(
      ([methodId, methodName]) => {
        columns.push({
          name: `pm_${methodId}`,
          label: methodName, // Use the name of the payment method for CSV header
          field: `pm_${methodId}`,
          align: 'right'
        })
      }
    )
  }

  return columns
}

const exportCSV = (includeDynamic = false) => {
  const csvColumns = generateColumns(includeDynamic, csvBaseColumns)
  // Calculate pet count for each cart
  const flattenedRows = rows.value.flatMap((item) =>
    item.carts.map((cart) => {
      const petCount = cart.name_pet ? cart.name_pet.split(',').length : 0

      const datetime_export = getDateTimeNow()
      return { ...cart, pet_count: petCount, datetime_export }
    })
  )
  const csvContent = [
    csvColumns.map((col) => col.label).join(','), // Header row
    ...flattenedRows.map((row) =>
      csvColumns
        .map((col) => {
          // Data row
          const fieldValue = row[col.field]
          return typeof fieldValue === 'string' && fieldValue.includes(',')
            ? `"${fieldValue}"`
            : fieldValue
        })
        .join(',')
    )
  ].join('\n')
  const shiftJISArray = Encoding.stringToCode(csvContent);
  const shiftJIS = Encoding.convert(shiftJISArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  const uint8Array = new Uint8Array(shiftJIS);
  const blob = new Blob([uint8Array], { type: 'text/csv;charset=shift-jis;' });

  // Generate the file name using dateFormat and getDateToday
  const formattedDate = dateFormat(getDateToday(), 'YYYYMMDD')
  const formattedSelectedDayRange = `${dateFormat(
    props.params.date_start,
    'YYMMDD'
  )}_${dateFormat(props.params.date_end, 'YYMMDD')}`
  const fileName = `領収日計_${formattedSelectedDayRange}_${clinicStore.getClinic.name_clinic_display}(出力${formattedDate}).csv`

  // Create a download link and trigger the download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  const status = true; // Simulating the file export status
  if (status !== true) {
    console.error('Error exporting file');
  }
}

const copyToClipboard = () => {
  // copy the csv content to clipboard
  const flattenedRows = rows.value.flatMap((item) =>
    item.carts.map((cart) => {
      const petCount = cart.name_pet ? cart.name_pet.split(',').length : 0

      const datetime_export = getDateTimeNow()
      return { ...cart, pet_count: petCount, datetime_export }
    })
  )

  // Prepare the clipboard data as a table
  const clipboardData = [
    columns.value.map((col) => col.label).join('\t'), // Header row (using tabs as separators)
    ...flattenedRows.map((row) =>
      columns.value
        .map((col) => {
          // Data rows
          const fieldValue = row[col.field]
          return typeof fieldValue === 'string' && fieldValue.includes(',')
            ? `"${fieldValue}"`
            : fieldValue
        })
        .join('\t')
    )
  ].join('\n')

  navigator.clipboard.writeText(clipboardData).then(
    () => {
      mtUtils.autoCloseAlert('コピーしました！')
    },
    (err) => {
      console.error('Error copying CSV content to clipboard', err)
    }
  )
}

const exportPDF = () => {
  mtUtils.pdfRender(GetPdfDailySalesReportSimple, {
    resultList: [...rows.value],
    dateParams: {
      date_start: props.params.date_start,
      date_end: props.params.date_end
    }
  })
}

const calculateColumnSum = (row) => {
  const sums = {}; // Initialize an empty object for sums

  // List of columns to exclude from summing
  const excludedColumns = [
    'date_cart',
    'number_cart',
    'name_customer_display',
    'name_pet',
    'payment_method_labels',
    'name_employee',
    'name_clinic_display',
    'code_clinic',
    'clinic_display_order',
    'total_upfront_payment_used',
    'total_upfront_payment_not_used',
    'total_cart_balance',
  ];

  // Iterate through each cart and calculate sums dynamically
  row.carts.forEach((cart) => {
    Object.keys(cart).forEach((key) => {
      // Skip excluded columns and non-numeric values
      if (!excludedColumns.includes(key) && typeof cart[key] === 'number') {
        sums[key] = (sums[key] || 0) + cart[key]; // Accumulate the sum
      }
    });
  });

  return { ...row, sums }; // Add sums to the row
};

const openCart = (cart) => {
  let data = {
    id_cart: cart.id_cart
  }
  mtUtils.popup(UpdateCartHeaderModal, { data, fromPage: '日計' })
}


const fetchSalesSummary = async () => {
  // Create queryParams object to hold all request parameters
  const queryParams = {
    ...props.params,
    date_start: dateFormat(searchDate.value, 'YYYY-MM-DD'),
    date_end: dateFormat(searchDate.value, 'YYYY-MM-DD'),
    flg_completed: flgCompleted.value // Pass the flg_completed value
  }

  await cartStore.fetchDailySalesSummary(queryParams).then((res) => {
    // rows.value = res.data.data.summary
    rows.value = res.data.data.summary.map(calculateColumnSum);
    payment_method_names.value = res.data.data.payment_method_names
    disableExport.value = false
  })
}

const handleFlgCompletedChange = async () => {
  await fetchSalesSummary() // Re-fetch the data on change
}

onMounted(async () => {
  await fetchSalesSummary()
  columns.value = generateColumns(1, baseColumns)
})
</script>
<template>
  <div style="width: calc(100vw - 50px); overflow-x: hidden">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          集計
        </q-toolbar-title>
        <div class="q-ml-auto q-gutter-md row">
          <MtFormRadiobtn
            v-model="flgCompleted"
            label="全て"
            val=""
            @update:modelValue="handleFlgCompletedChange"
          />
          <MtFormRadiobtn
            v-model="flgCompleted"
            label="完了会計のみ"
            :val="1"
            @update:modelValue="handleFlgCompletedChange"
          />
          <MtFormRadiobtn
            v-model="flgCompleted"
            label="未完のみ"
            :val="0"
            @update:modelValue="handleFlgCompletedChange"
            class="q-mr-md"
          />
        </div>
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="q-px-lg content" style="overflow-x: hidden">
      <div class="header-info">
        <div class="left">
          <span class="title">日計</span>
          <span class="q-mx-sm"> [ 期間 ]</span>
          <MtFormInputDate
            v-model:date="searchDate"
            outlined
            label="会計日"
            type="date"
            autofocus
            @update:date="fetchSalesSummary()"
          />
          <!-- <span class="">{{
            props.params.date_start + ' ~ ' + props.params.date_end
          }}</span> -->
        </div>
        <div class="right">
          <span class="title"
            >{{ clinicStore.getClinic.code_clinic }}
            {{ clinicStore.getClinic.name_clinic_display }}</span
          >
          <span class="caption1 regular">{{
            '出力日: ' +
            new Date().toLocaleString('ja-JP', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })
          }}</span>
        </div>
      </div>
      <q-separator color="dark" size="2px" />
      <MtTable2
        :columns="columns"
        :rows="rows"
        :rowsBg="true"
        style="max-height: 70vh"
        flat
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした"
      >
        <template v-slot:body="{ row, columns }">
          <template v-if="row.carts.length > 0">
            <tr class="table-header">
              <td :colspan="3" class="date-col">
                会計日：{{ row.date_cart }}
              </td>
              <!-- Add sums for the remaining columns -->
              <td
                v-for="col in columns.slice(3)"
                :key="col.name"
                :class="{
                  'text-left': col.align === 'left',
                  'text-right': col.align === 'right'
                }"
                class="cell-content"
              >
                <div auto-width>
                  <div class="text-right">
                    {{
                      row.sums[col.name] !== undefined
                        ? formatDecimalNumber(row.sums[col.name])
                        : ''
                    }}
                  </div>
                </div>
              </td>
            </tr>
            <template v-for="cart in row.carts" :key="cart.number_cart">
              <tr>
                <td
                  v-for="(col, index) in columns"
                  :key="index"
                  :class="{
                    'text-left': col.align === 'left',
                    'text-right': col.align === 'right'
                  }"
                  class="cell-content"
                >
                <div v-if="col.field == 'number_cart'" auto-width>
                  <div class="report-page-font-size text-right text-blue cursor-pointer" @click="openCart(cart)">
                    {{cart[col.field]}}
                  </div>
                </div>

                <div v-else-if="col.field == 'total_cart_balance'" auto-width>
                  <div class="report-page-font-size text-right">
                    {{
                      cart[col.field] == 0
                        ? ''
                        : typeof cart[col.field] === 'number'
                        ? formatDecimalNumber(cart[col.field])
                        : cart[col.field]
                    }}
                  </div>
                </div>
                  <div v-else auto-width>
                    <div class="report-page-font-size text-right">
                      {{
                        cart[col.field] == 0
                          ? ''
                          : typeof cart[col.field] === 'number'
                          ? formatDecimalNumber(cart[col.field])
                          : cart[col.field]
                      }}
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </template>
      </MtTable2>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="exportCSV()">
          <q-icon name="description" class="q-mr-sm" />
          CSVダウンロード
        </q-btn>
        <q-btn
          class="q-ml-md"
          color="primary"
          unelevated
          @click="exportCSV(true)"
        >
          <q-icon name="description" class="q-mr-sm" />
          売上/入金まとめ
        </q-btn>
        <q-btn
          :disable="disableExport"
          class="q-ml-md"
          color="primary"
          @click="exportPDF()"
        >
          <q-icon name="picture_as_pdf" class="q-mr-sm" />
          PDFダウンロード
        </q-btn>
        <q-btn class="q-ml-md" outline @click="copyToClipboard()">
          <q-icon name="content_copy" class="q-mr-sm" />
          コピー
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style scoped>
.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.left {
  display: flex;
  gap: 8px; /* Adjust gap between the first two fields */
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.title {
  font-size: 16px;
  font-weight: bold;
}

.table-header {
  background-color: #f5f5f5;
  font-weight: bold !important;
}

.date-col {
  font-weight: bold;
  text-align: left;
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
}

.cell-content {
  padding: 8px;
  border-bottom: 1px dotted #ccc;
}
</style>
