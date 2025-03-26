<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCustomerStore from '@/stores/customers'
import { groupBy, orderBy, sortBy } from 'lodash'
import {
  aahUtilsGetEmployeeName,
  formatDate,
  getDateByFormat,
  getDateToday,
  getFullPetNameWithoutHonorific,
  highlightText,
  setCharAt
} from '@/utils/aahUtils'
import useServiceGroupStore from '@/stores/service-groups'
import useServiceDetailStore from '@/stores/service-details'
import mtUtils from '@/utils/mtUtils'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useItemStore from '@/stores/items'
import { storeToRefs } from 'pinia'
import selectOptions from '@/utils/selectOptions'
import SearchMedicineList from '@/pages/master/itemService/SearchMedicineList.vue'
import ViewItemServiceDetailModal from '@/pages/master/itemService/ViewItemServiceDetailModal.vue'
import useCommonStore from '@/stores/common'
import { event_bus } from '@/utils/eventBus'
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue'
import useInjectStore from '@/stores/inject'
import InjectDetailListBox from '@/pages/request/inject/InjectDetailListBox.vue'
import aahMessages from '@/utils/aahMessages'

import usePetBioStore from '@/stores/pet-bios'
import InjectHeaderListBox from '@/pages/request/inject/InjectHeaderListBox.vue'
import aahValidations from '@/utils/aahValidations'
import OptionItemServiceUnitModalUI from '@/pages/request/serviceDetail/OptionItemServiceUnitModalUI.vue'
import useAddressesStore from '@/stores/addresses'
import useEmployeeStore from '@/stores/employees'
import useKeywordStore from '@/stores/keyword'
import IDIsuComparison from '@/pages/request/inject/IDIsuComparison.vue'

const props = defineProps({
  id: String,
  id_customer: String,
  id_pet: String,
  requestObj: Object,
  injectObj: Object,
  petDetails: Object
})
const defaultEmployee = JSON.parse(localStorage.getItem('id_employee'))
const petBioStore = usePetBioStore()

const commonStore = useCommonStore()

const serviceDetailStore = useServiceDetailStore()
const itemStore = useItemStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const customerStore = useCustomerStore()
const serviceGroupStore = useServiceGroupStore()
const injectStore = useInjectStore()

const { getInjectDetailList } = storeToRefs(injectStore)

const emits = defineEmits(['close'])

const injectHeaderExist = ref(true)

const childFormRefs = ref([])

const injectHeaderRef = ref(null)

const isCloseDetail = ref(false)
const historyTFlgUI = ref(false)
const iconClickUI = ref(false)
const searchKeyword = ref('')
const allServices = ref([])

const allTop30 = ref([])

const filteredKeyword = ref({
  single: [],
  multiple: []
})

const allKeyword = ref([])

const selectedServices = ref([] as Array<any>)

const tab = ref('history')
const petList = ref()
const petSelected = ref()
const petSelectedLabel = ref()
const isTypeAnimal = ref(false)

const commonTypeAnimalOptionList: any = ref([])

const qForm = ref(null)

const typeAnimalUI = computed(() => {
  if (
    customerStore.getCustomer &&
    customerStore.getCustomer?.pets &&
    customerStore?.getCustomer?.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal
  ) {
    const typeAnimal = customerStore.getCustomer.pets.find(
      (petObj: any) => petObj.id_pet == petSelected.value
    )?.id_cm_animal

    return `${
      commonTypeAnimalOptionList.value.find(
        (obj: any) => obj.value == typeAnimal
      )?.label
    }`
  }
  return ''
})

const valWeightUI = computed(() => {
  return props.petDetails
    ? `${(props.petDetails.val_weight / 1000).toFixed(2)} Kg`
    : '0 Kg'
})

const setChildRef = (index) => (el) => {
  if (el) {
    childFormRefs.value[index] = el
  } else {
    // Handle removing the reference when the child component is unmounted
    delete childFormRefs.value[index]
  }
}

const searchMultipleKeyword = async () => {
  const response = await mtUtils.callApi(
    selectOptions.reqMethod.GET,
    '/mst/service_groups',
    {
      isInjectGroup: true,
      type_animal: isTypeAnimal.value
        ? customerStore?.getCustomer?.pets.find(
            (petObj: any) => petObj.id_pet == petSelected.value
          )?.id_cm_animal
        : null,
      type_animal_allowed: customerStore?.getCustomer?.pets.find(
        (petObj: any) => petObj.id_pet == petSelected.value
      )?.id_cm_animal
    }
  )

  const modifiedData = response
    .map((serviceGroupObj: any) => {
      return { ...serviceGroupObj, checkbox: false }
    })
    .filter(
      (v: any) =>
        v.name_service_group
          .trim()
          .toLowerCase()
          .indexOf(searchKeyword.value.toLowerCase()) > -1
    )

  const filterModifiedData = modifiedData
    .map((data) => {
      data.service_group_item_list = data.service_group_item_list.filter(
        (item) => {
          return filterDataByDate(
            item.item_service_unit.date_start,
            item.item_service_unit.date_end
          )
        }
      )

      return data
    })
    .filter((data) => {
      return data.service_group_item_list.length > 0
    })

  filteredKeyword.value.multiple = filterModifiedData
}
const changePet = async (v: any) => {
  if (!injectStore.getInjectHeaderByPet(petSelected.value)) {
    // await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
    return
  }
  await injectStore.fetchPrescriptionDetailList({
    id_pet: petSelected.value
  })
  customerStore.selectPet(petSelected.value)
  init()
}
const closeModal = () => {
  emits('close')
}
const removeItem = (key: string, index: any) => {
  selectedServices.value.splice(index, 1)
  childFormRefs.value.splice(index, 1)
}

