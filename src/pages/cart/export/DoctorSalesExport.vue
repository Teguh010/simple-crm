<script lang="ts" setup>
import { exportFile } from 'quasar';
import MtModalHeader from '@/components/MtModalHeader.vue'
import { ref, onMounted } from 'vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import GetPdfPerEmployeeSalesReport from '@/pages/cart/GetPdfPerEmployeeSalesReport.vue'
import useCartStore from '@/stores/carts'
import useClinicStore from '@/stores/clinics'
import mtUtils from '@/utils/mtUtils'
import { typeItem, typeOccupation } from '@/utils/enum'
import { formattedPrice } from '@/utils/helper'
import * as Encoding from 'encoding-japanese';
import {
  dateFormat,
  getDateToday,
  getDateTimeNow
} from '@/utils/aahUtils'

const cartStore = useCartStore()
const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const props = defineProps({
  params: {}
})
const flgCompleted = ref(1);
const flgSortRows = ref(false)
const disableExport = ref(true)

const columns = [
  { name: 'classification', label: '分類', field: 'classification', align: 'left', style: 'width: 20%', }, // contain code and name category1
  { name: 'code_category1', label: '分類CD', field: 'code_category1', align: 'left' },
  { name: 'name_category1', label: '项目名', field: 'name_category1', align: 'left' },
  { name: 'cd_count', label: '件数', field: 'cd_count', align: 'right' },
  { name: 'total_quantity', label: '数量', field: 'total_quantity', align: 'right' },
  { name: 'total_amount_sales', label: '金额', field: 'total_amount_sales', align: 'right' },
];

const rows = ref([]);
const summary = ref([])
const formattedRows = ref([]);

