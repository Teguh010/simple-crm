<script setup lang="ts">
import MtInputForm from '@/components/form/MtInputForm.vue'
import useMemoCarteStore from '@/stores/memo-cartes'
import useCliCommonStore from '@/stores/cli-common'
import { dateFormat, truncateAndSearch } from '@/utils/aahUtils'
import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'

const emits = defineEmits(['setMemoCarteContent'])
const memoCarteStore = useMemoCarteStore()
const cliCommonStore = useCliCommonStore()
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()

const { getFilteredMemoCartesV1 } = storeToRefs(memoCarteStore)
const memoCarteSearch = ref('')
const isSearch = ref(false)
const selectedMemo = ref(null);
const aggregatedMemoCartes = ref([])
const memoCarteList = ref([])
const memoCarteInitList = ref([])

const currentPage = ref(1)
const pageSize = ref(50) 
const props = defineProps({
  id_pet: String,
  id_customer:String
});
import {
  CliCommon,
} from '@/types/types'
import { api } from '@/boot/axios'
const {
  getCliCommonOptionList,
} = storeToRefs(cliCommonStore)
const set = (memo) => {
  closeSearchMemoCarte()
  emits('setMemoCarteContent', memo)
}
const searchMemoCarte = () => {
  isSearch.value = true
  memoCarteList.value = memoCarteInitList.value.filter((v) =>
    v.memo_sbj.toLowerCase().includes(memoCarteSearch.value.toLowerCase())
  )
}
const closeSearchMemoCarte = () => {
  isSearch.value = false
}

const getMemoCarteBgColor = (memoCarte: any) => {
  if (memoCarte) {
    const cli = getCliCommonOptionList.value.find(
      (v: CliCommon) => v.id_cli_common == memoCarte?.id_cli_common
    )
    return cli ? cli.text1 : 'memo-carte'
  }
  return 'memo-carte'
}
const getLabel = (memoCarte: any) => {
  if (memoCarte) {
    const cli = getCliCommonOptionList.value.find(
      (v: CliCommon) => v.id_cli_common == memoCarte?.id_cli_common
    )
    return cli ? cli.label : ''
  }
  return ''
}
const fetchCustomer = async (memoCarte: any) => {
  if (!memoCarte || !memoCarte.id_employee) return 'memo-carte'
  const employee = employeeStore.employees.find(
    (emp) => emp.id_employee === memoCarte.id_employee
  )
  if (employee) {
    return employee.name_display || ''
  }
  return ''
}


