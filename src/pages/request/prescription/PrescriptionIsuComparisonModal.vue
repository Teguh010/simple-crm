<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, ref } from 'vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'


const props = defineProps({ comparisonResponse: Object, callBack: Function, prescriptionDetailList: Object })

const emit = defineEmits(['close'])
const closeModal = () => emit('close')

const getNamePrescription = (value) => {
  return props.prescriptionDetailList.find((pd) => pd.id_prescription_detail == value)?.name_prescription_display
}

const handleSubmit = async () => {
  props.callBack({
    pA_list: selectedValue.value,
    submitted: true
  })
  closeModal()
}

const selectedValue = ref({})

onMounted(() => {

  Object.values(props.comparisonResponse).forEach((value) => {
    Object.values(value).forEach((pa) => {
      selectedValue.value[pa.id_prescription_detail_assort] = pa.old_price.id_price
      if (pa.new_price)
        selectedValue.value[pa.id_prescription_detail_assort] = pa.new_price.id_price
    })
  })

})


</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold prescription-title cursor-pointer">
        料金の変更があります！
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">

      <div class="row full-width">
        <div class="body regular text-grey-700 q-mb-md">料金レートを選択してください。</div>
        <div class="c-grid-c">
          <div>
            対象の医薬品
          </div>
          <div>
            旧価格
          </div>
          <div>
            新価格
          </div>
        </div>
      </div>
      <div v-for="(value, k) in comparisonResponse" :key="k" class="row full-width q-mt-md q-bl-md-sky-blue">
        <div class="q-pl-sm">{{ getNamePrescription(k) }}</div>
        <div v-for="(pa, paV) in value" :key="paV" class="c-grid-c q-my-xs">
          <div class="q-pl-lg">{{ paV }}</div>
          <MtFormRadiobtn v-model:selected="selectedValue[pa.id_prescription_detail_assort]" :label="pa.old_price.price"
                          :val="pa.old_price.id_price"></MtFormRadiobtn>
          <MtFormRadiobtn v-if="pa.new_price.id_price"
                          v-model:selected="selectedValue[pa.id_prescription_detail_assort]"
                          :label="pa.new_price.price" :val="pa.new_price.id_price"></MtFormRadiobtn>
        </div>
      </div>

    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>適用</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.c-grid-c {
  display: grid;
  grid-template-columns: 3.5fr 1fr 1fr;
  gap: 20px;
  width: 100%;
}

</style>