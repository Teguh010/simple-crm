<script setup lang="ts">
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import ServiceDetailPocketList from '@/components/PocketList/ServiceDetailPocketList.vue'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import MtFormInputText from '@/components/form/MtFormInputText.vue'
import MtFormMultipleSelection from '@/components/form/MtFormMultipleSelection.vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import useCliCommonStore from '@/stores/cli-common'
import useCustomerStore from '@/stores/customers'
import useIllnessHistoryStore from '@/stores/illness-history'
import usePetBioStore from '@/stores/pet-bios'
import useRequestStore from '@/stores/requests'
import { CliCommon, IllnessHistoryType, PetType, RequestType } from '@/types/types'
import { concatenate, convertWeightToG, formatDate, getDateToday, updateBtnLabel } from '@/utils/aahUtils'
import aahValidations from '@/utils/aahValidations'
import { typeBodyWeight } from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import selectOptions from '@/utils/selectOptions'
import useEmployeeStore from '@/stores/employees'
import aahMessages from '@/utils/aahMessages'
import { sortBy } from 'lodash'

const customerStore = useCustomerStore()
const requestStore = useRequestStore()
const petBioStore = usePetBioStore()
const cliCommonStore = useCliCommonStore()
const illnessHistoryStore = useIllnessHistoryStore()
const employeeStore = useEmployeeStore()

const router = useRouter()
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }
const props = defineProps({

})

const typeMemoCarteList = ref([])
const customerList = ref([])
const customerListDefault = reactive([])
const petList = ref([])
const requestDetailList = ref([])
const cartDetailList = ref([])
const page = ref(1)
const targetRef = ref()
const foreColor = ref('#ffff00')

const selectedItemsAll = ref({
  sd_list: [],
  pd_list: [],
  in_list: []
})
const requestForm = ref({
  id_customer: null,
  id_pet: null,
  val_weight: null,
  typeRequest: '1',
  id_pet_bio_info: null,
})
const memoCarteForm = ref({
  id_cli_common: '',
  id_pet_illness_history: [],
  memo_other: '',
})

const colorClicked = () => {
  const edit = targetRef.value
  edit.runCmd('foreColor', foreColor.value)
  edit.focus()
}

const typeBodyWeightName = (value: number) => typeBodyWeight.find((v) => v.value === value)?.label

const openRQDetailPage = (request: RequestType) => {
  window.open(`/SearchRequestList/${request.id_request}`, '_blank')
}
const selectingCustomer = async (value: number) => {
  if (value) {
    await mtUtils.promiseAllWithLoader([customerStore.selectCustomerOptions(value)])
    
    let selectedCustomer = customerStore.getCustomerOption
    if (selectedCustomer) {
      if (
        selectedCustomer.pets &&
        selectedCustomer.pets.length &&
        selectedCustomer.pets.length > 0
      ) {
        petList.value.length = 0
        const selectedPetList = sortBy(selectedCustomer.pets
          .filter((petObj: PetType) => !petObj.flg_unlist && !petObj.flg_deceased)
          .map((petObj: PetType) => {
            return {
              ...petObj,
              label: concatenate(
                petObj.code_pet,
                selectedCustomer.name_family,
                petObj.name_pet
              ),
              value: petObj.id_pet,
            }
          }), 'display_order')
        petList.value = selectedPetList
        requestForm.value.id_pet = selectedPetList?.[0]?.id_pet
        await selectingPet(requestForm.value.id_pet)
      }
    }
  } else {
    petList.value.length = 0
    requestForm.value.id_pet = null
  }
}
const selectingPet = async (value: number) => {
  await mtUtils.promiseAllWithLoader([
    petBioStore.fetchPetBio({
      id_pet: value,
      id_customer: requestForm.value.id_customer,
      fetch_weight: true
    }),
    illnessHistoryStore.fetchIllnessHistorys({
      id_pet: value,
      id_customer: requestForm.value?.id_customer
    })
  ])

  if (petBioStore.getPetBio) {
    requestForm.value.id_pet_bio_info = petBioStore.getPetBio?.id_pet_bio_info
    requestForm.value.val_weight = convertWeightToG(petBioStore.getPetBio?.val_weight, petBioStore.getPetBio?.type_val_weight)
  }

  await fetchRequest()
}

