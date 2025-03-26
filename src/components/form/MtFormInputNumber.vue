<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { numberFormat } from '@/utils/helper'

let isFocus = false
let isBlur = true
let isCompositionStart = false

//漢字→ひらがな自動入力機能
const inputValue = ref('')
//inputValue.value = props.value

const numberModeArray = [
  'decimalCurrency',
  'negCurrency',
  'currency',
  'percent',
  'dosage'
]

var obj = {}
async function initKana() {
  var src = null
  while (true) {
    var tagList = document.getElementsByName(props.useKana)
    if (tagList && tagList.length && tagList.length > 0) {
      src = tagList[0]
      break
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 1)
    })
  }
  var flgHiragana = true
  //formに入力された値が無い場合、ふりがなにnullを入れる
  obj.check = function (e) {
    if (!src.value) {
      inputValue.value = null
    }
  }
  //漢字の入力が開始した時の処理
  obj.compositionstart = function (e) {
    obj.h = []
  }
  //新しい文字が入力されたとき
  obj.compositionupdate = function (e) {
    obj.h.push(e.data)
  }
  //全角入力が終了するとき
  obj.compositionend = function (e) {
    var r = e.data
    //入力がアルファベットか数字の場合
    if (r.match(/[^　 \u30A1-\u30F6A-Za-z0-9\-Ａ-Ｚａ-ｚ０-９－ー]/gu)) {
      //入力が0文字以上の場合
      if (obj.h.length > 0) {
        //入力された文字数の数だけループ
        for (var i = 0; i < obj.h.length; i++) {
          var v = obj.h[obj.h.length - i - 1]
          if (v && v.length > 0) {
            //配列の最後から２番目の要素がnの場合
            if (v.slice(-1) == 'ｎ') {
              v = v.slice(0, -1) + 'ん'
            }
            //ひらがな or カタカナだった場合
            if (!v.match(/[^\u3041-\u3096\u30A1-\u30F6ー]/gu)) {
              //if(!v.match(/[^　 \u30A1-\u30F6ー]/ug))
              if (!flgHiragana) {
                var s = ''
                for (var j = 0; j < v.length; j++) {
                  //vの文字コードを取得
                  var c = v.charCodeAt(j)
                  if (0x3041 <= c && c <= 0x3096) {
                    //コードから文字列を作成
                    s += String.fromCharCode(c + 0x60)
                  } else {
                    //j文字目の文字を取得
                    s += v.charAt(j)
                  }
                }
                v = s
              }
              inputValue.value = props.value + v
              break
            }
          }
        }
      }
    } else {
      inputValue.value = props.value + r
    }
  }
  src.addEventListener('input', obj.check, false)
  src.addEventListener('compositionstart', obj.compositionstart, false)
  src.addEventListener('compositionupdate', obj.compositionupdate, false)
  src.addEventListener('compositionend', obj.compositionend, false)
}

const props = withDefaults(
  defineProps<{
    value?: string | number
    label?: string
    tabindex?: number
    name?: string
    useKana?: string
    type?: string
    disable?: boolean
    autogrow?: boolean
    readonly?: boolean
    filled?: boolean
    placeholder?: string
    style?: Object
    dense?: boolean
    mode?: string
    rows?: any
    outlined?: boolean
    numberRange?: Array
    decimalSize?: number,
    class: string
  }>(),
  {
    value: '',
    label: '',
    tabindex: 0,
    name: '',
    useKana: '',
    placeholder: '',
    type: '',
    disable: false,
    autogrow: false,
    readonly: false,
    filled: false,
    style: { resize: 'none' },
    dense: true,
    mode: '',
    rows: '5',
    outlined: false,
    numberRange: [],
    decimalSize: 3,
    class: ''
  }
)

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

