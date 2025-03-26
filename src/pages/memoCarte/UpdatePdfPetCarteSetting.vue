<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { storeToRefs } from 'pinia'
// stores
import useClinicStore from '@/stores/clinics'
import useMemoCarteStore from '@/stores/memo-cartes'
import useCliCommonStore from '@/stores/cli-common'
import usePetBioStore from '@/stores/pet-bios'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '@/stores/common'
import useEmployeeStore from '@/stores/employees'
import useIllnessHistoryStore from '@/stores/illness-history'

import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

import { PetPdfCarteHeaderType } from './memoCarteUtils'
import { Common, CliCommon, MemoCarteType, CarteGroup, IllnessHistoryType, PetBioInfoType } from '@/types/types'
import { concatenate, getCurrentPetAge, getDateTimeNow } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { typePetGender } from '@/utils/enum'

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

import GetPdfPetCarteVer1 from '@/pages/memoCarte/GetPdfPetCarteVer1.vue'

interface Props {
  generatePdfAndClose?: boolean,
  dateInsert?: string,
  datetimeInsert?: string
  mode?: 'download' | 'print',
  flgPinnedCarte?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  generatePdfAndClose: false
})

const clinicStore = useClinicStore()
const memoCarteStore = useMemoCarteStore()
const cliCommonStore = useCliCommonStore()
const petBioStore = usePetBioStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const employeeStore = useEmployeeStore()
const illnessHistoryStore = useIllnessHistoryStore()
const { getFilteredMemoCartesV1, getMemoCartePinnedGroupByDate } = storeToRefs(memoCarteStore)
const { getCliCommonTypeCarteSourceList } =
  storeToRefs(cliCommonStore)
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList, getCommonPetHairColorOptionList } = storeToRefs(commonStore)
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)

const dateRangeStart = ref(dayjs().subtract(2, 'month').format('YYYY/MM/DD')), 
  dateRangeEnd = ref(getDateTimeNow())

const formData = reactive<PetPdfCarteHeaderType>({
  clinicInfo: {
    name: { label: '病院名', show: true },
    address: { label: '所在地', show: true },
    phone: { label: 'TEL', show: true },
  },
  customerInfo: {
    name: { label: '氏名', show: true },
    addressMain: { label: '住所', show: true },
    phoneMain: { label: '電話番号', show: true },
    email: { label: 'メールアドレス', show: true },
  },
  petInfo: {
    name: { label: '名前', show: true },
    otherInfo: { label: '動物種/品種', show: true },
    gender: { label: '性別', show: true },
    DOB: { label: '誕生日', show: true },
    doctor: { label: '担当医', show: true}
  },
  petBioInfo: {
    info: { label: '生体情報', show: true, type: 'textarea', class: 'petinfo-field' }
  }
})

const pdfConfiguration:Record<string, boolean> = reactive({
  showCustomerInfo: true,
  showPetInfo: true,
  showClinicalFiles: true,
  showPetBioInfo: true
})

const smallMemoCarteDisplay = reactive({
  ParentCarte:  { label: 'メモカルテ', show: true }
})

const largeMemoCarteDisplay = reactive({
  ParentCarte:  { label: '診療カルテ', show: true }
})

getCliCommonTypeCarteSourceList.value.forEach((v: CliCommon) => {
  if(v && v.id_cli_common) {
    smallMemoCarteDisplay[v.id_cli_common] = { label: v.name_cli_common, show: true }
    largeMemoCarteDisplay[v.id_cli_common] = { label: v.name_cli_common, show: true }
  }
})

const getTypeAnimal = (id_cm_animal: number) => getCommonTypeAnimalOptionList.value.find((v: Common) => v.id_common == id_cm_animal)?.name_common
const getBreed = (id_cm_breed: number) => getCommonBreedOptionList.value.find((v: Common) => v.id_common == id_cm_breed)?.name_common
const getHair = (id_cm_hair: number) => getCommonPetHairColorOptionList.value.find((v: Common) => v.id_common == id_cm_hair)?.name_common
const getPetGender = (petGenderType: number) => typePetGender.find((v) => v.value === petGenderType)?.label
const getTypeCarteLabel = (idCliCommon: number) => getCliCommonTypeCarteSourceList.value.find((v: CliCommon) => v.id_cli_common === idCliCommon)?.name_cli_common
const getPetIllnessHistoryNames = (illnessHistoryIds: number[]) => {
  return illnessHistoryIds.map((id: number) => {
    let illnessHistory = getIllnessHistorys.value.find((v: IllnessHistoryType) => v.id_pet_illness_history === id)
    return illnessHistory?.name_disease ?? illnessHistory?.name_disease_free ?? ''
  }).join(', ')
}


