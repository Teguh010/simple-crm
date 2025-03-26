<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    statusChecked: boolean
    // New prop for custom class
    customClass: string
  }>(),
  {
    statusChecked: false,
    customClass: ''
  }
)
</script>
<template>
  <div
    v-if="props.statusChecked"
    class="row justify-center items-center bg-accent-200 q-mb-sm statusCircle"
    :class="customClass"
  >
    <img class="image" src="@/assets/img/task/checkIcon.png" alt="check icon" />
  </div>
  <div
    v-if="!props.statusChecked"
    class="row justify-center items-center bg-accent-050 q-mb-sm statusCircleLight"
    :class="customClass"
  >
    <svg
      class="image"
      width="36"
      height="36"
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_8207_16684)">
        <path
          d="M18.0874 3.59384C17.6969 3.20331 17.0637 3.2033 16.6732 3.59383L9.52996 10.737C9.13945 11.1275 8.5063 11.1276 8.11578 10.7371L3.87311 6.49468C3.48261 6.1042 2.8495 6.10419 2.45898 6.49465L1.11737 7.83605C0.726797 8.22657 0.726772 8.85977 1.11732 9.25032L6.06698 14.2L8.11572 16.2488C8.50627 16.6393 9.13948 16.6393 9.52999 16.2487L11.5784 14.2L19.429 6.34976C19.8196 5.95924 19.8196 5.32607 19.4291 4.93554L18.0874 3.59384Z"
          fill="#FFEFAA"
        />
      </g>
      <defs>
        <clipPath id="clip0_8207_16684">
          <rect
            width="19.726"
            height="19.726"
            fill="white"
            transform="translate(0.410156 0.0585938)"
          />
        </clipPath>
      </defs>
    </svg>
  </div>
</template>

<style scoped lang="scss">
.statusCircle {
  width: 65px;
  height: 65px;
  border-radius: 35px;
  border: 2px solid $accent-900;
  &.small {
    width: 35px;
    height: 35px;
  }
  :hover {
    cursor: pointer;
  }
}
.statusCircleLight {
  width: 65px;
  height: 65px;
  border-radius: 35px;
  border: 2px solid $accent-200;

  &.disable {
    border-color: $grey-400;
    background-color: $grey-100 !important;

    svg {
      fill: $grey-200;

      path {
        fill: $grey-200;
      }
    }
    :hover {
      cursor: not-allowed;
    }
  }
  &.small {
    width: 35px;
    height: 35px;
  }
  :hover {
    cursor: pointer;
  }
}
.image {
  width: 50%;
  height: 50%;
}
.statusCircle.small,
.statusCircleLight.small {
  width: 30px;
  height: 30px
}
</style>
