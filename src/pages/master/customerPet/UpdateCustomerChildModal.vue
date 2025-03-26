<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UpdatePetModal from './UpdatePetModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import OptionModal from '@/components/OptionModal.vue'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import aahMessages from '@/utils/aahMessages'
import { storeToRefs } from 'pinia'
import UpdateCustomerAddressModal from './UpdateCustomerAddressModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useEmployeeStore from '@/stores/employees'
import { blank, getDateToday } from '@/utils/aahUtils'
import { typeCustomerGender, typeGroupAccount } from '@/utils/enum'

const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getCustomer } = storeToRefs(customerStore)

const data = ref({
  code_customer: null,
  name_family: null,
  name_first: null,
  name_kana_family: null,
  name_kana_first: null,
  name_customer_display: null,

  typeGender: null,

  flg_customer: true,
  flg_supplier: false,

  zip_code: null,
  address_prefecture: null,
  address_city: null,
  address_other: null,

  phone_emergency: null,

  phone_title1: null,
  phone1: null,
  phone_title2: null,
  phone2: null,

  email_title1: null,
  email1: null,
  email_title2: null,
  email2: null,

  memo_customer: null,
  type_customer_color: null,

  flg_employee: false,
  id_employee: null,
  flg_referral: false,
  memo_referral: null,
  datetime_referral_visit: null,
  type_customer: false,
  name_corporate: null,
  name_kana_corporate: null,
  url_supplier: null,
  name_supplier: null,
  name_kana_supplier: null,
  flg_group_account: false,
  id_customer_master: null,
  type_group_account: null,

  id_ticket_login: null,
  password: null,
  flg_login_access: false,

  id_ahmics_customer: null,
  code_ahmics_customer: null,
  datetime_register: getDateToday(),
  id_discount_rate: null
})
const defaultEmployee = JSON.parse(localStorage.getItem("id_employee"))

