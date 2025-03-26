<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahValidations from '@/utils/aahValidations'
import { blank } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import { typeBusinessDay, timeHour, timeMinute } from '@/utils/enum'

const props = defineProps({ data: Object })

const emits = defineEmits(['close'])
const businessHourSlot = useBusinessHourSlot()
const clinicStore = useClinicStore()
const { getAllClinics,getClinics } = storeToRefs(clinicStore)

const isEdit = ref(false)
const slot2Active = ref(false)
const slot3Active = ref(false)

const businessSlot = ref({
  //id_business_hour_slot: null,

  type_business_day: 1,
  id_clinic: null,
  name_business_hour: null,
  ticket_limit_upper1: null,
  time_business_start1: null,
  time_business_start1hour: null,
  time_business_start1minute: null,
  time_business_end1hour: null,
  time_business_end1minute: null,
  time_business_end1: null,

  time_checkin_start1: null,
  time_checkin_start1hour: null,
  time_checkin_start1minute: null,
  time_checkin_end1hour: null,
  time_checkin_end1minute: null,
  time_checkin_end1: null,

  time_ticket_issue_start1: null,
  time_ticket_issue_start1hour: null,
  time_ticket_issue_start1minute: null,
  time_ticket_issue_end1hour: null,
  time_ticket_issue_end1minute: null,
  time_ticket_issue_end1: null,

  flg_add_slot2_UI: false,
  ticket_limit_upper2: null,
  time_business_start2: null,
  time_business_start2hour: null,
  time_business_start2minute: null,
  time_business_end2hour: null,
  time_business_end2minute: null,
  time_business_end2: null,

  time_checkin_start2: null,
  time_checkin_start2hour: null,
  time_checkin_start2minute: null,
  time_checkin_end2hour: null,
  time_checkin_end2minute: null,
  time_checkin_end2: null,

  time_ticket_issue_start2: null,
  time_ticket_issue_start2hour: null,
  time_ticket_issue_start2minute: null,
  time_ticket_issue_end2hour: null,
  time_ticket_issue_end2minute: null,
  time_ticket_issue_end2: null,

  flg_add_slot3_UI: false,
  ticket_limit_upper3: null,
  time_business_start3: null,
  time_business_start3hour: null,
  time_business_start3minute: null,
  time_business_end3hour: null,
  time_business_end3minute: null,
  time_business_end3: null,

  time_checkin_start3: null,
  time_checkin_start3hour: null,
  time_checkin_start3minute: null,
  time_checkin_end3hour: null,
  time_checkin_end3minute: null,
  time_checkin_end3: null,

  time_ticket_issue_start3: null,
  time_ticket_issue_start3hour: null,
  time_ticket_issue_start3minute: null,
  time_ticket_issue_end3hour: null,
  time_ticket_issue_end3minute: null,
  time_ticket_issue_end3: null,

  display_order: '999'
})

const hideSlots = ref(false)
const blankField = (row: any) => (businessSlot.value = blank(businessSlot.value, row))

