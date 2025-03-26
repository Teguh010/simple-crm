<script lang="ts" setup>
import useEmployeeStore from '@/stores/employees'
import { getCustomerName } from '@/utils/aahUtils'
import { computed, onMounted } from 'vue'

const employeeStore = useEmployeeStore()
const emits = defineEmits(['update:modelValue', 'update:employeeName', 'click'])
const props = defineProps({
  modelValue: {
    type: [String, Boolean, Array, Object, Number],
    default: null
  },
  employeeName: String,
  typeOccupation: String,
  outlined: Boolean,
  bgColor: String,
  label: String,
  placeholder: String,
  rules: Array,
  disable: Boolean,
  pattern: String,
  color: String,
  labelColor: String,
  classStyle: String,
  autogrow: Boolean,
  lazyRules: Boolean,
  iconPrepend: String,
  iconAppend: String,
  multiple: Boolean,
  optionLabel: String,
  optionValue: String,
  after: String,
  idEmployee: String,
  required: Boolean,
  defaultBlank: {
    type: Boolean,
    default: false
  }
})
const changeValueData = (value: any) => {
  if (props.employeeName) {
    let employee_name
    switch (props.typeOccupation) {
      case 'doctor':
        const docEmployee = employeeStore.getDoctors.find(
          (v) => v.id_employee === value
        )
        employee_name = getCustomerName(docEmployee)
        break

      case 'staff':
        const staEmployee = employeeStore.getNonDoctors.find(
          (v) => v.id_employee === value
        )
        employee_name = getCustomerName(staEmployee)
        break
      case 'cart-approver':
        const cartEmployee = employeeStore.getCartApprovers.find(
          (v) => v.id_employee === value
        )
        employee_name = getCustomerName(cartEmployee)
        break
    }
    emits('update:employeeName', employee_name)
  }
  emits('update:modelValue', value)
}
const options = computed(() => {
  return props.typeOccupation === 'doctor'
    ? employeeStore.getDoctors
    : props.typeOccupation === 'staff'
    ? employeeStore.getNonDoctors
    : props.typeOccupation === 'cart-approver'
    ? employeeStore.getCartApprovers
    : employeeStore.getEmployees
})

// Computed property for Required conditional class
const requiredClass = computed(() => {
  if (props.required) {
    // When the selection is required, check if a valid selection is made
    // Assuming that an invalid or empty selection is represented by null, undefined, or an empty string
    const isValidSelection =
      props.modelValue !== null &&
      props.modelValue !== undefined &&
      props.modelValue !== ''

    // If the selection is not valid, apply 'bg-accent-050' class
    return !isValidSelection ? 'bg-accent-050' : ''
  } else {
    // If not required, don't apply the class
    return ''
  }
})

onMounted(() => {
  let user

  switch (props.typeOccupation) {
    case 'doctor':
      if (props.idEmployee)
        user = employeeStore.getDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
      else if (localStorage.getItem('id_employee'))
        user = employeeStore.getDoctors.find(
          (v) =>
            v.id_employee === JSON.parse(localStorage.getItem('id_employee'))
        )
      else
        user = employeeStore.getDoctors[0]
      break

    case 'staff':
      if (props.idEmployee)
        user = employeeStore.getNonDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
      else if (localStorage.getItem('id_employee'))
        user = employeeStore.getNonDoctors.find(
          (v) =>
            v.id_employee === JSON.parse(localStorage.getItem('id_employee'))
        )
      else
        user = employeeStore.getNonDoctors[0]
      break

    case 'cart-approver':
      if (props.idEmployee)
        user = employeeStore.getCartApprovers.find(
          (v) => v.id_employee === props.idEmployee
        )
      else if (localStorage.getItem('id_employee'))
        user = employeeStore.getCartApprovers.find(
          (v) =>
            v.id_employee === JSON.parse(localStorage.getItem('id_employee'))
        )
      else
        user = employeeStore.getCartApprovers[0]
      break
      
    default:
      if (props.idEmployee)
        user = employeeStore.getDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
      else if (localStorage.getItem('id_employee'))
        user = employeeStore.getEmployees.find(
          (v) =>
            v.id_employee === JSON.parse(localStorage.getItem('id_employee'))
        )
      break
  }
  if (user && !props.defaultBlank) emits('update:modelValue', user.id_employee)
})
</script>
<template>
  <q-select
    :outlined="props.outlined"
    dense
    :model-value="props.modelValue"
    :label="props.label ? props.label : '担当獣医師'"
    :multiple="props.multiple"
    stack-label
    @update:model-value="changeValueData"
    :use-input="props.modelValue ? false : true"
    :options="options"
    :placeholder="props.placeholder"
    :lazy-rules="props.lazyRules"
    :rules="props.rules ? props.rules : []"
    :option-label="(v) => (v ? v.name_display : '')"
    option-value="id_employee"
    emit-value
    map-options
    :color="props.color"
    :disable="props.disable"
    :class="[requiredClass]"
    class="clear-icon"
    ref="MtInputFormRef"
    v-bind="$attrs"
    :clearable="true"
  >
    <!--:option-label="(v) => v ? v.name_family + ' ' + v.name_first : ''"-->
    <template v-if="iconPrepend" v-slot:prepend>
      <q-icon size="18px" :name="iconPrepend" />
    </template>
    <template v-if="iconAppend" v-slot:append>
      <q-icon size="18px" :name="iconAppend" />
    </template>
    <template v-slot:after v-if="after">
      <span class="people">{{ after }}</span>
    </template>
  </q-select>
</template>

<style scoped lang="scss">
.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
</style>
