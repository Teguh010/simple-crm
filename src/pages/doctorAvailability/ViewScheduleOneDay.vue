<script setup lang="ts">
import { computed, onMounted, ref, provide } from 'vue'
import mtUtils from '@/utils/mtUtils'
import ViewSds from './ViewSds.vue'
import useCustomerStore from '@/stores/customers'
import { storeToRefs } from 'pinia'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import useServiceDetailStore from '@/stores/service-details'
import useRequestStore from '@/stores/requests'
import useEmployeeStore from '@/stores/employees'
import UpdateClinicPlanModal from '@/pages/clinicPlan/UpdateClinicPlanModal.vue'
import ViewPrescriptionModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import MtTypeGenre from '@/components/MtTypeGenre.vue'
import _ from 'lodash'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'

const props = defineProps({
  selectedDate: '',
  bookingRequests: Object,
  typeBookingGenre: null,
  isLoading: false,
  selectedClinic: ''
})

const emit = defineEmits(['changeDate', 'updateOneDayView'])
const customerStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const serviceDetailStore = useServiceDetailStore()
const requestStore = useRequestStore()
const { getCustomerListOptions } = storeToRefs(customerStore)
const { getRequest } = storeToRefs(requestStore)
const { getRecentServiceDetail } = storeToRefs(serviceDetailStore)
const { getDoctors, getEmployees } = storeToRefs(employeeStore)
const tableLeftRows = ref({})
const rendered_sed = ref({})
const levelColors = ref([
  '#BB8FCE',
  '#5DADE2',
  '#73C6B6',
  '#DC7633',
  '#A1887F',
  '#EC407A'
])
const time_business = ref([])
const time_checkin = ref([])
const time_ticket_issue = ref([])
const trigger = ref(1)
const keyForUpdate = ref(0)
const wholeDayRecords = ref({})
const baseHeight = ref(0)
const bookingRequestsData = ref<any>([])

const renewData = async () => {
  emit('updateOneDayView')
}

const getAllServiceDetails = () => {
  let serviceDetailList = []
  let inserted = []
  bookingRequestsData.value.forEach((v: any) => {
    v.service_detail_list.forEach((serviceDetail: any) => {
      if (!serviceDetailList.includes(serviceDetail.id_service_detail)) {
        serviceDetailList.push(serviceDetail)
        inserted.push(serviceDetail.id_service_detail)
      }
    })
  })
  return serviceDetailList
}

const getAllClincalPlanDetails = () => {
  let clinicalPlanList = []
  let inserted = []
  bookingRequestsData.value.forEach((v: any) => {
    v.clinic_plan_list.forEach((clinicalPlan: any) => {
      if (!clinicalPlanList.includes(clinicalPlan.id_clinic_plan)) {
        clinicalPlanList.push(clinicalPlan)
        inserted.push(clinicalPlan.id_clinic_plan)
      }
    })
  })
  return clinicalPlanList
}

const getAllPrescriptionDetails = () => {
  let presList = []
  let inserted = []
  bookingRequestsData.value.forEach((v: any) => {
    v.prescription_list.forEach((pres: any) => {
      if (!presList.includes(pres.id_prescription)) {
        presList.push(pres)
        inserted.push(pres.id_prescription)
      }
    })
  })
  return presList
}

const getAllInjectDetails= () => {
  let injectDetailsList = []
  let inserted = []
  bookingRequestsData.value.forEach((v: any) => {
    v.inject_list.forEach((inj: any) => {
      if (!injectDetailsList.includes(inj.id_inject_detail)) {
        injectDetailsList.push(inj)
        inserted.push(inj.id_inject_detail)
      }
    })
  })
  // console.log(injectDetailsList)
  return injectDetailsList
}

const getServiceDetailsById = (id_service_detail: any) => {
  let serviceDetails = getAllServiceDetails()
  const sd = serviceDetails.find((item: any) => {
    return item.id_service_detail === id_service_detail
  })
  return sd
}

