<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue';
import MtTable2 from '@/components/MtTable2.vue';
import useCustomerStore from '@/stores/customers';
import { getPetImageUrl, handleImageError } from '@/utils/aahUtils';
import mtUtils from '@/utils/mtUtils';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import UpdateCustomerModal from './UpdateCustomerModal.vue';
import useCommonStore from '@/stores/common';
import useCliCommonStore from '@/stores/cli-common';
import { storeToRefs } from 'pinia';

const emits = defineEmits(['close'])
const router = useRouter(), route = useRoute()
const customerStore = useCustomerStore()
const unApprovelist = ref<any>([])
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const { getCliCommonCustomerColorList } = storeToRefs(cliCommonStore)

const columns = [
  {
    name: 'code_customer',
    label: '診察券番号',
    field: 'code_customer',
    align: 'left',
    style: 'width: 10%'
  },
  {
    name: 'customer_name',
    label: 'オーナー姓名',
    field: 'customer_name',
    align: 'left',
    style: 'width: 15%'
  },
  { name: 'phone', label: '電話番号', field: 'phone', align: 'left', style: 'width: 10%' }
]

const closeModal = () => {
    router.push('SearchCustomerList').then(()=>{
        emits('close')
    })
}

const labelColor = (type_customer_color) => {
  getCliCommonCustomerColorList.value.find(
    (v) => v.code_func1 == type_customer_color
  )?.name_cli_common
}
const CustomerWaitList = () => {
 if(window.location.href.split('?')[1] && window.location.href.split('?')[1]==='=waitlist'){
    customerStore.UnapprovedCustomerlist().then((response)=>{
    if(response.data?.data?.length > 0){
      unApprovelist.value = response.data.data
    }
  })
 }
}
const onRowClick = async (data: any) => {
  // force fetch is true in selecting customer b'cause it will pass updated customer details to modal.
  await customerStore.selectCustomer(data.id_customer, true)
  await mtUtils.popup(UpdateCustomerModal, { data })
}
async function init() {
  if(window.location.href.split('/')[3] === 'SearchCustomerList?=waitlist'){
    CustomerWaitList()
  }
}

onMounted(async() => {
  await commonStore.fetchPreparationCommonList({code_common: [25]})
  await init()
})
</script>
<template>
    <MtModalHeader @closeModal="closeModal">
        <q-toolbar-title
          class="row no-wrap items-center text-grey-900 title2 bold"
        > 未承認オーナー
        </q-toolbar-title>
    </MtModalHeader>
    <MtTable2 :columns="columns" :rows="unApprovelist" :rowsBg="true" class="custody-table" :style="{ boxShadow: 'none' }" >
        <template v-slot:row="{ row }">
            <td
            v-for="(col, index) in columns"
            :key="index"
            @click="onRowClick(row)"
          >
          <div
              v-if="col.field == 'customer_name'"
              class="body1 regular text-grey-900"
            >
              <span class="caption1 regular text-grey-700">
                {{ row['name_kana_family'] }}
                {{ row['name_kana_first'] }}
              </span>
              <div class="text-bold">
                {{ row['name_family'] }} {{ row['name_first'] }}
                <q-icon
                  v-if="row['type_customer_color']"
                  size="13px"
                  name="circle"
                  class="q-ml-xs"
                  :color="labelColor(row['type_customer_color'])"
                />
              </div>
            </div>
            <div
              v-else-if="col.field == 'code_customer'"
              class="body1 regular text-grey-900"
            >
              {{ row['code_customer'] }}
            </div>
            <div v-else-if="col.field == 'name_pet'" class="body1 regular text-grey-900">
              <div
                @click.stop="openDetailPet(row)"
                class="avatar-container"
              >
                <img :src="getPetImageUrl(row)" @error="handleImageError($event, row)" :alt="row['name_pet']" loading="lazy" class="image-responsive" />
                <div>
                  <span class="caption1 regular text-grey-700">{{
                    row['name_kana_pet']
                  }}</span>
                  <div class="text-blue text-bold">
                    {{ row['name_pet'] }}
                    <q-icon
                      size="13px"
                      name="circle"
                      class="q-ml-xs"
                      :color = "getTypeAnimalColor(row['id_cm_animal'])"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              v-else-if="col.field == 'phone'"
              class="body1 regular text-grey-900"
            >
              {{ row['phone1'] }}
            </div>
            <div v-else
              class="body1 regular text-grey-900">
              {{ row[col.field] }}
            </div>
        </td>
        </template>
    </MtTable2>
</template>