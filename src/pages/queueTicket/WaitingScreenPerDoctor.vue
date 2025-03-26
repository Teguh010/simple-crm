<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import useQueueTicketStore from '@/stores/queue_ticket'
import useEmployeeStore from '@/stores/employees'
import { storeToRefs } from 'pinia'
import { orderBy, groupBy } from 'lodash'
import { QueueTicketType } from '@/types/types'

// Constants
const REFRESH_INTERVAL = 7000
const QUEUE_STATUS = {
  WAITING: 1 as number,
  IN_PROGRESS: 2 as number,
  CALLED: 3 as number,
  ABSENT: 4 as number,
} as const

// Store setup
const queueTicketStore = useQueueTicketStore()
const employeeStore = useEmployeeStore()
const { getQueueTicketLists } = storeToRefs(queueTicketStore)
const { getEmployees } = storeToRefs(employeeStore)

// State
const timeoutId = ref<NodeJS.Timer | null>(null)
const switchSlide = ref(false)

// Computed properties
const activeTickets = computed(() => {
  return getQueueTicketLists.value.filter(
    (ticket) =>
      [
        QUEUE_STATUS.WAITING,
        QUEUE_STATUS.IN_PROGRESS,
        QUEUE_STATUS.CALLED
      ].includes(ticket.type_status_queue_ticket)
  )
})

const confirmedQueueTickets = computed(() => {
  const ordered = orderBy(activeTickets.value, 'datetime_service_start')
  const grouped = groupBy(ordered, 'id_employee_doctor')
  Object.keys(grouped).forEach(doctorId => {
    const tickets = grouped[doctorId]
    const calledTickets = tickets.filter(ticket => ticket.type_status_queue_ticket === QUEUE_STATUS.CALLED)
    
    if (calledTickets.length > 1) {
      // Keep only the most recent called ticket
      const mostRecentCalledTicket = orderBy(calledTickets, 'datetime_service_start', 'desc')[0]
      grouped[doctorId] = [
        mostRecentCalledTicket,
        ...tickets.filter(ticket => ticket.type_status_queue_ticket !== QUEUE_STATUS.CALLED)
      ]
    }
  })
  return grouped
})

const absentTickets = computed(() =>
  getQueueTicketLists.value.filter((ticket) => ticket.type_status_queue_ticket === QUEUE_STATUS.ABSENT)
)

// Methods
const isTicketInProgress = (ticket: QueueTicketType): boolean => {
  return ticket.type_status_queue_ticket === QUEUE_STATUS.CALLED
}

const getWaitingTickets = (tickets: QueueTicketType[]): QueueTicketType[] => {
  return isTicketInProgress(tickets[0]) ? tickets.slice(1) : tickets
}

// Lifecycle hooks
const setupPolling = async () => {
  await refreshData()
  timeoutId.value = setInterval(async () => {
    switchSlide.value = !switchSlide.value
    await refreshData()
  }, REFRESH_INTERVAL)
}

const refreshData = async () => {
  await queueTicketStore.fetchQueueTicketList({ today: true })
}

onMounted(setupPolling)

onUnmounted(() => {
  if (timeoutId.value) {
    clearInterval(timeoutId.value)
  }
})
</script>