const getClinicPlanById = (id_clinic_plan: any) => {
  let clincalPlans = getAllClincalPlanDetails()
  const cp = clincalPlans.find((item: any) => {
    return item.id_clinic_plan === id_clinic_plan
  })
  return cp
}

const getPrescriptionById = (id_prescription: any) => {
  let prescriptionDetails = getAllPrescriptionDetails()
  const pd = prescriptionDetails.find((item: any) => {
    return item.id_prescription === id_prescription
  })
  return pd
}

const getInjectDetailById = (id_inject_detail: any) => {
  let injectDetails = getAllInjectDetails()
  const inj = injectDetails.find((item: any) => {
    return item.id_inject_detail === id_inject_detail
  })
  return inj
}

const openServiceDetailModal = async (service: any) => {
  await serviceDetailStore.fetchServiceDetails(service.id_request, {
    id_customer: service.id_customer
  })
  serviceDetailStore.selectServiceDetail(service.id_service_detail)
  await customerStore.selectPet(service.id_pet)
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateServiceDetailModal, {
    data: getRequest.value,
    callBackFromCalender: renewData,
    updatedFlg
  })
  if (updatedFlg.value) {
    service.datetime_service_start =
      getRecentServiceDetail.value?.datetime_service_start
  }
}

const onClinicPlanClick = async (id_clinic_plan) => {
  const cpd = getClinicPlanById(id_clinic_plan)
  let updatedFlg = { value: false }
  await mtUtils.mediumPopup(UpdateClinicPlanModal, {
    data: cpd,
    callBackFromCalender: renewData,
    updatedFlg: updatedFlg
  })
}

const openPrescriptionDetailModal = async (id_prescription: any) => {
  console.log(id_prescription)
  const prescription = getPrescriptionById(id_prescription)
  await mtUtils.mediumPopup(ViewPrescriptionModal, {
    requestDetailPage: prescription,
    id_pet: prescription.id_pet
  }, true)
}

const openInjectDetailModal = async (id_inject_dettail: any) => {
  const inject_detail = getInjectDetailById(id_inject_dettail)
  await customerStore.selectCustomer(inject_detail.id_customer,true)
  await mtUtils.mediumPopup(UpdInjectDetailModal, { injectDetail: inject_detail, injectObj:  inject_detail.inject})
}

const sortServiceDetail = (data) => {
  let sedArray = Object.entries(data)
  sedArray.sort((a, b) => a[1][0] - b[1][0])
  let sortedData = {}
  sedArray.forEach(([key, value]) => {
    sortedData[key] = value
  })
  return sortedData
}

const utilizeWholeDay = (datetime_start, datetime_end) => {
  const datetime_service_start = new Date(datetime_start)
  const datetime_service_end = new Date(datetime_end)
  if (
    datetime_service_start.getHours() == 0 &&
    datetime_service_end.getHours() == 24
  ) {
    return true
  } else if (
    datetime_service_start.getHours() == 0 &&
    datetime_service_end.getHours() == 0
  ) {
    return true
  } else {
    return false
  }
}

