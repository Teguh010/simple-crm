<script lang="ts" setup>
import { nextTick, ref, computed, onMounted } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '@/stores/common'
import useLabStore from '@/stores/labs'
import useClinicStore from '@/stores/clinics'
import usePetBioStore from '@/stores/pet-bios'
import useCliCommonStore from '@/stores/cli-common'
import useRequestStore from '@/stores/requests'
import 
 { 
   dateDifferences,
   filterRows,
   getCustomerName,
   getImage,
   aahTruncate,
   dateFormat,
   getCurrentPetAge,
   getPetFirstName,
   convertWeightInG,
   getDateToday,
   decoder,
   concatenate
 } from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import { typePetGender, typeBodyWeight, codeCliCommonList, codeCommonList } from '@/utils/enum'
import { LAB } from '../master/lab/types_lab'
import { ClinicType, LabResult } from '@/types/types'
import useServiceDetailStore from '@/stores/service-details'

interface Props {
  resultList: any[],
  callback?: (pdf_blob: Blob, pdfFileName: string) => void,
  defaultConfiguration: Record<string, any>,
  pdfAttributes: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  resultList: [],
  defaultConfiguration: {},
  pdfAttributes: {}
})
const serviceDetailStore = useServiceDetailStore()
const emits = defineEmits(['close'])
const exportPdf = ref()
const registeredDate = ref('')

const BLUE:string = '1', BLACKGREY:string = '2'

const isBlue = computed(() => props.defaultConfiguration.color === BLUE)
const showIcons = computed(() => props.defaultConfiguration.flgShowIcons)
const showValResultBg = computed(() => props.defaultConfiguration.flgShowValResultBg)
const { getServiceDetail } = storeToRefs(serviceDetailStore)

const columns = ref([
  {
    name: "name_lab",
    label: "検査項目",
    align: "left",
    field: "name_lab",
    style: "width: 30%"
  },
  {
    name: "val_result",
    label: "検査結果",
    align: "left",
    field: "val_result",
    style: "width: 10%"
  },
  {
    name: "range",
    label: "基準値",
    align: "left",
    field: "range",
    style:"width: 10%"
  },
  {
    name: "memo",
    label: "考えられる異常",
    align: "left",
    field: "memo",
    style: "width: 50%"
  },
])

const rows = ref([])

const customerStore = useCustomerStore()
const { getCustomer, getPet } = storeToRefs(customerStore)
const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList } = storeToRefs(commonStore)
const labStore = useLabStore()
const { getLabs } = storeToRefs(labStore)
const clinicStore = useClinicStore()
const clinic = ref<ClinicType>()
const clinicData = ref()
const petBioStore = usePetBioStore()
const cliCommonStore = useCliCommonStore()
const { getCliCommonHairColorList } = storeToRefs(cliCommonStore)
const requestStore = useRequestStore()

const imagePath = ref('')

const labResultWithSDList = ref([] as any[])

const fetchLabResultWithSDList = async () => {
  for (const item of props.resultList) {
    if (item.flgSDRow) {
      await serviceDetailStore.fetchServiceDetailById(item.id_service_detail);

      if (serviceDetailStore.getServiceDetail) {
        labResultWithSDList.value.push({ ...item, ...serviceDetailStore.getServiceDetail });
      }
    } else {
      labResultWithSDList.value.push(item);
    }
  }
}

