<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import { roundZeroAfterPoint } from '@/utils/aahUtils'

// Stores
import useEmployeeStore from '@/stores/employees'
import useDoseStore from '@/stores/dose-frequencies'
import { getTypeDosageUI } from '../../../pages/request/prescription/prescriptionUtils'

// Lazy-loaded Components
const UpdPrescriptionDetailModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdPrescriptionDetailModal.vue')
)
const UpdateGroupTitleModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdateGroupTitleModal.vue')
)

// Store Instances
const employeeStore = useEmployeeStore()
const doseStore = useDoseStore()

const props = defineProps({
  data: Object,
  prescription: Object,
  left: { type: Boolean, default: false },
  child: { type: Boolean, default: false }
})
const emit = defineEmits(['refresh'])

const employeeName = (value: string) => {
  const employee = employeeStore.getEmployeeListWOF.find(
    (v) => v.value === value
  )
  if (employee) return employee.label
  return ''
}
const getISU = (value, list) => {
  return list?.find((is: any) => is.id_item_service_unit == value)
}

const updPrescriptionDetailGroup = async (
  prescription: any,
  prescriptionDetail: any
) => {
  await mtUtils.smallPopup(UpdateGroupTitleModal, {
    prescription: prescription,
    prescriptionDetail: prescriptionDetail
  })
  event_bus.emit('reloadRight', true)
  emit('refresh')
}

const updPrescriptionDetailModal = async (
  prescription: any,
  prescriptionDetail: any
) => {
  const flgPlusItem = prescriptionDetail?.type_detail == 2 || prescriptionDetail?.type_detail == 3

  if (flgPlusItem) {
    await mtUtils.smallPopup(UpdPrescriptionDetailModal, {
      prescriptionObj: prescription,
      prescriptionDetail: prescriptionDetail,
      requestObj: props.request
    })
    event_bus.emit('reloadRight', true)
    emit('refresh')
    return
  }

  await mtUtils.mediumPopup(UpdPrescriptionDetailModal, {
    prescriptionObj: prescription,
    prescriptionDetail: prescriptionDetail,
    requestObj: props.request
  })
  event_bus.emit('reloadRight', true)
  emit('refresh')
}

</script>

