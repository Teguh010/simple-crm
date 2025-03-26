<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateManualLabCategoryModal from './UpdateManualLabCategoryModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCategoriesStore from '@/stores/categories'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { useRouter, useRoute } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { menuHelperContents } from '@/utils/menuHelperContents'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'


const categoryStore = useCategoriesStore()
const route = useRoute()
const router = useRouter()

const pageName = ref('手入力検査のカテゴリ一覧')

const categoryName = ref('')
const categoryLabel = ref('')
const flg_for_medicine = ref(false)
const flg_for_service = ref(false)
const flg_for_disease = ref(false)
const flg_for_task = ref(false)
const flg_for_item = ref(false)
const flg_for_food = ref(false)
const flg_for_lab = ref(false)
const flg_for_other = ref(false)
const categoryList = ref([])
const flg_category = ref('')

const cat_options_raw = [
  {
    label: '臨床検査マニュアルラボ',
    value: 'flg_for_lab'
  },
]

const cat_options = ref([])
const catList = ref([])

const onRowClick = async (data: any) => {
  let updatedFlg = { value: false }
  await mtUtils.smallPopup(UpdateManualLabCategoryModal, { data, categoryLabel: categoryLabel.value, updatedFlg })
  // categoryList.value = categoryStore.getCategories
  if (updatedFlg.value) {
    search()
  }
}

const openAddModal = async () => {
  let updatedFlg = { value: false }
  const data = {
    flg_for_service: flg_for_service.value,
    flg_for_medicine: flg_for_medicine.value,
    flg_for_disease: flg_for_disease.value,
    flg_for_task: flg_for_task.value,
    flg_for_item: flg_for_item.value,
    flg_for_lab: flg_for_lab.value,
    flg_for_food: flg_for_food.value,
    flg_for_other: flg_for_other.value
  }
  await mtUtils.smallPopup(UpdateManualLabCategoryModal, { categoryLabel: categoryLabel.value, data, updatedFlg })
  search()
  //categoryList.value = categoryStore.getCategories
}

const setCategoryOption = async (value: any) => {
  switch (value) {
    default:
      categoryLabel.value = '臨床検査マニュアルラボ'
      flg_category.value = 'flg_for_lab'
      flg_for_item.value = false
      flg_for_medicine.value = false
      flg_for_service.value = false
      flg_for_disease.value = false
      flg_for_task.value = false
      flg_for_lab.value = true
      flg_for_food.value = false
      flg_for_other.value = false
      break
  }

  search()
}

const search = async () => {
  catList.value = []
  await categoryStore.fetchCategories({
    name_category: categoryName.value,
    flg_for_medicine: flg_for_medicine.value,
    flg_for_service: flg_for_service.value,
    flg_for_disease: flg_for_disease.value,
    flg_for_task: flg_for_task.value,
    flg_for_food: flg_for_food.value,
    flg_for_item: flg_for_item.value,
    flg_for_lab: flg_for_lab.value,
    flg_for_other: flg_for_other.value,
    all_data: true
  })

  categoryList.value = categoryStore.getCategories

  var result = transformToTree(categoryList.value)
  catList.value = result
  const category = flg_category.value.split('_')

  router.replace({ query: { type: category[category.length - 1] } })
}

const flagsList = (item: any) => {
  let list = item.flg_for_medicine ? '処方・医薬品' : ' '
  list += item.flg_for_service ? 'サービス' : ' '
  list += item.flg_for_disease ? '疾患・傷病' : ' '
  list += item.flg_for_task ? 'タスク' : ' '
  list += item.flg_for_item ? '商品管理' : ' '
  list += item.flg_for_food ? 'フード・サプリ' : ' '
  list += item.flg_for_lab ? '臨床検査' : ' '
  return list
}

const transformToTree = (arr: any) => {
  const nodes: Record<string, any> = {};
  const tree: any[] = [];

  arr.forEach((obj: any) => {
    const { id_category: id, id_category_parent: parentId } = obj;
    nodes[id] = nodes[id] || { ...obj, children: [] };
    Object.assign(nodes[id], obj);

    if (parentId) {
      nodes[parentId] = nodes[parentId] || { children: [] };
      nodes[parentId].children.push(nodes[id]);
    } else {
      tree.push(nodes[id]);
    }
  });

  const filterTree = (node: any) => {
    node.children = node.children.filter(filterTree);
    return !(node.code_category === 'LB1' && node.id_category === 1);
  };

  return tree.filter(filterTree);
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.employeeList.title,
    content: menuHelperContents.employeeList.content,
  })
}

const iniCategoryList = () => {
  cat_options.value = [...cat_options_raw]
}

onMounted(async () => {
  setCategoryOption(route.query.type ? `flg_for_${route.query.type}` : null)
  categoryList.value = categoryStore.getCategories
  iniCategoryList()
  setPageTitle(pageName.value)
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          {{ pageName }}
        </q-toolbar-title>
        <MtFormPullDown
          type="selection"
          v-model:selected="flg_category"
          outlined
          :options="cat_options"
          class="q-mr-sm search-field"
          label="使用ケース"
          @update-model-value="setCategoryOption"
        />
        
        <q-btn dense flat round @click="openHelpMenu">
          <q-icon size="24px" name="help_outline" />
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="16px" name="add" />カテゴリ
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div
      class="row items-center q-px-xl q-pb-xs q-mb-md bg-white full-width"
      :class="i === 0 ? 'q-mt-lg' : ''"
      v-for="(category, i) in catList"
      :key="i"
    >
      <div
        class="row items-center parent bg-grey-200 full-width q-px-md q-py-sm cursor-pointer round-section-free-bg"
        @click="onRowClick(category)"
      >
        <div class="title3 bold col-lg-4 col-md-6 col-sm-6">
          {{ category.name_category }}
          <span class="caption1 regular text-grey-600 q-ml-md">{{
            '( ' + category.code_category + ' )'
          }}</span>
        </div>
        <div class="col-lg-8 col-md-6 col-sm-6">
          <span class="q-mr-md text-grey-600">用途</span>
          {{ flagsList(category) }}
        </div>
        <div v-if="category.memo_category" class="col-12 q-mt-xs text-grey-700">
          <span class="q-mr-md text-grey-600">メモ</span>
          {{ category.memo_category }}
        </div>
      </div>
      <div
        class="children flex items-center q-mt-md"
        v-if="category.children && category.children.length > 0"
      >
        <q-btn
          v-for="(child, n) in category.children"
          unelevated
          color="grey-200"
          text-color="grey-900"
          no-caps
          class="q-ml-md q-mb-md border-outline-600"
          :class="{ 'bg-grey-600 text-white': !child.flg_active }"
          :key="n"
          @click="onRowClick(child)"
          >{{ child.name_category }}
        </q-btn>
      </div>
      <div v-else class="text-grey-500 q-mt-sm">中分類は未設定です。</div>
    </div>
  </q-page>
</template>
