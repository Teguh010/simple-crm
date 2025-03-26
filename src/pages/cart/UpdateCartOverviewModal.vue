<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import { useRouter } from 'vue-router'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCartStore from '@/stores/carts'
import useCartDetailStore from '@/stores/cart-details'
import useCustomerStore from '@/stores/customers'
import useInsuranceStore from '@/stores/insurances'
import { storeToRefs } from 'pinia'
import UpdateCartOverviewLeftModal from './UpdateCartOverviewLeftModal.vue'
import UpdateCartHeaderModalRight from './UpdateCartHeaderModalRight.vue'
import { typeCustomerColor } from '@/utils/enum'

// Asynchronous Imports (Pages)
const UpdateCustomerModal = defineAsyncComponent(
  () => import('@/pages/master/customerPet/UpdateCustomerModal.vue')
)
const UpdateCartDetailModal = defineAsyncComponent(
  () => import('@/pages/cart/UpdateCartDetailModal.vue')
)

const CartMergeSplitModal = defineAsyncComponent(
  () => import('@/pages/cart/CartMergeSplitModal.vue')
)

const emits = defineEmits(['close'])
const router = useRouter()
const cartStore = useCartStore()
const cartDetailStore = useCartDetailStore()
const customerStore = useCustomerStore()
const insuranceStore = useInsuranceStore()
const { getCustomer } = storeToRefs(customerStore)
const { getCart } = storeToRefs(cartStore)
const props = defineProps({ data: Object, fromPage: String })
const selectedTab = ref(null)
const tabsData = ref({})
const groupedCartDetails = ref({})
const data = ref({})
const cartData = reactive({})

const labelColor = (type_customer_color) =>
  typeCustomerColor.find((v) => v.value === type_customer_color)?.label

