<script lang="ts" setup>
import { ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { formatDate, processFormatHourMinutes } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

import mtUtils from '@/utils/mtUtils'

import useCartStore from '@/stores/carts'
import usePaymentStore from '@/stores/payment'

import { setPageTitle } from '@/utils/pageTitleHelper'
import selectOptions from '@/utils/selectOptions'
import aahValidations from '@/utils/aahValidations'
import { timeHourMinute } from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  cartData: Object,
  pageTitle: String,
  fromPage: String
})

const cartStore = useCartStore()

const data = ref({
  datetime_upfront: (props.data && props.data.datetime_upfront) || null,
  datetime_payment: (props.data && props.data.datetime_payment) || null,
  id_payment: (props.data && props.data.id_payment) || null
})

const datetime_bill = ref(formatDate(data.value.datetime_upfront))
const datetime_bill_time = ref(
  processFormatHourMinutes(data.value.datetime_upfront)
)

const closeModal = () => {
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}

const submit = async () => {
  data.value.datetime_upfront = `${datetime_bill.value} ${datetime_bill_time.value}:00`
  data.value.datetime_payment = data.value.datetime_upfront
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `payment/${data.value.id_payment}`,
    { ...data.value }
  )

  if (response) {
    await mtUtils.promiseAllWithLoader([
      await cartStore.fetchCart(props.data?.id_cart),

      usePaymentStore().fetchPaymentByCustomer({
        id_cart: props.data?.id_cart,
        id_customer: props.data?.id_customer,
        flg_upfront_ui: true,
        flg_refund_occurred: true,
        flg_refund_conducted: true
      }),
      await usePaymentStore().fetchPaymentsByCart(props.data?.id_cart)
    ])

    await mtUtils.autoCloseAlert('更新しました。')
    closeModal()
  }
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader :closeBtn="true" @close-modal="closeModal">
      <q-toolbar-title
        class="text-grey-900 title2 bold"
        style="max-width: max-content"
      >
        前受入金日の変更
      </q-toolbar-title>
      <div class="q-ml-auto"></div>
    </MtModalHeader>
    <q-card-section class="q-px-xl q-mb-md">
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-6">
          <MtFormInputDate
            v-model:date="datetime_bill"
            type="date"
            label="前受入金日 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-6">
          <MtFormPullDown
            type="selection"
            v-model:selected="datetime_bill_time"
            :options="timeHourMinute"
            label="時：分 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <!-- <MtFormInputDate v-model:date="data.datetime_upfront" label="前受金 処理日" /> -->
      </div>
    </q-card-section>
    <q-card-section class="full-width q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          class="q-ml-md"
          color="primary"
          tabindex="7"
          type="submit"
          unelevated
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
