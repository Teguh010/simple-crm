<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateBusinessHourSlotModal from './UpdateBusinessHourSlotModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import MtTable2 from '@/components/MtTable2.vue'
import { typeBusinessDay } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'

const businessHourSlot = useBusinessHourSlot()
const { getBusinessHourSlots } = storeToRefs(businessHourSlot)

const columns = [
  {
    name: 'type_business_day',
    label: '診療日区分',
    field: 'type_business_day',
    align: 'left'
  },
  {
    name: 'name_business_hour',
    label: '時間枠表示名',
    field: 'name_business_hour',
    align: 'left'
  },
  {
    name: 'time_business_start1',
    label: '診療開始時刻 1',
    field: 'time_business_start1',
    align: 'left'
  },
  {
    name: 'time_business_end1',
    label: '診療終了時刻 1',
    field: 'time_business_end1',
    align: 'left'
  },
  {
    name: 'time_business_start2',
    label: '診療開始時刻 2',
    field: 'time_business_start2',
    align: 'left'
  },
  {
    name: 'time_business_end2',
    label: '診療終了時刻 2',
    field: 'time_business_end2',
    align: 'left'
  },
  {
    name: 'time_business_start3',
    label: '診療開始時刻 3',
    field: 'time_business_start3',
    align: 'left'
  },
  {
    name: 'time_business_end3',
    label: '診療終了時刻 3',
    field: 'time_business_end3',
    align: 'left'
  }
]

const openAddModal = async () => {
  businessHourSlot.selectBusinessHourSlot(null)
  await mtUtils.mediumPopup(UpdateBusinessHourSlotModal)
}

const onRowClick = async (data: any) => {
  await mtUtils.mediumPopup(UpdateBusinessHourSlotModal, { data })
}
const typeBusinessDayName = (value: any) => typeBusinessDay.find((v) => v.value === value)

const formatTime = (time: any) => {
  return time?.slice(0, -3)
}

onMounted(() => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  businessHourSlot.fetchBusinessHourSlots({id_clinic: id_clinic})

  setPageTitle('診療時間枠')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          診療時間枠
        </q-toolbar-title>
        <q-btn
          @click="openAddModal()"         
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />診療時間枠
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getBusinessHourSlots"
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
          <div v-if="col.field == 'type_business_day'" class="body1 regular text-grey-700">
              {{ typeBusinessDayName(row.type_business_day)?.label }}
          </div>
          <div v-else-if="col.field == 'time_business_start1'" class="body1 regular text-grey-700">
              {{ formatTime(row?.time_business_start1) }}
          </div>
          <div v-else-if="col.field == 'time_business_end1'" class="body1 regular text-grey-700">
              {{ formatTime(row?.time_business_end1) }}
          </div>
          <div v-else-if="col.field == 'time_business_start2'" class="body1 regular text-grey-700">
              {{ formatTime(row?.time_business_start2) }}
          </div>
          <div v-else-if="col.field == 'time_business_end2'" class="body1 regular text-grey-700">
              {{ formatTime(row?.time_business_end2) }}
          </div>
          <div v-else-if="col.field == 'time_business_start3'" class="body1 regular text-grey-700">
              {{ formatTime(row?.time_business_start3) }}
          </div>
          <div v-else-if="col.field == 'time_business_end3'" class="body1 regular text-grey-700">
              {{ formatTime(row?.time_business_end3) }}
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
