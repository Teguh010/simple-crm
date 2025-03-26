<script lang="ts" setup>
import { useRouter } from 'vue-router'
import mtUtils from '@/utils/mtUtils'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'
import { roundZeroAfterPoint } from '@/utils/aahUtils'

import useEmployeeStore from '@/stores/employees'

import flgComplete from '@/assets/img/request/flg_complete.png'
import useCommonStore from '@/stores/common'

const props = defineProps({
  data: Object,
  request: Object,
  inject: Object,
  rightSidebar: { type: Boolean, default: false }
})
const emit = defineEmits(['reloadRight', 'refresh'])
const router = useRouter()

const employeesStore = useEmployeeStore()

const employeeName = (value: string) => {
  const employee = employeesStore.getEmployeeListWOF.find(
    (v) => v.value === value
  )
  if (employee) return employee.label
  return ''
}

const openInjectDetailModal = async (injectDetail: any, otherInjectDetailList = null) => {
  if (injectDetail && (injectDetail.type_detail == 2 || injectDetail.type_detail == 3)) {
    await mtUtils.smallPopup(UpdInjectDetailModal, {
      injectObj: props.data,
      injectDetail: injectDetail,
      otherInjectDetailList
    })
    await router.replace({ name: 'RequestDetail' })
    emit('reloadRight', true)
    emit('refresh')
  }
}
const updInjectDetailModal = async (inject: any, injectDetail: any) => {
  if (injectDetail && (injectDetail.type_detail == 2 || injectDetail.type_detail == 3)) {
    await mtUtils.smallPopup(UpdInjectDetailModal, {
      injectObj: inject,
      injectDetail: injectDetail,
      requestObj: props.requestDetailPage,
      otherInjectDetailList: injectDetail.data?.[0]
    })
    emit('reloadRight', true)
    emit('refresh')
    return
  }

  await mtUtils.mediumPopup(UpdInjectDetailModal, {
    injectObj: inject,
    injectDetail: injectDetail,
    requestObj: props.request
  })
  emit('reloadRight', true)
  emit('refresh')
}
</script>

<template>
  <template v-if="props.data">
    <div v-if="props.data.flg_group_title != '1' && !(props.data?.effort_item && props.data?.type_detail == 2)"
      :class="props.data.flg_cancel ? 'cancel-notification-box' : ''"
      class="flex justify-between item_large_divier_inject" @click="updInjectDetailModal(props.inject, props.data)">
      <div class="ellipsis widthToTruncate body2 regular text-grey-900" :class="{ left: left }">
        <div class="flex items-center">
          <div class="ellipsis inject-name" :style="{ maxWidth: props.rightSidebar ? '18vw' : undefined }">
            <span v-if="props.data?.flg_non_charge" class="field-label-free-color-small bg-accent-900 text-white">
              会計外
            </span>
            <small v-if="props.data?.flg_prevention" class="text-weight-bold">
              [予防]
            </small>
            <q-icon v-if="props.inject.flg_apply_insurance" name="health_and_safety" class="text-light-blue q-mr-xs" />
            <span class="text-weight-bold text-black">{{ props.data.name_inject_display }}</span>
            <div>
              <small>
                {{ props.data.name_category1 }}
                <q-icon name="arrow_right" />
                <span class="ellipsis widthToTruncate">
                  {{ props.data.name_category2 }}
                </span>
              </small>
            </div>
          </div>
        </div>
        <div class="flex justify-between ellipsis widthToTruncate q-my-xs">
          <span>
            {{ props.data.date_start == props.data.date_end ? props.data.date_start : props.data.date_start + ' ~ ' +
              props.data.date_end }}
          </span>
          <small class="pocket-staff-label">
            {{
              props.data.id_employee_staff
                ? '' + employeeName(props.data.id_employee_staff)
                : ''
            }}
          </small>
        </div>
        <div>
          <small class="text-grey-700">
            1回量:
          </small>
          <span>
            {{ roundZeroAfterPoint(props.data?.val_used_portion, 2) }} ml
          </span>
          <small class="text-grey-700 q-ml-md">
            総量:
          </small>
          <span>
            {{ props.data?.val_used_portion && props.data.num_conduct ? parseFloat((props.data.num_conduct *
              props.data.val_used_portion).toFixed(2)) + ' ml' : '' }}
          </span>
        </div>
        <div v-if="props.data.memo_inject" class="caption1 regular ellipsis widthToTruncate q-my-xs">
          {{ props.data.memo_inject }}
        </div>
      </div>
      <img v-if="props.inject.flg_completed" :src="flgComplete" alt="complete" width="50" />
      <div v-if="props.data.effort_item && props.data.effort_item.length > 0"
        :class="props.data.type_detail == 2 ? '' : 'no-left-border'" class="body2 q-pa-sm regular ellipsis q-pb-xs"
        @click.stop="openInjectDetailModal(props.data.effort_item?.[0], props.data.effort_item)">
        <div class="flex ellipsis justify-between">
          <div>
            {{ props.data.effort_item?.[0]?.item_service?.name_item_service || 'Effort Items' }}
          </div>
          <div class="text-grey-700 caption2">
            {{ props.data.name_inject_display }}
          </div>
        </div>
        <div v-for="effort in props.data.effort_item">
          <div class="flex ellipsis text-grey-700 caption2">
            <span class="q-mr-md">
              {{ effort.name_inject_display }}
            </span>
            <div>
              {{ roundZeroAfterPoint(effort.val_dosage_decided) }} 個
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<style lang="scss">
.item_large_divier_inject {
  cursor: pointer;

  // border-left: 5px solid #cdb7f2;
  &:hover {
    background-color: rgba(241, 233, 255, 0.9);
  }

  &:active {
    background-color: rgba(241, 233, 255, 0.8);
  }

  &:focus {
    background-color: rgba(241, 233, 255, 0.9);
  }

  &.no-left-border {
    border-left: 1px dotted rgb(227 227 227);
  }

  border: 1px dotted rgb(227 227 227);
  background-color: rgba(241, 233, 255, 0.7);
  border-radius: 10px;
  padding: 8px 11px;

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

.inject-header-btn {
  background-color: #eee4ff;
  text-align: center;
  padding: 0px 10px;
}

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
