<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateItemServiceUnitModal from './UpdateItemServiceUnitModal.vue'
import mtUtils from '@/utils/mtUtils'
import MtLabel from '@/components/MtLabel.vue'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useItemStore from '@/stores/items'
import { storeToRefs } from 'pinia'
import aahGlobal from '@/utils/aahGlobal'
import MtTable2 from '@/components/MtTable2.vue'
import { useRouter } from 'vue-router'
import ViewItemServiceDetailModal from './ViewItemServiceDetailModal.vue'
import { typeTax } from '@/utils/enum'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'

const router = useRouter()
const itemUnitStore = useItemServiceUnitStore()
const itemStore = useItemStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const { getItems } = storeToRefs(itemStore)
const { getItemServiceUnits, getExportServiceUnitItems } = storeToRefs(itemUnitStore)

const openAddModal = async () => {
  await mtUtils.mediumPopup(UpdateItemServiceUnitModal, {})
}

const commonUnitName = (value) => {
  return commonStore.getCommonUnitOptionList.find(item => item.id_common == value)?.name_common
}
const productName = ref('')
const start_page = ref(0)

const columns = [
  {
    name: '',
    label: '',
    field: '',
    align: ''
  },
  {
    name: 'name_service_item_unit',
    label: '商品名・包装単位',
    field: 'name_service_item_unit',
    align: 'left'
  },
  {
    name: 'id_cm_unit',
    label: '単位',
    field: 'id_cm_unit',
    align: 'left',
  },
  {
    name: 'type_tax',
    label: '税区分',
    field: 'type_tax',
    align: 'left'
  },
  {
    name: 'unit_price',
    label: '販売単価',
    field: 'unit_price',
    align: 'left'
  }
]
const onRowClick = async (data) => {
  router.replace({ query: { id: data.id_item_service }})
  await mtUtils.popup(ViewItemServiceDetailModal, { data, id: data?.id_item_service, sectionTo: data.id_item_service_unit })
  router.replace({ name: 'SearchItemServiceUnitList' })
}
const search = (page = 1) => {
  start_page.value = Math.ceil(page * aahGlobal.length_pages)
  itemUnitStore.fetchItemServiceUnits({
    name_service_item_unit: productName.value,
    start: start_page.value - 1,
    length: aahGlobal.length_pages
  })
}

const ServiceName = (value) =>
  getItems.value.find((v) => v.id_item_service === value)?.name_item_service

const TypeTaxName = (value: number) => typeTax.find((v) => v.value === value)?.label

const unitName = (value) =>
  getUnits.value.find((v) => v.id_unit === value)?.unit_other

const unitNameType = (value) =>
  getUnits.value.find((v) => v.id_unit === value)?.type_unit

onMounted(async () => {
  await Promise.all([
    itemStore.fetchItems({ id_clinic: 'all' }),
    commonStore.fetchPreparationCommonList({ code_common: [4] }),
    itemUnitStore.fetchItemServiceUnits(),
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [18] })
  ])
})

const exportItemCSV = async () => {
  const params = {
    name_service_item_unit: productName.value,
    start: start_page.value - 1,
    length: aahGlobal.length_pages
  };
  await itemUnitStore.exportItems(params)
  const data = getExportServiceUnitItems.value
  const fileName = `商品名/包装単位一覧-csv-${new Date().getMonth() + 1}-${new Date().getDate()}`;

  downloadCSV(data, fileName);
}

function downloadCSV(csvString: string|null, filename: string) {    
  if(csvString !== null){
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // feature detection
        // Create a link to the file
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }
}

const onCSVPicked = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file && file.type === 'text/csv') {
    uploadCSV(file);
  } else {
    alert('有効なcsvファイルを選択してください。');
  }
};

const uploadCSV = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  itemUnitStore.importItems(formData)
};
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          品名・包装単位一覧
        </q-toolbar-title>
        <MtInputForm
          type="text"
          outlined
          label="品名包装単位名"
          v-model="productName"
          class="search-field"
        />
        <div class="button-container">
          <q-btn

            unelevated
            color="accent-800"
            text-color="white"
            class="q-mx-sm"
            @click="search()"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
          <input
            ref="itemCSV"
            accept=".csv"
            style="display: none"
            type="file"
            @change="onCSVPicked($event, 'itemServiceCSV')"
          />
        </div>
        <q-btn
          v-permission
          @click="openAddModal()"         
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />品名・包装単位
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果 :<span class="q-ml-sm">件</span>
      </div>
      <div class="row items-center gap-2 justify-end">
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="exportItemCSV()"
        >
          <q-icon name="download" class="q-mr-xs" />
          (調整中) CSV出力
        </q-btn>
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          @click="$refs.itemCSV.click()"
        >
          <q-icon name="upload" class="q-mr-xs" />
          (調整中) CSV取込
        </q-btn>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="getItemServiceUnits"
      :rowsBg="true"
      class="custody-table q-pt-sm"
      :style="{ height: 'calc(100vh - 100px)', boxShadow: 'none' }"
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
          <div v-if="col.field == 'id_cm_unit'" class="body1 regular text-grey-700">
              {{ row.id_cm_unit ? commonUnitName(row.id_cm_unit) : '-' }}
          </div>
          <div v-else-if="col.field == 'name_service_item_unit'" class="body1 regular text-grey-700">
              {{ row.name_service_item_unit ? row.name_service_item_unit : '-' }}
          </div>
          <div v-else-if="col.field == 'type_tax'" class="body1 regular text-grey-700">
              {{ row.type_tax ? TypeTaxName(row.type_tax) : '-' }}
          </div>
          <div v-else-if="col.field == 'unit_price'" class="body1 regular text-grey-700">
              {{ row.unit_price ? parseInt(row.unit_price) : '-' }}
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
<style scoped>
.button-container {
  display: flex;
  align-items: center;
  gap: 10px; /* Adjust this value to control the space between the buttons */
}
.tableBox {
  margin-top: 20px;
}
</style>