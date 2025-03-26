<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useBusinessHourSlot from '@/stores/business-hour-slots'
import useSpecialBusinessDayStore from '@/stores/special-business-days'
import OptionModal from '@/components/OptionModal.vue'
import { storeToRefs } from 'pinia'
import mtUtils from '@/utils/mtUtils'
import { getDateByFormat } from '@/utils/aahUtils'

const props = defineProps({
  data: Object
})
const businessHourSlot = useBusinessHourSlot()
const specialBusinessDayStore = useSpecialBusinessDayStore()
const { getAllBusinessHourSlots } = storeToRefs(businessHourSlot)
const { getSpecialBusinessDays } = storeToRefs(specialBusinessDayStore)

const isEdit = ref(false)

const businessForm = reactive({
  id_special_business_day: '',
  datetime_business_day: null,
  memo_business_day: '',
  id_business_hour_slot: '',
  id_clinic: null
})

const emits = defineEmits(['close'])

const submit = () => {
  businessForm.datetime_business_day = getDateByFormat(
    businessForm.datetime_business_day,
    'YYYY/MM/DD HH:mm:ss'
  )
  if (isEdit.value) {
    specialBusinessDayStore
      .updateSpecialBusinessDay(
        businessForm.id_special_business_day,
        businessForm
      )
      .then(async () => {
        await specialBusinessDayStore.fetchSpecialBusinessDays()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    if (isExistBusinessDay() === false) {
      delete businessForm.id_special_business_day
      specialBusinessDayStore
        .submitSpecialBusinessDay(businessForm)
        .then(async () => {
          await specialBusinessDayStore.fetchSpecialBusinessDays()
          emits('close')
          mtUtils.autoCloseAlert(aahMessages.success)
        })
    } else {
      mtUtils.autoCloseAlert('指定日の診療時間枠は既に存在しています。')
    }
  }
}
const isExistBusinessDay = () => {
  if (
    getSpecialBusinessDays.value.find(
      (item: any) =>
        item.datetime_business_day === businessForm.datetime_business_day &&
        item.id_business_hour_slot === businessForm.id_business_hour_slot
    )
  ) {
    return true
  }
  return false
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
            specialBusinessDayStore
              .destroySpecialBusinessDay(businessForm.id_special_business_day)
              .then(async () => {
                await mtUtils.autoCloseAlert(aahMessages.success)
                await specialBusinessDayStore.fetchSpecialBusinessDays()
                emits('close')
              })
          }
        })
    }
  }
}
function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      businessForm[key] = data[key]
    }
  }
}
const closeModal = () => {
  emits('close')
}
onMounted(() => {
  if (props.data?.id_special_business_day) {
    // Update case
    isEdit.value = true
    assignPageData(props.data)
  } else {
    // Create case
    isEdit.value = false
    businessForm.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>
<template>
  <q-form @submit="submit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="true">
      <q-toolbar-title class="text-grey-900 title2 bold">
        診療日 特別スケジュール
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon name="more_horiz" size="xs" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-lg">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtFormInputDate
            v-model:date="businessForm.datetime_business_day"
            type="date"
            label="対象日 *"
            required
            :rules="[aahValidations.validationRequired]"
            autofocus
            tabindex="1"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtFormPullDown
            v-model:selected="businessForm.id_business_hour_slot"
            v-model:options="getAllBusinessHourSlots"
            required
            :rules="[aahValidations.validationSelection]"
            label="診療時間枠*"
            tabindex="2"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="businessForm.memo_business_day"
            label="オーナー表示用：診療時間案内"
            autogrow
            tabindex="3"
          />
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
          tabindex="5"
          class="q-ml-md"
          type="submit"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
