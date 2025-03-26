<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { isExactYYYYMMDD } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'

const props = withDefaults(
  defineProps<{
    date?: String
    label?: String
    tabindex?: Number
    type?: string
    outlined?: boolean
    borderless?: boolean
    readonly?: boolean
    disable?: boolean
    required?: boolean
    chkHoliday?: boolean
    datetime?: boolean
    popupContentStyle?: string
    options?: (date: Date) => boolean
    notOpen?:boolean
    clearable?: boolean
  }>(),
  {
    date: '',
    tabindex: 0,
    type: '',
    outlined: false,
    borderless: false,
    readonly: false,
    disable: false,
    required: false,
    chkHoliday: false,
    datetime: false,
    options: () => true,
    popupContentStyle: '',
    notOpen: true,
    clearable: true,
  }
)

const formatedDate = ref('')
const emit = defineEmits(['update:date', 'selectDate', 'clear'])
const modelValue = computed({
  get: () => {
    formatedDate.value = props.date
    if (props.date && props.date.length && props.date.length > 10) {
      formatedDate.value = props.date.substr(0, 10)
    }
    return formatedDate.value
  },
  set: (val) => {
    if (props.type == 'month') {
      if (val && val.length && val.length >= 10) {
        //2020-11-01
        val = val.substr(0, 7) + '/01'
      }
    }
    if (props.datetime && val) {
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      const dateTimeValue = `${val} ${currentTime}`
      emit('update:date', dateTimeValue)
      return
    }
    emit('update:date', val)
  }
})

function keydown(event) {
  if (event.key === 'Enter') {
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
}
const popup = ref(null)

//日付が選択された時
async function selectDate(value, reason, details) {
  if (popup.value != null) {
    popup.value.hide()
  }
  if (props.datetime && value) {
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
    const dateTimeValue = `${value} ${currentTime}`

    // Emitting the datetime value while keeping the UI same
    emit('selectDate', dateTimeValue, reason, details)
  }
  emit('selectDate', value, reason, details)
}

//yyyy/mm/dd
const pattern = /^\d{4}\/\d{2}\/\d{2}$/

function blur(event) {
  let inputVal = event?.srcElement?._value
  if (inputVal) {
    if (pattern.test(inputVal)) {
      //yyyy/mm/dd

      let isExact = isExactYYYYMMDD(inputVal)
      if (isExact == false) {
        //カレンダーに存在しない日付の場合
        mtUtils.alert('適切な日付を入力してください。', props.label)
        emit('update:date', null)
      }
    } else {
      //yyyy/mm/dd以外

      mtUtils.alert('適切な日付を入力してください。', props.label)
      emit('update:date', null)
    }
  }
}

function updateInput(val) {
  emit('update:date', val)
}

const locale = reactive({
  /* starting with Sunday */
  days: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
  daysShort: ['日', '月', '火', '水', '木', '金', '土'],
  months: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月'
  ],
  monthsShort: [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月'
  ],
  firstDayOfWeek: 0, // 0-6, 0 - Sunday, 1 Monday, ...
  format24h: true,
  pluralDay: 'dias'
})

//入力不可もしくは読み取り専用なら灰色にする
function disableColor() {
  if (props.disable || props.readonly) {
    return true
  } else {
    return false
  }
}

//qInputDateにkeydownイベントを設定
onMounted(() => {
  var qInputDateArray = document.getElementsByName('qInputDate')
  if (qInputDateArray && qInputDateArray.length && qInputDateArray.length > 0) {
    Array.prototype.forEach.call(qInputDateArray, (qInputDate) => {
      qInputDate.addEventListener('keydown', function (event) {
        keydown(event)
      })
    })
  }
})

const defaultYear = computed({
  get: () => {
    if (!modelValue.value) {
      return new Date().getFullYear()
    } else {
      const [year, month, day] = modelValue.value.replace(/-/g, '/').split('/')
      return year
    }
  }
})

const defaultMonth = computed({
  get: () => {
    if (!modelValue.value) {
      return new Date().getMonth() + 1
    } else {
      const [year, month, day] = modelValue.value.replace(/-/g, '/').split('/')
      return month
    }
  }
})

// Computed property for Required conditional class
const requiredClass = computed(() => {
  return props.required && (!modelValue.value || modelValue.value.trim() === '')
    ? 'bg-accent-050'
    : ''
})
</script>

<template>
  <q-input
    v-bind="$attrs"
    v-model="modelValue"
    :tabindex="props.tabindex"
    :label="props.label"
    :clearable="clearable"
    stack-label
    mask="####/##/##"
    dense
    :outlined="props.outlined"
    :borderless="props.borderless"
    name="qInputDate"
    :readonly="props.readonly"
    :disable="props.disable"
    :class="[{ 'disable-color': disableColor() }, requiredClass]"
    @blur="blur"
    @update:model-value="updateInput"
    hide-bottom-space
    class="clear-icon"
    :input-style="{ paddingLeft: '6px' }"
    @clear="emit('clear')"
  >
    <template v-slot:append>
      <q-icon name="event"
       :class="['cursor-pointer', { 'cursor-not-allowed': props.readonly || props.disable }]"
       :style="{ pointerEvents: props.readonly ? 'none' : 'auto' }"
       >
        <q-popup-proxy
          v-if="!props.readonly"
          cover
          transition-show="scale"
          transition-hide="scale"
          ref="popup"
          :style="popupContentStyle"
        >
          <q-date
           v-if="props.notOpen"
            v-model="modelValue"
            @update:model-value="selectDate"
            :locale="locale"
            :minimal="true"
            :disable="props.readonly"
            :options="props.options"
            no-unset
            :default-year-month="`${defaultYear}/${defaultMonth}`"
          >
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<style scoped lang="scss">
.disable-color {
  background: $disablebtnBackgroundColor;
}
.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
.cursor-not-allowed {
  cursor: not-allowed;
  color: $grey-800; 
}
</style>
