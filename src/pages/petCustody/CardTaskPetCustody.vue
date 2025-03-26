<script setup lang="ts">
import { PetCustodyType, TaskType } from '@/types/types'
import {
  aahTruncate,
  formatDateWithTime,
  formatHoursMinutes,
  getDateTimeNow,
  getDateToday,
  timeDifferences
} from '@/utils/aahUtils'
import ViewPrescriptionModal from '../request/prescription/ViewPrescriptionModal.vue'
import mtUtils from '@/utils/mtUtils'
import useServiceDetailStore from '@/stores/service-details'
import { storeToRefs } from 'pinia'
import usePetCustodyStore from '@/stores/pet-custodies'
import useTask from '@/stores/task'
import { defineAsyncComponent, onMounted, ref } from 'vue'
import dayjs from 'dayjs'

const ViewTaskDetailModal = defineAsyncComponent(
  () => import('@/pages/task/ViewTaskDetailModal.vue')
)

const props = withDefaults(defineProps<{
  card_type?: string;
  custody?: PetCustodyType;
  task?: TaskType;
  currentDateTime?: string;
  totalRepetitive: number;
}>(),{
  card_type: "default",
  custody: {},
  task: {},
  totalRepetitive: 0,
})

const petCustodyStore = usePetCustodyStore()
const serviceDetailStore = useServiceDetailStore()
const taskStore = useTask()
const { getServiceDetail } = storeToRefs(serviceDetailStore)

const datetime = ref()
const formattedDatetime = ref()

const getBgBoxClassName = () => {
  let className = 'bg-white'
  if (props.card_type === 'default' && props.task.flg_started) {
    className = 'bg-green-100'
  } else {
    if (timeDifferences(formatDateWithTime(props.currentDateTime), formatDateWithTime(datetime.value), 'minutes') > 0) {
      className = 'bg-red-100 border-red-900'
    }
  }
  return className
}
const getMinusTime = () => {
  const differences = timeDifferences(formatDateWithTime(props.currentDateTime), formatDateWithTime(datetime.value), 'minutes')
  if (((props.card_type === 'default' && !props.task.flg_started) || props.card_type !== 'default') && differences > 0)
    return differences
  else return 0
}
const getRemainingTime = () => {
  const differences = timeDifferences(formatDateWithTime(datetime.value), formatDateWithTime(props.currentDateTime), 'minutes')
  if (((props.card_type === 'default' && !props.task.flg_started) || props.card_type !== 'default') && differences <= 10)
    return differences
  else return 0
}
const openNumberLinkTask = async (task: TaskType) => {
  if (task.type_link1 == 2) {
    await serviceDetailStore.fetchServiceDetailById(task?.id_link1)
    const service_detail = getServiceDetail.value
    window.open(
      `/SearchRequestList/${service_detail?.id_request}/serviceDetail?id_service_detail=${task?.id_link1}`,
      '_blank'
    )
  } else if (task.type_link1 == 3) {
    await mtUtils.mediumPopup(ViewPrescriptionModal, {
      prescriptionObj: {
        id_prescription: task?.id_link1
      },
      id_pet: task?.id_pet,
      fromPD: true,
      id_customer: task?.id_customer
    }, true)
  } else {
    window.open(`/SearchRequestList/${task?.id_link1}/`, '_blank')
  }
}

const openTaskModal = async () => {
  if (props.card_type === 'default') {
    await mtUtils.mediumPopup(ViewTaskDetailModal, {
      data: props.task
    })
  }
}
const onClickCheck = async () => {
  await mtUtils
    .confirm('完了しましたか？', 'タスク進捗', 'はい')
    .then(async (confirmation) => {
      if (confirmation) {
        if (props.card_type === 'check')
          await petCustodyStore.updatePetCustody(props.custody.id_pet_custody, { ...props.custody, datetime_start: getDateTimeNow() })
        else if (props.card_type === 'out')
          await petCustodyStore.updatePetCustody(props.custody.id_pet_custody, { ...props.custody, datetime_goal: getDateTimeNow() })
        else
          await taskStore.updateTask(props.task.id_task, { ...props.task, datetime_completed: getDateTimeNow(), flg_completed: true })

        await petCustodyStore.fetchPetCustodies({
          date: getDateToday()
        })
      }
    })
}
onMounted(() => {
  if (props.card_type === 'default') {
    datetime.value = props.task.datetime_plan
    formattedDatetime.value = formatHoursMinutes(props.task.datetime_plan)
  } else if (props.card_type === 'check') {
    datetime.value = props.custody.datetime_start_plan
    formattedDatetime.value = formatHoursMinutes(props.custody.datetime_start_plan)
  } else {
    datetime.value = props.custody.datetime_goal_plan

    const isToday = dayjs(props.custody.datetime_goal_plan).isToday()
    if (isToday) {
      formattedDatetime.value = formatHoursMinutes(props.custody.datetime_goal_plan)
      return
    }
    formattedDatetime.value = dayjs(props.custody.datetime_goal_plan).format('MM月 DD日 HH:mm')
  }
})
</script>
<template>
  <div
    v-if="(props.card_type === 'default' && !props.task?.flg_completed) || props.card_type !== 'default'"
    :class="getBgBoxClassName(props.task) + ' ' + (props.task ? 'cursor-pointer' : '')"
    @click="openTaskModal()"
    class="box justify-between column q-mr-md q-pa-sm"
  >
    <div>
      <div class="flex justify-between">
        <div class="title1">
          {{ props.card_type === 'default' ? aahTruncate(props.task.name_category2, 5) : props.card_type }}
        </div>
        <div v-if="props.card_type === 'default' && props.task.val_order > 0">
          {{ props.task.val_order }} / {{ props.totalRepetitive }}
        </div>
      </div>
      <div v-if="props.card_type === 'default' && props.task.number_link1" @click.stop="openNumberLinkTask(props.task)" class="text-blue cursor-pointer">
        # {{ props.task.number_link1 }}
      </div>
    </div>
    <div class="flex justify-between items-end">
      <div class="title2">
        {{ formattedDatetime }}
      </div>

      <div v-if="getMinusTime() !== 0 && getMinusTime() < 60" class="title2 text-danger">
        - <span class="text-h5">{{ getMinusTime() }}</span> 分
      </div>
      <div v-else-if="getMinusTime() !== 0 && getMinusTime() > 60" class="title2 text-danger">
        遅れ
      </div>
      <div v-else-if="getRemainingTime()" class="title2 text-danger">
        残り <span class="text-h5">{{ getRemainingTime() }}</span> 分
      </div>

      <q-btn @click.stop="onClickCheck" rounded flat dense class="bg-accent-200">
        <q-icon class="text-accent-600" name="check" />
      </q-btn>
    </div>
  </div>
</template>