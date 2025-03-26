<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, withDefaults, defineAsyncComponent } from 'vue'
import { storeToRefs } from 'pinia'
import { sortBy } from 'lodash'

// Components
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import OptionModal from '@/components/OptionModal.vue'

// Utilities
import {
  changeToggleDropdownNames,
  copyText,
  formatDateWithTime,
  getFullPetName,
  updateBtnLabel
} from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'

// Stores
import useMemoCarteStore from '@/stores/memo-cartes'
import useIllnessHistoryStore from '@/stores/illness-history'
import useTextTemplateStore from '@/stores/text-template'
import useConversationStore from '@/stores/Conversation'
import useFabricStore from '@/stores/fabrics'
import useTask from '@/stores/task'
import useRequestStore from '@/stores/requests'
import useCliCommonStore from '@/stores/cli-common'

// Lazy-loaded Components
const FabricMemoCarteModal = defineAsyncComponent(() => import('./FabricMemoCarteModal.vue'))
const UpdateTaskModal = defineAsyncComponent(() => import('../task/UpdateTaskModal.vue'))
const UpdateMemoCarteModal = defineAsyncComponent(() => import('@/pages/memoCarte/UpdateMemoCarteModal.vue'))
const AddTextTemplateModal = defineAsyncComponent(() => import('../task/AddTextTemplateModal.vue'))

// Types
import { CliCommon, IllnessHistoryType } from '@/types/types'
import { useMovableModalStore } from '@/stores/movable-modal'


type MemoCartePropType = {
  attr: { showHeader: boolean }
}

const requestStore = useRequestStore()
const fabricStore = useFabricStore()
const memoCarteStore = useMemoCarteStore()
const illnessHistoryStore = useIllnessHistoryStore()
const taskStore = useTask()
const textTemplateStore = useTextTemplateStore()
const cliCommonStore = useCliCommonStore()
const conversationStore = useConversationStore()
const { getTemplates } = storeToRefs(textTemplateStore)
const { getMemoData, getMemoCarte, getMemoCartes, getMemoCartePetDetail } =
  storeToRefs(memoCarteStore)
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)
const { getRequest } = storeToRefs(requestStore)
const { getCliCommonTypeCarteSourceList } = storeToRefs(cliCommonStore)
const emits = defineEmits<{
  (e: 'close'): void
  (e: 'changePosition', value: string): void
}>()
const movableModalStore = useMovableModalStore()
const { getMovableModalData } = storeToRefs(movableModalStore)

const { getFabric } = storeToRefs(fabricStore)

const props = withDefaults(
  defineProps<{
    className: string
    editorHeight: number
    popup: MemoCartePropType
  }>(),
  {
    className: '',
    editorHeight: window.innerHeight / 3.2, // should be 300px at max for default value
    popup: () => {
      return {} as MemoCartePropType
    }
  }
)

const memoCarteList = ref([])
const addTemplateModalFlg = ref(false),
  textTemplatesList = ref([])
const closeModal = () => {
  emits('close')
}
const isDatetimeEdited = ref(false)
const petSelected = ref()
const customerSelected = ref()
const targetRef = ref()
const foreColor = ref('#ffff00')
const memoCarteIndex = ref(0)
const data = ref({
  id_pet: '',
  id_request: '',
  id_customer: '',
  id_employee: '',
  datetime_memo_carte: null,
  id_pet_illness_history: null,
  id_clinic: '',
  memo_other: '',
  type_source: '',
  illnessHistoryOptions: null
})
let observer = null // it will watch DOM changes
let editorContent = null
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const modalPositions = [
  {
    label: '右上',
    value: 'topRight'
  },
  {
    label: '左上',
    value: 'topLeft'
  },
  {
    label: '右下',
    value: 'bottomRight'
  },
  {
    label: '左下',
    value: 'bottomLeft'
  },
  {
    label: '左半分',
    value: 'halfLeft'
  },
  {
    label: '右半分',
    value: 'halfRight'
  }
]

