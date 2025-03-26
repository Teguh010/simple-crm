<script setup lang="ts">
import MtTable2 from '@/components/MtTable2.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import UpdatePetBioInfoModal from '@/pages/petInfo/bioInfo/UpdatePetBioInfoModal.vue'
import usePetBioStore from '@/stores/pet-bios'
import { dateFormat, formatDateTime, getDateToday, roundZeroAfterPoint } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { date } from 'quasar'
import { onMounted, ref } from 'vue'
import selectOptions from '@/utils/selectOptions'
import { orderBy } from 'lodash'

const columnBio = [
  { name: "datetime_measure", label: "測定日時", field: "datetime_measure", align: "left", },
  { name: "val_weight", label: "体重", field: "val_weight", align: "left", },
  { name: "val_temperature", label: "T", field: "val_temperature", align: "left" },
  { name: "val_heartbeat_rate", label: "P", field: "val_heartbeat_rate", align: "center", },  
  { name: "val_respiration_rate", label: "R", field: "val_respiration_rate", align: "center", },
  { name: "val_pressure_systolic", label: "SBP", field: "val_pressure_systolic", align: "left" },
  { name: "val_pressure_diastolic", label: "DBP", field: "val_pressure_diastolic", align: "left", },
  { name: "val_pressure_mean_arterial", label: "MAP", field: "val_pressure_mean_arterial", align: "left" },
  { name: "val_blood_oxygen_level", label: "SpO2", field: "val_blood_oxygen_level", align: "left", },
  { name: "val_blood_carbon_dioxide_level", label: "EtCO2", field: "val_blood_carbon_dioxide_level", align: "center" },
  { name: "memo_measure", label: "測定時メモ", field: "memo_measure", align: "center", },
]

const props = defineProps({ id_pet: String, id_customer: String, fixedFilter: { type: Boolean, default: false } })
const petBioStore = usePetBioStore()

const yearPeriod = ref('last90days')

const apiCalled = ref(false)
const petBioList = ref([])
const alreadyVisited = ref([])
const nextPage = ref(null)

const openPetBioInfoModal = async () => {
  petBioStore.selectPetBio(null)
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {id_customer: props.id_customer, id_pet: props.id_pet})
  await init()
}
const editPetBioInfoModal = async (id_pet_bio_info: number) => {
  petBioStore.selectPetBio(id_pet_bio_info)
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {id_pet_bio_info, id_customer: props.id_customer, id_pet: props.id_pet})
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
const init = async () => {
  await fetchMoreData(false)
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
    const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'pet_bio_info', filterData, true)
    
    if (response && response.data) {
      if (fetchMore) {
        const newData = response.data.filter((item) => 
          { return !petBioList.value.some(existingItem => existingItem.id === item.id) }
        );
        if (!alreadyVisited.value.includes(response.current)) {
          petBioList.value.push(...newData)
          alreadyVisited.value.push(response.current)
        }
      } else {
        petBioList.value = response.data
      }

      petBioList.value = orderBy(petBioList.value, ['datetime_measures', 'datetime_insert'], ['desc', 'desc'])

      nextPage.value = response.next ? parseInt(response.next.split('page=')[1]) : null
    }
  } catch (error) {
    console.error('Error fetching memo carte data:', error)
    await mtUtils.autoCloseAlert('データの取得中にエラーが発生しました')
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
  if (petBioList.value.length === 0) await init()
})
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar"
    style="width: 100%; max-width: 100%"
    @scroll="handleScroll"
    ref="scrollAreaRef"
  >
    <div class="full-width q-pr-lg z-top" :class="props.fixedFilter ? 'bg-white fixed' : ''">
      <div class="flex no-wrap justify-end q-mb-md" style="gap: 13px">
        <div>
          <MtFormRadiobtn v-model="yearPeriod"
                          label="直近90日" val="last90days" @update:selected="()=>{petBioList = []; alreadyVisited = []; nextPage = null; init();}" />
          <MtFormRadiobtn v-model="yearPeriod"
                          class="q-ml-sm" label="今年" val="current" @update:selected="()=>{petBioList = []; alreadyVisited = []; nextPage = null; init();}" />
          <MtFormRadiobtn v-model="yearPeriod"
                          class="q-ml-sm" label="去年" val="last" @update:selected="()=>{petBioList = []; alreadyVisited = []; nextPage = null; init();}" />
          <MtFormRadiobtn v-model="yearPeriod"
                          class="q-ml-sm" label="全期間" val="all" @update:selected="()=>{petBioList = []; alreadyVisited = []; nextPage = null; init();}" />
        </div>
        <q-btn
          unelevated
          padding="6px 14px"
          color="primary"
          text-color="white"
          
          @click="openPetBioInfoModal()"
        >
          <q-icon size="18px" name="add" class="q-mr-xs" />生体情報
        </q-btn>
      </div>
    </div>
    <div class="bg-white  q-px-md q-pb-xs" :class="props.fixedFilter ? 'q-pt-xxl' : ''">
      <MtTable2 v-if="columnBio" :columns="columnBio" :rows="petBioList" :style="{ height: 'calc(100vh - 90px)',  boxShadow: 'none'}"
                class="custody-table">
        <template v-slot:row="{ row }">
          <td class="cursor-pointer" v-for="(col, index) in columnBio" :key="index" @click="editPetBioInfoModal(row.id_pet_bio_info)">
            <div v-if="col.field === 'datetime_measure'">
              {{ formatDateTime(row[col.field]) }}
            </div>
            <div v-else-if="['val_weight'].includes(col.field)">
              <!-- {{row[col.field]}} -->
              {{ parseInt(row[col.field]) ? row.type_body_weight === 1 ? (row[col.field] / 1000).toFixed(2) + ' kg' : parseFloat(row[col.field]).toFixed(2) + ' g' : '-'}}
            </div>
            <div v-else-if="['val_temperature'].includes(col.field)">
              <!-- {{row[col.field]}} -->
              {{ row[col.field] ? parseFloat(row[col.field]).toFixed(1) : '-'}}
            </div>
            <div v-else>
              {{ row[col.field] ? roundZeroAfterPoint(row[col.field]) : '-'}}
            </div>
          </td>
        </template>
      </MtTable2>
      <p v-else class="q-pl-md text-grey-500">
        生体情報はありません。
      </p>
    </div>
  </q-scroll-area>
</template>
