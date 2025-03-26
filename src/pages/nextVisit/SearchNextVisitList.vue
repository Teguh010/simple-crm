<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import MtLabel from '@/components/MtLabel.vue'
import {
  formatDate,
  formatHoursMinutes,
  getDateToday,
  getDaysAfter
} from '@/utils/aahUtils'
import UpdateNextVisitModal from './UpdateNextVisitModal.vue'
import useNextVisitStore from '@/stores/next-visit'
import { storeToRefs } from 'pinia'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'

const nextVisitStore = useNextVisitStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)
const { getNextVisitLists } = storeToRefs(nextVisitStore)
const { getCustomers } = storeToRefs(customerStore)

const columns = [
  {
    name: 'type_visit_purpose',
    label: '来院目的区分',
    field: 'type_visit_purpose',
    align: 'left',
    style: 'width: 12%',
    headerStyle: 'width: 12%'
  },
  {
    name: 'datetime_next_visit',
    label: '次回来院日時',
    field: 'datetime_next_visit',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'm_customer_name_kana_family',
    label: 'オーナー名',
    field: 'm_customer_name_kana_family',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'm_pet_name_kana_pet',
    label: 'ペット名',
    field: 'm_pet_name_kana_pet',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'memo_visit',
    label: '来院メモ',
    field: 'memo_visit',
    align: 'left',
    style: 'width: 48%',
    headerStyle: 'width: 48%'
  }
]
const searchData = ref({
  type_visit_purpose: '',
  date_from: getDateToday(),
  date_to: getDaysAfter(8),
  id_clinic: null
})
const visitPurpose = (type_visit_purpose_ticket) =>
  commonStore.commonTypeVisitPurposeList.find((v) => v.code_func1 == type_visit_purpose_ticket)?.name_common

const getCustomer = (id_customer) => {
  let customer = getCustomers.value.find((customer: any) => {
    return customer.id_customer.includes(id_customer)
  })
  return customer
}
const getPet = (id_customer, id_pet) => {
  let customer = getCustomers.value.find((customer: any) => {
    return customer.id_customer.includes(id_customer)
  })
  let pet = customer?.pets.find((pet: any) => {
    return pet.id_pet.includes(id_pet)
  })
  return pet
}
const labelColor = (type_customer_color) => {
  getCliCommonCustomerColorList.value.find(
    (v) => v.code_func1 == type_customer_color
  )?.name_cli_common
}

const openAddModal = async () => {
  await mtUtils.mediumPopup(UpdateNextVisitModal)
}
const onRowClick = async (data) => {
  await mtUtils.mediumPopup(UpdateNextVisitModal, { data })
}
const search = () => {
  searchData.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  nextVisitStore.fetchNextVisitList(searchData.value)
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
onMounted(async () => {
  await commonStore.fetchPreparationCommonList({code_common: [25, 13]})
  // nextVisitStore.fetchNextVisitList()
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          予約一覧
        </q-toolbar-title>
        <MtFormPullDown
          class="q-mr-sm selection-field"
          outlined
          label="来院目的区分"
          v-model:selected="searchData.type_visit_purpose"
          :options="commonStore.getCommonTypeVisitPurposeList"
        />
        <form class="flex items-center no-wrap">
          <MtFormInputDate
            outlined
            type="date"
            label="次回来院日：Start"
            v-model:date="searchData.date_from"
            autofocus
            tabindex="1"
            @keydown.enter="moveNext"
          />
          <MtFormInputDate
            outlined
            type="date"
            v-model:date="searchData.date_to"
            @keydown.enter="moveNext"
            label="次回来院日：End"
            tabindex="2"
          />
        </form>
        <q-btn
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mx-md"
          tabindex="3"
          @click="search()"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          unelevated
          color="grey-800"
          text-color="white"
          @click="openAddModal()"
        >
          <q-icon size="20px" name="add" />予約
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getNextVisitLists"
      :rowsBg="true"
      class="custody-table q-pt-sm"
      flat
      :style="{ height: 'calc(100vh - 70px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div
            v-if="col.field == 'type_visit_purpose'"
            class="body1 regular text-grey-900"
          >
            {{ visitPurpose(row['type_visit_purpose']) }}
          </div>
          <div
            v-else-if="col.field == 'datetime_next_visit'"
            class="body1 regular text-grey-900"
          >
            {{
              formatDate(row['datetime_next_visit']) +
              ' ' +
              formatHoursMinutes(row['datetime_next_visit'])
            }}
          </div>
          <div v-else-if="col.field == 'm_customer_name_kana_family'">
            <div class="caption1 regular text-grey-700">
              {{ getCustomer(row['id_customer'])?.name_kana_family }}
            </div>
            <div class="flex items-center">
              <span class="body1 regular text-grey-900 q-mr-xs">{{
                getCustomer(row['id_customer'])?.name_kana_first
              }}</span>
              <div>
                <q-badge
                  rounded
                  :color="
                    labelColor(
                      getCustomer(row['id_customer'])?.type_customer_color
                    )
                  "
                />
              </div>
            </div>
          </div>
          <div v-else-if="col.field == 'm_pet_name_kana_pet'">
            <div class="caption1 regular text-grey-700">
              {{ getPet(row['id_customer'], row['id_pet'])?.name_pet }}
            </div>
            <div class="body1 regular text-grey-900">
              {{
                getPet(row['id_customer'], row['id_pet'])
                  ?.name_pet_customer_updated
              }}
            </div>
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.red {
  color: #ff4343;
}
</style>
