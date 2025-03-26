<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent, computed } from 'vue'
import { storeToRefs } from 'pinia'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import { dateFormat, formatDate, getDateToday, groupByDateRange } from '@/utils/aahUtils'
import { date } from 'quasar'

import selectOptions from '@/utils/selectOptions'
import { InjectDetailType, MemoCarteType, PrescriptionDetailType, RequestDetailPageType, ServiceDetailType } from '@/types/types'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { orderBy } from 'lodash'
import MemoCarteGrouped from '@/pages/request/detail/MemoCarteGrouped.vue'
import ServiceDetailLargePocketList from '@/components/PocketList/largePocket/ServiceDetailLargePocketList.vue'

type HospitalizationListType = {
  inject_detail_list: InjectDetailType[]
  memo_carte_list: MemoCarteType[]
  service_detail_list: ServiceDetailType[]
  prescription_detail_list: PrescriptionDetailType[]
}

// lazy loaded component
const UpdateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMemoCarteModal.vue')
)
const InjectDetailPocketList = defineAsyncComponent(
  () => import('@/components/PocketList/InjectDetailPocketList.vue')
)
const PrescriptionDetailPocketList = defineAsyncComponent(
  () => import('@/components/PocketList/PrescriptionDetailPocketList.vue')
)

const props = withDefaults(
  defineProps<{
    id_customer: string
    id_pet: string
    requestDetailPage?: RequestDetailPageType
  }>(),
  {
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    }
  }
)

const customerStore = useCustomerStore()
const { getPet } = storeToRefs(customerStore)

const hospitalizationList = ref<HospitalizationListType>()
const nextPage = ref(null)

const yearPeriod = ref('1')

const filterYearPeriod = async () => {
  await fetchMoreData()
}

const filter = async () => {
  let startDate, endDate, currentDate
  if (yearPeriod.value === '1') {
    // set start date as first date of current year, end date as today
    endDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(endDate), {
        year: new Date(endDate).getFullYear(),
        month: 1,
        day: 1
      })
    )
  } else if (yearPeriod.value === '2') {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(currentDate), {
        year: new Date(currentDate).getFullYear() - 1,
        month: 1,
        day: 1
      })
    )
    endDate = dateFormat(
      date.adjustDate(new Date(currentDate), {
        year: new Date(currentDate).getFullYear() - 1,
        month: 12,
        day: 31
      })
    )
  }
  let filters = {}
  if (startDate && endDate)
    Object.assign(filters, { date_start: startDate, date_end: endDate })

  return filters
}

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `pet_history/${props.id_pet}/hospitalization`,
    filterData,
    true
  )

  if (response && response.data) {
    hospitalizationList.value = response.data
  }

  if (hospitalizationList.value) {
    hospitalizationList.value.service_detail_list = [
      ...hospitalizationList.value.service_detail_list.map((v) => ({...v, sort_date: formatDate(v.datetime_service_start)})),
      ...hospitalizationList.value.prescription_detail_list.map((v) => ({...v, sort_date: formatDate(v.date_start)})),
      ...hospitalizationList.value.inject_detail_list.map((v) => ({...v, sort_date: formatDate(v.date_start)})),
    ]
    hospitalizationList.value.service_detail_list = orderBy(hospitalizationList.value.service_detail_list, 'sort_date', 'desc')

    const unorderedCartes = hospitalizationList.value.carte_list.reduce((acc, item) => {
        const dateInsert = dateFormat(item.datetime_insert)
        if (!acc[dateInsert]) {
          acc[dateInsert] = {
            grouped_cartes: false,
            memo_carte_list: [],
            medical_condition: [],
            pet_bio: {}
          }
        }

        if (item.memo_carte) {
          if (filterData && filterData.memo_other) {
            const temp_memo =
              item.memo_carte?.memo_obj +
              item.memo_carte?.memo_sbj +
              item.memo_carte?.memo_ass +
              item?.memo_carte?.memo_other +
              item.memo_carte?.pet_illness_history_list.reduce((v, illness) => {
                return (
                  v +
                  `${illness?.name_disease ? illness.name_disease : ''} ${
                    illness?.name_disease_free ? illness.name_disease_free : ''
                  }`
                )
              }, '')

            filterData?.memo_other.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

            const terms = filterData.memo_other
              .split(',')
              .map((term) => term.trim())
            const regexPattern = `(${terms.join('|')})`
            const regex = new RegExp(regexPattern, 'gi')

            if (temp_memo.search(regex) !== -1) {
              acc[dateInsert].memo_carte_list.push(item.memo_carte)
            }
          } else {
            acc[dateInsert].memo_carte_list.push(item.memo_carte)
          }

          if (item.memo_carte.memo_other && (item.memo_carte?.memo_sbj || item?.memo_carte?.memo_ass || item?.memo_carte?.memo_obj)) {
            acc[dateInsert].grouped_cartes = true
          }
        }

        if (item.pet_bio) {
          acc[dateInsert].pet_bio = item.pet_bio
        }

        if (item.medical_condition) {
          acc[dateInsert].medical_condition.push(item.medical_condition)
        }

        if ((acc[dateInsert].memo_carte_list.length > 0 && (
          acc[dateInsert].pet_bio?.id_pet_bio_info ||
          acc[dateInsert].medical_condition.length > 0
        )) || item.type_carte == 2) {
          acc[dateInsert].grouped_cartes = true
        }

        return acc
      }, {})

      if (hospitalizationList.value.memo_carte_list.length > 0) {
        hospitalizationList.value?.memo_carte_list.forEach(item => {
          const dateInsert = dateFormat(item.datetime_insert)
          if (!unorderedCartes[dateInsert]) {
            unorderedCartes[dateInsert] = {
              memo_carte_list: []
            }
          }
          if (!unorderedCartes[dateInsert].memo_carte_list.find(v => v.id_memo_carte == item.id_memo_carte)) {
            unorderedCartes[dateInsert].memo_carte_list.push(item)
          }
        })
      }
      hospitalizationList.value.carte_list = Object.fromEntries(
        Object.entries(unorderedCartes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
      );
  }
}

