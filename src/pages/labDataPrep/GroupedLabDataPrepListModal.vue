<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue';
import MtTable2 from '@/components/MtTable2.vue'
import useLabResultStore from '@/stores/lab-results'
import mtUtils from '@/utils/mtUtils'
import useServiceDetailStore from '@/stores/service-details'
import { concatenate, formatDateWithTime } from '@/utils/aahUtils';
import useCommonStore from '@/stores/common';
import { LAB } from '../master/lab/types_lab';
import useLabStore from '@/stores/labs';
import useIllnessHistoryStore from '@/stores/illness-history';
import LabDataPrepServiceDetailSelectModal from './LabDataPrepServiceDetailSelectModal.vue';
import { ServiceDetailType } from '@/types/types';
import UpdateServiceDetailModal from '../request/serviceDetail/UpdateServiceDetailModal.vue';
import MtFormInputText from '@/components/form/MtFormInputText.vue';
import useCustomerStore from '@/stores/customers';
import { useRouter } from 'vue-router';
import { sortBy } from 'lodash';
import OptionModal from '@/components/OptionModal.vue'
import aahMessages from '@/utils/aahMessages'

const props = defineProps({grouped_data: Object, callback: Function})
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }
const router = useRouter()

const customerStore = useCustomerStore()
const labResultStore = useLabResultStore()
const serviceDetailStore = useServiceDetailStore()
const commonStore = useCommonStore()
const labStore = useLabStore()
const illnessHistoryStore = useIllnessHistoryStore()

const deviceList: any = ref([])
const deviceListDefault: any = reactive([])
const selected_service_detail = ref(null)
const grouped_lab_result_prep_list = ref([])
const showMenu = ref(false)

const data = ref({
  datetime_registered: null,
  id_pet: props.grouped_data?.id_pet,
  code_labgrpcat2: null,
  code_labgrpcat2_label: '',
  id_employee_registered: null,
  id_pet_illness_history: null,
  device: null,
  memo_alert: ''
})

const columns = [
  { name: 'name_lab', label: '検査項目', field: 'name_lab', align: 'center', style: 'width: 20%' },
  { name: 'val_result', label: '値', field: 'val_result', align: 'center', style: 'width: 10%' },
  { name: 'memo_alert', label: '警告', field: 'memo_alert', align: 'center', style: 'width: 35%' },
  { name: 'memo_lab', label: '　', field: 'memo_lab', align: 'center' },
]

const getCustomerName = (id_customer: number) => customerStore.getCustomerListOptions.find(item => item.value == id_customer)?.label
const getLab = (id_lab: number) => labStore.getAllLabs.find((v: LAB) => v.id_lab == id_lab)

const openServiceDetail = async (service_detail: ServiceDetailType) => {
  serviceDetailStore.setServiceDetail(service_detail)
  await mtUtils.mediumPopup(UpdateServiceDetailModal)
}
const openRequestDetail = async () => {
  const routeRQDetail = router.resolve({ name: 'RequestDetail', params: { id: selected_service_detail.value?.id_request }} )?.href
  window.open(routeRQDetail, '_blank')
}
const openMenu = async () => {
  let menuOptions = [
    {
      title: '削除する',
      name: 'delete',
      isChanged: false,
      attr: {
        class: null,
        clickable: true
      }
    }
  ]
  await mtUtils.littlePopup(OptionModal, { options: menuOptions })
  let selectedOption = menuOptions.find((i) => i.isChanged == true)
  if (selectedOption) {
    if (selectedOption.name == 'delete') {
      await mtUtils
        .confirm('本当に削除しますか？', '確認') //TODO: 共通化する必要あり
        .then(async (confirmation) => {
          if (confirmation) {
            let data = {
              lab_result_prep_list: grouped_lab_result_prep_list.value.map(lrp => lrp.id_lab_result_prep)
            }
            const res = await labResultStore.destroyBulkLabResultPrep(data)
            if(res){
              mtUtils.autoCloseAlert(aahMessages.success)
            }else{
              mtUtils.autoCloseAlert('操作に失敗しました')
            }
            closeModal()
            if(props.callback){
              props.callback()
            }
          }
        })
    }
  }
}
const removeItem = (index) => {
  const indexToRemove = grouped_lab_result_prep_list.value[index]
  if (indexToRemove !== -1) {
    grouped_lab_result_prep_list.value.splice(indexToRemove, 1);
  }
}
const removeSD = async () => {
  const confirmation = await mtUtils.confirm(
    '検査結果の結合を解除しますか?\n',
    '確認',
    'はい'
  )
  if (!confirmation) return

  if (selected_service_detail.value?.id_service_detail) {
    await labResultStore.revertBulkLabResultPrep({
      id_service_detail: selected_service_detail.value?.id_service_detail,
      id_lab_raw: props.grouped_data?.id_lab_raw,
    })
    selected_service_detail.value = null
    mtUtils.autoCloseAlert('検査結果の結合を解除しました')
    closeModal()
    props.callback()
  }
}

