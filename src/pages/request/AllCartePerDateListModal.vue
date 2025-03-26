<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import useMemoCarteStore from '@/stores/memo-cartes';
import { chain, flatMap, groupBy, map, orderBy } from 'lodash';
import { onMounted, onUnmounted, ref,  } from 'vue';
import MemoCarteGrouped from './detail/MemoCarteGrouped.vue';
import { dateFormat, stripHtmlTags } from '@/utils/aahUtils';
import ServiceDetailLargePocketList from '@/components/PocketList/largePocket/ServiceDetailLargePocketList.vue';
import LabResultSingleList from './detail/lab-result/LabResultSingleList.vue';
import MtPetInfo from '@/components/MtPetInfo.vue';
import ClinicalFileSingleList from './detail/clinical-file/ClinicalFileSingleList.vue';
import { useRoute, useRouter } from 'vue-router';
import { CartePerDateListType, ClinicalFile, LabResult, MemoCarteType, RequestDetailPageType } from '@/types/types';
import InjectLargePocketList from '@/components/PocketList/largePocket/InjectLargePocketList.vue';
import PrescriptionLargePocketList from '@/components/PocketList/largePocket/PrescriptionLargePocketList.vue';
import MtFormCheckBox from '@/components/form/MtFormCheckBox.vue';
import mtUtils from '@/utils/mtUtils';
import OptionModal from '@/components/OptionModal.vue';
import { event_bus } from '@/utils/eventBus';

const props = defineProps({
  petSelected: Object,
  customerSelected: Object,
})
const emit = defineEmits(['close'])
const closeModal = () => emit('close')

const route = useRoute()
const router = useRouter()
const memoCarteStore = useMemoCarteStore()

// let intervalId: number
const showUnitRange = ref(false)
const dateAreaScrollRef = ref()
const dateList = ref([] as Array<Array<CartePerDateListType>>)
const dateSelected = ref('' as string)
const labResultPetDetailRef = ref()
// const hitTop = ref(0)
// const hitBottom = ref(0)
// const scrolled = ref(false)
const memoCarteList = ref<{
  carte_list: Array<MemoCarteType>,
  request_list: Array<RequestDetailPageType>,
  lab_result_list: Array<LabResult>,
  clinical_file_list: Array<ClinicalFile>
}>({
  carte_list: [],
  request_list: [],
  lab_result_list: [],
  clinical_file_list: []
})

const changeDate = async (date: string, is_move_button = false) => {
  await memoCarteStore.fetchPetDetailTodos({ id_pet: props.petSelected?.id_pet, date_start: date })
  dateSelected.value = date

  router.replace({
    path: route.path,
    query: {
      ...route.query,
      carte_per_date: date
    }
  })

  if (is_move_button) scrollToItem(date)

  memoCarteList.value = memoCarteStore.getPetDetailTodos
}

const scrollToItem = (date: string) => {
  if (!dateAreaScrollRef.value) return

  const scrollTarget = dateAreaScrollRef.value.getScrollTarget()

  const targetEl = document.getElementById(`item_${date}`)
  if (!targetEl || !scrollTarget) return

  const topPosition = targetEl.offsetTop

  dateAreaScrollRef.value.setScrollPosition('vertical', topPosition - 50, 300)
}

const scrollContainer = (scroll: { verticalPercentage: number }) => {
  // Disabling this for now
  // if (scroll.verticalPercentage > 0.03) scrolled.value = true
  
  // if (scroll.verticalPercentage == 0 && scrolled.value) {
  //   hitTop.value += 1
  //   scrolled.value = false
  // } else if (scroll.verticalPercentage >= 0.98) {
  //   hitBottom.value += 1
  // }

  // if (hitTop.value == 2) {
  //   moveDate('backward')
  // } else if (hitBottom.value == 2) {
  //   moveDate('forward')
  // }
}

const moveDate = async (direction: string) => {
  // hitTop.value = 0
  // hitBottom.value = 0
  // scrolled.value = false

  const yearKey = dateList.value.findIndex(v => v.year == parseInt(dateFormat(dateSelected.value, 'YYYY')))
  const dateListByCurrentYear = dateList.value[yearKey]
  const currentDateKey = dateListByCurrentYear.items.findIndex((v) => v.date == dateSelected.value)

  if (direction == 'forward') {
    const newDate = dateListByCurrentYear.items[currentDateKey + 1]
    if (newDate) changeDate(newDate.date, true) // If next date on same year founded, change the date
    else {
      // If the next date on next year founded
      const yearNextKey = dateList.value.findIndex(v => v.year == (parseInt(dateFormat(dateSelected.value, 'YYYY')) - 1))
      const newYear = dateList.value[yearNextKey]
      if (newYear && newYear.items && newYear.items.length > 0) {
        changeDate(newYear.items[0]?.date, true)
      } else {
        return false
      }
    }
  } else if (direction == 'backward') {
    const newDate = dateListByCurrentYear.items[currentDateKey - 1]
    if (newDate) changeDate(newDate.date, true) // If next date on same year founded, change the date
    else {
      // If the next date on next year founded
      const yearPreviousKey = dateList.value.findIndex(v => v.year == (parseInt(dateFormat(dateSelected.value, 'YYYY')) + 1))
      const newYear = dateList.value[yearPreviousKey]
      if (newYear && newYear.items && newYear.items.length > 0) {
        changeDate(newYear.items[newYear.items.length - 1]?.date, true)
      } else {
        return false
      }
    }
  }
}

