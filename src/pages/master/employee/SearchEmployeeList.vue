<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateEmployeeModal from './UpdateEmployeeModal.vue'
import MtTable2 from '@/components/MtTable2.vue'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { formatDate, formatHoursMinutes } from '@/utils/aahUtils'
import useClinicStore from '@/stores/clinics'
import { typeEmployee, typeOccupation } from '@/utils/enum'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useCommonStore from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { menuHelperContents } from '@/utils/menuHelperContents'

const commonStore = useCommonStore()
const employeeStore = useEmployeeStore()
const clinicStore = useClinicStore()
const cliCommonStore = useCliCommonStore()
const { getEmployees } = storeToRefs(employeeStore)
const name = ref('')

const columns = [
  {
    name: 'image_path1',
    label: '',
    field: 'image_path1',
    style: 'width: 20px'
  },
  {
    name: 'name',
    label: '従業員名',
    field: 'name',
    style: 'width: 150px'
  },
  {
    name: 'name_display',
    label: '表示名',
    field: 'name_display',
    align: 'left',
    style: 'width: 150px'
  },
  {
    name: 'affiliated_organization',
    label: '所属施設',
    field: 'affiliated_organization',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'type_employee',
    label: '従業員区分',
    field: 'type_employee',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'type_department',
    label: '病院部門',
    field: 'type_department',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'type_occupation',
    label: '職種区分',
    field: 'type_occupation',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'datetime_login_pw_updated',
    label: 'PW更新日時',
    field: 'datetime_login_pw_updated',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'flg_login_disabled',
    label: 'ログイン禁止',
    field: 'flg_login_disabled',
    align: 'left',
    style: 'width: 100px'
  }
]
const typeEmployeeName = (value) =>
  typeEmployee.find((v) => v.value === value)
const typeDepartmentName = (value) =>
  cliCommonStore.getCliCommonTypeDepartmentList.find((v) => v.code_func1 == value)
const typeOccupationName = (value) =>
  typeOccupation.find((v) => v.value === value)

const getOrganizationNames = (clinicId: any) => {
  return `${clinicStore.getAllClinics.find((clinic) => clinic?.value === clinicId)?.label}`
}

const onRowClick = async (data) => {
  await mtUtils.popup(UpdateEmployeeModal, { data, searchData: search })
}
const addButton = async () => {
  await mtUtils.popup(UpdateEmployeeModal)
}
const search = (page = 1) => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  employeeStore.fetchEmployees({
    name: name.value,
    id_clinic: id_clinic
  })
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.employeeList.title,
    content: menuHelperContents.employeeList.content,
  })
}

onMounted(async () => {
  const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  employeeStore.fetchEmployees({ id_clinic: id_clinic })

  setPageTitle('従業員一覧')
})
</script>

<template>
  <div>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          従業員一覧
        </q-toolbar-title>
        <MtInputForm v-model="name" autofocus class="search-field" label="従業員名" outlined type="text" @keydown.enter="search()" />

        <q-btn dense flat round @click="openHelpMenu">
          <q-icon size="24px" name="help_outline" />
        </q-btn>
        <q-btn
          @click="search()"          
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mx-sm"
        >
          <q-icon name="search" size="20px" />
          検索
        </q-btn>
        <q-btn
          @click="addButton"         
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon name="add" size="20px" />
          従業員
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="getEmployees"
      :rowsBg="true"
      :style="{ height: 'calc(100vh - 90px)', boxShadow: 'none' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
          :class="['text-' + (col.align || 'left')]"
        >
          <div v-if="col.field == 'image_path1'">
            <q-avatar>
              <img v-if="row['image_path1']" :src="row['image_path1']" alt="profile picture">
              <q-icon v-else name="account_circle" size="48px" class="text-grey-500" />
            </q-avatar>
          </div>
          <div v-else-if="col.field == 'name'">
            <div class="caption2 regular text-grey-700 q-mb-xs">
              {{ row['name_kana_family'] }}
              {{ row['name_kana_first'] }}
            </div>
            <div class="body1 regular text-grey-900">
              {{ row['name_family'] }} {{ row['name_first'] }}
            </div>
          </div>
          <div v-else-if="col.field == 'name_display'">
            {{ row['name_display'] }}
          </div>
          <div v-else-if="col.field == 'affiliated_organization'">
            <div v-for="(clinic, index) in row['id_clinic_list']" :key="clinic"
                 class="q-chip row inline items-center q-chip--dense">
              <div class="q-chip__content row no-wrap items-center">
                  <span class="ellipsis">
                    {{ getOrganizationNames(clinic) }}  
                  </span>
              </div>
            </div>
          </div>
          <div v-else-if="col.field == 'type_employee'">
            <div class="body1 regular text-grey-900">
              {{ typeEmployeeName(row['type_employee'])?.label }}
            </div>
          </div>
          <div v-else-if="col.field == 'type_department'">
            <div class="body1 regular text-grey-900">
              {{ typeDepartmentName(row['type_department'])?.name_cli_common }}
            </div>
          </div>
          <div v-else-if="col.field == 'type_occupation'">
            <div class="body1 regular text-grey-900">
              {{ typeOccupationName(row['type_occupation'])?.label }}
            </div>
          </div>
          <div v-else-if="col.field == 'datetime_login_pw_updated'">
            <div class="body1 regular text-grey-900">
              {{
                row['datetime_login_pw_updated'] ? 
                formatDate(row['datetime_login_pw_updated']) +
                ' ' +
                  formatHoursMinutes(row['datetime_login_pw_updated']) : null
              }}
            </div>
          </div>
          <div v-else-if="col.field == 'flg_login_disabled'">
            <div class="body1 regular text-grey-900 ellipsis-2-lines">
              <span v-if="row['flg_login_disabled']" class="text-darkred">
                <q-icon size="16px" name="remove_circle" />
                <span class="q-ml-sm">禁止</span>
              </span>
              <span v-else class="text-grey-500">許可中</span>
            </div>
          </div>
          <div v-else>
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </div>  
</template>

<style scoped>
</style>
