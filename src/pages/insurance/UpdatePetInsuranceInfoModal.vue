<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

// Utilities
import {
  calculateDays,
  getCustomerName,
  getDateToday,
  getDaysBefore,
  getFullPetName,
  getPetFirstNameOnly
} from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { anicomProgC } from '@/utils/enum'

// Stores
import useCommonStore from '@/stores/common'
import useInsuranceStore from '@/stores/insurances'
import useCustomerStore from '@/stores/customers'
import useCartStore from '@/stores/carts'
import useClaimStore from '@/stores/claim'

// Components
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'

// Existing Components (from @/pages/)
import UpdPetInsuranceModal from '@/pages/master/customerPet/UpdatePetInsuranceModal.vue'
import ReselectDieaseInsurerModal from '@/pages/cart/ReselectDieaseInsurerModal.vue'
import { Platform } from 'quasar'
import UpdDiseaseInsurerBlukByCD from '@/pages/cart/UpdDiseaseInsurerBlukByCD.vue'
import { event_bus } from '@/utils/eventBus'

const props = withDefaults(
  defineProps<{
    data: Object
    fromCart: Boolean
    id_pet: any
    callBackProperties: Function
    petObj: Object
    typeApplicationStatus: any
    finalCallBack: Function
    finalCheck: any,
    claimPage: any,
    cartDetailList: any,
  }>(),
  {
    data: Object,
    fromCart: false,
    id_pet: null,
    callBackProperties: Function,
    typeApplicationStatus: null,
    finalCallBack: Function,
    finalCheck: false,
    claimPage: false,
    cartDetailList: Object
  }
)
const emits = defineEmits(['close'])

const insuranceStore = useInsuranceStore()
const customerStore = useCustomerStore()

const { getInsuranceListByPet } = storeToRefs(insuranceStore)
const insurancePlanList: any = ref([]),
  insurancePlanListDefault: any = reactive([])

const claim: any = ref({})

const claim_detail_list = ref([])

const data = ref({
  code_insurance: 'XXXXXXXXX',
  count_hospital_visit: '4',
  date_insurance_start: getDateToday(),
  count_inpatient_stay: '0',
  date_insurance_end: getDaysBefore(7),
  count_surgery: '0',
  datetime_birth: getDateToday(),
  memo_insurance: '特記事項テキストテキストテキスト',
  name_insurance_plan: 'どうぶつ健保50％',
  coverage: '50',
  limit_amount_normal: '¥ 10,000',
  limit_amount_hospitalization: '¥ 10,000',
  limit_amount_surgery: '¥ 10,000',
  date_illness_history: null,
  id_insurance_plan: null,
  around_time: false,
  approval_number: null,
  detailView: true,
  name_ins1: null,
  name_ins2: null,
  reason_01: null,
  reason_02: null,
  reason_03: null,
  reason_04: null,
  reason_05: null,
  reason_06: null,
  reason_07: null,
  reason_08: null,
  reason_09: null,
  reason_09_txt: null,
  prog_cd: '',
  heal_date: ''
})

const processData = ref({
  date_ins_type2: null,
  date_ins_type3_start: null,
  date_ins_type3_end: null,
  days_ins_type3: null,
  days_ins_type2: null,
  name_ins1: null,
  name_ins2: null,
  onset_date: null,
  total_ins_type4: null,
  date_ins_type4: null,
  reason_01: null,
  reason_02: null,
  reason_03: null,
  reason_04: null,
  reason_05: null,
  reason_06: null,
  reason_07: null,
  reason_09: null,
  reason_09_txt: null
})

const isCheckBoxRequired = ref(false)

const formObj = ref(null)
const isApproved = ref(false)
const updateCode = ref(false)

const canCreate: any = ref(false)
const savedProcessData: any = ref(false)
const savedData: any = ref(false)

async function init(initCall: any = false) {
  insurancePlanListDefault.length = 0
  insurancePlanList.value.length = 0

  insuranceStore.setPetInsuranceList()
  await Promise.all([
    insuranceStore.fetchPetInsuranceList({
      id_pet: props.id_pet ?? customerStore.getPet.id_pet
    }),
    useCommonStore().fetchPreparationCommonList({ code_common: [29] }, true)
  ])

  if (props.fromCart) {
    await mtUtils.promiseAllWithLoader([
      useClaimStore().fetchClaimByCart(props.data.id_cart)
    ])
  }

  insurancePlanList.value = getInsuranceListByPet.value.map((v) => {
    return {
      ...v,
      label: v.insurance_plan.name_insurance_plan,
      value: v.id_pet_insurance
    }
  })

  insurancePlanListDefault.push(...insurancePlanList.value)

  claim.value = useClaimStore()?.getClaimByCart.find(
    (v: any) => v.id_cart == props.data.id_cart
  )

  if (initCall && claim.value && claim.value?.id_claim) {
    data.value = {
      ...insurancePlanList.value.find(
        (v) => v.id_pet_insurance === props.data.id_pet_insurance
      ),
      ...claim.value,
      detailView: true,
      approval_number: claim.value.rezept_cd,
      id_insurance_plan: insurancePlanList.value.find(
        (v) => v.id_pet_insurance === props.data.id_pet_insurance
      ),
      id_pet_insurance: claim.value.id_pet_insurance 
    }

    isApproved.value = true

    processData.value = {
      ...claim.value,
      date_ins_type2: props.data.date_ins_type2,
      date_ins_type3_start: props.data.date_ins_type3_start,
      date_ins_type3_end: props.data.date_ins_type3_end,
      days_ins_type3: props.data.days_ins_type3,
      days_ins_type2: props.data.days_ins_type2,
      name_ins1: claim.value.diagnosis_1,
      name_ins2: claim.value.diagnosis_2,
      total_ins_type4: props.data.total_ins_type4,
      date_ins_type4: props.data.date_ins_type4
    }
    if (
      useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
        (v: any) => v.id_common == data.value.id_cm_insurer
      )?.code_func1 == 1
    ) {

      let typePurpose1List = useCartStore().getCart.cart_details.filter(
        (v: any) =>
          (!v.flg_pet_insurance && v.type_tax == 1) ||
          v.type_tax == 2 ||
          v.type_tax == 3
      )
      if (typePurpose1List && typePurpose1List.length > 0) {
        isCheckBoxRequired.value = true
      }
    }

    return
  }

  if (
    initCall &&
    insurancePlanList.value &&
    insurancePlanList.value.length > 0
  ) {

    let insurancePlane = insurancePlanList.value[0]

    if (useCartStore().getCart && useCartStore().getCart.id_pet_insurance) {
      insurancePlane = insurancePlanList.value.find((v) => v.id_pet_insurance == useCartStore().getCart.id_pet_insurance)
    }

    if (!insurancePlane.date_insurance_start || !insurancePlane.date_insurance_end) {
      await mtUtils.alert('保険期間を確認してください！', '注意')
      return
    }


    data.value = {
      ...insurancePlane,
      detailView: useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == insurancePlane.id_cm_insurer)?.code_func1 != 3,
      onset_date: props.data.date_illness_history
    }

    processData.value = {
      date_ins_type2: props.data.date_ins_type2,
      date_ins_type3_start: props.data.date_ins_type3_start,
      date_ins_type3_end: props.data.date_ins_type3_end,
      date_ins_type4: props.data.date_ins_type4,
      days_ins_type3: props.data.days_ins_type3,
      days_ins_type2: props.data.days_ins_type2,
      name_ins1: props.data.name_ins1,
      name_ins2: props.data.name_ins2,
      total_ins_type4: props.data.total_ins_type4,
      onset_date: props.data.date_illness_history
    }

    return
  }
}