const checkBoxSelected = (value: boolean, methods = 'request', rq_key = -1, ph_in_key = -1, pd_id_key = -1) => {
  if (methods == 'request') {
    if (requestDetailList.value[rq_key]) {
      requestDetailList.value[rq_key].selected = value
      requestDetailList.value[rq_key].all_sd_selected = value
      requestDetailList.value[rq_key].all_ph_selected = value
      requestDetailList.value[rq_key].all_in_selected = value

      if (requestDetailList.value[rq_key].service_detail_list)
        requestDetailList.value[rq_key].service_detail_list = requestDetailList.value[rq_key].service_detail_list.map((service_detail) => ({ ...service_detail, selected: value }))
      if (requestDetailList.value[rq_key].prescription_list)
        requestDetailList.value[rq_key].prescription_list = requestDetailList.value[rq_key].prescription_list?.map((prescription) => {
          prescription.prescription_detail_list = prescription.prescription_detail_list?.map((prescription_detail) => ({ ...prescription_detail, selected: value }))
          return { ...prescription, selected: value }
        })
      if (requestDetailList.value[rq_key].inject_list_list)
        requestDetailList.value[rq_key].inject_list_list = requestDetailList.value[rq_key].inject_list_list?.map((inject) => {
          inject.inject_detail_list = inject.inject_detail_list?.map((inject_detail) => ({ ...inject_detail, selected: value }))
          return { ...inject, selected: value }
        })
      

      if (value) {
        if (requestDetailList.value[rq_key].service_detail_list)
          selectedItemsAll.value.sd_list.push(...requestDetailList.value[rq_key].service_detail_list.filter((sd) => sd.selected).map((service_detail) => (service_detail.id_service_detail)))
        if (requestDetailList.value[rq_key].prescription_list)
          requestDetailList.value[rq_key].prescription_list?.forEach((prescription) => {
            selectedItemsAll.value.pd_list.push(...prescription.prescription_detail_list?.filter((pd) => pd.selected).map((prescription_detail) => (prescription_detail.id_prescription_detail)))
          })
        if (requestDetailList.value[rq_key].inject_list_list)
          requestDetailList.value[rq_key].inject_list_list?.forEach((inject) => {
            selectedItemsAll.value.ind_list.push(...inject.inject_detail_list?.filter((ind) => ind.selected).map((inject_detail) => (inject_detail.id_inject_detail)))
          })
      } else {
        if (requestDetailList.value[rq_key].service_detail_list)
          selectedItemsAll.value.sd_list = selectedItemsAll.value.sd_list.filter(v => !requestDetailList.value[rq_key].service_detail_list.map((service_detail) => (service_detail.id_service_detail)).includes(v))
        if (requestDetailList.value[rq_key].prescription_list)
          requestDetailList.value[rq_key].prescription_list?.forEach((prescription) => {
            selectedItemsAll.value.pd_list = selectedItemsAll.value.pd_list.filter(v => !prescription.prescription_detail_list?.map((prescription_detail) => (prescription_detail.id_prescription_detail)).includes(v))
          })
        if (requestDetailList.value[rq_key].inject_list_list)
          requestDetailList.value[rq_key].inject_list_list?.forEach((inject) => {
            selectedItemsAll.value.ind_list = selectedItemsAll.value.ind_list.filter(v => !inject.inject_detail_list?.map((inject_detail) => (inject_detail.id_inject_detail)).includes(v))
          })
      }
    }
  } else if (methods == 'all_sd_selected') {
    if (requestDetailList.value[rq_key]) {
      if (value) requestDetailList.value[rq_key].selected = true
      requestDetailList.value[rq_key].all_sd_selected = value

      if (requestDetailList.value[rq_key].service_detail_list) {
        requestDetailList.value[rq_key].service_detail_list = requestDetailList.value[rq_key].service_detail_list.map((service_detail) => ({ ...service_detail, selected: value }))

        if (value) {
          if (selectedItemsAll.value.sd_list.find(v => v == service_detail.id_service_detail_detail))
            selectedItemsAll.value.sd_list.push(...requestDetailList.value[rq_key].service_detail_list.map((service_detail) => (service_detail.id_service_detail)))
        } else {
          selectedItemsAll.value.sd_list = selectedItemsAll.value.sd_list.filter(v => !requestDetailList.value[rq_key].service_detail_list.map((service_detail) => (service_detail.id_service_detail)).includes(v))
        }
      }

    }
  } else if (methods == 'all_ph_selected') {
    if (requestDetailList.value[rq_key]) {
      if (value) requestDetailList.value[rq_key].selected = true
      requestDetailList.value[rq_key].all_ph_selected = value

      if (requestDetailList.value[rq_key].prescription_list) {
        requestDetailList.value[rq_key].prescription_list = requestDetailList.value[rq_key].prescription_list?.map((prescription) => {
          prescription.prescription_detail_list = prescription.prescription_detail_list?.map((prescription_detail) => ({ ...prescription_detail, selected: value }))
          return { ...prescription, selected: value }
        })

        if (value) {
          if (requestDetailList.value[rq_key].prescription_list)
            requestDetailList.value[rq_key].prescription_list?.forEach((prescription) => {
              prescription.prescription_detail_list?.filter((pd) => pd.selected).forEach((pd) => {
                if (!selectedItemsAll.value.pd_list.find(v => v == pd.id_prescription_detail))
                  selectedItemsAll.value.pd_list.push(pd.id_prescription_detail)
              })
            })
        } else {
          if (requestDetailList.value[rq_key].prescription_list)
            requestDetailList.value[rq_key].prescription_list?.forEach((prescription) => {
              selectedItemsAll.value.pd_list = selectedItemsAll.value.pd_list.filter(v => !prescription.prescription_detail_list?.map((prescription_detail) => (prescription_detail.id_prescription_detail)).includes(v))
            })
        }
      }
    }
  } else if (methods == 'all_in_selected') {
    if (requestDetailList.value[rq_key]) {
      if (value) requestDetailList.value[rq_key].selected = true
      requestDetailList.value[rq_key].all_in_selected = value

      if (requestDetailList.value[rq_key].inject_list_list) {
        requestDetailList.value[rq_key].inject_list_list = requestDetailList.value[rq_key].inject_list_list?.map((inject) => {
          inject.inject_detail_list = inject.inject_detail_list?.map((inject_detail) => ({ ...inject_detail, selected: value }))
          return { ...inject, selected: value }
        })

        if (value) {
          if (requestDetailList.value[rq_key].inject_list_list)
            requestDetailList.value[rq_key].inject_list_list?.forEach((inject) => {
              inject.inject_detail_list?.filter((ind) => ind.selected).forEach((ind) => {
                if (!selectedItemsAll.value.in_list.find(v => v == ind.id_inject_detail))
                  selectedItemsAll.value.in_list.push(ind.id_inject_detail)
              })
            })
        } else {
          if (requestDetailList.value[rq_key].inject_list_list)
            requestDetailList.value[rq_key].inject_list_list?.forEach((inject) => {
              selectedItemsAll.value.in_list = selectedItemsAll.value.in_list.filter(v => !inject.inject_detail_list?.map((inject_detail) => (inject_detail.id_inject_detail)).includes(v))
            })
        }
      }
    }
  } else if (methods == 'ph_selected') {
    if (requestDetailList.value[rq_key].prescription_list) {
      if (value) {
        requestDetailList.value[rq_key].selected = true
        requestDetailList.value[rq_key].all_ph_selected = true
      }
      requestDetailList.value[rq_key].prescription_list[ph_in_key].selected = value

      if (requestDetailList.value[rq_key].prescription_list[ph_in_key]) {
        requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list = 
          requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list
          ?.map((prescription_detail) => ({ ...prescription_detail, selected: value }))

        if (value) {
          if (requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list)
            selectedItemsAll.value.pd_list.push(...requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list?.filter((pd) => pd.selected).map((prescription_detail) => (prescription_detail.id_prescription_detail)))
        } else {
          if (requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list)
            selectedItemsAll.value.pd_list = selectedItemsAll.value.pd_list.filter((v) =>
              !requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list
                ?.filter((pd) => pd.selected == false)
                .some((prescription_detail) => prescription_detail.id_prescription_detail == v)
            )
        }
      }
          
    }
  } else if (methods == 'in_selected') {
    if (requestDetailList.value[rq_key].inject_list_list) {
      if (value) {
        requestDetailList.value[rq_key].selected = true
        requestDetailList.value[rq_key].all_in_selected = true
      }
      requestDetailList.value[rq_key].inject_list_list[ph_in_key].selected = value

      if (requestDetailList.value[rq_key].inject_list_list[ph_in_key]) {
        requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list = 
          requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list
          ?.map((inject_detail) => ({ ...inject_detail, selected: value }))

        if (value) {
          if (requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list)
            selectedItemsAll.value.in_list.push(...requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list?.filter((ind) => ind.selected).map((inject_detail) => (inject_detail.id_inject_detail)))
        } else {
          if (requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list)
            selectedItemsAll.value.in_list = selectedItemsAll.value.in_list.filter((v) =>
              !requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list
                ?.filter((ind) => ind.selected == false)
                .some((inject_detail) => inject_detail.id_inject_detail == v)
            )
        }
      }
    }
  } else if (methods == 'service_detail_selected') {
    if (value) {
      requestDetailList.value[rq_key].selected = true
      // requestDetailList.value[rq_key].all_sd_selected = true

    }
    if (ph_in_key != -1) {
      if (requestDetailList.value[rq_key].service_detail_list[ph_in_key])
        requestDetailList.value[rq_key].service_detail_list[ph_in_key].selected = value

      if (value) {
        if (requestDetailList.value[rq_key].service_detail_list[ph_in_key])
          selectedItemsAll.value.sd_list.push(requestDetailList.value[rq_key].service_detail_list[ph_in_key].id_service_detail)
      } else {
        if (requestDetailList.value[rq_key].service_detail_list[ph_in_key])
          selectedItemsAll.value.sd_list = selectedItemsAll.value.sd_list.filter((v) =>
            requestDetailList.value[rq_key].service_detail_list[ph_in_key].id_service_detail != v
          )
      }
    }
  } else if (methods == 'prescription_detail_selected') {
    if (value) {
      requestDetailList.value[rq_key].selected = true
      // requestDetailList.value[rq_key].all_ph_selected = true
      if (requestDetailList.value[rq_key].prescription_list[ph_in_key]) requestDetailList.value[rq_key].prescription_list[ph_in_key].selected = true
    }
    if (pd_id_key != -1) {
      if (requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list[pd_id_key])
        requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list[pd_id_key].selected = value

      if (value) {
        if (requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list[pd_id_key])
          selectedItemsAll.value.pd_list.push(requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list[pd_id_key].id_prescription_detail)
      } else {
        if (requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list[pd_id_key])
          selectedItemsAll.value.pd_list = selectedItemsAll.value.pd_list.filter((v) =>
            requestDetailList.value[rq_key].prescription_list[ph_in_key].prescription_detail_list[pd_id_key].id_prescription_detail != v
          )
      }
    }
  } else if (methods == 'inject_detail_selected') {
    if (value) {
      requestDetailList.value[rq_key].selected = true
      // requestDetailList.value[rq_key].all_in_selected = true
      if (requestDetailList.value[rq_key].inject_list_list[ph_in_key]) requestDetailList.value[rq_key].inject_list_list[ph_in_key].selected = true
    }
    if (pd_id_key != -1) {
      if (requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list[pd_id_key])
        requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list[pd_id_key].selected = value

      if (value) {
        if (requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list[pd_id_key])
          selectedItemsAll.value.in_list.push(requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list[pd_id_key].id_inject_detail)
      } else {
        if (requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list[pd_id_key])
          selectedItemsAll.value.in_list = selectedItemsAll.value.in_list.filter((v) =>
            requestDetailList.value[rq_key].inject_list_list[ph_in_key].inject_detail_list[pd_id_key].id_inject_detail != v
          )
      }
    }
  }
}

