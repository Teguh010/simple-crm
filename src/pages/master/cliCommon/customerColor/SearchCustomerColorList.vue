<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import UpdateCliCommonCustomerColorModal from './UpdateCliCommonCustomerColorModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
import { isDateOutOfToday } from '@/utils/aahUtils'

const cliCommonStore = useCliCommonStore()
const clinicStore = useClinicStore()
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)
const pagination = ref({ rowsPerPage: 0 })

const columns = [
  // {
  //   name: 'code_cli_common',
  //   label: 'CODE',
  //   field: 'code_cli_common',
  //   align: 'left',
  //   style: 'width: 100px'
  // },
  {
    name: ' ',
    label: ' ',
    field: ' ',
    align: ' ',
    style: ' '
  },
  {
    name: 'code_func1',
    label: 'オーナー区分CD',
    field: 'code_func1',
    align: 'left'
  },
  {
    name: 'name_cli_common ',
    label: 'オーナー区分名',
    field: 'name_cli_common',
    align: 'left'
  },
  // {
  //   name: 'flg_func1',
  //   label: '機能1',
  //   field: 'flg_func1',
  //   align: 'left'
  // },
  {
    name: 'text1',
    label: '● 表示色',
    field: 'text1',
    align: 'left'
  },
  // {
  //   name: 'flg_func2',
  //   label: '機能2',
  //   field: 'flg_func2',
  //   align: 'left'
  // },
  // {
  //   name: 'code_func2',
  //   label: '機能CD2',
  //   field: 'code_func2',
  //   align: 'left'
  // },
  // {
  //   name: 'text2',
  //   label: '機能名2',
  //   field: 'text2',
  //   align: 'left'
  // },
  {
    name: 'comment',
    label: '院内説明',
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
  code_cli_common: 3,
  code_func1: 1,
  type_unit_bit: null
})

const cliCommonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.smallPopup(UpdateCliCommonCustomerColorModal, {
    id_clinic: search.value.id_clinic,
    lastCD: parseInt(
      cliCommonOptionList.value[cliCommonOptionList.value.length - 1].code_func1
    ),
    code_cli_common: search.value.code_cli_common
  })
  init()
}
const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCliCommonCustomerColorModal, {
    commonObj: row,
    lastCD: parseInt(
      cliCommonOptionList.value[cliCommonOptionList.value.length - 1].code_func1
    ),
    id_clinic: search.value.id_clinic
  })
  init()
}

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
    cliCommonOptionList.value = getCliCommonCustomerColorList.value.filter(
      (item) => !isDateOutOfToday(item.date_start, item.date_end)
    )
  }
}

const getColorValue = (value: String | undefined) => { 
  if (!value) { 
    return {};
  }
  if (value.startsWith('rgb') || value.startsWith('#')) { 
    return {
      style: `color: ${value};`
    }
  }
  return {
    color: value
  };
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('オーナー区分')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          オーナー区分
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
                  オーナー色
                </q-btn>
              </form>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        表示：<span class="q-ml-sm"> {{ cliCommonOptionList.length }} 件</span>
      </div>
      <div class="caption1 regular text-danger">
        <q-icon name="warning" />
        オーナー区分CDの重複禁止、マスタデータの為、責任者のみ編集可能です。
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
            :key="index"
            :style="col.style"
            @click="onRowClick(props.row)"
          >
            <div v-if="col.field === 'text1'">
              <q-icon size="25px" name="circle" v-bind="getColorValue(props.row[col.field])" />
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
