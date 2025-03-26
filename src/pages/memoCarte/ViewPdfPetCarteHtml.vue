<script setup lang="ts">
import { nextTick, ref, reactive, onMounted } from 'vue'
import { PetPdfCarteHeaderType } from './memoCarteUtils'
import { 
  getDateTimeNow,
  formatDateTime,
  aahUtilsGetEmployeeName,
  getImage,
  filterRows,
  getCurrentPetAge,
  getPetFirstName,
} from '@/utils/aahUtils'
import { CustomerType, PetType, PetBioInfoType, CarteGroup, ClinicalFile } from '@/types/types'
import useEmployeeStore from '@/stores/employees'
import useClinicStore from '@/stores/clinics'
import useCliCommonStore from '@/stores/cli-common'
import useIllnessHistoryStore from '@/stores/illness-history'
import { removeHtmlTag } from './memoCarteUtils'
import dayjs from 'dayjs'
import { storeToRefs } from 'pinia'

const employeeStore = useEmployeeStore()
const clinicStore = useClinicStore()
const cliCommonStore = useCliCommonStore()
const illnessHistoryStore = useIllnessHistoryStore()
const { getCliCommonTypeCarteSourceList } =
  storeToRefs(cliCommonStore)
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)


const rows = ref([])
const canRender = ref(false)

let headerData = reactive({
  clinicInfo: {
    name: { label: '', show: true },
    address: { label: '', show: true },
    phone: { label: '', show: true },
  },
  customerInfo: {
    name: { label: '', show: true },
    addressMain: { label: '', show: true },
    phoneMain: { label: '', show: true },
    email: { label: '', show: true },
  },
  petInfo: {
    name: { label: '', show: true },
    otherInfo: { label: '', show: true },
    gender: { label: '', show: true },
    DOB: { label: '', show: true },
    doctor: { label: '', show: true}
  },
  petBioInfo: {
    info: { label: '', show: true },
  },
})

let pdfConfiguration = reactive({
  showCustomerInfo: true,
  showPetInfo: true,
  showClinicalFiles: true,
  showPetBioInfo: true
})

let currentPet = reactive({}), currentCustomer = reactive({})

