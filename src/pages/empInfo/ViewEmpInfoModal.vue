<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'

// Directly Imported Components (from the `components` folder)
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'

// Lazy-loaded Modals and Other Components
const UpdateEmpInfoModal = defineAsyncComponent(() => import('./UpdateEmpInfoModal.vue'))
const ZoomImageModal = defineAsyncComponent(() => import('../message/ZoomImageModal.vue'))

// Store imports
import useEmpInfoStore from '@/stores/empInfo'
import useEmployeeStore from '@/stores/employees'

// Utilities
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import { aahUtilsGetEmployeeName, convertLinkInMemo, dateFormat } from '@/utils/aahUtils'

// Types and Enums
import { empInfoType, EmployeeType } from '@/types/types'
import { typeEmpInfo, typeDisplay, typeEmpInfoRead } from '@/utils/enum'

// Props and Emits
const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const props = defineProps<{
  data: empInfoType,
  attr: Object
}>()

// Stores
const empInfoStore = useEmpInfoStore()
const employeeStore = useEmployeeStore()
const { getEmpInfo } = storeToRefs(empInfoStore)

// Reactive Data
const empInfoReadList = ref([])

const empInfoData = ref({
  id_emp_info: null,
  title: null,
  type_emp_info: 1,
  type_display: 1,
  type_department: null,
  type_emp_info_read: null,
  id_employee_posted: null,
  datetime_posted: null,
  memo_emp_info: '',
  file_url: null
})

const assignPageData = (data: empInfoType) => {
  for(let key in empInfoData.value) {
    empInfoData.value[key] = data[key]
  }
  if(props.data && props.data.file_path1) {
    empInfoData.value.file_path1_name = getFileName(props.data.file_path1)
  }
  // if(props.data.read_list && props.data.read_list > 0) {
  //   empInfoReadList.value = groupBy(props.data.read_list, 'flg_read')
  // }
}

const getFileName = (filePath: string) => {
  const fileName = filePath.split('/')
  return fileName[fileName.length - 1]
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '編集',
      name: 'edit',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if(selectedOption.name == 'edit') {
      mtUtils.popup(UpdateEmpInfoModal, {data: props.data})
    }
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm('本当に削除しますか？', '確認')
        .then((confirmation) => {
          if (confirmation) {
            empInfoStore.destroyEmpInfo(empInfoData.value.id_emp_info).then(() => {
              empInfoStore.fetchEmpInfos({type_display: 3})
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const getEmployeeName = (empId:number) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, String(empId))
}

const getEmployeeProfileImage = (empId:number) => {
  return employeeStore.getEmployees.find((emp) => emp.id_employee === empId)?.image_path1
}

const setRecordAsReaded = async () => {
  let data = {
    id_emp_info: empInfoData.value.id_emp_info,
    id_employee: empInfoData.value.id_employee_posted,
    flg_read: true
  }
  const res:any = await empInfoStore.updateEmpInfoRead(data)
  if(res) {
    props.attr.isConfirmed = true
    closeModal()
  }
}

const getEmployeeDetail = (employee: EmployeeType) => {
  return {
    name_display: aahUtilsGetEmployeeName(employeeStore.getAllEmployees, employee.id_employee.toString()),
    image_path1: employeeStore.getEmployees.find((i) => i.id_employee == employee.id_employee)?.image_path1
  }  
}

const openImageViewModal = async (file: File) => {
  await mtUtils.imageViewPopup(ZoomImageModal, {
    files: file,
    singleImage: true
  })
}

onMounted(() => {
  if(props.data) {
    assignPageData(props.data)
  }
})

</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
      {{ 
        typeEmpInfo.find((emp) => {
          return emp.value === empInfoData.type_emp_info
        })?.label
      }}      
    </q-toolbar-title>
    <q-btn flat round  @click="openMenu">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
  </MtModalHeader>
  <q-card-section class="q-px-lg content">
      <div class="q-mb-md bg-accent-100 q-pa-md">
        <h3>
          {{ empInfoData.title }}
        </h3>
        <div class="body1 regular q-pt-md" v-html="convertLinkInMemo(empInfoData.memo_emp_info)" />
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-lg-6 col-md-6 col-sm-12 flex items-center">
            <img v-if="getEmployeeProfileImage(empInfoData.id_employee_posted)" :src="getEmployeeProfileImage(empInfoData.id_employee_posted)" class="q-mr-sm emp-info-image" />
            <q-icon v-else name="account_circle" size="lg" class="text-grey-500" />
            <span>{{ getEmployeeName(empInfoData.id_employee_posted) }}</span>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <span class="caption1 regular text-grey-600 q-mr-sm">連絡日時</span>
            {{ dateFormat(empInfoData.datetime_posted, 'YYYY/MM/DD HH:mm') }}
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col flex justify-center">
           <template v-if="props.data.file_path1">
             <img 
               v-if="props.data.file_path1.endsWith('.png') || props.data.file_path1.endsWith('.jpg')"
               :src="props.data.file_url"
               style="max-width: 500px; cursor: pointer"
               @click="openImageViewModal(props.data.file_url)"
             />
             <template v-else-if="props.data.file_path1.endsWith('.pdf') || props.data.file_path1.endsWith('.pdf')">
               <q-icon
                 name="receipt_long"
                 size="20px"
                 color="red-10"
                 class="q-mr-sm"
               />
               {{empInfoData.file_path1_name}}
             </template>
           </template>

        </div>
      </div>
      <div class="row q-col-gutter-md q-pa-md" v-if="getEmpInfo.emp_info_read.length">
        <!-- <q-separator class="q-my-md" /> -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <span>未読</span>
            <div class="flex items-center">
              <span class="flex items-center" v-for="(item, idx) in getEmpInfo.emp_info_read.filter((data) => { return !data.flg_read })" :key="idx"> 
                <img class="q-mr-sm emp-info-image" v-if="getEmployeeDetail(item).image_path1" :src="getEmployeeDetail(item).image_path1" />
                <q-icon v-else name="account_circle" size="lg" class="text-grey-500" />
                <span>{{getEmployeeDetail(item).name_display}}</span>
                <span v-if="idx !== getEmpInfo.emp_info_read.length - 1" class="q-mr-sm">,</span>
              </span>
            </div>
          </div>
        </div>
        <!-- <q-separator class="q-my-md" /> -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col">
            <span>確認済</span>
            <div class="flex items-center">
              <span v-for="(item, idx) in getEmpInfo.emp_info_read.filter((data) => { return data.flg_read })" :key="idx"> 
                <img class="q-mr-sm emp-info-image" v-if="getEmployeeDetail(item).image_path1" :src="getEmployeeDetail(item).image_path1" />
                <q-icon v-else name="account_circle" size="lg" class="text-grey-500" />
                <span>{{getEmployeeDetail(item).name_display}}</span>
                <span v-if="idx !== getEmpInfo.emp_info_read.length - 1" class="q-mr-sm">,</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
     <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn color="primary" class="text-white text-grey-800" @click="setRecordAsReaded()">
          <q-icon name="check_circle_outline" class="q-mr-sm"/>
          <span>確認しました</span>
        </q-btn>
      </div>
    </q-card-section>
</template>