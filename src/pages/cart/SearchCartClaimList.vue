<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'

import useServiceDetailStore from '@/stores/service-details'
import { computed, onMounted, ref } from 'vue'
import { formatDate, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useCustomerStore from '@/stores/customers'
import UpdateCustomerModal from '@/pages/master/customerPet/UpdateCustomerModal.vue'
import { typeStatusApplication } from '@/utils/enum'
import useCommonStore from '../../stores/common'
import AdditionalClaimList from '@/pages/cart/AdditionalClaimList.vue'
import useCartStore from '@/stores/carts'
import UpdateCartHeaderModal from '@/pages/cart/UpdateCartHeaderModal.vue'
import { useRouter } from 'vue-router'
import useCliCommonStore from '@/stores/cli-common'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { Notify } from 'quasar'
import UpdatePetInsuranceInfoModal from '@/pages/insurance/UpdatePetInsuranceInfoModal.vue'

const serviceDetailStore = useServiceDetailStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()

const props = withDefaults(defineProps<{ isSearch: boolean }>(), {
  isSearch: false
})

const emits = defineEmits(['close'])

function closeModal() {
  emits('close')
}

const router = useRouter()
const count = ref(0)

const columns = [
  {
    name: 'checkbox',
    label: '',
    field: 'checkbox',
    style: 'width:5%',
    overLoad: true
  },
  {
    name: 'number_cart',
    label: '会計番号',
    field: 'number_cart',
    style: 'width:12%'
  },
  {
    name: 'date_cart',
    label: '会計日',
    field: 'date_cart',
    style: 'width:10%'
  },
  {
    name: 'type_status_application',
    label: 'ステータス',
    field: 'type_status_application',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'type_insurer',
    label: '保険会社',
    field: 'type_insurer',
    align: 'left',
    style: 'width:8%'
  },
  {
    name: 'customer_name',
    label: 'オーナー名',
    field: 'customer_name',
    align: 'left',
    style: 'width: 10%;'
  },
  {
    name: 'pet_name',
    label: 'ペット名',
    field: 'pet_name',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'security_number',
    label: '証券番号',
    field: 'security_number',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'approval_number',
    label: '承認番号',
    field: 'approval_number',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'tgt_amount',
    label: '保険金対象額',
    field: 'tgt_amount',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'ins_amount',
    label: '保険金請求額',
    field: 'ins_amount',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'datetime_insert',
    label: '作成日',
    field: 'datetime_insert',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'datetime_application',
    label: '請求日',
    field: 'datetime_application',
    align: 'left',
    style: 'width: 10%'
  }
]

const search = ref({
  page_size: 50,
  datetime_service_start: getDaysBefore(7),
  datetime_service_end: getDateToday(),
  type_status_application: 11,
  id_customer: null,
  id_pet: null,
  flg_complete: false,
  id_category1: null,
  id_category2: null,
  id_disease: null
})
const rowList = ref([])

const bulkClaimFlg = computed(() => {
  const row = rowList.value.filter(
    (row) => row.checked && row.type_status_application != 11
  )
  if (row && row.length > 0) {
    return true
  }
  return false
})

const labelColor = (color: string) => {
  return cliCommonStore.getCliCommonCustomerColorList.find((v) => { return v.code_func1 == color })?.name_cli_common
}

function checkedRowList(value: any) {
  rowList.value = rowList.value.map((r: any) => ({ ...r, checked: value }))
}

const openSearchModal = async () => {
  count.value = 0
  await mtUtils.smallPopup(AdditionalClaimList, {
    callBackSearch: callBackSearch
  })
}

async function openClaimDetail(row) {

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'cart_detail', {
    id_cart: row.cart.id_cart
  })

  await mtUtils.mediumPopup(UpdatePetInsuranceInfoModal, {
    data: row.cart,
    fromCart: true,
    id_pet: row.pet.id_pet,
    petObj: row.pet,
    claimPage: true,
    cartDetailList: response
  })

}

async function callBackSearch(searchParams: any) {
  search.value = {
    ...searchParams
  }
  await fetchSchedule()
}

async function fetchSchedule() {
  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'claim', {
    ...search.value,
    hide_preparation: true
  })

  if (response) {
    rowList.value = response.map((claim) => {

      if (claim.type_status_application == 11 && search.value.type_status_application == 11) {
        claim.checked = true
      }
      return claim
    })
  }
}

