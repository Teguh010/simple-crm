<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useMessageStore from '@/stores/message-clinic'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import { concatenate } from '@/utils/aahUtils'
import _ from 'lodash'

const emits = defineEmits(['close'])
const employeesStore = useEmployeeStore()
const customerStore = useCustomerStore()
const messageStore = useMessageStore()
const showPets = ref(false)
const customerList = ref([])
const customerListDefault = reactive<any>([])
const petList = ref<any>([])
const petListDefault = reactive<any>([])
const employeesList = ref<any>([])
const employeesListDefault = reactive<any>([])
const props = defineProps({
  filterData: {
    type: Object,
    default: {
      name_thread: '',
      id_customer: '',
      id_pet: '',
      flg_closed: false,
      id_employee_ask: '',
      id_employee_answer: '',
      number_link1: '',
      flg_goal_achieved: false
    }
  },
  fields: {
    type: Object,
    default: {
      value: 0
    }
  },
  cancelFilter: {
    type: Object,
    default: {
      value: false
    }
  }
})

const updateModelValue = (v) => {}

const init = () => {
  if (
    props.filterData?.id_customer === null ||
    props.filterData?.id_customer === ''
  ) {
    props.filterData.id_pet = ''
    showPets.value = false
  } else if (
    props.filterData?.id_customer !== null ||
    props.filterData?.id_customer !== ''
  ) {
    showPets.value = true
  }
  if (petListDefault.length < 1) {
    props.filterData.id_pet = ''
  }
}
const closeModal = () => {
  emits('close')
}

const cancelFilteration = async () => {
  props.cancelFilter.value = true
  await messageStore.fetchThreadMessages()
  closeModal()
}

const filterThreadData = async () => {
  if (props.filterData) {
    let valuedkeys = Object.keys(props.filterData).filter(
      (key) => props.filterData[key] !== ''
    )
    let data = {}
    valuedkeys.forEach((key) => (data[key] = props.filterData[key]))
    let totalValuedKeysLength = Object.keys(props.filterData).filter(
      (key) => props.filterData[key] !== '' && props.filterData[key] !== false
    )

    await messageStore.fetchThreadMessages(data)
    props.fields.valuedTotalFields = totalValuedKeysLength.length
    emits('close')
  }
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
        if (petList.value.length > 0) {
          props.filterData.id_pet = petList.value[0].value
        }
      }
    }
  } else {
    props.filterData.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
  init()
}

onMounted(() => {
  employeesList.value.length = 0
  employeesListDefault.length = 0
  employeesList.value = [...employeesStore.getEmployeeListOptions]
  employeesListDefault.push(...employeesStore.getEmployeeListOptions)
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.filterData.id_customer) {
    handlePetsList(props.filterData.id_customer)
  }
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="title2 bold">追加絞り込み条件 </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-px-xl">
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12" :tabindex="1">
        <MtInputForm
          autofocus
          type="text"
          label="スレッド名"
          v-model="props.filterData.name_thread"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-lg-4 col-md-4 col-sm-6" :tabindex="2">
        <MtInputForm
          type="text"
          label="連携番号"
          v-model="props.filterData.number_link1"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-lg-4 col-md-4 col-sm-6" :tabindex="3">
        <MtFilterSelect
          v-model:selecting="props.filterData.id_customer"
          v-model:options="customerList"
          :options-default="customerListDefault"
          label="診察券番号・オーナー名"
          @update:selecting="handlePetsList"
          class="q-mt-md"
        />
      </div>
      <div class="col-lg-4 col-md-4 col-sm-6" :tabindex="4">
        <MtFilterSelect
          v-if="showPets"
          v-model:selecting="props.filterData.id_pet"
          :options-default="petListDefault"
          :options="petList"
          label="ペット名"
          class="q-mt-md"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-md" :tabindex="5">
      <div class="col-lg-4 col-md-4 col-sm-6">
        <InputEmployeeOptGroup
          v-model:selected="props.filterData.id_employee_ask"
          default-blank
          label="質問者名"
          clearable
          class="clear-icon"
          dense
        />
      </div>
      <div class="col-lg-4 col-md-4 col-sm-6" :tabindex="6">
        <InputEmployeeOptGroup
          v-model:selected="props.filterData.id_employee_answer"
          default-blank
          label="希望回答者"
          clearable
          class="clear-icon"
          dense
        />
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <span>
        <q-btn
          outline
          class="bg-grey-100 text-grey-800"
          @click="cancelFilteration"
        >
          キャンセル
        </q-btn>
      </span>
      <span :tabindex="7">
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          @click="filterThreadData"
        >
          保存
        </q-btn>
      </span>
    </div>
  </q-card-section>
</template>
