<script setup lang="ts">
import { onMounted, ref, computed, onUnmounted } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtTable2 from '@/components/MtTable2.vue'
import mtUtils from '@/utils/mtUtils'
import { getDateToday, getDaysAfter } from '@/utils/aahUtils'
import useInfoStore from '@/stores/info'
import UpdateInfoListModal from './UpdateInfoListModal.vue'
import { typeDisplay, typeInfo } from '@/utils/enum'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { event_bus } from '@/utils/eventBus'
import dayjs from 'dayjs'

const infoStore = useInfoStore()

const columns = [
  {
    name: 'checkbox',
    label: '',
    field: 'checkbox',
    style: 'width:5%',
    overLoad: true
  },
  {
    name: 'type_display',
    label: '表示ステータス',
    field: 'type_display',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'title',
    label: 'タイトル',
    field: 'title',
    align: 'left',
    style: 'width: 10%',
    headerStyle: 'width: 10%'
  },
  {
    name: 'type_info',
    label: 'お知らせ区分',
    field: 'type_info',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  },
  // {
  //   name: 'flg_read',
  //   label: '既読',
  //   field: 'flg_read',
  //   align: 'left',
  //   style: 'width: 5%',
  //   headerStyle: 'width: 5%'
  // },
  {
    name: 'date_start',
    label: '共有日',
    field: 'date_start',
    align: 'left',
    style: 'width: 15%',
    headerStyle: 'width: 15%'
  }
]
const searchData = ref({
  date_from: getDateToday(),
  date_to: getDaysAfter(8),
  type_info: null,
  type_display: 1,
  id_clinic: null
})
const bulkEdit = ref({
  type_info: null,
  type_display: null
})
const selectedRows = ref([])
const allCheckboxSelected = ref(false)

const rows = computed(() => {
  const infos = infoStore.getInfos.map((info: any) => {
    info.checked = false
    return info
  })
  return infos
})
const search = async () => {
  searchData.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  await infoStore.fetchInfos(searchData.value)
}
const applyBulkEdit = async () => {
  selectedRows.value = rows.value.filter((info: any) => info.checked)
  const data = {
    action: 'update',
    type_info: bulkEdit.value.type_info,
    type_display: bulkEdit.value.type_display,
    t_infos: selectedRows.value.map((info) => info.id_notification)
  }
  await mtUtils
    .confirm('確認していますか？', '確認')
    .then(async (confirmation) => {
      if (confirmation) {
        await infoStore.bulkUpdateDeleteInfos(data)
        await infoStore.fetchInfos()
      }
    })
}

const deleteBulk = async () => {
  selectedRows.value = rows.value.filter((info: any) => info.checked)
  const data = {
    action: 'delete',
    t_infos: selectedRows.value.map((info) => info.id_notification)
  }
  await mtUtils
    .confirm('確認していますか？', '確認')
    .then(async (confirmation) => {
      if (confirmation) {
        await infoStore.bulkUpdateDeleteInfos(data)
        await infoStore.fetchInfos()
      }
    })
}
const onRowClick = async (data: any) => {
  await mtUtils.popup(UpdateInfoListModal, { data, lineMessageType: 'multicast_message' })
}
const rowCheckedStatusChanged = (row: any) => {
  selectedRows.value = selectedRows.value.filter(
    (r: any) => r.id_notification !== row.id_notification
  )
  if (row.checked) {
    selectedRows.value.push(row)
  }
  if (allCheckboxSelected.value) {
  }
}
const openInfoModal = async () => {
  await mtUtils.popup(UpdateInfoListModal, { searchData: search, lineMessageType: 'multicast_message' })
}
function checkedRowList(value: any) {
  allCheckboxSelected.value = value
  rows.value = rows.value.map((r: any) => {
    r.checked = value
    return r
  })
  if (value === true) {
    selectedRows.value = [...rows.value]
  } else {
    selectedRows.value.length = 0
  }
  bulkEdit.value.type_display = null
  bulkEdit.value.type_info = null
}

event_bus.on('searchData', async () => search())

onMounted(async () => {
  search()
})

onUnmounted(() => {
  event_bus.off('searchData')
})

