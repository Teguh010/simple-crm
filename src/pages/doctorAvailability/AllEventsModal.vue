<script setup lang="ts">
import { CalendarEvent } from '@/types/types'
import { PropType } from 'vue'
import BadgeComponent from '@/pages/doctorAvailability/calendars/BadgeComponent.vue'
import { CalendarEventTypes } from '@/types/types'
import { type CalendarServiceDetail } from '@/stores/business-calendar-days'
import { OpenDetailModalParam } from '@/pages/doctorAvailability/DoctorAvailabilityNew.vue'

const props = defineProps({
  events: {
    type: Array as PropType<CalendarEvent[]>,
    required: true
  },
  customerListById: {
    type: Object as PropType<Record<string, any>>,
    required: true
  },
  openDetailModal: {
    type: Function as PropType<(data: OpenDetailModalParam) => void>,
    required: true
  }
})

const emit = defineEmits(['close'])
</script>

<template>
  <q-card >
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">時間未設定の予約</div>
      <q-space />
      <q-btn icon="close" flat round dense @click="emit('close')" />
    </q-card-section>

    <q-card-section class="q-pt-none">
      <div
        v-for="(event, index) in events"
        :key="`modal-event-${index}`"
        class="event-item q-py-sm cursor-pointer"
        @click="props.openDetailModal({ type: event.type, detailObj: event.data }); emit('close')"
      >
        <div class="flex items-center">
          <BadgeComponent
            :color="event.data.badge?.color"
            :label="event.data.badge?.label"
            text-color="white"
            rounded
          />
          <div class="q-ml-sm">
            <template v-if="event.type === CalendarEventTypes.SERVICE">
              {{ customerListById[(event.data as CalendarServiceDetail)?.id_customer]?.name_family_original }}
              {{ (event.data as CalendarServiceDetail)?.name_pet }}
              {{ (event.data as CalendarServiceDetail)?.id_cm_animal_name }}
              {{ (event.data as CalendarServiceDetail)?.item_service_unit_name }}
            </template>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<style scoped lang="scss">
.event-item {
  &:hover {
    background: rgba(0,0,0,0.05);
  }
  &:not(:last-child) {
    border-bottom: 1px solid #eee;
  }
}
</style> 