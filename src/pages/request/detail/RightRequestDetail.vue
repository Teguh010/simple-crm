<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
  watch
} from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { groupBy, mapValues } from 'lodash'

import aahMessages from '@/utils/aahMessages'
import selectOptions from '@/utils/selectOptions'
// Utilities
import mtUtils from '@/utils/mtUtils'
import { event_bus } from '@/utils/eventBus'
import {
  formatDate,
  formatDateWithTime,
  getPetFirstNameOnly
} from '@/utils/aahUtils'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useServiceDetailStore from '@/stores/service-details'
import useTask from '@/stores/task'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import usePrescriptionStore from '@/stores/prescription'
import usePetBioStore from '@/stores/pet-bios'
import useDoseStore from '@/stores/dose-frequencies'
import useCliCommonStore from '@/stores/cli-common'
import { useInjectStore } from '@/stores/inject'

import { CONFIRM_MESSAGES } from '@/utils/enum';
// components
import ServiceDetailPocketList from '@/components/PocketList/ServiceDetailPocketList.vue'
// Assets
// Types
import { RequestDetailPageType, TaskType } from '@/types/types'

import useRequestStore from '@/stores/requests'

const requestStore = useRequestStore()
// Lazy-loaded Components
const CreateServiceDetailModal = defineAsyncComponent(
  () => import('../serviceDetail/CreateServiceDetailModal.vue')
)
const UpdInjectDetailByPet = defineAsyncComponent(
  () => import('@/pages/request/inject/UpdInjectDetailByPet.vue')
)
const ViewInjectHeaderModal = defineAsyncComponent(
  () => import('@/pages/request/inject/ViewInjectHeaderModal.vue')
)
const UpdInjectDetailModal = defineAsyncComponent(
  () => import('@/pages/request/inject/UpdInjectDetailModal.vue')
)

const CreatePrescriptionListModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/ViewPrescriptionModal.vue')
)
const UpdateTaskModal = defineAsyncComponent(
  () => import('@/pages/task/UpdateTaskModal.vue')
)
const UpdPrescriptionHeader1 = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdPrescriptionHeaderModel.vue')
)
const UpdPrescriptionDetailModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdPrescriptionDetailModal.vue')
)
const updPrescriptionDetailByPet = defineAsyncComponent(
  () =>
    import('@/pages/request/prescription/UpdPrescriptionDetailByPetModal.vue')
)
const ViewTaskDetailModal = defineAsyncComponent(
  () => import('@/pages/task/ViewTaskDetailModal.vue')
)
const UpdateGroupTitleModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/UpdateGroupTitleModal.vue')
)
const PrescriptionPocketList = defineAsyncComponent(
  () => import('@/components/PocketList/PrescriptionPocketList.vue')
)
const InjectPocketList = defineAsyncComponent(
  () => import('@/components/PocketList/InjectPocketList.vue')
)

const props = defineProps<{
  id: string
  rightSidebar: boolean
  showService: boolean
  showPrescription: boolean
  showInjection: boolean
  showTasks: boolean
  customerSelected?: Object
  petSelected?: Object
  requestDetailPage: RequestDetailPageType
  scrollAreaHeight: Object
}>()
const emit = defineEmits(['update:rightSidebar', 'toggleDropdown'])
const router = useRouter()
const serviceDetailStore = useServiceDetailStore()
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const prescriptionStore = usePrescriptionStore()
const petBioStore = usePetBioStore()
const taskStore = useTask()
const employeesStore = useEmployeeStore()
const doseStore = useDoseStore()
const cliCommonStore = useCliCommonStore()
const injectStore = useInjectStore()

const { getIllnessHistory, getIllnessHistorys } =
  storeToRefs(illnessHistoryStore)
const { getCustomer } = storeToRefs(customerStore)
const { getServiceDetails } = storeToRefs(serviceDetailStore)
const { getPrescriptionListByRequest } = storeToRefs(prescriptionStore)
const { getInjectListByRequest } = storeToRefs(injectStore)

const { getTaskRequests } = storeToRefs(taskStore)
const { getAllEmployees, getEmployeeListWOF } = storeToRefs(employeesStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)

const getServiceDetailPerPetList = ref({})
const groupedServiceDetailPerPetList = ref()

const createServiceDetailModalVisible = ref(false)
const rightDetailSection = ref(null)

const rightDetailSectionWidth = computed(() => {
  return rightDetailSection.value ?? 0
})

