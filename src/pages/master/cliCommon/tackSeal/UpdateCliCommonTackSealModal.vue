<script lang="ts" setup>
import { onMounted, reactive, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate, getDaysBefore, getDateToday } from '@/utils/aahUtils'
import aahMessages from '@/utils/aahMessages'
import useCliCommonStore from '@/stores/cli-common'
import aahValidations from '@/utils/aahValidations'
import { CliCommon } from '@/types/types'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import useCategoryStore from '@/stores/categories'
import usePrintStore from '@/stores/prints'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useItemStore from '@/stores/items'
import useItemServiceUnitStore from '@/stores/item-service-units'

const cliCommonStore = useCliCommonStore()
const categoryStore = useCategoryStore()
const printStore = usePrintStore()
const itemStore = useItemStore()
const itemServiceUnitStore = useItemServiceUnitStore()

const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    modalTitle: string
    commonObj: CliCommon,
    searchCallback: Function
  }>(),
  {
    modalTitle: 'ケース',
    commonObj: () => {
      return {} as CliCommon
    }
  }
)
const category = ref({
  id_category1: -1,
  id_category2: -1,
})
const printList: any = ref([])
const printListDefault: any = reactive([])
const itemServiceList: any = ref([])
const itemServiceListDefault: any = reactive([])
const itemServiceUnitList: any = ref([])
const itemServiceUnitListDefault: any = reactive([])
const cliCommonForm = ref({
  id_cli_common: null,
  // date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_start: getDateToday(),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_cli_common: 21,
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

const category1Selected = async (value: number) => {
  const findCategory = categoryStore.getAllCategories.find((item) => item.id_category == value)
  category.value.id_category1 = value
  if (findCategory?.code_category) cliCommonForm.value.code_func1 = findCategory?.code_category
  else {
    cliCommonForm.value.code_func1 = ''
    cliCommonForm.value.text1 = ''
    cliCommonForm.value.memo_etc1 = ''
    cliCommonForm.value.memo_etc2 = ''
  }
}

const category2Selected = async (value: number) => {
  const findCategory = categoryStore.getAllCategories.find((item) => item.id_category == value)
  category.value.id_category2 = value
  if (findCategory?.code_category) cliCommonForm.value.text1 = findCategory?.code_category
  else {
    cliCommonForm.value.text1 = ''
    cliCommonForm.value.memo_etc1 = ''
    cliCommonForm.value.memo_etc2 = ''
  }

  await itemStore.fetchFilterItems({ id_category2: value })
  itemServiceList.value.length = 0
  itemServiceListDefault.length = 0
  itemServiceList.value = [...itemStore.getAllItems]
  itemServiceListDefault.push(...itemStore.getAllItems)
}

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

async function save() {
  // create case
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

onMounted(async () => {
  printListDefault.length = 0
  printList.value.length = 0
  printListDefault.push(...printStore.getAllPrints.map((item) => (
    { 
      value: item.id_print, 
      label: `${item.name_print} (${typePrint.find((i) => i.value == item.type_print)?.label})`
    }
  )))
  printList.value = [...printListDefault]

  if (props.commonObj && props.commonObj.id_cli_common) {
    isEdit.value = true
    cliCommonForm.value = JSON.parse(JSON.stringify(props.commonObj))
    category.value.id_category1 = cliCommonForm.value.id_category1
    category.value.id_category2 = cliCommonForm.value.id_category2
    if (cliCommonForm.value.id_category1) category1Selected(cliCommonForm.value.id_category1)
    if (cliCommonForm.value.id_category2) await category2Selected(cliCommonForm.value.id_category2)
    if (cliCommonForm.value.memo_etc1) itemServiceSelected(parseInt(cliCommonForm.value.memo_etc1))
    if (cliCommonForm.value.memo_etc2) cliCommonForm.value.memo_etc2 = parseInt(cliCommonForm.value.memo_etc2)
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
    <q-scroll-area class="modal-content">
      <q-card-section class="row q-col-gutter-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            v-model="cliCommonForm.name_cli_common"
            label="タックシール設定名"
            type="text"
            tabindex="1"
            autofocus
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <!-- <div class="col-12 q-mt-md">
          <div class="row q-col-gutter-md">
            <div tabindex="200" class="col-lg-3 col-md-4 col-sm-6">
              <MtFormInputDate
                v-model:date="cliCommonForm.date_start"
                label="有効開始日"
              ></MtFormInputDate>
            </div>
            <div tabindex="201" class="col-lg-3 col-md-4 col-sm-6">
              <MtFormInputDate
                v-model:date="cliCommonForm.date_end"
                label="有効終了日"
              ></MtFormInputDate>
            </div>
          </div>
        </div> -->
        <!-- <div tabindex="202" class="col-lg-3 col-md-4 col-sm-6">
          <MtInputForm
            v-model="cliCommonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
          />
        </div> -->
        <div v-if="isEdit" class="col text-right">
          <q-btn flat class="text-darkred" @click="deleteRecord">
            <q-icon name="delete_forever" />
            削除する
          </q-btn>
        </div>
      </q-card-section>
    </q-scroll-area>
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
.c-grid {
  display: grid;
  grid-template-columns: 120px auto 120px;
  flex-direction: column;
}

.first-item {
  max-width: 100px;
}

.q-item {
  min-height: auto !important;
  padding: 2px 0 !important;
}

.modal-content {
  height: 45vh;
}
</style>
