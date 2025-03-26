<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import mtUtils from '@/utils/mtUtils'
import { isExactYYYYMMDD } from '@/utils/aahUtils'

const props = withDefaults(
  defineProps<{
    date?: String
    label?: String
    tabindex?: Number
    outlined?: boolean
    borderless?: boolean
    readonly?: boolean
    disable?: boolean
  }>(),
  {
    date: '',
    label: '',
    tabindex: 0,
    outlined: false,
    borderless: false,
    readonly: false,
    disable: false
  }
)

const emit = defineEmits(['update:date', 'selectDate'])

const qDatePopup = ref(null)
const qTimePopup = ref(null)
const NsFormInputDateTime = ref(null)
//YYYY/MM/DD HH:mm:ss
const pattern1 = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/
//yyyy/mm/dd
const pattern2 = /^\d{4}\/\d{2}\/\d{2} $/
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
let clickCount = 0

function init() {}

const modelValue = computed({
  get: () => {
    return props.date
  },
  set: (val) => {
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

//日付が選択された時
async function selectDate(value, reason, details) {
  if (qDatePopup.value != null) {
    qDatePopup.value.hide()
  }
  emit('selectDate', value, reason, details)
}

function selectTime(value, details) {
  emit('selectDate', value, null, details)
}

function blur(event) {
  let inputVal = event?.srcElement?._value
  if (inputVal) {
    if (pattern1.test(inputVal)) {
      // YYYY/MM/DD HH:mm:ss
      let isExact = isExactYYYYMMDDHHMMSS(inputVal)
      if (!isExact) {
        mtUtils.alert('有効な日付を選択してください。', props.label)
        emit('update:date', null)
      }
    } else {
      // Handle YYYY/MM/DD HH:mm format
      if (/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/.test(inputVal)) {
        // Append :00 for seconds
        inputVal += ":00";
        let isExact = isExactYYYYMMDDHHMMSS(inputVal)
        if (isExact) {
          emit('update:date', inputVal)
          return
        }
      }

      // Handle YYYY/MM/DD
      if (pattern2.test(inputVal)) {
        let isExact = isExactYYYYMMDD(inputVal)
        if (isExact) {
          emit('update:date', inputVal + ' 00:00:00')
          return
        }
      }

      mtUtils.alert('有効な日付を選択してください。', props.label)
      emit('update:date', null)
    }
  }
}


// 日付がカレンダーに存在するかつ、存在する時刻か否かを返す
function isExactYYYYMMDDHHMMSS(yyyymmddhhmmss) {
  let dateParts = yyyymmddhhmmss.split(' ')
  let yyyymmddParts = dateParts[0].split('/')
  let hhmmssParts = dateParts[1].split(':')

  let year = parseInt(yyyymmddParts[0])
  let month = parseInt(yyyymmddParts[1])
  let day = parseInt(yyyymmddParts[2])

  let hours = parseInt(hhmmssParts[0])
  let minutes = parseInt(hhmmssParts[1])
  let seconds = parseInt(hhmmssParts[2])

  //月についてはdateオブジェクトの起算が0から始まるため-1を行う ex 0 → 1月
  let date = new Date(year, month - 1, day)

  let ok = true

  if (
    !(
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  ) {
    //カレンダーに存在しない日付の場合
    ok = false
  }

  if (
    !(
      hours >= 0 &&
      hours <= 23 &&
      minutes >= 0 &&
      minutes <= 59 &&
      seconds >= 0 &&
      seconds <= 59
    )
  ) {
    //存在しない時刻の場合
    ok = false
  }

  if (ok) {
    return true
  } else {
    return false
  }
}

function updateInput(val) {
  emit('update:date', val)
}

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
  init()
})
</script>

<template>
  <q-input
    v-model="modelValue"
    :tabindex="props.tabindex"
    :label="props.label"
    :mask="'####/##/## ##:##'"
    :clearable="true"
    stack-label
    dense
    :outlined="props.outlined"
    :borderless="props.borderless"
    name="qInputDate"
    ref="NsFormInputDateTime"
    :readonly="props.readonly"
    :disable="props.disable"
    :class="{ 'disable-color': disableColor() }"
    @blur="blur"
    @update:model-value="updateInput"
    class="clear-icon"
  >
    <template v-slot:prepend>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
          ref="qDatePopup"
        >
          <q-date
            v-model="modelValue"
            :mask="'YYYY/MM/DD HH:mm'"
            @update:model-value="selectDate"
            :locale="locale"
            :minimal="true"
            :disable="props.readonly"
          >
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
    <template v-slot:append>
      <q-icon name="access_time" class="cursor-pointer">
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
          ref="qTimePopup"
        >
          <q-time
            v-model="modelValue"
            mask="YYYY/MM/DD HH:mm"
            format24h
            @update:model-value="selectTime"
            :with-seconds="false"
          >
          </q-time>
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
</style>
