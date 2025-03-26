<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { storeToRefs } from 'pinia'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { blank, getDateTimeNow, getDateToday } from '@/utils/aahUtils'

// Stores
import useCustomerStore from '@/stores/customers'
import useCartStore from '@/stores/carts'
import useDiseasesInsuredStore from '@/stores/diseasesInsured'

// Components
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'

// Lazy-loaded Components
const ReselectDieaseInsurerModal = defineAsyncComponent(() => import('./ReselectDieaseInsurerModal.vue'))

// Store Instances
const customerStore = useCustomerStore()
const diseasesInsuredStore = useDiseasesInsuredStore()

// Store References
const { getCustomer } = storeToRefs(customerStore)

// Props and Emits
const emits = defineEmits(['close'])
const props = defineProps({ data: Object, scrollAreaHeight: Object })

// Reactive Variables
const data = ref({})
const popupDieaseInsurer = ref(null)


const blankField = (row) => (data.value = blank(data.value, row))

const updateDateTimeApproved = (value) => {
  // if value, set todays time as datetime_approved otherwise set null as datetime_approved
  data.value.datetime_approved = value ? getDateTimeNow() : null
}
const updateDateRefund = (value) => {
  data.value.date_refund = value ? getDateToday() : null
}

const callbackFromReselectDieaseInsurerModal = (val: any) => {
  if (popupDieaseInsurer.value) {
    const diseaseInsurer = diseasesInsuredStore.getDiseasesInsured.find(
      (dis: any) => dis.id_disease_insurer === popupDieaseInsurer.value
    )
    props.data.code_category2 = diseaseInsurer.code_category2
    props.data.name_ins1 = diseaseInsurer.name_category2
    props.data.name_ins2 = diseaseInsurer.name_disease_insurance
  }
}

const openModalToReselectDiseaseInsurer = async () => {
  await mtUtils.smallPopup(ReselectDieaseInsurerModal, {
    popupDieaseInsurer: popupDieaseInsurer,
    cartObj: props.data,
    onClose: callbackFromReselectDieaseInsurerModal
  })
}

const formattedAddresses = computed(() => {
  if (Array.isArray(getCustomer.value?.address)) {
    // First, sort the addresses based on flg_main_address
    const sortedAddresses = getCustomer.value.address.sort((a, b) => {
      return b.flg_main_address - a.flg_main_address // Puts true values before false
    })

    // Then, map the sorted addresses to the desired format
    return sortedAddresses.map((address) => {
      return `${address.zip_code || ''} ${address.address_prefecture || ''}${address.address_city || ''}${address.address_other || ''}`
    })
  } else {
    return [] // Return an empty array if no addresses are available
  }
})

const save = async () => {
  await useCartStore().updateCart(props.data.id_cart,
    {
      date_cart: props.data.date_cart,
      id_employee_doctor: props.data.id_employee_doctor,
      memo_bill_address: props.data.memo_bill_address,
      memo_cart: props.data.memo_cart,
      memo_bill: props.data.memo_bill,
      id_employee_cart: props.data.id_employee_cart,
      id_employee_approved: props.data.id_employee_approved,
      datetime_approved: props.data.datetime_approved,
      flg_custody_alert: props.data.flg_custody_alert,
      flg_billed: props.data.flg_billed,
      datetime_billed: props.data.datetime_billed,
      flg_cart_asked2: props.data.flg_cart_asked2,
      datetime_cart_asked2: props.data.datetime_cart_asked2,
      memo_cart_asked2:props.data.memo_cart_asked2,
      flg_refund: props.data.flg_refund ? props.data.flg_refund : false,
      method_refund: props.data.method_refund,
      memo_refund: props.data.memo_refund,
      flg_paid: props.data.flg_paid,
      datetime_paid: props.data.datetime_paid,
      flg_closed: props.data.flg_closed,
      datetime_done: props.data.datetime_done,
      name_insured_disease: props.data.name_insured_disease,
      name_ins1: props.data.name_ins1,
      name_ins2: props.data.name_ins2,
    })

  await mtUtils.autoCloseAlert('更新しました。')
  emits('close')

}


</script>

