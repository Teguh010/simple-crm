<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import {
  aahUtilsGetEmployeeName,
  changeDate,
  dateDifferences,
  dateFormat,
  formatDate,
  formatHours,
  formatHoursMinutes,
  getDateToday,
  getFullPetName,
  getHourListADay,
  getPetFirstName,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import { computed, onMounted, reactive, ref } from 'vue'
import ViewPetDetailModal from '../master/customerPet/ViewPetDetailModal.vue'
import mtUtils from '@/utils/mtUtils'
import useBreedStore from '@/stores/breeds'
import useCageStore from '@/stores/cages'
import useCageConditionStore from '@/stores/cage-conditions'
import useFoodPrepStore from '@/stores/food-prep'
import useEmployeeStore from '@/stores/employees'
import {
  PetBioConditionType,
  PetBioInfoType,
  PetCustodyType,
  TaskType
} from '@/types/types'
import useTask from '@/stores/task'
import { storeToRefs } from 'pinia'
import UpdateFeedModal from './UpdateFeedModal.vue'
import UpdatePetBioInfoModal from '../petInfo/bioInfo/UpdatePetBioInfoModal.vue'
import UpdateBioConditionModal from '../petInfo/bioCondition/UpdateBioConditionModal.vue'
import usePetBioStore from '@/stores/pet-bios'
import TodoTaskItem from '../task/TodoTaskItem.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtTable2 from '@/components/MtTable2.vue'
import { groupBy, sortBy } from 'lodash'
import useCommonStore from '@/stores/common'
import usePetCustodyStore from '@/stores/pet-custodies'
import UpdatePetCustodyModal from './UpdatePetCustodyModal.vue'
import selectOptions from '@/utils/selectOptions'
import OptionModal from '@/components/OptionModal.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useRoomStore from '@/stores/rooms'
import { useRouter } from 'vue-router'
import { setPageTitle } from '@/utils/pageTitleHelper'
import aahMessages from '@/utils/aahMessages'

type TableRowType = {
  label: string
  field: string
  is_header: boolean
  type: string
}

type TableColumnType = {
  name: string
  label: string
  align: string
  field: string
}

const router = useRouter()

const props = defineProps({ selectedDate: String })
const breedStore = useBreedStore()
const cageStore = useCageStore()
const cageConditionStore = useCageConditionStore()
const foodPrepStore = useFoodPrepStore()
const employeeStore = useEmployeeStore()
const taskStore = useTask()
const commonStore = useCommonStore()
const petCustodyStore = usePetCustodyStore()
const petBioStore = usePetBioStore()
const roomStore = useRoomStore()

const { getPetCustodies, getPetCustody } = storeToRefs(petCustodyStore)
const { getTasks } = storeToRefs(taskStore)
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

const { getAllRooms } = storeToRefs(roomStore)
const allBreeds = computed(() => breedStore.allBreeds)

const start_hour = 6
const tab = ref('全て')
const rows = ref<Array<TaskType>>([])
const allRows = ref<Array<TaskType>>([])
const petBioRows = ref(<any>[])
const showTaskList = ref(true)
const totalTask = ref(0)
const incompleted = ref(0)
const emergency = ref(0)
const flgCompleted = ref(0)
const flgApproved = ref(0)
const finalApproval = ref(0)
const fixedHeader = ref(false)
const columns = ref([
  { name: 'type', label: '', align: 'center', field: 'type' }
])
const taskLocations = ref([
  { label: '犬舎1', value: 1 },
  { label: '犬舎2', value: 2 },
  { label: '犬舎3', value: 3 },
  { label: '美容', value: 4 }
])
const searchData = ref({
  hide_complete_task: false,
  location: 1
})
const taskData = ref({
  type_task_place: null,
  date_type: 'datetime_plan',
  order_by: 'asc',
  datetime_plan: props.selectedDate,
  id_pet: null
})

const emit = defineEmits(['close'])
const closeModal = () => emit('close')

const openUpdatePetCustodyModal = async (data: PetCustodyType) => {
  let updatedFlg = { value: false }
  await mtUtils.popup(UpdatePetCustodyModal, {
    data,
    id_customer: data.id_customer,
    id_pet: data.id_pet,
    updatedFlg
  })
  await petCustodyStore.getPetCustodyById(data.id_pet_custody)
  await getCustody()
  await init()
}
const openPetDetail = async (customerId: string, petId: string) => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_customer: customerId,
    id_pet: petId
  })
}

const breedName = (value: string) => {
  return allBreeds.value.find((v) => v.value === value)?.label
}
const getCage = (value: string) => {
  return cageStore.getAllCages.find((v) => v.value === value)?.name_cage
}
const getCageMemo = (value: string) => {
  return cageConditionStore.getAllCageConditions.find((v) => v.value === value)
    ?.memo_cage_condition
}
const getFoodName = (value: string) => {
  return foodPrepStore?.getAllFoodPreps.find((v) => v.value === value)
    ?.name_food_prep
}
const handleEmpName = (empId: any) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, empId)
}
const overNightCondition = (date1: string, date2: string) => {
  if (dateDifferences(date1, date2) === 0) {
    return false
  }
  return true
}

