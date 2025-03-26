<script setup lang="ts">
import { onMounted, ref, watch, watchEffect, onUnmounted, nextTick } from 'vue'
import mtUtils from '@/utils/mtUtils'
import { useCustomerStore } from '@/stores/customers'
import { useQueueTicketStore } from '@/stores/queue_ticket'
import SelectPetModal from './SelectPetModal.vue'
import { storeToRefs } from 'pinia'
import useEmployeeStore from '@/stores/employees'
import { concatenate, getDateTimeNow, getDateToday } from '@/utils/aahUtils'
import useCliCommonStore from '@/stores/cli-common'
import useRequestStore from '@/stores/requests'
import useClinicStore from '@/stores/clinics'
import defaultDoctor from '@/assets/img/employee/default.png'
import dayjs from '@/boot/dayjs'
import { EmployeeType } from '@/types/types'

const cliCommonStore = useCliCommonStore()
const customerStore = useCustomerStore()
const queueTicketStore = useQueueTicketStore()
const ClinicStore = useClinicStore()

const { getCliCommonQTVisitPurposeList } = storeToRefs(cliCommonStore)

const employeeStore = useEmployeeStore()
const { getEmployees } = storeToRefs(employeeStore)

const emits = defineEmits(['close'])
const props = defineProps({ data: Object, todayQtickets: Object })

const isTodayRequestsDue = ref(false)
const pets = ref([])
const purposeRows = ref([])
const selectedPets = ref([])
const selectedPurposes = ref([])
const selectedEmployees = ref([])
const isPetSelected = ref(false)
const isPurposeSelectedForPet = ref(true)
const isPurposeSelected = ref(false)
const isConfirmed = ref(false)
const isDoctorSelected = ref(false)
const purposeSelected_ = ref('')
const doctorSelected_ = ref('')
const number_queue_ticket = ref('')
const todayTicketList = ref()
const isEdit = ref(false)
const reloadingSeconds = ref(10)
const countdownInterval = ref()
let currentTypeCheckInQt = 0

const selectedPet = ref([])
const doctorImages = ref<Record<number | string, string>>({})
const scrollContainer = ref(), showScrollTop = ref(false)

const qTicketRaw = {
  type_status_queue_ticket: 2,
  flg_apply_insurance: false,
  flg_appointment: false,
  flg_new_customer: false,
  flg_tel_requested: false,
  flg_parking_wait: false,
  flg_visit_for_pet: false,
  flg_next_notified: false,
  flg_from_customer: false,
  flg_web_payment_requested: false
}

const selectedQTicket = ref(null)
const screenTab = ref(0)
const isNewQtTab = ref(false)
const isCreateQt = ref(false)

const clearAllStates = () => {
  isPurposeSelectedForPet.value = true
  isTodayRequestsDue.value = false
  pets.value = []
  purposeRows.value = []
  selectedPets.value = []
  selectedPet.value = []
  selectedPurposes.value = []
  selectedEmployees.value = []
  isPetSelected.value = false
  isPurposeSelected.value = false
  isConfirmed.value = false
  isDoctorSelected.value = false
  purposeSelected_.value = ''
  doctorSelected_.value = ''
  number_queue_ticket.value = ''
  todayTicketList.value = null
  isEdit.value = false
  reloadingSeconds.value = 10
  currentTypeCheckInQt = 0
  selectedQTicket.value = null
}

const closeModal = () => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value)
  }
  clearAllStates()
  emits('close')
}
watch(isConfirmed, (newVal) => {
  if (newVal) {
    countdownInterval.value = setInterval(() => {
      if (reloadingSeconds.value > 0) {
        reloadingSeconds.value -= 1 // Decrease the countdown
      } else {
        clearInterval(countdownInterval.value) // Clear the interval when countdown ends
        location.reload() // Reloads the current page
      }
    }, 1000) // Update every second
  }
})

const petSelected = (id_pet: any) => {
  const existingPetIndex = selectedPet.value.findIndex((pet: any) => pet.id_pet == id_pet)

  if (existingPetIndex !== -1) {
    selectedPet.value.splice(existingPetIndex, 1)
  }
    
  if (selectedPets.value.includes(id_pet)) {
    const idx = selectedPets.value.indexOf(id_pet)
    selectedPets.value.splice(idx, 1)
    return
  }

  if (existingPetIndex !== -1) {
    selectedPet.value.splice(existingPetIndex, 1)
  } else {
    selectedPet.value.push({
      id_pet,
      selectedPurpose: [],
      selectedDoctor: [-1],
      purposeSelected_: null,
      doctorSelected_: null
    })
  }
  selectedPets.value.push(id_pet)
}

