<script setup lang="ts">
import UpdateMemoCarteModal from '@/pages/memoCarte/UpdateMemoCarteModal.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import useMemoCarteStore from '@/stores/memo-cartes'
import { dateFormat, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import { onMounted, reactive, ref } from 'vue'
import selectOptions from '@/utils/selectOptions'
import MemoCarteGrouped from '@/pages/request/detail/MemoCarteGrouped.vue'
import UpdateClinicalFileModal from '@/pages/petInfo/diagnostic/UpdateClinicalFileModal.vue'
import { event_bus } from '@/utils/eventBus'
import fileLogo from '@/assets/img/clinicalFiles/file.png'
import MtModalHeaderMemoCarte from '@/components/lab/MtModalHeaderMemoCarte.vue'
import PinnedMemoCarte from '@/pages/request/detail/memo-carte/PinnedMemoCarte.vue'

const props = defineProps({
  id_pet: String,
  id_customer: String,
  fixedFilter: { type: Boolean, default: false },
  id_pet_illness_history: String
})
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)

const memoCarteList = ref([])
const memoCarteGroupedList = ref([])
const apiCalled = ref(false)
const illnessHistoryRef = ref()
const yearPeriod = ref('last90days')
const illnessHistoryList = ref([])
const illnessHistoryListDefault = reactive([])
const illnessHistorySelected = ref(null)
const memoCarteSearch = ref('')

const alreadyVisited = ref([])
const nextPage = ref(null)

const onEnterPress = () => {
  illnessHistoryRef.value.focus()
}
const openAddModal = async () => {
  memoCarteStore.selectMemoCarte(null)
  await mtUtils.popup(UpdateMemoCarteModal, {
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    id_pet_illness_history: illnessHistorySelected.value
  }, true)
  await init()
}
const openMemoCarteModal = async (id_memo_carte: string) => {
  await mtUtils.popup(UpdateMemoCarteModal, {
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    id_memo_carte: id_memo_carte
  }, true)
  await init()
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
    allData: memoCarteList.value?.[date_insert]?.clinical_file_list
  })
  event_bus.emit('reloadRight', true)
}
const replaceByDefaultImg = (e) => {
  e.target.src = fileLogo
}
const filter = () => {
  let startDate, endDate, currentDate
  if (yearPeriod.value === 'last90days') {
    // get last 90 days
    endDate = getDateToday()
    startDate = dateFormat(
      new Date(new Date().setDate(new Date(endDate).getDate() - 90))
    )
  } else if (yearPeriod.value === 'current') {
    // set start date as first date of current year, end date as today
    endDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(endDate), {
        year: new Date(endDate).getFullYear(),
        month: 1,
        day: 1
      })
    )
  } else if (yearPeriod.value === 'last') {
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
    Object.assign(filters, { start_date: startDate, end_date: endDate })
  if (illnessHistorySelected.value)
    Object.assign(filters, {
      id_pet_illness_history: illnessHistorySelected.value
    })
  if (memoCarteSearch.value)
    Object.assign(filters, { memo_other: memoCarteSearch.value.toLowerCase() })

  return filters
}
const init = async (filters = {}) => {
  await fetchMoreData(false)
  memoCarteStore.fetchMemoCartePinned({ id_pet: props.id_pet })
}

