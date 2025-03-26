<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: Number,
  precision: {
    type: Number,
    default: null // Optional precision
  },
  label: { type: String, default: '' },
  placeholder: String,
  rules: Array,
  readonly: {
    type: Boolean,
    default: false
  },
  outlined: {
    type: Boolean,
    default: false
  },
  bgColor: {
    type: String,
    default: ''
  },
  disable: Boolean,
  pattern: {
    type: String,
    default: null
  },
  color: {
    type: String,
    default: 'blue'
  },
  labelColor: {
    type: String,
    default: ''
  },
  classStyle: {
    type: String,
    default: ''
  },
  autogrow: {
    type: Boolean,
    default: false
  },
  lazyRules: {
    type: Boolean,
    default: null
  },
  appendIcon: String,
  tabindex: Number
})

const emit = defineEmits(['update:modelValue'])

const computedStep = computed(() =>
  props.precision !== null ? '0.' + '1'.padEnd(props.precision, '0') : 'any'
)

// Format for display only, not affecting the model value
// Formatted value for display
const displayedValue = computed({
  get: () => {
    if (props.modelValue == null) return ''
    let value = props.modelValue.toString()
    if (props.precision !== null) {
      // Format with specified precision
      const [integer, decimal] = value.split('.')
      value = parseFloat(value).toFixed(
        decimal && !decimal.startsWith('00') ? props.precision : 0
      )
    }
    // Remove trailing zeros if no specific precision
    return props.precision == null ? parseFloat(value).toString() : value
  },
  set: (newValue) => {
    const numericValue = parseFloat(newValue)
    if (!isNaN(numericValue)) {
      // Emit the raw numeric value to the model
      emit('update:modelValue', numericValue)
    }
  }
})

// Handler for input changes
const changeValueData = (newValue) => {
  if (newValue === '') {
    // Handle empty input
    emit('update:modelValue', null) // or emit('update:modelValue', 0); depending on the requirements
  } else {
    // Parse the input value to a number
    const numericValue = parseFloat(newValue)
    if (!isNaN(numericValue)) {
      emit('update:modelValue', numericValue)
    }
  }
}

/**
 * Fucntion it should achieve:
 * ----------------------------
 * You have an input field for decimal numbers.
 * The displayed value in the input field should be formatted based on certain rules:
 * 1. If no precision is specified (precision prop is null), the number should display without unnecessary trailing zeros.
 * For example, 40.4000 should display as 40.4, and 40.0000 as 40.
 * 2. If precision is specified, the number should display rounded to that precision.
 * For example, with precision = 2, 40.3789 should display as 40.38.
 * 3. Regardless of the display formatting, the model value (modelValue prop) should always contain the full original value with all its decimal points.
 * This value is to be emitted back to the parent component, preserving all the inputted decimal numbers.
 * NOTE:
 * ------
 * Precision and round off is not working currently. It only does truncate the additional trailing zeros.
 * Model value and displayed value are same.
 */
</script>

<template>
  <q-input
    :readonly="readonly"
    type="number"
    :step="computedStep"
    :outlined="outlined"
    :bgColor="bgColor"
    dense
    :model-value="displayedValue"
    :label="label"
    @update:model-value="changeValueData"
    :placeholder="placeholder"
    :lazy-rules="lazyRules"
    :rules="rules"
    :disable="props.disable ? true : false"
    :pattern="pattern"
    :color="color"
    :label-color="labelColor"
    class="q-pa-none"
    :class="[classStyle]"
    v-bind="$attrs"
    :autogrow="autogrow"
    :tabindex="props.tabindex"
  >
    <template v-slot:append v-if="appendIcon">
      <div class="column items-end justify-end q-py-xs full-height">
        <q-icon :name="appendIcon" size="10px"></q-icon>
      </div>
    </template>
  </q-input>
</template>

<style lang="scss" scoped>
:deep(.q-icon) {
  &.material-icons {
    display: block;
  }
}
</style>
