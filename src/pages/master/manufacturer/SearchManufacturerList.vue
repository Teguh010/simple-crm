<script setup lang="ts">
import { onMounted, ref } from "vue";
import MtHeader from '@/components/layouts/MtHeader.vue';
import MtInputForm from '@/components/form/MtInputForm.vue';
import UpdateManufacturerModal from "./UpdateManufacturerModal.vue";
import mtUtils from "@/utils/mtUtils";
import MtLabel from "@/components/MtLabel.vue";
import useManufacturerStore from "@/stores/manufacturers";
import { storeToRefs } from "pinia";
import MtTable2 from "@/components/MtTable2.vue";
import { setPageTitle } from "@/utils/pageTitleHelper";

const manufacturerStore = useManufacturerStore();
const { getManufacturers } = storeToRefs(manufacturerStore);

const nameManufacturer = ref("");

const columns = [
  {
    name: "code_manufacturer",
    label: "製造販売業者CD",
    field: "code_manufacturer",
    align: "left",
    style: "width: 12%",
    headerStyle: "width: 12%",
  },
  {
    name: "name_manufacturer",
    label: "製造販売業者名",
    field: "name_manufacturer",
    align: "left",
    style: "width: 15%",
    headerStyle: "width: 15%",
  },
  {
    name: "name_kana_manufacturer",
    label: "製造販売業者名カナ",
    field: "name_kana_manufacturer",
    align: "left",
    style: "width: 68%",
    headerStyle: "width: 68%",
  },
  {
    name: "flg_halt",
    label: "入荷停止",
    field: "flg_halt",
    align: "center",
    style: "width: 5%",
    headerStyle: "width: 5%",
  },
];

const openAddModal = async () => {
  manufacturerStore.selectManufacturer(null);
  await mtUtils.mediumPopup(UpdateManufacturerModal);
};
const onRowClick = async (data) => {
  manufacturerStore.selectManufacturer(data.id_manufacturer);
  await mtUtils.mediumPopup(UpdateManufacturerModal, { data });
};

const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem("id_clinic"));
  let filter = { name_manufacturer: nameManufacturer.value, id_clinic: id_clinic };
  if (nameManufacturer.value == "") {
    delete filter.name_manufacturer;
  }
  manufacturerStore.fetchManufacturers(filter);
};
onMounted(() => {
  search()
  // manufacturerStore.fetchManufacturers();
  setPageTitle('製造販売業者 一覧')
});
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          製造販売業者 一覧
        </q-toolbar-title>
        <MtInputForm
          type="text"
          label="メーカー"
          outlined
          v-model="nameManufacturer"
          class="q-mr-sm search-field"
        />
        <q-btn          
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mx-md"
          @click="search()"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          v-permission
          @click="openAddModal()"         
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />製造販売業者
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getManufacturers"
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
          <div v-if="col.field == 'flg_halt'" class="body1 regular text-grey-700">
            <q-icon size="8px" v-if="row.flg_halt" name="circle" />
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
