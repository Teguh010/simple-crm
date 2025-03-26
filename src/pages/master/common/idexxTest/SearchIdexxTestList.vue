<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import UpdateCommonIdexxTestModal from './UpdateCommonIdexxTestModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
import dayjs from 'dayjs'
import useCommonStore from '@/stores/common'

const commonStore = useCommonStore()
const clinicStore = useClinicStore()
const pagination = ref({ rowsPerPage: 0 })
const search = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number,
  code_common: 31,
  code_func1: 1,
  type_unit_bit: null
})
const commonOptionList: any = ref([])

const columns = [
  {
    name: ' ',
    label: ' ',
    field: ' ',
    align: ' ',
    style: ' '
  },
  {
    name: 'name_common ',
    label: '検査項目',
    field: 'name_common',
    align: 'left'
  },
  {
    name: 'memo_etc1',
    label: '区分',
    field: 'memo_etc1',
    align: 'left'
  },
  {
    name: 'active',
    label: 'Active',
    field: 'active',
    align: 'left'
  },
  {
    name: 'display_order',
    label: '表示順',
    field: 'display_order',
    align: 'left'
  }
]

const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCommonIdexxTestModal, {
    commonObj: row,
    id_clinic: search.value.id_clinic
  })
  init()
}

const init = async () => {
  commonOptionList.value = []
  const response = await commonStore.fetchPreparationCommonList(
    {
      code_common: [search.value.code_common],
      id_clinic: [search.value.id_clinic],
      flg_etc3: true
    },
    true
  )
  if (response) {
    commonOptionList.value = commonStore.getCommonIdexxSearchList
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('IDEXX検査項目')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          IDEXX 検査項目
        </q-toolbar-title>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        表示：<span class="q-ml-sm"> {{ commonOptionList.length }} 件</span>
      </div>
      <div class="caption1 regular text-danger">
        <q-icon name="warning" />
        項目追加はできません。マスタデータの為、責任者のみ編集可能です。
      </div>
    </div>
    <q-table
      :columns="columns"
      :rows="commonOptionList"
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
            <div v-if="col.field === 'active'">
              <span
                v-if="!dayjs(props.row['date_end']).isSame(dayjs('9999/12/31'))"
                class="text-grey-500"
              >
                不使用
              </span>
              <span v-else> 使用 </span>
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
