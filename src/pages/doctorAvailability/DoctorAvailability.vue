<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import {
  changeDate,
  changeMonth,
  getDateByFormat,
  getDateToday,
  getDaysAfter,
  getDaysAfterDate,
  getDaysBefore,
  getDaysInMonth
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import ViewScheduleDoctorAvailability from './ViewScheduleDoctorAvailability.vue'
import ViewScheduleOneDay from './ViewScheduleOneDay.vue'
import UpdateClinicPlanModal from '@/pages/clinicPlan/UpdateClinicPlanModal.vue'
import UpdateRequestModal from '@/pages/request/UpdateRequestModal.vue'
import UpdateDoctorAvailabilityModal from './UpdateDoctorAvailabilityModal.vue'
import ViewScheduleThreeDays from './ViewScheduleThreeDays.vue'
import ViewScheduleMonthly from './ViewScheduleMonthly.vue'
import useBusinessCalendarDayStore from '@/stores/business-calendar-days'
import { storeToRefs } from 'pinia'
import useActionStore from '@/stores/action'
import useCommonStore from '@/stores/common'
import { useRoute, useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'

const route = useRoute()
const router = useRouter()
const actionStore = useActionStore()
const commonStore = useCommonStore()
const action = computed(() => actionStore.action)
const businessCalendarDayStore = useBusinessCalendarDayStore()
const { getCalendarList } = storeToRefs(
  businessCalendarDayStore
)
const { getCommonTypeServiceOptionList } = storeToRefs(commonStore)
const tab = ref('')
const booking_genre = ref('')
const isLoading = ref(false)
const selectedDate = ref(getDateToday())
const currentDate = ref(getDateToday())
const selectedMonthLabel = ref('今月')
const selectedMonth = ref(getDateByFormat(getDateToday(), 'YYYY/MM'))
const viewScheduleThreeDaysKey = ref(0)
const viewScheduleOneDayKey = ref(0)
const selected_clinic = ref(null)
const bookingGenreList = ref()

const onChangeDate = async (prefix: string) => {
  if ((tab.value == '3日間' || tab.value == '不在') && prefix != 'selected') {
    selectedDate.value = changeDate(selectedDate.value, prefix)
  } else if (tab.value == '月間') {
    selectedMonth.value = changeMonth(selectedMonth.value, prefix)
    selectedDate.value = getDateByFormat(selectedMonth.value, 'YYYY/MM/DD')
    if (
      getDateByFormat(currentDate.value, 'YYYY-MM') ==
      getDateByFormat(selectedMonth.value, 'YYYY-MM')
    ) {
      selectedMonthLabel.value = '今月'
    } else {
      selectedMonthLabel.value = getDateByFormat(
        selectedMonth.value,
        'YYYY年MM月'
      )
    }
  } else if (tab.value == '1日' && prefix != 'selected') {
    selectedDate.value = changeDate(selectedDate.value, prefix)
  }
  init()
  ++viewScheduleThreeDaysKey.value
}
const init = async () => {
  isLoading.value = true

  if (tab.value == '不在') {
    // per-doctor view
    await businessCalendarDayStore.fetchCalendarList({
      date_start: selectedDate.value,
      date_end: getDaysAfter(6)
    })
  }
  if (tab.value == '3日間') {
    // 3-day view
    await businessCalendarDayStore.fetchCalendarList({
      date_start: selectedDate.value,
      date_end: getDaysAfterDate(selectedDate.value, 2)
    })
  }
  if (tab.value == '月間') {
    // per-month view
    await businessCalendarDayStore.fetchCalendarList({
      date_start: getDateByFormat(selectedMonth.value, 'YYYY/MM/DD'),
      date_end: getDaysAfter(
        getDaysInMonth(getDateByFormat(selectedMonth.value, 'YYYY/MM/DD'))
      )
    })
  }
  if (tab.value == '1日') {
    // per-day view
    await businessCalendarDayStore.fetchCalendarList({
      date_start: selectedDate.value,
      date_end: selectedDate.value
    })
    ++viewScheduleOneDayKey.value
  }
  isLoading.value = false
}
const updateOneDayView = () => {
  init()
  ++viewScheduleOneDayKey.value
}
const openScheduleModal = async () => {
  await mtUtils.mediumPopup(UpdateClinicPlanModal, {
    callBackFromCalender: updateOneDayView
  })
}
const openRequestModal = async () => {
  await mtUtils.mediumPopup(UpdateRequestModal, null)
}
const openAddModal = async () => {
  await mtUtils.smallPopup(UpdateDoctorAvailabilityModal, null)
}
const fetchBookingGenreList = async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [11] })
  bookingGenreList.value = getCommonTypeServiceOptionList.value.map(
    (obj: any) => ({
      label: obj.name_common,
      value: obj.code_func1,
      icon: obj.text1
    })
  )
}
watch(
  () => tab.value,
  (nowValue, oldValue) => {
    if (nowValue == '月間') {
      setPageTitle('カレンダー: 月間')
      router.push({ path: 'DoctorAvailability', query: { view: 'monthly' } })
    } else if (nowValue == '3日間') {
      setPageTitle('カレンダー: 3日間')
      router.push({ path: 'DoctorAvailability', query: { view: 'per-3days' } })
    } else if (nowValue == '不在') {
      setPageTitle('カレンダー: 先生')
      router.push({ path: 'DoctorAvailability', query: { view: 'per-doctor' } })
    } else if (nowValue == '1日') {
      setPageTitle('カレンダー: 1日')
      router.push({ path: 'DoctorAvailability', query: { view: 'per-1day' } })
    }
    init()
  }
)
watch(
  () => route.query.view,
  (nowValue, oldValue) => {
    if (nowValue == 'monthly') {
      tab.value = '月間'
    } else if (nowValue == 'per-3days') {
      tab.value = '3日間'
    } else if (nowValue == 'per-doctor') {
      tab.value = '不在'
    } else if (nowValue == 'per-1day') {
      tab.value = '1日'
    }
  }
)
const updateBookingGenre = () => {}