const prescriptionDefaultList: any = ref([])
const totalPrescriptionDetailCount: any = ref(0)
const totalServiceDetailCount: any = ref(0)

const injectDefaultList: any = ref([])
const totalInjectDetailCount: any = ref(0)

const petName = (value: string | number) =>
  getPetFirstNameOnly(getCustomer.value?.pets?.find((v) => v.id_pet == value))
const toggleRightSidebar = () => {
  emit('update:rightSidebar', !props.rightSidebar)
}
const employeeName = (value: string) =>
  getEmployeeListWOF.value.find((v) => v.value == value)?.label

const typeDeptName = (value: number) =>
  getCliCommonTypeDepartmentList.value.find((v) => v.value == value)
    ?.name_cli_common

const openUpdPrescriptionDetailByPet = async () => {
  if (!getIllnessHistory.value) {
    mtUtils.autoCloseAlert('既往歴・現疾患を追加してください。')
    return
  }

  if (
    prescriptionStore.getPrescriptionListByRequest.filter(
      (pL: any) => pL.id_request != props.requestDetailPage?.id_request
    ).length > 0
  ) {
    await prescriptionStore.fetchPrescriptionByRequest(props.id)
  }

  if (
    prescriptionStore.getPrescriptionHeaderByPet(customerStore.getPet?.id_pet)
      ?.flg_delivered
  ) {
    await mtUtils.autoCloseAlert('この処方箋は受け渡し完了しています。')
    return
  }

  if (
    prescriptionStore.getPrescriptionHeaderByPet(customerStore.getPet?.id_pet)
      ?.flg_cancel
  ) {
    await mtUtils.autoCloseAlert('この処方箋はキャンセルされました。')
    return
  }

  if (
    prescriptionStore.getPrescriptionHeaderByPet(customerStore.getPet?.id_pet)
  ) {
    await mtUtils.popup(updPrescriptionDetailByPet, {
      requestObj: props.requestDetailPage,
      id_pet: customerStore.getPet?.id_pet
    }, true)
    await initPrescriptionList(true)
    return
  }

  await mtUtils.popup(UpdPrescriptionHeader1, {
    requestObj: props.requestDetailPage
  }, true)
  await initPrescriptionList(true)
}

const openUpdInjectByPet = async () => {
  if (!getIllnessHistory.value) {
    mtUtils.autoCloseAlert('既往歴・現疾患を追加してください。')
    return
  }
  const selectedInjectObject = injectDefaultList.value.find(
    (inject: any) => inject.id_pet == customerStore.getPet?.id_pet
  )

  await mtUtils.popup(UpdInjectDetailByPet, {
    requestObj: props.requestDetailPage,
    id_pet: customerStore.getPet?.id_pet,
    petDetails: selectedInjectObject ?? petBioStore.getPetBioForHeader
  }, true)
  await initPrescriptionList(true)
}

const createItemServiceModal = async () => {
  // if (getIllnessHistory.value && getIllnessHistorys.value?.length > 0) {
  // createServiceDetailModalVisible.value = true
  await mtUtils.popup(CreateServiceDetailModal, {
    id: props.id,
    id_customer: props.customerSelected?.id_customer,
    id_pet: props.petSelected?.id_pet,
    request_detail_page: props.requestDetailPage
  }, true)
  // } else {
  //   mtUtils.autoCloseAlert('既往歴・現疾患を追加してください。')
  // }
  await initPrescriptionList(true)
}
const createTaskModal = async () => {
  if (!getIllnessHistory.value) {
    mtUtils.autoCloseAlert('既往歴・現疾患を追加してください。')
    return
  }

  taskStore.selectTask(null)
  const copiedTaskData = true
  const data = {
    id_customer: props.requestDetailPage.id_customer,
    id_pet: props.requestDetailPage.id_pet,
    type_link1: 1,
    number_link1: props.requestDetailPage.number_request,
    id_employee_staff: props.requestDetailPage.id_employee_staff,
    id_employee_request: JSON.parse(localStorage.getItem('id_employee'))
  }
  await mtUtils.popup(UpdateTaskModal, { data, copiedTaskData }, true)
}
const updateTaskModal = async (task: TaskType) => {
  await mtUtils.mediumPopup(ViewTaskDetailModal, {
    data: task,
    id_request: props.id
  })
}