onMounted(async () => {
  await fetchMoreData(false)
})

const groupedServiceDetails = computed(() => {
  return groupByDateRange(
    hospitalizationList.value?.service_detail_list,
    'datetime_service_start',
    'datetime_service_end'
  )
})

</script>

<template>
  <div class="separate-scrollbar" style="position: relative;contain: strict;">
    <div class="absolute">
      <div class="flex justify-end full-width q-pr-lg z-top bg-white fixed-top q-px-md">
        <div>
          <MtFormRadiobtn
            v-model="yearPeriod"
            label="今年"
            val="1"
            @update:selected="filterYearPeriod"
          />
          <MtFormRadiobtn
            v-model="yearPeriod"
            label="去年"
            val="2"
            @update:selected="filterYearPeriod"
          />
          <MtFormRadiobtn
            v-model="yearPeriod"
            label="全期間"
            val="3"
            @update:selected="filterYearPeriod"
          />
        </div>
      </div>
    </div>
    <div class="q-pt-xl q-bt">
      <div class="row q-col-gutter-md">
        <div class="col-6">
          <q-scroll-area class="content-full">

            <q-expansion-item
              v-if="
                hospitalizationList &&
                hospitalizationList.service_detail_list?.length > 0
              "
              label="対応歴"
              default-opened
              dense
              expand-icon-class="text-white"
              header-class="bg-grey-800 text-white header-label"
            >
              <div class="q-mt-sm">
                <template v-for="(group, date) in groupedServiceDetails" :key="date">
                  <div class="caption1 regular divider q-mt-md q-ml-sm">
                    <span class="text-weight-bold q-ml-sm">{{ date }}</span>
                  </div>
                  <div class="row q-col-gutter-sm q-px-sm">
                    <div 
                      class="col-lg-4 col-md-4 col-sm-6 col-xs-12"
                      v-for="(data, idx) in group"
                      :key="idx"
                    >
                      <ServiceDetailLargePocketList
                        v-if="data.id_service_detail"
                        :copy-icon="false"
                        :data="data"
                        :petSelected="getPet"
                        :request="requestDetailPage"
                        parentId="shampoo-detail-section"
                      />
                      <PrescriptionDetailPocketList
                        v-else-if="data.id_prescription_detail"
                        :data="data"
                        :prescription="data.id_prescription"
                      />
                      <InjectDetailPocketList
                        v-else-if="data.id_inject_detail"
                        :data="data"
                        :inject="data.id_inject"
                      />
                    </div>
                  </div>
                </template>
              </div>
            </q-expansion-item>

          </q-scroll-area>
        </div>
        <div class="col-6">
          <q-scroll-area class="content-full">

            <div class="q-pa-md flex column gap-4">
              <div
                v-if="
                  hospitalizationList &&
                  hospitalizationList.carte_list
                "
              >
                <template v-if="hospitalizationList.carte_list" v-for="dt_insert in Object.keys(hospitalizationList.carte_list)">
                  <MemoCarteGrouped
                    :data="hospitalizationList.carte_list[dt_insert]"
                    :date="dt_insert"
                    :id_customer="props.id_customer"
                    :id_pet="props.id_pet"
                    @on-close-modal="fetchMoreData"
                  />
                </template>
              </div>
              <p v-else class="q-pt-md q-pl-md text-grey-500">登録がありません。</p>
            </div>

          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
:deep(.q-expansion-item) {
  scroll-margin-top: 3rem;
}
.memo-title {
  padding: 10px 15px;
  border-radius: 10px;
  line-height: 1.7;
  max-width: 100%;
}

.divider {
  border-bottom: 1px solid $grey-3;
  padding-bottom: 8px;
  margin-bottom: 16px;
}
</style>
