<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdatePetInsuranceModal from './UpdatePetInsuranceModal.vue'
import mtUtils from '@/utils/mtUtils'
import useInsuranceStore from '@/stores/insurances'
import MtLabel from '@/components/MtLabel.vue'
import {storeToRefs} from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCommonStore from "@/stores/common";
import { setPageTitle } from '@/utils/pageTitleHelper'

const commonStore = useCommonStore()
const insuranceStore = useInsuranceStore()

const { getCommonTypeGeneralInsurerOptionList } = storeToRefs(commonStore)

const { getInsurances } = storeToRefs(insuranceStore)

const idInsurer = ref(getCommonTypeGeneralInsurerOptionList?.value[0]?.id_common)

const name_insurance_plan = ref('')

const columns = [
  {
    name: 'id_cm_insurer',
    label: 'ペット保険会社',
    field: 'id_cm_insurer',
    align: 'left',
    style: 'width: 12%',
    headerStyle: 'width: 12%'
  },
  {
    name: 'name_insurance_plan',
    label: '保険プラン名',
    field: 'name_insurance_plan',
    align: 'left',
    style: 'width: 20%',
    headerStyle: 'width: 20%'
  },
  {
    name: 'code_insurance_plan',
    label: '保険プラン商品コード',
    field: 'code_insurance_plan',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'term_insurance',
    label: '保険期間（カ月）',
    field: 'term_insurance',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'coverage',
    label: '保険適用率（％）',
    field: 'coverage',
    align: 'left'
  }
]
const insuranceOptions = ref([])
const insuranceDefaultOptions = reactive([])
const insuranceCompanyOptions = ref([])
const insuranceCompanyDefaultOptions = reactive([])
async function init() {
  await useCommonStore().fetchPreparationCommonList({'code_common': [29]})
  idInsurer.value = getCommonTypeGeneralInsurerOptionList?.value[0]?.id_common
  await insuranceStore.fetchInsurances({
    id_insurer: idInsurer.value
  })
  await insuranceStore.fetchInsurers()
  insuranceCompanyOptions.value.length = 0
  insuranceCompanyDefaultOptions.length = 0
  insuranceOptions.value.length = 0
  insuranceDefaultOptions.length = 0
  insuranceOptions.value = insuranceStore.getInsuranceDefaultOptions
  insuranceCompanyOptions.value = insuranceStore.getInsurerDefaultOptions
  insuranceCompanyOptions.value.forEach((insurerOptions) => {
    insuranceCompanyDefaultOptions.push(insurerOptions)
  })
  insuranceOptions.value.forEach((insuranceOption) => {
    insuranceDefaultOptions.push(insuranceOption)
  })
}

const openAddModal = async () => {
  insuranceStore.selectInsurance(null)
  await mtUtils.mediumPopup(UpdatePetInsuranceModal, {searchData: search})
}
const onRowClick = async (data) => {
  insuranceStore.selectInsurance(data.id_insurance_plan)
  await mtUtils.mediumPopup(UpdatePetInsuranceModal, { data, searchData: search })
}
const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  insuranceStore.fetchInsurances({
    id_cm_insurer: idInsurer.value
  })
}

const insureCompanyName = (id: any) => {
  return getCommonTypeGeneralInsurerOptionList.value.find((item:any) => item.id_common === id)
    ?.name_common
}
const setAlways = (value) => {
  search()
}
init()

onMounted(() => {
  setPageTitle('ペット保険プラン一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          ペット保険プラン一覧
        </q-toolbar-title>
        <MtFormPullDown
          v-model:selected="idInsurer"
          outlined
          label="保険会社"
          :options="getCommonTypeGeneralInsurerOptionList"
          class="q-mr-sm selection-field"
          @update-model-value="setAlways"
        />
        <q-btn
          @click="openAddModal()"         
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="20px" name="add" />保険プラン
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="getInsurances"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100vh - 70px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div class="body1 regular text-grey-900">
            <!-- {{ row[col.field] }} -->
            {{
              col.field === 'id_cm_insurer'
                ? insureCompanyName(row[col.field])
                : row[col.field]
            }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
