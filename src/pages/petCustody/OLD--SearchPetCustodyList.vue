<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import AdditionalFilterPetCustodyModal from './AdditionalFilterPetCustodyModal.vue'
import mtUtils from '@/utils/mtUtils'
import { storeToRefs } from 'pinia'
import { aahUtilsGetEmployeeName, changeDate, dateDifferences, formatDate, formatHoursMinutes, getDateToday, getPetFirstName, getPetImageUrl, handleImageError } from '@/utils/aahUtils'
import UpdatePetBioInfoModal from '../petInfo/bioInfo/UpdatePetBioInfoModal.vue'
import UpdateBioConditionModal from '../petInfo/bioCondition/UpdateBioConditionModal.vue'
import usePetCustodyStore from '@/stores/pet-custodies'
import useBreedStore from '@/stores/breeds'
import useCageStore from '@/stores/cages'
import UpdatePetCustodyModal from './UpdatePetCustodyModal.vue'
import MtFormCheckBoxMultiple from '@/components/form/MtFormCheckBoxMultiple.vue'
import useCageConditionStore from '@/stores/cage-conditions'
import ExportPets from './ExportPets.vue'
import MtTable2 from '@/components/MtTable2.vue'
import useEmployeeStore from '@/stores/employees'
import UpdateFeedModal from './UpdateFeedModal.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import _ from 'lodash'
import useClinicStore from '@/stores/clinics'
import useRoomStore from '@/stores/rooms'
import useFoodPrepStore from '@/stores/food-prep'
import ViewPetDetailModal from '../master/customerPet/ViewPetDetailModal.vue'
import usePetBioStore from '@/stores/pet-bios'
import { Platform } from 'quasar'
import PetTaskModal from './PetTaskModal.vue'
import { useRoute } from 'vue-router'
import useCommonStore from '@/stores/common'
import { GenericValueLabelType, PetCustodyType, PetBioInfoType } from '@/types/types'

const commonStore = useCommonStore()
const petCustodyStore = usePetCustodyStore()
const breedStore = useBreedStore()
const cageStore = useCageStore()
const clinicStore = useClinicStore()
const employeeStore = useEmployeeStore()
const foodPrepStore = useFoodPrepStore()
const cageConditionStore = useCageConditionStore()
const roomStore = useRoomStore()
const {
  getCommonTypeReviewFood,
  getCommonTypeReviewWater,
  getCommonTypeReviewFeces,
  getCommonTypeReviewUrine,
  getCommonTypeReviewVomit,
  getCommonTypeReviewRespiration,
  getCommonTypeReviewWellness,
  getCommonTypeReviewBodyTemprature
} = storeToRefs(commonStore)
const { getPetCustodies } = storeToRefs(petCustodyStore)
const { getCageCondition } = storeToRefs(cageConditionStore)
const { getAllClinics } = storeToRefs(clinicStore)
const { getAllRooms } = storeToRefs(roomStore)
const petBioStore = usePetBioStore()
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])
const tableData = ref<any>([])
const rooms = ref<any>([])
const clinicId = ref(JSON.parse(localStorage.getItem('id_clinic')) ?? null)
const isTableProcessed = ref(false)

const allBreeds = computed(() => breedStore.allBreeds)


const allColumns = [
  {
    name: 'datetime_record',
    label: '',
    field: 'datetime_record',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'check',
    label: '',
    field: 'check',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_food',
    label: '食事',
    field: 'type_review_food',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_water',
    label: '水分',
    field: 'type_review_water',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_feces',
    label: '排便',
    field: 'type_review_feces',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_urine',
    label: '排尿',
    field: 'type_review_urine',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_vomit',
    label: '嘔吐',
    field: 'type_review_vomit',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_respiration',
    label: '呼吸',
    field: 'type_review_respiration',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_wellness',
    label: '活動',
    field: 'type_review_wellness',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'type_review_body_temperature',
    label: '体温',
    field: 'type_review_body_temperature',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'id_employee_reviewed',
    label: '',
    field: 'id_employee_reviewed',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'memo_record',
    label: '',
    field: 'memo_record',
    align: 'left',
    style: 'width: auto'
  }
]

const route = useRoute()
const columns = Platform.is.mobile
  ? allColumns.filter((column) => column.field != 'check')
  : allColumns

