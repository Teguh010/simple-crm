<script setup lang="ts">
// Vue core imports
import { computed, defineProps, withDefaults } from 'vue'

// Utility imports
import { aahUtilsGetEmployeeName } from '@/utils/aahUtils'
import { formatDecimalNumber } from '@/utils/helper'

// Store import
import useEmployeeStore from '@/stores/employees'

// Initialize store
const employeeStore = useEmployeeStore()

// Props and default values
const props = withDefaults(
  defineProps<{
    type: 'service' | 'prescription' | 'inject' | 'other'
    mode: 'default' | 'cart'
    pocketData: Record<string, string | number>
  }>(),
  {
    type: 'other',
    mode: 'default',
    pocketData: () => ({} as Record<string, string | number>)
  }
)

// Emits
const emit = defineEmits<{
  (e: 'openPocketList', value: { type: string; id: string | number }): void
}>()

// Class and style computations
const baseClass = 'pocket-base-class flex justify-between items-center'
const borderClass = computed(() => {
  switch (props.type) {
    case 'service':
      return 'border-service'
    case 'prescription':
      return 'border-prescription'
    case 'inject':
      return 'border-inject'
    default:
      return 'border-other'
  }
})
  
// Utility functions
const openTarget = (type: string, id: string | number) => {
  emit('openPocketList', { type, id })
}

const getEmployeeName = (id_employee: string | number) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}

const getTypeForPocket = (data: Record<string, any>) => {
  if (data.id_service_detail) return 'service'
  if (data.id_prescription_detail) return 'prescription'
  if (data.id_inject_detail) return 'inject'
  return 'other'
}

const getDisplayNameForRequestPocket = (data: Record<string, any>) => {
  if (data.id_service_detail) return data.item_service_unit?.name_service_item_unit
  if (data.id_prescription_detail) return data.name_prescription_display
  if (data.id_inject_detail) return data.name_inject_display
}
</script>


<template>
  <div
    v-if="props.mode === 'default'"
    :class="[baseClass, borderClass]"
    @click="openTarget(getTypeForPocket(pocketData) as string, pocketData.id_request)"
  >
    <span>{{ getDisplayNameForRequestPocket(pocketData) }}</span>
    <span>{{ getEmployeeName(pocketData?.id_employee_staff) }}</span>
  </div>
  <div
    v-else
    :class="[baseClass, borderClass]"
    @click="openTarget(getTypeForPocket(pocketData) as string, pocketData.id_cart)"
  >
    <span>{{ pocketData.name_cart_item_display }}</span>
    <div class="flex gap-8">
      <span>× {{ formatDecimalNumber(pocketData?.quantity) }}</span>
      <span>{{ getEmployeeName(pocketData?.id_employee_sales) }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.border {
  &-service {
    border-left: 3px solid $blush;
    border-bottom: 1px solid $grey-300;
  }
  &-prescription {
    border-left: 3px solid $sky-blue;
    border-bottom: 1px solid $grey-300;
  }
  &-inject {
    border-left: 3px solid $c-purple;
    border-bottom: 1px solid $grey-300;
  }
  &-other {
    border-left: 3px solid $grey-500;
    border-bottom: 1px solid $grey-300;
  }
}
.pocket-base-class {
  padding: 2px 8px;
}
</style>
