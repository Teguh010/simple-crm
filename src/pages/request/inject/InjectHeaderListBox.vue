<script lang="ts" setup>

import aahValidations from '@/utils/aahValidations'
import { calculateDate, calculateDays, getDateToday, getFullPetNameWithoutHonorific } from '@/utils/aahUtils'
import { timeHourMinute } from '@/utils/enum'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { onMounted, reactive, ref, watch } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCustomerStore from '@/stores/customers'
import usePetBioStore from '@/stores/pet-bios'
import useInjectStore from '@/stores/inject'
import useCliCommonStore from '@/stores/cli-common'


const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const petBioStore = usePetBioStore()

const props = defineProps({
  requestObj: <any>Object,
  injectHeader: Object
})

const defaultEmployee = props.requestObj.id_employee_doctor ?? props.requestObj.id_employee_staff ?? JSON.parse(localStorage.getItem('id_employee'))
useInjectStore().setCurrentSelectedIdEmployee(defaultEmployee)

const injectForm = ref({
  id_inject: props?.injectHeader?.id_inject ?? null,
  number_inject: '',
  flg_non_charge: false,
  flg_delivered: false,
  flg_next_cart: false,
  flg_apply_insurance: false,
  id_pet_illness_history: [],
  id_request: null,
  id_pet_bio_info: null,
  val_weight: null,
  id_pet: null,
  title_inject: '',
  type_booking: 1,
  id_customer: null,
  date_start: null,
  date_end: null,
  time_start: '00:00',
  time_end: '00:00',
  datetime_start: '',
  datetime_end: '',
  memo_cancel: null,
  flg_cancel: false,
  id_clinic: '',
  id_employee_doctor: defaultEmployee,
  id_employee_staff: null,
  memo_inject: '',
  booking: {}
})
const petIllnessHistoryList = ref([])
const petIllnessHistoryListDefault = reactive([])

const getFormData = () => {

  if (injectForm.value.booking && injectForm.value.booking.flg_booking) {
    injectForm.value.booking.datetime_booking_confirmed = `${injectForm.value.booking.date_booking_confirmed}`
    if (injectForm.value.booking.FlgUI && injectForm.value.booking.time_booking_confirmed) {
      injectForm.value.booking.datetime_booking_confirmed = `${injectForm.value.booking.date_booking_confirmed} ${injectForm.value.booking.time_booking_confirmed}:00`
    } else {
      injectForm.value.booking.datetime_booking_confirmed = `${injectForm.value.booking.date_booking_confirmed} 00:00:00`
    }
  }
  
  return injectForm.value
}

defineExpose({
  getFormData
})

watch(() => useInjectStore().currentSelectedIdEmployeeDoctor, (nowValue, oldValue) => {
  if (nowValue && nowValue != oldValue) {
    injectForm.value.id_employee_doctor = nowValue
  }
})

const handleAutoInjectTitle = (value: any = null) => {
  const date_start = injectForm.value.date_start
  const date_end = injectForm.value?.date_end ?? ''
  if (date_end == '') {
    injectForm.value.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
      petObj.id_pet === (props.requestObj?.id_pet ?? props.injectObj?.id_pet)), customerStore.getCustomer)} 様 の注射・点滴（ ${date_start} ）`
    return
  }
  injectForm.value.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
    petObj.id_pet === (props.requestObj?.id_pet ?? props.injectObj?.id_pet)), customerStore.getCustomer)} 様 の注射・点滴（ ${date_start} ～  ${date_end} ）`
}


const selectDefaultEmployee = (key: string) => {
  injectForm.value[key] = defaultEmployee
}


const calculateDateStartInjection = () => {
  if (getDateToday() >= props.requestObj.date_request_start && getDateToday() <= props.requestObj.date_request_goal) return getDateToday()
  if (getDateToday() < props.requestObj.date_request_start) return props.requestObj.date_request_start
  if (getDateToday() > props.requestObj.date_request_goal) return props.requestObj.date_request_goal
  return props.requestObj.date_request_start
}

onMounted(async () => {
  injectForm.value = {
    ...injectForm.value,
    id_pet: props.requestObj.id_pet,
    id_request: props.requestObj.id_request,
    id_employee_doctor: props?.injectHeader?.id_employee_doctor ?? props.requestObj.id_employee_doctor,
    id_customer: props.requestObj.id_customer,
    date_start: calculateDateStartInjection(),
    datetime_start: `${calculateDateStartInjection()} 00:00:00`,
    flg_non_charge: props.requestObj.flg_complete,
    flg_apply_insurance: props.requestObj.flg_apply_insurance,
    booking: {
      FlgUI: false,
      id_customer: props.requestObj.id_customer,
      id_pet: props.requestObj.id_pet
    }
  }

  if (props.injectHeader) {
    injectForm.value = {
      ...props.injectHeader,
      booking: {
        FlgUI: false,
        id_customer: props.requestObj.id_customer,
        id_pet: props.requestObj.id_pet
      }
    }
  }
  
  injectForm.value.date_end = calculateDate(injectForm.value.date_start, 1)
  handleAutoInjectTitle()


  await Promise.all([petBioStore.fetchPetBio({
    id_pet: injectForm.value.id_pet ?? props.injectHeader.id_pet,
    id_customer: injectForm.value.id_customer ?? props.injectHeader.id_customer,
    fetch_weight: true
  }), illnessHistoryStore.fetchPreparationIllnessHistorys({ 'id_pet': injectForm.value.id_pet })])

  petIllnessHistoryList.value = [...illnessHistoryStore.getAllIllnessHistorys, ...illnessHistoryStore.getAllDiseaseFreeData]
  illnessHistoryStore.getAllIllnessHistorys.forEach((illnessHistory: any) => {
    petIllnessHistoryListDefault.push(illnessHistory)
  })


  if (!injectForm.value.id_inject && !injectForm.value.id_pet_bio_info) {
    if (petBioStore.getPetBioOptionDefault.length > 0) {
      injectForm.value.val_weight = petBioStore.getPetBioOptionDefault[0].val_weight
      injectForm.value.id_pet_bio_info = petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
      useInjectStore().setValWeight(injectForm.value.val_weight)
    }
  }

  if (props.injectHeader && props.injectHeader.id_inject && props.injectHeader.id_pet_bio_info) {
    useInjectStore().setValWeight(injectForm.value.val_weight)
  }

  if (injectForm.value.id_pet_illness_history.length === 0 && petIllnessHistoryList.value.length > 0) {
    const illnessHistory = illnessHistoryStore?.getIllnessHistory?.id_pet_illness_history
    if (illnessHistory) injectForm.value.id_pet_illness_history.push(illnessHistory)
  }

  injectForm.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

})

