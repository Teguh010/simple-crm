<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { ref, computed, onMounted } from 'vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import GetPdfMonthlySalesReportSimple from '@/pages/cart/GetPdfMonthlySalesReportSimple.vue'
import useCartStore from '@/stores/carts'
import useClinicStore from '@/stores/clinics'
import {   dateFormat, getDateByFormat, getDateToday, changeMonth, getMonthStartAndEnd } from '@/utils/aahUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { formattedPrice } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'
import * as Encoding from 'encoding-japanese';
const cartStore = useCartStore()
const clinicStore = useClinicStore()

const emits = defineEmits(['close'])

const currentDate = ref(getDateToday())
const selectedMonthLabel = ref('今月')
const selectedMonth = ref(getDateByFormat(getDateToday(), 'YYYY/MM'))

const disableExport = ref(true)
const flgCompleted = ref(1);

const baseColumns = [
  { name: 'date_cart', label: '日付', field: 'date_cart', align: 'left' },
  { name: 'total_carts', label: '件数', field: 'total_carts', align: 'right' },
  { name: 'total_no_tax_amount', label: '売上額（税抜）', field: 'total_no_tax_amount', align: 'right' },
  { name: 'total_tax_amount', label: '消費税', field: 'total_tax_amount', align: 'right' },
  { name: 'total_temp_cash_sales', label: '売上外', field: 'total_temp_cash_sales', align: 'right' },
  { name: 'total_amount_insured', label: '保険負担額', field: 'total_amount_insured', align: 'right' },
  { name: 'total_sales_amount', label: '売上金額', field: 'total_sales_amount', align: 'right' },
  { name: 'total_valid_payments', label: '入金額', field: 'total_valid_payments', align: 'right' },
  { name: 'total_cash_payments', label: '入金内訳-現金', field: 'total_cash_payments', align: 'right' },
  { name: 'total_creditcard_payments', label: '-クレジット', field: 'total_creditcard_payments', align: 'right' },
  { name: 'total_other_payments', label: '-その他', field: 'total_other_payments', align: 'right' },
  { name: 'total_refund_payment', label: '返金額', field: 'total_refund_payment', align: 'right' },
];

const columns = ref([])
const rows = ref([]);
const payment_method_names = ref([]);

const closeModal = () => {
  emits('close')
}

const generateColumns = (includeDynamic = false) => {
  // Initialize with static columns
  const columns = [...baseColumns];

  // Optionally add dynamic payment method columns
  if (includeDynamic) {
    Object.entries(payment_method_names.value).forEach(([methodId, methodName]) => {
      columns.push({
        name: `pm_${methodId}`,
        label: methodName,  // Use the name of the payment method for CSV header
        field: `pm_${methodId}`,
        align: 'right',
      });
    });
  }

  return columns;
};

