<script setup lang="ts">
import { computed, onMounted, onUnmounted, Ref, ref, withDefaults } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import selectOptions from '@/utils/selectOptions'
import useCategoryStore from '@/stores/categories'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import InputZipcode from '@/components/form/InputZipcode.vue'
import ImageCropper from '@/components/ImageCropper.vue'
import { imageResize } from '@/utils/helper'
import useCommonStore from '@/stores/common'
import useStatusStore from '@/stores/status'
import {
  TYPE_QT_REQUEST,
  typeCartBarCode,
  typeCartDetailDefaultName,
  typeCarteConfig,
  typeCartRound,
  typeCartRoundUnit,
  typeCheckinQt,
  typeDefaultGroupCartDetails,
  typeDosageCalculation,
  typeHistoryConfig,
  typePpsQt,
  typePrescriptionOptimization
} from '@/utils/enum'
import { changeToggleDropdownNames, checkPassword, isBitSet, passwordRule, updateBtnLabel } from '@/utils/aahUtils'
import { event_bus } from '@/utils/eventBus'
import { ClinicType } from '@/types/types'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { debounce } from 'lodash'

const clinicStore = useClinicStore()
const categoryStore = useCategoryStore()
const statusStore = useStatusStore()

const props = withDefaults(
  defineProps<{
    data: ClinicType
    flgMainClinic: boolean
    selectedTab?: string
  }>(),
  {
    data: () => {
      return {} as ClinicType
    },
    flgMainClinic: false,
    selectedTab: ''
  }
)
const emits = defineEmits(['close'])
const { getClinics } = storeToRefs(clinicStore)
const clinicOptions = ref([])
const myForm = ref(null)
const logo_file_path1 = ref()
const logo_file_path2 = ref()
const img_member_card_path = ref()
const f1_status = ref('unchanged')
const f2_status = ref('unchanged')
const f3_status = ref('unchanged')
const categoryList = ref<any[]>([])
const isEdit = ref(false)
const tab = ref('tab1')
const memoPpsRefEditor = ref()
const memoPpsEditorForeColor = ref('#ffff00')

const passwordFeedback = ref('')
const passwordScore = ref(0)

let observer: MutationObserver | null = null // For DOM mutations
const CHAR_LIMIT = 1000

interface FormData {
  type_pps_qt: number | null
  type_checkin_qt: number | null
  type_pps_booking_config: number | []
  type_pps_payment_config: number | []
  selected_pps_booking_config: number[]
  selected_pps_payment_config: number[]
  flg_pps_multiple_pet: boolean
  type_line_push_noti: number | null
  auto_status_qt_type2: number | null
  auto_status_qt_type3: number | null
  auto_status_prescription: number | null
  auto_status_rq_close: number | null
  type_qt_request: number | null
  flg_cart_barcode_definition: boolean
  barcode_1flag: string
  barcode_2code: string
  barcode_3pricecheckdigit: string
  barcode_4price: string
  barcode_5checkdigit: string
}

interface Een13DataParts {
  part: string;
  position: number;
  length: number;
  color: string;
}

// TODO: Implement all the other fields
const data: Ref<FormData> = ref({
  name_clinic_display: null,
  name_clinic_en: null,
  flg_clinic_main: false,
  flg_facility: false,
  id_clinic_parent: null,
  name_legal: null,
  name_clinic_short: null,
  name_director: null,
  code_ins_anicom: null,
  code_ins_ipet: null,
  zip_code: null,
  address_prefecture: null,
  address_city: null,
  address_other: null,
  phone_title1: null,
  phone1: null,
  phone_title2: null,
  phone2: null,
  fax: null,
  email_title1: null,
  email1: null,
  email_title2: null,
  email2: null,
  url_clinic: null,
  number_invoice_register: null,
  memo_consultation_hours: null,
  date_closed: null,
  memo_slogan: null,
  remarks: null,
  pps_agreement_petsalon: null,
  pps_agreement_pethotel: null,
  display_order: null,
  cycle_vaccine1: null,
  cycle_vaccine2: null,
  val_weight_max_dog: null,
  val_weight_max_cat: null,
  val_weight_max_rabbit_rodent: null,
  type_dosage_calculation: null,
  flg_business_hour_slot1: false,
  flg_business_hour_slot2: false,
  flg_business_hour_slot3: false,
  flg_tax_included: false,
  id_category_task_prescription: null,
  flg_pill_050: false,
  flg_pill_0250: false,
  flg_pill_0333: false,
  flg_pill_0125: false,
  logo_file_path1: null,
  logo_file_path2: null,
  img_member_card_path: null,
  type_carte_config: null,
  type_pps_booking_config: 0,
  type_pps_payment_config: 0,
  type_auto_default_ih: 0,
  type_grouped_prescription: 1,
  type_default_cd_name_sd: 1,
  type_default_cd_name_pd: 1,
  type_default_cd_name_ind: 1,
  selected_pps_booking_config: [],
  selected_pps_payment_config: [],
  idexx_source_id: '',
  type_pps_qt: null,
  type_checkin_qt: null,
  flg_pps_multiple_pet: false,
  type_line_push_noti: null,
  memo_bank_info: '',
  memo_bill_message: '',
  file_password: null,
  type_cart_bar_code: 1,
  auto_status_qt_type2: 1,
  auto_status_qt_type3: 1,
  auto_status_rq_close: 1,
  auto_status_idexx: 1,
  flg_master_data_control: false,
  pps_default_password: '',
  flg_auto_memocarte_ai: false,
  flg_pps_toppage_display: false,
  memo_pps_toppage_info: '',
  type_qt_request: '',
  flg_cart_barcode_definition: false,
  barcode_1flag: '',
  barcode_2code: '',
  barcode_3pricecheckdigit: '',
  barcode_4price: '',
  barcode_5checkdigit: '',
  days_prescription_default: null,
  flg_bcc_email: false,
  email_bcc: null,
  month_business_year_start: null,
  date_business_year_start: null
})

