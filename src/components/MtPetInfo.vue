<script setup lang="ts">
import { computed } from 'vue'
// Store
import useCommonStore from '@/stores/common'
import useCustomerStore from '@/stores/customers'
// Utils
import { formatDate, getCurrentPetAge, getFullPetName } from '@/utils/aahUtils'
import { typePetGender } from '@/utils/enum'

const customerStore = useCustomerStore()
const customerInfo = computed(() => {
  return customerStore.getCustomer
})
const petInfo = computed(() => {
  return customerStore.getPet
})

const typeGenderName = (value: number) => {
  const petGender = typePetGender.find((v) => v.value === value)
  if (petGender) {
    return petGender.label
  }
}

const commonStore = useCommonStore()
const breedName = (value: number) => {
  const breedByIdCommon = commonStore.getCommonBreedOptionList.find(
    (v: { id_common: number }) => v.id_common === value
  )
  if (breedByIdCommon) {
    return breedByIdCommon.name_common
  }
}

const petName = computed(() => {
  if (petInfo.value && customerInfo.value && customerInfo.value.name_kana_family) {
    const customerKanaFamily = customerInfo.value.name_kana_family
    const petKana = petInfo.value.name_kana_pet
   
    return `${customerKanaFamily} ${petKana}`
  }

  return ''
})

const petProfile = computed(() => {
  if (petInfo.value && customerInfo.value) {
    const petGender = typeGenderName(petInfo.value.type_pet_gender)
    const petBreed = breedName(petInfo.value.id_cm_breed)

    return `/ ${petGender} / ${petBreed}`
  }

  return ''
})
</script>

<template>
  <section v-if="customerInfo && petInfo" class="text-grey-900 title2 bold">
    <div class="text-body2 text-grey-500 ellipsis pet-name">
      {{ petName }}
      <span class="text-body2 q-ml-sm">
        <span class="gt-xs lt-lg">{{ `誕 ${formatDate(petInfo.date_birth)}` }}</span>
      </span>
      <span
        v-if="!petInfo.flg_pet_excluded && !petInfo.flg_deceased"
        class="text-body2 q-ml-sm gt-xs lt-lg"
      >
        （年齢：{{ getCurrentPetAge(petInfo) }}）
      </span>
    </div>
    <div class="ellipsis pet-kana-name">
      <span v-if="customerInfo.name_kana_family">
        {{ getFullPetName(petInfo, customerInfo) }}
      </span>
      <span class="text-body2 q-ml-sm">
        {{ petProfile }}
        <span class="gt-md">{{ ` / 誕 ${formatDate(petInfo.date_birth)}` }}</span>
      </span>
      <span
        v-if="!petInfo.flg_pet_excluded && !petInfo.flg_deceased"
        class="text-body2 q-ml-sm gt-md"
      >
        （年齢：{{ getCurrentPetAge(petInfo) }}）
      </span>
    </div>
  </section>
</template>

<style scoped></style>
