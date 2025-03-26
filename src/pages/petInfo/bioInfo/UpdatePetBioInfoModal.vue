<script setup lang="ts">
import { onMounted, reactive, ref, withDefaults } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import {
  formatDateWithTime,
  formatHoursMinutes,
  getDateTimeNow,
  getDateToday,
  getHoursAfterByDate,
  applyModalBottomPadding,
  roundMinutesToNearest15,
  formatNumberWithDecimals,
  convertWeightInG
} from '@/utils/aahUtils'
import usePetBioStore from '@/stores/pet-bios'
import useCustomerStore from '@/stores/customers'
import aahValidations from '@/utils/aahValidations'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import usePetCustodyStore from '@/stores/pet-custodies'
import { timeHourMinute, typeBodyWeight } from '@/utils/enum'
import PetBioInfoTable from './PetBioInfoTable.vue'
import { PetBioInfoType } from '@/types/types'
import { storeToRefs } from 'pinia'
import MtSpinnerLoading from '@/components/MtSpinnerLoading.vue'
import { computed } from 'vue'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import _ from 'lodash'

const props = withDefaults(
  defineProps<{
    id_pet: number
    id_customer: number
    pet_bio_info?: string
    id_pet_bio_info: number
    date?: string
    from_request_page?: boolean
    defaultHour?: string
  }>(),
  {
    id_pet: 0,
    id_custoemr: 0,
    pet_bio_info: '',
    id_pet_bio_info: 0,
    date: '',
    from_request_page: false,
    defaultHour: ''
  }
)
const emits = defineEmits(['close'])
const petBioStore = usePetBioStore()
const petCustodyStore = usePetCustodyStore()
const customerStore = useCustomerStore()
const { getPetBios } = storeToRefs(petBioStore)

const measurment_HH_MM = ref('00:00')
const measurment_date = ref('')

const data = ref({
  id_pet: '',
  id_customer: '',
  val_weight: '',
  type_body_weight: 1,
  datetime_measure: '',
  val_temperature: '',
  val_pressure_systolic: '',
  val_pressure_diastolic: '',
  val_pressure_mean_arterial: '',
  val_blood_oxygen_level: '',
  val_blood_carbon_dioxide_level: '',
  val_respiration_rate: '',
  val_heartbeat_rate: '',
  memo_measure: '',
  id_pet_bio_info: 0
})
const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const disableSubmit = ref(false)
const isHistoryShown = ref(false)
const isLoading = ref(false)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 7

const goToPreviousPage = () => {
  currentPage.value--
}

const goToNextPage = () => {
  currentPage.value++
}
const typeBodyWeightName = (value: number) => typeBodyWeight.find((v) => v.value === value)?.label

