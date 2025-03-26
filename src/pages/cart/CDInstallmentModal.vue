<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCartDetailStore from '@/stores/cart-details'
import useCartStore from '@/stores/carts'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import aahValidations from '@/utils/aahValidations'
import selectOptions from '@/utils/selectOptions'
import OptionModal from '@/components/OptionModal.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'

const cartStore = useCartStore()
const cartDetailStore = useCartDetailStore()
const { getCart } = storeToRefs(cartStore)

const data = ref({
  id_cart_detail: null,
  flg_group_title: false,
  name_cart_item_display: null,
  id_cart_detail_list: []
})

const isEdit = ref(false)


const props = defineProps({ data: Object, previousCB: Object, message: Object, unCheckCallBack: Function })

const emit = defineEmits(['close'])
const closeModal = () => {
  useCartStore().setFlgAddCartBalance(false)
  emit('close')
}

const openMenu = async () => {
  let menuOptions = [
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

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils.callApi(selectOptions.reqMethod.DELETE, `cart-installment/${data.value.id_cart_detail}`, {
        id_cart: useCartStore().getCart.id_cart
      })
      closeModal()
    }
  }
}

const handleSubmit = async () => {
  if (isEdit.value && data.value.id_cart_detail) {

    const response = await mtUtils.callApi(selectOptions.reqMethod.PUT, `cart-installment/${data.value.id_cart_detail}`, {
      id_cart: useCartStore().getCart.id_cart,
      ...data.value
    })

    if (!response) {
      await mtUtils.autoCloseAlert('Error')
    }

    await cartStore.fetchCart(useCartStore().getCart.id_cart)
    cartStore.setFlgAddCartBalance(true)
    emit('close')
    
    return
  }


  await mtUtils.callApi(selectOptions.reqMethod.POST, 'cart-installment', {
    id_cart: useCartStore().getCart.id_cart,
    ...data.value
  })

  await cartStore.fetchCart(useCartStore().getCart.id_cart)
  cartStore.setFlgAddCartBalance(true)
  emit('close')

}

function lessThanValue(value) {
  if (Number(value) > Number(Math.abs(useCartStore().getCustomerCartBalance)))
    return `オーナー様の累計未払金を上限に入力してください。`
    // return `上限：オーナー様の累計未払金 ${roundZeroAfterPoint(Math.abs(Number(useCartStore().getCustomerCartBalance)))}`
}

onMounted(() => {

  data.value.id_customer = useCartStore().getCart.id_customer

  if (props.data && props.data.id_cart_detail && props.data.flg_group_title) {
    isEdit.value = true
    data.value.id_cart_detail = props.data.id_cart_detail
    data.value.amount_installment = props.data.group_detail.amount_installment
    return
  }

  data.value.name_cart_item_display = '未払い金額'
  data.value.flg_group_title = true
  data.value.amount_installment = props.previousCB

})
</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader :closeBtn="true" @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        未収金の請求
      </q-toolbar-title>
      <q-space></q-space>
      <q-btn v-if="isEdit" class="q-mx-sm" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-pa-xl">
      <div class="">
        <p>{{ props.message ? props.message : '本会計に追加する未収金額を指定します。' }} </p>
        <div class="">
          <q-input v-model="data.amount_installment" :rules="[aahValidations.validationRequired, lessThanValue]"
                       label="追加額（上限：未収合計額"
                       input-style="text-align: right"
                       type="number" />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>追加</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
