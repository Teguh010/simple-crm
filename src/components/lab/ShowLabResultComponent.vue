<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { orderBy, sortBy } from 'lodash'
import { date } from 'quasar'

// Utilities
import mtUtils from '@/utils/mtUtils'
import { dateFormat, formatDateWithTime, getCurrentPetAgeInMonth, getDateToday } from '@/utils/aahUtils'
import { LAB_CATEGORY_PARENT_ID } from '@/utils/constent'
import selectOptions from '@/utils/selectOptions'

// Stores
import useCategoryStore from '@/stores/categories'
import useCommonStore from '@/stores/common'
import useServiceDetailStore from '@/stores/service-details'

// Components
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
// Types
import { Category, Common } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'
import useCustomerStore from '@/stores/customers'

// Lazy-loaded Components
const CreateLabResultModal = defineAsyncComponent(() => import('./CreateLabResultModal.vue'))
const UpdateLabResultModal = defineAsyncComponent(() => import('./UpdateLabResultModal.vue'))


const props = defineProps({
  id_pet: String,
  id_service_detail: String,
  defaultYearPeriod: {
    type: String,
    default: 'last90days'
  },
  fixedFilter: {
    type: Boolean,
    default: false
  },
  showIdexxButton: {
    type: Boolean,
    default: false
  }
})
const categoryStore = useCategoryStore()
const commonStore = useCommonStore()
const serviceDetailStore = useServiceDetailStore()
const cliCommonStore = useCliCommonStore()
const customerStore = useCustomerStore()


const { getAllSubCategories } = storeToRefs(categoryStore)
const { getCommonDeviceOptionList } = storeToRefs(commonStore)
const { getPet } = storeToRefs(customerStore)

const showUnitRange = ref(false)

const illnessHistoryRef = ref()
const itemCheckList = ref({})
const dateCheckList = ref({})
const checklistData = ref({})

const groupedData = ref({})
const deviceCount = ref({})
const columnData = ref({})
const labData = ref({})
const deviceData = ref({})
const alreadyVisited = ref([])
const nextPage = ref(null)

const labResultListByPet = ref([])