const submit = async () => {
  if (isLoading.value) return
  if (
    !data.value.val_weight &&
    !data.value.val_temperature &&
    !data.value.val_pressure_systolic &&
    !data.value.val_pressure_diastolic &&
    !data.value.val_pressure_mean_arterial &&
    !data.value.val_blood_oxygen_level &&
    !data.value.val_blood_carbon_dioxide_level &&
    !data.value.val_respiration_rate &&
    !data.value.val_heartbeat_rate
  ) {
    mtUtils.autoCloseAlert(aahMessages.failed)
    return false
  }


  if (data.value.id_pet_bio_info == 0 || !data.value.id_pet_bio_info || data.value.id_pet_bio_info == null) delete data.value.id_pet_bio_info
  if (data.value.val_weight) data.value.val_weight = formatNumberWithDecimals(parseFloat(data.value.val_weight))
  if (data.value.val_temperature) data.value.val_temperature = formatNumberWithDecimals(parseFloat(data.value.val_temperature))
  if (data.value.val_pressure_systolic) data.value.val_pressure_systolic = formatNumberWithDecimals(parseFloat(data.value.val_pressure_systolic))
  if (data.value.val_pressure_diastolic) data.value.val_pressure_diastolic = formatNumberWithDecimals(parseFloat(data.value.val_pressure_diastolic))
  if (data.value.val_pressure_mean_arterial) data.value.val_pressure_mean_arterial = formatNumberWithDecimals(parseFloat(data.value.val_pressure_mean_arterial))
  if (data.value.val_blood_oxygen_level) data.value.val_blood_oxygen_level = formatNumberWithDecimals(parseFloat(data.value.val_blood_oxygen_level))
  if (data.value.val_blood_carbon_dioxide_level) data.value.val_blood_carbon_dioxide_level = formatNumberWithDecimals(parseFloat(data.value.val_blood_carbon_dioxide_level))
  if (data.value.val_respiration_rate) data.value.val_respiration_rate = formatNumberWithDecimals(parseFloat(data.value.val_respiration_rate))
  if (data.value.val_heartbeat_rate) data.value.val_heartbeat_rate = formatNumberWithDecimals(parseFloat(data.value.val_heartbeat_rate))

  disableSubmit.value = true
  if (measurment_date.value != '') {
    data.value.datetime_measure = measurment_date.value
    data.value.datetime_measure +=
      measurment_HH_MM.value !== null ? ' ' + measurment_HH_MM.value : ' 00'
    data.value.datetime_measure += ':00'
  }

  let val_weight = null
  if (data.value.val_weight) {
    val_weight = data.value.val_weight
    if (data.value.type_body_weight === 1) {
      val_weight = data.value.val_weight * 1000
    }
    val_weight = Number(val_weight).toFixed(2)
  }

  if (props.id_pet_bio_info) {
    const payload = { ...data.value, val_weight }
    await petBioStore.updatePetBio(props.id_pet_bio_info, payload)
    await petBioStore.fetchPetBio(
      {
        id_pet: props.id_pet,
        id_customer: props.id_customer
      }
    )
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
    disableSubmit.value = false
  } else {
    const payload = { ...data.value, val_weight }
    await petBioStore.submitPetBio(payload)
    if (props.date) {
      await petCustodyStore.fetchPetCustodies({ date: props.date })
    } else {
      await petBioStore.fetchPetBio({
        id_pet: props.id_pet,
        id_customer: props.id_customer
      })
    }
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
    disableSubmit.value = false
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
            petBioStore
              .destroyPetBio(petBioStore.getPetBio?.id_pet_bio_info)
              .then(() => {
                petBioStore.fetchPetBio({
                  id_pet: props.id_pet,
                  id_customer: props.id_customer
                })
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const closeModal = () => {
  emits('close')
}
const useLatestValWeight = () => {
  data.value.val_weight = parseFloat(
    convertWeightInG(
      petBioStore.getPetBioForHeader?.val_weight,
      petBioStore.getPetBioForHeader?.type_body_weight
    )
  )?.toFixed(2)
  data.value.type_body_weight = petBioStore.getPetBioForHeader?.type_body_weight
}
const dateupdate = (value: any) => {}
const fetchData = async () => {
  const filterData = {
    id_pet: props.id_pet,
    id_customer: props?.id_customer
  }

  try {
    isLoading.value = true
    await petBioStore.fetchPetBio(filterData)
  } catch (error) {
    await mtUtils.autoCloseAlert('データの取得中にエラーが発生しました')
  } finally {
    isLoading.value = false
  }
}

const openHistoryTab = async () => {
  isHistoryShown.value = true
  await fetchData()
}

const updateValue = (type) => {
  if (type == 'val_weight') data.value.val_weight = data.value.val_weight ? parseFloat(data.value.val_weight).toFixed(2) : ''
  if (type == 'val_temperature') data.value.val_temperature = data.value.val_temperature ? parseFloat(data.value.val_temperature).toFixed(1) : ''
}

const clearHistoryTab = () => {
  isHistoryShown.value = false

  data.value.val_weight = ''
  data.value.type_body_weight = 1
  data.value.datetime_measure = ''
  data.value.val_temperature = ''
  data.value.val_pressure_systolic = ''
  data.value.val_pressure_diastolic = ''
  data.value.val_pressure_mean_arterial = ''
  data.value.val_blood_oxygen_level = ''
  data.value.val_blood_carbon_dioxide_level = ''
  data.value.val_respiration_rate = ''
  data.value.val_heartbeat_rate = ''
  data.value.memo_measure = ''
}

const editPetBioInfo = (row: PetBioInfoType) => {
  
  // Update each property individually
  Object.keys(row).forEach((key) => {
    if(_.has(data.value, key)) {
      data.value[key] = row[key]
    }
  })

  // Handle specific conversions
  if (row.type_body_weight === 1) {
    data.value.val_weight = (parseFloat(row.val_weight) / 1000).toString()
  } else {
    data.value.val_weight = row.val_weight?.toString()
  }
}

const showPetBioInfoTable = computed(() => {
  return isHistoryShown.value && !isLoading.value
})

const paginatedPetBios = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return getPetBios.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(getPetBios.value.length / itemsPerPage)
})

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  // if (props.date) data.value.datetime_measure = props.date
  if (props.id_pet_bio_info) {
    data.value.val_weight = petBioStore.getPetBio?.val_weight?.toString()
    if (petBioStore.getPetBio?.type_body_weight == 1) {
      data.value.val_weight = petBioStore.getPetBio?.val_weight ? (
        parseInt(petBioStore.getPetBio?.val_weight) / 1000
      )?.toFixed(2) : ''
    }
    // measurment_HH_MM.value = Intl.DateTimeFormat('EN-GB', {
    //   hour: 'numeric',
    //   minute: 'numeric'
    // }).format(new Date(petBioStore.getPetBio?.datetime_measure))
    data.value.id_pet = petBioStore.getPetBio?.id_pet
    data.value.id_customer = petBioStore.getPetBio?.id_customer
    data.value.type_body_weight = petBioStore.getPetBio?.type_body_weight
    data.value.datetime_measure = petBioStore.getPetBio?.datetime_measure
    data.value.val_temperature = petBioStore.getPetBio?.val_temperature ? parseFloat(petBioStore.getPetBio?.val_temperature).toFixed(1) : ''
    data.value.val_pressure_systolic = petBioStore.getPetBio?.val_pressure_systolic
    data.value.val_pressure_diastolic = petBioStore.getPetBio?.val_pressure_diastolic
    data.value.val_pressure_mean_arterial =
      petBioStore.getPetBio?.val_pressure_mean_arterial
    data.value.val_blood_oxygen_level = petBioStore.getPetBio?.val_blood_oxygen_level
    data.value.val_blood_carbon_dioxide_level =
      petBioStore.getPetBio?.val_blood_carbon_dioxide_level
    data.value.val_respiration_rate = petBioStore.getPetBio?.val_respiration_rate
    data.value.val_heartbeat_rate = petBioStore.getPetBio?.val_heartbeat_rate
    data.value.memo_measure = petBioStore.getPetBio?.memo_measure

    measurment_date.value = formatDateWithTime(
      data.value.datetime_measure,
      'YYYY/MM/DD'
    )
    measurment_HH_MM.value = roundMinutesToNearest15(data.value.datetime_measure)

    Object.keys(data).forEach((key) => {
      if (
        [
          'val_weight',
          'val_temperature',
          'val_pressure_systolic',
          'val_pressure_diastolic',
          'val_pressure_mean_arterial',
          'val_blood_oxygen_level',
          'val_blood_carbon_dioxide_level',
          'val_respiration_rate',
          'val_heartbeat_rate'
        ].includes(key)
      ) {
        data[key] = data[key] ? parseFloat(data[key]) : ''
      }
      if (key === 'id_pet') {
      }
    })
  } else {
    const newTime = getDateTimeNow()
    const newMinute = formatHoursMinutes(newTime).split(':')[1]

    if (newMinute > 45) {
      measurment_HH_MM.value =
        formatDateWithTime(getHoursAfterByDate(newTime, 1), 'HH') + ':00'
    } else {
      measurment_HH_MM.value =
        formatHoursMinutes(newTime).split(':')[0] +
        ':' +
        Math.ceil(newMinute / 15) * 15
    }
  }

  await customerStore.selectCustomer(props.id_customer)
  customerStore.selectPet(props.id_pet)
  petList.value = customerStore.getCustomer.pets

  data.value.id_pet = props.id_pet
  data.value.id_customer = props.id_customer
  measurment_date.value = measurment_date.value
    ? measurment_date.value
    : props.date || getDateToday()
  applyModalBottomPadding()
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        生体情報 / TPR
      </q-toolbar-title>
      <q-btn flat @click="openHistoryTab">履歴を表示</q-btn>
      <q-btn flat @click="clearHistoryTab">クリア</q-btn>
      <q-btn v-if="props.id_pet_bio_info" flat round class="q-mx-sm" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section
      class="q-px-lg"
      style="overflow-y: scroll; max-height: 85vh"
      id="content-area"
    >
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFilterSelect
            label="診察券番号・オーナー名"
            v-model:selecting="data.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            :readonly="props.id_pet ? true : false"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtPetFilterSelect
            :pet-list="petList"
            v-model:selecting="data.id_pet"
            label="ペット名"
            :readonly="props.id_customer ? true : false"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormInputDate
            type="date"
            label="測定日時"
            v-model:date="measurment_date"
            @update:date="dateupdate"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormPullDown
            type="selection"
            v-model:selected="measurment_HH_MM"
            :options="timeHourMinute"
            required
            label="時：分 *"
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtFormInputNumber
            label="体重"
            autofocus
            tabindex="1"
            v-model:value="data.val_weight"
            decimalSize="2"
            @blur="updateValue('val_weight')"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <MtInputForm
            type="radio"
            :items="typeBodyWeight"
            v-model="data.type_body_weight"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6">
          <div @click="useLatestValWeight()" class="flex cursor-pointer items-center">
            <div>
              {{
                parseFloat(
                  convertWeightInG(
                    petBioStore.getPetBioForHeader?.val_weight,
                    petBioStore.getPetBioForHeader?.type_body_weight
                  )
                )?.toFixed(2)
              }}
              {{
                typeBodyWeightName(
                  petBioStore.getPetBioForHeader?.type_body_weight
                )
              }}
              <small class="q-ml-sm">{{ formatDateWithTime(petBioStore.getPetBioForHeader?.datetime_measure) }}</small>
            </div>
            <q-icon name="content_copy" size="10px" class="q-ml-sm" />
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text temp">
          <MtFormInputNumber
            label="体温 T"
            tabindex="3"
            v-model:value="data.val_temperature"
            decimalSize="1"
            @blur="updateValue('val_temperature')"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text bpm">
          <MtFormInputNumber
            label="心拍 P"
            tabindex="5"
            v-model:value="data.val_heartbeat_rate"
            mode="number"
          />
        </div>
        <div
          class="col-lg-3 col-md-3 col-sm-6 field-right-text respiration-amount"
        >
          <MtFormInputNumber
            label="呼吸数 R"
            tabindex="4"
            v-model:value="data.val_respiration_rate"
            mode="number"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text mmHg">
          <MtFormInputNumber
            label="収縮期血圧"
            tabindex="11"
            v-model:value="data.val_pressure_systolic"
            decimalSize="1"
            mode="dosage"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text mmHg">
          <MtFormInputNumber
            label="拡張期血圧"
            tabindex="12"
            v-model:value="data.val_pressure_diastolic"
            decimalSize="1"
            mode="dosage"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text mmHg">
          <MtFormInputNumber
            label="平均動脈圧"
            tabindex="13"
            v-model:value="data.val_pressure_mean_arterial"
            decimalSize="1"
            mode="dosage"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text blood-percent">
          <MtFormInputNumber
            label="血中酸素濃度"
            v-model:value="data.val_blood_oxygen_level"
            decimalSize="1"
            mode="dosage"
            tabindex="21"
          />
        </div>
        <div class="col-lg-3 col-md-3 col-sm-6 field-right-text blood-percent">
          <MtFormInputNumber
            label="血中二酸化炭素濃度"
            v-model:value="data.val_blood_carbon_dioxide_level"
            decimalSize="1"
            mode="dosage"
            tabindex="22"
          />
        </div>
      </div>
      <div class="row q-gutter-md q-mb-md">
        <div class="col">
          <MtInputForm
            type="text"
            label="測定時メモ"
            autogrow
            v-model="data.memo_measure"
            tabindex="31"
          />
        </div>
      </div>
      <div v-if="showPetBioInfoTable" class="bg-white">
        <PetBioInfoTable
          :pet-bio-list-data="paginatedPetBios"
          :current-page="currentPage"
          :total-pages="totalPages"
          @previous="goToPreviousPage"
          @next="goToNextPage"
          @edit-pet-bio-info="editPetBioInfo"
        />
      </div>
      <div
        v-else-if="isLoading"
        class="bg-white flex justify-center items-center"
      >
        <MtSpinnerLoading />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn
          type="submit"
          unelevated
          color="primary"
          tabindex="41"
          class="q-ml-md"
          :disabled="disableSubmit || isLoading"
          :loading="isLoading"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style>
/* Use these below calss with "field-right-text" */
.temp::after {
  content: '℃';
}

.mmHg::after {
  content: 'mmHg';
}

.blood-percent::after {
  content: '%';
}

.respiration-amount::after {
  content: '回/分';
}

.bpm::after {
  content: '回/分 (bpm)';
}
</style>
