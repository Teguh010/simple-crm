<template>
  <div class="spinner"></div>
</template>
<style scoped lang="scss">
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid $white;
  border-top: 5px solid $light-blue;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
