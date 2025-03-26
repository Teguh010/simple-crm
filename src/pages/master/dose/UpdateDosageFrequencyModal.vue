<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import { storeToRefs } from 'pinia'
import useDoseStore from '@/stores/dose-frequencies'
import { typeDose } from '@/utils/enum'

const doseStore = useDoseStore()
const { getDose } = storeToRefs(doseStore)

const emits = defineEmits(['close'])

const isEdit = ref(false)

const props = defineProps({ data: Object })

const doseData = reactive({
  name_dose_formal: null,
  name_dose_short: null,
  type_dose: 1,
  quantity_dose: null,
  memo_dose: null,
  display_order: null,
  id_clinic: null
})

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
            doseStore.destroyDose(doseData.id_dosage_frequency).then(() => {
              doseStore.fetchDoses()
              doseStore.fetchPreparationDoses()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}
function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      doseData[key] = data[key]
    }
  }
}
const handleDisplayOrder = (value) => {
  if (value) {
    doseData.display_order = value
  } else {
    doseData.display_order = null
  }
}
const submit = () => {
  if (props.data) {
    doseStore
      .updateDose(doseData.id_dosage_frequency, doseData)
      .then(async () => {
        await doseStore.fetchDoses()
        doseStore.fetchPreparationDoses()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    doseStore.submitDose(doseData).then(async () => {
      await doseStore.fetchDoses()
      doseStore.fetchPreparationDoses()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

onMounted(() => {
  if (props.data?.id_dosage_frequency) {
    // Update case
    assignPageData(props.data)
    isEdit.value = true
  } else {
    // Create case
    isEdit.value = false
    doseData.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
  // init()
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        服用頻度
      </q-toolbar-title>
      <q-btn v-if="isEdit" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="doseData.name_dose_formal"
            label="服用頻度 表記名 *"
            autofocus
            tabindex="1"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            v-model="doseData.name_dose_short"
            label="服用頻度 簡易名 *"
            tabindex="2"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFormPullDown
            v-model:selected="doseData.type_dose"
            :options="typeDose"
            label="連続服用 区分 *"
            tabindex="3"
            required
            :rules="[aahValidations.validationSelection]"
            @update:selected="
              () => {
                if (doseData.type_dose === 10 || doseData.type_dose === 99) {
                  doseData.quantity_dose = null
                }
              }
            "
          />
        </div>
        <div
          v-if="!(doseData.type_dose == 10 || doseData.type_dose == 99)"
          class="col-lg-6 col-md-6 col-sm-12"
        >
          <MtInputForm
            type="text"
            v-model="doseData.quantity_dose"
            label="累計服用回数/日"
            class="field-right-text total-days-dose-icon"
            tabindex="4"
            required
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNumber
            ]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <MtInputForm
            type="text"
            tabindex="5"
            v-model="doseData.memo_dose"
            label="服用時の説明"
            autogrow
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtInputForm
            type="text"
            tabindex="6"
            v-model="doseData.display_order"
            label="表示順序（0~999; 小を上位表示）"
            @update:modelValue="handleDisplayOrder"
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
          v-permission
          type="submit"
          unelevated
          :tabindex="10"
          color="primary"
          class="q-ml-md"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style>
.total-days-dose-icon::after {
  content: '回/日';
  top: 65% !important;
}
</style>
