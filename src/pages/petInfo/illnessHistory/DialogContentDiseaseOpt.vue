<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { sortBy, uniq } from 'lodash'

// Stores
import useCategoryStore from '@/stores/categories'
import useDiseaseStore from '@/stores/diseases'

const emits = defineEmits([
  'onSubmit',
  'onCancel',
  'onClose',
  'close',
  'submit'
])

// * Disease Opt Module
type DiseaseOptObjType = {
  id_disease?: number
  label: string
  value: null | number
  childs?: DiseaseOptObjType[] | null
}
const diseaseOptArr = ref<DiseaseOptObjType[]>([])

const diseaseStore = useDiseaseStore()
const sortedDiseaseList = computed(() => {
  return sortBy(
    diseaseStore.getListDisease.filter(
      (disease: { flg_quick_illness_history: boolean }) => !disease.flg_quick_illness_history
    ),
    'display_order'
  )
}
)

const categoryStore = useCategoryStore()
const getAllCategories = computed(() => categoryStore.getAllCategories)

const onSelectedDisease = (itemDisease: DiseaseOptObjType) => {
  emits('submit', itemDisease)
  emits('close')
  // Usage for Quasar Plugin - Dialog
  // emits('onSubmit', itemDisease)
}

// * Search Disease Module
const searchDiseaseModel = ref('')
// Filtered data based on search query
const filteredData = computed(() => {
  if (!searchDiseaseModel.value) {
    return diseaseOptArr.value // If no search query, return the original data
  }

  // Filter logic
  const search = (items: DiseaseOptObjType[]): DiseaseOptObjType[] => {
    return items
      .map((item: DiseaseOptObjType) => {
        // Filter children
        const filteredChildren = item.childs ? search(item.childs) : []

        // Include parent if it matches or has matching children
        if (
          item.label
            .toLowerCase()
            .includes(searchDiseaseModel.value.toLowerCase()) ||
          filteredChildren.length
        ) {
          return {
            ...item,
            childs: filteredChildren.length ? filteredChildren : null // Keep children only if they match
          }
        }

        return null // Exclude non-matching items
      })
      .filter((item) => item !== null) // Remove null values
  }

  return search(diseaseOptArr.value)
})

// Top Common Disease Module
const topFiftyDiseaseList = ref<DiseaseOptObjType[]>([])
const addTopFiftyDiseaseList = () => {
  topFiftyDiseaseList.value = sortedDiseaseList.value.filter(
    (disease: { display_order: number }) => {
      return disease.display_order && disease.display_order <= 50
    }
  )
  if (topFiftyDiseaseList.value.length > 0) {
    diseaseOptArr.value.push({
      label: 'よくある傷病',
      value: null,
      childs: [
        ...topFiftyDiseaseList.value.map((item: DiseaseOptObjType) => {
          return {
            label: item.label,
            value: item.value
          }
        })
      ]
    })
  }
}

const addDiseaseListByCategory = () => {
  // Disease by Category Module
  const majorCategoryIdList = uniq(
    sortedDiseaseList.value.map((diseaseItem: { id_category1: number }) => {
      return diseaseItem.id_category1
    })
  )

  const orderMap = Object.fromEntries(
    getAllCategories.value.map(({ id_category, display_order }) => [
      id_category,
      display_order
    ])
  )
  majorCategoryIdList.sort(
    (a, b) => (orderMap[a] ?? Infinity) - (orderMap[b] ?? Infinity)
  )

  if (majorCategoryIdList.length > 0) {
    const topItemIdDisease = [
      ...topFiftyDiseaseList.value.map((topItem) => topItem.id_disease)
    ]
    for (let index = 0; index < majorCategoryIdList.length; index++) {
      const categoryListId = majorCategoryIdList[index]

      const category = getAllCategories.value.find((itemCategory) => {
        return itemCategory.id_category === categoryListId
      })

      if (category) {
        const diseaseByCategory: DiseaseOptObjType[] = []
        sortedDiseaseList.value.forEach(
          (disease: {
            id_disease: number
            id_category1: number
            label: string
            value: number
          }) => {
            if (
              disease.id_category1 === categoryListId &&
              !topItemIdDisease?.includes(disease.id_disease)
            ) {
              diseaseByCategory.push({
                label: disease.label,
                value: disease.value
              })
            }
          }
        )

        diseaseOptArr.value.push({
          label: category.label,
          value: category.value,
          childs: [...diseaseByCategory]
        })
      }
    }
  }
}

const init = () => {
  addTopFiftyDiseaseList()
  addDiseaseListByCategory()
}

// * onMounted Initialization
onMounted(async () => {
  await categoryStore.fetchPreparationCategories()
  init()
})
</script>

<template>
  <q-card class="column full-height">
    <q-card-section full-width class="q-px-md q-py-sm q-bb bg-grey-4 row items-center">
      <q-input v-model="searchDiseaseModel" class="col-grow" label="傷病名・診断名" autofocus>
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
      <div class="q-pl-md q-pr-xs">
        <q-btn flat round dense icon="close" @click="emits('close')" />
      </div>
    </q-card-section>
    <q-scroll-area class="col-grow" visible>
      <q-card-section class="q-px-md">
        <section>
          <div v-for="(itemCategory, index) in filteredData" :key="index" class="row q-mb-md">
            <div class="col-12 text-h5 text-weight-bold q-mb-sm">
              {{ itemCategory.label }}
            </div>
            <div v-for="(itemDisease, index) in itemCategory.childs" :key="index" class="col-3 q-pa-sm row">
              <q-btn outline class="col" @click="onSelectedDisease(itemDisease)">
                <span>{{ itemDisease.label }}</span>
              </q-btn>
            </div>
          </div>
        </section>
      </q-card-section>
    </q-scroll-area>
    <q-card-actions class="q-bt q-pa-md modal-btn" align="center">
      <q-btn class="q-px-xl" outline label="閉じる" @click="emits('close')" />
    </q-card-actions>
  </q-card>
</template>

<style scoped></style>
