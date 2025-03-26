<script lang="ts" setup>
import dayjs from '@/boot/dayjs'
import { QCalendarDay, Timestamp } from '@quasar/quasar-ui-qcalendar'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import {
  CalendarBadge, CalendarClinicPlanDetail, CalendarEventUpdatePayload,
  CalendarInjectDetail, CalendarPrescriptionDetail,
  CalendarServiceDetail,
  EventBusinessCalendarDay, useBusinessCalendarDayStore
} from '@/stores/business-calendar-days'
import { Dictionary, groupBy, keyBy, sortBy } from 'lodash'
import { Dayjs } from 'dayjs'
import { storeToRefs } from 'pinia'
import useEmployeeStore from '@/stores/employees'
import {
  CalendarScope,
  OpenDetailModalParam,
  OpenRequestModalParam
} from '@/pages/doctorAvailability/DoctorAvailabilityNew.vue'
import useCustomerStore from '@/stores/customers'
import { CalendarEvent, CalendarEventStyle, CalendarEventTypes, ClinicPlanType } from '@/types/types'
import {
  CONTAINER_PADDING,
  EVENT_GAP, getRgbFromString,
  columizeOverlappingEvents,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart, onIntervalClass, onWeekdayClass
} from '@/pages/doctorAvailability/calendars/utils'
import { colors, Platform } from 'quasar'
import lighten = colors.lighten
import BadgeComponent from '@/pages/doctorAvailability/calendars/BadgeComponent.vue'

interface ThreeDaysCalendarProps {
  selectedDate: Dayjs
  events: Dictionary<EventBusinessCalendarDay>
  openRequestModal: (data: OpenRequestModalParam) => void
  openDetailModal: (data: OpenDetailModalParam) => void
  openScheduleModal: (data?: ClinicPlanType) => void
}

const LOCAL_EVENT_GAP = 0.2

const props = defineProps<ThreeDaysCalendarProps>()
const emit = defineEmits(['refetch-data'])

const isOnSmallScreen = window.innerWidth < 728

const { updateCalendarEventDatetime } = useBusinessCalendarDayStore()
const { getCustomerListOptions } = useCustomerStore()
const calendar = ref()
const { getEmployees } = storeToRefs(useEmployeeStore())

const selectedDate = computed(() => {
  return props.selectedDate.format('YYYY-MM-DD')
})

const dayLabel = computed(() => {
  return props.selectedDate.format('M月 DD日')
})

const event = computed(() => {
  return props.events[selectedDate.value]
})

const employees = computed(() => {
  const employeesFiltered = getEmployees.value.filter((emp) => {
    return emp.flg_calendar && !emp.flg_resignation
  })
  
  return [
    {
      id_employee: 'unassigned',
      name_display: '担当未定枠',
    },
    ...employeesFiltered
  ]
})

const customerListById = computed(() => {
  return keyBy(getCustomerListOptions, 'value')
})

const employeesById = computed(() => {
  return keyBy(employees.value, 'id_employee')
})

