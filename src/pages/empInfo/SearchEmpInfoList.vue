<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import UpdateEmpInfoModal from './UpdateEmpInfoModal.vue'
import mtUtils from '@/utils/mtUtils'
import { typeDisplay, typeEmpInfo } from '@/utils/enum';
import { getDateToday, getDaysAfter, dateFormat, aahUtilsGetEmployeeName } from '@/utils/aahUtils'
import useEmpInfoStore from '@/stores/empInfo'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import { empInfoType } from '@/types/types'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { menuHelperContents } from '@/utils/menuHelperContents'

const empInfoStore = useEmpInfoStore()
const employeeStore = useEmployeeStore()
const { getEmpInfos } = storeToRefs(empInfoStore)

const columns = [
  {
    name: 'type_emp_info',
    label: '通知種別',
    field: 'type_emp_info',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'type_display',
    label: '公開区分',
    field: 'type_display',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'title',
    label: '見出し',
    field: 'title',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  {
    name: 'datetime_posted',
    label: '連絡日',
    field: 'datetime_posted',
    align: 'left',
    style: 'width: 5%',
    headerStyle: 'width: 5%'
  },
  {
    name: 'id_employee_posted',
    label: '投稿者',
    field: 'id_employee_posted',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  }
]
const searchData = ref({
  date_from: getDateToday(),
  date_to: getDaysAfter(8),
  type_emp_info: null,
  type_display: 3,
  id_clinic: null
})
const openEmpInfoModal = async () => {
  await mtUtils.popup(UpdateEmpInfoModal, {searchData: search})
}
const onRowClick = async (data: empInfoType) => {
  await empInfoStore.selectEmpInfo(data.id_emp_info)
  await mtUtils.popup(UpdateEmpInfoModal, {data, searchData: search})
}
const search = async () => {
  empInfoStore.fetchEmpInfos(searchData.value)
}
const getTypeDisplay = (type_display: number) => typeDisplay.find((item: any) => item.value === type_display)?.label
const getTypeEmpInfo = (type_emp_info: number) => typeEmpInfo.find((item: any) => item.value === type_emp_info)?.label
const getEmployeeLabel = (id_employee: string) => aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.empInfoList.title,
    content: menuHelperContents.empInfoList.content,
  })
}
onMounted(async () => {
  search()
})

</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          院内連絡
        </q-toolbar-title>
        <q-space></q-space>
        <form class="row items-center no-wrap">
          <div class="col-3">
            <MtFormInputDate
              v-model:date="searchData.date_from"
              outlined
              class="q-mx-sm"
              type="date"
              autofocus
              label="連絡日：Start"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-model:date="searchData.date_to"
              outlined
              type="date"
              label="連絡日：End"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              type="selection"
              v-model:selected="searchData.type_emp_info"
              label="通知種別"
              :options="typeEmpInfo"
              class="q-mx-sm"
            />
          </div>
          <div class="col-3">
            <MtFormPullDown
              type="selection"
              v-model:selected="searchData.type_display"
              label="公開種別"
              :options="typeDisplay"
            />
          </div>
        </form>
        <q-btn dense flat round @click="openHelpMenu">
          <q-icon size="24px" name="help_outline" />
        </q-btn>
        <q-btn
          @click="search"
          unelevated
          color="grey-100"
          text-color="primary"
          outline
          class="q-mx-sm"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          color="grey-800"
          text-color="white"
          unelevated
          @click="openEmpInfoModal"
        >
          <q-icon size="20px" name="add" />
          院内連絡
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
        :columns="columns"
        :rows="getEmpInfos"
        :rowsBg="true"
        flat
        class="q-mt-sm"
      >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          class="cursor-pointer"
        >
          <div @click="onRowClick(row)">
            <div v-if="col.field === 'type_display'" class="body1 regular text-grey-900">
              {{ getTypeDisplay(row?.type_display) }}
            </div>
            <div v-else-if="col.field === 'type_emp_info'" class="body1 regular text-grey-900">
              {{ getTypeEmpInfo(row?.type_emp_info) }}
            </div>
            <div v-else-if="col.field === 'datetime_posted'" class="body1 regular text-grey-900">
              {{ dateFormat(row?.datetime_posted) }}
            </div>
            <div v-else-if="col.field === 'id_employee_posted'" class="body1 regular text-grey-900">
              {{ getEmployeeLabel(row?.id_employee_posted) }}
            </div>
            <div class="body1 regular text-grey-900" v-else>
              {{ row[col.field] }}
            </div>
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>