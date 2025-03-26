<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import BarChart from '@/components/BarChart.vue';
import DoughnutChart from '@/components/DoughnutChart.vue';

import useCartStore from '@/stores/carts'
import useClinicStore from '@/stores/clinics'
import { ref, onMounted } from 'vue'
import { formattedPrice } from '@/utils/helper'
import { getDateByFormat, getMonthStartAndEnd } from '@/utils/aahUtils'

import dayjs from 'dayjs'

const cartStore = useCartStore()
const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

// State
const searchData = ref({
  target_date: dayjs().format('YYYY-MM-DD'),
  flg_completed: 1
})

const summary = ref({})

const getSectionLabel = (key) => {
  const sectionLabels = {
    month: '月次要約', // Monthly Summary
    day: '日次要約',   // Daily Summary
    slot1: '時間枠1',   // Slot 1
    slot2: '時間枠2',   // Slot 2
    slot3: '時間枠3',   // Slot 3
  };
  return sectionLabels[key] || key; // Return the label or key if not found
};

const prepareChartData = (paymentMethodTotals) => {
  const labels = [];
  const amounts = [];
  const counts = [];

  for (const [method, data] of Object.entries(paymentMethodTotals || {})) {
    labels.push(method);
    amounts.push(data.amount || 0);
    counts.push(data.count || 0);
  }

  return {
    labels,
    datasets: [
      {
        label: '入金額 (円)',
        data: amounts,
        backgroundColor: 'rgba(235, 208, 0, 0.8)',
        yAxisID: 'yAxisLeft',
      },
      {
        label: '会計数',
        data: counts,
        backgroundColor: 'rgba(0, 190, 235, 0.5)',
        yAxisID: 'yAxisRight',
      },
    ],
  };
};


const prepareMonthlyChartData = (monthlyData) => {
  const labels = [];
  const amounts = [];
  const counts = [];
  const weekendIndices = []; // Store indices of weekends

  const weekdaysJP = ['日', '月', '火', '水', '木', '金', '土']; // Japanese weekday names

  // Get the current month length
  const totalDays = dayjs().daysInMonth();

  for (let day = 1; day <= totalDays; day++) {
    const date = dayjs().date(day);
    const weekdayIndex = date.day(); // 0 = Sunday, 6 = Saturday
    const weekdayJP = weekdaysJP[weekdayIndex];

    labels.push(`${day} (${weekdayJP})`); // Format: "1 (月)", "2 (火)", etc.

    if (weekdayJP === '土' || weekdayJP === '日') {
      weekendIndices.push(day - 1); // Store index for weekend
    }

    amounts.push(monthlyData?.daily?.[day]?.payment?.total_valid_payments || 0);
    counts.push(monthlyData?.daily?.[day]?.cart?.total_carts || 0);
  }

  return {
    labels,
    datasets: [
      {
        label: '入金 (円)',
        data: amounts,
        backgroundColor: 'rgba(235, 208, 0, 0.8)',
        yAxisID: 'yAxisLeft',
      },
      {
        label: '会計件数',
        data: counts,
        backgroundColor: 'rgba(0, 190, 235, 0.5)',
        yAxisID: 'yAxisRight',
      }
    ],
    weekendIndices
  };
};


const prepareMonthlyPaymentMethodChartData = (paymentMethodTotals) => {
  if (!paymentMethodTotals) return { labels: [], datasets: [] };

  const labels = [];
  const amounts = [];

  for (const [method, data] of Object.entries(paymentMethodTotals)) {
    if (data.amount && data.amount > 0) { // Only include valid payments
      labels.push(method);
      amounts.push(data.amount);
    }
  }

  let baseColors = [
    '#d1cd00', '#87CEFA', '#FFD700', '#98FB98', '#FF8C00',
    '#BA55D3', '#20B2AA', '#778899', '#DC143C', '#32CD32'
  ];

  // Dynamically generate additional colors if more than baseColors.length
  while (labels.length > baseColors.length) {
    baseColors = baseColors.concat(generateRandomColor()); // Expand colors dynamically
  }

  return {
    labels,
    datasets: [
      {
        label: '入金 (円)',
        data: amounts,
        backgroundColor: baseColors.slice(0, labels.length), // Ensure enough colors
        hoverOffset: 4,
      }
    ],
  };
};

