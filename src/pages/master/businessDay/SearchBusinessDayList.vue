<script setup lang="ts">
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import UpdateBusinessDayModal from './UpdateBusinessDayModal.vue'
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import useActionStore from '@/stores/action'
import useBusinessDayStore from '@/stores/business-day'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import _ from 'lodash'
import { typeWeekday } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'

const businessHourSlot = useBusinessHourSlot()
const businessDayStore = useBusinessDayStore()
const actionStore = useActionStore()
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)

const { getBusinessDays } = storeToRefs(businessDayStore)
const { getAllBusinessHourSlots } = storeToRefs(businessHourSlot)
const columns = [
  {
    name: 'type_weekday',
    label: '対象日',
    align: 'left',
    field: 'type_weekday'
  },
  {
    name: 'id_business_hour_slot',
    label: '診療時間枠',
    align: 'left',
    field: 'id_business_hour_slot'
  },
]

const onRowClick = async (data: any) => {
  await mtUtils.smallPopup(UpdateBusinessDayModal, {data})
}
const typeWeekDayLabel = (type_weekday: Number) =>
  typeWeekday.find(
    (v) => v.value === type_weekday
  )?.label

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
  businessDayStore.fetchBusinessDays()

  setPageTitle('診療日 通常スケジュール')
})
</script>
<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          診療日 通常スケジュール
        </q-toolbar-title>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="_.sortBy(getBusinessDays,'type_weekday', 'asc')" :rowsBg="true" class="q-pt-sm" flat>
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div v-if="col.field == 'type_weekday'" auto-width key="type_weekday">
            <div class="body1 row no-wrap regular text-grey-900">
              <span>{{ typeWeekDayLabel(row['type_weekday']) }}</span>
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
         
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
