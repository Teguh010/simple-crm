<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'
import useCliCommonStore from '@/stores/cli-common'
import useCommonStore from '@/stores/common'
import useItemServiceUnitStore from '@/stores/item-service-units'
import useServiceDetailStore from '@/stores/service-details'
import aahMessages from '@/utils/aahMessages'
import { getDateToday } from '@/utils/aahUtils'
import { noAutoCorrect } from '@/utils/enum'
import mtUtils from '@/utils/mtUtils'
import { onMounted, ref, withDefaults } from 'vue'

const commonStore = useCommonStore()
const serviceDetailStore = useServiceDetailStore()
const cliCommonStore = useCliCommonStore()
const itemServiceUnitStore = useItemServiceUnitStore()
const selectedCommon = ref([])
const groupedIdexxList = ref([])

const props = withDefaults(
  defineProps<{
    id_service_detail: string
    is_item_service_unit: boolean
    default_idexx: Array<string> | null
    selected_idexx: Array<string> | null
    is_showing_no_auto_correct_btn: boolean
  }>(),
  {
    id_service_detail: '',
    is_item_service_unit: false,
    default_idexx: null,
    selected_idexx: null,
    is_showing_no_auto_correct_btn: false,
  }
)
const emits = defineEmits(['close'])
const closeModal = () => { emits('close') }
const handleToggleButton = (value: number) => {
    if (selectedCommon.value.includes(value)) {
      selectedCommon.value = selectedCommon.value.filter((id) => id !== value)
    } else {
      if (value == noAutoCorrect || selectedCommon.value.includes(noAutoCorrect)) selectedCommon.value = []

      selectedCommon.value.push(value)
    }
}
const submit = async () => {
  if (selectedCommon.value?.length > 0) {
    if (props.id_service_detail) {
      // Search Idexx Test From Service Detail
      serviceDetailStore.setSelectedIdexx(selectedCommon.value)
      const createIdexxData = {
        id_service_detail: props.id_service_detail,
        status: "CREATED",
        editable: true,
        test: selectedCommon.value,
        ivls: [{
          serialNumber: cliCommonStore.getCliCommonIVLS?.[0]?.code_func1 || '',
          displayName: null
        }]
      }
      const submit_idexx = await serviceDetailStore.submitServiceDetailIdexx(createIdexxData)
      serviceDetailStore.setIdexxProccessData(submit_idexx)
      if (submit_idexx?.uiURL) window.open(submit_idexx.uiURL, '_blank')
    } else if (props.is_item_service_unit) {
      // Search Idexx Test For Item Service Unit
      itemServiceUnitStore.setSelectedIdexx(selectedCommon.value)
    }

    mtUtils.autoCloseAlert(aahMessages.success)
    closeModal()
  }
}

onMounted(async () => {
  await Promise.all([
    commonStore.fetchPreparationCommonList({ code_common: [31] }, true)
  ])

  if (props.selected_idexx) selectedCommon.value = props.selected_idexx
  else if (props.default_idexx) {
    if (typeof(props.default_idexx) == 'string') selectedCommon.value = JSON.parse(props.default_idexx)
    else selectedCommon.value = props.default_idexx
  }

  const filteredIdexxList = commonStore.getCommonIdexxSearchList.filter((v) => v.date_end > getDateToday() && v.date_start < getDateToday())
  groupedIdexxList.value = filteredIdexxList.reduce((acc, item) => {
    if (!acc[item.memo_etc1]) {
      acc[item.memo_etc1] = []
    }
    if (item.code_func1 == 1) {
      acc[item.memo_etc1].push(item)
      acc[item.memo_etc1].sort((a, b) => a.display_order - b.display_order)
    }
    return acc;
  }, {})

  if (selectedCommon.value.length > 0) {
    if (!selectedCommon.value.includes(noAutoCorrect)) {
      let idexx_list = selectedCommon.value
      if (!Array.isArray(selectedCommon.value)) {
        idexx_list = JSON.parse(selectedCommon.value)
      }
      selectedCommon.value = idexx_list?.filter((v) => filteredIdexxList?.map((fil) => fil.code_func2).includes(v))
    }
    else if (!props.is_showing_no_auto_correct_btn && selectedCommon.value.includes(noAutoCorrect))
      selectedCommon.value = []
  }
})

</script>
<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title3 bold">
      IDEXX臨床検査
    </q-toolbar-title>
  </MtModalHeader>
  <q-form @submit="submit">
    <q-card-section class="content">
      <div v-if="props.is_showing_no_auto_correct_btn" class="flex justify-end">
        <q-btn
          :outline="!selectedCommon.includes(noAutoCorrect)"
          label="初期指定しない（オーダー時に自由選択）"
          @click="handleToggleButton(noAutoCorrect)"
          :style="{backgroundColor: selectedCommon.includes(noAutoCorrect) ? '#1d7afc' : '', color: selectedCommon.includes(noAutoCorrect) ? '#fff' : ''}"
          class="q-ma-sm"
        />
      </div>
      <template v-for="(idexxList, groupName) in groupedIdexxList">
        <div class="row q-mb-md">
          <div class="col-12">
            <div class="q-ml-md">{{ groupName }}</div>
            <div class="flex items-center">
              <template v-for="common in idexxList" :key="common.id_common">
                <q-btn
                  :outline="!selectedCommon.includes(common.code_func2)"
                  :label="common.name_common"
                  @click="handleToggleButton(common.code_func2)"
                  :style="{backgroundColor: selectedCommon.includes(common.code_func2) ? '#1d7afc' : '', color: selectedCommon.includes(common.code_func2) ? '#fff' : ''}"
                  class="q-ma-sm"
                />
              </template>
            </div>
          </div>
        </div>
      </template>
    </q-card-section>
    <q-card-section class="q-bt bg-white">
      <div class="text-center modal-btn">
        <q-btn outline class="bg-grey-100 text-grey-800" @click="closeModal()">
          <span>キャンセル</span>
        </q-btn>
        <q-btn unelevated color="primary" class="q-ml-md" type="submit">
          <span>{{ props.is_showing_no_auto_correct_btn ? '適用する' : 'IDEXX検査オーダーを作成' }}</span>
        </q-btn>
      </div>
    </q-card-section>
  </q-form>

</template>