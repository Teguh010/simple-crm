<script setup lang="ts">
import ViewLabResultModal from '@/components/lab/ViewLabResultModal.vue';
import useCommonStore from '@/stores/common';
import useServiceDetailStore from '@/stores/service-details';
import { formatDateWithTime } from '@/utils/aahUtils';
import { event_bus } from '@/utils/eventBus';
import mtUtils from '@/utils/mtUtils';
import UpdateServiceDetailModal from '../../serviceDetail/UpdateServiceDetailModal.vue';
import { computed, ref } from 'vue';
import GetPdfLabResultComparison from '@/pages/labResult/GetPdfLabResultComparison.vue';

const emit = defineEmits(['refresh'])

const commonStore = useCommonStore()
const serviceDetailStore = useServiceDetailStore()

const labResultSelected = ref()
const pdfConfirmationDialog = ref()

const props = defineProps({
  labResultList: Array<Object>,
  requestDetailPage: Object,
  petSelected: Object,
  showUnitRange: Boolean
})

const defaultLRColumn = computed(() => {
  if (!props.showUnitRange) {
    return [
      {
        name: 'name_lab',
        label: '項目',
        field: 'name_lab',
        align: 'left',
        width: '25%'
      }
    ]
  }
  return [
    {
      name: 'name_lab',
      label: '項目',
      field: 'name_lab',
      align: 'left',
      width: '25%'
    },
    {
      name: 'name_unit_result',
      label: '単位',
      field: 'name_unit_result',
      align: 'center',
      width: '15%'
    },
    {
      name: 'range',
      label: '基準値',
      field: 'range',
      align: 'center',
      width: '20%'
    }
  ]
})

const togglePdfConfirmation = (value: Array<object>) => {
  labResultSelected.value = []
  pdfConfirmationDialog.value = !pdfConfirmationDialog.value
  labResultSelected.value = value
}

const getUniqueSetOfCarte = (labResult: any) => {
  return labResult.sort((a, b) => a.display_order - b.display_order)
}

const openLabResultDetailModal = async (item = null) => {
  const params = { request: props?.requestDetailPage }
  if (item) {
    Object.assign(params, {
      id_lab_result: item.id_lab_result,
      id_pet_illness_history: item.id_pet_illness_history
    })
  }
  await mtUtils.popup(ViewLabResultModal, params, true)
  emit('refresh')
  event_bus.emit('reloadRight', true)
}

const openServiceDetail = async (id_service_detail: string) => {
  await serviceDetailStore.fetchServiceDetailById(id_service_detail)
  serviceDetailStore.setServiceDetail(serviceDetailStore.getServiceDetail)

  await mtUtils.mediumPopup(UpdateServiceDetailModal)
  emit('refresh')
}

const typeLabUnitName = (value: number) =>
  commonStore.getCommonUnitOptionList.find(
    (item: Common) => item.id_common === value
  )?.name_common


const openLabResultMultiModal = async (row) => {
  await mtUtils.popup(GetPdfLabResultComparison, {
    data: row,
    isSingle: true,
    id_pet: props.petSelected?.id_pet
  })
}

const showValResult = (lab_result) => {
  if (lab_result.val_result) {
    const v1 = lab_result.val_result?.toString()?.replace(',', '')
    if (parseFloat(v1) > parseFloat(lab_result.high))
      return `<span class="q-ml-xs" style="color: red">${lab_result.val_result} <small>▲</small></span>`
    else if (parseFloat(v1) < parseFloat(lab_result.low))
      return `<span class="q-ml-xs" style="color: blue">${lab_result.val_result} <small>▼</small></span>`
    return lab_result.val_result
  }
  return ''
}
</script>

