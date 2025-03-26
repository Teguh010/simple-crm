<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCartDetailStore from '@/stores/cart-details'
import useCartStore from '@/stores/carts'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import aahValidations from '@/utils/aahValidations'
import { getDateToday } from '@/utils/aahUtils'

const cartStore = useCartStore()
const cartDetailStore = useCartDetailStore()
const { getCart } = storeToRefs(cartStore)

const data = ref({
  id_cart_detail: null,
  flg_group_title: false,
  name_cart_item_display: null,
  type_tax_10: false,
  type_tax_08: false,
  type_tax_exempt: false,
  id_cart_detail_list: null,
  type_tax: null
})

const isEdit = ref(false)
const disable10 = ref(false)
const disable08 = ref(false)
const disableExempt = ref(false)

const cartDetailListOption = ref([])

const props = defineProps({ cartDetail: Object, typeTax: Object, selectedCart: { type: Array }, petObj: Object })

const emit = defineEmits(['close'])
const closeModal = () => emit('close')

const getCartBillingData = (isSpecialCase: any = false) => {
  return {
    special_case: isSpecialCase,
    ch_disc_rate: getCart.value.ch_disc_rate,
    cart_payment_this_time: getCart.value.cart_payment_this_time,
    type_price_adjustment: getCart.value.type_price_adjustment,
    total_adjustment_intax: getCart.value.total_adjustment_intax,
    date_ins_type2: getCart.value.date_ins_type2,
    days_ins_type2: getCart.value.days_ins_type2,
    date_ins_type3_start: getCart.value.date_ins_type3_start,
    date_ins_type3_end: getCart.value.date_ins_type3_end,
    days_ins_type3: getCart.value.days_ins_type3,
    date_ins_type4: getCart.value.date_ins_type4,
    total_ins_type4: getCart.value.total_ins_type4
  }
}

const handleSubmit = async () => {

  try {
    await cartDetailStore.mergeCartDetail({
      ...data.value,
      id_cart: getCart.value.id_cart,
      id_pet: useCartStore().getCart.cart_details.filter(cd => cd.id_cart_detail == data.value.id_cart_detail_list[0])[0]?.id_pet?.id_pet,
      date_order_start: getDateToday()
    })
    await mtUtils.promiseAllWithLoader([
      cartStore.updateBillingAmount(getCart.value?.id_cart, getCartBillingData())
    ])
    
    await mtUtils.autoCloseAlert(aahMessages.success)
    closeModal()
  } catch (error) {
    await mtUtils.autoCloseAlert(aahMessages.failed)
  }
}

function checkedTypeTax(value: any, type: any) {
  cartDetailListOption.value.length = 0
  disable10.value = true
  disable08.value = true
  disableExempt.value = true

  let type_tax = 0

  if (!value) {
    disable08.value = false
    disable10.value = false
    disableExempt.value = false
    data.value.id_cart_detail_list = []
    data.value.name_cart_item_display = ''
    
    useCartStore()?.getCart?.cart_details.forEach(cartDetail => {
      if (cartDetail?.id_pet?.id_pet == props?.petObj?.id_pet && !cartDetail.flg_group_title) {
        cartDetailListOption.value.push({
          label: cartDetail.name_cart_item_display,
          value: cartDetail.id_cart_detail
        })
      }
    })

    return
  }

  if (type == '10') {
    type_tax = 1
    disable10.value = false
    data.value.type_tax = 1
  }

  if (type == '08') {
    type_tax = 2
    disable08.value = false
    data.value.type_tax = 2
  }

  if (type == '00') {
    type_tax = 3
    disableExempt.value = false
    data.value.type_tax = 3
  }

  useCartStore()?.getCart?.cart_details?.filter(cd => cd.type_tax == type_tax).forEach(cartDetail => {
    if (cartDetail?.id_pet?.id_pet == props?.petObj?.id_pet && !cartDetail.flg_group_title) {
      cartDetailListOption.value.push({
        label: cartDetail.name_cart_item_display,
        value: cartDetail.id_cart_detail
      })
    }
  })

}

