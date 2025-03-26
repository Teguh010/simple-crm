<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import useQueueTicketStore from '@/stores/queue_ticket'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import {
  concatenate,
  copyText,
  formatDate,
  getCustomerNameHonorific,
  getDateTimeNow,
  getDateToday
} from '@/utils/aahUtils'
import OptionModal from '@/components/OptionModal.vue'
import useActionStore from '@/stores/action'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import ViewPetDetailModal from '../master/customerPet/ViewPetDetailModal.vue'
import useEmployeeStore from '@/stores/employees'
import useCliCommonStore from '@/stores/cli-common'
import { statusQueueTicket, timeHourMinute, typePetGender, typeProcessTime, typeTel } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { CustomerType, InsurancePlanType, PetType, ServiceDetailType } from '@/types/types'
import useInsurancePlanStore from '@/stores/insurance_plans'
import { ITEM_SERVICE_CODE_CATEGORY_VACCINATION } from '@/utils/const/constServiceDetail'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useRequestStore from '@/stores/requests'
import dayjs from 'dayjs'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import customerUtils from '@/pages/master/customerPet/customerUtils'
import useClinicStore from '@/stores/clinics'
import useCommonStore from '@/stores/common'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'

const actionStore = useActionStore()
const router = useRouter()

const submitBtn = ref()
const selected_pets = ref([])
const id_pet = ref('')
const inputDoctor = ref()
const ticketData = ref({
  id_customer: 0,
  code_customer: null,
  type_visit_purpose_ticket: [],
  id_employee_doctor: '',
  memo_customer: '',
  memo_admin: '',
  flg_apply_insurance: false,
  flg_appointment: false,
  flg_new_customer: false,
  flg_visit_for_pet: false,
  flg_tel_requested: false,
  flg_web_payment_requested: false,
  flg_parking_wait: false,
  id_pet: [],
  datetime_issued: getDateTimeNow(),
  type_status_queue_ticket: 1, // cli_common data where code_cli_common = 4 ; it may vary from clinic to clinic
  type_process_time: 5,
  pet_name_ui: [],
  type_visit_purpose_ticket_ui: null,
  request: [],
  datetime_estimate: null,
  process_order: 1,
  queue_detail: {}
})

const isEdit = ref(false)

const isPet = ref(false)
const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])
const selectedCustomer = ref<CustomerType>()
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const type_visit_purpose_ticket_list = ref([])

const customerStore = useCustomerStore()
const queueTicketStore = useQueueTicketStore()
const cliCommonStore = useCliCommonStore()

const insurancePlanStore = useInsurancePlanStore()
const { getInsurancePlans } = storeToRefs(insurancePlanStore)
const { getCliCommonQTVisitPurposeList } = storeToRefs(cliCommonStore)
const { getCustomerOption } = storeToRefs(customerStore)

const cliCommonQTVisitPurposeListById = computed(() => {
  return getCliCommonQTVisitPurposeList.value.map(
    (item) => ({ ...item, value: item.id_cli_common })
  )
})

const requestOptionList = ref([])
const quickCustomer = ref(false)

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })
const closeModal = () => {
  emits('close')
  setPageTitle('受付・整理券')
}
function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      ticketData.value[key] = data[key]
    }
  }
  if (data.datetime_estimate) {
    ticketData.value.datetime_estimate = dayjs(data.datetime_estimate).format("HH:mm")
  }
}

const openPreventativeModal = async (item) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: ticketData.value.id_customer,
    id_pet: item.value,
    additional: { menu: 'preventative' }
  })
}
const onClickChip = async (item: any) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: ticketData.value.id_customer,
    id_pet: item.value
  })
}

const selectedPet = computed(() => {
  if (
    ticketData.value &&
    ticketData.value.id_pet &&
    ticketData.value.id_pet.length > 0
  ) {
    return ticketData.value?.id_pet.map((data) => {
      return petList.value.find((item) => item.value === data)
    })
  } else return {}
})


