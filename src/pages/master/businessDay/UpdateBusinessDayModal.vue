<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import useBusinessDayStore from '@/stores/business-day'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { typeWeekday } from '@/utils/enum'

const props = defineProps({
  data: Object
})
const businessHourSlot = useBusinessHourSlot()
const businessDayStore = useBusinessDayStore()
const { getAllBusinessHourSlots } = storeToRefs(businessHourSlot)
const businessForm = reactive({
  id_business_day: '',
  type_weekday: null,
  id_business_hour_slot: ''
})
const isEdit = ref(false)
const emits = defineEmits(['close'])

const submit = () => {
  businessDayStore
      .updateBusinessDay(businessForm.id_business_day, businessForm)
      .then(async () => {
        await businessDayStore.fetchBusinessDays()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
}

function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      businessForm[key] = data[key]
    }
  }
}

const closeModal = () => {
  emits('close')
}

onMounted(() => {
  if (props.data?.id_business_day) {
    // Update case
    isEdit.value = true
    assignPageData(props.data)
  } else {
    // Create case
    isEdit.value = false
  }
})
</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="true">
      <q-toolbar-title class="text-grey-900 title2 bold">
        診療日 通常スケジュール
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="q-px-lg">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtFormPullDown
            v-model:selected="businessForm.type_weekday"
            v-model:options="typeWeekday"
            required
            :rules="[aahValidations.validationSelection]"
            label="対象日 *"
            :disable="isEdit"
            class="bg-grey-200"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtFormPullDown
            v-model:selected="businessForm.id_business_hour_slot"
            v-model:options="getAllBusinessHourSlots"
            required
            :rules="[aahValidations.validationSelection]"
            label="診療時間枠 *"
            autofocus
            tabindex="1"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" tabindex="2" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