function checkDisable() {
  if (data.value.id_cart_detail_list && data.value.id_cart_detail_list.length && data.value.id_cart_detail_list.length > 0) {
    disable10.value = true
    disable08.value = true
    disableExempt.value = true

    let cartDetail = useCartStore().getCart.cart_details.filter(cd => cd.id_cart_detail == data.value.id_cart_detail_list[0])

    if (cartDetail = cartDetail[0]) {

      if (cartDetail.type_tax == 1) {
        disable10.value = false
        data.value.type_tax_10 = true

        checkedTypeTax(true, '10')
      }

      if (cartDetail.type_tax == 2) {
        disable08.value = false
        data.value.type_tax_08 = true
        checkedTypeTax(true, '08')
      }

      if (cartDetail.type_tax == 3) {
        disableExempt.value = false
        data.value.type_tax_exempt = true
        checkedTypeTax(true, '00')
      }
    }
  }
}

function processSelection(value: any = null) {

  if (data.value.id_cart_detail_list && data.value.id_cart_detail_list.length === 0) {
    data.value.name_cart_item_display = ''
    return
  }

  if (data.value.id_cart_detail_list && data.value.id_cart_detail_list.length > 0) {
    data.value.name_cart_item_display = useCartStore().getCart.cart_details.filter(cd => cd.id_cart_detail == data.value.id_cart_detail_list[0])?.[0].name_category1
  }

}

onMounted(() => {
  
  if (props.cartDetail && props.cartDetail.id_cart_detail && props.cartDetail.flg_group_title) {
    
    isEdit.value = true

    if (props.cartDetail.group_detail) {

      switch (props.cartDetail.group_detail.type_tax) {

        case 1:
          data.value.type_tax_10 = true
          data.value.type_tax = 1
          break

        case 2:
          data.value.type_tax_08 = true
          data.value.type_tax = 2
          break

        case 3:
          data.value.type_tax_exempt = true
          data.value.type_tax = 3
          break
      }

      if (props.cartDetail.group_detail.id_cart_detail_list) {
        data.value.id_cart_detail = props.cartDetail.id_cart_detail
        data.value.id_cart_detail_list = props.cartDetail.group_detail.id_cart_detail_list
        data.value.name_cart_item_display = props.cartDetail.name_cart_item_display
      }
    }
  }

  if (props.selectedCart) {
    data.value.id_cart_detail_list = Object.keys(props.selectedCart).filter(key => props.selectedCart[key] === true)
    // data.value.id_cart_detail_list = useCartStore().getCart.cart_details.filter((v :any) => data.value.id_cart_detail_list.includes(v.id_cart_detail) && !v.flg_group_title ).map((v)=> (v.id_cart_detail))
  }

  useCartStore()?.getCart?.cart_details?.forEach(cartDetail => {
    if (cartDetail?.id_pet?.id_pet == props?.petObj?.id_pet && !cartDetail.flg_group_title && cartDetail.group_detail && !cartDetail.group_detail.flg_group_item) {
      cartDetailListOption.value.push({
        label: cartDetail.name_cart_item_display,
        value: cartDetail.id_cart_detail
      })
    }
  })
  checkDisable()
  if (!isEdit.value)
    processSelection()
  
})
</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="false">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        会計明細のまとめ
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="q-my-md">
        <p class="text-center">まとめる会計明細を選択して、名称を設定ください。</p>
        <q-select
          v-model="data.id_cart_detail_list"
          :options="cartDetailListOption"
          emit-value
          label="統合対象の会計明細"
          map-options
          multiple
          @update:modelValue="processSelection"
        />
      </div>
      <div class="q-mt-md">
        <div class="">
          <MtFormInputText v-model="data.name_cart_item_display" :rules="[aahValidations.validationRequired]"
                           label="統合後の明細名称" />
        </div>
      </div>
      <div class="q-my-md row">
        <MtFormCheckBox v-model:checked="data.type_tax_10" :disable="isEdit || disable10" class="col-4" label="10%"
                        @update:checked="checkedTypeTax($event, '10')" />
        <MtFormCheckBox v-model:checked="data.type_tax_08" :disable="isEdit || disable08" class="col-4" label="8%"
                        @update:checked="checkedTypeTax($event, '08')" />
        <MtFormCheckBox v-model:checked="data.type_tax_exempt" :disable="isEdit || disableExempt" class="col-4"
                        label="非課税" @update:checked="checkedTypeTax($event, '00')" />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>選択した明細をまとめる</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
