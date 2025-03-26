<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateServiceGroupModal from './UpdateServiceGroupModal.vue'
import mtUtils from '@/utils/mtUtils'
import useServiceGroupStore from '@/stores/service-groups'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useDoseStore from '@/stores/dose-frequencies'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import useCommonStore from '@/stores/common'
import { typeGroupItem } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

const commonStore = useCommonStore()
const nameServiceGroup = ref('')
const selectedTypeGroupItem = ref<number | null>(null)
const serviceGroupStore = useServiceGroupStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const doseStore = useDoseStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const { getServiceGroups } = storeToRefs(serviceGroupStore)

const columns = [
  {
    name: 'code_service_group',
    label: 'サービスグループCD',
    field: 'code_service_group',
    align: 'left',
    style: 'width: 10%',
  },
  {
    name: 'name_service_group',
    label: 'サービスグループ名',
    field: 'name_service_group',
    align: 'left',
    style: 'width: 20%',
  },
  {
    name: 'type_group_item',
    label: 'グループ項目設定区分',
    field: 'type_group_item',
    align: 'left',
  },
  {
    name: 'type_animal',
    label: '適用動物種別',
    field: 'type_animal',
    align: 'left',
  },
]

const typeAnimalName = (value: any) => getCommonTypeAnimalOptionList.value.find((v) => v.value === value)?.label
const typeGroupItemName = (value: any) => typeGroupItem.find((v) => v.value === value)?.label

const openAddModal = async () => {
  serviceGroupStore.selectServiceGroup(null)
  await mtUtils.mediumPopup(UpdateServiceGroupModal)
}
const onRowClick = async (data: any) => {
  serviceGroupStore.selectServiceGroup(data.id_service_group)
  await mtUtils.mediumPopup(UpdateServiceGroupModal, { data })
}
const clearFilter = async () => {
  serviceGroupStore.fetchServiceGroups({
    name_service_group: nameServiceGroup.value,
  })
}
const search = async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  await serviceGroupStore.fetchServiceGroups({
    name_service_group: nameServiceGroup.value,
    id_clinic: id_clinic,
    type_group_item: selectedTypeGroupItem.value
  })
}
onMounted(async () => {
  await search()
  await doseStore.fetchDoses()
  await itemServiceUnitStore.fetchItemServiceUnits()

  setPageTitle('サービスグループ一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          サービスグループ一覧
        </q-toolbar-title>
        <MtFormPullDown
          v-model:selected="selectedTypeGroupItem"
          :options="typeGroupItem"
          label="グループ区分"
          class="q-mr-sm search-field"
        />
        <MtInputForm
          type="text"
          outlined
          label="サービスグループ名"
          v-model="nameServiceGroup"
          class="q-mr-sm search-field"
          autofocus
          tabindex="1"
        />
        <q-btn
          @click="search()"          
          unelevated
          color="accent-800"
          text-color="white"
          class="q-ml-xs"
          tabindex="2"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="openAddModal()"         
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="20px" name="add" />サービスグループ</q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getServiceGroups"
      :rowsBg="true"
      class="custody-table q-pt-sm"
      :style="{ height: 'calc(100vh - 90px)', boxShadow: 'none' }"
      flat
      no-data-message="登録がありません。"
      no-result-message="該当のデータが見つかりませんでした"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          @click="onRowClick(row)"
          class="cursor-pointer"
        >
          <div v-if="col.field == 'type_group_item'" class="body1 regular text-grey-700">
              {{ typeGroupItemName(row.type_group_item) }}
          </div>
          <div v-else-if="col.field == 'type_animal'" class="body1 regular text-grey-700">
              {{ typeAnimalName(row.id_cm_animal) }}
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>

      </template>
    </MtTable2>
  </q-page>
</template>