const afterCells = computed(() => {
  trigger
  const data = {}
  const doctors = employees.value
  wholeDayRecords.value = {}
  for (let d = 0; d < doctors.length; d++) {
    let doctor = doctors[d]
    data[doctor.id_employee] = {}
    wholeDayRecords.value[doctor.id_employee] = []
    for (let s = 0; s < bookingRequestsData.value.length; s++) {
      let br = bookingRequestsData.value[s]
      let serviceDetails = br?.service_detail_list?.filter(
        (v: any) => {
          return v.id_employee_doctor === doctor.id_employee
        }
      )
      for (let sd = 0; sd < serviceDetails?.length; sd++) {
        let sd_ = serviceDetails[sd]
        if (
          utilizeWholeDay(sd_.datetime_service_start, sd_.datetime_service_end)
        ) {
          if (
            !wholeDayRecords.value[doctor.id_employee].includes(
              sd_.id_service_detail
            )
          ) {
            wholeDayRecords.value[doctor.id_employee].push(
              sd_.id_service_detail
            )
          }
        } else {
          if (!data[doctor.id_employee][sd_.id_service_detail]) {
            data[doctor.id_employee][sd_.id_service_detail] = [br.hour]
          }
        }
      }

      let clincalPlans = br?.clinic_plan_list?.filter(
        (v: any) => v.id_employee === doctor.id_employee
      )
      for (let cp = 0; cp < clincalPlans?.length; cp++) {
        let cp_ = clincalPlans[cp]
        if (
          utilizeWholeDay(
            cp_.datetime_clinic_plan_start,
            cp_.datetime_clinic_plan_end
          )
        ) {
          if (
            !wholeDayRecords.value[doctor.id_employee].includes(
              cp_.id_clinic_plan
            )
          ) {
            wholeDayRecords.value[doctor.id_employee].push(cp_.id_clinic_plan)
          }
        } else {
          if (!data[doctor.id_employee][cp_.id_clinic_plan]) {
            data[doctor.id_employee][cp_.id_clinic_plan] = [br.hour]
          }
        }
      }

      let prescriptionDetails = br?.prescription_list?.filter(
        (v: any) => v.id_employee_doctor === doctor.id_employee
      )
      for (let pd = 0; pd < prescriptionDetails?.length; pd++) {
        let pd_ = prescriptionDetails[pd]
        if (
          !wholeDayRecords.value[doctor.id_employee].includes(
            pd_.id_prescription
          )
        ) {
          wholeDayRecords.value[doctor.id_employee].push(pd_.id_prescription)
        }
      }

      let InjectDetails = br?.inject_list?.filter(
        (v: any) => {
          return v.id_employee_doctor === doctor.id_employee
        }
      )
      for (let inj = 0; inj < InjectDetails?.length; inj++) {
        let inj_ = InjectDetails[inj]
        if (
          !wholeDayRecords.value[doctor.id_employee].includes(
            inj_.id_inject_detail
          )
        ) {
          wholeDayRecords.value[doctor.id_employee].push(inj_.id_inject_detail)
        }
      }
    }
    data[doctor.id_employee] = sortServiceDetail(data[doctor.id_employee])
  }

  return data
})

const setItemRef = (el, attr) => {
  if (el) {
    if (tableLeftRows.value.hasOwnProperty(attr)) {
      tableLeftRows.value[attr].push(el)
    } else tableLeftRows.value[attr] = [el]
  }
}

const applyVisibilityEffect = () => {
  setTimeout(() => {
    const eles = tableLeftRows.value
    const entries = Object.entries(eles)
    for (let i = 0; i < entries.length; i++) {
      const [className, value] = entries[i]
      const sdEles = document.getElementsByClassName(className)
      for (let j = 0; j < sdEles.length; j++) {
        if (sdEles[j].id === 'ser-No') {
          sdEles[j].style.display = 'none'
          let ele = sdEles[j].parentElement.parentElement?.querySelectorAll(
            'div[class^="level"]'
          )[0]
          ele.style.borderLeftColor = 'transparent'
        }
        if (Boolean(sdEles[j + 1])) {
          sdEles[j + 1].style.display = 'none'
        }
      }
    }

    let levelEles = document.querySelectorAll('div[class^="level"]')
    for (let i = 0; i < levelEles.length; i++) {
      if (levelEles[i].nextElementSibling?.firstChild.style.display == 'none') {
        levelEles[i].nextElementSibling.style.paddingTop = '0px'
        levelEles[i].style.height =
          levelEles[i].closest('td')?.clientHeight + 'px'
        baseHeight.value = levelEles[i].closest('td')?.clientHeight
      }
      try {
        if (
          levelEles[i].parentElement?.parentElement?.parentElement?.firstChild
            .style.display == 'none'
        ) {
          levelEles[i].style.height =
            levelEles[i].parentElement.parentElement.parentElement.parentElement
              ?.firstChild.clientHeight + 'px'
        }
        // else {
        //   levelEles[i].style.height = '3rem'
        // }
      } catch (error) {}
      if (levelEles[i].classList.contains('level-1')) {
        // levelEles[i].style.height =
        //   levelEles[i].closest('td')?.clientHeight + 'px'
        baseHeight.value = levelEles[i].closest('td')?.clientHeight
      }
      // levelEles[i].closest('td').style.borderBottom = '0px'
    }

    let maxLevel = 0
    let levelDivs = document.querySelectorAll('div[class^="level-"]')
    levelDivs.forEach((div) => {
      let levelClass = div.classList[0] // Get the first class name of the div
      let levelNumber = parseInt(levelClass.split('-')[1]) // Extract the level number
      if (levelNumber > maxLevel) {
        maxLevel = levelNumber
      }
      if (!div.style.borderLeft.includes('transparent')) {
        div.style.borderLeft = `1rem solid ${
          levelColors.value[levelNumber - 1]
        }`
      }
    })
  }, 100)
}

