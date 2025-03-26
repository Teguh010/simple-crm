<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtTable2 from '@/components/MtTable2.vue'

import UpdateProjectModal from '@/pages/master/project/UpdateProjectModal.vue'

import useProjectStore, { SearchFilterType } from '@/stores/project'
import useEmployeeStore from '@/stores/employees'

import {
  aahUtilsGetEmployeeName  
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'

const projectStore = useProjectStore()
const employeeStore = useEmployeeStore()

const searchFilter = reactive<SearchFilterType>({
   name_project: '',
   flg_complete_required: false  
})
const searchFilterDefault = {...searchFilter}

const searchProjectList = ref([]), searchProjectListDefault = reactive([])

const projectColumns = [
  {
    name: 'name_project',
    label: 'PJ名',
    field: 'name_project',
    align: 'left'
  },
  {
    name: 'id_employee_mentee',
    label: '対象者',
    field: 'id_employee_mentee',
    align: 'left'
  },
  {
    name: 'completion_percentage',
    label: '進捗率',
    field: 'completion_percentage',
    align: 'left'
  },
  {
    name: 'approval_waiting',
    label: '承認待ち',
    field: 'approval_waiting',
    align: 'left'
  },
  {
    name: 'awaiting_final_approval',
    label: '最終承認待ち',
    field: 'awaiting_final_approval',
    align: 'left'
  },
  {
    name: 'id_employee_mentor',
    label: '管理者',
    field: 'id_employee_mentor',
    align: 'left'
  },
  {
    name: 'date_start',
    label: '開始日',
    field: 'date_start',
    align: 'left'
  },
  {
    name: 'date_end',
    label: '終了日',
    field: 'date_end',
    align: 'left'
  },
], projectRows = ref([])

const search = () => {
  //projectStore.fetchProjects()  
}

const clearFilter = () => {
  Object.assign(searchFilter, searchFilterDefault)
  search()
}

const getEmployeeName = (idEmployee: number) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, idEmployee)
}

const onRowClick = async (row) => {
  await mtUtils.popup(UpdateProjectModal)
}

onMounted(() => {
  search()
  onRowClick()
})
</script>
<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 mobile-margin">
          学習プロジェクト
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center gap-4">
              <MtFilterSelect
                label="PJ名"
                :options="searchProjectList"
                :options-default="searchProjectListDefault"
                v-model:selecting="searchFilter.name_project"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
              </MtFilterSelect>
              <MtFormCheckBox
                label="完了含む"
                v-model:checked="searchFilter.flg_complete_required"
              />
              <q-btn
                label="クリア"
                outline
                @click="clearFilter"
               />
              <q-btn
                color="primary"
                @click="search"
               >
                 <q-icon name="search" />
                 <span>検索</span>
               </q-btn>
            </div>
          </div>
        </div>  
      </q-toolbar>
    </MtHeader>
    <div>
      <MtTable2
        :columns="projectColumns"
        :rows="projectRows"
        :rowsBg="true"
        :style="{ boxShadow: 'none' }"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            @click="onRowClick(row)"
          >
            <div v-if="col.field === 'name_project'">
            
            </div>
            <div v-else-if="col.field === 'id_employee_mentee'">
              {{ getEmployeeName(row.id_employee_mentee) }}
            </div>
            <div v-else-if="col.field === 'completion_percentage'">
            
            </div>
            <div v-else-if="col.field === 'approval_waiting'">
            
            </div>
            <div v-else-if="col.field === 'awaiting_final_approval'">
            
            </div>
            <div v-else-if="col.field === 'id_employee_mentor'">
              {{ getEmployeeName(row.id_employee_mentor) }}
            </div>
            <div v-else-if="col.field === 'date_start'">
            
            </div>
            <div v-else-if="col.field === 'date_end'">
            
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </q-page>
</template>