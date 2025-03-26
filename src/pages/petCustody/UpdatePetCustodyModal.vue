<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import {
  concatenate,
  formatDate,
  formatDateWithTime,
  formatHoursMinutes,
  getDateTimeNow,
  getDateToday,
  getDaysAfter,
  checkDateRange,
  getHoursAfter
} from '@/utils/aahUtils'
import useCustomerStore from '@/stores/customers'
import usePetCustodyStore from '@/stores/pet-custodies'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCageStore from '@/stores/cages'
import useFoodPrepStore from '@/stores/food-prep'
import OptionModal from '@/components/OptionModal.vue'
import useCageConditionStore from '@/stores/cage-conditions'
import useItemStore from '@/stores/items'
import aahValidations from '@/utils/aahValidations'
import { storeToRefs } from 'pinia'
import useRoomStore from '@/stores/rooms'
import { timeHourMinute } from '@/utils/enum'
import { PetCustodyType } from '@/types/types'

const roomStore = useRoomStore()
const cageStore = useCageStore()
const customerStore = useCustomerStore()
const petCustodyStore = usePetCustodyStore()
const cageConditionStore = useCageConditionStore()
const foodPrepStore = useFoodPrepStore()
const itemServiceStore = useItemStore()
const props = withDefaults(
  defineProps<{
    id_pet: number,
    id_customer: number,
    data: PetCustodyType,
    id_request: string,
    updatedFlg: {
      value: boolean
    },
    flg_hospitalization: boolean
  }>(),
  {
    id_pet: 0,
    id_customer: 0,
    data: () => {
      return {}  as PetCustodyType
    },
    id_request: '',
    updatedFlg: {
      value: false
    },
    flg_hospitalization: false
  }
)
const customerList: any = ref([])
const customerListDefault: any = reactive([])
const isPet = ref(false)
const petList: any = ref([])
const petListDefault: any = reactive([])
const cageList: any = ref([])
const cageListDefault: any = reactive([])
const cageConditionsDefault: any = reactive([])
const cageConditions: any = ref([])
const foodPrepList: any = ref([])
const foodPrepListDefault: any = reactive([])
const isEdit = ref(false)
const { getCageCondition } = storeToRefs(cageConditionStore)
const { getFoodPrep } = storeToRefs(foodPrepStore)
const { getCustomerOption } = storeToRefs(customerStore)
const { getAllItems } = storeToRefs(itemServiceStore)
const selectedRoom = ref()

const emits = defineEmits(['close'])

const data = reactive<PetCustodyType>({
  id_pet: props.id_pet,
  id_customer: props.id_customer,
  id_request: props.id_request,
  number_request: '',
  datetime_start_plan: getDateTimeNow(),
  datetime_goal_plan: '',
  datetime_start: '',
  datetime_goal: null,
  memo: '',
  flg_hospitalization: false,
  flg_iv_catheter_remove: false,
  flg_iv_catheter_exchange: false,
  flg_temperature: false,
  flg_walk: false,
  flg_assisted_urination: false,
  flg_scheduled_hydration: false,
  flg_assisted_feeding: false,
  flg_feed: false,
  id_cage: null,
  id_room: null,
  id_cage_condition: '',
  id_food_prep1: '',
  id_food_prep2: '',
  id_food_prep3: null,
  id_clinic: null
})
const start_plan = ref(getDateToday())
const goal_plan = ref(getDateToday())
const start = ref()
const goal = ref()
const start_plan_HH_MM = ref('00:00')
const goal_plan_HH_MM = ref('03:00')
const start_HH_MM = ref('')
const goal_HH_MM = ref('')
const cage_file_path1 = ref(null)
const cage_file_path2 = ref(null)
const cage_file_path3 = ref(null)
const food_prep_file_path1 = ref(null)
const food_prep_file_path2 = ref(null)
const food_prep_file_path3 = ref(null)
const food_prep2_file_path1 = ref(null)
const food_prep2_file_path2 = ref(null)
const food_prep2_file_path3 = ref(null)
const memo_cage_condition = ref(null)
const memo_foodPrep1 = ref(null),
  memo_feeding1 = ref(null)
const memo_foodPrep2 = ref(null),
  memo_feeding2 = ref(null)
