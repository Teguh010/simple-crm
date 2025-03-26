<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import UpdateClinicPlanModal from '@/pages/clinicPlan/UpdateClinicPlanModal.vue'
import UpdateDoctorAvailabilityModal from './UpdateDoctorAvailabilityModal.vue'
import useBusinessCalendarDayStore, {
  EventBusinessCalendarDay, TimeSlot
} from '@/stores/business-calendar-days'
import { storeToRefs } from 'pinia'
import useCommonStore from '@/stores/common'
import { useRoute, useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import ThreeDaysCalendar from '@/pages/doctorAvailability/calendars/ThreeDaysCalendar.vue'
import { Dayjs } from 'dayjs'
import dayjs from '@/boot/dayjs'
import MonthlyCalendar from '@/pages/doctorAvailability/calendars/MonthlyCalendar.vue'
import {
  CalendarType,
  CalendarTypeKey,
  CalendarTypes
} from '@/pages/doctorAvailability/types'
import { Dictionary, filter, keyBy, map, uniqBy } from 'lodash'
import OneDayCalendar from '@/pages/doctorAvailability/calendars/OneDayCalendar.vue'
import DoctorCalendar from '@/pages/doctorAvailability/calendars/DoctorCalendar.vue'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import {
  CalendarEventType, CalendarEventTypes,
  ClinicPlanType,
  InjectDetailType,
  PrescriptionType,
  ServiceDetailType
} from '@/types/types'
import useServiceDetailStore from '@/stores/service-details'
import { daysShort } from '@/utils/enum'
import useCustomerStore from '@/stores/customers'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'
import CreateRequestServiceDetailModal from '@/pages/request/CreateRequestServiceDetailModal.vue'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useItemStore from '@/stores/items'
import { Timestamp } from '@quasar/quasar-ui-qcalendar'
import useEmployeeStore from '@/stores/employees'
import { SharedValueTypes, useMovableModalStore } from '@/stores/movable-modal'

interface CalendarTypeTab {
  id: string
  label: string
  type: CalendarType
}

export interface OpenRequestModalParam {
  date: string
  time?: string
  id_employee?: string | number
  show_time_ui?: boolean
  id_customer?: string | number
  callback?: () => void
}

export interface OpenDetailModalParam {
  type: CalendarEventType
  detailObj:
    | ServiceDetailType
    | PrescriptionType
    | InjectDetailType
    | ClinicPlanType
}

export interface CalendarScope {
  columnIndex: number
  timestamp: Timestamp
  droppable?: boolean
  timeStartPos?: () => number
  timeDurationHeight?: () => number
}

const route = useRoute()
const commonStore = useCommonStore()
const serviceDetailStore = useServiceDetailStore()
const customerStore = useCustomerStore()
const businessCalendarDayStore = useBusinessCalendarDayStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const itemStore = useItemStore()
const movableModalStore = useMovableModalStore()
const { getEmployees } = storeToRefs(useEmployeeStore())

const { getCalendarList } = storeToRefs(businessCalendarDayStore)
const { getCommonTypeServiceOptionList } = storeToRefs(commonStore)
const tab = ref('')
const typeService = ref('')
const isLoading = ref(false)
const selectedClinic = ref(null)
const typeServiceList = ref()
const selectedDate = ref<Dayjs>(dayjs())

const { setMovableModalData, setMovableModalComponent, showMovableModal, setSharedValue } = movableModalStore
const { getMovableModalData, getMovableModalShowStatus } = storeToRefs(movableModalStore)

const inputSelectedDate = computed({
  get: () => {
    return selectedDate.value.format('YYYY/MM/DD')
  },
  set: (val: string) => {
    selectedDate.value = dayjs(val, 'YYYY/MM/DD')
    fetchData()
  }
})

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

const calendarTypes: CalendarTypeTab[] = [
  {
    id: CalendarTypeKey.MONTHLY,
    label: '月間',
    type: CalendarTypes[CalendarTypeKey.MONTHLY]
  },
  {
    id: CalendarTypeKey.PER3DAYS,
    label: '3日間',
    type: CalendarTypes[CalendarTypeKey.PER3DAYS]
  },
  {
    id: CalendarTypeKey.PER1DAY,
    label: '1日',
    type: CalendarTypes[CalendarTypeKey.PER1DAY]
  },
  {
    id: CalendarTypeKey.DOCTOR,
    label: '先生',
    type: CalendarTypes[CalendarTypeKey.DOCTOR]
  }
]

const next = async () => {
  switch (tab.value) {
    case CalendarTypes[CalendarTypeKey.MONTHLY]:
      selectedDate.value = selectedDate.value.add(1, 'month')
      break
    case CalendarTypes[CalendarTypeKey.DOCTOR]:
      selectedDate.value = selectedDate.value.add(6, 'day')
      break
    case CalendarTypes[CalendarTypeKey.PER1DAY]:
      selectedDate.value = selectedDate.value.add(1, 'day')
      break
    case CalendarTypes[CalendarTypeKey.PER3DAYS]:
      selectedDate.value = selectedDate.value.add(3, 'days')
      break
    default:
      break
  }
  
  setSharedValue({
    type: SharedValueTypes.UPDATE_CALENDAR_DATE,
    value: selectedDate.value.format('YYYY/MM/DD')
  })

  await fetchData()
}

const prev = async () => {
  switch (tab.value) {
    case CalendarTypes[CalendarTypeKey.MONTHLY]:
      selectedDate.value = selectedDate.value.subtract(1, 'month')
      break
    case CalendarTypes[CalendarTypeKey.DOCTOR]:
      selectedDate.value = selectedDate.value.subtract(6, 'day')
      break
    case CalendarTypes[CalendarTypeKey.PER1DAY]:
      selectedDate.value = selectedDate.value.subtract(1, 'day')
      break
    case CalendarTypes[CalendarTypeKey.PER3DAYS]:
      selectedDate.value = selectedDate.value.subtract(3, 'days')
      break
    default:
      break
  }
  
  setSharedValue({
    type: SharedValueTypes.UPDATE_CALENDAR_DATE,
    value: selectedDate.value.format('YYYY/MM/DD')
  })
  
  await fetchData()
}

const fetchData = async () => {
  let date_start = selectedDate.value
  let date_end = selectedDate.value.add(1, 'day')

  if (tab.value === CalendarTypes[CalendarTypeKey.DOCTOR]) {
    date_end = selectedDate.value.add(7, 'days')
  } else if (tab.value === CalendarTypes[CalendarTypeKey.PER3DAYS]) {
    date_end = selectedDate.value.add(3, 'days')
  } else if (tab.value == CalendarTypes[CalendarTypeKey.MONTHLY]) {
    date_start = selectedDate.value.startOf('month').startOf('week')
    date_end = selectedDate.value.endOf('month').endOf('week')
  }

  await businessCalendarDayStore.fetchCalendarList({
    date_start: date_start.format('YYYY-MM-DD'),
    date_end: date_end.format('YYYY-MM-DD'),
    type_service: typeService.value === '' ? undefined : typeService.value
  })
}

watch(tab, async () => {
  await fetchData()
})

watch(
  route.query,
  async () => {
    switch (route.query?.view) {
      case 'per3days':
        setPageTitle('カレンダー: 3日間')
        tab.value = CalendarTypes[CalendarTypeKey.PER3DAYS]
        break
      case 'doctor':
        setPageTitle('カレンダー: 先生')
        tab.value = CalendarTypes[CalendarTypeKey.DOCTOR]
        break
      case 'monthly':
        setPageTitle('カレンダー: 月間')
        tab.value = CalendarTypes[CalendarTypeKey.MONTHLY]
        break
      case 'per1day':
        setPageTitle('カレンダー: 1日')
        tab.value = CalendarTypes[CalendarTypeKey.PER1DAY]
        break
      default:
        setPageTitle('カレンダー')
    }
  },
  { immediate: true, deep: true }
)

const init = async () => {
  isLoading.value = true
  await fetchData()
  isLoading.value = false
}

const updateOneDayView = () => {
  init()
}

const openScheduleModal = async (data?: ClinicPlanType) => {
  await mtUtils.mediumPopup(UpdateClinicPlanModal, {
    ...(data ? { data } : {}),
    callBackFromCalender: updateOneDayView
  })
}

const openRequestModal = (params: OpenRequestModalParam) => {
  const data = {
    ...params,
    date_request_start: params.date,
    date_request_goal: params.date,
    start_time: params.time,
    flg_booking: true,
    date_request_time: params.time,
    id_employee_doctor: params.id_employee,
    id_employee_staff: params.id_employee,
    show_time_ui: params.show_time_ui ?? false,
    z: 6000,
    callbackFn: fetchData,
    secondCallbackFn: params.callback,
  }
  
  if (!getMovableModalShowStatus.value) {
    setMovableModalData({
      ...getMovableModalData.value,
      ...data,
    })
    setMovableModalComponent(CreateRequestServiceDetailModal)
    showMovableModal()
    
    return
  }
  
  setSharedValue({
    type: SharedValueTypes.UPDATE_CALENDAR_DATETIME,
    value: dayjs(`${params.date} ${params.time}:00`).floor('minute', 5)
  })
}

const openDetailModal = async ({ type, detailObj }: OpenDetailModalParam) => {
  switch (type) {
    case CalendarEventTypes.SERVICE:
      const service = detailObj as ServiceDetailType
      await serviceDetailStore.fetchServiceDetails(service.id_request, {
        // id_customer: service.id_customer
      })
      serviceDetailStore.selectServiceDetail(service.id_service_detail)
      customerStore.selectPet(service.id_pet)
      let updatedFlg = { value: false }
      await mtUtils.mediumPopup(UpdateServiceDetailModal, {
        updatedFlg
      })
      // if (updatedFlg.value) {
      //   service.datetime_service_start =
      //     getRecentServiceDetail.value?.datetime_service_start
      // }
      await fetchData()
      break
    case CalendarEventTypes.PRESCRIPTION:
      break
    case CalendarEventTypes.INJECT:
      const injectDetail = detailObj as InjectDetailType
      await customerStore.selectCustomer(injectDetail.id_customer, true)
      await mtUtils.mediumPopup(UpdInjectDetailModal, {
        injectDetail,
        injectObj: injectDetail
      })
      await fetchData()
      break
    case CalendarEventTypes.CLINIC_PLAN:
      await openScheduleModal(detailObj as ClinicPlanType)
  }
}

const openAddModal = async () => {
  await mtUtils.smallPopup(UpdateDoctorAvailabilityModal, null)
}
const fetchTypeServiceList = async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [11] })
  typeServiceList.value = getCommonTypeServiceOptionList.value.map(
    (obj: any) => ({
        label: obj.name_common,
        value: obj.id_common,
        icon: obj.text1,
      })
  )
}

