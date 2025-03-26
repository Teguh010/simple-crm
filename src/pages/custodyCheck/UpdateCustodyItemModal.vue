<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import aahValidations from '@/utils/aahValidations'
import MtInputForm from '@/components/form/MtInputForm.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import useCustomerStore from '@/stores/customers'
import useCustodyCheckListsStore from '@/stores/custody-checklists'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtCustomerFilterSelect from '@/components/form/MtCustomerFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import OptionModal from '@/components/OptionModal.vue'
import { concatenate, dateDifferences, formatDateTime } from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import { CustodyChecklistType } from '@/types/types'
import useEmployeeStore from '@/stores/employees'
import usePetStore from '@/stores/pets'

const emits = defineEmits(['close'])
const props = defineProps<{
  info: CustodyChecklistType
}>()

const petStore = usePetStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const custodyCheckListsStore = useCustodyCheckListsStore()
const { getCustodyCheckLists, getCustodyCheckList } = storeToRefs(
  custodyCheckListsStore
)
const { getCustomerOption } = storeToRefs(customerStore)
const { getEmployees } = storeToRefs(employeeStore)
const { getPets } = storeToRefs(petStore)

let custodyForm = reactive({
  id_custody_checklist: '',
  id_customer: 0,
  id_pet: 0,
  date_custody_receive: '',
  date_custody_return_plan: null,
  id_employee_custody: '',
  name_custody: '',
  quantity: 0,
  flg_need_return: false,
  flg_custody_returned: false,
  date_custody_return_result: '',
  memo_custody: ''
})
const customerList = ref([])
const customerListDefault = reactive([])
const isPet = ref(false)
const petList: any = ref([])
const petListDefault: any = reactive([])
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))

const closeModal = () => {
  emits('close')
}
function assignPageData(data: CustodyChecklistType) {
  if (data) {
    for (let key in data) {
      custodyForm[key as keyof CustodyChecklistType] = data[key as keyof CustodyChecklistType]
    }
  }
  custodyForm.id_employee_custody = getEmployees.value.find((emp) => {
    return emp.login_id === custodyForm.id_employee_custody
  })?.id_employee
  custodyForm.id_pet = Number(custodyForm.id_pet.toString().match(/\((\d+)\)/)?.[1]) ?? 0;
}

const submit = async () => {
  let id = custodyForm.id_custody_checklist
  if (custodyForm.date_custody_return_plan != null) {
    const date1 = new Date(custodyForm.date_custody_receive)
    const date2 = new Date(custodyForm.date_custody_return_plan)
    const diff = dateDifferences(date2, date1)
    if (diff < 0) {
      mtUtils.autoCloseAlert('日付を確認してください。')
      return
    }
  }
  getCustodyCheckLists.value.map((item) => {
    if (
      item.id_custody_checklist != id &&
      item.id_customer == custodyForm.id_customer &&
      item.date_custody_receive == custodyForm.date_custody_receive
    ) {
      item.date_custody_receive = custodyForm.date_custody_receive
      if (item.date_custody_return_plan == '') {
        item.date_custody_return_plan = null
      } else {
        item.date_custody_return_plan = formatDateTime(
          item.date_custody_return_plan
        )
      }
      let _id = item.id_custody_checklist
      delete item.id_custody_checklist
      custodyCheckListsStore.updateCustodyCheckList(_id, item)
    }
  })
  delete custodyForm.id_custody_checklist
  if (custodyForm.date_custody_return_plan == '') {
    custodyForm.date_custody_return_plan = null
  } else {
    custodyForm.date_custody_return_plan = formatDateTime(
      custodyForm.date_custody_return_plan
    )
  }
  custodyCheckListsStore.updateCustodyCheckList(id, custodyForm).then(() => {
    closeModal()
    custodyCheckListsStore.fetchCustodyCheckList()
    mtUtils.autoCloseAlert(aahMessages.success)
  })
}
async function selectingCustomer(value: any, initCall = false) {
  custodyForm.id_customer = value
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
    ;(custodyForm.id_pet = null), (isPet.value = false)
    petList.value.length = 0
    petListDefault.length = 0
  }
}
function clickDateCustodyRecive(value: any) {
  if (value) {
    custodyForm.date_custody_receive = value
  }
}
function clickDateCustodyReturnPlan(value: any) {
  if (value) {
    custodyForm.date_custody_return_plan = value
  }
}
function clickDateReturn(value: any) {
  if (value) {
    custodyForm.date_custody_return_result = value
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
            custodyCheckListsStore
              .destroyCustodyCheckList(custodyForm.id_custody_checklist)
              .then(() => {
                custodyCheckListsStore.fetchCustodyCheckList()
                emits('close')
                mtUtils.autoCloseAlert(aahMessages.success)
              })
          }
        })
    }
  }
}