const ppsBookingConfigOptions = [
  { label: '薬予約', value: 1 },
  { label: '美容予約', value: 2 },
  { label: 'ホテル予約', value: 4 },
  { label: 'Web相談', value: 8 },
  { label: '有料相談', value: 16 }
]

const ppsPaymentConfigOptions = [
  { label: 'クレジット決済', value: 1 },
  { label: 'paypay（現在利用不可）', value: 2 }
]

const ean13Inputcollection: {
  label: string
  field: keyof Pick<FormData, 'barcode_1flag' | 'barcode_2code' | 'barcode_3pricecheckdigit' | 'barcode_4price' | 'barcode_5checkdigit'>
  dataLength: 2 | 3
  inputLength: string[],
}[] = [
  {
    label: 'フラグコード',
    field: 'barcode_1flag',
    dataLength: 3,
    inputLength: ['位置','長さ','値'],
  },
  {
    label: '商品コード',
    field: 'barcode_2code',
    dataLength: 3,
    inputLength: ['位置','長さ','値'],
  },
  {
    label: '価格チェックデジット',
    field: 'barcode_3pricecheckdigit',
    dataLength: 2,
    inputLength: ['位置','長さ','値'],
  },
  {
    label: '価格データ',
    field: 'barcode_4price',
    dataLength: 2,
    inputLength: ['位置','長さ','値'],
  },
  {
    label: 'チェックデジット',
    field: 'barcode_5checkdigit',
    dataLength: 2,
    inputLength: ['位置','長さ','値'],
  },
]

const typeCarteConfigList = ref([])
const typeAutoIHList = ref([])
const ean13SampleLabels = ref<Record<keyof Pick<FormData, 'barcode_1flag' | 'barcode_2code' | 'barcode_3pricecheckdigit' | 'barcode_4price' | 'barcode_5checkdigit'>, string[]>>({
  barcode_1flag: '',
  barcode_2code: '',
  barcode_3pricecheckdigit: '',
  barcode_4price: '',
  barcode_5checkdigit: ''
})

const closeModal = () => {
  emits('close')
}

const pillDivision: any = ref([])

const showEan13CodeSetting = ref<boolean>(props.data.type_cart_bar_code == 6)

const auto_status_qt_type2_options = computed(() => {
  let options = statusStore.getStatuses.filter((ss) =>
    [1, 2, 3, 4, 5].includes(ss.type_category_child)
  )
  return options.map((o) => {
    return {
      label: o.name_status,
      value: o.id_status
    }
  })
})

const auto_status_qt_type3_options = computed(() => {
  let options = statusStore.getStatuses.filter((ss) =>
    [2, 3, 4, 5].includes(ss.type_category_child)
  )
  return options.map((o) => {
    return {
      label: o.name_status,
      value: o.id_status
    }
  })
})

const auto_status_prescription = computed(() => {
  let options = statusStore.getStatuses.filter(
    (ss) =>
      [10].includes(ss.type_category_child) && ss.type_category_parent == 11
  )
  return options.map((o) => {
    return {
      label: o.name_status,
      value: o.id_status
    }
  })
})

const auto_status_rq_close_options = computed(() => {
  let options = statusStore.getStatuses.filter(
    (ss) => ss.type_category_child == 20
  )
  return options.map((o) => {
    return {
      label: o.name_status,
      value: o.id_status
    }
  })
})

const strippedContent = ref('')

const stripContent = debounce((content: string) => {
  strippedContent.value = content.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")

  if (strippedContent.value.length > CHAR_LIMIT) {
    data.value.memo_pps_toppage_info = content.substring(0, content.length - (strippedContent.value.length - CHAR_LIMIT))
    strippedContent.value = strippedContent.value.slice(0, CHAR_LIMIT)
  }
  
  updateBtnLabel(content)
}, 100)

