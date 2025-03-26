<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import { calculateDate } from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import useDoseStore from '@/stores/dose-frequencies'
import useCommonStore from '@/stores/common'

const isEdit = ref(false)

type TextTemplateListType = {
  title: string
  flg_title: boolean
  attr: {
    class: string
  }
  isSelected: boolean
}

const props = defineProps({ prescription: null, prescriptionDetail: null, mode: null })
const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}
const textTemplateStore = useTextTemplateStore()
const { getTemplates } = storeToRefs(textTemplateStore)
const doseStore = useDoseStore()

const typeMemoSelected = ref(0)
const addTemplateModalFlg = ref(false)
const disableHeaderUpdate = ref(false)
const textTemplatesList = ref<Array<TextTemplateListType>>([])

const data = ref({
  name_prescription_display: '',
  id_prescription_detail: null,
  memo_alert: null,
  memo_dose: null,
  memo_clinic_prep: null,
  type_detail: 1
})

const filteredOptionList = ref([])
const typeMedicineOptionList: any = ref([])
const typeMedicineDefaultOptionList: any = reactive([])

const openAddTextTemplateModal = async (value: number) => {
  typeMemoSelected.value = value
  await textTemplateStore.fetchTemplates({ type_text_template: value })

  textTemplatesList.value = getTemplates.value.filter((template) => {
    return template.type_text_template === value
  }).map((template: any) => {
    return {
      title: template.memo_template,
      flg_title: template.flg_title,
      attr: {
        class: template.flg_title ? 'bg-grey-300' : ''
      },
      isSelected: false
    }
  })

  addTemplateModalFlg.value = true
}

const handleUpdateMemo = (value: string, type: number) => {
  if (type === 42) {
    if (data.value.memo_dose) {
      data.value.memo_dose = `${data.value.memo_dose} ${value}`
    } else {
      data.value.memo_dose = value
    }
    return
  }
  if (type === 44 || type === 43) {
    if (data.value.memo_alert) {
      data.value.memo_alert = `${data.value.memo_alert} ${value}`
    } else {
      data.value.memo_alert = value
    }
    return
  }
  if (type === 46) {
    const memo_clinic_prep = data.value.memo_clinic_prep
    if (memo_clinic_prep) {
      data.value.memo_clinic_prep = `${memo_clinic_prep} ${value}`
    } else {
      data.value.memo_clinic_prep = value
    }
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      const confirmation = await mtUtils.confirm(
        aahMessages.delete_ask,
        aahMessages.delete
      )
      if (confirmation) {
        const response = await mtUtils.callApi(
          selectOptions.reqMethod.DELETE,
          `/UpdPrescriptionDetailNo/${data.value.id_prescription_detail}`,
          {}
        )
        if (response) {
          await mtUtils.autoCloseAlert('一包化のタイトルを削除しました')
        }
      }
    }
  }
  closeModal()
}
const submit = async () => {
  if (data.value.id_prescription_detail && isEdit.value) {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.PUT,
      `/UpdPrescriptionDetailNo/${data.value.id_prescription_detail}`,
      {
        ...data.value
      }
    )
    if (response) {
      await mtUtils.autoCloseAlert('一包化のタイトルを更新しました')
    }
    closeModal()
    return
  }
  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/UpdPrescriptionDetailNo',
    {
      id_prescription: props.prescription.id_prescription,
      id_pet: props.prescription.id_pet,
      name_prescription_display: data.value.name_prescription_display,
      flg_group_title: true,
      row: props.prescription.prescription_detail_list.length + 1,
      prescription_detail_ref_list: props.mode && props.mode == 'merge' ? props.prescription.prescription_detail_list.filter((v) => v.checked).map(v => v.id_prescription_detail) : null,
      type_detail: props.prescription.prescription_detail_list.filter((v) => v.checked) ? 5 : 4,
      memo_alert: data.value.memo_alert,
      memo_dose: data.value.memo_dose,
      memo_clinic_prep: data.value.memo_clinic_prep,
      id_dosage_frequency: data.value.id_dosage_frequency,
      total_days_dose: data.value.total_days_dose,
      date_start: data.value.date_start,
      name_medicine_format: data.value.name_medicine_format,
      id_employee_staff: data.value.id_employee_staff
    }
  )
  if (response) {
    closeModal()
    await mtUtils.autoCloseAlert('一包化タイトルを作成しました')
  }
}

function selectedTypeMedicineFormat(value) {
  if (!value) {
    data.value.name_medicine_format = ''
    return
  }
  data.value.name_medicine_format =
    useCommonStore().getCommonTypeMedicineFormatOptionList.find(
      (v: any) => v.id_common == value
    )?.name_common
}


