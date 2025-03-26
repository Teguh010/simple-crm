<script setup lang="ts">
import ServiceDetailPocketList from '@/components/PocketList/ServiceDetailPocketList2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useServiceDetailStore from '@/stores/service-details'
import useIllnessHistoryStore from '@/stores/illness-history'
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref, nextTick, computed } from 'vue'
import { dateFormat, getDateToday } from '@/utils/aahUtils'
import { date } from 'quasar'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { groupBy } from 'lodash'

const props = defineProps({
  id_pet: String,
  defaultYearPeriod: {
    type: String,
    default: 'last90days'
  },
  id_customer: String,
  fixedFilter: {
    type: Boolean,
    default: false
  },
  id_pet_illness_history: String,
  selectDefaultIllnessHistory: {
    type: Boolean,
    default: false
  }
})

const nextPage = ref(null)
const alreadyVisited = ref([])
const apiCalled = ref(false)

const serviceDetailStore = useServiceDetailStore()
const { getAllServiceDetails } = storeToRefs(serviceDetailStore)
const serviceDetailList = ref([])
const yearPeriod = ref(props.defaultYearPeriod)
const illnessHistoryStore = useIllnessHistoryStore()
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)

const illnessHistoryRef = ref()
const illnessHistoryList = ref([])
const illnessHistoryListDefault = reactive([])
const illnessHistorySelected = ref(null)
const searchServiceDetail = ref('')

const serviceDetailPocketKey = ref(1)

const onEnterPress = () => {
  illnessHistoryRef.value.focus()
}
const filter = async () => {
  let startDate, endDate, currentDate
  if (yearPeriod.value === 'last90days') {
    // get last 90 days
    endDate = getDateToday()
    startDate = dateFormat(new Date(new Date().setDate(new Date(endDate).getDate() - 90)))
  } else if (yearPeriod.value === 'current') {
    // set start date as first date of current year, end date as today
    endDate = getDateToday()
    startDate = dateFormat(date.adjustDate(new Date(endDate), {
      year: new Date(endDate).getFullYear(),
      month: 1,
      day: 1
    }))
  } else if (yearPeriod.value === 'last') {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(date.adjustDate(new Date(currentDate), {
      year: new Date(currentDate).getFullYear() - 1,
      month: 1,
      day: 1
    }))
    endDate = dateFormat(date.adjustDate(new Date(currentDate), {
      year: new Date(currentDate).getFullYear() - 1,
      month: 12,
      day: 31
    }))
  }
  let filters = {}
  if (startDate && endDate) Object.assign(filters, {
    'datetime_service_start': startDate,
    'datetime_service_end': endDate
  })
  if (illnessHistorySelected.value) Object.assign(filters, { 'id_pet_illness_history': illnessHistorySelected.value })
  if (searchServiceDetail.value) Object.assign(filters, { 'name_item_service': searchServiceDetail.value.toLowerCase() })

  return filters
}

const init = async () => {
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    excluded_AS: true
  }
  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'service_details', filterData, true)
  if (response && response.data) {
    serviceDetailList.value.length = 0
    await nextTick()
    serviceDetailList.value.push(...response.data)
  }
}

defineExpose({
  fetchMoreData
})

async function fetchMoreData() {
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value,
    excluded_AS: true
  }

  if (!nextPage.value) {
    await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
    return
  }

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'service_details', filterData, true)

  if (response && response.data) {

    if (!alreadyVisited.value.includes(nextPage.value)) {
      serviceDetailList.value.push(...response.data)
      alreadyVisited.value.push(response.current)
    }

    if (response.next) {
      nextPage.value = response.next.split('page=')[1]
    } else {
      nextPage.value = null
    }
  }


}

const groupedServiceDetails = computed(() => {
  return groupBy(serviceDetailList.value, (item) => 
    dateFormat(item.datetime_service_start)
  )
})

const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}

onMounted(async () => {
  await illnessHistoryStore.fetchIllnessHistorys({ id_pet: props?.id_pet, id_customer: props?.id_customer })

  getIllnessHistorys.value.map((v: any) => {
    illnessHistoryListDefault.push({
      label: v.name_disease ? v.name_disease : v.name_disease_free,
      value: v.id_pet_illness_history
    })
  })
  illnessHistoryList.value = [...illnessHistoryListDefault]

  if (props.id_pet_illness_history) illnessHistorySelected.value = props.id_pet_illness_history
  else if(props.selectedDefaultIllnessHistory) illnessHistorySelected.value = illnessHistoryList.value[0].value

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
    <div class="full-width q-pr-lg z-top ah-adjust-for-thumb-scroller" :class="props.fixedFilter ? 'bg-white fixed' : ''">
      <div class="flex no-wrap items-center q-mb-md" style="gap: 13px">
        <MtFormInputText
          v-model="searchServiceDetail"
          label="治療・サービス名"
          style="flex: 1"
          autofocus
          @onEnterPress="onEnterPress"
        />
        <div style="flex: 1">
          <MtFilterSelect
            ref="illnessHistoryRef"
            label="現疾患・既往歴"
            v-model:options="illnessHistoryList"
            :options-default="illnessHistoryListDefault"
            v-model:selecting="illnessHistorySelected"
            @onEnterPress="init()"
            @update:selecting="()=>{serviceDetailList = []; alreadyVisited = []; nextPage = null; init();}"
          />
        </div>
        <div>
          <MtFormRadiobtn label="直近90日" v-model="yearPeriod" val="last90days" />
          <MtFormRadiobtn v-model="yearPeriod" label="今年" val="current" />
          <MtFormRadiobtn v-model="yearPeriod" label="去年" val="last" />
          <MtFormRadiobtn v-model="yearPeriod" label="全期間" val="all" />
        </div>
        <div>
          <q-btn
            padding="6px 14px"
            unelevated
            @click="init()"
            color="accent-800"
            text-color="white"
          >
            <q-icon name="search" size="20px" />
            検索
          </q-btn>
        </div>
      </div>
    </div>
    <div :class="props.fixedFilter ? 'q-pt-xxl' : ''">
      <div v-if="serviceDetailList && serviceDetailList.length > 0">
        <div v-for="(group, date) in groupedServiceDetails" :key="date">
          <div class="caption1 regular divider q-mt-md q-ml-sm">
            <span class="text-weight-bold q-ml-sm">{{ date }}</span>
          </div>
          <div class="row q-col-gutter-sm q-px-sm">
            <div 
              class="col-lg-3 col-md-4 col-sm-6"
              v-for="(item, idx) in group"
              :key="idx"
            >
              <ServiceDetailPocketList 
                :data="item" 
                refetchAll 
                :key="idx * serviceDetailPocketKey"
              />
            </div>
          </div>
        </div>
      </div>
      <p v-else class="q-pl-md text-grey-500">
        治療・サービスはありません。
      </p>
    </div>
  </q-scroll-area>
</template>

<style lang="scss" scoped>
.divider {
  width: 100%;
  padding: 5px 0 5px;
  background: $grey-100;
  margin-top: 16px;
}

.row.q-col-gutter-sm {
  margin-top: 8px;
  margin-bottom: 8px;
}
</style>
