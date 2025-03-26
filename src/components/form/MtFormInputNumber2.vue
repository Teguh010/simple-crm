<script setup lang="ts">
import { ref, watch } from 'vue'
import { numberFormat } from '@/utils/helper'
import { formatNumberWithDecimals } from '@/utils/aahUtils'
import { useNumberFormatter } from '@/utils/composables/useNumberFormatter';

const props = withDefaults(
  defineProps<{
    value: String;
    label: String;
    tabindex?: Number;
    name: String;
    disable: boolean;
    readonly: boolean;
    isInteger: boolean;
    hasMinus: boolean;
    style: String;
    inputClass: string;
    outlined: boolean;
    filled: boolean;
    qClass: string;
    showCopyButton?: boolean; 
    copyButtonLabel?: string;
    disableCopyButton?: boolean;
  }>(),
  {
    showCopyButton: false,
    copyButtonLabel: '釣0',
    disableCopyButton: false,
  }
)

const numberFormatter = useNumberFormatter()

function initOnce(){

  init(props.value)
}

const modelValue = ref('')
function init(val){
  let pattern = /^[-0-9０-９]+(\.[-0-9０-９]+)*$/g
  //初期表示
  if (val != null) {
    // Convert val to a negative number if props.hasMinus is true
    if (props.hasMinus) {
      val = -Math.abs(val); // Ensure val is negative
    }
    let format = numberFormatter.processNumToHalfWidth(val, props.isInteger)
    //テキストボックスの値に小数点を付ける
    if(format?.toString().match(pattern)){
      modelValue.value = addCamma(format)
    } else {
      modelValue.value = ''
    }
  }
}

function findClosestParentWithId(element, parentId) {
  if (!document.getElementById(parentId)) {
    return null;
  }

  while (element) {
    if (element.id === parentId) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

function keydown(event) {
  //tabindexの移動
  if(event.key === 'Enter'){
    if(event.target.getAttribute('tabindex')){
      var tabIndex = Number(event.target.getAttribute('tabindex'))
      if(tabIndex){
        // check within the current page/model elements, instead of previous loaded elements
        var parentDiv = findClosestParentWithId(event.target, 'parentID');

        if (!parentDiv) {
          parentDiv = document
        }

        let countTraverse = 0
        for(var i = 0;; i++){
          ++countTraverse
          ++tabIndex
          var nextFoucusTarget = parentDiv.querySelector(`[tabindex="${tabIndex}"]`)
          if(nextFoucusTarget){
            let isReadonly = nextFoucusTarget.readOnly
            let isDisable = nextFoucusTarget.disabled
            if (!isDisable && (!isReadonly || nextFoucusTarget.getAttribute('aria-readonly') == 'false')) {
              nextFoucusTarget.focus();
              break;
            }
          }
          if(countTraverse >= 1000) {
            break
          }
        }
      }
    }
    event.preventDefault();
  }
}

const emit = defineEmits(['update:value', 'update', 'focus', 'blur', '_enter', 'copyButtonClick'])

const onCopyButtonClick = () => {
  emit('copyButtonClick')
};

function addCamma(value){
  if(value == null || value.length < 1) return ''
  //カンマを外す
  let noCanmma = isNaN(value) ? value.replace(/,/g, "") : value
  //全角→半角へ変換する
  let half = numberFormatter.convertToHalfWidth(noCanmma)
  if(isNaN(half)) return ''
  //カンマを付ける処理
  let comma = numberFormat(half)
  return comma
}

function update(value){
  let inputValue = isNaN(value) ? value?.replace(/,/g, "") : value
  let formated = numberFormatter.processNumToHalfWidth(inputValue, props.isInteger)
  let emitVal = Math.floor(formated)
  emit("update", emitVal)
}

function eventEnter() {
  emit('_enter', modelValue.value)
}
const NsFormInputNumber = ref(null)
function blur(){
  if(NsFormInputNumber.value == null || NsFormInputNumber.value.modelValue == null) return

  //親へ渡す値をフォーマット
  let inputValue = NsFormInputNumber.value?.modelValue
  let noCanmma = isNaN(inputValue) ? inputValue.replace(/,/g, "") : inputValue
  let emitVal = numberFormatter.processNumToHalfWidth(noCanmma, props.isInteger)

  //q-input更新
  init(noCanmma)

  emit('update:value', emitVal)
  emit('blur')
}

function focus(){
  //TODO:このソースが原因で、全角を入力すると入力値*2だけテキストボックスへ反映されてしまう
  // NsFormInputNumber.value?.select()
  if (modelValue.value) {
    modelValue.value = !props.isInteger ? formatNumberWithDecimals(parseFloat(`${modelValue.value}`.split(',').join(''))) : parseInt(`${modelValue.value}`.split(',').join(''))
  }
  emit('focus')
}

//入力不可もしくは読み取り専用なら灰色にする
function disableColor(){
  if(props.disable || props.readonly){
    return true
  }else{
    return false
  }
}

//親→q-input更新
watch(() => props.value, (nowValue, oldValue) => {
  init(props.value)
}, { deep: true })

initOnce()

</script>

<template>
   <q-input
    :outlined="props.outlined"
    ref="NsFormInputNumber"
    v-model="modelValue"
    :label="props.label"
    :dense="true"
    :tabindex="props.tabindex"
    :name="props.name"
    :disable="props.disable"
    :readonly="props.readonly"
    :filled="props.filled"
    label-color="primary"
    :style="props.style"
    :input-class="props.inputClass"
    @keyup="keydown"
    @update:model-value="update"
    @keydown.enter="eventEnter"
    @focus="focus"
    @blur="blur"
    :class="qClass"
  >
    <template #append v-if="props.showCopyButton">
    <q-btn
        flat
        dense
        round
        size="12px"
        class="title1 bold text-black bg-grey-200 q-mx-xs"
        :class="[{ 'cursor-not-allowed': props.readonly || props.disable }]"
        :style="{ pointerEvents: props.readonly ? 'none' : 'auto' }"
        @click.stop="
          !props.readonly && !props.disable && onCopyButtonClick()
        "
      >
         {{ props.copyButtonLabel }}
      </q-btn>
    </template>
  </q-input>
</template>

<style scoped lang="scss">

.disable-color {
  background: $disablebtnBackgroundColor;
}

.q-number-height-lg {
  :deep(.q-field__control) {
    height: 55px !important;
  }
}

.size-large :deep(.q-field__control) {
  height: 40px; /* Sets the minimum height */
}
.size-extra-large :deep(.q-field__control) {
  height: 60px; /* Sets the minimum height */
}

.right-text {
  :deep(.q-field__native) {
    text-align: right !important;
  }
}
</style>
