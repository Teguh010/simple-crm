<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { getDateByFormat, getDaysAfterDate, getDaysInMonth } from '@/utils/aahUtils'
import useBusinessCalendarDayStore, { BusinessCalendarDay } from '@/stores/business-calendar-days'
import useDoctorAvailabilityStore, { DoctorAvailability } from '@/stores/doctor-availabilities'
import { storeToRefs } from 'pinia'
import _, { Dictionary, flatten } from 'lodash'
import useEmployeeStore from '@/stores/employees'
import { typeBusinessDay } from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import useClinicStore from '@/stores/clinics'
import dayjs from '@/boot/dayjs'
import { Dayjs } from 'dayjs'
import { BusinessHourSlot } from '@/stores/business-hour-slots'

const selectedDate = ref(dayjs().startOf('month'))
const selectedMonthLabel = ref('今月')
const selectedMonth = ref(dayjs().format('YYYY/MM'))
const isLoading = ref(false)
const doctorAvailabilityStore = useDoctorAvailabilityStore()
const businessCalendarDayStore = useBusinessCalendarDayStore()
const employeeStore = useEmployeeStore()
const { getCalendarList } = storeToRefs(businessCalendarDayStore)
const { getDoctorAvailabilities } = storeToRefs(doctorAvailabilityStore)
const editMode = ref(false)
const displayMode = ref<'slot'|'day'>('slot')
const availabilityDoctorData: any = ref([])
const availabilityDoctorDataPerSlot: any = ref([])

interface DoctorAvailabilityMap {
  checked: boolean
  id_doctor_availability: number | null
}

const sortedDoctors = computed(() => 
  _.filter(employeeStore.getEmployees, (emp) => emp.flg_calendar).sort((a, b) => a.display_order - b.display_order)
)

const doctorWidth = computed(() => {
  const numberColumnWidth = 100
  const timeSlotColumnWidth = window.innerWidth * 0.2211
  const totalRemainingWidth = 100 - (numberColumnWidth / window.innerWidth * 100) - 22
  return sortedDoctors.value.length ? (totalRemainingWidth / sortedDoctors.value.length) : 0
})

const changeDate = async (prefix: 'next' | 'prev') => {
  if(prefix === 'next') {
    selectedDate.value = selectedDate.value.add(1, 'month')
  } else {
    selectedDate.value = selectedDate.value.subtract(1, 'month')
  }
  selectedMonth.value = selectedDate.value.format('YYYY/MM')
  selectedMonthLabel.value = selectedDate.value.format('YYYY年MM月')
  await init()
}

const init = async () => {
  isLoading.value = true
  const dateStart = selectedDate.value.format('YYYY/MM/DD')
  const dateEnd = selectedDate.value.add(1, 'month').format('YYYY/MM/DD')
  
  await doctorAvailabilityStore.fetchDoctorAvailabilities({
    date_start: dateStart,
    date_end: dateEnd,
    no_pagination: true,
  })

  await businessCalendarDayStore.fetchCalendarList({
    date_start: getDateByFormat(selectedMonth.value, 'YYYY/MM/DD'),
    date_end: getDaysAfterDate(
      getDateByFormat(selectedMonth.value, 'YYYY/MM/DD'),
      getDaysInMonth(getDateByFormat(selectedMonth.value, 'YYYY/MM/DD')) - 1
    )
  })
  
  buildHeader()
  
  isLoading.value = false
}
const typeBusinessDayName = (value: any) =>
  typeBusinessDay.find((v) => v.value === value)

const buildData = (newDate: string) => {
  const calendarEventDay = getCalendarList.value.find(
    (v: BusinessCalendarDay) =>
      getDateByFormat(v.date, 'YYYY-MM-DD') ===
      getDateByFormat(newDate, 'YYYY-MM-DD')
  )
  
  const doctorAvailability = getDoctorAvailabilities.value.filter(
    v => v.date_business_day === newDate
  )
  
  if(!calendarEventDay) {
    return {
      bhs: null,
      sbd: null,
      availability: { flg_unavailable: false, status: false },
      off_day: true,
      service_detail_list: null,
      prescription_list: null,
      clinic_plan_list: 0
    }
  }
  
  let businessHourSlot
  let specialBusinessDay = calendarEventDay.flg_special_business_day
  if (specialBusinessDay) {
    if(calendarEventDay.special_business_days_data && calendarEventDay.special_business_days_data.length > 0) {
      let businessHourSlotId = calendarEventDay.special_business_days_data[0]?.id_business_hour_slot
      businessHourSlot = calendarEventDay.business_hour_slot.find((v: any) => v.id_business_hour_slot === businessHourSlotId)
    }
  } else {
    businessHourSlot =
      calendarEventDay.business_hour_slot.find((v: any) => v.id_business_hour_slot)
  }
  return {
    bhs: businessHourSlot,
    sbd: specialBusinessDay,
    memo: specialBusinessDay ? calendarEventDay.special_business_days_data[0]?.memo_business_day : null,
    availability: doctorAvailability ?? {
      flg_unavailable: false,
      status: false
    },
    off_day: businessHourSlot?.type_business_day === 90,
    availabilityDataPerSlot: getAvailabilityDataMap(doctorAvailability, businessHourSlot!),
  }
}

