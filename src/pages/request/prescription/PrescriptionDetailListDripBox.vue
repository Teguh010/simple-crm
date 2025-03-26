<script setup lang="ts">
import mtUtils from '@/utils/mtUtils'
import useItemStore from '@/stores/items'
import useCategoryStore from '@/stores/categories'
import selectOptions from '@/utils/selectOptions'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import { computed, onMounted, ref } from 'vue'
import usePrescriptionStore from '@/stores/prescription'
import useCustomerStore from '@/stores/customers'
import aahValidations from '@/utils/aahValidations'
import { groupBy, random } from 'lodash'
import PrescriptionDetailAssortListBox from '@/pages/request/prescription/PrescriptionDetailAssortListBox.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { calculateDate, concatenate, roundZeroAfterPoint } from '@/utils/aahUtils'
import useDoseStore from '@/stores/dose-frequencies'
import MtModalHeader from '@/components/MtModalHeader.vue'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import { typeBodyWeightUnit, typeMedicineFormat } from '@/utils/enum'

const prescriptionStore = usePrescriptionStore()
  const customerStore = useCustomerStore()
  const categoryStore = useCategoryStore()
  const itemStore = useItemStore();

  const doseStore = useDoseStore()

  const props = defineProps({
    item: <any>[],
    index: Object,
  })
  
  const emits = defineEmits(['removeItem', 'checkSuggestionResponse'])
  
  const getFormData = () => {
    prescriptionDetailForm.value.prescription_detail_assort_list =
      Object.values(childFormRefs.value)
        .map(childForm => childForm.getFormData())
        .filter(formData => formData !== null);
    if(prescriptionDetailForm.value.type_medicine_dosage == 2){
      if (val_total_efficacyingredient.value > calculatedEfficacy.value){
        prescriptionDetailForm.value.flg_overdosing = true
      }
    }
    return prescriptionDetailForm.value;
  }
  
 
  defineExpose({
    getFormData
  });
  
  const isQuantityAvailable = ref(true)
  const dosageFrequencyList  = ref<any>([])
  const typeDoseUI = ref(1)
  const medicineObj = ref<any>({
    id_dosage_frequency_1 : null,
    id_dosage_frequency_2 : null,
    id_dosage_frequency_3 : null,
  })
  const itemServiceUnitList : any = ref([])
  const dosageFixedList : any = ref([])
  const dosageFixedListByGroup : any = ref({})
  const dosageVariableRes : any = ref([])
  const dosageVariableRange : any = ref(null)
  const dosageVariableRangeUnit : any = ref()
  const dosageVariableRangeValue : any = ref({
    min:0,
    max:0
  })
  const calculatedEfficacy = ref(null)
  const itemServiceUnitD = ref(false)
  const prescriptionDetailForm = ref({
    id_prescription:null,
    id_prescription_detail: null,
    id_item_service:null,
    type_medicine_dosage:'1',
    dosage_frequency_UI:'1',
    id_dosage_frequency:null,
    total_days_dose:null,
    memo_dose:null,
    date_start:null,
    date_end:null,
    type_medicine_format_ui: '1',
    memo_alert:null,
    memo_clinic_prep:null,
    flg_non_charge:false,
    id_category1:null,
    id_category2:null,
    efficacy_per_kg:'',
    prescription_detail_assort_list : <any>[],
    val_efficacy_strength_doctor:null,
    val_total_efficacyingredient:null,
    id_pet:null,
    dosage_frequency_CB_UI:false,
    flg_overdosing : false,
    name_medicine_format: null,
    id_clinic: JSON.parse(localStorage.getItem('clinic'))?.id_clinic,
    fe_division: {
      pill_division: []
    },
  })

const commonTypeAnimalOptionList: any = ref([])

const pillDivisionList: any = ref([])
  
  const feDivision = ref({
    fe_use : false,
    pill_division: []
  })
  
  const toggleDivision = ref(false)
  const quantity_dose = ref(0)
  const childFormRefs = ref([]);
  const filteredDoseOptionList = ref([])
  
  const disable_dosage_frequency_UI = ref(false)
  const comTypeDose = computed(()=> {
    if(typeDoseUI.value == '1'){
      return '日'
    }
    if(typeDoseUI.value == '2'){
      return '週'
    }
    if(typeDoseUI.value == '3'){
      return 'ヵ月'
    }
    if(typeDoseUI.value == '10' || typeDoseUI.value == '99'){
      return '回分'
    }
    return '日'
  })
  const comTypeFreeUI = computed(()=>{
    if(typeDoseUI.value == '1'){
      return  '回/日'
    }
    if(typeDoseUI.value == '2'){
      return '回/週'
    }
    if(typeDoseUI.value == '3'){
      return '回/月'
    }
    if(typeDoseUI.value == '10' || typeDoseUI.value == '99'){
      return '回分'
    }
    return ''
  })
  const totalDoseUI = computed(()=> {
    if(typeDoseUI.value == '1'){
      return 'total-days-dose-icon-default'
    }
    if(typeDoseUI.value == '2'){
      return 'total-days-dose-icon-week'
    }
    if(typeDoseUI.value == '3'){
      return 'total-days-dose-icon-month'
    }
    if(typeDoseUI.value == '10' || typeDoseUI.value == '99'){
      return 'total-days-dose-icon-demand'
    }
    return 'total-days-dose-icon-default'
  })

