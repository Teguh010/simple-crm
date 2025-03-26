<script lang="ts" setup>
import dayjs from '@/boot/dayjs'
import { QCalendarDay, Timestamp } from '@quasar/quasar-ui-qcalendar'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import {
  type CalendarInjectDetail,
  type CalendarPrescriptionDetail,
  type CalendarServiceDetail,
  type EventBusinessCalendarDay,
  type CalendarEventUpdatePayload,
  type CalendarClinicPlanDetail,
  type CalendarBadge,
  useBusinessCalendarDayStore,
} from '@/stores/business-calendar-days'
import { Dictionary, keyBy, orderBy, sortBy } from 'lodash'
import { Dayjs } from 'dayjs'
import {
  CalendarScope,
  OpenDetailModalParam,
  OpenRequestModalParam
} from '@/pages/doctorAvailability/DoctorAvailabilityNew.vue'
import useCustomerStore from '@/stores/customers'
import { CalendarEvent, CalendarEventStyle, CalendarEventTypes, ClinicPlanType } from '@/types/types'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import {
  CONTAINER_PADDING,
  EVENT_GAP,
  getRgbFromString,
  columizeOverlappingEvents,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onIntervalClass,
  onWeekdayClass, enableAllDraggables, removeAllDroppables
} from '@/pages/doctorAvailability/calendars/utils'
import BadgeComponent from '@/pages/doctorAvailability/calendars/BadgeComponent.vue'
import { colors, Platform } from 'quasar'
import Draggable from "vuedraggable"
import lighten = colors.lighten
import mtUtils from '@/utils/mtUtils'
import AllEventsModal from '@/pages/doctorAvailability/AllEventsModal.vue'

interface ThreeDaysCalendarProps {
  selectedDate: Dayjs
  showTopRows: boolean
  events: Dictionary<EventBusinessCalendarDay>
  openRequestModal: (data: OpenRequestModalParam) => void
  openDetailModal: (data: OpenDetailModalParam) => void
  openScheduleModal: (data?: ClinicPlanType) => void
}

const props = defineProps<ThreeDaysCalendarProps>()
const emit = defineEmits(['refetch-data'])

const isOnSmallScreen = window.innerWidth < 1280
const isOnIpad = Platform.is.ipad

const { updateCalendarEventDatetime } = useBusinessCalendarDayStore()
const { getCustomerListOptions } = useCustomerStore()
const calendar = ref()
const getDayName = (timestamp: Timestamp) => {
  return dayjs(timestamp.date).format('dd')
}
const selectedDate = computed(() => {
  return props.selectedDate.format('YYYY-MM-DD')
})
const customerListById = computed(() => {
  return keyBy(getCustomerListOptions, 'value')
})
const getEventByDate = (date: string) => {
  return props.events[date] ?? { isClosed: true }
}

const getServiceDetailList = (list: CalendarServiceDetail[], withTime: boolean) => {
  if(!list) return []
  return list.filter(sd => {
    const isMidnightEvent = dayjs(sd.datetime_service_start).hour() === 0 && dayjs(sd.datetime_service_start).minute() === 0
    if(withTime) {
      return !(dayjs(sd.datetime_service_start).isSame(dayjs(sd.datetime_service_end), 'minute') && isMidnightEvent) && sd.badge
    }
    return (
      dayjs(sd.datetime_service_start).isSame(
        dayjs(sd.datetime_service_end),
        'minute'
      ) &&
      isMidnightEvent &&
      sd.badge
    )
  })
}

const getInjectList = (list: CalendarInjectDetail[], withTime: boolean) => {
  if(!list) return []
  return list.filter(sd => {
    const isMidnightEvent = dayjs(sd.datetime_start).hour() === 0 && dayjs(sd.datetime_start).minute() === 0
    if(withTime) {
      return !(dayjs(sd.datetime_start).isSame(dayjs(sd.datetime_end), 'minute') && isMidnightEvent) && sd.badge
    }
    return (
      dayjs(sd.datetime_start).isSame(dayjs(sd.datetime_end), 'minute') &&
      isMidnightEvent &&
      sd.badge
    )
  })
}