const exportCSV = (includeDynamic = false) => {
  // const csvColumns = generateColumns(includeDynamic);
  const tableColumn = columns.value.map(col => col.label);
  const tableRows = rows.value.map(row => {
    return columns.value.map(col => {
      return row[col.field];
    });
  });

  // Prepare the header information with specific column placement
  const headerInfo = [
    ['月計', '', selectedMonth.value.substr(0, 7).replace('-', '/'), '', '', '', '', '', '', clinicStore.getClinic.name_clinic_display]
  ];

  const csvContent = [
    ...headerInfo.map(row => row.join(',')), // Add header information
    '',
    tableColumn.join(','), // Add the column headers as the next row
    ...tableRows.map(row => row.join(',')) // Add each row of data
  ].join('\n');

  // Convert CSV content to Shift-JIS encoding
  const shiftJISArray = Encoding.stringToCode(csvContent);
  const shiftJIS = Encoding.convert(shiftJISArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  const uint8Array = new Uint8Array(shiftJIS);
  const blob = new Blob([uint8Array], { type: 'text/csv;charset=shift-jis;' });

  // Generate the file name using dateFormat and getDateToday
  const formattedDate = dateFormat(getDateToday(), 'YYYYMMDD');
  const formattedSelectedMonth = getDateByFormat(
    `${selectedMonth.value}/01`,
    'YYYY年MM月分'
  );
  const fileName = `領収月計_${formattedSelectedMonth}_${clinicStore.getClinic.name_clinic_display}(出力${formattedDate}).csv`;

  // Create a link to download the CSV file
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const copytoclipboard = () => {
  const tableColumn = columns.value.map(col => col.label);
  const tableRows = rows.value.map(row => {
    return columns.value.map(col => {
      return row[col.field];
    });
  });

  // Prepare the header information with specific column placement
  const headerInfo = [
    ['月計', '', selectedMonth.value.substr(0, 7).replace('-', '/'), '', '', '', '', '', '', clinicStore.getClinic.name_clinic_display]
  ];

  const clipboardData = [
    tableColumn.join('\t'), // Add the column headers as the next row
    ...tableRows.map(row => row.join('\t')) // Add each row of data
  ].join('\n');



  // Create a link to download the CSV file
  navigator.clipboard.writeText(clipboardData).then(
    () => {
      mtUtils.autoCloseAlert('コピーしました！')
    },
    (err) => {
      console.error('Error copying CSV content to clipboard', err)
    }
  )
};


const exportPDF = () => {
  mtUtils.pdfRender(GetPdfMonthlySalesReportSimple, {
    resultList: [...rows.value],
    date_start: selectedMonth.value //.substr(0, 7).replace('-', '/')
  })
};

const onChangeDate = async (prefix: string) => {
  let selectedDate = `${selectedMonth.value}/01`
  selectedMonth.value = changeMonth(selectedDate, prefix)
  let newDate = `${selectedMonth.value}/01`
  if (
    getDateByFormat(currentDate.value, 'YYYY-MM') ==
    getDateByFormat(selectedMonth.value, 'YYYY-MM')
  ) {
    selectedMonthLabel.value = '今月'
  } else {
    selectedMonthLabel.value = getDateByFormat(
      newDate,
      'YYYY年MM月'
    )
  }
  const queryParams = {
    ...dateRange.value,
    flg_completed: flgCompleted.value // Pass the flg_completed value
  };
  await cartStore.fetchMonthlySalesSummary(queryParams).then(res => {
    rows.value = res.data.data.summary
  })
}

const isNextCalendarMonthDisabled = computed(() => {
  const currentMonth = getDateByFormat(currentDate.value, 'YYYY-MM')
  let monthReq = `${selectedMonth.value}/01`
  const selectedMonthValue = getDateByFormat(monthReq, 'YYYY-MM')
  return selectedMonthValue >= currentMonth
})

const dateRange = computed(() => {
  return getMonthStartAndEnd(selectedMonth.value)
})

const fetchSalesSummary = async () => {
  // Create queryParams object to hold all request parameters
  const queryParams = {
    ...dateRange.value,
    flg_completed: flgCompleted.value // Pass the flg_completed value
  };

  await cartStore.fetchMonthlySalesSummary(queryParams).then((res) => {
    if(res.data.data.summary && res.data.data.summary.length > 0) {
      rows.value = res.data.data.summary.sort((a, b) => {
        return new Date(a.date_cart) - new Date(b.date_cart)
      })
      payment_method_names.value = res.data.data.payment_method_names;
    }
    disableExport.value = false
  });
};

const handleFlgCompletedChange = async () => {
  await fetchSalesSummary(); // Re-fetch the data on change
};

onMounted(async () => {
 await fetchSalesSummary()
 columns.value = generateColumns(1);
})

// onMounted(async () => {
//   await cartStore.fetchMonthlySalesSummary(dateRange.value).then(res => {
//     if(res.data.data && res.data.data.length > 0) {
//       rows.value = res.data.data.sort((a, b) => {
//         return new Date(a.date_cart) - new Date(b.date_cart)
//       })
//     }
//     disableExport.value = false
//   })
// })

</script>
<template>
  <q-form style="width: calc(100vw - 50px); overflow-x: hidden;">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none" style="flex-wrap: wrap;">
        <q-toolbar-title class="title2 bold text-grey-900">
          集計
        </q-toolbar-title>
        <!-- Radio buttons for flg_completed -->
        <div class="q-ml-md q-gutter-md row">
          <MtFormRadiobtn v-model="flgCompleted" label="全て" val=""  @update:modelValue="handleFlgCompletedChange" />
          <MtFormRadiobtn v-model="flgCompleted" label="完了会計のみ" :val="1"  @update:modelValue="handleFlgCompletedChange" />
          <MtFormRadiobtn v-model="flgCompleted" label="未完のみ" :val="0"  @update:modelValue="handleFlgCompletedChange" class="q-mr-md" />
        </div>

        <!-- Calendar month selection and navigation -->
        <div class="q-ml-auto">
          <div class="flex justify-between">
            <q-btn
              @click="onChangeDate('prev')"
              padding="2px"
              flat
              unelevated
              icon="chevron_left"
              style="border: 1px solid #9e9e9e"
            />
            <MtInputForm
              outlined
              class="search-field q-mx-xs"
              type="text"
              v-model="selectedMonthLabel"
              iconAppend="calendar_month"
              readonly
            />
            <q-btn
              @click="onChangeDate('next')"
              :disabled="isNextCalendarMonthDisabled"
              padding="2px"
              flat
              unelevated
              icon="chevron_right"
              style="border: 1px solid #9e9e9e"
            />
          </div>
        </div>
      </q-toolbar>

    </MtModalHeader>
    <q-card-section ref="pdfContent" class="content responsive-view" style="overflow-x: scroll;">
      <div class="header-info">
        <div class="left">
          <span class="title">{{ '領収 / 月計' }}</span>
          <span class="title q-ml-md">{{ selectedMonth.replace('-', '/') + '月分'}}</span>
        </div>
        <div class="right">
          <span class="title">{{clinicStore.getClinic.name_clinic_display}}</span>
        </div>
      </div>
      <hr class="bold-line">

      <MtTable2
        :columns="columns"
        :rows="rows"
        :rowsBg="true"
        flat
        style="max-height: 70vh"
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした"
      >
      <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            class="cursor-pointer"
          >
            <div v-if="col.field == 'date_cart'" key="date_cart" auto-width>
              <div class="body1 row regular text-grey-900">
                <span>
                  {{
                    row['date_cart'] ? getDateByFormat(row['date_cart']) : null
                  }}
                </span>
              </div>
            </div>
            <div v-else auto-width>
              <div class="body1 regular text-grey-900 text-right">
                {{ row[col.field] == 0 ? '' : (typeof row[col.field] === 'number' ? formattedPrice(row[col.field]) : row[col.field]) }}
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="exportCSV()">
          <q-icon name="description" class="q-mr-sm"/>
          CSVダウンロード
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="exportCSV(true)">
          <q-icon name="description" class="q-mr-sm"/>
          売上/入金まとめ
        </q-btn>
        <q-btn class="q-ml-md" color="primary" :disable="disableExport" unelevated @click="exportPDF()">
          <q-icon name="picture_as_pdf" class="q-mr-sm"/>
          PDFダウンロード
        </q-btn>
        <q-btn class="q-ml-md" outline :disable="disableExport" @click="copytoclipboard()">
          <q-icon name="content_copy" class="q-mr-sm"/>
          コピー
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style scoped>
.print-content * {
  font-size: 12px !important;
}
@media screen and (max-width: 820px) {
  .responsive-view {
    height: calc(100vh - 200px)
}
}

.custom-col {
  flex: 0 0 calc(100% / 9 / 2);
  max-width: calc(100% / 9 / 2);
  text-align: center; /* Just for visualization */
}

.header-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.left {
  display: flex;
  gap: 16px; /* Add gap between the first two fields */
}

.right {
  text-align: right;
  flex-grow: 1;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.bold-line {
  border: 2px solid #000;
  margin-top: 8px;
  margin-bottom: 16px;
}

</style>