const submit = () => {
  closeModal()
}

const petListByRoom = ref([])
const custodyListByRoom = ref([])
const currentSelectedPetKey = ref(0)
const currentSelectedPet = ref(null)
const custodyDateOptionList = ref([])
const currentSelectedDate = ref('')
const currentSelectedRoom = ref<number | null>(null)
const roomList = ref([])
const roomListDefault = reactive([])

const openAddFeedModal = async (
  id_customer: number,
  id_pet: number,
  data?: PetCustodyType,
  defaultHour?: string
) => {
  const customer_Id = id_customer
  let updatedFlg = { value: false }
  // if not edit then set default foodPrep based on selected custody's foodPrep
  const foodPrepIds = {
    id_food_prep1: data?.id_food_prep1,
    id_food_prep2: data?.id_food_prep2
  }
  let propsData = {
    id_pet_custody: data?.id_pet_custody,
    id_pet,
    data,
    updatedFlg,
    customer_Id,
    foodPrepIds,
    feedPlanDate: props.selectedDate
  }
  if (defaultHour) propsData.defaultHour = defaultHour
  await mtUtils.popup(UpdateFeedModal, { ...propsData })
  await petCustodyStore.fetchPetCustodies({
    date: props.selectedDate
  })
  petCustodyStore.selectPetCustody(getPetCustody.value.id_pet_custody)
  await init()
}
const openAddBioConditionModal = async (
  id_customer: string,
  id_pet: string,
  defaultHour?: string
) => {
  let propsData = {
    id_customer,
    id_pet,
    date: props.selectedDate
  }
  if (defaultHour) propsData.defaultHour = defaultHour
  await mtUtils.popup(UpdateBioConditionModal, { ...propsData })
  await petCustodyStore.fetchPetCustodies({
    date: props.selectedDate
  })
  petCustodyStore.selectPetCustody(getPetCustody.value.id_pet_custody)

  await init()
}
const openAddPetBioInfoModal = async (id_customer: string, id_pet: string) => {
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, {
    id_customer,
    id_pet,
    date: props.selectedDate
  })
  await petCustodyStore.fetchPetCustodies({
    date: props.selectedDate
  })
  petCustodyStore.selectPetCustody(getPetCustody.value.id_pet_custody)
  await init()
}

const openEditBioInfoModal = async (
  id_customer: number,
  id_pet: number,
  bio_info: PetBioInfoType,
  defaultHour?: string
) => {
  if (bio_info) petBioStore.selectPetBio(bio_info)
  let propsData = {
    id_customer,
    id_pet,
    id_pet_bio_info:
      bio_info && Object.keys(bio_info)?.length > 0
        ? bio_info?.id_pet_bio_info
        : null
  }
  if (defaultHour) propsData.defaultHour = defaultHour
  await mtUtils.mediumPopup(UpdatePetBioInfoModal, { ...propsData })
  await petCustodyStore.fetchPetCustodies({
    date: props.selectedDate
  })
  petCustodyStore.selectPetCustody(getPetCustody.value.id_pet_custody)

  await init()
}
const openEditBioConditionModal = async (
  id_customer: number,
  id_pet: number,
  bio_condition: PetBioConditionType
) => {
  let updatedFlg = { value: false }
  await mtUtils.popup(UpdateBioConditionModal, {
    id_customer,
    id_pet,
    pet_bio_condition: bio_condition,
    date: props.selectedDate,
    updatedFlg
  })

  if (updatedFlg.value) {
    await petCustodyStore.fetchPetCustodies({
      date: props.selectedDate
    })
    petCustodyStore.selectPetCustody(getPetCustody.value.id_pet_custody)

    await init()
  }
}
const onRowClick = async (row: TableRowType, col: TableColumnType) => {
  if (row.type === 'bio_info' && row[col.name as keyof TableRowType]) {
    const petBioInfo = getPetCustody.value.pet_bio_info_list.find(
      (v) => v.id_pet_bio_info === row[col.name as keyof TableRowType]
    )
    if (petBioInfo)
      openEditBioInfoModal(
        getPetCustody.value.id_customer,
        getPetCustody.value.id_pet,
        petBioInfo
      )
  }
  if (row.type === 'bio_condition' && row[col.name as keyof TableRowType]) {
    const petBioCondition = getPetCustody.value.pet_bio_condition_list.find(
      (v) => v.id_pet_bio_condition === row[col.name as keyof TableRowType]
    )
    if (petBioCondition)
      openEditBioConditionModal(
        getPetCustody.value.id_customer,
        getPetCustody.value.id_pet,
        petBioCondition
      )
  }
  if (row.type === 'feed_list' && row[col.name as keyof TableRowType]) {
    const feedList = getPetCustody.value.feed_list.find(
      (v) => v.id_feed === row[col.name as keyof TableRowType]
    )
    if (feedList)
      openAddFeedModal(
        getPetCustody.value.id_customer,
        getPetCustody.value.id_pet,
        feedList
      )
  } else if (!row.is_header && row.type === 'bio_info' && !row[col.name as keyof TableRowType]) {
    openEditBioInfoModal(
      getPetCustody.value.id_customer,
      getPetCustody.value.id_pet,
      null,
      col.label
    )
  }
}
const getRowStatus = (item: TaskType) => {
  if (item.flg_emargency) return 'red-box'
  if (item.flg_completed) return 'grey-box'
  if (!item.flg_emargency || !item.flg_completed) return 'light-grey-box'
}