const openViewInjectHeaderModal = async (inject: any) => {
  await router.replace({
    name: 'RequestDetailInject',
    query: { id_prescription: inject.inject }
  })
  await mtUtils.mediumPopup(ViewInjectHeaderModal, {
    requestDetailPage: props.requestDetailPage,
    id_pet: inject.id_pet,
    id_inject: inject.id_inject,
    InjectObj: inject
  })
  await router.replace({ name: 'RequestDetail' })
  await initPrescriptionList(true)
}

// const openPrescriptionListModal = async (prescription: any) => {
//   await router.replace({
//     name: 'RequestDetailPrescription',
//     query: { id_prescription: prescription.id_prescription }
//   })
//   await mtUtils.mediumPopup(CreatePrescriptionListModal, {
//     requestDetailPage: props.requestDetailPage,
//     id_pet: prescription.id_pet
//   })
//   await router.replace({ name: 'RequestDetail' })
//   await initPrescriptionList(true)
// }

// const updPrescriptionDetailModal = async (
//   prescription: any,
//   prescriptionDetail: any
// ) => {
//   await mtUtils.mediumPopup(UpdPrescriptionDetailModal, {
//     prescriptionObj: prescription,
//     prescriptionDetail: prescriptionDetail,
//     requestObj: props.requestDetailPage
//   })
//   await initPrescriptionList(true)
// }

const updInjectDetailModal = async (inject: any, injectDetail: any) => {
  if (injectDetail && injectDetail.flg_etc1) {
    await mtUtils.smallPopup(UpdInjectDetailModal, {
      injectObj: inject,
      injectDetail: injectDetail,
      requestObj: props.requestDetailPage
    })
    await initPrescriptionList(true)
    return
  }
  await mtUtils.mediumPopup(UpdInjectDetailModal, {
    injectObj: inject,
    injectDetail: injectDetail,
    requestObj: props.requestDetailPage
  })
  await initPrescriptionList(true)
}

// const updPrescriptionDetailGroup = async (
//   prescription: any,
//   prescriptionDetail: any
// ) => {
//   await mtUtils.smallPopup(UpdateGroupTitleModal, {
//     prescription: prescription,
//     prescriptionDetail: prescriptionDetail
//   })

//   await initPrescriptionList(true)
// }

const refresh = ref(true)

async function initPrescriptionList(withFetch = false) {
  if (withFetch) {
    await Promise.all([
      serviceDetailStore.fetchServiceDetails(props.id, {
        id_customer: customerStore.getCustomer?.id_customer
      }),
      prescriptionStore.fetchPrescriptionByRequest(props.id),
      useInjectStore().fetchInjectByRequest(props.id)
    ])
  }
  reRenderDOM()
}

const reRenderDOM = () => {
  getServiceDetailPerPetList.value = {}
  groupedServiceDetailPerPetList.value = {}

  refresh.value = false

  const localServiceDetail = [...getServiceDetails?.value]

  totalPrescriptionDetailCount.value = 0
  totalInjectDetailCount.value = 0

  totalServiceDetailCount.value = localServiceDetail.length

  getServiceDetailPerPetList.value = groupBy(getServiceDetails.value, 'id_pet')
  groupedServiceDetailPerPetList.value = mapValues(
    getServiceDetailPerPetList.value,
    (value) => {
      return groupBy(
        value.map((data: any) => ({
          ...data,
          datetime: formatDate(data.datetime_service_start)
        })),
        'datetime'
      )
    }
  )

  prescriptionDefaultList.value = [...getPrescriptionListByRequest.value]

  totalInjectDetailCount.value = 0

  injectDefaultList.value = [...getInjectListByRequest.value]
  injectDefaultList.value.map((injectObj: any) => {
    if (
      injectObj &&
      injectObj.inject_detail_list &&
      injectObj.inject_detail_list.length
    ) {
      injectObj.inject_detail_list.map(() => {
        totalInjectDetailCount.value += 1
      })
    }
  })

  prescriptionDefaultList.value.map((prescriptionObj: any) => {
    if (
      prescriptionObj &&
      prescriptionObj.prescription_detail_list &&
      prescriptionObj.prescription_detail_list.length
    ) {
      const filteredList = prescriptionObj.prescription_detail_list.filter(
        (item: any) => !(item.flg_group_title == 1 || item.id_service_detail)
      )
      totalPrescriptionDetailCount.value += filteredList.length
    }
  })

  refresh.value = true
}