defineExpose({ fetchMoreData })

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = filter()
  if (!fetchMore) nextPage.value = 1
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value
  }

  if (fetchMore && !nextPage.value) {
    await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
    return
  }

  try {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      'cartes',
      filterData,
      true
    )

    if (response && response.data) {
      if (fetchMore) {
        const newData = response.data.filter(
          (item) =>
            !memoCarteList.value.some(
              (existingItem) => existingItem.id === item.id
            )
        )
        if (!alreadyVisited.value.includes(response.current)) {
          memoCarteList.value.push(...newData)
          alreadyVisited.value.push(response.current)
        }
      } else {
        memoCarteGroupedList.value = []
        memoCarteList.value = []
        memoCarteList.value = response.data
      }

      const unorderedCartes = memoCarteList.value?.reduce((acc, item) => {
        const dateInsert = dateFormat(item.date_insert)
        const dateTimeInsert = item.datetime_group_carte
        if (!acc[dateInsert]) {
          acc[dateInsert] = {
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
              acc[dateInsert].others[dateTimeInsert].memo_carte_list.push({
                ...item.memo_carte,
                group_carte: item.group_carte
              })
            }
          } else {
            acc[dateInsert].others[dateTimeInsert].memo_carte_list.push({
              ...item.memo_carte,
              group_carte: item.group_carte
            })
          }

          if (item.memo_carte.memo_other && (item.memo_carte?.memo_sbj || item?.memo_carte?.memo_ass || item?.memo_carte?.memo_obj)) {
            acc[dateInsert].others[dateTimeInsert].grouped_cartes = true
          }
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
      memoCarteGroupedList.value = Object.fromEntries(
        Object.entries(unorderedCartes).sort((a, b) => new Date(b[0]) - new Date(a[0]))
      )

      memoCarteStore.setMemoCartePetDetails(memoCarteList.value)

      nextPage.value = response.next
        ? parseInt(response.next.split('page=')[1])
        : null
    }
  } catch (error) {
    console.error('Error fetching memo carte data:', error)
    await mtUtils.autoCloseAlert('データの取得中にエラーが発生しました')
  }
}

const handleIllnessHistoryChange = (val) => {
  illnessHistorySelected.value = val
  memoCarteList.value = []
  alreadyVisited.value = []
  nextPage.value = null
  init()
}

const handleYearPeriodChange = (val) => {
  yearPeriod.value = val
  memoCarteList.value = []
  alreadyVisited.value = []
  nextPage.value = null
  init()
}

const handleSearch = () => {
  memoCarteList.value = []
  alreadyVisited.value = []
  nextPage.value = null
  init()
}
const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}

onMounted(async () => {
  if (getIllnessHistorys.value.length === 0)
    await illnessHistoryStore.fetchIllnessHistorys({
      id_pet: props?.id_pet,
      id_customer: props?.id_customer
    })
  getIllnessHistorys.value.map((v: any) => {
    illnessHistoryListDefault.push({
      label: v.name_disease ? v.name_disease : v.name_disease_free,
      value: v.id_pet_illness_history
    })
  })
  if (props.id_pet_illness_history)
    illnessHistorySelected.value = props.id_pet_illness_history
  illnessHistoryList.value = [...illnessHistoryListDefault]

  await init()
})
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar"
    style="width: 100%; max-width: 100%"
    @scroll="handleScroll"
    ref="scrollAreaRef"
  >
    <MtModalHeaderMemoCarte
      :fixed-filter="fixedFilter"
      :memo-carte-search="memoCarteSearch"
      :illness-history-list="illnessHistoryList"
      :illness-history-list-default="illnessHistoryListDefault" 
      :illness-history-selected="illnessHistorySelected"
      :year-period="yearPeriod"
      @update:memo-carte-search="(val) => memoCarteSearch = val"
      @update:illness-history-selected="handleIllnessHistoryChange"
      @update:illness-history-list="(val) => illnessHistoryList = val"
      @update:year-period="handleYearPeriodChange"
      @onEnterPress="onEnterPress"
      @onSearch="handleSearch"
      @onAddMemoCarte="openAddModal"
    />

    <div :class="props.fixedFilter ? 'q-pt-md q-mr-md bg-grey-200' : ''" v-if="memoCarteGroupedList">
      <PinnedMemoCarte
        v-for="data in memoCarteStore.getMemoCartePinned"
        :id_pet="props.id_pet"
        :id_customer="props.id_customer"
        :data="data"
        @on-close-modal="init"
      />
      <div class="q-mr-xs q-ml-xs" v-for="(date_insert, index) in Object.keys(memoCarteGroupedList)" :key="`section-${index}`">
        <template v-if="memoCarteGroupedList[date_insert]" v-for="dt_insert in Object.keys(memoCarteGroupedList[date_insert].others)">
          <MemoCarteGrouped
            :data="memoCarteGroupedList[date_insert].others[dt_insert]"
            :date="dt_insert"
            :id_customer="props.id_customer"
            :id_pet="props.id_pet"
            @on-close-modal="init"
          />
        </template>
      </div>
    </div>
    <p v-else class="q-pt-md q-pl-md text-grey-500">登録がありません。</p>
  </q-scroll-area>
</template>