const handlePetConditionIcon = (value: any, code_common: string) => {
  if (value) {
    let common_icon = null
    if (code_common === 'type_review_food') {
      common_icon = getCommonTypeReviewFood.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_water') {
      common_icon = getCommonTypeReviewWater.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_feces') {
      common_icon = getCommonTypeReviewFeces.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_urine') {
      common_icon = getCommonTypeReviewUrine.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_vomit') {
      common_icon = getCommonTypeReviewVomit.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_respiration') {
      common_icon = getCommonTypeReviewRespiration.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_wellness') {
      common_icon = getCommonTypeReviewWellness.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    } else if (code_common === 'type_review_body_temperature') {
      common_icon = getCommonTypeReviewBodyTemprature.value?.find(
        (v) => v.id_common === value
      )?.code_func2
    }

    if (common_icon === '1') {
      return '●'
    } else if (common_icon === '2') {
      return '▲'
    } else if (common_icon === '3') {
      return '▼'
    } else if (common_icon === '4') {
      return '〇'
    }
  } else {
    return ''
  }
}
const handlePetConditionStyle = (value: any, code_common: string) => {
  if (value) {
    let common_color = null
    if (code_common === 'type_review_food') {
      common_color = getCommonTypeReviewFood.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_water') {
      common_color = getCommonTypeReviewWater.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_feces') {
      common_color = getCommonTypeReviewFeces.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_urine') {
      common_color = getCommonTypeReviewUrine.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_vomit') {
      common_color = getCommonTypeReviewVomit.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_respiration') {
      common_color = getCommonTypeReviewRespiration.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_wellness') {
      common_color = getCommonTypeReviewWellness.value?.find(
        (v) => v.id_common === value
      )?.text2
    } else if (code_common === 'type_review_body_temperature') {
      common_color = getCommonTypeReviewBodyTemprature.value?.find(
        (v) => v.id_common === value
      )?.text2
    }

    return 'color: ' + common_color
  } else {
    return 'color: #000000'
  }
}
const handleScroll = (e) => {
  if (e.verticalPosition >= 70) fixedHeader.value = true
  else fixedHeader.value = false
}
const toggleHideCompleteTask = (value: boolean) => {
  if (value) {
    rows.value = getTasks.value.filter((tsk) => {
      return (
        tsk.flg_completed === false &&
        tsk.id_pet === getPetCustody.value?.id_pet &&
        tsk.id_customer === getPetCustody.value?.id_customer
      )
    })
  } else {
    rows.value = getTasks.value.filter((tsk) => {
      return (
        tsk.id_pet === getPetCustody.value?.id_pet &&
        tsk.id_customer === getPetCustody.value?.id_customer &&
        tsk?.val_order <= 1
      )
    })
  }
}

