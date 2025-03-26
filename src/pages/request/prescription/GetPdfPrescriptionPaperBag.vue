<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useClinicStore from '@/stores/clinics'
import { date } from 'quasar'
import { typePrintBagTitle } from '@/utils/enum'
import {
  comTypeDose,
  concatenate,
  getImage,
  getPetFirstName,
  roundZeroAfterPoint,
  typeDoseQuantityUI
} from '@/utils/aahUtils'
import html2pdf from 'html2pdf.js'
import { CustomerType, PetType } from '@/types/types'
import useEmployeeStore from '@/stores/employees'

const employeeStore = useEmployeeStore()

interface Props {
  prescriptionDetailList: Array<any>,
  prescriptionHeader: Object,
  pdfSettingsData: Object,
  jsPDFData: Object,
  getPet: (id_pet: number) => PetType,
  getCustomer: (id_customer: number) => CustomerType,
  prescriptionPdfAttributes: Object,
  flgPdfDirectDownload: Boolean
}

const props = withDefaults(defineProps<Props>(), {
  prescriptionDetailList: [],
  prescriptionHeader: {},
  pdfSettingsData: {},
  jsPDFData: Object,
  getPet: () => {},
  getCustomer: () => {},
  prescriptionPdfAttributes: {},
  flgPdfDirectDownload: true
})
console.log(props.flgPdfDirectDownload)

const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const exportPdf = ref()
const clinicData = ref()
const clinic = ref(JSON.parse(localStorage.getItem('clinic')) ?? '')
const singlePrescriptionDetailList = ref([])

function generateReport() {
  let imagePDFOptions:any = {quality: 0.5}, jsPDFOptions = {...props.jsPDFData, format: [148, 210], orientation: 'portrait'}
  exportPdf.value.generateReport(getFileName(), 0, jsPDFOptions, imagePDFOptions)
  props.prescriptionPdfAttributes.paperBag.render = false
}

function getFileName() {
  return `${date.formatDate(Date.now(), 'YYYYMMDD')}_処方箋説明書_${props.getCustomer(props.prescriptionHeader.id_customer)?.name_customer_display}様`
}

function close() {
  emits('close')
}

const getTypePrintBagTitle = (val: any) => typePrintBagTitle.find((item) => item.value === val)?.label

