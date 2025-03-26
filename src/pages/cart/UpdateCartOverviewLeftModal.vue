<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

// Synchronous Imports (Components and other utilities)
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { formatDecimalNumber, formatNumber } from '@/utils/helper'
import mtUtils from '@/utils/mtUtils'
import aahValidations from '@/utils/aahValidations'
import selectOptions from '@/utils/selectOptions'
import {
  calculateDays,
  customRound,
  decimalToFraction,
  getFullPetName,
  getPetKanaName,
  isBitSet,
  roundZeroAfterPoint
} from '@/utils/aahUtils'
import { event_bus } from '@/utils/eventBus'
import { typeInsurancePurpose } from '@/utils/enum'

// Stores
import useCartStore from '@/stores/carts'
import useCartDetailStore from '@/stores/cart-details'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '../../stores/common'
import useUtilsStore from '@/stores/Utils'
import usePaymentStore from '@/stores/payment'
import useInsuranceStore from '@/stores/insurances'
import useDoseStore from '@/stores/dose-frequencies'
import CdGroupPocket from '@/pages/cart/CdGroupPocket.vue'

// Asynchronous Imports (Pages)
const UpdateCartDetailModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartDetailModal.vue')
)
const UpdatePetInsuranceInfoModal = defineAsyncComponent(
  () => import('@/pages/insurance/UpdatePetInsuranceInfoModal.vue')
)
const ViewPetDetailModal = defineAsyncComponent(
  () => import('../master/customerPet/ViewPetDetailModal.vue')
)
const ViewGroupDetailModel = defineAsyncComponent(
  () => import('@/pages/cart/ViewGroupDetailModel.vue')
)
const CartDetailMergeModal = defineAsyncComponent(
  () => import('@/pages/cart/CartDetailMergeModal.vue')
)
const UpdatePaymentModal = defineAsyncComponent(
  () => import('@/pages/payment/UpdatePaymentModal.vue')
)
const CDInstallmentModal = defineAsyncComponent(
  () => import('@/pages/cart/CDInstallmentModal.vue')
)
const BlueTypeInsurancePurposeModal = defineAsyncComponent(
  () => import('@/pages/cart/BlueTypeInsurancePurposeModal.vue')
)
const UpdDiseaseInsurerBlukByCD = defineAsyncComponent(
  () => import('@/pages/cart/UpdDiseaseInsurerBlukByCD.vue')
)
const CartDiscountModal = defineAsyncComponent(
  () => import('./CartDiscountModal.vue')
)
const RefundConfirmationModal = defineAsyncComponent(
  () => import('./RefundConfirmationModal.vue')
)

const emits = defineEmits([
  'close',
  'updateSelectedCart',
  'openAddCartDetailModal',
  'mergeCartDetail'
])
const cartStore = useCartStore()
const paymentStore = usePaymentStore()
const cartDetailStore = useCartDetailStore()
const customerStore = useCustomerStore()
const insuranceStore = useInsuranceStore()
const { getInsuranceListByPet } = storeToRefs(insuranceStore)

const { getCart } = storeToRefs(cartStore)

const props = defineProps({
  groupedCartDetails: {},
  cartData: {},
  scrollAreaHeight: Object,
  selectedCart: [],
  isSelectedCart: Boolean,
  headerEnabled: Boolean,
  toggleMerge: Boolean,
  fromList: Boolean
})

const loading = ref(false)

const UiDisable = computed(() => {
  if (cartStore.getFlgAllowCartUpdate) {
    return false
  }
  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

const flgInsNormal = ref(false)
const flgInsHospitalization = ref(false)
const flgInsSurgery = ref(false)

const refundFlg = computed(() => {
  if (cartStore.getFlgRefundCart) {
    return false
  }
  return !!(cartStore.getCart && cartStore.getCart.flg_completed)
})

const computedDecimal = computed(() => {
  let isDecimal = false
  if (
    cartStore.getCart &&
    cartStore.getCart.cart_details &&
    cartStore.getCart.cart_details.length > 0
  ) {
    cartStore.getCart.cart_details.forEach((cd: any) => {
      if (cd && cd.amount_sales) {
        if (Number(cd.amount_sales) - parseInt(Number(cd.amount_sales)) > 0) {
          isDecimal = true
        }
      }
    })
  }
  return isDecimal
})

async function removeDecimalFromCD(data) {
  if (getCart.value.id_cart && !getCart.value.flg_completed) {
    const confirmation = await mtUtils.confirm(
      '特定の会計明細で「数量」に会計処理を行えない端数が生じています。\n内容を確認し、数量を変更するか、金額保持したまま数量の調整を行ってください。',
      '対応が必要です',
      'キャンセル',
      '数量を自動調整'
    )

    if (confirmation != 'edit') return

    let cartBillingData = getCartBillingData()

    await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `/cart_detail/${data.id_cart_detail}`,
      { remove_decimal: true }
    )

    await mtUtils.promiseAllWithLoader([
      cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
    ])
  }

  event_bus.emit('callUpdateBillingAPI', false)
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
  event_bus.emit('callUpdateBillingAPI', true)
}

const sortMode = ref(false)

const updateSelectedCart = (id_cart_detail) => {
  if (Object.values(props.selectedCart).every((value) => value === false)) {
    useUtilsStore()?.setValidationParam(null, null)
  } else {
    const selectedCartDetail = props.cartData?.cart_details?.find(
      (cd) => cd.id_cart_detail === id_cart_detail
    )
    if (selectedCartDetail) {
      useUtilsStore()?.setValidationParam(
        selectedCartDetail.tax_rate,
        selectedCartDetail.type_tax
      )

      if (selectedCartDetail.flg_group_title) {
        useUtilsStore()?.setValidationParam('Group', 'Group', id_cart_detail)
      }
    }
  }
  emits('updateSelectedCart', props.selectedCart)
}

const checkIfCartDetailDisabled = (id_cart_detail) => {
  if (!refundFlg.value && UiDisable.value) {
    return false
  }

  if (
    useUtilsStore()?.getValidationParam &&
    useUtilsStore()?.getValidationParam?.tax_rate === null &&
    useUtilsStore()?.getValidationParam?.type_tax === null
  ) {
    return false
  } else {
    const selectedCartDetail = props.cartData?.cart_details?.find(
      (cd) => cd.id_cart_detail === id_cart_detail
    )
    if (selectedCartDetail) {
      if (selectedCartDetail.flg_group_title) {
        if (
          selectedCartDetail.flg_group_title &&
          useUtilsStore()?.getValidationParam?.id_cart_detail == id_cart_detail
        )
          return false

        if (
          'Group' === useUtilsStore()?.getValidationParam?.type_tax &&
          'Group' === useUtilsStore()?.getValidationParam?.tax_rate
        ) {
          return true
        }
      }

      if (
        useUtilsStore()?.getValidationParam &&
        selectedCartDetail.type_tax ===
          useUtilsStore()?.getValidationParam?.type_tax &&
        selectedCartDetail.tax_rate ===
          useUtilsStore()?.getValidationParam?.tax_rate
      ) {
        return false
      }
    }

    return true
  }
}
const onClickSelectedCart = (id_cart_detail) => {
  if (checkIfCartDetailDisabled(id_cart_detail)) {
    if (
      useCartStore().getCart.cart_details.find(
        (cd) => cd.id_cart_detail === id_cart_detail
      ).flg_group_title
    ) {
      mtUtils.autoCloseAlert('グループ化された明細は統合できません。')
      return
    }

    mtUtils.autoCloseAlert('課税区分が異なる商品は統合できません。')
    return
  }
}

async function syncCartWithRequest() {
  await mtUtils.callApi(selectOptions.reqMethod.POST, `SyncCartWithRequest`, {
    id_cart: getCart.value.id_cart,
    id_request: getCart.value.id_request.id_request
  })

  let cartBillingData = getCartBillingData()

  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
  ])

  event_bus.emit('callUpdateBillingAPI', false)
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
  event_bus.emit('callUpdateBillingAPI', true)
  await mtUtils.alert('RQオーダー項目を反映しました!')
}
async function createRefund() {
  loading.value = true
  const cart_detail_list = Object.keys(props.selectedCart).filter(
    (key) => props.selectedCart[key] === true
  )

  let cartDetailDataList = []
  cart_detail_list.forEach((listId) => {
    let findData = getCart.value?.cart_details.find(
      (detail) => detail.id_cart_detail === listId
    )

    if (findData) {
      cartDetailDataList.push(findData)
    }
  })

  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(RefundConfirmationModal, {
    cartData: props.cartData,
    cartDetailDataList: cartDetailDataList,
    updatedFlg
  })

  if (!updatedFlg.value) {
    loading.value = false
    return
  }

  // after creating refund CD's (here, updatedFg should be true)
  mtUtils.autoCloseAlert('選択した返金の会計レコードを作成しました')
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value.id_cart),
    paymentStore.fetchPaymentByCustomer({
      id_cart: getCart.value.id_cart,
      flg_upfront_ui: true,
      id_customer: getCart.value.id_customer,
      flg_refund_occurred: true,
      flg_refund_conducted: true
    })
  ])
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

async function createTempPayment(row: any) {
  let amount = Number(row.amount_sales).toFixed(2) // Ensure 2 decimal places

  if (Number(row.tax_rate) > 0) {
    amount = (
      Number(row.amount_sales) +
      Number(row.amount_sales) * Number(row.tax_rate)
    ).toFixed(2)
  }
  await mtUtils.mediumPopup(UpdatePaymentModal, {
    cartData: getCart.value,
    flgTempCash: true,
    amountRemaining: amount,
    id_customer: getCart.value?.id_customer
  })
}

const openCartDiscountModal = async () => {
  await mtUtils.smallPopup(CartDiscountModal)
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
    data: props.cartData,
    cartDetail: cartDetailData,
    allData: getCart.value?.cart_details
  })
}