const getLevel_ = (serviceHour, doctor_, sds_index) => {
  let level = 1
  let currentserviceDetailArray = Object.entries(doctor_)[sds_index]
  let previousServiceDetailArray = Object.entries(doctor_)[sds_index - 1]
  if (rendered_sed.value.hasOwnProperty(currentserviceDetailArray[0])) {
    return [rendered_sed.value[currentserviceDetailArray[0]], true]
  }
  if (sds_index <= 0) {
    rendered_sed.value[currentserviceDetailArray[0]] = level
    return [level, false]
  } else {
    let hoursToWatch = previousServiceDetailArray[1]
    if (hoursToWatch.includes(serviceHour)) {
      level = sds_index + 1
    } else {
      level = 1
    }
    rendered_sed.value[currentserviceDetailArray[0]] = level
    return [level, false]
  }
}

function completeCounter(levelsList) {
  let oldLevel = []
  let i = 0
  let t = levelsList
  let maxLevel = -1
  while (Boolean(t[i].levels)) {
    if (t[i].level > maxLevel) {
      maxLevel = t[i].level
    }
    oldLevel.push([t[i].level, t[i].service_detail])
    t = t[i].levels
    if (!Boolean(t[i])) {
      break
    }
  }
  let newLevels = []
  let top = newLevels
  let level_index = 1
  while (level_index <= maxLevel) {
    let one = { level: level_index, levels: [] }
    let arr = oldLevel.filter((item: any) => {
      return item[0] == level_index
    })
    if (arr.length > 0) {
      one.service_detail = arr[0][1]
    } else {
      one.service_detail = 'No'
    }
    newLevels.push(one)
    newLevels = one.levels
    level_index += 1
  }
  return top
}

const getServiceDetailsWithLevel = (h, doctor_) => {
  let top = null
  let sds = []
  let allsds = Object.entries(doctor_)
  for (let i = 0; i < allsds.length; i++) {
    let sd = allsds[i]
    for (let hr = 0; hr < sd[1].length; hr++) {
      if (sd[1][hr] == h) {
        if (sds.length == 0) {
          if (top == null) {
            top = sds
          }
        }
        let levelarra = getLevel_(h, doctor_, i)
        let one = {
          level: levelarra[0],
          service_detail: sd[0],
          levels: []
        }
        sds.push(one)
        sds = one.levels
      }
    }
  }
  // sds = completeCounter(sds)
  if (top != null) {
    top = completeCounter(top)
  }
  return top
}

function getJapaneseMonthName(monthIndex) {
  const japaneseMonths = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月'
  ]
  const japaneseMonthName = japaneseMonths[monthIndex]
  return japaneseMonthName
}

