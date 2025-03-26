<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'

import useServiceDetailStore from '@/stores/service-details'
import { onMounted, ref } from 'vue'
import { formatDate, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import AdditionalSchedulePDF from '@/pages/request/serviceDetail/AdditionalSchedulePDF.vue'
import selectOptions from '@/utils/selectOptions'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useCustomerStore from '@/stores/customers'
import UpdateCustomerModal from '@/pages/master/customerPet/UpdateCustomerModal.vue'
import { storeToRefs } from 'pinia'
import useCliCommonStore from '@/stores/cli-common'

const serviceDetailStore = useServiceDetailStore()
const cliCommonStore = useCliCommonStore()
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)

const props = withDefaults(defineProps<{ isSearch: boolean }>(), {
  isSearch: false
})

const emits = defineEmits(['close'])

function closeModal() {
  emits('close')
}

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
    name: 'number_service_detail',
    label: '治療サービス番号',
    field: 'number_service_detail',
    style: 'width:12%'
  },
  {
    name: 'datetime_service',
    label: '実施日',
    field: 'datetime_service',
    align: 'left',
    style: 'width:18%'
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
    name: 'name_item_service',
    label: '治療サービス明細',
    field: 'name_item_service',
    align: 'left',
    style: 'width: 12%'
  },
  {
    name: 'address',
    label: 'DM住所',
    field: 'address',
    align: 'left',
    style: 'width: 20%'
  }
]

const search = ref({
  page_size: 500,
  datetime_service_start: getDaysBefore(7),
  datetime_service_end: getDateToday(),
  id_customer: null,
  id_pet: null,
  flg_complete: false,
  id_category1: null,
  id_category2: null,
  id_disease: null
})
const rowList = ref([])

const labelColor = (type_customer_color) => {
  getCliCommonCustomerColorList.value.find(
    (v) => v.code_func1 == type_customer_color
  )?.name_cli_common
}

function getAddress(address: any) {
  if (address && address.length && address.length > 0) {
    const tempAddress = address[0]
    if (tempAddress)
      return {
        strAddress: `${tempAddress?.zip_code}`
          .concat(tempAddress?.address_prefecture)
        .concat(tempAddress?.address_city)
          .concat(tempAddress?.address_other),
        address_prefecture: tempAddress?.address_prefecture,
        zip_code: tempAddress?.zip_code,
        address_city: tempAddress?.address_city,
        address_other: tempAddress?.address_other
      }
  }
  return {
    strAddress: '',
    address_prefecture: '',
    zip_code: '',
    address_city: '',
    address_other: ''
  }
}

function checkedRowList(value: any) {
  rowList.value = rowList.value.map((r: any) => ({ ...r, checked: value }))
}
const openSearchModal = async () => {
  count.value = 0
  await mtUtils.smallPopup(AdditionalSchedulePDF, {
    search: search.value
  })
  const tempVar = serviceDetailStore?.getSearchScheduleParams
  if (tempVar) {
    Object.keys(tempVar).forEach((key) => {
      if (
        ![
          'datetime_service_start',
          'datetime_service_end',
          'id_item_service',
          'id_cm_animal'
        ].includes(key)
      ) {
        if (
          (['number', 'string', 'boolean'].includes(typeof tempVar[key]) &&
            tempVar[key] !== '' &&
            tempVar[key] == true) ||
          tempVar[key]?.length > 0
        ) {
          count.value += 1
        }
      }
    })
  }
  search.value = {
    ...serviceDetailStore?.getSearchScheduleParams
  }
  await fetchSchedule()
}

