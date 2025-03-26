<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useEmployeeStore from '@/stores/employees'
import useClinicStore from '@/stores/clinics'
import {
  concatenate,
  dateFormat,
  decimalToFraction,
  filterRows,
  getDateToday,
  getImage,
  getPetFirstName
} from '@/utils/aahUtils'
import { date } from 'quasar'
import html2pdf from 'html2pdf.js'
import useCommonStore from '@/stores/common'
import { CustomerType, PetType } from '@/types/types'
import { getFractionForm } from './prescriptionUtils'

interface Props {
  resultList: Array<any> | any
  pdfSettingsData: {
    type_name: string
    flg_display_doses_taken: boolean
    flg_display_classification_name: boolean
    flg_show_image: boolean
    flg_display_duration_use: boolean
    flg_memo_dose_display: boolean
    flg_display_memo_clinic_prep: boolean
    flg_display_memo_efficacy: boolean
    flg_display_memo_sideeffect: boolean
    flg_display_doctor: boolean
    flg_dosage_detail: boolean
    flg_fraction: boolean
    id_employee_doctor: number
    type_print: any
    type_print_bag: number
    type_print_bag_title: number
    type_print_template: any
    flg_print_all_in_one: boolean
    date_start: string
  }
  prescriptionHeader: Object
  jsPDFData: Object
  getPet: (id_pet: number) => PetType
  getCustomer: (id_customer: number) => CustomerType
  prescriptionPdfAttributes: Object
  flgPdfDirectDownload: Boolean
}

const props = withDefaults(defineProps<Props>(), {
  resultList: [],
  pdfSettingsData: {},
  prescriptionHeader: {},
  jsPDFData: {},
  getPet: () => {},
  getCustomer: () => {},
  prescriptionPdfAttributes: {},
  flgPdfDirectDownload: true
})

const employeeStore = useEmployeeStore()
const clinicStore = useClinicStore()

const emits = defineEmits(['close'])
const flgIndividualPrint: boolean = !props.pdfSettingsData.flg_print_all_in_one
const exportPdf = ref()
const clinicData = ref()
const startPage: number = flgIndividualPrint ? 2 : 4 // incase of untick, one ISU name row and PD row
const midPage: number = flgIndividualPrint ? 2 : 6 // incase of untick, one ISU name row and PD row
const clinic = ref(JSON.parse(localStorage.getItem('clinic')) ?? '')

const petDetail = props.getPet(props.prescriptionHeader?.id_pet)

const columns = ref([
  {
    name: 'medicine_name',
    label: 'お薬名',
    align: 'left',
    field: 'medicine_name',
    headerStyle: 'width: 20%'
  },
  {
    name: 'dosage_frequency',
    label: '服用頻度',
    align: 'left',
    field: 'dosage_frequency',
    headerStyle: 'width: 80%'
  }
])

const rows = ref([])

async function init() {
  const resultList = populateISURows()

  clinicData.value = await fetchClinic(clinic?.id_clinic)
  if (clinicData.value?.logo_file_path1)
    clinicData.value.logo_file_path1 = await getImage(
      clinicData.value.logo_file_path1
    )
  await nextTick()
  rows.value = exportPdf.value.populateRows(
    resultList,
    startPage,
    midPage,
    0,
    0,
    props.pdfSettingsData,
    460
  )
  await nextTick()
  if (props.flgPdfDirectDownload) return generateReport()
  return generateAndPrintPDF()
}

const getFraction = (totalDosage, row) => {
  const totalPill = Number(totalDosage) * Number(row)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {
    if (parseInt(Number(row)) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
  return ''
}

function customRound(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.9) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.1) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}

function customRoundV1(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.75) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.1) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
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
  if (iframePdf) iframePdf.remove()
  html2pdf()
    .set(options)
    .from(element)
    .toPdf()
    .get('pdf')
    .then(function (pdf) {
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

      iframe.onload = function () {
        setTimeout(() => {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        }, 300)
      }
      props.prescriptionPdfAttributes.description.render = false
    })
}

function generateReport() {
  let imagePDFOptions: any = { quality: 0.5 },
    jsPDFOptions = {
      ...props.jsPDFData,
      format: [148, 210],
      orientation: 'portrait'
    }
  exportPdf.value.generateReport(
    getFileName(),
    0,
    jsPDFOptions,
    imagePDFOptions
  )
  props.prescriptionPdfAttributes.description.render = false
}

