<script setup lang="ts">
import { onMounted, ref,watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import {
  formatDate,
  getCustomerLabelColor,
  getDateToday,
  getDaysBefore,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import useServiceDetailStore from '@/stores/service-details'
import useCategoryStore from '@/stores/categories'
import AdditionalFilterServiceDetailModal from './AdditionalFilterServiceDetailModal.vue'
import mtUtils from '@/utils/mtUtils'
import UpdateServiceDetailModal from './UpdateServiceDetailModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useRequestStore from '@/stores/requests'
import { storeToRefs } from 'pinia'
import ScheduledPDF from '@/pages/request/serviceDetail/ScheduledPDF.vue'
import useCommonStore from '@/stores/common'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCliCommonStore from '@/stores/cli-common'
import ViewPetDetailModal from '../../master/customerPet/ViewPetDetailModal.vue'

const count = ref(0)
const commonStore = useCommonStore()
const requestStore = useRequestStore()
const serviceDetailStore = useServiceDetailStore()
const categoryStore = useCategoryStore()
const cliCommonStore = useCliCommonStore()

const { getServiceDetail, getServiceDetailParams } =
  storeToRefs(serviceDetailStore)

const categoryName = (value: any) =>
  categoryStore.getAllCategories.find((v) => v.value === value)?.label

const search = ref({
  datetime_service_start: getDaysBefore(7),
  datetime_service_end: getDateToday(),
  number_service_detail: null,
  name_item_service: null,
  id_customer: null,
  id_pet: null,
  flg_complete: false,
  id_category1: null,
  id_category2: null,
  id_disease: null
})
const columns = [
  {
    name: 'number_service_detail',
    label: '治療サービス番号',
    field: 'number_service_detail'
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
    name: 'code_pet',
    label: 'ペットCD',
    field: 'code_pet',
    align: 'left'
  },
  {
    name: 'pet_name',
    label: 'ペット名',
    field: 'pet_name',
    align: 'left',
    style: 'width: 13%'
  },
  {
    name: 'name_item_service',
    label: '治療サービス明細',
    field: 'name_item_service',
    align: 'left',
    style: 'width: 20%'
  },
  {
    name: 'name_category1',
    label: '大分類',
    field: 'name_category1',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'name_category2',
    label: '中分類',
    field: 'name_category2',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'flg_complete',
    label: '完了',
    field: 'flg_complete',
    align: 'left',
    style: 'width: 5%'
  }
]

const openSearchModal = async () => {
  count.value = 0
  let popup: any = {
    searchData: false
  }
  await mtUtils.smallPopup(AdditionalFilterServiceDetailModal, {
    search: search.value,
    popup
  })
  if (!popup.searchData) {
    return false
  }
  count.value = 0
  const tempVar = getServiceDetailParams.value
  Object.keys(tempVar).forEach((key) => {
    if (key != 'datetime_service_start' && key != 'datetime_service_end') {
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
  if (getServiceDetailParams.value) {
    search.value = getServiceDetailParams.value
    search.value.id_cm_animal_list = JSON.stringify(
      search.value.id_cm_animal_list
    )
    search.value.json = true
    searchData()
  }
}

const clearSearch = () => {
  count.value = 0
  search.value = {
    datetime_service_start: null,
    datetime_service_end: null,
    number_service_detail: null,
    name_item_service: null,
    id_customer: null,
    id_pet: null,
    flg_complete: false,
    id_category1: null,
    id_category2: null,
    id_disease: null
  }
}

const onRowClick = async (row: any) => {
  serviceDetailStore.setServiceDetail(row)
  const pageTitle = `治サ: ${getServiceDetail.value.name_item_service}`
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {
    data: requestStore.getRequest,
    fromPage: '治療サービス一覧',
    pageTitle
  })
  searchData()
}

const openDetailPet = async (row: any) => {
  const pageTitle = `治サ: ${getServiceDetail.value.name_item_service}`
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.id_customer,
    id_pet: row.id_pet,
    code_customer: row.code_customer,
    code_pet: row.code_pet,
    tab: row.tab,
    fromPage: '治療サービス一覧',
    pageTitle
  })
  await searchData()
}

const searchData = () => {
  if (typeof search.value.date_range_list != 'string') {
    search.value.date_range_list = JSON.stringify(search.value.date_range_list)
  }

  Promise.all([
    useCommonStore().fetchPreparationCommonList({ code_common: [1] }),
    serviceDetailStore.fetchAllServiceDetails({
      ...search.value,
      page_size: 350
    })
  ])
}

async function openPrintSchedule() {
  const modal = await mtUtils.popup(ScheduledPDF)
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
    searchData()
  }
}
watch(
  () => search.value.datetime_service_start,
  (newStartDate) => {
    search.value.datetime_service_end = newStartDate;
  }
);
const getTypeAnimal = (id_cm_animal: number) => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v: any) => v.id_common == id_cm_animal
  )
}
const getTypeAnimalColor = (id_cm_animal: number) => {
  const typeAnimal = getTypeAnimal(id_cm_animal)
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}

