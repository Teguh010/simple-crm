<script lang="ts" setup>
import { computed, toRef, withDefaults } from 'vue'
import { colorPaletteList } from '@/utils/color-palette'
import { getCssVar } from 'quasar'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
  }>(),
  {
    label: '',
    modelValue: ''
  }
)

const value = toRef(props, 'modelValue')

const emits = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const handleClick = (value: string) => {
  return emits('update:modelValue', value)
}

const handleUpdate = (value: string) => {
  return emits('update:modelValue', value)
}
</script>
<template>
  <q-input
    v-model="value"
    :label="label"
    @update:model-value="handleUpdate"
    dense
  >
    <template #prepend>
      <q-icon size="25px" name="circle" :color="modelValue" :style="{ color: modelValue }" />
    </template>
    <template #append>
      <q-icon name="colorize" class="cursor-pointer" size="sm">
        <q-popup-proxy>
          <q-color v-model="value" @update:model-value="handleClick" />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
<style lang="scss" scoped>
.picker-content {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  height: 410px;
  width: 410px;
}
.active {
  border: 2px solid black;
}
</style>
