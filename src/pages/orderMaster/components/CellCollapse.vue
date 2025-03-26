<script setup lang="ts">
// Vue core imports
import { defineProps, ref, withDefaults, defineEmits } from 'vue'

// Component imports
import SmallPocketList from '@/components/PocketList/SmallPocketList.vue'

// Utility imports
import {
  aahUtilsGetEmployeeName,
  getDateByFormat,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'

// Store import
import useEmployeeStore from '@/stores/employees'

// Initialize store
const employeeStore = useEmployeeStore()

// Props with default values
const props = withDefaults(
  defineProps<{
    collapseAll: boolean
    showCollapseToggle: boolean
    cellData: any
    mode: 'request' | 'cart' | 'payment'
  }>(),
  {
    collapseAll: false,
    showCollapseToggle: true,
    cellData: null,
    mode: 'request'
  }
)

// Emits
const emit = defineEmits<{
  (e: 'openTarget', value: { type: string; id: string; data: object }): void
  (e: 'openPocketList', value: { type: string; id: string | number }): void
}>()

// Reactive states
const collapse = ref(false)
const collapsedCarts = ref<{ [key: string]: boolean }>({})

// Methods
const toggleRow = () => {
  collapse.value = !collapse.value
}

const toggleCartCollapse = (cartId: string) => {
  collapsedCarts.value[cartId] = !collapsedCarts.value[cartId]
}

const openTarget = (itemNumber: string, id: string, data: object = {}) => {
  if (itemNumber.startsWith('RQ')) {
    emit('openTarget', { type: 'request', id })
  } else if (itemNumber.startsWith('CT')) {
    emit('openTarget', { type: 'cart', id, data })
  } else if (itemNumber.startsWith('PR')) {
    emit('openTarget', { type: 'payment', id })
  }
}

const getEmployeeName = (id_employee: string | number) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}

const getTypeForPocket = (data: Record<string, any>) => {
  if (data.id_service_detail) return 'service'
  if (data.id_prescription_detail) return 'prescription'
  if (data.id_inject_detail) return 'inject'
  return 'other'
}
</script>


