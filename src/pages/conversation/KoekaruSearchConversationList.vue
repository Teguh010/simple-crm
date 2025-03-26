<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtHeader from '@/components/layouts/MtHeader.vue'
import MtTable2 from '@/components/MtTable2.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import mtUtils from '@/utils/mtUtils'
import UpdateSummaryAudioModal from '@/pages/conversation/UpdateSummaryAudioModal.vue'
import useRequestStore from '@/stores/requests'
import useCommonStore from '@/stores/common'

import {
  dateFormat,
  getPetImageUrl,
  handleImageError,
  getCustomerLabelColor,
  getCustomerName
} from '@/utils/aahUtils'
import { storeToRefs } from 'pinia'
import useConversationStore, { ConversationStatus } from '@/stores/Conversation'
import { setPageTitle } from '@/utils/pageTitleHelper'
import koekaruApi, { secretKey, getInstance } from '@/boot/axiosKoekaru'

import dayjs from 'dayjs'

import { useRouter } from 'vue-router'

const requestStore = useRequestStore()
const commonStore = useCommonStore()

const router = useRouter()

const taskListData = ref<any>([])
const requestCache = ref<any>({})
const tableElement = ref(null),
  page = ref(1)
let timeout: any = null

const columns = [
  {
    name: 'id_conversation',
    label: '会話番号',
    field: 'id_conversation',
    align: 'left'
  },
  {
    name: 'createdAt',
    label: '診察日時',
    field: 'createdAt',
    align: 'left'
  },
  {
    name: 'name_customer',
    label: 'オーナー名',
    field: 'name_customer',
    align: 'left'
  },
  {
    name: 'pet_name',
    label: 'ペット名',
    field: 'pet_name',
    align: 'left'
  },
  {
    name: 'request_id',
    label: 'リクエストID',
    field: 'request_id',
    align: 'left'
  },
  {
    name: 'task_status',
    label: 'ステータス',
    field: 'task_status',
    align: 'left',
    style: 'width: 30%'
  },
  {
    name: 'mic',
    label: '',
    field: 'mic',
    align: 'center'
  }
]
const searchData = ref({
  id_vet_user: null,
  datetime_created_from: dayjs().subtract(7, 'day').format('YYYY/MM/DD'),
  datetime_created_to: dayjs().format('YYYY/MM/DD')
})
const moveNext = (e) => {
  const inputs = Array.from(
    e.target.form.querySelectorAll('input[type="text"]')
  )
  const index = inputs.indexOf(e.target)
  if (index === 0) {
    inputs[index + 1].focus()
  } else {
    inputs[1].blur()
    search()
  }
}
const fetchData = async () => {
  try {
    const res = await koekaruApi.post(`/task-list`, { limit: 15, skip: 0 })

    const data = res.data.data
    const setTaskListData = []
    const requestCache = []

    for (const item of data) {
      const id_vetty_request = item.id_vetty_request
      if (id_vetty_request) {
        if (requestCache[id_vetty_request]) {
          setTaskListData.push({
            ...item,
            requestData: {
              ...requestCache[id_vetty_request],
              customer: {
                ...requestCache[id_vetty_request].customer,
                pet: requestCache[id_vetty_request].customer.pets.find(
                  (pet: any) =>
                    pet.id_pet === requestCache[id_vetty_request].id_pet
                )
              }
            }
          })
        } else {
          try {
            const requestData = await requestStore.fetchRequest(
              id_vetty_request
            )
            if (requestData) {
              requestCache[id_vetty_request] = requestData.data.data
              setTaskListData.push({
                ...item,
                requestData: {
                  ...requestCache[id_vetty_request],
                  customer: {
                    ...requestCache[id_vetty_request].customer,
                    pet: requestCache[id_vetty_request].customer.pets.find(
                      (pet: any) =>
                        pet.id_pet === requestCache[id_vetty_request].id_pet
                    )
                  }
                }
              })
            }
          } catch (error) {
            setTaskListData.push({
              item
            })
          }
        }
      } else {
        setTaskListData.push({
          item
        })
      }
    }

    taskListData.value = setTaskListData
  } catch (error) {
    console.error('Error fetching data:', error)
  }
  // taskListData.value = []
  // const res = await
  // taskListData.value = res.data.data
}