const isValidInsuranceClaim = computed(() => {
  let insurancePlan = insurancePlanListDefault.find((ins) => ins.id_pet_insurance == data.value.id_pet_insurance)

  return !!(insurancePlan && insurancePlan.id_pet_insurance && (new Date(insurancePlan.date_insurance_end) < new Date(getDateToday())) && !data.value.id_claim)

})

const dateEndOptions = (date) => {
  return date >= processData.value.date_ins_type3_start
}

const popupDieaseInsurer = ref(null)
const openModalToReselectDiseaseInsurer = async () => {
  await mtUtils.smallPopup(ReselectDieaseInsurerModal, {
    popupDieaseInsurer: popupDieaseInsurer,
    cartObj: props.data
  })
  await callbackFromReselectDiseaseInsurerModal()
}

async function callbackFromReselectDiseaseInsurerModal() {
  if (popupDieaseInsurer.value) {
    const diseaseInsurer =
      useCommonStore().getCommonDiseaseInsurerOptionList.find(
        (dis: any) =>
          dis.id_common === popupDieaseInsurer.value.id_cm_disease_insurer
      )

    if (!popupDieaseInsurer.value.isChanged) {
      return
    }

    if (
      data.value.id_cm_disease_insurer_out1 == diseaseInsurer?.id_common ||
      data.value.id_cm_disease_insurer_out2 == diseaseInsurer?.id_common ||
      data.value.id_cm_disease_insurer_out3 == diseaseInsurer?.id_common
    ) {
      await mtUtils.alert(
        'この疾患では保険の申請はできません。\n申請前に疾患を確認し、申請作業を行ってください。',
        '確認して下さい。'
      )
      return
    }

    props.data.name_ins1 = diseaseInsurer.text1
    props.data.name_ins2 = diseaseInsurer.name_common

    processData.value.name_ins1 = diseaseInsurer.text1
    processData.value.name_ins2 = diseaseInsurer.name_common

    let promiseList = []
    if (props.data.id_cart) {
      promiseList.push(
        useCartStore().updateCart(props.data.id_cart, {
          name_ins1: diseaseInsurer.text1,
          name_ins2: diseaseInsurer.name_common
        })
      )

    }

    if (claim.value && claim.value.id_claim) {
      promiseList.push(useClaimStore().updateCartClaim(claim.value.id_claim, {
        id_cart: props.data.id_cart,
        diagnosis_1: processData.value.name_ins1,
        diagnosis_2: processData.value.name_ins2,
        is_disease_updated_Ui: true
      }))
    }

    const [respon1, respon2] = await mtUtils.promiseAllWithLoader(promiseList)

    if (respon1 && respon2) {
      mtUtils.autoCloseAlert('保険傷病名を更新しました')
    }

  }
}

const closeModal = () => {

  if (props.finalCheck) {
    props.finalCallBack()
  }

  emits('close')
}

function getInsurerClass() {
  return useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
    (v: any) => v.id_common == data.value.id_cm_insurer
  )?.code_func1 == 1
    ? 'bg-green-200'
    : 'bg-sky-blue'
}

async function openUpdatePetInsuranceModal() {
  if (data.value.id_insurance_plan) {
    await mtUtils.mediumPopup(UpdPetInsuranceModal, {
      data: data.value.id_claim ? data.value.id_insurance_plan : data.value,
      id_insurance_plan: data.value?.id_insurance_plan.id_insurance_plan
    })
    await init(true)
    return
  }

  await mtUtils.mediumPopup(UpdPetInsuranceModal, {
    id_pet: customerStore?.getPet?.id_pet,
    pet_name: getPetFirstNameOnly(customerStore?.getPet),
    customer_name: getCustomerName(customerStore?.getCustomer),
    pet_birthday: customerStore?.getPet.date_birth
  })
  await init()
}