const getPrescriptionList = (list: CalendarPrescriptionDetail[]) => {
  if(!list) return []
  return list.map(item => ({...item, badge: { label: '処方箋', color: 'blue' }})) as CalendarPrescriptionDetail[]
}

const getClinicPlanList = (list: CalendarClinicPlanDetail[], withTime: boolean) => {
  if(!list) return []
  
  return list
    .filter((clinicPlan) => {
      const isMidnightEvent =
        dayjs(clinicPlan.datetime_clinic_plan_start).hour() === 0 &&
        dayjs(clinicPlan.datetime_clinic_plan_start).minute() === 0
      if (withTime) {
        return !(
          dayjs(clinicPlan.datetime_clinic_plan_start).isSame(
            dayjs(clinicPlan.datetime_clinic_plan_end),
            'minute'
          ) && isMidnightEvent
        )
      }
      return (
        dayjs(clinicPlan.datetime_clinic_plan_start).isSame(
          dayjs(clinicPlan.datetime_clinic_plan_end),
          'minute'
        ) && isMidnightEvent
      )
    })
    .map(
      (item) =>
        ({
          ...item,
          badge: {
            label: '院',
            color: '#2d2d2d'
          }
        } as CalendarClinicPlanDetail)
    )
}

const generateStyle = (
  eventDatetimeStart: Dayjs,
  eventDuration: number,
  timeStartPos?: any,
  timeDurationHeight?: any
): Dictionary<any> => {
  const style: Dictionary<any> = {}
  if (timeStartPos && timeDurationHeight) {
    style.top = timeStartPos(eventDatetimeStart.format('HH:mm')) + 'px'
    const calculatedHeight = timeDurationHeight(eventDuration) - EVENT_GAP
    style.height = Math.max(calculatedHeight, 36) + 'px'
  }
  style['align-items'] = 'flex-start'
  return style
}

const getCalendarEventList = (event: EventBusinessCalendarDay, withTime: boolean): CalendarEvent[] => {
  const serviceDetails = getServiceDetailList(event.service_detail_list, withTime)
  const injectDetails = getInjectList(event.inject_list, withTime)
  const prescriptionDetails = getPrescriptionList(event.prescription_list)
  const clinicPlanDetails = getClinicPlanList(event.clinic_plan_list, withTime)

  return [
    ...serviceDetails.map(sd => ({
      id: sd.id_service_detail,
      display_id: sd.number_service_detail,
      data: sd,
      type: CalendarEventTypes.SERVICE,
      start: sd.datetime_service_start,
      end: sd.datetime_service_end,
    })),
    ...injectDetails.map(inject => ({
      id: inject.id_inject,
      data: inject,
      type: CalendarEventTypes.INJECT,
      start: inject.datetime_start,
      end: inject.datetime_end,
    })),
    ...prescriptionDetails.map(prescription => ({
      id: prescription.id_prescription,
      data: prescription,
      type: CalendarEventTypes.PRESCRIPTION,
      start: prescription.date_start,
      end: prescription.date_end,
    })),
    ...clinicPlanDetails.map(clinicPlan => ({
      id: clinicPlan.id_clinic_plan,
      data: clinicPlan,
      type: CalendarEventTypes.CLINIC_PLAN,
      start: clinicPlan.datetime_clinic_plan_start,
      end: clinicPlan.datetime_clinic_plan_end,
    }))
  ]
}

const calendarEventStyles = ref<{ [key: string]: CalendarEventStyle }>({})

const getCalendarEventStyle = (calendarEvent: CalendarEvent, timeStartPos?: any, timeDurationHeight?: any) => {
  let style = {
    ...calendarEventStyles.value[calendarEvent.id],
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  }
  
  if (calendarEvent.data.badge) {
    style['background-color'] = lighten(getRgbFromString(calendarEvent.data.badge.color), 85)
  }
  
  if (timeStartPos || timeDurationHeight) {
    const eventDatetime = dayjs(calendarEvent.start)
    const eventDuration = dayjs(calendarEvent.end).diff(dayjs(calendarEvent.start), 'minute')
    
    style = {
      ...style,
      ...generateStyle(eventDatetime, eventDuration, timeStartPos, timeDurationHeight),
    }
  }
  
  return style
}

