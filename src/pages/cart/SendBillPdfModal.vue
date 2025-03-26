<script lang="ts" setup>
import { ref, Ref, computed } from 'vue'
import {
  GenericValueLabelType,
} from '@/types/types'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue';

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const modelValue = ref(null)
const showDiscount = ref(false)

const props = defineProps({
  popup: {
    type: Object,
    required: true
  },
  flgRefund: {
    type: Boolean,
    default: false
  }
})
const bottomSectionRef = ref()
const viewInvoiceBtnMarginLeft = computed(() => {
  const section = bottomSectionRef.value
  const popup = document.querySelector('.mt-small-popup')
  const leftPaddingApplied: number = 16
  if(section && popup){
    return `${Math.ceil((popup?.clientWidth - section?.clientWidth) / 2) - leftPaddingApplied}px`
  }
})

const btnOptions:Ref<Array<GenericValueLabelType>> = ref([
  { label: 'PDF出力', value: 1 },
  { label: '印刷', value: 2 },
  { label: 'myVetty', value: 3 }
])
const viewInvoiceVal: number = 4

const handleBtnClick = (value: Number) => {
  modelValue.value = value
  confirmBillPdf()
}

const confirmBillPdf = () => {
  props.popup.attr.isConfirmed = true
  props.popup.modelValue = modelValue.value
  props.popup.showDiscount = showDiscount.value
  closeModal()
}

</script>
<template>
  <q-card-section>
    <p class="text-center">診療明細書の出力</p>
    <div class="flex column gap-4">
      <div class="flex items-center gap-3" :style="{'margin-left': viewInvoiceBtnMarginLeft}" v-if="!(props.flgRefund)">
        <q-btn
          outline
          label="金額提示"
          @click="handleBtnClick(viewInvoiceVal)"
          class=""
        />
        <MtFormCheckBox v-model="showDiscount" label="個別割引の表示" />
      </div>
      <div class="flex items-center justify-center" style="gap: 20px; width: max-content; margin: auto;" ref="bottomSectionRef">
        <template v-for="option in btnOptions" :key="option.value">
          <q-btn
            :label="option.label"
            @click="handleBtnClick(option.value)"
            color="primary"
            class="no-uppercase"
          />
        </template>
      </div>
    </div>
  </q-card-section>
</template>
<style lang="scss" scoped>
.btn-options {
   border-radius: 20px;
  .q-btn--outline:before {
    border: 1px solid #1d7afc;
  }
  .q-btn--outline:not(:first-child):before {
    border-left: 0;
  }
}
</style>