async function checkPetInsuranceApproval() {
  const id_cart = props.data.id_cart

  const diseaseOutList = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `check_disease_insurer_by_cart/${props.data.id_cart}`
  )

  if (
    diseaseOutList &&
    diseaseOutList.id_disease_insurer &&
    diseaseOutList.id_disease_insurer.length &&
    diseaseOutList.id_disease_insurer.length > 0
  ) {
    if (
      diseaseOutList.id_disease_insurer.includes(
        data.value.id_disease_insurer_out1
      ) ||
      diseaseOutList.id_disease_insurer.includes(
        data.value.id_disease_insurer_out2
      ) ||
      diseaseOutList.id_disease_insurer.includes(
        data.value.id_disease_insurer_out3
      )
    ) {
      let isReturn = true
      let isFound = false

      if (props.data.name_ins1 != '' && props.data.name_ins2 != '') {
        if (
          props.data?.name_ins1 == data.value?.disease_insurer_out_1?.text1 &&
          props.data?.name_ins2 ==
          data.value?.disease_insurer_out_1?.name_common
        ) {
          isFound = true
        }

        if (
          props.data?.name_ins1 == data.value?.disease_insurer_out_2?.text1 &&
          props.data?.name_ins2 ==
          data.value?.disease_insurer_out_2?.name_common
        ) {
          isFound = true
        }

        if (
          props.data?.name_ins1 == data.value?.disease_insurer_out_3?.text1 &&
          props.data?.name_ins2 ==
          data.value?.disease_insurer_out_3?.name_common
        ) {
          isFound = true
        }
      }

      if (isFound && isReturn) {
        await mtUtils.alert(
          'この疾患では保険の申請はできません。\n申請前に疾患を確認し、申請作業を行ってください。',
          '確認して下さい。'
        )
        return
      }
    }
  }

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    `insurance_claims/check/${data.value.id_pet}/${data.value.id_cm_insurer}/${data.value.id_pet_insurance}/${id_cart}`, {
      id_clinic: JSON.parse(localStorage.getItem('id_clinic')!)
    }
  )
  if (response && response.code == 200) {
    if (response.claim_code == 'No-Code') {
      await mtUtils.alert(response.message + '\n\n', 'エラー')
      return
    }

    isApproved.value = true
    updateCode.value = false
    await mtUtils.alert(
      `${response.message}` + `\n内容を確認し「請求内容を保存」して下さい。`,
      `請求内容を確認して下さい。`
    )
    processResponse(response.claim_code)
    return
  }
  await mtUtils.autoCloseAlert('承認番号が取得できません。再度確認して下さい。')
}

function processResponse(claim_code: any = null) {
  data.value.approval_number = claim_code
  data.value.detailView = true
}

function checkClaimFinalize() {

  if (!processData.value.date_ins_type2 && !processData.value.date_ins_type3_start && !processData.value.date_ins_type4) {
    return 'You have not selected insurance dates'
  }

  if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.value?.id_cm_insurer)?.code_func1 == 1) {
    if (!processData.value.onset_date) {
      return 'You have not selected onset date'
    }
  }

  return false
}