const updateCartAndBilling = async (
  alertMessage,
  formattedData: any = null,
  flag: any = false
) => {
  if (shouldSplitCart()) {
    await handleCartSplitting(formattedData, flag)
  }
  await processCallAPI(false, alertMessage)
}

async function processCallAPI(
  isSpecialCase: any = false,
  alertMessage: any = '請求金額を更新しました'
) {
  if (isSpecialCase) {
    const confirmation = await mtUtils.confirm(
      '明細の端数処理は、全ての割引、値引き、保険の適用の処理が全て終わった後に1度だけ実行してください。\n' +
        '処理を実行しますか？',
      '確認',
      'はい'
    )
    if (!confirmation) return false
  }

  let cartBillingData = getCartBillingData(isSpecialCase)

  if (getCart.value.id_cart && !getCart.value.flg_completed) {
    await mtUtils.promiseAllWithLoader([
      cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
    ])
  }

  event_bus.emit('callUpdateBillingAPI', false)
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
  event_bus.emit('callUpdateBillingAPI', true)
  // data.value = JSON.parse(JSON.stringify(getCart.value))

  Object.keys(props.selectedCart).forEach((id) => {
    delete props.selectedCart[id] // Remove the key from the object
  })

  mtUtils.autoCloseAlert(alertMessage)
}

const calculateBillingAmount = async (
  formattedData: any = null,
  flag: any = false
) => {
  try {
    await updateCartAndBilling('請求金額を更新しました', formattedData, flag)
  } catch (error) {
    console.error(error)
    // Handle error
  }
}

const getCartBillingData = (isSpecialCase: any = false) => {
  return {
    special_case: isSpecialCase,
    ch_disc_rate: getCart.value.ch_disc_rate,
    cart_payment_this_time: getCart.value.cart_payment_this_time,
    type_price_adjustment: getCart.value.type_price_adjustment,
    total_adjustment_intax: getCart.value.total_adjustment_intax
  }
}

const shouldSplitCart = () => {
  const cartDetails = getCart.value?.cart_details // Assuming getCart.value is your cart data

  let insuredPets = new Set()
  let uninsuredPets = new Set()

  for (let detail of cartDetails) {
    const petId = detail.id_pet?.id_pet
    const hasInsurance = detail.flg_pet_insurance
    if (petId) {
      if (hasInsurance) {
        insuredPets.add(petId)
        uninsuredPets.delete(petId) // Remove from uninsured if previously added
      } else {
        // Add to uninsured only if not already marked as insured
        if (!insuredPets.has(petId)) {
          uninsuredPets.add(petId)
        }
      }
    }
  }

  // Check conditions
  if (insuredPets.size > 1) {
    // More than one insured pet
    return true
  } else if (insuredPets.size === 1 && uninsuredPets.size >= 1) {
    // One insured pet and one or more uninsured pets
    return true
  } else {
    // Single pet (insured or uninsured) or multiple uninsured pets
    return false
  }
}

const handleCartSplitting = async () => {
  const confirmation = await mtUtils.confirm(
    '会計を分割しますか？',
    '会計の分割',
    '分割',
    undefined,
    '保険適用のサービス又は商品があるため、会計を分割しないと再計算できません'
  )
  if (confirmation) {
    await cartStore.splitCartForBilling(props.cartData?.id_cart)
    // openMergeSplitModal()
  } else {
    throw new Error('会計の分割を停止しました。')
  }
}
const openPetDetail = async (pet) => {
  if (pet.id_pet == 'その他') return

  const id_customer = props.cartData?.id_customer
  const pet_ids = props.cartData?.id_pet
  await customerStore.selectCustomer(id_customer)
  customerStore.selectPet(pet.id_pet)
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: id_customer,
    id_pet: pet?.id_pet
  })
}

function getProcessedAmount(cartDetail) {
  const type_tax = cartDetail.type_tax
  let amount = 0
  const flg_tax_included = cartDetail.group_detail.flg_tax_included

  if (type_tax == 1) {
    amount = cartDetail.vat10_amount_sales
  }

  if (type_tax == 2) {
    amount = cartDetail.vat08_amount_sales
  }

  if (type_tax == 3) {
    amount = cartDetail.tax_exempt_amount_sales
  }

  // if (flg_tax_included == 1 && type_tax == 1) {
  //   amount = parseFloat(cartDetail.vat10_amount_sales) * 1.1
  // }
  //
  // if (flg_tax_included == 1 && type_tax == 2) {
  //   amount = parseFloat(cartDetail.vat08_amount_sales) * 1.08
  // }
  let decimalAmount = amount

  let rounded = Number(amount).toFixed(0)

  rounded = rounded.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  let oldValue = Number(decimalAmount).toFixed(0)

  return { rounded, decimalAmount, oldValue }
}

// Checkbox Tick Untick Function
// async function handleCheckbox(newVal: boolean, pet) {
const handleCheckbox = async (
  newVal: boolean,
  pet,
  fromBilling: any = false
) => {
  return

  let formattedData = []
  var flg_normal = false
  var flg_hospitalization = false
  var flg_surgery = false

  for (const date in pet.dates) {
    if (pet.dates.hasOwnProperty(date)) {
      pet.dates[date].forEach((cartDetail) => {
        const disease_insurer = null

        let temp_disease_out_list = []
        if (getCart?.value.pet_insurance) {
          if (getCart?.value.pet_insurance.id_disease_insurer_out1) {
            temp_disease_out_list.push(
              getCart?.value.pet_insurance.id_disease_insurer_out1
            )
          }

          if (getCart?.value.pet_insurance.id_disease_insurer_out2) {
            temp_disease_out_list.push(
              getCart?.value.pet_insurance.id_disease_insurer_out2
            )
          }

          if (getCart?.value.pet_insurance.id_disease_insurer_out3) {
            temp_disease_out_list.push(
              getCart?.value.pet_insurance.id_disease_insurer_out3
            )
          }
        }

        if (cartDetail.type_tax == 1) {
          cartDetail.flg_pet_insurance = newVal
          cartDetail.type_insurance_purpose = 1
        }

        const tempObj = {
          id_cart_detail: cartDetail.id_cart_detail,
          flg_pet_insurance: cartDetail.flg_pet_insurance,
          id_cart: cartDetail.id_cart,
          type_insurance_purpose: newVal ? 2 : 1,
          date_order_start: cartDetail.date_order_start,
          date_order_end: cartDetail.date_order_end,
          flg_disease_out: false,
          name_ins1: null,
          name_ins2: null,
          flg_group_title: cartDetail.flg_group_title
        }

        if (cartDetail?.id_disease) {
          const insuredDiseaseByTypeInsurer =
            cartDetail?.disease?.disease_insurer_list.filter(
              (v: any) =>
                v.code_func1 == getCart?.value?.pet_insurance?.code_insurer
            )

          if (
            insuredDiseaseByTypeInsurer &&
            insuredDiseaseByTypeInsurer.length > 0
          ) {
            const tempDiseaseInsured = insuredDiseaseByTypeInsurer[0]
            tempObj.name_ins1 = tempDiseaseInsured.text1
            tempObj.name_ins2 = tempDiseaseInsured.name_common
          }
        }

        if (cartDetail?.id_service_detail) {
          if (cartDetail?.id_service_detail?.flg_surgery) {
            tempObj.type_insurance_purpose = 4
            flg_surgery = true
          }
          if (cartDetail?.id_service_detail?.flg_pet_custody_control) {
            tempObj.type_insurance_purpose = 3
            flg_hospitalization = true
          }
        } else {
          flg_normal = true
        }

        const diseaseOutList = temp_disease_out_list.filter((disease) =>
          cartDetail?.disease?.id_disease_insurer.includes(disease)
        )

        if (diseaseOutList && diseaseOutList.length > 0) {
          tempObj.type_insurance_purpose = 1
          tempObj.flg_pet_insurance = false
          tempObj.flg_disease_out = true
        }

        formattedData.push(tempObj)
      })
    }
  }

  await cartStore.updateCartInsurance(getCart.value.id_cart, {
    flg_insure_request: newVal
  })
  setCartAndCD(formattedData)

  // await cartDetailStore.bulkUpdateFlgPetInsurance(formattedData)

  await calculateBillingAmount('請求金額を更新しました', formattedData)
  if (newVal && flg_normal && flg_hospitalization && flg_surgery) {
    await mtUtils.alert(
      '通院、入院、手術を一緒に保険請求することはできません。\n',
      '確認してください。'
    )
  }
}

function isCdContainsDecimal(cd: any) {
  if (cd.quantity % 1 !== 0) {
    // Check if quantity is not an integer
    const decimalValue = cd.quantity - Math.floor(cd.quantity) // Extract the decimal part
    if (decimalValue > 0) {
      return true
    }
  }
  return false
}

