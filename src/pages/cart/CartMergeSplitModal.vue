<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCustomerStore from '@/stores/customers'
import useCartStore from '@/stores/carts'
import { storeToRefs } from 'pinia'

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })

const customerStore = useCustomerStore()
const cartStore = useCartStore()

const { getCustomer } = storeToRefs(customerStore)
const { getCart } = storeToRefs(cartStore)

const closeModal = () => {
  emits('close')
}
const selectedAccounts = ref([])

const validationMessage = ref('')
const isFormValid = ref(true)

const validateForm = () => {
  // Check if at least one pet has the existing cart (会計 1) selected
  const hasExistingCartSelected = selectedAccounts.value.includes(
    currentLabel.value
  )
  isFormValid.value = hasExistingCartSelected

  if (!hasExistingCartSelected) {
    validationMessage.value = '分割元の会計が空になるため、分割できません。'
  } else {
    validationMessage.value = '' // Reset message if validation passes
  }

  return hasExistingCartSelected
}

const constructPayload = () => {
  return pets.value.reduce((acc, pet, index) => {
    const selectedCH = selectedAccounts.value[index]
    const isExisting = selectedCH === currentLabel.value
    const targetCartType = isExisting ? 'existing' : 'new'

    if (!acc[selectedCH]) {
      acc[selectedCH] = {
        target_cart_type: targetCartType,
        data: []
      }
    }
    acc[selectedCH].data.push({
      id_pet: pet.id_pet,
      name_pet: pet.name_pet,
      selected_ch: selectedCH
    })

    return acc
  }, {})
}

const handleSubmit = async () => {
  if (!validateForm()) {
    // Prevent form submission if validation fails
    return
  }

  // Proceed with form submission if validation passes
  const formData = constructPayload()

  // Check if any group is marked as 'new'
  const containsNewCart = Object.values(formData).some(
    (group) => group.target_cart_type === 'new'
  )

  if (!containsNewCart) {
    closeModal() // Exit the function if no new carts need to be created
  }

  await cartStore.splitCart(getCart.value?.id_cart, formData)
  await cartStore.fetchCart(getCart.value?.id_cart)
  closeModal()
}

const pets = computed(() => {
  const petIds = getCart.value?.id_pet.split(',')
  if (getCustomer.value && getCustomer.value.pets) {
    return getCustomer.value?.pets
      .filter((pet) => petIds.includes(pet.id_pet.toString()))
      .map((pet) => {
        return { id_pet: pet.id_pet, name_pet: pet.name_pet }
      })
  }
  return []
})

// Computed property to extract current label
const currentLabel = computed(() => {
  const currentCart = props.data.find((d) => d.isCurrent)
  return currentCart ? currentCart.label : '会計 1'
})

// Dynamic dropdown options based on pets count and current cart label
const dropdownOptions = computed(() => {
  let options = [currentLabel.value] // Include current cart label
  const lastLabelNum =
    parseInt(props.data.slice(-1)[0].label.split(' ')[1]) || 1
  const nextAvailableNum = lastLabelNum + 1

  // Generate new options based on the number of pets
  for (let i = 0; i < pets.value.length; i++) {
    options.push(`会計 ${nextAvailableNum + i}`)
  }

  return options
})

onMounted(async () => {
  if (getCustomer.value?.id_customer != getCart.value?.id_customer) {
    await customerStore.selectCustomer(getCart.value?.id_customer, true)
  }
  selectedAccounts.value = pets.value.map(() => currentLabel.value)
})
</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="false">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        会計の分割・統合
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="q-px-lg">
      <div class="flex column justify-center full-height">
        <div
          v-for="(pet, index) in pets"
          :key="pet.id_pet"
          class="row items-center justify-center q-mb-md"
        >
          <div class="col-lg-4 col-md-4 col-sm-12">
            <div class="body1 regular text-grey-700">{{ pet.name_pet }}</div>
          </div>
          <div class="col-lg-8 col-md-8 col-sm-12" tabindex="1">
            <MtFormPullDown
              type="selection"
              v-model="selectedAccounts[index]"
              :options="dropdownOptions"
              :clearable="false"
              autofocus
            />
          </div>
        </div>
        <div v-if="!isFormValid" class="text-center text-red q-py-md">
          {{ validationMessage }}
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
