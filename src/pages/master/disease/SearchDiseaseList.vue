<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import useDiseaseStore from '@/stores/diseases'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import useCommonStore from '@/stores/common'
import useCategoryStore from '@/stores/categories'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import UpdateDiseaseModal from '@/pages/master/disease/UpdateDiseaseModal.vue'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { useQuasar } from 'quasar'

const commonStore = useCommonStore()
const diseaseStore = useDiseaseStore()
const categoryStore = useCategoryStore()
const { getDiseases } = storeToRefs(diseaseStore)
const { getCategories } = storeToRefs(categoryStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const $q = useQuasar()
const fileInput = ref(null)
const loading = ref(false)

const id_category1 = ref('')
const id_category2 = ref('')
const diseaseCat = ref([])
const diseaseList = ref([])
const diseaseCatDefault = reactive([])
const name_disease = ref('')
const id_cm_animal = ref()
const columns = [
  {
    name: 'name_disease',
    label: '傷病名',
    field: 'name_disease',
    align: 'left',
    style: 'width: 20%'
  },
  {
    name: 'category1',
    label: '傷病大分類',
    field: 'id_category1',
    align: 'left'
  },
  {
    name: 'category2',
    label: '中分類',
    field: 'id_category2',
    align: 'left'
  },
  {
    name: 'multiple_field',
    label: '主訴 / 検査 / 診断 / 治療方針',
    field: 'multiple_field',
    align: 'left'
  }
]

const openAddModal = async () => {
  diseaseStore.selectDisease(null)
  await mtUtils.mediumPopup(UpdateDiseaseModal)
  // search()
}
const onRowClick = async (data: any) => {
  await mtUtils.mediumPopup(UpdateDiseaseModal, { data })
  await search()
}
const refresh = ref(false)
const search = async () => {
  await diseaseStore.fetchDiseases({
    name_disease: name_disease.value === '' ? null : name_disease.value,
    id_cm_animal: id_cm_animal.value === 0 ? null : id_cm_animal.value,
    id_category1: id_category1.value === '' ? null : id_category1.value,
    id_category2: id_category2.value === '' ? null : id_category2.value,
    id_clinic: JSON.parse(localStorage.getItem('id_clinic'))
  })
  refresh.value = false
  diseaseList.value = [...getDiseases.value]
  refresh.value = true
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  const formData = new FormData()
  formData.append('file', file)
  loading.value = true
  diseaseStore
    .importDiseases(formData)
    .then((response) => {
      if (response) {
        $q.notify({
          type: 'positive',
          message: '傷病データを取り込みました！'
        })
      } else {
        $q.notify({
          type: 'negative',
          message: 'Err：傷病データの取り込みに失敗しました'
        })
      }
    })
    .catch((error) => {
      $q.notify({
        type: 'negative',
        message: 'Err：傷病データの取り込みに失敗しました'
      })
    })
    .finally(() => {
      loading.value = false
    })
}

const importCSV = async () => {
  fileInput.value.click()
}

const exportCSV = async () => {
  loading.value = true
  diseaseStore
    .exportDiseases()
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'diseases.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      $q.notify({
        type: 'positive',
        message: '傷病CSVデータを抽出しました'
      })
    })
    .catch((error) => {
      $q.notify({
        type: 'negative',
        message: 'Err：傷病データの抽出に失敗しました'
      })
    })
    .finally(() => {
      loading.value = false
    })
}

const category1Selected = async (value: any) => {
  id_category1.value = value
}

const category2Selected = async (value: any) => {
  id_category2.value = value
}

const categoryName = (id: string) => {
  const category = getCategories.value.find(
    (cat: any) => cat.id_category === id
  )
  return category ? category.name_category : ''
}

const init = () => {
  diseaseList.value = [...getDiseases.value]
  return diseaseList.value
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([
    // diseaseStore.fetchDiseases(),
    categoryStore.fetchCategories()
  ])
  const tempCat = getCategories.value
    .filter((cat) => {
      return cat.flg_for_disease && !cat.id_category_parent
    })
    .map((v) => {
      return {
        label: v.name_category,
        value: v.id_category
      }
    })

  diseaseCatDefault.push(...tempCat)
  diseaseCat.value = [...diseaseCatDefault]
  diseaseList.value = [...getDiseases.value]

  setPageTitle('傷病（疾患・診断）一覧')
})
</script>

