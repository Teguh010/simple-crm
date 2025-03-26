<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, ref, watch, reactive, computed } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import mtUtils from '@/utils/mtUtils'
import useTask from '@/stores/task'
import UpdateTaskModal from './UpdateTaskModal.vue'
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import { storeToRefs } from 'pinia'
import { concatenate, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import { CliCommon } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const taskStore = useTask()
const isPet = ref(false)
const petList: any = ref([])
const petListDefault: any = reactive([])
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const cliCommonStore = useCliCommonStore()
// const { getAction } = storeToRefs(actionStore)
const action = computed(() => actionStore.action)

const { getCustomer } = storeToRefs(customerStore)
const { getTaskSearchParams } = storeToRefs(taskStore)
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const customerList = ref([])
const customerListDefault = reactive([])
//const id_customer = ref('')
const searchData = ref({
  number_task: '',
  name_pet: '',
  type_task_place: '',
  code_customer: '',
  id_customer: '',
  id_pet: '',
  title_task: '',
  date_start: getDaysBefore(3),
  date_end: getDateToday()
})

const openAddModal = async () => {
  taskStore.selectTask(null)
  await mtUtils.popup(UpdateTaskModal, {}, true)
}

const search = () => {
  let count = 0
  Object.keys(searchData.value).forEach((key) => {
    if (key != 'date_start' && key != 'date_end' && key != 'id_customer') {
      if (
        (['number', 'string'].includes(typeof searchData.value[key]) &&
          searchData.value[key] !== '') ||
        searchData.value[key]?.length > 0
      ) {
        count += 1
      }
    }
  })
  taskStore.fetchTask({
    title_task: searchData?.value?.title_task,
    number_task: searchData?.value?.number_task,
    id_pet: searchData?.value?.id_pet,
    type_task_place: searchData?.value?.type_task_place,
    code_customer: searchData?.value?.code_customer,
    date_start: searchData?.value?.date_start,
    date_end: searchData?.value?.date_end
  })
  taskStore.setTaskSearchParams(searchData.value, count)
  closeModal()
}

async function selectingCustomer(value: any, initCall = false) {
  isPet.value = false
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
    await customerStore.selectCustomer(value)
    let selectedCustomer = getCustomer.value
    if (selectedCustomer) {
      searchData.value.code_customer = selectedCustomer.code_customer
      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
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
        isPet.value = true
        if (petList.value.length > 0) {
          searchData.value.id_pet = petList.value[0].value // set first pet as default in create task
        }
      }
    }
  } else {
    searchData.value.code_customer = ''
    // requestForm.code_ahmics_customer = ''
    searchData.value.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}
const getPlaces = computed(() => {
  return getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))
})
watch(action, () => {
  // =======================
  // WATCH GETACTION ON PINIA, NOTE : DO NOT UPDATE THIS watch() FUNCTION WITHOUT PERMISSION OF RIZAL OR MOTO
  // =======================
  if (action.value === 'createTask') {
    openAddModal()
    actionStore.resetAction()
  }
})

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  // taskStore.fetchTask({
  //   date_start: searchData?.value?.date_start,
  //   date_end: searchData?.value?.date_end
  // })
  if (
    action.value === 'createTask' ||
    localStorage.getItem('pageAction') === 'createTask'
  ) {
    openAddModal()
    sessionStorage.setItem('pageType', 'modal')
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
  if (getTaskSearchParams.value) {
    for (let key in getTaskSearchParams.value) {
      searchData.value[key] = getTaskSearchParams.value[key]
    }
    selectingCustomer(searchData.value.id_customer)
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-lg">
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="searchData.title_task"
        label="タスク名"
        outlined
        type="text"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFilterSelect
        v-model:options="customerList"
        v-model:selecting="searchData.id_customer"
        :options-default="customerListDefault"
        label="診察券番号 "
        outlined
        @update:selecting="selectingCustomer"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtPetFilterSelect
        v-model:selecting="searchData.id_pet"
        :pet-list="petList"
        label="ペット名"
        outlined
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFormPullDown
        v-model:selected="searchData.type_task_place"
        :options="getPlaces"
        label="対象部署"
        outlined
        type="selection"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="searchData.number_task"
        label="タスク番号"
        outlined
        type="text"
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn color="primary" class="q-ml-md" @click="search">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
