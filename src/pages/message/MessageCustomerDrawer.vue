<script setup lang="ts">
import { ref, onMounted, withDefaults, onUpdated } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { formatDateTime, formatHoursMinutes, getCustomerNameById, getDateTimeNow, timeDifferences, getCustomerLabelColor, dateFormat } from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import { MessageThreadType } from '@/types/types'
import { typeCustomerThread } from '@/utils/enum'
import { storeToRefs } from 'pinia';

type FilterDataType = {
  type_thread: number | null
  name_thread: string | null
  id_customer: string | null
  id_employee_ask: string | null
  id_employee_answer: string | null
}

const props = withDefaults(
  defineProps<{
    allTypeThreads: MessageThreadType[]
    drawer: boolean
    drawerHeaderHeight: number
    selectedThread: MessageThreadType
  }>(),
  {
    drawer: true,
    drawerHeaderHeight: 0,
    allTypeThreads: () => {
      return [] as MessageThreadType[]
    },
    selectedThread: () => {
      return {} as MessageThreadType
    }
  }
)

const emits = defineEmits<{
  (
    e: 'filterMenuHide',
    value: {
      type_thread: number | null
      name_thread: string | null
      id_customer: string | null
    }
  ): void
  (e: 'handleDrawer'): void
  (e: 'handleRefreshClick'): void
  (e: 'handleUpdatePanel', value: string): void
  (e: 'setSelectedThread', value: MessageThreadType): void
  (e: 'handleFlgPinned', value: MessageThreadType): void
}>()

const defaultEmployee = JSON.parse(localStorage.getItem("id_employee"))
const customerStore = useCustomerStore()
const { getAllCustomers, getCustomerListOptions, getCustomer } = storeToRefs(customerStore)

const filterData = ref({
  type_thread: null,
  name_thread: null,
  id_customer: null,
  id_employee_ask: null,
  id_employee_answer: null
})
const panel = ref('open')
const tabPanelName = ref('open')
const showBadgeFilter = ref<Array<string>>([])
const customerDefault = ref([])
const customerListDefault = ref([])

const clearFilter = () => {
  filterData.value = {
    type_thread: null,
    name_thread: null,
    id_customer: null
  }

  const keys = Object.keys(filterData.value).filter((key) => {
    return filterData.value[key as keyof FilterDataType]
  })
  showBadgeFilter.value = [...keys]

  emits('filterMenuHide', filterData.value)
}
const getPetName = (petId: string) => {
  let r = getCustomer.value?.pets?.find((pet) => pet?.value == petId)?.name_pet
  return r ? r : ''
}
const setFilter = () => {
  const keys = Object.keys(filterData.value).filter((key) => {
    return filterData.value[key as keyof FilterDataType]
  })
  showBadgeFilter.value = [...keys]

  emits('filterMenuHide', filterData.value)
}

const handleDrawer = () => {
  emits('handleDrawer')
}

const handleRefreshClick = () => {
  emits('handleRefreshClick')
}

const setSelectedThread = (value: MessageThreadType) => {
  emits('setSelectedThread', value)
}

const onUpdatePanel = (value: string) => {
  tabPanelName.value = value
  emits('handleUpdatePanel', value)
}

const handleFlgPinned = (value: MessageThreadType) => {
  emits('handleFlgPinned', value)
}

const handleCustomerName = (customerId: string) => {
  const customer = getAllCustomers.value.find(
    (cus) => cus?.value == customerId
  )
  return getCustomerNameById(customer, 3)
}

