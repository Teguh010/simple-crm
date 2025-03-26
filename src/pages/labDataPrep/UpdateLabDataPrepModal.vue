<script setup lang="ts">
import MtLabel from '@/components/MtLabel.vue';
import MtModalHeader from '@/components/MtModalHeader.vue';
import OptionModal from '@/components/OptionModal.vue';
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue';
import useCustomerStore from '@/stores/customers';
import mtUtils from '@/utils/mtUtils';
import { onMounted, ref } from 'vue';

const customerStore = useCustomerStore()
const petSelected = ref()
const petList = ref()

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == '') {

    }
  }
}

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
        検査結果
      </q-toolbar-title>
      <q-space />
      <p>
        XXXX【number_service_detail】
      </p>
      <MtLabel>対象ペット</MtLabel>
      <MtPetFilterSelect
        v-model:selecting="petSelected"
        :pet-list="petList"
        label="対象ペット *"
      />
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">

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