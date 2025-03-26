<script setup lang="ts">
import { defineComponent } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    checked?: boolean
    disable?: boolean
    tabindex?: number
    color?: string
    class?: string
    size?: string
    clickWhenDisabled?: boolean
    keepColor?: boolean
  }>(),
  {
    label: '',
    checked: false,
    disable: false,
    tabindex: 0,
    color: 'primary',
    class: '',
    size: '28px',
    clickWhenDisabled: false,
    keepColor: false
  }
)

const emit = defineEmits(['update:checked', 'click'])

async function keydown(event) {
  if (event.code == 'Enter') {
    await enter(event)
  } else if (event.code == 'Space') {
    if (props.checked) {
      emit('update:checked', false)
    } else {
      emit('update:checked', true)
    }
  }
}

function click(event) {
  if (props.disable) {
    if (props.clickWhenDisabled) {
      emit('click')
    }
    //keyDownが発火しないようにする
    event.stopImmediatePropagation()
    return false
  }
  if (props.checked) {
    emit('update:checked', false)
    emit('click', event, false)
  } else {
    emit('update:checked', true)
    emit('click', event, true)
  }
}

//Enter key押下時
async function enter(event) {
  if (props.disable) {
    //clickが発火しないようにする
    event.stopImmediatePropagation()
    return false
  }

  if (event.target.getAttribute('tabindex')) {
    var tabIndex = Number(event.target.getAttribute('tabindex'))
    if (tabIndex) {
      for (var i = 0; i < 100; i++) {
        ++tabIndex
        var nextFoucusTarget = document.querySelector(
          `[tabindex="${tabIndex}"]`
        )
        if (nextFoucusTarget) {
          nextFoucusTarget.focus()
          break
        }
      }
    }
  }
  event.preventDefault()
}
</script>
<template>
  <q-checkbox
    :size="size"
    :model-value="props.checked"
    :class="props.class"
    @click="click"
    :label="props.label"
    :disable="props.disable"
    @keydown="keydown"
    :tabindex="tabindex"
    :color="props.color"
    :keep-color="props.keepColor"
  />
</template>

<style scoped lang="scss">
.disabled[aria-checked='false'] {
  :deep(.q-checkbox__bg) {
    background: $disablebtnBackgroundColor;
  }
}
</style>