const getCalendarEventListByEmployeeId = (employeeId: string | number, withTime: boolean): CalendarEvent[] => {
  const serviceDetails = getServiceDetailListByEmployeeId(employeeId, withTime) ?? []
  const injectDetails = getInjectDetailListByEmployeeId(employeeId, withTime) ?? []
  const prescriptionDetails = getPrescriptionDetailListByEmployeeId(employeeId, withTime) ?? []
  const clinicPlanDetails = getClinicPlanListByEmployeeId(employeeId, withTime) ?? []

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

const getServiceDetailListByEmployeeId = (employeeId: string | number, withTime: boolean) => {
  if(!event.value) {
    return []
  }
  
  const serviceDetails = event.value.service_detail_list

  const filteredList = serviceDetails.filter(sd => {
    const startTime = dayjs(sd.datetime_service_start)
    const endTime = dayjs(sd.datetime_service_end)
    const isMidnightEvent = startTime.hour() === 0 && startTime.minute() === 0
    const isSameMinute = startTime.isSame(endTime, 'minute')

    if (withTime) {
      return !(isSameMinute && isMidnightEvent) && sd.badge
    }

    return isSameMinute && isMidnightEvent && sd.badge
  })
  
  const groupedByEmployee = groupBy(filteredList, sd => sd.id_employee_doctor || 'unassigned')

  return groupedByEmployee[employeeId]
}

const getInjectDetailListByEmployeeId = (employeeId: string | number, withTime: boolean) => {
  if(!event.value) {
    return []
  }
  
  const injectList = event.value.inject_list

  const filteredList = injectList.filter(sd => {
    const startTime = dayjs(sd.datetime_start)
    const endTime = dayjs(sd.datetime_end)
    const isMidnightEvent = startTime.hour() === 0 && startTime.minute() === 0
    const isSameMinute = startTime.isSame(endTime, 'minute')

    if (withTime) {
      return !(isSameMinute && isMidnightEvent) && sd.badge
    }

    return isSameMinute && isMidnightEvent && sd.badge
  })
  
  const groupedByEmployee = groupBy(filteredList, sd => sd.id_employee_doctor || 'unassigned')

  return groupedByEmployee[employeeId]
}

const getClinicPlanListByEmployeeId = (employeeId: string | number, withTime: boolean) => {
  if(!event.value) {
    return []
  }
  
  const clinicPlanList = event.value.clinic_plan_list

  const filteredList = clinicPlanList.filter(sd => {
    const startTime = dayjs(sd.datetime_clinic_plan_start)
    const endTime = dayjs(sd.datetime_clinic_plan_end)
    const isMidnightEvent = startTime.hour() === 0 && startTime.minute() === 0
    const isSameMinute = startTime.isSame(endTime, 'minute')

    if (withTime) {
      return !(isSameMinute && isMidnightEvent)
    }

    return isSameMinute && isMidnightEvent
  }).map(item => ({ ...item,
    badge: {
      label: '院',
      color: 'black'
    }
  }) as CalendarClinicPlanDetail)
  
  
  const groupedByEmployee = groupBy(filteredList, sd => sd.id_employee || 'unassigned')

  return groupedByEmployee[employeeId]
}

const getPrescriptionDetailListByEmployeeId = (employeeId: string | number, withTime: boolean) => {
  if(!event.value) {
    return []
  }
  
  const prescriptionList = event.value.prescription_list

  const filteredList = prescriptionList.filter(sd => {
    const startTime = dayjs(sd.date_start)
    const endTime = dayjs(sd.date_end)
    const isMidnightEvent = startTime.hour() === 0 && startTime.minute() === 0
    const isSameMinute = startTime.isSame(endTime, 'minute')

    if (withTime) {
      return !(isSameMinute && isMidnightEvent) && sd.badge
    }

    return isSameMinute && isMidnightEvent && sd.badge
  })
  
  const groupedByEmployee = groupBy(filteredList, sd => sd.id_employee_staff || 'unassigned')

  return groupedByEmployee[employeeId]
}

const generateStyle = (eventDatetimeStart: Dayjs, eventDuration: number, badge: CalendarBadge | null, timeStartPos?: any, timeDurationHeight?: any): Dictionary<any> => {
  const style: Dictionary<any> = {}

  if (timeStartPos && timeDurationHeight) {
    const calculatedTop = timeStartPos(eventDatetimeStart.format('HH:mm')) + LOCAL_EVENT_GAP
    style.top = calculatedTop + 'px'
    const calculatedHeight = timeDurationHeight(eventDuration) - (LOCAL_EVENT_GAP * 2)
    style.height = Math.max(calculatedHeight, 34) + 'px'
  }

  if (badge) {
    style['background-color'] = lighten(getRgbFromString(badge.color), 85)
  }

  style['align-items'] = 'flex-start'
  return style;
}

const getServiceDetailEventStyle = (
  service: CalendarServiceDetail,
  timeStartPos?: (val: string) => number ,
  timeDurationHeight?: (val: number) => number
) => {
  const eventDatetime = dayjs(service.datetime_service_start)
  const eventDuration = dayjs(service.datetime_service_end).diff(eventDatetime, 'minute')

  return generateStyle(eventDatetime, eventDuration, service.badge, timeStartPos, timeDurationHeight)
}

const getInjectDetailEventStyle = (
  inject: CalendarInjectDetail,
  timeStartPos?: (val: string) => number ,
  timeDurationHeight?: (val: number) => number
) => {
  const eventDatetime = dayjs(inject.datetime_start)
  const eventDuration = dayjs(inject.datetime_end).diff(eventDatetime, 'minute')
  
  return generateStyle(eventDatetime, eventDuration, inject.badge, timeStartPos, timeDurationHeight)
}

const getClinicPlanEventStyle = (
  inject: CalendarClinicPlanDetail,
  timeStartPos?: (val: string) => number ,
  timeDurationHeight?: (val: number) => number
) => {
  const eventDatetime = dayjs(inject.datetime_clinic_plan_start)
  const eventDuration = dayjs(inject.datetime_clinic_plan_end).diff(eventDatetime, 'minute')
  
  return generateStyle(eventDatetime, eventDuration, inject.badge, timeStartPos, timeDurationHeight)
}

const getPrescriptionDetailEventStyle = (
  prescription: CalendarPrescriptionDetail,
  timeStartPos?: (val: string) => number ,
  timeDurationHeight?: (val: number) => number
) => {
  const eventDatetime = dayjs(prescription.date_start)
  const eventDuration = dayjs(prescription.date_end).diff(eventDatetime, 'minute')
  
  return generateStyle(eventDatetime, eventDuration, prescription.badge, timeStartPos, timeDurationHeight)
}

const calendarEventStyles = ref<{ [key: string]: CalendarEventStyle }>({})

const getCalendarEventStyle = (calendarEvent: CalendarEvent, timeStartPos?: any, timeDurationHeight?: any) => {
  const eventDatetime = dayjs(calendarEvent.start)
  const eventDuration = dayjs(calendarEvent.end).diff(dayjs(calendarEvent.start), 'minute')

  const eventHeight = timeDurationHeight?.(eventDuration)

  const lineHeight = 20
  const maxLines = Math.floor(eventHeight / lineHeight)

  const finalObj = {
    ...calendarEventStyles.value[calendarEvent.id],
    ...generateStyle(eventDatetime, eventDuration, calendarEvent.data.badge, timeStartPos, timeDurationHeight),
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    '-webkit-line-clamp': eventDuration <= 5 ? 1 : maxLines,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    whiteSpace: eventDuration <= 5 ? 'nowrap' : 'normal',
    lineHeight: 1,
  }

  return finalObj
}

const getEventByDate = (date: string) => {
  return props.events[date] ?? { isClosed: true }
}

const onDrop = async (
  e: DragEvent | TouchEvent,
  type: string,
  scope: CalendarScope
) => {
  e.preventDefault()
  if (!e.dataTransfer) return

  const eventData = JSON.parse(e.dataTransfer.getData('text/plain'))
  const eventType = eventData.eventType
  const originalDate = dayjs(eventData.date, 'YYYY/MM/DD HH:mm:ss')
  const targetDate = dayjs(`${scope.timestamp.date} ${scope.timestamp.time}`)
  const event = getEventByDate(originalDate.format('YYYY-MM-DD'))

  if (!event) return

  const data: CalendarEventUpdatePayload = {
    id_entity: '',
    start_datetime: '',
    end_datetime: '',
    id_employee_doctor: employees.value[scope.columnIndex].id_employee,
    id_employee_staff: employees.value[scope.columnIndex].id_employee,
    type: eventType
  }

  const updateEventTimes = (
    startTime: string,
    endTime: string,
    duration: number
  ) => {
    const newStartTime = targetDate
    return {
      start: newStartTime.format('YYYY/MM/DD HH:mm:ss'),
      end: type !== 'interval' 
        ? newStartTime.format('YYYY/MM/DD HH:mm:ss')
        : newStartTime.add(duration, 'minute').format('YYYY/MM/DD HH:mm:ss')
    }
  }

  switch (eventType) {
    case CalendarEventTypes.SERVICE:
      const service = event.service_detail_list.find(
        sd => sd.number_service_detail === eventData.id
      );
      if (!service) return

      const serviceDuration = dayjs(service.datetime_service_end)
        .diff(service.datetime_service_start, 'minute')
      
      const serviceTime = updateEventTimes(
        service.datetime_service_start,
        service.datetime_service_end,
        serviceDuration
      );

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
    data.id_employee_doctor = data.id_employee_doctor === 'unassigned' ? null : data.id_employee_doctor
    
    const eventElement = document.querySelector(`[data-event-id="${data.id_entity}"]`)
    if (eventElement) {
      eventElement.style.display = 'none'
    }

    await updateCalendarEventDatetime(data)
    emit('refetch-data')
  } catch (e) {
    if (eventElement) {
      eventElement.style.display = ''
    }
  }

  return false
}

const eventCountsByDoctor = computed(() => {
  const counts: { [key: string]: number } = {}
  employees.value.forEach(employee => {
    const idEmployee = employee.id_employee === 'unassigned' ?  null : employee.id_employee
    const serviceDetails = event.value.service_detail_list.filter(sd => sd.id_employee_staff === idEmployee)
    const injectDetails = event.value.inject_list.filter(i => i.id_employee_staff === idEmployee)
    const clinicPlans = event.value.clinic_plan_list.filter(i => i.id_employee === idEmployee)
    counts[employee.id_employee] = serviceDetails.length + injectDetails.length + clinicPlans.length
  })
  return counts
})

const MIN_EVENT_WIDTH = 70
const EVENT_PADDING = 10
const MIN_CELL_WIDTH = 300

const calculateDynamicCellWidth = computed(() => {
  if (isOnSmallScreen) {
    return '300px'
  }

  // Calculate total available columns
  const totalColumns = employees.value?.length || 1
  const availableWidth = window.innerWidth - 48
  const columnWidth = availableWidth / totalColumns

  const maxEventsPerCell = employees.value.reduce((max, employee) => {
    const employeeEvents = getCalendarEventListByEmployeeId(
      employee.id_employee, 
      true
    )
    return Math.max(max, employeeEvents?.length || 0)
  }, 0)

  // If no events, use width based on column count
  if (maxEventsPerCell === 0) {
    return `${columnWidth}px`
  }

  // For few events (1-10), use columnWidth directly
  // to maintain screen proportion
  if (maxEventsPerCell > 0 && maxEventsPerCell < 10) {
    return `${columnWidth}px`
  }

  // For cases with many events, use event-based calculation
  const requiredWidth = Math.min(
    columnWidth,
    Math.max(
      MIN_CELL_WIDTH,
      (maxEventsPerCell * MIN_EVENT_WIDTH) + 
      ((maxEventsPerCell - 1) * EVENT_PADDING)
    )
  )

  return `${requiredWidth}px`
})

// Add event listener to update on window resize
onMounted(() => {
  window.addEventListener('resize', () => {
    // Trigger recompute
    calculateDynamicCellWidth.value
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    calculateDynamicCellWidth.value
  })
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

const prepareEvents = () => {
  Object.keys(employeesById.value).forEach(employeeId => {
    if (!event.value) return
    const withTimeEvents = getCalendarEventListByEmployeeId(employeeId, true)

    const sortedEvents = sortBy(withTimeEvents, event => dayjs(event.start, 'YYYY/MM/DD HH:mm:ss').toDate())

    const groupedEvents = columizeOverlappingEvents(sortedEvents)

    groupedEvents.forEach((calendarEvents, groupIndex, arr) => {
      calculateCalendarEventWidth(calendarEvents, groupIndex, arr.length)
    })

    calendarEvents.value[employeeId] = groupedEvents
  })
}

watch(() => props.events, () => {
  prepareEvents()
}, {
  immediate: true,
  deep: true
})

const openCreateModalOnInterval = (data: { scope: CalendarScope, event: PointerEvent}) => {
  props.openRequestModal({
    date: data.scope.timestamp.date,
    time: data.scope.timestamp.time,
    id_employee: employees.value[data.scope.columnIndex]?.id_employee,
    callback: calendar.value.scrollToTime,
    show_time_ui: true,
  })
}
</script>

<template>
  <QCalendarDay
    style="height: 90vh"
    ref="calendar" 
    v-model="selectedDate"
    :cell-width="(isOnSmallScreen || isOnIpad) ? '300px' : ''"
    animated 
    bordered
    locale="ja"
    no-active-date
    :day-min-height="188"
    :max-days="1"
    :interval-start="12"
    :interval-minutes="30"
    :interval-count="48"
    :column-count="employees.length"
    :drag-over-func="onDragOver"
    :drag-leave-func="onDragLeave"
    :drop-func="onDrop"
    @click-time="openCreateModalOnInterval"
  >
    
    <template #head-day="{ scope: { columnIndex, timestamp } }">
      <div class="employee-column">
        {{ employees[columnIndex].name_display }}
        <span class="event-count q-ml-sm">({{ eventCountsByDoctor[employees[columnIndex].id_employee] }})</span>
      </div>
    </template>
    
    <template #prepend-intervals>
      <div class="first-column-header">
        <div class="doctor-label text-sm q-pa-sm caption1 text-center">時間未定</div>
      </div>
    </template>
    
    <template #prepend-day="{ scope: { columnIndex, timestamp } }">
      <div class="no-time-event-rows" @click="openRequestModal({ date: timestamp.date, show_time_ui: false  })">
        <q-virtual-scroll
          style="max-height: 150px;"
          :items="getServiceDetailListByEmployeeId(employees[columnIndex].id_employee, false)"
          separator
          v-slot="{ item: service, index }"
        >
          <div
            :style="getServiceDetailEventStyle(service)"
            class="event-block cursor-pointer"
            :draggable="true"
            @dragstart="onDragStart({ event: $event, item: service, sameTime: true, eventType: CalendarEventTypes.SERVICE })"
            @dragend="onDragEnd($event)"
            @click.stop="openDetailModal({ type: CalendarEventTypes.SERVICE, detailObj: service })"
          >
            <div class="flex body2 items-center cursor-pointer service">
              <div>
                <BadgeComponent
                  :color="service.badge!.color"
                  :label="service.badge!.label"
                  text-color="white"
                  class="q-mr-xs"
                />
              </div>
              <div class="flex flex-1 overflow-hidden whitespace-nowrap">
                <div class="text-truncate" style="gap: 8px;">
                  <span>{{ customerListById[service.id_customer]?.name_family_original }}</span>
                  <span>{{ service?.name_pet }}</span>
                  <span>{{ service?.id_cm_animal_name }}</span>
                  <span>{{ service?.item_service_unit_name }}</span>
                </div>
              </div>
            </div>
          </div>
        </q-virtual-scroll>
        <template v-for="(inject, index) in getInjectDetailListByEmployeeId(employees[columnIndex].id_employee, false)">
          <div
            :style="getInjectDetailEventStyle(inject)"
            class="event-block cursor-pointer"
            :draggable="true"
            @dragstart="onDragStart({ event: $event, item: inject, sameTime: true, eventType: CalendarEventTypes.INJECT })"
            @dragend="onDragEnd($event)"
            @click.stop="openDetailModal({ type: CalendarEventTypes.INJECT, detailObj: inject })"
          >
            <div class="flex body2 items-center cursor-pointer service">
              <div>
                <BadgeComponent
                  :color="inject.badge!.color"
                  :label="inject.badge!.label"
                  text-color="white"
                  class="q-mr-xs"
                />
              </div>
              <div class="flex flex-1 overflow-hidden whitespace-nowrap">
                <div class="text-truncate" style="gap: 8px;">
                  <span>{{ customerListById[inject.id_customer]?.name_family_original }}</span>
                  <span>{{ inject?.name_pet }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-for="(clinicPlan, index) in getClinicPlanListByEmployeeId(employees[columnIndex].id_employee, false)">
          <div
            :style="getClinicPlanEventStyle(clinicPlan)"
            class="event-block cursor-pointer"
            :draggable="true"
            @dragstart="onDragStart({ event: $event, item: clinicPlan, sameTime: true, eventType: CalendarEventTypes.CLINIC_PLAN })"
            @dragend="onDragEnd($event)"
            @click.stop="openScheduleModal(clinicPlan)"
          >
            <div class="flex body2 items-center cursor-pointer service">
              <BadgeComponent
                :color="clinicPlan.badge?.color"
                :label="clinicPlan.badge?.label"
                text-color="white"
                class="q-ml-none q-mr-xs"
              />
              <div class="flex flex-1 overflow-hidden whitespace-nowrap">
                <div class="text-truncate">
                  <span>{{ clinicPlan.title_clinic_plan }}</span>
                </div>
              </div>

            </div>
          </div>
        </template>
        <template v-for="(prescription, index) in getPrescriptionDetailListByEmployeeId(employees[columnIndex].id_employee, false)">
          <div
            :style="getPrescriptionDetailEventStyle(prescription)"
            class="event-block cursor-pointer"
            @click.stop="openDetailModal({ type: CalendarEventTypes.PRESCRIPTION, detailObj: prescription })"
          >
            <div class="flex body2 items-center cursor-pointer service">
              <div>
                <BadgeComponent
                  :color="prescription.badge!.color"
                  :label="prescription.badge!.label"
                  text-color="white"
                  class="q-mr-xs"
                />
              </div>
              <div class="truncated row" style="margin-left: 4px; gap: 8px;">
                <span> {{ customerListById[prescription.id_customer]?.name_family_original }} </span>
                <span>{{ prescription?.name_pet }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </template>
    
    <template #day-body="{ scope: { timestamp, columnIndex, timeStartPos, timeDurationHeight } }">
      <template v-for="(calendarEventGroup, index) in calendarEvents[employees[columnIndex].id_employee]">
        <template v-for="(calendarEvent, eventIndex) in calendarEventGroup">
          <div
          :data-event-id="calendarEvent.data.id_entity"
          :style="getCalendarEventStyle(calendarEvent, timeStartPos, timeDurationHeight)"
          :class="{ 'multiple-events': calendarEventGroup.length > 1 }"
          :draggable="true"
          @dragstart="onDragStart({ event: $event, item: calendarEvent.data, sameTime: false, eventType: calendarEvent.type })"
          @dragend="onDragEnd($event)"
          @click="openDetailModal({ type: calendarEvent.type, detailObj: calendarEvent.data })"
        >
        <div class="flex flex-col min-w-0 event-content">
          <div class="flex items-center space-x-1 mb-1"> 
            </div>
            <div class="min-w-0 text-grey-900" style="display: ruby;overflow: hidden;">
              <template v-if="calendarEvent.type === CalendarEventTypes.SERVICE">
                <div 
                  class="event-text"
                  :title="`${customerListById[(calendarEvent.data as CalendarServiceDetail)?.id_customer]?.name_family_original} ${(calendarEvent.data as CalendarServiceDetail)?.name_pet} ${(calendarEvent.data as CalendarServiceDetail)?.id_cm_animal_name} ${(calendarEvent.data as CalendarServiceDetail)?.item_service_unit_name}`"
                >
                  <BadgeComponent
                    :color="calendarEvent.data.badge!.color"
                    :label="calendarEvent.data.badge!.label"
                    text-color="white"
                    rounded
                    class="event-badge q-mr-xs"
                  />
                    <span class="text-weight-bold q-mr-sm">{{ dayjs(calendarEvent.start).format('H:mm') }}</span> 
                    <span class="q-mr-sm"> {{ (calendarEvent.data as CalendarServiceDetail)?.code_pet }} </span>
                    <span class="text-weight-bold q-mr-sm">
                      {{ customerListById[(calendarEvent.data as CalendarServiceDetail)?.id_customer]?.name_family_original }}
                      {{ (calendarEvent.data as CalendarServiceDetail)?.name_pet }} 
                    </span>
                    <small class="q-mr-sm"> {{ (calendarEvent.data as CalendarServiceDetail)?.id_cm_animal_name }} </small>
                  <span> {{ (calendarEvent.data as CalendarServiceDetail)?.item_service_unit_name }} </span>
                </div>
              </template>
              
              <template v-else-if="calendarEvent.type === CalendarEventTypes.INJECT || calendarEvent.type === CalendarEventTypes.PRESCRIPTION">
                <div class="truncate text-sm" :title="customerListById[(calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.id_customer]?.name_family_original">
                  {{ customerListById[(calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.id_customer]?.name_family_original }}
                </div>
                <div class="truncate text-sm" :title="(calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.name_pet">
                  {{ (calendarEvent.data as CalendarPrescriptionDetail | CalendarInjectDetail)?.name_pet }}
                </div>
              </template>
              
              <template v-else-if="calendarEvent.type === CalendarEventTypes.CLINIC_PLAN">
                <div class="truncate text-sm" :title="(calendarEvent.data as CalendarClinicPlanDetail)?.title_clinic_plan">
                  <BadgeComponent
                    :color="calendarEvent.data.badge!.color"
                    :label="calendarEvent.data.badge!.label"
                    text-color="white"
                    class="q-mr-xs"
                  />
                {{ dayjs(calendarEvent.start).format('H:mm') }}
                  {{ (calendarEvent.data as CalendarClinicPlanDetail)?.title_clinic_plan }}
                </div>
              
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
.prepend-row {
  border-bottom: var(--calendar-border);
}
.event-text {
  overflow: hidden;
  text-overflow: ellipsis;
  display: contents;
  font-size: 13px;
}

.truncate.text-sm {
    display: contents;
}
.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 120px;
  flex: 1 1 auto;
}
.doctor-label.text-sm.q-pa-sm.caption1.new_label {
    margin-top: 48px;
    text-align: center;
    border-top: 3px solid #e0e0e0;
}
.q-calendar,
.q-calendar__calendar-container {
  scrollbar-color: #BABABA rgb(224, 224, 224) !important;
  scrollbar-width: 3px !important;
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
  min-height: 50px;
  max-height: 200px;
  overflow-x: auto;
  border-top: 1px solid #e0e0e0;
}

.event-block {
  border-radius: 4px;
  margin: 0px;
  min-width: 0;
  width: 100%;
  flex-direction: column;
}

.event-content {
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  cursor: pointer;
}

.multiple-events .truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.header {
  &-container {
    display: flex;
    align-items: center;
    height: 100%;
    gap: 16px;

    .day-label {
      font-size: 16px;
      font-weight: 700;
      color: $grey-900;
    }
  }
}
.employee {
  &-column {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 50px;
    color: white;
    background-color: #c1a14e;
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

</style>