const onDrop = async (
  e: DragEvent | TouchEvent,
  type: string,
  scope: CalendarScope
) => {
  e.preventDefault()
  
  if (!e.dataTransfer) return
  
  try {
    const transferData = e.dataTransfer.getData('application/json')
    
    if (!transferData) {
      console.error('No data in transfer')
      return
    }

    const eventData = JSON.parse(transferData)

    const data: CalendarEventUpdatePayload = {
      id_entity: '',
      start_datetime: '',
      end_datetime: '',
      start_date: '',
      end_date: '',
      type: eventData.eventType
    }

    const originalDate = dayjs(eventData.date, 'YYYY/MM/DD HH:mm:ss')
    const targetDate = dayjs(`${scope.timestamp.date} ${scope.timestamp.time}`)
    const event = getEventByDate(originalDate.format('YYYY-MM-DD'))

    const timeDiff = targetDate.diff(originalDate)
    const updateEventTimes = (
      startTime: string,
      endTime: string,
      duration: number
    ) => {
     const newStartTime = dayjs(startTime).add(timeDiff)
      return {
        start: newStartTime.format('YYYY/MM/DD HH:mm:ss'),
        end: type !== 'interval' 
          ? newStartTime.format('YYYY/MM/DD HH:mm:ss')
          : newStartTime.add(duration, 'minute').format('YYYY/MM/DD HH:mm:ss')
      }
    }

    switch (eventData.eventType) {
      case CalendarEventTypes.SERVICE:
        const service = event.service_detail_list.find(
          sd => sd.id_service_detail === eventData.id
        )
        
        if (!service) {
          console.error('Service not found')
          return
        }

        const serviceDuration = dayjs(service.datetime_service_end)
          .diff(service.datetime_service_start, 'minute')
        
        const serviceTime = updateEventTimes(
          service.datetime_service_start,
          service.datetime_service_end,
          serviceDuration
        )

        data.id_entity = service.id_service_detail
        data.start_date = dayjs(serviceTime.start).format('YYYY-MM-DD')
        data.end_date = dayjs(serviceTime.end).format('YYYY-MM-DD')
        data.start_datetime = serviceTime.start
        data.end_datetime = serviceTime.end
        data.type = CalendarEventTypes.SERVICE
        break;
        
      case CalendarEventTypes.INJECT:
        const inject = event.inject_list.find(i => i.id_inject === eventData.id)
        if (!inject) return

        const injectDuration = dayjs(inject.datetime_end)
          .diff(inject.datetime_start, 'minute')
        
        const injectTime = updateEventTimes(
          inject.datetime_start,
          inject.datetime_end,
          injectDuration
        );

        data.id_entity = inject.id_inject_detail
        data.start_date = dayjs(injectTime.start).format('YYYY-MM-DD')
        data.end_date = dayjs(injectTime.end).format('YYYY-MM-DD')
        data.start_datetime = injectTime.start
        data.end_datetime = injectTime.end
        data.type = CalendarEventTypes.INJECT
        break;

      case CalendarEventTypes.CLINIC_PLAN:
        const clinicPlan = event.clinic_plan_list.find(
          i => i.id_clinic_plan === eventData.id
        );
        if (!clinicPlan) return

        const clinicDuration = dayjs(clinicPlan.datetime_clinic_plan_end)
          .diff(clinicPlan.datetime_clinic_plan_start, 'minute')
        
        const clinicTime = updateEventTimes(
          clinicPlan.datetime_clinic_plan_start,
          clinicPlan.datetime_clinic_plan_end,
          clinicDuration
        )

        data.id_entity = clinicPlan.id_clinic_plan
        data.start_datetime = clinicTime.start
        data.end_datetime = clinicTime.end
        data.type = CalendarEventTypes.CLINIC_PLAN
        break

      default:
        return
    }
    
    try {
      await updateCalendarEventDatetime(data)
      
      if (type === 'head-day') {
        delete calendarEventStyles.value[data.id_entity]
        
        calendarEventStyles.value[data.id_entity] = {
          position: 'relative',
          width: '95%',
          left: 'auto',
          margin: '2px 0',
          minHeight: '26px'
        }
      }
      
      emit('refetch-data')
    } catch (updateError) {
      console.error('Update failed:', updateError)
    }

    return false
  } catch (error) {
    console.error('Drop error:', error)
  }
}

