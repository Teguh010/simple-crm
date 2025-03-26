<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useInsuranceStore from '@/stores/insurances'
import { storeToRefs } from 'pinia'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import selectOptions from '@/utils/selectOptions'
import mtUtils from '@/utils/mtUtils'
import useCartStore from '@/stores/carts'
import useCommonStore from '@/stores/common'
import { concatenate } from '@/utils/aahUtils'

const InsuranceStore = useInsuranceStore()
const { getInsurers } = storeToRefs(InsuranceStore)

const props = defineProps({ popupDieaseInsurer: Object, cartDetailObj: Object })
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const data = ref({
  id_cm_disease_insurer: null
})

const diseaseInsurerSelection: any = ref([])
const diseaseinsurerDefaultSelection: any = reactive([])

const updateDiseaseInsurerSelect = (selectedOptionsIds: any) => {
  if (!Boolean(selectedOptionsIds)) {
    return
  }
  data.value.id_cm_disease_insurer = selectedOptionsIds
  isChanged.value = true
}

const isChanged = ref(false)

const submit = () => {
  props.popupDieaseInsurer.value = {
    id_cm_disease_insurer: data.value.id_cm_disease_insurer,
    isChanged: isChanged.value
  }
  closeModal()
}

onMounted(async () => {
  useCommonStore().fetchPreparationCommonList({ code_common: [6] })
  
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `check_disease_insurer`,
    {
      id_cart_detail: props.cartDetailObj.id_cart_detail,
      id_cm_insurer: useCartStore().getCart?.pet_insurance?.id_cm_insurer,
      id_disease: props.cartDetailObj?.disease?.id_disease
    }
  )

  if (response) {
    data.value.id_cm_disease_insurer = response.id_common
  }
  props.popupDieaseInsurer.value = null

  useCommonStore().getCommonDiseaseInsurerOptionList.map((item: any) => {
    let tempObj = {
      label: concatenate(item.name_common, `(${item.text2})`),
      value: item.id_common
    }
    diseaseInsurerSelection.value.push(tempObj)
    diseaseinsurerDefaultSelection.push(tempObj)
  })

  diseaseInsurerSelection.value = [...diseaseinsurerDefaultSelection]

  if (
    props.cartDetailObj &&
    props.cartDetailObj.name_ins1 != '' &&
    props.cartDetailObj.name_ins2 != ''
  ) {
    const selectDiseaseInsurer = diseaseinsurerDefaultSelection.find(
      (insurer) => insurer.value == data.value.id_cm_disease_insurer
    )

    if (selectDiseaseInsurer) {
      if (
        props.cartDetailObj.name_ins1 != selectDiseaseInsurer.name_ins1 ||
        props.cartDetailObj.name_ins2 != selectDiseaseInsurer.name_ins2
      ) {
        data.value.id_cm_disease_insurer = `${props.cartDetailObj.name_ins1} / ${props.cartDetailObj.name_ins2}`
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
        :options-default="diseaseinsurerDefaultSelection"
        label="保険疾病（複数可）"
        required
        @selected="updateDiseaseInsurerSelect"
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>閉じる</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" unelevated @click="submit()">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped></style>