function keydown(event) {
  // Prevent next field move on ENTER for the specific.
  if (isCompositionStart) {
    return false
  }

  if (event.key === 'Enter') {
    if (event.target.getAttribute('tabindex')) {
      var tabIndex = Number(event.target.getAttribute('tabindex'))
      if (tabIndex) {
        // check within the current page/model elements, instead of previous loaded elements
        var parentDiv = findClosestParentWithId(event.target, 'parentID')

        if (!parentDiv) {
          parentDiv = document
        }

        let countTraverse = 0
        for (var i = 0; ; i++) {
          ++countTraverse
          ++tabIndex
          var nextFoucusTarget = parentDiv.querySelector(
            `[tabindex="${tabIndex}"]`
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
    event.preventDefault() // Prevented other actions
  }
}

//全角数字 or 半角数字で１文字以上 と　全角数字 or　半角数字 or . が0文字以上
let pattern = /^[-0-9０-９]+(\.[-0-9０-９]+)*$/g
const decimalDefaultNum = 2

function toHalf(value) {
  let numStr = ''
  if (value.length && value.length > 0) {
    //文字列の場合
    for (var i = 0; i < value.length; i++) {
      let target = value.charAt(i)
      //全角を半角に変える
      switch (target) {
        case '0':
        case '０':
          numStr += '0'
          break
        case '1':
        case '１':
          numStr += '1'
          break
        case '2':
        case '２':
          numStr += '2'
          break
        case '3':
        case '３':
          numStr += '3'
          break
        case '4':
        case '４':
          numStr += '4'
          break
        case '5':
        case '５':
          numStr += '5'
          break
        case '6':
        case '６':
          numStr += '6'
          break
        case '7':
        case '７':
          numStr += '7'
          break
        case '8':
        case '８':
          numStr += '8'
          break
        case '9':
        case '９':
          numStr += '9'
          break
        case '.':
        case '．':
          numStr += '.'
          break
        case '。':
          numStr += '.'
          break
        case '-':
        case 'ー':
          numStr += '-'
          break
        case '―':
          numStr += '-'
          break
        case '−':
          numStr += '-'
          break
        case '－':
          numStr += '-'
          break
        case '/':
          numStr += '/'
          break
        default:
      }
    }

    let float = numStr
    // check if mode is includes in the numberModeArray
    if (numberModeArray.includes(props.mode)) {
      //数字型へキャスト
      float = Number.parseFloat(numStr)
      //小数第２位表示
    }

    return float
  } else {
    //数字の場合
    return value
  }
}
function convertFractionToDecimal(fraction) {
  if (fraction.includes('/')) {
    const [numerator, denominator] = fraction.split('/').map(Number)
    if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
      return numerator / denominator
    }
  }
  return fraction // Return the original value if not a fraction
}
function isNumber(
  evt: any,
  charCode: number,
  exception: any = [43, 45],
  ignoreCharCodes = []
) {
  if (
    (charCode > 31 &&
      (charCode < 48 || charCode > 57) &&
      !ignoreCharCodes.includes(charCode)) ||
    exception.includes(charCode)
  ) {
    evt.preventDefault()
    return false
  } else {
    return true
  }
}
function isNegativeNumber(evt: any, charCode: number, exception: any = [43]) {
  if (
    charCode > 31 &&
    (charCode < 48 || charCode > 57) && // Non-numeric characters
    charCode !== 45 // Exclude the minus sign ("-") from the check
  ) {
    evt.preventDefault()
    return false
  }

  if (
    inputValue.value &&
    inputValue.value.toString().includes('-') &&
    charCode === 45
  ) {
    evt.preventDefault()
    return false
  }
  return true
}

function isPhoneNumber(evt: any, charCode: number) {
  if (!isNumber(evt, charCode, [], [45])) {
    return false
  }

  if (charCode === 45) {
    if (!inputValue.value) {
      evt.preventDefault()
    }
    return true
  }

  if (inputValue) {
    let pureDigitsLength = (inputValue.value + evt.key).replace(/-/g, '').length
    if (pureDigitsLength > 11) {
      evt.preventDefault()
    }
  }
  return true
}

function isDecimalRange(evt: any, charCode: number) {
  if (!isNumber(evt, charCode)) {
    return false
  }

  if (inputValue.value) {
    let temp = inputValue.value + evt.key
    if (
      parseFloat(temp) > 100 ||
      (props.numberRange &&
        props.numberRange?.length > 0 &&
        (temp < props.numberRange[0] || temp > props.numberRange[1]))
    ) {
      evt.preventDefault()
    }
    if (`${temp}`.split('.').at(1)?.length > 2) {
      evt.preventDefault()
    }
  }
  return true
}

function modeFunction(evt: any) {
  evt = evt ? evt : window.event
  var charCode = evt.which ?? evt.keyCode
  switch (props.mode) {
    case 'phone':
      isPhoneNumber(evt, charCode)
      break
    case 'percent':
      isDecimalRange(evt, charCode)
      break
    case 'currency':
      isNumber(evt, charCode)
      break
    case 'negCurrency':
      isNegativeNumber(evt, charCode)
  }
}

function percentSet(val: any) {
  if (!val) {
    emit('update:value', null)
    return
  }

  val = toHalf(val)

  inputValue.value = val
  emit('update:value', Number(parseFloat(val)))
}

function currencyGet(mode: any) {
  if ((!inputValue.value && inputValue.value != 0) || inputValue.value === '') {
    return null
  }

  if (inputValue.value === 0) {
    return props.mode == 'decimalCurrency' ? '0.00' : '0'
  }

  if (inputValue.value.toString().includes('.')) {
    let [beforeDecimalPoint, afterDecimalPoint] = inputValue.value
      .toString()
      .split('.')
    beforeDecimalPoint = numberFormat(beforeDecimalPoint).trim()
    if (afterDecimalPoint.length >= 2) {
      afterDecimalPoint = afterDecimalPoint.substring(0, 2)
    }
    // TODO this if statement will be deleted once FE is finalized. Its only for testing.
    if (beforeDecimalPoint === 0) {
      return `${beforeDecimalPoint}.${afterDecimalPoint}`
    }

    return `${beforeDecimalPoint}${
      props.mode == 'decimalCurrency' ? `.${afterDecimalPoint}` : ''
    }`
  }

  if (isFocus) {
    return `${inputValue.value}${props.mode == 'decimalCurrency' ? '.00' : ''}`
  }

  if (isBlur) {
    return `${numberFormat(inputValue.value)}${
      props.mode == 'decimalCurrency' ? '.00' : ''
    }`
  }
}
function dosageGet(mode: any) {
  if ((!inputValue.value && inputValue.value != 0) || inputValue.value === '') {
    return null
  }
  if (inputValue.value === 0) {
    return 0
  }
  inputValue.value = inputValue.value.toString()

  if (inputValue.value.toString().includes('.')) {
    let [beforeDecimalPoint, afterDecimalPoint] = inputValue.value
      .toString()
      .split('.')
    beforeDecimalPoint = numberFormat(beforeDecimalPoint).trim()
    if (afterDecimalPoint.length >= 3) {
      afterDecimalPoint = afterDecimalPoint.substring(0, props.decimalSize + 1)
    }
    if (Number(afterDecimalPoint)) {
      return `${beforeDecimalPoint}.${afterDecimalPoint}`
    }
    if (afterDecimalPoint.includes(',') && Number(afterDecimalPoint.replace(',', ''))) {
      return `${beforeDecimalPoint}.${afterDecimalPoint.replace(',', '')}`
    }
      
    
    return `${beforeDecimalPoint}`
  }

  if (isFocus) {
    return `${inputValue.value}`
  }

  if (isBlur) {
    return `${inputValue.value}`
  }
}

function currencySet(val: any) {
  if (val.endsWith('.') || val.endsWith('/')) {
    return
  }

  val = convertFractionToDecimal(val)

  val = `${toHalf(val)}`

  let removedFormatting: any
  let nextInputVal: any

  if (val.includes('.')) {
    let [beforeDecimal, afterDecimal] = val.split('.')
    beforeDecimal = parseInt(beforeDecimal.split(',').join(''))
    nextInputVal = numberFormat(beforeDecimal).trim()
    removedFormatting = Number(parseFloat(`${beforeDecimal}.${afterDecimal}`))
    nextInputVal = `${nextInputVal}.${afterDecimal}`
  } else {
    removedFormatting =
      props.mode == 'decimalCurrency'
        ? parseFloat(val.split(',').join(''))
        : parseInt(val.split(',').join(''))
    nextInputVal = numberFormat(removedFormatting).trim()
  }

  if (isNaN(removedFormatting)) {
    inputValue.value = null
    emit('update:value', null)
    return
  }

  inputValue.value = nextInputVal
  emit('update:value', removedFormatting)
}

function injectSet(val: any) {
  if (val.endsWith('.') || val.endsWith('/')) {
    return
  }

  val = convertFractionToDecimal(val)

  val = `${toHalf(val)}`

  let removedFormatting: any
  let nextInputVal: any


  inputValue.value = val

  emit('update:value', val)
  return
  if (val.includes('.')) {
    let [beforeDecimal, afterDecimal] = val.split('.')
    beforeDecimal = parseInt(beforeDecimal.split(',').join(''))
    nextInputVal = numberFormat(beforeDecimal).trim()
    removedFormatting = Number(parseFloat(`${beforeDecimal}.${afterDecimal}`))
    nextInputVal = `${nextInputVal}.${afterDecimal}`
  } else {
    removedFormatting =
      props.mode == 'decimalCurrency'
        ? parseFloat(val.split(',').join(''))
        : parseInt(val.split(',').join(''))
    nextInputVal = numberFormat(removedFormatting).trim()
  }

  if (isNaN(removedFormatting)) {
    inputValue.value = null
    emit('update:value', null)
    return
  }

  inputValue.value = nextInputVal
  emit('update:value', removedFormatting)
}

function percentGet() {
  if (!inputValue.value) {
    return
  }

  if (
    inputValue.value.toString().includes('.') &&
    inputValue.value.toString().split('.')[1].length > 2
  ) {
    return parseFloat(inputValue.value).toFixed(0)
  }

  return inputValue.value
}

function phoneGet() {
  return inputValue.value
}

function phoneSet(value: any) {
  value = `${toHalf(value)}`
  inputValue.value = value
  emit('update:value', value)
}

function numberGet() {
  if (!inputValue.value) {
    return
  }
  
  return parseInt(inputValue.value)
}

function numberSet(value: any) {
  if (isNaN(inputValue.value)) {
    inputValue.value = null
    emit('update:value', null)
    return
  } 

  inputValue.value = parseInt(value)
  emit('update:value', value)
}
const getStyle = computed(() => {
  if (props.mode == 'phone')
    return {
      ...props.style,
      paddingLeft: '6px',
      'font-size': '20px',
      'letter-spacing': '7px'
    }
  else return { ...props.style, paddingLeft: '6px' }
})

function get() {
  switch (props.mode) {
    case 'currency':
      return currencyGet(props.mode)
    case 'decimalCurrency':
      return currencyGet(props.mode)
    case 'dosage':
      return dosageGet(props.mode)
    case 'percent':
      return percentGet(props.mode)
    case 'negCurrency':
      return currencyGet(props.mode)
    case 'phone':
      return phoneGet(props.mode)
    case 'number':
      return numberGet(props.mode)
    default:
      return inputValue.value
  }
}

function set(val: any) {
  switch (props.mode) {
    case 'percent':
      percentSet(val)
      break
    case 'currency':
      currencySet(val)
      break
    case 'dosage':
      currencySet(val)
      break
    case 'inject':
      injectSet(val)
      break
    case 'negCurrency':
      currencySet(val)
      break
    case 'decimalCurrency':
      currencySet(val)
      break
    case 'phone':
      phoneSet(val)
      break
    case 'number':
      numberSet(val)
      break
    default:
      emit('update:value', val)
  }
}

onMounted(() => {
  inputValue.value = props.value
})

const emit = defineEmits(['update:value', 'blur'])
const modelValue = computed({
  get,
  set
})

if (props.useKana) {
  initKana()
}

function blur(evt) {
  if (handleBeforeInput && handleBeforeInputData?.value && handleBeforeInputData.value?.length && handleBeforeInput?.value?.length > 1) {
    const newInput = toHalf(handleBeforeInputData?.value)
    inputValue.value = newInput
    emit('update:value', newInput)
  }

  emit('blur', evt)
  isFocus = false
  isBlur = true
  if (numberModeArray.includes(props.mode) && inputValue.value) {
    inputValue.value = `${numberFormat(inputValue.value)}${
      props.mode == 'decimalCurrency' ? '.00' : ''
    }`
  }
}

function focus() {
  isFocus = true
  isBlur = false
  if (numberModeArray.includes(props.mode) && inputValue.value) {
    // inputValue.value = props.mode == 'decimalCurrency' ? parseFloat(`${inputValue.value}`.split(',').join('')) : parseInt(`${inputValue.value}`.split(',').join(''))
    if (props.mode == 'percent') {
      inputValue.value = parseFloat(
        `${inputValue.value}`.split(',').join('')
      ).toFixed(0)
    } else {
      inputValue.value = parseFloat(`${inputValue.value}`.split(',').join(''))
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

//keydownイベント以外でテキストボックスの値に変更が生じたとき(クリアなど)
watch(
  () => props.value,
  (nowValue, oldValue) => {
    inputValue.value = nowValue
  }
)

const handleBeforeInputData = ref('')
function handleBeforeInput(event) {
  handleBeforeInputData.value = JSON.parse(JSON.stringify(event.data))
  if (event.inputType === 'insertCompositionText') {
    // Start of composition
    isCompositionStart = true
  } else if (event.inputType === 'insertLineBreak') {
    // End of composition
    isCompositionStart = false
  }
}
</script>

<template>
  <div v-if="props.type == 'textarea'">
    <q-input
      :outlined="props.outlined"
      v-model="modelValue"
      :label="props.label"
      :dense="props.dense"
      :placeholder="props.placeholder"
      :tabindex="tabindex"
      :name="props.name"
      :type="props.type"
      :disable="props.disable"
      label-color="primary"
      :input-style="props.style"
      :autogrow="props.autogrow"
      :readonly="props.readonly"
      :filled="props.filled"
      :rows="props.rows"
      @blur="blur"
      :class="[ props.class , { 'disable-color': disableColor() }]"
    />
  </div>
  <div v-else>
    <q-input
      @beforeinput="handleBeforeInput"
      :outlined="props.outlined"
      v-model="modelValue"
      :label="props.label"
      :placeholder="props.placeholder"
      :dense="props.dense"
      @keyup="keydown"
      :tabindex="tabindex"
      :name="props.name"
      :type="props.type"
      :disable="props.disable"
      label-color="primary"
      :input-style="getStyle"
      :autogrow="props.autogrow"
      :readonly="props.readonly"
      :filled="props.filled"
      @keypress="modeFunction"
      @blur="blur"
      @focus="focus"
      :class="[ props.class , { 'disable-color': disableColor() }]"
    >
      <template v-for="(_, name) in $slots" v-slot:[name]="data">
        <slot :name="name" :v-bind="data"></slot>
      </template>
    </q-input>
  </div>
</template>

<style scoped lang="scss">
.disable-color {
  background: $disablebtnBackgroundColor;
}

.right-text {
  :deep(.q-field__native) {
    text-align: right !important;
  }
}


.text-center {
  :deep(.q-field__native) {
    text-align: center !important;
  }
}

</style>

