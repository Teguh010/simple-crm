<script setup>
import useCustomerStore from '@/stores/customers';
import MtFormInputDate from './MtFormInputDate.vue';
import MtInputForm from './MtInputForm.vue';
import { storeToRefs } from 'pinia';
import { onMounted, reactive, readonly, ref } from 'vue';
import InputEmployeeOptGroup from './InputEmployeeOptGroup.vue';
import usePetStore from '@/stores/pets';
import MtModalHeader from '../MtModalHeader.vue';
import { typeGroupItem } from '@/utils/enum';
import MtFormPullDown from './MtFormPullDown.vue';
import MtSearchItemServiceUnit from '../MtSearchItemServiceUnit.vue';
import aahValidations from '@/utils/aahValidations';
import useThreadCustomer from '@/stores/message-customer';
import MtFormCheckBox from './MtFormCheckBox.vue';
import useIllnessHistoryStore from '../../stores/illness-history';
import mtUtils from '@/utils/mtUtils'

const formData = reactive({
   code_customer: "",
   date_request_goal: "",
   date_request_start: "",
   flg_booking: true, 
   flg_in_app_payment: false, 
   flg_non_charge: false, 
   flg_ticket: false, 
   id_clinic: "",
   id_customer: "",
   id_employee_doctor: "",
   id_employee_request: "",
   id_employee_staff: "",
   id_pet: "",
   id_request: "",
   id_request_old: "",
   memo_request: "",
   name_customer: "",
   name_employee_request: "",
   name_employee_staff: "",
   number_request: "",
   title_request: "",
   type_group_item : null
})
const customerThreadStore = useThreadCustomer()
const illnessHistoryStore = useIllnessHistoryStore()
const selectedTreat = JSON.parse(localStorage.getItem('selectedTreat'))
const id_employee = ref(JSON.parse(localStorage.getItem('id_employee')))
const customerStore = useCustomerStore()
const { getCustomer, getCustomers } = storeToRefs(customerStore)
const petsStore = usePetStore()
const { getPets } = storeToRefs(petsStore)
const threatValue = ref('')
const customerName = ref('')
const memoGoal = ref(selectedTreat?.memo_goal)
const pets = selectedTreat?.name_thread.split('/')[1].split(',')
const petname = ref('')
const webURL = ref('')
const support = ref('')
const idEmployee = ref(id_employee || '')
const typeItem = ref('')
const itemServiceName = ref('')
const menuCheck = ref(false)
const memoGoalDateArr = ref([])
const reservationDate = ref('')
const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const init = () => {
   selectedTreat?.memo_goal.split('\n').map((d) => {
      if (d?.includes('第1希望日') || d?.includes('第2希望日') || d?.includes('第3希望日')) {
         memoGoalDateArr.value.push(d?.split(' : ')[1] + ':00')
      }
   })
   threatValue.value = selectedTreat?.type_thread === 80 ? '有料オンライン相談' : ''
   let customer = getCustomers.value.find((customer) => {
     return customer.id_customer === selectedTreat?.id_customer
   })
   if (customer) {
     customerName.value = customer?.name_family + ' ' + customer?.name_first
   }
  let pets = []
  let pet = getPets.value.find((pet) => pet.id_pet === selectedTreat?.id_pet )?.name_pet
  pets.push(pet)
  petname.value = pets
}

const submit = async () => {
   const Reservationdata = {
      // id_message_thread : selectedTreat?.id_message_thread,
      id_item_service_unit: itemServiceName?.value,
      datetime_service_start: reservationDate.value,
      flg_in_app_payment: menuCheck?.value,
      id_employee_doctor:  idEmployee.value,
      id_clinic: selectedTreat?.id_clinic
   }

   let arr = []
   selectedTreat?.pets?.forEach(async(ele) => {
      const data = {
         petId : ele,
         clinicId : selectedTreat.id_clinic,
         customerId : selectedTreat.id_customer
      }
      await illnessHistoryStore.fetchPetIllnessHistorys(data).then(async (resp) => {
         if (resp && resp.data.data.length > 0) {
            arr.push(true)
         } else {
            arr.push(false)
         }
      })
   });
   if (selectedTreat?.pets?.length === (arr?.length + 1) && !arr.includes(false)) {
      await customerThreadStore.ThreadConsultoReservation(selectedTreat?.id_message_thread, Reservationdata).then((res) => {
         if (res) {
            let confirmMsg = res?.data?.message
            mtUtils.autoCloseAlert(confirmMsg).then((resp) => {
               closeModal()
            })
         }
      })
   } else {
      let confirmMsg = '対象のペットには既往歴がありません。既往歴を作成してからもう一度お試しください'
      mtUtils.autoCloseAlert(confirmMsg).then((resp) => {
         closeModal()
      })
   }
}
// const handleTypeGroupItem = (val) => {
//    typeItem.value = val
// } 

