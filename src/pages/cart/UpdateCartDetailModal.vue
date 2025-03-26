<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormDecimalNumber from '@/components/form/MtFormDecimalNumber.vue'
import MtSearchItemService from '@/components/MtSearchItemService.vue'
import mtUtils from '@/utils/mtUtils'
import { blank, calculateDays, checkDateRange, getDateToday, isBitSet } from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import aahValidations from '@/utils/aahValidations'
import useCartStore from '@/stores/carts'
import useCartDetailStore from '@/stores/cart-details'
import useCustomerStore from '@/stores/customers'
import useItemStore from '@/stores/items'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useTaxStore from '@/stores/taxes'
import usePetStore from '@/stores/pets'
import { storeToRefs } from 'pinia'
import { typeTax } from '@/utils/enum'
import { numberFormat } from '@/utils/helper'
import useCommonStore from '@/stores/common'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useClaimStore from '@/stores/claim'
import { Platform } from 'quasar'

const ReselectDiseaseInsurerByCD = defineAsyncComponent(
  () => import('@/pages/cart/ReselectDiseaseInsurerByCD.vue')
)

const customerStore = useCustomerStore()
const cartStore = useCartStore()
const cartDetailStore = useCartDetailStore()
const itemStore = useItemStore()
const itemUnitStore = useItemServiceUnitStore()
const taxStore = useTaxStore()
const petStore = usePetStore()
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getItem, getAllItems } = storeToRefs(itemStore)
const { getItemServiceUnits, getItemServiceUnit } = storeToRefs(itemUnitStore)
const { getTaxes } = storeToRefs(taxStore)

const emits = defineEmits(['close'])
const props = defineProps({
  data: Object,
  cartDetail: Object,
  allData: Array,
  disable: {
    type: Boolean,
    default: false
  }
})

const cartData = ref({})
const cartDetailData = ref({})
const data = ref({
  date_cart: null,
  date_order_start: getDateToday(),
  date_order_end: getDateToday(),
  id_item_service: '',
  name_cart_item_display: '',
  memo_cart_detail: '',
  flg_discount: false,
  flg_pet_insurance: false,
  flg_refund: false,
  flg_merged: false,
  date_refund: null,
  memo_refund: '',
  id_item_service_unit: '',
  unit_sales: '',
  quantity: '1',
  id_unit: '',
  amount_sales: '',
  unit_price: null,
  sales_ratio: 100,
  amount_price: '',
  type_tax: 1,
  vat08_amount_sales: null,
  vat10_amount_sales: null,
  tax_exempt_amount_sales: null,

  customer_id: null,
  customer_name: '',
  customer_address: '',
  customer_phone: '',
  id_pet: '',
  name_pet: '',
  type_unit: '',
  tax_rate: null,
  memo_insurance: '',
  flg_negative_detail: false,
  id_employee_negative: '',
  id_employee_sales: '',
  flg_return: false,
  date_request_goal: getDateToday(),
  reason_for_return: '',
  type_cart_detail: 1,
  type_source_cart: 20
  // id_prescription_detail_assort: '',
  // cart_detail_assorts: [] as CartDetailAssort[]
})
const isEdit = ref(false)
const loading = ref(false)
const cartDetailType = ref({})
const isFlgDiscountDisabled = ref(true)
const isFlgPetInsuranceDisabled = ref(true)

const blankField = (row) => (data.value = blank(data.value, row))

const petList: any = ref([])
const petListDefault: any = reactive([])
const itemServiceUnitOptions: any = ref([])
const itemServiceUnitDefaultOptions: any = reactive([])
const showLabelRatioWarning = ref<boolean>()

const defaultEmployee = JSON.parse(
  localStorage.getItem('id_employee')
) as string

const createFormattedValue = (sourceRef, field) => {
  return computed({
    get() {
      const value = sourceRef.value[field]
      // Remove minus sign for display if present
      return value.toString().startsWith('-')
        ? value.toString().replace('-', '')
        : value.toString()
    },
    set(newValue) {
      // Preserve the negative sign if it was negative before
      const wasNegative = sourceRef.value[field].toString().startsWith('-')
      sourceRef.value[field] = wasNegative ? `-${newValue}` : newValue
    }
  })
}

const formattedQuantityValue = ref(createFormattedValue(data, 'quantity'))
const formattedAmountSalesValue = ref(
  createFormattedValue(data, 'amount_sales')
)
const formattedAmountPriceValue = ref(
  createFormattedValue(data, 'amount_price')
)

