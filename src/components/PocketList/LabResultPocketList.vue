<script setup lang="ts">
import mtUtils from '@/utils/mtUtils'
import { dateFormat } from '@/utils/aahUtils'

import {event_bus} from "@/utils/eventBus";
import ViewLabResultModal from "@/components/lab/ViewLabResultModal.vue";


const props = defineProps({
  data: Object,
  request: Object,
  copyIcon: false,
  petSelected: Object,
  parentId: String
})

const emit = defineEmits(['initCall'])

const openLabResultDetailModal = async (item) => {
  await mtUtils.mediumPopup(ViewLabResultModal, {
    request: props.request,
    id_pet_illness_history: props.data?.[0].id_pet_illness_history,
  }, true)
  event_bus.emit('reloadRight', true)
}
</script>

<template>
  <div v-if="props.data" class="item_divier_item_service">
    <div @click="openLabResultDetailModal()" :style="{'width': '100%'}">
      <div class="flex q-pt-sm">
        <span class="body1 regular text-grey-900">
          {{
            props.data?.[0].category2_lab?.name_category
          }}
        </span>
        <div class="q-ml-md">
          {{ dateFormat(props.data?.[0].datetime_registered, 'YYYY/MM/DD') }}
        </div>
      </div>
    </div>
  </div>
  <p v-else class="q-pl-md text-grey-500">治療・サービスはありません</p>
</template>
<style lang="scss" scoped>
.item_divier_item_service {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  cursor: pointer;
  border-left: 5px solid #ffecb3;
  &:hover {
    background-color: rgba(255, 236, 179, 0.3);
  }
  &:active {
    background-color: rgba(255, 236, 179, 0.4);
  }
  &:focus {
    background-color: rgba(255, 236, 179, 0.5);
  }
  border-bottom: 1px dotted rgb(227 227 227);
  padding: 3px 6px 3px 16px;
}
</style>
