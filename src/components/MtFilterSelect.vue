<script lang="ts" setup>
import { QSelect, ValidationRule } from 'quasar'
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    options: Array
    optionsDefault: Array
    selecting?: string | number | object
    tabindex?: number | string
    readonly?: boolean
    style?: Object
    disable?: boolean
    required?: boolean
    outlined?: boolean
    hideIcon?: boolean
    rules?: ValidationRule[]
    displayValue?: string | number
    optionLabel?: string | Function
    optionValue?: string
    storeLabel?: boolean
    optionSlot?: boolean
    customOption?: boolean
    hideClearIcon: boolean,
    clearableReadonly?: boolean
  }>(),
  {
    outlined: false,
    required: false,
    optionSlot: false,
    storeLabel: false,
    customOption: false,
    hideClearIcon: false,
    clearableReadonly: false
  }
)

const qSelectRef = ref(null)
const emit = defineEmits([
  'update:selecting',
  'update:options',
  'selected',
  'hide',
  'onEnterPress',
  'onClearReadonly',
  'onSearchInput',
  'clear'
])

const optionsDefault = ref(props.optionsDefault)
const options = ref(props.options)
const regex = /(?=.*\d)(?=.*-)/

// Expose the focus method
defineExpose({
  focus() {
    qSelectRef.value?.focus()
  }
})

function filterorOptions(val: any) {
  //入力値が無かった時、選択肢を初期化
  if (val == '' || val == null) {
    options.value.length = 0
    //初期化
    optionsDefault.value.forEach((option: any) => {
      options.value.push(option)
    })
    emit('update:selecting', '')
    return emit('update:options', options.value)
  }
  let inputValue = `${val}`.toLowerCase()
  //入力されたときに選択肢を入れ替え
  emit(
    'update:options',
    optionsDefault.value.filter(
      (option) => option?.label?.toLowerCase()?.indexOf(inputValue) > -1
    )
  )
}

const modelValue = computed({
  get: () => {
    return props.selecting
  },
  set: (val) => {
    emit('update:selecting', val)
  }
})

const clear = () => {
  emit('clear')
}

function popupHide() {
  var tabIndex = props.tabindex
  if (tabIndex) {
    for (var i = 0; i < 100; i++) {
      ++tabIndex
      var nextFoucusTarget = document.querySelector(`[tabindex="${tabIndex}"]`)
      if (nextFoucusTarget) {
        nextFoucusTarget.focus()
        break
      }
    }
  }
  emit('hide')
}

function updateModelValue(value) {
  emit('selected', value)
}

//入力不可もしくは読み取り専用なら灰色にする
function disableColor() {
  if (props.disable || props.readonly) {
    return true
  } else {
    return false
  }
}

// Computed property for Required conditional class
const requiredClass = computed(() => {
  if (props.required) {
    // When the selection is required, check if a valid selection is made
    // Assuming that an invalid or empty selection is represented by null, undefined, or an empty string
    const isValidSelection =
      modelValue.value !== null &&
      modelValue.value !== undefined &&
      modelValue.value !== ''

    // If the selection is not valid, apply 'bg-accent-050' class
    return !isValidSelection ? 'bg-accent-050' : ''
  } else {
    // If not required, don't apply the class
    return ''
  }
})

watch(
  () => props.options,
  (nowValue, oldValue) => {
    options.value = props.options
  }
)
const onKeydown = (event) => {
  if (event.key === 'Enter') {
    event.stopImmediatePropagation()
    emit('onEnterPress')
  }
}

const filterFn = (val: string, update: Function) => {
  emit('onSearchInput', val)
  update(
    () => {
      if (val == '' || val == null) {
        options.value.length = 0
        // 初期化
        optionsDefault.value.forEach((option: any) => {
          options.value.push(option)
        })
        return emit('update:options', options.value)
      }
      // 入力されたときに選択肢を入れ替え
      if (regex.test(val)) {
        const [query] = val.split('-')
        const result = optionsDefault.value.filter(
          (v) => v.label.toLowerCase().indexOf(query) > -1
        )
        return emit('update:options', result)
      }
      const needle = val.toLowerCase()
      options.value = optionsDefault.value.filter(
        (v) => v.label.toLowerCase().indexOf(needle) > -1
      )
      emit(
        'update:options',
        optionsDefault.value.filter(
          (option) => option?.label?.toLowerCase()?.indexOf(needle) > -1
        )
      )
    },
    (ref) => {
      if (val !== '' && ref.options.length > 0 && ref.getOptionIndex() === -1) {
        if (regex.test(val)) {
          const [query] = val.split('-')
          const result = optionsDefault.value.filter(
            (v) => v.label.toLowerCase().indexOf(query) > -1
          )
          const { value } = result[0]
          ref.moveOptionSelection(1, false) // focus the first selectable option and do not update the input-value
          ref.toggleOption(ref.options[ref.optionIndex], true) // toggle the focused option
          ref.hidePopup()
          return emit('update:selecting', value)
        }
      }
    }
  )
}
</script>

<template>
  <q-select
    v-bind="$attrs"
    ref="qSelectRef"
    :outlined="props.outlined"
    v-model="modelValue"
    :label="props.label"
    :rules="rules"
    use-input
    hide-selected
    fill-input
    input-debounce="500"
    :options="options"
    :display-value="props.displayValue"
    :option-label="props.optionLabel"
    :option-value="
      props.storeLabel ? { optionValue, optionLabel } : props.optionValue
    "
    :style="props.style"
    map-options
    emit-value
    :readonly="props.readonly ? true : false"
    :disable="props.disable ? true : false"
    dense
    :tabindex="props.tabindex"
    :class="[{ 'disable-color': disableColor() }, requiredClass]"
    hide-bottom-space
    class="clear-icon"
    :input-style="{ paddingLeft: '6px' }"
    :hide-dropdown-icon="hideIcon"
    @keydown.stop="onKeydown"
    @filter="filterFn"
    @update:model-value="updateModelValue"
    @popup-hide="popupHide"
  >
    <template
      v-if="modelValue !== '' && modelValue !== null && readonly !== true"
      v-slot:append
    >
      <q-icon
        v-if="!props.hideClearIcon"
        name="cancel"
        @click.stop="modelValue = '';updateModelValue('');clear()"
        class="cursor-pointer clear-icon"
        size="18px"
      ></q-icon>
    </template>
    <template v-slot:selected>
      <slot name="selected"></slot>
    </template>
    <template v-slot:option="scope" v-if="optionSlot">
      <slot name="option" :scope="scope"></slot>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
    <template v-slot:option="slotProps" v-if="customOption">
      <slot name="option" :slotProps="slotProps"></slot>
    </template>
    <template v-slot:selectedCustomOption="slotProps" v-if="customOption">
      <slot name="option" :slotProps="slotProps"></slot>
    </template>
    <template #append>
      <q-icon v-if="clearableReadonly && modelValue" class="cursor-pointer" style="opacity: 0.6" name="cancel" size="xs" @click="emit('onClearReadonly')" />
    </template>
    <template v-slot:prepend>
      <slot name="prepend"></slot>
    </template>
  </q-select>
</template>

<style scoped lang="scss">
.disable-color {
  background: $disablebtnPulldownBackgroundColor;
}
.clear-icon {
  color: $grey-400;
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
</style>
