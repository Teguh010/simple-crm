<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import useCategoryStore from '@/stores/categories'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { typeCategoryLayer } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import { CliCommon } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'

const props = defineProps({
  categoryLabel: String,
  data: Object,
  isNew: { default: false, required: true },
  updatedFlg: { default: false, required: false }
})

const categoryForm = reactive({
  id_category_parent: '',
  code_category: '',
  name_category: null,
  type_category_layer: '',
  memo_category: null,
  flg_for_medicine: false,
  flg_for_service: false,
  flg_for_disease: false,
  flg_for_task: false,
  flg_for_food: false,
  flg_for_item: false,
  flg_for_other: false,
  flg_for_lab: false,
  flg_approval_required: false,
  flg_active: false,
  flg_disable: false,
  display_order: null,
  type_department: null,
  id_category: null,
  id_clinic: null
})

const emits = defineEmits(['close'])
const categoryStore = useCategoryStore()
const cliCommonStore = useCliCommonStore()
const parentCategoriesOption: any = ref([])
const parentCategoriesDefault: any = reactive([])
const parentRawCategories: any = ref([])
const { getCliCommonTypeDepartmentList } = storeToRefs(cliCommonStore)
const typeDeptList = ref([])
const myForm = ref(null)
const isEdit = ref(false)

const getCategories = computed(() => categoryStore.getAllCategories)

async function init() {
  categoryForm.type_category_layer = ''
  categoryForm.id_category_parent = ''
}

function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      categoryForm[key] = data[key]
    }
  }
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
            categoryStore
              .destroyCategory(categoryForm.id_category)
              .then(async () => {
                await mtUtils.autoCloseAlert(aahMessages.success)
                await categoryStore.fetchPreparationCategories()
                props.updatedFlg.value = true
                emits('close')
              })
          }
        })
    }
  }
}