const createQuickCustomer = async () => {
  // console.log(data.value)
  data.value.type_visit_purpose_ticket = type_visit_purpose_ticket_list.value.join(',')

  await customerUtils.getNextCustomerCode(data.value, { value: null })

  if (data.value.code_customer === null) {
    delete data.value.code_customer
  }
  data.value.id_employee_request = defaultEmployee
  let response = await mtUtils.promiseAllWithLoader([customerStore.submitQuickCustomerWithQT(data.value)])
  await fetchCustomersWithPets()
  return
}

const fetchCustomersWithPets = async (event = null, page: number = 1) => {
  if (event) {
    await customerStore.fetchCustomersWithPets({ search: event, page })
  }
  else {
    await customerStore.fetchCustomersWithPets({ page })
  }  
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListWithPetsOptions]
  customerListDefault.push(...customerStore.getCustomerListWithPetsOptions)
}

const submit = async () => {

  if (quickCustomer.value) {
    await createQuickCustomer()
    closeModal()
    return
  }
  
  if (ticketData.value.type_process_time == '') {
    delete ticketData.value.type_process_time
  }

  ticketData.value.type_visit_purpose_ticket = type_visit_purpose_ticket_list.value

  const title_request = handleAutoRequestTitle(customerStore.getCustomerOption, ticketData.value?.id_employee_doctor)

  
  if (ticketData.value.id_queue_ticket) {
    const payload = {
      ...ticketData.value,
      title_request
    }


    if (ticketData.value.id_request) {
      await useRequestStore().updateRequest(ticketData.value.id_request, {
        id_queue_ticket: payload.id_queue_ticket
      })
    }
    
    await queueTicketStore.updateQueueTicketList(
      ticketData.value.id_queue_ticket,
      payload
    )
    closeModal()
    await mtUtils.autoCloseAlert(aahMessages.success)
  } else {
    await queueTicketStore.submitQueueTicketList({
      ...ticketData.value,
      title_request
    })
    closeModal()
    await mtUtils.autoCloseAlert(aahMessages.success)
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
      const confirmation = await mtUtils.confirm(
        aahMessages.delete_ask,
        aahMessages.delete
      )
      if (confirmation) {
        await queueTicketStore.destroyQueueTicketList(
          ticketData.value.id_queue_ticket
        )
        await mtUtils.autoCloseAlert(aahMessages.success)
      }
      closeModal()
    }
  }
}

function selectingPet(newPetIds) {
  // 1) Remove any existing keys that are NOT in newPetIds
  if (newPetIds) {
    const newPetIdsAsString = newPetIds.map(String)

    Object.keys(ticketData.value.queue_detail).forEach(key => {
      // Convert key to a number if needed (assuming your keys are numeric IDs)
      if (!newPetIdsAsString.includes(key)) {
        delete ticketData.value.queue_detail[key]
      }
    })

    // 2) Add new keys for IDs that are in newPetIds but not currently in queue_ticket
    newPetIdsAsString.forEach(id => {
      if (!(id in ticketData.value.queue_detail)) {
        // Create whatever default object structure you need:
        ticketData.value.queue_detail[id] = {
          id_pet: id,
          type_purpose_list: [],
          type_doctor_list: []
        }
      }
    })
  }

  ticketData.value.pet_name_ui.length = 0
  if (
    ticketData.value &&
    ticketData.value.id_pet &&
    ticketData.value.id_pet.length > 0
  ) {
    ticketData.value.id_pet?.map((id_pet) => {
      const temp = petListDefault.find((pet) => pet.value == id_pet)
      if (temp && temp.label) {
        ticketData.value.pet_name_ui.push({ name_pet: temp?.label, id_pet: temp.value })
      }
    })
  }
}

const getStatusQueueTicket = (type_status_queue_ticket) =>
  statusQueueTicket.find((v) => v.value === type_status_queue_ticket)?.label

const filterQueueTicket = async () => {

  await customerStore.selectCustomer(ticketData.value.id_customer)

  const customerName = getCustomerNameHonorific(customerStore.getCustomer)
  const newStatus = getStatusQueueTicket(
    ticketData.value.type_status_queue_ticket
  )

  // Open the confirmation modal with the ticket data
  await openConfirmationModal(customerName, newStatus, ticketData.value)
}
const modalData = ref({ customerName: '', newStatus: '' })

