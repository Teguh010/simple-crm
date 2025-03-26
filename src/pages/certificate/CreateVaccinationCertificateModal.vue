<script lang="ts" setup>
import { onMounted, ref, reactive } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateToday } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { typePetGender } from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })

const data = ref({
  name_family: '',
  address: '',
  name_pet: '',
  datetime_birth: getDateToday(),
  name_breed: '',
  type_gender: 1,
  datetime_service: getDateToday(),
  name_service_item_unit: '',
  memo_item_description: '',
  date: getDateToday(),
  number_request: ''
})

const closeModal = () => {
  emits('close')
}
const submit = () => {}
onMounted(() => {
  if (props?.data) {
    data.value.name_family = props.data?.name_family + props.data?.name_first
    data.value.address =
      (props.data?.zip_code || '') +
      (props.data?.address_prefecture || '') +
      (props.data?.address_city || '') +
      (props.data?.address_other || '')
    data.value.name_pet = props.data?.name_pet
    data.value.datetime_birth = props.data?.datetime_birth
    data.value.name_breed = props.data?.name_breed
    data.value.type_gender = props.data?.type_gender
    data.value.datetime_service = props.data?.datetime_service
    data.value.name_service_item_unit = props.data?.name_service_item_unit
    data.value.memo_item_description = props.data?.memo_item_description
    data.value.date = props.data?.date
    data.value.number_request = props.data?.value?.code_customer
  }
})
</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader
      class="q-px-md q-py-md"
      @close-modal="closeModal"
      :closeBtn="false"
    >
      <q-toolbar-title
        class="text-grey-900 title2 bold"
        style="max-width: max-content"
      >
        予防接種証明書
      </q-toolbar-title>
      <div class="body1 text-grey-900 q-ml-md">
        <span
          >リクエスト番号:
          <span class="text-blue">{{ data.number_request }}</span></span
        >
      </div>
    </MtModalHeader>
    <q-card-section class="q-px-xl q-pt-sm q-pb-md bg-white main_Content">
      <div class="fit">
        <div class="row align-start justify-start q-mt-sm">
          <MtInputForm
            type="text"
            label="飼主名"
            v-model="data.name_family"
            class="col-3"
          />
        </div>
        <div class="row align-start justify-start q-mt-md">
          <MtInputForm
            type="text"
            label="オーナー住所"
            v-model="data.address"
            class="fit"
          />
        </div>
      </div>
      <div class="row no-wrap align-start justify-start q-mt-md">
        <MtInputForm
          type="text"
          label="ペット名"
          class="col-3"
          v-model="data.name_pet"
        />
        <MtFormInputDate
          :datetime="true"
          v-model:date="data.datetime_birth"
          label="生年月日"
          class="col-3 q-ml-sm"
        />
      </div>
      <div class="row align-start justify-start q-mt-md">
        <MtInputForm
          type="text"
          label="品種名"
          class="col-6"
          v-model="data.name_breed"
        />
      </div>
      <div class="row items-center justify-start q-mt-md">
        <span class="text-grey-700">性別 :</span>
        <div class="row items-center q-ml-md">
          <MtInputForm
            type="radio"
            :items="typePetGender"
            v-model="data.type_gender"
          />
        </div>
      </div>
      <div class="q-mt-sm bg-grey-100 q-pa-md">
        <div class="row">
          <MtFormInputDate
            :datetime="true"
            v-model:date="data.datetime_service"
            label="接種日"
            class="col-3"
          />
        </div>
        <div class="row items-center justify-start q-mt-md">
          <MtInputForm
            type="text"
            label="摂取したワクチン"
            class="col-3"
            v-model="data.name_service_item_unit"
          />
        </div>
        <div class="row items-center justify-start q-mt-md">
          <MtInputForm
            type="text"
            label="ワクチン詳細"
            class="fit"
            v-model="data.memo_item_description"
          />
        </div>
        <div class="row q-mt-md">
          <MtFormInputDate
            :datetime="true"
            v-model:date="data.date"
            label="次回予定日"
            class="col-3"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="full-width q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.main_Content {
  max-height: calc(100vh - 300px) !important;
  overflow-y: scroll;
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  scrollbar-width: none; /* Firefox */
}
.main_Content::-webkit-scrollbar {
  display: none; /* Safari and Chrome */
}
</style>