const generateRandomColor = () => {
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 80%)`;
};

const fetchSummary = async () => {
  const queryParams = { ...searchData.value }
  const res = await cartStore.fetchSalesSummary(queryParams)
  summary.value = res.data.data
}

// Handle Completion Status Change
const handleFlgCompletedChange = async () => {
  await fetchSummary()
}

onMounted(async () => {
  await fetchSummary()
})
</script>

<template>
  <div style="width: calc(100vw - 50px); overflow-x: hidden">
    <!-- Modal Header -->
    <MtModalHeader @closeModal="closeModal" class="q-mr-sm">
      <q-toolbar class="text-primary q-pa-none q-mr-sm">
        <q-toolbar-title class="title2 bold text-grey-900">日報</q-toolbar-title>
        <div class="q-gutter-md row">
          <MtFormInputDate v-model:date="searchData.target_date" outlined label="会計日" type="date" autofocus
            @update:date="fetchSummary" />
          <MtFormRadiobtn v-model="searchData.flg_completed" label="全て" val=""
            @update:modelValue="handleFlgCompletedChange" />
          <MtFormRadiobtn v-model="searchData.flg_completed" label="完了会計のみ" :val="1"
            @update:modelValue="handleFlgCompletedChange" />
          <div class="right">
            <span class="title">
              {{ clinicStore.getClinic.code_clinic }} {{ clinicStore.getClinic.name_clinic_display }}
            </span>
            <span class="caption1 regular">
              出力日: {{ new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour:
              '2-digit', minute: '2-digit' }) }}
            </span>
          </div>
        </div>
      </q-toolbar>
    </MtModalHeader>

    <!-- Content Section -->
    <q-card-section class="q-px-lg content" style="height: calc(100dvh - 100px);">
      <!-- Summary Section -->
      <div v-for="(key, index) in ['month', 'day', 'slot1', 'slot2', 'slot3']" :key="index" class="q-mb-lg">
        <div class="report-background font-13px q-px-md q-py-lg">
          <!-- Main Summary Data Row -->
          <div class="row q-col-gutter-md q-mb-sm" >
            <div class="col-1 q-mt-sm"> 
              <span class="field-label-report q-ml-sm">{{ getSectionLabel(key) }}</span>
            </div>
            <div class="col">
              <!-- Check if data exists -->
              <template v-if="summary[key]">
                <template v-if="['slot1', 'slot2', 'slot3'].includes(key)">
                  <div class="q-pb-md">
                  {{ summary[key]?.start_time && summary[key]?.end_time 
                      ? `${summary[key].start_time.slice(0, 5)} 〜 ${summary[key].end_time.slice(0, 5)} の時間枠`
                      : '‼ 不正なデータです' 
                  }}
                  </div>
                </template>
                <template v-else-if="key == 'month'">
                  <div class="q-pb-md label-grey">
                    {{
                      getMonthStartAndEnd(getDateByFormat(searchData.target_date, 'YYYY/MM'))
                        ? `${getDateByFormat(getMonthStartAndEnd(getDateByFormat(searchData.target_date, 'YYYY/MM')).date_start, 'YYYY/MM/DD')} 〜 ${getDateByFormat(getMonthStartAndEnd(getDateByFormat(searchData.target_date, 'YYYY/MM')).date_end, 'YYYY/MM/DD')}`
                        : '‼ 不正なデータです'
                    }}
                  </div>
                </template>

                <!-- from cart -->
                <div v-if="!['slot1', 'slot2', 'slot3'].includes(key)" class="q-mb-md">
                  <!-- not showing this in slots, because ideally its the same as day view -->
                  <span class="label-grey">会計件数</span><span class="font-15px text-weight-bold">{{summary[key].cart?.total_carts || 0}}</span> 件
                  <span class="label-grey q-ml-md">会計税別金額</span><span class="digit-highlight-blue">{{formattedPrice(summary[key].cart?.total_modified_sales_amount_notax || 0)}}</span> 円
                  <span class="label-grey q-ml-md">消費税</span><span class="digit-highlight-blue">{{formattedPrice(summary[key].cart?.total_tax_amount || 0)}}</span> 円
                  <span class="label-grey q-ml-md">保険負担額</span><span class="digit-highlight-blue">{{formattedPrice(summary[key].cart?.total_amount_insured || 0)}}</span> 円
                  <span class="label-grey q-ml-md">会計単価</span><span class="digit-highlight-blue">{{formattedPrice(summary[key].cart?.average || 0)}}</span> 
                  <span class="label-grey q-ml-xs">（期間内診療日数 {{summary[key].cart?.date_difference || 0}}日 / 診療日平均
                    {{summary[key].cart?.average_per_day || 0}}件)</span>
                </div>

                <!-- from payment -->
                <div class="q-mb-md">
                <span class="label-grey">入金合計</span>
                <span class="digit-highlight-yellow">
                  {{ formattedPrice(
                    // (summary[key].payment?.total_temp_cash_payment || 0) + 
                    (summary[key].payment?.total_cash_payment || 0) + 
                    (summary[key].payment?.total_other_payment || 0)
                  ) }}
                </span> 円
                  <span class="label-grey q-ml-md">現金入金</span><span class="digit-highlight-yellow">{{formattedPrice(summary[key].payment?.total_cash_payment || 0)}}</span> 円
                  <span class="label-grey q-ml-md">現金外入金</span><span class="digit-highlight-yellow">{{formattedPrice(summary[key].payment?.total_other_payment || 0)}}</span> 円
                  <!-- TODO: Total cart balance -->
                  <span class="label-grey q-ml-md">累計未収金</span><span class="digit-highlight-red">{{formattedPrice(summary[key].payment?.total_cart_balance || 0)}}</span> 円 
                  <span class="label-grey">売上外入金</span><span class="digit-highlight-yellow">{{formattedPrice(summary[key].payment?.total_temp_cash_payment || 0)}}</span> 円
                </div>

                <!-- Upfront Payments & Refunds -->
                <div class="q-mb-md">
                  <span class="label-grey">前受入金</span>
                    <span class="digit-highlight-green">{{formattedPrice(summary[key].payment?.upfront_summary?.received_amount)}}</span> 円
                    <span class="q-ml-sm"> ( {{summary[key].payment?.upfront_summary?.received_count}}件 )</span> 
                  <span class="label-grey q-ml-md">前受清算</span>
                    <span class="digit-highlight-green">{{formattedPrice(summary[key].payment?.upfront_summary?.used_amount)}}</span> 円
                    <span class="q-ml-sm"> ( {{summary[key].payment?.upfront_summary?.used_count}}件 )</span>
                  <span class="label-grey q-ml-md">返金額</span>
                    <span class="digit-highlight-red">{{formattedPrice(summary[key].payment?.refund_summary?.amount)}}</span> 円
                    <span class="q-ml-sm"> ( {{summary[key].payment?.refund_summary?.count}}件 )</span>
                </div>

                <div class="q-mb-md">
                  <!-- 
                    Iterate over each insurer in summary[key].cart.insurers.
                    'insurerObj' holds { name, type_11, type_20 }.
                    'insurerId' is just "1001", "1002", etc.
                  -->
                  <div
                    v-for="(insurerObj, insurerId) in summary[key].cart?.insurers"
                    :key="insurerId"
                    class="q-mb-sm"
                  >
                    <!-- insurerObj.name -> "Anicom" / "iPet" -->
                    <span class="label-grey">
                      {{ insurerObj.name }}
                    </span>
                    <!-- 申請前 (type_11) -->
                    申請前 
                    <span class="digit-highlight-yellow">
                      {{ insurerObj.type_11.amount > 0 
                          ? formattedPrice(insurerObj.type_11.amount) 
                          : '0' 
                      }}
                    </span> 円
                    <!-- Only show the count if amount > 0, or show (0件) if you like -->
                    <span v-if="insurerObj.type_11.count > 0">
                      ({{ insurerObj.type_11.count }}件)
                    </span>

                    <!-- 申請済 (type_20) -->
                    申請済 
                    <span class="digit-highlight-yellow">
                      {{ insurerObj.type_20.amount > 0 
                          ? formattedPrice(insurerObj.type_20.amount) 
                          : '0'
                      }}
                    </span> 円
                    <span v-if="insurerObj.type_20.count > 0">
                      ({{ insurerObj.type_20.count }}件)
                    </span>
                  </div>
                </div>


                <!-- Payment Method Totals -->
                <template v-if="summary[key].payment?.payment_method_totals">
                  <div class="q-mb-sm">
                    <div>
                      <span class="label-grey">《 入金内訳 》</span>
                    </div>
                    
                    <template v-for="(value, methodKey) in summary[key].payment.payment_method_totals" :key="methodKey">
                      <span class="label-grey q-ml-md">{{ methodKey }}</span>
                      <span class="digit-highlight-yellow">{{ value.amount ? formattedPrice(value.amount) : '0' }}</span> 円
                      {{ value.amount > 0 ? `( ${value.count}件 )` : '' }}                      
                    </template>
                  </div>
                </template>
              </template>
              <template v-else>
                <span class="text-grey-600">[{{ getSectionLabel(key) }}] データはありません。</span>
              </template>
            </div>
          </div>

          <!-- CHARTS SECTION -->
          <div v-if="summary[key]" class="row q-col-gutter-md q-mb-sm">
            <!-- Monthly Bar Chart -->
            <template v-if="key === 'month'">
              <div class="col-12 text-center">
                <h3 class="chart-title">推移：会計件数と入金額</h3>
              </div>
              <div class="col-12">
                <BarChart 
                  :chartData="prepareMonthlyChartData(summary[key])" 
                  yAxisLeftLabel="入金額 (円)"
                  yAxisRightLabel="取引数"
                  class="chart-background"
                />
              </div>

              <!-- Payment Method Doughnut Chart -->
              <template v-if="summary[key].payment?.payment_method_totals">
                <div class="col-12 text-center">
                  <h3 class="chart-title">内訳：支払方法</h3>
                </div>
                <div class="col-12">
                  <DoughnutChart
                    :chartData="prepareMonthlyPaymentMethodChartData(summary[key].payment.payment_method_totals)"
                  />
                </div>
              </template>
            </template>

            <!-- Bar Chart for Other Keys -->
            <template v-if="key !== 'month' && summary[key].payment?.payment_method_totals">
              <div class="col-12">
                <BarChart
                  :chartData="prepareChartData(summary[key].payment.payment_method_totals)"
                  yAxisLeftLabel="入金額 (円)"
                  yAxisRightLabel="取引数"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
    </q-card-section>
  </div>
</template>

<style scoped>
.report-background {
  background: #f1f1f1;
  border-radius: 8px;
  border: 1px solid #dfdfdf;
}
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
  font-weight: bold;
  font-size: 16px;
}

.summary-section {
  border-radius: 4px;
}

.table-header {
  background-color: #f5f5f5;
  font-weight: bold !important;
}

.date-col {
  padding: 8px;
}

.cell-content {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
}
.font-13px {
   font-size: 13px;
 }

 .font-15px {
   font-size: 15px;
 }

 .digit-highlight-yellow {
  font-size: 15px;
  background-color: rgba(255, 255, 0, 0.3);
  padding: 0 0.3em;
  display: inline-block;
 }

 .digit-highlight-blue {
  font-size: 15px;
  background-color: rgba(108, 255, 255, 0.3);
  padding: 0 0.3em;
  display: inline-block;
 }

 .digit-highlight-green {
  font-size: 15px;
  background-color: rgba(43, 255, 0, 0.3);
  padding: 0 0.3em;
  display: inline-block;
 }

 .digit-highlight-red {
  font-size: 15px;
  background-color: rgba(230, 149, 255, 0.3);
  padding: 0 0.3em;
  display: inline-block;
 }

 .label-grey {
  font-size: 13px;
  color: #444;
  padding-right: 10px;
 }

.chart-title {
  text-align: center;
  color: #333;
  font-size: 16px;
  margin-top: 30px;
  margin-bottom: 5px;
}

.field-label-report {
  background-color: #fff;
  color: #333;
  font-weight: 800;
  font-size: 14px;
  padding: 3px 10px;
  border-radius: 4px;
}

.label-report-small {
  color: #444;
  font-size: 13px;
  padding: 0px 7px;
  margin-right: 5px; 

}
</style>