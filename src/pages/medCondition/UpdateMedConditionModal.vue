<script setup lang="ts">
import { onMounted, reactive, Ref, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import { changeToggleDropdownNames, copyText, getDateTimeNow, getFullPetName, isBitSet } from '@/utils/aahUtils'
import { MedCondition, RequestDetailPageType } from '@/types/types'
import useCustomerStore from '@/stores/customers'
import useFabricStore from '@/stores/fabrics'
import useClinicCommonStore from '@/stores/cli-common'
import useClinicStore from '@/stores/clinics'
import useMemoCarteStore from '@/stores/memo-cartes'
import useIllnessHistoryStore from '@/stores/illness-history'
import useTextTemplateStore from '@/stores/text-template'
import useClinicalFilesStore from '@/stores/clinical-files'
import aahMessages from '@/utils/aahMessages'
import { typeCarteConfig } from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { sortBy } from 'lodash'
import OptionModal from '@/components/OptionModal.vue'
import useMedConditionStore from '@/stores/med-conditions'

type memoFieldsType = {
  field: string,
  name: string,
  label: string
}

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const customerStore = useCustomerStore()
const fabricStore = useFabricStore()
const clinicCommonStore = useClinicCommonStore()
const clinicStore = useClinicStore()
const illnessHistoryStore = useIllnessHistoryStore()
const textTemplateStore = useTextTemplateStore()
const memoCarteStore = useMemoCarteStore()
const clinicalFilesStore = useClinicalFilesStore()
const medConditionStore = useMedConditionStore()
const { getFabric } = storeToRefs(fabricStore)
const { getIllnessHistorys } = storeToRefs(illnessHistoryStore)
const { getTemplates } = storeToRefs(textTemplateStore)

const petSelected = ref()
const customerSelected = ref()
const memoFieldsRef = ref([])
const foreColor:Ref<string[]> = ref(['#ffff00', '#ffff00', '#ffff00', '#ffff00'])
const currentFocusedMemo = ref<string>('memo_other'), fileInput = ref()
const flgEditorToolbar = ref<boolean>(true)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'));
const clinicFiles = ref([])
const clinicCommonList = ref([]), disableCliCommon = ref(false)
const typeCarteConfigList = ref([])
const addTemplateModalFlg =  ref(false), textTemplatesList = ref([])
const disableClinicalFileBtn = ref(false)
let observer : MutationObserver | null = null
const data = ref({
  id_pet: '',
  id_request: '',
  id_customer: '',
  id_employee: defaultEmployee,
  datetime_record: getDateTimeNow(),
  id_pet_illness_history: null,
  id_clinic: '',
  memo_sbj: '',
  memo_obj: '',
  memo_ass: '',
  memo_other: '',
  type_source: 5,
  illnessHistoryOptions: null
})

const petBioInfoData = ref({
  id_pet: null,
  id_customer: null,
  val_weight: null,
  type_body_weight: 1,
  val_temperature: null,
  val_respiration_rate: null,
  val_heartbeat_rate: null,
  val_pressure_systolic: null,
  val_pressure_diastolic: null,
  val_pressure_mean_arterial: null,
  val_blood_oxygen_level: null,
  val_blood_carbon_dioxide_level: null
})

const medConditionData = reactive([])

const props = withDefaults(
  defineProps<{
    id_request: string
    id_customer: string
    id_pet: string
    number_request?: string
    id_pet_illness_history?: string
    id_memo_carte?: number
    memo_other?: string
    id_employee?: string
    requestDetailPage?: RequestDetailPageType
    updatedFlg?: { value: boolean }
    med_condition: MedCondition,
    callBackRefresh: Function
  }>(),
  {
    id_request: '',
    number_request: '',
    id_customer: '',
    id_pet: '',
    id_pet_illness_history: '',
    id_memo_carte: -1,
    memo_other: '',
    id_employee: '',
    requestDetailPage: () => {
      return {} as RequestDetailPageType
    },
    updatedFlg: () => {
      return { value: false }
    },
    callBackRefresh: Function
  }
)

const memoFields:memoFieldsType[] = [
  { field: 'memo_sbj', name: 'memo_sbj', label: 'S: 主観' },
  { field: 'memo_obj', name: 'memo_obj', label: 'O: 客観'  },
  { field: 'memo_ass', name: 'memo_ass', label: 'A: 評価'  },
  { field: 'memo_other', name: 'memo_other', label: 'P: 計画他' }
]

const submit = async () => {
  const medConditionFiltered = medConditionData.filter(item => item.type_med_condition && item.code_cli_common)

  for (const item of medConditionFiltered) {
    const payload = {
      ...item,
      id_pet: data.value.id_pet,
      id_customer: props.id_customer,
      id_employee_record: data.value.id_employee,
      datetime_record: getDateTimeNow()
    }

    if (item.id_med_condition) await medConditionStore.updateMedCondition(item.id_med_condition, payload)
    else await medConditionStore.submitMedCondition(payload)
  }

  memoCarteStore.fetchMemoCarte({
    id_pet: props.id_pet,
    id_customer: props.id_customer
  })
  memoCarteStore.fetchMemoCarteV1({
    id_pet: props.id_pet,
    id_customer: props.id_customer
  })
  mtUtils.autoCloseAlert(aahMessages.success)
  emits('close')
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除',
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
            await medConditionStore.destroyMedCondition(props.med_condition?.id_med_condition)
            mtUtils.autoCloseAlert(aahMessages.success)
            props.callBackRefresh()
            emits('close')
          }
        })
    }
  }
}