async function fetchSchedule() {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'mst/SearchScheduleList',
    {
      ...search.value
    }
  )

  if (response) {
    const seenPets = new Set()
    rowList.value = response
      .map((sd) => ({ ...sd, checked: true }))
      .filter((row: any) => {
        const isSeen = seenPets.has(row.id_pet)
        if (!isSeen) {
          seenPets.add(row.id_pet)
          return true
        }
        return false
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
      RQ番号: row?.request?.number_request,
      治療サービス番号: row.number_service_detail,
      実施日: formatDate(row?.datetime_service_start),
      診察券番号: row?.customer?.code_customer,
      オーナー名: `${row?.customer?.name_family} ${row?.customer?.name_first}`,
      ペットCD: row?.pet?.code_pet,
      ペット名: `${row?.pet?.name_kana_pet} ${row?.pet?.name_pet}`,
      治療サービス名: row?.name_item_service,
      郵便番号: getAddress(row?.customer?.address).zip_code,
      都道府県: getAddress(row?.customer?.address).address_prefecture,
      市: getAddress(row?.customer?.address).address_city,
      住所: getAddress(row?.customer?.address).address_other,
      メモ: row.memo_service
    }))

    return obj
      .map(row => {
        return Object.values(row)
          .map(value => {
            if (value === null || value === undefined) {
              return ''
            }
            // Convert to string and escape double quotes
            const stringValue = String(value).replace(/"/g, '""')
            // Enclose fields containing commas or newlines in double quotes
            if (stringValue.search(/("|,|\n)/g) >= 0) {
              return `"${stringValue}"`
            }
            return stringValue
          })
          .join(',')
      })
      .join('\n')
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
  if (props.isSearch) {
    rowList.value = serviceDetailStore.getSelectedServiceDetailRecordList
  }
})
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold prescription-title">
        治療サービスからオーナー・ペット抽出
      </q-toolbar-title>
      <q-btn
        class="hide-tablet"
        flat
        icon="sync"
        round
        size="24"
        @click="fetchSchedule"
      />
      <q-btn class="q-mr-sm" outline @click="openSearchModal">
        詳細検索
        <q-badge v-if="count > 0" color="red" floating>
          {{ count }}
        </q-badge>
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <MtTable2
        :columns="columns"
        :rows="rowList"
        :rowsBg="true"
        :style="{ height: 'calc(100vh - 110px)' }"
        flat
        @checked="checkedRowList"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            :class="{
              flg_cancel_row: row.flg_cancel,
              flg_complete_row: row.flg_complete
            }"
            class="cursor-pointer"
          >
            <div
              v-if="col.field == 'checkbox'"
              key="number_service_detail"
              auto-width
            >
              <MtFormCheckBox v-model:checked="row.checked" />
            </div>

            <div
              v-if="col.field == 'number_service_detail'"
              key="number_service_detail"
              auto-width
            >
              <div class="body1 regular text-grey-900">
                {{ row.number_service_detail }}
              </div>
            </div>
            <div
              v-if="col.field == 'datetime_service'"
              key="datetime_service"
              auto-width
            >
              <div class="body1 row no-wrap regular">
                {{ formatDate(row.datetime_service_start) }} ~
                {{ formatDate(row.datetime_service_end) }}
              </div>
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
                    :color="labelColor(row.customer?.type_customer_color)"
                    name="circle"
                    size="13px"
                  />
                </span>
              </div>
            </div>
            <div v-if="col.field == 'pet_name'" key="pet_name" auto-width>
              <div class="body1 column regular">
                <span class="caption1 regular text-grey-700">{{
                  row.pet?.name_kana_pet
                }}</span>
                <span>{{ row.pet?.name_pet }}</span>
              </div>
            </div>
            <div
              v-if="col.field == 'name_item_service'"
              key="name_item_service"
              auto-width
            >
              <div class="row no-wrap body1 regular">
                {{ row.name_item_service }}
              </div>
            </div>
            <div v-if="col.field == 'address'" key="address" auto-width>
              <div class="body1 column regular">
                <span class="caption1 regular text-grey-700">{{ getAddress(row?.customer?.address)?.strAddress }}</span>
              </div>
            </div>
          </td>
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
          v-if="!props.isSearch"
          class="q-ml-md"
          color="primary"
          type="submit"
          unelevated
          @click="saveToCSV()"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style lang="scss" scoped></style>
