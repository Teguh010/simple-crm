<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { concatenate, formatDate, getDateTimeNow } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import OptionModal from '@/components/OptionModal.vue'
import aahValidations from '@/utils/aahValidations'
import useCustomerStore from '@/stores/customers'
import usePaymentReceiptStore from '@/stores/paymentReceipt'
import aahMessages from '@/utils/aahMessages'
import GetPdfReceipt from './GetPdfReceipt.vue'
import { typePaymentMethod } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import dayjs from 'dayjs'

const customerStore = useCustomerStore()
const paymentReceiptStore = usePaymentReceiptStore()

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object, onIdPaymentClickData: Object, pageTitle: String,
  fromPage: String
})
const petList = ref([])
const isEdit = ref(false)

const data = ref({
  id_payment_receipt: null,
  number_payment_receipt: '',
  number_payment_receipt_reissue: null,
  id_payment: null,
  id_cart: null,
  number_cart: null,
  id_customer: null,
  id_pet: null,
  amount_receipt: 0,
  vat08_amount_receipt: null,
  vat10_amount_receipt: null,
  tax08_amount: null,
  tax10_amount: null,
  id_clinic: null,
  datetime_publish: getDateTimeNow(),
  id_customer_name: null,
  flg_proviso_medical_treatment: true,
  flg_proviso_prescription: false,
  flg_proviso_vaccine: false,
  memo_proviso: null,
  flg_cash: true,
  breakdown_cash: null,
  datetime_publish_cash: null,
  abstract_cash: null,
  flg_cc: false,
  breakdown_cc: null,
  datetime_publish_cc: null,
  abstract_cc: null,
  flg_bank_transfer: false,
  breakdown_bank_transfer: null,
  datetime_publish_bank_transfer: null,
  abstract_bank_transfer: null,
  flg_payment_method: false,
  name_payment_method: '',
  breakdown_payment_method: null,
  datetime_publish_payment_method: null,
  abstract_payment_method: null,
  flg_download: false,
  datetime_download: null,
  flg_payment_receipt_reissue: false,
  datetime_payment_receipt_reissue: null,
  reason_payment_receipt_reissue: null,
  remarks: null,
  flg_delete: false,
  id_employee_insert: null,
  datetime_insert: null,
  id_employee_update: null,
  datetime_update: null,
})

const menuOptions = [
  {
    title: '領収書をダウンロード',
    name: 'Download receipt',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  },
  {
    title: '削除',
    name: 'delete',
    isChanged: false,
    attr: {
      class: null,
      clickable: true
    }
  }
]

const closeModal = () => {
  emits('close')
  setPageTitle(props.fromPage)
}

const allCustomersList = ref([])
const allCustomersListDefault = reactive([])

const submit = () => {
  data.value.breakdown_cash = Number(data.value?.breakdown_cash).toFixed(2)

  if (props?.onIdPaymentClickData?.paymentObj?.type_payment_method === 2) {
    data.value.breakdown_cc = Number(data.value.breakdown_cc).toFixed(2)
  } else if (props?.onIdPaymentClickData?.paymentObj?.type_payment_method === 3) {
    data.value.breakdown_bank_transfer = Number(data.value.breakdown_bank_transfer).toFixed(2)
  } else {
    data.value.breakdown_payment_method = Number(data.value.breakdown_payment_method).toFixed(2)
  }
  
  if (isEdit.value === false) {
    if (!Boolean(data.value.number_payment_receipt)) {
      delete data.value.number_payment_receipt
    }

    paymentReceiptStore
      .submitPaymentReceipt(data.value as any)
      .then(async (resp) => {
        if (resp.data.code == 201) {
          mtUtils.autoCloseAlert(aahMessages.success)
          await paymentReceiptStore.fetchPaymentReceipts({})
          if(!props?.onIdPaymentClickData?.id_payment) closeModal()  // not close only in create case from creating receipt from cart
        } else {
          mtUtils.autoCloseAlert(aahMessages.failed)
        }
      })
  } else {
    paymentReceiptStore
      .updatePaymentReceipt(data.value as any)
      .then(async (resp) => {
        if (resp.data.code == 201) {
          mtUtils.autoCloseAlert(aahMessages.success)
          await paymentReceiptStore.fetchPaymentReceipts({})
          closeModal()
        } else {
          mtUtils.autoCloseAlert(aahMessages.failed)
        }
      })
  }
}

