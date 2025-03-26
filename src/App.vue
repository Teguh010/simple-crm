<template>
  <RouterView v-slot="{ Component }">
    <template v-if="Component">
      <component :is="Component"></component>
    </template>
  </RouterView>
</template>

<style lang="scss">
@import 'styles/app.scss';
@media only screen and (max-device-width: 1023px) and (-webkit min-device-pixel-ratio: 2) {
 /** Fix browser bar issue on iOS **/
 .app {
 max-height: -moz-available;
 max-height: -webkit-fill-available;
 max-height: fill-available;
 }
}
</style>