const categoryName = (value: any) => categoryStore.getAllCategories.find((v) => v.value === value)?.label;
  const getItem = (value: string) => itemStore.getAllItems.find((v:any) => v.id_item_service == value)
  const getTypeMedicineFormat = (value:any) => typeMedicineFormat.find((v:any)=> v.value === value)?.label

  const efficacyCalculation = computed(()=> {
    const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(prescriptionDetailForm.value.id_pet)
    calculatedEfficacy.value = roundZeroAfterPoint( (prescriptionHeader?.val_weight / 1000) * prescriptionDetailForm.value?.val_efficacy_strength_doctor)
    if (prescriptionDetailForm.value.type_medicine_dosage == '3'){
      calculatedEfficacy.value = roundZeroAfterPoint( 1 * prescriptionDetailForm.value?.val_efficacy_strength_doctor)
      return concatenate('1',
        '(kg) x ', roundZeroAfterPoint(prescriptionDetailForm.value.val_efficacy_strength_doctor),' = ',
        (calculatedEfficacy.value),'mg')
    }
    return concatenate(roundZeroAfterPoint((prescriptionHeader?.val_weight / 1000)),
      '(kg) x ', roundZeroAfterPoint(prescriptionDetailForm.value.val_efficacy_strength_doctor),' = ',
      (calculatedEfficacy.value),'mg')
  })
  
  const feDivisionFlgCount = computed(()=> {
    return Object.entries(feDivision.value?.pill_division).reduce((count, [key, value]) => {
      if ( key == 'fe_use') {
        return count;
      }
      return value.flg_func1 == true ? count + 1 : count;
    }, 0)
  })

  const calculatedTotalDosage = computed(()=> {
    if (quantity_dose.value)
      return roundZeroAfterPoint(prescriptionDetailForm.value.total_days_dose) * quantity_dose.value  ?? 1
    return 1
  })
  
  const val_total_efficacyingredient = ref(assignComputedProperty())

  const assortUnitUi = computed(()=>{
    if(prescriptionDetailForm.value.prescription_detail_assort_list && prescriptionDetailForm.value.prescription_detail_assort_list.length > 0){
      return `${useCommonStore().getCommonUnitOptionList.find((commonObj: any) => commonObj.value ==
        prescriptionDetailForm.value.prescription_detail_assort_list[0].id_cm_unit_medicine)?.label}`
    }
    return ''
  })
  
  function assignComputedProperty(){
    return computed(()=> {
      const formValues = Object.values(childFormRefs.value)
        .map(childForm => childForm.getFormData())
        .filter(formData => formData !== null);

      return formValues.reduce((sum, formData) => {
        const efficacy = formData.val_efficacyingredient || 0;
        const dosage = formData.val_dosage_decided || formData.val_dosage_suggested || 0;
        return sum + (efficacy * dosage);
      }, 0);
    })
  }

const efficacyPetKg = computed(() => {
  return val_total_efficacyingredient.value / prescriptionDetailForm?.value?.val_weight
})
  
  const checkPerHeadAvailable = computed(()=> {
    const perHead = dosageVariableRes.value.find((dosVa:any)=> dosVa.type_body_weight_unit == 3 &&
      (!dosVa.id_common || dosVa.id_common == customerStore.getPet?.id_common))
    if (perHead){
      return true
    }
    return false
  })

function selectedTypeMedicineFormat(value) {
  if (!value) {
    prescriptionDetailForm.value.name_medicine_format = ''
    return
  }
  prescriptionDetailForm.value.name_medicine_format = useCommonStore().getCommonTypeMedicineFormatOptionList.find((v: any) => v.id_common == value)?.name_common
}
  
  async function selectedTypeMedicine (value:any){
    if (value == 2) {
      applyDefaultSetting(true)
    }
   
   prescriptionDetailForm.value.prescription_detail_assort_list = []
   dosageVariableRange.value = null
    prescriptionDetailForm.value.flg_overdosing = false
   filteredDoseOptionList.value = doseStore.getAllDoses

    if(value == 2 || value == 3){
     if (dosageVariableRes.value.length && dosageVariableRes.value.length > 0){
       const temp_type_body_weight_unit = value == 2 ? [1, 2] : [3]
       var dosageVariable : any = null
       
       const dosageVariableList = dosageVariableRes.value.filter((dosVa:any)=> temp_type_body_weight_unit.includes(dosVa.type_body_weight_unit))
       if(dosageVariableList && dosageVariableList.length && dosageVariableList.length > 0){
         dosageVariable = dosageVariableList.find((dosVa: any) => dosVa.id_cm_animal == customerStore.getPet?.id_cm_animal)
         if(!dosageVariable){
           dosageVariable = dosageVariableList.find((dosVa: any) => !dosVa.id_cm_animal)
         }
       }

       if(dosageVariable && dosageVariable.val_dose_min && dosageVariable.val_dose_max && dosageVariable.val_dose_max > 0){
         dosageVariableRange.value = `${dosageVariable.val_dose_min} 〜 ${dosageVariable.val_dose_max}`
         const tempUnit = useCommonStore().getCommonUnitOptionList.find((unitObj: any) => unitObj.value == dosageVariable.id_cm_unit_medicine)?.name_common
         const tempUnit2 =  `${typeBodyWeightUnit.find((obj:any) => obj.value == dosageVariable.type_body_weight_unit )?.label ?? ''}`
         dosageVariableRangeUnit.value = tempUnit ? `${tempUnit} ` + '/' + tempUnit2 : tempUnit2
         prescriptionDetailForm.value.val_efficacy_strength_doctor = dosageVariable.val_dose_min
         dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
         dosageVariableRangeValue.value.max = dosageVariable.val_dose_max
         return
       }
       if(dosageVariable && dosageVariable.val_dose_min){
         dosageVariableRange.value = `${dosageVariable.val_dose_min}` +
           `${typeBodyWeightUnit.find((obj:any) =>  obj.value == dosageVariable.type_body_weight_unit )?.label ?? ''}`
         prescriptionDetailForm.value.val_efficacy_strength_doctor = dosageVariable.val_dose_min
         dosageVariableRangeValue.value.min = dosageVariable.val_dose_min
       }

       if(!dosageVariable){
         await mtUtils.autoCloseAlert('有効成分の範囲が対象動物で見つかりませんでした。\n医薬品データを見直してください。')
       }
     }
     
   }
   if(value == 4){
     filteredDoseOptionList.value = doseStore.getAllDoses.filter((value)=> !value.quantity_dose)
     let tempDosageFrequencyDosage : any = doseStore.getAllDoses.find((dFObj:any)=> dFObj.type_dose == 10)
     if(tempDosageFrequencyDosage){
       prescriptionDetailForm.value.dosage_frequency_CB_UI = true
       prescriptionDetailForm.value.id_dosage_frequency = tempDosageFrequencyDosage.value
       typeDoseUI.value = 10
       prescriptionDetailForm.value.total_days_dose = 1
     }
     prescriptionDetailForm.value.dosage_frequency_UI = ''
     quantity_dose.value = 1
     await fetchItemServiceUnits(4)
   }
   
  }
  function assignPageData(data: any) {
    if (data) {
      for (let key in data) {
        prescriptionDetailForm.value[key] = data[key]
      }
    }
  }
  function removeItem(){
    emits('removeItem', prescriptionDetailForm.value.id_item_service)
  }
  const setChildRef = (index) => (el) => {
    if (el) {
      childFormRefs.value[index] = el;
    } else {
      // Handle removing the reference when the child component is unmounted
      childFormRefs.value.splice(index,1);
    }
  };