const blankField = (row) => (data.value = blank(data.value, row))
const changeTypeCustomerColor = (val) => {
  data.value.type_customer_color = val
}
const onRowPetClick = async (row) => {
  customerStore.selectPet(row.id_pet)
  await mtUtils.popup(UpdatePetModal)
}
const onRowAddressClick = async (row) => {
  customerStore.selectAddress(row.id_address)
  await mtUtils.mediumPopup(UpdateCustomerAddressModal)
}
const submit = () => {
  data.value.type_customer = data.value.type_customer ? 2 : 1
  data.value.flg_login_access = data.value.flg_login_access ? 1 : 0
  data.value.flg_main_address = true
  // data.value.id_customer_master = data?.value?.id_customer_master?.id;
  // data.value.id_employee = data.value.id_employee?.id;
  delete data.value.code_customer
  if (data.value.datetime_register) {
    data.value.datetime_register = data.value.datetime_register + ' 00:00:00'
  }
  customerStore.submitCustomer(data.value).then(() => {
    customerStore.fetchCustomerPets()
    customerStore.fetchPreparationCustomers()
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
  })
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            customerStore
              .destroyCustomer(data.value.id_customer.id)
              .then(() => {
                customerStore.fetchCustomerPets()
                customerStore.fetchPreparationCustomers()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const openAddPetModal = async () => {
  customerStore.selectPet(null)
  await mtUtils.popup(UpdatePetModal)
}
const openAddCustomerAddressModal = async () => {
  customerStore.selectAddress(null)
  await mtUtils.mediumPopup(UpdateCustomerAddressModal, {})
}
const closeModal = () => {
  emits('close')
}

const selectDefaultEmployee = () => {
  data.value.id_employee = defaultEmployee
}

onMounted(() => {
  if (getCustomer.value) {
    data.value.flg_group_account = true
    data.value.id_customer_master = getCustomer?.value?.id_customer
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        オーナーマスタ
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div>
        <div class="row q-col-gutter-md items-center q-mb-sm">
          <div class="col-auto">
            <q-badge
              rounded
              label="-"
              class="justify-center bg-grey-100 text-grey-300 status"
            />
            【status_customer】
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.name_family"
              label="【name_family】姓 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.name_first"
              label="【name_first】名 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.name_kana_family"
              label="【name_kana_family】姓カナ *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.name_kana_first"
              label="【name_kana_first】名カナ *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2 q-pt-xs">
            <div class="flex text-grey-700">
              <span class="q-mr-md body2 regular"
                >【name_customer_updated】オーナー更新</span
              >
              <span>-</span>
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.name_customer_display"
              label="【name_customer_display】オーナー表示名 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-sm">
          <div class="col-6">
            <MtInputForm
              type="radio"
              v-model="data.typeGender"
              :items="typeCustomerGender"
            />【type_gender】
          </div>
          <div class="col-6">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '【flg_customer】オーナー' }]"
              v-model="data.flg_customer"
            />
            <MtInputForm
              type="checkbox"
              :items="[{ label: '【flg_supplier】取引先' }]"
              v-model="data.flg_supplier"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.phone_emergency"
              label="【phone_emergency】緊急電話番号 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.phone_title1"
              label="【phone_title1】電話番号タイトル1 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.phone1"
              label="【phone1】電話番号1 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.phone_title2"
              label="【phone_title2】電話番号タイトル2"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.phone2"
              label="【phone2】電話番号2"
            />
          </div>
          <div class="col-6 q-pt-xs">
            <div class="flex text-grey-700">
              <span class="q-mr-md body2 regular">オーナー更新</span>
              <span>電話番号【phone_customer_updated】</span>
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.email_title1"
              label="【email_title1】メールタイトル1"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.email1"
              label="【email1】メール1"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.email_title2"
              label="【email_title2】メールタイトル2"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.email2"
              label="【email2】メール2"
            />
          </div>
        </div>
        <div class="row q-mb-sm">
          <div class="col-6 q-pt-xs">
            <div class="flex text-grey-700">
              <span class="q-mr-md body2 regular">オーナー更新</span>
              <span>メールアドレス【email_customer_updated】</span>
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12">
            <MtInputForm
              type="text"
              autogrow
              v-model="data.memo_customer"
              label="【memo_customer】オーナーメモ"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <span>【type_customer_color】オーナーカラー区分</span>
          </div>
          <div class="col">
            <q-btn
              @click="changeTypeCustomerColor(1)"
              class="text-grey-600 bg-grey-300"
              :flat="data.type_customer_color !== 1"
              rounded
              size="small"
            >
              <q-icon v-if="data.type_customer_color === 1" name="done" />
              Grey
            </q-btn>
            <q-btn
              @click="changeTypeCustomerColor(2)"
              class="text-grey-600 q-ml-md"
              :flat="data.type_customer_color !== 2"
              style="background-color: #fff851"
              rounded
              size="small"
            >
              <q-icon v-if="data.type_customer_color === 2" name="done" />
              Yellow
            </q-btn>
            <q-btn
              @click="changeTypeCustomerColor(3)"
              class="text-grey-600 q-ml-md"
              :flat="data.type_customer_color !== 3"
              style="background-color: #ffb444"
              rounded
              size="small"
            >
              <q-icon v-if="data.type_customer_color === 3" name="done" />
              Orange
            </q-btn>
            <q-btn
              @click="changeTypeCustomerColor(4)"
              class="text-grey-600 q-ml-md"
              :flat="data.type_customer_color !== 4"
              style="background-color: #ff4769"
              rounded
              size="small"
            >
              <q-icon v-if="data.type_customer_color === 4" name="done" />
              Red
            </q-btn>
            <q-btn
              @click="changeTypeCustomerColor(5)"
              class="text-white q-ml-md"
              :flat="data.type_customer_color !== 5"
              style="background-color: #212121"
              rounded
              size="small"
            >
              <q-icon v-if="data.type_customer_color === 5" name="done" />
              Black
            </q-btn>
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '【flg_employee】従業員' }]"
              v-model="data.flg_employee"
              @click="blankField(['id_employee'])"
            />
          </div>
          <div class="col-2">
            <InputEmployeeOptGroup
              v-if="data.flg_employee"
              v-model:selected="data.id_employee"
              label="【id_employee】従業員"
            show-select-default-employee
            @update:select-default-employee="selectDefaultEmployee"
            />
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="checkbox"
              v-model="data.flg_referral"
              :items="[{ label: '【flg_referral】紹介' }]"
              @click="blankField(['memo_referral', 'datetime_referral_visit'])"
            />
          </div>
          <div class="col-8">
            <MtInputForm
              v-if="data.flg_referral"
              type="text"
              v-model="data.memo_referral"
              label="【memo_referral】紹介元"
            />
          </div>
          <div class="col-2">
            <MtFormInputDate
              v-if="data.flg_referral"
              type="date"
              v-model:date="data.datetime_referral_visit"
              label="【datetime_referral_visit】紹介者初回来院日"
            />
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '【type_customer】法人オーナー' }]"
              v-model="data.type_customer"
              @click="
                blankField([
                  'name_corporate',
                  'name_kana_corporate',
                  'url_supplier',
                  'name_supplier',
                  'name_kana_supplier'
                ])
              "
            />
          </div>
          <div class="col-2">
            <MtInputForm
              v-if="data.type_customer"
              type="text"
              v-model="data.name_corporate"
              label="【name_corporate】事業所名"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              v-if="data.type_customer"
              type="text"
              v-model="data.name_kana_corporate"
              label="【name_kana_corporate】事業所カナ"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm" v-if="data.type_customer">
          <div class="col-2 offset-md-2">
            <MtInputForm
              type="text"
              v-model="data.url_supplier"
              label="【url_supplier】事業所HP"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm" v-if="data.type_customer">
          <div class="col-2 offset-md-2">
            <MtInputForm
              type="text"
              v-model="data.name_supplier"
              label="【name_supplier】担当者氏名"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.name_kana_supplier"
              label="【name_kana_supplier】担当者カナ"
            />
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '【flg_group_account】グループ管理' }]"
              v-model="data.flg_group_account"
              @click="blankField(['id_customer_master', 'type_group_account'])"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              v-if="data.flg_group_account"
              type="selection"
              :items="customerStore.getAllCustomers"
              v-model="data.id_customer_master"
              label="【id_customer_master】マスターオーナーID"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              v-if="data.flg_group_account"
              type="selection"
              :items="typeGroupAccount"
              v-model="data.type_group_account"
              label="【type_group_account】グループアカウントタイプ"
              required
              :rules="[aahValidations.validationSelection]"
            />
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.id_ticket_login"
              label="【id_ticket_login】整理券ログインID"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.password"
              label="【password】整理券ログインPW"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '【flg_login_access】ログイン不可' }]"
              v-model="data.flg_login_access"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-auto">
            <div>ログインPW最終更新</div>
          </div>
          <div class="col-auto">
            <div class="flex q-ml-md">
              <div>2023/07/07</div>
              <div class="q-ml-md">11:40</div>
              【datetime_last_login_updated】
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.id_ahmics_customer"
              label="【id_ahmics_customer】外部システムオーナーID"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="text"
              v-model="data.code_ahmics_customer"
              label="【code_ahmics_customer】外部システムオーナーCD"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormInputDate
              type="date"
              v-model:date="data.datetime_register"
              label="【datetime_register】カルテ作成日時"
            />
          </div>
          <div class="col-2">
            <MtInputForm
              type="selection"
              v-model="data.id_discount_rate"
              label="【id_discount_rate】デフォルト割引率"
            />
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
