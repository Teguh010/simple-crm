<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, defineAsyncComponent } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import mtUtils from '@/utils/mtUtils'
import {
  changeDate,
  concatenate,
  dateFormat,
  formatDate,
  formatHoursMinutes,
  getDateToday,
  getFullPetNameWithoutHonorific,
  getPetImageUrl,
  handleImageError
} from '@/utils/aahUtils'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import useRoomStore from '@/stores/rooms'
import { reactive } from '@vue/reactivity'
import { storeToRefs } from 'pinia'

import useTask from '@/stores/task'
import useCommonStore from '@/stores/common'
import usePetCustodyStore from '@/stores/pet-custodies'
import useClinicStore from '@/stores/clinics'
import ViewTaskPetCustodyModal from './ViewTaskPetCustodyModal.vue'
import { PetCustodyType, TaskType } from '@/types/types'
import useCageStore from '@/stores/cages'
import { useRoute, useRouter } from 'vue-router'
import CardTaskPetCustody from './CardTaskPetCustody.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import { sortBy } from 'lodash'
import { setPageTitle } from '@/utils/pageTitleHelper'
import dayjs from 'dayjs'

// Lazy-loaded Components
const UpdateTaskModal = defineAsyncComponent(
  () => import('@/pages/task/UpdateTaskModal.vue')
)

const router = useRouter()
const route = useRoute()

const petCustodyStore = usePetCustodyStore()
const commonStore = useCommonStore()
const roomStore = useRoomStore()
const clinicStore = useClinicStore()
const cageStore = useCageStore()
const taskStore = useTask()

const { getTasks } = storeToRefs(taskStore)
const { getAllRooms } = storeToRefs(roomStore)
const { getAllClinics } = storeToRefs(clinicStore)
const { getPetCustodies } = storeToRefs(petCustodyStore)
const { getAllCages } = storeToRefs(cageStore)

const roomList: any = ref([])
const roomListDefault: any = reactive([])
const allClinicList: any = ref([])
const allClinicListDefault: any = reactive([])
const currentDateTime = ref(new Date().toLocaleString())

const searchData = ref({ id_room: '', date: getDateToday() })

const openTaskPetCustodyDetail = async (custody: PetCustodyType) => {
  petCustodyStore.selectPetCustody(custody.id_pet_custody)

  await mtUtils.popup(ViewTaskPetCustodyModal, {
    selectedDate: searchData.value.date,
    fromPage: '管理動物一覧'
  })

  await router.replace({
    name: 'SearchTaskPetCustodyList'
  })

  await petCustodyStore.fetchPetCustodies({
    date: searchData.value.date
  })
}
const changeDates = async (prefix: string) => {
  if (prefix != 'selected') {
    searchData.value.date = changeDate(searchData.value.date, prefix)
  }
  searchPetCustody()
}
const openNewTabRequestDetail = (id_request: string) => {
  const link = router.resolve({
    name: 'RequestDetail',
    params: {
      id: id_request
    }
  })
  window.open(link.href, '_blank')
}
const getTotalRepetitive = (task_list: Array<TaskType>, task: TaskType) => {
  if (task.val_order > 0) {
    let counter = 0
    if (task.val_order === 1) {
      counter = task_list.filter(
        (v: TaskType) => v.val_order > 0 && v.id_task_copied === task.id_task
      ).length
    } else {
      counter = task_list.filter(
        (v: TaskType) =>
          v.val_order > 0 && v.id_task_copied === task.id_task_copied
      ).length
    }
    // Counter + 1 (the original task)
    return counter + 1
  }
}
const openShowTaskPetCustodyDisplay = () => {
  const route = router.resolve({ name: 'SearchTaskPetCustodyLargeList' })
  window.open(route.href, '_blank')
}
const getCage = (value: string) =>
  getAllCages.value.find((v) => v.value === value)?.name_cage
const getRoom = (value: number) => {
  return getAllRooms.value.find((v) => v.id_room === value)?.name_room
}
const searchPetCustody = async () => {
  petCustodyStore.fetchPetCustodies({
    ...searchData.value
  })
}

const openAddModal = async() => {
  taskStore.selectTask(null)
  await mtUtils.popup(UpdateTaskModal, {}, true)
}

const interval = setInterval(() => {
  currentDateTime.value = new Date().toLocaleString()
}, 10000)

const filteredPetCustodies = computed(() => {
  return getPetCustodies.value.filter((data) => {
    const searchDate = dayjs(searchData.value.date);
    const goalDate = dayjs(data.datetime_goal);
    const goalPlanDate = dayjs(data.datetime_goal_plan);
    const startDate = dayjs(data.datetime_start);
    return (
      startDate.isBefore(searchDate, 'day') || startDate.isSame(searchDate, 'day')
      && goalDate.isAfter(searchDate, 'day') || goalPlanDate.isAfter(searchDate, 'day')
    )
  });
});