function applyDefaultSetting(value: any) {
  if (!value) {
    toggleDivision.value = false;
  }

  feDivision.value.fe_use = true;
  feDivision.value.pill_division = pillDivisionList.value;
  prescriptionDetailForm.value.fe_division = feDivision
  }
  function selectedIdDosageFrequency(value:any){
    isQuantityAvailable.value = false
    if(value == 1 && medicineObj.value.id_dosage_frequency_1){
      prescriptionDetailForm.value.id_dosage_frequency = medicineObj.value.id_dosage_frequency_1
      if(dosageFrequencyList.value[0].quantity_dose){
        isQuantityAvailable.value = true
        quantity_dose.value = dosageFrequencyList.value[0].quantity_dose
      }
    }
    if(value == 2 && medicineObj.value.id_dosage_frequency_2){
      prescriptionDetailForm.value.id_dosage_frequency = medicineObj.value.id_dosage_frequency_2
      if(dosageFrequencyList.value[1].quantity_dose){
        isQuantityAvailable.value = true
        quantity_dose.value = dosageFrequencyList.value[1].quantity_dose
      }
    }
    if(value == 3 && medicineObj.value.id_dosage_frequency_3){
      prescriptionDetailForm.value.id_dosage_frequency = medicineObj.value.id_dosage_frequency_3
      if(dosageFrequencyList.value[2].quantity_dose){
        isQuantityAvailable.value = true
        quantity_dose.value = dosageFrequencyList.value[2].quantity_dose
      }
    }
    const tempDosage :any = doseStore.getAllDoses.find((dose:any) => dose.value == value)
    if (tempDosage && prescriptionDetailForm.value.type_medicine_dosage != '4' && !(tempDosage.type_dose == '10' || tempDosage.type_dose == '99')){
      if(!tempDosage.quantity_dose){
        mtUtils.autoCloseAlert('服用量/日の値の取得に失敗しました。')
      }
    }
    if (tempDosage){
      typeDoseUI.value = tempDosage?.type_dose
      if (typeDoseUI.value == '1'){
        prescriptionDetailForm.value.total_days_dose = 7
      }else {
        prescriptionDetailForm.value.total_days_dose = 1
      }
      prescriptionDetailForm.value.date_end = calculateDate(prescriptionDetailForm.value.date_start, prescriptionDetailForm.value.total_days_dose, typeDoseUI.value)
      quantity_dose.value = tempDosage?.quantity_dose ?? 1
      isQuantityAvailable.value = true
      return
    }
  }
  function checkedDosageFreqCB_UI(){
    disable_dosage_frequency_UI.value = false
    if (prescriptionDetailForm.value.dosage_frequency_CB_UI){
      disable_dosage_frequency_UI.value = true
      prescriptionDetailForm.value.id_dosage_frequency = null
      prescriptionDetailForm.value.dosage_frequency_UI = ''
    }
  }
  async function fetchItemServiceUnits(typeMedicineDosage:any=null) {
    const response = itemServiceUnitList.value
    if (response && response.length && response.length > 0) {
      prescriptionDetailForm.value.prescription_detail_assort_list.length =0
        response.forEach((itemUnit: any, index ) => {
        let tempObj = {
          id_prescription_detail_assort: random(10000,100000),
          id_prescription: prescriptionDetailForm.value.id_prescription,
          id_prescription_detail: prescriptionDetailForm.value.id_prescription_detail,
          id_item_service_unit: itemUnit.id_item_service_unit,
          type_medicine_dosage: itemUnit.type_medicine_dosage,
          id_cm_unit_medicine: itemUnit.id_cm_unit_medicine,
          type_dosage_calculation : medicineObj.value.type_dosage_calculation,
          val_efficacyingredient: itemUnit.val_efficacyingredient
        }
        if(index == 0 && typeMedicineDosage == 4) {
          tempObj['val_dosage_suggested'] = '1'
        }
        prescriptionDetailForm.value.prescription_detail_assort_list.push(tempObj)
      })
    }
  }
  async function fetchSuggestedAmount(){
    if(! await aahValidations.prescriptionDetailValidation(prescriptionDetailForm.value)){
      return
    }
    prescriptionStore.setSuggestAPIReqCounter()
    
    const response : any = await mtUtils.callApi(selectOptions.reqMethod.POST,'prescriptions/suggested_amounts', 
      {'prescription_detail_list':[prescriptionDetailForm.value]})
    
    if(response && response.prescription_detail_list && response.prescription_detail_list.length > 0){
      prescriptionDetailForm.value.val_total_efficacyingredient = null
      prescriptionDetailForm.value.prescription_detail_assort_list = []
      const prescriptionDetailObj :any = response.prescription_detail_list[0]
      assignPageData(prescriptionDetailObj)
      prescriptionDetailForm.value.type_medicine_dosage = `${prescriptionDetailObj.type_medicine_dosage}`
      const pdList = response.prescription_detail_list[0];
      if(pdList.prescription_detail_assort_list && pdList.prescription_detail_assort_list.length > 0){
        if(props.item.selectedTab != 3) await mtUtils.autoCloseAlert('服用量を計算しました。')
        prescriptionDetailForm.value.prescription_detail_assort_list = pdList.prescription_detail_assort_list
      }else {
        await mtUtils.alert(`対象： ${props.item.name_item_service} \n` + '体重及び指定条件を満たす処方がありませんでした。' +
          '\n条件変更をするか、数量指定で処方箋の登録を行ってください。', ' 条件変更が必要です')
      }
    }
    if (response && response.error && response.error.length && response.error.length > 0 && props.item.selectedTab != 3){
      await mtUtils.autoCloseAlert('Error :' + response.error[0])
    }
    if(response && response.error && response.error.length && response.error.length > 0 && props.item.selectedTab == 3){
      prescriptionStore.setTotalSuggestApiError()
    }
    if(response){
      prescriptionStore.setSuggestAPIResCounter()
      emits('checkSuggestionResponse')
    }
  }
  async function setPrescriptionHeader(){
    const idPet :any =  customerStore.getPet.id_pet
    const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(idPet)
    if (!prescriptionStore.getPrescriptionHeaderByPet(idPet)){
      await mtUtils.alert('対象ペットにはまだ処方箋が作成されていません。')
      return
    }
    prescriptionDetailForm.value = {
      ...props.item,
      total_days_dose: prescriptionHeader?.total_days_dose,
      date_start: prescriptionHeader.date_start,
      date_end: prescriptionHeader.date_end,
      id_prescription: prescriptionHeader.id_prescription,
      id_employee_doctor: prescriptionHeader.id_employee_doctor,
      id_pet:prescriptionHeader.id_pet,
      id_pet_bio_info: prescriptionHeader.id_pet_bio_info,
      type_medicine_format: null,
      val_weight : prescriptionHeader.val_weight,
      id_clinic: JSON.parse(<string>localStorage.getItem('clinic'))?.id_clinic
    }
    prescriptionDetailForm.value.prescription_detail_assort_list = []
  }
  onMounted(async ()=>{

    await useCommonStore().fetchPreparationCommonList({'code_common': [1, 4, 5, 12]})

    commonTypeAnimalOptionList.value = useCommonStore().getCommonTypeAnimalOptionList
      .map((o: any) => ({value: o.id_common, label: o.name_common, status: 1, id_common: o.id_common,}))

    pillDivisionList.value = useCommonStore().getCommonPillDivisionOptionList
      .map((o: any) => ({
        value: o.id_common,
        name_common: o.name_common,
        flg_func1: o.flg_func1,
        display_order: o.display_order,
        code_func1: o.code_func1,
      })).sort((a: any, b: any) => a.display_order - b.display_order)

    await setPrescriptionHeader()
    const itemServiceResponse : any = await mtUtils.callApi(selectOptions.reqMethod.GET,`/mst/item_services/${props.item.id_item_service}`,)
    if (itemServiceResponse){
      if(itemServiceResponse.medicine){
        const tempMedicine = itemServiceResponse.medicine
        dosageFrequencyList.value = tempMedicine.dosage_frequency_list.map((dosageFrequency:any)=> {
        const tempU = dosageFrequency.type_dose == 1 ? '回/日' : dosageFrequency.type_dose == 2 ? '回/週' : dosageFrequency.type_dose == 3 ? '回/月' : ''
        return {
          quantity_dose:dosageFrequency.quantity_dose,
          label: `${dosageFrequency.name_dose_formal}  (${dosageFrequency.quantity_dose}${tempU})` ,
          value: dosageFrequency.id_dosage_frequency
        }} )
        if(tempMedicine.id_dosage_frequency_1 &&
          ( tempMedicine.flg_dosage_fixed ||
            tempMedicine.flg_dosage_variable ||
            tempMedicine.flg_dosage_per_head ) ) {
            prescriptionDetailForm.value.dosage_frequency_UI = '1'
            prescriptionDetailForm.value.id_dosage_frequency = tempMedicine.id_dosage_frequency_1
            quantity_dose.value = doseStore.getAllDoses.find((dose)=> dose.value == tempMedicine.id_dosage_frequency_1)?.quantity_dose
        }
        medicineObj.value = tempMedicine
      }
      if (itemServiceResponse.dosage_fixed_list) {
        // Replace null id_common values with a default key before grouping
        const defaultGroupKey = 'all'; // Use a string to represent 'all' to avoid mixing types
        const preprocessedList = itemServiceResponse.dosage_fixed_list.map(item => ({
          ...item,
          id_common: item.id_common === null ? defaultGroupKey : item.id_common,
        }));

        dosageFixedList.value = preprocessedList;
        dosageFixedListByGroup.value = groupBy(dosageFixedList.value, 'id_common');

        let selectedGroupKey = customerStore.getPet.id_cm_animal || defaultGroupKey;
        const gby = groupBy(dosageFixedList.value, 'id_common');

        if (!gby[selectedGroupKey]?.length) {
          selectedGroupKey = defaultGroupKey;
        }

        dosageFixedListByGroup.value = selectedGroupKey ? {[selectedGroupKey]: gby[selectedGroupKey]} : {};
      }
      
      if(itemServiceResponse.item_service_unit_list){
        itemServiceUnitList.value = itemServiceResponse.item_service_unit_list.sort((itemA :any, itemB :any )=> {
          return itemA.display_order - itemB.display_order
        })
      }
      if(itemServiceResponse.dosage_variable_list){
        dosageVariableRes.value = itemServiceResponse.dosage_variable_list
      }
    }
    
    if(medicineObj.value){
      const prescriptionHeader = prescriptionStore.getPrescriptionHeaderByPet(prescriptionDetailForm.value.id_pet)
      prescriptionDetailForm.value.type_medicine_dosage = ''

      if (medicineObj.value.id_cm_med_format) {
        prescriptionDetailForm.value.type_medicine_format_ui = medicineObj.value.id_cm_med_format
        prescriptionDetailForm.value.name_medicine_format = useCommonStore().getCommonTypeMedicineFormatOptionList.find((v) => v.id_common == medicineObj.value.id_cm_med_format)?.name_common
      }
      if(medicineObj.value.flg_dosage_fixed){
        prescriptionDetailForm.value.type_medicine_dosage = '1'
        prescriptionDetailForm.value.val_weight = prescriptionHeader.val_weight
      }
      if(medicineObj.value.flg_dosage_variable && prescriptionDetailForm.value.type_medicine_dosage == ''){
        prescriptionDetailForm.value.type_medicine_dosage = '2'
        await selectedTypeMedicine(2)
        prescriptionDetailForm.value.val_weight = prescriptionHeader.val_weight
      }
      if(medicineObj.value.flg_dosage_per_head && prescriptionDetailForm.value.type_medicine_dosage == ''){
        prescriptionDetailForm.value.type_medicine_dosage = '3'
        await selectedTypeMedicine(3)
        prescriptionDetailForm.value.val_weight = '1'
      }
      if(medicineObj.value.flg_dosage_quantity && prescriptionDetailForm.value.type_medicine_dosage == ''){
        prescriptionDetailForm.value.type_medicine_dosage = '4'
        await selectedTypeMedicine(4)
        prescriptionDetailForm.value.val_weight = prescriptionHeader.val_weight
        return
      }
      if (medicineObj.value.id_cm_animal.find((comObj: any) => comObj.id_cm_animal == customerStore.getPet.id_cm_animal && comObj?.status == 99)) {
        await mtUtils.autoCloseAlert('指定の医薬品は禁忌に設定されているため、\n対象ペットには追加できません。')
        removeItem()
        return
      }
      if (!(medicineObj.value.flg_dosage_quantity ||
            medicineObj.value.flg_dosage_variable || 
            medicineObj.value.flg_dosage_fixed    || 
            medicineObj.value.flg_dosage_per_head  )){
        await mtUtils.autoCloseAlert('処方箋の登録情報が不正です。確認してください。')
        removeItem()
        return
      }

      if (!(medicineObj.value.id_cm_animal.find((comObj: any) => comObj.id_cm_animal == customerStore.getPet.id_cm_animal && comObj.status == 1))) {
        await mtUtils.autoCloseAlert('医薬品の想定対象外の動物種です。')
        return
      }
    }
    filteredDoseOptionList.value = doseStore.getAllDoses
    await fetchSuggestedAmount()
  })
  
