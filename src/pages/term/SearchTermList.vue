<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import mtUtils from '@/utils/mtUtils'
import useTerm from '@/stores/term'
import UpdateTermModal from './UpdateTermModal.vue'
import { storeToRefs } from 'pinia'
import { formatDate, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtTable2 from '@/components/MtTable2.vue'
import { event_bus } from '@/utils/eventBus'
import { typeReserved } from '@/utils/enum'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { TermType } from '@/types/types'

const termStore = useTerm()
const searchData = ref({
  date_start: null,
  date_end: null,
  title_term: null,
  type_reserve: null
})
const columns = [
  {
    name: 'type_reserve',
    label: '仮予約種別',
    field: 'type_reserve',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'flg_available',
    label: '利用状況',
    field: 'flg_available',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'title_term',
    label: 'タイトル',
    field: 'title_term',
    align: 'left',
    style: 'width: 75%'
  }
]

const openAddModal = async () => {
  termStore.selectTerm(null)
  await mtUtils.popup(UpdateTermModal, {searchData: searchData.value})
}

const onRowClick = async (data: TermType) => {
  await mtUtils.popup(UpdateTermModal, {searchData: searchData.value, data: data})
}

const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  termStore.fetchTerms({
    date_start: searchData?.value?.date_start,
    date_end: searchData?.value?.date_end,
    id_clinic: id_clinic,
    title_term: searchData?.value?.title_term,
    type_reserve: searchData?.value?.type_reserve
  })
}

const init = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  await termStore.fetchTerms({
    date_start: searchData?.value?.date_start,
    date_end: searchData?.value?.date_end,
    id_clinic: id_clinic,
    title_term: searchData?.value?.title_term,
    type_reserve: searchData?.value?.type_reserve
  })
}

onMounted(async () => {
  await init()

  setPageTitle('仮予約 利用規約')
})

event_bus.on('taskAdded', async () => {
  await init()
})
</script>
<template>
  <q-page>
    <MtHeader>
      <q-toolbar>
        <q-toolbar-title class="title2 bold text-grey-900">
          仮予約 利用規約
        </q-toolbar-title>
        <!-- <q-space /> 
        <div class="row justify-end">
          <div class="col-2">
            <MtInputForm
              class="q-mx-sm"
              type="text"
              v-model="searchData.title_term"
              outlined
              label="タイトル"
            />
          </div>
          <div class="col-2">
            <MtFormPullDown
              class="q-mx-sm col-2"
              outlined
              :options="typeReserved"
              v-model="searchData.type_reserve"
              label="カルテ区分"
            />
          </div>
          <q-btn
            @click="search"            
            unelevated
            color="grey-800"
            tabindex="3"
            text-color="white"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
          <q-btn            
            unelevated
            color="primary"
            class="q-mx-sm"
            text-color="white"
            @click="openAddModal"
          >
            <q-icon size="20px" name="add" />タスク
          </q-btn>
        </div>-->
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="termStore.getTerms"
      :rowsBg="true"
      class="custody-table"
      :style="{ height: 'calc(100vh - 90px)', boxShadow: 'none' }"
      flat
      no-data-message="登録がありません。"
      no-result-message="該当のデータが見つかりませんでした"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          @click="onRowClick(row)"
          class="cursor-pointer"
          :class="[]"
        >
          <div v-if="col.field == 'datetime_insert'" class="body1 regular text-grey-700">
            {{ formatDate(row.datetime_insert) }}
          </div>
          <div v-else-if="col.field == 'type_reserve'" class="body1 regular text-grey-700">
            {{ typeReserved.find(item => item.value == row.type_reserve)?.label }} 
          </div>
          <div v-else-if="col.field == 'title_term'" class="body1 regular text-grey-700">
            {{ row.title_term  }}
          </div>
          <div v-else-if="col.field == 'flg_available'" class="body1 regular text-grey-700">
            <q-icon  v-if="row.flg_available" name="check"/>
            <q-icon v-else name="close"/>
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
</style>
