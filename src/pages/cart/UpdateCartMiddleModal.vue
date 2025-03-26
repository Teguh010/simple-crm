<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import mtUtils from '@/utils/mtUtils'
import { useRouter } from 'vue-router'
import useCartStore from '@/stores/carts'
import useCartDetailStore from '@/stores/cart-details'
import useServiceDetailStore from '@/stores/service-details'
import usePrescriptionStore from '@/stores/prescription'
import MtModalHeader from '@/components/MtModalHeader.vue'
import UpdateCartOverviewModal from '@/pages/cart/UpdateCartOverviewModal.vue'
import UpdateCustomerModal from '@/pages/master/customerPet/UpdateCustomerModal.vue'
import UpdatePetInsuranceInfoModal from '@/pages/insurance/UpdatePetInsuranceInfoModal.vue'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import useActionStore from '@/stores/action'

const emits = defineEmits(['close'])
const cartStore = useCartStore()
const { getCart } = storeToRefs(cartStore)
const cartDetailStore = useCartDetailStore()
const serviceDetailStore = useServiceDetailStore()
const prescriptionStore = usePrescriptionStore()
const router = useRouter()
const actionStore = useActionStore()
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)

const categoryStore = useCategoryStore()
const { getAllCategories } = storeToRefs(categoryStore)

const props = defineProps({ requestData: Object })

const allRequests = ref({
  name_customer: '',
  number_request: '',
  pets: []
})

const requestData = reactive({
  service_detail_list: [],
  prescriptions: []
})

let existingCartDetailsMap = new Map()

const closeModal = () => {
  emits('close')
}

const openUpdateCustomerModal = async () => {
  await mtUtils.popup(UpdateCustomerModal)
}

const openRequestDetail = () => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: requestData.id_request }
  })
  window.open(route.href, '_blank')
}

const openUpdatePetInsuranceInfoModal = async () => {
  await mtUtils.popup(UpdatePetInsuranceInfoModal)
}

const openCartOverviewModal = async () => {
  await mtUtils.popup(UpdateCartOverviewModal)
}

const typeCategoryName = (value) =>
  getAllCategories.value.find((v) => v.value === value)?.label


function groupByPet(entries, type) {
  const grouped = {}
  entries.forEach((entry) => {
    /* Use existing id_pet or create a new pet object if needed */
    /* NB: prescription doesn't return pet object while coding this, so we need to create a new pet object from the id_pet and name_pet */
    const petId = entry?.pet?.id_pet || entry.id_pet

    // If there's no petId or pet object, skip this entry
    if (!petId || (!entry.pet && !entry.name_pet)) return

    if (!grouped[petId]) {
      grouped[petId] = {
        pet: entry.pet || { id_pet: petId, name_pet: entry.name_pet },
        serviceDetails: [],
        prescriptions: []
      }
    }

    grouped[petId][type].push(entry)
  })
  return grouped
}

const transformData = () => {
  /* transform data and group by pet
     currently requestData is grouped by service detail and prescription. ie,
    request => service_details => pet
            => prescriptions => pet.
    But we need to change it to following:
    request => pet => service_details
                   => presription
    This is because, we need to show service detail and prescriptions grouped by pet in this page
  */
  if (!requestData) return

  // Destructure requestData for easier access
  const {
    service_detail_list = [],
    prescriptions = [],
    name_customer,
    number_request
  } = requestData

  // Group entries by pet and handle service details and prescriptions separately
  const groupedByPet = {
    ...groupByPet(service_detail_list, 'serviceDetails'),
    ...groupByPet(prescriptions, 'prescriptions')
  }

  allRequests.value = {
    ...allRequests.value,
    pets: Object.values(groupedByPet),
    name_customer,
    number_request
  }
}