const all_bio_info_columns = [
  {
    name: 'datetime_measure',
    label: '',
    field: 'datetime_measure',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'check',
    label: '',
    field: 'check',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_temperature',
    label: '体温',
    field: 'val_temperature',
    type: 'numeric',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_respiration_rate',
    label: '呼吸数',
    field: 'val_respiration_rate',
    type: 'numeric',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_heartbeat_rate',
    label: '心拍',
    type: 'numeric',
    field: 'val_heartbeat_rate',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_pressure_systolic',
    label: '収/圧',
    type: 'numeric',
    field: 'val_pressure_systolic',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_pressure_diastolic',
    label: '拡/圧',
    type: 'numeric',
    field: 'val_pressure_diastolic',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_pressure_mean_arterial',
    label: '平/圧',
    type: 'numeric',
    field: 'val_pressure_mean_arterial',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_blood_oxygen_level',
    label: 'SpO2',
    field: 'val_blood_oxygen_level',
    type: 'numeric',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'val_blood_carbon_dioxide_level',
    label: 'Pco2',
    type: 'numeric',
    field: 'val_blood_carbon_dioxide_level',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'id_employee_insert',
    label: '',
    field: 'id_employee_insert',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'memo_measure',
    label: '',
    field: 'memo_measure',
    align: 'left',
    style: 'width: auto'
  }
]
const bio_info_columns = Platform.is.mobile
  ? all_bio_info_columns.filter((column) => column.field != 'check')
  : all_bio_info_columns

const info = ref({
  date: getDateToday(),
  idRoom: [] as string[],
  id_pet_custody: null
})

const foodPrepList = ref<Array<GenericValueLabelType>>([])
const foodPrepListDefault = reactive<Array<GenericValueLabelType>>([])

const breedName = (value: string) => {
  return allBreeds.value.find((v) => v.value === value)?.label
}
const getCage = (value: string) => {
  return cageStore.getAllCages.find((v) => v.value === value)?.name_cage
}
const getCageMemo = (value: string) => {
  return cageConditionStore.getAllCageCondtions.find((v) => v.value === value)
    ?.memo_cage_condition
}
const getFoodName = (value: string) => {
  return foodPrepStore.getAllFoodPreps.find((v) => v.value === value)
    ?.name_food_prep
}
const openUpdatePetCustodyModal = async (data: PetCustodyType) => {
  let updatedFlg = { value: false }
  await mtUtils.popup(UpdatePetCustodyModal, {
    data,
    id_customer: data.id_customer,
    id_pet: data.id_pet,
    updatedFlg
  })
  await init()
  await handleTableData()
}
const openPetCustodyEditModal = async () => {
  await mtUtils.popup(UpdatePetCustodyModal)
  await init()
  await handleTableData()
}
const openSearchModal = async () => {
  await mtUtils.mediumPopup(AdditionalFilterPetCustodyModal)
}
const openAddBioConditionModal = async (
  id_customer: string,
  id_pet: string
) => {
  await mtUtils.popup(UpdateBioConditionModal, {
    id_customer,
    id_pet,
    date: info.value.date
  })
  await init()
  await handleTableData()
}
const openAddPetBioInfoModal = async (id_customer: string, id_pet: string) => {
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {
    id_customer,
    id_pet,
    date: info.value.date
  })
  await init()
  await handleTableData()
}
const openAddFeedModal = async (
  id_Customer: string,
  id: string,
  data?: PetCustodyType
) => {
  const id_pet_custody = id
  const customer_Id = id_Customer
  let updatedFlg = { value: false }
  // if not edit then set default foodPrep based on selected custody's foodPrep
  const foodPrepIds = {
    id_food_prep1: data?.id_food_prep1,
    id_food_prep2: data?.id_food_prep2
  }
  await mtUtils.popup(UpdateFeedModal, {
    id_pet_custody,
    data,
    updatedFlg,
    customer_Id,
    foodPrepIds,
    feedPlanDate: info.value.date
  })
  await init()
  await handleTableData()
}
const openEditBioInfoModal = async (
  id_customer: string,
  id_pet: string,
  bio_info: PetBioInfoType
) => {
  petBioStore.selectPetBio(bio_info)
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {
    id_customer,
    id_pet,
    id_pet_bio_info: bio_info?.id_pet_bio_info
  })
  await init()
  await handleTableData()
}
const openEditBioConditionModal = async (
  id_customer: string,
  id_pet: string,
  bio_condition: PetBioInfoType
) => {
  let updatedFlg = { value: false }
  await mtUtils.popup(UpdateBioConditionModal, {
    id_customer,
    id_pet,
    pet_bio_condition: bio_condition,
    date: info.value.date,
    updatedFlg
  })

  if (updatedFlg.value) {
    await init()
    await handleTableData()
  }
}
const onRowClick = (custody: PetCustodyType, row: PetBioInfoType) => {
  if (row?.id_feed) {
    openAddFeedModal(custody?.id_customer, custody?.id_pet_custody, row)
  } else if (row?.id_pet_bio_info) {
    openEditBioInfoModal(custody?.id_customer, custody.id_pet, row)
  } else {
    openEditBioConditionModal(custody?.id_customer, custody.id_pet, row)
  }
}
const openTaskModal = async (custody: PetCustodyType) => {
  const { id_customer, id_pet, id_request } = custody
  await mtUtils.popup(PetTaskModal, { id_customer, id_pet, id_request })
}
const changeDates = async (prefix: string) => {
  if (prefix != 'selected') {
    info.value.date = changeDate(info.value.date, prefix)
  }
  await init()
  await handleTableData()
}
const petCustodyList = ref<Array<PetCustodyType>>([])