const closeModal = () => {
  emits('close')
}
const openUpdateCustomerModal = async () => {
  await mtUtils.popup(UpdateCustomerModal)
}
const openRequestDetail = (id_request) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })
  window.open(route.href, '_blank')
}
const openMergeSplitModal = async () => {
  await mtUtils.mediumPopup(CartMergeSplitModal, { data: tabsData.value })
}
const getCartBillingData = () => {
  return {
    ch_disc_rate: data.value.ch_disc_rate,
    cart_payment_this_time: data.value.cart_payment_this_time,
    type_price_adjustment: data.value.type_price_adjustment,
    total_adjustment_intax: data.value.total_adjustment_intax
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
    '保険適用の会計の為、ペット単位で会計を分割してください。'
  )
  if (confirmation) {
    await mtUtils.promiseAllWithLoader([
      cartStore.splitCartForBilling(cartData?.id_cart)
    ])
    // openMergeSplitModal()
  } else {
    throw new Error('Cart split cancelled.')
  }
}
const updateCartAndBilling = async (alertMessage) => {
  if (shouldSplitCart()) {
    await handleCartSplitting()
  }
  let cartBillingData = getCartBillingData()
  await mtUtils.promiseAllWithLoader([
    cartStore.updateBillingAmount(cartData?.id_cart, cartBillingData),
    cartStore.fetchCart(cartData?.id_cart)
  ])

  // data.value = JSON.parse(JSON.stringify(getCart.value))
  await mtUtils.autoCloseAlert(alertMessage)
}
const submit = async () => {
  try {
    let formattedData = formatDataForSubmit(groupedCartDetails.value)
    await cartDetailStore.bulkUpdateFlgPetInsurance(formattedData)
    await updateCartAndBilling('更新しました')
  } catch (error) {
    console.error(error)
    // Handle error
  }
}
const formatDataForSubmit = (groupedCartDetails) => {
  let formattedData = []
  Object.values(groupedCartDetails).forEach((pet) => {
    Object.values(pet.dates).forEach((cartDetails) => {
      cartDetails.forEach((cartDetail) => {
        formattedData.push({
          id_cart_detail: cartDetail.id_cart_detail,
          flg_pet_insurance: cartDetail.flg_pet_insurance
        })
      })
    })
  })
  return formattedData
}
const openMenu = async (data: any) => {
  let menuOptions = [
    {
      title: 'URLコピー',
      name: 'url',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '新規コピー',
      name: 'duplicate',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '各証明書発行',
      name: 'certificate issued',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: 'スレッド作成',
      name: 'thread creation',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: 'スレッド検索',
      name: 'thread search',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
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
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            let id = props.data?.id_cart
            cartStore.destroyCart(id).then(() => {
              emits('close')
              // cartStore.fetchCart()
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const transformData = () => {
  const groupedData = {}
  let cart_data = JSON.parse(JSON.stringify(getCart.value))
  if (cart_data.cart_details) {
    cart_data.cart_details.forEach((detail) => {
      const petId = detail.id_pet ? detail.id_pet.id_pet : 'その他'
      const petName = detail.id_pet ? detail.id_pet.name_pet : 'その他'
      const flgInsurancePlan = detail.id_pet
        ? detail.id_pet.flg_insurance_plan
        : false
      const dateStart = detail.date_order_start

      // Determine id_insurance_plan
      let idInsurancePlan = null
      let hasPetInsurance = null
      if (detail.id_pet && detail.id_pet.pet_insurance.length > 0) {
        hasPetInsurance = true
        const insuranceRecord = detail.id_pet.pet_insurance.find(
          (record) => record.flg_insurance_main === true
        )
        if (insuranceRecord) {
          idInsurancePlan = insuranceRecord.id_insurance_plan
        }
      }
      if (!groupedData[petId]) {
        groupedData[petId] = {
          id_pet: petId,
          id_customer: detail.id_pet?.id_customer,
          name_pet: petName,
          flg_insurance_plan: flgInsurancePlan,
          id_insurance_plan: idInsurancePlan,
          hasPetInsurance: hasPetInsurance,
          dates: {},
          id_pet: petId
        }
      }

      if (!groupedData[petId].dates[dateStart]) {
        groupedData[petId].dates[dateStart] = []
      }

      groupedData[petId].dates[dateStart].push(detail)
    })
  }
  
  Object.keys(groupedData).forEach(petId => {
    // Get the date keys from the 'dates' object and sort them
    const sortedDateKeys = Object.keys(groupedData[petId].dates).sort((a, b) => new Date(a) - new Date(b))

    // Create a new sorted 'dates' object
    const sortedDates = {}
    sortedDateKeys.forEach(dateKey => {
      sortedDates[dateKey] = groupedData[petId].dates[dateKey]
    })

    // Replace the original 'dates' object with the sorted one
    groupedData[petId].dates = sortedDates
  })
  
  
  return groupedData
}

function initializeParentCheckbox() {
  for (const petId in groupedCartDetails.value) {
    if (groupedCartDetails.value.hasOwnProperty(petId)) {
      handleParentCheckbox(groupedCartDetails.value[petId])
    }

    // handleParentCheckbox(groupedData[pet])
  }
}

function handleParentCheckbox(pet) {
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

  // if (pet.flg_pet_insurance_master !== newVal) {
  //   pet.flg_pet_insurance_master = null
  // }
}

const prepareTabData = (cart) => {
  let tabs = []

  // Add parent tab
  tabs.push({
    id: cart.parent.id,
    label: '会計 1',
    isCurrent: cart.parent.is_current
  })

  // Add child tabs
  cart.children.forEach((child, index) => {
    tabs.push({
      id: child.id,
      label: `会計 ${index + 2}`,
      isCurrent: child.is_current
    })
  })

  return tabs
}

function individualRowMove(rowIndex: number, direction: 'UP' | 'DOWN') {
  if (
    (direction === 'UP' && rowIndex === 0) ||
    (direction === 'DOWN' &&
      rowIndex === prescriptionHeader.value.prescription_detail_list.length - 1)
  ) {
    return
  }
  let nextIndex = direction === 'UP' ? rowIndex - 1 : rowIndex + 1
  let current = prescriptionHeader.value.prescription_detail_list.splice(
    rowIndex,
    1
  )
  prescriptionHeader.value.prescription_detail_list.splice(
    nextIndex,
    0,
    ...current
  )
}

const setActiveTab = (tabs) => {
  let activeTab = tabs.find((tab) => tab.isCurrent)
  selectedTab.value = activeTab ? activeTab.id : null
}

const isCartSplittingDisabled = computed(() => {
  // Check if cartData or cartData.id_pet is undefined
  if (!cartData || !cartData.id_pet) {
    return true // Disable splitting if cartData or id_pet is undefined
  }
  let pets = cartData.id_pet.split(',')
  return pets.length <= 1 // Disable splitting if only one or no pet
})

watch(selectedTab, async (newTabId, oldTabId) => {
  if (newTabId !== oldTabId && oldTabId !== null) {
    await cartStore.fetchCart(newTabId)
  }
})

watch(
  getCart,
  (newVal) => {
    data.value = JSON.parse(JSON.stringify(newVal))
    Object.assign(cartData, JSON.parse(JSON.stringify(newVal)))
    groupedCartDetails.value = transformData()
    initializeParentCheckbox()
    tabsData.value = prepareTabData(getCart.value)
    // setActiveTab(tabsData.value)
  },
  { deep: true }
)

const openAddCartDetailModal = async () => {
  await mtUtils.mediumPopup(UpdateCartDetailModal, { data: cartData })
}

onMounted(async () => {
  if (props?.data?.id_cart) {
    // checking if the getter is the same
    if (getCart.value.id_cart != props?.data?.id_cart) {
      await mtUtils.promiseAllWithLoader([
        cartStore.fetchCart(props?.data?.id_cart)
      ])
    } else {
      data.value = JSON.parse(JSON.stringify(getCart.value))
      Object.assign(cartData, JSON.parse(JSON.stringify(getCart.value)))
      groupedCartDetails.value = transformData()
      tabsData.value = prepareTabData(getCart.value)
      setActiveTab(tabsData.value)
    }
    // tabsData.value = prepareTabData(getCart.value)
    // setActiveTab(tabsData.value)

    if (getCustomer.value?.id_customer != getCart.value.id_customer) {
      await customerStore.selectCustomer(getCart.value?.id_customer, true)
    }
    // Check if the insurances array is empty
    if (insuranceStore.getInsurances.length === 0) {
      insuranceStore.fetchInsurances()
    }
    initializeParentCheckbox()
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="false">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none col-auto"
        >会計
      </q-toolbar-title>
      <span class="text-grey-900 body1 regular q-ml-md"
        >診察券番号: {{ getCart.code_customer }}</span
      >
      <div class="flex items-center">
        <q-btn
          flat
          dense
          class="q-ml-sm body1 regular text-blue text-underline"
          @click="openUpdateCustomerModal"
        >
          {{ getCart.name_customer }}
        </q-btn>
        <q-icon
          v-if="getCustomer?.type_customer_color"
          size="13px"
          name="circle"
          :color="labelColor(getCustomer?.type_customer_color)"
        />
        <span class="q-ml-md text-grey-900 body1 regular">リクエスト番号:</span>
        <q-btn
          flat
          dense
          class="body1 regular text-blue text-underline"
          @click="openRequestDetail(getCart.id_request?.id_request)"
        >
          {{ getCart.id_request?.number_request }}
        </q-btn>
        <span class="q-ml-md">
          <q-chip
            class="bg-light-blue caption1 bold q-px-lg"
            text-color="white"
          >
            {{ getCart.id_request?.flg_in_app_payment ? '後払い' : '窓口' }}
          </q-chip>
        </span>
      </div>
      <div class="flex q-ml-auto">
        <q-btn
          unelevated
          padding="6px 52px"
          color="grey-100"
          text-color="grey-800"
          class="body1 regular border-btn"
          @click="openMergeSplitModal"
        >
          分割・統合
        </q-btn>
        <q-btn unelevated class="q-ml-sm" @click="openMenu" round>
          <q-icon size="18px" name="more_horiz" class="q-mr-xs" />
        </q-btn>
        <q-btn unelevated @click="closeModal" round>
          <q-icon size="18px" name="close" class="q-mr-xs" />
        </q-btn>
      </div>
    </MtModalHeader>
    <q-card-section class="content q-px-xl non-scrolled">
      <div class="flex items-center justify-between">
        <q-tabs v-model="selectedTab" align="left" dense class="tab-style2">
          <q-tab
            v-for="tab in tabsData"
            :key="tab.id"
            :name="tab.id"
            :label="tab.label"
            class="tabsBox body2 regular q-mr-md"
          />
        </q-tabs>
      </div>
      <q-tab-panels v-model="selectedTab" class="non-scrolled" animated>
        <q-tab-panel
          v-for="tab in tabsData"
          :key="tab.id"
          :name="tab.id"
          class="q-pa-none"
        >
          <div class="bg-grey-100 q-tab-custom">
            <div class="bg-white q-pa-md q-ma-sm">
              <div class="row">
                <div class="col-8">
                  <div class="flex items-center justify-between q-mb-xs">
                    <div class="flex items-center full-width">
                      <span class="title2 bold text-black">会計明細</span>
                      <div class="body1 regular text-grey-900 q-ml-lg">
                        <span>会計番号:</span>
                        <span>{{ getCart.number_cart }}</span>
                      </div>
                      <div
                        class="body1 regular text-grey-900 q-ml-md"
                        v-if="getCart.id_discount_rate"
                      >
                        <span>割引率:</span>
                        <span>{{ getCart.id_discount_rate }} %</span>
                      </div>
                      <div class="q-ml-auto">
                        <q-btn
                          padding="3px 40px"
                          class="bg-grey-800 title3 bold text-white"
                          unelevated
                          @click="openAddCartDetailModal"
                        >
                          <q-icon name="add" />明細追加
                        </q-btn>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-4"></div>
              </div>

              <div class="row">
                <div class="col-8">
                  <UpdateCartOverviewLeftModal
                    :groupedCartDetails="groupedCartDetails"
                    :cartData="cartData"
                    class="left-side"
                    :fromPage="fromPage"
                  />
                </div>
                <div class="col-4">
                  <UpdateCartHeaderModalRight class="right-side" :data="data" />
                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.border-btn {
  border: 1px solid $grey-800;
}

.non-scrolled {
  overflow-y: hidden;
}

.q-tab-custom {
  padding-top: 1px;
  padding-bottom: 1px;
}
</style>