const selectingType = async (value: string) => {
  requestDetailList.value = []
  cartDetailList.value = []
  if (value == '1')
    await fetchRequest()
  else if (value == '2')
    await fetchCart()
}

const nextPageFetchRequest = () => {
  page.value += 1
  mtUtils.autoCloseAlert('全てのデータを呼び込みました')
  // TODO: Got the next page api.
  // fetchRequest()
}

const fetchRequest = async () => {
  requestDetailList.value = []
  await requestStore.fetchRequestsByIdPet({ id_pet: requestForm.value.id_pet, page: page.value })

  requestDetailList.value = requestStore.getRequestListByPet?.map((request) => {
    request.service_detail_list = request.service_detail_list?.map((service_detail) => ({
      ...service_detail,
      selected: selectedItemsAll.value.sd_list.find((v) => v == service_detail.id_service_detail) ? true : false
    }))
    request.prescription_list = request.prescription_list?.map((prescription) => {
      prescription.prescription_detail_list = prescription.prescription_detail_list?.map((prescription_detail) => ({
        ...prescription_detail,
        selected: selectedItemsAll.value.pd_list.find((v) => v == prescription_detail.id_prescription_detail) ? true : false
      }))
      return { ...prescription, selected: false }
    })
    request.inject_list_list = request.inject_list_list?.map((inject) => {
      inject.inject_detail_list = inject.inject_detail_list?.map((inject_detail) => ({
        ...inject_detail,
        selected: selectedItemsAll.value.in_list.find((v) => v == inject_detail.id_inject_detail) ? true : false
      }))
      return { ...inject, selected: false }
    })

    return { ...request, selected: false, all_sd_selected: false, all_ph_selected: false, all_in_selected: false }
  })
}