const build_business_hour_time_var = () => {
  let currentDate = new Date(props.selectedDate)
  let bookingRequest = props.bookingRequests[0]
  const business_hour_slot_list = bookingRequest.business_hour_slot[0]
  for (let i = 0; i < 3; i++) {
    let t =
      business_hour_slot_list[`time_business_start${i + 1}`] +
      ' - ' +
      business_hour_slot_list[`time_business_end${i + 1}`]
    if (t.includes('null')) {
      continue
    }
    time_business.value.push(t)
  }
  for (let i = 0; i < 3; i++) {
    let t =
      business_hour_slot_list[`time_checkin_start${i + 1}`] +
      ' - ' +
      business_hour_slot_list[`time_checkin_end${i + 1}`]
    if (t.includes('null')) {
      continue
    }
    time_checkin.value.push(t)
  }
  for (let i = 0; i < 3; i++) {
    let t =
      business_hour_slot_list[`time_ticket_issue_start${i + 1}`] +
      ' - ' +
      business_hour_slot_list[`time_ticket_issue_end${i + 1}`]
    if (t.includes('null')) {
      continue
    }
    time_ticket_issue.value.push(t)
  }
}

const date_time_range = (_id) => {
  let details
  let startTime
  let endTime
  if (_id.startsWith('sed_')) {
    details = getServiceDetailsById(_id)
    if (!details) return ''
    startTime = new Date(details.datetime_service_start)
    endTime = new Date(details.datetime_service_end)
  } else if (_id.startsWith('clp_')) {
    details = getClinicPlanById(_id)
    if (!details) return ''
    startTime = new Date(details.datetime_clinic_plan_start)
    endTime = new Date(details.datetime_clinic_plan_end)
  } else if(_id.startsWith('pre_')) {
    details = getPrescriptionById(_id)
    if (!details) return ''
    startTime = new Date(details.date_start)
    endTime = new Date(details.date_end)
  }else{
    details = getInjectDetailById(_id)
    if (!details) return ''
    if(details.time_start){
      return '-'
    }else{
      let d = new Date(details.date_start)
      d.setTime(details.time_start)
    }
  }

  const startHour = startTime.getHours().toString().padStart(2, '0')
  const startMinute = startTime.getMinutes().toString().padStart(2, '0')

  const endHour = endTime.getHours().toString().padStart(2, '0')
  const endMinute = endTime.getMinutes().toString().padStart(2, '0')

  let timeRange = `${startHour}:${startMinute} - ${endHour}:${endMinute}`
  if (timeRange == '00:00 - 00:00') {
    timeRange = '00:00 - 23:00'
  }
  return timeRange
}

const touchStart = (touchEvent) => {
  if (touchEvent.changedTouches.length !== 1) {
    return
  }
  const posXStart = touchEvent.changedTouches[0].clientX
  addEventListener(
    'touchend',
    (touchEvent) => touchEndMethod(touchEvent, posXStart),
    { once: true }
  )
}

const touchEndMethod = (touchEvent, posXStart) => {
  if (touchEvent.changedTouches.length !== 1) {
    return
  }
  const posXEnd = touchEvent.changedTouches[0].clientX
  if (posXStart < posXEnd) {
    emit('changeDate', 'prev')
  } else if (posXStart > posXEnd) {
    emit('changeDate', 'next')
  }
}

const selectedDateDay = computed(() => {
  let date = new Date(props.selectedDate)
  let day = date.getDate()
  let m_index = date.getMonth()
  let m = getJapaneseMonthName(m_index)
  return `${m} ${day}日`
})

const employees = computed(() => {
  return getEmployees.value.filter((emp) => {
    return emp.flg_calendar
    // return true
  })
})

const prepareData = () => {
  let bookingRequest = props.bookingRequests[0]
  console.log(bookingRequest)
  for (let i = 0; i < 24; i++) {
    bookingRequestsData.value.push({hour: i, ...bookingRequest})
  }
}

onMounted(() => {
  if(props.bookingRequests) {
    prepareData()
    build_business_hour_time_var()
  }
})

