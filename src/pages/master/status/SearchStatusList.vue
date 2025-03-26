<script setup lang="ts">
import { onMounted, ref, reactive, unref, toRaw } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateStatusModal from './UpdateStatusModal.vue'
import UpdateCliCommonTypeCategoryModal from '@/pages/master/cliCommon/typeCategory/UpdateCliCommonTypeCategoryModal.vue'
import mtUtils from '@/utils/mtUtils'
import useStatusStore from '@/stores/status'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import _ from 'lodash'
import useClinicStore from '@/stores/clinics'
import useCliCommonStore from '@/stores/cli-common'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { sortBy } from 'lodash'

const statusStore = useStatusStore()
const clinicStore = useClinicStore()
const cliCommonStore = useCliCommonStore()
const { getStatuses } = storeToRefs(statusStore)
const typeParent = ref(1)
const { getAllClinics } = storeToRefs(clinicStore)
const { getCliCommonTypeCategoryList } = storeToRefs(cliCommonStore)
const clinicId = ref(null)
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])
const typeCategoryChild = ref([])
const typeCategoryParent = ref([])
const cliCommonOptionList: any = ref([])

const statusOptions = [
  {
    parentType: 1,
    children: [
      { childrenType: 1 },
      { childrenType: 2 },
      { childrenType: 3 },
      { childrenType: 4 },
      { childrenType: 5 }
    ]
  },
  {
    parentType: 11,
    children: [{ childrenType: 10 }]
  },
  {
    parentType: 21,
    children: [{ childrenType: 20 }, { childrenType: 21 }]
  }
]

const onRowClick = async (data) => {
  await mtUtils.smallPopup(UpdateStatusModal, {
    data,
    statuses: unref(typeCategoryChild.value.map((c) => toRaw(c)))
  })
  search()
}

const openAddModal = async () => {
  await mtUtils.smallPopup(UpdateStatusModal, {
    statuses: unref(typeCategoryChild.value.map((c) => toRaw(c)))
  })
  await statusStore.fetchStatuses()
  await init()
}

const openChildTypeCategoryModal = async (value: any) => {
  const findTypeCategoryLabel = typeCategoryChildName(value)
  const findTypeCategory = cliCommonOptionList.value.find(
    (v) => v.label === findTypeCategoryLabel
  )

  await mtUtils.smallPopup(UpdateCliCommonTypeCategoryModal, {
    commonObj: findTypeCategory,
    id_clinic: JSON.parse(localStorage.getItem('id_clinic')!) as number
  })

  await fetchTypeCategory()
}

const search = (value: any) => {
  statusStore.fetchStatuses({
    id_clinic: value
  })
}

const fetchTypeCategory = async () => {
  await cliCommonStore.fetchPreparationCliCommonList(
    {
      code_cli_common: [20],
      id_clinic: [JSON.parse(localStorage.getItem('id_clinic')!) as number]
    },
    true
  )

  cliCommonOptionList.value = sortBy(
    getCliCommonTypeCategoryList.value,
    'code_func1'
  )

  typeCategoryParent.value = cliCommonOptionList.value
    .filter((v: any) => v.code_func1 && !v.code_func2)
    .map((v: any) => ({
      label: v.label,
      value: Number(v.code_func1)
    }))
  typeCategoryChild.value = cliCommonOptionList.value
    .filter((v: any) => v.code_func1 && v.code_func2)
    .map((v: any) => ({
      label: v.label,
      value: Number(v.code_func2),
      func1: Number(v.code_func1),
      bg:v.text1
    }))
}

const init = async () => {
  if (getAllClinics.value) {
    let allClinics = [] as any
    const noFacilityArr = clinicStore.getClinics.filter(
      (cli) => cli?.flg_facility === false
    )
    allClinics = getAllClinics.value.filter((clint) =>
      noFacilityArr.find((cli) => cli?.id_clinic == clint?.value)
    )
    allClinics.push({
      value: '',
      label: '共通'
    })
    allClinicList.value = [...allClinics]
    allClinicListDefault.push(...allClinics)
  }
}
const typeCategoryParentName = (value: any) =>
  typeCategoryParent.value.find((v) => v.value === value)?.label

