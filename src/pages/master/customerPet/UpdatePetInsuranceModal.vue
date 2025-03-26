<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import aahValidations from '@/utils/aahValidations'
import useInsuranceStore from '@/stores/insurances'
import usePetInsuranceStore from '@/stores/pet-insurances'
import useDiseasesInsuredStore from '@/stores/diseasesInsured'
import OptionModal from '@/components/OptionModal.vue'
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import { storeToRefs } from 'pinia'
import { date } from 'quasar'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCommonStore from '@/stores/common'
import { checkDateRange, concatenate } from '@/utils/aahUtils'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'

const props = defineProps({
  data: {
    type: Object,
    default: {}
  },
  id_pet: {
    type: String,
    required: true
  },
  pet_name: String,
  customer_name: String,
  pet_birthday: String
})

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
}

const insurancePlanList: any = ref([]),
  insurancePlanListDefault: any = reactive([])
const diseaseInsurerOptionList = reactive<{ label: string, value: number }[]>([])
const diseaseInsurerOptionList1 = ref<{ label: string, value: number }[]>([])
const diseaseInsurerOptionList2 = ref<{ label: string, value: number }[]>([])
const diseaseInsurerOptionList3 = ref<{ label: string, value: number }[]>([])

const isEdit = ref(false)
const showinsurer1 = ref(true)
const showinsurer2 = ref(false)
const showinsurer3 = ref(false)

const petStore = usePetStore()
const customerStore = useCustomerStore()
const insuranceStore = useInsuranceStore()
const diseaseInsured = useDiseasesInsuredStore()

const { getPet } = storeToRefs(customerStore)
const { getInsurances } = storeToRefs(insuranceStore)
const { getDiseasesInsured } = storeToRefs(diseaseInsured)

const { getCommonTypeGeneralInsurerOptionList } = storeToRefs(useCommonStore())
const petInsuranceStore = usePetInsuranceStore()

const data = ref({
  id_pet_insurance: null,
  id_insurer: null,
  id_insurance_plan: null,
  flg_insurance_main: false,
  c_sname: null,
  ani_name: null,
  pet_birthday: null,
  code_insurance: null,
  date_insurance_start: null,
  date_insurance_end: null,
  count_hospital_visit: null,
  count_inpatient_stay: null,
  count_surgery: null,
  memo_insurance: null,
  limit_amount_normal: null,
  limit_amount_hospitalization: null,
  limit_amount_surgery: null,
  max_normal: null,
  max_hospitalization: null,
  max_surgery: null,
  coverage: null,
  id_cm_insurer: null,
  code_insurer: null,
  id_cm_disease_insurer_out1: null,
  id_cm_disease_insurer_out2: null,
  id_cm_disease_insurer_out3: null
})

const updateInsurancePlanList = (e: any, init: any = true) => {
  if (init) data.value.id_insurance_plan = null
  insurancePlanList.value.length = 0
  insurancePlanListDefault.length = 0
  if (e) {
    insurancePlanList.value = getInsurances.value
      .filter((v: any) => v.id_cm_insurer == e.id_cm_insurer)
      .map((v) => {
        return {
          label: v.name_insurance_plan,
          value: v.id_insurance_plan
        }
      })
    insurancePlanListDefault.push(...insurancePlanList.value)
  }
}

