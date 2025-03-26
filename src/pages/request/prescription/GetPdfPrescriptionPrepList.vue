<script lang="ts" setup>
import { computed, nextTick, onMounted, provide, reactive, ref } from 'vue'
import { date } from 'quasar'

// Components
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import PrescriptionDetailBox from '@/components/PocketList/PrescriptionDetailBox.vue'
import PrescriptionDetailAssortPDFPocket from '@/pages/request/prescription/PrescriptionDetailAssortPDFPocket.vue'

// Stores
import useIllnessHistoryStore from '@/stores/illness-history'
import useItemServiceUnitStore from '@/stores/item-service-units'

// Utils
import {
  aahTruncate,
  comTypeDose,
  formatDateTime,
  getCustomerName,
  getDateTimeNow,
  getFullPetName,
  getPetFirstName,
  roundZeroAfterPoint,
  typeDoseQuantityUI
} from '@/utils/aahUtils'

const exportPdf = ref()

provide('pillFill', 'greyFill')

type typePdfAttributes = {
  render: boolean
}

interface Props {
  prescriptionHeader: {
    number_prescription: string
    title_prescription: string
    flg_non_charge: boolean
    flg_delivered: boolean
    datetime_delivered: string
    memo_prescription: string
  }
  resultList: Array
  getCustomer: Object
  getPet: Object
  employeeName: Function
  prescriptionPdfAttributes: typePdfAttributes
  getNameDosageFormal: Function
}

const props = withDefaults(defineProps<Props>(), {
  prescriptionHeader: {},
  resultList: [],
  getCustomer: {},
  getPet: {},
  employeeName: () => {},
  prescriptionPdfAttributes: { render: false },
  getNameDosageFormal: () => {}
})

const illnessHistoryStore = useIllnessHistoryStore()
const itemServiceUnitStore = useItemServiceUnitStore()

const rows = ref([])

const getPetIllnessHistory = computed(() => {
  if (!props.prescriptionHeader.id_pet_illness_history) {
    return
  }

  let formattedIllnesses = props.prescriptionHeader?.id_pet_illness_history.map(
    (idPetHisString: any) => {
      let petIllnessHistory: any =
        illnessHistoryStore.getLeftSideIllnessHistoryList.find((iH: any) => {
          return iH.value == idPetHisString.id_pet_illness_history
        })
      if (petIllnessHistory) {
        return `${
          petIllnessHistory.number_pet_illness_history
            ? petIllnessHistory.number_pet_illness_history
            : ''
        } ${
          petIllnessHistory.name_disease ??
          petIllnessHistory.name_disease_free ??
          ''
        }`
      } else {
        return ''
      }
    }
  )
  return formattedIllnesses?.join(', ')
})

// Dynamic Content Measurement for PDF
const prescriptionHeight = reactive({})

const calcDynamicHeight = async () => {
  await nextTick() // Ensure DOM is updated

  props.resultList.forEach((_, index: number) => {
    const prescriptionEl = document.getElementById(`prescription-${index}`)
    if (prescriptionEl) {
      prescriptionHeight[index] = prescriptionEl.offsetHeight
    }
  })
}
// Compute grouped prescriptions based on dynamic heights
const groupedPrescriptions = computed(() => {
  const maxCardHeight = 777 // 210 from format (in mm) to px. Minus padding applied in the container
  const groups = []
  let currentGroup = []
  let currentHeight = 0

  let headerHeight = 0
  const headerEl = document.getElementById('pdf-header')
  if (headerEl) headerHeight = headerEl.offsetHeight

  let subHeaderHeight = 0
  const subHeaderEl = document.getElementById('pdf-subheader')
  if (subHeaderEl) subHeaderHeight = subHeaderEl.offsetHeight

  let footerHeight = 0
  const footerEl = document.getElementById('pdf-footer')
  if (footerEl) footerHeight = footerEl.offsetHeight

  let isFirstCard = true
  props.resultList.forEach((prescription, index) => {
    if (isFirstCard) {
      headerHeight = headerEl?.offsetHeight + subHeaderHeight + 16 // 16 is from the subHeader margin top: 8px and margin bottom: 8px
    } else {
      headerHeight = headerEl?.offsetHeight
    }
    const itemHeight = prescriptionHeight[index]

    const contentHeight = headerHeight + itemHeight + footerHeight

    if (currentHeight + contentHeight > maxCardHeight) {
      // Push the current group and start a new one
      groups.push(currentGroup)
      isFirstCard = false
      currentGroup = []
      currentHeight = 0 // Reset to header height for new card
    }

    currentGroup.push(prescription)
    currentHeight += itemHeight
  })

  // Add the last group if it exists
  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  return groups
})