const init = async (initOnce: any = false) => {
  // PET BIO
  petBioRows.value = [
    { label: 'TPR', is_header: true },
    {
      label: '体温T',
      field: 'val_temperature',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: '心拍P',
      field: 'val_heartbeat_rate',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: '呼吸R',
      field: 'val_respiration_rate',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: '収/圧',
      field: 'val_pressure_systolic',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: '拡/圧',
      field: 'val_pressure_diastolic',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: '平/圧',
      field: 'val_pressure_mean_arterial',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: 'Spo2',
      field: 'val_blood_oxygen_level',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: 'Pco2',
      field: 'val_blood_carbon_dioxide_level',
      is_header: false,
      type: 'bio_info'
    },
    {
      label: 'メモ',
      field: 'memo_measure',
      is_header: false,
      type: 'bio_info'
    },
    { label: '状態管理', is_header: true },
    {
      label: '食事',
      field: 'type_review_food',
      is_header: false,
      type: 'feed_list'
    },
    {
      label: '水分',
      field: 'type_review_water',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: '排便',
      field: 'type_review_feces',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: '排尿',
      field: 'type_review_urine',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: '嘔吐',
      field: 'type_review_vomit',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: '呼吸',
      field: 'type_review_respiration',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: '活動',
      field: 'type_review_wellness',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: '体温',
      field: 'type_review_body_temperature',
      is_header: false,
      type: 'bio_condition'
    },
    {
      label: 'メモ',
      field: 'memo_record',
      is_header: false,
      type: 'bio_condition'
    }
  ]
  if (getPetCustody.value?.pet_bio_info_list) {
    getPetCustody.value?.pet_bio_info_list.forEach((item) => {
      const updatedRows = petBioRows.value.map((row) => {
        if (row.type === 'bio_info') {
          return {
            ...row,
            ['hour_' + formatHours(item.datetime_measure)]: item[row.field],
            ['hour-' + formatHours(item.datetime_measure)]: item.id_pet_bio_info
          }
        }
        return row
      })
      petBioRows.value = updatedRows
    })
  }
  if (getPetCustody.value?.pet_bio_condition_list) {
    getPetCustody.value?.pet_bio_condition_list.forEach((item) => {
      const updatedRows = petBioRows.value.map((row) => {
        if (row.type === 'bio_condition') {
          return {
            ...row,
            ['hour_' + formatHours(item.datetime_record)]: item[row.field],
            ['hour-' + formatHours(item.datetime_record)]:
              item.id_pet_bio_condition
          }
        }
        return row
      })
      petBioRows.value = updatedRows
    })
  }
  if (getPetCustody.value?.feed_list) {
    getPetCustody.value?.feed_list.forEach((item) => {
      const updatedRows = petBioRows.value.map((row) => {
        if (row.type === 'feed_list') {
          return {
            ...row,
            ['hour_' + formatHours(item.datetime_feed_plan)]: item[row.field],
            ['hour-' + formatHours(item.datetime_feed_plan)]: item.id_feed
          }
        }
        return row
      })
      petBioRows.value = updatedRows
    })
  }

  await router.replace({
    name: 'SearchTaskPetCustodyList',
    query: { id: getPetCustody.value.id_pet_custody }
  })

  // currentSelectedDate.value = getPetCustody.value?.datetime_start_plan

  // TASK
  if (getTasks.value) {
    rows.value = getTasks.value.filter((tsk) => {
      return (
        tsk.id_pet === getPetCustody.value?.id_pet &&
        tsk.id_customer === getPetCustody.value?.id_customer &&
        dateFormat(tsk.datetime_request) === getDateToday()
      )
    })

    allRows.value = rows.value
    rows.value = sortBy(
      rows.value,
      ['flg_completed', 'number_task'],
      ['asc', 'desc']
    )

    totalTask.value = allRows.value.length
    const incomplete = allRows.value.filter((tsk) => {
      return tsk.flg_closed === false && tsk.flg_started === false
    })
    incompleted.value = incomplete?.length
    const emer = allRows.value.filter((tsk) => {
      return (
        tsk.flg_closed === false &&
        tsk.flg_completed === false &&
        tsk.flg_emargency === true
      )
    })
    emergency.value = emer?.length
    const flgc = allRows.value.filter((tsk) => {
      return tsk.flg_closed === false && tsk.flg_completed === false
    })
    flgCompleted.value = flgc?.length
    const flgA = allRows.value.filter((tsk) => {
      return tsk.flg_closed === false && tsk.flg_approved === false
    })
    flgApproved.value = flgA?.length
    const flgApproval = allRows.value.filter((tsk) => {
      return (
        tsk.flg_closed === false &&
        tsk.flg_start_arroval_required === true &&
        tsk.flg_completed === true
      )
    })
    finalApproval.value = flgApproval?.length
  }
}
const openMenu = async () => {
  let menuOptions = [
    {
      title: 'URLコピー',
      name: 'URL copy',
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
    if (selectedOption.name == 'URL copy') {
      const url = window.location.href
      await navigator.clipboard.writeText(url)
      await mtUtils.autoCloseAlert('URLをコピーしました!')
    }
    if (selectedOption.name == 'delete') {
      mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then(async (confirmation) => {
          if (confirmation) {
            await petCustodyStore.destroyPetCustody(getPetCustody.value.id_pet_custody)
          }
        })
    }
  }
}

async function getCustody(option: any = null, optionPet: any = null) {
  if (!(option || optionPet)) return

  if (optionPet) {
    const length = Object.keys(petListByRoom.value).length
    currentSelectedPet.value = Object.keys(petListByRoom.value)[
      currentSelectedPetKey.value
    ]

    currentSelectedPetKey.value += 1
    if (length === currentSelectedPetKey.value) {
      currentSelectedPetKey.value = 0
    }
  }
  const id_pet = optionPet
    ? currentSelectedPet.value
    : getPetCustody.value.id_pet

  await mtUtils.promiseAllWithLoader([
    petCustodyStore.fetchPetCustodies({
      option: option,
      optionPet: optionPet,
      id_room: optionPet ? getPetCustody.value.id_room : null,
      id_pet_custody: optionPet ? null : getPetCustody.value.id_pet_custody,
      id_pet: optionPet ? currentSelectedPet.value : getPetCustody.value.id_pet
    }),
    fetchPetCustodyListByPet(id_pet)
  ])

  if (getPetCustodies.value.length === 0) {
    await mtUtils.autoCloseAlert('預り・入院はありません。')
  }

  if (getPetCustodies.value.length > 0) {
    petCustodyStore.selectPetCustody(
      getPetCustodies.value[0].id_pet_custody
    )
    currentSelectedDate.value =
      getPetCustodies.value[0].datetime_start_plan
  }

  generateColumn()
  init()
}

async function fetchPetCustodyListByPet(id_pet: any = null) {
  let custodyListByPet: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'SearchPetCustodyList',
    {
      id_pet: id_pet ?? getPetCustody.value.id_pet,
      whole_list: true
    }
  )
  if (custodyListByPet) {
    custodyDateOptionList.value = [
      ...Object.keys(groupBy(custodyListByPet, 'datetime_start_plan')).map(
        (item) => formatDate(item)
      )
    ]
  }
}

