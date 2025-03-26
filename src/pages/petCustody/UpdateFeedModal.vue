<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import {
  concatenate,
  dateFormat,
  formatDateWithTime,
  formatHoursMinutes,
  getDateTimeNow,
  getDateToday,
  getDaysAfter,
  getFullPetName,
  getHoursAfter,
  getHoursAfterByDate,
  processFormatHourMinutes,
  checkDateRange
} from '@/utils/aahUtils'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import useFoodPrepStore from '@/stores/food-prep'
import useEmployeeStore from '@/stores/employees'
import usefeedstore from '@/stores/feed'
import ZoomImageModal from '../message/ZoomImageModal.vue'
import useCustodyCheckListsStore from '@/stores/custody-checklists'
import UpdateFoodPrepModal from '../master/foodPrep/UpdateFoodPrepModal.vue'
import useItemStore from '@/stores/items'
import useCommonStore from '@/stores/common'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import { timeHourMinute, typeFoodAmount, typeFoodPrep } from '@/utils/enum'
import dayjs from 'dayjs'

const emits = defineEmits(['close'])

const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const data = ref({
  id_customer: null,
  id_pet: null,
  id_food_prep: null,
  type_food_amount: 20,
  name_food_prep: null,
  type_food_prep: null,
  file_path1: null,
  file_path2: null,
  file_path3: null,
  id_item_service1: '',
  id_item_service2: '',
  id_item_service3: '',
  memo_food_prep: null,
  memo_feeding: null,
  flg_customer_food_exist: false,
  id_custody_checklist: null,
  flg_with_medicine: false,
  id_prescription: null,
  datetime_feed_plan: '',
  datetime_feed_result: null,
  id_employee_fed: null,
  memo_observation: null,
  type_review_food: null
})

