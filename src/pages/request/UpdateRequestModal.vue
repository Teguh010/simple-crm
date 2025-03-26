<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import { checkDateRange, concatenate, copyText, formatDate, getDateToday, aahUtilsGetEmployeeName } from '@/utils/aahUtils'
import useAuthAtore from '@/stores/auth'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import selectOptions from '@/utils/selectOptions'
import { LocalStorage } from 'quasar'
import aahMessages from '@/utils/aahMessages'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import useCommonStore from '@/stores/common'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { event_bus } from '@/utils/eventBus'
import { InsurancePlanType, PetType, ServiceDetailType, TextTemplateType } from '@/types/types'
import AddTextTemplateModal from '../task/AddTextTemplateModal.vue'
import useTextTemplateStore from '@/stores/text-template'
import ViewPetDetailModal from '../master/customerPet/ViewPetDetailModal.vue'
import { ITEM_SERVICE_CODE_CATEGORY_VACCINATION } from '@/utils/const/constServiceDetail'
import useInsurancePlanStore from '@/stores/insurance_plans'
import { CONFIRM_MESSAGES } from '@/utils/enum';
type RequestFormType = {
  id_request: Number
  date_request_start: string
  date_request_goal: string
  title_request: string
  number_request: string
  code_customer: string
  id_customer: string
  code_ahmics_customer: string
  flg_non_charge: boolean
  flg_booking: boolean
  id_pet: string
  name_customer: string
  flg_ticket: boolean
  memo_request: string
  id_employee_doctor: string
  id_employee_staff: string
  id_employee_request: string
  flg_in_app_payment: boolean
  id_clinic: null
  flg_complete: boolean
}

const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getDoctors } = storeToRefs(employeeStore)
const authStore = useAuthAtore()
const router = useRouter()
const commonStore = useCommonStore()
const templateStore = useTextTemplateStore()
const insurancePlanStore = useInsurancePlanStore()

const { getInsurancePlans } = storeToRefs(insurancePlanStore)
const { getCustomerOption } = storeToRefs(customerStore)
const { getAuthUser } = storeToRefs(authStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const { getTemplates } = storeToRefs(templateStore)
// const authUser = computed(() => authStore.authUser)

const emits = defineEmits(['close'])

const props = defineProps({
  request: <any>Object,
  id_pet: { type: String, default: '' },
  id_customer: { type: String, default: '' },
  data: { type: Object },
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  requestDuplicate: { type: Boolean, default: false },
  id_request_old: {
    type: Number,
    default: null
  },
  disable_customer: { type: Boolean, default: false },
  disable_pet: { type: Boolean, default: false }
})

const requestForm = reactive<RequestFormType>({
  id_request: null,
  date_request_start: getDateToday(),
  date_request_goal: getDateToday(),
  title_request: '',
  number_request: '',

  code_customer: '',
  id_customer: '',
  code_ahmics_customer: '',
  flg_non_charge: false,
  flg_booking: false,
  id_pet: '',

  name_customer: '',

  flg_ticket: false,
  flg_apply_insurance: false,

  memo_request: '',

  id_employee_doctor: '',
  id_employee_staff: '',
  id_employee_request: '',
  flg_in_app_payment: false,
  id_clinic: null,
  flg_complete: false
})

const isEdit = ref(false)
const isPet = ref(false)
const addTemplateModal = ref(false)
const memoTemplates = ref<TextTemplateType[]>([])

const requestListByCustomer = ref([])

const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])
const flg_control_title_Request = ref(true)
const bookingDisabled = ref(false)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const assignPageData = (newData: any) => {
  if (newData?.id_request) {
    for (let key in requestForm) {
      requestForm[key] = newData[key]
    }
  }
}

const getEmployeeName = (empId: number) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}