defineExpose({ reRenderDOM })

event_bus.on('reloadRight', async (value) => {
  await initPrescriptionList(value)
})



const expandedState = ref<{ [petKey: string]: Set<string> }>({});

const initializeExpansion = () => {
  if (!groupedServiceDetailPerPetList.value) return;

  Object.keys(groupedServiceDetailPerPetList.value).forEach((petKey) => {
    if (!expandedState.value[petKey]) {
      expandedState.value[petKey] = new Set();
    }
    const petDates = Object.keys(groupedServiceDetailPerPetList.value[petKey] || {});
    petDates.forEach((date) => expandedState.value[petKey].add(date));
  });
};

const togglePetExpansion = (petKey: string) => {
  if (!expandedState.value[petKey]) {
    expandedState.value[petKey] = new Set();
  }

  const petDates = Object.keys(groupedServiceDetailPerPetList.value[petKey] || {});
  const isAllExpanded = petDates.every((date) => expandedState.value[petKey].has(date));

  if (isAllExpanded) {
    expandedState.value[petKey].clear();
  } else {
    petDates.forEach((date) => expandedState.value[petKey].add(date));
  }
};

const toggleDateExpansion = (petKey: string, date: string) => {
  if (!expandedState.value[petKey]) {
    expandedState.value[petKey] = new Set();
  }

  if (expandedState.value[petKey].has(date)) {
    expandedState.value[petKey].delete(date);
  } else {
    expandedState.value[petKey].add(date);
  }
};

const isPetFullyExpanded = (petKey: string) => {
  const petDates = Object.keys(groupedServiceDetailPerPetList.value[petKey] || {});
  return petDates.length > 0 && petDates.every((date) => expandedState.value[petKey]?.has(date));
};

watch(() => groupedServiceDetailPerPetList.value, (newData) => {
  if (newData) {
    initializeExpansion();
  }
}, { immediate: true });


onMounted(async () => {
  // Feature is not ready yet!
  // Removing this Insurancer here !
  // useInsuranceStore().fetchInsurers()

  await initPrescriptionList()
  if (localStorage.getItem('ai_summary_generated'))
    await mtUtils.draggablePopup()
  initializeExpansion();
})
onUnmounted(() => {
  getServiceDetailPerPetList.value = {}
  event_bus.off('reloadRight')
})
const checkedFlgComplete = async () => {
    if (props.requestDetailPage.id_request && props.requestDetailPage.flg_complete ) {
      const response = await mtUtils.callApi(
        selectOptions.reqMethod.GET,
        `/request/${props.requestDetailPage.id_request}/cart`
      )
      if (response && response.flg_completed) {
        await mtUtils.autoCloseAlert(
          '操作が必要な場合には、\n会計の完了を解除してください。'
        )
       return
      }
  }
      const isCurrentlyComplete = props.requestDetailPage.flg_complete;
      const actionText = isCurrentlyComplete ? '未完了に' : '完了に';
      const confirmationType = isCurrentlyComplete
      ? CONFIRM_MESSAGES.UNDO_REQUEST
      : CONFIRM_MESSAGES.COMPLETE_REQUEST;

    const confirmation = await mtUtils.confirm(
      confirmationType.message,
      confirmationType.title,
      confirmationType.button
    );

      if (confirmation) {
      const payload = {
        flg_complete: !isCurrentlyComplete ? 1 : 0
      }

        try {
          const res = await requestStore.updateRequest(props.requestDetailPage.id_request, {
            flg_complete: payload.flg_complete
          });
          event_bus.emit('reloadTop')
          event_bus.emit('reloadRight', true)
          mtUtils.autoCloseAlert(aahMessages.success);
          if (!res) {
            throw new Error('No response from API');
          }
          } catch (error) {
            mtUtils.autoCloseAlert(aahMessages.failed);
          }
      }
    };