const handleAutoRequestTitle = () => {
  // let autoTitle = ''
  const selectedEmployeeDoctor = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_doctor
  )?.label
  const selectedEmployeeStaff = employeeStore.getAllEmployees.find(
    (v: any) => v.value === requestForm?.id_employee_staff
  )?.label
  const fixedTextCustomer = requestForm.name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeStaff ? '/ 担当: ' : ''
  let autoTitle =
    (requestForm.date_request_start !== undefined
      ? requestForm.date_request_start
      : '') +
    ' ' +
    (requestForm.code_customer !== undefined ? requestForm.code_customer : '') +
    ' ' +
    (requestForm.name_customer !== undefined ? requestForm.name_customer : '') +
    (fixedTextCustomer !== undefined ? fixedTextCustomer : '') +
    ' ' +
    (selectedEmployeeDoctor !== undefined ? selectedEmployeeDoctor : '') +
    (fixedTextDoctor !== undefined ? fixedTextDoctor : '') +
    ' ' +
    (fixedTextStaff !== undefined
      ? fixedTextDoctor !== ''
        ? fixedTextStaff
        : fixedTextStaff.replace('/ ', '')
      : '') +
    (selectedEmployeeStaff !== undefined ? selectedEmployeeStaff : '')
  return autoTitle
}