const { getEmployees } = storeToRefs(useEmployeeStore())

const employees = computed(() => {
  return getEmployees.value
    .filter((emp) => emp.flg_calendar && !emp.flg_resignation)
    .map((emp) => ({
      ...emp,
      name_display: emp.name_display
    }))
})

const employeesById = computed(() => {
  return keyBy(employees.value, 'id_employee')
})

const calculateCalendarEventWidth = (events: CalendarEvent[], groupIndex: number, numOfGroups: number) => {
  if (events.length === 0) return

  const availableWidth = 95 - (2  * CONTAINER_PADDING / window.innerWidth * 95)
  const eventWidth = availableWidth / numOfGroups

  events.forEach((event, index) => {
    const leftPosition = eventWidth * groupIndex
    
    const eventDuration = dayjs(event.end).diff(dayjs(event.start), 'minute')

    calendarEventStyles.value[event.id] = {
      width: `${eventWidth}%`,
      left: `${leftPosition}%`,
      position: 'absolute',
      zIndex: 1,
      ...(eventDuration <= 5 && {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        height: '36px'
      })
    }
  })
}


const calendarEvents = ref<Dictionary<CalendarEvent[][]>>({})

const is5MinuteEvent = (event: CalendarEvent) => {
  const startTime = new Date(event.start)
  const endTime = new Date(event.end)
  const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
  return durationInMinutes === 5
}

const prepareEvents = () => {
  Object.keys(props.events).forEach(date => {
    const event = props.events[date]
    if (!event) return
    const withTimeEvents = getCalendarEventList(event, true)
    
    const sortedEvents = orderBy(
      withTimeEvents,
      [
        event => event.data.is_multiday && event.data.is_start_of_split ? 0 : 1,
        event => dayjs(event.start, 'YYYY/MM/DD HH:mm:ss').toDate()
      ],
      ['asc', 'asc']
    )

    const groupedEvents = columizeOverlappingEvents(sortedEvents)

    groupedEvents.forEach((calendarEvents, groupIndex, arr) => {
      calculateCalendarEventWidth(calendarEvents, groupIndex, arr.length)
    })
    
    calendarEvents.value[date] = groupedEvents
  })
}

onMounted(() => {
  window.addEventListener('resize', prepareEvents)
})

onUnmounted(() => {
  window.removeEventListener('resize', prepareEvents)
})

watch(() => props.events, () => {
  prepareEvents()
}, {
  immediate: true,
  deep: true
})

const openCreateModalOnInterval = (data: { scope: { timestamp: { date: string; time: string } }, event: PointerEvent}) => {
  props.openRequestModal({
    date: data.scope.timestamp.date,
    time: data.scope.timestamp.time,
    callback: calendar.value.scrollToTime,
    show_time_ui: true
  })
}

// State for dragging events
const isDragging = ref(false)
const draggedEventId = ref<string | null>(null)

const onDragStart = ({ event, item, sameTime, eventType }: { 
  event: DragEvent, 
  item: any, 
  sameTime: boolean, 
  eventType: string 
}) => {
  isDragging.value = true
  draggedEventId.value = item.id_service_detail || item.id_inject || item.id_clinic_plan
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    
    let eventDate
    switch(eventType) {
      case CalendarEventTypes.SERVICE:
        eventDate = sameTime ? item.date_service_start : item.datetime_service_start
        break
      case CalendarEventTypes.INJECT:
        eventDate = sameTime ? item.date_start : item.datetime_start
        break
      case CalendarEventTypes.CLINIC_PLAN:
        eventDate = sameTime ? item.date_clinic_plan_start : item.datetime_clinic_plan_start
        break
      case CalendarEventTypes.PRESCRIPTION:
        eventDate = item.date_start
        break
      default:
        eventDate = null
    }
    
    const transferData = {
      id: item.id_service_detail || item.id_inject || item.id_clinic_plan,
      eventType: eventType,
      date: dayjs(eventDate).format('YYYY/MM/DD HH:mm:ss')
    }
    event.dataTransfer.setData('application/json', JSON.stringify(transferData))
  }
}

