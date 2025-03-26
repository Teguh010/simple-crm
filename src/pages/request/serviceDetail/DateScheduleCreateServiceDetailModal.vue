<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue';
import MtFormInputText from '@/components/form/MtFormInputText.vue';
import MtFormPullDown from '@/components/form/MtFormPullDown.vue';
import useServiceDetailStore from '@/stores/service-details';
import { calculateDate } from '@/utils/aahUtils';
import { ref } from 'vue';

const props = defineProps({ datetime: String })
const serviceDetailStore = useServiceDetailStore()
const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}
const typeScheduleOptions: any[] = [
  {label: '日後', value: '1'},
  {label: '週後', value: '2'},
  {label: '月後', value: '3'},
]
const data = ref({
  value_schedule: 1,
  type_schedule: '2',
})
const submit = () => {
  const date = calculateDate(props.datetime, data.value.value_schedule, data.value.type_schedule, true)
  serviceDetailStore.setServiceDetailDateSchedule(date)
  closeModal()
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        次回スケジュール
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md">
        <div class="col-4">
          <MtFormInputText
            v-model="data.value_schedule"
          />
        </div>
        <div class="col-8">
          <MtFormPullDown
            type="selection"
            v-model:selected="data.type_schedule"
            :options="typeScheduleOptions"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>