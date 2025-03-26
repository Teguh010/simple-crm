<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtPetFilterSelect from '@/components/form/MtPetFilterSelect.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'

import { groupBy, uniqueId } from 'lodash'
import { typeCategoryChild, typeCategoryParent } from '@/utils/enum'
import { concatenate, getDateToday } from '@/utils/aahUtils'
import mtUtils from '@/utils/mtUtils'
import { TextTemplateType, RequestStatusType } from '@/types/types'
import { storeToRefs } from 'pinia'

import useCustomerStore from '@/stores/customers'
import useTextTemplateStore from '@/stores/text-template'
import useStatusStore from '@/stores/status'
import useRequestStatus from '@/stores/request-statuses'
import useEmployeeStore from '@/stores/employees'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'

const emits = defineEmits(['close'])
const closeModal = () => emits('close')

interface Props {
  idReqStatus: number | undefined,
  data: RequestStatusType,
  callback: () => void
}
const props = withDefaults(defineProps<Props>(), {
  idReqStatus: undefined,
  data: {},
  callback: () => {}
})

const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const requestStatusStore = useRequestStatus()
const statusStore = useStatusStore()
const templateStore = useTextTemplateStore()
const { getCustomer } = storeToRefs(customerStore)

const customerList = ref([])
const customerListDefault = reactive([])
const statusListCopy = ref([])
const statusListDefault = reactive([])

const addTemplateModal = ref(false)
const memoTemplates = ref<TextTemplateType[]>([])

const petList = ref([]),
  petListKey = ref(0)

const isEdit = ref(false)

const requestStatusForm = reactive({
  id_customer: '',
  id_employee_staff: '',
  id_status: '',
  name_status: '',
  memo_status: '',
  id_pet: '',
  datetime_req_status: getDateToday()
})

const getCategoriesName = (parentCat: any, childCat: any) => {
  let parentCatName = typeCategoryParent.find(
    (i) => i.value === parentCat
  )?.label
  let childCatName = typeCategoryChild.find((i) => i.value === childCat)?.label

  return `${
    childCatName ? concatenate(parentCatName, '/', childCatName) : parentCatName
  }`
}

const openAddTextTemplateModal = async () => {
  await templateStore.fetchTemplates({ type_text_template: 12 })

  memoTemplates.value = templateStore.getTemplates
    .filter((template) => {
      return template.type_text_template === 12
    })
    .map((template: any) => {
      return {
        title: template.memo_template,
        flg_title: template.flg_title,
        attr: {
          class: template.flg_title ? 'bg-grey-300' : ''
        },
        isSelected: false
      }
    })

  addTemplateModal.value = true
}

const handleUpdateMemo = (value: string) => {
  requestStatusForm.memo_status = `${requestStatusForm.memo_status} ${value}`
}

