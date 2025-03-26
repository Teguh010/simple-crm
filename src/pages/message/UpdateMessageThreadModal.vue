<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useMessageStore from '@/stores/message-clinic'
import aahMessages from '@/utils/aahMessages'
import useEmployeeStore from '@/stores/employees'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import aahValidations from '@/utils/aahValidations'
import { aahUtilsGetEmployeeName, concatenate, getDateTimeNow, getFullPetName } from '@/utils/aahUtils'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import { sortBy } from 'lodash'
import AddTextTemplateModal from '../task/AddTextTemplateModal.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { typeCustomerThread, typeLinkCategory, typeThreadClassification } from '@/utils/enum'
import { CliCommon } from '@/types/types'
import useCliCommonStore from '@/stores/cli-common'

const messageStore = useMessageStore()
const employeesStore = useEmployeeStore()
const customerStore = useCustomerStore()
const templateStore = useTextTemplateStore()
const cliCommonStore = useCliCommonStore()
const { getTemplates } = storeToRefs(templateStore)
const employeeId = JSON.parse(localStorage?.getItem('id_employee'))
const clinic = localStorage?.getItem('id_clinic')
const emits = defineEmits(['close'])
const customerList = ref<any>([])
const customerListDefault = reactive<any>([])
const employeesList = ref<any>([])
const employeesListDefault = reactive<any>([])
const petList = ref<any>([])
const petListDefault = reactive<any>([])
const typeDepartments = ref<any>([])
const typeDepartmentsDefault = reactive<any>([])
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const data = ref({
  name_thread: null,
  memo_goal: null,
  id_employee_ask: null,
  id_employee_answer: null,
  type_department: null,
  code_customer: '',
  code_pet: '',
  id_pet: '',
  pet_details: null,
  threadClassification: 1,
  linkCategory: 0,
  flg_urgent: false,
  flg_closed: false,
  id_customer: '',
  id_link1: '',
  number_link1: '',
  flg_control_name_thread: true
})
const showPets = ref(false)
const showNumberLink = ref(true)
const closeThread = ref(false)
const isEdit = ref(false)
const isCustomerThread = ref(false)
const setErr = ref('')

const closeModal = () => {
  emits('close')
}

const props = defineProps({
  data: Object,
  id_customer: String,
  id_pet: String
})

const addTemplateModalFlg = ref(false),
  textTemplatesList = ref([])

