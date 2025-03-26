<script setup lang="ts">
import useCustomerStore from '@/stores/customers'
import useEmployeeStore from '@/stores/employees'
import useIllnessHistoryStore from '@/stores/illness-history'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { typeDiagnosisConfidence } from '@/utils/enum'

const UpdateIllnessHistoryModal = defineAsyncComponent(
  () => import('@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue')
)

const props = defineProps({ id_pet: String, id_customer: String })
const illnessHistoryStore = useIllnessHistoryStore()
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const apiCalled = ref(false)
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)
const { getPet } = storeToRefs(customerStore)
const { getAllEmployees } = storeToRefs(employeeStore)

const getFormLabels = (type_history: number) => {
  switch (type_history) {
    case 1:
      return {
        labelMemoSymptoms: '主訴',
        labelMemoInspection: '検査 / 類症鑑別',
        labelMemoDiagnosis: '評価 / 診断',
        labelMemoPlan: '治療方針',
        labelMemoAfter: '予後',
        labelMemoOther: 'その他'
      }
    case 2: // Prevent related history 予防・健診歴
      return {
        labelMemoSymptoms: 'ワクチンメモ',
        labelMemoInspection: 'フィラリアメモ',
        labelMemoDiagnosis: 'ノミダニメモ',
        labelMemoPlan: '狂犬病メモ',
        labelMemoAfter: '健康診断メモ',
        labelMemoOther: 'その他'
      }
    case 4: // Salon 美容歴
      return {
        labelMemoSymptoms: 'トリミング時の反応と行動',
        labelMemoInspection: 'アレルギーや皮膚の問題',
        labelMemoDiagnosis: 'オーナー基本要望',
        labelMemoPlan: 'トリマー共通メモ',
        labelMemoAfter: 'トリミングによるケガ',
        labelMemoOther: 'その他'
      }
    case 8: // Other history その他
      return {
        labelMemoSymptoms: 'オーナーの要望',
        labelMemoInspection: '獣医師の推奨',
        labelMemoDiagnosis: '',
        labelMemoPlan: '',
        labelMemoAfter: '',
        labelMemoOther: 'その他'
      }
    default:
      return {
        labelMemoSymptoms: '主訴',
        labelMemoInspection: '検査 / 類症鑑別',
        labelMemoDiagnosis: '評価 / 診断',
        labelMemoPlan: '治療方針',
        labelMemoAfter: '予後',
        labelMemoOther: 'その他'
      }
  }
}

const openAddModal = () => {
  illnessHistoryStore.selectIllnessHistory(null)
  mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    petSelected: getPet.value,
    create: true
  })
}
const getEmployeeName = (id) => getAllEmployees.value.find(employee => employee.value === id)?.label
const getDiagnosisConfidence = (id) => typeDiagnosisConfidence.find(v => v.value === id)?.label
const openEditIllnessHistoryModal = async (id_pet_illness_history) => {
  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    petSelected: getPet.value,
    id_pet_illness_history
  })
  await init()
}
defineExpose({
  fetchMoreData
})

async function fetchMoreData() {

  await illnessHistoryStore.fetchMoreIllnessHistoryList({
    id_pet: props?.id_pet,
    id_customer: props?.id_customer
  }, true)
}


const init = async () => {
  await illnessHistoryStore.fetchMoreIllnessHistoryList({ id_pet: props?.id_pet, id_customer: props?.id_customer })
}


