<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { getDateToday } from '@/utils/aahUtils'
import usePetCustodyStore from '@/stores/pet-custodies'
import MtFormCheckBoxMultiple from '@/components/form/MtFormCheckBoxMultiple.vue'
import { typeCageRoom } from '@/utils/enum'

const petCustodyStore = usePetCustodyStore()

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const changeDate = async (prefix) => {
  data.value.date = changeDate(data.value.date, prefix)
  init()
}

const data = ref({
  date: getDateToday(),
  typeRoomCage: []
})
const init = async () => {
  await petCustodyStore.fetchPetCustodies({ date: data.value.date })
}
onMounted(async () => {
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div class="row q-gutter-md q-mb-md">
      <div class="col-12">
        <div class="flex items-between">
          <q-btn
            @click="changeDate('prev')"
            padding="2px"
            flat
            unelevated
            icon="chevron_left"
            style="border: 1px solid #9e9e9e"
          />
          <MtInputForm
            readonly
            outlined
            type="text"
            v-model="data.date"
            class="search-field q-mx-xs"
          />
          <q-btn
            @click="changeDate('next')"
            padding="2px"
            flat
            unelevated
            icon="chevron_right"
            style="border: 1px solid #9e9e9e"
          />
        </div>
      </div>
    </div>
    <div class="row q-gutter-md q-mb-md">
      <div class="col-12">
        <MtFormCheckBoxMultiple
          :items="typeCageRoom"
          class="q-mr-md"
          v-model:checked="data.typeRoomCage"
        />
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn color="primary" class="q-ml-md">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
