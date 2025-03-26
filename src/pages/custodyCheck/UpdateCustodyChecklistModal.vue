<script setup lang="ts">
import { reactive, ref, onMounted, ComponentPublicInstance, computed } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCustomerStore from '@/stores/customers'
import useCustodyStore from '@/stores/custody'
import useCustodyCheckListsStore from '@/stores/custody-checklists'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useClinicStore from '@/stores/clinics'
import { storeToRefs } from 'pinia'
import imgDefault from '@/assets/img/custodyItem/default.png'
import { isDateOutOfToday } from '@/utils/aahUtils'
import {
  concatenate,
  dateDifferences,
  formatDateTime,
  getDateToday
} from '@/utils/aahUtils'
import {
  GenericValueLabelType,
  CustomerType,
  CustodyChecklistType
} from '@/types/types'
import { useCommonStore } from '@/stores/common'
import useCliCommonStore from '@/stores/cli-common'

const cliCommonStore = useCliCommonStore()
const customerStore = useCustomerStore()
const custodyStore = useCustodyStore()
const clinicStore = useClinicStore()
const custodyCheckListsStore = useCustodyCheckListsStore()
const emits = defineEmits(['close'])
const props = withDefaults(
  defineProps<{
    data?: CustodyChecklistType,
    date_from?: string
    date_to?: string    
  }>(),
  {
    data: () => {
      return {} as CustodyChecklistType
    },
    date_from: '',
    date_to: '',    
  }
)
const { getClinic } = storeToRefs(clinicStore)
const { getCustodies } = storeToRefs(custodyStore)
const { getCustomerOption } = storeToRefs(customerStore)
const { getCliCommonCustodyItemList } = storeToRefs(cliCommonStore)
const commonStore = useCommonStore()

const requestForm = reactive({
  id_customer: 0,
  id_pet: 0,
  date_custody_receive: formatDateTime(getDateToday()),
  date_custody_return_plan: null,
  id_employee_custody: '',
  id_clinic: ''
})
const filteredCustodyItems = computed(() => {
  return custodyItems.value
    .filter((item) => {
      return !isDateOutOfToday(item.date_start as string, item.date_end as string);
    })
    .sort((a, b) => (a.display_order as number) - (b.display_order as number));
});
const petFilterRef = ref()
const custodyItems = ref<Record<string, unknown>[]>([])
const addedItems = ref<Record<string, unknown>[]>([])
const customerList = ref<Array<CustomerType>>([])
const customerListDefault = reactive<Array<CustomerType>>([])
const isPet = ref(false)
const petList = ref<Array<GenericValueLabelType>>([])
const petListDefault = reactive<Array<GenericValueLabelType>>([])
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee') || '{}')
const defaultClinic = JSON.parse(localStorage.getItem('id_clinic') || '{}')

const selectingCustomer = async (value: any, initCall = false) => {
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
        requestForm.id_pet = petList.value[0].value
      }
    }
  } else {
    requestForm.id_pet = ''
    isPet.value = false
    petList.value.length = 0
    petListDefault.length = 0
  }
  // petFilterRef.value.focus()
}
const increaseDescrease = (index: number, type: string) => {
  if (type === 'increase') {
    custodyItems.value[index].quantity = custodyItems.value[index].quantity + 1
  } else if (type === 'decrease' && custodyItems.value[index].quantity > 0) {
    custodyItems.value[index].quantity = custodyItems.value[index].quantity - 1
  }
}
const clickDateCustodyRecive = (value: any) => {
  if (value) {
    requestForm.date_custody_receive = value
    requestForm.date_custody_return_plan = value
  }
}
const clickDateCustodyReturnPlan = (value: any) => {
  if (value) {
    requestForm.date_custody_return_plan = value
  }
}
const addItem = () => {
  addedItems.value = []
  // if (requestForm)
  custodyItems.value.map((custodyItem: any) => {
    if (custodyItem.quantity > 0) {
      addedItems.value.push({
        type_custody_item: custodyItem.code_func1,
        name_custody: custodyItem.name_cli_common,
        quantity: custodyItem.quantity,
        memo_custody: custodyItem.memo_custody,
        flg_need_return: custodyItem.flg_need_return
      })
    }
  })
}
const removeItem = (index: number, type: string | number) => {
  let res = custodyItems.value.find((v) => v.type_custody_item === type)
  if (res) {
    res.quantity = 0
    addedItems.value.splice(index, 1)
  }
}
const closeModal = () => {
  emits('close')
}

const submit = async () => {
  requestForm.id_clinic = defaultClinic
  if (addedItems.value.length === 0) {
    mtUtils.autoCloseAlert('預かり品をリストへ追加してください。', '')
    return
  }
  // check if there are items that need to be returned
  if (addedItems.value.some((item) => item.flg_need_return)) {
    // if an item need to be returned, check the return plan date
    if (!requestForm.date_custody_return_plan) {
      mtUtils.autoCloseAlert('日付を確認してください。', '')
      return false
    }
  }
  addedItems.value.map((addedItem: any) => {
    let data = {
      ...requestForm,
      ...addedItem
    }
    custodyCheckListsStore.submitCustodyCheckList(data).then(async () => {
      await custodyCheckListsStore.fetchCustodyCheckList({
        date_from: props.date_from,
        date_to: props.date_to,
      })
    })
  })
  closeModal()
  mtUtils.autoCloseAlert(aahMessages.success, '')
}

const selectDefaultEmployee = () => {
  requestForm.id_employee_custody = defaultEmployee
}

const returnDateOptions = (date: string) => {
  return date >= requestForm.date_custody_receive
}