const changeZipCode = (value: any) => {
  // Convert zip code to string/numbers
  if (typeof value === 'object') {
    data.value.address_prefecture = value.address_prefecture
    data.value.address_city = value.address_city
    data.value.address_other = value.address_other
    data.value.zip_code = value.zip_code
  }
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
            clinicStore.destroyClinic(data.value.id_clinic).then(() => {
              clinicStore.fetchClinics()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const objectData = (obj: any) => {
  const formData = {} as any
  Object.entries(obj).forEach(([key]) => {
    if (
      key != 'logo_file_path1' &&
      key != 'logo_file_path2' &&
      key != 'img_member_card_path'
    ) {
      if (key == 'datetime_insert' || key == 'datetime_update') {
      } else {
        formData[key] = obj[key]
      }
    } else {
      if (key == 'logo_file_path1') {
        if (f1_status.value != 'unchanged') {
          formData[key] = obj[key]
        }
      } else if (key == 'logo_file_path2') {
        if (f3_status.value != 'unchanged') {
          formData[key] = obj[key]
        }
      } else if (key == 'img_member_card_path') {
        if (f2_status.value != 'unchanged') {
          formData[key] = obj[key]
        }
      }
    }
  })
  return formData
}

const submit = async () => {
  myForm.value.validate().then((success) => {
    if (success) {
      if (props.data?.id_clinic) {
        const myFormData = objectData(data.value)

        // const zip_code_oject = myFormData.zip_code
        // myFormData.zip_code = zip_code_oject.zip_code
        // myFormData.address_prefecture = zip_code_oject.address_prefecture
        // myFormData.address_city = zip_code_oject.address_city
        // myFormData.address_other = zip_code_oject.address_other

        myFormData.id_clinic = props.data?.id_clinic

        myFormData.type_pps_booking_config =
          data.value.selected_pps_booking_config.reduce(
            (acc, booking) => acc + booking,
            0
          )

        if (!disablePaymentOption.value) {
          myFormData.type_pps_payment_config =
            data.value.selected_pps_payment_config.reduce(
              (acc, payment) => acc + payment,
              0
            )
        } else {
          myFormData.type_pps_payment_config = 0
        }

        //Only if EAN13 is selected
        if (myFormData.flg_cart_barcode_definition && myFormData.type_cart_bar_code == 6) {
          // Check if all barcode fields have values
          if (myFormData.barcode_1flag || 
              myFormData.barcode_2code ||
              myFormData.barcode_3pricecheckdigit ||
              myFormData.barcode_4price ||
              myFormData.barcode_5checkdigit) {
            myFormData.barcode_1flag = formatBarcodePart(myFormData.barcode_1flag, 3, true, true)
            myFormData.barcode_2code = formatBarcodePart(myFormData.barcode_2code, 3, true, true)
            myFormData.barcode_3pricecheckdigit = formatBarcodePart(myFormData.barcode_3pricecheckdigit, 2, true, true)
            myFormData.barcode_4price = formatBarcodePart(myFormData.barcode_4price, 2, true, true)
            myFormData.barcode_5checkdigit = formatBarcodePart(myFormData.barcode_5checkdigit, 2, true, true)
          } else {
            myFormData.flg_cart_barcode_definition = false
          }
        } 

        if(myFormData.bcc_email == '') {
          myFormData.bcc_email = null
        }

        clinicStore
          .updateClinic(props.data?.id_clinic, myFormData)
          .then(async () => {
            await clinicStore.fetchClinics()
            emits('close')
            mtUtils.autoCloseAlert(aahMessages.success)
          })
      } else {
        clinicStore.submitClinic(data.value).then(async () => {
          await clinicStore.fetchClinics()
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
        })
      }
    }
  })
}
const updateIdClinicParent = (value: any) => {
  if (!value) {
    data.value.id_clinic_parent = null
  }
}

const handleUrlClick = () => {
  if (data.value.url_clinic !== null) {
    window.open(data.value.url_clinic, '_blank')
  }
}

const removeImage = (type: any) => {
  if (type == 'logo_file_path1') {
    logo_file_path1.value = null
    data.value.logo_file_path1 = null
    f1_status.value = 'removed'
  } else if (type == 'logo_file_path2') {
    logo_file_path2.value = null
    data.value.logo_file_path2 = null
    f3_status.value = 'removed'
  } else if (type == 'img_member_card_path') {
    img_member_card_path.value = null
    data.value.img_member_card_path = null
    f2_status.value = 'removed'
  }
}

function onFilePicked(e: any, type: any) {
  const files = e.target.files
  const reader = new FileReader()
  reader.onload = (e) => {
    if (type == 'img_member_card_path') {
      data.value.img_member_card_path = files[0]
      img_member_card_path.value = files[0]
      f2_status.value = 'changed'
    } else {
      mtUtils.mediumPopup(ImageCropper, {
        image: e.target.result,
        extraKeys: type,
        cropType: type == 'logo_file_path1' ? 'portrait' : 'landscape'
      })
    }
  }
  reader.readAsDataURL(files[0])
}

async function updPillDivision(value: any, pill: any) {
  const res = await mtUtils.callApi(
    selectOptions.reqMethod.PUT,
    `mst/common/${pill.id_common}`,
    {
      flg_func1: value
    }
  )
  if (res) {
    await mtUtils.autoCloseAlert(aahMessages.success)
  }
}

const rules = [aahValidations.validationInBetween]

async function checkedFlg(event: any, checkbox: any) {
  if (event) {
    if (!data.value.type_carte_config) data.value.type_carte_config = 0
    data.value.type_carte_config =
      parseInt(data.value.type_carte_config) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(data.value.type_carte_config, checkbox.value)) {
    data.value.type_carte_config =
      parseInt(data.value.type_carte_config) - parseInt(checkbox.value)
  }
}

async function typeAutoIHChecked(event: any, checkbox: any) {
  if (event) {
    if (!data.value.type_auto_default_ih) data.value.type_auto_default_ih = 0
    data.value.type_auto_default_ih =
      parseInt(data.value.type_auto_default_ih) + parseInt(checkbox.value)
  }
  if (!event && isBitSet(data.value.type_auto_default_ih, checkbox.value)) {
    data.value.type_auto_default_ih =
      parseInt(data.value.type_auto_default_ih) - parseInt(checkbox.value)
  }
}

const colorClicked = () => {
  const edit = memoPpsRefEditor.value
  edit.runCmd('foreColor', memoPpsEditorForeColor.value)
  edit.focus()
}

const formatBarcodePart = (value: string, places: 2 | 3, fix: boolean = false, fill: boolean = false) => {
  if (!value || value.trim() === '') {
    if (fill) {
      // Return empty string with correct number of commas based on places
      return places === 3 ? '0,0,' : '0,0';
    } else {
      return '';
    }
  }
  
  // Split by commas and trim each part
  let parts = value.split(',').map(part => part.trim());
  
  // Fix or adjust the parts array to match the required places
  if (fix || parts.length !== places) {
    // Add missing parts
    while (parts.length < places) {
      parts.push('0');
    }
    // Truncate extra parts
    if (parts.length > places) {
      parts = parts.slice(0, places);
    }
  }
  
  // Ensure position and length are between 0-12
  let start = parts[0] || '0';
  let length = parts[1] || '0';
  
  // Validate position (start) is between 0-12
  const startNum = parseInt(start, 10);
  if (isNaN(startNum) || startNum < 0 || startNum > 12) {
    start = '0';
  }
  
  // Validate length is between 0-12
  const lengthNum = parseInt(length, 10);
  if (isNaN(lengthNum) || lengthNum < 0 || lengthNum > 12) {
    length = '0';
  }
  
  // For 3-place format, handle the flag
  if (places === 3) {
    let flag = parts[2] || '0';
    
    // If length is 0, return empty string for flag
    if (lengthNum === 0) {
      flag = '';
    } 
    // If length is provided and greater than 0, truncate from the beginning if needed
    else if (flag.length > lengthNum) {
      flag = flag.slice(-lengthNum); // Get only the last 'lengthNum' characters
    } 
    // Pad with leading zeros if shorter than specified length
    else if (flag.length < lengthNum) {
      flag = flag.padStart(lengthNum, '0');
    }
    
    return `${start},${length},${flag}`;
  }
  
  // For 2-place format
  return `${start},${length}`;
}

const initAllEan13SampleLabels = () => {
  formatEAN13FromSettingForSampling('barcode_1flag')
  formatEAN13FromSettingForSampling('barcode_2code')
  formatEAN13FromSettingForSampling('barcode_3pricecheckdigit')
  formatEAN13FromSettingForSampling('barcode_4price')
  formatEAN13FromSettingForSampling('barcode_5checkdigit')
}

const formatEAN13FromSettingForSampling = (
  field: keyof Pick<
    FormData,
    | 'barcode_1flag'
    | 'barcode_2code'
    | 'barcode_3pricecheckdigit'
    | 'barcode_4price'
    | 'barcode_5checkdigit'
  >
): Een13DataParts[] => {
  const { part1, part2, part3, part4, part5 } = {
    part1: data.value.barcode_1flag,
    part2: data.value.barcode_2code,
    part3: data.value.barcode_3pricecheckdigit,
    part4: data.value.barcode_4price,
    part5: data.value.barcode_5checkdigit
  }
  const partValues = {
    part1: field === 'barcode_1flag' ? '00000000000000' : 'XXXXXXXXXXXXX',
    part2: field === 'barcode_2code' ? '00000000000000' : 'XXXXXXXXXXXXX',
    part3: field === 'barcode_3pricecheckdigit' ? '00000000000000' : 'XXXXXXXXXXXXX',
    part4: field === 'barcode_4price' ? '00000000000000' : 'XXXXXXXXXXXXX',
    part5: field === 'barcode_5checkdigit' ? '00000000000000' : 'XXXXXXXXXXXXX'
  }
  // Initialize the result string with 13 zeros
  let result = 'X'.repeat(13);
  // Initialize an array to store parts with their values and colors
  let parts: Een13DataParts[] = [];
  
  // Process each part
  const processPart = (partConfig: string, partKey: string) => {
    if (!partConfig) return;
    
    const segments = partConfig.split(',');
    if (segments.length < 2) return;
    
    const position = parseInt(segments[0], 10);
    const length = parseInt(segments[1], 10);
    
    if (isNaN(position) || isNaN(length) || length === 0) return;
    // Get the value from partValues using type-safe key
    const value = partValues[partKey as keyof typeof partValues] || '0';
    
    // Format the value according to the specified length
    const formattedValue = value.padStart(length, '0').slice(0, length);
    // Replace the characters at the specified position
    const newResult = result.split('');
    for (let i = 0; i < length; i++) {
      if (position + i < newResult.length) {
        newResult[position + i] = formattedValue[i];
      }
    }
    result = newResult.join('');
    ean13SampleLabels.value[field] = newResult
    // Add this part to our parts array
    parts.push({
      part: formattedValue,
      position: position,
      length: length,
      color: '#000' // not used
    });
  };
  
  // Process each part in order with its associated color
  processPart(part1, 'part1');
  processPart(part2, 'part2');
  processPart(part3, 'part3');
  processPart(part4, 'part4');
  processPart(part5, 'part5');
  
  // Ensure the final result is padded to 13 digits
  result = result.substring(0, 13).padStart(13, '0');
  
  // Return both the formatted string and the parts array
  return parts
}

const setEanStandardDefault = () => {
  data.value.barcode_5checkdigit = '12,1'
}

const handleBarcodeModelUpdate = (
    field: keyof Pick<
      FormData,
      | 'barcode_1flag'
      | 'barcode_2code'
      | 'barcode_3pricecheckdigit'
      | 'barcode_4price'
      | 'barcode_5checkdigit'
    >,
    value: string,
    position: number,
    places: 2 | 3,
    fix: boolean = false
) => {
    if (isNaN(Number(value))) return
    if (Number(value) % 1 !== 0) return
    const preData = formatBarcodePart(data.value[field], places, fix, true)
    const parts = preData.split(',')
    if (parts.length > 0) {
        parts[position] = position < 2 ? Number(value).toString() : value // eliminate leading zeros for position and length
    }
    const postData = parts.join(',')
    data.value[field] = formatBarcodePart(postData, places, fix, true)
    initAllEan13SampleLabels()
}

const handleMaskInput = (value: string, places: 2 | 3, index: number = 0) => {
  if(index > places - 1) return '(自動)'
  const toMask = formatBarcodePart(value, places, true, true)
  const parts = toMask.split(',')
  if (index > parts.length - 1) {
    return parts[parts.length - 1]
  }
  return parts[index]
}

const handleBarcodeTypeChange = () => {
  if (data.value.type_cart_bar_code == 6) {
    showEan13CodeSetting.value = true
    setEanStandardDefault()
    initAllEan13SampleLabels()
  } else {
    showEan13CodeSetting.value = false
  }
}

event_bus.on('cropped-image', (image) => {
  imageResize(image.blob, 500, 300, 'image/png')
    .then((i) => {
      if (image.type == 'logo_file_path1') {
        data.value.logo_file_path1 = i
        logo_file_path1.value = image.image
        f1_status.value = 'changed'
      } else if (image.type == 'logo_file_path2') {
        data.value.logo_file_path2 = i
        logo_file_path2.value = image.image
        f3_status.value = 'changed'
      }
    })
    .catch((error) => {
      console.error('Failed to resize image:', error)
    })
})

const callCheckPassword = (value: string) => {
  const result = checkPassword(value)
  passwordScore.value = result.score
  passwordFeedback.value = result.feedback
}

onMounted(async () => {
  await useCommonStore().fetchPreparationCommonList({ code_common: [5] })

  pillDivision.value = useCommonStore().getCommonPillDivisionOptionList
  typeCarteConfigList.value = [...typeCarteConfig]
  typeAutoIHList.value = [...typeHistoryConfig]

  await statusStore.fetchStatuses()

  if (props.data?.id_clinic) {
    // Update case
    isEdit.value = true
    data.value = { ...props.data }

    logo_file_path1.value = props.data.logo_file_path1
    logo_file_path2.value = props.data.logo_file_path2
    // img_member_card_path.value =  getImage(props.data.img_member_card_url)
    img_member_card_path.value = props.data.img_member_card_url

    if (data.value.type_carte_config) {
      typeCarteConfigList.value = typeCarteConfig.map((o: any) => {
        const configValue = data.value.type_carte_config
        const bitValue = o.value
        const isChecked = isBitSet(configValue, bitValue)
        return {
          ...o,
          checked: isChecked
        }
      })
    }
    if (data.value.type_auto_default_ih) {
      typeAutoIHList.value = typeAutoIHList.value.map((o: any) => {
        const configValue = data.value.type_auto_default_ih
        const bitValue = o.value
        const isChecked = isBitSet(configValue, bitValue)
        return {
          ...o,
          checked: isChecked
        }
      })
    }

    data.value.auto_status_qt_type2 = statusStore.getStatuses.find(
      (ss) => ss.id_status == props.data.auto_status_qt_type2
    )?.id_status
    data.value.auto_status_qt_type3 = statusStore.getStatuses.find(
      (ss) => ss.id_status == props.data.auto_status_qt_type3
    )?.id_status
    data.value.auto_status_rq_close = statusStore.getStatuses.find(
      (ss) => ss.id_status == props.data.auto_status_rq_close
    )?.id_status

    stripContent(data.value.memo_pps_toppage_info)
    setEanStandardDefault()
    initAllEan13SampleLabels()
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
  }
  await clinicStore.fetchClinics()
  categoryList.value = [
    ...categoryStore.getAllCategories.filter(
      (i) => i.flg_for_task && i.parentCategory == '1'
    )
  ]
  if (
    getClinics.value &&
    getClinics.value.length &&
    getClinics.value.length > 0
  ) {
    clinicOptions.value = getClinics.value
      .filter((v) => !v.flg_facility)
      .map((v) => {
        return {
          value: v.id_clinic,
          label: v.name_clinic_display
        }
      })
  }

  if (props?.selectedTab === '会計') {
    tab.value = 'tab2'
    return tab.value
  }

  if (props?.selectedTab === '受付') {
    tab.value = 'tab4'
    return tab.value
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
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})

const disablePaymentOption = computed(() => {
  return data.value.type_pps_qt === 2 || data.value.type_pps_qt === 4
})
</script>

<template>
  <q-form @submit="submit" ref="myForm">
    <MtModalHeader @closeModal="closeModal">
      <div class="row q-mr-auto">
        <q-toolbar-title class="text-grey-900 title2 bold">
          病院・施設
        </q-toolbar-title>
        <div class="flex items-center justify-between">
          <q-tabs v-model="tab" align="left" class="tab-style2" dense>
            <q-tab
              class="tabsBox body2 regular q-mr-md"
              label="基本情報"
              name="tab1"
            />
            <q-tab
              class="tabsBox body2 regular q-mr-md"
              label="会計"
              name="tab2"
            />
            <q-tab
              class="tabsBox body2 regular q-mr-md"
              label="処方箋"
              name="tab3"
            />
            <q-tab
              class="tabsBox body2 regular q-mr-md"
              label="受付"
              name="tab4"
            />
            <q-tab
              class="tabsBox body2 regular q-mr-md"
              label="他設定"
              name="tab5"
            />
          </q-tabs>
        </div>
      </div>
      <q-btn flat round v-if="isEdit" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl content">
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="tab1" class="q-pa-none overflow-hidden">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-lg-8 col-md-8 col-sm-12">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    v-model="data.flg_clinic_main"
                    :disable="!props.flgMainClinic"
                    :items="[{ label: '本院' }]"
                    type="checkbox"
                  />
                </div>
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    type="checkbox"
                    :items="[{ label: '病院内施設' }]"
                    v-model="data.flg_facility"
                    @update:modelValue="updateIdClinicParent"
                    :disable="isEdit"
                  />
                </div>
                <div class="col-md-4 col-sm-6" v-if="data.flg_facility == true">
                  <MtFormPullDown
                    :options="clinicOptions"
                    v-model:selected="data.id_clinic_parent"
                    label="紐づけ病院"
                    type="selection"
                    :disable="isEdit"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md" v-if="isEdit">
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    type="text"
                    v-model="data.code_clinic"
                    label="病院CD"
                    readonly
                    s
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    type="text"
                    v-model="data.name_clinic_display"
                    label="病院名*"
                    required
                    :rules="[aahValidations.validationRequired]"
                  />
                </div>
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    type="text"
                    v-model="data.name_clinic_en"
                    label="病院名：英語"
                    required
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    v-model="data.name_legal"
                    label="法人名・屋号"
                    type="text"
                  />
                </div>
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    type="text"
                    v-model="data.name_clinic_short"
                    label="略称"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-md-4 col-sm-6">
                  <MtInputForm
                    type="text"
                    v-model="data.name_director"
                    label="院長名"
                  />
                </div>
              </div>
            </div>
            <div class="col-md-2 col-sm-12" v-if="!data.flg_facility">
              <div class="text-center body1 regular text-grey-700 q-mb-sm">
                病院ロゴ（正方形）
              </div>
              <div v-if="logo_file_path1" class="relative-position">
                <q-img
                  :src="logo_file_path1"
                  spinner-color="white"
                  class="full-width"
                />
                <q-badge
                  color="red"
                  floating
                  transparent
                  @click="removeImage('logo_file_path1')"
                  class="cursor-pointer"
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
                @change="onFilePicked($event, 'logo_file_path1')"
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-md-2 col-sm-12" v-if="!data.flg_facility">
              <div class="text-center body1 regular text-grey-700 q-mb-sm">
                病院ロゴ（横長）
              </div>
              <div v-if="logo_file_path2" class="relative-position">
                <q-img
                  :src="logo_file_path2"
                  spinner-color="white"
                  class="full-width"
                />
                <q-badge
                  color="red"
                  floating
                  transparent
                  @click="removeImage('logo_file_path2')"
                  class="cursor-pointer"
                >
                  <q-icon name="close" />
                </q-badge>
              </div>
              <q-btn
                v-else
                @click="$refs.file2.click()"
                unelevated
                color="grey-300"
                text-color="grey-800"
                class="full-width q-px-xl q-py-none"
              >
                <q-icon size="60px" name="add" />
              </q-btn>
              <input
                type="file"
                style="display: none"
                ref="file2"
                accept="image/*"
                @change="onFilePicked($event, 'logo_file_path2')"
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <InputZipcode
                v-model:selecting="data.zip_code"
                @changeZipCode="changeZipCode"
                label="郵便番号"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.address_prefecture"
                label="都道府県"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.address_city"
                label="市区町村"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="checkbox"
                :items="[{ label: 'VettyCTIを利用' }]"
                v-model="data.flg_vetty_cti"
              />
            </div>
            <div class="col-md-6 col-sm-12">
              <MtInputForm
                type="text"
                v-model="data.address_other"
                label="住所"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.phone_title1"
                label="電話番号タイトル1"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.phone1"
                label="電話番号1"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.phone_title2"
                label="電話番号タイトル2"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.phone2"
                label="電話番号2"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm type="text" v-model="data.fax" label="FAX番号" />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.email_title1"
                label="メールタイトル1"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm type="text" v-model="data.email1" label="メール1" />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.email_title2"
                label="メールタイトル2"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm type="text" v-model="data.email2" label="メール2" />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-6 col-sm-12">
              <MtInputForm
                type="text"
                v-model="data.url_clinic"
                label="病院HP"
                iconPrepend="insert_link"
                :buttonAppend="data.url_clinic?.length ? ' リンク ' : null"
                :handleBtnClick="handleUrlClick"
                autogrow
              >
                <template></template>
              </MtInputForm>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">            
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.month_business_year_start"
                label="事業年開始月"
                type="text"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.date_business_year_start"
                label="事業年開始日"
                type="text"
              />
            </div>
          </div>          
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.memo_consultation_hours"
                label="表示用 診療時間"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.date_closed"
                label="休診日"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <MtInputForm
                type="text"
                v-model="data.memo_slogan"
                label="スローガン"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <MtInputForm type="text" v-model="data.remarks" label="備考" />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.display_order"
                label="表示順序（0~999; 小を上位表示）"
              />
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="tab2" class="q-pa-none overflow-hidden">
          <!-- <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">保険会社コード</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              保険会社から指定された企業コードを設定
            </span>
          </div> -->
          <!-- <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4">
              <MtInputForm
                type="text"
                v-model="data.code_ins_anicom"
                label="アニコム企業CD"
              />
            </div>
            <div class="col-4">
              <MtInputForm
                type="text"
                v-model="data.code_ins_ipet"
                label="アイペット企業CD"
              />
            </div>
          </div>
          <hr class="light" /> -->
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">会計設定</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              会計処理の基本設定
            </span>
            <a href="/SearchPaymentMethodList" class="text-blue">
              <span class="caption1 regular q-mr-md">支払方法</span>
            </a>
            <a href="/SearchDiscountRateList" class="q-mr-md text-blue">
              <span class="caption1 regular">割引率</span>
            </a>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 q-mb-xs">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                領収書に表示する登録番号
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.number_invoice_register"
                label="請求書登録番号"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 q-mb-none">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                商品登録時の初期設定
              </span>
            </div>
            <div class="col-md-4 col-sm-6">
              <MtInputForm
                type="checkbox"
                :items="[{ label: '商品デフォルト内税' }]"
                v-model="data.flg_tax_included"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                会計時の端数処理
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_cart_round_unit"
                :options="typeCartRoundUnit"
                label="会計まるめ単位"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_cart_round"
                :options="typeCartRound"
                label="会計時の端数処理区分"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-lg-3 col-md-3 col-sm-12">
              <MtInputForm
                label="診療明細書内 振込先（最大4行表示）"
                v-model="data.memo_bank_info"
                class="textarea"
                maxlength="500"
                type="textarea"
                autogrow
              />
            </div>
            <div class="col-lg-3 col-md-3 col-sm-12">
              <MtInputForm
                label="診療明細書 下部案内"
                v-model="data.memo_bill_message"
                class="textarea"
                maxlength="200"
                type="textarea"
                autogrow
              />
            </div>
          </div>
          <div class="q-my-md">
            <h4 class="text-white bg-grey-600 title4">会計明細の管理</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              リクエストから会計明細を作成する際の設定
            </span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                会計明細のデフォルト表示名
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_default_cd_name_sd"
                :options="typeCartDetailDefaultName"
                label="治療サービス"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_default_cd_name_pd"
                :options="typeCartDetailDefaultName"
                label="処方箋"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_default_cd_name_ind"
                :options="typeCartDetailDefaultName"
                label="注射・点滴"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 q-mb-xs">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                会計明細の作成時の会計明細のデフォルト表示名
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_grouped_prescription"
                :options="typeDefaultGroupCartDetails"
                label="会計時の処方箋グループ"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 q-mb-xs">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                会計明細表示バーコード
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_cart_bar_code"
                :options="typeCartBarCode"
                label="会計明細表示バーコード"
                required
                :rules="[aahValidations.validationRequired]"
                @update:model-value="handleBarcodeTypeChange"
              />
            </div>
            <div class="col-12 col-md-9" style="padding-top: 6px !important" v-if="showEan13CodeSetting">
              <div class="row">
                <div class="col-auto q-pt-md">
                  <MtInputForm
                    type="checkbox"
                    :items="[{ label: !data.flg_cart_barcode_definition ? 'カスタム設定' : null }]"
                    v-model="data.flg_cart_barcode_definition"
                  />
                </div>
                <div class="col-12 col-sm grouped-col-input" v-if="data.flg_cart_barcode_definition">

                  <div class="row" v-for="item in ean13Inputcollection" :key="item.field">
                    <div class="col-12">
                      <div class="row" style="gap: 10px;">
                        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sml">
                          {{ item.label }}
                        </span>
                        <div class="row items-center justify-center q-ml-auto" style="font-size: 13px;">
                          <template v-for="(label, index) in ean13SampleLabels[item.field]" :key="index">
                            <div 
                              class="caption1 regular q-mt-sm q-ml-sml" 
                              :style="{
                                color: label === '0' ? '#f53e3e' : 'black',
                                fontWeight: label === '0' ? 'bold' : 'normal',
                                fontSize: label === '0' ? '13px' : '12px'
                              }"
                            >
                            {{ label }}
                            </div>
                          </template>
                        </div>
                      </div>
                    </div>
                    <div class="col-12 grouped-col-parts" >
                      <div class="row" style="gap: 10px;">
                        <div class="col" v-for="(input, index) in item.inputLength" :key="index">
                          <q-input
                            :model-value="handleMaskInput((data as any)[item.field] ?? '', item.dataLength, index)"
                            @update:model-value="(value) => handleBarcodeModelUpdate(item.field, (value ?? '').toString(), index, item.dataLength, true)"
                            :disable="index >= item.dataLength || item.field === 'barcode_5checkdigit'"
                          />
                          <small class="hint">
                            {{ input }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="tab3" class="q-pa-none overflow-hidden">
          <!--<div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.cycle_vaccine1"
                label="ワクチンサイクル1：幼犬"
                type="number"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.cycle_vaccine2"
                label="ワクチンサイクル2：幼犬"
                type="number"
              />
            </div>
          </div>-->
          <!-- <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.val_weight_max_dog"
                label="処方時チェック：犬最大体重"
                type="number"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.val_weight_max_cat"
                label="処方時チェック：猫最大体重"
                type="number"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.val_weight_max_rabbit_rodent"
                label="処方時チェック：ウサギ/げっ歯類最大体重"
                type="number"
              />
            </div>
          </div> -->
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">デフォルト錠剤分割</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              医薬品マスタの登録時に使用するデフォルト分割設定
            </span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div
              v-for="pill in pillDivision"
              :key="pill.id_common"
              class="col-3"
            >
              <MtFormCheckBox
                v-model:checked="pill.flg_func1"
                :label="pill.name_common"
                @update:checked="updPillDivision($event, pill)"
              />
            </div>
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">処方箋設定</h4>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model:selected="data.id_category_task_prescription"
                :options="categoryList"
                label="処方箋タスク初期設定カテゴリ"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_dosage_calculation"
                :options="typeDosageCalculation"
                label="処方料金計算区分"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_prescription_optimization"
                :options="typePrescriptionOptimization"
                label="処方最適解の求め方"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.days_prescription_default"
                label="デフォルト服用日数"
                type="number"
              />
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="tab4" class="q-pa-none overflow-hidden">
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">受付設定</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              診療時間枠の設定
            </span>
            <a href="/SearchQueueTicketPurposeList" class="text-blue">
              <span class="caption1 regular">受付区分の設定</span>
            </a>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                対象の担当医の1位にある「整理券」ステータスの受付を指定時間後に自動不在化（0-120分設定;
                0分は処理なし）
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="number"
                v-model="data.min_auto_absent"
                label="受付：自動不在設定"
                :rules="aahValidations.validationNonNegativeNumber"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_checkin_qt"
                :options="typeCheckinQt"
                label="病院受付画面：担当者表示"
                type="selection"
              />
            </div>
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">自動ステータス</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              特定動作時にステータスボード内のステータスを自動で移行します。
            </span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.auto_status_qt_type1"
                :options="auto_status_qt_type2_options"
                label="RQ作成 → SB自動移行先"
                type="selection"
              />
            </div>
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.auto_status_qt_type2"
                :options="auto_status_qt_type2_options"
                label="受付ｽﾃ-ﾀｽを'受付'変更時 → SB自動移行先"
              />
            </div>
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.auto_status_qt_type3"
                :options="auto_status_qt_type3_options"
                label="受付ｽﾃ-ﾀｽを'呼出済'変更時 → SB自動移行先"
              />
            </div>
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.auto_status_prescription"
                :options="auto_status_prescription"
                label="処方依頼 → SB自動移行先"
              />
            </div>
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.auto_status_rq_close"
                :options="auto_status_rq_close_options"
                label="RQ終了時 → SB自動移行先"
              />
            </div>
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.type_qt_request"
                :options="TYPE_QT_REQUEST"
                label="受付時のRQ生成方法"
              />
            </div>
            <div class="col-md-3 col-sm-4">
              <MtFormPullDown
                v-model:selected="data.auto_status_idexx"
                :options="auto_status_qt_type2_options"
                label="外注検査ﾃﾞｰﾀ受信時"
              />
            </div>
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">診療時間枠</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              診療時間枠の設定
            </span>
            <a href="/SearchBusinessHourSlotList" class="text-blue">
              <span class="caption1 regular">時間枠マスタの設定</span>
            </a>
          </div>
          <div class="row q-col-gutter-md q-mb-md" v-if="computedIsEan13">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="checkbox"
                :items="[{ label: '時間枠1' }]"
                v-model="data.flg_business_hour_slot1"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="checkbox"
                :items="[{ label: '時間枠2' }]"
                v-model="data.flg_business_hour_slot2"
              />
            </div>
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="checkbox"
                :items="[{ label: '時間枠3' }]"
                v-model="data.flg_business_hour_slot3"
              />
            </div>
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">myVetty受付設定</h4>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                myVetty整理券の設定
              </span>
            </div>
            <div class="col-md-3 col-sm-6">
              <MtFormPullDown
                v-model="data.type_pps_qt"
                :options="typePpsQt"
                label="myVetty整理券利用"
                type="selection"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                myVetty整理券取得時に複数ペット選択を許可する
              </span>
            </div>
            <MtFormRadiobtn
              v-model:selected="data.flg_pps_multiple_pet"
              class="q-mr-sm"
              label="ペットの複数選択可"
              size="28px"
              type="radio"
              :val="true"
            />
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                myVettyで利用できる予約区分の設定
              </span>
            </div>
            <MtInputForm
              type="optiongroup"
              v-model="data.selected_pps_booking_config"
              :optionGroupOptions="ppsBookingConfigOptions"
              option-type="checkbox"
            />
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                myVetty決済の利用（別途契約が必要）
              </span>
            </div>
            <div class="col-md-3 col-sm-6" v-if="!disablePaymentOption">
              <MtInputForm
                type="optiongroup"
                v-model="data.selected_pps_payment_config"
                :optionGroupOptions="ppsPaymentConfigOptions"
                :disable="disablePaymentOption"
                option-type="checkbox"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12">
              <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
                LINEプッシュ通知機能使用範囲の設定
              </span>
            </div>
            <div class="col-12">
              <MtFormRadiobtn
                v-model:selected="data.type_line_push_noti"
                class="q-mr-sm"
                label="使用しない"
                size="28px"
                type="radio"
                :val="1"
              />
              <MtFormRadiobtn
                v-model:selected="data.type_line_push_noti"
                class="q-mr-sm"
                label="一斉送信と個別の両方を使用"
                size="28px"
                type="radio"
                :val="2"
              />
              <MtFormRadiobtn
                v-model:selected="data.type_line_push_noti"
                class="q-mr-sm"
                label="個別のみ使用する"
                size="28px"
                type="radio"
                :val="3"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormCheckBox
                v-model:checked="data.flg_pps_toppage_display"
                label="myVetty 固定お知らせ表示"
              />  
            </div>
            <div class="col-6">
              <q-editor
                :toolbar="[
                  ['left', 'center', 'right', 'justify'],
                  ['bold', 'italic', 'strike', 'underline'],
                  ['link'],
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
                ref="memoPpsRefEditor"
                toolbar-bg="primary"
                toolbar-text-color="white"
                toolbar-toggle-color="accent-700"
                height="40vh"
                class="editor"
                v-model="data.memo_pps_toppage_info"
                @update:model-value="stripContent"
              >
                <template v-slot:token>
                  <q-color
                    @click="colorClicked()"
                    v-model="memoPpsEditorForeColor"
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
                {{ strippedContent.length }} / {{ CHAR_LIMIT }}
              </div>
            </div>
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">診察券</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              診察券で使用する背景画像を登録　※背景色がある場合には印刷に失敗する場合があります。また
              幅91mm x 高さ55mm ; 縦横比が正しい画像を登録してください。
            </span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-4 col-sm-12">
              <div class="text-center body1 regular text-grey-700 q-mb-sm">
                診察券画像
              </div>
              <div
                v-if="img_member_card_path"
                class="relative-position member-card-border"
              >
                <q-img
                  :src="img_member_card_path"
                  spinner-color="white"
                  class="full-width"
                />
                <q-badge
                  color="red"
                  floating
                  transparent
                  @click="removeImage('img_member_card_path')"
                  class="cursor-pointer"
                >
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
                @change="onFilePicked($event, 'img_member_card_path')"
                :rules="[aahValidations.validationRequired]"
              />
            </div>
          </div>
        </q-tab-panel>
        <q-tab-panel name="tab5" class="q-pa-none overflow-hidden">
          <!-- <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">診療カルテの表示設定</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              診療カルテで入力する対象項目を設定
            </span>
            <a href="/SearchMemoCarteSourceList" class="text-blue">
              <span class="caption1 regular q-mr-md">メモカルテ背景色</span>
            </a>
            <a href="/SearchMedEvaluationList" class="q-mr-md text-blue">
              <span class="caption1 regular">診療評価項目</span>
            </a>
            <a href="/SearchMedConditionList" class="text-blue">
              <span class="caption1 regular q-mr-md">診療評価項目の選択肢</span>
            </a>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <MtFormCheckBox
              v-for="(checkbox, index) in typeCarteConfigList"
              :key="index"
              v-model:checked="checkbox.checked"
              :disable="index === 5"
              :label="checkbox.label"
              class="col-3"
              @update:checked="checkedFlg($event, checkbox)"
            />
          </div> -->
          <!-- AI config  -->
          <!-- <hr class="light" /> -->
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">声カル設定</h4>
            <!-- <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              使用する対応歴を選択
            </span> -->
          </div>
          <div class="q-mb-xl">
            <MtFormCheckBox
              v-model:checked="data.flg_auto_memocarte_ai"
              label="AIカルテ生成後にカルテへ自動反映"
              class=""
              @update:checked="checkedFlg($event, checkbox)"
            />
            <!-- @update:checked="typeAutoIHChecked($event, checkbox)" -->
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">既往歴設定</h4>
            <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
              使用する対応歴を選択
            </span>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <MtFormCheckBox
              v-for="(checkbox, index) in typeAutoIHList"
              :key="`c-${index}`"
              v-model:checked="checkbox.checked"
              :label="checkbox.label"
              class="col-3"
              @update:checked="typeAutoIHChecked($event, checkbox)"
            />
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">メール設定</h4>
          </div>
          <div class="col-md-4 col-sm-6">
            <MtInputForm
              v-model="data.bcc_email"
              label="BCCメールアドレス"
              type="text"
            />
          </div>
          <hr class="light" />
          <div class="q-mb-sm">
            <h4 class="text-white bg-grey-600 title4">その他</h4>
          </div>
          <!-- <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                type="text"
                v-model="data.url_vr_html"
                label="Vrainers URL"
                readonly
              />
            </div>
          </div> -->
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                v-model="data.file_password"
                label="病院パスワード（日計等）"
                type="text"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-md-3 col-sm-6">
              <MtInputForm
                  v-model="data.pps_default_password"
                  label="myVettyデフォルトPW"
                  type="text"
                />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <MtInputForm
              v-model="data.flg_master_data_control"
              :items="[{ label: 'マスタデータコントロール' }]"
              type="checkbox"
            />
          </div>          
        </q-tab-panel>
      </q-tab-panels>
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

<style lang="scss" scoped>
.member-card-border {
  border: 5px solid rgb(197, 197, 197);
}

.editor {
  line-height: 1.7;
  word-break: break-all;
  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }

  :deep(.q-editor__content) {
    padding: 16px;
  }

  .color-picker {
    max-width: 20px;
    box-shadow: none;
    border-radius: 0;
  }
}

.grouped-col-input {
  :deep(.grouped-col-parts) {
    .q-field__control {
      height: 28px !important;
    }
    .hint {
      font-size: 12px;
      color: #666;
    }
  }
}
</style>
