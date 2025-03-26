<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'

import mtUtils from '@/utils/mtUtils'
import {
  typeProjectPurpose  
} from '@/utils/enum'

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

const isEdit = ref(false)
const hideDescriptionTrainingMemos = ref(false)
const flgOpenAllToggles = ref(false)

const searchProjectList = ref([]), searchProjectListDefault = reactive([])
const employeeList = ref([]), employeeListDefault = reactive([])

const stageColumns = [
  {
    name: 'index',
    label: '',
    style: { width: '50px' }
  },
  {
    name: 'task_title',
    label: 'タスクタイトル',
    style: { width: '300px' }
  },
  {
    name: 'detailed_explanation',
    label: '詳細説明',
    style: { width: '300px' }
  },
  {
    name: 'related_materials',
    label: '関連資料',
    style: { width: '300px' }
  },
  {
    name: 'passing_conditions',
    label: '合格条件',
    style: { width: '300px' }
  },
  {
    name: 'identity_verification',
    label: '本人確認',
    style: { width: '100px' }
  },
  {
    name: 'admin_approval',
    label: '管理者承認',
    style: { width: '100px' }
  },
  {
    name: 'final_approval',
    label: '最終承認',
    style: { width: '100px' }
  }
]

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

  if (selectedOption) {  }
}

const submit = () => {
}

const openAllToggles = () => {

}

onMounted(() => {

})
</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        学習プロジェクト
        <div class="q-ml-md">
          <MtFilterSelect
            label="PJ / 対象者"
            :options="searchProjectList"
            :options-default="searchProjectListDefault"
          />
        </div>
      </q-toolbar-title>
      <MtFormCheckBox
        label="縮小モード"
        v-model:checked="hideDescriptionTrainingMemos"
      />
      <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content">
      <div class="flex justify-between items-center gap-4">
        <div class="flex items-center gap-4">
          <q-btn
            label="2/10"
            color="primary"
          />
          <MtFilterSelect
            label="管理者"
            :options="employeeList"
            :options-default="employeeListDefault"
            disable
          />
          <MtFormPullDown
            type="selection"
            label="目的区分"
            :options="typeProjectPurpose"
            style="min-width: 250px;"
            disable
          />
          <div>開始日: date start</div>
          <div>終了日: date end</div>
        </div>
        <div class="flex items-center gap-4">
          <q-btn class="bg-grey-100" style="border: 1px solid #333;">一括管理者承認</q-btn>
          <q-btn class="bg-grey-100" style="border: 1px solid #333;">一括最終承認</q-btn>
        </div>
      </div>
      <div class="flex justify-end">
        <MtFormCheckBox
          label="全て開く"
          v-model:checked="flgOpenAllToggles"
          @update:checked="openAllToggles"
        />
      </div>
      <div class="q-mt-md">
        
      <q-expansion-item
        expand-separator
        headerClass="bg-grey-400 flex items-center justify-between"
        expand-icon-class="text-grey-800"
      >
        <template v-slot:header>
          <div class="text-body1 text-primary">1 Name of stage</div>
        </template>
        <q-scroll-area style="width: calc(100vw - (24px + 24px + 16px + 16px)); height: 300px;">
          <div class="row no-wrap stage-header gap-4 text-grey-500">
            <div v-for="stage in stageColumns" :key="stage.name" :style="{'width': stage.style.width}">
              {{ stage.label }}
            </div>
          </div>
          <div class="row no-wrap stage-content q-mt-sm gap-4 text-grey-500">
             <template v-for="stage in stageColumns" :key="stage.name">
               <div v-if="stage.name == 'index'" :style="{ 'width': stage.style.width }">
                 <div class="text-center flex items-center">
                   <q-icon name="check" size="25px" class="text-weight-bold q-mr-sm" />
                   <span>1</span>
                 </div>
               </div>
               <div v-else-if="stage.name == 'task_title'" :style="{ 'width': stage.style.width }">
                 <div>
                   <div class="text-underline">タイトルテキストタイトルテキストタイトルテキスト</div>
                   <MtFormInputText
                     type="textarea"
                     label="本人メモ"
                     disable
                   />
                </div>
               </div>
               <div v-else-if="stage.name == 'detailed_explanation'" :style="{'width': stage.style.width }">
                 <div>タスク説明タスク説明タスク説明タスク説明タスク説明タスク説明タスク説明タスク説明タスク説明タスク説明タスク説明</div>
                 <MtFormInputText
                   type="textarea"
                   label="管理者メモ"
                   disable
                  />
               </div>
               <div v-else-if="stage.name == 'related_materials'" :style="{'width': stage.style.width }">
                 <div>トレーニングメモ関連資料のURL等</div>
                 <MtFormInputText
                   type="textarea"
                   label="差し戻しメモ"
                   disable
                  />
               </div>
               <div v-else-if="stage.name == 'passing_conditions'" :style="{'width': stage.style.width }">
                 <div>合格条件を記載。先輩に学習内容をアウトプットして合格をもらいます。</div>
               </div>
               <div v-else-if="stage.name == 'identity_verification'" :style="{'width': stage.style.width }">
                 <div class="flex column items-center">
                   <q-btn
                     class="bg-accent-300 text-accent-900">
                     <q-icon name="check" class="q-mr-sm text-weight-bold" size="18px" /> 確認
                   </q-btn>
                   <div class="text-center q-mt-xs">2025/01/31</div>
                 </div>
               </div>
               <div v-else-if="stage.name == 'admin_approval'" :style="{'width': stage.style.width }">
                 <div class="flex column items-center">
                   <q-btn-dropdown
                     class="bg-accent-300 text-accent-900 mentor-redo-dropdown"
                     dropdown-icon="none"
                   >
                    <template v-slot:label>
                      <div class="row items-center no-wrap">
                        <q-icon name="check" class="q-mr-sm text-weight-bold" size="18px" />
                        承認
                      </div>
                    </template>
                     <q-list>
                      <q-item clickable v-close-popup @click="onItemClick">
                        <q-item-section>
                          <q-item-label>承認</q-item-label>
                        </q-item-section>
                      </q-item>

                      <q-item clickable v-close-popup @click="onItemClick">
                        <q-item-section>
                          <q-item-label>差し戻し</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                   </q-btn-dropdown>
                   <div class="text-center q-mt-xs">2025/01/31</div>
                 </div>
               </div>
               <div v-else-if="stage.name == 'final_approval'" :style="{'width': stage.style.width }">
                 <div class="flex column items-center">
                   <q-btn
                     class="bg-accent-300 text-accent-900">
                     <q-icon name="check" class="q-mr-sm text-weight-bold" size="18px" /> 承認
                   </q-btn>
                   <div class="text-center q-mt-xs">2025/01/31</div>
                 </div>
               </div>
             </template>
          </div>
        </q-scroll-area>
      </q-expansion-item>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn 
          outline 
          class="bg-grey-100 text-grey-800" 
          @click="closeModal"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          class="q-ml-md"
          color="primary"
          type="submit"
          unelevated
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style lang="scss" scoped>
.stage-header {
  border-bottom: 1px solid $grey-300;
  padding: 10px;
}
.mentor-redo-dropdown {
  :deep(.q-btn-dropdown__arrow) {
    display: none;
  }
}
</style>