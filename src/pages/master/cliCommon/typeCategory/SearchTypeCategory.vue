<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import UpdateCliCommonTypeCategoryModal from './UpdateCliCommonTypeCategoryModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
// import { isDateOutOfToday } from '@/utils/aahUtils'
import dayjs from 'dayjs'

// const CODE_CLI_COMMON_TO_APPLY = [10, 11, 17, 18, 19, 20, 21, 22, 23, 24, 25]
const cliCommonStore = useCliCommonStore()
const clinicStore = useClinicStore()
const { getCliCommonTypeCategoryList } = storeToRefs(cliCommonStore)
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
    name: 'name_cli_common ',
    label: '性格・注意事項',
    field: 'name_cli_common',
    align: 'left'
  },
  {
    name: 'flg_func1',
    label: '機能1',
    field: 'flg_func1',
    align: 'left'
  },
  // {
  //   name: 'code_func1',
  //   label: '機能CD1',
  //   field: 'code_func1',
  //   align: 'left'
  // },
  {
    name: 'text1',
    label: '表示色',
    field: 'text1',
    align: 'left'
  },
  {
    name: 'flg_func2',
    label: '機能2',
    field: 'flg_func2',
    align: 'left'
  },
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
  // {
  //   name: 'comment',
  //   label: '説明',
  //   field: 'comment',
  //   align: 'left'
  // },
  {
    name: 'active',
    label: 'Active',
    field: 'active',
    align: 'left'
  }
  // {
  //   name: 'display_order',
  //   label: '表示順',
  //   field: 'display_order',
  //   align: 'left'
  // }
]

const search = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number,
  code_cli_common: 20,
  code_func1: 1,
  type_unit_bit: null
})

const cliCommonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.smallPopup(UpdateCliCommonTypeCategoryModal, {
    id_clinic: search.value.id_clinic
  })
  init()
}
const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCliCommonTypeCategoryModal, {
    commonObj: row,
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
    cliCommonOptionList.value = getCliCommonTypeCategoryList.value

    // cliCommonOptionList.value = getCliCommonTypePetNatureList.value.filter(
    //   (item) => !isDateOutOfToday(item.date_start, item.date_end)
    // )
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('ペット性格')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 mobile-hide">
          ペット性格
        </q-toolbar-title>
        <!-- <div class="row mobile-hide">
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
                  ペット性格
                </q-btn>
              </form>
            </div>
          </div>
        </div> -->
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        表示：<span class="q-ml-sm"> {{ cliCommonOptionList.length }} 件</span>
      </div>
      <div class="caption1 regular text-danger">
        <q-icon name="warning" />
        項目追加はできません。マスタデータの為、責任者のみ編集可能です。
      </div>
    </div>
    <q-table
      :columns="columns"
      :rows="cliCommonOptionList"
      :rowsBg="true"
      :style="{ height: 'calc(100vh - 90px)' }"
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
            <div v-else-if="col.field === 'active'">
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
