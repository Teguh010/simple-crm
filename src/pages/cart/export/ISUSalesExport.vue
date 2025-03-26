<script lang="ts" setup>
import { exportFile } from 'quasar';
import MtModalHeader from '@/components/MtModalHeader.vue'
import { ref, onMounted, defineExpose } from 'vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import GetPdfPerCategorySalesReport from '@/pages/cart/GetPdfPerCategorySalesReport.vue'
import useCartStore from '@/stores/carts'
import useClinicStore from '@/stores/clinics'
import mtUtils from '@/utils/mtUtils'
import { typeItem } from '@/utils/enum'
import { formattedPrice } from '@/utils/helper'
import * as Encoding from 'encoding-japanese';
import dayjs from 'dayjs'

import {
  dateFormat,
  getDateToday,
  getDateTimeNow
} from '@/utils/aahUtils'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const cartStore = useCartStore()
const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const props = defineProps({
  params: {}
})
const searchData = ref({
  flg_completed: 1,
  date_start: props.params.date_start || dayjs().format('YYYY/MM/DD'),
  date_end: props.params.date_end || dayjs().format('YYYY/MM/DD')
});
const disableExport = ref(true)
const flgSortRows = ref(false)

const columns = [
  { name: 'classification', label: '分類', field: 'classification', align: 'left' }, // contain code and name category1
  { name: 'code_category2', label: '分類CD', field: 'code_category2', align: 'left' },
  { name: 'name_category2', label: '项目名', field: 'name_category2', align: 'left' },
  { name: 'name_service_item_unit', label: 'ISU', field: 'name_service_item_unit', align: 'left' },
  { name: 'cd_count', label: '件数', field: 'cd_count', align: 'right' },
  { name: 'total_quantity', label: '数量', field: 'total_quantity', align: 'right' },
  { name: 'total_amount_sales', label: '金额', field: 'total_amount_sales', align: 'right' },
  { name: 'average', label: '平均単価', field: 'average', align: 'right' },
  { name: 'percentage', label: '比率(%)', field: 'percentage', align: 'right' },
];

const rows = ref([]);
const summary = ref([])
const formattedRows = ref([]);

const csvColumns = [
  { name: 'clinic_display_order', label: '順序', field: 'clinic_display_order', align: 'left' },
  { name: 'code_clinic', label: '病院CD', field: 'code_clinic', align: 'left' },
  { name: 'name_clinic_display', label: '病院名', field: 'name_clinic_display', align: 'left' },
  { name: 'flg_service', label: '販売区分', field: 'flg_service', align: 'left' },
  { name: 'type_service_item', label: '大分類', field: 'type_service_item', align: 'left' },
  { name: 'name_category1', label: '中分類', field: 'name_category1', align: 'left' },
  { name: 'name_category2', label: '小分類', field: 'name_category2', align: 'left' },
  { name: 'name_service_item_unit', label: 'ISU', field: 'name_service_item_unit', align: 'left' },
  { name: 'cd_count', label: '件数', field: 'cd_count', align: 'right' },
  { name: 'total_quantity', label: '数量', field: 'total_quantity', align: 'right' },
  { name: 'total_amount_sales', label: '金額', field: 'total_amount_sales', align: 'right' },
  { name: 'ratio', label: '全体比率', field: 'ratio', align: 'right' },
  { name: 'datetime_export', label: '抽出日', field: 'datetime_export', align: 'right' },
];

const closeModal = () => {
  emits('close')
}

const typeItemName = (value: any) =>
  typeItem.find((v) => v.value === value)?.label