const openConfirmationModal = async (customerName, newStatus, ticketData) => {
  modalData.value = { customerName, newStatus }
  // Open the modal and pass ticketData as a prop
  const title_request = handleAutoRequestTitle(customerStore.getCustomerOption, ticketData.value.id_employee_doctor)
  let confirmMsg =
    customerName + 'の受付ステータスを' + newStatus + 'に変更しますか？'
  await mtUtils
    .confirm(confirmMsg, '確認', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        queueTicketStore.updateQueueTicketList(ticketData.id_queue_ticket, {
          ...ticketData,
          title_request: title_request
        })
      }
    })
}


const handleAutoRequestTitle = (customer: any, id_employee_doctor: any) => {
  // let autoTitle = ''
  console.log(customer, id_employee_doctor)
  const selectedEmployeeDoctor = useEmployeeStore().getAllEmployees.find((v: any) => v.value === id_employee_doctor)?.label
  const name_customer = concatenate(
    customer?.name_family,
    customer?.name_first
  )
  const fixedTextCustomer = name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeDoctor ? '/ 担当: ' : ''
  return (
    getDateToday() +
    ' ' +
    customer?.code_customer +
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

function selectedTypeVisitPurposeTicket(value) {
  ticketData.value.type_visit_purpose_ticket_ui = ''
  if (value) {
    const temp = cliCommonQTVisitPurposeListById.value.find(
      (obj) => obj.value == value
    )
    if (temp) {
      ticketData.value.type_visit_purpose_ticket_ui = temp.label
    }
  }
}

const getInsurancePet = (pet: PetType) => {
  if (pet?.pet_insurance && pet?.pet_insurance.length > 0) {
    const insurance = pet.pet_insurance[0]
    const insurance_plan = getInsurancePlans.value.find(
      (v: InsurancePlanType) =>
        v.id_insurance_plan === insurance.id_insurance_plan
    )
    const color = insurance.date_insurance_end < getDateToday()
    const expired = insurance.date_insurance_end < getDateToday()
    return {
      name_insurance_plan: insurance_plan?.name_insurance_plan,
      color: color,
      expired: expired
    }
  }
  return {}
}

const getPetVaccination = (pet: PetType) => {
  if (pet.last_service_detail) {
    const latestSD: ServiceDetailType = pet.last_service_detail
    if (latestSD.code_category2 === ITEM_SERVICE_CODE_CATEGORY_VACCINATION)
      return {
        datetime_service_start: latestSD.datetime_service_start,
        name_item_service: latestSD.name_item_service
      }
  } else return {}
}

async function getBookedRequestList(value: any) {
  const requestList = await useRequestStore().fetchBookingRequest({
    id_customer: value, 
    // flg_booking: true, 
    date_request_start: getDateToday() 
  })
  if (requestList && requestList.length > 0) {
    requestOptionList.value = requestList.map((item: any) => ({
      label: `${item.flg_booking ? '予約 ' : ''}${item.number_request} - ${item.title_request}`,
      value: item.id_request
    }))
  } else {
    requestOptionList.value = []
  }
}
async function selectingCustomer(value: any, initCall = false) {
  isPet.value = false
  // If address length not matched then refresh the list
  if (value) {
    ticketData.value.id_customer = value
    await customerStore.selectCustomerOptions(value)
    await getBookedRequestList(value)
    selectedCustomer.value = getCustomerOption.value
    if (selectedCustomer.value) {
      ticketData.value.code_customer = selectedCustomer.value.code_customer
      if (selectedCustomer.value.pets.length) {
        petListDefault.length = 0
        petList.value.length = 0
        selectedCustomer.value.pets.map((petObj: any) => {
          if ((
            petObj.flg_deceased ||
            petObj.flg_delete_by_customer ||
            petObj.flg_deceased ||
            petObj.flg_pet_excluded ||
            petObj.flg_unlist
          )) return 
          petListDefault.push({
            ...petObj,
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.value.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet
          })
        })
        petList.value = [...petListDefault]

        if (!isEdit.value) {
          ticketData.value.id_pet = []

          ticketData.value.id_pet.push(selectedCustomer.value.pets.filter((p1) => !(
            p1.flg_deceased ||
            p1.flg_delete_by_customer ||
            p1.flg_deceased ||
            p1.flg_pet_excluded ||
            p1.flg_unlist
          ))[0]?.id_pet)

          if (props.data?.id_pet && initCall) ticketData.value.id_pet = [props.data?.id_pet]

          selectingPet(ticketData.value.id_pet)
        }
        
        isPet.value = true
        selectingPet()
        if (!isEdit.value) {
          selectingDoctor()
        }
        submitBtn.value.$el.focus()
      }
    }
  } else {
    ticketData.value.id_pet = []
    ticketData.value.id_customer = ''
    id_pet.value = ''
    ticketData.value.code_pet = []
    selected_pets.value = []
    petList.value.length = 0
    petListDefault.length = 0
  }
}
const selectingDoctor = () => {
  let selectDoctor = null
  if (
    ticketData.value &&
    ticketData.value.id_pet &&
    ticketData.value.id_pet.length
  ) {
    if (
      petList.value[0].id_employee_main_doctor &&
      inputDoctor.value?.sortEmpList?.find(
        (v) => v.value === petList.value[0].id_employee_main_doctor
      )
    )
      selectDoctor = petList.value[0].id_employee_main_doctor
    else if (
      selectedCustomer.value.id_employee_doctor &&
      inputDoctor.value?.sortEmpList?.find(
        (v) => v.value === selectedCustomer.value.id_employee_doctor
      )
    )
      selectDoctor = selectedCustomer.value.id_employee_doctor
  }
  if(!ticketData.value.id_employee_doctor) {
    ticketData.value.id_employee_doctor = selectDoctor
  }
}

const openRequestPage = (row) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: ticketData.value.request[0]?.id_request }
  })
  window.open(route.href, '_blank')
}
const toggleStatus = (key: String) => {
  ticketData.value[key] = !ticketData.value[key]
}

