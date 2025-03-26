<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useInsuranceStore from '@/stores/insurances'
import { storeToRefs } from 'pinia'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import mtUtils from '@/utils/mtUtils'
import useCartStore from '@/stores/carts'
import useCommonStore from '@/stores/common'
import { concatenate } from '@/utils/aahUtils'
import useCartDetailStore from '@/stores/cart-details'

const InsuranceStore = useInsuranceStore()
const { getInsurers } = storeToRefs(InsuranceStore)

const props = defineProps({ pet: Object, forValidation: false, cart_detail_list: Object })
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const data = ref({
  id_cm_disease_insurer: null,
  flg_disease_out: false
})

const diseaseInsurerSelection: any = ref([])
const diseaseinsurerDefaultSelection: any = reactive([])

const updateDiseaseInsurerSelect = async (selectedOptionsIds: any) => {
  if (!Boolean(selectedOptionsIds)) {
    return
  }
  data.value.flg_disease_out = false
  if (
    useCartStore().getCart?.pet_insurance?.id_cm_disease_insurer_out1 ==
    selectedOptionsIds ||
    useCartStore().getCart?.pet_insurance?.id_cm_disease_insurer_out2 ==
    selectedOptionsIds ||
    useCartStore().getCart?.pet_insurance?.id_cm_disease_insurer_out3 ==
    selectedOptionsIds
  ) {
    await mtUtils.alert(
      'この疾患では保険の申請はできません。\n申請前に疾患を確認し、申請作業を行って下さい。',
      '確認して下さい。'
    )
    data.value.flg_disease_out = true
    return
  }

}

const isChanged = ref(false)

const submit = async () => {
  const insuredDiseaseByTypeInsurer =
    diseaseinsurerDefaultSelection.filter((v: any) => data.value.id_cm_disease_insurer == v.value)

  if (insuredDiseaseByTypeInsurer && insuredDiseaseByTypeInsurer.length > 0) {

    if (useCartStore().getCart?.pet_insurance?.code_insurer != insuredDiseaseByTypeInsurer[0]?.code_func1) {
      await mtUtils.alert('You have selected the wrong insurance company.')
      return
    }
  }

  let formattedData = []
  if (props.forValidation) {


    props.cart_detail_list.forEach((cartDetail) => {

      const tempObj = {
        id_cart_detail: cartDetail.id_cart_detail,
        name_ins1: null,
        name_ins2: null,
        flg_pet_insurance: cartDetail.flg_pet_insurance,
        id_cart: cartDetail.id_cart,
        type_insurance_purpose: cartDetail.type_insurance_purpose,
        flg_disease_out: cartDetail.flg_disease_out
      }

      if (
        insuredDiseaseByTypeInsurer &&
        insuredDiseaseByTypeInsurer.length > 0
      ) {
        const tempDiseaseInsured = insuredDiseaseByTypeInsurer[0]
        tempObj.name_ins1 = tempDiseaseInsured.text1
        tempObj.name_ins2 = tempDiseaseInsured.name_common
      }

      formattedData.push(tempObj)
    })

    await useCartDetailStore().bulkUpdateFlgPetInsurance(formattedData)
    closeModal()
    return
  }

  const pet = props.pet

  for (const date in pet.dates) {
    if (pet.dates.hasOwnProperty(date)) {
      pet.dates[date].filter((cd) => cd.checked).forEach((cartDetail) => {

        const tempObj = {
          id_cart_detail: cartDetail.id_cart_detail,
          name_ins1: null,
          name_ins2: null,
          flg_pet_insurance: cartDetail.flg_pet_insurance,
          id_cart: cartDetail.id_cart,
          type_insurance_purpose: cartDetail.type_insurance_purpose,
          flg_disease_out: data.value.flg_disease_out
        }

        if (
          insuredDiseaseByTypeInsurer &&
          insuredDiseaseByTypeInsurer.length > 0
        ) {
          const tempDiseaseInsured = insuredDiseaseByTypeInsurer[0]
          tempObj.name_ins1 = tempDiseaseInsured.text1
          tempObj.name_ins2 = tempDiseaseInsured.name_common
        }


        formattedData.push(tempObj)
      })
    }
  }

  await useCartDetailStore().bulkUpdateFlgPetInsurance(formattedData)

  closeModal()
}

onMounted(async () => {
  await useCommonStore().fetchPreparationCommonList({ code_common: [6] })

  useCommonStore().getCommonDiseaseInsurerOptionList.map((item: any) => {
    let tempObj = {
      label: concatenate(item.name_common, `(${item.text2})`),
      value: item.id_common,
      code_func1: item.code_func1,
      name_common: item.name_common,
      text1: item.text1
    }
    if (tempObj.code_func1 == useCartStore().getCart?.pet_insurance?.code_insurer) {
      diseaseInsurerSelection.value.push(tempObj)
      diseaseinsurerDefaultSelection.push(tempObj)
    }
  })

  diseaseInsurerSelection.value = [...diseaseinsurerDefaultSelection]
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 boldtitle2">
      保険傷病名の選択
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div class="col-6">
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
