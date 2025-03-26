<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
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
import { groupBy, orderBy } from 'lodash'

// Stores
import useEmployeeStore from '@/stores/employees'
import useCustomerStore from '@/stores/customers'
import useDoseStore from '@/stores/dose-frequencies'
import usePetBioStore from '@/stores/pet-bios'
import flgAllPrepared from '@/assets/img/request/flg_all_prepared.png'
import flgDelivered from '@/assets/img/request/flg_delivered.png'
import { useRouter } from 'vue-router'
import PrescriptionLargeDetailPocketList from './PrescriptionLargeDetailPocketList.vue'
import useIllnessHistoryStore from '@/stores/illness-history'
import { PrescriptionDetailType } from '@/types/types'

type PrescriptionDetailTypeWithChildItems = PrescriptionDetailType & {
  child_items: PrescriptionDetailType[];
};

// Lazy-loaded Components
const ViewPrescriptionModal = defineAsyncComponent(
  () => import('@/pages/request/prescription/ViewPrescriptionModal.vue')
)

// Store Instances
const router = useRouter()
const customersStore = useCustomerStore()
const employeeStore = useEmployeeStore()
const { getCustomer } = storeToRefs(customersStore)
const illnessHistoryStore = useIllnessHistoryStore()
const petBioStore = usePetBioStore()

const expanded = ref(true)

const props = defineProps({
  data: Object,
  request: Object,
  parentId: String,
  copy: {
    type: Boolean,
    default: true
  },
  rows: {
    type: Number,
    default: 4
  },
  left: { type: Boolean, default: false },
  expandable: {
    type: Boolean,
    default: true
  }
})
const emit = defineEmits(['refresh'])

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
  await mtUtils.mediumPopup(ViewPrescriptionModal, {
    prescriptionObj: prescription,
    id_pet: prescription.id_pet
  }, true)
  await router.replace({ name: 'RequestDetail' })
  event_bus.emit('reloadRight', true)
  refresh()
}

const refresh = async () => {
  emit('refresh')
}

const getPetIllnessHistoryName = (ids) => {
  return ids.map((id) => {
    const illness = illnessHistoryStore.getIllnessHistorys.find((ih) => ih.id_pet_illness_history == id)
    if (illness) {
      if (illness?.name_disease) return illness?.name_disease
      else return illness?.name_disease_free
    }
    return null
  }).join(', ')
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

const groupedServiceDetailPerPetList = (data: PrescriptionDetailTypeWithChildItems[]) => {
  const datas: PrescriptionDetailType[] = [];
  let lastType4: PrescriptionDetailTypeWithChildItems | null = null;

  data.forEach((element: any, key: number) => {
    if (data[key - 1] && element.id_prescription !== data[key - 1].id_prescription) lastType4 = null;

    if (element.type_detail === 5) {
      const child_items = data.filter((v: any) => v.id_prescription_detail_ref === element.id_prescription_detail);
      datas.push({
        ...element,
        datetime: formatDate(element.date_start),
        child_items: child_items
      });
    } else if (element.type_detail === 4) {
      const newItem = {
        ...element,
        datetime: formatDate(element.date_start),
        child_items: []
      }
      datas.push(newItem);
      lastType4 = newItem;
    } else if (!element.id_prescription_detail_ref) {
      if (lastType4) {
        lastType4.child_items.push(element);
      } else {
        datas.push({
          ...element,
          datetime: formatDate(element.date_start)
        });
      }
    }
  });

  const groupedData = groupBy(datas, 'datetime');
  return groupedData;
};

const openCreateCopyModal = async (prescription: any) => {
  if (!(prescription || props.request)) return
  const confirmation = await mtUtils.confirm(
    '同一条件で複製します。\n先生による内容確認を必ず行ってください。\n',
    '処方箋の複製',
    '現体重',
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

  if (confirmation && confirmation !== 'withNewWeight') {
    prescription.val_weight = petBioStore.getPetBioOptionDefault[0].val_weight
  }

  if (parseInt(prescription.val_weight) == 0) {
    await mtUtils.autoCloseAlert('体重を確認してください！')
  }

  handleAutoPrescriptionTitle(prescription)

  const response = await mtUtils.callApi(
    selectOptions.reqMethod.POST,
    'CreatePrescriptionCopy',
    {
      ...prescription,
      id_request_new: props.request.id_request
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
</script>

<template>
  <div
    v-if="props.data"
    :class="[prescriptionPocketListMainClass]"
  >
  <!--:style="left ? 'margin-right: 10px;' : ''"-->
    <div @click="openPrescriptionListModal(props.data)" class="cursor-pointer prescription-header-btn">
      <div class="flex justify-between">
        <div>
          <span
            v-if="props.data.flg_next_cart"
            class="field-label-free-color-small bg-grey-800 text-white prescription-header-btn-span"
            >次回
          </span>
          <span class="caption2 regular text-grey-700 q-mr-md">
            {{ props.data?.number_prescription }}
          </span>
          {{ petName(props.data?.id_pet) }}
          ({{
            props.data?.prescription_detail_list.filter((p) => !p.flg_group_title)
              ?.length
          }}) お薬
          <span class="caption1 regular text-grey-700 q-ml-md">
            処方医：
          </span>
          <span>
            {{ getEmployeeName(props.data?.id_employee_doctor) }}
          </span>

        </div>
        <div>
          <span class="caption2 regular text-grey-700 q-ml-sm">
            既往歴：{{ getPetIllnessHistoryName(props.data?.id_pet_illness_history) }}
          </span>
          <q-btn 
            v-if="props.expandable"
            flat
            round
            size="8px"
            class="q-ml-md"
            @click.stop="expanded = !expanded"
          >
            <q-icon :name="expanded ? 'expand_less' : 'expand_more'" size="sm" />
          </q-btn>
        </div>
      </div>
      <img
        v-if="props.data.flg_delivered && props.expandable"
        :src="flgDelivered"
        alt="delivered"
        width="75"
      />
      <img
        v-if="props.data.flg_all_prepared && props.data.flg_delivered == false && props.expandable"
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
        v-if="props.copy"
      />
    </div>
    <div
      v-if="expanded"
      class="row q-col-gutter-sm"
      v-for="(service, date) in groupedServiceDetailPerPetList(props.data.prescription_detail_list)"
    >
      <div class="caption1 regular divider q-mt-md q-ml-sm">
        <span class="text-weight-bold q-ml-sm">{{ date }}</span>
      </div>
      <div :class="props.rows == 4 ? 'col-lg-3 col-md-3 col-sm-6' : (props.rows == 3 ? 'col-lg-4 col-md-4 col-sm-6' : 'col-lg-6 col-md-6 col-sm-12')" v-for="item in service">
        <PrescriptionLargeDetailPocketList
          :data="item"
          :prescription="props.data"
          @refresh="refresh"
        />
      </div>
    </div>
  </div>
  <p v-else class="q-pl-md text-grey-500">処方箋はありません</p>
</template>
<style lang="scss" scoped>
.prescription-header-btn {
  // background-color: #e9efff;
  background-color: rgb(231, 231, 231);
  text-align: center;
  padding: 10px 10px;
  border-radius: 5px;
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
</style>
