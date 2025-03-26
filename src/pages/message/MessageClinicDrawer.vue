<script lang="ts" setup>
import { onMounted, ref, reactive, withDefaults } from 'vue'
import { aahUtilsGetEmployeeName, concatenate, formatDateTime, formatHoursMinutes, getDateTimeNow, timeDifferences } from '@/utils/aahUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import { CliCommon, GenericValueLabelType, MessageThreadType } from '@/types/types'
import { typeLinkCategory, typeThreadClassification } from '@/utils/enum'
import useCliCommonStore from '@/stores/cli-common'

type PropsDataType = {
  type_department: number
  typeMessage: number
  messageTextarea: string
  id_file: null
  id_employee: string
  name_employee: string
  id_employee_insert: string
  filedata: []
}

type FilterDataType = {
  type_department: number | null
  flg_goal_achieved: boolean | null
  flg_closed: boolean | null
  name_thread: string | null
  number_link1: string | null
  id_customer: string | null
  id_pet: string | null
  id_employee_ask: string | null
  id_employee_answer: string | null
}

const props = withDefaults(
  defineProps<{
    data: PropsDataType
    drawer: boolean
    allTypeThreads: MessageThreadType[]
    selectedThread: MessageThreadType
  }>(),
  {
    drawer: true,
    allTypeThreads: () => {
      return [] as MessageThreadType[]
    },
    data: () => {
      return {} as PropsDataType
    },
    selectedThread: () => {
      return {} as MessageThreadType
    }
  }
)

const cliCommonStore = useCliCommonStore()
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getCustomerListOptions } = storeToRefs(customerStore)
const drawerHeader = ref()
const filterData = ref<FilterDataType>({
  type_department: null,
  flg_goal_achieved: false,
  flg_closed: false,
  name_thread: null,
  number_link1: null,
  id_customer: null,
  id_pet: null,
  id_employee_ask: null,
  id_employee_answer: null
})

const emits = defineEmits<{
  (e: 'handleDrawer'): void
  (e: 'handleFlgPinned', value: MessageThreadType): void
  (e: 'handleRefreshClick'): void
  (e: 'openUpdateModal'): void
  (e: 'openThreadFilterModal'): void
  (e: 'selectedFilter', value: FilterDataType): void
  (e: 'setSelectedThread', value: MessageThreadType): void
}>()

const defaultEmployee = JSON.parse(localStorage.getItem("id_employee"))
const showBadgeFilter = ref<Array<string>>([])
const typeDepartments = ref<Array<GenericValueLabelType>>([])
const typeDepartmentsDefault = reactive<Array<GenericValueLabelType>>([])
const petList = ref<Array<GenericValueLabelType>>([])
const petListDefault = reactive<Array<GenericValueLabelType>>([])
const showPets = ref(false)
const drawerHeaderHeight = ref(0)

const clearFilter = () => {
  filterData.value = {
    type_department: null,
    flg_goal_achieved: false,
    flg_closed: false,
    name_thread: null,
    number_link1: null,
    id_customer: null,
    id_pet: null,
    id_employee_ask: null,
    id_employee_answer: null
  }

  const keys = Object.keys(filterData.value).filter((key) => {
    return filterData.value[key as keyof FilterDataType]
  })
  showBadgeFilter.value = [...keys]

  emits('selectedFilter', filterData.value)
}

const setFilter = () => {
  const keys = Object.keys(filterData.value).filter((key) => {
    return filterData.value[key as keyof FilterDataType]
  })
  showBadgeFilter.value = [...keys]

  emits('selectedFilter', filterData.value)
}

const handleDrawer = () => {
  emits('handleDrawer')
}

const handleEmpName = (value: string) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, value)
}

const handleFlgPinned = (value: MessageThreadType) => {
  emits('handleFlgPinned', value)
}

const handleRefreshClick = () => {
  emits('handleRefreshClick')
}

const handleThreadType = (value: number) => {
  return typeThreadClassification.find(
    (items: any) => items.value === value
  )?.label
}

const openUpdateModal = () => {
  emits('openUpdateModal')
}

const setSelectedThread = (value: MessageThreadType) => {
  emits('setSelectedThread', value)
}

const handleLinkType = (Link: any) => {
  return typeLinkCategory.find(
    (items: any) => items.value === Link?.type_link1
  )?.label
}

const format = (value: string) => {
  const diff = timeDifferences(
    value,
    getDateTimeNow(),
    'hours'
  )

  if (diff < 0) {
    return `${formatDateTime(value)} ${formatHoursMinutes(
      value
    )}`
  }

  return formatHoursMinutes(value)
}

const handlePetsList = async (value: any) => {
  await customerStore.selectCustomer(value)
  if (value) {
    const selectedCustomer = customerStore?.getCustomer
    if (selectedCustomer) {
      if (selectedCustomer.pets.length) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: any) => {
          petListDefault.push({
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet
          })
        })
        petList.value = [...petListDefault]
        if (petList.value.length) {
          filterData.value.id_pet = petList.value[0].value
          showPets.value = true
        }
      }
    }
  } else {
    filterData.value.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}

