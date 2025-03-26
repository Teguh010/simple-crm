<script setup lang="ts">
/* ------------------------ Core Imports ------------------------ */
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Loading, useQuasar } from 'quasar'


/* ------------------------ Store Imports ------------------------ */
import useCustomerStore from '@/stores/customers'
import useActionStore from '@/stores/action'
import useCartStore from '@/stores/carts'
import useClinicStore from '@/stores/clinics'
import useCommonStore from '@/stores/common'
import useTelephoneStore from '@/stores/telephones'
import useMemoCustomerStore from '@/stores/memo-customer'
import useCliCommonStore from '@/stores/cli-common'
import {
  aahTruncate,
  blank,
  checkPassword,
  concatenate,
  formatDate,
  formatDateTime,
  formatDateWithTime,
  formatPhoneNumber,
  getDateToday,
  getPetImageUrl,
  handleImageError,
  isDateOutOfToday,
  passwordRule
} from '@/utils/aahUtils'

/* ---------------------- Utility Imports ------------------------ */
import mtUtils from '@/utils/mtUtils'
import aahValidations from '@/utils/aahValidations'
import aahMessages from '@/utils/aahMessages'
import { setPageTitle } from '@/utils/pageTitleHelper'
import { absoluteFormattedPrice } from '@/utils/helper'
import customerUtils from '@/pages/master/customerPet/customerUtils'
import { CustomerTelephoneType, CustomerType, MemoCustomerType } from '@/types/types'
import { statusCustomer, typeCustomer, typeCustomerGender, typeMemoCustomer, typeStatus, typeTel } from '@/utils/enum'
/* ---------------------- Component Imports ---------------------- */
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import ExtraConfirmationModal from '@/components/ExtraConfirmationModal.vue'
import useModalStore from '@/stores/modal'

/* ---------------------- Async Component Imports ---------------------- */
const UpdatePetModal = defineAsyncComponent(() => import('./UpdatePetModal.vue'))
const OptionModal = defineAsyncComponent(() => import('@/components/OptionModal.vue'))
const UpdateCustomerAddressModal = defineAsyncComponent(() => import('./UpdateCustomerAddressModal.vue'))
const UpdateCustomerTelephoneModal = defineAsyncComponent(() => import('./UpdateCustomerTelephoneModal.vue'))
const EmailModal = defineAsyncComponent(() => import('@/components/EmailModal.vue'))
const UpdateCustomerChildModal = defineAsyncComponent(() => import('./UpdateCustomerChildModal.vue'))
const GetCustomerCardSlotModal = defineAsyncComponent(() => import('./GetCustomerCardSlotModal.vue'))
const SelectPrintTemplate = defineAsyncComponent(() => import('./detail/SelectPrintTemplate.vue'))
const UpdateMemoCustomerModal = defineAsyncComponent(() => import('@/pages/master/customerPet/UpdateMemoCustomerModal.vue'))
const ViewPetDetailModal = defineAsyncComponent(() => import('./ViewPetDetailModal.vue'))
const ShowPpsLoginSupport = defineAsyncComponent(() => import('./detail/ShowPpsLoginSupport.vue'))
const PdfDownloadOptionModal = defineAsyncComponent(() => import('@/components/PdfDownloadOptionModal.vue'))

/* ---------------------- Props ---------------------- */
const props = defineProps<{
  data?: CustomerType
  fromPage?: string
  pageTitle?: string
}>()

/* ---------------------- Variable Declarations ---------------------- */
const router = useRouter()

// Store references
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const clinicStore = useClinicStore()
const telephoneStore = useTelephoneStore()
const commonStore = useCommonStore()
const cliCommonStore = useCliCommonStore()
const memoCustomerStore = useMemoCustomerStore()

// Store-to-Refs for computed and reactive data
const { getCustomer, getRawCustomerList } = storeToRefs(customerStore)
const { getAllClinics, getClinic } = storeToRefs(clinicStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)
const { getCliCommonCustomerColorList, getCliCommonDiscountRateList } = storeToRefs(cliCommonStore)
const computedCustomerData = computed(() => customerStore.getCustomer)

const $q = useQuasar()
const isIpad = computed(() => $q.platform.is.ipad)

// Form data reactive object
const formData = reactive({
  code_customer: '',
  status_customer: 1,
  name_family: '',
  name_first: '',
  name_kana_family: '',
  name_kana_first: '',
  name_customer_display: '',
  type_gender: null,
  flg_customer: true,
  flg_dm: true,
  flg_dm_digital: true,
  flg_supplier: false,
  zip_code: '',
  address_prefecture: '',
  address_city: '',
  address_other: '',
  phone_emergency: '',
  phone_title1: '',
  phone1: '',
  phone_title2: '',
  phone2: '',
  email_title1: '',
  email1: null,
  email_title2: '',
  email2: '',
  memo_customer: '',
  memo_alert: '',
  type_customer_color: null,
  flg_employee: false,
  flg_complaint: false,
  flg_second_opinion: false,
  id_employee: '',
  flg_referral: false,
  memo_referral: '',
  datetime_referral_visit: null,
  type_customer: 1,
  name_corporate: '',
  name_kana_corporate: '',
  url_supplier: '',
  name_supplier: '',
  name_kana_supplier: null,
  flg_group_account: false,
  id_customer: '',
  id_customer_master: '',
  type_group_account: null,
  pps_login_id: null,
  password: '',
  flg_login_access: false,
  id_ahmics_customer: '',
  code_customer_ex: '',
  date_register: formatDate(getDateToday()),
  date_last_visit: null,
  type_disc_rate: null,
  id_employee_doctor: '',
  id_clinic: '',
  type_status: '',
  datetime_password_update: null
})

// Reactive and ref variables
const allCustomersListDefault = reactive([])
const allClinicListDefault = reactive<any>([])
const allClinicList = ref<any>([])
const allCustomersList = ref([])
const tab = ref('basic')
const isEdit = ref(false)
const statusCustomerLabel: any = ref('')
const discountRateList = ref([])
const customerAddressList = ref([])
const selectedStatus = ref('')
const waitlistmodal = ref(false)
const telephones = ref([])
const showNewManualPassword = ref(false)
const generatedPassword = ref(false)
const manual_password = ref('')
const emailErrorMessage = ref('')
const isSubmitting = ref(false)
const passwordFeedback = ref('')
const passwordScore = ref(0)
const isValidationDisabled = ref(false);

// LocalStorage
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

// Emits
const emits = defineEmits(['close'])

const tabItems = ref([
  { name: 'basic', text: '基本' },
  { name: 'address', text: '住所' },
  { name: 'pet', text: 'ペット' },
  { name: 'memo_customer', text: 'メモ' }
])

const columns = [
  { name: 'code_pet', label: 'ペットコード', field: 'code_pet', align: 'left' },
  { name: 'name_pet', label: 'ペット名', field: 'name_pet', align: 'left' },
  { name: 'type_animal', label: '種別', field: 'type_animal', align: 'left' },
  { name: 'name_breed', label: '品種', field: 'id_cm_breed', align: 'left' },
  { name: 'memo_pet', label: '注意事項', field: 'memo_pet', align: 'left' },
  {
    name: 'date_last_visit',
    label: '最終来院日',
    field: 'date_last_visit',
    align: 'left'
  }
]

const columnMemoCustomer = [
  {
    name: 'date_memo_customer',
    label: '記録日',
    field: 'date_memo_customer',
    align: 'left'
  },
  {
    name: 'type_memo_customer',
    label: 'メモ',
    field: 'type_memo_customer',
    align: 'left'
  },
  {
    name: 'memo_text',
    label: '内容',
    field: 'memo_text',
    align: 'left',
    style: 'width : 60% '
  },
  {
    name: 'date_complete',
    label: '完了日',
    field: 'date_complete',
    align: 'left'
  }
]

const columnGroups = [
  { name: 'name', label: '氏名', field: 'name', align: 'left' },
  { name: 'address', label: '住所', field: 'address', align: 'left' },
  { name: 'phone', label: '電話番号', field: 'phone', align: 'left' },
  {
    name: 'contact_request',
    label: '連絡希望',
    field: 'contact_request',
    align: 'center'
  },
  {
    name: 'introduction',
    label: '紹介',
    field: 'introduction',
    align: 'center'
  },
  { name: 'unpaid', label: '未払い', field: 'unpaid', align: 'center' }
]

