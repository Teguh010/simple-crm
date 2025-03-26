<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import mtUtils from '@/utils/mtUtils'
import ViewInjectHeaderModal from '@/pages/request/inject/ViewInjectHeaderModal.vue'
import useCliCommonStore from '@/stores/cli-common'
import {
  aahUtilsGetEmployeeName,
  formatDate,
  getDateToday,
  getFullPetNameWithoutHonorific,
  getPetFirstNameOnly
} from '@/utils/aahUtils'

import useCustomerStore from '@/stores/customers'
import { groupBy } from 'lodash'
import InjectLargeDetailPocketList from './InjectLargeDetailPocketList.vue'
import useEmployeeStore from '@/stores/employees'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'
import { ref } from 'vue'
import useIllnessHistoryStore from '@/stores/illness-history'

const props = defineProps({
  data: Object,
  request: Object,
  parentId: String,
  copy: {
    type: Boolean,
    default: false
  },
  left: { type: Boolean, default: false },
  rightSidebar: { type: Boolean, default: false }
})
const emit = defineEmits(['reloadRight', 'refresh'])
const router = useRouter()
const expanded = ref(true)

const illnessHistoryStore = useIllnessHistoryStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()

const { getCustomer } = storeToRefs(customerStore)

const refresh = () => emit('refresh')
const getEmployeeName = (id_employee) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}
const petName = (value: string | number) =>
  getPetFirstNameOnly(getCustomer.value?.pets?.find((v) => v.id_pet == value))


const getPetIllnessHistoryName = (ids) => {
  return ids.map((id) => {
    const illness = illnessHistoryStore.getIllnessHistorys.find((ih) => ih.id_pet_illness_history == id)
    if (illness) {
      if (illness?.name_disease) return illness?.name_disease
      else return illness?.name_disease_free
    }
    return null
  }).join(', ')
}

const openViewInjectHeaderModal = async (inject: any) => {
  await router.replace({
    name: 'RequestDetailInject',
    query: { id_inject: inject.inject }
  })
  await mtUtils.mediumPopup(ViewInjectHeaderModal, {
    requestDetailPage: props.request,
    id_pet: inject.id_pet,
    id_inject: inject.id_inject,
    InjectObj: inject
  })
  await router.replace({ name: 'RequestDetail' })
  emit('reloadRight', true)
}
const groupedServiceDetailPerPetList = (data) => {
    return groupBy(data.map((pd: any) => ({
        ...pd,
        date: formatDate(pd.date_start)
      })), 'date');
};

const handleAutoInjectTitle = (inject: any = null) => {
  const date_start = inject.date_start
  const date_end = inject.date_end ?? ''

  if (date_end == '') {
    inject.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
      petObj.id_pet == inject?.id_pet), customerStore.getCustomer)} 様 の注射・点滴（ ${date_start}  ）`
    return
  }
}

const openCreateCopyModal = async (inject: any) => {
  if (!(inject || props.request)) return

  inject.date_start = getDateToday()
  inject.date_end = null

  handleAutoInjectTitle(inject)

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'CreateInjectCopy',
    {
      ...inject,
      id_request_new: props.request.id_request
    },
    false,
    {},
    true
  )

  if (response && response.data && response.data.code == '200') {
    event_bus.emit('reloadRight', true)
    await mtUtils.autoCloseAlert(response.data.message)
    return
  }
  await mtUtils.autoCloseAlert('Error : 複製に失敗しました。')
}
</script>

<template>
  <div v-if="props.data" class="q-mt-sm">
    <div @click="openViewInjectHeaderModal(props.data)" class="cursor-pointer inject-header-btn2 flex justify-between">
      <div class="q-my-sm">
        <span
          v-if="props.data.flg_next_cart"
          class="field-label-free-color-small bg-grey-800 text-white"
          >次回</span
        >
        <span class="caption2 regular text-grey-700 q-mr-md">
          {{ props.data?.number_inject }}
        </span>
        <span class="q-mr-md">{{ petName(props.data?.id_pet) }}</span>
        <span>{{
          useCliCommonStore().getCliCommonTypeMedRouteList.find(
            (route) => route.id_cli_common == props.data?.type_inject_route
          )?.name_cli_common
        }}</span>
        <small v-if="props.data?.id_employee_doctor" class="text-grey-700 q-ml-sm">
          処方医：
        </small>
        <span>
          {{ getEmployeeName(props.data?.id_employee_doctor) }}
        </span>
      </div>
      <div class="q-my-sm">
          <span class="caption2 regular text-grey-700 q-ml-sm">
            既往歴：
          </span>
          <span>
            {{ getPetIllnessHistoryName(props.data?.id_pet_illness_history) }}
          </span>
          <q-btn 
            flat
            round
            size="8px"
            class="q-ml-md"
            @click.stop="expanded = !expanded"
          >
            <q-icon :name="expanded ? 'expand_less' : 'expand_more'" size="sm" />
          </q-btn>
        </div>
      <q-btn
        v-if="props.copy"
        class="text-grey-400 q-mr-md q-my-sm"
        flat
        icon="content_copy"
        padding="4px"
        round
        unelevated
        @click="openCreateCopyModal(props.data)"
      />
    </div>
    <div
      v-if="expanded"
      class="row q-col-gutter-sm"
      v-for="(inject_list, date) in groupedServiceDetailPerPetList(props.data?.inject_detail_list.filter((item: any) => !item.id_service_detail))"
      :key="date"
    >
      <div class="caption1 regular divider q-mt-md q-ml-sm">
          <span class="text-weight-bold q-ml-sm">{{ date }}</span>
      </div>
      <div class="col-lg-4 col-md-6 col-sm-6" v-for="item in inject_list">
        <InjectLargeDetailPocketList
          :data="item"
          :request="props.request"
          :inject="props.data"
          @reload-right="(value)=>emit('reloadRight', value)"
          @refresh="refresh"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.inject-header-btn2 {
  background-color: rgb(231, 231, 231);
  text-align: center;
  padding: 0px 10px;
  border-radius: 5px;
}
.divider {
    width: 100%;
    padding: 5px 0 5px;
    background: $grey-100;
}
</style>