String.prototype.toHtmlEntities = function () {
  if (
    (/\p{Emoji}/u.test(this) || /(<([^>]+)>)/gi.test(this)) &&
    (!this.includes('https') || /(<([^>]+)>)/gi.test(this)) &&
    (!this.includes('http') || /(<([^>]+)>)/gi.test(this)) &&
    (!this.includes('www.') || /(<([^>]+)>)/gi.test(this))
  ) {
    return this.replace(/[^a-z0-9\s]/gmu, (s) => '&#' + s.codePointAt(0) + ';')
  } else {
    return this
  }
}
const handleEmpName = (empId: number) => {
  if (!empId) return ''
  const id = empId.toString()
  return aahUtilsGetEmployeeName(employeesStore.getAllEmployees, id)
}
const handleSendData = async (threadData: any) => {
  if (props.data?.id_message_thread) {
    if (!props.data?.flg_urgent) {
      let threadDataEdited = {
        name_thread: data.value.flg_control_name_thread
          ? handleAutoTitle()
          : data.value.name_thread,
        memo_goal: data.value.memo_goal,
        type_thread: data.value.threadClassification,
        type_link1:
          data.value.linkCategory !== 0 ? data.value.linkCategory : null,
        id_customer: data.value.id_customer,
        pets: data.value.pets,
        code_customer: data.value.id_customer,
        code_pet: data.value.id_pet,
        flg_pinned: false,
        flg_emr_pinned: false,
        id_employee_ask: data.value.id_employee_ask,
        name_employee_ask: handleEmpName(data.value.id_employee_ask),
        type_department: data.value.type_department,
        id_employee_answer: data.value.id_employee_answer,
        name_employee_answer: handleEmpName(data.value.id_employee_answer),
        flg_urgent: data.value.flg_urgent,
        id_employee_insert: employeeId,
        number_link1:
          data.value.linkCategory !== 0 ? data?.value?.number_link1 : null,
        id_link1: data?.value?.id_link1,
        type_thread_list: props.data.type_thread_list,
        flg_allowed_access_customer: 1,
        flg_closed: null,
        datetime_closed: null,
        id_message_thread: props.data?.id_message_thread,
        id_clinic: clinic.value
      }
      threadDataEdited.flg_closed = closeThread.value
      if (closeThread.value) {
        threadDataEdited.datetime_closed = getDateTimeNow()
      }
      messageStore
        .updateThreadMessages(props.data?.id_message_thread, threadDataEdited)
        .then(async () => {
          await messageStore.fetchThreadMessages()
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
        })
      emits('close')
    }
  } else {
    await messageStore.submitThreadMessages(threadData).then(async () => {
      await messageStore.fetchThreadMessages({ 'flg_closed': false })
      emits('close')
      await mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}
const handleAutoTitle = () => {
  let autoTitle = ''
  const selectedTypeThread = isCustomerThread?.value
    ? typeCustomerThread.find(
      (item) => item.value === data.value.threadClassification
    )
    : typeThreadClassification.find(
      (item) => item.value === data.value.threadClassification
    )
  let selectedTypeLink1 = ''
  let numberLink1 = ''
  const selectedCustomer = customerStore.getAllCustomers?.find(
    (cus) => cus.value == data.value.id_customer
  )
  const selectedPet = customerStore.getCustomer?.pets?.find(
    (pet: any) => pet.value == data.value.id_pet
  )
  if (data.value.linkCategory !== 0) {
    selectedTypeLink1 = typeLinkCategory.find(
      (item) => item.value === data.value.linkCategory
    )
    numberLink1 = data.value.number_link1
    autoTitle =
      (selectedTypeThread?.label !== undefined
        ? selectedTypeThread?.label
        : '') +
      ' ' +
      (selectedTypeLink1?.label !== undefined ? selectedTypeLink1?.label : '') +
      ' ' +
      (numberLink1 !== undefined ? numberLink1 : '') +
      ' ' +
      (handleEmpName(data.value.id_employee_answer) !== undefined
        ? handleEmpName(data.value.id_employee_answer)
        : '') +
      ' ' +
      (selectedCustomer?.code_customer !== undefined
        ? selectedCustomer?.code_customer
        : '') +
      ' ' +
      (getFullPetName(selectedPet, selectedCustomer) !== undefined
        ? getFullPetName(selectedPet, selectedCustomer)
        : '')
    return autoTitle
  } else {
    autoTitle =
      (selectedTypeThread?.label !== undefined
        ? selectedTypeThread?.label
        : '') +
      ' ' +
      (handleEmpName(data.value.id_employee_answer) !== undefined
        ? handleEmpName(data.value.id_employee_answer)
        : '') +
      ' ' +
      (selectedCustomer?.code_customer !== undefined
        ? selectedCustomer?.code_customer
        : '') +
      ' ' +
      (getFullPetName(selectedPet, selectedCustomer) !== undefined
        ? getFullPetName(selectedPet, selectedCustomer)
        : '')
    return autoTitle
  }
}
const submitnewThread = () => {
  let threadData = {
    name_thread: data.value.flg_control_name_thread
      ? handleAutoTitle()
      : data.value.name_thread,
    memo_goal: data.value.memo_goal,
    type_thread: data.value.threadClassification,
    type_link1: data.value.linkCategory !== 0 ? data.value.linkCategory : null,
    id_customer: data.value.id_customer,
    pets: data.value.id_pet ? [data.value.id_pet] : null,
    code_customer: data.value.id_customer,
    code_pet: data.value.id_pet,
    flg_pinned: false,
    flg_emr_pinned: false,
    id_employee_ask: data.value.id_employee_ask,
    name_employee_ask: handleEmpName(data.value.id_employee_ask),
    type_department: data.value.type_department,
    id_employee_answer: data.value.id_employee_answer,
    name_employee_answer: handleEmpName(data.value.id_employee_answer),
    flg_urgent: data.value.flg_urgent,
    id_employee_insert: employeeId,
    number_link1: data?.value?.number_link1,
    id_link1: data?.value?.id_link1,
    id_clinic: clinic?.value,
    type_thread_list: 1,
    flg_allowed_access_customer: 1,
    flg_closed: 0,
    datetime_closed: null,
    flg_read: false
  }


  if (data.value.linkCategory !== 0) {
    if (data?.value?.number_link1 && threadData?.type_department && threadData?.name_employee_ask && threadData?.memo_goal) {
      handleSendData(threadData)
    }
  } else {
    if (threadData?.type_department && threadData?.name_employee_ask && threadData?.memo_goal) {
      threadData.id_link1 = null
      handleSendData(threadData)
    } else {
      setErr.value = '* field required'
      data.value.id_employee_ask = threadData?.name_employee_ask
      data.value.memo_goal = threadData?.memo_goal
    }
  }
}
const handlePetsList = async (value: any) => {
  await customerStore.selectCustomer(value)
  if (value) {
    const selectedCustomer = customerStore?.getCustomer
    if (selectedCustomer) {
      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: any) => {
          petListDefault.push({
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet
          })
        })
        petList.value = [...petListDefault]
        if (!isEdit.value && petList.value.length > 0) {
          data.value.id_pet = petList.value[0].value
        }
      }
    }
  } else {
    data.value.id_pet = ''
    data.value.pets = []
    petList.value.length = 0
    petListDefault.length = 0
    showPets.value = false
    data.value.id_customer = ''
  }
  init()
}
const init = () => {
  setErr.value = ''
  if (data.value.id_customer === null || data.value.id_customer === '') {
    data.value.id_pet = ''
    data.value.pets = []
    showPets.value = false
  } else if (data.value.id_customer !== null || data.value.id_customer !== '') {
    showPets.value = true
  }
  if (petListDefault.length < 1) {
    data.value.id_pet = ''
  }

}
function scrollToBottom() {
  setTimeout(() => {
    let element = document.getElementById('threadModal')
    element?.lastElementChild?.scrollIntoView({
      behavior: 'auto',
      block: 'end'
    })
  }, 100)
}
const handleTypeLink = () => {
  if (data.value.linkCategory === null || data.value.linkCategory === 0) {
    showNumberLink.value = false
  } else if (
    data.value.linkCategory !== null ||
    data.value.linkCategory !== 0
  ) {
    showNumberLink.value = true
    data.value.id_link1 = data.value.number_link1
    scrollToBottom()
  }
}
// const handleMemoTempletes = async (templet) => {
//   let confirmMsg = 'このテンプレートを選択しますか?'
//   await mtUtils.confirm(confirmMsg, '確認', 'はい').then((confirmation) => {
//     if (confirmation) {
//       if (templet) {
//         if (data.value.memo_goal?.length > 0) {
//           data.value.memo_goal += '\n' + templet
//         } else {
//           data.value.memo_goal = templet
//         }
//       }
//       mtUtils.autoCloseAlert(aahMessages.success)
//     }
//   })
// }
const handleCloseThread = async () => {
  let confirmMsg =
    'このスレッドをクローズしますか？/nクローズ後はスレッド一覧で非表示になります。'
  await mtUtils.confirm(confirmMsg, '確認', 'はい').then((confirmation) => {
    if (confirmation) {
      if (props.data?.id_message_thread) {
        props.data.flg_closed = true
        props.data.datetime_closed = getDateTimeNow()
        messageStore.updateThreadMessages(
          props.data?.id_message_thread,
          props.data
        )
      }
      mtUtils.autoCloseAlert(aahMessages.success)
    }
  })
}
const handleNameThreadTitle = (value) => {
  if (value === true) {
    data.value.name_thread = ''
  }
}
// Change the modal header color when it is closed.
const headerClass = computed(() => {
  if (data.value.flg_closed) {
    return 'inactive-row text-grey-050' // When this record is closed, the header will be grey.
  } else if (data.value.flg_urgent) {
    return 'alert-row text-darkred' // When the modal is under "urgent"
  }
  return '' // Default class
})
const iconName = computed(() => {
  if (data.value.flg_closed) {
    return 'do_disturb_on' // Icon for closed.
  } else if (data.value.flg_urgent) {
    return 'run_circle' // Icon for urgency.
  }
  return '' // Default icon
})
const nonUrgency = computed(() => {
  return !data.value.flg_urgent && !data.value.flg_closed
})

