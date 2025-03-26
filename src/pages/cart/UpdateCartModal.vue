<script setup lang="ts">
import { onMounted, reactive, ref, defineAsyncComponent } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import { getDateToday } from '@/utils/aahUtils'
import useCartStore from '@/stores/carts'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'

// Stores
import useAuthStore from '@/stores/auth'
import useClinicStore from '@/stores/clinics'

// Components
import OptionModal from '@/components/OptionModal.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'

// Lazy-loaded Components
const UpdateCartHeaderModal = defineAsyncComponent(() => import('@/pages/cart/UpdateCartHeaderModal.vue'))

// Store Instances
const authStore = useAuthStore()
const cartStore = useCartStore()
const customerStore = useCustomerStore()
const clinicStore = useClinicStore()

// Store References
const { getCustomer } = storeToRefs(customerStore)
const { getAuthUser } = storeToRefs(authStore)
const { getClinics } = storeToRefs(clinicStore)
const { getCarts } = storeToRefs(cartStore)

// Emits
const emits = defineEmits(['close'])

const props = defineProps({ data: Object, selectedCustomer: String })

const data = reactive({
  id_customer: '',
  code_customer: null,
  name_customer: null,
  date_start: getDateToday(),
  date_end: getDateToday(),
  memo_bill_address: null,
  id_pet: null,
  name_pet: null,
  flg_multiple_pet: false,
  id_discount_rate: null,
  id_employee_cart: getAuthUser.value?.id_employee
})

const loading = ref(false)

const customerList = ref([])
const customerListDefault = reactive([])

function resetData() {
  Object.assign(data, {
    id_customer: null,
    code_customer: null,
    name_customer: null,
    memo_bill_address: null,
    id_pet: null,
    name_pet: null,
    flg_multiple_pet: false,
    id_discount_rate: null
  })
}

const selectingCustomer = async (customer: any) => {
  if (customer) {
    await customerStore.selectCustomer(customer)
    const {
      id_customer,
      code_customer,
      name_family,
      name_first,
      address,
      pets
    } = getCustomer.value

    // Find the main address once and store it
    const mainAddress = address?.find(
      ({ flg_main_address }) => flg_main_address
    )

    Object.assign(data, {
      id_customer,
      code_customer,
      name_customer: `${name_family} ${name_first}`,
      memo_bill_address: mainAddress
        ? `${mainAddress.zip_code || ''} ${mainAddress.address_prefecture || ''} ${mainAddress.address_city || ''} ${mainAddress.address_other || ''}`
        : null
    })

    // if (pets && pets.length) {
    //   data.id_pet = pets.map((pet) => pet.id_pet).join(',')
    //   data.name_pet = pets.map((pet) => pet.name_pet).join(',')
    //   data.flg_multiple_pet = pets.length > 1
    // }
  } else {
    resetData()
  }
}

const closeModal = () => {
  emits('close')
}

const submit = () => {
  loading.value = true
  cartStore.submitCart(data).then(async (response) => {
    let responseData = response.data.data
    await mtUtils.popup(UpdateCartHeaderModal, {
      data: responseData,
      allData: getCarts.value
    })
    loading.value = false
    closeModal()
  })
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
            cartStore.destroyCart(data.id_cart).then(() => {
              cartStore.fetchCarts()
              emits('close')
              mtUtils.autoCloseAlert(aahMessages.success)
            })
          }
        })
    }
  }
}

onMounted(async () => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  if (getClinics.value.length == 0) {
    await clinicStore.fetchClinics()
  }
  if (props.data?.id_cart) {
    // Update case
    Object.assign(data, { ...props.data })
    customerStore.selectCustomer(props.data.id_customer).then(() => {
      customerStore.selectPet(props.data.id_pet)
    })
  } else {
    // Create case
    // data = data
  }

  if (props.selectedCustomer) {
    data.id_customer = props.selectedCustomer
  }
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @close-modal="closeModal" :closeBtn="false">
      <div class="column q-mb-sm">
        <q-toolbar-title
          class="text-grey-900 title2 bold q-pa-none q-mt-md q-mb-xs"
        >
          オーナー検索
        </q-toolbar-title>
      </div>
    </MtModalHeader>
    <q-card-section class="q-px-xl">
      <div
        class="col-12 items-center justify-center q-col-gutter-md full-height"
      >
        <div class="text-grey-600 body2 regular">
          会計対象となるオーナーを指定して下さい。
        </div>
        <div class="col-12">
          <MtFilterSelect
            label="診察券番号* "
            v-model:selecting="data.id_customer"
            v-model:options="customerList"
            :options-default="customerListDefault"
            @update:selecting="selectingCustomer"
            required
            :rules="[aahValidations.validationRequired]"
            :disable="props.selectedCustomer"
          />
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit" :loading="loading">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>
