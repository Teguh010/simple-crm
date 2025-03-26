<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent, computed } from 'vue'
import mtUtils from '@/utils/mtUtils'
import { date } from 'quasar'
import { dateFormat, formatDate, getDateToday, groupByDateRange } from '@/utils/aahUtils'
import { groupBy } from 'lodash'

import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import selectOptions from '@/utils/selectOptions'
import { CartDetailListType, MemoCarteType, RequestDetailPageType } from '@/types/types'
import { useMemoCarte } from '@/hooks/use-memo-carte'
import { useIllnessHistoryName } from '@/hooks/use-illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import MemoCarteGrouped from '@/pages/request/detail/MemoCarteGrouped.vue'

type FoodListType = {
  cart_detail_list: CartDetailListType[]
  memo_carte_list: MemoCarteType[]
}

// lazy loaded component
const UpdateMemoCarteModal = defineAsyncComponent(
  () => import('@/pages/memoCarte/UpdateMemoCarteModal.vue')
)
const UpdateCartDetailModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartDetailModal.vue')
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

const memoCarteStore = useMemoCarteStore()

const yearPeriod = ref('1')

const foodExtraList = ref<FoodListType>()
const nextPage = ref(null)

const filterYearPeriod = async () => {
  await fetchMoreData()
}

const filter = async () => {
  let startDate, endDate, currentDate
  // if (yearPeriod.value === 'last90days') {
  //   // get last 90 days
  //   endDate = getDateToday()
  //   startDate = dateFormat(
  //     new Date(new Date().setDate(new Date(endDate).getDate() - 90))
  //   )
  // } else
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

  if (fetchMore) {
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `pet_history/${props.id_pet}/food`,
    filterData,
    true
  )

  if (response && response.data) {
    foodExtraList.value = response.data

    if (foodExtraList.value) {
      const unorderedCartes = foodExtraList.value.carte_list.reduce((acc, item) => {
        if (item.memo_carte || item.pet_bio || item.medical_condition) {
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
        }

        return acc
      }, {})

      if (foodExtraList.value.memo_carte_list.length > 0) {
        foodExtraList.value?.memo_carte_list.forEach(item => {
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
      foodExtraList.value.carte_list = Object.fromEntries(
        Object.entries(unorderedCartes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
      );
    }
  }
}

const tabList = [
  { value: 'cart_detail_list', label: 'フード会計歴' },
  { value: 'memo_carte_list', label: 'フードカルテ' }
]

const openMemoCarteModal = async (item: MemoCarteType) => {
  memoCarteStore.selectMemoCarte(item.id_memo_carte)
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
    data: cart_data,
    cartDetail: cart_data,
    disable: true
  })
  await fetchMoreData()
}

const groupedFoodExtraList = computed(() => {
  return groupByDateRange(
    foodExtraList.value?.cart_detail_list,
    'date_order_start', 
    'date_order_end'
  )
})

onMounted(async () => {
  await fetchMoreData(false)
})
</script>

<template>
  <div class="separate-scrollbar" style="position: relative;contain: strict;">
    <div class="absolute">
      <div class="ah-adjust-for-thumb-scroller flex justify-end full-width q-pr-lg z-top bg-white fixed-top">
        <div class="q-pt-sm">
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
          
            <div
              v-if="
                foodExtraList &&
                foodExtraList.cart_detail_list &&
                foodExtraList.cart_detail_list.length > 0
              "
            >
              <template v-for="(group, date) in groupedFoodExtraList" :key="date">
                <div class="caption1 regular divider q-mt-md q-ml-sm">
                  <span class="text-weight-bold q-ml-sm">{{ date }}</span>
                </div>
                <div class="row q-col-gutter-sm q-px-sm">
                  <div 
                    class="col-lg-4 col-md-4 col-sm-6 col-xs-12"
                    v-for="(obj, idx) in group"
                    :key="idx"
                  >
                    <div 
                      class="q-py-md q-px-md q-mb-xs cursor-pointer item_divier_item_service"
                      @click="openUpdateCartDetailModal(obj)"
                    >
                      <div class="q-mb-sm">
                        <span class="title2 bold text-grey-900 q-mb-md">
                          {{ obj.name_cart_item_display }}
                        </span>
                        <span class="q-ml-md">
                          <span class="caption2 regular text-grey-700">
                            {{ obj.name_category1 }}
                          </span>
                          <q-icon class="q-px-xs" color="grey-700" name="arrow_right" />
                          <span class="caption2 regular text-grey-700">
                            {{ obj.name_category2 }}
                          </span>
                        </span>
                      </div>
                      <div class="flex items-center q-mb-xs">
                        <span class="text-grey-700">
                          {{ obj.date_order_start ? formatDate(obj.date_order_start) : '' }}
                          <span v-if="obj.date_order_end && dateFormat(obj.date_order_start) !== dateFormat(obj.date_order_end)">
                            - {{ formatDate(obj.date_order_end) }}
                          </span>
                        </span>
                      </div>
                      <div>
                        <p class="caption2 regular text-grey-700 q-pt-xs q-mb-none ellipsis-2-lines">
                          {{ obj.memo_service || '' }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>

          </q-scroll-area>
        </div>
        <div class="col-6">
          <q-scroll-area class="content-full">

            <div class="q-pr-md flex column gap-4">
              <div
                v-if="
                  foodExtraList &&
                  foodExtraList.carte_list
                "
              >
                <template v-if="foodExtraList.carte_list" v-for="dt_insert in Object.keys(foodExtraList.carte_list)">
                  <MemoCarteGrouped
                    :data="foodExtraList.carte_list[dt_insert]"
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
.item_divier_item_service {
  border-radius: 10px;
  background-color: rgba(213, 239, 255, 0.7);
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(213, 239, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  &:active {
    background-color: rgba(236, 248, 255, 0.8);
  }
}

.divider {
  border-bottom: 1px solid $grey-3;
  padding-bottom: 8px;
  margin-bottom: 16px;
}
.memo-title {
  padding: 10px 15px;
  border-radius: 10px;
  line-height: 1.7;
  max-width: 100%;
}
</style>