const submit = () => {
  if(businessSlot.value.type_business_day !== 90){
  businessSlot.value.time_business_start1 =
    businessSlot.value.time_business_start1hour +
    ':' +
    businessSlot.value.time_business_start1minute
  businessSlot.value.time_business_end1 =
    businessSlot.value.time_business_end1hour +
    ':' +
    businessSlot.value.time_business_end1minute
  businessSlot.value.time_checkin_start1 =
    businessSlot.value.time_checkin_start1hour +
    ':' +
    businessSlot.value.time_checkin_start1minute
  businessSlot.value.time_checkin_end1 =
    businessSlot.value.time_checkin_end1hour + ':' + businessSlot.value.time_checkin_end1minute
  businessSlot.value.time_ticket_issue_start1 =
    businessSlot.value.time_ticket_issue_start1hour +
    ':' +
    businessSlot.value.time_ticket_issue_start1minute
  businessSlot.value.time_ticket_issue_end1 =
    businessSlot.value.time_ticket_issue_end1hour +
    ':' +
    businessSlot.value.time_ticket_issue_end1minute

  if (businessSlot.value.flg_add_slot2_UI) {
    businessSlot.value.time_business_start2 =
      businessSlot.value.time_business_start2hour +
      ':' +
      businessSlot.value.time_business_start2minute
    businessSlot.value.time_business_end2 =
      businessSlot.value.time_business_end2hour +
      ':' +
      businessSlot.value.time_business_end2minute
    businessSlot.value.time_checkin_start2 =
      businessSlot.value.time_checkin_start2hour +
      ':' +
      businessSlot.value.time_checkin_start2minute
    businessSlot.value.time_checkin_end2 =
      businessSlot.value.time_checkin_end2hour +
      ':' +
      businessSlot.value.time_checkin_end2minute
    businessSlot.value.time_ticket_issue_start2 =
      businessSlot.value.time_ticket_issue_start2hour +
      ':' +
      businessSlot.value.time_ticket_issue_start2minute
    businessSlot.value.time_ticket_issue_end2 =
      businessSlot.value.time_ticket_issue_end2hour +
      ':' +
      businessSlot.value.time_ticket_issue_end2minute
  }
  if (businessSlot.value.flg_add_slot3_UI && businessSlot.value.flg_add_slot2_UI) {
    businessSlot.value.time_business_start3 =
      businessSlot.value.time_business_start3hour +
      ':' +
      businessSlot.value.time_business_start3minute
    businessSlot.value.time_business_end3 =
      businessSlot.value.time_business_end3hour +
      ':' +
      businessSlot.value.time_business_end3minute
    businessSlot.value.time_checkin_start3 =
      businessSlot.value.time_checkin_start3hour +
      ':' +
      businessSlot.value.time_checkin_start3minute
    businessSlot.value.time_checkin_end3 =
      businessSlot.value.time_checkin_end3hour +
      ':' +
      businessSlot.value.time_checkin_end3minute
    businessSlot.value.time_ticket_issue_start3 =
      businessSlot.value.time_ticket_issue_start3hour +
      ':' +
      businessSlot.value.time_ticket_issue_start3minute
    businessSlot.value.time_ticket_issue_end3 =
      businessSlot.value.time_ticket_issue_end3hour +
      ':' +
      businessSlot.value.time_ticket_issue_end3minute
  }
}
  if (props.data) {
    businessHourSlot
      .updateBusinessHourSlot(businessSlot.value.id_business_hour_slot, businessSlot.value)
      .then(() => {
        businessHourSlot.fetchBusinessHourSlots()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    businessSlot.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    businessHourSlot.submitBusinessHourSlot(businessSlot.value).then(() => {
      businessHourSlot.fetchBusinessHourSlots()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const handleTypeBusinessDay = (value: any) => {
  if(value === 90) {
    hideSlots.value = true
    blankField([
                'ticket_limit_upper1',
                'time_business_start1hour',
                'time_business_start1minute',
                'time_business_end1hour',
                'time_business_end1minute',
                'time_checkin_start1hour',
                'time_checkin_start1minute',
                'time_checkin_end1hour',
                'time_checkin_end1minute',
                'time_ticket_issue_start1hour',
                'time_ticket_issue_start1minute',
                'time_ticket_issue_end1hour',
                'time_ticket_issue_end1minute',
                'ticket_limit_upper2',
                'time_business_start2hour',
                'time_business_start2minute',
                'time_business_end2hour',
                'time_business_end2minute',
                'time_checkin_start2hour',
                'time_checkin_start2minute',
                'time_checkin_end2hour',
                'time_checkin_end2minute',
                'time_ticket_issue_start2hour',
                'time_ticket_issue_start2minute',
                'time_ticket_issue_end2hour',
                'time_ticket_issue_end2minute',
                'ticket_limit_upper3',
                'time_business_start3hour',
                'time_business_start3minute',
                'time_business_end3hour',
                'time_business_end3minute',
                'time_checkin_start3hour',
                'time_checkin_start3minute',
                'time_checkin_end3hour',
                'time_checkin_end3minute',
                'time_ticket_issue_start3hour',
                'time_ticket_issue_start3minute',
                'time_ticket_issue_end3hour',
                'time_ticket_issue_end3minute'
              ])
  }else{
    hideSlots.value = false
  }
}

const handleClinic = (value: any) => {
  if(value){
    init()
  }else{
    hideSlots.value = false
   // slot2Active.value = false
    businessSlot.value.flg_add_slot2_UI = false
   // slot3Active.value = false
    businessSlot.value.flg_add_slot3_UI = false
    handleCheckbox1(false)
    handleCheckbox2(false)
  }
}

const init = () => {
  if(businessSlot.value.id_clinic){
    let selClinic = getClinics.value.find((clinic) => clinic.id_clinic === businessSlot.value.id_clinic)
    if(selClinic){
      hideSlots.value = !selClinic.flg_business_hour_slot1
      slot2Active.value = selClinic.flg_business_hour_slot2
      businessSlot.value.flg_add_slot2_UI = selClinic.flg_business_hour_slot2
      slot3Active.value = selClinic.flg_business_hour_slot3
      businessSlot.value.flg_add_slot3_UI = selClinic.flg_business_hour_slot3
    }
  }
}

const handleCheckbox1 = (value: any) => {
  if(value === true) {
    businessSlot.value.time_business_start2hour = businessSlot.value.time_business_end1hour
    businessSlot.value.time_business_start2minute = businessSlot.value.time_business_end1minute
  }else{
    blankField([
              'ticket_limit_upper2',
              'time_business_start2hour',
              'time_business_start2minute',
              'time_business_end2hour',
              'time_business_end2minute',
              'time_checkin_start2hour',
              'time_checkin_start2minute',
              'time_checkin_end2hour',
              'time_checkin_end2minute',
              'time_ticket_issue_start2hour',
              'time_ticket_issue_start2minute',
              'time_ticket_issue_end2hour',
              'time_ticket_issue_end2minute',
              'ticket_limit_upper3',
              'time_business_start3hour',
              'time_business_start3minute',
              'time_business_end3hour',
              'time_business_end3minute',
              'time_checkin_start3hour',
              'time_checkin_start3minute',
              'time_checkin_end3hour',
              'time_checkin_end3minute',
              'time_ticket_issue_start3hour',
              'time_ticket_issue_start3minute',
              'time_ticket_issue_end3hour',
              'time_ticket_issue_end3minute'
            ])
  }
}

const handleCheckbox2 = (value: any) => {
  if(value === true) {
    businessSlot.value.time_business_start3hour = businessSlot.value.time_business_end2hour
    businessSlot.value.time_business_start3minute = businessSlot.value.time_business_end2minute
  }else{
  blankField([
                'ticket_limit_upper3',
                'time_business_start3hour',
                'time_business_start3minute',
                'time_business_end3hour',
                'time_business_end3minute',
                'time_checkin_start3hour',
                'time_checkin_start3minute',
                'time_checkin_end3hour',
                'time_checkin_end3minute',
                'time_ticket_issue_start3hour',
                'time_ticket_issue_start3minute',
                'time_ticket_issue_end3hour',
                'time_ticket_issue_end3minute'
              ])
  }
}

const handleSlot1Row1 = (field: any) => {
  if(businessSlot.value[field] === null)slot2Active.value = false

  if(slot2Active.value && field == 'time_business_end1hour' && businessSlot.value[field] > businessSlot.value.time_business_start2hour ){
    businessSlot.value[field] = null
    slot2Active.value = false
    businessSlot.value.flg_add_slot2_UI = false
  }

  if(field == 'time_business_end1hour' && businessSlot.value[field] < businessSlot.value.time_business_start1hour ){
    businessSlot.value[field] = null
    slot2Active.value = false
  }
  if(  field == 'time_business_start1hour' && businessSlot.value.time_business_end1hour && businessSlot.value[field] > businessSlot.value.time_business_end1hour){
    businessSlot.value[field] = null
    slot2Active.value = false
  }
  if( businessSlot.value.time_business_end1minute && (businessSlot.value.time_business_start1hour == businessSlot.value.time_business_end1hour) && businessSlot.value.time_business_start1minute >= businessSlot.value.time_business_end1minute ){
    businessSlot.value.time_business_start1minute = null
    businessSlot.value.time_business_end1minute = null
    slot2Active.value = false
  }
  if( businessSlot.value.time_business_start1hour && businessSlot.value.time_business_start1minute && businessSlot.value.time_business_end1hour && businessSlot.value.time_business_end1minute ){
    businessSlot.value.time_checkin_start1hour = businessSlot.value.time_business_start1hour
    businessSlot.value.time_checkin_start1minute = businessSlot.value.time_business_start1minute
    businessSlot.value.time_checkin_end1hour = businessSlot.value.time_business_end1hour
    businessSlot.value.time_checkin_end1minute = businessSlot.value.time_business_end1minute
    businessSlot.value.time_ticket_issue_start1hour = businessSlot.value.time_business_start1hour
    businessSlot.value.time_ticket_issue_start1minute = businessSlot.value.time_business_start1minute
    businessSlot.value.time_ticket_issue_end1hour = businessSlot.value.time_business_end1hour
    businessSlot.value.time_ticket_issue_end1minute = businessSlot.value.time_business_end1minute

    slot2Active.value = true
    init()
  }
}

const handleSlot1Row2 = (field: any) => {
  if(businessSlot.value[field] === null)slot2Active.value = false
  if(field == 'time_checkin_end1hour' && businessSlot.value[field] < businessSlot.value.time_checkin_start1hour ){
    businessSlot.value[field] = null
    slot2Active.value = false
  }
  if(  field == 'time_checkin_start1hour' && businessSlot.value.time_checkin_end1hour && businessSlot.value[field] > businessSlot.value.time_checkin_end1hour){
    businessSlot.value[field] = null
    slot2Active.value = false
  }
  if( businessSlot.value.time_checkin_end1minute && (businessSlot.value.time_checkin_start1hour == businessSlot.value.time_checkin_end1hour) && businessSlot.value.time_checkin_start1minute >= businessSlot.value.time_checkin_end1minute ){
    businessSlot.value.time_checkin_start1minute = null
    businessSlot.value.time_checkin_end1minute = null
    slot2Active.value = false
  }
  if( businessSlot.value.time_checkin_start1hour && businessSlot.value.time_checkin_start1minute && businessSlot.value.time_checkin_end1hour && businessSlot.value.time_checkin_end1minute ){
    slot2Active.value = true
    init()
  }
}

const handleSlot1Row3 = (field: any) => {
  if(businessSlot.value[field] === null)slot2Active.value = false
  if(field == 'time_ticket_issue_end1hour' && businessSlot.value[field] < businessSlot.value.time_ticket_issue_start1hour ){
    businessSlot.value[field] = null
    slot2Active.value = false
  }
  if(  field == 'time_ticket_issue_start1hour' && businessSlot.value.time_ticket_issue_end1hour && businessSlot.value[field] > businessSlot.value.time_ticket_issue_end1hour){
    businessSlot.value[field] = null
    slot2Active.value = false
  }
  if( businessSlot.value.time_ticket_issue_end1minute && (businessSlot.value.time_ticket_issue_start1hour == businessSlot.value.time_ticket_issue_end1hour) && businessSlot.value.time_ticket_issue_start1minute >= businessSlot.value.time_ticket_issue_end1minute ){
    businessSlot.value.time_ticket_issue_start1minute = null
    businessSlot.value.time_ticket_issue_end1minute = null
    slot2Active.value = false
  }
  if( businessSlot.value.time_ticket_issue_start1hour && businessSlot.value.time_ticket_issue_start1minute && businessSlot.value.time_ticket_issue_end1hour && businessSlot.value.time_ticket_issue_end1minute ){
    slot2Active.value = true
    init()
  }
}

const handleSlot2Row1 = (field: any) => {
  if(businessSlot.value[field] === null)slot3Active.value = false

  if(slot3Active.value && field == 'time_business_end2hour' && businessSlot.value[field] > businessSlot.value.time_business_start3hour ){
    businessSlot.value[field] = null
    slot3Active.value = false
    businessSlot.value.flg_add_slot3_UI = false
  }

  if(field == 'time_business_start2hour' && businessSlot.value[field] < businessSlot.value.time_business_end1hour ){
    businessSlot.value[field] = null 
    slot3Active.value = false
  }

  if(field == 'time_business_end2hour' && businessSlot.value[field] < businessSlot.value.time_business_start2hour ){
    businessSlot.value[field] = null
    slot3Active.value = false
  }
  if(  field == 'time_business_start2hour' && businessSlot.value.time_business_end2hour && businessSlot.value[field] > businessSlot.value.time_business_end2hour){
    businessSlot.value[field] = null
    slot3Active.value = false
  }
  if( businessSlot.value.time_business_end2minute && (businessSlot.value.time_business_start2hour == businessSlot.value.time_business_end2hour) && businessSlot.value.time_business_start2minute >= businessSlot.value.time_business_end2minute ){
    businessSlot.value.time_business_start2minute = null
    businessSlot.value.time_business_end2minute = null
    slot3Active.value = false
  }
  if( businessSlot.value.time_business_start2hour && businessSlot.value.time_business_start2minute && businessSlot.value.time_business_end2hour && businessSlot.value.time_business_end2minute ){
    businessSlot.value.time_checkin_start2hour = businessSlot.value.time_business_start2hour
    businessSlot.value.time_checkin_start2minute = businessSlot.value.time_business_start2minute
    businessSlot.value.time_checkin_end2hour = businessSlot.value.time_business_end2hour
    businessSlot.value.time_checkin_end2minute = businessSlot.value.time_business_end2minute
    businessSlot.value.time_ticket_issue_start2hour = businessSlot.value.time_business_start2hour
    businessSlot.value.time_ticket_issue_start2minute = businessSlot.value.time_business_start2minute
    businessSlot.value.time_ticket_issue_end2hour = businessSlot.value.time_business_end2hour
    businessSlot.value.time_ticket_issue_end2minute = businessSlot.value.time_business_end2minute

    slot3Active.value = true
    businessSlot.value.flg_add_slot3_UI = false
    init()
  }
}

const handleSlot2Row2 = (field: any) => {
  if(businessSlot.value[field] === null)slot3Active.value = false
  if(field == 'time_checkin_end2hour' && businessSlot.value[field] < businessSlot.value.time_checkin_start2hour ){
    businessSlot.value[field] = null
    slot3Active.value = false
  }
  if(  field == 'time_checkin_start2hour' && businessSlot.value.time_checkin_end2hour && businessSlot.value[field] > businessSlot.value.time_checkin_end2hour){
    businessSlot.value[field] = null
    slot3Active.value = false
  }
  if( businessSlot.value.time_checkin_end2minute && (businessSlot.value.time_checkin_start2hour == businessSlot.value.time_checkin_end2hour) && businessSlot.value.time_checkin_start2minute >= businessSlot.value.time_checkin_end2minute ){
    businessSlot.value.time_checkin_start2minute = null
    businessSlot.value.time_checkin_end2minute = null
    slot3Active.value = false
  }
  if( businessSlot.value.time_checkin_start2hour && businessSlot.value.time_checkin_start2minute && businessSlot.value.time_checkin_end2hour && businessSlot.value.time_checkin_end2minute ){
    slot3Active.value = true
    businessSlot.value.flg_add_slot3_UI = false
    init()
  }
}

const handleSlot2Row3 = (field: any) => {
  if(businessSlot.value[field] === null)slot3Active.value = false
  if(field == 'time_ticket_issue_end2hour' && businessSlot.value[field] < businessSlot.value.time_ticket_issue_start2hour ){
    businessSlot.value[field] = null
    slot3Active.value = false
  }
  if(  field == 'time_ticket_issue_start2hour' && businessSlot.value.time_ticket_issue_end2hour && businessSlot.value[field] > businessSlot.value.time_ticket_issue_end2hour){
    businessSlot.value[field] = null
    slot3Active.value = false
  }
  if( businessSlot.value.time_ticket_issue_end2minute && (businessSlot.value.time_ticket_issue_start2hour == businessSlot.value.time_ticket_issue_end2hour) && businessSlot.value.time_ticket_issue_start2minute >= businessSlot.value.time_ticket_issue_end2minute ){
    businessSlot.value.time_ticket_issue_start2minute = null
    businessSlot.value.time_ticket_issue_end2minute = null
    slot3Active.value = false
  }
  if( businessSlot.value.time_ticket_issue_start2hour && businessSlot.value.time_ticket_issue_start2minute && businessSlot.value.time_ticket_issue_end2hour && businessSlot.value.time_ticket_issue_end2minute ){
    slot3Active.value = true
    businessSlot.value.flg_add_slot3_UI = false
    init()
  }
}

const handleSlot3Row1 = (field: any) => {
  
  if(field == 'time_business_start3hour' && businessSlot.value[field] < businessSlot.value.time_business_end2hour ){
    businessSlot.value[field] = null 
  }

  if(field == 'time_business_end3hour' && businessSlot.value[field] < businessSlot.value.time_business_start3hour ){
    businessSlot.value[field] = null
  }
  if(  field == 'time_business_start3hour' && businessSlot.value.time_business_end3hour && businessSlot.value[field] > businessSlot.value.time_business_end3hour){
    businessSlot.value[field] = null
  }
  if( businessSlot.value.time_business_end3minute && (businessSlot.value.time_business_start3hour == businessSlot.value.time_business_end3hour) && businessSlot.value.time_business_start3minute >= businessSlot.value.time_business_end3minute ){
    businessSlot.value.time_business_start3minute = null
    businessSlot.value.time_business_end3minute = null
  }
  if( businessSlot.value.time_business_start3hour && businessSlot.value.time_business_start3minute && businessSlot.value.time_business_end3hour && businessSlot.value.time_business_end3minute ){
    businessSlot.value.time_checkin_start3hour = businessSlot.value.time_business_start3hour
    businessSlot.value.time_checkin_start3minute = businessSlot.value.time_business_start3minute
    businessSlot.value.time_checkin_end3hour = businessSlot.value.time_business_end3hour
    businessSlot.value.time_checkin_end3minute = businessSlot.value.time_business_end3minute
    businessSlot.value.time_ticket_issue_start3hour = businessSlot.value.time_business_start3hour
    businessSlot.value.time_ticket_issue_start3minute = businessSlot.value.time_business_start3minute
    businessSlot.value.time_ticket_issue_end3hour = businessSlot.value.time_business_end3hour
    businessSlot.value.time_ticket_issue_end3minute = businessSlot.value.time_business_end3minute
  }
}

const handleSlot3Row2 = (field: any) => {

  if(field == 'time_checkin_end3hour' && businessSlot.value[field] < businessSlot.value.time_checkin_start3hour ){
    businessSlot.value[field] = null
  }
  if(  field == 'time_checkin_start3hour' && businessSlot.value.time_checkin_end3hour && businessSlot.value[field] > businessSlot.value.time_checkin_end3hour){
    businessSlot.value[field] = null
  }
  if( businessSlot.value.time_checkin_end3minute && (businessSlot.value.time_checkin_start3hour == businessSlot.value.time_checkin_end3hour) && businessSlot.value.time_checkin_start3minute >= businessSlot.value.time_checkin_end3minute ){
    businessSlot.value.time_checkin_start3minute = null
    businessSlot.value.time_checkin_end3minute = null
  }
}

const handleSlot3Row3 = (field: any) => {
  if(field == 'time_ticket_issue_end3hour' && businessSlot.value[field] < businessSlot.value.time_ticket_issue_start3hour ){
    businessSlot.value[field] = null
  }
  if(  field == 'time_ticket_issue_start3hour' && businessSlot.value.time_ticket_issue_end3hour && businessSlot.value[field] > businessSlot.value.time_ticket_issue_end3hour){
    businessSlot.value[field] = null
  }
  if( businessSlot.value.time_ticket_issue_end3minute && (businessSlot.value.time_ticket_issue_start3hour == businessSlot.value.time_ticket_issue_end3hour) && businessSlot.value.time_ticket_issue_start3minute >= businessSlot.value.time_ticket_issue_end3minute ){
    businessSlot.value.time_ticket_issue_start3minute = null
    businessSlot.value.time_ticket_issue_end3minute = null
  }
}

function assignPageData(info: any) {
  if (info) {
    for (let key in info) {
      businessSlot.value[key] = info[key]
    }
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            businessHourSlot
              .destroyBusinessHourSlot(businessSlot.value.id_business_hour_slot)
              .then(() => {
                businessHourSlot.fetchBusinessHourSlots()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const closeModal = () => {
  emits('close')
}

onMounted(() => {
  if (props.data?.id_business_hour_slot) {
    // Update case
    assignPageData(props.data)
    isEdit.value = true

    if(props.data.type_business_day != 90){
    businessSlot.value.time_business_start1hour =
      props.data.time_business_start1.split(':')[0]
    businessSlot.value.time_business_start1minute =
      props.data.time_business_start1.split(':')[1]
    businessSlot.value.time_business_end1hour =
      props.data.time_business_end1.split(':')[0]
    businessSlot.value.time_business_end1minute =
      props.data.time_business_end1.split(':')[1]
    businessSlot.value.time_checkin_start1hour =
      props.data.time_checkin_start1.split(':')[0]
    businessSlot.value.time_checkin_start1minute =
      props.data.time_checkin_start1.split(':')[1]
    businessSlot.value.time_checkin_end1hour =
      props.data.time_checkin_end1.split(':')[0]
    businessSlot.value.time_checkin_end1minute =
      props.data.time_checkin_end1.split(':')[1]
    businessSlot.value.time_ticket_issue_start1hour =
      props.data.time_ticket_issue_start1.split(':')[0]
    businessSlot.value.time_ticket_issue_start1minute =
      props.data.time_ticket_issue_start1.split(':')[1]
    businessSlot.value.time_ticket_issue_end1hour =
      props.data.time_ticket_issue_end1.split(':')[0]
    businessSlot.value.time_ticket_issue_end1minute =
      props.data.time_ticket_issue_end1.split(':')[1]

    if (props.data.time_business_start1 !== null && props.data.time_business_start2 === null) {
      slot2Active.value = true
      businessSlot.value.flg_add_slot2_UI = false
    }
    if (props.data.time_business_start1 !== null && props.data.time_business_start2 !== null && props.data.time_business_start3 === null) {
      slot2Active.value = true
      slot3Active.value = true
      businessSlot.value.flg_add_slot2_UI = true
      businessSlot.value.flg_add_slot3_UI = false
    }
    if (props.data.time_business_start1 !== null && props.data.time_business_start2 !== null && props.data.time_business_start3 !== null) {
      slot2Active.value = true
      slot3Active.value = true
      businessSlot.value.flg_add_slot2_UI = true
      businessSlot.value.flg_add_slot3_UI = true
    }        
    if (props.data.time_business_start2 !== null) {
      businessSlot.value.flg_add_slot2_UI = true
      businessSlot.value.time_business_start2hour =
        props.data.time_business_start2.split(':')[0]
      businessSlot.value.time_business_start2minute =
        props.data.time_business_start2.split(':')[1]
      businessSlot.value.time_business_end2hour =
        props.data.time_business_end2.split(':')[0]
      businessSlot.value.time_business_end2minute =
        props.data.time_business_end2.split(':')[1]
      businessSlot.value.time_checkin_start2hour =
        props.data.time_checkin_start2.split(':')[0]
      businessSlot.value.time_checkin_start2minute =
        props.data.time_checkin_start2.split(':')[1]
      businessSlot.value.time_checkin_end2hour =
        props.data.time_checkin_end2.split(':')[0]
      businessSlot.value.time_checkin_end2minute =
        props.data.time_checkin_end2.split(':')[1]
      businessSlot.value.time_ticket_issue_start2hour =
        props.data.time_ticket_issue_start2.split(':')[0]
      businessSlot.value.time_ticket_issue_start2minute =
        props.data.time_ticket_issue_start2.split(':')[1]
      businessSlot.value.time_ticket_issue_end2hour =
        props.data.time_ticket_issue_end2.split(':')[0]
      businessSlot.value.time_ticket_issue_end2minute =
        props.data.time_ticket_issue_end2.split(':')[1]
    }
    if (props.data.time_business_start3 !== null) {
      businessSlot.value.flg_add_slot3_UI = true
      businessSlot.value.time_business_start3hour =
        props.data.time_business_start3.split(':')[0]
      businessSlot.value.time_business_start3minute =
        props.data.time_business_start3.split(':')[1]
      businessSlot.value.time_business_end3hour =
        props.data.time_business_end3.split(':')[0]
      businessSlot.value.time_business_end3minute =
        props.data.time_business_end3.split(':')[1]
      businessSlot.value.time_checkin_start3hour =
        props.data.time_checkin_start3.split(':')[0]
      businessSlot.value.time_checkin_start3minute =
        props.data.time_checkin_start3.split(':')[1]
      businessSlot.value.time_checkin_end3hour =
        props.data.time_checkin_end3.split(':')[0]
      businessSlot.value.time_checkin_end3minute =
        props.data.time_checkin_end3.split(':')[1]
      businessSlot.value.time_ticket_issue_start3hour =
        props.data.time_ticket_issue_start3.split(':')[0]
      businessSlot.value.time_ticket_issue_start3minute =
        props.data.time_ticket_issue_start3.split(':')[1]
      businessSlot.value.time_ticket_issue_end3hour =
        props.data.time_ticket_issue_end3.split(':')[0]
      businessSlot.value.time_ticket_issue_end3minute =
        props.data.time_ticket_issue_end3.split(':')[1]
    }
  }else{
    hideSlots.value = true
  }
  init()
  } else {
    // Create case
    isEdit.value = false
    //businessSlot.value = businessSlot.value
    businessSlot.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        診療時間枠
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-3">
          <MtFormPullDown
            label="診療日区分 *"
            v-model:selected="businessSlot.type_business_day"
            :options="typeBusinessDay"
            required
            :rules="[aahValidations.validationRequired]"
            @update:modelValue="handleTypeBusinessDay"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            label="病院名"
            v-model:selected="businessSlot.id_clinic"
            :options="getAllClinics"
            @update:modelValue="handleClinic"
            :disable="isEdit"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-3">
          <MtInputForm
            type="text"
            v-model="businessSlot.name_business_hour"
            label="時間枠表示名 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <template v-if="!hideSlots">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputNumber
                type="number"
                v-model:value="businessSlot.ticket_limit_upper1"
                label="整理券 発行上限数1"
              />
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-sm">
            <div class="col-2">
              <MtFormPullDown
                label="診療開始時刻 1"
                v-model:selected="businessSlot.time_business_start1hour"
                :options="timeHour"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row1('time_business_start1hour')"
              />
            </div>
            <span>時</span>
            <div class="col-2">
              <MtFormPullDown
                label="診療開始時刻 1"
                v-model:selected="businessSlot.time_business_start1minute"
                :options="timeMinute"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row1('time_business_start1minute')"
              />
            </div>
            <span>分</span>
            <span class="q-mx-md">～</span>
            <div class="col-2">
              <MtFormPullDown
                label="診療終了時刻 1"
                v-model:selected="businessSlot.time_business_end1hour"
                :options="timeHour"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row1('time_business_end1hour')"
              />
            </div>
            <span>時</span>
            <div class="col-2">
              <MtFormPullDown
                label="診療終了時刻 1"
                v-model:selected="businessSlot.time_business_end1minute"
                :options="timeMinute"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row1('time_business_end1minute')"
              />
            </div>
            <span>分</span>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-sm">
            <div class="col-2">
              <MtFormPullDown
                label="受付開始時刻 1"
                v-model:selected="businessSlot.time_checkin_start1hour"
                :options="timeHour"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row2('time_checkin_start1hour')"
              />
            </div>
            <span>時</span>
            <div class="col-2">
              <MtFormPullDown
                label="受付開始時刻 1"
                v-model:selected="businessSlot.time_checkin_start1minute"
                :options="timeMinute"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row2('time_checkin_start1minute')"
              />
            </div>
            <span>分</span>
            <span class="q-mx-md">～</span>
            <div class="col-2">
              <MtFormPullDown
                label="受付終了時刻 1"
                v-model:selected="businessSlot.time_checkin_end1hour"
                :options="timeHour"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row2('time_checkin_end1hour')"
              />
            </div>
            <span>時</span>
            <div class="col-2">
              <MtFormPullDown
                label="受付終了時刻 1"
                v-model:selected="businessSlot.time_checkin_end1minute"
                :options="timeMinute"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row2('time_checkin_end1minute')"
              />
            </div>
            <span>分</span>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-2">
              <MtFormPullDown
                label="整理券発行開始時刻 1"
                v-model:selected="businessSlot.time_ticket_issue_start1hour"
                :options="timeHour"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row3('time_ticket_issue_start1hour')"
              />
            </div>
            <span>時</span>
            <div class="col-2">
              <MtFormPullDown
                label="整理券発行開始時刻 1"
                v-model:selected="businessSlot.time_ticket_issue_start1minute"
                :options="timeMinute"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row3('time_ticket_issue_start1minute')"
              />
            </div>
            <span>分</span>
            <span class="q-mx-md">～</span>
            <div class="col-2">
              <MtFormPullDown
                label="整理券 発行終了時刻 1"
                v-model:selected="businessSlot.time_ticket_issue_end1hour"
                :options="timeHour"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row3('time_ticket_issue_end1hour')"
              />
            </div>
            <span>時</span>
            <div class="col-2">
              <MtFormPullDown
                label="整理券 発行終了時刻 1"
                v-model:selected="businessSlot.time_ticket_issue_end1minute"
                :options="timeMinute"
                :rules="[aahValidations.validationSelection]"
                @update:modelValue="handleSlot1Row3('time_ticket_issue_end1minute')"
              />
            </div>
            <span>分</span>
          </div>
      
      <div class="row items-center q-col-gutter-md q-mb-sm" v-show="slot2Active">
        <div class="col-3 q-my-lg">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '診療時間枠 2 の追加' }]"
            v-model="businessSlot.flg_add_slot2_UI"
            @update:modelValue="handleCheckbox1"
          />
        </div>
      </div>
     
      <div v-if="businessSlot.flg_add_slot2_UI">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
            <MtFormInputNumber
              type="number"
              v-model:value="businessSlot.ticket_limit_upper2"
              label="整理券 発行上限数2"
            />
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormPullDown
              label="診療開始時刻 2"
              v-model:selected="businessSlot.time_business_start2hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row1('time_business_start2hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="診療開始時刻 2"
              v-model:selected="businessSlot.time_business_start2minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row1('time_business_start2minute')"
            />
          </div>
          <span>分</span>
          <span class="q-mx-md">～</span>
          <div class="col-2">
            <MtFormPullDown
              label="診療終了時刻 2"
              v-model:selected="businessSlot.time_business_end2hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row1('time_business_end2hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="診療終了時刻 2"
              v-model:selected="businessSlot.time_business_end2minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row1('time_business_end2minute')"
            />
          </div>
          <span>分</span>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormPullDown
              label="受付開始時刻 2"
              v-model:selected="businessSlot.time_checkin_start2hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row2('time_checkin_start2hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="受付開始時刻 2"
              v-model:selected="businessSlot.time_checkin_start2minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row2('time_checkin_start2minute')"
            />
          </div>
          <span>分</span>
          <span class="q-mx-md">～</span>
          <div class="col-2">
            <MtFormPullDown
              label="受付終了時刻 2"
              v-model:selected="businessSlot.time_checkin_end2hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row2('time_checkin_end2hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="受付終了時刻 2"
              v-model:selected="businessSlot.time_checkin_end2minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row2('time_checkin_end2minute')"
            />
          </div>
          <span>分</span>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-2">
            <MtFormPullDown
              label="整理券発行開始時刻 2"
              v-model:selected="businessSlot.time_ticket_issue_start2hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row3('time_ticket_issue_start2hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="整理券発行開始時刻 2"
              v-model:selected="businessSlot.time_ticket_issue_start2minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row3('time_ticket_issue_start2minute')"
            />
          </div>
          <span>分</span>
          <span class="q-mx-md">～</span>
          <div class="col-2">
            <MtFormPullDown
              label="整理券 発行終了時刻 2"
              v-model:selected="businessSlot.time_ticket_issue_end2hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row3('time_ticket_issue_end2hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="整理券 発行終了時刻 2"
              v-model:selected="businessSlot.time_ticket_issue_end2minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot2Row3('time_ticket_issue_end2minute')"
            />
          </div>
          <span>分</span>
        </div>
      </div>
      <div class="row items-center q-col-gutter-md q-mb-sm" v-show="slot3Active && businessSlot.flg_add_slot2_UI">
        <div class="col-3 q-my-lg">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '診療時間枠 3 の追加' }]"
            v-model="businessSlot.flg_add_slot3_UI"
            @update:modelValue="handleCheckbox2"
          />
        </div>
      </div>
      <div v-if="businessSlot.flg_add_slot2_UI && businessSlot.flg_add_slot3_UI" class="q-mb-lg">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-3">
            <MtFormInputNumber
              type="number"
              v-model:value="businessSlot.ticket_limit_upper3"
              label="整理券 発行上限数3"
            />
          </div>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormPullDown
              label="診療開始時刻 3"
              v-model:selected="businessSlot.time_business_start3hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row1('time_business_start3hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="診療開始時刻 3"
              v-model:selected="businessSlot.time_business_start3minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row1('time_business_start3minute')"
            />
          </div>
          <span>分</span>
          <span class="q-mx-md">～</span>
          <div class="col-2">
            <MtFormPullDown
              label="診療終了時刻 3"
              v-model:selected="businessSlot.time_business_end3hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row1('time_business_end3hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="診療終了時刻 3"
              v-model:selected="businessSlot.time_business_end3minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row1('time_business_end3minute')"
            />
          </div>
          <span>分</span>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormPullDown
              label="受付開始時刻 3"
              v-model:selected="businessSlot.time_checkin_start3hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row2('time_checkin_start3hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="受付開始時刻 3"
              v-model:selected="businessSlot.time_checkin_start3minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row2('time_checkin_start3minute')"
            />
          </div>
          <span>分</span>
          <span class="q-mx-md">～</span>
          <div class="col-2">
            <MtFormPullDown
              label="受付終了時刻 3"
              v-model:selected="businessSlot.time_checkin_end3hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row2('time_checkin_end3hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="受付終了時刻 3"
              v-model:selected="businessSlot.time_checkin_end3minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row2('time_checkin_end3minute')"
            />
          </div>
          <span>分</span>
        </div>
        <div class="row items-center q-col-gutter-md q-mb-sm">
          <div class="col-2">
            <MtFormPullDown
              label="整理券発行開始時刻 3"
              v-model:selected="businessSlot.time_ticket_issue_start3hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row3('time_ticket_issue_start3hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="整理券発行開始時刻 3"
              v-model:selected="businessSlot.time_ticket_issue_start3minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row3('time_ticket_issue_start3minute')"
            />
          </div>
          <span>分</span>
          <span class="q-mx-md">～</span>
          <div class="col-2">
            <MtFormPullDown
              label="整理券 発行終了時刻 3"
              v-model:selected="businessSlot.time_ticket_issue_end3hour"
              :options="timeHour"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row3('time_ticket_issue_end3hour')"
            />
          </div>
          <span>時</span>
          <div class="col-2">
            <MtFormPullDown
              label="整理券 発行終了時刻 3"
              v-model:selected="businessSlot.time_ticket_issue_end3minute"
              :options="timeMinute"
              :rules="[aahValidations.validationSelection]"
              @update:modelValue="handleSlot3Row3('time_ticket_issue_end3minute')"
            />
          </div>
          <span>分</span>
        </div>
      </div>
    </template>
      <hr class="light" />
      <div class="row q-col-gutter-xs q-mt-lg">
        <div class="col-2">
          <MtInputForm
            type="text"
            v-model="businessSlot.display_order"
            label="表示順序（0~999; 小を上位表示）"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
