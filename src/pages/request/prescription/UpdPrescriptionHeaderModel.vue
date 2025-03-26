<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import usePrescriptionStore from '@/stores/prescription'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import CreatePrescriptionModal from '@/pages/request/prescription/UpdPrescriptionDetailByPetModal.vue'
import usePetBioStore from '@/stores/pet-bios'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import {
  calculateDate,
  calculateDays,
  checkDateRange,
  copyText,
  getDateTimeNow,
  getFullPetNameWithoutHonorific
} from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import GeneralCancellationModel from '@/components/GeneralCancellationModel.vue'
import { typeBooking } from '@/utils/enum'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'
import { useRouter } from 'vue-router'

const petBioStore = usePetBioStore()
const router = useRouter()

const emits = defineEmits(['close'])

const customerStore = useCustomerStore()
const illnessHistoryStore = useIllnessHistoryStore()
const prescriptionStore = usePrescriptionStore()

const props = defineProps({
  requestObj: <any>Object,
  prescriptionObj: <any>Object,
  serviceDetail: <any>Object
})

const petIllnessHistoryList = ref([])
const petIllnessHistoryListDefault = reactive<any>([])

const disabledHeaderUpdate = ref(false)

const petList = ref([])
const isEdit = ref(false)
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const prescriptionForm = ref({
  id_prescription: null,
  flg_non_charge: false,
  flg_all_prepared: false,
  flg_prescription_order: false,
  flg_delivered: false,
  flg_next_cart: false,
  flg_apply_insurance: false,
  id_pet_illness_history: [],
  id_request: null,
  id_pet_bio_info: null,
  val_weight: null,
  id_pet: null,
  title_prescription: '',
  type_booking: 1,

  number_prescription: '',
  id_customer: null,
  total_days_dose: 7,
  date_start: null,
  date_end: null,
  datetime_delivered: null,
  datetime_cancel: null,
  datetime_pickup_plan: null,
  memo_cancel: null,
  flg_cancel: false,
  id_clinic: '',
  id_employee_doctor: defaultEmployee,
  id_employee_delivered: '',
  memo_prescription: '',
  number_request: ''
})

const petName = ref(null)
const flg_control_title_prescription: any = ref(true)

const valWeightUI = computed(() => {
  return `${prescriptionForm.value.val_weight / 1000} Kg`
})
const flgBioInfoUI = ref(true)
const showValWeightUI = ref(false)
const popupsList = ref()

