<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import mtUtils from '@/utils/mtUtils'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { isDateOutOfToday } from '@/utils/aahUtils'

const UpdateTackSealModal = defineAsyncComponent(
  () => import('./UpdateTackSealModal.vue')
)

const cliCommonStore = useCliCommonStore()
const pagination = ref({ rowsPerPage: 0 })
const cliCommonsTackSeal = ref([])

const columns = [
  {
    name: 'name',
    label: '名前',
    field: 'name',
    align: 'left', 
  },
  {
    name: 'horizontal_position',
    label: '水平位置',
    field: 'horizontal_position',
    align: 'left', 
  },
  {
    name: 'vertical_position',
    label: '垂直位置',
    field: 'vertical_position',
    align: 'left', 
  },
  {
    name: 'paper_orientation',
    label: '用紙の向き',
    field: 'paper_orientation',
    align: 'left', 
  },
  {
    name: 'csv_columns',
    label: '選択する列',
    field: 'csv_columns',
    align: 'left', 
  }
]


const openAddModal = async (params = null) => {
  // await mtUtils.smallPopup(UpdateTackSealModal, {mode: 'print'})
  console.log(": upd/cre")
  await mtUtils.smallPopup(UpdateTackSealModal, {searchCallback: search})
}

const openTackSealPrintModal = () => {
 mtUtils.smallPopup(UpdateTackSealModal, { mode: 'print' })
}

const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateTackSealModal, { data: row, searchCallback: search})
}

const search = async () => {
  await Promise.all([
    cliCommonStore.fetchPreparationCliCommonList({code_cli_common: [21]}, true),
  ])
  cliCommonsTackSeal.value = [ ...cliCommonStore.cliCommonTackSeal ].filter((item) => !isDateOutOfToday(item.date_start, item.date_end))
}

onMounted(async () => {
  await search()
  setPageTitle('タックシール')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          タックシール
        </q-toolbar-title>
        <div class="row">
          <div class="col-12 row">
          <q-btn class="bg-grey-300 text-grey-800" @click="openTackSealPrintModal" label="タックシール" flat>
          </q-btn>
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
    <!-- :rows="cliCommonStore.getCliCommonPrintPdf" -->
    <q-table
      :columns="columns"
      :rows="cliCommonsTackSeal"
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
            v-for="(col, index) in props.cols"
            :style="col.style"
            @click="onRowClick(props.row)"
          >
            <div v-if="col.field === 'name'" class="body1 regular text-grey-900">
              {{ props.row.name_cli_common }}
            </div>
            <div v-if="col.field === 'horizontal_position'" class="body1 regular text-grey-900">
              {{ props.row.code_func1.split(',')[4] == 1 ? '中央' : props.row.code_func1.split(',')[4] == 2 ? '左寄せ' : '右寄せ' }}
            </div>
            <div v-if="col.field === 'vertical_position'" class="body1 regular text-grey-900">
              {{ props.row.code_func1.split(',')[10] == 1 ? '上' : props.row.code_func1.split(',')[4] == 2 ? '中心' : '底' }}
            </div>
            <div v-if="col.field === 'paper_orientation'" class="body1 regular text-grey-900">
              {{ props.row.code_func1.split(',')[5] == 1 ? '横方向' : '縦方向' }}
            </div>
            <div v-if="col.field === 'csv_columns'" class="body1 regular text-grey-900">
              {{ props.row.code_func2 }}
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
