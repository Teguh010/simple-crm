<script setup lang="ts">
import MtModalHeader from '@/components/MtModalHeader.vue'

const emits = defineEmits(['close'])

const closeModal = () => emits('close')
</script>

<template>
  <MtModalHeader @closeModal="closeModal">
    <q-toolbar-title class="text-grey-900 title2 bold">
      声でカルテ®基本設定
    </q-toolbar-title>
  </MtModalHeader>
  <q-card-section>
    <div class="flex items-center justify-center q-px-lg">
      現在、「声でカルテ」β版はサービス提供時間外のためご利用いただけません。<br /><br />
      また、本サービスは以下の場合に予告なく利用不可となる場合があります。<br /><br />
      ・夜間・休日・祝日の時間帯 <br />
      ・メンテナンス作業の実施時（事前告知なしの場合あり）<br /><br />
      ご不便をおかけしますが、何卒ご理解いただきますようお願い申し上げます。
    </div>
  </q-card-section>
</template>
