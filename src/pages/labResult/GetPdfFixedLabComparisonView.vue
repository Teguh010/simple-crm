<script setup lang="ts">
import { nextTick, ref, onMounted } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import { storeToRefs } from 'pinia'
import {
  getFullPetName,
  getCurrentPetAge,
  concatenate,
  dateFormat,
  getPetKanaName,
  aahTruncate
} from '@/utils/aahUtils'
import {
  Common,
  ClinicType
} from '@/types/types'
import { date } from 'quasar'

import useLabPrintStore from '@/stores/lab-prints'
import useCustomerStore from '@/stores/customers'
import useCommonStore from '@/stores/common'
import useClinicStore from '@/stores/clinics'
import { orderBy, sortBy } from 'lodash'

const labPrintStore = useLabPrintStore()
const customerStore = useCustomerStore()
const commonStore = useCommonStore()
const clinicStore = useClinicStore()
const { getLabPrint, getLabPrintsByPet } = storeToRefs(labPrintStore)
const { getPet, getCustomer } = storeToRefs(customerStore)
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList } = storeToRefs(commonStore)

const emits = defineEmits(['close'])
const close = () => emits('close')

interface Props {
  idLabPrint: number,
  idPet: number,
  mode: 'download' | 'print',
}

const props = withDefaults(defineProps<Props>(), {
  idLabPrint: -1,
  idPet: -1,
  mode: 'download',
})

const clinic = ref<ClinicType>()
const exportPdf = ref()
const MAX_ROWS_FIRST_PAGE = 56, MAX_ROWS_MID_PAGE = 56
const maxColumns = 12;
const maxRows = 56;
const defaultColumn = {
  name: '',
  label: '',
  align: 'left',
  field: '',
  headerStyle: 'width: auto; min-width: 68px;'
};

const columns = ref([
  {
    name: "name_lab_en",
    label: "検査項目",
    align: "left",
    field: "name_lab_en",
    headerStyle: "width: 10%; min-width: 50px; max-width: 75px;"
  },
  {
    name: "name_lab",
    label: "",
    align: "left",
    field: "name_lab",
    headerStyle: "width: 15%; min-width: 100px; max-width: 140px;"
  },
  {
    name: "unit",
    label: "単位",
    align: "left",
    field: "unit",
    headerStyle: "width: 10%; min-width: 50px; max-width: 50px;"
  },
  {
    name: "range",
    label: "基準値",
    align: "left",
    field: "range",
    headerStyle: "width: 10%; min-width: 50px; max-width: 50px;"
  },
]), rows = ref([

])

const getLabEnName = (row: any) => {
  if (row.type_lab_print == 'pet_bio_info') {
    switch (row.type_pet_bio_info) {
      case 1:
        return '体重'
      case 2:
        return '体温 T'
      case 4:
        return '心拍 P'
      case 8:
        return '呼吸数 R'
    }
  }

  return row.type_lab_print == 'lab_device' ? (row?.lab_device?.name_lab_device || row?.lab?.name_lab) :
    row.type_lab_print == 'lab_set' ? (row?.lab_set?.name_lab_set || row?.lab?.name_lab) :
    row.type_lab_print == 'lab_ref' ? (row?.lab_ref?.name_lab_ref || row?.lab?.name_lab) : ''
}

