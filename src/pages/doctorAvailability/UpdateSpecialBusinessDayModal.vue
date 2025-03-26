<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import { storeToRefs } from 'pinia'
import { timeHourMinute, typeBusinessDay } from '@/utils/enum'

const emits = defineEmits(['close'])

const props = defineProps({ data: Object })
const businessHourSlot = useBusinessHourSlot()
const { getAllBusinessHourSlots } = storeToRefs(businessHourSlot)
const slotTime = ref(null)
const requestForm = reactive({
  datetime_business_day: null,
  id_business_hour_slot: '',
  type_business_day: '',
  memo_business_day: '',
  name_business_hour: '',
  time_business_start1: '',
  time_business_end1: '',
  time_checkin_start1: '',
  time_checkin_end1: '',
  time_ticket_issue_start1: '',
  time_ticket_issue_end1: '',
  ticket_limit_upper1: '',
  time_business_start2: '',
  time_business_end2: '',
  time_checkin_start2: '',
  time_checkin_end2: '',
  time_ticket_issue_start2: '',
  time_ticket_issue_end2: '',
  ticket_limit_upper2: '',
  time_business_start3: '',
  time_business_end3: '',
  time_checkin_start3: '',
  time_checkin_end3: '',
  time_ticket_issue_start3: '',
  time_ticket_issue_end3: '',
  ticket_limit_upper3: ''
})

const closeModal = () => {
  emits('close')
}

const submit = async () => {}
function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      requestForm[key] = data[key]
    }
  }
}
onMounted(() => {
  if (props.data) {
    assignPageData(props.data)
  }
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        診療スケジュール : {{ props.data.memo ? '特別診療日' : '通常診療日' }}
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-3">
          <MtFormInputDate
            v-model:date="requestForm.datetime_business_day"
            type="date"
            label="対象日 *"
            required
            :rules="[aahValidations.validationRequired]"
            readonly
            :disable="true"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            type="selection"
            class="q-mr-sm bg-grey-200"
            label="診療時間枠 *"
            v-model:selected="requestForm.id_business_hour_slot"
            :options="getAllBusinessHourSlots"
            required
            :rules="[aahValidations.validationRequired]"
            :disable="true"
            readonly
          />
        </div>
        {{ requestForm.datetime_business_day }}
      </div>
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="requestForm.memo_business_day"
            label="スケジュールメモ（オーナー表示）"
            autogrow
          />
        </div>
      </div>
      <div class="bg-grey-200 q-pa-sm">
        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              type="selection"
              class="q-mr-sm selection-field"
              label="診療日区分 *"
              v-model:selected="requestForm.type_business_day"
              :options="typeBusinessDay"
              readonly
              :disable="true"
            />
          </div>
          <div class="col-6">
            <MtInputForm
              type="text"
              v-model="requestForm.name_business_hour"
              label="時間枠表示名 *"
              readonly
              :disable="true"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mt-md text-grey-900 caption1 bold">
          <div class="col-3">時間枠 1</div>
        </div>
        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              label="診療開始時刻 *"
              v-model:selected="requestForm.time_business_start1"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <span class="q-mx-sm">~</span>
          <div class="col-3">
            <MtFormPullDown
              label="診療終了時刻 *"
              v-model:selected="requestForm.time_business_end1"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              label="受付開始時刻 *"
              v-model:selected="requestForm.time_checkin_start1"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <span class="q-mx-sm">~</span>
          <div class="col-3">
            <MtFormPullDown
              label="受付終了時刻 *"
              v-model:selected="requestForm.time_checkin_end1"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              label="整理券発行開始時刻 *"
              v-model:selected="requestForm.time_ticket_issue_start1"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <span class="q-mx-sm">~</span>
          <div class="col-3">
            <MtFormPullDown
              label="整理券発行終了時刻 *"
              v-model:selected="requestForm.time_ticket_issue_end1"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <div class="col-3">
            <MtInputForm
              type="text"
              v-model="requestForm.ticket_limit_upper1"
              label="整理券発行上限枚数"
              readonly
              :disable="true"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm q-mt-md text-grey-900 caption2 bold">
          <div class="col-3">時間枠 2</div>
        </div>
        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              label="診療開始時刻 *"
              v-model:selected="requestForm.time_business_start2"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <span class="q-mx-sm">~</span>
          <div class="col-3">
            <MtFormPullDown
              label="診療終了時刻 *"
              v-model:selected="requestForm.time_business_end2"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              label="受付開始時刻 *"
              v-model:selected="requestForm.time_checkin_start2"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <span class="q-mx-sm">~</span>
          <div class="col-3">
            <MtFormPullDown
              label="受付終了時刻 *"
              v-model:selected="requestForm.time_checkin_end2"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
        </div>
        <div class="row q-col-gutter-sm items-center q-mt-sm">
          <div class="col-3">
            <MtFormPullDown
              label="整理券発行開始時刻 *"
              v-model:selected="requestForm.time_ticket_issue_start2"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <span class="q-mx-sm">~</span>
          <div class="col-3">
            <MtFormPullDown
              label="整理券発行終了時刻 *"
              v-model:selected="requestForm.time_ticket_issue_end2"
              :options="timeHourMinute"
              readonly
              :disable="true"
            />
          </div>
          <div class="col-3">
            <MtInputForm
              type="text"
              v-model="requestForm.ticket_limit_upper2"
              label="整理券発行上限枚数"
              readonly
              :disable="true"
            />
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>リクエスト作成</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
