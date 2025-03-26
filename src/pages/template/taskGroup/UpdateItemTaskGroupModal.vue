<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useTaskGroupItemStore from '@/stores/task-group-items'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import useTaskGroupStore from '@/stores/task-groups'
import useCategoryStore from '@/stores/categories'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import aahValidations from '@/utils/aahValidations'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { typeTaskReview } from '@/utils/enum'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import { CliCommon } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

const taskGroupItemStore = useTaskGroupItemStore()
const taskGroupStore = useTaskGroupStore()
const employeeStore = useEmployeeStore()
const categoryStore = useCategoryStore()
const cliCommonStore = useCliCommonStore()

const { getTaskGroup } = storeToRefs(taskGroupStore)
const { getAllSubCategories } = storeToRefs(categoryStore)

const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)

const emits = defineEmits(['close'])
const props = defineProps({ data: Object })

const data = ref({
  id_task_group: null,
  id_category1: null,
  id_category2: null,
  quantity: null,
  title_task: null,
  memo_task_todo: null,
  place_task: null,
  id_employee_staff: null,
  flg_approved: false,
  type_task_review: null,
  id_employee_reviewed1: null,
  id_employee_reviewed2: null,
  name_category1: null,
  name_category2: null,
  code_category2: null
})
const formRef = ref(props.data)

const taskDepList = ref<TaskDepList[]>([])

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))


const closeModal = () => {
  emits('close')
}


async function selectedCategory1(value: any) {
  data.value.id_category1 = value
  if (value) {
    data.value.flg_start_arroval_required = categoryStore.getAllCategories.filter(
      (i) => i?.id_category == value
    )[0]?.flg_approval_required
  }
}

function selectedCategory2(value: any) {
  data.value.id_category2 = value
}


const getTaskDepList = async () => {
  taskDepList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: parseInt(obj.code_func1)
  }))
}

const handleTypeTask = (value: any) => {
  data.value.place_task = taskDepList.value.find((i: any) => i.value == value)?.label || ''
}

const submit = () => {
  data.value.id_task_group = getTaskGroup.value.id_task_group
  if (props.data) {
    taskGroupItemStore
      .updateTaskGroupItem(
        getTaskGroup.value.id_task_group,
        data.value.id_task_group_item,
        data.value
      )
      .then(async () => {
        await taskGroupStore.fetchTaskGroups()
        taskGroupStore.selectTaskGroup(getTaskGroup.value.id_task_group)
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    taskGroupItemStore
      .submitTaskGroupItem(getTaskGroup.value.id_task_group, data.value)
      .then(async () => {
        await taskGroupStore.fetchTaskGroups()
        taskGroupStore.selectTaskGroup(getTaskGroup.value.id_task_group)
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  }
}


const selectDefaultEmployee = (key: string) => {
  data.value[key] = defaultEmployee
}

onMounted(async () => {
  await getTaskDepList()
  
  if (props.data?.id_task_group) {
    // Update case
    data.value = JSON.parse(JSON.stringify(props.data))

  } else {
    // Create case
    data.value = data.value
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        タスクグループ項目
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-sm">
        <MtCategorySelectionComponent
          :data="formRef"
          :flg_for_task="true"
          @category1="(value)=> data.name_category1 = value"
          @category1Selected="selectedCategory1"
          @category2="(value)=> data.name_category2 = value"
          @category2Selected="selectedCategory2"
          @codeCategory="(value)=> data.code_category2 = value"
        />
        <div class="col-2">
          <MtInputForm
            type="text"
            v-model="data.title_task"
            label="タスク名 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="data.memo_task_todo"
            label="タスク内容"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-4">
          <MtFormPullDown
            v-model:selected="data.type_task_place"
            :options="taskDepList"
            :rules="[aahValidations.validationRequired]"
            label="対応部署 *"
            required
            @update:selected="(value)=> {
              data.place_task = taskDepList.find((i: any) => i.value == value)?.label
            }"
          />
        </div>
        <div class="col-4">
          <InputEmployeeOptGroup
            v-model:selected="data.id_employee_staff"
            label="主担当者"
            show-select-default-employee
            @update:select-default-employee="
              selectDefaultEmployee('id_employee_staff')
            "
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-xs">
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '開始前承認済' }]"
            v-model="data.flg_approved"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-xs">
        <div class="col-3">最終承認必要タイプ</div>
        <div class="col-9">
          <MtInputForm
            type="radio"
            :items="typeTaskReview"
            v-model="data.type_task_review"
          />
          <div class="row q-mt-md">
            <div class="col-4">
              <InputEmployeeOptGroup
                v-model:selected="data.id_employee_reviewed1"
                label="最終承認者1"
                class="q-mr-md"
                show-select-default-employee
                @update:select-default-employee="
                  selectDefaultEmployee('id_employee_reviewed1')
                "
              />
            </div>
            <div class="col-4">
              <InputEmployeeOptGroup
                v-model:selected="data.id_employee_reviewed2"
                label="最終承認者2"
                show-select-default-employee
                @update:select-default-employee="
                  selectDefaultEmployee('id_employee_reviewed2')
                "
              />
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
