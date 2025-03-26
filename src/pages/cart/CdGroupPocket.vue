<script lang="ts" setup>

import { formatDecimalNumber, formatNumber } from '@/utils/helper'
import useDoseStore from '@/stores/dose-frequencies'
import { customRound, decimalToFraction, roundZeroAfterPoint } from '@/utils/aahUtils'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import mtUtils from '@/utils/mtUtils'
import { computed, defineAsyncComponent } from 'vue'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'
import useCartDetailStore from '@/stores/cart-details'

// Asynchronous Imports (Pages)
const UpdateCartDetailModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartDetailModal.vue')
)
const CDInstallmentModal = defineAsyncComponent(
  () => import('@/pages/cart/CDInstallmentModal.vue')
)
const ViewGroupDetailModel = defineAsyncComponent(
  () => import('@/pages/cart/ViewGroupDetailModel.vue')
)
const CartDetailMergeModal = defineAsyncComponent(
  () => import('@/pages/cart/CartDetailMergeModal.vue')
)

const cartStore = useCartStore()
const cartDetailStore = useCartDetailStore()

const { getCart } = storeToRefs(cartStore)

const props = defineProps({
  pet: Object,
  cartDetail: Object,
  sortMode: Boolean,
  cartDetailList: Object,
  cartIndex: Number,
  insurancePlanList: Object
})

const emits = defineEmits(['updBillingAmount'])

const parentFlgInsurance = computed(() => {
  let isWholeInsured = true
  getCart.value.cart_details.forEach((cd: any) => {
    if (props.cartDetail.group_detail && props.cartDetail.group_detail?.id_cart_detail_list?.includes(cd.id_cart_detail) && !cd.flg_pet_insurance) {
      isWholeInsured = false
    }
  })
  return isWholeInsured
})

