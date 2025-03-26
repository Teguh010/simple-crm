<script lang="ts" setup>
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { exportFile } from 'quasar'
import * as Encoding from 'encoding-japanese';

// Components
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
// Utilities
import mtUtils from '@/utils/mtUtils'
import { copyText, formatDate, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'

// Stores
import useAuthStore from '@/stores/auth'
import useServiceDetailStore from '@/stores/service-details'
import useCustomerStore from '@/stores/customers'
import useCliCommonStore from '@/stores/cli-common'
import useCommonStore from '@/stores/common'
import useEmployeeStore from '@/stores/employees'

// Types and Enums
import { typePetGender, typeRabiesProcess, typeRabiesRound, typeTel } from '@/utils/enum'
import { RabiesType } from '@/types/types'

// Lazy-Loaded Components (for pages)
const UpdateCustomerModal = defineAsyncComponent(() => import('@/pages/master/customerPet/UpdateCustomerModal.vue'));
const AdditionalRabiesFilterModal = defineAsyncComponent(() => import('@/pages/request/inject/AdditionalRabiesFilterModal.vue'));
const ViewPetDetailModal = defineAsyncComponent(() => import('@/pages/master/customerPet/ViewPetDetailModal.vue'));

// Store nitialization
const authStore = useAuthStore();
const serviceDetailStore = useServiceDetailStore()
const cliCommonStore = useCliCommonStore()
const commonStore = useCommonStore()

const props = withDefaults(defineProps<{ isSearch: boolean }>(), {
  isSearch: false
})

const emits = defineEmits(['close'])

function closeModal() {
  emits('close')
}

// const count = ref(0)
const router = useRouter()
const tableRef = ref(null)

const columns = [
  {
    name: 'date_start',
    label: '接種日',
    field: 'date_start',
    style: 'width:2%'
  }, {
    name: 'customer',
    label: 'オーナー ',
    field: 'customer',
    style: 'width:6%'
  }, {
    name: 'address',
    label: '住所',
    field: 'address',
    style: 'width: 6%'
  }, {
    name: 'phone',
    label: '電話番号',
    field: 'phone',
    style: 'width: 6%'
  },
  {
    name: 'pet',
    label: 'ペット',
    field: 'pet',
    align: 'left',
    style: 'width: 6%'
  },
  {
    name: 'pet_gender',
    label: '性別',
    field: 'pet_gender',
    align: 'left',
    style: 'width:6%'
  },
  {
    name: 'pet_hair_color',
    label: '品種 / 毛色',
    field: 'pet_hair_color',
    align: 'left',
    style: 'width: 6%;'
  },
  {
    name: 'pet_birthday',
    label: '生年月日',
    field: 'pet_birthday',
    align: 'left',
    style: 'width: 6%'
  },
  {
    name: 'code_city_hall',
    label: '保健所',
    field: 'code_city_hall',
    align: 'left',
    style: 'width: 6%'
  },
  {
    name: 'license_id',
    label: '鑑札番号',
    field: 'license_id',
    align: 'left',
    style: 'width: 6%'
  },
  {
    name: 'datetime_licensed',
    label: '鑑札登録日',
    field: 'datetime_licensed',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'num_tag',
    label: '済票',
    field: 'num_tag',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'date_tag_issued',
    label: '済票発行日',
    field: 'date_tag_issued',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'lot_number1',
    label: 'ロット番号',
    field: 'lot_number1',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'id_employee_registered',
    label: '登録担当',
    field: 'id_employee_registered',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'type_rabies_process',
    label: '処理区分',
    field: 'type_rabies_process',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'type_rabies_round',
    label: '代行区分',
    field: 'type_rabies_round',
    align: 'left',
    style: 'width: 5%'
  },
  {
    name: 'リクエスト番号',
    label: 'リクエスト番号',
    field: 'request',
    align: 'left',
    style: 'width: 5%'
  }
]

const search = ref({
  date_start: getDaysBefore(7),
  date_end: getDateToday(),
  date_tag_issued_start: null,
  date_tag_issued_end: null,
  code_city_hall: null,
  address_prefecture: null,
  address_cities: null,
})
const rowList = ref<RabiesType[]>([])

const alreadyVisited = ref([])
const nextPage = ref(null)

const labelColor = (color: number) => {
  if (color) {
    return cliCommonStore.getCliCommonCustomerColorList.find((v) => v.code_func1 === color.toString())?.text1
  }

  return ''
}

const openSearchModal = async () => {
  const confirm = await mtUtils.confirm('検索結果の反映には数分かかる場合があります。\n検索しますか？', 'Alert', 'OK')
  if (!confirm) return
  search.value.address_prefecture = null;
  search.value.address_cities = null;
  await mtUtils.smallPopup(AdditionalRabiesFilterModal, {
    search: search.value, callBackSearch: (value) => {
      search.value = { ...search.value, ...value }
    }
  })
  nextPage.value = null
  rowList.value = []
  await fetchSchedule(false)
}

async function fetchSchedule(fetchMore: boolean = true) {
  if (fetchMore) {
    if (!nextPage.value) {
      await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
      return
    }
  }

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchRabiesList', {
    hide_preparation: true,
    ...search.value,
    page: nextPage.value
  }, true)


  if (response) {

    if (!alreadyVisited.value.includes(nextPage.value)) {
      rowList.value.push(...response.data)
      alreadyVisited.value.push(response.current)
    }
    if (response.next) {
      nextPage.value = response.next.split('page=')[1]

    } else {
      nextPage.value = null
    }
  }
}

