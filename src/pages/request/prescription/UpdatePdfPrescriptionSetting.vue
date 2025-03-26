<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import GetPdfPrescriptionDescription from '@/pages/request/prescription/GetPdfPrescriptionDescription.vue'
import GetPdfPrescriptionPaperBag from '@/pages/request/prescription/GetPdfPrescriptionPaperBag.vue'
import ViewPetDetailModal from '@/pages/master/customerPet/ViewPetDetailModal.vue'
import PrescriptionPdfChoiceModal from '@/pages/request/prescription/PrescriptionPdfChoiceModal.vue'
import UpdatePrintCanvasModal from '@/pages/master/print/UpdatePrintCanvasModal.vue'
import useCategoryStore from '@/stores/categories'
import useItemStore from '@/stores/items'
import useDoseStore from '@/stores/dose-frequencies'
import useCommonStore from '@/stores/common'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'
import usePrintStore from '@/stores/prints'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import {
  comTypeDose,
  concatenate,
  dateFormat,
  decimalToFraction,
  getFullPetNameWithoutHonorific,
  getImage,
  isBitSet,
  roundZeroAfterPoint,
  typeDoseQuantityUI
} from '@/utils/aahUtils'
import { printingSetting, typeMedicineFormat, typePrint, typePrintBag, typePrintBagTitle } from '@/utils/enum'
import { numberFormat } from '@/utils/helper'
import prescriptionUtils from '@/pages/request/prescription/prescriptionUtils'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import { Category, PetType, PrescriptionDetailType, TextTemplateType } from '@/types/types'
import useTextTemplateStore from '@/stores/text-template'
import { paperBagAttributes } from '@/utils/pdfAttributes/paperBagDetails'
import ItemServiceDetailRow from '@/pages/request/prescription/component/ItemServiceDetailRow.vue'
import { getFractionForm } from './prescriptionUtils'

const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}

const categoryStore = useCategoryStore()
const templateStore = useTextTemplateStore()

const { getTemplates } = storeToRefs(templateStore)
const { getAllCategories } = storeToRefs(categoryStore)
const itemStore = useItemStore()
const { getAllItems } = storeToRefs(itemStore)
const doseStore = useDoseStore()
const { getDoses } = storeToRefs(doseStore)
const commonStore = useCommonStore()
const { getCommonUnitOptionList } =
  storeToRefs(commonStore)
const petsStore = usePetStore()
const { getPets } = storeToRefs(petsStore)
const customerStore = useCustomerStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const printStore = usePrintStore()
const { getAllPrints } = storeToRefs(printStore)
const clinicStore = useClinicStore()

const prescriptionDetailList = ref([])
let typePrintPaperbagItems = [11, 12, 13]
const typePrintOptions = [{label: '', value: null}, ...typePrint.filter((v) => typePrintPaperbagItems.includes(v.value))]
const commonUnitOptionList = ref([]), commonUnitOptionListDefault = reactive([]), 
  pdfTemplateOptions = ref([]), pdfTemplateOptionsDefault = reactive([])
const pdfTemplateKey = ref<number>(0)

const prescriptionPdfAttributes = reactive({
  description: {
    render: false
  },
  paperBag: {
    render: false
  }
})
let jsPDFData = {}
const flgPdfDirectDownload = ref(true)

const props = defineProps({
  prescription: Object
})

const data = ref({
  type_name: '5',
  flg_display_doses_taken: false,
  flg_display_classification_name: false,
  flg_show_image: false,
  flg_display_duration_use: false,
  flg_memo_dose_display: false,
  flg_display_memo_clinic_prep: false,
  flg_display_memo_efficacy: false,
  flg_display_memo_sideeffect: false,
  flg_display_doctor: false,
  flg_dosage_detail: false,
  flg_fraction: false,
  id_employee_doctor: props.prescription.id_employee_doctor,
  type_print: null,
  type_print_bag: 1,
  type_print_bag_title: 1,
  type_print_template: null,
  flg_print_all_in_one: false,
  date_start: props.prescription.date_start
})

const addTemplateModal = ref(false)
const indexSaved = ref(0)
const typeMemoSelected = ref(0)
const memoTemplates = ref<TextTemplateType[]>([])
const selectedPrinted = ref([])

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const dataDefaultFields = { ...data.value }
const pdfArrayBuffer = ref([])

const resetToDefault = () => {
  for (let key in dataDefaultFields) {
    data.value[key] = dataDefaultFields[key]
  }
}