const handlePaste = async (event) => {
  event.preventDefault()
  // Get the plain text from the clipboard
  const text = (event.clipboardData || window.clipboardData).getData('text')

  // Insert text at cursor position
  document.execCommand('insertHtml', true, text) // I updated from insertText to insertHtml in order to retain the styling, with insertText, the div and other tags get removed.
}
const colorClicked = () => {
  const edit = targetRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
}
const setDefaultDateTime = () => {
  if (!isDatetimeEdited) {
    const memo_carte = memoCarteList.value.find(
      (item) => item.id_memo_carte === props.id_memo_carte
    )
    data.value.datetime_memo_carte = formatDateWithTime(
      memo_carte.datetime_memo_carte,
      'YYYY/MM/DD HH:mm:ss'
    )
  } else {
    data.value.datetime_memo_carte = formatDateWithTime(
      data.value.datetime_memo_carte,
      'YYYY/MM/DD HH:mm:ss'
    )
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: { class: null, clickable: true }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await memoCarteStore.destroyMemoCarte(props.id_memo_carte)
            memoCarteStore.fetchMemoCarte({
              id_pet: props.id_pet,
              id_customer: props.id_customer
            })
            mtUtils.autoCloseAlert(aahMessages.success)
            emits('close')
          }
        })
    }
  }
}
const submit = async () => {
  if (!data.value.id_pet_illness_history)
    delete data.value.id_pet_illness_history
  data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

  if (getMemoCarte?.value?.id_memo_carte) {
    setDefaultDateTime()
    return await memoCarteStore
      .updateMemoCarte(data.value.id_memo_carte, data.value)
      .then(() => {
        memoCarteStore.fetchMemoCarte({
          id_pet: getRequest.value.id_pet,
          id_customer: getRequest.value.id_customer
        })
        mtUtils.autoCloseAlert(aahMessages.success)
        closeMovableMemoCarteModal()
      })
  }

  data.value.datetime_memo_carte = formatDateWithTime(
    data.value.datetime_memo_carte,
    'YYYY/MM/DD HH:mm:ss'
  )
  return await memoCarteStore.submitMemoCarte(data.value).then(() => {
    memoCarteStore.fetchMemoCarte({
      id_pet: getRequest.value.id_pet,
      id_customer: getRequest.value.id_customer
    })
    mtUtils.autoCloseAlert(aahMessages.success)
    closeMovableMemoCarteModal()
  })
}
const save = async () => {
  if (!data.value.id_pet_illness_history)
    delete data.value.id_pet_illness_history
  data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))

  if (getMemoCarte?.value?.id_memo_carte) {
    setDefaultDateTime()
    return await memoCarteStore
      .updateMemoCarte(data.value.id_memo_carte, data.value)
      .then(() => {
        memoCarteStore.fetchMemoCarte({
          id_pet: getRequest.value.id_pet,
          id_customer: getRequest.value.id_customer
        })
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  }

  data.value.datetime_memo_carte = formatDateWithTime(
    data.value.datetime_memo_carte,
    'YYYY/MM/DD HH:mm:ss'
  )
  return await memoCarteStore.submitMemoCarte(data.value).then(() => {
    memoCarteStore.fetchMemoCarte({
      id_pet: getRequest.value.id_pet,
      id_customer: getRequest.value.id_customer
    })
    mtUtils.autoCloseAlert(aahMessages.success)
  })
}
const openCreateTaskModal = async () => {
  taskStore.selectTask(null)
  const taskData = {
    id_customer: props.id_customer,
    id_pet: props.id_pet,
    type_link1: 4,
    number_link1: props.id_memo_carte ? data.value?.number_memo_carte : '',
    id_employee_staff: props.requestDetailPage?.id_employee_staff,
    id_employee_request: JSON.parse(localStorage.getItem('id_employee'))
  }
  await mtUtils.popup(UpdateTaskModal, { data: taskData, copiedTaskData: true }, true)
}
const openFabricMemoCarteModal = async () => {
  await mtUtils.mediumPopup(FabricMemoCarteModal, {
    id_memo_carte: props.id_memo_carte,
    additional_image: data.value?.files,
    id_customer: data.value?.id_customer,
    id_pet: data.value?.id_pet
  })
  if (getFabric.value) {
    data.value.memo_other +=
      '<img style="max-width: 100%;" src="' + getFabric.value?.file_url + '"/>'
    fabricStore.resetFabric()
  }
}
const openTemplateTextModal = async () => {
  await textTemplateStore.fetchTemplates({ type_text_template: 21 })
  if (getTemplates.value.length) {
    textTemplatesList.value = sortBy(
      getTemplates.value,
      'display_order',
      'asc'
    ).map((template: any) => {
      return {
        title: template.memo_template,
        flg_title: template.flg_title,
        attr: {
          class: template.flg_title ? 'bg-grey-300' : ''
        },
        isSelected: false
      }
    })
  }
  addTemplateModalFlg.value = true
}

const copyMemoCarte = async () => {
  // Create a temporary div element
  let tempDiv = document.createElement('div')

  // Set the HTML content
  tempDiv.innerHTML = data.value.memo_other

  // Remove img elements
  tempDiv.querySelectorAll('img').forEach((img) => {
    img?.parentNode?.removeChild(img)
  })

  // Get the updated HTML content
  let updatedHtml = tempDiv.innerHTML

  copyText(updatedHtml)
}

const typeMemoCarte = computed(
  () => getCliCommonTypeCarteSourceList.value.filter((v: CliCommon) => v.code_cli_common == 11).map((v: CliCommon) => ({...v, label: v.name_cli_common, value: v.id_cli_common }))
)

//The function is updating the memo which is updated the AddTextTemplateModal component.
const handleUpdateMemo = (value: any) => {
  data.value.memo_other += ' ' + value.replace(/\n/g, '<br>')
}
const handleSetMemoData = (value: string) => {
  updateBtnLabel(value)
  // save typed data to store
  memoCarteStore.setMemoData(value)
}
const closeMovableMemoCarteModal = () => {
  movableModalStore.closeMovableModal()
  memoCarteStore.setMemoData('')
}
const openOriginalMemoCarte = () => {
  closeMovableMemoCarteModal()
  mtUtils.popup(UpdateMemoCarteModal, {
    fromMovableMemoCarte: true,
    movable_cart_content: { ...data.value }
  }, true)
}
const setCursorPosition = () => {
  const sel = window.getSelection()
  if (sel.rangeCount > 0) {
    sel.removeAllRanges()
  }
  const range = document.createRange()
  range.selectNodeContents(editorContent)
  range.collapse(true)

  const x = event.clientX
  const y = event.clientY

  const walker = document.createTreeWalker(
    editorContent,
    NodeFilter.SHOW_TEXT,
    null,
    false
  )
  let node,
    textNode = null,
    offset = 0

  while ((node = walker.nextNode())) {
    range.selectNodeContents(node)
    const rect = range.getBoundingClientRect()
    if (y < rect.bottom) {
      textNode = node
      const rangeOffset = document.createRange()
      for (let i = 0; i < node.textContent.length; i++) {
        rangeOffset.setStart(node, i)
        rangeOffset.setEnd(node, i + 1)
        const rectOffset = rangeOffset.getBoundingClientRect()
        if (x < rectOffset.right) {
          offset = i
          break
        }
      }
      break
    }
  }

  if (textNode) {
    range.setStart(textNode, offset)
    range.setEnd(textNode, offset)
    sel.addRange(range)
  }
}

const changePosition = (value: string) => {
  emits('changePosition', value)
}

const selectDefaultEmployee = () => {
  data.value.id_employee = defaultEmployee
}

onUnmounted(() => {
  // Removing paste from clipboard event listener while onunmounted
  const editorElement = targetRef.value?.$el
  if (editorElement) editorElement.removeEventListener('paste', handlePaste)
  // stop watching DOM changes
  observer?.disconnect()
  editorContent.removeEventListener('click', setCursorPosition)
  props.popup.attr.showHeader = false
})
onMounted(async () => {
  console.info('on mount')
  if (getMemoCartePetDetail.value.length > 0)
    memoCarteList.value = getMemoCartePetDetail.value
  else if (getMemoCartes.value.length > 0)
    memoCarteList.value = getMemoCartes.value

  // Adding paste from clipboard event listener
  const editorElement = targetRef.value.$el
  if (editorElement) editorElement.addEventListener('paste', handlePaste)

  let memoCarteData = getMovableModalData.value
  
  if (Object.keys(memoCarteData).length) {
    for (let key in memoCarteData) {
      data.value[key] = memoCarteData[key]
    }
  }

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
  // set to focus on onmounted
  targetRef.value?.focus()
  editorContent = document.querySelector('.q-editor__content')
  // if (editorContent) editorContent.addEventListener('click', setCursorPosition)
  await illnessHistoryStore.fetchIllnessHistorys({
    id_pet: data.value.id_pet,
    id_customer: data.value.id_customer
  })

  if (getMemoData.value) {
    data.value.memo_other = getMemoData.value
  }
})

const setTargetFocus = () => {
  targetRef.value.focus()
}
</script>

<template>
  <MtModalHeader @closeModal="closeModal" :closeBtn="false">
    <q-toolbar-title class="text-grey-900 title3 bold">
      メモカルテ：
      <span @click="copyText(data.number_memo_carte)" class="cursor-pointer">
        {{ data.number_memo_carte }}
        <q-icon name="content_copy" class="blue" />
      </span>
      <span class="q-ml-md">
        {{ getFullPetName(petSelected, customerSelected) }}
      </span>
    </q-toolbar-title>
    <q-btn
      flat
      icon="picture_in_picture"
      :label="props.popup.attr.showHeader ? '位置' : ''"
    >
      <q-menu style="z-index: 6002">
        <q-list style="min-width: 150px">
          <q-item
            v-for="(position, idx) in modalPositions"
            :key="idx"
            clickable
          >
            <q-item-section
              flat
              v-close-popup
              @click="changePosition(position.value)"
              @touchend="changePosition(position.value)"
            >
              {{ position.label }}
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </q-btn>
    <q-btn
      @click="openTemplateTextModal"
      @touchend="openTemplateTextModal"
      flat
    >
      <q-icon name="playlist_add" />
      <span v-if="props.popup.attr.showHeader"> テンプレ </span>
    </q-btn>
    <q-btn
      flat
      unelevated
      @click="openFabricMemoCarteModal"
      @touchend="openFabricMemoCarteModal"
    >
      <q-icon name="add_photo_alternate" />
      <span v-if="props.popup.attr.showHeader"> シェーマ図 </span>
    </q-btn>
    <q-btn @click="copyMemoCarte" @touchend="copyMemoCarte" flat>
      <q-icon name="content_copy" />
      <span v-if="props.popup.attr.showHeader"> コピー </span>
    </q-btn>
    <q-btn
      @click="openCreateTaskModal"
      @touchend="openCreateTaskModal"
      unelevated
    >
      <q-icon name="add" />
      <span v-if="props.popup.attr.showHeader">タスク</span>
    </q-btn>
    <q-btn
      unelevated
      flat
      round
      @click="openOriginalMemoCarte"
      @touchend="openOriginalMemoCarte"
    >
      <q-icon name="chrome_reader_mode" />
    </q-btn>
    <q-btn
      flat
      round
      @click="closeMovableMemoCarteModal"
      @touchend="closeMovableMemoCarteModal"
    >
      <q-icon size="xs" name="close" />
    </q-btn>
  </MtModalHeader>
  <div @touchend="targetRef.focus()">
    <q-form @submit="submit">
      <q-card-section>
        <div class="row q-gutter-md">
          <div class="col">
            <div class="row items-center q-gutter-md q-mb-md">
              <!-- v-if="props.popup.attr.showHeader" -->
              <div class="col">
                <div class="row items-center q-col-gutter-md">
                  <div class="col-3">
                    <InputEmployeeOptGroup
                      v-model:selected="data.id_employee"
                      popup-content-style="z-index: 6005"
                      label="記入者"
                      show-select-default-employee
                      @update:select-default-employee="selectDefaultEmployee"
                    />
                  </div>
                  <div class="col-3">
                    <MtFormInputDate
                      v-model:date="data.datetime_memo_carte"
                      popup-content-style="z-index: 6005"
                      label="メモカルテ記録日時"
                      @update:date="isDatetimeEdited = true"
                    />
                  </div>
                  <div class="col-3">
                    <MtFormPullDown
                      v-model="data.type_source"
                      popup-content-style="z-index: 6005"
                      :options="typeMemoCarte"
                      label="カルテ区分"
                    />
                  </div>
                  <div class="col-3">
                    <MtFormMultipleSelection
                      v-model="data.id_pet_illness_history"
                      popup-content-style="z-index: 6005"
                      :option-label="
                        (v: IllnessHistoryType): string => {
                          return v.name_disease ? v.name_disease : v.name_disease_free
                        }
                      "
                      :options="getIllnessHistorys"
                      :rules="[aahValidations.validationRequired]"
                      label="現疾患・既往歴"
                      option-value="id_pet_illness_history"
                      required
                      show-quick-illness-history
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="row" style="gap: 8px" @touchend="targetRef.focus()">
              <div class="col-12 relative-position">
                <q-editor
                  ref="targetRef"
                  v-model="data.memo_other"
                  id="movable-memo-editor"
                  :height="`${props.editorHeight.toString()}px`"
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
                  class="editor"
                  toolbar-bg="primary"
                  toolbar-text-color="white"
                  toolbar-toggle-color="accent-700"
                  @update:model-value="handleSetMemoData"
                >
                  <template v-slot:token>
                    <q-color
                      v-model="foreColor"
                      :palette="[
                        '#000000',
                        '#FF0000',
                        '#0000FF',
                        '#008000',
                        '#505050'
                      ]"
                      class="q-mt-sm bg-primary color-picker"
                      default-view="palette"
                      no-footer
                      no-header
                      unelevated
                      @click="colorClicked()"
                    />
                  </template>
                </q-editor>
              </div>
              <div class="col-12 text-right">
                <q-btn-group>
                  <q-btn unelevated @click="save">保存</q-btn>
                  <q-btn color="primary" unelevated @click="submit"
                    >保存して閉じる
                  </q-btn>
                </q-btn-group>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-form>
  </div>

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="メモカルテ テンプレート"
    :options="textTemplatesList"
    :data="data"
    @update:memo="handleUpdateMemo"
  />
</template>

<style lang="scss" scoped>
.color-picker {
  max-width: 20px;
  box-shadow: none;
  border-radius: 0;
}
.q-editor {
  border-radius: 10px;
}

:deep(.q-editor__content) {
  padding: 16px;
}

.recording-btn {
  width: 80px;
  height: 80px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}
.editor {
  line-height: 1.7;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }
}
.hide-toolbar {
  :deep(.q-editor__toolbars-container) {
    display: none;
  }
}
.content {
  height: unset !important;
  max-height: calc(100vh - 200px);
}

.modal-btn {
  display: flex;
  gap: 8px;
  justify-content: center;
  align-items: center;
}

.flex-column-footer {
  flex-direction: column;
}
.q-menu {
  z-index: 6005 !important;
}
</style>