<template>
  <template v-if="props.data">
    <div :class="[props.data.flg_cancel ? 'cancel-notification-box' : '', props.child ? 'q-pa-sm' : 'item_divier_large_prescription']">
      <!--Plus Item Case-->
      <div v-if="props.data.type_detail == 2" @click.stop="updPrescriptionDetailModal(props.prescription, props.data)"
        class="body2 regular ellipsis q-pb-xs">
        <div>
          <span v-if="props.data?.flg_non_charge" class="field-label-free-color-small bg-accent-900 text-white">
            会計外
          </span>
          <span v-if="props.data?.flg_hospitalization_usage"
            class="field-label-free-color-small bg-emerald-green text-dark-emerald-green">
            院
          </span>
          <q-icon v-if="props.data.flg_apply_insurance" name="health_and_safety" class="text-light-blue q-mr-xs" />
          <span class="q-mr-sm">
            {{ props.data.name_prescription_display }}
          </span>
        </div>
        <div v-for="assort in props.data.prescription_detail_assort_list" class="flex q-mr-xs caption2 text-grey-700">
          {{ getISU(assort.id_item_service_unit,
            props.data.item_service?.item_service_unit_list)?.name_service_item_unit }}
          <div class="q-ml-md">{{ roundZeroAfterPoint(assort.val_dosage_decided) }} 個</div>
        </div>
      </div>
      <!--Normal PD Case-->
      <div
        v-else-if="props.data.flg_group_title != '1'"
        class="body2 regular text-grey-900"
        @click.stop="updPrescriptionDetailModal(props.prescription, props.data)"
      >
        <div class="ellipsis prescription-name" :class="{ left: left }">
          <span v-if="props.data?.flg_non_charge" class="field-label-free-color-small bg-accent-900 text-white">
            会計外
          </span>
          <span v-if="props.data?.flg_risk_animal || props.data?.flg_overdosing"
            class="field-label-free-color-small bg-darkred text-white">
            R
          </span>
          <span v-if="props.data?.flg_hospitalization_usage"
            class="field-label-free-color-small bg-emerald-green text-dark-emerald-green">
            院
          </span>
          <q-icon v-if="props.data.flg_apply_insurance" name="health_and_safety" class="text-light-blue q-mr-xs" />
          <span class="text-weight-bold text-grey-900">{{ props.data.name_prescription_display }}</span>
        </div>
        <div class="ellipsis widthToTruncate">
          <span class="text-grey-700">
            <small>{{ props.data.name_category1 }}</small>
          </span>
          <q-icon name="arrow_right" />
          <span class="text-grey-700">
            <small>{{ props.data.name_category2 }}</small>
          </span>
        </div>
        <div class="ellipsis widthToTruncate body2 regular q-my-xs" :class="{ left: left }">
          <span class="q-mr-sm">
            {{
              doseStore?.getAllDoses?.find(
                (dose) => props.data?.id_dosage_frequency == dose?.value
              )?.label
            }}
          </span>
          <small> {{ props.data.date_start + ' ~ ' }} </small>
          <small v-if="props.data.total_days_dose">
            ( {{ roundZeroAfterPoint(props.data.total_days_dose) }} {{ getTypeDosageUI(props.data) }} )
          </small>
        </div>
        <div v-for="assort in props?.data?.prescription_detail_assort_list" class="flex q-mr-xs">
          {{ getISU(assort.id_item_service_unit,
            props?.data?.item_service?.item_service_unit_list)?.name_service_item_unit
          }}
          <div class="q-ml-sm">{{ roundZeroAfterPoint(assort.val_dosage_decided) }} 錠</div>
          <small class="q-ml-md text-grey-700">総量:</small>
          <div class="q-ml-sm">{{ roundZeroAfterPoint(props.data.total_days_dose) }} 錠</div>
        </div>
        <div v-if="props.data.id_employee_staff" class="q-mt-xs">
          <small class="pocket-staff-label">
            {{
              props.data.id_employee_staff
                ? employeeName(props.data.id_employee_staff)
                : ''
            }}
          </small>
        </div>
        <div v-if="props.data?.memo_dose" class="ellipsis widthToTruncate caption2 regular q-mt-xs">
          <span class="text-grey-700 q-mr-xs">服》</span>{{ props.data?.memo_dose }}
        </div>
        <div v-if="props.data?.memo_alert" class="ellipsis widthToTruncate caption2 regular q-mt-xs">
          <span class="text-grey-700 q-mr-xs">注》</span>{{ props.data?.memo_alert }}
        </div>
      </div>
      <div v-else class="prescription_group" :class="props.data.flg_cancel ? 'cancel-notification-box' : ''"
        @click.stop="updPrescriptionDetailGroup(props.data, props.data)">
        <span>
          {{ props.data.name_prescription_display }}
        </span>

        <div if="props.data.child_items">
          <div v-for="child in props.data.child_items" :key="child.id_prescription_detail">
            <PrescriptionLargeDetailPocketList
              :data="child"
              :prescription="props.prescription"
              :child="true"
            />
          </div>
        </div>
      </div>

      <div @click.stop="updPrescriptionDetailModal(props.data, props.data.effort_item)"
        class="q-pa-sm body2 regular ellipsis q-pb-xs" v-if="props.data.effort_item">
        <div class="flex justify-between">
          <span class="q-mr-sm">
            {{ props?.data?.effort_item.name_prescription_display }}
          </span>
        </div>
        <div v-for="assort in props?.data?.effort_item?.prescription_detail_assort_list"
          class="flex q-mr-xs caption2 text-grey-700">
          {{ getISU(assort.id_item_service_unit,
            props?.data?.effort_item?.item_service?.item_service_unit_list)?.name_service_item_unit
          }}
          <div class="q-ml-md">{{ roundZeroAfterPoint(assort.val_dosage_decided) }} 個</div>
        </div>
      </div>
    </div>
  </template>
</template>
<style lang="scss" scoped>
.item_divier_large_prescription {
  cursor: pointer;

  &:hover {
    background-color: rgba(213, 239, 255, 0.9);
  }

  &:active {
    background-color: rgba(236, 248, 255, 0.8);
  }

  &:focus {
    background-color: rgba(236, 248, 255, 0.9);
  }

  &.no-left-border {
    border-left: 1px dotted rgb(227 227 227);
  }

  border-radius: 10px;
  background-color: rgba(213, 239, 255, 0.7);
  padding: 8px 10px 7px;

  .prescription-name {
    max-width: 30vw;

    @media screen and (max-width: 1440px) {
      max-width: 22vw;
    }

    &.left {
      @media screen and (max-width: 1440px) {
        max-width: 25vw;
      }
    }
  }
}

.widthToTruncate {
  // max-width: 270px;
  max-width: 30vw;

  @media screen and (max-width: 1100px) {
    max-width: 30vw;
  }

  @media screen and (max-width: 1040px) {
    // For IPAD
    max-width: 25vw;
  }

  @media screen and (max-width: 900px) {
    // For IPAD
    max-width: 22vw;
  }

  @media screen and (max-width: 430px) {
    // For Phone
    max-width: 32vw;
  }

  &.left {
    @media screen and (max-width: 1440px) {
      max-width: 25vw;
    }
  }
}

.prescription-header-btn {
  background-color: #e9efff;
  text-align: center;
  padding: 0px 10px;
}

.prescription-header-btn-span {
  height: 20px;
  display: flex;
  align-items: center;
  padding: 2px 8px;
}

// .prescription_group {
//   background-color: rgba(227, 241, 250, 0.7);
// }
.divider {
  width: 100%;
  padding: 5px 0 5px;
  background: $grey-100;
}

.pocket-staff-label {
  background: #dddddd;
  color: #111;
  padding: 0 6px;
  margin: 2px 3px 2px 0px;
}
</style>
