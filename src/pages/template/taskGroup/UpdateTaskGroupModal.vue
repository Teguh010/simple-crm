<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import useTaskGroupStore from '@/stores/task-groups'
import useCategoryStore from '@/stores/categories'
import useTaskGroupItemStore from '@/stores/task-group-items'
import { storeToRefs } from 'pinia'
import UpdateItemTaskGroupModal from './UpdateItemTaskGroupModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'

const taskGroupItemStore = useTaskGroupItemStore()
const taskGroupStore = useTaskGroupStore()
const categoryStore = useCategoryStore()
const { getTaskGroup } = storeToRefs(taskGroupStore)

const emits = defineEmits(['close'])

const props = defineProps({ data: Object })

const isEdit = ref(false)

const data = ref({
  name_task_group: null,
  memo: null,
  remarks: null,
  display_order: null,
  id_clinic: null
})

const typeCategoryName = (value) =>
  categoryStore.getCategories.find((v) => v.id_category === value)
const closeModal = () => {
  emits('close')
}
const openItemTaskGroupModal = async () => {
  await mtUtils.mediumPopup(UpdateItemTaskGroupModal)
}

const onRowClick = async (data: any) => {
  taskGroupItemStore.selectTaskGroupItem(data.id_task_group_item)
  await mtUtils.mediumPopup(UpdateItemTaskGroupModal, { data })
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
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            taskGroupStore
              .destroyTaskGroup(data.value.id_task_group)
              .then(() => {
                taskGroupStore.fetchTaskGroups()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const deleteItem = async (id = null) => {
  await mtUtils
    .confirm(aahMessages.delete_ask, aahMessages.delete)
    .then((confirmation) => {
      if (confirmation) {
        taskGroupItemStore
          .destroyTaskGroupItem(data.value.id_task_group, id)
          .then(async () => {
            await taskGroupStore.fetchTaskGroups()
            taskGroupStore.selectTaskGroup(data.value.id_task_group)
            mtUtils.autoCloseAlert(aahMessages.success)
          })
      }
    })
}
const submit = () => {
  if (props.data) {
    taskGroupStore
      .updateTaskGroup(data.value.id_task_group, data.value)
      .then(async () => {
        await taskGroupStore.fetchTaskGroups()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    taskGroupStore.submitTaskGroup(data.value).then(async () => {
      await taskGroupStore.fetchTaskGroups()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}
onMounted(() => {

  if (props.data?.id_task_group) {
    // Update case
    isEdit.value = true
    data.value = props.data
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        タスクグループマスタ
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-2">
          <MtInputForm
            type="text"
            v-model="data.name_task_group"
            label="タスクグループ名 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-3">
          <MtInputForm
            v-model="data.memo"
            type="text"
            label="グループタイプ説明"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <MtInputForm
            v-model="data.remarks"
            :rules="[aahValidations.validationRequired]"
            label="備考"
            type="text"
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-2">
          <MtInputForm
            type="text"
            v-model="data.display_order"
            label="表示順序（0~999; 小を上位表示）"
          />
        </div>
      </div>
      <div class="q-mt-lg">
        <div class="body1 bold text-black q-mb-md">タスクグループ項目</div>
        <div
          v-for="value in getTaskGroup?.task_group_item_list"
          class="row q-my-sm"
        >
          <div
            class="col-11 bg-grey-050 q-pa-md body1 regular text-grey-900 cursor-pointer"
            @click="onRowClick(value)"
          >
            <div class="row">
              <div class="col-6">
                <p>{{ value.title_task }}</p>
                <p>
                  {{ value.name_category1 }}
                  <q-icon name="chevron_right" />
                  {{ value.name_category2 }}
                </p>
                <p>{{ value.place_task }}</p>
              </div>
              <div class="col-6">
                <span>{{ value.memo_task_todo }}</span>
              </div>
            </div>
          </div>
          <div class="col-auto q-pa-md">
            <q-btn
              @click="deleteItem(value.id_task_group_item)"
              size="7px"
              unelevated
              round
              color="black"
              icon="close"
            />
          </div>
        </div>
        <div v-if="data.id_task_group" class="row q-mt-md">
          <div class="col-12">
            <q-btn
              @click="openItemTaskGroupModal"
              unelevated
              size="24px"
              color="grey-100"
              text-color="grey-800"
              icon="add"
              class="full-width q-pa-sm"
            />
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