const onEnterPress = () => { illnessHistoryRef.value.focus() }
const addingColumn = () => {
  groupedData.value = {}
  deviceCount.value = {}
  columnData.value = {}
  labData.value = {}
  deviceData.value = {}

  const petLabResult = labResultListByPet.value.map((v) => {
    const category = categoryStore.getAllCategories.find(c => c.id_category == v.id_category2_lab)
    return {
      ...v,
      datetime_registered: formatDateWithTime(v.datetime_registered),
      category
    }
  })
  const sortedLabResult = orderBy(petLabResult, ['datetime_registered', 'lab_set.display_order', 'lab_device.display_order', 'id_lab_result'], ['desc', 'asc', 'asc', 'asc'])
  const deviceIdMapping = {}
  let currentIndex = 0
  
  sortedLabResult.map((item) => {
    let lab_set_device
    if (item.id_cm_device && item.lab_device) lab_set_device = item.lab_device
    else lab_set_device = item.lab_set

    if (lab_set_device)
      return {
        ...item,
        lab_set_device: lab_set_device,
        lab: lab_set_device.lab ?? item.lab,
      }
    else return { ...item }
  }).forEach(item => {
    if (!deviceIdMapping.hasOwnProperty(item.id_cm_device)) deviceIdMapping[item.id_cm_device] = currentIndex++
    const deviceId = item.id_cm_device ? deviceIdMapping[item.id_cm_device] : item.id_category2_lb2

    if (!groupedData.value[item.id_category2_lab]) groupedData.value[item.id_category2_lab] = {}
    if (!checklistData.value[item.id_category2_lab]) checklistData.value[item.id_category2_lab] = {}
    if (!columnData.value[item.id_category2_lab]) columnData.value[item.id_category2_lab] = {}
    if (!labData.value[item.id_category2_lab]) labData.value[item.id_category2_lab] = {}
    if (!deviceCount.value[item.id_category2_lab]) deviceCount.value[item.id_category2_lab] = {}

    if (!groupedData.value[item.id_category2_lab][deviceId]) groupedData.value[item.id_category2_lab][deviceId] = {
      lab_set_type: item.id_cm_device ? 'lab-device' : (item.id_category2_lb2 ? 'lab-set' : 'lab-ref'),
      lr_value: {}
    }
    if (!labData.value[item.id_category2_lab][deviceId]) labData.value[item.id_category2_lab][deviceId] = []
    if (!checklistData.value[item.id_category2_lab][deviceId]) checklistData.value[item.id_category2_lab][deviceId] = { checked: false }
    if (!deviceCount.value[item.id_category2_lab][deviceId]) deviceCount.value[item.id_category2_lab][deviceId] = 0
    if (!deviceData.value[deviceId]) deviceData.value[deviceId] = item.id_cm_device
    if (!columnData.value[item.id_category2_lab][deviceId])
      columnData.value[item.id_category2_lab][deviceId] = [
        { name: 'name_lab', label: '項目', field: 'name_lab', align: 'left', width: '150px', order: 1 },
        { name: 'id_cm_unit', label: '単位', field: 'id_cm_unit', align: 'center', width: '60px', order: 2 },
        { name: 'range', label: '基準値', field: 'range', align: 'center', width: '80px', order: 3 },
      ]

    const date = formatDateWithTime(item.datetime_registered)

    if (!groupedData.value[item.id_category2_lab][deviceId].lr_value[date]) groupedData.value[item.id_category2_lab][deviceId].lr_value[date] = []
    if (!columnData.value[item.id_category2_lab][deviceId].find((v) => v.name === 'date' && formatDateWithTime(v.date) == date)) {
      columnData.value[item.id_category2_lab][deviceId].push({ name: 'date', label: date, date, field: 'date', align: 'center', colspan: '2', order: 4 })
      columnData.value[item.id_category2_lab][deviceId] = orderBy(columnData.value[item.id_category2_lab][deviceId], ['order', 'date'], ['asc', 'desc'])
    }

    groupedData.value[item.id_category2_lab][deviceId].lr_value[date].push(item)

    if(
      !labData.value[item.id_category2_lab][deviceId].find((v) => v.id_lab == item.id_lab) || 
      !groupedData.value[item.id_category2_lab][deviceId].lr_value[date].find(
        (v) => formatDateWithTime(v.datetime_registered) == date && (item.id_cm_device != null ? v.id_cm_device == item.id_cm_device : true) && v.id_lab == item.id_lab
      )
    ) {
      if (item.lab_set_device) {
        labData.value[item.id_category2_lab][deviceId].push({
          ...item.lab_set_device,
          lab_set_device: item.lab_set_device,
          ranges: {
            low_critical: item.low_critical,
            low: item.low,
            high: item.high,
            high_critical: item.high_critical
          }
        })
      } else {
        labData.value[item.id_category2_lab][deviceId].push({
          ...item,
          lab_set_device: { display_order: null },
          ranges: {
            low_critical: item.low_critical,
            low: item.low,
            high: item.high,
            high_critical: item.high_critical
          }
        })
      }

      labData.value[item.id_category2_lab][deviceId] = orderBy(
        labData.value[item.id_category2_lab][deviceId],
        ['lab_set_device.display_order', 'lab_device.display_order', 'lab_set.display_order']
      )
    }

    deviceCount.value[item.id_category2_lab][deviceId] += 1
  })
}

