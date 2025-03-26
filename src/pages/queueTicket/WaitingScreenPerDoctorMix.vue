<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { orderBy, groupBy, flatten } from 'lodash'
import useQueueTicketStore from '@/stores/queue_ticket'
import useCliCommonStore from '@/stores/cli-common'
import useEmployeeStore from '@/stores/employees'
import { QueueTicketType } from '@/types/types'

// Constants
const REFRESH_INTERVAL = 7000
const QUEUE_STATUS = {
  WAITING: 1 as number,
  IN_PROGRESS: 2 as number,
  CALLED: 3 as number,
  ABSENT: 4 as number,
} as const

// Store initialization
const queueTicketStore = useQueueTicketStore()
const cliCommonStore = useCliCommonStore()
const employeeStore = useEmployeeStore()

// Store refs
const { getQueueTicketLists } = storeToRefs(queueTicketStore)
const { getEmployees } = storeToRefs(employeeStore)

// State
const timeoutId = ref<NodeJS.Timer | null>(null)
const switchSlide = ref(false)

// Computed Properties
const confirmedQueueTickets = computed(() => {
  const calledTickets = getQueueTicketLists.value.filter(ticket => 
    ticket.type_status_queue_ticket === QUEUE_STATUS.CALLED
  )
  
  // Group tickets by doctor
  const groupedByDoctor = groupBy(calledTickets, 'id_employee_doctor')
  
  // For each doctor, keep only the most recent CALLED ticket
  const filteredTickets = Object.values(groupedByDoctor).map(doctorTickets => 
    getMostRecentTicket(doctorTickets)
  )
  
  // Order the filtered tickets
  return orderBy(filteredTickets, 'datetime_service_start')
})

const waitingQueueTickets = computed(() => {
  return orderBy(
    getQueueTicketLists.value.filter(ticket => 
      ticket.type_status_queue_ticket === QUEUE_STATUS.WAITING ||
      ticket.type_status_queue_ticket === QUEUE_STATUS.IN_PROGRESS
    ),
    'datetime_service_start'
  )
})

const confirmedTicketsGrouped = computed(() => {
  return groupBy(confirmedQueueTickets.value, 'id_employee_doctor')
})

const waitingTicketsGrouped = computed(() => {
  return groupBy(waitingQueueTickets.value, 'id_employee_doctor')
})

const waitingTickets = computed(() => {
  const flattened = flatten(Object.values(waitingTicketsGrouped.value))
  const shownTicketIds = Object.values(waitingTicketsGrouped.value)
    .map(group => group[0]?.id_queue_ticket)
    .filter(Boolean)

  return flattened.filter(ticket => 
    !shownTicketIds.includes(ticket.id_queue_ticket)
  )
})

const absentTickets = computed(() => {
  return getQueueTicketLists.value.filter(ticket => 
    ticket.type_status_queue_ticket === QUEUE_STATUS.ABSENT
  )
})

// Methods

// Helper function to get the most recent ticket for a doctor
const getMostRecentTicket = (tickets: QueueTicketType[]) => {
  return orderBy(tickets, 'datetime_service_start', 'desc')[0]
}

const setupPolling = async () => {
  await refreshData()
  timeoutId.value = setInterval(refreshData, REFRESH_INTERVAL)
}

const refreshData = async () => {
  switchSlide.value = !switchSlide.value
  await Promise.all([
    queueTicketStore.fetchQueueTicketList({ today: true }),
    cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [4] }, true)
  ])
}

// Lifecycle hooks
onMounted(setupPolling)

onUnmounted(() => {
  if (timeoutId.value) {
    clearInterval(timeoutId.value)
  }
})
</script>

<template>
  <div class="waiting-screen-container q-pa-md">
    <!-- Called Section -->
    <section class="called-section q-mt-md q-pa-md bg-skin-100">
      <header class="flex justify-between items-center">
        <h2 class="text-weight-bold heading">呼び出し中</h2>
        <p class="text-grey-700 instruction-text">
          診察室にお入りください。
        </p>
      </header>

      <div class="flex gap-2">
        <q-btn
          v-for="ticket in confirmedQueueTickets"
          :key="ticket.id_queue_ticket"
          :label="ticket.number_queue_ticket"
          class="queue-btn bg-white text-grey-700 text-weight-bold"
        />
      </div>
    </section>

    <!-- Waiting Section -->
    <section class="waiting-section q-mt-md q-pa-md">
      <header class="flex justify-between items-center">
        <h2 class="text-weight-bold heading">待合中</h2>
        <p class="text-grey-700 instruction-text">
          診療内容によって診察の順番は前後する場合がございます。予めご了承ください。
        </p>
      </header>

      <div class="q-mt-md flex gap-2">
        <div v-if="!waitingQueueTickets.length" class="empty-ticket">
          <span>受付中はありません</span>
        </div>
        <q-btn
          v-for="ticket in waitingQueueTickets"
          :key="ticket.id_queue_ticket"
          :label="ticket.number_queue_ticket"
          class="queue-btn waiting-btn text-white text-weight-bold"
        />
      </div>
    </section>

    <!-- Absent Section -->
    <section class="absent-section q-mt-md q-pa-md bg-grey-200">
      <header class="flex justify-between items-center">
        <h2 class="text-weight-bold heading">ご不在</h2>
        <p class="text-grey-700 instruction-text">
          受付にお声掛けください。
        </p>
      </header>

      <div class="q-mt-md flex gap-2">
        <q-btn
          v-for="ticket in absentTickets"
          :key="ticket.id_queue_ticket"
          :label="ticket.number_queue_ticket"
          class="queue-btn bg-white text-grey-700 text-weight-bold"
        />
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.waiting-screen-container {
  height: 100vh;
}

// Common styles for sections
.called-section,
.waiting-section,
.absent-section {
  border-radius: 10px;

  .heading {
    font-size: 40px;
    color: #306671;
  }

  .instruction-text {
    font-size: 26px;
  }
}

// Called section specific styles
.called-section {
  height: 25%;
}

// Waiting section specific styles
.waiting-section {
  height: auto;
  background: #d3e7ea;

  .waiting-btn {
    background: #306671;
  }
}

// Absent section specific styles
.absent-section {
  height: 25%;
}

// Common button styles
.queue-btn {
  font-size: 28px;
  padding: 0 28px;
  border-radius: 6px;
  font-weight: bold;
  min-height: unset;

  &.waiting-btn {
    margin-top: 8px;
  }
}

// Empty state styles
.empty-ticket {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  color: #757575;
  font-size: 40px;
}

// Media queries
@media screen and (max-width: 1100px) {
  .heading {
    font-size: 40px;
  }

  .queue-btn {
    font-size: 28px;
  }

  .instruction-text {
    font-size: 26px;
  }
}
</style>