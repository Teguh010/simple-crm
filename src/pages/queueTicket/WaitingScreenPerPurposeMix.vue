<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import useQueueTicketStore from '@/stores/queue_ticket'
import useCliCommonStore from '@/stores/cli-common'
import { storeToRefs } from 'pinia'
import { orderBy, groupBy, flatten } from 'lodash'

const queueTicketStore = useQueueTicketStore()
const cliCommonStore = useCliCommonStore()

let timeoutId: NodeJS.Timer | null = null
const switchSlide = ref(false)

const { getQueueTicketLists } = storeToRefs(queueTicketStore)
const { getCliCommonQTVisitPurposeList } = storeToRefs(cliCommonStore)

const queueTickets = computed(() => {
  return orderBy(
    getQueueTicketLists.value.filter((ticket) => {
      return (
        !ticket.flg_auto_absent_updated
        && ticket.type_status_queue_ticket === 3
      )
    }),
    'datetime_service_start'
  )
})

const absentTickets = computed(() => {
  return getQueueTicketLists.value.filter((ticket) => {
    return ticket.flg_auto_absent_updated
  })
})

const groupTickets = computed(() => {
  const grouped = groupBy(queueTickets.value.filter((ticket) => {
    return !ticket.flg_auto_absent_updated
  }), 'type_visit_purpose_ticket')

  return grouped
})

const waitingTickets = computed(() => {
  const flattened = flatten(Object.values(groupTickets.value))
  
  const ticketsShown = Object.keys(groupTickets.value).map((key) => {
    const group = groupTickets.value[key]
    return group.length > 0 ? group[0] : null
  }).map((t) => {
    return t?.id_queue_ticket
  })

  return flattened.filter((f) => {
    return !ticketsShown.includes(f.id_queue_ticket)
  })
})

onMounted(async () => {
  await queueTicketStore.fetchQueueTicketList({
    today: true
  })

  await cliCommonStore.fetchPreparationCliCommonList({ code_cli_common: [4] }, true)

  timeoutId = setInterval(async () => {
    switchSlide.value = !switchSlide.value
    await queueTicketStore.fetchQueueTicketList({
      today: true
    })
  }, 10000)
})

onUnmounted(() => {
  if (timeoutId) {
    clearInterval(timeoutId)
  }
})
</script>

<template>
  <div class="waiting-screen-container q-pa-md">
    <div class="flex doctor-row">
      <div
        v-if="!switchSlide"
        v-for="(purpose, idx) in getCliCommonQTVisitPurposeList.slice(0, 4)"
        class="doctor flex-1"
        :key="idx"
      >
        <div class="head flex items-center text-white q-pa-xs">
          <span
            class="bg-accent-700 q-py-xs q-px-sm q-ml-sm index text-weight-medium"
            >1</span
          >
          <div class="text-center text-weight-medium purpose flex-1">
            {{ purpose.name_cli_common }}
          </div>
        </div>
        <div class="body q-py-md">
          <div class="name text-accent-800 text-center body-text text-weight-medium">
            呼出番号
          </div>
          <div class="text-weight-bold number text-center">
            {{
              queueTickets.find((ticket) => {
                return (
                  ticket.type_visit_purpose_ticket ===
                  parseInt(purpose.code_func1)
                )
              })?.id_queue_ticket ?? '-'
            }}
          </div>
        </div>
      </div>
      <div
        v-if="switchSlide"
        v-for="(purpose, idx) in getCliCommonQTVisitPurposeList.slice(
          4,
          getCliCommonQTVisitPurposeList.length
        )"
        class="doctor flex-1"
        :key="idx"
      >
        <div class="head flex items-center text-white q-pa-xs">
          <span
            class="bg-accent-700 q-py-xs q-px-sm q-ml-sm index text-weight-medium"
            >1</span
          >
          <div class="text-center text-weight-medium purpose flex-1">
            {{ purpose.name_cli_common }}
          </div>
        </div>
        <div class="body q-py-md">
          <div class="name text-accent-800 text-center body-text text-weight-medium">
            呼出番号
          </div>
          <div class="text-weight-bold number text-center">
            {{
              queueTickets.find((ticket) => {
                return (
                  ticket.type_visit_purpose_ticket ===
                  parseInt(purpose.code_func1)
                )
              })?.id_queue_ticket ?? '-'
            }}
          </div>
        </div>
      </div>
    </div>
    <div class="q-mt-md waiting-list q-pa-md">
      <div class="flex justify-between">
        <div class="text-weight-bold heading">待合中</div>
        <div class="text-grey-700">
          診療内容によって診察の順番は前後する場合がございます。予めご了承ください。
        </div>
      </div>
      <div class="q-mt-md flex" style="gap: 10px">
        <q-btn
          v-for="(waitingTicket, idx) in waitingTickets"
          :key="idx"
          :label="waitingTicket.id_queue_ticket"
          class="waiting-btn text-white text-weight-bold"
        />
      </div>
    </div>
    <div class="q-mt-md absence-list q-pa-md bg-grey-200">
      <div class="flex justify-between">
        <div class="text-weight-bold heading">ご不在</div>
        <div class="text-grey-700">受付にお声掛けください。</div>
      </div>
      <div class="q-mt-md flex" style="gap: 10px">
        <q-btn
          v-for="(absent, idx) in absentTickets"
          :label="absent.id_queue_ticket"
          class="absence-btn bg-white text-grey-700 text-weight-bold"
          :key="idx"
        />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.waiting-screen-container {
  height: 100vh;
  .doctor-row {
    gap: 10px;
    height: 40%;
    .doctor {
      border: 1px solid #e79725;
      border-radius: 5px;
      overflow: hidden;
      .head {
        background: #e79725;
        .index {
          border-radius: 5px;
        }
        .purpose {
          font-size: 36px;
        }
      }
      .body {
        .body-text {
          font-size: 20px;
        }
        .number {
          font-size: 60px;
        }
      }
      @media screen and (max-width: 1100px) {
        .head {
          .purpose {
            font-size: 32px;
          }
        }
        .body {
          .body-text {
            font-size: 20px;
          }
          .number {
            font-size: 60px;
          }
        }
      }
    }
  }
  .waiting-list {
    height: 25%;
    background: #faebd6;
    border-radius: 10px;
    .heading {
      color: #e79725;
      font-size: 40px;
    }
    .waiting-btn {
      background: #e79725;
      font-size: 30px;
    }
    @media screen and (max-width: 1100px) {
      .heading {
        font-size: 40px;
      }
      .waiting-btn {
        font-size: 30px;
      }
    }
  }
  .absence-list {
    height: 25%;
    border-radius: 10px;
    .heading {
      font-size: 40px;
    }
    .absence-btn {
      font-size: 30px;
    }
    @media screen and (max-width: 1100px) {
      .heading {
        font-size: 40px;
      }
      .absence-btn {
        font-size: 30px;
      }
    }
  }
  .flex-1 {
    flex: 1;
  }
}
</style>
