<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref,watch } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import AdditionalFilterPrescriptionModal from './AdditionalFilterPrescriptionModal.vue'
import {
  concatenate,
  formatDateWithTime,
  getCustomerLabelColor,
  getDateTimeNow,
  getDateToday,
  getDaysBefore,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import selectOptions from '@/utils/selectOptions'
import usePrescriptionStore from '@/stores/prescription'
import CreatePrescriptionListModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import { useRoute, useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useRequestStore from '@/stores/requests'
import useCommonStore from '@/stores/common'
import useRequestStatus from '@/stores/request-statuses'
import _, { groupBy, orderBy } from 'lodash'
import { storeToRefs } from 'pinia'
import { typeCategoryChild } from '@/utils/enum'
import UpdateRequestStatusModal from '../status/UpdateRequestStatusModal.vue'
import dayjs from 'dayjs'
import MtToggleExpand from '@/components/MtToggleExpand.vue'
import SearchStatusBoardListModal from '@/pages/statusBoard/SearchStatusBoardListModal.vue'
import ViewPetDetailModal from '../../master/customerPet/ViewPetDetailModal.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const customerStore = useCustomerStore()
const prescriptionStore = usePrescriptionStore()
const commonStore = useCommonStore()
const requestStatusStore = useRequestStatus()
const { getRequestStatusList } = storeToRefs(requestStatusStore)
const { getAllCustomers } = storeToRefs(customerStore)

const customerList = ref([])
const customerListDefault = reactive([])
const refreshTableFlgUi = ref(false)

const router = useRouter()
const route = useRoute()
const count = ref(0)
const columns = [
  {
    name: 'number_prescription',
    label: '処方箋番号',
    field: 'number_prescription'
  },
  {
    name: 'date_start',
    label: '服用開始日',
    field: 'date_start'
  },
  {
    name: 'id_customer',
    label: '診察券番号',
    field: 'id_customer'
  },
  {
    name: 'code_pet',
    label: 'ペットCD',
    field: 'code_pet',
    align: 'left'
  },
  {
    name: 'id_pet',
    label: 'ペット名',
    field: 'id_pet'
  },
  {
    name: 'title_prescription',
    label: '処方箋名',
    field: 'title_prescription'
  },
  {
    name: 'flg_prescription_order',
    label: '依頼',
    field: 'flg_prescription_order'
  },
  {
    name: 'flg_all_prepared',
    label: '準備',
    field: 'flg_all_prepared'
  },
  {
    name: 'flg_delivered',
    label: '受渡',
    field: 'flg_delivered'
  },
  {
    name: 'expand',
    label: '',
    field: 'expand'
  }
]
const rows = ref([])
const allRows = ref([])
const totalCount = ref(0)

const openSearchModal = async () => {
  count.value = 0
  await mtUtils.smallPopup(AdditionalFilterPrescriptionModal)
  const tempVar = prescriptionStore?.getPrescriptionSearchParams
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
    ...prescriptionStore.getPrescriptionSearchParams
  }
  await search()
}

const searchDetails = ref({
  date_start: getDaysBefore(0),
  date_end: getDateToday(),
  number_prescription: null,
  id_customer: '',
  customer_name: null,
  pet_name: null,
})
const flgDetails = ref({
  flg_all_prepared: false,
  flg_prescription_order: false,
  flg_delivered: false
})

const searchFlg = () => {
  rows.value = allRows.value.filter(v => {
    const { flg_all_prepared, flg_prescription_order, flg_delivered } = flgDetails.value;

    if (!flg_all_prepared && !flg_prescription_order && !flg_delivered) {
      return true;
    }

    return (
      (!flg_all_prepared || v.flg_all_prepared) &&
      (!flg_prescription_order || v.flg_prescription_order) &&
      (!flg_delivered || v.flg_delivered)
    );
  })
  rows.value = _.orderBy(rows.value, ['number_prescription'], ['desc'])
  totalCount.value = rows.value.length
}

const openDetailPet = async (row: any) => {
  const pageTitle = `処方: ${row?.customer?.name_family}${row?.pet?.name_pet}`
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

const getPrescriptionId = computed(() => {
  return route?.query?.id
})
const clearSearch = () => {
  count.value = 0
  searchDetails.value = {
    date_start: '',
    date_end: '',
    number_prescription: null,
    id_customer: '',
    title_prescription: null,
    id_pet: null,
    flg_all_prepared: false,
    flg_prescription_order: false,
    flg_delivered: false
  }
  prescriptionStore.setPrescriptionSearchParams(searchDetails.value)
}
const search = async (initCall: boolean = false) => {
  refreshTableFlgUi.value = false
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'SearchPrescriptionList',
    getPrescriptionId.value
      ? { id_prescription: getPrescriptionId.value }
      : searchDetails.value,
    true
  )
  refreshTableFlgUi.value = true
  if (response) {
    totalCount.value = response.count
    allRows.value = response.data
    searchFlg()
    if (getPrescriptionId.value && initCall) {
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
  const pageTitle = `処方: ${row?.customer?.name_family}${row?.pet?.name_pet}`
  await router.replace({
    name: 'SearchPrescriptionList',
    query: { id: row.id_prescription }
  })

  const response = await mtUtils.promiseAllWithLoader([
    useRequestStore().fetchRequest(row.id_request)
  ])

  await mtUtils.popup(CreatePrescriptionListModal, {
    prescriptionObj: row,
    id_pet: row.id_pet,
    fromPage: '処方箋履歴',
    pageTitle,
    requestDetailPage: response[0].data.data
  }, true)

  await router
    .replace({
      name: 'SearchPrescriptionList'
    })
    .then(async () => {
      await search()
    })
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
  if (localStorage.getItem('pageAction') === 'prescriptionDetails') {
    const prescriptionId = localStorage.getItem('pageActionParam')
    const data = rows.value?.find(
      (pre) => pre?.id_prescription === prescriptionId
    )
    await onRowClick(data)
    localStorage.removeItem('pageAction')
    localStorage.removeItem('pageActionParam')
  }
}

const calculatePassedTime = (date: string) => {
  const today = dayjs()
  const isToday = dayjs(date).isToday()

  if (isToday) {
    const diff = today.diff(date, 'minute')

    if (diff > 60) {
      const hour = diff / 60
      const minute = diff - 60 * Math.floor(hour)
      return `${Math.floor(hour)}h ${minute}m`
    }

    if (diff > 0 && diff < 60) {
      return `${diff}m`
    }

    if (diff < 0) {
      const aheadTime = dayjs(date).format('HH:MM')
      return `${aheadTime}`
    }
  }

  return dayjs(date).format('YYYY/MM/DD')
}

const openStatusBoardModal = async (value: number) => {
  const data = getRequestStatusList.value.find((v) => {
    return v.id_req_status === value
  })

  await customerStore.selectCustomer(data?.id_customer, true)

  await mtUtils.smallPopup(UpdateRequestStatusModal, {
    request: { ...data },
    isNew: false,
    statusData: { ...data?.status, id_req_status: data?.id_req_status },
    selectedPet: data?.id_pet,
    selectedCustomer: data?.id_customer,
    updatedFlg: {
      value: false
    },
    typeCategoryParent: data?.status?.type_category_parent
  })
}

const openStatusBoardListModal = async () => {
  await nextTick(() => {
    mtUtils.popup(SearchStatusBoardListModal, {})
  })
}

const filteredReqStatusList = computed(() => {
  const filtered = getRequestStatusList.value.filter((data) => {
    return [10].includes(data.status.type_category_child)
  })
  const grouped = groupBy(filtered, 'status.type_category_child')

  return Object.entries(grouped).map(([type_category_child, groupData]) => {
    const subHeaderGroups = groupBy(groupData, 'status.name_status')

    return {
      label:
        typeCategoryChild.find(
          (type) => type.value === parseInt(type_category_child)
        )?.label ?? '',
      child: Object.entries(subHeaderGroups).map(
        ([subHeader, subGroupData]) => ({
          subHeader: subHeader,
          subData: subGroupData.map((data) => ({
            label: concatenate(
              getAllCustomers.value.find((c) => {
                return c.value === data.id_customer
              })?.code_customer,
              data.name_customer,
              calculatePassedTime(data.datetime_check_in)
            ),
            value: data.id_req_status
          }))
        })
      )
    }
  })
})

const countOrder = computed(() => {
  const data = {
    noflg: 0,
    order: 0,
    prepared: 0,
    delivered: 0
  }

  data.noflg = rows.value.filter((v) => !v.flg_all_prepared && !v.flg_delivered && !v.flg_prescription_order).length
  data.delivered = rows.value.filter((v) => v.flg_all_prepared).length
  data.prepared = rows.value.filter((v) => v.flg_delivered).length
  data.order = rows.value.filter((v) => v.flg_prescription_order).length

  return data
})

const ToggleFlg = async (field: string, row: any) => {
  await mtUtils
    .confirm('処方箋ステータスを更新しますか？', '確認', '更新する')
    .then(async (confirmation) => {
      if (confirmation) {
        const payload = {
          ...row
        }
        if (field == 'flg_prescription_order') {
          if (row.flg_prescription_order == true) {
            if (row.flg_delivered == true) {
              payload.flg_delivered = false
              payload.flg_all_prepared = false
              payload.flg_prescription_order = false
              payload.datetime_delivered = null
              payload.id_employee_delivered = null
            } else if (row.flg_all_prepared == true) {
              payload.flg_all_prepared = false
              payload.flg_prescription_order = false
            } else {
              payload.flg_prescription_order = false
            }
          } else {
            payload.flg_prescription_order = true
          }
        } else if (field == 'flg_all_prepared') {
          if (row.flg_all_prepared == true) {
            if (row.flg_delivered == true) {
              payload.flg_delivered = false
              payload.flg_all_prepared = false
              payload.datetime_delivered = null
              payload.id_employee_delivered = null
            } else {
              payload.flg_all_prepared = false
            }
          } else {
            payload.flg_all_prepared = true
          }
        } else if (field == 'flg_delivered') {
          if (row.flg_delivered == true) {
            payload.flg_delivered = false
            payload.datetime_delivered = null
            payload.id_employee_delivered = null
          } else {
            payload.flg_delivered = true
            payload.datetime_delivered = getDateTimeNow()
            payload.id_employee_delivered = Number(
              localStorage.getItem('id_employee')
            )
          }
        }
        await mtUtils.callApi(
          selectOptions.reqMethod.PUT,
          `prescription/${payload.id_prescription}`,
          {
            ...payload
          }
        )
        await search()
      }
    })
}

let intervalId: NodeJS.Timeout;
let idleTimeoutId: NodeJS.Timeout;
const isUserIdle = ref(false);

const startIntervalAtNextMinute = () => {
  if (!isUserIdle.value) return; // Only start if the user is idle

  intervalId = setInterval(async () => {
    await search();
  }, 60000); // Then repeat every 60 seconds
};

const resetIdleTimer = () => {
  isUserIdle.value = false;
  clearInterval(intervalId);
  clearTimeout(idleTimeoutId);

  idleTimeoutId = setTimeout(() => {
    isUserIdle.value = true;
    startIntervalAtNextMinute();
  }, 5000); // User becomes idle after 5s of no activity
};

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  await search(true)
  await init()

  // set page title
  setPageTitle('処方箋一覧')
  resetIdleTimer();

  // Listen to user activity
  window.addEventListener("mousemove", resetIdleTimer);
})

onUnmounted(() => {
  clearInterval(intervalId);
  clearTimeout(idleTimeoutId);

  window.removeEventListener("mousemove", resetIdleTimer);
});
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          処方箋一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormCheckBox
                v-model:checked="flgDetails.flg_prescription_order"
                @update:checked="searchFlg"
                label="依頼"
                class="q-mr-md"
              />
              <MtFormCheckBox
                v-model:checked="flgDetails.flg_all_prepared"
                @update:checked="searchFlg"
                label="準備"
                class="q-mr-md"
              />
              <MtFormCheckBox
                v-model:checked="flgDetails.flg_delivered"
                @update:checked="searchFlg"
                label="受渡"
                class="q-mr-md"
              />
              <MtFormInputDate
                v-model:date="searchDetails.date_start"
                outlined
                type="date"
                autofocus
                tabindex="1"
                label="服用開始日：Start"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchDetails.date_end"
                outlined
                type="date"
                tabindex="2"
                class="q-mx-sm"
                label="服用開始日：End"
                @keydown.enter="moveNext"
              />
              <q-btn @click="openSearchModal" outline class="q-mr-sm">
                詳細検索
                <q-badge v-if="count > 0" color="red" floating>
                  {{ count }}
                </q-badge>
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
                class="q-mr-xs"
                @click="search()"
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
                v-model:date="searchDetails.date_start"
                outlined
                class="q-mr-sm ipad-field-size-md"
                type="date"
                autofocus
                tabindex="1"
                label="服用開始日：Start"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchDetails.date_end"
                outlined
                type="date"
                class="ipad-field-size-md"
                tabindex="2"
                label="服用開始日：End"
                @keydown.enter="moveNext"
              />
              <q-btn @click="openSearchModal" outline class="q-mx-sm">
                <q-icon name="tune" />
                <q-badge v-if="count > 0" color="red" floating>
                  {{ count }}
                </q-badge>
              </q-btn>
              <q-btn
                tabindex="3"
                unelevated
                color="grey-800"
                text-color="white"
                @click="search()"
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
        <span class="q-mr-md">検索結果 :<span class="q-ml-sm">{{ totalCount }}件</span></span>
        <span class="q-mr-md">未着手 :<span class="q-ml-sm">{{ countOrder.noflg }}件</span></span>
        <span class="q-mr-md">依頼 :<span class="q-ml-sm">{{ countOrder.order }}件</span></span>
        <span class="q-mr-md">準備 :<span class="q-ml-sm">{{ countOrder.prepared }}件</span></span>
        <span class="q-mr-md">受渡 :<span class="q-ml-sm">{{ countOrder.delivered }}件</span></span>
      </div>
      <div class="row items-center gap-2">
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="openStatusBoardListModal"
        >
          <q-icon name="people" class="q-mr-xs" />
          SB
        </q-btn>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="rows"
      :rowsBg="true"
      flat
      :style="{
        height: 'calc(100vh - 120px)'
      }"
      v-if="refreshTableFlgUi"
    >
      <template v-slot:row="{ row }">
        <td
          class="cursor-pointer"
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
          :class="{
            flg_cancel_row: row.flg_cancel,
            flg_delivered_row: row.flg_delivered,
            flg_asked_row:
              row.flg_prescription_order &&
              !(row.flg_delivered || row.flg_all_prepared),
            flg_blue_row: row.flg_all_prepared && !row.flg_delivered
          }"
        >
          <div v-if="col.name == 'number_prescription'">
            {{ row['number_prescription'] }}
          </div>
          <div v-if="col.field == 'date_start'">
            <div class="row no-wrap">
              <span>{{ formatDateWithTime(row['date_start'], 'YYYY/MM/DD') }}</span>
            </div>
          </div>
          <div v-if="col.field == 'id_customer'">
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
                    color: getCustomerLabelColor(row.customer.type_customer_color)
                  }"
                />
              </span>
            </div>
          </div>
          <div v-if="col.field == 'code_pet'" auto-width key="code_pet">
            {{ row.pet?.code_pet }}
          </div>
          <div v-if="col.field == 'id_pet'" auto-width>
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
          <div v-if="col.field == 'title_prescription'" auto-width>
            <div class="row no-wrap">
              {{ row['title_prescription'] }}
            </div>
          </div>
          <div v-if="col.field == 'id_pet_illness_history'" auto-width>
            {{ getPetIllnessHistory(row['petIllnessHistory']) }}
          </div>
          <div
            @click.stop="ToggleFlg(col.field, row)"
            v-if="col.field == 'flg_prescription_order'"
            :class="row[col.field] ? 'text-green' : 'text-grey-300'"
          >
            <q-icon size="24px" name="check_circle" />
          </div>
          <div
            @click.stop="ToggleFlg(col.field, row)"
            v-if="col.field == 'flg_all_prepared'"
            :class="row[col.field] ? 'text-green' : 'text-grey-300'"
          >
            <q-icon size="24px" name="check_circle" />
          </div>
          <div
            @click.stop="ToggleFlg(col.field, row)"
            v-if="col.field == 'flg_delivered'"
            :class="row[col.field] ? 'text-green' : 'text-grey-300'"
          >
            <q-icon size="24px" name="check_circle" />
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
