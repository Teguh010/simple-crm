<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import mtUtils from '@/utils/mtUtils'
import aahMessages from '@/utils/aahMessages'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useStatusStore from '@/stores/status'
import useRequestStatus from '@/stores/request-statuses'
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import OptionModal from '@/components/OptionModal.vue'
import ViewPetDetailModal from '@/pages/master/customerPet/ViewPetDetailModal.vue'
import InputEmployeeOptGroup from '@/components/form/InputEmployeeOptGroup.vue'
import {
  concatenate,
  dateFormat,
  getFullPetNameWithoutHonorific,
  getPetKanaName
} from '@/utils/aahUtils'
import _, { groupBy } from 'lodash'
import { typeCategoryChild, typeCategoryParent } from '@/utils/enum'
import dayjs from 'dayjs'
import isToday from 'dayjs/plugin/isToday'
import { event_bus } from '@/utils/eventBus'
import useTextTemplateStore from '@/stores/text-template'
import { storeToRefs } from 'pinia'
import AddTextTemplateModal from '@/pages/task/AddTextTemplateModal.vue'
import useRequestStore from '@/stores/requests'
import useCommonStore from '@/stores/common'
import UpdateCustomerModal from '@/pages/master/customerPet/UpdateCustomerModal.vue'
import selectOptions from '@/utils/selectOptions'

dayjs.extend(isToday)

const requestStatusStore = useRequestStatus()
const statusStore = useStatusStore()
const employeeStore = useEmployeeStore()
const customerStore = useCustomerStore()
const templateStore = useTextTemplateStore()
const requestStore = useRequestStore()
const commonStore = useCommonStore()

const { getTemplates } = storeToRefs(templateStore)
const { getCommonTypeCustomerColorList } = storeToRefs(commonStore)

const props = withDefaults(
  defineProps<{
    request: any
    isNew: boolean
    selectedPet: string
    updatedFlg: {
      value: boolean
    }
    statusData: any
    selectedCustomer: string
    typeCategoryParent: any
  }>(),
  {
    isNew: true,
    selectedPet: '',
    updatedFlg: () => {
      return {
        value: false
      }
    },
    statusData: [],
    selectedCustomer: '',
    typeCategoryParent: null
  }
)
const emits = defineEmits(['close'])
const isEdit = ref(!props.isNew)

const statusListDefault: any = reactive([])
const statusListCopy: any = ref([])
const petName = ref('')
const kanaName = ref('')
const time = ref('10:56')
const proxyTime = ref('10:56')
const numberRequest = ref('')
const dateRequestStart = ref('')
const dateRequestEnd = ref('')
const codePet = ref('')

const addTemplateModal = ref(false)
const memoTemplates = ref<TextTemplateType[]>([])

const statusFormList = ref({
  id_pet: props.selectedPet,
  id_status: null,
  id_employee_staff: null,
  memo_status: '',
  id_request: props.request?.id_request,
  id_customer: props.request?.id_customer,
  name_status: props.statusData?.status?.name_status,
  id_clinic: JSON.parse(localStorage.getItem('id_clinic')),
  datetime_check_in: '',
  datetime_cart: '',
  id_req_status: null
})

const customerDetail = computed(() => {
  let icon = ''
  const customer = customerStore.getAllCustomers.find((cust) => {
    return cust.value === props.selectedCustomer
  })

  if (customer?.type_customer_color) {
    icon = getCommonTypeCustomerColorList.value.find(
      (v: any) => v.code_func1 === customer.type_customer_color.toString()
    )?.text1
  }

  return {
    label: `${customer?.code_customer} ${customer?.name_customer_display}`,
    icon
  }
})

const save = async () => {
  if (isEdit.value) {
    const payload = { ...statusFormList.value }
    if (payload.datetime_cart)
      payload.datetime_cart = dateFormat(
        payload.datetime_cart,
        'YYYY/MM/DD HH:mm:ss'
      )
    if (payload.datetime_check_in)
      payload.datetime_check_in = dateFormat(
        payload.datetime_check_in,
        'YYYY/MM/DD HH:mm:ss'
      )

    requestStatusStore
      .updateRequestStatuses(statusFormList.value.id_req_status, payload)
      .then(async () => {
        await mtUtils.autoCloseAlert(aahMessages.success)
        props.updatedFlg.value = true
        closeModal()
      })
  } else {
    let payload = {
      statuses: [statusFormList.value]
    }
    requestStatusStore.submitRequestStatuses(payload).then(async () => {
      props.updatedFlg.value = false
      closeModal()
      await mtUtils.autoCloseAlert(aahMessages.success)
    })
  }
}