const UiDisable = computed(() => {
  if (cartStore.getFlgAllowCartUpdate) {
    return false
  }
  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

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

async function checkInsuranceClaimStatus() {
  if (
    useCartStore().getCart.flg_insure_request &&
    useCartStore().getCart.id_pet_insurance
  ) {
    const response: any = await useClaimStore()?.fetchClaimByCart(
      props.data.id_cart
    )

    if (response && response.length === 0) {
      await mtUtils.autoCloseAlert('Error-INS01：保険の承認番号が不正です。')
      return
    }

    if (response && response.length > 0) {
      const claim = response[0]
      if (claim.id_claim) {
        if (claim.type_status_application == 11) {
          const confirmation = await mtUtils.confirm(
            '保険請求前の準備が完了しています。\n ' +
              '再請求を行ってください。\n現在の保険請求を削除しますか？',
            '確認',
            'はい'
          )
          if (confirmation) {
            await cartStore.updateCartInsurance(
              useCartStore().getCart.id_cart,
              {
                id_pet_insurance: null,
                flg_insure_request: false
              }
            )
            return false
          }
          return true
        } else if (claim.type_status_application == 20) {
          return true
        }
      }
    }
  }
}

const submit = async () => {
  if (
    (data.value.flg_refund && data.value.sales_ratio < 100) ||
    data.value.sales_ratio > 100
  ) {
    showLabelRatioWarning.value = true
    return
  }
  if (
    useCartStore().getCart.flg_completed &&
    (await checkInsuranceClaimStatus())
  ) {
    await mtUtils.autoCloseAlert(
      '完了済の会計です。\nメニューの「会計修正」から実行してください。'
    )
    return
  }

  if (
    !checkDateRange([
      {
        start_date: data.value.date_order_start,
        end_date: data.value.date_order_end
      }
    ])
  )
    return false
  const pet = petList.value.find((i) => i.value == data.value.id_pet)
  data.value.name_pet = pet.name_pet

  // data.value.name_pet = getCustomer.value?.pets[0].name_pet
  // data.value.quantity = `-${data.value.quantity}`
  // data.value.amount_price = `-${data.value.amount_price}`
  // data.value.amount_sales = `-${data.value.amount_sales}`

  const tempData = [
    ...cartData.value.cart_details.filter(
      (v) => v.id_cart_detail != data.value.id_cart_detail
    ),
    { ...data.value }
  ]
  loading.value = true;
  setCartAndCD(tempData)

  if (isEdit.value) {
    cartDetailStore
      .updateCartDetail(data.value.id_cart_detail, {
        ...data.value,
        ch_disc_rate: cartData.value.ch_disc_rate,
        date_ins_type2: cartData.value.date_ins_type2,
        days_ins_type2: cartData.value.days_ins_type2,
        date_ins_type3_start: cartData.value.date_ins_type3_start,
        date_ins_type3_end: cartData.value.date_ins_type3_end,
        days_ins_type3: cartData.value.days_ins_type3,
        date_ins_type4: cartData.value.date_ins_type4,
        total_ins_type4: cartData.value.total_ins_type4
      })
      .then(() => {
        loading.value = false;
        cartStore.fetchCart(data.value.id_cart)
        closeModal()
      })
  } else {
    cartDetailStore.submitCartDetail(data.value).then(() => {
      loading.value = false
      cartStore.fetchCart(data.value.id_cart);
      closeModal()
    })
  }
  loading.value = false
}

const closeModal = () => {
  emits('close')
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: {
        class: cartStore.getCart.flg_completed ? 'cursor-not-allowed' : null,
        clickable: !cartStore.getCart.flg_completed
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
            cartDetailStore
              .destroyCartDetail(cartDetailData.value?.id_cart_detail)
              .then(async () => {
                await cartStore.updateBillingAmount(
                  cartDetailData.value?.id_cart,
                  {}
                )
                await cartStore.fetchCart(data.value.id_cart)
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const setOptionsForPetList = () => {
  petList.value.length = 0
  petListDefault.length = 0
  if (getCustomer.value?.pets?.length > 0) {
    petListDefault.push(...getCustomer.value?.pets)
    petList.value = [...petListDefault]
  }

  // If there is only one pet, set it as the default
  if (getCustomer.value?.pets?.length === 1) {
    data.value.id_pet = getCustomer.value?.pets[0].id_pet
    customerStore.selectPet(data.value.id_pet)
  }
}

const setOptionsForItemService = () => {
  if (!data.value.id_item_service) {
    itemStore.selectItem(null)
  }
  setOptionsForItemServiceUnit()
}

const setOptionsForItemServiceUnit = async () => {
  itemUnitStore.selectItemServiceUnit(null)
  itemUnitStore.resetItemServiceUnits()

  itemServiceUnitOptions.value.length = 0
  itemServiceUnitDefaultOptions.length = 0
  if (data.value.flg_merged) {
    // const isu_ids = data.value.cart_detail_assorts
    //   .map((cartDetailAssort) => cartDetailAssort.id_item_service_unit)
    //   .join(',')
    // TODO : need to check this again
    await itemUnitStore.fetchItemServiceUnits({
      id_item_service_units: data.value.id_item_service
    })
  } else if (data.value.id_item_service) {
    await itemUnitStore.fetchItemServiceUnits({
      id_item_service: data.value.id_item_service
    })
  }
  getItemServiceUnits.value.forEach((itemServiceUnit: any) => {
    itemServiceUnitDefaultOptions.push({
      value: itemServiceUnit.id_item_service_unit,
      label: itemServiceUnit.name_service_item_unit
    })
  })

  itemServiceUnitOptions.value = [...itemServiceUnitDefaultOptions]
  //
  // // Auto-select first available option, Auto select only for create case not edit case
  if (itemServiceUnitOptions.value.length > 0) {
    if (!data.value.id_cart_detail && !isEdit.value) {
      data.value.id_item_service_unit = itemServiceUnitOptions.value[0].value
      initItemServiceUnit(data.value.id_item_service_unit)
    }
  }
}

const handleTypeTaxChange = () => {
  updateTaxFields()
  syncFlgPetInsurance(data.value.id_pet)
  setTypeInsurancePurpose()
}

const updateTaxFields = () => {
  let typeTax = Number(data.value.type_tax)
  switch (typeTax) {
    case 1:
      data.value.tax_rate = 0.1
      data.value.vat08_amount_sales = null
      data.value.vat10_amount_sales = data.value.amount_sales
      data.value.tax_exempt_amount_sales = null
      break
    case 2:
      data.value.tax_rate = 0.08
      data.value.vat08_amount_sales = data.value.amount_sales
      data.value.vat10_amount_sales = null
      data.value.tax_exempt_amount_sales = null
      break
    case 3:
      data.value.tax_rate = 0
      data.value.vat08_amount_sales = null
      data.value.vat10_amount_sales = null
      data.value.tax_exempt_amount_sales = data.value.amount_sales
      break
  }
}

const initItemService = async (value: any) => {
  data.value.name_cart_item_display = ''
  // Update all cart_detail_assorts items
  data.value.id_item_service_unit = null
  initItemServiceUnit(null)
  // data.value.cart_detail_assorts.forEach((item, key) => {
  //   item.id_item_service_unit = null
  //   initItemServiceUnit(null, key)
  // })

  if (value) {
    data.value.id_item_service = value.id_item_service
    itemStore.selectItem(data.value.id_item_service)
    if (data.value.name_cart_item_display == '')
      data.value.name_cart_item_display = value.name_item_service
    data.value.type_tax = value.type_tax
    setOptionsForItemServiceUnit()
    // when type_tax changes, update the flg_pet_insurance and type_insurance_purpose fields
    syncFlgPetInsurance(data.value.id_pet)
    setTypeInsurancePurpose()
  } else {
    itemStore.selectItem(null)
  }
  updateDiscountFlags()
}

const initItemServiceUnit = async (value: any) => {
  if (value) {
    await itemUnitStore.fetchItemServiceUnit(value)
  } else {
    itemUnitStore.selectItemServiceUnit(null)
  }


  const today = new Date()
  const price = getItemServiceUnit.value?.price_list.find((p) =>
    new Date(p.date_start) <= today && today <= new Date(p.date_end))

  data.value.unit_sales = 0
  data.value.unit_price = 0
  
  if (price) {
    data.value.unit_sales = (
      Math.round(Number(price.price)) *
      ((data.value.sales_ratio ?? 100) / 100)
    ).toFixed(5)

    if (getItemServiceUnit.value?.flg_tax_included) {

      if (getItemServiceUnit.value?.type_tax == 1) {
        data.value.unit_sales = (
          Math.round(Number(price.price) / 1.1) *
          ((data.value.sales_ratio ?? 100) / 100)
        ).toFixed(5)
      }

      if (getItemServiceUnit.value?.type_tax == 2) {
        data.value.unit_sales = (
          Math.round(Number(price.price) / 1.08) *
          ((data.value.sales_ratio ?? 100) / 100)
        ).toFixed(5)
      }

    }
    data.value.unit_price = data.value.unit_sales
  }
  
  data.value.id_unit = getItemServiceUnit.value?.unit?.id_unit

  // Update amount_sales and amount_price for the specific cart item
  data.value.amount_sales =
    (data.value.unit_sales ?? 0) * Number(data.value.quantity)
  data.value.amount_price =
    (data.value.unit_price ?? 0) * Number(data.value.quantity)

}

/**
 * This function is used in two cases:
 * 1. When change the pet from the pulldown.
 * 2. When there is a change in type_tax.
 */
const syncFlgPetInsurance = async (value: any) => {
  if (value) {
    if (getPet.value?.id_pet != value) {
      await petStore.fetchPetByCustomer(value, getCustomer.value?.id_customer)
    }
    if (
      getPet.value &&
      getPet.value.flg_insurance_plan &&
      getPet.value.pet_insurance.length > 0 &&
      data.value.type_tax == 1 &&
      isBitSet(
        cartDetailData.value.type_insurer,
        cartData?.value.pet_insurance?.code_insurer
      )
    ) {
      isFlgPetInsuranceDisabled.value = false
    } else {
      isFlgPetInsuranceDisabled.value = true
      data.value.flg_pet_insurance = false
    }
  } else {
    petStore.selectPet(null)
    isFlgPetInsuranceDisabled.value = true
    data.value.flg_pet_insurance = false
  }
}

/**
 * This function is to initialize flg_pet_insurance on page load
 */
const initializeFlgPetInsurance = () => {
  // flg_pet_insurance is set to false if there are no pet insurance plans and type_tax is set to 1
  if (
    cartDetailData.value &&
    cartDetailData.value?.id_pet &&
    cartDetailData.value?.id_pet.flg_insurance_plan &&
    cartDetailData.value?.id_pet.pet_insurance.length > 0 &&
    data.value.type_tax == 1 &&
    isBitSet(
      cartDetailData.value.type_insurer,
      cartData?.value.pet_insurance?.code_insurer
    )
  ) {
    isFlgPetInsuranceDisabled.value = false
  } else {
    isFlgPetInsuranceDisabled.value = true
    data.value.flg_pet_insurance = false
  }
}


const updateAssortAmounts = () => {
  // const cartItem = data.value.cart_detail_assorts[index]
  data.value.amount_sales = (
    (data.value.unit_sales ?? 0) * Number(data.value.quantity)
  ).toFixed(5)
  data.value.amount_price = (
    (data.value.unit_price ?? 0) * Number(data.value.quantity)
  ).toFixed(5)
}

const handleFlgDiscount = (checked) => {
  if (!checked) {
    // Reset sales ratio to 100% if discount is unchecked
    data.value.sales_ratio = 100
    handleSalesRatioChange()
  } else {
    let discount = 0
    let petDiscount = null

    // Check if pet discount exists and is greater than 0
    if (
      getPet.value &&
      getPet.value?.type_disc_rate != null &&
      getPet.value.type_disc_rate > 0
    ) {
      petDiscount = getPet.value?.type_disc_rate
    }

    // If pet discount exists, use it; otherwise, use customer discount if it exists
    if (petDiscount != null) {
      discount = petDiscount
    } else if (getCustomer.value && getCustomer.value?.type_disc_rate != null) {
      discount = getCustomer.value.type_disc_rate
    }

    // Cap the discount to the item's rate_discount_max if necessary
    if (discount > 0 && getItem.value?.rate_discount_max != null) {
      discount = Math.min(discount, getItem.value.rate_discount_max)
    }

    // Update sales ratio and apply discount
    data.value.sales_ratio = 100 - discount
    handleSalesRatioChange()
  }
}

const handleUnitSaleChange = () => {
  // const cartItem = data.value.cart_detail_assorts[index]
  // First, update amount_sales and amount_price.
  updateAssortAmounts()
  let newSalesRatio = 100

  if (Number(data.value.unit_price) === 0) {
    data.value.unit_price = data.value.unit_sales
  }

  // Calculate the new sales_ratio if unit_price is not zero.
  if (data.value.unit_price === null) {
    data.value.sales_ratio = newSalesRatio
  } else if (data.value.unit_price > 0) {
    newSalesRatio = (
      (data.value.unit_sales / data.value.unit_price) *
      100
    ).toFixed(2) // Calculate the new sales ratio with precision.

    // Update sales_ratio only if the new calculation significantly differs from the current value.
    if (parseFloat(newSalesRatio) !== parseFloat(data.value.sales_ratio)) {
      data.value.sales_ratio = newSalesRatio
    }
  } else {
    // Safely handle cases where unit_price might be 0 to avoid division by zero errors.
    // Ensure to update sales_ratio only if it's not already 0 to prevent unnecessary updates.
    if (data.value.sales_ratio !== 0) {
      data.value.sales_ratio = 0
    }
  }
  // update flg_discount
  if (Number(data.value?.sales_ratio) < 100) {
    data.value.flg_discount = true
  } else {
    data.value.flg_discount = false
  }
}

const handleSalesRatioChange = () => {
  // const cartItem = data.value.cart_detail_assorts[index]
  let newUnitSales = null

  // Calculate the new unit_sales based on the updated sales_ratio.
  if (data.value.unit_price) {
    newUnitSales = Number(
      (data.value.unit_price * ((data.value.sales_ratio ?? 100) / 100)).toFixed(
        9
      )
    )
  }

  // Update unit_sales only if the new calculation significantly differs from the current value.
  // This prevents unnecessary updates and potential infinite loops.

  if (newUnitSales && newUnitSales !== Number(data.value.unit_sales)) {
    data.value.unit_sales = newUnitSales
    // Since unit_sales has changed, update related amounts.
    updateAssortAmounts()
  }

  // update flg_discount
  showLabelRatioWarning.value = false
  if (Number(data.value?.sales_ratio) < 100) {
    data.value.flg_discount = true
  } else {
    data.value.flg_discount = false
  }
}

const dateStartOptions = (date) => {
  if (!data.value.date_order_end) return true

  return date <= data.value.date_order_end
}

const dateEndOptions = (date) => {
  return date >= data.value.date_order_start
}

const handleRefund = (checked) => {
  if (checked) {
    data.value.date_refund = getDateToday()
    data.value.unit_sales = -Math.abs(data.value.unit_sales)
    updateAssortAmounts()
    // data.value.cart_detail_assorts.forEach((assort, index) => {
    //   assort.unit_sales = -Math.abs(assort.unit_sales)
    //   updateAssortAmounts()
    // })
  } else {
    blankField(['memo_refund', 'date_refund'])
    data.value.unit_sales = Math.abs(data.value.unit_sales)
    updateAssortAmounts()
    // data.value.cart_detail_assorts.forEach((assort, index) => {
    //   assort.unit_sales = Math.abs(assort.unit_sales)
    //   updateAssortAmounts()
    // })
  }
}

const detrmineCartDetailType = () => {
  if (data.value.id_service_detail != null) {
    return 'RQ_SD'
  } else if (data.value.id_prescription != null) {
    return 'RQ_PD'
  } else {
    return 'CT'
  }
}

function updateDiscountFlags() {
  // Logic for isFlgDiscountDisabled
  isFlgDiscountDisabled.value =
    !getItem.value || getItem.value?.flg_discount !== true
  // isFlgDiscountDisabled.value =
  //   getCustomer.value?.type_disc_rate === null ||
  //   getCustomer.value?.type_disc_rate === 0 ||
  //   (getItem.value && getItem.value?.flg_discount !== true)

  if (isEdit.value == true) {
    data.value.flg_discount = props?.cartDetail?.flg_discount ?? false
  } else {
    // For other cases, use similar logic as isFlgDiscountDisabled but considering the item's discount flag
    data.value.flg_discount =
      !isFlgDiscountDisabled.value && getItem.value?.flg_discount === true
  }
}

// const isFlgDiscountDisabled = computed(() => {
//   return (
//     getCustomer.value?.id_discount_rate === null ||
//     getCustomer.value?.id_discount_rate === 0 ||
//     (getItem.value && getItem.value?.flg_discount !== true)
//   )
// })

// const flgDiscountComputed = computed({
//   get() {
//     // Combining conditions for a true case
//     const shouldBeTrue =
//       Number(data.value.sales_ratio) < 100 ||
//       (!isEdit.value &&
//         !isFlgDiscountDisabled.value &&
//         getItem.value?.flg_discount === true)

//     // Return the result directly; this covers both the true and false cases implicitly
//     return shouldBeTrue
//   },
//   set(value) {
//     data.value.flg_discount = value
//   }
// })

const setTypeInsurancePurpose = () => {
  let type_tax = Number(data.value.type_tax)
  if (!data.value.flg_pet_insurance) {
    data.value.type_insurance_purpose = 1
    return
  }
  if (type_tax != 1) {
    data.value.type_insurance_purpose = 1
    return
  }
  switch (cartDetailType.value) {
    case 'RQ_SD':
      // Logic for when linked to Service Detail (SD)
      if (cartDetailData.value?.id_service_detail?.flg_surgery) {
        data.value.type_insurance_purpose = 4
        return
      }
      if (cartDetailData.value?.id_service_detail?.flg_pet_custody_control) {
        data.value.type_insurance_purpose = 3
        return
      }
      data.value.type_insurance_purpose = 2
      return

    case 'RQ_PD':
      // Logic for when linked to Prescription Detail (PD)
      data.value.type_insurance_purpose = 2
      return

    case 'CT':
      if (getItem.value?.flg_surgery) {
        data.value.type_insurance_purpose = 4
        return
      } else if (getItem.value?.flg_pet_custody_control) {
        data.value.type_insurance_purpose = 3
        return
      } else if (getItem.value) {
        data.value.type_insurance_purpose = 2
        return
      } else {
        data.value.type_insurance_purpose = 1
        return
      }

    default:
      data.value.type_insurance_purpose = 1
      return
  }
}

const goSwitch = (direction: string) => {
  if (props.allData) {
    const currentIndex = props.allData?.findIndex(
      (item) => item.id_cart_detail === cartDetailData.value?.id_cart_detail
    )
    if (direction === 'next') {
      if (props.allData[currentIndex + 1]) init(props.allData[currentIndex + 1])
    } else if (direction === 'previous') {
      if (props.allData[currentIndex - 1]) init(props.allData[currentIndex - 1])
    }
  }
}

const isTypeTaxEditable = computed(() => {
  return !data.value.id_item_service || data.value.id_item_service === ''
})

// const totalAmountSales = computed(() => {
//   return data.value.cart_detail_assorts.reduce((total, item) => {
//     return total + (parseFloat(item.amount_sales) || 0)
//   }, 0)
// })

// const totalAmountPrice = computed(() => {
//   return data.value.cart_detail_assorts.reduce((total, item) => {
//     return total + (parseFloat(item.amount_price) || 0)
//   }, 0)
// })

const salesRatio = computed(() => {
  // let totalSalesAmount = 0
  // let totalPriceAmount = 0

  // data.value.cart_detail_assorts.forEach((item) => {
  //   totalSalesAmount += parseFloat(item.amount_sales)
  //   totalPriceAmount += parseFloat(item.amount_price)
  // })
  return ((data.value.amount_sales * 100) / data.value.amount_price).toFixed(2)
})

// const salesRatio = computed(() => {
//   if (data.value.flg_discount === false) {
//     return 1.0
//   } else {
//     const totalSales = totalAmountSales.value
//     const totalPrice = totalAmountPrice.value

//     if (totalSales === 0) {
//       return 0 // Avoid division by zero
//     }

//     return totalPrice / totalSales
//   }
// })

const amountDetailDiscounted = computed(() => {
  let amount_detail_discounted = 0
  if (data.value.amount_price)
    amount_detail_discounted = getFormattedData(
      data.value.amount_price - data.value.amount_sales
    )

  if (amount_detail_discounted < 0) {
    data.value.amount_detail_discounted = 0
    return 0
  }

  if (
    !data.value.flg_discount &&
    data.value.amount_price - data.value.amount_sales < 0
  ) {
    return getFormattedData(data.value.amount_sales - data.value.amount_price)
  }

  data.value.amount_detail_discounted = amount_detail_discounted
  return amount_detail_discounted
})

const getFormattedData = (value) => {
  if (!Boolean(value)) return value
  const [integerPart, decimalPart] = value.toString().split('.')
  return numberFormat(
    parseFloat(value).toFixed(
      decimalPart && !decimalPart.startsWith('00') ? 2 : 0
    )
  )
}

const getFormattedData1 = (value) => {
  if (!Boolean(value)) return value

  return numberFormat(parseFloat(value).toFixed(0))
}

watch(
  () => data.value.amount_sales,
  (newValue) => {
    // Perform actions in response to changes in amount_sales
    updateTaxFields()
  }
)

const init = (newData) => {
  const cart = newData ? newData : props.cartDetail

  cartDetailData.value = JSON.parse(JSON.stringify(cart))
  data.value = JSON.parse(JSON.stringify(cart))

  data.value.id_pet = data.value.id_pet?.id_pet ?? null
  if (data.value.id_pet) customerStore.selectPet(data.value.id_pet)
  data.value.id_service_detail =
    data.value.id_service_detail?.id_service_detail ?? null
  data.value.id_prescription_detail =
    data.value.id_prescription_detail?.id_prescription_detail ?? null
  if (data.value.id_item_service)
    itemStore.selectItem(data.value.id_item_service)
  if (isEdit.value && data.value.id_item_service_unit) {
    const itemServiceUnit = getItemServiceUnits.value.find(
      (v) => v.id_item_service_unit === data.value?.id_item_service_unit
    )
    if (itemServiceUnit && itemServiceUnit.flg_minus_count) {
      data.value.unit_sales = -Math.abs(data.value.unit_sales)
    }
  }
}

const popupDieaseInsurer = ref(null)
const openModalToReselectDiseaseInsurer = async () => {
  await mtUtils.smallPopup(ReselectDiseaseInsurerByCD, {
    popupDieaseInsurer,
    cartDetailObj: data.value,
    onClose: () => callbackFromReselectDiseaseInsurerModal()
  })
}

async function callbackFromReselectDiseaseInsurerModal() {
  if (popupDieaseInsurer.value) {
    if (!popupDieaseInsurer.value.isChanged) {
      return
    }

    if (
      useCartStore().getCart?.pet_insurance?.id_cm_disease_insurer_out1 ==
        popupDieaseInsurer.value.id_cm_disease_insurer ||
      useCartStore().getCart?.pet_insurance?.id_cm_disease_insurer_out2 ==
        popupDieaseInsurer.value.id_cm_disease_insurer ||
      useCartStore().getCart?.pet_insurance?.id_cm_disease_insurer_out3 ==
        popupDieaseInsurer.value.id_cm_disease_insurer
    ) {
      await mtUtils.alert(
        'この疾患では保険の申請はできません。\n申請前に疾患を確認し、申請作業を行って下さい。',
        '確認して下さい。'
      )

      data.value.name_ins1 =
        useCommonStore().getCommonDiseaseInsurerOptionList.find(
          (item) =>
            item.id_common == popupDieaseInsurer.value.id_cm_disease_insurer
        ).text1

      data.value.name_ins2 =
        useCommonStore().getCommonDiseaseInsurerOptionList.find(
          (item) =>
            item.id_common == popupDieaseInsurer.value.id_cm_disease_insurer
        ).name_common

      data.value.flg_disease_out = true
      data.value.flg_pet_insurance = false
      data.value.type_insurance_purpose = 1
      return
    }

    data.value.name_ins1 =
      useCommonStore().getCommonDiseaseInsurerOptionList.find(
        (item) =>
          item.id_common == popupDieaseInsurer.value.id_cm_disease_insurer
      ).text1

    data.value.name_ins2 =
      useCommonStore().getCommonDiseaseInsurerOptionList.find(
        (item) =>
          item.id_common == popupDieaseInsurer.value.id_cm_disease_insurer
      ).name_common

    data.value.flg_disease_out = false
  }
}

const selectDefaultEmployee = () => {
  data.value.id_employee_sales = defaultEmployee
}

const maxTwentyCharacters = (val: any) => {
  const maxLength: any = 50
  if (val && val.length > maxLength) {
    return `会計明細名が長い為、非表示部分が発生します（${maxLength}文字まで）`
  }
}

const customerName = ref('')
const customerCode = ref('')

const isIpad = Platform.is.ipad

onMounted(async () => {
  useCommonStore().fetchPreparationCommonList({
    code_common: [6]
  })

  cartData.value = JSON.parse(JSON.stringify(props.data))
  // check for cart detail id

  if (props.cartDetail?.id_cart_detail) {
    // update
    isEdit.value = true
    if (props.disable) {
      customerName.value = getCustomer.value?.name_customer_display
      customerCode.value = getCustomer.value?.code_customer
    }
    init()
  } else {
    isEdit.value = false
    data.value.id_cart = cartData.value.id_cart
    data.value.flg_pet_insurance = !!cartData.value.flg_insure_request

    if (
      useCartStore().getCart &&
      useCartStore().getCart.pets &&
      useCartStore().getCart.pets.length > 0
    ) {
      data.value.id_pet = useCartStore().getCart.pets[0]
      customerStore.selectPet(data.value.id_pet)
    }

    if (
      useCartStore().getCart &&
      useCartStore().getCart.pets &&
      useCartStore().getCart.pets.length === 0
    ) {
      if (
        getCustomer.value &&
        getCustomer.value.pets &&
        getCustomer.value.pets.length > 0
      )
        data.value.id_pet = getCustomer.value.pets[0].id_pet
      customerStore.selectPet(data.value.id_pet)
    }
  }

  initializeFlgPetInsurance()
  cartDetailType.value = detrmineCartDetailType()
  if (getCustomer.value?.id_customer != cartData.value?.id_customer) {
    await customerStore.selectCustomer(cartData.value?.id_customer, true)
  }
  // Check if the tax array is empty
  if (taxStore.getTaxes.length === 0) {
    await taxStore.fetchTaxes()
  }
  setOptionsForPetList()
  setOptionsForItemService()
  updateDiscountFlags()
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none col-auto">
        会計明細<span v-if="data.flg_merged">（複数統合）</span>
      </q-toolbar-title>
      <div class="flex items-center q-ml-lg">
        <div class="body1 regular text-grey-900 q-mr-sm" v-if="!disable">
          {{ cartData.code_customer }}
        </div>
        <div class="body1 regular text-grey-900 q-mr-sm" v-else>
          {{ customerCode }}
        </div>
        <div class="body1 regular text-grey-900 q-mr-sm" v-if="!disable">
          {{ cartData.name_customer + ' 様' }}
        </div>
        <div class="body1 regular text-grey-900 q-mr-sm" v-else>
          {{ customerName + ' 様' }}
        </div>
        <div class="body1 regular text-grey-900 q-mr-sm" v-if="data.flg_merged">
          ※まとめられた明細です
        </div>
      </div>
      <q-space />
      <template v-if="props.allData?.length > 1">
        <q-btn @click="goSwitch('previous')" flat round>
          <q-icon name="navigate_before" />
        </q-btn>
        <q-btn @click="goSwitch('next')" flat round class="q-mx-md">
          <q-icon name="navigate_next" />
        </q-btn>
      </template>
      <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section
      class="q-px-lg content-small-screen"
      :class="{ content: isIpad }"
      style="max-height: 70vh; overflow-y: auto"
    >
      <!-- <div class="row">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFilterSelect
            v-if="isMultipleClinic"
            v-model:options="allClinicList"
            v-model:selecting="data.id_clinic"
            :options-default="allClinicListDefault"
            :rules="[aahValidations.validationRequired]"
            label="病院名"
            required
          />
        </div>
      </div> -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormInputDate
            v-model:date="data.date_order_start"
            label="サービス開始日 *"
            type="date"
            autofocus
            required
            :options="dateStartOptions"
            :rules="[aahValidations.validationRequired]"
            :tabindex="100"
            :readonly="UiDisable"
            :disable="disable"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormInputDate
            v-model:date="data.date_order_end"
            label="サービス終了日"
            type="date"
            :options="dateEndOptions"
            :tabindex="200"
            :readonly="UiDisable"
            :disable="disable"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtPetFilterSelect
            v-model:selecting="data.id_pet"
            :pet-list="petList"
            label="ペット名"
            :readonly="(isEdit && cartDetailType !== 'CT') || UiDisable"
            @update:model-value="syncFlgPetInsurance"
            :tabindex="300"
            :disable="disable"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtSearchItemService
            :applyDefaultClass="false"
            :preSelectedId="data.id_item_service"
            label="登録商品名 "
            :readonly="(isEdit && cartDetailType !== 'CT') || UiDisable"
            @update:selecting-whole="
              (value) => {
                initItemService(value)
              }
            "
            :search-icon="true"
            :tabindex="400"
            :rules="[aahValidations.validationRequired]"
            :disable="disable"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
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
            :readonly="UiDisable"
            :disable="disable"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_cart_detail"
            label="明細：帳票出力メモ"
            tabindex="2"
            autogrow
            :readonly="UiDisable"
            :disable="disable"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md" v-if="!data.flg_refund">
        <div class="col-4">
          <MtInputForm
            v-model="data.name_ins1"
            readonly
            label="診断名（大項目）"
            type="text"
            :disable="disable"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.name_ins2"
            readonly
            label="診断名（小項目）"
            type="text"
            :disable="disable"
          />
        </div>
        <div class="col-4">
          <q-btn
            class="text-blue"
            flat
            label="診断名の変更"
            @click="openModalToReselectDiseaseInsurer"
            :disable="UiDisable || disable"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-lg items-baseline">
        <div class="col-auto q-mr-md" v-if="!data.flg_refund">
          <MtFormCheckBox
            label="割引適用"
            v-model:checked="data.flg_discount"
            @update:checked="handleFlgDiscount"
            :disable="isFlgDiscountDisabled || UiDisable || disable"
          />
        </div>
        <div class="col-auto q-mr-md" v-if="!data.flg_refund">
          <MtFormCheckBox
            label="保険適用"
            v-model:checked="data.flg_pet_insurance"
            :disable="isFlgPetInsuranceDisabled || UiDisable || disable"
            @update:checked="setTypeInsurancePurpose"
          />
        </div>
        <div class="col-auto q-mr-md" v-if="!data.flg_refund">
          <MtFormCheckBox
            label="預り管理"
            v-model:checked="data.flg_pet_custody"
            :disable="isFlgPetInsuranceDisabled || UiDisable || disable"
            @update:checked="setTypeInsurancePurpose"
          />
        </div>
        <div class="col-auto q-mr-md" v-if="cartData.flg_refund">
          <MtFormCheckBox
            label="返金"
            v-model:checked="data.flg_refund"
            :disable="cartData.flg_refund || UiDisable || disable"
            @update:checked="handleRefund"
          />
        </div>
        <div class="col">
          <div v-if="data.flg_refund" class="row q-col-gutter-md">
            <div class="col-lg-4 col-md-4 col-sm-6" v-if="!data.flg_refund">
              <MtFormInputDate
                v-model:date="data.date_refund"
                label="返金日時"
                type="date"
                :disable="UiDisable || disable"
              />
            </div>
            <div class="col-lg-8 col-md-8 col-sm-12">
              <MtInputForm
                placeholder="返品理由"
                type="text"
                autogrow
                v-model="data.memo_refund"
                :disable="UiDisable || disable"
              />
            </div>
          </div>
        </div>
        <div class="col-auto q-mr-md">
          <MtFormCheckBox
            v-if="data.flg_merged"
            label="複数明細の統合"
            v-model:checked="data.flg_merged"
            :disable="UiDisable || disable"
          />
        </div>
        <div class="col-auto" style="min-width: 200px">
          <InputEmployeeOptGroup
            v-model:selected="data.id_employee_sales"
            department-selected=""
            show-select-default-employee
            @update:select-default-employee="selectDefaultEmployee"
            :disable="disable"
          />
        </div>
      </div>
      <hr class="light" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-lg-8 col-md-7 col-sm-12">
          <div class="row q-col-gutter-md justify-between">
            <div class="col-auto q-mr-md">
              <h4 class="text-white bg-grey-600 title4 regular">明細項目</h4>
              <!-- <div
                v-for="(assortItem, index) in data.cart_detail_assorts"
                :key="index"
                class="outlined q-pa-xs q-my-sm relative-position"
              > -->
            </div>
            <div class="col-auto q-mr-md">
              <q-btn
                class="q-ml-md"
                outline
                size="sm"
                unelevated
                @click="
                  () => {
                    data.unit_price = data.amount_sales / data.quantity ?? 1
                    data.sales_ratio = 100
                    data.amount_price = data.amount_sales
                    handleSalesRatioChange()
                  }
                "
                :disable="disable"
              >
                <q-icon name="refresh" class="q-mr-xs" />
                掛率を100へ調整
              </q-btn>
              <p
                v-if="showLabelRatioWarning"
                class="text-negative q-ma-none caption2"
              >
                掛率を100に修正してください
              </p>
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-xs">
            <div class="col-lg-8 col-md-8 col-sm-12">
              <MtFilterSelect
                :options-default="itemServiceUnitDefaultOptions"
                v-model:options="itemServiceUnitOptions"
                v-model:selecting="data.id_item_service_unit"
                label="商品名"
                :iconPrepend="'search'"
                @update:selecting="
                  (newValue) => initItemServiceUnit(newValue)
                "
                :rules="
                  data.id_item_service !== null && data.id_item_service !== ''
                    ? [aahValidations.validationRequired]
                    : null
                "
                :readonly="
                  data.id_item_service === null ||
                  data.id_item_service === '' ||
                  (isEdit && cartDetailType !== 'CT')
                "
                :tabindex="500"
                :disable="disable"
              />
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
                @change="handleUnitSaleChange()"
                :readonly="UiDisable"
                :disable="disable"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                v-if="data.flg_refund"
                label="数量 *"
                v-model="formattedQuantityValue"
                oninput="validity.valid||(value='');"
                input-class="price-title"
                required
                @change="updateAssortAmounts()"
                :rules="[
                  aahValidations.validationRequired,
                  ...(!data.flg_refund
                    ? [aahValidations.validationPositiveNumber]
                    : [])
                ]"
                :tabindex="700"
                :readonly="UiDisable"
                :disable="disable"
              />
              <MtFormDecimalNumber
                v-if="!data.flg_refund"
                label="数量 *"
                v-model="data.quantity"
                oninput="validity.valid||(value='');"
                input-class="price-title"
                required
                @change="updateAssortAmounts()"
                :rules="[
                  aahValidations.validationRequired,
                  ...(!data.flg_refund
                    ? [aahValidations.validationPositiveNumber]
                    : [])
                ]"
                :tabindex="700"
                :readonly="UiDisable"
                :disable="disable"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                v-if="data.flg_refund"
                label="販売合計額"
                v-model="formattedAmountSalesValue"
                :rules="[aahValidations.validationRequired]"
                readonly
                required
                filled
                input-class="price-title"
                :tabindex="800"
                :precision="0"
                :disable="disable"
              />
              <MtFormDecimalNumber
                v-if="!data.flg_refund"
                label="販売合計額"
                v-model="data.amount_sales"
                :rules="[aahValidations.validationRequired]"
                readonly
                required
                filled
                input-class="price-title"
                :tabindex="800"
                :precision="0"
                :disable="disable"
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
                :disable="disable"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                label="掛率 *"
                min="0"
                oninput="validity.valid||(value='');"
                v-model="data.sales_ratio"
                @change="handleSalesRatioChange()"
                filled
                input-class="price-title"
                appendIcon="percentage"
                :readonly="data.amount_price == null"
                :tabindex="1000"
                :disable="disable"
              />
            </div>
            <div class="col-lg-4 col-md-4 col-sm-6">
              <MtFormDecimalNumber
                v-if="data.flg_refund"
                label="標準合計金額"
                v-model="formattedAmountPriceValue"
                readonly
                filled
                input-class="price-title"
                :precision="0"
                :disable="disable"
              />
              <MtFormDecimalNumber
                v-if="!data.flg_refund"
                label="標準合計金額"
                v-model="data.amount_price"
                readonly
                filled
                input-class="price-title"
                :precision="0"
                :disable="disable"
              />
            </div>
          </div>
          <!-- </div> -->
          <!-- <div>
            <q-btn
              flat
              size="10px"
              icon="add"
              @click="addCartDetailAssort"
              v-if="
                cartDetailType === 'RQ_PD' ||
                data.cart_detail_assorts.length === 0
              "
              padding="6px 46px"
              class="bg-grey-200"
            />
          </div> -->
        </div>
        <div class="col-lg-4 col-md-5 col-sm-12">
          <div class="round-section-free-bg bg-accent-200 q-pa-md">
            <div class="q-mb-md">
              <label class="caption2 regular text-grey-700"></label>
              <MtFormPullDown
                type="selection"
                outlined
                class="bg-grey-100"
                label="適用税率"
                v-model:selected="data.type_tax"
                :options="typeTax"
                :disable="!isTypeTaxEditable || disable"
                @update:model-value="handleTypeTaxChange"
              />
            </div>
            <div
              class="row items-center q-gutter-md"
              v-if="data.vat10_amount_sales"
            >
              <label class="caption2 regular text-grey-700"
                >合計金額 (税率 10%)</label
              >
              <q-space />
              <!--              <div v-if="data?.group_detail?.flg_tax_included">-->
              <!--                <span class="text-red q-mr-sm">-->
              <!--                  税込-->
              <!--                </span>-->
              <!--                <span class="large-title bold text-grey-900">-->
              <!--                  ¥ {{ getFormattedData1(data.vat10_amount_sales * 1.1) }}-->
              <!--                </span>-->
              <!--              </div>-->
              <div>
                <span
                  class="large-title bold"
                  :class="data.flg_refund ? 'text-negative' : 'text-black'"
                >
                  ¥ {{ getFormattedData1(data.vat10_amount_sales) }}
                </span>
              </div>
            </div>
            <div
              class="row items-center q-gutter-md"
              v-if="data.vat08_amount_sales"
            >
              <label class="caption2 regular text-grey-700"
                >合計金額 (税率 8%)</label
              >
              <q-space />
              <!--              <div v-if="data.group_detail?.flg_tax_included">-->
              <!--                <span class="text-red q-mr-sm">-->
              <!--                  税込-->
              <!--                </span>-->
              <!--                <span class="large-title bold text-grey-900">-->
              <!--                  ¥ {{ getFormattedData1(data.vat08_amount_sales * 1.08) }}-->
              <!--                </span>-->
              <!--              </div>-->
              <div>
                <span class="large-title bold text-grey-900">
                  ¥ {{ getFormattedData1(data.vat08_amount_sales) }}
                </span>
              </div>
            </div>
            <div
              class="row items-center q-gutter-md"
              v-if="data.tax_exempt_amount_sales"
            >
              <label class="caption2 regular text-grey-700"
                >合計金額 (非課税)</label
              >
              <q-space />
              <span
                v-if="data.group_detail?.flg_tax_included"
                class="text-red q-mr-sm"
              >
                税込
              </span>
              <span class="large-title bold text-grey-900">
                ¥ {{ getFormattedData1(data.tax_exempt_amount_sales) }}
              </span>
            </div>
            <div
              v-if="amountDetailDiscounted !== 0 && !data.flg_refund"
              class="row items-center q-gutter-md q-mt-sm"
            >
              <label class="caption2 regular text-grey-700">調整額</label>
              <q-space />
              <span class="title1 regular text-danger">
                ¥ {{ amountDetailDiscounted }}
              </span>
            </div>
            <div
              v-if="amountDetailDiscounted !== 0"
              class="row items-center q-gutter-md q-my-xs"
            >
              <q-space />
              <!-- <span v-if="data.cart_detail_assorts && data.cart_detail_assorts.length > 1"
                    class="caption1 text-grey-700">明細掛率</span>
              <span v-if="data.cart_detail_assorts && data.cart_detail_assorts.length > 1" class="text-grey-900">
                 {{ salesRatio }} % 
              </span> -->
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="row justify-center modal-btn" style="gap: 16px">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          :disable="UiDisable || disable"
          color="primary"
          type="submit"
          :loading="loading"
          unelevated
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style>
.cart-item-title {
  font-size: 25px;
  color: #222;
  font-weight: bold;
  text-align: right;
  padding-right: 10px;
  padding-bottom: 15px !important;
}

.price-title {
  font-size: 18px;
  color: black;
  text-align: right;
}

::v-deep(.q-field--with-bottom) {
  padding-bottom: 0px;
}

@media screen and (max-width: 740px) {
  .content-small-screen {
    max-height: calc(100vh - 300px) !important;
    height: unset !important;
    overflow-y: auto;
  }
}

@media screen and (max-width: 640px) {
  .content-small-screen {
    max-height: calc(100vh - 300px) !important;
    height: unset !important;
    overflow-y: auto;
  }
}
</style>
