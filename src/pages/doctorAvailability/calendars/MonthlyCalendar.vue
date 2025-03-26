<script lang="ts" setup>
import dayjs from '@/boot/dayjs'
import { QCalendarMonth, Timestamp } from '@quasar/quasar-ui-qcalendar'
import { computed, ref } from 'vue'
import type { EventBusinessCalendarDay } from '@/stores/business-calendar-days'
import { Dictionary, find, groupBy, map } from 'lodash'
import { Dayjs } from 'dayjs'
import {
  OpenDetailModalParam,
  OpenRequestModalParam
} from '@/pages/doctorAvailability/DoctorAvailabilityNew.vue'
import useCommonStore from '@/stores/common'
import { storeToRefs } from 'pinia'

interface MonthlyCalendarProps {
  selectedMonth: Dayjs
  events: Dictionary<EventBusinessCalendarDay>
  openRequestModal: (data: OpenRequestModalParam) => void
  openDetailModal: (data: OpenDetailModalParam) => void
  openInThreeDays: (date: string) => void
}

const props = defineProps<MonthlyCalendarProps>()

const isOnSmallScreen = window.innerWidth < 1280

const commonStore = useCommonStore()
const { getCommonTypeServiceOptionList } = storeToRefs(commonStore)

const calendar = ref()
const getDayName = (timestamp: Timestamp) => {
  return dayjs(timestamp.date).format('dd')
}

const selectedDate = computed(() => {
  return props.selectedMonth.format('YYYY-MM-DD')
})

const getEventByDate = (date: string) => {
  return props.events[date] ?? { isClosed: true }
}

const getEventDetailsByDate = (date: string) => {
  const event = getEventByDate(date)
  if (event.isClosed) {
    return []
  }
  const serviceDetails =
    event.service_detail_list
      ?.filter((sd) => sd.badge || sd.type_service)
      .map((sd) => ({
        ...sd,
        type_service: `${sd.type_service || sd.badge?.type}`
      })) ?? []

  const prescriptionDetails =
    event.prescription_list.map((inject) => ({
      ...inject,
      type_service: ''
    })) ?? []

  const injectDetails =
    event.inject_list
      ?.filter((inject) => inject.badge)
      .map((inject) => ({
        ...inject,
        type_service: `${inject.badge?.type}`
      })) ?? []

  const clinicPlanDetails = event.clinic_plan_list.map((clinicPlan) => ({
    ...clinicPlan,
    type_service: `院`
  }))

  const allEvents = [
    ...serviceDetails,
    ...prescriptionDetails,
    ...injectDetails,
    ...clinicPlanDetails
  ]

  const eventDetail = groupBy(allEvents, 'type_service')

  return map(eventDetail, (details, type_service) => {
    const matchingCommon = find(getCommonTypeServiceOptionList.value, {
      code_func1: `${type_service}`
    })

    return {
      color: matchingCommon?.text1 || '',
      label: matchingCommon?.label || (type_service ?? ''),
      eventDetails: details
    }
  })
  // .filter(detail => detail.color || detail.label)
}
</script>

<template>
  <QCalendarMonth
    ref="calendar"
    v-model="selectedDate"
    animated
    bordered
    locale="ja"
    :day-min-height="188"
    cell-width="50px"
    no-active-date
  >
    <template #day="{ scope: { timestamp } }">
      <div class="day-column">
        <div
          class="day-header text-center"
          :class="{ 'is-today': getEventByDate(timestamp.date)?.isToday }"
        >
          <div
            class="day-name"
            :class="{
              'is-closed': getEventByDate(timestamp.date)?.isClosed,
              'is-saturday': getEventByDate(timestamp.date)?.isSaturday
            }"
          >
            {{ timestamp.day }} ({{ getDayName(timestamp) }})
            <div
              class="day-status"
              :class="{ 'is-closed': getEventByDate(timestamp.date)?.isClosed }"
            >
              <template v-if="!!getEventByDate(timestamp.date)?.isClosed">
                休診日
              </template>
              <template v-else>
                {{
                  getEventByDate(timestamp.date)?.business_hour_slot[0]
                    ?.name_business_hour || ''
                }}
              </template>
            </div>
          </div>
          <div class="day-time-slots">
            <div
              class="body2 regular"
              v-for="(timeSlot, index) in getEventByDate(timestamp.date)
                .timeSlots"
            >
              <span class="caption-1"
                >枠{{ index + 1 }}: {{ timeSlot.business_start.slice(0, -3) }} ~
                {{ timeSlot.business_end.slice(0, -3) }}</span
              >
            </div>
          </div>
        </div>
        <div class="day-content">
          <template
            v-for="(eventDetail, index) in getEventDetailsByDate(
              timestamp.date
            )"
          >
            <div class="flex items-center justify-between q-mb-xs" @click="openInThreeDays(timestamp.date)">
              <q-badge
                :color="eventDetail.color"
                :label="eventDetail.label"
                text-color="white"
                rounded
                class="custom-badge"
              />
              <div class="text-grey-800 body1 q-ml-sm">
                {{ eventDetail.eventDetails?.length }} 件
              </div>
            </div>
          </template>
        </div>
        <div class="day-footer">
          <q-btn
            padding="5px"
            unelevated
            color="grey-300"
            text-color="grey-700"
            class="full-width"
            @click="openRequestModal({ date: timestamp.date, time: '06:00' })"
          >
            <q-icon size="20px" name="add" />
          </q-btn>
        </div>
      </div>
    </template>
  </QCalendarMonth>
</template>

<style scoped lang="scss">
.day {
  &-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &-header {
    display: flex;
    border-bottom: 3px solid #e0e0e0;
    width: 100%;
    padding: 8px;
    min-height: 100px;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  &-content {
    max-height: 188px;
    min-height: 188px;
    overflow-y: auto;
    flex-shrink: 0;
    width: 100%;
    padding: 8px;
  }

  &-footer {
    width: 100%;
    padding: 8px;
  }

  &-name {
    font-size: 16px;
    font-weight: 700;
    display: flex;
    flex-direction: row;
    align-items: end;
    gap: 4px;
  }

  &-status {
    font-size: 12px;
    font-weight: 400;
  }
}

.is-closed {
  color: var(--q-negative);
}

.is-saturday {
  color: $blue;
}

.is-today {
  color: $white !important;
  background-color: $blue-700;
  font-size: 12px;
}

:deep(.q-calendar-month__day--label__wrapper) {
  display: none !important;
}
</style>
