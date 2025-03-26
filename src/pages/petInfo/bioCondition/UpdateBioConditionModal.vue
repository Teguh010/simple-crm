<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import useCustomerStore from '@/stores/customers'
import { formatDate, formatHours, formatHoursMinutes, getDateTimeNow, getDateToday, getPetFirstName, processFormatHourMinutes } from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import usePetBioConditionStore from '@/stores/pet-bio-conditions'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import OptionModal from '@/components/OptionModal.vue'
import { storeToRefs } from 'pinia'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import usePetCustodyStore from '@/stores/pet-custodies'
import useCommonStore from "@/stores/common";
import { timeHourMinute } from '@/utils/enum'

const commonStore = useCommonStore()
const { 
  getCommonTypeReviewWater,
  getCommonTypeReviewFeces,
  getCommonTypeReviewUrine,
  getCommonTypeReviewVomit,
  getCommonTypeReviewRespiration,
  getCommonTypeReviewWellness,
  getCommonTypeReviewBodyTemprature
} = storeToRefs(commonStore)

const props = defineProps({
  id_pet: String,
  id_customer: String,
  pet_bio_condition: Object,
  date: String,
  updatedFlg: {
    type: Object,
    default: {
      value: false
    }
  },
  defaultHour: {
    type: String,
    default: ''
  }
})
const customerStore = useCustomerStore()
const petCustodyStore = usePetCustodyStore()
const { getPet, getCustomerOption } = storeToRefs(customerStore)
const petBioConditionStore = usePetBioConditionStore()
const emits = defineEmits(['close'])
const isEdit = ref(false)
const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])

const data = reactive({
  id_customer: '',
  id_pet: '',
  type_review_water: null,
  type_review_feces: null,
  type_review_urine: null,
  type_review_vomit: null,
  type_review_respiration: null,
  type_review_wellness: null,
  type_review_body_temperature: null,
  id_employee_reviewed: '',
  datetime_record: null,
  memo_record: '',
  datetime_recorded: null,
  memo: '',
  type_status_sharing: false
})
const today_record = ref(getDateToday())
const record_HH_MM = ref('00:00')
const defaultEmployee = JSON.parse(localStorage.getItem("id_employee"))

