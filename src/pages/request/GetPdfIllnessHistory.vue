<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useClinicStore from '@/stores/clinics'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import usePetStore from '@/stores/pets'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCommonStore from '@/stores/common'
import { concatenate, getCustomerName, getDateToday, getCurrentPetAge } from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import { typePetGender } from '@/utils/enum'

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const clinicStore = useClinicStore()
const employeeStore = useEmployeeStore()
const { getEmployees } = storeToRefs(employeeStore)
const customerStore = useCustomerStore()
const { getAllCustomers, getCustomer } = storeToRefs(customerStore)
const petStores = usePetStore()
const { getPet } = storeToRefs(petStores)
const illnessHistoryStore = useIllnessHistoryStore()
const { getIllnessHistory } = storeToRefs(illnessHistoryStore)
const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList } = storeToRefs(commonStore)

const clinicData = reactive({})

const data = reactive({
  date : {checked: true, value: getDateToday(), label: '紹介日', flgDate: true},
  title : {checked: true, value: '(診療情報提供書)', label: '紹介状'},
  uiField1 : {checked: true, value: '', label: '紹介先医療機関'},
  uiField2 : {checked: true, value: '', label: '担当医師'},
  clinic_name : {checked: true, value: '', label: '紹介元医療機関'},
  clinic_detail : {checked: true, value: '', label: '所在地'},
  clinic_phone : {checked: true, value: '', label: 'TEL'},
  employee_detail : {checked: true, value: '', label: '担当医'},
  customer_detail : {checked: true, value: '', label: '氏名'},
  customer_address_detail : {checked: true, value: '', label: '住所'},
  customer_phone : {checked: true, value: '', label: '電話番号'},
  customer_mail : {checked: true, value: '', label: 'メールアドレス'},
  pet_name : {checked: true, value: '', label: '名前'},
  pet_animal_breed : {checked: true, value: '', label: '動物種/品種'},
  pet_type_ope_gender : {checked: true, value: '', label: '性別'},
  pet_datebirth : {checked: true, value: '', label: '誕生日'},
  pet_name_disease : {checked: true, value: '', label: '傷病名'},
  uiField3 : {checked: true, value: '', label: '紹介目的'},
  uiField4 : {checked: true, value: '', label: '既往歴'},
  illness_history_detail : {checked: true, value: '', label: '治療経過検査所見'},
  illness_history_pdname : {checked: true, value: '', label: '現在の処方'},
  illness_history_memo_other : {checked: true, value: '', label: '持参資料'},
  number_illness_history : {checked: true, value: '', label: ''},
})

const exportPdf = ref(), rows = ref([])

async function generateReport() {
  await nextTick()
  let imagePDFOptions:any = {quality: 0.1}, jsPDFOptions:any = {}, pagesNumber:Number = 0
  exportPdf.value.generateReport(getPdfName(), pagesNumber, jsPDFOptions, imagePDFOptions)
}

function getPdfName() {
  return `${date.formatDate(Date.now(), 'YYYYMMDD')}_${data.title.value}_${getCustomerName(getCustomer.value)}様`
}

