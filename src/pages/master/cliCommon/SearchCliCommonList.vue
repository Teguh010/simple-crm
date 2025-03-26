<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import useCliCommonStore from '@/stores/cli-common'
import UpdateCliCommonModal from '@/pages/master/cliCommon/UpdateCliCommonModal.vue'
import mtUtils from '@/utils/mtUtils'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { codeCliCommonList } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
import { ClinicType } from '@/types/types'
import MtToolTipsSmall from '@/components/toolTips/MtToolTipsSmall.vue'
import { menuHelperContents } from '@/utils/menuHelperContents'

const CODE_CLI_COMMON_TO_APPLY = [10, 11, 17, 18, 19, 20, 21, 22, 23, 24, 25]
const cliCommonStore = useCliCommonStore()
const clinicStore = useClinicStore()
const getClinics = computed(() => clinicStore.clinics.map((clinic: ClinicType) => ({value: clinic.id_clinic, label: clinic.name_clinic_display})))
const { getCliCommonOptionList } =
  storeToRefs(cliCommonStore)
const route = useRoute()
const router = useRouter()
const pagination = ref({rowsPerPage: 0})

const columns = [
  {
    name: 'code_cli_common',
    label: 'CODE',
    field: 'code_cli_common',
    align: 'left',
    style: 'width: 100px'
  },
  {
    name: 'name_cli_common ',
    label: '項目名',
    field: 'name_cli_common',
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
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number,
  code_cli_common: 1,
  code_func1: 1,
  type_unit_bit: null
})

const cliCommonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.mediumPopup(UpdateCliCommonModal, {
    id_clinic: search.value.id_clinic
  })
  init()
}
const onRowClick = async (row: any) => {
  await mtUtils.mediumPopup(UpdateCliCommonModal, {
    commonObj: row,
    id_clinic: search.value.id_clinic
  })
  init()
}

const init = async () => {
  cliCommonOptionList.value = []
  const response = await cliCommonStore.fetchPreparationCliCommonList(
    { code_cli_common: [search.value.code_cli_common], id_clinic: [search.value.id_clinic] },
    true
  )
  if (response) {
    cliCommonOptionList.value = [
      ...cliCommonStore.getCliCommonOptionList
      // .filter(
      //   (v: any) => v.id_clinic == search.value.id_clinic
      // )
    ]
  }
  console.log('cliCommonOptionList.value :>> ', cliCommonOptionList.value);
  // if (search.value.id_clinic) {
  //   router.replace({ query: { id_clinic: search.value.id_clinic } })
  // } else {
  //   router.replace({ name: 'SearchCliCommonList' })
  // }
}

const openHelpMenu = async () => {
  await mtUtils.smallPopup(MtToolTipsSmall, {
    title: menuHelperContents.cliCommonList.title,
    content: menuHelperContents.cliCommonList.content,
  })
}

onMounted(async () => {
  // search.value.id_clinic =
  //   route.query.id_clinic && !isNaN(Number(route.query.id_clinic))
  //     ? Number(route.query.id_clinic)
  //     : 1

  await clinicStore.fetchClinics()
  await init()

  setPageTitle('主要マスタ')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900 mobile-hide">
          病院マスタ
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <!-- <MtFormPullDown
                v-model:selected="search.id_clinic"
                :options="getClinics"
                class="q-mr-sm selection-field"
                outlined
                @update:selected="init()"
              /> -->
               <MtFormPullDown
                v-model:selected="search.code_cli_common"
                :options="codeCliCommonList"
                class="q-mr-sm selection-field"
                outlined
                @update:selected="init()"
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
                  病院マスタ
                </q-btn>
              </form>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="body1 regular text-grey-700">
        表示：<span class="q-ml-sm"> {{ cliCommonOptionList.length }} 件</span>
      </div>
    </div>
    <q-table
      :columns="columns"
      :rows="cliCommonOptionList"
      :rowsBg="true"
      :style="{ height: 'calc(100vh - 90px)' }"
      flat
      :rows-per-page-options="[0]"
      hide-bottom
      v-model:pagination="pagination"
    >
      <template v-slot:header="props">
        <q-tr :props="props" class="sticky-header">
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" class="cursor-pointer">
          <q-td
            v-for="(col, index) in props.cols"
            :style="col.style"
            @click="onRowClick(props.row)"
          >
            <div v-if="col.field === 'text1'">
              <q-icon
                v-if="
                  CODE_CLI_COMMON_TO_APPLY.includes(search.code_cli_common) &&
                  props.row[col.field]
                "
                size="25px"
                name="circle"
                :color="props.row[col.field]"
              />
              <span v-else>{{ props.row[col.field] }}</span>
            </div>
            <div v-else class="body1 regular text-grey-900">
              {{ props.row[col.field] }}
            </div>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </q-page>
</template>

<style lang="scss" scoped>
.tableBox {
  margin-top: 20px;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}
</style>