const fetchCart = async () => {
  cartDetailList.value = []
  await requestStore.fetchRequestsByIdPet({ id_pet: requestForm.value.id_pet, flg_cart: true })
}

function selectedPetBioInfo(value: any) {
  if (value) {
    const pet_bio = petBioStore.getPetBioOptionDefault.find((petBioObj: any) => petBioObj.id_pet_bio_info == value)
    if (pet_bio) {
      requestForm.value.val_weight = convertWeightToG(pet_bio?.val_weight, pet_bio?.type_val_weight)
    }
  }
}

const submit = async () => {
  requestForm.value.title_request = handleAutoRequestTitle()
  requestForm.value.val_weight = convertWeightToG(petBioStore.getPetBio?.val_weight, petBioStore.getPetBio?.type_val_weight)

  const submitData = {
    date_request_start: getDateToday(),
    date_request_end: getDateToday(),
    service_detail_list: selectedItemsAll.value.sd_list,
    prescription_detail_list: selectedItemsAll.value.pd_list,
    inject_detail_list: selectedItemsAll.value.in_list,
    ...requestForm.value,
    id_employee_request: localStorage.getItem('id_employee'),
    type_input: 2
  }

  const res = await mtUtils.callApi(selectOptions.reqMethod.POST, 'quick_request', submitData)
  if (res) {
    console.log(res)
    mtUtils.autoCloseAlert(aahMessages.success)
    router.push(`/SearchRequestList/${res.id_request}`)
    closeModal()
  } else {
    mtUtils.autoCloseAlert(aahMessages.failed)
  }
}

