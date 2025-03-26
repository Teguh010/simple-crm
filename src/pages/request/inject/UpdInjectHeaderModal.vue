<script lang="ts" setup>

import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import usePetBioStore from '@/stores/pet-bios'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import {
  calculateDate,
  calculateDays,
  checkDateRange,
  copyText,
  getFullPetNameWithoutHonorific
} from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import GeneralCancellationModel from '@/components/GeneralCancellationModel.vue'
import { timeHourMinute } from '@/utils/enum'
import useInjectStore from '@/stores/inject'
import UpdInjectDetailByPet from '@/pages/request/inject/UpdInjectDetailByPet.vue'
import useCliCommonStore from '@/stores/cli-common'

const petBioStore = usePetBioStore()

const emits = defineEmits(['close'])

const customerStore = useCustomerStore()
const illnessHistoryStore = useIllnessHistoryStore()
const injectStore = useInjectStore()

const props = defineProps({
  requestObj: <any>Object,
  injectObj: <any>Object
})

const petIllnessHistoryList = ref([])
const petIllnessHistoryListDefault = reactive<any>([])

const disabledHeaderUpdate = ref(false)

const petList = ref([])
const isEdit = ref(false)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const injectForm = ref({
  id_inject: null,
  number_inject: '',
  type_inject_route: null,
  flg_non_charge: false,
  flg_delivered: false,
  flg_next_cart: false,
  id_pet_illness_history: [],
  id_request: null,
  id_pet_bio_info: null,
  val_weight: null,
  id_pet: null,
  title_inject: '',
  type_booking: 1,
  id_customer: null,
  date_start: null,
  date_end: null,
  time_start: null,
  memo_cancel: null,
  flg_cancel: false,
  id_clinic: '',
  id_employee_doctor: defaultEmployee,
  memo_inject: '',
  booking: {
    FlgUI: false
  },
  flg_apply_insurance: false
})

const petName = ref(null)
const flg_control_title_inject: any = ref(true)