const purposeSelected = (value: any, selectedPet: any) => {
  const btnId = value
  const index = selectedPet.selectedPurpose.indexOf(btnId)

  if (index >= 0) {
    selectedPet.selectedPurpose.splice(index, 1)
  } else {
    selectedPet.selectedPurpose.push(btnId)
  }
  const filteredPurposes_ = getCliCommonQTVisitPurposeList.value.filter(
    (purpose) => {
      return selectedPet.selectedPurpose.includes(purpose.id_cli_common)
    }
  )
  purposeSelected_.value = filteredPurposes_.map((ps) => ps?.label).join(', ')
  selectedPet.purposeSelected_ = purposeSelected_.value
}


function processScreenTab() {
  // 1) Figure out which of these are selected/valid
  let petSelected = selectedPet.value.length > 0
  let purposeSelected = true
  let doctorSelected = true

  selectedPet.value.forEach((pet) => {
    if (!pet.selectedPurpose || pet.selectedPurpose.length === 0) {
      purposeSelected = false
    }
    if (!pet.selectedDoctor || pet.selectedDoctor.length === 0) {
      doctorSelected = false
    }
  });

  // 2) Advance screenTab one step at a time based on currentTypeCheckInQt
  switch (currentTypeCheckInQt) {
    // Example: "Create" scenario
    case 0:
      if (screenTab.value === 0 && isTodayRequestsDue.value && !isCreateQt.value) {
        screenTab.value = 1
        isTodayRequestsDue.value = false
        isPetSelected.value = true
        isEdit.value = true
        break
      }
      if (screenTab.value === 0 && isTodayRequestsDue.value && isCreateQt.value) {
        screenTab.value = 1
        isTodayRequestsDue.value = true
        isPetSelected.value = false
        selectedPets.value = []
        selectedPet.value = []
        isEdit.value = false
        break
      }
      if (screenTab.value === 1 && petSelected) {
        screenTab.value = 4
      }
      break

    default:
    case 1:
      console.log('screenTab.value', screenTab.value)
      console.log('isTodayRequestsDue.value', isTodayRequestsDue.value)
      console.log('isCreateQt.value', isCreateQt.value)
      console.log('petSelected', petSelected)
      if (screenTab.value === 0 && isTodayRequestsDue.value && isCreateQt.value) {
        screenTab.value = 1
        isPetSelected.value = false
        isTodayRequestsDue.value = false
        selectedPets.value = []
        selectedPet.value = []
        isEdit.value = false
        break
      }
      if (screenTab.value === 0 && isTodayRequestsDue.value && !isCreateQt.value) {
        screenTab.value = 1
        isPetSelected.value = true
        isTodayRequestsDue.value = true
        // selectedPets.value = []
        // selectedPet.value = []
        isEdit.value = true
        break
      }
      if (screenTab.value === 1 && petSelected) {
        screenTab.value = 2
      } else if (screenTab.value === 2 && purposeSelected) {
        screenTab.value = 3
      } else if (screenTab.value === 3 && doctorSelected) {
        screenTab.value = 4
      }
      break

    // Other cases
    case 2:
      if (screenTab.value === 0 && isTodayRequestsDue.value && isCreateQt.value) {
        screenTab.value = 1
        isPetSelected.value = false
        isTodayRequestsDue.value = false
        selectedPets.value = []
        selectedPet.value = []
        isEdit.value = false
        break
      }
      if (screenTab.value === 0 && isTodayRequestsDue.value && !isCreateQt.value) {
        screenTab.value = 1
        isPetSelected.value = true
        isTodayRequestsDue.value = true
        // selectedPets.value = []
        // selectedPet.value = []
        isEdit.value = true
        break
      }
      // If the logic for "case 2" is similar, do the same step-by-step approach.
      if (screenTab.value === 1 && petSelected) {
        screenTab.value = 2
      } else if (screenTab.value === 2 && purposeSelected) {
        screenTab.value = 4 // or 4, depending on your needs
      }
      break
  }
}