function getFileName() {
  return `${date.formatDate(Date.now(), 'YYYYMMDD')}_処方箋説明書_${
    props.getCustomer(props.prescriptionHeader.id_customer)
      ?.name_customer_display
  }様`
}

function close() {
  emits('close')
}

const getEmployee = (id_employee) => {
  let emp = employeeStore.getEmployees.find(
    (v) => v.id_employee === id_employee
  )

  return emp
}

const getTableCellClasses = (rowProps: object) => {
  let classes = []
  classes.push('font-12px')
  classes.push(
    rowProps.row.flg_group_title && rowProps.row.type_detail == 4
      ? 'bg-lightgrey'
      : ''
  )
  return classes
}

const fetchClinic = async (idClinic: String) => {
  if (!idClinic) {
    idClinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
  let clinic: any = await clinicStore.fetchClinicById(idClinic)
  return clinic
}

const getTotalPillAmount = (row: Object) => {
  return row.calculatedAmount
}

function getUnit(unitId: any) {
  if (typeof unitId == 'string') return unitId
  return (
    useCommonStore().getCommonUnitOptionList.find(
      (unit) => unit.id_common == unitId
    )?.name_common ?? ''
  )
}

const populateISURows = () => {
  const resultRows = []
  for (let i = 0; i < props.resultList.length; i++) {
    const resultRow = props.resultList[i]
    resultRows.push({
      flgIsuNameRow: true,
      nameIsu: resultRow.name_prescription_display,
      name_classification: resultRow?.name_classification,
      multipleISU: resultRow.multipleISU,
      fraction: resultRow.fraction,
      isu_list: resultRow.isu_list,
      name_medicine_formatUI: resultRow?.name_medicine_format
    })
    resultRows.push(resultRow)
  }
  return resultRows
}

function stringifyAndReplaceNewlines(text: string): string {
  const jsonString = JSON.stringify(text)
  const withoutQuotes = jsonString.slice(1, -1) // Remove the surrounding quotes
  return withoutQuotes.replace(/\\n/g, '<br>')
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="page-inner-body" v-show="false">
    <PdfExport ref="exportPdf" sheetName="_注文書" />
    <q-card
      id="element-to-print"
      style="margin: auto; max-width: 1000px"
      class="bg-white"
      square
    >
      <div
        class="card-pdf-main"
        :class="exportPdf?.pdfPerPagePadding()"
        v-for="(page, idx) in rows"
        :key="idx"
      >
        <div class="row justify-between">
          <div class="text-weight-bold text-grey-900 body1">
            おくすり 説明書
          </div>
          <div>{{ idx + 1 }}/{{ rows.length }}</div>
        </div>
        <div>
          <div class="flex items-center font-12px justify-between">
            <div class="text-grey-900 q-my-sm">
              服用または使用する前に必ずお読み下さい。
            </div>
            <div>
              <small class="text-grey-800 q-mr-xs"> 発行日： </small>
              {{ dateFormat(getDateToday(), 'YYYY年 MM月 DD日') }}
            </div>
          </div>
          <div class="bottom-border flex items-center justify-between">
            <div class="font-12px">
              <span class="q-mx-md"
                >{{
                  props.getCustomer(props.prescriptionHeader?.id_customer)
                    ?.name_customer_display
                }}
                様</span
              >
              <span>{{
                concatenate(petDetail.code_pet, getPetFirstName(petDetail))
              }}</span>
            </div>
            <div class="caption1 regular">
              {{ props.prescriptionHeader.number_prescription }}
            </div>
          </div>
        </div>

        <div class="row full-width q-mt-sm">
          <!-- updating this style height will need to update height on pdfexport file -->
          <div
            class="col-12 relative-position"
            :style="{
              'min-height': '680px'
            }"
          >
            <q-table
              :rows="filterRows(page)"
              :columns="columns"
              row-key="number"
              style="table-layout: fixed; width: 100%"
              class="relative-position prescription-description-table"
              :rows-per-page-options="[page.length]"
              hide-bottom
              flat
            >
              <template v-slot:header="props">
                <q-tr :props="props" v-if="page.length > 0">
                  <q-th
                    v-for="col in props.cols"
                    :colspan="col.field === 'medicine_name' ? '20%' : '80%'"
                    :key="col.name"
                    :props="props"
                    class="bg-white"
                  >
                    <div
                      class="font-10px"
                      :class="
                        col.field === 'medicine_name' ? 'text-center' : ''
                      "
                    >
                      {{ col.label }}
                    </div>
                  </q-th>
                </q-tr>
              </template>
              <template v-slot:body="props">
                <q-tr v-if="props.row.flgIsuNameRow">
                  <q-td
                    colspan="100%"
                    class="bg-lightgrey no-border"
                    :class="props.rowIndex !== 0 ? 'border-top-1' : ''"
                  >
                    <div
                      class="font-10px text-weight-bold flex justify-between"
                    >
                      <div>
                        <span v-if="props.row.nameIsu" class="text-break">
                          {{ props.row.nameIsu }}
                        </span>
                        <span
                          class="text-break"
                          v-if="
                            pdfSettingsData.flg_display_classification_name &&
                            props.row.name_classification
                          "
                          >{{ props.row.name_classification }}</span
                        >
                      </div>
                    </div>
                  </q-td>
                </q-tr>
                <q-tr
                  v-else-if="
                    props.row.flg_group_title && props.row.type_detail === 5
                  "
                  :props="props"
                >
                  <q-td
                    key="dosage_detail"
                    class="q-py-xs no-border font-12px"
                    style="vertical-align: top"
                    colspan="100%"
                  >
                    <section class="row items-center">
                      <small
                        class="text-break"
                        v-if="props.row.name_prescription_display"
                      >
                        {{ props.row.name_prescription_display }}
                      </small>
                      <small v-if="props.row.duration" class="q-ml-lg">{{
                        props.row.duration
                      }}</small>
                    </section>
                    <section class="row items-center">
                      <div class="col-1 row">
                        <small>一回服用分</small>
                      </div>
                      <small class="row q-ml-sm q-mr-xs">:</small>
                      <div class="col">
                        <span>
                          <span v-if="props.row.name_medicine_format === '錠'">
                            {{ getFractionForm(props.row.val_dosage_selected) }}
                          </span>
                          <span v-if="props.row.name_medicine_format !== '錠'">
                            {{ props.row.val_dosage_selected }}</span
                          >
                          {{ props.row.name_medicine_format }}
                        </span>
                        <span class="q-ml-lg">
                          {{ props.row.name_dose_formal }}
                        </span>
                        <span class="q-ml-lg">
                          {{ getTotalPillAmount(props.row) }}回分
                        </span>
                      </div>
                    </section>
                    <section
                      v-if="
                        pdfSettingsData.flg_memo_dose_display &&
                        props.row.memo_dose
                      "
                      class="row items-center"
                    >
                      <div class="col-1 row text-grey-800">
                        <small>服用メモ</small>
                      </div>
                      <small class="row q-ml-sm q-mr-xs">:</small>
                      <div class="text-break">
                        <!-- {{ props.row.memo_dose }} -->
                        <span
                          v-html="
                            stringifyAndReplaceNewlines(props.row.memo_dose)
                          "
                        >
                        </span>
                      </div>
                    </section>
                    <section
                      v-if="
                        pdfSettingsData.flg_display_memo_sideeffect &&
                        props.row.memo_alert
                      "
                      class="row items-start"
                    >
                      <div class="col-1 row text-grey-800">
                        <small>注意事項</small>
                      </div>
                      <small class="row q-ml-sm q-mr-xs">:</small>
                      <div class="text-break">
                        <!-- {{ props.row.memo_alert }} -->
                        <span
                          v-html="
                            stringifyAndReplaceNewlines(props.row.memo_alert)
                          "
                        >
                        </span>
                      </div>
                    </section>
                    <section
                      v-if="
                        pdfSettingsData.flg_display_memo_clinic_prep &&
                        props.row.memo_clinic_prep
                      "
                      class="row items-center"
                    >
                      <div class="col-1 row text-grey-800">
                        <small>調剤指示（院内メモ）</small>
                      </div>
                      <small class="row q-mr-xs">:</small>
                      <div class="text-break">
                        <!-- {{ props.row.memo_clinic_prep }} -->
                        <small
                          v-html="
                            stringifyAndReplaceNewlines(
                              props.row.memo_clinic_prep
                            )
                          "
                        >
                        </small>
                      </div>
                    </section>
                  </q-td>
                </q-tr>
                <q-tr
                  v-else-if="
                    !(props.row.flg_group_title && props.row.type_detail == 4)
                  "
                  :props="props"
                >
                  <q-td
                    key="medicine_name"
                    colspan="20%"
                    :props="props"
                    class="q-pa-none no-border"
                    :class="getTableCellClasses(props)"
                    v-if="
                      props.row.image_path1_pdf &&
                      pdfSettingsData.flg_show_image
                    "
                  >
                    <div class="pd-image flex justify-center">
                      <img :src="props.row.image_path1_pdf" />
                    </div>
                  </q-td>
                  <q-td
                    key="dosage_frequency"
                    :colspan="
                      props.row.image_path1_pdf &&
                      pdfSettingsData.flg_show_image
                        ? '80%'
                        : '100%'
                    "
                    :props="props"
                    class="q-py-xs no-border"
                    :class="getTableCellClasses(props)"
                    style="vertical-align: top"
                  >
                    <div class="q-mb-xs q-ml-sm">
                      <div
                        v-for="unit in props.row.isu_list"
                        style="min-height: 32px"
                        v-if="pdfSettingsData.flg_display_doses_taken"
                        class="item_name ellipsis full-width q-mt-xs"
                      >
                        <small class="item_name ellipsis full-width">
                          {{ unit.name_unit }}
                          <span
                            v-if="pdfSettingsData.flg_display_duration_use"
                            class="q-ml-lg"
                          >
                            {{ props.row.duration }}
                          </span>
                        </small>
                        <div>
                          <template
                            v-if="
                              pdfSettingsData.flg_dosage_detail &&
                              unit.dosage_detail
                            "
                          >
                            <small> 一回服用分: </small>
                            <span>{{ unit.dosage_detail }}</span>
                            {{ unit.m_unit }}
                          </template>
                          <span class="q-ml-lg">
                            {{ unit.name_dose_formal }}
                          </span>
                          <span class="q-ml-lg">{{ unit.pill_amount }}</span>
                          <span
                            v-if="
                              (props.row.name_medicine_format == '錠' ||
                                props.row.name_medicine_format == 'ｶﾌﾟｾﾙ') &&
                              pdfSettingsData.flg_fraction &&
                              unit.fraction
                            "
                            class="q-ml-lg"
                          >
                            総数 {{ unit.fraction }}
                          </span>
                        </div>
                      </div>
                      <div
                        v-if="
                          pdfSettingsData.flg_memo_dose_display &&
                          props.row.memo_dose
                        "
                        class="flex items-start"
                      >
                        <small
                          class="text-grey-800 q-mr-xs ellipsis"
                          style="max-width: 100%"
                        >
                          服用メモ:
                        </small>
                        <!-- {{ props.row.memo_dose }} -->
                        <div
                          v-if="props.row.type_detail != 5"
                          class="text-break"
                          v-html="
                            stringifyAndReplaceNewlines(props.row.memo_dose)
                          "
                        ></div>
                        <!-- {{ props.row.memo_dose }} -->
                        <div
                          v-if="props.row.type_detail == 5"
                          class="text-break"
                          v-html="
                            stringifyAndReplaceNewlines(props.row.memo_dose)
                          "
                        ></div>
                      </div>
                      <div
                        v-if="
                          pdfSettingsData.flg_display_memo_clinic_prep &&
                          props.row.memo_clinic_prep
                        "
                        class="flex items-center"
                      >
                        <small
                          class="text-grey-800 q-mr-xs ellipsis"
                          style="max-width: 100%"
                        >
                          調剤指示（院内メモ）:
                        </small>
                        <!-- {{ props.row.memo_clinic_prep }} -->
                        <div
                          v-if="props.row.type_detail != 5"
                          class="text-break"
                          v-html="
                            stringifyAndReplaceNewlines(
                              props.row.memo_clinic_prep
                            )
                          "
                        ></div>
                      </div>
                      <div
                        v-if="
                          pdfSettingsData.flg_display_memo_efficacy &&
                          !props.row.flg_group_title &&
                          props.row.memo_efficacy
                        "
                        class="flex items-start"
                      >
                        <small
                          class="text-grey-800 q-mr-xs ellipsis"
                          style="max-width: 100%"
                        >
                          効果効能：
                        </small>
                        <!--IS Medicine data-->
                        <!-- {{ props.row.memo_efficacy }} -->
                        <div
                          class="text-break"
                          v-html="
                            stringifyAndReplaceNewlines(props.row.memo_efficacy)
                          "
                        ></div>
                      </div>
                      <div
                        v-if="
                          pdfSettingsData.flg_display_memo_sideeffect &&
                          props.row.memo_alert
                        "
                        class="flex items-start"
                      >
                        <small
                          class="text-grey-800 q-mr-xs ellipsis"
                          style="max-width: 100%"
                        >
                          注意事項：
                        </small>
                        <!-- {{ props.row.memo_alert }} -->
                        <div
                          class="text-break"
                          v-html="
                            stringifyAndReplaceNewlines(props.row.memo_alert)
                          "
                        ></div>
                      </div>
                    </div>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div class="row q-mt-md absolute-bottom">
              <div class="col-6 font-11px" style="flex-wrap: nowrap">
                <div v-if="clinicData?.logo_file_path1" class="footer-logo">
                  <img
                    style="max-width: 70px; max-height: 70px"
                    :src="clinicData.logo_file_path1"
                  />
                </div>
                <div>
                  <div class="flex items-center">
                    <div class="text-grey-900">
                      <div
                        v-if="clinicData.name_clinic_display"
                        class="text-weight-bold font-14px q-mb-sm"
                      >
                        {{ clinicData.name_clinic_display }}
                      </div>
                      <div
                        v-if="
                          clinicData.zip_code ||
                          clinicData.address_prefecture ||
                          clinicData.address_city ||
                          clinicData.address_other
                        "
                      >
                        {{
                          concatenate(
                            clinicData.zip_code,
                            clinicData.address_prefecture,
                            clinicData.address_city,
                            clinicData.address_other
                          )
                        }}
                      </div>
                      <div class="font-10px" v-if="clinicData.phone1">
                        <span>Tel.{{ clinicData.phone1 }}</span>
                        <span v-if="clinicData.fax" class="q-ml-sm"
                          >Fax. {{ clinicData.fax }}</span
                        >
                      </div>
                      <div v-if="clinicData.memo_consultation_hours">
                        <span class="font-10px">
                          営業時間：{{ clinicData.memo_consultation_hours }}
                        </span>
                      </div>
                      <div v-if="clinicData.date_closed">
                        <span class="font-10px">
                          休診日: {{ clinicData.date_closed }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-6 font-11px">
                <div>
                  <small class="text-grey-800">担当医：</small>
                  <span class="q-ml-sm q-mr-md">
                    {{
                      (getEmployee(pdfSettingsData.id_employee_doctor)
                        ?.name_family || '') +
                      ' ' +
                      (getEmployee(pdfSettingsData.id_employee_doctor)
                        ?.name_first || '')
                    }}
                  </span>
                </div>
                <div class="bottom-card q-pa-sm q-mt-sm">
                  <span
                    v-html="
                      stringifyAndReplaceNewlines(
                        prescriptionHeader.memo_prescription
                      )
                    "
                  />
                </div>
              </div>
              <div class="col-12 top-border font-10px q-mt-md q-mb-sm">
                ※
                お薬の説明は主なものを示しています。ご不明の点がありましたらご相談ください。
              </div>
            </div>
          </div>
        </div>
        <template v-if="idx + 1 != rows.length">
          <div class="html2pdf__page-break"></div>
        </template>
      </div>
    </q-card>
  </div>
</template>
<style src="../../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
.no-border {
  border: 0 !important;
}
.pd-image {
  img {
    max-width: 90px;
    max-height: 90px;
  }
}
.footer-logo img {
  object-fit: contain;
}
.bottom-card {
  border-radius: 5px;
  border: 1px solid #000;
  height: 100px;
}
.bg-lightgrey {
  background-color: rgba(231, 231, 231, 0.7);
  margin: 0px;
  padding: 0px;
}
.prescription-description-table {
  border: 1px solid #000;
  .q-table thead,
  .q-table tr,
  .q-table th,
  .q-table td {
    border-color: #000 !important;
  }
}
.bottom-border {
  border-bottom: 1px solid #000;
}
.top-border {
  border-top: 1px solid #000;
}
.text-break {
  word-break: break-all;
  overflow-wrap: break-word;
  // width: 80%;
  white-space: normal;
}
</style>