onMounted(async () => {
  filteredOptionList.value = doseStore.getAllDoses
  useCommonStore().getCommonTypeMedicineFormatOptionList
    .filter((v) => ![8, 9, '8', '9'].includes(v.code_func1)).map((o: any) => {
    typeMedicineDefaultOptionList.push(o)
  })
  typeMedicineOptionList.value = [...typeMedicineDefaultOptionList]

  if (props.prescriptionDetail) {
    data.value = {
      ...props.prescriptionDetail
    }
    isEdit.value = true
    return
  }

  data.value.type_detail = 4
  if (props.mode && props.mode == 'merge') {
    data.value = {
      ...props.prescription?.prescription_detail_list.filter((v) => v?.checked)[0]
    }

    data.value.name_prescription_display = `[合剤] ${
      props?.prescription?.prescription_detail_list
        .filter((v) => v?.checked)
        .map((v) => v?.name_prescription_display)
        .join(', ')
    }`
      
    data.value.memo_alert = props?.prescription?.prescription_detail_list
      .filter((v) => v?.checked)
      .map((v) => v?.memo_alert)
      .filter((v) => v !== null && v !== '' && v !== undefined)
      .join('\n')
    data.value.memo_dose = props?.prescription?.prescription_detail_list
      .filter((v) => v?.checked)
      .map((v) => v?.memo_dose)
      .filter((v) => v !== null && v !== '' && v !== undefined)
      .join('\n')
    data.value.memo_clinic_prep = props?.prescription?.prescription_detail_list
      .filter((v) => v?.checked)
      .map((v) => v?.memo_clinic_prep)
      .filter((v) => v !== null && v !== '' && v !== undefined)
      .join('\n')
    data.value.type_detail = 5
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <div class="row">
          <div class="col row items-center">合剤</div>
          <div v-if="isEdit" class="col-1">
            <q-btn class="q-mx-sm" flat round @click="openMenu">
              <q-icon name="more_horiz" size="xs" />
            </q-btn>
          </div>
        </div>
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <p v-if="!isEdit && props.mode === 'merge'" class="text-center">合成医薬品名を入力してください。</p>
      <p v-else-if="!isEdit && props.mode !== 'merge'" class="text-center">一包化する際のタイトルをご入力ください。</p>
      <div class="q-mr-sm">
        <MtInputForm
          v-model="data.name_prescription_display"
          label="表示名"
          type="text"
        />
      </div>
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-auto">服用頻度 *</div>
        <div
          class="col-6 q-pt-sm"
        >
          <MtFormPullDown
            v-model:selected="data.id_dosage_frequency"
            :disable="disableHeaderUpdate"
            :options="filteredOptionList"
            label="その他指定頻度"
            @update:selected="selectedIdDosageFrequency"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col">
          <MtFormInputNumber
            v-model:value="data.total_days_dose"
            :label="
              data.type_medicine_dosage == '4'
                ? '服用回数'
                : '服用日数 *'
            "
            :rules="[aahValidations.validationRequired]"
            class="field-right-text"
            mode="dosage"
            required
            @update:value="
              () => {
                data.date_end = calculateDate(
                  data.date_start,
                  data.total_days_dose,
                  typeDoseUI
                )
              }
            "
          />
        </div>
        <div class="col">
          <MtFormInputDate
            v-model:date="data.date_start"
            :readonly="disableHeaderUpdate"
            :rules="[aahValidations.validationRequired]"
            label="服用 開始日 *"
            required
            @update:date="
              (value) => {
                data.total_days_dose = calculateDay1(
                  data.date_start,
                  data.date_end,
                  typeDoseUI
                )
                onUpdateStartDate(value)
              }
            "
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col">
          <MtFilterSelect
            v-model:options="typeMedicineOptionList"
            v-model:selecting="data.name_medicine_format"
            :options-default="typeMedicineDefaultOptionList"
            :readonly="disableHeaderUpdate"
            :rules="[aahValidations.validationRequired]"
            label="処方時の薬剤形状 *"
            required
            @update:selecting="selectedTypeMedicineFormat"
          />
        </div>
        <div class="col">
          <InputEmployeeOptGroup
            v-model="data.id_employee_staff"
            label="記録者名"
            show-select-default-employee
            type-occupation="staff"
            @update:select-default-employee="selectDefaultEmployee"
          />
        </div>
      </div>
      <div v-if="data.type_detail == 5 " class="q-mr-sm">
        <MtInputForm
          v-model="data.memo_dose"
          autogrow
          label="服用メモ"
          type="text"
        >
          <template #append>
            <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(42)" />
          </template>
        </MtInputForm>
      </div>
      <div v-if="data.type_detail == 5" class="q-mr-sm">
        <MtInputForm
          v-model="data.memo_alert"
          autogrow
          label="注意事項"
          type="text"
        >
          <template #append>
            <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(44)" />
          </template>
        </MtInputForm>
      </div>
      <div v-if="data.type_detail === 5" class="q-mr-sm">
        <MtInputForm
          v-model="data.memo_clinic_prep"
          autogrow
          label="調剤指示（院内メモ）"
          type="text"
        >
          <template #append>
            <q-icon name="add" class="cursor-pointer" @click="openAddTextTemplateModal(46)" />
          </template>
        </MtInputForm>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="一包化タイトル"
    :options="textTemplatesList"
    :data="data"
    :single-option="true"
    @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
  />
</template>
