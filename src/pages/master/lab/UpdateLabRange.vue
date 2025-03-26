<script setup lang="ts">
import { onMounted, reactive, PropType, ref } from 'vue';
import MtInputForm from '@/components/form/MtInputForm.vue';
// import useCommonStore from '@/stores/common';
import mtUtils from '@/utils/mtUtils';
import aahMessages from '@/utils/aahMessages';
import MtModalHeader from '@/components/MtModalHeader.vue';
import { LAB_RANGE } from './types_lab';
import useLabRangeStore from "@/stores/lab-range";
import { typePetGender } from '@/utils/enum';
import useCommonStore from '@/stores/common';
import { storeToRefs } from 'pinia';
import MtFormPullDown from '@/components/form/MtFormPullDown.vue';
import MtFormInputDate from '@/components/form/MtFormInputDate.vue';
import { dateFormat } from '@/utils/aahUtils';
import MtFilterSelect from '@/components/MtFilterSelect.vue';
import useLabStore from '@/stores/labs';
import useCategoryStore from '@/stores/categories';
import aahValidations from '@/utils/aahValidations';
import OptionModal from '@/components/OptionModal.vue';

export type LabRangeItem = Partial<Omit<LAB_RANGE, 'id_category2_lb1'> & {
  id_category: string | null,
  id_category2_lb1: string | null,
  id_clinic: string | null
}>

const deviceList: any = ref([])
const deviceListDefault: any = reactive([])
const emits = defineEmits(['close'])
const commonStore = useCommonStore()
const labRangeStore = useLabRangeStore()
const labStore = useLabStore()
const categoryStore = useCategoryStore()
const categoryList = ref<typeof categoryStore.getCategoriesLB1>([])
const categoryListDefault = reactive<typeof categoryStore.getCategoriesLB1>([])
const { getCommonTypeAnimalOptionList, getCommonDeviceOptionList, getCommonDeviceOptionActiveList } = storeToRefs(commonStore)
const { getLab } = storeToRefs(labStore)
const minAgeInput = ref()

const initialData: LabRangeItem = {
  id_lab_range: '',
  code_clinic: '',
  id_lab: '',
  id_cm_device: '',
  id_cm_animal: null,
  id_category2_lb1: null,
  pet_gender: '',
  min_age_mon: '',
  max_age_mon: '',
  low_critical: '',
  low: '',
  high: '',
  high_critical: '',
  date_start: '',
  date_end: '',
}

export interface SaveCallbackProps {
  isSaved: boolean,
  data: LabRangeItem | null,
  delete?: boolean
}

const props = defineProps({
  data: { type: Object as PropType<LAB_RANGE>, },
  isEdit: { type: Boolean, },
  lab_set_type: { type: Number },
  category_lb1: { type: Object },
  device: { type: Object },
  lab_set: { type: Object, required: false },
  lab_device: { type: Object, required: false },
  saveCallback: {
    type: Function as PropType<(value: SaveCallbackProps) => void>,
    required: false
  },
  // use placeholder for unsaved lab set item
  usePlaceholder: Object
})

const formData = reactive<LabRangeItem>(initialData)

const minAgeValidation = (val: string) => {
  if (!val || !formData.max_age_mon) return true
  const maxAgeMon = typeof formData.max_age_mon === 'string' ? parseInt(formData.max_age_mon) : formData.max_age_mon
  if (parseInt(val) > maxAgeMon) {
    return '最大月齢より小さい数値を入力してください。'
  }
  return true
}

const minAgeChange = (val: string) => {
  if (!formData.max_age_mon && val !== '') {
    formData.max_age_mon = (parseInt(val) + 1).toString()
  }
}

const maxAgeChange = () => {
  minAgeInput.value?.validate()

}

const submit = async () => {
  if (formData.date_start) formData.date_start = dateFormat(formData.date_start) + ' 00:00:00'
  if (formData.date_end) formData.date_end = dateFormat(formData.date_end) + ' 00:00:00'
  if (getLab.value) formData.id_lab = getLab.value?.id_lab
  if (localStorage.getItem('id_clinic')) formData.id_clinic = localStorage.getItem('id_clinic')
  if (!formData.id_lab_range || formData.id_lab_range == '') delete formData.id_lab_range

  let payload: LabRangeItem = {}
  Object.keys(formData).forEach((v) => {
    const formDataProp: LabRangeItem[keyof LabRangeItem] = formData[v as keyof LabRangeItem]
    if (v == 'id_category2_lb1' && props.lab_set_type == 1) {
      if (typeof(formDataProp) == 'object' && formDataProp !== null) {
        const categoryObj = formDataProp as { id_category?: string | number }
        Object.assign(payload, { [v]: categoryObj?.id_category })
      } else {
        Object.assign(payload, { [v]: formDataProp })
      }
    } else if (!['date_end', 'date_start', 'id_cm_device'].includes(v)) {
      Object.assign(payload, { [v]: formDataProp })
    }
  })

  if (props.lab_set_type == 1)
    Object.assign(payload, { id_lab_set: props.lab_set?.id_lab_set })
  if (props.lab_set?.date_start)
    Object.assign(payload, { date_start: props.lab_set?.date_start ? props.lab_set?.date_start + ' 00:00:00' : '' })
  if (props.lab_set?.date_end)
    Object.assign(payload, { date_end: props.lab_set?.date_end ? props.lab_set?.date_end + ' 00:00:00' : '' })
  
  Object.assign(payload, { id_lab_device: props.lab_set?.id_lab_device })
  const saveCallback = props.saveCallback && typeof props.saveCallback === 'function' ? props.saveCallback : null
  if (saveCallback) {
    saveCallback({ isSaved: true, data: formData })
  }
  if (props.usePlaceholder) { 
    emits('close')
    return
  }
  if (props.isEdit) {
    updateLabRange(payload as LAB_RANGE)
  } else {
    delete formData.id_lab_range
    saveLabRange(payload as LAB_RANGE)
  }
  if (props.data?.code_lab) {
    await labRangeStore.fetchLabRanges(Number(props.data?.code_lab), props.lab_set_type!)
  }
}

