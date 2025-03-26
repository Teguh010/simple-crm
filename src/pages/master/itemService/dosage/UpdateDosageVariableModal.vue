<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahMessages from '@/utils/aahMessages'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import aahValidations from '@/utils/aahValidations'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useDosageVariableStore from '@/stores/dosage-variable'
import useCommonStore from '@/stores/common'
import { typeBodyWeightUnit } from '@/utils/enum'

const emits = defineEmits(['close'])
const props = defineProps({ data: Object, itemService: Object })

const dosageVariableStore = useDosageVariableStore()

const formData = reactive({
  id_item_service: '',
  id_cm_unit_medicine: '',
  id_item_service_unit: '',
  val_dose_min: '',
  val_dose_max: '',
  type_body_weight_unit: '',
  type_animal:0,
  default_val_dosage: null
})

const commonOptionList: any = ref([])
const commonOptionListTypeAnimal: any = ref([])

const unitMedicines: any = ref([])
const unitMedicinesDefault: any = reactive([])
const isEdit = ref(false)

const submit = () => {
  if (isEdit.value) {
    dosageVariableStore
      .updateDosageVariable(formData.id_dosage_variable, formData)
      .then(() => {
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    dosageVariableStore.submitDosageVariable(formData).then(() => {
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
  return true
}
const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await dosageVariableStore.destroyDosageVariable(
              formData?.id_dosage_variable
            )
            emits('close')
            return false
          }
        })
    }
  }
}
const closeModal = () => {
  emits('close')
}

const assignPageData = (data: any) => {
  if (data) {
    for (let key in data) {
      formData[key] = data[key]
    }
  }
}

onMounted(async () => {

  await useCommonStore().fetchPreparationCommonList({'code_common': [1, 4]})

  commonOptionList.value = useCommonStore().getCommonUnitOptionList
    .map((o: any) => ({value: o.id_common, label: o.name_common, status: 1, id_common: o.id_common,}))

  commonOptionListTypeAnimal.value = useCommonStore().getCommonTypeAnimalOptionList
    .map((o: any) => ({value: o.id_common, label: o.name_common, status: 1, id_common: o.id_common,}))

  unitMedicines.value = [...commonOptionList.value]
  unitMedicinesDefault.push(...commonOptionList.value)

  if (props.data?.id_dosage_variable) {
    isEdit.value = true
    // Update case
    assignPageData({ ...props.data })
  } else {
    isEdit.value = false
    // Create case
    formData.id_item_service = props.itemService?.id_item_service
    formData.id_item_service_unit = props.data?.id_item_service_unit
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        可変 有効成分量 範囲
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-md">
      <div class="col-lg-5 col-md-5 col-sm-12 ">
        <MtInputForm
          type="number"
          v-model="formData.val_dose_min"
          label="服用量範囲 下限"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-1">~</div>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtInputForm
          type="number"
          v-model="formData.val_dose_max"
          label="服用量範囲 上限"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtInputForm
          v-model="formData.default_val_dosage"
          label="有効成分の初期値"
          type="number"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtFilterSelect
          :options-default="unitMedicinesDefault"
          v-model:options="unitMedicines"
          v-model:selecting="formData.id_cm_unit_medicine"
          label="有効成分量 単位 *"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12 ">
        <MtFormPullDown
          type="selection"
          v-model:selected="formData.type_body_weight_unit"
          label="投与体重区分 *"
          :options="typeBodyWeightUnit"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12 q-mb-lg">
        <MtFormPullDown v-model:selected="formData.id_cm_animal" :options="commonOptionListTypeAnimal" class="col-4"
                        label="動物種別"
                        rules=""/>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
