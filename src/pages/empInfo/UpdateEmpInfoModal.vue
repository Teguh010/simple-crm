<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import OptionModal from '@/components/OptionModal.vue'
import UploadFile from '@/components/UploadFile.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import { typeEmpInfo, typeDisplay, typeEmpInfoRead } from '@/utils/enum'
import {
  changeToggleDropdownNames,
  updateBtnLabel,
  getDateTimeNow,
  aahUtilsGetEmployeeName
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { imageResize } from '@/utils/helper'
import useCommonStore from '@/stores/common'
import useEmpInfoStore from '@/stores/empInfo'
import useEmployeeStore from '@/stores/employees'
import { CliCommon, empInfoType } from '@/types/types'
import { groupBy } from 'lodash'
import useCliCommonStore from '@/stores/cli-common'
import { storeToRefs } from 'pinia'
import { useCharacterCount } from '@/utils/useCharCount'

const empInfoStore = useEmpInfoStore()
const employeeStore = useEmployeeStore()
const cliCommonStore = useCliCommonStore()
const { getEmpInfo } = storeToRefs(empInfoStore)

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const props = defineProps<{
  data: empInfoType,
  searchData: Function
}>()

const typeDepartmentList = ref([])
const targetRef = ref(), selectedFile = ref(null), isEdit = ref(false), empInfoReadList = ref([])
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const employeeList = ref([...employeeStore.getAllEmployees])
const fileUploadKey = ref<number>(0)
let observer = null // it will watch DOM changes
// const showEmailIcon = ref(false)

const empInfoData = ref({
  id_emp_info: null,
  title: null,
  type_emp_info: 1,
  type_display: 3,
  type_department: null,
  type_emp_info_read: null,
  id_employee_posted: defaultEmployee,
  datetime_posted: getDateTimeNow(),
  memo_emp_info: ''
})

const variable = ref(), foreColor = ref('#ffff00')
const memoRef = computed({
  get: () => empInfoData.value.memo_emp_info,
  set: (val: string) => { empInfoData.value.memo_emp_info = val }
});

const maxChars = 500;
const memoValidation = useCharacterCount(memoRef, maxChars, '最大500文字をご入力できます')
const isCharCountInvalid = computed(() => !memoValidation.isCharCountValid.value)
const submit = async () => {
  if(empInfoData.value.datetime_posted){
    empInfoData.value.datetime_posted = empInfoData.value.datetime_posted.replace(/\//g, '-')
    if(empInfoData.value.datetime_posted.length <= 10) empInfoData.value.datetime_posted += `${getDateTimeNow().slice(10)}`
  }
  // TODO; will remove later
  if(props.data?.id_emp_info) {
    empInfoData.value.type_department = 1
    empInfoData.value.type_emp_info_read = 1
  }
  delete empInfoData.value.file_url
  let formData = new FormData()
  for(const [key, value] of Object.entries(empInfoData.value)) {
    formData.append(key, value)
  }
  if(selectedFile.value) formData.append('file_path1', selectedFile.value)
  if(props.data && props.data?.id_emp_info) {
    await empInfoStore.updateEmpInfo(props.data.id_emp_info, formData)
    mtUtils.autoCloseAlert(aahMessages.success)
    props.searchData()
    closeModal()
  }
  else {
    await empInfoStore.submitEmpInfo(formData)
    mtUtils.autoCloseAlert(aahMessages.success)
    props.searchData()
    closeModal()
  }
}

const assignPageData = (data: empInfoType) => {
  for(const key in empInfoData.value) {
    empInfoData.value[key] = data[key]
  }
  if(data.file_path1) {
    empInfoData.value.file_url = data.file_url
  }
  if(data.emp_info_read && data.emp_info_read.length > 0) {
    empInfoReadList.value = groupBy(data.emp_info_read, 'flg_read')
  }
}

const colorClicked = () => {
  const edit = targetRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
}

const openMenu = async () => {
  let menuOptions = [
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
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm('本当に削除しますか？', '確認')
        .then((confirmation) => {
          if (confirmation) {
            empInfoStore.destroyEmpInfo(empInfoData.value.id_emp_info).then(() => {
              props.searchData()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const sendEmail = async () => {
  await mtUtils.confirm("", "対象ユーザーにメールを送信しますか?", "送信する").then(async (confirmation) => {
    if(confirmation == true){
      const resp = await empInfoStore.sendEmail(empInfoData.value.id_emp_info)
      if(resp.message == "EMAIL_SENT_SUCCESSFULLY"){
        mtUtils.autoCloseAlert('メールを送信しました！')
      }else if(resp.message == "EMPLOYEES_EMAILS_NOT_FOUND"){
        mtUtils.autoCloseAlert('送信先メールアドレスが見つかりません')
      }
    }    
  })
}

const getEmployeeDetail = (employee) => {
  return {
    name_display: aahUtilsGetEmployeeName(employeeStore.getAllEmployees, employee.id_employee.toString()),
    image_path1: employeeStore.getEmployees.find((i) => i.id_employee == employee.id_employee)?.image_path1
  }  
}

const showEmailIcon = computed(() => {
  return empInfoData.value.type_display == 3
})

const handleEmpInfoRead = (value: number) => {
  if(value !== 3) {
    empInfoData.value.type_department = null
  }
  if(value !== 4) {
    empInfoData.value.id_employee = null
  }
}

onMounted(async () => {
  if(cliCommonStore.getCliCommonTypeDepartmentList && cliCommonStore.getCliCommonTypeDepartmentList.length && cliCommonStore.getCliCommonTypeDepartmentList.length > 0) {
    typeDepartmentList.value = cliCommonStore.getCliCommonTypeDepartmentList.map((item: CliCommon) => {
      return {
        label: item.name_cli_common,
        value: item.code_func1
      }  
    })
  }

  console.log('props.data.id_emp_info :>> ', props.data.id_emp_info);
  if (props.data && props.data?.id_emp_info) {
    isEdit.value = true
    assignPageData(props.data)
    ++fileUploadKey.value
  }
  console.log('getEmpInfo :>> ', getEmpInfo);
  // mutation oberserver for updating q-editor toolbar labels
  const observerCallback = (mutationList, observer) => {
    for (let mutation of mutationList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.matches('[role="menu"]') ||
              node.matches('.q-editor__toolbar-group'))
          ) {
            changeToggleDropdownNames()
          }
        })
      }
    }
  }
  observer = new MutationObserver(observerCallback)
  observer.observe(document.body, { childList: true, subtree: true })
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        院内連絡
      </q-toolbar-title>
      <q-btn flat round v-if="showEmailIcon && isEdit" @click="sendEmail">
        <q-icon size="sm" name="email" />
      </q-btn>
      <q-btn flat round v-if="props.data && props.data?.id_emp_info" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="empInfoData.title"
            label="タイトル *"
            required
            :rules="[aahValidations.validationRequired]"
            autofocus
            tabindex="1"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-3">
          <MtFormPullDown
            type="selection"
            v-model:selected="empInfoData.type_emp_info"
            :options="typeEmpInfo"
            label="通知区分:顧客"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            type="selection"
            v-model:selected="empInfoData.type_display"
            :options="typeDisplay"
            label="公開区分"
          />
        </div>
        <template v-if="!(isEdit)">
        <div class="col-3">
          <MtFormPullDown
            type="selection"
            v-model:selected="empInfoData.type_emp_info_read"
            :options="typeEmpInfoRead"
            label="全体通知"
            required
            :rules="[aahValidations.validationSelection]"
            @update:selected="handleEmpInfoRead"
          />
        </div>
        <div class="col-3" v-if="empInfoData.type_emp_info_read === 3">
          <MtFormMultipleSelection
            v-model="empInfoData.type_department"
            :options="typeDepartmentList"
            label="通知区分:顧客"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
        <div class="col-3" v-if="empInfoData.type_emp_info_read === 4">
          <MtFormMultipleSelection
            v-model="empInfoData.id_employee"
            :options="employeeList"
            label="担当者"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
        </template>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-3">
          <MtFormInputDate
            v-model:date="empInfoData.datetime_posted"
            label="作成日時"
            type="date"
          />
        </div>
        <div class="col-3">
          <InputEmployeeOptGroup
            v-model:selected="empInfoData.id_employee_posted"
            department-selected=""
            label="作成者ID"
            show-select-default-employee
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col">
          <q-editor
          :toolbar="[
            ['left', 'center', 'right', 'justify'],
            ['bold', 'italic', 'strike', 'underline'],
            ['undo', 'redo'],
            ['token'],
            [
              {
                label: $q.lang.editor.formatting,
                icon: $q.iconSet.editor.formatting,
                list: 'no-icons',
                options: ['p', 'h2', 'h3', 'h4', 'h5']
              }
            ]
          ]"
          ref="targetRef"
          toolbar-bg="primary"
          toolbar-text-color="white"
          toolbar-toggle-color="accent-700"
          height="40vh"
          class="editor"
          v-model="empInfoData.memo_emp_info"
          @update:model-value="updateBtnLabel"
        >
          <template v-slot:token>
            <q-color
              @click="colorClicked()"
              v-model="foreColor"
              no-header
              no-footer
              default-view="palette"
              :palette="['#000000', '#FF0000', '#0000FF', '#008000', '#505050']"
              unelevated
              class="q-mt-sm bg-primary color-picker"
            />
          </template>
        </q-editor>
        <div class="q-mt-sm flex justify-end text-caption">
            <span :class="{ 'text-negative': isCharCountInvalid }">
              {{ memoValidation.charCount }}文字 / {{ maxChars }}文字
            </span>
          </div>
          
          <div v-if="isCharCountInvalid" class="text-negative text-caption custom-margin-bottom" role="alert" aria-live="assertive">
            {{ memoValidation.validationMessage.value.replace(/['"]+/g, '') }}
          </div>
      </div>
      </div>
       <div class="row q-col-gutter-md q-mt-xs">
          <div class="col-4 uploaded-file">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              添付1
            </div>
            <div>
            <UploadFile
              :key="fileUploadKey"
              :rules="[aahValidations.validationRequired]"
              :fileUrl="empInfoData.file_url"
              @fileUploaded="(file: File) => selectedFile = file"
              @fileRemoved="() => {selectedFile = empInfoData.file_path1 = ''}"
            />
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-xl q-pa-xl">
          <div class="col">
            <span>未読</span>
            <div class="flex items-center" v-if="getEmpInfo?.emp_info_read?.filter((data) => { return !data.flg_read })?.length">
              <span class="flex items-center" v-for="(item, idx) in getEmpInfo.emp_info_read.filter((data) => { return !data.flg_read })" :key="idx"> 
                <img class="q-mr-sm emp-info-image" v-if="getEmployeeDetail(item).image_path1" :src="getEmployeeDetail(item).image_path1" />
                <q-icon v-else name="account_circle" size="lg" class="text-grey-500" />
                <span>{{ getEmployeeDetail(item).name_display }}</span>
                <span v-if="idx !== getEmpInfo.emp_info_read.length - 1" class="q-mr-sm">,</span>
              </span>
            </div>
          </div>
          <div class="col">
            <span>確認済</span>
            <div class="flex items-center" v-if="getEmpInfo?.emp_info_read?.filter((data) => { return data.flg_read })?.length">
              <span v-for="(item, idx) in getEmpInfo.emp_info_read.filter((data) => { return data.flg_read })" :key="idx"> 
                <img class="q-mr-sm emp-info-image" v-if="getEmployeeDetail(item).image_path1" :src="getEmployeeDetail(item).image_path1" />
                <q-icon v-else name="account_circle" size="lg" class="text-grey-500" />
                <span>{{ getEmployeeDetail(item).name_display }}</span>
                <span v-if="idx !== getEmpInfo.emp_info_read.length - 1" class="q-mr-sm">,</span>
              </span>
            </div>
          </div>
        </div>
    </q-card-section>
     <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          tabindex="15"
          class="q-ml-md"
          type="submit"
           :disabled="isCharCountInvalid"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>  
</template>
<style lang="scss" scoped>
.color-picker {
  max-width: 20px;
  box-shadow: none;
  border-radius: 0;
}
.editor {
  line-height: 1.7;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }
}
.custom-margin-bottom {
    margin-top: -23px;
}
</style>