const selectDefaultEmployee = () => {
  custodyForm.value.id_employee_custody = defaultEmployee
}

const returnDateOptions = (date: string) => {
  return date >= custodyForm.date_custody_receive
}

onMounted(() => {
  if (props.info.id_custody_checklist) {
    assignPageData(props.info)
    // Update case
    customerList.value.length = 0
    customerListDefault.length = 0
    customerList.value = [...customerStore.getCustomerListOptions]
    customerListDefault.push(...customerStore.getCustomerListOptions)

    if (props.info.id_customer) {
      selectingCustomer(props.info.id_customer)
    }
  }
})
</script>

<template>
  <q-form @submit.prevent="submit">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold q-mt-md q-mb-sm">
        預かり品
      </q-toolbar-title>
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="q-px-md">
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtCustomerFilterSelect
            label="オーナー名 *"
            v-model:selecting="custodyForm.id_customer"
            @selected="selectingCustomer"
            required
            :rules="[aahValidations.validationRequired]"
            :disable="true"
          />
        </div>
        <div class="col-3" v-show="custodyForm.id_pet">
          <MtPetFilterSelect
            :pet-list="petList"
            v-model:selecting="custodyForm.id_pet"
            label="対象ペット名"
            :disable="true"
          />
        </div>
      </div>
      <div class="row q-col-gutter-md q-mt-md">
        <div class="col-3">
          <MtFormInputDate
            label="預かり日 *"
            v-model="custodyForm.date_custody_receive"
            @update:date="clickDateCustodyRecive"
            required
            :rules="[aahValidations.validationRequired]"
          ></MtFormInputDate>
        </div>
        <div class="col-3">
          <MtFormInputDate
            v-model="custodyForm.date_custody_return_plan"
            label="返却予定日"
            :options="returnDateOptions"
            @update:date="clickDateCustodyReturnPlan"
          ></MtFormInputDate>
        </div>
        <div class="col-3">
          <InputEmployeeOptGroup
            v-model:selected="custodyForm.id_employee_custody"
            label="預かり担当者*"
            required
            :rules="[aahValidations.validationRequired]"
            show-select-default-employee
            @update:select-default-employee="selectDefaultEmployee"
          />
        </div>
      </div>
      <div class="q-my-sm">
        <q-markup-table separator="none" flat class="custody-item-table">
          <thead>
            <tr>
              <th class="text-left">預かり品名</th>
              <th class="text-left">数量</th>
              <th class="text-left">返却必要</th>
              <th class="text-left">メモ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="text-left">{{ custodyForm.name_custody }}</td>
              <td class="text-left q-pl-none">
                <MtInputForm
                  type="text"
                  dense
                  outlined
                  square
                  item-aligned
                  class="qty"
                  v-model="custodyForm.quantity"
                />
              </td>
              <td class="text-left">
                <MtInputForm
                  v-model="custodyForm.flg_need_return"
                  type="checkbox"
                  :items="[{ label: '返却する' }]"
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
                  v-model="custodyForm.memo_custody"
                  autogrow
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
        <div class="row q-my-md">
          <MtInputForm
            type="checkbox"
            :items="[{ label: '返却済' }]"
            v-model="custodyForm.flg_custody_returned"
          />
          <MtFormInputDate
            v-if="custodyForm.flg_custody_returned"
            v-model="custodyForm.date_custody_return_result"
            label="返却予定日"
            @update:date="clickDateReturn"
          ></MtFormInputDate>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>閉じる</span>
        </q-btn>
        <q-btn unelevated color="primary" type="submit" class="q-ml-md">
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