const init = async () => {
  imagePath.value = await getImage(clinicData?.logo_file_path1)

  await fetchLabResultWithSDList()

  console.log('labResultWithSDList.value', labResultWithSDList.value)

  let firstLabResult:any = labResultWithSDList.value.find((item: any) => !item.flgNameRow)
  if(firstLabResult) registeredDate.value = dateFormat(firstLabResult?.datetime_registered)
  await nextTick()
  const [clinicPromiseData, petBioInfo] = await Promise.all([
    fetchClinic(clinic.value?.clinic?.id_clinic),
    petBioStore.fetchPetBio({
      id_pet: getPet.value?.id_pet,
      id_customer: getCustomer.value?.id_customer,
      fetch_weight: true
    }),
    cliCommonStore.fetchPreparationCliCommonList({
      code_cli_common: [codeCliCommonList[7].value]
    }),
    commonStore.fetchPreparationCommonList({
      code_common: [codeCommonList[1].value]
    })
  ])
  clinicData.value = clinicPromiseData
  await nextTick()
  if(clinicData.value?.logo_file_path1) clinicData.value.logo_file_path1 = await getImage(clinicData.value?.logo_file_path1)
  await nextTick()
  if(clinicData.value?.logo_file_path2) clinicData.value.logo_file_path2 = await getImage(clinicData.value?.logo_file_path2)
  await nextTick()
  const rowsPerPage = calculateRowsPerPage()
  rows.value = exportPdf.value.populateRowsPerPage(labResultWithSDList.value, rowsPerPage)
  console.log('rows.value', rows.value)
  await nextTick()
  generateReport()
  close()
}

