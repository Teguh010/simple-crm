<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import MtLabel from '@/components/MtLabel.vue'
import UpdateFoodPrepModal from './UpdateFoodPrepModal.vue'
import useFoodPrepStore from '@/stores/food-prep'
import { typeFoodPrep } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'

const columns = [
  {
    name: 'code_food_prep',
    label: 'フード準備CD',
    field: 'code_food_prep',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'name_food_prep',
    label: 'フード準備名',
    field: 'name_food_prep',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_food_prep',
    label: '区分',
    field: 'type_food_prep',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'memo_food_prep',
    label: '準備方法・フード',
    field: 'memo_food_prep',
    align: 'left',
    style: 'width: auto'
  },
   {
    name: 'images',
    label: '',
    field: 'images',
    align: 'left',
    style: 'width: auto'
  }
]

const foodPrepStore = useFoodPrepStore()
const searchFoodPrep = ref('')

const init = async () => {
  // await foodPrepStore.fetchFoodPreps()
  await search()
}
const openAddModal = async () => {
  await mtUtils.mediumPopup(UpdateFoodPrepModal)
  await init()
}
const onRowClick = async (data: any) => {
  await mtUtils.mediumPopup(UpdateFoodPrepModal, { data })
  await init()
}
const search = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic')!)
  await foodPrepStore.fetchFoodPreps({
    name_food_prep: searchFoodPrep.value,
    id_clinic: id_clinic
  })
}
const handleNameFoodPrep = (value: any) => {
  return typeFoodPrep.find(
    (id: any) => id?.value == value
  )?.label
}
onMounted(async () => {
  await init()

  setPageTitle('フード準備一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          フード準備一覧
        </q-toolbar-title>
        <MtInputForm
          type="text"
          outlined
          v-model="searchFoodPrep"
          class="q-mr-sm selection-field"
          label="フード準備名"
          autofocus
          tabindex="1"
        />
        <q-btn
          @click="search()"          
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mx-md"
          tabindex="2"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="openAddModal()"         
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />フード準備
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="foodPrepStore.getFoodPreps"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100vh - 70px)' }"
      no-data-message="登録がありません。"
      no-result-message="該当のデータが見つかりませんでした"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
          class="cursor-pointer"
        >
          <template v-if="col.field == 'code_food_prep'">
            <div class="body1 regular text-grey-900 cursor-pointer">
              {{ row.code_food_prep }}
            </div>
          </template>
          <template v-else-if="col.field == 'name_food_prep'">
            <div class="body1 regular text-grey-900">
              {{ row.name_food_prep }}
            </div>
          </template>
          <template v-else-if="col.field == 'type_food_prep'">
            <div class="body1 regular text-grey-900">
              {{ handleNameFoodPrep(row.type_food_prep) }}
            </div>
          </template>
          <template v-else-if="col.field == 'memo_food_prep'">
            <div class="body1 regular text-grey-900">
              {{ row.memo_food_prep }}
            </div>
          </template>
          <template v-else-if="col.field == 'images'">
            <q-img :src="row.file_path1" height="80px" width="80px" v-if="row.file_path1" class="q-mx-md" />
            <q-img :src="row.file_path2" height="80px" width="80px" v-if="row.file_path2" class="q-mx-md" />
            <q-img :src="row.file_path3" height="80px" width="80px" v-if="row.file_path3" class="q-mx-md" />
          </template>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>