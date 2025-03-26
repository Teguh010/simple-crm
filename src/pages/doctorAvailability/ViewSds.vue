<script setup lang="ts">
import { inject, onMounted } from 'vue'
import MtTypeGenre from '@/components/MtTypeGenre.vue'

const setItemRef = inject('setItemRef')
const openServiceDetailModal = inject('openServiceDetailModal')
const onClinicPlanClick = inject('onClinicPlanClick')
const openPrescriptionDetailModal = inject('openPrescriptionDetailModal')
const openInjectDetailModal = inject('openInjectDetailModal')
const getServiceDetailsById = inject('getServiceDetailsById')
const getClinicPlanById = inject('getClinicPlanById')
// const getPrescriptionById = inject('getPrescriptionById');
const date_time_range = inject('date_time_range')
const slotDetailText = inject('slotDetailText')

const props = defineProps({
  serviceDetails: Object,
  tableLeftRows: Object,
  levelColors: Object,
  baseHeight: Number
})

const styling = (data) => {
  let top = 0
  const timeRange = date_time_range(data.service_detail)
  const [start, end] = timeRange.split('-')
  let [startHour, startMinute] = start.split(':')
  let [endHour, endMinute] = end.split(':')

  // remove space
  startMinute = startMinute.replace(/\s/g, '')

  startHour = parseInt(startHour)
  endHour = parseInt(endHour)
  let difference = endHour - startHour
  let height = props.baseHeight * difference
  switch (startMinute) {
    case '15':
      top = props.baseHeight / 4
      break
    case '30':
      top = props.baseHeight / 3
      break
    case '45':
      top = props.baseHeight / 2
      break
    default:
      top = 0
      break
  }

  switch (endMinute) {
    case '15':
      height += props.baseHeight / 4
      break
    case '30':
      height += props.baseHeight / 3
      break
    case '45':
      height += props.baseHeight / 1.3
      break
    default:
      height += props.baseHeight
      break
  }

  return {
    height: `${height}px`,
    top: `${top}px`
  }
}

const callModalOpener = (name: any) => {
  console.log(name)
  if (name.startsWith('sed_')) {
    openServiceDetailModal(getServiceDetailsById(name));
  } else if (name.startsWith('clp_')) {
    onClinicPlanClick(name);
  } else if (name.startsWith('pre_')) {
    console.log("AAAAA")
    openPrescriptionDetailModal(name);
  } else{
    console.log("HAHAHAHAH")
    openInjectDetailModal(name);
  }
}

onMounted(() => {})
</script>

<template>
  <!-- {{console.log(props.serviceDetails)}} -->
  <template
    v-for="(serviceDetail, s_index) in props.serviceDetails"
    :key="s_index"
  >
    <div :style="styling(serviceDetail)" class="time-block">
      <div
        :style="{
          marginLeft: serviceDetail.level - 1 + 'rem',
          borderLeft: `1rem solid white`
        }"
        :class="`level-${serviceDetail.level}`"
      ></div>
      <div style="padding-left: 10px; padding-top: 10px">
        <div
          class="flex body2 items-center q-mb-xs cursor-pointer"
          :ref="(el) => setItemRef(el, `ser-${serviceDetail.service_detail}`)"
          :class="`ser-${serviceDetail.service_detail}`"
          @click="callModalOpener(serviceDetail.service_detail)"
          :id="`ser-${serviceDetail.service_detail}`"
          style="align-items: normal"
        >
          <div>
            <MtTypeGenre
              v-if="
                serviceDetail.service_detail.startsWith('sed_') ||
                serviceDetail.service_detail.startsWith('clp_')
              "
              :type="
                serviceDetail.service_detail.startsWith('sed_')
                  ? getServiceDetailsById(serviceDetail.service_detail)
                      ?.type_booking_genre
                  : getClinicPlanById(serviceDetail.service_detail)
                      ?.type_plan_status
              "
            />
            <q-badge
              v-else
              color="EC9819"
              text-color="white"
              label="薬"
              rounded
              class="custom-badge"
            />
          </div>
          <div :style="{ paddingLeft: '5px' }">
            <div>
              {{ date_time_range(serviceDetail.service_detail) }}
            </div>
            <div>
              <p style="color: #757575">
                {{ slotDetailText(serviceDetail.service_detail) }}
              </p>
            </div>
          </div>
        </div>
        <ViewSds
          v-if="serviceDetail.levels?.length > 0"
          :serviceDetails="serviceDetail.levels"
        />
      </div>
    </div>
  </template>
</template>

<style lang="scss" scoped>
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
.custom-badge {
  padding: 4px;
  margin-left: 2px;
  margin-right: 2px;
}
.time-block {
  display: flex;
  background-color: $grey-100;
  position: absolute;
  z-index: 1;
  width: 100%;
}
</style>
