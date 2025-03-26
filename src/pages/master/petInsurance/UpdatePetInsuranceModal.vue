<script setup lang="ts">
import {onMounted, reactive, ref} from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useInsuranceStore from '@/stores/insurances'
import {storeToRefs} from 'pinia'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormPullDown from "@/components/form/MtFormPullDown.vue";
import useCommonStore from "@/stores/common";

const insuranceStore = useInsuranceStore()
const commonStore = useCommonStore()

const emits = defineEmits(['close'])


const { getCommonTypeGeneralInsurerOptionList } = storeToRefs(commonStore)

const props = defineProps({ data: Object, searchData: Function })

const isEdit = ref(false)

const data = ref({
  id_insurer: null,
  id_cm_insurer: null,
  name_insurance_plan: null,
  flg_available_insurance: false,
  code_insurance_plan: null,
  url_insurance_plan: null,
  memo_insurance_plan: null,
  term_insurance: null,
  coverage: null,
  flg_unavailable: false,
  date_insurance_end: null,
  id_clinic: null
})
const insurerOptions = ref([])
const insurerDefaultOptions = reactive([])

function initializeFilterSelect() {
  insurerOptions.value.length = 0
  insurerDefaultOptions.length = 0
  insuranceStore.getInsurerDefaultOptions.forEach((insureObj) => {
    insurerOptions.value.push(insureObj)
    insurerDefaultOptions.push(insureObj)
  })
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
            insuranceStore
              .destroyInsurance(data.value.id_insurance_plan)
              .then(() => {
                props.searchData()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const submit = () => {
  if (props.data) {
    insuranceStore
      .updateInsurance(data.value.id_insurance_plan, data.value)
      .then(async () => {
        props.searchData()
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    insuranceStore.submitInsurance(data.value).then(async () => {
      props.searchData()
      emits('close')
      mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}
const hanldeFlgUnavailable = (value: any) => {
  if(!value) {
    data.value.date_insurance_end = null
  }
}
onMounted(() => {
  initializeFilterSelect()

  if (props.data?.id_insurance_plan) {
    // Update case
    isEdit.value = true
    data.value = props.data
  } else {
    // Create case
    isEdit.value = false
    data.value = data.value
    data.value.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        ペット保険プランマスタ
      </q-toolbar-title>
      <q-btn flat round v-if="isEdit" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtFormPullDown
            v-model:selected="data.id_cm_insurer"
            :options="getCommonTypeGeneralInsurerOptionList"
            class="q-mr-sm selection-field"
            label="ペット保険会社"
            required
            :rules="[aahValidations.validationSelection]"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.name_insurance_plan"
            label="保険プラン名*"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '取り扱い' }]"
            v-model="data.flg_available_insurance"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.code_insurance_plan"
            label="保険プラン商品CD"
          />
        </div>
        <div class="col-10">
          <MtInputForm
            type="text"
            v-model="data.url_insurance_plan"
            label="保険プランURL"
            autogrow
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-12">
          <MtInputForm
            type="text"
            v-model="data.memo_insurance_plan"
            label="保険プランメモ"
            autogrow
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.term_insurance"
            label="保険期間（ヵ月）"
            required
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNumber
            ]"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.coverage"
            label="保険適用率（％）"
            required
            :rules="[
              aahValidations.validationRequired,
              aahValidations.validationNumber
            ]"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.limit_amount_normal"
            :rules="[
              aahValidations.validationNumber
            ]"
            label="1日あたり限度額：通院"
            required
            type="text"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.limit_amount_hospitalization"
            :rules="[
              aahValidations.validationNumber
            ]"
            label="1日あたり限度額：入院"
            required
            type="text"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.limit_amount_surgery"
            :rules="[
              aahValidations.validationNumber
            ]"
            label="1回あたり限度額：手術"
            required
            type="text"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.max_normal"
            :rules="[
              aahValidations.validationNumber
            ]"
            label="最大日数（年間）：通院"
            required
            type="text"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.max_hospitalization"
            :rules="[
              aahValidations.validationNumber
            ]"
            label="最大日数（年間）：入院"
            required
            type="text"
          />
        </div>
        <div class="col-4">
          <MtInputForm
            v-model="data.max_surgery"
            :rules="[
              aahValidations.validationNumber
            ]"
            label="最大回数（年間）：手術"
            required
            type="text"
          />
        </div>
      </div>
      <div class="row items-center q-col-gutter-md q-mb-xs">
        <div class="col-4">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '提供終了' }]"
            v-model="data.flg_unavailable"
            @update:model-value="hanldeFlgUnavailable"
          />
        </div>
        <div class="col-4" v-if="data.flg_unavailable == '1'">
          <MtFormInputDate
            type="date"
            v-model:date="data.date_insurance_end"
            label="提供終了日"
          />
        </div>
      </div>
      <div class="row q-col-gutter-xs">
        <div class="col-4">
          <MtInputForm
            type="text"
            v-model="data.display_order"
            label="表示順序（0~999; 小を上位表示）"
          />
        </div>
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