<template>
  <div class="waiting-screen-container q-pa-md">
    <div class="flex doctor-row">
      <template v-if="Object.values(confirmedQueueTickets).length">
        <div
          v-for="(tickets, doctorId, idx) in confirmedQueueTickets"
          :key="doctorId"
          class="flex-1 doctor-container"
        >
          <div class="doctor">
            <div class="head flex items-center text-white">
              <span
                class="bg-accent-700 q-py-xs q-px-sm q-ml-sm q-mt-sm q-mb-sm index text-weight-medium"
              >
                {{ idx + 1 }}
              </span>
              <p
                class="doctor-name text-center text-lg text-weight-medium flex-1 items-center"
              >
                {{ tickets[0]?.employee_doctor?.name_display ?? '担当なし' }}
              </p>
            </div>

            <div class="body">
              <p
                class="queue-number name text-accent-800 text-center text-weight-medium q-mt-lg q-mb-none"
              >
                呼出番号
              </p>
              <p class="text-weight-bold number text-center">
                {{
                  isTicketInProgress(tickets[0])
                    ? tickets[0].number_queue_ticket
                    : '-'
                }}
              </p>
            </div>
          </div>

          <div v-if="getWaitingTickets(tickets).length" class="next-tickets">
            <div class="head text-white">待合中</div>
            <div class="body">
              <template
                v-for="(ticket, index) in getWaitingTickets(tickets)"
                :key="ticket.number_queue_ticket"
              >
                <p class="next-number">
                  {{ ticket.number_queue_ticket }}
                </p>
                <hr v-if="index !== getWaitingTickets(tickets).length - 1" />
              </template>
            </div>
            <!-- <div class="footer" /> -->
          </div>
        </div>
      </template>

      <div v-else class="empty-ticket">
        <span>受付中はありません</span>
      </div>

      <div v-if="absentTickets.length" class="absence-list">
        <p class="head">ご不在</p>
        <template
          v-for="(ticket, index) in absentTickets"
          :key="ticket.number_queue_ticket"
        >
          <p class="body">
            {{ ticket.number_queue_ticket }}
          </p>
          <hr v-if="index !== absentTickets.length - 1" />
        </template>
      </div>
    </div>

    <div class="footer-text">
      診療内容によって診察の順番は前後する場合がございます。予めご了承ください。
    </div>
  </div>
</template>

<style lang="scss" scoped>
.waiting-screen-container {
  height: 100vh;
  display: flex;
  flex-direction: column;

  .doctor-row {
    gap: 10px;

    .doctor-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  }

  .doctor {
    border: 1px solid #2c6671;
    border-radius: 5px;
    overflow: hidden;

    .head {
      background: #2c6671;
      height: 55px;

      .index {
        border-radius: 3px;
        width: 38px;
        font-size: 21px;
        text-align: center;
      }

      .doctor-name {
        margin: 0;
        font-size: 28px;
      }
    }

    .body {
      .queue-number {
        font-size: 22px;
        font-weight: 600;
      }

      .number {
        font-size: 60px;
      }
    }
  }

  .next-tickets {
    border: 1px solid #2c6671;
    border-radius: 5px;

    .head {
      background: #2c6671;
      padding: 16px 0;
      text-align: center;
      font-size: 28px;
      color: white;
    }

    .body {
      padding: 8px 0;
      text-align: center;

      .next-number {
        font-size: 40px;
        font-weight: bold;
        margin: 0;
      }

      hr {
        border: 1px solid #2c6671;
      }
    }

    .footer {
      background: #2c6671;
      height: 25px;
    }
  }

  .absence-list {
    background: #eeeeee;
    max-width: 200px;
    padding-bottom: 48px;

    .head {
      font-weight: bold;
      font-size: 30px;
      text-align: center;
      padding: 16px 48px;
      margin: 0;
    }

    .body {
      text-align: center;
      font-weight: bold;
      font-size: 40px;
      background: #ffffff;
      margin: 0;
    }

    hr {
      border: 1px solid #eeeeee;
      margin: 0;
    }
  }

  .empty-ticket {
    display: flex;
    justify-content: center;
    align-items: center;
    color: #757575;
    font-size: 40px;
    width: 80%;
  }

  .footer-text {
    background: #010405;
    height: 10%;
    color: #eeeeee;
    font-size: 32px;
    text-align: center;
    margin-top: auto;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

@media screen and (max-width: 1100px) {
  .doctor {
    .head .doctor-name {
      font-size: 28px;
    }

    .body {
      .queue-number {
        font-size: 20px;
      }

      .number {
        font-size: 60px;
      }
    }
  }
}
</style>
