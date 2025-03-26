<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import MtFilterSelect from '@/components/MtFilterSelect.vue'
import { storeToRefs } from 'pinia'
import useIllnessHistoryStore from '@/stores/illness-history'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import aahMessages from '@/utils/aahMessages'

const illnessHistoryStore = useIllnessHistoryStore()

const {
  getIllnessHistory,
  getIllnessHistorys
} = storeToRefs(illnessHistoryStore)

const props = defineProps({ id_pet_illness_history: String, id_pet: String, id_request: String })
const emits = defineEmits(['close'])

const closeModal = () => {
  emits('close')
}
const data = ref({
  id_pet_illness_history: null
})

const illnessHistoryList: any = ref([])
const illnessHistoryListDefault: any = reactive([])

const isChanged = ref(false)

const submit = async (from: any) => {

  let allow = true
  let updateAll = false

  if (from == 'all') {
    updateAll = await mtUtils.confirm('この操作はこのペットの指定の対応歴を「置換後の対応歴」への置換を実行します。\n実行しますか？', '確認', 'OK')


    if (!updateAll) {
      return
    }
  }

  if (!allow) return

  const response = await mtUtils.callApi(selectOptions.reqMethod.POST, 'replaceIllnessHistory', {
    id_pet_illness_history_old: props.id_pet_illness_history,
    id_pet_illness_history: data.value.id_pet_illness_history,
    id_pet: props.id_pet,
    id_request: props.id_request,
    updateAll: updateAll
  })

  if (response) {
    await mtUtils.autoCloseAlert(aahMessages.success)
  }

  closeModal()
  return
}

onMounted(async () => {
  illnessHistoryStore.getIllnessHistorys.map((illnessHistory) => {

    const name = `${illnessHistory.number_pet_illness_history} ${illnessHistory.name_disease ?? illnessHistory?.name_disease_free}`

    const temp = {
      label: name,
      value: illnessHistory.id_pet_illness_history
    }
    illnessHistoryListDefault.push(temp)
    illnessHistoryList.value.push(temp)
  })

  data.value.id_pet_illness_history = JSON.parse(JSON.stringify(props.id_pet_illness_history))
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 boldtitle2">
      対応歴の置換
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div class="col-6">
      <MtFilterSelect
        v-model:options="illnessHistoryList"
        v-model:selecting="data.id_pet_illness_history"
        :options-default="illnessHistoryListDefault"
        label="置換後の対応歴"
        required
      />
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>閉じる</span>
      </q-btn>
      <q-btn class="q-ml-md" color="primary" unelevated @click="submit('request')">
        <span>このRQ内で置換</span>
      </q-btn>
      <!-- <q-btn class="q-ml-md" color="primary" unelevated @click="submit('all')">
        <span>全てで置換</span>
      </q-btn> -->
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>
.modal-btn {
  .q-btn {
    width: 150px;
    min-height: 38px;
    // width for mobile screens
    @media screen and (max-width: 500px) {
      width: 100%;
    }
  }
}
</style>
