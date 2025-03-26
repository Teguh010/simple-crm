<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import mtUtils from '@/utils/mtUtils'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCategoryStore from '@/stores/categories'
import { typePdfPrint } from '@/utils/enum'
import usePrintStore from '@/stores/prints'
import useItemStore from '@/stores/items'
import useItemServiceUnitStore from '@/stores/item-service-units'
import { isDateOutOfToday } from '@/utils/aahUtils'

const UpdateCliCommonPrintPdfModal = defineAsyncComponent(
  () => import('./UpdateCliCommonPrintPdfModal.vue')
)

const categoryStore = useCategoryStore()
const cliCommonStore = useCliCommonStore()
const printStore = usePrintStore()
const itemServiceStore = useItemStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const pagination = ref({ rowsPerPage: 0 })
const cliCommonsPrintPdf = ref([])

const columns = [
  {
    name: ' ',
    label: ' ',
    field: ' ',
    align: ' ',
    style: ' '
  },
  {
    name: 'code_func1',
    label: '対応カテゴリ（親）',
    field: 'code_func1',
    align: 'left'
  },
  {
    name: 'text1',
    label: '対応カテゴリ（子）',
    field: 'text1',
    align: 'left'
  },
  {
    name: 'memo_etc1',
    label: '商品名（親）',
    field: 'memo_etc1',
    align: 'left'
  },
  {
    name: 'memo_etc2',
    label: '品名包装単位名',
    field: 'memo_etc2',
    align: 'left'
  },
  {
    name: 'name_cli_common ',
    label: '表示ボタン名',
    field: 'name_cli_common',
    align: 'left'
  },
  {
    name: 'code_func2',
    label: '出力帳票',
    field: 'code_func2',
    align: 'left'
  },
  {
    name: 'text2',
    label: '呼出処理',
    field: 'text2',
    align: 'left'
  }
  // {
  //   name: 'comment',
  //   label: 'メモ',
  //   field: 'comment',
  //   align: 'left'
  // },
  // {
  //   name: 'display_order',
  //   label: '表示順',
  //   field: 'display_order',
  //   align: 'left'
  // }
]

const cliCommonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.smallPopup(UpdateCliCommonPrintPdfModal, {searchCallback: search})
  init()
}
const onRowClick = async (row: any) => {
  const id_category1 = categoryStore.getAllCategories.find((item) => item.code_category == row.code_func1)?.id_category
  const id_category2 = categoryStore.getAllCategories.find((item) => item.code_category == row.text1)?.id_category
  const propsData = {
    ...row,
    id_category1,
    id_category2,
  }
  await mtUtils.smallPopup(UpdateCliCommonPrintPdfModal, { commonObj: propsData, searchCallback: search})
  init()
}

const showPrintName = (value: number | string) => printStore.getAllPrints.find((item) => item.id_print === value)?.name_print
const showTargetModal = (value: string) => typePdfPrint.find((item) => item.value === value)?.label
const showCategory = (value: number) => categoryStore.getAllCategories.find((item) => item.code_category === value)?.name_category
const showItemService = (value: number) => itemServiceStore.getAllServiceItems.find((item) => item.id_item_service == value)?.name_item_service
const showItemServiceUnit = (value: number) => itemServiceUnitStore.getItemServiceUnitList?.find((item) => item.id_item_service_unit == value)?.name_service_item_unit

const init = async () => {
  await Promise.all([
    printStore.fetchPrints(),
    cliCommonStore.fetchPreparationCliCommonList({code_cli_common: [16]}, true),
  ])
}

const search = async () => {
  await cliCommonStore.fetchPreparationCliCommonList({code_cli_common: [16]}, true)
  cliCommonsPrintPdf.value = [ ...cliCommonStore.getCliCommonPrintPdf ].filter((item) => !isDateOutOfToday(item.date_start, item.date_end))
}

onMounted(async () => {
  await init()
  cliCommonsPrintPdf.value = [ ...cliCommonStore.getCliCommonPrintPdf ].filter((item) => !isDateOutOfToday(item.date_start, item.date_end))
  setPageTitle('証明書呼出ケース')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          証明書呼出ケース
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
        表示：<span class="q-ml-sm"> {{ cliCommonStore.getCliCommonPrintPdf.length }} 件</span>
      </div>
      <div class="caption1 regular text-danger">
        <q-icon name="warning" />
        マスタデータの為、責任者のみ編集可能です。
      </div>
    </div>
    <!-- :rows="cliCommonStore.getCliCommonPrintPdf" -->
    <q-table
      :columns="columns"
      :rows="cliCommonsPrintPdf"
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
            <!-- <div v-if="col.field === 'text1'">
              <q-icon
                v-if="
                  CODE_CLI_COMMON_TO_APPLY.includes(search.code_cli_common) &&
                  props.row[col.field]
                "
                size="25px"
                name="circle"
                :color="props.row[col.field]"
              />
              <span v-else>{{ props.row[col.field] }}</span>
            </div> -->
            <div v-if="col.field === 'code_func1'" class="body1 regular text-grey-900">
              {{ props.row[col.field] }} {{ showCategory(props.row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'text1'" class="body1 regular text-grey-900">
              {{ props.row[col.field] }} {{ showCategory(props.row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'memo_etc1'" class="body1 regular text-grey-900">
              {{ showItemService(props.row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'memo_etc2'" class="body1 regular text-grey-900 ellipsis mw-250">
              {{ showItemServiceUnit(props.row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'code_func2'" class="body1 regular text-grey-900">
              {{ showPrintName(props.row[col.field]) }}
            </div>
            <div v-else-if="col.field === 'text2'" class="body1 regular text-grey-900">
              {{ showTargetModal(props.row[col.field]) }}
            </div>
            <div v-else class="body1 regular text-grey-900">
              {{ props.row[col.field] }}
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
