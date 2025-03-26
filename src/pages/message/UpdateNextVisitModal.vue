<script setup lang="ts">
import { ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCustomerStore from '@/stores/customers'

const customerStore = useCustomerStore()
const emits = defineEmits(['close'])
const data = ref({
  id_customer: null,
  id_pet: null,
  type_visit_purpose: null,
  memo_visit: 'ご予約が確定しました。',
  datetime_next_visit: null,
  next_time_visit: null
})

const closeModal = () => {
  emits('close')
}
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      次回来院予定
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div class="row q-col-gutter-md q-mb-xs">
      <div class="col-2">
        <MtInputForm
          type="selection"
          :items="customerStore.getAllCustomers"
          v-model="data.id_customer"
          label="【id_customer】オーナー *"
          required
        />
      </div>
      <div class="col-2">
        <MtInputForm
          type="text"
          v-model="data.id_pet"
          label="【id_pet】ペット *"
          required
        />
      </div>
      <div class="col-2">
        <MtInputForm
          type="text"
          v-model="data.type_visit_purpose"
          label="【type_visit_purpose】来院目的区分"
          required
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-xs">
      <div class="col-12">
        <MtInputForm
          type="text"
          v-model="data.memo_visit"
          label="【memo_visit】来院メモ"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-xs">
      <div class="col-2">
        <MtFormInputDate
          type="date"
          v-model:date="data.datetime_next_visit"
          label="【datetime_next_visit】次回来院日"
        />
      </div>
      <div class="col-2">
        <MtFormInputDate
          type="text"
          v-model:date="data.next_time_visit"
          label="【next_time_visit】次回来院時間"
        />
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