const saveLabRange = async (data: LAB_RANGE) => {
  const res = await mtUtils.callApi('POST', 'mst/lab_range', data)

  if (res) {
    if (res?.data == 'error') {
      mtUtils.autoCloseAlert(res.message)
      return
    }
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
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
        const saveCallback = props.saveCallback && typeof props.saveCallback === 'function' ? props.saveCallback : null
        if (props.usePlaceholder) {
          saveCallback && saveCallback({ isSaved: true, data: formData, delete: true })
          emits('close')
          return
        }
        saveCallback && saveCallback({ isSaved: true, data: formData, delete: true })
        await labRangeStore.destroyLabRange(Number(formData.id_lab_range || props.data?.id_lab_range))
        emits('close')
        await mtUtils.autoCloseAlert(aahMessages.success)
      }
    }
  }
}

const updateLabRange = async (data: LAB_RANGE) => {
  try {
      const res = await mtUtils.callApi('PUT', `mst/lab_range/${data.id_lab_range}`, data)
      if (res) {
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
      }
  } catch (error) {
      mtUtils.autoCloseAlert(aahMessages.failed)
  }
}

onMounted(async () => {
  labRangeStore.$state.labRanges = []
  await mtUtils.promiseAllWithLoader([
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB1_' }, 'LB1'),
    commonStore.fetchPreparationCommonList({ code_common: [1,7] })
  ])
  // assign props to formData 
  Object.assign(formData, props.data)

  if (props.data?.pet_gender) formData.pet_gender = props.data?.pet_gender
  if (props.category_lb1) formData.id_category2_lb1 = typeof props.category_lb1 === 'object' ? props.category_lb1?.id_category : props.category_lb1
  if (props.lab_set_type == 1) formData.id_cm_device = props.lab_set?.id_cm_device

  deviceListDefault.length = 0
  deviceList.value.length = 0
  deviceListDefault.push(...getCommonDeviceOptionList.value)
  deviceList.value = [...getCommonDeviceOptionList.value]

  categoryList.value.length = 0
  categoryListDefault.length = 0
  categoryList.value = [...categoryStore.getCategoriesLB1]
  categoryListDefault.push(...categoryStore.getCategoriesLB1)
})

</script>
<template>
<q-form @submit="submit">
  <MtModalHeader @closeModal="emits('close')" > 
    <q-toolbar-title
      class="text-grey-900 title2 bold"
    >
      検査機器・動物種別の基準値
    </q-toolbar-title>
    <q-btn v-if="props.isEdit" round flat @click="openMenu" class="q-mx-sm">
      <q-icon size="xs" name="more_horiz" />
    </q-btn>
  </MtModalHeader>
  <q-card-section class="q-px-md">
    <div class="row q-col-gutter-md">
      <div class="col-lg-6 col-md-12 col-sm-12">
        <!-- @vue-ignore -->
        <MtFilterSelect
          v-if="props.lab_set_type == 1"
          class="bg-white"
          label="検査機器CD"
          option-label="name_category"
          option-value="id_category"
          :disable="true"
          v-model:selecting="formData.id_category2_lb1"
          v-model:options="categoryList"
          :options-default="categoryListDefault"
        />
        <MtFilterSelect
          v-else-if="props.lab_set_type == 2"
          class="bg-white"
          label="検査機器CD"
          :disable="true"
          v-model:selecting="formData.id_cm_device"
          v-model:options="deviceList"
          :options-default="deviceListDefault"
          hide-clear-icon
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-lg-6 col-md-6 col-sm-6">
        <!-- @vue-ignore -->
        <MtFormPullDown
          v-model:selected="formData.id_cm_animal" 
          :options="getCommonTypeAnimalOptionList"
          label="動物種"
          autofocus
          tabindex="1"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <div class="col-auto">ペット性別 :</div>
        <div class="col-3">
          <MtInputForm type="radio" class="q-mr-sm" v-model="formData.pet_gender"
            :items="typePetGender"
          />
        </div>
      </div>
    </div>
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm
          type="text" 
          :rules="[aahValidations.validationNonNegativeNumber, minAgeValidation]"
          ref="minAgeInput"
          v-model="formData.min_age_mon"
          @update:modelValue="minAgeChange"
          label="最小月齢"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm
          type="text"
          :rules="[aahValidations.validationNonNegativeNumber]"
          v-model="formData.max_age_mon"
          @update:modelValue="maxAgeChange"
          label="最大月齢"
        />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm
          type="text"
          v-model="formData.low"
          required
          :rules="[aahValidations.validationRequired]"
          label="基準下限値"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm type="text" v-model="formData.low_critical" label="パニック下限値" />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm
          type="text"
          v-model="formData.high"
          label="基準上限値"
          required
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div class="col-lg-6 col-md-6 col-sm-6">
        <MtInputForm type="text" v-model="formData.high_critical" label="パニック上限値" />
      </div>
    </div>
    <!-- <div class="row q-col-gutter-md q-mt-sm">
      <div class="col-lg-6 col-md-6 col-sm-12">
        <MtFormInputDate v-model:date="formData.date_start" label="有効開始日"></MtFormInputDate>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <MtFormInputDate v-model:date="formData.date_end" label="有効終了日"></MtFormInputDate>
      </div>
    </div> -->
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="">
      <div class="text-center modal-btn">
        <q-btn
          class="bg-grey-100 text-grey-800"
          outline
          @click="emits('close')"
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