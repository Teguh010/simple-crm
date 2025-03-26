<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { aahUtilsGetEmployeeName, formatDate, getDateTimeNow, roundZeroAfterPoint } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'

// Stores
import useServiceDetailStore from '@/stores/service-details'
import usePrescriptionStore from '@/stores/prescription'
import useCustomerStore from '@/stores/customers'

// Assets
import flgComplete from '@/assets/img/request/flg_complete.png'
import useEmployeeStore from '@/stores/employees'
import { Category } from '@/types/types'
import useCategoryStore from '@/stores/categories'
import SDIsuComparisonModal from '@/pages/request/serviceDetail/SDIsuComparisonModal.vue'

const employeeStore = useEmployeeStore()
const categoryStore = useCategoryStore()

// Lazy-loaded Components
const UpdateServiceDetailModal = defineAsyncComponent(
  () => import('@/pages/request/serviceDetail/UpdateServiceDetailModal.vue')
)


// Store Instances
const serviceDetailStore = useServiceDetailStore()
const prescriptionStore = usePrescriptionStore()
const customerStore = useCustomerStore()

const props = defineProps({
  data: Object,
  request: Object,
  dropDown: Boolean,
  copyIcon: false,
  petSelected: Object,
  parentId: String,
  requestDetailPage: Object,
  rightSidebar: { type: Boolean, default: false },
  left: { type: Boolean, default: false }
})

const emit = defineEmits(['initCall'])

const getEmployeeName = (id_employee) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}
const getCategoryName = (id_category: number) => categoryStore.getAllCategories.find((item: Category) => item.id_category == id_category)?.name_category
const openServiceDetailModal = async (item, otherServiceDetailList: any = null) => {
  serviceDetailStore.setServiceDetail(item)

  if (item.type_detail == 2 || item.type_detial == 3) {
    await mtUtils.smallPopup(UpdateServiceDetailModal, {
      otherServiceDetailList
    })
    event_bus.emit('reloadRight', true)
    return
  }
  
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {})
  event_bus.emit('reloadRight', true)
}

const openCreateCopyModal = async (service: any) => {
  if (!(service || props.request)) return

  const confirmation = await mtUtils.confirm(
    '同じ内容で複製しますか？\n',
    '治療サービスの複製',
    'はい'
  )
  if (!confirmation) return

  service.datetime_service_start = getDateTimeNow()
  service.datetime_service_end = service.datetime_service_start

  const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparisonSD', {
    id_service_detail: service.id_service_detail
  })


  let new_id_price = null
  let unit_price = null
  if (comparisonResponse && service.id_service_detail in comparisonResponse) {
    await mtUtils.smallPopup(SDIsuComparisonModal, {
      comparisonResponse: comparisonResponse,
      service_detail: service,
      callBack: (param: any) => {
        if (param.submitted) {
          new_id_price = param[service.id_service_detail].id_price
          unit_price = param[service.id_service_detail].price
        }
      }
    })
  }

  if (!new_id_item_service_unit) {
    return
  }
  
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'CreateServiceDetailCopy',
    {
      ...service,
      id_request_new: props.request.id_request,
      new_id_price: new_id_price,
      unit_price: unit_price
    },
    false,
    {},
    true
  )

  if (response && response.data && response.data.code == '200') {
    await mtUtils.autoCloseAlert(response.data.message)
    event_bus.emit('reloadRight', true)
    return
  }
  await mtUtils.autoCloseAlert('Error : 複製に失敗しました。')
}
</script>

