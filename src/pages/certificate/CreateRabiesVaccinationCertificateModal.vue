<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateToday } from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { typePetGender, typePetPhysic } from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })
const data = ref({
  name_family: '',
  address: '',
  phone1: '',
  name_pet: '',
  datetime_birth: getDateToday(),
  name_breed: '',
  pet_physique: 1,
  name_hair_color: '',
  type_gender: 1,
  datetime_service: getDateToday(),
  memo_other_features: '',
  number_request: '',
  number_issued_copies: 10
})

const closeModal = () => {
  emits('close')
}
const submit = () => {}
onMounted(() => {
  if (props?.data) {
    data.value.name_family = props.data?.name_family
      ? props.data?.name_family + props.data?.name_first
      : ''
    data.value.address = props.data?.zip_code
      ? (props.data?.zip_code || '') +
        (props.data?.address_prefecture || '') +
        (props.data?.address_city || '') +
        (props.data?.address_other || '')
      : ''
    data.value.phone1 = props.data?.phone1
    data.value.name_pet = props.data?.name_pet
    data.value.datetime_birth = props.data?.datetime_birth
    data.value.name_breed = props.data?.name_breed
    data.value.name_hair_color = data.value.name_hair_color
    data.value.type_gender = props.data?.type_gender
    data.value.pet_physique = props.data?.pet_physique
    data.value.memo_other_features = props.data?.memo_other_features
    data.value.datetime_service = props.data?.datetime_service
    data.value.number_request = props.data?.value?.code_customer
    data.value.number_issued_copies = props.data?.number_issued_copies
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
        狂犬病注射済証
      </q-toolbar-title>
      <div class="body1 text-grey-900 q-ml-md">
        <span
          >リクエスト番号:
          <span class="text-blue">{{ data?.number_request }}</span></span
        >
      </div>
    </MtModalHeader>
    <q-card-section class="q-px-xl q-pt-sm q-pb-md bg-white main_Content">
      <div class="fit">
        <div class="row items-end justify-start q-mt-md">
          <div class="col-9 row items-end">
            <span class="body1 q-my-auto">第</span>
            <div
              class="col-2 q-ml-md q-pa-md"
              style="height: 40px; border: 1px solid"
            >
              <MtInputForm
                type="text"
                v-model="data.number_issued_copies"
                :borderless="true"
                input-style="text-align: center; font-size: 19px; height:20px; margin-top:-7px; "
              />
            </div>
            <span class="body1 q-my-auto q-ml-md">号</span>
            <MtInputForm
              type="text"
              label="飼主名"
              v-model="data.name_family"
              class="col-3 q-ml-md"
            />
          </div>
        </div>
        <div class="row align-start justify-start q-mt-md">
          <MtFilterSelect
            label="オーナー住所"
            v-model:selecting="data.address"
            class="full-width"
          />
        </div>
      </div>
      <div class="row items-center justify-start q-mt-md">
        <MtInputForm
          type="text"
          label="電話"
          class="col-3"
          v-model="data.phone1"
        />
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
        <MtInputForm
          type="text"
          label="毛色"
          class="col-5 q-ml-md"
          v-model="data.name_hair_color"
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
      <div class="row items-center justify-start q-mt-md">
        <span class="text-grey-700">体格 :</span>
        <div class="row items-center q-ml-md">
          <MtInputForm
            type="radio"
            :items="typePetPhysic"
            v-model="data.pet_physique"
          />
        </div>
      </div>
      <div class="row items-center justify-start q-mt-md">
        <MtInputForm
          type="text"
          label="その他の特徴"
          class="fit"
          v-model="data.memo_other_features"
        />
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
