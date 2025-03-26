<script lang="ts" setup>
import { onMounted, ref, computed, defineAsyncComponent } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import mtUtils from '@/utils/mtUtils'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { isDateOutOfToday } from '@/utils/aahUtils'
import useItemStore from '@/stores/items'
import useItemServiceUnitStore from '@/stores/item-service-units'

const UpdateCliCommonautoPriceCalculationModal = defineAsyncComponent(
  () => import('./UpdateCliCommonautoPriceCalculationModal.vue')
)

const cliCommonStore = useCliCommonStore()
const pagination = ref({ rowsPerPage: 0 })
const itemStore = useItemStore()
const cliCommons_ = ref([])
const itemServiceUnitStore = useItemServiceUnitStore()

interface ItemService {
  id_item_service: number
  name_item_service: string
  flg_plus_item: boolean
  flg_merge_price: boolean
}

interface ItemServiceUnit {
  id_item_service_unit: number
  name_service_item_unit: string
  value: number
}

const itemServiceRaw = ref<ItemService[]>([])
const itemServiceUnitRaw = ref<ItemServiceUnit[]>([])
const requiredItemServices = ref<ItemService[]>([])
const requiredItemServiceUnits = ref<ItemServiceUnit[]>([])

const columns = [
  {
    name: 'name',
    label: '名前',
    field: 'name',
    align: 'left', 
  },
  {
    name: 'IS',
    label: '商品名',
    field: 'IS',
    align: 'left', 
  },
  {
    name: 'ISU',
    label: '品名包装単位',
    field: 'ISU',
    align: 'left', 
  },
  {
    name: 'frequency',
    label: '初期値設定',
    field: 'frequency',
    align: 'left', 
  }  
]

const openAddModal = async (params = null) => {
  // await mtUtils.smallPopup(UpdateTackSealModal, {mode: 'print'})
  await mtUtils.smallPopup(UpdateCliCommonautoPriceCalculationModal, {searchCallback: search})
}

const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCliCommonautoPriceCalculationModal, { commonObj: row, searchCallback: search})
}

const search = async () => {
  try {
    // Fetch data preparation
    const response = await cliCommonStore.fetchPreparationCliCommonList({code_cli_common: [22]}, true)
    
    // Update required data from response
    if (response?.data?.options) {
      requiredItemServices.value = response.data.options.item_service_list
      requiredItemServiceUnits.value = response.data.options.item_service_unit_list
    }

    // Update cli commons
    cliCommons_.value = [ ...cliCommonStore.cliCommonAutoPriceCalculation ]
      .filter(item => !isDateOutOfToday(item.date_start, item.date_end))

    // Fetch additional data
    await Promise.all([
      itemStore.fetchFilterItems({ flg_merge_price: true, flg_plus_item: true }),
      itemServiceUnitStore.fetchItemServiceUnits({})
    ])

    // Update raw data
    itemServiceRaw.value = itemStore.getAllItems
      .filter(is => is.flg_plus_item || is.flg_merge_price)
    itemServiceUnitRaw.value = itemServiceUnitStore.getItemServiceUnitOptions
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const findItemServiceName = (code: string) => {
  return itemServiceRaw.value.find(is => is.id_item_service == code)?.name_item_service
}

const findItemServiceUnitName = (code: string) => {
  return requiredItemServiceUnits.value.find(
    isu => isu.id_item_service_unit == code
  )?.name_service_item_unit
}

const getFrequencyText = (text: string) => {
  switch(text) {
    case '1': return '1'
    case '2': return '日数で指定'
    default: return '回数で指定'
  }
}

onMounted(async () => {
  await search()
  setPageTitle('処方料金設定')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          処方料の初期数量設定
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <form class="flex items-center no-wrap">
                <q-btn
                  class="q-ml-sm"
                  color="grey-800"
                  text-color="white"
                  unelevated
                  @click="openAddModal"
                >
                  <q-icon name="add" size="20px" />
                  ケース
                </q-btn>
              </form>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        <span class="q-ml-sm"></span>
      </div>
      <div class="caption1 regular text-danger">
      </div>
    </div>
    <q-table
      :columns="columns"
      :rows="cliCommons_"
      :rowsBg="true"
      :style="{ height: 'calc(100dvh - 90px)' }"
      flat
      :rows-per-page-options="[0]"
      hide-bottom
      v-model:pagination="pagination"
    >
      <template v-slot:header="props">
        <q-tr :props="props" class="sticky-header">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" class="cursor-pointer">
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :style="col.style"
            @click="onRowClick(props.row)"
          >
            <div 
              class="body1 regular text-grey-900"
              v-if="col.field === 'name'"
            >
              {{ props.row.name_cli_common }}
            </div>
            
            <div 
              class="body1 regular text-grey-900"
              v-else-if="col.field === 'IS'"
            >
              {{ findItemServiceName(props.row.code_func1) }}
            </div>
            
            <div 
              class="body1 regular text-grey-900"
              v-else-if="col.field === 'ISU'"
            >
              {{ findItemServiceUnitName(props.row.code_func2) }}
            </div>
            
            <div 
              class="body1 regular text-grey-900"
              v-else-if="col.field === 'frequency'"
            >
              {{ getFrequencyText(props.row.text1) }}
            </div>
          </q-td>
        </q-tr>
      </template>

    </q-table>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}

.mw-250 {
  max-width: 250px;
}
</style>
