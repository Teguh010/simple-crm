<script setup lang="ts">
import MtInputForm from '@/components/form/MtInputForm.vue'
import { reactive, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import aahValidations from '@/utils/aahValidations'
import useCustomerStore from '@/stores/customers'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useClinicStore from '@/stores/clinics'
import useCommonStore from '@/stores/common'
import { useRouter } from 'vue-router'
import { typePetGender } from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import customerUtils from '@/pages/master/customerPet/customerUtils'
import { formatDate, getDateToday } from '@/utils/aahUtils'

const emits = defineEmits(['close'])
const customerStore = useCustomerStore()
const router = useRouter()

const clinicStore = useClinicStore()
const commonStore = useCommonStore()
const { getAllClinics } = storeToRefs(clinicStore)
const { getCommonTypeAnimalOptionList, getCommonBreedOptionList } =
  storeToRefs(commonStore)
const breedDefaultList: any = reactive([])
const breedList: any = ref([])
const data = ref({
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
  id_employee_request: JSON.parse(localStorage.getItem('id_employee')),
  name_family: null,
  name_kana_family: null,
  phone1: '',
  code_customer: null,
  name_pet: '',
  id_cm_animal: null,
  type_pet_gender: 1,
  id_cm_breed: '',
  date_register: formatDate(getDateToday())
})

const submit = async () => {
  if (data.value.name_kana_family === null) {
    data.value.name_kana_family = data.value.name_family
  }
  if (data.value.code_customer === null) {
    delete data.value.code_customer
  }

  let response = await mtUtils.promiseAllWithLoader([customerStore.submitQuickCustomer(data.value)])

  if (response = response[0]) {
    router.push(`/SearchRequestList/${response.data?.data?.id_request}`)
  }
  closeModal()
}

const closeModal = () => {
  emits('close')
}

const setSelectedAnimal = (val: string) => {
  if (!val) {
    breedDefaultList.length = 0
    breedList.value.length = 0
    return false
  }

  breedDefaultList.length = 0
  breedList.value.length = 0
  const codeFunc = getCommonTypeAnimalOptionList.value.find((item) => {
    return item.id_common === val
  }).code_func1
  breedDefaultList.push(
    ...getCommonBreedOptionList.value.filter(
      (common: any) => common.code_func1 == codeFunc
    )
  )
  breedList.value = [...breedDefaultList]
}

const selectDefaultEmployee = () => {
  data.value.id_employee_request = defaultEmployee
}

onMounted(async () => {
  // breedList.value = [...getCommonBreedOptionList.value]
  // breedDefaultList.push(...getCommonBreedOptionList.value)

  await customerUtils.getNextCustomerCode(data.value, { value: null })
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          急患 新規オーナー
        </q-toolbar-title>
        <div class="flex items-center">
          <div class="col-3">
            <MtFormPullDown
              label="施設名"
              v-model:selected="data.id_clinic"
              :options="getAllClinics"
              class="w-200"
            />
          </div>
          <div class="col-3 q-mx-md">
            <InputEmployeeOptGroup
              v-model:selected="data.id_employee_request"
              label="作成者 *"
              :rules="[aahValidations.validationSelection]"
              class="w-200 q-pa-none"
              show-select-default-employee
              @update:select-default-employee="selectDefaultEmployee"
            />
          </div>
        </div>
      </q-toolbar>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-md modal-content">
      <div :tabindex="1" class="col-lg-6 col-md-6 col-sm-12">
        <div class="row q-col-gutter-md">
          <div class="col-12 title1">オーナー様情報</div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              label="表示名 *"
              :tabindex="1"
              autofocus
              v-model="data.name_family"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              label="オーナー 姓"
              :tabindex="2"
              v-model="data.name_kana_family"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              label="電話1 *"
              :tabindex="3"
              v-model="data.phone1"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              label="オーナーCD"
              :tabindex="4"
              v-model="data.code_customer"
            />
          </div>
        </div>
      </div>
      <div class="col-lg-6 col-md-6 col-sm-12">
        <div class="row q-col-gutter-md">
          <div class="col-12 title1">急患ペット情報</div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtInputForm
              type="text"
              label="ペット名 *"
              :tabindex="10"
              v-model="data.name_pet"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtFormPullDown
              type="selection"
              v-model:selected="data.id_cm_animal"
              label="動物種別 *"
              :tabindex="11"
              :options="getCommonTypeAnimalOptionList"
              :rules="[aahValidations.validationSelection]"
              @update:selected="setSelectedAnimal"
            />
            <!-- @update:selected="selectingBreed" -->
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <template v-for="(type, i) in typePetGender" :key="i">
              <MtFormRadiobtn
                type="radio"
                size="28px"
                :tabindex="12"
                v-model:selected="data.type_pet_gender"
                :val="type.value"
                :label="type.label"
              />
            </template>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-12">
            <MtFilterSelect
              v-if="data.id_cm_animal"
              :options-default="breedDefaultList"
              v-model:options="breedList"
              v-model:selecting="data.id_cm_breed"
              label="ペット品種"
              :tabindex="13"
            />
          </div>
        </div>
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
          type="submit"
          :tabindex="20"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
<style lang="scss" scoped>
.modal-content {
  max-height: calc(100vh - 172px);
  overflow-y: auto;
}
</style>