const ReviewWaterList = computed(() => {
  let list = getCommonTypeReviewWater.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const ReviewFecesList = computed(() => {
  let list = getCommonTypeReviewFeces.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const ReviewUrineList = computed(() => {
  let list = getCommonTypeReviewUrine.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const ReviewVomitList = computed(() => {
  let list = getCommonTypeReviewVomit.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const ReviewRespirationList = computed(() => {
  let list = getCommonTypeReviewRespiration.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const ReviewWellnessList = computed(() => {
  let list = getCommonTypeReviewWellness.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const ReviewBodyTempratureList = computed(() => {
  let list = getCommonTypeReviewBodyTemprature.value.map((item: any) => {
    return {
      label: item.label,
      value: item.id_common,
      enLabel: item.label
    }
  })
  return list
})

const selectingCustomer = async (value: any) => {
  await customerStore.selectCustomer(value)
  petListDefault.length = 0
  petListDefault.push(...customerStore.getCustomer.pets)
  petList.value = [...petListDefault]
}
const expanded = ref(false)
const assignPageData = (value: any) => {
  if (value) {
    for (let key in value) {
      data[key] = value[key]
    }
  }
}
const closeModal = () => {
  emits('close')
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
            petBioConditionStore
              .destroyPetBioCondition(
                props.pet_bio_condition?.id_pet_bio_condition
              )
              .then(() => {
                petBioConditionStore.fetchPetBioConditions({
                  id_pet: props.id_pet
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
const submit = async () => {
  if (today_record.value != '') {
    data.datetime_record = today_record.value
    data.datetime_record +=
      record_HH_MM.value !== null ? ' ' + record_HH_MM.value : ' 00'
    data.datetime_record += ':00'
  }
  if (isEdit.value) {
    petBioConditionStore
      .updatePetBioCondition(props.pet_bio_condition.id_pet_bio_condition, data)
      .then(async () => {
        props.updatedFlg.value = true
        await petBioConditionStore.fetchPetBioConditions({
          id_pet: props.id_pet
        })
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    petBioConditionStore.submitPetBioCondition(data).then(async () => {
      emits('close')
      await petBioConditionStore.fetchPetBioConditions({ id_pet: props.id_pet })
      mtUtils.autoCloseAlert(aahMessages.success)
      if (props.date) {
        await petCustodyStore.fetchPetCustodies({ date: props.date })
      }
    })
  }
}
const setupDefaultValues = async () => {
  if (today_record.value != '') {
    data.datetime_record = today_record.value
    let currentTime = processFormatHourMinutes(getDateTimeNow())
    data.datetime_record += ' ' + currentTime
    data.datetime_record += ':00'
  }
  data.type_review_water = ReviewWaterList.value?.[0]?.value
  data.type_review_feces = ReviewFecesList.value?.[0]?.value
  data.type_review_urine = ReviewUrineList.value?.[0]?.value
  data.type_review_vomit = ReviewVomitList.value?.[0]?.value
  data.type_review_respiration = ReviewRespirationList.value?.[0]?.value
  data.type_review_wellness = ReviewWellnessList.value?.[0]?.value
  data.type_review_body_temperature = ReviewBodyTempratureList.value?.[0]?.value

  data.memo_record = '自動 / 異常なし'
  petBioConditionStore.submitPetBioCondition(data).then(async () => {
      emits('close')
      await petBioConditionStore.fetchPetBioConditions({ id_pet: props.id_pet })
      mtUtils.autoCloseAlert(aahMessages.success)
      if (props.date) {
        await petCustodyStore.fetchPetCustodies({ date: props.date })
      }
    })
}
const getLabelColor = (attr: any, List: any, idx:any) => {
  if(List && List.length && List.length > 0) {
    return data[attr] === List[idx]?.value ? 'text-grey-800 text-weight-bold' : 'text-grey-500'
  }
  return ''
}
const selectDefaultEmployee = () => {
  data.id_employee_reviewed = defaultEmployee
}
onMounted(async () => {
  await useCommonStore().fetchPreparationCommonList({code_common: [18, 19, 20, 21, 22, 23, 24]})
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.id_pet && props.id_customer) {
    data.id_pet = props.id_pet
    data.id_customer = props.id_customer
    selectingCustomer(props.id_customer)
  }
  if (props.pet_bio_condition) {
    // Update case
    isEdit.value = true
    assignPageData(props.pet_bio_condition)
    if (data.datetime_record !== '' || data.datetime_record !== null) {
      today_record.value = formatDate(data.datetime_record)
      record_HH_MM.value = formatHoursMinutes(data.datetime_record)
    }
  } else {
    // Create case
    isEdit.value = false
    let currentTime = formatHoursMinutes(getDateTimeNow())
    record_HH_MM.value = currentTime.split(':')[0] + ':00'
    if (props.defaultHour) record_HH_MM.value = props.defaultHour + ':00'
    today_record.value = props.date ?? getDateToday()
    data.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    data.id_employee_reviewed = defaultEmployee
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        {{ getPetFirstName(getPet) }} の状態管理： 時刻
        {{ formatHoursMinutes(getDateTimeNow()) }}
        <span v-if="data.type_status_sharing" class="text-red bold">
          <MtInputForm
            label="画像のオーナー共有あり"
            class="q-mr-md text-red bold"
            v-model:checked="data.type_status_sharing"
            :readonly="data.type_status_sharing ? false : true"
          />
        </span>
      </q-toolbar-title>
      <q-btn v-if="props.pet_bio_condition" flat round @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-pb-sm">
        <div class="col-4">
          <MtFilterSelect
            label="診察券番号・オーナー名"
            v-model:selecting="data.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            @update:selecting="selectingCustomer"
            :readonly="props.id_pet ? true : false"
          />
        </div>
        <div class="col-4">
          <MtPetFilterSelect
            :pet-list="petList"
            v-model:selecting="data.id_pet"
            label="ペット名"
            :readonly="props.id_customer ? true : false"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-sm q-ml-xs">
        <q-btn
          outline
          class="q-py-none"
          @click="setupDefaultValues"          
        >
          <span>
            異常なし
            <q-icon name="south" class="q-ml-xs text-grey-500" size="18px" />
          </span>
        </q-btn>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">水分摂取状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-9">
          <MtFormRadiobtn
            class="q-mr-md"
            v-for="(item, idx) in ReviewWaterList"
            :key="`${idx}-${item.value}`"
            :label="item.label"
            v-model:selected="data.type_review_water"
            :val="item.value"
            :class="[getLabelColor('type_review_water', ReviewWaterList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">排便状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtFormRadiobtn
            v-for="(item, idx) in ReviewFecesList"
            :key="`${idx}-${item.value}`"
            class="q-mr-md"
            v-model:selected="data.type_review_feces"
            :label="item.label"
            :val="item.value"
            :class="[getLabelColor('type_review_feces', ReviewFecesList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">排尿状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtFormRadiobtn
            class="q-mr-md"
            v-model:checked="data.type_review_urine"
            v-for="(item, idx) in ReviewUrineList"
            :key="`${idx}-${item.value}`"
            v-model:selected="data.type_review_urine"
            :label="item.label"
            :val="item.value"
            :class="[getLabelColor('type_review_urine', ReviewUrineList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">嘔吐状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtFormRadiobtn
            v-for="(item, idx) in ReviewVomitList"
            class="q-mr-md"
            :key="`${idx}-${item.value}`"
            v-model:selected="data.type_review_vomit"
            :label="item.label"
            :val="item.value"
            :class="[getLabelColor('type_review_vomit', ReviewVomitList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">呼吸状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtFormRadiobtn
            v-for="(item, idx) in ReviewRespirationList"
            :label="item.label"
            :key="`${idx}-${item.value}`"
            class="q-mr-md"
            v-model:selected="data.type_review_respiration"
            :val="item.value"
            :class="[getLabelColor('type_review_respiration', ReviewRespirationList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">活動状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtFormRadiobtn
            v-for="(item, idx) in ReviewWellnessList"
            :label="item.label"
            :key="`${idx}-${item.value}`"
            class="q-mr-md"
            v-model:selected="data.type_review_wellness"
            :val="item.value"
            :class="[getLabelColor('type_review_wellness', ReviewWellnessList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-12">
          <span class="body1 bold text-grey-900">体温状態*</span>
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-12">
          <MtFormRadiobtn
            v-for="(item, idx) in ReviewBodyTempratureList"
            :label="item.label"
            :key="`${idx}-${item.value}`"
            class="q-mr-md"
            v-model:selected="data.type_review_body_temperature"
            :val="item.value"
            :class="[getLabelColor('type_review_body_temperature', ReviewBodyTempratureList, idx)]"
          />
        </div>
      </div>
      <q-separator class="bg-grey-200 q-my-md" />
      <!--<div class="q-my-lg q-pt-sm">
        <q-btn
          @click="expanded = !expanded"
          unelevated
          class="bg-grey-800 text-white"
          padding="6px 14px"
        >
          <q-icon size="18px" name="photo_camera" class="q-mr-sm" />
          <span class="title3">画像記録を残す</span>
        </q-btn>
      </div>
      <q-slide-transition>
        <div v-show="expanded" class="photo-sharing">
          <div class="q-py-lg q-px-xl q-mb-lg bg-grey-100">
            <div>
              <p class="body2 text-negative">
                ※
                オーナーへ共有するにチェックを入れて保存すると、写真・撮影日時・コメントは、飼い主さまへ共有されます。
              </p>
            </div>
            <div class="row q-col-gutter-xl">
              <div class="col-auto text-center">
                <div class="relative-position" style="width: 150px">
                  <div class="bg-grey-300 q-pa-lg" style="max-width: 150px">
                    <q-icon
                      size="25px"
                      color="grey-500"
                      name="photo_camera"
                      class="q-mr-sm"
                    />
                  </div>
                  <q-btn
                    padding="none"
                    unelevated
                    class="absolute-top-right"
                    style="margin-top: -8px; margin-right: -8px"
                  >
                    <q-icon name="cancel" />
                  </q-btn>
                  <p
                    class="text-center q-mt-md q-mb-none caption1 bold text-grey-500"
                  >
                    写真を撮り直す
                  </p>
                </div>
              </div>
              <div class="col-10">
                <div class="row q-col-gutter-md">
                  <div class="col-4">
                    <MtFormInputDateTime
                      v-model:date="data.datetime_recorded"
                      label="撮影日時*"
                    />
                  </div>
                  <div class="col-12">
                    <MtInputForm
                      type="text"
                      v-model="data.memo"
                      label="コメント*"
                      required
                      autogrow
                    />
                  </div>
                  <div class="col-4">
                    <MtFormCheckBox
                      label="画像をオーナーと共有する"
                      class="q-mr-md"
                      v-model:checked="data.type_status_sharing"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </q-slide-transition>-->
      <div class="row q-col-gutter-md q-mb-sm">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <div class="row q-col-gutter-md ">
            <div class="col-6">
              <MtFormInputDate
                v-model:date="today_record"
                type="date"
                label="記録日 *"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-6">
              <MtFormPullDown
                type="selection"
                v-model:selected="record_HH_MM"
                :options="timeHourMinute"
                label="時 *"
                required
                :rules="[aahValidations.validationRequired]"
              />
            </div>
            <div class="col-6">
              <InputEmployeeOptGroup
                label="記録者名"
                v-model:selected="data.id_employee_reviewed"
                :rules="[aahValidations.validationRequired]"
                required
                show-select-default-employee
                @update:select-default-employee="selectDefaultEmployee"
              />
            </div>
          </div>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="data.memo_record"
            label="記録時メモ"
            autogrow
          />
        </div>
      </div>
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
</template>

<style lang="scss" scoped>
.photo-sharing {
  margin-left: -48px;
  margin-right: -48px;
}
</style>
