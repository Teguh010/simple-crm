<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import mtUtils from '@/utils/mtUtils'
import { concatenate, copyText } from '@/utils/aahUtils'
import useAuthAtore from '@/stores/auth'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import useCommonStore from '@/stores/common'
import { PetType } from '@/types/types'
import aahValidations from '@/utils/aahValidations'
import MtSearchItemService from '@/components/MtSearchItemService.vue'
import selectOptions from '@/utils/selectOptions'

type CustomerDM = {
  date_start: string
  date_end: string
  id_pet: string
  id_customer: string
  type_prevention: string
  item_service_name: string
  id_item_service: string
  name_category1: string
  name_category2: string
  date_booking: string
  id_service_detail: string
  id_prescription_detail: string
  id_inject_detail: string
}

const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getDoctors } = storeToRefs(employeeStore)
const authStore = useAuthAtore()
const router = useRouter()
const commonStore = useCommonStore()

const { getCustomerOption } = storeToRefs(customerStore)
const { getAuthUser } = storeToRefs(authStore)
const { getCommonTypeAnimalOptionList } = storeToRefs(commonStore)

const emits = defineEmits(['close'])

const props = defineProps({})

const bookingForm = ref<CustomerDM>({
  date_start: null,
  date_end: null,
  id_pet: '',
  id_customer: null,
  type_prevention: null,
  item_service_name: null,
  id_item_service: null,
  name_category1: '',
  name_category2: '',
  date_booking_confirmed: ''
})

const isEdit = ref(false)
const isPet = ref(false)

const customerList = ref([])
const customerListDefault = reactive([])
const petList: any = ref([])
const petListDefault: any = reactive([])


const selectingCustomer = async (value: any, initCall = false) => {
  bookingForm.id_customer = value
  isPet.value = false
  // If address length not matched then refresh the list
  if (value) {
    // code_customer and code_ahmics_customer
    await mtUtils.promiseAllWithLoader([
      customerStore.selectCustomerOptions(value)
    ])

    let selectedCustomer = getCustomerOption.value
    if (selectedCustomer) {
      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petListDefault.length = 0
        selectedCustomer.pets.map((petObj: PetType) => {
          if (petObj.flg_unlist || petObj.flg_deceased) return

          petListDefault.push({
            ...petObj,
            label: concatenate(
              petObj.code_pet,
              selectedCustomer.name_family,
              petObj.name_pet
            ),
            value: petObj.id_pet,
            icon:
              getCommonTypeAnimalOptionList.value.find((c) => {
                return c.value === petObj.id_cm_animal
              })?.text1 ?? ''
          })
        })
        petList.value = [...petListDefault]
        isPet.value = true
        if (!isEdit.value && petList.value.length > 0) {
          bookingForm.value.id_pet = petListDefault[0]?.id_pet
        }
      }
    }
  } else {
    bookingForm.value.id_pet = ''
    petList.value.length = 0
    petListDefault.length = 0
  }
}

const closeModal = () => {
  emits('close')
}

const setItemService = (value) => {
  console.log('Called', value)
  bookingForm.value.item_service_name = null
  bookingForm.value.name_category1 = ''
  bookingForm.value.name_category2 = ''
  bookingForm.value.type_prevention = null

  if (value) {
    bookingForm.value.item_service_name = value.item_service_name
    bookingForm.value.name_category1 = value.name_category1
    bookingForm.value.name_category2 = value.name_category2
    bookingForm.value.type_prevention = value.type_prevention
  }

}
const save = async () => {

  const response = await mtUtils.callApi(selectOptions.reqMethod.POST, 'mst/customer_dm', bookingForm.value)
  if (response) {
    await mtUtils.autoCloseAlert('オーナーDMの登録ができました。')
    closeModal()
    return
  }

  await mtUtils.autoCloseAlert('Error')
  return
}