async function createClaim() {

  if (updateCode.value) {
    const attentionConfirmation = await mtUtils.confirm('承認番号を手動で登録しますか？\nこの操作で保険の請求の準備を開始します。', '確認', 'OK')

    if (!attentionConfirmation) return
  }


  let surgery = useCartStore().getCart.flg_ins_surgery
  let hospitalization = useCartStore().getCart.flg_ins_hospitalization
  let normal = useCartStore().getCart.flg_ins_normal

  if (isCheckBoxRequired.value) {
    if (
      !(
        data.value.reason_01 ||
        data.value.reason_02 ||
        data.value.reason_03 ||
        data.value.reason_04 ||
        data.value.reason_05 ||
        data.value.reason_06 ||
        data.value.reason_07 ||
        data.value.reason_09
      )
    ) {
      await mtUtils.alert('保険対象外の会計明細がある場合は、保険対象外の事由の項目を選択し"請求内容を保存"を選択して下さい。', 'エラー')
      return
    }
  }

  if (props.finalCheck) {
    const errorInForm = checkClaimFinalize()

    if (errorInForm) {
      await mtUtils.alert(errorInForm, 'Error')
      return
    }
  }


  if (!normal && !hospitalization && surgery) {
    await mtUtils.alert('手術”だけでは保険請求できません。請求内容を確認して下さい。', 'エラー')
    return
  }

  if (normal && hospitalization) {
    await mtUtils.alert('通院、入院では保険請求することはできません。請求内容を確認して下さい。', 'エラー')
    return
  }

  if (normal && hospitalization && surgery) {
    await mtUtils.alert('通院、入院、手術を全て選択し保険請求することはできません。請求内容を確認して下さい', 'エラー')
    return
  }


  if (flgInsNormal.value && ((processData.value.date_ins_type2 == '' || !processData.value.date_ins_type2))) {
    await mtUtils.alert('通院の場合、通院日、通院日数の設定が必要です。')
    return
  }

  if (flgInsHospitalization.value && ((processData.value.date_ins_type3_start == '' || !processData.value.date_ins_type3_start) ||
    (processData.value.date_ins_type3_end == '' || !processData.value.date_ins_type3_end))) {
    await mtUtils.alert('通院の場合、通院日、通院日数の設定が必要です。')
    return
  }

  if (flgInsSurgery.value && ((processData.value.date_ins_type4 == '' || !processData.value.date_ins_type4))) {
    await mtUtils.alert('通院の場合、通院日、通院日数の設定が必要です。')
    return
  }

  if (processData.value.date_ins_type2 && processData.value.date_ins_type2_start != '') {
    if (!processData.value.days_ins_type2 || processData.value.days_ins_type2 == '') {
      await mtUtils.alert('通院の場合、通院日、通院日数の設定が必要です。')
      return
    }
  }


  if ((processData.value.days_ins_type2 && processData.value.days_ins_type2 != '') && (processData.value.date_ins_type2 == '' || !processData.value.date_ins_type2)) {
    await mtUtils.alert('通院の場合、通院日、通院日数の設定が必要です。')
    return
  }


  if (processData.value.date_ins_type3_start && processData.value.date_ins_type3_start != '') {
    if (!processData.value.date_ins_type3_end || processData.value.date_ins_type3_end == '') {
      await mtUtils.alert('入院の場合、入院日、退院日の日付の設定が必要です。')
      return
    }
  }

  if (processData.value.date_ins_type4 && processData.value.date_ins_type4 != '') {
    if (!processData.value.total_ins_type4 || processData.value.total_ins_type4 == '') {
      await mtUtils.alert('手術の場合、手術日、手術回数の設定が必要です。')
      return
    }
  }

  if ((processData.value.total_ins_type4 && processData.value.total_ins_type4 != '') && (processData.value.date_ins_type4 == '' || !processData.value.date_ins_type4)) {
    await mtUtils.alert('手術の場合、手術日、手術回数の設定が必要です。')
    return
  }

  if ((processData.value.date_ins_type4 && processData.value.total_ins_type4 != '')) {
    let flgType3 = true
    let flgType2 = true

    if (processData.value.date_ins_type3_start == '' || !processData.value.date_ins_type3_start) {
      flgType3 = false
    }

    if (processData.value.date_ins_type2 == '' || !processData.value.date_ins_type2) {
      flgType2 = false
    }

    if (flgType3 && flgType2) {
      await mtUtils.alert('「手術のみ」、「通院・入院」、「通院・入院・手術」\nでの保険請求は行えません。申請内容を確認して下さい。')
      return
    }

    if (!(flgType3 || flgType2)) {
      await mtUtils.alert('「通院・入院」または「手術のみ」\nで保険請求は行えません。申請内容を確認して下さい。')
      return
    }
  }

  if ((processData.value.date_ins_type3_start && processData.value.date_ins_type3_end) && (processData.value.date_ins_type2 || processData.value.days_ins_type2)) {
    await mtUtils.alert('「通院・入院」または「手術のみ」\nで保険請求は行えません。申請内容を確認して下さい。')
    return
  }


  const confirmation = await formObj.value.validate()

  if (!confirmation) return


  if (isApproved.value && data.value.approval_number) {
    await mtUtils.promiseAllWithLoader([
      useCartStore().updateCart(props.data.id_cart, {
        ...processData.value,

        id_pet_insurance: data.value.id_pet_insurance,
        flg_insure_request: true,
        days_ins_type3:
          processData.value.days_ins_type3 == ''
            ? null
            : processData.value.days_ins_type3,
        days_ins_type2:
          processData.value.days_ins_type2 == ''
            ? null
            : processData.value.days_ins_type2,
        total_ins_type4:
          processData.value.total_ins_type4 == ''
            ? null
            : processData.value.total_ins_type4,
        id_clinic: localStorage.getItem('id_clinic')
      })
    ])
  }

  await useCartStore().updateCart(
    props.data.id_cart,
    (processData.value = {
      date_ins_type2: processData.value.date_ins_type2,
      date_ins_type3_start: processData.value.date_ins_type3_start,
      date_ins_type3_end: processData.value.date_ins_type3_end,
      date_ins_type4: processData.value.date_ins_type4,
      days_ins_type3:
        processData.value.days_ins_type3 == ''
          ? null
          : processData.value.days_ins_type3,
      days_ins_type2:
        processData.value.days_ins_type2 == ''
          ? null
          : processData.value.days_ins_type2,
      name_ins1: processData.value.name_ins1,
      name_ins2: processData.value.name_ins2,
      total_ins_type4:
        processData.value.total_ins_type4 == ''
          ? null
          : processData.value.total_ins_type4,
      id_pet_insurance: data.value.id_pet_insurance,
      flg_insure_request: true,
      pledge_rate: data.value.coverage,
      date_illness_history: processData.value.onset_date,
      onset_date: processData.value.onset_date,
      id_clinic: localStorage.getItem('id_clinic')
    })
  )

  if (claim.value?.id_claim) {

    claim_detail_list.value = []

    // Don't not change anything until run the correct claim test. with and without insurance item and 10, 08, 0% coverage.
    // Very Complicated claim calculation for both Ipet and Anicom. 

    props.data.cart_details.filter(cd => !cd.flg_group_title).map((v: any) => {
      const unitSales = v.unit_sales ?? 0
      const unitPrice = v.unit_price ?? 0
      const quantity = v.quantity ?? 0

      let calculatedPrice = unitPrice

      let subTotal

      let subTotalWithDiscount

      // Ensure unitSales is a number
      const unitSalesPrice = typeof unitPrice === 'number' ? unitPrice : parseFloat(unitPrice) || 0

      // Ensure quantity is a number
      const quantityNumber = typeof quantity === 'number' ? quantity : parseFloat(quantity) || 0

      // Calculate the subTotal
      // SubTotal for iPet is without discount ->

      subTotal = (unitSalesPrice * quantityNumber).toFixed(2)

      // THIS might be a issue for anicom but currently requirements are confirmed 09-11-2024 , This comment is writing due 
      // issue in ipet case. if we have issue, My future self, sperate function in 2 functions Thanks ! 
      if (!v.flg_discount) {
        calculatedPrice = unitSales
      }


      if (!data.value.id_cm_insurer) {
        mtUtils.alert('', 'Error')
        return
      }

      if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.value?.id_cm_insurer)?.code_func1 == 1) {
        const UnitSales =
          typeof unitSales === 'number' ? unitSales : parseFloat(unitSales) || 0
        subTotal = (UnitSales * quantityNumber).toFixed(2)
      }

      // IPET
      if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.value?.id_cm_insurer)?.code_func1 == 2) {
        const UnitSales = typeof unitSales === 'number' ? unitSales : parseFloat(unitSales) || 0

        // Calculate price will be used to for unit price.
        calculatedPrice = (UnitSales).toFixed(2)

        // subTotal with the discount is used for tgt amount !!!  _vetty 1.1
        subTotalWithDiscount = (UnitSales * quantityNumber).toFixed(2)
      }


      const name_category1 = v.name_category1 ?? ''
      const name_category2 = v.name_category2 ?? ''

      const tempClaimDetail = {
        m_detail_compensation_category: v.flg_pet_insurance
          ? [2, 3, 4, '2', '3', '4'].includes(v.type_insurance_purpose)
            ? 1
            : 0
          : 0,
        m_detail_discount_rate: v.flg_discount ? 1 : 0,
        m_detail_taxable: v.type_tax,
        m_detail_price: calculatedPrice,
        m_detail_subtotal: subTotal,
        m_detail_breakdown_name: v.name_cart_item_display,
        m_detail_code_name: name_category1 + name_category2,
        m_detail_code: v.code_item_service_unit,
        m_detail_quantity: v.quantity,
        m_detail_subtotal_with_discount: subTotalWithDiscount,
        id_cart_detail: v.id_cart_detail
      }
      claim_detail_list.value.push(tempClaimDetail)
    })

    const totalCompensationCategoryZero_10Tax = claim_detail_list.value.reduce(
      (sum, detail) => {
        if (
          detail.m_detail_compensation_category === 0 &&
          detail.m_detail_taxable === 1
        ) {
          if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.value?.id_cm_insurer)?.code_func1 == 2) {
            // This if statement is only for ipet, due to their subTotal amount is without discount which was cause issue in compensation calculation
            return sum + parseFloat(detail.m_detail_subtotal_with_discount)
          }


          return sum + parseFloat(detail.m_detail_subtotal)
        }
        return sum
      },
      0
    )

    const totalCompensationCategoryZero_08Tax = claim_detail_list.value.reduce(
      (sum, detail) => {
        if (
          detail.m_detail_compensation_category === 0 &&
          detail.m_detail_taxable === 2
        ) {
          if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.value?.id_cm_insurer)?.code_func1 == 2) {
            // This if statement is only for ipet, due to their subTotal amount is without discount which was cause issue in compensation calculation
            return sum + parseFloat(detail.m_detail_subtotal_with_discount)
          }

          return sum + parseFloat(detail.m_detail_subtotal)
        }
        return sum
      },
      0
    )

    const totalCompensationCategoryZero_NoTax = claim_detail_list.value.reduce(
      (sum, detail) => {
        if (
          detail.m_detail_compensation_category === 0 &&
          detail.m_detail_taxable === 3
        ) {

          if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.value?.id_cm_insurer)?.code_func1 == 2) {
            // This if statement is only for ipet, due to their subTotal amount is without discount which was cause issue in compensation calculation
            return sum + parseFloat(detail.m_detail_subtotal_with_discount)
          }

          return sum + parseFloat(detail.m_detail_subtotal)
        }
        return sum
      },
      0
    )

    if (props.typeApplicationStatus && props.typeApplicationStatus == 11) {
      if (data.value.pet_insurance.code_insurer == 1) {
        if (!(processData.value.name_ins1 && processData.value.name_ins2)) {
          await mtUtils.alert('保険傷病を選択してください', 'Error')
          return
        }
      }


      if (data.value.pet_insurance.code_insurer == 2) {
        let counter = 0
        let cart_detail_list = []
        useCartStore().getCart.cart_details.forEach((cd: any) => {
          if (cd.flg_pet_insurance) {
            if (cd.name_ins1 === null || cd.name_ins1 === '' || cd.name_ins1 === null || cd.name_ins2 === null) {
              counter += 1
              cart_detail_list.push(cd)
            }
          }
        })

        if (counter > 0) {
          await mtUtils.alert(`${counter} 件の会計明細で保険傷病が未登録です。\n保険傷病を選択してください`, '保険会計の確認')
          await mtUtils.smallPopup(UpdDiseaseInsurerBlukByCD, {
            forValidation: true,
            cart_detail_list: cart_detail_list
          })
          await mtUtils.promiseAllWithLoader([
            useCartStore().fetchCart(useCartStore().getCart.id_cart)
          ])
          return
        }
      }
    }

    var tgt_amount = parseInt(props.data.total_sales_amount_intax) - ((totalCompensationCategoryZero_10Tax * 1.1) + (totalCompensationCategoryZero_08Tax * 1.08) + (totalCompensationCategoryZero_NoTax))

    tgt_amount = tgt_amount.toFixed(2)

    useClaimStore().updateCartClaim(claim.value.id_claim, {
      id_cart: props.data.id_cart,
      rezept_cd: data.value.approval_number,
      c_id: data.value.code_insurance,
      id_customer: props.data.id_customer,
      dic_date: processData.value.date_ins_type2,
      his_date: processData.value.date_ins_type3_start,
      hie_date: processData.value.date_ins_type3_end,
      diagnosis_1: processData.value.name_ins1,
      diagnosis_2: processData.value.name_ins2,
      op_date: processData.value.date_ins_type4,
      onset_date: processData.value.onset_date,
      dic_amount: parseInt(props.data.total_sales_amount_intax ?? 0),
      tgt_amount: tgt_amount,
      ins_amount: parseInt(props.data.total_amount_insured ?? 0),
      bur_amount: parseInt(props.data.bill ?? 0),
      type_status_application: props.typeApplicationStatus ?? 1,
      pledge_rate: data.value.coverage,
      on_set_date: data.value.on_set_date,
      reason_01: data.value.reason_01,
      reason_02: data.value.reason_02,
      reason_03: data.value.reason_03,
      reason_04: data.value.reason_04,
      reason_05: data.value.reason_05,
      reason_06: data.value.reason_06,
      reason_07: data.value.reason_07,
      reason_09: data.value.reason_09,
      reason_09_txt: data.value.reason_09_txt,
      medical_list: claim_detail_list.value,
      id_clinic: localStorage.getItem('id_clinic')
    })

    await mtUtils.autoCloseAlert('請求内容を更新しました。')
    savedData.value = JSON.stringify(data.value)
    savedProcessData.value = JSON.stringify(processData.value)


    if (props.fromCart) {
      await mtUtils.promiseAllWithLoader([
        useClaimStore().fetchClaimByCart(props.data.id_cart)
      ])
    }

    emits('close')
    return
  }


  if (useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data.value.id_cm_insurer)?.code_func1 == 3)
    return 
  
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    `claim/${data.value.id_cm_insurer}`,
    {
      ...data.value,
      id_cart: props.data.id_cart,
      c_id: data.value.code_insurance,
      id_customer: props.data.id_customer,
      rezept_cd: data.value.approval_number,
      dic_date: processData.value.date_ins_type2,
      his_date: processData.value.date_ins_type3_start,
      hie_date: processData.value.date_ins_type3_end,
      diagnosis_1: processData.value.name_ins1,
      diagnosis_2: processData.value.name_ins2,
      op_date: processData.value.date_ins_type4,
      dic_amount: parseInt(props.data.total_sales_amount_intax ?? 0),
      type_status_application: 1,
      pledge_rate: data.value.coverage,
      onset_date: processData.value.onset_date,
      id_clinic: localStorage.getItem('id_clinic')
    }
  )

  if (props.fromCart && response && response.id_claim) {
    props.callBackProperties(true, response.id_claim, props.petObj)
  }

  if (props.fromCart) {
    await mtUtils.promiseAllWithLoader([
      useClaimStore().fetchClaimByCart(props.data.id_cart)
    ])
  }
  emits('close')
}

