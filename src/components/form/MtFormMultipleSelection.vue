<script setup lang="ts">
import { withDefaults, computed, ref, defineAsyncComponent, onUnmounted, watch } from 'vue'
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'

const QuickIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/QuickIllnessHistoryModal.vue')
)

const props = withDefaults(
  defineProps<{
    options: Array<any>
    modelValue: string | boolean | Array<any> | Object | number | null
    readonly?: boolean
    borderless?: boolean
    outlined?: boolean
    bgColor?: string
    label?: string
    placeholder?: string
    lazyRules?: boolean
    rules?: Array<Function>
    disable?: boolean
    color?: string
    labelColor?: string
    autogrow?: boolean
    isKatakana?: boolean
    required?: boolean
    optionLabel?: string | Function
    optionValue?: string
    storeLabel?: boolean
    showQuickIllnessHistory?: boolean
    requestDetailPage?: any
    popupContentStyle?: string
  }>(),
  {
    options: [],
    readonly: false,
    borderless: false,
    outlined: false,
    bgColor: '',
    label: '',
    placeholder: '',
    lazyRules: false,
    rules: [],
    disable: false,
    color: '',
    labelColor: '',
    autogrow: false,
    isKatakana: false,
    optionLabel: 'label',
    required: false,
    storeLabel: false,
    showQuickIllnessHistory: false,
    requestDetailPage: {},
    popupContentStyle: ''
  }
)

const filterValue = ref('')

const filteredOptions = computed(() => {
  if (filterValue.value === '') {
    return props.options
  } else {
    const needle = filterValue.value.toLowerCase()
    return props.options.filter((v) => {
      const labelValue = typeof props.optionLabel === 'function'
        ? props.optionLabel(v)
        : v[props.optionLabel]
      return String(labelValue).toLowerCase().includes(needle)
    })
  }
})

const emit = defineEmits(['update:model-value', 'updatedValue'])

const requiredClass = computed(() => {
  if (props.required) {
    const isValidSelection =
      props.modelValue !== null &&
      props.modelValue !== undefined &&
      props.modelValue !== ''

    return !isValidSelection ? 'bg-accent-050' : ''
  } else {
    return ''
  }
})

const disableClass = computed(() => {
  if (props.disable) {
    return 'disable-class'
  }
  return ''
})

const changeValueData = (value) => {
  emit('update:model-value', value)
  emit('updatedValue', value)
}

const keyDown = (e) => {
  // Implement any keydown logic specific to text input if needed
}

const filterFn = (val: string, update: Function) => {
  filterValue.value = val
  update()
}

const openQuickIllnessHistory = async() => {
  await mtUtils.popup(QuickIllnessHistoryModal, {
    requestDetailPage: props.requestDetailPage,
    fromForm: true,
    create: true
  })
}

event_bus.on('submitQuickIllnessHistory', async (value) => {
 const setValue = props.modelValue && props.modelValue.length > 0 ? 
  [...props.modelValue, Number(value)] : [Number(value)]
  
  changeValueData(setValue)
})

onUnmounted(() => {
  event_bus.off('submitQuickIllnessHistory')
})


</script>

<template>
  <q-select
    :readonly="props.readonly"
    :borderless="props.borderless"
    :outlined="props.outlined"
    :bgColor="props.bgColor"
    :model-value="props.modelValue"
    :label="props.label"
    :placeholder="props.placeholder"
    :lazy-rules="props.lazyRules"
    :rules="props.rules"
    :disable="props.disable"
    :color="props.color"
    :label-color="props.labelColor"
    class="q-pa-none input-multiple-selection"
    :option-label="optionLabel"
    :option-value="storeLabel ? { optionValue, optionLabel } : optionValue"
    :autogrow="props.autogrow"
    :options="filteredOptions"
    :class="[requiredClass, disableClass]"
    :popup-content-style="popupContentStyle"
    v-bind="$attrs"
    v-katakana="props.isKatakana"
    multiple
    emit-value
    map-options
    clearable
    use-chips
    dense
    use-input
    @update:model-value="changeValueData"
    @keydown="keyDown"
    @filter="filterFn"
  >
  <template #append v-if="props.showQuickIllnessHistory">
      <q-btn
        flat
        dense
        round
        size="12px"
        class="title1 bold text-black bg-grey-200 q-mx-xs"
        :class="[{ 'cursor-not-allowed': props.readonly || props.disable }]"
        :style="{ pointerEvents: props.readonly ? 'none' : 'auto' }"
        @click.stop="
          !props.readonly && !props.disable && openQuickIllnessHistory()
        "
      >
      既
      </q-btn>
    </template>
  </q-select>
</template>

<style lang="scss">
.input-multiple-selection .q-chip {
  font-size: 11px !important;
}
.disable-class {
  background: $disablebtnPulldownBackgroundColor;
}
</style>