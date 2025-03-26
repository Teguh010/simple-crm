<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
// import MtHeader from '@/components/layouts/MtHeader.vue'
// import mtUtils from '@/utils/mtUtils'
// import useCustomerStore from '@/stores/customers'
// import useActionStore from '@/stores/action'
// import { storeToRefs } from 'pinia'
// import useQueueTicketStore from '@/stores/queue_ticket'
// import UpdateQueueTicketModal from './UpdateQueueTicketModal.vue'
// import useEmployeeStore from '@/stores/employees'
import {
  changeToggleDropdownNames,
  getDateToday,
  updateBtnLabel
} from '@/utils/aahUtils'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue';
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useTextTemplateStore from '@/stores/text-template'
import useClinicStore from '@/stores/clinics'
import useQueueTicketStore from '@/stores/queue_ticket'
import { storeToRefs } from 'pinia'
import { sortBy } from 'lodash'
import mtUtils from '@/utils/mtUtils'


const templateStore = useTextTemplateStore()
const clinicStore = useClinicStore()
const queueTicketStore = useQueueTicketStore()

const { getTemplates } = storeToRefs(templateStore)

const emits = defineEmits(['close'])
const todaysDate = getDateToday()
const props = defineProps({ queueTicketData: Object })
const data = ref({
  recipient: '',
  // subject: `【${clinicStore.getClinic.name_clinic_display}】 受付からのお知らせ`,
  subject: '',
  body: ''
})
const targetRef = ref()
const foreColor = ref('#ffff00')
let observer = null
const textTemplatesList = ref([])
const addTemplateModalFlg = ref(false)


const closeModal = () => {
  emits('close')
}

const submit = async () => {
  const id_queue_ticket = props.queueTicketData.id_queue_ticket
  const resp = await queueTicketStore.sendEmail(id_queue_ticket, data.value)
  mtUtils.autoCloseAlert('メールを送信しました！')
  closeModal()
}

const colorClicked = () => {
  const edit = targetRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
}

const recipientEmails = computed(() => {
  const returnValue = []
  const customer = props.queueTicketData.customer
  if (customer.email_title1 && customer.email1) {
    returnValue.push(
      {
        label: `${customer.email_title1 + " | " + customer.email1}`,
        value: customer.email1
      }
    )
  }
  if (customer.email_title2 && customer.email2) {
    returnValue.push(
      {
        label: `${customer.email_title2 + " | " + customer.email2}`,
        value: customer.email2
      }
    )
  }
  if (returnValue.length) {
    data.value.recipient = returnValue[0].value
  }

  return returnValue
})

const getTemplateList = async () => {
  if (getTemplates.value.length === 0) {
    await templateStore.fetchTemplates()
  }
  if (getTemplates.value.length) {
    textTemplatesList.value = sortBy(getTemplates.value, 'display_order', 'asc')
      .filter((template) => template.type_text_template === 120)
      .map((template: any, index: number) => {
        return {
          title: template.memo_template,
          flg_title: template.flg_title,
          attr: {
            class: template.flg_title ? 'bg-grey-300' : ''
          },
          isSelected: index === 0 ? true : false
        }
      })

    getSelectedTextTemplate(textTemplatesList.value[0].title)
  }
}

const getSelectedTextTemplate = async (template: String) => {
  template = template.replaceAll('<br>', '\r\n')
  template = template.replaceAll('{オーナー名}', `${props.queueTicketData.customer.name_family} ${props.queueTicketData.customer.name_first}`)
  template = template.replaceAll('{m_customer.name_family}', '')
  template = template.replaceAll('{m_customer.name_first}', '')
  template = template.replaceAll('{ペット名}', props.queueTicketData.petList[0].name_pet)
  template = template.replaceAll('{m_pet.name_pet}', '')
  
  var clinicObj = JSON.parse(localStorage.getItem('clinic'))
  if (clinicObj == null) {
    const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    clinicObj = await clinicStore.fetchClinicById(id_clinic)
  }
  clinicObj.name_clinic = clinicObj?.label

  const jsonToSearchIn = props.queueTicketData
  const dataSources = [clinicObj, jsonToSearchIn]
  dataSources.forEach((source) => {
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        template = template.replace(`{${key}}`, source[key])
      }
    }
  })
  data.value.body = template
}

const checkObserverAndToggleToJp = () => {
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
}

const openSearchTemplateModal = () => {
  addTemplateModalFlg.value = true
}

const init = async () => {
  let name_clinic_display = clinicStore.getClinic?.name_clinic_display
  if(!Boolean(name_clinic_display)){
    await clinicStore.fetchClinicById(props.queueTicketData?.id_clinic)
    name_clinic_display = clinicStore.getClinic?.name_clinic_display
  }
  data.value.subject = `【${name_clinic_display}】 受付からのお知らせ`
}

onMounted(async () => {
  checkObserverAndToggleToJp()
  init()
  await getTemplateList()
})
</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <span>{{ props?.queueTicketData?.customer?.name_customer_display }} 通知メール送信</span>
      </q-toolbar-title>
      <q-btn
        icon="queue"
        label="テンプレ"
        flat
        class="cursor-pointer"
        @click.stop="openSearchTemplateModal"
      >
      </q-btn>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-lg">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtFormPullDown
          type="selection"
          label="送信対象メール"
          outlined
          v-model:selected="data.recipient"
          :options="recipientEmails"
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <!-- <div class="q-ml-auto">
      </div> -->
      <div class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          outlined
          type="text"
          label="メールタイトル *"
          v-model="data.subject"
          :rules="[aahValidations.validationRequired]"
        />
      </div>
      <div id="t_info_detail_container" class="col-lg-12 col-md-12 col-sm-12">
        <MtInputForm
          outlined
          label="メール本文 *"
          class="textarea"
          maxlength="500"
          type="textarea"
          tabindex="10"
          autogrow
          @update:model-value="updateBtnLabel"
          v-model="data.body"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>メール送信</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="入力テンプレート"
    :options="textTemplatesList"
    :data="data"
    @update:memo="getSelectedTextTemplate"
  />
</template>

<style lang="scss" scoped>

</style>