const goBack = () => {
  scrollToBodyTop()
  if (!isPetSelected.value) {
    closeModal()
    return
  }

  switch (currentTypeCheckInQt) {
    case 0:
      if (screenTab.value == 2) {
        screenTab.value = 1
        isPetSelected.value = false
      }
      if (screenTab.value == 4) {
        screenTab.value = 1
      }
      break

    default:
    case 1:
      if (screenTab.value == 2) {
        screenTab.value = 1
        isPetSelected.value = false
      }
      if (screenTab.value == 3) {
        screenTab.value = 2
      }
      if (screenTab.value == 4) {
        screenTab.value = 3
      }
      break

    case 2:
      if (screenTab.value == 2) {
        screenTab.value = 1
        isPetSelected.value = false
      }
      if (screenTab.value == 3) {
        screenTab.value = 2
      }
      if (screenTab.value == 4) {
        screenTab.value = 2
      }
      break
  }
}
const goForw = async () => {
  scrollToBodyTop()
  if (selectedPurposes.value.length !== 0) {
    const idClinic = localStorage.getItem('id_clinic')
    await employeeStore.fetchAvailableDoctorForQT({
      date: dayjs().format('YYYY-MM-DD'),
      id_clinic: idClinic!,
      id_clinic_common: selectedPurposes.value?.[0]
    })
  }
  console.log('currentTypeCheckInQt', currentTypeCheckInQt)

  if (!isPetSelected.value) {
    if (selectedPets.value.length === 0) {
      await mtUtils.autoCloseAlert('患者ペットさまを選択してください。')
      isPetSelected.value = false
      return
    }
    isPetSelected.value = true
    console.log('isPetSelected.value', isPetSelected.value)
    processScreenTab()
    return
  }

  if (currentTypeCheckInQt == 0) {

    processScreenTab()

  } else if (currentTypeCheckInQt == 1) {

    processScreenTab()

    selectedPet.value.forEach((pet: any) => {
      if (pet.selectedPurpose.length === 0) {
        isPurposeSelectedForPet.value = false
      }
    })

    if (!isPurposeSelectedForPet.value) {
      isPurposeSelected.value = false
      selectedPet.value.forEach((pet: any) => {
        if (pet.selectedPurpose.length === 0) {
          isPurposeSelectedForPet.value = true
        }
      })
      processScreenTab()
      await mtUtils.autoCloseAlert('来院目的を選択してください。')
      return
    }
  } else if (currentTypeCheckInQt == 2) {
    processScreenTab()
  } else if (currentTypeCheckInQt == 3) {
    processScreenTab()
  } else {

  }
}

const handleAutoRequestTitle = () => {
  const customer = props.data
  const selectedEmployeeDoctor = useEmployeeStore().getAllEmployees.find(
    (v: any) => v.value === JSON.parse(localStorage.getItem('id_employee'))
  )?.label
  const name_customer = concatenate(customer?.name_family, customer?.name_first)
  const fixedTextCustomer = name_customer ? ' 様 /' : ''
  const fixedTextDoctor = selectedEmployeeDoctor ? ' 先生' : ''
  const fixedTextStaff = selectedEmployeeDoctor ? '/ 担当: ' : ''
  return (
    getDateToday() +
    ' ' +
    customer?.code_customer +
    ' ' +
    name_customer +
    ' ' +
    (fixedTextCustomer ?? '') +
    ' ' +
    (selectedEmployeeDoctor ?? '') +
    (fixedTextDoctor ?? '') +
    ' ' +
    (fixedTextStaff
      ? fixedTextDoctor !== ''
        ? fixedTextStaff
        : fixedTextStaff.replace('/ ', '')
      : '') +
    (selectedEmployeeDoctor ?? '')
  )
}

const handleDoctorSelection = (selectedValue: any, pet: any) => {
  const index = pet.selectedDoctor.indexOf(selectedValue)

  const negativeEmployeeIdx = pet.selectedDoctor.indexOf(-1)

  if (selectedValue != -1 && negativeEmployeeIdx != -1) {
    pet.selectedDoctor.splice(negativeEmployeeIdx, 1)
  }

  if (index >= 0) {
    pet.selectedDoctor.splice(index, 1)
  } else {
    pet.selectedDoctor.push(selectedValue)
  }

  pet.doctorSelected_ = getEmployees.value.filter((employee: any) => pet.selectedDoctor.includes(employee.id_employee))
    .map((employee: any) => (employee.name_family + ' ' + employee.name_first)).join('、')
  
}

