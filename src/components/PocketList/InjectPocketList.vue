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
import InjectDetailPocketList from './InjectDetailPocketList.vue'
import useEmployeeStore from '@/stores/employees'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'
import { onMounted, ref } from 'vue'

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
const emit = defineEmits(['reloadRight'])
const router = useRouter()

const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()

const { getCustomer } = storeToRefs(customerStore)

const getEmployeeName = (id_employee) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}
const petName = (value: string | number) =>
  getPetFirstNameOnly(getCustomer.value?.pets?.find((v) => v.id_pet == value))

const openViewInjectHeaderModal = async (inject: any) => {
  await router.replace({
    name: 'RequestDetailInject',
    query: { id_inject: inject.id_inject }
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
const activateDropdown = ref<string[]>([]);
const activateDropdownData = ref(true);

const toggleDropdown = (date: string) => {
  if (activateDropdown.value.includes(date)) {
    activateDropdown.value = activateDropdown.value.filter(d => d !== date);
  } else {
    activateDropdown.value.push(date);
  }
};

const toggleDropdownData = () => {
  if (activateDropdownData.value) {
    activateDropdown.value = [];
  } else {
    initializeDropdown(); 
  }
  activateDropdownData.value = !activateDropdownData.value; 
};

const initializeDropdown = () => {
  if (props.data?.inject_detail_list) {
    const dates = Object.keys(groupedServiceDetailPerPetList(props.data.inject_detail_list.filter((item) => !item.id_service_detail)) || {});
    activateDropdown.value = dates;
  }
};


onMounted(() => {
  initializeDropdown();
});
</script>

<template>
  <div v-if="props.data" class="q-mt-sm">
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center space-x-4">
        <q-btn
          class="inject-header-btn cursor-pointer q-my-sm"
          flat
          @click="openViewInjectHeaderModal(props.data)"
        >
          <span
            v-if="props.data.flg_next_cart"
            class="field-label-free-color-small text-bold bg-grey-800 text-white"
          >
            次回
          </span>
          <span class="q-mr-md">{{ petName(props.data?.id_pet) }}</span>
          <span>{{
            useCliCommonStore().getCliCommonTypeMedRouteList.find(
              (route) => route.id_cli_common == props.data?.type_inject_route
            )?.name_cli_common
          }}</span>
        </q-btn>
        
        <small
          v-if="props.data?.id_employee_doctor"
          class="text-grey-700 q-ml-sm"
          style="margin-left: 10px;"
        >
          処方医：{{ getEmployeeName(props.data?.id_employee_doctor) }}
        </small>
      </div>

      <div class="flex items-center space-x-4">
        <small
          class="text-bold text-grey-600 cursor-pointer"
          @click="toggleDropdownData"
          style="margin-right: 20px;"
         v-if="props.parentId == 'right-detail-section'"
        >
          {{ activateDropdownData ? '閉じる' : '開く'  }}
        </small>
        
        <q-btn
          v-if="props.copy"
          class="text-grey-400 q-my-sm"
          flat
          icon="content_copy"
          padding="4px"
          round
          unelevated
          @click="openCreateCopyModal(props.data)"
        />
      </div>
    </div>
    <div
      v-for="(inject_list, date) in groupedServiceDetailPerPetList(props.data?.inject_detail_list.filter((item: any) => !item.id_service_detail))"
      :key="date"
    >
      <div class="caption1 regular flex items-center justify-between q-my-xs divider cursor-pointer"  @click="toggleDropdown(date)">
        <span class="q-ml-sm">
          {{ date }} ({{ inject_list.length }})
        </span>

        <q-icon 
         v-if="props.parentId == 'right-detail-section'"
         class="text-black q-px-sm" 
         :class="activateDropdown.includes(date) ? '' : 'rotate-180'" name="keyboard_arrow_down" />
      </div>
      <div v-if="props.parentId == 'right-detail-section'">
        <div v-if="activateDropdown.includes(date)">
        <template v-for="item in inject_list">
          <InjectDetailPocketList
            :data="item"
            :request="props.request"
            :inject="props.data"
            @reload-right="(value)=>emit('reloadRight', value)"
          />
        </template>
      </div>
      </div>
      <div v-else>
        <template v-for="item in inject_list">
          <InjectDetailPocketList
            :data="item"
            :request="props.request"
            :inject="props.data"
            @reload-right="(value)=>emit('reloadRight', value)"
          />
        </template>
      </div>
    </div>
  </div>
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
@media (min-width: 1024px) {
  .toggle-margin {
    margin-left: 64px; /* Larger margin for screens wider than 1024px */
  }
}
</style>