function getPdIsuName(item: any) {
  let name_prescription_assort = []
  let fraction = []
  let isu_list = []
  if (
    item &&
    item.prescription_detail_assort_list &&
    item.prescription_detail_assort_list.length > 0
  ) {
    const assortList: any = item.prescription_detail_assort_list
    
    assortList.forEach((PA: any) => {
      let assort_ = {
        name_unit: null,
        fraction: null,
        val_decided: null,
        m_unit: null,
        pill_amount: `${calculatedTotalNumber(item)}回分`,
        dosage_detail: null,
        name_dose_formal: getNameDosageFormal(item.id_dosage_frequency)
      }
      
      if (PA.id_item_service_unit) {
        if (
          item &&
          item.item_service &&
          item.item_service.item_service_unit_list &&
          item.item_service.item_service_unit_list.length > 0
        ) {

          let unitAssort = item.item_service.item_service_unit_list.find((isu: any) => isu.id_item_service_unit == PA.id_item_service_unit)
          let commonUnit = useCommonStore().getCommonUnitOptionList.find((commonObj: any) => commonObj.value == unitAssort?.id_common)
          if (unitAssort) {
            let append_unit_name = ''
            append_unit_name = `(${roundZeroAfterPoint(PA.val_dosage_decided)} ${commonUnit.name_common}) `

            let temp_name = unitAssort.name_service_item_unit

            if (commonUnit && commonUnit.name_common) {
              temp_name = item.flg_etc1 ? unitAssort.name_service_item_unit + append_unit_name : unitAssort.name_service_item_unit
            }
            name_prescription_assort.push(temp_name)
            assort_.name_unit = temp_name
            assort_.m_unit = commonUnit.name_common
          }
        }
      }

      if (PA.val_dosage_decided && Number(PA.val_dosage_decided) > 0) {
        let temp_dosage = ''
        if (parseInt(Number(calculatedTotalNumber(item) * PA.val_dosage_decided)) > 0) {
          temp_dosage += parseInt(customRoundV1(Number(calculatedTotalNumber(item) * Number(PA.val_dosage_decided))))
        }
        
        temp_dosage += getFraction(calculatedTotalNumber(item), PA.val_dosage_decided)
        
        temp_dosage = `( ${temp_dosage} ${item.name_medicine_format} )`

        assort_.fraction = temp_dosage
        assort_.val_decided = PA.val_dosage_decided
        
        if(assort_.m_unit == '錠' || assort_.m_unit == 'ｶﾌﾟｾﾙ') {
          assort_.dosage_detail = `${getFractionForm(assort_.val_decided)}`
        } else {
          assort_.dosage_detail = ''+(parseFloat(assort_.val_decided).toFixed(2))
        }
        
        fraction.push(temp_dosage)
      }
      isu_list.push(assort_)
    })
    name_prescription_assort = name_prescription_assort.join(', ')

    let temp_array = fraction.join(', ')
    return { name_prescription_display: name_prescription_assort, fraction: temp_array, isu_list: isu_list }
  }

  return { name_prescription_display: item.name_prescription_display, fraction: '', isu_list: isu_list }
}

const getPrescriptionMedUnit = (item: {
  prescription_detail_assort_list: {
    id_item_service_unit: number
  }[],
  item_service: {
    item_service_unit_list: {
      id_common: number
    }[]
  }
}) => {
  if (
    item &&
    item.prescription_detail_assort_list &&
    item.prescription_detail_assort_list.length > 0 &&
    item.item_service &&
    item.item_service.item_service_unit_list &&
    item.item_service.item_service_unit_list.length > 0
  ) {
    const assortList = item.prescription_detail_assort_list
    let prescriptionMedUnit = ''

    assortList.forEach((assortItem) => {
      if (assortItem.id_item_service_unit) {
        const assortISU = item.item_service.item_service_unit_list.find(
          (isu: any) => 
            isu.id_item_service_unit === assortItem.id_item_service_unit
        )
        const commonUnit = useCommonStore().getCommonUnitOptionList.find(
          (commonObj: any) =>
            commonObj.value === assortISU?.id_common
        )
        if (commonUnit) {
          prescriptionMedUnit = commonUnit.name_common
        }
      }
    })

    return prescriptionMedUnit
  }
}

const getPrescriptionImageUnit = (item: {
  prescription_detail_assort_list: {
    id_item_service_unit: number
  }[],
  item_service: {
    item_service_unit_list: {
      id_common: number
    }[]
  }
}) => {
  if (
    item &&
    item.prescription_detail_assort_list &&
    item.prescription_detail_assort_list.length > 0 &&
    item.item_service &&
    item.item_service.item_service_unit_list &&
    item.item_service.item_service_unit_list.length > 0
  ) {
    const assortList = item.prescription_detail_assort_list
    let prescriptionImagePath = ''

    assortList.forEach((assortItem) => {
      if (assortItem.id_item_service_unit) {
        const assortISU = item.item_service.item_service_unit_list.find(
          (isu: any) => 
            isu.id_item_service_unit === assortItem.id_item_service_unit
        )
        if (assortISU) {
          prescriptionImagePath = assortISU.image_path
        }
      }
    })

    return prescriptionImagePath
  }
}

const getPrescriptionDetailName = (item: any, value: String) => {
  if(value == '1') {
    return item.original_name_prescription_display
  } else if(value == '2') {
    return item.name_category2
  } else if (value == '5') {
    return getPdIsuName(item).name_prescription_display
  }
  return item.original_name_prescription_display
}