const assignPageData = () => {
  // fill clinic data
  const { name_clinic_display, zip_code, prefecture, address_city, address_other, phone1 } = clinicData
  data.clinic_name.value = name_clinic_display
  data.clinic_detail.value = concatenate(zip_code, prefecture, address_city, address_other)
  data.clinic_phone.value = phone1

  // fill employee data
  let employee:any = getEmployees.value.find((employee: any) => employee.id_employee === getIllnessHistory.value.id_employee_doctor)
  data.employee_detail.value = concatenate(employee?.name_family, employee?.name_first)
  // fill customer data
  const { name_customer_display, email1, address, customer_tel } = getCustomer.value
  data.customer_detail.value = name_customer_display
  if(customer_tel && customer_tel.length && customer_tel.length > 0) {
    let phoneData = customer_tel[0]
    data.customer_phone.value = phoneData?.tel_full
  }
  data.customer_mail.value = email1
  if(address && address.length && address.length > 0) {
    let addressData = address[0]
    data.customer_address_detail.value = concatenate(addressData.zip_code, addressData.address_prefecture, addressData.address_city, addressData.address_other)
  }

  // fill pet data
  let pet:any = getCustomer.value.pets.find((pet: any) => pet.id_pet === getIllnessHistory.value.id_pet)
  data.pet_name.value = pet.name_pet
  data.pet_animal_breed.value = concatenate(getPetTypeAnimal(pet.id_cm_animal), getPetTypeBreed(pet.id_cm_breed))
  data.pet_type_ope_gender.value = concatenate(getPetTypeGender(pet.type_pet_gender))
  data.pet_datebirth.value = getCurrentPetAge(pet)
  // fill ilness history data
  data.pet_name_disease.value = getIllnessHistory.value.name_disease ?? getIllnessHistory.value.name_disease_free
  data.illness_history_detail.value = concatenate(getIllnessHistory.value.memo_inspection, getIllnessHistory.value.memo_diagnosis, getIllnessHistory.value.memo_plan).replace(/\r\n/g, '<br />')
  data.illness_history_memo_other.value = getIllnessHistory.value.memo_other.replace(/\r\n/g, '<br />')
  if(getIllnessHistory.value.prescription_list && getIllnessHistory.value.prescription_list.length > 0) {
    getIllnessHistory.value.prescription_list.forEach((prescriptionHeader: any, idx) => {
      if(prescriptionHeader && prescriptionHeader.prescription_detail_list && prescriptionHeader.prescription_detail_list.length > 0) {
        data.illness_history_pdname.value = concatenate(data.illness_history_pdname.value, prescriptionHeader.prescription_detail_list.reduce((acc: any, prescription: any) => concatenate(acc, prescription.name_prescription_display), ''))
      }
    })
  }
  data.number_illness_history.value = getIllnessHistory.value.number_pet_illness_history
}

const calculatePages = () => {
  let totalLines = pageDataFields().reduce((acc: number, curr: string) => {
  const lines = data[curr].value.split('<br />');
  const lineCounts = lines.reduce((lineAcc, line) => {
    return lineAcc + Math.ceil(line.length / 50);
  }, 0);

  return acc + (lineCounts > 1 ? lineCounts : 1);
}, 0);

let firstPageLines:Number = 28, midPageLines:Number = 30, averageWords:Number = 50
let totalPages = totalLines > 28 ? (Math.ceil(Math.abs((totalLines - firstPageLines)) / midPageLines) + 1) : 1
let fields = [...pageDataFields()], currentField:Number = 0
rows.value = [... new Array(totalPages)].fill().map((_, idx) => {
  let currentLine = 1, obj:Object = {}
  while(currentLine <= getLinesForPage(idx) && currentField < fields.length) {
     let currentLineIndex = data[fields[currentField]].hasOwnProperty('lineIndex') ? data[fields[currentField]]['lineIndex'] : 0
     const lines = data[fields[currentField]].value.split('<br />');
     let linesData = []
     lines.forEach((line, index) => {
       for(let i=0; i< line.length; i+= averageWords) {
         linesData.push(line.substring(i, i + averageWords))
       }
     })
     const lineCountsRow = Math.max(linesData.length, 1)
     if(getLinesForPage(idx) - currentLine < (lineCountsRow - currentLineIndex)) {
      obj[fields[currentField]] = linesData.slice(currentLineIndex, getLinesForPage(idx) - currentLine).join('<br />')
      data[fields[currentField]]['lineIndex'] = currentLineIndex + (getLinesForPage(idx) - currentLine)
     } 
     else {
      obj[fields[currentField]] = data[fields[currentField]].hasOwnProperty('lineIndex') ? linesData.slice(currentLineIndex, getLinesForPage(idx) - currentLine).join('<br />') : data[fields[currentField]].value
      ++currentField
      if(currentField === fields.length) break
     }
     currentLine += data[fields[currentField]].hasOwnProperty('lineIndex') ? (lineCountsRow - currentLineIndex) : 1
  }
  return obj
})
}

const getLinesForPage = (page: Number, firstPageLines: Number = 28, midPageLines: Number = 30) => page > 0 ? midPageLines : firstPageLines
const pageDataFields = () => ['pet_name_disease', 'uiField3', 'uiField4', 'illness_history_detail', 'illness_history_pdname', 'illness_history_memo_other']
const getPetTypeAnimal = (id_cm_animal: string) => getCommonTypeAnimalOptionList.value.find((typeAnimal: any) => typeAnimal.value === id_cm_animal)?.label
const getPetTypeBreed = (id_cm_breed: string) => getCommonBreedOptionList.value.find((typeBreed: any) => typeBreed.value === id_cm_breed)?.label
const getPetTypeGender = (value: any) => typePetGender.find((typeGender: any) => typeGender.value === value)?.label

