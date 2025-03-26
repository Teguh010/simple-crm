<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import usePetStore from '@/stores/pets'
import useCustomerStore from '@/stores/customers'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { storeToRefs } from 'pinia'
import {
  changeToggleDropdownNames
} from '@/utils/aahUtils'

const data = ref({
  id_customer: '',
  id_pet: '',
  memo_pet: '',
  memo_customer: '',
  name_kana_pet: '',
  name_pet: '',
  type_animal: '',
  type_pet_gender: '',
  type_title_pet_customer_updated: '',
  date_birth: '',
  name_customer_display: '',
  name_family: '',
  name_first: '',
  name_kana_family: '',
  name_kana_first: ''
})
const props = defineProps({
  id_pet: Number,
  is_pet_detail: { type: Boolean, default: false }
})
const petStore = usePetStore()
const customerStore = useCustomerStore()

const { getCustomer, getAllCustomers } = storeToRefs(customerStore)

const emits = defineEmits(['close'])
const closeModal = () => {
  emits('close')
  petStore.clearPetMemo()
}

const petList: any = ref([])
const petListDefault: any = reactive([])
const customerList: any = ref([])
const customerListDefault: any = reactive([])

// q-editor refs
const foreColor = ref('#ffff00')
const petMemoRef = ref()

let petMemoTimeout: ReturnType<typeof setTimeout>

const colorClicked = () => {
  const edit = petMemoRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
}

const submit = async () => {
  const id_pet = props.id_pet
  const promises = petStore.getPetMemos.map(async (petMemo) => {
    // Prepare the data for the update
    const payload = {
      id_customer: data.value.id_customer,
      id_pet: petMemo.id,
      memo_pet: petMemo.memo
    };

    return await petStore.updatePet(payload.id_pet, getCustomer.value.id_customer, payload);
  });
  
  await customerStore.updateCustomer(data.value.id_customer, data.value)

  mtUtils.autoCloseAlert(aahMessages.success)
  closeModal()
  await customerStore.selectCustomer(getCustomer.value.id_customer, true)
  if (data.value.id_pet) customerStore.selectPet(id_pet)
}
const changePet = (v) => {
  const pet = petList.value.find((p) => p.id_pet === v)
  data.value.id_pet = pet
  // const customer = getCustomer.value
  // init(pet, customer)
  data.value.memo_pet = petStore.getPetMemos.find((memo) => {
    return memo.id === pet.id_pet
  })?.memo || pet.memo_pet
}
const init = (pet: any, customer: any) => {
  data.value.id_customer = getCustomer.value.id_customer
  data.value.code_customer = getCustomer.value.code_customer
  data.value.memo_pet = pet?.memo_pet ? pet.memo_pet : ''
  data.value.name_kana_pet = pet?.name_kana_pet
  data.value.name_pet = pet?.name_pet
  data.value.type_animal = pet?.type_animal
  data.value.type_pet_gender = pet?.type_pet_gender
  data.value.date_birth = pet?.date_birth
  data.value.type_title_pet_customer_updated =
    pet?.type_title_pet_customer_updated

  data.value.memo_customer = customer.memo_customer
  data.value.name_customer_display = customer.name_customer_display
  data.value.name_family = customer.name_family
  data.value.name_first = customer.name_first
  data.value.name_kana_family = customer.name_kana_family
  data.value.name_kana_first = customer.name_kana_first
}

const setPetMemo = (id: number, value: string) => {
  if (petMemoTimeout) clearTimeout(petMemoTimeout);

  petMemoTimeout = setTimeout(() => {
    if (value.length > 2000) {
      value = value.substring(0, 2000);
      data.value.memo_pet = value;
    }
    petStore.setPetMemo(id, value);
  }, 100);
};

onMounted(() => {

  if (props.id_pet) {
    petListDefault.push(...JSON.parse(JSON.stringify(getCustomer.value?.pets)))
    petList.value = [...petListDefault]
    customerListDefault.push(
      ...JSON.parse(JSON.stringify(getAllCustomers.value))
    )
    customerList.value = [...customerListDefault]

    const pet = petList.value.find((p) => p.id_pet === props.id_pet)
    const customer = getCustomer.value
    data.value.id_pet = pet
    init(pet, customer)
    setPetMemo(pet.id_pet, pet.memo_pet)
  }
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold"
      >ペットメモ</q-toolbar-title
    >
    <div class="flex items-center">
      <span class="q-mr-sm">対象</span>
      <MtFilterSelect
        @update:model-value="changePet"
        :options-default="petListDefault"
        v-model:options="petList"
        v-model:selecting="data.id_pet"
        :readonly="props.is_pet_detail"
        outlined
        class="bg-accent-100"
      />
    </div>
  </MtModalHeader>
  <q-form @submit="submit">
    <q-card-section class="q-py-md q-px-xl">
      <div class="row items-start q-gutter-md">
        <div class="col">
          <MtInputForm
            :readonly="!data.id_pet"
            type="textarea"
            outlined
            class="textarea"
            maxlength="2000"
            autogrow
            v-model="data.memo_pet"
            @update:model-value="(value) => setPetMemo(data.id_pet.id_pet, value)"
          />  
          <div class="flex justify-end">{{ data.memo_pet.length }} / 2000</div>
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

<style lang="scss" scoped>
.color-picker {
  max-width: 20px;
  box-shadow: none;
  border-radius: 0;
}
.q-editor {
  border-radius: 10px;
}

:deep(.q-editor__content) {
  padding: 16px;
}
:deep(.q-textarea textarea) {
  height: 45vh !important;
  overflow-y: scroll;
}
</style>