function getInsurerName() {
  return useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
    (i: any) => i.id_common == data.value.id_cm_insurer
  )?.name_common
}

function selectingInsurancePlan(value) {
  if (value) {
    const insurancePlan = insurancePlanListDefault.find(
      (i: any) => i.id_pet_insurance == value
    )

    if (insurancePlan) {
      data.value = {
        ...insurancePlan,
        detailView: true,
        onset_date: null
      }
      processData.value = {
        date_ins_type2: props.data.date_ins_type2,
        date_ins_type3_start: props.data.date_ins_type3_start,
        date_ins_type3_end: props.data.date_ins_type3_end,
        date_ins_type4: props.data.date_ins_type4,
        days_ins_type3: props.data.days_ins_type3,
        days_ins_type2: props.data.days_ins_type2,
        name_ins1: props.data.name_ins1,
        name_ins2: props.data.name_ins2,
        total_ins_type4: props.data.total_ins_type4,
        onset_date: null,
        id_clinic: localStorage.getItem('id_clinic')
      }
    }
  }
}

const flgInsNormal = ref(false)
const flgInsHospitalization = ref(false)
const flgInsSurgery = ref(false)

const getCartBillingData = (isSpecialCase: any = false) => {
  return {
    special_case: isSpecialCase,
    ch_disc_rate: useCartStore().getCart.ch_disc_rate,
    cart_payment_this_time: useCartStore().getCart.cart_payment_this_time,
    type_price_adjustment: useCartStore().getCart.type_price_adjustment,
    total_adjustment_intax: useCartStore().getCart.total_adjustment_intax
  }
}


