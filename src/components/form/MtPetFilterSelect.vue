<script setup lang="ts">

import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import { computed, reactive, ref, watch } from 'vue'
import { getFullPetNameWithoutHonorific } from '@/utils/aahUtils'
import { PetType } from '@/types/types'

const props = withDefaults(defineProps<{
  petList: PetType[],
  label:string,
  outlined?:boolean,
  selecting:number | string | object
  disable?: boolean
  readonly? : boolean
  required?: boolean
}>(),{
  petList : [],
  label: 'ペット',
  outlined : false,
  selecting:'',
  disable:false,
  readonly : false,
  required: false
})

const customerStore = useCustomerStore()
const { getCustomer } = storeToRefs(customerStore)

const emit = defineEmits([
  'update:selecting',
  'selected',
  'update:petList'
])

const petListDefault: PetType[] = reactive([])
const petListOption = ref<PetType[]>([])

petListDefault.push(...props.petList)
petListOption.value = [...props.petList]

const modelValue = computed({
  get: () => {
    return props.selecting
  },
  set: (val) => {
    emit('update:selecting', val)
  }
})

function filterorOptions(val: any) {
  //入力値が無かった時、選択肢を初期化
  if (val == '' || val == null) {
    petListOption.value.length = 0
    //初期化
    petListDefault.forEach((option: any) => {
      petListOption.value.push(option)
    })
    emit('update:selecting', '')
    return emit('update:petList', petListOption.value)
  }
  const inputValue = `${val}`.toLowerCase()
  emit(
    'update:petList',
    petListDefault.filter((option) => 
      option.label && option.label.toLowerCase().includes(inputValue)
    )
  )
}

//入力不可もしくは読み取り専用なら灰色にする
function disableColor() {
  if (props.disable || props.readonly) {
    return true
  } else {
    return false
  }
}

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

const optionLabel = (v) => {
  if (v) {
    if (v.customer_name_family) return getFullPetNameWithoutHonorific(v) + ' : ' + v.code_pet
   if(v.name_pet) return v.name_pet + ' : ' + v.code_pet
    return v.label
  }
  return ''
}


function updateModelValue(value: number) {
  emit('selected', value)
}
watch(() => props.petList,()=>{
  petListDefault.length = 0
  petListOption.value.length = 0
  const filteredList = props.petList.filter(item => !item.flg_delete_by_customer && !item.flg_deceased)
  petListDefault.push(...filteredList)
  petListOption.value = [...filteredList]
})

</script>

<template>
  <q-select
    :outlined="props.outlined"
    v-model="modelValue"
    :label="props.label"
    use-input
    hide-selected
    fill-input
    input-debounce="0"
    @input-value="filterorOptions"
    @update:model-value="updateModelValue"
    :options="petListDefault"
    :option-label="optionLabel"
    map-options
    emit-value
    :readonly="props.readonly ? true : false"
    :disable="props.disable ? true : false"
    dense
    :class="[{ 'disable-color': disableColor() }, requiredClass]"
    hide-bottom-space
    class="clear-icon"
    :input-style="{paddingLeft: '6px'}"
  >
    <template v-if="selecting !== '' && selecting !== null && !props.readonly && !props.disable" v-slot:append>
      <q-icon name="cancel" @click.stop.prevent="selecting = null" class="cursor-pointer clear-icon" size="18px"></q-icon>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section class="text-grey"> No results </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<style scoped lang="scss">
.disable-color {
  background: $disablebtnPulldownBackgroundColor;
}
.clear-icon {
 color: $grey-400;
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
</style>