onMounted(() => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.request) {
    // On edit modal
    isEdit.value = true
  } else {
    // Create modal
    if (props.id_pet !== '' && props.id_customer !== '') {
      bookingForm.id_customer = props.id_customer
      selectingCustomer(bookingForm.id_customer)
    }
    bookingForm.id_clinic = JSON.parse(localStorage.getItem('id_clinic'))
  }
})
</script>

<template>
  <q-form @submit="save">
    <MtModalHeader class="header-sticky" @closeModal="closeModal">
      <q-toolbar-title
        :class="{ 'cursor-pointer': bookingForm.number_request }"
        class="text-grey-900 title2 bold"
        @click="
          bookingForm.number_request
            ? copyText(bookingForm.number_request)
            : null
        "
      >
        次回来院（調整中）
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section
      class="q-px-lg"
      style="overflow-y: scroll; max-height: 45vh"
    >
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtFilterSelect
            v-model:options="customerList"
            v-model:selecting="bookingForm.id_customer"
            :disable="disable_customer"
            :options-default="customerListDefault"
            :rules="[aahValidations.validationRequired]"
            autofocus
            custom-option
            label="診察券番号 "
            tabindex="1"
            @update:selecting="selectingCustomer"
          >
            <template #selectedCustomOption="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon
                      v-if="slotProps.opt.icon"
                      :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }"
                      name="circle"
                      size="16px"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>
        <div v-if="bookingForm.id_customer" class="col-lg-6 col-md-6 col-sm-12">
          <MtFilterSelect
            v-model:options="petList"
            v-model:selecting="bookingForm.id_pet"
            :options-default="petListDefault"
            :rules="[aahValidations.validationRequired]"
            custom-option
            label="対象ペット"
            tabindex="2"
          >
            <template #selectedItem="{ slotProps }">
              <q-item-label>
                {{ slotProps.opt.label }}
              </q-item-label>
            </template>
            <template #option="{ slotProps }">
              <q-item v-bind="slotProps.itemProps">
                <q-item-section>
                  <div class="flex items-center gap-4 q-pa-sm">
                    {{ slotProps.opt.label }}
                    <q-icon
                      v-if="slotProps.opt.icon"
                      :color="slotProps.opt.icon"
                      :style="{ color: slotProps.opt.icon }"
                      name="circle"
                      size="16px"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </template>
          </MtFilterSelect>
        </div>
      </div>
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-lg-6 col-md-6 col-sm-12" tabindex="3">
          <MtFormInputDate
            v-model:date="bookingForm.date_booking_confirmed"
            :rules="[aahValidations.validationRequired]"
            label="予定日"
          ></MtFormInputDate>
        </div>
        <div class="col-lg-6 col-md-6 col-sm-12">
          <MtSearchItemService
            :applyDefaultClass="false"
            :preSelectedId="bookingForm.id_item_service"
            :rules="[aahValidations.validationRequired]"
            :search-icon="true"
            :tabindex="400"
            label="サービス・商品名 "
            @update:selecting-whole="setItemService"
          />
        </div>
      </div>
    </q-card-section>

    <q-card-section class="q-bt bg-white bottom-sticky">
      <div class="">
        <div class="text-center modal-btn">
          <q-btn
            class="bg-grey-100 text-grey-800"
            outline
            @click="closeModal()"
          >
            <span>キャンセル</span>
          </q-btn>
          <q-btn
            class="q-ml-md"
            color="primary"
            tabindex="30"
            type="submit"
            unelevated
          >
            <span>保存</span>
          </q-btn>
        </div>
        <div></div>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.clear-icon {
  ::v-deep(button.q-icon) {
    font-size: 1.125rem;
    top: 1px;
  }
}

.c-grid {
  display: grid;
  grid-template-columns: 120px auto 120px;
  flex-direction: column;
}

.first-item {
  max-width: 100px;
}

.q-item {
  min-height: auto !important;
  padding: 2px 0 !important;
}

.header-sticky {
  position: sticky;
  width: 100%;
  height: 5vh;
  background: white !important;
  top: 0;
  z-index: 100;
}
</style>