function processPetCustodyList() {
  petCustodyList.value = getPetCustodies.value.filter((v) => {
    if (info.value.idRoom.length) {
      return info.value.idRoom.includes(v.room.id_room)
    } else {
      return true
    }
  })
}
const overNightCondition = (date1: string, date2: string) => {
  if (dateDifferences(date1, date2) === 0) {
    return false
  }
  return true
}
const goTo = () => {
  window.open(`/SearchCustodyChecklistList/`, '_blank')
  return false
}
const init = async () => {
  if (route?.query?.id_pet_custody) {
    info.value.date = null
    info.value.id_pet_custody = route.query.id_pet_custody
  }

  await Promise.all([
    petCustodyStore.fetchPetCustodies({
      date: info.value.date,
      id_pet_custody: info.value.id_pet_custody
    }),
    cageConditionStore.fetchCageConditions(),
    // clinic store presist is false, because of that can't get clinic preparation data ontime, that's why calling preparation api here
    clinicStore.fetchPreparatioClinic()
  ])

  if (getAllClinics.value) {
    allClinicList.value = [...getAllClinics.value]
    allClinicListDefault.push(...getAllClinics.value)
  }
}
const selectingClinic = (value: any) => {
  if (value) {
    const filteredRoom = getAllRooms.value.filter(
      (room: any) => room?.id_clinic == value
    )
    // const finalArr = filteredRoom?.length > 0 ? filteredRoom[0].rooms : []
    rooms.value = filteredRoom.map((room: any) => {
      let custody = getPetCustodies.value.filter((cus: any) => {
        return room.id_room === cus.room?.id_room
      })
      return {
        value: room.id_room,
        label: room.name_room + ' ( ' + custody.length + ' )',
        class: custody.length === 0 ? 'text-grey-500' : ''
      }
    })
  } else {
    rooms.value.length = 0
    info.value.idRoom.length = 0
  }
}
const handlePetConditionIcon = (value: any, code_common: number) => {
  if (value) {
    let common_icon = null
    if (code_common === 17) {
      common_icon = getCommonTypeReviewFood.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 18) {
      common_icon = getCommonTypeReviewWater.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 19) {
      common_icon = getCommonTypeReviewFeces.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 20) {
      common_icon = getCommonTypeReviewUrine.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 21) {
      common_icon = getCommonTypeReviewVomit.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 22) {
      common_icon = getCommonTypeReviewRespiration.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 23) {
      common_icon = getCommonTypeReviewWellness.value?.find((v) => v.id_common === value)?.code_func2
    } else if (code_common === 24) {
      common_icon = getCommonTypeReviewBodyTemprature.value?.find((v) => v.id_common === value)?.code_func2
    }

    if (common_icon === '1') {
      return '●'
    } else if (common_icon === '2') {
      return '▲'
    } else if (common_icon === '3') {
      return '▼'
    } else if (common_icon === '4') {
      return common_icon
    }
  } else {
    return ''
  }
}
const handlePetConditionStyle = (value: any, code_common: number) => {
  if (value) {
    let common_color = null
    if (code_common === 17) {
      common_color = getCommonTypeReviewFood.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 18) {
      common_color = getCommonTypeReviewWater.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 19) {
      common_color = getCommonTypeReviewFeces.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 20) {
      common_color = getCommonTypeReviewUrine.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 21) {
      common_color = getCommonTypeReviewVomit.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 22) {
      common_color = getCommonTypeReviewRespiration.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 23) {
      common_color = getCommonTypeReviewWellness.value?.find((v) => v.id_common === value)?.text2
    } else if (code_common === 24) {
      common_color = getCommonTypeReviewBodyTemprature.value?.find((v) => v.id_common === value)?.text2
    }

    return 'color: ' + common_color
  } else {
    return ''
  }
}
async function generateReport() {
  let petList = petCustodyList.value
  await mtUtils.popup(ExportPets, { petList })
}
const openRequestPage = (request: any) => {
  window.open(`/SearchRequestList/${request.id_request}`, '_blank')
  return false
}
const handleTableData = async () => {
  processPetCustodyList()
  tableData.value.length = 0
  petCustodyList.value?.map(async (cstdy: any, index: any) => {
    const sortedPetBioConditionList = _.sortBy(
      cstdy?.pet_bio_condition_list,
      'datetime_record',
      'asc'
    )
    const sortedListResult = _.sortBy(
      cstdy?.feed_list,
      'datetime_feed_result',
      'asc'
    )
    const sortedFeedList = sortedListResult.sort((a, b) =>
      a?.datetime_feed_result !== null
        ? a?.datetime_feed_result
        : a?.datetime_feed_plan > b?.datetime_feed_plan
        ? 1
        : -1
    )
    tableData.value.push(sortedPetBioConditionList?.concat(sortedFeedList))
    if (tableData.value[index]) {
      tableData.value[index].sort((dateA: any, dateB: any) => {
        if (dateA?.datetime_feed_result) {
          return dateA?.datetime_feed_result < dateB?.datetime_record ? -1 : 1
        } else if (dateA?.datetime_feed_plan) {
          return dateA?.datetime_feed_plan < dateB?.datetime_record ? -1 : 1
        }
      })
    }
  })
  isTableProcessed.value = true
}