const checkLocalImage = (src: string) => {
  const imgUrl = new URL(
    `/src/assets/img/custodyItem/${src}.png`,
    import.meta.url
  ).href;

  return new Promise((resolve) => {
    const img = new Image();
    img.src = imgUrl;

    img.onload = () => {
      resolve(imgUrl);
    };

    img.onerror = () => {
      resolve(imgDefault);
    };
  });
};

onMounted(() => {
  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)
  if (props.data && props.data?.id_customer) {
    // On edit modal
    requestForm.id_customer = props.data.id_customer
    requestForm.id_employee_custody = props.data.id_employee_custody
    selectingCustomer(requestForm.id_customer)
  } else {
    // Create modalid_petid_petid_employee_custody
  }
  // selectDefaultEmployee()
  getCliCommonCustodyItemList.value.map(async (custody: CustodyChecklistType) => {
    custodyItems.value.push({
      ...custody,
      type_custody_item: custody.code_func1,
      name_custody: custody.name_cli_common,
      icon: await checkLocalImage(custody.id_cli_common.toString()),
      quantity: 0,
      memo_custody: '',
      flg_need_return: true
    })
  })
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-pa-none">
        預かり品リスト作成
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtCustomerFilterSelect
            v-model:selecting="requestForm.id_customer"
            label="オーナー名 *"
            :rules="[aahValidations.validationRequired]"
            required
            autofocus
            @selected="selectingCustomer"
          />
        </div>
        <div class="col-3" v-show="isPet">
          <MtPetFilterSelect
            ref="petFilterRef"
            v-model:selecting="requestForm.id_pet"
            :pet-list="petList"
            label="対象ペット名"
            :tabindex="2"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtFormInputDate
            label="預かり日 *"
            v-model:date="requestForm.date_custody_receive"
            required
            :rules="[aahValidations.validationRequired]"
            class="q-pb-none"
            :tabindex="3"
            @update:date="clickDateCustodyRecive"
          ></MtFormInputDate>
        </div>
        <div class="col-3">
          <MtFormInputDate
            v-model="requestForm.date_custody_return_plan"
            label="返却予定日"
            :options="returnDateOptions"
            :tabindex="4"
            @update:date="clickDateCustodyReturnPlan"
          ></MtFormInputDate>
        </div>
        <div class="col-3">
          <InputEmployeeOptGroup
            v-model:selected="requestForm.id_employee_custody"
            label="預かり担当者*"
            required
            :rules="[aahValidations.validationRequired]"
            show-select-default-employee
            clearable
            :tabindex="5"
            department-selected=""
            @update:select-default-employee="selectDefaultEmployee"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-my-xl">
        <div
          class="col-2 q-pa-xs q-mb-xl"
          v-for="(custody, index) in filteredCustodyItems"
          :key="index"
        >
          <div class="column items-center">
            <div class="name q-mb-md bg-grey-100 body2 text-grey-600 q-pa-xs">
              {{ custody.name_custody }}
            </div>

            <q-btn flat round tabindex="0">
              <q-avatar size="50px">
                <img
                  :src="custody.icon"
                  @click="increaseDescrease(index, 'increase')"
                />
              </q-avatar>
            </q-btn>
            <div class="flex items-center q-mt-md">
              <q-icon
                :size="$q.screen.lt.md ? '20px' : '30px'"
                name="remove"
                class="q-mr-sm cursor-pointer"
                @click="increaseDescrease(index, 'decrease')"
              />
              <div>
                <MtInputForm
                  type="text"
                  label=""
                  v-model="custody.quantity"
                  dense
                  outlined
                  square
                  item-aligned
                  class="q-mr-sm qty"
                  :tabindex="index + 6"
                />
              </div>
              <q-icon
                :size="$q.screen.lt.md ? '20px' : '30px'"
                name="add"
                class="cursor-pointer"
                @click="increaseDescrease(index, 'increase')"
              />
            </div>
          </div>
        </div>
      </div>

      <div class="row q-my-xl justify-center modal-btn">
        <q-btn
          unelevated
          color="primary"
          class="q-ml-md"
          type="button"
          :tabindex="custodyItems.length + 6"
          @click="addItem"
        >
          <span>リストに追加</span>
        </q-btn>
      </div>

      <div class="q-my-sm" v-if="addedItems.length">
        <q-markup-table separator="none" flat class="custody-item-table">
          <thead>
            <tr>
              <th class="text-left">預かり品名</th>
              <th class="text-left">数量</th>
              <th class="text-left">返却必要</th>
              <th class="text-left">メモ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in addedItems" :key="i">
              <td class="text-left">{{ item.name_custody }}</td>
              <td class="text-left q-pl-none">
                <MtInputForm
                  type="text"
                  dense
                  outlined
                  square
                  item-aligned
                  class="qty"
                  v-model="item.quantity"
                />
              </td>
              <td class="text-left">
                <MtInputForm
                  type="checkbox"
                  :items="[{ label: '' }]"
                  v-model="item.flg_need_return"
                />
              </td>
              <td class="text-left">
                <MtInputForm
                  type="text"
                  dense
                  outlined
                  square
                  item-aligned
                  class=""
                  v-model="item.memo_custody"
                  autogrow
                />
              </td>
              <td>
                <q-btn
                  unelevated
                  rounded
                  color="primary"
                  class="q-ml-md-"
                  type="button"
                  padding="3px"
                  @click="removeItem(i, item.type_custody_item)"
                >
                  <q-icon name="highlight_off" size="20px" />
                </q-btn>
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal">
          <span>閉じる</span>
        </q-btn>
        <q-btn
          unelevated
          class="q-ml-md"
          color="primary"
          type="submit"
          :disable="!addedItems.length"
        >
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.custody-item-table {
  thead {
    td {
      padding-bottom: 0px;
    }
  }
  tbody {
    td {
      background-color: $grey-050 !important;
    }
  }
}
</style>
