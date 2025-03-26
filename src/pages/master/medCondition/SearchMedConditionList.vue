<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import UpdateCliCommonMedConditionModal from './UpdateCliCommonMedConditionModal.vue'
import mtUtils from '@/utils/mtUtils'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import useClinicStore from '@/stores/clinics'
import { CliCommon, ClinicType } from '@/types/types'
import { AxiosResponse } from 'axios'
import dayjs from 'dayjs'
import { typeMedConditionColor } from '@/utils/enum'

const cliCommonStore = useCliCommonStore()
const clinicStore = useClinicStore()
const getClinics = computed(() =>
  clinicStore.clinics.map((clinic: ClinicType) => ({
    value: clinic.id_clinic,
    label: clinic.name_clinic_display
  }))
)
const { getCliCommonMedConBcsList } = storeToRefs(cliCommonStore)
const route = useRoute()
const router = useRouter()
const pagination = ref({ rowsPerPage: 0 })

const columns = [
  {
    name: ' ',
    label: '',
    field: ' ',
    align: ' '
  },
  {
    name: 'code_cli_common',
    label: '評価名',
    field: 'code_cli_common',
    align: 'left'
  },
  {
    name: 'code_func1',
    label: '番号',
    field: 'code_func1',
    align: 'left'
  },
  {
    name: 'name_cli_common ',
    label: '選択肢',
    field: 'name_cli_common',
    align: 'left'
  },
  {
    name: 'text1',
    label: '相対評価',
    field: 'text1',
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
  code_cli_common: 201,
  code_func1: 1,
  type_unit_bit: null
})

const options = ref<{ label: string; value: number }[]>([])

const cliCommonOptionList: any = ref([])

const openAddModal = async (params = null) => {
  await mtUtils.smallPopup(UpdateCliCommonMedConditionModal, {
    id_clinic: search.value.id_clinic,
    lastCD: parseInt(
      cliCommonOptionList.value[cliCommonOptionList?.value?.length - 1]
        ?.code_func1
    ),
    code_cli_common: search.value.code_cli_common
  })
  init()
}
const onRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateCliCommonMedConditionModal, {
    commonObj: row,
    id_clinic: search.value.id_clinic,
    lastCD: parseInt(
      cliCommonOptionList?.value[cliCommonOptionList?.value?.length - 1]
        ?.code_func1
    )
  })
  init()
}

const setTypeMedCondition = (type: number) => {
  const findType = typeMedConditionColor.find((t) => t.value == type)
  return findType ? findType : ''
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
  const pullDownOptions: AxiosResponse<{ data: CliCommon[] }> =
    await cliCommonStore.fetchPreparationCliCommonList(
      {
        code_cli_common: [14],
        id_clinic: [search.value.id_clinic]
      },
      true
    )
  options.value = pullDownOptions.data.data.map((o) => {
    return {
      label: o.name_cli_common,
      value: parseInt(o.code_func1)
    }
  })
  if (response) {
    // filter data if med condition data has date_end > today's date
    const filteredData = response.data.data.filter((d) => {
      return dayjs(d.date_end).isAfter(dayjs())
    })

    cliCommonOptionList.value = [...filteredData]
  }
}

onMounted(async () => {
  await clinicStore.fetchClinics()
  await init()

  setPageTitle('診療評価')
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none justify-end">
        <q-toolbar-title class="title2 bold text-grey-900">
          診療評価 選択肢
        </q-toolbar-title>
        <div class="row">
          <div class="col-12">
            <div class="flex items-center">
              <q-btn
                outline
                class="q-ml-sm"
                color="grey-800"
                unelevated
                @click="router.push('/SearchMedEvaluationList')"
              >
                評価 項目
              </q-btn>
              <MtFormPullDown
                v-model:selected="search.code_cli_common"
                :options="options"
                class="q-mx-sm selection-field"
                outlined
                @update:selected="init()"
              />
              <form class="flex items-center no-wrap">
                <q-btn
                  color="grey-800"
                  text-color="white"
                  unelevated
                  @click="openAddModal()"
                >
                  <q-icon name="add" size="20px" />
                  選択肢
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
            @click="onRowClick(props.row)"
          >
            <div v-if="col.field === 'code_cli_common'">
              {{
                options.find((cli) => {
                  return cli.value === search.code_cli_common
                })?.label
              }}
            </div>
            <div
              v-else-if="col.field === 'text1' && props.row[col.field]"
              class="body1 regular text-grey-900"
            >
              <small
                class="q-br-5 q-px-xs"
                :style="`
                  background-color: ${
                    setTypeMedCondition(props.row[col.field]).backgroundColor
                  };
                  color: ${setTypeMedCondition(props.row[col.field]).color};
                    
                 
                `"
              >
                {{ setTypeMedCondition(props.row[col.field]).label }}
              </small>
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
