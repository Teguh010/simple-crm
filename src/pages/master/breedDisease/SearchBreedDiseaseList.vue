<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import UpdateBreedDisease from './UpdateBreedDiseaseModal.vue'
import useBreedStore from '@/stores/breeds'
import useDiseaseStore from '@/stores/diseases'
import useCategoryStore from '@/stores/categories'
import mtUtils from '@/utils/mtUtils'
import useBreedDiseaseStore from '@/stores/breed-disease'
import { storeToRefs } from 'pinia'
import MtLabel from '@/components/MtLabel.vue'
import MtTable2 from '@/components/MtTable2.vue'
import useCommonStore from '@/stores/common'
import { setPageTitle } from '@/utils/pageTitleHelper'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { menuHelperContents } from '@/utils/menuHelperContents'

const commonStore = useCommonStore()
const breedDiseaseStore = useBreedDiseaseStore()
const breedStore = useBreedStore()
const diseaseStore = useDiseaseStore()
const categoryStore = useCategoryStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
// const { getBreedDiseases } = storeToRefs(breedDiseaseStore)

  const _breedDiseases = computed(() => breedDiseaseStore.breed_disease)

// const { getBreeds } = storeToRefs(breedStore)
const _Breeds = computed(() => breedStore.allBreeds)

const { getDiseases } = storeToRefs(diseaseStore)

const id_disease = ref('')
const id_breed = ref(null)
const flg_ac_odds_applied = ref(false)

const allDiseaseList = ref([])
const allDiseaseListDefault = reactive([])

const allBreedsList = ref([])
const allBreedsListDefault = reactive([])

const columns = [
  {
    name: 'id_cm_animal',
    label: '動物種別',
    field: 'id_cm_animal',
    align: 'left'
  },
  { name: 'id_breed', label: 'ペット品種', field: 'id_breed', align: 'left' },
  {
    name: 'id_disease',
    label: '疾患・診断名',
    field: 'id_disease',
    align: 'center'
  },
  {
    name: 'flg_ac_odds_applied',
    label: 'ACオッズ比適',
    field: 'flg_ac_odds_applied',
    align: 'center'
  },
  {
    name: 'flg_all_life_stage',
    label: '年齢ステージ',
    field: 'flg_all_life_stage',
    align: 'center'
  },
  { name: 'empty', label: '', field: 'empty', align: 'center' }
]

const typeAnimalName = (value: any) => getCommonTypeAnimalOptionList.value.find((v) => v.value === value)
const typeBreedName = (value: any) => _Breeds.value.find((v: any) => v.id_breed === value)
const typeDiseaseName = (value: any) => getDiseases.value.find((v: any) => v.id_disease === value)

const openAddModal = async () => {
  breedDiseaseStore.selectBreedDisease(null)
  await mtUtils.mediumPopup(UpdateBreedDisease)
}

const onRowClick = async (data: any) => {
  await mtUtils.mediumPopup(UpdateBreedDisease, { data })
}
const search = () => {
  let filter = {
    id_disease: id_disease.value,
    id_breed: id_breed.value
  }
  if (flg_ac_odds_applied.value) {
    filter.flg_ac_odds_applied = true
  }
  filter.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  breedDiseaseStore.fetchBreedDiseases(filter)
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.employeeList.title,
    content: menuHelperContents.employeeList.content,
  })
}

onMounted(() => {
  allDiseaseList.value = [...diseaseStore.getAllDiseases]
  allDiseaseListDefault.push(...diseaseStore.getAllDiseases)

  // allBreedsList.value = [...breedStore.getAllBreeds]
  // allBreedsListDefault.push(...breedStore.getAllBreeds)

  allBreedsList.value = [...allBreedsList.value]
  allBreedsListDefault.push(...allBreedsList.value)

  breedDiseaseStore.fetchBreedDiseases()
  breedStore.fetchBreeds()
  categoryStore.fetchCategories()
  diseaseStore.fetchDiseases()

  setPageTitle('品種別疾患相関一覧')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          品種別疾患相関一覧 
        </q-toolbar-title>
        <MtFilterSelect
          :options-default="allDiseaseListDefault"
          v-model:options="allDiseaseList"
          v-model:selecting="id_disease"
          label="傷病名"
          outlined
        />
        <MtFilterSelect
          :options-default="allBreedsListDefault"
          v-model:options="allBreedsList"
          label="ペット品種"
          v-model:selecting="id_breed"
          outlined
          class="q-mx-md"
        />
        
        <q-btn dense flat round @click="openHelpMenu">
          <q-icon size="24px" name="help_outline" />
        </q-btn>
        <q-btn
          @click="search"          
          unelevated
          color="accent-800"
          text-color="white"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="openAddModal()"         
          unelevated
          text-color="white"
          color="primary"
          class="q-mx-md"
        >
          <q-icon size="20px" name="add" />品種別疾患相関
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      :columns="columns"
      :rows="_breedDiseases"
      :rowsBg="true"
      class="custody-table q-pt-sm"
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
            v-if="col.field == 'id_cm_animal'"
            class="body1 regular text-grey-900"
          >
            {{ typeAnimalName(row['id_cm_animal'])?.label }}
          </div>
          <div
            v-if="col.field == 'id_breed'"
            class="body1 regular text-grey-900"
          >
            {{ typeBreedName(row['id_breed'])?.code_breed }}
            {{ typeBreedName(row['id_breed'])?.name_breed }}
          </div>
          <div
            v-if="col.name == 'id_disease'"
            class="body1 regular text-grey-900"
          >
            {{ typeDiseaseName(row['id_disease'])?.name_disease ? typeDiseaseName(row['id_disease'])?.name_disease : typeDiseaseName(row['id_disease'])?.name_disease_free }}
          </div>
          <div v-if="col.field == 'flg_ac_odds_applied'">
            <q-icon
              size="8px"
              v-if="row['flg_ac_odds_applied']"
              name="circle"
            />
          </div>
          <div v-if="col.field == 'flg_all_life_stage'">
            <q-icon size="8px" v-if="row['flg_all_life_stage']" name="circle" />
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
