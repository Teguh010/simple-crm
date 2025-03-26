<script setup lang="ts">
import {nextTick, ref} from 'vue'

const props = defineProps<{
  title?: string;
  message: string;
  time: any /** should be in milliseconds **/
  titleClass?: string;
}>();
const flgShow = ref(true)
let timeoutRef:any = null
const emits = defineEmits(['close'])

function init() {
  timeoutRef = setTimeout(close, props.time)
}

function close(){
  emits('close')
}

init()
</script>

<template>
  <div v-close-popup="flgShow">
    <q-card style="width: 400px; min-height: 100px" class="flex flex-center">
      <q-card-section v-if="props.title">
        <div  :class="props.titleClass">{{ props.title }}</div>
      </q-card-section>
      <q-card-section :class="props.title === null ? 'q-pt-md' : 'q-pt-none'" class="q-pt-none message">
        {{props.message}}
      </q-card-section>
    </q-card>
  </div>
</template>

<style lang="scss" scoped>
.message{
  white-space: pre-wrap;
}

.text-h6 {
  font-weight: normal;
  &.text-weight-bold {
    font-weight: bold;
  }
}
</style>
