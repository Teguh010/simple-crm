<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateCommonTypeServiceModal from './UpdateCommonTypeServiceModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
import dayjs from 'dayjs'
import useCommonStore from '@/stores/common'

const commonStore = useCommonStore()
const clinicStore = useClinicStore()
const { getCommonTypeServiceOptionList } = storeToRefs(commonStore)
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
    name: 'name_common ',
    label: 'サービス区分',
    field: 'name_common',
    align: 'left'
  },
  {
    name: 'text1',
    label: 'カレンダー表示色',
    field: 'text1',
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

const search = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number,
  code_common: 11,
})

const commonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.smallPopup(UpdateCommonTypeServiceModal, {
    id_clinic: search.value.id_clinic
  })
  init()
}
const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCommonTypeServiceModal, {
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
      id_clinic: [search.value.id_clinic]
    },
    true
  )
  if (response) {
    commonOptionList.value = getCommonTypeServiceOptionList.value
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('サービス区分')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 mobile-hide">
          サービス区分
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
              <span v-if="!dayjs(props.row['date_end']).isAfter(dayjs('9999/01/01'))" class="text-grey-500">
                不使用
              </span>
              <span v-else>
                使用
              </span>
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
