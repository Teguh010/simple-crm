<script lang="ts" setup>
import { computed, nextTick, onMounted, reactive, Ref, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
// import aahUtils from '@/utils/aahUtils'
// import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import selectOptions from '@/utils/selectOptions'
import { useRoute, useRouter } from 'vue-router'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahMessages from '@/utils/aahMessages'
import OptionModal from '@/components/OptionModal.vue'
import useCommonStore from '@/stores/common'
import UpdateLabRange, { LabRangeItem, SaveCallbackProps as SaveCallbackPropsLabRange } from '@/pages/master/lab/UpdateLabRange.vue'
import { LAB, LABCOMMON, labRangeColumns } from './types_lab'
import useLabRangeStore from '@/stores/lab-range'
import useLabStore from '@/stores/labs'
import { storeToRefs } from 'pinia'
import MtTable2 from '@/components/MtTable2.vue'
import { typePetGender, typeUnitBit } from '@/utils/enum'
import { dateFormat } from '@/utils/aahUtils'
import useCategoryStore from '@/stores/categories'
import { Common } from '@/types/types'
import useLabSetStore from '@/stores/lab-sets'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import aahValidations from '@/utils/aahValidations'
import useLabDeviceStore from '@/stores/lab-devices'
import _ from 'lodash'
import { PropType } from 'vue'

type LabItemGrouped = Partial<LABCOMMON
  & Omit<LAB, 'id_category1' | 'id_category2_lab'> & {
    code_lab: string,
    id_clinic: string,
    id_category1: string | null,
    id_category2_lab: string | null,
    name_cm_unit: string,
    flg_indent: boolean,
    flg_above_blank_row: boolean
    code_clinic: Record<string, any> | string
    display_order: number
    id_lab_set: string,
    id_lab_device: string,
   id_cm_device: number | null
    lab_range: LabRangeItem[]
}>

export interface SaveCallbackProps {
  isSaved: boolean,
  data: LabItemGrouped | null,
  labRange: LabRangeItem[] | null
}

const commonStore = useCommonStore()
const labRangeStore = useLabRangeStore()
const labStore = useLabStore()
const categoryStore = useCategoryStore()
const labSetStore = useLabSetStore()
const labDeviceStore = useLabDeviceStore()

const emits = defineEmits(['close'])
const props = defineProps({
  id_lab: String,
  lab_set_type: Number,
  category_lb1: Object,
  device: Object,
  lab_set_device: Object,
  saveCallback: {
    type: Function as PropType<(value: SaveCallbackProps) => void>,
    required: false
  },
  commonObj: Object,
  /**
   * @note use placeholder for unsaved lab set item
   * The concept of placeholder is to pass the data all the way to editing lab range
   * Since the lab set is not yet saved, and we need lab set id for lab range
   * Through out the implementation, the logic is seaprated and won' call any API or store to avoid race condiftion
   * And lab set item all manipulated locally
   */
  usePlaceholder: Object
})
const labGroupFormCheckBox = ref<Array<typeof typeUnitBit>>([])
const deviceSelected = ref<Record<string, any> | null>(null)
const lb1Selected = ref<Record<string, any> | null>(null)

const labSetItemUnsavedHolder = ref<
  Partial<
    LABCOMMON & {
      id_lab: string
      code_clinic: Record<string, any> | string
      display_order: number
    }
  > | null
  >(null)

const labRangeItemUnsavedHolder = ref<LabRangeItem[] | null>(null)

const { getCommonTypeAnimalOptionList, getCommonDeviceOptionList, getCommonUnitOptionList } =
  storeToRefs(commonStore)
const { getAllCategories } = storeToRefs(categoryStore)
const { getLabRanges } = storeToRefs(labRangeStore)
const { getLab } = storeToRefs(labStore) as unknown as { getLab: Ref<LAB & { code_common: number }> }

const labUnitListOption = ref<Array<Record<string, any>>>([])
const labUnitListOptionDefault = reactive<Array<Record<string, any>>>([])

const labGroupForm = reactive<LabItemGrouped>({
  // lab item
  id_lab: '',
  id_clinic: '',
  code_lab: '',
  name_category1: '',
  name_category2: '',
  id_category1: null,
  id_category2_lab: null,
  code_labcat2: '',
  name_lab: '',
  name_lab_en: '',
  name_short: '',
  search_keyword1: '',
  id_cm_unit: '',
  id_cm_device: null,
  name_cm_unit: '',
  flg_output_text: false,
  memo_lab: '',
  flg_relate_other: false,
  memo_use_case: '',
  datetime_imported: '',
  flg_etc1: false,
  flg_etc2: false,
  flg_indent: false,
  flg_above_blank_row: false,
  memo_etc1: '',
  memo_etc2: '',
  date_start: '',
  date_end: '',
  ibm_extra_keycheck: '',
  code_clinic: localStorage.getItem('clinic')
    ? JSON.parse(localStorage.getItem('clinic') || '')?.value
    : '',
  display_order: 999
})

const isEdit = ref(false)

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
        await labSetStore.destroyLabSet(labGroupForm.id_lab_set || '')
        emits('close')
        await mtUtils.autoCloseAlert(aahMessages.success)
      }
    }
  }
}

