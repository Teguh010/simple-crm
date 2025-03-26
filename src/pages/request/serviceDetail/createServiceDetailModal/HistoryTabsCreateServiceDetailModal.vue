<script setup lang="ts">
import { getDateTimeNow } from '@/utils/aahUtils';
import { ref } from 'vue';

const allServices = ref([
  {
    date: '2023/07/01',
    collection: [
      { value: false, key: 1, name: 'Testing 1', datetime_service: getDateTimeNow(), flg_non_charge: false },
      { value: false, key: 2, name: 'Testing 2', datetime_service: getDateTimeNow(), flg_non_charge: false },
    ]
  },
  {
    date: '2023/07/20',
    collection: [
      { value: false, key: 3, name: 'Testing 3', datetime_service: getDateTimeNow(), flg_non_charge: false },
      { value: false, key: 4, name: 'Testing 4', datetime_service: getDateTimeNow(), flg_non_charge: false },
    ]
  }
])
</script>

<template>
  <div v-for="service in allServices" :key="service.date">
    <div>
      <small>
        {{ service.date }}
      </small>
    </div>
    <q-checkbox
      v-for="v in service.collection"
      :key="v.key"
      class="q-mt-md"
      :model-value="v.value"
      @update:model-value="(e) => v.value = e"
    >
      <q-card class="q-bl-lg bg-grey-050" flat>
        <q-card-section>
          <div class="flex justify-between">
            <div>
              <div class="text-body1 text-grey-900">{{ v.name }}</div>
              <div class="text-body2 text-grey-700 flex items-center">
                大分類
                <q-icon name="arrow_right" />
                中分類
              </div>
            </div>
            <div class="flex">
              <q-chip class="chip-blue" text-color="white">
                予防
              </q-chip>
              <q-chip class="chip-red" text-color="white">
                預かり
              </q-chip>
              <q-chip class="chip-purple" text-color="white">
                手術
              </q-chip>
              <q-chip class="chip-green" text-color="white">
                麻酔
              </q-chip>
            </div>
          </div>
          <p class="text-body2 q-mt-sm text-grey-700">
            サービスメモサービスメモサービスメモサービスメモサービスメモービスメモサービスメモサービスメモサービスメモサービスメモサービスメモサービスメモサービスメモサービスメモサービスメモサービスメモ
          </p>
        </q-card-section>
      </q-card>
    </q-checkbox>
  </div>
</template>