function initializeExistingCartDetailsMap() {
  if (getCart.value && getCart.value.cart_details.length > 0) {
    existingCartDetailsMap.clear() // Clear existing entries
    getCart.value.cart_details.forEach((detail) => {
      const key = detail.id_service_detail || detail.id_prescription
      existingCartDetailsMap.set(key, detail)
    })
  }
}

const filterItemsByFlgNonCharge = () => {
  const filteredServiceDetails = requestData.service_detail_list
    .filter(service => !service.flg_non_charge)
    .map(service => ({
      id_service_detail: service.id_service_detail,
      flg_non_charge: service.flg_non_charge,
      id_pet: service.id_pet,
      quantity: service.quantity,
      name_pet: service.pet?.name_pet ?? ''
    }));

  const filteredPrescriptions = requestData.prescriptions
    .filter(prescription => !prescription.flg_non_charge)
    .map(prescription => ({
      id_prescription: prescription.id_prescription,
      flg_non_charge: prescription.flg_non_charge,
      id_pet: prescription.id_pet,
      name_pet: prescription.name_pet
    }));

  return { filteredServiceDetails, filteredPrescriptions }
}

const UpdateServiceAndPrescriptionFlagNonCharge = async () => {

  const simplifiedServiceDetails = requestData.service_detail_list.map(
    (service) => {
      return {
        id_service_detail: service.id_service_detail,
        flg_non_charge: service.flg_non_charge
      }
    }
  )

  if (simplifiedServiceDetails.length > 0) {
    serviceDetailStore.updateFlgNonCharge(simplifiedServiceDetails)
  }

  const simplifiedPrescriptionDetails = requestData.prescriptions.map(
    (prescription) => {
      return {
        id_prescription: prescription.id_prescription,
        flg_non_charge: prescription.flg_non_charge
      }
    }
  )
  if (simplifiedPrescriptionDetails.length > 0) {
    prescriptionStore.updateFlgNonCharge(simplifiedPrescriptionDetails)
  }
}

const getUniquePetDetails = (serviceArray, prescriptionArray) => {
  // Combine the two arrays, if they exist, or initialize as empty arrays
  const combinedDetails = [
    ...(Array.isArray(serviceArray) ? serviceArray : []),
    ...(Array.isArray(prescriptionArray) ? prescriptionArray : [])
  ]

  // Short-circuit if there are no details
  if (combinedDetails.length === 0) {
    return {
      name_pet: '',
      id_pet: '',
      flg_multiple_pet: false
    }
  }

  // Use reduce to process the details only once
  const uniqueDetails = combinedDetails.reduce(
    (acc, detail) => {
      acc.petNames.add(detail.name_pet)
      acc.petIds.add(detail.id_pet)
      return acc
    },
    { petNames: new Set(), petIds: new Set() }
  )

  // Construct the strings from the sets and determine the flg_multiple_pet flag
  const name_pet = Array.from(uniqueDetails.petNames).join(',')
  const id_pet = Array.from(uniqueDetails.petIds).join(',')
  const flg_multiple_pet = uniqueDetails.petIds.size > 1

  return { name_pet, id_pet, flg_multiple_pet }
}

const getCartData = () => ({
  name_customer: requestData.name_customer,
  code_ahmics_customer: requestData.code_ahmics_customer ?? '',
  code_customer: requestData.code_customer,
  id_customer: requestData.id_customer,
  id_request: requestData.id_request
})

const getCommonCartDetailData = () => ({
  ...getCartData(),
  type_source_cart: 1
})

async function handleCart(cartData) {
  if (!getCart.value) {
    const response = await cartStore.submitCart(cartData)
    return response.data.data.id_cart
  } else {
    if (getCart.value.name_pet !== cartData.name_pet) {
      const cartPayload = {
        flg_multiple_pet: cartData.flg_multiple_pet,
        name_pet: cartData.name_pet,
        id_pet: cartData.id_pet,
      };
      await cartStore.updateCart(getCart.value.id_cart, cartPayload)
    }

    return getCart.value.id_cart

  }
}

