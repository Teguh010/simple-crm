<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { date } from 'quasar'
import { getDateByFormat, getDateToday, getDaysInMonth } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import UpdateRequestModal from '@/pages/request/UpdateRequestModal.vue'
import UpdateSpecialBusinessDayModal from './UpdateSpecialBusinessDayModal.vue'
import useActionStore from '@/stores/action'
import useCommonStore from '@/stores/common'
import MtTypeGenre from '@/components/MtTypeGenre.vue'
import { typeWeekday } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import MonthlyCalendar from '@/pages/doctorAvailability/calendars/MonthlyCalendar.vue'

const actionStore = useActionStore()
const commonStore = useCommonStore()
const { getCommonTypeServiceOptionList } = storeToRefs(commonStore)
const props = defineProps({
  selectedMonth: '',
  bookingRequests: Object,
  typeBookingGenre: null,
  isLoading: false
})
const openSpecialBusinessModal = async (_data, date) => {
  if (_data.off_day === false) {
    let data = {
      datetime_business_day: date,
      id_business_hour_slot: _data.bhs.id_business_hour_slot,
      name_business_hour: _data.bhs.name_business_hour,
      type_business_day: _data.bhs.type_business_day,
      time_business_start1: _data.bhs.time_business_start1?.replace(/:00$/, ''),
      time_business_end1: _data.bhs.time_business_end1?.replace(/:00$/, ''),
      time_checkin_start1: _data.bhs.time_checkin_start1?.replace(/:00$/, ''),
      time_checkin_end1: _data.bhs.time_checkin_end1?.replace(/:00$/, ''),
      time_ticket_issue_start1: _data.bhs.time_ticket_issue_start1?.replace(
        /:00$/,
        ''
      ),
      time_ticket_issue_end1: _data.bhs.time_ticket_issue_end1?.replace(
        /:00$/,
        ''
      ),
      ticket_limit_upper1: _data.bhs.ticket_limit_upper1,
      time_business_start2: _data.bhs.time_business_start2?.replace(/:00$/, ''),
      time_business_end2: _data.bhs.time_business_end2?.replace(/:00$/, ''),
      time_checkin_start2: _data.bhs.time_checkin_start2?.replace(/:00$/, ''),
      time_checkin_end2: _data.bhs.time_checkin_end2?.replace(/:00$/, ''),
      time_ticket_issue_start2: _data.bhs.time_ticket_issue_start2?.replace(
        /:00$/,
        ''
      ),
      time_ticket_issue_end2: _data.bhs.time_ticket_issue_end2?.replace(
        /:00$/,
        ''
      ),
      ticket_limit_upper2: _data.bhs.ticket_limit_upper2,
      time_business_start3: _data.bhs.time_business_start3?.replace(/:00$/, ''),
      time_business_end3: _data.bhs.time_business_end3?.replace(/:00$/, ''),
      time_checkin_start3: _data.bhs.time_checkin_start3?.replace(/:00$/, ''),
      time_checkin_end3: _data.bhs.time_checkin_end3?.replace(/:00$/, ''),
      time_ticket_issue_start3: _data.bhs.time_ticket_issue_start3?.replace(
        /:00$/,
        ''
      ),
      time_ticket_issue_end3: _data.bhs.time_ticket_issue_end3?.replace(
        /:00$/,
        ''
      ),
      ticket_limit_upper3: _data.bhs.ticket_limit_upper3,
      memo: _data.memo
    }
    await mtUtils.popup(UpdateSpecialBusinessDayModal, { data })
  }
}
const getJPDay = (day: Number) => {
  if (day < 7) {
    day = day + 1
  } else {
    day = 1 //Sunday
  }
  return typeWeekday.find((v: any) => v.value === day)?.label
}
const buildData = (newDate: string) => {
  let bookingRequest = props.bookingRequests.find(
    (v: any) =>
      getDateByFormat(v.date, 'YYYY-MM-DD') ===
      getDateByFormat(newDate, 'YYYY-MM-DD')
  )
  let serviceDetail = [], prescriptionList = bookingRequest?.prescription_list, clinicPlanList = bookingRequest?.clinic_plan_list
  let injectDetailsList = []
  if (props.typeBookingGenre) {
    serviceDetail = bookingRequest?.service_detail_list.filter(
      (v: any) => v.type_booking_genre === props.typeBookingGenre
    )
  } else {
    serviceDetail = bookingRequest?.service_detail_list
    injectDetailsList = bookingRequest?.inject_list
  }
  if (bookingRequest) {
    let businessHourSlot
    let specialBusinessDay = bookingRequest.flg_special_business_day
    if (specialBusinessDay) {
      if(bookingRequest.special_business_days_data && bookingRequest.special_business_days_data.length > 0) {
        let businessHourSlotId = bookingRequest.special_business_days_data[0]?.id_business_hour_slot
        businessHourSlot = bookingRequest.business_hour_slot.find((v: any) => v.id_business_hour_slot === businessHourSlotId)
      }
    } else {
      businessHourSlot =
        bookingRequest.business_hour_slot.find((v: any) => v.id_business_hour_slot)
    }
    let _return = {
      bhs: businessHourSlot,
      memo: specialBusinessDay ? bookingRequest.special_business_days_data[0]?.memo_business_day : null,
      service_detail_list: serviceDetail,
      prescription_list: prescriptionList,
      clinic_plan_list: clinicPlanList,
      off_day: businessHourSlot.type_business_day != 90 ? false : true,
      specialBusinessDay: specialBusinessDay,
      inject_detail_list: injectDetailsList,
    }
    return _return
  } else {
    return {
      bhs: null,
      memo: null,
      off_day: true,
      service_detail_list: null,
      prescription_list: null,
      inject_detail_list: null,
      clinic_plan_list: 0
    }
  }
}
const prepareDate = (newDate) => {
  let weekday =
    date.getDayOfWeek(newDate) < 7 ? date.getDayOfWeek(newDate) + 1 : 1
  let _data = buildData(newDate)
  return {
    display_date:
      date.formatDate(newDate, 'DD') +
      ' (' +
      getJPDay(date.getDayOfWeek(newDate)) +
      ')',
    date: newDate,
    day: weekday,
    today: getDateToday() == newDate ? true : false,
    _data: _data
  }
}
const headerDates = computed(() => {
  const sdate = new Date(props.selectedMonth + '/01')
  let _data = []
  for (let i = 0; i < getDaysInMonth(sdate); i++) {
    const newDate = date.addToDate(sdate, { day: i })
    _data.push(prepareDate(date.formatDate(newDate, 'YYYY/MM/DD')))
  }
  return _data
})
const openRequestModal = async (_data) => {
  let data = {
    date_request_start: _data.date,
    date_request_goal: _data.date,
    flg_booking: true
  }
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateRequestModal, { data, updatedFlg })
  if (updatedFlg.value) {
    window.open(`/SearchRequestList/${updatedFlg.value}`, '_blank')
    return false
  }
}
const open3daysView = async (date) => {
  actionStore.setAction('updateScheduleView')
  localStorage.setItem('activeScheduleView', '3日間')
  localStorage.setItem('3daySelectedDate', date)
}

