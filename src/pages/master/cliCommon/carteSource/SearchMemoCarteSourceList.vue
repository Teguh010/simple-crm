<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import UpdateCliCommonCarteSourceModal from './UpdateCliCommonCarteSourceModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { typeMemoCarteSource } from '@/utils/enum'
import useClinicStore from '@/stores/clinics'
import { isDateOutOfToday } from '@/utils/aahUtils'

const cliCommonStore = useCliCommonStore()
const clinicStore = useClinicStore()
const { getCliCommonTypeCarteSourceList } = storeToRefs(cliCommonStore)
const pagination = ref({ rowsPerPage: 0 })

const columns = [
  {
    name: ' ',
    label: ' ',
    field: ' ',
    align: ' ',
    style: ' '
  },
  {
    name: 'name_cli_common ',
    label: 'カルテ種別',
    field: 'name_cli_common',
    align: 'left'
  },
  {
    name: 'code_func2',
    label: '連携区分',
    field: 'code_func2',
    align: 'left'
  },
  {
    name: 'text1',
    label: 'カルテ背景色',
    field: 'text1',
    align: 'left'
  },
  {
    name: 'comment',
    label: '説明',
    field: 'comment',
    align: 'left'
  },
  {
    name: 'display_order',
    label: '表示順',
    field: 'display_order',
    align: 'left'
  }
]

const search = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number,
  code_cli_common: 11,
  code_func1: 1,
  type_unit_bit: null
})

const cliCommonOptionList: any = ref([])

const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCliCommonCarteSourceModal, {
    commonObj: row,
    id_clinic: search.value.id_clinic
  })
  init()
}

const codeFunc2LabelMap = typeMemoCarteSource.reduce((map, item) => {
  map[item.value] = item.label
  return map
}, {} as Record<number, string>)

const init = async () => {
  cliCommonOptionList.value = []
  const response = await cliCommonStore.fetchPreparationCliCommonList(
    {
      code_cli_common: [search.value.code_cli_common],
      id_clinic: [search.value.id_clinic]
    },
    true
  )
  if (response) {
    cliCommonOptionList.value = getCliCommonTypeCarteSourceList.value
      .filter((item) => !isDateOutOfToday(item.date_start, item.date_end))
      .map((item) => {
        return {
          ...item,
          code_func2Label: codeFunc2LabelMap[item.code_func2] || item.code_func2,
        }
      })
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('カルテ種別')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          カルテ種別
        </q-toolbar-title>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        表示：<span class="q-ml-sm"> {{ cliCommonOptionList.length }} 件</span>
      </div>
      <div class="caption1 regular text-danger">
        <q-icon name="warning" />
        区分名・背景色を変更できます。マスタデータの為、責任者のみ編集可能です。
      </div>
    </div>
    <q-table
      :columns="columns"
      :rows="cliCommonOptionList"
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
            <div v-if="col.field === 'text1'">
              <q-icon
                size="25px"
                name="circle"
                :color="props.row[col.field]"
                :style="{ color: props.row[col.field] }"
              />
            </div>
             <div v-else-if="col.field === 'code_func2'" class="body1 regular text-grey-900">
                {{ props.row.code_func2Label }}
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
</style>
