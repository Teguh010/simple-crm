<script setup lang="ts">

import {computed, inject} from "vue";

const props = defineProps({
  value:{
    default : 0,
  },
  amountPill:{
    default:0,
  },
  isCustom: {
    default: false,
  }
})

const pillFillClass = inject('pillFill', '')

const progressPercentage = computed(()=> `${Math.round(props.value * 100)}%`) // Circumference of the circle (2πr))
const progressPath = computed(() =>{
  const isFullCircle = props.value >= 1;
  if (isFullCircle) {
    return `M18,18 L18,2 A16,16 0 1 1 17.989946904169972,2.000003158273305 z`;
  }
  const endAngle = props.value * 2 * Math.PI;
  const largeArcFlag = props.value > 0.5 ? 1 : 0;
  const xEndPoint = 18 + 16 * Math.sin(endAngle);
  const yEndPoint = 18 - 16 * Math.cos(endAngle);
  // Move to the center, draw line to the start of the progress, arc to the end point, and close the path.
  return `M18,18 L18,2 A16,16 0 ${largeArcFlag} 1 ${xEndPoint},${yEndPoint} z`;
}) // Circumference of the circle (2πr))
</script>

<template>
  <div :class="isCustom ? 'progress-circle-container-1' : `progress-circle-container`">
      <svg class="progress-circle" viewBox="0 0 36 36">
        <!-- Background circle -->
        <circle class="circle-bg" cx="18" cy="18" r="16"></circle>

        <!-- Filled segment -->
        <path class="circle" :class="pillFillClass ? 'grey-500' : ''" :d="progressPath" />

        <!-- Optional: Text in the center -->
        <text x="18" y="20.35" class="circle-text" v-if="amountPill">{{ amountPill }}</text>
      </svg>
  </div>
</template>
<style scoped lang="scss">
  .progress-circle-container {
    width: 50px;
    height: 50px;
  }

  .progress-circle-container-1 {
    width: 32.5px;
    height: 32.5px;
  }

  .progress-circle {
    width: 100%;
    height: 100%;
    display: flex;
    justify-items: center;
    align-items: center;
    align-content: center;
  }

  .circle-bg {
    fill: #e6e6e6;
    stroke: none;
  }

  .circle {
    fill: #2775D1;
    &.grey-500 {
      fill: #9e9e9e;
    }
  }

  .circle-text {
    fill: black;
    color: black;
    font-size: 10px;
    text-anchor: middle;
    //alignment-baseline: middle;
  }
</style>