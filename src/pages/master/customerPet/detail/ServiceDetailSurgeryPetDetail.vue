<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent, computed } from 'vue'
import { storeToRefs } from 'pinia'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import { dateFormat, formatDate, getDateToday, groupByDateRange } from '@/utils/aahUtils'
import { date } from 'quasar'
import { orderBy } from 'lodash'

import selectOptions from '@/utils/selectOptions'
import { ClinicalFile, InjectDetailType, MemoCarteType, PrescriptionDetailType, RequestDetailPageType, ServiceDetailType } from '@/types/types'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MemoCarteGrouped from '@/pages/request/detail/MemoCarteGrouped.vue'
import { event_bus } from '@/utils/eventBus'
import fileLogo from '@/assets/img/clinicalFiles/file.png'
import UpdateClinicalFileModal from '@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue'
import ServiceDetailLargePocketList from '@/components/PocketList/largePocket/ServiceDetailLargePocketList.vue'

type SurgeryListType = {
  inject_detail_list: InjectDetailType[]
  memo_carte_list: MemoCarteType[]
  service_detail_list: ServiceDetailType[]
  prescription_detail_list: PrescriptionDetailType[]
}

// lazy loaded component
const UpdateMemoCarteModal = defineAsyncComponent(() => import('@/pages/memoCarte/UpdateMemoCarteModal.vue'))
const ServiceDetailPocketList = defineAsyncComponent(() => import('@/components/PocketList/ServiceDetailPocketListGrid.vue'))
const PrescriptionDetailPocketList = defineAsyncComponent(() => import('@/components/PocketList/PrescriptionDetailPocketList.vue'))
const InjectDetailPocketList = defineAsyncComponent(() => import('@/components/PocketList/InjectDetailPocketList.vue'))

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

const serviceDetailSurgeryList = ref<SurgeryListType>()
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

