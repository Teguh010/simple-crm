<script setup lang="ts">
const emit = defineEmits(['closeModal'])
const props = withDefaults(
  defineProps<{
    closeBtn?: boolean
  }>(),
  {
    closeBtn: true
  }
)

const closeModal = () => {
  emit('closeModal')
}
</script>
<template>
  <div class="flex q-bb q-py-none q-pl-lg q-pr-md items-center">
    <q-toolbar class="q-px-none">
      <slot />
      <template v-if="props.closeBtn">
        <q-btn flat round @click="closeModal">
          <q-icon size="xs" name="close" />
        </q-btn>
      </template>
    </q-toolbar>
  </div>
</template>

<style lang="scss" scoped>
// prevent hide toggle menu and close button on small screens
:deep(.q-toolbar) {
  @media screen and (max-width: 700px) {
    .adjust-overflow {
      max-width: calc(100vw - 160px) !important;
    }
  }
}
</style>