const selectedIdCmInsurer = async (value: string) => {
  data.value.id_insurance_plan = null
  data.value.limit_amount_normal = null
  data.value.limit_amount_hospitalization = null
  data.value.limit_amount_surgery = null
  data.value.max_normal = null
  data.value.max_hospitalization = null
  data.value.max_surgery = null
  data.value.code_insurer = null
  
  if (value) {
    const codeFunc = getCommonTypeGeneralInsurerOptionList.value.find((common) => {
      return common.id_common === data.value.id_cm_insurer
    })?.code_func1
    if (codeFunc) {
      diseaseInsurerOptionList3.value = []
      diseaseInsurerOptionList2.value = []
      diseaseInsurerOptionList1.value = []
      diseaseInsurerOptionList.length = 0
    }
    useCommonStore().getCommonDiseaseInsurerOptionList.filter((d) => {
      return parseInt(d.code_func1) === parseInt(codeFunc)
    }).map((item: any) => {
      let tempObj = {
        label: concatenate(item.name_common, `(${item.text2})`, item.code_func1),
        value: item.id_common
      }
      diseaseInsurerOptionList1.value.push(tempObj)
      diseaseInsurerOptionList2.value.push(tempObj)
      diseaseInsurerOptionList3.value.push(tempObj)
      diseaseInsurerOptionList.push(tempObj)
    })


    insurancePlanList.value = []
    insurancePlanListDefault.length = 0

    insurancePlanList.value = getInsurances.value
      .filter((i: any) => i.id_cm_insurer == data.value.id_cm_insurer)
      .map((v) => {
        return {
          label: v.name_insurance_plan,
          value: v.id_insurance_plan,
          code_insurer: v.code_func1
        }
      })
    insurancePlanListDefault.push(...insurancePlanList.value)

    return
  }
  Object.keys(data.value).forEach((key) => {
    if (['c_sname', 'ani_name', 'flg_insurance_main'].includes(key)) return
    data.value[key] = null
  })
}

const selectedInsurancePlan = async (value: string) => {
  data.value.limit_amount_normal = null
  data.value.limit_amount_hospitalization = null
  data.value.limit_amount_surgery = null
  data.value.max_normal = null
  data.value.max_hospitalization = null
  data.value.max_surgery = null
  data.value.code_insurer = null
  data.value.id_insurance_plan = value
  
  if (value) {
    const tempInsurancePlan = getInsurances.value.find(
      (insurancePlan: any) => insurancePlan.id_insurance_plan == value
    )
    // const tempDiseaseInsured = await diseaseInsured.fetchDiseasesInsured(value)
    if (tempInsurancePlan) {
      data.value.id_cm_insurer = tempInsurancePlan.id_cm_insurer
      data.value.limit_amount_normal = tempInsurancePlan.limit_amount_normal
      data.value.limit_amount_hospitalization =
        tempInsurancePlan.limit_amount_hospitalization
      data.value.limit_amount_surgery = tempInsurancePlan.limit_amount_surgery
      data.value.max_normal = tempInsurancePlan.max_normal
      data.value.max_hospitalization = tempInsurancePlan.max_hospitalization
      data.value.max_surgery = tempInsurancePlan.max_surgery
      data.value.coverage = tempInsurancePlan.coverage
      data.value.code_insurer =
        useCommonStore().getCommonTypeGeneralInsurerOptionList.find(
          (insurer: any) => insurer.id_common == tempInsurancePlan.id_cm_insurer
        ).code_func1
    }
  }
}
const changeDateInsuranceStart = (val: string) => {
  // Function will update date insurance end into one year of date insurace start
  if (val) {
    const currentDate = new Date(data.value.date_insurance_start)
    // Increment the year by 1
    currentDate.setFullYear(currentDate.getFullYear() + 1)
    // Subtract one day
    currentDate.setDate(currentDate.getDate() - 1)
    // Format and return the date as 'YYYY/MM/DD'
    data.value.date_insurance_end = date.formatDate(currentDate, 'YYYY/MM/DD')
    return data.value.date_insurance_end
  }
  // assign data to null and return
  data.value.date_insurance_end = null
  return data.value.date_insurance_end
}

const submit = () => {
   if (
    !checkDateRange([
      {
        start_date: data.value.date_insurance_start,
        end_date: data.value.date_insurance_end
      }
    ])
  )
    return false

  if (!data.value.id_pet_insurance) {
    petInsuranceStore
      .submitPetInsurance({ ...data.value, id_pet: props.id_pet })
      .then(async () => {
        await petStore.updatePet(props.id_pet, getPet.value?.id_customer,
          {
            id_customer: getPet.value?.id_customer,
            id_pet: getPet.value?.id_pet,
            name_pet: getPet.value?.name_pet,
            flg_insurance_plan: true,
          }
        )
        petInsuranceStore
          .fetchPetInsurances({ id_pet: props.id_pet })
          .then(() => {
            mtUtils.autoCloseAlert(aahMessages.success)
            closeModal()
          })
      })
  } else {
    petInsuranceStore
      .updatePetInsurance(data.value.id_pet_insurance, data.value)
      .then(() => {
        petInsuranceStore
          .fetchPetInsurances({ id_pet: props.id_pet })
          .then(() => {
            mtUtils.autoCloseAlert(aahMessages.success)
            closeModal()
          })
      })
  }
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
        .then((confirmation) => {
          if (confirmation) {
            petInsuranceStore
              .destroyPetInsurance(props.id_pet, data.value.id_pet_insurance)
              .then(() => {
                petInsuranceStore.fetchPetInsurances({ id_pet: props.id_pet })
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
              .catch(() => {})
          }
        })
    }
  }
}