const apiCalled = ref(false)

let lastVerticalPosition = 0
let lastHorizontalPosition = 0

async function fetchMore(e) {

  if (e.horizontalPosition != lastHorizontalPosition && e.verticalPercentage == 1) {
    return
  }

  if (e.lastVerticalPosition != e.verticalPosition) {
    lastVerticalPosition = e.verticalPosition
    lastHorizontalPosition = e.horizontalPosition
  }
  
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchSchedule()
    apiCalled.value = false
    lastHorizontalPosition = e.horizontalPosition
  }

}

async function openCustomerModal(row: any) {
  await useCustomerStore().selectCustomer(row.id_customer)
  await mtUtils.popup(UpdateCustomerModal, {
    data: useCustomerStore().getCustomer
  })
  fetchSchedule()
}

const onRequestClick = (row: RabiesType) => {
  const route = router.resolve({ name: 'RequestDetail', params: { id: row.request.id_request } })?.href
  return window.open(route, '_blank')
}

const onPetClick = async (row: RabiesType) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.customer.id_customer,
    id_pet: row.pet.id_pet,
  })
}

const downloadCSV = () => {
  // Explicitly define the order of all columns in the header
  const headers = [
    '接種日', '診察券番号', 'オーナー', '郵便番号', '都道府県', '住所', '電話番号', 'ペットCD', 'ペット名',
    '性別', '品種 / 毛色', '生年月日', '保健所', '鑑札番号', '鑑札登録日', '済票',
    '済票発行日', 'ロット番号', '登録担当', '処理区分', '代行区分', 'リクエスト番号'
  ];

  // Prepare the CSV rows
  const rows = rowList.value.map(row => {
    return [
      formatDate(row.inject?.date_start) ?? '', // 接種日
      row.customer?.code_customer ?? '', // 診察券番号
      row.customer?.name_family + ' ' + row.customer?.name_first ?? '', // オーナー
      row.customer?.address[0]?.zip_code ?? '', // 郵便番号
      row.customer?.address[0]?.address_prefecture ?? '', // 都道府県
      `${row.customer?.address[0]?.address_city ?? ''} ${ row.customer?.address[0]?.address_other ?? '' }`, // 住所
      // `${row.customer.address[0]?.address_prefecture ?? ''} ${row.customer.address[0]?.address_city ?? ''} ${row.customer.address[0]?.address_other ?? ''}`, // 住所
      row.customer?.customer_tel[0]?.tel_full ? `"${row.customer?.customer_tel[0]?.tel_full}"` : '', // Preserve leading zeros for 電話番号
      row.pet?.code_pet ?? '', // ペットCD
      row.pet?.name_pet ?? '', // ペット名
      typePetGender.find((p) => row?.pet.type_pet_gender == p.value)?.label ?? '', // 性別
      `${useCommonStore().getCommonBreedOptionList.find((p) => row?.pet.id_cm_breed == p.id_common)?.name_common ?? ''} / ${useCliCommonStore().getCliCommonHairColorList.find((p) => row?.pet.id_cm_hair == p.id_cli_common)?.name_cli_common ?? ''}`, // 品種 / 毛色
      formatDate(row.pet?.date_birth) ?? '', // 生年月日
      row.code_city_hall ?? '', // 保健所
      row.pet?.license_id ?? '', // 鑑札番号
      formatDate(row.pet?.datetime_licensed) ?? '', // 鑑札登録日
      row.num_tag ?? '', // 済票
      formatDate(row.date_tag_issued) ?? '', // 済票発行日
      row.inject_detail?.lot_number1 ?? '', // ロット番号
      useEmployeeStore().getEmployeeListWOF.find((e) => row?.id_employee_registered == e.value)?.label ?? '', // 登録担当
      typeRabiesProcess.find((e) => row?.type_rabies_process == e.value)?.label ?? '', // 処理区分
      typeRabiesRound.find((e) => row?.type_rabies_round == e.value)?.label ?? '', // 代行区分
      row.request?.number_request ?? '' // リクエスト番号
    ];
  });

  // Combine headers and rows into CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...rows.map(row => row.join(',')) // Data rows
  ].join('\n');

   // Convert CSV content to Shift-JIS
   const shiftJISArray = Encoding.stringToCode(csvContent);
  const shiftJIS = Encoding.convert(shiftJISArray, {
    to: 'SJIS',
    from: 'UNICODE',
  });
  const uint8Array = new Uint8Array(shiftJIS);

  // Generate the file name
  const formattedDate = getDateToday('YYYYMMDD');
  const loggedInUserName = authStore.getAuthUser.name_display;
  const fileName = `${formattedDate}_狂犬病予防接種リスト_${loggedInUserName}.csv`;

  // Export the CSV file using Quasar's exportFile utility
  const status = exportFile(fileName, uint8Array, 'text/csv');

  if (status !== true) {
    console.error('Error exporting file');
  }
};


