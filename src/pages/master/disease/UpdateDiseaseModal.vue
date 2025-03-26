<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useDiseaseStore from '@/stores/diseases'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useInsuranceStore from '@/stores/insurances'
import useCategoryStore from '@/stores/categories'
import MtCategorySelectionComponent from '@/components/modals/MtCategorySelectionComponent.vue'
import { imageResize } from '@/utils/helper'
import useCommonStore from '@/stores/common'
import MtFilterMultipleSelect from '@/components/form/MtFilterMultipleSelect.vue'
import { concatenate } from '@/utils/aahUtils'

const diseaseStore = useDiseaseStore()
const { getDisease } = storeToRefs(diseaseStore)

const InsuranceStore = useInsuranceStore()
const { getInsurers } = storeToRefs(InsuranceStore)
const file_path1 = ref()
const file_path2 = ref()
const file_path3 = ref()
const file_name1 = ref('')
const file_name2 = ref('')
const file_name3 = ref('')
const f1_status = ref('unchanged')
const f2_status = ref('unchanged')
const f3_status = ref('unchanged')
const categoryStore = useCategoryStore()
const { getCategories, getAllSubCategories } = storeToRefs(categoryStore)

const commonStore = useCommonStore()
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const emits = defineEmits(['close'])

const props = defineProps({ data: Object })

const isEdit = ref(false)

const data = ref({
  name_disease: null,
  name_kana_disease: null,
  flg_congenital: false,
  flg_disease_insurer: false,
  code_clinic_disease: null,
  memo_inspection: null,
  memo_diagnosis: null,
  memo_plan: null,
  memo_after: null,
  memo_other: null,
  id_cm_disease_insurer: null,
  id_category1: null,
  id_category2: null,
  id_cm_animal: [],
  file_path1: null,
  file_path2: null,
  file_path3: null,
  display_order: '9999'
})
const formTaskRef = ref(props.data)

