<script setup lang="ts">
import { nextTick, ref, onMounted } from 'vue'
import { PetPdfCarteHeaderType } from './memoCarteUtils'
import { 
  getDateTimeNow,
  formatDateTime,
  aahUtilsGetEmployeeName,
  getImage,
  filterRows,
  getCurrentPetAge,
  getPetFirstName
} from '@/utils/aahUtils'
import { CustomerType, PetType, PetBioInfoType, CarteGroup, ClinicalFile } from '@/types/types'
import useEmployeeStore from '@/stores/employees'
import useClinicStore from '@/stores/clinics'
import { removeHtmlTag } from './memoCarteUtils'
import dayjs from 'dayjs'
// Pdf imports
import jsPDF from "jspdf";
import { Loading } from 'quasar'
import { notoSansJPBase64 } from '@/assets/fonts/Base64NotoSansJP.js'

const emits = defineEmits(['close'])
const close = () => emits('close')

type CarteGroupedByDate = {
  clinical_file_list: ClinicalFile[],
  others: CarteGroup,
}

interface Props {
  headerData: PetPdfCarteHeaderType
  memoCarteData: Record<string, CarteGroupedByDate>
  pdfConfiguration: Record<string, boolean>
  currentPet: PetType
  currentCustomer: CustomerType
  getTypeCarteLabel: (idCliCommon: number) => string
  getPetIllnessHistoryNames: (illnessHistoryIds: number[]) => string
  getPetValWeight: (petBioInfo: PetBioInfoType) => string
  getTypeAnimal: (id_cm_animal: number) => string | undefined
  getBreed: (id_cm_breed: number) => string | undefined,
  getPetGender: (petGenderType: number) => string
  mode: 'download' | 'print' | 'viewhtml'
}

const props = withDefaults(defineProps<Props>(), {
  headerData: {
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
  },
  memoCarteData: {
    clinical_file_list: [],
    others: {}
  },
  pdfConfiguration: {
    showCustomerInfo: true,
    showPetInfo: true,
    showClinicalFiles: true,
    showPetBioInfo: true
  },
  currentPet: {} as PetType,
  currentCustomer: {} as CustomerType,
  getTypeCarteLabel: () => '',
  getPetIllnessHistoryNames: () => '',
  getPetValWeight: () => '',
  getTypeAnimal: () => '',
  getBreed: () => '',
  getPetGender: () => '',
  mode: 'download'
})

const customer = props.currentCustomer, pet = props.currentPet

const employeeStore = useEmployeeStore()
const clinicStore = useClinicStore()

const rows = ref([])

const init = async () => {
  const { mode } = props
  if(mode  == 'download' || mode == 'print') {
    Loading.show({
      backgroundColor: 'transparent',
      spinnerColor: 'black',
      message: '読み込み中です...',
      messageColor: 'black'
    })
    await nextTick()
    rows.value = await buildData()
    await nextTick()
    generatePDF() 
    Loading.hide()
  }
  else {
    await openCarteHtml()
  }
  close()
}

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

            const { landscapeImages , portraitImages } = await getImagesByType(imageUrls.filter((v) => v))

            tempObj.landscapeClinicalFileList = landscapeImages
            tempObj.portraitClinicalFileList = portraitImages
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

const setFonts = (doc) => {
  doc.addFileToVFS("NotoSansJP.ttf", notoSansJPBase64)
  doc.addFont('NotoSansJP.ttf', 'NotoSansJP', 'normal')
  doc.setFont('NotoSansJP')
}

