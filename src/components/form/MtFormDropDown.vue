<script setup lang="ts">
import { reactive, ref , computed} from "vue";

const props = defineProps<{
  label: string;
  options: Array<Object>;
  selected: string;
  tabindex: number;
  readonly: boolean;
  optionValue?: string;
  disable: boolean
  style: string;
}>()

const emit = defineEmits(['update:selected', 'updateModelValue', 'click'])

function updateModelValue(value){
  emit('updateModelValue', value)
}

const modelValue = computed({
  get: () => {
    if(props.options && props.options.length && props.options.length > 0){
      for(var i = 0; i < props.options.length; i++){
        var option = props.options[i]
        if (props.optionValue && option == props.selected) {
          return option;
        } else if(option.value == props.selected){
          return option;
        }
      }
    }
    return null
  },
  set: (val) => {
    emit('update:selected', val)
  },
})

function popupHide(event) {
  var tabIndex = props.tabindex
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

//入力不可もしくは読み取り専用なら灰色にする
function disableColor(){
  if(props.disable || props.readonly){
    return true
  }else{
    return false
  }
}

</script>

<template>
  <q-select
      outlined
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
      :disable="props.disable"
      :readonly="props.readonly"
      :style="props.style"
      :class="{'disable-color': disableColor()}"
  />
</template>

<style scoped lang="scss">

.disable-color {
  background: $disablebtnBackgroundColor;
}

</style>