const openPetDetail = async (customerId: string, petId: string) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: customerId,
    id_pet: petId
  })
}

onMounted(async () => {
  commonStore.fetchPreparationCommonList({
    code_common: [17, 18, 19, 20, 21, 22, 23, 24]
  })
  clinicStore.fetchClinics()
  await init()
  await roomStore.fetchPreparationRooms()
  handleTableData()
  // await petBioStore.fetchPetBio({
  //   id_customer : customerId
  // })
  foodPrepList.value.length = 0
  foodPrepListDefault.length = 0
  foodPrepListDefault.push(...foodPrepStore.getAllFoodPreps)
  foodPrepList.value = [...foodPrepListDefault]

  if (clinicId.value) selectingClinic(clinicId.value)

  if (route?.query?.id_pet_custody) {
    const tempCustody = petCustodyList.value.find(
      (petCustody: PetCustodyType) =>
        petCustody.id_pet_custody == route?.query?.id_pet_custody
    )
    await openUpdatePetCustodyModal(tempCustody)
  }
})
const handleEmpName = (empId: any) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}
</script>

<template>
  <!-- We need to pass noScroll in the props to make sure it does not include the 'fixed' class b/c it cause issue with this new structure. -->
  <MtHeader :noScroll="true">
    <q-toolbar class="text-primary q-pa-none">
      <q-toolbar-title class="title2 bold text-grey-900">
        預かり・入院管理
      </q-toolbar-title>
      <q-space />
      <div class="text-blue q-mr-sm gt-md">
        <q-btn
          flat
          unelevated
          @click="generateReport()"
          :disable="!petCustodyList.length"
        >
          <q-icon size="18px" name="print" />
          <span class="q-ml-xs">帳票出力</span>
        </q-btn>
      </div>
      <q-btn
        @click="goTo()"
        unelevated
        padding="7px 12px"
        color="primary"
        text-color="white"
        class="q-mr-md"
      >
        預り品一覧
      </q-btn>
      <q-btn
        @click="openPetCustodyEditModal()"
        unelevated
        padding="7px 12px"
        color="primary"
        text-color="white"
        class="q-mr-md"
      >
        <q-icon name="add" class="q-mr-sm" size="20" />
        預り動物
      </q-btn>
      <q-btn @click="init()" flat unelevated>
        <q-icon size="20px" name="refresh" />
      </q-btn>
      <q-btn

        @click="openSearchModal"
        outline
        class="q-ml-sm lt-lg"
      >
        詳細検索
      </q-btn>
      <div class="q-ml-md flex items-between gt-md">
        <q-btn
          @click="changeDates('prev')"
          padding="2px"
          flat
          unelevated
          icon="chevron_left"
          style="border: 1px solid #9e9e9e"
        />
        <MtFormInputDate
          outlined
          type="date"
          v-model:date="info.date"
          class="search-field q-mx-xs"
          @update:date="changeDates('selected')"
        />
        <q-btn
          @click="changeDates('next')"
          padding="2px"
          flat
          unelevated
          icon="chevron_right"
          style="border: 1px solid #9e9e9e"
        />
      </div>
    </q-toolbar>
  </MtHeader>
  <q-layout container :style="{ height: 'calc(100vh - 70px)' }">
    <q-page-container>
      <q-page>
        <div class="q-pa-md">
          <div class="flex items-center justify-between q-mb-md">
            <div class="q-mb-sm gt-md">
              <MtFilterSelect
                :options-default="allClinicListDefault"
                v-model:options="allClinicList"
                v-model:selecting="clinicId"
                label="施設"
                @update:selecting="selectingClinic"
              />
            </div>
            <div class="q-mb-sm gt-md">
              <MtFormCheckBoxMultiple
                :items="rooms"
                class="q-mr-md"
                v-model:checked="info.idRoom"
              >
              </MtFormCheckBoxMultiple>
            </div>
            <div class="title2 bold text-grey-900">
              <span>預かり中</span>
              <span class="q-ml-sm">（{{ petCustodyList.length }}）</span>
            </div>
          </div>
          <div
            v-for="(custody, index) in petCustodyList"
            :key="custody.id_pet_custody"
            class="pet-custody-list"
          >
            <div class="q-mb-xl">
              <div
                @click="openUpdatePetCustodyModal(custody)"
                class="row q-col-gutter-md cursor-pointer q-pb-lg"
              >
                <div
                  class="col-auto q-mr-sm"
                  @click.stop="
                    openPetDetail(custody?.id_customer, custody?.pet?.id_pet)
                  "
                >
                  <img
                    :alt="custody?.pet?.id_pet"
                    :src="getPetImageUrl(custody?.pet)"
                    @error="handleImageError($event, custody?.pet)"
                    spinner-color="white"
                    style="width: 110px; height: 110px"
                    class="roundedImage cursor-pointer"
                    loading="lazy"
                  />
                </div>
                <div class="col-auto q-mr-lg">
                  <div class="flex items-center q-mb-sm">
                    <span
                      v-if="custody?.flg_hospitalization"
                      class="hospitalization-tag q-mr-md"
                    >
                      入院
                    </span>
                    <q-btn
                      unelevated
                      @click.stop="
                        openPetDetail(
                          custody?.id_customer,
                          custody?.pet?.id_pet
                        )
                      "
                      padding="0px"
                    >
                      <span class="large-title bold text-blue q-pa-none">
                        {{ getPetFirstName(custody?.pet) }}</span
                      >
                    </q-btn>
                    <span class="large-title bold text-grey-900 q-ml-md">
                      {{ breedName(custody?.pet?.id_breed) }}
                    </span>
                  </div>
                  <div class="text-grey-700 q-mb-xs">
                    <small class="text-grey-500">ケージ準備： </small>
                    {{ getCageMemo(custody.id_cage_condition) }}
                  </div>
                  <div class="text-grey-700 q-mb-xs">
                    <small class="text-grey-500">ケージ#： </small>
                    {{ getCage(custody?.id_cage) }}
                  </div>
                  <div v-if="custody.request">
                    <div class="text-grey-700">
                      <small class="text-grey-500">リクエスト#： </small>
                      {{ custody.request?.number_request }}
                      <small class="text-grey-500 q-ml-md">担当医： </small>
                      {{ handleEmpName(custody.request?.id_employee_doctor) }}
                    </div>
                  </div>
                </div>
                <div class="col">
                  <div class="text-grey-700">
                    <small class="text-grey-500">預かり期間： </small>
                    <span v-if="custody.datetime_start_plan">{{
                      formatDate(custody.datetime_start_plan)
                    }}</span>
                    <span class="q-ml-sm" v-if="custody.datetime_start_plan">{{
                      formatHoursMinutes(custody.datetime_start_plan)
                    }}</span>
                    <span class="q-mx-sm" v-if="custody.datetime_goal_plan"
                      >～</span
                    >
                    <span v-if="custody.datetime_goal_plan">{{
                      formatDate(custody.datetime_goal_plan)
                    }}</span>
                    <span class="q-ml-sm" v-if="custody.datetime_goal_plan">{{
                      formatHoursMinutes(custody.datetime_goal_plan)
                    }}</span>
                    <q-chip
                      v-if="
                        overNightCondition(
                          custody.datetime_start_plan,
                          custody.datetime_goal_plan
                        )
                      "
                      class="bg-accent-200 text-accent-900 q-ml-sm"
                    >
                      連日
                    </q-chip>
                  </div>
                  <div v-if="custody.request">
                    <div class="text-grey-700 q-mb-sm">
                      <small class="text-grey-500">ごはん準備： </small>
                      {{ getFoodName(custody.id_food_prep1) }}
                      <span v-if="custody.id_food_prep2">
                        {{ ', ' + ' ' + getFoodName(custody.id_food_prep2) }}
                      </span>
                    </div>
                  </div>
                  <div class="text-grey-700">
                    <small class="text-grey-500">メモ： </small>
                    {{ custody.memo }}
                  </div>
                </div>
                <q-space></q-space>
                <div class="col-auto q-mx-sm">
                  <q-btn
                    class="repeat-task-btn"
                    @click.stop="openTaskModal(custody)"
                  >
                    <q-icon name="checklist_rtl" class="q-mr-sm" size="20" />
                    タスク
                  </q-btn>
                </div>
                <div v-if="custody.request" class="col-auto">
                  <q-btn
                    @click.stop="openRequestPage(custody.request)"
                    label="リクエスト"
                  >
                    <q-icon name="open_in_new" class="q-mr-sm" size="20" />
                  </q-btn>
                </div>
              </div>
              <div style="padding-top: 0">
                <MtTable2
                  :columns="columns"
                  :rows="tableData[index]"
                  :rowsBg="true"
                  flat
                  no-data-message="登録がありません。"
                  no-result-message="該当のデータが見つかりませんでした"
                >
                  <template v-slot:row="{ row }">
                    <td
                      v-for="(col, index) in columns"
                      :key="index"
                      @click="onRowClick(custody, row)"
                      class="cursor-pointer"
                    >
                      <template v-if="col.field == 'datetime_record'">
                        <span class="q-mt-lg">{{
                          formatHoursMinutes(
                            row.datetime_feed_result
                              ? row.datetime_feed_result
                              : row?.datetime_feed_plan
                              ? row?.datetime_feed_plan
                              : row.datetime_record
                          )
                        }}</span>
                        <div class="flex items-end no-wrap mobile-only">
                          <q-icon
                            v-if="
                              row?.id_feed ? row.datetime_feed_result : true
                            "
                            size="18px"
                            name="check"
                            class="text-grey-900 q-mb-sm"
                          />
                          <span
                            class="q-ml-sm q-mb-xs"
                            style="white-space: pre"
                            >{{
                              row?.datetime_feed_result ? '給餌' : '状態'
                            }}</span
                          >
                        </div>
                      </template>
                      <template v-else-if="col.field == 'check'">
                        <div class="flex items-end q-ml-sm no-wrap">
                          <q-icon
                            v-if="
                              row?.id_feed ? row.datetime_feed_result : true
                            "
                            size="18px"
                            name="check"
                            class="text-grey-900 q-mb-sm"
                          />
                          <span
                            class="q-ml-sm q-mb-xs"
                            style="white-space: pre"
                            >{{
                              row?.id_feed
                                ? row.datetime_feed_result
                                  ? '給餌完了'
                                  : '給餌予定'
                                : 'Check'
                            }}</span
                          >
                        </div>
                      </template>
                      <template v-else-if="col.field == 'type_review_food'">
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_food, 17) != '4' &&
                            row?.id_feed
                          "
                          :style="handlePetConditionStyle(row.type_review_food, 17)"
                        >
                          {{
                            handlePetConditionIcon(row.type_review_food, 17)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_food, 17) === '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template v-else-if="col.field == 'type_review_water'">
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_water, 18) != '4'
                          "
                          :style="
                            handlePetConditionStyle(row.type_review_water, 18)
                          "
                        >
                          {{
                            handlePetConditionIcon(row.type_review_water, 18)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_water, 18) ===
                            '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template v-else-if="col.field == 'type_review_feces'">
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_feces, 19) != '4'
                          "
                          :style="
                            handlePetConditionStyle(row.type_review_feces, 19)
                          "
                        >
                          {{
                            handlePetConditionIcon(row.type_review_feces, 19)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_feces, 19) ===
                            '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template v-else-if="col.field == 'type_review_urine'">
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_urine, 20) != '4'
                          "
                          :style="
                            handlePetConditionStyle(row.type_review_urine, 20)
                          "
                        >
                          {{
                            handlePetConditionIcon(row.type_review_urine, 20)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_urine, 20) ===
                            '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template v-else-if="col.field == 'type_review_vomit'">
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_vomit, 21) != '4'
                          "
                          :style="
                            handlePetConditionStyle(row.type_review_vomit, 21)
                          "
                        >
                          {{
                            handlePetConditionIcon(row.type_review_vomit, 21)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_vomit, 21) ===
                            '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template
                        v-else-if="col.field == 'type_review_respiration'"
                      >
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_respiration, 22) != '4'
                          "
                          :style="
                            handlePetConditionStyle(row.type_review_respiration, 22)
                          "
                        >
                          {{
                            handlePetConditionIcon(row.type_review_respiration, 22)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_respiration, 22) === '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template v-else-if="col.field == 'type_review_wellness'">
                        <span
                          v-if="
                            handlePetConditionIcon(row.type_review_wellness, 23) != '4'
                          "
                          :style="
                            handlePetConditionStyle(row.type_review_wellness, 23)
                          "
                        >
                          {{
                            handlePetConditionIcon(row.type_review_wellness, 23)
                          }}</span
                        >
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(row.type_review_wellness, 23) ===
                            '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template
                        v-if="col.field == 'type_review_body_temperature'"
                      >
                        <span
                          v-if="
                            handlePetConditionIcon(
                              row.type_review_body_temperature,
                              24
                            ) != '4'
                          "
                          :style="
                            handlePetConditionStyle(
                              row.type_review_body_temperature,
                              24
                            )
                          "
                        >
                          {{
                            handlePetConditionIcon(
                              row.type_review_body_temperature,
                              24
                            )
                          }}
                        </span>
                        <q-icon
                          v-else-if="
                            handlePetConditionIcon(
                              row.type_review_body_temperature,
                              24
                            ) === '4'
                          "
                          size="19px"
                          name="help"
                          class="q-ml-sm text-grey-600"
                        />
                      </template>
                      <template v-else-if="col.field == 'id_employee_reviewed'">
                        <span
                          class="ellipsis"
                          v-if="
                            row.id_employee_fed || row?.id_employee_reviewed
                          "
                          >[{{
                            handleEmpName(
                              row?.id_employee_fed
                                ? row.id_employee_fed
                                : row?.id_employee_reviewed
                            )
                          }}]</span
                        >
                      </template>
                      <template v-else-if="col.field == 'memo_record'">
                        <div class="ellipsis tableRow">
                          {{
                            row?.memo_observation
                              ? row.memo_observation
                              : row?.memo_record
                          }}
                        </div>
                      </template>
                    </td>
                  </template>
                </MtTable2>
                <MtTable2
                  :columns="bio_info_columns"
                  :rows="custody?.pet_bio_info_list"
                  :rowsBg="true"
                  flat
                  class="q-mt-lg"
                  no-data-message="登録がありません。"
                  no-result-message="該当のデータが見つかりませんでした"
                >
                  <template v-slot:row="{ row }">
                    <td
                      v-for="(col, index) in bio_info_columns"
                      :key="index"
                      @click="onRowClick(custody, row)"
                      class="cursor-pointer"
                    >
                      <template v-if="col.field == 'datetime_measure'">
                        <span class="q-mt-lg">{{
                          formatHoursMinutes(
                            row.datetime_feed_result
                              ? row.datetime_feed_result
                              : row?.datetime_feed_plan
                              ? row?.datetime_feed_plan
                              : row.datetime_measure
                          )
                        }}</span>
                        <div class="flex items-end no-wrap mobile-only">
                          <q-icon
                            v-if="
                              row?.id_feed ? row.datetime_feed_result : true
                            "
                            size="18px"
                            name="check"
                            class="text-grey-900 q-mb-sm"
                          />
                          <span
                            class="q-ml-sm q-mb-xs"
                            style="white-space: pre"
                            >{{
                              row?.id_feed
                                ? row.datetime_feed_result
                                  ? '給餌完了'
                                  : '給餌予定'
                                : 'TPR'
                            }}</span
                          >
                        </div>
                      </template>
                      <template v-else-if="col.field == 'check'">
                        <div class="flex items-end q-ml-sm no-wrap">
                          <q-icon
                            v-if="
                              row?.id_feed ? row.datetime_feed_result : true
                            "
                            size="18px"
                            name="check"
                            class="text-grey-900 q-mb-sm"
                          />
                          <span
                            class="q-ml-sm q-mb-xs"
                            style="white-space: pre"
                            >{{
                              row?.id_feed
                                ? row.datetime_feed_result
                                  ? '給餌完了'
                                  : '給餌予定'
                                : 'TPR'
                            }}</span
                          >
                        </div>
                      </template>
                      <template v-else-if="col.field === 'id_employee_insert'">
                        <span class="ellipsis">
                          [{{ handleEmpName(row?.id_employee_insert) }}]
                        </span>
                      </template>
                      <template v-else-if="col.type === 'numeric'">
                        {{
                          row[col.field]
                            ? parseFloat(row[col.field]).toFixed(1)
                            : ''
                        }}
                      </template>
                      <template v-else-if="col.field == 'memo_measure'">
                        <div class="ellipsis tableRow">
                          {{ row?.memo_measure }}
                        </div>
                      </template>
                      <template v-else>
                        {{ row[col.field] ? row[col.field] : '' }}
                      </template>
                    </td>
                  </template>
                </MtTable2>
                <div>
                  <div class="flex items-center justify-end q-pb-md">
                    <q-btn
                      unelevated
                      padding="7px 15px"
                      color="primary"
                      text-color="white"
                      @click="
                        openAddFeedModal(
                          custody?.id_customer,
                          custody?.id_pet_custody,
                          custody
                        )
                      "
                      class="q-mr-lg "
                    >
                      <q-icon name="add" class="q-mr-sm" size="20" />
                      ごはん
                    </q-btn>
                    <q-btn
                      unelevated
                      padding="7px 15px"
                      color="primary"
                      text-color="white"
                      class="q-mr-lg "
                      @click="
                        openAddBioConditionModal(
                          custody?.id_customer,
                          custody.id_pet
                        )
                      "
                    >
                      <q-icon name="add" class="q-mr-sm" size="20" />
                      状態
                    </q-btn>
                    <q-btn
                      unelevated
                      padding="7px 15px"
                      color="primary"
                      text-color="white"
                      class=""
                      @click="
                        openAddPetBioInfoModal(
                          custody?.id_customer,
                          custody.id_pet
                        )
                      "
                    >
                      <q-icon name="add" class="q-mr-sm" size="20" />
                      TPR
                    </q-btn>
                  </div>
                </div>
              </div>
              <hr class="darkgrey" />
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style lang="scss" scoped>
.indicator {
  position: fixed;
  right: 0;
  z-index: 5;
  top: 54px;
  background: white;
  padding: 10px;
  border-left: 1px solid #d6d6d6;
  border-bottom: 1px solid #d6d6d6;
  border-right: 1px solid #d6d6d6;
}
.pet-custody-list:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
.tableRow {
  width: 40vh;
  text-overflow: ellipsis;
  overflow: hidden;
}

.hospitalization-tag {
  background-color: #004794;
  font-size: 15px !important;
  font-weight: 500 !important;
  color: #e4eeff;
  border-radius: 5px;
  letter-spacing: 4px;
  padding: 4px 5px 4px 14px !important;
}
</style>
