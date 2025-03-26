<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { typePreventionV1 } from '@/utils/enum'
import { QTableColumn } from 'quasar'
import _ from 'lodash'

dayjs.extend(isBetween)

const SVG_ICONS = {
  FILLED_CIRCLE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
  DASHED_CIRCLE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.1 2.182a10 10 0 0 1 3.8 0"/><path d="M13.9 21.818a10 10 0 0 1-3.8 0"/><path d="M17.609 3.721a10 10 0 0 1 2.69 2.7"/><path d="M2.182 13.9a10 10 0 0 1 0-3.8"/><path d="M20.279 17.609a10 10 0 0 1-2.7 2.69"/><path d="M21.818 10.1a10 10 0 0 1 0 3.8"/><path d="M3.721 6.391a10 10 0 0 1 2.7-2.69"/><path d="M6.391 20.279a10 10 0 0 1-2.69-2.7"/></svg>`,
  STACKED_CIRCLE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
    <circle cx="13" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="11" cy="12" r="10" fill="currentColor"/>
  </svg>`
}

const props = defineProps<{
  data: Array<any>
}>()

const emit = defineEmits<{
  (e: 'clickService', service: any): void
}>()

const columns: QTableColumn[] = [
  {
    name: 'prevention',
    field: 'prevention',
    label: '',
    align: 'left'
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    name: String(i + 1),
    field: String(i + 1),
    label: String(i + 1),
    align: 'center' as const
  }))
]

const YEAR_BACKWARD_OFFSET = 100
const YEAR_FORWARD_OFFSET = 10

const months = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))

const currentYearIndex = ref(YEAR_FORWARD_OFFSET)

const selectedYear = computed(() => years.value[currentYearIndex.value])

const changeYear = (direction: 'prev' | 'next' | 'reset') => {
  if (direction === 'prev' && currentYearIndex.value < years.value.length - 1) {
    currentYearIndex.value++
  } else if (direction === 'next' && currentYearIndex.value > 0) {
    currentYearIndex.value--
  } else {
    currentYearIndex.value = YEAR_FORWARD_OFFSET
  }
}

const years = computed(() => {
  const currentYear = dayjs().year()
  return Array.from(
    { length: YEAR_BACKWARD_OFFSET + YEAR_FORWARD_OFFSET },
    (_, index) => currentYear + YEAR_FORWARD_OFFSET - index
  )
})

const rows = computed(() => {
  const dataRows = typePreventionV1
    .map((prevention) => {
      // Handle combined entry for Flea and Tick (2 + 4 = 6)
      if (prevention.value === 2) {
        return {
          prevention: {
            prevention: 6, // Combined value for Flea and Tick
            conditions: [2, 4, 6],
            label: 'ノミ・ダニ',
            services: filteredDataByYear.value.filter(
              (row) =>
                row.type_prevention === 2 ||
                row.type_prevention === 4 ||
                row.type_prevention === 6
            )
          },
          ...Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [i + 1, 0])
          )
        }
      }

      // Skip entry for value 4 (Tick) to avoid duplicate
      if (prevention.value === 4 || prevention.value === 6) {
        return null
      }

      // Handle other entries
      return {
        prevention: {
          prevention: prevention.value,
          conditions: [prevention.value],
          label: prevention.label,
          services: filteredDataByYear.value.filter(
            (row) => row.type_prevention === prevention.value
          )
        },
        ...Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, 0]))
      }
    })
    .filter(Boolean) // Remove null entries
  console.log(dataRows)
  return dataRows
})

const filteredDataByYear = computed(() => {
  // Helper function to safely format date to YYYY-MM-DD or return null
  const formatDate = (date: string | null | undefined): string | null => {
    if (!date) return null
    const parsed = dayjs(date)
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : null
  }
  const filteredData = _.uniqWith(
    props.data.filter((row) => {
      const serviceDate = row.datetime_service_start ?? row.date_start
      if (!serviceDate) return false
      const year = dayjs(serviceDate).year()

      // For previous year, only include if there's a confirmed booking
      if (year === selectedYear.value - 1) {
        return row.booking?.datetime_booking_confirmed != null
      }

      // For current year, include all records

      return year === selectedYear.value
    }),
    (a, b) => {
      // Format both types of dates to YYYY-MM-DD for comparison
      const aServiceDate = formatDate(a.datetime_service_start)
      const aStartDate = formatDate(a.date_start)
      const bServiceDate = formatDate(b.datetime_service_start)
      const bStartDate = formatDate(b.date_start)

      return !!(
        a.type_prevention === b.type_prevention &&
        a.id_item_service_unit === b.id_item_service_unit &&
        // Case 1: Both records have datetime_service_start and they match
        ((aServiceDate && bServiceDate && aServiceDate === bServiceDate) ||
          // Case 2: Both records have date_start and they match
          (aStartDate && bStartDate && aStartDate === bStartDate) ||
          // Case 3: Compare datetime_service_start with date_start
          (aServiceDate && bStartDate && aServiceDate === bStartDate) ||
          // Case 4: Compare date_start with datetime_service_start
          (aStartDate && bServiceDate && aStartDate === bServiceDate))
      )
    }
  )
  return filteredData
})

const isEquivalentMonth = (service: any, month: number, key: string) => {
  const value = _.get(service, key)
  if (!value) return false
  const serviceMonth = dayjs(value).month() + 1
  return serviceMonth === month
}

const isEquivalentYear = (service: any, year: number, key: string) => {
  const value = _.get(service, key)
  if (!value) return false
  const serviceYear = dayjs(value).year()
  return serviceYear === year
}

const isWithinDateRange = (
  service: any,
  month: number,
  year: number
): boolean => {
  const startDate = service.datetime_service_start ?? service.date_start
  const endDate = service.datetime_service_end ?? service.date_end

  if (!startDate) return false

  const targetDate = dayjs(`${year}-${month}-01`)
  const start = dayjs(startDate).startOf('month')
  const end = endDate ? dayjs(endDate).endOf('month') : start.endOf('month')

  return targetDate.isBetween(start, end, 'month', '[]')
}

const getServiceStatusSymbol = (
  service: any,
  month: number,
  year: number,
  returnKey?: boolean
): string | keyof typeof SVG_ICONS => {
  const hasServiceStart = isWithinDateRange(service, month, year)

  const hasBookingConfirmed =
    isEquivalentMonth(service, month, 'booking.datetime_booking_confirmed') &&
    isEquivalentYear(service, year, 'booking.datetime_booking_confirmed')

  if (hasServiceStart && hasBookingConfirmed) {
    return returnKey ? 'STACKED_CIRCLE' : SVG_ICONS.STACKED_CIRCLE
  } else if (hasServiceStart) {
    return returnKey ? 'FILLED_CIRCLE' : SVG_ICONS.FILLED_CIRCLE
  } else if (hasBookingConfirmed) {
    return returnKey ? 'DASHED_CIRCLE' : SVG_ICONS.DASHED_CIRCLE
  }
  return returnKey ? '' : ''
}

const handleClickService = (service: any) => {
  emit('clickService', service)
}

const hoveredServiceNumber = ref<string | null>(null)

const isServiceHovered = (serviceNumber: string) => {
  return hoveredServiceNumber.value === serviceNumber
}

const getServiceTooltipContent = (
  service: any,
  symbolKey: string | keyof typeof SVG_ICONS
) => {
  const startDateOrServiceStart =
    service.datetime_service_start ?? service.date_start
  const endDateOrServiceEnd = service.datetime_service_end ?? service.date_end
  const nextBooking = service.booking?.datetime_booking_confirmed
  const isBooking = symbolKey == 'DASHED_CIRCLE'
  const startDate = startDateOrServiceStart
    ? `${dayjs(startDateOrServiceStart).format('YYYY/MM/DD')}`
    : ''

  const endDate = isBooking
    ? dayjs(nextBooking).format('YYYY/MM/DD')
    : dayjs(endDateOrServiceEnd).format('YYYY/MM/DD')

  return (symbolKey = isBooking
    ? `${service.name_item_service ?? service.name_inject_display}(${endDate})`
    : `${
        service.name_item_service ?? service.name_inject_display
      } (${startDate}-${endDate})`)
}
</script>

<template>
  <q-table
    flat
    square
    :rows="rows"
    :columns="columns"
    row-key="name"
    :pagination="{ rowsPerPage: 0 }"
    hide-pagination
  >
    <template v-slot:header-cell-prevention>
      <q-th>
        <q-item>
          <q-item-section>
            <div class="row items-center">
              <q-btn
                flat
                dense
                icon="chevron_left"
                @click="changeYear('prev')"
                :disable="currentYearIndex === years.length - 1"
              />
              <div class="q-mx-sm cursor-pointer" @click="changeYear('reset')">
                {{ selectedYear }}
              </div>
              <q-btn
                flat
                dense
                icon="chevron_right"
                @click="changeYear('next')"
                :disable="currentYearIndex === 0"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-th>
    </template>
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="prevention" :props="props">
          <div class="q-px-md">
            {{ props.row.prevention.label }}
          </div>
        </q-td>
        <q-td
          v-for="month in months"
          :key="month"
          :props="props"
          class="text-center"
        >
          <div class="col full-width full-height">
            <div
              class="full-height"
              style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              "
            >
              <div
                v-for="service in props.row.prevention.services"
                style="min-height: 23px; display: flex"
                :key="service.number_service_detail ?? service.id_inject_detail"
                :class="{
                  'hovered-service': isServiceHovered(
                    service.number_service_detail ?? service.id_inject_detail
                  )
                }"
              >
                <q-tooltip
                  class="bg-primary q-pa-sm text-white"
                  anchor="top middle"
                  :offset="[0, 40]"
                  v-if="
                    getServiceStatusSymbol(service, month, selectedYear) !== ''
                  "
                >
                  {{
                    getServiceTooltipContent(
                      service,
                      getServiceStatusSymbol(service, month, selectedYear, true)
                    )
                  }}
                </q-tooltip>
                <span
                  class="cursor-pointer"
                  @click="handleClickService(service)"
                  @mouseenter="
                    hoveredServiceNumber =
                      service.number_service_detail ?? service.id_inject_detail
                  "
                  @mouseleave="hoveredServiceNumber = null"
                  v-html="getServiceStatusSymbol(service, month, selectedYear)"
                >
                </span>
              </div>
            </div>
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<style lang="scss" scoped>
.q-table {
  th,
  td {
    padding: 4px;
  }
}

.row {
  justify-content: center;
}

.hovered-service {
  color: #1976d2;
  transition: all 0.2s ease;

  :deep(svg) {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
}
</style>