function setCartAndCD(array: any = null) {
  let localArray = array
    ? array
    : getCart.value.cart_details.filter((v) => v.flg_pet_insurance)

  const cd = localArray.find((cd) => {
    return cd.type_insurance_purpose == 2
  })
  if (cd) {
    getCart.value.date_ins_type2 = cd.date_order_start
    getCart.value.days_ins_type2 = 1
  }

  const tempDays = localArray.find(
    (v) => v.type_insurance_purpose == 3 && v?.flg_pet_custody
  )

  if (tempDays) {
    getCart.value.date_ins_type3_start = tempDays.date_order_start
    getCart.value.date_ins_type3_end = tempDays.date_order_end
    getCart.value.days_ins_type3 = calculateDays(
      tempDays.date_order_start,
      tempDays.date_order_end
    )
  }

  const cd1 = localArray.find((cd) => {
    return cd.type_insurance_purpose == 4
  })

  if (cd1) {
    getCart.value.date_ins_type4 = cd1.date_order_start
    getCart.value.total_ins_type4 = 1
  }

  if (localArray && localArray.length === 0) {
    getCart.value.date_ins_type2 = null
    getCart.value.days_ins_type2 = null
    getCart.value.date_ins_type3_start = null
    getCart.value.date_ins_type3_end = null
    getCart.value.days_ins_type3 = null
    getCart.value.date_ins_type4 = null
    getCart.value.total_ins_type4 = null
  }
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
      var flg_surgery = getCart.value.cart_details.find(
        (v) => v.type_insurance_purpose == 4
      )
      var flg_hospitalization = getCart.value.cart_details.find(
        (v) => v.type_insurance_purpose == 3
      )
      var flg_normal = getCart.value.cart_details.find(
        (v) => v.type_insurance_purpose == 2
      )

      if (newVal && flg_normal && flg_hospitalization && flg_surgery) {
        await mtUtils.alert(
          '『通院＋入院＋手術』全てを含めた保険請求はできません。\n内容を確認して下さい。',
          'エラー'
        )
      }

      if (newVal == 3 && flg_normal) {
        await mtUtils.alert(
          '『通院＋入院』は保険の請求ができません。\n内容を確認して下さい。',
          'エラー'
        )
      }

      if (newVal && flg_surgery && !flg_hospitalization && !flg_normal) {
        await mtUtils.alert(
          '『手術』単体では保険の請求ができません。\n内容を確認して下さい。',
          'エラー'
        )
      }

      setCartAndCD()
      await calculateBillingAmount()
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
  switch (cartDetailType) {
    case 'RQ_SD':
      // Logic for when linked to Service Detail (SD)
      if (data?.id_service_detail?.flg_surgery) {
        data.type_insurance_purpose = 4
        return
      }
      if (data?.id_service_detail?.flg_pet_custody_control) {
        data.type_insurance_purpose = 3
        return
      }
      data.type_insurance_purpose = 2
      return

    case 'RQ_PD':
      // Logic for when linked to Prescription Detail (PD)
      data.type_insurance_purpose = 2
      return

    case 'RQ_ID':
      // Logic for when linked to Prescription Detail (PD)
      data.type_insurance_purpose = 2
      return

    default:
      data.type_insurance_purpose = 1
      return
  }
}

const openUpdatePetInsuranceInfoModal = async (pet) => {
  if (cartStore.getFlgAddCartBalance && false) {
    await mtUtils.autoCloseAlert(
      '保険請求のある会計で未収金の請求はできません。\n会計を分けてください。'
    )
    return
  }

  await mtUtils.mediumPopupWithPresistance(UpdatePetInsuranceInfoModal, {
    data: props.cartData,
    fromCart: true,
    id_pet: pet.id_pet,
    callBackProperties: callBackFunction,
    petObj: pet
  })

  await processCallAPI()
}

async function addInsurance(idPetInsurance) {
  await cartStore.updateCartInsurance(getCart.value.id_cart, {
    id_pet_insurance: idPetInsurance,
    flg_insure_request: true
  })
}

async function checkedSoloPetInsurance(v, cartDetail, cartDetailType, pet) {
  let setTypeInsurancePurposeVal = v ? 5 : 1
  let recalculateInsuranceBilling = false

  if (
    getInsurancePlanForPet(pet.id_pet) &&
    v &&
    !getCart.value.id_pet_insurance
  ) {
    await addInsurance(getInsurancePlanForPet(pet.id_pet).id_pet_insurance)
    setTypeInsurancePurpose(cartDetail, cartDetailType)
    setTypeInsurancePurposeVal = cartDetail.type_insurance_purpose
    recalculateInsuranceBilling = true
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
      if (recalculateInsuranceBilling) {
        calculateBillingAmount(null, false)
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
        } else if (countTrue === totalCount) {
          pet.flg_pet_insurance_master = true // All true
        } else {
          pet.flg_pet_insurance_master = null // Intermediate state
        }
      }
    })
}

async function callBackFunction(isApproved, showMessage, pet) {
  await handleCheckbox(true, pet, false, false)
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

  setCartAndCD(tempLocalArray)

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
  calculateBillingAmount(null, false)

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

const UpdateDiseaseInsurerInCart = async (pet: any) => {
  const flattenedCheckedItems = Object.values(pet.dates).flatMap((dateArray) =>
    dateArray.filter((cd) => cd.checked)
  )

  if (flattenedCheckedItems.length < 1) {
    await mtUtils.alert('1つ以上の会計明細を選択してください。')
    return
  }
  await mtUtils.smallPopup(UpdDiseaseInsurerBlukByCD, { pet: pet })

  await calculateBillingAmount()
}

const updateBulkInsuranceClaim = async (pet: any) => {
  const flattenedCheckedItems = Object.values(pet.dates).flatMap((dateArray) =>
    dateArray.filter((cd) => cd.checked)
  )

  if (flattenedCheckedItems.length < 1) {
    await mtUtils.alert('1つ以上の会計明細を選択してください。')
    return
  }

  await mtUtils.smallPopup(BlueTypeInsurancePurposeModal, { pet })

  await calculateBillingAmount()
}

const bulkCartDetailDelete = async (pet) => {
  const flattenedCheckedItems = Object.values(pet.dates).flatMap((dateArray) =>
    dateArray.filter((cd) => cd.checked)
  )

  if (flattenedCheckedItems.length === 0) {
    await mtUtils.alert('1つ以上の会計明細を選択してください。')
    return
  }

  if (flattenedCheckedItems.length > 0) {
    const confirm = await mtUtils.confirm('選択した会計明細を削除しますか？')

    if (!confirm) {
      return
    }

    const response: any = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'bulk_delete_cart_detail',
      {
        cart_detail_list: [
          ...flattenedCheckedItems.map((cd) => cd.id_cart_detail)
        ]
      }
    )

    if (response) {
      const idsToRemove = flattenedCheckedItems.map((cd) => cd.id_cart_detail)

      idsToRemove.forEach((id) => {
        if (props.selectedCart.hasOwnProperty(id)) {
          delete props.selectedCart[id] // Remove the key from the object
        }
      })

      await processCallAPI(false, '会計詳細を削除しました。')
    }
    return
  }
}

const submitSortMode = async (cartDetails: any) => {
  const values = Object.values(cartDetails)
  const updateList = values.flat().map((cd: any, index: number) => {
    return {
      id_cart_detail: cd.id_cart_detail,
      row: index + 1
    }
  })

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/cart/update-cart-detail-row-order',
    {
      cart_details: updateList
    }
    // true
  )
  await cartStore.fetchCart(getCart.value.id_cart)
  if (response) {
    await mtUtils.autoCloseAlert('順序を更新しました。')
    sortMode.value = false
  }
}
const insurancePlanList = ref([])

const getSelectedInsurance = async () => {
  const petList = [
    ...new Set(
      getCart.value.cart_details
        .filter((cd) => cd.id_pet?.id_pet)
        .map((cd) => cd.id_pet.id_pet)
    )
  ]

  if (petList.length > 0) {
    await useInsuranceStore().fetchPetInsuranceList({
      pet_list: petList.join(',')
    })
  }

  // Create a copy of the insurance list to prevent future updates
  insurancePlanList.value = [...getInsuranceListByPet.value]
}

const getInsurancePlanForPet = (id_pet) => {
  return insurancePlanList.value.find(
    (insurance) =>
      insurance.id_pet == id_pet &&
      new Date(insurance.date_insurance_end) > new Date()
  )
}

const preSetInsFlg = () => {
  flgInsNormal.value = getCart.value.flg_ins_normal
  flgInsHospitalization.value = getCart.value.flg_ins_hospitalization
  flgInsSurgery.value = getCart.value.flg_ins_surgery
}

const updateCartInsType = async (newVal) => {
  if (
    newVal &&
    flgInsNormal.value &&
    flgInsHospitalization.value &&
    flgInsSurgery.value
  ) {
    await mtUtils.alert(
      '『通院＋入院＋手術』全てを含めた保険請求はできません。\n内容を確認して下さい。',
      'エラー'
    )
  } else if (newVal && flgInsNormal.value && flgInsHospitalization.value) {
    await mtUtils.alert(
      '『通院＋入院』は保険の請求ができません。\n内容を確認して下さい。',
      'エラー'
    )
  } else if (
    newVal &&
    flgInsSurgery.value &&
    !flgInsHospitalization.value &&
    !flgInsNormal.value
  ) {
    await mtUtils.alert(
      '『手術』単体では保険の請求ができません。\n内容を確認して下さい。',
      'エラー'
    )
  }

  await mtUtils.callApi(selectOptions.reqMethod.POST, `UpdCartInsFlg`, {
    id_cart: getCart.value.id_cart,
    flg_ins_normal: flgInsNormal.value,
    flg_ins_hospitalization: flgInsHospitalization.value,
    flg_ins_surgery: flgInsSurgery.value
  })

  let cartBillingData = getCartBillingData()

  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(getCart.value?.id_cart, cartBillingData)
  ])

  event_bus.emit('callUpdateBillingAPI', false)
  await mtUtils.promiseAllWithLoader([
    cartStore.fetchCart(getCart.value?.id_cart)
  ])
  event_bus.emit('callUpdateBillingAPI', true)
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
    fractionalPart > 0 ? (partialPart = fractionalPart) : 0 // Ensure there is a fractional part
  }

  if (fullPart && partialPart) {
    return `${fullPart} + ${decimalToFraction(partialPart)}`
  }

  if (fullPart && !partialPart) {
    return `${fullPart}`
  }

  if (partialPart) {
    return `${decimalToFraction(partialPart)}`
  }
}