const confirmedPressed = async () => {
  const pet_name_ui = props.data.pets
    .filter((pt) => selectedPets.value.includes(pt.id_pet))
    .map((pet: any) => ({
      name_pet: pet.name_pet,
      id_pet: pet.id_pet
    }))

  let purposeId_ = getCliCommonQTVisitPurposeList.value.filter((data) => {
    return selectedPurposes.value.includes(data.id_cli_common)
  })
  
  let type_visit_purpose_ticket_ui = purposeId_
    .map((pId) => pId?.name_cli_common)
    .join(',')

  selectedPet.value = selectedPet.value.reduce((acc: any, p: any) => {
    acc[p.id_pet] = {
      id_pet: p.id_pet,
      type_purpose_list: p.selectedPurpose,
      type_doctor_list: p.selectedDoctor.filter((ed: any) => ed != -1)
    }
    return acc
  }, {})

  
  if (isTodayRequestsDue.value) {
    const data = {
      pet_name_ui: pet_name_ui,
      type_visit_purpose_ticket_ui: type_visit_purpose_ticket_ui,
      type_visit_purpose_ticket: selectedPurposes.value,
      id_pet: selectedPets.value,
      title_request: handleAutoRequestTitle(),
      ...qTicketRaw,
      type_status_queue_ticket: 2,
      id_employee: JSON.parse(localStorage.getItem('id_employee')),
      id_employee_doctor: null,
      queue_detail: selectedPet.value
    }

    await queueTicketStore.updateQueueTicketList(
      selectedQTicket.value.id_queue_ticket,
      data
    )
    isConfirmed.value = true
    isDoctorSelected.value = true
    number_queue_ticket.value = selectedQTicket.value.number_queue_ticket
  } else {
    const datetime_check_in = getDateTimeNow()

    const data = {
      pet_name_ui: pet_name_ui,
      type_visit_purpose_ticket_ui: type_visit_purpose_ticket_ui,
      title_request: handleAutoRequestTitle(),
      id_customer: props.data.id_customer,
      code_customer: props.data.code_customer,
      id_pet: selectedPets.value,
      datetime_issued: datetime_check_in,
      datetime_check_in: datetime_check_in,
      type_visit_purpose_ticket: selectedPurposes.value,
      ...qTicketRaw,
      id_employee_doctor: null,
      queue_detail: selectedPet.value
    }

    const response = await mtUtils.promiseAllWithLoader([
      queueTicketStore.fetchQueueTicketList({ today: true }),
      await useRequestStore().fetchBookingRequest({
        id_customer: props.data.id_customer,
        flg_booking: true
      })
    ])

    let requestList = null

    const existingQueueTicket = queueTicketStore.getQueueTicketLists.find(
      (qt) =>
        qt.id_customer == props.data.id_customer &&
        !(
          qt?.type_status_queue_ticket == 90 ||
          qt?.type_status_queue_ticket == 99
        ) &&
        qt.type_status_queue_ticket == 4
    )

    if (response && response.length > 0) requestList = response[1]

    if (existingQueueTicket && requestList && requestList.length > 0) {
      const updateData = {
        id_queue_ticket: existingQueueTicket.id_queue_ticket
      }
      await useRequestStore().updateRequest(
        requestList[0].id_request,
        updateData
      )
    }

    if (existingQueueTicket) {
      const updateData = {
        ...existingQueueTicket,
        type_status_queue_ticket: 2,
        title_request: handleAutoRequestTitle(),
        id_employee: JSON.parse(localStorage.getItem('id_employee')),
        flg_absent_confirmed: false,
        flg_auto_absent_updated: false,
        datetime_absent: null,
        queue_detail: selectedPet.value
      }

      await queueTicketStore.updateQueueTicketList(
        existingQueueTicket.id_queue_ticket,
        updateData
      )
      if (existingQueueTicket.id_queue_ticket) {
        isConfirmed.value = true
        number_queue_ticket.value = existingQueueTicket.number_queue_ticket
      }
      return
    }

    await queueTicketStore.submitQueueTicketList(data)
    const Qticket: any = queueTicketStore.getRecentQueueTicketList

    if (Qticket.id_queue_ticket) {
      isConfirmed.value = true
      number_queue_ticket.value = Qticket.number_queue_ticket
    }
  }
  // startCountdown()
  queueTicketStore.clearAllStates()
}
const editQTickets = async (qticket: Object) => {
  const modelTitle = '対象患者を選択してください。'
  await mtUtils.smallPopup(SelectPetModal, {
    modelTitle,
    pets: pets.value,
    petList: qticket?.id_pet
  })

  qticket.petList = pets.value.filter((pt: any) =>
    qticket.id_pet.includes(pt.id_pet)
  )
  selectedPets.value = qticket.id_pet
  selectedQTicket.value = qticket
}