const generatePdf = async (mode:string = 'download' | 'print' | 'viewhtml') => {

  const validTypesForSmallCarte = new Set(Object.keys(smallMemoCarteDisplay).filter((key) => key !== 'ParentCarte' && !!smallMemoCarteDisplay[key].show))
  const validTypesForLargeCarte = new Set(Object.keys(largeMemoCarteDisplay).filter((key) => key !== 'ParentCarte' && !!largeMemoCarteDisplay[key].show))

  const filteredCartes = {}
  for(let key in getFilteredMemoCartesV1.value) {
    const isDateInRange:boolean = dayjs(key).isBetween(dateRangeStart.value, dateRangeEnd.value, 'day', '[]')
    if(isDateInRange) {
      filteredCartes[key] = JSON.parse(JSON.stringify(getFilteredMemoCartesV1.value[key]))
    }
  }

  Object.keys(filteredCartes).forEach((dateInsert: string) => {
    Object.keys(filteredCartes[dateInsert].others).forEach((datetimeInsert: string) => {
      if(!smallMemoCarteDisplay.ParentCarte.show && !filteredCartes[dateInsert].others[datetimeInsert].grouped_cartes) {
        delete filteredCartes[dateInsert].others[datetimeInsert]
      }
      else {
        const datetimeRecord:CarteGroup = filteredCartes[dateInsert].others[datetimeInsert]
        if(datetimeRecord && datetimeRecord.memo_carte_list && datetimeRecord.memo_carte_list.length > 0) {
          filteredCartes[dateInsert].others[datetimeInsert].memo_carte_list = 
          filteredCartes[dateInsert].others[datetimeInsert].memo_carte_list.filter((memoCarte: MemoCarteType) => validTypesForSmallCarte.has(memoCarte.id_cli_common.toString()))
        }  
      }

      if(!largeMemoCarteDisplay.ParentCarte.show && filteredCartes[dateInsert].others[datetimeInsert].grouped_cartes) {
        delete filteredCartes[dateInsert].others[datetimeInsert]
      }
      else {
        const datetimeRecord:CarteGroup = filteredCartes[dateInsert].others[datetimeInsert]
        if(datetimeRecord && datetimeRecord.memo_carte_list && datetimeRecord.memo_carte_list.length > 0) {
          filteredCartes[dateInsert].others[datetimeInsert].memo_carte_list = 
            filteredCartes[dateInsert].others[datetimeInsert].memo_carte_list.filter((memoCarte: MemoCarteType) => validTypesForLargeCarte.has(memoCarte.id_cli_common.toString()))
        }
      }
    })
  })

  await mtUtils.pdfRender(GetPdfPetCarteVer1, {
    memoCarteData: filteredCartes,
    headerData: formData,
    pdfConfiguration,
    currentCustomer: customerStore.getCustomer,
    currentPet: customerStore.getPet,
    getTypeCarteLabel,
    getPetIllnessHistoryNames,
    getPetValWeight,
    getTypeAnimal,
    getBreed,
    getPetGender,
    mode
  })
}

const getPetValWeight = (petBioInfo: PetBioInfoType) => {
  if(petBioInfo.type_body_weight == 1 && petBioInfo.val_weight) {
    return `${parseInt(petBioInfo.val_weight) / 1000} kg`
  }
  return `${petBioInfo.val_weight} g`
}

