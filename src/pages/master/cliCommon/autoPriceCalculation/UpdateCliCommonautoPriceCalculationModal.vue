<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate, getDaysBefore, getDateToday } from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import useCliCommonStore from '@/stores/cli-common'
import aahValidations from '@/utils/aahValidations'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useItemStore from '@/stores/items'
import useItemServiceUnitStore from '@/stores/item-service-units'
import {
  typePlusItemDefaultQuantity
} from '@/utils/enum'

const cliCommonStore = useCliCommonStore()
const itemStore = useItemStore()
const itemServiceUnitStore = useItemServiceUnitStore()

const emits = defineEmits(['close'])
const props = defineProps({
  modalTitle: {
    type: String,
    default: '処方料の初期数量設定'
  } ,
  commonObj: {
    type: Object
  },
  searchCallback: {
    type: Function
  },
})
const itemServiceList: any = ref([])
const itemServiceListDefault: any = reactive([])
const itemServiceUnitList: any = ref([])
const itemServiceUnitListDefault: any = reactive([])
const frequencyList: any = ref([])
const frequencyListDefault: any = reactive([])

const cliCommonForm = ref({
  id_cli_common: null,
  // date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_start: getDateToday(),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_cli_common: 22,
  name_cli_common: '',
  code_func1: '',
  code_func2: '',
  flg_func1: true,
  flg_func2: true,
  flg_etc1: false,
  flg_etc2: false,
  flg_etc3: false,
  memo_etc1: '',
  memo_etc2: '',
  memo_etc3: '',
  comment: '',
  text1: '',
  text2: '',
  code_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
  display_order: 9999
})
const isEdit = ref(false)

const itemServiceSelected = async (value: number) => {
  if (value) cliCommonForm.value.memo_etc1 = value
  else {
    cliCommonForm.value.memo_etc1 = ''
    cliCommonForm.value.memo_etc2 = ''
  }

  await itemServiceUnitStore.fetchItemServiceUnits({ id_item_service: value })
  itemServiceUnitList.value.length = 0
  itemServiceUnitListDefault.length = 0
  itemServiceUnitList.value = [...itemServiceUnitStore.getItemServiceUnitOptions]
  itemServiceUnitListDefault.push(...itemServiceUnitStore.getItemServiceUnitOptions)
}

const frequencySelected = async (value: any) => {
}

const closeModal = () => {
  emits('close')
}

const deleteRecord = async () => {
  await mtUtils.confirm(aahMessages.delete_ask, aahMessages.delete).then((confirmation) => {
    if (confirmation) {
      cliCommonForm.value.date_end = getDaysBefore(1) // set to 1 day before today
      save()
    }
  })
}

const formatData = async () => {
  let data = {... cliCommonForm.value}
  if(typeof cliCommonForm.value.code_func1 === 'object' && cliCommonForm.value.code_func1 !== null){
    cliCommonForm.value.code_func1 = cliCommonForm.value.code_func1.id_item_service
  }
  if(typeof cliCommonForm.value.code_func2 === 'object' && cliCommonForm.value.code_func2 !== null){
    cliCommonForm.value.code_func2 = cliCommonForm.value.code_func1.id_item_service_unit
  }
  if(typeof cliCommonForm.value.text1 === 'object' && cliCommonForm.value.text1 !== null){
    cliCommonForm.value.text1 = cliCommonForm.value.text1.value
  }
}

async function save() {
  await formatData()
  if (isEdit.value) {
    await cliCommonStore.updateClinicCommon(cliCommonForm.value.id_cli_common, cliCommonForm.value)
    emits('close')
    if(props.searchCallback){
      props.searchCallback()
    }
    await mtUtils.autoCloseAlert(aahMessages.success)
    return
  }
  await cliCommonStore.submitClinicCommon(cliCommonForm.value)
  await mtUtils.autoCloseAlert(aahMessages.success)
  emits('close')
  if(props.searchCallback){
    props.searchCallback()
  }
}

const init = async () => {
  await itemStore.fetchFilterItems({ flg_merge_price: true, flg_plus_item: true })
  // await itemStore.fetchFilterItems({ })
  itemServiceList.value.length = 0
  itemServiceListDefault.length = 0
  let rawitemServices = itemStore.getAllItems.filter((is => is.flg_plus_item || is.flg_merge_price))
  itemServiceList.value = [...rawitemServices]
  itemServiceListDefault.push(...rawitemServices)
  // frequencyList.value = [{value: 1, label: "1"}, {value: 2, label: "Per day"}, {value: 3, label: "Per dose"}]
  frequencyList.value = typePlusItemDefaultQuantity
  frequencyListDefault.push(... frequencyList.value)
}

onMounted(async () => {
  await init()
  if (props.commonObj && props.commonObj.id_cli_common) {
    isEdit.value = true
    let c_obj = {... props.commonObj}
    cliCommonForm.value = JSON.parse(JSON.stringify(c_obj))
    cliCommonForm.value.code_func1 = itemServiceList.value.find(i => i.id_item_service == c_obj.code_func1) 
    await itemServiceSelected(c_obj.code_func1)
    cliCommonForm.value.code_func2 = itemServiceUnitList.value.find(i => i.id_item_service_unit == c_obj.code_func2) 
    // cliCommonForm.value.text1 = [{value: 1, label: "1"}, {value: 2, label: "日数で指定"}, {value: 3, label: "回数で指定"}].find(i => i.value == c_obj.text1) 
    cliCommonForm.value.text1 = typePlusItemDefaultQuantity.find(i => i.value == c_obj.text1) 
  }
})
</script>

<template>
  <q-form @submit="save">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        {{ modalTitle }}
      </q-toolbar-title>
    </MtModalHeader>
    <div class="modal-content">
      <div class="row q-my-md q-mx-md">
        <div class="col-6">
          <MtInputForm
            v-model="cliCommonForm.name_cli_common"
            label="設定名"
            type="text"
            tabindex="1"
            autofocus
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>      
      <div class="row q-mt-lg q-mx-md">
        <div class="col-6" >
          <MtFilterSelect
            v-model:selecting="cliCommonForm.code_func1"
            @update:selecting="itemServiceSelected"
            class="q-mr-sm"
            label="商品名"
            :options="itemServiceList"
            :options-default="itemServiceListDefault"
          />
        </div>
        <div v-if="cliCommonForm.code_func1" class="col-6">
          <MtFilterSelect
            v-model:selecting="cliCommonForm.code_func2"
            class="q-mr-sm"
            label="品名包装単位名"
            :options="itemServiceUnitList"
            :options-default="itemServiceUnitListDefault"
          />
        </div>
      </div>
      <div class="row q-my-lg q-mx-md">
        <div class="col-6" >
          <MtFilterSelect
            v-model:selecting="cliCommonForm.text1"
            @update:selecting="frequencySelected"
            class="q-mr-sm"
            label="初期値設定"
            :options="frequencyList"
            :options-default="frequencyListDefault"
          />
        </div>
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="cliCommonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
          />
        </div>
        <div v-if="isEdit" class="col text-right">
          <q-btn flat class="text-darkred" @click="deleteRecord">
            <q-icon name="delete_forever" />
            削除する
          </q-btn>
        </div>
      </div>

    </div>

    <q-card-section class="q-bt bg-white">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn
            class="bg-grey-100 text-grey-800"
            outline
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
            <span>保存</span>
          </q-btn>
        </div>
        <div></div>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>

.modal-content{

}
</style>
