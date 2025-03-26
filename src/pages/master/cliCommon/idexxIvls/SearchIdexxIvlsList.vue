<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
// import UpdateCliCommonIdexxIvlsModal from './UpdateCliCommonIdexxIvlsModal.vue'
// import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
import useIdexxStore from '@/stores/idexx'
import mtUtils from '@/utils/mtUtils'

const cliCommonStore = useCliCommonStore()
const clinicStore = useClinicStore()
const idexxStore = useIdexxStore()
const { getCliCommonIVLS } = storeToRefs(cliCommonStore)
const pagination = ref({ rowsPerPage: 0 })

const columns = [
  {
    name: ' ',
    label: ' ',
    field: ' ',
    align: ' ',
    style: ' '
  },
  {
    name: 'code_func1',
    label: 'シリアル番号',
    field: 'code_func1',
    align: 'left'
  },
  {
    name: 'name_cli_common ',
    label: '表示名',
    field: 'name_cli_common',
    align: 'left'
  }
]

const search = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number,
  code_cli_common: 15,
  code_func1: 1,
  type_unit_bit: null
})

const cliCommonOptionList: any = ref([])

// const onRowClick = async (row: any) => {
//   await mtUtils.smallPopup(UpdateCliCommonIdexxIvlsModal, {
//     commonObj: row,
//     id_clinic: search.value.id_clinic
//   })
//   init()
// }

const triggerIvls = async () => {
  const clinicData = JSON.parse(localStorage.getItem('clinic'))

  if (clinicData && Object.keys(clinicData).length > 0 && Boolean(clinicData.clinic.idexx_source_id)) {
    let idexx_source_id = clinicData.clinic.idexx_source_id
    await idexxStore.updateDatasetIdexx({ idexx_source_id })
    if (idexxStore.getRecentIdexx?.id_cli_common?.length > 0) mtUtils.autoCloseAlert('IDEXX シリアル番号を更新しました')
    else mtUtils.autoCloseAlert('Error : IDEXXソースIDの登録が不正です。')
  }
}

const init = async () => {
  cliCommonOptionList.value = []
  const response = await cliCommonStore.fetchPreparationCliCommonList(
    {
      code_cli_common: [search.value.code_cli_common],
      id_clinic: [search.value.id_clinic]
    },
    true
  )
  if (response) {
    cliCommonOptionList.value = [...getCliCommonIVLS.value]
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('IDEXX IVLS')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          IDEXX IVLS
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <form class="flex items-center no-wrap">
                <q-btn
                  class="q-ml-sm"
                  color="grey-800"
                  text-color="white"
                  unelevated
                  @click="triggerIvls"
                >
                  <q-icon name="sync" size="20px" />
                  更新
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
      <!-- <div class="caption1 regular text-danger">
        <q-icon name="warning" />
        マスタデータの為、責任者のみ編集可能です。
      </div> -->
    </div>
    <q-table
      :columns="columns"
      :rows="cliCommonOptionList"
      :rowsBg="true"
      :style="{ height: 'calc(100dvh - 90px)' }"
      flat
      :rows-per-page-options="[0]"
      hide-bottom
      v-model:pagination="pagination"
    >
      <template v-slot:header="props">
        <q-tr :props="props" class="sticky-header">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props" class="cursor-pointer">
          <q-td
            v-for="(col, index) in props.cols"
            :style="col.style"
          >
            <!-- <div v-if="col.field === 'text1'">
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
            </div> -->
            <div class="body1 regular text-grey-900">
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