const getFooterNumber = () => {
  const currentFormattedDate = getDateTimeNow().slice(0, 10).replace(/\//gi, '')
  const clinicCode = clinicStore.getClinic.code_clinic
  const codeCustomer = props.currentCustomer.code_customer
  const codePet = props.currentPet.code_pet
  return `${currentFormattedDate}_${clinicCode}_${codeCustomer}_${codePet}`
}

const getFileName = () => {
  const currentFormattedDate = getDateTimeNow().slice(0, 10).replace(/\//gi, '')
  const clinicCode = clinicStore.getClinic.code_clinic
  const customerName = props.currentCustomer.name_customer_display
  return `${currentFormattedDate}_${clinicCode}_${customerName}_様_ペットカルテ`
}

const getTypeCarteLabel = (idCliCommon: number) => getCliCommonTypeCarteSourceList.value.find((v: CliCommon) => v.id_cli_common === idCliCommon)?.name_cli_common
const getPetIllnessHistoryNames = (illnessHistoryIds: number[]) => {
  return illnessHistoryIds.map((id: number) => {
    let illnessHistory = getIllnessHistorys.value.find((v: IllnessHistoryType) => v.id_pet_illness_history === id)
    return illnessHistory?.name_disease ?? illnessHistory?.name_disease_free ?? ''
  }).join(', ')
}  

const buildData = async () => {
  const rowsData = []

  for (const dateInsert of Object.keys(props.memoCarteData)) {
    const clinicalFileList = props.memoCarteData[dateInsert].clinical_file_list?.filter((clinicalFile: ClinicalFile) => clinicalFile.type_file === 1) // type 1 for image files
    const others = props.memoCarteData[dateInsert].others
    let recordIdx = 0

    for (const datetimeInsert of Object.keys(others)) {
      let tempObj = {}
      try {
        const datetimeRecord = others[datetimeInsert]
        if(datetimeRecord.memo_carte_list && datetimeRecord.memo_carte_list.length) {
          if(props.pdfConfiguration.showClinicalFiles) {
            const imageUrls = await Promise.all(
              clinicalFileList.map((clinicalFile) => getImage(clinicalFile.file_path))
            )

            tempObj.clinicalFileList = imageUrls
          }

          tempObj.carte = datetimeRecord
          tempObj.carte.showGroupByDate = recordIdx === 0
          tempObj.carte.showBottomBorder = true
          ++recordIdx
          rowsData.push(tempObj)
        }
      } catch (err) {
        console.log(err)
      }
    }
    const lastRecord = rowsData[rowsData.length - 1]
    lastRecord.carte.showBottomBorder = false
  }

  return rowsData
}

type HeaderObjOptions = {
  show: boolean;
  value: string;
}
const getHeaderValue = (obj: HeaderObjOptions): string | number | false => {
  if(obj.show && obj.value) {
    return obj.value
  }
  return false
}

const getDaysOfWeeks = (dateInsert: string) : string => {
  const weekDaysJp = ['日', '月', '火', '水', '木', '金', '土']
  const weekDay = dayjs(dateInsert).day()
  return `(${weekDaysJp[weekDay]})`
}

const getPetValWeight = (petBioInfo: PetBioInfoType) => {
  if(petBioInfo.type_body_weight == 1 && petBioInfo.val_weight) {
    return `${parseInt(petBioInfo.val_weight) / 1000} kg`
  }
  return `${petBioInfo.val_weight} g`
}

onMounted(() => { 
  const carteData = sessionStorage.getItem('carteContent')
  if(!carteData) {
    window.close()
  }
  const parsedCarteData = JSON.parse(carteData)
  headerData = parsedCarteData.headerData
  pdfConfiguration = parsedCarteData.configuration
  rows.value = parsedCarteData.carteContent
  currentCustomer = parsedCarteData.customer
  currentPet = parsedCarteData.pet
  canRender.value = true
})

</script>

<template>
  <div class="pdf-content-wrapper" v-if="canRender" style="margin: auto;">
    <div class="card-pdf-main-border-1px container">
       <div class="bg-grey-200 q-pa-sm flex justify-between items-center font-14px">
          <div class="title">診療情報提供書</div>
          <div class="flex items-center gap-6">
             <div class="flex column">
               <div class="flex" v-if="getHeaderValue(headerData.clinicInfo.name)"> <div>病院名：</div> <div>{{getHeaderValue(headerData.clinicInfo.name)}}</div> </div>
               <div class="flex" v-if="getHeaderValue(headerData.clinicInfo.address)"> <div>所在地：</div> <div>{{getHeaderValue(headerData.clinicInfo.address)}}</div> </div>
               <div class="flex" v-if="getHeaderValue(headerData.clinicInfo.phone)"> <div class="text-right">TEL：</div> <div>{{getHeaderValue(headerData.clinicInfo.phone)}}</div> </div>
             </div>
             <div>
               <div class="flex" v-if="getHeaderValue(headerData.petInfo.doctor)"> <div>担当医：</div> <div>{{ getHeaderValue(headerData.petInfo.doctor)}}</div> </div>
               <div class="flex"> <div>出力日時：</div> <div>{{getDateTimeNow().slice(0, -3)}}</div> </div>
             </div>
          </div>
        </div>
      <div style="margin: 16px 0;">
        <div style="height: 5px; background: #9e9e9e" />
      </div>
      <div style="display: flex; gap: 16px;" v-if="pdfConfiguration.showCustomerInfo || pdfConfiguration.showPetInfo">
        <div style="flex-basis: 50%;" v-if="pdfConfiguration.showCustomerInfo">
          <div style="display: flex; gap: 16px;">
            <div style="flex-basis: 40%; text-align: right;">
              <div style="text-decoration: underline">オーナー様情報</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.customerInfo.name)">氏名：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.customerInfo.addressMain)">住所：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.customerInfo.phoneMain)">電話番号：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.customerInfo.email)">メールアドレス：</div>
            </div>
            <div style="flex-basis: 60%;">
              <div style="height: 20px;"></div>
              <div v-if="getHeaderValue(headerData.customerInfo.name)">{{getHeaderValue(headerData.customerInfo.name)}}</div>
              <div v-if="getHeaderValue(headerData.customerInfo.addressMain)">{{getHeaderValue(headerData.customerInfo.addressMain)}}</div>
              <div v-if="getHeaderValue(headerData.customerInfo.phoneMain)">{{getHeaderValue(headerData.customerInfo.phoneMain)}}</div>
              <div v-if="getHeaderValue(headerData.customerInfo.email)">{{getHeaderValue(headerData.customerInfo.email)}}</div>
            </div>
          </div>
        </div>
        <div style="flex-basis: 50%;" v-if="pdfConfiguration.showPetInfo">
          <div style="display: flex; gap: 16px;">
            <div style="flex-basis: 40%; text-align: right;">
              <div><span style="text-decoration: underline">ペット患者情報</span> <span>{{currentPet.code_pet}}</span></div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.name)">名前：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.otherInfo)">動物種/品種：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.gender)">性別：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.DOB)">誕生日：</div>
            </div>
            <div style="flex-basis: 60%;">
              <div style="height: 20px;"></div>
              <div v-if="getHeaderValue(headerData.petInfo.name)">{{getHeaderValue(headerData.petInfo.name)}}</div>
              <div v-if="getHeaderValue(headerData.petInfo.otherInfo)">{{getHeaderValue(headerData.petInfo.otherInfo)}}</div>
              <div v-if="getHeaderValue(headerData.petInfo.gender)">{{getHeaderValue(headerData.petInfo.gender)}}</div>
              <div v-if="getHeaderValue(headerData.petInfo.DOB)">{{getHeaderValue(headerData.petInfo.DOB)}}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="separator" style="margin: 16px 0" v-if="pdfConfiguration.showPetBioInfo" />

      <div v-if="pdfConfiguration.showPetBioInfo" style="display: flex; align-items: center; gap: 32px;">
          <div class="text-grey-700">生体情報</div>
          <div class="petbio-text"> {{ headerData.petBioInfo.info.value }} </div>
      </div>

      <div class="separator" style="margin: 16px 0" v-if="pdfConfiguration.showCustomerInfo || pdfConfiguration.showPetInfo" />

      <template v-for="(memoCarte, idx) in rows" :key="idx">
        <div v-if="memoCarte?.carte?.grouped_cartes">
            <div class="grouped-date" style="font-weight: bold; margin-bottom: 16px; text-align: center;" v-if="memoCarte.carte.showGroupByDate">
              <span>{{memoCarte.carte.date_insert}} {{getDaysOfWeeks(memoCarte.carte.date_insert)}}</span>
            </div>
            <div><span class="text-grey-700">記入者: </span> <span>{{ aahUtilsGetEmployeeName(employeeStore.getAllEmployees, memoCarte.carte?.memo_carte_list?.[0]?.id_employee) }} </span></div>
            <div><span class="text-grey-700">メモカルテ記録日時: </span><span>{{formatDateTime(memoCarte.carte?.memo_carte_list?.[0]?.datetime_memo_carte)}} </span></div>
            <div><span class="text-grey-700">カルテ区分: </span><span>{{getTypeCarteLabel(memoCarte.carte?.memo_carte_list?.[0]?.id_cli_common)}} </span></div>
            <div><span class="text-grey-700">現疾患・既往歴: </span><span>{{getPetIllnessHistoryNames(memoCarte.carte?.memo_carte_list?.[0]?.id_pet_illness_history)}} </span></div>
            <template v-if="memoCarte.carte.pet_bio && Object.keys(memoCarte.carte.pet_bio).length > 0">
              <div v-if="memoCarte.carte.pet_bio.val_weight"> <span class="text-grey-700">体重: </span> <span> {{getPetValWeight(memoCarte.carte.pet_bio)}} </span></div>
              <div v-if="memoCarte.carte.pet_bio.val_temperature"> <span class="text-grey-700">体温 T: </span> <span> {{memoCarte.carte.pet_bio.val_temperature}} </span></div>
              <div v-if="memoCarte.carte.pet_bio.val_heartbeat_rate"> <span class="text-grey-700">心拍 P: </span> <span> {{memoCarte.carte.pet_bio.val_heartbeat_rate}} </span></div>
              <div v-if="memoCarte.carte.pet_bio.val_respiration_rate"> <span class="text-grey-700">呼吸数 R: </span> <span> {{memoCarte.carte.pet_bio.val_respiration_rate}} </span></div>
            </template>
            <div class="memo-field" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_sbj"> <span class="text-grey-700">S: 主観: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_sbj)}}</span></div>
            <div class="memo-field" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_obj"><span class="text-grey-700">O: 客観: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_obj)}}</span></div>
            <div class="memo-field" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_ass"><span class="text-grey-700">A: 評価: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_ass)}}</span></div>
            <div class="memo-field" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_other"><span class="text-grey-700">P: 計画他: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_other)}}</span></div>
            <div class="clinical-files-grid" style="margin-top: 16px;" v-if="pdfConfiguration.showClinicalFiles && memoCarte.landscapeClinicalFileList.length > 0">
              <template v-for="(clinicalFile, clinicalFileIdx) in memoCarte.landscapeClinicalFileList" :key="clinicalFileIdx">
                <div class="clinical-image landscape">
                  <img :src="clinicalFile" />
                </div>
              </template>
            </div>
            <div class="clinical-files-grid" style="margin-top: 16px;" v-if="pdfConfiguration.showClinicalFiles && memoCarte.portraitClinicalFileList.length > 0">
              <template v-for="(clinicalFile, clinicalFileIdx) in memoCarte.portraitClinicalFileList" :key="clinicalFileIdx">
                <div class="clinical-image portait">
                  <img :src="clinicalFile" />
                </div>
              </template>
            </div>
        </div>
        <div v-else>
          <div class="text-grey-700" style="margin-bottom: 16px;" v-if="memoCarte.carte.showGroupByDate">
            <span>{{memoCarte.carte.date_insert}}</span> <span>{{getDaysOfWeeks(memoCarte.carte.date_insert)}}</span>
          </div>
          <div><span class="text-grey-700">記入者: </span> <span>{{ aahUtilsGetEmployeeName(employeeStore.getAllEmployees, memoCarte.carte?.memo_carte_list?.[0]?.id_employee) }} </span></div>
          <div><span class="text-grey-700">メモカルテ記録日時: </span> <span>{{formatDateTime(memoCarte.carte?.memo_carte_list?.[0]?.datetime_memo_carte)}} </span></div>
          <div><span class="text-grey-700">カルテ区分: </span> <span>{{getTypeCarteLabel(memoCarte.carte?.memo_carte_list?.[0]?.id_cli_common)}} </span></div>
          <div><span class="text-grey-700">現疾患・既往歴: </span> <span>{{memoCarte.carte.memo_carte_list[0]?.pet_illness_history_list.map((v) => v.name_disease ?? v.name_disease_free).join(', ')}} </span></div>
          <div class="memo-field"><span> {{removeHtmlTag(memoCarte.carte.memo_carte_list[0]?.memo_other)}} </span></div>
        </div>
        <div class="separator" v-if="memoCarte.carte.showBottomBorder"></div>
      </template>

      <div class="font-14px q-px-md q-mt-md">
        <q-separator color="grey-900" />
        <div class="flex justify-between">
            <div>Vettyカルテ eMR証明書 発行番号#</div>
            <div class="text-right flex items-start gap-5" style="flex-basis: 70%;">
            <small class="font-10px">
                本資料の取り扱いには十分注意をし、コピー・転載行為は厳禁のこと、関係者のみ閲覧可能とします。また、診療 <br /> 目的以外での使用は不可とし、使用後は必ず責任を持って破棄していただくよう、お願いします。
            </small>
            </div>
        </div>
      </div>

    </div>
  </div>
</template>
<style src="../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
.pdf-content-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;  
  .container {
    width: 800px;
    max-width: 100%;
    font-size: 14px;
    line-height: 1.5;
    margin-left: 16px;
    margin-right: 16px;
  }
  .title {
    font-size: 18px;
    font-weight: bold;
  }
  .petbio-text, .memo-field {
    white-space: pre-line;
  }
  .grouped-date {position: relative;
    &:before{
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      border-top: 2px solid $grey-500;
       z-index: 1;
    }
    span {
      display: inline-block;
      position: relative;
      z-index: 9999;
      background-color: #fff;
      padding: 0 20px;
    }
  }
  div.separator {
    background: rgba(0, 0, 0, 0.12);
    height: 1px;
    margin: 20px 0;
  }
  .text-grey-700 {
    color: #616161 !important;
  }
  .clinical-files-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 15px;
    .clinical-image {
      max-height: 180px;
      width: 100%;
      &.portait {
        max-height: 250px;
      }
      img {
        height: auto;
        max-height: 100%;
        object-fit: contain;
      }
    }
  }
}  
</style>