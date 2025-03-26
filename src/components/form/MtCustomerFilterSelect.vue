<script setup lang="ts">
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import { ValidationRule } from 'quasar';
import { ref, computed, onMounted, reactive } from 'vue'

const customerStore = useCustomerStore()

const props = withDefaults(
  defineProps<{
    label: string
    outlined?: boolean
    selecting: number | string,
    rules?: ValidationRule[],
    required?: boolean
  }>(),
  {
    label: '診察券番号・オーナー名',
    outlined: false,
    selecting: '',
    rules: () => {
      return [] as ValidationRule[]
    },
    required: false
  }
)

const customerList = ref([])
const customerListDefault = reactive([])

const emit = defineEmits(['update:selecting', 'selected'])

const modelValue = computed({
  get: () => {
    return props.selecting
  },
  set: (val) => {
    emit('update:selecting', val)
  }
})

const updateModelValue = (value: any = '') => {

  emit('selected', value)
}
onMounted(() => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
})
</script>

<template>
  <MtFilterSelect
    :options-default="customerListDefault"
    v-model:options="customerList"
    v-model:selecting="modelValue"
    @update:selecting="updateModelValue"
    :label="props.label"
    :outlined="outlined"
    :rules="(props.rules && props.rules?.length) > 0 ? props.rules : []"
  >
    </MtFilterSelect>
</template>

<style scoped lang="scss"></style>