</script>
<template>
  <div>
    <div class="row q-col-gutter-md q-my-sm">
      <div class="col">
        <MtFormInputDate
          v-model:date="injectForm.date_start"
          :disable="disabledHeaderUpdate"
          :rules="[aahValidations.validationRequired]"
          label="注射/点滴 開始日"
          required
          @update:date="
            () => {
              injectForm.date_end = injectForm.date_start
              injectForm.total_days_dose = calculateDays(
                injectForm.date_start,
                injectForm.date_end
              )
              useInjectStore().setCurrentHeader(injectForm)
            }
          "
        />
      </div>
      <div class="col" v-if="injectForm.time_flg_Ui" >
        <MtFormPullDown
          v-model="injectForm.time_start"
          :options="timeHourMinute"
          label="時：分"
          type="selection"
        />
      </div>
      <div class="col">
        <MtFormInputDate
          v-model:date="injectForm.date_end"
          :disable="disabledHeaderUpdate"
          label="注射/点滴 終了日"
          @update:date="
            () => {
              if (injectForm.date_start > injectForm.date_end) {
                injectForm.date_start = injectForm.date_end
              }
              injectForm.total_days_dose = calculateDays(
                injectForm.date_start,
                injectForm.date_end
              )
            }
          "
        />
      </div>
      <div class="col" v-if="injectForm.time_flg_Ui" >
        <MtFormPullDown
          v-model="injectForm.time_end"
          :options="timeHourMinute"
          label="時：分"
          type="selection"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md q-my-sm">
      <div class="col-4">
        <q-select
          v-model="injectForm.id_pet_illness_history"
          :options="petIllnessHistoryList"
          clearable
          dense
          emit-value
          label="既往歴"
          map-options
          multiple
          use-chips
        />
      </div>
      <div class="col-4">
        <InputEmployeeOptGroup
          v-model="injectForm.id_employee_doctor"
          :disable="disabledHeaderUpdate"
          :rules="[aahValidations.validationRequired]"
          @update:selected="(value)=> useInjectStore().setCurrentSelectedIdEmployee(value)"
          department-selected=""
          label="担当医 *"
          required
          type-occupation="doctor"
          @update:select-default-employee="selectDefaultEmployee('id_employee_doctor')"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-my-md">
      <MtFormPullDown v-model:selected="injectForm.type_inject_route"
                      :options="useCliCommonStore().getCliCommonTypeMedRouteList"
                      class="col-4"
                      label="投与経路"
      />
    </div>
    <div class="row q-col-gutter-md q-my-md">
      <div class="col-12">
        <MtInputForm
          v-model="injectForm.memo_inject"
          autogrow
          label="注射指示メモ"
          type="text"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-md">

      <div class="col-3">
        <MtFormCheckBox
          v-model:checked="injectForm.time_flg_Ui"
          label="時刻"
        />
      </div>
      <div class="col-3">
        <MtFormCheckBox v-model:checked="injectForm.flg_non_charge" :disable="disabledHeaderUpdate"
                        @update:checked="()=>useInjectStore().setCurrentHeader(injectForm)" 
                        label="会計対象外" />
      </div>
      <div class="col-3">
        <MtFormCheckBox v-model:checked="injectForm.flg_next_cart" :disable="disabledHeaderUpdate"
                        label="次回の会計" />
      </div>
      <div class="col-3">
        <MtFormCheckBox v-model:checked="injectForm.flg_apply_insurance" label="保険適用" />
      </div>
      <template v-if="injectForm.booking.flg_booking">
        <div class="col-3">
          <MtFormInputDate
            v-model:date="injectForm.booking.date_booking_confirmed"
            label="予定日"
          />
        </div>
        <div class="col-3 text-center">
          <MtInputForm
            v-model="injectForm.booking.FlgUI"
            :items="[{ label: '時刻' }]"
            type="checkbox"
          />
        </div>
        <div v-if="injectForm.booking.FlgUI" class="col-3">
          <MtFormPullDown
            v-model:selected="injectForm.booking.time_booking_confirmed"
            :options="timeHourMinute"
            label="時：分"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>

</style>