function typelySDs(serviceDetailList) {
  const groupedData = {}
  serviceDetailList.forEach((detail) => {
    if (detail && detail.type_service && getServiceDetailAttributes(detail)) {
      const typeService = detail.type_service
      if (!groupedData.hasOwnProperty(typeService)) {
        groupedData[typeService] = {
          color: getServiceDetailAttributes(detail)?.color,
          label: getServiceDetailAttributes(detail)?.label,
          service_details: []
        }
      }
      groupedData[typeService].service_details.push(detail)
    }
  })
  const result = Object.values(groupedData)
  return result
}

function typelyInjs(inject_details_list) {
  const groupedData = {}
  inject_details_list.forEach((detail) => {
    if (detail) {
      const typeInj = "one"
      if (!groupedData.hasOwnProperty(typeInj)) {
        groupedData[typeInj] = {
          color: detail.badge.color,
          label: detail.badge.label,
          inject_details: []
        }
      }
      groupedData[typeInj].inject_details.push(detail)
    }
  })
  const result = Object.values(groupedData)
  return result
}
const getServiceDetailAttributes = (serviceDetail: any) => {
  if(getCommonTypeServiceOptionList.value && getCommonTypeServiceOptionList.value.length > 0) {
    let commonRecord = getCommonTypeServiceOptionList.value.find((v: any) => v.code_func1 == serviceDetail.type_service)
    if(commonRecord) {
      return {
        label: commonRecord.name_common,
        color: commonRecord.text1
      }
    }  
    return null
  }
}
onMounted(() => {})
</script>