const openAddModal = async (data: Object | null = null) => {
  await mtUtils.popup(CreateLabResultModal, {id_pet: props.id_pet, additional: data})
  await init()
}
const onRowClick = async (col, id_category, id_device_category, lab_set_type) => {
  if (col.field === 'date') {
    await mtUtils.popup(UpdateLabResultModal, {
      id_pet: props.id_pet, date: col.date, id_category2_lab: id_category, id_device_category, lab_set_type
    })
    labResultListByPet.value = [];
    alreadyVisited.value = [];
    nextPage.value = null;
    await init();
  } else {
    return false
  }
}
const showValResult = (value: any, id_lab: number) => {
  if (value) {
    const findData = value.find(element => element.id_lab == id_lab)
    if (findData) {
      const v1 = findData.val_result?.toString()?.replace(',','')
      if (parseFloat(v1) > parseFloat(findData.high))
        return `<span class="q-ml-xs" style="color: red">${findData.val_result} <small>▲</small></span>`
      else if (parseFloat(v1) < parseFloat(findData.low))
        return `<span class="q-ml-xs" style="color: blue">${findData.val_result} <small>▼</small></span>`
      return findData.val_result
    }
  }
  return ''
}
const showQualifier = (value: any, id_lab: string) => {
  if (value) {
    const findData = value.find(element => element.id_lab == id_lab)
    if (findData) {
      return findData.qualifier ? findData.qualifier : findData.qualifier
    }
  }
  return ''
}
const typeLabUnitName = (value) => useCommonStore().getCommonUnitOptionList.find(item => item.id_common === value)?.name_common
const filter = async () => {
  let filters = {id_service_detail: props.id_service_detail}

  return filters
}
const updateCategoryCheckboxBar = (id_category: number, deviceIndex: number) => {
  checklistData.value[id_category][deviceIndex].checked = !checklistData.value[id_category][deviceIndex].checked
  updateCategoryCheckbox(checklistData.value[id_category][deviceIndex].checked, id_category, deviceIndex)
}
const updateCategoryCheckbox = (value: boolean, id_category: number, deviceIndex: number) => {
  if (value) {
    const dates = columnData.value?.[id_category]?.[deviceIndex].filter(col => col.field === 'date')
    if (!dateCheckList.value[id_category]) dateCheckList.value[id_category] = {}
    if (!itemCheckList.value[id_category]) itemCheckList.value[id_category] = {}

    if (!dateCheckList.value[id_category][deviceIndex]) dateCheckList.value[id_category][deviceIndex] = []
    if (!itemCheckList.value[id_category][deviceIndex]) itemCheckList.value[id_category][deviceIndex] = []

    dates.forEach(element =>
      Object.assign(dateCheckList.value[id_category][deviceIndex], {[element.date]: true})
    )
    labData.value[id_category][deviceIndex].forEach(element =>
      Object.assign(itemCheckList.value[id_category][deviceIndex], {[element.id_lab]: true})
    )
  } else {
    dateCheckList.value[id_category][deviceIndex] = {}
    itemCheckList.value[id_category][deviceIndex] = {}
  }
}
const getCategoryName = (id_category: number) => getAllSubCategories.value.find((item: Category) => item.id_category == id_category)?.name_category
const getDeviceName = (id: number, lab_set_type: string) => {
  if (lab_set_type == 'lab-device')
    return getCommonDeviceOptionList.value.find((item: Common) => item.id_common == id)?.name_common
  else if (lab_set_type == 'lab-set')
    return categoryStore.getCategoriesLB2.find((item: Category) => item.id_category == id)?.name_category
  else
    return cliCommonStore.getCliCommonOuterLabRef?.[0]?.name_cli_common
}

const init = async (filters: object | null = null) => {
  filters = await filter()
  await fetchMoreData1(false)
  addingColumn()
}

const fetchMoreData1 = async (fetchMore: boolean = true) => {
  await fetchMoreData(fetchMore)
}
const openIdexxUrl = async (lab_results) => {
  const lab_result = Object.values(lab_results)?.[0]
  if (lab_result) {
    await serviceDetailStore.fetchGetIdexxUrl(props.id_service_detail)

    if (serviceDetailStore.getIdexxUrl) window.open(serviceDetailStore.getIdexxUrl, '_blank')
    else mtUtils.autoCloseAlert('リンクが無効です。')
  }
}