const submit = async () => {
  const data = {
    update_sd: true,
    id_service_detail: selected_service_detail.value?.id_service_detail,
    id_pet: selected_service_detail.value?.pet.id_pet,
    id_pet_illness_history: selected_service_detail.value?.id_pet_illness_history[0],
    type_lab_process: 1,
    id_lab_raw: props.grouped_data?.id_lab_raw,
    lab_result_prep: props.grouped_data?.lab_result_prep?.map((item: any) => {return item.id_lab_result_prep})
  }
  const updated_results = await labResultStore.updateLabResultsPrepBulk(data)
  props.grouped_data.lab_result_prep = updated_results.data
  mtUtils.autoCloseAlert('検査結果の値を更新しました')
  closeModal()
  props.callback()
}

const selectedServiceDetailNumber = computed(() => {
  return selected_service_detail.value ? selected_service_detail.value.number_service_detail + ' ' + selected_service_detail.value.name_item_service : ""
})

const selectedRequestNumber = computed(() => selected_service_detail.value?.number_request)

const openServiceDetailSelect = async (row)=>{
  await mtUtils.mediumPopup(LabDataPrepServiceDetailSelectModal, {
    row,
    callback: onServiceDetailSelect
  }) 
}

const onServiceDetailSelect = (selected_sd: Object)=>{
  selected_service_detail.value = selected_sd
}

const fillForType1 = async ()=>{
  if(props.grouped_data?.type_lab_process == 1){
    const id_service_detail = data.value?.id_service_detail
    if(id_service_detail){
      await serviceDetailStore.fetchServiceDetailById(id_service_detail)
      selected_service_detail.value = { ...serviceDetailStore.getServiceDetail }
    }
  }
}