const getTypeMedicineFormat = (item: Object) => {
  typeMedicineFormat.find(
    (format: any) => format.value === item.type_medicine_format
  )?.label
}
const getCategoryName = (value: any) =>
  getAllCategories.value.find(
    (category: any) => category.code_category === value
  )?.name_category
const getNameDosageFormal = (value: any) =>
  getDoses.value.find((item: any) => item.id_dosage_frequency === value)
    ?.name_dose_formal
const getQuanityDosage = (value: any) =>
  getDoses.value.find((item: any) => item.id_dosage_frequency == value)
    ?.quantity_dose ?? 1
const getMedicineData = (item: Object) => item?.item_service?.medicine ?? null

const isMultipleIsu = (item: Object) => {
  let count = 0

  if (item.prescription_detail_assort_list &&
    item.prescription_detail_assort_list.length &&
    item.prescription_detail_assort_list.length > 0) {
    return item.prescription_detail_assort_list.length
  }

  return 0
}

const getValDosageSelected = (item: Object) => {
  if (item.type_detail == 5) {
    return 1
  }
  
  if (
    item.prescription_detail_assort_list &&
    item.prescription_detail_assort_list.length &&
    item.prescription_detail_assort_list.length > 0
  ) {
    return item.prescription_detail_assort_list.reduce(
      (acc: number, item: Object) => {
        return acc + Number(item.val_dosage_decided)
      },
      0
    )
  }
  return 0
}

const getPet = (id_pet: number) =>
  useCustomerStore().getCustomer.pets.find((pet: PetType) => pet.id_pet == id_pet)
const getCustomer = (id_customer: number) => useCustomerStore().getCustomer

const submit = async (mode: string = 'description') => {
  if (mode === 'description') {
    prescriptionPdfAttributes.description.render = true
  } else {
    let checkedPrescriptions: any = prescriptionDetailList.value.filter(
      (v) => !!v.checked
    )
    if (
      checkedPrescriptions &&
      checkedPrescriptions.length &&
      checkedPrescriptions.length > 0
    ) {
      prescriptionPdfAttributes.paperBag.render = true
    }
  }
}

const confirmChoice = async (mode: string = 'description') => {
  if(mode != 'description' && data.value.type_print) return openPrintCanvasModal()
  const PDF: number = 1,
    PRINT_DIALOG: number = 2
  let popup: any = {
    confirmed: false,
    attr: {
      choice: 1
    }
  }
  await mtUtils.smallPopup(PrescriptionPdfChoiceModal, { popup })
  if (popup.confirmed) {
    const {
      attr: { choice }
    } = popup
    if (choice === PDF) flgPdfDirectDownload.value = true
    else if (choice === PRINT_DIALOG) flgPdfDirectDownload.value = false
    submit(mode)
  }
}

const updatePrescriptionDetailName = (value: string) => {
  prescriptionDetailList.value.forEach((item: any) => {
    item.name_prescription_display = getPrescriptionDetailName(item, value)
  })
  changeSettings()
}

const calculatedTotalNumber = (prescriptionDetail: any) => {
  return (
    parseFloat(Number(prescriptionDetail.total_days_dose)) * (Number(getQuanityDosage(prescriptionDetail.id_dosage_frequency)) ?? 1)
  )
}

const openViewPetDetailModal = async () => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_pet: props.prescription.id_pet,
    id_customer: props.prescription.id_customer
  })
}

const selectDefaultEmployee = () => {
  data.value.id_employee_doctor = defaultEmployee
}

const openAddTextTemplateModal = async (index: number, value: number) => {
  indexSaved.value = index
  typeMemoSelected.value = value
  await templateStore.fetchTemplates({ type_text_template: value })

  memoTemplates.value = getTemplates.value.filter((template) => {
    return template.type_text_template === value
  }).map((template: any) => {
    return {
      title: template.memo_template,
      flg_title: template.flg_title,
      attr: {
        class: template.flg_title ? 'bg-grey-300' : ''
      },
      isSelected: false
    }
  })

  addTemplateModal.value = true
}

const handleUpdateMemo = (value: string, type: number) => {
  if (type === 42) {
    prescriptionDetailList.value[indexSaved.value].memo_dose = `${prescriptionDetailList.value[indexSaved.value].memo_dose} ${value}`
    return
  }
  if (type === 43) {
    prescriptionDetailList.value[indexSaved.value].memo_efficacy = `${prescriptionDetailList.value[indexSaved.value].memo_efficacy} ${value}`
    return
  }
  if (type === 44) {
    prescriptionDetailList.value[indexSaved.value].memo_alert = `${prescriptionDetailList.value[indexSaved.value].memo_alert} ${value}`
    return
  }
}