const handleThreadTypeText = () => {
  return data.value.threadClassification == 1
    ? '※ 『報告』：回答者が「確認」できれば終了です。'
    : data.value.threadClassification == 2
      ? '※ 『承認が必要』：回答者による依頼者への「承認」を得られれば終了です。'
      : data.value.threadClassification == 3
        ? '※ 『指示の要求』：回答者が回答する指示内容を依頼者が確認できれば終了です。'
        : data.value.threadClassification == 10
          ? ' ※ 『その他』：スレッドはクローズされるまでオープン状態で維持できます。'
          : data.value.threadClassification == 50
            ? '※ 『処方箋のご予約』'
            : data.value.threadClassification == 60
              ? '※ 『ホテルのご予約』'
              : data.value.threadClassification == 70
                ? '※ 『美容のご予約』'
                : ''
}

const openSearchTemplateModal = async () => {
  if (getTemplates.value.length === 0) {
    await templateStore.fetchTemplates()
  }
  if (
    getTemplates.value &&
    getTemplates.value.length &&
    getTemplates.value.length > 0
  ) {
    textTemplatesList.value = sortBy(getTemplates.value, 'display_order', 'asc')
      .filter((template) => template?.type_text_template === 61)
      .map((template: any) => {
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
    // let menuOptions: any = sortBy(getTemplates.value, 'display_order', 'asc').filter((template) => template?.type_text_template === 61).map((template: any) => {
    //   return {
    //     title: template.memo_template,
    //     attr: {
    //       class: template.flg_title ? 'bg-grey-300' : ''
    //     },
    //     isSelected: false
    //   }
    // })
    // await mtUtils.smallPopup(OptionModal2, { modelTitle: 'スレッド指示コンテンツのテンプレート', options: menuOptions, data })
    // let selectedOption = menuOptions.find((item: any) => item.isChanged == true)
    // if (selectedOption) {
    //   data.value.memo_goal = data.value.memo_goal ? `${data.value.memo_goal}\n${selectedOption?.title}` : selectedOption?.title
    //   mtUtils.autoCloseAlert(aahMessages.success)
    // }
  }
}

const selectDefaultEmployee = (key: string) => {
  data.value[key] = defaultEmployee
}

onMounted(async () => {
  await Promise.all([
    templateStore.fetchTemplates(),
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [1] })
  ])
  employeesList.value.length = 0
  employeesListDefault.length = 0
  employeesList.value = [...employeesStore.getEmployeeListOptions]
  employeesListDefault.push(...employeesStore.getEmployeeListOptions)
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  typeDepartments.value.length = 0
  typeDepartmentsDefault.length = 0
  typeDepartments.value = [...cliCommonStore.getCliCommonTypeDepartmentList.map((obj: CliCommon) => ({
    label: obj.name_cli_common,
    value: obj.code_func1
  }))]
  typeDepartmentsDefault.push(...typeDepartments.value)
  if (props.id_customer && props.id_pet) {
    data.value.id_customer = props.id_customer
    await handlePetsList(props.id_customer)
    data.value.id_pet = props.id_pet
  }
  if (props.data?.id_message_thread) {
    data.value.name_thread = props.data?.name_thread
    data.value.memo_goal = props.data?.memo_goal
    data.value.id_employee_ask = props.data?.id_employee_ask
    data.value.id_employee_answer = props.data?.id_employee_answer
    data.value.id_pet = props.data?.id_pet
    data.value.type_department = props.data?.type_department
    data.value.threadClassification = props.data?.type_thread
    data.value.linkCategory =
      props.data?.type_link1 === null ? 0 : props.data?.type_link1
    data.value.flg_urgent = props.data?.flg_urgent
    data.value.id_customer = props.data?.id_customer
    data.value.code_customer = props.data?.code_customer
    data.value.code_pet = props.data?.code_pet
    data.value.number_link1 = props?.data?.number_link1
    data.value.id_link1 = props?.data?.id_link1
    isEdit.value = true
    const messageCustomerThread = typeCustomerThread.find(
      (thrd: any) => thrd?.value === props.data?.type_thread
    )
    if (messageCustomerThread) {
      isCustomerThread.value = true
      data.value.flg_control_name_thread = false
    } else {
      isCustomerThread.value = false
    }
    handleTypeLink()
    if (props.data.id_customer) {
      showPets.value = true
    } else {
      showPets.value = false
    }
  } else if (props.data) {
    data.value.memo_goal = props.data?.memo_goal
    data.value.id_pet = props.data?.id_pet
    data.value.id_customer = props.data?.id_customer
    data.value.linkCategory = props.data?.category
    data.value.number_link1 = props.data?.id_link1
    data.value.id_employee_answer = props.data?.id_employee_answer
    data.value.id_employee_ask = employeeId
    handleTypeLink()
  } else {
    if (localStorage.getItem('pageAction') === 'createThread') {
      let messageThreadData = JSON.parse(localStorage.getItem('createThread'))
      if (messageThreadData && Object.keys(messageThreadData)?.length > 0) {
        data.value.id_customer = messageThreadData.id_customer
        data.value.linkCategory = messageThreadData.linkCategory
        data.value.number_link1 = messageThreadData.number_link1
        data.value.memo_goal = messageThreadData.memo_goal
        await handlePetsList(data.value.id_customer)
        data.value.id_pet = messageThreadData.id_pet
        if (data.value.linkCategory !== null || data.value.linkCategory !== 0) {
          showNumberLink.value = true
          data.value.id_link1 = messageThreadData?.id_link1 ?? ''
        }
      }
      localStorage.removeItem('pageAction')
      localStorage.removeItem('createThread')
    }
    data.value.id_employee_ask = employeeId
    isEdit.value = false
    isCustomerThread.value = false
    init()
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal" :class="headerClass">
    <q-toolbar-title class="title2 bold">
      <q-icon v-if="!nonUrgency" :name="iconName" class="q-mr-xs" size="24px" />
      <span v-if="data.flg_closed">[ 終了しました ]</span>
      {{ isCustomerThread ? 'オーナー' : '院内' }}
      {{ isEdit ? 'スレッド' : ' 新規 スレッド' }}
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content flex no-wrap q-px-xl">
    <div id="threadModal" class="fit">
      <!-- Basic setting -->
      <div class="q-mb-md">
        <h4 class="text-white bg-grey-600 title4">
          {{ isEdit ? '基本設定' : '何を達成しますか？' }}
        </h4>
        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
          {{
            isEdit
              ? '区分・名称・目的は変更できません。'
              : 'スレッドの目的区分や目的詳細を設定してください。'
          }}
        </span>
      </div>
      <div v-if="!isCustomerThread" class="q-col-gutter-md q-mb-lg">
        <div class="row">
          <div class="col-auto">
            <span class="body1 regular text-grey-700">スレッド区分 :</span>
          </div>
          <div class="col-9">
            <MtInputForm :disable="isEdit" type="radio" v-model="data.threadClassification" :items="isCustomerThread
                ? typeCustomerThread
                : typeThreadClassification
              " class="q-mr-xs" />
          </div>
        </div>
        <span class="caption1 regular text-grey-700">
          {{ handleThreadTypeText() }}
        </span>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div v-if="!data.flg_control_name_thread" :class="[
          isEdit && data.name_thread === undefined ? 'col-12' : 'col-9'
        ]">
          <MtInputForm type="text" v-model="data.name_thread" :filled="data.flg_control_name_thread" :label="data.flg_control_name_thread
              ? '保存時に自動でタイトルを生成します'
              : 'スレッド名*'
            " :required="!data.flg_control_name_thread" :readonly="isEdit" />
        </div>
        <div v-if="!isCustomerThread" class="col-auto">
          <div v-if="data.name_thread !== undefined">
            <MtInputForm type="checkbox" :items="[{ label: '自動タイトル' }]" v-model="data.flg_control_name_thread"
              @update:model-value="handleNameThreadTitle" />
          </div>
          <div v-else></div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <MtInputForm type="text" v-model="data.memo_goal" :label="[
            isEdit
              ? 'スレッド目的*'
              : 'スレッド目的（初回の投稿内容になります）*'
          ]" autogrow class="add-template-field" :readonly="isEdit">
            <template v-if="!isEdit" v-slot:append>
              <q-icon name="add" class="cursor-pointer" @click.stop="openSearchTemplateModal">
              </q-icon>
            </template>
          </MtInputForm>
          <p v-if="setErr && !data.memo_goal" class="text-red">{{ setErr }}</p>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm type="checkbox" :items="[{ label: '至急' }]" v-model="data.flg_urgent" />
        </div>
      </div>
      <div v-if="isEdit" class="row q-col-gutter-md q-mt-xs">
        <div class="col-4">
          <MtInputForm type="checkbox" :items="[{ label: 'クローズ' }]" v-model="closeThread" />
        </div>
      </div>
      <hr class="light q-mb-lg" />
      <div v-if="!isCustomerThread">
        <!-- From who to who, until when the task needs to be done -->
        <div class="q-mb-md">
          <h4 class="text-white bg-grey-600 title4">
            {{ isEdit ? '質問者・回答者' : '誰に質問しますか？' }}
          </h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{
              isEdit
                ? '回答者のみ変更可能です。'
                : '回答を依頼する担当者を指定してください。'
            }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-4">
            <InputEmployeeOptGroup v-model:selected="data.id_employee_ask" label="質問者名*" :readonly="isEdit"
              :rules="[aahValidations.validationRequired]" required show-select-default-employee
              @update:select-default-employee="selectDefaultEmployee('id_employee_ask')" />
            <p v-if="setErr && !data.id_employee_ask" class="text-red">{{ setErr }}</p>
          </div>
          <div class="col-4">
            <MtFilterSelect v-model:selecting="data.type_department" :options-default="typeDepartmentsDefault"
              :options="typeDepartments" label="回答部署 *" :rules="[aahValidations.validationRequired]" required />
            <p v-if="setErr && !data.type_department" class="text-red">{{ setErr }}</p>
          </div>
          <div class="col-4">
            <InputEmployeeOptGroup v-model:selected="data.id_employee_answer" label="希望回答者 "
              show-select-default-employee
              @update:select-default-employee="selectDefaultEmployee('id_employee_answer')" />
          </div>
        </div>
        <hr class="light q-mb-lg" />
      </div>
      <!-- What external data needs to be associated with this message thread -->
      <div class="q-mb-md">
        <h4 class="text-white bg-grey-600 title4">
          {{ isEdit ? '連携データ' : '連携データはありますか？' }}
        </h4>
        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
          {{
            isEdit
              ? '連携データは更新できます。'
              : '各種連携データの「番号」を入力してください。'
          }}
        </span>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-4">
          <MtFilterSelect v-model:selecting="data.id_customer" v-model:options="customerList"
            :options-default="customerListDefault" label="診察券番号・オーナー名" :disable="props.isCustomerThread"
            @update:selecting="handlePetsList" />
        </div>
        <div class="col-4">
          <MtFilterSelect v-if="showPets" v-model:selecting="data.id_pet" :options-default="petListDefault"
            :options="petList" label="ペット名" />
        </div>
      </div>
      <div v-if="!isCustomerThread" class="row q-col-gutter-md q-mb-lg">
        <div class="col-auto">
          <span class="body1 regular text-grey-700">連携区分 :</span>
        </div>
        <div class="col-10">
          <MtInputForm type="radio" v-model="data.linkCategory" :items="typeLinkCategory" class="q-mr-lg"
            @click="handleTypeLink" />
          <div class="row">
            <div class="col-4 q-mt-sm q-mb-lg">
              <MtInputForm v-if="showNumberLink" type="text" v-model="data.number_link1" label="連携番号" required
                :rules="[aahValidations.validationRequired]" />
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
      <q-btn unelevated color="primary" class="q-ml-md" @click="submitnewThread()">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
  <AddTextTemplateModal v-model:value="addTemplateModalFlg" modelTitle="テンプレート文章を選択" :options="textTemplatesList"
    :data="data" memoKey="memo_goal" />
</template>

<style lang="scss" scoped>
.memoTempleteBox {
  width: 20%;
  max-height: 1420px;
  overflow-y: scroll;
  -ms-overflow-style: none;
  /* Internet Explorer 10+ */
  scrollbar-width: none;
  /* Firefox */
}

.memoTempleteBox::-webkit-scrollbar {
  display: none;
  /* Safari and Chrome */
}

.templeteBorders {
  border: 1px solid #dddddd;
}

.add-template-field {
  .q-field__control {
    align-items: center !important;
  }
}
</style>