const dateToOptions = (date: string) => {
  return dayjs(date).isAfter(searchData.value.date_from)
}
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          お知らせ
        </q-toolbar-title>
        <q-space></q-space>
        <form class="row items-center no-wrap">
          <div class="col-3">
            <MtFormInputDate
              v-model:date="searchData.date_from"
              outlined
              class="q-mr-sm"
              type="date"
              autofocus
              label="公開日：Start"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-model:date="searchData.date_to"
              outlined
              type="date"
              label="公開日：End"
              :options="dateToOptions"
            />
          </div>
          <div class="col-3">
            <!-- <MtInputForm
              type="selection"
              v-model="searchData.type_info"
              label="お知らせ区分"
              :items="typeInfo"
              class="q-mx-sm"
              @update:modelValue=""
            /> -->
            <MtFormPullDown
              label="お知らせ区分"
              v-model:selected="searchData.type_info"
              :options="typeInfo"
              class="q-mx-sm"
            />
          </div>
          <div class="col-3">
            <!-- <MtInputForm
              type="selection"
              v-model="searchData.type_display"
              label="表示ステータス"
              :items="typeDisplay"
              class="q-mx-sm"
              @update:modelValue="typeDisplayUpdated"
            /> -->
            <MtFormPullDown
              label="表示ステータス"
              v-model:selected="searchData.type_display"
              :options="typeDisplay"
            />
          </div>
        </form>
        <q-btn
          color="accent-800"
          text-color="white"
          unelevated
          @click="search"
          class="q-mx-sm"
        >
          <q-icon name="search" size="20px" />
            検索
          </q-btn>
        <q-btn
          color="primary"
          text-color="white"
          unelevated
          @click="openInfoModal"
        >
          <q-icon size="20px" name="add" />
          お知らせ
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="q-px-sm q-py-lg" v-if="selectedRows.length > 0">
      <div class="row">
        <q-space></q-space>
        <div class="col-2 q-px-sm">
          <MtInputForm
            type="selection"
            v-model="bulkEdit.type_display"
            label="表示ステータス"
            :items="typeDisplay"
            class="col-2"
            :style="{
              visibility: selectedRows.length > 0 ? 'visible' : 'hidden'
            }"
            @update:modelValue=""
          />
        </div>
        <div class="q-ml-lg q-px-xm">
          <q-btn
            :style="{
              visibility: selectedRows.length > 0 ? 'visible' : 'hidden'
            }"
            label="選択のみ削除"
            @click="deleteBulk()"
          />
        </div>
        <div class="q-px-lg">
          <q-btn
            :style="{
              visibility: selectedRows.length > 0 ? 'visible' : 'hidden'
            }"
            label="選択のみ反映"
            @click="applyBulkEdit()"
          />
        </div>
      </div>
    </div>
    <MtTable2
      :columns="columns"
      :rows="rows"
      :rowsBg="true"
      :style="{
        height:
          selectedRows.length > 0
            ? 'calc(100vh - 150px)'
            : 'calc(100vh - 110px)'
      }"
      flat
      @checked="checkedRowList"
      class="q-mt-sm"
    >
      <template v-slot:row="{ row }">
        <td v-for="(col, index) in columns" :key="index" class="cursor-pointer">
          <div v-if="col.field == 'checkbox'" auto-width>
            <MtFormCheckBox
              v-model:checked="row.checked"
              @update:checked="rowCheckedStatusChanged(row)"
            />
          </div>
          <div v-else @click="onRowClick(row)">
            <div
              v-if="col.field == 'type_info'"
              class="body1 regular text-grey-900"
            >
              {{ typeInfo.find((v) => v.value === row.type_info)?.label }}
            </div>
            <div
              v-else-if="col.field == 'type_display'"
              class="body1 regular text-grey-900"
            >
              <!-- <div
                class="q-pa-xs q-px-xl text-center"
                :style="{
                  background: typeDisplay.find(
                    (v) => v.value === row.type_display
                  )?.color,
                  width: '70%'
                }"
              >
              </div> -->
                {{
                  typeDisplay.find((v) => v.value === row.type_display)?.label
                }}
            </div>
            <!-- <div
              v-else-if="col.field == 'flg_read'"
              class="body1 regular text-grey-900 text-center"
            >
              <q-icon
                :name="row[col.field] === true ? 'check_circle' : ''"
                size="22px"
              />
            </div> -->
            <div v-else class="body1 regular text-grey-900">
              {{ row[col.field] }}
            </div>
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>

<style lang="scss" scoped>
.red {
  color: #ff4343;
}
</style>
./UpdateInfoListModal.vue