const typeCategoryChildName = (value: any) =>
  typeCategoryChild.value.find((v) => v.value === value)?.label
  const typeCategoryChildColor = (value: any) =>
  typeCategoryChild.value.find((v) => v.value === value)?.bg

// const employeeName = (value) =>
// employeesStore.getAllEmployees.find((v) => v.value === value)?.label

const setAlways = (value: any) => {
  if (value === null) {
    typeParent.value = 1
  }
}

onMounted(async () => {
  await fetchTypeCategory()
  await clinicStore.fetchClinics()
  await statusStore.fetchStatuses()
  await init()
  // search()

  setPageTitle('院内ステータス')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          院内ステータス
        </q-toolbar-title>
        <MtFilterSelect
          :options-default="allClinicListDefault"
          v-model:options="allClinicList"
          v-model:selecting="clinicId"
          label="対象病院"
          @update:selecting="search"
        />
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
          class="q-ml-sm"
        >
          <q-icon size="16px" name="add" />ステータス
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center justify-between q-px-lg tableBox">
      <div class="text-grey-700">
        ステータスボードで使用する院内ステータスを管理します。<br />
        第二階層のステータス名は編集可能です（項目数は編集不可）。第三階層は自由に設定できます。
      </div>
    </div>
    <div
      class="row no-wrap items-start q-px-xl q-my-md q-pb-xs full-width q-mt-md"
    >
      <div
        v-for="(opt, index) in statusOptions"
        :key="index"
        :class="
          opt.parentType === 1
            ? 'max-width1'
            : opt.parentType === 11
            ? 'max-width2'
            : 'max-width3'
        "
      >
        <div class="q-ml-xs text-center">
          <div
            class="q-pa-xs full-width"
            :class="
              opt.parentType === 1
                ? 'bg-green-800 text-white'
                : opt.parentType === 11
                ? 'bg-accent-800 text-black'
                : 'bg-ticket1 text-white'
            "
          >
            <span>{{ typeCategoryParentName(opt.parentType) }}</span>
          </div>
          <div class="row no-wrap fit">
            <div
              class="full-width"
              v-for="child in sortBy(opt.children, 'display_order', 'asc')"
              :key="child.childrenType"
            >
              <div class="dotboreder full-width">
                <div
                  class="full-width q-pa-xs text-black cursor-pointer"
                  
                   :style="{ backgroundColor: typeCategoryChildColor(child.childrenType) }"
                  @click="openChildTypeCategoryModal(child.childrenType)"
                >
                  {{ typeCategoryChildName(child.childrenType) }}
                  <q-icon name="edit" class="q-ml-sm" />
                </div>
                <div
                  class="full-width"
                  v-for="(sts, i) in getStatuses"
                  :key="i"
                >
                  <div
                    v-if="
                      sts.type_category_parent === opt.parentType &&
                      sts?.type_category_child === child.childrenType
                    "
                    class="column justify-center items-center q-pa-sm"
                  >
                    <q-btn
                      unelevated
                      color="grey-200"
                      text-color="grey-900"
                      no-caps
                      class="fit border-outline-600"
                      :style="{
                        color: sts.color_code
                          ? `${sts.color_code} !important`
                          : 'inherit',
                        'background-color': sts.bg_color_code
                          ? `${sts.bg_color_code} !important`
                          : 'inherit'
                      }"
                      @click="onRowClick(sts)"
                    >
                      {{ sts?.name_status }}
                    </q-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.margin-top {
  margin-top: 50px !important;
}
.dotboreder {
  border-right: 1.5px dotted $grey-500;
}
.max-width1 {
  min-width: 62.5% !important;
  max-width: 62.5% !important;
}
.max-width2 {
  min-width: 12.5% !important;
  max-width: 12.5% !important;
}
.max-width3 {
  min-width: 25% !important;
  max-width: 25% !important;
}
.tableBox {
  margin-top: 20px;
}
</style>
