<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFormInputDate from '@/components/form/MtFormInputDate.vue'
import MemoCarte from './MemoCarte.vue'
import { CarteGroup, ClinicalFile } from '@/types/types'
import { copyText, getFullPetName, getDateTimeNow } from '@/utils/aahUtils'
import { removeHtmlTag } from '../memoCarteUtils'
import mtUtils from '@/utils/mtUtils'
import useCustomerStore from '@/stores/customers'
import useMemoCarteStore, { MemoCarteGroupType } from '@/stores/memo-cartes'
import { storeToRefs } from 'pinia'
import MtPetInfo from '@/components/MtPetInfo.vue'

const emits = defineEmits(['close'])

const memoCarteStore = useMemoCarteStore()
const { getGroupedMemoCartes } = storeToRefs(memoCarteStore)

const props = withDefaults(
  defineProps<{
    id_customer: string,
    id_pet: string,
    datetimeInsert: string
    requestDetailPage?: any
  }>(),
  {
    id_customer: '',
    id_pet: '',
    datetimeInsert: ''
  }
)

const currentMemoCarte = computed(() => {
  const getMemoCarte = getGroupedMemoCartes.value.find((groupedMemoCarte: MemoCarteGroupType) => groupedMemoCarte.datetimeInsert === props.datetimeInsert) ?? null
  if (getMemoCarte) {
    return getMemoCarte
  } else {
    if (memoCarteStore.getMemoCartePetDetail) {
      return memoCarteStore.getMemoCartePetDetail
    }
  }
  return null
})
const memoCartes = computed(() => getGroupedMemoCartes.value.filter((groupedMemoCarte: MemoCarteGroupType) => groupedMemoCarte.datetimeInsert !== props.datetimeInsert))

const currentComparisonedCarte = ref(0)
const currentMemoCarteRef = ref(), currentComparisonedCarteRef = ref()
const disableCarteUpdate = ref(false)

const closeModal = () => emits('close')

const numberMemoCarte = computed(() => currentMemoCarte.value?.data_cartes?.memo_carte_list[0]?.number_memo_carte ?? '')
const currentComparisonedCarteMemo = computed(() => memoCartes.value?.[currentComparisonedCarte.value].data_cartes.memo_carte_list[0]?.memo_sbj ?? '')

const comparisonedDatetimeMemoCarte = ref(getDateTimeNow()), 
  currentDatetimeMemoCarte = ref(currentMemoCarte.value?.data_cartes?.memo_carte_list[0]?.datetime_memo_carte ?? getDateTimeNow())

const clickPrev = () => {
  if(currentComparisonedCarte.value === 0) currentComparisonedCarte.value = memoCartes.value.length - 1
  else --currentComparisonedCarte.value
}
const clickNext = () => {
  if(currentComparisonedCarte.value === memoCartes.value.length - 1) currentComparisonedCarte.value = 0
  else ++currentComparisonedCarte.value
}

const updateCurrentMemoCarte = async () => {
  disableCarteUpdate.value = true
  try {
    await currentMemoCarteRef.value.updateCarte()
    await memoCarteStore.fetchMemoCarteV1({
      id_pet: props.id_pet,
      id_customer: props.id_customer,
      page_size: 200
    })
    mtUtils.alert('左の診療カルテを更新しました。')
  } catch (err) {
    console.log(err)
  } finally {
    disableCarteUpdate.value = false
  }
}

const updateCurrentComparisonedMemoCarte = async () => {
  disableCarteUpdate.value = true
  try {
    await currentComparisonedCarteRef.value.updateCarte()
    await memoCarteStore.fetchMemoCarteV1({
      id_pet: props.id_pet,
      id_customer: props.id_customer,
      page_size: 200
    })
    mtUtils.alert('右の診療カルテを更新しました。')
  } catch (err) {
    console.log(err)
  } finally {
    disableCarteUpdate.value = false
  }
}

const handleComparisonedDatetimeMemoCarte = (val: string) => {
 currentComparisonedCarteRef.value.updateDatetimeMemoCarte(val)
}

const handleDatetimeMemoCarte = (val: string) => {
 currentMemoCarteRef.value.updateDatetimeMemoCarte(val)
}