const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除 ',
      name: 'delete',
      isChanged: false,
      attr: { class: null, clickable: true }
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
            await requestStatusStore.destroyRequestStatuses(
              props.statusData.id_req_status
            )
            closeModal()
            mtUtils.autoCloseAlert(aahMessages.success)
          }
        })
    }
  }
}
const closeModal = () => {
  event_bus.emit('refresh-status-board')
  emits('close')
}

const openPetDetailModal = async () => {
  await mtUtils.popup(ViewPetDetailModal, {
    id_pet: props.selectedPet,
    id_customer: props.selectedCustomer,
    id_request: props.request?.id_request
  })
}

const openCustomerDetail = async () => {
  await customerStore.selectCustomer(props.selectedCustomer)
  const data = customerStore.getCustomer
  await mtUtils.popup(UpdateCustomerModal, { data })
}

const getCategoriesName = (parentCat: any, childCat: any) => {
  let parentCatName = typeCategoryParent.find(
    (i) => i.value === parentCat
  )?.label
  let childCatName = typeCategoryChild.find((i) => i.value === childCat)?.label

  return `${
    childCatName ? concatenate(parentCatName, '/', childCatName) : parentCatName
  }`
}

const calculatePassedTime = (date: string) => {
  const today = dayjs()
  const isToday = dayjs(date).isToday()

  if (isToday) {
    const diff = today.diff(date, 'minute')

    // if more than one hour
    if (diff > 60) {
      const hour = diff / 60
      const minute = diff - 60 * Math.floor(hour)
      // return `${dayjs().format('MM/DD')} 経過： ${Math.floor(
      return `経過： ${Math.floor(hour)}h ${minute}m`
    }

    // if less than one hour
    if (diff > 0 && diff < 60) {
      // return `${dayjs().format('MM/DD')} 経： ${diff}分`
      return `経過： ${diff}m`
    }

    // if the schedule is ahead of current time
    if (diff < 0) {
      const aheadTime = dayjs(date).format('H:MM')
      return `予定: ${aheadTime}`
    }
  }

  return dayjs(date).format('M/DD')
}

const displayCheckInTime = (date: string) => {
  const isToday = dayjs(date).isToday()

  if (isToday) {
    // if datetime check in == today, parse it to HH:MM format
    return `受付: ${dayjs(date).format('HH:mm')}`
  }

  // if datetime check in != today, parse it to YYYY/MM/DD HH:MM format
  return `受付: ${dayjs(date).format('M/DD HH:MM')}`
}

const displayCartTime = (date: string) => {
  const isToday = dayjs(date).isToday()

  if (isToday) {
    // if datetime cart == today, parse it to HH:MM format
    return `会計: ${dayjs(date).format('HH:MM')}`
  }

  // if datetime cart != today, parse it to YYYY/MM/DD HH:MM format
  return `会計: ${dayjs(date).format('M/DD HH:MM')}`
}

const updateProxy = () => {
  proxyTime.value = time.value
}

const saveCheckInTime = () => {
  time.value = proxyTime.value
  const [hour, minute] = time.value.split(':')
  const newCheckInTime = dayjs()
    .set('hour', parseInt(hour))
    .set('minute', parseInt(minute))
    .set('second', 0)
    .format('YYYY/MM/DD HH:mm:ss')
  statusFormList.value.datetime_check_in = newCheckInTime
  calculatePassedTime(statusFormList.value.datetime_check_in)
}

const saveCartTime = () => {
  time.value = proxyTime.value
  const [hour, minute] = time.value.split(':')
  const newCartTime = dayjs()
    .set('hour', parseInt(hour))
    .set('minute', parseInt(minute))
    .set('second', 0)
    .format('YYYY/MM/DD HH:mm:ss')
  statusFormList.value.datetime_cart = newCartTime
  calculatePassedTime(statusFormList.value.datetime_cart)
}

const openAddTextTemplateModal = async () => {
  await templateStore.fetchTemplates({ type_text_template: 12 })

  memoTemplates.value = getTemplates.value
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
  statusFormList.value.memo_status = `${statusFormList.value.memo_status} ${value}`
}

