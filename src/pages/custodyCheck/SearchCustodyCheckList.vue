<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import {
  formatDateTime,
  getDateToday,
  getDaysBefore,
  getFullPetName
} from '@/utils/aahUtils'
import UpdateCustodyChecklistModal from './UpdateCustodyChecklistModal.vue'
import UpdateCustodyItemModal from './UpdateCustodyItemModal.vue'
import useCustodyCheckListsStore from '@/stores/custody-checklists'
import useCustodyStore from '@/stores/custody'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import usePetsStore from '@/stores/pets'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import useBreedStore from '@/stores/breeds'
import aahMessages from '@/utils/aahMessages'
import _ from 'lodash'
import { codeCliCommonList, typeTitlePetCustomerUpdated } from '@/utils/enum'
import useCommonStore from '@/stores/common'
import { CustodyChecklistType, CustomerType } from '@/types/types'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCliCommonStore from '@/stores/cli-common'

const checkItems = ref([])
const emits = defineEmits(['close'])
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const custodyStore = useCustodyStore()
const customerStore = useCustomerStore()
const breedStore = useBreedStore()
const employeeStore = useEmployeeStore()
const custodyCheckListsStore = useCustodyCheckListsStore()
const petStore = usePetsStore()
const { getCustodyCheckLists } = storeToRefs(custodyCheckListsStore)
// const { getAllBreeds } = storeToRefs(breedStore)
const allBreeds = computed(() => breedStore.allBreeds)
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const petList = ref([])

const searchData = ref({
  date_from: getDaysBefore(7),
  date_to: getDateToday(),
  name: null,
  flg_custody_returned: false,
  id_clinic: ''
})

const redirect = (path: any, id = null) => {
  if (id) {
    localStorage.setItem('pageAction', 'updateCustomer')
    localStorage.setItem('pageActionParam', id)
  }
  window.open(path, '_blank')
  return false
}
const openAddModal = async (data?: CustodyChecklistType) => {
  if (data) {
    const payload = {
      ...data,
      id_employee_custody: getEmployee(data.custody_list[0].id_employee_custody)?.id_employee
    }
    await mtUtils.popup(UpdateCustodyChecklistModal, { data: payload, date_from: searchData.value.date_from, date_to: searchData.value.date_to })
  }

  await mtUtils.popup(UpdateCustodyChecklistModal, { date_from: searchData.value.date_from, date_to: searchData.value.date_to })
  await search()
}
const onRowClick = async (idCustomer: number, info: CustodyChecklistType) => {
  info.id_customer = idCustomer
  await mtUtils.mediumPopup(UpdateCustodyItemModal, { info })
  await search()
}
const search = async () => {
  searchData.value.id_clinic = JSON.parse(
    localStorage.getItem('id_clinic') || '{}'
  )
  await custodyCheckListsStore.fetchCustodyCheckList(searchData.value)
}
const bulkReturned = async (data: null) => {
  let petName = data[0]?.id_pet
    ? getCustomer(data[0].id_customer)?.name_family +
      ' ' +
      getPet(data[0].id_customer, data[0]?.id_pet)?.name_pet +
      ' ' +
      titlePetCustomerUpdated(
        getPet(data[0].id_customer, data[0]?.id_pet)
          ?.type_title_pet_customer_updated
      )
    : getCustomer(data[0].id_customer)?.name_kana_family
  let confirmMsg =
    formatDateTime(data[0]?.date_custody_receive) +
    ' に預かった ' +
    petName +
    ' の返品必要品を全て返品しますか？'
  await mtUtils
    .confirm(confirmMsg, '確認', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        data?.map(async (item) => {
          if (item.flg_custody_returned === false) {
            item.flg_custody_returned = true
            item.date_custody_receive = formatDateTime(
              item.date_custody_receive
            )
            item.date_custody_return_result = formatDateTime(getDateToday())
            await custodyCheckListsStore.updateCustodyCheckList(
              item?.id_custody_checklist,
              item
            )
          }
        })
        setTimeout(() => {
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
          custodyCheckListsStore.fetchCustodyCheckList()
        }, 3000)
      }
    })
}

const getCustomer = (id_customer: number): CustomerType => {
  let customer = customerStore.getCustomers?.find(
    (cus) => cus.id_customer == id_customer
  )
  return customer!
}
const getPet = (petName: string) => {
  return petList.value.find((pet: any) => pet.name_pet === petName)
}
const getEmployee = (empName: string) => {
  let emp = employeeStore.getEmployees.find(
    (v) => v.login_id === empName
  )
  return emp
}
const labelColor = (typeCustomerColor: number) => {
  if (typeCustomerColor) {
    return getCliCommonCustomerColorList.value.find(
      (v) => v.code_func1 === typeCustomerColor.toString()
    )?.text1
  }
}

