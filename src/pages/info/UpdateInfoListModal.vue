<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, withDefaults, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import { sortBy } from 'lodash'

// Utilities
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import {
  changeToggleDropdownNames,
  dateFormat,
  extractContent,
  getDateToday,
  updateBtnLabel,
  getClinicCompleteAddress,
  concatenate
} from '@/utils/aahUtils'
import { imageResize } from '@/utils/helper'
import { typeDisplay, typeInfo } from '@/utils/enum'
import { CUSTOMER_OWNER_DETAILS } from '@/utils/const/emailPpsVariableName'
import { event_bus } from '@/utils/eventBus'
import { debounce } from 'lodash'

// Stores
import useCustomerStore from '@/stores/customers'
import useInfoStore from '@/stores/info'
import useInfoDetailStore from '@/stores/infoDetail'
import useServiceDetailStore from '@/stores/service-details'
import useMessageStore from '@/stores/message-clinic'
import useRequestStore from '@/stores/requests'
import useTextTemplateStore from '@/stores/text-template'
import useClinicStore from '@/stores/clinics'

// Components
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import OptionModal from '@/components/OptionModal.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import dayjs from 'dayjs'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'

const CHAR_LIMIT = 1000

// Lazy-loaded Components
const SearchServiceDetailModal = defineAsyncComponent(() => import('@/pages/request/serviceDetail/ScheduledPDF.vue'))
const AddTextTemplateModal = defineAsyncComponent(() => import('@/pages/task/AddTextTemplateModal.vue'))
const EmailModal = defineAsyncComponent(() => import('@/components/EmailModal.vue'))

// Store Instances
const infoStore = useInfoStore()
const customerStore = useCustomerStore()
const infoDetailStore = useInfoDetailStore()
const templateStore = useTextTemplateStore()
const messageStore = useMessageStore()
const requestStore = useRequestStore()
const clinicStore = useClinicStore()

// Store References
const { getSelectedServiceDetailRecordList } = storeToRefs(useServiceDetailStore())
const { getCustomer, getPet } = storeToRefs(customerStore)
const { getTemplates } = storeToRefs(templateStore)

// const props = defineProps({
//   data: Object,
//   searchData: { type: Function, default: () => {} },
//   predefinedFile: Blob,
//   predefinedMessage: String,
//   customerObj: Object,
//   fromCart: { type: Boolean, default: false}
// })
const props = withDefaults(
defineProps<{
  data: InfoListType,
  fromCart: boolean,
  predefinedFile: Blob,
  predefinedMessage: string,
  customerObj: CustomerType,
  petObj: Object,
  lineMessageType: string,
  fromLabResult: boolean,
  pdfFileName: string,
  checkedCustomers: Array,
  fromViewPetModal: boolean
}>(), {
  data: () => { return {} as InfoListType },
  fromCart: false,
  predefinedFile: () => { return {} as Blob },
  predefinedMessage: '',
  customerObj: () => { return {} as CustomerType },
  petObj: () => { return {} as Object },
  lineMessageType: 'lab_report',
  fromLabResult: false,
  pdfFileName: 'file.pdf',
  checkedCustomers: [],
  fromViewPetModal: false
})

const isEdit = ref(false)
const AllLineUsers = ref([])
const selectedCutomerId = ref('')
const emits = defineEmits(['close'])
const route = useRoute()
const textTemplatesList = ref([])
const addTemplateModalFlg = ref(false)

let observer = null // it will watch DOM changes

const data_info = ref({
  type_info: 1,
  type_display: 1,
  title: '',
  flg_all_customer: true,
  id_customer: 0,
  name_customer: '',
  code_customer: '',
  code_pet: '',
  name_pet: '',
  id_info_detail: 0,
  flg_read: false,
  date_start: getDateToday(),
  date_end: dateFormat(date.addToDate(getDateToday(), { year: 1, day: -1 })),
  info_list: null,
  id_pet: 0,
  id_clinic: 0,
  send_line: false,
  selected_line_users: [],
  line_message_type: ''
})
const data_info_detail = ref({
  content: '',
  file_path1: '',
  file_path2: '',
  file_path3: '',
  file_path1_name: '',
  file_path2_name: '',
  file_path3_name: '',
})

const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const dmCustomerSelected: any = ref([])