const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const foodPrepStore = useFoodPrepStore()
const custodyCheckListStore = useCustodyCheckListsStore()
const employeeStore = useEmployeeStore()
const itemService = useItemStore()
const feedStore = usefeedstore()
const { getCommonTypeReviewFood } = storeToRefs(commonStore)
const { getCustomerOption } = storeToRefs(customerStore)
const { getAllCustodyCheckLists } = storeToRefs(custodyCheckListStore)
const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])
const foodPrepList: any = ref([])
const foodPrepListDefault: any = reactive([])
const custodyCheckList: any = ref([])
const custodyCheckListDefault: any = reactive([])
const fedEmployee: any = ref([])
const fedEmployeeDefault: any = reactive([])
const serviceItemsList = ref<any>([])
const serviceItemsListDefault = reactive<any>([])
const isEdit = ref(false)
const isPet = ref(false)
const isPetCustody = ref(false)
const isPrescription = ref(false)
const isFoodPrep = ref(false)
const feed_plan = ref(getDateToday())
const feed_result = ref()
const feed_plan_HH_MM = ref('00:00')
const feed_result_HH_MM = ref()
const start_day = ref('today')
const time_range = ref([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18])
const selectedFoodPrep = ref()
const props = defineProps({
  id_pet_custody: {
    type: String,
    default: ''
  },
  data: {
    type: Array,
    default: []
  },
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  customer_Id: {
    type: String,
    default: ''
  },
  foodPrepIds: {
    type: Object,
    default: {}
  },
  feedPlanDate: {
    type: String,
    default: ''
  },
  defaultHour: {
    type: String,
    default: ''
  }
})
const todatDateTime = ref(formatDateWithTime(getDateTimeNow()))
const closeModal = () => {
  emits('close')
}
const init = async () => {
  if (data.value.flg_customer_food_exist) {
    isPetCustody.value = true
  } else {
    isPetCustody.value = false
  }
  if (data.value.flg_with_medicine) {
    isPrescription.value = true
  } else {
    isPrescription.value = false
  }
}
async function selectingCustomer(value: any) {
  data.value.id_customer = value
  if (value) {
    await customerStore.selectCustomerOptions(value)
    let selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: any) => {
          petListDefault.push({
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet
          })
        })
        petList.value = [...petListDefault]
        isPet.value = true
        if (!isEdit.value && petList.value.length > 0) {
          data.value.id_pet = petList.value[0].value // set first pet as default
        }
        await handleCustodyCheckList(data.value.id_pet)
      }
    }
  } else {
    data.value.id_pet = null
    isPet.value = false
    petList.value.length = 0
    petListDefault.length = 0
    custodyCheckList.value.length = 0
    custodyCheckListDefault.length = 0
  }
}
const handleCustodyCheckList = async (value: any) => {
  if (value) {
    await custodyCheckListStore.fetchCustodyCheckList({
      flg_need_return: false,
      flg_custody_returned: false,
      id_customer: data.value.id_customer,
      id_pet: value
    })
    custodyCheckList.value.length = 0
    custodyCheckListDefault.length = 0
    custodyCheckListDefault.push(...getAllCustodyCheckLists.value)
    custodyCheckList.value = [...custodyCheckListDefault]
  } else {
    await custodyCheckListStore.fetchCustodyCheckList({
      flg_need_return: false,
      flg_custody_returned: false,
      id_customer: data.value.id_customer
    })
    custodyCheckList.value.length = 0
    custodyCheckListDefault.length = 0
    custodyCheckListDefault.push(...getAllCustodyCheckLists.value)
    custodyCheckList.value = [...custodyCheckListDefault]
  }
}
async function selectingPet(value: any) {
  await handleCustodyCheckList(value)
}
async function selectingFoodPrep(value: any) {
  data.value.id_food_prep = value
  if (value) {
    foodPrepStore.selectFoodPrep(value)
    selectedFoodPrep.value = foodPrepStore.getFoodPrep
    isFoodPrep.value = true
    if (selectedFoodPrep) {
      data.value.name_food_prep = selectedFoodPrep.value?.name_food_prep
      data.value.type_food_prep = selectedFoodPrep.value?.type_food_prep
      data.value.file_path1 = selectedFoodPrep.value?.file_path1
      data.value.file_path2 = selectedFoodPrep.value?.file_path2
      data.value.file_path3 = selectedFoodPrep.value?.file_path3
      data.value.id_item_service1 = selectedFoodPrep.value?.id_item_service1
      data.value.id_item_service2 = selectedFoodPrep.value?.id_item_service2
      data.value.id_item_service3 = selectedFoodPrep.value?.id_item_service3
      data.value.memo_food_prep = selectedFoodPrep.value?.memo_food_prep
      data.value.memo_feeding = selectedFoodPrep.value?.memo_feeding
    } else {
      data.value.name_food_prep = null
      data.value.type_food_prep = null
      data.value.id_item_service1 = ''
      data.value.id_item_service2 = ''
      data.value.id_item_service3 = ''
      data.value.file_path1 = null
      data.value.file_path2 = null
      data.value.file_path3 = null
      data.value.memo_food_prep = null
      data.value.memo_feeding = null
    }
  } else {
    isFoodPrep.value = false
    data.value.id_food_prep = null
  }
}
const handleDayType = (value: any) => {
  feed_plan.value = value == 'today' ? getDateToday() : getDaysAfter(1)
}
const setTime = (hour: Number, type: String) => {
  if (type == 'start_day') {
    handleDayType(start_day.value)
    hour = hour < 10 ? '0' + hour : hour
    feed_plan_HH_MM.value = hour + ':00'
  }
}
const ReviewFoodList = computed(() => {
  let list = getCommonTypeReviewFood.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})
