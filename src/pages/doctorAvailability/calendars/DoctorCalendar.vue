<script lang="ts" setup>
import dayjs from '@/boot/dayjs'
import { QCalendarScheduler, Timestamp } from '@quasar/quasar-ui-qcalendar'
import { computed, ref } from 'vue'
import type { CalendarServiceDetail, EventBusinessCalendarDay } from '@/stores/business-calendar-days'
import { Dictionary, groupBy, keyBy } from 'lodash'
import { Dayjs } from 'dayjs'
import { storeToRefs } from 'pinia'
import useEmployeeStore from '@/stores/employees'
import { OpenDetailModalParam, OpenRequestModalParam } from '@/pages/doctorAvailability/DoctorAvailabilityNew.vue'
import useCustomerStore from '@/stores/customers'
import { EmployeeType } from '@/types/types'
import defaultDoctor from '@/assets/img/employee/default.png'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import { getRgbFromString } from '@/pages/doctorAvailability/calendars/utils'
import { colors, Platform } from 'quasar'
import lighten = colors.lighten
import BadgeComponent from '@/pages/doctorAvailability/calendars/BadgeComponent.vue'
interface ThreeDaysCalendarProps {
  selectedDate: Dayjs
  events: Dictionary<EventBusinessCalendarDay>
  openRequestModal: (data: OpenRequestModalParam) => void
  openDetailModal: (data: OpenDetailModalParam) => void
}

const props = defineProps<ThreeDaysCalendarProps>()

const isOnSmallScreen = window.innerWidth < 1280
const isOnIpad = Platform.is.ipad

const calendar = ref()
const { getCustomerListOptions } = useCustomerStore()
const { getEmployees } = storeToRefs(useEmployeeStore())

const customerListById = computed(() => {
  return keyBy(getCustomerListOptions, 'value')
})

const employees = computed(() => {
  return getEmployees.value.filter((emp) => {
    return emp.flg_calendar
  }).map((emp) => ({
    id: emp.id_employee,
    label: emp.name_display
  }))
})

const getDayName = (timestamp: Timestamp) => {
  return dayjs(timestamp.date).format('dd')
}

const selectedDate = computed(() => {
  return props.selectedDate.format('YYYY-MM-DD')
})

const getEventByDate = (date: string) => {
  return props.events[date] ?? { isClosed: true }
}

const getServiceDetailListByEmployeeId = (employeeId: string | number, date: string) => {
  const serviceDetails = getEventByDate(date).service_detail_list

  const filteredList = serviceDetails?.filter(sd =>  sd.badge)

  const groupedByEmployee = groupBy(filteredList, sd => sd.id_employee_staff || 'unassigned')

  return groupedByEmployee[employeeId]
}

const getServiceDetailEventStyle = (service: CalendarServiceDetail) => {
  const style: Dictionary<any> = {}
  if(service.badge) {
    style['background-color'] = lighten(getRgbFromString(service.badge.color), 85)
  }
  style['align-items'] = 'flex-start'
  return style
}

const getEventText = (service: CalendarServiceDetail) => {
  const time = dayjs(service.datetime_service_start)
  let timeLabel = time.format('H:mm')
  
  if(time.hour() === 0 && time.minute() === 0) {
    timeLabel = '時間未定'
  }
  
  return `
    ${timeLabel} 
    ${customerListById.value[service.id_customer]?.name_family_original} 
    ${service?.name_pet} 
    ${service?.id_cm_animal_name}
    ${service?.item_service_unit_name}
  `
}
const getDoctorProfileImg = (employeeId: string | number): string => {
  const employee:EmployeeType | undefined = getEmployees.value.find((emp: EmployeeType) => emp.id_employee === employeeId)
  return employee?.image_path1 ?? defaultDoctor
}
const openTimeSlotMenu = async (timestamp) => {
  const timeSlots = getEventByDate(timestamp.date).timeSlots
  
  let menuOptions = timeSlots.map((slot, index) => ({
    title: `枠${index + 1}: ${slot.business_start.slice(0, -3)} ~ ${slot.business_end.slice(0, -3)}`,
    name: `slot_${index}`,
    isChanged: false,
    attr: {
      class: null,
      clickable: false 
    }
  }))

  await mtUtils.littlePopup(OptionModal, { 
    options: menuOptions,
    title: '時間枠'  
  })
}
</script>