</script>

<template>
  <div >
    <div class="flex justify-between q-pa-md light-prescription-blue">
      <div>
        <div class="title2 text-grey-900 bold q-mb-xs">{{ item.name_item_service }}  
          <q-icon name="quiz"  size="1em" 
           class="cursor-pointer"
          @click="()=> { mtUtils.popup(ViewItemServiceDetailModal, { id: item?.id_item_service })  }"/>
        </div>
        <div class="text-body2 text-grey-700 flex items-center">
          {{ item.name_category1 }}
          <q-icon name="arrow_right" />
          {{ item.name_category2 }}
        </div>
      </div>
      <div>
        <q-btn outline class="q-mr-md" @click="fetchItemServiceUnits" >
          全表示
        </q-btn>
        <q-btn outline @click="fetchSuggestedAmount" 
               :disable="prescriptionDetailForm.type_medicine_dosage == '4'" 
               v-if="prescriptionDetailForm.type_medicine_dosage != '4'">
          自動
        </q-btn>
        <q-btn outline @click="toggleDivision = !toggleDivision" class="q-ml-md" 
               :disable="prescriptionDetailForm.type_medicine_dosage == '4'" 
               v-if="prescriptionDetailForm.type_medicine_dosage == '2' || 
               prescriptionDetailForm.type_medicine_dosage == '3' ">
          <q-icon class="" size="2em" name="drag_indicator" />
          <q-badge v-if="feDivisionFlgCount > 0" color="red" floating>
            {{ feDivisionFlgCount }}
          </q-badge>
        </q-btn>
      </div>
    </div>
    
    <div  class="q-mt-sm">
        <span class=" q-mt-xs" :class="prescriptionDetailForm.flg_overdosing ? 'text-darkred' : 'text-white' ">
          <small>※ 規定量以上の投与です。注意してください。</small>
        </span>
    </div>
    
    <!-- Factors to calculate prescription detail & assort data -->
    <div class="q-mx-md">
      <div class="row q-col-gutter-md">
        <div class="col-auto">服用量計算 *</div>
        <div class="col-auto q-pt-sm" >
          <MtFormRadiobtn
            v-if="medicineObj.flg_dosage_fixed"
            label="早見表"
            v-model="prescriptionDetailForm.type_medicine_dosage"
            val="1"
            @update:selected="selectedTypeMedicine"
            class="q-pr-md"
          />
          <MtFormRadiobtn
            v-if="medicineObj.flg_dosage_variable"
            label="可変量/kg"
            v-model="prescriptionDetailForm.type_medicine_dosage"
            val="2"
            @update:selected="selectedTypeMedicine"
            class="q-pr-md"
          />
          <MtFormRadiobtn
            v-if="checkPerHeadAvailable"
            label="可変量/head"
            v-model="prescriptionDetailForm.type_medicine_dosage"
            val="3"
            @update:selected="selectedTypeMedicine"
            class="q-pr-md"
          />
          <MtFormRadiobtn
            v-if="medicineObj.flg_dosage_quantity"
            label="数量指定"
            v-model="prescriptionDetailForm.type_medicine_dosage"
            val="4"
            @update:selected="selectedTypeMedicine"
          />
        </div>
      </div>
      <div v-if="dosageVariableRange && (prescriptionDetailForm.type_medicine_dosage == 2 || prescriptionDetailForm.type_medicine_dosage == 3)">
        <div class="row">
          <MtFormInputNumber
            label="服用成分量"
            mode="dosage"
            v-model:value="prescriptionDetailForm.val_efficacy_strength_doctor"
            class="col-2 field-right-text doctor-amount-icon"
            @update:value="(value)=> {
              prescriptionDetailForm.flg_overdosing = false
              if(value > dosageVariableRangeValue.max){
                prescriptionDetailForm.flg_overdosing = true
              }
            }"
          />
          <div class=" flex calculation-process bi-grid-3x2-gap" v-if="efficacyCalculation">
            <q-icon name="info" class="q-pt-xs q-mr-sm"/>
            {{'服用1回あたりの有効成分量： ' + efficacyCalculation }}
          </div>
        </div>
        <div class="row q-my-sm">
          <div class="dosage-variable-range">
            規定成分量範囲： {{ dosageVariableRange }} <span class="q-mr-xs">{{ dosageVariableRangeUnit }}</span>
          </div>
        </div>
      </div>
      <div v-if="prescriptionDetailForm.type_medicine_dosage == 1">
        <q-btn label="投薬早見表" color="primary" size="sm" @click="()=>
        {
          if (itemServiceUnitList.length === 0) {
            mtUtils.autoCloseAlert('品名包装単位がありません。')
            return 
          }
          itemServiceUnitD = true 
        }"/>
        <q-dialog
          v-model="itemServiceUnitD"
        >
          <q-card style="width: 720px; max-width: 80vw;">
            <div class="row q-col-gutter-xs">
              <div class="col-12">
                <!--              <p class="q-mb-md">早見表</p>-->
                <table class="table-custom-fixed q-pa-lg" v-for="[index2, fixedDosage]  in Object.entries(dosageFixedListByGroup)" :key="index2">
                  <thead>
                  <tr>
                    <td class="q-ba q-pa-lg">
                      <div class="title2 text-grey-900 bold q-mb-xs">{{
                          getItem(item.id_item_service)?.name_item_service
                        }} {{
                          `( ${useCommonStore().getCommonTypeAnimalOptionList.find((v) => v.value == index2)?.label ?? '全種'} )`
                        }}
                      </div>
                      <div class="text-body2 text-grey-700 flex items-center">
                        {{ categoryName(getItem(item.id_item_service) ? getItem(item.id_item_service)?.id_category1 : item.id_category1) }}
                        <q-icon name="arrow_right" />
                        {{ categoryName(getItem(item.id_item_service) ? getItem(item.id_item_service)?.id_category2 : item.id_category2) }}
                      </div>
                    </td>
                    <template
                      v-if="itemServiceUnitList && itemServiceUnitList.length > 0">
                      <template v-for="(item, index) in itemServiceUnitList" :key="index">
                        <td class="q-ba q-pa-lg ">
                          <span>{{ item.name_service_item_unit }} </span>
                        </td>
                      </template>
                    </template>
                  </tr>
                  </thead>
                  <tbody>
                  <template
                    v-if="fixedDosage && fixedDosage.length > 0">
                    <tr v-for="(fixedDosage, index2) in fixedDosage" :key="index2">
                      <td class="q-pa-sm q-ba q-pa-lg ">
                          <span>
                            {{ fixedDosage.val_weight_min }}
                            <span class="body2">g</span> ~ 
                            {{ fixedDosage.val_weight_max }}
                            <span class="body2">g</span>{{'  未満 ' }} <br>  
                            <span class="flex justify-center">
                              {{
                                ` ( ${useCommonStore().getCommonOptionList.find((v) => v.value == fixedDosage.id_common)?.label ?? '全種'} )`
                              }}
                            </span>
                          </span>
                      </td>
                      <template
                        v-if="itemServiceUnitList && itemServiceUnitList.length > 0">
                        <template v-for="(item2, index3) in itemServiceUnitList" :key="index3">
                          <td class="q-ba text-center fixed-detail-hover q-pa-lg ">
                            <div class="cursor-pointer"
                                 v-if="fixedDosage.dosage_fixed_detail_list && fixedDosage.dosage_fixed_detail_list.length > 0 && 
                                 fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit == item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed)">
                              {{ fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit == item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed)?.quantity
                              }} {{}}
                               <span class="body2">{{ fixedDosage.dosage_fixed_detail_list.find(v => v.id_item_service_unit == item2.id_item_service_unit && v.id_dosage_fixed == fixedDosage.id_dosage_fixed)?.type_unit_label }}</span>
                            </div>
                            <div v-else class=" cursor-pointer bg-grey-100 text-black full-width full-height">
                            </div>
                          </td>
                        </template>
                      </template>
                    </tr>
                  </template>
                  </tbody>
                </table>
              </div>
            </div>
          </q-card>
        </q-dialog>
      </div>
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-auto">服用頻度 *</div>
        <div class="col-auto q-pt-sm" >
          <template v-if="prescriptionDetailForm.type_medicine_dosage != '4'">
            <MtFormRadiobtn
              v-if="medicineObj.id_dosage_frequency_1"
              :label="dosageFrequencyList[0].label"
              v-model="prescriptionDetailForm.dosage_frequency_UI"
              @update:selected="selectedIdDosageFrequency" val="1"
              class="q-pr-md"
              :disable="disable_dosage_frequency_UI"
            />
            <MtFormRadiobtn
              v-if="medicineObj.id_dosage_frequency_2"
              :label="dosageFrequencyList[1].label" v-model="prescriptionDetailForm.dosage_frequency_UI"
              @update:selected="selectedIdDosageFrequency"
              val="2"
              class="q-pr-md"
              :disable="disable_dosage_frequency_UI"
            />
            <MtFormRadiobtn
              v-if="medicineObj.id_dosage_frequency_3"
              :label="dosageFrequencyList[2].label"
              v-model="prescriptionDetailForm.dosage_frequency_UI"
              @update:selected="selectedIdDosageFrequency"
              val="3"
              class="q-pr-md"
              :disable="disable_dosage_frequency_UI"
            />
          </template>
          <MtFormCheckBox
            label="他"
            v-model:checked="prescriptionDetailForm.dosage_frequency_CB_UI"
            @update:checked="checkedDosageFreqCB_UI"
            class="q-pr-md"
          />
        </div>
        <div class="col-4 q-pt-sm"  v-if="prescriptionDetailForm.dosage_frequency_CB_UI">
          <MtFormPullDown
            label="その他指定頻度"
            v-model:selected="prescriptionDetailForm.id_dosage_frequency"
            :options="filteredDoseOptionList"
            @update:selected="selectedIdDosageFrequency"
          />
        </div>
      </div>
      <div class="row q-gutter-md q-mb-md">
        <div class="col-4" v-if="prescriptionDetailForm.type_medicine_dosage">
          <MtFormInputNumber
            v-model:value="prescriptionDetailForm.total_days_dose"
            mode="dosage"
            :label="prescriptionDetailForm.type_medicine_dosage == '4' ? '服用回数' :'服用日数 *'"
            class="field-right-text total-days-dose-icon"
            :class="totalDoseUI"
            v-if="isQuantityAvailable"
            @update:value="()=>{ prescriptionDetailForm.date_end = calculateDate(prescriptionDetailForm.date_start, prescriptionDetailForm.total_days_dose, typeDoseUI) }"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-4">
          <MtFormInputDate
            v-model:date="prescriptionDetailForm.date_start"
            label="服用 開始日 *"
            @update:date="()=>{ prescriptionDetailForm.total_days_dose = calculateDays(prescriptionDetailForm.date_start, prescriptionDetailForm.date_end, typeDoseUI)}"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-4" v-if="!(prescriptionDetailForm.type_medicine_dosage == '10' || typeDoseUI == '10')">
          <MtFormInputDate
            v-model:date="prescriptionDetailForm.date_end"
            label="服用 終了日"
            v-if="isQuantityAvailable"
            @update:date="()=>{ prescriptionDetailForm.total_days_dose = calculateDays(prescriptionDetailForm.date_start, prescriptionDetailForm.date_end, typeDoseUI)}"
          />
        </div>
        <div class="col-4">
          <MtFormPullDown
            label="処方時の薬剤形状 *"
            :options="useCommonStore().getCommonTypeMedicineFormatOptionList"
            v-model:selected="prescriptionDetailForm.type_medicine_format_ui"
            required
            :rules="[aahValidations.validationRequired]"
            @update:selected="selectedTypeMedicineFormat"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6">
          <MtInputForm
            v-model="prescriptionDetailForm.memo_dose"
            type="text"
            label="服用メモ"
            autogrow
          />
        </div>
        <div class="col-6">
          <MtInputForm
            v-model="prescriptionDetailForm.memo_alert"
            type="text"
            label="注意事項"
            autogrow
          />
        </div>
        <div class="col-6">
          <MtInputForm
            v-model="prescriptionDetailForm.memo_clinic_prep"
            type="text"
            label="調剤指示（院内メモ）"
            autogrow
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md justify-between">
        <div class="col-auto">
          <MtFormCheckBox
            v-model:checked="prescriptionDetailForm.flg_non_charge"
            label="会計対象外"
          />
        </div>
        <div class="col-2 q-ml-md">
          <q-btn
            unelevated
            flat
            @click="removeItem(prescriptionDetailForm.id_item_service)"
          >
            <q-icon name="delete"></q-icon>削除
          </q-btn>
        </div>
      </div>
    </div>
    <!-- prescription assort data -->
    <div class="assort-container full-width q-mt-md" v-if="prescriptionDetailForm.prescription_detail_assort_list.length > 0">
      <div class="q-mb-sm">
        <h4 class="text-white bg-grey-600 title4">処方箋明細</h4>
        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
          以下の内容で処方します。
        </span>
      </div>
      <PrescriptionDetailAssortListBox
        class="assort-box"
        v-for="(prescriptionAssort,index) in prescriptionDetailForm?.prescription_detail_assort_list"
        :key="prescriptionAssort.id_prescription_detail_assort"
        :ref="setChildRef(index)"
        :prescription-assort="prescriptionAssort"
        @removeIndex="()=>{ prescriptionDetailForm.prescription_detail_assort_list.splice(index,1) }"
        :itemServiceUnitList="itemServiceUnitList"
      />
      <div class="dose-container row q-py-md">
        <div class="col-6 items-center">
          <div class="flex items-center content-center">
            <div class="text-grey-700 q-mr-md">総服用回数</div>
            <div class="amount-dose">
              {{ calculatedTotalDosage }}
              回分
              <small class="regular" v-if="typeDoseUI != '10'">
                （ {{ ' ' + roundZeroAfterPoint(prescriptionDetailForm.total_days_dose) + comTypeDose + ' x 頻度 ' + quantity_dose + ' ' + comTypeFreeUI }}）
              </small>
            </div>
          </div>
        </div>
        <div class="col-2 second-col-dose flex content-center">
          <span class="q-mr-sm">服用形状</span> <span
          class="pill-title">{{ prescriptionDetailForm.name_medicine_format ?? '' }}</span>
        </div>
      </div>
      <div class="dosage-variable-range" v-if="val_total_efficacyingredient">
        処方明細の総有効成分量： {{ roundZeroAfterPoint(val_total_efficacyingredient) + assortUnitUi }} <span
        class="q-ml-sm"> （ {{ roundZeroAfterPoint(efficacyPetKg) + ` ${assortUnitUi} / Kg` }} ）</span>
      </div>
    </div>
    <q-dialog
      v-model="toggleDivision"
      style="{ width: 310px !important; }"
      @update:model-value="applyDefaultSetting"
    >
      <q-card  class="mt-small-popup">
        <MtModalHeader class="bg-sky-blue"  @close-modal="()=> toggleDivision = !toggleDivision">
          <div class="full-width">錠剤分割オプション</div>
        </MtModalHeader>
        <div class="division-model">
          <div class="q-col-gutter-md q-mb-xs q-pl-md q-pt-md">
            <div v-for="pill in pillDivisionList" :key="pill.id_common" class="col-auto">
              <MtFormCheckBox v-model:checked="pill.flg_func1" :label="pill.name_common"/>
            </div>
          </div>
          <div class="flex justify-center q-py-md">
            <q-btn 
              label="保存" size="sm"  color="primary" 
               @click="()=> { 
                 feDivision.pill_division = pillDivisionList
                 prescriptionDetailForm.fe_division = feDivision 
                 toggleDivision = false; 
                 feDivision.fe_use = true;
               }"></q-btn>
          </div>
        </div>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="scss">

 .assort-container{
   border-radius: 4px;
   border: 1px solid var(--System-Gray-500, #9E9E9E);
   background: var(--System-Gray-100, #F5F5F5);
   display: flex;
   padding: 10px 15px 10px 15px;
   flex-direction: column;
   align-items: flex-start;
   gap: 5px;
   align-self: stretch;
   .dose-container{
     display: flex;
     align-items: center;
     align-self: stretch;
     border-top: 1px solid var(--System-Gray-600, #757575);

     .amount-dose{
       color: var(--System-Gray-900, #212121);
       font-size: 15px;
       font-style: normal;
       font-weight: 700;
       line-height: 20px; /* 133.333% */
     }
     .second-col-dose{
       color: var(--System-Gray-900, #212121);
       font-size: 12px;
       font-style: normal;
       font-weight: 700;
       line-height: 15px; /* 125% */
       .pill-title{
         color: var(--System-Gray-900, #212121);
         font-size: 15px;
         font-style: normal;
         font-weight: 700;
         line-height: 20px; /* 133.333% */
       }
     }
   }
 }

 .doctor-amount-icon-kg::after {
  content: 'mg';
  /* font-family: 'Material Icons'; */
  top: 65% !important;
}

 .doctor-amount-icon-head::after {
   content: '頭';
   /* font-family: 'Material Icons'; */
   top: 65% !important;
 }

 .mt-small-popup {
   border: $grey-800 1px solid;
   border-radius: 6px;
   background-color: $white;
   width: 260px !important;
 }
 
 .division-model {
   height: 225px;
   display: flex;
   flex-direction: column;
   justify-content: space-between
 }
 

</style>
