<script setup lang="ts">
import { withDefaults, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string | boolean | Array<any> | Object | number
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
    iconPrepend?: string
    iconAppend?: string
    required?: boolean
  }>(),
  {
    readonly: false,
    borderless: false,
    outlined: false,
    bgColor: '',
    label: '',
    placeholder: '',
    lazyRules: false,
    rules: [],
    disable: false,
    color: 'blue',
    labelColor: '',
    autogrow: false,
    isKatakana: false,
    iconPrepend: null,
    iconAppend: null,
    required: false
  }
)

const emit = defineEmits(['update:model-value', 'updatedValue', 'onEnterPress'])

const requiredClass = computed(() => (props.required ? 'bg-accent-050' : ''))

const changeValueData = (value) => {
  emit('update:model-value', value)
  emit('updatedValue', value)
}
const onEnterPress = () => {
  emit('onEnterPress')
}

const keyDown = (e) => {
  // Implement any keydown logic specific to text input if needed
}
</script>

<template>
  <q-input
    :readonly="props.readonly"
    :borderless="props.borderless"
    :outlined="props.outlined"
    :bgColor="props.bgColor"
    dense
    :model-value="props.modelValue"
    :label="props.label"
    @update:model-value="changeValueData"
    :placeholder="props.placeholder"
    :lazy-rules="props.lazyRules"
    :rules="props.rules"
    :disable="props.disable"
    :color="props.color"
    :label-color="props.labelColor"
    class="q-pa-none"
    @keyup.enter="onEnterPress"
    @keydown="keyDown"
    v-bind="$attrs"
    :autogrow="props.autogrow"
    v-katakana="props.isKatakana"
    :class="[requiredClass]"
  >
    <template v-if="props.iconPrepend" v-slot:prepend>
      <q-icon size="18px" :name="props.iconPrepend" />
    </template>
    <template v-if="props.iconAppend" v-slot:append>
      <q-icon size="18px" :name="props.iconAppend" />
    </template>
    <template v-slot:append>
      <slot name="append" />
    </template>
  </q-input>
</template>
