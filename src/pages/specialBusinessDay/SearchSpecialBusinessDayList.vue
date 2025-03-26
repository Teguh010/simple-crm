<script setup lang="ts">
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate } from '@/utils/aahUtils'
import UpdateSpecialBusinessDayModal from './UpdateSpecialBusinessDayModal.vue'
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import useActionStore from '@/stores/action'
import useSpecialBusinessDayStore from '@/stores/special-business-days'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import { setPageTitle } from '@/utils/pageTitleHelper'

const businessHourSlot = useBusinessHourSlot()
const specialBusinessDayStore = useSpecialBusinessDayStore()
const actionStore = useActionStore()
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)

const { getSpecialBusinessDays } = storeToRefs(specialBusinessDayStore)
const { getAllBusinessHourSlots } = storeToRefs(businessHourSlot)
const columns = [
  {
    name: 'datetime_business_day',
    label: '対象日',
    align: 'left',
    field: 'datetime_business_day'
  },
  {
    name: 'id_business_hour_slot',
    label: '診療時間枠',
    align: 'left',
    field: 'id_business_hour_slot'
  },
  {
    name: 'memo_business_day',
    label: 'オーナー表示用：診療時間案内',
    align: 'left',
    field: 'memo_business_day'
  },
]

const addBusinessDayList = async () => {
  await mtUtils.mediumPopup(UpdateSpecialBusinessDayModal)
}
const onRowClick = async (data: any) => {
  await mtUtils.smallPopup(UpdateSpecialBusinessDayModal, {data})
}
const businessHoursName = (id_business_hour_slot: String) =>
  getAllBusinessHourSlots.value.find(
    (v) => v.value === id_business_hour_slot
  )?.label

onMounted(() => {
  if (
    action.value === 'createBusinessDay' ||
    localStorage.getItem('pageAction') === 'createBusinessDay'
  ) {
    addBusinessDayList()
    sessionStorage.setItem('pageType', 'modal')
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
  businessHourSlot.fetchPreparationBusinessHourSlots()
  specialBusinessDayStore.fetchSpecialBusinessDays()

  setPageTitle('診療日 特別スケジュール')
})
</script>
<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          診療日 特別スケジュール
        </q-toolbar-title>
        <q-btn
          
          unelevated
          color="primary"
          text-color="white"
          class="q-ml-xs"
          @click="addBusinessDayList"
        >
          <q-icon size="20px" name="add" />
          特別スケジュール
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getSpecialBusinessDays" :rowsBg="true" class="q-pt-sm" flat>
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div v-if="col.field == 'datetime_business_day'" auto-width key="datetime_business_day">
            <div class="body1 row no-wrap regular text-grey-900">
              <span>{{ formatDate(row['datetime_business_day']) }}</span>
            </div>
          </div>
          <div
            v-if="col.field == 'id_business_hour_slot'"
            auto-width
            key="id_business_hour_slot"
          >
            <div class="body1 regular text-grey-900">
              {{ businessHoursName(row['id_business_hour_slot']) }}
            </div>
          </div>
          <div
            v-if="col.field == 'memo_business_day'"
            auto-width
            key="memo_business_day"
          >
            <div class="body1 regular text-grey-900">
              {{ row['memo_business_day'] }}
            </div>
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
