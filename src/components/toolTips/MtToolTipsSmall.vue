<script setup lang="ts">
import { withDefaults } from 'vue'
import MtModalHeader from '@/components/MtModalHeader.vue'

const props = withDefaults(
  defineProps<{
    title: string
    content: string
  }>(),
  {
    title: 'Tooltip Title',
    content: ''
  }
)

const emits = defineEmits<{
  (e: 'close'): void
}>()

const closeModal = () => {
  emits('close')
}
</script>
<template>
  <div>
    <MtModalHeader @closeModal="closeModal">
      <q-toolbar-title class="text-grey-900 title2 bold">
        <span>
          {{ props.title }}
        </span>
      </q-toolbar-title>
    </MtModalHeader>
    <q-card-section class="row q-col-gutter-lg">
      <div class="col-12">
        <span v-html="props.content"></span>
      </div>
    </q-card-section>
    <q-card-section class="row">
      <div class="col-12 text-center">
        <q-btn color="primary" @click="closeModal">OK</q-btn>
      </div>
    </q-card-section>
  </div>
</template>

<style>
ul.normal-content > li, ul li ul > li {
  margin: 15px 0;
  line-height: 1.8; 
}
ul li.no-list-style  {
  list-style-type: none; /* 子リストのビュレットを非表示 */
  margin-left: 20px; /* インデントを残してリスト階層を示す */
}
.text-marker {
  background-color: rgb(223, 247, 119); /* マーカーの色 */
  padding: 0 4px; 
  border-radius: 3px; 
}

</style>