const onClickFileClinic = async (data: Object, i: Number, date_insert: string) => {
  const video = document.getElementById(`cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  await mtUtils.popup(UpdateClinicalFileModal, {
    data,
    allData: serviceDetailSurgeryList.value?.carte_list?.[date_insert]?.clinical_file_list
  })
  event_bus.emit('reloadRight', true)
}

const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
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
    `pet_history/${props.id_pet}/surgery_anaesthesia`,
    filterData,
    true
  )

  if (response && response.data) {
    serviceDetailSurgeryList.value = response.data
  }
  
  if (serviceDetailSurgeryList.value) {
    serviceDetailSurgeryList.value.service_detail_list = [
      ...serviceDetailSurgeryList.value.service_detail_list.map((v) => ({...v, sort_date: formatDate(v.datetime_service_start)})),
      ...serviceDetailSurgeryList.value.prescription_detail_list.map((v) => ({...v, sort_date: formatDate(v.date_start)})),
      ...serviceDetailSurgeryList.value.inject_detail_list.map((v) => ({...v, sort_date: formatDate(v.date_start)})),
    ]
    serviceDetailSurgeryList.value.service_detail_list = orderBy(serviceDetailSurgeryList.value.service_detail_list, 'sort_date', 'desc')

    const unorderedCartes = serviceDetailSurgeryList.value.carte_list.reduce((acc, item) => {
      const dateInsert = dateFormat(item.datetime_insert)
      const dateTimeInsert = item.datetime_insert
      if (!acc[dateInsert]) {
        acc[dateInsert] = {
          clinical_file_list: [],
          others: {}
        }
      }
      if (!acc[dateInsert].others[dateTimeInsert]) {
        acc[dateInsert].others[dateTimeInsert] = {
          grouped_cartes: false,
          date_insert: dateInsert,
          memo_carte_list: [],
          lab_result_list: {},
          medical_condition: [],
          pet_bio: {},
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
            acc[dateInsert].others[dateTimeInsert].memo_carte_list.push(item.memo_carte)
          }
        } else {
          acc[dateInsert].others[dateTimeInsert].memo_carte_list.push(item.memo_carte)
        }

        if (item.memo_carte.memo_other && (item.memo_carte?.memo_sbj || item?.memo_carte?.memo_ass || item?.memo_carte?.memo_obj)) {
          acc[dateInsert].others[dateTimeInsert].grouped_cartes = true
        }
      }

      if (item.clinical_file) {
        if (
          !acc[dateInsert]?.clinical_file_list.find(
            (v: ClinicalFile) =>
              v.id_clinical_file == item.clinical_file.id_clinical_file
          )
        )
          acc[dateInsert]?.clinical_file_list.push(item.clinical_file)
      }

      if (item.pet_bio) {
        acc[dateInsert].others[dateTimeInsert].pet_bio = item.pet_bio
      }

      if (item.medical_condition) {
        acc[dateInsert].others[dateTimeInsert].medical_condition.push(item.medical_condition)
      }

      if ((acc[dateInsert].others[dateTimeInsert].memo_carte_list.length > 0 && (
        acc[dateInsert].others[dateTimeInsert].pet_bio?.id_pet_bio_info ||
        acc[dateInsert].others[dateTimeInsert].medical_condition.length > 0
      )) || item.type_carte == 2) {
        acc[dateInsert].others[dateTimeInsert].grouped_cartes = true
      }

      return acc
    }, {})

    if (serviceDetailSurgeryList.value.memo_carte_list.length > 0) {
      serviceDetailSurgeryList.value?.memo_carte_list.forEach(item => {
        const dateInsert = dateFormat(item.datetime_insert)
        if (!unorderedCartes[dateInsert]) unorderedCartes[dateInsert] = { others: {} }
        if (!unorderedCartes[dateInsert].others[item.datetime_insert]) {
          unorderedCartes[dateInsert].others[item.datetime_insert] = {
            memo_carte_list: []
          }
        }
        if (!unorderedCartes[dateInsert].others[item.datetime_insert].memo_carte_list.find(v => v.id_memo_carte == item.id_memo_carte)) {
          unorderedCartes[dateInsert].others[item.datetime_insert].memo_carte_list.push(item)
        }
      })
    }
    serviceDetailSurgeryList.value.carte_list = Object.fromEntries(
      Object.entries(unorderedCartes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
    );
  }
}

const groupedServiceDetails = computed(() => {
  return groupByDateRange(
    serviceDetailSurgeryList.value.service_detail_list,
    'datetime_service_start', 
    'datetime_service_end'
  )
})

onMounted(async () => {
  await fetchMoreData(false)
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
                serviceDetailSurgeryList &&
                serviceDetailSurgeryList.service_detail_list?.length > 0
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

            <div
              v-if="
                serviceDetailSurgeryList &&
                serviceDetailSurgeryList.carte_list
              "
              class="q-pa-md flex column gap-4"
            >
              <div v-if="serviceDetailSurgeryList && serviceDetailSurgeryList.carte_list">
                <div v-for="(date_insert, index) in Object.keys(serviceDetailSurgeryList.carte_list)" :key="`section-${index}`" class="q-mb-md">
                  <template v-if="serviceDetailSurgeryList.carte_list[date_insert]" v-for="dt_insert in Object.keys(serviceDetailSurgeryList.carte_list[date_insert].others)">
                    <MemoCarteGrouped
                      :data="serviceDetailSurgeryList.carte_list[date_insert].others[dt_insert]"
                      :date="dt_insert"
                      :id_customer="props.id_customer"
                      :id_pet="props.id_pet"
                      @on-close-modal="fetchMoreData"
                    />
                  </template>

                  <div v-if="serviceDetailSurgeryList.carte_list[date_insert]?.clinical_file_list && serviceDetailSurgeryList.carte_list[date_insert]?.clinical_file_list.length > 0" class="q-mb-md row c-gap">
                    <div v-for="(files, i) in serviceDetailSurgeryList.carte_list[date_insert]?.clinical_file_list"
                        @click="onClickFileClinic(files, i, dateFormat(date_insert))"
                        :key="i" class="col-auto image-container cursor-pointer">
                      <img v-if="files.type_file == 1 || files.type_file == 3"
                          :src="files.thumbnail_path ? files.thumbnail_path : fileLogo" class="thumbnail-style flex column-sm"
                          @error="replaceByDefaultImg" />
                      <video v-else-if="files.type_file == 2"
                        :id="`cli_file_video_${i}`"
                        class="thumbnail-style"
                        style="width: 169px;"
                        controls
                      >
                        <source :src="files.file_path" type="video/mp4">
                      </video>
                      <img v-else-if="files.file_path?.includes('.pdf')"
                          :src="files.thumbnail_path ? files.thumbnail_path : fileLogo" class="xy thumbnail-style" />
                      <img v-else-if="files.file_path?.includes('.mp3') || files.file_path?.includes('.wav')"
                          :src="'/src/assets/img/clinicalFiles/audio.png'" class="xy thumbnail-style" />
                      <img v-else :src="fileLogo" class="xy thumbnail-style" />
                      <div class="date-overlay">
                        {{ formatDate(files.datetime_receive) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p v-else class="q-pt-md q-pl-md text-grey-500">登録がありません。</p>

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