function assignPageData(newData: any) {
  for (let key in labGroupForm) {
    labGroupForm[key as keyof typeof labGroupForm] = newData[key]
  }
}

const closeModal = () => {
  emits('close')
}

async function save() {
  const saveCallback = props.saveCallback && typeof props.saveCallback === 'function' ? props.saveCallback : null
  if (isEdit.value) {
    if (props.lab_set_type == 1) {
      // Lab set, update lab set
      const labSetPayload = labGroupForm
      if (props.usePlaceholder) {
        if (saveCallback) saveCallback({ isSaved: true, data: labGroupForm, labRange: labRangeItemUnsavedHolder.value })
        emits('close')
        return
      } 
      const res = !labGroupForm.id_lab_set
        ? null
        : await labSetStore.updateLabSet(Number(labGroupForm.id_lab_set), labSetPayload)
      if (res) {
        if(saveCallback) saveCallback({ isSaved: true , data: labGroupForm, labRange: labRangeItemUnsavedHolder.value})
        emits('close')
        await mtUtils.autoCloseAlert('保存しました')
      } else {
        if(saveCallback) saveCallback({ isSaved: false, data: null, labRange: null})
        await mtUtils.autoCloseAlert(aahMessages.failed)
      }
    } else if (props.lab_set_type == 2) {
      // Lab device, update lab device
      const labDevicePayload = labGroupForm

      const res = !labGroupForm.id_lab_device
        ? null
        : await labDeviceStore.updateLabDevice(Number(labGroupForm.id_lab_device), labDevicePayload)

      if (res) {
        if(saveCallback) saveCallback({ isSaved: true, data: labGroupForm, labRange: labRangeItemUnsavedHolder.value})
        emits('close')
        await mtUtils.autoCloseAlert('保存しました')
      } else {
        if(saveCallback) saveCallback({ isSaved: false, data: null, labRange: null})
        await mtUtils.autoCloseAlert(aahMessages.failed)
      }
    }
  }
}

function isBitSet(number: any | undefined, bitValue: any) {
  if(_.isUndefined(number)) return false
  return (number & bitValue) === bitValue
}