const columnAddress = [
  {
    name: 'flg_main_address',
    label: '',
    field: 'is_default',
    align: 'left',
    style: 'width: 5px'
  },
  {
    name: 'title_address',
    label: 'タイトル',
    field: 'title_address',
    align: 'left'
  },
  { name: 'zip_code', label: '郵便番号', field: 'zip_code', align: 'left' },
  {
    name: 'address_prefecture',
    label: '都道府県',
    field: 'address_prefecture',
    align: 'left'
  },
  {
    name: 'address_city',
    label: '市区町村',
    field: 'address_city',
    align: 'left'
  },
  {
    name: 'address_other',
    label: '住所',
    field: 'address_other',
    align: 'left'
  },
  { name: 'phone', label: '電話番号', field: 'phone1', align: 'left' },
  { name: 'memo', label: '住所メモ', field: 'memo_address', align: 'left' }
]

// Reference for storing telephone list
const telephoneList = ref([])

// Computed property to handle both modes
const allTelephones = computed(() => {
  if (isEdit.value) {
    // Preserve existing data
    if (!getCustomer.value && telephoneStore.getTelephonesLocalData.length > 0) {
      return telephoneStore.getTelephonesLocalData;
    } else {
      const filteredTels = getCustomer.value.customer_tel?.filter(tel => !tel.flg_delete && tel.tel_full);
      if (filteredTels?.length > 0) {
        telephoneStore.setTelephonesLocalData(filteredTels);
      }
      return filteredTels;
    }
  }

  if (telephoneStore.getTelephonesLocalData.length > 0) {
    return telephoneStore.getTelephonesLocalData;
  } else {
    if (!getCustomer.value) return telephoneStore.getTelephonesLocalData; // Preserve existing data

    const filteredTels = getCustomer.value.customer_tel?.filter(tel => !tel.flg_delete && tel.tel_full);
    return filteredTels;
  }
})

const handleAddTelCallback = (telephoneData) => {
  telephoneStore.telephonesLocalData.push(telephoneData)
  if (telephoneData.flg_main_tel && !props.data?.pps_login_id && !formData.pps_login_id) {
    formData.pps_login_id = telephoneData.tel_full
  }
}
const handleUpdateTelCallback = (telephoneData) => {
  if (telephoneData.flg_main_tel && (!props.data?.pps_login_id && !formData.pps_login_id)) {
    formData.pps_login_id = telephoneData.tel_full
  }
}
const handleDeleteTelCallback = (telephoneData) => {
  if (telephoneData.flg_main_tel && (!props.data?.pps_login_id && !formData.pps_login_id)) {
    formData.pps_login_id = null
  }
}
const syncPpsLoginId = () => {
  // Sync pps_login_id after update
  const mainTel = getCustomer.value?.customer_tel?.find(tel => tel.flg_main_tel)
  if (mainTel && !props.data?.pps_login_id && !formData.pps_login_id) {
    formData.pps_login_id = mainTel.tel_full
  }
}
const addTel = async () => {
  const idCustomer = props.data?.id_customer ?? formData.id_customer
  await mtUtils.smallPopup(UpdateCustomerTelephoneModal, {
    id_customer: idCustomer,
    telephoneList: allTelephones.value,
    callBack: isEdit.value ? undefined : handleAddTelCallback
  })

  if (isEdit.value) {
    // Refresh data after adding new telephone
    const idCustomer = props.data?.id_customer ?? formData.id_customer
    await customerStore.selectCustomer(idCustomer, true)
    syncPpsLoginId()
  }
}
const updateTel = async (data: CustomerTelephoneType, telephoneLocalIndex: number) => {
  telephoneStore.setTelephonesLocalData(allTelephones.value)
  telephoneStore.setTelephonesLocalDataIndex(telephoneLocalIndex)

  await mtUtils.smallPopup(UpdateCustomerTelephoneModal, {
    data: data,
    id_customer: props.data?.id_customer ?? formData.id_customer,
    telephoneList: allTelephones.value,
    callBack: handleUpdateTelCallback,
    deleteCallback: handleDeleteTelCallback
  })
}


const init = async () => {
  if (formData.type_customer === 1) {
    blankField([
      'name_corporate',
      'name_kana_corporate',
      'url_supplier',
      'name_supplier',
      'name_kana_supplier'
    ])
  }

  if (formData.status_customer) {
    statusCustomerLabel.value = statusCustomer.find(
      (i) => i.value == formData.status_customer
    )?.label
  }

  discountRateList.value = getCliCommonDiscountRateList.value
    .filter((cli) => {
      return cli.code_cli_common === '7'
    })
    .map((obj) => ({
      label: obj.name_cli_common,
      value: obj.code_func1
    }))
  if (computedCustomerData.value?.address)
    customerAddressList.value = computedCustomerData.value?.address
  else {
    await customerStore.selectCustomer(props.data?.id_customer, true, {
      include_upfront_balance: 1
    })
    customerAddressList.value = computedCustomerData.value?.address
  }
  if (computedCustomerData.value?.customer_tel) {
    const activeTelephone = computedCustomerData.value.customer_tel.filter(tel => !tel.flg_delete && tel.tel_full)
    telephoneStore.setTelephonesLocalData(activeTelephone)
  }
}

const filteredCustomerColorList = computed(() => {
  return getCliCommonCustomerColorList.value.filter(
    (item) => !isDateOutOfToday(item.date_start, item.date_end)
  )
})

const code_available = ref(false)

const blankField = (row: any) => {
  assignPageData(blank(formData, row))
}

const toggleAvailable = ref<boolean>(false)

const changeTypeCustomerColor = (val: any) => {
  formData.type_customer_color = val
}

const onRowAddressClick = async (data: any) => {
  const response: any = await mtUtils.mediumPopup(UpdateCustomerAddressModal, {
    data
  })

  // Refresh the data
  if (response && response.data) {
    for (let key in response.data) {
      data[key] = response.data[key]
    }
  }
}

const onCustomerAddClick = async () => {
  await mtUtils.popup(UpdateCustomerChildModal)
}

const submit = async () => {
  // Prevent double submission
  if (isSubmitting.value) {
    return
  }

  // Reset error message and set loading state
  emailErrorMessage.value = ''
  isSubmitting.value = true

  try {
    const id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    formData.telephone_list = allTelephones.value?.map((tel) => ({
      type_tel: tel.type_tel,
      title_tel: tel.title_tel,
      tel_full: tel.tel_full,
      flg_main_tel: tel.flg_main_tel || false,
      flg_emergency: tel.flg_emergency || false,
      id_clinic: id_clinic
    }))
    if (isEdit.value) {
      // Edit mode
      const requestData = { ...formData }
      delete requestData.address
      delete requestData.pets
      delete requestData.last_login

      if (!requestData.password || requestData.password.includes('pbkdf2_sha256')) {
        delete requestData.password
      }

      if (requestData.pps_login_id && requestData.pps_login_id == '') {
        delete requestData.pps_login_id
      }

      requestData.datetime_referral_visit = formatDateTime(requestData.datetime_referral_visit)
      
      delete requestData.datetime_pps_initial_login
      delete requestData.datetime_email_verified
      delete requestData.datetime_pps_initial_password_update
      delete requestData.datetime_last_login_updated
      delete requestData.datetime_password_update

      // Waitlist handling
      if (window.location.href.split('/')[3] === 'SearchCustomerList?=waitlist') {
        await handleWaitlistUpdate(requestData)
      } else {
        await handleNormalUpdate(requestData)
      }
    } else {
      // Create mode
      await handleCreate()
    }
  } catch (error) {
    console.error('Submit error:', error)
    // Handle any errors here
  } finally {
    // Reset loading state
    isSubmitting.value = false
  }
}

// Helper functions to break down the logic
const handleWaitlistUpdate = async (requestData) => {
  const res = await customerStore.UpdateCustomerStatus(
    props?.data?.id_customer,
    selectedStatus?.value
  )
  
  await messageStore.sendNotificationMessage(
    requestData?.line_user_id,
    `病院側の確認が完了し、My Vettyへのログインが可能になりました！
    こちらよりMy Vettyにログインしてください！${import.meta.env.VITE_VUE_APP_REDIRECT_URI}dashboard`
  )
  
  requestData.status_customer = res.data?.data?.status_customer
  
  if (res.data?.data) {
    await customerStore.updateCustomer(requestData.id_customer, requestData)
    await customerStore.selectCustomer(requestData.id_customer, true, {
      include_upfront_balance: 1
    })
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
  }
  
  await emits('close')
  setTimeout(() => {
    window.location.reload()
  }, 2000)
}

const handleNormalUpdate = async (requestData) => {
  try {
    await customerStore.updateCustomer(requestData.id_customer, requestData)
    await customerStore.selectCustomer(requestData.id_customer, true, {
      include_upfront_balance: 1
    })
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
  } catch (err) {
    handleUpdateError(err)
  }
}

