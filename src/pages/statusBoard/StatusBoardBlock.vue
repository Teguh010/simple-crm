<script setup lang="ts">
import { computed, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import UpdateRequestStatusModal from '../request/status/UpdateRequestStatusModal.vue'
import UpdateReqStatusModal from '@/pages/statusBoard/UpdateReqStatusModal.vue'
import { useRouter } from 'vue-router'
import useRequestStatus from '@/stores/request-statuses'
import useCustomerStore from '@/stores/customers'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import {
  dateFormat,
  formatDateWithTime,
  getDateByFormat,
  getDateTimeNow,
  getDateToday,
  timeDifferences
} from '@/utils/aahUtils'
import useRequestStore from '@/stores/requests'
import { AxiosResponse } from 'axios'
import { storeToRefs } from 'pinia'
import useCommonStore from '@/stores/common'
import useStatusStore from '@/stores/status'

dayjs.extend(isToday)

const router = useRouter()
const customerStore = useCustomerStore()
const requestStatusStore = useRequestStatus()
const requestStore = useRequestStore()
const commonStore = useCommonStore()
const statusStore = useStatusStore()
const { getAllCustomers } = storeToRefs(customerStore)

const emits = defineEmits(['update-status-board', 'update-request-status'])
const props = defineProps({
  personType: {
    type: String,
    required: false,
    default: 'blue'
  },
  employeeName: {
    type: String,
    required: false,
    default: ''
  },
  numberOfStatus: {
    type: String,
    required: false
  },
  status: {
    type: String,
    required: false,
    default: '預かり中'
  },
  memoStatus: {
    type: String,
    required: false,
    default: ''
  },
  isFlag: {
    type: Boolean,
    required: false,
    default: false
  },
  statusObj: {
    type: Object,
    required: false
  },
  categoryChild: {
    type: Object,
    required: false
  },
  petListDefault: {
    type: Array,
    required: false,
    default: () => []
  },
  isSmall: {
    type: Boolean,
    default: false
  }
})

const isAhead = ref(false)
const isTypeOne = ref(false)
const isOtherThanTypeOne = ref(false)

const customerDetail = computed(() => {
  let icon = ''
  const customer = getAllCustomers.value.find((cust) => {
    return cust.value === (props?.statusObj?.id_customer ? props?.statusObj?.id_customer : props?.statusObj?.customer?.id_customer)
  })

  if (customer?.type_customer_color) {
    icon = commonStore.getCommonTypeCustomerColorList.find(
      (v: any) => v.code_func1 === customer.type_customer_color.toString()
    )?.text1
  }

  return {
    label: `${customer?.code_customer} ${customer?.name_customer_display}`,
    icon
  }
})

const getStatus = (statusObj: object) => {
  if (statusObj.status) return statusObj.status
  const statusData = statusStore.getStatuses?.find((v) => v.id_status == statusObj.id_status)

  if (statusData) return statusData
  return {}
}

const openStatusBoardModal = async (data: any) => {
  const isRequestLinked = data.statusObj.request
  await customerStore.selectCustomer(data.statusObj.customer.id_customer)

  if(isRequestLinked) {
    await mtUtils.smallPopup(UpdateRequestStatusModal, {
      request: data.statusObj.request ? data.statusObj.request : { ...data.statusObj },
      isNew: false,
      statusData: data.statusObj,
      selectedPet: data.statusObj?.pet?.id_pet ? data.statusObj?.pet?.id_pet : data.statusObj.id_pet,
      selectedCustomer: data.statusObj?.customer?.id_customer ? data.statusObj?.customer?.id_customer : data.statusObj.id_customer,
      updatedFlg: {
        value: false
      },
      typeCategoryParent: getStatus(props?.statusObj)?.type_category_parent
    })
  }
  else {
    await mtUtils.smallPopup(UpdateReqStatusModal, {
      idReqStatus: data.statusObj.id_req_status,
      data
    })
  }
  emits('update-status-board')
  emits('update-request-status')
}
const statusName = computed(() => {
  return getStatus(props?.statusObj)?.name_status
})

const openRequestDetail = async () => {
  const [req] = await mtUtils.promiseAllWithLoader([
    requestStore.fetchRequest(props?.statusObj?.id_request ? props?.statusObj?.id_request : props?.statusObj?.request?.id_request)
  ])
  const pet = (req as AxiosResponse).data.data.customer.pets.find((data) => {
    return data.id_pet == props?.statusObj?.pet?.id_pet
  })

  if (props.categoryChild?.value === 21) {
    const confirmation = await mtUtils.confirm(
      '対象の会計を開きますか？',
      '',
      'リクエスト',
      '会計',
      ''
    )
    if (confirmation) {
      if (confirmation === 'send') {
        window.open(
          `/SearchRequestList/${props?.statusObj?.id_request ? props?.statusObj?.id_request : props?.statusObj?.request?.id_request}${pet ? `?code_pet=${pet.code_pet}` : ``}`,
          '_blank'
        )
        return false
      } else {
        window.open(
          `/SearchRequestList/${props?.statusObj?.id_request ? props?.statusObj?.id_request : props?.statusObj?.request?.id_request}?${pet ? `code_pet=${pet.code_pet}&id_pet=${pet.id_pet}&` : ``}open_cart=true`,
          '_blank'
        )
        return false
      }
    } else {
      return false
    }
  }
  if (props.categoryChild?.value >= 20) {
    window.open(
      `/SearchRequestList/${props?.statusObj?.id_request ? props?.statusObj?.id_request : props?.statusObj?.request?.id_request}?${pet ? `code_pet=${pet.code_pet}&id_pet=${pet.id_pet}&` : ``}open_cart=true`,
      '_blank'
    )
    return false
  }
  window.open(`/SearchRequestList/${props?.statusObj?.id_request ? props?.statusObj?.id_request : props?.statusObj?.request?.id_request}?${pet ? `code_pet=${pet.code_pet}&id_pet=${pet.id_pet}` : ``}`, '_blank')
  return false
}

const updateReqStatus = async (event: any) => {
  event.preventDefault()
  event.stopPropagation()
  await requestStatusStore.updateRequestStatuses(
    props.statusObj.id_req_status,
    {
      flg_confirmed: true
    }
  )
  emits('update-status-board')
}

const showNumberRequest = (number_request: string | number) => {
  if (number_request) {
    if (typeof(number_request) == 'number') return number_request.toString()

    const nr = number_request.split('-')
    if (nr.length > 0) return nr[1]

    return number_request
  }
}

const isTodaySB = computed(() => {
  if (
    dateFormat(props?.statusObj?.request?.date_request_start) <= getDateToday() ||
    dateFormat(props?.statusObj?.request?.date_request_goal) >= getDateToday()
  ) return true
  return false
})

const isLessThan24Hour = computed(() => {
  const diff = timeDifferences(getDateTimeNow(), formatDateWithTime(props.statusObj?.datetime_check_in), 'hour')
  if (diff >= 24) return false
  return true
})

const calculateCheckInTime = (date: string) => {
  if (isTodaySB.value) {
    let diff = timeDifferences(getDateTimeNow(), formatDateWithTime(date), 'minute')

    // if more than one hour
    if (diff >= 60) {
      isTypeOne.value = true
      const hour = diff / 60
      const minute = diff - 60 * Math.floor(hour)
      return `${Math.floor(hour)}h ${minute}m`
    }

    // if less than one hour
    if (diff >= 0 && diff < 60) {
      return `${diff}m`
    }

    // if the schedule is ahead of current time
    if (diff < 0) {
      isAhead.value = true
      const aheadTime = dayjs(date).format('hh:mm')
      return `${props?.statusObj?.request?.flg_booking ? '<予> ' : ''}${aheadTime}`
    }

    return 0
  }

  return `${props?.statusObj?.request?.flg_booking ? '<予> ' : ''}${props.statusObj.request ? getDateByFormat(props.statusObj?.request?.date_request_start, 'MM/DD') : ''}`
}
//
// onMounted(() => {
//   statusStore.fetchStatuses()
// })
</script>
<template>
  <div class="col cursor-pointer q-py-xs q-pl-xs q-bb" v-if="isSmall">
    <div class="flex no-wrap items-center">
      <span class="rq-box-small text-weight-bold" @click="openRequestDetail">
        <small>RQ{{ showNumberRequest(props?.statusObj?.request?.number_request) }}</small>
      </span>
      <div @click="openStatusBoardModal(props)" class="status-pet-name-small ellipsis">{{ props.statusObj?.pet?.display_name_pet }}</div>
      <small
        @click="openStatusBoardModal(props)"
        class="status-color-small ellipsis"
        :style="{
          backgroundColor: getStatus(props?.statusObj)?.bg_color_code
            ? getStatus(props?.statusObj)?.bg_color_code
            : 'rgb(234, 234, 234)',
          color: getStatus(props?.statusObj)?.color_code
            ? getStatus(props?.statusObj)?.color_code
            : '$grey-700'
        }"
      >
        {{ statusName }}
      </small>
    </div>
  </div>
  <div v-else class="col cursor-pointer">
    <div
      class="row justify-between bg-grey-100 no-wrap q-py-xs q-pl-xs board-header"
      @click="openRequestDetail"
    >
      <div class="col row items-center no-wrap ellipsis">
        <template v-if="isFlag">
          <div class="text-negative q-mr-xs">
            <q-icon size="20px" name="task_alt" />
          </div>
          <div class="caption1 regular text-negative">システム会計</div>
        </template>
        <template v-else>
          <div class="user-icon">
            <q-icon size="20px" name="person" :class="props.personType" />
          </div>
          <div class="name caption1 text-grey-900 ellipsis" v-if="props.employeeName">
            {{ props.employeeName }}
            <q-tooltip
              anchor="top middle"
              self="center middle"
              transition-show="jump-up"
              transition-hide="jump-down"
            >
              {{ props.employeeName }}
            </q-tooltip>
          </div>
        </template>
      </div>
      <div class="col-grow row items-center no-wrap">
        <p
          v-if="
            getStatus(props?.statusObj).type_category_child !== 21 &&
            isLessThan24Hour
          "
          class="time caption2 q-ma-none q-pr-sm"
          :class="{
            'bold text-positive': isAhead,
            'bold text-warning': isOtherThanTypeOne,
            'bold text-negative': isTypeOne
          }"
        >
          <q-icon name="history" size="14px" class="text-grey-600" />
          {{ calculateCheckInTime(props.statusObj?.datetime_check_in) }}
        </p>
        <p
          v-if="
            props?.statusObj?.datetime_cart &&
            getStatus(props?.statusObj).type_category_child == 20
          "
          :class="{
            'bold text-positive': isAhead,
            'bold text-warning': isOtherThanTypeOne,
            'bold text-negative': isTypeOne
          }"
          class="time caption2 q-ma-none q-pr-sm"
        >
          <q-icon name="shopping_cart" size="14px" class="text-grey-600" />
          {{ calculateCheckInTime(props.statusObj?.datetime_cart) }}
        </p>

        <div class="link bg-grey-300 row items-center">
          <q-icon size="16px" name="open_in_new" class="text-grey-900" />
        </div>
      </div>
    </div>
    <div
      class="board-body q-py-xs q-px-xs"
      @click="openStatusBoardModal(props)"
    >
      <div class="flex justify-between items-center">
        <div class="flex gap-1">
          <span class="rq-box caption2 text-weight-bold">
            <small>RQ</small>
            {{ showNumberRequest(props?.statusObj?.request?.number_request) }}
          </span>
          <span class="caption2">
            {{ customerDetail.label }}
          </span>
          <q-icon
          v-if="customerDetail.icon"
          size="8px"
          name="circle"
          class="q-mt-xs"
          :color="customerDetail.icon"
          />
        </div>
        <span v-if="isTodaySB" class="caption2">
          {{ calculateCheckInTime(props.statusObj.datetime_status_changed) }}
        </span>
      </div>
      <div class="flex column gap-1">
        <span class="body1 bold">
          {{ props.statusObj?.pet?.display_name_pet }} <small class="caption2 regular letter-spacing-sm">{{ props.statusObj?.pet?.display_name_pet_kana }}</small>
        </span>
      </div>
      <div class="flex items-center justify-between q-my-xs">
        <div
          class="total-number body1 text-grey-900"
          v-if="props.numberOfStatus"
        >
          {{ props.numberOfStatus }}
        </div>
        <div
          class="status-color"
          :style="{
            backgroundColor: getStatus(props?.statusObj)?.bg_color_code
              ? getStatus(props?.statusObj)?.bg_color_code
              : 'rgb(234, 234, 234)',
            color: getStatus(props?.statusObj)?.color_code
              ? getStatus(props?.statusObj)?.color_code
              : '$grey-700'
          }"
        >
          {{ statusName }}
        </div>
      </div>
      <div
        class="desc caption1 text-grey-700 q-my-xs ellipsis-2-lines"
        v-if="props.memoStatus"
      >
        {{ props.memoStatus }}
      </div>
      <div
        v-if="
          getStatus(props?.statusObj)?.type_category_parent == 21 &&
          getStatus(props?.statusObj)?.type_category_child == 20 &&
          !props.statusObj.flg_confirmed
        "
        class="flex justify-center"
      >
        <q-btn
          color="primary"
          rounded
          size="xs"
          text-color="white"
          unelevated
          @click.stop="updateReqStatus($event)"
        >
          確認しました
        </q-btn>
      </div>
    </div>
  </div>
</template>
<style scoped lang="scss">
.status-color {
  padding: 2px 9px;
  border-radius: 20px;
  font-size: 13px;
}
.status-color-small {
  padding: 0px 6px;
  border-radius: 5px;
  font-size: 12px;
  margin-left: 3px;
}
.status-pet-name-small {
  font-size: 15px;
  font-weight: bold;
  margin-left: 3px;
}
.letter-spacing-sm {
  font-size: 11px;
  letter-spacing: -2.5px;
}
.rq-box {
  background: #d6d6d6;
  color : #222;
  border-radius: 4px;
  padding-left: 4px;
  padding-right: 4px;
}
.rq-box-small {
  background: #d6d6d6;
  color : #222;
  border-radius: 3px;
  padding: 0px 2px;
  margin-right: 3px;
}
</style>