const selectDefaultEmployee = (key: string) => {
  filterData.value[key as keyof FilterDataType] = defaultEmployee
}

onMounted(async () => {
  typeDepartments.value = [...cliCommonStore.getCliCommonTypeDepartmentList.map((item: CliCommon) => ({
    ...item,
    value: item.code_func1,
    label: item.name_cli_common
  }))]
  typeDepartmentsDefault.push(...typeDepartments.value)
  drawerHeaderHeight.value = drawerHeader?.value?.offsetHeight + 10
})
window.onresize = () => {
  drawerHeaderHeight.value = drawerHeader?.value?.offsetHeight + 10
}
</script>

<template>
  <q-drawer
    v-model="props.drawer"
    show-if-above
    :width="350"
    :breakpoint="500"
    class="drawer-border overflow-hidden"
  >
    <div ref="drawerHeader" class="absolute bg-white drawerHeaderBox">
      <q-toolbar class="bg-grey-800 text-white q-py-xs q-mb-md">
        <q-toolbar-title class="title2 bold">
          <span class="q-pl-lg">院内スレッド</span>
        </q-toolbar-title>
        <q-btn flat round dense icon="chevron_left" @click="handleDrawer" />
      </q-toolbar>
      <div class="row items-center q-px-md">
        <q-btn unelevated class="bg-grey-200" label="絞込">
          <q-icon name="filter_list" />
          <q-badge v-if="showBadgeFilter.length" color="red" rounded floating />
          <q-menu>
            <q-list class="overflow-hidden filter-menu">
              <q-item>
                <MtInputForm
                  autofocus
                  type="text"
                  label="スレッド名"
                  v-model="filterData.name_thread"
                />
              </q-item>
              <q-item>
                <MtInputForm
                  type="text"
                  label="連携番号"
                  v-model="filterData.number_link1"
                />
              </q-item>
              <q-item>
                <MtFilterSelect
                  v-model:selecting="filterData.id_customer"
                  v-model:options="getCustomerListOptions"
                  :options-default="getCustomerListOptions"
                  label="診察券番号・オーナー名"
                  @update:selecting="handlePetsList"
                />
              </q-item>
              <q-item>
                <MtFilterSelect
                  v-if="showPets"
                  v-model:selecting="filterData.id_pet"
                  :options-default="petListDefault"
                  :options="petList"
                  label="ペット名"
                />
              </q-item>
              <q-item style="gap: 16px">
                <InputEmployeeOptGroup
                  v-model:selected="filterData.id_employee_ask"
                  default-blank
                  label="質問者名"
                  clearable
                  dense
                  style="flex: 1"
                  show-select-default-employee
                  @update:select-default-employee="selectDefaultEmployee('id_employee_ask')"
                />
                <InputEmployeeOptGroup
                  v-model:selected="filterData.id_employee_answer"
                  default-blank
                  label="希望回答者"
                  clearable
                  dense
                  style="flex: 1"
                  show-select-default-employee
                  @update:select-default-employee="selectDefaultEmployee('id_employee_answer')"
                />
              </q-item>
              <q-separator style="width: 100%" class="q-my" />
              <q-item class="">
                <small>ステータス</small>
              </q-item>
              <q-item class="">
                <MtInputForm
                  v-model="filterData.flg_goal_achieved"
                  type="checkbox"
                  :items="[{ label: '目標達成' }]"
                />
              </q-item>
              <q-item class="">
                <MtInputForm
                  v-model="filterData.flg_closed"
                  type="checkbox"
                  :items="[{ label: 'クローズ' }]"
                />
              </q-item>
              <q-separator style="width: 100%" class="q-my" />
              <q-item class="">
                <small>部署</small>
              </q-item>
              <q-item
                v-for="(dept, idx) in typeDepartments"
                :key="idx"
                class=""
              >
                <MtInputForm
                  v-model="filterData.type_department"
                  type="radio"
                  :items="[dept]"
                />
              </q-item>
              <q-item class="flex justify-between items-center text-center">
                <q-btn
                  unelevated
                  outline
                  v-close-popup
                  color="primary"
                  class="white-text"
                  @click="clearFilter"
                >
                  クリア
                </q-btn>
                <q-btn
                  unelevated
                  v-close-popup
                  color="primary"
                  class="white-text"
                  @click="setFilter"
                >
                  適用
                </q-btn>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
        <q-btn
          @click="openUpdateModal"
          padding="4px 24px"
          unelevated
          text-color="white"
          class="bg-grey-800 q-ml-auto"
        >
          <q-icon size="18px" name="add" />スレッド
        </q-btn>
        <q-btn
          @click="handleRefreshClick"
          round
          unelevated
          text-color="black"
          padding="3px 3px"
          class="q-ml-xs"
        >
          <q-icon size="20px" name="refresh" />
        </q-btn>
      </div>
    </div>
    <q-separator color="grey-800" />
    <q-scroll-area
      class="scrollBox"
      :style="{ marginTop: `${drawerHeaderHeight}px` }"
    >
      <q-list v-if="props.selectedThread">
        <q-item
          clickable
          v-ripple
          v-for="items in props.allTypeThreads"
          :key="items?.id_message_thread"
          :class="
            props.selectedThread?.id_message_thread === items?.id_message_thread
              ? 'selecte_Thread'
              : 'not_selecte_Threads'
          "
          @click="setSelectedThread(items)"
        >
          <q-item-section>
            <div class="row items-center threadTypeLink">
              <div class="col-sm-8">
                <div class="status-container">
                  <div class="status-information">
                    <span
                      class="status-goal-information body2 regular"
                      :class="
                        items?.flg_goal_achieved
                          ? 'goal-achieved-bg'
                          : 'goal-unachieved-bg'
                      "
                    >
                      {{ items?.flg_goal_achieved ? '達成' : '未' }}
                    </span>
                    <span
                      v-if="items?.type_thread"
                      class="body2 regular text-grey-700 q-px-sm border-outline-600 typeThreadBox"
                    >
                      {{ handleThreadType(items?.type_thread) }}
                    </span>
                  </div>
                  <span
                    v-if="items?.type_link1"
                    class="body2 regular text-grey-900 q-ml-sm"
                  >
                    {{ handleLinkType(items) }}
                  </span>
                </div>
              </div>
              <div class="col">
                <div class="flex items-center justify-end">
                  <span
                    v-if="items?.last_message"
                    class="caption1 regular text-grey-700 q-pr-xs"
                  >
                    {{ format(items?.last_message) }}
                  </span>

                  <q-btn
                    round
                    unelevated
                    :text-color="
                      selectedThread?.flg_emr_pinned ? 'grey-400' : 'grey-800'
                    "
                    padding="3px"
                    @click="handleFlgPinned(items)"
                  >
                    <q-icon
                      size="16px"
                      name="push_pin"
                      color="grey-800"
                      v-if="items.flg_emr_pinned"
                    />
                  </q-btn>
                </div>
              </div>
            </div>
            <div
              class="title3 bold text-grey-900 q-my-xs ellipsis nameThreadBox"
            >
              {{ items.name_thread }}
            </div>
            <div class="row no-wrap items-center justify-between">
              <div class="col-auto">
                <div
                  v-if="items.id_employee_ask && items.id_employee_answer"
                  class="flex items-center"
                >
                  <q-icon size="18px" name="person" class="q-mr-sm" />
                  <span class="body2 regular text-grey-900">{{
                    handleEmpName(items?.id_employee_ask)
                  }}</span>
                  <q-icon size="18px" name="arrow_right" class="q-mx-sm" />
                  <span
                    class="body2 regular text-grey-900 ellipsis"
                    :class="items?.flg_urgent ? 'flgUrgentBox' : ''"
                  >
                    {{
                      items?.id_employee_ask
                        ? handleEmpName(items?.id_employee_answer)
                        : '犬舎'
                    }}</span
                  >
                </div>
              </div>
              <div class="col-auto">
                <div class="text-negative q-mr-md" v-show="items.flg_urgent">
                  <q-icon size="18px" name="run_circle" class="q-mr-xs" />
                  <span class="caption1 bold">至急</span>
                </div>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
      <div v-if="!allTypeThreads.length" class="text-center noThreads">
        スレッドがありません
      </div>
    </q-scroll-area>
  </q-drawer>