const openMenu = async () => {
  let menuOptions = [
    {
      title: 'キャンセル',
      name: 'cancel',
      isChanged: false,
      attr: {
        class: prescriptionForm.value.flg_delivered
          ? 'disabled'
          : prescriptionForm.value.flg_cancel
          ? 'disabled'
          : '',
        clickable: !(
          prescriptionForm.value.flg_delivered ||
          prescriptionForm.value.flg_cancel
        )
      }
    },
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: prescriptionForm.value.flg_delivered ? 'disabled' : '',
        clickable: !prescriptionForm.value.flg_delivered
      }
    }
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })

  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      if (props.prescriptionObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils
        .confirm(aahMessages.delete_ask, aahMessages.delete)
        .then((confirmation) => {
          if (confirmation) {
            prescriptionStore
              .destroyPrescription(
                prescriptionForm.value.id_request,
                prescriptionForm.value.id_prescription
              )
              .then(async () => {
                event_bus.emit('reloadRight', true)
                emits('close')
                await router.replace({ name: 'RequestDetail' })
                mtUtils.closePopup(popupsList.value)
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
    if (selectedOption.name == 'cancel') {
      if (props.prescriptionObj?.flg_task_created == '1') {
        await mtUtils.autoCloseAlert('タスクを作成しました。')
        return
      }
      await mtUtils.smallPopup(GeneralCancellationModel, {
        url: `prescription/${prescriptionForm.value.id_prescription}`
      })
      closeModal()
    }
  }
}

const closeModal = () => {
  emits('close')
}

function selectedPetBioInfo(value: any) {
  if (value) {
    prescriptionForm.value.val_weight = petBioStore.getPetBioOptionDefault.find(
      (petBioObj: any) => petBioObj.id_pet_bio_info === value
    ).val_weight
  }
}

const handleAutoPrescriptionTitle = (value: any = null) => {
  const date_start = prescriptionForm.value.date_start
  const date_end = prescriptionForm.value?.date_end ?? ''
  if (date_end == '') {
    prescriptionForm.value.title_prescription = `${getFullPetNameWithoutHonorific(
      customerStore.getCustomer?.pets?.find(
        (petObj: any) =>
          petObj.id_pet ===
          (props.requestObj?.id_pet ?? props.prescriptionObj?.id_pet)
      ),
      customerStore.getCustomer
    )} 様 の処方箋（ ${date_start} ）`
    return
  }
  prescriptionForm.value.title_prescription = `${getFullPetNameWithoutHonorific(
    customerStore.getCustomer?.pets?.find(
      (petObj: any) =>
        petObj.id_pet ===
        (props.requestObj?.id_pet ?? props.prescriptionObj?.id_pet)
    ),
    customerStore.getCustomer
  )} 様 の処方箋（ ${date_start} ～  ${date_end} ）`
}

const isWeightUpdated = ref(false)
function updateValWeight() {
  isWeightUpdated.value = true
  if (
    petBioStore.getPetBioOptionDefault.length > 0 &&
    prescriptionForm.value.id_pet_bio_info !=
      petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
  ) {
    prescriptionForm.value.val_weight =
      petBioStore.getPetBioOptionDefault[0].val_weight
    prescriptionForm.value.id_pet_bio_info =
      petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
    return
  }

  prescriptionForm.value.val_weight = petBioStore.getPetBioOptionDefault.find(
    (petBioObj: any) =>
      petBioObj.id_pet_bio_info == prescriptionForm.value.id_pet_bio_info
  ).val_weight
}

async function saveHeader() {
  if (props.requestObj && props.requestObj.flg_complete) {
    if (!prescriptionForm.value.flg_non_charge) {
      await mtUtils.autoCloseAlert(
        '会計が完了している為、\n会計項目をリクエストに追加することは出来ません。'
      )
      return
    }
  }

  if (
    !checkDateRange([
      {
        start_date: prescriptionForm.value.date_start,
        end_date: prescriptionForm.value.date_end
      }
    ])
  )
    return false

  flg_control_title_prescription.value
    ? handleAutoPrescriptionTitle()
    : prescriptionForm.value.title_prescription
  let response: any = null

  if (!prescriptionForm.value.val_weight) {
    await mtUtils.autoCloseAlert('対象ペットの体重を登録してください。')
  }

  if (!isEdit.value) {
    response = await prescriptionStore.submitPrescriptionObj(
      prescriptionForm.value.id_request,
      { ...prescriptionForm.value }
    )
  } else {
    let confirmation = null

    if (isWeightUpdated.value)
      confirmation = await mtUtils.confirm('処方箋ヘッダーの変更内容を各明細へ反映しますか？', '注意', '変更を反映', null,
        null, { label: '反映せず保存', show: true, action: 'OK' })


    if ((confirmation && confirmation == 'OK') || !isWeightUpdated.value) {
      await mtUtils.callApi(
        selectOptions.reqMethod.PUT,
        `prescription/${prescriptionForm.value.id_prescription}`,
        {
          ...prescriptionForm.value
        }
      )
      await prescriptionStore.fetchPrescriptionByRequest(
      prescriptionForm.value.id_request
    )
      event_bus.emit('prescription-updated')
      await mtUtils.autoCloseAlert('更新しました')
      closeModal()
      return
    }

    if (confirmation && confirmation != 'OK' && isWeightUpdated.value) {
      response = await prescriptionStore.updPrescriptionObj(
        prescriptionForm.value.id_request,
        prescriptionForm.value.id_prescription,
        { ...prescriptionForm.value }
      )
    }
    closeModal()
    return
  }

  if (response && response.data && response.data.code == 400) {
    await mtUtils.autoCloseAlert(response.data.data.message)
    return
  }

  if (response && isEdit.value) {
    await prescriptionStore.fetchPrescriptionByRequest(
      prescriptionForm.value.id_request
    )
    await mtUtils.autoCloseAlert('処方箋を更新しました。')
    closeModal()
    return
  }


  if (response) {
    await prescriptionStore.fetchPrescriptionByRequest(
      prescriptionForm.value.id_request
    )
    await mtUtils.autoCloseAlert('処方箋を作成しました。')
    await mtUtils.popup(CreatePrescriptionModal, {
      requestObj: props.requestObj,
      id_pet: response.id_pet,
      serviceDetail: props.serviceDetail
    }, true)
    closeModal()
  }
}

const selectDefaultEmployee = (key: string) => {
  prescriptionForm.value[key] = defaultEmployee
}

const updateDeliverPrescription = (value: boolean) => {
  if (value){
    prescriptionForm.value.datetime_delivered = getDateTimeNow();
    return;
  }
  prescriptionForm.value.datetime_delivered = null;
}

const onUpdateStartDate = (value: string) => {
  prescriptionForm.value.date_end = value
}

const checkPopups = () => {
  popupsList.value = Array.from(document.getElementsByClassName('ns-popup'))
}

onMounted(async () => {
  if (props.prescriptionObj && props.prescriptionObj.id_prescription) {
    isEdit.value = true
    prescriptionForm.value = {
      ...props.prescriptionObj
    }
    if (!prescriptionForm.value.flg_cancel) {
      prescriptionForm.value.flg_cancel = false
    }

    flgBioInfoUI.value = false
    if (
      prescriptionForm.value.flg_delivered ||
      prescriptionForm.value.flg_cancel
    ) {
      disabledHeaderUpdate.value = true
    }
    petName.value = getFullPetNameWithoutHonorific(
      customerStore.getCustomer?.pets?.find(
        (petObj: any) =>
          petObj.id_pet ===
          (props.requestObj?.id_pet ?? props.prescriptionObj?.id_pet)
      ),
      customerStore.getCustomer
    )
  } else {
    prescriptionForm.value = {
      ...prescriptionForm.value,
      id_pet: props.requestObj.id_pet,
      id_request: props.requestObj.id_request,
      id_employee_doctor: props.requestObj.id_employee_doctor,
      id_customer: props.requestObj.id_customer,
      date_start: props.requestObj.date_request_start,
      flg_apply_insurance: props.requestObj.flg_apply_insurance,
      total_days_dose: 7
    }
    petName.value = getFullPetNameWithoutHonorific(
      customerStore.getCustomer?.pets?.find(
        (petObj: any) => petObj.id_pet === prescriptionForm.value.id_pet
      ),
      customerStore.getCustomer
    )
    prescriptionForm.value.date_end = calculateDate(
      prescriptionForm.value.date_start,
      prescriptionForm.value.total_days_dose
    )
  }

  await Promise.all([
    petBioStore.fetchPetBio({
      id_pet: prescriptionForm.value?.id_pet,
      id_customer: prescriptionForm.value?.id_customer,
      fetch_weight: true
    }),
    illnessHistoryStore.fetchPreparationIllnessHistorys({
      id_pet: prescriptionForm.value.id_pet
    })
  ])

  petIllnessHistoryList.value = [
    ...illnessHistoryStore.getAllIllnessHistorys,
    ...illnessHistoryStore.getAllDiseaseFreeData
  ]
  illnessHistoryStore.getAllIllnessHistorys.forEach((illnessHistory: any) => {
    petIllnessHistoryListDefault.push(illnessHistory)
  })

  if (
    !prescriptionForm.value.id_prescription &&
    !prescriptionForm.value.id_pet_bio_info
  ) {
    if (petBioStore.getPetBioOptionDefault.length > 0) {
      prescriptionForm.value.val_weight =
        petBioStore.getPetBioOptionDefault[0].val_weight
      prescriptionForm.value.id_pet_bio_info =
        petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
    }
  }

  if (
    prescriptionForm.value.id_prescription &&
    !prescriptionForm.value.id_pet_bio_info
  ) {
    prescriptionForm.value.id_pet_bio_info =
      petBioStore.getPetBioOptionDefault[0].id_pet_bio_info
  }

  if (prescriptionForm.value.id_pet_illness_history.length === 0) {
    const illnessHistory =
      illnessHistoryStore?.getIllnessHistory?.id_pet_illness_history
    if (illnessHistory)
      prescriptionForm.value.id_pet_illness_history.push(illnessHistory)
  }

  if (!prescriptionForm.value.id_prescription) {
    petIllnessHistoryListDefault.length = 0
  }

  const tempBioInfo = petBioStore.getPetBioOptionDefault.find(
    (petBioObj: any) =>
      petBioObj.value == prescriptionForm.value?.id_pet_bio_info
  )

  if (tempBioInfo) {
    showValWeightUI.value =
      prescriptionForm.value.val_weight != tempBioInfo.val_weight ||
      (petBioStore.getPetBio?.id_pet_bio_info !=
        prescriptionForm.value.id_pet_bio_info &&
        petBioStore.getPetBio.val_weight &&
        petBioStore.getPetBio.val_weight != prescriptionForm.value.val_weight)
  }

  if (!prescriptionForm.value.val_weight) {
    await mtUtils.autoCloseAlert('対象ペットの体重を登録してください。')
  }

  prescriptionForm.value.id_clinic = JSON.parse(
    localStorage.getItem('id_clinic')
  )
  petList.value = customerStore.getCustomer.pets

  checkPopups()
})
</script>

<template>
  <q-form class="column full-height" @submit="saveHeader">
    <MtModalHeader class="col-auto" @closeModal="closeModal">
      <q-toolbar-title
        class="text-grey-900 title2 bold prescription-title"
        :class="{ 'cursor-pointer': prescriptionForm.number_prescription }"
        @click="
          prescriptionForm.number_prescription
            ? copyText(prescriptionForm.number_prescription)
            : null
        "
      >
        <q-icon
          name="check_circle"
          class="text-blue q-mr-xs"
          v-if="prescriptionForm.flg_delivered"
        />
        処方箋 {{ prescriptionForm.number_prescription }}
        <q-icon name="content_copy" class="text-blue q-ml-xs" />
      </q-toolbar-title>
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-scroll-area visible class="full-width col column">
      <q-card-section class="full-width col q-px-lg">
        <div class="q-my-md">
          <h4 class="text-white bg-grey-600 title4">処方箋 共通情報</h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{
              isEdit
                ? '編集内容は関連する明細内容を更新するので注意してください。'
                : '明細作成時の共通情報を入力してください。'
            }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-3" v-if="prescriptionForm.id_prescription">
            <MtInputForm
              type="text"
              v-model="prescriptionForm.number_prescription"
              label="処方箋番号"
              readonly
            />
          </div>
          <div class="q-mr-sm col-3">
            <MtInputForm
              type="text"
              v-model="petName"
              label="対象ペット名"
              readonly
            />
          </div>
          <div class="q-mr-sm col-1" v-if="isEdit">
            <MtInputForm
              type="text"
              v-model="valWeightUI"
              label="体重"
              readonly
            />
          </div>
          <template v-if="showValWeightUI || !prescriptionForm.val_weight">
            <div
              v-if="
                isEdit &&
                !(prescriptionForm.flg_cancel || prescriptionForm.flg_delivered)
              "
            >
              <q-btn
                @click="updateValWeight()"
                class="bg-grey-800 text-white q-mx-sm"
                unelevated
                :disable="disabledHeaderUpdate"
              >
                体重の更新
              </q-btn>
            </div>
            <div
              class="col-3"
              v-if="
                isEdit &&
                !(prescriptionForm.flg_cancel || prescriptionForm.flg_delivered)
              "
            >
              <MtFormPullDown
                label="生体情報"
                :options="petBioStore.getPetBioOptionDefault"
                v-model:selected="prescriptionForm.id_pet_bio_info"
                @update:selected="selectedPetBioInfo"
                :disable="disabledHeaderUpdate"
              />
            </div>
          </template>
          <div class="col-3" v-if="!isEdit">
            <MtFormPullDown
              label="生体情報"
              :options="petBioStore.getPetBioOptionDefault"
              v-model:selected="prescriptionForm.id_pet_bio_info"
              @update:selected="selectedPetBioInfo"
              :disable="disabledHeaderUpdate"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-sm">
          <div v-if="!flg_control_title_prescription" class="col-9">
            <MtInputForm
              type="text"
              v-model="prescriptionForm.title_prescription"
              :label="
                flg_control_title_prescription
                  ? '保存時に自動でタイトルを生成します'
                  : '処方箋名 *'
              "
              required
              :rules="[aahValidations.validationRequired]"
              :disable="disabledHeaderUpdate || flg_control_title_prescription"
              :filled="flg_control_title_prescription"
            />
          </div>
          <div class="col-3">
            <MtFormCheckBox
              label="自動タイトル"
              v-model:checked="flg_control_title_prescription"
              @update:model-value="
                (value) => {
                  value ? handleAutoPrescriptionTitle() : ''
                }
              "
              :disable="disabledHeaderUpdate"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-sm">
          <div class="col-3">
            <MtFormInputNumber
              v-model:value="prescriptionForm.total_days_dose"
              mode="dosage"
              label="デフォルト服用日数"
              @update:value="
                () => {
                  prescriptionForm.date_end = calculateDate(
                    prescriptionForm.date_start,
                    prescriptionForm.total_days_dose
                  )
                }
              "
              class="field-right-text total-days-dose-icon"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-model:date="prescriptionForm.date_start"
              label="デフォルト 服用 開始日"
              @update:date="
                (value) => {
                  prescriptionForm.total_days_dose = calculateDays(
                    prescriptionForm.date_start,
                    prescriptionForm.date_end
                  )
                  onUpdateStartDate(value)
                }
              "
              required
              :rules="[aahValidations.validationRequired]"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <div class="col-3">
            <MtFormInputDate
              v-model:date="prescriptionForm.date_end"
              label="デフォルト 服用 終了日"
              @update:date="
                () => {
                  prescriptionForm.total_days_dose = calculateDays(
                    prescriptionForm.date_start,
                    prescriptionForm.date_end
                  )
                }
              "
              :disable="disabledHeaderUpdate"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-sm">
          <div class="col-3">
            <q-select
              dense
              v-model="prescriptionForm.id_pet_illness_history"
              multiple
              :options="petIllnessHistoryList"
              label="処方対象 現疾患"
              emit-value
              map-options
              clearable
              use-chips
            />
          </div>
          <div class="col-3">
            <InputEmployeeOptGroup
              department-selected=""
              label="デフォルト担当医 *"
              v-model="prescriptionForm.id_employee_doctor"
              type-occupation="doctor"
              required
              :rules="[aahValidations.validationRequired]"
              :disable="disabledHeaderUpdate"
              show-select-default-employee
              @update:select-default-employee="
                selectDefaultEmployee('id_employee_doctor')
              "
            />
          </div>
          <div v-if="false" class="col">
            <MtFormInputDate
              datetime
              v-model:date="prescriptionForm.datetime_pickup_plan"
              label="受取日"
              required
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-12">
            <MtInputForm
              type="text"
              v-model="prescriptionForm.memo_prescription"
              label="処方箋メモ"
              autogrow
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-auto q-ml-lg">
            <MtFormCheckBox
              label="会計対象外"
              v-model:checked="prescriptionForm.flg_non_charge"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <div class="col-auto q-ml-lg">
            <MtFormCheckBox
              label="調剤依頼"
              v-model:checked="prescriptionForm.flg_prescription_order"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <div class="col-auto q-ml-lg">
            <MtFormCheckBox
              label="準備完了"
              v-model:checked="prescriptionForm.flg_all_prepared"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <div class="col-auto q-ml-lg">
            <MtFormCheckBox
              label="次回の会計"
              v-model:checked="prescriptionForm.flg_next_cart"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <div class="col-auto q-ml-lg">
            <MtFormCheckBox
              label="保険適用"
              v-model:checked="prescriptionForm.flg_apply_insurance"
              :disable="disabledHeaderUpdate"
            />
          </div>
          <!-- Display this if PH is a booking prescription -->
          <div
            v-if="!isEdit && props?.requestObj?.flg_booking"
            class="col-3 q-ml-md"
          >
            <MtFormPullDown
              v-model:selected="prescriptionForm.type_booking"
              :options="typeBooking"
              label="予約区分 *"
            />
          </div>
          <div
            v-if="isEdit && prescriptionForm?.request?.flg_booking"
            class="col-3 q-ml-md"
          >
            <MtFormPullDown
              v-model:selected="prescriptionForm.type_booking"
              :options="typeBooking"
              label="予約区分 *"
            />
          </div>
        </div>
        <hr class="light" />
        <!-- From here, information about how and when a customer receives this prescription -->
        <div class="q-mb-md q-mt-lg">
          <h4 class="text-white bg-grey-600 title4">受け渡しについて</h4>
          <span class="caption1 regular text-grey-700 q-mt-sm q-ml-sm">
            {{ isEdit ? '' : '薬局・受け渡しに関する情報を追記します。' }}
          </span>
        </div>
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-3">
            <InputEmployeeOptGroup
              department-selected=""
              v-model="prescriptionForm.id_employee_delivered"
              label="受け渡し担当者名"
              :disable="disabledHeaderUpdate"
              show-select-default-employee
              @update:select-default-employee="
                selectDefaultEmployee('id_employee_delivered')
              "
            />
          </div>
        </div>
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-3">
            <MtFormCheckBox
              v-model:checked="prescriptionForm.flg_delivered"
              :disable="
                isEdit
                  ? false
                  : prescriptionForm.flg_cancel || disabledHeaderUpdate
              "
              label="受け渡し済み"
              @update:checked="
                (value) => {
                  if (value) {
                    prescriptionForm.datetime_delivered = getDateTimeNow()
                    return
                  }
                  prescriptionForm.datetime_delivered = null
                }
              "
            />
          </div>
          <div class="col-3" v-if="prescriptionForm.flg_delivered">
            <MtFormInputDate
              datetime
              label="受け渡し 完了日時"
              v-model:date="prescriptionForm.datetime_delivered"
              :disable="disabledHeaderUpdate"
              :readonly="disabledHeaderUpdate"
              :rules="[aahValidations.validationRequired]"
            />
          </div>
        </div>
  
        <div class="row q-col-gutter-md q-my-md">
          <div class="col-3">
            <MtFormCheckBox
              label="キャンセル"
              v-model:checked="prescriptionForm.flg_cancel"
              disable
            />
          </div>
          <div class="col-3" v-if="prescriptionForm.flg_cancel">
            <MtFormInputDate
              datetime
              label="キャンセル日時"
              v-model:date="prescriptionForm.datetime_cancel"
              readonly
            />
          </div>
          <div class="col-12" v-if="prescriptionForm.flg_cancel">
            <MtInputForm
              type="text"
              v-model="prescriptionForm.memo_cancel"
              label="キャンセル理由"
              autogrow
              readonly
            />
          </div>
        </div>
      </q-card-section>
    </q-scroll-area>
    <q-card-section class="q-bt bg-white col-auto">
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

<style scoped lang="scss">
.total-days-dose-icon::after {
  content: '日';
  top: 65% !important;
}
</style>