const handleReflectionDateTime = () => {
  if (feed_plan.value != '') {
    feed_result.value = feed_plan.value
    feed_result_HH_MM.value = feed_plan_HH_MM.value
  }
}
const openImageViewModal = (image: any, index: any, singleImage: any) => {
  mtUtils.imageViewPopup(ZoomImageModal, {
    files: image,
    index: index,
    singleImage: singleImage
  })
}
const submit = async () => {
  if (
    !checkDateRange([
      { start_date: feed_plan.value, end_date: feed_result.value }
    ])
  )
    return false
  if (feed_plan.value != '') {
    data.value.datetime_feed_plan = feed_plan.value
    data.value.datetime_feed_plan +=
      feed_plan_HH_MM.value !== null ? ' ' + feed_plan_HH_MM.value : ' 00'
    data.value.datetime_feed_plan += ':00'
  }
  if (feed_result.value != null) {
    data.value.datetime_feed_result = feed_result.value
    data.value.datetime_feed_result +=
      feed_result_HH_MM.value !== null ? ' ' + feed_result_HH_MM.value : ' 00'
    data.value.datetime_feed_result += ':00'
  }
  const sendingData = {
    id_customer: data.value.id_customer,
    id_pet: data.value.id_pet,
    datetime_feed_plan: data.value.datetime_feed_plan.replaceAll('/', '-'),
    datetime_feed_result: data.value.datetime_feed_result?.replaceAll('/', '-'),
    id_food_prep: data.value.id_food_prep,
    type_food_amount: data.value.type_food_amount,
    memo_feeding: data.value.memo_feeding,
    flg_customer_food_exist: data.value.flg_customer_food_exist,
    flg_with_medicine: data.value.flg_with_medicine,
    id_prescription: data.value.id_prescription,
    number_prescription: data.value.id_prescription,
    id_employee_fed: data.value.id_employee_fed,
    memo_observation: data.value.memo_observation,
    type_review_food: data.value.type_review_food,
    id_custody_checklist: data.value.id_custody_checklist,
    id_pet_custody: props.id_pet_custody
  }
  if (props.data?.id_feed) {
    await feedStore.updatefeed(data.value?.id_feed, sendingData)
    props.updatedFlg.value = true
    mtUtils.autoCloseAlert('ごはんを追加しました')
    closeModal()
  } else {
    await feedStore.submitfeed(sendingData)
    props.updatedFlg.value = true
    mtUtils.autoCloseAlert('ごはんを追加しました')
    closeModal()
  }
}
const openExternalLink = async (data: any) => {
  await mtUtils.popup(UpdateFoodPrepModal, { data })
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
        .then(async (confirmation) => {
          if (confirmation) {
            await feedStore.destroyefeed(props.data?.id_feed).then(() => {
              props.updatedFlg.value = true
              closeModal()
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

const selectDefaultFoodPrep = async (propData: any) => {
  if (propData?.id_food_prep1 !== null && propData?.id_food_prep2 !== null) {
    let breakFastTime = Intl.DateTimeFormat('EN-GB', {
      hourCycle: 'h24',
      timeStyle: 'medium'
    }).format(new Date(`${getDateToday()} 13:00:00`))
    let currentTime = Intl.DateTimeFormat('EN-GB', {
      hourCycle: 'h24',
      timeStyle: 'medium'
    }).format(new Date())
    if (currentTime > breakFastTime) {
      data.value.id_food_prep = propData?.id_food_prep2
      await selectingFoodPrep(propData?.id_food_prep2)
    } else {
      data.value.id_food_prep = propData?.id_food_prep1
      await selectingFoodPrep(propData?.id_food_prep1)
    }
  } else if (propData?.id_food_prep1 !== null) {
    data.value.id_food_prep = propData?.id_food_prep1
    await selectingFoodPrep(propData?.id_food_prep1)
  } else if (propData?.id_food_prep2 !== null) {
    data.value.id_food_prep = propData?.id_food_prep2
    await selectingFoodPrep(propData?.id_food_prep2)
  }
}

function setupDefaultValues() {
  feed_result.value = getDateToday()
  let currentTime = processFormatHourMinutes(getDateTimeNow())
  feed_result_HH_MM.value = currentTime
  data.value.memo_observation = '自動 / 異常なし'
  data.value.id_employee_fed = JSON.parse(localStorage.getItem('id_employee'))
  data.value.type_review_food = ReviewFoodList.value[1].value
  submit()
}
const selectDefaultEmployee = () => {
  data.value.id_employee_fed = defaultEmployee
}

const getPetName = () => {
  let selectedCustomer: any = customerStore.getAllCustomers.find(
    (customer) => customer.value === data.value.id_customer
  )
  let selectedPet = getCustomerOption.value?.pets?.find(
    (pet: any) => pet.value == data.value.id_pet
  )
  return getFullPetName(selectedPet, selectedCustomer)
}
onMounted(async () => {
  if (props.customer_Id) {
    await selectingCustomer(props.customer_Id)
  }
  feed_plan_HH_MM.value =
    formatHoursMinutes(getDateTimeNow()).split(':')[0] + ':00'
  if (props.data?.id_feed) {
    data.value = props.data
    data.value.id_prescription = props.data?.number_prescription
    isEdit.value = true
    await selectingCustomer(props.data?.id_customer)
    await selectingFoodPrep(props.data?.id_food_prep)
    feed_plan.value = Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'short'
    }).format(new Date(props.data?.datetime_feed_plan))
    feed_plan_HH_MM.value = formatHoursMinutes(props.data?.datetime_feed_plan)
    feed_result.value = props.data?.datetime_feed_result
      ? Intl.DateTimeFormat('fr-CA', {
          dateStyle: 'short'
        }).format(new Date(props.data?.datetime_feed_result))
      : null
    feed_result_HH_MM.value = props.data?.datetime_feed_result
      ? Intl.DateTimeFormat('EN-GB', {
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(props.data?.datetime_feed_result))
      : null
  } else {
    // for create case
    feed_plan.value = dateFormat(new Date(props.feedPlanDate)) ?? getDateToday()
    feed_result.value = dateFormat(new Date(props.feedPlanDate)) ?? getDateToday()
    data.value.id_employee_fed = defaultEmployee
    // if (props.defaultHour) feed_plan_HH_MM.value = props.defaultHour + ':00'
  }
  if (props.foodPrepIds?.id_food_prep1 || props.foodPrepIds?.id_food_prep2) {
    await selectDefaultFoodPrep(props.foodPrepIds)
  }
  await init()
  customerList.value.length = 0
  customerListDefault.length = 0
  customerListDefault.push(...customerStore.getAllCustomers)
  customerList.value = [...customerListDefault]
  foodPrepList.value.length = 0
  foodPrepListDefault.length = 0
  foodPrepListDefault.push(...foodPrepStore.getAllFoodPreps)
  foodPrepList.value = [...foodPrepListDefault]
  custodyCheckList.value.length = 0
  custodyCheckListDefault.length = 0
  custodyCheckListDefault.push(...getAllCustodyCheckLists.value)
  custodyCheckList.value = [...custodyCheckListDefault]
  fedEmployee.value.length = 0
  fedEmployeeDefault.length = 0
  fedEmployeeDefault.push(...employeeStore.getAllEmployees)
  fedEmployee.value = [...fedEmployeeDefault]
  serviceItemsList.value.length = 0
  serviceItemsListDefault.length = 0
  serviceItemsList.value = [...itemService.getAllServiceItems]
  serviceItemsListDefault.push(...itemService.getAllServiceItems)

  if (props.defaultHour) { // check if there's default hour props
    if (parseInt(props.defaultHour) < 6) { // if default hour is ranging from 00:00 to 05:00, add 1 day to date
      feed_plan.value = dayjs(feed_plan.value).add(24 + parseInt(props.defaultHour), 'hour').format('YYYY/MM/DD')
      feed_plan_HH_MM.value = dayjs(feed_plan.value).add(24 + parseInt(props.defaultHour), 'hour').format('HH:mm')
      feed_result.value = dayjs(feed_result.value).add(24 + parseInt(props.defaultHour), 'hour').format('YYYY/MM/DD')
      feed_result_HH_MM.value = dayjs(feed_result.value).add(24 + parseInt(props.defaultHour), 'hour').format('HH:mm')
      return
    }
    if (parseInt(props.defaultHour) > 5 && parseInt(props.defaultHour) < 10) { // if default hour is ranging from 06:00 to 09:00
      feed_plan_HH_MM.value = props.defaultHour + ':00'
      feed_result_HH_MM.value = props.defaultHour + ':00'
      return
    }
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        給餌
        <span class="q-ml-md">
          {{ getPetName() }}
        </span>
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-md content">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtFilterSelect
            label="診察券番号・オーナー名 *"
            v-model:selecting="data.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            @update:selecting="selectingCustomer"
            :rules="[aahValidations.validationRequired]"
            :disable="isEdit"
          />
        </div>
        <div v-show="isPet" class="col-lg-3 col-md-4 col-sm-6">
          <MtFilterSelect
            :options-default="petListDefault"
            v-model:options="petList"
            v-model:selecting="data.id_pet"
            label="ペット名"
            @update:selecting="selectingPet"
            :disable="isEdit"
          />
        </div>
        <div class="col-lg-3 col-md-4 col-sm-6">
          <q-btn
            outline
            class="bg-grey-100 text-grey-800"
            @click="setupDefaultValues"
          >
            <span>
              完食と記録
              <q-icon name="south" class="q-ml-xs text-grey-500" size="18px" />
            </span>
          </q-btn>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-auto">
          <MtInputForm
            type="checkbox"
            :items="[{ label: 'オーナー提供フード' }]"
            v-model="data.flg_customer_food_exist"
            @update:model-value="init"
            class="oneline-checkbox"
          />
        </div>
        <div class="col-lg-3 col-md-4 col-sm-6" v-if="isPetCustody">
          <MtFilterSelect
            label="預かり品チェックリスト"
            v-model:selecting="data.id_custody_checklist"
            v-model:options="custodyCheckList"
            :options-default="custodyCheckListDefault"
            class="bg-grey-200"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-auto">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '薬投与' }]"
            v-model="data.flg_with_medicine"
            @update:model-value="init"
          />
        </div>
        <div class="col-lg-3 col-md-4 col-sm-6" v-if="isPrescription">
          <MtInputForm
            type="text"
            v-model="data.id_prescription"
            label="処方箋番号"
            class="bg-grey-200"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-3 col-md-4 col-sm-6">
          <MtFilterSelect
            label="フード準備CD *"
            v-model:selecting="data.id_food_prep"
            v-model:options="foodPrepList"
            :options-default="foodPrepListDefault"
            @update:selecting="selectingFoodPrep"
          />
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <span>フード量 :</span>
          <MtInputForm
            type="radio"
            v-model="data.type_food_amount"
            :items="typeFoodAmount"
            required
          />
        </div>
      </div>
      <div v-if="isFoodPrep" class="bg-grey-100 q-my-lg q-pa-md">
        <div class="title2 bold">ごはん準備方法</div>
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-lg-6 col-md-6 col-sm-6">
            <div class="row q-col-gutter-md">
              <div class="col-6">
                <div
                  class="cursor-pointer"
                  @click="openExternalLink(selectedFoodPrep)"
                >
                  <MtInputForm
                    v-model="data.name_food_prep"
                    label="フード準備名"
                    type="text"
                    :readonly="true"
                    :input-style="{ cursor: 'pointer' }"
                  />
                </div>
              </div>
              <div class="col-6">
                <MtFilterSelect
                  v-model:selecting="data.type_food_prep"
                  :options-default="typeFoodPrep"
                  :options="typeFoodPrep"
                  label="フード準備区分"
                  :readonly="true"
                />
              </div>
              <div class="col-4" v-if="data.file_path1 !== null">
                <div class="text-center">フード画像1</div>
                <div class="relative-position">
                  <q-img
                    :src="data.file_path1"
                    spinner-color="white"
                    class="full-width"
                    @click="openImageViewModal(data.file_path1, 0, true)"
                  />
                </div>
                <div>
                  <MtFilterSelect
                    v-model:selecting="data.id_item_service1"
                    :options-default="serviceItemsListDefault"
                    :options="serviceItemsList"
                    label="優先使用フード1"
                    :readonly="true"
                  />
                </div>
              </div>
              <div class="col-4" v-if="data.file_path2 !== null">
                <div class="text-center">フード画像2</div>
                <div class="relative-position">
                  <q-img
                    :src="data.file_path2"
                    spinner-color="white"
                    class="full-width"
                    @click="openImageViewModal(data.file_path2, 0, true)"
                  />
                </div>
                <div>
                  <MtFilterSelect
                    v-model:selecting="data.id_item_service2"
                    :options-default="serviceItemsListDefault"
                    :options="serviceItemsList"
                    label="優先使用フード2"
                    :readonly="true"
                  />
                </div>
              </div>
              <div class="col-4" v-if="data.file_path3 !== null">
                <div class="text-center">フード画像3</div>
                <div class="relative-position">
                  <q-img
                    :src="data.file_path3"
                    spinner-color="white"
                    class="full-width"
                    @click="openImageViewModal(data.file_path3, 0, true)"
                  />
                </div>
                <div>
                  <MtFilterSelect
                    v-model:selecting="data.id_item_service3"
                    :options-default="serviceItemsListDefault"
                    :options="serviceItemsList"
                    label="優先使用フード3"
                    :readonly="true"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-6 col-md-6 col-sm-6">
            <div>
              <MtInputForm
                type="text"
                v-model="data.memo_food_prep"
                label="準備方法・フード選択方法"
                :autogrow="true"
                :readonly="true"
              />
            </div>
            <div>
              <MtInputForm
                type="text"
                v-model="data.memo_feeding"
                label="給餌方法"
                :autogrow="true"
                :readonly="true"
              />
            </div>
          </div>
        </div>
      </div>
      <hr class="light q-mb-md" />
      <!-- Basic setting for task -->
      <div class="q-mb-lg">
        <h4 class="text-white bg-grey-600 title4 regular">予定日時</h4>
        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
          {{ '予定日時を設定してください。' }}</span
        >
      </div>
      <div class="row q-col-gutter-md q-mx-sm q-mb-md">
        <div v-if="!isEdit" class="col-lg-6 col-md-6 col-sm-12 bg-accent-050">
          <div class="q-mx-sm">
            <small class="q-mr-md">入力補助：開始予定</small>
            <small>
              <MtInputForm
                type="radio"
                :items="[
                  { label: '今日', value: 'today' },
                  { label: '明日', value: 'tomorrow' }
                ]"
                v-model="start_day"
                @update:model-value="handleDayType"
              />
            </small>
            <!-- Select today or tomorrow for start-plan date -->
          </div>
          <div class="q-my-sm">
            <small
              class="fw-700 text-grey-800"
              @click="setTime(hour, 'start_day')"
              v-for="(hour, i) in time_range"
              :key="i"
            >
              <span class="q-pa-sm cursor-pointer"> {{ hour }}時</span> |
            </small>
          </div>
          <div class="q-pa-sm q-mb-md">
            <small> 現在時刻：{{ todatDateTime }} </small>
          </div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <MtFormInputDate
                v-model:date="feed_plan"
                type="date"
                label="予定日*"
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-6">
              <MtFormPullDown
                type="selection"
                v-model:selected="feed_plan_HH_MM"
                :options="timeHourMinute"
                label="時：分 *"
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="flex items-center">
              <q-btn
                @click="handleReflectionDateTime"
                outline
                class="bg-grey-100 text-grey-800"
              >
                実績へ反映
                <q-icon name="arrow_downward" class="q-ml-sm" />
              </q-btn>
            </div>
          </div>
        </div>
      </div>
      <hr class="light q-mb-md" />
      <div class="q-mb-sm">
        <h4 class="text-white bg-grey-600 title4 regular">実績日時</h4>
        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
          {{ '実際の給餌日時を記録します。' }}
        </span>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <MtFormInputDate
                v-model:date="feed_result"
                type="date"
                label="日時(実績)"
              />
            </div>
            <div class="col-6">
              <MtFormPullDown
                type="selection"
                v-model:selected="feed_result_HH_MM"
                :options="timeHourMinute"
                label="時：分"
              />
            </div>
            <div class="col-6">
              <InputEmployeeOptGroup
                v-model:selected="data.id_employee_fed"
                default-blank
                label="給餌者"
                clearable
                dense
                style="flex: 1"
                show-select-default-employee
                @update:select-default-employee="selectDefaultEmployee"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <MtInputForm
                type="text"
                label="給餌時の気づき"
                v-model="data.memo_observation"
                autogrow
              />
            </div>
          </div>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md"></div>
      <div class="row q-col-gutter-md q-mb-md">
        <span class="text-grey-600">食事状態 : </span>
        <MtFormRadiobtn
          class="q-mr-md"
          v-model:checked="data.type_review_food"
          v-for="(item, idx) in ReviewFoodList"
          :key="`${idx}-${item.value}`"
          v-model:selected="data.type_review_food"
          :label="item.label"
          :val="item.value"
        />
      </div>
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