const fetchClinic = async (idClinic: String) => {
  if(!idClinic) {
    idClinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
  let clinic:any = await clinicStore.fetchClinicById(idClinic)
  return clinic
}

const populateRows = () => {
  const singlePageRows: number = 6
  for(let i = 0; i < props.prescriptionDetailList.length; i += singlePageRows) {
    singlePrescriptionDetailList.value.push(props.prescriptionDetailList.slice(i, i + singlePageRows))
  }
}

function generateAndPrintPDF() {
  const element = document.getElementById('element-to-print')
  const options = {
    margin: 1,
    filename: getFileName(),
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { 
      letterRendering: true, 
      scale: 2, 
    },
    jsPDF: {
      unit: 'mm',
      putOnlyUsedFonts: true,
      floatPrecision: 16,
      compressPdf: true,
      orientation: 'portrait',
      format: [148, 210]
    },
    pagebreak: {
      mode: ['css', 'legacy'], // legacy: default class to use for page break => 'html2pdf__page-break'
      avoid: 'img'
    }
  }

  const iframePdf = document.querySelector(`[prescriptionPdf="${true}"]`)
  if(iframePdf) iframePdf.remove()
  html2pdf().set(options).from(element).toPdf().get('pdf').then(function(pdf) {
    var iframe = document.createElement('iframe')
    iframe.setAttribute('prescriptionPdf', true)
    iframe.style.visibility = 'hidden'
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '100px'
    iframe.style.height = '100px'
    document.body.appendChild(iframe)

    iframe.src = pdf.output('bloburl')

    iframe.onload = function() {
      setTimeout(() => {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }, 300)
    }
    props.prescriptionPdfAttributes.paperBag.render = false
  })
}

function getDescriptionHeight() {
  let defaultMinHeight: number = 350
  if(!clinicData.value?.memo_consultation_hours) defaultMinHeight += 20
  if(!clinicData.value?.date_closed) defaultMinHeight += 20
  return `${defaultMinHeight}px`
}

function quantityDose(prescriptionDetail: any) {
  return prescriptionDetail.calculatedAmount
}

const getEmployee = (id_employee) => {
  return employeeStore.getEmployees.find(
    (v) => v.id_employee == id_employee
  )
}


function prescriptionDetailWithGroup(prescriptionDetail: any) {
  let group = {}
  prescriptionDetail.forEach((pd) => {
    const { type_detail, id_prescription_detail, id_prescription_detail_ref } = pd

    if (type_detail == 5) {
      group[id_prescription_detail] = group[id_prescription_detail] || []
      group[id_prescription_detail].push(pd)
    } else if (id_prescription_detail_ref) {
      group[id_prescription_detail_ref] = group[id_prescription_detail_ref] || []
      group[id_prescription_detail_ref].push(pd)
    } else if (type_detail == 1 && !pd.id_prescription_detail_ref) {
      group[id_prescription_detail] = group[id_prescription_detail] || []
      group[id_prescription_detail].push(pd)
    }
  })
  return group
}


async function init() {

  await nextTick()

  if(props.pdfSettingsData.flg_print_all_in_one) {
    populateRows()
  }

  clinicData.value = await fetchClinic(clinic?.value.id_clinic)
  if(clinicData.value?.logo_file_path1) clinicData.value.logo_file_path1 = await getImage(clinicData.value.logo_file_path1)
  await nextTick()
  if(props.flgPdfDirectDownload) return generateReport()
  return generateAndPrintPDF()
}

onMounted(() => {
  init()
})

</script>

<template>

  <div class="q-pa-md page-inner-body main-container" v-show="false">
    <PdfExport ref="exportPdf" sheetName="_注文書" />
    <q-card id="element-to-print" style="max-width: 1000px; margin: auto" class="bg-white q-pa-none" square v-if="!pdfSettingsData.flg_print_all_in_one">
      <div v-for="([key, prescriptionDetailRows], idx) in Object.entries(prescriptionDetailWithGroup(prescriptionDetailList))"
           :key="idx"
           :style="{'min-height': '650px'}"
           class="card-pdf-main q-px-md q-pt-md relative-position">

        <div class="relative-position" style="margin-top: 75px;">
           <div class="text-weight-bold absolute-center" style="font-size: 55px;">{{getTypePrintBagTitle(pdfSettingsData.type_print_bag_title)}}</div>
           <div class="text-right">{{pdfSettingsData?.date_start}}</div>
         </div>
         <div class="q-mt-lg">
            <span class="q-mx-md">{{props.getCustomer(prescriptionHeader?.id_customer)?.name_customer_display}} 様</span>
            <span>{{getPetFirstName(props.getPet(prescriptionHeader?.id_pet))}}</span>
         </div>
         <div class="border-description q-pa-md q-mt-md relative-position" :style="{'height': getDescriptionHeight()}">
           <template v-for="prescriptionDetail in prescriptionDetailRows"
                     :key="prescriptionDetail.id_prescription_detail">
             <template v-if="prescriptionDetail.flg_group_title">
               <div
                 :class="prescriptionDetail.flg_group_title && prescriptionDetail.type_detail == 4 ? 'border-bottom' : '' ">
                 <div class="q-pb-xs q-mt-sm">{{ prescriptionDetail.name_prescription_display }}</div>
                 <div v-if="prescriptionDetail.flg_group_title && prescriptionDetail.type_detail == 5">
                      <span v-if="prescriptionDetail.total_days_dose">
                      {{
                          ' ' +
                          roundZeroAfterPoint(prescriptionDetail.total_days_dose) +
                          comTypeDose(
                            typeDoseQuantityUI(
                              prescriptionDetail.id_dosage_frequency
                            ).typeDoseUI
                          ) +
                          ' x 頻度 ' + ' ' + prescriptionDetail?.name_dose_formal
                        }}
                      </span>
                   <span class="text-grey-700 q-ml-md" style="font-size: 11px;">総服用回数: </span>
                   <span> 
                        {{ quantityDose(prescriptionDetail) }} 回分
                      </span>
                 </div>
               </div>
             </template>
             <template v-else>
               <div class="flex column">
                 <div>{{ prescriptionDetail.name_prescription_display }}
                   <span v-if="prescriptionDetail.name_medicine_format == '錠'" class="q-ml-lg">
                            {{ prescriptionDetail.fraction }}
                     </span>
                 </div>
               </div>
               <!--                DONt show these for plus item -->
               <div v-if="prescriptionDetail.type_detail != 2">
                  <span v-if="prescriptionDetail.total_days_dose">
                      {{
                      ' ' +
                      roundZeroAfterPoint(prescriptionDetail.total_days_dose) +
                      comTypeDose(
                        typeDoseQuantityUI(
                          prescriptionDetail.id_dosage_frequency
                        ).typeDoseUI
                      ) + ' x 頻度 ' + ' ' + prescriptionDetail?.name_dose_formal
                    }}
                    </span>
                 <span class="text-grey-700 q-ml-md" style="font-size: 11px;">総服用回数: </span>
                 <span> 
                      {{ quantityDose(prescriptionDetail) }} 回分
                    </span>
               </div>
             </template>
             <div class="absolute-bottom-right bottom-desc-text">
               お大事になさってください。
             </div>
           </template>
         </div>
         <div class="text-grey-900 q-mt-md">
           <div>※お薬は獣医師の指示に従って飲ませて下さい。</div>
           <div>　ご不明な点などございましたら遠慮なくお問い合わせください。</div>
         </div>
         <div class="row q-mt-md q-pa-sm">
           <div class="col-9 flex items-start" style="flex-wrap: nowrap">
             <div v-if="clinicData?.logo_file_path1" class="footer-logo" style="flex-basis: 10%"><img
               :src="clinicData?.logo_file_path1" /></div>
             <div :class="clinicData?.logo_file_path1 ? 'q-ml-md' : ''">
               <div class="flex items-start">
                 <div class="text-grey-900">
                   <span v-if="clinicData?.name_clinic_display" class="text-weight-bold body1 text-h4">
                     {{ clinicData.name_clinic_display }}</span>
                   <div v-if="clinicData?.address_prefecture || clinicData?.address_city || clinicData?.address_other">
                     {{ concatenate(clinicData.address_prefecture, clinicData.address_city, clinicData.address_other) }}
                   </div>
                   <div v-if="clinicData?.phone1">Tel. {{ clinicData.phone1 }}</div>
                   <div v-if="clinicData?.memo_consultation_hours" :style="{'max-width': clinicData?.logo_file_path1 ? '460px' : '520px'}"
                        class="ellipsis">
                     営業時間：{{ clinicData.memo_consultation_hours }}
                   </div>
                   <div v-if="clinicData?.date_closed" :style="{'max-width': clinicData?.logo_file_path1 ? '460px' : '520px'}"
                        class="ellipsis">休診日:
                     {{ clinicData.date_closed }}
                   </div>
                 </div>
               </div>
             </div>
           </div>
           <div class="col-3 row justify-right relative-position">
             <div class="absolute-right">
               <div class="text-center">担当
                 <span v-if="getEmployee(pdfSettingsData.id_employee_doctor)">
                 {{
                     getEmployee(pdfSettingsData.id_employee_doctor)
                       ?.name_family + ' '
                     + getEmployee(pdfSettingsData.id_employee_doctor)
                       ?.name_first
                   }}
                </span>
               </div>
               <div class="bottom-card q-pa-sm q-mt-sm"></div>
             </div>
           </div>
         </div>
        <template v-if="Object.keys(prescriptionDetailWithGroup)[idx + 1]">
          <div class="html2pdf__page-break"></div>
        </template>
       </div>
    </q-card>

    <q-card v-if="pdfSettingsData.flg_print_all_in_one" id="element-to-print" class="bg-white q-pa-none" square
            style="max-width: 1000px; margin: auto">
      <div v-for="(prescriptionDetailRows, idx) in singlePrescriptionDetailList"
           :key="idx"
           :style="{'min-height': '650px'}"
           class="card-pdf-main q-px-md q-pt-md relative-position">

        <div class="relative-position" style="margin-top: 75px;">
           <div class="text-weight-bold absolute-center" style="font-size: 55px;">{{getTypePrintBagTitle(pdfSettingsData.type_print_bag_title)}}</div>
           <div class="text-right">{{pdfSettingsData?.date_start}}</div>
         </div>
         <div class="q-mt-lg">
            <span class="q-mx-md">{{props.getCustomer(prescriptionHeader?.id_customer)?.name_customer_display}} 様</span>
            <span>{{getPetFirstName(props.getPet(prescriptionHeader?.id_pet))}}</span>
         </div>
         <div class="border-description q-pa-md q-mt-md relative-position" :style="{'height': getDescriptionHeight()}">
            <template v-for="prescriptionDetail in prescriptionDetailRows" :key="prescriptionDetail.id_prescription_detail">
              <template v-if="prescriptionDetail.flg_group_title">
                <div
                  :class="prescriptionDetail.flg_group_title && prescriptionDetail.type_detail == 4 ? 'border-bottom' : '' ">
                  <div class="q-pb-xs q-mt-sm">{{ prescriptionDetail.name_prescription_display }}</div>
                  <div v-if="prescriptionDetail.flg_group_title && prescriptionDetail.type_detail == 5">
                      <span v-if="prescriptionDetail.total_days_dose">
                      {{
                          ' ' +
                          roundZeroAfterPoint(prescriptionDetail.total_days_dose) +
                          comTypeDose(
                            typeDoseQuantityUI(
                              prescriptionDetail.id_dosage_frequency
                            ).typeDoseUI
                          ) +
                          ' x 頻度 ' + ' ' + prescriptionDetail?.name_dose_formal
                        }}
                      </span>
                    <span class="text-grey-700 q-ml-md" style="font-size: 11px;">総服用回数: </span>
                    <span> 
                        {{ quantityDose(prescriptionDetail) }} 回分
                      </span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="flex column">
                  <div>{{ prescriptionDetail.name_prescription_display }}
                    <span v-if="prescriptionDetail.name_medicine_format == '錠'" class="q-ml-lg">
                            {{ prescriptionDetail.fraction }}
                     </span>
                  </div>
                </div>
                <!--                DONt show these for plus item -->
                <div v-if="prescriptionDetail.type_detail != 2">
                  <span v-if="prescriptionDetail.total_days_dose">
                      {{
                        ' ' +
                        roundZeroAfterPoint(prescriptionDetail.total_days_dose) +
                        comTypeDose(
                          typeDoseQuantityUI(
                            prescriptionDetail.id_dosage_frequency
                          ).typeDoseUI
                        ) + ' x 頻度 ' + ' ' + prescriptionDetail?.name_dose_formal
                      }}
                    </span>
                    <span class="text-grey-700 q-ml-md" style="font-size: 11px;">総服用回数: </span>
                    <span> 
                      {{ quantityDose(prescriptionDetail) }} 回分
                    </span>
                  </div>
                </template>
                <div class="absolute-bottom-right bottom-desc-text">
                  お大事になさってください。
                </div>
            </template>
         </div>
         <div class="text-grey-900 q-mt-md">
           <div>※お薬は獣医師の指示に従って飲ませて下さい。</div>
           <div>　ご不明な点などございましたら遠慮なくお問い合わせください。</div>
         </div>
         <div class="row q-mt-md q-pa-sm">
           <div class="col-9 flex items-start" style="flex-wrap: nowrap">
             <div class="footer-logo" style="flex-basis: 10%" v-if="clinicData?.logo_file_path1"><img :src="clinicData?.logo_file_path1" /></div>
             <div :class="clinicData?.logo_file_path1 ? 'q-ml-md' : ''">
               <div class="flex items-start">
                 <div class="text-grey-900">
                   <span v-if="clinicData?.name_clinic_display" class="text-weight-bold body1 text-h4">{{clinicData.name_clinic_display}}</span>
                   <div v-if="clinicData?.address_prefecture || clinicData?.address_city || clinicData?.address_other">
                     {{ concatenate(clinicData.address_prefecture, clinicData.address_city, clinicData.address_other) }}
                   </div>
                   <div v-if="clinicData?.phone1">Tel. {{clinicData.phone1}}</div>
                   <div v-if="clinicData?.memo_consultation_hours" class="ellipsis" :style="{'max-width': clinicData?.logo_file_path1 ? '460px' : '520px'}">営業時間：{{clinicData.memo_consultation_hours}}</div>
                   <div v-if="clinicData?.date_closed" class="ellipsis" :style="{'max-width': clinicData?.logo_file_path1 ? '460px' : '520px'}">休診日: {{clinicData.date_closed}}</div>
                 </div>
               </div>
             </div>
           </div>  
           <div class="col-3 row justify-right relative-position">
             <div class="absolute-right">
               <div class="text-center">担当
                 <span v-if="getEmployee(pdfSettingsData.id_employee_doctor)">
                 {{
                     getEmployee(pdfSettingsData.id_employee_doctor)
                       ?.name_family + ' '
                     + getEmployee(pdfSettingsData.id_employee_doctor)
                       ?.name_first
                   }}
                </span>
               </div>
               <div class="bottom-card q-pa-sm q-mt-sm"></div>
             </div>
           </div>
         </div>
         <template v-if="idx + 1 != singlePrescriptionDetailList">
           <div class="html2pdf__page-break"></div>
          </template>
       </div>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.main-container {
  font-size: 15px;
}
.border-description {
  border-radius: 5px;
  border: 1px solid #000;
  width: 100%;
  .bottom-desc-text {
    right: 20px;
    bottom: 20px;
  }
}
.footer-logo img {
  width: 100%;
  object-fit: contain;
}
.bottom-card {
  width: 70px;
  height: 70px;
  border: 1px solid $primary;
}
.border-bottom {
  border-bottom: 1px solid $primary;
}
</style>