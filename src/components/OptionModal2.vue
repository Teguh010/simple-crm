<script setup lang="ts">
import { nextTick, ref } from "vue";

const closeUpdDialogFlg = ref(false)
const props = defineProps<{
  modelTitle: '',
  options: {
    type: Array<{
      title: String,
      isShown: Boolean,
      isChanged: Boolean,
      attr: {
        class: any,
        clickable: Boolean
      }
    }>
  }
}>()

// this function help us to close then Modal
function close() {
  closeUpdDialogFlg.value = true
}

async function clickOptionSelected(option: any) {
  option.isChanged = true
  close()
}

</script>

<template>
  <div v-close-popup="closeUpdDialogFlg" class="">
    <div class="header-row row flex justify-between q-py-sm q-px-md items-center">
      <div>{{ modelTitle ? modelTitle : '操作' }}</div>
      <q-btn @click="close" flat round dense icon="close" />
    </div>
    <q-scroll-area :style="props.options.length > 6 ? {'height' : '318px'} : {'height' : `${53 * props.options.length}px`}">
      <q-list separator>
        <q-item v-for="(option, index) in props.options" :key="index" clickable @click="clickOptionSelected(option)" :class="index === 0 ? 'q-mt-xs' : ''" class="q-py-none cursor-pointer text-center" v-bind="option.attr">
          <q-item-section>
            {{option.title}}
          </q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </div>
</template>

<style scoped lang="scss">
.dialog-header {
  .heading {
    font-size: 14px;
    font-weight: 700;
  }

  .label {
    font-size: 12px;
    font-weight: 400;
    color: #868686;
  }
}

.header-row {
  background-color: #dddddd;
}
</style>