async function fetchMoreData(fetchMore: boolean = true) {
  const filters = await filter()
  const filterData = {
    ...filters,
    id_pet: props.id_pet,
    id_customer: props?.id_customer,
    page: nextPage.value,
    // order_by: 'display_order'
  }

  if (fetchMore) {
    if (!nextPage.value) {
      await mtUtils.autoCloseAlert('条件内で全データを呼び出しました')
      return
    }
  }

  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, 'lab_results', filterData, true)

  if (response && response.data) {

    if (!alreadyVisited.value.includes(nextPage.value)) {
      labResultListByPet.value.push(...response.data)
      alreadyVisited.value.push(response.current)
    }
    if (response.next) {
      nextPage.value = response.next.split('page=')[1]

    } else {
      nextPage.value = null
    }
  }

}

defineExpose({
  fetchMoreData1
})

onMounted(async () => {
  const endDate = getDateToday()
  const startDate = dateFormat(date.adjustDate(new Date(endDate), {year: new Date(endDate).getFullYear(), month: 1, day: 1}))

  await Promise.all([
    cliCommonStore.fetchPreparationCliCommonList({code_cli_common: [19]}),
    commonStore.fetchPreparationCommonList({code_common: [7]}, true),
    categoryStore.fetchSubCategories(LAB_CATEGORY_PARENT_ID),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB2_' }, 'LB2'),
  ])

  await init()
})
</script>
<template>
  <div class="bg-white q-px-sm q-pb-md">
    <template v-for="(device, id_category) in groupedData">
      <div v-for="(lab_result, deviceIndex) in device">
        <div @click="updateCategoryCheckboxBar(id_category, deviceIndex)" class="cursor-pointer bg-grey-300 q-py-xs q-px-sm justify-between flex items-center">
          <div>
            {{ getCategoryName(id_category) }} ({{ labData[id_category][deviceIndex].length }})
            <MtFormCheckBox
              class="q-ml-sm"
              v-model:checked="checklistData[id_category][deviceIndex].checked"
              @update:checked="updateCategoryCheckbox($event, id_category, deviceIndex)"
            />
          </div>
          <div class="flex items-center">
            <div class="q-mr-sm">
              {{ deviceData[deviceIndex] ? 
                getDeviceName(deviceData[deviceIndex], lab_result.lab_set_type) : 
                (lab_result.lab_set_type == 'lab-ref' ?
                  getDeviceName(deviceData[deviceIndex], lab_result.lab_set_type) : '機器設定なし') }}
            </div>
            <q-btn
              unelevated
              color="primary"
              text-color="white"
              @click.stop="openAddModal({ id_category: id_category, device: deviceData[deviceIndex], lab_set_type: lab_result.lab_set_type })"
              dense
              class="q-px-md"
            >
              <q-icon name="add" size="12px" />
            </q-btn>
          </div>
        </div>
        <div class="flex justify-between items-end">
          <q-table
            :columns="columnData[id_category][deviceIndex]"
            :rows="labData[id_category][deviceIndex]"
            :rowsBg="true"
            class="my-sticky-header-column-table q-mb-lg"
            style="display: inline-block"
            flat
            hide-bottom
            :rows-per-page-options="[0]"
            :hide-pagination="true"
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
            <template v-slot:header="{ cols }">
              <q-tr>
                <template v-for="col in cols">
                  <template v-if="['id_cm_unit', 'range'].includes(col.field) && !showUnitRange"></template>
                  <q-th
                    v-else-if="col.field === 'date'"
                    :class="checklistData[id_category][deviceIndex].checked ? 'cursor-pointer' : ''"
                    @click="checklistData[id_category][deviceIndex].checked ? dateCheckList[id_category][deviceIndex][col.date] = !dateCheckList[id_category][deviceIndex][col.date] : ''"
                    style="width: 150px"
                    class="dark"
                  >
                    <MtFormCheckBox :keep-color="true" color="orange" v-if="checklistData[id_category][deviceIndex].checked" v-model:checked="dateCheckList[id_category][deviceIndex][col.date]" />
                    {{ formatDateWithTime(col.label, 'YYYY/MM/DD HH時') }}
                  </q-th>
                  <q-th v-else class="light">
                    {{ col.label }}
                  </q-th>
                </template>
              </q-tr>
            </template>
            <template v-slot:body="{ row, rowIndex }">
              <q-tr>
                <template v-for="col in columnData[id_category][deviceIndex]">
                  <template v-if="['id_cm_unit', 'range'].includes(col.field) && !showUnitRange"></template>
                  <q-td
                    v-else
                    :class="col.field === 'date' ? 'cursor-pointer' : ''"
                    @click="onRowClick(col, id_category, deviceData[deviceIndex], lab_result.lab_set_type)"
                  >
                    <div key="memo_internal">
                      <div
                        v-if="col.field === 'date'"
                      >
                        <div class="row">
                          <div class="col-6 text-center q-br">
                            {{ showQualifier(lab_result.lr_value[col.date], row.id_lab) }}
                          </div>
                          <div class="col-6 text-center">
                            <div
                              v-html="showValResult(lab_result.lr_value[col.date], row.id_lab)"
                            />
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'name_lab'">
                        <div
                          @click="checklistData[id_category][deviceIndex].checked ? itemCheckList[id_category][deviceIndex][row.id_lab] = !itemCheckList[id_category][deviceIndex][row.id_lab] : ''"
                          :class="checklistData[id_category][deviceIndex].checked ? 'cursor-pointer' : ''"
                          class="flex text-wrap items-center"
                        >
                          <MtFormCheckBox v-if="checklistData[id_category][deviceIndex].checked" v-model:checked="itemCheckList[id_category][deviceIndex][row.id_lab]" />

                          <div class="q-mr-md">
                            <b>
                              <template
                                v-if="row.lab && row?.lab?.name_lab_en != ''"
                              >
                                {{ row?.lab?.name_lab_en?.replace('%', ' ') }}
                              </template>
                              <template v-else>
                                {{ row?.name_lab_en?.replace('%', ' ') }}
                              </template>
                            </b>
                          </div>
                          <div>
                            <template
                              v-if="row.lab && row?.lab?.name_lab != ''"
                            >
                              {{
                                row?.lab?.name_lab_en == row?.lab?.name_lab
                                  ? ''
                                  : row?.lab?.name_lab
                              }}
                            </template>
                            <template v-else>
                              {{
                                row?.name_lab_en == row?.name_lab
                                  ? ''
                                  : row?.name_lab
                              }}
                            </template>
                          </div>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'id_cm_unit'">
                        {{ typeLabUnitName(row.id_cm_unit) }}
                      </div>
                      <div v-else-if="col.field === 'range'">
                        {{ col.ranges?.low }} ~ {{ col.ranges?.high }}
                      </div>
                      <div v-else class="body1 text-center regular text-grey-900">
                        {{ row[col.field] ? row[col.field] : '' }}
                      </div>
                    </div>
                  </q-td>
                </template>
              </q-tr>
            </template>
          </q-table>

          <div v-if="props.showIdexxButton" class="q-pb-md">
            <q-btn
              unelevated
              outline
              @click="openIdexxUrl(lab_result)"
            >
              IDEXX
              <q-icon name="open_in_new" class="q-pl-sm" size="14px" />
            </q-btn>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
<style lang="scss" scoped>
.q-table__card {
  border: 1px solid $grey-300;
}

.my-sticky-header-column-table td:nth-of-type(1), .my-sticky-header-column-table th:nth-of-type(1) {
  text-wrap: nowrap;
}

.my-sticky-header-column-table .dark {
  background-color: #424242 !important;
  color: white !important;
}

.my-sticky-header-column-table .light {
  background-color: #fff4cb !important;
  color: black !important;
}

.my-sticky-header-column-table .q-table thead tr, .my-sticky-header-column-table .q-table tbody td {
  padding: 1px;
  padding-left: 5px;
  height: 13px;
}

.my-sticky-header-column-table .q-table thead tr th {
  padding: 3px;
}

.my-sticky-header-column-table .q-table thead tr > th:not(:first-child),
.my-sticky-header-column-table .q-table tbody tr > td:not(:first-child) {
  border-left-width: 1px;
}
</style>