watch(currentComparisonedCarte, (newVal) => {
  const memoCarteList = memoCartes.value[newVal]?.data_cartes?.memo_carte_list
  comparisonedDatetimeMemoCarte.value = memoCarteList?.[0]?.datetime_memo_carte ?? getDateTimeNow()
}, { immediate: true })


</script>
<template>
  <MtModalHeader class="mt-header" @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold row items-center">
      診療カルテ比較モード：
      <span @click="copyText(numberMemoCarte)" class="cursor-pointer">
        {{ numberMemoCarte }}
        <q-icon name="content_copy" class="blue" />
      </span>
      <MtPetInfo class="ellipsis full-width" />
    </q-toolbar-title>
  </MtModalHeader>
  <div class="row q-col-gutter-md content">
    <div class="col-12 col-md-6 q-mt-md">
      <div>
        <MtFormInputDate
          v-model:date="currentDatetimeMemoCarte"
          label="メモカルテ記録日時"
          class="q-mx-md datetime-memo-carte"
          @update:date="handleDatetimeMemoCarte"
        />    
      </div>
      <div class="q-mt-md">
        <MemoCarte
          :dateInsert="currentMemoCarte.date_insert"
          :dataCartes="currentMemoCarte.data_cartes"
          :clinicalFile="currentMemoCarte.clinical_file"
          :idPetIllnessHistory="currentMemoCarte.id_pet_illness_history"
          :idCustomer="props.id_customer"
          :idPet="props.id_pet"
          ref="currentMemoCarteRef"
          :screenMargin="295"
          :requestDetailPage="props.requestDetailPage"
        />
      </div>
    </div>
    <div class="col-12 col-md-6 q-mt-md">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <q-btn
            @click.stop="clickPrev"
            flat
            round
            dense
            icon="chevron_left"
            class="btn"
          />
          <div class="flex items-center">
            <MtFormInputDate
              v-model:date="comparisonedDatetimeMemoCarte"
              label="メモカルテ記録日時"
              class="q-mx-md datetime-memo-carte"
              @update:date="handleComparisonedDatetimeMemoCarte"
            />
            <div class="ellipsis" style="max-width: 500px;">主観：{{ removeHtmlTag(currentComparisonedCarteMemo) }} </div>
          </div>
        </div>
        <q-btn
          @click.stop="clickNext"
          flat
          round
          dense
          icon="chevron_right"
          class="btn q-mr-lg"
        />
      </div>

      <div class="q-mt-md q-pb-lg">
        <MemoCarte
          :dateInsert="memoCartes[currentComparisonedCarte].date_insert || ''"
          :dataCartes="memoCartes[currentComparisonedCarte].data_cartes"
          :clinicalFile="memoCartes[currentComparisonedCarte].clinical_file"
          :idPetIllnessHistory="memoCartes[currentComparisonedCarte].id_pet_illness_history"
          :idCustomer="props.id_customer"
          :idPet="props.id_pet"
          :key="currentComparisonedCarte"
          :screenMargin="295"
          ref="currentComparisonedCarteRef"
        />
      </div>
    </div>
  </div>
  <q-card-section class="q-bt bg-white actions-sec">
    <div class="text-center modal-btn row q-col-gutter-md">
      <div class="col-5">
        <q-btn unelevated color="primary" class="q-mr-md" @click="updateCurrentMemoCarte" :disable="disableCarteUpdate">
          <span>左の保存</span>
        </q-btn>
      </div>
      <div class="col-2">
        <q-btn
          outline
          class="bg-grey-100 text-grey-800"
          @click="closeModal(false)"
        >
          <span>キャンセル</span>
        </q-btn>
      </div>
      <div class="col-5">
        <q-btn unelevated color="primary" class="q-ml-md" @click="updateCurrentComparisonedMemoCarte" :disable="disableCarteUpdate">
          <span>右の保存</span>
        </q-btn>
      </div>
    </div>
  </q-card-section>
</template>
<style lang="scss" scoped>
.content {
  height: calc(100dvh - 180px);
}
.actions-sec {
  bottom: 0;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
}
.datetime-memo-carte {
  width: 30%;
  flex: 1;
}
</style>