function generateReport() {
  let jsPDFOptions = { format: [148, 210], orientation: 'portrait' }
  let imagePDFOptions: any = { quality: 0.1 }
  let pagesNumber: Number = 0

  exportPdf.value.generateReport(
    getFileName(),
    pagesNumber,
    jsPDFOptions,
    imagePDFOptions
  )
  props.prescriptionPdfAttributes.render = false
}

function getFileName() {
  return `${date.formatDate(
    Date.now(),
    'YYYYMMDD_HH時mm分'
  )}_調剤リスト_${getFullPetName(props.getPet, props.getCustomer)}様`
}

const petName = (value: string | number) => getPetFirstName(props.getPet)

function getPdIndex(prescriptionDetail: any) {
  const pdHeaders = props.resultList.filter(
    (pd) => !pd.flg_group_title && pd.booking
  )
  const currentIndex = pdHeaders.findIndex(
    (element) =>
      element.id_prescription_detail ==
      prescriptionDetail.id_prescription_detail
  )
  return currentIndex + 1
}

const getItemServiceUnits = computed(() => {
  return itemServiceUnitStore.getItemServiceUnits
})

function getPrescriptionDetailName(prescriptionDetail: any) {
  if (
    prescriptionDetail &&
    prescriptionDetail.prescription_detail_assort_list &&
    prescriptionDetail.prescription_detail_assort_list.length > 0
  ) {
    const firstAssort: any =
      prescriptionDetail.prescription_detail_assort_list[0]

    let ISU
    if (getItemServiceUnits.value) {
      ISU = getItemServiceUnits.value.find(
        (v) => v.id_item_service_unit == firstAssort.id_item_service_unit
      )
    }
    return (
      ISU?.name_service_item_unit ??
      prescriptionDetail.name_prescription_display
    )
  }
  return prescriptionDetail.name_prescription_display
}