const UiDisable = computed(() => {
  if (cartStore.getFlgAllowCartUpdate) {
    return false
  }
  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

function individualRowMove(
  cartDetails: any,
  rowIndex: number,
  direction: 'UP' | 'DOWN'
) {
  if (
    (direction === 'UP' && rowIndex === 0) ||
    (direction === 'DOWN' && rowIndex === cartDetails.length - 1)
  ) {
    return
  }
  let nextIndex = direction === 'UP' ? rowIndex - 1 : rowIndex + 1
  let current = cartDetails.splice(rowIndex, 1)

  cartDetails.splice(nextIndex, 0, ...current)
}

const openCartDetailModal = async (id_cart_detail, pet: any = null) => {
  let cartDetailData = getCart.value?.cart_details.find(
    (detail) => detail.id_cart_detail === id_cart_detail
  )

  if (cartDetailData && cartDetailData.flg_group_title) {
    if (
      cartDetailData.group_detail &&
      cartDetailData.group_detail.cb_installment
    ) {
      await mtUtils.smallPopup(CDInstallmentModal, { data: cartDetailData })
      await cartStore.fetchCart(getCart.value.id_cart)
      return
    }

    await mtUtils.mediumPopup(ViewGroupDetailModel, {
      cartDetail: cartDetailData,
      pet: pet,
      handleCallBackCheck: handleParentCheckbox,
      handleCallBackSelection: handleParentSelection
    })
    await cartStore.fetchCart(getCart.value.id_cart)
    return
  }

  await mtUtils.mediumPopup(UpdateCartDetailModal, {
    data: getCart.value,
    cartDetail: cartDetailData,
    allData: getCart.value?.cart_details
  })
}


const handleParentSelection = async (newVal, pet, cartDetail) => {
  if (newVal == 3) {
    const tempDays = getCart.value.cart_details.find((v) => v?.flg_pet_custody)

    if (!tempDays) {
      await mtUtils.alert(
        '保険入院の会計には「預り管理」にチェックが入っている治療サービス（入院オーダー）を1明細のみ含めてください。\n該当する明細の開始日・終了日は入院開始/終了日を設定してください。'
      )
      return
    }
  }

  await cartDetailStore
    .updateCartDetail(
      cartDetail.id_cart_detail,
      { type_insurance_purpose: newVal },
      true
    )
    .then(async (response) => {
      cartStore.syncUpdatedCartDetail(response.data.data)
      emits('updBillingAmount')
    })
}


const handleParentCheckbox = async (
  newVal,
  pet,
  cartDetail,
  cartDetailType
) => {
  if (newVal) setTypeInsurancePurpose(cartDetail, cartDetailType)

  const tempLocalArray = []

  if (!newVal) {
    tempLocalArray.push(
      ...getCart.value.cart_details.filter((v) => v.flg_pet_insurance)
    )
    tempLocalArray.splice(
      tempLocalArray.findIndex(
        (cd) => cd.id_cart_detail == cartDetail.id_cart_detail
      ),
      1
    )
  } else {
    tempLocalArray.push(
      ...getCart.value.cart_details.filter((v) => v.flg_pet_insurance)
    )
    tempLocalArray.push(cartDetail)
  }

  await cartDetailStore
    .updateCartDetail(
      cartDetail.id_cart_detail,
      {
        flg_pet_insurance: newVal,
        type_insurance_purpose: newVal ? cartDetail.type_insurance_purpose : 1
      },
      true
    )
    .then((response) => {
      cartStore.syncUpdatedCartDetail(response.data.data)
    })

  emits('updBillingAmount')

  let countTrue = 0
  let totalCount = 0

  for (const date in pet.dates) {
    if (pet.dates.hasOwnProperty(date)) {
      const cartDetailsArray = pet.dates[date]
      cartDetailsArray.forEach((cd) => {
        if (parseInt(cd.type_tax) == 1) {
          totalCount += 1
        }
        if (cd.flg_pet_insurance) {
          countTrue += 1
        }
      })
    }
  }

  if (countTrue === 0) {
    pet.flg_pet_insurance_master = false // All false
  } else if (countTrue == totalCount) {
    pet.flg_pet_insurance_master = true // All true
  } else {
    pet.flg_pet_insurance_master = null // Intermediate state
  }
}


async function addMore(event: any = null, cart_detail, pet) {
  if (event) {
    event.preventDefault()
  }

  let cartDetailData = getCart.value?.cart_details.find(
    (detail) => detail.id_cart_detail === cart_detail.id_cart_detail
  )

  await mtUtils.smallPopup(CartDetailMergeModal, {
    cartDetail: cartDetailData,
    petObj: pet
  })
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
}

const getFractionFromValDosage = (value) => {
  const temValue = value?.val_dosage_decided?.toString()
  let partialPart = 0
  let fullPart = 0

  if (value?.val_dosage_decided) {
    fullPart = parseInt(value?.val_dosage_decided)
  }

  if (
    temValue &&
    temValue.includes('.') &&
    temValue.split('.').length &&
    temValue.split('.').length >= 2
  ) {
    const fractionalPart = parseFloat(`0.${temValue.split('.')[1]}`)
    fractionalPart > 0 ? partialPart = fractionalPart : 0 // Ensure there is a fractional part
  }

  if (fullPart && partialPart) {
    return `${
      fullPart
    } + ${decimalToFraction(partialPart)}`
  }


  if (fullPart && !partialPart) {
    return `${fullPart}`
  }

  if (partialPart) {
    return `${decimalToFraction(partialPart)}`
  }

}


const getCalculatedTotalDosage = (pd) => {
  let quantity_dose = useDoseStore().getAllDoses.find(
    (dose: any) =>
      dose.value == pd?.id_dosage_frequency
  )?.quantity_dose ?? 1

  return Math.ceil(
    roundZeroAfterPoint(pd.total_days_dose) *
    Number(quantity_dose ?? 1) ?? 1
  )
}
const getFractionForWhole = (pd, pa) => {

  const calculatedTotalDosage = getCalculatedTotalDosage(pd)

  const totalPill = Number(calculatedTotalDosage) * Number(pa.val_dosage_decided)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {

    if (parseInt(Number(totalPill)) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
}

const getInsurancePlanForPet = (id_pet) => {
  return props.insurancePlanList.find(
    (insurance) => insurance.id_pet === id_pet
  )
}

async function addInsurance(idPetInsurance) {
  await cartStore.updateCartInsurance(getCart.value.id_cart, {
    id_pet_insurance: idPetInsurance,
    flg_insure_request: true
  })
}

const setTypeInsurancePurpose = (data, cartDetailType) => {
  let type_tax = Number(data.type_tax)
  if (!data.flg_pet_insurance) {
    data.type_insurance_purpose = 1
    return
  }
  if (type_tax != 1) {
    data.type_insurance_purpose = 1
    return
  }
}

async function checkedSoloPetInsurance(v, cartDetail, cartDetailType, pet) {
  let setTypeInsurancePurposeVal = v ? 5 : 1

  if (getInsurancePlanForPet(pet.id_pet) && v && getCart.value.id_pet_insurance) {
    await addInsurance(getInsurancePlanForPet(pet.id_pet).id_pet_insurance)
    setTypeInsurancePurpose(cartDetail, cartDetailType)
    setTypeInsurancePurposeVal = cartDetail.type_insurance_purpose
  }


  await cartDetailStore
    .updateCartDetail(
      cartDetail.id_cart_detail,
      {
        flg_pet_insurance: v,
        type_insurance_purpose: setTypeInsurancePurposeVal
      },
      true
    )
    .then(async (response) => {
      cartStore.syncUpdatedCartDetail(response.data.data)
      emits('updBillingAmount')
    })
}


</script>
<template>
  <div>
    <div class="row items-center full-width">
      <div class="col-4 text-left" @click="openCartDetailModal(cartDetail.id_cart_detail, pet)">
        <div class="title2 bold">
          <span v-if="cartDetail.id_prescription_detail">
            [合剤]
          </span>
          {{ cartDetail.name_cart_item_display }}
        </div>
      </div>
      <div class="col-2 text-center" @click="openCartDetailModal(cartDetail.id_cart_detail, pet)">
        <span class="body2 regular">
          ¥{{ formatNumber(cartDetail?.group_detail?.unit_sales) }}
        </span>
        <span class="caption2"> x </span> 1
        <div>
          ¥ <span class="title1 bold"> {{ formatNumber(cartDetail?.group_detail?.unit_sales) }} </span>
        </div>
      </div>
      <div v-if="cartDetail.type_tax == 1" class="col-2">
        <MtFormCheckBox
          v-model:checked="parentFlgInsurance"
          :disable="UiDisable"
          label="保険適用"
          @update:checked="(newVal) =>handleParentCheckbox(newVal, pet, cartDetail, 'RQ_SD', false)" />
      </div>
      <div class="col-2 justify-center flex">
        <q-btn
          class="text-grey-900"
          label="明細の追加"
          outline
          size="sm"
          unelevated
          @click.stop="addMore($event, cartDetail, pet)"
        ></q-btn>
      </div>
      <div v-if="sortMode" class="col">
        <div class="flex justify-end">
          <q-btn
            v-if="sortMode"
            :disable="UiDisable"
            class="cursor-pointer"
            flat
            icon="expand_less"
            round
            size="10px"
            @click.stop="individualRowMove(cartDetailList, cartIndex, 'UP')"
          />
          <q-btn
            v-if="sortMode"
            :disable="UiDisable"
            class="cursor-pointer"
            flat
            icon="keyboard_arrow_down"
            round
            size="10px"
            @click.stop="individualRowMove(cartDetailList, cartIndex,'DOWN')"
          />
        </div>
      </div>
    </div>
    <div class="row">
      <div
        v-for="(prescriptionDetailGroup, cartIndexP) in getCart.cart_details.filter((nCd) =>  cartDetail.group_detail.id_cart_detail_list.includes(nCd.id_cart_detail))"
        class="caption1 regular q-mt-sm  full-width"
        @click="openCartDetailModal(prescriptionDetailGroup.id_cart_detail, pet)"
      >
        <div v-if="prescriptionDetailGroup.id_service_detail || prescriptionDetailGroup.id_inject_detail" class="row"
             @click="">
          <div class="caption1 q-mb-sm col-6">
            <span class="list">{{ cartIndexP + 1 }} -</span> {{ prescriptionDetailGroup.name_cart_item_display }}
          </div>
          <MtFormCheckBox
            v-if="prescriptionDetailGroup.type_tax == 1"
            v-model:checked="prescriptionDetailGroup.flg_pet_insurance"
            :disable="UiDisable"
            label="保険適用"
            @update:checked="checkedSoloPetInsurance(prescriptionDetailGroup.flg_pet_insurance, prescriptionDetailGroup,'RQ_PD', pet)"
          />
        </div>
        <div v-if="prescriptionDetailGroup.id_prescription_detail_assort" class="row" @click="">
          <div class="caption1 q-mb-sm col-6">
            <span class="list">{{ cartIndexP + 1 }} -</span> {{ prescriptionDetailGroup.name_cart_item_display }}
          </div>
          <MtFormCheckBox
            v-if="prescriptionDetailGroup.type_tax == 1"
            v-model:checked="prescriptionDetailGroup.flg_pet_insurance"
            :disable="UiDisable"
            label="保険適用"
            @update:checked="checkedSoloPetInsurance(prescriptionDetailGroup.flg_pet_insurance, prescriptionDetailGroup,'RQ_PD', pet)"
          />
        </div>
        <div
          v-if="prescriptionDetailGroup.id_prescription_detail && prescriptionDetailGroup.id_prescription_detail.type_detail == 1"
          class="q-px-md">
          <span v-if="prescriptionDetailGroup.id_prescription_detail.name_medicine_format == '錠'" class="q-mr-md">
            1回分：{{ getFractionFromValDosage(prescriptionDetailGroup?.prescriptionAssort) }}
          </span>
          <span v-else
                class="q-mr-md">1回分：{{ roundZeroAfterPoint(prescriptionDetailGroup?.prescriptionAssort.val_dosage_decided, 2)
            }}</span>
          <span>{{ useDoseStore().getAllDoses.find((dos) => dos.value == prescriptionDetailGroup.id_prescription_detail.id_dosage_frequency)?.label
            }}</span>
          <div class="caption1 regular q-my-sm flex items-center">
            <span v-if="prescriptionDetailGroup.id_prescription_detail.total_days_dose">
              総服用日数：
              {{ formatDecimalNumber(prescriptionDetailGroup.id_prescription_detail.total_days_dose) }}日間
            </span>
            <span v-if="prescriptionDetailGroup.id_prescription_detail.total_amount_dose" class="q-px-md">
              総服用回数：{{ formatDecimalNumber(prescriptionDetailGroup.id_prescription_detail.total_amount_dose) }}回
            </span>
          </div>
          <div class="caption1 regular q-my-sm flex items-center">                              
            <span v-if="prescriptionDetailGroup.id_prescription_detail.name_medicine_format == '錠'"
                  class="q-mr-md">
              服用総数：
              {{ parseInt(customRound(Number(getCalculatedTotalDosage(prescriptionDetailGroup.id_prescription_detail)) * Number(prescriptionDetailGroup.prescriptionAssort.val_dosage_decided))) > 0 ?
              `${parseInt(customRound(Number(getCalculatedTotalDosage(prescriptionDetailGroup.id_prescription_detail)) * Number(prescriptionDetailGroup.prescriptionAssort.val_dosage_decided)))} ` : ''
              }} 
              {{ getFractionForWhole(prescriptionDetailGroup.id_prescription_detail, prescriptionDetailGroup.prescriptionAssort)
              }} 錠
            </span>
            <span v-else class="q-mr-md">
              服用総数：{{ roundZeroAfterPoint(customRound(prescriptionDetailGroup.prescriptionAssort.val_dosage_decided * getCalculatedTotalDosage(prescriptionDetailGroup.id_prescription_detail)))
              }}
            </span>
            <span class="q-mr-md">
              会計数量：{{ roundZeroAfterPoint(prescriptionDetailGroup.quantity) }} 
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>