const getCustomerName = async () => {
  const customer = await customerStore.SearchCustomerByCode(
    props.data?.code_customer
  )
  if (customer) {
    customerName.value = customer.name_customer_display
  }
}

const getDoctorProfileImg = (employeeId: string | number): string => {
  const employee: EmployeeType | undefined = getEmployees.value.find(
    (emp: EmployeeType) => emp.id_employee === employeeId
  )
  return employee?.image_path1 ?? defaultDoctor
}

const loadImage = (id: string | number) => {
  const imageUrl = getDoctorProfileImg(id)

  const img = new Image()
  img.src = imageUrl

  img.onload = () => {
    doctorImages.value[id] = imageUrl
  }
  img.onerror = () => {
    doctorImages.value[id] = defaultDoctor
  }
}

const getSelectPurpose = (pet: any) => {
  const selectedPurposeIds = pet.selectedPurpose

  // Filter `getCliCommonQTVisitPurposeList` based on selected purposes
  const filteredPurposes_ = getCliCommonQTVisitPurposeList.value.filter(
    (purpose) => selectedPurposeIds.includes(purpose.id_cli_common)
  )

  // Extract `text1` values, split by comma, and filter out empty strings
  const list = filteredPurposes_
    .map((ps) => ps?.text1)
    .filter((item) => item !== '')
    .flatMap((item) => item.split(','))

  // Remove duplicates and update `filteredOccupation`
  return [...new Set(list)]
}

const customerName = ref('')

const handleBodyScroll = () => {
  showScrollTop.value = scrollContainer.value.$el.scrollTop > 50
}

const scrollToBodyTop = () => {
  if (scrollContainer.value) {
    scrollContainer.value.$el.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const getHeaderTitle = () => {
  if(screenTab.value == 0 && isTodayRequestsDue.value) return '既存の受付があります。'
  if(!isConfirmed.value && isPetSelected.value && ![0,1,2,3].includes(screenTab.value)) return '上記の受付内容をご確認ください。'
  if(!isConfirmed.value && !isPetSelected.value && !isTodayRequestsDue.value) {
    return '受診するペットを選択して、『次へ』ボタンを押してください。'
  }
  if(!isConfirmed.value && isPetSelected.value && [0,1,2,3].includes(screenTab.value)) {
    return '以下をご選択いただき、『次へ』ボタンを押してください。'
  }
}

onMounted(async () => {
  nextTick(() => {
    if(scrollContainer.value) {
      scrollContainer.value.$el.addEventListener('scroll', handleBodyScroll)
    }
  })

  getCustomerName()
  currentTypeCheckInQt = 1
  if (
    ClinicStore.getClinic.type_checkin_qt != undefined &&
    ClinicStore.getClinic.type_checkin_qt != null
  ) {
    currentTypeCheckInQt = ClinicStore.getClinic.type_checkin_qt
  }

  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [13] })
  pets.value = props.data.pets
  const typePurposeVisitList = getCliCommonQTVisitPurposeList.value

  for (let i = 0; i < typePurposeVisitList.length; i += 3) {
    purposeRows.value.push(typePurposeVisitList.slice(i, i + 3))
  }
  if (props.todayQtickets.length > 0) {
    // all cancelled tickets will be filtered.
    todayTicketList.value = props.todayQtickets?.filter(
      (ticket: any) =>
        !(
          ticket?.type_status_queue_ticket == 90 ||
          ticket?.type_status_queue_ticket == 99
        )
    )
    // after filteration of cancelled tickets, if there is one ticket remaining in list then user can't create another ticket on same day.
    if (todayTicketList.value?.length > 0) {
      isEdit.value = true
      isTodayRequestsDue.value = true
      selectedQTicket.value = todayTicketList.value[0]
      selectedPets.value = todayTicketList.value[0].id_pet

      Object.keys(todayTicketList.value[0].queue_detail).forEach(key => {
        // Convert key to a number if needed (assuming your keys are numeric IDs)
        const pet = todayTicketList.value[0].queue_detail[key]
        const temp = {
          id_pet: key,
          selectedPurpose: pet.type_purpose_list,
          selectedDoctor: pet.type_doctor_list && pet.type_doctor_list?.length > 0 ? pet.type_doctor_list : [-1],
          purposeSelected_: getCliCommonQTVisitPurposeList.value
            .filter((purpose) => {
              return pet.type_purpose_list.includes(purpose.id_cli_common)
            })
            .map((ps) => ps?.label).join('、 '),
          doctorSelected_: getEmployees.value.filter((employee: any) => pet.type_doctor_list.includes(employee.id_employee))
            .map((employee: any) => (employee.name_family + ' ' + employee.name_first)).join('、')
        }
        selectedPet.value.push(temp)
        selectedPets.value.push(key)
      })
      
    }
    return
  }
  if (pets.value && pets.value.length > 0) {
    // petSelected(pets.value[0].id_pet)
    return
  }

  await mtUtils.autoCloseAlert(
    'ペットのご登録がありません。\n受付にお問い合わせください。'
  )
})