<template>
  <div
    class="q-pa-xs mb-5em"
    v-if="!props.isLoading"
  >
    <div class="row month-view">
      <template v-if="headerDates.length > 0 && headerDates[0].day - 2 > 0">
        <div
          class="col-2 q-ba q-pb-xs text-center bg-grey-200 date_block"
          v-for="(noday, n) in headerDates[0].day - 2"
          :key="n"
        >
          <div
            class="column items-center justify-center q-bb q-pt-xs q-pb-xs top-div"
          ></div>
        </div>
      </template>
      <template v-for="(days, i) in headerDates" :key="i">
        <div
          class="col-2 q-ba q-pb-xs text-center date_block text-grey-900"
          v-if="days._data.off_day === false"
        >
          <div
            class="column items-center justify-center cursor-pointer q-bb q-pt-sm q-pb-xs top-div relative-position"
            :class="{ 'today-class': days.today }"
            @click="openSpecialBusinessModal(days._data, days.date)"
          >
            <div
              class="memo bg-F7E3EF absolute-right cursor-pointer"
              v-if="days._data?.memo"
            >
              <q-tooltip anchor="top right" class="bg-F7E3EF" self="center end">
                <div class="column">
                  <div class="body2 bold green">
                    スケジュールメモ（オーナー表示）
                  </div>
                  <div class="body2 text-grey-900">{{ days._data?.memo }}</div>
                </div>
              </q-tooltip>
            </div>
            <div>
              <span
                class="body1 bold q-mr-xs"
                :class="{
                  'text-blue': days.day == 7 && !days.today,
                  'text-darkred': days._data.off_day === true
                }"
              >
               <q-chip v-if="days._data.specialBusinessDay" color="glossy" class="q-mr-sm" label="特別" /> {{ days.display_date }}
              </span>
              <span class="caption2 regular">{{
                days._data?.bhs?.name_business_hour
              }}</span>
            </div>

            <div
              class="body2 regular"
              v-if="days._data?.bhs?.time_business_start1"
            >
              枠1:
              <span class="caption1"
                >{{
                  days._data?.bhs?.time_business_start1?.replace(/:00$/, '')
                }}
                ~
                {{ days._data?.bhs?.time_business_end1?.replace(/:00$/, '') }}
                ({{ days._data?.bhs?.ticket_limit_upper1 }})</span
              >
            </div>
            <div
              class="body2 regular"
              v-if="days._data?.bhs?.time_business_start2"
            >
              枠2:
              <span class="caption1"
                >{{ days._data?.bhs.time_business_start2?.replace(/:00$/, '') }}
                ~
                {{ days._data?.bhs.time_business_end2?.replace(/:00$/, '') }}
                ({{ days._data?.bhs.ticket_limit_upper2 }})</span
              >
            </div>
            <div
              class="body2 regular"
              v-if="days._data?.bhs?.time_business_start3"
            >
              枠3:
              <span class="caption1"
                >{{ days._data?.bhs.time_business_start3?.replace(/:00$/, '') }}
                ~
                {{ days._data?.bhs.time_business_end3?.replace(/:00$/, '') }}
                ({{ days._data?.bhs.ticket_limit_upper3 }})</span
              >
            </div>
          </div>
          <div class="wrapper cursor-pointer" @click="open3daysView(days.date)">
            <div
              class="flex items-enter justify-between q-pt-sm q-px-sm"
              v-if="
                days._data?.service_detail_list.length > 0 ||
                days._data?.prescription_list.length > 0 ||
                days._data?.inject_detail_list.length > 0
              "
            >
              <template
                v-for="(typedSd, t_index) in typelySDs(
                  days._data?.service_detail_list
                )"
                :key="t_index"
              >
                <div
                  class="flex items-center justify-between q-mb-xs"
                  v-if="typedSd.service_details?.length"
                >
                  <q-badge
                    :color="typedSd.color"
                    text-color="white"
                    :label="typedSd.label"
                    rounded
                    class="custom-badge"
                  />
                  <div class="text-grey-800 body1 q-ml-sm">
                    {{ typedSd.service_details?.length }} 件
                  </div>
                </div>
              </template>
              <div
                class="flex items-center justify-between q-mb-xs"
                v-if="days._data?.prescription_list.length > 0"
              >
                <q-badge
                  text-color="white"
                  label="薬"
                  rounded
                  class="custom-badge q-mr-xs prescription-badge"
                />:
                <div class="text-grey-800 body1 q-ml-sm">
                  {{ days._data?.prescription_list?.length }} 件
                </div>
              </div>
              <template
                v-for="(inject, i_index) in typelyInjs(
                  days._data?.inject_detail_list
                )"
                :key="i_index"
              >
                <div
                  class="flex items-center justify-between q-mb-xs"
                  v-if="inject.inject_details?.length"
                >
                  <q-badge
                    :color="inject.color"
                    text-color="white"
                    :label="inject.label"
                    rounded
                    class="custom-badge"
                  />
                  <div class="text-grey-800 body1 q-ml-sm">
                    {{ inject.inject_details?.length }} 件
                  </div>
                </div>
              </template>
            </div>

            <div
              class="flex items-center caption1 justify-between q-pa-xs hidden"
            >
              <div class="bg-accent-200 q-pa-xs">
                <span class="text-negative caption1 bold">[未確定]</span> :
                <span class="body2">5 件</span>
              </div>
              <div class="text-blue text-underline">
                院内予定 : <span class="body2">2 件</span>
              </div>
            </div>
            <div
              class="flex items-center caption1 justify-between q-pa-xs"
              v-if="days._data?.clinic_plan_list.length > 0"
            >
              <div class="text-blue text-underline">
                院内予定 :
                <span class="body2">{{ days._data?.clinic_plan_list.length }} 件</span>
              </div>
            </div>
          </div>
          <div class="q-mt-lg q-pa-xs">
            <q-btn
              padding="5px"
              unelevated
              color="grey-300"
              text-color="grey-700"
              class="full-width"
              @click="openRequestModal(days)"
            >
              <q-icon size="20px" name="add" />
            </q-btn>
          </div>
        </div>
        <div
          class="col-1 q-ba q-pb-xs text-center date_block bg-grey-200 off-day"
          v-else
        >
          <div
            class="column items-center justify-center q-bb q-pt-xs q-pb-xs top-div"
          >
            <div class="text-negative body1 bold">{{ days.display_date }}</div>
            <div class="caption2 regular">休診日</div>
          </div>
          <div class="wrapper cursor-pointer"></div>
          <div class="q-mt-lg q-pa-xs">
            <q-btn
              padding="5px"
              unelevated
              color="grey-300"
              text-color="grey-700"
              class="full-width"
              @click="openRequestModal(days)"
            >
              <q-icon size="20px" name="add" />
            </q-btn>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.month-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  justify-content: flex-start;
  gap: 0 0;
}
.wrapper {
  min-height: 150px;
}
.date_block {
  min-height: 180px;
  width: 1000% !important;
  border-top-width: 2px !important;
  border-left-width: 2px !important;
  border-bottom-width: 2px !important;
  .today-class {
    color: $white;
    background-color: $blue-700;
    font-size: 12px;
  }
}
.off-day {
  border-right-width: 2px !important;
}
.top-div {
  min-height: 90px;
  border-width: 3px;
}
.q-table tbody td:before {
  background: none !important;
}
.memo {
  width: 15px;
  height: 15px;
}
.prescription-badge {
  background-color: $prescriptionBadgeLabel;
}
</style>