</script>
<template>
  <div
    class="sidebar q-bl"
    :class="
      props.rightSidebar ? 'col-3' : 'small-right-sidebar bg-white q-ml-sm'
    "
    ref="rightDetailSection"
    id="right-detail-section"
  >
    <q-scroll-area class="full-width" :style="props.scrollAreaHeight">
      <template v-if="props.rightSidebar">
        <div class="q-px-sm q-pt-xl">
          <q-btn
            @click="toggleRightSidebar"
            class="full-width fixed-top q-pl-sm bg-white"
            align="between"
            unelevated
            style="z-index: 2"
          >
            <q-icon name="chevron_right" />
            オーダーを非表示
          </q-btn>
          <!--Service Detail Section-->
          <div>
            <button
              @click="emit('toggleDropdown', 1)"
              class="bg-blush full-width flex justify-between items-center cursor-pointer button-dropdown q-pa-none"
            >
              <div class="flex items-center gap-0">
                <q-icon
                  class="text-black q-px-sm"
                  :class="showService ? '' : 'rotate-180'"
                  name="keyboard_arrow_down"
                />
                <div
                  class="text-bold itemservice-prescription-task-text text-black"
                >
                  治療サービス ({{
                    props.petSelected ? getServiceDetails?.length : 0
                  }})
                </div>
              </div>

              <q-btn
                v-if="props.petSelected"
                class="bg-grey-800"
                square
                unelevated
                @click.stop="createItemServiceModal"
              >
                <q-icon class="text-white q-px-sm" name="add" />
              </q-btn>
            </button>
            <template v-if="showService">
              <div
                v-if="totalServiceDetailCount > 0 && props.petSelected"
                v-for="(pet, key) in groupedServiceDetailPerPetList"
                class="q-mt-md"
                :key="key"
              >
                <div class="text-bold flex items-center justify-between">
                  <span>{{ petName(key) }}</span>
                  <small
                    class="text-grey-600 cursor-pointer"
                    style="margin-right: 20px;"
                    @click="togglePetExpansion(key)"
                  >
                    {{ isPetFullyExpanded(key) ? '閉じる' : '開く' }}
                  </small>
                </div>
                
                
                  <template v-for="(services, date) in pet">
                    <div
                      class="caption1 regular flex items-center justify-between q-my-xs divider cursor-pointer"
                      @click="toggleDateExpansion(key, date)"
                    >
                      <span class="q-ml-sm">
                        {{ date }} ({{ services.length }})
                      </span>
                      <q-icon
                        class="text-black q-px-sm"
                        :class="expandedState[key]?.has(date) ? '' : 'rotate-180'"
                        name="keyboard_arrow_down"  
                      />
                    </div>
                    <div v-if="expandedState[key] && expandedState[key].size > 0">
                    <ServiceDetailPocketList
                      v-if="expandedState[key]?.has(date)"
                      v-for="data in services"
                      :key="data.id_service_detail"
                      :data="data"
                      parentId="right-detail-section"
                      :requestDetailPage="requestDetailPage"
                      :rightSidebar="props.rightSidebar"
                      @initCall="initPrescriptionList(true)"
                    />
                  </div>
                  </template>
              </div>
              <p v-else class="q-pl-md text-grey-500">
                治療・サービスはありません
              </p>
            </template>

          </div>
          <!--Prescription Section-->
          <div class="q-mt-md prescription-list">
            <button
              @click="emit('toggleDropdown', 2)"
              class="bg-sky-blue full-width flex justify-between items-center cursor-pointer button-dropdown q-pa-none"
            >
              <div class="flex items-center">
                <q-icon
                  class="text-black q-px-sm"
                  :class="showPrescription ? '' : 'rotate-180'"
                  name="keyboard_arrow_down"
                />
                <div
                  class="text-bold itemservice-prescription-task-text text-black"
                >
                  処方箋 ({{
                    props.petSelected ? totalPrescriptionDetailCount : 0
                  }})
                </div>
              </div>
              <q-btn
                v-if="props.petSelected"
                class="bg-grey-800"
                square
                unelevated
                @click.stop="openUpdPrescriptionDetailByPet"
              >
                <q-icon class="text-white q-px-sm" name="add" />
              </q-btn>
            </button>

            <template v-if="showPrescription">
              <PrescriptionPocketList
                v-for="item in prescriptionDefaultList"
                :copy="false"
                v-if="
                  prescriptionDefaultList.length > 0 &&
                  props.petSelected &&
                  refresh &&
                  showPrescription
                "
                :key="item.id_prescription_detail"
                :data="item"
                :request="requestDetailPage"
                parentId="right-detail-section"
                class="q-mt-sm"
                :rightSidebar="props.rightSidebar"
                @reloadRight="initPrescriptionList"
              />
              <p v-else class="q-pl-md text-grey-500">処方箋明細はありません</p>
            </template>
          </div>

          <!--Inject Section-->
          <div class="q-mt-md inject-list">
            <!-- inject header  -->
            <button
              @click="emit('toggleDropdown', 3)"
              class="bg-c-purple full-width flex justify-between items-center cursor-pointer button-dropdown q-pa-none"
            >
              <div class="flex items-center">
                <q-icon
                  class="text-black q-px-sm"
                  :class="showInjection ? '' : 'rotate-180'"
                  name="keyboard_arrow_down"
                />
                <div
                  class="text-bold itemservice-prescription-task-text text-black"
                >
                  注射・点滴 ({{
                    props.petSelected ? totalInjectDetailCount : 0
                  }})
                </div>
              </div>

              <q-btn
                v-if="props.petSelected"
                class="bg-grey-800"
                square
                unelevated
                @click.stop="openUpdInjectByPet"
              >
                <q-icon class="text-white q-px-sm" name="add" />
              </q-btn>
            </button>
            <!-- inject pocket list  -->
            <template v-if="showInjection">
              <InjectPocketList
                v-for="inject in injectDefaultList"
                v-if="
                  injectDefaultList.length > 0 &&
                  props.petSelected &&
                  refresh &&
                  showInjection
                "
                :key="inject.id_inject"
                :data="inject"
                parentId="right-detail-section"
                :request="requestDetailPage"
                :right-sidebar="rightSidebar"
                @reloadRight="initPrescriptionList"
              />
              <p v-else class="q-pl-md text-grey-500">
                注射・点滴明細はありません
              </p>
            </template>
          </div>

          <!--Task Section-->
          <div class="q-mt-md" style="margin-bottom: 50px;">
            <button
              @click="emit('toggleDropdown', 4)"
              class="bg-tosca full-width flex justify-between items-center cursor-pointer button-dropdown q-pa-none"
            >
              <div class="flex items-center">
                <q-icon
                  class="text-black q-px-sm"
                  :class="showTasks ? '' : 'rotate-180'"
                  name="keyboard_arrow_down"
                />
                <span
                  class="text-bold itemservice-prescription-task-text text-black"
                >
                  タスク ({{ props.petSelected ? getTaskRequests.length : 0 }})
                </span>
              </div>
              <q-btn
                v-if="props.petSelected"
                class="bg-grey-800"
                square
                unelevated
                @click.stop="createTaskModal()"
              >
                <q-icon class="text-white q-px-sm" name="add" />
              </q-btn>
            </button>
            <template v-if="showTasks">
              <div
                v-if="
                  getTaskRequests.length > 0 && props.petSelected && showTasks
                "
                class="q-mt-md q-pl-md"
              >
                <div
                  v-for="item in getTaskRequests"
                  class="item_divier_task"
                  @click="updateTaskModal(item)"
                  :key="item.id_task"
                  v-if="refresh"
                >
                  <div
                    class=""
                    :style="{ width: `${rightDetailSectionWidth - 50}px` }"
                  >
                    {{ item.number_task }} / {{ item.title_task }}
                  </div>
                  <!--<small class="flex items-center">
                    {{ categoryName(item.id_category1) }}
                    <q-icon name="arrow_right" />
                    {{ categoryName(item.id_category2) }}
                  </small>-->
                  <div class="text-grey-700">
                    <small>
                      完了予定：
                      {{ formatDateWithTime(item.datetime_plan) }}
                    </small>
                    <small>
                      {{
                        item.id_employee_staff
                          ? ' / ' + employeeName(item.id_employee_staff)
                          : ''
                      }}
                    </small>
                    <small>
                      {{
                        item.type_task_place
                          ? ' @ ' + typeDeptName(item.type_task_place)
                          : ''
                      }}
                    </small>
                  </div>
                  <div class="text-grey-700">
                    <small>
                      <span v-if="item.flg_prepared" class="green"
                        ><q-icon name="check_box"
                      /></span>
                      <span v-else
                        ><q-icon name="check_box_outline_blank"
                      /></span>
                      <span class="q-pl-xs">
                        依頼済
                        <span v-if="item.flg_start_arroval_required"
                          >(承認)</span
                        >
                      </span>
                    </small>
                    <small>
                      <q-icon
                        name="arrow_right"
                        size="15"
                        class="text-grey-500 q-px-xs"
                      />
                    </small>
                    <small>
                      <span v-if="item.flg_checked" class="green"
                        ><q-icon name="check_box"
                      /></span>
                      <span v-else
                        ><q-icon name="check_box_outline_blank"
                      /></span>
                      <span class="q-pl-xs">確認</span>
                    </small>
                    <small>
                      <q-icon
                        name="arrow_right"
                        size="15"
                        class="text-grey-500 q-px-xs"
                      />
                    </small>
                    <small>
                      <span v-if="item.flg_started" class="green"
                        ><q-icon name="check_box"
                      /></span>
                      <span v-else
                        ><q-icon name="check_box_outline_blank"
                      /></span>
                      <span class="q-pl-xs">着手済</span>
                    </small>
                    <small>
                      <q-icon
                        name="arrow_right"
                        size="15"
                        class="text-grey-500 q-px-xs"
                      />
                    </small>
                    <small>
                      <span v-if="item.flg_completed" class="green"
                        ><q-icon name="check_box"
                      /></span>
                      <span v-else
                        ><q-icon name="check_box_outline_blank"
                      /></span>
                      <span class="q-pl-xs">完了</span>
                    </small>
                  </div>
                </div>
              </div>
              <div v-else class="q-pl-md">
                <p class="text-grey-500">タスクはありません</p>
              </div>
            </template>
          </div>
          <div
              class="flex justify-end absolute-bottom-right"
              style="margin-right: 5px;margin-bottom: 5px;"
            >
            <q-btn
              @click="checkedFlgComplete"
              dense
              class="text-white q-px-md bg-light-blue"
            >
              {{ props.requestDetailPage?.flg_complete ? 'RQを編集' : 'RQを終了' }}
            </q-btn>
          </div>
        </div>
      </template>
      <template v-else>
        <q-btn
          class="text-black full-width"
          @click="toggleRightSidebar"
          unelevated
        >
          <q-icon name="chevron_left" />
        </q-btn>
        <div class="full-width text-center q-py-sm text-bold bg-blush">
          ({{ totalServiceDetailCount }})
        </div>
        <div class="full-width text-center q-py-sm text-bold bg-sky-blue">
          ({{ totalPrescriptionDetailCount }})
        </div>
        <div class="full-width text-center q-py-sm text-bold bg-c-purple">
          ({{ getInjectListByRequest.length }})
        </div>
        <div class="full-width text-center q-py-sm text-bold bg-tosca">
          ({{ getTaskRequests.length }})
        </div>
      </template>
    </q-scroll-area>
  </div>