onUnmounted(() => {
  if(scrollContainer.value) {
    scrollContainer.value.$el.removeEventListener('scroll', handleBodyScroll)
  }
})

watchEffect(() => {
  getEmployees.value.forEach((employee: EmployeeType) => {
    if (!doctorImages.value[employee.id_employee]) {
      loadImage(employee.id_employee)
    }
  })
})


</script>

<template>
  <q-card :style="{'height': isConfirmed ? '100%' : '', 'overflow': isConfirmed ? 'auto' : ''}">
      <q-card-section class="modal-head q-mx-md q-mt-sm">
        <span style="vertical-align: middle;" v-if="isTodayRequestsDue && !isPetSelected">Web </span>
        <span v-if="!isConfirmed" class="ellipsis header-title">{{ getHeaderTitle() }}</span>
        <span v-if="isConfirmed">受付完了</span>
      </q-card-section>
        
      <q-card-section
       ref="scrollContainer"
       class="checkin-general-style q-mt-md content" :style="{ 'height' : isConfirmed ? 'unset' : `calc(100dvh - ${(isPetSelected && screenTab == 4) ? '345px' : '265px'})`}">

                         <!-- YES NO -->
        <div v-if="screenTab == 0" class="row justify-around gap-4">
          <div class="col-12">
            <hr />
          </div>
          <q-btn
            :outline="!isCreateQt"
            class="option-default col"
            color="blue-grey-10"
            label="新規受付"
            @click="()=> {
              isCreateQt = true;
              goForw()
            }"
          />
          <q-btn
            :outline="isCreateQt"
            class="option-default col"
            color="blue-grey-10"
            label="受付の編集"
            @click="()=> {
              isCreateQt = false;
              goForw()
            }"
          />
        </div>
        
        <div v-if="!isConfirmed && !isPetSelected" class="modal-mid">
          <span>{{ customerName }}</span>
          <span class="qt-modal-font20 q-ml-md">さま</span>
          <hr />
        </div>

        <!--ペット選択後-->
        <div v-if="!isConfirmed && isPetSelected" class="modal-mid">
          <span>{{ customerName }}</span>
          <span v-if="currentTypeCheckInQt != 0" class="qt-modal-font20 q-ml-md">さま</span>
          <div
            v-if="!isConfirmed && ![0,1,2,3].includes(screenTab)"
            class="text-center"
          >
            <hr class="q-ma-md" />
            <div class="row q-col-gutter-md">
            <div
              v-for="(pet, idx) in selectedPet" v-if="isPetSelected === true"
              :key="pet.id_pet"
              class="select-section col-md-4"
            >
              <hr class="divider" v-if="idx !== 0" />
              <div class="col-12 qt-modal-font20">
                <p class="qt-modal-font20">
                  <span class="text-grey-600">ペット名：</span>
                  <span class="q-ml-lg qt-modal-font20">{{ pets.find((p: any) => p.id_pet == pet.id_pet)?.name_pet
                    }}</span>
                </p>
                <div v-if="pet.purposeSelected_">
                  <span class="text-grey-600 q-mr-md">来院目的：</span>
                  <span>{{ pet.purposeSelected_ }}</span>
                </div>
                <div v-if="pet.doctorSelected_">
                  <span class="text-grey-600 q-mr-md">担当者：</span>
                  <span>{{ pet.doctorSelected_ ?? '指名なし' }}</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div
          v-if="isTodayRequestsDue && !isPetSelected"
        >
          <div
            v-for="(qticket, index) in todayTicketList"
            :key="index"
            class="qticket-row"
          >
            <div class="row justify-space">
              <div class="col-12">
                <p class="qt-modal-font20">
                  受付番号：
                  <span class="q-ml-lg qt-modal-font25">{{ qticket.number_queue_ticket }}</span>
                </p>
              </div>
              <div class="col-12 qt-modal-font20">
                <p class="qt-modal-font20">
                  ペット名：
                  <span class="q-ml-lg qt-modal-font20">
                    {{ qticket.petList.map((pt: any) => pt?.name_pet).join(', ') }}
                  </span>
                </p>
              </div>
            </div>
            <hr />
          </div>
        </div>

        <!-- PET SELECTION -->
        <div v-if="screenTab == 1" class="pet-select">
          <div class="row">
            <section
              v-for="pet in pets"
              :key="pet.id_pet"
              class="row q-pa-sm"
              style="min-width: 33%"
            >
              <q-btn
                :label="pet.name_pet"
                :outline="!selectedPets.includes(pet.id_pet)"
                color="blue-grey-10"
                class="option-default col"
                @click="petSelected(pet?.id_pet)"
              />
            </section>
          </div>
        </div>

        <!-- PURPOSE SELECTION --><!--style="height: 150px;overflow-y: auto;"-->
        <div
          v-for="pet in selectedPet" v-if="isPetSelected === true &&  screenTab == 2"
          :key="pet.id_pet"
          class="select-section"
        >
          <div class="col-12 qt-modal-font20">
            <p class="qt-modal-font20">
              ペット名：
              <span class="q-ml-lg qt-modal-font20">{{ pets.find((p: any) => p.id_pet == pet.id_pet)?.name_pet }}</span>
            </p>
          </div>
          <div v-if="isDoctorSelected && pet.doctorSelected_">
            <span class="text-grey-600 q-mr-md">担当者：</span>
            <span>{{ pet.doctorSelected_ }}</span>
          </div>
          <div v-if="isPurposeSelectedForPet && pet.purposeSelected_">
            <span class="text-grey-600 q-mr-md">来院目的：</span>
            <span>{{ pet.purposeSelected_ }}</span>
          </div>
          <div
            v-for="(row, index) in purposeRows"
            :key="index"
            class="purpose-row"
          >
            <q-btn
              v-for="purpose in row"
              :key="purpose.value"
              :label="purpose.label"
              :outline="!pet.selectedPurpose.includes(purpose.id_cli_common)"
              color="blue-grey-10"
              class="option-default"
              @click="purposeSelected(purpose.id_cli_common, pet)"
            />
          </div>
          <hr v-if="!isConfirmed" class="q-ma-md" />
        </div>

        <!-- DOCTION SELECTION -->
        <div
          v-for="pet in selectedPet" :key="pet.id_pet"
          class="select-section"
        >
          <div v-if="!isConfirmed && currentTypeCheckInQt != 2 && screenTab == 3" class="col-12 qt-modal-font20">
            <p class="qt-modal-font20">
              ペット名：
              <span class="q-ml-lg qt-modal-font20">{{ pets.find((p: any) => p.id_pet == pet.id_pet)?.name_pet }}</span>
            </p>
          </div>
          <template v-if="!isConfirmed && currentTypeCheckInQt != 2 && screenTab == 3">
            <q-btn
              :outline="!pet.selectedDoctor.includes(-1)"
              class="option-default q-mt-md q-mr-md"
              color="blue-grey-10"
              @click="()=> {
                pet.selectedDoctor = []
                pet.selectedDoctor.push(-1)
                pet.doctorSelected_ = null
              }"
            >
              <div>指名なし</div>
            </q-btn>
            <q-btn
              v-for="occupation in getEmployees.filter((employee: any) => getSelectPurpose(pet).includes(employee.type_occupation ? employee.type_occupation?.toString() : ''))"
              :key="occupation.id_employee"
              :outline="!pet.selectedDoctor.includes(occupation.id_employee)"
              class="option-default q-mt-md q-mr-md"
              color="blue-grey-10"
              @click="handleDoctorSelection(occupation.id_employee, pet)"
            >
              <q-avatar class="q-mr-md" size="80px">
                <img :src="doctorImages[occupation.id_employee] ?? defaultDoctor" />
              </q-avatar>
              <div>
                {{ occupation.name_family + ' ' + occupation.name_first }}
              </div>
            </q-btn>
            <hr class="q-ma-md" />
          </template>
        </div>

        <div v-if="isConfirmed" class="qt-modal-font20 confirmation-view">
          <div>
            <span class="q-mr-xl text-grey-600">受付番号</span>
            <span class="confirmed-number-qt">{{ number_queue_ticket }}</span>
          </div>
          <p>診療内容によって診察の順番は前後する場合がございます。</p>
          <p>予めご了承ください。</p>
          <br />
          <p>{{ reloadingSeconds }} 秒後に切り替わります。</p>
        </div>

        <!--Last Screen-->
        <div
          v-if="
            isPetSelected &&
            isConfirmed
          "
          class="modal-footer-end-confimed"
        >
          <q-btn
            label="終了"
            color="light-blue-10"
            outline
            rounded
            size="lg"
            @click="closeModal"
          />
        </div>
      </q-card-section>

    <!--Modal Footer-->
    <q-card-actions
      v-if="!isConfirmed"
      class="q-bt bg-white row justify-between"
      full-width
    >
      <!--Process Screen-->
      <div
        class="modal-footer col"
        v-if="[0,1,2,3].includes(screenTab)"
      >
        <q-btn
          class="qt-modal-font20"
          flat
          icon="arrow_back"
          label="戻る"
          @click="goBack"
        />
        <q-btn
          class="qt-modal-font20"
          flat
          icon-right="arrow_forward"
          label="次へ"
          @click="goForw"
        />
      </div>
      <!--Confirmation Screen-->
      <div
        v-else-if="isPetSelected && screenTab == 4"
        class="col row justify-between modal-footer-end"
      >
        <q-btn
          label="やり直す"
          color="text-grey-800"
          outline
          rounded
          class="confirm-button-small"
          @click="closeModal"
        />
        <q-btn
          label="戻る"
          color="text-grey-800"
          outline
          rounded
          class="confirm-button-small"
          @click="goBack"
        />
        <q-btn
          label="受付する"
          rounded
          class="confirm-button"
          @click="confirmedPressed"
        />
      </div>
    </q-card-actions>
    <q-icon name="arrow_circle_up" v-if="showScrollTop" @click="scrollToBodyTop" class="scroll-top-btn" size="40px" />
  </q-card>
