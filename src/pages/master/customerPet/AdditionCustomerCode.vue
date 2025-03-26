<script lang="ts" setup>
import MtModalHeader from '@/components/MtModalHeader.vue'
import { onMounted, ref } from 'vue'
import mtUtils from '@/utils/mtUtils'
import selectOptions from '@/utils/selectOptions'
import MtFormInputNumber from '@/components/form/MtFormInputNumber.vue'
import MtFormInputNumber2 from '@/components/form/MtFormInputNumber2.vue'
import customerUtils from '@/pages/master/customerPet/customerUtils'

const props = defineProps({ callBack: Function })
const emits = defineEmits(['close', 'change'])

const closeModal = () => {
  emits('close')
}

const search = ref({
  start_number: null,
  end_number: null
})
const count = ref(0)

const responseList = ref([])

const searchData = async () => {
  const response = await mtUtils.callApi(selectOptions.reqMethod.GET, `mst/search_available_code`, {
    start_number: search.value.start_number,
    end_number: search.value.end_number
  })
  if (response) {
    responseList.value = response
  }
}

async function addMore() {

  await customerUtils.addMoreCustomerCode()
  await customerUtils.getTotalAvailableCodeCount(count)
}

onMounted(async () => {
  await customerUtils.getTotalAvailableCodeCount(count)
})

</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      空き番号確認
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section class="row q-col-gutter-lg">
    <div class="col-lg-12 col-md-12 col-sm-12">
      <div class="grid">
        <MtFormInputNumber
          v-model:value="search.start_number"
          autofocus
          label="番号検索：Start"
          mode="dosage"
          outlined
          @update:value="(value)=> search.end_number = parseInt(value) + 100"
        />
        <span class="flex content-center justify-center">
           〜
        </span>
        <MtFormInputNumber2
          v-model:value="search.end_number"
          autofocus
          label="番号検索：End"
          mode="dosage"
          outlined
        />
        <q-btn class="q-ml-sm" color="grey-800"  text-color="white" unelevated @click="searchData">
          <q-icon name="search" size="20px" />
        </q-btn>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12 q-pt-md">
        <div v-if="responseList && responseList.length > 0">
          <q-chip v-for="(chip, index) in responseList" :key="index" :label="chip.id" clickable square @click="()=>{
         props.callBack(chip.id)
         closeModal()
       }" />
        </div>
        <div v-else class="row justify-between">
          <span>指定範囲に空き番号はありません。</span>
        </div>
      </div>
      <div class="col-lg-12 col-md-12 col-sm-12 q-pt-md row justify-between">
        <span> 空き診察券番号数 : {{ count }} </span>
        <q-btn class="q-ml-sm flex items-center" color="grey-800" size="sm" text-color="white" unelevated
               @click="addMore()">
          <span>利用可能番号の追加</span>
        </q-btn>
      </div>
    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn class="bg-grey-100 text-grey-800" outline @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style lang="scss" scoped>

.grid {
  display: grid;
  grid-template-columns: 42% 6% 42% 10%;
}

.grid-check {
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: 20px
}

</style>