<script lang="ts" setup>
import useServiceDetailStore from '@/stores/service-details'
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref, defineAsyncComponent, computed } from 'vue'
import mtUtils from '@/utils/mtUtils'
import { date } from 'quasar'
import useCategoryStore from '@/stores/categories'
import { dateFormat, formatDate, getDateToday, groupByDateRange } from '@/utils/aahUtils'
import usePetStore from '@/stores/pets'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import selectOptions from '@/utils/selectOptions'
import useCustomerStore from '@/stores/customers'
import ServiceDetailPocketList from '@/components/PocketList/ServiceDetailPocketListGrid.vue'
import {
  CartDetailListType,
  ClinicalFile,
  IllnessHistoryType,
  MemoCarteType,
  RequestDetailPageType,
  ServiceDetailType
} from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import { useMemoCarte } from '@/hooks/use-memo-carte'
import { useIllnessHistoryName } from '@/hooks/use-illness-history'
import UpdateClinicalFileModal from '@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue'
import { orderBy } from 'lodash'
import UpdateCartDetailModal from '@/pages/cart/UpdateCartDetailModal.vue'
import MemoCarteGrouped from '@/pages/request/detail/MemoCarteGrouped.vue'
import fileLogo from '@/assets/img/clinicalFiles/file.png'
import { event_bus } from '@/utils/eventBus'
import ServiceDetailLargePocketList from '@/components/PocketList/largePocket/ServiceDetailLargePocketList.vue'

type ShampooExtraListType = {
  memo_carte_list: MemoCarteType[] & ClinicalFile[]
  clinical_file_list: ClinicalFile[]
  illness_history_list: IllnessHistoryType[]
  cart_detail_list: CartDetailListType[]
  service_detail_list: ServiceDetailType[]
}

const UpdateIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue')
)
const UpdateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMemoCarteModal.vue')
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

const yearPeriod = ref('1')

const shampooExtraList = ref<ShampooExtraListType>()
const nextPage = ref(null)

const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
}

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
    allData: shampooExtraList.value?.carte_list?.[date_insert]?.clinical_file_list
  })
  event_bus.emit('reloadRight', true)
}

const onClinicalFileClick = async (data: any, i: Number) => {
  const video = document.getElementById(`pd_cli_file_video_${i}`)
  if (video) {
    setTimeout(() => {
      video.pause()
    }, 500)
  }
  const currentPet = customerStore.getPet
  data.name_pet = currentPet.name_pet
  await mtUtils.mediumPopup(UpdateClinicalFileModal, {
    data: data,
    allData: orderBy(
      shampooExtraList.value?.clinical_file_list,
      'datetime_receive',
      'desc'
    )
  })
  await fetchMoreData()
}

