<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtInputForm from '@/components/form/MtInputForm.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import UpdateCageModal from './UpdateCageModal.vue'
import mtUtils from '@/utils/mtUtils'
import useCageStore from '@/stores/cages'
import { storeToRefs } from 'pinia'
import MtLabel from '@/components/MtLabel.vue'
import useRoomStore from '@/stores/rooms'
import useClinicStore from '@/stores/clinics'
import router from '@/router'
import { values } from 'lodash'
import { setPageTitle } from '@/utils/pageTitleHelper'

const cageStore = useCageStore()
const roomStore = useRoomStore()
const { getCages } = storeToRefs(cageStore)
const clinicStore = useClinicStore()
const { getAllClinics } = storeToRefs(clinicStore)
const id_room = ref('')
const flg_usable = ref(true)
const cageList = ref([])
const mainCageList = ref([])
const allRoomsList = ref<any[]>([])
const allRoomsListDefault = reactive<any[]>([])
const clinicId = ref('')
const allClinicList = ref<any>([])
const allClinicListDefault = reactive<any>([])
const storedClinic = JSON.parse(localStorage.getItem('id_clinic'))
const isReadOnly = ref(false)
const columns = [
  {
    name: 'code_cage',
    label: 'ケージCD',
    field: 'code_cage',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'id_room',
    label: '部屋',
    field: 'id_room',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'name_cage',
    label: 'ケージ名',
    field: 'name_cage',
    align: 'left',
    style: 'width: auto'
  },

  {
    name: 'clinic_name',
    label: 'クリニック名',
    field: 'clinic_name',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'flg_icu',
    label: 'ICU',
    field: 'flg_icu',
    align: 'left',
    style: 'width: auto'
  },
  {
    name: 'flg_usable',
    label: '使用可能',
    field: 'flg_usable',
    align: 'left',
    style: 'width: auto'
  }
]

// const typeRoomCageName = (value: any) =>
//   getAllRooms.value.find((v) => v.value === value)?.label

const openAddModal = async () => {
  cageStore.selectCage(null)
  await mtUtils.smallPopup(UpdateCageModal)
  await search()
}

const onRowClick = async (data: any) => {
  await mtUtils.smallPopup(UpdateCageModal, { data })
  await search()
}
const search = async () => {
  await cageStore
    .fetchCages({
      id_room: id_room.value ? id_room.value : null,
      flg_usable: flg_usable.value,
      id_clinic: clinicId.value
    })

  if (getCages.value) {
    cageList.value = getCages.value

    const list = getCages.value.filter((cage) => cage.id_clinic === clinicId.value)
    mainCageList.value = list
  }

  await roomStore.fetchPreparationRooms()
  allRoomsList.value.length = 0
  allRoomsListDefault.length = 0

  const roomList = roomStore.getRooms.find(room => room.id_clinic == clinicId.value)?.rooms?.map(room => ({value: room.id_room, label: room.name_room, ...room}))
  allRoomsList.value = [...roomList]
  allRoomsListDefault.push(...roomList)
}

// function getCommonCages(arr: any) {
//   let commonRoom = [] as any
//   const ids = arr.map((room: any) => room.id_clinic);
//   let uniqIds = [... new Set(ids)]
//   const result = uniqIds.map((ids) => {
//     return {
//       id: ids,
//       rooms: arr.filter((room) => room?.id_clinic === ids)
//     }
//   })
//   commonRoom = result
//   return commonRoom
// }

function sortByHigherLevels(arr: any) {
  return arr?.sort((data, data1) =>
    data?.level_floor < data1?.level_floor ? 1 : -1
  )
}

function getRoomLevels(arr: any) {
  const sortedArr = sortByHigherLevels(arr)
  // const finalArr = sortedArr?.length > 0 ? sortedArr[0].room_list : []
  let commonLevel = [] as any
  const levels = sortedArr.map((room: any) => room.level_floor)
  let uniqLevels = [...new Set(levels)]
  const result = uniqLevels.map((floorLevel) => {
    return {
      level: floorLevel,
      rooms: sortedArr.filter((room: any) => room?.level_floor === floorLevel)
    }
  })
  commonLevel = result
  return commonLevel
}

// function getFilteredCageList(arr: any) {
//   if (flg_usable.value === false) {
//     return arr.filter((cage: any) => cage?.flg_usable === false)
//   } else {
//     return arr
//   }
// }

// function getCagesRooms(arr: any) {
//   const sortedArr = sortByHigherLevels(arr)

//   // const finalArr = sortedArr?.length > 0 ? sortedArr[0].cage_list : []
//   let commonRoom = [] as any
//   const rooms = sortedArr.map((room: any) => room.id_room);
//   let uniqRooms = [... new Set(rooms)]
//   const result = uniqRooms.map((cage) => {
//     return {
//       cage: cage,
//       cages: sortedArr.filter((room: any) => room?.id_room === cage)
//     }
//   })
//   commonRoom = result
//   return commonRoom
// }

