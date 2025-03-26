<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, ref } from 'vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useRequestStore from '@/stores/requests'
import router from '@/router'
import selectOptions from '@/utils/selectOptions'
import mtUtils from '@/utils/mtUtils'
import { concatenate, getDateToday } from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'
import useQueueTicketStore from '@/stores/queue_ticket'

const isEdit = ref(false)


const props = defineProps({ queueTicket: Object })

const emit = defineEmits(['close'])

const requestOptionList = ref([])

const data = ref({})

const closeModal = () => {

  emit('close')
}

const handleAutoRequestTitle = (ticketData: any) => {
  // let autoTitle = ''
  const selectedEmployeeDoctor = useEmployeeStore().getAllEmployees.find(
    (v: any) => v.value === ticketData?.id_employee_doctor
  )?.label
  const name_customer = concatenate(
    ticketData?.customer?.name_family,
    ticketData?.customer?.name_first
  )
  const fixedTextCustomer = name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeDoctor ? '/ 担当: ' : ''
  return (
    getDateToday() +
    ' ' +
    ticketData?.customer?.code_customer +
    ' ' +
    name_customer +
    ' ' +
    (fixedTextCustomer ?? '') +
    ' ' +
    (selectedEmployeeDoctor ?? '') +
    (fixedTextDoctor ?? '') +
    ' ' +
    (fixedTextStaff
      ? fixedTextDoctor !== ''
        ? fixedTextStaff
        : fixedTextStaff.replace('/ ', '')
      : '') +
    (selectedEmployeeDoctor ?? '')
  )
}

const createQTRequest = async (id_request: any) => {
  const payload = { ...props.queueTicket }
  payload.pet_name_ui = useCustomerStore().getCustomer.pets.filter((iPet) => props.queueTicket.id_pet.includes(iPet.id_pet))
    .map((pet: any) => ({
      name_pet: concatenate(pet.code_pet, useCustomerStore().getCustomer.name_family, pet.name_pet),
      id_pet: pet.id_pet
    }))
  payload.id_pet = props.queueTicket.id_pet
  payload.title_request = handleAutoRequestTitle(props.queueTicket)
  await mtUtils.callApi(selectOptions.reqMethod.POST, 'queue_ticket_request', payload)
  emit('close')
}


const openRequestDetail = (id_request: any) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })
  window.open(route.href, '_blank')
}

const handleSubmit = async () => {

  await useQueueTicketStore().updateQueueTicketList(data.value.id_queue_ticket,
    {
      ...data.value,
      type_visit_purpose_ticket: Array.isArray(data.value.type_visit_purpose_ticket) ? data.value.type_visit_purpose_ticket.join(',') : data.value.type_visit_purpose_ticket
    })
  
  emit('close')
}


async function getBookedRequestList(value: any) {
  const requestList = await useRequestStore().fetchBookingRequest({
    id_customer: props.queueTicket.id_customer,
    flg_complete: false
  })
  if (requestList && requestList.length > 0) {
    requestOptionList.value = requestList.map((item: any) => ({
      label: `${item.flg_booking ? '【予約】- ' : ''}${item.number_request} - ${item.title_request}`,
      value: item.id_request
    }))
    data.value.id_request = requestOptionList.value[0].value

  } else {
    requestOptionList.value = []
  }
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([getBookedRequestList(),
    useCustomerStore().selectCustomer(props.queueTicket.id_customer)])
  
  if (props.queueTicket) {
    data.value = { ...props.queueTicket }
    if (requestOptionList.value && requestOptionList.value.length > 0) {
      data.value.id_request = requestOptionList.value[0].value
    }
  }

})
</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader :closeBtn="true" @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        未完了リクエストの連携
      </q-toolbar-title>
      <q-space></q-space>
    </MtModalHeader>
    <q-card-section class="q-px-xl q-my-md">
      <div class="flex justify-between q-mb-lg">
        <p class="q-ma-none">対象のリクエストを選択してください。</p>
        <q-btn
          color="primary"
          size="md"
          text-color="white"
          unelevated
          @click.stop="createQTRequest"
        >
          <q-icon name="add" class="q-mr-sm" />
          リクエスト
        </q-btn>
      </div>
      <MtFormPullDown v-model:selected="data.id_request" :custom-option="true" :options="requestOptionList">
        <template v-slot:option="options">
          <q-item v-bind="options.slotProps.itemProps">
            <q-item-section>
              <q-item-label v-html="options.slotProps.opt.label" />
            </q-item-section>
            <q-item-section side>
              <q-btn
                class="q-ml-lg"
                outline
                size="sm"
                text-color="black"
                unelevated
                @click.stop="openRequestDetail(options.slotProps.opt.value)"
              >
                別タブで開く
              </q-btn>
            </q-item-section>
          </q-item>
        </template>
      </MtFormPullDown>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>選択</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
