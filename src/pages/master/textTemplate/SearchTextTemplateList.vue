<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import UpdateTextTemplateModal from './UpdateTextTemplateModal.vue'
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
const selectedTypeTextTemplate = ref(null) // フィルタ用のデータプロパティを追加
const router = useRouter()

const columns = [
  {
    name: 'type_text_template',
    label: '使用区分',
    field: 'type_text_template',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'flg_title',
    label: '見出し',
    field: 'flg_title',
    align: 'left',
    style: 'width: 20%',
    headerStyle: 'width: 20%'
  },
  {
    name: 'memo_template',
    label: 'テンプレート文章',
    field: 'memo_template',
    style: 'width: 50%',
    align: 'left'
  },
  {
    name: 'display_order',
    label: '表示順序',
    field: 'display_order',
    align: 'left'
  }
]

// function init() {}

const openAddModal = async () => {
  let updatedFlg = { value: false }
  templateStore.selectTemplate(null)
  await mtUtils.mediumPopup(UpdateTextTemplateModal, { updatedFlg, data: { type_text_template: selectedTypeTextTemplate.value }})
  if (updatedFlg.value) {
    search()
  }
}
const onRowClick = async (data) => {
  let updatedFlg = { value: false }
  templateStore.selectTemplate(data.id_text_template)
  await mtUtils.mediumPopup(UpdateTextTemplateModal, {
    updatedFlg,
    data,
    searchData: search
  })
  if (updatedFlg.value) {
    search()
  }
}

const search = () => {
  templateStore.fetchTemplates({
    type_text_template: selectedTypeTextTemplate.value // 追加したフィルタの値を使用
  })
  const typeTemplate = typeTextTemplate.find(
    (v) => v.value === selectedTypeTextTemplate.value
  )
  if (typeTemplate && Object.keys(typeTemplate).length > 0)
    router.replace({ query: { type: typeTemplate.enLabel.toLowerCase() } })
  else router.replace({ name: 'SearchTextTemplateList' })
}
const typeTextTemplateName = (value) =>
  typeTextTemplate.find((v) => v.value === value)?.label

onMounted(async () => {
  //await templateStore.fetchTemplates()
  if (typeTextTemplate.length > 0) {
    selectedTypeTextTemplate.value = typeTextTemplate[0].value
  }
  search()

  setPageTitle('テンプレート一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          テンプレート一覧
        </q-toolbar-title>
        <MtFormPullDown
          outlined
          class="q-mr-sm selection-field"
          v-model:selected="selectedTypeTextTemplate"
          v-model:options="typeTextTemplate"
          label="使用区分"
          @update:selected="search"
        />
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />テンプレート
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="sortBy(getTemplates, 'display_order', 'asc')"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100vh - 70px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div
            v-if="col.field === 'type_text_template'"
            class="body1 regular text-grey-900"
          >
            {{ typeTextTemplateName(row['type_text_template']) }}
          </div>
          <div
            v-else-if="col.field === 'flg_title'"
            class="body1 regular text-grey-900"
          >
            <q-icon v-if="row[col.field]" size="24px" name="check_circle" />
          </div>
          <div
            v-else-if="col.field === 'memo_template'"
            class="body1 regular text-grey-900"
          >
            {{ row['memo_template'] }}
          </div>
          <div
            v-else-if="col.field === 'display_order'"
            class="body1 regular text-grey-900"
          >
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
