<script setup lang="ts">
import { defineProps, ref, watch } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(Title, Tooltip, Legend, ArcElement);

interface ChartData {
  labels: string[];
  datasets: { label: string; data: number[] }[];
}

const props = defineProps<{ chartData: ChartData }>();

/**
 * totalAmount: We'll keep this in a ref so we can:
 *    - Initialize it to the sum of the new dataset
 *    - Update it when legend items are toggled
 */
const totalAmount = ref(0);

/**
 * Recalculate the total based on which slices are still visible in Chart.js
 */
function recalcTotal(chartInstance: any) {
  if (!chartInstance) return;

  const dataset = chartInstance.data.datasets[0];
  if (!dataset) {
    totalAmount.value = 0;
    return;
  }

  let sum = 0;
  dataset.data.forEach((value: number, dataIndex: number) => {
    // Chart.js holds toggles via "data visibility"
    const datasetVisible = chartInstance.isDatasetVisible(0);
    const sliceVisible = chartInstance.getDataVisibility(dataIndex);
    if (datasetVisible && sliceVisible) {
      sum += value;
    }
  });

  totalAmount.value = sum;
}

/**
 * A plugin to display totalAmount in the center
 */
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw(chart: any) {
    const { width, height, ctx } = chart;
    ctx.save();

    // Format total as JPY currency
    const totalFormatted = totalAmount.value.toLocaleString('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    });

    // Dynamically adjust font size
    const baseFontSize = Math.min(width, height) / 10;
    const adjustedFontSize = Math.max(baseFontSize - totalFormatted.length * 2, 16);

    ctx.font = `bold ${adjustedFontSize}px sans-serif`;
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Position the text roughly in the middle
    const textX = width / 2;
    const textY = height / 1.8;
    ctx.fillText(totalFormatted, textX, textY);

    ctx.restore();
  },
};

/**
 * Chart.js options
 *    - Key piece: legend.onClick recalculates total after toggling
 */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      onClick: (evt: any, legendItem: any, legend: any) => {
        const chartInstance = legend.chart;
        const i = legendItem.index;
        // Toggle the data's visibility
        chartInstance.toggleDataVisibility(i);
        chartInstance.update();
        // Recalc total
        recalcTotal(chartInstance);
      },
    },
  },
};

/**
 * Watch for changes in chartData
 *    - We "reset" totalAmount to the sum of the new dataset
 *    - Because we use :key on the <Doughnut>, the chart re-mounts fresh,
 *      so all slices are visible by default -> the sum is the full dataset.
 */
watch(
  () => props.chartData,
  (newVal) => {
    const dataArr = newVal.datasets[0]?.data || [];
    totalAmount.value = dataArr.reduce((sum, v) => sum + v, 0);
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <div class="chart-container">
    <!-- 
      :key="JSON.stringify(chartData)" ensures
      that whenever chartData changes, this entire
      <Doughnut> component is unmounted & re-mounted fresh.
      That resets the legend to default with no toggles off.
    -->
    <Doughnut
      :key="JSON.stringify(chartData)"
      :data="chartData"
      :options="chartOptions"
      :plugins="[centerTextPlugin]"
    />
  </div>
</template>
