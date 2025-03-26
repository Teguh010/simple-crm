<script setup>
import { useRouter } from 'vue-router'
// components
import MtModalHeader from '@/components/MtModalHeader.vue'
// utils
import { parseForlinks, dateFormat } from '@/utils/aahUtils';

const props = defineProps({ data: Object})
const emits = defineEmits(['close'])
const router = useRouter()

const closeModal = () => {
  emits('close')
}

const openRequestDetail = (id_request) => {
  const route = router.resolve({
    name: 'RequestDetail',
    params: { id: id_request }
  })
  window.open(route.href, '_blank')
}

const showHTMLDataV1 = (memoCarte) => {
  let tempHTML = '';
  if (memoCarte && memoCarte.datetime_insert) {
    // 作成日と更新日をフォーマット
    const createdDate = dateFormat(memoCarte.datetime_insert);
    const updatedDate = memoCarte.datetime_update ? dateFormat(memoCarte.datetime_update) : null;

    if (createdDate === updatedDate || !updatedDate) {
      // 更新日が存在しないか、作成日と同じなら作成日だけ表示
      tempHTML += `作成日: ${createdDate}<br/>`;
    } else {
      // 作成日と更新日が異なる場合、両方を表示
      tempHTML += `作成日: ${createdDate}<br/>更新日: ${updatedDate}<br/>`;
    }
  }
  if (memoCarte && memoCarte.memo_sbj) {
    tempHTML += (memoCarte.memo_obj || memoCarte.memo_ass || memoCarte.memo_other ? '<div class="label-memo-carte">S: 主観</div><br/>' : '') + memoCarte.memo_sbj + '<br/>'
  }

  if (memoCarte && memoCarte.memo_obj) {
    tempHTML += '<div class="label-memo-carte q-mt-md">O: 客観</div><br/>' + memoCarte.memo_obj + '<br/>'
  }

  if (memoCarte && memoCarte.memo_ass) {
    tempHTML += '<div class="label-memo-carte q-mt-md">A: 評価</div><br/>' + memoCarte.memo_ass + '<br/>'
  }

  if (memoCarte && memoCarte.memo_other && !(memoCarte.memo_sbj || memoCarte.memo_obj || memoCarte.memo_ass)) {
    tempHTML +=  '<div class="q-my-md">' + memoCarte.memo_other 
  } else {
    tempHTML += '<div class="label-memo-carte q-mt-md">P: 計画他</div><br/>' + memoCarte.memo_other
  }

  return parseForlinks(tempHTML)
}

</script>
<template>
  <MtModalHeader @close-modal="closeModal">
    <div class="row q-mr-auto">
      <q-toolbar-title class="text-grey-900 title2 bold q-pt-xs">
        メモカルテ
      </q-toolbar-title>
      <div class="flex items-center q-ml-lg" v-if="data">
        <template v-if="data.request">
          <q-btn
            flat
            dense
            class="body1 regular text-blue text-underline q-mr-sm"
            @click="openRequestDetail(data.request.id_request)"
          >
            {{ data.request?.number_request }}
          </q-btn>
        </template>
        <div class="body1 regular text-grey-900 q-mr-sm">
          {{data.customer.code_customer}} - {{data.customer.name_customer_display}}
        </div>
      </div>
    </div>
  </MtModalHeader>
  <q-card-section
    class="q-px-lg memo-screen memo-line1"
  >
    <div
      class="col-12 items-center justify-center q-col-gutter-md full-height"
    >
      <div
        class="q-mb-sm"
        v-html="showHTMLDataV1(data)"
      ></div>        
    </div>
  </q-card-section>
</template>
<style>
.label-memo-carte {
  font-size: 12px;
  background: rgb(219, 219, 219);
  padding: 3px 15px; 
  border-radius: 5px;
  display: inline-block;
  margin-bottom: 10px;
}
.memo-line1 {
  line-height: 2;
}

.memo-screen {
  max-height: calc(80vh);
  height: unset !important;
  overflow-y: auto;
}

@media screen and (max-width: 640px) {
  .memo-screen {
    max-height: calc(100vh - 300px);
  }
}
</style>