const file_path1 = ref()
const file_path2 = ref()
const file_path3 = ref()
const file_name1 = ref('')
const file_name2 = ref('')
const file_name3 = ref('')
const f1_status = ref('unchanged')
const f2_status = ref('unchanged')
const f3_status = ref('unchanged')
const targetRef = ref()
const foreColor = ref('#ffff00')
const customPetDisable = ref(false);
const customCustomerDisable = ref(false);

const strippedContent = ref('')

// const strippedContent = computed(() => {
//   return data_info_detail.value.content.replace(/<[^>]*>/g, '')
//     .replace(/&nbsp;/g, ' ') // Replace &nbsp; with a space
//     .replace(/&lt;/g, '<')   // Replace &lt; with <
//     .replace(/&gt;/g, '>')   // Replace &gt; with >
//     .replace(/&amp;/g, '&')  // Replace &amp; with &
//     .replace(/&quot;/g, '"') // Replace &quot; with "
//     .replace(/&apos;/g, "'"); // Replace &apos; with '
// })

const stripContent = debounce((content: string) => {
  strippedContent.value = content.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with a space
    .replace(/&lt;/g, '<')   // Replace &lt; with <
    .replace(/&gt;/g, '>')   // Replace &gt; with >
    .replace(/&amp;/g, '&')  // Replace &amp; with &
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&apos;/g, "'"); // Replace &apos; with '
  
    updateBtnLabel(content)
}, 100)