const openMenu = async (row: any) => {
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption?.name === 'Download receipt') {
    clickDownloadPdf()
  } else if (selectedOption?.name === 'delete') {
    await mtUtils
      .confirm(aahMessages.delete_ask, aahMessages.delete)
      .then((confirmation) => {
        if (confirmation) {
          paymentReceiptStore
            .deletePaymentReceipt(row.id_payment_receipt)
            .then(async () => {
              await paymentReceiptStore.fetchPaymentReceipts({})
              await mtUtils.autoCloseAlert(aahMessages.success)
              closeModal()
            })
        }
      })
  }
}

const selectCustomer = async (value: any) => {
  petList.value.length = 0
  await customerStore.selectCustomer(value)
  if (customerStore.getCustomer) {
    const pets = customerStore.getCustomer.pets
    petList.value = [...pets]
    if(petList.value && petList.value.length && petList.value.length > 0) data.value.id_pet = petList.value[0].id_pet
  }
}

const flg_cash_updated = (value: any) => {
  if (!value) {
    data.value.breakdown_cash = null
    data.value.datetime_publish_cash = null
    data.value.abstract_cash = null
    return
  }
  data.value.breakdown_cash = data.value.amount_receipt
  data.value.datetime_publish_cash = dayjs().format('YYYY/MM/DD HH:mm:ss')
}

const flg_cc_updated = (value: any) => {
  if (!value) {
    data.value.breakdown_cc = null
    data.value.datetime_publish_cc = null
    data.value.abstract_cc = null
    return
  }
  data.value.breakdown_cc = data.value.amount_receipt
  data.value.datetime_publish_cc = dayjs().format('YYYY/MM/DD HH:mm:ss')
}

const flg_bank_transfer_updated = (value: any) => {
  if (!value) {
    data.value.breakdown_bank_transfer = null
    data.value.datetime_publish_bank_transfer = null
    data.value.abstract_bank_transfer = null
    return
  }
  data.value.breakdown_bank_transfer = data.value.amount_receipt
  data.value.datetime_publish_bank_transfer = dayjs().format('YYYY/MM/DD HH:mm:ss')
}

const flg_payment_method_updated = (value: any) => {
  if (!value) {
    data.value.name_payment_method = ''
    data.value.breakdown_payment_method = null
    data.value.datetime_publish_payment_method = null
    data.value.abstract_payment_method = null
  }
  data.value.breakdown_payment_method = data.value.amount_receipt
  data.value.datetime_publish_payment_method = dayjs().format('YYYY/MM/DD HH:mm:ss')
}

const init = () => {
  if (props?.data?.id_payment_receipt) {
    data.value.flg_cash = true
    data.value.breakdown_cash = props.data.amount_receipt
    data.value.datetime_publish_cash = props.data.datetime_publish
  }

  if (props?.onIdPaymentClickData?.id_payment) {
    data.value.id_payment = props.onIdPaymentClickData.id_payment
    data.value.id_clinic = props?.onIdPaymentClickData?.id_clinic
    data.value.number_cart = props?.onIdPaymentClickData?.number_cart
    data.value.id_pet = props?.onIdPaymentClickData?.id_pet
    data.value.id_customer = props?.onIdPaymentClickData?.id_customer,
    data.value.id_customer_name = Boolean(props?.onIdPaymentClickData?.id_customer_name) ? concatenate(props?.onIdPaymentClickData?.id_customer_name, '様') : null,
    data.value.amount_receipt = Number(
      props?.onIdPaymentClickData?.amount_receipt
    )
    selectCustomer(data.value.id_customer)

    // map payment data
    resetPaymentMethodData()
    switch (props.onIdPaymentClickData.paymentObj.type_payment_method) {
      case 1: {
        data.value.flg_cash = true
        data.value.breakdown_cash = props.onIdPaymentClickData.paymentObj.amount_payment
        data.value.datetime_publish_cash = props.onIdPaymentClickData.paymentObj.datetime_bill
        return
      }
      case 2: {
        data.value.flg_cc = true
        data.value.breakdown_cc = props.onIdPaymentClickData.paymentObj.amount_payment
        data.value.datetime_publish_cc = props.onIdPaymentClickData.paymentObj.datetime_bill
        return
      }
      case 3: {
        data.value.flg_bank_transfer = true
        data.value.breakdown_bank_transfer = props.onIdPaymentClickData.paymentObj.amount_payment
        data.value.datetime_publish_bank_transfer = props.onIdPaymentClickData.paymentObj.datetime_bill
        return
      }
      case 4: {
        data.value.flg_payment_method = true
        data.value.name_payment_method = typePaymentMethod.find((method) => {
          return method.value === props.onIdPaymentClickData.paymentObj.type_payment_method
        })?.label
        data.value.breakdown_payment_method = props.onIdPaymentClickData.paymentObj.amount_payment
        data.value.datetime_publish_payment_method = props.onIdPaymentClickData.paymentObj.datetime_bill
        return
      }
    }
  }
}