<template>
  <div class="flex gap-2 items-start">
    <!-- Parent Collapse Toggle -->
    <q-btn
      v-if="
        props.showCollapseToggle &&
        !props.collapseAll &&
        props.mode === 'request'
      "
      flat
      dense
      round
      :icon="collapse ? 'keyboard_arrow_right' : 'keyboard_arrow_down'"
      @click="toggleRow"
    ></q-btn>
    <div class="cell-collapse-class">
      <!-- Request Mode -->
      <div v-if="props.mode === 'request' && props.cellData">
        <div class="request-header">
          <span
            class="text-blue text-h5 cursor-pointer"
            @click="
              openTarget(
                props.cellData.number_request,
                props.cellData.id_request
              )
            "
          >
            {{ props.cellData.number_request }}
          </span>
          <div class="flex gap-4">
            <span>{{ props.cellData.date_request_start }}</span>
            <span>{{
              getEmployeeName(props.cellData?.id_employee_doctor)
            }}</span>
          </div>
        </div>
        <div
          v-if="!collapse && !props.collapseAll"
          v-for="(petGroup, petId) in props.cellData.groupedData"
          :key="petId"
          class="pet-group"
        >
          <div class="flex items-center gap-2">
            <img
              v-if="petGroup.pet"
              :src="getPetImageUrl(petGroup.pet)"
              @error="handleImageError($event, petGroup.pet)"
              class="thumbnail"
            />
            <span v-if="petGroup.pet?.name_pet">{{
              petGroup.pet.name_pet
            }}</span>
          </div>
          <template v-for="(details, date) in petGroup.dates">
            <div>
              <p class="q-ma-none bg-grey-100 q-pa-sm">{{ date }}</p>
              <SmallPocketList
                v-for="(pocketData, index) in details"
                :key="index"
                :type="pocketData.type"
                :pocket-data="pocketData"
                @open-pocket-list="(value) => emit('openPocketList', value)"
              />
            </div>
          </template>
        </div>
      </div>

      <!-- Cart Mode -->
      <div v-else-if="props.mode === 'cart'">
        <!-- Check if cart data exists -->
        <template v-if="props.cellData && props.cellData.length > 0">
          <div
            v-for="(cart, index) in props.cellData"
            :key="cart.id_cart"
            class="cart-section"
          >
            <!-- Horizontal Separator -->
            <div v-if="index > 0" class="horizontal-separator"></div>

            <!-- Cart Header -->
            <div class="flex items-center justify-between">
              <!-- Left Section -->
              <div class="flex items-center">
                <q-btn
                  v-if="!props.collapseAll"
                  flat
                  dense
                  round
                  :icon="
                    collapsedCarts[cart.id_cart] || props.collapseAll
                      ? 'keyboard_arrow_right'
                      : 'keyboard_arrow_down'
                  "
                  @click="toggleCartCollapse(cart.id_cart)"
                ></q-btn>
                <span
                  class="text-blue text-h5 cursor-pointer q-ml-sm"
                  @click="openTarget(cart.number_cart, cart.id_cart, cart)"
                >
                  {{ cart.number_cart }}
                </span>
              </div>

              <!-- Right Section -->
              <span class="text-h5">¥{{ cart.bill }}</span>
            </div>

            <!-- Cart Additional Info -->
            <div class="flex gap-4">
              <span>{{
                cart.date_cart ? getDateByFormat(cart.date_cart) : null
              }}</span>
              <span>{{ getEmployeeName(cart?.id_employee_cart) }}</span>
            </div>

            <!-- Cart Details (Grouped by Pet and Date) -->
            <div
              v-if="!collapsedCarts[cart.id_cart] && !props.collapseAll"
              v-for="(petGroup, petId) in cart.groupedData"
              :key="petId"
              class="pet-group"
            >
              <div class="flex items-center gap-2">
                <img
                  v-if="petGroup.pet"
                  :src="getPetImageUrl(petGroup.pet)"
                  @error="handleImageError($event, petGroup.pet)"
                  class="thumbnail"
                />
                <span v-if="petGroup.pet?.name_pet">{{
                  petGroup.pet.name_pet
                }}</span>
              </div>
              <template v-for="(details, date) in petGroup.dates">
                <div>
                  <p class="q-ma-none bg-grey-100 q-pa-sm">{{ date }}</p>
                  <SmallPocketList
                    v-for="(pocketData, index) in details"
                    :key="index"
                    :type="getTypeForPocket(pocketData)"
                    :pocket-data="pocketData"
                    mode="cart"
                    @open-pocket-list="(value) => emit('openPocketList', value)"
                  />
                </div>
              </template>
            </div>
          </div>
        </template>

        <!-- Show message if no cart records exist -->
        <template v-else>
          <span class="text-grey-600">なし</span>
        </template>
      </div>

      <!-- Payment Mode -->
      <div v-else-if="props.mode === 'payment'">
        <!-- Check if payment data exists -->
        <template v-if="props.cellData && props.cellData.length > 0">
          <div
            v-for="(payment, index) in props.cellData"
            :key="payment.id_payment"
            class="payment-section"
          >
            <!-- Horizontal Separator -->
            <div v-if="index > 0" class="horizontal-separator"></div>

            <!-- Payment Header -->
            <div class="flex justify-between">
              <!-- Payment Number -->
              <span
                class="text-blue text-h5 cursor-pointer"
                @click="openTarget(payment.number_payment, payment.id_payment)"
              >
                {{ payment.number_payment }}
              </span>

              <!-- Payment Amount -->
              <span class="text-h5">¥{{ payment.amount_payment }}</span>
            </div>

            <!-- Payment Additional Info -->
            <div class="flex gap-4">
              <span>{{
                payment.datetime_payment
                  ? getDateByFormat(payment.datetime_payment)
                  : null
              }}</span>
              <span>{{ payment.type_payment_method_name }}</span>
              <!-- <span>{{ payment.type_payment_method === 1 ? '現金' : 'Other' }}</span> -->
            </div>
          </div>
        </template>

        <!-- Show message if no payment records exist -->
        <template v-else>
          <span class="text-grey-600">なし</span>
        </template>
      </div>

      <!-- Handle cases where cellData is null -->
      <div v-else>
        <span class="text-grey-600">なし</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.cell-collapse-class {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 90%;
}
.pet-group {
  margin-top: 10px;
  padding-left: 10px;
  border-left: 3px solid #ccc;
}
.thumbnail {
  width: 40px;
  border-radius: 100%;
}
.horizontal-separator {
  border-top: 1px solid #ccc;
  margin: 30px 0 20px;
}
</style>
