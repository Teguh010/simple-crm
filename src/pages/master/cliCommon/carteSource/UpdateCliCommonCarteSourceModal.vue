<script lang="ts" setup>
import { onMounted, reactive, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import aahMessages from '@/utils/aahMessages'
import useCliCommonStore from '@/stores/cli-common'
import aahValidations from '@/utils/aahValidations'
import MtInputColorPicker from '@/components/form/MtInputColorPicker.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { typeUnitBit, typeMemoCarteSource } from '@/utils/enum'
import { CliCommon } from '@/types/types'

type FormLabelsType = {
  codeCliLabel: string
  nameCliLabel: string
  codeFunc1CliLabel: string,
  text1CliLabel: string
}

const cliCommonStore = useCliCommonStore()

const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    modalTitle: string
    commonObj: CliCommon
    formLabels: FormLabelsType
  }>(),
  {
    modalTitle: 'カルテ種別',
    commonObj: () => {
      return {} as CliCommon
    },
    formLabels: () => {
      return {
        codeCliLabel: '共通CD',
        nameCliLabel: 'カルテ区分名',
        codeFunc1CliLabel: 'カルテ区分CD',
        text1CliLabel: 'メモカルテ背景色'
      } as FormLabelsType
    }
  }
)
const CODE_CLI_WITH_COLOR_PICKER = [11]
const cliCommonFormCheckBox = ref([])
const cliCommonForm = reactive({
  id_cli_common: null,
  date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_cli_common: props.code_cli_common,
  name_cli_common: '',
  // code_func1: {
  //   default: null,
  //   type: String | Number
  // },
  code_func1: '',
  code_func2: '',
  flg_func1: false,
  comment: '',
  text1: '',
  code_clinic: JSON.parse(localStorage.getItem('clinic'))?.value,
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
  display_order: 9999
})
const isEdit = ref(false)

async function checkedFlg(event: any, checkbox: any) {
  if (event) {
    cliCommonForm.code_func1 =
      parseInt(cliCommonForm.code_func1) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(cliCommonForm.code_func1, checkbox.value)) {
    cliCommonForm.code_func1 =
      parseInt(cliCommonForm.code_func1) - parseInt(checkbox.value)
  }
}

function assignPageData(newData: any) {
  if (newData?.id_cli_common) {
    for (let key in cliCommonForm) {
      cliCommonForm[key] = newData[key]
    }
  }
}

const closeModal = () => {
  emits('close')
}
const model = ref('')
async function save() {
  // create case
  if (cliCommonForm.code_func2?.value) cliCommonForm.code_func2 = cliCommonForm.code_func2?.value
  if (isEdit.value) {
    const res = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `mst/clinic_common/${cliCommonForm.id_cli_common}`,
      { ...cliCommonForm }
    )
    if (res) {
      emits('close')
      await mtUtils.autoCloseAlert(aahMessages.success)
    }

    return
  }
  const res = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'mst/clinic_common',
    { ...cliCommonForm }
  )
  if (res) {
    await mtUtils.autoCloseAlert(aahMessages.success)
    emits('close')
  }
}

function isBitSet(number: any, bitValue: any) {
  return (number & bitValue) === bitValue
}

onMounted(() => {
  cliCommonFormCheckBox.value = [...typeUnitBit]
  if (props.commonObj && props.commonObj.id_cli_common) {
    assignPageData(props.commonObj)
    isEdit.value = true
    cliCommonForm.code_func2 = typeMemoCarteSource.find((v) => v.value == cliCommonForm.code_func2)
    if (props.commonObj.code_cli_common == 4) {
      cliCommonFormCheckBox.value = cliCommonFormCheckBox.value.map(
        (o: any) => ({
          ...o,
          checked: isBitSet(props.commonObj.code_func1, o.value)
        })
      )
    }
  }
  if (props?.commonObj?.code_cli_common == '11') {
    cliCommonForm.flg_etc1 = true
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
            :label="formLabels.nameCliLabel"
            type="text"
            tabindex="1"
            autofocus
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div
          v-if="cliCommonForm.flg_func1 && CODE_CLI_WITH_COLOR_PICKER.includes(Number(props.commonObj.code_cli_common))"
          tabindex="2"
          class="col-lg-6 col-md-6 col-sm-12"
        >
          <MtInputColorPicker :label="formLabels.text1CliLabel" v-model="cliCommonForm.text1" />
        </div>
        <div          
          tabindex="3"
          class="col-lg-6 col-md-6 col-sm-12"
        >
          <MtFormPullDown
            type="selection"
            label="カルテ区分"            
            :options="typeMemoCarteSource"
            v-model="cliCommonForm.code_func2"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            v-model="cliCommonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
            tabindex="5"
          />
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
