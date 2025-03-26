<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable from '@/components/MtTable.vue'
import UpdateCommonTypeAnimalColorModal from '@/pages/master/common/UpdateCommonTypeAnimalColorModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCommonStore from '@/stores/common'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import dayjs from 'dayjs'

const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const commonTypeAnimal = 1

const columns = [
  {
    name: 'name_common ',
    label: '動物種',
    field: 'name_common',
    align: 'left'
  },
  {
    name: 'text1',
    label: 'アイコン色',
    field: 'text1',
    align: 'left'
  },
  {
    name: 'active',
    label: '使用状況',
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

const init = async () => {
  await commonStore.fetchPreparationCommonList({code_common: [commonTypeAnimal]}, true)
}

const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCommonTypeAnimalColorModal, {
    commonObj: row,
    code_common: 1
  })
  init()
}

onMounted(async () => {
  await init()
  setPageTitle('主要マスタ')
})
</script>

<template>
   <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          動物種別
        </q-toolbar-title>
      </q-toolbar>
    </MtHeader>
    <MtTable
      :columns="columns"
      :rows="getCommonTypeAnimalOptionList"
      :rowsBg="true"
      :style="{ height: 'calc(100dvh - 90px)' }"
      flat
    >
      <template v-slot:row="{ row, index, columns }">
        <q-td
          v-for="(col, index) in columns"
          :style="col.style"
          class="cursor-pointer"
          @click="onRowClick(row)"
        >
          <div v-if="col.field === 'text1'">
            <q-icon
              v-if="row[col.field]"
              size="25px"
              name="circle"
              :color="row.text1"
              :style="{ 'color': row.text1 }"
            />
            <span v-else>{{ row[col.field] }}</span>
          </div>
          <div v-else-if="col.field === 'active'">
            <!-- compare date end of each row to yesterday's date -->
            <span v-if="!dayjs(row['date_end']).isAfter(dayjs().subtract(1,'days').format('YYYY/MM/DD'))" class="text-grey-500">
              不使用
            </span>
            <span v-else>
              使用
            </span>
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </q-td>
      </template>
    </MtTable>
  </q-page>  
</template>