const save = async () => {
  if (requestStatusForm.datetime_req_status && requestStatusForm.datetime_req_status.length == 10) {
    requestStatusForm.datetime_req_status = requestStatusForm.datetime_req_status + ' 00:00:00'
  }
  
  if(props.idReqStatus) {
    requestStatusStore.updateRequestStatuses(props.idReqStatus, requestStatusForm).then(async () => {
      closeModal()
      await mtUtils.autoCloseAlert(aahMessages.success)
    })
  } 
  else {
    let payload = {
      statuses: [requestStatusForm]
    }
    requestStatusStore.submitRequestStatuses(payload).then(async () => {
      props.callback(true)
      closeModal()
      await mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const updatePetOptions = async (idCustomer: number) => {
  requestStatusForm.id_pet = null
  await customerStore.selectCustomer(idCustomer)
  petList.value.length = 0
  if (getCustomer.value?.pets?.length > 0) {
    petList.value.push(...getCustomer.value?.pets.filter((pet) => !(pet.flg_unlist)))
    const firstPet = petList.value[0]
    requestStatusForm.id_pet = firstPet?.value
  }
  ++petListKey.value
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
        .then(async (confirmation) => {
          if (confirmation) {
            await requestStatusStore.destroyRequestStatuses(props.idReqStatus)
            closeModal()
          }
      })
    }
  }
}

onMounted(async () => {

  await mtUtils.promiseAllWithLoader([
    statusStore.fetchStatuses(),
    employeeStore.fetchPreparationEmployees()
  ])

  let groupedArray = []
  statusStore.getStatuses.map((statusObj: any) => {
    groupedArray.push({
      label: statusObj.name_status,
      value: statusObj.id_status,
      parentCat: statusObj.type_category_parent,
      childCat: statusObj.type_category_child
    })
  })

  groupedArray = groupBy(
    groupedArray.filter((item) => item.parentCat && item.childCat),
    (item) => item.parentCat + item.childCat
  )

  for (let key in groupedArray) {
    const groupHeaderFirstRow = groupedArray[key][0]
    if (groupHeaderFirstRow) {
      const groupHeader = {
        label: getCategoriesName(
          groupHeaderFirstRow.parentCat,
          groupHeaderFirstRow.childCat
        ),
        value: '!@#$%^&*()',
        parentCat: groupHeaderFirstRow.parentCate,
        childCat: groupHeaderFirstRow.childCat,
        isHeader: true,
        disable: true
      }
      statusListDefault.push(groupHeader)
      statusListDefault.push(...groupedArray[key])
    }
  }

  statusListCopy.value = [...statusListDefault]

  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  if(props.idReqStatus) {
    isEdit.value = true
    petList.value.length = 0
    const { data } = props
    requestStatusForm.id_customer = data.statusObj.customer.id_customer
    requestStatusForm.id_pet = data.statusObj.pet.id_pet
    requestStatusForm.memo_status = data.statusObj.memo_status
    requestStatusForm.id_status = String(data.statusObj.id_status)
    requestStatusForm.datetime_req_status = data.statusObj.datetime_req_status
    requestStatusForm.id_employee_staff = data.statusObj.id_employee_staff
    petList.value.push(...getCustomer.value?.pets.filter((pet) => !(pet.flg_unlist)))
    requestStatusForm.datetime_req_status = data.statusObj.datetime_req_status
    requestStatusForm.id_employee_staff = data.statusObj.id_employee_staff
    ++petListKey.value
  }
  else {
    const firstStatus = statusListDefault.find((status) => !status.disable)
    requestStatusForm.id_status = firstStatus.value
  }
})
</script>
<template>
  <q-form @submit="save">
     <MtModalHeader @closeModal="closeModal">
       <q-toolbar-title
          class="row no-wrap items-center text-grey-900 title2 bold"
        >
          ステ－タス
        </q-toolbar-title>
        <q-btn v-if="isEdit" round flat @click="openMenu" class="q-mx-sm">
          <q-icon size="xs" name="more_horiz" />
        </q-btn>
      </MtModalHeader>
      <q-card-section class="content">
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <MtFilterSelect label="診察券番号 " 
              v-model:selecting="requestStatusForm.id_customer" v-model:options="customerList"
              :options-default="customerListDefault" :disable="disable_customer" autofocus custom-option
              @update:selecting="updatePetOptions"
              :rules="[(val: string) => !!val || '入力必須項目です']">
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
                    <q-icon v-if="slotProps.opt.icon" name="circle" size="16px" :color="slotProps.opt.icon"
                    :style="{ color: slotProps.opt.icon }" />
                  </div>
                  </q-item-section>
                </q-item>
              </template>
            </MtFilterSelect>
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <MtPetFilterSelect
              v-model:selecting="requestStatusForm.id_pet"
              :pet-list="petList"
              label="ペット名"
              :key="petListKey"
            />
        </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <MtFilterSelect
              v-model:options="statusListCopy"
              label="ステータス"
              v-model:selecting="requestStatusForm.id_status"
              :options-default="statusListDefault"
              :optionSlot="true"
            >
              <template v-slot:option="{ scope }">
                <q-item
                  dense
                  v-bind="scope.itemProps"
                  v-if="scope.opt.isHeader"
                >
                  <small
                    class="text-grey-600"
                    style="line-height: 25px"
                    >{{ scope.opt.label }}</small
                  >
                </q-item>
                <q-item
                  v-else
                  v-bind="scope.itemProps"
                >
                  <q-item-label>
                    {{ scope.opt.label }}
                  </q-item-label>
                </q-item>
              </template>
            </MtFilterSelect>
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <InputEmployeeOptGroup
              v-model="requestStatusForm.id_employee_staff"
              label="担当者"
            />
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12 q-mb-lg">
            <MtInputForm
              type="text"
              autogrow
              v-model="requestStatusForm.memo_status"
              label="ステータスメモ"
              required
            >
              <template #append>
                <q-icon
                  name="add"
                  class="cursor-pointer"
                  @click="openAddTextTemplateModal"
                />
              </template>
            </MtInputForm>
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <MtFormInputDate
              v-model:date="requestStatusForm.datetime_req_status"
              label="実施日"
            />
          </div>
        </div>
      </q-card-section>
      <q-card-section class="q-bt bg-white">
        <div class="text-center modal-btn">
          <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
            <span>キャンセル</span>
          </q-btn>
          <q-btn type="submit" unelevated color="primary" class="q-ml-md">
            <span>保存</span>
          </q-btn>
        </div>
      </q-card-section>
  </q-form>
  <AddTextTemplateModal
    v-model:value="addTemplateModal"
    modelTitle="リクエストステータス "
    :options="memoTemplates"
    :data="requestStatusForm"
    :single-option="true"
    @update:memo="handleUpdateMemo"
  />
</template>