<template>
  <template
    v-if="
      props.labResultList
    "
  >
    <template
      v-for="device in props.labResultList"
    >
      <template v-for="dates in device">
        <div v-for="(lab_result, datetime_registered) in dates">
          <div
            class="bg-white memo-title q-my-md q-pa-md cursor-pointer"
            @click="openLabResultDetailModal(lab_result?.[0])"
          >
            <q-table
              :columns="[
                ...defaultLRColumn,
                {
                  name: 'date',
                  label: formatDateWithTime(
                    datetime_registered,
                    'YY/MM/DD HH時'
                  ),
                  date: datetime_registered,
                  field: 'date',
                  align: 'center',
                  colspan: '2',
                  width: '40%'
                }
              ]"
              :rows="getUniqueSetOfCarte(lab_result)"
              :rowsBg="true"
              class="my-sticky-header-column-table"
              flat
              hide-bottom
              :rows-per-page-options="[0]"
              no-data-message="登録がありません。"
              no-result-message="該当のデータが見つかりませんでした"
            >
              <template v-slot:header="{ cols }">
                <q-tr>
                  <template v-for="col in cols">
                    <q-th
                      v-if="col.field === 'date'"
                      style="width: 150px"
                      class="dark"
                    >
                      {{ col.label }}
                    </q-th>
                    <q-th v-else class="light">
                      {{ col.label }}
                    </q-th>
                  </template>
                </q-tr>
              </template>
              <template v-slot:body="{ row, cols }">
                <template v-if="row?.lab_device?.flg_above_blank_row || row?.lab_set?.flg_above_blank_row">
                  <q-tr>
                    <div style="height: 10px"></div>
                  </q-tr>
                </template>
                <q-tr>
                  <q-td
                    v-for="col in cols"
                    :width="col.width"
                    :class="[
                      col.field === 'date' ? 'cursor-pointer' : '',
                      row?.lab_device?.flg_above_blank_row || row?.lab_set?.flg_above_blank_row ? 'q-bt' : ''
                    ]"
                  >
                    <div key="memo_internal">
                      <div v-if="col.field === 'date'">
                        <div class="row">
                          <div class="col-6 text-center q-br">
                            {{ row.qualifier }}
                          </div>
                          <div class="col-6 text-center">
                            <div v-html="showValResult(row)" />
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'name_lab'">
                        <div
                          class="flex text-wrap items-center"
                          :class="row?.lab_device?.flg_indent || row?.lab_set?.flg_indent ? 'q-ml-md' : ''"
                        >
                          <div class="q-mr-md">
                            <b>{{
                              row?.name_lab_en
                                ? row?.name_lab_en?.replace('%', ' ')
                                : row?.lab?.name_lab_en.replace(
                                    '%',
                                    ' '
                                  )
                            }}</b>
                          </div>
                          <div>
                            {{
                              row?.name_lab_en || row?.name_lab
                                ? row?.name_lab_en == row?.name_lab
                                  ? ''
                                  : row?.name_lab
                                : row?.lab?.name_lab_en ==
                                  row?.lab?.name_lab
                                ? ''
                                : row?.lab?.name_lab
                            }}
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'range'">
                        <div
                          v-if="row.low && row.high"
                          class="flex no-wrap items-center"
                        >
                          {{ row.low }} ~ {{ row.high }}
                        </div>
                      </div>
                      <div
                        v-else-if="col.field === 'name_unit_result'"
                        class="body1 text-center regular text-grey-900"
                      >
                        {{
                          row.id_cm_unit
                            ? typeLabUnitName(row.id_cm_unit)
                            : row.name_unit_result
                        }}
                      </div>
                      <div
                        v-else
                        class="body1 text-center regular text-grey-900"
                      >
                        {{ row[col.field] ? row[col.field] : '' }}
                      </div>
                    </div>
                  </q-td>
                </q-tr>
              </template>
            </q-table>
            <div class="flex justify-between">
              <div>
                <div
                  v-if="lab_result?.[0]?.id_service_detail"
                  @click.stop="
                    openServiceDetail(
                      lab_result?.[0]?.id_service_detail
                    )
                  "
                  class="caption1 regular q-mt-sm text-blue"
                >
                  {{ lab_result?.[0]?.number_service_detail }}
                </div>
              </div>
              <div class="flex justify-end">
                <!--Single Lab Result PDF-->
                <div
                  @click.stop="togglePdfConfirmation(lab_result)"
                  class="caption1 regular q-mt-sm text-blue"
                >
                  <q-icon name="compare" />
                  一回
                </div>
                <div class="caption1 regular q-mt-sm">
                  <span class="q-mx-xs">/</span>
                </div>
                <!--Comparison Lab Result-->
                <div
                  @click.stop="openLabResultMultiModal(lab_result)"
                  class="caption1 regular q-mt-sm text-blue"
                >
                  比較
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </template>
</template>