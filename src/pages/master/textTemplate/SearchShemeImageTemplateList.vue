<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import UpdateShemeImageTemplateModal from './UpdateShemeImageTemplateModal.vue'
import mtUtils from '@/utils/mtUtils'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import { sortBy } from 'lodash'
import { typeTextTemplate } from '@/utils/enum'
import { useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'

const templateStore = useTextTemplateStore()
const { getTemplates } = storeToRefs(templateStore)
const selectedTypeTextTemplate = ref(100) // フィルタ用のデータプロパティを追加
const router = useRouter()

const columns = [
  // {
  //   name: 'memo_template',
  //   label: '名称',
  //   field: 'memo_template',
  //   align: 'left'
  // },
  {
    name: 'img_file_path_template',
    label: 'Image - Name',
    field: 'img_file_path_template',
    align: 'left'
  },
  {
    name: 'display_order',
    label: '表示順序',
    field: 'display_order',
    align: 'left'
  }
]

function init() {}

const openAddModal = async () => {
  let updatedFlg = { value: false }
  templateStore.selectTemplate(null)
  await mtUtils.smallPopup(UpdateShemeImageTemplateModal, { updatedFlg })
  if (updatedFlg.value) {
    search()
  }
}
const onRowClick = async (data) => {
  let updatedFlg = { value: false }
  templateStore.selectTemplate(data.id_text_template)
  await mtUtils.smallPopup(UpdateShemeImageTemplateModal, {
    updatedFlg,
    data,
    searchData: search
  })
  if (updatedFlg.value) {
    search()
  }
}

const search = async () => {
  await templateStore.fetchTemplates({
    type_text_template: selectedTypeTextTemplate.value // 追加したフィルタの値を使用
  })
  const typeTemplate = typeTextTemplate.find(
    (v) => v.value === selectedTypeTextTemplate.value
  )
  if (typeTemplate && Object.keys(typeTemplate).length > 0)
    router.replace({ query: { type: typeTemplate.enLabel.toLowerCase() } })
  else router.replace({ name: 'SearchShemeImageTemplateList' })
}
const typeTextTemplateName = (value) =>
  typeTextTemplate.find((v) => v.value === value)?.label

onMounted(async () => {
  //await templateStore.fetchTemplates()
  await search()
  // if (typeTextTemplate.length > 0) {
  //   selectedTypeTextTemplate.value = typeTextTemplate[0].value
  // }

  setPageTitle('シェーマ図')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          シェーマ図一覧
        </q-toolbar-title>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />シェーマ図
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="schema-container">
      <div v-for="(img, idx) in sortBy(getTemplates, 'display_order', 'asc')">
        <span class="image-container" :key="idx" @click="onRowClick(img)">
          <img
            :src="img.img_file_path_template"
            class="image-file"
            alt="image template"
          />
          <span class="image-name">{{ img.memo_template }}</span>
        </span>
      </div>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.schema-container {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  padding: 28px;
  .image-container {
    position: relative;
    cursor: pointer;
    .image-file {
      border-radius: 8px;
      object-fit: cover;
      width: 300px;
      height: 300px;
    }
    .image-name {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      padding: 2px 5px;
      font-size: 12px;
      border-radius: 8px;
    }
  }
}
</style>