watch(action, () => {
  if (action.value === 'updateScheduleView') {
    console.log('updateScheduleView')
    if (localStorage.getItem('activeScheduleView')) {
      tab.value = localStorage.getItem('activeScheduleView')
      selectedDate.value = localStorage.getItem('3daySelectedDate')
    }
    actionStore.resetAction()
  }
})

onMounted(async () => {
  selected_clinic.value = JSON.parse(localStorage.getItem('id_clinic'))
  await fetchBookingGenreList()

  if (route?.query?.view == 'per-3days') {
    tab.value = '3日間'
  } else if (route?.query?.view == 'per-doctor') {
    tab.value = '不在'
  } else if (route?.query?.view == 'monthly') {
    tab.value = '月間'
  } else if (route?.query?.view == 'per-1day') {
    tab.value = '1日'
  } else {
    tab.value = '不在'
  }

  // set page title
  setPageTitle('カレンダー')
})
</script>
<template>
  <div class="header">
    <MtHeader :noScroll="true">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 col-2">
          {{ getDateByFormat(selectedDate, 'YYYY年MM月') }}
        </q-toolbar-title>
        <div class="flex justify-between items-center full-width">
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
            stretch
            narrow-indicator
            class="availability-tabs"
            content-class="tab-content"
          >
            <q-tab name="月間" label="月間" class="custom-tab" />
            <q-tab name="3日間" label="3日間" class="custom-tab" />
            <q-tab name="1日" label="1日" class="custom-tab" />
            <q-tab name="不在" label="先生" class="custom-tab" />
          </q-tabs>
          <div style="width: 180px">
            <MtFormPullDown
              type="selection"
              label="予約区分"
              outlined
              v-model:selected="booking_genre"
              :options="bookingGenreList"
              @update:model-value="updateBookingGenre"
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
            class="text-blue text-underline cursor-pointer"
            @click="openScheduleModal"
          >
            院内予定
          </div>
          <div
            class="text-blue text-underline cursor-pointer"
            @click="openRequestModal"
          >
            予定リクエスト
          </div>
          <div class="flex justify-between">
            <q-btn
              @click="onChangeDate('prev')"
              padding="2px"
              flat
              unelevated
              icon="chevron_left"
              style="border: 1px solid #9e9e9e"
            />
            <MtFormInputDate
              v-if="tab != '月間'"
              v-model:date="selectedDate"
              outlined
              type="date"
              class="search-field q-mx-xs"
              @update:date="onChangeDate('selected')"
            />
            <MtInputForm
              v-else
              outlined
              class="search-field q-mx-xs"
              type="text"
              v-model="selectedMonthLabel"
              iconAppend="calendar_month"
              readonly
            />
            <q-btn
              @click="onChangeDate('next')"
              padding="2px"
              flat
              unelevated
              icon="chevron_right"
              style="border: 1px solid #9e9e9e"
            />
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
  </div>
  <div class="q-px-md">
    <div class="column q-my-xs">
      <div class="year_mmonth large-title bold text-grey-900"></div>
      <div class="body1 text-be0223 flex items-center q-mt-sm">
        <q-icon size="16px" name="error" /> 未確定の予定が {{ 'XX' }}  件あります。
      </div>
    </div>
    <div class="col-12">
      <q-tab-panels v-model="tab">
        <q-tab-panel name="月間" class="q-pt-none q-px-xs">
          <ViewScheduleMonthly
            :selectedMonth="selectedMonth"
            :bookingRequests="getCalendarList"
            :typeBookingGenre="booking_genre"
            :isLoading="isLoading"
          />
        </q-tab-panel>
        <q-tab-panel name="3日間" class="q-pt-none q-px-xs">
          <ViewScheduleThreeDays
            :selectedDate="selectedDate"
            :bookingRequests="getCalendarList"
            :typeBookingGenre="booking_genre"
            :key="viewScheduleThreeDaysKey"
            :isLoading="isLoading"
          />
        </q-tab-panel>
        <q-tab-panel name="不在" class="q-pt-none q-px-xs">
          <ViewScheduleDoctorAvailability
            :selectedDate="selectedDate"
            :bookingRequests="getCalendarList"
            :typeBookingGenre="booking_genre"
            :isLoading="isLoading"
          />
        </q-tab-panel>
        <q-tab-panel name="1日" class="q-py-none q-px-xs">
          <ViewScheduleOneDay
            :key="viewScheduleOneDayKey"
            :selectedDate="selectedDate"
            :bookingRequests="getCalendarList"
            :typeBookingGenre="booking_genre"
            :isLoading="isLoading"
            :selectedClinic="selected_clinic"
            @changeDate="onChangeDate"
            @updateOneDayView="updateOneDayView"
          />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 2;
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