async function handleCartDetails(id_cart, accountingItems) {
  const accountingItemsMap = buildAccountingItemsMap(accountingItems)
  await addNewCartDetails(id_cart, accountingItemsMap)
  await removeOldCartDetails(accountingItemsMap)
}

function buildAccountingItemsMap(accountingItems) {
  const map = new Map()
  accountingItems.forEach((item) => {
    const key = item.id_service_detail || item.id_prescription
    map.set(key, item)
  })
  return map
}

async function addNewCartDetails(id_cart, accountingItemsMap) {
  for (const [key, item] of accountingItemsMap) {
    if (!existingCartDetailsMap.has(key)) {
      const cartDetailResponse = await cartDetailStore.submitCartDetail({
        ...item,
        ...getCommonCartDetailData(),
        id_cart
      })
      existingCartDetailsMap.set(key, cartDetailResponse.data.data)
    }
  }
}

async function removeOldCartDetails(accountingItemsMap) {
  for (const [key, detail] of existingCartDetailsMap) {
    if (!accountingItemsMap.has(key)) {
      await cartDetailStore.destroyCartDetail(detail.id_cart_detail)
      existingCartDetailsMap.delete(key)
    }
  }
}

const submit = async () => {
  // Update and get the simplified details
  await UpdateServiceAndPrescriptionFlagNonCharge()
  // filter the request items by flg_non_charge == true (ie, checked items)
  const { filteredServiceDetails, filteredPrescriptions } =
    filterItemsByFlgNonCharge()
  // combine the two arrays
  const accountingItems = [...filteredServiceDetails, ...filteredPrescriptions]

  const cartData = getCartData()
  // get unique pet details from the services and prescriptions information and concaqting them with ','
  const uniquePetDetails = getUniquePetDetails(
    filteredServiceDetails,
    filteredPrescriptions
  )
  if (uniquePetDetails.id_pet) {
    Object.assign(cartData, uniquePetDetails)
  }

  // Create or get the cart
  try {
    const id_cart = await handleCart(cartData)
    await handleCartDetails(id_cart, accountingItems)
  } catch (error) {
    console.error(
      'An error occurred while submitting the cart or cart details:',
      error
    )
  }
}

