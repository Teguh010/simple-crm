<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import {
  changeToggleDropdownNames,
  updateBtnLabel
} from '@/utils/aahUtils'
import useEmailCompaignStore from '@/stores/email-compaign'

const props = defineProps({
  data: Object,
  searchData: Function
})
const emailCompaignStore = useEmailCompaignStore()

const emits = defineEmits(['close'])
const isEdit = ref(false)
const data = ref({
  recipientEmails: null,
  flg_all: true,
  flg_sent: false,
  name_email_campaign: "",
  subject: "",
  body: "",
  display_order: 1
})
const targetRef = ref()
const foreColor = ref('#ffff00')
let observer = null 

const closeModal = () => {
  emits('close')
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
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            emailCompaignStore
              .destroyEmailCompaign(data.value.id_email_campaign)
              .then(() => {
                props.searchData()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const submit = () => {
  if (props.data) {
    emailCompaignStore
      .updateEmailCompaign(data.value.id_email_campaign, data.value)
      .then(async () => {
        emits('close')
        props.searchData()
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    emailCompaignStore.submitEmailCompaign(data.value).then(async () => {
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
      props.searchData()
    })
  }
}
const recipientEmails = computed(() => {
  const returnValue = [
    {
      label: "abc@gmail.com",
      value: "abc@gmail.com"
    }
  ]
  return returnValue
})

const init_observer = () => {
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
}

onMounted(() => {
  if(props.data){
    data.value = {...props.data }
    isEdit.value = true
  }
  init_observer()

})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        一括メール
      </q-toolbar-title>
      <q-btn flat round v-if="isEdit" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="email-content q-py-sm">
        <div class="row" :style="{display: 'none'}">
          <div class="col-lg-6 col-md-6 col-sm-6">
            <MtFormPullDown
              type="selection"
              label="送信対象メール"
              outlined
              v-model:selected="data.recipientEmails"
              :options="recipientEmails"
              :disable="data.flg_all"
            />
          </div>
          <div class="col-lg-4 col-md-4 col-sm-4 q-ml-md align-center" >
            <MtFormCheckBox
              type="checkbox"
              @update:checked=""
              label="すべての顧客に送信する"
              v-model:checked="data.flg_all"
            />
          </div>
        </div>
        <div class="row">
          <MtInputForm
            outlined
            type="text"
            label="キャンペーン名 *"
            v-model="data.name_email_campaign"
            class="col-6"
          />
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12 q-my-md">
          <MtInputForm
            outlined
            type="text"
            label="主題 *"
            v-model="data.subject"
          />
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12 q-mt-md">
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
            v-model="data.body"
            @update:model-value="updateBtnLabel"
            tabindex="10"
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

        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>

</style>

