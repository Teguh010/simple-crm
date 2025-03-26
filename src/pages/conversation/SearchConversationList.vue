<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import UpdateSummaryAudioModal from '@/pages/conversation/UpdateSummaryAudioModal.vue'
import {
  dateFormat,
  getCustomerName,
  getPetImageUrl,
  handleImageError,
  getCustomerLabelColor
} from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import useCustomerStore from '@/stores/customers'
import useConversationStore, { ConversationStatus } from '@/stores/Conversation'
import useRequestStore from '@/stores/requests'
import useEmployeeStore from '@/stores/employees'
import usePetStore from '@/stores/pets'
import { useRouter } from 'vue-router'
import { typeConversationStatus } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import dayjs from 'dayjs'
import ViewPetDetailModal from '../master/customerPet/ViewPetDetailModal.vue'

const cliCommonStore = useCliCommonStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const { getCustomers, getAllCustomerPreps, getCustomer } =
  storeToRefs(customerStore)
const conversationStore = useConversationStore()
const { getConversations, getVeterinaries, getNextPage } =
  storeToRefs(conversationStore)
const requestStore = useRequestStore()
const { getRequests } = storeToRefs(requestStore)
const petsStore = usePetStore()
const { getPets } = storeToRefs(petsStore)
const employeeStore = useEmployeeStore()
const { getEmployees } = storeToRefs(employeeStore)
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)

const employeeList = ref([]),
  employeeListDefault = reactive([]),
  idEmployee = ref('')
const router = useRouter()
const tableElement = ref(null),
  page = ref(1)
let timeout: any = null

const columns = [
  {
    name: 'vet_name_display',
    label: '担当獣医師名',
    field: 'vet_name_display',
    align: 'left',
    style: 'width: 12%',
    headerStyle: 'width: 12%'
  },
  {
    name: 'recording_date',
    label: '診察日時',
    field: 'recording_date',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'recording_time',
    label: '所要時間',
    field: 'recording_time',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'customer_name',
    label: 'オーナー姓名',
    field: 'customer_name',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
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
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'request_num',
    label: 'リクエスト番号',
    field: 'request_num',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'conversation_status',
    label: 'ステータス',
    field: 'conversation_status',
    align: 'center',
    style: 'width: 30%',
    headerStyle: 'width: 30%'
  },
  {
    name: 'mic',
    label: '',
    field: 'mic',
    align: 'center'
  }
]
const searchData = ref({
  id_vet_user: null,
  datetime_created_from: dayjs().subtract(7, 'day').format('YYYY/MM/DD'),
  datetime_created_to: dayjs().format('YYYY/MM/DD')
})

const getCustomerData = (id_customer: any) =>
  getAllCustomerPreps.value.find(
    (customer: any) => customer.id_customer == id_customer
  )
const customerName = (id_customer: any) => {
  let customer = getCustomerData(id_customer)
  if (customer) return getCustomerName(customer)
}
const getPet = (id_pet: any) =>
  getPets.value.find((pet: any) => pet.id_pet == id_pet)
const labelColor = (type_customer_color: any) =>
  getCliCommonCustomerColorList.value.find(
    (v) => v.code_func1 == type_customer_color
  )?.name_cli_common

const getVetName = (name_user: string) => {
  return getEmployees.value.find(
    (employee: any) => employee.code_employee === name_user
  )?.name_display
}
const getConversationStatus = (value: number | string) =>
  typeConversationStatus.find((v: any) => v.value == value)?.label

const search = (additionalParams: any = {}) => {
  if (!Object.keys(additionalParams).length) page.value = 1 // reset page
  if (idEmployee.value) {
    let employee = getEmployees.value.find(
      (employee: any) => employee.id_employee === idEmployee.value
    )
    searchData.value.id_vet_user =
      getVeterinaries.value.find(
        (vet: any) => vet.name_user === employee.code_employee
      )?.id_vet_user ?? -1
  } else searchData.value.id_vet_user = null
  ;['datetime_created_from', 'datetime_created_to'].forEach((key: string) => {
    if (searchData.value[key])
      searchData.value[key] = searchData.value[key].replace(/\//g, '-')
  })
  conversationStore.fetchConversations({
    ...searchData.value,
    ...additionalParams
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
const openRequestDetail = (idRequest: number) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: idRequest }
  })
  window.open(route.href, '_blank')
}
const openDetailPet = (id_customer, row: Object) => {
  router.push({
    name: 'PetDetail',
    params: { id_pet: row.id_pet, id_customer }
  })
}
const handleScroll = async (value: any) => {
  if (timeout) clearTimeout(timeout)
  timeout = setTimeout(() => {
    const scrollHeight = ((tableElement.value.offsetHeight - 100) * 70) / 100
    const currentTarget = (scrollHeight / 2) * page.value
    if (value?.position?.top > currentTarget && getNextPage.value) {
      ++page.value
      search({ page: page.value })
    }
  }, 500)
}
const updateConversation = (conversation: any) => {
  mtUtils.popup(UpdateSummaryAudioModal, {
    data: conversation,
    searchData: search
  })
}
const getTypeAnimal = (id_cm_animal: number) => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v: any) => v.id_common == id_cm_animal
  )
}