const handleCreate = async () => {
  formData.type_customer = formData.type_customer ? formData.type_customer : 1
  formData.flg_login_access = formData.flg_login_access ? 1 : 0
  formData.flg_main_address = true
  formData.flg_func1 = true
  formData.flg_func2 = false

  delete formData.id_customer

  if (formData.pps_login_id === '') {
    delete formData.pps_login_id
  }

  try {
    const res = await customerStore.submitCustomer(formData)
    await customerStore.fetchPreparationCustomers()
    formData.id_customer = res?.data?.data?.id_customer
    isEdit.value = true
    mtUtils.autoCloseAlert(aahMessages.success)
  } catch (err) {
    handleCreateError(err)
  }
}

const handleUpdateError = async (err) => {
  let error_message = 'エラー \n'
  if (err?.response?.data?.data) {
    if ('pps_login_id' in err.response.data.data) {
      error_message = '利用できないログインIDです。\n myVettyログインIDが重複しています。'
      await mtUtils.autoCloseAlert(error_message)
    }
    if ('email1' in err.response.data.data) {
      emailErrorMessage.value = 'このメールアドレスは登録済です！'
    }
  }
}

const handleCreateError = async (err) => {
  let error_message = 'エラー \n'
  if (err?.response?.data?.data?.detail?.includes('pps_login_id')) {
    error_message = '利用できないログインIDです。\n myVettyログインIDが重複しています。'
  }
  await mtUtils.autoCloseAlert(error_message)
}

const modalStore = useModalStore()

const openMenu = async () => {
  let menuOptions = [
    {
      title: 'URLをコピーする',
      name: 'copy_url',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: '印刷',
      name: 'certificate_issuance',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
    {
      title: 'ログインサポート',
      name: 'copy_pps_login_url',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    },
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
      modalStore.open({
        component: ExtraConfirmationModal,
        data: {
          submitFn: async () => {
            modalStore.toggleLoading(true)
            customerStore.destroyCustomer(props.data?.id_customer).then(() => {
              modalStore.close()
              customerStore.fetchCustomerPets()
              customerStore.fetchPreparationCustomers()
              actionStore.setAction('updateCustomer')
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
              .finally(() => {
                modalStore.toggleLoading(false)
              })
          },
        }
      })
    } else if (selectedOption.name == 'copy_url') {
      navigator.clipboard
        .writeText(
          `${window.location.origin}/SearchCustomerList?id=${formData.id_customer}`
        )
        .then(async () => {
          mtUtils.autoCloseAlert('URLをコピーしました。')
        })
    } else if (selectedOption.name == 'certificate_issuance') {
      mtUtils.smallPopup(SelectPrintTemplate, { customerData: formData })
    } else if (selectedOption.name == 'copy_pps_login_url') {
      const clinic = clinicStore.getClinics.filter(
        (i) => i.id_clinic === formData.id_clinic
      )[0]
      const code_clinic = clinic.code_clinic
      const pps_login_id = formData.pps_login_id
      const data_url = `https://my.vetty.clinic/auth/login?c=${code_clinic}&l=${pps_login_id}`
      mtUtils.smallPopup(ShowPpsLoginSupport, { data_url: data_url })
    }
  }
}

function generateRandomString(length) {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const updateCustomerPassword = async () => {
  Loading.show({
    backgroundColor: 'transparent',
    spinnerColor: 'black',
    message: '読み込み中です...',
    messageColor: 'black'
  })
  const customerdata_ = { ...formData, password: manual_password.value }
  delete customerdata_.address
  delete customerdata_.pets
  delete customerdata_.last_login
  if (customerdata_.pps_login_id && customerdata_.pps_login_id == '')
    delete customerdata_.pps_login_id
  const resp = await customerStore.updateCustomer(
    customerdata_.id_customer,
    customerdata_
  )
  Loading.hide()
}

const openEmailModal = async () => {
  const customer = customerStore.rawCustomerList.find(
    (item) => item.id_customer === props.data.id_customer
  )
  const userHasThePassw = Boolean(customer.password)
  let autoGeneratePassword = false
  if (userHasThePassw == false) {
    const confirmation = await mtUtils.confirm(
      'パスワードがありません。自動生成または手動入力で続行しますか?',
      '確認',
      '自動生成',
      '手動タイプ'
    )
    if (confirmation == 'send') {
      autoGeneratePassword = true
    } else if (confirmation == 'edit') {
      autoGeneratePassword = false
    } else {
      return
    }
  }
  if (!userHasThePassw) {
    if (autoGeneratePassword) {
      manual_password.value = generateRandomString(6)
      generatedPassword.value = true
      submit_manual_password()
      return
    } else {
      generatedPassword.value = true
      showNewManualPassword.value = true
    }
  } else {
    generatedPassword.value = false
    await submit_manual_password()
  }
}

const submit_manual_password = async () => {
  showNewManualPassword.value = false
  if (generatedPassword.value) {
    await updateCustomerPassword()
  }
  const clinic = clinicStore.getAllClinics.find(
    (i) => i.value === formData.id_clinic
  )
  let ppsLoginUrl = `https://my.vetty.clinic/auth/login?c=${clinic.value}&l=${formData.pps_login_id}`
  if (manual_password.value) {
    ppsLoginUrl += `&p=${manual_password.value}`
  }
  const emailToSend = formData.email1 ? formData.email1 : formData.email2
  const subject = `【${clinic?.label}】 myVetty（マイベッティ）アプリのご案内 `
  const body = `${formData.name_family} ${formData.name_first} 様

myVettyのログイン情報をお送りします。
初回ログイン後にはパスワードの変更をお願いします。

Login ID: ${formData.pps_login_id}
Login PW: ${manual_password.value}
Login Url: ${ppsLoginUrl}
`
  await mtUtils.smallPopup(EmailModal, {
    emailToSend: emailToSend,
    subject: subject,
    body: body
  })
  await customerStore.selectCustomer(formData.id_customer, false, {
    include_upfront_balance: 1,
  })
}

const typeAnimalName = (value) =>
  getCommonTypeAnimalOptionList.value.find((v) => v.value === value)

async function checkCustomerCode() {
  await customerUtils.checkCustomerCode(formData, code_available)
}

async function getNextCustomerCode() {
  await customerUtils.getNextCustomerCode(formData, code_available)
}

const openAddPetModal = async () => {
  customerStore.selectPet()
  const idEmployeeDoctor = formData.id_employee_doctor
  const idEmployee = formData.id_employee
  const typeDiscRate = formData?.type_disc_rate
  const customerDmChecked = formData.flg_dm || formData.flg_dm_digital
  await mtUtils.popup(UpdatePetModal, { idEmployeeDoctor, typeDiscRate, idEmployee, customerDmChecked })
  await customerStore.selectCustomer(formData.id_customer, true, {
    include_upfront_balance: 1,
  })
}

const openPetDetail = async (row: any) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: row.id_customer,
    id_pet: row.id_pet
  })
  await customerStore.selectCustomer(row.id_customer, true, {
    include_upfront_balance: 1,
  })
}
const telephoneTypeName = (value: string) =>
  typeTel.find((v) => v.value === value)
const openAddCustomerAddressModal = async () => {
  customerStore.selectAddress(null)
  await mtUtils.mediumPopup(UpdateCustomerAddressModal, {})
  await addressStore.fetchAddresses(formData.id_customer)
  await customerStore.selectCustomer(formData.id_customer, true, {
    include_upfront_balance: 1,
  })
}

const closeModal = () => {
  telephoneStore.setTelephonesLocalData([])
  emits('close')
  if (props.fromPage) {
    setPageTitle(props.fromPage)
  }
}

const assignPageData = (data: any) => {
  if (data) {
    for (let key in data) {
      formData[key] = data[key]
    }
  }
}

const scrollToSection = (val: string) => {
  let element = document.getElementById(val)
  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}

const copyPhoneNumber = (phoneNumber: string) => {
  navigator.clipboard.writeText(phoneNumber).then(async () => {
    mtUtils.autoCloseAlert('電話番号をコピーしました。')
  })
}

function base64ToBlob(base64, type = 'application/pdf') {
  const base64String = base64.split(',')[1] || base64
  const byteCharacters = atob(base64String)
  const byteNumbers = new Uint8Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  return new Blob([byteNumbers], { type })
}

