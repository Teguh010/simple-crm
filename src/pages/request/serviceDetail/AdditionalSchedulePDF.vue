<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useServiceDetailStore from '@/stores/service-details'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import useCategoryStore from '@/stores/categories'
import MtSearchItemService from '@/components/MtSearchItemService.vue'
import useCommonStore from '@/stores/common'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtSearchItemServiceUnit from '@/components/MtSearchItemServiceUnit.vue'

const emits = defineEmits(['close'])
const props = defineProps({search: Object})
const closeModal = () => {
  search.value.page_size = 50
  serviceDetailStore.setSearchScheduleParams(search.value)
  emits('close')
}

const customerList = ref([])
const customerListDefault = reactive([])
const customerStore = useCustomerStore()
const categoryStore = useCategoryStore()
const serviceDetailStore = useServiceDetailStore()
const {getCustomer} = storeToRefs(customerStore)

const commonTypeAnimalOptionList = ref([])
const search = ref({
  page_size: 50,
  id_customer: null,
  id_pet: null,
  flg_complete: false,
  id_category1: null,
  id_category2: null,
  id_disease: null,
  id_cm_animal: [],
  id_item_service: [],
  flg_send_flower: false,
  flg_microchip: false,
  flg_unlist: false,
  flg_delete_by_customer: false,
  flg_deceased: false,
  cus_flg_dm: false,
  pet_flg_dm: false,
})

const id_cm_animal = ref([])
const category1Selected = async (value: any) => {
  search.value.id_category1 = value
}

const category2Selected = async (value: any) => {
  search.value.id_category2 = value
}

const searchData = () => {
  serviceDetailStore.setSearchScheduleParams(search.value)
  emits('close')
}

const selectCustomer = async (value) => {
  await customerStore.selectCustomer(value)
  if (getCustomer.value) {
    if (getCustomer.value && getCustomer.value.pets && getCustomer.value.pets.length && getCustomer.value.pets.length > 0) {
      search.value.id_pet = getCustomer.value.pets[0].id_pet
    }
  }
}

function selectingWhole(value) {
  search.value.id_item_service = JSON.stringify(value)
}

function selectingWholeUnit(value) {
  search.value.id_item_service_unit_list = JSON.stringify(value)
}

const init = async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)


  commonTypeAnimalOptionList.value = useCommonStore().getCommonTypeAnimalOptionList
    .map((o: any) => ({value: o.id_common, label: o.name_common, status: 1, id_common: o.id_common,}))


  search.value = {...props.search}
  search.value.id_item_service = null
  search.value.id_cm_animal = null

}

onMounted(() => {
  init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-md">
    <div class="col-lg-6 col-md-6 col-sm-6" tabindex="0">
      <MtFormPullDown
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
    <div class="caption2 text-grey-600" v-if="search.page_size == '500' || search.page_size == '1000'">
      <q-icon name="warning" />
      抽出件数が多い場合、システム全体のパフォーマンスに影響がでる場合があります。繁忙時間を避けて操作してください。
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12" tabindex="0">
      <MtFilterSelect
        v-model:options="customerList"
        v-model:selecting="search.id_customer"
        :options-default="customerListDefault"
        label="診察券番号"
        outlined
        @update:selecting="selectCustomer"
      />
    </div>
    <div v-if="search.id_customer && getCustomer" class="col-lg-12 col-md-12 col-sm-12" tabindex="2">
      <MtFormPullDown
        v-model:options="getCustomer.pets"
        v-model:selected="search.id_pet"
        label="ペット名"
        outlined
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12" tabindex="3">
      <q-select
        v-model="id_cm_animal"
        :options="commonTypeAnimalOptionList"
        clearable
        dense
        emit-value
        label="動物種"
        map-options
        multiple
        outlined
        use-chips
        @update:model-value="(value)=> {
          search.id_cm_animal = JSON.stringify(value)
        }"
      />
    </div>
    <MtCategorySelectionComponent
      :data="{id_category1: props.search.id_category1,id_category2: props.search.id_category2}"
      :flg_for_food="true"
      :flg_for_item="true"
      :flg_for_service="true"
      :id_category1="search.id_category1"
      :id_category2="search.id_category2"
      full_width
      outlined
      @category1Selected="category1Selected"
      @category2Selected="category2Selected"
    />

    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid">
        <MtFormInputDate
          v-model:date="search.datetime_service_start"
          autofocus
          label="実施日：Start"
          outlined
          type="date"
        />
        <span class="flex content-center justify-center">
           〜
        </span>
        <MtFormInputDate
          v-model:date="search.datetime_service_end"
          autofocus
          label="実施日：end"
          outlined
          type="date"
        />
      </div>
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid">
        <MtFormInputDate
          v-model:date="search.date_schedule_start"
          autofocus
          label="予定日：Start"
          outlined
          type="date"
        />
        <span class="flex content-center justify-center">
           〜
        </span>
        <MtFormInputDate
          v-model:date="search.date_schedule_end"
          autofocus
          label="予定日：end"
          outlined
          type="date"
        />
      </div>
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid">
        <MtInputForm
          v-model="search.pet_age_less"
          autofocus
          label="ペット年齢：Start"
          outlined
          type="number"
        />
        <span class="flex content-center justify-center">
             〜
        </span>
        <MtInputForm
          v-model="search.pet_age_up"
          autofocus
          label="ペット年齢：End"
          outlined
          type="number"
        />
      </div>
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtSearchItemService
        :multiple="true"
        label="治療サービス 商品名"
        outlined
        @update:selecting="selectingWhole"
      />
      <MtSearchItemServiceUnit
        :multiple="true"
        label="治療サービス 品名包装単位名"
        outlined
        @update:selecting="selectingWholeUnit"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid-check">
        <MtFormCheckBox
          v-model:checked="search.flg_deceased"
          label="Dead / 亡くなりました"
        />
        <MtFormCheckBox
          v-model:checked="search.flg_delete_by_customer"
          label="オーナーによるペット削除"
        />
        <MtFormCheckBox
          v-model:checked="search.flg_microchip"
          label="マイクロチップ済"
        />
        <MtFormCheckBox
          v-model:checked="search.flg_send_flower"
          label="花送付済"
        />
        <MtFormCheckBox
          v-model:checked="search.flg_unlist"
          label="システム除外済"
        />
        <MtFormCheckBox
          v-model:checked="search.cus_flg_dm"
          label="オーナー DM 可否"
        />
        <MtFormCheckBox
          v-model:checked="search.pet_flg_dm"
          label="ペット DM 可否"
        />
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" tabindex="9" @click="searchData">
        <span>CSV抽出</span>
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