async function fetchPetCustodyListByRoom(roomId: any = null) {
  if (!currentSelectedRoom.value) return

  let custodyListByRoom: any = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    'SearchPetCustodyList',
    {
      whole_list: true,
      id_room: currentSelectedRoom.value
    }
  )

  await petCustodyStore.fetchPetCustodies({
    whole_list: true,
    id_room: currentSelectedRoom.value,
  })

  mtUtils.autoCloseAlert('預り・入院はありません。')

  if (custodyListByRoom.length > 0) {
    petCustodyStore.selectPetCustody(custodyListByRoom[0].id_pet_custody)
    custodyListByRoom.value = custodyListByRoom
    petListByRoom.value = groupBy(custodyListByRoom, 'id_pet')
    currentSelectedPetKey.value = -1
    getCustody(null, 'next')
  }
}

const navigatePetCustodyList = (value: string) => {
  // if a user has selected a room, navigate the pet custody in that room
  if (currentSelectedRoom.value) {
    const currentIndex = custodyListByRoom.value.findIndex((data) => {
      return data.id_pet === getPetCustody.value.pet.id_pet
    })
    if (currentIndex !== -1) {
      if (value === 'prev' && currentIndex !== 0) {
        petCustodyStore.selectPetCustody(custodyListByRoom.value[currentIndex - 1].id_pet_custody)
        return router.replace({
          name: 'SearchTaskPetCustodyList',
          query: { id: getPetCustody.value.id_pet_custody }
        })
      }
      if (value === 'next' && currentIndex !== custodyListByRoom.value.length - 1) {
        petCustodyStore.selectPetCustody(custodyListByRoom.value[currentIndex + 1].id_pet_custody)
        return router.replace({
          name: 'SearchTaskPetCustodyList',
          query: { id: getPetCustody.value.id_pet_custody }
        })
      }
    }
    return mtUtils.alert('No more pet custody data in this room, try another room', 'Alert')
  }

  // if a user has not selected a room, navigate the pet custody in general, limited by the selected date
  const currentIndex = getPetCustodies.value.findIndex((data) => {
    return data.id_pet_custody === getPetCustody.value.id_pet_custody
  })
  if (currentIndex !== -1) {
    if (value === 'prev' && currentIndex !== 0) {
      petCustodyStore.selectPetCustody(getPetCustodies.value[currentIndex - 1].id_pet_custody)
      return router.replace({
        name: 'SearchTaskPetCustodyList',
        query: { id: getPetCustody.value.id_pet_custody }
      })
    }
    if (value === 'next' && currentIndex !== getPetCustodies.value.length - 1) {
      petCustodyStore.selectPetCustody(getPetCustodies.value[currentIndex + 1].id_pet_custody)
      return router.replace({
        name: 'SearchTaskPetCustodyList',
        query: { id: getPetCustody.value.id_pet_custody }
      })
    }
  }
  return mtUtils.alert('No more pet custody data', 'Alert')
}

const navigateDate = async (value: string) => {
  currentSelectedDate.value= changeDate(currentSelectedDate.value, value)
  await petCustodyStore.fetchPetCustodies({
    id_room: currentSelectedRoom.value,
    datetime_start: currentSelectedDate.value
  })
}

const generateColumn = () => {
  const hourList = getHourListADay(start_hour)
  hourList.forEach((hour) => {
    columns.value.push({
      name: 'hour-' + hour,
      label: '' + hour,
      align: 'center',
      field: 'value-by-hour'
    })
  })
}

const clickCreateFeedBioCondition = (
  defaultHour = '0',
  rowType = ''
) => {
  defaultHour = defaultHour.padStart(2, '0')
  if (rowType === 'feed_list') {
    openAddFeedModal(
      getPetCustody.value.id_customer,
      getPetCustody.value.id_pet_custody,
      getPetCustody.value,
      defaultHour
    )
  } else
    openAddBioConditionModal(
      getPetCustody.value.id_customer,
      getPetCustody.value.id_pet,
      defaultHour
    )
}