const getAvailabilityDataMap = (doctorAvailabilityList: DoctorAvailability[], businessHourSlot?: BusinessHourSlot) => {
  const employeeMap: Dictionary<Dictionary<DoctorAvailabilityMap>> = {}
  sortedDoctors.value.forEach(doctor => {
    if (!employeeMap[doctor.id_employee]) {
      employeeMap[doctor.id_employee] = {}
    }

    const slotKeys = ["time_business_start1", "time_business_start2", "time_business_start3"]

    slotKeys.forEach((slotKey, index) => {
      const slotAvailability = businessHourSlot[slotKey]
      const availability = doctorAvailabilityList.find(
        (availability) =>
          availability.id_employee === doctor.id_employee &&
          availability.type_slot_number === (index+1)
      )
      if (slotAvailability) {
        employeeMap[doctor.id_employee][index+1] = {
          checked: !!availability?.flg_unavailable,
          id_doctor_availability: availability?.id_doctor_availability ?? null
        }
      }
    })
  })

  return employeeMap
}


const prepareDate = (newDate: Dayjs) => {
  let _data = buildData(newDate.format('YYYY/MM/DD'))
  return {
    display_date: newDate.format('MM/DD (ddd)'),
    date: newDate.format('YYYY/MM/DD'),
    day: newDate.day()+1,
    today: dayjs().isSame(newDate),
    _data: _data
  }
}

const headerDates = ref<any>([])

const buildHeader = () => {
  let firstDayDate = dayjs(`${selectedMonth.value}/01`, 'YYYY/MM/DD')
  const lastDayDate = firstDayDate.add(1, 'month')
  let finalArr = []

  while (firstDayDate.isSameOrBefore(lastDayDate)) {
    finalArr.push(prepareDate(firstDayDate))
    firstDayDate = firstDayDate.add(1, 'day')
  }
  
  headerDates.value = finalArr
}

const toggleEditMode = (mode?: 'day' | 'slot') => {
  editMode.value = !editMode.value
  if(mode) {
    displayMode.value = mode
  }
}

const cancelEdit = () => {
  editMode.value = false
  buildHeader()
}

const bulkUpdate = async () => {
  let payload = []
  const availabilityData = headerDates.value.map(day => {
    return Object.entries(day._data?.availabilityDataPerSlot ?? {}).flatMap(([employeeId, slots]) => {
      return Object.entries(slots)
        .filter(([_, employeeAvailability]) => {
          return !(employeeAvailability.id_doctor_availability === null && employeeAvailability.checked === false)
        })
        .map(([slotId, employeeAvailability]) => ({
          date_business_day: day.date,
          type_slot_number: slotId,
          flg_slot_available: null,
          limit_number: null,
          flg_unavailable: !!employeeAvailability?.checked,
          id_employee: employeeId,
          id_employee_insert: null,
          id_employee_update: null,
          id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
          id_doctor_availability: employeeAvailability?.id_doctor_availability ?? undefined,
        }))
    })
  })
  payload = flatten(availabilityData)
  await doctorAvailabilityStore.submitDoctorAvailability(payload)
  await init()
  availabilityDoctorDataPerSlot.value.length = availabilityDoctorData.value.length = 0
  toggleEditMode()
}

const clinicName = ref('')
const fetchClinicName = async () => {
  const id_clinic = localStorage.getItem('id_clinic')
  if (id_clinic) {
    const clinic = await useClinicStore().fetchClinicById(JSON.parse(id_clinic))
    clinicName.value = clinic.name_clinic_display
  } else {
    clinicName.value = ''
  }
}

const getTotalSlots = (slot: any) => {
  let totalSlots: Number = 0
  if (slot?.time_business_start1) ++totalSlots
  if (slot?.time_business_start2) ++totalSlots
  if (slot?.time_business_start3) ++totalSlots
  return totalSlots
}

const isAllSlotChecked = (data: any, idEmployee: number | string) => {
  const values = Object.values(data.availabilityDataPerSlot[idEmployee])
  return values.every(item => item.checked === true)
}

const setAllSlotChecked = (checked: boolean, data: any, idEmployee: number | string) => {
  const values = Object.values(data.availabilityDataPerSlot[idEmployee])
  values.forEach(item => item.checked = checked)
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([fetchClinicName()])
  await init()
})
</script>