const setSelectedinsurer1 = (value: string) => {
  showinsurer2.value = true
  if (!value) {
    data.value.id_cm_disease_insurer_out1 = data.value.id_cm_disease_insurer_out2
    data.value.id_cm_disease_insurer_out2 = data.value.id_cm_disease_insurer_out3
    data.value.id_cm_disease_insurer_out3 = null
    // show/hide logic
    if (!data.value.id_cm_disease_insurer_out2) {
      showinsurer3.value = false
    }
    if (!data.value.id_cm_disease_insurer_out1) {
      showinsurer2.value = false
    }
  }
}

const setSelectedinsurer2 = (value: string) => {
  showinsurer3.value = true
  if (!value) {
    data.value.id_cm_disease_insurer_out2 = data.value.id_cm_disease_insurer_out3
    data.value.id_cm_disease_insurer_out3 = null
    showinsurer3.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    useCommonStore().fetchPreparationCommonList({ code_common: [6, 29] }),
    insuranceStore.fetchInsurances()
  ])

  if (props.data.id_pet_insurance) {
    isEdit.value = true
  }

  if (!isEdit.value && 
    getCommonTypeGeneralInsurerOptionList.value &&
    getCommonTypeGeneralInsurerOptionList.value.length > 0
  ) {
    data.value.id_cm_insurer =
      getCommonTypeGeneralInsurerOptionList.value[0].id_common
  }

  insurancePlanList.value = getInsurances.value
    .filter((i: any) => i.id_cm_insurer == data.value.id_cm_insurer)
    .map((v) => {
      return {
        label: v.name_insurance_plan,
        value: v.id_insurance_plan
      }
    })

  insurancePlanListDefault.push(...insurancePlanList.value)

  if (props.data.id_pet_insurance) {
    data.value = { ...props.data }
    updateInsurancePlanList(data.value.insurance_plan, false)
  }


  if (props.customer_name) data.value.c_sname = props.customer_name
  if (props.pet_name) data.value.ani_name = props.pet_name
  if (props.pet_birthday) data.value.pet_birthday = props.pet_birthday
  if (data.value.id_cm_insurer) {

    const codeFunc = getCommonTypeGeneralInsurerOptionList.value.find((common) => {
      return common.id_common === data.value.id_cm_insurer
    })?.code_func1

    useCommonStore().getCommonDiseaseInsurerOptionList.filter((d) => {
      return parseInt(d.code_func1) === parseInt(codeFunc)
    }).map((item: any) => {
      let tempObj = {
        label: concatenate(item.name_common, `(${item.text2})`, item.code_func1),
        value: item.id_common
      }
      diseaseInsurerOptionList1.value.push(tempObj)
      diseaseInsurerOptionList2.value.push(tempObj)
      diseaseInsurerOptionList3.value.push(tempObj)
      diseaseInsurerOptionList.push(tempObj)
    })
  }
  if (props.data.id_cm_disease_insurer_out1) {
    data.value.id_cm_disease_insurer_out1 = props.data.id_cm_disease_insurer_out1
    showinsurer2.value = true
  }
  if (props.data.id_cm_disease_insurer_out2) {
    data.value.id_cm_disease_insurer_out2 = props.data.id_cm_disease_insurer_out2
    showinsurer3.value = true
  }
  if (props.data.id_disease_insurer_out3) {
    data.value.id_cm_disease_insurer_out3 = props.data.id_cm_disease_insurer_out3
  }
})
</script>

