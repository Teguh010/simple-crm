<script lang="ts" setup>
const emits = defineEmits(['close'])
const closeModal = () => emits('close')

const props = defineProps({
  paymentOptions: {}  
})
console.log(props)

const confirmPayment = () => {
  const { paymentOptions } = props
  console.log(paymentOptions, props)
  paymentOptions.attr.paymentConfirmed = true
  closeModal()
}
</script>
<template>
  <q-card class="payment-confirmation-card">
    <q-card-section class="row q-col-gutter-md q-pa-md">
      <div class="col-12 title1 bold text-danger text-center q-my-md">
        <q-icon name="report" class="q-mr-sm"/>
        注意
      </div>
      <div class="col-12 body1 regular text-center q-pa-md">
        <div class="col-12 q-mb-md">
          現在の会計は保険見積りモードです。\n先に保険を適用するか、しないかを決めてください。
        </div>
      </div>
      <div class="col-12 row justify-end q-pa-md">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" @click="confirmPayment" unelevated>
          <span>削除する</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>
<style lang="scss" scoped>
.payment-confirmation-card {
  background: $yellow;
}
</style>