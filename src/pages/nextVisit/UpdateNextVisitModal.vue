<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useCustomerStore from '@/stores/customers'
import useNextVisitStore from '@/stores/next-visit'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import { storeToRefs } from 'pinia'
import { concatenate } from '@/utils/aahUtils'
import OptionModal from '@/components/OptionModal.vue'
import MtFormInputDateTime from '@/components/form/MtFormInputDateTime.vue'
import useCommonStore from '@/stores/common'

const emits = defineEmits(['close'])
const commonStore = useCommonStore()
const customerStore = useCustomerStore()
const nextVisitStore = useNextVisitStore()
const { getCustomerOption } = storeToRefs(customerStore)
const props = defineProps({ data: Object })

const requestForm = reactive({
  id_customer: '',
  id_pet: '',
  type_visit_purpose: '',
  datetime_next_visit: null,
  memo_visit: null,
  flg_cancel_employee: false,
  id_clinic: null
})
const customerList = ref([])
const customerListDefault = reactive([])
const isPet = ref(false)
const petList: any = ref([])
const petListDefault: any = reactive([])

const closeModal = () => {
  emits('close')
}
async function selectingCustomer(value: any, initCall = false) {
  requestForm.id_customer = value
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
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
      }
    }
  } else {
    requestForm.id_pet = ''
    isPet.value = false
    petList.value.length = 0
    petListDefault.length = 0
  }
}
function assignPageData(data: any) {
  if (data) {
    for (let key in data) {
      requestForm[key] = data[key]
    }
  }
}
const submit = async () => {
  if (props.data?.id_next_visit) {
    nextVisitStore
      .updateNextVisitList(props.data?.id_next_visit, requestForm)
      .then(() => {
        nextVisitStore.fetchNextVisitList()
        closeModal()
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    nextVisitStore.submitNextVisitList(requestForm).then(() => {
      nextVisitStore.fetchNextVisitList()
      closeModal()
      mtUtils.autoCloseAlert(aahMessages.success)
    })
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
      await mtUtils
        .confirm('本当に削除しますか？', '確認') //TODO: 共通化する必要あり
        .then((confirmation) => {
          if (confirmation) {
            nextVisitStore
              .destroyNextVisitList(requestForm.id_next_visit)
              .then(() => {
                nextVisitStore.fetchNextVisitList()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
function clickDate(value: any) {
  if (value) {
    requestForm.datetime_next_visit = value
  }
}
onMounted(async () => {
  await commonStore.fetchPreparationCommonList({code_common: [13]})
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.data?.id_next_visit) {
    assignPageData(props.data)
    if (props.data?.id_customer != '') {
      selectingCustomer(props.data?.id_customer)
    }
  } else {
    requestForm.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        次回来院予定
      </q-toolbar-title>
      <q-btn flat round v-if="props.data" @click="openMenu">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mt-md q-mb-lg">
        <div class="col-3">
          <MtFilterSelect
            label="オーナー *"
            v-model:selecting="requestForm.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            @update:selecting="selectingCustomer"
            required
            :rules="[aahValidations.validationRequired]"
            class="q-pb-none"
          />
        </div>
        <div class="col-3" v-show="isPet">
          <MtFilterSelect
            :options-default="petListDefault"
            v-model:options="petList"
            v-model:selecting="requestForm.id_pet"
            label="ペット名"
            class="q-pb-none"
          />
        </div>
        <div class="col-3">
          <MtFormPullDown
            label="来院目的"
            v-model:selected="requestForm.type_visit_purpose"
            :options="commonStore.getCommonTypeVisitPurposeList"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md q-mb-md">
        <div class="col">
          <MtInputForm
            type="text"
            v-model="requestForm.memo_visit"
            label="来院メモ"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtFormInputDateTime
            v-model:date="requestForm.datetime_next_visit"
            label="次回来院日 次回来院時間"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md q-mb-md">
        <MtInputForm
          type="checkbox"
          v-model="requestForm.flg_cancel_employee"
          :items="[{ label: 'キャンセル' }]"
        />
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped></style>
