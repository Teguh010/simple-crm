<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import MtModalHeader from '../MtModalHeader.vue'
import useLabResultStore from '@/stores/lab-results';
import { storeToRefs } from 'pinia';
import LabResultPetDetail from './LabResultPetDetail.vue';
import useCustomerStore from '@/stores/customers';
import MtFilterSelect from '../MtFilterSelect.vue';
import useIllnessHistoryStore from '@/stores/illness-history';
import { IllnessHistoryType } from '@/types/types';
import MtPetInfo from '../MtPetInfo.vue';

const props = defineProps({id_pet: String, id_lab_result: String, id_pet_illness_history: String})
const labResultStore = useLabResultStore()
const customerStore = useCustomerStore()
const illnessHistoryStore = useIllnessHistoryStore()

const { getLabResult } = storeToRefs(labResultStore)
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)

const illnessHistoryList = ref<IllnessHistoryType[]>([])
const illnessHistoryListDefault = reactive<{label: string, value: number}[]>([])
const illnessHistorySelected = ref()
const customerSelected = ref()
const labResultPetDetailRef = ref()
const petSelected = ref()
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }
const data = ref({
  val_result: '',
  qualifier: '',
})

const openLabResultMultiModal = () => {
  if (labResultPetDetailRef.value) {
    labResultPetDetailRef.value.openLabResultMultiModal()
  }
}
const togglePdfConfirmation = () => {
  if (labResultPetDetailRef.value) {
    labResultPetDetailRef.value.togglePdfConfirmation()
  }
}
const handleFilterChange = () => {
  if (labResultPetDetailRef.value) {
    labResultPetDetailRef.value.handleFilterChange({})
  }
}
onMounted(async () => {
  if (props.id_lab_result) await labResultStore.selectLabResult(props.id_lab_result)

  data.value = getLabResult.value
  customerSelected.value = getCustomer.value
  petSelected.value = getPet.value

  if (getIllnessHistorys.value.length == 0) await illnessHistoryStore.fetchIllnessHistorys({ id_pet: props?.id_pet, id_customer: props?.id_customer })
  getIllnessHistorys.value.forEach((v: IllnessHistoryType) =>
    illnessHistoryListDefault.push({ label: v.name_disease ? v.name_disease : v.name_disease_free, value: v.id_pet_illness_history }))
  illnessHistoryList.value = [...illnessHistoryListDefault]
})
</script>

<template>
  <MtModalHeader class="lab-result-header full-width" @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold row items-center">
      検査結果
      <MtPetInfo class="ellipsis full-width" />
    </q-toolbar-title>

    <MtFilterSelect
      v-model:options="illnessHistoryList"
      v-model:selecting="illnessHistorySelected"
      ref="illnessHistoryRef"
      label="現疾患・既往歴"
      :options-default="illnessHistoryListDefault"
      :options-label="(v: IllnessHistoryType) => v.name_disease ? v.name_disease : v.name_disease_free"
      @onEnterPress="handleFilterChange"
      @update:selecting="handleFilterChange"
      class="q-mr-md"
    />
    <q-btn outline label="結果結果：比較" class="q-mr-sm" @click="openLabResultMultiModal()" />
    <q-btn outline label="検査結果：1回" class="q-mr-md" @click="togglePdfConfirmation()" />
  </MtModalHeader>
  <q-scroll-area class="col-grow full-height">
    <q-card-section class="q-pt-none relative-position view-lab-result">
      <LabResultPetDetail
        ref="labResultPetDetailRef"
        hide-header
        :illnessHistorySelected="illnessHistorySelected"
        :id_pet_illness_history="props.id_pet_illness_history"
        :id_pet="petSelected?.id_pet"
        :id_customer="customerSelected?.id_customer"
      />
    </q-card-section>
  </q-scroll-area>
  <!-- <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" type="submit">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section> -->
</template>
<style lang="scss" scoped>
.view-lab-result {
  .separate-scrollbar {
    height: calc(100vh - 189px + 50px);
  }
}

.lab-result-header {
  @media screen and (max-width: 1024px) {
    .q-btn{
      padding: 4px 4px;
      :deep(.q-icon) {
        font-size: 16px;
      }
    }
  }
  
  @media screen and (max-width: 768px) {
    .q-btn {
      padding: 4px 0;
      margin-right: 2px;
      :deep(.q-icon) {
        font-size: 12px;
      }
    }

    .q-btn--round {
      min-width: 1.5em;
    }
    
    .q-toolbar__title, :deep(.pet-name), :deep(.pet-kana-name) {
      font-size: 10px !important;
    }
  }
}
</style>