const getClinicName = (clinicId: any) => {
  return clinicStore.getClinics.find((clinic) => clinic?.id_clinic === clinicId)
    ?.name_clinic_display
}

const selectClinicId = async (value: number) => {
  if (value !== undefined) {
    clinicId.value = value
    search()
  }
}

// const getClinicData = (clinicId: any) => {
//   return clinicStore.getClinics.find((clinic) => clinic?.id_clinic === clinicId)
// }
const init = async () => {
  if (getAllClinics.value) {
    let allClinics = [] as any
    const noFacilityArr = clinicStore.getClinics.filter(
      (cli) => cli?.flg_facility === false
    )
    allClinics = getAllClinics.value.filter((clint) =>
      noFacilityArr.find((cli) => cli?.id_clinic == clint?.value)
    )
    allClinicList.value = [...allClinics]
    allClinicListDefault.push(...allClinics)
    if (allClinics.length < 2) {
      isReadOnly.value = true
    } else {
      isReadOnly.value = false
    }
  }
}
onMounted(async () => {
  await clinicStore.fetchPreparatioClinic()
  clinicId.value = storedClinic
  await search()
  if (clinicId.value) {
    await init()
  }

  setPageTitle('ケージ一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          ケージ一覧
        </q-toolbar-title>
        <q-btn
          class="q-mr-sm q-ba"
          unelevated
          padding="1px 2px"
          @click="router.push('/SearchClinicList')"
        >
          <span class="q-px-md">病院・施設</span>
        </q-btn>
        <q-btn
          class="q-mr-sm q-ba"
          unelevated
          padding="1px 2px"
          @click="router.push('/SearchRoomList')"
        >
          <span class="q-px-md">部屋・区画</span>
        </q-btn>
        <MtFilterSelect
          :options-default="allRoomsListDefault"
          v-model:options="allRoomsList"
          v-model:selecting="id_room"
          @update:selecting="search"
          outlined
          label="部屋"
          autofocus
          tabindex="1"
          class="q-mx-md selection-field"
        />
        <MtInputForm
          type="checkbox"
          @update:model-value="search"
          :items="[{ label: '使用可能' }]"
          v-model="flg_usable"
        />
        <q-btn
          @click="search()"
          unelevated
          color="accent-800"
          text-color="white"
          tabindex="2"
        >
          <q-icon size="20px" name="search" />検索
        </q-btn>
        <q-btn
          @click="openAddModal()"
          unelevated
          color="grey-800"
          text-color="white"
          tabindex="3"
          class="q-mx-md"
        >
          <q-icon size="20px" name="add" />ケージ
        </q-btn>
      </q-toolbar>
    </MtHeader>

    <div class="q-px-xl q-mb-lg q-mt-lg width-400">
      <MtFilterSelect
        :options-default="allClinicListDefault"
        v-model:options="allClinicList"
        v-model:selecting="clinicId"
        label="病院名"
        @update:selecting="selectClinicId"
        :readonly="isReadOnly"
      />
    </div>
    <div
      class="row items-center q-px-xl q-pb-xs q-mb-md bg-white full-width"
      v-for="(arr, i) in mainCageList"
      :key="i"
    >
      <div
        class="row items-center justify-center parent bg-grey-600 text-white full-width q-px-lg q-py-sm"
      >
        <span>{{
          getClinicName(arr?.id_clinic)
            ? getClinicName(arr?.id_clinic)
            : 'Not passed '
        }}</span>
      </div>
      <div
        class="row items-center q-pb-xs q-mb-md bg-white full-width q-mt-lg"
        v-for="(levls, i) in getRoomLevels(arr?.room_list)"
        :key="i"
      >
        <div
          class="row items-center justify-center parent bg-grey-400 full-width q-px-lg q-py-sm"
        >
          <span> フロア {{ levls?.level ? levls?.level : 'none' }} 階</span>
        </div>
        <div
          class="row items-center q-px-xl q-pb-xs q-mb-md bg-white full-width q-mt-lg"
          v-for="(array, i) in levls?.rooms"
          :key="i"
        >
          <div
            class="row items-center justify-center parent bg-grey-200 full-width q-px-lg q-py-sm"
          >
            <span
              >部屋： {{ array?.name_room ? array?.name_room : 'none' }}</span
            >
          </div>
          <div
            class="children justify-left flex items-left q-mt-md"
            v-if="array.cage_list && array.cage_list.length > 0"
          >
            <q-btn
              v-for="(room, n) in array.cage_list"
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
                <span>{{ room?.name_cage }}</span>
              </div>
            </q-btn>
          </div>
          <div v-else class="text-grey-500 q-mt-sm">
            ケージが登録されていません。
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
<style lang="scss" scoped>
.width-400 {
  max-width: 400px;
}
</style>