onMounted(async () => {
  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [11] })

  customerList.value.length = 0
  customerListDefault.length = 0
  customerList.value = [...customerStore.getCustomerListOptions]
  customerListDefault.push(...customerStore.getCustomerListOptions)

  typeMemoCarteList.value = cliCommonStore.getCliCommonTypeCarteSourceList
    .map((v: CliCommon) => ({
      ...v,
      label: v.name_cli_common,
      value: v.id_cli_common
    }))
  
  memoCarteForm.value.id_cli_common = typeMemoCarteList.value[0]?.value
})
</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar class="text-primary q-pa-none">
      <q-toolbar-title class="title2 bold text-grey-900">
        クイックRQ
      </q-toolbar-title>

      <div v-if="requestForm.id_pet" class="flex justify-end">
        <MtFormRadiobtn
          @update:selected="selectingType"
          v-model:selected="requestForm.typeRequest"
          label="リクエスト"
          val="1"
        />
        <MtFormRadiobtn
          @update:selected="selectingType"
          v-model:selected="requestForm.typeRequest"
          label="会計"
          val="2"
        />
      </div>
    </q-toolbar>
  </MtModalHeader>

  <div class="q-px-md q-py-md content">
    <div class="row">
      <div class="col-3">
        <MtFilterSelect
          label="診察券番号 "
          v-model:selecting="requestForm.id_customer"
          v-model:options="customerList"
          :options-default="customerListDefault"
          autofocus
          custom-option
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
                    name="circle"
                    size="16px"
                    :color="slotProps.opt.icon"
                    :style="{ color: slotProps.opt.icon }"
                  />
                </div>
              </q-item-section>
            </q-item>
          </template>
        </MtFilterSelect>
      </div>
      <div v-if="requestForm.id_customer && petList.length > 0" class="col">
        <template v-for="pet in petList">
          <MtFormRadiobtn
            @update:selected="selectingPet"
            v-model:selected="requestForm.id_pet"
            :label="pet?.label"
            :val="pet?.value"
          />
        </template>
      </div>
    </div>
    <template v-if="requestForm.id_pet">

      <div class="row">
        <div class="col-5">
          <MtFormPullDown
            v-model:selected="requestForm.id_pet_bio_info"
            :options="petBioStore.getPetBioOptionDefault"
            label="体重"
            @update:selected="selectedPetBioInfo"
          />
        </div>
      </div>

      <template v-if="requestForm.typeRequest == '1'">
        <template v-if="requestDetailList?.length > 0" v-for="(request, rq_key) in requestDetailList">
          <div v-if="request" class="q-ba q-pa-md q-mb-md">
            <div class="row">
              <div class="col">
                <div @click="checkBoxSelected(!request.selected, 'request', rq_key)" class="cursor-pointer flex justify-between">
                  <div class="flex items-center">
                    <MtFormCheckBox
                      v-model:checked="request.selected"
                      @update:checked="checkBoxSelected($event, 'request', rq_key)"
                    />
                    {{ request.date_request_start == request.date_request_goal ? request.date_request_start : request.date_request_start + '~' + request.date_request_goal }}
                    {{ request.number_request }}
                  </div>
                  <q-btn @click.stop="openRQDetailPage(request)" class="bg-accent-300">
                    リクエストを開く
                    <q-icon name="open_in_new" class="q-pl-sm" size="14px" />
                  </q-btn>
                </div>
              </div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="row">
              <div class="col-4 q-pa-md">
                <div @click="checkBoxSelected(!request.all_sd_selected, 'all_sd_selected', rq_key)" class="cursor-pointer flex items-center">
                  <MtFormCheckBox
                    v-model:checked="request.all_sd_selected"
                    @update:checked="checkBoxSelected($event, 'all_sd_selected', rq_key)"
                  />
                  全て治療サービス
                </div>

                <div
                  v-if="request?.service_detail_list?.length > 0"
                  v-for="(service_detail, sd_key) in request?.service_detail_list"
                  class="item_divier_item_service cursor-pointer flex items-center no-wrap"
                  @click="checkBoxSelected(!service_detail.selected, 'service_detail_selected', rq_key, sd_key)"
                >
                  <MtFormCheckBox
                    v-model:checked="service_detail.selected"
                    @update:checked="checkBoxSelected($event, 'service_detail_selected', rq_key)"
                  />
                  {{ service_detail.name_item_service }}
                </div>
              </div>
              <div class="col-4 q-pa-md">
                <div @click="checkBoxSelected(!request.all_ph_selected, 'all_ph_selected', rq_key)" class="cursor-pointer flex items-center">
                  <MtFormCheckBox
                    v-model:checked="request.all_ph_selected"
                    @update:checked="checkBoxSelected($event, 'all_ph_selected', rq_key)"
                  />
                  全ての処方箋
                </div>

                <div
                  v-if="request?.prescription_list?.length > 0"
                  v-for="(prescription, ph_key) in request?.prescription_list"
                >
                  <div
                    @click="checkBoxSelected(!prescription.selected, 'ph_selected', rq_key, ph_key)"
                    class="prescription-header-btn cursor-pointer w-full flex items-center no-wrap"
                  >
                    <MtFormCheckBox
                      v-model:checked="prescription.selected"
                      @update:checked="checkBoxSelected($event, 'ph_selected', rq_key, ph_key)"
                    /> {{ prescription.title_prescription }} ({{ prescription.prescription_detail_list?.length }})
                  </div>
                  <div
                    v-if="prescription.prescription_detail_list"
                    v-for="(prescription_detail, pd_key) in prescription.prescription_detail_list"
                    class="w-full flex items-center no-wrap item_divier_prescription"
                    :class="prescription.flg_cancel ? 'cancel-notification-box' : ''"
                    @click="checkBoxSelected(!prescription_detail.selected, 'prescription_detail_selected', rq_key, ph_key, pd_key)"
                  >
                    <MtFormCheckBox
                      v-model:checked="prescription_detail.selected"
                      @update:checked="checkBoxSelected($event, 'prescription_detail_selected', rq_key, ph_key)"
                    /> {{ prescription_detail.name_prescription_display }}
                  </div>
                </div>
              </div>
              <div class="col-4 q-pa-md">
                <div @click="checkBoxSelected(!request.all_in_selected, 'all_in_selected', rq_key)" class="cursor-pointer flex items-center">
                  <MtFormCheckBox
                    v-model:checked="request.all_in_selected"
                    @update:checked="checkBoxSelected($event, 'all_in_selected', rq_key)"
                  /> 全ての注射・点滴
                </div>

                <div
                  v-if="request?.inject_list_list?.length > 0"
                  v-for="(inject, in_key) in request?.inject_list_list"
                >
                  <div
                    @click="checkBoxSelected(!inject.selected, 'in_selected', rq_key, in_key)"
                    class="inject-header-btn cursor-pointer w-full flex items-center no-wrap"
                  >
                    <MtFormCheckBox
                      v-model:checked="inject.selected"
                      @update:checked="checkBoxSelected($event, 'in_selected', rq_key, in_key)"
                    /> {{ inject.title_inject }} ({{ inject.inject_detail_list?.length }})
                  </div>
                  <div
                    v-if="inject.inject_detail_list"
                    v-for="(inject_detail, id_key) in inject.inject_detail_list"
                    class="item_divier_inject w-full flex items-center no-wrap"
                    @click="checkBoxSelected(!inject_detail.selected, 'inject_detail_selected', rq_key, in_key, id_key)"
                  >
                    <MtFormCheckBox
                      v-model:checked="inject_detail.selected"
                      @update:checked="checkBoxSelected($event, 'inject_detail_selected', rq_key, in_key)"
                    /> {{ inject_detail.name_inject_display }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="q-my-xl text-center">データがありません。</div>

        <div v-if="requestDetailList?.length > 0" class="text-center">
          <q-btn @click="nextPageFetchRequest" class="w-full">
            読み込む
          </q-btn>
        </div>
      </template>

      <template v-if="requestForm.typeRequest == '2'">
        <template v-if="cartDetailList?.length > 0" v-for="(cart, c_key) in cartDetailList">
          <div class="row">
            <div v-for="cart in 3" class="col-4">
              
            </div>
          </div>
        </template>
        <div v-else class="text-center">No cart data</div>
      </template>

      <div class="q-mt-md">
        <div class="row">
          <div class="col-3 q-pa-md">
            <MtFormPullDown
              v-model:selected="memoCarteForm.id_cli_common"
              :options="typeMemoCarteList"
              label="カルテ区分"
              custom-option
            >
              <template #selectedItem="{ slotProps }">
                <q-item-label>
                  {{ slotProps.opt.label }}
                </q-item-label>
              </template>
              <template #option="{ slotProps }">
                <q-item
                  v-bind="slotProps.itemProps"
                  :class="`bg-${slotProps.opt.text1}`"
                  :style="{
                    backgroundColor: slotProps.opt.text1.startsWith('#')
                      ? slotProps.opt.text1
                      : ''
                  }"
                >
                  <q-item-section>
                    {{ slotProps.opt.label }}
                  </q-item-section>
                </q-item>
              </template>
            </MtFormPullDown>
          </div>
          <div class="col-3 q-pa-md">
            <MtFormMultipleSelection
              :options="illnessHistoryStore.getIllnessHistorys"
              :option-label="
                (v: IllnessHistoryType): string => {
                  return v.name_disease ? v.name_disease : v.name_disease_free
                }
              "
              option-value="id_pet_illness_history"
              v-model="memoCarteForm.id_pet_illness_history"
              required
              :rules="[aahValidations.validationRequired]"
              label="現疾患・既往歴"
            />
          </div>
        </div>

        <div class="row">
          <div class="12">
            <q-editor
              :toolbar="[
                ['left', 'center', 'right', 'justify'],
                ['bold', 'italic', 'strike', 'underline'],
                ['undo', 'redo'],
                ['token'],
                [
                  {
                    label: $q.lang.editor.formatting,
                    icon: $q.iconSet.editor.formatting,
                    list: 'no-icons',
                    options: ['p', 'h2', 'h3', 'h4', 'h5']
                  }
                ]
              ]"
              :ref="targetRef"
              toolbar-bg="primary"
              toolbar-text-color="white"
              toolbar-toggle-color="accent-700"
              class="editor"
              v-model="memoCarteForm.memo_other"
              @update:model-value="updateBtnLabel"
            >
              <template v-slot:token>
                <q-color
                  @click="colorClicked()"
                  v-model="foreColor"
                  no-header
                  no-footer
                  default-view="palette"
                  :palette="[
                    '#000000',
                    '#FF0000',
                    '#0000FF',
                    '#008000',
                    '#505050'
                  ]"
                  unelevated
                  class="q-mt-sm bg-primary color-picker"
                />
              </template>
            </q-editor>
          </div>
        </div>
      </div>

    </template>

  </div>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn
        @click="submit"
        unelevated
        color="primary"
        tabindex="30"
        class="q-ml-md"
      >
        <span>リクエストまたは会計を作成</span>
      </q-btn>
      <!-- <q-btn
        @click="submit"
        unelevated
        color="primary"
        tabindex="30"
        class="q-ml-md"
      >
        <span>Process RQ & Cart</span>
      </q-btn> -->
    </div>
  </q-card-section>
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

