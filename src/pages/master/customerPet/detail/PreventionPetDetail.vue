<script setup lang="ts">
import useServiceDetailStore from '@/stores/service-details'
import { storeToRefs } from 'pinia'
import { onMounted, reactive, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import UpdateServiceDetailModal from '@/pages/request/serviceDetail/UpdateServiceDetailModal.vue'
import { date } from 'quasar'
import { event_bus } from '@/utils/eventBus'
import CreatePrescriptionListModal from '@/pages/request/prescription/ViewPrescriptionModal.vue'
import useCategoryStore from '@/stores/categories'
import { dateFormat, formatDate, formatDateWithTime, getDateToday } from '@/utils/aahUtils'
import usePetStore from '@/stores/pets'
import { typePrevention, typePreventionV1 } from '@/utils/enum'
import MtFormRadiobtn from '@/components/form/MtFormRadiobtn.vue'
import UpdInjectDetailModal from '@/pages/request/inject/UpdInjectDetailModal.vue'
import selectOptions from '@/utils/selectOptions'
import useIllnessHistoryStore from '@/stores/illness-history'
import UpdateIllnessHistoryModal from '@/pages/petInfo/illnessHistory/UpdateIllnessHistoryModal.vue'
import useCustomerStore from '@/stores/customers'
import { IllnessHistoryType } from '@/types/types'
import { isConvertibleToNumber } from '@/utils/typeGuards'
import PetPreventionScheduleTable from './PetPreventionScheduleTable.vue'

const props = defineProps({
  id_customer: String,
  id_pet: String,
  id_request: String,
  type_prevention: String
})
const serviceDetailStore = useServiceDetailStore()
const categoryStore = useCategoryStore()
const petStore = usePetStore()
const customerStore = useCustomerStore()
const illnessHistoryStore = useIllnessHistoryStore()

const { getPet } = storeToRefs(customerStore)
const { getPetPreventativeDetail } = storeToRefs(petStore)

const illnessHistoryList = ref([] as IllnessHistoryType[])
const yearPeriod = ref('3')
const illnessHistoryRef = ref()
const typePreventionRefs = reactive([] as any)
const setTypePreventionRef = (el: any) => {
  typePreventionRefs.push(el)
}
const typePreventionChange = async (index: number) => {
  if (index === -1) {
    console.log('Scrolling to illnessHistoryRef')
    illnessHistoryRef.value.$el.scrollIntoView({ behavior: 'smooth' })
    return
  }
  let nextIndex = index
  if (index === 2) {
    nextIndex = 3
  } else if (index === 3) {
    nextIndex = 4
  } else if (index === 4) {
    nextIndex = 1
  }
  const el = typePreventionRefs[nextIndex]
  if (el && (el.$el || el)) {
    const domElement = el.$el || el
    domElement.scrollIntoView({ behavior: 'smooth' })
  } else {
    console.warn('Element not found or invalid for index:', nextIndex)
  }
}
const filterYearPeriod = async () => {
  illnessHistoryList.value = []
  let startDate, endDate, currentDate
  if (yearPeriod.value === '1') {
    // set start date as first date of current year, end date as today
    endDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(endDate), {
        year: new Date(endDate).getFullYear(),
        month: 1,
        day: 1
      })
    )
  } else if (yearPeriod.value === '2') {
    // set start date as first date of previous year, end date as last date of previous year
    currentDate = getDateToday()
    startDate = dateFormat(
      date.adjustDate(new Date(currentDate), {
        year: new Date(currentDate).getFullYear() - 1,
        month: 1,
        day: 1
      })
    )
    endDate = dateFormat(
      date.adjustDate(new Date(currentDate), {
        year: new Date(currentDate).getFullYear() - 1,
        month: 12,
        day: 31
      })
    )
  }
  let dateRange = {}
  if (startDate && endDate)
    dateRange = { date_start: startDate, date_end: endDate }

  await Promise.all([
    petStore.fetchPetPreventativeDetail(
      props.id_customer!,
      props.id_pet!,
      dateRange
    ),
    illnessHistoryStore.fetchIllnessHistoryForPreventative({
      id_pet: props.id_pet,
      id_customer: props.id_customer,
      type_history: 2
    })
  ])

  illnessHistoryList.value = illnessHistoryStore.getAllPreventativeMedicine
}
const openUpdateIllnessHistoryModal = async (
  id_employee_doctor: string,
  id_pet_illness_history: string
) => {
  await mtUtils.mediumPopup(UpdateIllnessHistoryModal, {
    id_employee_doctor: id_employee_doctor,
    petSelected: getPet.value,
    id_pet_illness_history
  })
  await filterYearPeriod()
}

