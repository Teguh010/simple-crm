<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref } from 'vue'
import { dateFormat, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { date } from 'quasar'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import selectOptions from '@/utils/selectOptions'
import ViewInjectHeaderModal from '@/pages/request/inject/ViewInjectHeaderModal.vue'
import InjectLargePocketList from '@/components/PocketList/largePocket/InjectLargePocketList.vue'

const props = defineProps({
  id_pet: String,
  defaultYearPeriod: {
    type: String,
    default: 'last90days'
  },
  fixedFilter: {
    type: Boolean,
    default: false
  },
  id_pet_illness_history: String
})
const yearPeriod = ref(props.defaultYearPeriod)
const illnessHistoryStore = useIllnessHistoryStore()
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)

const apiCalled = ref(false)
const illnessHistoryRef = ref()
const illnessHistoryList = ref([])
const illnessHistoryListDefault = reactive([])
const illnessHistorySelected = ref(null)
const searchNamePrescription = ref('')

const nextPage = ref(null)
const alreadyVisited = ref([])

const onEnterPress = () => {
  illnessHistoryRef.value.focus()
}
const columns = [
  {
    name: 'number_inject',
    label: 'Inject番号',
    field: 'number_inject'
  },
  {
    name: 'datetime_insert',
    label: '登録日時',
    field: 'datetime_insert'
  },
  {
    name: 'title_inject',
    label: 'Inject名',
    field: 'title_inject'
  },
  {
    name: 'action',
    label: '',
    field: 'action'
  }
]

function getPetIllnessHistory(petIllnessHistory: any) {
  if (!petIllnessHistory) return
  return `${petIllnessHistory?.number_pet_illness_history} ${petIllnessHistory.name_disease ? petIllnessHistory.name_disease : petIllnessHistory.name_disease_free}`
}

const onRowClick = async (row: any) => {
  await mtUtils.mediumPopup(ViewInjectHeaderModal, { InjectObj: row, id_pet: row.id_pet })
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
  if (startDate && endDate) Object.assign(filters, { 'date_start': startDate, 'date_end': endDate })
  if (illnessHistorySelected.value) Object.assign(filters, { 'id_pet_illness_history': illnessHistorySelected.value })
  if (searchNamePrescription.value) Object.assign(filters, { 'title_inject': searchNamePrescription.value.toLowerCase() })

  return filters

}
const injectListByPet = ref([])
const init = async (filters = {}) => {
  filters = await filter()
  await fetchMoreData(false)
}
defineExpose({ fetchMoreData })

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = await filter()
  if (!fetchMore) nextPage.value = null
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value,
    order_by: '-datetime_insert'
  }

  if (fetchMore) {
    if (!nextPage.value) {
      await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
      return
    }
  }

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchInjectList', filterData, true)

  if (response && response.data) {

    if (!alreadyVisited.value.includes(nextPage.value)) {
      const injectList = response.data?.map((injectObj: any) => {
        if (
          injectObj &&
          injectObj.inject_detail_list &&
          injectObj.inject_detail_list.length
        ) {
          const updatedList = injectObj.inject_detail_list.reduce((acc: any[], item: any) => {
            if (item.id_inject_detail_parent == null && item.type_detail != 2) {
              acc.push({ ...item, effort_item: [] });
            } else if (item.id_inject_detail_parent == null && item.type_detail == 2) {
              if (!acc.find((already) => already.effort_item.find((secAlready) => item.id_inject_detail == secAlready.id_inject_detail)))
                acc.push({
                  ...item,
                  effort_item: injectObj.inject_detail_list.filter((child) => child.id_item_service == item.id_item_service && child.type_detail == 2)
                })
            } else {
              const parent = acc.find(
                (parentItem) => parentItem.id_inject_detail == item.id_inject_detail_parent
              );
              if (parent && item.type_detail == 3) {
                parent.effort_item.push(item);
              }
            }
            return acc;
          }, []);

          injectObj.inject_detail_list = updatedList;
        }

        return injectObj;
      })
      injectListByPet.value = injectList
      alreadyVisited.value.push(response.current)
    }
    if (response.next) {
      nextPage.value = response.next.split('page=')[1]

    } else {
      nextPage.value = null
    }
  }

}

const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}

onMounted(async () => {
  if (getIllnessHistorys.value.length === 0) await illnessHistoryStore.fetchIllnessHistorys({
    id_pet: props?.id_pet,
    id_customer: props?.id_customer
  })
  getIllnessHistorys.value.map((v: any) => {
    illnessHistoryListDefault.push({
      label: v.name_disease ? v.name_disease : v.name_disease_free,
      value: v.id_pet_illness_history
    })
  })
  if (props.id_pet_illness_history) illnessHistorySelected.value = props.id_pet_illness_history
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
    <div :class="props.fixedFilter ? 'bg-white fixed ah-adjust-for-thumb-scroller' : ''" class="full-width q-pr-lg z-top">
      <div class="flex no-wrap items-center q-mb-md" style="gap: 13px">
        <MtFormInputText
          v-model="searchNamePrescription"
          autofocus
          label="注射・点滴名"
          style="flex: 1"
          @onEnterPress="onEnterPress"
        />
        <div style="flex: 1">
          <MtFilterSelect
            ref="illnessHistoryRef"
            v-model:options="illnessHistoryList"
            v-model:selecting="illnessHistorySelected"
            :options-default="illnessHistoryListDefault"
            label="現疾患・既往歴"
            @onEnterPress="()=>{injectListByPet = []; alreadyVisited = []; nextPage = null; init();}"
            @update:selecting="()=>{injectListByPet = []; alreadyVisited = []; nextPage = null; init();}"
          />
        </div>
        <div>
          <MtFormRadiobtn v-model="yearPeriod" label="直近90日" val="last90days" />
          <MtFormRadiobtn v-model="yearPeriod" label="今年" val="current" />
          <MtFormRadiobtn v-model="yearPeriod" label="去年" val="last" />
          <MtFormRadiobtn v-model="yearPeriod" label="全期間" val="all" />
        </div>
        <div>
          <q-btn
            color="accent-800"
            padding="6px 14px"
            text-color="white"
            unelevated
            @click="()=>{injectListByPet = []; alreadyVisited = []; nextPage = null; init();}"
          >
            <q-icon name="search" size="20px" />
            検索
          </q-btn>
        </div>
      </div>
    </div>
    <div :class="props.fixedFilter ? 'q-pt-xxl' : ''">
      <InjectLargePocketList
        v-for="inject in injectListByPet"
        v-if="injectListByPet.length > 0"
        :key="inject.id_inject"
        :data="inject"
        @refresh="init"
      />
      <p v-else class="q-pl-md text-grey-500">処方箋はありません。</p>
    </div>
  </q-scroll-area>
</template>
