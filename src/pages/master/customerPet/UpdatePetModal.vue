<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import usePetStore from '@/stores/pets'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useCustomerStore from '@/stores/customers'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import { storeToRefs } from 'pinia'
import OptionModal from '@/components/OptionModal.vue'
import { imageResize } from '@/utils/helper'
import MtModalHeader from '@/components/MtModalHeader.vue'
import {
  blank,
  dateFormat,
  formatDate,
  getCurrentPetAge,
  getCustomerName,
  getDateToday,
  getFullPetName,
  getPetFirstNameOnly
} from '@/utils/aahUtils'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtTable2 from '@/components/MtTable2.vue'
import UpdatePetInsuranceModal from '@/pages/master/customerPet/UpdatePetInsuranceModal.vue'
import usePetInsuranceStore from '@/stores/pet-insurances'
import useInsuranceStore from '@/stores/insurances'
import useCommonStore from '@/stores/common'
import useEmployeeStore from '@/stores/employees'
import SelectPrintTemplate from './detail/SelectPrintTemplate.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import {
  typeBlood,
  typePetExcludeReason,
  typePetGender,
  typeTitlePetCustomerUpdated,
  typeInsertedBodyPart
} from '@/utils/enum'
import { event_bus } from '@/utils/eventBus'
import useCliCommonStore from '@/stores/cli-common'
import dayjs from 'dayjs'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useModalStore from '@/stores/modal'
import ExtraConfirmationModal from '@/components/ExtraConfirmationModal.vue'
import ComponentFormAddress from '@/components/address/ComponentFormAddress.vue'
import useAddressesStore from '@/stores/addresses'

const { getCommonTypeGeneralInsurerOptionList } = storeToRefs(useCommonStore())
const employeeStore = useEmployeeStore()

const props = defineProps({
  idEmployeeDoctor: String,
  idEmployee: String,
  typeDiscRate: String,
  openInsuranceTab: Boolean,
  customerDmChecked: {type: Boolean, default: false},
  callBackClose: Function
})

// change data into petForm
const data = ref({
  id_customer: 0,
  code_pet: '',
  name_pet: '',
  name_kana_pet: '',
  type_title_pet_customer_updated: 1,
  name_pet_customer_updated: '',
  type_pet_gender: 10,
  type_animal: null,
  name_breed: '',
  id_cm_breed: '',
  id_cm_hair: '',
  name_hair_color: '',
  date_birth: null,
  flg_unknown_dob: false,
  type_blood: null,
  flg_transfusion_ok: false,
  memo_transfusion: null,
  pet_alert: '00000000',
  id_employee_doctor: '',
  memo_pet: '',
  memo_pet_info: '',
  image_path1: '',
  image_path2: '',
  id_employee_main_doctor: '',
  id_employee_main: '',
  flg_insurance_plan: false,
  memo_pet_by_customer: '',
  code_insurance: '',
  date_insurance_start: null,
  date_insurance_end: null,
  memo_insurance: '',
  flg_microchip: false,
  microchip_id: '',
  flg_deceased: false,
  datetime_deceased: null,
  flg_send_flower: false,
  date_send_flower: null,
  memo_send_flower: '',
  status_pet: null,
  flg_delete_by_customer: false,
  flg_existence: false,
  display_order: 0,
  flg_pet_excluded: false,
  date_excluded: null,
  flg_unlist: false,
  code_city_hall: '',
  datetime_licensed: null,
  license_id: '',
  name_registered: '',
  date_last_visit: null,
  date_register: dayjs().format('YYYY/MM/DD'),
  id_cm_animal: null,
  type_disc_rate: null,
  id_disease_insurer_out1: null,
  id_disease_insurer_out2: null,
  id_disease_insurer_out3: null,
  memo_excluded: '',
  microchip_place: '',
  flg_allergy: false,
  flg_sideeffect: false,
  flg_dm: props.customerDmChecked,

  code_customer: '',
  title_address: '',
  phone1: null,
  flg_main_address: false,
  zip_code: '',
  address_prefecture: '',
  address_city: '',
  address_other: '',
  name_address: '',
  memo_address: '',
  id_pet_rabies: '',
})

const flg_type_alert_ui = ref([
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false
])

const addExcludeReasonModal = ref(false)
const addMicrochipPlaceModal = ref(false)

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const emits = defineEmits(['close'])
const addressStore = useAddressesStore()
const cliCommonStore = useCliCommonStore()
const petStore = usePetStore()
const customerStore = useCustomerStore()
const petInsuranceStore = usePetInsuranceStore()
const insuranceStore = useInsuranceStore()
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getPetInsurances } = storeToRefs(petInsuranceStore)
const { getInsurers, getInsurances } = storeToRefs(insuranceStore)
const {
  getCliCommonHairColorList,
  getCliCommonDiscountRateList,
  getCliCommonTypePetNatureList
} = storeToRefs(cliCommonStore)
const petImagePreview = ref()
const selectedBreedsDefault: any = reactive([])
const selectedBreeds: any = ref([])
const hairColorListDefault: any = reactive([])
const hairColorList: any = ref([])
const getDataForCheck: any = ref([])
const commonTypeAnimalOptionList = ref([])
const isLoading = ref(false)
const petBirthDuration = ref(null)
const discountRateList = ref<{ label: string; value: string }[]>([])