const submit = () => {
  if (props.data && props.data.id_category) {
    categoryStore
      .updateCategory(categoryForm.id_category, categoryForm)
      .then(() => {
        // categoryStore.fetchCategories({});
        // categoryStore.fetchPreparationCategories()
        props.updatedFlg.value = true
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    categoryForm.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    categoryStore.submitCategory(categoryForm).then(() => {
      // await categoryStore.fetchCategories({});
      // await categoryStore.fetchPreparationCategories()
      props.updatedFlg.value = true
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

function selectedTypeCategoryLayer(value: any) {
  if (value == '1') {
    categoryForm.id_category_parent = ''
  }
  if (value == '2') {
    parentCategoriesOption.value = getCategories.value.filter(
      (item: any) =>
        item?.parentCategory == 1 && item?.value != categoryForm.id_category
    )
  }
}

function selectedParentCategory(value: any) {
  if (categoryForm.id_category_parent) {
    let parentCategory: any = parentRawCategories.value.find(
      (parentCategoryObj: any) => {
        return parentCategoryObj.id_category == categoryForm.id_category_parent
      }
    )
    if (parentCategory) {
      categoryForm.flg_approval_required = parentCategory.flg_approval_required
      categoryForm.flg_for_disease = parentCategory.flg_for_disease
      categoryForm.flg_for_food = parentCategory.flg_for_food
      categoryForm.flg_for_item = parentCategory.flg_for_item
      categoryForm.flg_for_medicine = parentCategory.flg_for_medicine
      categoryForm.flg_for_service = parentCategory.flg_for_service
      categoryForm.flg_for_other = parentCategory.flg_for_other
      categoryForm.flg_for_task = parentCategory.flg_for_task
      categoryForm.flg_for_lab = parentCategory.flg_for_lab
      categoryForm.type_department = parentCategory.type_department
    }
  }
}

const closeModal = () => {
  emits('close')
}

const isParent = () => {
  return categoryForm.type_category_layer == '1'
}

const handleDisplayOrder = (value: string | number) => {
  if (!value) categoryForm.display_order = null
}

const handleDisableBtn = () => {
  if (isParent()) {
    if (!categoryForm.flg_for_medicine && !categoryForm.flg_for_service && !categoryForm.flg_for_disease &&
      !categoryForm.flg_for_task && !categoryForm.flg_for_food && !categoryForm.flg_for_item && !categoryForm.flg_for_other) {
      return true
    } else {
      return false
    }
  } else {
    false
  }
}

const isIntersecting = (item, propsFlgs) => {
  const flgs = {
    flg_for_disease: item.flg_for_disease,
    flg_for_food: item.flg_for_food,
    flg_for_item: item.flg_for_item,
    flg_for_lab: item.flg_for_lab,
    flg_for_medicine: item.flg_for_medicine,
    flg_for_other: item.flg_for_other,
    flg_for_service: item.flg_for_service,
    flg_for_task: item.flg_for_task
  };

  for (let key in flgs) {
    if (flgs[key] && propsFlgs[key]) {
      return true;
    }
  }
  return false;
};

onMounted(async () => {
  typeDeptList.value = getCliCommonTypeDepartmentList.value.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))
  categoryStore.fetchPreparationCategories()
  parentRawCategories.value = getCategories.value

  const propsFlgs = {
    flg_for_disease: props.data.flg_for_food,
    flg_for_food: props.data.flg_for_food,
    flg_for_item: props.data.flg_for_item,
    flg_for_lab: props.data.flg_for_lab,
    flg_for_medicine: props.data.flg_for_medicine,
    flg_for_other: props.data.flg_for_other,
    flg_for_service: props.data.flg_for_service,
    flg_for_task: props.data.flg_for_task
  }

  const parent = getCategories.value.filter(
    (item: any) =>
    item?.parentCategory == 1 && item?.value != categoryForm.id_category
  ).filter((data) => isIntersecting(data, propsFlgs));

  parentCategoriesOption.value.length = 0
  parentCategoriesDefault.length = 0
  parentCategoriesOption.value = [...parent]
  parentCategoriesDefault.push(...parentCategoriesOption.value)

  if (!props?.data?.id_category) {
    // Create Case
    isEdit.value = false
    categoryForm.type_category_layer = '1'
    assignPageData(props.data)
  } else {
    isEdit.value = true
    assignPageData(props.data)
  }
})

const showSelectedCategoryLayer = (value: string) => {
  return typeCategoryLayer.find((item) => item.value == value)?.label
}

const showParentCategory = (id: string) => {
  const parentCategories = getCategories.value.filter(
    (item: any) =>
      item?.parentCategory == 1 && item?.value != categoryForm.id_category && item?.value == id
  );
  
  return parentCategories[0]?.label
}

</script>

<template>
  <q-form ref="myForm" @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        カテゴリ {{ props.categoryLabel }}
      </q-toolbar-title>
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtFormPullDown
            v-if="! categoryForm.flg_disable"
            v-model:selected="categoryForm.type_category_layer"
            v-model:options="typeCategoryLayer"
            required
            :rules="[aahValidations.validationSelection]"
            label="分類区分 *"
            @update:selected="(value) => selectedTypeCategoryLayer(value)"
            :handleClear="init"
          />
          <p v-else>
            <label class="text-bold">分類区分: </label> {{showSelectedCategoryLayer(categoryForm.type_category_layer)}}
          </p>
        </div>
        <div v-if="categoryForm.type_category_layer == '2'" class="col-lg-6 col-md-6 col-sm-6">
          <MtFilterSelect
            v-if="! categoryForm.flg_disable"
            label="紐づける大分類 *"
            v-model:selecting="categoryForm.id_category_parent"
            v-model:options="parentCategoriesOption"
            :options-default="parentCategoriesDefault"
            required
            :rules="[aahValidations.validationSelection]"
            @selected="(event) => selectedParentCategory(event)"
          />
          <p v-else>
            <label class="text-bold"> 紐づける大分類:</label> {{showParentCategory(categoryForm.id_category_parent)}}
          </p>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-if="! categoryForm.flg_disable"
            v-model="categoryForm.name_category"
            required
            :rules="[aahValidations.validationRequired]"
            label="カテゴリ名 *"
            type="text"
          />
          <p v-else>
            <label class="text-bold">カテゴリ名:</label> {{categoryForm.name_category}}
          </p>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-if="! categoryForm.flg_disable"
            v-model="categoryForm.code_category"
            :readonly="isEdit"
            label="カテゴリCD"
            type="text"
          />
          <p v-else>
            <label class="text-bold">カテゴリ名:</label> {{categoryForm.code_category}}
          </p>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12">
          <MtInputForm
            v-model="categoryForm.memo_category"
            label="補足説明（メンテナンス用）"
            type="text"
            autogrow
          />
        </div>
      </div>
      <!-- <hr class="light" />
      <div class="q-mt-lg">
        <h4 class="text-white bg-grey-600 title4">カテゴリの使用ケース</h4>
        <p class="caption1 regular text-grey-700 q-my-md">
          大分類の設定条件を中分類に適用：以下で指定したケースでこの分類を使用します。
        </p>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_item"
            :disable="!isParent()"
            :items="[{ label: '商品管理' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_medicine"
            :disable="!isParent()"
            :items="[{ label: '処方・医薬品' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_food"
            :disable="!isParent()"
            :items="[{ label: 'フード・サプリ' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_service"
            :disable="!isParent()"
            :items="[{ label: 'サービス' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_disease"
            :disable="!isParent()"
            :items="[{ label: '疾患・傷病' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_task"
            :disable="!isParent()"
            :items="[{ label: 'タスク' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_lab"
            :items="[{ label: '臨床検査' }]"
            type="checkbox"
            disable
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="categoryForm.flg_for_other"
            :disable="!isParent()"
            :items="[{ label: 'その他' }]"
            type="checkbox"
          />
        </div>
      </div> -->
      <!-- Display the below section only when flg for task is true -->
      <div v-if="categoryForm.flg_for_task" class="q-mb-lg">
        <hr class="light q-mt-md q-mb-md" />
        <div class="q-mt-lg q-mb-md">
          <h4 class="text-white bg-grey-600 title4">
            タスク用カテゴリの追加設定
          </h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{ isEdit ? '' : 'このカテゴリがタスクで選択された際の初期値設定を行います。' }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <!--<div v-if="false" class="col-12">
            <p class="caption1 regular text-grey-700 q-my-none">
            {{ isEdit ? '' : '繰り返しタスクを作成する際の親カテゴリの場合に使用します。' }}
            </p>
          </div>
          <div v-if="false" class="col-4 q-pt-md">
            <MtInputForm
              :disable="!categoryForm.flg_for_task || !isParent()"
              v-model="categoryForm.flg_repetitive"
              :items="[{ label: '繰り返しタスク' }]"
              type="checkbox"
            />
          </div>-->
          <div class="col-12">
            <p class="caption1 regular text-grey-700 q-my-none">
            {{ isEdit ? '開始前の承認設定' : '本カテゴリの選択時、該当タスクはタスク開始前の『承認』が必要なタスクと設定されます。' }}
            </p>
          </div>
          <div class="col-4 q-pt-md">
            <MtInputForm
              :disable="!categoryForm.flg_for_task || !isParent()"
              v-model="categoryForm.flg_approval_required"
              :items="[{ label: '承認必須（※タスク専用）' }]"
              type="checkbox"
            />
          </div>
          <div class="col-12">
            <p class="caption1 regular text-grey-700 q-my-none">
            {{ isEdit ? '対応部署の設定' : 'このカテゴリが選択された際の対応部署の初期値を設定してください。' }}
            </p>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-6 q-pt-xs">
            <MtFormPullDown
            type="selection"
            v-model:selected="categoryForm.type_department"
            label="タスク部署"
            :options="typeDeptList"
            :disable="!isParent()"
            />
          </div>
        </div>
      </div>
      <hr class="light q-mt-md q-mb-md" />
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-6">
            <MtInputForm
              v-model="categoryForm.flg_active"
              :items="[{ label: '使用中' }]"
              type="checkbox"
            />
          </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-model="categoryForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
            @update:modelValue="handleDisplayOrder"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated :disable="handleDisableBtn()">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style lang="scss" scoped>


</style>