onMounted(async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [2, 3] })

  if (props.isSearch) {
    rowList.value = serviceDetailStore.getSelectedServiceDetailRecordList
  }
  await fetchSchedule(false)
})
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <div class="row gap-2 items-center flex-1">
        <q-toolbar-title class="text-grey-900 title2 bold prescription-title">
          狂犬病予防接種済一覧
        </q-toolbar-title>
        <MtFormInputDate
          v-model:date="search.date_start"
          autofocus
          label="接種日：Start"
          outlined
          type="date"
          class="col-2"
        />
        <MtFormInputDate
          v-model:date="search.date_end"
          label="接種日：end"
          outlined
          type="date"
          class="col-2"
        />
        <!-- <MtFormInputDate
          v-model:date="search.date_tag_issued_start"
          autofocus
          label="済票発行日: Start"
          outlined
          type="date"
          class="col-2"
        />
        <MtFormInputDate
          v-model:date="search.date_tag_issued_end"
          autofocus
          label="済票発行日: End"
          outlined
          type="date"
          class="col-2"
        /> -->
        <q-btn outline @click="openSearchModal">
          検索条件
        </q-btn>
        <q-btn
          outline
          unelevated
          @click="()=> {
            search = {
              date_start: null,
              date_end: null,
              date_tag_issued_start: null,
              date_tag_issued_end: null,
            }
            nextPage = null
            rowList = []
            fetchSchedule(false)
          }"
        >
          <span> クリア </span>
        </q-btn>
        <q-btn
          outline
          class="q-pl-sm q-pr-md"
          @click="downloadCSV"
        >
          <q-icon name="download" class="text-grey-700 q-mr-xs" />
          <span> CSV </span>
        </q-btn>
        <q-btn
          tabindex="3"
          color="grey-800"
          text-color="white"
          class="q-mr-sm"
          unelevated
          @click="()=>{
              nextPage = null
              rowList = []
              fetchSchedule(false)
            }"
        >
          <q-icon name="search" size="20px" />
          <span class="hide-tablet">
            検索
          </span>
        </q-btn>
      </div>
    </MtModalHeader>
    <q-scroll-area
      class="separate-scrollbar"
      @scroll="fetchMore"
    >
      <MtTable2
        ref="tableRef"
        :columns="columns"
        :rows="rowList"
        bordered
        :style="{ width: 'calc(150vw)' , height: 'calc(100vh - 110px)'}"
        flat
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            class="cursor-pointer"
          >
            <div
              v-if="col.field == 'date_start'"
              key="date_start"
            >
              <div v-if="row.inject" auto-width class="body2 row no-wrap regular">
                {{ formatDate(row.inject.date_start) ?? '' }}
              </div>
            </div>

            <div
              v-if="col.field == 'num_tag'"
              key="num_tag"
            >
              <div v-if="row" auto-width class="body2 row no-wrap regular">
                {{ row?.num_tag ?? '' }}
              </div>
            </div>
            <div
              v-if="col.field == 'date_tag_issued'"
              key="date_tag_issued"
            >
              <div v-if="row" auto-width class="body2 row no-wrap regular">
                {{ formatDate(row.date_tag_issued) ?? '' }}
              </div>
            </div>

            <div
              v-else-if="col.field == 'customer'"
              key="customer_name"
              auto-width
            >
              <div
                v-if="row.customer"
                class="body2 column regular"
                @click="openCustomerModal(row?.customer)"
              >
              <span>{{ row.customer?.code_customer }}</span>
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
                  class="q-ml-xs"
                />
              </span>
              </div>
            </div>

            <div v-else-if="col.field == 'code_city_hall'" key="code_city_hall" auto-width>
              <div v-if="row" class="body2 column regular">
                {{ row.code_city_hall }}
              </div>
            </div>

            <div v-else-if="col.field == 'pet'" key="pet" auto-width>
              <div v-if="row.pet" class="body2 column regular" @click="onPetClick(row)">
                <div v-if="row.pet.code_pet">
                  {{ row.pet.code_pet }}
                  <span class="caption1 regular text-grey-700">{{ row.pet?.name_kana_pet }}</span>
                </div>
                <span class="text-blue">{{ row?.pet?.name_pet }}</span>
              </div>
            </div>


            <div v-else-if="col.field == 'pet_birthday'" key="pet_birthday" auto-width>
              <div v-if="row.pet" auto-width class="body2 row no-wrap regular">
                {{ row?.pet.date_birth ? formatDate(row?.pet.date_birth) : '' }}
              </div>
            </div>

            <div v-else-if="col.field == 'pet_gender'" key="pet_gender">
              <div v-if="row.pet" class="body2 row">
                {{ typePetGender.find((p) => row?.pet.type_pet_gender == p.value)?.label ?? '' }}
              </div>
            </div>


            <div v-else-if="col.field == 'pet_hair_color'" key="pet_hair_color">
              <div v-if="row.pet" class="body2 row">
                {{ useCliCommonStore().getCliCommonHairColorList.find((p) => row?.pet.id_cm_hair == p.id_cli_common)?.name_cli_common ?? ''
                }}
              </div>
              <div v-if="row.pet" class="body2 row">
                {{ useCommonStore().getCommonBreedOptionList.find((p) => row?.pet.id_cm_breed == p.id_common)?.name_common ?? ''
                }}
              </div>
            </div>

            <div v-else-if="col.field == 'license_id'" key="license_id" auto-width>
              <div v-if="row.pet" auto-width class="body2 row no-wrap regular">
                {{ row?.pet.license_id ?? '' }}
              </div>
            </div>

            <div v-else-if="col.field == 'datetime_licensed'" key="datetime_licensed" auto-width>
              <div v-if="row.pet" auto-width class="body2 row no-wrap regular">
                {{ row?.pet.datetime_licensed ? formatDate(row?.pet.datetime_licensed) : '' }}
              </div>
            </div>

            <div v-else-if="col.field == 'address'" key="address" auto-width>
              <div v-if="row.customer && row.customer.address && row.customer.address.length && row.customer.address.length > 0"
                   class="body2 column regular">
              <span class="regular text-grey-700">
                {{ row.customer.address[0]?.zip_code ?? '' }}
              </span>    
              <span class="regular text-grey-700">
                {{ row.customer.address[0]?.address_prefecture ?? '' }}
              </span>
              <span class="regular text-grey-700">
                {{ row.customer.address[0]?.address_city ?? '' }}
              </span><span class="regular text-grey-700">
                {{ row.customer.address[0]?.address_other ?? '' }}
              </span>
              </div>
            </div>

            <div v-else-if="col.field == 'phone'" key="phone" auto-width @click="copyText(row.customer.customer_tel[0].tel_full)">
              <div v-if="row.customer && row.customer.customer_tel	 && row.customer.customer_tel.length && row.customer.customer_tel.length > 0"
                   class="body2 column regular">
              <span class="regular text-grey-700">
                {{ typeTel.find((t) => row.customer.customer_tel[0]?.type_tel == t.value)?.label ?? '' }}
              </span><span class="regular text-grey-700">
                {{ row.customer.customer_tel[0]?.title_tel ?? '' }}
              </span><span class="regular text-grey-700 text-blue">
                {{ row.customer.customer_tel[0]?.tel_full ?? '' }}
              </span>
              </div>
            </div>
            <div v-else-if="col.field == 'id_employee_registered'" key="id_employee_registered" auto-width>
              <div v-if="row.id_employee_registered" class="body2 column regular">
                {{ useEmployeeStore().getEmployeeListWOF.find((e) => row?.id_employee_registered == e.value)?.label ?? ''
                }}
              </div>
            </div>          
            <div v-else-if="col.field == 'type_rabies_process'" key="type_rabies_process" auto-width>
              <div class="body2 column regular" v-if="row.type_rabies_process">
                {{ typeRabiesProcess.find((e)=> row?.type_rabies_process == e.value)?.label ?? '' }}
              </div>
            </div>
            <div v-else-if="col.field == 'type_rabies_round'" key="type_rabies_round" auto-width>
              <div class="body2 column regular" v-if="row.type_rabies_round">
                {{ typeRabiesRound.find((e)=> row?.type_rabies_round == e.value)?.label ?? '' }}
              </div>
            </div>
            <div v-else-if="col.field == 'lot_number1'" key="lot_number1" auto-width>
              <div v-if="row && row.inject_detail" class="body2 column regular">
                {{ row.inject_detail.lot_number1 ?? '' }}
              </div>
            </div>

            <div v-else-if="col.field == 'request'" key="request" auto-width>
              <div v-if="row && row.request" class="body2 column regular text-blue" @click="onRequestClick(row)">
                {{ row.request.number_request ?? '' }}
              </div>
            </div>

          </td>
        </template>
      </MtTable2>
    </q-scroll-area>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  width: 350px;
  display: grid;
  grid-template-columns: 47% 6% 47%;
}

.separate-scrollbar {
  height: calc(100vh - 110px);
  width: 100%;
  max-width: 100%;

  :deep(.q-scrollarea__content) {
    max-height: unset !important;
  }
}

.hide-tablet {
  @media screen and (max-width: 1280px) {
    display: none;
  }
}
</style>