const handleUpdatePrintOption = async (val: number) => {
  if(!val) {
    data.value.type_print_template = data.value.type_print_bag = data.value.type_print_bag_title = null
    return
  }  
  await printStore.fetchPrints({type_print: val})
  data.value.type_print_template = null
  pdfTemplateOptions.value.length = pdfTemplateOptionsDefault.length = 0
  pdfTemplateOptions.value = getAllPrints.value.map((v) => ({
    label: v.name_print,
    value: v.type_print
  }))
  pdfTemplateOptionsDefault.push(...pdfTemplateOptions.value)
  if(pdfTemplateOptionsDefault.length > 0) data.value.type_print_template = pdfTemplateOptionsDefault[0].value
  ++pdfTemplateKey.value
}

const openPrintCanvasModal = async () => {
  if(!data.value.type_print_template) return mtUtils.alert('テンプレートを選択してください。')
  const print = printStore.getAllPrints.find((print) => print.type_print === data.value.type_print_template)
  const printId: number | undefined = print ? print.id_print : undefined
  await initScripts()
  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [28] }),
    printStore.selectPrint(printId)
  ])
  if(printStore.getPrint && Object.keys(printStore.getPrint).length > 0){
    const printData = {...printStore.getPrint}
    try {
      const binaryString = atob(printStore.getPrint.pdf_path)
      const arrayBuffer = new ArrayBuffer(printData.pdf_path.length)
      pdfArrayBuffer.value = arrayBuffer
      const uint8Array = new Uint8Array(arrayBuffer)
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i)
      }  
      printData.pdf_path = new Blob([uint8Array], {
        type: 'application/pdf'
      })  
    }
    catch(e) {}

    const width: number = 148, height: number = 210
    const dataToRender = await getPdfMappingJson()

    await mtUtils.popup(UpdatePrintCanvasModal, {
      data: printData,
      pdfData: pdfArrayBuffer.value,
      canvasWidth: printData.flg_landscape ? height : width,
      canvasHeight: printData.flg_landscape ? width : height,
      dataToRender: dataToRender,
      hideRightButtons: false,
      renderDirectly: true,
      rightBoxButtons: paperBagAttributes
    })
  }
}

const initScripts = async () => {
  const scripts = [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/4.5.0/fabric.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.2.0/jspdf.umd.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      integrity: ''
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
      integrity: ''
    },
    {
      src: '  https://printjs-4de6.kxcdn.com/print.min.js',
      integrity: ''
    }
  ]
  scripts.forEach((scriptObj) => {
    let script = document.createElement('script')
    script.src = scriptObj.src
    if (scriptObj.integrity !== '') {
      script.integrity = scriptObj.integrity
    }
    script.crossOrigin = 'anonymous'
    script.referrerPolicy = 'no-referrer'
    document.body.appendChild(script)
  })
}

const getPdfMappingJson = async () => {
  const currentClinic = await clinicStore.fetchClinicById(
    props.prescription?.id_clinic
  )
  const pdfMappingJson = { }
  pdfMappingJson.id_request = props.prescription?.request
  pdfMappingJson.id_clinic = currentClinic
  pdfMappingJson.id_pet = customerStore.getCustomer.pets.find((v) => v.id_pet === props.prescription.id_pet)
  pdfMappingJson.id_customer = customerStore.getCustomer
  pdfMappingJson.id_paper_bag = { prescription:
    {
      ...props.prescription,
      prescription_detail_list: prescriptionDetailList.value.map((v) => ({
       ...v,
       dose_frequency: roundZeroAfterPoint(v.total_days_dose) + comTypeDose(typeDoseQuantityUI(v.id_dosage_frequency).typeDoseUI) +
                    ' x 頻度 ' + ' ' + v.name_dose_formal ?? '',
       total_amount: `${quantityDose(v)} 回分`
    }))
  }
  }
  return pdfMappingJson
}

const changeSettings = (value: boolean = false, binary: number = 0) => {
  // Binary code and label can be founded on enum.ts file
  if (binary != 0) {
    if (value) selectedPrinted.value.push(binary)
    else selectedPrinted.value = selectedPrinted.value.filter(v => v != binary)
  }

  const settings = {
    binary: selectedPrinted.value.reduce((acc, val) => acc | val, 0).toString(),
    additional: {
      type_name: data.value.type_name,
      type_print_bag_title: data.value.type_print_bag_title
    }
  }

  localStorage.setItem('setting_printing', JSON.stringify(settings))
  checkSettings()
}
const checkSettings = () => {
  if (localStorage.getItem('setting_printing')) {
    const settings = JSON.parse(localStorage.getItem('setting_printing'))

    if (settings) {
      printingSetting
      .filter((v) => isBitSet(parseInt(settings.binary), v.binaryValue))
      .forEach(v => {
        if (!['type_name', 'type_print_bag_title'].includes(v.field))
          data.value[v.field] = true
      })

      if (settings.additional?.type_name) data.value.type_name = settings.additional.type_name
      if (settings.additional?.type_print_bag_title) data.value.type_print_bag_title = settings.additional.type_print_bag_title
    }
  }
}
const quantityDose = (prescriptionDetail: any) =>  {
  return roundZeroAfterPoint(prescriptionDetail.total_days_dose) * typeDoseQuantityUI(prescriptionDetail.id_dosage_frequency).quantity_dose ?? 1
}

