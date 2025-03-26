<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import UpdateCartModal from '@/pages/cart/UpdateCartModal.vue'
import mtUtils from '@/utils/mtUtils'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCartStore from '@/stores/carts'
import useTask from '@/stores/task'
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { searchCartProcessStatusOption, searchInsCartOption } from '@/utils/enum'
import { storeToRefs } from 'pinia'
import useCommonStore from '@/stores/common'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const props = defineProps({
  data: Object,
  hideCustomerPullDown: Boolean,
  callbackSearchModal: Function,
  callbackFunction: Function
})

const cartStore = useCartStore()
const taskStore = useTask()
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const { getCustomer } = storeToRefs(customerStore)

const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const action = computed(() => actionStore.action)

const customerList = ref([])
const customerListDefault = reactive([])
const breedOptionList = ref([])
const breedDefaultOptionList = reactive([])


const search = ref({
  number_cart: null,
  this_month: null,
  last_month: null,
  id_customer: null,
  date_start: props.data.date_start,
  date_end: props.data.date_end,
  id_pet: null,
  id_cm_animal_list: null,
  flg_completed: null,
  flg_modified: null,
  processStatus: null,
  InsCartOption:null,
  type_insurance_provider: null
  
});
const computedProcessStatus = computed({
  get: () => search.value.processStatus,
  set: (newValue: number) => {
    search.value.processStatus = newValue

    search.value.flg_completed = null
    search.value.flg_modified = null

    switch (newValue) {
      case 2:
        search.value.flg_completed = false
        break
      case 3:
        search.value.flg_completed = true
        break
      case 4:
        search.value.flg_modified = true
        break
      default:
        break
    }
  },
})

const computedInsCartOption = computed({
  get: () => search.value.InsCartOption,
  set: (newValue: number) => {
    search.value.InsCartOption = newValue

    switch (newValue) {
      case 2:
      search.value.type_insurance_provider = 1
      break
      case 3:
      search.value.type_insurance_provider = 2
      break
      case 4: 
      search.value.type_insurance_provider = 3
      break
      case 5:  
        search.value.type_insurance_provider = 4
        break
      default:
        search.value.type_insurance_provider = null
        break
    }
  },
})

const openCartModal = async () => {
  taskStore.selectTask(null)
  await mtUtils.mediumPopup(UpdateCartModal)
}

const fetchCartList = async () => {
  if (props.callbackSearchModal) {
    props.callbackSearchModal(search.value)
    closeModal()
    return
  }
  await cartStore.fetchCarts({
    number_cart: search.value.number_cart,
    this_month: search.value.this_month,
    last_month: search.value.last_month,
    id_customer: search.value.id_customer,
    date_start: search.value.date_start,
    date_end: search.value.date_end,
    flg_completed: search.value.flg_completed, 
    flg_modified: search.value.flg_modified,
    type_insurance_provider:search.value.type_insurance_provider,
    type_animal_list: JSON.stringify(search.value.id_cm_animal_list),
  })
  closeModal()
}

async function selectingCustomer() {
  if (!search.value.id_customer) {
    search.value.id_pet = null
  }

  await customerStore.selectCustomer(search.value.id_customer)
}

function setDateRange(type: any) {
  if (props.callbackFunction) {
    props.callbackFunction(type)
  }

  closeModal()
}

function selectedAnimalOption(value) {
  if (value) {

    const code_func1 = commonStore.getCommonTypeAnimalOptionList?.find((animal: any) => value.includes(animal.id_common))?.code_func1
    if (code_func1) {
      breedDefaultOptionList.length = 0
      breedOptionList.value.length = 0
      breedDefaultOptionList.push(...commonStore.getCommonBreedOptionList.filter((common: any) => common.code_func1 == code_func1))
      breedOptionList.value = [...breedDefaultOptionList]
    }
  }
}

onMounted(async () => {
  await commonStore.fetchPreparationCommonList({ code_common: [1] })
  
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.callbackSearchModal && props.data) {
    Object.assign(search.value, props.data)
  }
  
  if (
    action.value === 'createCart' ||
    localStorage.getItem('pageAction') === 'createCart'
  ) {
    openCartModal()
    actionStore.resetAction()
    localStorage.removeItem('pageAction')
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      詳細検索
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-md">
    <q-card-section class="row q-col-gutter-lg">
      <template v-if="!props.hideCustomerPullDown" class="">
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
      </template>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFormMultipleSelection
          v-model="search.id_cm_animal_list"
          :options="getCommonTypeAnimalOptionList"
          label="動物種"
          option-label="label"
          option-value="value"
          outlined
          required
          @update:model-value="selectedAnimalOption">
        </MtFormMultipleSelection>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          v-model="search.number_cart"
          outlined
          label="会計番号"
          type="text"
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <!--UI only pulldown select 
        option1 : 全て ; default search all value 1
        optoin2 : 保険適用のみ対象（全社） ; value = 2 Search cart only where they have insurance "total_amount_insured > 0"
        optoin3 : 保険適用のみ対象（アニコム社） ; value =3 Search cart only where they have ANICOM insurance "total_amount_insured > 0"
        optoin4 : 保険適用のみ対象（iPet社） ; value = 4 Search cart only where they have iPET insurance "total_amount_insured > 0"
        option5 : 保険非適用のみ対象 value =5  Search cart only where they have NO insurance "total_amount_insured = 0"
        -->
        <MtFormPullDown
          v-model:selected="computedInsCartOption"
          :options="searchInsCartOption"
          label="保険適用区分"
          outlined
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <!--UI only pulldown select 
        option1 : 全て ; all cart conditions ; default
        optoin2 : 締め処理前のみ ; CH.flg_completed = 0 only 
        optoin3 : 締め処理後のみ ; CH.flg_completed = 1 only 
        optoin4 : 締め後の変更歴あり会計 ; CH.flg_cart_asked2 = 1 only
        -->
        <MtFormPullDown
          v-model:selected="computedProcessStatus"
          :options="searchCartProcessStatusOption"
          label="会計処理区分"
          outlined
        />
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12">
        <q-btn color="primary" @click="setDateRange('current')">
          <span>今月分</span>
        </q-btn>
        <q-btn class="q-mx-sm" color="primary" @click="setDateRange('prev')">
          <span>先月分</span>
        </q-btn>
        <q-btn color="primary" @click="setDateRange('beforePrev')">
          <span>先々月分</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
        <span>キャンセル</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" @click="fetchCartList">
        <span>適用</span>
      </q-btn>
    </div>
  </q-card-section>
</template>
