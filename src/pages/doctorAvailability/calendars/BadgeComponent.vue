<script setup lang="ts">
import { computed } from 'vue'
import { colors } from 'quasar'
import { getRgbFromString } from '@/pages/doctorAvailability/calendars/utils'

const { getPaletteColor } = colors

export interface BadgeComponentProps {
  color: string
  textColor: string
  label?: string
  
}

const props = withDefaults(defineProps<BadgeComponentProps>(), {
  textColor: 'white',
  color: 'rgb(94,94,94)',
  label: ''
})

</script>

<template>
  <div
    :style="{
      color: textColor,
      backgroundColor: getRgbFromString(color)
    }"
    class="badge"
  >
    {{ label }}
  </div>
</template>

<style scoped lang="scss">
.badge {
  padding: 4px;
  width: 20px;
  height: 20px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>