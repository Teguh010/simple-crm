<script lang="ts" setup>
import { computed, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    options: Array
    optionsDefault: Array
    selecting?: String
    tabindex?: number
    readonly?: Boolean
    style?: Object
    disable?: Boolean
    required?: boolean
    outlined: boolean
    hideIcon?: boolean
    rules?: any
    displayValue: string | number | boolean
    optionLabel: {
      type: String | Function
      default: 'label'
    }
    optionValue: {
      type: String
    }
    storeLabel: {
      type: Boolean
      default: false
    }
    optionSlot: boolean
  }>(),
  {
    outlined: false,
    required: false,
    optionSlot: false
  }
)

const qSelectRef = ref(null)
const emit = defineEmits([
  'update:selecting',
  'update:options',
  'selected',
  'hide',
  'onEnterPress'
])

const optionsDefault = ref(props.optionsDefault)
const options = ref(props.options)

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

function popupHide(event) {
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
  emit('hide', event)
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
</script>

<template>
  <q-select
    ref="qSelectRef"
    v-model="modelValue"
    :class="[{ 'disable-color': disableColor() }, requiredClass]"
    :disable="props.disable ? true : false"
    :display-value="props.displayValue"
    :hide-dropdown-icon="hideIcon"
    :input-style="{ paddingLeft: '6px' }"
    :label="props.label"
    :option-label="props.optionLabel"
    :option-value="
      props.storeLabel ? { optionValue, optionLabel } : props.optionValue
    "
    :options="options"
    :outlined="props.outlined"
    :readonly="props.readonly ? true : false"
    :rules="rules"
    :style="props.style"
    :tabindex="props.tabindex"
    class="clear-icon"
    dense
    emit-value
    fill-input
    hide-bottom-space
    input-debounce="0"
    map-options
    multiple
    use-chips
    use-input
    @input-value="filterorOptions"
    @update:model-value="updateModelValue"
    @keydown.stop="onKeydown"
    @popup-hide="popupHide"
  >
    <template v-if="optionSlot" v-slot:option="scope">
      <slot :scope="scope" name="option"></slot>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<style lang="scss" scoped>
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
