<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdatePaymentRequestModal from './UpdatePaymentRequestModal.vue'
import { usePaymentRequestStore } from '@/stores/payment-requests'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import MtTable2 from '@/components/MtTable2.vue'

const paymentRequestStore = usePaymentRequestStore()
const { getPaymentRequests } = storeToRefs(paymentRequestStore)
const name = ref('')

const columns = [
  {
    name: 'id_payment_request',
    label: 'Payment request ID',
    field: 'id_payment_request',
    align: 'left',
    style: 'width: 150px'
  },
  {
    name: 'amount',
    label: 'amount',
    field: 'amount',
    align: 'left',
    style: 'width: 150px'
  },
  {
    name: 'customer',
    label: 'Customer ID',
    field: 'id_customer',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'payment_mode',
    label: 'Payment Mode',
    field: 'payment_mode',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'status',
    label: 'Status',
    field: 'flg_paid',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'memo',
    label: 'Memo',
    field: 'memo',
    align: 'left',
    style: 'width: 100px'
  }
]

const onRowClick = async (data) => {
  paymentRequestStore.selectPaymentRequest(data.id_payment_request)
  await mtUtils.popup(UpdatePaymentRequestModal, { data })
}
const addButton = async () => {
  await mtUtils.popup(UpdatePaymentRequestModal)
}
const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  paymentRequestStore.fetchPaymentRequests({id_clinic:id_clinic})
}

onMounted(() => {
  //   employeeStore.fetchEmployees();
  search()
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          Payment request list
        </q-toolbar-title>
        <MtInputForm type="text" label="オーナー名" autofocus tabindex="1" outlined v-model="name" class="search-field" />
        <q-btn          
          unelevated
          color="accent-800"
          text-color="white"
          class="q-ml-xs"
          @click="search"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="addButton"         
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="20px" name="add" />従業員
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getPaymentRequests"
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
          <div v-if="col.field == 'status'" class="body1 regular text-grey-700">
            {{ row.flg_paid ? 'Paid' : 'Not paid' }}
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