const openModal = async (preventative: any) => {
  if (preventative.id_service_detail) {
    await serviceDetailStore.fetchServiceDetailById(
      preventative.id_service_detail
    )
    await mtUtils.mediumPopup(UpdateServiceDetailModal, {})
  } else if (preventative.id_prescription) {
    await mtUtils.mediumPopup(CreatePrescriptionListModal, {
      prescriptionObj: preventative,
      id_pet: preventative.id_pet,
      fromPD: true,
      id_customer: props.id_customer
    }, true)
    event_bus.emit('reloadRight', true)
  }

  if (preventative.id_inject_detail) {
    const response: any = await mtUtils.callApi(
      selectOptions.reqMethod.GET,
      `SearchInjectList`,
      {
        id_inject: preventative.id_inject
      }
    )
    if (response && response.length && response.length > 0) {
      await mtUtils.mediumPopup(UpdInjectDetailModal, {
        injectDetail: preventative,
        response: response[0].request,
        injectObj: { ...response[0] }
      })
    }
  }
}

const isBitSet = (number: any, bitValue: any) => {
  return (number & bitValue) === bitValue
}

function filteredPetPreventativeDetails(
  typePreventionValue: any,
  all?: boolean
) {
  const preventativeDetailsList =
    (getPetPreventativeDetail.value as any)?.preventative_detail_list ?? []
  if (all) {
    return preventativeDetailsList ?? []
  }
  // Return only the rows where the type_prevention bit matches the current typePreventionValue
  return (
    preventativeDetailsList.filter((row: any) =>
      isBitSet(row.type_prevention, typePreventionValue)
    ) ?? []
  )
}

const typePreventionName = (value: number) =>
  typePreventionV1.find((v) => v.value === value)?.label

const categoryName = (value: number) =>
  categoryStore.getAllCategories.find((v) => v.value === value)

onMounted(async () => {
  await Promise.all([filterYearPeriod()])
  if (props.type_prevention) {
    typePreventionChange(
      isConvertibleToNumber(props.type_prevention)
        ? Number(props.type_prevention)
        : -1
    )
  }
})
</script>