<template>
  <div class="row q-col-gutter-md cartHeaderLeft q-mx-md relative-position" style="z-index: 999;">
    <div class="col-lg-3 col-md-3 col-sm-6">
      <MtFormInputDate
        v-model:date="props.data.date_cart"
        type="date"
        label="会計日"
      />
    </div>
    <div class="col-lg-3 col-md-3 col-sm-6">
      <MtInputForm
        type="text"
        label="診察券番号・オーナー名"
        :model-value="props.data.code_customer + ' ' + props.data.name_customer + ' 様'"
        readonly
      />
    </div>
    <div v-if="props.data.name_pet" class="col-lg-3 col-md-3 col-sm-6">
      <span
        v-for="(name, index) in props.data.name_pet.split(',')"
        :key="index"
        class="q-mr-md"
        >{{ name }}</span>
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <InputEmployeeOptGroup
        type-occupation="doctor"
        v-model:selected="props.data.id_employee_doctor"
        label="担当医"
      />
    </div>
    <div class="col-12">
      <q-select
        v-model="props.data.memo_bill_address"
        :options="formattedAddresses"
        label="オーナー請求先住所"
      />
    </div>
    <div class="col-auto q-mr-lg">
      <MtFormCheckBox
        label="保険適用"
        v-model:checked="props.data.flg_insure_request"
        :disable="true"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtInputForm
        type="text"
        v-model="props.data.name_ins1"
        label="保険用：診断 大分類"
        autogrow
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtInputForm
        type="text"
        v-model="props.data.name_ins2"
        label="保険用：診断 中分類"
        autogrow
      />
    </div>
    <div v-if="props.data.flg_insure_request" class="col-auto">
      <q-btn
        color="grey-100"
        text-color="grey-800"
        class="body1 regular border-btn"
        @click="openModalToReselectDiseaseInsurer"
      >
        再選択
      </q-btn>
    </div>
    <div class="col-12">
      <MtInputForm
        type="text"
        v-model="props.data.name_insured_disease"
        label="傷病名：診断テキスト名"
        autogrow
      />
    </div>
    <div class="w-100"></div> <!--Break line-->
    <div class="col-lg-6 col-md-6 col-sm-12">
      <MtInputForm
        type="text"
        v-model="props.data.memo_cart"
        label="診療日メモ"
        autogrow
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-12">
      <MtInputForm
        type="text"
        v-model="props.data.memo_bill"
        label="帳票メモ"
        autogrow
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <InputEmployeeOptGroup
        v-model:selected="props.data.id_employee_cart"
        label="会計作成者"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <InputEmployeeOptGroup
        type-occupation="cart-approver"
        v-model:selected="props.data.id_employee_approved"
        label="会計承認者"
        @update:model-value="updateDateTimeApproved"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.id_employee_approved">
      <MtFormInputDate
        datetime
        label="承認日時"
        v-model:date="props.data.datetime_approved"
        disable
      />
    </div>
    <div class="w-100"></div> <!--Break line-->
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtFormCheckBox
        label="預かり品注意喚起"
        v-model:checked="props.data.flg_custody_alert"
        :disable="true"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtFormCheckBox
        label="診療明細発行済"
        v-model:checked="props.data.flg_billed"
        :disable="true"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_billed">
      <MtFormInputDate
        label="診療明細発行日"
        v-model:date="props.data.datetime_billed"
        disable
      >
      </MtFormInputDate>
    </div>
    <div class="w-100"></div> <!--Break line-->
    <!--<div class="col-lg-3 col-md-4 col-sm-6">
      <MtFormCheckBox
        label="会計初回依頼"
        v-model:checked="props.data.flg_cart_asked1"
        :disable="true"
      />
    </div>
    <div class="cocol-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_cart_asked1">
      <div class="flex items-center">
        <span class="body2 regular text-grey-700">初回依頼日時：</span>
        <MtFormInputDate
          datetime
          label=""
          v-model:date="props.data.datetime_cart_asked1"
          disable
        ></MtFormInputDate>
      </div>
    </div> -->
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_cart_asked2">
      <MtFormCheckBox
        label="会計更新"
        v-model:checked="props.data.flg_cart_asked2"
        :disable="true"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_cart_asked2">
      <MtFormInputDate
        datetime
        label="更新日時"
        v-model:date="props.data.datetime_cart_asked2"
        disable
      ></MtFormInputDate>
    </div>
    <div class="col-lg-6 col-md-12 col-sm-12">
      <MtInputForm
        type="text"
        v-model="props.data.memo_cart_asked2"
        label="会計更新メモ"
        autogrow
      />  
    </div>
    <div class="w-100"></div> <!--Break line-->
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtFormCheckBox
        label="全額返金"
        v-model:checked="props.data.flg_refund"
        :disable="true"
        @update:model-value="updateDateRefund"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_refund">
      <MtFormInputDate
        datetime
        label="返金日時"
        v-model:date="props.data.date_refund"
      >
      </MtFormInputDate>
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_refund">
      <MtInputForm
        type="text"
        v-model="props.data.method_refund"
        label="返金方法"
        autogrow
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_refund">
      <MtInputForm
        type="text"
        v-model="props.data.memo_refund"
        label="返金理由"
        autogrow
      />
    </div>
    <div class="w-100"></div> <!--Break line-->
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtFormCheckBox
        label="決済完了"
        v-model:checked="props.data.flg_paid"
        :disable="true"
        @click="blankField(['datetime_paid'])"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_paid">
      <MtFormInputDate
        datetime
        label="決済完了日時"
        v-model:date="props.data.datetime_paid"
      ></MtFormInputDate>
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6">
      <MtFormCheckBox
        label="会計処理完了"
        v-model:checked="props.data.flg_closed"
        :disable="true"
      />
    </div>
    <div class="col-lg-3 col-md-4 col-sm-6" v-if="props.data.flg_closed">
      <MtFormInputDate
        datetime
        label="会計処理完了日時"
        v-model:date="props.data.datetime_done"
      ></MtFormInputDate>
    </div>
    <div class="w-100 q-mt-md"></div> <!--Break line-->
  </div>
  <div class="footer justify-end absolute-bottom-right">
    <div class="text-right">
      <q-btn
        color="primary"
        padding="4px 24px"
        unelevated
        @click="save"
        :disable="props.data.flg_completed"
        style="
          z-index: 9999;
          bottom: 28px;
        "
      >
        保存
      </q-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  padding-right: 18px;
  flex-grow: 1;
  display: flex;
  margin-top: auto;
  align-self: end;
}
.border-btn {
  border: 1px solid $grey-800;
}

.status-chip {
  max-width: 71px;
  width: 100%;

  :deep(.q-chip__content) {
    justify-content: center;
  }
}

.cartHeaderLeft {
  overflow: auto !important;
}

@media screen and (min-height: 700px) {
  .cartHeaderLeft {
    height: 80vh !important;
  }
}

@media screen and (min-height: 200px) {
  .cartHeaderLeft {
    height: 75vh;
  }
}
</style>
