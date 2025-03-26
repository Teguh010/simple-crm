<script setup lang="ts">
import { computed, ref } from 'vue'
import { date } from 'quasar'
import {
  formatDate,
  formatHoursMinutes,
  getDateByFormat,
  getDateToday,
  concatenate
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import UpdateSpecialBusinessDayModal from './UpdateSpecialBusinessDayModal.vue'
import UpdateRequestModal from '@/pages/request/UpdateRequestModal.vue'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import ViewPrescriptionModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import UpdateClinicPlanModal from '@/pages/clinicPlan/UpdateClinicPlanModal.vue'
import useServiceDetailStore from '@/stores/service-details'
import useRequestStore from '@/stores/requests'
import MtTypeGenre from '@/components/MtTypeGenre.vue'
import useEmployeeStore from '@/stores/employees'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'
import _ from 'lodash'
import { typeWeekday } from '@/utils/enum'

const props = defineProps({
  selectedDate: '',
  bookingRequests: Object,
  typeBookingGenre: null,
  isLoading: false
})

const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const serviceDetailStore = useServiceDetailStore()
const requestStore = useRequestStore()
const { getCustomerListOptions } = storeToRefs(customerStore)
const { getRequest } = storeToRefs(requestStore)
const { getRecentServiceDetail } = storeToRefs(serviceDetailStore)
const off_day = ref(false)
const isHoliday = ref(true)
const tableLeftRows = ref({})

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
const openServiceDetailModal = async (service: any) => {
  await serviceDetailStore.fetchServiceDetails(service.id_request, {
    // id_customer: service.id_customer
  })
  serviceDetailStore.selectServiceDetail(service.id_service_detail)
  await customerStore.selectPet(service.id_pet)
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {
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
  await mtUtils.mediumPopup(UpdateClinicPlanModal, { data })
}
const openInjectDetailModal = async (inject_detail: any) => {
  await customerStore.selectCustomer(inject_detail.id_customer, true)
  await mtUtils.mediumPopup(UpdInjectDetailModal, {
    injectDetail: inject_detail,
    injectObj: inject_detail.inject
  })
}
const getJPDay = (day: number) => {
  if (day < 7) {
    day = day + 1
  } else {
    day = 1
  }
  return typeWeekday.find((v: any) => v.value === day)?.label
}
const buildData = (newDate) => {
  let bookingRequest = props.bookingRequests.find(
    (v: any) =>
      getDateByFormat(v.date, 'YYYY-MM-DD') ===
      getDateByFormat(newDate, 'YYYY-MM-DD')
  )
  let serviceDetail = [],
    prescriptionList = bookingRequest.prescription_list,
    clinicPlanList = bookingRequest.clinic_plan_list
  let injectDetailsList = []
  let availaibleEmployeeList = [
    ...bookingRequest.available_doctor_by_slot1_list,
    ...bookingRequest.available_doctor_by_slot2_list,
    ...bookingRequest.available_doctor_by_slot3_list
  ]
  if (
    bookingRequest.unavailable_employees &&
    bookingRequest.unavailable_employees.length &&
    bookingRequest.unavailable_employees.length > 0
  ) {
    availaibleEmployeeList = availaibleEmployeeList.filter(
      (v: any) =>
        bookingRequest.unavailable_employees.findIndex(
          (el) => el.id_employee === v.id_employee
        ) === -1
    )
  }
  // remove duplicate entries from different slots
  availaibleEmployeeList = availaibleEmployeeList.filter(
    (v: any, idx: number) =>
      availaibleEmployeeList.findIndex(
        (el) => el.id_employee === v.id_employee
      ) === idx
  )
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
      if (
        bookingRequest.special_business_days_data &&
        bookingRequest.special_business_days_data.length > 0
      ) {
        let businessHourSlotId =
          bookingRequest.special_business_days_data[0]?.id_business_hour_slot
        businessHourSlot = bookingRequest.business_hour_slot.find(
          (v: any) => v.id_business_hour_slot === businessHourSlotId
        )
      }
    } else {
      businessHourSlot = bookingRequest.business_hour_slot.find(
        (v: any) => v.id_business_hour_slot
      )
    }
    let _return = {
      bhs: businessHourSlot,
      memo: specialBusinessDay
        ? bookingRequest.special_business_days_data[0]?.memo_business_day
        : null,
      availability:
        availaibleEmployeeList.length > 0
          ? availaibleEmployeeList
          : {
              flg_unavailable: false,
              status: false
            },
      off_day: businessHourSlot.type_business_day != 90 ? false : true,
      service_detail_list: serviceDetail,
      prescription_list: prescriptionList,
      clinic_plan_list: clinicPlanList,
      unavaibleEmployeeList: bookingRequest.unavailable_employees,
      availaibleEmployeeList: availaibleEmployeeList,
      specialBusinessDay: specialBusinessDay,
      inject_detail_list: injectDetailsList
    }
    return _return
  } else {
    return {
      bhs: null,
      memo: null,
      availability: { flg_unavailable: false, status: false },
      off_day: true,
      service_detail_list: null,
      prescription_list: null,
      clinic_plan_list: null,
      inject_detail_list: null
    }
  }
}
const prepareDate = (newDate) => {
  let weekday =
    date.getDayOfWeek(newDate) < 7 ? date.getDayOfWeek(newDate) + 1 : 1
  let _data = buildData(newDate)
  const D = {
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
  return D
}
const headerDates = computed(() => {
  const sdate = new Date(props.selectedDate)
  let _data = []
  _data.push(prepareDate(date.formatDate(props.selectedDate, 'YYYY/MM/DD')))
  for (let i = 1; i < 3; i++) {
    const newDate = date.addToDate(sdate, { day: i })
    _data.push(prepareDate(date.formatDate(newDate, 'YYYY/MM/DD')))
  }
  return _data
})

const getCustDetail = (idCustomer: number) => {
  let customer = getCustomerListOptions.value.find(
    (cus: any) => cus.value == idCustomer
  )
  return customer
}
const setItemRef = (el, attr) => {
  if (el) {
    if (tableLeftRows.value.hasOwnProperty(attr)) {
      tableLeftRows.value[attr].push(el)
    } else tableLeftRows.value[attr] = [el]
  }
}
</script>

<template>
  <q-markup-table
    v-if="!props.isLoading"
    bordered
    class="schedule-table mb-5em"
    flat
    separator="cell"
  >
    <thead>
      <tr class="doctor-availability-table">
        <th class="text-center caption1 bold min-width"></th>
        <th
          v-for="(dates, j) in headerDates"
          :key="j"
          :class="{ 'today-class': dates.today }"
          class="text-center item-center cursor-pointer relative-position"
          @click="openSpecialBusinessModal(dates._data, dates.date)"
        >
          <div v-if="dates._data.memo" class="memo bg-F7E3EF absolute-right">
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
              'text-darkred': dates._data.off_day,
              'default-color': !dates.today
            }"
          >
            <q-chip
              v-if="dates._data.specialBusinessDay"
              color="glossy"
              class="q-mr-sm"
              label="特別"
            />
            {{ dates.display_date }}
          </div>
          <div v-if="dates._data.off_day" class="caption1 regular field-label2">
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
              v-if="dates._data?.bhs.time_business_start1"
              class="caption2 bold q-mb-xs"
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
              v-if="dates._data?.bhs.time_business_start2"
              class="caption2 bold q-mb-xs"
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
              v-if="dates._data?.bhs.time_business_start3"
              class="caption1 bold"
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
      <tr>
        <td></td>
        <td v-for="(dates, m) in headerDates" :key="m" class="doctor-rows">
          <template v-if="dates._data.availability?.status !== false">
            <div class="flex items-center q-bb">
              <div class="bg-accent-300 q-pa-sm q-mr-sm caption1 bold">
                {{ dates._data.specialBusinessDay ? '特別スケ' : '出勤' }}
              </div>
              <div class="flex items-center justify-between">
                <div class="text-grey-900 caption1 q-mr-xs">
                  {{
                    dates._data.availaibleEmployeeList
                      .map((doctor) =>
                        concatenate(doctor?.name_family, doctor?.name_first)
                      )
                      .join(', ')
                  }}
                </div>
              </div>
            </div>
            <div class="flex items-center">
              <div class="bg-grey-300 q-pa-sm q-mr-sm caption1 bold">休み</div>
              <div class="flex items-center justify-between">
                <div class="text-grey-900 caption1 q-mr-xs">
                  {{
                    dates._data.unavaibleEmployeeList
                      .map((doctor) =>
                        concatenate(doctor?.name_family, doctor?.name_first)
                      )
                      .join(', ')
                  }}
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center q-bb">
              <div class="bg-accent-300 q-pa-sm q-mr-sm caption1 bold">
                出勤
              </div>
              <div class="flex items-center justify-between">
                <template
                  v-for="(doctor, i) in _.sortBy(employeeStore.getDoctors)"
                  :key="i"
                >
                  <div class="text-grey-900 caption1 q-mr-xs">
                    {{ doctor?.name_display }}
                  </div>
                </template>
              </div>
            </div>
            <div class="flex items-center">
              <div class="bg-grey-300 q-pa-sm q-mr-sm caption1 bold">休み</div>
            </div>
          </template>
        </td>
      </tr>
      <!--- time = null or 00:00 -->
      <tr>
        <td class="text-center min-width">
          <div class="column items-center">
            <div class="bold text-grey-900 body1 no-time">終日</div>
          </div>
        </td>
        <template v-for="(dates, k) in headerDates">
          <td
            v-if="dates._data.off_day === false"
            :key="k"
            :class="{ 'bg-grey-200': off_day }"
            class="text-center reduce-padding custom-td-w 1"
          >
            <div class="q-mt-sm q-mb-sm timeline">
              <template v-if="dates._data.service_detail_list.length > 0">
                <template
                  v-for="(service, s) in dates._data.service_detail_list"
                  :key="s"
                >
                  <div
                    v-if="
                      service?.datetime_service_start === null ||
                      formatHoursMinutes(service?.datetime_service_start) ==
                        '00:00'
                    "
                    :ref="(el) => setItemRef(el, `service-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
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
                      <!-- <MtTypeGenre :type="service.type_booking_genre" /> -->
                      <q-badge
                        :color="service.badge.color"
                        text-color="white"
                        :label="service.badge.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`service-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
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
              <template v-if="dates._data.prescription_list.length > 0">
                <template
                  v-for="(pres, p) in dates._data.prescription_list"
                  :key="p"
                >
                  <div
                    v-if="
                      pres?.datetime_pickup_plan === null ||
                      formatHoursMinutes(pres?.datetime_pickup_plan) == '00:00'
                    "
                    :ref="(el) => setItemRef(el, `pres-${k}`)"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer pres"
                    @click="updPrescriptionDetailModal(pres)"
                  >
                    <div class="min-w">-</div>
                    <div>
                      <q-badge
                        class="custom-badge"
                        color="EC9819"
                        label="薬"
                        rounded
                        text-color="white"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`pres-${k}`]?.[p]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(pres.id_customer)?.name_family +
                        ' ' +
                        pres?.name_pet
                      }}
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
                    v-if="
                      clinic?.datetime_clinic_plan_start === null ||
                      formatHoursMinutes(clinic?.datetime_clinic_plan_start) ==
                        '00:00'
                    "
                    :ref="(el) => setItemRef(el, `clinic-${k}`)"
                    :class="[c % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex caption1 items-center q-mb-xs cursor-pointer clinic"
                    @click="onClinicPlanClick(clinic)"
                  >
                    <div class="min-w">-</div>
                    <div class="text-blue caption1">【院内】</div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`clinic-${k}`]?.[c]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{ clinic.title_clinic_plan }}
                      {{ clinic.memo_clinic_plan }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data.inject_detail_list.length > 0">
                <template
                  v-for="(inject, i) in dates._data.inject_detail_list"
                  :key="i"
                >
                  <div
                    v-if="
                      inject?.time_start === null ||
                      formatHoursMinutes(inject?.time_start) == '00:00'
                    "
                    :ref="(el) => setItemRef(el, `inject-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openInjectDetailModal(inject)"
                  >
                    <div class="min-w">-</div>
                    <div
                      v-if="
                        inject.badge && inject.badge.color && inject.badge.label
                      "
                    >
                      <q-badge
                        :color="inject.badge.color"
                        text-color="white"
                        :label="inject.badge.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`inject-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(inject?.id_customer)?.name_family +
                        ' ' +
                        inject?.name_pet
                      }}
                      {{ inject.name_inject_display }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </td>

          <td
            v-else
            :class="{ 'bg-grey-200': isHoliday }"
            class="text-center reduce-padding"
          ></td>
        </template>
      </tr>
      <!--- time = null or 00:00 -->

      <!--- time >= 05:00 and time <= 12:00 -->
      <tr>
        <td class="text-center min-width">
          <div class="column items-center">
            <div class="bold text-grey-900 body1 am">午前</div>
          </div>
        </td>
        <template v-for="(dates, k) in headerDates" :key="k">
          <td
            v-if="dates._data.off_day === false"
            :class="{ 'bg-grey-200': off_day }"
            class="text-center reduce-padding custom-td-w 2"
          >
            <div class="q-mt-sm q-mb-sm timeline2">
              <template v-if="dates._data.service_detail_list.length > 0">
                <template
                  v-for="(service, s) in dates._data.service_detail_list"
                  :key="s"
                >
                  <div
                    v-if="
                      service?.datetime_service_start &&
                      formatHoursMinutes(service?.datetime_service_start) >=
                        '05:00' &&
                      formatHoursMinutes(service?.datetime_service_start) <=
                        '12:00'
                    "
                    :ref="(el) => setItemRef(el, `service1-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openServiceDetailModal(service)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(service?.datetime_service_start) }}
                    </div>
                    <div>
                      <!-- <MtTypeGenre :type="service.type_booking_genre" /> -->
                      <div
                        class=""
                        v-if="
                          service.badge &&
                          service.badge.color &&
                          service.badge.label
                        "
                      >
                        <q-badge
                          :color="service.badge.color"
                          text-color="white"
                          :label="service.badge.label"
                          rounded
                          class="custom-badge"
                        />
                      </div>
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`service1-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(service.id_customer)?.name_family +
                        ' ' +
                        service?.name_pet
                      }}
                      {{ service.name_item_service }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data.prescription_list.length > 0">
                <template
                  v-for="(pres, p) in dates._data.prescription_list"
                  :key="p"
                >
                  <div
                    v-if="
                      pres?.datetime_pickup_plan &&
                      formatHoursMinutes(pres?.datetime_pickup_plan) >=
                        '00:00' &&
                      formatHoursMinutes(pres?.datetime_pickup_plan) <= '12:00'
                    "
                    :ref="(el) => setItemRef(el, `press1-${k}`)"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer pres"
                    @click="updPrescriptionDetailModal(pres)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(pres?.datetime_pickup_plan) }}
                    </div>
                    <div>
                      <q-badge
                        class="custom-badge"
                        color="EC9819"
                        label="薬"
                        rounded
                        text-color="white"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`press1-${k}`]?.[p]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(pres.id_customer)?.name_family +
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
                    v-if="
                      clinic?.datetime_clinic_plan_start &&
                      formatHoursMinutes(clinic?.datetime_clinic_plan_start) >=
                        '05:00' &&
                      formatHoursMinutes(clinic?.datetime_clinic_plan_start) <=
                        '12:00'
                    "
                    :ref="(el) => setItemRef(el, `clinic1-${k}`)"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer cursor-pointer clinic"
                    @click="onClinicPlanClick(clinic)"
                  >
                    <div class="min-w">
                      {{
                        formatHoursMinutes(clinic?.datetime_clinic_plan_start)
                      }}
                    </div>
                    <div class="text-blue caption1">【院内】</div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`clinic1-${k}`]?.[c]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{ clinic.title_clinic_plan }}
                      {{ clinic.memo_clinic_plan }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data.inject_detail_list.length > 0">
                <template
                  v-for="(inject, i) in dates._data.inject_detail_list"
                  :key="i"
                >
                  <div
                    v-if="
                      inject?.time_start &&
                      formatHoursMinutes(inject?.time_start) >= '05:00' &&
                      formatHoursMinutes(inject?.time_start) <= '12:00'
                    "
                    :ref="(el) => setItemRef(el, `inject-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openInjectDetailModal(inject)"
                  >
                    <div class="min-w">-</div>
                    <div
                      v-if="
                        inject.badge && inject.badge.color && inject.badge.label
                      "
                    >
                      <q-badge
                        :color="inject.badge.color"
                        text-color="white"
                        :label="inject.badge.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`inject-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(inject?.id_customer)?.name_family +
                        ' ' +
                        inject?.name_pet
                      }}
                      {{ inject.name_inject_display }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </td>

          <td
            v-else
            :class="{ 'bg-grey-200': isHoliday }"
            class="text-center reduce-padding"
          ></td>
        </template>
      </tr>
      <!--- time >= 05:00 and time <= 12:00 -->

      <!--- time >= 12:01 and time <= 18:00 -->
      <tr>
        <td class="text-center min-width">
          <div class="column items-center">
            <div class="bold text-grey-900 body1 pm">午後</div>
          </div>
        </td>
        <template v-for="(dates, k) in headerDates" :key="k">
          <td
            v-if="dates._data.off_day === false"
            :class="{ 'bg-grey-200': off_day }"
            class="text-center reduce-padding custom-td-w 3"
          >
            <div class="q-mt-sm q-mb-sm timeline">
              <template v-if="dates._data.service_detail_list.length > 0">
                <template
                  v-for="(service, s) in dates._data.service_detail_list"
                  :key="s"
                >
                  <div
                    v-if="
                      service?.datetime_service_start &&
                      formatHoursMinutes(service?.datetime_service_start) >=
                        '12:01' &&
                      formatHoursMinutes(service?.datetime_service_start) <=
                        '18:00'
                    "
                    :ref="(el) => setItemRef(el, `service2-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openServiceDetailModal(service)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(service?.datetime_service_start) }}
                    </div>
                    <div>
                      <!-- <MtTypeGenre :type="service.type_booking_genre" /> -->
                      <div
                        class=""
                        v-if="
                          service.badge &&
                          service.badge.color &&
                          service.badge.label
                        "
                      >
                        <q-badge
                          :color="service.badge.color"
                          text-color="white"
                          :label="service.badge.label"
                          rounded
                          class="custom-badge"
                        />
                      </div>
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`service2-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(service.id_customer)?.name_family +
                        ' ' +
                        service?.name_pet
                      }}
                      {{ service.name_item_service }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data.prescription_list.length > 0">
                <template
                  v-for="(pres, p) in dates._data.prescription_list"
                  :key="p"
                >
                  <div
                    v-if="
                      pres?.datetime_pickup_plan &&
                      formatHoursMinutes(pres?.datetime_pickup_plan) >=
                        '12:01' &&
                      formatHoursMinutes(pres?.datetime_pickup_plan) <= '18:00'
                    "
                    :ref="(el) => setItemRef(el, `press2-${k}`)"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer pres"
                    @click="updPrescriptionDetailModal(pres)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(pres?.datetime_pickup_plan) }}
                    </div>
                    <div>
                      <q-badge
                        class="custom-badge"
                        color="EC9819"
                        label="薬"
                        rounded
                        text-color="white"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`press2-${k}`]?.[p]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(pres.id_customer)?.name_family +
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
                    v-if="
                      clinic?.datetime_clinic_plan_start &&
                      formatHoursMinutes(clinic?.datetime_clinic_plan_start) >=
                        '12:01' &&
                      formatHoursMinutes(clinic?.datetime_clinic_plan_start) <=
                        '18:00'
                    "
                    :ref="(el) => setItemRef(el, `clinic2-${k}`)"
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer clinic"
                    @click="onClinicPlanClick(clinic)"
                  >
                    <div class="min-w">
                      {{
                        formatHoursMinutes(clinic?.datetime_clinic_plan_start)
                      }}
                    </div>
                    <div class="text-blue caption1">【院内】</div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`clinic2-${k}`]?.[c]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{ clinic.title_clinic_plan }}
                      {{ clinic.memo_clinic_plan }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data.inject_detail_list.length > 0">
                <template
                  v-for="(inject, i) in dates._data.inject_detail_list"
                  :key="i"
                >
                  <div
                    v-if="
                      inject?.time_start &&
                      formatHoursMinutes(inject?.time_start) >= '12:01' &&
                      formatHoursMinutes(inject?.time_start) <= '18:00'
                    "
                    :ref="(el) => setItemRef(el, `inject-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openInjectDetailModal(inject)"
                  >
                    <div class="min-w">-</div>
                    <div
                      v-if="
                        inject.badge && inject.badge.color && inject.badge.label
                      "
                    >
                      <q-badge
                        :color="inject.badge.color"
                        text-color="white"
                        :label="inject.badge.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`inject-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(inject?.id_customer)?.name_family +
                        ' ' +
                        inject?.name_pet
                      }}
                      {{ inject.name_inject_display }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </td>

          <td
            v-else
            :class="{ 'bg-grey-200': isHoliday }"
            class="text-center reduce-padding"
          ></td>
        </template>
      </tr>
      <!--- time >= 12:01 and time <= 18:00 -->

      <!--- time >= 18:01 -->
      <tr>
        <td class="text-center min-width">
          <div class="column items-center">
            <div class="bold text-grey-900 body1 after-530">以降</div>
          </div>
        </td>
        <template v-for="(dates, k) in headerDates" :key="k">
          <td
            v-if="dates._data.off_day === false"
            :class="{ 'bg-grey-200': off_day }"
            class="text-center reduce-padding custom-td-w 4"
          >
            <div class="q-mt-sm q-mb-sm timeline">
              <template v-if="dates._data.service_detail_list.length > 0">
                <template
                  v-for="(service, s) in dates._data.service_detail_list"
                  :key="s"
                >
                  <div
                    v-if="
                      service?.datetime_service_start &&
                      (formatHoursMinutes(service?.datetime_service_start) >=
                        '18:01' ||
                        (formatHoursMinutes(service?.datetime_service_start) >=
                          '00:01' &&
                          formatHoursMinutes(service?.datetime_service_start) <
                            '05:00'))
                    "
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openServiceDetailModal(service)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(service?.datetime_service_start) }}
                    </div>
                    <div>
                      <div
                        class=""
                        v-if="
                          service.badge &&
                          service.badge.color &&
                          service.badge.label
                        "
                      >
                        <!-- <MtTypeGenre :type="service.type_booking_genre" /> -->
                        <q-badge
                          :color="service.badge.color"
                          text-color="white"
                          :label="service.badge.label"
                          rounded
                          class="custom-badge"
                        />
                      </div>
                    </div>
                    <div class="truncated">
                      {{
                        getCustDetail(service.id_customer)?.name_family +
                        ' ' +
                        service.name_pet
                      }}
                      {{ service.name_item_service }}
                    </div>
                  </div>
                </template>
              </template>
              <template v-if="dates._data.prescription_list.length > 0">
                <template
                  v-for="(pres, p) in dates._data.prescription_list"
                  :key="p"
                >
                  <div
                    v-if="
                      pres?.datetime_pickup_plan &&
                      formatHoursMinutes(pres?.datetime_pickup_plan) >= '18:01'
                    "
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer pres"
                    @click="updPrescriptionDetailModal(pres)"
                  >
                    <div class="min-w">
                      {{ formatHoursMinutes(pres?.datetime_pickup_plan) }}
                    </div>
                    <div>
                      <q-badge
                        class="custom-badge"
                        color="EC9819"
                        label="薬"
                        rounded
                        text-color="white"
                      />
                    </div>
                    <div class="truncated">
                      {{
                        getCustDetail(pres.id_customer)?.name_family +
                        ' ' +
                        pres.name_pet
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
                    v-if="
                      clinic?.datetime_clinic_plan_start &&
                      formatHoursMinutes(clinic?.datetime_clinic_plan_start) >=
                        '18:01'
                    "
                    :class="[p % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex caption1 items-center q-mb-xs cursor-pointer clinic"
                    @click="onClinicPlanClick(clinic)"
                  >
                    <div class="min-w">
                      {{
                        formatHoursMinutes(clinic?.datetime_clinic_plan_start)
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
              <template v-if="dates._data.inject_detail_list.length > 0">
                <template
                  v-for="(inject, i) in dates._data.inject_detail_list"
                  :key="i"
                >
                  <div
                    v-if="
                      inject?.time_start &&
                      (formatHoursMinutes(inject?.time_start) >= '18:01' ||
                        (formatHoursMinutes(inject?.time_start) >= '00:01' &&
                          formatHoursMinutes(inject?.time_start) < '05:00'))
                    "
                    :ref="(el) => setItemRef(el, `inject-${k}`)"
                    :class="[s % 2 == 0 ? 'bg-grey-100' : 'bg-grey-050']"
                    class="flex body2 items-center q-mb-xs cursor-pointer service"
                    @click="openInjectDetailModal(inject)"
                  >
                    <div class="min-w">-</div>
                    <div
                      v-if="
                        inject.badge && inject.badge.color && inject.badge.label
                      "
                    >
                      <q-badge
                        :color="inject.badge.color"
                        text-color="white"
                        :label="inject.badge.label"
                        rounded
                        class="custom-badge"
                      />
                    </div>
                    <div
                      :style="{
                        width: `${
                          tableLeftRows[`inject-${k}`]?.[s]?.offsetWidth - 70
                        }px !important`
                      }"
                      class="truncated"
                    >
                      {{
                        getCustDetail(inject?.id_customer)?.name_family +
                        ' ' +
                        inject?.name_pet
                      }}
                      {{ inject.name_inject_display }}
                    </div>
                  </div>
                </template>
              </template>
            </div>
            <div class="q-mt-xl">
              <q-btn
                class="full-width"
                color="grey-300"
                padding="5px"
                text-color="grey-700"
                unelevated
                @click="openRequestModal(dates)"
              >
                <q-icon name="add" size="20px" />
              </q-btn>
            </div>
          </td>

          <td
            v-else
            :class="{ 'bg-grey-200': isHoliday }"
            class="text-center reduce-padding"
          >
            <div class="q-mt-sm q-mb-sm timeline"></div>
            <div class="q-mt-xl">
              <q-btn
                class="full-width"
                color="grey-300"
                padding="5px"
                text-color="grey-700"
                unelevated
                @click="openRequestModal(dates)"
              >
                <q-icon name="add" size="20px" />
              </q-btn>
            </div>
          </td>
        </template>
      </tr>
      <!--- time >= 18:01 -->
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
  width: 330px !important;
  text-align: left;
  height: auto;
  word-wrap: break-word;
  white-space: normal !important;
  @media only screen and (max-width: 1300px) {
    width: 230px !important;
  }
}

.q-table tbody td:before {
  background: none !important;
}

.timeline {
  min-height: 50px;
}

.memo {
  width: 15px;
  height: 15px;
}

.custom-td-w {
  max-width: 200px;
}

.pres,
.service,
.clinic {
  display: grid;
  align-items: center;
  grid-template-columns: 25px 20px 20px;
  column-gap: 10px;
}

.clinic {
  grid-template-columns: 20px 35px 20px !important;
}

.min-width {
  width: 70px;
}

th {
  width: 500px;
}

.doctor-rows {
  padding: 0px !important;
}

.default-color {
  color: #212121;
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
