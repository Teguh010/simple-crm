<script setup lang="ts">
import { PrescriptionDetailType } from '@/types/types'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'

import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import useDoseStore from '@/stores/dose-frequencies'
import useCommonStore from '@/stores/common'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'
import useItemServiceUnitStore from '@/stores/item-service-units'
import usePrintStore from '@/stores/prints'
import useClinicStore from '@/stores/clinics'
import { partialPillOptions, wholePillOptions } from '@/utils/enum'
import { keyBy } from 'lodash'

interface ItemServiceDetailRowProp {
  idx: number
  data: {}
  prescriptionDetail: PrescriptionDetailType
  openAddTextTemplateModal: (index: number, value: number) => {}
}

const props = defineProps<ItemServiceDetailRowProp>()

const doseStore = useDoseStore()
const { getDoses } = storeToRefs(doseStore)
const commonStore = useCommonStore()
const { getCommonUnitOptionList } = storeToRefs(commonStore)
const petsStore = usePetStore()
const { getPets } = storeToRefs(petsStore)
const customerStore = useCustomerStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const printStore = usePrintStore()
const { getAllPrints } = storeToRefs(printStore)
const clinicStore = useClinicStore()

const commonUnitOptionList = ref([])
const commonUnitOptionListDefault = ref([])

const partialPillOptionsByValue = keyBy(partialPillOptions, 'value')
const wholePillOptionsByValue = keyBy(wholePillOptions, 'value')

onMounted(async () => {
  let promises: any = []
  if (getDoses.value.length === 0) promises.push(doseStore.fetchDoses())
  if (commonStore.getCommonUnitOptionList.length === 0)
    promises.push(commonStore.fetchPreparationCommonList({ code_common: [4] }))
  promises.push(itemServiceUnitStore.fetchItemServiceUnits())
  await Promise.all(promises)
  if (commonStore.getCommonUnitOptionList.length > 0) {
    commonUnitOptionList.value = [
      ...commonStore.getCommonUnitOptionList.map((cu) => ({
        value: cu.label,
        label: cu.label
      }))
    ]
    commonUnitOptionListDefault.value.push(...commonUnitOptionList.value)
  }
})
</script>

<template>
  <div class="col-3" v-if="data.flg_show_image">
    <div
      class="pd-image flex items-center justify-center"
      v-if="prescriptionDetail.image_path1"
    >
      <img :src="prescriptionDetail.image_path1" />
    </div>
    <div v-else class="flex justify-center items-center full-height">
      画像なし
    </div>
  </div>
  <div :class="data.flg_show_image ? 'col-9' : 'col-12'">
    <div
      class="flex"
      v-for="(
        assort, assortIdx
      ) in prescriptionDetail.prescription_detail_assort_list"
      :key="assort.id_prescription_detail_assort"
    >
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-4">
          <MtFormInputText
            label="表示名"
            v-model="prescriptionDetail.isu_list[assortIdx].name_unit"
            :disable="data.type_name == '3'"
          />
        </div>
        <div class="col-4">
          <MtFormInputText
            label="服用頻度"
            v-model="prescriptionDetail.isu_list[assortIdx].name_dose_formal"
            :disable="!data.flg_display_doses_taken"
          />
        </div>
        <div class="col-4">
          <MtFormInputText
            v-model="prescriptionDetail.isu_list[assortIdx].pill_amount"
            label="総服用回数"
            mode="dosage"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-4">
          <MtFormInputText
            label="1回量"
            v-model="prescriptionDetail.isu_list[assortIdx].dosage_detail"
          />
        </div>
        <div class="col-4">
          <MtFilterSelect
            label="単位"
            :options="commonUnitOptionList"
            :options-default="commonUnitOptionListDefault"
            v-model:selecting="prescriptionDetail.isu_list[assortIdx].m_unit"
          />
        </div>
        <div class="col-4">
          <MtFormInputText
            label="その他"
            v-model="prescriptionDetail.isu_list[assortIdx].fraction"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-4">
          <MtFormInputText
            label="薬剤分類名を表示"
            v-model="prescriptionDetail.name_classification"
            :disable="!data.flg_display_classification_name"
          />
        </div>
        <div class="col-4">
          <MtFormInputText
            label="服用期間を表示"
            v-model="prescriptionDetail.duration"
            :disable="!data.flg_display_duration_use"
          />
        </div>
      </div>
    </div>

    <!--    limit-->
    <div class="row q-col-gutter-md q-mb-sm">
      <div class="col">
        <MtInputForm
          label="服用メモ"
          v-model="prescriptionDetail.memo_dose"
          :disable="!data.flg_memo_dose_display"
          type="text"
          autogrow
        >
          <template #append>
            <q-icon
              name="add"
              class="cursor-pointer"
              @click="openAddTextTemplateModal(idx, 42)"
            />
          </template>
        </MtInputForm>
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-sm">
      <div class="col">
        <MtInputForm
          label="効果効能"
          v-model="prescriptionDetail.memo_efficacy"
          :disable="!data.flg_display_memo_efficacy"
          type="text"
          autogrow
        >
          <template #append>
            <q-icon
              name="add"
              class="cursor-pointer"
              @click="openAddTextTemplateModal(idx, 43)"
            />
          </template>
        </MtInputForm>
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-sm">
      <div class="col">
        <MtInputForm
          label="注意事項"
          v-model="prescriptionDetail.memo_alert"
          :disable="!data.flg_display_memo_sideeffect"
          type="text"
          autogrow
        >
          <template #append>
            <q-icon
              name="add"
              class="cursor-pointer"
              @click="openAddTextTemplateModal(idx, 44)"
            />
          </template>
        </MtInputForm>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.prescription-detail {
  flex: 1;
  min-height: 36px;
  background-color: rgba(190, 204, 238, 0.3);
  &.unselected {
    background-color: $grey-400;
    border-left: 3px solid $grey-700;
  }
}
.pd-image {
  height: 100%;
  width: 100%;
  border: 1px solid #000;
  img {
    max-width: 75%;
    max-height: 75%;
  }
}
</style>
