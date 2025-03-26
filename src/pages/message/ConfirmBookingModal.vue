<script setup lang="ts">

import MtModalHeader from '@/components/MtModalHeader.vue'
import aahValidations from '@/utils/aahValidations'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { computed, onMounted, ref } from 'vue'
import { timeHourMinute } from '@/utils/enum'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import { getDateTimeNow } from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import useCustomerStore from '@/stores/customers'
import useThreadCustomer from '@/stores/message-customer'
import { storeToRefs } from 'pinia'
import { MessageThreadType, MessageType } from '@/types/types'

dayjs.extend(isSameOrAfter)

interface ConfirmBookingModalProps {
  memoGoal: string
  typeThread: string
  threadData: MessageThreadType
  messageData: MessageType
  messageDataSend: MessageType
  bookingStatus: number
  assignAttributesOnClick: (arg: any) => {}
  scrollToBottom: () => {}
}

interface ConfirmBookingModalEmits {
  (e: 'close'): void
}

interface EditableField {
  [key: string]: string[]
}

interface MemoGoalField {
  key: string
  value: string | null
  editable: boolean
}

interface ThreadDataPayload extends MessageThreadType {
  send_line: boolean
  booking_confirmed: string
}

const emits = defineEmits<ConfirmBookingModalEmits>()
const props = defineProps<ConfirmBookingModalProps>()

const customerStore = useCustomerStore()
const customerThreadStore = useThreadCustomer()
const { getMessages } = storeToRefs(customerThreadStore)

const confirmBookingData = ref({
  date: '',
  time: '',
})

const editableField: EditableField = {
  ['50']: [
    'ペットのお名前',
    'お薬の内容',
    '処方日数',
    'お受け取り方法',
    'お支払い方法',
    '連絡用の電話番号',
  ],
  ['60']: [
    'チェックイン',
    'チェックアウト',
    'ペットのお名前',
    '予防ワクチン接種',
    'ノミダニ予防',
    'お預かり中のご要望',
    'その他詳細'
  ],
  ['70']: [
    'ペットのお名前',
    '予防ワクチン接種',
    'ノミダニ予防',
    '美容コース',
    'その他ご要望',
    '詳細'
  ],
  ['90']: [
    '相談方法',
    'ペットのお名前',
    '詳細',
    'お支払い方法'
  ]
}

const closeModal = () => {
  emits('close')
}

const today = dayjs()

const memoGoalFields = ref<MemoGoalField[]>([])

const confirmedBookingDatetime = computed(() => {
  return `${confirmBookingData.value.date} ${confirmBookingData.value.time}`
})

const dateOptions = (date: Date) => {
  return dayjs(date).isSameOrAfter(today)
}

const htmlStringPurify = (val: string): MemoGoalField[] => {
  let currentKey = ''
  return val.split('\n').reduce((acc, line) => {
    const memoGoalField: MemoGoalField = { key: '', value: null, editable: true }

    if (line.startsWith('###')) {
      currentKey = line.slice(3).trim()
      memoGoalField.key = currentKey
    } else if (line.startsWith('##')) {
      currentKey = line.slice(2).trim()
      memoGoalField.key = currentKey
    } else if (currentKey) {
      memoGoalField.key = currentKey
      memoGoalField.value = line.includes('undefined') ? '--' : line.trim()
    }

    if (memoGoalField.key && memoGoalField.value) {
      if(memoGoalField.key === 'チェックイン') {
        memoGoalField.editable = false
      }
      acc.push(memoGoalField)
    }

    return acc
  }, [] as MemoGoalField[])
}
const decompileMemoGoal = () => {
  memoGoalFields.value = htmlStringPurify(props.memoGoal).filter((memoGoalField) =>
    editableField[props.typeThread].includes(memoGoalField.key)
  )
}

const compileMemoGoal = () => {
  return memoGoalFields.value.reduce((acc, memoGoalField) => {
    let value = memoGoalField.value
    if(memoGoalField.key === 'チェックイン') {
      value = confirmedBookingDatetime.value
    }
    return acc + `###${memoGoalField.key}\n ${value}\n`
  }, '')
}

const submit = async () => {
  if(!confirmBookingData.value.date || !confirmBookingData.value.time) {
    return console.log('not valid')
  }
  const employeeId = JSON.parse(localStorage?.getItem('id_employee')).toString()

  const threadDataPayload = {...props.threadData } as ThreadDataPayload
  threadDataPayload.send_line = false
  const customer = customerStore.getAllCustomers.find(customer => customer.code_customer === parseInt(threadDataPayload.code_customer))
  let lineConfirmation: any
  if (customer?.line_user_id) {
    lineConfirmation = await mtUtils.confirm('このオーナー様はLINEの登録があります。LINEプッシュ通知を送信しますか?', '', 'LINEで通知する', 'LINEで通知しない') as string
    threadDataPayload.send_line = lineConfirmation === 'send'
    
    if(lineConfirmation === false) {
      return
    }
  }

  if (threadDataPayload) {
    threadDataPayload.memo_goal = compileMemoGoal()
    threadDataPayload.booking_confirmed = dayjs(confirmedBookingDatetime.value).format('YYYY-MM-DD HH:mm:ss')
    threadDataPayload.flg_goal_achieved = true
    threadDataPayload.id_employee_achieved =
      threadDataPayload?.type_thread === 90 ? null : employeeId
    threadDataPayload.type_booking_status = props.bookingStatus
    if (threadDataPayload?.type_thread === 90) {
      threadDataPayload.flg_closed = true
      threadDataPayload.datetime_closed = getDateTimeNow()
    }
    await customerThreadStore.updateThreadMessages(
      threadDataPayload?.id_message_thread,
      threadDataPayload
    )
    await customerThreadStore.submitMessages(
      props.messageData,
      threadDataPayload?.id_message_thread
    )
    getMessages.value.push(props.messageDataSend)
    props.assignAttributesOnClick(props.messageDataSend)
    props.scrollToBottom()
  }
  emits('close')
  await mtUtils.autoCloseAlert(aahMessages.success)
}

onMounted(() => {
  decompileMemoGoal()
  const bookingDate = dayjs(props.threadData?.booking?.datetime_booking_confirmed ?? props.threadData?.booking?.datetime_booking1)
  confirmBookingData.value.date = bookingDate.format('YYYY/MM/DD')
  confirmBookingData.value.time = bookingDate.format('HH:mm')
})

</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        予約確定
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content">
      <div class="flex row justify-center items-center full-height">
        <div class="column justify-center text-center q-col-gutter-y-sm" style="width: 370px">
          <div class="col-12">
            <MtFormInputDate
              v-model:date="confirmBookingData.date"
              type="date"
              label="確定予約日"
              :options="dateOptions"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-12">
            <MtFormPullDown
              type="selection"
              v-model:selected="confirmBookingData.time"
              :options="timeHourMinute"
              label="確定予約時間"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <template
            v-for="field in memoGoalFields"
            :key="`header-${field.key}`"
          >
            <div class="col-12">
              <h4>{{ field.key }}</h4>
              <MtInputForm
                type="text"
                :readonly="field.key === 'チェックイン'"
                :model-value="field.key === 'チェックイン' ? confirmedBookingDatetime : field.value"
                @update:model-value="field.value = $event"
              />
            </div>
          </template>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          キャンセル
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          tabindex="4"
          class="q-ml-md"
          @click="submit"
        >
          予約確定
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style scoped lang="scss">

</style>