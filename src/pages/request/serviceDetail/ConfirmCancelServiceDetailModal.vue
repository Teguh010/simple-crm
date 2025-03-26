<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue';
import MtInputForm from '@/components/form/MtInputForm.vue';
import useServiceDetailStore from '@/stores/service-details';
import aahMessages from '@/utils/aahMessages';
import mtUtils from '@/utils/mtUtils';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const emits = defineEmits(['close'])
const props = defineProps({ id_customer: String, id_pet: String })
const serviceDetailStore = useServiceDetailStore()
const { getServiceDetail } = storeToRefs(serviceDetailStore)
const closeModal = () => {
  emits('close')
}
const data = ref({
  memo_cancel: '',
  id_customer: props.id_customer,
  id_pet: props.id_pet,
  flg_cancel: 0,
})
const submit = () => {
  data.value.flg_cancel = 1
  serviceDetailStore
    .updateServiceDetail(
      getServiceDetail.value?.id_request,
      getServiceDetail.value?.id_service_detail,
      data.value
    )
    .then(() => {
      closeModal()
      mtUtils.autoCloseAlert(aahMessages.success)
      serviceDetailStore.fetchServiceDetails(getServiceDetail.value?.id_request, { id_customer: getServiceDetail.value?.id_customer })
    })
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        次回スケジュール
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12">
          一度キャンセルした明細は変更不可になります。<br/>注意してキャンセルしてください。
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <MtInputForm
            autogrow
            type="text"
            label="キャンセル理由"
            v-model="data.memo_cancel"
            class-style="full-width"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>