const updateConversation = async (conversation: any) => {
  const resAudio = await koekaruApi.get(
    `/task-details?id_request=${conversation.id_request}`
  )
  const resOutput = await koekaruApi.get(
    `/output-data?id_conversation=${conversation.id_conversation}`
  )

  const data = {
    transcription: resOutput.data.data.transcript,
    transcript_with_timeline: resOutput.data.data.transcript_with_timeline,
    path_full_audio_file: resAudio.data.data.full_audio,
    summary: resOutput.data.data.summary.answers
  }

  mtUtils.popup(UpdateSummaryAudioModal, {
    data: data
  })
}

const recordingTime = (row: any) => {
  const startTime = dayjs(row.startTime)
  const endTime = dayjs(row.endTime)
  const duration = endTime.diff(startTime, 'seconds')
  const minutes = String(Math.floor(duration / 60)).padStart(2, '0')
  const seconds = String(duration % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

const switchStatusLabel = (status: string) => {
  if (!status) return ''
  const lowerarcaseStatus = status.toLowerCase()
  switch (lowerarcaseStatus) {
    case 'completed':
      return '完了'
    case 'upload':
      return '保留中'
    case 'error':
      return 'エラー | 予期せぬエラーが発生しました。'
    case 'ready':
      return '処理中'
    default:
      return ''
  }
}

const setCustomerFullName = (customer: any) => {
  return `${customer.name_kana_family} ${customer.name_kana_first}`
}

const getTypeAnimal = (id_cm_animal: number) => {
  return commonStore.getCommonTypeAnimalOptionList.find(
    (v: any) => v.id_common == id_cm_animal
  )
}

const getTypeAnimalColor = (id_cm_animal: number) => {
  const typeAnimal = getTypeAnimal(id_cm_animal)
  return typeAnimal && typeAnimal.text1 ? typeAnimal.text1 : 'transparent'
}

onMounted(async () => {
  try {
    if (!secretKey) await getInstance()
    await fetchData()
    // const request = await requestStore.fetchRequest('2937')
  } catch (error: any) {
    if (error.response.data.detail === 'unauthorised access') {
      await getInstance()
      await fetchData()
    }
  }

  // set page title
  setPageTitle('自動要約一覧')
})
</script>

<template>
  <q-page>
    <MtHeader>
      <q-toolbar class="text-primary q-pa-none">
        <q-toolbar-title class="title2 bold text-grey-900">
          AI カルテ 一覧
        </q-toolbar-title>
        <div class="row mobile-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：Start"
                v-model:date="searchData.datetime_created_from"
                autofocus
                @keydown.enter="moveNext"
                @update:date = "()=> searchData.datetime_created_to = searchData.datetime_created_from"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：End"
                class="q-mx-sm"
                v-model:date="searchData.datetime_created_to"
                @keydown.enter="moveNext"
              />
              <q-btn
                unelevated
                color="accent-800"
                text-color="white"
              >
                <q-icon size="20px" name="search" />検索
              </q-btn>
            </div>
          </div>
        </div>
        <div class="row desktop-hide">
          <div class="col-12">
            <div class="flex items-center">
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：Start"
                v-model:date="searchData.datetime_created_from"
                autofocus
                @keydown.enter="moveNext"
                @update:date = "()=> searchData.datetime_created_to = searchData.datetime_created_from"
              />
              <MtFormInputDate
                outlined
                type="date"
                label="作成日：End"
                class="q-mx-sm"
                v-model:date="searchData.datetime_created_to"
                @keydown.enter="moveNext"
              />
             
              <q-btn
                color="grey-800"
                text-color="white"
                unelevated
                class="q-mx-sm" 
              >
                <q-icon size="20px" name="search" />
              </q-btn>
            </div>
          </div>
        </div>
      </q-toolbar>
    </MtHeader>
    <span ref="tableElement">
      <MtTable2
        :columns="columns"
        :rows="taskListData"
        :rowsBg="true"
        class="custody-table q-pt-sm"
        flat
      >
        <template v-slot:row="{ row }">
          <td v-for="(col, index) in columns" :key="index" :class="col.field === 'id_conversation' ? 'selectable-text' : ''">
            <template v-if="col.field === 'id_conversation'">
              {{ row.id_conversation }}
            </template>
            <template v-else-if="col.field === 'createdAt'">
              {{ dayjs(row.createdAt).format('YYYY/MM/DD') }}
            </template>
            <div v-else-if="col.field == 'name_customer'">
              <div v-if="row?.requestData">
                <span class="caption2 regular text-grey-700">
                  {{ setCustomerFullName(row?.requestData.customer) }}
                </span>
                <div>
                  {{
                    getCustomerName({
                      name_customer_display:
                        row?.requestData.customer.name_customer_display,
                      name_family: row?.requestData.customer.name_kana_family,
                      name_corporate: row?.requestData.customer.name_corporate
                    })
                  }}
                  <q-icon
                    v-if="row?.requestData.customer.type_customer_color"
                    size="12px"
                    name="circle"
                    class="q-ml-xs"
                    :color="
                      getCustomerLabelColor(
                        row?.requestData.customer.type_customer_color
                      )
                    "
                    :style="{
                      color: getCustomerLabelColor(
                        row?.requestData.customer.type_customer_color
                      )
                    }"
                  />
                </div>
              </div>
            </div>
            <div v-else-if="col.field == 'pet_name'">
              <div
                class="avatar-container"
                v-if="row?.requestData?.customer?.pet"
              >
                <img
                  v-if="row?.requestData.customer.pet"
                  :src="getPetImageUrl(row?.requestData.customer.pet)"
                  @error="
                    handleImageError($event, row?.requestData.customer.pet)
                  "
                  :alt="row?.requestData.customer.pet.name_pet"
                  class="image-responsive"
                  loading="lazy"
                />
                <div v-else class="default bg-grey-300" />
                <div>
                  <span class="caption2 regular text-grey-700">{{
                    row?.requestData.customer.pet.name_kana_pet
                  }}</span>
                  <div>
                    {{ row?.requestData.customer.pet.name_pet }}
                    <q-icon
                      size="12px"
                      name="circle"
                      class="q-ml-xs"
                      :color="
                        getTypeAnimalColor(
                          row?.requestData.customer.pet.id_cm_animal
                        )
                      "
                      :style="{
                        color: getTypeAnimalColor(
                          row?.requestData.customer.pet.id_cm_animal
                        )
                      }"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="col.field == 'request_id'">
              <div
                @click="
                  router.push(`/SearchRequestList/${row?.id_vetty_request}`)
                "
                v-if="row?.id_vetty_request"
                style="cursor: pointer"
              >
                {{ row?.id_vetty_request }}
              </div>
            </div>
            <template v-else-if="col.field === 'task_status'">
              {{ switchStatusLabel(row.task_status) }}
            </template>
            <template v-else-if="col.field === 'mic'">
              <div
                class="flex items-center q-gutter-x-sm cursor-pointer"
                @click.stop="updateConversation(row)"
              >
                <div class="flex items-center justify-center">
                  <img
                    src="@/assets/img/aiVetty/mic.png"
                    width="17"
                    height="22"
                    class="cursor-pointer"
                  />
                </div>
                <div class="">診療記録を確認する</div>
              </div>
            </template>
          </td>
        </template>
      </MtTable2>
    </span>
  </q-page>
</template>

<style lang="scss" scoped>
.selectable-text {
  -webkit-touch-callout: text !important;
  -webkit-user-select: text !important;
  user-select: text !important;
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 8px;
  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}
</style>