.editor {
  line-height: 1.7;

  :deep(.q-editor__toolbar-group) {
    &:last-child {
      margin-left: -90px;
    }
  }

  :deep(.q-editor__content) {
    padding: 16px;
    height: calc(200px);
  }
}


// =================================
// SERVICE DETAIL
// =================================
.item_divier_item_service {
  flex-wrap: nowrap;
  cursor: pointer;
  border-left: 5px solid #eebedb;
  &:hover {
    background-color: rgba(255, 236, 248, 0.7);
  }
  &:active {
    background-color: rgba(255, 236, 248, 0.8);
  }
  &:focus {
    background-color: rgba(255, 236, 248, 0.9);
  }
  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px !important;
}
.item-service-grid {
  display: grid;
  grid-template-columns: 3fr 1fr;
  &:hover {
    background-color: rgba(255, 236, 248, 0.7);
  }
  .item-service-name {
    max-width: 32vw;
    @media screen and (max-width: 1200px) {
      max-width: 30vw;
    }
    @media screen and (max-width: 1040px) {
      // For IPAD
      max-width: 25vw;
    }
    @media screen and (max-width: 900px) {
      // For IPAD
      max-width: 22vw;
    }
    @media screen and (max-width: 430px) {
      // For Phone
      max-width: 12vw;
    }
  }
}

