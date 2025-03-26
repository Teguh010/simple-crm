<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref } from 'vue'
import usePrescriptionStore from '@/stores/prescription'
import { dateFormat, formatDate, formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import MtTable2 from '@/components/MtTable2.vue'
import { date } from 'quasar'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import selectOptions from '@/utils/selectOptions'
import PrescriptionLargePocketList from '@/components/PocketList/largePocket/PrescriptionLargePocketList.vue'
import { orderBy } from 'lodash'

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
});
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

const onEnterPress = () => { illnessHistoryRef.value.focus() }
const columns = [
  {
    name: 'number_prescription',
    label: '処方箋番号',
    field: 'number_prescription'
  },
  {
    name: 'datetime_insert',
    label: '登録日時',
    field: 'datetime_insert'
  },
  {
    name: 'title_prescription',
    label: '処方箋名',
    field: 'title_prescription'
  },
  {
    name: 'flg_delivered',
    label: '受け渡し済',
    field: 'flg_delivered'
  },
  {
    name: 'action',
    label: '',
    field: 'action'
  },
]
const filter = async () => {
  let startDate, endDate, currentDate
  if(yearPeriod.value === 'last90days') {
    // get last 90 days
   endDate = getDateToday()
   startDate = dateFormat(new Date(new Date().setDate(new Date(endDate).getDate() - 90)))
  }
  else if(yearPeriod.value === 'current') {
    // set start date as first date of current year, end date as today
   endDate = getDateToday()
   startDate = dateFormat(date.adjustDate(new Date(endDate), {year: new Date(endDate).getFullYear(), month: 1, day: 1}))
  }
  else if(yearPeriod.value === 'last') {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(date.adjustDate(new Date(currentDate), {year: new Date(currentDate).getFullYear() - 1, month: 1, day: 1}))
    endDate = dateFormat(date.adjustDate(new Date(currentDate), {year: new Date(currentDate).getFullYear() - 1, month: 12, day: 31}))
  }
  let filters = {}
  if (startDate && endDate) Object.assign(filters, {'date_start':  startDate, 'date_end': endDate})
  if (illnessHistorySelected.value) Object.assign(filters, {'id_pet_illness_history': illnessHistorySelected.value})
  if (searchNamePrescription.value) Object.assign(filters, {'title_prescription': searchNamePrescription.value.toLowerCase()})

  return filters
  
}
const prescriptionListByPet = ref([])
const init = async (filters = {}) => {
  filters = await filter()
  await fetchMoreData(false)
}
defineExpose({ fetchMoreData })

async function fetchMoreData(fetchMore: boolean = true) {
  prescriptionListByPet.value = []
  const filters = await filter()
  if (!fetchMore) nextPage.value = null
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value,
    order_by: '-datetime_insert'
  }

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchPrescriptionDetailList', filterData, true)

  if (response && response.data) {

    if (!alreadyVisited.value.includes(nextPage.value)) {
      const prescriptionList = response.data?.map((prescriptionObj: any) => {
        if (
          prescriptionObj &&
          prescriptionObj.prescription_detail_list &&
          prescriptionObj.prescription_detail_list.length
        ) {
          const updatedList = prescriptionObj.prescription_detail_list.reduce((acc: any[], item: any) => {
            if (item.id_prescription_detail_ref == null) {
              acc.push({ ...item, effort_item: null });
            } else if (item.id_prescription_detail_ref != null && !(item.flg_etc1 || item.flg_etc2)) {
              acc.push({ ...item, effort_item: null })
            } else {
              const parent = acc.find(
                (parentItem) => parentItem.id_prescription_detail === item.id_prescription_detail_ref
              );
              if (parent && item.flg_etc2) {
                parent.effort_item = item;
              }
            }
            return acc;
          }, []).map((pd) => ({
            ...pd, 
            datetime: pd.id_prescription_detail_ref ? formatDate(prescriptionObj.prescription_detail_list.find((v) => v.id_prescription_detail == pd.id_prescription_detail_ref)?.date_start) : formatDate(pd.date_start)
          }))

          prescriptionObj.prescription_detail_list = orderBy(updatedList, 'datetime', 'desc')
        }

        return prescriptionObj;
      })

      prescriptionListByPet.value = prescriptionList
      alreadyVisited.value.push(response.current)
    }
    if (response.next) {
      nextPage.value = response.next?.includes('page=') ? response.next.split('page=')[1] : null
    } else {
      nextPage.value = null
    }
  }
}

const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    if (nextPage.value) {
      await fetchMoreData()
      apiCalled.value = false
    } else {
      await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
      apiCalled.value = false
      return
    }
  }
}

onMounted(async () => {
  if (getIllnessHistorys.value.length === 0) await illnessHistoryStore.fetchIllnessHistorys({ id_pet: props?.id_pet, id_customer: props?.id_customer })
  getIllnessHistorys.value.map((v:any) => {
    illnessHistoryListDefault.push( { label : v.name_disease ? v.name_disease : v.name_disease_free, value: v.id_pet_illness_history })
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
    <div class="ah-adjust-for-thumb-scroller full-width q-pr-lg z-top" :class="props.fixedFilter ? 'bg-white fixed' : ''">
      <div class="flex no-wrap items-center q-mb-md" style="gap: 13px">
        <MtFormInputText
          v-model="searchNamePrescription"
          label="処方箋名"
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
            @onEnterPress="()=>{prescriptionListByPet = []; alreadyVisited = []; nextPage = null; init();}"
            @update:selecting="()=>{prescriptionListByPet = []; alreadyVisited = []; nextPage = null; init();}"
          />
        </div>
        <div>
          <MtFormRadiobtn label="直近90日" v-model="yearPeriod" val="last90days" />
          <MtFormRadiobtn label="今年" v-model="yearPeriod" val="current" /> 
          <MtFormRadiobtn label="去年" v-model="yearPeriod" val="last" /> 
          <MtFormRadiobtn label="全期間" v-model="yearPeriod" val="all" /> 
        </div>
        <div>
          <q-btn 
            padding="6px 14px"
            unelevated
            @click="()=>{prescriptionListByPet = []; alreadyVisited = []; nextPage = null; init();}"
            color="accent-800"
            text-color="white"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
        </div>
      </div>
    </div>
    <div :class="props.fixedFilter ? 'q-pt-xxl' : ''">
      <PrescriptionLargePocketList
        v-if="prescriptionListByPet.length > 0"
        v-for="item in prescriptionListByPet"
        :copy="false"
        :key="item.id_prescription_detail"
        :data="item"
        parentId="right-detail-section"
        class="q-mt-sm"
        @refresh="init"
      />
      <p v-else class="q-pl-md text-grey-500">処方箋はありません。</p>
    </div>
  </q-scroll-area>
</template>