onMounted(async () => {
  await Promise.all([
    commonStore.fetchPreparationCommonList({
      code_common: [17, 18, 19, 20, 21, 22, 23, 24]
    }),
    petCustodyStore.fetchPetCustodies({
      date: getDateToday()
    }),
    roomStore.fetchPreparationRooms(),
    clinicStore.fetchPreparatioClinic(),
    cageStore.fetchPreparationCages()
  ])

  if (getAllClinics.value) {
    allClinicList.value = [...getAllClinics.value]
    allClinicListDefault.push(...getAllClinics.value)
  }
  if (getAllRooms.value) {
    roomListDefault.push(
      ...getAllRooms.value.map((room) => ({
        ...room,
        label: room.name_room,
        value: room.id_room
      }))
    )
    roomList.value = [...roomListDefault]
  }

  if (route.query.id) {
    await usePetCustodyStore().getPetCustodyById(route.query.id)
    await mtUtils.popup(ViewTaskPetCustodyModal, {})
    await router.replace({
      name: 'SearchTaskPetCustodyList'
    })
  }

  // set page title
  setPageTitle('管理動物一覧')
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          預かり動物タスク一覧
        </q-toolbar-title>
        <q-space></q-space>
        <MtFilterSelect
          outlined
          class="bg-white"
          label="部屋・区画"
          option-label="name_room"
          v-model:selecting="searchData.id_room"
          v-model:options="roomList"
          :options-default="roomListDefault"
          @update:selecting="searchPetCustody"
        />
        <q-btn
          @click="openShowTaskPetCustodyDisplay"
          flat
          class="q-ml-lg text-blue"
        >
          大画面表示 <q-icon name="ios_share" />
        </q-btn>

        <div class="q-ml-md flex items-between gt-md">
          <q-btn
            @click="changeDates('prev')"
            padding="2px"
            flat
            unelevated
            icon="chevron_left"
            style="border: 1px solid #9e9e9e"
          />
          <MtFormInputDate
            outlined
            type="date"
            v-model:date="searchData.date"
            class="search-field q-mx-xs"
            @update:date="changeDates('selected')"
          />
          <q-btn
            @click="changeDates('next')"
            padding="2px"
            flat
            unelevated
            icon="chevron_right"
            style="border: 1px solid #9e9e9e"
          />
        </div>
        <div class="q-ml-lg">
          <q-btn
            class="q-mx-sm"
            color="primary"
            text-color="white"
            unelevated
            @click="openAddModal"
          >
            <q-icon name="add" size="20px" />
            タスク
          </q-btn>
        </div>
      </q-toolbar>
    </MtHeader>
    <div class="q-px-md q-mt-lg">
      <div
        v-for="(custody, key) in filteredPetCustodies"
        :class="key % 2 === 0 ? 'bg-grey-200' : ''"
        class="row q-mb-xs"
      >
        <div class="col-4">
          <div
            @click="openTaskPetCustodyDetail(custody)"
            class="flex no-wrap cursor-pointer"
          >
            <div
              class="bg-accent-900 q-mr-md flex items-center justify-center text-white number text-center"
            >
              {{ key + 1 }}
            </div>
            <div class="q-py-md relative-position inline-block">
              <img
                :alt="custody?.pet?.id_pet"
                :src="getPetImageUrl(custody?.pet)"
                @error="handleImageError($event, custody?.pet)"
                spinner-color="white"
                style="width: 110px; height: 110px"
                class="roundedImage image-responsive"
                loading="lazy"
              />
              <q-badge
                v-if="custody?.flg_hospitalization"
                floating
                align="top"
                class="badge text-white bg-blue-500 q-pa-sm"
              >
                入院
              </q-badge>
            </div>
            <div class="flex column gap-2 q-py-md q-ml-md q-mr-md">
              <div class="title1">
                {{ concatenate(custody.pet.code_pet, custody.customer.name_family, custody.pet.name_pet) }}
              </div>
              <div>
                <span v-if="custody?.datetime_start_plan">
                  {{ dayjs(custody?.datetime_start_plan).format('YYYY/MM/DD HH:mm') }}
                </span>
                <span
                  class="q-mx-sm"
                  v-if="custody?.datetime_goal_plan"
                >～</span>
                <span v-if="custody?.datetime_goal_plan">
                  {{ dayjs(custody?.datetime_goal_plan).format('YYYY/MM/DD HH:mm') }}
                </span>
              </div>
              <div class="body2">
                {{ getCage(custody?.id_cage) }}
              </div>
              <div
                v-if="custody?.id_request"
                @click.stop="openNewTabRequestDetail(custody?.id_request)"
                class="text-blue"
              >
                # {{ custody?.request?.number_request }}
              </div>
              <div class="body2 ellipsis">
                {{ getRoom(custody.id_room) }}
              </div>
            </div>
          </div>
        </div>

        <div class="col-8">
          <div class="task-container no-wrap full-height q-py-md">
            <CardTaskPetCustody
              v-if="
                !custody?.datetime_start &&
                formatDate(currentDateTime) ===
                  formatDate(custody?.datetime_start_plan)
              "
              :currentDateTime="currentDateTime"
              :custody="custody"
              card_type="check"
            />
            <template v-if="custody?.task_list?.length > 0">
              <template
                v-for="task in sortBy(custody?.task_list, 'datetime_plan')"
              >
                <CardTaskPetCustody
                  :totalRepetitive="getTotalRepetitive(custody.task_list, task)"
                  :currentDateTime="currentDateTime"
                  :task="task"
                />
              </template>
            </template>
            <CardTaskPetCustody
              v-if="!custody?.datetime_goal"
              :currentDateTime="currentDateTime"
              :custody="custody"
              card_type="out"
            />
            <template
              v-if="
                custody?.datetime_start &&
                custody?.datetime_goal &&
                custody?.task_list?.length === 0
              "
            >
              <div
                class="box bg-white column justify-center text-center q-pa-sm"
              >
                <div>タスクなし <q-icon name="task_alt" /></div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<style lang="scss" scoped>
.number {
  width: 30px;
}
.badge {
  margin-top: 20px;
  margin-right: 3px;
  border-radius: 10px;
}

.task-container {
  display: -webkit-box;
  overflow-x: auto;
}
.box {
  border: 1px solid $grey-400;
  width: 200px;
}
</style>