const init = async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.data?.id_queue_ticket) {
    // Update case
    isEdit.value = true
    assignPageData(props.data)
    //ticketData.value = props.data
    if (props.data?.id_customer != '') {
      selectingCustomer(props.data?.id_customer, true)
    }

    await getBookedRequestList(props.data?.id_customer)

    if (props.data.request && props.data.request.length > 0) {
      ticketData.value.id_request = props.data.request[0].id_request
    }

    // set selected doctors
    // let employee_doctors = props.data.employee_doctor
    // employee_doctors = employee_doctors.map(ed => ed.id_employee)
    // data.value.id_employee_doctor = employee_doctors
    
    // set selected purposes
    type_visit_purpose_ticket_list.value = ticketData.value.type_visit_purpose_ticket

  } else {
    // Create case
    isEdit.value = false
    ticketData.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

    if (props?.data?.id_customer) {
      ticketData.value.id_customer = props.data.id_customer
      selectingCustomer(props.data.id_customer, true)
    }

    if (cliCommonQTVisitPurposeListById.value.length > 0 && type_visit_purpose_ticket_list.value.length == 0) {
      type_visit_purpose_ticket_list.value = [cliCommonQTVisitPurposeListById.value[0].value]
      selectedTypeVisitPurposeTicket(cliCommonQTVisitPurposeListById.value[0].value)
    }
  }

}

const selectDefaultEmployee = () => {
  ticketData.value.id_employee_doctor = defaultEmployee
}

const isAutofoucs = computed(() => {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('iphone') || platform.includes('ipad') || platform.includes('android')) {
    return false
  }
  return true
})


const clinicStore = useClinicStore()
const commonStore = useCommonStore()
const { getAllClinics } = storeToRefs(clinicStore)
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList } =
  storeToRefs(commonStore)
const breedDefaultList: any = reactive([])
const breedList: any = ref([])
const data = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
  id_employee_request: JSON.parse(localStorage.getItem('id_employee')),
  name_first: '',
  name_family: null,
  name_kana_family: '',
  name_kana_first: '',
  phone1: '',
  code_customer: null,
  name_pet: '',
  id_cm_animal: null,
  type_pet_gender: 1,
  id_cm_breed: '',
  date_register: formatDate(getDateToday()),
  pet_list: [],
  telephone: {
    type_tel: null,
    tel_full: null
  },
  queue_detail: {}
})