const resetPaymentMethodData = () => {
  let methods = ['flg_cash', 'flg_cc', 'flg_bank_transfer', 'flg_payment_method']
  methods.forEach((method) => {
    const suffix = method.replace('flg_', '')
    data.value[method] = false
    data.value[`breakdown_${suffix}`] = null
    data.value[`datetime_publish_${suffix}`] = null
    data.value[`abstract_${suffix}`] = null
    if(suffix == 'payment_method') data.value['name_payment_method'] = ''
  })
}

const clickDownloadPdf = () => {
  mtUtils.pdfRender(GetPdfReceipt, {
    data: data.value
  }).then(() => {
    if(!Boolean(data.value.flg_download)) {
      data.value.flg_download = 1
      data.value.datetime_download = getDateTimeNow()
      submit()
    }
  })
   
}

onMounted(() => {
  allCustomersList.value = [...customerStore.getAllCustomers]
  allCustomersListDefault.push(...customerStore.getAllCustomers)

  if (props?.data?.id_payment_receipt) {
    isEdit.value = true
    data.value = props.data
  } else {
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
  init()

  if (props.pageTitle) {
    setPageTitle(props.pageTitle)
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <span>領収書</span>
        <span v-if="data.number_payment_receipt">{{ '：' + data.number_payment_receipt }}</span>
      </q-toolbar-title>
      <q-btn v-if="true" color="primary" unelevated @click="clickDownloadPdf">
        <q-icon class="q-mr-sm" name="description" size="xs"></q-icon>
        領収証ダウンロード
      </q-btn>
      <q-btn v-if="true" class="q-mx-sm" flat round @click="openMenu(data)">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-lg content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm
            type="text"
            label="会計番号"
            v-model="data.number_cart"
            disable
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormInputDate
            :datetime="true"
            v-model:date="data.datetime_publish"
            label="発行日時"
            tabindex="2"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtCustomerFilterSelect
            v-model:selecting="data.id_customer"
            @selected="selectCustomer"
            label="診察券番号・オーナー名"
            tabindex="3"
            :disabled="isEdit"
            required
            :rules="[aahValidations.validationRequired]"
            :disable="props.onIdPaymentClickData?.id_customer"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6" v-if="data.id_customer">
          <MtPetFilterSelect
            :pet-list="petList"
            v-model:selecting="data.id_pet"
            label="ペット名"
            tabindex="4"
            :disabled="isEdit"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-5 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.id_customer_name"
            label="宛名"
            tabindex="5"
          />
        </div>
        <div class="col-lg-8 col-md-7 col-sm-12">
          <div class="row items-center">
            <div class="col-auto">
              <span>領収金額</span>
              <span class="large-title q-mr-md"> ￥</span>
            </div>
            <div class="col-9">
              <MtFormInputNumber2
                autofocus
                tabindex="1"
                v-model:value="data.amount_receipt"
                :isInteger="true"
                input-class="text-right"
                :input-style="{
                  'font-size': '45px',
                  'font-weight': 'bold',
                }"
                :qClass="'q-number-height-lg'"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-2">
          <span class="text-grey-700">税率8％</span>
        </div>
        <div class="col-5">
          <MtInputForm
            type="text"
            label="8%対象金額"
            v-model="data.vat08_amount_receipt"
            tabindex="7"
          />
        </div>
        <div class="col-5">
          <MtInputForm
            type="text"
            label="消費税 "
            v-model="data.tax08_amount"
            tabindex="8"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-2">
          <span class="text-grey-700">税率10％</span>
        </div>
        <div class="col-5">
          <MtInputForm
            type="text"
            label="10%対象金額"
            v-model="data.vat10_amount_receipt"
            tabindex="9"
          />
        </div>
        <div class="col-5">
          <MtInputForm
            type="text"
            label="消費税"
            v-model="data.tax10_amount"
            tabindex="10"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <span class="text-grey-700">但し書き</span>
        <div class="row items-center q-ml-md col-10">
          <div class="col-3">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '診療代' }]"
              v-model="data.flg_proviso_medical_treatment"
            />
          </div>
          <div class="col-3">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '処方箋代' }]"
              v-model="data.flg_proviso_prescription"
            />
          </div>
          <div class="col-3">
            <MtInputForm
              type="checkbox"
              :items="[{ label: 'ワクチン代' }]"
              v-model="data.flg_proviso_vaccine"
            />
          </div>
        </div>
      </div>
      <div
        class="row q-col-gutter-md items-center q-mb-md"
        v-if="
          !data.flg_proviso_medical_treatment &&
          !data.flg_proviso_prescription &&
          !data.flg_proviso_vaccine
        "
      >
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            label="その他 但し書き"
            v-model="data.memo_proviso"
            tabindex="15"
          />
        </div>
        <div class="col-auto">
          <span class="q-ml-md">として</span>
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '現金' }]"
            v-model="data.flg_cash"
            @update:modelValue="flg_cash_updated"
          />
        </div>
        <div class="col-3">
          <MtFormInputNumber2
            v-if="data.flg_cash"
            outlined
            label="内訳"
            v-model:value="data.breakdown_cash"
            tabindex="21"
            :input-style="{'font-size': '15px'}"
          />
        </div>
        <div class="col-3">
          <MtFormInputDate
            v-if="data.flg_cash"
            :datetime="true"
            v-model:date="data.datetime_publish_cash"
            label="期日"
            tabindex="22"
          />
        </div>
        <div class="col-3">
          <MtInputForm
            v-if="data.flg_cash"
            type="text"
            label="適用"
            v-model="data.abstract_cash"
            tabindex="23"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: 'クレジットカード' }]"
            v-model="data.flg_cc"
            @update:modelValue="flg_cc_updated"
          />
        </div>
        <div class="col-3">
          <MtFormInputNumber2
            v-if="data.flg_cc"
            outlined
            label="内訳"
            v-model:value="data.breakdown_cc"
            tabindex="31"
            :input-style="{'font-size': '15px'}"
          />
        </div>
        <div class="col-3">
          <MtFormInputDate
            v-if="data.flg_cc"
            :datetime="true"
            v-model:date="data.datetime_publish_cc"
            label="期日"
            tabindex="32"
          />
        </div>
        <div class="col-3">
          <MtInputForm
            v-if="data.flg_cc"
            type="text"
            label="適用"
            v-model="data.abstract_cc"
            tabindex="33"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '振込み' }]"
            v-model="data.flg_bank_transfer"
            @update:modelValue="flg_bank_transfer_updated"
          />
        </div>
        <div class="col-3">
          <MtFormInputNumber2
            v-if="data.flg_bank_transfer"
            outlined
            label="内訳"
            v-model:value="data.breakdown_bank_transfer"
            tabindex="41"
            :input-style="{'font-size': '15px'}"
          />
        </div>
        <div class="col-3">
          <MtFormInputDate
            v-if="data.flg_bank_transfer"
            :datetime="true"
            v-model:date="data.datetime_publish_bank_transfer"
            label="期日"
            tabindex="42"
          />
        </div>
        <div class="col-3">
          <MtInputForm
            v-if="data.flg_bank_transfer"
            type="text"
            label="適用"
            v-model="data.abstract_bank_transfer"
            tabindex="43"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: 'その他' }]"
            v-model="data.flg_payment_method"
            @update:modelValue="flg_payment_method_updated"
          />
        </div>
        <div class="row q-col-gutter-md items-center">
          <div class="col-3">
            <MtInputForm
              v-if="data.flg_payment_method"
              type="text"
              label="その他支払い方法"
              v-model="data.name_payment_method"
              tabindex="51"
            />
          </div>
          <div class="col-3">
            <MtFormInputNumber2
              v-if="data.flg_payment_method"
              outlined
              label="内訳"
              v-model:value="data.breakdown_payment_method"
              tabindex="52"
              :input-style="{'font-size': '15px'}"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-if="data.flg_payment_method"
              :datetime="true"
              v-model:date="data.datetime_publish_payment_method"
              label="期日"
              tabindex="53"
            />
          </div>
          <div class="col-3">
            <MtInputForm
              v-if="data.flg_payment_method"
              type="text"
              label="適用"
              v-model="data.abstract_payment_method"
              tabindex="54"
            />
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            label="備考"
            autogrow
            v-model="data.remarks"
            tabindex="61"
          />
        </div>
      </div>
      <div v-if="isEdit" class="row q-col-gutter-md items-center q-mb-md">
        <span class="text-grey-700"
          >ダウンロード日時：
          <span class="q-ml-sm">
            {{
              data.datetime_download
                ? formatDate(data.datetime_download)
                : '----/--/-- --:--'
            }}</span
          >
        </span>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          tabindex="70"
          type="submit"
          class="q-ml-md"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