const preSetInsFlg = () => {
  if (useCartStore().getCart.flg_ins_normal) {
    flgInsNormal.value = true
  }
  if (useCartStore().getCart.flg_ins_hospitalization) {
    flgInsHospitalization.value = true
  }
  if (useCartStore().getCart.flg_ins_surgery) {
    flgInsSurgery.value = true
  }
}


const updateCartInsType = async (newVal) => {
  if (newVal && flgInsNormal.value && flgInsHospitalization.value && flgInsSurgery.value) {
    await mtUtils.alert(
      '『通院＋入院＋手術』全てを含めた保険請求はできません。\n内容を確認して下さい。',
      'エラー'
    )
  } else if (newVal && flgInsNormal.value && flgInsHospitalization.value) {
    await mtUtils.alert(
      '『通院＋入院』は保険の請求ができません。\n内容を確認して下さい。',
      'エラー'
    )
  } else if (newVal && flgInsSurgery.value && !flgInsHospitalization.value && !flgInsNormal.value) {
    await mtUtils.alert(
      '『手術』単体では保険の請求ができません。\n内容を確認して下さい。',
      'エラー'
    )
  }

  await mtUtils.callApi(selectOptions.reqMethod.POST, `UpdCartInsFlg`, {
    id_cart: useCartStore().getCart.id_cart,
    flg_ins_normal: flgInsNormal.value,
    flg_ins_hospitalization: flgInsHospitalization.value,
    flg_ins_surgery: flgInsSurgery.value
  })

  let cartBillingData = getCartBillingData()

  await mtUtils.promiseAllWithLoader([
    useCartStore().updateBillingAmount(useCartStore().getCart?.id_cart, cartBillingData)
  ])

  event_bus.emit('callUpdateBillingAPI', false)
  await mtUtils.promiseAllWithLoader([
    useCartStore().fetchCart(useCartStore().getCart?.id_cart)
  ])
  event_bus.emit('callUpdateBillingAPI', true)
}


watch(() => useCartStore().getCart.id_cart, (nowValue, oldValue) => {
  if (nowValue) {
    preSetInsFlg()
  }
}, {
  deep: true,
  immediate: true
})

const isIpad = computed(() => {
  return Platform.is.ipad
})

onMounted(async () => {
  await init(true)
  if (props.typeApplicationStatus == 11) {
    await mtUtils.alert('この会計は保険請求の対象です。\n請求内容に間違いがないかを確認してください。\n確認後に終了しましょう。', '保険内容の確認')
  }
  savedData.value = JSON.stringify(data.value)
  savedProcessData.value = JSON.stringify(processData.value)
})
</script>

