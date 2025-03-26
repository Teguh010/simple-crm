<script setup lang="ts">
import { defineComponent } from 'vue'

const props = withDefaults(defineProps<{
  label: string;
  checked?: Array<boolean | string | number>;
  disable?: Boolean;
  val?: string | number;
  tabindex?:Number;
  color: string;
  class: string;
  size: string;
  items: Array<Object>
}>(),{
  label: '',
  checked: [],
  disable: false,
  tabindex: 0,
  color: 'primary',
  class: '',
  size : '28px'
})

const emit = defineEmits(['update:checked', 'click'])


async function keydown(event) {
  if(event.code == 'Enter'){
    await enter(event)
  } else if(event.code == 'Space'){
    changeValueData(props.checked)
  }
}
function changeValueData(value) {
  if(props.disable){
    return false
  }
  emit('update:checked', value)
  emit('click', value)
}

//Enter keyæŠ¼ä¸‹æ™‚
async function enter(event) {
  if(props.disable){
    //clickãŒç™ºç«ã—ãªã„ã‚ˆã†ã«ã™ã‚‹
    event.stopImmediatePropagation();
    return false
  }

  if(event.target.getAttribute('tabindex')){
    var tabIndex = Number(event.target.getAttribute('tabindex'))
    if(tabIndex){
      for(var i = 0; i < 100; i++){
        ++tabIndex
        var nextFoucusTarget = document.querySelector(`[tabindex="${tabIndex}"]`)
        if(nextFoucusTarget){
          nextFoucusTarget.focus();
          break;
        }
      }
    }
  }
  event.preventDefault();
}
</script>
<template>
  <q-checkbox
    :size="props.size"
    :class="[item?.class,props.class]"
    v-for="(item, key) in props.items"
    :key="key"
    :model-value="props.checked"
    @update:model-value="changeValueData"
    :val="item.value"
    :label="item.label"
    :disable="props.disable"
    :color="props.color"
    :tabindex="props.tabindex"
    @keydown="keydown"
  />
</template>

<style scoped lang="scss">
.disabled[aria-checked="false"] {
  :deep(.q-checkbox__bg){
    background: $disablebtnBackgroundColor;
  }
}
</style>