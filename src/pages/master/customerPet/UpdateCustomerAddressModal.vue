<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtSearchAddressInput from '@/components/form/MtSearchAddressInput.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useAddressesStore from '@/stores/addresses'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useActionStore from '@/stores/action'
import InputZipcode from '@/components/form/InputZipcode.vue'

const emits = defineEmits(['close'])

const props = defineProps({ data: Object })

const addressStore = useAddressesStore()
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const { getCustomer, getAddress } = storeToRefs(customerStore)

const formData = reactive({
  code_customer: '',
  id_customer: null,
  title_address: '',
  phone1: null,
  flg_main_address: false,
  zip_code: '',
  address_prefecture: '',
  address_city: '',
  address_other: '',
  name_address: '',
  memo_address: ''
})

const isEdit = ref(false)

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
            addressStore
              .destroyAddress(formData.id_address, formData.id_customer_id)
              .then(async () => {
                await customerStore.selectCustomer(formData.id_customer)
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}
const copyAddress = () => {
  let content = (formData.zip_code ? formData.zip_code + ' ' : '') + 
    (formData.address_prefecture ? formData.address_prefecture + ' ' : '') + 
    (formData.address_city ? formData.address_city + ' ' : '') +
    (formData.address_other ? formData.address_other : '') + '\n'
  content += (formData.name_address ? '宛名: ' + formData.name_address + '\n' : '') + (formData.phone1 ? '電話: ' + formData.phone1 : '')

  navigator.clipboard.writeText(content).then(async () => {
    mtUtils.autoCloseAlert('コピーしました')
  })
}
const changeZipCode = (value: any) => {
  // Convert zip code to string/numbers
  if (typeof value === 'object') {
    formData.address_prefecture = value.address_prefecture
    formData.address_city = value.address_city
    formData.address_other = value.address_other
    formData.zip_code = value.zip_code
  }
}
const submit = () => {
  if (isEdit.value) {
    addressStore
      .updateAddress(formData.id_address, formData.id_customer, formData)
      .then(async (response: any) => {
        await customerStore.selectCustomer(formData.id_customer)
        emits('close', response.data)
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  } else {
    formData.code_address = formData.code_customer
    addressStore
      .submitAddress(formData.id_customer, formData)
      .then(async () => {
        await customerStore.selectCustomer(formData.id_customer)
        await addressStore.fetchAddresses(formData.id_customer)
        actionStore.setAction('updateCustomer')
        emits('close')
        mtUtils.autoCloseAlert(aahMessages.success)
      })
  }
}
const closeModal = () => {
  emits('close')
}

const updateAddress = (address: any) => {
  if (address == null) return
  // for(let index = 1; index < 5; index++){
  //   formData['address' + index + '_delivery'] = address['address' + index]
  // }
}

const clearAddress = () => {
  // for(let index = 1; index < 5; index++){
  //   formData['address' + index + '_delivery'] = ''
  // }
}

const assignPageData = (data: any) => {
  if (data) {
    for (let key in data) {
      formData[key] = data[key]
    }
  }
}

const init = () => {}

const openGoogleMapSearch = () => {
  if(!formData.address_other) return false
  const query = encodeURIComponent(`${formData.address_prefecture}${formData.address_city}${formData.address_other}`)
  const location = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.open(location, '_blank');
}

onMounted(() => {
  if (props.data?.id_address) {
    isEdit.value = true
    // Update case
    assignPageData(props.data)
  } else {
    // Create case
    isEdit.value = false

    if (
      !getCustomer.value?.address ||
      (getCustomer.value?.address && getCustomer.value.address.length == 0)
    ) {
      formData.title_address = '基本住所'
      if (getCustomer.value) {
        formData.name_address = getCustomer.value?.name_customer_display
        formData.flg_main_address = true
      }
    }
  }

  if (getCustomer.value) {
    formData.code_customer = getCustomer.value.code_customer
    formData.id_customer = getCustomer.value.id_customer
  }
})
</script>

<template>
  <q-form @submit="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        住所
      </q-toolbar-title>
      <div class="q-mr-md">{{ getCustomer?.name_customer_display }} 様</div>
      <div>診察券番号:{{ getCustomer.code_customer }}</div>
      <q-space />
      <q-btn v-if="props.data" flat round @click="copyAddress" class="q-mx-sm">
        <q-icon size="xs" name="content_copy" /> 
      </q-btn>
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col">
          <MtInputForm
            type="text"
            v-model="formData.title_address"
            label="住所タイトル"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col">
          <MtInputForm type="text" v-model="formData.phone1" label="電話番号" />
        </div>
        <div class="col">
          <MtFormCheckBox
            type="checkbox"
            :disable="true"
            v-model:checked="formData.flg_main_address"
            label="メイン住所に指定"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col">
          <InputZipcode
            v-model:selecting="formData.zip_code"
            @changeZipCode="changeZipCode"
            label="郵便番号 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col">
          <MtInputForm
            type="text"
            v-model="formData.address_prefecture"
            label="都道府県 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col">
          <MtInputForm
            type="text"
            v-model="formData.address_city"
            label="市区町村 *"
            required
            :rules="[aahValidations.validationRequired]"
          />
        </div>
        <div class="col-6">
          <MtInputForm
            type="text"
            v-model="formData.address_other"
            label="住所 *"
            required
            :rules="[aahValidations.validationRequired]"
          >
            <template v-slot:append>
              <q-icon name="place" class="cursor-pointer" @click="openGoogleMapSearch" />
            </template>
          </MtInputForm>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-sm">
        <div class="col-3">
          <MtInputForm
            type="text"
            v-model="formData.name_address"
            label="宛名"
          />
        </div>
        <div class="col">
          <MtInputForm
            type="text"
            v-model="formData.memo_address"
            label="住所メモ"
            autogrow
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline @click="closeModal()" class="bg-grey-100 text-grey-800">
          <span>キャンセル</span>
        </q-btn>
        <q-btn type="submit" color="primary" class="q-ml-md">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.status {
  width: 120px;
  height: 30px;
}
.border-radius {
  border-radius: 10px;
}
</style>