const copyStatus = async (value: string) => {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'req_statuses-copy',
    {
      id_req_status: props.statusData.id_req_status
    }
  )

  if (response) {
    await mtUtils.autoCloseAlert(
      'ステータスを複製しました！\nこのまま編集し保存してください。'
    )

    await requestStatusStore.fetchRequestStatusesById(response.id_req_status)
    if (requestStatusStore.getRequestStatus) {
      statusFormList.value = { ...requestStatusStore.getRequestStatus }
      statusFormList.value.name_status =
        requestStatusStore.getRequestStatus?.status.name_status
    }

    return
  }

  if (!response) {
    await mtUtils.autoCloseAlert('Error')
  }
  closeModal()
}

const copyRQ = async () => {
  try {
    const url = `${window.location.origin}/SearchRequestList/${props.request.id_request}?code_pet=${codePet.value}`
    await navigator.clipboard.writeText(url)
    mtUtils.autoCloseAlert('RQページのURLをコピーしました')
  } catch (e) {
    mtUtils.autoCloseAlert('URLコピーに失敗しました。')
  }
}

const displayRequestDate = (dateStart: string, dateEnd: string) => {
  if (!dateStart && !dateEnd) {
    return ''
  }

  if (dayjs(dateStart).isSame(dayjs(dateEnd))) {
    return dayjs(dateStart).format('MM/DD')
  }

  return `${dayjs(dateStart).format('MM/DD')} ~ ${dayjs(dateEnd).format(
    'MM/DD'
  )}`
}

onMounted(async () => {
  statusListDefault.length = 0

  const [req] = await mtUtils.promiseAllWithLoader([
    requestStore.fetchRequest(props.request.id_request),
    statusStore.fetchStatuses(),
    employeeStore.fetchPreparationEmployees()
  ])

  if (isEdit.value) {
    await requestStatusStore.fetchRequestStatusesById(
      props.statusData.id_req_status
    )
    if (requestStatusStore.getRequestStatus) {
      statusFormList.value = { ...requestStatusStore.getRequestStatus }
      statusFormList.value.name_status =
        requestStatusStore.getRequestStatus?.status.name_status
    }
  } else {
    statusFormList.value.id_employee_staff =
      props.request?.id_employee_doctor ??
      props.request.id_employee_staff ??
      null
  }

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
        value: _.uniqueId(),
        parentCat: groupHeaderFirstRow.parentCate,
        childCat: groupHeaderFirstRow.childCat,
        isHeader: true
      }
      statusListDefault.push(groupHeader)
      statusListDefault.push(...groupedArray[key])
    }
  }

  statusListCopy.value = [...statusListDefault]

  await customerStore.selectCustomer(props.selectedCustomer)
  let pet: any = customerStore.getCustomer.pets.find(
    (i) => i.id_pet === props.selectedPet
  )

  petName.value = `${
    customerStore.getCustomer?.code_customer
  } ${getFullPetNameWithoutHonorific(pet, customerStore.getCustomer)}`

  kanaName.value = getPetKanaName(pet, customerStore.getCustomer) ?? ''

  time.value = dayjs(props.statusData.datetime_check_in).format('HH:mm')
  proxyTime.value = dayjs(props.statusData.datetime_check_in).format('HH:mm')
  statusFormList.value.datetime_check_in = props.statusData.datetime_check_in
  statusFormList.value.datetime_cart = props.statusData.datetime_cart
  if (req) {
    numberRequest.value = req.data.data.number_request
    dateRequestStart.value = req.data.data.date_request_start
    dateRequestEnd.value = req.data.data.date_request_goal
  }

  if (pet) {
    codePet.value = pet.code_pet
  }
})
</script>