const titlePetCustomerUpdated = (type_title_pet_customer_updated) => {
  let r = typeTitlePetCustomerUpdated.find(
    (v) => v.value === type_title_pet_customer_updated
  )
  return r ? r.label : ''
}

const redirectToCustomerPage = (cusCode: string) => {
  localStorage.setItem('pageAction', 'searchCustomer')
  localStorage.setItem('pageActionParam', cusCode)
  redirect('/SearchCustomerList')
}

const getTypeAnimal = (value: string) => {
  if (value) {
    return getCommonTypeAnimalOptionList.value.find((v) => v.name_common === value)
  }
}

const typeBreedName = (value) => allBreeds.value.find((v) => v.value === value)

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
  // todo customer 1313
  await commonStore.fetchPreparationCommonList({ code_common: [8, 25] }, true)
  await cliCommonStore.fetchPreparationCliCommonList({
    code_cli_common: [2, 3]
  })
  await customerStore.fetchCustomers()
  await search()
  await custodyStore.fetchCustodies()
  await petStore.fetchPreparationPets().then((res) => {
    petList.value = res?.data?.data
  })

  // set page title
  setPageTitle('預り品')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <div class="flex justify-between items-center full-width">
          <q-toolbar-title class="title2 bold text-grey-900">
            預かり品一覧
          </q-toolbar-title>
          <form class="flex items-center no-wrap">
            <MtFormInputDate
              outlined
              type="date"
              label="預かり日：Start"
              v-model:date="searchData.date_from"
              autofocus
              class="q-mx-sm"
              :tabindex="1"
              @keydown.enter="moveNext"
            />
            <MtFormInputDate
              outlined
              type="date"
              label="預かり日：End"
              v-model:date="searchData.date_to"
              :tabindex="2"
              @keydown.enter="moveNext"
            />
          </form>
          <MtInputForm
            v-model="searchData.name"
            class="q-mx-sm search-field"
            label="オーナー名カナ"
            outlined
            :tabindex="3"
            type="text"
          />
          <MtInputForm
            type="checkbox"
            v-model="searchData.flg_custody_returned"
            :items="[{ label: '返却済', value: 1 }]"
          />
          <q-btn
            unelevated
            color="accent-800"
            text-color="white"
            @click="search()"
            class="q-mx-sm"
            :tabindex="5"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
          <q-btn
            unelevated
            color="grey-800"
            text-color="white"
            @click="openAddModal(null)"
          >
            <q-icon size="20px" name="add" />預かり品
          </q-btn>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row q-mt-xl q-px-xl">
      <span class="large-title bold text-grey-900">預かり中</span>
    </div>
    <div class="row q-px-xl q-mt-sm">
      <q-list style="width: 100%">
        <template
          v-for="(item, i) in getCustodyCheckLists"
          :key="i"
        >
          <q-expansion-item
            :group="'somegroup_' + i"
            :label="item.date_custody_receive"
            header-class="bg-grey-100 text-black q-my-md"
            expand-icon-class="text-black"
          >
            <template v-slot:header>
              <div
                class="q-item__section column q-item__section--main justify-center"
              >
                <div class="flex items-center">
                  <div class="flex items-center q-mr-md">
                    {{
                      formatDateTime(item.date_custody_receive)
                    }}
                  </div>
                  <div
                    class="column q-mr-xl"
                    @click="
                      redirectToCustomerPage(
                        getCustomer(item.id_customer)?.code_customer
                      )
                    "
                    v-if="item?.id_customer"
                  >
                    <div class="flex q-mb-sm caption2 text-grey-700">
                      <div class="q-mr-md">
                        {{ getCustomer(item.id_customer)?.name_kana_family }}
                      </div>
                      <div>
                        {{ getCustomer(item.id_customer)?.name_kana_first }}
                      </div>
                    </div>
                    <div class="flex bold body1 text-blue cursor-pointer">
                      <div>
                        {{
                          getCustomer(item.id_customer)
                            ?.name_customer_display
                        }}
                      </div>
                      <div class="q-mr-md">
                        <q-icon
                          v-if="
                            labelColor(
                              getCustomer(item.id_customer)
                                ?.type_customer_color
                            )"
                          name="circle"
                          :color="
                            labelColor(
                              getCustomer(item.id_customer)
                                ?.type_customer_color
                            )
                          "
                          size="25px"
                        />
                      </div>
                      <div class="q-mr-sm">
                        {{
                          item?.name_pet
                        }}
                      </div>
                      <div>
                        <q-icon
                          v-if="getTypeAnimal(item?.id_cm_animal_name)?.text1"
                          name="circle"
                          :color="
                            getTypeAnimal(item?.id_cm_animal_name)?.text1
                          "
                          size="25px"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    class="column q-mr-xl cursor-pointer"
                    @click="
                      redirect(
                        '/PetDetail/' +
                          item.id_customer +
                          '/' +
                          item?.id_pet
                      )
                    "
                  >
                    <div class="flex items-center" v-if="item?.id_pet">
                      <div class="q-mr-sm bold body1 text-blue">
                        {{
                          getFullPetName(
                            getPet(item?.id_pet),
                            getCustomer(item.id_customer)
                          )
                        }}
                      </div>
                    </div>
                  </div>
                  <div
                    class="flex bg-white q-ba q-pa-sm q-ml-xl"
                    
                  >
                    {{
                      getTypeAnimal(getPet(item?.id_cm_animal_name))
                    }}
                    {{
                      typeBreedName(getPet(item?.id_pet)?.id_breed)?.label
                        ? `/ ${
                            typeBreedName(getPet(item?.id_pet)?.id_breed)
                              ?.label
                          }`
                        : ''
                    }}
                  </div>
                  <div class="flex q-pa-sm q-ml-xl">
                    返品必要数
                    {{
                      item.custody_list.filter((d) => {
                        return d.flg_need_return && d.flg_custody_returned
                      }).length
                    }}
                    /{{
                      item.custody_list.filter((d) => {
                        return d.flg_need_return
                      }).length
                    }}
                  </div>
                </div>
              </div>
            </template>
            <q-markup-table
              separator="none"
              dense
              flat
              square
              class="custody-table"
            >
              <thead>
                <tr>
                  <th class="text-grey-700 caption1 text-left">
                    リクエスト番号
                  </th>
                  <th class="text-grey-700 caption1 text-left">預かり品名</th>
                  <th class="text-grey-700 caption1 text-center">数量</th>
                  <th class="text-grey-700 caption1 text-center">返却必要</th>
                  <th class="text-grey-700 caption1 text-center">
                    預かり担当者
                  </th>
                  <th class="text-grey-700 caption1 text-center">預かり日</th>
                  <th class="text-grey-700 caption1 text-center">返却予定日</th>
                  <th class="text-grey-700 caption1 text-left">返却日</th>
                  <th class="text-grey-700 caption1 text-left">メモ</th>
                  <th class="text-right"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(info, index) in item.custody_list" :key="index">
                  <tr
                    @click="onRowClick(item.id_customer, info)"
                    class="cursor-pointer"
                    :class="{ inactiveRow: info.flg_custody_returned }"
                  >
                    <td class="text-left body1 text-blue cursor-pointer">
                      {{ info.id_custody_checklist }}
                    </td>
                    <td class="text-left body1 text-grey-900">
                      {{ info.name_custody || "-" }}
                    </td>
                    <td class="text-center body1 text-grey-900">
                      {{ info.quantity }}
                    </td>
                    <td class="text-center body1 text-grey-900">
                      {{ info.flg_need_return ? '返却する' : '' }}
                    </td>
                    <td class="text-center body1 text-grey-900">
                      {{ getEmployee(info.id_employee_custody)?.name_display }}
                    </td>
                    <td class="text-center body1 text-grey-900">
                      {{ formatDateTime(info.date_custody_receive) }}
                    </td>
                    <td class="text-center body1 text-grey-900">
                      {{ info.flg_need_return ? formatDateTime(info.date_custody_return_plan) : '' }}
                    </td>
                    <td class="text-left body1 text-grey-900">
                      {{ formatDateTime(info.date_custody_return_result) }}
                    </td>
                    <td class="text-left body1 text-grey-900 truncated-lines">
                      {{ info.memo_custody }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </q-markup-table>
            <div
              class="row items-center justify-end q-mt-md"
              v-if="
                item.custody_list.filter((d) => {
                  return d.flg_need_return && d.flg_custody_returned
                }).length !=
                item.custody_list.filter((d) => {
                  return d.flg_need_return
                }).length
              "
            >
              <q-btn
                unelevated
                color="grey-800"
                text-color="white"
                @click="openAddModal(item)"
              >
                <q-icon size="20px" name="add" />預かり品
              </q-btn>
              <q-btn
                unelevated
                color="grey-800"
                text-color="white"
                class="q-ml-md"
                @click="bulkReturned(item)"
              >
                <q-icon size="20px" name="redo" />返却する
              </q-btn>
            </div>
          </q-expansion-item>
        </template>
      </q-list>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.custody-table {
  tbody {
    td {
      height: 50px !important;
      &::before {
        background: none !important;
      }
      &.truncated-lines {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        -webkit-line-clamp: 2;
        width: 300px !important;
        height: auto;
        word-wrap: break-word;
        white-space: normal !important;
      }
    }
    tr {
      background-color: $grey-050;
    }
  }
}
</style>
