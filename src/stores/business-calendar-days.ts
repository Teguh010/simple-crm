import { omit } from 'lodash'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import type { BusinessHourSlot } from '@/stores/business-hour-slots'
import type {
  CalendarEventType,
  ClinicPlanType,
  InjectDetailType,
  PrescriptionType,
  ServiceDetailType
} from '@/types/types'
import type { CalendarBadgeType } from '@/pages/doctorAvailability/types'
import { DoctorAvailability } from '@/stores/doctor-availabilities'

// TODO: Move to a more appropriate store
interface Doctor {
  id_employee: number
  name_family: string
  name_first: string
  name_kana_family: string
  name_kana_first: string
  image_public_path1: string
}

export interface CalendarBadge {
  color: string
  label: CalendarBadgeType
  type: string
  backgroundColor: string
}

export interface CalendarServiceDetail extends ServiceDetailType {
  badge: CalendarBadge | null
  name_pet: string
  item_service_unit_name: string
  id_cm_animal_name: string
}

export interface CalendarInjectDetail extends InjectDetailType {
  badge: CalendarBadge | null
  name_pet: string
}

export interface CalendarPrescriptionDetail extends PrescriptionType {
  badge: CalendarBadge | null
  name_pet: string
}

export interface CalendarClinicPlanDetail extends ClinicPlanType {
  badge: CalendarBadge | null
}

export interface BusinessCalendarDay {
  date: string
  business_hour_slot: BusinessHourSlot[]
  flg_special_business_day: boolean
  special_business_days_data: any[]
  available_doctor_by_slot1_list: Doctor[]
  available_doctor_by_slot2_list: Doctor[]
  available_doctor_by_slot3_list: Doctor[]
  available_employees: Doctor[]
  unavailable_employees: Doctor[]
  doctor_availability_list: DoctorAvailability[]
  service_detail_list: CalendarServiceDetail[]
  prescription_list: CalendarPrescriptionDetail[]
  inject_list: CalendarInjectDetail[]
  clinic_plan_list: CalendarClinicPlanDetail[]
}

export interface TimeSlot {
  business_start: string
  business_end: string
  checkin_start: string
  checkin_end: string
  ticket_issue_start: string
  ticket_issue_end: string
  ticket_limit_upper: number
}

export interface EventBusinessCalendarDay extends BusinessCalendarDay {
  availableDoctors: string
  unavailableDoctors: string
  isToday: boolean
  isClosed: boolean
  isSaturday: boolean
  timeSlots: TimeSlot[]
}

export interface CalendarEventUpdatePayload {
  id_entity: string
  start_date: string
  end_date: string
  start_datetime: string
  end_datetime: string
  id_employee_doctor?: string | null
  id_employee_staff?: string | null
  type: CalendarEventType
}

export const useBusinessCalendarDayStore = defineStore(
  'business_calendar_days',
  () => {
    const businessCalendarDays = ref<any>([])
    const bookingRequests = ref<any>([])
    const businessCalendarDay = ref(null)
    const recentBusinessCalendarDay = ref<any>(null)
    const calendarList = ref<BusinessCalendarDay[]>([])

    const getBusinessCalendarDays = computed(() => businessCalendarDays.value)
    const getBookingRequests = computed(() => bookingRequests.value)
    const getBusinessCalendarDay = computed(() => businessCalendarDay.value)
    const getRecentBusinessCalendarDay = computed(
      () => recentBusinessCalendarDay.value
    )
    const getCalendarList = computed(() => calendarList.value)

    const selectBusinessCalendarDay = (id: string | number | null = null) => {
      businessCalendarDay.value = id
        ? businessCalendarDays.value.find(
            (v: any) => v.id_doctor_availability === id
          )
        : null
    }

    const fetchBusinessCalendarDays = async (data: any | null = null) => {
      let res = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'business_calendar_days',
        data
      )
      if (res && res) {
        businessCalendarDays.value = res
      }
    }

    const submitBusinessCalendarDay = async (data: object) => {
      var res = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        'business_calendar_days',
        data
      )
      if (res) {
        recentBusinessCalendarDay.value = res
      }
    }

    const updateBusinessCalendarDay = async (id_doctor_availability: number | string, data: object) => {
      const res = await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `/business_calendar_days/${id_doctor_availability}`,
        data
      )
      if (res) {
        recentBusinessCalendarDay.value = res
      }
    }

    const destroyBusinessCalendarDay = async (id_doctor_availability: number | string) => {
      const res = await mtUtils.callApi(
        selectOptions.reqMethod.DELETE,
        `/business_calendar_days/${id_doctor_availability}`
      )
      if (res) {
        return true
      }
      return false
    }

    const fetchBookingRequests = async (data: any | null = null) => {
      let response = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'booking_requests',
        data
      )
      if (response && response) {
        bookingRequests.value = response
      }
    }

    const fetchCalendarList = async (data: any | null = null) => {
      let response = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        'calendar/list',
        data
      )
      if (response && response) {
        calendarList.value = response
      }
    }

    const updateCalendarEventDatetime = async (data: CalendarEventUpdatePayload) => {
      await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `calendar/entity/${data.id_entity}`,
        { ...omit(data, 'id_entity') }
      )
    }

    return {
      businessCalendarDays,
      bookingRequests,
      businessCalendarDay,
      recentBusinessCalendarDay,
      getBusinessCalendarDays,
      getBookingRequests,
      getBusinessCalendarDay,
      getRecentBusinessCalendarDay,
      getCalendarList,
      selectBusinessCalendarDay,
      fetchBusinessCalendarDays,
      submitBusinessCalendarDay,
      updateBusinessCalendarDay,
      destroyBusinessCalendarDay,
      fetchBookingRequests,
      fetchCalendarList,
      updateCalendarEventDatetime
    }
  }
)

export default useBusinessCalendarDayStore
