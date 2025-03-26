<script lang="ts" setup>
import { onMounted, reactive, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import { formatDate, getDaysBefore } from '@/utils/aahUtils'
import selectOptions from '@/utils/selectOptions'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtInputColorPicker from '@/components/form/MtInputColorPicker.vue'
import { typeUnitBit } from '@/utils/enum'
import { Common } from '@/types/types'

type FormLabelsType = {
  codeCliLabel: string
  nameCliLabel: string
  flgFunc1CliLabel: string
  codeFunc1CliLabel: string,
  flgFunc2CliLabel?: string
  codeFunc2CliLabel?: string,
  text1CliLabel: string
  text2CliLabel?: string
}

const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    modalTitle: string
    commonObj: Common
    formLabels: FormLabelsType
  }>(),
  {
    modalTitle: 'IDEXX検査項目',
    commonObj: () => {
      return {} as Common
    },
    formLabels: () => {
      return {
        nameCliLabel: 'IDEXX検査項目',
        codeFunc1CliLabel: '機能CD1',
        text1CliLabel: '機能名1'
      } as FormLabelsType
    }
  }
)
const cliCommonForm = reactive({
  id_common: null,
  date_start: formatDate(new Date(1000, 1, 1), 'YYYY/MM/DD'),
  date_end: formatDate(new Date(9999, 1, 1), 'YYYY/MM/DD'),
  code_common: props.code_common,
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
const isEdit = ref(false)

function assignPageData(newData: any) {
  if (newData?.id_common) {
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
  cliCommonForm.date_start = formatDate(new Date(1000, 1, 1))
  if (cliCommonForm.flg_func2) {
    cliCommonForm.date_end = formatDate(new Date(9999, 11, 31))
  }

  if (!cliCommonForm.flg_func2) {
    cliCommonForm.date_end = getDaysBefore(1)
  }

  if (isEdit.value) {
    const res = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `mst/common/${cliCommonForm.id_common}`,
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
    'mst/common',
    { ...cliCommonForm }
  )
  if (res) {
    await mtUtils.autoCloseAlert(aahMessages.success)
    emits('close')
  }
}

onMounted(() => {
  console.log(props.commonObj)
  if (props.commonObj && props.commonObj.id_common) {
    assignPageData(props.commonObj)
    isEdit.value = true
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
        <div tabindex="1" class="col-lg-12 col-md-12 col-sm-12">
          <MtInputForm
            v-model="cliCommonForm.name_common"
            :label="formLabels.nameCliLabel"
            type="text"
            :rules="[aahValidations.validationRequired]"
            autofocus
            tabindex="1"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-6">
          <MtInputForm
            v-model="cliCommonForm.memo_etc1"
            label="グループ区分"
            type="text"
            tabindex="3"
          />
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12">
          <q-toggle
            v-model="cliCommonForm.flg_func2"
            color="blue"
            :label="cliCommonForm.flg_func2 ? '使用' : '不使用'"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            v-model="cliCommonForm.display_order"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
            tabindex="4"
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
