<script lang="ts" setup>
import mtUtils from '@/utils/mtUtils'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import { ref } from 'vue'
import useItemStore from '@/stores/items'
import { calculateDate, roundZeroAfterPoint } from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'

const itemStore = useItemStore()


defineProps({
    flgBodyWeight: {
        type: Boolean,
        required: true,
    },
    item: {
        type: Object,
        required: true
    },
    feDivisionFlgCount: {
        type: String,
        required: true
    },
    checkPerHeadAvailable: {
        type: Boolean,
        required: true
    },
    dosageVariableRange: String, 
    dosageVariableRangeUnit: String,
    dosageVariableRangeValue: String,
    dosageFrequencyList: Array,
    dosageFixedListByGroup: Object,
    bookingDetail: Object,
})


const toggleDivision = ref(false)
const medicineObj = ref<any>({
  id_dosage_frequency_1: null,
  id_dosage_frequency_2: null,
  id_dosage_frequency_3: null
})

const prescriptionDetailForm = ref({
  id_prescription: null,
  id_prescription_detail: null,
  id_item_service: null,
  type_medicine_dosage: '1',
  dosage_frequency_UI: '1',
  id_dosage_frequency: null,
  total_days_dose: null,
  memo_dose: null,
  memo_clinic_prep: null,
  date_start: null,
  date_end: null,
  type_medicine_format_ui: '1',
  memo_alert: null,
  flg_non_charge: false,
  flg_apply_insurance: false,
  id_category1: null,
  id_category2: null,
  efficacy_per_kg: '',
  prescription_detail_assort_list: <any>[],
  val_efficacy_strength_doctor: null,
  val_total_efficacyingredient: null,
  id_pet: null,
  dosage_frequency_CB_UI: false,
  flg_overdosing: false,
  name_medicine_format: null,
  id_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
  fe_division: {
    pill_division: []
  },
  process_drip: {
    calculation_fixed_unit: null,
    time: null,
    time_unit: null,
    flow_rate: null,
    flow_rate_unit: null,
    id_cm_med_route: null,
    volume: null,
    is_drip: false
  },
  show: true
})

const emit = defineEmits(['itemServiceUnit', 'suggestedAmount', 'fetchSelectedTypeMedicine']);

const callFetchItemServiceUnits = () => {
    emit('itemServiceUnit');
}

const callFetchSuggestedAmount = () => {
    emit('suggestedAmount');
}

const callSelectedTypeMedicine = () => {
    emit('fetchSelectedTypeMedicine')
}

const getItem = (value: string) =>
  itemStore.getAllItems.find((v: any) => v.id_item_service == value)

