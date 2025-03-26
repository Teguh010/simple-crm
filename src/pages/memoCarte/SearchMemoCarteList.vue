<script setup lang="ts">
import { onMounted, ref, defineAsyncComponent } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import dayjs from 'dayjs'

import useMemoCarteStore from '@/stores/memo-cartes'
import useCommonStore from '@/stores/common'

import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'

/** -------------- Utility imports ----------- **/
import mtUtils from '@/utils/mtUtils'
import {
  getCustomerName,
  getCustomerLabelColor,
  getPetImageUrl,
  handleImageError,
  dateFormat
} from '@/utils/aahUtils'

/* ---------------------- Async Page Imports ---------------------- */
const ViewMemoCarte = defineAsyncComponent(
  () => import('@/pages/memoCarte/detail/ViewMemoCarte.vue')
)
const commonStore = useCommonStore()
const memoCarteStore = useMemoCarteStore()
const { getMemoCartes } = storeToRefs(memoCarteStore)

const columns = [
  {
    name: 'number_memo_carte',
    label: 'メモカルテ番号',
    field: 'number_memo_carte',
    align: 'left',
    style: 'width: 12%'
  },
  {
    name: 'datetime_insert',
    label: '作成日',
    field: 'datetime_insert',
    align: 'left',
    style: 'width: 12%'
  },
  {
    name: 'datetime_update',
    label: '更新日',
    field: 'datetime_update',
    align: 'left',
    style: 'width: 12%'
  },
  {
    name: 'customer',
    label: 'オーナー',
    field: 'name_customer',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'pet',
    label: 'ペット',
    field: 'name_pet',
    align: 'left',
    style: 'width: 15%'
  },
  {
    name: 'memo',
    label: 'メモカルテ', //combine all memo-data
    field: 'memo',
    align: 'center',
  }
]

const onRowClick = async (data) => {
  console.log(data)
  await mtUtils.mediumPopup(ViewMemoCarte, {data})
}

const moveNext = (e: any) => {
  const inputs = Array.from(
    e.target.form.querySelectorAll('input[type="text"]')
  )
  const index = inputs.indexOf(e.target)
  if (index === 0) {
    ;(inputs[index + 1] as HTMLElement).focus()
  } else {
    ;(inputs[1] as HTMLElement).blur()
    search()
  }
}

const searchData = ref({
  memo_other: '',
  date_start: dayjs().format('YYYY/MM/DD'),
  date_end: dayjs().format('YYYY/MM/DD')
})

const search = async () => {
  await memoCarteStore.fetchMemoCarte(searchData.value)
}

onMounted(() => {
  // await Promise.all([
  //   commonStore.fetchPreparationCommonList({ code_common: [1] })
  // ])
  search()
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          メモカルテ一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start as String"
                :tabindex="1"
                autofocus
                label="開始日：Start"
                outlined
                type="date"
                @keydown.enter="moveNext"
                @update:date="
                  () => {
                    searchData.date_end = searchData.date_start
                  }
                "
              />
              <MtFormInputDate
                v-model:date="searchData.date_end as String"
                :tabindex="2"
                class="q-mx-sm"
                label="開始日：End"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />

              <MtInputForm
                type="text"
                label="メモカルテ内容"
                :tabindex="3"
                outlined
                v-model="searchData.memo_other"
                class="search-field q-mr-sm"
                @keydown.enter="moveNext"
              />

              <q-btn
                color="grey-800"
                text-color="white"
                tabindex="4"
                unelevated
                @click="search()"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                v-model:date="searchData.date_start as String"
                autofocus
                class="q-mr-sm ipad-field-size-md"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <MtFormInputDate
                v-model:date="searchData.date_end as String"
                class="ipad-field-size-md"
                outlined
                type="date"
                @keydown.enter="moveNext"
              />
              <MtInputForm
                type="text"
                label="メモカルテ内容"
                outlined
                v-model="searchData.memo_other"
                class="search-field q-mr-sm"
                @keydown.enter="moveNext"
              />
              <q-btn
                color="grey-800"
                text-color="white"
                unelevated
                class="q-mx-sm"
                @click="search()"
              >
                <q-icon size="20px" name="search" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="getMemoCartes"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100dvh - 90px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
        >
          <div
            v-if="col.field == 'name_customer'"
            class="body1 regular text-grey-900"
          >
            <span class="caption1 regular text-grey-700">
              {{ row.customer?.name_kana_family }}
              {{ row.customer?.name_kana_first }}
            </span>
            <div class="">
              {{ getCustomerName(row.customer) }}
              <!-- <q-icon
                v-if="row.customer?.type_customer_color"
                size="12px"
                name="circle"
                class="q-ml-xs"
                :color="
                  getCustomerLabelColor(row.customer?.type_customer_color)
                "
              /> -->
            </div>
          </div>
          <div
            v-else-if="col.field == 'name_pet'"
            class="body1 regular text-grey-900"
          >
            <!-- <img
              v-if="row"
              :src="getPetImageUrl(row)"
              @error="handleImageError($event, row)"
              :alt="row['name_pet']"
              class="image-responsive"
              loading="lazy"
            /> -->
            <!-- <div v-else class="default bg-grey-300" /> -->
            <div>
              <span class="caption1 regular text-grey-700">
                {{ row.pet.name_kana_pet }}
              </span>
              <div>
                {{ row.pet.name_pet }}
                <!-- <q-icon
                  size="12px"
                  name="circle"
                  class="q-ml-xs"
                  :color="getTypeAnimalColor(row.pet.id_cm_animal)"
                  :style="{ color: getTypeAnimalColor(row.pet.id_cm_animal) }"
                /> -->
              </div>
            </div>
          </div>
          <div
            v-else-if="col.field == 'datetime_insert'"
            class="body1 regular text-grey-900"
          >
          {{ dateFormat(row.datetime_insert)}}
          </div>
          <div
            v-else-if="col.field == 'datetime_update'"
            class="body1 regular text-grey-900"
          >
          {{ dateFormat(row.datetime_update)}}
          </div>
          <div
            v-else-if="col.field == 'memo'"
            class="tableRow body1 regular text-grey-900 ellipsis-2-lines"
          >
            {{ `${row.memo_sbj || ''} ${row.memo_obj || ''} ${row.memo_ass || ''} ${row.memo_other || ''}`.trim().replace(/<\/?[^>]+(>|$)/g, "") }}
          </div>
          <div
            v-else
            class="tableRow body1 regular text-grey-900 ellipsis-2-lines"
          >
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
<style lang="scss" scoped>
.tableRow {
  width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  word-break: break-word;
}
.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  // cursor: pointer;
  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
</style>