// =================================
// PRESCRIPTION
// =================================
.item_divier_prescription {
  cursor: pointer;
  border-left: 5px solid #beccee;
  &:hover {
    background-color: rgba(236, 248, 255, 0.7);
  }

  &:active {
    background-color: rgba(236, 248, 255, 0.8);
  }

  &:focus {
    background-color: rgba(236, 248, 255, 0.9);
  }

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px !important;
  .prescription-name {
    max-width: 30vw;
    @media screen and (max-width: 1440px) {
      max-width: 22vw;
    }
    &.left {
      @media screen and (max-width: 1440px) {
        max-width: 25vw;
      }
    }
  }
}
.widthToTruncate {
  // max-width: 270px;
  max-width: 30vw;
  @media screen and (max-width: 1100px) {
    max-width: 30vw;
  }
  @media screen and (max-width: 1040px) {
    // For IPAD
    max-width: 25vw;
  }
  @media screen and (max-width: 900px) {
    // For IPAD
    max-width: 22vw;
  }
  @media screen and (max-width: 430px) {
    // For Phone
    max-width: 32vw;
  }
  &.left {
    @media screen and (max-width: 1440px) {
      max-width: 25vw;
    }
  }
}
.prescription-header-btn {
  background-color: #e9efff;
  padding: 0px 10px;
}
.prescription-header-btn-span {
  height: 20px;
  display: flex;
  align-items: center;
  padding: 2px 8px;
}

// =================================
// INJECT
// =================================
.item_divier_inject {
  cursor: pointer;
  border-left: 5px solid #cdb7f2;
  &:hover {
    background-color: rgba(241, 233, 255, 0.7);
  }

  &:active {
    background-color: rgba(241, 233, 255, 0.8);
  }

  &:focus {
    background-color: rgba(241, 233, 255, 0.9);
  }

  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px !important;

  .inject-name {
    max-width: 32vw;
    @media screen and (max-width: 1200px) {
      max-width: 30vw;
    }
    @media screen and (max-width: 1040px) {
      // For IPAD
      max-width: 25vw;
    }
    @media screen and (max-width: 900px) {
      // For IPAD
      max-width: 22vw;
    }
    @media screen and (max-width: 430px) {
      // For Phone
      max-width: 12vw;
    }
  }
}
.inject-header-btn {
  background-color: #eee4ff;
  padding: 0px 10px;
}
</style>