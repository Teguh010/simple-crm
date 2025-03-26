<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  label: string
  val?: string | boolean | number
  selected?: string | number | boolean
  disable?: boolean
  class?: string
}>()

const emit = defineEmits(['update:selected', 'check'])

const tabIndex = ref()

function click(event) {
  if (props.disable) {
    //keyDownが発火しないようにする
    event.stopImmediatePropagation()
    return false
  }
  if (props.selected == props.val) {
    emit('update:selected', false)
  } else {
    emit('update:selected', props.val)
  }
}

async function keydown(event) {
  if (event.code == 'Enter') {
    await enter(event)
  } else if (event.code == 'Space') {
    if (props.selected == props.val) {
      emit('update:selected', false)
      emit('check')
    } else {
      emit('update:selected', props.val)
      emit('check')
    }
  }
}

function findClosestParentWithId(element, parentId) {
  if (!document.getElementById(parentId)) {
    return null
  }

  while (element) {
    if (element.id === parentId) {
      return element
    }
    element = element.parentElement
  }
  return null
}

//Enter key押下時
async function enter(event) {
  if (event.target.getAttribute('tabindex')) {
    tabIndex.value = Number(event.target.getAttribute('tabindex'))
    if (tabIndex.value) {
      // check within the current page/model elements, instead of previous loaded elements
      var parentDiv = findClosestParentWithId(event.target, 'parentID')

      if (!parentDiv) {
        parentDiv = document
      }

      let countTraverse = 0
      for (var i = 0; ; i++) {
        ++countTraverse
        ++tabIndex.value
        var nextFoucusTarget = parentDiv.querySelector(
          `[tabindex="${tabIndex.value}"]`
        )
        if (nextFoucusTarget) {
          let isReadonly = nextFoucusTarget.readOnly
          let isDisable = nextFoucusTarget.disabled
          if (
            !isDisable &&
            (!isReadonly ||
              nextFoucusTarget.getAttribute('aria-readonly') == 'false')
          ) {
            nextFoucusTarget.focus()
            break
          }
        }
        if (countTraverse >= 1000) {
          break
        }
      }
    }
  }
  event.preventDefault()
}

function check(value, event) {
  if (event.code == 'Enter') {
    return
  }
  emit('check')
}
</script>

<template>
  <q-radio
    :model-value="props.selected"
    @update:model-value="check"
    :val="props.val"
    :label="props.label"
    :tabindex="tabIndex"
    @keydown="keydown"
    @click="click"
    :disable="props.disable"
    :class="props.class"
  />
</template>

<style scoped></style>
