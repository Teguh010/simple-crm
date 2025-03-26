<script lang="ts" setup>
import useEmployeeStore from '@/stores/employees'
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { QSelect, ValidationRule } from 'quasar'
import { CliCommon, EmployeeType } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import dayjs from 'dayjs'
import { typeOccupation } from '@/utils/enum'

const cliCommonStore = useCliCommonStore()
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const employeeStore = useEmployeeStore()
const { getEmployees } = storeToRefs(employeeStore)
import defaultDoctor from '@/assets/img/employee/default.png'

// Track internal selected value
const internalValue = ref(null)

const getDoctorProfileImg = (employeeId: string | number): string => {
  const employee: EmployeeType | undefined = getEmployees.value.find(
    (emp: EmployeeType) => emp.id_employee === employeeId
  )
  return employee?.image_path1 ?? defaultDoctor
}

const getDoctorOccupation = (employeeId: string | number): string => {
  if(!props.enableOccupation){
    return ""
  }
  const employee: EmployeeType | undefined = getEmployees.value.find(
    (emp: EmployeeType) => emp.id_employee === employeeId
  )
  let occ = typeOccupation.find(t=>t.value == employee?.type_occupation)?.label
  if(Boolean(occ)){
    occ = ' - ' + occ
  }
  return occ
}

const emit = defineEmits([
  'update:selected',
  'update:modelValue',
  'click',
  'update:selectDefaultEmployee'
])

const props = withDefaults(
  defineProps<{
    modelValue?: any // Add modelValue prop
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
    enableOccupation?: boolean,
    showOnlyWithOccupations?: string
  }>(),
  {
    modelValue: undefined,
    selected: '',
    employeeName: '',
    typeOccupation: '',
    outlined: false,
    bgColor: '',
    label: '',
    placeholder: '',
    rules: () => [] as ValidationRule[],
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
    popupContentStyle: '',
    enableOccupation: false,
    showOnlyWithOccupations: '' // comma seperated typeOccupations
  }
)

const sortEmpList = computed(() => {
  let departments: any[] = []
  let employees: any[] = []
  let arrangeEmpList: {
    label: any
    value: any
    groupLabel?: any
    disable?: boolean
    type_department?: any
  }[] = []

  departments = getCliCommonTypeDepartmentList.value
    .filter((p) => dayjs(p.date_end).isSame(dayjs('9999/12/31'), 'year'))
    .map((obj: CliCommon) => ({
      label: obj.name_cli_common,
      value: obj.code_func1,
      display_order: obj.display_order
    }))

  employees = getEmployees.value
    .filter((emp: EmployeeType) => emp.flg_delete != '1' && !emp.flg_delete)
    .filter((emp: EmployeeType) => {
      switch (props.typeOccupation) {
        case 'doctor':
          return emp.type_occupation === 1
        case 'cart-approver':
          return emp.flg_cart_approver === 1
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
      type_department: obj.type_department
    }))

  departments.forEach((item1: { label: any; value: any; display_order: any }) => {
    arrangeEmpList.push({
      label: item1.label,
      value: null,
      groupLabel: item1.label,
      disable: true,
      type_department: item1.display_order
    })
  })

  employees.forEach((obj) => {
    const departmentIdx = departments.findIndex(
      (item2) => item2.value == obj.type_department
    )
    if (departmentIdx > -1) {
      arrangeEmpList.splice(departmentIdx + 1, 0, obj)
    }
  })

  let targetOccupationString = Boolean(props.showOnlyWithOccupations) ? props.showOnlyWithOccupations : '1'
  if(targetOccupationString && typeof targetOccupationString == 'string' && targetOccupationString.split(',').length >= 1){
    let targetOccupation = targetOccupationString.split(',').map(e => Number(e.trim()))
    let x = arrangeEmpList.filter((emp_) => {
      const employee: EmployeeType | undefined = getEmployees.value.find(
        (emp: EmployeeType) => emp.id_employee === emp_.value
      )
      return employee && targetOccupation.includes(employee?.type_occupation)
    })
    arrangeEmpList = x
  }
  return arrangeEmpList
})

// Watch for external value changes
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

// Watch for internal value changes
watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const selectedEmployee = computed(() => {
  if (!internalValue.value) return null
  return sortEmpList.value.find(emp => emp.value === internalValue.value)
})

function updateModelValue(value: any) {
  internalValue.value = value
  emit('update:modelValue', value)
  emit('update:selected', value)
}

const selectDefaultEmployee = () => {
  emit('update:selectDefaultEmployee')
}

onMounted(async () => {
  if (props.modelValue !== undefined) {
    internalValue.value = props.modelValue
  } else if (props.idEmployee && !props.defaultBlank) {
    let user

    switch (props.typeOccupation) {
      case 'doctor':
        user = employeeStore.getDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
        break

      case 'staff':
        user = employeeStore.getNonDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
        break

      case 'cart-approver':
        user = employeeStore.getCartApprovers.find(
          (v) => v.id_employee === props.idEmployee
        )
        if (user) {
          user = { label: user.name_display, value: user.id_employee }
        }
        break

      default:
        user = employeeStore.getDoctors.find(
          (v) => v.id_employee === props.idEmployee
        )
        break
    }

    if (user) {
      internalValue.value = user.value || user.id_employee
    }
  }
  
})

defineExpose({
  sortEmpList,
  selectedEmployee,
  internalValue
})
</script>

<template>
  <q-select
    v-model="internalValue"
    :options="sortEmpList"
    :label="props.label ? props.label : '担当者'"
    :color="props.color"
    :required="props.required"
    :clearable="props.clearable"
    class="clear-icon"
    dense
    emit-value
    map-options
    hide-bottom-space
    @click="emit('click')"
    @update:model-value="updateModelValue"
    :placeholder="props.placeholder"
    :lazy-rules="props.lazyRules"
    :rules="props.rules"
    :outlined="props.outlined"
    :bgColor="bgColor"
    :popup-content-style="popupContentStyle"
    :transition-duration="0"
    :disable="props.disable"
    :readonly="props.readonly"
  >
    <template v-slot:option="scope">
      <q-item
        v-bind="scope.itemProps"
        class="items-center"
        style="gap: 4px"
      >
        <span v-if="!scope.opt.disable">&nbsp;</span>
        <template v-if="!scope.opt.disable">
          <div v-if="scope.opt.type_department === 1" class="flex items-center">
            <img
              :src="getDoctorProfileImg(scope.opt.value)"
              class="q-mr-sm"
              style="width: 60px; height: 60px; border: 2px solid white; border-radius: 50%; object-fit: cover;"
            />
          </div>
          <q-icon
            v-else
            name="person_outline"
            class="q-mr-sm"
            size="60px"
          />
        </template>
        <q-item-section>
          <q-item-label :class="{ 'department-name-color': scope.opt.disable }">
            {{ scope.opt.label }}
            {{ getDoctorOccupation(scope.opt.value) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:selected>
      <div v-if="selectedEmployee" class="row items-center no-wrap">
        <template v-if="selectedEmployee">
          <img
            v-if="selectedEmployee.type_department === 1"
            :src="getDoctorProfileImg(selectedEmployee.value)"
            class="q-mr-sm"
            style="width: 60px; height: 60px; border: 2px solid white; border-radius: 50%; object-fit: cover;"
          />
          <q-icon
            v-else
            name="person_outline"
            class="q-mr-sm"
          />
          {{ selectedEmployee.label }}
          {{ getDoctorOccupation(selectedEmployee.value) }}
        </template>
      </div>
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
        @click.stop="!props.readonly && !props.disable && selectDefaultEmployee()"
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