const getCategoriesName = (prescriptionDetail: any) => {
  let categoryName1 = getAllCategories.value.find((category: Category) => category.id_category === prescriptionDetail.id_category1)?.name_category
  let categoryName2 = getAllCategories.value.find((category: Category) => category.id_category === prescriptionDetail.id_category2)?.name_category
  return concatenate(categoryName1, categoryName2)
}
const getFraction = (totalDosage, row) => {

  const totalPill = Number(totalDosage) * Number(row)
  if (customRound(totalPill) - parseInt(customRound(totalPill)) > 0) {

    if (parseInt(totalPill) > 0) {
      return ` +  ${decimalToFraction(totalPill - parseInt(totalPill))}`
    }

    return `${decimalToFraction(totalPill - parseInt(totalPill))}`
  }
  return ''
}

function customRound(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.90) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.10) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}


function customRoundV1(number) {
  // Separate the integer and decimal parts
  const integerPart = Math.floor(number)
  const decimalPart = number - integerPart

  // Check if decimal part is 0.85 or higher
  if (decimalPart >= 0.75) {
    return Math.ceil(number) // Round up to the next integer
  } else if (decimalPart <= 0.10) {
    return Math.floor(number) // Round down to the previous integer
  } else {
    // Otherwise, round to the nearest tenth
    return Math.round(number * 10) / 10
  }
}