const csvColumns = [
  { name: 'clinic_display_order', label: '順序', field: 'clinic_display_order', align: 'left' },
  { name: 'code_clinic', label: '病院CD', field: 'code_clinic', align: 'left' },
  { name: 'name_clinic_display', label: '病院名', field: 'name_clinic_display', align: 'left' },
  { name: 'name_display_employee', label: '売上担当者', field: 'name_display_employee', align: 'left' },
  { name: 'flg_service', label: '販売区分', field: 'flg_service', align: 'left' },
  { name: 'type_service_item', label: '大分類', field: 'type_service_item', align: 'left' },
  { name: 'name_category1', label: '中分類', field: 'name_category1', align: 'left' },
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

const typeOccupationName = (value: any) =>
  typeOccupation.find((v) => v.value === value)?.label

const processRows = () => {
  const root = [];
  const occupationMap = {};

  rows.value.forEach(row => {
    const occupationType = `職業タイプ: ${typeOccupationName(row.type_occupation) ?? '不明'}`;
    const employeeLabel = row.name_display_employee ?? '担当者なし';
    const flgServiceLabel = row.flg_service ? 'サービス' : '商品';
    const typeServiceItemLabel = row.flg_service == 1 ? row.id_cm_type_service : typeItemName(row.type_item);

    if (!occupationMap[occupationType]) {
      occupationMap[occupationType] = { header: 1, label: occupationType, total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      root.push(occupationMap[occupationType]);
    }

    let employeeMap = occupationMap[occupationType].children.find(item => item.label === employeeLabel);
    if (!employeeMap) {
      employeeMap = { header: 2, label: employeeLabel, total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      occupationMap[occupationType].children.push(employeeMap);
    }

    let flgServiceMap = employeeMap.children.find(cat => cat.label === flgServiceLabel);
    if (!flgServiceMap) {
      flgServiceMap = { header: 3, label: flgServiceLabel, total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      employeeMap.children.push(flgServiceMap);
    }

    let typeServiceItemMap = flgServiceMap.children.find(subCat => subCat.label === typeServiceItemLabel);
    if (!typeServiceItemMap) {
      typeServiceItemMap = { header: 4, label: typeServiceItemLabel ?? '未分類', total_quantity: 0, total_amount_sales: 0, cd_count: 0, children: [] };
      flgServiceMap.children.push(typeServiceItemMap);
    }

    typeServiceItemMap.children.push({
      code_category1: row.code_category1,
      name_category1: row.name_category1,
      cd_count: row.cd_count,
      total_quantity: row.total_quantity,
      total_amount_sales: row.total_amount_sales,
    });

    // Aggregate totals
    typeServiceItemMap.cd_count += row.cd_count;
    typeServiceItemMap.total_quantity += row.total_quantity;
    typeServiceItemMap.total_amount_sales += row.total_amount_sales;

    flgServiceMap.cd_count += row.cd_count;
    flgServiceMap.total_quantity += row.total_quantity;
    flgServiceMap.total_amount_sales += row.total_amount_sales;

    employeeMap.cd_count += row.cd_count;
    employeeMap.total_quantity += row.total_quantity;
    employeeMap.total_amount_sales += row.total_amount_sales;

    occupationMap[occupationType].cd_count += row.cd_count;
    occupationMap[occupationType].total_quantity += row.total_quantity;
    occupationMap[occupationType].total_amount_sales += row.total_amount_sales;
  });

  formattedRows.value = root; // The top-level structure for rendering in the table
};

const sortRows = () => {
  const sortByTotalAmountSales = (a, b) => b.total_amount_sales - a.total_amount_sales;

  const sortWithSpecialCases = (items, specialLabel) => {
    items.sort((a, b) => {
      if (a.label === specialLabel) return 1;
      if (b.label === specialLabel) return -1;
      return sortByTotalAmountSales(a, b);
    });
  };

  if (flgSortRows.value) {
    formattedRows.value.forEach(occupation => {
      // Sort employees, placing '担当者なし' at the bottom
      sortWithSpecialCases(occupation.children, '担当者なし');

      occupation.children.forEach(employee => {
        // Sort services/products within employee
        employee.children.sort(sortByTotalAmountSales);

        employee.children.forEach(flgService => {
          // Sort type service items within service/product, placing '未分類' at the bottom
          sortWithSpecialCases(flgService.children, '未分類');

          flgService.children.forEach(typeServiceItem => {
            // Sort categories within type service item
            typeServiceItem.children.sort(sortByTotalAmountSales);
          });
        });
      });
    });
  } else {
    processRows();
  }
};


const flattenedRows = () => {
  const totalAmountSales = summary.value.total_amount || 1;  // Ensure no division by zero
  return rows.value.map(detail => {
    const name_display_employee = detail.name_display_employee?? '担当者なし';
    const ratio = ((detail.total_amount_sales / totalAmountSales) * 100).toFixed(2) + '%';
    const type_occupation = typeOccupationName(detail.type_occupation)?? null;
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
      type_occupation,
      name_display_employee,
      flg_service,
      type_service_item,
      ratio,
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
  const formattedSelectedDayRange = `${dateFormat(props.params.date_start, 'YYMMDD')}_${dateFormat(props.params.date_end, 'YYMMDD')}`;
  const fileName = `doctor_${formattedSelectedDayRange}_${clinicStore.getClinic.name_clinic_display}(出力${formattedDate}).csv`;

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
  mtUtils.pdfRender(GetPdfPerEmployeeSalesReport, {
    resultList: [...formattedRows.value],
    dateParams: {
      date_start: props.params.date_start,
      date_end: props.params.date_end
    }
  })
};

const fetchSalesSummary = async () => {
  // Create queryParams object to hold all request parameters
  const queryParams = {
    ...props.params,
    flg_completed: flgCompleted.value // Pass the flg_completed value
  };

  await cartStore.fetchDoctorSalesSummary(queryParams).then(res => {
    rows.value = res.data.data.cart_details
    summary.value = res.data.data.summary
    disableExport.value = false
    processRows();
  })
};

const handleFlgCompletedChange = async () => {
  await fetchSalesSummary(); // Re-fetch the data on change
};

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
          <MtFormRadiobtn v-model="flgCompleted" label="完了会計のみ" :val="1"  @update:modelValue="handleFlgCompletedChange" />
          <MtFormRadiobtn v-model="flgCompleted" label="未完のみ" :val="0"  @update:modelValue="handleFlgCompletedChange" class="q-mr-md" />
          <MtFormCheckBox
            v-model:checked="flgSortRows"
            @update:checked="sortRows"
          />
        </div>
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="q-px-lg content" style="overflow-x: scroll">
      <div class="header-info">
        <div class="left">
          <span class="title">対象者別売上集計</span>
          <span class="q-mx-sm"> [ 期間 ]</span>
          <span class="">{{ props.params.date_start + ' ~ ' + props.params.date_end }}</span>
        </div>
        <div class="right">
          <span class="title">{{ clinicStore.getClinic.code_clinic }} {{ clinicStore.getClinic.name_clinic_display }}</span>
          <span class="caption1 regular">{{ '出力日: ' + new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) }}</span>
        </div>
      </div>
      <q-separator color="dark" size="2px" />
      <MtTable2
        :columns="columns"
        :rows="formattedRows"
        :rowsBg="true"
        flat
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした"
      >
        <template v-slot:body="{ row: occupation }">
          <!-- Occupation Level -->
          <tr :class="'heading' + occupation.header">
            <td :colspan="columns.length">
              <strong>{{ occupation.label }}</strong>
            </td>
          </tr>
          <!-- Employee Level -->
          <template v-for="employee in occupation.children" :key="employee.label">
            <tr :class="'heading' + employee.header">
              <td :colspan="3">
                <strong>{{ employee.label }}</strong>
              </td>
              <td class="text-right">{{ employee.cd_count }}</td>
              <td class="text-right">{{ employee.total_quantity }}</td>
              <td class="text-right">{{ formattedPrice(employee.total_amount_sales) }}</td>
            </tr>
            <!-- Service/Product Level -->
            <template v-for="flgService in employee.children" :key="flgService.label">
              <tr :class="'heading' + flgService.header">
                <td :colspan="columns.length">
                  <strong>{{ flgService.label }}</strong>
                </td>
              </tr>
              <!-- Type Service Item Level -->
              <template v-for="typeServiceItem in flgService.children" :key="typeServiceItem.label">
                <tr :class="'heading' + typeServiceItem.header">
                  <td :colspan="columns.length">
                    <strong>{{ typeServiceItem.label }}</strong>
                  </td>
                </tr>
                <!-- Category Level -->
                <template v-for="category in typeServiceItem.children" :key="category.code_category1">
                  <tr :class="'heading' + category.header">
                    <td>{{ category.classification }}</td>
                    <td>{{ category.code_category1 }}</td>
                    <td>{{ category.name_category1 }}</td>
                    <td class="text-right">{{ category.cd_count }}</td>
                    <td class="text-right">{{ category.total_quantity }}</td>
                    <td class="text-right">{{ formattedPrice(category.total_amount_sales) }}</td>
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
        <q-btn :disable="disableExport" class="q-ml-md" color="primary" unelevated @click="exportPDF()">
          <q-icon name="picture_as_pdf" class="q-mr-sm"/>
          PDFダウンロード
        </q-btn>
        <q-btn :disable="disableExport" class="q-ml-md" outline @click="copytoclipboard()">
          <q-icon name="content_copy" class="q-mr-sm"/>
          コピー
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style scoped lang="scss">
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
  gap: 8px;
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

.heading1 {
  font-size: 1.2em;
  padding: 4px;
  background: #757575;
  strong {
    margin-left: 0px;
  }
  td {
    color: #fff;
  }
}

.heading2 {
  font-size: 1.1em;
  padding: 4px;
  background: #eee;
  color: #000;
  strong {
    margin-left: 20px;
  }
  td {
    font-weight: 600
  }
}

.heading3 {
  font-size: 1em;
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
