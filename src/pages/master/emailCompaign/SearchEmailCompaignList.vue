<script setup lang="ts">
import { onMounted, } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateEmailCompaign from './UpdateEmailCompaign.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import { sortBy } from 'lodash'
import useEmailCompaignStore from '@/stores/email-compaign'
import {
  formatDateTime
} from '@/utils/aahUtils'

const emailCompaignStore = useEmailCompaignStore()
const { getEmailCompaigns } = storeToRefs(emailCompaignStore)

const columns = [
  {
    name: 'datetime_insert',
    label: '日付を挿入',
    field: 'datetime_insert',
  },
  {
    name: 'name_email_campaign',
    label: '名前メールキャンペーン',
    field: 'name_email_campaign',
  },
  {
    name: 'flg_sent',
    label: 'ステータスが送信されました',
    field: 'flg_sent',
    align: 'center',
  },
  {
    name: 'display_order',
    label: '注文',
    field: 'display_order',
  }
]

const openAddModal = async () => {
  await mtUtils.mediumPopup(UpdateEmailCompaign, { 
    searchData: search
  })
}

const onRowClick = async (data) => {
  await mtUtils.mediumPopup(UpdateEmailCompaign, {
    data:data,
    searchData: search
  })
}

const search = async () => {
  await emailCompaignStore.fetchEmailCompaigns()
}

onMounted(async () => {
  await search()
})

</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          一括メールモジュール
        </q-toolbar-title>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
        >
          <q-icon size="20px" name="add" />新しいキャンペーン
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <MtTable2
      class="q-pt-sm"
      :columns="columns"
      :rows="sortBy(getEmailCompaigns, 'display_order', 'asc')"
      :rowsBg="true"
      flat
      :style="{ height: 'calc(100vh - 70px)' }"
    >
      <template v-slot:row="{ row }">
        <td
          v-for="(col, index) in columns"
          :key="index"
          @click="onRowClick(row)"
          class="cursor-pointer"
        >
          
          <div
            v-if="col.field == 'datetime_insert'"
            class="body1 regular text-grey-900"
          >
            <span>
              {{ formatDateTime(row['datetime_insert']) }}
            </span>
          </div>
          <div
              v-else-if="col.field == 'flg_sent'"
              class="body1 regular text-grey-900 text-center"
            >
              <q-icon
                :name="row[col.field] === false ? 'check_circle' : ''"
                size="22px"
              />
            </div>
          <div
            v-else
            class="body1 regular text-grey-900"
          >
            {{ row[col.field] }}
          </div>
        </td>
      </template>
    </MtTable2>
  </q-page>
</template>