function generatePDF() {
  const doc = new jsPDF();
  
  const element = document.querySelector(".pdf-content-container");

  if (!element) {
    return
  }

  setFonts(doc)

  element.style.fontFamily = 'NotoSansJP'

  function addHeader(pdf, pageWidth, pageHeight, pageNum) {
    const margin = 5
    const titleHeight = 18
    const padding = 5

    const headerData = props.headerData;

    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, margin, pageWidth - 2 * margin, titleHeight, "F")

    pdf.setFontSize(18)
    pdf.text("診療情報提供書", margin + 5, margin + 12)

    pdf.setFontSize(8)

    const clinicInfoX = pageWidth - 100, customerInfoX = pageWidth - 100
    let clinicInfoY = margin + padding, customerInfoY = margin + padding

    if(pageNum === 1) {
      // show clinic info only in first page
      if (getHeaderValue(headerData.clinicInfo.name)) {
        pdf.text(`病院名：${getHeaderValue(headerData.clinicInfo.name)}`, clinicInfoX, clinicInfoY)
        clinicInfoY += 5
      }

      if (getHeaderValue(headerData.clinicInfo.address)) {
        pdf.text(`所在地：${getHeaderValue(headerData.clinicInfo.address)}`, clinicInfoX, clinicInfoY)
        clinicInfoY += 5
      }

      if (getHeaderValue(headerData.clinicInfo.phone)) {
        pdf.text(`TEL：${getHeaderValue(headerData.clinicInfo.phone)}`, clinicInfoX, clinicInfoY)
        clinicInfoY += 5
      }
    }

    else {
      if(customer && Object.keys(customer).length > 0) {
        pdf.text(`オーナーCD：${customer.code_customer}`, customerInfoX, customerInfoY)
        customerInfoY += 5
      }

      if(customer && Object.keys(customer).length > 0) {
        pdf.text(`オーナー氏名：${customer.name_customer_display}`, customerInfoX, customerInfoY)
        customerInfoY += 5
      }

      if(pet && Object.keys(pet).length > 0) {
        pdf.text(`ペットCD：${getPetFirstName(pet)}`, customerInfoX, customerInfoY)
        customerInfoY += 5
      }
    }

    const petInfoX = pageWidth - 50
    let petInfoY = margin + padding

    if(pageNum === 1) {

      if (getHeaderValue(headerData.petInfo.doctor)) {
        pdf.text(`担当医：${getHeaderValue(headerData.petInfo.doctor)}`, petInfoX, petInfoY)
        petInfoY += 5
      }

      pdf.text(`出力日時：${getDateTimeNow().slice(0, -3)}`, petInfoX, petInfoY)
    }

    else {
      const { getTypeAnimal , getBreed, getPetGender } = props
      if(pet.id_cm_animal && pet.id_cm_breed) {
        const typeAnimalName = getTypeAnimal(pet.id_cm_animal)
        const typeBreedName = getBreed(pet.id_cm_breed)
        const name = typeAnimalName && typeBreedName ? `${typeAnimalName} / ${typeBreedName}` : typeAnimalName || typeBreedName || 'N/A'
        const maxWidth = 45
        let wrappedText = pdf.splitTextToSize(name, maxWidth)
        if(wrappedText.length > 2) {
          wrappedText = wrappedText.slice(0, 2)
          const lastLine = wrappedText[1]
          wrappedText[1] = lastLine.substring(0, lastLine.length - 3) + '...'
        }
        pdf.text(wrappedText, petInfoX, petInfoY)
        petInfoY += (Math.min(2, wrappedText.length) * 5)
      }

      pdf.text(`${getPetGender(pet.type_pet_gender)} & ${getCurrentPetAge(pet)}`, petInfoX, petInfoY)
    }
  }

  function addFooter(pdf, pageWidth, pageHeight) {
    const margin = 5
    const footerHeight = 12
    const padding = 5

    const footerNumber = getFooterNumber()
    const pageIdx = pdf.internal.getCurrentPageInfo().pageNumber
    const totalPages = pdf.internal.getNumberOfPages()

    pdf.setDrawColor(169, 169, 169)
    pdf.setLineWidth(0.5)
    pdf.line(margin, pageHeight - footerHeight, pageWidth - margin, pageHeight - footerHeight)

    pdf.setFontSize(6)

    const footerInfoX = margin
    let footerInfoY = pageHeight - footerHeight + padding
    pdf.text(`Vettyカルテ eMR証明書 発行番号# ${getFooterNumber()}`, footerInfoX, footerInfoY)

    const warningText = `本資料の取り扱いには十分注意をし、コピー・転載行為は厳禁のこと、関係者のみ閲覧可能とします。また、診療 \n目的以外での使用は不可とし、使用後は必ず責任を持って破棄していただくよう、お願いします。`
    const warningTextX = pageWidth - 120
    let warningTextY = footerInfoY
    pdf.text(warningText, warningTextX, warningTextY)

    const pageNumberX = pageWidth - 10
    let pageNumberY = footerInfoY

    pdf.text(`${pageIdx} / ${totalPages}`, pageNumberX, pageNumberY)
  }

  const renderPDF = () => {
    const marginTop = 25, marginBottom = 20, marginLeftRight = 0
    const filename = getFileName()
    
    doc.html(element, {
      callback: function (doc) {
        const pageCount = doc.internal.getNumberOfPages()
        const pageWidth = doc.internal.pageSize.width
        const pageHeight = doc.internal.pageSize.height

        setFonts(doc)

        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          doc.setPage(pageNum)
          addHeader(doc, pageWidth, pageHeight, pageNum)
          addFooter(doc, pageWidth, pageHeight)
        }

        if(props.mode === 'print') {
          const pdfBlob = doc.output('blob');
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          document.body.appendChild(iframe)

          const url = URL.createObjectURL(pdfBlob);
          iframe.src = url;
          iframe.onload = function () {
            iframe.contentWindow.print()
          }
        }
       
        else doc.save(`${filename}.pdf`)
      },
      margin: [marginTop, marginLeftRight, marginBottom, marginLeftRight],
      width: doc.internal.pageSize.width - 10,
      windowWidth: 800,
      html2canvas: {
        useCors: true,
        allowTaint: true,
        letterRendering: true,
        logging: false
    }
    })
  }

  renderPDF()
}