onMounted(async () => {

  //mapped default clinic data
  const clinic = clinicStore.getClinic
  if(clinic) {
    formData.clinicInfo.name.value = clinic.name_clinic_display
    formData.clinicInfo.address.value = concatenate(clinic.address_city, clinic.address_other, clinic.address_prefecture)
    formData.clinicInfo.phone.value = clinic.phone1 || clinic.phone2
  }
  //mapped default customer data
  const customer = customerStore.getCustomer
  if(customer) {
    formData.customerInfo.name.value = concatenate(customer.name_customer_display, customer.code_customer)
    if(customer.address && customer.address.length > 0) {
      const mainAddress = customer.address.find((address) => address.flg_main_address)
      if(mainAddress) {
        formData.customerInfo.addressMain.value = concatenate(mainAddress.address_city, mainAddress.address_prefecture, mainAddress.address_other)
      }
    }

    if(customer.customer_tel && customer.customer_tel.length > 0) {
      const mainTel = customer.customer_tel.find((tel) => tel.flg_main_tel)
      if(mainTel) {
        formData.customerInfo.phoneMain.value = mainTel.tel_full
      }
      else {
        const customerTel = [...customer.customer_tel]
        const customerTelByDate = customerTel.sort((a, b) => {
          const dateA = new Date(a.datetime_insert)
          const dateB = new Date(b.datetime_insert)
          return dateA - dateB
        })
        formData.customerInfo.phoneMain.value = customerTelByDate.slice(0, 2).map((v) => v.tel_full).join(',')
        console.log(formData.customerInfo.phoneMain.value)
      }
    }

    formData.customerInfo.email.value = customer.email1 || customer.email2
  }
  //mapped default pet data
  const pet = customerStore.getPet
  if(pet) {
    formData.petInfo.name.value = concatenate(pet.name_pet, pet.name_kana_pet)
    formData.petInfo.otherInfo.value = concatenate(getTypeAnimal(pet.id_cm_animal), getBreed(pet.id_cm_breed), getHair(pet.id_cm_hair))
    formData.petInfo.gender.value = getPetGender(pet.type_pet_gender)
    formData.petInfo.DOB.value = `${pet.date_birth} (${getCurrentPetAge(pet)})`
    const petDoctorId = pet.id_employee_main_doctor || pet.id_employee_doctor || customer.id_employee_doctor
    if(petDoctorId){
      const employee = employeeStore.getAllEmployees.find((employee) => employee.value == petDoctorId)
      if(employee) formData.petInfo.doctor.value = concatenate(employee.nameFamily, employee.nameFirst)
    }
    else formData.petInfo.doctor.show = false
  }

  let latestPetBioData = '', totalRecords = 0 // latest 3 records
  const cartesData = getFilteredMemoCartesV1.value
  outerLoop: for(const dateInsert in cartesData){
    for(const datetimeInsert in cartesData[dateInsert].others){
      const datetimeRecord:CarteGroup = cartesData[dateInsert].others[datetimeInsert]
      if(datetimeRecord.grouped_cartes && datetimeRecord.pet_bio && Object.keys(datetimeRecord.pet_bio).length > 0) {
        if(totalRecords === 3) break outerLoop
        const petInfo = datetimeRecord.pet_bio

        const dataParts = []
        if (petInfo.val_weight) dataParts.push(`体重 ${getPetValWeight(petInfo)}`);
        if (petInfo.val_temperature) dataParts.push(`体温 T: ${petInfo.val_temperature}`)
        if (petInfo.val_heartbeat_rate) dataParts.push(`心拍 P: ${petInfo.val_heartbeat_rate}`)
        if (petInfo.val_respiration_rate) dataParts.push(`呼吸数 R: ${petInfo.val_respiration_rate}`)

        if(dataParts.length > 0) {
          latestPetBioData += (latestPetBioData ? '\n' : '') + `${dataParts.join(' / ')}`
          latestPetBioData += `\t(${dayjs(petInfo.datetime_measure).format('YYYY/MM/DD hh:mm')})`
          ++totalRecords
        }
      }
    }
  }

  formData.petBioInfo.info.value = latestPetBioData


  if (getIllnessHistorys.value.length === 0) {
    await illnessHistoryStore.fetchIllnessHistorys({
      id_pet: pet?.id_pet,
      id_customer: customer?.id_customer
    })
  }

  if(props.generatePdfAndClose) {
    const { dateInsert, datetimeInsert } = props
    if(!dateInsert || !datetimeInsert) {
      close()
      throw new Error('Needed date insert and and datetime insert')
    }
    const filteredCartesByDate = JSON.parse(JSON.stringify(props?.flgPinnedCarte ? getMemoCartePinnedGroupByDate.value[dateInsert] : getFilteredMemoCartesV1.value[dateInsert]))
    const filteredCartesByDatetime = Object.keys(filteredCartesByDate.others).reduce((acc, curr) => {
      if(curr === datetimeInsert) {
        acc[curr] = filteredCartesByDate.others[curr]
      }
      return acc
    }, {})
    filteredCartesByDate.others = filteredCartesByDatetime

    const filteredCartes = {}
    filteredCartes[dateInsert] = filteredCartesByDate
    
    mtUtils.pdfRender(GetPdfPetCarteVer1, {
      memoCarteData: filteredCartes,
      headerData: formData,
      pdfConfiguration,
      currentCustomer: customerStore.getCustomer,
      currentPet: customerStore.getPet,
      getTypeCarteLabel,
      getPetIllnessHistoryNames,
      getPetValWeight,
      getTypeAnimal,
      getBreed,
      getPetGender,
      mode: props.mode || 'download'
    })

    closeModal()
  }
})