const handleCustomerTypeLabelColor = (customerId: string) => {
  if(!customerId) return false
  const customer = getAllCustomers.value.find(
    (cus) => cus?.value == customerId
  )
  return customer && customer?.type_customer_color ? getCustomerLabelColor(customer?.type_customer_color) : null
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

const selectDefaultEmployee = (key: string) => {
  filterData.value[key as keyof FilterDataType] = defaultEmployee
}

const handleStr = (str: String) => {
  let newStr = ''
  for (let i = 0; i < str?.length; i++) {
    if (i <= 20) {
      newStr += str[i]
    }
  }
  if (str?.length >= 20) {
    newStr += '...'
  }
  return newStr
}
onMounted(() => {
  customerDefault.value = [...getCustomerListOptions.value]
  customerListDefault.value = [...getCustomerListOptions.value]
})
</script>

<template>
  <q-drawer
    v-model="props.drawer"
    show-if-above
    :width="350"
    :breakpoint="500"
    class="drawer-border overflow-hidden"
  >
    <div ref="drawerHeader" class="bg-white drawerHeaderBox">
      <q-toolbar class="bg-grey-800 text-white q-py-xs">
        <q-toolbar-title class="title2 bold">
          <span class="q-pl-lg">オーナースレッド</span>
        </q-toolbar-title>
        <q-btn flat round dense icon="chevron_left" @click="handleDrawer" />
      </q-toolbar>
      <div class="row justify-between items-center q-pa-md">
        <q-btn unelevated class="bg-grey-200" label="絞込">
          <q-icon name="filter_list" />
          <q-badge v-if="showBadgeFilter.length" color="red" rounded floating />
          <q-menu>
            <q-list class="overflow-hidden filter-menu">
              <q-item>
                <MtInputForm
                  type="text"
                  label="スレッド名"
                  v-model="filterData.name_thread"
                />
              </q-item>
              <q-item>
                <MtFilterSelect
                  v-model:selecting="filterData.id_customer"
                  v-model:options="customerDefault"
                  :options-default="customerListDefault"
                  label="診察券番号・オーナー名"
                  class="q-mt-md"
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
                <small>スレッド区分</small>
              </q-item>
              <q-item
                v-for="(options, idx) in typeCustomerThread"
                :key="idx"
                class=""
              >
                <MtInputForm
                  type="radio"
                  v-model="filterData.type_thread"
                  :items="[options]"
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
        <div class="col-1">
          <q-btn
            round
            unelevated
            text-color="black"
            padding="3px 3px"
            @click="handleRefreshClick"
          >
            <q-icon size="20px" name="refresh" />
          </q-btn>
        </div>
      </div>
      <q-tabs
        v-model="panel"
        dense
        class="text-white bg-grey-800"
        active-bg-color="accent-600"
        indicator-color="transparent"
        @update:model-value="onUpdatePanel"
      >
        <q-tab name="open" label="オープン" />
        <q-tab name="close" label="対応終了" />
      </q-tabs>
    </div>
    <q-scroll-area
      class="scrollBox"
      :style="{ marginTop: `${props.drawerHeaderHeight}px` }"
    >
      <q-tab-panels v-model="panel" class="tab-panels">
        <q-tab-panel :name="tabPanelName" class="q-pa-none">
          <q-list v-for="(thread, index) in props.allTypeThreads" :key="index">
            <q-item
              clickable
              v-ripple
              class="fit"
              :class="
                selectedThread?.id_message_thread === thread?.id_message_thread
                  ? 'bg-accent-100'
                  : 'bg-white'
              "
              @click="setSelectedThread(thread)"
            >
              <q-item-section>
                <div class="items-center threadTypeLink">
                  <div class="col-11">
                    <div class="flex items-center">
                      <div
                        class="title3 bold text-grey-900 q-my-xs  nameThreadBox flex  justify-between"
                      >
                      <div class="message-ellipsis">
                        <span v-if="thread?.type_thread === 90">{{ (thread?.type_thread === 90 ? "有料メッセージ相談":'') + ' ' + 'のご予約' + '/'  +  getPetName(thread?.id_pet) }}</span>
                        <span v-else>
                          {{ handleStr(thread?.name_thread) }}
                        </span>
                      </div>
                        <q-icon
                          v-if="thread?.flg_read === false && thread?.messages?.length > 0"
                          size="13px"
                          name="circle"
                          class="q-ml-xs"
                          color="red"
                        />
                        <div class="text-caption regular text-grey-700">
                          {{dateFormat(thread?.datetime_insert)}}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-1">
                    <div
                      v-if="thread?.flg_emr_pinned"
                      class="flex items-center justify-end"
                    >
                      <q-icon size="18px" name="push_pin" class="q-mt-xs" @click="handleFlgPinned(selectedThread)"/>
                    </div>
                  </div>
                </div>
                <div
                  class="title3 bold text-grey-900 ellipsis nameThreadBox q-mt-xs"
                >
                  <div class="row no-wrap items-center col-auto">
                    <div class="flex items-center ellipsis no-wrap">
                      <q-icon size="18px" name="person" class="q-mr-sm" />
                      <span class="body2 regular text-black ellipsis"
                        >{{ handleCustomerName(thread?.id_customer) }} 様</span
                      >
                      <q-icon
                        v-if="handleCustomerTypeLabelColor(thread?.id_customer)"
                        size="13px"
                        name="circle"
                        class="q-ml-xs"
                        :color="handleCustomerTypeLabelColor(thread?.id_customer)"
                      />
                    </div>
                    <div
                      class="text-negative q-mr-xs q-mb-xs"
                      v-show="thread.flg_urgent"
                    >
                      <q-icon size="18px" name="run_circle" class="q-mr-xs" />
                      <span class="caption1 bold">至急</span>
                    </div>
                  </div>
                </div>
                <div class="row no-wrap items-center justify-between">
                  <div v-if="thread?.last_message" class="col-12 text-right">
                    <span class="caption1 regular text-grey-800">
                      {{ format(thread?.last_message) }}
                    </span>
                  </div>
                </div>
              </q-item-section>
            </q-item>
            <q-separator class="separator-class" />
          </q-list>
        </q-tab-panel>
      </q-tab-panels>
    </q-scroll-area>
  </q-drawer>
</template>

<style scoped lang="scss">
// Tab CSS Start
:deep(.q-tab__label) {
  font-size: 15px;
  font-weight: 700;
}
.drawerBtn {
  margin-top: 10px;
  margin-left: 40px;
}
.drawerHeaderBox {
  width: 350px;
}
.scrollBox {
  height: 100%;
  border-top: 1px solid #dddd;
}
.tab-panels {
  max-width: 350px;
}
.threadTypeLink {
  height: 21px;
}
.nameThreadBox {
  max-width: 330px;
  width: 100%;
}
.separator-class {
  border-bottom: 1px solid $grey-300;
}
.filter-menu {
  width: 750px;
  @media screen and (max-width: 500px) {
    width: 350px;
  }
}
.message-ellipsis {
  white-space: nowrap; 
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 230px;
  display: inline-block;
  vertical-align: middle;
}
</style>
