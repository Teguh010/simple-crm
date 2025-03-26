<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateCageConditionModal from './UpdateCageConditionModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCageConditionStore from '@/stores/cage-conditions'
import { storeToRefs } from 'pinia'
import aahGlobal from '@/utils/aahGlobal'
import MtLabel from '@/components/MtLabel.vue'
import MtTable2 from '@/components/MtTable2.vue'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { CageCondition } from '@/types/types'

const cageConditionStore = useCageConditionStore()
const { getCageConditions } = storeToRefs(cageConditionStore)

const code_cage_condition = ref('')

const columns = [
  {
    name: 'code_cage_condition',
    label: 'ケージ準備CD',
    field: 'code_cage_condition',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'memo_cage_condition',
    label: '準備方法',
    field: 'memo_cage_condition',
    align: 'left',
    style: 'width: 30%'
  },
  {
    name: 'memo_purpose',
    label: '用途・注意点等',
    field: 'memo_purpose',
    align: 'center',
    style: 'width: 10%'
  },
  {
    name: 'images',
    label: '',
    field: 'images',
    align: 'center',
    style: 'width: 50%'
  }
]

const openAddModal = async () => {
  cageConditionStore.selectCageCondition(null)
  await mtUtils.mediumPopup(UpdateCageConditionModal)
}
const onRowClick = async (data: CageCondition) => {
  await mtUtils.mediumPopup(UpdateCageConditionModal, { data })
}
const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  cageConditionStore.fetchCageConditions({
    code_cage_condition: code_cage_condition.value,
    id_clinic: id_clinic
  })
}
onMounted(() => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  cageConditionStore.fetchCageConditions({
    start: aahGlobal.start_pages,
    length: aahGlobal.length_pages,
    id_clinic: id_clinic
  })

  setPageTitle('ケージ準備一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          ケージ準備一覧
        </q-toolbar-title>
        <MtInputForm
          type="text"
          label="ケージ準備方法"
          outlined
          v-model="code_cage_condition"
          class="search-field"
          autofocus
          tabindex="1"
        />
        <q-btn
          @click="search"          
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
          text-color="white"
          class="bg-grey-800"
        >
          <q-icon size="20px" name="add" />ケージ準備
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="getCageConditions"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100dvh - 90px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div v-if="col.field === 'images'">
            <q-img :src="row.file_path1" height="80px" width="80px" v-if="row.file_path1" class="q-mx-md" />
            <q-img :src="row.file_path2" height="80px" width="80px" v-if="row.file_path2" class="q-mx-md" />
            <q-img :src="row.file_path3" height="80px" width="80px" v-if="row.file_path3" class="q-mx-md" />
          </div>
          <div
            v-else
            class="tableRow body1 regular text-grey-900 ellipsis-2-lines"
          >
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
<style lang="scss" scoped>
.tableRow{
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
