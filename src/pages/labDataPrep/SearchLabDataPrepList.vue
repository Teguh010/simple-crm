<script setup lang="ts">
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import { onMounted, ref } from 'vue'
import MtFormPullDown from '@/components/form/MtFormPullDown.vue'
import useLabResultStore from '@/stores/lab-results'
import { storeToRefs } from 'pinia'
import { formatDateWithTime, getDateToday, getDaysBefore } from '@/utils/aahUtils'
import { typeLabProcess } from '@/utils/enum'
import GroupedLabDataPrepListModal from './GroupedLabDataPrepListModal.vue'
import mtUtils from '@/utils/mtUtils'
import useLabStore from '@/stores/labs'
import LabDataPrepServiceDetailSelectModal from './LabDataPrepServiceDetailSelectModal.vue'
import useCommonStore from '@/stores/common'
import useServiceDetailStore from '@/stores/service-details'
import UpdateServiceDetailModal from '../request/serviceDetail/UpdateServiceDetailModal.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const labResultStore = useLabResultStore()
const labStore = useLabStore()
const commonStore = useCommonStore()
const serviceDetailStore = useServiceDetailStore()
const { getLabResultPrepListGrouped } = storeToRefs(labResultStore)

const columns = [ 
  { name: 'type_lab_process', label: '処理区分', field: 'type_lab_process', align: 'left', style: 'width: 10%' },
  { name: 'id_cm_device', label: '検査機器CD', field: 'id_cm_device', align: 'left', style: 'width: 10%' },
  { name: 'name_device', label: '検査機器名', field: 'name_device', align: 'left', style: 'width: 30%' },
  { name: 'datetime_registered', label: '実施日時', field: 'datetime_registered', align: 'left', style: 'width: 10%' },
  { name: 'action', label: '', field: 'action', align: 'center', style: 'width: auto' },
  { name: 'instpet_info', label: '', field: 'instpet_info', align: 'center', style: 'width: auto' }
]
const searchParams = ref({
  type_lab_process: 2,
  datetime_start_ui: getDaysBefore(1),
  datetime_end_ui: getDateToday(),
})

// const getServiceDetail = (id_service_detail: string) => serviceDetailStore.getAllServiceDetails.find((v: ServiceDetailType) => v.id_service_detail == id_service_detail)
const getDevice = (id_cm_device: number) => commonStore.getCommonDeviceOptionList.find((v: any) => v.id_common == id_cm_device)
const getPetName = (petId: string) => getCustomer.value?.pets?.find((pet) => pet?.value == petId)?.label

const openServiceDetailSelect = async (row)=>{
  await mtUtils.mediumPopup(LabDataPrepServiceDetailSelectModal, {
    auto_update: true,
    row,
    callback: groupedModalCallback,
  }) 
}

const searchData = async () => {
  await labResultStore.fetchLabDataPrepList(searchParams.value)
  // console.log(getLabResultPrepListGrouped.value)
}

