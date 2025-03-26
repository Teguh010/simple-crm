<script setup lang="ts">
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import UpdateBioConditionModal from '@/pages/petInfo/bioCondition/UpdateBioConditionModal.vue'
import useCommonStore from '@/stores/common'
import useEmployeeStore from '@/stores/employees'
import usePetBioConditionStore from '@/stores/pet-bio-conditions'
import { dateFormat, formatDateTime, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import { onMounted, ref } from 'vue'
import selectOptions from '@/utils/selectOptions'

const columnBioCondition = [
  { name: "datetime_record", label: "測定日時", field: "datetime_record", align: "left", },
  { name: "id_employee_reviewed", label: "記録者", field: "id_employee_reviewed", align: "left", },
  { name: "type_review_water", label: "水分", field: "type_review_water", align: "left" },
  { name: "type_review_feces", label: "排便", field: "type_review_feces", align: "left" },
  { name: "type_review_urine", label: "排尿", field: "type_review_urine", align: "left", },
  { name: "type_review_vomit", label: "嘔吐", field: "type_review_vomit", align: "left" },
  { name: "type_review_respiration", label: "呼吸", field: "type_review_respiration", align: "left", },
  { name: "type_review_wellness", label: "活動", field: "type_review_wellness", align: "center" },
  { name: "type_review_body_temprature", label: "体温", field: "type_review_body_temprature", align: "center", },
  { name: "memo_record", label: "メモ", field: "memo_record", align: "center", },
]

const props = defineProps({ id_pet: String, id_customer: String, fixedFilter: { type: Boolean, default: false } })
const petBioCondition = usePetBioConditionStore()
const employeeStore = useEmployeeStore()
const commonStore = useCommonStore()
const { 
  getCommonTypeReviewFood, getCommonTypeReviewWater, getCommonTypeReviewFeces, getCommonTypeReviewUrine, getCommonTypeReviewVomit,
  getCommonTypeReviewRespiration, getCommonTypeReviewWellness, getCommonTypeReviewBodyTemprature
} = storeToRefs(commonStore)

const yearPeriod = ref('last90days')

const petBioConditionList = ref([])
const alreadyVisited = ref([])
const nextPage = ref(null)
const apiCalled = ref(false)

const typeReviewFoodName = (value: number) => getCommonTypeReviewFood.value.find((v) => v.id_common === value)?.name_common
const typeReviewWaterName = (value: number) => getCommonTypeReviewWater.value.find((v) => v.id_common === value)?.name_common
const typeReviewFecesName = (value: number) => getCommonTypeReviewFeces.value.find((v) => v.id_common === value)?.name_common
const typeReviewUrineName = (value: number) => getCommonTypeReviewUrine.value.find((v) => v.id_common === value)?.name_common
const typeReviewVomitName = (value: number) => getCommonTypeReviewVomit.value.find((v) => v.id_common === value)?.name_common
const typeReviewRespirationName = (value: number) => getCommonTypeReviewRespiration.value.find((v) => v.id_common === value)?.name_common
const typeReviewWellnessName = (value: number) => getCommonTypeReviewWellness.value.find((v) => v.id_common === value)?.name_common
const typeReviewBodyTempratureName = (value: number) => getCommonTypeReviewBodyTemprature.value.find((v) => v.id_common === value)?.name_common
const employeeName = (value: string) => employeeStore.getAllEmployees.find((v) => v.value === value)?.label

const openPetBioConditionModal = async () => {
  await mtUtils.popup(UpdateBioConditionModal, { id_customer: props.id_customer, id_pet: props.id_pet })
  await init()
}
const editPetBioConditionModal = async (pet_bio_condition) => {
  await mtUtils.popup(UpdateBioConditionModal, { pet_bio_condition, id_customer: props.id_customer, id_pet: props.id_pet })
  await init()
}

const filter = () => {
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

  return filters
}
defineExpose({ fetchMoreData })

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = filter()
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
    const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'pet_bio_condition', filterData, true)
    
    if (response && response.data) {
      if (fetchMore) {
        const newData = response.data.filter((item) => 
          { return !petBioConditionList.value.some(existingItem => existingItem.id === item.id) }
        );
        if (!alreadyVisited.value.includes(response.current)) {
          petBioConditionList.value.push(...newData)
          alreadyVisited.value.push(response.current)
        }
      } else {
        petBioConditionList.value = response.data
      }

      nextPage.value = response.next ? parseInt(response.next.split('page=')[1]) : null
    }
  } catch (error) {
    await mtUtils.autoCloseAlert('データの取得中にエラーが発生しました')
  }
}
const init = async (filters: object | null = null) => {
  await fetchMoreData(false)
}