const checkedFlgComplete = async (value: any) => {
  if (!value && requestForm.id_request) {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/request/${requestForm.id_request}/cart`
    )
    if (response && response.flg_completed) {
      await mtUtils.autoCloseAlert(
        '操作が必要な場合には、\n会計の完了を解除してください。'
      )
      requestForm.flg_complete = true
    }
  }

  if (value && requestForm.id_request) {
    const confirmation = await mtUtils.confirm(
      CONFIRM_MESSAGES.COMPLETE_REQUEST.message,
      CONFIRM_MESSAGES.COMPLETE_REQUEST.title,
      CONFIRM_MESSAGES.COMPLETE_REQUEST.button
    );

    if (!confirmation) {
      requestForm.flg_complete = false
      return
    }
  }
}

const clickDateTimeRequestStart = (value: any) => {
  if (value) {
    requestForm.date_request_goal = value
  }
}

const fetchRequestByCustomer = async (value: any) => {
  const res: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    '/requests',
    { 
      id_customer: value, 
      date_request_start: getDateToday(),
      flg_complete: 'false'
    }
  )
  if (res) {
    requestListByCustomer.value = res
  }
}
const selectingCustomer = async (value: any, initCall = false) => {
  requestForm.id_customer = value
  isPet.value = false
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
    await mtUtils.promiseAllWithLoader([
      customerStore.selectCustomerOptions(value),
      fetchRequestByCustomer(value)
    ])

    let selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      requestForm.code_customer = selectedCustomer.code_customer
      requestForm.code_ahmics_customer = selectedCustomer.code_ahmics_customer
      requestForm.name_customer = concatenate(
        selectedCustomer.name_family,
        selectedCustomer.name_first
      )
      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: PetType) => {
          if (petObj.flg_unlist || petObj.flg_deceased) return

          petListDefault.push({
            ...petObj,
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet,
            icon:
              getCommonTypeAnimalOptionList.value.find((c) => {
                return c.value === petObj.id_cm_animal
              })?.text1 ?? ''
          })
        })
        petList.value = [...petListDefault]
        isPet.value = true
        if (!isEdit.value && petList.value.length > 0) {
          requestForm.id_pet =
            petListDefault.find((pet: any) => pet.id_pet === props?.id_pet)
              ?.id_pet ?? petListDefault[0]?.id_pet
          updateDefaultPetDoctor(requestForm.id_pet)
        }
      }
    }
  } else {
    requestForm.code_customer = ''
    requestForm.code_ahmics_customer = ''
    requestForm.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}

const closeModal = () => {
  emits('close')
}
const handleAutoRequestTitle = () => {
  // let autoTitle = ''
  const selectedEmployeeDoctor = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_doctor
  )?.label
  const selectedEmployeeStaff = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_staff
  )?.label
  const fixedTextCustomer = requestForm.name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeStaff ? '/ 担当: ' : ''
  let autoTitle =
    (requestForm.date_request_start !== undefined
      ? requestForm.date_request_start
      : '') +
    ' ' +
    (requestForm.code_customer !== undefined ? requestForm.code_customer : '') +
    ' ' +
    (requestForm.name_customer !== undefined ? requestForm.name_customer : '') +
    (fixedTextCustomer !== undefined ? fixedTextCustomer : '') +
    ' ' +
    (selectedEmployeeDoctor !== undefined ? selectedEmployeeDoctor : '') +
    (fixedTextDoctor !== undefined ? fixedTextDoctor : '') +
    ' ' +
    (fixedTextStaff !== undefined
      ? fixedTextDoctor !== ''
        ? fixedTextStaff
        : fixedTextStaff.replace('/ ', '')
      : '') +
    (selectedEmployeeStaff !== undefined ? selectedEmployeeStaff : '')
  return autoTitle
}

const save = async () => {
  if (
    !requestForm.id_request &&
    !requestForm.id_request &&
    requestListByCustomer.value &&
    requestListByCustomer.value.length > 0
  ) {
    const confirmation = await mtUtils.confirm(
      '対象オーナーには未完了のリクエストが存在します。\n新規作成しますか？',
      '確認',
      'OK'
    )
    if (!confirmation) return
  }

  if (
    !checkDateRange([
      {
        start_date: requestForm.date_request_start,
        end_date: requestForm.date_request_goal
      }
    ])
  )
    return false
  requestForm.name_employee_request = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_request
  )?.label

  requestForm.name_employee_staff = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_staff
  )?.label

  requestForm.title_request = flg_control_title_Request.value
    ? handleAutoRequestTitle()
    : requestForm.title_request
  let payload = { ...requestForm }
  let res: any
  if (requestForm.id_request && requestForm.id_request != '') {
    // Edit case
    if(props.request.id_employee_doctor != payload.id_employee_doctor || props.request.id_employee_staff != payload.id_employee_staff){
      const confirmation_ = await mtUtils.confirm(
        'このリクエストで医師とスタッフの名前を更新しますか？',
        '確認',
        'はい、変更をオーダーにも反映する', 'いいえ、RQ情報のみ更新する' 
      )
      if(confirmation_ == 'send'){
        payload.change_id_employee_doctor_stuff_under_request = true
      }
    }
    res = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `/requests/${requestForm.id_request}`,
      payload
    )
    event_bus.emit('reloadTop', true)
    event_bus.emit('reloadRight', true)
  } else {
    const url = props.requestDuplicate ? 'request_duplication' : 'requests'
    requestForm.title_request = flg_control_title_Request.value
      ? handleAutoRequestTitle()
      : requestForm.title_request
    payload = { ...requestForm, id_request_old: props?.id_request_old }
    // create case
    res = await mtUtils.callApi(selectOptions.reqMethod.POST, url, payload)
  }
  if (res) {
    if (props.requestDuplicate) {
      const link = router.resolve({
        name: 'SearchRequestList'
      })
      link.href = `${res.id_request}`
      closeModal()
      window.open(link.href, '_blank')
    }
    assignPageData(res)

    mtUtils.autoCloseAlert(aahMessages.success)
    // props.updatedFlg.value = res.id_request
    if (props.updatedFlg.value === false) {
      // after creating Request navigate to perticular Request Details page
      router.push({ name: 'RequestDetail', params: { id: res.id_request } })
      emits('close')
    }
  }
}

const handleRequestTitle = (value: any) => {
  if (value === true) {
    requestForm.title_request = ''
  }
}

const updateDefaultPetDoctor = (value: any) => {
  requestForm.flg_apply_insurance = false
  
  if (value && !isEdit.value) {
    let relatedPet = petListDefault.find((v) => v.value === value)
    requestForm.id_employee_doctor = relatedPet?.id_employee_main_doctor ?? ''
    requestForm.id_employee_staff = relatedPet?.id_employee_main ?? ''

    if (relatedPet && relatedPet.pet_insurance && relatedPet.pet_insurance.length && relatedPet.pet_insurance.length > 0) {
      const insurancePlan = relatedPet.pet_insurance[0]
      const start_date = formatDate(insurancePlan.date_insurance_start)
      const end_date = formatDate(insurancePlan.date_insurance_end)
      if (start_date <= getDateToday() && end_date > getDateToday()) {
        requestForm.flg_apply_insurance = true
      }
    }
  }
}

const updateInsuranceByPet = (id_pet: any) => {

}

const selectDefaultEmployee = (key: string) => {
  requestForm[key as keyof RequestFormType] = defaultEmployee
}

const openRequestDetail = (id_request) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })
  window.open(route.href, '_blank')
}

const openPreventativeModal = async (item) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: requestForm.id_customer,
    id_pet: item.value,
    additional: { menu: 'preventative' }
  })
}
const onClickChip = async (item: any) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: requestForm.id_customer,
    id_pet: item.value
  })
}

const selectedPet = computed(() => {
  if (
    requestForm &&
    requestForm.id_pet
  ) {
    return petList.value.find((item) => item.value === requestForm?.id_pet)
  } else return {}
})

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

const openAddTextTemplateModal = async () => {
  await templateStore.fetchTemplates({ type_text_template: 11 })

  memoTemplates.value = getTemplates.value.filter((template) => {
    return template.type_text_template === 11
  }).map((template: any) => {
    return {
      title: template.memo_template,
      flg_title: template.flg_title,
      attr: {
        class: template.flg_title ? 'bg-grey-300' : ''
      },
      isSelected: false
    }
  })

  addTemplateModal.value = true
}

const handleUpdateRequestMemo = (value: string) => {
  requestForm.memo_request = value
}

onMounted(async () => {
  await insurancePlanStore.fetchInsurancePlans()
  requestForm.id_employee_request = JSON.parse(
    LocalStorage.getItem('id_employee') ?? ''
  )
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.request) {
    // On edit modal
    isEdit.value = true
    assignPageData(props.request)
    selectingCustomer(requestForm.id_customer)
  } else {
    // Create modal
    if (props.id_pet !== '' && props.id_customer !== '') {
      requestForm.id_customer = props.id_customer
      selectingCustomer(requestForm.id_customer)
      updateDefaultPetDoctor(props.id_pet)
      requestForm.id_pet = props.id_pet

      if (props.data?.memo_request)
        requestForm.memo_request = props.data.memo_request
      if (props.data?.id_employee_doctor)
        requestForm.id_employee_doctor = props.data.id_employee_doctor
      if (props.data?.id_employee_staff)
        requestForm.id_employee_staff = props.data.id_employee_staff
      if (props.data?.flg_non_charge)
        requestForm.flg_non_charge = props.data.flg_non_charge
      if (props.data?.flg_in_app_payment)
        requestForm.flg_in_app_payment = props.data.flg_in_app_payment
      if (props.data?.id_employee_request)
        requestForm.id_employee_request = props.data.id_employee_request
    }
    if (props.data?.id_employee_doctor) {
      requestForm.id_employee_doctor = props.data.id_employee_doctor
    }
    if (props.data?.date_request_start) {
      requestForm.date_request_start = props.data?.date_request_start
      requestForm.date_request_goal = props.data?.date_request_goal
      requestForm.flg_booking = props.data?.flg_booking
      bookingDisabled.value = true
    }

    if (props.data?.flg_booking) {
      requestForm.flg_booking = props.data?.flg_booking
      bookingDisabled.value = true
    }

    if (props.request?.id_employee_doctor) {
      requestForm.id_employee_doctor = props.request.id_employee_doctor
    }
    if (props.request?.id_employee_staff) {
      requestForm.id_employee_staff = props.request.id_employee_staff
    }

    requestForm.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="save">
    <q-card-section class="q-bb q-pl-lg q-pr-sm q-py-none">
      <q-toolbar class="q-px-none">
        <q-toolbar-title :class="{ 'cursor-pointer': requestForm.number_request }" class="text-grey-900 title2 bold"
          @click="
            requestForm.number_request
              ? copyText(requestForm.number_request)
              : null
          ">
          {{ isEdit ? 'リクエスト番号：' : '新規リクエスト' }}
          <span v-if="requestForm.number_request">
            {{ requestForm.number_request }}
            <q-icon class="text-blue" name="content_copy" />
          </span>
        </q-toolbar-title>
        <q-btn v-if="isEdit" unelevated label="リクエスト完了" class="bg-grey-200 text-grey-500 q-mr-md"
          style="border: 1px solid #9e9e9e; border-radius: 8px" />
        <q-btn flat round dense icon="close" @click="closeModal" />
      </q-toolbar>
    </q-card-section>
    <q-card-section class="q-px-xl" style="overflow-y: scroll; max-height: 85vh">
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="3" class="col-lg-4 col-md-4 col-sm-6">
          <MtFormInputDate label="リクエスト開始日" v-model:date="requestForm.date_request_start"
            @update:date="clickDateTimeRequestStart"></MtFormInputDate>
        </div>
        <div tabindex="4" class="col-lg-4 col-md-4 col-sm-6">
          <MtFormInputDate label="リクエスト終了日" v-model:date="requestForm.date_request_goal"></MtFormInputDate>
        </div>
        <div tabindex="5" class="col-lg-4 col-md-4 col-sm-12">
          <MtInputForm type="checkbox" :items="[{ label: '予約リクエスト' }]" v-model="requestForm.flg_booking"
            :disable="bookingDisabled" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div v-if="!flg_control_title_Request" class="col-12">
          <MtInputForm type="text" :filled="flg_control_title_Request" v-model="requestForm.title_request" :label="
              flg_control_title_Request
                ? '保存時に自動でタイトルを生成します'
                : 'リクエスト名 *'
            " :required="!flg_control_title_Request" :rules="[(val: string) => !!val || 'エラーメッセージ']" />
        </div>
        <div v-if="requestForm.title_request !== undefined">
          <MtInputForm type="checkbox" :items="[{ label: '自動タイトル' }]" v-model="flg_control_title_Request"
            @update:model-value="handleRequestTitle" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="1" class="col-lg-4 col-md-4 col-sm-12">
          <MtFilterSelect label="診察券番号 " v-model:selecting="requestForm.id_customer" v-model:options="customerList"
            :options-default="customerListDefault" :disable="disable_customer" autofocus custom-option
            @update:selecting="selectingCustomer" :rules="[(val: string) => !!val || '入力必須項目です']">
            <template #selectedCustomOption="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon v-if="slotProps.opt.icon" name="circle" size="16px" :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }" />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-12"></div>
        <div class="row col-lg-4 col-md-4 col-sm-12 column text-blue cursor-pointer">
          <q-scroll-area style="height: calc(45px)">
            <div v-for="request in requestListByCustomer" :key="request.id_request"
              @click="openRequestDetail(request.id_request)">
              <span v-if="request.flg_booking" class="q-mr-xs">{{ '【予約】'}}</span>
              {{ request.number_request }} -
              {{ request.date_request_start }}
              {{ request.date_request_start !== request.date_request_goal ? ' ~ ' + request.date_request_goal : '' }}
              {{ getEmployeeName(request.id_employee_doctor) }}
            </div>
          </q-scroll-area>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="2" class="col-lg-4 col-md-4 col-sm-12" v-if="isPet">
          <MtFilterSelect v-model:selecting="requestForm.id_pet" v-model:options="petList"
            :options-default="petListDefault" label="デフォルトペット" custom-option :disable="disable_pet"
            @update:selecting="updateDefaultPetDoctor" :rules="[(val: string) => !!val || '入力必須項目です']">
            <template #selectedItem="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon v-if="slotProps.opt.icon" name="circle" size="16px" :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }" />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>

        <div class="flex col-lg-6 col-md-4 col-sm-12">
          <div>
            <div v-show="isPet" @click.stop="onClickChip(selectedPet)"
              class="q-ba cursor-pointer q-pa-sm q-ma-sm border-radius-10">
              <div class="flex no-wrap">
                {{ selectedPet?.name_pet }}
                <div class="q-ml-md">
                  <div v-if="selectedPet?.pet_insurance" :class="
                      getInsurancePet(selectedPet).color ? 'text-red' : 'text-green'
                    " class="title4 bold">
                    {{ getInsurancePet(selectedPet).expired ? '【失効】' : '' }}
                    {{ getInsurancePet(selectedPet)?.name_insurance_plan }}
                  </div>
                  <div v-if="selectedPet?.last_service_detail">
                    {{ getPetVaccination(selectedPet)?.datetime_service_start }}
                    {{ getPetVaccination(selectedPet)?.name_item_service }}
                  </div>
                </div>
                <q-btn flat @click.stop="openPreventativeModal(selectedPet)" class="q-ml-md text-blue">
                  予防歴
                </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12" tabindex="10">
          <MtInputForm type="text" v-model="requestForm.memo_request" label="リクエストメモ" autogrow>
            <template #append>
              <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal" />
            </template>
          </MtInputForm>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div tabindex="15" class="col-lg-4 col-md-4 col-sm-6">
          <InputEmployeeOptGroup v-model:selected="requestForm.id_employee_doctor" type-occupation="doctor"
            label="担当獣医師" show-select-default-employee @update:select-default-employee="
              selectDefaultEmployee('id_employee_doctor')
            " />
        </div>
        <div tabindex="16" class="col-lg-4 col-md-4 col-sm-6">
          <InputEmployeeOptGroup v-model:selected="requestForm.id_employee_staff" label="担当者" clearable
            class="clear-icon" dense show-select-default-employee @update:select-default-employee="
              selectDefaultEmployee('id_employee_staff')
            " />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm type="checkbox" :items="[{ label: '会計対象外' }]" v-model="requestForm.flg_non_charge" />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtFormCheckBox v-model:checked="requestForm.flg_apply_insurance" label="保険適用" />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <MtInputForm type="checkbox" :items="[{ label: 'アプリ内会計希望' }]" v-model="requestForm.flg_in_app_payment" />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <MtFormCheckBox v-model:checked="requestForm.flg_complete" label="完了" @update:checked="checkedFlgComplete" />
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <InputEmployeeOptGroup v-model:selected="requestForm.id_employee_request" label="リクエスト作成者 *"
            show-select-default-employee @update:select-default-employee="
              selectDefaultEmployee('id_employee_request')
            " />
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
            <span>キャンセル</span>
          </q-btn>
          <q-btn type="submit" tabindex="30" unelevated color="primary" class="q-ml-md">
            <span>保存</span>
          </q-btn>
        </div>
        <div></div>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal v-model:value="addTemplateModal" modelTitle="リクエストメモ" :options="memoTemplates"
    :data="requestForm" :single-option="true" @update:memo="handleUpdateRequestMemo" />
</template>

<style lang="scss" scoped>
.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}
.c-grid {
  display: grid;
  grid-template-columns: 120px auto 120px;
  flex-direction: column;
}

.first-item {
  max-width: 100px;
}

.q-item {
  min-height: auto !important;
  padding: 2px 0 !important;
}
.header-sticky {
  position: sticky;
  width: 100%;
  height: 5vh;
  background: white !important;
  top: 0;
  z-index: 100;
}
</style>