async function save() {
  let injectHeader = props.injectObj
  let allFormData
  const tempValidation = []

  if (!petSelected.value) {
    await mtUtils.autoCloseAlert('対象のペットを選択してください。 ')
    return false
  }
  if (selectedServices.value.length === 0) {
    await mtUtils.autoCloseAlert('明細を1つ以上追加してください。 ')
    return false
  }

  if (!injectHeaderExist.value) {
    injectHeader = injectHeaderRef.value.getFormData()
  }

  tempValidation.push(aahValidations.injectHeaderValidation(injectHeader))

  injectHeader = {
    ...injectHeader,
    datetime_start: `${injectHeader?.date_start} ${injectHeader?.time_start}:00`,
    datetime_end: `${injectHeader?.date_end} ${injectHeader?.time_end}:00`
  }

  let merge_item_unit_list = []
  allFormData = Object.values(childFormRefs.value)
    .map((childForm, index) => {
      const childData = childForm.getFormData()

      const booking = childData.booking?.flg_booking ? childData.booking : null

      if (booking) {
        const dateBookingConfirmed: string = booking.date_booking_confirmed!

        const timeBookingConfirmed: string = booking.time_booking_confirmed!

        var datetimeBookingConfirmed = new Date(dateBookingConfirmed)

        datetimeBookingConfirmed =
          getDateByFormat(datetimeBookingConfirmed, 'YYYY/MM/DD') +
          ' ' +
          (timeBookingConfirmed ?? '00:00') +
          ':00'
      }

      let datetime_start = `${injectHeader?.date_start} 00:00:00`
      let datetime_end = `${injectHeader?.date_end} 00:00:00`

      if (
        injectHeader.date_start &&
        injectHeader.time_start &&
        injectHeader.time_start.length == '5'
      ) {
        datetime_start = `${injectHeader?.date_start} ${injectHeader?.time_start}:00`
      }

      if (
        injectHeader.date_end &&
        injectHeader.time_end &&
        injectHeader.time_start.length == '5'
      ) {
        datetime_end = `${injectHeader?.date_end} ${injectHeader?.time_end}:00`
      }

      if (childData.type_detail == 2 || childData.type_detail == 3) {
        if (
          childData.effort_unit_list &&
          childData.effort_unit_list.length > 0
        ) {
          childData.effort_unit_list.map((effort_unit: any) => {
            merge_item_unit_list.push({
              ...childData,
              date_start: injectHeader?.date_start,
              date_end: injectHeader?.date_end,
              datetime_start: datetime_start,
              datetime_end: datetime_end,
              id_employee_doctor: injectHeader?.id_employee_doctor,
              flg_apply_insurance: injectHeader?.flg_apply_insurance,
              id_pet: injectHeader?.id_pet,
              id_clinic: localStorage.getItem('id_clinic'),
              id_inject: injectHeaderExist.value
                ? props.injectObj?.id_inject
                : null,
              name_inject_display: effort_unit.label,
              name_service_item_unit: effort_unit.label,
              ...effort_unit
            })
          })
        }
        return null
      }

      return {
        ...childData,
        // row: pdListLength + (index + 1),
        date_start: injectHeader?.date_start,
        date_end: injectHeader?.date_end,
        datetime_start: datetime_start,
        datetime_end: datetime_end,
        id_employee_doctor: injectHeader?.id_employee_doctor,
        flg_apply_insurance: injectHeader?.flg_apply_insurance,
        id_pet: injectHeader?.id_pet,
        id_clinic: localStorage.getItem('id_clinic'),
        id_inject: injectHeaderExist.value ? props.injectObj?.id_inject : null,
        booking: booking
          ? {
              ...childData.booking,
              datetime_booking_confirmed: datetimeBookingConfirmed
            }
          : null
      }
    })
    .filter((item) => item !== null)

  allFormData.push(...merge_item_unit_list)

  allFormData.map((iDObj) => {
    tempValidation.push(aahValidations.injectDetailValidation(iDObj))
  })

  const resultValidation = await Promise.all(tempValidation)

  if (resultValidation.includes(false)) {
    return
  }

  if (props.requestObj && props.requestObj.flg_complete) {
    if (
      allFormData &&
      allFormData.some((pdObj: any) => !pdObj.flg_non_charge)
    ) {
      await mtUtils.autoCloseAlert(
        '会計が完了している為、\n会計項目をリクエストに追加することは出来ません。'
      )
      return
    }
  }

  if (injectHeader && !injectHeader.id_inject) {
    const response: any = await mtUtils.callApi(
      selectOptions.reqMethod.POST,
      'UpdInjectHeader',
      {
        inject: injectHeader,
        inject_detail_list: allFormData.filter((id: any) => {
          // This if is for excluding flg_etc1 with 0 dosage, means only valid merge price item
          return !(id.flg_etc1 && id.val_dosage_decided === 0)
        })
      },
      true
    )

    if (response && response.code == 200) {
      await mtUtils.autoCloseAlert(aahMessages.success)
      event_bus.emit('reloadLeft')
      closeModal()
      return
    }

    await mtUtils.autoCloseAlert('エラー')
    return
  }

  const response: any = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    '/inject_detail',
    { inject_detail_list: allFormData }
  )
  if (response) {
    await mtUtils.autoCloseAlert(aahMessages.success)
    event_bus.emit('reloadLeft')
    closeModal()
    return
  }

  await mtUtils.autoCloseAlert('エラー')
  return
}

const onServiceGroupCheck = (keyword: any) => {
  const selected: any = filteredKeyword.value.multiple.find(
    (v) => v.code_service_group === keyword.code_service_group
  )
  selected.checkbox = !selected.checkbox

  if (selected.checkbox) {
    const illnessHistory = []
    if (
      injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history &&
      injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history.length > 0
    ) {
      illnessHistory.push(
        ...injectStore.getInjectHeaderByPet(petSelected.value)
          ?.id_pet_illness_history
      )
    }

    const newArray = selected.service_group_item_list.map((item) => {
      return {
        ...item.item_service_unit,
        id_item_service:
          item.item_service_unit?.id_item_service?.id_item_service,
        item_service: item.item_service_unit?.id_item_service,

        name_category1: item.item_service_unit?.id_item_service?.name_category1,
        name_category2: item.item_service_unit?.id_item_service?.name_category2,
        code_category2: item.item_service_unit?.id_item_service?.code_category2,

        flg_prevention: item.item_service_unit?.id_item_service.flg_prevention,
        type_prevention:
          item.item_service_unit?.id_item_service.type_prevention,
        name_inject_display: item.item_service_unit.name_service_item_unit,
        val_dosage_decided: 1,
        val_efficacyingredient: item.item_service_unit.val_efficacyingredient,
        id_employee_doctor: props.requestObj?.id_employee_doctor,
        id_employee_staff: props.requestObj?.id_employee_staff,

        id_pet_illness_history: illnessHistory,
        id_employee_doctor: props.requestObj?.id_employee_doctor,
        id_pet: petSelected.value,
        flg_prevention: item.item_service_unit?.id_item_service.flg_prevention,
        type_prevention:
          item.item_service_unit?.id_item_service.type_prevention,
        flg_non_charge: props.requestObj.flg_complete
      }
    })
    selectedServices.value = [...selectedServices.value, ...newArray]
  }
}