const init = async () => {
  await nextTick()
  labPrintStore.fetchLabPrintData(props.idLabPrint, props.idPet, true).then(async () => {
    if(getLabPrint.value) {
      const dateList = [] as string[]
      getLabPrint.value?.[0]?.lab_print_items?.forEach((item) => {
        if (item.lab_results) {
          item.lab_results?.forEach((v) => {
            if (v.key && !dateList.includes(v.key) && dateList.length <= 12) {
              dateList.push(v.key)
              dateList.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            }
          })
        }

        if (item.pet_bio_info) {
          item.pet_bio_info?.forEach((v) => {
            if (v.key && !dateList.includes(v.key) && dateList.length <= 12) {
              dateList.push(v.key)
              dateList.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            }
          })
        }
      })
      
      const labPrintItems = orderBy(getLabPrint.value?.[0]?.lab_print_items?.map((item) => {
        const typeLab = item.lab_set ? 'lab_set' : (item.lab_device ? 'lab_device' : (item.lab_ref ? 'lab_ref' : 'pet_bio_info'))

        const labResultList = [] as any[]
        let labRange = item.lab_range || null
        dateList.forEach((date) => {
          if (typeLab == 'lab_set' || typeLab == 'lab_device' || typeLab == 'lab_ref') {
            const labResult = item.lab_results?.find((v) => v.key == date)
            if (labResult) {
              labResultList.push({
                ...labResult,
                type: typeLab
              })
            } else {
              labResultList.push({
                key: date,
                val: {
                  high: null,
                  high_critical: null,
                  id_lab_result: null,
                  low: null,
                  low_critical: null,
                  val_result: null
                }
              })
            }
            if (!labRange && labResult) {
              labRange = {
                low: labResult.val.low,
                high: labResult.val.high
              }
            }
          } else {
            const petBioInfo = item.pet_bio_info?.find((v) => v.key == date)
            if (petBioInfo) {
              labResultList.push({
                key: date,
                type: typeLab,
                val: petBioInfo
              })
            } else {
              labResultList.push({
                key: date,
                val: {
                  id_pet_bio_info: null,
                  key: date,
                  measure: null,
                  val: null
                }
              })
            }
          }
        })

        for (let i = labResultList.length; i < maxColumns; i++) {
          labResultList.push({
            key: date,
            val: {
              val_result: null,
              val: null
            }
          })
        }

        return {
          ...item,
          lab_range: labRange,
          type_lab_print: typeLab,
          lab_results: labResultList
        }
      }), 'display_order')

      for (let i = labPrintItems.length; i < maxRows; i++) {
          labPrintItems.push({
            key: date,
            val: {
              val_result: null,
              val: null
            }
          })
        }

      dateList.slice(0, maxColumns).forEach((item, idx) => {
        columns.value.push({
          name: `day${idx + 1}`,
          label: dateFormat(item, 'YY/M/D'),
          align: "center",
          field: `day${idx + 1}`,
          headerStyle: "width: auto; min-width: 68px;"
        })
      })

      for (let i = dateList.length; i < maxColumns; i++) {
        columns.value.push({
          ...defaultColumn,
          name: `day${i + 1}`,
          field: `day${i + 1}`
        })
      }

      rows.value = exportPdf.value.populateRows(labPrintItems, MAX_ROWS_FIRST_PAGE, MAX_ROWS_MID_PAGE, 0, 0, {}, 1792)

      await nextTick()
      generateReport()
    }
  })
  .finally(() => {
    return close()
  })
}

const generateReport = () => {
  exportPdf.value.generateReport(
    getPdfName()
  )
}

const getPdfName = () => {
  const currentDate = date.formatDate(new Date(), 'YYYYMMDD')
  return `${currentDate}_検査結果_固定比較表_${getFullPetName(getPet.value, getCustomer.value)}`
}

const getTypeAnimal = (idCmAnimal: number) => getCommonTypeAnimalOptionList.value.find((v: Common) => v.id_common == idCmAnimal)?.name_common
const getBreed = (idCmBreed: number) => getCommonBreedOptionList.value.find((v: Common) => v.id_common == idCmBreed)?.name_common