<template>
  <q-form ref="formObj">
    <MtModalHeader @close-modal="closeModal">
      <!-- :closeBtn="false"-->
      <q-toolbar-title
        class="text-grey-900 title2 bold flex items-center content-center"
        v-if="useCustomerStore().getCustomer && useCustomerStore().getCustomer?.pets"
      >
        {{
          getFullPetName(
            useCustomerStore().getCustomer?.pets.find((i: any) => i.id_pet == props.id_pet),
            useCustomerStore().getCustomer
          )
        }}
        の保険情報
      </q-toolbar-title>
    </MtModalHeader>
    <q-scroll-area class="scroll">
      <q-card-section :class="{'content': isIpad}" class="q-mx-md">
        <div v-if="!claimPage" class="row">
          <div class="col-4">
            <MtFilterSelect
              v-model:options="insurancePlanList"
              v-model:selecting="data.id_pet_insurance"
              :disable="claim && claim.type_status_application != 1"
              :options-default="insurancePlanListDefault"
              :rules="[aahValidations.validationSelection]"
              label="保険プラン"
              @update:selecting="selectingInsurancePlan"
            />
          </div>
          <div class="col-4 q-mb-md q-ml-md">
            <q-btn
              v-if="insurancePlanList.length > 0"
              :disable="claim && claim.type_status_application != 1"
              class="bg-grey-200"
              flat
              round
              @click="openUpdatePetInsuranceModal"
            >
              <q-icon name="edit_note" />
            </q-btn>
            <q-btn
              v-else
              :disable="claim && claim.type_status_application != 1"
              class="bg-accent-200"
              label="ペット保険の登録"
              @click="openUpdatePetInsuranceModal"
            />
          </div>
        </div>
        <template v-if="data.id_insurance_plan">
          <div class="q-mb-xs">
            <q-chip
              :class="getInsurerClass()"
              :ripple="false"
              class="q-pa-md q-mb-sm q-mr-md"
              square
            >
              <span>{{ getInsurerName() }} 証券番号</span>
              <span class="title1 bold q-pl-md">{{ data.code_insurance }}</span>
            </q-chip>
            <span class="caption1 text-grey-800"
            >保険証を都度確認し、その後に承認番号を取得してください。</span
            >
          </div>
          <div class="q-mb-xs q-mb-md">
          <span>
            <span class="field-label1">保険契約期間</span>
            {{ data.date_insurance_start }} ～ {{ data.date_insurance_end }}
          </span>
            <span class="q-mx-md">
            <span class="field-label1">ペット生年月日</span>
            {{ data.pet_birthday }}
          </span>
            <span class="field-label1">補償率</span>
            {{ data.coverage }} %
          </div>
          <div class="q-mb-xs q-mb-md">
            <span class="field-label1">適用上限</span>
            <span
            >（通院： 上限 {{ data.max_normal }}日 /
            {{ data.limit_amount_normal }}円）</span
            >
            <span class="q-mr-md"
            >（入院： 最大{{ data.max_hospitalization }}日 /
            {{ data.limit_amount_hospitalization }}円）</span
            >
            <span class="q-mr-md"
            >（手術： 最大{{ data.max_surgery }}回 /
            {{ data.limit_amount_surgery }}円 ）</span
            >
          </div>
          <div class="q-mb-xs q-mb-md">
            <span class="field-label1">除外傷病</span>
            <span v-if="data?.disease_insurer_out_1">
            {{ data?.disease_insurer_out_1?.name_common }}</span
            >
            <span v-if="data?.disease_insurer_out_2" class="q-mx-md">
            <span class="q-mr-md"> / </span>
            {{ data?.disease_insurer_out_2?.name_common }}</span
            >
            <span v-if="data.disease_insurer_out_3" class="q-mr-md">
            <span class="q-mr-md"> / </span>
            {{ data?.disease_insurer_out_3?.name_common }}
          </span>
          </div>
          <div v-if="data.memo_insurance" class="q-mb-xs q-mb-md">
            <span class="field-label1">保険メモ</span>
            {{ data.memo_insurance }}
          </div>
          <div v-if="data.detailView">
            <div class="bg-grey-200 q-px-md q-py-xs q-mb-md">
            <span class="body2 regular text-grey-900 q-py-xs">
              保険申請内容</span>
            </div>
            <div class="row q-mb-md">
              <MtFormCheckBox
                v-model:checked="flgInsNormal" :disable="useCartStore().getCart.flg_completed"
                class="col-1"
                label="通院" @update:checked="(value)=>{
                  if(!value){
                    processData.date_ins_type2 = null;
                    processData.days_ins_type2 = null;
                  }
                  if(value){
                    const hCd = useCartStore().getCart.cart_details.find((cd)=> cd.flg_pet_insurance)
                    if(value && hCd){
                      processData.date_ins_type2 = hCd.date_order_start
                      processData.days_ins_type2 = 1
                    }
                  }
                  updateCartInsType()
                }"
              >

              </MtFormCheckBox>
              <MtFormCheckBox
                v-model:checked="flgInsHospitalization" :disable="useCartStore().getCart.flg_completed" class="col-1"
                label="入院" @update:checked="(value)=>{
                  if(!value){
                    processData.date_ins_type3_start = null;
                    processData.date_ins_type3_end = null;
                    processData.days_ins_type3 = null;
                  }
                  
                  const hCd = useCartStore().getCart.cart_details.find((cd)=> cd.flg_pet_custody)
                  if(value && hCd){
                    processData.date_ins_type3_start = hCd.date_order_start
                    processData.date_ins_type3_end = hCd.date_order_end
                    
                    processData.days_ins_type3 = calculateDays(
                      processData.date_ins_type3_start,
                      processData.date_ins_type3_end,
                      1
                    )
                  }
                  
                  updateCartInsType()
                }">
              </MtFormCheckBox>
              <MtFormCheckBox
                v-model:checked="flgInsSurgery" :disable="useCartStore().getCart.flg_completed"
                class="col-1"
                label="手術"
                @update:checked="(value)=>{
                  if(!value){
                    processData.date_ins_type4 = null;
                    processData.total_ins_type4 = null;
                  }
                  if(value){
                    const hCd = useCartStore().getCart.cart_details.find((cd)=> cd.flg_pet_insurance)
                    if(value && hCd){
                      processData.date_ins_type2 = hCd.date_order_start
                      processData.days_ins_type2 = 1
                    }
                  }
                  updateCartInsType()
                }"></MtFormCheckBox>
            </div>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-4">
                <MtInputForm
                  v-model="data.approval_number"
                  label="承認番号"
                  type="text"
                  @update:model-value="()=>{
                  updateCode = true
                  canCreate = true
                }"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  :disable="claim && claim.type_status_application != 1"
                  class="bg-grey-200 caption2 text-grey-800 q-px-md"
                  label="取得"
                  style="border: 0.5px solid #424242"
                  unelevated
                  @click="checkPetInsuranceApproval"
                />
              </div>
              <div class="col-3">
                <MtFormInputDate v-model:date="processData.onset_date" label="発症・受傷日"></MtFormInputDate>
              </div>
            </div>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-4">
                <MtFormInputDate
                  v-model:date="processData.date_ins_type2"
                  label="通院日"
                  @update:date="
                  (value) => {
                    if (!value) processData.days_ins_type2 = null
                  }
                "
                  :disable="!flgInsNormal"
                  :readonly="!flgInsNormal"
                ></MtFormInputDate>
              </div>
              <div class="col-4">
                <MtInputForm
                  v-model="processData.days_ins_type2"
                  label="通院日数"
                  type="number"
                  :disable="!flgInsNormal"
                />
              </div>
            </div>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-4">
                <MtFormInputDate
                  v-model:date="processData.date_ins_type3_start"
                  label="入院日"
                  @update:date="
                  (value) => {
                    if (!value){ 
                      processData.date_ins_type3_end = null; 
                      processData.days_ins_type3 = '' 
                      return
                    }
                    processData.date_ins_type3_end = processData.date_ins_type3_start
                    processData.days_ins_type3 = calculateDays(
                      processData.date_ins_type3_start,
                      processData.date_ins_type3_end,
                      1
                    )
                  }
                "
                  :disable="!flgInsHospitalization"
                  :readonly="!flgInsHospitalization"
                >
                </MtFormInputDate>
              </div>
              <div class="col-4">
                <MtFormInputDate
                  v-model:date="processData.date_ins_type3_end"
                  :options="dateEndOptions"
                  label="退院日"
                  @update:date="
                  () => {
                    processData.days_ins_type3 = calculateDays(
                      processData.date_ins_type3_start,
                      processData.date_ins_type3_end,
                      1
                    )
                  }
                "
                  :disable="!flgInsHospitalization"
                  :readonly="!flgInsHospitalization"
                >
                </MtFormInputDate>
              </div>
              <div class="col-4">
                <MtFormInputNumber
                  v-model:value="processData.days_ins_type3"
                  disable
                  label="入院日数"
                  mode="dosage"
                  @update:value="
                  () => {
                    processData.date_ins_type3_end = calculateDate(
                      processData.date_ins_type3_start,
                      processData.days_ins_type3,
                      1
                    )
                  }
                "
                />
              </div>
            </div>
            <div class="row q-col-gutter-md q-mb-md">
              <div class="col-4">
                <MtFormInputDate
                  v-model:date="processData.date_ins_type4"
                  label="手術日"
                  :disable="!flgInsSurgery"
                  :readonly="!flgInsSurgery"
                ></MtFormInputDate>
              </div>
              <div class="col-4">
                <MtInputForm
                  v-model="processData.total_ins_type4"
                  label="手術回数"
                  type="number"
                  :disable="!flgInsSurgery"
                />
              </div>
            </div>
            <div
              v-if="useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.id_cm_insurer)?.code_func1 == 1"
              class="row q-col-gutter-md q-mb-md"
            >
              <div class="col-4">
                <MtInputForm
                  v-model="processData.name_ins1"
                  disable
                  label="診断名（大項目）"
                  type="text"
                />
              </div>
              <div class="col-4">
                <MtInputForm
                  v-model="processData.name_ins2"
                  disable
                  label="診断名（小項目）"
                  type="text"
                />
              </div>
              <div class="col-4">
                <q-btn
                  class="text-blue"
                  flat
                  label="診断名の変更"
                  @click="openModalToReselectDiseaseInsurer"
                />
              </div>
            </div>

            <div
              v-if="useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.id_cm_insurer)?.code_func1 == 2 && claimPage"
            >
              <q-scroll-area style="height: calc(150px)">
                <div v-for="cartDetail in props.cartDetailList" :key="cartDetail.id_cart_detail"
                     class="row q-col-gutter-md q-mb-md">
                  <div class="col-4">
                    <MtInputForm
                      v-model="cartDetail.name_cart_item_display"
                      disable
                      label="診断名（大項目）"
                      type="text"
                    />
                  </div>
                  <div class="col-4">
                    <MtInputForm
                      v-model="cartDetail.name_ins1"
                      disable
                      label="診断名（大項目）"
                      type="text"
                    />
                  </div>
                  <div class="col-4">
                    <MtInputForm
                      v-model="cartDetail.name_ins2"
                      disable
                      label="診断名（小項目）"
                      type="text"
                    />
                  </div>
                </div>
              </q-scroll-area>
            </div>
            <template
              v-if="useCommonStore().getCommonTypeGeneralInsurerOptionList?.find((i: any) => i.id_common == data?.id_cm_insurer)?.code_func1 == 1"
            >
              <span class="body2 regular text-grey-900">保険対象外の事由</span>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-auto">
                  <div class="row">
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_01"
                        label="予防"
                      />
                    </div>
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_02"
                        label="去勢・避妊"
                      />
                      <MtFormCheckBox
                        v-model:checked="data.reason_03"
                        label="日常ケア・フード"
                      />
                    </div>
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_04"
                        label="妊娠・出産"
                      />
                    </div>
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_05"
                        label="臍・鼠蹊ヘルニア"
                      />
                    </div>
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_06"
                        label="美容"
                      />
                    </div>
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_07"
                        label="医薬品以外"
                      />
                    </div>
                    <div class="col-auto">
                      <MtFormCheckBox
                        v-model:checked="data.reason_09"
                        label="その他"
                        @update:checked="(value)=>{
                        if(!value){
                          data.reason_09_txt = null
                        }
                      }"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div v-if="data.reason_09" class="col-6">
                  <MtInputForm
                    v-model="data.reason_09_txt"
                    :rules="[aahValidations.validationRequired]"
                    label="その他理由"
                    type="text"
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-2">
                  <MtFormPullDown
                    v-model:selected="data.prog_cd"
                    :options="anicomProgC"
                    label="予後見込項目"
                  />
                </div>
                <MtFormInputDate v-model:date="data.heal_date" class="col-2" />
              </div>
            </template>
            <div class="row q-col-gutter-md q-mb-sm">
              <div class="col-auto">
                <div class="row">
                  <div class="col-auto">
                    <MtInputForm label="なし" type="radio" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </q-card-section>
    </q-scroll-area>
    <q-card-section class="q-bt bg-white">
      <div v-if="claimPage" class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
      </div>
      <div v-if="!claimPage" class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <!--        <q-btn-->
        <!--          v-if="!isApproved"-->
        <!--          :disable="isApproved"-->
        <!--          class="q-ml-md" color="primary"-->
        <!--          unelevated-->
        <!--          @click="changeInsurancePlan">-->
        <!--          <span>保険適用 a</span>-->
        <!--        </q-btn>-->
        <q-btn
          v-if="isApproved || canCreate"
          unelevated
          color="primary"
          class="q-ml-md"
          @click="createClaim"
          :disable="(claim && claim.type_status_application != 1 ) || isValidInsuranceClaim"
        >
          <span v-if="typeApplicationStatus != 11">請求内容の保存</span>
          <span v-else>保険内容を確定し、会計を終了</span>
        </q-btn>
        <q-btn v-if="false" class="q-ml-md" color="primary">
          <span> このボタン何？</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style scoped>

.scroll {
  height: calc(100vh - 250px);
}

</style>