const fetchCommonCliRecords = async (code_cli_common) => {
  let isCodeCommmonFetched:boolean = false
  if(clinicCommonList.value && clinicCommonList.value.length && clinicCommonList.value.length > 0) {
    clinicCommonList.value.forEach((item) => {
      item.forEach((codeCliCommon) => {
        if(codeCliCommon.code_cli_common == code_cli_common) {
          isCodeCommmonFetched = true
        }
      })
    })
  }
  if(isCodeCommmonFetched) return false
  disableCliCommon.value = true
  // clinicCommonStore.fetchMedConditionCliCommonList({ code_cli_common: [code_cli_common] }).then((res) => {
    if(res.data.data.length > 0) {
      let clinicCommonData = [...res.data.data]
      clinicCommonList.value.push(clinicCommonData.sort((a, b) => a.display_order - b.display_order))
      medConditionData.push({
        memo_record: null,
        code_func1: null
      })
    }  
    disableCliCommon.value = false
  // })
}

const deleteCliCommonRow = (idx) => {
  clinicCommonList.value.splice(idx, 1)
  medConditionData.splice(idx, 1)
}

const showMemoField = (field: 'memo_sbj' | 'memo_obj' | 'memo_ass' | 'memo_other') => {
  switch(field) {
    case 'memo_sbj':
      return typeCarteConfigList.value[2]?.isChecked
    case 'memo_obj':
      return typeCarteConfigList.value[3]?.isChecked
    case 'memo_ass':
      return typeCarteConfigList.value[6]?.isChecked
    case 'memo_other':
      return typeCarteConfigList.value[7]?.isChecked      
  }
}

const openTemplateTextModal = async () => {
  await textTemplateStore.fetchTemplates({ type_text_template: 21 })
  if (getTemplates.value.length) {
    textTemplatesList.value = sortBy(
      getTemplates.value,
      'display_order',
      'asc'
    ).map((template: any) => {
      return {
        title: template.memo_template,
        flg_title: template.flg_title,
        attr: {
          class: template.flg_title ? 'bg-grey-300' : ''
        },
        isSelected: false
      }
    })
  }
  addTemplateModalFlg.value = true
}

const handleUpdateMemo = (value: any) => {
  if(showMemoField(currentFocusedMemo.value)) data.value[currentFocusedMemo.value] += ' ' + value.replace(/\n/g, '<br>')
}

const handleMedCondition = (cliCodeCommon, idx) => {
  medConditionData[idx].type_med_condition = medConditionData[idx].type_med_condition == cliCodeCommon.code_func1 ? null : cliCodeCommon.code_func1
  medConditionData[idx].code_cli_common = cliCodeCommon.code_cli_common
}