function saveToCSV() {
  downloadCSV(rowList.value.filter((row) => row.checked))
}

function selectAndClose() {
  const filteredRowList = rowList.value.filter((row) => row.checked)
  useServiceDetailStore().setSelectedServiceDetailRecordList(filteredRowList)
  closeModal()
}

async function openCustomerModal(row: any) {
  await useCustomerStore().selectCustomer(row.id_customer)
  await mtUtils.popup(UpdateCustomerModal, {
    data: useCustomerStore().getCustomer
  })
  fetchSchedule()
}

function convertToCSV(arr: any) {
  if (arr) {
    const obj = rowList.value.map((row: any) => ({
      number_cart: row?.cart?.number_cart,
      type_insurer: useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
        (v) => v.id_common == row?.pet_insurance?.id_cm_insurer
      )?.name_common,
      customer_name: `${row?.customer?.name_family} ${row?.customer?.name_first}`,
      pet_name: `${row?.pet?.name_kana_pet} ${row?.pet?.name_pet}`,
      type_status_application: typeStatusApplication.find(
        (v) => v.value == row.type_status_application
      )?.label,
      datetime_insert: row?.datetime_insert,
      datetime_complete: row?.datetime_complete
    }))
    const array = [Object.keys(obj[0])].concat(obj)
    return array
      .map((it) => {
        return Object.values(it).toString()
      })
      .join('\n')
  }
}

async function openCart(row: any) {

  await router.replace({
    name: 'SearchCartListDetail',
    query: { id_cart: row.cart.id_cart }
  })

  await mtUtils.popup(UpdateCartHeaderModal, {
    data: {
      id_customer: row.cart.id_customer,
      id_cart: row.cart.id_cart
    },
    allData: useCartStore().getCarts,
    fromPage: '会計一覧'
  })
}

async function submitBulkClaim() {

  const confirm = await mtUtils.confirm(
    '本当に一括請求しますか？\n' +
    '申請数によっては処理に時間が掛かるためご注意ください。', '必ず確認して下さい。', 'OK')

  if (!confirm) {
    return
  }
  
  const claimList = rowList.value.filter(
    (row) => row.checked && row.type_status_application == 11
  )

  if (claimList && claimList.length == 0) {
    await mtUtils.autoCloseAlert('No Claim is selected, with status pending. ')
    return
  }

  const successList = []
  const errorList = []
  const totalClaims = claimList.length
  let processedClaims = 0

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))


  const notif = Notify.create({
    group: false, // required to be updatable
    timeout: 0, // we want to be in control when it gets dismissed
    spinner: true,
    message: '保険請求を提出しています。',
    caption: '0%'
  })

  // we simulate some progress here...
  let percentage = 0
  const interval = setInterval(() => {
    const currentPercentage = Math.floor((processedClaims / totalClaims) * 100)
    percentage = Math.min(100, currentPercentage) // Update percentage based on processed claims

    // Update the dialog with the new percentage
    notif({
      caption: `${percentage}%`
    })

    // If we are done...
    if (percentage === 100) {
      notif({
        icon: 'done',
        spinner: false,
        message: 'Submission Done !',
        timeout: 500
      })
      clearInterval(interval)
    }
  }, 500)


  for (const claim of claimList) {
    try {
      const response = await mtUtils.callApi(
        selectOptions.reqMethod.POST,
        `claim/applyClaim`,
        {
          ...claim,
          id_cm_insurer: claim?.pet_insurance.id_cm_insurer,
          id_clinic: JSON.parse(localStorage.getItem('clinic')).value,
          medical_list: claim.claim_detail_list
        }
      )

      if (response && response.code === 200) {
        const index = rowList.value.findIndex(
          (row) => row.id_claim === claim.id_claim
        )
        if (index !== -1) rowList.value.splice(index, 1) // Corrected splice to remove 1 item at the found index
        successList.push({ claimId: claim.id_claim, message: response.message }) // Append success case
      } else if (response && response.code === 500) {
        errorList.push({ claimId: claim.id_claim, message: response.message }) // Append error case
      }

    } catch (error) {
      // Handle any unexpected errors
      console.error('An unexpected error occurred:', error)
      await mtUtils.alert('An unexpected error occurred', 'エラー')
      errorList.push({ claimId: claim.id_claim, message: 'An unexpected error occurred' }) // Append unexpected error case
    }

    processedClaims++
    await sleep(200)
  }

  if (successList.length > 0) {
    Notify.create({
      timeout: 3000,
      message: `(${successList.length})件の保険請求を正常に提出できました。`,
      type: 'positive',
      progress: true
    })
  }
  if (errorList.length > 0) {
    Notify.create({
      timeout: 15000,
      message: `(${errorList.length}) 件の保険請求は却下されました。請求詳細を確認してください`,
      type: 'negative',
      actions: [
        {
          icon: 'close', color: 'white', round: true, handler: () => { /* ... */
          }
        }
      ],
      progress: true
    })
  }
  
}

