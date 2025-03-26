<script lang="ts" setup>
import { ref, nextTick } from 'vue'
import PdfExport from '@/pages/pdfExport/PdfExport.vue'
import {
  dateFormat,
  formatDateWithTime,
  getDateTimeNow
} from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'

const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const { getCustomerOption, getAllCustomerPreps, getPet, getCustomer } =
  storeToRefs(customerStore)
interface Props {
  petList: Array<any> | any
}

const props = withDefaults(defineProps<Props>(), {
  petList: []
})

const exportPdf = ref()
let index = ref(0)

const columns = ref([
  {
    name: 'number',
    required: true,
    label: '#',
    align: 'left',
    field: 'number'
  },
  {
    name: 'customer_pet',
    label: 'Customer/Pet',
    align: 'left',
    field: 'customer_pet'
  },
  {
    name: 'plan_dates',
    label: 'Plan dates',
    field: 'plan_dates',
    align: 'left'
  },
  {
    name: 'illness_history_name',
    label: 'RQ/ illness history name',
    align: 'left',
    field: 'illness_history_name'
  },
  { name: 'memo', label: 'Memo', field: 'memo', align: 'left' },
  { name: 'blank', label: '', field: 'blank', align: 'left' }
])

const rows = ref([])

const closeUpdDialogFlg = ref(false)

async function init() {
  await nextTick()
  rows.value = exportPdf.value.populateRows(props.petList, 8, 13)
  await nextTick()
  generateReport()
  close()
}
function close() {
  emits('close')
}
const getCustomerName = (id_customer, id_pet) => {
  let selectedCustomer = getAllCustomerPreps.value.find(
    (customer) => customer.id_customer == id_customer
  )
  return (
    selectedCustomer?.code_customer +
    ' ' +
    selectedCustomer?.name_customer_display
  )
}
function generateReport() {
  exportPdf.value.generateReport(`pet_custody`)
}
init()
</script>