const updateTypeService = async () => {
  await fetchData()
}

onMounted(async () => {
  selectedClinic.value = JSON.parse(localStorage.getItem('id_clinic'))
  await fetchTypeServiceList()
  await itemServiceUnitStore.fetchItemServiceUnitCalendar()
  await itemStore.fetchItemServiceForCalendar()
  await init()
  setPageTitle('カレンダー')
  
  const createModal = route.query?.createModal
  if (createModal) {
    openRequestModal({ date: today.format('YYYY-MM-DD'), time: '09:00', show_time_ui: true })
    await router.replace({ query: { ...route.query, createModal: undefined } })
  }
})

const today = dayjs()

const events = computed(() => {
  return keyBy(
    getCalendarList.value.map((day) => {
      let timeSlots: TimeSlot[] = []

      const businessHourSlot = day.business_hour_slot[0]
      if (businessHourSlot) {
        timeSlots = filter(
          map([1, 2, 3], (suffix) => ({
            business_start: businessHourSlot[`time_business_start${suffix}`],
            business_end: businessHourSlot[`time_business_end${suffix}`],
            checkin_start: businessHourSlot[`time_checkin_start${suffix}`],
            checkin_end: businessHourSlot[`time_checkin_end${suffix}`],
            ticket_issue_start:
              businessHourSlot[`time_ticket_issue_start${suffix}`],
            ticket_issue_end: businessHourSlot[`time_ticket_issue_end${suffix}`],
            ticket_limit_upper: businessHourSlot[`ticket_limit_upper${suffix}`]
          })),
          (slot) => slot.business_start !== null
        )
      }

      const availableDoctors = uniqBy(day.available_employees, 'id_employee')
        .map((doctor) => `${employeesById.value[doctor.id_employee]?.name_display ?? doctor.name_family}`)

      const unavailableDoctors = uniqBy(day.unavailable_employees, 'id_employee')
        .map((doctor) => `${employeesById.value[doctor.id_employee]?.name_display ?? doctor.name_family}`)

      return {
        ...day,
        timeSlots,
        availableDoctors: availableDoctors.join(', '),
        unavailableDoctors: unavailableDoctors.join(', '),
        isToday: dayjs(day.date).isSame(today, 'date'),
        isClosed: day.business_hour_slot.length === 0,
        isSaturday: dayjs(day.date).day() === 6
      }
    }),
    'date'
  ) as Dictionary<EventBusinessCalendarDay>
})


