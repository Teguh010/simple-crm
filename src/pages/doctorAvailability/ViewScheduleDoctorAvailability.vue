<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { date } from 'quasar'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useEmployeeStore from '@/stores/employees'
import {
  dateDifferences,
  formatDate,
  formatHoursMinutes,
  getDateByFormat,
  getDateToday,
  getDaysAfterDate,
  getDaysAfter
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import UpdateSpecialBusinessDayModal from './UpdateSpecialBusinessDayModal.vue'
import UpdateDoctorAvailabilityModal from './UpdateDoctorAvailabilityModal.vue'
import UpdateRequestModal from '@/pages/request/UpdateRequestModal.vue'
import useCustomerStore from '@/stores/customers'
import useServiceDetailStore from '@/stores/service-details'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import ViewPrescriptionModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import UpdateClinicPlanModal from '@/pages/clinicPlan/UpdateClinicPlanModal.vue'
import useRequestStore from '@/stores/requests'
import MtTypeGenre from '@/components/MtTypeGenre.vue'
import useDoctorAvailabilityStore from '@/stores/doctor-availabilities'
import useBusinessCalendarDayStore from '@/stores/business-calendar-days'
import _ from 'lodash'
import { storeToRefs } from 'pinia'
import { typeWeekday } from '@/utils/enum'

const props = defineProps({
  selectedDate: '',
  bookingRequests: Object,
  typeBookingGenre: null,
  isLoading: false
})
const employeeStore = useEmployeeStore()
const requestStore = useRequestStore()
const customerStore = useCustomerStore()
const serviceDetailStore = useServiceDetailStore()
const doctorAvailabilityStore = useDoctorAvailabilityStore()
const businessCalendarDayStore = useBusinessCalendarDayStore()
const off_day = ref([])
const { getCustomerListOptions } = storeToRefs(customerStore)
const { getRequest } = storeToRefs(requestStore)
const { getRecentServiceDetail } = storeToRefs(serviceDetailStore)

const calendarEmployees = _.sortBy(
  employeeStore.getEmployees,
  'display_order',
  'asc'
).filter((emp) => {
  return emp.flg_calendar
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
const openUpdateModal = async (data, bhs, id_employee, sdate) => {
  if (data && data.id_employee != id_employee) {
    data.id_employee = id_employee
    delete data.flg_unavailable
    delete data.flg_slot1_available
    delete data.flg_slot2_available
    delete data.flg_slot3_available
    delete data.limit_number1
    delete data.limit_number2
    delete data.limit_number3
    delete data.id_doctor_availability
  } else if (data === null) {
    let d = off_day.value.find(
      (v: any) =>
        v.id_employee === id_employee && v.datetime_business_day == sdate
    )
    data = {
      id_employee: d.id_employee,
      datetime_business_day: sdate,
      flg_unavailable: d.flg_unavailable
    }
  }
  let updatedFlg = { value: false }
  await mtUtils.smallPopup(UpdateDoctorAvailabilityModal, { data, updatedFlg })
  if (updatedFlg.value) {
    init()
  }
}
const toggleOffDay = async (newVal, availability, id_employee, date) => {
  let employee:any = availability.find((el) => el.id_employee === id_employee)
  if(employee?.id_doctor_availability) {
    let payload = {...employee, flg_unavailable: newVal}
    delete payload?.employee
    doctorAvailabilityStore.updateDoctorAvailability(employee.id_doctor_availability, payload).then(() => {
      init()
    })
  }
  else {
    let payload = {
      date_business_day: getDateByFormat(date, 'YYYY/MM/DD'),
      flg_unavailable: newVal,
      id_employee: id_employee,
      flg_slot_available: false
    }
    payload = 
    doctorAvailabilityStore.submitDoctorAvailability(payload).then(() => {
      init()
    })
  }
}
const openRequestModal = async (_data, id_doctor) => {
  let data = {
    date_request_start: _data.date,
    date_request_goal: _data.date,
    flg_booking: true,
    id_employee_doctor: id_doctor
  }
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateRequestModal, { data, updatedFlg })
  if (updatedFlg.value) {
    window.open(`/SearchRequestList/${updatedFlg.value}`, '_blank')
    return false
  }
}
const openServiceDetailModal = async (service: any) => {
  await serviceDetailStore.fetchServiceDetails(service.id_request, {
    id_customer: service.id_customer
  })
  serviceDetailStore.selectServiceDetail(service.id_service_detail)
  await customerStore.selectCustomer(service.id_customer)
  await customerStore.selectPet(service.id_pet)
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {
    data: getRequest.value,
    updatedFlg
  })
  if (updatedFlg.value) {
    service.datetime_service_start =
      getRecentServiceDetail.value?.datetime_service_start
  }
}
const updPrescriptionDetailModal = async (prescription: any) => {
  await customerStore.selectCustomer(prescription.id_customer)
  await customerStore.selectPet(prescription.id_pet)
  await mtUtils.mediumPopup(ViewPrescriptionModal, {
    requestDetailPage: prescription,
    id_pet: prescription.id_pet
  }, true)
}
const onClinicPlanClick = async (data) => {
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateClinicPlanModal, { data, updatedFlg })
  if (updatedFlg.value) {
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
const buildData = (newDate) => {
  let bookingRequest = props.bookingRequests.find(
    (v: any) =>
      getDateByFormat(v.date, 'YYYY-MM-DD') ===
      getDateByFormat(newDate, 'YYYY-MM-DD')
  )
  let serviceDetailList = [], prescriptionList = [], clinicPlanList = []
  let availaibleEmployeeList = _.sortBy(
  employeeStore.getEmployees,
   'display_order',
   'asc'
  ).filter((emp) => {
    return emp.flg_calendar
  }).map((v: any) => {
    return {
      id_employee: v.id_employee,
      image_public_path1: v.image_public_path1,
      name_family: v.name_family,
      name_first: v.name_first,
      name_kana_family: v.name_kana_family,
      name_kana_first: v.name_kana_first,
    }
})
  // remove duplicate entries from different slots
  availaibleEmployeeList = availaibleEmployeeList.filter((v: any, idx: number) => availaibleEmployeeList.findIndex((el) => el.id_employee === v.id_employee) === idx)
  if (props.typeBookingGenre) {
    serviceDetailList = bookingRequest?.service_detail_list.filter(
      (v: any) => v.type_booking_genre === props.typeBookingGenre
    )
  } else {
    serviceDetailList = bookingRequest?.service_detail_list
  }
  if (bookingRequest) {
    let specialBusinessDay = bookingRequest?.flg_special_business_day, businessHourSlot
    if (specialBusinessDay) {
      if(bookingRequest.special_business_days_data && bookingRequest.special_business_days_data.length > 0) {
        let businessHourSlotId = bookingRequest.special_business_days_data[0]?.id_business_hour_slot
        businessHourSlot = bookingRequest.business_hour_slot.find((v: any) => v.id_business_hour_slot === businessHourSlotId)
      }
    } else {
        businessHourSlot = bookingRequest.business_hour_slot.find((v: any) => v.id_business_hour_slot)
    }
    let _return = {
      bhs: businessHourSlot,
      memo: specialBusinessDay ? bookingRequest.special_business_days_data[0]?.memo_business_day : null,
      availability:
        availaibleEmployeeList.length > 0 ? availaibleEmployeeList
          : { flg_unavailable: false, status: false },
      off_day: businessHourSlot.type_business_day != 90 ? false : true,
      service_detail_list: serviceDetailList,
      prescription_list: prescriptionList,
      clinic_plan_list: clinicPlanList,
      unavailable_employees: bookingRequest.unavailable_employees
    }
    calendarEmployees.map((d: any) => {
      off_day.value.push({
        id_employee: d.id_employee,
        name: d.name_display,
        datetime_business_day: newDate,
        flg_unavailable: false
      })
    })
    return _return
  } else {
    return {
      bhs: null,
      memo: null,
      availability: { flg_unavailable: false, status: false },
      off_day: true,
      service_detail_list: null,
      prescription_list: null,
      clinic_plan_list: null
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
  const sdate = new Date(props.selectedDate)
  let data = []
  data.push(prepareDate(date.formatDate(props.selectedDate, 'YYYY/MM/DD')))
  for (let i = 1; i < 7; i++) {
    const newDate = date.addToDate(sdate, { day: i })
    data.push(prepareDate(date.formatDate(newDate, 'YYYY/MM/DD')))
  }
  return data
})

const getCustDetail = (idCustomer) => {
  let customer = getCustomerListOptions.value.find(
    (cus: any) => cus.value == idCustomer
  )
  return customer
}
const init = async () => {
  await businessCalendarDayStore.fetchCalendarList({
    date_start: props.selectedDate,
    date_end: getDaysAfter(6)
  })
}
const isUnavailableEmployee = (unAvailableEmployeeList, id_employee) => {
  return unAvailableEmployeeList.find((v: any) => v.id_employee === id_employee)
}
</script>

<template>
  <q-markup-table
    separator="cell"
    flat
    bordered
    class="schedule-table mb-5em"
    v-if="!props.isLoading"
  >
    <thead>
      <tr class="doctor-availability-table">
        <th class="text-center text-grey-600 custom-width">
          <div class="q-mt-sm">日付</div>
          <div class="q-mt-sm">診療枠</div>
        </th>
        <th
          class="text-center cursor-pointer relative-position custom-width"
          :class="{
            'today-class': dates.today,
            'bg-grey-200': dates._data.off_day
          }"
          v-for="(dates, j) in headerDates"
          :key="j"
          @click="openSpecialBusinessModal(dates._data, dates.date)"
        >
          <div class="memo bg-F7E3EF absolute-right" v-if="dates._data.memo">
            <q-tooltip anchor="top right" class="bg-F7E3EF" self="center end">
              <div class="column">
                <div class="body2 bold green">
                  スケジュールメモ（オーナー表示）
                </div>
                <div class="body2 text-grey-900">{{ dates._data.memo }}</div>
              </div>
            </q-tooltip>
          </div>
          <div
            :class="{
              'text-blue': dates.day == 7 && !dates.today,
              'text-darkred': dates._data.off_day
            }"
          >
            {{ dates.display_date }}
          </div>
          <div class="caption1 regular field-label2" v-if="dates._data.off_day">
            休診日
          </div>
          <div
            class="caption1 regular"
            :class="{
              'field-label-today': dates.today,
              'field-label2': !dates.today
            }"
            v-else
          >
            {{ dates._data?.bhs.name_business_hour }}
          </div>
          <template v-if="dates._data.off_day === false">
            <div
              class="caption2 regular q-mb-xs"
              v-if="dates._data?.bhs.time_business_start1"
            >
              <span class="q-mr-sm">枠1</span>
              <span class="caption1">
                {{ dates._data?.bhs.time_business_start1?.replace(/:00$/, '') }}
                ~
                {{ dates._data?.bhs.time_business_end1?.replace(/:00$/, '') }}
                ({{ dates._data?.bhs.ticket_limit_upper1 }})
              </span>
            </div>
            <div
              class="caption2 regular q-mb-xs"
              v-if="dates._data?.bhs.time_business_start2"
            >
              <span class="q-mr-sm">枠2</span>
              <span class="caption1">
                {{ dates._data?.bhs.time_business_start2?.replace(/:00$/, '') }}
                ~
                {{ dates._data?.bhs.time_business_end2?.replace(/:00$/, '') }}
                ({{ dates._data?.bhs.ticket_limit_upper2 }})
              </span>
            </div>
            <div
              class="caption2 regular q-mb-xs"
              v-if="dates._data?.bhs.time_business_start3"
            >
              <span class="q-mr-sm">枠3</span>
              <span class="caption1">
                {{ dates._data?.bhs.time_business_start3?.replace(/:00$/, '') }}
                ~
                {{ dates._data?.bhs.time_business_end3?.replace(/:00$/, '') }}
                ({{ dates._data?.bhs.ticket_limit_upper3 }})
              </span>
            </div>
          </template>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(doctor, i) in calendarEmployees" :key="i">
        <td class="text-center reduce-padding">
          <div class="column items-center">
            <q-avatar>
              <q-img
                :src="doctor?.image_path1"
                width="50px"
                class="border-radius"
              />
            </q-avatar>
            <div class="bold text-grey-900 body1">
              {{ doctor?.name_display }}
            </div>
          </div>
        </td>
        <template v-for="(dates, k) in headerDates" :key="k">
          <td
            v-if="dates._data.off_day === true"
            class="text-center reduce-padding"
            :class="{ 'bg-grey-200': dates._data.off_day === true }"
          >
            <div class="q-mt-md q-mb-xl timeline">
              <div class="flex items-center justify-between q-mb-xs"></div>
            </div>
            <div>
              <q-btn
                padding="5px"
                unelevated
                color="grey-300"
                text-color="grey-700"
                class="full-width"
                @click="openRequestModal(dates, doctor?.id_employee)"
              >
                <q-icon size="20px" name="add" />
              </q-btn>
            </div>
          </td>
          <td
            v-else
            class="text-center reduce-padding"
            :class="{ 'bg-grey-200': ( dates._data.availability?.status !== false && dates._data.unavailable_employees.find((v: any) => (doctor?.id_employee === v.id_employee)) ) }"
          >
            <div
              class="flex items-center justify-between q-bb q-mb-xs upper-part"
            >
              <MtFormCheckBox
                type="checkbox"
                v-if="dates._data.availability?.status !== false"
                label="終日休み"
                v-model:checked="dates._data[isUnavailableEmployee(dates._data.unavailable_employees, doctor.id_employee) ? 'unavailable_employees' : 'availability'].find((v: any) =>(v.id_employee === doctor?.id_employee)).flg_unavailable"
                size="24px"
                class="caption1"
                @update:checked="(newVal) => toggleOffDay(newVal, isUnavailableEmployee(dates._data.unavailable_employees, doctor.id_employee) ? dates._data.unavailable_employees : dates._data.availability ,doctor?.id_employee, dates.date)"
              />
              <div class="column caption1">
                <div
                  v-if="dates._data.availability?.status !== false && dates._data.availability.find((v: any) =>(v.id_employee === doctor?.id_employee))"
                  class="flex items-center cursor-pointer q-mb-xs"
                  @click="
                    openUpdateModal(
                      dates._data.availability.find(
                        (v: any) =>
                          v.id_employee === doctor?.id_employee
                      ),
                      dates._data?.bhs,
                      doctor?.id_employee,
                      dates.date
                    )
                  "
                >
                  <div
                    :class="{
                      'text-grey-500':
                        dates._data.unavailable_employees?.find((v:any) => v.id_employee ==
                          doctor?.id_employee)
                    }"
                  >
                    枠1
                  </div>
                  <div
                    class="q-ml-md"
                    :class="{
                      'text-grey-500':
                        dates._data.unavailable_employees?.find((v: any) => v.id_employee ==
                          doctor?.id_employee)
                    }"
                  >
                    {{
                      dates._data.bhs?.limit_number1
                        ? dates._data.bhs?.limit_number1
                        : ''
                    }}
                    枚
                  </div>
                </div>
                <div
                  v-if="dates._data.availability?.status !== false && dates._data.availability.find((v: any) =>(v.id_employee === doctor?.id_employee && formatDate(v.datetime_business_day) == dates.date && v.flg_slot2_available))"
                  class="flex items-center cursor-pointer q-mb-xs"
                  @click="
                    openUpdateModal(
                      dates._data.availability.find(
                        (v: any) =>
                          v.id_employee === doctor?.id_employee
                      ),
                      dates._data?.bhs,
                      doctor?.id_employee,
                      dates.date
                    )
                  "
                >
                  <div
                    :class="{
                      'text-grey-500':
                        dates._data.unavailable_employees?.find((v:any) => v.id_employee == doctor?.id_employee)
                    }"
                  >
                    枠2
                  </div>
                  <div
                    class="q-ml-md"
                    :class="{
                      'text-grey-500':
                        dates._data.unavailable_employees.find((v: any) => v.id_employee == doctor?.id_employee)
                    }"
                  >
                    {{
                      dates._data.bhs.limit_number2
                        ? dates._data.bhs.limit_number2
                        : ''
                    }}
                    枚
                  </div>
                </div>
                <div
                  v-if="dates._data.availability?.status !== false && dates._data.availability.find((v: any) =>(v.id_employee === doctor?.id_employee && formatDate(v.datetime_business_day) == dates.date && v.flg_slot3_available))"
                  class="flex items-center cursor-pointer q-mb-xs"
                  @click="
                    openUpdateModal(
                      dates._data.availability.find(
                        (v: any) =>
                          v.id_employee === doctor?.id_employee
                      ),
                      dates._data?.bhs,
                      doctor?.id_employee,
                      dates.date
                    )
                  "
                >
                  <div
                    :class="{
                      'text-grey-500':
                        dates._data.availability?.id_employee ==
                          doctor?.id_employee &&
                        dates._data.availability.flg_unavailable
                    }"
                  >
                    枠3
                  </div>
                  <div
                    class="q-ml-md"
                    :class="{
                      'text-grey-500':
                        dates._data.availability?.id_employee ==
                          doctor?.id_employee &&
                        dates._data.availability.flg_unavailable
                    }"
                  >
                    {{
                      dates._data.availability.find(
                        (v: any) =>
                          v.id_employee === doctor?.id_employee &&
                          formatDate(v.datetime_business_day) == dates.date &&
                          v.flg_slot2_available
                      ).limit_number3
                        ? dates._data.availability.find(
                            (v: any) =>
                              v.id_employee === doctor?.id_employee &&
                              formatDate(v.datetime_business_day) ==
                                dates.date &&
                              v.flg_slot2_available
                          ).limit_number3
                        : ''
                    }}
                    枚
                  </div>
                </div>
                <div
                  v-if="dates._data.availability.status === false"
                  class="flex items-center cursor-pointer"
                  @click="
                    openUpdateModal(
                      null,
                      dates._data?.bhs,
                      doctor?.id_employee,
                      dates.date
                    )
                  "
                >
                  <div
                    :class="{ 'text-grey-500' : off_day.find((v: any) =>  (v.id_employee === doctor?.id_employee && v.datetime_business_day == dates.date)).flg_unavailable}"
                  >
                    枠1
                  </div>
                  <div
                    class="q-ml-md"
                    :class="{ 'text-grey-500' : off_day.find((v: any) =>  (v.id_employee === doctor?.id_employee && v.datetime_business_day == dates.date)).flg_unavailable}"
                  >
                    - 枚
                  </div>
                </div>
              </div>
            </div>
            <div class="q-mt-sm q-mb-sm timeline">
              <template v-if="dates._data?.service_detail_list?.length > 0">
                <template
                  v-for="(service, s) in dates._data.service_detail_list"
                  :key="s"
                >
                  <div
                    class="flex body2 items-center justify-around- q-mb-xs cursor-pointer service"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    v-if="
                      doctor?.id_employee == service?.id_employee_doctor &&
                      (service.type_booking == 2 || service.type_booking == 3)
                    "
                    :id="service.id_service_detail"
                    @click="openServiceDetailModal(service)"
                  >
                    <div class="min-w">-</div>
                    <div
                      v-if="
                        service.badge &&
                        service.badge.color &&
                        service.badge.label
                      "
                    >
                      <!-- <MtTypeGenre :type="service.type_booking_genre" />-->
                      <q-badge
                        :color="service.badge.color"
                        text-color="white"
                        :label="service.badge.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div class="truncated">
                      {{
                        getCustDetail(service?.id_customer)?.name_family +
                        ' ' +
                        service.name_pet
                      }}
                      {{ service.name_item_service }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data?.prescription_list?.length > 0">
                <template
                  v-for="(pres, p) in dates._data.prescription_list"
                  :key="p"
                >
                  <div
                    class="flex body2 items-center justify-around- q-mb-xs cursor-pointer pres"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    v-if="
                      doctor?.id_employee == pres?.id_employee_doctor &&
                      pres.datetime_pickup_plan === null
                    "
                    @click="updPrescriptionDetailModal(pres)"
                  >
                    <div class="min-w">-</div>
                    <div>
                      <q-badge
                        color="EC9819"
                        text-color="white"
                        label="薬"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div class="truncated">
                      <!-- {{ aahUtils.getFullPetNameWithoutHonorific(pres?.id_customer, pres?.id_pet) }} -->
                      {{
                        getCustDetail(pres?.id_customer)?.name_family +
                        ' ' +
                        pres?.name_pet
                      }}
                      <!-- {{ pres.title_prescription }} -->
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data?.clinic_plan_list?.length > 0">
                <template
                  v-for="(clinic, c) in dates._data.clinic_plan_list"
                  :key="c"
                >
                  <div
                    class="flex body2 items-center q-mb-xs cursor-pointer clinic"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    v-if="
                      doctor?.id_employee == clinic?.id_employee &&
                      (clinic.datetime_clinic_plan_start === null ||
                        formatHoursMinutes(clinic.datetime_clinic_plan_start) ==
                          '00:00')
                    "
                    @click="onClinicPlanClick(clinic)"
                  >
                    <div class="min-w 0">
                      {{
                        formatHoursMinutes(clinic.datetime_clinic_plan_end) !=
                          '00:00' &&
                        dateDifferences(
                          formatDate(dates.date),
                          formatDate(clinic.datetime_clinic_plan_end)
                        ) == '0'
                          ? formatHoursMinutes(clinic.datetime_clinic_plan_end)
                          : '-'
                      }}
                    </div>
                    <div class="text-blue caption1">【院内】</div>
                    <div class="truncated">
                      {{ clinic.title_clinic_plan }}
                      {{ clinic.memo_clinic_plan }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data?.service_detail_list?.length > 0">
                <template
                  v-for="(service, s) in dates._data.service_detail_list"
                  :key="s"
                >
                  <div
                    class="flex body2 items-center justify-around- q-mb-xs cursor-pointer service"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    v-if="
                      doctor?.id_employee == service?.id_employee_doctor &&
                      service.datetime_service_start &&
                      formatHoursMinutes(service.datetime_service_start) !=
                        '00:00'
                    "
                    :id="service.id_service_detail"
                    @click="openServiceDetailModal(service)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(service.datetime_service_start) }}
                    </div>
                    <div v-if="service.badge?.color">
                      <!-- <MtTypeGenre :type="service.type_booking_genre" /> -->
          
                      <q-badge
                        :color="service.badge?.color"
                        text-color="white"
                        :label="service.badge?.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div class="truncated">
                      {{
                        getCustDetail(service?.id_customer)?.name_family +
                        ' ' +
                        service?.name_pet
                      }}
                      {{ service.name_item_service }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data?.prescription_list?.length > 0">
                <template
                  v-for="(pres, p) in dates._data.prescription_list"
                  :key="p"
                >
                  <div
                    class="flex body2 items-center justify-around- q-mb-xs cursor-pointer pres"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    v-if="
                      doctor?.id_employee == pres?.id_employee_doctor &&
                      pres.datetime_pickup_plan &&
                      formatHoursMinutes(pres.datetime_pickup_plan) != '00:00'
                    "
                    @click="updPrescriptionDetailModal(pres)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(pres.datetime_pickup_plan) }}
                    </div>
                    <div>
                      <q-badge
                        color="EC9819"
                        text-color="white"
                        label="薬"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div class="truncated">
                      {{
                        getCustDetail(pres?.id_customer)?.name_family +
                        ' ' +
                        pres?.name_pet
                      }}
                      {{ pres.title_prescription }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data?.clinic_plan_list?.length > 0">
                <template
                  v-for="(clinic, c) in dates._data.clinic_plan_list"
                  :key="c"
                >
                  <div
                    class="flex body2 items-center q-mb-xs cursor-pointer clinic"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    v-if="
                      doctor?.id_employee == clinic?.id_employee &&
                      clinic.datetime_clinic_plan_start &&
                      formatHoursMinutes(clinic.datetime_clinic_plan_start) !=
                        '00:00'
                    "
                    @click="onClinicPlanClick(clinic)"
                  >
                    <template
                      v-if="
                        dateDifferences(
                          formatDate(dates.date),
                          formatDate(clinic.datetime_clinic_plan_start)
                        ) == '0'
                      "
                    >
                      <div class="min-w 1">
                        {{
                          formatHoursMinutes(
                            clinic.datetime_clinic_plan_start
                          ) != '00:00'
                            ? formatHoursMinutes(
                                clinic.datetime_clinic_plan_start
                              )
                            : '-'
                        }}
                      </div>
                      <div class="text-blue caption1">【院内】</div>
                      <div class="truncated">
                        {{ clinic.title_clinic_plan }}
                        {{ clinic.memo_clinic_plan }}
                      </div>
                    </template>
                    <template
                      v-else-if="
                        dateDifferences(
                          formatDate(dates.date),
                          formatDate(clinic.datetime_clinic_plan_start)
                        ) > '0' &&
                        dateDifferences(
                          formatDate(dates.date),
                          formatDate(clinic.datetime_clinic_plan_end)
                        ) != '0'
                      "
                    >
                      <div class="min-w 2">-</div>
                      <div class="text-blue caption1">【院内】</div>
                      <div class="truncated">
                        {{ clinic.title_clinic_plan }}
                        {{ clinic.memo_clinic_plan }}
                      </div>
                    </template>
                    <template
                      v-else-if="
                        dateDifferences(
                          formatDate(dates.date),
                          formatDate(clinic.datetime_clinic_plan_end)
                        ) == '0'
                      "
                    >
                      <div class="min-w 3">
                        {{
                          formatHoursMinutes(clinic.datetime_clinic_plan_end) !=
                          '00:00'
                            ? formatHoursMinutes(
                                clinic.datetime_clinic_plan_end
                              )
                            : '-'
                        }}
                      </div>
                      <div class="text-blue caption1">【院内】</div>
                      <div class="truncated">
                        {{ clinic.title_clinic_plan }}
                        {{ clinic.memo_clinic_plan }}
                      </div>
                    </template>
                  </div>
                </template>
              </template>
            </div>
            <div>
              <q-btn
                padding="5px"
                unelevated
                color="grey-300"
                text-color="grey-700"
                class="full-width"
                @click="openRequestModal(dates, doctor?.id_employee)"
              >
                <q-icon size="20px" name="add" />
              </q-btn>
            </div>
          </td>
        </template>
      </tr>
    </tbody>
  </q-markup-table>
</template>
<style lang="scss" scoped>
.reduce-padding {
  padding-left: 4px;
  padding-right: 4px;
}
.custom-badge {
  padding: 4px;
  margin-left: 2px;
  margin-right: 2px;
}
.truncated {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 1;
  width: 100px !important;
  height: 20px;
  word-wrap: break-word;
  white-space: normal !important;
  text-align: left;
  @media only screen and (min-width: 1500px) {
    width: 130px !important;
  }
}
.q-table tbody td:before {
  background: none !important;
}
.timeline {
  min-height: 200px;
}
.memo {
  width: 15px;
  height: 15px;
}
.upper-part {
  min-height: 45px;
}
.pres,
.service,
.clinic {
  display: grid;
  align-items: center;
  grid-template-columns: 25px 15px 20px;
  column-gap: 10px;
}
.clinic {
  grid-template-columns: 20px 35px 20px !important;
}
th.custom-width {
  width: 180px;
}
.doctor-availability-table {
  .today-class {
    color: $white;
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
}
</style>