const showPetBioDate = computed(() => {
  if (petBioStore.getPetBio?.datetime_measure && registeredDate.value) {
    const petBioDate = new Date(petBioStore.getPetBio?.datetime_measure);
    const regDate = new Date(registeredDate.value);
    const diffDays = (regDate.getTime() - petBioDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }
  return true;
});

function generateReport() {
  let imagePDFOptions:any = {quality: .95}, jsPDFOptions:any = { orientation: 'portrait' }, pagesNumber:Number = 0
  if(props.callback){
    exportPdf.value.getPdfBlob(getPdfName(), pagesNumber, jsPDFOptions, imagePDFOptions).then((blob: Blob) => {
      props.callback(blob, `${getPdfName()}.pdf`)
    })
  } else if (props.pdfAttributes.labResult.mode === 'download') {
    exportPdf.value.generateReport(getPdfName(), pagesNumber, jsPDFOptions, imagePDFOptions)
  } else if (props.pdfAttributes.labResult.mode === 'print') {
    exportPdf.value.generateReport(
      getPdfName(),
      pagesNumber,
      jsPDFOptions,
      imagePDFOptions,
      props.pdfAttributes.labResult.mode
    )
  }
  props.pdfAttributes.labResult.render = false
}

function getPdfName() {
  let LabGroupName = labResultWithSDList.value.length ? labResultWithSDList.value[0]?.name_category : ''
  LabGroupName = labResultWithSDList.value.length > 1 ? `${LabGroupName}_検査結果` : LabGroupName
  return `${date.formatDate(Date.now(), 'YYYYMMDD')}_${LabGroupName}_${getCustomerName(getCustomer.value)}様`
}

const showValResult = (value: LabResult) => {
  if (value) {
    if (value.val_result == 'null' || !value.val_result) return ''

    const v1 = value.val_result?.toString()?.replace(',','')
    if (parseFloat(v1) > parseFloat(value.high))
      return `<span style="margin-left: 2px;color: red">${value.val_result}${showIcons.value ? '<small style="margin-left: 2px" class="font-5px">▲</small>' : ''}</span>`
    else if (parseFloat(v1) < parseFloat(value.low))
      return `<span style="margin-left: 2px;color: blue">${value.val_result}${showIcons.value ? '<small style="margin-left: 2px" class="font-5px">▼</small>' : ''}</span>`
    return value.val_result
  }
  return ''
}
const showQualifier = (value: LabResult) => {
  if (value) {
    if (value.qualifier == '*') return ''

    return `<span>${value.qualifier ? value.qualifier : ''}</span>`
  }
  return ''
}

async function fetchClinic(idClinic: String) {
  if(!idClinic) {
    idClinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
  let clinic:any = await clinicStore.fetchClinicById(idClinic)
  return clinic
}

const typeAnimalName = (value) => getCommonTypeAnimalOptionList.value.find((v) => v.value === value)
const typeBreedName = (value) => getCommonBreedOptionList.value.find((v) => v.value === value)
const typePetGenderName = (value) => typePetGender.find((v) => v.value === value)
const typeLabUnitName = (value) => commonStore.getCommonUnitOptionList.find(item => item.id_common === value)?.name_common
const getLabMemo = (value) => getLabs.value.find((v) => v.code_lab === value)?.memo_lab
const typeBodyWeightName = (value: number) => typeBodyWeight.find((v) => v.value === value)?.label
const hairColorName = (value: number) =>  getCliCommonHairColorList.value.find((v) => v.id_cli_common == value)?.name_cli_common

const getHeaderClasses = (col: object, idx: number, allCols) => {
  let classes = ['border-left border-bottom']
  if(col.field === 'memo') classes.push('border-right')
  if(isBlue.value){
    classes.push('border-2C65D7 border-top')
    if(col.field === 'name_lab') classes.push('bg-EFF5FF')
    else classes.push('bg-white')
  }
  else classes.push('border-bottom-black border-000 border-top')
  classes.push(idx === 0 ? 'radius-top-left' : idx === allCols.length - 1 ? 'radius-top-right' : '')
  return classes
}

const getContentLength = (row) => {
  const content = showQualifier(row) + showValResult(row)
  const plainText = content?.replace(/<\/?(span|small)[^>]*>/gi, '');
  return plainText.length
}

const getNameLab = (row) => {
  if(row.lab && Object.keys(row.lab).length) return row.lab?.name_lab
  if(row.name_lab) return row.name_lab
  if(row.lab && Object.keys(row.lab).length && row.lab.name_lab_en) return row?.lab.name_lab_en?.replace('%', '')
  return row?.name_lab_en?.replace('%', '')
}

const isClinicNameLong = computed(() => {
  if (clinicData.value && clinicData.value.name_clinic_display) {
    return clinicData.value.name_clinic_display.length > 11
  }
  return false
})

function close() {
  emits('close')
}

const calculateRowsPerPage = (): number[] => {
  const DEFAULT_FIRST_PAGE_ROWS = 30, DEFAULT_MIDDLE_PAGE_ROWS = 45, totalRows = labResultWithSDList.value.length

  let pages: number[] = [], rowsCount = 0, currentPage = 0

  while (rowsCount < totalRows) {
    let maxRows = currentPage === 0 ? DEFAULT_FIRST_PAGE_ROWS : DEFAULT_MIDDLE_PAGE_ROWS
    let additionalRows = 0

    for (let i = 0; i < maxRows && rowsCount + i < totalRows; i++) {
      const row = labResultWithSDList.value[rowsCount + i]

      if (row?.flgNameRow) {
        if (i !== 0) additionalRows++
      } else if (row?.flgSDRow && row?.memo_service) {
        const memoService = row?.memo_service || '';
        const newlineCount = memoService.split('\n').length - 1;

        if (i !== 0) {
          additionalRows++
          additionalRows += newlineCount;
        }
      } else if (
        row?.lab?.flg_above_blank_row ||
        row?.lab_set_device?.flg_above_blank_row ||
        row?.lab_set?.flg_above_blank_row ||
        row?.lab_device?.flg_above_blank_row
      ) {
        additionalRows += 0.5
      } else if (row?.lab?.memo_lab?.length >= 40) {
        additionalRows += 0.5
      }
    }
    const rowsToAdd = maxRows - Math.max(Math.ceil(additionalRows - 4), 0)
    
    pages.push(rowsToAdd)
    rowsCount += rowsToAdd
    currentPage++
  }

  return pages
}

const getLabEnName = (row) => {
  return row.lab?.name_lab_en ? row.lab?.name_lab_en?.replace('%', ' '): row.name_lab_en?.replace('%',' ')
}
const getLabName = (row) => {
  return row?.lab?.name_lab_en || row?.lab?.name_lab
    ? (row?.lab?.name_lab_en == row?.lab?.name_lab
      ? ''
      : row?.lab?.name_lab)
    : (row?.name_lab_en == row?.name_lab
      ? ''
      : row?.name_lab)
}

onMounted(() => {
  clinic.value = clinicStore.getClinic
  init()
})

</script>

<template>

  <div class="q-pa-md page-inner-body" v-show="false">
    <PdfExport ref="exportPdf" sheetName="lab_result" />
    <q-card id="element-to-print" style="max-width: 1000px; margin: auto" class="bg-white q-pa-none" square>
      <div class="card-pdf-main-border-1px q-px-md q-pt-md" style="max-height: 1122.5px; overflow: hidden" v-for="(page, idx) in filterRows(rows)" :key="idx">
        <div class="flex justify-between items-end">
          <div
            class="flex items-center justify-between title"
            :class="isBlue ? 'border-2C65D7' : ''"
            :style="{flexBasis: `${isClinicNameLong ? 58 : 50}` + '%'}">
            <div class="text-weight-bold" style="font-size: 18px;" :class="isBlue ? 'text-2C65D7' : ''">検査結果</div>
            <div class="flex items-center">
              <img
                v-if="clinicData?.logo_file_path2 || clinicData?.logo_file_path1"
                :src="clinicData?.logo_file_path2 || clinicData?.logo_file_path1"
                :style="{
                  maxWidth: '100%',
                  height: '30px',
                  objectFit: 'contain',
                }"
                class="q-mr-sm"
              />
              <template v-else>
                <!-- <img v-if="clinicData?.logo_file_path1" :src="clinicData?.logo_file_path1" style="width: 21px;height: 21px; object-fit: contain;" class="q-mr-sm" /> -->
                <img :src="imagePath" style="width: 21px;height: 21px; object-fit: contain;" class="q-mr-sm"  />
                <div class="text-weight-medium">{{clinicData.name_clinic_display || ''}}</div>
              </template>
            </div>
          </div>
          <div
            class="flex justify-end"
            :style="{flexBasis: `${isClinicNameLong ? 42 : 50}` + '%'}"
          >
            <span class="q-mr-sm" :class="isBlue ? 'text-2C65D7' : ''">検査日</span> {{registeredDate}}
          </div>
        </div>

        <div v-if="idx === 0" class="row q-mt-md font-13px">
          <div class="col q-pr-sm">
            <div class="row">
              <div class="col-5">
                <div class="border-left border-top q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'"
                  style="border-top-left-radius: 6px;">
                  オーナー様名
                </div>
              </div>
              <div class="col-7">
                <div class="border-top border-left border-right q-pa-xs q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'"
                  style="border-top-right-radius: 6px;">
                  <span class="q-mr-xs">{{getCustomer.code_customer}}</span>{{getCustomerName(getCustomer)}} <span class="q-ml-xs">様</span>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <div class="border-left border-top q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'">ペット名</div>
              </div>
              <div class="col-7">
                <div class="border-top border-left border-right q-pa-xs q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'">
                  <span class="q-mr-xs">{{ getPet.code_pet }}</span>
                  {{ getPetFirstName(getPet) }}

                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <div class="border-left border-top  q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'"
                 >
                  体重
                </div>
              </div>
              <div class="col-7">
                <div class="border-top border-left border-right q-pa-xs q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'"
                 >
                  {{ parseFloat(convertWeightInG(petBioStore.getPetBio?.val_weight, petBioStore.getPetBio?.type_body_weight))?.toFixed(2) }}
                  <small class="text-grey-600 q-pr-xs">{{ typeBodyWeightName(petBioStore.getPetBio?.type_body_weight) }}</small>
                  <small v-if="showPetBioDate" class="text-grey-800 q-ml-md">{{dateFormat(petBioStore.getPetBio?.datetime_measure)}}</small>
                </div>  
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <div class="border-left border-top border-bottom q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'"
                  style="border-bottom-left-radius: 6px;">
                  体温
                </div>
              </div>
              <div class="col-7">
                <div class="border-top border-left border-right border-bottom q-pa-xs q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'"
                  style="border-bottom-right-radius: 6px;"> 
                  <template v-if="petBioStore.getPetBio?.val_temperature">
                    {{ parseFloat(petBioStore.getPetBio?.val_temperature)?.toFixed(2) }}°C
                  </template>
                </div>  
              </div>
            </div>
          </div>

          <div class="col q-pl-sm">
            <div class="row">
              <div class="col-5">
                <div class="radius-top-left border-left border-top q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'">動物種</div>
              </div>
              <div class="col-7">
                <div class="radius-top-right border-top border-left border-right q-pa-xs q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'">{{ typeAnimalName( getPet?.id_cm_animal )?.label }}</div>
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <div class="border-left full-height items-center border-top q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'">品種</div>
              </div>
              <div class="col-7">
                <div
                  class="border-top border-left border-right q-pa-xs q-pl-sm full-height"
                  :class="[isBlue ? 'border-2C65D7' : 'border-000', (typeBreedName( getPet?.id_cm_breed )?.label + hairColorName(getPet.id_cm_hair))?.length >= 20 ? 'font-10px' : 'font-13px']"
                >
                  {{ typeBreedName( getPet?.id_cm_breed )?.label }}
                  {{ hairColorName(getPet.id_cm_hair) }}
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <div class="border-left border-top q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'">性別</div>
              </div>
              <div class="col-7">
                <div class="border-top border-left border-right q-pa-xs q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'">{{ typePetGenderName(getPet.type_pet_gender)?.label }}</div>
              </div>
            </div>
            <div class="row">
              <div class="col-5">
                <div class="radius-bottom-left border-left border-top border-bottom q-pa-xs q-pl-sm" :class="isBlue ? 'border-2C65D7 bg-EFF5FF text-2C65D7' : 'bg-grey-200 border-000'"
                  style="border-bottom-left-radius: 6px;">
                  生年月日
                </div>
              </div>
              <div class="col-7">
                <div class="radius-bottom-right border-top border-left border-right q-pa-xs border-bottom q-pl-sm full-height" :class="isBlue ? 'border-2C65D7' : 'border-000'">{{ getPet.date_birth }} ({{ getCurrentPetAge(getPet) }})</div>
              </div>
            </div>
          </div>
        </div>

        <div class="row full-width q-mt-lg">
          <div class="col-12 relative-position" :style="{'height': idx === 0 ? '910px' : '1050px', 'overflow': 'hidden'}">
            <q-table :rows="filterRows(page)" :columns="columns" row-key="number" style="table-layout: fixed; width: 100%; border: 0;"
              :rows-per-page-options="[page.length]" hide-bottom flat class="lab-result-table">
              <template v-slot:header="props">
                <q-tr :props="props" v-if="page.length > 0">
                  <q-th 
                    v-for="(col, idx) in props.cols"
                    :key="col.name" :props="props"
                    class="q-pa-sm"
                    :class="getHeaderClasses(col, idx, props.cols)"
                    :colspan="col.field === 'name_lab' ? '30%' : col.field === 'memo' ? '50%' : '10%'">
                    <div class="font-10px text-weight-bold text-center" :class="isBlue ? 'text-2C65D7' : 'text-grey-800'">
                      {{ col.label }}
                    </div>
                  </q-th>
                </q-tr>
              </template>
              <template v-slot:body="props">
                <template v-if="props.row.flgNameRow">
                  <q-tr v-if="props.rowIndex !== 0">
                    <q-td colspan="100%" style="height: 16px !important; border: 0;"></q-td>
                  </q-tr>
                  <q-tr class="q-mt-md" style="border: 0 !important">
                    <q-td colspan="100%" class="border-left border-right"
                    :class="[isBlue ? 'bg-D5E3FF border-2C65D7' : 'bg-grey-300 border-000', props.rowIndex !== 0 ? 'border-top' : '', 
                            props.rowIndex != 0 ? 'radius-top-left radius-top-right' : '',
                            props.rowIndex === page.length - 1 ? 'border-bottom radius-bottom-left radius-bottom-right' : '']">
                      <div class="font-10px text-weight-bold flex justify-between full-width" :class="isBlue ? 'text-2C65D7' : 'text-black'">{{props.row.name_category}}<span class="q-ml-md">{{props.row.registeredDate}}</span></div>
                    </q-td>
                  </q-tr>
                </template>
                <template v-else-if="props.row.flgSDRow">
                  <template v-if="props.row?.memo_service">
                    <q-tr class="q-mt-md" style="border: 0 !important">
                      <q-td colspan="100%" style="border: 0 !important">
                        <div class="row font-10px q-mt-md">
                          <div class="col-12">
                            <div class="border-top border-left border-bottom border-right q-pa-xs q-pl-sm full-height radius-top-left radius-top-right radius-bottom-left radius-bottom-right" 
                            :class="isBlue ? 'border-2C65D7' : 'border-000'">
                              <div class="font-15px" v-html="decoder(props.row?.memo_service)"></div>
                              <div class="text-2C65D7">{{ props.row?.number_service_detail }}</div>
                            </div>
                          </div>
                        </div>
                      </q-td>
                    </q-tr>
                  </template>
                </template>
                <template v-else>
                  <template v-if="props.row.lab?.flg_above_blank_row || props.row.lab_set_device?.flg_above_blank_row || props.row.lab_set?.flg_above_blank_row || props.row.lab_device?.flg_above_blank_row">
                    <q-tr
                      :class="[
                        isBlue ? 'border-2C65D7 border-left border-right border-bottom' : 'border-left border-000 border-right border-bottom'
                      ]"
                      style="height: 6px"
                    >

                    </q-tr>
                  </template>
                  <q-tr
                    class=""
                    :class="[
                      ((props.rowIndex % 2) == '0') ? 'bg-grey-200' : '',
                    ]"
                  >
                    <q-td colspan="30%" class="font-13px" :class="[(page[props.rowIndex + 1]?.flgNameRow || page[props.rowIndex + 1]?.flgSDRow || props.rowIndex === page.length - 1) ? 'radius-bottom-left' : '', (props.rowIndex === filterRows(page).length - 1) && isBlue ? 'border-bottom radius-bottom-left' : 'border-bottom', isBlue ? 'bg-EFF5FF border-2C65D7 border-left' : 'border-left border-000']">
                      <div
                        class="flex no-wrap full-width items-center"
                        :class="[
                          isBlue ? 'text-2C65D7' : 'text-black',
                          props.row.lab?.flg_indent || props.row.lab_set_device?.flg_indent || props.row.lab_set?.flg_indent || props.row.lab_device?.flg_indent ? 'q-pl-md' : ''
                        ]"
                      >
                        <div class="q-mr-md" :class="getLabEnName(props.row)?.length > 12 ? 'font-9px' : 'font-13px'">
                          <b>{{
                            getLabEnName(props.row)
                          }}</b>
                        </div>
                        <div class="ellipsis" :class="getLabName(props.row)?.length + getLabEnName(props.row)?.length > 12 ? 'font-9px' : 'font-13px'">
                          {{
                            getLabName(props.row)
                          }}
                        </div>
                        <small class="q-ml-md">{{ typeLabUnitName(props.row.id_cm_unit ? props.row.id_cm_unit : props.row.lab_set_device?.id_cm_unit) }}</small>
                      </div>
                    </q-td>
                    <q-td colspan="10%" class="text-center border-left" :class="[(props.rowIndex === filterRows(page).length - 1) && isBlue ? 'border-bottom' : 'border-bottom', isBlue ? 'bg-white border-2C65D7' : 'border-000 text-black text-weight-bold', getContentLength(props.row) >= 7 ? 'font-10px' : 'font-13px']">
                      <div :class="!isBlue ? 'text-weight-bold' : ''" 
                      :style="{'width': '100%;', 'line-height': getContentLength(props.row) >= 7 ? 1.2 : ''}"
                        v-html="showQualifier(props.row) + showValResult(props.row)">
                      </div>
                    </q-td>
                    <q-td colspan="10%" class="font-10px border-left text-center" :class="[isBlue ? 'bg-white border-2C65D7 text-2C65D7' : 'text-black border-000', (props.rowIndex === filterRows(page).length - 1) && isBlue ? 'border-bottom' : 'border-bottom']">
                      <div v-if="props.row.low && props.row.high" class="flex no-wrap justify-center items-center text-center">
                        {{ props.row.low }} ~ {{ props.row.high }}
                      </div>
                    </q-td>
                    <q-td colspan="50%" class="border-left memo-lab-class" 
                    :class="[isBlue ? 'bg-white border-2C65D7' : 'border-000', (page[props.rowIndex + 1]?.flgNameRow || page[props.rowIndex + 1]?.flgSDRow || props.rowIndex === page.length - 1) ? 'radius-bottom-right' : '', (props.rowIndex === filterRows(page).length - 1) && isBlue ? 'border-bottom radius-bottom-right' : 'border-bottom', isBlue ? 'text-2C65D7 border-right' : 'text-black border-right']">
                      <div class="ellipsis ellipsis-2-lines" style="white-space: break-spaces;word-break: break-all"
                        :class="((props.row?.lab_set_device ? props.row?.lab_set_device : (props.row?.lab_device ? props.row?.lab_device : props.row?.lab_set) ?? props.row?.lab)?.memo_lab)?.length >= 45 ? 'font-7px' : 'font-10px'"
                      >
                        {{ aahTruncate(
                          (props.row?.lab_set_device ? props.row?.lab_set_device : (props.row?.lab_device ? props.row?.lab_device : props.row?.lab_set) ?? props.row?.lab)?.memo_lab
                          , 125
                        ) }}
                      </div>
                    </q-td>
                  </q-tr>
                </template>
              </template>
            </q-table>

            <div
              class="absolute-bottom flex justify-between q-bt"
              :class="isBlue ? 'text-2C65D7 border-2C65D7' : 'border-000'"
            >
              <div class="flex items-center">
                <p>
                  <small>印刷日 : {{ dateFormat(getDateToday(), 'YYYY/MM/DD') }}</small>
                </p>
                <p class="text-weight-bold q-ml-sm">
                  <small>{{ clinic?.name_clinic_display }}</small>
                </p>
                <p class="q-ml-sm">
                  <small>
                    {{
                      `〒${clinic?.zip_code} ${concatenate(
                        (clinic?.address_prefecture || ''),
                        (clinic?.address_city || ''),
                        (clinic?.address_other || '')
                      )}`
                    }}
                  </small>
                </p>
              </div>
              <div class="text-right">{{ idx + 1 }}/{{ rows.length }}</div>
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