</template>

<style lang="scss" scoped>
.selecte_Thread {
  padding: 8px 9px 10px 10px;
  border-bottom: 0.1px solid #dddd;
  background-color: #dddd !important;
}
.not_selecte_Threads {
  padding: 8px 9px 10px 10px;
  border-bottom: 0.1px solid #dddd;
  background-color: white !important;
}
.goal-achieved-bg {
  background-color: $positive;
}
.goal-unachieved-bg {
  background-color: #b99b14;
}
.drawerHeaderBox {
  width: 350px;
  border-right: 1px solid #e7e7e7;
}
.filterWidth {
  max-width: 150px;
}
.scrollBox {
  height: 90%;
  border-top: 1px solid #dddd;
  @media screen and (max-width: 1024px) {
    // for Ipad
    height: 90%;
  }
}
.threadTypeLink {
  height: 21px;
  .status-container {
    display: flex;
    gap: 8px;
    align-items: center;
    .status-information {
      display: flex;
      gap: 4px;
      align-items: center;
      .status-goal-information {
        color: $white;
        padding: 2px 5px;
        border-radius: 3px;
      }
    }
  }
}
.nameThreadBox {
  width: 97%;
  max-width: 330px;
}
.flgUrgentBox {
  max-width: 155px;
}
.typeThreadBox {
  padding: 1.5px 5px;
}
.noThreads {
  margin-top: 250px;
}
.filter-menu {
  width: 750px;
  @media screen and (max-width: 500px) {
    width: 350px;
  }
}
</style>