const getCalculatedTotalDosage = (pd) => {
  let quantity_dose =
    useDoseStore().getAllDoses.find(
      (dose: any) => dose.value == pd?.id_dosage_frequency
    )?.quantity_dose ?? 1
  return Math.ceil(
    roundZeroAfterPoint(pd.total_days_dose) * Number(quantity_dose ?? 1) ?? 1
  )
}

const getFractionForWhole = (pd, pa) => {
  const calculatedTotalDosage = getCalculatedTotalDosage(pd)

  const totalPill =
    Number(calculatedTotalDosage) * Number(pa.val_dosage_decided)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {
    if (parseInt(Number(totalPill)) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
}

const showDiscountPercentage = (row) => {
  if (row?.sales_ratio == null) return false
  const salesRatio = Number(row.sales_ratio)
  return Number.isFinite(salesRatio) && Math.round(100 - salesRatio) !== 0
}

watch(
  () => getCart.value.id_cart,
  (nowValue, oldValue) => {
    if (nowValue) {
      getSelectedInsurance()
      preSetInsFlg()
    }
  },
  {
    deep: true,
    immediate: true
  }
)

onMounted(async () => {
  await getSelectedInsurance()
})
</script>

<template>
  <div class="col-8 cartOverviewLeft cart-overview-container">
    <div class="cart-detail-container full-height">
      <div class="q-pr-sm">
        <small v-if="getCart?.flg_completed" class="body2 regular text-danger">
          <q-icon name="warning_amber" />
          この会計は完了している為、更新できません。
        </small>
        <q-btn
          v-if="useCustomerStore()?.getCustomer?.type_disc_rate > 0"
          class="text-grey-700 q-mt-sm flex items-center"
          size="sm"
          unelevated
          outline
          @click="openCartDiscountModal"
        >
          オーナーデフォルト割引の適用
        </q-btn>
        <!-- add div block here -->
        <div
          v-for="(
            pet, petGroupedIndex, petTraversalIndex
          ) in groupedCartDetails"
          :key="pet?.id_pet"
          v-if="groupedCartDetails"
        >
          <!--        {{Object.values(pet.dates).flat()}}-->
          <div class="flex items-center q-mt-md justify-between">
            <div class="flex row">
              <MtFormCheckBox
                v-if="toggleMerge"
                v-model:checked="pet.isCheckedUi"
                :disable="UiDisable"
                @update:checked="(value)=> {
                if(!value){
                  Object.values(pet.dates).flat().map((cartDetail: any) => {
                    props.selectedCart[cartDetail.id_cart_detail] = false
                  }, )
                  return 
                }
                Object.values(pet.dates).flat().map((cartDetail: any) => {
                    props.selectedCart[cartDetail.id_cart_detail] = true
                  })
                }"
              />
              <div
                class="button-hover cursor-pointer q-py-xs q-px-md text-bold bg-accent-200 text-grey-900"
                style="border-radius: 3px"
                flat
                @click="openPetDetail(pet)"
              >
                <div class="text-caption text-grey-700">
                  {{
                    pet?.id_pet
                      ? getPetKanaName(
                          useCustomerStore()?.getCustomer?.pets?.find(
                            (petObj: any) => pet.id_pet == petObj.id_pet
                          ),
                          useCustomerStore()?.getCustomer
                        )
                      : ''
                  }}
                </div>
                <div>
                  {{
                    pet?.id_pet == 'その他'
                      ? 'その他 '
                      : getFullPetName(
                          useCustomerStore()?.getCustomer?.pets?.find(
                            (petObj: any) => pet.id_pet == petObj.id_pet
                          ),
                          useCustomerStore()?.getCustomer
                        )
                  }}
                </div>
              </div>
              <div
                class="flex column"
                v-if="
                  pet?.hasPetInsurance &&
                  pet?.flg_insurance_plan &&
                  getCart.id_pet_insurance
                "
              >
                <MtFormCheckBox
                  v-model:checked="pet.flg_pet_insurance_master"
                  :disable="UiDisable"
                  label="保険適用"
                  @update:checked="(newVal) => handleCheckbox(newVal, pet)"
                />
              </div>
              <q-btn
                v-if="
                  pet.hasPetInsurance &&
                  pet.flg_insurance_plan &&
                  getInsurancePlanForPet(pet.id_pet)
                "
                class="bg-grey-300 q-ml-md q-pb-sm"
                flat
                @click="openUpdatePetInsuranceInfoModal(pet)"
              >
                <div class="flex column">
                  <div class="q-mb-sm">
                    {{
                      getInsurancePlanForPet(pet.id_pet).insurance_plan
                        .name_insurance_plan
                    }}
                  </div>
                  <div class="caption1 text-grey-800">
                    {{
                      getInsurancePlanForPet(pet.id_pet).date_insurance_start
                    }}
                    ～
                    {{ getInsurancePlanForPet(pet.id_pet).date_insurance_end }}
                  </div>
                </div>
              </q-btn>
              <div class="flex column">
                <div>
                  <MtFormCheckBox
                    v-model:checked="flgInsNormal"
                    :disable="getCart.flg_completed"
                    label="通院"
                    @update:checked="updateCartInsType"
                  ></MtFormCheckBox>
                  <MtFormCheckBox
                    v-model:checked="flgInsHospitalization"
                    :disable="getCart.flg_completed"
                    label="入院"
                    @update:checked="
                      ;async (value) => {
                        if (!value) {
                          updateCartInsType()
                          return
                        }
                        if (
                          getCart.cart_details.find(
                            (cd) => cd.flg_pet_custody && cd.flg_pet_insurance
                          )
                        ) {
                          updateCartInsType()
                          return
                        }
                        flgInsHospitalization = false
                        await mtUtils.alert(
                          '入院期間（開始-終了）を指定する保険適用の会計明細を指定してください。' +
                            '\n\n期間を指定する入院会計明細を開いて「預り管理」にチェックを入れてください。',
                          '注意'
                        )
                        return
                      }
                    "
                  >
                  </MtFormCheckBox>
                  <MtFormCheckBox
                    v-model:checked="flgInsSurgery"
                    :disable="getCart.flg_completed"
                    label="手術"
                    @update:checked="updateCartInsType"
                  ></MtFormCheckBox>
                </div>
                <div class="flex column">
                  <div v-if="flgInsNormal" class="q-mx-sm">
                    通院: {{ getCart.date_ins_type2 }} ~
                    {{ getCart.days_ins_type2 }}
                  </div>
                  <div v-if="flgInsHospitalization" class="q-mx-sm">
                    入院: {{ getCart.date_ins_type3_start }} ~
                    {{ getCart.date_ins_type3_end }} ~
                    {{ getCart.days_ins_type3 }}
                  </div>
                  <div v-if="flgInsSurgery" class="q-mx-sm">
                    手術: {{ getCart.date_ins_type4 }} ~
                    {{ getCart.total_ins_type4 }}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <template v-if="!(getCart.flg_completed || getCart.flg_refund)">
                <q-btn round flat color="primary" class="q-mr-sm">
                  <q-icon name="checklist_rtl" />
                  <q-menu>
                    <q-list dense style="min-width: 100px">
                      <q-item
                        v-close-popup
                        :disabl="!toggleMerge || UiDisable"
                        clickable
                        @click="
                          () => {
                            emits('mergeCartDetail', pet)
                          }
                        "
                      >
                        <div class="row q-py-sm">
                          選択した明細を1つの明細に統合
                        </div>
                      </q-item>
                      <q-separator />
                      <q-item
                        v-close-popup
                        clickable
                        @click="
                          () => {
                            updateBulkInsuranceClaim(pet)
                          }
                        "
                      >
                        <div class="row q-py-sm">保険の適用区分を一括更新</div>
                      </q-item>
                      <q-separator />
                      <q-item
                        v-close-popup
                        clickable
                        @click="
                          () => {
                            UpdateDiseaseInsurerInCart(pet)
                          }
                        "
                      >
                        <div class="row q-py-sm">保険傷病の一括更新</div>
                      </q-item>
                      <q-separator />
                      <q-item
                        v-close-popup
                        clickable
                        @click="
                          () => {
                            bulkCartDetailDelete(pet)
                          }
                        "
                      >
                        <div class="row q-py-sm">選択した明細を削除</div>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
                <q-btn
                  v-if="false"
                  v-show="!toggleMerge"
                  :disable="UiDisable"
                  class="bg-grey-800 text-white q-mr-sm"
                  flat
                  round
                  unelevated
                >
                  <q-icon name="merge" />
                  <q-tooltip>
                    <span>複数明細を1つにまとめる</span>
                  </q-tooltip>
                </q-btn>
                <q-btn
                  :disable="UiDisable"
                  class="q-mr-sm"
                  outlined
                  flat
                  @click="sortMode = !sortMode"
                >
                  <q-icon class="q-mr-sm" name="filter_list" size="20" />
                  {{ sortMode ? '順序変更中' : '順序' }}
                </q-btn>
                <q-btn
                  v-if="sortMode"
                  :disable="UiDisable"
                  class="q-mr-md"
                  color="primary"
                  unelevated
                  @click="submitSortMode(pet.dates)"
                >
                  変更を反映
                </q-btn>
                <q-btn
                  v-if="!headerEnabled"
                  :disable="UiDisable"
                  class="bg-grey-800 text-white q-mr-sm"
                  unelevated
                  @click="
                    () => {
                      emits('openAddCartDetailModal')
                    }
                  "
                >
                  <q-icon name="add" />
                  明細
                </q-btn>
              </template>
            </div>
          </div>
          <div class="q-mt-md flex">
            <MtFormCheckBox
              v-if="!getCart.flg_completed"
              v-model:checked="props.selectedCart['allChecked']"
              :disable="UiDisable"
              label="全て選択"
              @update:checked="(value)=>{        
              const flattenedCheckedItems = Object.values(pet.dates)
                .flatMap(dateArray => dateArray)
                
                flattenedCheckedItems.forEach((item: any) => {
                  props.selectedCart[item.id_cart_detail] = value
                })
                Object.values(pet.dates)
                .flatMap(dateArray => dateArray.map((item:any) => item.checked = value))
            }"
            />
            <q-space />
            <q-btn
              v-if="fromList && !getCart.flg_completed"
              flat
              icon="sync"
              round
              size="24"
              text-color="red"
              @click="syncCartWithRequest"
            />
          </div>
          <div
            v-for="(cartDetails, index) in pet.dates"
            :key="index"
            class="items-blocks q-mb-xl"
          >
            <div
              v-if="!(cartDetails.filter((cd:any) => cd.group_detail && cd.group_detail.flg_group_item).length === cartDetails?.length) "
              class="flex justify-between q-my-md"
            >
              <div class="q-mt-md">{{ index }}</div>
            </div>
            <div
              v-for="(v, cartIndex) in cartDetails.filter(
                (cd) => !cd.group_detail.flg_group_item
              )"
              :key="v.id_cart_detail"
            >
              <q-list>
                <q-item tag="cartDetail" class="text-grey-800 q-py-xs">
                  <q-item-section avatar class="cursor-pointer">
                    <MtFormCheckBox
                      v-if="!getCart.flg_completed"
                      v-model:checked="props.selectedCart[v.id_cart_detail]"
                      :disable="UiDisable"
                      @update:checked="
                        (value) => {
                          v.checked = value
                        }
                      "
                    />

                    <MtFormCheckBox
                      v-if="!refundFlg && getCart.flg_completed"
                      v-model:checked="props.selectedCart[v.id_cart_detail]"
                    />
                    <template>
                      <MtFormCheckBox
                        v-if="!toggleMerge"
                        v-model:checked="props.selectedCart[v.id_cart_detail]"
                        :click-when-disabled="true"
                        :disable="
                          checkIfCartDetailDisabled(v.id_cart_detail) ||
                          (UiDisable && refundFlg)
                        "
                        @click="onClickSelectedCart(v.id_cart_detail)"
                        @update:checked="updateSelectedCart(v.id_cart_detail)"
                      />
                    </template>
                  </q-item-section>
                  <q-item-section>
                    <!-- Service detail block here -->
                    <div
                      v-if="v.id_service_detail"
                      class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                      style="border-left: 6px solid #eebedb"
                      :class="isCdContainsDecimal(v) ? 'decimal-quantity' : ''"
                    >
                      <div class="row items-center full-width">
                        <div
                          :class="isCdContainsDecimal(v) ? 'col-4' : 'col-5'"
                          @click="openCartDetailModal(v.id_cart_detail)"
                          class="text-left"
                        >
                          <div class="title2 bold">
                            <span
                              v-if="v.flg_pet_custody"
                              class="field-label-free-color body2 regular bg-green-800 text-white"
                            >
                              預り
                            </span>
                            {{ v.name_cart_item_display }}
                          </div>
                          <div
                            class="caption1 regular q-mt-sm"
                            v-if="v.flg_pet_custody"
                          >
                            {{ v.date_order_start + ' ~ ' + v.date_order_end }}
                          </div>
                          <div class="caption1 regular q-mt-sm">
                            {{ v.memo_cart_detail }}
                          </div>
                          <div
                            class="caption1 regular q-mt-sm flex items-center"
                          >
                            {{ v.flg_discount == true ? '割引対象' : '' }}
                            {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                            {{ v.type_tax == 3 ? '非課税' : '' }}
                          </div>
                        </div>
                        <div v-if="isCdContainsDecimal(v)" class="col-1">
                          <q-btn
                            class="bg-grey-800 text-white"
                            size="sm"
                            unelevated
                            @click="removeDecimalFromCD(v)"
                          >
                            数量 注意
                          </q-btn>
                        </div>
                        <div
                          v-show="!v.flg_group_title"
                          class="col-2 text-right"
                          @click="openCartDetailModal(v.id_cart_detail)"
                        >
                          <div v-if="!v.flg_merged">
                            <span class="body2 regular">
                              ¥
                              <del
                                class="q-pr-sm"
                                v-if="parseFloat(v.sales_ratio) != 100"
                                >{{ formatNumber(v.unit_price) }}</del
                              >{{ formatNumber(v.unit_sales) }}
                            </span>
                            <span class="caption2"> x </span>
                            {{ formatDecimalNumber(v.quantity) }}
                          </div>
                          <div>
                            <span
                              class="field-label-free-color-small bg-red text-white"
                              v-if="showDiscountPercentage(v)"
                            >
                              [{{ Math.round(100 - Number(v.sales_ratio)) }}%
                              discount]
                            </span>
                            <span
                              v-if="v.group_detail.flg_tax_included"
                              class="q-mr-sm"
                            ></span>
                            ¥
                            <span class="title1 bold">
                              {{ getProcessedAmount(v).rounded }}
                            </span>
                          </div>
                        </div>
                        <div v-if="sortMode" class="col">
                          <div class="flex justify-end">
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="expand_less"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(cartDetails, cartIndex, 'UP')
                              "
                            />
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="keyboard_arrow_down"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(
                                  cartDetails,
                                  cartIndex,
                                  'DOWN'
                                )
                              "
                            />
                          </div>
                        </div>
                        <!-- <div> -->
                        <template
                          v-else-if="
                            !(
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            )
                          "
                        >
                          <div class="col-1"></div>
                          <MtFormCheckBox
                            v-if="v.type_tax == 1"
                            v-model:checked="v.flg_pet_insurance"
                            :disable="UiDisable"
                            label="保険適用"
                            @update:checked="
                              checkedSoloPetInsurance(
                                v.flg_pet_insurance,
                                v,
                                'RQ_SD',
                                pet
                              )
                            "
                          />
                          <div v-if="v.flg_temp_cash" class="col-2 q-ml-md">
                            <q-btn
                              class="bg-grey-800 text-white"
                              size="md"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              入金
                            </q-btn>
                          </div>
                        </template>
                        <template v-else>
                          <div class="col-1"></div>
                          <div v-if="false" class="col-2 text-center">
                            <div
                              v-if="
                                getCart.id_pet_insurance &&
                                !isBitSet(
                                  v.type_insurer,
                                  getCart?.pet_insurance?.code_insurer
                                )
                              "
                              class="caption2 regular flex items-center"
                            >
                              {{
                                useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                                  (item) =>
                                    item.code_func1 ==
                                    getCart?.pet_insurance?.code_insurer
                                )?.name_common
                              }}
                              <br />
                              <span class="text-danger q-pt-xs"
                                >※ 保険対象外</span
                              >
                            </div>
                            <template v-else>
                              <div
                                v-if="
                                  pet.hasPetInsurance &&
                                  pet.flg_insurance_plan &&
                                  getCart.id_pet_insurance
                                "
                              >
                                <MtFormCheckBox
                                  v-if="v.type_tax == 1"
                                  v-model:checked="v.flg_pet_insurance"
                                  label="保険適用"
                                  @update:checked="
                                    (newVal) =>
                                      handleParentCheckbox(
                                        newVal,
                                        pet,
                                        v,
                                        'RQ_SD',
                                        false
                                      )
                                  "
                                  :disable="UiDisable"
                                />
                                <div
                                  v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                                  class="flex column"
                                >
                                  <small> ※ 保険適用は10% 商品のみ </small>
                                </div>
                                <div v-if="v.flg_temp_cash" class="flex column">
                                  <small> ※ 売上外入金を作る </small>
                                </div>
                              </div>
                            </template>
                          </div>
                          <div
                            v-if="v.flg_disease_out"
                            class="col-2 text-center text-red"
                          >
                            除外傷病の項目のため保険適用できません
                          </div>
                          <div
                            v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                            class="col-2"
                          >
                            <MtFormCheckBox
                              v-if="v.type_tax == 1"
                              v-model:checked="v.flg_pet_insurance"
                              :disable="UiDisable"
                              label="保険適用"
                              @update:checked="
                                (newVal) =>
                                  handleParentCheckbox(
                                    newVal,
                                    pet,
                                    v,
                                    'RQ_SD',
                                    false
                                  )
                              "
                            />
                            <div
                              v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                              class="flex column"
                            >
                              <small> ※ 保険適用は10% 商品のみ </small>
                            </div>
                            <div v-if="v.flg_temp_cash" class="flex column">
                              <small> ※ 売上外入金を作る </small>
                            </div>
                          </div>
                          <div v-if="v.flg_pet_insurance" class="col-2">
                            <div>
                              <MtFormPullDown
                                v-if="false"
                                v-model:selected="v.type_insurance_purpose"
                                :options="typeInsurancePurpose"
                                :readonly="false"
                                :rules="[aahValidations.validationSelection]"
                                class="bg-grey-100"
                                label=""
                                outlined
                                required
                                @update:selected="
                                  (newVal) =>
                                    handleParentSelection(newVal, pet, v)
                                "
                                :disable="UiDisable"
                              />
                            </div>
                          </div>
                          <div
                            class="col-1"
                            v-if="v.id_service_detail.flg_complete"
                          >
                            <div>
                              <q-chip
                                text-color="white"
                                class="bg-grey-700 body2 bold q-px-md"
                              >
                                完了
                              </q-chip>
                            </div>
                          </div>
                          <div v-if="v.flg_temp_cash" class="col-2">
                            <q-btn
                              class="bg-grey-800 text-white"
                              size="md"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              入金
                            </q-btn>
                          </div>
                        </template>
                      </div>
                    </div>

                    <!-- Inject detail block here -->
                    <div
                      v-else-if="v.id_inject_detail"
                      :style="'border-left: 6px solid #CDB7F2'"
                      class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                      :class="isCdContainsDecimal(v) ? 'decimal-quantity' : ''"
                    >
                      <div class="row items-center full-width">
                        <div
                          :class="isCdContainsDecimal(v) ? 'col-4' : 'col-5'"
                          @click="openCartDetailModal(v.id_cart_detail)"
                          class="text-left"
                        >
                          <div class="title2 bold">
                            {{ v.name_cart_item_display }}
                          </div>
                          <div class="caption1 regular q-mt-sm">
                            {{ v.memo_cart_detail }}
                          </div>
                          <div
                            class="caption1 regular q-mt-sm flex items-center"
                          >
                            {{ v.flg_discount == true ? '割引対象' : '' }}
                            {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                            {{ v.type_tax == 3 ? '非課税' : '' }}
                          </div>
                        </div>
                        <div v-if="isCdContainsDecimal(v)" class="col-1">
                          <q-btn
                            class="bg-grey-800 text-white"
                            size="sm"
                            unelevated
                            @click="removeDecimalFromCD(v)"
                          >
                            数量 注意
                          </q-btn>
                        </div>
                        <div
                          v-show="!v.flg_group_title"
                          class="col-2 text-right"
                          @click="openCartDetailModal(v.id_cart_detail)"
                        >
                          <div v-if="!v.flg_merged">
                            <span class="body2 regular">
                              ¥
                              <del
                                class="q-pr-sm"
                                v-if="parseFloat(v.sales_ratio) != 100"
                                >{{ formatNumber(v.unit_price) }}</del
                              >{{ formatNumber(v.unit_sales) }}
                            </span>
                            <span class="caption2"> x </span>
                            {{ formatDecimalNumber(v.quantity) }}
                          </div>
                          <div>
                            <span
                              class="field-label-free-color-small bg-red text-white"
                              v-if="showDiscountPercentage(v)"
                            >
                              [{{ Math.round(100 - Number(v.sales_ratio)) }}%
                              discount]
                            </span>
                            <span
                              v-if="v.group_detail.flg_tax_included"
                              class="q-mr-sm"
                            ></span>
                            ¥
                            <span class="title1 bold">
                              {{ getProcessedAmount(v).rounded }}
                            </span>
                          </div>
                        </div>
                        <div v-if="sortMode" class="col">
                          <div class="flex justify-end">
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="expand_less"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(cartDetails, cartIndex, 'UP')
                              "
                            />
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="keyboard_arrow_down"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(
                                  cartDetails,
                                  cartIndex,
                                  'DOWN'
                                )
                              "
                            />
                          </div>
                        </div>
                        <!-- <div> -->
                        <template
                          v-else-if="
                            !(
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            )
                          "
                        >
                          <div class="col-1"></div>
                          <MtFormCheckBox
                            v-if="v.type_tax == 1"
                            v-model:checked="v.flg_pet_insurance"
                            :disable="UiDisable"
                            label="保険適用"
                            @update:checked="
                              checkedSoloPetInsurance(
                                v.flg_pet_insurance,
                                v,
                                'RQ_ID',
                                pet
                              )
                            "
                          />
                          <div v-if="v.flg_temp_cash" class="col-2 q-ml-md">
                            <q-btn
                              class="bg-grey-800 text-white"
                              size="md"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              入金
                            </q-btn>
                          </div>
                        </template>
                        <template v-else>
                          <div class="col-1"></div>
                          <div v-if="false" class="col-2 text-center">
                            <div
                              v-if="
                                getCart.id_pet_insurance &&
                                !isBitSet(
                                  v.type_insurer,
                                  getCart?.pet_insurance?.code_insurer
                                )
                              "
                              class="caption2 regular flex items-center"
                            >
                              {{
                                useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                                  (item) =>
                                    item.code_func1 ==
                                    getCart?.pet_insurance?.code_insurer
                                )?.name_common
                              }}
                              <br />
                              <span class="text-danger q-pt-xs"
                                >※ 保険対象外</span
                              >
                            </div>
                            <template v-else>
                              <div
                                v-if="
                                  pet.hasPetInsurance &&
                                  pet.flg_insurance_plan &&
                                  getCart.id_pet_insurance
                                "
                              >
                                <MtFormCheckBox
                                  v-if="v.type_tax == 1"
                                  v-model:checked="v.flg_pet_insurance"
                                  :disable="UiDisable"
                                  label="保険適用"
                                  @update:checked="
                                    (newVal) =>
                                      handleParentCheckbox(
                                        newVal,
                                        pet,
                                        v,
                                        'RQ_ID'
                                      )
                                  "
                                />
                                <div
                                  v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                                  class="flex column"
                                >
                                  <small> ※ 保険適用は10% 商品のみ </small>
                                </div>
                                <div v-if="v.flg_temp_cash" class="flex column">
                                  <small> ※ 売上外入金を作る </small>
                                </div>
                              </div>
                            </template>
                          </div>
                          <div
                            v-if="v.flg_disease_out"
                            class="col-2 text-center text-red"
                          >
                            除外傷病の項目のため保険適用できません
                          </div>
                          <div
                            v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                            class="col-2"
                          >
                            <MtFormCheckBox
                              v-if="v.type_tax == 1"
                              v-model:checked="v.flg_pet_insurance"
                              :disable="UiDisable"
                              label="保険適用"
                              @update:checked="
                                (newVal) =>
                                  handleParentCheckbox(
                                    newVal,
                                    pet,
                                    v,
                                    'RQ_ID',
                                    false
                                  )
                              "
                            />
                            <div
                              v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                              class="flex column"
                            >
                              <small> ※ 保険適用は10% 商品のみ </small>
                            </div>
                            <div v-if="v.flg_temp_cash" class="flex column">
                              <small> ※ 売上外入金を作る </small>
                            </div>
                          </div>
                          <div v-if="v.flg_pet_insurance" class="col-2">
                            <div>
                              <MtFormPullDown
                                v-if="false"
                                v-model:selected="v.type_insurance_purpose"
                                :disable="UiDisable"
                                :options="typeInsurancePurpose"
                                :readonly="false"
                                :rules="[aahValidations.validationSelection]"
                                class="bg-grey-100"
                                label=""
                                outlined
                                required
                                @update:selected="
                                  (newVal) =>
                                    handleParentSelection(newVal, pet, v)
                                "
                              />
                            </div>
                          </div>
                          <div v-if="v.flg_temp_cash" class="col-2">
                            <q-btn
                              class="bg-grey-800 text-white"
                              size="md"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              入金
                            </q-btn>
                          </div>
                        </template>
                      </div>
                    </div>
                    <!-- Prescription block here -->
                    <div
                      v-else-if="v.id_prescription_detail && !v.flg_group_title"
                      class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                      style="border-left: 6px solid #beccee"
                      :class="isCdContainsDecimal(v) ? 'decimal-quantity' : ''"
                    >
                      <div class="row items-center full-width">
                        <div
                          :class="isCdContainsDecimal(v) ? 'col-4' : 'col-5'"
                          @click="openCartDetailModal(v.id_cart_detail)"
                          class="text-left"
                        >
                          <div class="title2 bold">
                            {{ v.name_cart_item_display }}
                          </div>
                          <!--処方箋 明細内容の表示-->
                          <div
                            v-if="v.id_prescription_detail.type_detail == 1"
                            class="caption1 regular q-mt-sm"
                          >
                            <span
                              v-if="
                                v.id_prescription_detail.name_medicine_format ==
                                '錠'
                              "
                              class="q-mr-md"
                            >
                              1回分：{{
                                getFractionFromValDosage(v?.prescriptionAssort)
                              }}
                            </span>
                            <span v-else class="q-mr-md">
                              1回分：{{
                                roundZeroAfterPoint(
                                  v?.prescriptionAssort.val_dosage_decided,
                                  2
                                )
                              }}
                            </span>
                            <span>
                              {{
                                useDoseStore().getAllDoses.find(
                                  (dos) =>
                                    dos.value ==
                                    v.id_prescription_detail.id_dosage_frequency
                                )?.label
                              }}
                            </span>
                            <div
                              class="caption1 regular q-my-sm flex items-center"
                            >
                              <span
                                v-if="v.id_prescription_detail.total_days_dose"
                              >
                                総服用日数：
                                {{
                                  formatDecimalNumber(
                                    v.id_prescription_detail.total_days_dose
                                  )
                                }}日間
                              </span>
                              <span
                                v-if="
                                  v.id_prescription_detail.total_amount_dose
                                "
                                class="q-px-md"
                              >
                                総服用回数：
                                {{
                                  formatDecimalNumber(
                                    v.id_prescription_detail.total_amount_dose
                                  )
                                }}回
                              </span>
                            </div>
                            <div
                              class="caption1 regular q-my-sm flex items-center"
                            >
                              <span
                                v-if="
                                  v.id_prescription_detail
                                    .name_medicine_format == '錠'
                                "
                                class="q-mr-md"
                              >
                                服用総数：
                                {{
                                  parseInt(
                                    customRound(
                                      Number(
                                        getCalculatedTotalDosage(
                                          v.id_prescription_detail
                                        )
                                      ) *
                                        Number(
                                          v.prescriptionAssort
                                            .val_dosage_decided
                                        )
                                    )
                                  ) > 0
                                    ? `${parseInt(
                                        customRound(
                                          Number(
                                            getCalculatedTotalDosage(
                                              v.id_prescription_detail
                                            )
                                          ) *
                                            Number(
                                              v.prescriptionAssort
                                                .val_dosage_decided
                                            )
                                        )
                                      )} `
                                    : ''
                                }}
                                {{
                                  getFractionForWhole(
                                    v.id_prescription_detail,
                                    v.prescriptionAssort
                                  )
                                }}
                                錠
                              </span>
                              <span v-else class="q-mr-md">
                                服用総数：{{
                                  roundZeroAfterPoint(
                                    customRound(
                                      v.prescriptionAssort.val_dosage_decided *
                                        getCalculatedTotalDosage(
                                          v.id_prescription_detail
                                        )
                                    )
                                  )
                                }}
                              </span>
                              <span class="q-mr-md">
                                会計数量：{{ roundZeroAfterPoint(v.quantity) }}
                              </span>
                            </div>
                          </div>
                          <div
                            class="caption1 regular q-my-sm flex items-center"
                          >
                            {{ v.flg_discount == true ? '割引対象' : '' }}
                            {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                            {{ v.type_tax == 3 ? '非課税' : '' }}
                          </div>
                          <div
                            v-if="v.memo_cart_detail"
                            class="caption1 regular q-mt-sm"
                          >
                            {{ v.memo_cart_detail }}
                          </div>
                        </div>
                        <div v-if="isCdContainsDecimal(v)" class="col-1">
                          <q-btn
                            class="bg-grey-800 text-white"
                            size="sm"
                            unelevated
                            @click="removeDecimalFromCD(v)"
                          >
                            数量 注意
                          </q-btn>
                        </div>
                        <div
                          class="col-2 text-right"
                          @click="openCartDetailModal(v.id_cart_detail)"
                        >
                          <div>
                            <span
                              class="field-label-free-color-small bg-red text-white"
                              v-if="showDiscountPercentage(v)"
                            >
                              [{{ Math.round(100 - Number(v.sales_ratio)) }}%
                              discount]
                            </span>
                            <span
                              v-if="v.group_detail.flg_tax_included"
                              class="q-mr-sm"
                            ></span>
                            ¥
                            <span class="title1 bold">
                              {{ getProcessedAmount(v).rounded }}
                              <!--                            {{ v.vat10_amount_sales }}-->
                            </span>
                          </div>
                        </div>
                        <div v-if="sortMode" class="col">
                          <div class="flex justify-end">
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="expand_less"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(cartDetails, cartIndex, 'UP')
                              "
                              :disable="UiDisable"
                            />
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="keyboard_arrow_down"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(
                                  cartDetails,
                                  cartIndex,
                                  'DOWN'
                                )
                              "
                              :disable="UiDisable"
                            />
                          </div>
                        </div>
                        <template
                          v-else-if="
                            !(
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            )
                          "
                        >
                          <div class="col-1"></div>
                          <MtFormCheckBox
                            v-if="v.type_tax == 1"
                            v-model:checked="v.flg_pet_insurance"
                            :disable="UiDisable"
                            label="保険適用"
                            @update:checked="
                              checkedSoloPetInsurance(
                                v.flg_pet_insurance,
                                v,
                                'RQ_PD',
                                pet
                              )
                            "
                          />
                          <div v-if="v.flg_temp_cash" class="col-2 q-ml-md">
                            <q-btn
                              class="bg-grey-800 text-white"
                              size="md"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              入金
                            </q-btn>
                          </div>
                        </template>
                        <template v-else>
                          <div class="col-1"></div>
                          <div v-if="false" class="col-2 text-center">
                            <div
                              v-if="
                                getCart.id_pet_insurance &&
                                !isBitSet(
                                  v.type_insurer,
                                  getCart?.pet_insurance?.code_insurer
                                )
                              "
                              class="caption2 regular text-grey-700 flex items-center"
                            >
                              {{
                                useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                                  (item) =>
                                    item.code_func1 ==
                                    getCart?.pet_insurance?.code_insurer
                                )?.name_common
                              }}
                              <br />
                              <span class="text-danger q-pt-xs"
                                >※ 保険対象外</span
                              >
                            </div>
                            <template v-else>
                              <div
                                v-if="
                                  pet.hasPetInsurance &&
                                  pet.flg_insurance_plan &&
                                  getCart.id_pet_insurance
                                "
                              >
                                <MtFormCheckBox
                                  label="保険適用"
                                  v-model:checked="v.flg_pet_insurance"
                                  @update:checked="
                                    (newVal) =>
                                      handleParentCheckbox(
                                        newVal,
                                        pet,
                                        v,
                                        'RQ_PD'
                                      )
                                  "
                                  v-if="v.type_tax == 1"
                                  :disable="UiDisable"
                                />
                                <div
                                  v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                                  class="flex column"
                                >
                                  <small> ※ 保険適用は10% 商品のみ </small>
                                </div>
                                <div v-if="v.flg_temp_cash" class="flex column">
                                  <small> ※ 売上外入金を作る </small>
                                </div>
                              </div>
                            </template>
                          </div>
                          <div
                            v-if="v.flg_disease_out"
                            class="col-2 text-center text-red"
                          >
                            除外傷病の項目のため保険適用できません
                          </div>
                          <div
                            v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                            class="col-2"
                          >
                            <MtFormCheckBox
                              v-if="v.type_tax == 1"
                              v-model:checked="v.flg_pet_insurance"
                              :disable="UiDisable"
                              label="保険適用"
                              @update:checked="
                                (newVal) =>
                                  handleParentCheckbox(
                                    newVal,
                                    pet,
                                    v,
                                    'RQ_PD',
                                    false
                                  )
                              "
                            />
                            <div
                              v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                              class="flex column"
                            >
                              <small> ※ 保険適用は10% 商品のみ </small>
                            </div>
                            <div v-if="v.flg_temp_cash" class="flex column">
                              <small> ※ 売上外入金を作る </small>
                            </div>
                          </div>
                          <div v-if="v.flg_pet_insurance" class="col-2">
                            <div>
                              <MtFormPullDown
                                v-if="false"
                                v-model:selected="v.type_insurance_purpose"
                                :options="typeInsurancePurpose"
                                :readonly="false"
                                :rules="[aahValidations.validationSelection]"
                                class="bg-grey-100"
                                label=""
                                outlined
                                required
                                @update:selected="
                                  (newVal) =>
                                    handleParentSelection(newVal, pet, v)
                                "
                                :disable="UiDisable"
                              />
                            </div>
                          </div>
                        </template>
                        <div v-if="v.flg_temp_cash" class="col-2">
                          <q-btn
                            :disable="UiDisable"
                            class="bg-grey-800 text-white"
                            size="sm"
                            unelevated
                            @click="createTempPayment(v)"
                          >
                            Payment
                          </q-btn>
                        </div>
                      </div>
                      <div
                        v-if="v.id_prescription_detail && v.type_detail == 1"
                        class="row q-px-md"
                      >
                        <span
                          v-if="
                            v.id_prescription_detail.name_medicine_format ==
                            '錠'
                          "
                          class="q-mr-md"
                        >
                          1回分：{{
                            getFractionFromValDosage(v?.prescriptionAssort)
                          }}
                        </span>
                        <span v-else class="q-mr-md"
                          >1回分：{{
                            v?.prescriptionAssort.val_dosage_decided
                          }}</span
                        >
                        <span>{{
                          useDoseStore().getAllDoses.find(
                            (dos) =>
                              dos.value ==
                              v.id_prescription_detail.id_dosage_frequency
                          )?.label
                        }}</span>
                        <div class="caption1 regular q-my-sm flex items-center">
                          <span v-if="v.id_prescription_detail.total_days_dose">
                            総服用日数：
                            {{
                              formatDecimalNumber(
                                v.id_prescription_detail.total_days_dose
                              )
                            }}日間
                          </span>
                          <span
                            v-if="v.id_prescription_detail.total_amount_dose"
                            class="q-px-md"
                          >
                            総服用回数：{{
                              formatDecimalNumber(
                                v.id_prescription_detail.total_amount_dose
                              )
                            }}回
                          </span>
                        </div>
                        <div class="caption1 regular q-my-sm flex items-center">
                          <span
                            v-if="
                              v.id_prescription_detail.name_medicine_format ==
                              '錠'
                            "
                            class="q-mr-md"
                          >
                            服用総数：
                            {{
                              parseInt(
                                customRound(
                                  Number(
                                    getCalculatedTotalDosage(
                                      v.id_prescription_detail
                                    )
                                  ) *
                                    Number(
                                      v.prescriptionAssort.val_dosage_decided
                                    )
                                )
                              ) > 0
                                ? `${parseInt(
                                    customRound(
                                      Number(
                                        getCalculatedTotalDosage(
                                          v.id_prescription_detail
                                        )
                                      ) *
                                        Number(
                                          v.prescriptionAssort
                                            .val_dosage_decided
                                        )
                                    )
                                  )} `
                                : ''
                            }}
                            {{
                              getFractionForWhole(
                                v.id_prescription_detail,
                                v.prescriptionAssort
                              )
                            }}
                            錠
                          </span>
                          <span v-else class="q-mr-md">
                            服用総数：{{
                              roundZeroAfterPoint(
                                customRound(
                                  v.prescriptionAssort.val_dosage_decided *
                                    getCalculatedTotalDosage(
                                      v.id_prescription_detail
                                    )
                                )
                              )
                            }}
                          </span>
                          <span class="q-mr-md">
                            会計数量：{{ roundZeroAfterPoint(v.quantity) }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <!-- Not linked to Requet Cart details here -->
                    <div
                      v-else
                      class="bg-grey-100 q-pa-sm q-pl-md full-width cursor-pointer"
                      style="border-left: 6px solid #9e9e9e"
                      :class="isCdContainsDecimal(v) ? 'decimal-quantity' : ''"
                    >
                      <div v-if="v.flg_group_title">
                        <div
                          v-if="v.group_detail.cb_installment"
                          class="row items-center full-width"
                        >
                          <div
                            class="col-5 text-left"
                            @click="openCartDetailModal(v.id_cart_detail, pet)"
                          >
                            <div class="title2 bold">
                              {{ v.name_cart_item_display }}
                            </div>
                          </div>
                          <div
                            class="col-2"
                            @click="openCartDetailModal(v.id_cart_detail, pet)"
                          >
                            <div>
                              ¥
                              <span class="title1 bold">
                                {{
                                  roundZeroAfterPoint(
                                    v.group_detail.amount_installment
                                  )
                                }}
                              </span>
                            </div>
                          </div>
                        </div>
                        <CdGroupPocket
                          v-else
                          :cart-detail="v"
                          :cart-detail-list="cartDetails"
                          :cart-index="cartIndex"
                          :insurancePlanList="insurancePlanList"
                          :pet="pet"
                          :sort-mode="sortMode"
                          @updBillingAmount="
                            () => {
                              console.log('Called 2481')
                              calculateBillingAmount(null, false)
                            }
                          "
                        >
                        </CdGroupPocket>
                      </div>
                      <div v-else class="row items-center full-width">
                        <div
                          class="col-5 text-left"
                          @click="openCartDetailModal(v.id_cart_detail)"
                        >
                          <div class="title2 bold">
                            {{ v.name_cart_item_display }}
                          </div>
                          <div class="caption1 regular q-mt-sm">
                            {{ v.memo_cart_detail }}
                          </div>
                          <div
                            class="caption1 regular q-mt-sm flex items-center"
                          >
                            {{ v.flg_discount == true ? '割引対象' : '' }}
                            {{ v.type_tax == 2 ? '軽減税率(8%)' : '' }}
                            {{ v.type_tax == 3 ? '非課税' : '' }}
                          </div>
                        </div>
                        <div
                          class="col-2 text-right"
                          @click="openCartDetailModal(v.id_cart_detail)"
                        >
                          <span class="body2 regular">
                            ¥
                            <del
                              class="q-pr-sm"
                              v-if="parseFloat(v.sales_ratio) != 100"
                              >{{ formatNumber(v.unit_price) }}</del
                            >{{ formatNumber(v.unit_sales) }}
                          </span>
                          <span class="caption2"> x </span>
                          {{ formatDecimalNumber(v.quantity) }}
                          <div>
                            <span
                              class="field-label-free-color-small bg-red text-white"
                              v-if="showDiscountPercentage(v)"
                            >
                              [{{ Math.round(100 - Number(v.sales_ratio)) }}%
                              discount]
                            </span>
                            <span
                              v-if="v.group_detail.flg_tax_included"
                              class="q-mr-sm"
                            ></span>
                            ¥
                            <span class="title1 bold">
                              {{ getProcessedAmount(v).rounded }}
                            </span>
                          </div>
                        </div>
                        <div v-if="sortMode" class="col">
                          <div class="flex justify-end">
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="expand_less"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(cartDetails, cartIndex, 'UP')
                              "
                            />
                            <q-btn
                              v-if="sortMode"
                              class="cursor-pointer"
                              flat
                              icon="keyboard_arrow_down"
                              round
                              size="10px"
                              @click.stop="
                                individualRowMove(
                                  cartDetails,
                                  cartIndex,
                                  'DOWN'
                                )
                              "
                            />
                          </div>
                        </div>
                        <template
                          v-else-if="
                            !(
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            )
                          "
                        >
                          <div class="col-1"></div>
                          <MtFormCheckBox
                            v-if="v.type_tax == 1"
                            v-model:checked="v.flg_pet_insurance"
                            :disable="UiDisable"
                            label="保険適用"
                            @update:checked="
                              checkedSoloPetInsurance(
                                v.flg_pet_insurance,
                                v,
                                'RQ_PD',
                                pet
                              )
                            "
                          />
                          <div v-if="v.flg_temp_cash" class="col-2 q-ml-md">
                            <q-btn
                              class="bg-grey-800 text-white"
                              size="md"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              入金
                            </q-btn>
                          </div>
                        </template>
                        <template v-else>
                          <div class="col-1"></div>
                          <div v-if="false" class="col-2 text-center">
                            <div
                              v-if="
                                getCart.id_pet_insurance &&
                                !isBitSet(
                                  v.type_insurer,
                                  getCart?.pet_insurance?.code_insurer
                                )
                              "
                              class="caption2 regular text-grey-700 flex items-center"
                            >
                              {{
                                useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
                                  (item) =>
                                    item.code_func1 ==
                                    getCart?.pet_insurance?.code_insurer
                                )?.memo_etc1
                              }}
                              <br />
                              <span class="text-danger q-pt-xs"
                                >※ 保険対象外</span
                              >
                            </div>
                            <template v-else>
                              <div
                                v-if="
                                  pet.hasPetInsurance &&
                                  pet.flg_insurance_plan &&
                                  getCart.id_pet_insurance
                                "
                              >
                                <MtFormCheckBox
                                  v-if="v.type_tax == 1"
                                  v-model:checked="v.flg_pet_insurance"
                                  :disable="UiDisable"
                                  label="保険適用"
                                  @update:checked="
                                    (newVal) =>
                                      handleParentCheckbox(
                                        newVal,
                                        pet,
                                        v,
                                        'RQ_PD'
                                      )
                                  "
                                />
                                <div
                                  v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                                  class="flex column"
                                >
                                  <small> ※ 保険適用は10% 商品のみ </small>
                                </div>
                                <div v-if="v.flg_temp_cash" class="flex column">
                                  <small> ※ 売上外入金を作る </small>
                                </div>
                              </div>
                            </template>
                          </div>
                          <div
                            v-if="v.flg_disease_out"
                            class="col-2 text-center text-red"
                          >
                            除外傷病の項目のため保険適用できません
                          </div>
                          <div
                            v-if="
                              pet.hasPetInsurance &&
                              pet.flg_insurance_plan &&
                              getCart.id_pet_insurance
                            "
                            class="col-2"
                          >
                            <MtFormCheckBox
                              v-if="v.type_tax == 1"
                              v-model:checked="v.flg_pet_insurance"
                              :disable="UiDisable"
                              label="保険適用"
                              @update:checked="
                                (newVal) =>
                                  handleParentCheckbox(
                                    newVal,
                                    pet,
                                    v,
                                    'RQ_SD',
                                    false
                                  )
                              "
                            />
                            <div
                              v-if="!(v.type_tax == 1 || v.flg_temp_cash)"
                              class="flex column"
                            >
                              <small> ※ 保険適用は10% 商品のみ </small>
                            </div>
                            <div v-if="v.flg_temp_cash" class="flex column">
                              <small> ※ 売上外入金を作る </small>
                            </div>
                          </div>
                          <div v-if="v.flg_pet_insurance" class="col-2">
                            <div>
                              <MtFormPullDown
                                v-if="false"
                                v-model:selected="v.type_insurance_purpose"
                                :disable="UiDisable"
                                :options="typeInsurancePurpose"
                                :readonly="false"
                                :rules="[aahValidations.validationSelection]"
                                class="bg-grey-100"
                                label=""
                                outlined
                                required
                                @update:selected="
                                  (newVal) =>
                                    handleParentSelection(newVal, pet, v)
                                "
                              />
                            </div>
                          </div>
                          <div v-if="v.flg_temp_cash" class="col-2">
                            <q-btn
                              :disable="UiDisable"
                              class="bg-grey-800 text-white"
                              size="sm"
                              unelevated
                              @click="createTempPayment(v)"
                            >
                              Payment
                            </q-btn>
                          </div>
                        </template>
                      </div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </div>
        </div>
        <div
          v-if="Object.keys(groupedCartDetails).length === 0"
          class="flex justify-end q-my-md"
        >
          <q-btn
            v-if="!headerEnabled"
            class="bg-grey-800 text-white q-mr-sm"
            unelevated
            @click="
              () => {
                emits('openAddCartDetailModal')
              }
            "
          >
            <q-icon name="add" />
            明細
          </q-btn>
        </div>
        <!-- div block ends here -->
        <div class="q-px-sm q-mt-md q-mb-xl">
          <div
            v-if="computedDecimal"
            class="flex items-center justify-end text-danger"
          >
            <span class="caption1 regular q-mr-md">
              上記の明細に小数以下の値が含まれています。小数の切り捨て処理を行う場合は"端数処理"のボタンを押してください。
            </span>
            <q-btn
              class="bg-grey-800 text-white q-mr-sm"
              size="md"
              unelevated
              @click="processCallAPI(true)"
            >
              <q-icon name="auto_fix_normal" class="q-mr-xs" />
              端数処理
            </q-btn>
          </div>
        </div>
      </div>
    </div>

    <div
      class="refund-container q-py-md"
      v-if="getCart.flg_completed || getCart.flg_refund"
    >
      <div class="flex justify-end">
        <q-btn
          v-if="!refundFlg && !getCart.flg_refund"
          class="bg-grey-800 text-white q-mr-sm"
          unelevated
          :disable="loading"
          @click="createRefund"
        >
          返金
        </q-btn>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.cart-overview-container {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  max-height: -webkit-fill-available;
}

.cart-detail-container {
  overflow: auto;
  position: relative;
}

.refund-container {
  position: sticky;
  bottom: 0;
  right: 0;
  background: white;
  padding: 16px;
  z-index: 2;
  border-top: 1px solid #eee;
}

.footer {
  padding-right: 8px;
  flex-grow: 1;
  display: flex;
  margin-top: auto;
  align-self: end;
}

.items-blocks {
  overflow: auto;
}

.cartOverviewLeft {
  height: 80vh;
  overflow: auto;
  padding-bottom: 45px; /* Default for ipad */
}

@media only screen and (min-height: 1024px) {
  .cartOverviewLeft {
    padding-bottom: 0px !important; /* Styling for desktop */
  }
}

.sort-box {
  margin-left: 20px;
  width: 10%;
}

.group-align-btn {
  display: flex;
  flex-direction: column;
  row-gap: 10px;
}

.button-hover:hover {
  background-image: linear-gradient(rgb(0 0 0/20%) 0 0);
}

.decimal-quantity {
  background-color: rgba(253, 89, 111, 0.3) !important;
}
</style>