const handleScroll = async (e) => {
  if (e.verticalPercentage == 1 && !apiCalled.value) {
    apiCalled.value = true
    await fetchMoreData()
    apiCalled.value = false
  }
}
onMounted(async () => {
  init()
})
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar q-pr-md"
    style="width: 100%; max-width: 100%"
    @scroll="handleScroll"
    ref="scrollAreaRef"
  >
    <div class="flex items-center justify-end q-py-sm">
      <q-btn
        unelevated
        padding="6px 14px"
        color="primary"
        text-color="white"      
        @click="openAddModal"
      >
        <q-icon size="18px" name="add" class="q-mr-xs" />現疾患・既往歴
      </q-btn>
    </div>
    <div class="row q-col-gutter-sm" v-if="getIllnessHistorys && getIllnessHistorys.length > 0">
      <div 
        v-for="illness in getIllnessHistorys"
        :key="illness.id_pet_illness_history"
        class="col-3"
      >
        <div
          class="item_divier_illness_history"
          :class="{
            'bg-history-2': illness.type_history == 2,
            'bg-history-4': illness.type_history == 4,
            'bg-history-1':
            illness.type_history != 2 && illness.type_history != 4
          }"
          @click="openEditIllnessHistoryModal(illness.id_pet_illness_history)"
          clickable
        >
          <div class="flex justify-between items-center q-pb-md">
            <div class="q-py-xs">
              <div class="q-mb-sm">
                <span class="title2 bold text-grey-900 q-mr-md">
                  {{
                    illness.name_disease
                      ? illness.name_disease
                      : illness.name_disease_free
                  }}
                </span>
                <span class="text-grey-600 q-mb-sm">
                  {{ illness.date_req_bgn ?? '----/--/--' }}
                  {{ illness.date_req_end ? '～' + illness.date_req_end : '' }}
                </span>
              </div>
              <div class="q-mb-sm" v-if="illness?.id_employee_doctor">
                <small class="field-label1">担当医</small>
                {{ getEmployeeName(illness.id_employee_doctor) }}
              </div>
              <div class="q-mb-sm" v-if="illness?.id_employee_staff">
                <small class="field-label1">VT</small>
                {{ getEmployeeName(illness.id_employee_staff) }}
              </div>
              <div class="q-mb-sm" v-if="illness.diagnosis_confidence !== null && illness.diagnosis_confidence !== 4">
                <small class="field-label1">診断確度</small>
                {{ getDiagnosisConfidence(illness.diagnosis_confidence) }}
              </div>
              <div class="q-mb-sm" v-if="illness.memo_symptoms">
                <span class="field-label1">主訴</span>
                {{ illness?.memo_symptoms }}
              </div>
              <div class="q-mb-sm" v-if="illness.memo_inspection && illness.memo_inspection != 'null'">
                <span class="field-label1">{{ getFormLabels(illness.type_history).labelMemoInspection }}</span>
                {{ illness.memo_inspection  }}
              </div>
              <div class="q-mb-sm" v-if="illness.memo_diagnosis && illness.memo_diagnosis != 'null'">
                <span class="field-label1">{{ getFormLabels(illness.type_history).labelMemoDiagnosis }}</span>
                {{ illness.memo_diagnosis  }}
              </div>
              <div class="q-mb-sm" v-if="illness.memo_plan && illness.memo_plan != 'null'">
                <span class="field-label1">{{ getFormLabels(illness.type_history).labelMemoPlan }}</span>
                {{ illness.memo_plan  }}
              </div>
              <div class="q-mb-sm" v-if="illness.memo_after && illness.memo_after != 'null'">
                <span class="field-label1">{{ getFormLabels(illness.type_history).labelMemoAfter }}</span>
                {{ illness.memo_after  }}
              </div>
              <div class="q-mb-sm" v-if="illness.memo_other && illness.memo_other != 'null'">
                <span class="field-label1">{{ getFormLabels(illness.type_history).labelMemoOther }}</span>
                {{ illness.memo_other }}
              </div>
            </div>
            <div class="flex">
              <q-icon v-if="illness.flg_surgery" class="q-mr-md" name="brush" size="32" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="q-pl-md text-grey-500">
      既往歴・現疾患はありません。
    </p>
  </q-scroll-area>
</template>

<style lang="scss" scoped>
.item_divier_illness_history {
  cursor: pointer;
  border-radius: 10px;
  padding: 8px 10px 7px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  line-height: 1.4;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  

  .prescription-name {
    max-width: 30vw;
    
    @media screen and (max-width: 1440px) {
      max-width: 22vw;
    }
  }

  .field-label-free-color {
    padding: 2px 8px;
    border-radius: 4px;
    margin-right: 4px;
    
    &.chip-blue { background: $primary; }
    &.chip-red { background: $negative; }
    &.chip-purple { background: $secondary; }
    &.chip-green { background: $positive; }
  }

  .body2 {
    font-size: 14px;
    line-height: 1.3;
  }
  
  .caption2 {
    font-size: 12px;
    line-height: 1.2;
  }
  
  .text-grey-700 {
    line-height: 1.25;
  }
}
.bg-history-2 {
  background-color: rgba(179, 255, 169, 0.5);
  &:hover {
    background-color: rgba(179, 255, 169, 0.75);
  }
  &:active {
    background-color: rgba(179, 255, 169, 0.8);
  }

}
.bg-history-4 {
  background-color: rgba(255, 192, 241, 0.5);
  &:hover {
    background-color: rgba(255, 192, 241, 0.75);
  }
  &:active {
    background-color: rgba(255, 192, 241, 0.8);
  }
}
.bg-history-1 {
  background-color: rgba(206, 206, 206, 0.50);
  &:hover {
    background-color: rgba(206, 206, 206, 0.75);
  }
  &:active {
    background-color: rgba(206, 206, 206, 0.8);
  }
}
</style>