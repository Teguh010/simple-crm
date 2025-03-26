<script setup lang="ts">
const props = defineProps({
  classItem: String,
  notSticky: Boolean,

  // This code ensures the exclusion of the 'fixed' class for pages updated to have the scroll bar under the header instead of beside it.
  // Removing the 'fixed' class here without the condition might cause issues with the header for older pages.
  noScroll: Boolean
})
</script>
<template>
  <div
    class="mt-header-padding bg-white"
    :class="[
      (notSticky ? 'fit' : 'full-width') +
        (notSticky ? '' : ' q-bb') +
        (noScroll ? '' : ' fixed')
    ]"
    style="top: 0"
    :style="notSticky ? 'z-index:0; margin-top:-45px;' : 'z-index:5'"
  >
    <div :class="classItem">
      <slot />
    </div>
  </div>
</template>
<style scoped lang="scss">
.mt-header-padding {
  padding: 4px 20px;
  & > div {
    margin-left: 24px;
  }
  @media only screen and (max-width: 600px) {
    padding: 4px 24px;
    & > div {
      margin-left: 0px;
    }
  }
}
</style>