<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        class="row no-wrap items-center text-grey-900 title2 bold"
      >
        ペット保険
      </q-toolbar-title>
      <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-md">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    
 <q-form @submit="submit">
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md items-center q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormPullDown
            v-model:selected="data.id_cm_insurer"
            :options="getCommonTypeGeneralInsurerOptionList"
           
            label="ペット保険会社"
            required
            :rules="[aahValidations.validationRequired]"
            @update:selected="selectedIdCmInsurer"
          />

        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFilterSelect
            v-model:selecting="data.id_insurance_plan"
            v-model:options="insurancePlanList"
            :options-default="insurancePlanListDefault"
            label="保険プラン"
            :rules="[aahValidations.validationRequired]"
            required
            @update:selecting="selectedInsurancePlan"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            type="checkbox"
            v-model="data.flg_insurance_main"
            :items="[{ label: 'メイン保険' }]"
          />
        </div>
      </div>
      <template v-if="data.id_cm_insurer && data.id_insurance_plan">
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              type="text"
              v-model="data.c_sname"
              label="契約者姓 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              type="text"
              v-model="data.ani_name"
              label="動物名 *"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormInputDate
              v-model:date="data.pet_birthday"
              required
              :rules="[aahValidations.validationRequired]"
              label="動物誕生日 *"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              type="text"
              v-model="data.code_insurance"
              label="保険証券番号 *"
              autofocus
              required
              :rules="[aahValidations.validationRequired, (v) => (v && v.length === 10) || 'The length must be exactly 10 characters']"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormInputDate
              v-model:date="data.date_insurance_start"
              @update:date="changeDateInsuranceStart"
              label="保険開始日"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFormInputDate
              v-model:date="data.date_insurance_end"
              label="保険終了日"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.limit_amount_normal"
              :rules="[aahValidations.validationNumber]"
              label="1日あたり限度額：通院"
              required
              type="text"
              readonly
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.limit_amount_hospitalization"
              :rules="[aahValidations.validationNumber]"
              label="1日あたり限度額：入院"
              required
              type="text"
              readonly
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.limit_amount_surgery"
              :rules="[aahValidations.validationNumber]"
              label="1回あたり限度額：手術"
              required
              type="text"
              readonly
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.max_normal"
              :rules="[aahValidations.validationNumber]"
              label="最大日数（年間）：通院"
              required
              type="text"
              readonly
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.max_hospitalization"
              :rules="[aahValidations.validationNumber]"
              label="最大日数（年間）：入院"
              required
              type="text"
              readonly
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.max_surgery"
              :rules="[aahValidations.validationNumber]"
              label="最大回数（年間）：手術"
              required
              type="text"
              readonly
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtInputForm
              v-model="data.coverage"
              :rules="[aahValidations.validationNumber]"
              label="保険適用率（％）"
              required
              type="text"
              readonly
            />
          </div>
        </div>
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-lg-3 col-md-3 col-sm-6">
            <!-- @TODO: logic show/hide on each field -->
            <MtFilterSelect
              v-if="showinsurer1"
              v-model:options="diseaseInsurerOptionList1"
              v-model:selecting="data.id_cm_disease_insurer_out1"
              :options-default="diseaseInsurerOptionList"
              class="q-mr-sm selection-field"
              label="除外傷病 1"
              @update:selecting="setSelectedinsurer1"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFilterSelect
              v-if="showinsurer2"
              v-model:options="diseaseInsurerOptionList2"
              v-model:selecting="data.id_cm_disease_insurer_out2"
              :options-default="diseaseInsurerOptionList"
              class="q-mr-sm selection-field"
              label="除外傷病 2"
              @update:selecting="setSelectedinsurer2"
            />
          </div>
          <div class="col-lg-3 col-md-3 col-sm-6">
            <MtFilterSelect
              v-if="showinsurer3"
              v-model:options="diseaseInsurerOptionList3"
              v-model:selecting="data.id_cm_disease_insurer_out3"
              :options-default="diseaseInsurerOptionList"
              class="q-mr-sm selection-field"
              label="除外傷病 3"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md items-center q-mb-md">
          <div class="col-12">
            <MtInputForm
              type="text"
              v-model="data.memo_insurance"
              label="保険メモ"
              autogrow
            />
          </div>
        </div>
      </template>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" unelevated color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

  </div>
</template>