const processRows = () => {
  const root = [];
  const serviceMap = {};

  rows.value.forEach(row => {
    const serviceType = row.flg_service ? 'サービス' : '商品';
    const itemType = row.flg_service ? (row.id_cm_type_service || '未分類') : (typeItemName(row.type_item) || '未分類');
    const category1Key = `${row.code_category1} ${row.name_category1}`;
    const category2Key = `${row.code_category2} ${row.name_category2}`;

    if (!serviceMap[serviceType]) {
      serviceMap[serviceType] = { header: 1, label: serviceType, total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      root.push(serviceMap[serviceType]);
    }

    let itemTypeMap = serviceMap[serviceType].children.find(item => item.label === itemType);
    if (!itemTypeMap) {
      itemTypeMap = { header: 2, label: itemType, total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      serviceMap[serviceType].children.push(itemTypeMap);
    }

    let category1Map = itemTypeMap.children.find(cat => cat.label === category1Key);
    if (!category1Map) {
      category1Map = { header: 3, label: category1Key, total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      itemTypeMap.children.push(category1Map);
    }

    let category2Map = category1Map.children.find(cat => cat.label === category2Key);
    if (!category2Map) {
      category2Map = {
         header: 4, label: category2Key, code_category2: row.code_category2, name_category2: row.name_category2, 
         total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] 
      };
      category1Map.children.push(category2Map);
    }

    category2Map.children.push({
      header: 5,
      // code_category2: row.code_category2,
      // name_category2: row.name_category2,
      name_service_item_unit: row.name_service_item_unit,
      cd_count: row.cd_count,
      total_quantity: row.total_quantity,
      total_amount_sales: row.total_amount_sales,
      average: row.total_quantity ? Math.round(parseInt(row.total_amount_sales) / row.total_quantity) : 0,
      percentage: `${((row.total_amount_sales / summary.value.total_amount) * 100).toFixed(2)}%`
    });

    // Aggregate totals
    category2Map.cd_count += row.cd_count;
    category2Map.total_quantity += row.total_quantity;
    category2Map.total_amount_sales += row.total_amount_sales;

    itemTypeMap.cd_count += row.cd_count;
    itemTypeMap.total_quantity += row.total_quantity;
    itemTypeMap.total_amount_sales += row.total_amount_sales;

    serviceMap[serviceType].cd_count += row.cd_count;
    serviceMap[serviceType].total_quantity += row.total_quantity;
    serviceMap[serviceType].total_amount_sales += row.total_amount_sales;
  });

  // After processing all rows, sort ISUs based on total_quantity in descending order
  root.forEach(service => {
    service.children.forEach(itemType => {
      itemType.children.forEach(category1 => {
        category1.children.forEach(category2 => {
          category2.children.sort((a, b) => b.total_quantity - a.total_quantity); // Sort ISUs by total_quantity
        });
      });
    });
  });

  formattedRows.value = root; // The top-level structure for rendering in the table
};

const sortRows = () => {
  const sortWithUnclassifiedAtBottom = (a, b) => {
    if (a.label === '未分類') return 1;
    if (b.label === '未分類') return -1;
    return b.total_amount_sales - a.total_amount_sales;
  };

  if (flgSortRows.value) {
    // Sort each level while maintaining the hierarchical structure
    formattedRows.value.forEach(service => {
      service.children.sort(sortWithUnclassifiedAtBottom);
      service.children.forEach(itemType => {
        itemType.children.sort(sortWithUnclassifiedAtBottom);
        itemType.children.forEach(category1 => {
          category1.children.sort(sortWithUnclassifiedAtBottom);
        });
      });
    });
  } else {
    // Reset to original order by re-processing the rows
    processRows();
  }
};


const flattenedRows = () => {
  const totalAmountSales = summary.value.total_amount || 1;  // Ensure no division by zero
  return rows.value.map(detail => {
    const ratio = ((detail.total_amount_sales / totalAmountSales) * 100).toFixed(2) + '%';
    let flg_service = '';
    let type_service_item = '';
    if (detail.flg_service) {
      flg_service = 'サービス';
      type_service_item = detail.id_cm_type_service;
    } else {
      flg_service = '商品';
      type_service_item = typeItemName(detail.type_item)?? '-';
    }
    const datetime_export = getDateTimeNow();
    return {
      ...detail,
      flg_service,
      ratio,
      type_service_item,
      datetime_export
    };
  });
}

const exportCSV = () => {
  // Calculate total amount of sales

  // Flatten the nested structure and calculate ratio
  const data = flattenedRows()

  const csvContent = [
    csvColumns.map(col => col.label).join(','),  // Header row
    ...data.map(row => csvColumns.map(col => row[col.field]).join(','))  // Data rows
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
  const formattedSelectedDayRange = `${dateFormat(searchData.value.date_start, 'YYMMDD')}_${dateFormat(searchData.value.date_end, 'YYMMDD')}`;
  const fileName = `isu_${formattedSelectedDayRange}_${clinicStore.getClinic.name_clinic_display}(出力${formattedDate}).csv`;
  
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
};

const copytoclipboard = () => {
  // Calculate total amount of sales

  // Flatten the nested structure and calculate ratio
  const data = flattenedRows()

  const clipboardData = [
    csvColumns.map(col => col.label).join('\t'),  // Header row
    ...data.map(row => csvColumns.map(col => row[col.field]).join('\t'))  // Data rows
  ].join('\n');


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
  mtUtils.pdfRender(GetPdfPerCategorySalesReport, {
    resultList: [...formattedRows.value],
    dateParams: {
      date_start: searchData.date_start,
      date_end: searchData.date_end
    },
    summaryData: {...summary.value}
  })
};

const fetchSalesSummary = async () => {
  // Create queryParams object to hold all request parameters
  // const queryParams = {
  //   ...props.params,
  //   flg_completed: flgCompleted.value // Pass the flg_completed value
  // };

  await cartStore.fetchISUSalesSummary(searchData.value).then(res => {
    rows.value = res.data.data.cart_details
    summary.value = res.data.data.summary
    disableExport.value = false
    processRows();
  })
};

const handleChange = async () => {
  await fetchSalesSummary(); // Re-fetch the data on change
};

const moveNext: () => void = () => {
  console.warn('Enter key pressed')
}

defineExpose({
  moveNext
})

onMounted(async () => {
 await fetchSalesSummary()
})

</script>
<template>
  <div style="width: calc(100vw - 50px); overflow-x: hidden;">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          集計
        </q-toolbar-title>
        <div>
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start"
                outlined
                label="会計日：Start"
                type="date"
                autofocus
                tabindex="1"
                @keydown.enter.prevent="moveNext?.()"
                @update:date = "handleChange"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end"
                outlined
                class="q-mx-sm"
                type="date"
                label="会計日：End"
                tabindex="2"
                @update:date = "handleChange"
                @keydown.enter.prevent="moveNext?.()"
              />
              <MtFormRadiobtn v-model="searchData.flg_completed" label="完了会計のみ" :val="1"  @update:modelValue="handleChange" />
              <MtFormRadiobtn v-model="searchData.flg_completed" label="未完のみ" :val="0"  @update:modelValue="handleChange" class="q-mr-md" />
              <MtFormCheckBox
                v-model:checked="flgSortRows"
                @update:checked="sortRows"
              />
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="q-px-lg content" style="overflow-x: scroll;">
      <div class="header-info">
        <div class="left">
          <span class="title">会計日報  期間</span>
          <span class="q-ml-md">{{ searchData.date_start + ' ~ ' + searchData.date_end }}</span>
        </div>
        <div class="right">
          <span class="title">{{ clinicStore.getClinic.code_clinic }} {{ clinicStore.getClinic.name_clinic_display }}</span>
          <span class="caption1 regular">{{ '出力日: ' + new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
      </div>
      <q-separator color="dark" size="2px" />
      <MtTable2 :columns="columns" :rows="formattedRows" :rowsBg="true" flat no-data-message="登録がありません。" no-result-message="該当のデータが見つかりませんでした">
        <template v-slot:body="{ row: service }">
          <!-- Service Level -->
          <tr :class="'heading' + service.header">
            <td :colspan="columns.length">
              <strong>{{ service.label }}</strong>
            </td>
          </tr>
          <!-- Item Type Level -->
          <template v-for="itemType in service.children" :key="itemType.label">
            <tr :class="'heading' + itemType.header">
              <td :colspan="4">
                <strong>{{ itemType.label }}</strong>
              </td>
              <td class="text-right">{{ itemType.cd_count }}</td>
              <td class="text-right">{{ itemType.total_quantity }}</td>
              <td class="text-right">{{ formattedPrice(itemType.total_amount_sales) }}</td>
              <td colspan="2"></td>
            </tr>
            <!-- Category Level -->
            <template v-for="category1 in itemType.children" :key="category1.label">
              <tr :class="'heading' + category1.header">
                <td :colspan="columns.length">
                  <strong>{{ category1.label }}</strong>
                </td>
              </tr>
              <!-- Category2 Level -->
              <template v-for="category2 in category1.children" :key="category2.code_category2">
                <tr :class="'heading' + category2.header">
                  <td></td>
                  <td>{{ category2.code_category2 }}</td>
                  <td>{{ category2.name_category2 }}</td>
                  <td colspan="6"></td>
                </tr>

                <!-- ISU Level -->
                <template v-for="isu in category2.children" :key="isu.label">
                  <tr :class="'heading' + isu.header">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td>{{ isu.name_service_item_unit }}</td>
                    <td class="text-right">{{ isu.cd_count }}</td>
                    <td class="text-right">{{ isu.total_quantity }}</td>
                    <td class="text-right">{{ formattedPrice(isu.total_amount_sales) }}</td>
                    <td class="text-right">{{ isu.average }}</td>
                    <td class="text-right">{{ isu.percentage }}</td>
                  </tr>
                </template>
              </template>
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
          <q-icon name="description" class="q-mr-sm"/>
          CSVダウンロード
        </q-btn>
        <!-- <q-btn :disable="disableExport" class="q-ml-md" color="primary" unelevated @click="exportPDF()">
          <q-icon name="picture_as_pdf" class="q-mr-sm"/>
          PDFダウンロード
        </q-btn> -->
        <q-btn :disable="disableExport" class="q-ml-md" outline @click="copytoclipboard()">
          <q-icon name="content_copy" class="q-mr-sm"/>
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

.table-body-row > td {
  height: 24px;
}

.heading1 {
  font-size: 1.2em;
  padding: 7px 16px;
  background: #757575;
  color: #fff;
  strong {
    margin-left: 0px;
  }
}

.heading2 {
  font-size: 1.1em;
  padding: 7px 16px;
  background: #eee;
  color: #000;
  strong {
    margin-left: 20px;
  }
}

.heading3 {
  font-size: 1em;
  padding: 7px 16px;
  strong {
    margin-left: 40px;
  }
}
</style>