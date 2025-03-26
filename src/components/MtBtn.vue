<script setup lang="ts">
import { reactive, ref } from "vue";

const props = withDefaults(defineProps<{
  label?: string;
  size?: string;
  class?: string;
  type?: string;
  style?: string;
  disable?: boolean;
  icon?: string;
  backgroundColor?: string;
  textColor?: string;
  tabindex: number;
}>(),{
  label: "",
  size: "",
  class: "",
  type: "button",
  style: "",
  disable: false,
  icon: "none",
  backgroundColor: "",
  textColor: "",
  tabindex: 0
})

const emit = defineEmits(['click', 'focus', 'blur'])

function focus(){
  emit('focus')
}

function blur(){
  emit('blur')
}

const btn = ref(null)
defineExpose({
  btn,
})

</script>

<template>
  <template v-if="props.icon == 'none'">
    <q-btn
      :label="props.label"
      :class="props.class"
      class="btn"
      :size="props.size"
      @click="emit('click')"
      :type="props.type"
      :style="props.style"
      :disable="props.disable"
      :color="props.backgroundColor"
      :text-color="props.textColor"
      ref="btn"
      @focus="focus"
      @blur="blur"
      :tabindex="props.tabindex"
    />
  </template>
  <template v-else>
    <q-btn
      :label="props.label"
      :class="props.class"
      class="btn"
      :size="props.size"
      @click="emit('click')"
      :type="props.type"
      :style="props.style"
      :disable="props.disable"
      :color="props.backgroundColor"
      :text-color="props.textColor"
      :icon="props.icon"
      ref="btn"
      @focus="focus"
      @blur="blur"
      :tabindex="props.tabindex"
    />
  </template>
</template>

<style scoped lang="scss">
@import "@/styles/quasar-variables.scss";

.btn {
  background-color: $btnBackgroundColor;
  color: $btnTextColor;
  font-weight: 600;
}

.hasBorder {
  border: 1px solid #DDDDDD;
}

</style>
