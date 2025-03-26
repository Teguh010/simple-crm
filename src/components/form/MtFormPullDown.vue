<script setup lang="ts">
import { computed } from 'vue'
import { QSelect } from 'quasar'

const props = withDefaults(
  defineProps<{
    selected?: string | number
    label?: string
    options?: Array<Object>
    tabindex?: number
    readonly?: boolean
    optionValue?: string
    disable?: boolean
    style?: string
    required?: boolean
    clearable?: boolean
    color?: string
    menuSelf?: string
    customOption?: boolean
    customSlot?: boolean
    customSelectSlot?: boolean
    popupContentStyle?: string
    rules?: Array<Object>
  }>(),
  {
    customSlot: false,
    required: false,
    clearable: true,
    color: 'blue',
    popupContentStyle: '',
    menuSelf: '',
    customSelectSlot: false
  }
)
const emit = defineEmits(['update:selected', 'updateModelValue', 'click'])

function updateModelValue(value) {
  emit('updateModelValue', value)
}

const modelValue = computed({
  get: () => {
    if (props.options && props.options.length && props.options.length > 0) {
      for (var i = 0; i < props.options.length; i++) {
        var option = props.options[i]
        if (props.optionValue && option == props.selected) {
          return option
        } else if (option.value == props.selected) {
          return option
        }
      }
    }
    return null
  },
  set: (val) => {
    emit('update:selected', val)
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
</script>

<template>
  <q-select
    v-bind="$attrs"
    v-model="modelValue"
    :options="props.options"
    :label="props.label"
    dense
    emit-value
    map-options
    :tabindex="tabindex"
    @popup-hide="popupHide"
    @update:model-value="updateModelValue"
    @click="emit('click')"
    @clear="props.handleClear"
    :disable="props.disable"
    :readonly="props.readonly"
    :color="props.color"
    :style="props.style"
    :class="[{ 'disable-color': disableColor() }, requiredClass]"
    :required="props.required"
    :clearable="props.clearable"
    :rules="props.rules"
    hide-bottom-space
    class="clear-icon"
    :popup-content-style="popupContentStyle"
    :menu-self="props.menuSelf"
  >
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
    <template v-slot:selected="slotProps" v-if="customSlot">
      <slot name="selected" :slotProps="slotProps"></slot>
    </template>
    <template v-slot:selected-item="scope" v-if="customSelectSlot">
      <slot name="selectedItem" :slotProps="scope"></slot>
    </template>
    <template v-slot:option="slotProps" v-if="customOption">
      <slot name="option" :slotProps="slotProps"></slot>
    </template>
  </q-select>
</template>

<style scoped lang="scss">
.disable-color {
  //background: $disablebtnBackgroundColor;
}
.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
</style>
