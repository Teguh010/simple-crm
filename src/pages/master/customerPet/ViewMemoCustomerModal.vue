<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import UpdateMemoCustomerModal from '@/pages/master/customerPet/UpdateMemoCustomerModal.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useCustomerStore from '@/stores/customers'
import useMemoCustomerStore, { TypeMemoCustomer } from '@/stores/memo-customer'
import { storeToRefs } from 'pinia'
import { concatenate } from '@/utils/aahUtils'
import { typeMemoCustomer } from '@/utils/enum'
import { MemoCustomerType } from '@/types/types'
import mtUtils from '@/utils/mtUtils'

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

interface Props {
  id_customer: string | number
}

const props = withDefaults(defineProps<Props>(), {
  id_customer: ''
})

const customerStore = useCustomerStore()
const { getCustomer } = storeToRefs(customerStore)
const memoCustomerStore = useMemoCustomerStore()

const memoFilterEnums = {
  allMemo: 1,
  typeMemoCustomer_memo: 2,
  typeMemoCustomer_todo_unfinished: 3,
  typeMemoCustomer_todo_finished: 4
}
const memoFilter = ref(memoFilterEnums.allMemo)

const columnMemoCustomer = [
  {
    name: 'date_memo_customer',
    label: '記録日',
    field: 'date_memo_customer',
    align: 'left'
  },
  {
    name: 'type_memo_customer',
    label: '区分',
    field: 'type_memo_customer',
    align: 'left'
  },
  {
    name: 'memo_text',
    label: '内容',
    field: 'memo_text',
    align: 'left',
    style: 'width : 60% '
  },
  {
    name: 'date_complete',
    label: '完了日',
    field: 'date_complete',
    align: 'left'
  }
]

type MemoType = 'allMemo' | 'type1' | 'type2_unfinished' | 'type2_finished'

interface Payload {
  id_customer: string
  type_memo_customer?: number
  flg_complete?: boolean
}

const search = (type: MemoType) => {
  const memoTypes = {
    MEMO: 1,
    TODO: 2
  }

  let payload: Payload = {
    id_customer: props.id_customer
  }

  switch (type) {
    case 'allMemo':
      break

    case 'type1':
      payload.type_memo_customer = memoTypes.MEMO
      break

    case 'type2_unfinished':
      payload.type_memo_customer = memoTypes.TODO
      payload.flg_complete = false
      break

    case 'type2_finished':
      payload.type_memo_customer = memoTypes.TODO
      payload.flg_complete = true
  }

  memoCustomerStore.fetchMemoCustomers(payload)
}

const openMemoCustomerModal = async (
  data: MemoCustomerType | {} = {},
  flgDuplicate: boolean = false
) => {
  await mtUtils
    .smallPopupWithPresistance(UpdateMemoCustomerModal, {
      id_customer: props.id_customer,
      data,
      flgDuplicate
    })
    .then(async () => {})
}

const getTypeMemoCustomerLabel = (type: number) => {
  return typeMemoCustomer.find((el) => el.value === type)?.label
}
</script>
<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <span>
          オーナーメモ：{{
            concatenate(getCustomer.name_family, getCustomer.name_first, ' 様')
          }}
        </span>
      </q-toolbar-title>
      <MtFormRadiobtn
        label="すべて"
        :val="memoFilterEnums.allMemo"
        v-model:selected="memoFilter"
        @update:selected="search('allMemo')"
      />
      <MtFormRadiobtn
        label="メモ"
        :val="memoFilterEnums.typeMemoCustomer_memo"
        class="q-ml-md"
        v-model:selected="memoFilter"
        @update:selected="search('type1')"
      />
      <MtFormRadiobtn
        label="TODO(未完了)"
        :val="memoFilterEnums.typeMemoCustomer_todo_unfinished"
        class="q-ml-md"
        v-model:selected="memoFilter"
        @update:selected="search('type2_unfinished')"
      />
      <MtFormRadiobtn
        label="TODO(完了)"
        :val="memoFilterEnums.typeMemoCustomer_todo_finished"
        class="q-ml-md"
        v-model:selected="memoFilter"
        @update:selected="search('type2_finished')"
      />
    </MtModalHeader>
    <q-card-section class="content q-px-xl relative-position">
      <div>
        <MtTable2
          :columns="columnMemoCustomer"
          :rows="memoCustomerStore.getMemoCustomers"
          :rowsBg="true"
          class="memo-customer-table"
          flat
          no-data-message="登録がありません。"
          no-result-message="該当のデータが見つかりませんでした"
        >
          <template v-slot:row="{ row }">
            <td
              v-for="(col, index) in columnMemoCustomer"
              class="cursor-pointer"
              @click="openMemoCustomerModal(row)"
              :class="
                row?.type_memo_customer === TypeMemoCustomer.TODO && !row?.flg_complete
                  ? 'memo-bg-yellow'
                  : ''
              "
            >
              <div v-if="col.field == 'date_memo_customer'">
                <q-icon
                  v-if="row.flg_pin"
                  class="text-darkred"
                  name="push_pin"
                />
                {{ row.date_memo_customer }}
              </div>
              <div
                v-else-if="col.field === 'type_memo_customer'"
                class="body1 regular text-grey-900"
              >
                {{ getTypeMemoCustomerLabel(row?.type_memo_customer) }}
              </div>
              <div
                v-else-if="col.field === 'memo_text'"
                class="body1 regular text-grey-900 ellipsis"
                style="max-width: 60vw; white-space: pre;"
              >
                {{ row.memo_text }}
              </div>
              <div
                v-else-if="col.field === 'date_complete'"
                class="body1 regular text-grey-900"
              >
                {{ row.date_complete ?? '-' }}
              </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row[col.field] }}
              </div>
            </td>
          </template>
        </MtTable2>
      </div>
      <div class="add-memo-btn q-mr-md q-mb-md">
        <q-btn
          round
          color="primary"
          icon="add"
          @click="openMemoCustomerModal"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
      </div>
    </q-card-section>
  </div>
</template>
<style lang="scss" scoped>
.memo-customer-table {
  :deep(.q-table__card) {
    border: 0;
  }
}
.memo-bg-yellow {
  background-color: #fcff5a;
}
.add-memo-btn {
  position: fixed;
  bottom: 70px;
  right: 20px;
  z-index: 9999;
}
</style>
