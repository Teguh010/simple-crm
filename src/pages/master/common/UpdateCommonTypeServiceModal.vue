<script lang="ts" setup>
import { onMounted, reactive, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate, getDaysBefore } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import aahMessages from '@/utils/aahMessages'
import useCliCommonStore from '@/stores/cli-common'
import aahValidations from '@/utils/aahValidations'
import { Common } from '@/types/types'
import MtInputColorPicker from '@/components/form/MtInputColorPicker.vue'

type FormLabelsType = {
  codeLabel: string
  nameLabel: string
  flgFunc1Label: string
  codeFunc1Label: string,
  flgFunc2Label?: string
  codeFunc2Label?: string,
  text1Label: string
  text2Label?: string
}

const cliCommonStore = useCliCommonStore()

const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    modalTitle: string
    commonObj: Common
    formLabels: FormLabelsType
  }>(),
  {
    modalTitle: 'サービス区分',
    commonObj: () => {
      return {} as Common
    },
    formLabels: () => {
      return {
        nameLabel: 'サービス区分',
        codeFunc1Label: '機能CD1',
        text1Label: '機能名1'
      } as FormLabelsType
    }
  }
)

const commonForm = reactive({
  id_common: null,
  date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_common: props.commonObj.code_common,
  name_common: '',
  code_func1: '',
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

async function checkedFlg(event: any, checkbox: any) {
  if (event) {
    commonForm.code_func1 =
      parseInt(commonForm.code_func1) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(commonForm.code_func1, checkbox.value)) {
    commonForm.code_func1 =
      parseInt(commonForm.code_func1) - parseInt(checkbox.value)
  }
}

function assignPageData(newData: any) {
  if (newData?.id_common) {
    for (let key in commonForm) {
      commonForm[key] = newData[key]
    }
  }
}

const closeModal = () => {
  emits('close')
}

async function save() {
  const res = await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `mst/common/${commonForm.id_common}`,
    { ...commonForm }
  )
  if (res) {
    emits('close')
    await mtUtils.autoCloseAlert(aahMessages.success)
  }

  return
}

function isBitSet(number: any, bitValue: any) {
  return (number & bitValue) === bitValue
}

const updateChecked = (value: boolean) => {
  if (value) {
    commonForm.date_end = formatDate(new Date(9999, 11, 31))
    return
  }
  commonForm.date_end = getDaysBefore(1)
  return
}

onMounted(() => {
  assignPageData(props.commonObj)
  if (props?.commonObj?.code_common == '11') {
    commonForm.flg_etc1 = true
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
        <div tabindex="1" class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-model="commonForm.name_common"
            :label="formLabels.nameLabel"
            type="text"
            :rules="[aahValidations.validationRequired]"
            autofocus
            tabindex="1"
            readonly
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputColorPicker :label="formLabels.text1Label" tabindex="2" v-model="commonForm.text1" />
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12 q-mt-md">
          <q-toggle
            v-model="commonForm.flg_func2"
            color="blue"
            :label="commonForm.flg_func2 ? '使用' : '不使用'"
            @update:model-value="updateChecked"
          />
        </div>
        <!-- <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            v-model="commonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
            tabindex="4"
          />
        </div> -->
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
  height: 20vh;
}
</style>