<template>
  <q-form @submit="save">
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        リクエストステータス
      </q-toolbar-title>
      <q-btn round flat @click="openMenu" class="q-mx-sm">
        <q-icon size="xs" name="more_horiz" />
      </q-btn>
    </MtModalHeader>
    <q-card-section class="content">
      <div class="q-mb-lg">
        <div class="row q-col-gutter-md">
          <div class="col-auto">
            <div class="flex items-center gap-1 q-mb-sm">
              <span>{{ numberRequest }}</span>
              <q-btn
                unelevated
                size="sm"
                icon="content_copy"
                round
                @click="copyRQ"
              ></q-btn>
              <span>{{
                displayRequestDate(dateRequestStart, dateRequestEnd)
              }}</span>
            </div>
          </div>
          <q-space />
          <div class="col-auto">
            <q-btn
              class="text-black q-ml-lg"
              size="sm"
              outline
              text-color="white"
              @click="copyStatus"
            >
              ステータスの複製
            </q-btn>
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <div
              @click="openCustomerDetail"
              class="flex items-center gap-1 q-mb-sm cursor-pointer"
            >
              <span class="caption2">
                {{ customerDetail.label }}
              </span>
              <q-icon
                v-if="customerDetail.icon"
                size="8px"
                name="circle"
                class="q-mt-xs"
                :color="customerDetail.icon"
              />
            </div>
            <div class="flex items-center gap-3">
              <q-btn
                flat
                class="bg-accent-200 text-grey-900"
                @click="openPetDetailModal"
              >
                <div class="flex column gap-1">
                  <span class="caption2 text-right">{{ kanaName }}</span>
                  <span>
                    {{ petName }}
                  </span>
                </div>
              </q-btn>
              <!-- datetime check in -->
              <div class="flex column" v-if="statusFormList.datetime_check_in">
                <span>
                  {{ displayCheckInTime(statusFormList.datetime_check_in) }}
                </span>
                <span class="caption1 bold text-grey-800">
                  {{ calculatePassedTime(statusFormList.datetime_check_in) }}
                  <q-btn flat icon="schedule" round size="sm">
                    <q-popup-proxy
                      @before-show="updateProxy"
                      cover
                      transition-show="scale"
                      transition-hide="scale"
                    >
                      <q-time v-model="proxyTime" format24h>
                        <div class="row items-center justify-end q-gutter-sm">
                          <q-btn
                            label="閉じる"
                            color="primary"
                            flat
                            v-close-popup
                          />
                          <q-btn
                            label="更新"
                            color="primary"
                            flat
                            @click="saveCheckInTime"
                            v-close-popup
                          />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-btn>
                </span>
              </div>
              <!-- datetime cart -->
              <div
                class="flex column"
                v-if="
                  props.typeCategoryParent === 21 &&
                  statusFormList.datetime_cart
                "
              >
                <span>
                  {{
                    statusFormList.datetime_cart
                      ? displayCartTime(statusFormList.datetime_cart)
                      : '--'
                  }}
                </span>
                <span class="caption1 bold text-grey-800">
                  {{
                    statusFormList.datetime_cart
                      ? calculatePassedTime(statusFormList.datetime_cart)
                      : '--'
                  }}
                  <q-btn flat icon="schedule" round size="sm">
                    <q-popup-proxy
                      cover
                      transition-hide="scale"
                      transition-show="scale"
                      @before-show="updateProxy"
                    >
                      <q-time v-model="proxyTime" format24h>
                        <div class="row items-center justify-end q-gutter-sm">
                          <q-btn
                            v-close-popup
                            color="primary"
                            flat
                            label="キャンセル"
                          />
                          <q-btn
                            v-close-popup
                            color="primary"
                            flat
                            label="更新"
                            @click="saveCartTime"
                          />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-btn>
                </span>
              </div>
              <div
                class="flex column"
                v-if="statusFormList.datetime_status_changed"
              >
                <span class="caption1 q-mb-xs">ｽﾃｰﾀｽ更新後</span>
                <span class="caption1 bold text-grey-800">
                  {{
                    calculatePassedTime(statusFormList.datetime_status_changed)
                  }}
                </span>
              </div>
            </div>
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <MtFilterSelect
              v-model:options="statusListCopy"
              label="ステータス"
              v-model:selecting="statusFormList.name_status"
              :options-default="statusListDefault"
              :optionSlot="true"
              @update:selecting="
                (value) => {
                  statusFormList.id_status = value
                }
              "
            >
              <template v-slot:option="{ scope }">
                <q-item
                  :dense="scope.opt.isHeader"
                  v-bind="scope.itemProps"
                  :key="scope.opt.value"
                >
                  <small
                    class="text-grey-600"
                    style="line-height: 25px"
                    v-if="scope.opt.isHeader"
                    >{{ scope.opt.label }}</small
                  >
                  <q-item-section v-else>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </MtFilterSelect>
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12">
            <InputEmployeeOptGroup
              v-model="statusFormList.id_employee_staff"
              label="担当者"
            />
          </div>
          <div class="col-lg-12 col-md-12 col-sm-12 q-mb-lg">
            <MtInputForm
              type="text"
              autogrow
              v-model="statusFormList.memo_status"
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
    :data="statusFormList"
    :single-option="true"
    @update:memo="handleUpdateMemo"
  />
</template>
