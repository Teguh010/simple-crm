<script lang="ts" setup>
import useEmployeeStore from '@/stores/employees'
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { QSelect, ValidationRule } from 'quasar'
import { CliCommon, EmployeeType } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import dayjs from 'dayjs'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { orderBy, sortBy } from 'lodash'

const cliCommonStore = useCliCommonStore()
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const employeeStore = useEmployeeStore()
const { getEmployees } = storeToRefs(employeeStore)

const emit = defineEmits([
  'update:selected',
  'update:modelValue',
  'click',
  'update:selectDefaultEmployee'
])

const props = withDefaults(
  defineProps<{
    selected?: string | number
    employeeName?: string
    typeOccupation?: string
    outlined?: boolean
    bgColor?: string
    label?: string
    placeholder?: string
    rules?: Array<ValidationRule>
    disable?: boolean
    readonly?: boolean
    pattern?: string
    color?: string
    labelColor?: string
    classStyle?: string
    autogrow?: boolean
    lazyRules?: boolean
    iconPrepend?: string
    iconAppend?: string
    multiple?: boolean
    optionLabel?: string
    optionValue?: string
    after?: string
    idEmployee?: string | number
    required?: boolean
    showSelectDefaultEmployee?: boolean
    clearable?: boolean
    defaultBlank?: boolean
    popupContentStyle?: string
    departmentSelected?: string
  }>(),
  {
    selected: '',
    employeeName: '',
    typeOccupation: '',
    outlined: false,
    bgColor: '',
    label: '',
    placeholder: '',
    rules: () => {
      return [] as ValidationRule[]
    },
    disable: false,
    readonly: false,
    pattern: '',
    color: '',
    labelColor: '',
    classStyle: '',
    autogrow: false,
    lazyRules: false,
    iconPrepend: '',
    iconAppend: '',
    multiple: false,
    optionLabel: '',
    optionValue: '',
    after: '',
    idEmployee: '',
    required: false,
    showSelectDefaultEmployee: false,
    clearable: true,
    defaultBlank: false,
    popupContentStyle: ''
  }
)

