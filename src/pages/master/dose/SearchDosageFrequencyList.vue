<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateDosageFrequencyModal from './UpdateDosageFrequencyModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import useDoseStore from '@/stores/dose-frequencies'
import _ from 'lodash'
import MtTable2 from '@/components/MtTable2.vue'
import { typeDose } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'

const doseStore = useDoseStore()
const { getDoses } = storeToRefs(doseStore)

const columns = [
  {
    name: 'name_dose_formal',
    label: '表記名',
    field: 'name_dose_formal',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'name_dose_short',
    label: '簡易名',
    field: 'name_dose_short',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'type_dose',
    label: '連続服用 区分',
    field: 'type_dose',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'quantity_dose',
    label: '累計服用回数/日',
    field: 'quantity_dose',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'memo_dose',
    label: '説明',
    field: 'memo_dose',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'empty',
    label: '',
    field: 'empty',
    align: 'center',
    style: 'width: 40%',
    headerStyle: 'width: 40%'
  }
]

const openAddModal = async () => {
  doseStore.selectDose(null)
  await mtUtils.smallPopup(UpdateDosageFrequencyModal)
}

const onRowClick = async (data: any) => {
  doseStore.selectDose(data.id_dose)
  await mtUtils.smallPopup(UpdateDosageFrequencyModal, { data })
}
const typeDoseName = (value: any) => typeDose.find((v) => v.value === value)?.label
onMounted(() => {
  const id_clinic = JSON.parse(sessionStorage.getItem('id_clinic'))
  doseStore.fetchDoses({id_clinic: id_clinic})

  setPageTitle('服用頻度 一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          服用頻度 一覧
        </q-toolbar-title>
        <q-btn
          v-permission
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="20px" name="add" />服用頻度
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="_.orderBy(
          getDoses,
          ['display_order', 'id_dosage_frequency'],
          ['asc', 'asc']
        )
      "
      :rowsBg="true"
      class="custody-table q-pt-sm"
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
        >
          <div v-if="col.field == 'type_dose'" class="body1 regular text-grey-700">
            {{ typeDoseName(row.type_dose) }}
          </div>
          <div v-else-if="col.field == 'empty'"></div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
