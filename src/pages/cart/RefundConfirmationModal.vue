<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

import useCartStore from '@/stores/carts'

import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormDecimalNumber from '@/components/form/MtFormDecimalNumber.vue'

import useItemServiceUnitStore from '@/stores/item-service-units'

import aahValidations from '@/utils/aahValidations'

import { calculateDays } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'

const props = defineProps({
  cartData: Object,
  cartDetailDataList: {
    type: Array,
    default: () => []
  },
  updatedFlg: { type: Object, default: { value: false } }
})

const emits = defineEmits(['close'])

const itemUnitStore = useItemServiceUnitStore()
const { getItemServiceUnits } = storeToRefs(itemUnitStore)
const cartStore = useCartStore()
const { getCart } = storeToRefs(cartStore)

const cartData = ref({})
const loading = ref(false)

const maxTwentyCharacters = (val: any) => {
  const maxLength: any = 50
  if (val && val.length > maxLength) {
    return `会計明細名が長い為、非表示部分が発生します（${maxLength}文字まで）`
  }
}

const closeModal = () => {
  emits('close')
}

function findLargestInterval(orders) {
  let maxInterval = 0
  let orderWithMaxInterval = null

  for (const order of orders) {
    const interval = calculateDays(order.date_order_start, order.date_order_end)
    if (interval > maxInterval) {
      maxInterval = interval
      orderWithMaxInterval = order
    }
  }
  if (maxInterval && orderWithMaxInterval)
    return { maxInterval, orderWithMaxInterval }
  return null
}

function setCartAndCD(array: any = null) {
  let localArray = array

  const cd = localArray.find((cd) => {
    return cd.type_insurance_purpose == 2
  })
  if (cd) {
    cartData.value.date_ins_type2 = cd.date_order_start
    cartData.value.days_ins_type2 = 1
  }

  const tempDays = findLargestInterval(
    localArray.filter(
      (v) => v.type_insurance_purpose == 3 && !v.id_prescription_detail
    )
  )
  if (tempDays) {
    cartData.value.date_ins_type3_start =
      tempDays.orderWithMaxInterval.date_order_start
    cartData.value.date_ins_type3_end =
      tempDays.orderWithMaxInterval.date_order_end
    cartData.value.days_ins_type3 = tempDays.maxInterval
  }

  const cd1 = localArray.find((cd) => {
    return cd.type_insurance_purpose == 4
  })

  if (cd1) {
    cartData.value.date_ins_type4 = cd1.date_order_start
    cartData.value.total_ins_type4 = 1
  }
}

const submit = async () => {
  loading.value = true
  for (let index = 0; index < cartList.value.length; index++) {
    const data = cartList.value[index]
    if (data.sales_ratio < 100 || data.sales_ratio > 100) {
      data.showLabelRatioWarning = true
    }
  }

  //   check if showLabelRatioWarning is true
  if (cartList.value.some((data) => data.showLabelRatioWarning)) {
    loading.value = false
    return
  }

  await cartStore
    .refundCart(getCart.value.id_cart, { cart_detail_list: cartList.value })
    .then((response) => {
      props.updatedFlg.value = true
      closeModal()
    })
    .catch(async (error) => {
      await mtUtils.alert(
        error.response.data.data.detail,
        error.response.data.data.title,
        true
      )
    })
    .finally(() => {
      loading.value = false
    })
}

const setOptionsForItemServiceUnit = async (
  id_item_service: string,
  id_item_service_unit: string
) => {
  itemUnitStore.selectItemServiceUnit(null)

  await itemUnitStore.fetchItemServiceUnits({
    id_item_service: id_item_service
  })

  if (getItemServiceUnits.value.length === 0) {
    return []
  }

  const findService = getItemServiceUnits.value.find(
    (itemServiceUnit: any) =>
      itemServiceUnit.id_item_service_unit === id_item_service_unit
  )

  return findService?.name_service_item_unit
}

const handleUnitSaleChange = (data: any) => {
  // First, update amount_sales and amount_price.
  updateAssortAmounts(data)
  let newSalesRatio = 100

  if (Number(data.unit_price) === 0) {
    data.unit_price = data.unit_sales
  }

  // Calculate the new sales_ratio if unit_price is not zero.
  if (data.unit_price === null) {
    data.sales_ratio = newSalesRatio
  } else if (data.unit_price > 0) {
    newSalesRatio = ((data.unit_sales / data.unit_price) * 100).toFixed(2) // Calculate the new sales ratio with precision.

    // Update sales_ratio only if the new calculation significantly differs from the current value.
    if (parseFloat(newSalesRatio) !== parseFloat(data.sales_ratio)) {
      data.sales_ratio = newSalesRatio
    }
  } else {
    // Safely handle cases where unit_price might be 0 to avoid division by zero errors.
    // Ensure to update sales_ratio only if it's not already 0 to prevent unnecessary updates.
    if (data.sales_ratio !== 0) {
      data.sales_ratio = 0
    }
  }
  // update flg_discount
  if (Number(data?.sales_ratio) < 100) {
    data.flg_discount = true
  } else {
    data.flg_discount = false
  }
}

const cartList = ref([])

const updateAssortAmounts = (data: any) => {
  // const cartItem = data.value.cart_detail_assorts[index]
  data.amount_sales = ((data.unit_sales ?? 0) * Number(data.quantity)).toFixed(
    5
  )
  data.amount_price = ((data.unit_price ?? 0) * Number(data.quantity)).toFixed(
    5
  )
}