const printCustomerFirstLoginPdf = async () => {
  const customerData = props.data || customerStore.customer
  
  const customerId = customerData?.id_customer || formData.id_customer

  if (!customerId) {
    return mtUtils.autoCloseAlert('Customer data not found')
  }

  try {

    await customerStore.selectCustomer(customerId, true)
    const customer = customerStore.getCustomer

  if (!customer) {
    return mtUtils.autoCloseAlert('Customer not found');
  }

  if (customer.pps_login_id === null && !customer.phone_main) {
    return mtUtils.alert('メインの電話番号が未登録です。\n' +
      'myVettyではログインIDとしてオーナー様の電話番号を使用します。電話番号を登録した後、再度お試しください。')
  }

  let generatePassword = false;
  if (customer) {
    const confirmation = await mtUtils.confirm(
      'このPDF用に新しいmyVettyのログインパスワードを作成しますか？',
      '確認する',
      '作成せず出力',
      '作成して出力'
    );
    if (confirmation === 'edit') {
      generatePassword = true;
    } else if (confirmation !== 'send') {
      return;
    }
  }

  const res = await customerStore.fetchCustomerFirstLoginPdf(
    customerId,
    { generate_password: generatePassword }
  );

  if (!res?.pdf) {
    return mtUtils.autoCloseAlert('PDF data not received');
  }

  const blob = base64ToBlob(res.pdf, 'application/pdf');
  const pdfUrl = URL.createObjectURL(blob);
  
  if(isIpad.value) {
    const downloadOption: 'download' | 'print' | undefined = await mtUtils.smallPopup(PdfDownloadOptionModal)
    if(!downloadOption) {
      return
    }

    if(downloadOption == 'download') {
      const a = document.createElement('a')
      a.setAttribute('download-login-first-pdf', '')
      a.href = pdfUrl
      a.download = `Customer-first-login`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        const link = document.querySelector('[download-login-first-pdf]')
        if (link) {
          document.body.removeChild(link)
        }
        URL.revokeObjectURL(pdfUrl)
      }, 500)
      return
    }
  }

  const existingDomElement = document.querySelector('iframe[login-first-pdf]')
  if(existingDomElement) existingDomElement.remove()

  const iframe = document.createElement('iframe')
  iframe.setAttribute('login-first-pdf', 'true')
  iframe.style.visibility = 'hidden'
  iframe.src = pdfUrl
  
  iframe.onload = () => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
      // For iOS devices, open in new tab
      const newWindow = window.open(pdfUrl, '_blank');
      if (!newWindow) {
        return mtUtils.autoCloseAlert('Please allow pop-ups for this site');
      }
    } else {
      // For desktop, use iframe approach
      const iframe = document.createElement('iframe');
      iframe.style.visibility = 'hidden';
      iframe.src = pdfUrl;
      
      iframe.onload = () => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Clean up resources
        setTimeout(() => {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(pdfUrl);
        }, 30000);
      };

      document.body.appendChild(iframe);
    }
  } catch (error) {
    console.error('Error in printCustomerFirstLoginPdf:', error);
    return mtUtils.autoCloseAlert('Error generating PDF');
  }
}

const printCustomerCard = async () => {
  let customer_card_file_path = getCustomer.value?.customer_card_file_path
  if (!customer_card_file_path) {
    const customer_card_file_path_r = await customerStore.fetchCustomerCardRawHtml(getCustomer.value.id_customer)
    customer_card_file_path = customer_card_file_path_r.content
  } 
  const clinic = clinicStore.getClinics.find(
    (i) => i.id_clinic === formData.id_clinic
  )
  await mtUtils.littlePopup(GetCustomerCardSlotModal, {
    qrImage: customer_card_file_path,
    code_customer: customerStore.getCustomer.code_customer,
    name_customer_display: customerStore.getCustomer.name_customer_display,
    name_family: customerStore.getCustomer.name_family,
    name_first: customerStore.getCustomer.name_first,
    clinic_data: clinic,
    customer_data: customerStore.getCustomer
  })
}

const selectDefaultEmployee = (key: string) => {
  formData[key] = defaultEmployee
}

const toTodaysDate = () => {
  formData.date_last_visit = getDateToday()
}

const callCheckPassword = (value: string) => {
  const result = checkPassword(value)
  passwordScore.value = result.score
  passwordFeedback.value = result.feedback
}

const openMemoCustomerModal = async (
  data: MemoCustomerType | {} = {},
  flgDuplicate: boolean = false
) => {
  await mtUtils
    .smallPopup(UpdateMemoCustomerModal, {
      id_customer: formData.id_customer,
      data,
      flgDuplicate
    })
    .then(async () => {
      if (localStorage.getItem('pageAction') == 'duplicateCustomerMemo') {
        let duplicateMemoData = JSON.parse(
          localStorage.getItem('pageActionParam')
        )
        if (
          duplicateMemoData &&
          Object.keys(duplicateMemoData).length &&
          Object.keys(duplicateMemoData).length > 0
        ) {
          localStorage.removeItem('pageAction')
          localStorage.removeItem('pageActionParam')
          await openMemoCustomerModal(duplicateMemoData, true)
        }
      }
    })
}

const fetchMemoCustomers = async (idCustomer: number) => {
  await memoCustomerStore.fetchMemoCustomers({ id_customer: idCustomer })
}

const getTypeMemoCustomerLabel = (type: number) => {
  return typeMemoCustomer.find((el) => el.value === type)?.label
}

const loading = ref(false)

onMounted(async () => {
  loading.value = true
  let codeCommonList = []
  if (commonStore.commonTypeCustomerColorList.length === 0) {
    codeCommonList.push(25)
  }
  codeCommonList.push(30)
  codeCommonList.push(1)
  codeCommonList.push(2)

  await mtUtils.promiseAllWithLoader([
    commonStore.fetchPreparationCommonList({ code_common: codeCommonList }),
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [3, 7] }),
    !props?.data?.id_customer ? getNextCustomerCode() : Promise.resolve(),
    props?.data?.id_customer ? customerStore.selectCustomer(props?.data.id_customer, true, {
      include_upfront_balance: 1,
    }) : Promise.resolve(),
    props.data?.id_customer ? fetchMemoCustomers(props?.data?.id_customer) : Promise.resolve()
  ])

  allCustomersList.value = [...customerStore.getAllCustomers]
  allCustomersListDefault.push(...customerStore.getAllCustomers)
  // allEmployeesList.value = [...employeeStore.getAllEmployees]
  // allEmployeesListDefault.push(...employeeStore.getAllEmployees)
  if (props.data?.id_customer || getCustomer.value?.length > 0) {
    // Update case
    isEdit.value = true
    code_available.value = true
    assignPageData(JSON.parse(JSON.stringify(props.data)))
    if (formData.type_customer === null) {
      formData.type_customer = 1
    }
    if (props.data?.flg_unpaid) {
      await useCartStore().fetchLatestCartBalanceOfCustomer(props.data.id_customer)
    }
  } else {
    // Create case
    isEdit.value = false
  }

  if (getAllClinics.value) {
    let allClinics = [] as any
    const noFacilityArr = clinicStore.getClinics.filter(
      (cli) => cli?.flg_facility === false
    )
    allClinics = getAllClinics.value.filter((clint) =>
      noFacilityArr.find((cli) => cli?.id_clinic == clint?.value)
    )
    allClinicList.value = [...allClinics]
    allClinicListDefault.push(...allClinics)
  }
  init()

  formData.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  if (window.location.href.split('/')[3] === 'SearchCustomerList?=waitlist') {
    waitlistmodal.value = true
  } else {
    waitlistmodal.value = false
  }
  if (props.pageTitle) {
    setPageTitle(props.pageTitle)
  }

  if (isEdit.value) {
    await customerStore.selectCustomer(props.data?.id_customer, true)
    formData.type_gender = computedCustomerData.value?.type_gender
    // Sync initial pps_login_id
    const mainTel = getCustomer.value?.customer_tel?.find(tel => tel.flg_main_tel)
    if (mainTel && !props.data?.pps_login_id) {
      formData.pps_login_id = mainTel.tel_full
    }
  }
  loading.value = false
})

const getBreedName = (val: any) => {
  return commonStore.getCommonBreedOptionList.find(
    (breedObj: any) => breedObj.id_common == val
  )?.name_common
}

const formatClinicURL = (value: string) => {
  // value as the target URL
  // Define the regex pattern
  const pattern = /\/html\/([\d\/]+)\//

  // Get the part that matches the pattern
  const match = value.match(pattern)

  if (match && match[1]) {
    // Store the numeric sequence in a variable
    const numberString = match[1].split('/').join('_')
    return numberString
  } else {
    return null
  }
}