<template>
  <MtHeader :noScroll="true">
    <q-toolbar class="text-primary q-pa-none">
      <q-toolbar-title class="title2 bold text-grey-900 col-2">
        診療カレンダー設定</q-toolbar-title
      >
      <div class="flex justify-end items-center align-end col-10">
        <div class="flex justify-end gt-md col-3">
          <q-btn
            @click="changeDate('prev')"
            padding="2px"
            flat
            unelevated
            icon="chevron_left"
            style="border: 1px solid #9e9e9e"
          />

          <MtInputForm
            outlined
            class="search-field q-mx-xs"
            type="text"
            v-model="selectedMonthLabel"
            iconAppend="calendar_month"
            readonly
          />
          <q-btn
            @click="changeDate('next')"
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
  <q-layout container :style="{ height: 'calc(100vh - 70px)' }">
    <q-page-container>
      <q-page>
        <div class="q-pl-xl q-pr-sm">
          <div class="row items-center justify-between q-my-md">
            <div class="text-grey-900 bold title1">{{ clinicName }}</div>
            <div v-if="!editMode">
              <q-btn
                label="時間枠毎設定"
                @click="toggleEditMode('slot')"
                padding="4px 20px"
                flat
                unelevated
                class="bg-grey-100 q-mr-md"
                style="border: 1px solid #9e9e9e"
              />
              <q-btn
                label="終日休みの一括設定"
                @click="toggleEditMode('day')"
                padding="4px 20px"
                flat
                unelevated
                class="bg-grey-100"
                style="border: 1px solid #9e9e9e"
              />
            </div>
            <div v-else class="flex items-center">
              <div class="caption2">{{
                  displayMode === 'day' ? '終日休みを設定する日にチェックを入れてください' : '休みを設定する時間枠にチェックを入れてください'
                }}
              </div>
              <q-btn unelevated color="primary" class="q-ml-md" type="button" @click="bulkUpdate">
                <span>決定</span>
              </q-btn>
              <q-btn outline class="bg-grey-100 text-grey-800 q-ml-sm" @click="cancelEdit">
                <span>キャンセル</span>
              </q-btn>
            </div>
          </div>
          <div class="calendar-view" v-if="!isLoading && getCalendarList?.length">
            <div class="row items-center">
              <div class="col-1 bg-grey-300 q-ba-400 q-pa-sm h-40" style="width: 75px;"></div>
              <div class="col-6 bg-grey-300 text-center q-ba-400 q-pa-sm" style="width: 22.11%;">診療時間枠</div>
              <div class="doctor-wrapper flex">
                <div class="col-1- bg-grey-100 text-center q-ba-400 q-pa-sm doc-name"
                     v-for="(doctor , i) in sortedDoctors" :key="i" :style="{ width: `${doctorWidth}%` }">
                  {{ doctor?.name_display }}
                </div>
              </div>
            </div>
            <div class="row items-center" v-for="(days, i) in headerDates" :key="i"
                 :class="{ 'off_day' : days._data.off_day === true}">
              <div class="q-bb q-br q-bl q-pa-sm q-pt-sm flex items-center caption1 h-95 display_date"
                   :class="{'sat' : days.day == 7}">{{ days.display_date }}
              </div>
              <div class="col-2 flex items-center justify-between q-bb q-br q-pa-sm h-95"
                   :class="{ 'bg-accent-100' : (days._data.off_day === false && days._data?.sbd !== null ) }"
                   style="width: 10%;">
                <div class="flex items-center justify-between">
                  <div class="column">
                    <div class="body1">{{ typeBusinessDayName(days._data?.bhs?.type_business_day)?.label }} /
                      {{ days._data?.bhs?.name_business_hour }}
                    </div>
                    <div class="truncated caption3 text-grey-700">{{ days._data?.sbd ? days._data.memo : '' }}</div>
                  </div>
                </div>
              </div>
              <div class="col-2 column justify-around q-bb h-95 slotTime" style="width: 12%;">
                <div class="flex items-center justify-between caption1 p-5 h-30 timerange"
                     v-if="days._data?.bhs?.time_business_start1">
                  <div class="caption1">時間枠1</div>
                  <div>{{ days._data?.bhs?.time_business_start1?.replace(/:00$/, '') }} ~
                    {{ days._data?.bhs?.time_business_end1?.replace(/:00$/, '') }}
                  </div>
                </div>
                <div class="flex items-center justify-between caption1 p-5 h-30 timerange"
                     v-if="days._data?.bhs?.time_business_start2">
                  <div class="caption1">時間枠2</div>
                  <div>{{ days._data?.bhs.time_business_start2?.replace(/:00$/, '') }} ~
                    {{ days._data?.bhs.time_business_end2?.replace(/:00$/, '') }}
                  </div>
                </div>
                <div class="flex items-center justify-between caption1 p-5 h-30 timerange"
                     v-if="days._data?.bhs?.time_business_start3">
                  <div class="caption1">時間枠3</div>
                  <div>{{ days._data?.bhs.time_business_start3?.replace(/:00$/, '') }} ~
                    {{ days._data?.bhs.time_business_end3?.replace(/:00$/, '') }}
                  </div>
                </div>
              </div>

              <template v-for="(doctor, j) in sortedDoctors" :key="j">
                <div
                  class="col-1 text-center column justify-around q-bb q-br q-bl caption2 h-95 bg-grey-100 availability"
                  :class="{ 'offDay' : (days._data.availability?.flg_unavailable === true) }"
                  :style="{ width: `${doctorWidth}%` }">
                  <template v-if="days._data.off_day === false">
                    <template v-if="!editMode">
                      <template v-if="isAllSlotChecked(days._data, doctor.id_employee)">
                        <div class="text-darkred">休</div>
                      </template>
                      <template v-else>
                        <template v-for="(check, slotNumber) in getTotalSlots(days._data.bhs)" :key="slotNumber">
                          <div class="text-darkred h-30">
                            {{ days._data.availabilityDataPerSlot[doctor.id_employee]?.[slotNumber + 1]?.checked ? '休' : '' }}
                          </div>
                        </template>
                      </template>
                    </template>
                    <template v-else>
                      <div class="flex column justify-center items-center" v-if="displayMode === 'slot'">
                        <template
                          v-for="(employeeAvailability, index) in Object.values(days._data.availabilityDataPerSlot[doctor.id_employee])"
                          :key="`${doctor.id_employee}-${j}-${index}`"
                        >
                          <MtFormCheckBox
                            type="checkbox"
                            label=""
                            :checked="!!(employeeAvailability as DoctorAvailabilityMap)?.checked"
                            class="caption1 q-pa-none"
                            style="padding: 0; border: none;"
                            @update:checked="(newVal) => { (employeeAvailability as DoctorAvailabilityMap).checked = newVal }"
                          />
                        </template>
                      </div>
                      <div v-else>
                        <MtFormCheckBox
                          :key="`${doctor.id_employee}-${j}`"
                          type="checkbox"
                          label=""
                          :checked="isAllSlotChecked(days._data, doctor.id_employee)"
                          class="caption1 q-pa-none"
                          style="padding: 0; border: none;"
                          @update:checked="(newVal) => setAllSlotChecked(newVal, days._data, doctor.id_employee)"
                        />
                      </div>
                    </template>
                  </template>
                  <template v-else>
                    <div class="text-darkred">休</div>
                  </template>
                </div>
              </template>
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
<style lang="scss" scoped>
.doctor-wrapper { 
    display: flex; 
    flex-direction: row;
    width: calc(100% - 75px - 22.11%);
}