async function init() {
  await nextTick()
  await itemServiceUnitStore.fetchItemServiceUnits()
  await nextTick()
  calcDynamicHeight()
  await nextTick()
  await nextTick()
  if (groupedPrescriptions.value.length > 0) {
    generateReport()
  }
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="q-pa-md page-inner-body">
    <PdfExport ref="exportPdf" />
    <section id="element-to-print" style="margin: auto">
      <q-card
        v-for="(page, index) in groupedPrescriptions"
        class="bg-white q-pa-sm position-relative"
        style="width: 559px; min-height: 793px"
        square
      >
        <q-card-section
          id="pdf-header"
          class="card-pdf-main main-container q-pa-none"
        >
          <div class="row full-width items-center">
            <div
              class="col row items-center justify-between"
              style="
                flex: 1;
                background-color: rgba(236, 248, 255, 0.7);
                font-size: 13px;
              "
            >
              <div class="q-pa-sm">
                <strong v-if="props.prescriptionHeader.flg_non_charge">
                  [会計対象外]
                </strong>
                {{ props.prescriptionHeader.number_prescription }}
                {{
                  aahTruncate(
                    props.prescriptionHeader.title_prescription,
                    props.prescriptionHeader.flg_delivered
                      ? 26
                      : props.prescriptionHeader.flg_non_charge
                      ? 28
                      : index.value === 0
                      ? 42
                      : 60
                  )
                }}
              </div>
              <q-space></q-space>
              <div
                v-if="props.prescriptionHeader.flg_delivered"
                class="q-pa-sm"
              >
                <span>受け渡し 完了日時</span>
                {{
                  formatDateTime(props.prescriptionHeader.datetime_delivered)
                }}
              </div>
              <div
                v-if="index === 0"
                class="q-pa-sm"
                style="border: 1px solid #000"
              >
                <span class="q-mr-xl" style="font-size: 12px">担当者</span>
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-section
          id="pdf-subheader"
          class="card-pdf-main main-container q-pa-none"
        >
          <section>
            <div v-if="index === 0" class="flex q-my-sm">
              <div
                v-if="prescriptionHeader.memo_prescription"
                class="row full-width"
              >
                <q-icon name="description" class="q-mr-xs" />
                {{ prescriptionHeader.memo_prescription }}
              </div>
              <div class="row full-width">
                <div class="col-auto flex items-center q-mr-md">
                  <div class="cursor-pointer">
                    {{ getCustomer.code_customer }}
                    {{ getCustomerName(getCustomer) + ' 様' }}
                  </div>
                </div>
                <div class="col-auto flex items-center q-mr-md">
                  <div class="cursor-pointer">
                    {{ petName(prescriptionHeader.id_pet) }}
                  </div>
                </div>
                <div class="col-auto">
                  <div class="q-mr-sm">
                    処方医:
                    {{
                      props.employeeName(prescriptionHeader.id_employee_doctor)
                    }}
                  </div>
                </div>
              </div>
              <div class="row full-width">
                <div class="col-auto flex">
                  <div class="cursor-pointer">
                    {{ prescriptionHeader?.request?.number_request }}
                    <span>
                      {{ ' : ' + prescriptionHeader?.request?.title_request }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </q-card-section>
        <q-card-section
          v-for="(prescription, index) in page"
          :key="`prescription-${index}`"
          id="pdf-content"
          class="card-pdf-main main-container q-pa-none row full-width"
        >
          <section
            v-if="prescription"
            :id="`prescription-${index}`"
            class="col-12"
          >
            <div v-if="!prescription.flg_group_title">
              <div v-if="!prescription.flgAssortRow" id="prescription-header">
                <section id="header__title" class="full-width row items-center">
                  <div class="col-1 text-center">
                    <q-icon name="check_box_outline_blank" size="36px" />
                  </div>
                  <div
                    class="col row justify-between items-center bg-grey-300 q-px-sm font-12px"
                  >
                    <div class="col-auto row items-center">
                      <strong class="font-14px q-mr-md">
                        {{ getPrescriptionDetailName(prescription) }}
                      </strong>
                      {{ prescription.name_category1 }}
                      <q-icon name="arrow_right" />
                      {{ prescription.name_category2 }}
                    </div>
                    <div
                      v-if="prescription.type_detail == 1"
                      class="col-auto row items-center"
                    >
                      <q-icon name="event_available" class="q-mr-xs" />
                      <span>
                        {{
                          prescription.date_start && prescription.date_end
                            ? prescription.date_start +
                              ' ~ ' +
                              prescription.date_end
                            : ''
                        }}
                      </span>
                    </div>
                  </div>
                </section>
                <section
                  id="header__summary"
                  class="full-width row items-center"
                >
                  <PrescriptionDetailBox
                    v-if="prescription.type_detail === 1"
                    :prescription-detail="prescription"
                    class="prescription-detail col offset-1 font-12px"
                    style="padding: 0; margin-bottom: 0"
                  />
                </section>
                <section
                  id="header__detail"
                  class="full-width row items-center"
                >
                  <div class="text-center col-1">
                    {{ getPdIndex(prescription) }}
                  </div>
                  <div
                    v-if="prescription.type_detail == 1"
                    class="col row font-14px q-my-none"
                  >
                    <div v-if="prescription.total_days_dose" class="col-12">
                      {{
                        roundZeroAfterPoint(prescription.total_days_dose) +
                        comTypeDose(
                          typeDoseQuantityUI(prescription.id_dosage_frequency)
                            .typeDoseUI
                        ) +
                        ' x 頻度 ' +
                        ' ' +
                        getNameDosageFormal(prescription.id_dosage_frequency)
                      }}
                    </div>
                    <div
                      v-if="prescription.memo_dose || prescription.memo_alert"
                      class="col-12 bg-grey-100"
                    >
                      <!-- it can be more than few lines -->
                      <span v-if="prescription.memo_dose">
                        《服用ﾒﾓ》{{ prescription.memo_dose }}
                      </span>
                      <!-- it can be more than few lines -->
                      <span v-if="prescription.memo_alert" class="q-ml-md">
                        《注意》{{ prescription.memo_alert }}
                      </span>
                    </div>
                    <div
                      v-if="prescription.memo_clinic_prep"
                      class="col-12 bg-grey-300 q-mt-xs"
                    >
                      <!-- it can be more than few lines -->
                      <strong>《調剤指示》</strong>
                      {{ prescription.memo_clinic_prep }}
                    </div>
                  </div>
                </section>
              </div>
              <div v-else id="prescription-detail-assort">
                <section class="full-width row items-center">
                  <div class="col offset-1 q-px-md">
                    <PrescriptionDetailAssortPDFPocket
                      :disable="true"
                      :isEdit="false"
                      :idDosageFrequency="prescription.id_dosage_frequency"
                      :prescription-assort="prescription.assortData"
                      :total-days-dose="prescription.total_days_dose"
                      :unitName="prescription.unitName"
                      :itemService="prescription.itemService"
                      :itemServiceUnitList="prescription.itemServiceUnitList"
                      :prescription-detail="prescription"
                    />
                  </div>
                </section>
              </div>
            </div>
            <div
              v-else
              class="prescription_group q-pl-md q-py-sm item_divier_prescription font-16px"
            >
              <div class="row justify-between">
                <strong class="col-9 flex items-center">
                  {{ prescription.name_prescription_display }}
                </strong>
              </div>
            </div>
            <q-separator
              v-if="
                !prescription.flg_group_title && !page[index + 1]?.flgAssortRow
              "
              class="full-width q-my-xs"
            />
          </section>
        </q-card-section>
        <q-card-section
          id="pdf-footer"
          class="absolute-bottom full-width flex justify-between q-pa-sm"
        >
          <div><span>出力日時：</span>{{ getDateTimeNow().slice(0, -3) }}</div>
          <div class="flex items-center">
            <div
              v-if="index === 0"
              style="border-bottom: 1px solid #000; width: 250px"
              class="q-px-md q-mt-md"
            ></div>
            <div class="q-ml-md">
              Page [{{ index + 1 }} / {{ groupedPrescriptions.length }}]
            </div>
          </div>
        </q-card-section>
      </q-card>
    </section>
  </div>
</template>
<style src="../../pdfExport/style.scss" lang="scss" scoped></style>
<style lang="scss" scoped>
.main-container > * {
  font-size: 14px;
  color: #000 !important;
}
.prescription-box {
  border-radius: 5px;
  background-color: #fafafa;
  border: 2px solid #d9d9d9;
  :deep(div, span) {
    color: #000 !important;
  }
}
.prescription-detail {
  :deep(.title-font) {
    color: #000 !important;
    font-size: 14px;
  }
}
.prescription_group {
  min-height: 20px;
  background-color: rgba(236, 248, 255, 0.7);
}
.assort-box {
  margin: 4px 0 4px 48px !important;
  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    padding-bottom: 5px;
  }
  :deep(.progress-circle-container-1) {
    width: 36px;
    height: 36px;
    text {
      font-size: 15px;
    }
  }
  :deep(small) {
    font-size: 14px;
  }
}
</style>