const getImageDimesnsion = (url: string):Promise<{width: number, height: number}> => {
  return new Promise((resolve) => {
    const image = new Image()
    image.src = url
    image.onload = () => {
      resolve({ width: image.width, height: image.height})
    }
  })
}

const getImagesByType = async (imageUrls: string[]):Promise<{landscapeImages: string[], portraitImages: string[]}> => {
  const landscapeImages = [], portraitImages = []
  for(const imageUrl of imageUrls) {
    const { width, height } = await getImageDimesnsion(imageUrl)
    if(width > height ) landscapeImages.push(imageUrl)
    else portraitImages.push(imageUrl)
  }

  return { landscapeImages, portraitImages }
}

const openCarteHtml = async () => {
  rows.value = await buildData()
  let carteData = {
    'headerData': props.headerData,
    'carteContent': rows.value,
    'configuration': props.pdfConfiguration,
    'customer': props.currentCustomer,
    'pet': props.currentPet
  }
  sessionStorage.setItem('carteContent', JSON.stringify(carteData))
  window.open('/ViewPdfPetCarteHtml', '_blank')
}


onMounted(() => {
  init()
})

</script>

<template>
  <div class="page-inner-body">
    <div class="card-pdf-main-border-1px pdf-content-container">
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
              <div style="height: 22px;"></div>
              <div v-if="getHeaderValue(headerData.customerInfo.name)">{{getHeaderValue(headerData.customerInfo.name)}}</div>
              <div v-if="getHeaderValue(headerData.customerInfo.addressMain)">{{getHeaderValue(headerData.customerInfo.addressMain)}}</div>
              <div class="ellipsis" v-if="getHeaderValue(headerData.customerInfo.phoneMain)">{{getHeaderValue(headerData.customerInfo.phoneMain)}}</div>
              <div v-if="getHeaderValue(headerData.customerInfo.email)">{{getHeaderValue(headerData.customerInfo.email)}}</div>
            </div>
          </div>
        </div>
        <div style="flex-basis: 50%;" v-if="pdfConfiguration.showPetInfo">
          <div style="display: flex; gap: 16px;">
            <div style="flex-basis: 40%; text-align: right;">
              <div><span style="text-decoration: underline">ペット患者情報</span></div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.name)">名前：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.otherInfo)">動物種/品種：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.gender)">性別：</div>
              <div class="text-grey-700" v-if="getHeaderValue(headerData.petInfo.DOB)">誕生日：</div>
            </div>
            <div style="flex-basis: 60%;">
              <div style="height: 22px;"></div>
              <div v-if="getHeaderValue(headerData.petInfo.name)">{{getHeaderValue(headerData.petInfo.name)}} <span>{{currentPet.code_pet}}</span> </div>
              <div v-if="getHeaderValue(headerData.petInfo.otherInfo)">
                 {{ getHeaderValue(headerData.petInfo.otherInfo).length > 14 ? getHeaderValue(headerData.petInfo.otherInfo).substr(0, 14) + '...' : getHeaderValue(headerData.petInfo.otherInfo) }}
              </div>
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
            <div class="grouped-date" :class="idx !== 0 ? 'q-mt-md' : ''" style="font-weight: bold; margin-bottom: 16px; text-align: center;" v-if="memoCarte.carte.showGroupByDate">
              <span>{{memoCarte.carte.date_insert}}</span> <span>{{getDaysOfWeeks(memoCarte.carte.date_insert)}}</span>
            </div>
            <div class="row">
              <div class="col-6"><span class="text-grey-700">記入者: </span> <span>{{ aahUtilsGetEmployeeName(employeeStore.getAllEmployees, memoCarte.carte?.memo_carte_list?.[0]?.id_employee) }} </span></div>
              <!-- <div class="col-6"><span class="text-grey-700">メモカルテ記録日時: </span><span>{{formatDateTime(memoCarte.carte?.memo_carte_list?.[0]?.datetime_memo_carte)}} </span></div> -->
              <div class="col-6"><span class="text-grey-700">カルテ区分: </span><span>{{getTypeCarteLabel(memoCarte.carte?.memo_carte_list?.[0]?.id_cli_common)}} </span></div>
              <div class="col-12"><span class="text-grey-700">現疾患・既往歴: </span><span>{{getPetIllnessHistoryNames(memoCarte.carte?.memo_carte_list?.[0]?.id_pet_illness_history)}} </span></div>
              <div class="col-12 q-mb-md">
                <template v-if="memoCarte.carte.pet_bio && Object.keys(memoCarte.carte.pet_bio).length > 0">
                  <div class="row">                    
                    <div class="col-3" v-if="memoCarte.carte.pet_bio.val_weight"> <span class="text-grey-700">体重 BW </span> <span> {{getPetValWeight(memoCarte.carte.pet_bio)}} </span></div>
                    <div class="col-3" v-if="memoCarte.carte.pet_bio.val_temperature"> <span class="text-grey-700">体温 T: </span> <span> {{memoCarte.carte.pet_bio.val_temperature}} </span></div>
                    <div class="col-3" v-if="memoCarte.carte.pet_bio.val_heartbeat_rate"> <span class="text-grey-700">心拍 P: </span> <span> {{memoCarte.carte.pet_bio.val_heartbeat_rate}} </span></div>
                    <div class="col-3" v-if="memoCarte.carte.pet_bio.val_respiration_rate"> <span class="text-grey-700">呼吸数 R: </span> <span> {{memoCarte.carte.pet_bio.val_respiration_rate}} </span></div>
                  </div>
                </template>
              </div>
            </div>
            <div class="memo-field" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_sbj"> <span class="text-grey-700">S: 主観: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_sbj)}}</span></div>
            <div class="memo-field q-mt-sm" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_obj"><span class="text-grey-700">O: 客観: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_obj)}}</span></div>
            <div class="memo-field q-mt-sm" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_ass"><span class="text-grey-700">A: 評価: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_ass)}}</span></div>
            <div class="memo-field q-mt-sm" v-if="memoCarte.carte?.memo_carte_list?.[0]?.memo_other"><span class="text-grey-700">P: 計画他: </span> <span>{{removeHtmlTag(memoCarte.carte?.memo_carte_list?.[0]?.memo_other)}}</span></div>
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
          <div class="row">
            <div class="col-6"><span class="text-grey-700">記入者: </span> <span>{{ aahUtilsGetEmployeeName(employeeStore.getAllEmployees, memoCarte.carte?.memo_carte_list?.[0]?.id_employee) }} </span></div>
            <div class="col-6"><span class="text-grey-700">カルテ区分: </span> <span>{{getTypeCarteLabel(memoCarte.carte?.memo_carte_list?.[0]?.id_cli_common)}} </span></div>
            <div class="col-6"><span class="text-grey-700">現疾患・既往歴: </span> <span>{{memoCarte.carte.memo_carte_list[0]?.pet_illness_history_list.map((v) => v.name_disease ?? v.name_disease_free).join(', ')}} </span></div>
            <!-- <div class="col-6"><span class="text-grey-700">メモカルテ記録日時: </span> <span>{{formatDateTime(memoCarte.carte?.memo_carte_list?.[0]?.datetime_memo_carte)}} </span></div> -->
          </div>
          <div class="memo-field q-mt-md"><span> {{removeHtmlTag(memoCarte.carte.memo_carte_list[0]?.memo_other)}} </span></div>
        </div>
        <div class="separator" v-if="memoCarte.carte.showBottomBorder"></div>
      </template>
    </div>
  </div>
</template>
<style src="../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
.pdf-content-container {
  width: 800px;
  max-width: 100%;
  font-size: 16px;
  line-height: 1.5;
  margin-left: 16px;
  margin-right: 16px;
}
.petbio-text, .memo-field {
  white-space: pre-line;
}
.grouped-date {
  background: $grey-300;
  padding: 5px;
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
</style>