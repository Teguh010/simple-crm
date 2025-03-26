<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import OptionModal from '@/components/OptionModal.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useActionStore from '@/stores/action'
import useTelephoneStore from '@/stores/telephones'
import { typeTel } from '@/utils/enum'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import { copyText } from '@/utils/aahUtils'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import { CustomerTelephoneType } from '@/types/types'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'

const emits = defineEmits(['close'])

const props = defineProps({ 
  data: Object, 
  id_customer: String, 
  callBack: Function,
  deleteCallback: Function,
  telephoneList: {
    type: Array,
    default: () => []
  }
})

const telephoneStore = useTelephoneStore()
const customerStore = useCustomerStore()
const actionStore = useActionStore()
const { getCustomer } = storeToRefs(customerStore)

const formData = reactive({
  code_customer: '',
  id_customer: '',
  id_clinic: '',
  type_tel: 1,
  title_tel: '',
  tel_full: '',
  tel: '',
  flg_main_tel: false,
  flg_emergency: false
})

const isEdit = ref(false)
const addTypeTelModal = ref(false)
const isSubmitting = ref(false)

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
      const submitData = {
        code_customer: formData.code_customer || '',
        flg_emergency: formData.flg_emergency || false,
        flg_main_tel: formData.flg_main_tel || false,
        id_clinic: formData.id_clinic,
        id_customer: formData.id_customer,
        tel: formData.tel_full,
        tel_full: formData.tel_full,
        title_tel: formData.title_tel,
        type_tel: formData.type_tel || 1
      }
      if (!props.data?.id_tel) {
        if (props.deleteCallback) {
          props.deleteCallback(submitData)
        }
        const indexToEdit = telephoneStore.getTelephonesLocalDataIndex
        telephoneStore.telephonesLocalData.splice(indexToEdit, 1)
        emits('close')
      } else {
        await mtUtils
          .confirm(aahMessages.delete_ask, aahMessages.delete)
          .then((confirmation) => {
            if (confirmation) {
              telephoneStore
                .destroyTelephone(formData.id_tel)
                .then(async () => {
                  await customerStore.selectCustomer(formData.id_customer, true)
                  if (props.deleteCallback) {
                    props.deleteCallback(submitData)
                  }
                  const indexToEdit = telephoneStore.getTelephonesLocalDataIndex
                  telephoneStore.telephonesLocalData.splice(indexToEdit, 1)
                  emits('close')
                  mtUtils.autoCloseAlert(aahMessages.success)
                })
            }
          })
      }
    }
  }
}
const updateTel = async (val: string | number | null = null) => {
  if (val) {
    formData.tel_full = val.toString().replace(/[-() ]/g, '')
    const temp = val.toString().substr(0, 3)
    if (['080', '090', '070'].includes(temp)) formData.type_tel = typeTel.find((i) => i.value === 2)?.value
    if (['050'].includes(temp)) formData.type_tel = typeTel.find((i) => i.value === 6)?.value
  }
}

const computedLocalTel = computed(() => {
  return telephoneStore.getTelephonesLocalData
})

// Update local telephone flags
const updateLocalTelephoneFlags = () => {
  const existingMainTel = computedLocalTel.value.find(i => i.flg_main_tel);
  const existingEmergencyTel = computedLocalTel.value.find(i => i.flg_emergency);

  if (formData.flg_main_tel && existingMainTel) {
    existingMainTel.flg_main_tel = false;
  }
  if (formData.flg_emergency && existingEmergencyTel) {
    existingEmergencyTel.flg_emergency = false;
  }
};
// Update server telephone flags
const createPayload = (tel, overrides) => ({
  code_customer: tel.code_customer || '',
  flg_emergency: overrides.flg_emergency ?? tel.flg_emergency,
  flg_main_tel: overrides.flg_main_tel ?? tel.flg_main_tel,
  id_clinic: tel.id_clinic,
  id_customer: tel.id_customer,
  tel: tel.tel_full,
  tel_full: tel.tel_full,
  title_tel: tel.title_tel,
  type_tel: tel.type_tel || 1
});
const updateServerTelephoneFlags = async (mainTel, emergencyTel) => {
  if (mainTel && emergencyTel && formData.flg_main_tel && formData.flg_emergency && mainTel.id_tel !== formData.id_tel) {
    await telephoneStore.updateTelephone(mainTel.id_tel, createPayload(mainTel, { flg_main_tel: false, flg_emergency: false }));
    return await telephoneStore.updateTelephone(emergencyTel.id_tel, createPayload(emergencyTel, { flg_main_tel: false, flg_emergency: false }));
  }

  if (mainTel && formData.flg_main_tel && mainTel.id_tel !== formData.id_tel) {
    return await telephoneStore.updateTelephone(mainTel.id_tel, createPayload(mainTel, { flg_main_tel: false }));
  }

  if (emergencyTel && formData.flg_emergency && emergencyTel.id_tel !== formData.id_tel) {
    return await telephoneStore.updateTelephone(emergencyTel.id_tel, createPayload(emergencyTel, { flg_emergency: false }));
  }
};
const checkExistingMainAndEmergencyTel = async () => {
  const mainTel = computedLocalTel.value.find((i) => i.flg_main_tel)
  const emergencyTel = computedLocalTel.value.find((i) => i.flg_emergency)

  if (props.id_customer) {
    // If id_customer is available, update to server
    return updateServerTelephoneFlags(mainTel, emergencyTel)
  }
  // If no id_customer update the local without submit to server
  return updateLocalTelephoneFlags()
}