const onDragEnd = (event: DragEvent) => {
  isDragging.value = false
  draggedEventId.value = null
  const element = event.target as HTMLElement
  if (element) {
    enableAllDraggables()
    element.style.opacity = '1'
    element.style.display = 'block'
  }
  removeAllDroppables()
}

const getVisibleEvents = (events: CalendarEvent[]) => {
  return events.slice(0, 3)
}

const openAllEventsModal = async (date: string, events: CalendarEvent[]) => {
  await mtUtils.smallPopup(AllEventsModal, {
    events: events,
    customerListById: customerListById.value,
    openDetailModal: props.openDetailModal
  })
}
</script>

<template>
  <QCalendarDay
    ref="calendar"
    v-model="selectedDate"
    animated
    bordered
    locale="ja"
    no-active-date
    :cell-width="(isOnSmallScreen || isOnIpad) ? '450px' : ''"
    :day-min-height="188"
    :max-days="3"
    :interval-start="12"
    :interval-minutes="30"
    :interval-count="48"
    :drag-over-func="onDragOver"
    :drag-leave-func="onDragLeave"
    :drop-func="onDrop"
    :weekday-class="onWeekdayClass"
    :interval-class="onIntervalClass"
    @click-time="openCreateModalOnInterval"
  >
    <template #head-intervals>
      <div class="first-column-header">
        <div 
          class="doctor-labels"
          :class="{ 'hidden': !props.showTopRows }"
        >
          <div class="doctor-label bg-accent-300 q-pa-sm caption1 bold text-center">
            出勤
          </div>
          <div class="doctor-label bg-grey-300 q-pa-sm caption1 bold text-center">
            休み
          </div>
        </div>
        <div class="doctor-label text-sm q-pa-sm caption1 new_label text-center" :class="{ 'top-border': !props.showTopRows }">
          時間未定
        </div>
      </div>
    </template>
    <template #head-day="{ scope: { timestamp } }">
      <div>
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
            <div class="day-header-row">
              <q-btn
                flat
                round
                color="black-3"
                text-color="grey-7"
                style="
                  border-radius: 50px;
                  background-color: #d9d9d9;
                  font-size: 12px;
                  top: 85%;
                "
                class="add-button"
                @click="openRequestModal({ date: timestamp.date, time: '06:00' })"
              >
                <q-icon name="add" size="25px" color="black" />
              </q-btn>
              <div
                class="day-status"
                :class="{
                  'is-closed': getEventByDate(timestamp.date)?.isClosed
                }"
                style="text-align: center"
              >
                <div class="status-content">
                  <div class="" style="font-size: 15px">
                    {{ timestamp.day }}
                  </div>
                  <div class="" style="font-size: 15px">
                    ({{ getDayName(timestamp) }})
                  </div>
                  <div class="text-container">
                    <div
                      class="field-label2"
                      :class="{
                        'field-label-today': getEventByDate(timestamp.date)
                          ?.isToday
                      }"
                    >
                      <template
                        v-if="!!getEventByDate(timestamp.date)?.isClosed"
                      >
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
                </div>
              </div>
            </div>
          </div>
          <div
            class="day-time-slots row q-gutter-x-sm"
            style="margin-right: 32px"
          >
            <div
              class="body2 regular"
              v-for="(timeSlot, index) in getEventByDate(timestamp.date)
                .timeSlots"
            >
              <span class="caption-1">
                枠{{ index + 1 }}: {{ timeSlot.business_start.slice(0, -3) }} ~
                {{ timeSlot.business_end.slice(0, -3) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div class="column">
        <template v-if="props.showTopRows">
          <div class="row items-center q-ml-sm q-mb-xs">
            <div class="col doctor-list text-grey-900 caption1 attendance">
              {{ getEventByDate(timestamp.date).availableDoctors }} kljklj
            </div>
          </div>
          <div class="row q-col-12">
            <div class="col dotted-border-horizontal"></div>
          </div>
          <div class="row items-center q-ml-sm">
            <div class="col doctor-list text-grey-900 caption1 holiday">
              {{ getEventByDate(timestamp.date).unavailableDoctors }}
            </div>
          </div>
        </template>
        <div 
          class="no-time-event-rows"
          @click="openRequestModal({ date: timestamp.date })"
          :class="{
            'with-show-more': getCalendarEventList(getEventByDate(timestamp.date), false).length > 3,
            'without-show-more': getCalendarEventList(getEventByDate(timestamp.date), false).length <= 3
          }"
        >
          <div class="flex" style="height: 100px; overflow: auto">
            <div
              v-for="(calendarEvent, index) in getCalendarEventList(getEventByDate(timestamp.date), false)"
              :key="`tbd-event-${index}`"
              :style="{ width: '95%', ...getCalendarEventStyle(calendarEvent) }"
              class="event-block cursor-pointer draggable"
              :class="{ 'ignore': isDragging && draggedEventId !== calendarEvent.id }"
              :draggable="calendarEvent.type !== CalendarEventTypes.PRESCRIPTION"
              @dragstart="calendarEvent.type !== CalendarEventTypes.PRESCRIPTION ? onDragStart({ event: $event, item: calendarEvent.data, sameTime: true, eventType: calendarEvent.type }) : undefined"
              @click.stop="openDetailModal({ type: calendarEvent.type, detailObj: calendarEvent.data })"
              @dragend="onDragEnd($event)"
            >
              <div class="flex body2 items-center q-mb-xs cursor-pointer service">
                <div>
                  <BadgeComponent
                    :color="calendarEvent.data.badge?.color"
                    :label="calendarEvent.data.badge?.label"
                    text-color="white"
                    rounded
                  />
                </div>
                <div class="truncated row" style="margin-left: 4px; gap: 2px;">
                  <template v-if="calendarEvent.type === CalendarEventTypes.SERVICE">
                    <div>{{ customerListById[(calendarEvent.data as CalendarServiceDetail)?.id_customer]?.name_family_original }}</div>
                    <div>{{ (calendarEvent.data as CalendarServiceDetail)?.name_pet }}</div>
                    <div>{{ (calendarEvent.data as CalendarServiceDetail)?.id_cm_animal_name }}</div>
                    <div>{{ (calendarEvent.data as CalendarServiceDetail)?.item_service_unit_name }}</div>
                  </template>
                  <template v-else-if="calendarEvent.type === CalendarEventTypes.INJECT || calendarEvent.type === CalendarEventTypes.PRESCRIPTION">
                    <div>{{ customerListById[(calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.id_customer]?.name_family_original }}</div>
                    <div>{{ (calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.name_pet }}</div>
                  </template>
                  <template v-else-if="calendarEvent.type === CalendarEventTypes.CLINIC_PLAN">
                    <div>{{ (calendarEvent.data as CalendarClinicPlanDetail)?.title_clinic_plan }}</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            v-if="getCalendarEventList(getEventByDate(timestamp.date), false).length > 3"
            class="show-more-button cursor-pointer"
            @click.stop="openAllEventsModal(timestamp.date, getCalendarEventList(getEventByDate(timestamp.date), false))"
          >
            全て ({{ getCalendarEventList(getEventByDate(timestamp.date), false).length }}件)
          </div>
        </div>
      </div>
    </template>
    
    <template #day-body="{ scope: { timestamp, timeStartPos, timeDurationHeight } }">
      <template v-for="(calendarEventGroup, groupIndex) in calendarEvents[timestamp.date]" :key="groupIndex">
        <template v-for="(calendarEvent, eventIndex) in calendarEventGroup" :key="`${groupIndex}-${eventIndex}`">
          <div
            :data-event-id="calendarEvent.data.id_entity"
            :style="{...getCalendarEventStyle(
              calendarEvent,
              timeStartPos, 
              timeDurationHeight,
            )}"
            :draggable="true"
            class="absolute event-block cursor-pointer draggable"
            @dragstart="onDragStart({ 
              event: $event, 
              item: calendarEvent.data, 
              sameTime: false, 
              eventType: calendarEvent.type,
            })"
            @dragend="onDragEnd($event)"
            @click="openDetailModal({ type: calendarEvent.type, detailObj: calendarEvent.data })"
          >
            <div
              v-if="!calendarEvent.data.is_multiday || calendarEvent.data.is_start_of_split"
              class="flex body2 items-center q-mb-xs cursor-pointer service"
              :class="{ 'five-min-event': is5MinuteEvent(calendarEvent) }">
                <BadgeComponent
                  :color="calendarEvent.data.badge!.color"
                  :label="calendarEvent.data.badge!.label"
                  text-color="white"
                  rounded
                  class="custom-badge event-badge q-mr-xs"
                />
                <div 
                  class="event-text text-grey-900" 
                  :style="{ 
                    'margin-left': '4px', 
                    'gap': '2px',
                    'display': is5MinuteEvent(calendarEvent) ? 'ruby' : 'contents' 
                  }"
                  :class="{ 'five-min-content': is5MinuteEvent(calendarEvent) }"
                >
                <span class="text-weight-bold q-mr-xs">{{ dayjs(calendarEvent.start).format('H:mm') }}</span>
                <!-- <span class="q-mr-xs">{{ calendarEvent.type === CalendarEventTypes.SERVICE ? calendarEvent.display_id : calendarEvent.id }}</span> -->
                <template v-if="calendarEvent.type === CalendarEventTypes.SERVICE">
                  <span class="q-mr-xs">{{ (calendarEvent.data as CalendarServiceDetail)?.code_pet }}</span>
                  <span class="q-mr-xs">
                    {{ customerListById[(calendarEvent.data as CalendarServiceDetail)?.id_customer]?.name_family_original
                    }}
                  </span>
                  <span class="q-mr-xs">{{ (calendarEvent.data as CalendarServiceDetail)?.name_pet }}</span>
                  <small class="q-mx-xs">{{ (calendarEvent.data as CalendarServiceDetail)?.id_cm_animal_name }}</small>
                  <span>{{ '/ ' + (calendarEvent.data as CalendarServiceDetail)?.item_service_unit_name }}</span>
                </template>
                <template
                  v-else-if="calendarEvent.type === CalendarEventTypes.INJECT || calendarEvent.type === CalendarEventTypes.PRESCRIPTION">
                  <span>
                    {{ customerListById[(calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.id_customer]?.name_family_original
                    }}
                  </span>
                  <span>{{ (calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.name_pet }}</span>
                </template>
                <template v-else-if="calendarEvent.type === CalendarEventTypes.CLINIC_PLAN">
                  <span>{{ (calendarEvent.data as CalendarClinicPlanDetail)?.title_clinic_plan }}</span>
                </template>
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>
  </QCalendarDay>
</template>
<style scoped lang="scss">
.five-min-event {
  display: flex;
  flex-wrap: nowrap;
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
}
.event-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.q-calendar,
.q-calendar__calendar-container {
  scrollbar-color: #bababa rgb(224, 224, 224) !important;
  scrollbar-width: 3px !important;
  user-select: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -webkit-overflow-scrolling: touch;
}
.new_label {
  font-size: 14px;
}
.col.doctor-list.text-grey-900.caption1.attendance {
  flex-grow: 1;
  min-height: 40px;
  max-height: 39px;
  overflow-y: auto;
  line-height: normal;
  display: flex;
  align-items: center;
}
.col.doctor-list.text-grey-900.caption1.holiday {
  flex-grow: 1;
  min-height: 46px;
  max-height: 46px;
  overflow-y: auto;
  line-height: normal;
  display: flex;
  align-items: center;
}
.col.doctor-list.text-grey-900.caption1:hover,
.col.doctor-list.text-grey-900.caption1:focus,
.col.doctor-list.text-grey-900.caption1:active {
  overflow-y: auto;
}

.first-column-header {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 52px;
}
.doctor-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  text-align: center;
}
.dotted-border-horizontal {
  border-top: 2px dotted #bdbdbd !important;
}
.doctor-label.bg-accent-300.q-pa-sm.caption1.bold {
  height: 47px;
  border-width: 1px 0px 1px 0px;
  border-style: solid;
  border-color: #bdbdbd;
  width: 55px;
}
.doctor-label.bg-grey-300.q-pa-sm.caption1.bold {
  height: 47px;
  border-width: 0px 0px 1px 0px;
  border-style: solid;
  border-color: #bdbdbd;
  width: 55px;
}

.doctor-label.text-sm.q-pa-sm.caption1.new_label {
  min-height: 47px;
  height: auto;
  width: 55px;
}

:deep(.no-time-event-rows) {
  font-weight: 500;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  height: calc(3 * (26px + 4px) + 28px);
  overflow-y: auto;
  border-top: 1px solid #b3b3b3;
}
@media screen and (max-width: 1024px) {
  .doctor-label.bg-accent-300.q-pa-sm.caption1.bold {
    margin-top: 130px;
  }
}
@media screen and (max-width: 1180px) and (min-width: 820px) {
  .doctor-label.bg-accent-300.q-pa-sm.caption1.bold {
    margin-top: 22px;
  }
  .day-header.text-center {
    min-height: 75px !important;
  }
}
.day-name {
  width: 100%;
}
.day-header-row {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 16px;
  font-weight: 700;
  position: relative;
  min-width: 300px;
}

.add-button {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 40px !important;
  height: 40px !important;
  :deep(.q-btn__wrapper) {
    padding: 0;
    min-height: unset;
  }
}
:deep(.q-btn) {
  border-radius: 50% !important;
}
.day-status {
  width: 100%;
}
.status-content {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.field-label2 {
  white-space: nowrap;
  text-align: center;
  margin: 0px 10px !important;
  padding: 4px 10px;
}
.day-header.text-center {
  min-height: 50px;
}
:deep(.droppable) {
  z-index: 3;
}

:deep(.droppable) {
  box-shadow: inset 0 0 0 1px rgba(0,140,200,.8) !important;
  z-index: 9999;
}
.no-time-event-rows {
  font-weight: 500;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: start;
  overflow-y: auto;
  border-top: 1px solid #b3b3b3;

  &.with-show-more {
    height: calc(3 * (26px + 4px) + 40px);
  }

  &.without-show-more {
    height: calc(3 * (26px + 4px))
  }
}
.event-block {
  border-radius: 5px;
  margin: 2px 0;
  min-height: 26px;
  padding: 2px;
  overflow: hidden;
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
    border-bottom: 1px solid #b3b3b3;
    width: 100%;
    padding: 4px 8px;
    min-height: 150px;
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
.is-closed {
  color: var(--q-negative);
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
  padding: 4px 10px;
  margin: 0px 10px;
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

    &:not(:last-of-type) {
      border-bottom: 3px solid #b3b3b3;
    }
  }
}
:deep(.q-calendar-month__day--label__wrapper) {
  display: none !important;
}

.draggable {
  cursor: grab; 
}

.draggable.ignore {
  pointer-events: none;
}

.event-badge {
  font-size: 13px;
  width: 18px;
  height: 18px;
}
.top-border {
  border-top : 1px solid gray;
}

.show-more-button {
  color: var(--q-primary);
  font-size: 14px;
  line-height: 10px;
  padding: 8px;
  height: 28px;
  text-align: center;
  &:hover {
    background: rgba(0,0,0,0.05);
  }
}

.event-item {
  &:hover {
    background: rgba(0,0,0,0.05);
  }
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
}
</style>