async function fetchMoreData(fetchMore: boolean = true) {
  shampooExtraList.value = {} as ShampooExtraListType
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value
  }

  if (fetchMore) {
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `pet_history/${props.id_pet}/shampoo`,
    filterData,
    true
  )

  if (response && response.data) {
    shampooExtraList.value = response.data
  }

  if (shampooExtraList.value) {
    const unorderedCartes = shampooExtraList.value.carte_list.reduce((acc, item) => {
      if (item.memo_carte || item.pet_bio || item.medical_condition || item.clinical_file) {
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

        shampooExtraList.value?.clinical_file_list?.forEach(clinicalFile => {
          if (!acc[dateFormat(clinicalFile.datetime_insert)]) {
            acc[dateFormat(clinicalFile.datetime_insert)] = {
              clinical_file_list: [], others: {}
            }
            acc[dateFormat(clinicalFile.datetime_insert)]?.clinical_file_list.push(clinicalFile)
          } else if (
            dateFormat(clinicalFile.datetime_insert) == dateInsert &&
            !acc[dateInsert]?.clinical_file_list.find(
              (v: ClinicalFile) =>
                v.id_clinical_file == clinicalFile.id_clinical_file
            )
          ) {
            acc[dateInsert]?.clinical_file_list.push(clinicalFile)
          }
        })

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
      }

      return acc
    }, {})

    if (shampooExtraList.value.memo_carte_list.length > 0) {
      shampooExtraList.value?.memo_carte_list.forEach(item => {
        const dateInsert = dateFormat(item.datetime_insert)
        if (!unorderedCartes[dateInsert]) unorderedCartes[dateInsert] = { clinical_file_list: [], others: {} }
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

    if (shampooExtraList.value.clinical_file_list.length > 0) {
      shampooExtraList.value?.clinical_file_list.forEach(item => {
        const dateInsert = dateFormat(item.datetime_insert)
        if (!unorderedCartes[dateInsert]) unorderedCartes[dateInsert] = { clinical_file_list: [], others: {} }
        if (!unorderedCartes[dateInsert].clinical_file_list.find(v => v.id_clinical_file == item.id_clinical_file)) {
          unorderedCartes[dateInsert].clinical_file_list.push(item)
        }
      })
    }

    shampooExtraList.value.carte_list = Object.fromEntries(
      Object.entries(unorderedCartes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
    );

    shampooExtraList.value.service_detail_list = [
      ...shampooExtraList.value.service_detail_list.map((v) => ({...v, date_insert: formatDate(v.datetime_service_start)})),
      ...shampooExtraList.value.cart_detail_list.map((v) => ({...v, date_insert: formatDate(v.date_order_start)})),
    ]
    shampooExtraList.value.service_detail_list = orderBy(shampooExtraList.value.service_detail_list, 'date_insert', 'desc')
  }
}

const tabList = [
  { value: 'illness_history_and_service_detail', label: '美容歴' },
  { value: 'memo_carte_list', label: '美容カルテ' }
]

const openUpdateIllnessHistoryModal = async (
  id_employee_doctor: string,
  id_pet_illness_history: string
) => {
  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    id_employee_doctor: id_employee_doctor,
    petSelected: getPet.value,
    id_pet_illness_history
  })
  await fetchMoreData()
}

const openMemoCarteModal = async (item: MemoCarteType) => {
  await mtUtils.popup(UpdateMemoCarteModal, {
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    id_memo_carte: item.id_memo_carte,
    id_pet_illness_history: item.id_pet_illness_history,
    data: item,
    datetime_memo_carte: item.datetime_memo_carte
  }, true)
  await fetchMoreData()
}
const openUpdateCartDetailModal = async (cart_data: any) => {
  await mtUtils.mediumPopup(UpdateCartDetailModal, {
    data: cart_data.id_cart,
    cartDetail: cart_data,
    disable: true
  })
  await fetchMoreData()
}

// Add computed property to filter out deleted items
const filteredIllnessHistoryList = computed(() => {
  return shampooExtraList.value?.illness_history_list?.filter(
    item => !item.flg_delete
  ) || []
})

const handleIllnessHistoryDeleted = (deletedId) => {
  if (shampooExtraList.value?.illness_history_list) {
    shampooExtraList.value.illness_history_list = shampooExtraList.value.illness_history_list.filter(
      item => item.id_pet_illness_history !== deletedId
    )
  }
}

const groupedServiceDetails = computed(() => {
  return groupByDateRange(
    shampooExtraList.value.service_detail_list,
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
      <div class="ah-adjust-for-thumb-scroller flex justify-end full-width q-pr-lg z-top bg-white fixed-top q-px-md">
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
                shampooExtraList &&
                shampooExtraList.illness_history_list?.length > 0
              "
              label="美容概要"
              default-opened
              dense
              expand-icon-class="text-white"
              header-class="bg-grey-800 text-white header-label"
            >
              <div
                class="q-mb-xs"
                v-for="obj in filteredIllnessHistoryList"
              >
                <UpdateIllnessHistoryModal
                  :full-width="true"
                  :id_employee_doctor="obj.id_employee_doctor"
                  :petSelected="getPet"
                  :id_pet_illness_history="obj.id_pet_illness_history"
                  :viewOnly="true"
                  :request-detail-page="props.requestDetailPage"
                  :with-scroll="false"
                  @edit="
                    openUpdateIllnessHistoryModal(
                      obj.id_employee_doctor,
                      obj.id_pet_illness_history
                    )
                  "
                  @deleted="handleIllnessHistoryDeleted"
                />
              </div>
            </q-expansion-item>
            <q-expansion-item
              v-if="
                shampooExtraList &&
                shampooExtraList.service_detail_list?.length > 0
              "
              label="対応歴"
              default-opened
              dense
              expand-icon-class="text-white"
              header-class="bg-grey-800 text-white header-label"
            >
              <div class="q-mt-sm flex">
                <template v-for="(group, date) in groupedServiceDetails" :key="date">
                  <div class="full-width">
                    <div class="caption1 regular divider q-mt-md q-ml-sm">
                      <span class="text-weight-bold q-ml-sm">{{ date }}</span>
                    </div>
                    <div class="row q-col-gutter-sm q-px-sm q-py-sm">
                      <div 
                        class="col-lg-4 col-md-4 col-sm-6 col-xs-12"
                        v-for="(data, idx) in group"
                        :key="idx"
                      >
                        <ServiceDetailLargePocketList
                          v-if="data.id_service_detail"
                          class="full-width"
                          :copy-icon="false"
                          :data="data"
                          :petSelected="getPet"
                          :request="requestDetailPage"
                          parentId="shampoo-detail-section"
                        />
                        <div v-else-if="data.id_cart_detail" class="q-mr-md">
                          <div
                            class="q-mb-xs cursor-pointer"
                            @click="openUpdateCartDetailModal(data)"
                          >
                            <div class="bg-grey-050 q-py-md q-px-md q-mb-xs">
                              <div class="q-mb-sm">
                                <span class="title2 bold text-grey-900 q-mb-md">
                                  {{ data.name_cart_item_display }}
                                </span>
                                <span class="q-ml-md">
                                  <span class="caption2 regular text-grey-700">
                                    {{ data.name_category1 }}
                                  </span>
                                  <q-icon class="q-px-xs" color="grey-700" name="arrow_right" />
                                  <span class="caption2 regular text-grey-700">
                                    {{ data.name_category2 }}
                                  </span>
                                </span>
                              </div>
                              <div class="flex items-center q-mb-xs">
                                <span class="text-grey-700">
                                  {{ data.date_order_start ? formatDate(data.date_order_start) : '' }}
                                  {{
                                    data.date_order_end ? ' - ' + formatDate(data.date_order_end) : ''
                                  }}
                                </span>
                              </div>
                              <div>
                                <p
                                  class="caption2 regular text-grey-700 q-pt-xs q-mb-none ellipsis-2-lines"
                                >
                                  {{ data.memo_service || '' }}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </q-expansion-item>
            <p v-else class="q-pt-md q-pl-md text-grey-500">登録がありません。</p>
          </q-scroll-area>

        </div>
        <div class="col-6">
          <q-scroll-area class="content-full">
            <div class="q-pa-md flex column gap-4">
              <div v-if="shampooExtraList && shampooExtraList.carte_list">
                <div v-for="(date_insert, index) in Object.keys(shampooExtraList.carte_list)" :key="`section-${index}`" class="q-mb-md">
                  <template v-if="shampooExtraList.carte_list[date_insert]" v-for="dt_insert in Object.keys(shampooExtraList.carte_list[date_insert].others)">
                    <MemoCarteGrouped
                      :data="shampooExtraList.carte_list[date_insert].others[dt_insert]"
                      :date="dt_insert"
                      :id_customer="props.id_customer"
                      :id_pet="props.id_pet"
                      :clinical_file="shampooExtraList.carte_list[date_insert]?.clinical_file_list || []"
                      @on-close-modal="fetchMoreData"
                    />
                  </template>

                  <div v-if="shampooExtraList.carte_list[date_insert]?.clinical_file_list && shampooExtraList.carte_list[date_insert]?.clinical_file_list.length > 0" class="q-mb-md row c-gap">
                    <div v-for="(files, i) in shampooExtraList.carte_list[date_insert]?.clinical_file_list"
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
.file {
  position: relative;
  cursor: pointer;
  height: 123px;
  max-width: 169px;
}
.thumbnail-style {
  border-radius: 8px;
  height: 123px;
  max-width: 169px;
}

.date-overlay {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 2px 5px;
  font-size: 12px;
  border-radius: 8px;
}
</style>
