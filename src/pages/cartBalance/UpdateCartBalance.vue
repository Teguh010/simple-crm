<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { getCustomerName, getDateTimeNow, roundZeroAfterPoint } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'
import OptionModal from '@/components/OptionModal.vue'
import aahValidations from '@/utils/aahValidations'
import useCustomerStore from '@/stores/customers'
import aahMessages from '@/utils/aahMessages'
import usecartBalanceStore from '@/stores/cartBalances'
import useCartStore from '@/stores/carts'
import { useRouter } from 'vue-router'

const cartBalanceStore = usecartBalanceStore()
const customerStore = useCustomerStore()

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })
const isEdit = ref(false)
const editDisabled = ref(false)

const router = useRouter()

const responseCartBalance = ref({
  bal_updated: 0
})

const data = ref({
  id_customer: null,
  name_customer: null,
  amount_adjustment: null,
  datetime_paid_last: getDateTimeNow(),
  bal_last: null,
  bal_updated: null,
  bal_last_UI: null,
  bal_updated_UI: null
})

const menuOptions = [
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

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除',
      name: 'Delete',
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
    if (selectedOption.name == 'Delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            useCartStore().destroyCartBalance(data.value.id_cart_balance).then(async () => {
              await mtUtils.autoCloseAlert(aahMessages.success)
              emits('close')
            }).catch(async (error) => {
              console.log(error)
              await mtUtils.autoCloseAlert(error.response.data.data)
            })

          }
        })
    }
  }
}
const closeModal = () => {
  emits('close')
}

const submit = () => {

  data.value.bal_last = data.value.bal_last_UI
  data.value.bal_updated = data.value.bal_updated_UI


  if (!isEdit.value) {
    cartBalanceStore.submitCartBalance(data.value).then(() => {
      cartBalanceStore.fetchCartBalances()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    }).catch(async ({ response }) => {

      if (response && response.data && response.data.data.status == '401') {
        const confirmation = await mtUtils.confirm('未完了の会計があります。\n 未完了会計を終了させて繰越金を登録してください。', '注意', '未完了会計を探す')
        if (!confirmation) return
        const route = router.resolve({
          name: 'SearchCartList',
          query: { id_customer: data.value.id_customer, source: 'cart_balance' }
        })
        window.open(route.href, '_blank')
      }

      if (response && response.data && response.data.data.status != '401') {
        await mtUtils.autoCloseAlert('Error')
        return
      }
      
    })
    return
  }

  cartBalanceStore.updateCartBalance(data.value).then(() => {
    cartBalanceStore.fetchCartBalances()
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
  }).catch(async (error) => {
    await mtUtils.autoCloseAlert(error.response.data.data)
  })
}

async function getCartBalanceByDate() {
  data.value.amount_adjustment = 0
  console.log(data.value.amount_adjustment)

  const resp = await cartBalanceStore.fetchCartBalancesByDate(data.value)

  if (resp && resp.data.data && resp.data.data.code == '205') {
    console.log('Reached here', resp.data.data)
    responseCartBalance.value = 0
    data.value.bal_last_UI = 0
    data.value.bal_updated_UI = 0
    return
  }

  if (resp) {
    responseCartBalance.value = resp.data.data
    data.value.bal_last_UI = resp.data.data.bal_updated
    data.value.bal_updated_UI = data.value.bal_last_UI + data.value.amount_adjustment
  }
} 

const selectingCustomer = async (value) => {
  data.value.bal_last_UI = null
  data.value.bal_updated_UI = null

  await customerStore.retrieveCustomer(value)
  if (value) {
    if (customerStore?.getCustomer) {
      data.value.name_customer = getCustomerName(customerStore.getCustomer)
    }
    await cartBalanceStore
      .fetchLatestCartBalanceOfCustomer(value)
      .then((resp) => {
        responseCartBalance.value = resp.data.data
        data.value.bal_last_UI = resp.data.data.bal_updated
        data.value.bal_updated_UI = data.value.bal_last_UI + data.value.amount_adjustment
      }).catch((error) => {
        data.value.bal_last_UI = 0
        data.value.bal_updated_UI = 0
        responseCartBalance.value.bal_updated = 0
      })
  }
}

const updateBalUpdated = async (val: any) => {

  data.value.bal_updated_UI = responseCartBalance.value.bal_updated

  if (val) {

    if (val > 0) {
      data.value.bal_updated_UI = Number((Number(val) + Math.abs(Number(data.value.bal_last_UI))) * -1)
      return
    } else {
      data.value.bal_updated_UI = Math.abs(Number(val)) + Number(responseCartBalance.value.bal_updated)
    }

    if (((Number(val) * -1) + Number(data.value.bal_last_UI)) > 0) {
      await mtUtils.alert(`現在の繰越金と同等、または大きな額を入力してください。 ${roundZeroAfterPoint(data.value.bal_last_UI)}`, '確認')
      data.value.amount_adjustment = 0
      return
    }

    return
  }

  data.value.bal_updated = responseCartBalance.value.bal_updated

}

onMounted(async () => {
  if (props?.data?.id_cart_balance) {
    isEdit.value = true
    data.value = JSON.parse(JSON.stringify(props.data))
    editDisabled.value = true
    data.value.bal_last_UI = props.data.bal_updated
    data.value.bal_updated_UI =
      data.value.bal_last + props.data.amount_adjustment
  } else {
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    data.value.flg_most_recent = true
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <span>繰越金</span>
      </q-toolbar-title>

      <q-btn v-if="isEdit" round flat @click="openMenu(data)" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-lg content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtCustomerFilterSelect
            v-model:selecting="data.id_customer"
            label="診察券番号・オーナー名"
            tabindex="3"
            :disable="isEdit"
            required
            :rules="[aahValidations.validationRequired]"
            @selected="selectingCustomer"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFormInputNumber2
            v-model:value="data.amount_adjustment"
            :disable="editDisabled"
            tabindex="2"
            :input-class="{ 'size-large': true }"
            :input-style="{ 'font-size': '23px', 'font-weight': 'bold'}"
            label="発生金額"
            @update:modelValue="updateBalUpdated"
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNonZeroNumber
            ]"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFormInputDate
            :datetime="true"
            v-model:date="data.datetime_paid_last"
            label="発生日"
            tabindex="32"
            :disable="isEdit"
            @update:date="()=>{
              data.amount_adjustment = 0
              getCartBalanceByDate()
            }"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFormInputNumber2
            v-model:value="data.bal_last_UI"
            tabindex="2"
            :input-class="{ 'size-large': true }"
            :input-style="{ 'font-size': '23px', 'font-weight': 'bold' }"
            label="前回繰越金"
            disable
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFormInputNumber2
            v-model:value="data.bal_updated_UI"
            disable
            tabindex="2"
            :input-class="{ 'size-large': true }"
            :input-style="{ 'font-size': '23px', 'font-weight': 'bold' }"
            label="今回繰越金"
          />
        </div>
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
          :disable="editDisabled"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
