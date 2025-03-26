<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable from '@/components/MtTable.vue'
import useCommonStore from '@/stores/common'
import UpdateCommonModal from '@/pages/master/common/UpdateCommonModal.vue'
import mtUtils from '@/utils/mtUtils'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahValidations from '@/utils/aahValidations'
import { codeCommonList, typeUnitBit } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { menuHelperContents } from '@/utils/menuHelperContents'
import { isDateOutOfToday } from '@/utils/aahUtils'

const CODE_COMMON_TO_APPLY = [1, 10, 11, 17, 18, 19, 20, 21, 22, 23, 24, 25]
const commonStore = useCommonStore()
const { getCommonOptionList, getCommonTypeAnimalOptionList } =
  storeToRefs(commonStore)
const route = useRoute()
const router = useRouter()

const columns = [
  {
    name: 'code_common',
    label: 'CODE',
    field: 'code_common',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'name_common ',
    label: '項目名',
    field: 'name_common',
    align: 'left'
  },
  {
    name: 'flg_func1',
    label: '機能1',
    field: 'flg_func1',
    align: 'left'
  },
  {
    name: 'code_func1',
    label: '機能CD1',
    field: 'code_func1',
    align: 'left'
  },
  {
    name: 'text1',
    label: '機能名1',
    field: 'text1',
    align: 'left'
  },
  {
    name: 'flg_func2',
    label: '機能2',
    field: 'flg_func2',
    align: 'left'
  },
  {
    name: 'code_func2',
    label: '機能CD2',
    field: 'code_func2',
    align: 'left'
  },
  {
    name: 'text2',
    label: '機能名2',
    field: 'text2',
    align: 'left'
  },
  {
    name: 'comment',
    label: '説明',
    field: 'comment',
    align: 'left'
  },
  {
    name: 'display_order',
    label: '表示順',
    field: 'display_order',
    align: 'left'
  }
]

const search = ref({
  code_common: 1,
  code_func1: 1,
  type_unit_bit: null
})

const animalType = ref<
  {
    label: string
    value: string
  }[]
>([])

const commonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.mediumPopup(UpdateCommonModal, {
    code_common: search.value.code_common
  })
  await init()
}
const onRowClick = async (row: any) => {
  await mtUtils.mediumPopup(UpdateCommonModal, {
    commonObj: row,
    code_common: search.value.code_common
  })
  await init()
}

function isBitSet(number: any, bitValue: any) {
  return (number & bitValue) === bitValue
}

function selectedTypeUnitBit(value: any) {
  commonOptionList.value = []
  if (!search.value.type_unit_bit) {
    commonOptionList.value = [...commonStore.getCommonOptionList]
    return
  }
  commonOptionList.value = commonStore.getCommonOptionList.filter(
    (common: any) => isBitSet(parseInt(common.code_func1), value)
  )
}

function selectedBreedOption() {
  commonOptionList.value = []
  if (!search.value.code_func1) {
    commonOptionList.value = [...commonStore.getCommonOptionList]
    return
  }
  commonOptionList.value = commonStore.getCommonOptionList.filter(
    (common: any) => common.code_func1 == search.value.code_func1
  )
}

const init = async () => {
  commonOptionList.value = []
  const response = await commonStore.fetchPreparationCommonList(
    { code_common: [search.value.code_common] },
    true
  )
  if (response) {
  commonOptionList.value = [
    ...commonStore.getCommonOptionList.filter(
      (v: any) => v.code_common == search.value.code_common
    )
  ]
}
  if (search.value.code_common == 2) {
    selectedBreedOption()
  }
  if (search.value.code_common) {
    router.replace({ query: { code_common: search.value.code_common } })
  } else {
    router.replace({ name: 'SearchCommonList' })
  }
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.commonList.title,
    content: menuHelperContents.employeeList.content
  })
}

onMounted(async () => {
  search.value.code_common =
    route.query.code_common && !isNaN(Number(route.query.code_common))
      ? Number(route.query.code_common)
      : 1

  await init()
   router.replace({ query: { code_common: search.value.code_common } })
  animalType.value = getCommonTypeAnimalOptionList.value.map((animal) => {
    return {
      label: animal.name_common,
      value: animal.code_func1
    }
  })

  setPageTitle('主要マスタ')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          主要マスタ
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormPullDown
                v-model:selected="search.code_common"
                :options="codeCommonList"
                class="q-mr-sm selection-field"
                outlined
                @update:selected="init()"
              />
              <!--Display this below only when showing "Breed" records -->
              <MtFormPullDown
                v-if="search.code_common == 2"
                v-model:selected="search.code_func1"
                :options="animalType"
                class="q-mr-sm selection-field"
                outlined
                @update:selected="selectedBreedOption"
              />
              <MtFormPullDown
                v-if="search.code_common == 4"
                v-model:selected="search.type_unit_bit"
                :options="typeUnitBit"
                :rules="[aahValidations.validationRequired]"
                label="共通CD"
                outlined
                @update:selected="selectedTypeUnitBit"
              />

              <q-btn dense flat round @click="openHelpMenu">
                <q-icon size="24px" name="help_outline" />
              </q-btn>
              <form class="flex items-center no-wrap">
                <q-btn
                  class="q-ml-sm"
                  color="grey-800"
                  text-color="white"
                  unelevated
                  @click="openAddModal()"
                >
                  <q-icon name="add" size="20px" />
                  主要マスタ
                </q-btn>
              </form>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        検索結果：<span class="q-ml-sm"> {{ commonOptionList.length }} 件</span>
      </div>
    </div>
    <MtTable
      :columns="columns"
      :rows="commonOptionList"
      :rowsBg="true"
      :style="{ height: 'calc(100dvh - 90px)' }"
      flat
    >
      <template v-slot:row="{ row, index, columns }">
        <q-td
          v-for="(col, index) in columns"
          :style="col.style"
          class="cursor-pointer"
          @click="onRowClick(row)"
          :class="{
            outOfDateBG: isDateOutOfToday(row.date_start, row.date_end)
          }"
        >
          <div v-if="col.field === 'text1'">
            <q-icon
              v-if="
                CODE_COMMON_TO_APPLY.includes(search.code_common) &&
                row[col.field]
              "
              size="25px"
              name="circle"
              :color="row[col.field]"
            />
            <span v-else>{{ row[col.field] }}</span>
          </div>
          <div v-else class="body1 regular text-grey-900">
            {{
              col.field === 'name_common' &&
              isDateOutOfToday(row.date_start, row.date_end)
                ? `期間外 ${row[col.field]}`
                : row[col.field]
            }}
          </div>
        </q-td>
      </template>
    </MtTable>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}
</style>