const openDetailPetPop = async (row: any) => {
  const pageTitle = setPageTitle('自動要約一覧')
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

const getTypeAnimalColor = (id_cm_animal: number) => {
  const typeAnimal = getTypeAnimal(id_cm_animal)
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}
onMounted(async () => {
  await Promise.all([
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [25] }),
    petsStore.fetchPreparationPets(),
    conversationStore.fetchVeterinaries()
  ])
  employeeList.value = getEmployees.value.map((v) => {
    return {
      value: v.id_employee,
      label: v.name_display
    }
    employeeListDefault.push(...employeeList.value)
  })
  search()

  // set page title
  setPageTitle('自動要約一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          AI カルテ 一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFilterSelect
                v-model:selecting="idEmployee"
                class="q-mr-sm"
                label="担当獣医師"
                outlined
                :options="employeeList"
                :options-default="employeeListDefault"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：Start"
                v-model:date="searchData.datetime_created_from"
                autofocus
                @keydown.enter="moveNext"
                @update:date = "()=> searchData.datetime_created_to = searchData.datetime_created_from"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：End"
                class="q-mx-sm"
                v-model:date="searchData.datetime_created_to"
                @keydown.enter="moveNext"
              />
              <q-btn
                unelevated
                color="accent-800"
                text-color="white"
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
              <MtFilterSelect
                v-model:selecting="idEmployee"
                class="q-mr-sm"
                label="担当獣医師"
                outlined
                :options="employeeList"
                :options-default="employeeListDefault"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：Start"
                v-model:date="searchData.datetime_created_from"
                class="ipad-field-size-md"
                autofocus
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：End"
                class="q-mx-sm ipad-field-size-md"
                v-model:date="searchData.datetime_created_to"
                @keydown.enter="moveNext"
              />
              <q-btn
                unelevated
                color="accent-800"
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
    <span ref="tableElement">
      <MtTable2
        :columns="columns"
        :rows="getConversations"
        :rowsBg="true"
        class="custody-table q-pt-sm"
        flat
        :style="{ height: 'calc(100vh - 70px)' }"
        :virtualScroll="getNextPage ? handleScroll : null"
      >
        <template v-slot:row="{ row }">
          <td v-for="(col, index) in columns" :key="index">
            <template v-if="col.field === 'vet_name_display'">
              {{ getVetName(row.vet_user_name) }}
            </template>
            <template v-else-if="col.field === 'recording_date'">
              {{ dateFormat(row.datetime_created) }}
            </template>
            <template v-else-if="col.field === 'recording_time'">
              {{ row.recording_time }}
            </template>
            <template v-else-if="col.field === 'conversation_status'">
              <div class="text-center">
                {{ getConversationStatus(row.type_conversation_status) }}
              </div>
            </template>
            <template v-else-if="col.field === 'customer_name'">
              <div class="body1 column regular">
                <span class="caption1 regular text-grey-700"
                  >{{ getCustomerData(row.id_customer)?.name_kana_family }}
                  {{ getCustomerData(row.id_customer)?.name_kana_first }}</span
                >
                <span>
                  {{ getCustomerData(row.id_customer)?.name_family }}
                  {{ getCustomerData(row.id_customer)?.name_first }}
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
                  />
                </span>
              </div>
            </template>
            <template v-if="col.field == 'code_pet'" auto-width key="code_pet">
              <div class="body1 regular text-grey-900">
                {{ getPet(row.id_pet)?.code_pet }}
              </div>
            </template>
            <template v-else-if="col.field === 'pet_name'">
              <div @click.stop="openDetailPetPop(row)" class="avatar-container">
                <img
                  v-if="row.id_pet"
                  :src="getPetImageUrl(getPet(row.id_pet))"
                  @error="handleImageError($event, getPet(row.id_pet))"
                  :alt="getPet(row.id_pet)?.name_pet"
                  class="image-responsive"
                  loading="lazy"
                />
                <div v-else class="default bg-grey-300" />
                <div>
                  <span class="caption1 regular text-grey-700">{{
                    getPet(row.id_pet)?.name_kana_pet
                  }}</span>
                  <div class="text-blue text-bold">
                    {{ getPet(row.id_pet)?.name_pet }}
                    <q-icon
                      v-if="getPet(row.id_pet)?.id_cm_animal"
                      size="12px"
                      name="circle"
                      class="q-ml-xs"
                      :color="
                        getTypeAnimalColor(getPet(row.id_pet)?.id_cm_animal)
                      "
                      :style="{
                        color: getTypeAnimalColor(
                          getPet(row.id_pet)?.id_cm_animal
                        )
                      }"
                    />
                  </div>
                </div>
              </div>
            </template>
            <template v-else-if="col.field === 'request_num'">
              <span
                class="text-blue text-bold cursor-pointer"
                @click="openRequestDetail(row.id_request)"
                style="text-decoration: underline"
                >{{ row.num_request }}</span
              >
            </template>
            <template v-else-if="col.field === 'mic'">
              <img
                src="@/assets/img/aiVetty/mic.png"
                width="14"
                height="19"
                class="cursor-pointer"
                @click.stop="updateConversation(row)"
                v-if="row.type_conversation_status === ConversationStatus.ENDED"
              />
            </template>
          </td>
        </template>
      </MtTable2>
    </span>
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
.red {
  color: #ff4343;
}
</style>