const formatDate = (dateString: string) => {
  const dt = new Date(dateString)
  const year = dt.getFullYear()
  const month = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function stripHtmlTags(input: any) {
  if (!input) return "";
  const maxLength = 40
  const doc = new DOMParser().parseFromString(input, 'text/html')
  const text = doc.body.textContent || ""
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

const handleClick = (memo: any) => {
  selectedMemo.value = memo.id_memo_carte; 
  const dt_insert = new Date(memo.datetime_memo_carte);
  const dt= memo.datetime_memo_carte
  const formattedDate = formatDate(dt_insert.toISOString()); 
  const filterData = getFilteredMemoCartesV1?.value[formattedDate]?.others[memo.datetime_memo_carte];
  const clinicalFile =  getFilteredMemoCartesV1?.value[formattedDate]?.clinical_file_list;
  const filterFiles = clinicalFile?.filter(
    (v) => v.datetime_receive == dt
  )
  emits('setMemoCarteContent', {
    id_memo_carte: memo.id_memo_carte,
    filterFiles,
    filterData,
    memo,
  });
}; 

// --- Generic function to fetch memo cartes until a minimum number of valid records is obtained ---
// aggregator: ref holding an array
// minRequired: number of valid records to accumulate
const fetchMemoCarteCustom = async (params: any) => {
  try {
    const response = await api.get(`/cartes`, { params })
    return response.data.data || []
  } catch (error) {
    console.error("Error in custom fetchMemoCarte:", error)
    return []
  }
}
const fetchMemoCartesUntil = async (minRequired: number, aggregator: any) => {
  const initialCount = aggregator.value.length
  while ((aggregator.value.length - initialCount) < minRequired) {
    const params = {
      id_pet: props.id_pet,
      id_customer: props.id_customer,
      page_size: pageSize.value,
      page: 1,
      illnessHistoryList: JSON.stringify([]),
      id_clinic: 2,
      clinic_list: JSON.stringify([]),
    }
    try {
      await fetchMemoCarteCustom(params)
      const fetchedRecords = memoCarteStore.memo_cartes.map((memo) => ({ ...memo }))
      if (fetchedRecords.length === 0) {
        break
      }
      await Promise.all(
        fetchedRecords.map(async (memo) => {
          memo.customerName = await fetchCustomer(memo)
        })
      )
      aggregator.value = aggregator.value.concat(fetchedRecords)
      if ((aggregator.value.length - initialCount) < minRequired) {
        currentPage.value++
      } else {
        break
      }
    } catch (error) {
      console.error("Error fetching memo cartes:", error)
      break
    }
  }
}

// For the initial load, we want at least 20 valid records.
// We start with page_size 50. If fewer than 20 valid records come back,
// fetchMemoCartesUntil will automatically fetch additional pages.
onMounted(async () => {
  aggregatedMemoCartes.value = []
  pageSize.value = 30
  currentPage.value = 1
  await fetchMemoCartesUntil(20, aggregatedMemoCartes)
  memoCarteList.value = removeDuplicates(aggregatedMemoCartes.value);
  memoCarteInitList.value = memoCarteList.value;
});


const removeDuplicates = (memoCartes) => {
  const uniqueMemoCartes = [];
  const seenIds = new Set();
  
  for (const memo of memoCartes) {
    if (!seenIds.has(memo.id_memo_carte)) {
      seenIds.add(memo.id_memo_carte);
      uniqueMemoCartes.push(memo);
    }
  }
  
  return uniqueMemoCartes;
};

// --- loadMoreItems ---
// When the user clicks the “+10件” button, we want 10 additional valid records.
const loadMoreItems = async () => {
  const newBatch = ref([]);
  pageSize.value += 10; // Increase page size instead of changing pages

  await fetchMemoCartesUntil(10, newBatch);

  if (newBatch.value.length > 0) {
    aggregatedMemoCartes.value = removeDuplicates([...aggregatedMemoCartes.value, ...newBatch.value]);
    memoCarteList.value = aggregatedMemoCartes.value;
    memoCarteInitList.value = aggregatedMemoCartes.value;
    itemsToShow.value = aggregatedMemoCartes.value.length;
  }
}

const itemsToShow = ref(20)
const displayedMemoCarteList = ref([])
watch([memoCarteList, itemsToShow], () => {
  displayedMemoCarteList.value = memoCarteList.value.slice(0, itemsToShow.value)
}, { immediate: true })
</script>

<template>
  <div style="z-index: 10;">
    <q-form @submit.prevent="searchMemoCarte" class="flex no-wrap q-mb-sm q-mt-sm">
      <MtInputForm
        type="text"
        class="full-width q-mr-sm"
        v-model="memoCarteSearch"
        @updatedValue="searchMemoCarte()"
      />
      <q-btn type="submit">
        <q-icon name="search" size="10" />
      </q-btn>
    </q-form>
    <q-scroll-area style="width: 100%; max-width: 100%; height: calc(100vh - 200px)">
      <q-list dense>
        <q-item
          v-for="(memo, index) in displayedMemoCarteList"
          :key="index"
          @click="handleClick(memo)"
          clickable
          v-ripple

        >
          <q-item-section
            :class="'bg-' + getMemoCarteBgColor(memo)"
            :style="{ backgroundColor: getMemoCarteBgColor(memo) }"
            style="padding:6px;"
          >
            <div :class="{ 'selected-row': selectedMemo === memo.id_memo_carte }" class="q-pa-none q-ma-none body1">
              <div class="row-container">
                <span class="text-grey-500">{{ dateFormat(memo.datetime_memo_carte) }}</span>
                <span  class="text-white bg-[#424242]" style="display: inline-block; margin-right: 8px; background-color:#424242; padding: 1px 5px; border-radius:4px; font-size:13px" >{{ getLabel(memo) }}</span>
                <span   class="text-grey-500">{{ memo.customerName }}</span>
                <span 
                  v-if="memo.pet_illness_history_list.length > 0" 
                  class="illness text-grey-500" 
                >
                  {{ memo.pet_illness_history_list.map(item => item.name_disease).join(' , ') }}
                </span>
              </div>
              <span class="text-grey-500 illness" style="font-size:13px">
                {{ stripHtmlTags(memo.memo_sbj) }}
              </span>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <q-btn
        @click="loadMoreItems"
        class="q-mt-sm flex justify-center items-center"
        style="margin: 0 auto; margin-bottom: 40px; background-color: transparent; box-shadow: none; color: #333;"
        flat
      >
        <q-icon name="arrow_drop_down" size="24px" />
        <span style="margin-left: 5px; font-size: 14px; color: #333;">+10件</span>
      </q-btn>
    </q-scroll-area>
  </div>
</template>
<style scoped>
.selected-row {
  font-weight: bold;
  background-color: lightgray;
}
.row-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 335px;
  overflow: hidden;  
  white-space: nowrap;
}

.row-container span {
  font-size: 13px;
  margin-right: 8px;
  white-space: nowrap;
}

.illness {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