const openHtmlSite = () => {
  if (!formData.id_customer) return false

  const formattedCodeCustomer = String(formData.code_customer).padStart(6, '0')

  const clinicData = JSON.parse(localStorage.getItem('clinic'))

  if (
    clinicData &&
    Object.keys(clinicData).length > 0 &&
    Boolean(clinicData?.clinic?.url_vr_html)
  ) {
    let clinicPath = clinicData.clinic.url_vr_html
    const clinicPathWithoutPrefix = formatClinicURL(clinicPath)
    const ownerPrefix = 'オーナー情報'
    const location = `${clinicPath}${formattedCodeCustomer}/${clinicPathWithoutPrefix}_${formattedCodeCustomer}_${ownerPrefix}.html`

    window.open(location, '_blank')
  }
}

const checkCustomerStaus = (val: any) => {
  if (val === 1) {
    selectedStatus.value = 12
  } else {
    selectedStatus.value = 100
  }
  // customerStore.deleteCustomer(props?.data?.id_customer)
  // customerStore.deleteCustomer('cus_20240409220956P36290D01')
  // customerStore.UpdateCustomerStatus('cus_20240404191739P67100D01', 100)
}
const updateCustomerNameDisplay = () => {
  formData.name_customer_display = concatenate(
    formData.name_family,
    formData.name_first
  )
}

const openCustomerCartsView = () => {
  const route = router.resolve({ name: 'SearchCartList', query: { source: 'customer_detail',  id_customer: formData.id_customer} })?.href
  return window.open(route, '_blank')
}

const handleSetDefaultPassword = async () => {
  const clinicData = await clinicStore.fetchClinicById(formData.id_clinic);
  if (clinicData?.pps_default_password) {
    isValidationDisabled.value = true;

    formData.password = clinicData.pps_default_password;
    callCheckPassword(clinicData.pps_default_password);

    setTimeout(() => {
      isValidationDisabled.value = false;
    }, 100); 
  } else {
    await mtUtils.autoCloseAlert('デフォルトパスワードが未設定です');
  }
};