const onTop30CheckISU = (
  top30: any,
  ISU: any,
  IS: any,
  is_top30: boolean = true
) => {
  let selected: any = allKeyword.value.find(
    (v) => v.id_item_service === ISU.id_item_service
  )
  if (is_top30)
    selected = allTop30.value.find(
      (v) => v.id_item_service === ISU.id_item_service
    )

  selected.checked = true

  if (selected.checked) {
    const illnessHistory = []
    if (
      injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history &&
      injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history.length > 0
    ) {
      illnessHistory.push(
        ...injectStore.getInjectHeaderByPet(petSelected.value)
          ?.id_pet_illness_history
      )
    }

    delete ISU.flg_etc1

    const tempService = {
      ...ISU,
      item_service: IS,
      name_category1: top30.name_category1,
      name_category2: top30.name_category2,
      code_category2: IS.code_category2,
      id_item_service: top30.id_item_service,
      id_category1: selected.id_category1,
      id_category2: selected.id_category2,
      quantity: 1,
      id_pet: petSelected.value,
      flg_prevention: IS.flg_prevention,
      type_prevention: IS.type_prevention,
      name_inject_display: ISU.name_service_item_unit,
      val_efficacyingredient: ISU.val_efficacyingredient,
      val_dosage_decided: 1,
      id_employee_doctor: props.requestObj?.id_employee_doctor,
      id_employee_staff: props.requestObj?.id_employee_staff,
      flg_non_charge: props.requestObj.flg_complete,
      row: selectedServices.value.length + 1,
      type_detail: 1,
      show: !isCloseDetail.value
    }

    if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
    selectedServices.value.push(tempService)
    useInjectStore().appendToItemServiceList(ISU)
  } else {
    const key = selectedServices.value.findIndex(
      (v: any) => v.id_item_service_unit == ISU.id_item_service_unit
    )
    const key1 = useInjectStore().getCurrentItemServiceUnitList.findIndex(
      (v) => v.id_item_service_unit == ISU.id_item_service_unit
    )

    selectedServices.value.splice(key, 1)
    useInjectStore().itemServiceUnitList.splice(key1, 1)
  }
}

const onDateSelected = async (date: any) => {
  const illnessHistory = []
  if (
    injectStore.getInjectHeaderByPet(petSelected.value)
      ?.id_pet_illness_history &&
    injectStore.getInjectHeaderByPet(petSelected.value)?.id_pet_illness_history
      .length > 0
  ) {
    illnessHistory.push(
      ...injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history
    )
  }

  let compareSInjectDetaillList = []

  allServices.value[date].forEach(async (history) => {
    compareSInjectDetaillList.push(history.id_inject_detail)
  })


  const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparisonID', {
    id_inject_detail_list: compareSInjectDetaillList
  })

  let IsuByID = {}

  if (comparisonResponse && Object.keys(comparisonResponse).length > 0) {
    await mtUtils.smallPopup(IDIsuComparison, {
      comparisonResponse: comparisonResponse,
      service_detail: history,
      callBack: (param: any) => {
        if (param.submitted) {
          IsuByID = param
        }
      }
    })
  }

  allServices.value[date].map((injectDetail: any) => {
    const tempService = {
      ...injectDetail,
      name_category1: injectDetail.name_category1,
      name_category2: injectDetail.name_category2,
      code_category2: injectDetail.code_category2,
      id_item_service: injectDetail.id_item_service,
      id_category1: injectDetail.id_category1,
      id_category2: injectDetail.id_category2,
      quantity: 1,
      id_pet: petSelected.value,
      flg_prevention: injectDetail.flg_prevention,
      type_prevention: injectDetail.type_prevention,
      name_inject_display: injectDetail.name_inject_display,
      val_efficacyingredient: injectDetail.val_efficacyingredient,
      val_dosage_decided: 1,
      id_employee_doctor: props.requestObj?.id_employee_doctor,
      id_employee_staff: props.requestObj?.id_employee_staff,
      flg_non_charge: props.requestObj.flg_complete,
      row: selectedServices.value.length + 1,
      id_inject_detail: null,
      id_inject: null,
      isEdit: false,
      type_detail: injectDetail.type_detail,
      show: !isCloseDetail.value,
      id_price: (injectDetail.id_inject_detail in IsuByID) ? IsuByID[injectDetail.id_inject_detail].id_price : injectDetail.id_price
    }
    if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
    selectedServices.value.push(tempService)
    useInjectStore().appendToItemServiceList(tempService)
  })
}

const onHistoryCheck = async (injectDetail: any, key: any) => {
  const illnessHistory = []
  if (
    injectStore.getInjectHeaderByPet(petSelected.value)
      ?.id_pet_illness_history &&
    injectStore.getInjectHeaderByPet(petSelected.value)?.id_pet_illness_history
      .length > 0
  ) {
    illnessHistory.push(
      ...injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history
    )
  }

  const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparisonID', {
    id_inject_detail: injectDetail.id_inject_detail
  })

  let m_price = null

  if (comparisonResponse && Object.keys(comparisonResponse).length > 0) {
    await mtUtils.smallPopup(IDIsuComparison, {
      comparisonResponse: comparisonResponse,
      service_detail: history,
      callBack: (param: any) => {
        if (param.submitted) {
          m_price = param[injectDetail.id_inject_detail]
        }
      }
    })
  }

  const selected: any = allServices.value[key].find(
    (v) => v.id_inject_detail == injectDetail.id_inject_detail
  )

  selected.checked = true

  if (selected.checked) {
    let id_item_service_unit = selected.id_item_service_unit

    if (!id_item_service_unit) {
      await mtUtils.alert(
        '選択された商品には品名包装単位が存在しません。\n商品マスタを見直してください。 ',
        '確認'
      )
    }

    if (id_item_service_unit) {
      const response = await itemServiceUnitStore.fetchItemServiceUnit(
        id_item_service_unit
      )

      if (!response) {
        await mtUtils.alert(
          '選択された商品には品名包装単位が存在しません。\n商品マスタを見直してください。 ',
          '確認'
        )
      }
      const selected_ISU = itemServiceUnitStore.getItemServiceUnit
      selected.flg_non_charge = selected_ISU?.flg_non_charge
    }

    const tempService = {
      name_category1: injectDetail.name_category1,
      name_category2: injectDetail.name_category2,
      code_category2: injectDetail.code_category2,
      id_item_service: injectDetail.id_item_service,
      id_category1: injectDetail.id_category1,
      id_category2: injectDetail.id_category2,
      quantity: 1,
      id_pet: petSelected.value,
      flg_prevention: injectDetail.flg_prevention,
      type_prevention: injectDetail.type_prevention,
      name_inject_display: injectDetail.name_inject_display,
      val_efficacyingredient: injectDetail.val_efficacyingredient,
      val_dosage_decided: 1,
      id_employee_doctor: props.requestObj?.id_employee_doctor,
      id_employee_staff: props.requestObj?.id_employee_staff,
      id_inject_detail_parent: props.requestObj?.id_inject_detail_parent,
      flg_non_charge: selected.flg_non_charge,
      id_item_service_unit: id_item_service_unit,
      id_inject_detail: null,
      id_inject: null,
      show: !isCloseDetail.value
    }

    if (
      useInjectStore().getCurrentSelectedIdEmployeeDoctor !=
      injectDetail.id_employee_doctor
    ) {
      await mtUtils.alert(
        `複製の際、担当医を ${aahUtilsGetEmployeeName(
          useEmployeeStore().getAllEmployees,
          injectDetail?.id_employee_doctor
        )} に置換しました。`
      )
      useInjectStore().setCurrentSelectedIdEmployee(
        injectDetail.id_employee_doctor
      )
    }

    if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
    selectedServices.value.push(tempService)

    useInjectStore().appendToItemServiceList(tempService)
  } else {
    const key = selectedServices.value.findIndex(
      (v: any) => v.id_item_service == injectDetail.id_item_service
    )
    const key1 = useInjectStore().getCurrentItemServiceUnitList.findIndex(
      (v) => v.id_item_service == injectDetail.id_item_service
    )

    selectedServices.value.splice(key, 1)
    useInjectStore().itemServiceUnitList.splice(key1, 1)
  }
}

