<script lang="ts" setup>
import { computed, onMounted, reactive, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate, getDaysBefore } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import aahMessages from '@/utils/aahMessages'
import useCliCommonStore from '@/stores/cli-common'
import aahValidations from '@/utils/aahValidations'
import MtInputColorPicker from '@/components/form/MtInputColorPicker.vue'
import { codeCliCommonList, typeUnitBit } from '@/utils/enum'
import { CliCommon } from '@/types/types'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import { storeToRefs } from 'pinia'

type FormLabelsType = {
  codeCliLabel: string
  nameCliLabel: string
  flgFunc1CliLabel: string
  codeFunc1CliLabel: string
  flgFunc2CliLabel?: string
  codeFunc2CliLabel?: string
  text1CliLabel: string
  text2CliLabel?: string
}

const cliCommonStore = useCliCommonStore()
const { getCliCommonOptionList } = storeToRefs(cliCommonStore)

const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    modalTitle?: string
    commonObj?: CliCommon
    formLabels?: FormLabelsType
    code_cli_common?: number
    lastCD: number
  }>(),
  {
    modalTitle: '状態評価（入院管理）',
    commonObj: () => {
      return {} as CliCommon
    },
    formLabels: () => {
      return {
        codeCliLabel: '状態評価（入院管理）',
        nameCliLabel: '選択肢',
        flgFunc1CliLabel: '機能1',
        codeFunc1CliLabel: '選択肢番号',
        text1CliLabel: '機能名1',
        flgFunc2CliLabel: '機能2',
        codeFunc2CliLabel: '表示アイコン',
        text2CliLabel: 'アイコン色'
      } as FormLabelsType
    },
    code_cli_common: 0,
    lastCD: 0
  }
)
const CODE_CLI_WITH_COLOR_PICKER = [51, 52, 53, 54, 55, 56, 57, 58]
const cliCommonFormCheckBox = ref([])
const cliCommonForm = reactive({
  id_cli_common: null,
  date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_cli_common: props.code_cli_common,
  name_cli_common: '',
  code_func1: null as null | string,
  code_func2: '',
  flg_func1: false,
  flg_func2: false,
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
const displayIcons = [
  {
    value: '1',
    label: '●'
  },
  {
    value: '2',
    label: '▲'
  },
  {
    value: '3',
    label: '▼'
  },
  {
    value: '4',
    label: '〇'
  }
]


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

const assignPageData = (newData: any) => {
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
const save = async () => {
  // create case
    if (isDuplicateCodeFunc1Computed.value && !isEdit.value) {
    await mtUtils.autoCloseAlert('番号が重複しています！');
    return
  }
  
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
  if (parseInt(cliCommonForm.code_func1) === props.lastCD) {
    return mtUtils.autoCloseAlert("番号が重複しています！")
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

const isBitSet = (number: any, bitValue: any) => {
  return (number & bitValue) === bitValue
}

const deleteRecord = async () => {
  await mtUtils.confirm(aahMessages.delete_ask, aahMessages.delete).then((confirmation) => {
    if (confirmation) {
      cliCommonForm.date_end = getDaysBefore(1) // set to 1 day before today
      save()
    }
  })
}

const isError = computed(() => {
  return !isEdit.value && parseInt(cliCommonForm.code_func1) === props.lastCD
})

const isDuplicateCodeFunc1Computed = computed(() => {
  return mtUtils.isDuplicateCodeFunc1(
    getCliCommonOptionList.value,
    cliCommonForm.code_func1,
    isEdit.value
  )
})

onMounted(() => {
  cliCommonFormCheckBox.value = [...typeUnitBit]

  cliCommonForm.code_func1 = mtUtils.getNextCodeFunc1(
    getCliCommonOptionList.value
  ).toString()

  if (props.commonObj && props.commonObj.id_cli_common) {
    assignPageData(props.commonObj)
    isEdit.value = true
    cliCommonForm.code_cli_common = parseInt(props.commonObj.code_cli_common)
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
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtFormPullDown
            v-model="cliCommonForm.code_cli_common"
            :label="formLabels.codeCliLabel"
            :options="
              codeCliCommonList.filter((v) => {
                return v.value > 50 && v.value < 60
              })
            "
            disable
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-model="cliCommonForm.code_func1"
            :label="formLabels.codeFunc1CliLabel"
            type="text"
            :readonly="isEdit"
            :is-error="isDuplicateCodeFunc1Computed"
          >
            <template #error>
              番号が重複しています！
            </template>
          </MtInputForm>
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtInputForm
            v-model="cliCommonForm.name_cli_common"
            :label="formLabels.nameCliLabel"
            type="text"
            :rules="[aahValidations.validationRequired]"
            autofocus
            tabindex="1"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtFormPullDown
            v-model="cliCommonForm.code_func2"
            :label="formLabels.codeFunc2CliLabel"
            :options="displayIcons"
            tabindex="2"
          />
        </div>
        <div
          class="col-lg-6 col-md-6 col-sm-6"
        >
          <MtInputColorPicker
            :label="formLabels.text2CliLabel"
            v-model="cliCommonForm.text2"
            tabindex="3"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-model="cliCommonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
            tabindex="4"
          />
        </div>
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
          <q-btn class="q-ml-md" tabindex="5" color="primary" type="submit" unelevated>
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