const onRowClick = async (row) => {
  const prepData = {
    id_lab_raw: row.id_lab_raw,
    type_lab_process: row.type_lab_process,
  }
  await labResultStore.fetchLabDataPrepListDetail(prepData)
  await mtUtils.popup(GroupedLabDataPrepListModal, {
    grouped_data: row,
    callback: groupedModalCallback,
  })
}
const onServiceDetailClick = async (id_service_detail: string) => {
  serviceDetailStore.fetchServiceDetailById(id_service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
}

const onNumberRequestClick = (value: number) => {
  if (value) {
    const route = router.resolve({
      name: 'RequestDetail',
      params: { id: value }
    })
    window.open(route.href, '_blank')
  }
}

const groupedModalCallback = () => {
  searchData()
}

onMounted(async () => {
  await Promise.all([
    labStore.fetchPreparationLabs(),
    // serviceDetailStore.fetchAllServiceDetails({
    //   datetime_service_start: getDaysBefore(7),
    //   datetime_service_end: getDateToday(),
    // }),
    searchData()
  ])
})
</script>

<template>
  <q-page :style="{ 'min-height': 'unset !important' }">
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          検査結果の取込
        </q-toolbar-title>
        <div class="flex items-center">
          <MtFormPullDown
            outlined
            v-model="searchParams.type_lab_process"
            :options="typeLabProcess"
            class="q-mx-sm"
          />
          <div class="flex items-center no-wrap">
            <MtFormInputDate 
              v-model:date="searchParams.datetime_start_ui" 
              outlined type="date" 
              label="検査日: Start"
              @update:date="()=>searchParams.datetime_end_ui = searchParams.datetime_start_ui"
            />
            <MtFormInputDate 
              v-model:date="searchParams.datetime_end_ui" 
              outlined 
              label="検査日: End"
              type="date" 
              class="q-mx-sm" 
            />
          </div>
          <q-btn
            unelevated
            @click="searchData"
            color="accent-800"
            text-color="white"
          >
            <q-icon size="20px" name="search" />検索
          </q-btn>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="q-mt-sm">
      <MtTable2
        :columns="columns"
        :rows="getLabResultPrepListGrouped"
        :rowsBg="true"
        class="custody-table"
        :style="{ height: 'calc(100vh - 90px)', boxShadow: 'none' }"
      >
        <template v-slot:row="{ row }" >
          <td v-for="(col, index) in columns" :key="index" @click="onRowClick(row)">
            <div auto-width class="fit">
              <div v-if="col.field === 'type_lab_process'">
                <div class="body1 regular text-grey-900"> {{ typeLabProcess.find((item)=>item.value === row.type_lab_process)?.label }}</div>
              </div>
              <div v-if="col.field === 'id_cm_device'">
                <div class="body1 regular text-grey-900"> {{ getDevice(row.id_cm_device)?.code_func1 }}</div>
              </div>
              <div v-if="col.field === 'name_device'">
                <div class="body1 regular text-grey-900 ellipsis"> {{ row.name_device }}</div>
              </div>
              <div v-if="col.field === 'datetime_registered'">
                <div class="body1 regular text-grey-900"> {{ formatDateWithTime(row.datetime_registered) }}</div>
              </div>
              <div v-if="col.field === 'action'">
                <template v-if="row.type_lab_process == 1 && row.id_service_detail && row.id_service_detail__number_service_detail">
                  <div class="flex justify-center">
                    <div @click.stop="onNumberRequestClick(row.id_service_detail__id_request)" class="text-blue cursor-pointer">
                      {{ row.id_service_detail__id_request__number_request }}
                    </div>
                    <div @click.stop="onServiceDetailClick(row.id_service_detail)" class="text-blue cursor-pointer q-ml-md">
                      {{ row.id_service_detail__number_service_detail }}
                    </div>
                    <div class="q-ml-md">
                      {{ row.id_service_detail__id_customer__code_customer }}
                    </div>
                    <div class="q-ml-md">
                      {{ row.id_service_detail__id_customer__name_customer_display }}
                    </div>
                    <div class="q-ml-md">
                      {{ row.id_service_detail__id_pet__code_pet }}
                    </div>
                    <div class="q-ml-md">
                      {{ row.id_service_detail__id_pet__name_pet }}
                    </div>
                  </div>
                </template>
                <q-btn v-else outline class="bg-grey-100 text-grey-800" @click.stop="openServiceDetailSelect(row)">
                  <span>連携検索</span>
                </q-btn>
              </div>
              <div v-if="col.field === 'instpet_info'">
                <div class="flex no-wrap">
                  <div v-if="row?.instpet_info" class="body1 q-mr-md regular text-grey-900">
                    {{ row.instpet_info ? row.instpet_info : '' }}
                  </div>
                  <div v-if="row?.id_pet__name_pet" class="body1 regular text-grey-900">
                    {{ row.id_pet__name_pet ? row.id_pet__name_pet : '' }}
                  </div>
                  <div v-if="!row?.instpet_info && row.id_lab_raw__json_lab && row.id_lab_raw__json_lab.SampleID"
                       class="flex no-wrap body1 regular text-grey-900">
                    {{ row?.id_lab_raw__json_lab.SampleID }}
                  </div>
                </div>
              </div>
            </div>
          </td>
        </template>
      </MtTable2>
    </div>
  </q-page>
</template>