const valWeightUI = computed(() => {
  return `${(injectForm.value.val_weight / 1000)} Kg`
})
const flgBioInfoUI = ref(true)
const showValWeightUI = ref(false)
const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: injectForm.value.flg_delivered ? 'disabled' : '',
        clickable: !injectForm.value.flg_delivered
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      if (props.injectObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            injectStore.destoryInject(injectForm.value.id_request,
              injectForm.value.id_inject).then(() => {
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
    if (selectedOption.name == 'cancel') {
      if (props.injectObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils.smallPopup(GeneralCancellationModel, { url: `prescription/${injectForm.value.id_inject}` })
      closeModal()
    }
  }
}

const closeModal = () => {
  emits('close')
}

function selectedPetBioInfo(value: any) {
  if (value) {
    injectForm.value.val_weight = petBioStore.getPetBioOptionDefault.find((petBioObj: any) => petBioObj.id_pet_bio_info === value).val_weight
  }
}

const handleAutoInjectTitle = (value: any = null) => {
  const date_start = injectForm.value.date_start
  const date_end = injectForm.value?.date_end ?? ''
  if (date_end == '') {
    injectForm.value.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
      petObj.id_pet === (props.requestObj?.id_pet ?? props.injectObj?.id_pet)), customerStore.getCustomer)} 様 の注射/点滴（ ${date_start} ）`
    return
  }
  injectForm.value.title_inject = `${getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
    petObj.id_pet === (props.requestObj?.id_pet ?? props.injectObj?.id_pet)), customerStore.getCustomer)} 様 の注射/点滴（ ${date_start} ～  ${date_end} ）`
}

function updateValWeight() {
  injectForm.value.val_weight = petBioStore.getPetBioOptionDefault.find((petBioObj: any) => petBioObj.id_pet_bio_info === injectForm.value.id_pet_bio_info).val_weight
}


async function saveHeader() {

  if (props.requestObj && props.requestObj.flg_complete) {
    await mtUtils.autoCloseAlert('会計が完了している為、\n会計項目をリクエストに追加することは出来ません。')
    return
  }
  
  if (!checkDateRange([{
    start_date: injectForm.value.date_start,
    end_date: injectForm.value.date_end
  }])) return false
  flg_control_title_inject.value ? handleAutoInjectTitle() : injectForm.value.title_inject
  let response: any = null

  if (!injectForm.value.val_weight) {
    await mtUtils.autoCloseAlert('対象ペットの体重を登録してください。')
  }

  if (!isEdit.value) {
    response = await injectStore.submitInjectObj(
      injectForm.value.id_request,
      { ...injectForm.value }
    )
  } else {
    delete injectForm.value.customer
    delete injectForm.value.request
    delete injectForm.value.pet

    if (injectForm.value.booking && injectForm.value.booking.id_booking) {
      injectForm.value.booking.datetime_booking_confirmed = injectForm.value.booking.date_booking_confirmed

      if (injectForm.value.booking.FlgUI && injectForm.value.booking.time_booking_confirmed) {
        injectForm.value.booking.datetime_booking_confirmed = `${injectForm.value.booking.date_booking_confirmed} ${injectForm.value.booking.time_booking_confirmed}:00`
      } else {
        injectForm.value.booking.datetime_booking_confirmed = `${injectForm.value.booking.date_booking_confirmed} 00:00:00`
      }

    }
    
    response = await injectStore.updInjectObj(injectForm.value.id_request,
      injectForm.value.id_inject, { ...injectForm.value })
  }

  if (response && isEdit.value) {
    await injectStore.fetchInjectByRequest(injectForm.value.id_request)
    await mtUtils.autoCloseAlert('注射/点滴を更新しました。')
    closeModal()
    return
  }

  if (response) {
    await injectStore.fetchInjectByRequest(injectForm.value.id_request)
    await mtUtils.autoCloseAlert('注射/点滴を作成しました。')
    await mtUtils.popup(UpdInjectDetailByPet, {
      requestObj: props.requestObj,
      id_pet: response.id_pet,
      serviceDetail: props.serviceDetail
    }, true)
    closeModal()
  }

}

const selectDefaultEmployee = (key: string) => {
  injectForm.value[key] = defaultEmployee
}

onMounted(async () => {
  useCliCommonStore().fetchPreparationCliCommonList({ code_cli_common: [5] })
    
  if (props.injectObj && props.injectObj.id_inject) {
    isEdit.value = true
    injectForm.value = {
      ...props.injectObj
    }
    if (!injectForm.value.flg_cancel) {
      injectForm.value.flg_cancel = false
    }

    flgBioInfoUI.value = false

    petName.value = getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
      petObj.id_pet === (props.requestObj?.id_pet ?? props.injectObj?.id_pet)), customerStore.getCustomer)

    if (injectForm.value.time_start && injectForm.value.time_start != '') {
      injectForm.value.time_start = injectForm.value.time_start.split(':')[0] + ':' + injectForm.value.time_start.split(':')[1]
    }
    if (injectForm.value.booking && injectForm.value.booking.id_booking) {
      injectForm.value.booking.flg_booking = true
      if (injectForm.value.booking.datetime_booking_confirmed && injectForm.value.booking.datetime_booking_confirmed.split(' ').length > 1) {
        injectForm.value.booking.FlgUI = true
        injectForm.value.booking.date_booking_confirmed = injectForm.value.booking.datetime_booking_confirmed.split(' ')[0]
        injectForm.value.booking.time_booking_confirmed = injectForm.value.booking.datetime_booking_confirmed.split(' ')[1].slice(0, -3)

        if (injectForm.value.booking.time_booking_confirmed == '00:00') {
          injectForm.value.booking.FlgUI = false
        }
      }
    }
    
  } else {
    injectForm.value = {
      ...injectForm.value,
      id_pet: props.requestObj.id_pet,
      id_request: props.requestObj.id_request,
      id_employee_doctor: props.requestObj.id_employee_doctor,
      id_customer: props.requestObj.id_customer,
      date_start: props.requestObj.date_request_start
    }
    petName.value = getFullPetNameWithoutHonorific(customerStore.getCustomer?.pets?.find((petObj: any) =>
      petObj.id_pet === (injectForm.value.id_pet)), customerStore.getCustomer)
    injectForm.value.date_end = calculateDate(injectForm.value.date_start, 1)
  }

  await Promise.all([petBioStore.fetchPetBio({
    id_pet: injectForm.value?.id_pet,
    id_customer: injectForm.value?.id_customer,
    fetch_weight: true
  }), illnessHistoryStore.fetchPreparationIllnessHistorys({ 'id_pet': injectForm.value.id_pet })])

  petIllnessHistoryList.value = [...illnessHistoryStore.getAllIllnessHistorys, ...illnessHistoryStore.getAllDiseaseFreeData]
  illnessHistoryStore.getAllIllnessHistorys.forEach((illnessHistory: any) => {
    petIllnessHistoryListDefault.push(illnessHistory)
  })


  if (!injectForm.value.id_inject && !injectForm.value.id_pet_bio_info) {
    if (petBioStore.getPetBioOptionDefault.length > 0) {
      injectForm.value.val_weight = petBioStore.getPetBioOptionDefault[0].val_weight
      injectForm.value.id_pet_bio_info = petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
    }
  }

  if (injectForm.value.id_inject && !injectForm.value.id_pet_bio_info) {
    injectForm.value.id_pet_bio_info = petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
  }

  if (injectForm.value.id_pet_illness_history.length === 0) {
    const illnessHistory = illnessHistoryStore?.getIllnessHistory?.id_pet_illness_history
    if (illnessHistory) injectForm.value.id_pet_illness_history.push(illnessHistory)
  }

  if (!injectForm.value.id_inject) {
    petIllnessHistoryListDefault.length = 0
  }

  const tempBioInfo = petBioStore.getPetBioOptionDefault.find((petBioObj: any) => petBioObj.value == injectForm.value?.id_pet_bio_info)

  if (tempBioInfo) {
    showValWeightUI.value = (injectForm.value.val_weight != tempBioInfo.val_weight) || ((petBioStore.getPetBio?.id_pet_bio_info != injectForm.value.id_pet_bio_info) &&
      (petBioStore.getPetBio.val_weight && petBioStore.getPetBio.val_weight != injectForm.value.val_weight))
  }

  if (!injectForm.value.val_weight) {
    await mtUtils.autoCloseAlert('対象ペットの体重を登録してください。')
  }

  injectForm.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  petList.value = customerStore.getCustomer.pets


})
</script>

<template>
  <q-form @submit="saveHeader">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title
        :class="{ 'cursor-pointer': injectForm.number_inject }"
        class="text-grey-900 title2 bold prescription-title"
        @click="injectForm.number_inject ? copyText(injectForm.number_inject) : null">注射・点滴
        {{ injectForm.number_inject }}
        <q-icon class="text-blue q-ml-xs" name="content_copy" />
      </q-toolbar-title>
      <q-btn class="q-mx-sm" flat round @click="openMenu">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="q-my-md">
        <h4 class="text-white bg-grey-600 title4">注射・点滴 共通情報</h4>
        <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
          {{ isEdit ? '編集内容は関連する明細内容を更新するので注意してください。' : '明細作成時の共通情報を入力してください。'
          }}
        </span>
      </div>
      <div class="row q-col-gutter-md q-mb-sm">
        <div v-if="injectForm.id_inject" class="col-3">
          <MtInputForm
            v-model="injectForm.number_inject"
            label="注射番号"
            readonly
            type="text"
          />
        </div>
        <div class="q-mr-sm col-3">
          <MtInputForm
            v-model="petName"
            label="対象ペット名"
            readonly
            type="text"
          />
        </div>
        <div v-if="isEdit" class="q-mr-sm col-1">
          <MtInputForm
            v-model="valWeightUI"
            label="体重"
            readonly
            type="text"
          />
        </div>
        <template v-if="showValWeightUI || !injectForm.val_weight">
          <div v-if="isEdit && !(injectForm.flg_cancel || injectForm.flg_delivered )">
            <q-btn
              :disable="disabledHeaderUpdate"
              class="bg-grey-800 text-white q-mx-sm"
              unelevated
              @click="updateValWeight()"
            >
              体重の更新
            </q-btn>
          </div>
          <div v-if="isEdit && !(injectForm.flg_cancel || injectForm.flg_delivered )" class="col-3">
            <MtFormPullDown
              v-model:selected="injectForm.id_pet_bio_info" :disable="disabledHeaderUpdate"
              :options="petBioStore.getPetBioOptionDefault"
              label="生体情報"
              @update:selected="selectedPetBioInfo"
            />
          </div>
        </template>
        <div v-if="!isEdit" class="col-3">
          <MtFormPullDown
            v-model:selected="injectForm.id_pet_bio_info" :disable="disabledHeaderUpdate"
            :options="petBioStore.getPetBioOptionDefault"
            label="体重"
            @update:selected="selectedPetBioInfo"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-sm">
        <div v-if="!flg_control_title_inject" class="col-9">
          <MtInputForm
            v-model="injectForm.title_inject"
            :disable="disabledHeaderUpdate || flg_control_title_inject"
            :filled="flg_control_title_inject"
            :label="
              flg_control_title_inject
                ? '保存時に自動でタイトルを生成します'
                : '注射・点滴名 *'
            "
            :rules="[aahValidations.validationRequired]"
            required
            type="text"
          />
        </div>
        <div class="col-3">
          <MtFormCheckBox
            v-model:checked="flg_control_title_inject"
            :disable="disabledHeaderUpdate"
            label="自動タイトル"
            @update:model-value="(value)=>{ value ? handleAutoInjectTitle() : ''}"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-sm">
        <div class="col">
          <MtFormPullDown
            v-model:selected="injectForm.type_inject_route"
            :options="useCliCommonStore().getCliCommonTypeMedRouteList"
            label="投与経路"
          />
        </div>
        <div class="col">
          <MtFormInputDate
            v-model:date="injectForm.date_start"
            :disable="disabledHeaderUpdate"
            :rules="[aahValidations.validationRequired]"
            label="注射/点滴 開始日"
            required
            @update:date="
              () => {
                injectForm.date_end = injectForm.date_start
                injectForm.total_days_dose = calculateDays(
                  injectForm.date_start,
                  injectForm.date_end
                )
              }
            "
          />
        </div>
        <div class="col" v-if="injectForm.flgTimeUI">
          <MtFormPullDown
            v-model="injectForm.time_start"
            :options="timeHourMinute"
            label="時：分"
            type="selection"
          />
        </div>
        <div class="col">
          <MtFormInputDate
            v-model:date="injectForm.date_end"
            :disable="disabledHeaderUpdate"
            label="注射/点滴 終了日"
            @update:date="
              () => {
                if (injectForm.date_start > injectForm.date_end) {
                  injectForm.date_start = injectForm.date_end
                }
                injectForm.total_days_dose = calculateDays(
                  injectForm.date_start,
                  injectForm.date_end
                )
              }
            "
          />
        </div>
        <div class="col" v-if="injectForm.flgTimeUI">
          <MtFormPullDown
            v-model="injectForm.time_end"
            :options="timeHourMinute"
            label="時：分"
            type="selection"
          />
        </div>
        <div class="col">
          <MtFormCheckBox v-model:checked="injectForm.flgTimeUI" label="時間指定" />
        </div>
      </div>

      <div class="row q-col-gutter-md q-my-sm">
        <div class="col-3">
          <q-select
            v-model="injectForm.id_pet_illness_history"
            :options="petIllnessHistoryList"
            clearable
            dense
            emit-value
            label="既往歴"
            map-options
            multiple
            use-chips
          />
        </div>
        <div class="col-3">
          <InputEmployeeOptGroup
            v-model="injectForm.id_employee_doctor"
            :disable="disabledHeaderUpdate"
            :rules="[aahValidations.validationRequired]"
            department-selected=""
            label="担当医 *"
            required
            show-select-default-employee
            type-occupation="doctor"
            @update:select-default-employee="selectDefaultEmployee('id_employee_doctor')"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-12">
          <MtInputForm
            v-model="injectForm.memo_inject"
            autogrow
            label="注射・点滴メモ"
            type="text"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-md">
        <div class="col-3">
          <MtFormCheckBox
            v-model:checked="injectForm.flg_completed"
            label="完了"
          />
        </div>
        <div class="col-3">
          <MtFormCheckBox
            v-model:checked="injectForm.flg_next_cart"
            label="次回の会計"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div v-if="injectForm?.booking" class="col-3">
          <MtFormCheckBox v-model:checked="injectForm.booking.flg_booking" label="次回予定の作成"
                          @update:checked="calculateBookingDate(injectForm.booking)" />
        </div>
        <template v-if="injectForm.booking && injectForm.booking.flg_booking">
          <div class="col-3">
            <MtFormInputDate
              v-model:date="injectForm.booking.date_booking_confirmed"
              label="予定日"
            />
          </div>
          <div class="col-3 text-center">
            <MtInputForm
              v-model="injectForm.booking.FlgUI"
              :items="[{ label: '時刻' }]"
              type="checkbox"
            />
          </div>
          <div v-if="injectForm.booking.FlgUI" class="col-3">
            <MtFormPullDown
              v-model:selected="injectForm.booking.time_booking_confirmed"
              :options="timeHourMinute"
              label="時：分"
            />
          </div>
        </template>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" type="submit" unelevated>
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>

.total-days-dose-icon::after {
  content: '日';
  top: 65% !important;
}
</style>