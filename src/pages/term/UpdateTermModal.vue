<script setup lang="ts">
import { computed, defineProps, onMounted, ref, withDefaults } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useTerm from '@/stores/term'
import aahValidations from '@/utils/aahValidations'
import { changeToggleDropdownNames, updateBtnLabel } from '@/utils/aahUtils'
import { typeReserved } from '@/utils/enum'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import { TermType } from '@/types/types'

type SearchDataType = {
  date_start: string | null
  date_end: string | null
  title_term: string | null
  type_reserve: number | null
}

const props = withDefaults(
  defineProps<{
    data?: TermType
    searchData?: SearchDataType
  }>(),
  {
    data: () => {
      return {} as TermType
    },
    searchData: () => {
      return {} as SearchDataType
    }
  }
)

const emits = defineEmits(['close'])
const isEdit = ref(false)
const termStore = useTerm()
const targetRef = ref()
const foreColor = ref('#ffff00')
let observer = null

const data = ref({
  id_term: '',
  type_reserve: 1,
  title_term: '',
  memo_term: '',
  flg_available: true,
  display_order: ''
})

const closeModal = () => {
  emits('close')
}

const colorClicked = () => {
  const edit = targetRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
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

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除',
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
        .then(async (confirmation) => {
          if (confirmation) {
            await termStore.destroyTerm(data.value.id_term)
            await termStore.fetchTerms(props.searchData)
            closeModal()
          }
        })
    }
  }
}

const submit = async () => {
  if (isEdit.value) {
    await termStore.updateTerm(data.value.id_term, data.value)
    await termStore.fetchTerms(props.searchData)
    closeModal()
  } else {
    const postData = { ...data.value }
    delete postData.id_term
    await termStore.submitTerm(postData)
    await termStore.fetchTerms(props.searchData)
    closeModal()
  }
}

const editorHeight = computed(() => {
  if (window.innerWidth < 1280) {
    return '50vh'
  }
  if (window.innerWidth > 1920) {
    return '80vh'
  }
  return '64vh'
})

const labelTypeReserved = computed(() => {
  return typeReserved.find((res) => {
    return res.value === props.data.type_reserve
  })?.label
})

onMounted(async () => {
  observer = new MutationObserver(observerCallback)
  observer.observe(document.body, { childList: true, subtree: true })
  if (props.data.id_term) {
    data.value = props.data
    isEdit.value = true
  }
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        仮予約 利用規約：{{ labelTypeReserved }} 
      </q-toolbar-title>
      <q-btn flat round v-if="props.data" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row items-center q-col-gutter-md">
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="data.title_term"
            label="タイトル *"
            required
            :rules="[aahValidations.validationRequired]"
            tabindex="1"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            :options="typeReserved"
            v-model="data.type_reserve"
            label="仮予約区分"
            disable
          />
        </div>
        <!--
        <div class="col-3">
          <MtInputForm
            type="number"
            v-model="data.display_order"
            label="表示順序（0~999; 小を上位表示）"
          />
        </div>-->
        <div class="col-3">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '利用可能' }]"
            v-model="data.flg_available"
          />
        </div>
      </div>
      <div id="t_info_detail_container" class="q-py-lg">
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
          :height="editorHeight"
          class="editor"
          v-model="data.memo_term"
          tabindex="10"
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
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss">
.add-template-field {
  .q-field__control {
    align-items: center !important;
  }
}

.repeat-task-title {
  font-size: medium;
  font-weight: bold;
  margin-bottom: 20px !important;
  color: rgb(30, 71, 57);
}

.repeat-setting {
  background-color: rgb(215, 255, 242);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 10px;
}

.suggested-repeat-list {
  background-color: rgb(233, 255, 248);
  border-radius: 10px;
  padding: 15px !important;
  margin: 15px 0 15px 20px !important;
}
</style>
