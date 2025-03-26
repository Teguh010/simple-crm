<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useInsuranceStore from '@/stores/insurances'
import { storeToRefs } from 'pinia'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import selectOptions from '@/utils/selectOptions'
import mtUtils from '@/utils/mtUtils'
import useCommonStore from '@/stores/common'
import { concatenate } from '@/utils/aahUtils'

const InsuranceStore = useInsuranceStore()
const { getInsurers } = storeToRefs(InsuranceStore)

const props = defineProps({ popupDieaseInsurer: Object, cartObj: Object })
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const data = ref({
  id_cm_disease_insurer: null
})

const isChanged = ref(false)

const diseaseInsurerSelection: any = ref([])
const diseaseinsurerDefaultSelection: any = reactive([])

const updateDiseaseInsurerSelect = (selectedOptionsIds: any) => {
  if (!Boolean(selectedOptionsIds)) {
    return
  }
  data.value.id_cm_disease_insurer = selectedOptionsIds
  isChanged.value = true
}

const submit = () => {
  props.popupDieaseInsurer.value = {
    id_cm_disease_insurer: data.value.id_cm_disease_insurer,
    isChanged: isChanged.value
  }

  closeModal()
}

onMounted(async () => {
  await useCommonStore().fetchPreparationCommonList({ code_common: [6] })
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `check_disease_insurer_by_cart/${props.cartObj.id_cart}`
  )
  if (
    response &&
    response.id_cm_disease_insurer.length &&
    response.id_cm_disease_insurer.length > 0
  ) {
    data.value.id_cm_disease_insurer = response.id_cm_disease_insurer[0]
  }

  props.popupDieaseInsurer.value = null

  useCommonStore().getCommonDiseaseInsurerOptionList.map((item: any) => {
    let tempObj = {
      label: concatenate(item.name_common, `(${item.text2})`),
      value: item.id_common
    }
    diseaseInsurerSelection.value.push(tempObj)
  })
  diseaseinsurerDefaultSelection.push(...diseaseInsurerSelection.value)

  if (
    props.cartObj &&
    props.cartObj.name_ins1 != '' &&
    props.cartObj.name_ins2 != ''
  ) {
    const selectDiseaseInsurer = diseaseinsurerDefaultSelection.find(
      (insurer) => insurer.value == data.value.id_cm_disease_insurer
    )
    if (selectDiseaseInsurer) {
      if (
        props.cartObj.name_ins1 != selectDiseaseInsurer.name_ins1 ||
        props.cartObj.name_ins2 != selectDiseaseInsurer.name_ins2
      ) {
        data.value.id_cm_disease_insurer = `${props.cartObj.name_ins1} / ${props.cartObj.name_ins2}`
      }
      isChanged.value = false
    }
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 boldtitle2">
      保険傷病名の選択
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div
      v-if="
        diseaseinsurerDefaultSelection &&
        diseaseinsurerDefaultSelection.length > 0
      "
      class="col-6"
    >
      <MtFilterSelect
        v-model:options="diseaseInsurerSelection"
        v-model:selecting="data.id_cm_disease_insurer"
        @selected="updateDiseaseInsurerSelect"
        label="保険疾病（複数可）"
        :options-default="diseaseinsurerDefaultSelection"
        required
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>閉じる</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="submit()">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped></style>