onMounted(async () => {
  if (props.requestData?.id_request) {
    Object.assign(requestData, props.requestData)
    await cartStore.fetchCartByRequest(props.requestData.id_request)
    transformData()
    initializeExistingCartDetailsMap() // store cart details from db in existingCartDetailsMap. this map will be updated when adding new entry to the db.
  }
  if (
    action.value === 'overviewModal' ||
    localStorage.getItem('pageAction') === 'overviewModal'
  ) {
    openCartOverviewModal()
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal" :closeBtn="false">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none col-auto">会計項目の選択
      </q-toolbar-title>
      <div class="flex items-center">
        <q-btn flat dense class="q-ml-md body1 regular text-blue" @click="openUpdateCustomerModal">
          {{ allRequests.name_customer }}
        </q-btn>
        <q-icon size="13px" name="circle" color="red" />
        <span class="q-ml-md text-grey-900 body1 regular">リクエスト番号:</span>
        <q-btn flat dense class="body1 regular text-blue text-underline" @click="openRequestDetail">
          {{ allRequests.number_request }}
        </q-btn>
        <span class="q-ml-md">
          <q-chip class="bg-light-blue caption1 bold q-px-lg" text-color="white">窓口</q-chip>
        </span>
      </div>
      <q-space></q-space>
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="bg-grey-100 q-pa-lg">
        <div class="flex items-center justify-between">
          <div class="caption2 regular text-grey-600">
            会計対象にする項目を確認して、会計を作成してください。
          </div>
          <q-btn padding="4px 47px" unelevated color="primary" text-color="white" 
            @click="openCartOverviewModal">
            <q-icon size="20px" name="add" />
            会計作成
          </q-btn>
        </div>
        <div class="bg-white q-pa-md q-my-md">
          <div v-for="data in allRequests.pets" :key="data.pet.id_pet" class="q-mb-xs">
            <div class="flex items-center">
              <div class="body2 bold text-grey-900">
                {{ data.pet.name_pet }}
              </div>
              <div class="q-ml-md">
                <q-btn flat dense class="caption1 regular text-blue text-underline"
                  @click="openUpdatePetInsuranceInfoModal">
                  {{ data.pet.id_insurance_plan }}
                </q-btn>
              </div>
            </div>
            <!-- <div class="body2 regular text-grey-900 q-mb-xs">2023/07/05</div> -->
            <div>
              <q-checkbox v-for="v in data.serviceDetails" :key="v.key" class="q-mb-sm info-checkbox" size="38px"
                :model-value="!v.flg_non_charge" @update:model-value="(e) => (v.flg_non_charge = !e)">
                <q-card class="bg-grey-100 q-ml-md service-detail" flat>
                  <q-card-section>
                    <div class="row justify-between items-center">
                      <div class="col-11">
                        <div class="body1 bold text-blue text-underline q-mb-xs">
                          {{ v.name_item_service }}
                        </div>
                        <div class="caption2 regular text-grey-700 flex items-center">
                          {{
                            v.id_category1
                            ? typeCategoryName(v.id_category1)
                            : '-'
                          }}
                          <q-icon name="arrow_right" class="q-mx-sm" />
                          {{
                            v.id_category2
                            ? typeCategoryName(v.id_category2)
                            : '-'
                          }}
                        </div>
                        <p class="caption2 regular text-grey-700 q-mb-none">
                          {{ v.memo_service }}
                        </p>
                      </div>
                      <div class="col-1">
                        <span class="body1 regular text-grey-900">{{
                          v.quantity
                        }}</span>
                        <span class="caption1 regular text-grey-900 q-pl-sm">{{
                          v.id_unit
                        }}</span>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-checkbox>
            </div>
            <div>
              <q-checkbox v-for="v in data.prescriptions" :key="v.key" class="q-mb-sm info-checkbox" size="38px"
                :model-value="v.flg_non_charge" @update:model-value="(e) => (v.flg_non_charge = e)">
                <q-card class="bg-grey-100 q-ml-md prescription-detail" flat>
                  <q-card-section>
                    <div class="row justify-between items-center">
                      <div class="col-11">
                        <div class="body1 bold text-blue text-underline q-mb-xs">
                          {{ v.name_prescription }}
                        </div>
                        <div class="caption2 regular text-grey-700 flex items-center">
                          {{
                            v.id_category1
                            ? typeCategoryName(v.id_category1)
                            : '-'
                          }}
                          <q-icon name="arrow_right" class="q-mx-sm" />
                          {{
                            v.id_category2
                            ? typeCategoryName(v.id_category2)
                            : '-'
                          }}
                        </div>
                        <p class="caption2 regular text-grey-700 q-mb-none">
                          {{ v.id_dose }}
                        </p>
                        <p class="caption2 regular text-grey-700 q-mb-none">
                          {{ v.date_start }}～ {{ v.date_end }}
                          {{ v.date_dose }}
                        </p>
                      </div>
                      <div class="col-1">
                        <span class="body1 regular text-grey-900">{{
                          v.total_dose_days
                        }}</span>
                        <span class="caption1 regular text-grey-900 q-pl-sm">{{
                          v.id_unit
                        }}</span>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </q-checkbox>
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
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.info-checkbox {
  width: 100%;

  :deep(.q-checkbox__label) {
    width: 100%;
  }
}

.service-detail {
  border-left: 6px solid $blush;
}

.prescription-detail {
  border-left: 6px solid $sky-blue;
}

.task {
  border-left: 6px solid $tosca;
}
</style>