onMounted(async () => {
  petSelected.value = customerStore.getPet
  customerSelected.value = customerStore.getCustomer

  const typeCarteConfigVal = clinicStore.getClinic.type_carte_config
  typeCarteConfigList.value = typeCarteConfig.map((el) => {
    return {
      ...el,
      isChecked: isBitSet(typeCarteConfigVal, el.value)
    }
  })

  data.value.id_customer = props.id_customer
  data.value.id_pet = props.id_pet
  if (props.id_request) data.value.id_request = props.id_request

  if (getIllnessHistorys.value.length === 0)
    illnessHistoryStore.fetchIllnessHistorys({
      id_pet: petSelected.value?.id_pet,
      id_customer: customerSelected.value?.id_customer
    })

  if(props.id_memo_carte === -1) {
    if(getIllnessHistorys.value && getIllnessHistorys.value.length && getIllnessHistorys.value.length > 0) {
      let defaultIllnessHistory = getIllnessHistorys.value.find((el) => el.id_pet_illness_history)
      data.value.id_pet_illness_history = [defaultIllnessHistory.id_pet_illness_history]
    }
  }

  if (props.med_condition) {
    await fetchCommonCliRecords(props.med_condition.code_cli_common)
    
    data.value.id_employee = props.med_condition.id_employee_record
    data.value.datetime_record = props.med_condition.datetime_record
    medConditionData.push({...props.med_condition})
  }

  // Updating q-editor toolbar names to JP
  const observerCallback = (mutationList, observer) => {
    for (let mutation of mutationList) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach((node) => {
          if (
            node.nodeType === 1 &&
            (node.matches('[role="menu"]') ||
              node.matches('.q-editor__toolbar-group'))
          ) {
            changeToggleDropdownNames()
          }
        })
      }
    }
  }
  observer = new MutationObserver(observerCallback)
  observer.observe(document.body, { childList: true, subtree: true })
})
</script>
<template>
    <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      カルテ：
      <span @click="copyText(data.number_memo_carte)" class="cursor-pointer">
        {{ data?.number_memo_carte }}
        <q-icon name="content_copy" class="blue" />
      </span>
      <span class="q-ml-md">
        {{ getFullPetName(petSelected, customerSelected) }}
      </span>
    </q-toolbar-title>
    <q-btn
      @click="openMenu"
      icon="more_horiz"
      flat
      round
      class="q-mr-sm"
    />
  </MtModalHeader>
  <q-form @submit="submit">
    <q-card-section class="content">
      <div class="row q-gutter-md">
        <div class="col">
          <div class="row items-center q-gutter-md q-mb-md">
            <div class="col">
              <div class="row items-center q-col-gutter-md">
                <div class="col-6">
                  <InputEmployeeOptGroup
                    v-model:selected="data.id_employee"
                    label="記入者"
                    show-select-default-employee
                    ref="employeeRef"
                    @update:select-default-employee="selectDefaultEmployee"
                  />
                </div>
                <div class="col-6">
                  <MtFormInputDate
                    v-model:date="data.datetime_record"
                    label="メモカルテ記録日時"
                    @update:date="isDatetimeEdited = true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row items-center q-gutter-md q-mb-md">
        <div class="col">
          <div class="q-mb-md" v-if="typeCarteConfigList[4]?.isChecked">
            <h6>
              診療所見
            </h6>
            <div class="q-mt-md" v-for="(codeCommonList, idx) in clinicCommonList" :key="idx">
              <div class="row" :class="idx !== 0 ? 'q-mt-md' : ''">
                <div class="col-12">
                  <q-btn-group outline spread class="btn-options items-center">
                    <template v-for="cliCodeCommon in codeCommonList" :key="cliCodeCommon.id_cli_common">
                      <q-btn
                        :outline="medConditionData[idx].type_med_condition != cliCodeCommon.code_func1"
                        :label="cliCodeCommon.name_cli_common"
                        @click="handleMedCondition(cliCodeCommon, idx)"
                        :style="{backgroundColor: medConditionData[idx].type_med_condition == cliCodeCommon.code_func1 ? '#1d7afc' : '', color: medConditionData[idx].type_med_condition == cliCodeCommon.code_func1 ? '#fff' : ''}"
                      />
                    </template>
                  </q-btn-group>  
                </div>
              </div>
              <div class="row q-mt-md">
                <div class="col-12 flex items-center">
                  <MtInputForm
                    type="text"
                    class="q-mx-lg"
                    label="補足メモ・所見"
                    autogrow
                    style="flex: 1"
                    v-model="medConditionData[idx].memo_record"
                    />
                </div>
              </div>
            </div>
          </div>
        </div>
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

  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="診療所見 入力テンプレート"
    :options="textTemplatesList"
    :data="data"
    @update:memo="handleUpdateMemo"
  />

</template>
<style lang="scss" scoped>
.temp::after {
  content: '℃';
}
.mmHg::after {
  content: 'mmHg';
}
.blood-percent::after {
  content: '%';
}
.respiration-amount::after {
  content: '回/分';
}
.bpm::after {
  content: '回/分 (bpm)';
}
:deep(.q-editor__content) {
  padding: 16px;
}
.editor {
  line-height: 1.7;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }
}
.hide-toolbar {
  :deep(.q-editor__toolbars-container) {
    display: none;
  }
}
.btn-options {
   border-radius: 20px;
  .q-btn--outline:before {
    border: 1px solid #1d7afc;
  }
  .q-btn--outline:not(:first-child):before {
    border-left: 0;
  }
}
</style>