<template>
  <div v-close-popup="closeUpdDialogFlg" ref="modelBodyRef" class="">
    <div class="flex justify-between no-wrap q-pa-md">
      <div><!--Title Here--></div>
      <div class="flex no-wrap items-center">
        <q-btn class="bg-white text-black q-mx-md" @click="generateReport()"
          >注文請書PDF発行</q-btn
        >
        <q-btn @click="close" flat round dense icon="close" />
      </div>
    </div>
    <PdfExport sheetName="_注文書" ref="exportPdf" />
    <q-card
      id="element-to-print"
      style="max-width: 1000px; margin: auto"
      class="bg-white q-pa-none"
      square
    >
      <div
        class="card-pdf-main q-px-md q-pt-md"
        v-for="(page, idx) in rows"
        :key="idx"
      >
        <!-- Header section start -->
        <div class="header-section q-mb-md text-no-wrap">
          <div
            class="row q-mb-sm q-py-sm justify-between q-px-sm table-cell-custom-border1"
          >
            <div class="font-12px fw-300">{m_clinic.name_clinic_display}</div>
            <div class="font-12px fw-300">
              {{ dateFormat(props.petList[0].datetime_start) }} の管理動物
              点検票
            </div>
            <div class="font-12px fw-300">
              出力時間：{{
                formatDateWithTime(getDateTimeNow(), 'MM/DD HH:mm')
              }}
            </div>
          </div>
        </div>
        <!-- Header section end -->
        <div class="row">
          <div class="col-12">
            <q-table
              :rows="page"
              :columns="columns"
              row-key="number"
              style="table-layout: fixed; width: 100%"
              :rows-per-page-options="[rows.length]"
              hide-bottom
              flat
              bordered
              class="order-sheet-table"
            >
              <template v-slot:body="props">
                <q-tr :props="props">
                  <q-td
                    key="number"
                    :props="props"
                    class="font-10px q-py-xs"
                    style="text-align: center !important"
                  >
                    {{ props.rowIndex + 1 }}
                  </q-td>
                  <q-td
                    key="customer_pet"
                    :props="props"
                    class="font-10px q-py-xs"
                    style="text-align: left !important"
                  >
                    {{
                      getCustomerName(props.row.id_customer, props.row.id_pet)
                    }}
                  </q-td>
                  <q-td
                    key="plan_dates"
                    :props="props"
                    class="font-10px q-py-xs"
                    style="text-align: left !important"
                  >
                    {{
                      formatDateWithTime(
                        props.row.datetime_start_plan,
                        'MM/DD'
                      ) +
                      ' ~ ' +
                      formatDateWithTime(props.row.datetime_goal_plan, 'MM/DD')
                    }}
                  </q-td>
                  <q-td
                    key="illness_history_name"
                    :props="props"
                    class="font-10px q-py-xs"
                    style="text-align: left !important"
                  >
                    -
                  </q-td>
                  <q-td
                    key="memo"
                    :props="props"
                    class="font-10px q-py-xs"
                    style="text-align: left !important"
                  >
                    {{ props.row.memo }}
                  </q-td>
                  <q-td key="blank"> </q-td>
                </q-tr>
              </template>
            </q-table>
          </div>
        </div>
        <template>
          <div class="html2pdf__page-break"></div>
        </template>
      </div>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.card-pdf-main {
  font-family: 'Zen Antique Soft', serif;
  color: #000;
  .font-20px {
    font-size: 20px !important;
  }
  .font-12px {
    font-size: 12px !important;
  }
  .font-9px {
    font-size: 9px !important;
  }
  .font-7px {
    font-size: 7px !important;
  }
  .font-8px {
    font-size: 8px !important;
  }
  .font-14px {
    font-size: 14px !important;
  }
  .fw-600 {
    font-weight: 600 !important;
  }
  .font-16px {
    font-size: 16px !important;
  }
  .font-15px {
    font-size: 15px !important;
  }
  .border-bottom {
    border-bottom: 2px solid #000 !important;
  }
  .border-bottom-1 {
    border-bottom: 1px solid #000 !important;
  }
  .borders {
    border: 2px solid #000 !important;
  }
  .border-big {
    border-width: 3px !important;
  }
  .border-right {
    border-right: 2px solid #000 !important;
  }
  .border-left {
    border-left: 2px solid #000 !important;
  }
  .border-top {
    border-top: 2px solid #000 !important;
  }

  .border {
    border: 2px solid #000 !important;
  }
  .no-borders {
    border: none !important;
  }
  .border-width-1 {
    border-width: 1px !important;
  }
  .border-width-2 {
    border-width: 2px !important;
  }
  .border-width-3 {
    border-width: 3px !important;
  }
  .fw-500 {
    font-weight: 500;
  }
  .table-cell-custom-border {
    border: 2px solid #000 !important;
  }
  .table-cell-custom-border1 {
    border: 1px solid #d6d6d6 !important;
  }
  .border-bottom-none {
    border-bottom: none !important;
  }
  .border-top-none {
    border-top: none !important;
  }
  .border-left-none {
    border-left: none !important;
  }
  .border-d9d9d9 {
    border-color: #d9d9d9 !important;
  }
  .border-333 {
    border-color: #333 !important;
  }
  tbody .q-tr {
    .table-cell-custom-border {
      border-top: 0 !important;
      &:not(:last-child) {
        border-right: 0 !important;
      }
      &.border-top {
        border-top: 1px solid #000 !important;
      }
    }
  }
  thead .q-tr {
    background-color: #efefef;
    .table-cell-custom-border {
      &:not(:last-child) {
        border-right: 0 !important;
      }
    }
  }
  .font-10px {
    font-size: 10px;
  }
}

.border-thin-bottom {
  border-bottom: 1px solid #000;
}

.border-double-lines {
  position: relative;
  padding-bottom: 4px;
  margin-top: -5px;
  border-bottom: 1px solid #000;

  &::after {
    content: '';
    border-top: 1px solid #000;
    height: 2px;
    position: absolute;
    bottom: 2px;
    width: 100%;
    left: 0;
  }
}

.order-sheet-table:deep {
  tbody {
    tr:not([bottom-row|='true']) {
      td > * {
        min-height: 60px;
        max-height: 60px;
        display: flex;
        align-items: center;
        justify-content: start;
      }
    }

    tr:nth-of-type(odd):not([bottom-row|='true']) {
      td {
        background-color: rgba(230, 231, 233, 255);
      }
    }
  }
}

.ellipsis-8-lines {
  -webkit-line-clamp: 8;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.ellipsis-4-lines {
  -webkit-line-clamp: 4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.grid-display {
  display: grid;
}
</style>