const updateTel = async (val: string | number | null = null) => {
  if (val) {
    data.value.telephone.tel_full = val.toString().replace(/[-() ]/g, '')
    const temp = val.toString().substr(0, 3)
    if (['080', '090', '070'].includes(temp)) data.value.telephone.type_tel = typeTel.find((i) => i.value === 2)?.value
    if (['050'].includes(temp)) data.value.telephone.type_tel = typeTel.find((i) => i.value === 6)?.value
  }
}
const setSelectedAnimal = (val: string) => {
  if (!val) {
    breedDefaultList.length = 0
    breedList.value.length = 0
    return false
  }

  breedDefaultList.length = 0
  breedList.value.length = 0
  const codeFunc = getCommonTypeAnimalOptionList.value.find((item) => {
    return item.id_common === val
  }).code_func1
  breedDefaultList.push(
    ...getCommonBreedOptionList.value.filter(
      (common: any) => common.code_func1 == codeFunc
    )
  )
  breedList.value = [...breedDefaultList]
}


onMounted(() => {
  init()
  insurancePlanStore.fetchInsurancePlans()
  // set page title
  if (props?.data?.customer?.name_family && props?.data?.petList?.length) {
    const pageTitle = `${props?.data?.customer?.name_family}${props?.data?.petList[0]?.name_pet}`
    setPageTitle(`受: ${pageTitle}`)
  }
})
</script>