const slotDetailText = (item_id) => {
  if (item_id.startsWith('sed_')) {
    const sd = getServiceDetailsById(item_id)
    return `${sd?.name_pet} - ${sd?.number_service_detail}`
  } else if (item_id.startsWith('clp_')) {
    const clpd = getClinicPlanById(item_id)
    return `${clpd?.title_clinic_plan}`
  } else if (item_id.startsWith('ijd_')){
    const inj = getInjectDetailById(item_id)
    return `${inj?.name_pet} - ${inj?.number_inject}`
  } else {
    const pre = getPrescriptionById(item_id)
    return `${pre?.name_pet} - ${pre?.number_prescription}`
  }
}
provide('setItemRef', setItemRef)
provide('openServiceDetailModal', openServiceDetailModal)
provide('onClinicPlanClick', onClinicPlanClick)
provide('openInjectDetailModal',openInjectDetailModal)
provide('openPrescriptionDetailModal', openPrescriptionDetailModal)
provide('getServiceDetailsById', getServiceDetailsById)
provide('getClinicPlanById', getClinicPlanById)
provide('getPrescriptionById', getPrescriptionById)
provide('date_time_range', date_time_range)
provide('slotDetailText', slotDetailText)
</script>

<template>
  <div class="information-header-container" :key="keyForUpdate">
    <div class="information-header">
      <div class="date-title bold text-grey-900">
        {{ selectedDateDay }}
      </div>
      <div class="" style="width: 1%">
        <div class="vl"></div>
      </div>
      <div class="slot-title text-grey-700">
        <div v-for="(tb, index) in time_business" :key="index">
          <div class="flex f-16" v-if="tb != null">
            <div>
              {{ '診療時間' + (index + 1) }}
            </div>
            <div class="q-ml-lg">
              {{ tb }}
            </div>
          </div>
        </div>
      </div>
      <div class="slot-title text-grey-700">
        <div v-for="(tb, index) in time_checkin" :key="index">
          <div class="flex f-16" v-if="tb != null">
            <div>
              {{ '受付時間' + (index + 1) }}
            </div>
            <div class="q-ml-lg">
              {{ tb }}
            </div>
          </div>
        </div>
      </div>
      <div class="slot-title text-grey-700">
        <div v-for="(tb, index) in time_ticket_issue" :key="index">
          <div class="flex f-16" v-if="tb != null">
            <div>
              {{ 'Web整理券' + (index + 1) }}
            </div>
            <div class="q-ml-lg">
              {{ tb }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <q-markup-table
    separator="cell"
    flat
    bordered
    class="schedule-table mb-5em"
    v-if="!props.isLoading"
  >
    <thead>
      <tr>
        <th class="text-center min-width bg-white"></th>
        <th 
          v-for="(data, d) in employees"
          :key="d"
          class="text-center text-white"
        >
          <span class="body1 regular">{{ data.name_display }}</span>
        </th>
      </tr>
    </thead>
    <tbody @touchstart="touchStart">
      <tr class="doctor-rows">
        <td class="q-pa-xl" style="padding-top: 0.7rem; padding: 2rem">
          <div class="items-center">
            <div class="bold text-grey-900 body1 no-time">終日</div>
          </div>
        </td>
        <td
          v-for="(w_d_doctor, wdd, wdIndex) in wholeDayRecords"
          :key="wdd"
          :class="
            Object.entries(w_d_doctor).length > 0
              ? 'wholeDayTd-' + (wdIndex + 1)
              : ''
          "
        >
          <div v-for="(item, item_index) in w_d_doctor" :key="item_index">
            <div
              class="flex body2 items-center q-mb-xs cursor-pointer service"
              @click="
                item.startsWith('sed_')
                  ? openServiceDetailModal(getServiceDetailsById(item))
                  : item.startsWith('clp_')
                  ? onClinicPlanClick(item)
                  : item.startsWith('pre_')
                  ? openPrescriptionDetailModal(item)
                  : openInjectDetailModal(item)
              "
            >
              <div>
                <q-badge
                  v-if="item.startsWith('sed_') || item.startsWith('pre_')"
                  :color="
                    item.startsWith('sed_')
                      ? getServiceDetailsById(item)?.badge?.color
                      : 'EC9819'
                  "
                  text-color="white"
                  :label="
                    item.startsWith('sed_')
                      ? getServiceDetailsById(item)?.badge?.label
                      : '薬'
                  "
                  rounded
                  class="custom-badge"
                />
                <MtTypeGenre
                  v-else
                  :type="getClinicPlanById(item)?.type_plan_status"
                />
              </div>
              <div>
                {{ slotDetailText(item) }}
              </div>
            </div>
          </div>
        </td>
      </tr>
      <tr
        v-for="(hours, h) in bookingRequestsData"
        class="doctor-rows"
        :key="h"
      >
        <td class="q-pa-xl" style="padding-top: 0.7rem; padding: 2rem">
          <div class="items-center">
            <div class="bold text-grey-900 body1 no-time">
              {{ hours.hour }} : 00
            </div>
          </div>
        </td>
        <td
          v-for="(doctor_, idx) in afterCells"
          :key="idx"
          class=""
          :style="{ padding: 0 }"
        >
          <div v-if="doctor_">
            <ViewSds
              :serviceDetails="getServiceDetailsWithLevel(h, doctor_)"
              :tableLeftRows="tableLeftRows"
              :levelColors="levelColors"
              :base-height="baseHeight"
            />
            {{}}
          </div>
        </td>
      </tr>
    </tbody>
    <div
      :ref="
        (el) => {
          applyVisibilityEffect()
        }
      "
    ></div>
  </q-markup-table>
</template>
<style lang="scss" scoped>
.information-header-container {
  padding: 8px 0;
  .information-header {
    display: flex;
    align-items: center;
    gap: 24px;
  }
}
.reduce-padding {
  padding-left: 4px;
  padding-right: 4px;
}
.custom-badge {
  padding: 4px;
  margin-left: 2px;
  margin-right: 2px;
}
.truncated {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  overflow: hidden;
  -webkit-line-clamp: 1;
  width: 330px !important;
  text-align: left;
  height: auto;
  word-wrap: break-word;
  white-space: normal !important;
  @media only screen and (max-width: 1300px) {
    width: 230px !important;
  }
}
.q-table tbody td:before {
  background: none !important;
}
.timeline {
  min-height: 50px;
}
.memo {
  width: 15px;
  height: 15px;
}
.custom-td-w {
  max-width: 200px;
}
.pres,
.service,
.clinic {
  display: grid;
  align-items: center;
  grid-template-columns: 25px 20px 20px;
  column-gap: 10px;
}
.clinic {
  grid-template-columns: 20px 35px 20px !important;
}
.min-width {
  width: 70px;
}
th {
  min-width: 300px;
}
.doctor-rows {
  padding: 0px !important;
}

.customCol {
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.customCell {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.doctor-col {
  border-left: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.doctor-header-cell {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.doctor-cell {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
td {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.levelContained {
  border-bottom: 0px solid transparent;
}
.level-2 {
  border-left-color: green;
}
.date-title {
  font-size: 20px;
}
.slot-title {
  font-size: 13px;
  margin-right: 40px;
}

.bold {
  font-weight: bold;
}
.vl {
  border-left: 1px solid gray;
  height: 3rem;
}
.f-20 {
  font-size: 20px;
}
.f-16 {
  font-size: 16px;
}
.wholeDayTd-1 {
  border-left: 1rem solid #424242;
}
.wholeDayTd-2 {
  border-left: 1rem solid #ec9819;
}
.wholeDayTd-3 {
  border-left: 1rem solid #3c7ad6;
}
.wholeDayTd-4 {
  border-left: 1rem solid #a569bd;
}
.schedule-table {
  height: 100%;
  max-height: calc(100vh - 220px);
  margin: 8px 0 0 0;
  tbody {
    /* height of all previous header rows */
    scroll-margin-top: 48px;
  }
  th {
    position: sticky !important;
    top: 0 !important;
    z-index: 2;
    background-color: #c1a14e;
    padding: 16px;
  }
}
</style>