const computedEmployees = computed(() => employeeStore.getEmployees)
const sortEmpList = computed(() => {
  let arrangeEmpList: {
    label: any
    value: null | string
    code_func1: any
    groupLabel: string
    disable: boolean
    type_department: any
    display_order: number
  }[] = []

  const filteredDepartments = orderBy(getCliCommonTypeDepartmentList.value
    .filter((p) => dayjs(p.date_end).isSame(dayjs('9999/12/31'), 'year'))
    .map((obj: CliCommon) => {
      return {
        label: obj.name_cli_common,
        value: obj.code_func1,
        display_order: obj.display_order,
        type_department: parseInt(obj.code_func1)
      }
    }), 'display_order')

  const filteredEmployees = orderBy(computedEmployees.value
    .filter((emp: EmployeeType) => !emp.flg_delete)
    .filter((emp: EmployeeType) => {
      switch (props.typeOccupation) {
        case 'doctor':
          return emp.type_occupation === 1
        case 'cart-approver':
          return Boolean(emp.flg_cart_approver)
        case 'staff':
          return ![1000, 1107].includes(emp.type_occupation)
        default:
          return true
      }
    })
    .filter((obj: EmployeeType) => {
      if (props.departmentSelected)
        return obj.type_department == parseInt(props.departmentSelected)
      else return true
    })
    .map((obj: EmployeeType) => ({
      label: obj.name_display,
      value: obj.id_employee,
      type_department: obj.type_department,
      display_order: obj.display_order
    })), 'display_order')

  filteredDepartments.forEach((department) => {
    const availableEmployeeInDepartment = filteredEmployees.filter(
      (employee) => employee.type_department === department.type_department
    )

    if (availableEmployeeInDepartment.length > 0) {
      arrangeEmpList.push({
        label: department.label,
        value: '!@#$%^&*()', // to prevent selecting first one by default on remove
        groupLabel: department.label,
        disable: true,
        type_department: department.type_department,
        code_func1: department.value,
        display_order_department: department.display_order
      })

      filteredEmployees
        .filter((obj) => obj.type_department == department.type_department)
        .forEach((obj) => arrangeEmpList.push(obj))
    }
  })

  return arrangeEmpList
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

const modelValue = computed({
  get: () => {
    if (sortEmpList.value.length) {
      for (let i = 0; i < sortEmpList.value.length; i++) {
        let option = sortEmpList.value[i]
        if (props.optionValue && option == props.selected) {
          return option
        } else if (option.value == props.selected) {
          return option
        }
      }
    }
    return null
  },
  set: (val) => {
    emit('update:selected', val)
  }
})

const getFirstEmployee = computed(
  () => sortEmpList.value.filter((v) => !v.disable)?.[0].value
)

function updateModelValue(value) {
  emit('update:modelValue', value)
}

const selectDefaultEmployee = () => {
  emit('update:selectDefaultEmployee')
}

onMounted(async () => {
  let user

  switch (props.typeOccupation) {
    case 'doctor':
      if (props.idEmployee) {
        user = employeeStore.getDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
      }
      break

    case 'staff':
      if (props.idEmployee) {
        user = employeeStore.getNonDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
      }
      break

    case 'cart-approver':
      if (props.idEmployee) {
        user = employeeStore.getCartApprovers.find(
          (v) => v.id_employee === props.idEmployee
        )
        if (user) {
          user = { label: user.name_display, value: user.id_employee }
        }
      } else if (localStorage.getItem('id_employee')) {
        user = employeeStore.getCartApprovers.find(
          (v) =>
            v.id_employee === JSON.parse(localStorage.getItem('id_employee'))
        )
      }
      break

    default:
      if (props.idEmployee) {
        user = employeeStore.getDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
      }
      break
  }

  if (user && !props.defaultBlank) {
    emit('update:modelValue', user.value ? user.value : user.id_employee)
  }
})

defineExpose({
  sortEmpList,
  modelValue,
  getFirstEmployee
})
</script>
<template>
  <q-select
    :menu-props="{ style: 'z-index: 6002;' }"
    v-bind="$attrs"
    v-model="modelValue"
    :options="sortEmpList"
    :label="props.label ? props.label : '担当者'"
    :color="props.color"
    :required="props.required"
    :clearable="props.clearable"
    class="clear-icon"
    dense
    emit-value
    hide-bottom-space
    map-options
    @click="emit('click')"
    @update:model-value="updateModelValue"
    :placeholder="props.placeholder"
    :lazy-rules="props.lazyRules"
    :rules="props.rules ? props.rules : []"
    :outlined="props.outlined"
    :bgColor="bgColor"
    :popup-content-style="popupContentStyle"
    :transition-duration="0"
    :disable="props.disable"
    :readonly="props.readonly"
  >
    <template v-slot:option="scope">
      <q-item
        v-if="!scope.opt.group"
        v-bind="scope.itemProps"
        class="items-center"
        style="gap: 4px"
      >
        <span v-if="!scope.opt.disable">&nbsp;</span>
        <q-icon
          name="person"
          v-if="!scope.opt.disable && scope.opt.type_department === 1"
          class="q-mr-sm"
        />
        <q-icon
          name="person_outline"
          v-if="!scope.opt.disable && scope.opt.type_department !== 1"
          class="q-mr-sm"
        />
        <q-item-section>
          <q-item-label :class="{ 'department-name-color': scope.opt.disable }">
            {{ scope.opt.label }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="scope.opt.group" v-bind="scope.itemProps">
        <q-item-label>{{ scope.opt.group }}</q-item-label>
      </q-item>
    </template>
    <template #append v-if="props.showSelectDefaultEmployee">
      <q-btn
        flat
        dense
        round
        size="12px"
        class="title1 bold text-black bg-grey-200 q-mx-xs"
        :class="[{ 'cursor-not-allowed': props.readonly || props.disable }]"
        :style="{ pointerEvents: props.readonly ? 'none' : 'auto' }"
        @click.stop="
          !props.readonly && !props.disable && selectDefaultEmployee()
        "
      >
        私
      </q-btn>
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
.department-name-color {
  color: #0b3391;
}

.cursor-not-allowed {
  cursor: not-allowed !important;
  color: $grey-800;
}
</style>
