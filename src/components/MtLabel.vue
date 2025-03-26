<script setup lang="ts"></script>
<template>
  <q-chip
    square
    :ripple="false"
    color="accent-100"
    text-color="grey-800"
    size="15px"
    class="q-px-md q-mr-xs"
  >
    <slot></slot>
  </q-chip>
</template>