const submit = async () => {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    // Validate phone number
    if (!formData.tel_full || !(formData.tel_full.length >= 10)) {
      mtUtils.autoCloseAlert('電話番号は11桁または12桁で登録してください')
      isSubmitting.value = false
      return false
    }

    // Set id_clinic from localStorage
    formData.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
    
    // Make payload
    const submitData = {
      code_customer: formData.code_customer || '',
      flg_emergency: formData.flg_emergency || false,
      flg_main_tel: formData.flg_main_tel || false,
      id_clinic: formData.id_clinic,
      id_customer: formData.id_customer,
      tel: formData.tel_full,
      tel_full: formData.tel_full,
      title_tel: formData.title_tel,
      type_tel: formData.type_tel || 1
    }

    let response

    checkExistingMainAndEmergencyTel()

    if (!props.data && !isEdit.value) { // Add new telephone
      // Submitting process for new telephone
      if (props.callBack) { // (If it is not edit mode in UpdateCustomerModal, callBack will be called.)
        props.callBack(submitData)
        emits('close')
      } else {
        response = await telephoneStore.submitTelephone(submitData)
        console.log('Create telephone response:', response)
        await customerStore.selectCustomer(response?.data?.data.id_customer, true)
        emits('close')
      }
    } else if (!props.data?.id_tel) { // Update telephone before having id_customer
      const payload = {
        ...submitData
      }
      delete payload.id_customer

      const telephoneLocalData = telephoneStore.getTelephonesLocalData
      const indexToEdit = telephoneStore.getTelephonesLocalDataIndex
      telephoneLocalData.splice(indexToEdit, 1, payload)
      
      telephoneStore.setTelephonesLocalData(telephoneLocalData)
      await customerStore.selectCustomer(formData.id_customer, true)

      if (props.callBack) {
        props.callBack(submitData)
      }
      emits('close')
    } else { // Update existing telephone after having id_customer
      response = await telephoneStore.updateTelephone(formData.id_tel, submitData)
      console.log('Update telephone response:', response)
      await customerStore.selectCustomer(response?.data?.data.id_customer, true)
      if (props.callBack) {
        props.callBack(submitData)
      }
      emits('close')
    }

    mtUtils.autoCloseAlert(aahMessages.success)
  } catch (error) {
    console.error('Submit error:', error)
    isSubmitting.value = false
    emits('close')
  }
}
const closeModal = () => {
  emits('close')
}
const assignPageData = (data: CustomerTelephoneType) => {
  if (data) {
    for (let key in data) {
      formData[key] = data[key]
    }
    if (data.flg_main_tel) {
      formData.flg_main_tel = true
    }
    if (data.flg_emergency) {
      formData.flg_emergency = true
    }
  }
}
const handleUpdateTypeTel = (val: string) => {
  formData.title_tel = `${formData.title_tel} ${val}`
  addTypeTelModal.value = false
}

const newTypeTel = computed(() => {
  return typeTel.map((tel) => {
    return {
      ...tel,
      title: tel.label,
      flg_title: false,
      isSelected: false
    }
  })
})
onMounted(() => {
  if (props.data?.id_tel || props.data?.tel_full) {
    isEdit.value = true
    // Update case
    assignPageData(props.data)
  } else {
    // Create case
    isEdit.value = false
  }

  formData.id_customer = props.id_customer
  formData.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        電話番号
      </q-toolbar-title>
      <div v-if="props.data" class="q-mr-md">{{ getCustomer?.name_customer_display }} 様</div>
      <div v-if="props.data">診察券番号:{{ getCustomer.code_customer }}</div>
      <q-space />
      <q-btn v-if="props.data" flat round @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-md">
      <div class="row cursor-pointer q-col-gutter-md q-pa-md">
        <div class="col-lg-12 col-md-12 col-sm-12">
          <div class="flex items-center gap-4">
            <MtFormCheckBox
              class="q-ml-sm"
              label="メイン"
              v-model:checked="formData.flg_main_tel"
            />
            <MtFormCheckBox
              class="q-ml-sm"
              label="緊急"
              v-model:checked="formData.flg_emergency"
            />
          </div>
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtInputForm
            type="text"
            v-model="formData.title_tel"
            label="タイトル"
            tabindex="1"
            autofocus
          >
            <template #append>
              <q-btn unelevated icon="add" @click="addTypeTelModal = true" />
            </template>
          </MtInputForm>
        </div>
        <div class="col-lg-12 col-md-12 col-sm-12">
          <MtFormInputNumber
            v-model:value="formData.tel_full"
            label="電話番号"
            mode="phone"
            tabindex="2"
            @update:value="updateTel"
            :rules="[aahValidations.validationNumber]"
          >
            <template #append>
              <q-btn unelevated icon="content_copy" @click="copyText(formData.tel_full)" />
            </template>
          </MtFormInputNumber>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline @click="closeModal" class="bg-grey-100 text-grey-800">
          <span>キャンセル</span>
        </q-btn>
        <q-btn 
          type="submit" 
          color="primary" 
          tabindex="5" 
          class="q-ml-md"
          :loading="isSubmitting"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
  <AddTextTemplateModal
    v-model:value="addTypeTelModal"
    modelTitle="電話タイトル"
    :options="newTypeTel"
    :data="formData"
    :single-option="true"
    @update:memo="handleUpdateTypeTel" />

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