<style src="../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
  .border-left {
    border-left: 1px solid $grey-300 !important;
  }
  .border-right {
    border-right: 1px solid $grey-300 !important;
  }
  .border-bottom {
    border-bottom: 1px solid $grey-300 !important;
  }
  .border-top {
    border-top: 1px solid $grey-300 !important;
  }
  .lab-result-table {
    border: 0;
    :deep(.scroll){
      overflow: hidden;
    }
    :deep(.q-table) {
      table-layout: fixed;
    }
    tbody tr > td {
      height: 24px !important;
    }
  }
  .title {
    border-bottom: 4px solid #000;
    padding: 0 10px 2px;
  }
  .text-2C65D7 {
    color: #2C65D7;
  }
  .border-2C65D7 {
    border-color: #2C65D7 !important;
  }
  .border-000 {
    border-color: #000 !important;
  }
  .bg-EFF5FF {
    background: #EFF5FF;
  }
  .bg-D5E3FF {
    background: #D5E3FF;
  }
  .bg-lightgrey {
    background-color: rgba(236, 248, 255, 0.7)
  }
  .border-top-black { border-top-color: #000 !important; }
  .border-bottom-black { border-bottom-color: #000 !important; }

  .radius-top-left { border-top-left-radius: 6px}
  .radius-top-right { border-top-right-radius: 6px}
  .radius-bottom-left { border-bottom-left-radius: 6px}
  .radius-bottom-right { border-bottom-right-radius: 6px}

  @media print {
  .lab-result-table {
    border-width: 1px;
  }
  body {
    margin: 0;
    padding: 0;
    zoom: 1;
  }
}
.font-5px {
  font-size: 5px !important;
}

</style>