<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia';
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue';
import useServiceDetailStore from '@/stores/service-details'
import useRequestStore from '@/stores/requests'
import mtUtils from '@/utils/mtUtils'
import useEmployeeStore from '@/stores/employees';
import { dateFormat, getEmployeeDisplayName } from '@/utils/aahUtils';
import useCategoryStore from '@/stores/categories';

const employeeStore = useEmployeeStore()
const serviceDetailStore = useServiceDetailStore()
const requestStore = useRequestStore()
const categoryStore = useCategoryStore()
const { getRequest } = storeToRefs(requestStore)
const props = defineProps({ data: Object, refetchAll: {type: Boolean, default: false}, dense: {type: Boolean, default: false} })
const emit = defineEmits(['refresh'])
const employeeName = (value, type) => {
  let employee_name
  switch (type) {
    case 'doctor':
      const docEmployee = employeeStore.getDoctors.find(
        (v) => v.id_employee === value
      )
      employee_name = getEmployeeDisplayName(docEmployee)
      break

    case 'staff':
      const staEmployee = employeeStore.getNonDoctors.find(
        (v) => v.id_employee === value
      )
      employee_name = getEmployeeDisplayName(staEmployee)
      break
  }
  return employee_name
}
/* REMOVE later TODO */
const datetimeService = computed(() => {
  if (props.data.datetime_service_start === props.data.datetime_service_end || props.data.datetime_service_end === null) {
    return `実施日：${props.data.datetime_service_start}`
  } else if (props.data.datetime_service_start !== props.data.datetime_service_end) {
    return `実施日：${props.data.datetime_service_start} ~ ${props.data.datetime_service_end}`
  } else {
    return ''
  }
})
const categoryName = (value: number) => categoryStore.getAllCategories.find((v) => v.value === value)
const openItemServiceDetailModal = async (item) => {
  serviceDetailStore.setServiceDetail(item)
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {
    data: getRequest.value,
    refetchAll: props.refetchAll
  })
  emit('refresh')
}
</script>

<template>
  <div v-if="props.data" class="full-width">
    <div
      class="item_divier_item_service"
      @click="openItemServiceDetailModal(props.data)"
    >
      <div class="justify-between items-center">
        <div class="q-mb-xs">
          <q-btn v-if="props.data.flg_cancel" label="キャンセル" color="primary" class="q-mb-sm" />
          <span 
            v-if="props.data.flg_prevention" 
            class="field-label-free-color text-white caption2 regular" 
            :class="!props.data.flg_cancel ? 'chip-blue' : 'bg-grey-300'">予防</span>
          <span 
            v-if="props.data.flg_pet_custody_control" 
            class="field-label-free-color text-white caption2 regular" 
            :class="!props.data.flg_cancel ? 'chip-red' : 'bg-grey-300'">預かり</span>
          <span 
            v-if="props.data.flg_surgery" 
            class="field-label-free-color text-white caption2 regular" 
            :class="!props.data.flg_cancel ? 'chip-purple' : 'bg-grey-300'">手術</span>
          <span 
            v-if="props.data.flg_anesthesia" 
            class="field-label-free-color text-white caption2 regular" 
            :class="!props.data.flg_cancel ? 'chip-green' : 'bg-grey-300'">麻酔</span>
          <span class="caption1 bold text-grey-900 q-mr-md">
            {{ props.data.name_item_service }}
          </span>
          <!-- <span v-if="props.data.id_category1" class="text-grey-700 q-mb-xs">
            <span class="q-mr-sm" :class="!props.dense ? 'caption2' : ''">
              {{ categoryName(props.data.id_category1)?.label }}
              <q-icon name="arrow_right" color="grey-500" size="12px" />
            </span>
            <span :class="!props.dense ? 'caption2' : ''">
              {{ categoryName(props.data.id_category2)?.label }}
            </span>                
          </span> -->
        </div>
        <div class="row q-col-gutter-md text-grey-800 caption1 regular q-mb-sm">
          <div class="col-auto">
            <span v-if="props.data.datetime_service_start == props.data.datetime_service_end">
              {{ dateFormat(props.data.datetime_service_start) }}
            </span>
            <span v-else>
              {{ dateFormat(props.data.datetime_service_start) ?? '----/--/--' }}
              <span v-if="props.data.datetime_service_end">
                {{ ' ～ ' + dateFormat(props.data.datetime_service_end) }}
              </span>
            </span>
          </div>
        </div>
        <div class="flex q-mt-xs">
          <!-- <span v-if="props.data.id_employee_doctor" class="text-grey-800 q-mr-md widthToTruncate">
            <span :class="!props.dense ? 'field-label1' : ''">担当医</span>
            {{ employeeName(props.data.id_employee_doctor, 'doctor')}}
          </span>
          <span v-if="props.data.id_employee_staff" class="text-grey-800 q-mr-md widthToTruncate">
            <span :class="!props.dense ? 'field-label1' : ''">VT</span>
            {{ employeeName(props.data.id_employee_staff, 'staff')}}
          </span> -->
          <span v-if="props.data.memo_service" class="text-grey-800 q-mr-md widthToTruncate">
            {{ props.data.memo_service }}
          </span>
        </div>
      </div>
    </div>
  </div>
  <p v-else class="q-pl-md text-grey-500">
    治療・サービスはありません
  </p>
</template>
<style lang="scss" scoped>
.item_divier_item_service {
  cursor: pointer;
  border-radius: 10px;
  background-color: rgb(254, 213, 255, 0.45);
  padding: 8px 10px 7px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  line-height: 1.4;

  &:hover {
    background-color: rgba(254, 213, 255, 0.75);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  &:active {
    background-color: rgba(255, 236, 253, 0.8);
  }

  .prescription-name {
    max-width: 30vw;
    
    @media screen and (max-width: 1440px) {
      max-width: 22vw;
    }
  }

  .field-label-free-color {
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 4px;
    
    &.chip-blue { background: $primary; }
    &.chip-red { background: $negative; }
    &.chip-purple { background: $secondary; }
    &.chip-green { background: $positive; }
  }

  .body2 {
    font-size: 14px;
    line-height: 1.3;
  }
  
  .caption2 {
    font-size: 12px;
    line-height: 1.2;
  }
  
  .text-grey-700 {
    line-height: 1.25;
  }
}

.widthToTruncate {
  max-width: 30vw;
  
  @media screen and (max-width: 1100px) {
    max-width: 30vw;
  }
  
  @media screen and (max-width: 1040px) {
    max-width: 25vw;
  }
}

.pocket-staff-label {
  background: #dddddd;
  color: #111;
  padding: 2px 6px;
  border-radius: 4px;
  margin: 2px 3px 2px 0;
}

.field-label-free-color-small {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.75rem;
  
  &.chip-blue { background: $primary; }
  &.chip-red { background: $negative; }
  &.chip-purple { background: $secondary; }
  &.chip-green { background: $positive; }
}
</style>