const filterDataByDate = (dateStart: string, dateEnd: string) => {
  const today = new Date()

  const formatDateStart = new Date(dateStart)
  const formatDateEnd = new Date(dateEnd)

  return (
    (!formatDateStart || today > formatDateStart) &&
    (!formatDateEnd || today < formatDateEnd)
  )
}

async function selectedTab(value: any) {
  if (value == 'top30') {
    const response = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/SearchInjectServiceWithOption`,
      {
        val_top30: true,
        type_animal: isTypeAnimal.value
          ? useCommonStore().getCommonTypeAnimalOptionList.find(
              (animal: any) =>
                customerStore?.getCustomer?.pets.find(
                  (petObj: any) => petObj.id_pet == petSelected.value
                )?.id_cm_animal == animal.id_common
            )?.code_func2
          : null,
        type_item: 1,
        flg_inject: true,
        no_pagination: true,
        type_animal_allowed: customerStore?.getCustomer?.pets.find(
          (petObj: any) => petObj.id_pet == petSelected.value
        )?.id_cm_animal
      }
    )

    const modifiedData = [
      ...sortBy(response, 'display_order').map((item: any) => {
        item.item_service_option_list = sortBy(
          item.item_service_option_list,
          'display_order'
        ).map((ISO: any) => {
          // Ensure ISO.id_item_service_child is an object and handle undefined case
          const childProps = ISO.id_item_service_child
            ? { ...ISO.id_item_service_child }
            : {}
          return { ...ISO, ...childProps, checked: false }
        })

        item.item_service_unit_list = sortBy(
          item.item_service_unit_list,
          'display_order'
        ).map((ISU: any) => {
          delete ISU.flg_etc1
          return { ...ISU, checked: false }
        })

        return { ...item, checked: false }
      })
    ]

    const filterModifiedData = modifiedData
      .map((data) => {
        data.item_service_unit_list = data.item_service_unit_list.filter(
          (item) => {
            return filterDataByDate(item.date_start, item.date_end)
          }
        )
        data.item_service_option_list = data.item_service_option_list.filter(
          (item) => {
            item.item_service_unit_list = item.item_service_unit_list.filter(
              (itemService) => {
                return filterDataByDate(
                  itemService.date_start,
                  itemService.date_end
                )
              }
            )

            return item.item_service_unit_list.length > 0
          }
        )
        return data
      })
      .filter((data) => {
        return (
          data.item_service_unit_list.length > 0 ||
          data.item_service_option_list.length > 0
        )
      })

    allTop30.value = filterModifiedData
  }
  if (value == 'service_group') {
    await searchMultipleKeyword()
  }

  if (value == 'keyword_single') {
  }
}

async function openMedicineSearchModal() {
  const illnessHistory = []
  if (
    injectStore.getInjectHeaderByPet(petSelected.value)
      ?.id_pet_illness_history &&
    injectStore.getInjectHeaderByPet(petSelected.value)?.id_pet_illness_history
      .length > 0
  ) {
    illnessHistory.push(
      ...injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history
    )
  }

  await mtUtils.popup(SearchMedicineList, {
    normalMode: false,
    source: 'inject'
  })
}

event_bus.on('setInjectKeyword', async (itemServices = []) => {
  if (itemServices && itemServices.length && itemServices.length > 0) {
    await onSearchKeyword(itemServices.map((v) => v.id_item_service).join(','))
  }
})

const keywordStore = useKeywordStore()

const { getInjectKeywords } = storeToRefs(keywordStore)

const quickSearchKeyword = async (keyword: string) => {
  searchKeyword.value = keyword

  await onSearchKeyword(null, true)
}

const removeKeyword = (keywordIndex: number) => {
  keywordStore.removeInjectKeyword(keywordIndex)
}

const onSearchKeyword = async (
  id_item_service_list: any = null,
  quickSearch = false
) => {
  if (
    searchKeyword.value.length > 0 ||
    (id_item_service_list &&
      id_item_service_list.length &&
      id_item_service_list.length > 0)
  ) {
    if (!quickSearch) {
      keywordStore.addInjectKeyword(searchKeyword.value)
    }

    const response = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `/mst/SearchInjectServiceWithOption`,
      {
        val_top30: false,
        type_animal: isTypeAnimal.value
          ? useCommonStore().getCommonTypeAnimalOptionList.find(
              (animal: any) =>
                customerStore?.getCustomer?.pets.find(
                  (petObj: any) => petObj.id_pet == petSelected.value
                )?.id_cm_animal == animal.id_common
            )?.code_func2
          : null,
        type_item: 1,
        flg_inject: true,
        search_words: searchKeyword.value,
        id_item_service_list: id_item_service_list
      }
    )

    const modifiedData = [
      ...sortBy(response, 'display_order').map((item: any) => {
        item.item_service_option_list = sortBy(
          item.item_service_option_list,
          'display_order'
        ).map((ISO: any) => {
          // Ensure ISO.id_item_service_child is an object and handle undefined case
          const childProps = ISO.id_item_service_child
            ? { ...ISO.id_item_service_child }
            : {}
          return { ...ISO, ...childProps, checked: false }
        })

        item.item_service_unit_list = sortBy(
          item.item_service_unit_list,
          'display_order'
        ).map((ISU: any) => {
          return { ...ISU, checked: false }
        })

        return { ...item, checked: false }
      })
    ]

    const filterModifiedData = modifiedData
      .map((data) => {
        data.item_service_unit_list = data.item_service_unit_list.filter(
          (item) => {
            return filterDataByDate(item.date_start, item.date_end)
          }
        )
        data.item_service_option_list = data.item_service_option_list.filter(
          (item) => {
            item.item_service_unit_list = sortBy(
              item.item_service_unit_list,
              'display_order'
            ).filter((itemService) => {
              return filterDataByDate(
                itemService.date_start,
                itemService.date_end
              )
            })

            return item.item_service_unit_list.length > 0
          }
        )
        return data
      })
      .filter((data) => {
        return (
          data.item_service_unit_list.length > 0 ||
          data.item_service_option_list.length > 0
        )
      })

    // This is only used medicine search popUp !
    if (id_item_service_list) {
      allKeyword.value = filterModifiedData
      return
    }

    const sortedData = orderBy(
      filterModifiedData,
      (item) => {
        const matchedItems = item?.item_service_unit_list?.filter((isu) =>
          isu.name_service_item_unit.toLowerCase().includes(searchKeyword.value)
        )
        return matchedItems.length
      },
      'desc'
    )
    allKeyword.value = sortedData
  }
}

async function openItemServiceModel(row, key?) {
  iconClickUI.value = true
  await mtUtils.popup(ViewItemServiceDetailModal, { id: row?.id_item_service })
  iconClickUI.value = false
  if (key == 'top30') {
    await selectedTab('top30')
  }
  // on modal close
  await injectStore.fetchInjectDetailByPet({ id_pet: props.id_pet })
  allServices.value = groupBy(
    getInjectDetailList.value
      .map((data: any) => ({
        ...data,
        checkbox: false,
        datetime: formatDate(data.date_start)
      }))
      .filter(
        (data: any) =>
          !(data.datetime == getDateToday() || data.flg_group_title)
      ),
    'datetime'
  )
}

const orderAlltop30 = computed(() => {
  // sort the smallest val_top30 is higher
  return allTop30.value
    .sort((a, b) => {
      return a.val_top30 - b.val_top30
    })
    .map((item) => {
      return {
        ...item,
        item_service_unit_list: item.item_service_unit_list.sort((a, b) => {
          return a.display_order - b.display_order
        })
      }
    })
})

const receivedISU = ref({
  selected: false,
  id_item_service_unit: null,
  name_service_item_unit: null
})

const callBackOption = (option: any) => {
  if (option) {
    onTop30CheckISO([], option, null, true)
  }
}

const changeIsCloseDetail = (value) => {
  const newValue = setCharAt(
    localStorage.getItem('is_close_detail'),
    2,
    value ? '1' : '0'
  ) // SD 0, PD 1, InD 2
  localStorage.setItem('is_close_detail', newValue)
  Object.values(childFormRefs.value).forEach((childForm) =>
    childForm.changeShowDetails(!value)
  )
}

const onTop30CheckISO = async (
  list: any,
  ISO: any,
  IS: any,
  callBack: any = false
) => {
  let tempHistory = { ...ISO }

  let selectedIS = tempHistory.id_item_service_child

  if (selectedIS.flg_merge_price && !callBack) {
    return
  }

  const illnessHistory = []
  if (
    injectStore.getInjectHeaderByPet(petSelected.value)
      ?.id_pet_illness_history &&
    injectStore.getInjectHeaderByPet(petSelected.value)?.id_pet_illness_history
      .length > 0
  ) {
    illnessHistory.push(
      ...injectStore.getInjectHeaderByPet(petSelected.value)
        ?.id_pet_illness_history
    )
  }

  if (!callBack && tempHistory.item_service_unit_list.length > 0) {
    receivedISU.value.selected = false

    await mtUtils.smallPopup(OptionItemServiceUnitModalUI, {
      itemServiceUnitList: tempHistory.item_service_unit_list,
      selectedUnit: (unit) => {
        receivedISU.value = { ...unit }
      },
      class: 'inject-detail-hover'
    })

    if (!receivedISU.value.selected) return
  }

  if (callBack && tempHistory) {
    console.log(tempHistory)

    const itemService = orderAlltop30.value.find(
      (item) => item.id_item_service == tempHistory.id_item_service_parent
    )
    if (itemService) {
      const item_service_option = itemService.item_service_option_list.find(
        (O) => O.id_item_service_option == tempHistory.id_item_service_option
      )

      if (
        item_service_option &&
        item_service_option.item_service_unit_list &&
        item_service_option.item_service_unit_list.length &&
        item_service_option.item_service_unit_list.length > 0
      ) {
        item_service_option.item_service_unit_list.map((unit, idx) => {
          if (idx !== 0) return
          const tempService = {
            ...unit,
            checked: idx == 0,
            val_dosage_decided: idx == 0 ? 1 : 0,
            item_service: selectedIS,
            name_category1: selectedIS.name_category1,
            name_category2: selectedIS.name_category2,
            code_category2: selectedIS.code_category2,
            id_item_service: selectedIS.id_item_service,
            id_category1: selectedIS.id_category1,
            id_category2: selectedIS.id_category2,
            process_helper: tempHistory.process_helper,
            quantity: 1,
            num_conduct: 1,
            id_pet: petSelected.value,
            flg_prevention: selectedIS.flg_prevention,
            type_prevention: selectedIS.type_prevention,
            name_inject_display: selectedIS.name_item_service,
            id_item_service_unit: unit.id_item_service_unit,
            val_efficacyingredient: unit.val_efficacyingredient,
            id_employee_doctor: props.requestObj?.id_employee_doctor,
            id_employee_staff: props.requestObj?.id_employee_staff,
            flg_non_charge: props.requestObj.flg_complete,
            type_detail: 3,
            show: !isCloseDetail.value
          }
          if (illnessHistory)
            tempService.id_pet_illness_history = illnessHistory
          selectedServices.value.push(tempService)
        })
      }
    }
    return
  }

  const tempService = {
    ...receivedISU.value,
    checked: true,
    item_service: selectedIS,
    name_category1: selectedIS.name_category1,
    name_category2: selectedIS.name_category2,
    code_category2: selectedIS.code_category2,
    id_item_service: selectedIS.id_item_service,
    id_category1: selectedIS.id_category1,
    id_category2: selectedIS.id_category2,
    quantity: 1,
    id_pet: petSelected.value,
    flg_prevention: selectedIS.flg_prevention,
    type_prevention: selectedIS.type_prevention,
    name_inject_display: receivedISU.value.name_service_item_unit,
    id_item_service_unit: receivedISU.value.id_item_service_unit,
    val_efficacyingredient: receivedISU.value.val_efficacyingredient,
    id_employee_doctor: props.requestObj?.id_employee_doctor,
    id_employee_staff: props.requestObj?.id_employee_staff,
    flg_non_charge: props.requestObj.flg_complete,
    val_dosage_decided: 1,
    type_detail: 1,
    show: !isCloseDetail.value
  }
  if (illnessHistory) tempService.id_pet_illness_history = illnessHistory
  selectedServices.value.push(tempService)
}
const optionLabel = (v) => {
  if (v) {
    if (v.customer_name_family)
      return getFullPetNameWithoutHonorific(v) + ' : ' + v.code_pet
    if (v.name_pet) return v.name_pet + ' : ' + v.code_pet
    return v.label
  }
  return ''
}

const init = async () => {
  await serviceGroupStore.fetchServiceGroups()
  await serviceDetailStore.fetchServiceDetails(props.id, {
    id_customer: props.id_customer
  })
  selectedServices.value = []
}

onMounted(async () => {
  if (!localStorage.getItem('is_close_detail'))
    localStorage.setItem('is_close_detail', '000') // '000' => INDEX 0 for SD, INDEX 1 for PD, INDEX 2 for InD
  isCloseDetail.value =
    localStorage.getItem('is_close_detail')?.toString()[2] == '1' ? true : false

  injectHeaderExist.value = false
  useInjectStore().resetItemServiceUnitList()
  useInjectStore().resetInjectDetailListByUI()

  if (props.injectObj && props.injectObj.id_inject) {
    injectHeaderExist.value = true
    injectStore.setValWeight(props.injectObj.val_weight)
  }

  useAddressesStore().fetchAddresses(props.requestObj.id_customer)

  commonTypeAnimalOptionList.value =
    useCommonStore().getCommonTypeAnimalOptionList.map((o: any) => ({
      value: o.id_common,
      label: o.name_common,
      status: 1,
      id_common: o.id_common
    }))

  await injectStore.fetchInjectDetailByPet({ id_pet: props.id_pet })

  allServices.value = groupBy(
    getInjectDetailList.value
      .map((data: any) => ({
        ...data,
        checkbox: false,
        datetime: formatDate(data.date_start)
      }))
      .filter(
        (data: any) =>
          !(data.datetime == getDateToday() || data.flg_group_title)
      ),
    'datetime'
  )

  petList.value = customerStore.getCustomer?.pets
  if (props.id_pet) {
    customerStore.selectPet(props.id_pet)
  }
  petSelected.value = customerStore?.getPet?.id_pet
  petSelectedLabel.value = optionLabel(customerStore?.getPet)
  // console.log('petSelectedLabel.value', petSelectedLabel.value)

  if (!Object.keys(allServices.value).length) {
    tab.value = 'top30'
    selectedTab('top30')
  }

  historyTFlgUI.value = true

  if (!injectStore.getInjectHeaderByPet(petSelected.value)) {
    // await mtUtils.alert('このペットの処方箋ヘッダーが未作成です。')
  }

  if (!typeAnimalUI.value) {
    await mtUtils.alert('動物種を設定してください。', '確認')
  }
})
</script>

<template>
  <q-card class="column full-height">
    <MtModalHeader class="bg-c-purple col-auto" @closeModal="closeModal()">
      <q-toolbar-title class="text-grey-900 title2 bold">
        注射・点滴
      </q-toolbar-title>
      <q-space></q-space>
      <MtInputForm
        v-model="petSelectedLabel"
        label="対象ペット名"
        readonly
        type="text"
      />
      <!-- <MtPetFilterSelect
        v-else
        v-model:selecting="petSelected"
        :pet-list="petList"
        label="対象ペット名"
        @update:model-value="changePet"
      /> -->
      <div class="q-ml-sm col-1">
        <MtInputForm
          v-model="typeAnimalUI"
          label="動物種"
          readonly
          type="text"
        />
      </div>
      <div class="q-ml-sm col-1">
        <MtInputForm
          v-model="valWeightUI"
          class="col-1 q-ml-md"
          label="体重"
          readonly
          type="text"
        />
      </div>

      <div class="q-mx-sm col-auto">
        <MtFormCheckBox
          v-model:checked="isCloseDetail"
          @update:checked="changeIsCloseDetail"
          label="明細閉じる"
        />
      </div>
    </MtModalHeader>
    <q-card-section class="q-px-xl col">
      <div class="row full-height" style="gap: 16px">
        <div class="col column">
          <q-tabs
            v-model="tab"
            active-color="grey-900"
            align="justify"
            class="text-grey-700 q-bb q-mb-md col-auto"
            dense
            indicator-color="accent-700"
            @update:modelValue="selectedTab"
          >
            <q-tab label="履歴" name="history" />
            <q-tab label="TOP30" name="top30" />
            <q-tab label="グループ検索" name="service_group" />
            <q-tab label="個別検索" name="keyword_single" />
          </q-tabs>

          <q-scroll-area v-if="tab === 'history'" visible class="full-width col">
            <template
              v-for="(service, date) in allServices"
              v-if="historyTFlgUI"
              :key="date"
            >
              <div
                class="row IS-history-date cursor-pointer"
                @click="onDateSelected(date)"
              >
                <div class="col">
                  {{ date }}
                </div>
                <div class="text-grey-500 col-auto">
                  <q-icon name="content_copy"></q-icon>
                  コピー
                </div>
              </div>
              <div
                v-for="value in service"
                :key="value.id_inject_detail"
                class="flex no-wrap q-mb-xs"
              >
                <q-card
                  class="cursor-pointer q-card-drip full-width"
                  flat
                  @click.prevent="onHistoryCheck(value, date)"
                >
                  <q-card-section class="q-py-xs">
                    <div class="flex justify-between items-center">
                      <div class="flex items-center">
                        <div class="body2 bold black">
                          {{ value.name_inject_display }}
                        </div>
                        <div
                          class="body2 text-grey-600 flex items-center q-ml-md"
                        >
                          {{ value.name_category1 }}
                          <q-icon name="arrow_right" />
                          {{ value.name_category2 }}
                        </div>
                      </div>
                      <div
                        class="z-index-100"
                        @click.prevent="openItemServiceModel(value)"
                      >
                        <q-btn
                          class="text-grey-700"
                          flat
                          icon="quiz"
                          round
                          size="15px"
                        />
                      </div>
                    </div>
                    <div
                      v-if="value?.memo_alert"
                      class="text-body2 q-mt-xs text-grey-700"
                    >
                      {{ value?.memo_alert }}
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </template>
            <template v-else>
              <div
                class="flex justify-center content-center items-center full-height"
              >
                注射・点滴歴はありません。
              </div>
            </template>
          </q-scroll-area>

          <q-scroll-area v-if="tab === 'top30'" visible class="full-width col">
            <div class="q-mb-sm flex justify-end">
              <div>
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="typeAnimalUI"
                  class="q-mr-xl"
                  @click="selectedTab('top30')"
                />
              </div>
            </div>

            <div
              v-for="top30 in orderAlltop30"
              :key="top30.key"
              class="flex no-wrap"
            >
              <q-card
                class="q-card-drip full-width cursor-pointer q-mb-md"
                flat
              >
                <q-card-section class="q-py-xs">
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0 ||
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex justify-between items-center q-pb-sm"
                  >
                    <div class="flex items-center no-wrap">
                      <span class="top30_round">{{ top30.val_top30 }}</span>
                      <div class="q-mr-lg">
                        <div class="q-mb-sm">
                          <span
                            v-if="top30.flg_not_available"
                            class="text-darkred"
                          >
                            [ 禁忌の為 使用不可 ]
                          </span>
                          <span class="body1 bold black">{{ top30.name_item_service }}</span>
                          <span
                            v-if="top30?.name_category2"
                            class="caption1 regular text-grey-600 q-ml-md"
                          >
                            {{ top30.name_category1 }}
                            <q-icon name="arrow_right" />
                            {{ top30.name_category2 }}
                          </span>
                        </div> 
                      </div>
                    </div>
                    <div class="flex">
                      <q-chip
                        v-if="top30.flg_prevention"
                        class="chip-blue"
                        text-color="white"
                      >
                        予防
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_pet_custody_control"
                        class="chip-red"
                        text-color="white"
                      >
                        預かり
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_surgery"
                        class="chip-purple"
                        text-color="white"
                      >
                        手術
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_anesthesia"
                        class="chip-green"
                        text-color="white"
                      >
                        麻酔
                      </q-chip>
                      <div
                        class="z-index-100"
                        @click.prevent="openItemServiceModel(top30, 'top30')"
                      >
                        <q-btn
                          class="text-grey-700"
                          flat
                          icon="quiz"
                          round
                          size="15px"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex columns"
                  >
                    <div
                      v-for="ISU in top30?.item_service_unit_list"
                      :key="ISU.id_item_service_unit"
                      class="flex"
                      @click.stop="onTop30CheckISU(top30, ISU, top30)"
                    >
                      <div class="flex item-service-unit-box">
                        <q-icon class="q-pt-xs q-mr-sm" name="play_arrow" />
                        {{ ISU.name_service_item_unit }}
                      </div>
                    </div>
                  </div>
                  <div v-if="top30?.item_service_option_list?.length > 0">
                    <div class="caption1 text-grey-600 q-ml-md q-mt-sm q-mb-xs">
                      関連オプション
                    </div>
                    <div class="flex columns">
                      <div
                        v-for="ISO in top30?.item_service_option_list"
                        :key="ISO?.id_item_service_option"
                        class="flex"
                        @click.stop="
                          onTop30CheckISO(
                            top30?.item_service_option_list,
                            ISO,
                            top30
                          )
                        "
                      >
                        <div class="flex item-service-option-box">
                          <q-icon
                            class="text-grey-700 q-pt-xs"
                            name="arrow_right"
                          />
                          {{ ISO?.name_item_service }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>

          <q-scroll-area
            v-if="tab === 'service_group'"
            visible
            class="full-width col"
          >
            <div class="q-mb-sm flex justify-between">
              <div class="q-mb-sm">キーワード</div>
              <div>
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="typeAnimalUI"
                  class="q-mr-xl"
                  @click="searchMultipleKeyword"
                />
              </div>
            </div>
            <div class="flex no-wrap q-mb-md">
              <MtInputForm
                v-model="searchServiceGroup"
                autofocus
                dense
                class="full-width q-mr-md"
                outlined
                type="text"
                @keydown.enter.prevent="searchMultipleKeyword"
              />
              <q-btn
                round
                class="bg-grey-800 q-ml-md text-white"
                @click="searchMultipleKeyword"
              >
                <q-icon name="search" />
              </q-btn>
            </div>
            <div
              v-for="service_group in filteredKeyword.multiple"
              :key="service_group.id_service_group"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-drip cursor-pointer full-width q-card-drip"
                flat
                @click.prevent="onServiceGroupCheck(service_group)"
              >
                <q-card-section>
                  <div class="flex justify-between items-center">
                    <div class="flex full-width">
                      <div class="service-group-title full-width">
                        {{ service_group.name_service_group }}
                      </div>
                      <div class="flex">
                        <div
                          v-for="items in service_group.service_group_item_list"
                          :key="items.id_service_group_item"
                          class="service-group-item q-mt-xs q-ml-md"
                        >
                          <div
                            class="flex body1 bold text-grey-800 q-mb-xs justify-between items-center"
                          >
                            {{
                              items.item_service_unit?.name_service_item_unit
                            }}
                            <div
                              @click.stop="
                                openItemServiceModel(
                                  items.item_service_unit?.id_item_service
                                )
                              "
                            >
                              <q-btn
                                class="text-grey-700"
                                flat
                                icon="quiz"
                                round
                                size="15px"
                              />
                            </div>
                          </div>
                          <div class="body2 text-grey-600 flex items-center">
                            {{
                              items.item_service_unit.id_item_service
                                ?.name_category1
                            }}
                            <q-icon name="arrow_right" />
                            {{
                              items.item_service_unit.id_item_service
                                ?.name_category2
                            }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>
          <q-scroll-area
            v-if="tab === 'keyword_single'"
            visible
            class="full-width col"
          >
            <div class="q-mb-sm flex justify-between">
              <span> キーワード </span>
              <div
                v-if="
                  useCommonStore().getCommonTypeAnimalOptionList.find(
                    (v) => petSelected.id_cm_animal == v.id_common
                  )
                "
              >
                <MtFormCheckBox
                  v-model:checked="isTypeAnimal"
                  :label="
                    useCommonStore().getCommonTypeAnimalOptionList.find(
                      (v) => petSelected.id_cm_animal == v.id_common
                    ).name_common
                  "
                  class="q-mr-xl"
                  @click="onSearchKeyword(null)"
                />
              </div>
            </div>
            <div class="flex no-wrap q-mb-xs">
              <MtInputForm
                dense
                type="text"
                v-model="searchKeyword"
                class="full-width q-mr-md"
                outlined
                @keydown.enter.prevent="onSearchKeyword(null)"
              >
                <template v-slot:append>
                  <q-icon
                    v-if="searchKeyword && searchKeyword.length > 0"
                    class="cursor-pointer q-mr-md"
                    name="close"
                    size="xs"
                    @click="
                      () => {
                        searchKeyword = ''
                      }
                    "
                  >
                  </q-icon>
                  <q-icon
                    class="cursor-pointer"
                    name="feed"
                    @click="openMedicineSearchModal"
                  />
                </template>
              </MtInputForm>
              <q-btn
                class="bg-grey-800 q-ml-md text-white"
                round
                flat
                @click="onSearchKeyword(null)"
              >
                <q-icon name="search" />
              </q-btn>
            </div>
            <div class="flex items-center q-mb-md">
              <small class="text-grey-700 q-mr-sm">履歴 (10件)</small>
              <div class="flex row">
                <q-chip
                  v-for="(keyword, index) in getInjectKeywords"
                  clickable
                  removable
                  size="13px"
                  @click="quickSearchKeyword(keyword)"
                  @remove="removeKeyword(index)"
                >
                  {{ keyword }}
                </q-chip>
              </div>
            </div>
            <div
              v-for="top30 in allKeyword"
              :key="top30.id_item_service"
              class="flex no-wrap q-mb-md"
            >
              <q-card
                class="q-card-drip full-width cursor-pointer q-mb-md"
                flat
              >
                <q-card-section>
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0 ||
                      top30?.item_service_unit_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex justify-between items-center q-pb-sm"
                  >
                    <div class="flex items-center">
                      <div class="q-mr-lg">
                        <div
                          v-if="!searchKeyword"
                          class="body1 bold black q-mb-sm"
                        >
                          {{ top30.name_item_service }}
                        </div>
                        <div
                          v-if="searchKeyword"
                          class="body1 bold black q-mb-sm"
                          v-html="
                            highlightText({
                              searchQuery: searchKeyword,
                              content: top30.name_item_service
                            })
                          "
                        ></div>
                        <div
                          v-if="top30?.name_category2"
                          class="body2 text-grey-600 flex items-center"
                        >
                          {{ top30.name_category1 }}
                          <q-icon name="arrow_right" />
                          {{ top30.name_category2 }}
                        </div>
                      </div>
                    </div>
                    <div class="flex">
                      <q-chip
                        v-if="top30.flg_prevention"
                        class="chip-blue"
                        text-color="white"
                      >
                        予防
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_pet_custody_control"
                        class="chip-red"
                        text-color="white"
                      >
                        預かり
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_surgery"
                        class="chip-purple"
                        text-color="white"
                      >
                        手術
                      </q-chip>
                      <q-chip
                        v-if="top30.flg_anesthesia"
                        class="chip-green"
                        text-color="white"
                      >
                        麻酔
                      </q-chip>
                      <div @click.prevent="openItemServiceModel(top30)">
                        <q-btn
                          class="text-grey-700"
                          flat
                          icon="quiz"
                          round
                          size="15px"
                        />
                      </div>
                    </div>
                  </div>
                  <div
                    :class="
                      top30?.item_service_option_list?.length > 0
                        ? 'b-border'
                        : ''
                    "
                    class="flex columns"
                  >
                    <div
                      v-for="ISU in top30?.item_service_unit_list"
                      :key="ISU.id_item_service_unit"
                      class="flex"
                      @click.stop="onTop30CheckISU(top30, ISU, top30, false)"
                    >
                      <div class="flex item-service-unit-box">
                        <q-icon class="q-pt-xs q-mr-sm" name="play_arrow" />
                        <span v-if="!searchKeyword">
                          {{ ISU.name_service_item_unit }}
                        </span>
                        <span
                          v-if="searchKeyword"
                          v-html="
                            highlightText({
                              searchQuery: searchKeyword,
                              content: ISU.name_service_item_unit
                            })
                          "
                        ></span>
                      </div>
                    </div>
                  </div>
                  <div v-if="top30?.item_service_option_list?.length">
                    <div class="flex caption1 text-grey-500 q-ml-md q-my-md">
                      関連オプション
                    </div>
                    <div class="flex columns">
                      <div
                        v-for="ISO in top30?.item_service_option_list"
                        :key="ISO?.id_item_service_option"
                        class="flex"
                        @click.stop="
                          onTop30CheckISO(
                            top30?.item_service_option_list,
                            ISO,
                            top30
                          )
                        "
                      >
                        <div class="flex item-service-option-box">
                          <q-icon
                            class="text-grey-700 q-pt-xs"
                            name="arrow_right"
                          />
                          {{ ISO?.name_item_service }}
                        </div>
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </q-scroll-area>
        </div>
        <div class="col column">
          <q-scroll-area visible class="full-width col">
            <InjectHeaderListBox
              v-if="!injectHeaderExist"
              ref="injectHeaderRef"
              :request-obj="props.requestObj"
            ></InjectHeaderListBox>
            <div
              v-for="(item, index) in selectedServices"
              v-if="selectedServices.length > 0"
              :key="`${item.id_item_service}${selectedTab}`"
              class="q-mb-lg"
            >
              <InjectDetailListBox
                :ref="setChildRef(index)"
                :index="index"
                :item="item"
                @removeItem="removeItem($event, index)"
                :request-obj="props.requestObj"
                :call-back="callBackOption"
              >
              </InjectDetailListBox>
            </div>
          </q-scroll-area>
        </div>
      </div>
    </q-card-section>
    <q-card-section class="q-bt bg-white col-auto">
      <div class="text-center modal-btn">
        <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn class="q-ml-md" color="primary" unelevated @click="save()">
          <span>保存</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-card>
</template>
<style lang="scss" scoped>
.tab-view {
  height: calc(100dvh - 250px);
}

.side-tab-view {
  height: calc(100dvh - 210px);
}

.item-service-unit-box {
  display: flex;
  align-items: center;
  background-color: rgba(241, 233, 255, 0.7);
  color: $grey-800;
  padding: 8px 10px;
  margin: 5px 8px !important;
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background-color: rgba(205, 183, 242, 0.7);
  }
}

.item-service-option-box {
  display: flex;
  align-items: center;
  color: $grey-700;
  padding: 4px 8px;
  margin: 3px 8px !important;
  border-radius: 4px;
  font-size: 13px;

  &:hover {
    background-color: rgba(196, 196, 196, 0.7);
    color: $grey-900;
  }
}

.t-border {
  border-bottom: 1px solid #e3e3e3;
}

.b-border {
  border-bottom: 1px solid #e3e3e3;
}

.z-index-100 {
  z-index: 100 !important;
}

.search-btn {
  width: 50px;
  height: 42px;
}

.medicine-group-title {
  background-color: #4f5f83;
  color: white !important;
  border-radius: 4px;
  padding: 4px 8px;
}

.medicine-group-item {
  margin: 12px 0px 0px 15px !important;
  padding: 8px 12px;
  background-color: $grey-200 !important;
  border-radius: 10px;
}

.quiz-btn {
  min-height: unset;
}

.q-card-IS {
  border-left: 6px solid #e9efff;
  background: $grey-050;
  border-radius: 6px;
  padding: 0px;
}

.service-group-title {
  background-color: #7b6272;
  color: white !important;
  border-radius: 4px;
  padding: 4px 8px;
  letter-spacing: 2px;
}

.service-group-item {
  margin: 12px 0px 0px 15px !important;
  padding: 8px 12px;
  background-color: $grey-200 !important;
  border-radius: 10px;
}
</style>