<template>
  <QCalendarScheduler
    ref="calendar" 
    v-model="selectedDate" 
    v-model:model-resources="employees"
    animated 
    bordered
    locale="ja"
    no-active-date
    :day-min-height="188"
    :max-days="7"
    :cell-width="(isOnSmallScreen || isOnIpad) ? '250px' : ''"
  >
    <template #head-resources="{ scope }">
      <div class="flex column full-width items-center justify-center">
        <div class="q-mt-sm">日付</div>
        <div class="">診療枠</div>
      </div>
    </template>
    <template #head-day="{ scope: { timestamp } }">
      <div class="head-day-column">
        <div class="head-day-header text-center" :class="{ 'is-today': getEventByDate(timestamp.date)?.isToday}">
          <div class="head-day-name" :class="
            { 
              'is-closed': getEventByDate(timestamp.date)?.isClosed,
              'is-saturday': getEventByDate(timestamp.date)?.isSaturday
            }
          ">
          <div class="day-header-row">
            {{ timestamp.day }} ({{ getDayName(timestamp) }})
            <div class="head-day-status" :class="{ 'is-closed': getEventByDate(timestamp.date)?.isClosed }">
              <div class="field-label2" :class="{ 'field-label-today': getEventByDate(timestamp.date)?.isToday }">
                <template v-if="!!getEventByDate(timestamp.date)?.isClosed">
                  休診日
                </template>
                <template v-else>
                  {{ getEventByDate(timestamp.date)?.business_hour_slot[0]?.name_business_hour || '' }}
                </template>
                </div>
              </div>
              <button 
                @click="openTimeSlotMenu(timestamp)"
                class="view-slots-btn"
              >
                <q-icon 
                  name="info"
                  class="info-icon"
                  size="15px"
                />
              </button>
            </div>
          </div>
          <div class="head-day-time-slots">
            <div class="body2 regular" v-for="(timeSlot, index) in getEventByDate(timestamp.date).timeSlots">
              <span class="caption-1">枠{{ index + 1 }}: {{ timeSlot.business_start.slice(0, -3)
                }} ~ {{ timeSlot.business_end.slice(0, -3) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template #resource-label="{ scope: { resource } }">
      <div class="flex bold text-grey-900 body1 text-center full-width row items-center justify-center">
        <q-avatar size="80px" class="q-mt-xs">
          <img
            :src="getDoctorProfileImg(resource.id)"
            style="border: 2px solid white; fill: grey; border-radius: 50%;"
          />
        </q-avatar>
        <div class="q-mt-sm text-wrap">
        {{ resource.label }}
      </div>
      </div>
    </template>
    <template #day="{ scope: { resource, timestamp } }">
      <div class="day-column">
        <div class="day-content">
          <template v-for="(service, index) in getServiceDetailListByEmployeeId(resource.id, timestamp.date)">
            <div
              :style="getServiceDetailEventStyle(service)"
              class="event-block cursor-pointer q-mb-sm"
              @click="openDetailModal({ type: 'service', detailObj: service })"
            >
            <div class="body2 cursor-pointer service" style="display: ruby;">
              <BadgeComponent
                :color="service.badge!.color"
                :label="service.badge!.label"
                text-color="white"
              />
              {{ getEventText(service) }}
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
            @click="openRequestModal({ date: timestamp.date, time: '06:00', id_employee: resource.id, show_time_ui: true })"
          >
            <q-icon size="20px" name="add" />
          </q-btn>
        </div>
      </div>
    </template>
  </QCalendarScheduler>
</template>

<style scoped lang="scss">
.day-content{
  overflow-y: hidden !important; 
  transition: overflow-y 0.3s ease;
}

.day-content:hover {
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #BABABA transparent !important;
}
.head-day-time-slots {
    display: block;
  }
.view-slots-btn {
  display: none;
  background-color: transparent;
  color:  #4a90e2;
  border: none;
}
.head-day-header{
  min-height: 115px;
}
.day-header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  position: relative;
  margin-left: 15px;
}
.q-calendar,
.q-calendar__calendar-container {
  scrollbar-color: #BABABA transparent !important;
  scrollbar-width: 3px !important;
}
.truncated {
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 1;
  width: 100px !important;
  height: 20px;
  word-wrap: break-word;
  white-space: normal !important;
  text-align: left;
}
.head-day {
  &-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  &-header {
    display: flex;
    width: 100%;
    padding: 8px;
    align-items: center;
    justify-content: start;
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
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  &-status {
    font-size: 12px;
    font-weight: 400;
  }
}
.doctorCard {
  border-radius: 4px;
  border: 2px solid #eeeeee;
  img {
    opacity: .5;
    border-radius: 50%;
  }
}
.day {
  &-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  &-header {
    display: flex;
    width: 100%;
    padding: 8px;
    min-height: 50px;
    align-items: center;
    justify-content: start;
    flex-direction: column;
    border-bottom: 1px solid #e0e0e0;
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
    flex-direction: column;
    align-items: center;
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

.field-label-today {
  background-color: $white;
  color: $blue-700;
  font-size: 12px;
  padding: 7px 20px;
  margin: 7px 10px;
  border-radius: 20px;
  display: inline-block;
}


.doctor {
  &-rows {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-self: start;
  }
  
  &-label {
    width: 45px;
  }
  
  &-list {
    flex: 1;
    font-weight: 400;
    margin-top: 8px;
    
    &:not(:last-of-type) {
      border-bottom: 3px solid #e0e0e0;
    }
  }
}
:deep(.q-calendar-month__day--label__wrapper) {
  display: none !important;
}
@media only screen and (max-width: 1200px) {
    .day-header-row {
      font-size: 12px;
    }
    .field-label-today{
      padding: 3px 7px;
    }
    .field-label2{
      padding: 3px 7px;
    }
    .view-slots-btn {
      display: block;
    }
    .head-day-time-slots {
      display: none; 
    }
    .head-day-header{
      min-height: 50px;
    }
    .day-header-row{
      margin-left: 0px;
      font-size: 7px;
    }
}
</style>