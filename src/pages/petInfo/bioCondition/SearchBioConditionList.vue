<script setup lang="ts">
import { ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateBioConditionModal from './UpdateBioConditionModal.vue'
import mtUtils from '@/utils/mtUtils'

const openAddModal = async () => {
  await mtUtils.popup(UpdateBioConditionModal)
}
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-space></q-space>
        <q-btn
          @click="openAddModal()"
         
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="20px" name="add" />製造販売業者
        </q-btn>
      </q-toolbar>
    </MtHeader>
  </q-page>
</template>