const generatePdf = async () => {
  calculatePages()
  await nextTick()
  generateReport()
}

onMounted(async () => {
  const clinic = JSON.parse(localStorage.getItem('clinic')) ?? ''
  if(clinic) {
    let res:any = await clinicStore.fetchClinicById(clinic.value)
    for (let key in res) {
      clinicData[key] = res[key]
    }
  }
  if(getCustomer.value?.id_customer) await customerStore.selectCustomer(getCustomer.value.id_customer, true)
  assignPageData()
  calculatePages()
})
</script>

<template>
  <q-form @submit="generatePdf">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="title2 bold text-grey-900">紹介状 出力内容</q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="flex no-wrap items-center ">
        <PdfExport ref="exportPdf" sheetName="lab_result" />
      </div>
      <div class="row">
      <template v-for="(item, index) in data" :key="index">
        <div class="flex items-center col-4">
          <MtFormCheckBox v-model:checked="item.checked" />
          <div class="q-mx-md">{{item.label}}</div>
          <MtFormInputDate v-model:date="item.value" v-if="item.flgDate" />
          <MtInputForm v-model="item.value" type="text" v-else />
        </div>
      </template>
      </div>

      <div class="q-pa-md page-inner-body" v-show="false">
      <q-card id="element-to-print" style="max-width: 1000px; margin: auto" class="bg-white q-pa-none" square>
      <div class="card-pdf-main q-px-md q-pt-md relative-position" :style="{'min-height': idx === 0 ? '1100px' : '1100px'}" v-for="(page, idx) in rows" :key="idx">
        <div class="flex items-center justify-end" v-if="data.date.checked">
          紹介日 {{data.date.value}}
        </div>
        <div class="q-mt-md text-center text-weight-bold" style="font-size: 22px;" v-if="data.title.checked">紹介状 <span style="font-size: 15px">{{data.title.value}}</span></div>
        <q-separator class="q-my-md" size="10px" />
        <template v-if="idx === 0">
          <div class="q-ml-xl">
            <div class="font-12px" v-if="data.uiField1.checked">紹介先医療機関：{{data.uiField1.value}}</div>
            <div class="font-12px" v-if="data.uiField2.checked">担当医師：{{data.uiField2.value}}</div>
            <div class="q-mt-md row">
              <div class="col-5"></div>
              <div class="col-7 bg-grey-300 q-pa-md font-12px">
                <div class="row">
                  <template v-if="data.clinic_name.checked"><div class="col-3">紹介元医療機関：</div><div class="col-9">{{data.clinic_name.value}}</div></template>
                  <template v-if="data.clinic_detail.checked"><div class="col-3">所在地: </div><div class="col-9">{{data.clinic_detail.value}}</div></template>
                  <template v-if="data.clinic_phone.checked"><div class="col-3">TEL: </div><div class="col-9">{{data.clinic_phone.value}}</div></template>
                  <template v-if="data.employee_detail.checked"><div class="col-3">担当医: </div><div class="col-9">{{data.employee_detail.value}}</div></template>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="q-mt-lg row table-cell-custom-border q-pa-sm">
          <div class="col-6 font-12px">
            <div class="text-body1 text-underline">オーナー様情報</div>
              <div class="row">
                <template v-if="data.customer_detail.checked">
                  <div class="col-4 text-right text-weight-bold">氏名：</div>
                  <div class="col-8">{{data.customer_detail.value}}</div>
                </template>
                <template v-if="data.customer_address_detail.checked">
                  <div class="col-4 text-right text-weight-bold">住所：</div>
                  <div class="col-8 ellipsis">{{data.customer_address_detail.value}}</div>
                </template>
                <template v-if="data.customer_phone.checked">
                  <div class="col-4 text-right text-weight-bold">電話番号：</div>
                  <div class="col-8">{{data.customer_phone.value}}</div>
                </template>
                <template v-if="data.customer_mail.checked">
                  <div class="col-4 text-right text-weight-bold">メールアドレス：</div>
                  <div class="col-8">{{data.customer_mail.value}}</div>
                </template>
              </div>
            </div>
            <div class="col-6 font-12px">
              <div class="text-body1 text-underline">患者ペット情報</div>
              <div class="row">
                <template v-if="data.pet_name.checked">
                  <div class="col-4 text-right text-weight-bold">名前：</div>
                  <div class="col-8">{{data.pet_name.value}}</div>
                </template>
                <template v-if="data.pet_animal_breed.checked">
                  <div class="col-4 text-right text-weight-bold">動物種/品種：</div>
                  <div class="col-8 ellipsis">{{data.pet_animal_breed.value}}</div>
                </template>
                <template v-if="data.pet_type_ope_gender.checked">
                  <div class="col-4 text-right text-weight-bold">性別：</div>
                  <div class="col-8">{{data.pet_type_ope_gender.value}}</div>
                </template>
                <template v-if="data.pet_datebirth.checked">
                  <div class="col-4 text-right text-weight-bold">誕生日：</div>
                  <div class="col-8">{{data.pet_datebirth.value}}</div>
                </template>
              </div>
            </div>
          </div>
          <div class="q-mt-lg font-12px">
             <div class="row table-cell-custom-border" v-if="data.pet_name_disease.checked && page.hasOwnProperty('pet_name_disease')">
               <div class="col-2 text-center bg-grey-300 q-pa-sm"><div class="flex items-center text-underline full-height justify-center items-center">傷病名</div></div>
               <div class="col-10 q-pa-sm"><div class="q-ml-md" v-html="page.pet_name_disease" /></div>
             </div>

             <div class="row table-cell-custom-border" :class="Object.keys(page).indexOf('uiField3') !== 0 ? 'border-top-none' : ''" v-if="data.uiField3.checked && page.hasOwnProperty('uiField3')">
               <div class="col-2 text-center bg-grey-300 q-pa-sm"><div class="flex items-center text-underline full-height justify-center items-center">紹介目的</div></div>
               <div class="col-10 q-pa-sm"><div class="q-ml-md" v-html="page.uiField3" /></div>
             </div>

             <div class="row table-cell-custom-border" :class="Object.keys(page).indexOf('uiField4') !== 0 ? 'border-top-none' : ''" v-if="data.uiField4.checked && page.hasOwnProperty('uiField4')">
               <div class="col-2 text-center bg-grey-300 q-pa-sm"><div class="flex items-center text-underline full-height justify-center items-center">既往歴</div></div>
               <div class="col-10 q-pa-sm"><div class="q-ml-md" v-html="page.uiField4" /></div>
             </div>

             <div class="row table-cell-custom-border" :class="Object.keys(page).indexOf('illness_history_detail') !== 0 ? 'border-top-none' : ''" v-if="data.illness_history_detail.checked && page.hasOwnProperty('illness_history_detail')">
               <div class="col-2 text-center bg-grey-300 q-pa-sm"><div class="flex items-center text-underline full-height justify-center items-center">治療経過 <br />検査所見</div></div>
               <div class="col-10 q-pa-sm"><div class="q-ml-md" v-html="page.illness_history_detail" /></div>
             </div>

             <div class="row table-cell-custom-border" :class="Object.keys(page).indexOf('illness_history_pdname') !== 0 ? 'border-top-none' : ''" v-if="data.illness_history_pdname.checked && page.hasOwnProperty('illness_history_pdname')">
               <div class="col-2 text-center bg-grey-300 q-pa-sm"><div class="flex items-center full-height justify-center text-underline items-center">現在の処方</div></div>
               <div class="col-10 q-pa-sm"><div class="q-ml-md" v-html="page.illness_history_pdname" /></div>
             </div>

             <div class="row table-cell-custom-border" :class="Object.keys(page).indexOf('illness_history_memo_other') !== 0 ? 'border-top-none' : ''" v-if="data.illness_history_memo_other.checked && page.hasOwnProperty('illness_history_memo_other')">
               <div class="col-2 text-center bg-grey-300 q-pa-sm"><div class="flex items-center full-height justify-center text-underline items-center">持参資料</div></div>
               <div class="col-10 q-pa-sm"><div class="q-ml-md" v-html="page.illness_history_memo_other" /></div>
             </div>
             
             <div class="absolute-bottom q-px-md">
               <q-separator size="2px" />
               <div class="flex q-mt-sm" :class="data.number_illness_history.checked ? 'justify-between' : 'justify-end'"><div v-if="data.number_illness_history.checked">Vettyカルテ eMR証明書 発行番号# {{data.number_illness_history.value}}</div><div>{{(idx + 1) }} / {{rows.length}}</div></div>
             </div>
          </div>
        <template v-if="idx + 1 != rows.length">
          <div class="html2pdf__page-break"></div>
        </template>
      </div>

    </q-card>
  </div>

    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>出力</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style src="../pdfExport/style.scss" lang="scss" scoped></style>