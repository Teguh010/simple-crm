<script lang="ts" setup>
import useAddressesStore from '@/stores/addresses'
import aahValidations from '@/utils/aahValidations';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, watch } from 'vue'

const addressStore = useAddressesStore()
// const { getZipCode } = storeToRefs(addressStore)
const _zipCode = computed(() => addressStore.zipCode)

const emits = defineEmits(['update:selecting', 'changeZipCode', 'click'])
const props = defineProps({
  selecting: {
    type: [String, Boolean, Array, Object, Number],
    default: null
  },
  required: Boolean,
  label: String,
  defaultBlank: {
    type: Boolean,
    default: false
  }
})
const filterZipCode = (val, update) => {
  // Function for filtering the zip code list
  update(async () => {
    if (val?.length >= 3) {
      const zipCode = val?.replace('-', '')
      await addressStore.fetchZipCode(zipCode)
    }
  })
}
const options = computed(() => _zipCode.value?.map((v) => ({ ...v, label: v.address_prefecture + ' ' + v.address_city + ' ' + v.address_other })))

const modelValue = computed({
  get: () => {
    return props.selecting
  },
  set: (val) => {
    if (val) {
      // Apply adding "-"" at zip code
      let numbers = val.zip_code?.replace(/\D/g, '')
      if (numbers.length > 3) numbers = numbers.slice(0, 3) + '-' + numbers.slice(3)
      emits('changeZipCode', val)
      emits('update:selecting', numbers)
    }
  }
})
// Computed property for Required conditional class
const requiredClass = computed(() => {
  if (props.required) {
    // When the selection is required, check if a valid selection is made
    // Assuming that an invalid or empty selection is represented by null, undefined, or an empty string
    const isValidSelection =
      modelValue.value !== null &&
      modelValue.value !== undefined &&
      modelValue.value !== ''

    // If the selection is not valid, apply 'bg-accent-050' class
    return !isValidSelection ? 'bg-accent-050' : ''
  } else {
    // If not required, don't apply the class
    return ''
  }
})
onMounted(() => {
  nextTick(async () => {
    if (props.selecting) {
      // Call fetch zip code if there's a zip code on the data
      const zipCode = props.selecting.replace('-', '')
      await addressStore.fetchZipCode(zipCode)
    }
  })
})
</script>
<template>
  <q-select
    v-model="modelValue"
    use-input
    dense
    hide-selected
    fill-input
    map-options
    emit-value
    :options="options"
    @filter="filterZipCode"
    :label="props.label"
    class="q-pa-none"
    :class="[requiredClass]"
  >
    <template v-slot:selected-item="scope">
      <!-- This slot allows custom display of the selected item -->
      <div>{{ scope }}</div>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey">
          No results
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