.doctor-wrapper .doc-name {
  flex: 1; 
  text-align: center;
}

.availability {
  flex: 1; 
  text-align: center;
}

@media screen and (max-width: 1180px) and (min-width: 820px) {
  .col-2.flex.items-center.justify-between.q-bb.q-br.q-pa-sm.h-95.bg-accent-100 {
    width: 12% !important;
  }

  .col-2.column.justify-around.q-bb.h-95.slotTime {
    width: 16% !important;
  }

  .col-4.bg-grey-300.text-center.q-ba-400.q-pa-sm {
    width: 28.11% !important;
  }
}
.calendar-view {
  .h-40 {
    height: 40px;
  }
  .h-95 {
    height: 95px;
  }
  .h-30 {
    height: 30px;
  }
  .h-45 {
    height: 45px;
  }
  .p-5 {
    padding: 5px;
  }
  .slotTime {
    .timerange {
      padding-bottom: 10px;
      border-bottom: 1px solid #e0e0e0;
      &:nth-last-child(1) {
        border-bottom: none;
      }
    }
  }
  .availability {
    width: 75px;
    div {
      border-bottom: 1px solid #e0e0e0;
      padding: 5px;
      padding-bottom: 10px;
      &:nth-last-child(1) {
        border-bottom: none;
      }
    }
  }
  .truncated {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 1;
    width: 250px !important;
    word-wrap: break-word;
    white-space: normal !important;
    text-align: left;
    @media only screen and (min-width: 1500px) {
      width: 130px !important;
    }
  }
  .off_day {
    div {
      background-color: $grey-400 !important;
    }
    .display_date {
      color: $darkRed;
    }
  }
  .sat {
    color: $blue !important;
  }
  .offDay {
    background-color: $grey-400 !important;
  }
  .doctor-wrapper {
    height: 40px;
    .doc-name {
      width: 75px;
      font-size: 12px;
    }
  }
}
</style>
