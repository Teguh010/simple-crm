<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'

// Utilities
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import { event_bus } from '@/utils/eventBus'
import {
  aahUtilsGetEmployeeName,
  calculateDate,
  formatDate,
  getDateToday,
  getFullPetNameWithoutHonorific,
  getPetFirstNameOnly
} from '@/utils/aahUtils'
import { groupBy } from 'lodash'

// Stores
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import useDoseStore from '@/stores/dose-frequencies'
import usePetBioStore from '@/stores/pet-bios'
import flgAllPrepared from '@/assets/img/request/flg_all_prepared.png'
import flgDelivered from '@/assets/img/request/flg_delivered.png'
import { useRouter } from 'vue-router'
import PrescriptionDetailPocketList from './PrescriptionDetailPocketList.vue'
import PrescriptionIsuComparisonModal from '@/pages/request/prescription/PrescriptionIsuComparisonModal.vue'

// Lazy-loaded Components
const ViewPrescriptionModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/ViewPrescriptionModal.vue')
)

// Store Instances
const router = useRouter()
const customersStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getCustomer } = storeToRefs(customersStore)
const doseStore = useDoseStore()
const petBioStore = usePetBioStore()

const props = defineProps({
  data: Object,
  request: Object,
  parentId: String,
  copy: {
    type: Boolean,
    default: true
  },
  left: { type: Boolean, default: false }
})

const getEmployeeName = (id_employee) => {
  return aahUtilsGetEmployeeName(employeeStore.getAllEmployees, id_employee)
}
const petName = (value: string | number) =>
  getPetFirstNameOnly(getCustomer.value?.pets?.find((v) => v.id_pet === value))

const openPrescriptionListModal = async (prescription: any) => {
  await router.replace({
    name: 'RequestDetailPrescription',
    query: { id_prescription: prescription.id_prescription }
  })
  await mtUtils.popup(ViewPrescriptionModal, {
    prescriptionObj: prescription,
    id_pet: prescription.id_pet
  }, true)
  await router.replace({ name: 'RequestDetail' })
  event_bus.emit('reloadRight', true)
}

const handleAutoPrescriptionTitle = (prescriptionHeader, value: any = null) => {
  const date_start = prescriptionHeader.date_start
  const date_end = prescriptionHeader.date_end ?? ''
  if (date_end == '') {
    prescriptionHeader.title_prescription = `${getFullPetNameWithoutHonorific(
      customersStore.getCustomer?.pets?.find(
        (petObj: any) => petObj.id_pet === prescriptionHeader.id_pet
      ),
      customersStore.getCustomer
    )} 様 の処方箋（ ${date_start} ）`
    return
  }
  prescriptionHeader.title_prescription = `${getFullPetNameWithoutHonorific(
    customersStore.getCustomer?.pets?.find(
      (petObj: any) => petObj.id_pet === prescriptionHeader.id_pet
    ),
    customersStore.getCustomer
  )} 様 の処方箋（ ${date_start} ～  ${date_end} ）`
}

const groupedServiceDetailPerPetList = (data) => {
  return groupBy(
    data
      .map((pd: any) => ({
        ...pd,
        datetime: pd.id_prescription_detail_ref
          ? formatDate(
              data.find(
                (v) => v.id_prescription_detail == pd.id_prescription_detail_ref
              )?.date_start
            )
          : formatDate(pd.date_start)
      }))
      .sort(
        (a, b) =>
          new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
      ),
    'datetime'
  )
}

const openCreateCopyModal = async (prescription: any) => {
  if (!(prescription || props.request)) return
  const confirmation = await mtUtils.confirm(
    '処方箋を複製します。\n先生による内容確認を行ってください。\n',
    '処方箋の複製',
    '現体重計算 (そのまま複製)',
    null,
    null,
    { label: '以前体重', action: 'withNewWeight', show: true }
  )

  if (!confirmation) return


  prescription.date_start = getDateToday()
  prescription.date_end = calculateDate(
    getDateToday(),
    prescription.total_days_dose
  )

  if (confirmation && confirmation == 'withNewWeight') {
    prescription.val_weight = petBioStore.getPetBioForHeader?.val_weight
    if (!petBioStore.getPetBioForHeader?.val_weight) {
      await mtUtils.autoCloseAlert('ペットの体重（生体情報）が不正です。\nご確認ください。')
      return
    }
  }

  if (parseInt(prescription.val_weight) == 0) {
    await mtUtils.autoCloseAlert('体重を確認してください！')
  }

  let prescription_detail_assort_list = []

  if (confirmation && confirmation != 'withNewWeight') {
    const comparisonResponse = await mtUtils.callApi(selectOptions.reqMethod.POST, 'ISUComparison', {
      id_prescription: prescription.id_prescription
    })


    if (comparisonResponse && Object.values(comparisonResponse).length > 0) {
      await mtUtils.smallPopup(PrescriptionIsuComparisonModal, {
        comparisonResponse: comparisonResponse,
        prescriptionDetailList: prescription.prescription_detail_list,
        callBack: (param: any) => {
          if (param.submitted) {
            prescription_detail_assort_list = param.pA_list
          }
        }
      })
    }
  }
  
  handleAutoPrescriptionTitle(prescription)

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'CreatePrescriptionCopy',
    {
      ...prescription,
      id_request_new: props.request.id_request,
      copyWhole: confirmation != 'withNewWeight',
      prescription_detail_assort_price_list: prescription_detail_assort_list
    },
    false,
    {},
    true
  )

  if (response && response.data && response.data.code == '200') {
    event_bus.emit('reloadRight', true)
    await mtUtils.autoCloseAlert(response.data.message)
    return
  }
  await mtUtils.autoCloseAlert('Error : 複製に失敗しました。')
}

