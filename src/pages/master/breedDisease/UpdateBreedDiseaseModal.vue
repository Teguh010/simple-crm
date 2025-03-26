<script setup lang="ts">
import { onMounted, ref, reactive, computed } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useBreedStore from '@/stores/breeds'
import useBreedDiseaseStore from '@/stores/breed-disease'
import useDiseaseStore from '@/stores/diseases'
import useCategoryStore from '@/stores/categories'
import { storeToRefs } from 'pinia'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCommonStore from '@/stores/common'

const props = defineProps({ data: Object })

const data = ref({
  id_category_for_disease: null,
  id_cm_animal: null,
  id_breed: null,
  id_disease: null,
  flg_all_life_stage: false,
  flg_child_adult: false,
  flg_adult_senior: false,
  flg_ac_odds_applied: false,
  age_most_frequent: null,
  ac_odds_disease: null,
  ac_odds_category: null,
  memo_influencing_factors: null,
  odds: null,
  display_order: null,
  id_clinic: null
})

const emits = defineEmits(['close'])
const breedStore = useBreedStore()
const breedDiseaseStore = useBreedDiseaseStore()
const diseaseStore = useDiseaseStore()
const categoryStore = useCategoryStore()
const commonStore = useCommonStore()

const allBreeds = computed(() => breedStore.allBreeds)

const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const allCategoryList = ref<any[]>([])
const allCategoryListDefault = reactive<any[]>([])

const getAllBreedsList = ref<any[]>([])
const getAllBreedsListDefault = reactive<any[]>([])

const allDiseaseList = ref([])
const allDiseaseListDefault = reactive([])

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
            breedDiseaseStore
              .destroyBreedDisease(data.value.id_breed_disease_rel)
              .then(() => {
                breedDiseaseStore.fetchBreedDiseases()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const closeModal = () => {
  emits('close')
}

const submit = () => {
  if (props.data) {
    breedDiseaseStore
      .updateBreedDisease(data.value.id_breed_disease_rel, data.value)
      .then(() => {
        breedDiseaseStore.fetchBreedDiseases()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    breedDiseaseStore.submitBreedDisease(data.value).then(() => {
      breedDiseaseStore.fetchBreedDiseases()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

onMounted(() => {
  allCategoryList.value = [...categoryStore.getAllCategories]
  allCategoryListDefault.push(...categoryStore.getAllCategories)

  // getAllBreedsList.value = [...breedStore.getAllBreeds]
  // getAllBreedsListDefault.push(...breedStore.getAllBreeds)

  getAllBreedsList.value = [...allBreeds.value]
  getAllBreedsListDefault.push(...allBreeds.value)

  allDiseaseList.value = [...diseaseStore.getAllDiseases]
  allDiseaseListDefault.push(...diseaseStore.getAllDiseases)

  categoryStore.fetchPreparationCategories(true)
  if (props.data?.id_breed_disease_rel) {
    // Update case
    data.value = { ...props.data }
  } else {
    // Create case
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        品種別疾患マスタ
      </q-toolbar-title>
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-4">
          <MtFilterSelect
            :options-default="allCategoryListDefault"
            v-model:options="allCategoryList"
            v-model:selecting="data.id_category_for_disease"
            label="カテゴリID*"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
        <div class="col-4">
          <MtFilterSelect
            :options-default="allDiseaseListDefault"
            v-model:options="allDiseaseList"
            v-model:selecting="data.id_disease"
            label=""
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
        <div class="col-4">
          <MtFormPullDown
            type="selection"
            v-model:selected="data.id_cm_animal"
            label="動物種別*"
            :options="getCommonTypeAnimalOptionList"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
        <div class="col-4">
          <MtFilterSelect
            :options-default="getAllBreedsListDefault"
            v-model:options="getAllBreedsList"
            v-model:selecting="data.id_breed"
            label="ペット品種ID*"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '全年齢対象', value: 1 }]"
            v-model="data.flg_all_life_stage"
            required
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '生後～中年齢', value: 1 }]"
            v-model="data.flg_child_adult"
            required
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '中年齢～高齢', value: 1 }]"
            v-model="data.flg_adult_senior"
            required
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: 'ACオッズ比適用', value: 1 }]"
            v-model="data.flg_ac_odds_applied"
            required
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.age_most_frequent"
            label="AC傷病：最頻値年齢"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.ac_odds_disease"
            label="AC傷病：オッズ値"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.ac_odds_category"
            label="Anicom社請求割合"
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="data.memo_influencing_factors"
            label="影響要因"
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-4">
          <MtInputForm type="text" v-model="data.odds" label="オッズ値" />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.display_order"
            label="表示順序（0~999; 小を上位表示）"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
