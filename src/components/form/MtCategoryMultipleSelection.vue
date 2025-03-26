<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from 'vue'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import MtFilterMultipleSelect from '@/components/form/MtFilterMultipleSelect.vue'
import { sortBy } from 'lodash'

const categoryStore = useCategoryStore()
const { getCategories } = storeToRefs(categoryStore)

const emit = defineEmits([
  'category1Selected',
  'category2Selected',
  'hide',
  'category1',
  'category2'
])

const props = withDefaults(
  defineProps<{
    data: Object
    flg_for_disease?: boolean
    flg_for_food?: boolean
    flg_for_item?: boolean
    flg_for_medicine?: boolean
    flg_for_other?: boolean
    flg_for_service?: boolean
    flg_for_task?: boolean
    outlined?: boolean
    full_width?: boolean
    col_class?: string
    multiple?: boolean
    rules?: any
    prefix?: string
    prefixCondition?: string // and / or
    id_category1?: string | number // and / or
    id_category2?: string | number // and / or
    disable?: boolean,
    flg_specific_category: boolean
    specific_category_list: any[]
  }>(),
  {
    flg_for_disease: false,
    flg_for_food: false,
    flg_for_item: false,
    flg_for_medicine: false,
    flg_for_other: false,
    flg_for_service: false,
    flg_for_task: false,
    outlined: false,
    full_width: false,
    col_class: '',
    multiple: false,
    prefix: '',
    prefixCondition: 'or',
    id_category1: '',
    id_category2: '',
    disable: false,
    flg_specific_category: false,
    specific_category: []
  }
)

const parentCategory: any = ref([])
const parentCategoryDefault: any = reactive([])
const subCategory: any = ref([])
const subCategoryDefault: any = reactive([])

const isCat = ref(false)

const id_category1 = ref(props.id_category1)
const id_category2 = ref(props.id_category2)

const selectedCategory = async (value: any) => {
  if (value) {
    isCat.value = true
    await categoryStore.fetchSubCategories(value)
    subCategory.value.length = 0
    subCategoryDefault.length = 0
    subCategory.value = [...categoryStore.getAllSubCategories]
    subCategoryDefault.push(...categoryStore.getAllSubCategories)
  } else {
    isCat.value = false
  }
  emit('category1Selected', id_category1.value)
}

async function selectedMultipleCategory(value: any) {
  if (value) {
    if (value && value.length === 0) return
    isCat.value = true
    await categoryStore.fetchSubCategories(value, {
      id_category_list: JSON.stringify(value)
    })
    subCategory.value.length = 0
    subCategoryDefault.length = 0
    subCategory.value = [...categoryStore.getAllSubCategories]
    subCategoryDefault.push(...categoryStore.getAllSubCategories)
  } else {
    isCat.value = false
  }
  emit('category1Selected', id_category1.value)
}

const handleMultipleCategory2 = (value) => {
  if (value) {
    const name_category2 = subCategoryDefault.find(
      (item) => item.value == value
    )?.label
    emit('category2', name_category2)
  }
  emit('category2Selected', id_category2.value)
}

const handleCategory = (value) => {
  if (value == null) {
    isCat.value = false
    id_category2.value = []
    return
  }
  if (value) {
    id_category2.value = []
    const name_category1 = parentCategoryDefault.find(
      (item) => item.value == value
    )?.label
    emit('category1', name_category1)
  }
}
const handleCategory2 = (value) => {
  if (value) {
    const name_category2 = subCategoryDefault.find(
      (item) => item.value == value
    )?.label
    emit('category2', name_category2)
  }
  emit('category2Selected', id_category2.value)
}

const filterCategory = (prefix: string) => {
  let filteredCategory = [] 
  if (
    categoryStore.getAllCategories &&
    categoryStore.getAllCategories.length > 0
  ) {
    const sortCategory = sortBy(categoryStore.getAllCategories, [
      'display_order'
    ])
    filteredCategory = sortCategory.filter((i) => {
      if (props.prefixCondition.toLowerCase() === 'and') {
        // When prefix condition is an 'and', it will cut all categories that not have the same prefix.
        return (
          i?.parentCategory === 1 &&
          ((props.flg_for_task && i.flg_for_task) ||
            (props.flg_for_service && i.flg_for_service) ||
            (props.flg_for_disease && i.flg_for_disease) ||
            (props.flg_for_item && i.flg_for_item) ||
            (props.flg_for_other && i.flg_for_other) ||
            (props.flg_for_food && i.flg_for_food) ||
            (props.flg_for_medicine && i.flg_for_medicine)) &&
          prefix !== '' &&
          i.code_category.startsWith(prefix)
        )
      } else {
        // When prefix condition is an 'or', it will added all categories that have the same prefix.
        return (
          i?.parentCategory === 1 &&
          ((props.flg_for_task && i.flg_for_task) ||
            (props.flg_for_service && i.flg_for_service) ||
            (props.flg_for_disease && i.flg_for_disease) ||
            (props.flg_for_item && i.flg_for_item) ||
            (props.flg_for_other && i.flg_for_other) ||
            (props.flg_for_food && i.flg_for_food) ||
            (props.flg_for_medicine && i.flg_for_medicine) ||
            (prefix !== '' && i.code_category.startsWith(prefix)))
        )
      }
    })

    if (props.flg_specific_category) {
      filteredCategory.filter((i) => props.specific_category_list.includes(i.code_category))
    }

    console.log(filteredCategory)
    
    parentCategory.value.length = 0
    parentCategoryDefault.length = 0
    parentCategory.value = [...filteredCategory]
    parentCategoryDefault.push(...parentCategory.value)
  }
}

watch(
  () => props.data.id_category1,
  (nowValue, oldValue) => {
    if (!nowValue) {
      isCat.value = false
      id_category2.value = []
      id_category1.value = []
      emit('category1Selected', null)
    }
  }
)
watch(
  () => props.data.id_category2,
  (nowValue, oldValue) => {
    if (!nowValue) {
      id_category2.value = []
      emit('category2Selected', null)
    }
  }
)
watch(
  () => props.prefix,
  (nowValue, oldValue) => {
    parentCategory.value = []
    Object.assign(parentCategoryDefault, [])
    filterCategory(nowValue)
  }
)

onMounted(() => {
  isCat.value = true
  filterCategory(props.prefix)
})
</script>

<template>
  <div
    v-if="multiple"
    :class="props.full_width ? 'full-width' : 'q-col-gutter-md'"
    class="row"
  >
    <div
      :class="props.full_width ? 'col-12' : col_class ? col_class : 'col-auto'"
    >
      <MtFilterMultipleSelect
        v-model="id_category1"
        v-model:options="parentCategory"
        :options-default="parentCategoryDefault"
        :outlined="props.outlined"
        :rules="props.rules"
        label="大分類"
        @selected="selectedMultipleCategory"
        @update:modelValue="handleCategory"
      />
    </div>
    <div
      v-if="isCat"
      :class="
        props.full_width ? 'col-12 q-mt-md' : col_class ? col_class : 'col-auto'
      "
    >
      <MtFilterMultipleSelect
        v-model="id_category2"
        v-model:options="subCategory"
        :options-default="subCategoryDefault"
        :outlined="props.outlined"
        :readonly="id_category1 == '' || id_category1 == null"
        :rules="props.rules"
        label="中分類"
        @selected="handleMultipleCategory2"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
