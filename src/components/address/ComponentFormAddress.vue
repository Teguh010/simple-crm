<script setup lang="ts">
import aahValidations from '@/utils/aahValidations';
import InputZipcode from '../form/InputZipcode.vue';
import MtInputForm from '../form/MtInputForm.vue';

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const changeZipCode = (value: any) => {
  // Convert zip code to string/numbers
  if (typeof value === 'object') {
    props.formData.address_prefecture = value.address_prefecture
    props.formData.address_city = value.address_city
    props.formData.address_other = value.address_other
    props.formData.zip_code = value.zip_code
  }
}
</script>
<template>
  <div class="row q-col-gutter-md q-mt-sm">
    <div class="col">
      <InputZipcode
        v-model:selecting="props.formData.zip_code"
        @changeZipCode="changeZipCode"
        label="郵便番号 *"
        required
        :rules="[aahValidations.validationRequired]"
      />
    </div>
    <div class="col">
      <MtInputForm
        type="text"
        v-model="props.formData.address_prefecture"
        label="都道府県 *"
        required
        :rules="[aahValidations.validationRequired]"
      />
    </div>
    <div class="col">
      <MtInputForm
        type="text"
        v-model="props.formData.address_city"
        label="市区町村 *"
        required
        :rules="[aahValidations.validationRequired]"
      />
    </div>
    <div class="col-6">
      <MtInputForm
        type="text"
        v-model="props.formData.address_other"
        label="住所 *"
        required
        :rules="[aahValidations.validationRequired]"
      >
        <template v-slot:append>
          <q-icon name="place" class="cursor-pointer" @click="openGoogleMapSearch" />
        </template>
      </MtInputForm>
    </div>
  </div>
  <div class="row q-col-gutter-md q-mt-sm">
    <div class="col-3">
      <MtInputForm
        type="text"
        v-model="props.formData.name_address"
        label="宛名"
      />
    </div>
    <div class="col">
      <MtInputForm
        type="text"
        v-model="props.formData.memo_address"
        label="住所メモ"
        autogrow
      />
    </div>
  </div>
</template>