const TypeAnimalList = computed(() => {
  let list = getCommonTypeAnimalOptionList.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

function onFilePicked(e: any, type: any) {
  imageResize(e.target.files[0])
    .then((i) => {
      //data.value.type = i
      if (type === 'file_path1') {
        file_path1.value = URL.createObjectURL(i)
        data.value.file_path1 = e.target.files[0]
        f1_status.value = 'changed'
      } else if (type === 'file_path2') {
        file_path2.value = URL.createObjectURL(i)
        data.value.file_path2 = e.target.files[0]
        f2_status.value = 'changed'
      } else if (type === 'file_path3') {
        file_path3.value = URL.createObjectURL(i)
        data.value.file_path3 = e.target.files[0]
        f3_status.value = 'changed'
      }
    })
    .catch((error) => {
      console.error('Failed to resize image:', error)
    })
}
const removeImage = (type: any) => {
  if (type == 'file_path1') {
    file_path1.value = null
    data.value.file_path1 = null
    f1_status.value = 'removed'
  } else if (type == 'file_path2') {
    file_path2.value = null
    data.value.file_path2 = null
    f2_status.value = 'removed'
  } else if (type == 'file_path3') {
    file_path3.value = null
    data.value.file_path3 = null
    f3_status.value = 'removed'
  }
}
const closeModal = () => {
  emits('close')
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
        .then((confirmation) => {
          if (confirmation) {
            diseaseStore.destroyDisease(data.value.id_disease).then(() => {
              diseaseStore.fetchDiseases()
              diseaseStore.fetchPreparationDiseases()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const submit = () => {
  let formData = new FormData()
  formData.append('name_disease', data.value.name_disease)
  formData.append('name_kana_disease', data.value.name_kana_disease)
  formData.append('flg_congenital', data.value.flg_congenital)
  formData.append('flg_disease_insurer', data.value.flg_disease_insurer)
  formData.append('code_clinic_disease', data.value.code_clinic_disease)
  formData.append('memo_inspection', data.value.memo_inspection)
  formData.append('memo_diagnosis', data.value.memo_diagnosis)
  formData.append('memo_plan', data.value.memo_plan)
  formData.append('memo_after', data.value.memo_after)
  formData.append('memo_other', data.value.memo_other)

  formData.append('name_disease_en', data.value.name_disease_en)
  formData.append('display_order', data.value.display_order)

  formData.append(
    'flg_quick_illness_history',
    data.value.flg_quick_illness_history
  )

  if (
    data.value.id_cm_animal &&
    data.value.id_cm_animal !== null &&
    data.value.id_cm_animal !== '' &&
    data.value.id_cm_animal.length > 0
  ) {
    formData.append('id_cm_animal', data.value.id_cm_animal)
  } else {
    formData.append('id_cm_animal', JSON.stringify([]))
  }

  formData.append('id_category1', data.value.id_category1)
  formData.append('id_category2', data.value.id_category2)

  formData.append('name_disease_en', data.value.name_disease_en)
  if (
    data.value.id_cm_disease_insurer !== null &&
    data.value.id_cm_disease_insurer !== ''
  ) {
    formData.append('id_cm_disease_insurer', data.value.id_cm_disease_insurer)
  } else {
    // formData.append('id_cm_disease_insurer', []) //causing error in api
  }

  if (props.data) {
    if (f1_status.value == 'unchanged') {
      formData.append('file_path1', data.value.file_path1)
    } else if (f1_status.value == 'changed') {
      formData.append('file_path1', data.value.file_path1)
    } else if (f1_status.value == 'removed') {
      formData.append('file_path1', null)
    }

    if (f2_status.value == 'unchanged') {
      formData.append('file_path2', data.value.file_path2)
    } else if (f2_status.value == 'changed') {
      formData.append('file_path2', data.value.file_path2)
    } else if (f2_status.value == 'removed') {
      formData.append('file_path2', null)
    }

    if (f3_status.value == 'unchanged') {
      formData.append('file_path3', data.value.file_path3)
    } else if (f3_status.value == 'changed') {
      formData.append('file_path3', data.value.file_path3)
    } else if (f3_status.value == 'removed') {
      formData.append('file_path3', null)
    }

    diseaseStore
      .updateDisease(data.value.id_disease, formData)
      .then(async () => {
        await diseaseStore.fetchDiseases()
        diseaseStore.fetchPreparationDiseases()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    if (data.value.file_path1) {
      formData.append('file_path1', data.value.file_path1)
    }
    if (data.value.file_path2) {
      formData.append('file_path2', data.value.file_path2)
    }
    if (data.value.file_path3) {
      formData.append('file_path3', data.value.file_path3)
    }

    formData.append('id_clinic', JSON.parse(localStorage.getItem('id_clinic')))
    diseaseStore
      .submitDisease(formData)
      .then(async () => {
        await diseaseStore.fetchDiseases()
        await diseaseStore.fetchPreparationDiseases()
        await mtUtils.autoCloseAlert(aahMessages.success)
        emits('close')
      })
      .catch((error) => {
        mtUtils.alert('Error')
      })
  }
}

const handleInputLength = (inputValue: any) => {
  data.value[inputValue] = data.value[inputValue]?.slice(0, 500)
}

const diseaseInsurerListOption = ref([])
const diseaseInsurerListWithoutFilter = reactive([])
const diseaseInsurerDefaultListOption = reactive([])

const category1Selected = async (value: any) => {
  data.value.id_category1 = value
}

const category2Selected = async (value: any) => {
  data.value.id_category2 = value
}

const updateDiseaseinsurerSelect = (selectedOptionsIds: any) => {
  if (!Boolean(selectedOptionsIds)) {
    return
  }
  data.value.id_cm_disease_insurer = selectedOptionsIds
}

const enableDisableDiseaseinsurerSelect = (checked: boolean) => {
  if (!checked) {
    data.value.id_cm_disease_insurer = null
  }
}

const initParamsIfCaseIsUpdate = async (diseaseData: any) => {
  if (diseaseData.flg_disease_insurer) {
    updateDiseaseinsurerSelect(diseaseData.i_cm_d_disease_insurer)
  }
}

onMounted(async () => {
  const [_noUse] = await mtUtils.promiseAllWithLoader([
    commonStore.fetchPreparationCommonList({ code_common: [1, 6] })
  ])

  useCommonStore().getCommonDiseaseInsurerOptionList.map((item: any) => {
    let tempObj = {
      label: concatenate(item.name_common, `(${item.text2})`),
      value: item.id_common
    }
    diseaseInsurerListOption.value.push(tempObj)
    diseaseInsurerDefaultListOption.push(tempObj)
  })

  if (props.data?.id_disease) {
    data.value = { ...props.data }
    initParamsIfCaseIsUpdate(props.data)
    isEdit.value = true
    file_path1.value = props.data.file_path1
    file_path2.value = props.data.file_path2
    file_path3.value = props.data.file_path3

    data.value.flg_disease_insurer = false

    if (
      data.value.id_cm_disease_insurer &&
      data.value.id_cm_disease_insurer.length &&
      data.value.id_cm_disease_insurer.length > 0
    ) {
      data.value.flg_disease_insurer = true
    }
  } else {
    isEdit.value = false
    data.value = data.value
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 boldtitle2">
        傷病
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-scroll-area style="height: 50vh">
      <q-card-section class="q-px-lg">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-9 col-md-8 col-sm-12">
            <MtCategorySelectionComponent
              :flg_for_disease="true"
              :data="{
                id_category1: props.data?.id_category1,
                id_category2: props.data?.id_category2
              }"
              :id_category1="data.id_category1"
              :id_category2="data.id_category2"
              @category1Selected="category1Selected"
              @category2Selected="category2Selected"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-3 col-md-4 col-sm-12">
            <q-select
              v-model="data.id_cm_animal"
              :options="getCommonTypeAnimalOptionList"
              clearable
              dense
              emit-value
              label="動物種別"
              map-options
              multiple
              use-chips
              @clear="() => (data.id_cm_animal = [])"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-3 col-md-4 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.name_disease"
              label="傷病（疾患・診断）名 * "
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-3 col-md-4 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.name_kana_disease"
              label="傷病（疾患・診断）名カナ"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-3 col-md-4 col-sm-12">
            <MtInputForm
              v-model="data.name_disease_en"
              label="傷病英名"
              type="text"
            />
          </div>
          <div class="col-lg-3 col-md-4 col-sm-12">
            <MtFormCheckBox
              v-model:checked="data.flg_quick_illness_history"
              label="クイック追加"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-lg-3 col-md-4 col-sm-12">
            <MtInputForm
              type="checkbox"
              v-model="data.flg_disease_insurer"
              :items="[{ label: '保険傷病の紐づけ' }]"
              @updatedValue="enableDisableDiseaseinsurerSelect"
            />
          </div>
          <div class="col-lg-9 col-md-8 col-sm-12">
            <MtFilterMultipleSelect
              v-if="data.flg_disease_insurer"
              v-model="data.id_cm_disease_insurer"
              v-model:options="diseaseInsurerListOption"
              :options-default="diseaseInsurerDefaultListOption"
              label="保険傷病名（複数可）"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.memo_symptoms"
              label="一般的な主訴"
              autogrow
              @update:model-value="handleInputLength('memo_symptoms')"
            />
            <div class="row justify-end text-grey-500 full-width">
              {{
                data.memo_symptoms?.length
                  ? data.memo_symptoms?.length + '/ 500'
                  : ''
              }}
            </div>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.memo_inspection"
              label="スクリーニング・検査"
              autogrow
              @update:model-value="handleInputLength('memo_inspection')"
            />
            <div class="row justify-end text-grey-500 full-width">
              {{
                data.memo_inspection?.length
                  ? data.memo_inspection?.length + '/ 500'
                  : ''
              }}
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.memo_diagnosis"
              label="診断"
              autogrow
              @update:model-value="handleInputLength('memo_diagnosis')"
            />
            <div class="row justify-end text-grey-500 full-width">
              {{
                data.memo_diagnosis?.length
                  ? data.memo_diagnosis?.length + '/ 500'
                  : ''
              }}
            </div>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.memo_plan"
              label="治療方針"
              autogrow
              @update:model-value="handleInputLength('memo_plan')"
            />
            <div class="row justify-end text-grey-500 full-width">
              {{
                data.memo_plan?.length ? data.memo_plan?.length + '/ 500' : ''
              }}
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.memo_after"
              label="予後"
              autogrow
              @update:model-value="handleInputLength('memo_after')"
            />
            <div class="row justify-end text-grey-500 full-width">
              {{
                data.memo_after?.length ? data.memo_after?.length + '/ 500' : ''
              }}
            </div>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.memo_other"
              label="その他"
              autogrow
              @update:model-value="handleInputLength('memo_other')"
            />
            <div class="row justify-end text-grey-500 full-width">
              {{
                data.memo_other?.length ? data.memo_other?.length + '/ 500' : ''
              }}
            </div>
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-xs">
          <div class="col-4">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              所見1
            </div>
            <div v-if="file_path1" class="relative-position">
              <q-img
                :src="file_path1"
                spinner-color="white"
                class="full-width"
              />
              <q-badge
                color="red"
                floating
                transparent
                @click="removeImage('file_path1')"
              >
                <q-icon name="close" />
              </q-badge>
            </div>
            <q-btn
              v-else
              @click="$refs.file1.click()"
              unelevated
              color="grey-300"
              text-color="grey-800"
              class="full-width q-pa-xl"
            >
              <q-icon size="60px" name="add" />
            </q-btn>
            <input
              type="file"
              style="display: none"
              ref="file1"
              accept="image/*"
              @change="onFilePicked($event, 'file_path1')"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-4">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              所見2
            </div>
            <div
              v-if="file_path2"
              class="relative-position"
              @click="removeImage('file_path2')"
            >
              <q-img
                :src="file_path2"
                spinner-color="white"
                class="full-width"
              />
              <q-badge color="red" floating transparent>
                <q-icon name="close" />
              </q-badge>
            </div>
            <q-btn
              v-else
              @click="$refs.file2.click()"
              unelevated
              color="grey-300"
              text-color="grey-800"
              class="full-width q-pa-xl"
            >
              <q-icon size="60px" name="add" />
            </q-btn>
            <input
              type="file"
              style="display: none"
              ref="file2"
              accept="image/*"
              @change="onFilePicked($event, 'file_path2')"
            />
          </div>
          <div class="col-4">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              所見3
            </div>
            <div v-if="file_path3" class="relative-position">
              <q-img
                :src="file_path3"
                spinner-color="white"
                class="full-width"
              />
              <q-badge
                color="red"
                floating
                transparent
                @click="removeImage('file_path3')"
              >
                <q-icon name="close" />
              </q-badge>
            </div>
            <q-btn
              v-else
              @click="$refs.file3.click()"
              unelevated
              color="grey-300"
              text-color="grey-800"
              class="full-width q-pa-xl"
            >
              <q-icon size="60px" name="add" />
            </q-btn>
            <input
              type="file"
              style="display: none"
              ref="file3"
              accept="image/*"
              @change="onFilePicked($event, 'file_path3')"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-3 col-md-4 col-sm-12">
            <MtInputForm
              type="text"
              v-model="data.display_order"
              label="表示順序（0~999; 小を上位表示）"
            />
          </div>
        </div>
      </q-card-section>
    </q-scroll-area>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
