<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { formatDate, getCurrentPetAge, getFullPetName } from '@/utils/aahUtils'
import { typePetGender } from '@/utils/enum'
import useCommonStore from '@/stores/common'
import useCustomerStore from '@/stores/customers'

const props = defineProps<{
  data: {
    id_customer: string
    id_pet: string
  }
}>()

const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const isLoading = ref(true)

// Get customer and pet data using IDs from data
const customerData = computed(() => {
  return customerStore.customer || null
})

const petData = computed(() => {
  return customerStore.pet || null
})
// Load initial data
onMounted(async () => {
  try {
    await customerStore.selectCustomer(props.data.id_customer)
    customerStore.selectPet(props.data.id_pet)
  } finally {
    isLoading.value = false
  }
})

const typeGenderName = (value: number) => {
  const petGender = typePetGender.find((v) => v.value === value)
  if (petGender) {
    return petGender.label
  }
}

const breedName = (value: number) => {
  const breedByIdCommon = commonStore.getCommonBreedOptionList.find(
    (v: { id_common: number }) => v.id_common === value
  )
  if (breedByIdCommon) {
    return breedByIdCommon.name_common
  }
}

const petName = computed(() => {
  if (!customerData.value?.name_kana_family || !petData.value?.name_kana_pet) return ''
  return `${customerData.value.name_kana_family} ${petData.value.name_kana_pet}`
})

const petProfile = computed(() => {
  if (!petData.value || !customerData.value) return ''
  const petGender = typeGenderName(petData.value.type_pet_gender)
  const petBreed = breedName(petData.value.id_cm_breed)
  return `/ ${petGender} / ${petBreed}`
})
</script>

<template>
  <section v-if="!isLoading && customerData && petData" class="text-grey-900 title2 bold">
    <div class="text-body2 text-grey-500 ellipsis pet-name">
      {{ petName }}
      <span v-if="petData?.date_birth" class="text-body2 q-ml-sm">
        <span class="gt-xs lt-lg">{{ `誕 ${formatDate(petData.date_birth)}` }}</span>
      </span>
      <span
        v-if="petData && !petData.flg_pet_excluded && !petData.flg_deceased"
        class="text-body2 q-ml-sm gt-xs lt-lg"
      >
        （年齢：{{ getCurrentPetAge(petData) }}）
      </span>
    </div>
    <div class="ellipsis pet-kana-name">
      <span v-if="customerData.name_kana_family && petData">
        {{ getFullPetName(petData, customerData) }}
      </span>
      <span v-if="petProfile" class="text-body2 q-ml-sm">
        {{ petProfile }}
        <span v-if="petData?.date_birth" class="gt-md">
          {{ ` / 誕 ${formatDate(petData.date_birth)}` }}
        </span>
      </span>
      <span
        v-if="petData && !petData.flg_pet_excluded && !petData.flg_deceased"
        class="text-body2 q-ml-sm gt-md"
      >
        （年齢：{{ getCurrentPetAge(petData) }}
      </span>
    </div>
  </section>
</template>