onMounted(async () => {
  if(props.grouped_data?.type_lab_process == 2){
    showMenu.value = true
  }
  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [7] }, true),
    illnessHistoryStore.fetchIllnessHistorys({ id_pet: props.grouped_data?.id_pet })
  ])

  deviceListDefault.length = 0
  deviceList.value.length = 0
  
  commonStore.getCommonDeviceOptionList.map((item) => {
    const temObj = {
      label: concatenate(item.name_common, item.name_device),
      id_common:item.id_common,
    }

    deviceListDefault.push(temObj)
    deviceList.value.push(temObj)
  })

  grouped_lab_result_prep_list.value = labResultStore.getLabResultPrepList ? [...labResultStore.getLabResultPrepList] : []
  grouped_lab_result_prep_list.value = sortBy(grouped_lab_result_prep_list.value, 'display_order')

  data.value = props.grouped_data
  if (data.value.datetime_registered) data.value.datetime_registered = formatDateWithTime(data.value.datetime_registered)
  data.value.device = commonStore.getCommonDeviceOptionList.find((v) => v.id_common == props.grouped_data?.id_cm_device)
  await fillForType1()
})
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      検査結果
    </q-toolbar-title>
    <div class="flex items-center">
      <div v-if="selected_service_detail" @click.stop="openRequestDetail()" class="q-mr-xl cursor-pointer textBlue">
        {{ selectedRequestNumber }}
      </div>
      <div v-if="selected_service_detail" @click.stop="openServiceDetail(selected_service_detail)" class="q-mr-xl cursor-pointer textBlue">
        {{ selectedServiceDetailNumber }}
      </div>
      <div class="q-mr-lg flex items-center">
        <div class="q-mr-md" v-if="selected_service_detail">
          対象ペット
        </div>

        <div v-if="selected_service_detail?.pet" class="flex items-center">
          <div>
            {{ getCustomerName(selected_service_detail?.pet?.id_customer) }}
          </div>
          <div class="q-ml-md">
            {{ selected_service_detail?.pet?.name_pet }}
          </div>
        </div>
        <q-btn v-else outline class="bg-grey-100 text-grey-800" @click="openServiceDetailSelect(data)">
          <span>治療サービス明細の照会</span>
        </q-btn>
        <q-btn
          flat
          round
          v-if="showMenu" 
          @click="openMenu"
          class="q-ml-md"
        >
          <q-icon size="xs" name="more_horiz" />
        </q-btn>
      </div>
    </div>
  </MtModalHeader>
  <q-card-section class="content q-px-xl">
    <div class="q-py-lg q-px-lg">
      <div class="flex items-center justify-between bg-grey-300 q-px-md q-py-sm">
        <div class="flex">
          <div v-if="grouped_lab_result_prep_list?.[0]?.name_lab_group" class="q-mr-md">
            {{ grouped_lab_result_prep_list?.[0]?.name_lab_group }}
          </div>
          <div v-if="data.device">
            {{ data.device.label }}
          </div>
        </div>
        <MtFormInputText
          v-model="data.datetime_registered"
          disable
          label="検査日時"
          class="q-mr-md q-pa-none"
        />
      </div>
      <div id="groupedTableContainer">
        <MtTable2
          :columns="columns"
          :rows="grouped_lab_result_prep_list"
          :rowsBg="true"
          flat
          class="grouped-table"
          class-td="width-td"
          :style="{overflow: 'unset '}"
          no-data-message="登録がありません。"
          no-result-message="該当のデータが見つかりませんでした"
        >
          <template v-slot:row="{ row, index }">
            <td
              class="cursor-pointer items-center"
              v-for="col in columns"
              :class="row.is_deleted === true ? 'bg-yellow' : ''"
            >
              <div>
                <div v-if="col.field === 'name_lab'">
                  <div class="flex no-wrap full-width">
                    <div class="q-mr-md">
                      {{ row?.name_lab_en?.replace('%',' ') }}
                    </div>
                    <div>
                      {{ row?.name_lab_en == row?.name_lab ? '' : row?.name_lab }}
                    </div>
                  </div>
                </div>
                <div v-else-if="col.field === 'memo_alert'" class="text-left">
                  {{ row.memo_alert }}
                </div>
                <div v-else-if="col.field === 'val_result'" class="text-right">
                  {{ row.val_result }}
                  <!-- <MtFormDecimalNumber
                    v-model="row.val_result"
                    input-class="text-right"
                    :disable="true"
                  /> -->
                </div>
                <div v-else-if="col.field === 'memo_lab'" class="text-left regular">
                  {{ getLab(row?.id_lab)?.memo_lab ? getLab(row?.id_lab)?.memo_lab : '' }}
                </div>
              </div>
            </td>
          </template>
        </MtTable2>
        <div v-if="selected_service_detail" class="flex items-center justify-end q-mt-md">
          <q-btn outline class="bg-grey-100 text-grey-800" @click="removeSD()">
            <span class="text-darkred">
              <q-icon name="do_disturb" class="q-mr-xs" size="16px" /> 結合を解除する
            </span>
          </q-btn>
        </div>
      </div>

    </div>
  </q-card-section>
  <q-card-section class="q-bt bg-white">
    <div class="text-center modal-btn">
      <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
        <span>キャンセル</span>
      </q-btn>
      <q-btn unelevated color="primary" class="q-ml-md" @click="submit()">
        <span>保存</span>
      </q-btn>
    </div>
  </q-card-section>
</template>

<style scoped>

.textBlue{
  color: #0057FF;
  text-decoration: underline;
}
#groupedTableContainer{
  height: 100%;
  overflow-y: scroll;
}
.grouped-table th, .grouped-table td {
  padding: 0px 16px;
  height: 24px;
}
</style>