const showTooltipStep1 = ref(false)
const showTooltipStep2 = ref(false)
const showTooltipStep3 = ref(false)
const showTooltipStep4 = ref(false)
const showTooltipStep5 = ref(false)
const userLoginStep = computed(() => {
  const {
    datetime_pps_initial_login,
    datetime_pps_initial_password_update,
    flg_email_verified,
    line_user_id,
    flg_user_follow_official_line
  } = computedCustomerData.value || {};

  // Need flg condition for follow/unfollow LINE API, if the flg added. Please uncomment line below
  if (datetime_pps_initial_login && datetime_pps_initial_password_update && flg_email_verified && line_user_id && flg_user_follow_official_line) return 6
  if (datetime_pps_initial_login && datetime_pps_initial_password_update && flg_email_verified && line_user_id) return 5;
  if (datetime_pps_initial_login && datetime_pps_initial_password_update && flg_email_verified) return 4;
  if (datetime_pps_initial_login && datetime_pps_initial_password_update) return 3;
  if (datetime_pps_initial_login) return 2;
  return 1;
})
const getStepIconState = (value: number) => {
  const isCurrentStep = userLoginStep.value === value;

  const {
    datetime_pps_initial_login,
    datetime_pps_initial_password_update,
    flg_email_verified,
    line_user_id,
    flg_user_follow_official_line
  } = computedCustomerData.value || {};
  const conditions: Record<number, boolean> = {
    1: datetime_pps_initial_login,
    2: datetime_pps_initial_password_update,
    3: flg_email_verified,
    4: line_user_id !== null && line_user_id !== '' && line_user_id !== undefined,
    5: flg_user_follow_official_line
  };

  if (isCurrentStep) {
    return { name: 'radio_button_unchecked', color: 'green-5' };
  }

  return conditions[value]
    ? { name: 'check_circle', color: 'green-5' }
    : { name: 'circle', color: 'grey-5' };
}
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        <span
          v-if="formData.flg_customer"
          class="field-label-free-color body2 regular bg-grey-700 text-grey-050"
        >
          オーナー
        </span>
        <span
          v-if="formData.flg_supplier"
          class="field-label-free-color body2 regular bg-blue-700 text-grey-050"
        >
          取引先
        </span>
        {{ formData.name_customer_display + ' 様' }}
        <q-tabs
          v-model="tab"
          class="tab-style2 q-ml-md"
          @update:model-value="scrollToSection"
        >
          <template v-for="item in tabItems" :key="item.name">
            <q-tab
              class="tabsBox body2 regular q-mr-md"
              :name="item.name"
              :label="item.text"
            />
          </template>
        </q-tabs>
      </q-toolbar-title>
      <div v-if="isEdit" class="flex items-center">
        <q-btn
          flat
          color="grey-333"
          class="bg-yellow"
          v-if="props.data?.flg_unpaid"
        >
          <span>未払い有</span>
        </q-btn>
        <q-btn
          flat
          color="grey-333"
          class="q-ml-sm bg-orange"
          v-if="props.data?.flg_complaint"
        >
          <span>CL</span>
        </q-btn>
        <q-btn
          flat
          color="grey-333"
          class="q-ml-sm bg-red"
          v-if="props.data?.flg_second_opinion"
        >
          <span>セカンドオピニオン</span>
        </q-btn>
        <div
          v-if="props.data?.datetime_last_visit"
          class="flex justify-end q-mx-md"
        >
          <span>最終来院：</span>
          <span>{{ formatDate(props.data.datetime_last_visit) }}</span>
        </div>
      </div>
      <q-btn
        v-if="isEdit"
        flat
        class="bg-grey-200 q-mx-sm"
        @click="printCustomerFirstLoginPdf"
      >
        <q-icon name="print" class="text-grey-600 q-pr-sm" />
        初回案内
      </q-btn>
      <q-btn
        v-if="isEdit"
        flat
        class="bg-grey-200 q-mr-sm"
        @click="printCustomerCard"
      >
        <q-icon name="print" class="text-grey-600 q-mr-sm" />
        診察券
      </q-btn>
      <q-btn
        v-if="getClinic && getClinic?.url_vr_html?.substr(0, 5) === 'https'"
        class="text-grey-800"
        icon="stars"
        round
        size="12px"
        unelevated
        @click="openHtmlSite"
      />
      <q-btn
        @click="openCustomerCartsView"
        icon="shopping_cart"
        size="24"
        flat
        round
        class="hide-tablet"
        v-if="isEdit"
      />
      <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl customer-modal">
      <template v-if="!loading">
        <div v-if="waitlistmodal" class="col-12">
          <div class="row item-center">
            <p class="q-mr-md">ステータス: <span>未承認</span></p>
            <div class="col-auto m-mr-lg">
              <MtInputForm
                type="radio"
                v-model="formData.type_status"
                :items="typeStatus"
                @Update:model-value="checkCustomerStaus"
              />
            </div>
          </div>
        </div>
        <div id="basic">
          <div class="row q-col-gutter-md items-center q-mb-md">
            <div class="col-3">
              <MtFilterSelect
                v-model:options="allClinicList"
                v-model:selecting="formData.id_clinic"
                :options-default="allClinicListDefault"
                :rules="[aahValidations.validationRequired]"
                label="病院名"
                required
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="formData.code_customer"
                :disable="isEdit"
                :rules="[aahValidations.validationRequired,
                aahValidations.validationNumberWithDecimal]"
                label="診察券番号 *"
                required
                type="text"
              />
            </div>
            <div v-if="!isEdit" class="col-3">
              <q-btn
                :disable="
                  formData &&
                  formData.code_customer &&
                  formData.code_customer == ''
                "
                label="空き番号確認"
                @click="checkCustomerCode"
              />
            </div>
            <div v-if="isEdit" class="col-auto">
              <q-badge
                class="justify-center bg-grey-100 text-grey-600 status q-px-xl q-py-sm"
                label="来院頻度"
                rounded
              />
            </div>
            <div v-if="isEdit && props.data?.flg_unpaid">
              <q-btn
                flat
                color="grey-333"
                class="bg-yellow"
              >
                <span>未払い有 : ¥ {{ absoluteFormattedPrice(useCartStore().getCustomerCartBalance?? 0) }}</span>
              </q-btn>
            </div>
            <div v-if="isEdit && getCustomer?.upfront_balance">
              <q-btn
                flat
                color="white"
                class="bg-green"
              >
                <span>前受金 : ¥ {{ absoluteFormattedPrice(getCustomer?.upfront_balance) }}</span>
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtInputForm
                v-model="formData.name_family"
                :rules="[aahValidations.validationRequired]"
                label="姓 *"
                required
                type="text"
                @blur="($event) => updateCustomerNameDisplay()"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="formData.name_first"
                label="名"
                type="text"
                @blur="($event) => updateCustomerNameDisplay()"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="formData.name_kana_family"
                :isKatakana="false"
                label="姓カナ"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="formData.name_kana_first"
                :isKatakana="false"
                label="名カナ"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtInputForm
                v-model="formData.name_customer_display"
                :rules="[aahValidations.validationRequired]"
                label="オーナー表示名 *"
                required
                type="text"
              />
            </div>
            <div class="col-auto m-mr-lg">
              <MtInputForm
                v-model="formData.type_gender"
                :items="typeCustomerGender"
                type="radio"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-md">
            <div class="col-2 m-mr-lg">
              <MtInputForm
                v-model="formData.flg_customer"
                :items="[{ label: 'オーナー' }]"
                type="checkbox"
              />
            </div>
            <div class="col-2">
              <MtInputForm
                v-model="formData.flg_employee"
                :items="[{ label: '従業員' }]"
                type="checkbox"
                @click="blankField(['id_employee'])"
              />
            </div>
            <div class="col-3">
              <InputEmployeeOptGroup
                v-show="formData.flg_employee"
                v-model:selected="formData.id_employee"
                label="従業員"
                show-select-default-employee
                @update:select-default-employee="
                  selectDefaultEmployee('id_employee')
                "
              />
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-4">
              <template v-for="(type, i) in typeCustomer" :key="i">
                <MtFormRadiobtn
                  v-model:selected="formData.type_customer"
                  :label="type.label"
                  :val="type.value"
                  class="q-mr-lg"
                  size="28px"
                  type="radio"
                  @update:selected="(event) => init()"
                />
              </template>
            </div>
            <div class="col-3">
              <MtInputForm
                v-if="formData.type_customer == '2'"
                v-model="formData.name_corporate"
                label="事業所名"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-if="formData.type_customer == '2'"
                v-model="formData.name_kana_corporate"
                :isKatakana="false"
                label="事業所カナ"
                type="text"
              />
            </div>
          </div>
          <div
            v-if="formData.type_customer == '2'"
            class="row q-col-gutter-md q-mb-md"
          >
            <div class="col-3 offset-md-4">
              <MtInputForm
                v-model="formData.url_supplier"
                label="事業所HP"
                type="text"
              />
            </div>
          </div>
          <div
            v-if="formData.type_customer == '2'"
            class="row q-col-gutter-md q-mb-md"
          >
            <div class="col-3 offset-md-4">
              <MtInputForm
                v-model="formData.name_supplier"
                label="担当者氏名"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtInputForm
                v-model="formData.name_kana_supplier"
                :isKatakana="false"
                label="担当者カナ"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6">
              <MtInputForm
                v-model="formData.memo_customer"
                autogrow
                label="オーナー基本事項"
                type="text"
              />
            </div>
            <div class="col-6">
              <MtInputForm
                v-model="formData.memo_alert"
                autogrow
                label="特記事項"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-my-md">
            <div class="col-auto q-mr-md">
              <span>色区分</span>
            </div>
            <div class="col">
              <q-btn
                v-for="(customerType, index) in filteredCustomerColorList"
                :key="`${index}-${customerType.id_cli_common}`"
                :class="[
                  !(index === 0) ? 'q-ml-md' : '',
                  `bg-${customerType.text1}`
                ]"
                :flat="formData.type_customer_color != customerType.code_func1 "
                :style="{
                  'background-color': customerType.text1,
                  width: '36px',
                  height: '36px',
                  opacity: `${
                    formData.type_customer_color == customerType.code_func1 ? '1' : '0.8'
                  }`
                }"
                class="text-grey-900"
                rounded
                size="small"
                @click="changeTypeCustomerColor(customerType.code_func1)"
              >
                <q-icon
                  v-if="formData.type_customer_color == customerType.code_func1"
                  name="done"
                />
              </q-btn>
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3">
              <InputEmployeeOptGroup
                v-model:selected="formData.id_employee_doctor"
                label="デフォルト 担当医"
                show-select-default-employee
                type-occupation="doctor"
                @update:select-default-employee="
                  selectDefaultEmployee('id_employee_doctor')
                "
              />
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtInputForm
                v-model="formData.flg_referral"
                :items="[{ label: '紹介' }]"
                type="checkbox"
                @click="blankField(['memo_referral', 'datetime_referral_visit'])"
              />
            </div>
            <div class="col-8">
              <MtInputForm
                v-if="formData.flg_referral"
                v-model="formData.memo_referral"
                label="紹介元"
                type="text"
              />
            </div>
            <div class="col-3">
              <MtFormInputDate
                v-if="formData.flg_referral"
                v-model:date="formData.datetime_referral_visit"
                label="紹介者初回来院日"
                type="date"
              />
            </div>
          </div>
          <hr class="light q-mb-lg" />
          <!-- Contact Information -->
          <div class="q-my-lg">
            <h4 class="text-white bg-grey-600 title4">連絡先</h4>
          </div>
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-6 round-section-free-bg bg-accent-050">
              <div class="row justify-between">
                <div class="col-auto q-mt-sm">
                  <span class="field-label1">電話番号</span>
                </div>
                <div class="col-auto">
                  <q-btn color="primary" flat @click="addTel">
                    <q-icon name="add" />
                    電話番号
                  </q-btn>
                </div>
              </div>
              <div
                v-for="(telephone, index) in allTelephones"
                :key="`tel-${index}-${refreshTrigger}`"
                class="row cursor-pointer q-col-gutter-sm q-bb q-pa-xs q-mx-md"
                @click="updateTel(telephone, index)"
              >
                <div class="col-6">
                  <span
                    v-if="telephone.flg_main_tel" 
                    class="field-label-free-color-small bg-accent-900 text-white"
                  >
                    メイン
                  </span>
                  <span
                    v-if="telephone.flg_emergency" 
                    class="field-label-free-color-small bg-darkred text-white"
                  >
                    緊急
                  </span>
                    {{ telephone.title_tel }}
                </div>
                <div
                  class="col-4 text-blue"
                  @click.stop="copyPhoneNumber(telephone.tel_full)"
                >
                  {{ formatPhoneNumber(telephone.tel_full) }}
                </div>
              </div>
            </div>
            <div class="col-5 round-section-free-bg bg-grey-100">
              <div class="row q-col-gutter-md q-pa-md">
                <div class="col-12 q-mt-sm">
                  <span class="field-label1">メールアドレス</span>
                </div>
                <div class="col-6">
                  <MtInputForm
                    v-model="formData.email_title1"
                    label="タイトル1"
                    type="text"
                  />
                </div>
                <div class="col-6">
                  <MtInputForm
                    v-model="formData.email1"
                    :rules="[aahValidations.validationEmail]"
                    label="メール1"
                    type="text"
                    :isError="!!emailErrorMessage"
                    :error-message="emailErrorMessage"
                  />
                </div>
                <div class="col-6">
                  <MtInputForm
                    v-model="formData.email_title2"
                    label="タイトル2"
                    type="text"
                  />
                </div>
                <div class="col-6">
                  <MtInputForm
                    v-model="formData.email2"
                    :rules="[aahValidations.validationEmail]"
                    label="メール2"
                    type="text"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3 m-mr-lg">
              <MtFormCheckBox
                v-model="formData.flg_dm"
                label="ハガキDM可"
                type="checkbox"
              />
            </div>
            <div class="col-3 m-mr-lg">
              <MtFormCheckBox
                v-model="formData.flg_dm_digital"
                label="デジタルDM可"
                type="checkbox"
              />
            </div>
            <div class="col-3 m-mr-lg">
              <MtFormCheckBox
                v-model="formData.flg_complaint"
                label="CL"
                type="checkbox"
              />
            </div>
            <div class="col-3">
              <MtFormCheckBox
                v-model="formData.flg_second_opinion"
                label="セカンドオピニオン来院"
                type="checkbox"
              />
            </div>
          </div>
          <div class="row items-center q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtInputForm
                v-model="formData.pps_login_id"
                label="myVetty：ログインID"
                type="text"
              />
            </div>
           <div class="col-3">
          <div class="input-btn-container">
            <div  class="input-field">
              <MtInputForm
                v-model="formData.password"
                stack-label
                :placeholder="formData.datetime_password_update ? `設定済: ${formatDateWithTime(formData.datetime_password_update)}` : '未設定'"
                label="myVetty：ログインPW"
                type="text"
                @update:model-value="(value) => callCheckPassword(value)"
                :rules="[(val) => passwordRule(val, passwordScore)]"
              />
            </div>
            <div class="action-btn">
              <q-btn
                flat
                class="text-capitalize bg-grey-300 "
                @click="handleSetDefaultPassword"
              >
                デフォルトPW設定
              </q-btn>
            </div>
          </div>

            <q-linear-progress
              v-if="formData.password"
              :value="passwordScore / 4"
              :color="passwordScore >= 2 ? 'green' : 'red'"
              class="progress-bar q-mt-xs"
            />
          </div>
            <div v-if="isEdit" class="">
              <q-btn
                :disable="formData.email1 == '' && formData.email2 == ''"
                class="q-mx-sm"
                flat
                round
                @click="openEmailModal"
              >
                <q-icon name="mail" size="md" />
              </q-btn>
            </div>
            <div v-if="isEdit" class="col-3">
              <MtInputForm
                v-model="formData.flg_login_access"
                :items="[{ label: 'ログイン不可' }]"
                type="checkbox"
              />
            </div>
            <div v-if="isEdit" class="col-auto">
              <div>ログインPW最終更新</div>
            </div>
            <div class="col-auto">
              <div class="flex  gap-2">
                <div>myVetty最終ログイン日時 </div>
                {{  formatDateWithTime(formData?.datetime_last_login_updated)  }}
              </div>
            </div>
          </div>
          <div class="row full-width">
            <section
              class="col q-px-md q-py-sm row items-center mt-stepper"
              style="
                background-color: rgba(222, 255, 218, 1);
                color: rgba(86, 86, 86, 1);
                border-radius: 4px;
                padding-top: 12px;
                max-width: 600px;
                font-size: 12px
              "
            >
              <div class="col column justify-start items-center full-height">
                <span class="q-mb-xs step-icon">
                  <q-icon
                    :name="getStepIconState(1)?.name"
                    :color="getStepIconState(1)?.color"
                    size="24px"
                  />
                </span>
                <span @click="showTooltipStep1 = !showTooltipStep1">
                  ログイン <q-icon name="quiz" size="16px" class="q-ml-xs" />
                  <q-tooltip v-model="showTooltipStep1" anchor="bottom middle" self="top middle">
                    初回ログインを行った日時
                  </q-tooltip>
                </span>
                <span v-if="computedCustomerData?.datetime_pps_initial_login">
                  {{ formatDateWithTime(computedCustomerData?.datetime_pps_initial_login) }}
                </span>
              </div>
              <div class="col column justify-start items-center full-height">
                <span class="q-mb-xs step-icon">
                  <q-icon
                    :name="getStepIconState(2)?.name"
                    :color="getStepIconState(2)?.color"
                    size="24px"
                  />
                </span>
                <span @click="showTooltipStep2 = !showTooltipStep2">
                  PW再設定 <q-icon name="quiz" size="16px" class="q-ml-xs" />
                  <q-tooltip v-model="showTooltipStep2" anchor="bottom middle" self="top middle">
                    初回パスワード再設定行った日時
                  </q-tooltip>
                </span>
                <span v-if="computedCustomerData?.datetime_pps_initial_password_update">
                  {{ formatDateWithTime(computedCustomerData?.datetime_pps_initial_password_update) }}
                </span>
              </div>
              <div class="col column justify-start items-center full-height">
                <span class="q-mb-xs step-icon">
                  <q-icon
                    :name="getStepIconState(3)?.name"
                    :color="getStepIconState(3)?.color"
                    size="24px"
                  />
                </span>
                <span @click="showTooltipStep3 = !showTooltipStep3">
                  Eメール登録 <q-icon name="quiz" size="16px" class="q-ml-xs" />
                  <q-tooltip v-model="showTooltipStep3" anchor="bottom middle" self="top middle">
                    初回Eメール登録を行った日時
                  </q-tooltip>
                </span>
                <span v-if="computedCustomerData?.datetime_email_verified">
                  {{ formatDateWithTime(computedCustomerData?.datetime_email_verified) }}
                </span>
              </div>
              <div class="col column justify-start items-center full-height">
                <span class="q-mb-xs step-icon">
                  <q-icon
                    :name="getStepIconState(4)?.name"
                    :color="getStepIconState(4)?.color"
                    size="24px"
                  />
                </span>
                <span @click="showTooltipStep4 = !showTooltipStep4">
                  LINE連携 <q-icon name="quiz" size="16px" class="q-ml-xs" />
                  <q-tooltip v-model="showTooltipStep4" anchor="bottom middle" self="top middle">
                    myVetty公式チャネルとLINE連携が完了 (任意）
                  </q-tooltip>
                </span>
              </div>
              <!-- <div class="col column justify-start items-center full-height">
                <span class="q-mb-xs step-icon">
                  <q-icon
                    :name="getStepIconState(5)?.name"
                    :color="getStepIconState(5)?.color"
                    size="24px"
                  />
                </span>
                <span @click="showTooltipStep5 = !showTooltipStep5">
                  LINE友達登録 <q-icon name="quiz" size="16px" class="q-ml-xs" />
                  <q-tooltip v-model="showTooltipStep5" anchor="bottom middle" self="top middle">
                    myVettyの公式チャネルの友達追加が完了（任意)
                  </q-tooltip>
                </span>
              </div> -->
            </section>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtInputForm
                v-model="formData.code_customer_ex"
                label="外部システム（旧）オーナーCD"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="formData.date_register"
                label="カルテ作成日時"
              />
            </div>
            <div v-if="isEdit" class="col-3">
              <MtFormInputDate
                v-model:date="formData.date_last_visit"
                label="最終来院日時"
                type="date"
              />
            </div>
            <div v-if="isEdit" class="col-3">
              <q-btn color="primary" @click="toTodaysDate()">
                <q-icon name="arrow_left" />
                今日
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormPullDown
                v-model="formData.type_disc_rate"
                :options="discountRateList"
                label="デフォルト割引率"
                type="selection"
              />
            </div>
          </div>
        </div>
        <div v-if="isEdit">
          <hr class="light q-mb-lg" />
          <div id="address" class="flex items-center justify-between q-mt-lg">
            <!-- Customer Address -->
            <div class="q-mb-md q-mt-lg">
              <h4 class="text-white bg-grey-600 title4">オーナー住所</h4>
            </div>
            <q-btn color="primary" @click="openAddCustomerAddressModal()">
              <q-icon name="add" />
              住所
            </q-btn>
          </div>
          <MtTable2
            :columns="columnAddress"
            :rows="getCustomer?.address"
            :rowsBg="true"
            class="custody-table"
            flat
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
            <template v-slot:row="{ row }">
              <td
                v-for="(col, index) in columnAddress"
                class="cursor-pointer"
                @click="onRowAddressClick(row)"
              >
                <div
                  v-if="col.field == 'flg_main_address'"
                  class="body1 regular text-grey-700"
                  width="10px"
                >
                  <q-icon
                    v-if="row.flg_main_address"
                    class="text-positive"
                    name="check_circle"
                  />
                </div>
                <div v-else class="body1 regular text-grey-900">
                  {{ row[col.field] }}
                </div>
              </td>
            </template>
          </MtTable2>

          <div id="pet" class="flex items-center justify-between q-mt-lg">
            <!-- Pets -->
            <div class="q-mb-md q-mt-lg">
              <h4 class="text-white bg-grey-600 title4">ペット情報</h4>
            </div>
            <q-btn color="primary" @click="openAddPetModal()">
              <q-icon name="add" />
              ペット
            </q-btn>
          </div>
          <MtTable2
            v-if="getCustomer && getCustomer.pets"
            :columns="columns"
            :rows="getCustomer?.pets"
            :rowsBg="true"
            class="custody-table"
            flat
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
            <template v-slot:row="{ row }">
              <td
                v-for="(col, index) in columns"
                :class="{'bg-light-greyred' : row.flg_unlist}"
                class="cursor-pointer"
                @click="openPetDetail(row)"
              >
                <div
                  v-if="col.field == 'code_pet'"
                  :class="
                    row.flg_unlist
                      ? 'text-darkred'
                      : ''
                  "
                  class="body1 regular"
                >
                  <span>{{ row[col.field] }}</span>
                  <q-icon
                    v-if="row.flg_deceased"
                    class="q-ml-xs"
                    name="star_border"
                  />
                  <q-icon
                    v-if="row.flg_send_flower"
                    class="q-ml-xs"
                    name="local_florist"
                  />
                  <span v-if="row.flg_pet_excluded" class="q-ml-xs">[他除]</span>
                </div>
                <div
                  v-else-if="col.field == 'name_pet'"
                  class="body1 regular text-grey-700"
                >
                  <div class="flex items-center">
                    <q-avatar
                      class="q-mr-sm"
                      color="primary"
                      size="md"
                      text-color="white"
                    >
                      <img
                        :src="getPetImageUrl(row)"
                        class="image-responsive"
                        @error="handleImageError($event, row)"
                      />
                    </q-avatar>
                    <div :class="
                      row.flg_unlist
                        ? 'text-darkred'
                        : ''
                    ">
                      <small>{{ row.name_kana_pet }}</small>
                      <div class="text-bold">{{ row.name_pet }}</div>
                    </div>
                  </div>
                </div>
                <div
                  v-else-if="col.field === 'type_animal'"
                  class="body1 regular text-grey-900"
                >
                  {{ typeAnimalName(row.id_cm_animal)?.label }}
                </div>
                <div
                  v-else-if="col.field === 'id_cm_breed'"
                  class="body1 regular text-grey-900"
                >
                  {{ getBreedName(row.id_cm_breed) }}
                </div>
                <div
                  v-else-if="col.field === 'memo_pet'"
                  class="body1 regular text-grey-900"
                >
                  {{ aahTruncate(row.memo_pet, 50) }}
                </div>
                <div v-else class="body1 regular text-grey-900">
                  {{ row[col.field] }}
                </div>
              </td>
            </template>
          </MtTable2>

          <div
            id="memo_customer"
            class="flex items-center justify-between q-mt-lg"
          >
            <!-- Memo Customer -->
            <div class="q-mb-md q-mt-lg">
              <h4 class="text-white bg-grey-600 title4">オーナーメモ</h4>
            </div>
            <q-btn color="primary" @click="openMemoCustomerModal">
              <q-icon name="add" />
              メモ
            </q-btn>
          </div>
          <MtTable2
            v-if="getCustomer && getCustomer.pets"
            :columns="columnMemoCustomer"
            :rows="memoCustomerStore.getMemoCustomers"
            :rowsBg="true"
            class="custody-table"
            flat
            no-data-message="登録がありません。"
            no-result-message="該当のデータが見つかりませんでした"
          >
            <template v-slot:row="{ row }">
              <td
                v-for="(col, index) in columnMemoCustomer"
                class="cursor-pointer"
                @click="openMemoCustomerModal(row)"
                :class="
                  row?.type_memo_customer === 2 && !row?.flg_complete
                    ? 'memo-bg-yellow'
                    : ''
                "
              >
                <div v-if="col.field == 'date_memo_customer'">
                  <q-icon
                    v-if="row.flg_pin"
                    class="text-darkred"
                    name="push_pin"
                  />
                  {{ row.date_memo_customer }}
                </div>
                <div
                  v-else-if="col.field === 'type_memo_customer'"
                  class="body1 regular text-grey-900"
                >
                  {{ getTypeMemoCustomerLabel(row?.type_memo_customer) }}
                </div>
                <div
                  v-else-if="col.field === 'memo_text'"
                  class="body1 regular text-grey-900"
                >
                  {{ row.memo_text }}
                </div>
                <div
                  v-else-if="col.field === 'date_complete'"
                  class="body1 regular text-grey-900"
                >
                  {{ row.date_complete }}
                </div>
                <div v-else class="body1 regular text-grey-900">
                  {{ row[col.field] }}
                </div>
              </td>
            </template>
          </MtTable2>

          <template v-if="formData.flg_group_account">
            <div class="flex items-center justify-between q-mt-lg">
              <div class="body2 bold text-grey-900">グループ管理情報</div>
              <q-btn color="primary" @click="onCustomerAddClick()">
                <q-icon name="add" />
                グループオーナー
              </q-btn>
            </div>
            <MtTable2
              :columns="columnGroups"
              :rows="rowGroups"
              :rowsBg="true"
              class="custody-table"
              flat
              no-data-message="登録がありません。"
              no-result-message="該当のデータが見つかりませんでした"
            >
              <template v-slot:row="{ row }">
                <td v-for="(col, index) in columns" class="cursor-pointer">
                  <div
                    v-if="col.field == 'name'"
                    class="body1 regular text-grey-700"
                  >
                    <small>{{ row.name_kana }}</small>
                    <div>{{ row.name }}</div>
                  </div>
                  <div
                    v-else-if="col.field == 'address'"
                    class="body1 regular text-grey-700"
                  >
                    <div>{{ row.postal }}</div>
                    {{ row.address }}
                  </div>
                  <div
                    v-else-if="col.field == 'contact_request'"
                    class="body1 regular text-grey-700"
                  >
                    <q-icon v-if="row.contact_request" name="circle" size="8px" />
                  </div>
                  <div
                    v-else-if="col.field == 'introduction'"
                    class="body1 regular text-grey-700"
                  >
                    <q-icon v-if="row.introduction" name="circle" size="8px" />
                  </div>
                  <div
                    v-else-if="col.field == 'unpaid'"
                    class="body1 regular text-grey-700"
                  >
                    <q-icon v-if="row.unpaid" name="circle" size="8px" />
                  </div>
                  <div v-else class="body1 regular text-grey-900">
                    {{ row[col.field] }}
                  </div>
                </td>
              </template>
            </MtTable2>
          </template>
        </div>
      </template>
      <q-inner-loading :showing="loading" class="full-height">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>
      <q-dialog
        v-model="toggleAvailable"
        style="
           {
            width: 310px !important;
          }
        "
      >
        <q-card class="mt-small-popup">
          <MtModalHeader
            class="bg-sky-blue"
            @close-modal="() => (toggleAvailable = !toggleAvailable)"
          >
            <div class="full-width">Available Customer Code</div>
          </MtModalHeader>
          <q-scroll-area class="division-model">
            <div class="q-col-gutter-md q-mb-xs q-pl-md q-pt-md">
              <!--                <div v-for="pill in pillDivisionList" :key="pill.id_common" class="col-auto">-->
              <!--                  <MtFormCheckBox v-model:checked="pill.flg_func1" :label="pill.name_common" />-->
              <!--                </div>-->
            </div>
          </q-scroll-area>
          <div class="flex justify-center q-py-md">
            <q-btn
              color="primary"
              label="保存"
              size="sm"
              @click="toggleAvailable"
            ></q-btn>
          </div>
        </q-card>
      </q-dialog>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn 
          outline 
          class="bg-grey-100 text-grey-800" 
          :disable="isSubmitting"
          @click="closeModal"
        >
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          class="q-ml-md"
          color="primary"
          type="submit"
          :loading="isSubmitting"
          :disable="isSubmitting || !code_available"
          unelevated
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
    <q-dialog v-model="showNewManualPassword">
      <q-card class="mt-small-popup">
        <MtModalHeader
          class="bg-sky-blue"
          @close-modal="() => (showNewManualPassword = !showNewManualPassword)"
        >
          <span> 新しいパスワードを入力してください </span>
        </MtModalHeader>
        <q-card-section class="q-px-xl">
          <div class="col-3 q-py-md">
            <MtInputForm
              type="text"
              v-model="manual_password"
              label="パスワード *"
              required
            />
          </div>
          <div class="col-12 q-pt-xl q-px-md text-center">
            <q-btn
              outline
              class="bg-grey-100 text-grey-800"
              @click="submit_manual_password()"
            >
              <span>送信する</span>
            </q-btn>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-form>
</template>

<style lang="scss" scoped>
.customer-tabs {
  position: sticky;
  // set to top on scroll event
  top: -24px;
}
.email-icon {
  font-size: 32px;
  cursor: pointer;
}
.memo-bg-yellow {
  background-color: #fcff5a;
}

.input-btn-container {
  display: flex;
  align-items: center;
  width: 100%; 
}

.input-field {
  flex-grow: 1;
  min-width: 0; 
  margin-right: 2px; 
}

.action-btn {
  flex-shrink: 0; 
  font-size: 10px;
}
</style>

<style lang="scss">
.step-icon {
  position: relative;
}
.step-icon:not(:last-of-type) {
  ::after {
    content: ' ';
    display: block !important;
    height: 4px;
    width: 108px;
    background-color: #D9D9D9;
    border-radius: 4px;
    position: absolute;
    top: calc(50% - 2px);
    left: calc(24px + 4px);
  }
}
.mt-stepper {
  div:last-of-type {
    .step-icon {
      ::after {
        content: none;
      }
    }
  }
}
.q-dialog__inner {
  overflow: hidden !important;
}
</style>