const openLabRange = async () => {
  let isSaved = false
  await mtUtils.smallPopup(UpdateLabRange, {
    lab_set_type: props.lab_set_type ? props.lab_set_type : null,
    lab_set: props.lab_set_device,
    category_lb1: props.category_lb1,
    device: props.device,
    data: {
      code_clinic: labGroupForm.code_clinic
    },
    isEdit: false,
    saveCallback: (value: { isSaved: boolean, data: any }) => {
        isSaved = value.isSaved
        if(isSaved) {
          if (value.data) {
            if (props.usePlaceholder) { 
              _.set(value.data , 'id_lab_range', _.uniqueId()) // adds temp id
            }
            _.set(value.data, 'id_lab', labGroupForm.id_lab) // esnure id_lab is placed
            if(!labRangeItemUnsavedHolder.value) labRangeItemUnsavedHolder.value = []
            labRangeItemUnsavedHolder.value.push(value.data)
            if (!labGroupForm.lab_range) {
              labGroupForm.lab_range = []
            }
            labGroupForm.lab_range.push(value.data)
          }
        }
    },
    usePlaceholder: props.usePlaceholder
  })
  if (props.usePlaceholder) {
    // do nothing
  } else {
    await labRangeStore.fetchLabRanges(props.lab_set_type == 1 ? props.lab_set_device?.id_lab_set : props.lab_set_device?.id_lab_device, props.lab_set_type!)
    labGroupForm.lab_range = labRangeStore.getLabRanges
  }
}

const onLabRangeRowClick = async (row: any) => {
  await mtUtils.smallPopup(UpdateLabRange, {
    lab_set_type: props.lab_set_type ? props.lab_set_type : null,
    category_lb1: props.category_lb1,
    lab_set: props.lab_set_device,
    data: {
      ...row,
      code_clinic: labGroupForm.code_clinic
    },
    isEdit: true,
    saveCallback: (value: SaveCallbackPropsLabRange) => {
      if (value.data) {
        const index = labGroupForm.lab_range?.findIndex((v: any) => v.id_lab_range == value.data?.id_lab_range)
        if (labGroupForm.lab_range && index !== -1 && index !== undefined) {
        if (value.delete) { 
            labGroupForm.lab_range.splice(index, 1)
        } else {
            // @ts-ignore - too lazy to fix type
            labGroupForm.lab_range[index] = {
              ...labGroupForm.lab_range[index],
              ...value.data
            }
          }
        }
      }
    },
    usePlaceholder: props.usePlaceholder
  })
  if (!props.usePlaceholder) {
    await labRangeStore.fetchLabRanges(props.lab_set_type == 1 ? props.lab_set_device?.id_lab_set : props.lab_set_device?.id_lab_device, props.lab_set_type!)
  }
}

const getTypeAnimal = (id_cm_animal: number) =>
  getCommonTypeAnimalOptionList.value.find(
    (v: any) => v.id_common == id_cm_animal
  )?.name_common

const getDevice = (id_cm_device: number) =>
  getCommonDeviceOptionList.value.find((v: any) => v.id_common == id_cm_device)

const getTypePetGenderName = (pet_gender: number) =>
  typePetGender.find((v: any) => v.value == pet_gender)?.label

