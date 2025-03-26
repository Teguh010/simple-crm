import type {
  CalendarClinicPlanDetail,
  CalendarInjectDetail,
  CalendarPrescriptionDetail,
  CalendarServiceDetail
} from '@/stores/business-calendar-days'
import { type CalendarEvent, type CalendarEventType, CalendarEventTypes } from '@/types/types'
import { type CalendarScope } from '@/pages/doctorAvailability/DoctorAvailabilityNew.vue'
import dayjs from '@/boot/dayjs'
import { colorPaletteDict } from '@/utils/color-palette'

export interface OnDragStartEventParams {
  event: DragEvent | TouchEvent
  item: CalendarServiceDetail | CalendarInjectDetail | CalendarPrescriptionDetail | CalendarClinicPlanDetail
  eventType: CalendarEventType
  sameTime?: boolean
}

let draggedItem: any = null
const disableOtherDraggables = (currentElement: HTMLElement) => {
  const draggables = document.querySelectorAll('.draggable')
  draggables.forEach((el) => {
    if (el !== currentElement) {
      el.classList.add('ignore')
    }
  })
}

export const enableAllDraggables = () => {
  const draggables = document.querySelectorAll('.draggable')
  draggables.forEach((el) => {
    el.classList.remove('ignore')
  })
}

export const removeAllDroppables = () => {
  const droppables = document.querySelectorAll('.droppable')
  droppables.forEach((el) => {
    el.classList.remove('droppable')
  })
}

export interface DragEventData {
  id: string
  date: string
  eventType: string
  time?: boolean
  id_employee_staff?: string
}

export const onDragStart = ({
  event,
  item,
  eventType,
  sameTime
}: OnDragStartEventParams): void => {
  const element = event.target as HTMLElement
  if (element) {
    element.style.opacity = '0.5'
    setTimeout(() => (element.style.display = 'none'), 0)
    disableOtherDraggables(element)
  }

  draggedItem = item

  let eventData: DragEventData = {
    id: '',
    date: '',
    eventType: '',
    time: sameTime
  }

  if (eventType === CalendarEventTypes.SERVICE) {
    const itemData = item as CalendarServiceDetail
    eventData = {
      id: itemData.number_service_detail,
      date: itemData.datetime_service_start,
      id_employee_staff: itemData.id_employee_staff,
      eventType,
      time: sameTime
    }
  } else if (eventType === CalendarEventTypes.INJECT) {
    const itemData = item as CalendarInjectDetail
    eventData = {
      id: itemData.id_inject,
      date: itemData.datetime_start,
      eventType,
      time: sameTime
    }
  } else if (eventType === CalendarEventTypes.PRESCRIPTION) {
    const itemData = item as CalendarPrescriptionDetail
    eventData = {
      id: itemData.id_prescription,
      date: itemData.datetime_pickup_plan,
      eventType,
      time: sameTime
    }
  } else if (eventType === CalendarEventTypes.CLINIC_PLAN) {
    const itemData = item as CalendarClinicPlanDetail
    eventData = {
      id: itemData.id_clinic_plan,
      date: itemData.datetime_clinic_plan_start,
      eventType,
      time: sameTime
    }
  }

  if (event instanceof DragEvent && event?.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify(eventData))
  }
}

export const onDragEnd = (e: DragEvent | TouchEvent) => {
  const element = e.target as HTMLElement
  if (element) {
    enableAllDraggables()
    element.style.opacity = '1'
    element.style.display = 'block'
  }
  removeAllDroppables()
}

export const onDragEnter = (e: DragEvent | TouchEvent): boolean => {
  e.preventDefault()
  if (e.target instanceof HTMLElement && !e.target.classList.contains('droppable')) {
    e.target.classList.add('droppable')
  }
  return true
}

export const onDragOver = (e: DragEvent | TouchEvent): boolean => {
  e.preventDefault()
  if (e.target instanceof HTMLElement && !e.target.classList.contains('droppable')) {
    e.target.classList.add('droppable')
  }
  return true
}

export const onDragLeave = (e: DragEvent | TouchEvent): boolean => {
  e.preventDefault()
  if (e.target instanceof HTMLElement) {
    e.target.classList.remove('droppable')
  }
  return true
}

export const onDrop = (
  e: DragEvent | TouchEvent,
  dropHandler: (data: any) => void
): boolean => {
  disableOtherDraggables(e.target as HTMLElement)
  e.preventDefault()
  if (e.target instanceof HTMLElement) {
    e.target.classList.remove('droppable')
  }

  let data
  if (e instanceof DragEvent && e?.dataTransfer) {
    data = JSON.parse(e.dataTransfer.getData('text/plain'))
  } else {
    // For touch events, use the draggedItem
    data = draggedItem
  }

  if (typeof data !== 'undefined') {
    dropHandler(data)
  }

  draggedItem = null
  return false
}

export const onWeekdayClass = ({
  scope
}: {
  scope: CalendarScope
}): { droppable: boolean } => {
  return {
    droppable: scope.droppable === true
  }
}

export const onIntervalClass = ({
  scope
}: {
  scope: CalendarScope
}): { droppable: boolean } => {
  return {
    droppable: scope.droppable === true
  }
}

// Touch event handlers
export const onTouchStart = (params: OnDragStartEventParams): void => {
  onDragStart(params)
}

export const onTouchMove = (e: TouchEvent): void => {
  const touch = e.touches[0]
  const target = document.elementFromPoint(touch.clientX, touch.clientY)
  if (target instanceof HTMLElement) {
    onDragEnter(e)
    onDragOver(e)
  }
}

export const onTouchEnd = (
  e: TouchEvent,
  dropHandler: (data: any) => void
): void => {
  const touch = e.changedTouches[0]
  const target = document.elementFromPoint(touch.clientX, touch.clientY)
  if (target instanceof HTMLElement) {
    onDrop(e, dropHandler)
  }
  draggedItem = null
}

export const EVENT_GAP = 2
export const CONTAINER_PADDING = 8

export const isOverlapping = (event1: CalendarEvent, event2: CalendarEvent): boolean => {
  const event1Start = dayjs(event1.start, 'YYYY/MM/DD HH:mm:ss')
  const event1End = dayjs(event1.end, 'YYYY/MM/DD HH:mm:ss')
  const event2Start = dayjs(event2.start, 'YYYY/MM/DD HH:mm:ss')
  const event2End = dayjs(event2.end, 'YYYY/MM/DD HH:mm:ss')

  if (!event1Start.isValid() || !event1End.isValid() || !event2Start.isValid() || !event2End.isValid()) {
    throw new Error('Invalid date format in one or more events')
  }

  return event1Start.isSameOrBefore(event2End) && event1End.isSameOrAfter(event2Start)
}

export const columizeOverlappingEvents = (events: CalendarEvent[]): CalendarEvent[][] => {
  const groups: CalendarEvent[][] = []

  events.forEach((event) => {
    let addedToGroup = false;
    for (const group of groups) {
      if (!group.some(existingEvent => isOverlapping(existingEvent, event))) {
        group.push(event)
        addedToGroup = true
        break
      }
    }

    if (!addedToGroup) {
      groups.push([event])
    }
  })

  return groups
}

const getPaletteColor = (colorName: string) => {
  return colorPaletteDict[colorName]?.value ?? '#FFFFFF'
}

export const getRgbFromString = (colorString: string) => {
  colorString = colorString.toLowerCase()

  const rgbPattern = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/
  const hexPattern = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/

  if (rgbPattern.test(colorString) || hexPattern.test(colorString)) {
    return colorString
  }

  return getPaletteColor(colorString)
}
