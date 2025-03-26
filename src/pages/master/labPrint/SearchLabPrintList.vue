<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateLabPrintButtonNameModal from './UpdateLabPrintButtonNameModal.vue'
import UpdateLabPrintLabListModal from './UpdateLabPrintLabListModal.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'

import {
  LabPrint,
  LabSet,
  LabDevice
} from '@/types/types'

import useLabPrintStore from '@/stores/lab-prints'
import useCategoryStore from '@/stores/categories'
import useCommonStore from '@/stores/common'
import { sortBy } from 'lodash'

const labPrintStore = useLabPrintStore()
const categoryStore = useCategoryStore()
const commonStore = useCommonStore()

const { getLabPrints } = storeToRefs(labPrintStore)

const labPrintCols = ref([]), labPrintRows = ref([])

const addParentRecord = () => {
  mtUtils.smallPopup(UpdateLabPrintButtonNameModal, {
    callback: fetchLabPrintRecords
  })
}

const addChildRecord = () => {
  mtUtils.mediumPopup(UpdateLabPrintLabListModal, {
    callback: fetchLabPrintRecords
  })  
}

const fetchLabPrintRecords = async () => {
  labPrintRows.value.length = 0
  await labPrintStore.fetchLabPrints()
  labPrintRows.value.push(...getLabPrints.value)
  labPrintRows.value = sortBy(labPrintRows.value, 'display_order')
}

const openParentRecord = (row: LabPrint) => {
  mtUtils.smallPopup(UpdateLabPrintButtonNameModal, {
    idLabPrint: row.id_lab_print,
    labPrint: row,
    callback: fetchLabPrintRecords
  })
}

const openChildRecord = (row: LabPrint) => {
  mtUtils.mediumPopup(UpdateLabPrintLabListModal, {
    idLabPrint: row.id_lab_print,
    callback: fetchLabPrintRecords
  })
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([
    fetchLabPrintRecords(),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB1_' }, 'LB1'),
    commonStore.fetchPreparationCommonList({ code_common: [7] }, true)
  ])
})
</script>
<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 mobile-margin">
          検査結果 出力テンプレート
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <q-btn color="primary" class="q-mr-md" @click="addParentRecord" >
                <q-icon name="add" class="q-mr-sm"/>
                出力ボタン名
              </q-btn>
              <q-btn color="primary" @click="addChildRecord" >
                <q-icon name="add" class="q-mr-sm"/>
                出力検査項目
              </q-btn>
            </div>
          </div>
        </div>  
      </q-toolbar>
    </MtHeader>
    <div class="q-mt-md q-px-md">
      <MtTable2
        :columns="labPrintCols"
        :rows="labPrintRows"
        :rowsBg="true"
        :style="{ height: 'calc(100dvh - 90px)' }"
        flat
      >
        <template v-slot:row="{ row }">
          <td @click="openChildRecord(row)">
            <div class="flex justify-between">
              {{ row.name_button_lab_print }} ({{row.lab_print_items?.length}})
              <div><q-icon size="20px" class="cursor-pointer" name="edit" @click.stop="openParentRecord(row)" /></div>
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </q-page> 
</template>