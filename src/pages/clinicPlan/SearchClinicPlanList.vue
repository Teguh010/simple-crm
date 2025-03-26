<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateClinicPlanModal from './UpdateClinicPlanModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import mtUtils from '@/utils/mtUtils'
import useClinicPlanStore from '@/stores/clinic-plan'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import { typePlanStatus } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { getDateToday, getDaysAfter } from '@/utils/aahUtils'
import dayjs from 'dayjs'

const clinicPlanStore = useClinicPlanStore()
const { getClinicPlans } = storeToRefs(clinicPlanStore)

const searchData = ref({
  date_from: getDateToday(),
  date_to: getDaysAfter(1)
})

const columns = [
  {
    name: 'datetime_clinic_plan_start',
    label: '予定日時',
    field: 'datetime_clinic_plan_start',
    align: 'left',
    style: 'width: 20%',
    headerStyle: 'width: 20%'
  },
  {
    name: 'title_clinic_plan',
    label: '予定タイトル',
    field: 'title_clinic_plan',
    align: 'left',
    style: 'width: 12%',
    headerStyle: 'width: 12%'
  },
  {
    name: 'memo_clinic_plan',
    label: '予定内容',
    field: 'memo_clinic_plan',
    align: 'left',
    style: 'width: 20%',
    headerStyle: 'width: 20%'
  },
  {
    name: 'type_plan_status',
    label: '院内予定区分',
    field: 'type_plan_status',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  }
]

const openAddModal = async () => {
  clinicPlanStore.selectClinicPlan(null)
  await mtUtils.mediumPopup(UpdateClinicPlanModal)
}
const onRowClick = async (data) => {
  await mtUtils.mediumPopup(UpdateClinicPlanModal, { data })
}
const search = async () => {
  await clinicPlanStore.fetchClinicPlans({
    id_clinic: id_clinic,
    ...searchData.value
  })
}
const typePlanStatusName = (value: number) => {
  return typePlanStatus.find((v) => v.value === value)?.label
}
onMounted(async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  await clinicPlanStore.fetchClinicPlans({
    id_clinic: id_clinic,
    ...searchData.value
  })

  // set page title
  setPageTitle('院内予定')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          院内予定
        </q-toolbar-title>
        <div class="col-2">
          <MtFormInputDate
            v-model:date="searchData.date_from"
            outlined
            class="q-mx-sm"
            type="date"
            autofocus
            label="公開日：Start"
          />
        </div>
        <div class="col-2">
          <MtFormInputDate
            v-model:date="searchData.date_to"
            outlined
            type="date"
            label="公開日：End"
          />
        </div>
        <q-btn
          @click="search"
          unelevated
          color="grey-100"
          text-color="primary"
          outline
          class="q-mx-sm"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />院内予定
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getClinicPlans"
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
          <div
            v-if="col.field == 'datetime_clinic_plan_start'"
            class="body1 regular"
          >
            {{ dayjs(row.datetime_clinic_plan_start).format("YYYY/MM/DD HH:mm") }}
          </div>
          <div
            v-else-if="col.field == 'title_clinic_plan'"
            class="body1 regular text-grey-700"
          >
            {{ row.title_clinic_plan }}
          </div>
          <div
            v-else-if="col.field == 'type_plan_status'"
            class="body1 regular text-grey-700"
          >
            {{ typePlanStatusName(row.type_plan_status) }}
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