const selectingItemService = (value) => {
   if (value !== null && value !== '') {
    itemServiceName.value = value?.id_item_service_unit
  } else {
    itemServiceName.value = ''
  }
}

const handleNewTab = (value) => {
   menuCheck.value = value
}

const handledateReservation = (val) => {
   reservationDate.value = val
}

onMounted(async() => {
   await customerStore.fetchCustomers()
   init()
  
})
</script>
<template>
   <q-form @submit="submit">
      <MtModalHeader @closeModal="closeModal">
         <q-toolbar-title>
            有料相談の予約作成
         </q-toolbar-title>
      </MtModalHeader>
      <q-card-section class="q-px-xl">
               <div class="row q-col-gutter-md q-mb-md">
                  <div class="col-4">
                     <MtInputForm
                        readonly="readonly"
                        v-model="customerName"
                        autogrow
                        type="text"
                        label="顧客名"
                     />
                  </div>
                  <div class="col-8">
                     <MtSearchItemServiceUnit
                        label="商品CD・名称"
                        :type="typeGroupItem"
                        :rules="[aahValidations.validationSelection]"
                        @update:selectingWhole="selectingItemService"
                     />
                  </div>
                  <!-- <div class="col-4">
                     <MtInputForm
                        readonly="readonly"
                        v-model="threatValue"
                        autogrow
                        type="text"
                        label="相談種別"
                     />
                  </div>
                  <div class="col-4"> 
                     <MtFormPullDown
                        type="selection"
                        dense
                        label="グループ区分"
                        v-model:selected="typeItem"
                        :options="typeGroupItem"
                        @update:model-value="handleTypeGroupItem"
                     />
                  </div> -->
              </div>
            <div class="row q-col-gutter-md q-mb-lg">
               <div v-for="pet in pets" v-bind:key="pet">
                  <q-chip outline color="black" text-color="black" icon-right="highlight_off">{{ pet }}</q-chip>
               </div>
            </div> 
            <div class="row q-col-gutter-md q-mb-md">
               <div class="col-6 round-section-free-bg q-ma-none bg-accent-050">
                  <MtInputForm
                     autogrow
                     readonly="readonly"
                     v-model="memoGoal"
                     type="text"
                     label="相談内容"
                  />
               </div>
               <div class="col-6">
                  <div class="row q-col-gutter-md q-mb-md">
                     <!-- <MtFormInputDate
                        readonly="readonly"
                        autofocus
                        v-model:date="ReservationDate"
                        label="予約日時"
                        type="date"
                        class="col-6"
                        :notOpen="false"
                        
                     /> -->
                     <MtFormPullDown
                        type="selection"
                        class="col-6"
                        label="予約日時"
                        v-model="reservationDate"
                        :options="memoGoalDateArr"
                        @update:model-value="handledateReservation"
                        :rules="[aahValidations.validationRequired]"
                     />
                     <InputEmployeeOptGroup
                        readonly="readonly"
                        v-model:selected="idEmployee"
                        class="col-6"
                        label="獸医師"
                        hide-dropdown-icon
                        @update:select-default-employee="idEmployee.value"
                     />
                  </div>
                  <!-- <div class="col-12">
                     <MtInputForm
                        autogrow
                        type="text"
                        v-model="webURL"
                        label="web URL"
                        class="full-width q-mb-md"
                     />
                     <MtInputForm
                        autogrow
                        v-model="support"
                        type="text"
                        label="支扒乚方法"
                        class-style="full-width"
                     />
                  </div> -->
                  <div class="col-12">
                     <MtFormCheckBox
                      v-model:checked="menuCheck"
                      label="アプリ決済"
                      type="checkbox"
                      class="q-my-lg"
                      @update:checked="handleNewTab"
                    />
                  </div>
               </div>
            </div>
         </q-card-section>
         <q-card-section class="q-bt bg-white">
            <div class="text-center modal-btn">
            <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
               <span>キャンセル</span>
            </q-btn>
            <q-btn
               class="q-ml-md"
               color="primary"
               type="submit"
               unelevated
            >
               <span>保存</span>
            </q-btn>
            </div>
    </q-card-section>
   </q-form>
</template>
<style scoped>
.col-6 {
   width: 50%;
}
.grid {
   display: grid;
   grid-template-columns: 30% 30% 30%;
   align-items: end;
   justify-content: space-between;
}
</style>