</template>

<style>
.checkin-general-style {
  font-size: 2.6rem;
  color: #111;
  line-height: 2;
  font-weight: 700;
  max-width: 100%;
  overflow-x: hidden;
}

.modal-head {
  text-align: center;
  background: #003866;
  color: #fff;
  font-weight: 700;
  font-size: 2.4rem;
  border-radius: 100px !important;
  max-width: 100%;
}

.modal-mid {
  margin: 0 auto;
  margin-top: 10px;
  width: calc(100% - 2rem);
  font-size: 2rem;
}

.select-section {
  width: 100%;
  .divider {
    @media screen and (min-width: 1024px) {
      display: none;
    }
  }
}

.option-default {
  border-radius: 100px;
  padding: 20px 45px !important;
  font-size: 2.2rem !important;
  font-weight: 700;
}

.pet-select {
  width: 100%;
  margin: 0 auto;
  padding: 1rem 0;
}

.qt-modal-font20 {
  font-size: 2rem;
}

.qt-modal-font25 {
  font-size: 2.5rem;
  font-weight: 700;
}

.pet-row {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 1rem;
}

.purpose-row {
  width: 95%;
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  gap: 10px;
  padding-bottom: 1rem;
}

.purpose-row > button {
  min-width: 30%;
  max-width: calc(100% - 20px);
}

.confirmation-view {
  margin: 0 auto;
  text-align: center;
}

.confirm-button {
  font-size: 3rem !important;
  padding: 15px;
  margin: 20px 10px;
  background: #003866;
  color: #fff;
}

.confirm-button-small {
  font-size: 2rem !important;
  width: 20% !important;
  margin: 10px !important;
}

.confirmed-number-qt {
  font-size: 8rem;
  font-weight: bolder;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  max-width: 100%;
  overflow-x: hidden;
}

.modal-footer-end {
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  max-width: 100%;
}

.modal-footer-end > button {
  width: 35%;
  max-width: calc(100% - 10px);
}

.modal-footer-end-confimed {
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
}

.modal-footer-end-confimed > button {
  width: 45%;
  max-width: calc(100% - 10px);
}
.scroll-top-btn {
  position: fixed;
  bottom: 120px;
  right: 30px;
  padding: 10px 15px;
  background: #003866;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: opacity 0.3s;
}
</style>

<style scoped>
.q-bt {
  border-top: 1px solid #e0e0e0;
}
.header-title {
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}
</style>