const openRequestPage = (id_request: number) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })

  window.open(route.fullPath, '_blank')
}

const openMenu = async () => {
  let menuOptions = [
    { title: 'URLコピー', name: 'url_copy' },
  ]

  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)

  if (selectedOption) {
    if (selectedOption.name == 'url_copy') {
      try {
        const url = window.location.href
        await navigator.clipboard.writeText(url)
        mtUtils.autoCloseAlert('URLをコピーしました。')
      } catch ($e) {
        mtUtils.autoCloseAlert('URLコピーに失敗しました。')
      }
    }
  }
}
const refreshAllCartePerDate = async () => {
  if (route.query.carte_per_date) {
    changeDate(route.query.carte_per_date as string)
  } else {
    changeDate(dateFormat(flatMap(dateList.value)?.[0]?.items?.[0]?.date, 'YYYY-MM-DD'))
  }
  memoCarteList.value = { ...memoCarteStore.getPetDetailTodos }
}



onMounted(async () => {
  await Promise.all([
    memoCarteStore.fetchPetAllTodos({ id_pet: props.petSelected?.id_pet })
  ])

  // intervalId = setInterval(() => {
  //   hitTop.value = 0
  //   hitBottom.value = 0
  //   scrolled.value = false
  // }, 2000)

  dateList.value = chain(memoCarteStore.getPetAllTodos)
    .orderBy('date', 'desc')
    .map(todo => ({
      ...todo,
      year: dateFormat(todo.date, 'YYYY'),
    }))
    .groupBy('year')
    .toPairs()
    .orderBy([0], ['desc'])
    .map(([year, items]) => ({
      year,
      items
    }))
    .value();

  if (route.query.carte_per_date) {
    changeDate(route.query.carte_per_date as string)
  } else {
    changeDate(dateFormat(flatMap(dateList.value)?.[0]?.items?.[0]?.date, 'YYYY-MM-DD'))
  }
  event_bus.on('refreshAllCartePerDate', refreshAllCartePerDate)
})
onUnmounted(() => {
  router.replace({ path: route.path, query: {} })
  // clearInterval(intervalId)
})
</script>
<template>
  <q-form>
    <MtModalHeader @close-modal="closeModal" :closeBtn="true">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <div class="flex items-center">
          日付別カルテ
          <MtPetInfo class="q-ml-md" />
        </div>
      </q-toolbar-title>
      <div>
        <q-btn 
          flat
          dense
          round
          @click="moveDate('backward')"
        >
          <q-icon name="chevron_left" />
        </q-btn>
        <span class="caption1 regular text-grey-700 q-mx-md">日付</span>
        <q-btn 
          flat
          dense
          round
          class="q-mr-md"
          @click="moveDate('forward')"
        >
          <q-icon name="chevron_right" />
        </q-btn>
        <q-btn unelevated round @click="openMenu" class="q-mx-sm">
          <q-icon size="15px" name="more_horiz" />
        </q-btn>
      </div>
    </MtModalHeader>
    <q-card-section class="content-full q-px-md">
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-lg-1 col-md-1 col-sm-1">
          <div class="component">
            <q-scroll-area ref="dateAreaScrollRef" class="full-height full-width">
              <div class="q-mb-md" v-for="years in dateList">
                <div class="caption1 regular text-grey-800 bg-grey-200 q-px-sm q-py-xs q-mb-xs q-mt-md">
                  {{ years.year }}年
                </div>
                <div
                  v-for="date in years.items"
                  @click="changeDate(date.date)"
                  :id="`item_${date.date}`"
                  class="cursor-pointer divider-line q-py-sm text-left no-wrap"
                  :class="dateSelected == date.date ? 'bg-accent-100 q-py-xs' : ''"
                >
                  <div class="flex items-center justify-left">
                    <div class="caption2 regular text-black q-mx-xs">
                      {{ dateFormat(date.date, 'M/D') }}
                    </div>
                    <span v-if="date.memo_carte_list?.length > 0" class="status-date">
                      カ
                    </span>
                    <span v-if="date.order" class="status-date">
                      オ
                    </span>
                    <span v-if="date.lab_result" class="status-date" :style="{backgroundColor: '#444', color: '#fff'}">
                      検
                    </span>
                    <span v-if="date.clinical_file">
                      <q-icon name="attach_file" size="13px" />
                    </span>
                  </div>
                  <span class="caption2 regular text-memo-subject">
                    {{ stripHtmlTags(date.memo, 35) }}
                  </span>
                </div>
              </div>
            </q-scroll-area>
          </div>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4">
          <div class="component">
            <q-scroll-area @scroll="scrollContainer" class="full-height full-width">
              <template v-if="memoCarteList.carte_list" v-for="dt_insert in Object.keys(memoCarteList.carte_list)">
                <MemoCarteGrouped
                  :data="memoCarteList.carte_list[dt_insert]"
                  :date="dateSelected"
                  :id_customer="props.customerSelected?.id_customer"
                  :id_pet="props.petSelected?.id_pet"
                  :show_lab_result="false"
                  :show_clinical_file="false"
                />
              </template>
            </q-scroll-area>
          </div>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-4">
          <div class="component">
            <q-scroll-area @scroll="scrollContainer" class="full-height no-wrap">
              <div class="divider-line q-pb-md q-mb-md" v-for="request in memoCarteList.request_list">
                <div class="q-mb-sm">
                  <span
                    class="text-blue cursor-pointer"
                    @click.stop="openRequestPage(request.id_request)"
                  >
                    <small class="text-grey-700 q-mr-md">リクエスト：</small>{{ request.number_request }}
                    <small class="text-grey-700 q-ml-md">
                      {{
                        request.date_request_start == request.date_request_goal
                          ? '' :
                          request.date_request_start + ' ~ ' + request.date_request_goal
                      }}
                    </small>
                  </span>
                </div>
                <div class="row q-col-gutter-md" v-if="request.service_detail_list.length > 0">
                  <div class="col-lg-4 col-md-6 col-sm-12" v-for="item in request.service_detail_list" :key="item.id">
                    <ServiceDetailLargePocketList                      
                      :data="item"
                      :id_customer="props.customerSelected?.id_customer"
                      :id_pet="props.petSelected?.id_pet"
                      :request="request"
                      @refresh="changeDate(dateSelected)"
                    />
                  </div>
                </div>
                <PrescriptionLargePocketList
                  v-if="request.prescription_list.length > 0"
                  v-for="item in request.prescription_list"
                  :copy="false"
                  :expandable="false"
                  :rows="3"
                  :key="item.id_prescription_detail"
                  :data="item"
                  @refresh="changeDate(dateSelected)"
                />
                <InjectLargePocketList
                  v-for="inject in request.inject_list_list"
                  v-if="request.inject_list_list?.length > 0"
                  :key="inject.id_inject"
                  :data="inject"
                  @refresh="changeDate(dateSelected)"
                />
              </div>
            </q-scroll-area>
          </div>
        </div>
        <div class="col-lg-3 col-md-3 col-sm-3">
          <div class="component">
            <q-scroll-area @scroll="scrollContainer" class="full-height full-width">
              <div class="flex justify-end">
                <MtFormCheckBox
                  label="単位/基準値"
                  v-model="showUnitRange"
                />
              </div>
              <template v-if="memoCarteList.carte_list" v-for="dt_insert in Object.keys(memoCarteList.carte_list)">
                <LabResultSingleList
                  ref="labResultPetDetailRef"
                  hide-header
                  :id_pet="props.petSelected?.id_pet"
                  :id_customer="props.customerSelected?.id_customer"
                  :labResultList="memoCarteList.carte_list[dt_insert].lab_result_list"
                  :showUnitRange="showUnitRange"
                  @refresh="changeDate(dateSelected)"
                />
                <ClinicalFileSingleList
                  :id_pet="props.petSelected?.id_pet"
                  :id_customer="props.customerSelected?.id_customer"
                  :clinicalFileList="memoCarteList.carte_list[dt_insert].clinical_file_list"
                  @refresh="changeDate(dateSelected)"
                />
              </template>
            </q-scroll-area>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-form>
</template>

<style lang="scss" scoped>
.component {
  height: calc(100vh - 150px)
}
.status-date {
  padding: 0px 4px;
  font-size: 10px;
  color: #111;
  border-radius: 2px;
  margin: 0px 1px;
  background-color: #e1e5eb;
}

.divider-line {
  border-bottom: 1px solid #e9e9e9;
}

.text-memo-subject {
  color: #2f384b;
}
</style>