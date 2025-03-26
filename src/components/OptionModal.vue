<script setup lang="ts">
import { ref } from 'vue'

const closeUpdDialogFlg = ref(false)
const props = defineProps<{
  modelTitle?: ''
  options: {
    title: string
    isChanged: boolean
    attr: {
      class: string
      clickable: boolean
    },
    showIcon: boolean
  }[]
}>()

// this function help us to close then Modal
function close() {
  closeUpdDialogFlg.value = true
}

async function optionSelected(option) {
  option.isChanged = true
  close()
}
</script>

<template>
  <div v-close-popup="closeUpdDialogFlg">
    <div
      class="header-row row flex justify-between q-py-sm q-px-md items-center"
    >
      <div>{{ modelTitle ? modelTitle : '操作' }}</div>
      <q-btn @click="close" flat round dense icon="close" />
    </div>
    <q-list separator class="option-modal-container">
      <q-item
        v-for="(option, index) in props.options"
        :key="index"
        clickable
        @click="optionSelected(option)"
        class="q-py-none cursor-pointer text-center"
        v-bind="option.attr"
        v-permission="option.name != 'edit' && option.name != 'delete'"
      >
        <q-item-section>
          <span>
            <q-icon
              v-if="option.showIcon"
              name="check_circle"
              class="text-positive q-mr-sm"
            />
            {{ option.title }}
          </span>
        </q-item-section>
      </q-item>
    </q-list>
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

.option-modal-container {
  max-height: 400px;
  overflow-y: scroll;
  @media screen and (max-height: 500px) {
    max-height: 250px;
  }
}
</style>