const isEditAddress = ref(false)
const isEdit = ref(false)
const isBreed = ref(false)
const isOpe = ref(false)
const tab = ref('tab1')
const f1_status = ref('unchanged')
const showDogFields = ref(false)
const blankField = (row: any) => (data.value = blank(data.value, row))

const petInsuranceColumns = [
  {
    name: 'id_cm_insurer',
    label: '保険会社',
    field: 'id_cm_insurer',
    align: 'left'
  },
  {
    name: 'id_insurance_plan',
    label: '保険プラン',
    field: 'id_insurance_plan',
    align: 'left'
  },
  {
    name: 'code_insurance',
    label: '証券番号',
    field: 'code_insurance',
    align: 'left'
  },
  {
    name: 'date_insurance',
    label: '保険期間',
    field: 'date_insurance',
    align: 'left'
  },
  {
    name: 'count_hospital_visit',
    label: '通院',
    field: 'count_hospital_visit',
    align: 'left'
  },
  {
    name: 'count_inpatient_stay',
    label: '入院',
    field: 'count_inpatient_stay',
    align: 'left'
  },
  {
    name: 'count_surgery',
    label: '手術',
    field: 'count_surgery',
    align: 'left'
  }
]

function checkedTypeAlertFlg(value: any, flg_index: any) {
  if (data.value.pet_alert === '' || data.value.pet_alert === null)
    data.value.pet_alert = '00000000'
  if (value) {
    data.value.pet_alert = replaceCharAtIndex(
      data.value.pet_alert,
      flg_index,
      '1'
    )
  } else {
    data.value.pet_alert = replaceCharAtIndex(
      data.value.pet_alert,
      flg_index,
      '0'
    )
  }
}

function replaceCharAtIndex(str: any, index: any, newChar: any) {
  if (index < 0 || index >= str.length) {
    return str // index is out of bounds
  }

  let chars = str.split('')
  chars[index] = newChar
  return chars.join('')
}

const onFilePicked = (e: any, type: any) => {
  const files = e.target.files
  const reader = new FileReader()
  reader.onload = (e) => {
    mtUtils.smallPopup(ImageCropper, { image: e.target.result })
  }
  reader.readAsDataURL(files[0])
}

const objectData = (obj: any) => {
  const formData = {} as any
  Object.entries(obj).forEach(([key]) => {
    if (
      getPet.value?.image_path2 !== null &&
      f1_status.value !== 'changed' &&
      f1_status.value !== 'removed'
    ) {
      // in update case if image not changed or removed then image_path2 key will not pass to BE
      if (key !== 'image_path2' && key !== 'thumbnail_path2') {
        formData[key] = obj[key]
      }
    } else {
      // in update case if there is no image or image changed else removed then image_path2 key will pass to BE
      formData[key] = obj[key]
    }
  })
  delete formData.image_path1
  return formData
}