const selectedMonthLabel = computed(() => {
  if (selectedDate.value.isSame(today, 'month')) {
    return '今月'
  }

  return selectedDate.value.format('MMM')
})

const todayDate = computed(() => {
  const weekdayOrdinal = dayjs().day();
  return `${dayjs().locale('ja').format('YYYY年MM月DD日')} (${daysShort[weekdayOrdinal]})`
})

const router = useRouter()

const openInThreeDays = (date: string) => {
  router.push({
    name: 'Calendar',
    query: {
      view: 'per3days',
    }
  })
  selectedDate.value = dayjs(date)
  tab.value = CalendarTypes[CalendarTypeKey.PER3DAYS]
}

const showTopRows = ref(false)

</script>
<template>
  <div class="header">
    <MtHeader :noScroll="true">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 col-2">
          <span class="body1 bold">{{ todayDate }}</span>
        </q-toolbar-title>
        <q-tabs
          v-model="tab"
          dense
          inline-label
          indicator-color="grey-300"
          active-bg-color="blue-700"
          style="width: fit-content"
          active-class="activeTabBrdr text-white bold body1"
          outside-arrows
          mobile-arrows
          narrow-indicator
          class="availability-tabs rounded-borders"
          content-class="tab-content"
        >
          <q-route-tab
            v-for="calendarType in calendarTypes"
            :name="calendarType.type"
            :label="calendarType.label"
            :to="{
              name: 'Calendar',
              query: { view: calendarType.id }
            }"
            class="custom-tab"
          />
        </q-tabs>
         <q-toggle
            v-model="showTopRows"
            label="出勤/休み表示"
            color="primary"
            class="q-mx-md"
          />
        <div class="q-ml-auto row items-center">
          <div style="width: 180px" class="q-mx-md hide-on-ipad">
            <MtFormPullDown
              type="selection"
              label="予約区分"
              outlined
              v-model:selected="typeService"
              :options="typeServiceList"
              @update:model-value="updateTypeService"
              :custom-option="true"
            >
              <template v-slot:selectedItem="{ slotProps }">
                <div class="row items-center">
                  <q-item-label class="q-mr-sm">
                    {{ slotProps.opt.label }}
                  </q-item-label>
                  <q-icon
                    size="15px"
                    name="circle"
                    :color="slotProps.opt.icon"
                  />
                </div>
              </template>
              <template v-slot:option="{ slotProps }">
                <q-item v-bind="slotProps.itemProps">
                  <q-item-section>
                    <div class="row items-center">
                      <q-item-label class="q-mr-sm">
                        {{ slotProps.opt.label }}
                      </q-item-label>
                      <q-icon
                        size="15px"
                        name="circle"
                        :color="slotProps.opt.icon"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
            </MtFormPullDown>
          </div>
          <div
            class="text-blue text-underline cursor-pointer q-mx-md hide-on-ipad"
            @click="openScheduleModal()"
          >
            院内予定
          </div>
          <div
            class="text-blue text-underline cursor-pointer q-mx-md hide-on-ipad"
            @click="
              openRequestModal({ date: selectedDate.format('YYYY-MM-DD') })
            "
          >
            予定リクエスト
          </div>
          <div
            class="flex justify-between items-center q-px-md"
            style="max-width: 300px"
          >
            <q-btn
              @click="prev()"
              padding="2px"
              flat
              unelevated
              icon="chevron_left"
              style="border: 1px solid #9e9e9e"
            />
            <div class="row no-wrap items-center q-mx-xs">
              <MtFormInputDate
                v-if="tab !== CalendarTypes[CalendarTypeKey.MONTHLY]"
                v-model:date="inputSelectedDate"
                type="date"
                class="col-grow"
                style="width: 110px"
                borderless
                :clearable="false"
              />
              <MtInputForm
                v-else
                v-model="selectedMonthLabel"
                type="text"
                class="col-grow"
                style="width: 110px"
                borderless
                readonly
              />
            </div>
            <q-btn
              @click="next()"
              padding="2px"
              flat
              unelevated
              icon="chevron_right"
              style="border: 1px solid #9e9e9e"
            />
          </div>
          <q-btn-dropdown
            class="show-on-ipad"
            flat
            round
            no-outline
            unelevated
            actionable
            dropdown-icon="more_horiz"
            style="border-radius: 40px;width:35px"
          >
            <q-list>
              <q-item clickable v-close-popup @click="openDropdown = true">
                <q-item-section>
                  <MtFormPullDown
                    type="selection"
                    label="予約区分"
                    outlined
                    v-model:selected="typeService"
                    :options="typeServiceList"
                    @update:model-value="updateTypeService"
                    :custom-option="true"
                  >
                  <template v-slot:selectedItem="{ slotProps }">
                <div class="row items-center">
                  <q-item-label class="q-mr-sm">
                    {{ slotProps.opt.label }}
                  </q-item-label>
                  <q-icon
                    size="15px"
                    name="circle"
                    :color="slotProps.opt.icon"
                  />
                </div>
              </template>
              <template v-slot:option="{ slotProps }">
                <q-item v-bind="slotProps.itemProps">
                  <q-item-section>
                    <div class="row items-center">
                      <q-item-label class="q-mr-sm">
                        {{ slotProps.opt.label }}
                      </q-item-label>
                      <q-icon
                        size="15px"
                        name="circle"
                        :color="slotProps.opt.icon"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </template>
                  </MtFormPullDown>
                </q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="openScheduleModal()">
                <q-item-section>院内予定</q-item-section>
              </q-item>
              <q-item clickable v-close-popup @click="openRequestModal({ date: selectedDate.format('YYYY-MM-DD')})">
                <q-item-section>予定リクエスト</q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </MtHeader>
  </div>
  <div class="col-12 q-px-md">
    <q-tab-panels v-if="!isLoading" v-model="tab">
      <q-tab-panel name="月間" class="q-py-none q-px-xs">
        <MonthlyCalendar
          :events="events"
          :selectedMonth="selectedDate"
          :open-request-modal="openRequestModal"
          :open-detail-modal="openDetailModal"
          :open-in-three-days="openInThreeDays"
        />
      </q-tab-panel>
      <q-tab-panel name="3日間" class="q-py-none q-px-xs">
        <div style="display: flex; max-width: 100%; width: 100%; height: 90vh;">
          <ThreeDaysCalendar
            :events="events"
            :selectedDate="selectedDate"
            :open-request-modal="openRequestModal"
            :open-detail-modal="openDetailModal"
            :open-schedule-modal="openScheduleModal"
            @refetch-data="fetchData"
            :show-top-rows="showTopRows"
          />
        </div>
      </q-tab-panel>
      <q-tab-panel name="不在" class="q-py-none q-px-xs">
        <div style="display: flex; max-width: 100%; width: 100%; height: 85vh;">
          <DoctorCalendar
            :events="events"
            :selectedDate="selectedDate"
            :open-request-modal="openRequestModal"
            :open-detail-modal="openDetailModal"
            :open-schedule-modal="openScheduleModal"
          />
        </div>
      </q-tab-panel>
      <q-tab-panel name="1日" class="q-py-none q-px-xs">
        <div style="display: flex; flex-direction: column; max-width: 100%; width: 100%; height: 90vh;">
          <OneDayCalendar
            :events="events"
            :selectedDate="selectedDate"
            :open-request-modal="openRequestModal"
            :open-detail-modal="openDetailModal"
            :open-schedule-modal="openScheduleModal"
            @refetch-data="fetchData"
          />
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>
<style lang="scss" scoped>
@media only screen and (max-width: 1200px) {
  .hide-on-ipad {
    display: none !important;
  }
  .show-on-ipad {
    display: block !important;
  }
}

@media only screen and (min-width: 1201px) {
  .show-on-ipad {
    display: none !important;
  }
}
.q-calendar,
.q-calendar__calendar-container {
  scrollbar-color: #bababa rgb(224, 224, 224) !important;
  scrollbar-width: 3px !important;
}
.row.no-wrap.items-center.q-mx-xs {
  border: 1px solid #9e9e9e;
  border-radius: 4px;
  padding: 0px 8px;
  width: 150px;
}
:deep(.q-field__native) {
  padding-right: 0;
}
:deep(.q-field__control) {
  min-height: unset;
}
.title2 {
  width: auto;
}
.header {
  position: sticky;
  top: 0;
  z-index: 5;
}
.bottom-action {
  position: fixed;
  bottom: 0;
  width: 100%;
}
.tab-content {
  .custom-tab {
    border-right: 1px solid $blue-700;
    &:last-child {
      border: none;
    }
  }
}
</style>