onMounted(async () => {
  await mtUtils.promiseAllWithLoader([
    commonStore.fetchPreparationCommonList({ code_common: [4] }, true),
    categoryStore.fetchCategories({ flg_for_lab: true, code_category_prefix: 'LB1_' }, 'LB1'),
  ])

  getCommonUnitOptionList.value.filter((v: any) => v.code_func1 == '1024')
    .map((v: any) => {
      let tempObj = {
        label: v.name_common,
        value: v.id_common
      }
      labUnitListOptionDefault.push(tempObj)
      labUnitListOption.value.push(tempObj)
    })
  
  if (props.lab_set_type == 1 && props.category_lb1) lb1Selected.value = props.category_lb1
  if (props.lab_set_type == 2 && props.device) deviceSelected.value = props.device
  labGroupFormCheckBox.value = [...typeUnitBit] as any
  if (props.id_lab) {
    const isValid = props.lab_set_type == 1 ? props.lab_set_device?.id_lab_set : props.lab_set_device?.id_lab_device
    if (isValid) {
      await Promise.all([
        labStore.getLabById(props.id_lab),
        labRangeStore.fetchLabRanges(
          props.lab_set_type == 1 ? props.lab_set_device?.id_lab_set : props.lab_set_device?.id_lab_device,
          props.lab_set_type!
        )
      ])
    } else {
      // FE manipulation - since item is not yet saved, we need to assign self as lab reference
      
      if(props.usePlaceholder && props.lab_set_device){
        labSetItemUnsavedHolder.value = _.cloneDeep(props.lab_set_device)
        _.set(labSetItemUnsavedHolder.value, 'lab', labSetItemUnsavedHolder.value)
        _.set(labSetItemUnsavedHolder.value, 'lab_range', reactive([]))
      }
    }
    const toAssign = props.usePlaceholder ? labSetItemUnsavedHolder.value : getLab.value
    assignPageData( toAssign)
    isEdit.value = true

    if (toAssign?.code_common == 4) {
      labGroupFormCheckBox.value = labGroupFormCheckBox.value.map((o: any) => ({
        ...o,
        checked: isBitSet(props.commonObj?.code_func1 || undefined, o.value)
      }))
    }

    Object.assign(labGroupForm, {
      name_category1: getAllCategories.value.find(
        (v: any) => v.id_category == labGroupForm.id_category1
      )?.name_category,
      name_category2: getAllCategories.value.find(
        (v: any) => v.id_category == labGroupForm.id_category2_lab
      )?.name_category,
      name_cm_unit: getCommonUnitOptionList.value.find((v: Common) => v.id_common.toString() == labGroupForm.id_cm_unit)?.name_common
    })

    if (props.lab_set_type == 1) {
      // LAB SET
      Object.assign(labGroupForm, {
        id_lab_set: props.lab_set_device?.id_lab_set,
        display_order: props.lab_set_device?.display_order ? props.lab_set_device?.display_order : 999,
        memo_lab: props.lab_set_device?.memo_lab ? props.lab_set_device?.memo_lab : props.lab_set_device?.lab?.memo_lab,
        flg_indent: props.lab_set_device?.flg_indent ? props.lab_set_device?.flg_indent : false,
        flg_above_blank_row: props.lab_set_device?.flg_above_blank_row ? props.lab_set_device?.flg_above_blank_row : false,
        id_cm_unit: props.lab_set_device?.id_cm_unit ? props.lab_set_device?.id_cm_unit : labGroupForm.id_cm_unit,
        id_cm_device: props.lab_set_device?.id_cm_device ? props.lab_set_device?.id_cm_device : labGroupForm.id_cm_device,
        ...(props.lab_set_device?.lab_range && props.lab_set_device?.lab_range.length > 0 ? { lab_range: props.lab_set_device?.lab_range } : {})
      })
    } else if (props.lab_set_type == 2) {
      // LAB DEVICE
      Object.assign(labGroupForm, {
        id_lab_device: props.lab_set_device?.id_lab_device,
        code_device: props.lab_set_device?.code_device,
        display_order: props.lab_set_device?.display_order ? props.lab_set_device?.display_order : '',
        memo_lab: props.lab_set_device?.memo_lab ? props.lab_set_device?.memo_lab : props.lab_set_device?.lab?.memo_lab,
        flg_indent: props.lab_set_device?.flg_indent ? props.lab_set_device?.flg_indent : false,
        flg_above_blank_row: props.lab_set_device?.flg_above_blank_row ? props.lab_set_device?.flg_above_blank_row : false,
        id_cm_unit: props.lab_set_device?.id_cm_unit ? props.lab_set_device?.id_cm_unit : labGroupForm.id_cm_unit,
        id_cm_device: props.lab_set_device?.id_cm_device ? props.lab_set_device?.id_cm_device : labGroupForm.id_cm_device,
        ...(props.lab_set_device?.lab_range && props.lab_set_device?.lab_range.length > 0 ? { lab_range: props.lab_set_device?.lab_range } : {})
      })
    }
  }
})
</script>

