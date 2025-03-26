<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'
import { usePaymentRequestStore } from '@/stores/payment-requests'
import useCustomerStore from '@/stores/customers'

import aahValidations from '@/utils/aahValidations'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'

const paymentRequestStore = usePaymentRequestStore()
const customerStore = useCustomerStore()

const emits = defineEmits(['close'])

const props = defineProps({ data: Object })

const isEdit = ref(false)

const data = ref({
  amount: null,
  id_customer: '',
  memo: null,
  id_clinic: null
  // id_payment_request: null,
})

const closeModal = () => {
  emits('close')
}
const submit = () => {
  if (props.data) {
    paymentRequestStore.updatePaymentRequest(data.value).then(() => {
      paymentRequestStore.fetchPaymentRequests()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  } else {
    paymentRequestStore.submitPaymentRequest(data.value).then(() => {
      paymentRequestStore.fetchPaymentRequests()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
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
            paymentRequestStore
              .deletePaymentRequest(data.value.id_payment_request)
              .then(() => {
                paymentRequestStore.fetchPaymentRequests()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
onMounted(() => {
  if (props.data?.id_payment_request) {
    // Update case
    isEdit.value = true
    data.value = props.data
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        従業員マスタ
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md items-center q-mb-xs">
        <div class="col-3">
          <MtInputForm
            type="text"
            v-model="data.amount"
            label="amount"
            required
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNumber
            ]"
          />
        </div>
        <div class="col-6">
          <MtCustomerFilterSelect
            v-model:selecting="data.id_customer"
            label="customer *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-xs">
        <div class="col-10">
          <MtInputForm type="text" v-model="data.memo" label="memo" />
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
