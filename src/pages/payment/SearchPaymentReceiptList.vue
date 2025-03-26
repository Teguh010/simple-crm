<script setup lang="ts">
import { reactive, onMounted,watch } from 'vue'
import { storeToRefs } from 'pinia'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import {
  getDateToday,
  getDaysBefore,
  getCustomerName,
  getCustomerLabelColor
} from '@/utils/aahUtils'
import UpdatePaymentReceiptModal from './UpdatePaymentReceiptModal.vue'
import useActionStore from '@/stores/action'
import MtTable2 from '@/components/MtTable2.vue'
import usePaymentReceiptStore from '@/stores/paymentReceipt'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'

const paymentReceiptStore = usePaymentReceiptStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()

const { getCustomers, getAllCustomerPreps } = storeToRefs(customerStore)
const { getPaymentReceipts } = storeToRefs(paymentReceiptStore)
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)

const searchData = reactive({
  date_from: getDaysBefore(7),
  date_to: getDateToday(),
  number_payment_receipt: null
})

const actionStore = useActionStore()
const columns = [
  {
    name: 'number_payment_receipt',
    label: '領収書番号',
    field: 'number_payment_receipt',
    align: 'left'
  },
  {
    name: 'datetime_publish',
    label: '発行日時',
    field: 'datetime_publish',
    align: 'left'
  },
  {
    name: 'name_customer',
    label: 'オーナー名',
    field: 'name_customer',
    align: 'left'
  },
  {
    name: 'amount_receipt',
    label: '領収金額',
    field: 'amount_receipt',
    align: 'left'
  },
  {
    name: 'number_cart',
    label: '会計番号',
    field: 'number_cart',
    align: 'left'
  },
  {
    name: 'flg_payment_receipt_reissue',
    label: '再発行',
    field: 'flg_payment_receipt_reissue',
    align: 'left'
  }
]
const openAddModal = async () => {
  await mtUtils.mediumPopup(UpdatePaymentReceiptModal)
}
const onRowClick = async (data: any) => {
  const copiedObject = { ...data }
  const customer = getCustomer(copiedObject.id_customer)
  const pageTitle = `領収: ${customer?.name_family} 様`
  const fromPage = '領収書一覧'
  await mtUtils.mediumPopup(UpdatePaymentReceiptModal, {
    data: copiedObject,
    pageTitle,
    fromPage
  })
}
const search = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  const data = {
    ...searchData,
    id_clinic
  }
  await paymentReceiptStore.fetchPaymentReceipts(data)
}
const getCustomer = (id_customer: string) => {
  let customer = getCustomers.value.find((customer) => {
    return customer.id_customer.includes(id_customer)
  })
  return customer
}

const getCustomerData = (id_customer: any) =>
  getAllCustomerPreps.value.find(
    (customer: any) => customer.id_customer == id_customer
  )

const moveNext = (e) => {
  const inputs = Array.from(
    e.target.form.querySelectorAll('input[type="text"]')
  )
  const index = inputs.indexOf(e.target)
  if (index === 0) {
    inputs[index + 1].focus()
  } else {
    inputs[1].blur()
    search()
  }
}
watch(
  () => searchData.date_from,
  (newStartDate) => {
    searchData.date_to = newStartDate;
  }
);
onMounted(async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  const data = {
    id_clinic
  }
  await Promise.all([
    customerStore.fetchCustomers(data),
    paymentReceiptStore.fetchPaymentReceipts(data)
  ])
  setPageTitle('領収書一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          領収書一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtInputForm
                type="text"
                outlined
                label="領収証番号"
                v-model="searchData.number_payment_receipt"
                @keydown.enter="moveNext"
                :tabIndex="3"
              />
              <MtFormInputDate
                outlined
                label="発行日：Start"
                type="date"
                v-model:date="searchData.date_from"
                autofocus
                class="q-mx-sm"
                :tabindex="1"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="発行日：End"
                v-model:date="searchData.date_to"
                :tabIndex="2"
                @keydown.enter="moveNext"
              />
              <q-btn
                @click="search()"
                unelevated
                color="primary"
                text-color="white"
                class="q-mx-sm"
                :tabIndex="5"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
              <q-btn @click="openAddModal" unelevated color="primary">
                <q-icon size="20px" name="add" />領収書
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtInputForm
                type="text"
                outlined
                label="領収証番号"
                v-model="searchData.number_payment_receipt"
                class="ipad-field-size-md"
                @keydown.enter="moveNext"
                :tabIndex="3"
              />
              <MtFormInputDate
                outlined
                label="発行日：Start"
                type="date"
                v-model:date="searchData.date_from"
                autofocus
                :tabindex="1"
                class="q-mx-sm ipad-field-size-md"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="発行日：End"
                class="ipad-field-size-md"
                v-model:date="searchData.date_to"
                :tabIndex="2"
                @keydown.enter="moveNext"
              />
              <q-btn
                @click="search()"
                unelevated
                color="primary"
                text-color="white"
                class="q-mx-sm"
                :tabIndex="5"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
              <q-btn @click="openAddModal" unelevated color="primary">
                <q-icon size="20px" name="add" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getPaymentReceipts"
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
          <div v-if="col.field == 'name_customer'">
            <span class="caption2 regular text-grey-700">
              {{ getCustomerData(row.id_customer)?.name_kana_family }}
              {{ getCustomerData(row.id_customer)?.name_kana_first }}
            </span>
            <div>
              {{ getCustomerName(getCustomerData(row.id_customer)) }}
              <q-icon
                v-if="getCustomerData(row.id_customer)?.type_customer_color"
                size="12px"
                name="circle"
                class="q-ml-xs"
                :color="
                  getCustomerLabelColor(
                    getCustomerData(row.id_customer)?.type_customer_color
                  )
                "
                :style="{
                  color: getCustomerLabelColor(
                    getCustomerData(row.id_customer)?.type_customer_color
                  )
                }"
              />
            </div>
          </div>
          <div
            v-else-if="col.field === 'flg_payment_receipt_reissue'"
            class="body1 regular text-grey-900"
          >
            <q-badge rounded color="primary" />
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