const submit = () => {
  isLoading.value = true
  if (data.value.datetime_deceased) {
    data.value.datetime_deceased = data.value.datetime_deceased + ' 00:00:00'
  }
  if (data.value.datetime_licensed) data.value.datetime_licensed = dateFormat(data.value.datetime_licensed, 'YYYY-MM-DD HH:mm:ss')
  if (data.value.date_register) {
    data.value.date_register =
      data.value.date_register
  }
  if (getPet.value) {
    const filteredData = objectData(data.value)

    delete filteredData.thumbnail_path1
    delete filteredData.thumbnail_path2

    petStore
      .updatePet(data.value.id_pet, data.value.id_customer, filteredData)
      .then(async () => {
        await customerStore.selectCustomer(data.value.id_customer, true)
        customerStore.selectPet(data.value.id_pet)
        isLoading.value = false
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    petStore
      .submitPet(data.value.id_customer, data.value)
      .then(async () => {
        await customerStore.selectCustomer(data.value.id_customer)
         isLoading.value = false
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
      .catch((error) => {
         isLoading.value = false
        let errorJson = JSON.parse(error.request.response)
        mtUtils.autoCloseAlert('Error :\t' + errorJson.message)
      })
  }

  const payloadAddress = {
    id_customer: data.value.id_customer,
    code_customer: data.value.code_customer,
    title_address: data.value.title_address,
    phone1: data.value.phone1,
    flg_main_address: data.value.flg_main_address,
    zip_code: data.value.zip_code,
    address_prefecture: data.value.address_prefecture,
    address_city: data.value.address_city,
    address_other: data.value.address_other,
    name_address: data.value.name_address,
    memo_address: data.value.memo_address,
    id_pet_rabies: getPet.value?.id_pet
  }
  // AFTER SAVE PET, SAVE THE ADDRESS
  if (isEditAddress.value) {
    payloadAddress.id_address = data.value.id_address
    addressStore.updateAddress(payloadAddress.id_address, payloadAddress.id_customer, payloadAddress)
  } else {
    payloadAddress.code_address = payloadAddress.code_customer
    addressStore.submitAddress(payloadAddress.id_customer, payloadAddress)
  }
}

const modalStore = useModalStore()

const openMenu = async () => {
  let menuOptions = [
  {
      title: '印刷',
      name: 'certificate_issuance',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
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
      
      modalStore.open({
        component: ExtraConfirmationModal,
        data: {
          submitFn: async () => {
            modalStore.toggleLoading(true)
            petStore
              .destroyPet(data.value.id_pet, data.value.id_customer)
              .then(async () => {
                modalStore.close()
                props.callBackClose()
                await customerStore.selectCustomer(data.value.id_customer)
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
              .finally(() => {
                modalStore.toggleLoading(false)
              })
          },
        }
      })
    } else if (selectedOption.name == 'certificate_issuance') {
      const customerData = getCustomer.value
      mtUtils.smallPopup(SelectPrintTemplate, { customerData: customerData })
    }
  }
}

const closeModal = () => {
  emits('close')
}

const selectingBreed = (value: any, update: boolean = false) => {
  isBreed.value = false
  selectedBreeds.value.length = 0
  selectedBreedsDefault.length = 0
  const animalType = useCommonStore().getCommonTypeAnimalOptionList.find(
    (breed: any) => breed.id_common == value
  )?.code_func1

  handleDogTypeFields(animalType)
  if (animalType) {
    useCommonStore().getCommonBreedOptionList.map((breed: any) => {
      if (breed.code_func1 == animalType) {
        selectedBreedsDefault.push({
          label: breed.name_common,
          value: breed.id_common,
          code_func1: breed.code_func1
        })
      }
    })
    selectedBreeds.value = [...selectedBreedsDefault]

    isBreed.value = true
    if (update) {
      data.value.id_cm_breed = ''
    }
  } else {
    data.value.id_cm_breed = ''
  }
}

const processPetAlertString = () => {
  const typePetAlerts = data.value.pet_alert.split('')
  typePetAlerts.forEach((value, index) => {
    if (value == '1') {
      flg_type_alert_ui.value[index] = true
    } else {
      flg_type_alert_ui.value[index] = false
    }
  })
}

const handleDogTypeFields = (value: any) => {
  const dogType = [2, '2', 11, '11', 12, '12', 13, '13']
  if (value && dogType.includes(value)) {
    showDogFields.value = true
  } else {
    showDogFields.value = false
  }
}

const init = () => {
  if (getCustomer.value) {
    data.value.id_customer = getCustomer.value.id_customer
  }
  hairColorList.value.length = 0
  hairColorListDefault.length = 0
  hairColorList.value = [...getCliCommonHairColorList.value]
  hairColorListDefault.push(...getCliCommonHairColorList.value)

  discountRateList.value = getCliCommonDiscountRateList.value
    .filter((cli) => {
      return cli.code_cli_common === '7'
    })
    .map((obj) => ({
      label: obj.name_cli_common,
      value: obj.code_func1
    }))

  selectingBreed(data.value.id_cm_animal)
  // insuranceStore.fetchInsurers()
  // insuranceStore.fetchInsurances()
  // selectingTypeBlood(data.value.type_blood)
}

const removeImage = () => {
  data.value.image_path2 = ''
  petImagePreview.value = ''
  f1_status.value = 'removed'
}

const openPetInsuaranceModal = async () => {
  await mtUtils.mediumPopup(UpdatePetInsuranceModal, {
    id_pet: data.value.id_pet,
    pet_name: getPetFirstNameOnly(getPet.value),
    customer_name: getCustomerName(getCustomer.value),
    pet_birthday: getPet.value.date_birth
  })
}

const onRowPetInsuranceClick = async (row: any) => {
  await mtUtils.mediumPopup(UpdatePetInsuranceModal, {
    data: row,
    id_pet: data.value.id_pet
  })
}

const getInsurerName = (id: any) => {
  return getCommonTypeGeneralInsurerOptionList.value.find(
    (item: any) => item.id_common === id
  )?.name_common
}
const getInsurancePlanName = (value: any) =>
  getInsurances.value.find((i) => i.id_insurance_plan === value)
    ?.name_insurance_plan

const updateBirthDate = (value: any) => {
  if (value) petBirthDuration.value = getCurrentPetAge(data.value)
  else petBirthDuration.value = ''
}

const selectDefaultEmployee = (key: string) => {
  data.value[key] = defaultEmployee
}

const toTodaysDate = () => {
  data.value.date_last_visit = getDateToday()
}

const onUpdateFlgExcluded = (value: boolean) => {
  if (!value) {
    data.value.memo_excluded = ''
    data.value.date_excluded = ''
    return
  }
  data.value.date_excluded = dayjs().format('YYYY/MM/DD')
  return
}

const handleUpdateExcludeReason = (value: string) => {
  data.value.memo_excluded = `${data.value.memo_excluded} ${value}`
}
const handleInsertBodyPart = (value: string) => {
  data.value.microchip_place = `${
    data.value.microchip_place ? data.value.microchip_place + ' ' : ''
  }${value}`
}

const onUpdateFlgUnlist = (value: boolean) => {
  if (!value) {
    data.value.flg_pet_excluded = false
    data.value.memo_excluded = ''
    data.value.date_excluded = ''
    data.value.datetime_deceased = ''
    data.value.flg_deceased = false
    data.value.flg_send_flower = false
    data.value.date_send_flower = ''
    data.value.memo_send_flower = ''
    return
  }
  return
}

const onUpdateFlgDeceased = (value: boolean) => {
  if (!value) {
    data.value.datetime_deceased = ''
    data.value.flg_deceased = false
    data.value.flg_send_flower = false
    data.value.date_send_flower = ''
    data.value.memo_send_flower = ''
    return
  }
  data.value.datetime_deceased = dayjs().format('YYYY/MM/DD')
  return
}

const onUpdateFlgSendFlower = (value: boolean) => {
  if (!value) {
    data.value.date_send_flower = ''
    data.value.memo_send_flower = ''
    return
  }
  data.value.date_send_flower = dayjs().format('YYYY/MM/DD')
  return
}

event_bus.on('cropped-image', (image) => {
  imageResize(image.blob)
    .then((i) => {
      data.value.image_path2 = i
      petImagePreview.value = URL.createObjectURL(i)
      f1_status.value = 'changed'
    })
    .catch((error) => {
      console.error('Failed to resize image:', error)
    })
})

const showAlert = computed(() => {
  const codeFuncToInclude = [11, '11', 12, '12', 13, '13']
  const codeFunc = commonTypeAnimalOptionList.value.find(
    (v: any) => v.id_common == data.value.id_cm_animal
  )?.code_func1
  const today = dayjs()
  const diff = today.diff(data.value.date_birth, 'days')

  if (
    codeFuncToInclude.includes(codeFunc) &&
    diff > 90 &&
    !data.value.license_id
  ) {
    return true
  }
  return false
})

const excludeReasons = computed(() => {
  return typePetExcludeReason.map((t) => {
    return {
      ...t,
      title: t.label,
      flg_title: false,
      isSelected: false
    }
  })
})
const insertedBodyPart = computed(() => {
  return typeInsertedBodyPart.map((t) => {
    return {
      ...t,
      title: t.label,
      flg_title: false,
      isSelected: false
    }
  })
})

onMounted(async () => {
  let codeCommonList = [1, 2, 3, 10, 29]

  if (useCommonStore().commonDiscountRatesList.length === 0)
    codeCommonList.push(30)

  await mtUtils.promiseAllWithLoader([
    useCommonStore().fetchPreparationCommonList({
      code_common: codeCommonList
    }),
    useCliCommonStore().fetchPreparationCliCommonList({
      code_cli_common: [5]
    })
  ])

  commonTypeAnimalOptionList.value = [
    ...useCommonStore().getCommonTypeAnimalOptionList
  ].filter((data) => {
    return dayjs(data.date_end).isAfter(
      dayjs().subtract(1, 'days').format('YYYY/MM/DD')
    )
  })
  if (getPet.value?.id_pet) {
    isEdit.value = true
    data.value = JSON.parse(JSON.stringify(getPet.value))
    data.value.date_birth = data.value.date_birth
      ? formatDate(data.value.date_birth)
      : null
    data.value.datetime_deceased =
      data.value.flg_deceased && data.value.datetime_deceased
        ? formatDate(data.value.datetime_deceased)
        : null
    handleDogTypeFields(data.value.type_animal)
    petImagePreview.value = data.value?.image_path2 ?? data.value.image_path1
    processPetAlertString()
    petInsuranceStore.fetchPetInsurances({
      id_pet: data.value?.id_pet
    })
    petBirthDuration.value = getCurrentPetAge(data.value)

    if (
      commonTypeAnimalOptionList.value.find(
        (v: any) => v.id_common == data.value.id_cm_animal
      )?.code_func1 &&
      [2, '2', 11, '11', 12, '12', 13, '13'].includes(
        commonTypeAnimalOptionList.value.find(
          (v: any) => v.id_common == data.value.id_cm_animal
        )?.code_func1
      )
    ) {
      showDogFields.value = true
    }

    if (getPetInsurances.value.length > 0) data.value.flg_insurance_plan = true
  } else {
    isEdit.value = false
    data.value.type_disc_rate = props.typeDiscRate
    data.value.type_title_pet_customer_updated = 1
    data.value.code_pet = `${getCustomer.value?.code_customer}_${
      getCustomer.value?.pets?.length + 1
    }`
  }

  if (getPet.value?.name_registered) {
    await addressStore.fetchAddressPetRabies(getPet.value?.id_pet)
    if (addressStore.addressPetRabies) {
      isEditAddress.value = true
      data.value.id_address = addressStore.addressPetRabies.id_address
      data.value.zip_code = addressStore.addressPetRabies.zip_code
      data.value.address_prefecture = addressStore.addressPetRabies.address_prefecture
      data.value.address_city = addressStore.addressPetRabies.address_city
      data.value.address_other = addressStore.addressPetRabies.address_other
      data.value.name_address = addressStore.addressPetRabies.name_address
      data.value.memo_address = addressStore.addressPetRabies.memo_address
    }
  }

  if (props.idEmployeeDoctor)
    data.value.id_employee_main_doctor = props.idEmployeeDoctor
  if (props.idEmployee) data.value.id_employee_main = props.idEmployee
  data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  init()

  if (props.openInsuranceTab) {
    tab.value = 'tab2'
  }

})

const updatePetTitle = (genderType: number) => {
  switch(genderType) {
    case 1:
    case 4:
      data.value.type_title_pet_customer_updated = 2
      break
    case 2:
    case 5:
      data.value.type_title_pet_customer_updated = 1
      break
    case 10:
      data.value.type_title_pet_customer_updated = 3
      break
    default:
      data.value.type_title_pet_customer_updated = 3
      break
  }
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        <span v-if="isEdit">
          <span v-if="data.flg_unlist" class="remove-pet q-mr-sm">除外</span>
          <span v-if="data.flg_insurance_plan" class="light-green-chip"
            >保険</span
          >
          {{ getFullPetName(customerStore.getPet, customerStore.getCustomer) }}
        </span>
        <span v-else>ペット 新規登録</span>
        <q-tabs v-model="tab" class="tab-style2 q-ml-lg">
          <q-tab class="tabsBox" name="tab1" label="基本" />
          <q-tab class="tabsBox" name="tab2" label="保険" />
          <q-tab class="tabsBox" name="tab3" label="他" />
        </q-tabs>
      </q-toolbar-title>
      <div v-if="isEdit" class="q-mr-lg">
        <!--<span class="q-pr-lg">
          <small class="text-grey-600 q-pr-sm">初診日 :</small>
          {{ data?.date_register }}
        </span>-->
        <span v-if="data?.date_last_visit">
          <small class="text-grey-600 q-pr-sm">最終来院日 :</small>
          {{ data?.date_last_visit }}
        </span>
      </div>
      <q-btn v-if="getPet" round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl pet-modal">
      <div v-if="showAlert">
        <span class="text-darkred">
          <q-icon name="warning_amber" /> 鑑札番号が未登録です。
        </span>
      </div>
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="tab1">
          <div class="row q-mt-md q-mb-sm">
            <div class="col-2">
              <div v-if="petImagePreview" class="row no-wrap items-start">
                <q-img
                  :src="petImagePreview"
                  spinner-color="white"
                  style="width: 200px; height: 200px"
                  class="roundedImage cursor-pointer"
                />
                <q-badge
                  color="red"
                  class="badge-position cursor-pointer"
                  transparent
                  @click="removeImage"
                >
                  <q-icon name="close" />
                </q-badge>
              </div>
              <q-icon
                v-else
                @click="$refs.pet_image.click()"
                name="add"
                size="lg"
                color="white"
                class="bg-grey-300 roundedImage q-pa-xl cursor-pointer"
              />
              <input
                type="file"
                style="display: none"
                ref="pet_image"
                accept="image/*"
                @change="onFilePicked($event, 'pet_image')"
              />
            </div>
            <div class="col q-mb-md">
              <div class="row q-col-gutter-md items-center q-mb-md">
                <div class="col-3">
                  <MtInputForm
                    type="text"
                    :disable="isEdit"
                    v-model="data.code_pet"
                    label="ペットCD"
                    :required="!isEdit"
                    :rules="!isEdit ? [aahValidations.validationRequired] : []"
                  />
                </div>
                <div class="col-3">
                  <MtInputForm
                    type="text"
                    v-model="data.code_pet_ex"
                    label="外部ペットCD"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md items-center q-mb-md">
                <div class="col-3">
                  <MtInputForm
                    type="text"
                    v-model="data.name_pet"
                    :isKatakana="false"
                    label="ペット名 *"
                    autofocus
                    tabindex="1"
                    required
                    :rules="[aahValidations.validationRequired]"
                  />
                </div>
                <div class="col-3">
                  <MtInputForm
                    type="text"
                    v-model="data.name_kana_pet"
                    label="カナ名 *"
                    tabindex="2"
                    required
                    :rules="[aahValidations.validationRequired]"
                  />
                </div>
                <!-- <div class="col-3">
                  <MtInputForm
                    type="text"
                    v-model="data.name_pet_customer_updated"
                    label="オーナーペット名"
                    disable
                  />
                </div> -->
              </div>
              <div class="row q-col-gutter-md items-center q-mb-md q-pt-md">
                <div class="col-auto">性別 :</div>
                <div class="col-auto">
                  <MtInputForm
                    type="radio"
                    class="pet-gender q-mr-sm"
                    v-model="data.type_pet_gender"
                    :items="typePetGender"
                    tabindex="3"
                    required
                    :rules="[aahValidations.validationRequired]"
                    @update:model-value="updatePetTitle"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md items-center">
                <div class="col-auto">敬称 * :</div>
                <div class="col-auto">
                  <MtInputForm
                    type="radio"
                    class="q-mr-sm"
                    v-model="data.type_title_pet_customer_updated"
                    :items="typeTitlePetCustomerUpdated"
                    tabindex="4"
                    required
                    :rules="[aahValidations.validationRequired]"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormPullDown
                v-model:options="commonTypeAnimalOptionList"
                v-model:selected="data.id_cm_animal"
                label="動物種別 *"
                tabindex="5"
                required
                custom-option
                @update:selected="selectingBreed($event, true)"
              >
                <template #selectedItem="{ slotProps }">
                  <q-item-label>
                    {{ slotProps.opt.label }}
                  </q-item-label>
                </template>
                <template #option="{ slotProps }">
                  <q-item v-bind="slotProps.itemProps">
                    <q-item-section>
                      <div class="flex items-center gap-4">
                        {{ slotProps.opt.label }}
                        <q-icon
                          v-if="slotProps.opt.text1"
                          name="circle"
                          size="16px"
                          :color="slotProps.opt.text1"
                          :style="{ color: slotProps.opt.text1 }"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </template>
              </MtFormPullDown>
            </div>
            <div v-if="isBreed" class="col-3">
              <MtFilterSelect
                :options-default="selectedBreedsDefault"
                v-model:options="selectedBreeds"
                v-model:selecting="data.id_cm_breed"
                label="品種名"
                tabindex="6"
              />
            </div>
            <div class="col-3">
              <MtFilterSelect
                :options-default="hairColorListDefault"
                v-model:options="hairColorList"
                v-model:selecting="data.id_cm_hair"
                label="毛色"
                tabindex="7"
              />
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                type="date"
                v-model:date="data.date_birth"
                label="生年月日"
                @update:date="updateBirthDate"
                tabindex="10"
              />
            </div>
            <div
              v-if="!data.flg_pet_excluded && !data.flg_deceased"
              class="col flex items-center"
            >
              <MtFormCheckBox
                label="推定誕生日"
                v-model:checked="data.flg_unknown_dob"
              />
              <div class="q-ml-lg">{{ petBirthDuration }}</div>
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormPullDown
                v-model:selected="data.type_blood"
                v-model:options="typeBlood"
                label="血液型"
                tabindex="11"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                label="供血可能"
                v-model:checked="data.flg_transfusion_ok"
              />
            </div>
            <div class="col-6" v-if="data.flg_transfusion_ok">
              <MtInputForm
                type="text"
                v-model="data.memo_transfusion"
                label="輸血/供血メモ"
                autogrow
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                label="アレルギー有り"
                v-model:checked="data.flg_allergy"
                class="field-label-free-color"
                :class="{
                  'bg-negative text-white': data.flg_allergy,
                  'allergy-unchecked': !data.flg_allergy
                }"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                label="副作用有り"
                v-model:checked="data.flg_sideeffect"
                class="field-label-free-color"
                :class="{
                  'bg-negative text-white': data.flg_sideeffect,
                  'sideeffect-unchecked': !data.flg_sideeffect
                }"
              />
            </div>
          </div>
          <hr class="light q-mb-sm" />
          <div class="row q-col-gutter-md items-center q-mb-md q-py-md">
            <div class="col-auto">性格：</div>
            <div class="col flex">
              <div
                v-for="(
                  checkbox, index
                ) in getCliCommonTypePetNatureList.filter((data) => {
                  return dayjs(data.date_end).isSame(dayjs('9999/12/31'))
                })"
                :key="`${index}-${checkbox.id_cli_common}`"
                class="flex items-center"
                :style="{ opacity: flg_type_alert_ui[index] ? 1 : 0.8 }"
              >
                <q-btn
                  class="text-grey-900 relative-position"
                  :class="[`bg-${checkbox.text1}`]"
                  :style="{
                    'background-color': checkbox.text1,
                    width: '20px',
                    height: '20px'
                  }"
                  rounded
                  size="small"
                >
                  <MtFormCheckBox
                    v-model:checked="flg_type_alert_ui[index]"
                    @update:checked="
                      (value) => checkedTypeAlertFlg(value, index)
                    "
                    class="absolute pet-alert-checkbox"
                  />
                  <q-icon v-if="flg_type_alert_ui[index]" name="done" />
                </q-btn>
                <span class="q-ml-sm q-mr-lg">{{ checkbox.label }}</span>
              </div>
            </div>
          </div>
          <div class="row q-col-gutter-md items-center q-mb-md">
            <div class="col-6">
              <MtInputForm
                type="text"
                v-model="data.memo_pet"
                label="基本メモ"
                autogrow
                tabindex="21"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                type="text"
                v-model="data.memo_pet_info"
                label="特記事項"
                autogrow
                tabindex="22"
              />
            </div>
          </div>
          <div class="row q-mb-md" v-if="isEdit">
            <div class="col-6">
              <MtInputForm
                type="text"
                v-model="data.memo_pet_by_customer"
                label="オーナーのペットメモ"
                autogrow
                readonly
                class="bg-pink-100"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-md">
            <div class="col-3">
              <InputEmployeeOptGroup
                v-model:selected="data.id_employee_main_doctor"
                type-occupation="doctor"
                label="デフォルト 主治医"
                show-select-default-employee
                @update:select-default-employee="
                  selectDefaultEmployee('id_employee_main_doctor')
                "
                tabindex="25"
              />
            </div>
            <div class="col-3">
              <InputEmployeeOptGroup
                v-model:selected="data.id_employee_main"
                label="デフォルト 主担当者"
                show-select-default-employee
                @update:select-default-employee="
                  selectDefaultEmployee('id_employee_main')
                "
                tabindex="26"
              />
            </div>
          </div>
          <div v-if="showDogFields" class="row q-col-gutter-md q-my-md">
            <div class="col-3">
              <MtFormPullDown
                v-model:selected="data.code_city_hall"
                label="保健所名/CD"
                tabindex="30"
                :options="
                  useCliCommonStore().getCliCommonPublicHealthCenterList.map(
                    (v) => ({
                      label: v?.code_func1 + ' ' + v?.name_cli_common,
                      value: v?.code_func1 + ' ' + v?.name_cli_common
                    })
                  )
                "
              />
            </div>
            <div class="col-3">
              <MtFormInputDate
                v-model:date="data.datetime_licensed"
                label="鑑札登録日"
                tabindex="31"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                type="text"
                v-model="data.license_id"
                label="鑑札番号"
                tabindex="32"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                type="text"
                v-model="data.name_registered"
                label="鑑札登録者"
                tabindex="33"
              />
            </div>
          </div>
          <ComponentFormAddress
            v-if="data.name_registered"
            :form-data="data"
          />
          <div class="row items-center q-col-gutter-md q-my-md">
            <div class="col-3">
              <MtFormCheckBox
                label="マイクロチップ"
                v-model:checked="data.flg_microchip"
                @click="blankField(['microchip_id'])"
                tabindex="40"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-if="data.flg_microchip"
                type="text"
                v-model="data.microchip_id"
                label="マイクロチップ登録番号"
                tabindex="41"
              />
            </div>
            <!-- WORK HERE  -->
            <div class="col-3">
              <MtInputForm
                v-if="data.flg_microchip"
                type="text"
                v-model="data.microchip_place"
                label="マイクロチップ挿入部位"
                tabindex="42"
              >
                <template v-slot:append>
                  <q-btn flat dense>
                    <q-icon
                      name="add"
                      unelevated
                      @click="addMicrochipPlaceModal = true"
                    />
                  </q-btn>
                </template>
              </MtInputForm>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="data.date_register"
                label="カルテ作成日時"
                tabindex="43"
                dense
                type="date"
              />
            </div>
            <div class="col-3" v-if="isEdit">
              <MtFormInputDate
                type="date"
                v-model:date="data.date_last_visit"
                label="最終来院日時"
                tabindex="44"
              />
            </div>
            <div class="col-3" v-if="isEdit">
              <q-btn color="primary" @click="toTodaysDate()">
                <q-icon name="arrow_left" />
                今日
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormPullDown
                type="selection"
                v-model="data.type_disc_rate"
                :options="discountRateList"
                label="デフォルト割引率"
                tabindex="45"
              />
            </div>
          </div>
          <hr class="light q-mb-sm" />
          <div class="q-mt-lg q-mb-md">
            <h4 class="text-white bg-grey-600 title4">最終予防歴</h4>
            <span class="caption1 regular text-grey-700 q-my-md">
              リクエスト画面表示の最終予防歴
            </span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3" v-if="isEdit">
              <MtFormInputDate
                type="date"
                v-model:date="data.date_last_type_prev_4"
                label="混合ワクチン 最終日"
                tabindex="51"
              />
            </div>
            <div class="col-3" v-if="isEdit">
              <MtFormInputDate
                type="date"
                v-model:date="data.date_last_type_prev_2"
                label="ノミダニ 最終日"
                tabindex="52"
              />
            </div>
            <div class="col-3">
              <MtFormInputDate
                v-model:date="data.date_last_type_prev_3"
                label="フィラリア 最終日"
                tabindex="53"
                dense
                type="date"
              />
            </div>
            <div class="col-3">
              <MtFormInputDate
                v-model:date="data.date_last_type_prev_1"
                label="狂犬病 最終日"
                tabindex="54"
                dense
                type="date"
              />
            </div>
            <div class="col-3" v-if="isEdit">
              <MtFormInputDate
                type="date"
                v-model:date="data.date_last_type_prev_5"
                label="健診 最終日"
                tabindex="55"
              />
            </div>
          </div>
          <hr class="light q-mb-sm" />
          <div class="row q-col-gutter-xs q-mb-lg">
            <div class="col-3">
              <MtInputForm
                type="text"
                v-model="data.display_order"
                label="表示順序（0~999; 小を上位表示）"
                tabindex="60"
              />
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="tab2">
          <div class="row q-mb-md">
            <div v-if="!isEdit">初回保存後にペット保険を追加できます。</div>
            <div v-else class="col-4">
              <MtFormCheckBox
                label="ペット保険"
                v-model:checked="data.flg_insurance_plan"
                @update:checked="
                  blankField([
                    'code_insurance',
                    'date_insurance_start',
                    'date_insurance_end',
                    'memo_insurance'
                  ])
                "
              />
            </div>
          </div>
          <div v-if="data.flg_insurance_plan">
            <div class="flex items-center justify-between q-mt-lg">
              <div class="body2 bold text-grey-900">ペット保険</div>
              <q-btn color="primary" @click="openPetInsuaranceModal">
                <q-icon name="add" />
                保険
              </q-btn>
            </div>

            <MtTable2
              :columns="petInsuranceColumns"
              :rows="getPetInsurances"
              :rowsBg="true"
              flat
              no-data-message="登録がありません。"
              no-result-message="該当のデータが見つかりませんでした"
            >
              <template v-slot:row="{ row }">
                <td
                  v-for="(col, index) in petInsuranceColumns"
                  @click="onRowPetInsuranceClick(row)"
                  class="cursor-pointer"
                >
                  <div v-if="col.field === 'id_cm_insurer'">
                    {{ getInsurerName(row.id_cm_insurer) }}
                  </div>
                  <div v-else-if="col.field === 'id_insurance_plan'">
                    {{ getInsurancePlanName(row.id_insurance_plan) }}
                  </div>
                  <div v-else-if="col.field === 'code_insurance'">
                    {{ row.code_insurance }}
                  </div>
                  <div v-else-if="col.field === 'date_insurance'">
                    {{ row.date_insurance_start }} ~
                    {{ row.date_insurance_end }}
                  </div>
                  <div v-else-if="col.field === 'count_hospital_visit'">
                    {{ row.count_hospital_visit }}
                  </div>
                  <div v-else-if="col.field === 'count_inpatient_stay'">
                    {{ row.count_inpatient_stay }}
                  </div>
                  <div v-else-if="col.field === 'count_surgery'">
                    {{ row.count_surgery }}
                  </div>
                </td>
              </template>
            </MtTable2>
          </div>
        </q-tab-panel>
        <q-tab-panel name="tab3">
          <div class="items-center q-col-gutter-md q-mb-md">
            <div class="col-12">
              <MtFormCheckBox
                label="DM対象に含める"
                v-model:checked="data.flg_dm"
              />
            </div>
          </div>
          <hr class="light q-mb-sm" />
          <div
            class="row items-center q-col-gutter-md exclude-data q-mb-md"
            v-if="isEdit"
          >
            <div class="col-12">
              <MtFormCheckBox
                label="システム除外"
                v-model:checked="data.flg_unlist"
                @update:checked="onUpdateFlgUnlist"
              />
              <span class="caption1 text-grey-600 q-ml-md">
                ✔ : システム内の検索から除外
              </span>
            </div>
            <div v-if="isEdit && data.flg_unlist" class="col-12">
              <div>
                <MtFormCheckBox
                  label="亡くなりました"
                  v-model:checked="data.flg_deceased"
                  @update:checked="onUpdateFlgDeceased"
                />
              </div>
              <div
                v-if="data.flg_deceased"
                class="row items-center q-col-gutter-md q-mt-xs q-mb-md"
              >
                <div class="col-3">
                  <MtFormInputDate
                    v-model:date="data.datetime_deceased"
                    label="死亡日"
                  />
                </div>
                <div v-if="data.flg_deceased" class="col-3">
                  <MtFormCheckBox
                    label="花送付"
                    v-model:checked="data.flg_send_flower"
                    @update:checked="onUpdateFlgSendFlower"
                  />
                </div>
                <div v-if="data.flg_send_flower" class="col-3">
                  <MtFormInputDate
                    v-model:date="data.date_send_flower"
                    label="花送付日"
                  />
                </div>
              </div>
              <div
                v-if="data.flg_deceased && data.flg_send_flower"
                class="col-12 q-mt-md"
              >
                <MtInputForm
                  type="text"
                  v-model="data.memo_send_flower"
                  label="花送付メモ"
                  autogrow
                />
              </div>
            </div>
            <div class="col-3 q-my-md" v-if="data.flg_unlist">
              <MtFormCheckBox
                label="その他除外"
                v-model:checked="data.flg_pet_excluded"
                @update:checked="onUpdateFlgExcluded"
              />
            </div>
            <div class="col-3 q-my-md" v-if="data.flg_pet_excluded">
              <MtFormInputText
                v-model="data.memo_excluded"
                class="q-pa-none q-mr-xs"
                label="その他除外理由"
              >
                <template v-slot:append>
                  <q-btn flat dense>
                    <q-icon
                      name="add"
                      unelevated
                      @click="addExcludeReasonModal = true"
                    />
                  </q-btn>
                </template>
              </MtFormInputText>
            </div>
            <div class="col-3" v-if="data.flg_pet_excluded">
              <MtFormInputDate
                v-model:date="data.date_excluded"
                label="その他除外日"
              />
            </div>
          </div>

          <div v-if="data.flg_send_flower" class="row q-mb-md"></div>
          <hr v-if="data.flg_deceased" class="light q-mb-sm" />
          <div class="row items-center q-mb-md">
            <!-- <div class="col-3">
              <MtInputForm
                type="text"
                v-model="data.status_pet"
                label="記録ステータス"
              />
            </div> -->
            <div v-if="isEdit" class="col-3">
              <MtFormCheckBox
                label="オーナーによる除外"
                v-model:checked="data.flg_delete_by_customer"
                disable
              />
            </div>
          </div>
          <div
            v-if="isEdit"
            class="row items-center q-col-gutter-md q-mb-md"
          ></div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" color="primary" tabindex="100" :loading="isLoading" :disable="isLoading" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addExcludeReasonModal"
    modelTitle="除外理由"
    :options="excludeReasons"
    :data="data"
    :single-option="true"
    @update:memo="handleUpdateExcludeReason"
  />
  <AddTextTemplateModal
    v-model:value="addMicrochipPlaceModal"
    modelTitle="挿入部位を選択"
    :options="insertedBodyPart"
    :data="data"
    :single-option="true"
    @update:memo="handleInsertBodyPart"
  />
</template>

<style lang="scss" scoped>
.badge-position {
  margin-bottom: -50px !important;
}
.pet-alert-checkbox {
  width: 100%;
  height: 100%;
  z-index: 999;
  opacity: 0;
}
.allergy-unchecked, .sideeffect-unchecked {
  background-color: #ffdce1; /* Light pink */
  color: black; /* Optional: Change text color */
}

</style>