onMounted(async () => {
  let promises: any = []
  if (getDoses.value.length === 0) promises.push(doseStore.fetchDoses())
  if (commonStore.getCommonUnitOptionList.length === 0)
    promises.push(commonStore.fetchPreparationCommonList({ code_common: [4] }))
  promises.push(itemServiceUnitStore.fetchItemServiceUnits())
  await Promise.all(promises)
  if (commonStore.getCommonUnitOptionList.length > 0) {
    commonUnitOptionList.value = [...commonStore.getCommonUnitOptionList]
    commonUnitOptionListDefault.push(...commonUnitOptionList.value)
  }
  
  if (!localStorage.getItem('setting_printing')) {
    const initSettings = {
      binary: '4095',
      additional:  {
        type_name: data.value.type_name,
        type_print_bag_title: data.value.type_print_bag_title
      }
    }
    localStorage.setItem('setting_printing', JSON.stringify(initSettings))
  }
  const settings = JSON.parse(localStorage.getItem('setting_printing'))
  if (settings) {
    selectedPrinted.value = printingSetting.filter((v) => isBitSet(parseInt(settings.binary), v.binaryValue)).map(v => v.binaryValue)
    data.value.type_name = settings.additional?.type_name
    data.value.type_print_bag_title = settings.additional?.type_print_bag_title
    checkSettings()
  }

  if (
    props.prescription &&
    props.prescription.prescription_detail_list &&
    props.prescription.prescription_detail_list.length > 0
  ) {
    await props.prescription.prescription_detail_list
      .filter((v: any) => !(v.flg_etc1 && v.id_prescription_detail_ref))
      .map(async (item: any) => {
        let tempObj: any = {
          ...item,
          checked: !(
            Boolean(item.flg_hospitalization_usage) ||
            item.id_prescription_detail_ref
          ),
          val_dosage_selected: getValDosageSelected(item),
          name_dose_formal: getNameDosageFormal(item.id_dosage_frequency),
          quantity_dose: getQuanityDosage(item.id_dosage_frequency),
          memo_efficacy: getMedicineData(item)?.memo_efficacy,
          memo_sideeffect: getMedicineData(item)?.memo_sideeffect,
          medicine_format_name: getTypeMedicineFormat(item),
          name_medicine_unit: getPrescriptionMedUnit(item),
          original_name_prescription_display: item.name_prescription_display,
          name_prescription_display: getPrescriptionDetailName(
            item,
            data?.value?.type_name ?? '5'
          ),
          image_path1: getPrescriptionImageUnit(item),
          image_path1_pdf: await getImage(getPrescriptionImageUnit(item)),
          memo_alert: item?.memo_alert,
          name_classification: getCategoriesName(item),
          duration: `服用 ${dateFormat(item.date_start)} ~ (${
            item.total_days_dose ? Number(item.total_days_dose) : 0
          }日間)`,
          type_detail: item.type_detail,
          multipleISU: isMultipleIsu(item) > 1,
          fraction: getPdIsuName(item).fraction,
          isu_list: getPdIsuName(item).isu_list
        }

        tempObj.calculatedAmount = calculatedTotalNumber(item)

        prescriptionDetailList.value.push(tempObj)
        return tempObj
      })
  }

  prescriptionDetailList.value.forEach((item) => {
    if (
      item.name_medicine_format === '粉A' ||
      item.name_medicine_format === '粉B'
    ) {
      // if item.flg_group_title
      item.name_medicine_format = '包'
      item.val_dosage_selected = '1'
      item.ui_text = ''
      // else
      item.prescription_detail_assort_list.forEach((assort, assortIdx) => {
        item.isu_list[assortIdx].m_unit = '包'
        item.isu_list[assortIdx].dosage_detail = '1'
        item.isu_list[assortIdx].fraction = ''
      })
    } else if (item.name_medicine_format === '液状') {
      item.prescription_detail_assort_list.forEach((assort, assortIdx) => {
        item.isu_list[assortIdx].pill_amount = ''
        item.isu_list[assortIdx].fraction = ''

        if (item.isu_list[assortIdx].dosage_detail.toString().includes('.')) {
          let [beforeDecimalPoint, afterDecimalPoint] = item.isu_list[
            assortIdx
          ].dosage_detail
            .toString()
            .split('.')
          beforeDecimalPoint = numberFormat(beforeDecimalPoint).trim()
          if (afterDecimalPoint.length >= 3) {
            afterDecimalPoint = afterDecimalPoint.substring(0, 4)
          }
          if (Number(afterDecimalPoint)) {
            item.isu_list[
              assortIdx
            ].dosage_detail = `${beforeDecimalPoint}.${afterDecimalPoint}`
          }
          if (
            afterDecimalPoint.includes(',') &&
            Number(afterDecimalPoint.replace(',', ''))
          ) {
            item.isu_list[
              assortIdx
            ].dosage_detail = `${beforeDecimalPoint}.${afterDecimalPoint.replace(
              ',',
              ''
            )}`
          }

          item.isu_list[assortIdx].dosage_detail = `${beforeDecimalPoint}`
        }
      })
    }
  })
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2">
        <span class="title2 bold">印刷設定 </span>
        <span class="q-ml-md">診察券番号: {{ props.prescription.number_prescription }}</span>
        <q-btn
          flat
          class="bg-accent-200 text-grey-900 q-ml-md cursor-pointer"
          @click="openViewPetDetailModal"
        >
          {{
            getFullPetNameWithoutHonorific(
              getPet(props.prescription.id_pet),
              getCustomer(props.prescription.id_customer)
            )
          }}
        </q-btn>
      </q-toolbar-title>
      <q-btn
        outline
        class="bg-grey-100 text-grey-800 q-mr-md"
        @click="resetToDefault"
      >
        <q-icon name="turn_left" size="20px" class="q-mr-sm" />
        <span>初期設定に戻す</span>
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-2">
          <span class="field-label-free-color bg-grey-200 text-grey-900">
            全体設定
          </span>
        </div>
        <div class="col-10">
          <div class="row q-col-gutter-md">
            <div class="col-auto q-mr-lg">
              <MtFormCheckBox
                type="checkbox"
                label="まとめて印刷"
                v-model:checked="data.flg_print_all_in_one"
                @update:checked="changeSettings($event, 1)"
              />
            </div>
            <div class="col-2">
              <MtFormInputDate
                type="date"
                label="処方日"
                v-model:date="data.date_start"
              />
            </div>
            <div class="col-6">
              <MtFormInputText
                type="text"
                label="処方箋メモ（説明書下部に表示）"
                v-model="props.prescription.memo_prescription"
                autogrow
              />
            </div>
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-2">
          <span class="field-label-free-color bg-grey-200 text-grey-900">
            表示医薬品名
          </span>          
        </div>
        <div class="col-auto">
          <MtFormRadiobtn
            v-model:selected="data.type_name"
            label="品名包装単位名"
            type="radio"
            val="5"
            @update:selected="updatePrescriptionDetailName"
          />
        </div>
        <div class="col-auto">
          <MtFormRadiobtn
            type="radio"
            label="医薬品名を表示"
            v-model:selected="data.type_name"
            @update:selected="updatePrescriptionDetailName"
            val="1"
          />
        </div>
        <div class="col-auto">
          <MtFormRadiobtn
            type="radio"
            label="分類名"
            v-model:selected="data.type_name"
            @update:selected="updatePrescriptionDetailName"
            val="2"
          />
        </div>
        <div class="col-auto">
          <MtFormRadiobtn
            type="radio"
            label="非表示"
            v-model:selected="data.type_name"
            @update:selected="updatePrescriptionDetailName"
            val="3"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-2">
          <span class="field-label-free-color bg-grey-200 text-grey-900">
            表示項目
          </span>
        </div>
        <div class="col-10">
          <div class="row q-col-gutter-md">
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="写真"
                v-model:checked="data.flg_show_image"
                @update:checked="changeSettings($event, 4)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="薬剤分類名"
                v-model:checked="data.flg_display_classification_name"
                @update:checked="changeSettings($event, 8)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="服用期間"
                v-model:checked="data.flg_display_duration_use"
                @update:checked="changeSettings($event, 16)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="服用回数"
                v-model:checked="data.flg_display_doses_taken"
                @update:checked="changeSettings($event, 32)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="服用メモ"
                v-model:checked="data.flg_memo_dose_display"
                @update:checked="changeSettings($event, 64)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="効果効能"
                v-model:checked="data.flg_display_memo_efficacy"
                @update:checked="changeSettings($event, 128)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="注意事項"
                v-model:checked="data.flg_display_memo_sideeffect"
                @update:checked="changeSettings($event, 256)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="担当医"
                v-model:checked="data.flg_display_doctor"
                @update:checked="changeSettings($event, 512)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="一回服用分"
                v-model:checked="data.flg_dosage_detail"
                @update:checked="changeSettings($event, 2048)"
              />
            </div>
            <div class="col-auto">
              <MtFormCheckBox
                type="checkbox"
                label="総数"
                v-model:checked="data.flg_fraction"
                @update:checked="changeSettings($event, 4096)"
              />
            </div>
            <div class="col-2" v-if="data.flg_display_doctor">
              <InputEmployeeOptGroup
                v-model="data.id_employee_doctor"
                type-occupation="doctor"
                label="担当医"
                show-select-default-employee
                @update:select-default-employee="selectDefaultEmployee"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-2">
          <span class="field-label-free-color bg-grey-200 text-grey-900">
            薬袋設定 (調整中)
          </span>
        </div>
        <div class="col-10">
          <div class="row q-col-gutter-md">
            <div class="col-2">
              <MtFormPullDown
                :options="typePrintOptions"
                label="薬袋サイズ"
                v-model:selected="data.type_print"
                @update:selected="handleUpdatePrintOption"
              />
            </div>
            <div class="col-2" v-if="data.type_print">
              <MtFilterSelect
                label="薬袋テンプレート"
                :options="pdfTemplateOptions"
                :options-default="pdfTemplateOptionsDefault"
                v-model:selecting="data.type_print_template"
                :key="pdfTemplateKey"
              />  
            </div>
            <template v-if="!(typePrintPaperbagItems.includes(data.type_print))">
              <div class="col-2">
                <MtFormPullDown
                  :options="typePrintBag"
                  label="仕様設定"
                  v-model:selected="data.type_print_bag"
                />
              </div>
              <div class="col-2">
                <MtFormPullDown
                  :options="typePrintBagTitle"
                  label="薬袋タイトル"
                  v-model:selected="data.type_print_bag_title"
                  @update:selected="changeSettings()"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
      <div>
        <template
          v-for="(item, idx) in prescriptionDetailList"
          :key="`${idx}-${item.id_prescription_detail}`"
        >
          <template v-if="item.flg_group_title">
            <div class="flex items-center">
              <MtFormCheckBox type="checkbox" v-model:checked="item.checked" />
              <div
                class="row items-center q-pa-md prescription-detail relative-position"
                :class="!item.checked ? 'unselected' : ''"
              >
                <div class="text-weight-bold body1">
                  {{ item.original_name_prescription_display }}
                </div>
              </div>
            </div>
            <div v-if="item.type_detail == 5"
              :class="!item.checked ? 'unselected' : ''"
              class="row q-col-gutter-md q-mt-xs q-ml-lg"
            >
              <div v-if="data.flg_show_image" class="col-3">
                <div
                  v-if="item.image_path1"
                  class="pd-image flex items-center justify-center"
                >
                  <img :src="item.image_path1" />
                </div>
                <div
                  v-else
                  class="flex justify-center items-center full-height"
                >
                  画像なし
                </div>
              </div>
              <div :class="data.flg_show_image ? 'col-9' : 'col-12'">
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col-4">
                    <MtFormInputText
                      v-model="item.name_prescription_display"
                      :disable="data.type_name == '3'"
                      label="表示名"
                    />
                  </div>
                  <div class="col-4">
                    <MtFormInputText
                      v-model="item.name_dose_formal"
                      :disable="!data.flg_display_doses_taken"
                      label="服用頻度"
                    />
                  </div>
                  <div class="col-4">
                    <MtFormInputNumber
                      v-model:value="item.calculatedAmount"
                      label="総服用回数"
                      mode="dosage"
                    />
                  </div>
                </div>
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col-4">
                    <MtFormInputText
                      v-model="item.val_dosage_selected"
                      label="1回量"
                    />
                  </div>
                  <div class="col-4">
                    <MtFilterSelect
                      v-model:selecting="item.name_medicine_format"
                      option-value="name_common"
                      :options="commonUnitOptionList"
                      :options-default="commonUnitOptionListDefault"
                      label="単位"
                    />
                  </div>
                  <div class="col-4">
                    <MtFormInputText v-model="item.ui_text" label="その他" />
                  </div>
                </div>
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col-4">
                    <MtFormInputText
                      v-model="item.name_classification"
                      :disable="!data.flg_display_classification_name"
                      label="薬剤分類名を表示"
                    />
                  </div>
                  <div class="col-4">
                    <MtFormInputText
                      v-model="item.duration"
                      :disable="!data.flg_display_duration_use"
                      label="服用期間を表示"
                    />
                  </div>
                </div>
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col">
                    <MtInputForm
                      v-model="item.memo_dose"
                      :disable="!data.flg_memo_dose_display"
                      label="服用メモ"
                      type="text"
                      autogrow
                    >
                      <template #append>
                        <q-icon
                          class="cursor-pointer"
                          name="add"
                          @click="openAddTextTemplateModal(idx, 42)"
                        />
                      </template>
                    </MtInputForm>
                  </div>
                </div>
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col">
                    <MtInputForm
                      v-model="item.memo_efficacy"
                      :disable="!data.flg_display_memo_efficacy"
                      label="効果効能"
                      type="text"
                      autogrow
                    >
                      <template #append>
                        <q-icon
                          class="cursor-pointer"
                          name="add"
                          @click="openAddTextTemplateModal(idx, 43)"
                        />
                      </template>
                    </MtInputForm>
                  </div>
                </div>
                <div class="row q-col-gutter-md q-mb-sm">
                  <div class="col">
                    <MtInputForm
                      v-model="item.memo_alert"
                      :disable="!data.flg_display_memo_sideeffect"
                      label="注意事項"
                      type="text"
                      autogrow
                    >
                      <template #append>
                        <q-icon
                          class="cursor-pointer"
                          name="add"
                          @click="openAddTextTemplateModal(idx, 44)"
                        />
                      </template>
                    </MtInputForm>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center q-ml-lg">
              <MtFormCheckBox type="checkbox" class="q-mr-md" v-model:checked="item.checked" />
              <div
                class="row items-center prescription-detail relative-position q-pl-md"
                :class="!item.checked ? 'unselected' : ''"
              >
                <span
                  v-if="item.flg_hospitalization_usage"
                  class="field-label-free-color bg-emerald-green text-dark-emerald-green"
                  >
                    院内
                </span>
                <div class="text-weight-bold body2 text-grey-900">
                  {{ item.original_name_prescription_display }}
                  <q-btn
                    class="text-grey-700 quiz-btn"
                    flat
                    icon="quiz"
                    round
                    size="14px"
                    @click="
                      prescriptionUtils.openItemServiceModal(
                        item.item_service.id_item_service
                      )
                    "
                  />
                </div>
                <div class="text-center absolute-center">
                  <span class="q-ml-lg"
                    ><small class="text-grey-700 q-mr-sm">処方時形状</small
                    >{{ item.medicine_format_name }}</span
                  >
                </div>
              </div>
            </div>
            <div
              class="row q-col-gutter-md q-mt-xs q-ml-lg"
              :class="!item.checked ? 'unselected' : ''"
            >
              <ItemServiceDetailRow :data="data" :prescriptionDetail="item" :idx="idx" :openAddTextTemplateModal="openAddTextTemplateModal" />
            </div>
          </template>
        </template>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          @click="confirmChoice('bag')"
        >
          <span>薬袋印刷</span>
        </q-btn>
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          @click="confirmChoice()"
        >
          <span>説明書印刷</span>
        </q-btn>
      </div>
    </q-card-section>
    <GetPdfPrescriptionDescription
      v-if="prescriptionPdfAttributes.description.render"
      :resultList="prescriptionDetailList.filter((v) => !!v.checked)"
      :prescriptionHeader="props.prescription"
      :pdfSettingsData="{ ...data }"
      :jsPDFData="jsPDFData"
      :getPet="getPet"
      :getCustomer="getCustomer"
      :prescriptionPdfAttributes="prescriptionPdfAttributes"
      :flgPdfDirectDownload="flgPdfDirectDownload"
    />

    <GetPdfPrescriptionPaperBag
      v-if="prescriptionPdfAttributes.paperBag.render"
      :prescriptionDetailList="
        prescriptionDetailList.filter((v) => !!v.checked)
      "
      :prescriptionHeader="props.prescription"
      :pdfSettingsData="{ ...data }"
      :jsPDFData="jsPDFData"
      :getPet="getPet"
      :getCustomer="getCustomer"
      :prescriptionPdfAttributes="prescriptionPdfAttributes"
      :flgPdfDirectDownload="flgPdfDirectDownload"
    />

    <AddTextTemplateModal
      v-model:value="addTemplateModal"
      modelTitle="処方箋説明書"
      :options="memoTemplates"
      :data="prescriptionDetailList"
      :single-option="true"
      @update:memo="(value) => handleUpdateMemo(value, typeMemoSelected)"
    />
  </q-form>
</template>

<style lang="scss" scoped>
.prescription-detail {
  flex: 1;
  min-height: 36px;
  background-color: rgba(190, 204, 238, 0.3);
  &.unselected {
    background-color: $grey-400;
    border-left: 3px solid $grey-700;
  }
}
.pd-image {
  height: 100%;
  width: 100%;
  border: 1px solid #000;
  img {
    max-width: 75%;
    max-height: 75%;
  }
}
.unselected {
  background-color: $grey-400;
}
</style>
