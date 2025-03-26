<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateTaskGroupModal from './UpdateTaskGroupModal.vue'
import mtUtils from '@/utils/mtUtils'
import useTaskGroupStore from '@/stores/task-groups'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import useCategoryStore from '@/stores/categories'

const name_task_group = ref("");
const employeeStore = useEmployeeStore();
const taskGroupStore = useTaskGroupStore();
const categoryStore = useCategoryStore()
const { getTaskGroups } = storeToRefs(taskGroupStore);

const columns = [
  {
    name: "code_task_group",
    label: "タスクグループCD",
    field: "code_task_group",
    align: "left",
    style: "width: 10%",
  },
  {
    name: "name_task_group",
    label: "タスクグループ名",
    field: "name_task_group",
    align: "left",
    style: "width: 20%",
  },
  {
    name: "id_category1",
    label: "大分類",
    field: "id_category1",
    align: "left",
  },
  {
    name: "id_category2",
    label: "中分類",
    field: "id_category2",
    align: "left",
  },
  { name: "title_task", label: "タスク名", field: "title_task", align: "left" },
  {
    name: "place_task",
    label: "対応部署",
    field: "place_task",
    align: "left",
  },
];

const categoryName = (value: number) => categoryStore.getAllCategories.find((v) => v.value === value)
const openAddModal = async () => {
  taskGroupStore.selectTaskGroup(null);
  await mtUtils.mediumPopup(UpdateTaskGroupModal);
};
const onRowClick = async (data: any) => {
  await taskGroupStore.fetchTaskGroupById({ id_task_group: data.id_task_group })
  await mtUtils.mediumPopup(UpdateTaskGroupModal, { data });
};
const search = () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  taskGroupStore.fetchTaskGroups({
    name_task_group: name_task_group.value,
    id_clinic: id_clinic
  });
};

onMounted(() => {
  search()
  // taskGroupStore.fetchTaskGroups();
  employeeStore.fetchEmployees();
});
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          タスクグループ一覧
        </q-toolbar-title>
        <MtInputForm
          type="text"
          outlined
          label="タスクグループ名"
          v-model="name_task_group"
          class="q-mr-sm search-field"
          tabindex="1"
          autofocus
        />
        <q-btn
          @click="search()"
          tabindex="2"
          unelevated
          color="accent-800"
          text-color="white"
          class="q-ml-xs"
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
          <q-icon size="20px" name="add" />タスクグループ
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="getTaskGroups"
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
          <div v-if="col.field == 'id_category1'" class="body1 regular text-grey-900">
            <div v-for="task_group_item in row.task_group_items">
              <span class="">{{ categoryName(task_group_item.id_category1)?.label }}</span>
            </div>
          </div>
          <div v-if="col.field == 'id_category2'" class="body1 regular text-grey-900">
            <div v-for="task_group_item in row.task_group_items">
              <span class="">{{ categoryName(task_group_item.id_category2)?.label }}</span>
            </div>
          </div>
          <div v-if="col.field == 'title_task'" class="body1 regular text-grey-900">
            <div v-for="task_group_item in row.task_group_items">
              <span class="">{{ task_group_item.title_task }}</span>
            </div>
          </div>
          <div v-if="col.field == 'place_task'" class="body1 regular text-grey-900">
            <div v-for="task_group_item in row.task_group_items">
              <span class="">{{ task_group_item.place_task }}</span>
            </div>
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