<template>
  <div v-if="props.data && props.data.type_detail != 2">
    <div
      :class="props.data.flg_cancel ? 'cancel-notification-box' : ''"
      class="flex column item_divier_item_service"
    >
      <div
        @click="openServiceDetailModal(props.data)"
        :style="{ width: '100%' }"
        class=""
      >
        <div class="item-service-grid">
          <div class="body2 regular text-grey-900">
            <div
              class="q-pt-xs ellipsis item-service-name"
              :class="{ left: left }"
              :style="{ maxWidth: props.rightSidebar ? '18vw' : undefined }"
            >
              <span
                v-if="props.data.flg_next_cart"
                class="field-label-free-color-small bg-grey-800 text-white"
              >
                次回
              </span>
              <span
                v-if="props.data.flg_non_charge"
                class="field-label-free-color-small bg-accent-900 text-white"
              >
                会計外
              </span>
              <span
                v-if="props.data.flg_pet_custody_control"
                class="field-label-free-color-small bg-green-800 text-white"
              >
                預
              </span>
              <q-icon
                v-if="props.data.flg_apply_insurance"
                name="health_and_safety"
                class="text-light-blue q-mr-xs"
              />
              <span
                v-if="props.data.flg_takeout"
                class="field-label-free-color-small bg-takeout"
              >
                持
              </span>
              <span class="text-black">
                {{
                  props.data.name_item_service ||
                  props.data.name_prescription_display
                }}
              </span>
              <span class="caption1 regular q-ml-sm text-grey-700">
                <small>{{ props.data.name_category1 ? props.data.name_category1 : getCategoryName(props.data?.id_category1) }}</small>
              </span>
              <q-icon name="arrow_right" color="grey-500" />
              <span class="caption1 regular text-grey-700">
                <small>{{ props.data.name_category2 ? props.data.name_category2 : getCategoryName(props.data?.id_category2) }}</small>
              </span>
            </div>
            <div class="ellipsis widthToTruncate body2 regular" :class="{ left: left }">
              <small v-if="props.data.id_employee_staff" class="pocket-staff-label">
                {{ getEmployeeName(props.data.id_employee_staff) }}
              </small>
              <small class="q-mx-xs">
                {{ roundZeroAfterPoint(props.data.quantity, 1) + '個' }}
              </small>
              <small>
                {{ formatDate(props.data.datetime_service_start) }}
                {{
                  props.data.datetime_service_end
                    ? ' ~ ' + formatDate(props.data.datetime_service_end)
                    : ''
                }}
              </small>
              <p
                v-if="props.data.memo_service"
                class="caption2 regular text-grey-700 q-mb-none"
              >
                {{ props.data.memo_service }}
              </p>
            </div>
          </div>
          <div class="flex justify-end">
            <!-- <q-chip class="q-px-md"  v-if="props.data.flg_complete" dense
              >完了
            </q-chip> -->
            <q-btn
              v-if="props.copyIcon"
              style="max-height: 45px"
              class="text-grey-400 q-mr-md q-my-sm q-pa-xs"
              flat
              icon="content_copy"
              round
              unelevated
              @click.stop="openCreateCopyModal(props.data)"
            />
            <img
              v-if="
                props.parentId === 'right-detail-section' &&
                props.data.flg_complete
              "
              :src="flgComplete"
              alt="completed"
              width="50"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    v-if="props.data.effort_item && props.data.effort_item.length > 0"
    class="new-divider-plus body2 regular ellipsis q-pb-xs"
    @click.stop="openServiceDetailModal(props.data.effort_item?.[0], props.data.effort_item)"
  >
    <div v-for="effort in props.data.effort_item">
      <div class="flex ellipsis text-grey-700 caption2">
          <span class="q-mr-md body2 regular text-grey-900">
            {{ effort.name_item_service }}
          </span>
        <div>
          {{ roundZeroAfterPoint(effort.quantity) }} 個
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.item_divier_item_service {
  display: flex;
  justify-content: space-between;
  flex-wrap: nowrap;
  cursor: pointer;
  border-left: 5px solid #eebedb;
  &:hover {
    background-color: rgba(255, 236, 248, 0.7);
  }
  &:active {
    background-color: rgba(255, 236, 248, 0.8);
  }
  &:focus {
    background-color: rgba(255, 236, 248, 0.9);
  }
  border-bottom: 1px dotted rgb(227 227 227);
  padding: 6px 6px 6px 16px;
}
.item-service-grid {
  display: grid;
  grid-template-columns: 3fr 1fr;
  &:hover {
    background-color: rgba(255, 236, 248, 0.7);
  }
  .item-service-name {
    max-width: 32vw;
    @media screen and (max-width: 1200px) {
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
      max-width: 12vw;
    }
  }
}

.new-divider-plus {
  cursor: pointer;
  border-left: 5px solid #eebedb;

  &:hover {
    background-color: rgba(255, 236, 248, 0.7);
  }

  &:active {
    background-color: rgba(255, 236, 248, 0.8);
  }

  &:focus {
    background-color: rgba(255, 236, 248, 0.9);
  }

  &.no-left-border {
    border-left: 1px dotted rgb(227 227 227);
  }

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 7px 6px 7px 16px;

  .inject-name {
    max-width: 32vw;
    @media screen and (max-width: 1200px) {
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
      max-width: 12vw;
    }
  }
}

.prescription-box {
  display: flex;
  border-left: 6px solid #beccee;

  .prescription-box-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-column-gap: 10px;
    grid-row-gap: 5px;
    border-bottom: 1px dotted rgb(227 227 227);
    &:hover {
      background-color: rgba(236, 248, 255, 0.7);
    }
  }
  .prescription-box-grid:last-of-type {
    border-bottom: none;
  }
}
.item_divier_prescription {
  cursor: pointer;
  width: 100%;
  background-color: rgba(236, 248, 255, 0.7);

  &:active {
    background-color: rgba(236, 248, 255, 0.8);
  }

  &:focus {
    background-color: rgba(236, 248, 255, 0.9);
  }

  padding: 6px 6px 6px !important;
}
.pocket-staff-label {
    background: #e1e5eb;
    color:#111;
    padding: 0 6px ;
    margin: 2px 3px 2px 0px;
  }
</style>
