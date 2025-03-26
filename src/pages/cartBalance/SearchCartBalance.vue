<script setup lang="ts">
import { onMounted, reactive,watch } from 'vue'
import { storeToRefs } from 'pinia'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import mtUtils from '@/utils/mtUtils'
import { getCustomerLabelColor, getDateByFormat, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import UpdateCartBalance from './UpdateCartBalance.vue'
import MtTable2 from '@/components/MtTable2.vue'
import { formattedPrice } from '@/utils/helper'
import usecartBalanceStore from '@/stores/cartBalances'
import useCustomerStore from '@/stores/customers'
import { setPageTitle } from '@/utils/pageTitleHelper'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'

const cartBalanceStore = usecartBalanceStore()
const customerStore = useCustomerStore()
const { getCartBalances } = storeToRefs(cartBalanceStore)

const { getAllCustomerPreps } = storeToRefs(customerStore)

const searchData = reactive({
  date_start: getDaysBefore(7),
  date_end: getDateToday(),
  name_customer: null
})

const columns = [
  {
    name: 'name_customer',
    label: 'オーナー名',
    field: 'name_customer',
    align: 'left'
  },
  {
    name: 'datetime_paid_last',
    label: '発生日',
    field: 'datetime_paid_last',
    align: 'left'
  },
  {
    name: 'amount_adjustment',
    label: '発生金額',
    field: 'amount_adjustment',
    align: 'left'
  },
  {
    name: 'bal_last',
    label: '前回繰越金',
    field: 'bal_last',
    align: 'left'
  },
  {
    name: 'bal_updated',
    label: '今回繰越金',
    field: 'bal_updated',
    align: 'left'
  }
]
const openAddModal = async () => {
  await mtUtils.smallPopup(UpdateCartBalance)
}
const onRowClick = async (data: any) => {
  const copiedObject = { ...data }
  await mtUtils.smallPopup(UpdateCartBalance, { data: copiedObject })
}
const search = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  const data = {
    ...searchData,
    id_clinic
  }
  await cartBalanceStore.fetchCartBalances(data)
}

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
  () => searchData.date_start,
  (newStartDate) => {
    searchData.date_end = newStartDate;
  }
);
const getCustomerData = (id_customer: any) =>
  getAllCustomerPreps.value.find(
    (customer: any) => customer.id_customer == id_customer
  )

onMounted(() => {
  // set page title
  setPageTitle('繰越金一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          繰越金一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtCustomerFilterSelect
                v-model:selecting="searchData.id_customer"
                outlined
              />
              <MtFormInputDate
                outlined
                label="発生日：Start"
                type="date"
                v-model:date="searchData.date_start"
                autofocus
                class="q-mx-sm"
                tabindex="1"
                @keydown.enter="moveNext"
                @update:date="
                  () => (searchData.date_end = searchData.date_start)
                "
              />
              <MtFormInputDate
                outlined
                type="date"
                label="発生日：End"
                v-model:date="searchData.date_end"
                tabindex="2"
                @keydown.enter="moveNext"
              />
              <q-btn
                @click="search()"
                unelevated
                color="primary"
                text-color="white"
                class="q-mx-sm"
                tabindex="5"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
              <q-btn @click="openAddModal" unelevated color="primary">
                <q-icon size="20px" name="add" />繰越金
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtCustomerFilterSelect
                v-model:selecting="searchData.id_customer"
                outlined
              />
              <MtFormInputDate
                outlined
                label="発生日：Start"
                type="date"
                v-model:date="searchData.date_start"
                autofocus
                tabindex="1"
                class="q-mx-sm ipad-field-size-md"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="発生日：End"
                class="ipad-field-size-md"
                v-model:date="searchData.date_end"
                tabindex="2"
                @keydown.enter="moveNext"
              />
              <q-btn
                @click="search()"
                unelevated
                color="primary"
                text-color="white"
                class="q-mx-sm"
                tabindex="5"
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
      :rows="getCartBalances"
      :rowsBg="true"
      class="custody-table q-pt-sm"
      :style="{ height: 'calc(100vh - 70px)', boxShadow: 'none' }"
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
            v-if="col.field == 'name_customer'"
            auto-width
            key="name_customer"
          >
            <div class="body1 regular text-grey-900">
              {{ row['name_customer'] }}
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
            v-if="col.field == 'datetime_paid_last'"
            auto-width
            key="datetime_paid_last"
          >
            <div class="body1 regular text-grey-900">
              {{
                row['datetime_paid_last']
                  ? getDateByFormat(row['datetime_paid_last'])
                  : null
              }}
            </div>
          </div>
          <div
            v-if="col.field == 'amount_adjustment'"
            auto-width
            key="amount_adjustment"
          >
            <div class="body1 regular text-grey-900 text-left">
              {{
                row['amount_adjustment']
                  ? formattedPrice(Math.abs(Number(row['amount_adjustment'])))
                  : 0
              }}
            </div>
          </div>
          <div v-if="col.field == 'bal_last'" auto-width key="bal_last">
            <div class="body1 regular text-grey-900 text-left">
              {{
                row['bal_last']
                  ? formattedPrice(Math.abs(Number(row['bal_last'])))
                  : 0
              }}
            </div>
          </div>
          <div v-if="col.field == 'bal_updated'" auto-width key="bal_updated">
            <div class="body1 regular text-grey-900 text-left">
              {{
                row['bal_updated']
                  ? formattedPrice(Math.abs(Number(row['bal_updated'])))
                  : 0
              }}
            </div>
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