const memo_purpose = ref(null)
const cage_condition_default: any = reactive([])
const start_day = ref('today')
const goal_day = ref('today')
const time_range = ref([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
const isActualDates = ref(false)
const todatDateTime = ref(formatDateWithTime(getDateTimeNow()))

const selectCage = (value) => {
  const cage = cageStore.getAllCages.find((v) => v.value === value)
  const room = roomStore.getAllRooms.find((v) => v.id_room === cage?.id_room)
  selectedRoom.value = room.name_room
  data.id_room = cage.id_room
}
const submit = async () => {
  let dateRanges: any = []
  dateRanges.push({ start_date: start_plan.value, end_date: goal_plan.value })
  dateRanges.push({ start_date: start.value, end_date: goal.value })
  if (!checkDateRange(dateRanges)) return false
  if (start_plan.value != '' && start_plan_HH_MM.value != '') {
    data.datetime_start_plan = start_plan.value
    data.datetime_start_plan += ' ' + start_plan_HH_MM.value + ':00'
  }
  if (
    goal_plan.value !== null &&
    goal_plan.value != '' &&
    goal_plan_HH_MM.value != '' &&
    goal_plan_HH_MM.value !== null
  ) {
    data.datetime_goal_plan = goal_plan.value
    data.datetime_goal_plan += ' ' + goal_plan_HH_MM.value + ':00'
  }
  if (
    start.value != '' &&
    start_HH_MM.value != '' &&
    start.value !== null &&
    start_HH_MM.value !== null
  ) {
    data.datetime_start = start.value
    data.datetime_start += ' ' + start_HH_MM.value + ':00'
  }
  if (
    goal.value != '' &&
    goal_HH_MM.value != '' &&
    goal.value !== null &&
    goal_HH_MM.value !== null
  ) {
    data.datetime_goal = goal.value
    data.datetime_goal += ' ' + goal_HH_MM.value + ':00'
  }
  // return false
  if (isEdit.value) {
    await petCustodyStore.updatePetCustody(props.data?.id_pet_custody, data)
    // await petCustodyStore.fetchPetCustodies({ date: getDateToday() })
    props.updatedFlg.value = true
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
  } else {
    await petCustodyStore.submitPetCustody(data)
    props.updatedFlg.value = true
    // await petCustodyStore.fetchPetCustodies({ date: getDateToday() })
    emits('close')
    mtUtils.autoCloseAlert(aahMessages.success)
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
      if (isActualDates.value) {
        mtUtils.autoCloseAlert('実績日が入ったデータは削除できません。')
      } else {
        await mtUtils
          .confirm(aahMessages.delete_ask, aahMessages.delete)
          .then((confirmation) => {
            if (confirmation) {
              petCustodyStore
                .destroyPetCustody(props.data?.id_pet_custody)
                .then(() => {
                  petCustodyStore.fetchPetCustodies({
                    date: getDateToday()
                  })
                  props.updatedFlg.value = true
                  emits('close')
                  mtUtils.autoCloseAlert(aahMessages.success)
                })
            }
          })
      }
    }
  }
}
const closeModal = () => {
  emits('close')
}
const startPlanUpdate = () => {
  start.value = start_plan.value
  start_HH_MM.value = start_plan_HH_MM.value
}
const goalPlanUpdate = () => {
  goal.value = goal_plan.value
  goal_HH_MM.value = goal_plan_HH_MM.value
}
const goTO = async (req_id: any) => {
  window.open(`/SearchRequestList/${req_id}`, '_blank')
  return false
}
const init = (id: any, selectingType: string) => {
  if (id !== null) {
    if (selectingType !== 'foodPrep1' && selectingType !== 'foodPrep2') {
      cageConditionStore.selectCageCondition(data.id_cage_condition)
      cage_file_path1.value = getCageCondition.value?.file_path1
      cage_file_path2.value = getCageCondition.value?.file_path2
      cage_file_path3.value = getCageCondition.value?.file_path3
      memo_cage_condition.value = getCageCondition.value?.memo_cage_condition
      memo_purpose.value = getCageCondition.value?.memo_purpose
    }
    if (selectingType !== 'foodPrep2' && selectingType !== 'cageCondition') {
      foodPrepStore.selectFoodPrep(data.id_food_prep1)
      food_prep_file_path1.value = getFoodPrep.value?.file_path1
      food_prep_file_path2.value = getFoodPrep.value?.file_path2
      food_prep_file_path3.value = getFoodPrep.value?.file_path3
      memo_foodPrep1.value = getFoodPrep.value?.memo_food_prep
      memo_feeding1.value = getFoodPrep.value?.memo_feeding
    }
    if (selectingType !== 'foodPrep1' && selectingType !== 'cageCondition') {
      foodPrepStore.selectFoodPrep(data.id_food_prep2)
      food_prep2_file_path1.value = getFoodPrep.value?.file_path1
      food_prep2_file_path2.value = getFoodPrep.value?.file_path2
      food_prep2_file_path3.value = getFoodPrep.value?.file_path3
      memo_foodPrep2.value = getFoodPrep.value?.memo_food_prep
      memo_feeding2.value = getFoodPrep.value?.memo_feeding
    }
    foodPrepList.value = [...foodPrepListDefault]
  } else {
    if (selectingType !== 'foodPrep1' && selectingType !== 'foodPrep2') {
      cage_file_path1.value = null
      cage_file_path2.value = null
      cage_file_path3.value = null
      memo_cage_condition.value = null
      memo_purpose.value = null
    }
    if (selectingType !== 'foodPrep2' && selectingType !== 'cageCondition') {
      food_prep_file_path1.value = null
      food_prep_file_path2.value = null
      food_prep_file_path3.value = null
      memo_foodPrep1.value = null
    }
    if (selectingType !== 'foodPrep1' && selectingType !== 'cageCondition') {
      food_prep2_file_path1.value = null
      food_prep2_file_path2.value = null
      food_prep2_file_path3.value = null
      memo_foodPrep2.value = null
    }
  }
}
const handleDayType = (value: any, type: String) => {
  if (type == 'start_day') {
    start_plan.value = value == 'today' ? getDateToday() : getDaysAfter(1)
  } else {
    goal_plan.value =
      value == 'today'
        ? getDateToday()
        : value == 'tomorrow'
        ? getDaysAfter(1)
        : getDaysAfter(2)
  }
}
const setTime = (hour: Number, type: String) => {
  if (type == 'start_day') {
    handleDayType(start_day.value, 'start_day')
    hour = hour < 10 ? '0' + hour : hour
    start_plan_HH_MM.value = hour + ':00'
  }
  if (type == 'goal_day') {
    handleDayType(goal_day.value, 'goal_day')
    hour = hour < 10 ? '0' + hour : hour
    goal_plan_HH_MM.value = hour + ':00'
  }
}
const getTitle = () => {
  let title: any = `預かり管理: ${
    customerStore.getAllCustomers.find((v) => v.value === props.id_customer)
      ?.label
  }`
  title = isPet.value
    ? concatenate(
        title,
        '/',
        petListDefault.find((v) => v.value === props.id_pet)?.label
      )
    : concatenate(title, '')
  return title
}
const getNameService = (idItemService: string) => {
  return itemServiceStore.getAllItems.find(
    (v) => v.id_item_service === idItemService
  )?.label
}
async function selectingCustomer(value: any) {
  isPet.value = false
  await customerStore.selectCustomer(value)
  petListDefault.length = 0
  petListDefault.push(...customerStore.getCustomer.pets)
  petList.value = [...petListDefault]
  data.id_pet = petList.value?.[0]?.id_pet
  isPet.value = true
}

const onUpdateStartDate = (value: string) => {
  goal.value = value
}

onMounted(async () => {
  await cageStore.fetchPreparationCages()
  customerListDefault.push(...customerStore.getAllCustomers)
  customerList.value = [...customerListDefault]
  cageListDefault.push(...cageStore.getAllCages)
  cageList.value = [...cageListDefault]
  if (!cageConditionStore.getAllCageConditions.length) {
    await cageConditionStore.fetchCageConditions()
  }
  cageConditionsDefault.push(...cageConditionStore.getAllCageConditions)
  cageConditions.value = [...cageConditionsDefault]
  foodPrepListDefault.push(...foodPrepStore.getAllFoodPreps)
  foodPrepList.value = [...foodPrepListDefault]

  if (props.id_customer) {
    await customerStore.selectCustomer(props.id_customer)
    petListDefault.push(...customerStore.getCustomer.pets)
    petList.value = [...petListDefault]
    if (petList.value.length && petList.value.length > 0) {
      isPet.value = true
    }
  }

  if (props.data?.id_pet_custody) {
    // Edit cases
    isEdit.value = true
    data.id_customer = props.data.id_customer
    data.id_pet = props.data.id_pet
    data.id_cage_condition = props.data.id_cage_condition
    data.id_food_prep1 = props.data.id_food_prep1
    data.id_food_prep2 = props.data.id_food_prep2
    data.flg_hospitalization = props.data.flg_hospitalization
    data.flg_assisted_feeding = props.data.flg_assisted_feeding
    data.flg_iv_catheter_exchange = props.data.flg_iv_catheter_exchange
    data.flg_iv_catheter_remove = props.data.flg_iv_catheter_remove
    data.flg_scheduled_hydration = props.data.flg_scheduled_hydration
    data.flg_assisted_urination = props.data.flg_assisted_urination
    data.flg_walk = props.data.flg_walk
    data.flg_temperature = props.data.flg_temperature

    init(props.data.id_cage_condition, 'all')
    if (
      props.data.datetime_start_plan !== '' &&
      props.data.datetime_start_plan !== null
    ) {
      start_plan.value = formatDate(props.data.datetime_start_plan)
      start_plan_HH_MM.value = formatHoursMinutes(
        props.data.datetime_start_plan
      )
    } else {
      start_plan.value = ''
      start_plan_HH_MM.value = ''
    }
    if (
      props.data.datetime_goal_plan !== '' &&
      props.data.datetime_goal_plan !== null
    ) {
      goal_plan.value = formatDate(props.data.datetime_goal_plan)
      goal_plan_HH_MM.value = formatHoursMinutes(props.data.datetime_goal_plan)
    } else {
      goal_plan.value = ''
      goal_plan_HH_MM.value = ''
    }
    if (
      props.data.datetime_start !== '' &&
      props.data.datetime_start !== null
    ) {
      start.value = formatDate(props.data.datetime_start)
      start_HH_MM.value = formatHoursMinutes(props.data.datetime_start)
    } else {
      start.value = ''
      start_HH_MM.value = ''
    }
    if (props.data.datetime_goal !== '' && props.data.datetime_goal !== null) {
      goal.value = formatDate(props.data.datetime_goal)
      goal_HH_MM.value = formatHoursMinutes(props.data.datetime_goal)
    } else {
      goal.value = ''
      goal_HH_MM.value = ''
    }
    if (
      (props.data.datetime_goal !== '' && props.data.datetime_goal !== null) ||
      (props.data.datetime_start !== '' && props.data.datetime_start !== null)
    ) {
      // if (props.data.datetime_goal !== '' && props.data.datetime_goal !== null && props.data.datetime_start !== '' && props.data.datetime_start !== null) {
      isActualDates.value = true
    } else {
      isActualDates.value = false
    }
    data.memo = props.data.memo
    data.id_cage = props.data.id_cage
    isPet.value = true
  } else {
    // Create cases
    isEdit.value = false
    data['flg_hospitalization'] = props.flg_hospitalization
    isPet.value = true
    start.value = ''
    start_plan_HH_MM.value = formatHoursMinutes(getDateTimeNow()).split(':')[0] + ':00'
    goal.value = ''
    goal_plan_HH_MM.value = formatHoursMinutes(getHoursAfter(3)).split(':')[0] + ':00'
    data.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <!-- I used the below q-scroll-area, because of the double scroll issue in the popup. -->
  <q-scroll-area style="max-width: 100%; height: calc(100vh - 50px)">
    <q-form @submit="submit">
      <MtModalHeader @closeModal="closeModal">
        <q-toolbar-title class="text-grey-900 title2 bold">
          {{ isEdit ? getTitle() : '預かり・入院管理' }}
        </q-toolbar-title>
        <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
          <q-icon size="xs" name="more_horiz" />
        </q-btn>
      </MtModalHeader>
      <q-card-section class="content q-px-xl">
        <div class="row q-col-gutter-sm q-mb-sm">
          <div
            class="text-blue cursor-pointer"
            v-if="isEdit && props.data?.id_request"
            @click="goTO(props.data?.id_request)"
          >
            {{ props.data?.number_request }} : {{ props.data?.title_request }}
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md" v-if="!isEdit">
          <div class="col-4">
            <MtFilterSelect
              label="診察券番号・オーナー名 *"
              v-model:selecting="data.id_customer"
              v-model:options="customerList"
              :options-default="customerListDefault"
              @update:selecting="selectingCustomer"
              :readonly="props.id_pet ? true : false"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
          <div class="col-4" v-show="isPet">
            <MtPetFilterSelect
              :pet-list="petList"
              v-model:selecting="data.id_pet"
              label="ペット名 *"
              :readonly="props.id_customer ? true : false"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </div>
        <hr class="light q-mb-md" />
        <!-- Basic setting for task -->
        <div class="q-mb-sm">
          <h4 class="text-white bg-grey-600 title4">預かり予定日時</h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{
              isEdit
                ? '預かり一覧では予定日範囲により表示します。'
                : '予定日時を設定してください。預かり一覧では予定日範囲により表示します。'
            }}
          </span>
        </div>
        <div v-if="!isEdit" class="row q-pa-sm q-mt-lg q-mb-md">
          <div class="col-6 q-col-gutter-md bg-accent-050">
            <div class="q-px-md q-py-sm">
              <small class="text-grey-600 q-mr-md">入力補助：開始予定</small>
              <small>
                <MtInputForm
                  type="radio"
                  :items="[
                    { label: '今日', value: 'today' },
                    { label: '明日', value: 'tomorrow' }
                  ]"
                  v-model="start_day"
                  @update:model-value="(v) => handleDayType(v, 'start_day')"
                />
              </small>
              <!-- Select today or tomorrow for start-plan date -->
            </div>
            <div class="q-pa-sm q-ml-md q-mb-md">
              <small
                class="input-assist-datetime"
                @click="setTime(hour, 'start_day')"
                v-for="(hour, i) in time_range"
                :key="i"
                >{{ hour }}時</small
              >
            </div>
            <div class="q-pa-sm q-ml-md q-mb-md">
              <small class="text-grey-700 q-mr-md">
                現在時刻：
                {{ todatDateTime }}
              </small>
            </div>
          </div>
          <div class="col-6 q-col-gutter-md bg-accent-050 q-ml-md">
            <div class="q-px-md q-py-sm">
              <small class="text-grey-600 q-mr-md">入力補助：終了予定</small>
              <small
                ><MtInputForm
                  type="radio"
                  :items="[
                    { label: '今日', value: 'today' },
                    { label: '明日', value: 'tomorrow' },
                    { label: '明後日', value: 'day-after-tomorrow' }
                  ]"
                  v-model="goal_day"
                  @update:model-value="(v) => handleDayType(v, 'goal_day')"
              /></small>
              <!-- Select today or tomorrow for start-plan date -->
            </div>
            <div class="q-pa-sm q-ml-md q-mb-md">
              <small
                class="input-assist-datetime"
                @click="setTime(hour, 'goal_day')"
                v-for="(hour, j) in time_range"
                :key="j"
                >{{ hour }}時</small
              >
            </div>
          </div>
        </div>
        <div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="start_plan"
                type="date"
                label="開始予定 *"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-3">
              <MtFormPullDown
                type="selection"
                v-model:selected="start_plan_HH_MM"
                :options="timeHourMinute"
                label="時：分 *"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>

            <div class="flex items-center">
              <q-btn
                outline
                class="bg-grey-100 text-grey-800"
                @click="startPlanUpdate"
              >
                <span>
                  開始の反映
                  <q-icon
                    name="south_west"
                    class="q-ml-sm text-grey-500"
                    size="16"
                  />
                </span>
              </q-btn>
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="goal_plan"
                type="date"
                label="終了予定"
              />
            </div>
            <div class="col-3">
              <MtFormPullDown
                type="selection"
                v-model:selected="goal_plan_HH_MM"
                :options="timeHourMinute"
                label="時：分"
              />
            </div>

            <div class="flex items-center">
              <q-btn
                outline
                class="bg-grey-100 text-grey-800"
                @click="goalPlanUpdate"
              >
                <span>
                  終了の反映
                  <q-icon
                    name="south_west"
                    class="q-ml-sm text-grey-500"
                    size="16"
                  />
                </span>
              </q-btn>
            </div>
          </div>
        </div>
        <hr class="light q-mb-md" />
        <!-- Basic setting for task -->
        <div class="q-mb-sm">
          <h4 class="text-white bg-grey-600 title4">実績日時</h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{
              isEdit
                ? '実際の預かり日時を記録します。'
                : '実際の預かり日時を記録します。'
            }}
          </span>
        </div>
        <div>
          <div class="row q-col-gutter-md q-mb-lg">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="start"
                type="date"
                label="開始日時(実績)"
                @update:date="onUpdateStartDate"
              />
            </div>
            <div class="col-3">
              <MtFormPullDown
                type="selection"
                v-model:selected="start_HH_MM"
                :options="timeHourMinute"
                label="時：分"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-3">
              <MtFormInputDate
                v-model:date="goal"
                type="date"
                label="終了日時(実績)"
              />
            </div>
            <div class="col-3">
              <MtFormPullDown
                type="selection"
                v-model:selected="goal_HH_MM"
                :options="timeHourMinute"
                label="時：分"
              />
            </div>
          </div>
        </div>
        <hr class="light q-mb-md" />
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '入院管理' }]"
              v-model="data.flg_hospitalization"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '留置針：交換' }]"
              v-model="data.flg_iv_catheter_exchange"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '留置針：抜去' }]"
              v-model="data.flg_iv_catheter_remove"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '強制給餌' }]"
              v-model="data.flg_assisted_feeding"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '定時給水' }]"
              v-model="data.flg_scheduled_hydration"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '排尿補助・尿カテ' }]"
              v-model="data.flg_assisted_urination"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '散歩' }]"
              v-model="data.flg_walk"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '体温管理' }]"
              v-model="data.flg_temperature"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12">
            <MtInputForm
              type="text"
              v-model="data.memo"
              label="預かりメモ"
              autogrow
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-4">
            <MtFilterSelect
              v-model="data.id_cage"
              v-model:selecting="data.id_cage"
              v-model:options="cageList"
              :options-default="cageListDefault"
              label="ケージ"
              @selected="selectCage"
            />
          </div>
          <div v-if="data.id_cage" class="col-4">
            <MtInputForm
              type="text"
              v-model="selectedRoom"
              disable
              label="部屋・区画"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-md items-center">
          <div class="col-6">
            <MtFilterSelect
              type="selection"
              v-model:selecting="data.id_cage_condition"
              v-model:options="cageConditions"
              :options-default="cageConditionsDefault"
              label="ケージ準備CD"
              @update:selecting="(e) => init(e, 'cageCondition')"
            />
          </div>
          <div class="col-2" v-if="cage_file_path1">
            <q-img
              :src="cage_file_path1"
              spinner-color="white"
              class="full-width"
            />
          </div>
          <div class="col-2" v-if="cage_file_path2">
            <q-img
              :src="cage_file_path2"
              spinner-color="white"
              class="full-width"
            />
          </div>
          <div class="col-2" v-if="cage_file_path3">
            <q-img
              :src="cage_file_path3"
              spinner-color="white"
              class="full-width"
            />
          </div>
          <div
            class="col-6 text-center"
            v-if="
              data.id_cage_condition &&
              cage_file_path1 === null &&
              cage_file_path2 === null &&
              cage_file_path3 === null
            "
          >
            ※ケージ準備状態の参考画像はありません。
          </div>
        </div>
        <div class="row q-col-gutter-xl q-mb-lg items-center">
          <div class="col-4"></div>
          <div class="col-6 text-center">
            <span v-if="memo_cage_condition">{{ memo_cage_condition }}</span>
            <span v-if="memo_purpose !== 'null'">{{ memo_purpose }}</span>
          </div>
        </div>
        <hr class="light" />
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-4">
            <MtInputForm
              type="checkbox"
              :items="[{ label: '通常ごはん' }]"
              v-model="data.flg_feed"
              @update:model-value="init"
              class="oneline-checkbox"
            />
          </div>
        </div>
        <div v-if="data.flg_feed" class="row q-col-gutter-md q-mb-lg">
          <div class="col-6">
            <div class="row q-col-gutter-md q-mb-md items-center">
              <div class="col-12">
                <MtFilterSelect
                  type="selection"
                  v-model:selecting="data.id_food_prep1"
                  v-model:options="foodPrepList"
                  :options-default="foodPrepListDefault"
                  label="フード準備CD1"
                  @update:selecting="(e) => init(e, 'foodPrep1')"
                />
              </div>
              <div class="col-4" v-if="food_prep_file_path1">
                <q-img
                  :src="food_prep_file_path1"
                  spinner-color="white"
                  class="full-width"
                />
                <div class="text-center">
                  {{ getNameService(getFoodPrep?.id_item_service1) }}
                </div>
              </div>
              <div class="col-4" v-if="food_prep_file_path2">
                <q-img
                  :src="food_prep_file_path2"
                  spinner-color="white"
                  class="full-width"
                />
                <div class="text-center">
                  {{ getNameService(getFoodPrep?.id_item_service2) }}
                </div>
              </div>
              <div class="col-4" v-if="food_prep_file_path3">
                <q-img
                  :src="food_prep_file_path3"
                  spinner-color="white"
                  class="full-width"
                />
                <div class="text-center">
                  {{ getNameService(getFoodPrep?.id_item_service3) }}
                </div>
              </div>
              <div
                class="col-12 text-center"
                v-if="
                  data.id_cage_condition &&
                  food_prep_file_path1 === null &&
                  food_prep_file_path2 === null &&
                  food_prep_file_path3 === null
                "
              >
                ※フード準備の参考画像はありません。
              </div>
              <div class="col-12 q-mt-md">
                <span v-if="memo_foodPrep1"
                  ><span class="text-weight-bold"
                    >準備方法・フード選択方法: </span
                  >{{ memo_foodPrep1 }}</span
                >
              </div>
              <div class="col-12" v-if="memo_feeding1">
                <span
                  ><span class="text-weight-bold">給餌方法:</span>
                  {{ memo_feeding1 }}</span
                >
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="row q-col-gutter-md q-mb-md items-center">
              <div class="col-12">
                <MtFilterSelect
                  type="selection"
                  v-model:selecting="data.id_food_prep2"
                  v-model:options="foodPrepList"
                  :options-default="foodPrepListDefault"
                  label="フード準備CD2"
                  @update:selecting="(e) => init(e, 'foodPrep2')"
                />
              </div>
              <div class="col-4" v-if="food_prep2_file_path1">
                <q-img
                  :src="food_prep2_file_path1"
                  spinner-color="white"
                  class="full-width"
                />
                <div class="text-center">
                  {{ getNameService(getFoodPrep?.id_item_service1) }}
                </div>
              </div>
              <div class="col-4" v-if="food_prep2_file_path2">
                <q-img
                  :src="food_prep2_file_path2"
                  spinner-color="white"
                  class="full-width"
                />
                <div class="text-center">
                  {{ getNameService(getFoodPrep?.id_item_service2) }}
                </div>
              </div>
              <div class="col-4" v-if="food_prep2_file_path3">
                <q-img
                  :src="food_prep2_file_path3"
                  spinner-color="white"
                  class="full-width"
                />
                <div class="text-center">
                  {{ getNameService(getFoodPrep?.id_item_service3) }}
                </div>
              </div>
              <div
                class="col-12 text-center"
                v-if="
                  data.id_cage_condition &&
                  food_prep2_file_path1 === null &&
                  food_prep2_file_path2 === null &&
                  food_prep2_file_path3 === null
                "
              >
                ※フード準備の参考画像はありません。
              </div>
              <div class="col-12 q-mt-md">
                <span v-if="memo_foodPrep2"
                  ><span class="text-weight-bold"
                    >準備方法・フード選択方法:
                  </span>
                  {{ memo_foodPrep2 }}</span
                >
              </div>
              <div class="col-12" v-if="memo_feeding2">
                <span
                  ><span class="text-weight-bold">給餌方法: </span>
                  {{ memo_feeding2 }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-bt bg-white">
        <div class="text-center modal-btn">
          <q-btn
            outline
            class="bg-grey-100 text-grey-800"
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn type="submit" unelevated color="primary" class="q-ml-md">
            <span>保存</span>
          </q-btn>
        </div>
      </q-card-section>
    </q-form>
  </q-scroll-area>
</template>
