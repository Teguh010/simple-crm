<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCommonStore from '@/stores/common'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { typeStatusApplication } from '@/utils/enum'
import useCartStore from '@/stores/carts'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import MtInputForm from '@/components/form/MtInputForm.vue'

const emits = defineEmits(['close'])
const props = defineProps({ search: Object, callBackSearch: Function })
const closeModal = () => {
  emits('close')
}

const customerStore = useCustomerStore()
const { getCustomer } = storeToRefs(customerStore)

const customerList = ref([])
const customerListDefault = reactive([])


const commonTypeAnimalOptionList = ref([])
const search = ref({})

const searchData = () => {

  useCartStore().setAdditionalSearchParams(search.value)
  props.callBackSearch(search.value)

  emits('close')
}

async function selectingCustomer() {
  if (!search.value.id_customer) {
    search.value.id_pet = null
  }

  await customerStore.selectCustomer(search.value.id_customer)
  if (getCustomer.value) {
    if (getCustomer.value && getCustomer.value.pets && getCustomer.value.pets.length && getCustomer.value.pets.length > 0) {
      search.value.id_pet = getCustomer.value.pets[0].id_pet
    }
  }
}

const init = async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  
  search.value = {
    ...useCartStore().getAdditionalSearchParams
  }
  search.value.page_size = 50
  commonTypeAnimalOptionList.value = useCommonStore().getCommonTypeAnimalOptionList
    .map((o: any) => ({ value: o.id_common, label: o.name_common, status: 1, id_common: o.id_common }))

}

onMounted(() => {
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索w
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-md">
    <div class="col-lg-6 col-md-6 col-sm-6" tabindex="0">
      <MtFormPullDown v-if="false"
        v-model:selected="search.page_size"
        :options="[
        {label: '50', value: 50,},
        {label: '100', value: 100,},
        {label: '200', value: 200,},
        {label: '500', value: 500,},
        {label: '1000', value: 1000,}]"
        label="抽出件数"
        outlined
      />
    </div>
    <div v-if="search.page_size == '500' || search.page_size == '1000'" class="caption2 text-grey-600 q-mx-md">
      <q-icon name="warning" />
        抽出件数が多い場合、システム全体のパフォーマンスに影響がでる場合があります。繁忙時間を避けて操作してください。
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtFilterSelect
        v-model:options="customerList"
        v-model:selecting="search.id_customer"
        :options-default="customerListDefault"
        autofocus
        label="診察券番号"
        outlined
        tabindex="1"
        @update:selecting="selectingCustomer"
      />
    </div>
    <div v-if="search.id_customer && getCustomer" class="col-lg-12 col-md-12 col-sm-12">
      <MtFormPullDown
        v-model:options="getCustomer.pets"
        v-model:selected="search.id_pet"
        label="ペット名 "
        outlined
        tabindex="2"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.security_number"
        label="証券番号"
        outlined
        tabindex="3"
        type="text" />
    </div>

    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.approval_number"
        label="承認番号"
        outlined
        tabindex="3"
        type="text" />
    </div>


  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" tabindex="9" @click="searchData">
        <span>確定</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-columns: 47% 6% 47%;
}

.grid-check {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px
}
</style>