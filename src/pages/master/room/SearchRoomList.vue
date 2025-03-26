<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import MtHeader from '@/components/layouts/MtHeader.vue'
import UpdateRoomModal from './UpdateRoomModal.vue'
import useRoomStore from '@/stores/rooms'
import mtUtils from '@/utils/mtUtils'
import useClinicStore from '@/stores/clinics'
import _ from 'lodash'
import router from '@/router'
import { setPageTitle } from '@/utils/pageTitleHelper'
const roomStore = useRoomStore()
const { getRooms } = storeToRefs(roomStore)
const clinicStore = useClinicStore()
const { getAllClinics } = storeToRefs(clinicStore)
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])
const storedClinic = JSON.parse(localStorage.getItem('clinic'))
const isReadOnly = ref(false)
const clinicId = ref('')

const mainRoomList = ref([])

const selectClinicId = async (value: any) => {
  if(value !== undefined){
    const list = getRooms.value
    mainRoomList.value = list
  }
}

const init = async () => {
  await clinicStore.fetchClinics()
  await roomStore.fetchRooms({ id_clinic: 'all' })
  clinicId.value = storedClinic.id_clinic
  if (clinicId.value) {
   await selectClinicId(clinicId.value)
    // mainRoomList.value = getRooms.value
  }
  if (getAllClinics.value) {
    let allClinics = [] as any
    const noFacilityArr = clinicStore.getClinics.filter((cli) => cli?.flg_facility === false)
    allClinics = getAllClinics.value.filter(clint => noFacilityArr.find(cli => cli?.id_clinic == clint?.value))
    allClinicList.value = [...allClinics]
    allClinicListDefault.push(...allClinics)
    if(allClinics.length < 2){
      isReadOnly.value = true
    }else{
      isReadOnly.value = false
    }
  }
}

const openAddModal = async () => {
  roomStore.selectRoom(null)
  await mtUtils.smallPopup(UpdateRoomModal)
  await init()
}
const onRowClick = async (data: any) => {
  await mtUtils.smallPopup(UpdateRoomModal, { data })
  await init()
}

function sortByHigherLevels(arr: any) {
  return arr?.sort((data: any, data1: any) => data?.level_floor < data1?.level_floor ? 1 : -1)
}

function getRoomLevels(arr: any) {
  const sortedArr = sortByHigherLevels(arr)
  // const finalArr = sortedArr?.length > 0 ? sortedArr[0].rooms : []
  let commonLevel = [] as any
  const levels = sortedArr.map((room: any) => room.level_floor);
  let uniqLevels = [... new Set(levels)]
  const result = uniqLevels.map((floorLevel) => {
    return {
      level: floorLevel,
      rooms: sortedArr.filter((room: any) => room?.level_floor === floorLevel)
    }
  })
  commonLevel = result
  return commonLevel
}

const getClinicName = (clinicId: any) => {
  return clinicStore.getClinics.find((clinic) => clinic?.id_clinic === clinicId)?.name_clinic_display
}

onMounted(async () => {
  // clinic store presist is false, because of that can't get clinic preparation data ontime, that's why calling preparation api here
  await clinicStore.fetchPreparatioClinic()
  await init()

  setPageTitle('部屋・区画一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          部屋・区画一覧
        </q-toolbar-title>
        <q-btn  class="q-mr-sm q-ba" unelevated padding="1px 2px" @click="router.push('/SearchClinicList')">
          <span class="q-px-md">病院・施設</span>
        </q-btn>
        <q-btn class="q-mr-sm q-ba" unelevated padding="1px 2px" @click="router.push('/SearchCageList')">
          <span class="q-px-md">ケージ</span>
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="primary"
          class="q-mx-md"
        >
          <q-icon size="20px" name="add" />部屋・区画
        </q-btn>
      </q-toolbar>
    </MtHeader>
    <div class="row items-center q-px-xl q-pb-xs q-mb-md bg-white full-width q-mt-lg" v-for="(arr, i) in mainRoomList" :key="i">
      <div
      class="row items-center justify-center parent bg-grey-400 full-width q-px-lg q-py-sm">
        <span>{{getClinicName(arr?.id_clinic) ? getClinicName(arr?.id_clinic) : 'Not passed '}}</span>
      </div>
    <div class="row items-center q-px-xl q-pb-xs q-mb-md bg-white full-width q-mt-lg" v-for="(levls , i) in getRoomLevels(arr?.rooms)" :key="i">
      <div
      class="row items-center justify-center parent bg-grey-200 full-width q-px-lg q-py-sm">
        <span> フロア {{levls?.level}} 階</span>
      </div>
      <div class="children justify-center flex items-center q-mt-md" v-if="levls.rooms && levls.rooms.length > 0">
        <q-btn
        v-for="(room, n) in levls.rooms"
        :key="n"
          padding="10px 20px"
          unelevated
          color="grey-200"
          text-color="grey-900"
          no-caps
          class="q-ml-md q-mb-md border-outline-600 border-radius"
          @click="onRowClick(room)"
        >
        <div>
          <span>{{ room?.name_room}}</span>
        </div>
        </q-btn>
      </div>
      <div v-else class="text-grey-500 q-mt-sm">
        部屋・区画はありません。
      </div>
      </div>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.width-400{
  max-width:400px;
}
</style>