</template>

<style lang="scss" scoped>
.button-dropdown {
  border: none;
}
.q-btn {
  transition: none;
  &::before,
  &::after {
    display: none;
  }
  &:hover,
  &:focus,
  &:active {
    background: transparent;
    opacity: 1;
  }
}

:deep(.q-scrollarea__content) {
  width: 100%;
}
.widthToTruncate {
  max-width: 270px;
  @media screen and (max-width: 1040px) {
    // For IPAD
    max-width: 152px;
  }
  @media screen and (max-width: 430px) {
    // For Phone
    max-width: 32px;
  }
}

.item_divier_inject {
  cursor: pointer;

  &:hover {
    background-color: rgba(241, 233, 255, 0.7);
  }

  &:active {
    background-color: rgba(241, 233, 255, 0.8);
  }

  &:focus {
    background-color: rgba(241, 233, 255, 0.9);
  }

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 6px 6px 6px !important;

  .inject-name {
    max-width: 18vw;
    @media screen and (max-width: 1280px) {
      max-width: 15vw;
    }
    @media screen and (max-width: 960px) {
      max-width: 12vw;
    }
  }
}

.item_divier_task {
  cursor: pointer;

  &:hover {
    background-color: rgba(236, 255, 242, 0.7);
  }

  &:active {
    background-color: rgba(236, 255, 242, 0.8);
  }

  &:focus {
    background-color: rgba(236, 255, 242, 0.9);
  }

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px !important;
}

.itemservice-prescription-task-text {
  @media screen and (max-width: 810px) {
    // For IPAD
    font-size: 12px;
  }
}

.prescription_group {
  background-color: rgba(236, 248, 255, 0.7);
}

.small-right-sidebar {
  top: 110px;
  right: 0px;
  width: 45px;
}

.prescription-header-btn {
  background-color: #e9efff;
  text-align: center;
  padding: 0px 10px;
}

.inject-header-btn {
  background-color: #eee4ff;
  text-align: center;
  padding: 0px 10px;
}

.divider {
  padding: 5px 0 5px;
  background: $grey-100;
}
</style>
