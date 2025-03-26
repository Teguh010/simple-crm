<script lang="ts" setup>
import { computed, onMounted,watch, reactive, ref, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Components
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import ViewPetDetailModal from '../../master/customerPet/ViewPetDetailModal.vue'

// Lazy-Loaded Components
const AdditionInjectFilterModal = defineAsyncComponent(
  () => import('@/pages/request/inject/AdditionInjectFilterModal.vue')
)
const ViewInjectHeaderModal = defineAsyncComponent(
  () => import('@/pages/request/inject/ViewInjectHeaderModal.vue')
)
const SearchRabiesList = defineAsyncComponent(
  () => import('@/pages/request/inject/SearchRabiesList.vue')
)

// Utilities
import {
  formatDate,
  getCustomerName,
  getDateToday,
  getDaysBefore,
  getFullPetName,
  getCustomerLabelColor,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { setPageTitle } from '@/utils/pageTitleHelper'

// Stores
import useCustomerStore from '@/stores/customers'
import useInjectStore from '@/stores/inject'
import useCommonStore from '@/stores/common'

// Variables
const customerStore = useCustomerStore()
const injectStore = useInjectStore()
const commonStore = useCommonStore()

const customerList = ref([])
const customerListDefault = reactive([])
const refreshTableFlgUi = ref(false)

const router = useRouter()
const route = useRoute()
const count = ref(0)
const columns = [
  {
    name: 'number_inject',
    label: '注射番号',
    field: 'number_inject'
  },
  {
    name: 'date_start',
    label: '処置日',
    field: 'date_start'
  },
  {
    name: 'id_customer',
    label: '診察券番号',
    field: 'id_customer'
  },
  {
    name: 'id_pet',
    label: 'ペット名',
    field: 'id_pet'
  },
  {
    name: 'title_inject',
    label: '注射・点滴名',
    field: 'title_inject'
  },
  {
    name: 'flg_completed',
    label: '完了',
    field: 'flg_completed'
  },
  {
    name: 'expand',
    label: '',
    field: 'expand'
  }
]
const rows = ref([])
const totalCount = ref(0)

const openSearchModal = async () => {
  count.value = 0
  await mtUtils.smallPopup(AdditionInjectFilterModal)
  const tempVar = injectStore?.getInjectSearchParam
  Object.keys(tempVar).forEach((key) => {
    if (key != 'date_start' && key != 'date_end') {
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
  searchDetails.value = {
    ...searchDetails.value,
    ...injectStore.getInjectSearchParam
  }
  await search()
}

const openDetailPet = async (row: any) => {
  const pageTitle = `注射: ${row?.customer?.name_family}${row?.pet?.name_pet}`
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.id_customer,
    id_pet: row.id_pet,
    code_customer: row.code_customer,
    code_pet: row.code_pet,
    tab: row.tab,
    fromPage: '治療サービス一覧',
    pageTitle
  })
  await search()
}

const searchDetails = ref({
  date_start: getDaysBefore(7),
  date_end: getDateToday(),
  number_inject: null,
  id_customer: '',
  customer_name: null,
  pet_name: null
})

const getInjectId = computed(() => {
  return route?.query?.id
})
const clearSearch = () => {
  count.value = 0
  searchDetails.value = {
    date_start: '',
    date_end: '',
    number_inject: null,
    id_customer: '',
    title_inject: null,
    id_pet: null,
    id_category1: null,
    id_category2: null
  }
  injectStore.setInjectSearchParam(searchDetails.value)
}
async function search(initCall: boolean = false) {
  refreshTableFlgUi.value = false
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'SearchInjectList',
    getInjectId.value ? { id_inject: getInjectId.value } : searchDetails.value,
    true
  )
  refreshTableFlgUi.value = true
  if (response) {
    totalCount.value = response.count
    rows.value = response.data
    if (getInjectId.value && initCall) {
      await onRowClick(response.data[0])
    }
  }
}
function getPetIllnessHistory(petIllnessHistory: any) {
  if (!petIllnessHistory) return
  return `${petIllnessHistory?.number_pet_illness_history} ${
    petIllnessHistory.name_disease
      ? petIllnessHistory.name_disease
      : petIllnessHistory.name_disease_free
  }`
}
const onRowClick = async (row: any) => {
  const pageTitle = `注射: ${row?.customer?.name_family}${row?.pet?.name_pet}`
  await router.replace({
    name: 'SearchInjectList',
    query: { id: row.id_inject }
  })
  await mtUtils.mediumPopup(ViewInjectHeaderModal, {
    InjectObj: row,
    id_pet: row.id_pet,
    fromPage: '注射・点滴',
    id_inject: row.id_inject,
    pageTitle,
    id_customer: row.id_customer
  })
  await router.replace({
    name: 'SearchInjectList'
  })
}

const openRabiesModal = async () => {
  await mtUtils.popup(SearchRabiesList)
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
  () => searchDetails.value.date_start,
  (newStartDate) => {
    searchDetails.value.date_end = newStartDate;
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

const init = async () => {
  if (localStorage.getItem('pageAction') === 'injectDetail') {
    const injectId = localStorage.getItem('pageActionParam')
    const data = rows.value?.find((pre) => pre?.id_inject === injectId)
    await onRowClick(data)
    localStorage.removeItem('pageAction')
    localStorage.removeItem('pageActionParam')
  }
}

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  await search(true)
  await init()

  // set page title
  setPageTitle('注/点一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          注射・点滴一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchDetails.date_start"
                outlined
                type="date"
                autofocus
                label="注射 開始日：Start"
                tabindex="1"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchDetails.date_end"
                outlined
                tabindex="2"
                type="date"
                class="q-mx-sm"
                label="注射 終了日：End"
                @keydown.enter="moveNext"
              />
              <q-btn outline @click="openSearchModal" class="q-mr-sm">
                詳細検索
                <q-badge v-if="count > 0" color="red" floating>
                  {{ count }}
                </q-badge>
              </q-btn>
              <q-btn
                class="q-mr-sm"
                outline
                color="grey-100"
                text-color="primary"
                unelevated
                @click="clearSearch()"
              >
                クリア
              </q-btn>
              <q-btn
                class="q-mr-xs"
                tabindex="3"
                color="grey-800"
                text-color="white"
                unelevated
                @click="search()"
              >
                <q-icon name="search" size="20px" />
                検索
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchDetails.date_start"
                outlined
                type="date"
                autofocus
                class="q-mr-sm ipad-field-size-md"
                label="注射 開始日：Start"
                tabindex="1"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchDetails.date_end"
                outlined
                tabindex="2"
                class="ipad-field-size-md"
                type="date"
                label="注射 終了日：End"
                @keydown.enter="moveNext"
              />
              <q-btn outline @click="openSearchModal" class="q-mx-sm">
                <q-icon name="tune" />
                <q-badge v-if="count > 0" color="red" floating>
                  {{ count }}
                </q-badge>
              </q-btn>
              <q-btn
                tabindex="3"
                color="grey-800"
                text-color="white"
                unelevated
                @click="search()"
              >
                <q-icon name="search" size="20px" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果 :<span class="q-ml-sm">{{ totalCount }}件</span>
      </div>
      <q-btn outline tabindex="3" unelevated @click="openRabiesModal">
        狂犬病済票一覧
      </q-btn>
    </div>
    <MtTable2
      :columns="columns"
      :rows="rows"
      :rowsBg="true"
      v-if="refreshTableFlgUi"
      :style="{ height: 'calc(100vh - 120px)' }"
      flat
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          :class="{
            flg_cancel_row: row.flg_cancel,
            flg_complete_row: row.flg_completed
          }"
          @click="onRowClick(row)"
        >
          <div v-if="col.name == 'number_inject'">
            {{ row['number_inject'] }}
          </div>
          <div v-if="col.field == 'date_start'">
            <div class="row no-wrap">
              <span>{{ formatDate(row['date_start']) }}</span>
            </div>
          </div>
          <div v-if="col.field == 'id_customer'">
            <!-- <div class="body1 regular">
              {{ getCustomerName(row['customer']) }}
              <q-icon
                v-if="row.customer.type_customer_color"
                size="12px"
                name="circle"
                class="q-ml-xs"
                :color="getCustomerLabelColor(row.customer.type_customer_color)"
              />
            </div> -->

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
          <div v-if="col.field == 'id_pet'" auto-width>
            <!-- <div class="body1 regular">
              <span class="caption1 regular text-grey-700">{{
                getFullPetName(row['pet'], row['customer'])
              }}</span>
              <q-icon
                size="12px"
                name="circle"
                class="q-ml-xs"
                :color="getTypeAnimalColor(row.pet.id_cm_animal)"
                :style="{ color: getTypeAnimalColor(row.pet.id_cm_animal) }"
              />
            </div> -->
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
                <div class="text-blue text-bold">
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
          <div v-if="col.field == 'title_inject'" auto-width>
            <div class="row no-wrap">
              {{ row['title_inject'] }}
            </div>
          </div>
          <div v-if="col.field == 'id_pet_illness_history'" auto-width>
            {{ getPetIllnessHistory(row['petIllnessHistory']) }}
          </div>
          <div v-if="col.field == 'flg_delivered'">
            <div class="fit flex align-center justify-center text-h6">
              {{ row['flg_delivered'] == true ? '•' : '' }}
            </div>
          </div>
          <div v-if="col.field == 'flg_completed'" class="text-green">
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
