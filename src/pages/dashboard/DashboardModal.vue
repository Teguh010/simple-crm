<template>
  <div class="row">
    <div class="col-12 col-sm-12 q-col-gutter-sm">
      <span>Testing modal</span>

      <MtInputForm
        type="text"
        v-model="data.text"
        label="Testing input"
        placeholder="This is placeholder"
        :rules="[(val: string) => !!val || 'エラーメッセージ']"
        required
      />
      <MtInputForm
        type="text"
        v-model="data.text2"
        label="Testing input"
        placeholder="This is placeholder"
        :rules="[(val: string) => !!val || 'エラーメッセージ']"
        required
      />
      <MtInputForm
        type="radio"
        v-model="data.radio"
        :items="radioSelection"
        label="Radio selection"
        required
      />
      <MtInputForm
        type="checkbox"
        v-model="data.checkbox"
        :items="radioSelection"
        label="Checkbox"
        required
      />
      <MtInputForm
        type="selection"
        v-model="data.selection"
        :items="selection"
        :multiple="false"
        label="Selection"
        required
        :rules="[(val: string) => !!val || 'エラーメッセージ']"
      />
      <MtInputForm
        type="text"
        v-model="data.text3"
        label="Testing input"
        placeholder="This is placeholder"
        :rules="[(val: string) => !!val || 'エラーメッセージ']"
        required
      />

    </div>
  </div>
</template>

<script lang="ts" setup>
import useModalStore from '@/stores/modal'
import { computed, defineComponent, ref } from 'vue'
import MtInputForm from '@/components/form/MtInputForm.vue'

const modal = useModalStore()
const closeModal = () => {
  modal.close()
}
const data = ref({
  text: '',
  text2: '',
  text3: '',
  radio: '',
  checkbox: '',
  selection: ''
})
const radioSelection = computed(() => {
  return [
    { name: "Select 1", value: 1 },
    { name: "Select 2", value: 2 }
  ]
})
const selection = computed(() => [
  'Selection one', 'Selection two'
])

defineComponent({
  name: 'DashboardModal'
})
</script>