</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold row items-center">
      診療情報提供書 出力内容の設定
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <!-- まとめてフレックスの中に入れる -->
    <div class="bg-grey-100 q-mb-md q-pa-md">①出力対象の基礎データをチェックします。</div> 
    <div class="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
      <template v-for="(key, idx) in Object.keys(formData)" :key="idx">
        <template v-for="(field, index) in Object.keys(formData[key])" :key="index">
          <!-- 個々の要素はラップ用のdivに入れる -->
          <div class="flex items-center q-pa-md" :class="formData[key][field].class">
            <MtFormCheckBox v-model:checked="formData[key][field].show" />
            <MtInputForm
              v-if="formData[key][field].type === 'textarea'"
              v-model="formData[key][field].value"
              :label="formData[key][field].label"
              type="textarea"
              :disable="!(formData[key][field].show)"
            />
            <MtFormInputText
              v-else
              v-model="formData[key][field].value"
              :label="formData[key][field].label"
              :disable="!(formData[key][field].show)"
            />
          </div>
          <div></div>
        </template>
      </template>
    </div>
    <div class="flex flex-row flex-wrap items-center gap-x-4 gap-y-2">
      <div class="flex items-center q-pa-md"><MtFormCheckBox label="オーナー情報" v-model:checked="pdfConfiguration.showCustomerInfo" /></div>
      <div class="flex items-center q-pa-md"><MtFormCheckBox label="ペット情報" v-model:checked="pdfConfiguration.showPetInfo" /></div>
      <div class="flex items-center q-pa-md"><MtFormCheckBox label="ペットの最新生体情報（3つ）" v-model:checked="pdfConfiguration.showPetBioInfo" /></div>
      <div class="flex items-center q-pa-md"><MtFormCheckBox label="資料（画像）" v-model:checked="pdfConfiguration.showClinicalFiles" /></div>
    </div>
    <div class="bg-grey-100 q-mb-md q-pa-md">②出力期間を選択します。</div> 
      <div class="q-mt-md flex items-center gap-6">
        出力期間  
        <MtFormInputDate
          label="日付： Start"
          v-model:date="dateRangeStart"
          @update:date="(val) => dateRangeEnd = val"
        />   
        <MtFormInputDate
          label="日付： End"
          v-model:date="dateRangeEnd"
        />
      </div>
    <div class="bg-grey-100 q-my-md q-pa-md">③カルテ区分を選択します。</div> 
    <div class="q-mt-lg">
      <div class="q-my-sm">
        <MtFormCheckBox 
          :label="smallMemoCarteDisplay.ParentCarte.label"
          v-model:checked="smallMemoCarteDisplay.ParentCarte.show"
          class="carte-parent-checkbox"
        />
      </div>
      <template 
        v-for="carte in Object.keys(smallMemoCarteDisplay).filter((key) => key !== 'ParentCarte')"
        v-if="smallMemoCarteDisplay.ParentCarte.show"
      >
        <MtFormCheckBox 
          :label="smallMemoCarteDisplay[carte].label"
          v-model:checked="smallMemoCarteDisplay[carte].show"
        />
      </template>
    </div>
    <div class="q-mt-lg">
      <div class="q-my-sm">
        <MtFormCheckBox 
          :label="largeMemoCarteDisplay.ParentCarte.label"
          v-model:checked="largeMemoCarteDisplay.ParentCarte.show"
          class="carte-parent-checkbox"
        />
      </div>
      <template 
        v-for="carte in Object.keys(largeMemoCarteDisplay).filter((key) => key !== 'ParentCarte')"
        v-if="largeMemoCarteDisplay.ParentCarte.show"
      >
        <MtFormCheckBox 
          :label="largeMemoCarteDisplay[carte].label"
          v-model:checked="largeMemoCarteDisplay[carte].show"
        />
      </template>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn
        outline
        class="bg-grey-100 text-grey-800"
        @click="closeModal"
      >
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="generatePdf('viewhtml')">
        <span>Webページ </span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="generatePdf('print')">
        <span>印刷</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="generatePdf('download')">
        <span>PDF出力</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
<style lang="scss" scoped>
.carte-parent-checkbox {
  :deep(.q-checkbox__label) {
    font-size: 16px;
  }
}
.petinfo-field {
  width: 100%;
  :deep(.q-field) {
    width: 100%;
  }
}  
</style>