onMounted(async () => {
  await cageStore.fetchPreparationCages()
  await taskStore.fetchTask(taskData.value)
  generateColumn()
  init(true)
  currentSelectedRoom.value = getPetCustody.value?.id_room
  
  const [first, second] = await mtUtils.promiseAllWithLoader([
    fetchPetCustodyListByPet(),
    mtUtils.callApi(selectOptions.reqMethod.GET, 'SearchPetCustodyList', {
      whole_list: true,
      id_room: getPetCustody.value.id_room
    })
  ])
  
  if (second.length > 0) {
    petListByRoom.value = groupBy(second, 'id_pet')
  }
  
  if (getAllRooms.value) {
    roomListDefault.push(
      ...getAllRooms.value.map((room) => ({
        ...room,
        label: room.name_room,
        value: room.id_room
      }))
    )
    roomList.value = [...roomListDefault]
  }

  currentSelectedDate.value = props.selectedDate ?? getDateToday()

  setPageTitle(
    `預り・入院管理： ${getFullPetName(
      getPetCustody?.value?.pet,
      getPetCustody?.value?.customer
    )}`
  )
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        預り・入院管理：{{
          getFullPetName(getPetCustody?.pet, getPetCustody?.customer)
        }}
      </q-toolbar-title>
      <div class="c-grid">
        <div class="row items-center">
          <q-btn flat round @click="navigateDate('prev')">
            <q-icon name="navigate_before" />
          </q-btn>
          <MtFormInputDate
            v-model:date="currentSelectedDate"
            class="col-6"
          ></MtFormInputDate>
          <q-btn class="q-mx-md" flat round @click="navigateDate('next')">
            <q-icon name="navigate_next" />
          </q-btn>
        </div>
        <div class="row items-center">
          <q-btn flat round @click="navigatePetCustodyList('prev')">
            <q-icon name="navigate_before" />
          </q-btn>
          <MtFilterSelect
            v-model:selecting="currentSelectedRoom"
            :options="roomList"
            :options-default="roomListDefault"
            class="col-6"
            label=""
            @update:selecting="fetchPetCustodyListByRoom"
          />
          <q-btn class="q-mx-md" flat round @click="navigatePetCustodyList('next')">
            <q-icon name="navigate_next" />
          </q-btn>
        </div>
      </div>
      <q-btn flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content-full q-px-sm">
      <div class="row q-col-gutter-md">
        <!-- Left Component (Pet detail, pet bio info, pet bio condition and feed table) -->
        <div :class="showTaskList ? 'col-6' : 'col'">
          <q-scroll-area @scroll="handleScroll" class="separate-scrollbar">
            <!-- Sticky header while scrolling -->
            <div
              v-if="fixedHeader"
              @click="openUpdatePetCustodyModal(getPetCustody)"
              class="top-sticky-header cursor-pointer q-pa-md col-12 bg-white"
            >
              <div class="flex items-center q-mb-sm">
                <span
                  v-if="getPetCustody?.flg_hospitalization"
                  class="hospitalization-tag q-mr-md"
                >
                  入院
                </span>
                <q-btn
                  unelevated
                  @click.stop="
                    openPetDetail(
                      getPetCustody?.id_customer,
                      getPetCustody?.pet?.id_pet
                    )
                  "
                  padding="0px"
                >
                  <span class="large-title bold text-blue q-pa-none">
                    {{ getPetFirstName(getPetCustody?.pet) }}</span
                  >
                </q-btn>
                <span class="large-title bold text-grey-900 q-ml-md">
                  {{ breedName(getPetCustody?.pet?.id_breed) }}
                </span>

                <div class="col">
                  <div class="text-grey-700">
                    <small class="text-grey-500">預かり期間： </small>
                    <span v-if="getPetCustody?.datetime_start_plan">{{
                      formatDate(getPetCustody?.datetime_start_plan)
                    }}</span>
                    <span
                      class="q-ml-sm"
                      v-if="getPetCustody?.datetime_start_plan"
                      >{{
                        formatHoursMinutes(getPetCustody?.datetime_start_plan)
                      }}</span
                    >
                    <span
                      class="q-mx-sm"
                      v-if="getPetCustody?.datetime_goal_plan"
                      >～</span
                    >
                    <span v-if="getPetCustody?.datetime_goal_plan">{{
                      formatDate(getPetCustody?.datetime_goal_plan)
                    }}</span>
                    <span
                      class="q-ml-sm"
                      v-if="getPetCustody?.datetime_goal_plan"
                      >{{
                        formatHoursMinutes(getPetCustody?.datetime_goal_plan)
                      }}</span
                    >
                  </div>
                </div>
                <q-btn
                  unelevated
                  padding="7px 15px"
                  color="primary"
                  text-color="white"
                  @click.stop="
                    openAddFeedModal(
                      getPetCustody?.id_customer,
                      getPetCustody?.id_pet_custody,
                      getPetCustody
                    )
                  "
                  class="q-mr-xs"
                >
                  <q-icon name="add" class="q-mr-sm" size="20" />
                  ごはん
                </q-btn>
                <q-btn
                  unelevated
                  padding="7px 15px"
                  color="primary"
                  text-color="white"
                  class="q-mr-xs"
                  @click.stop="
                    openAddBioConditionModal(
                      getPetCustody?.id_customer,
                      getPetCustody?.id_pet
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
                  @click.stop="
                    openAddPetBioInfoModal(
                      getPetCustody?.id_customer,
                      getPetCustody?.id_pet
                    )
                  "
                >
                  <q-icon name="add" class="q-mr-sm" size="20" />
                  TPR
                </q-btn>
              </div>
            </div>

            <!-- Header of the modal with pet contents -->
            <div
              @click="openUpdatePetCustodyModal(getPetCustody)"
              class="row q-col-gutter-md cursor-pointer q-pb-lg"
            >
              <div class="col-auto q-mr-sm">
                <img
                  :alt="getPetCustody?.pet?.id_pet"
                  :src="getPetImageUrl(getPetCustody?.pet)"
                  @error="handleImageError($event, getPetCustody?.pet)"
                  spinner-color="white"
                  style="width: 110px; height: 110px"
                  class="roundedImage cursor-pointer image-responsive"
                  loading="lazy"
                />
              </div>
              <div class="col-auto q-mr-lg">
                <div class="flex items-center q-mb-sm">
                  <span
                    v-if="getPetCustody?.flg_hospitalization"
                    class="hospitalization-tag q-mr-md"
                  >
                    入院
                  </span>
                  <q-btn
                    unelevated
                    @click.stop="
                      openPetDetail(
                        getPetCustody?.id_customer,
                        getPetCustody?.pet?.id_pet
                      )
                    "
                    padding="0px"
                  >
                    <span class="large-title bold text-blue q-pa-none">
                      {{ getPetFirstName(getPetCustody?.pet) }}</span
                    >
                  </q-btn>
                  <span class="large-title bold text-grey-900 q-ml-md">
                    {{ breedName(getPetCustody?.pet?.id_breed) }}
                  </span>
                </div>
                <div class="text-grey-700 q-mb-xs">
                  <small class="text-grey-500">ケージ準備： </small>
                  {{ getCageMemo(getPetCustody?.id_cage_condition) }}
                </div>
                <div class="text-grey-700 q-mb-xs">
                  <small class="text-grey-500">ケージ#： </small>
                  {{ getCage(getPetCustody?.id_cage) }}
                </div>
                <div v-if="getPetCustody?.request">
                  <div class="text-grey-700">
                    <small class="text-grey-500">リクエスト#： </small>
                    {{ getPetCustody?.request?.number_request }}
                    <small class="text-grey-500 q-ml-md">担当医： </small>
                    {{
                      handleEmpName(getPetCustody?.request?.id_employee_doctor)
                    }}
                  </div>
                </div>
                <div class="flex gap-2">
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_assisted_feeding">強制給餌</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_assisted_urination">排尿補助・尿カテ</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_feed">通常ごはん</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_hospitalization">入院管理</q-chip>
                </div>
              </div>
              <div class="col">
                <div class="text-grey-700">
                  <small class="text-grey-500">預かり期間： </small>
                  <span v-if="getPetCustody?.datetime_start_plan">{{
                    formatDate(getPetCustody?.datetime_start_plan)
                  }}</span>
                  <span
                    class="q-ml-sm"
                    v-if="getPetCustody?.datetime_start_plan"
                    >{{
                      formatHoursMinutes(getPetCustody?.datetime_start_plan)
                    }}</span
                  >
                  <span class="q-mx-sm" v-if="getPetCustody?.datetime_goal_plan"
                    >～</span
                  >
                  <span v-if="getPetCustody?.datetime_goal_plan">{{
                    formatDate(getPetCustody?.datetime_goal_plan)
                  }}</span>
                  <span
                    class="q-ml-sm"
                    v-if="getPetCustody?.datetime_goal_plan"
                    >{{
                      formatHoursMinutes(getPetCustody?.datetime_goal_plan)
                    }}</span
                  >
                  <q-chip
                    v-if="
                      overNightCondition(
                        getPetCustody?.datetime_start_plan,
                        getPetCustody?.datetime_goal_plan
                      )
                    "
                    class="bg-accent-200 text-accent-900 q-ml-sm"
                  >
                    連日
                  </q-chip>
                </div>
                <div v-if="getPetCustody?.request">
                  <div class="text-grey-700 q-mb-sm">
                    <small class="text-grey-500">ごはん準備： </small>
                    {{ getFoodName(getPetCustody?.id_food_prep1) }}
                    <span v-if="getPetCustody?.id_food_prep2">
                      {{
                        ', ' + ' ' + getFoodName(getPetCustody?.id_food_prep2)
                      }}
                    </span>
                  </div>
                </div>
                <div class="text-grey-700">
                  <small class="text-grey-500">メモ： </small>
                  {{ getPetCustody?.memo }}
                </div>
                <div class="flex gap-2">
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_iv_catheter_exchange">留置針：交換</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_iv_catheter_remove">留置針：抜去</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_scheduled_hydration">定時給水</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_temperature">体温管理</q-chip>
                  <q-chip class="bg-accent-200 text-accent-900" v-if="getPetCustody?.flg_walk">散歩</q-chip>
                </div>
              </div>
              <template v-if="!showTaskList">
                <q-space></q-space>
                <div>
                  <q-btn @click.stop="showTaskList = !showTaskList" flat>
                    <q-icon name="chevron_left" />
                    タスクを非表示
                  </q-btn>
                </div>
              </template>
            </div>
            <!-- <div class="row">
              <div class="col-12">
                Test
              </div>
            </div> -->
            <div>
              <div class="flex items-center justify-end q-pb-md">
                <q-btn
                  unelevated
                  padding="7px 15px"
                  color="primary"
                  text-color="white"
                  @click="
                    openAddFeedModal(
                      getPetCustody?.id_customer,
                      getPetCustody?.id_pet_custody,
                      getPetCustody
                    )
                  "
                  class="q-mr-lg"
                >
                  <q-icon name="add" class="q-mr-sm" size="20" />
                  ごはん
                </q-btn>
                <q-btn
                  unelevated
                  padding="7px 15px"
                  color="primary"
                  text-color="white"
                  class="q-mr-lg"
                  @click="
                    openAddBioConditionModal(
                      getPetCustody?.id_customer,
                      getPetCustody?.id_pet
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
                      getPetCustody?.id_customer,
                      getPetCustody?.id_pet
                    )
                  "
                >
                  <q-icon name="add" class="q-mr-sm" size="20" />
                  TPR
                </q-btn>
              </div>

              <!-- Pet bio info, pet bio condition and feed list table content here -->
              <div>
                <MtTable2
                  :columns="columns"
                  :rows="petBioRows"
                  :rowsBg="false"
                  flat
                >
                  <template v-slot:row="{ row }">
                    <td
                      class="cursor-pointer"
                      v-for="(col, index) in columns"
                      :class="row.is_header ? 'bg-grey-300' : ''"
                      :key="index"
                      @click="onRowClick(row, col)"
                    >
                      <div v-if="col.field === 'type'" style="width: 70px">
                        <div class="body1 row no-wrap regular text-grey-900">
                          <span>{{ row.label }}</span>
                        </div>
                      </div>
                      <div v-else-if="col.field === 'value-by-hour'" auto-width>
                        <div class="body1 row no-wrap regular text-grey-900">
                          <template v-if="row.type === 'bio_info'">
                            <q-icon
                              v-if="
                                row.field === 'memo_measure' &&
                                row['hour_' + col.label]
                              "
                              name="chat_bubble_outline"
                            />
                            <span v-else>{{
                              row['hour_' + col.label]
                                ? parseFloat(row['hour_' + col.label]).toFixed(
                                    0
                                  )
                                : ''
                            }}</span>
                          </template>
                          <template v-else>
                            <q-icon
                              v-if="
                                row.field === 'memo_record' &&
                                row['hour_' + col.label]
                              "
                              name="chat_bubble_outline"
                            />
                            <span
                              v-else-if="
                                handlePetConditionIcon(
                                  row['hour_' + col.label],
                                  row.field
                                )
                              "
                              :style="
                                handlePetConditionStyle(
                                  row['hour_' + col.label],
                                  row.field
                                )
                              "
                            >
                              {{
                                handlePetConditionIcon(
                                  row['hour_' + col.label],
                                  row.field
                                )
                              }}
                            </span>
                            <span
                              v-else-if="row['hour-' + col.label]"
                              class="text-grey-800"
                            >
                              〇
                            </span>
                            <span
                              v-else-if="!row.is_header"
                              class="full-width"
                              style="height: 20px"
                              @click="
                                clickCreateFeedBioCondition(col.label, row.type)
                              "
                            ></span>
                          </template>
                        </div>
                      </div>
                      <div v-else auto-width>
                        <div class="body1 row no-wrap regular text-grey-900">
                          <span>{{ row[col.field] }}</span>
                        </div>
                      </div>
                    </td>
                  </template>
                </MtTable2>
              </div>
            </div>
          </q-scroll-area>
        </div>

        <!-- Right component, task list -->
        <div v-if="showTaskList" class="col-6">
          <q-scroll-area class="separate-scrollbar">
            <div
              class="top-sticky-header bg-white q-pb-xs flex justify-between"
            >
              <div class="flex items-center">
                <MtFormCheckBox
                  label="完了したタスクは表示しない"
                  v-model:checked="searchData.hide_complete_task"
                  @update:checked="toggleHideCompleteTask"
                />
                <span class="q-mx-md"> 対応部署 </span>
                <MtFormPullDown
                  outlined
                  :options="taskLocations"
                  class="q-ml-md"
                  v-model:selected="searchData.location"
                />
              </div>
              <div>
                <q-btn @click="showTaskList = !showTaskList" flat>
                  <q-icon name="chevron_right" />
                  タスクを非表示
                </q-btn>
              </div>
            </div>
            <div class="row q-gutter-md q-mb-md q-mt-xs" v-if="rows.length">
              <TodoTaskItem
                v-for="(item, i) in rows"
                customClassCircle="small"
                :key="i"
                :rows="item"
                :status="getRowStatus(item)"
                date-type="today"
                class="q-ml-md q-pl-md"
              />
            </div>
          </q-scroll-area>
        </div>
      </div>
    </q-card-section>
  </q-form>
</template>
<style scoped lang="scss">
.q-table th,
.q-table td {
  padding: 5px 5px;
}
.q-table thead tr,
.q-table tbody td {
  height: 18px;
}

.separate-scrollbar {
  width: 100%;
  height: calc(100vh - 150px);
  :deep(.q-scrollarea__content) {
    max-height: unset !important;
    width: 100%;
  }
}
.top-sticky-header {
  position: sticky;
  top: 0;
  z-index: 2;
}

.c-grid {
  display: grid;
  grid-template-columns: 300px 300px;
}
</style>