const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}


onMounted(async () => {
  if (petBioConditionList.value.length === 0) await init()
  commonStore.fetchPreparationCommonList({code_common: [18, 19, 20, 21, 22, 23, 24]})
})
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar"
    style="width: 100%; max-width: 100%"
    @scroll="handleScroll"
    ref="scrollAreaRef"
  >
    <div class="full-width q-pr-lg z-top q-pt-sm" :class="props.fixedFilter ? 'bg-white fixed ah-adjust-for-thumb-scroller' : ''">
      <div class="flex no-wrap justify-end q-mb-md" style="gap: 13px">
        <div>
          <MtFormRadiobtn v-model="yearPeriod"
                          label="直近90日" val="last90days" @update:selected="()=>{petBioConditionList = []; alreadyVisited = []; nextPage = null; init();}" />
          <MtFormRadiobtn v-model="yearPeriod"
                          class="q-ml-sm" label="今年" val="current" @update:selected="()=>{petBioConditionList = []; alreadyVisited = []; nextPage = null; init();}" />
          <MtFormRadiobtn v-model="yearPeriod"
                          class="q-ml-sm" label="去年" val="last" @update:selected="()=>{petBioConditionList = []; alreadyVisited = []; nextPage = null; init();}" />
          <MtFormRadiobtn v-model="yearPeriod"
                          class="q-ml-sm" label="全期間" val="all" @update:selected="()=>{petBioConditionList = []; alreadyVisited = []; nextPage = null; init();}" />
        </div>
        <q-btn
          unelevated
          padding="6px 14px"
          color="primary"
          text-color="white"
          
          @click="openPetBioConditionModal()"
        >
          <q-icon size="18px" name="add" class="q-mr-xs" />状態管理
        </q-btn>
      </div>
    </div>
    <div class="bg-white  q-px-md q-pb-xs" :class="props.fixedFilter ? 'q-pt-xxl' : ''">
      <MtTable2
        v-if="petBioConditionList && petBioConditionList.length > 0"
        :columns="columnBioCondition" :rows="petBioConditionList"
        class="custody-table"
        :style="{ height: 'calc(100vh - 90px)',  boxShadow: 'none'}"
      >
        <template v-slot:row="{ row }">
          <td class="cursor-pointer" v-for="(col, index) in columnBioCondition" :key="index" @click="editPetBioConditionModal(row)">
            <div v-if="col.field === 'datetime_record'">
              {{ formatDateTime(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'id_employee_reviewed'">
              {{ employeeName(row[col.field]) }}
            </div>

            <div v-else-if="col.field === 'type_review_water'">
              {{ typeReviewWaterName(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'type_review_feces'">
              {{ typeReviewFecesName(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'type_review_urine'">
              {{ typeReviewUrineName(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'type_review_vomit'">
              {{ typeReviewVomitName(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'type_review_respiration'">
              {{ typeReviewRespirationName(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'type_review_wellness'">
              {{ typeReviewWellnessName(row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'type_review_body_temprature'">
              {{ typeReviewBodyTempratureName(row[col.field]) }}
            </div>
            <div v-else>
              {{ row[col.field] }}
            </div>
          </td>
        </template>
      </MtTable2>
      <p v-else class="q-pl-md text-grey-500">
        状態管理はありません。
      </p>
    </div>
  </q-scroll-area>
</template>