const searchData = () => {
  event_bus.emit('searchData')
}
const closeModal = () => {
  emits('close')
}
const removeImage = (type: any) => {
  const variable = eval(type)
  variable.value = null
  data_info_detail.value[type] = null
  const statuVar = eval('f' + type.replace('file_path', '') + '_status')
  statuVar.value = 'removed'
}
const getResizedImage = (file: any) => {
  return Promise.resolve(imageResize(file))
}
async function onFilePicked(e: any, type: any) {
  const file = e.target.files[0]
  const variable = eval(type)
  if (file.type.startsWith('image/')) {
    const i = await getResizedImage(file)
    variable.value = URL.createObjectURL(i)
    variable.value += '#type=.img'
  } else {
    variable.value = URL.createObjectURL(file)
    variable.value += '#type=.pdf'
  }
  data_info_detail.value[type] = file
  data_info_detail.value[`${type}_name`] = file.name
  const statuVar = eval('f' + type.replace('file_path', '') + '_status')
  statuVar.value = 'changed'
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
        .confirm('本当に削除しますか？', '確認') //TODO: 共通化する必要あり
        .then((confirmation) => {
          if (confirmation) {
            infoStore.destroyInfo(data_info.value.id_notification).then(() => {
              searchData()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const sendLineNotificationAllLineUser = (data: any, type: any) => {
  const textMessage = extractContent(data_info_detail?.value?.content)
  if (type === 'All') {
    if (data.length > 0) {
      messageStore.sendMessageOnLine('', textMessage)
    }
    // data.length > 0 && data.forEach((user:any) => {
    // })
  } else {
    if (data?.line_user_id) {
      messageStore.sendMessageOnLine(data?.line_user_id, textMessage)
    }
  }
}

const prepare_email_body = (clinicData) => {
  const customer = getCustomer.value
  const t_info_detail_content = data_info_detail.value.content
  let truncatedContent = t_info_detail_content.length > 100
    ? t_info_detail_content.substring(0, 100) + "..."
    : t_info_detail_content;
  let pps_info_detail_page_dynamic_url = `https://my.vetty.clinic/${clinicData.id_clinic}/notifications`
  let clinicCompleteAddress = getClinicCompleteAddress(clinicData).trim()

  const body = `${customer.name_customer_display} 様

${clinicData?.name_clinic_display} からお知らせがあります。
===
${truncatedContent}

${pps_info_detail_page_dynamic_url}
===
何かご不明な点がございましたら病院受付までお問い合わせください。


${clinicData?.name_clinic_display}
${clinicCompleteAddress}
電話: ${clinicData?.phone1} 
ホームページ: ${clinicData?.url_clinic}
お電話での問い合わせは診療時間内のみになりますので予めご了承ください。

  `
  return body
}

const open_email_modal = async () => {
  const customer = getCustomer.value
  const emailToSend = customer.email1 ? customer.email1 : customer.email2
  const currentClinic = clinicStore.getClinics.find((cli:object) => cli.id_clinic === data_info.value.id_clinic)
  const name_clinic_display = currentClinic?.name_clinic_display
  const subject = `【${name_clinic_display}】 ${data_info.value.title}`;
  const body = prepare_email_body(currentClinic)
  await mtUtils.smallPopup(EmailModal,{emailToSend: emailToSend, subject: subject, body: body})
}

const submitWithLine = async () => {
  data_info.value.send_line = true
  data_info.value.line_message_type = props.lineMessageType
  const confirmation = await mtUtils.confirm("", "確認をクリックすると選択したオーナー様に メッセージが送信されます。よろしいですか？", "確認")
  if(!confirmation)
    return
  await submit(true)
}

const submit = async (skipConfirmation = false) => {
  if(strippedContent.value.length > CHAR_LIMIT) {
    return
  }
  
  if (data_info?.value?.type_display === 3) {
    if (AllLineUsers?.value?.length > 0) {
      // sendLineNotificationAllLineUser(AllLineUsers?.value, 'All')
      if(data_info.value.send_line && props.lineMessageType === 'multicast_message') {
        data_info.value.selected_line_users =
          [...new Map(AllLineUsers?.value
            .filter(user => user.line_user_id.startsWith('U'))
            .map(user => [user.line_user_id, user]))
            .values()]
            .map(user => user.line_user_id)
      }
    } else {
      if (selectedCutomerId.value) {
        const AllCustomer = customerStore?.getAllCustomerPreps.find(
          (item) => item.id_customer === selectedCutomerId?.value
        )
        if (AllCustomer) {
          if(data_info.value.send_line && props.lineMessageType === 'multicast_message') {
            data_info.value.selected_line_users = [AllCustomer.line_user_id]
          }
          // sendLineNotificationAllLineUser(AllCustomer, 'Single')
        }
      }
    }
  }
  let bulk_create = false
  if (!data_info_detail.value.content) {
    await mtUtils.alert('ItemDetail.content is required.', 'Validation Error')
    return
  }
  if (
    getSelectedServiceDetailRecordList.value &&
    getSelectedServiceDetailRecordList.value.length > 0
  ) {
    const confirmation = await mtUtils.confirm(
      `You are going to create notification for ( ${getSelectedServiceDetailRecordList.value.length} ) customer !`,
      'Alert Bulk Create'
    )
    if (!confirmation) return
  }

  if (props.data?.id_notification) {
    // This is for case where user change from Draft / Hidden to Publish
    await infoDetailStore.updateInfoDetail(
      data_info_detail.value.id_info_detail,
      data_info_detail.value
    )
    await infoStore.updateInfo(data_info.value.id_notification, data_info.value)
    searchData()
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
    return
  }
  if (
    getSelectedServiceDetailRecordList.value &&
    getSelectedServiceDetailRecordList.value.length &&
    getSelectedServiceDetailRecordList.value.length > 0
  ) {
    data_info.value.info_list = getSelectedServiceDetailRecordList.value.map(
      (row: any) => ({
        id_customer: row.id_customer,
        name_pet: row.pet?.name_pet,
        name_customer: row.customer?.name_family + row.customer?.name_first,
        code_customer: row.customer?.code_customer,
        code_pet: row.pet?.code_pet
      })
    )

    bulk_create = true
  }

  // Handle email confirmation
  if(!skipConfirmation && data_info?.value?.type_display === 3) {
    const confirmationMessage = (props.lineMessageType === 'billing' || props.lineMessageType === 'lab_report') 
      ? '確認を押すと選択したオーナー様のmyVettyのお知らせページとご登録のEメールにこの内容が送信されます。' 
      : 'メール通知も送信する場合はご確認ください。'
    const email_confirmation = await mtUtils.confirm("", confirmationMessage, "確認", "いいえ")
    data_info.value['send_email'] = email_confirmation === 'send'
  }

  if (props.checkedCustomers.length > 0) {
    // This triggered from SearchDmCustomerPetList
    const selectedLineUserId = props.checkedCustomers
      .map((checkedData: any) => {
        const isUserFound = customerStore.getAllCustomerPreps.find(
          (item) => item.code_customer === checkedData.customer.code_customer
        )
        return isUserFound?.line_user_id?.startsWith('U') ? isUserFound.line_user_id : null
      })
      .filter(Boolean)

    await infoDetailStore.submitInfoDetail(data_info_detail.value)
    data_info_detail.value = infoDetailStore.getRecentInfoDetail
    data_info.value.id_info_detail = data_info_detail.value.id_info_detail
    data_info.value.flg_all_customer = false
    data_info.value.selected_line_users = data_info.value.type_display === 3 ? [...selectedLineUserId] : []
    await infoStore.submitInfo(data_info.value)
    emits('close')
    await mtUtils.autoCloseAlert(aahMessages.success)
  } else {
    await infoDetailStore.submitInfoDetail(data_info_detail.value).then((res) => {
      const textMessage = extractContent(data_info_detail?.value?.content)
      if (
        selectedCutomerId.value &&
        res?.file_path1 &&
        res?.file_path1.split('/')[4].includes('.pdf')
      ) {
        RequestStore.sendPdf(
          selectedCutomerId.value,
          res?.file_path1,
          textMessage
        )
      }
    })
    data_info_detail.value = infoDetailStore.getRecentInfoDetail
    data_info.value.id_info_detail = data_info_detail.value.id_info_detail
    bulk_create
      ? await infoStore.bulkCreateInfo(data_info.value)
      : await infoStore.submitInfo(data_info.value)

    searchData()
    emits('close')
    await mtUtils.autoCloseAlert(aahMessages.success)
  }
}

const customerUpdated = async (selected_customer: any, id_pet: any) => {
  if (!selected_customer) return
  if(props.checkedCustomers.length > 0){
    dmCustomerSelected.value = selected_customer.map(cc => cc.label ? cc.value : cc)
  }else{
    selectedCutomerId.value = selected_customer
    data_info.value.name_customer = customerList.value[0]?.name_customer_display
    data_info.value.code_customer = customerList.value[0]?.code_customer
    await customerStore.selectCustomer(data_info.value.id_customer)
    petList.value = customerStore.getCustomer.pets
    if (petList.value && petList.value.length && petList.value.length > 0) {
      let firstPet: any = Boolean(id_pet) ?  petList.value.find(p => p.id_pet == id_pet) : petList.value[0]
      data_info.value.id_pet = firstPet.id_pet
      petUpdated(firstPet.id_pet)
    }
    useServiceDetailStore().setSelectedServiceDetailRecordList([])
  }
}

const petUpdated = async (selected_pet: any) => {
  const pet = petList.value.find((i) => i.value == selected_pet)
  if (pet) {
    data_info.value.name_pet = pet.name_pet
    data_info.value.code_pet = pet.code_pet
  } else {
    data_info.value.name_pet = data_info.value.code_pet = null
  }
}

const updateFlgAllCustomer = (flg: any) => {
  if (flg) {
    ;[
      'id_customer',
      'name_customer',
      'code_customer',
      'id_pet',
      'name_pet',
      'code_pet'
    ].forEach((v) => {
      data_info.value[v] = null
    })
    let AllUserArr = [...customerStore.getAllCustomerPreps]
    AllUserArr.length > 0 &&
      AllUserArr.forEach((user) => {
        if (user?.line_user_id) {
          AllLineUsers.value.push(user)
        }
      })
  } else {
    AllLineUsers.value = []
  }
}

async function openSearchServiceModal() {
  await mtUtils.popup(SearchServiceDetailModal, { isSearch: true })
}

const colorClicked = () => {
  const edit = targetRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
}

const updateDateEnd = (date_start: String) => {
  if (!Boolean(date_start)) return false
  data_info.value.date_end = dateFormat(
    date.addToDate(date_start, { year: 1, day: -1 })
  )
}

const getFileName = (url: String) => {
  if (!url) return ''
  const [fileUrl, expiry] = url.split('?')
  const fileNameWithExt = fileUrl.split('/').pop()
  return fileNameWithExt
}

const fetchTextTemplates = async (typeTextTemplate: Number = 110) => {
  if (getTemplates.value.length === 0) {
    await templateStore.fetchTemplates()
  }
  if (
    getTemplates.value &&
    getTemplates.value.length &&
    getTemplates.value.length > 0
  ) {
    textTemplatesList.value = sortBy(getTemplates.value, 'display_order', 'asc')
      .filter((template) => template.type_text_template === typeTextTemplate)
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
  }
}

const openSearchTemplateModal = async () => {
  await fetchTextTemplates()
  if (
    getTemplates.value &&
    getTemplates.value.length &&
    getTemplates.value.length > 0
  ) {
    addTemplateModalFlg.value = true
  }
}

const getSelectedTextTemplate = async (template: String) => {
  const { owner_name, pet_name } = CUSTOMER_OWNER_DETAILS
  template = template.replaceAll('<br>', '\r\n')
  template = template.replaceAll(owner_name, getCustomerName())
  template = template.replaceAll('様', '様 <br>')
  template = template.replaceAll('{m_customer.name_family}', '')
  template = template.replaceAll('{m_customer.name_first}', '')
  template = template.replaceAll(pet_name, getPetName())
  template = template.replaceAll('{m_pet.name_pet}', '')

  var clinicObj = JSON.parse(localStorage.getItem('clinic'))
  if (clinicObj == null) {
    const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    clinicObj = await clinicStore.fetchClinicById(id_clinic)
  }
  clinicObj.name_clinic = clinicObj?.label

  const dataSources = [data_info.value, clinicObj]
  dataSources.forEach((source) => {
    for (let key in source) {
      if (source.hasOwnProperty(key)) {
        template = template.replace(`{${key}}`, source[key])
      }
    }
  })
  data_info_detail.value.content = template
}

const getCustomerName = () => {
  if(props.customerObj && Object.keys(props.customerObj).length > 0) return `${props.customerObj.name_family} ${props.customerObj.name_first}`
  const customer: CustomerType | undefined = customerStore.getAllCustomerPreps.find((customer: CustomerType) => customer.id_customer === data_info.value.id_customer)
  if(customer) return `${customer.name_family} ${customer.name_first}`
  return ''
}

const getPetName = () => {
  if(props.customerObj && Object.keys(props.customerObj).length > 0) return props.customerObj?.pets[0]?.name_pet
  if(petList.value && petList.value.length && petList.value.length > 0) {
    const pet: PetType | undefined = petList.value.find((pet: PetType) => pet.id_pet === data_info.value.id_pet)
    return pet?.name_pet ?? ''
  }
  return ''
}

const initForPetModal = async () => {
  let customer = props.customerObj
  let pet  = props.petObj
  data_info.value.flg_all_customer = false
  data_info.value.id_customer = customer.id_customer
  await customerUpdated(data_info.value.id_customer, pet?.id_pet)
  customPetDisable.value = true;
  customCustomerDisable.value = true;

}

onMounted(async () => {
  useServiceDetailStore().setSelectedServiceDetailRecordList([])
  if(customerStore.getCustomerListOptions.length === 0) {
    await customerStore.fetchPreparationCustomers()
  }
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.data?.id_notification) {
    isEdit.value = true
    data_info.value = {... props.data}
    await mtUtils.promiseAllWithLoader([
      infoDetailStore.getInfoDetailById(props.data.id_info_detail),
      ...(props.data?.id_customer
        ? [customerStore.selectCustomer(props.data.id_customer)]
        : [])
    ])
    if (props.data?.id_customer) {
      petList.value = customerStore.getCustomer.pets
      if (props.data.code_pet) {
        const foundPet = customerStore.getCustomer.pets.find(
          (pet) => pet.code_pet === data_info.value.code_pet
        )
        data_info.value.id_pet = foundPet?.value
      }
    }
    data_info_detail.value = infoDetailStore.getInfoDetail
    stripContent(data_info_detail.value.content)
    file_path1.value = data_info_detail.value.file_path1
    file_path2.value = data_info_detail.value.file_path2
    file_path3.value = data_info_detail.value.file_path3
    data_info_detail.value.file_path1_name = getFileName(file_path1.value)
    data_info_detail.value.file_path2_name = getFileName(file_path2.value)
    data_info_detail.value.file_path3_name = getFileName(file_path3.value)
    if (data_info?.value?.flg_all_customer) {
      updateFlgAllCustomer(data_info?.value?.flg_all_customer)
    } else {
      selectedCutomerId.value = data_info?.value?.id_customer
    }
    return
  } else {
    if (data_info?.value?.flg_all_customer) {
      updateFlgAllCustomer(data_info?.value?.flg_all_customer)
    } else {
      customerUpdated(data_info.value.id_customer)
    }
    data_info.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    if (route.query?.from && route.query.from === 'requestdetail') {
      data_info.value.title = '検査結果について'
      data_info.value.type_info = 3
      data_info.value.flg_all_customer = false
      data_info.value.id_customer = getCustomer.value.id_customer
    }
  }
  if (data_info?.value?.flg_all_customer) {
    updateFlgAllCustomer(data_info?.value?.flg_all_customer)
  } else {
    customerUpdated(data_info.value.id_customer)
  }
  data_info.value.type_display = 1
  if (props.predefinedFile.size > 0){
    var url = URL.createObjectURL(props.predefinedFile)
    file_path1.value = url + '#type=.pdf'
    file_name1.value = 'for-customer.pdf'
    f1_status.value = 'changed'
    var file = new File([props.predefinedFile], props.pdfFileName, { type: 'data:application/pdf' })
    data_info_detail.value.file_path1 = file
    data_info_detail.value['file_path1_name'] = file.name
  }
  if (props.predefinedMessage) {
    data_info_detail.value.content = props.predefinedMessage
    data_info.value.flg_all_customer = false
    data_info.value.id_customer = props.customerObj.id_customer
    data_info.value.code_customer = props.customerObj.code_customer
    data_info.value.name_customer = props.customerObj.name_customer_display
    petList.value = customerStore.getCustomer.pets
    if (props.customerObj.pets) {
      data_info.value.id_pet = props.customerObj.pets[0]
      data_info.value.code_pet = props.customerObj.pets[0].code_pet
      data_info.value.name_pet = props.customerObj.pets[0].name_pet
    }
  }
  if(props.fromCart || props.fromLabResult) {
    data_info.value.type_display = 3
    data_info.value.title = `【${clinicStore.getClinic.name_clinic_display}】 ${props.fromCart ? '受付からのお知らせ' : '検査結果のお知らせ'}`
    if(props.fromCart) {
      await fetchTextTemplates(130)
      getSelectedTextTemplate(textTemplatesList.value.length > 0 ? textTemplatesList.value[0].title : '')
    }
  }  
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

  //  if customer selected from DM page
  if(props.checkedCustomers.length > 0){
    dmCustomerSelected.value = props.checkedCustomers.map((i)=>{ 
      return {label: concatenate(i.customer.code_customer, i.customer.name_family, i.customer.name_first, i.customer.name_kana_family, i.customer.name_kana_first), value: i.id_customer}
    })
  }

  if(props.fromViewPetModal){
    await initForPetModal()
  }
})
onUnmounted(() => {
  // stop watching DOM changes
  observer?.disconnect()
})

const customerClinic = computed(() => {
  if (!data_info.value.id_customer) return null
  return useClinicStore().getClinics.find(
    (item) => item.id_clinic === props.customerObj.id_clinic
  )
})

const clinicLineSettings = computed(() => {
  if (!customerClinic.value) return null
  
  return customerClinic.value.type_line_push_noti !== 1
})

const enableSendLineButton = computed(() => {
  if(props.lineMessageType === 'multicast_message') {
    if(AllLineUsers.value.length === 0) {
      const customer = customerStore?.getAllCustomerPreps.find(
        (item) => item.id_customer === selectedCutomerId?.value
      )
      if (customer) {
        return !!customer.line_user_id
      }
    }
    return !!AllLineUsers.value.length
  }
  
  return !!props.customerObj.line_user_id
})

const disableShareDropdown = computed(() => {
  return props.lineMessageType === 'lab_report' || props.lineMessageType === 'billing'
})

const dateStartOptions = (date: string) => {
  return dayjs(date).isAfter(dayjs().subtract(1, 'day'))
}

const dateEndOptions = (date: string) => {
  return dayjs(date).isAfter(data_info.value.date_start)
}
</script>

<template>
  <q-form @submit.prevent="submit(false)">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        お知らせ・デジタルDM
      </q-toolbar-title>
      <div class="q-ml-auto">
        <q-btn
          icon="queue"
          label="テンプレ"
          flat
          class="cursor-pointer"
          @click.stop="openSearchTemplateModal"
        /> 
        </div>
      <q-btn
        flat
        round
        v-if="props.data" 
        @click="openMenu"
        class="q-mx-sm"
      >
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="data_info.title"
            label="タイトル *"
            required
            :rules="[aahValidations.validationRequired]"
            autofocus
            tabindex="1"
          />
        </div>
      </div>
      <div class="row q-my-md">
        <div class="col-4 q-px-sm">
          <MtFormInputDate
            v-model:date="data_info.date_start"
            tabindex="2"
            label="共有開始日"
            @update:date="updateDateEnd"
            :options="dateStartOptions"
          ></MtFormInputDate>
        </div>
        <div class="col-4 q-px-sm">
          <MtFormInputDate
            v-model:date="data_info.date_end"
            tabindex="3"
            label="共有終了日"
            :options="dateEndOptions"
          ></MtFormInputDate>
        </div>
        <div 
          class="col-3 q-px-sm" 
          :style="{alignContent: 'center'}"
          v-if="data_info.type_display === 3 && (selectedCutomerId || props.checkedCustomers.length > 0)"
        >
          <q-icon size="sm" name="mail" />
        </div>
      </div>
      <div class="row q-my-md">
        <div class="col-4 q-px-sm">
          <MtFormPullDown
              label="お知らせ区分"
              v-model:selected="data_info.type_info"
              :options="typeInfo"
              class="q-mx-sm"
              :rules="[aahValidations.validationRequired]"
            />
        </div>
        <div class="col-4 q-px-sm">
          <MtFormPullDown
              label="表示ステータス"
              :disable="disableShareDropdown"
              v-model:selected="data_info.type_display"
              :options="typeDisplay"
              class="q-mx-sm"
              :rules="[aahValidations.validationRequired]"
            />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md" v-if="props.checkedCustomers.length == 0">
        <div class="col-8">
          <MtInputForm
            v-if="!disableShareDropdown"
            type="checkbox"
            :items="[{ label: '全オーナー向け' }]"
            v-model="data_info.flg_all_customer"
            @update:modelValue="updateFlgAllCustomer"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md q-mb-md" v-if="props.checkedCustomers.length == 0">
        <div class="col-4">
          <MtFilterSelect
            label="診察券番号"
            :disable="data_info.flg_all_customer || customCustomerDisable"
            v-model:selecting="data_info.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            @update:selecting="customerUpdated"
          >
          </MtFilterSelect>
        </div>
        <div
          v-if="data_info.id_customer && !data_info.flg_all_customer"
          class="col-4"
        >
          <MtPetFilterSelect
            :disable="data_info.flg_all_customer || customPetDisable"
            v-model:selecting="data_info.id_pet"
            :pet-list="petList"
            label="対象ペット"
            @update:selecting="petUpdated"
          />
        </div>
        <div
          v-if="
            !(data_info.flg_all_customer || data_info.id_customer || isEdit)
          "
          class="col-3"
        >
          <q-btn
            class="q-mr-xs"
            color="grey-800"
            text-color="white"
            unelevated
            @click="openSearchServiceModal"
          >
            <q-icon name="search" size="20px" />
            {{
              getSelectedServiceDetailRecordList.length &&
              getSelectedServiceDetailRecordList.length > 0
                ? '対象者の確認'
                : '対象者の絞り込み'
            }}
            {{
              getSelectedServiceDetailRecordList.length &&
              getSelectedServiceDetailRecordList.length > 0
                ? `(${getSelectedServiceDetailRecordList.length})`
                : ''
            }}
          </q-btn>
        </div>
        <div
          v-if="
            !data_info.id_customer &&
            getSelectedServiceDetailRecordList &&
            getSelectedServiceDetailRecordList.length &&
            getSelectedServiceDetailRecordList.length > 0
          "
          class="col-4 flex items-center content-center"
        >
          選択者数 ({{ getSelectedServiceDetailRecordList.length }} )
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md" v-else>
        <div class="col-4">
          <MtFormMultipleSelection
              :disable="true"
              v-model="dmCustomerSelected"
              :options="customerList"
              label="診察券番号"
              option-label="label"
              option-value="value"
              outlined
              @update:model-value="customerUpdated">
            >
          </MtFormMultipleSelection>
        </div>
        <div
          v-if="
            dmCustomerSelected &&
            dmCustomerSelected.length &&
            dmCustomerSelected.length > 0
          "
          class="col-4 flex items-center content-center"
        >
        選択オーナー数 ({{ dmCustomerSelected.length }} )
        </div>
      </div>

      <div id="t_info_detail_container" class="q-py-lg">
        <q-editor
          :toolbar="[
            ['left', 'center', 'right', 'justify'],
            ['bold', 'italic', 'strike', 'underline'],
            ['undo', 'redo'],
            ['token'],
            [
              {
                label: $q.lang.editor.formatting,
                icon: $q.iconSet.editor.formatting,
                list: 'no-icons',
                options: ['p', 'h2', 'h3', 'h4', 'h5']
              }
            ]
          ]"
          ref="targetRef"
          toolbar-bg="primary"
          toolbar-text-color="white"
          toolbar-toggle-color="accent-700"
          height="40vh"
          class="editor"
          v-model="data_info_detail.content"
          @update:model-value="stripContent"
          tabindex="10"
        >
          <template v-slot:token>
            <q-color
              @click="colorClicked()"
              v-model="foreColor"
              no-header
              no-footer
              default-view="palette"
              :palette="['#000000', '#FF0000', '#0000FF', '#008000', '#505050']"
              unelevated
              class="q-mt-sm bg-primary color-picker"
            />
          </template>
        </q-editor>
        
        <div class="text-right">
          <template v-if="strippedContent.length > CHAR_LIMIT">
            <span class="text-red">DMのコンテンツが1000文字を超えています。</span>
          </template>
          
          {{ strippedContent.length }} / {{ CHAR_LIMIT }} 文字
        </div>

        <div class="row q-mt-xs gap-5">
          <div class="uploaded-file">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              添付1
            </div>
            <div
              v-if="file_path1"
              class="relative-position text-center"
            >
              <img
                v-if="!file_path1.includes('.pdf')"
                :src="file_path1"
                spinner-color="white"
                class="image-preview"
              />
              <template v-else>
                <q-icon
                  name="attach_file"
                  size="20px"
                  class="q-mr-sm"
                />
                {{ data_info_detail?.file_path1_name }}
              </template>
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
              class="image-preview q-pa-xl"
            >
              <q-icon size="60px" name="add" />
            </q-btn>
            <input
              type="file"
              style="display: none"
              ref="file1"
              accept="image/*,.pdf"
              @change="onFilePicked($event, 'file_path1')"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="uploaded-file" v-if="file_path1">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              添付2
            </div>
            <div
              v-if="file_path2"
              class="relative-position text-center"
              style="width: 100%; height: 100%"
              @click="removeImage('file_path2')"
            >
              <img
                v-if="!file_path2.includes('.pdf')"
                :src="file_path2"
                spinner-color="white"
                class="image-preview"
              />
              <template v-else>
                <q-icon
                  name="attach_file"
                  size="20px"
                  class="q-mr-sm"
                />
                {{ data_info_detail?.file_path2_name }}
              </template>
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
              class="image-preview q-pa-xl"
            >
              <q-icon size="60px" name="add" />
            </q-btn>
            <input
              type="file"
              style="display: none"
              ref="file2"
              accept="image/*,.pdf"
              @change="onFilePicked($event, 'file_path2')"
            />
          </div>
          <div class="uploaded-file" v-if="file_path2">
            <div class="text-center body1 regular text-grey-700 q-mb-sm">
              添付3
            </div>
            <div
              v-if="file_path3"
              class="relative-position text-center"
              style="width: 100%; height: 100%"
            >
              <img
                v-if="!file_path3.includes('.pdf')"
                :src="file_path3"
                spinner-color="white"
                class="image-preview"
              />
              <template v-else>
                <q-icon
                  name="attach_file"
                  size="20px"
                  class="q-mr-sm"
                />
                {{ data_info_detail?.file_path3_name }}
              </template>
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
              class="image-preview q-pa-xl"
            >
              <q-icon size="60px" name="add" />
            </q-btn>
            <input
              type="file"
              style="display: none"
              ref="file3"
              accept="image/*,.pdf"
              @change="onFilePicked($event, 'file_path3')"
            />
          </div>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          :disabled="strippedContent.length > CHAR_LIMIT"
          unelevated
          color="primary"
          tabindex="15"
          class="q-ml-md"
          type="submit"
        >
          <span>保存</span>
        </q-btn>
        <q-btn
          v-if="enableSendLineButton"
          :disabled="strippedContent.length > CHAR_LIMIT || data_info.type_display !== 3"
          unelevated
          color="primary"
          tabindex="15"
          class="q-ml-md"
          @click="submitWithLine"
        >
          <span>保存+LINE</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
  <AddTextTemplateModal
    v-model:value="addTemplateModalFlg"
    modelTitle="お知らせテンプレート"
    :options="textTemplatesList"
    :data="data"
    @update:memo="getSelectedTextTemplate"
  />
</template>

<style lang="scss" scoped>
.color-picker {
  max-width: 20px;
  box-shadow: none;
  border-radius: 0;
}
.editor {
  line-height: 1.7;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }
}
.image-preview {
  background-color: gray;
  width: 200px;
  height: 200px;
  object-fit: cover
}
</style>