onMounted(async () => {
  searchData()
  // set page title
  setPageTitle('治療サービス一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          治療サービス一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="search.datetime_service_start"
                outlined
                type="date"
                autofocus
                tabindex="1"
                label="実施日：Start"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="search.datetime_service_end"
                outlined
                class="q-mx-sm"
                tabindex="2"
                type="date"
                label="実施日：End"
                @keydown.enter="moveNext"
              />
              <q-btn @click="openSearchModal" outline class="q-mr-sm">
                詳細検索
                <!--          <q-badge v-if="count > 0" color="red" floating>-->
                <!--            {{ count }}-->
                <!--          </q-badge>-->
              </q-btn>
              <q-btn
                unelevated
                outline
                color="grey-100"
                text-color="primary"
                class="q-mr-sm"
                @click="clearSearch()"
              >
                クリア
              </q-btn>
              <q-btn
                tabindex="3"
                unelevated
                color="grey-800"
                text-color="white"
                @click="searchData"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="search.datetime_service_start"
                outlined
                type="date"
                class="q-mr-sm ipad-field-size-md"
                autofocus
                tabindex="1"
                label="実施日：Start"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="search.datetime_service_end"
                outlined
                class="ipad-field-size-md"
                tabindex="2"
                type="date"
                label="実施日：End"
                @keydown.enter="moveNext"
              />
              <q-btn @click="openSearchModal" outline class="q-mx-sm">
                <q-icon name="tune" />
                <!--          <q-badge v-if="count > 0" color="red" floating>-->
                <!--            {{ count }}-->
                <!--          </q-badge>-->
              </q-btn>
              <q-btn
                tabindex="3"
                unelevated
                color="grey-800"
                text-color="white"
                @click="searchData"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果 :<span class="q-ml-sm"
          >{{ serviceDetailStore.getAllServiceDetails.length }}件</span
        >
      </div>
      <q-btn
        color="grey-100"
        outline
        text-color="primary"
        unelevated
        @click="openPrintSchedule"
      >
        <q-icon class="text-grey-500 q-mr-xs" name="filter_alt" size="20px" />
        絞込 / 抽出
      </q-btn>
    </div>
    <MtTable2
      :columns="columns"
      :rows="serviceDetailStore.getAllServiceDetails"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100vh - 110px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
          :class="{
            flg_cancel_row: row.flg_cancel,
            flg_complete_row: row.flg_complete
          }"
        >
          <div
            v-if="col.field == 'number_service_detail'"
            auto-width
            key="number_service_detail"
          >
            {{ row.number_service_detail }}
          </div>
          <div v-if="col.field == 'code_pet'" auto-width key="code_pet">
            {{ row.pet?.code_pet }}
          </div>
          <div
            v-if="col.field == 'datetime_service'"
            auto-width
            key="datetime_service"
          >
            <div class="row no-wrap">
              {{ formatDate(row.datetime_service_start) }} ~
              {{ formatDate(row.datetime_service_end) }}
            </div>
          </div>

          <div
            v-if="col.field == 'name_category1'"
            key="name_category1"
            auto-width
          >
            <div class="row no-wrap">
              {{ row.name_category1 }}
            </div>
          </div>
          <div
            v-if="col.field == 'name_category2'"
            key="name_category2"
            auto-width
          >
            <div class="row no-wrap">
              {{ row.name_category2 }}
            </div>
          </div>
          <div
            v-if="col.field == 'customer_name'"
            auto-width
            key="customer_name"
          >
            <div class="column">
              <span class="caption2 regular text-grey-700"
                >{{ row.customer?.name_kana_family }}
                {{ row.customer?.name_kana_first }}</span
              >
              <span>
                {{ row.customer?.name_family }} {{ row.customer?.name_first }}
                <q-icon
                  v-if="row.customer.type_customer_color"
                  size="12px"
                  name="circle"
                  class="q-ml-xs"
                  :color="
                    getCustomerLabelColor(row.customer.type_customer_color)
                  "
                  :style="{
                    color: getCustomerLabelColor(
                      row.customer.type_customer_color
                    )
                  }"
                />
              </span>
            </div>
          </div>
          <div v-if="col.field == 'pet_name'" auto-width key="pet_name">
            <div
              @click.stop="openDetailPet(row)"
              class="avatar-container"
              v-if="row.pet"
            >
              <img
                v-if="row.pet"
                :src="getPetImageUrl(row.pet)"
                @error="handleImageError($event, row.pet)"
                :alt="row.pet.name_pet"
                class="image-responsive"
                loading="lazy"
              />
              <div v-else class="default bg-grey-300" />
              <div>
                <span class="caption2 regular text-grey-700">{{
                  row.pet.name_kana_pet
                }}</span>
                <div>
                  {{ row.pet.name_pet }}
                  <q-icon
                    size="12px"
                    name="circle"
                    class="q-ml-xs"
                    :color="getTypeAnimalColor(row.pet.id_cm_animal)"
                    :style="{ color: getTypeAnimalColor(row.pet.id_cm_animal) }"
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="col.field == 'name_item_service'"
            auto-width
            key="name_item_service"
          >
            <div class="row no-wrap">
              {{ row.name_item_service }}
            </div>
          </div>
          <div v-if="col.field == 'id_category1'" auto-width key="id_category1">
            {{ categoryName(row.id_category1) }}
          </div>
          <div v-if="col.field == 'id_category2'" key="id_category2">
            {{ categoryName(row.id_category2) }}
          </div>
          <div v-if="col.field == 'flg_complete'" class="text-green">
            <q-icon v-if="row[col.field]" size="24px" name="check_circle" />
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
.tableBox {
  margin-top: 20px;
}
</style>
