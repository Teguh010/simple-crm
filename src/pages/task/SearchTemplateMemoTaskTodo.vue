<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'
import aahMessages from '@/utils/aahMessages';
import mtUtils from '@/utils/mtUtils';
import useTextTemplateStore from "@/stores/text-template";
import { storeToRefs } from 'pinia';
import _ from 'lodash';

const props = defineProps({ 
    memoTask: {
        type: Object,
        default: {
            value: ''
        }    
    }
});
const emits = defineEmits(['close'])
const templateStore = useTextTemplateStore();
const { getTemplates } = storeToRefs(templateStore);

const insertSentence = async (content: String) => {
    let confirmMsg = 'このテンプレートを選択しますか?'
    await mtUtils.confirm(confirmMsg, '確認', 'はい').then((confirmation) => {
    if (confirmation) {
            props.memoTask.text = content
            mtUtils.autoCloseAlert(aahMessages.success)
            closeModal()
        }
    })
}
const closeModal = () => {
  emits('close')
}

onMounted(async () => {
  await templateStore.fetchTemplates()
})
</script>

<template>
    <MtModalHeader @closeModal="closeModal">
        <q-toolbar-title class="text-grey-900 title2 bold">
            タスク指示内容テンプレート
            <span class="title2 text-grey-500 regular q-ml-md">※マスタで設定できます</span>
        </q-toolbar-title>         
    </MtModalHeader>
    <q-card-section class="content q-px-xl">
        <div class="q-mb-lg" v-for="( template , i ) in _.sortBy(getTemplates, 'display_order', 'asc')" :key="i">
            <template v-if="template.type_text_template === 81">
                <div class="row q-mb-md q-pb-sm q-bb-dashed cursor-pointer" v-if="template.flg_title">
                    <div @click="insertSentence(template.memo_template)">{{template.memo_template}}</div>
                </div>
                <div class="row q-pb-sm q-bb-dashed" v-else>
                        <div class="col-2"></div>
                        <div class="col-8 sentence cursor-pointer" @click="insertSentence(template.memo_template)">{{ template.memo_template }}</div>    
                </div>
            </template>
        </div>
    </q-card-section>
</template>

<style lang="scss" scoped>
.sentence {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    -webkit-line-clamp: 3;
    height: auto;
    word-wrap: break-word;
    white-space: normal !important;
}
</style>