<template>
  <div>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          傷病（疾患・診断）
        </q-toolbar-title>
        <MtCategorySelectionComponent
          :data="{ id_category1: id_category1, id_category2: id_category2 }"
          :flg_for_disease="true"
          :id_category1="id_category1"
          :id_category2="id_category2"
          outlined
          :prefix="'DS'"
          @category1Selected="category1Selected"
          @category2Selected="category2Selected"
        />
        <MtInputForm
          v-model="id_cm_animal"
          class="q-mx-sm"
          :items="getCommonTypeAnimalOptionList"
          label="動物種別"
          outlined
          type="selection"
        />
        <MtInputForm
          type="text"
          outlined
          label="傷病名"
          v-model="name_disease"
          autofocus
          tabindex="1"
        />
        <q-btn
          color="grey-100"
          class="q-mx-sm"
          outline
          text-color="primary"
          unelevated
          @click="importCSV"
          :disabled="loading"
        >
          <q-icon
            class="text-grey-500 q-mr-xs"
            name="cloud_upload"
            size="20px"
          />
          取込更新
        </q-btn>      
        <q-btn
          color="grey-100"
          outline
          text-color="primary"
          unelevated
          @click="exportCSV"
          :disabled="loading"
        >
          <q-icon
            class="text-grey-500 q-mr-xs"
            name="download"
            size="20px"
          />
          抽出
        </q-btn>      
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          style="display: none"
        />   
        <q-btn
          @click="search()"
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mx-sm"
          tabindex="2"
        >
          <q-icon name="search" size="20px" />
          検索
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon name="add" size="20px" />
          傷病
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="q-pt-sm">
      <MtTable2
        v-if="refresh"
        :columns="columns"
        :rows="diseaseList"
        :rowsBg="true"
        :style="{ height: 'calc(100vh - 90px)', boxShadow: 'none' }"
        flat
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            :key="index"
            @click="onRowClick(row)"
            class="cursor-pointer"
          >
            <div v-if="col.field == 'name_disease'">
              <div
                style="
                  width: 100%;
                  word-wrap: break-word;
                  white-space: pre-wrap;
                  word-break: break-word;
                "
                class="caption1 regular text-grey-700 ellipsis-2-lines"
              >
                {{ row.name_kana_disease }}
              </div>
              <div
                style="
                  width: 100%;
                  word-wrap: break-word;
                  white-space: pre-wrap;
                  word-break: break-word;
                "
                class="body1 regular text-grey-900 ellipsis-2-lines"
              >
                {{
                  row.flg_congenital
                    ? `先天性疾患 ${
                        row.name_disease
                          ? row.name_disease
                          : row.name_disease_free
                      }`
                    : row.name_disease
                    ? row.name_disease
                    : row.name_disease_free
                }}
              </div>
            </div>
            <div v-else-if="col.field == 'id_category1'">
              <div
                style="
                  width: 100%;
                  word-wrap: break-word;
                  white-space: pre-wrap;
                  word-break: break-word;
                "
                class="body1 regular text-grey-900 ellipsis-2-lines"
              >
                {{ categoryName(row.id_category1) }}
              </div>
            </div>
            <div v-else-if="col.field == 'id_category2'">
              <div
                style="
                  width: 100%;
                  word-wrap: break-word;
                  white-space: pre-wrap;
                  word-break: break-word;
                "
                class="body1 regular text-grey-900 ellipsis-2-lines"
              >
                {{ categoryName(row.id_category2) }}
              </div>
            </div>
            <div v-else-if="col.field == 'multiple_field'">
              <div auto-width class="body1 regular text-grey-900">
                <div
                  style="
                    width: 100%;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                    word-break: break-word;
                  "
                  class="flex items-center ellipsis-2-lines"
                >
                  <span class="caption1 regular text-grey-700 q-pr-xs"
                    >主訴</span
                  >
                  {{ row.memo_symptoms }}
                  <span class="caption1 regular text-grey-700 q-pr-xs q-ml-xs">
                    / 検査</span
                  >
                  {{ row.memo_inspection }}
                  <span class="caption1 regular text-grey-700 q-pr-xs q-ml-xs">
                    / 診断</span
                  >{{ row.memo_diagnosis }}
                  <span class="caption1 regular text-grey-700 q-pr-xs q-ml-xs">
                    / 治療方針</span
                  >{{ row.memo_plan }}
                </div>
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
</style>
