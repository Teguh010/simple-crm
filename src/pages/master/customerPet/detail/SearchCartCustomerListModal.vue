<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import SearchCartListFilterModal from '@/pages/cart/SearchCartListFilterModal.vue'
import UpdateCartModal from '@/pages/cart/UpdateCartModal.vue'
import UpdateCartHeaderModal from '@/pages/cart/UpdateCartHeaderModal.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import useCartStore from '@/stores/carts'
import useTask from '@/stores/task'
import useCustomerStore from '@/stores/customers'
import { getDateByFormat, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { useRouter } from 'vue-router'
import { formattedPrice } from '@/utils/helper'

const router = useRouter()
const cartStore = useCartStore()
const taskStore = useTask()
const customerStore = useCustomerStore()

const carts = ref([])
const props = defineProps<{
  id_customer: string
}>()
const name_customer = ref(null)


const searchData = ref({
  number_cart: null,
  this_month: false,
  last_month: false,
  code_customer: '',
	id_customer: props.id_customer,
  name_customer: '',
  date_start: getDaysBefore(7),
  date_end: getDateToday()
})

const emits = defineEmits(['close'])

const columns = [
  {
    name: 'number_cart',
    label: '会計番号',
    field: 'number_cart',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'date_cart',
    label: '会計日',
    field: 'date_cart',
    align: 'left',
    style: 'width:8%'
  },
  {
    name: 'code_customer',
    label: '診察券番号',
    field: 'code_customer',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'name_customer',
    label: 'オーナー名',
    field: 'name_customer',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'bill',
    label: 'ご請求金額',
    field: 'bill',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'amount_unpaid',
    label: 'お支払い残高',
    field: 'amount_unpaid',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'flg_insure_request',
    label: '保険請求',
    field: 'flg_insure_request',
    align: 'left',
    style: 'width: 10%'
  }
]

const closeModal = () => {
  emits('close')
}
const openSearchModal = async () => {
	const hideCustomerPullDown = true;
  await mtUtils.smallPopup(SearchCartListFilterModal, {
    data: searchData.value,
		hideCustomerPullDown: hideCustomerPullDown,
		callbackSearchModal: callbackSearchModal
  })
}
const callbackSearchModal = async (data: any) => {
	searchData.value.number_cart = data.number_cart;
	searchData.value.this_month = data.this_month;
	searchData.value.last_month = data.last_month;
	const resp = await cartStore.fetchCartsRaw(search.value)
	carts.value = resp
}
const openCartModal = async () => {
  taskStore.selectTask(null)
  await mtUtils.smallPopup(UpdateCartModal, {selectedCustomer: props.id_customer})
}
const onRowClick = async (data) => {
  await router.replace({
    name: 'SearchCartListDetail',
    query: { id_cart: data.id_cart }
  })
  await mtUtils.popup(UpdateCartHeaderModal, { data })
  await router.replace({ name: 'SearchCartList' })
}
const search = async () => {
  const resp = await cartStore.fetchCartsRaw({
    number_cart: searchData.value.number_cart,
    this_month: searchData.value.this_month,
    last_month: searchData.value.last_month,
    code_customer: searchData.value.code_customer,
    date_start: searchData.value.date_start,
    date_end: searchData.value.date_end,
    id_customer: searchData.value.id_customer,
    id_sp_clinic: true
  })
	carts.value = resp
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
  await search()
  const customer = await customerStore.selectCustomer(props.id_customer,true)
  name_customer.value = customer.name_customer_display
})

</script>

<template>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          {{ name_customer }} 様のお会計
        </q-toolbar-title>
        <div class="row">
          <div class="col">
            <div class="flex items-center no-wrap">
              <form class="flex items-center no-wrap">
                <MtFormInputDate
                  v-model:date="searchData.date_start"
                  outlined
                  type="date"
                  label="会計日：Start"
                  autofocus
                  tabindex="1"
                  @keydown.enter="moveNext"
                />
                <MtFormInputDate
                  v-model:date="searchData.date_end"
                  outlined
                  type="date"
                  label="会計日：End"
                  tabindex="2"
                  class="q-mx-md"
                  @keydown.enter="moveNext"
                />
              </form>
            </div>
          </div>
        </div>
        <q-btn
          @click="search"
          tabindex="3"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="search" />検索</q-btn>
        <q-btn          
          unelevated
          color="primary"
          text-color="white"
          class="q-mx-md"
          @click="openCartModal"
        >
          <q-icon size="20px" name="add" />
          会計
        </q-btn>
      </q-toolbar>
    </MtModalHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果 :<span class="q-ml-sm">{{ carts.length }}件</span>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="carts"
      :show-filter="false"
      row-key="name"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100vh - 180px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div v-if="col.field == 'number_cart'" auto-width key="number_cart">
            <div class="body1 regular text-grey-900">
              {{ row['number_cart'] }}
            </div>
          </div>
          <div v-if="col.field == 'date_cart'" auto-width key="date_cart">
            <div class="body1 row regular text-grey-900">
              <span
                >{{
                  row['date_cart']
                    ? getDateByFormat(row['date_cart'])
                    : null
                }}
              </span>
            </div>
          </div>
          <div
            v-if="col.field == 'code_customer'"
            auto-width
            key="code_customer"
          >
            <div class="body1 regular text-grey-900">
              {{ row['code_customer'] }}
            </div>
          </div>

          <div
            v-if="col.field == 'name_customer'"
            auto-width
            key="name_customer"
          >
            <div class="body1 regular text-grey-900">
              {{ row['name_customer'] }}
            </div>
          </div>
          <div v-if="col.field == 'bill'" auto-width key="bill">
            <div class="body1 regular text-grey-900 text-right">
              {{ row['bill'] ? formattedPrice(row['bill']) : 0 }}
            </div>
          </div>

          <div
            v-if="col.field == 'amount_unpaid'"
            auto-width
            key="amount_unpaid"
          >
            <div class="body1 regular text-grey-900">
              {{ formattedPrice(row['amount_unpaid']) }}
            </div>
          </div>

          <div
            v-if="col.field == 'flg_insure_request'"
            auto-width
            key="flg_insure_request"
          >
            <div class="body1 regular text-grey-900">
              {{ row['flg_insure_request'] == true ? '•' : '' }}
            </div>
          </div>
        </td>
      </template>
    </MtTable2>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}

.statusBorders {
  border-radius: 24px;
  color: $white;
}

.typeCustomerColor {
  width: 15px;
  height: 15px;
  border-radius: 50%;
}
</style>