const handleSalesRatioChange = (data: any) => {
  // const cartItem = data.value.cart_detail_assorts[index]
  let newUnitSales = null

  // Calculate the new unit_sales based on the updated sales_ratio.
  if (data.unit_price) {
    newUnitSales = Number(
      (data.unit_price * ((data.sales_ratio ?? 100) / 100)).toFixed(9)
    )
  }

  // Update unit_sales only if the new calculation significantly differs from the current value.
  // This prevents unnecessary updates and potential infinite loops.

  if (newUnitSales && newUnitSales !== Number(data.unit_sales)) {
    data.unit_sales = newUnitSales
    // Since unit_sales has changed, update related amounts.
    updateAssortAmounts(data)
  }

  // update flg_discount
  data.showLabelRatioWarning = false
  if (Number(data?.sales_ratio) < 100) {
    data.flg_discount = true
  } else {
    data.flg_discount = false
  }
}

onMounted(() => {
  cartData.value = JSON.parse(JSON.stringify(props.cartData))

  props.cartDetailDataList.forEach(async (data, index) => {
    const itemServiceUnitName = await setOptionsForItemServiceUnit(
      data.id_item_service,
      data.id_item_service_unit
    )
    cartList.value.push({
      ...data,
      itemServiceUnitName: itemServiceUnitName,
      showLabelRatioWarning: false
    })
  })
})
</script>

<template>
  <q-form @submit.prevent="submit" v-if="cartList && cartList.length > 0">
    <MtModalHeader @close-modal="closeModal">
      <div class="flex justify-end">
        <q-btn unelevated @click="closeModal" round>
          <q-icon size="18px" name="close" class="q-mr-xs" />
        </q-btn>
      </div>
      <div class="text-center text-h5 q-mb-lg">
        <div class="">
          金額を確認して保存ボタンを押すと返金会計が作成されます
        </div>
      </div>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <!-- sd section  -->
      <div class="flex column q-gutter-sm">
        <div
          class="col q-pa-sm q-pl-md full-width cursor-pointer"
          style="border-left: 6px solid #9e9e9e"
          v-for="(data, index) in cartList"
        >
          <div class="text-h5 text-weight-bold q-mb-md">
            返金アイテム {{ index + 1 }}
          </div>
          <div class="row">
            <MtInputForm
              placeholder="帳票表示の名称"
              type="text"
              label="明細表示名 *"
              v-model="data.name_cart_item_display"
              input-class="cart-item-title bg-accent-100"
              autofocus
              tabindex="410"
              required
              :rules="[aahValidations.validationRequired, maxTwentyCharacters]"
              readonly
              :disable="false"
              class="col-7"
            />
          </div>
          <div class="row q-col-gutter-md q-mb-md q-mt-sm">
            <div class="col-8">
              <MtInputForm
                placeholder="商品名"
                type="text"
                label="商品名"
                v-model="data.itemServiceUnitName"
                :rules="[aahValidations.validationRequired]"
                readonly
                :disable="false"
              />
            </div>
            <div class="col-4">
              <div class="">
                <q-btn
                  class=""
                  outline
                  size="sm"
                  unelevated
                  :disable="false"
                  @click="
                    () => {
                      data.unit_price = data.amount_sales / data.quantity ?? 1
                      data.sales_ratio = 100
                      data.amount_price = data.amount_sales
                      handleSalesRatioChange(data)
                    }
                  "
                >
                  <q-icon name="refresh" class="q-mr-xs" />
                  掛率を100へ調整
                </q-btn>
              </div>
              <p
                v-if="data.showLabelRatioWarning"
                class="text-negative q-ma-none caption2"
              >
                掛率を100に修正してください
              </p>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="販売単価 *"
                v-model="data.unit_sales"
                required
                :precision="0"
                :rules="[aahValidations.validationRequired]"
                input-class="price-title"
                :outline="false"
                :tabindex="600"
                :readonly="false"
                :disable="false"
                @change="handleUnitSaleChange(data)"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="数量 *"
                v-model="data.quantity"
                oninput="validity.valid||(value='');"
                input-class="price-title"
                required
                @change="updateAssortAmounts(data)"
                :rules="[
                  aahValidations.validationRequired,
                  ...(!useCartStore().getCart.flg_refund
                    ? [aahValidations.validationPositiveNumber]
                    : [])
                ]"
                :tabindex="700"
                :readonly="false"
                :disable="false"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="販売合計額"
                v-model="data.amount_sales"
                :rules="[aahValidations.validationRequired]"
                readonly
                required
                filled
                input-class="price-title"
                :tabindex="800"
                :precision="0"
                :disable="false"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-sm">
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="標準単価"
                v-model="data.unit_price"
                readonly
                filled
                input-class="price-title"
                :tabindex="900"
                :precision="0"
                :disable="true"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="掛率 *"
                min="0"
                oninput="validity.valid||(value='');"
                @change="handleSalesRatioChange(data)"
                v-model="data.sales_ratio"
                filled
                input-class="price-title"
                appendIcon="percentage"
                :readonly="false"
                :tabindex="1000"
                :disable="false"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="標準合計金額"
                v-model="data.amount_price"
                readonly
                filled
                input-class="price-title"
                :precision="0"
                :disable="true"
              />
            </div>
          </div>
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
          class="q-ml-md"
          :disable="loading"
          type="submit"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