</script>
<template>
   <div>
    <div v-if="!flgBodyWeight" class="q-mb-xs">
      <span class="text-danger"><q-icon name="warning_amber" /> ペットの体重が未設定です。</span>
    </div>
    <div class="flex justify-between q-pa-md gap-4 light-prescription-blue">
      <div class="flex-1">
        <div class="title2 text-grey-900 bold q-mb-xs">
          {{ item.name_item_service }}
          <q-icon
            name="quiz"
            size="1em"
            class="cursor-pointer"
            @click="
              () => {
                mtUtils.popup(ViewItemServiceDetailModal, {
                  id: item?.id_item_service
                })
              }
            "
          />
        </div>
        <div class="text-body2 text-grey-700 flex items-center">
          {{ item.name_category1 }}
          <q-icon name="arrow_right" />
          {{ item.name_category2 }}
        </div>
      </div>
      <div>
        <q-btn outline class="q-mr-md" @click="fetchItemServiceUnits">
          全表示
        </q-btn>
        <template
          v-if="![2, 3, '2', '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == prescriptionDetailForm?.type_medicine_format_ui)?.code_func1 )">
          <q-btn
            v-if="prescriptionDetailForm.type_medicine_dosage != '4'"
            :disable="prescriptionDetailForm.type_medicine_dosage == '4'"
            outline
            @click="fetchSuggestedAmount"
          >
            自動
          </q-btn>
          <q-btn
            v-if="
            prescriptionDetailForm.type_medicine_dosage == '2' ||
            prescriptionDetailForm.type_medicine_dosage == '3'
          "
            :disable="prescriptionDetailForm.type_medicine_dosage == '4'"
            class="q-ml-md"
            outline
            @click="toggleDivision = !toggleDivision"
          >
            <q-icon class="" name="drag_indicator" size="2em" />
            <q-badge v-if="feDivisionFlgCount > 0" color="red" floating>
              {{ feDivisionFlgCount }}
            </q-badge>
          </q-btn>
        </template>
      </div>
      <div>
        <q-btn size="11px" class="q-mt-sm" color="primary" outline unelevated @click="prescriptionDetailForm.show = !prescriptionDetailForm.show">
          {{ prescriptionDetailForm.show ? '閉じる' : '開く' }}
        </q-btn>
      </div>
    </div>

    <div v-show="prescriptionDetailForm.show">
      <div class="q-mt-sm">
        <span
          class="q-mt-xs"
          :class="
            prescriptionDetailForm.flg_overdosing ? 'text-darkred' : 'text-white'
          "
        >
          <small>※ 規定量以上の投与です。注意してください。</small>
        </span>
      </div>

      <!-- Factors to calculate prescription detail & assort data -->
      <div class="q-mx-md" v-if="!medicineObj.flg_drip_carrier">
        <div class="row q-col-gutter-md">
          <div class="col-auto">服用量計算 *</div>
          <div class="col-auto q-pt-sm">
            <MtFormRadiobtn
              v-if="(medicineObj.flg_dosage_fixed && ![2, 3, '2', '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == prescriptionDetailForm?.type_medicine_format_ui)?.code_func1 ))"
              label="早見表"
              v-model="prescriptionDetailForm.type_medicine_dosage"
              val="1"
              @update:selected="selectedTypeMedicine"
              class="q-pr-md"
            />
            <MtFormRadiobtn
              v-if="medicineObj.flg_dosage_variable"
              label="可変量/kg"
              v-model="prescriptionDetailForm.type_medicine_dosage"
              val="2"
              @update:selected="selectedTypeMedicine"
              class="q-pr-md"
            />
            <MtFormRadiobtn
              v-if="checkPerHeadAvailable"
              label="可変量/head"
              v-model="prescriptionDetailForm.type_medicine_dosage"
              val="3"
              @update:selected="selectedTypeMedicine"
              class="q-pr-md"
            />
            <MtFormRadiobtn
              v-if="medicineObj.flg_dosage_quantity"
              label="数量指定"
              v-model="prescriptionDetailForm.type_medicine_dosage"
              val="4"
              @update:selected="selectedTypeMedicine"
            />
          </div>
        </div>
        <div
          v-if="
            dosageVariableRange &&
            (prescriptionDetailForm.type_medicine_dosage == 2 ||
              prescriptionDetailForm.type_medicine_dosage == 3)
          "
        >
          <div class="row">
            <MtFormInputNumber
              label="服用成分量"
              mode="dosage"
              v-model:value="prescriptionDetailForm.val_efficacy_strength_doctor"
              class="col-2 field-right-text doctor-amount-icon"
              @update:value="
                (value) => {
                  prescriptionDetailForm.flg_overdosing = false
                  if (value > dosageVariableRangeValue.max) {
                    prescriptionDetailForm.flg_overdosing = true
                  }
                }
              "
            />
            <div
              class="flex calculation-process bi-grid-3x2-gap"
              v-if="efficacyCalculation"
            >
              <q-icon name="info" class="q-pt-xs q-mr-sm" />
              {{ '服用1回あたりの有効成分量： ' + efficacyCalculation }}
            </div>
          </div>
          <div class="row q-my-sm">
            <div class="dosage-variable-range">
              規定成分量範囲： {{ dosageVariableRange }}
              <span class="q-mr-xs">{{ dosageVariableRangeUnit }}</span>
            </div>
          </div>
        </div>
        <div v-if="prescriptionDetailForm.type_medicine_dosage == 1 &&
        ![2, 3, '2', '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == prescriptionDetailForm?.type_medicine_format_ui)?.code_func1 ) ">
          <q-btn
            label="投薬早見表"
            color="primary"
            size="sm"
            @click="
              () => {
                if (itemServiceUnitList.length === 0) {
                  mtUtils.autoCloseAlert('品名包装単位がありません。')
                  return
                }
                itemServiceUnitD = true
              }
            "
          />
          <q-dialog v-model="itemServiceUnitD">
            <q-card style="width: 720px; max-width: 80vw">
              <div class="row q-col-gutter-xs">
                <div class="col-12">
                  <!--              <p class="q-mb-md">早見表</p>-->
                  <table
                    class="table-custom-fixed q-pa-lg"
                    v-for="[index2, fixedDosage] in Object.entries(
                      dosageFixedListByGroup
                    )"
                    :key="index2"
                  >
                    <thead>
                    <tr>
                      <td class="q-ba q-pa-lg">
                        <div class="title2 text-grey-900 bold q-mb-xs">
                          {{
                            getItem(item.id_item_service)?.name_item_service
                          }}
                          {{
                            `( ${
                              useCommonStore().getCommonTypeAnimalOptionList.find(
                                (v) => v.value == index2
                              )?.label ?? '全種'
                            } )`
                          }}
                        </div>
                        <div class="text-body2 text-grey-700 flex items-center">
                          {{ item.name_category1 }}
                          <q-icon name="arrow_right" />
                          {{ item.name_category2 }}
                        </div>
                      </td>
                      <template
                        v-if="
                            itemServiceUnitList && itemServiceUnitList.length > 0
                          "
                      >
                        <template
                          v-for="(item, index) in itemServiceUnitList"
                          :key="index"
                        >
                          <td class="q-ba q-pa-lg">
                            <span>{{ item.name_service_item_unit }} </span>
                          </td>
                        </template>
                      </template>
                    </tr>
                    </thead>
                    <tbody>
                    <template v-if="fixedDosage && fixedDosage.length > 0">
                      <tr
                        v-for="(fixedDosage, index2) in fixedDosage"
                        :key="index2"
                      >
                        <td class="q-pa-sm q-ba q-pa-lg">
                            <span>
                              {{ fixedDosage.val_weight_min }}
                              <span class="body2">g</span> ~
                              {{ fixedDosage.val_weight_max }}
                              <span class="body2">g</span>{{ '  未満 ' }} <br />
                              <span class="flex justify-center">
                                {{
                                  ` ( ${
                                    useCommonStore().getCommonOptionList.find(
                                      (v) => v.value == fixedDosage.id_common
                                    )?.label ?? '全種'
                                  } )`
                                }}
                              </span>
                            </span>
                        </td>
                        <template
                          v-if="
                              itemServiceUnitList &&
                              itemServiceUnitList.length > 0
                            "
                        >
                          <template
                            v-for="(item2, index3) in itemServiceUnitList"
                            :key="index3"
                          >
                            <td
                              class="q-ba text-center fixed-detail-hover q-pa-lg"
                            >
                              <div
                                v-if="
                                    fixedDosage.dosage_fixed_detail_list &&
                                    fixedDosage.dosage_fixed_detail_list.length >
                                      0 &&
                                    fixedDosage.dosage_fixed_detail_list.find(
                                      (v) =>
                                        v.id_item_service_unit ==
                                          item2.id_item_service_unit &&
                                        v.id_dosage_fixed ==
                                          fixedDosage.id_dosage_fixed
                                    )
                                  "
                                class="cursor-pointer"
                              >
                                {{
                                  fixedDosage.dosage_fixed_detail_list.find(
                                    (v) =>
                                      v.id_item_service_unit ==
                                      item2.id_item_service_unit &&
                                      v.id_dosage_fixed ==
                                      fixedDosage.id_dosage_fixed
                                  )?.quantity
                                }}
                                 <span class="body2">{{
                                  fixedDosage.dosage_fixed_detail_list.find(
                                    (v) =>
                                      v.id_item_service_unit ==
                                      item2.id_item_service_unit &&
                                      v.id_dosage_fixed ==
                                      fixedDosage.id_dosage_fixed
                                  )?.type_unit_label
                                }}</span>
                              </div>
                              <div
                                v-else
                                class="cursor-pointer bg-grey-100 text-black full-width full-height"
                              ></div>
                            </td>
                          </template>
                        </template>
                      </tr>
                    </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </q-card>
          </q-dialog>
        </div>
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-auto">服用頻度 *</div>
          <div class="col-auto q-pt-sm">
            <template v-if="prescriptionDetailForm.type_medicine_dosage != '4'">
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_1"
                :label="dosageFrequencyList[0].label"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                @update:selected="selectedIdDosageFrequency"
                val="1"
                class="q-pr-md"
                :disable="disable_dosage_frequency_UI"
              />
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_2"
                :label="dosageFrequencyList[1].label"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                @update:selected="selectedIdDosageFrequency"
                val="2"
                class="q-pr-md"
                :disable="disable_dosage_frequency_UI"
              />
              <MtFormRadiobtn
                v-if="medicineObj.id_dosage_frequency_3"
                :label="dosageFrequencyList[2].label"
                v-model="prescriptionDetailForm.dosage_frequency_UI"
                @update:selected="selectedIdDosageFrequency"
                val="3"
                class="q-pr-md"
                :disable="disable_dosage_frequency_UI"
              />
            </template>
            <MtFormCheckBox
              label="他"
              v-model:checked="prescriptionDetailForm.dosage_frequency_CB_UI"
              @update:checked="checkedDosageFreqCB_UI"
              class="q-pr-md"
            />
          </div>
          <div
            class="col-4 q-pt-sm"
            v-if="prescriptionDetailForm.dosage_frequency_CB_UI"
          >
            <MtFormPullDown
              label="その他指定頻度"
              v-model:selected="prescriptionDetailForm.id_dosage_frequency"
              :options="filteredDoseOptionList"
              @update:selected="selectedIdDosageFrequency"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-4" v-if="prescriptionDetailForm.type_medicine_dosage">
            <MtFormInputNumber
              v-model:value="prescriptionDetailForm.total_days_dose"
              mode="dosage"
              :label="
                prescriptionDetailForm.type_medicine_dosage == '4'
                  ? '服用回数'
                  : '服用日数 *'
              "
              class="field-right-text total-days-dose-icon"
              :class="totalDoseUI"
              v-if="isQuantityAvailable"
              @update:value="
                () => {
                  prescriptionDetailForm.date_end = calculateDate(
                    prescriptionDetailForm.date_start,
                    prescriptionDetailForm.total_days_dose,
                    typeDoseUI
                  )
                }
              "
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-4">
            <MtFormInputDate
              v-model:date="prescriptionDetailForm.date_start"
              label="服用 開始日 *"
              @update:date="onDateChanged"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div
            class="col-4"
            v-if="
              !(
                prescriptionDetailForm.type_medicine_dosage == '10' ||
                typeDoseUI == '10'
              )
            "
          >
            <MtFormInputDate
              v-model:date="prescriptionDetailForm.date_end"
              label="服用 終了日"
              v-if="isQuantityAvailable"
              @update:date="onDateChanged"
            />
          </div>
          <div class="col-4">
            <MtFormPullDown
              label="処方時の薬剤形状 *"
              :options="useCommonStore().getCommonTypeMedicineFormatOptionList"
              v-model:selected="prescriptionDetailForm.type_medicine_format_ui"
              required
              :rules="[aahValidations.validationRequired]"
              @update:selected="selectedTypeMedicineFormat"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6">
            <MtInputForm
              v-model="prescriptionDetailForm.memo_dose"
              type="text"
              label="服用メモ"
              autogrow
            >
              <template #append>
                <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(42)" />
              </template>
            </MtInputForm>
          </div>
          <div class="col-6">
            <MtInputForm
              v-model="prescriptionDetailForm.memo_alert"
              type="text"
              label="注意事項"
              autogrow
            >
              <template #append>
                <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(43)" />
              </template>
            </MtInputForm>
          </div>
          <div class="col-6">
            <MtInputForm
              v-model="prescriptionDetailForm.memo_clinic_prep"
              type="text"
              label="調剤指示（院内メモ）"
              autogrow
            >
              <template #append>
                <q-icon class="cursor-pointer" name="add" @click="openAddTextTemplateModal(46)" />
              </template>
            </MtInputForm>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md justify-between">
          <div class="col">
            <MtFormCheckBox
              v-model:checked="prescriptionDetailForm.flg_non_charge"
              label="会計対象外"
            />
          </div>
          <div class="col">
            <MtFormCheckBox
              v-model:checked="bookingDetail.tBookingFlag"
              label="次回予定の作成"
              @update:checked="calculateBookingDate(bookingDetail, )"
            />
          </div>
          <div class="col">
            <MtInputForm
              v-model="prescriptionDetailForm.flg_apply_insurance"
              :items="[{ label: '保険適用' }]"
              type="checkbox"
            />
          </div>
          <div class="col-4 q-ml-md">
            <q-btn
              unelevated
              flat
              @click="removeItem(prescriptionDetailForm.id_item_service)"
            >
              <q-icon name="delete"></q-icon>
              削除
            </q-btn>
          </div>
        </div>

        <!-- T BOOKING -->
        <div class="" v-if="bookingDetail.tBookingFlag">
          <div class="row q-col-gutter-md q-pa-md items-center">
            <div class="col-4">
              <MtFormInputDate
                v-model:date="bookingDetail.date_booking_confirmed"
                datetime
                label="予定日"
              />
            </div>
            <div class="col-3 text-center">
              <MtInputForm
                v-model="bookingDetail.tBookingFlgTime"
                :items="[{ label: '時刻' }]"
                type="checkbox"
              />
            </div>
            <div v-if="bookingDetail.tBookingFlgTime" class="col-4">
              <MtFormPullDown
                v-model:selected="bookingDetail.time_booking_confirmed"
                :options="timeHourMinute"
                label="時：分"
                @update:selected="(value) => { if(value){ bookingDetail.datetime_booking_confirmed += value}}"
              />
            </div>
          </div>
          <div v-if="false" class="row q-col-gutter-md q-pa-md items-center">
            <div class="col-4">
              <MtInputForm
                v-model="bookingDetail.tBookingFlgRepeat"
                :items="[{ label: '繰返し' }]"
                type="checkbox"
              />
            </div>
            <div class="col-3" v-if="bookingDetail.tBookingFlgRepeat">
              <MtInputForm
                v-model="bookingDetail.days_repeat"
                label="繰り返しサイクル"
                type="number"
              />
            </div>
            <div class="col-4" v-if="bookingDetail.tBookingFlgRepeat">
              <MtFormPullDown
                v-model="bookingDetail.type_day"
                :options="typeDays"
                label="タイプ日"
                type="selection"
              />
            </div>

          </div>
          <div v-if="false" class="row q-col-gutter-md q-pa-md items-center">
            <div class="col-4">
              <MtInputForm
                v-model="bookingDetail.flg_continue"
                :items="[{ label: '継続' }]"
                type="checkbox"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="bookingDetail.flg_exempt"
                :items="[{ label: '猶予' }]"
                type="checkbox"
              />
            </div>
            <div class="col-4">
              <MtInputForm
                v-model="bookingDetail.flg_end"
                :items="[{ label: '最終' }]"
                type="checkbox"
              />
            </div>
          </div>
        </div>

      </div>
      <div
        v-if="medicineObj.flg_drip_carrier && prescriptionDetailForm.process_drip"
        class="q-mx-md drip-box q-pa-sm q-mb-md"
      >
        <div class="row items-center">
          <span class="text-white pill-title title4">点滴指示</span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-4">
            <MtFormPullDown
              label="処方時の薬剤形状 *"
              :options="useCommonStore().getCommonTypeMedicineFormatOptionList"
              v-model:selected="prescriptionDetailForm.type_medicine_format_ui"
              required
              :rules="[aahValidations.validationRequired]"
              @update:selected="selectedTypeMedicineFormat"
            />
          </div>
          <div class="col-4">
            <MtFormPullDown
              label="処方時の薬剤形状 *"
              :options="useCommonStore().getCommonTypeMedicineRouteList"
              v-model:selected="
                prescriptionDetailForm.process_drip.id_cm_med_route
              "
              required
              :rules="[aahValidations.validationRequired]"
              @update:selected="selectedTypeMedicineFormat"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-1">
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
              val="1"
            />
          </div>
          <div class="col-5">
            <MtInputForm
              v-model="prescriptionDetailForm.process_drip.time"
              type="number"
              label="投与時間"
              @updatedValue="
                () => {
                  prescriptionUtils.computeVolume(prescriptionDetailForm)
                  prescriptionUtils.computeFlowRate(prescriptionDetailForm)
                }
              "
              :disable="
                prescriptionDetailForm.process_drip.calculation_fixed_unit == '1'
              "
            />
          </div>
          <MtFormRadiobtn
            label="時間"
            v-model="prescriptionDetailForm.process_drip.time_unit"
            val="1"
            class="q-pr-md"
          />
          <MtFormRadiobtn
            label="分間"
            v-model="prescriptionDetailForm.process_drip.time_unit"
            val="2"
            class="q-pr-md"
          />
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-1">
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
              class="q-pr-md"
              val="2"
            />
          </div>
          <div class="col-5">
            <MtInputForm
              v-model="prescriptionDetailForm.process_drip.flow_rate"
              type="number"
              label="流量速度"
              @updatedValue="
                () => {
                  prescriptionUtils.computeTime(prescriptionDetailForm)
                  prescriptionUtils.computeVolume(prescriptionDetailForm)
                }
              "
              :disable="
                prescriptionDetailForm.process_drip.calculation_fixed_unit == '2'
              "
            />
          </div>
          <MtFormRadiobtn
            label="mL/時"
            v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
            val="1"
            class="q-pr-md"
          />
          <MtFormRadiobtn
            label="mL/分"
            v-model="prescriptionDetailForm.process_drip.flow_rate_unit"
            val="2"
            class="q-pr-md"
          />
        </div>
        <div class="row q-gutter-md q-mb-md">
          <div class="col-1">
            <MtFormRadiobtn
              v-model="prescriptionDetailForm.process_drip.calculation_fixed_unit"
              class="q-pr-md"
              val="3"
            />
          </div>
          <div class="col-5">
            <MtFormInputNumber
              v-model:value="getPrescriptionAssortVolume"
              :disable="
                prescriptionDetailForm.process_drip.calculation_fixed_unit == '3'
              "
              class="field-right-text assort-drip-text-1"
              label="投与量"
              mode="dosage"
              @update:value="
                (value) => {
                  usePrescriptionStore().setAssortVolume(value)
                  prescriptionUtils.computeTime(prescriptionDetailForm)
                  prescriptionUtils.computeFlowRate(prescriptionDetailForm)
                }
              "
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6">
            <MtInputForm
              v-model="prescriptionDetailForm.memo_dose"
              type="text"
              label="服用メモ"
              autogrow
            />
          </div>
          <div class="col-6">
            <MtInputForm
              v-model="prescriptionDetailForm.memo_alert"
              type="text"
              label="注意事項"
              autogrow
            />
          </div>
          <div class="col-6">
            <MtInputForm
              v-model="prescriptionDetailForm.memo_clinic_prep"
              type="text"
              label="調剤指示（院内メモ）"
              autogrow
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md justify-between">
          <div class="col-6">
            <MtFormCheckBox
              v-model:checked="prescriptionDetailForm.flg_non_charge"
              label="会計対象外"
            />
          </div>
          <div class="col-2 q-ml-md">
            <q-btn
              unelevated
              flat
              @click="removeItem(prescriptionDetailForm.id_item_service)"
            >
              <q-icon name="delete"></q-icon>
              削除
            </q-btn>
          </div>
        </div>
      </div>

      <!-- prescription assort data -->
      <div
        class="assort-container full-width q-mt-md"
        v-if="prescriptionDetailForm.prescription_detail_assort_list.length > 0"
      >
        <div class="q-mb-sm">
          <h4 class="text-white bg-grey-600 title4">
            {{ medicineObj?.flg_drip_carrier ? '投与薬明細' : '処方箋明細' }}
          </h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            以下の内容で処方します。
          </span>
        </div>
        <PrescriptionDetailAssortDripBox
          v-if="[2, 3, '2', '3'].includes(useCommonStore().getCommonTypeMedicineFormatOptionList.find((v)=> v.value == prescriptionDetailForm.type_medicine_format_ui)?.code_func1 )"
          :ref="setChildRef(prescriptionDetailForm.prescription_detail_assort_list.length - 1)"
          :efficacyCalculation="calculatedEfficacy"
          @whole-pill="updateWholePill"
          :itemServiceUnitList="itemServiceUnitList"
          :pillDivision="pillDivisionList"
          :prescription-assort="prescriptionDetailForm.prescription_detail_assort_list[prescriptionDetailForm.prescription_detail_assort_list.length - 1]"
          class="assort-box"
          @removeIndex="
              () => {
                prescriptionDetailForm.prescription_detail_assort_list.splice(
                  prescriptionDetailForm.prescription_detail_assort_list.length - 1,
                  1
                )
              }
            "
          :calculatedTotalDosage="calculatedTotalDosage"
        />
        <div
          v-else
          v-for="(
            prescriptionAssort, index
          ) in prescriptionDetailForm?.prescription_detail_assort_list"
          :key="prescriptionAssort.id_prescription_detail_assort"
          class="full-width"
        >
          <PrescriptionDetailAssortListBox
            class="assort-box"
            :ref="setChildRef(index)"
            :prescription-assort="prescriptionAssort"
            @removeIndex="
              () => {
                prescriptionDetailForm.prescription_detail_assort_list.splice(
                  index,
                  1
                )
              }
            "
            :itemServiceUnitList="itemServiceUnitList"
            :pillDivision="pillDivisionList"
            v-if="!prescriptionAssort.powderFormatUi"
          />
        </div>

        <div
          class="dose-container row q-py-md"
          v-if="!medicineObj.flg_drip_carrier"
        >
          <div class="col-6 items-center">
            <div class="flex items-center content-center">
              <div class="text-grey-700 q-mr-md">総服用回数</div>
              <div class="amount-dose">
                {{ calculatedTotalDosage }}
                回分
                <small class="regular" v-if="typeDoseUI != '10'">
                  （
                  {{
                    ' ' +
                    roundZeroAfterPoint(prescriptionDetailForm.total_days_dose) +
                    comTypeDose +
                    ' x 頻度 ' +
                    quantity_dose +
                    ' ' +
                    comTypeFreeUI
                  }}）
                </small>
              </div>
            </div>
          </div>
          <div class="col-2 second-col-dose flex content-center">
            <span class="q-mr-sm">服用形状</span>
            <span class="pill-title">{{
                prescriptionDetailForm.name_medicine_format ?? ''
              }}</span>
          </div>
        </div>
        <div
          class="dosage-variable-range"
          v-if="val_total_efficacyingredient && !medicineObj.flg_drip_carrier"
        >
          処方明細の総有効成分量：
          {{ roundZeroAfterPoint(val_total_efficacyingredient) + assortUnitUi }}
          <span class="q-ml-sm">
            （
            {{
              roundZeroAfterPoint(efficacyPetKg) + ` ${assortUnitUi} / Kg`
            }}
            ）</span
          >
        </div>
      </div>
    </div>

    <q-dialog
      v-model="toggleDivision"
      style="
        {
          width: 310px !important;
        }
      "
      @update:model-value="applyDefaultSetting"
    >
      <q-card class="mt-small-popup">
        <MtModalHeader
          class="bg-sky-blue"
          @close-modal="() => (toggleDivision = !toggleDivision)"
        >
          <div class="full-width">錠剤分割オプション</div>
        </MtModalHeader>
        <q-scroll-area class="division-model">
          <div class="q-col-gutter-md q-mb-xs q-pl-md q-pt-md">
            <div
              v-for="pill in pillDivisionList"
              :key="pill.id_common"
              class="col-auto"
            >
              <MtFormCheckBox
                v-model:checked="pill.flg_func1"
                :label="pill.name_common"
              />
            </div>
          </div>
        </q-scroll-area>
        <div class="flex justify-center q-py-md">
          <q-btn
            label="保存"
            size="sm"
            color="primary"
            @click="
              () => {
                feDivision.pill_division = pillDivisionList
                prescriptionDetailForm.fe_division = feDivision
                toggleDivision = false
                feDivision.fe_use = true
              }
            "
          ></q-btn>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>
<style>
</style>