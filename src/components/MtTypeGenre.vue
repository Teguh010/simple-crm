<script setup lang="ts">
const props = defineProps<{
  type : string
}>()
</script>
<template>
  <!--TODO-->
  <div>
    <q-badge color="51BB41" text-color="white" label="薬" rounded class="custom-badge q-mr-xs" v-if="props.type == '30'" />
    <q-badge color="51BB41" text-color="white" label="薬" rounded class="custom-badge q-mr-xs" v-else-if="props.type == '30'" />
  </div>
</template>