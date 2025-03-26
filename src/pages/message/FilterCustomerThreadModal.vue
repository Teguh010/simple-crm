<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useThreadCustomer from '@/stores/message-customer'
import useCustomerStore from '@/stores/customers'
import { typeCustomerThread } from '@/utils/enum'
const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const customerThreadStore = useThreadCustomer()
const customerList = ref([])
const customerListDefault = reactive<any>([])
const threadTypeList = ref<any>([])
const threadTypeListDefault = reactive<any>([])
const props = defineProps({
  filterData: {
    type: Object,
    default: {
      name_thread: '',
      id_customer: '',
      type_thread: 50
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

const threadType = [
  { value: 50, label: '予約_処方箋', enLabel: 'BOOKING PRESCRIPTION' },
  { value: 60, label: 'ホテルの予約', enLabel: 'BOOKING HOTEL' },
  { value: 70, label: '予約サロン', enLabel: 'BOOKING SALON' }
]
const closeModal = () => {
  emits('close')
}

const cancelFilteration = async () => {
  props.cancelFilter.value = true
  await customerThreadStore.fetchThreadMessages()
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
      (key) => props.filterData[key] !== ''
    )
    await customerThreadStore.fetchThreadMessages(data)
    props.fields.valuedTotalFields = totalValuedKeysLength.length
    emits('close')
  }
}

onMounted(() => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  threadTypeList.value.length = 0
  threadTypeListDefault.length = 0
  threadTypeList.value = [...typeCustomerThread]
  threadTypeListDefault.push(...typeCustomerThread)
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="title2 bold"
      >追加条件で絞り込み
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="q-px-xl">
    <MtInputForm
      type="text"
      label="スレッド名"
      v-model="props.filterData.name_thread"
    />
    <MtFilterSelect
      v-model:selecting="props.filterData.id_customer"
      v-model:options="customerList"
      :options-default="customerListDefault"
      label="診察券番号・オーナー名"
      class="q-mt-md"
    />
    <MtFilterSelect
      v-model:selecting="props.filterData.type_thread"
      v-model:options="threadTypeList"
      :options-default="threadTypeListDefault"
      label="予約依頼区分"
      class="q-mt-md"
    />
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn
        outline
        class="bg-grey-100 text-grey-800"
        @click="cancelFilteration()"
      >
        <span>キャンセル</span>
      </q-btn>
      <q-btn
        unelevated
        color="primary"
        class="q-ml-md"
        @click="filterThreadData"
      >
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
