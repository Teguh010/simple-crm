<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import mtUtils from '@/utils/mtUtils'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'
import { roundZeroAfterPoint } from '@/utils/aahUtils'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import useEmployeeStore from '@/stores/employees'

import flgComplete from '@/assets/img/request/flg_complete.png'

const props = defineProps({
  data: Object,
  request: Object,
  inject: Object,
  rightSidebar: { type: Boolean, default: false }
})
const emit = defineEmits(['reloadRight'])
const router = useRouter()

const employeesStore = useEmployeeStore()

const employeeName = (value: string) => {
  const employee = employeesStore.getEmployeeListWOF.find(
    (v) => v.value === value
  )
  if (employee) return employee.label
  return ''
}

const unitName = (value) => {
  return useCommonStore().getCommonUnitOptionList.find(
    (v) => v.id_common == value
  )?.name_common
}

function getItemServiceUnit(value) {
  let iu = injectDetail
  return iu
}

const openInjectDetailModal = async (
  injectDetail: any,
  otherInjectDetailList = null
) => {
  if (
    injectDetail &&
    (injectDetail.type_detail == 2 || injectDetail.type_detail == 3)
  ) {
    await mtUtils.smallPopup(UpdInjectDetailModal, {
      injectObj: props.data,
      injectDetail: injectDetail,
      otherInjectDetailList
    })
    await router.replace({ name: 'RequestDetail' })
    emit('reloadRight', true)
  }
}
const updInjectDetailModal = async (inject: any, injectDetail: any) => {
  if (
    injectDetail &&
    (injectDetail.type_detail == 2 || injectDetail.type_detail == 3)
  ) {
    await mtUtils.smallPopup(UpdInjectDetailModal, {
      injectObj: inject,
      injectDetail: injectDetail,
      requestObj: props.requestDetailPage,
      otherInjectDetailList: injectDetail.data?.[0]
    })
    emit('reloadRight', true)
    return
  }

  await mtUtils.mediumPopup(UpdInjectDetailModal, {
    injectObj: inject,
    injectDetail: injectDetail,
    requestObj: props.request
  })
  emit('reloadRight', true)
}

onMounted(async () => {
  await Promise.all([
    useCommonStore().fetchPreparationCommonList({ code_common: [1, 4, 5, 12] }),
    useCliCommonStore().fetchPreparationCliCommonList({
      code_cli_common: [5, 11, 13, 14, 16]
    })
  ])
})
</script>

<template>
  <template v-if="props.data">
    <div v-if="
      props.data.flg_group_title != '1' &&
      !(props.data?.effort_item && props.data?.type_detail == 2)
    " :class="props.data.flg_cancel ? 'cancel-notification-box' : ''" class="flex justify-between item_divier_inject"
      @click="updInjectDetailModal(props.inject, props.data)">
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
            <span class="text-black">{{ props.data.name_inject_display }}</span>
            <small>
              <span class="q-ml-sm text-grey-700">
                {{ props.data.name_category1 }}
              </span>
              <q-icon name="arrow_right" />
              <span class="text-grey-700 ellipsis widthToTruncate">
                {{ props.data.name_category2 }}
              </span>
            </small>
          </div>
        </div>
        <div class="ellipsis widthToTruncate flex">
          <!-- <small class="pocket-staff-label">
            {{
              props.data.id_employee_doctor
                ? '' + employeeName(props.data.id_employee_doctor)
                : ''
            }}
          </small> -->
          <small class="pocket-staff-label" v-if="props.data.id_employee_staff">
            {{

              employeeName(props.data.id_employee_staff)

            }}
          </small>
          <small class="q-mx-sm">
            {{ roundZeroAfterPoint(props.data?.num_conduct, 1) + '回' }}
          </small>
          <!-- <small>
            {{ props.data.date_start == props.data.date_end ? props.data.date_start : props.data.date_start + ' ~ ' + props.data.date_end }}
          </small> -->
          <small class="text-grey-700">〈1回売上〉</small>
          <span>{{ Number(props.data?.val_dosage_decided).toFixed(3) }}</span>
          <small>{{
            unitName(props.data.item_service_unit?.id_common)
          }}</small>
          <!-- <small class="text-grey-700 q-ml-md">
              総売上量 : 
            </small>
            <span>
              {{ parseFloat((props.data?.num_conduct * props.data?.val_dosage_decided).toFixed(2)) }}
              <span>
                {{ unitName(getItemServiceUnit(props.data.id_item_service_unit)?.id_common) }}
              </span>
            </span> -->
          <small class="text-grey-700 q-ml-md">〈1回投与〉</small>
          <span>
            {{ Number(props.data?.val_used_portion).toFixed(3) }}
            ml
          </span>
          <!-- <small class="text-grey-700 q-ml-md">
              総投与量 : 
            </small>
            <span>
              {{ parseFloat((props.data?.num_conduct * props.data?.val_used_portion).toFixed(2)) }}
              ml
            </span> -->
        </div>
        <div class="ellipsis widthToTruncate flex">
          <div></div>
        </div>
      </div>
      <img v-if="props.inject.flg_completed" :src="flgComplete" alt="complete" width="50" />
    </div>
    <div v-if="props.data.effort_item && props.data.effort_item.length > 0"
      :class="props.data.type_detail == 2 ? '' : 'no-left-border q-ml-lg'"
      class="item_divier_inject body2 regular ellipsis q-pb-xs" @click.stop="
        openInjectDetailModal(
          props.data.effort_item?.[0],
          props.data.effort_item
        )
        ">
      <div class="flex ellipsis justify-between">
        <div>
          {{
            props.data.effort_item?.[0]?.item_service?.name_item_service ||
            'Effort Items'
          }}
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
          <div>{{ roundZeroAfterPoint(effort.val_dosage_decided) }} 個</div>
        </div>
      </div>
    </div>
  </template>
</template>

<style lang="scss">
.item_divier_inject {
  cursor: pointer;
  border-left: 5px solid #cdb7f2;

  &:hover {
    background-color: rgba(241, 233, 255, 0.7);
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

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px !important;

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
