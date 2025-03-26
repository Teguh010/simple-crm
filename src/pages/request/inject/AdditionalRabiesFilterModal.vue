<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, reactive, ref } from 'vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCliCommonStore from '@/stores/cli-common'
import { typeRabiesProcess } from '@/utils/enum'
import { getDateByFormat, getDateToday, getMonthStartAndEnd } from '@/utils/aahUtils'
import useAddressesStore from '@/stores/addresses'
import MtFilterMultipleSelect from '@/components/form/MtFilterMultipleSelect.vue'

const emits = defineEmits(['close'])
const props = defineProps({ search: Object, callBackSearch: Function })
const closeModal = () => {
  emits('close')
}

const search = ref({})
const selectedMonth = ref(getDateByFormat(getDateToday(), 'YYYY/MM'))
let addressPrefecture = ''
const addressDefaultList: any = reactive([])
const addressList: any = ref([])


const searchData = () => {
  search.value.address_prefecture = addressPrefecture
  search.value.address_cities = search.value.address_cities?.join(',')
  props.callBackSearch(search.value)
  emits('close')
}

const updateTagIssuedStart = (val: string) => {
  if (val && !search.value.date_tag_issued_end) {
    const endMonth = getMonthStartAndEnd(getDateByFormat(val, 'YYYY/MM'))
    search.value.date_tag_issued_end = getDateByFormat(
      endMonth.date_end,
      'YYYY/MM/DD'
    )
  }
}

const updateNumberTagStart = () => {
  if (search.value.number_tag_start && !search.value.number_tag_end) {
    search.value.number_tag_end = search.value.number_tag_start
  }
}

const filterCities = (event: any) => {
  if (!event.target) {
    return
  }
  addressPrefecture = event.target.value
  if (addressPrefecture.length == 0) {
    return
  }
  addressList.value = Array.from(
    new Set(
      useAddressesStore()
        .addresses
        .filter((add) => add.address_prefecture.includes(addressPrefecture))
        .map((address) => address.address_city) // Extract city names
    )
  ).map((uniqueCity) => {
    return {
      label: uniqueCity,
      value: uniqueCity
    }
  })

  addressDefaultList.value = [...addressList.value]
}

const init = async () => {
  search.value = { ...props.search }
  const addressesResponse = await useAddressesStore().fetchAllAddresses()
}

onMounted( async () => {
  await init()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-md">
    <div class="col-lg-6 col-md-6 col-sm-6" v-if="false">
      <MtFormPullDown
        v-model:selected="search.page_size"
        :options="[
          { label: '50', value: 50 },
          { label: '100', value: 100 },
          { label: '200', value: 200 },
          { label: '500', value: 500 },
          { label: '1000', value: 1000 }
        ]"
        label="抽出件数"
        outlined
      />
    </div>
    <p
      v-if="search.page_size == '500' || search.page_size == '1000'"
      class="caption2 text-grey-600 q-px-md"
    >
      <q-icon name="warning" />
      <span class="">
        抽出件数が多い場合、システム全体のパフォーマンスに影響がでる場合があります。繁忙時間を避けて操作してください。
      </span>
    </p>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtFormInputDate
        v-model:date="search.date_tag_issued_start"
        autofocus
        label="済票発行日: Start"
        outlined
        type="date"
        @update:date="updateTagIssuedStart"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtFormInputDate
        v-model:date="search.date_tag_issued_end"
        autofocus
        label="済票発行日: End"
        outlined
        type="date"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtInputForm
        v-model="search.number_tag_start"
        autofocus
        label="済票番号: Start"
        outlined
        type="number"
        @blur="updateNumberTagStart()"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtInputForm
        v-model="search.number_tag_end"
        autofocus
        label="済票番号: End"
        outlined
        type="number"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtFormPullDown
        v-model:selected="search.code_city_hall"
        :options="useCliCommonStore().getCliCommonPublicHealthCenterList.map((o: any) => ({
        label: `${o.code_func1} ${o.name_cli_common}`,
        value: `${o.code_func1} ${o.name_cli_common}`}))"
        outlined
        label="保健所CD"
        type="text"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtFormPullDown
        v-model:selected="search.type_rabies_process"
        :options="typeRabiesProcess"
        label="院内処理区分"
        outlined
        type="text"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtFormPullDown
        v-model:selected="search.type_rabies_round"
        :options="typeRabiesRound"
        label="継続区分"
        outlined
        type="text"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtFilterMultipleSelect
        v-model="search.address_cities"
        v-model:options="addressList"
        :options-default="addressDefaultList"
        :outlined="true"
        label="大分類"
        v-on:keyup="(val) => {filterCities(val)}"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtInputForm
        v-model="search.license_id"
        label="鑑札番号: Start"
        outlined
        type="text"
      />
    </div>
    <div class="col-lg-6 col-md-6 col-sm-6">
      <MtInputForm
        v-model="search.license_id"
        label="鑑札番号: End"
        outlined
        type="text"
      />
    </div>
    <div class="col-lg-12 col-md-12 col-sm-12">
      <MtInputForm
        v-model="search.search_address"
        label="住所（自由入力）"
        type="text"
      >
      </MtInputForm>
    </div>

  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" tabindex="9" @click="searchData">
        <span>適用</span>
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
  column-gap: 20px;
}
</style>
