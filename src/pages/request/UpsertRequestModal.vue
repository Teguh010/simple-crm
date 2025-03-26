<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, ref } from 'vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import router from '@/router'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'

export interface UpsertRequestModalProps {
  requestList: any[]
  idCustomer: string | number
  callbackFn: (requestId?: string | number) => Promise<void>
}

const props = defineProps<UpsertRequestModalProps>()

const emit = defineEmits(['close'])

const requestOptionList = ref([])

const data = ref({
  id_request: '',
})

const closeModal = () => {
  emit('close')
}

const openRequestDetail = (id_request: any) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })
  window.open(route.href, '_blank')
}

const handleSubmit = async () => {
  await props.callbackFn(data.value.id_request)
  emit('close')
}

async function getBookedRequestList() {
  if (props.requestList && props.requestList.length > 0) {
    requestOptionList.value = props.requestList.map((item: any) => ({
      label: `${item.flg_booking ? '【予約】- ' : ''}${item.number_request} - ${item.title_request}`,
      value: item.id_request
    }))
    data.value.id_request = requestOptionList.value[0].value

  } else {
    requestOptionList.value = []
  }
}

const createNew = async () => {
  await props.callbackFn()
  emit('close')
}

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([getBookedRequestList(),
    useCustomerStore().selectCustomer(props.idCustomer)])
  
  if (requestOptionList.value && requestOptionList.value.length > 0) {
    data.value.id_request = requestOptionList.value[0].value
  }
})
</script>

<template>
  <q-form @submit="handleSubmit">
    <MtModalHeader :closeBtn="true" @close-modal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        未完了リクエストの連携
      </q-toolbar-title>
      <q-space></q-space>
    </MtModalHeader>
    <q-card-section class="q-px-xl q-my-md">
      <div class="flex justify-between q-mb-lg">
        <p class="q-ma-none">対象のリクエストを選択してください。</p>
        <q-btn
          color="primary"
          size="md"
          text-color="white"
          unelevated
          @click.stop="createNew()"
        >
          <q-icon name="add" class="q-mr-sm" />
          リクエスト
        </q-btn>
      </div>
      <MtFormPullDown v-model:selected="data.id_request" :custom-option="true" :options="requestOptionList">
        <template v-slot:option="options">
          <q-item v-bind="options.slotProps.itemProps">
            <q-item-section>
              <q-item-label v-html="options.slotProps.opt.label" />
            </q-item-section>
            <q-item-section side>
              <q-btn
                class="q-ml-lg"
                outline
                size="sm"
                text-color="black"
                unelevated
                @click.stop="openRequestDetail(options.slotProps.opt.value)"
              >
                別タブで開く
              </q-btn>
            </q-item-section>
          </q-item>
        </template>
      </MtFormPullDown>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>選択</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