function downloadCSV(data) {
  const csvString = convertToCSV(data)
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', 'filtered_data.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(async () => {
  useCommonStore().fetchPreparationCommonList({ code_common: [29, 25] })
  useCliCommonStore().fetchPreparationCliCommonList({ code_cli_common: [3] })

  if (props.isSearch) {
    rowList.value = serviceDetailStore.getSelectedServiceDetailRecordList
  }
  await fetchSchedule()
})
</script>

<template>
  <MtModalHeader class="mt-header" @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold prescription-title">
      保険請求一覧
    </q-toolbar-title>
    <MtFormInputDate
      v-model:date="search.date_start"
      autofocus
      label="作成日：Start"
      outlined
      type="date"
      @update:date="fetchSchedule()"
      class="q-mr-xs input-in-cart-modal"
    />
    <span class="flex content-center justify-center q-mr-xs">
        〜
    </span>
    <MtFormInputDate
      v-model:date="search.date_end"
      autofocus
      label="作成日：end"
      outlined
      type="date"
      @update:date="fetchSchedule()"
      class="q-mr-xs input-in-cart-modal"
    />
    <MtFormPullDown
      v-model:selected="search.id_insurer"
      :options="useCommonStore().getCommonTypeGeneralInsurerOptionList.map((o: any) => ({ value: o.id_common, label: o.memo_etc1}))"
      label="保険会社"
      outlined
      @update:selected="fetchSchedule()"
      class="q-mr-xs input-in-cart-modal"
    />
    <MtFormPullDown
      v-model:selected="search.type_status_application"
      :options="typeStatusApplication.filter((o: any) => o.value != 1)"
      label="請求ステータス"
      outlined
      @update:selected="fetchSchedule()"
      class="q-mr-xs input-in-cart-modal"
    />
    <q-btn
      v-if="false"
      class="q-mr-xs"
      color="primary"
      type="submit"
      unelevated
    >
      <span>PDF出力</span>
    </q-btn>

    <q-btn
      v-if="false"
      class="q-mr-xs"
      color="primary"
      type="submit"
      unelevated
      @click="saveToCSV()"
    >
      <span>CSV出力</span>
    </q-btn>
    <q-btn class="q-mr-xs" outline @click="openSearchModal">
      検索条件
      <q-badge v-if="count > 0" color="red" floating>
        {{ count }}
      </q-badge>
    </q-btn>
    <q-btn
      class="q-mr-xs"
      outline
      unelevated
      @click="()=> {
        useCartStore().setAdditionalSearchParams(null);
        search = {page_size: 50}
      }"
    >
      <span> クリア </span>
    </q-btn>

    <q-btn
      class="hide-tablet q-mr-xs"
      flat
      icon="sync"
      round
      size="24"
      @click="fetchSchedule"
    />
  </MtModalHeader>
  <q-card-section :style="{ width: 'calc(100vw - 50px)' }" class="content ">
    <MtTable2
      :columns="columns"
      :rows="rowList"
      :style="{ height: 'calc(100vh - 205px)', }"
      bordered
      flat
      @checked="checkedRowList"
      :expand-row="true"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          class="cursor-pointer"
          @click="openClaimDetail(row)"
        >
          <div
            v-if="col.field == 'checkbox'"
          >
            <MtFormCheckBox v-model:checked="row.checked" />
          </div>

          <div v-if="col.field == 'number_cart'" key="number_cart" auto-width>
            <div class="body1 regular text-grey-900" @click="openCart(row)">
              <span class="cursor-pointer">
                <span class="text-blue cursor-pointer">
                  {{ row?.cart?.number_cart }}
                </span>
              </span>
            </div>
          </div>
          <div
            v-if="col.field == 'type_insurer'"
            key="type_insurer"
            auto-width
          >
            <div class="body1 regular text-grey-900">
              {{
                useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                  (v) => v.id_common == row?.pet_insurance?.id_cm_insurer
                )?.memo_etc1
              }}
            </div>
          </div>

          <div
            v-if="col.field == 'datetime_application'"
            key="datetime_application"
            auto-width
          >
            <div class="body1 row no-wrap regular">
              {{ formatDate(row?.datetime_application) }}
            </div>
          </div>
          <div
            v-if="col.field == 'date_cart'"
            key="date_cart"
            auto-width
          >
            <div class="body1 row no-wrap regular">
              {{ formatDate(row?.cart.date_cart) }}
            </div>
          </div>
          <div
            v-if="col.field == 'datetime_insert'"
            key="datetime_insert"
            auto-width
          >
            <div class="body1 row no-wrap regular">
              {{ formatDate(row?.datetime_insert) }}
            </div>
          </div>

          <div
            v-if="col.field == 'type_status_application'"
            key="type_status_application"
            auto-width
          >
            <div class="body1 row no-wrap regular">
              {{
                typeStatusApplication.find(
                  (v) => v.value == row?.type_status_application
                )?.label
              }}
            </div>
          </div>
          <div
            v-if="col.field == 'tgt_amount'"
            key="tgt_amount"
            auto-width
          >
            {{ row?.tgt_amount ? parseInt(row?.tgt_amount) : '' }}
          </div>
          <div
            v-if="col.field == 'ins_amount'"
            key="ins_amount"
            auto-width
          >
            {{ row?.ins_amount ? parseInt(row?.ins_amount) : '' }}
          </div>
          <div
            v-if="col.field == 'customer_name'"
            key="customer_name"
            auto-width
          >
            <div
              class="body1 column regular"
              @click="openCustomerModal(row?.customer)"
            >
              <span class="caption1 regular text-grey-700"
                >{{ row.customer?.name_kana_family }}
                {{ row.customer?.name_kana_first }}</span
              >
              <span class="cursor-pointer">
                <span class="text-blue cursor-pointer">
                  {{ row.customer?.name_family }}
                  {{ row.customer?.name_first }}
                </span>
                <q-icon
                  v-if="labelColor(row.customer?.type_customer_color)"
                  :color="labelColor(row.customer?.type_customer_color)"
                  name="circle"
                  size="13px"
                  :style="{ color: labelColor(row.customer?.type_customer_color) }"
                />
              </span>
            </div>
          </div>
          <div v-if="col.field == 'pet_name'" key="pet_name" auto-width>
            <div class="body1 column regular">
              <span class="caption1 regular text-grey-700">{{
                row.pet?.name_kana_pet
              }}</span>
              <span>{{ row?.pet?.name_pet }}</span>
            </div>
          </div>

          <div v-if="col.field == 'security_number'" key="security_number" auto-width>
            <div class="body1 column regular">
              {{ row?.c_id }}
            </div>
          </div>

          <div v-if="col.field == 'approval_number'" key="approval_number" auto-width>
            <div class="body1 column regular">
              {{ row?.rezept_cd }}
            </div>
          </div>

        </td>
      </template>
      <template v-slot:expandedRow="{row}">
        <div class="absolute algin-expand">{{ row.memo_error }}</div>
      </template>
    </MtTable2>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn
        v-if="props.isSearch"
        class="q-ml-md"
        color="primary"
        unelevated
        @click="selectAndClose()"
      >
        <span>選択を適用</span>
      </q-btn>
      <q-btn
        :disable="bulkClaimFlg"
        class="q-ml-md"
        color="primary"
        label="保険請求の申請"
        @click="submitBulkClaim"
      >
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.input-in-cart-modal {
  min-width: 100px;
}
.grid {
  width: 350px;
  display: grid;
  grid-template-columns: 47% 6% 47%;
}

.algin-expand {
  right: 30px;
}
</style>
