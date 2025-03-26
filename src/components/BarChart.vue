<script setup lang="ts">
import { defineProps } from 'vue';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';
import { Bar } from 'vue-chartjs';

// Chart.jsに必要なコンポーネントを登録
ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// チャートエリアのみ背景を塗りつぶすためのカスタムプラグイン
const chartAreaBackgroundPlugin = {
  id: 'chartAreaBackground',
  beforeDraw(chart: any, _args: any, options: any) {
    const { ctx, chartArea: { left, top, width, height } } = chart;
    ctx.save();
    ctx.fillStyle = options?.color || '#ffffff'; // デフォルトは白
    ctx.fillRect(left, top, width, height);
    ctx.restore();
  },
};

// ChartData インターフェース
interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    yAxisID?: string;
  }[];
  weekendIndices?: number[];
}

// コンポーネントのProps定義
const props = defineProps<{
  chartData: ChartData;
  yAxisLeftLabel?: string;  // 左Y軸のタイトル
  yAxisRightLabel?: string; // 右Y軸のタイトル
}>();

// 数値を「10のべき乗」単位で切り上げる関数
const roundToNearestPowerOfTen = (value: number) => {
  if (value === 0) return 10;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / power) * power;
};
</script>

<template>
  <div class="chart-container">
    <Bar
      :data="chartData"
      :options="{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: (context) => {
                return chartData.weekendIndices?.includes(context.index)
                  ? 'red'
                  : '#666';
              },
              callback: function (value, index) {
                return chartData.labels[index]; // ラベル表示
              },
            },
          },
          yAxisLeft: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: yAxisLeftLabel || 'Amount' },
            grid: { drawBorder: false, drawTicks: false },
            ticks: {
              beginAtZero: true,
              stepSize: roundToNearestPowerOfTen(Math.max(...chartData.datasets[0].data)) / 5,
              max: roundToNearestPowerOfTen(Math.max(...chartData.datasets[0].data)),
            },
          },
          yAxisRight: {
            type: 'linear',
            position: 'right',
            title: { display: !!yAxisRightLabel, text: yAxisRightLabel || 'Count' },
            grid: { drawBorder: false, drawOnChartArea: false },
            ticks: {
              beginAtZero: true,
              stepSize: 1,
              maxTicksLimit: 6,
            },
          },
        },
        plugins: {
          // カスタムプラグインにパラメータを渡す
          chartAreaBackground: {
            color: '#ffffff', // 背景色(必要に応じて変更)
          },
          legend: { display: true },
          tooltip: { mode: 'index', intersect: false },
        },
      }"
      :plugins="[chartAreaBackgroundPlugin]"
    />
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 400px;
}
</style>