<template>
  <q-scroll-area
    class="view-pet-modal-content-inner separate-scrollbar"
    style="width: 100%; max-width: 100%"
  >
    <div class="relative">
      <div
        class="ah-adjust-for-thumb-scroller flex justify-between full-width q-pr-lg z-top bg-white fixed-top item_divier_injects responsive-layout"
      >
        <div>
          <div class="flex">
            <q-btn
              flat
              class="q-br q-px-lg"
              label="対応歴"
              @click="typePreventionChange(-1)"
            />
            <q-btn
              v-for="(item, key) in typePrevention"
              flat
              class="q-br q-px-lg"
              :name="item.value"
              :label="item.label"
              @click="typePreventionChange(key)"
            />
          </div>
        </div>
        <div class="radio-buttons q-pr-sm">
          <MtFormRadiobtn
            label="今年"
            v-model="yearPeriod"
            val="1"
            @update:selected="filterYearPeriod"
          />
          <MtFormRadiobtn
            label="去年"
            v-model="yearPeriod"
            val="2"
            @update:selected="filterYearPeriod"
          />
          <MtFormRadiobtn
            label="全期間"
            v-model="yearPeriod"
            val="3"
            @update:selected="filterYearPeriod"
          />
        </div>
      </div>
      <hr />
      <div class="q-pt-xl q-mt-sm content-area">
        <q-list>
          <q-expansion-item
            ref="illnessHistoryRef"
            dense
            default-opened
            expand-icon-class="text-white"
            label="予防/健診歴"
            header-class="bg-grey-800 text-white header-label"
          >
            <div
              class="q-mb-xs"
              v-for="obj in illnessHistoryList"
              :key="obj.id_pet_illness_history"
              v-if="illnessHistoryList"
            >
              <UpdateIllnessHistoryModal
                :id_employee_doctor="obj.id_employee_doctor"
                :pet-selected="getPet"
                :id_pet_illness_history="obj.id_pet_illness_history.toString()"
                :viewOnly="true"
                @edit="
                  openUpdateIllnessHistoryModal(
                    obj.id_employee_doctor,
                    obj.id_pet_illness_history.toString()
                  )
                "
              />
            </div>
            <p v-else class="q-pt-md q-pl-md text-grey-500">登録がありません。</p>

            <div class="q-mb-xs">
              <div class="bg-grey-050 q-py-md q-px-md q-mb-xs">
                <div class="q-mb-sm">
                  <PetPreventionScheduleTable
                    :data="filteredPetPreventativeDetails(-1, true)"
                    @clickService="openModal"
                  />
                </div>
              </div>
            </div>
          </q-expansion-item>
          <q-expansion-item
            v-for="typePrevention in typePreventionV1"
            :ref="setTypePreventionRef"
            dense
            default-opened
            expand-icon-class="text-white"
            :label="typePreventionName(typePrevention.value)"
            header-class="bg-grey-800 text-white header-label"
          >
            <template
              v-if="
                filteredPetPreventativeDetails(typePrevention.value).length > 0
              "
            >
              <div
                v-for="preventative in filteredPetPreventativeDetails(
                  typePrevention.value
                )"
                @click="openModal(preventative)"
                class="q-mb-xs cursor-pointer"
              >
                <div class="bg-grey-050 q-py-md q-px-md q-mb-xs">
                  <div class="q-mb-sm">
                    <span class="title2 bold text-grey-900 q-mb-md">
                      {{
                        preventative.name_item_service ||
                        preventative.name_prescription_display ||
                        preventative.name_inject_display
                      }}
                    </span>
                    <span v-if="preventative.id_category1" class="q-ml-md">
                      <span class="caption2 regular text-grey-700">{{
                        categoryName(preventative.id_category1)?.label
                      }}</span>
                      <q-icon
                        name="arrow_right"
                        color="grey-700"
                        class="q-px-xs"
                      />
                      <span class="caption2 regular text-grey-700">{{
                        categoryName(preventative.id_category2)?.label
                      }}</span>
                    </span>
                  </div>
                  <div class="flex items-center q-mb-xs">
                    <span class="text-grey-700">
                      <template v-if="preventative.datetime_service_start">
                        {{ formatDate(preventative.datetime_service_start) }}
                        {{
                          preventative.datetime_service_end
                            ? ' - ' +
                              formatDate(preventative.datetime_service_end)
                            : ''
                        }}
                      </template>
                      <template v-else>
                        {{ formatDate(preventative.date_start) }}
                        {{
                          preventative.date_end
                            ? ' - ' + formatDate(preventative.date_end)
                            : ''
                        }}
                      </template>
                    </span>
                  </div>
                  <div
                    v-if="
                      preventative.booking &&
                      preventative.booking.datetime_booking_confirmed
                    "
                    class="row"
                  >
                    <div class="col text-grey-700">次回予定：{{ formatDateWithTime(preventative.booking.datetime_booking_confirmed) }}</div>
                  </div>
                  <div>
                    <p
                      class="caption2 regular text-grey-700 q-pt-xs q-mb-none ellipsis-2-lines"
                    >
                      {{ preventative.memo_service || '' }}
                    </p>
                  </div>
                </div>
              </div>
            </template>
            <p v-else class="q-pt-md q-pl-md text-grey-500">登録がありません。</p>
          </q-expansion-item>
        </q-list>
      </div>
    </div>
  </q-scroll-area>
</template>
<style scoped lang="scss">
:deep(.q-expansion-item) {
  scroll-margin-top: 3rem;
}
.content-area {
  margin-top: 40px;
}
.responsive-layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}

.radio-buttons {
  display: flex;
  gap: 8px;
}

.q-br.q-px-lg {
  font-size: 14px;
  padding: 8px 16px;
}
.item_divier_injects {
  cursor: pointer;
  border-left: 5px solid white;
  &:hover {
    background-color: rgba(241, 233, 255, 0.7);
  }

  &:active {
    background-color: rgba(241, 233, 255, 0.8);
  }

  &:focus {
    background-color: rgba(241, 233, 255, 0.9);
  }

  &.no-left-border {
    border-left: 1px dotted rgb(227 227 227);
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
@media screen and (max-width: 1200px) {
  .content-area {
    margin-top: 110px;
  }
}
</style>