<template>
  <q-form @submit="save">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        検査項目
      </q-toolbar-title>
      <q-btn v-if="props.lab_set_type == 1" round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.name_category1"
            type="text"
            label="大分類"
            disable
          />
          <!-- category pulldown, id_category1 => store text name-category1 -->
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.name_category2"
            type="text"
            label="中分類"
            disable
          />
          <!-- category pulldown, id_category1 => store text name-category2 -->
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.code_lab"
            label="検査項目CD"
            type="text"
            disable
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.name_lab"
            label="検査項目名"
            type="text"
            required
            autofocus
            tabindex="1"
            disable
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.name_lab_en"
            label="検査項目英名"
            type="text"
            tabindex="2"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.name_short"
            label="検査項目略称"
            type="text"
            tabindex="3"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <!-- @vue-ignore -->
          <MtFilterSelect
            v-model:options="labUnitListOption"
            :options-default="labUnitListOptionDefault"
            v-model:selecting="labGroupForm.id_cm_unit"
            label="単位"
            tabindex="11"
          />
        </div>
        <!-- <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.flg_relate_other"
            :items="[{ label: 'フィラリア予防歴連携' }]"
            type="checkbox"
          />
        </div> -->
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            v-model="labGroupForm.memo_lab"
            label="検査項目説明"
            type="text"
            tabindex="10"
            autogrow
          />
        </div>
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.flg_indent"
            :items="[{ label: '⇒ インデント' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.flg_above_blank_row"
            :items="[{ label: '上に空行を挿入' }]"
            type="checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtInputForm
            v-model="labGroupForm.display_order"
            required
            :rules="[aahValidations.validationRequired]"
            label="表示順序（0~999; 小を上位表示）"
            type="text"
          />
        </div>
      </div>
      <div class="q-pt-md">
        <hr class="light q-mb-lg" />
        <div class="flex items-center justify-between q-mt-lg" id="address">
          <!-- Lab Range -->
          <div class="q-mb-md q-mt-lg">
            <h4 class="text-white bg-grey-600 title4">
              検査機器・動物種別の検査項目 基準値
            </h4>
          </div>
          <q-space />
          <div class="q-mr-md" v-if="props.lab_set_type == 1 && lb1Selected">
            {{ lb1Selected?.name_category }}
          </div>
          <div class="q-mr-md" v-else-if="props.lab_set_type == 2 && deviceSelected">
            {{ deviceSelected?.name_common }}
          </div>
          <q-btn color="primary" @click="openLabRange()">
            <q-icon name="add" />
            基準値
          </q-btn>
        </div>
        <MtTable2
          :columns="labRangeColumns"
          :rows="labGroupForm.lab_range ?? []"
          :rowsBg="true"
          class="custody-table"
          flat
          no-data-message="登録がありません。"
          no-result-message="該当のデータが見つかりませんでした"
        >
          <template v-slot:row="{ row }">
            <td
              v-for="(col, index) in labRangeColumns"
              :key="index"
              @click="onLabRangeRowClick(row)"
              class="cursor-pointer"
            >
              <div
                v-if="col.field === 'id_cm_device'"
                class="body1 regular text-grey-900"
              >
                {{
                  getDevice(row.id_cm_device)?.code_func1 ? getDevice(row.id_cm_device)?.code_func1 : '' +
                  ' / ' +
                  getDevice(row.id_cm_device)?.name_common ? getDevice(row.id_cm_device)?.name_common : ''
                }}
              </div>
              <div
                v-else-if="col.field === 'pet_gender'"
                class="body1 regular text-grey-900"
              >
                {{ getTypePetGenderName(row.pet_gender) }}
              </div>
              <div
                v-else-if="col.field === 'type_animal'"
                class="body1 regular text-grey-900"
              >
                {{ getTypeAnimal(row.id_cm_animal) }}
              </div>
              <div
                v-else-if="
                  col.field === 'date_start' || col.field === 'date_end'
                "
                class="body1 regular text-grey-900"
              >
                {{ dateFormat(row[col.field]) }}
              </div>
              <div v-else class="body1 regular text-grey-900">
                {{ row[col.field] }}
              </div>
            </td>
          </template>
        </MtTable2>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white q-pt-md">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn
            class="bg-grey-100 text-grey-800"
            outline
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn
            class="q-ml-md"
            color="primary"
            tabindex="20"
            type="submit"
            unelevated
          >
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
</style>