<template>
  <q-form @submit="submit">
    <q-card-section class="q-bb q-pl-lg q-pr-sm q-py-none">
      <q-toolbar class="q-px-none">
        <q-toolbar-title class="text-grey-900 title2 bold">
          受付・整理券
        </q-toolbar-title>
        <MtFormCheckBox
          v-model:checked="quickCustomer"
          label="新規オーナー受付"
          class="q-mr-md"
          @update:checked="
            async () => {
              data.pet_list.push({
                name_pet: null,
                id_cm_animal: null,
                type_pet_gender: 10,
                id_cm_breed: null
              })
              await customerUtils.getNextCustomerCode(data, { value: null })
            }
          "
        />
        <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
          <q-icon size="xs" name="more_horiz" />
        </q-btn>
        <q-btn flat round dense icon="close" @click="closeModal" />
      </q-toolbar>
    </q-card-section>
    <!--新患登録 受付-->
    <q-card-section v-if="quickCustomer" class="row q-col-gutter-md modal-content">
      <div :tabindex="1" class="col-lg-6 col-md-6 col-sm-12">
        <div class="row q-col-gutter-md">
          <div class="col-12 title1">新規オーナー</div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              v-model="data.name_family"
              :tabindex="1"
              label="オーナー 姓 *"
              type="text"
              :rules="[aahValidations.validationRequired]"
              autofocus
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              v-model="data.name_first"
              :tabindex="2"
              label="オーナー 名"
              type="text"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              v-model="data.name_kana_family"
              :tabindex="3"              
              label="オーナー セイ"
              type="text"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              v-model="data.name_kana_first"
              :tabindex="4"
              label="オーナー メイ"
              type="text"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtFormInputNumber
              v-model:value="data.telephone.tel_full"
              :rules="[aahValidations.validationNumber]"
              label="電話番号"
              mode="phone"
              tabindex="5"
              @update:value="updateTel"
            >
            </MtFormInputNumber>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              v-model="data.code_customer"
              :disable="true"
              label="オーナーCD"
              type="text"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <!-- <MtFormPullDown
              v-model:options="getCliCommonQTVisitPurposeList"
              v-model:selected="ticketData.type_visit_purpose_ticket"
              :rules="[aahValidations.validationSelection]"
              :tabindex="51"
              label="来院目的 *"
              required
              @update:selected="selectedTypeVisitPurposeTicket"
            /> -->
            <MtFormMultipleSelection
              v-model:options="cliCommonQTVisitPurposeListById"
              @update:selected="selectedTypeVisitPurposeTicket"
              v-model="type_visit_purpose_ticket_list"
              label="来院目的 *"
              required
              :rules="[aahValidations.validationSelection]"
              :tabindex="51"
            />
            <!-- v-model:options="typeVisitPurposeTicket" -->
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <div class="row justify-between">
          <div class="col-auto title1">新規ペット</div>
          <div class="row justify-end">
            <q-btn
              class="q-mr-sm"
              round
              flat
              @click.stop="()=>{
                  data.pet_list.push({
                    name_pet: null,
                    id_cm_animal: null,
                    type_pet_gender: 10,
                    id_cm_breed: null,
                    name_kana_pet: null,
                  })
                }"
            >
              <q-icon name="add_circle" />
            </q-btn>
            <q-btn
              round
              flat
              @click.stop="()=>{
                  if(data.pet_list && data.pet_list.length > 0){
                    data.pet_list.pop(data.pet_list.length - 1);
                  }
                }"
            >
              <q-icon name="remove_circle_outline" />
            </q-btn>
          </div>
        </div>
        <q-scroll-area :style="data.pet_list && data.pet_list.length > 1 ? 'height: 360px;' : 'height : 180px;'">
          <div v-for="pet in data.pet_list" class="row q-col-gutter-md">            
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="pet.name_pet"
                :rules="[aahValidations.validationRequired]"
                :tabindex="10"
                label="ペット名 *"
                type="text"
                :multiple="false"
              />
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtInputForm
                v-model="pet.name_kana_pet"
                :rules="[aahValidations.validationRequired]"
                :tabindex="10"
                label="ペット名カナ *"
                type="text"
              />
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtFormPullDown
                v-model:selected="pet.id_cm_animal"
                :options="getCommonTypeAnimalOptionList"
                :rules="[aahValidations.validationSelection]"
                :tabindex="11"
                label="動物種 *"
                type="selection"
                @update:selected="setSelectedAnimal"
              />
              <!-- @update:selected="selectingBreed" -->
            </div>
            <div class="col-lg-6 col-md-6 col-sm-12">
              <MtFilterSelect
                v-if="pet.id_cm_animal"
                v-model:options="breedList"
                v-model:selecting="pet.id_cm_breed"
                :options-default="breedDefaultList"
                :tabindex="13"
                label="ペット品種"
              />
            </div>
            <div class="col-lg-12 col-md-12 col-sm-12">
              <template v-for="(type, i) in typePetGender" :key="i">
                <MtFormRadiobtn
                  v-model:selected="pet.type_pet_gender"
                  :label="type.label"
                  :tabindex="12"
                  :val="type.value"
                  size="28px"
                  type="radio"
                  class="pet-gender q-mr-md"
                  :class="{
                    'pet-gender-male': type.value === 1 || type.value === 4,
                    'pet-gender-female': type.value === 2 || type.value === 5,
                    'pet-gender-unknown': type.value === 10
                  }"
                />
              </template>
            </div>
          </div>
        </q-scroll-area>
      </div>
      <div class="col-lg-3 col-md-4 col-sm-12">
        <InputEmployeeOptGroup
          ref="inputDoctor"
          v-model:selected="data.id_employee_doctor"
          :tabindex="52"
          :multiple="true"
          clearable
          label="主担当者"
          show-select-default-employee
          @update:select-default-employee="()=>{data.id_employee_doctor = defaultEmployee}"
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtFormInputText
              v-model="ticketData.memo_admin"
              :tabindex="53"
              autogrow
              label="病院側メモ"
              type="text"
            />
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              v-model:checked="ticketData.flg_appointment"
              label="予約"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              v-model:checked="ticketData.flg_new_customer"
              label="新患"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              v-model:checked="ticketData.flg_visit_for_pet"
              label="お見舞い"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              v-model:checked="ticketData.flg_tel_requested"
              label="電話呼出希望"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              v-model:checked="ticketData.flg_web_payment_requested"
              label="Web決済希望"
            />
          </div>
        </div>
      </div>
    </q-card-section>
    <!--通常受付：既存オーナー-->
    <q-card-section
      v-if="!quickCustomer"
      class="row q-col-gutter-md q-mb-md"
      style="overflow-y: scroll; max-height: 85vh"
    >
      <div class="col-lg-6 col-md-6 col-sm-12" v-if="isEdit">
        <small class="text-grey-600">受付番号</small>
        <span class="qt_1">{{ ticketData.number_queue_ticket }}</span>
        <small class="text-grey-600 q-ml-lg">院内順序</small>
        <span class="qt_2">{{ ticketData.process_order }}</span>
      </div>
      <div v-if="ticketData.request && ticketData.request.id_request" class="col-lg-6 col-md-6 col-sm-12 q-pt-md">
        <span class="text-grey-500 cursor-pointer" @click="openRequestPage">
          <span class="text-blue ">{{ ticketData.request.number_request }}</span>
          {{ ' / ' + ticketData.request.title_request }}              
        </span>
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <MtFilterSelect
          label="診察券番号 *"
          v-model:selecting="ticketData.id_customer"
          v-model:options="customerList"
          :options-default="customerListDefault"
          required
          :rules="[aahValidations.validationRequired]"
          class="q-pa-none"
          :disable="isEdit"
          :autofocus="isAutofoucs"
          :tabindex="1"
          @update:selecting="selectingCustomer"
        />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <MtFormPullDown
          v-model:selected="ticketData.type_status_queue_ticket"
          v-model:options="statusQueueTicket"
          label="ステータス"
          v-if="isEdit"
          @update:model-value="filterQueueTicket()"
          :tabindex="3"
        />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <p 
          class="text-grey-600 q-mt-md"
          v-if="requestOptionList.length === 0">
          連携できるRQはありません。
        </p>
        <!--v-if="ticketData.request && ticketData.request.length < 1"-->
        <MtFormPullDown
          v-else
          v-model:options="requestOptionList"
          v-model:selected="ticketData.id_request"
          :tabindex="3"
          label="連携する既存リクエスト"
        />
      </div>
      <div class="flex col-lg-6 col-md-6 col-sm-12 q-pt-none">
          <q-select
            v-show="isPet"
            v-model="ticketData.id_pet"
            :options="petList"
            clearable
            dense
            label="受付ペット"
            emit-value
            map-options
            multiple
            use-chips
            @update:model-value="selectingPet"
            :tabindex="4"
          />
      </div>
      <div class="col-12">
        <!-- 各ペットごとに1行作成 -->
        <div 
          v-for="(petId, key) in ticketData.id_pet" 
          :key="petId" 
          class="row q-col-gutter-md pet-row"
        >
          <!-- ペットと来院目的 -->
          <div class="col-12 col-md-3">
            <div
              v-for="(pet, index) in getCustomerOption.pets.filter(p => p.id_pet === petId)" 
              :key="index"
            >
              <q-btn flat class="text-weight-bold bg-accent-300 q-py-xs q-px-md" @click.stop="onClickChip(pet)">
                {{ petList?.find(pet => pet.id_pet == petId)?.label }}
              </q-btn>
              <div
                v-if="pet?.pet_insurance"
                :class="getInsurancePet(pet).color ? 'text-red' : 'text-green'"
                class="title4 bold"
              >
                {{ getInsurancePet(pet).expired ? '【失効】' : '' }}
                {{ getInsurancePet(pet)?.name_insurance_plan }}
              </div>
              <div v-if="pet?.last_service_detail">
                {{ getPetVaccination(pet)?.datetime_service_start }}
                {{ getPetVaccination(pet)?.name_item_service }}
              </div>
            </div>
          </div>
          <div class="col-12 col-md-3">
            <MtFormMultipleSelection
              v-if="petId in ticketData.queue_detail"
              v-model="ticketData.queue_detail[petId].type_purpose_list"
              v-model:options="cliCommonQTVisitPurposeListById"
              :rules="[aahValidations.validationSelection]"
              :tabindex="2"
              label="来院目的 *"
              required
              @update:selected="selectedTypeVisitPurposeTicket"
            />
          </div>
          <!-- 主担当者 -->
          <div class="col-12 col-md-3">
            <MtFormMultipleSelection
              v-if="petId in ticketData.queue_detail"
              v-model="ticketData.queue_detail[petId].type_doctor_list"
              v-model:options="useEmployeeStore().getAllEmployees"
              :tabindex="2"
              label="主担当者"
              required
            />
          </div>
        </div>
      </div>

      <div v-if="ticketData.id_customer && getCustomerOption?.customer_tel && getCustomerOption.customer_tel.length > 0"
        class="col-12 q-pt-none">
        <div class="bg-grey-200 q-pa-md q-mx-sm">
          <small class="text-grey-700 q-mr-md">電話番号</small>
          <span v-for="tel in getCustomerOption?.customer_tel" :key="tel.id_tel" class="q-mr-lg">
            {{ typeTel.find((v) => v.value == tel.type_tel)?.label }} {{ tel.title_tel }} 
            <span 
              @click="copyText(`(${tel.tel1}) - ${tel.tel2} - ${tel.tel3}`)"
              class="text-blue cursor-pointer q-mx-md"
            >
              ( {{ tel.tel1 }} ) - {{ tel.tel2 }} - {{ tel.tel3 }}
            </span>
          </span>
        </div>
      </div>
      <!-- <div class="col-lg-3 col-md-4 col-sm-6">
        <InputEmployeeOptGroup
          ref="inputDoctor"
          v-model:selected="ticketData.id_employee_doctor"
          label="主担当者"
        />
      </div> -->
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtFormInputText
              type="text"
              label="病院側メモ"
              v-model="ticketData.memo_admin"
              autogrow
              :tabindex="6"
            />
          </div>
          <div v-if="isEdit" class="col-lg-6 col-md-6 col-sm-12">
            <MtFormInputText
              type="text"
              label="オーナーメモ（myVettyから入力）"
              v-model="ticketData.memo_customer"
              autogrow
              readonly
            />
          </div>
        </div>
      </div>
      <div class="col-12">
        <div class="row q-col-gutter-md">
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              label="予約"
              v-model:checked="ticketData.flg_appointment"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              label="新患"
              v-model:checked="ticketData.flg_new_customer"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              label="お見舞い"
              v-model:checked="ticketData.flg_visit_for_pet"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              label="電話呼出希望"
              v-model:checked="ticketData.flg_tel_requested"
            />
          </div>
          <div class="col-auto q-mr-md">
            <MtFormCheckBox
              label="Web決済希望"
              v-model:checked="ticketData.flg_web_payment_requested"
            />
          </div>
        </div>
      </div>
      <div class="col-md-6 col-sm-12" v-if="isEdit">
        <span class="q-mr-md">呼出</span>
        <q-btn 
          round 
          :outline="ticketData.flg_tel_requested ? false : true" 
          size="sm" 
          class="q-mx-md"
          :color="ticketData.flg_tel_requested ? 'blue-7' : 'grey-7'" 
          @click="toggleStatus('flg_tel_requested')"
        >
          <q-icon name="settings_phone" /> 
        </q-btn>
        <q-btn 
          round 
          :outline="ticketData.flg_parking_wait ? false : true" 
          size="sm" 
          :color="ticketData.flg_parking_wait ? 'blue-7' : 'grey-7'" 
          @click="toggleStatus('flg_parking_wait')"
        >
          <q-icon name="directions_car" /> 
        </q-btn>
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <MtFormPullDown
          label="想定対応時間"
          v-model:selected="ticketData.type_process_time"
          :options="typeProcessTime"
          :tabindex="8"
        />
      </div>
      <div class="col-lg-3 col-md-4 col-sm-6">
        <MtFormPullDown
          label="呼出予想時刻"
          v-model:selected="ticketData.datetime_estimate"
          :options="timeHourMinute"
          :tabindex="9"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          ref="submitBtn"
          unelevated
          color="primary"
          :tabindex="100"
          type="submit"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style lang="scss" scoped>
.modal-btn {
  display: flex;
  gap: 16px;
  justify-content: center;
  @media screen and (max-width: 500px) {
    flex-direction: column;
  }
}
.header-sticky {
  position: sticky;
  width: 100%;
  height: 5vh;
  background: white !important;
  top: 0;
  z-index: 100;
}
.bottom-sticky {
  position: sticky;
  width: 100%;
  background: white !important;
  bottom: 5px;
  z-index: 100;
}
.qt_1 {
  font-size: 30px;
  font-weight: bold;
  margin: 0 20px; 
}
.qt_2 {
  font-size: 16px;
  font-weight: bold;
  color: rgb(41, 56, 99);
  background: #cdcdcd;
  padding: 5px 13px;
  border-radius: 5px;
  margin-left: 20px;
}

.pet-row {
  border-bottom: 1px solid #cdcdcd;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

</style>