const prescriptionPocketListMainClass = computed((): string => {
  const className = 'q-mt-md  q-mb-md'
  if (props.data.flg_cancel) return `${className} cancel-notification-box`
  if (props.data.flg_delivered) return `${className} delivered-notification-box`
  return className
})
const activateDropdown = ref<string[]>([]);
const activateDropdownData = ref(true);

const toggleDropdown = (date: string) => {
  if (activateDropdown.value.includes(date)) {
    activateDropdown.value = activateDropdown.value.filter(d => d !== date);
  } else {
    activateDropdown.value.push(date);
  }
};

const toggleDropdownData = () => {
  if (activateDropdownData.value) {
    activateDropdown.value = [];
  } else {
    initializeDropdown();
  }
  activateDropdownData.value = !activateDropdownData.value;
};

const initializeDropdown = () => {
  if (props.data?.prescription_detail_list) {
    const dates = Object.keys(groupedServiceDetailPerPetList(props.data.prescription_detail_list) || {});
    activateDropdown.value = dates;
  }
};

onMounted(() => {
  initializeDropdown();
});
</script>

<template>
  <div
    v-if="props.data"
    :class="[prescriptionPocketListMainClass]"
    :style="left ? 'margin-right: 10px;' : ''"
  >
    <div>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center space-x-4">
          <q-btn
            class="cursor-pointer  q-my-sm prescription-header-btn"
            @click="openPrescriptionListModal(props.data)"
            flat
            unelevated
          >
            <span
              v-if="props.data.flg_next_cart"
              class="field-label-free-color-small text-bold bg-grey-800 text-white prescription-header-btn-span"
              >次回</span
            >
            {{ petName(props.data?.id_pet) }}
            ({{
              props.data?.prescription_detail_list.filter(
                (p) => !p.flg_group_title
              )?.length
            }}) お薬
          
          </q-btn>
          <small class="text-grey-700 q-ml-sm">
            処方医：{{ getEmployeeName(props.data?.id_employee_doctor) }}
          </small>
        </div>
        <div  v-if="props.parentId == 'right-detail-section'" class="flex items-center space-x-4">
          <small 
            class="text-bold text-grey-600 cursor-pointer" 
            style="margin-right: 20px;" 
            @click="toggleDropdownData"
          >
            {{ activateDropdownData ? '閉じる' : '開く' }}
          </small>
        </div>
        <img
          v-if="props.data.flg_delivered"
          :src="flgDelivered"
          alt="delivered"
          width="75"
        />
        <img
          v-if="props.data.flg_all_prepared && props.data.flg_delivered == false"
          :src="flgAllPrepared"
          alt="prepared"
          width="75"
        />
        <q-btn
          icon="content_copy"
          flat
          round
          unelevated
          class="text-grey-400 q-mr-md q-my-sm"
          padding="4px"
          @click="openCreateCopyModal(props.data)"
          v-if="copy"
        />
      </div>
    </div>
    <div>
      <template
        v-for="(service, date) in groupedServiceDetailPerPetList(
          props.data.prescription_detail_list
        )"
        :key="date"
      >
        <div 
          class="caption1 regular  flex items-center justify-between q-my-xs divider cursor-pointer"  
          @click="toggleDropdown(date)"
        >
          <span class="q-ml-sm">
            {{ date }} ({{ service.filter((item) => !item.flg_group_title)?.length }})
          </span>
          <q-icon 
          v-if="props.parentId == 'right-detail-section'"
          
            class="text-black q-px-sm" 
            :class="activateDropdown.includes(date) ? '' : 'rotate-180'" 
            name="keyboard_arrow_down" 
          />
        </div>
        <div v-if="props.parentId == 'right-detail-section'">
          <div v-if="activateDropdown.includes(date)">
          <template v-for="item in service">
            <PrescriptionDetailPocketList
              :data="item"
              :prescription="props.data"
              :left="left"
            />
          </template>
        </div>
        </div>
        <div v-else>
          <template v-for="item in service">
            <PrescriptionDetailPocketList
              :data="item"
              :prescription="props.data"
              :left="left"
            />
          </template>
        </div>
        
      </template>
    </div>

  </div>
  <p v-else class="q-pl-md text-grey-500">処方箋明細はありません</p>
</template>
<style lang="scss" scoped>
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

  &.no-left-border {
    border-left: 1px dotted rgb(227 227 227);
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
    // @media screen and (max-width: 1280px) {
    //   max-width: 15vw;
    // }
    // @media screen and (max-width: 960px) {
    //   max-width: 12vw;
    // }
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
  text-align: center;
  padding: 0px 10px;
}
.prescription-header-btn-span {
  height: 20px;
  display: flex;
  align-items: center;
  padding: 2px 8px;
}

// .prescription_group {
//   background-color: rgba(227, 241, 250, 0.7);
// }
.divider {
  width: 100%;
  padding: 5px 0 5px;
  background: $grey-100;
}

@media (min-width: 1024px) {
  .toggle-margin {
    margin-left: 20px; /* Larger margin for screens wider than 1024px */
  }
}
</style>