onMounted(async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [1, 2] }),
  clinic.value = clinicStore.getClinic
  init()
})
</script>
<template>
  <div class="q-pa-md page-inner-body">
    <PdfExport :generateOnePDF="false" orientationMode="landscape" ref="exportPdf" />
    <q-card id="element-to-print" class="print-content print" square>
      <div class="card-pdf-main-border-1px q-px-md relative-positiond q-pt-sm" style="max-height: 210mm; min-height: 210mm; overflow: hidden;" v-for="(page, idx) in rows" :key="idx">
        <div class="flex items-center font-10px text-black">
          <div>
            {{ getPet.code_pet }}
            <span class="text-weight-bold"> {{ getFullPetName(getPet, getCustomer) }} ({{ getPetKanaName(getPet, getCustomer) }}) </span>
            {{ getCurrentPetAge(getPet) }}
            {{ getTypeAnimal(getPet.id_cm_animal) }}
            {{ getBreed(getPet.id_cm_breed) }}
          </div>
        </div>
        <q-table :rows="page" :columns="columns" row-key="number" style="table-layout: fixed; width: 100%; border: 0; border-radius: 0"
          :rows-per-page-options="[page.length]" hide-bottom flat class="lab-fix-comparison-pdf">
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th 
                v-for="(col, idx) in props.cols"
                :key="col.name"
                :props="props"
                class="q-pa-sm">
                <div class="font-10px">
                  {{ col.label }}
                </div>
              </q-th>
            </q-tr>
          </template>
          <template v-slot:body="props">
            <template v-if="props.row.flg_above_blank_row">
              <q-tr
                :class="['border-2C65D7']"
                style="height: 6px"
              >
              </q-tr>
            </template>
            <q-tr>
              <q-td> 
                <div
                  style="line-height: 1.2; margin-top: -2px;"
                  class="font-9px text-black text-weight-bold"
                  :class="props.row.flg_indent ? 'q-pl-sm' : ''"
                >
                  {{ getLabEnName(props.row) }}
                </div> 
              </q-td>
              <q-td class="q-pa-none">
                <div class="font-8px text-black">
                  {{ props.row?.lab?.name_lab == getLabEnName(props.row) ? '' : props.row?.lab?.name_lab }}
                </div>
              </q-td>
              <q-td>
                <div class="font-8px text-black">
                  {{ props.row?.cm_unit?.name_common }}
                </div>
              </q-td>
              <q-td>
                <div class="font-8px text-black">
                  {{
                    props.row?.lab_range?.low && props.row?.lab_range?.high ? props.row?.lab_range?.low + ' ~ ' + props.row?.lab_range?.high : ''
                  }}
                </div>
              </q-td>
              <q-td class="q-pa-none" v-for="(col, idx) in props.row.lab_results" :key="col.name">
                <div class="val-result font-8px text-black text-center items-center text-weight-bold">
                  <template v-if="col.type == 'lab_set' || col.type == 'lab_device' || col.type == 'lab_ref'">
                    <div
                      :class="props.row?.lab_range?.low && parseFloat(col.val?.val_result) < parseFloat(props.row?.lab_range?.low) ? 'blue' : props.row?.lab_range?.high && parseFloat(col.val?.val_result) > parseFloat(props.row?.lab_range?.high) ? 'red' : ''"
                    >
                      <span class="val-result-text q-mr-xs">{{ aahTruncate(col.val?.val_result, 8) }}</span>
                      <template v-if="props.row?.lab_range?.low && parseFloat(col.val?.val_result) < parseFloat(props.row?.lab_range?.low)">
                        <span class="val-result-text" style="font-size: 6px; color: #003369">▼</span>
                      </template>
                      <template v-else-if="props.row?.lab_range?.high && parseFloat(col.val?.val_result) > parseFloat(props.row?.lab_range?.high)">
                        <span class="val-result-text" style="font-size: 6px; color: #6b0000;">▲</span>
                      </template>
                    </div>
                  </template>
                  <template v-if="col.type == 'pet_bio_info'">
                    <template v-if="col.val?.val">
                      {{ col.val?.val / 1000 }}
                    </template>
                  </template>
                </div>
              </q-td>
            </q-tr>
          </template>
        </q-table>
        <template v-if="idx + 1 != rows.length">
          <div class="html2pdf__page-break"></div>
        </template>

        <div class="absolute-bottom flex items-center q-mx-md q-pb-sm footer" style="border-top: 1px solid #333;">
          <div class="text-weight-bold q-ml-sm">
            <small>{{ clinic?.name_clinic_display }}</small>
          </div>
          <div class="q-ml-sm">
            <small>
              {{
                `〒${clinic?.zip_code} ${concatenate(
                    (clinic?.address_prefecture || ''),
                    (clinic?.address_city || ''),
                    (clinic?.address_other || '')
                  )}`
              }}
            </small>
          </div>
        </div>
      </div>
    </q-card>
  </div>  
</template>
<style src="../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
.print-content {
  font-family: 'Noto Sans JP';
  width: 100%;
  &.print {
    width: 297mm;
    height: 210mm;
  }
}
.lab-fix-comparison-pdf {
  :deep(.q-table) {
    thead > tr {
      height: 16px !important;
      background: $grey-800;
      th {
        font-weight: 500;
        color: #fff;
        border-bottom: 0;
      }
      th.q-pa-none {
        padding: 0px !important;
      }
    }
    tr {
      &:nth-child(even) {
        background: #e4edfd;
      }
      td {
        height: 11px !important;
        width: 100%;
        border-bottom: 0;
      }
      td.q-pa-none {
        padding: 0px !important;
      }
    }
  }
}
.footer {
  bottom: 8px;
}
@page {
  size: A4 landscape;
  margin: 0;
}
body {
  margin: 0;
  padding: 0;
}
.font-9px {
  font-size: 9px !important;
}
.font-6px {
  font-size: 6px !important;
}
.val-result-text {
  line-height: 1.2;
}
.val-result {
  .red {
    background-color: #ffdbdb;
    color: #6b0000;
  }
  .blue {
    background-color: #bff8ff;
    color: #003369;
  }
}
</style>