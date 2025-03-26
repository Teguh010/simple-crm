<script setup lang="ts">
import MtLabel from '@/components/MtLabel.vue';
import MtModalHeader from '@/components/MtModalHeader.vue';
import OptionModal from '@/components/OptionModal.vue';
import MtFormInputDate from '@/components/form/MtFormInputDate.vue';
import MtFormInputText from '@/components/form/MtFormInputText.vue';
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue';
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue';
import useCustomerStore from '@/stores/customers';
import mtUtils from '@/utils/mtUtils';
import { onMounted, ref } from 'vue';

const customerStore = useCustomerStore()
const petSelected = ref()
const petList = ref()
const search = ref({
  date_start: null,
  date_end: null,
  name: null,
})

const searchData = () => {}
const closeModal = () => {}
const submit = () => {}

onMounted(() => {
  petList.value = customerStore.getCustomer?.pets
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        治療サービス選択
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="justify-between flex items-center full-width q-bb q-pb-md">
        <div class="flex items-center">
          <MtLabel>サービス開始日</MtLabel>
          <MtFormInputDate v-model:date="search.date_start" outlined type="date" class="q-mr-sm" autofocus />
          ~
          <MtFormInputDate v-model:date="search.date_end" outlined type="date" class="q-ml-sm" />
        </div>
        <div class="flex items-center">
          <MtLabel>ペット名</MtLabel>
          <MtFormInputText v-model="search.name" outlined class="q-ml-sm" />
        </div>
        <q-btn @click="searchData" class="q-ml-sm" unelevated color="grey-800" text-color="white"><q-icon size="20px" name="search" />検索</q-btn>
      </div>
      <div class="full-width q-mt-md" v-for="v in 4">
        <div class="flex items-center bg-grey-050">
          <MtFormRadiobtn />
          <div class="q-ml-md">
            2023/09/02
          </div>
          <div class="q-ml-md">
            <small>アンドウ　レオ</small>
            <div>安藤　れお</div>
          </div>
          <div class="q-ml-md text-blue text-underline">
            XXXX【number_service_detail】
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>