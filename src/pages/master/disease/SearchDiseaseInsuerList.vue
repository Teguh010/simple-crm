<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateDiseaseInsurerModal from './UpdateDiseaseInsurerModal.vue'
import mtUtils from '@/utils/mtUtils'
import useInsuranceStore from '@/stores/insurances'
import useDiseasesInsuredStore from '@/stores/diseasesInsured'
import { storeToRefs } from 'pinia'
import useCategoryStore from '@/stores/categories'
import MtTable2 from '@/components/MtTable2.vue'

const InsuranceStore = useInsuranceStore()
const { getInsurers } = storeToRefs(InsuranceStore)

const DiseasesInsuredStore = useDiseasesInsuredStore()
const { getDiseasesInsured, getNextPage } = storeToRefs(DiseasesInsuredStore)
const categoryStore = useCategoryStore()
const search_input_text = ref('')
const page = ref(1)
const diseasInsurerList = ref<any>([])
const tableElement = ref(null)
const tableHeight = ref(0)

const columns = [
  {
    name: 'name_insurer',
    label: '保険会社',
    field: 'name_insurer',
    align: 'left',
    style: 'width: 20%'
  },
  {
    name: 'id_category2',
    label: '分類',
    field: 'id_category2',
    align: 'left',
    style: 'width: 20%'
  },
  {
    name: 'multiple_field',
    label: '傷病名',
    field: 'multiple_field',
    align: 'left',
    style: 'width: 80%'
  }
]

const openAddModal = async () => {
  await mtUtils.smallPopup(UpdateDiseaseInsurerModal)
}

const onRowClick = async (data: any) => {
  let row: any = {}
  getInsurers.value.forEach((insurer) => {
    if (insurer.diseases_insured.length) {
      insurer.diseases_insured.forEach((diseaseIns: any) => {
        if (data.id_disease_insurer === diseaseIns.id_disease_insurer) {
          row = diseaseIns
        }
      })
    }
  })
  if (row && Object.keys(row).length && Object.keys(row).length > 0) {
    await mtUtils.smallPopup(UpdateDiseaseInsurerModal, { data: row })
  }
}

const search = async () => {
  if (search_input_text.value !== '') {
    await DiseasesInsuredStore.fetchDiseasesInsured({
      name_disease_insurance: search_input_text.value
    })
    await init()
    // await categoryStore.fetchCategories()
  }
}

const init = async () => {
  if (getDiseasesInsured.value) {
    diseasInsurerList.value = getDiseasesInsured.value
    tableHeight.value = tableElement?.value?.offsetHeight
  }
}

const handleScroll = async (value: any) => {
  const scrollHeight = ((tableHeight.value - 100) * 70) / 100
  const currentTarget = (scrollHeight / 2) * page.value
  if (value?.position?.top > currentTarget) {
    page.value += 1
    await DiseasesInsuredStore.fetchDiseasesInsured({
      page: page.value
    })
    if (getDiseasesInsured.value) {
      diseasInsurerList.value.push(...getDiseasesInsured.value)
    }
  }
}

const fetchIdCategory2 = (id_category2: any) => {
  const categories = categoryStore.getAllCategories
  for (let c = 0; c < categoryStore.getAllCategories.length; c++) {
    if (categories[c].id_category == id_category2) {
      return `${categories[c].name_category} / ${categories[c].code_category}`
    }
  }
  return ''
}

onMounted(async () => {
  await Promise.all([
    DiseasesInsuredStore.fetchDiseasesInsured(),
    categoryStore.fetchCategories(),
    InsuranceStore.fetchInsurers(),
  ])
  await init()
  search()
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          保険傷病一覧
        </q-toolbar-title>
        <MtInputForm
          type="text"
          outlined
          lable="保険傷病"
          v-model="search_input_text"
          autofocus
          @keydown.enter="search"
          tabindex="1"
        />
        <q-btn
          @click="search()"
          unelevated
          color="accent-800"
          text-color="white"
          class="q-mx-sm"
          tabindex="2"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />保険傷病
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <span ref="tableElement">
      <MtTable2
        :columns="columns"
        :rows="diseasInsurerList"
        :rowsBg="true"
        class="custody-table q-pt-sm"
        :style="{ height: 'calc(100vh - 90px)', boxShadow: 'none' }"
        flat
        no-data-message="登録がありません。"
        no-result-message="該当のデータが見つかりませんでした"
        :virtualScroll="getNextPage ? handleScroll : null"
      >
        <template v-slot:row="{ row }">
          <td
            v-for="(col, index) in columns"
            @click="onRowClick(row)"
            class="cursor-pointer"
          >
            <div v-if="col.field == 'name_insurer'">
              <div
                style="
                  width: 100%;
                  word-wrap: break-word;
                  white-space: pre-wrap;
                  word-break: break-word;
                "
                class="caption1 regular text-grey-700 ellipsis-2-lines"
              >
                {{ '保険企業CD' + row.code_clinic }}
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
                {{ row.name_insurer }}
              </div>
            </div>
            <div v-if="col.field == 'id_category2'">
              {{
                row.id_category2 == null
                  ? ''
                  : fetchIdCategory2(row.id_category2)
              }}
            </div>
            <div v-else-if="col.field === 'multiple_field'">
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
                    >疾患コード</span
                  >
                  {{ row.code_disease_insurance }}
                  <span class="caption1 regular text-grey-700 q-pr-xs q-ml-xs">
                    / 疾患名</span
                  >
                  {{ row.name_disease_insurance }}
                </div>
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </span>
  </q-page>
</template>
